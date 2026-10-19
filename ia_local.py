"""IA neste computador num clique: confere o que a pessoa tem, recomenda e instala.

1. Confere: o Ollama está instalado? Está rodando? Já tem modelo baixado?
2. Lê o hardware (memória, placa de vídeo, disco) e recomenda o maior modelo
   que roda bem nele — ou a nuvem, se nenhum rodar direito.
3. Com o "li e aceito", resolve tudo sozinho: baixa o Ollama (sem pedir senha
   de administrador: fica na pasta de dados do Kaizen e o próprio Kaizen liga
   e desliga), baixa o modelo e deixa "Este computador" como destino do chat.

Ollama já instalado no sistema é aproveitado: o Kaizen só liga se estiver
desligado, nunca baixa outro por cima.
"""
from pathlib import Path
import atexit
import json
import os
import platform
import shutil
import subprocess
import sys
import tarfile
import threading
import time
import urllib.error
import urllib.request
import zipfile

URL_OLLAMA = "http://127.0.0.1:11434"
PASTA = None                         # o server.py aponta pra <dados>/ollama
SEM_JANELA = 0x08000000 if sys.platform == "win32" else 0   # CREATE_NO_WINDOW

GB = 1024 ** 3

# Do mais fraco pro mais forte. "memoria" = quanto precisa livre pra rodar
# (modelo + contexto); "download" em bytes, como o ollama.com informa.
MODELOS = [
    {"nome": "qwen3:1.7b", "download": 1.4 * GB, "memoria": 3 * GB, "estrelas": 1,
     "resumo": "Básico: conversa simples. Planos de estudo saem fracos."},
    {"nome": "qwen3:4b", "download": 2.5 * GB, "memoria": 4.5 * GB, "estrelas": 2,
     "resumo": "Bom pra conversar; planos de estudo razoáveis."},
    {"nome": "qwen3:8b", "download": 5.2 * GB, "memoria": 7 * GB, "estrelas": 4,
     "resumo": "O recomendado pelo Kaizen: bons planos de estudo e boa conversa."},
    {"nome": "qwen3:14b", "download": 9.3 * GB, "memoria": 11 * GB, "estrelas": 5,
     "resumo": "O mais caprichado: raciocina melhor e escreve melhor."},
]
# Só no processador, o 14b leva minutos por resposta: não entra na conta.
MAIOR_SEM_PLACA = "qwen3:8b"

LICENCAS = [
    {"nome": "Ollama", "licenca": "Licença MIT", "url": "https://github.com/ollama/ollama/blob/main/LICENSE"},
    {"nome": "Qwen3", "licenca": "Licença Apache 2.0 (Alibaba)", "url": "https://ollama.com/library/qwen3"},
]

_trava = threading.Lock()
_processo = None                     # o "ollama serve" que o Kaizen ligou
_progresso = {"ativo": False, "etapa": None, "texto": "", "feito": 0, "total": 0,
              "erro": None, "concluido": False, "modelo": None}


# =========================================================
#  Hardware
# =========================================================

def _rodar(comando, timeout=6):
    try:
        return subprocess.run(comando, capture_output=True, text=True, timeout=timeout,
                              creationflags=SEM_JANELA).stdout
    except (OSError, subprocess.SubprocessError):
        return ""


def _memoria_total():
    if sys.platform.startswith("linux"):
        for linha in Path("/proc/meminfo").read_text().splitlines():
            if linha.startswith("MemTotal:"):
                return int(linha.split()[1]) * 1024
    if sys.platform == "darwin":
        return int(_rodar(["sysctl", "-n", "hw.memsize"]).strip() or 0)
    if sys.platform == "win32":
        import ctypes

        class Estado(ctypes.Structure):
            _fields_ = [("dwLength", ctypes.c_ulong), ("dwMemoryLoad", ctypes.c_ulong),
                        ("ullTotalPhys", ctypes.c_ulonglong), ("ullAvailPhys", ctypes.c_ulonglong),
                        ("ullTotalPageFile", ctypes.c_ulonglong), ("ullAvailPageFile", ctypes.c_ulonglong),
                        ("ullTotalVirtual", ctypes.c_ulonglong), ("ullAvailVirtual", ctypes.c_ulonglong),
                        ("ullAvailExtendedVirtual", ctypes.c_ulonglong)]
        estado = Estado()
        estado.dwLength = ctypes.sizeof(Estado)
        ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(estado))
        return estado.ullTotalPhys
    return 0


