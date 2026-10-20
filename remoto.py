"""IA do PC no celular: o app do celular (modo nuvem) usa os modelos deste PC.

O PC fica acessível pelo Tailscale com HTTPS de verdade (`tailscale serve`,
porta 8443, só pra aparelhos da sua rede Tailscale). O celular entra como mais
um provedor ("Kaizen do meu PC") e só enxerga duas rotas, protegidas por chave:

    GET  /api/remoto/modelos     → ["qwen3:4b · Este computador", ...]
    POST /api/remoto/conversar   → {modelo, mensagens, formato} → {resposta}

Pedido que chega pelo túnel (tem X-Forwarded-For / Tailscale-*) não acessa
mais nada do server.py: tarefas, backup e chaves de API continuam só no PC.
"""
import hmac
import json
import os
import re
import secrets
import shutil
import subprocess
import threading
import time

import estudos
import servidores

PORTA_HTTPS = 8443
SEPARADOR = " · "
ALFABETO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"   # o mesmo da sincronia: sem I, L, O, U
ROTAS_LIBERADAS = ("/api/remoto/modelos", "/api/remoto/conversar")

PORTA_LOCAL = 8000   # o server.py troca pela PORT


def _chave_nova():
    bruto = "".join(secrets.choice(ALFABETO) for _ in range(16))
    return "-".join(bruto[i:i + 4] for i in range(0, 16, 4))


def chave():
    atual = servidores._config("remoto_chave")
    if not atual:
        atual = _chave_nova()
        servidores._config("remoto_chave", atual)
    return atual


def trocar_chave():
    servidores._config("remoto_chave", _chave_nova())
    return chave()


def autorizado(cabecalho):
    """Authorization: Bearer XXXX-XXXX-XXXX-XXXX (aceita sem traço e minúscula)."""
    recebida = (cabecalho or "").removeprefix("Bearer ").replace("-", "").strip().upper()
    return bool(recebida) and hmac.compare_digest(recebida.encode(), chave().replace("-", "").encode())


def veio_pelo_tunel(cabecalhos):
    return any(c.lower() == "x-forwarded-for" or c.lower().startswith("tailscale-") for c in cabecalhos.keys())


# =========================================================
#   Modelos e conversa
# =========================================================

def modelos():
    """Todos os modelos online deste PC como "modelo · destino", o sugerido pros planos primeiro."""
    motores, padrao = estudos.motores_disponiveis()
    motores.sort(key=lambda m: m["id"] != padrao)
    return [f"{m['modelo']}{SEPARADOR}{m['servidor']}" for m in motores]


def conversar(rotulo, mensagens, formato=None):
    modelo, _, nome = str(rotulo or "").rpartition(SEPARADOR)
    destino = next((d for d in servidores.listar() if d["nome"] == nome), None)
    if not modelo or not destino:
        raise ValueError(f"Modelo \"{rotulo}\" não existe neste PC. Atualize a lista no celular.")
    if not isinstance(mensagens, list) or not mensagens:
        raise ValueError("Nenhuma mensagem enviada.")
    return servidores.conversar(destino["id"], modelo, mensagens, formato)


# =========================================================
#   Tailscale: tudo pela tela, um passo de cada vez
#   instalar → abrir → entrar → conectar → liberar → pronto
# =========================================================

PASTA_WINDOWS = r"C:\Program Files\Tailscale"
LINK_TAILSCALE = re.compile(r"https://login\.tailscale\.com/\S+")

# login, serve e instalação demoram (esperam a pessoa clicar num link): rodam soltos
_tarefa = {"nome": None, "processo": None, "link": None, "erro": None, "saida": ""}
_trava = threading.Lock()


def _no_windows():
    return os.name == "nt"


def _tailscale():
    padrao = os.path.join(PASTA_WINDOWS, "tailscale.exe")
    return shutil.which("tailscale") or (padrao if _no_windows() and os.path.exists(padrao) else None)


def _sem_janela():
    return getattr(subprocess, "CREATE_NO_WINDOW", 0)   # app de computador: nada de console piscando


def _rodar(*argumentos, timeout=20):
    programa = _tailscale()
    if not programa:
        raise FileNotFoundError
    return subprocess.run([programa, *argumentos], capture_output=True, text=True, encoding="utf-8",
                          errors="replace", timeout=timeout, creationflags=_sem_janela())


def _rodando(nome):
    processo = _tarefa["processo"]
    return _tarefa["nome"] == nome and processo is not None and processo.poll() is None


def _soltar(nome, comando, esperar=10):
    """Roda o comando em segundo plano e espera até ele acabar ou imprimir um link de login."""
    with _trava:
        if not _rodando(nome):
            if _tarefa["processo"] and _tarefa["processo"].poll() is None:
                _tarefa["processo"].kill()
            processo = subprocess.Popen(comando, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
                                        encoding="utf-8", errors="replace", creationflags=_sem_janela())
            _tarefa.update(nome=nome, processo=processo, link=None, erro=None, saida="")

            def ler():
                for linha in processo.stdout:
                    _tarefa["saida"] = (_tarefa["saida"] + linha)[-3000:]
                    achou = LINK_TAILSCALE.search(linha)
                    if achou and not _tarefa["link"]:
                        _tarefa["link"] = achou.group(0)
                if processo.wait() != 0 and _tarefa["processo"] is processo:
                    _tarefa["erro"] = _explicar(_tarefa["saida"])

            threading.Thread(target=ler, daemon=True).start()

    fim = time.time() + esperar
    while time.time() < fim and _rodando(nome) and not _tarefa["link"]:
        time.sleep(0.3)