def _placa_de_video():
    """{nome, memoria, acelera}. Acelera = o Ollama vai usar ela de fato."""
    saida = _rodar(["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader,nounits"])
    if saida.strip():
        nome, _, mib = saida.strip().splitlines()[0].rpartition(",")
        return {"nome": nome.strip(), "memoria": int(float(mib)) * 1024 * 1024, "acelera": True}

    if sys.platform == "darwin" and platform.machine() == "arm64":
        chip = _rodar(["sysctl", "-n", "machdep.cpu.brand_string"]).strip() or "Apple Silicon"
        # memória unificada: a placa usa a RAM do sistema
        return {"nome": chip, "memoria": int(_memoria_total() * 0.65), "acelera": True}

    # AMD/Intel: o pacote padrão do Ollama roda no processador nesses casos.
    nome = None
    if sys.platform.startswith("linux"):
        for linha in _rodar(["lspci"]).splitlines():
            if "VGA" in linha or "3D controller" in linha:
                nome = linha.split(": ", 1)[-1]
                break
    elif sys.platform == "win32":
        saida = _rodar(["powershell", "-NoProfile", "-Command",
                        "(Get-CimInstance Win32_VideoController | Select-Object -First 1).Name"])
        nome = saida.strip() or None
    return {"nome": nome, "memoria": 0, "acelera": False}


def hardware():
    disco = shutil.disk_usage(PASTA.parent if PASTA else Path.home())
    return {
        "sistema": {"linux": "Linux", "win32": "Windows", "darwin": "Mac"}.get(sys.platform, sys.platform),
        "memoria": _memoria_total(),
        "processador": os.cpu_count() or 1,
        "placa": _placa_de_video(),
        "disco_livre": disco.free,
    }


# =========================================================
#  Recomendação
# =========================================================

def _velocidade(modelo, hw):
    if hw["placa"]["acelera"] and modelo["memoria"] <= hw["placa"]["memoria"]:
        return "rápido"
    return {"qwen3:1.7b": "ok", "qwen3:4b": "devagar"}.get(modelo["nome"], "bem devagar")


def recomendar(hw):
    """(recomendado | None, opções). None = nenhum roda bem: melhor a nuvem."""
    placa = hw["placa"]
    if placa["acelera"]:
        orcamento = placa["memoria"]
        cabe = [m for m in MODELOS if m["memoria"] <= orcamento]
    else:
        orcamento = hw["memoria"] * 0.5      # o resto é do sistema e dos outros programas
        limite = next(i for i, m in enumerate(MODELOS) if m["nome"] == MAIOR_SEM_PLACA)
        cabe = [m for m in MODELOS[:limite + 1] if m["memoria"] <= orcamento]

    opcoes = []
    for m in MODELOS:
        roda = m in cabe or m["memoria"] <= hw["memoria"] * 0.7
        opcoes.append({**m, "roda": roda, "velocidade": _velocidade(m, hw) if roda else None})

    if not cabe:
        return None, opcoes
    # Só no processador, abaixo de 8 GB de RAM a experiência é ruim mesmo com o menor.
    if not placa["acelera"] and hw["memoria"] < 8 * GB:
        return None, opcoes
    escolhido = cabe[-1]["nome"]
    return next(o for o in opcoes if o["nome"] == escolhido), opcoes


def _potencia(hw):
    """Uma frase sobre o computador, do jeito que a pessoa entende."""
    placa = hw["placa"]
    if placa["acelera"] and placa["memoria"] >= 10 * GB:
        return 5, "Muito bom pra IA: a placa de vídeo roda até os modelos maiores com folga."
    if placa["acelera"] and placa["memoria"] >= 6 * GB:
        return 4, "Bom pra IA: a placa de vídeo roda os modelos médios rápido."
    if placa["acelera"]:
        return 3, "Razoável: a placa de vídeo ajuda, mas só com modelos pequenos."
    if hw["memoria"] >= 16 * GB:
        return 2, "Sem placa de vídeo compatível: roda no processador, funciona mas é devagar."
    return 1, "Fraco pra IA local: vai ficar lento. A IA na nuvem (grátis) funciona melhor aqui."


# =========================================================
#  Ollama: onde está e se está rodando
# =========================================================

def _nome_exe():
    return "ollama.exe" if sys.platform == "win32" else "ollama"


def _ollama_gerenciado():
    if not PASTA or not PASTA.exists():
        return None
    return next((p for p in PASTA.rglob(_nome_exe()) if p.is_file()), None)


def _ollama_do_sistema():
    candidatos = [shutil.which("ollama")]
    if sys.platform == "win32":
        candidatos.append(Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Ollama" / "ollama.exe")
    elif sys.platform == "darwin":
        candidatos += ["/Applications/Ollama.app/Contents/Resources/ollama", "/usr/local/bin/ollama"]
    return next((Path(c) for c in candidatos if c and Path(c).is_file()), None)


def _api(caminho, corpo=None, timeout=3):
    dados = json.dumps(corpo).encode() if corpo is not None else None
    req = urllib.request.Request(URL_OLLAMA + caminho, data=dados,
                                 headers={"Content-Type": "application/json"} if dados else {})
    with urllib.request.urlopen(req, timeout=timeout) as resposta:
        return json.loads(resposta.read() or b"{}")


def rodando():
    try:
        _api("/api/version")
        return True
    except (OSError, ValueError):
        return False


def modelos_instalados():
    try:
        return sorted(m["name"] for m in _api("/api/tags").get("models", []))
    except (OSError, ValueError, KeyError):
        return []


def ligar(esperar=20):
    """Liga o Ollama (do sistema ou o baixado pelo Kaizen) se estiver desligado."""
    global _processo
    if rodando():
        return True
    exe = _ollama_do_sistema() or _ollama_gerenciado()
    if not exe:
        return False
    with _trava:
        if _processo is None or _processo.poll() is not None:
            _processo = subprocess.Popen(
                [str(exe), "serve"], stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL, creationflags=SEM_JANELA,
                env={**os.environ, "OLLAMA_HOST": "127.0.0.1:11434"})
            atexit.register(encerrar)    # Ctrl+C no modo navegador também desliga
    limite = time.time() + esperar
    while time.time() < limite:
        if rodando():
            return True
        time.sleep(0.4)
    return False


def encerrar():
    """Desliga só o Ollama que o Kaizen ligou (o do sistema, ligado por outro, fica)."""
    if _processo and _processo.poll() is None:
        _processo.terminate()
        try:
            _processo.wait(timeout=5)
        except subprocess.TimeoutExpired:
            _processo.kill()


def situacao():
    import servidores
    hw = hardware()
    recomendado, opcoes = recomendar(hw)
    estrelas, frase = _potencia(hw)
    no_ar = rodando()
    instalados = modelos_instalados() if no_ar else []
    sistema, gerenciado = _ollama_do_sistema(), _ollama_gerenciado()
    return {
        "hardware": hw,
        "potencia": {"estrelas": estrelas, "frase": frase},
        "ollama": {"instalado": bool(sistema or gerenciado), "rodando": no_ar,
                   "origem": "sistema" if sistema else ("kaizen" if gerenciado else None)},
        "modelos_instalados": instalados,
        "recomendado": recomendado["nome"] if recomendado else None,
        "opcoes": opcoes,
        "pronto": no_ar and bool(instalados),
        "usa_local": servidores.preferido() == "local",   # o chat usa a IA daqui (e não a nuvem)
        "download_ollama": 0 if (sistema or gerenciado) else _tamanho_pacote(),
        "licencas": LICENCAS,
        "instalacao": dict(_progresso),
    }


# =========================================================
#  Instalação
# =========================================================

def _pacote():
    """(url, formato) do Ollama pra este sistema — a versão portátil, sem instalador."""
    base = "https://ollama.com/download/"
    maquina = platform.machine().lower()
    if sys.platform == "win32":
        return base + "ollama-windows-amd64.zip", "zip"
    if sys.platform == "darwin":
        return base + "ollama-darwin.tgz", "tgz"
    arq = "arm64" if maquina in ("aarch64", "arm64") else "amd64"
    return base + f"ollama-linux-{arq}.tar.zst", "zst"


def _tamanho_pacote():
    """Aproximado (o ollama.com informa ao baixar); perguntar a cada tela atrasaria tudo."""
    return 0.2 * GB if sys.platform == "darwin" else 1.4 * GB


def _etapa(etapa, texto, feito=0, total=0):
    _progresso.update(etapa=etapa, texto=texto, feito=feito, total=total)


def _baixar_ollama():
    url, formato = _pacote()
    PASTA.mkdir(parents=True, exist_ok=True)
    arquivo = PASTA / ("pacote." + formato)
    with urllib.request.urlopen(url, timeout=30) as resposta, open(arquivo, "wb") as saida:
        total = int(resposta.headers.get("Content-Length") or 0)
        feito = 0
        while bloco := resposta.read(1024 * 1024):
            saida.write(bloco)
            feito += len(bloco)
            _etapa("ollama", "Baixando o Ollama (o motor que roda a IA)…", feito, total)

    _etapa("extrair", "Preparando o Ollama…")
    destino = PASTA / "app"
    shutil.rmtree(destino, ignore_errors=True)
    if formato == "zip":
        with zipfile.ZipFile(arquivo) as pacote:
            pacote.extractall(destino)
    else:
        with tarfile.open(arquivo, "r:zst" if formato == "zst" else "r:gz") as pacote:
            pacote.extractall(destino, filter="data")
    arquivo.unlink(missing_ok=True)
    exe = _ollama_gerenciado()
    if not exe:
        raise RuntimeError("o pacote do Ollama veio sem o executável")
    exe.chmod(0o755)


def _baixar_modelo(modelo):
    """POST /api/pull em streaming: cada camada informa total e completado."""
    req = urllib.request.Request(URL_OLLAMA + "/api/pull", data=json.dumps({"model": modelo}).encode(),
                                 headers={"Content-Type": "application/json"})
    camadas = {}
    with urllib.request.urlopen(req, timeout=60) as resposta:
        for linha in resposta:
            if not linha.strip():
                continue
            evento = json.loads(linha)
            if evento.get("error"):
                raise RuntimeError(evento["error"])
            if evento.get("digest") and evento.get("total"):
                camadas[evento["digest"]] = (evento.get("completed", 0), evento["total"])
            feito = sum(c for c, _ in camadas.values())
            total = sum(t for _, t in camadas.values())
            _etapa("modelo", f"Baixando o modelo {modelo}…", feito, total)
            if evento.get("status") == "success":
                return
    raise RuntimeError("o download do modelo terminou sem confirmação")


def _instalar(modelo):
    import servidores
    try:
        if not _ollama_do_sistema() and not _ollama_gerenciado():
            _baixar_ollama()
        _etapa("ligar", "Ligando o Ollama…")
        if not ligar():
            raise RuntimeError("o Ollama não respondeu depois de ligar")
        if modelo not in modelos_instalados():
            _baixar_modelo(modelo)
        servidores.definir_preferido("local")
        servidores._status_cache.clear()
        _etapa("pronto", "Pronto! A IA já roda neste computador.")
        _progresso.update(concluido=True)
    except (OSError, ValueError, RuntimeError, tarfile.TarError, zipfile.BadZipFile) as erro:
        _progresso.update(erro=_explicar(erro))
    finally:
        _progresso.update(ativo=False)


def _explicar(erro):
    texto = str(erro)
    if isinstance(erro, urllib.error.URLError) or "timed out" in texto or "Name or service" in texto:
        return "Sem conexão com a internet (ou o site está bloqueado nesta rede). Tente de novo em outra rede."
    if isinstance(erro, OSError) and getattr(erro, "errno", None) == 28:
        return "O disco encheu durante o download. Libere espaço e tente de novo."
    return f"Não deu certo: {texto}"


def instalar(modelo, aceito):
    if not aceito:
        raise ValueError("É preciso aceitar os termos antes de instalar.")
    opcao = next((m for m in MODELOS if m["nome"] == modelo), None)
    if not opcao:
        raise ValueError("Modelo desconhecido.")
    if _progresso["ativo"]:
        raise ValueError("Já tem uma instalação em andamento.")

    precisa = opcao["download"] + (0 if (_ollama_do_sistema() or _ollama_gerenciado()) else 3 * GB)
    livre = shutil.disk_usage(PASTA.parent).free
    if livre < precisa + GB:
        raise ValueError(f"Falta espaço no disco: precisa de {precisa / GB:.1f} GB livres "
                         f"e tem {livre / GB:.1f} GB.")

    _progresso.update(ativo=True, erro=None, concluido=False, modelo=modelo, etapa="inicio",
                      texto="Começando…", feito=0, total=0)
    threading.Thread(target=_instalar, args=(modelo,), daemon=True).start()
    return dict(_progresso)


def progresso():
    return dict(_progresso)