def _explicar(saida):
    texto = saida.strip()
    if "denied" in texto.lower() or "permission" in texto.lower():
        return ("O Tailscale não deixou (falta permissão). No terminal, rode uma vez: "
                "sudo tailscale set --operator=$USER")
    linhas = [linha for linha in texto.splitlines() if linha.strip()]
    return (linhas[-1] if linhas else "O Tailscale não aceitou.")[:300]


def _erro_de(nome):
    return _tarefa["erro"] if _tarefa["nome"] == nome else None


def situacao():
    """{etapa, url, chave, link, trabalhando, erro, ...} — a tela mostra o passo da vez."""
    base = {"chave": chave(), "url": None, "link": None, "trabalhando": False, "erro": None}

    if not _tailscale():
        return {**base, "etapa": "instalar", "trabalhando": _rodando("instalar"), "erro": _erro_de("instalar"),
                "pode_instalar": _no_windows() and bool(shutil.which("winget"))}

    try:
        status = _rodar("status", "--json", timeout=8)
        dados = json.loads(status.stdout) if status.stdout.strip().startswith("{") else {}
    except (subprocess.SubprocessError, OSError, ValueError):
        dados = {}
    estado = dados.get("BackendState")

    if estado in (None, "NoState", "Starting"):
        return {**base, "etapa": "abrir", "trabalhando": estado == "Starting",
                "pode_abrir": _no_windows() and os.path.exists(os.path.join(PASTA_WINDOWS, "tailscale-ipn.exe"))}
    if estado in ("NeedsLogin", "NeedsMachineAuth"):
        return {**base, "etapa": "entrar", "trabalhando": _rodando("entrar"), "erro": _erro_de("entrar"),
                "link": dados.get("AuthURL") or (_tarefa["link"] if _tarefa["nome"] == "entrar" else None)}
    if estado != "Running":
        return {**base, "etapa": "conectar", "erro": _erro_de("conectar")}

    dns = ((dados.get("Self") or {}).get("DNSName") or "").rstrip(".")
    url = f"https://{dns}:{PORTA_HTTPS}"
    try:
        servindo = json.loads(_rodar("serve", "status", "--json").stdout or "{}")
    except (subprocess.SubprocessError, OSError, ValueError):
        servindo = {}
    manipuladores = (servindo.get("Web") or {}).get(f"{dns}:{PORTA_HTTPS}", {}).get("Handlers") or {}
    if (manipuladores.get("/") or {}).get("Proxy", "").rstrip("/").endswith(f":{PORTA_LOCAL}"):
        return {**base, "etapa": "pronto", "url": url}

    # o primeiro "serve" da rede pede pra ativar o HTTPS: imprime um link e fica esperando
    return {**base, "etapa": "liberar", "url": url, "trabalhando": _rodando("ligar"), "erro": _erro_de("ligar"),
            "link": _tarefa["link"] if _rodando("ligar") else None}


def acao(nome):
    """Executa o passo pedido pela tela e devolve a situação nova."""
    programa = _tailscale()

    if nome == "instalar":
        if not (_no_windows() and shutil.which("winget")):
            raise ValueError("Baixe e instale o Tailscale em tailscale.com/download e volte aqui.")
        # o Windows pede permissão de administrador uma vez
        _soltar("instalar", ["winget", "install", "--id", "Tailscale.Tailscale", "-e", "--silent",
                             "--accept-package-agreements", "--accept-source-agreements"], esperar=3)
    elif not programa:
        raise ValueError("Instale o Tailscale primeiro.")
    elif nome == "abrir":
        ipn = os.path.join(PASTA_WINDOWS, "tailscale-ipn.exe")
        if not (_no_windows() and os.path.exists(ipn)):
            raise ValueError("Ligue o Tailscale: no terminal, sudo systemctl start tailscaled")
        subprocess.Popen([ipn])
        fim = time.time() + 15
        while time.time() < fim and situacao()["etapa"] == "abrir":
            time.sleep(1)
    elif nome == "entrar":
        _soltar("entrar", [programa, "login"])
    elif nome == "conectar":
        resultado = _rodar("up", timeout=30)
        if resultado.returncode != 0:
            raise ValueError(_explicar(resultado.stdout + resultado.stderr))
    elif nome == "ligar":
        _soltar("ligar", [programa, "serve", "--bg", f"--https={PORTA_HTTPS}", f"http://127.0.0.1:{PORTA_LOCAL}"])
    elif nome == "desligar":
        _rodar("serve", f"--https={PORTA_HTTPS}", "off")
    else:
        raise ValueError("Ação desconhecida.")
    return situacao()
