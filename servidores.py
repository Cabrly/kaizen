"""Onde a IA roda: servidores Ollama e contas na nuvem (ChatGPT, Gemini).

- "Este computador" (OLLAMA_URL) sempre existe.
- Dá pra cadastrar outros servidores Ollama — uma máquina mais forte em
  casa, ou um servidor alcançado pelo Tailscale (http://100.80.57.121:11434).
- Dá pra conectar uma conta da OpenAI (ChatGPT) ou do Google (Gemini) com
  uma chave de API. A chave fica só no banco local.
- Claude Code, Gemini CLI e Codex instalados no computador aparecem sozinhos
  (tipo "agente", ver agentes.py) e usam o login da própria ferramenta.

Um deles é o "preferido" (o chat usa esse); o plano de estudo pode usar
um modelo de qualquer destino. Tudo passa por conversar().

Ollama não tem senha: quem for liberar o seu pra outras máquinas deve
deixá-lo visível só numa rede privada (Tailscale, VPN), nunca na internet.
"""
from concurrent.futures import ThreadPoolExecutor
import base64
import hashlib
import json
import re
import secrets
import sqlite3
import time
import urllib.error
import urllib.parse
import urllib.request

import agentes

DB = None
URL_LOCAL = "http://127.0.0.1:11434"   # o server.py troca pelo OLLAMA_URL

_status_cache = {}                      # chave -> (quando, status)
CACHE_SEGUNDOS = 10
CACHE_NUVEM = 600                       # lista de modelos da nuvem muda pouco

# os grátis primeiro: é assim que aparecem na tela
NUVEM = {
    "gemini": {
        "nome": "Gemini (Google)",
        "host": "generativelanguage.googleapis.com",
        "onde_pegar": "https://aistudio.google.com/apikey",
    },
    "openrouter": {
        "nome": "OpenRouter (modelos grátis)",
        "host": "openrouter.ai",
        "onde_pegar": "https://openrouter.ai/keys",
    },
    "claude": {
        "nome": "Claude (Anthropic)",
        "host": "api.anthropic.com",
        "onde_pegar": "https://platform.claude.com/settings/keys",
    },
    "openai": {
        "nome": "ChatGPT (OpenAI)",
        "host": "api.openai.com",
        "onde_pegar": "https://platform.openai.com/api-keys",
    },
    # qualquer API no formato da OpenAI: OpenRouter, Groq, DeepSeek, LM Studio…
    "compat": {
        "nome": "Compatível com OpenAI",
        "host": None,
        "onde_pegar": "https://openrouter.ai/keys",
        "pede_url": True,
    },
}


class ErroConexao(Exception):
    """Não deu pra falar com o destino (fora do ar, sem rede, chave errada)."""

    def __init__(self, mensagem, status=None, espera=None, sem_cota=False):
        super().__init__(mensagem)
        self.status = status        # HTTP
        self.espera = espera        # segundos que o serviço pediu pra esperar (429)
        self.sem_cota = sem_cota    # 429 porque o modelo não tem cota no plano (grátis)


def _ler_limite(detalhe):
    """O 429 do Gemini diz o motivo: RetryInfo (quanto esperar) e QuotaFailure
    (qual cota). Cota 0 / "limit: 0" = o modelo não tem uso gratuito."""
    itens = detalhe.get("details") or [] if isinstance(detalhe, dict) else []
    atraso = next((d.get("retryDelay") for d in itens if str(d.get("@type", "")).endswith("RetryInfo")), None)
    cotas = [v for d in itens if str(d.get("@type", "")).endswith("QuotaFailure") for v in d.get("violations", [])]
    mensagem = detalhe.get("message", "") if isinstance(detalhe, dict) else ""
    return {
        "espera": float(re.sub(r"[^\d.]", "", atraso) or 0) if atraso else None,
        "sem_cota": bool(re.search(r"limit:\s*0\b", mensagem)) or any(str(v.get("quotaValue")) == "0" for v in cotas),
    }


def conectar():
    con = sqlite3.connect(DB, timeout=10)
    con.row_factory = sqlite3.Row
    return con


def init():
    with conectar() as con:
        con.executescript("""
            CREATE TABLE IF NOT EXISTS servidores_ia (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                nome      TEXT NOT NULL,
                url       TEXT NOT NULL UNIQUE,
                criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            );
            CREATE TABLE IF NOT EXISTS config (
                chave TEXT PRIMARY KEY,
                valor TEXT
            );
        """)


def _config(chave, valor=..., apagar=False):
    with conectar() as con:
        if apagar:
            con.execute("DELETE FROM config WHERE chave = ?", (chave,))
        elif valor is not ...:
            con.execute("INSERT INTO config (chave, valor) VALUES (?, ?) "
                        "ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor", (chave, valor))
        else:
            linha = con.execute("SELECT valor FROM config WHERE chave = ?", (chave,)).fetchone()
            return linha["valor"] if linha else None


def normalizar_url(url):
    """Aceita "100.80.57.121", "minha-maquina:11434", "http://x/api/tags"…"""
    url = (url or "").strip().rstrip("/")
    if not url:
        raise ValueError("Informe o endereço do servidor.")
    if not re.match(r"^https?://", url):
        url = "http://" + url
    partes = urllib.parse.urlparse(url)
    if not partes.hostname:
        raise ValueError("Endereço inválido.")
    # https sem porta = atrás de um proxy (ex.: tailscale serve), então 443
    porta = partes.port or (443 if partes.scheme == "https" else 11434)
    return f"{partes.scheme}://{partes.hostname}:{porta}"


def _http(url, corpo=None, cabecalhos=None, timeout=20):
    """GET/POST JSON. Erro HTTP vira ErroConexao com a mensagem do serviço."""
    dados = json.dumps(corpo).encode() if corpo is not None else None
    req = urllib.request.Request(url, dados, {"Content-Type": "application/json", **(cabecalhos or {})})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as erro:
        try:
            detalhe = json.loads(erro.read()).get("error", {})
            mensagem = detalhe.get("message") if isinstance(detalhe, dict) else str(detalhe)
        except (ValueError, AttributeError):
            detalhe, mensagem = {}, ""
        extras = _ler_limite(detalhe) if erro.code == 429 else {}
        raise ErroConexao(f"{erro.code}: {mensagem or erro.reason}", status=erro.code, **extras)
    except (urllib.error.URLError, OSError, ValueError) as erro:
        raise ErroConexao(str(erro))


# =========================================================
#   Contas na nuvem (chave de API)
# =========================================================

def chave(provedor):
    return _config(f"chave_{provedor}")


def conectado(provedor):
    return bool(_config(f"url_{provedor}") if NUVEM[provedor].get("pede_url") else chave(provedor))


def _url_compat():
    return (_config("url_compat") or "").rstrip("/")


# modelos que aceitam fallbacks: "default" — se o Claude recusar por
# segurança, a API refaz o pedido em outro modelo em vez de devolver a recusa
CLAUDE_COM_FALLBACK = ("claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5")


def _cabecalhos(provedor, chave_api):
    if provedor == "claude":
        return {"x-api-key": chave_api, "anthropic-version": "2023-06-01"}
    if provedor == "gemini":
        return {"x-goog-api-key": chave_api}
    return {"Authorization": f"Bearer {chave_api}"} if chave_api else {}


def _modelos_nuvem(provedor, chave_api, url=None):
    """Só modelos de conversa, os mais novos primeiro (a lista crua tem dezenas)."""
    if provedor == "compat":
        dados = _http(f"{(url or _url_compat())}/models", cabecalhos=_cabecalhos(provedor, chave_api))
        return sorted(m["id"] for m in dados.get("data", []))[:40]

    if provedor == "openrouter":
        # a lista de modelos deles é pública: valida a chave à parte
        _http("https://openrouter.ai/api/v1/key", cabecalhos=_cabecalhos(provedor, chave_api))
        dados = _http("https://openrouter.ai/api/v1/models")
        fora = ("lyria", "content-safety", "guard", "moderation")
        # só os grátis; "openrouter/free" escolhe sozinho um grátis disponível
        gratis = [m["id"] for m in dados.get("data", [])
                  if (m["id"].endswith(":free") or m["id"] == "openrouter/free") and not any(f in m["id"] for f in fora)]
        return sorted(gratis, key=lambda m: (m != "openrouter/free", m))[:20]

    if provedor == "claude":
        # a API já devolve os mais novos primeiro
        dados = _http("https://api.anthropic.com/v1/models?limit=100", cabecalhos=_cabecalhos(provedor, chave_api))
        return [m["id"] for m in dados.get("data", []) if m["id"].startswith("claude-")][:12]

    if provedor == "openai":
        dados = _http("https://api.openai.com/v1/models", cabecalhos=_cabecalhos(provedor, chave_api))
        fora = ("audio", "realtime", "transcribe", "tts", "image", "search", "embedding",
                "moderation", "instruct", "codex", "dall", "whisper", "babbage", "davinci")
        modelos = [m for m in dados.get("data", [])
                   if re.match(r"^(gpt-|o\d)", m["id"]) and not any(f in m["id"] for f in fora)]
        modelos.sort(key=lambda m: m.get("created", 0), reverse=True)
        return [m["id"] for m in modelos[:8]]

    dados = _http("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200",
                  cabecalhos=_cabecalhos(provedor, chave_api))
    fora = ("embedding", "image", "imagen", "banana", "veo", "tts", "live", "audio", "robotics", "computer", "vision", "aqa")
    nomes = [m["name"].removeprefix("models/") for m in dados.get("models", [])
             if "generateContent" in m.get("supportedGenerationMethods", [])
             and "gemini" in m["name"] and not any(f in m["name"] for f in fora)]
    return sorted(nomes, reverse=True)[:8]


def conectar_nuvem(provedor, chave_api, url=None):
    if provedor not in NUVEM:
        raise ValueError("Provedor desconhecido.")
    chave_api = (chave_api or "").strip()
    if NUVEM[provedor].get("pede_url"):
        url = (url or "").strip().rstrip("/")
        if not re.match(r"^https?://", url):
            raise ValueError("Informe a URL da API (ex.: https://openrouter.ai/api/v1).")
    elif len(chave_api) < 20:
        raise ValueError("Cole a chave de API completa.")
    try:
        modelos = _modelos_nuvem(provedor, chave_api, url)
    except ErroConexao as erro:
        raise ValueError(f"Não funcionou ({erro}). Confira a chave{' e a URL' if url else ''}.")
    if not modelos:
        raise ValueError("Conectou, mas a conta não tem nenhum modelo de conversa liberado.")
    _config(f"chave_{provedor}", chave_api)
    if url:
        _config(f"url_{provedor}", url)
    # chave nova: o que funcionava (ou não) com a antiga não vale mais
    _config(f"{provedor}_modelo_ok", apagar=True)
    _config(f"{provedor}_sem_cota", apagar=True)
    _config(f"{provedor}_negado", apagar=True)
    _status_cache.pop(provedor, None)
    # Sem IA rodando neste computador, a conta nova passa a ser a do chat (como no celular).
    # Antes o chat continuava tentando um Ollama que nem estava instalado.
    local = status(obter("local"))
    if preferido() == "local" and not (local["online"] and local["modelos"]):
        _config("servidor_preferido", provedor)


# =========================================================
#   Entrar com o OpenRouter (OAuth PKCE)
# =========================================================
# Em vez de criar e colar uma chave, a pessoa entra no site do OpenRouter,
# clica em "Authorize" e volta pro Kaizen com um código que vira a chave.
# O verificador fica aqui (não na página) porque no programa de computador
# a volta acontece no navegador do sistema, não na janela do app.

OPENROUTER_LOGIN = "https://openrouter.ai/auth"
OPENROUTER_CHAVES = "https://openrouter.ai/api/v1/auth/keys"
LOGIN_SEGUNDOS = 600                    # o código do OpenRouter vale 10 min
_logins_openrouter = {}                 # estado -> (quando, verificador)


def entrar_openrouter(volta):
    """Endereço da página de login do OpenRouter, que volta pra `volta` com ?code=&state=."""
    if not re.match(r"^https?://", volta or ""):
        raise ValueError("Endereço de volta inválido.")
    agora = time.time()
    for estado, (quando, _) in list(_logins_openrouter.items()):
        if agora - quando > LOGIN_SEGUNDOS:
            _logins_openrouter.pop(estado, None)
    verificador = secrets.token_urlsafe(48)
    desafio = base64.urlsafe_b64encode(hashlib.sha256(verificador.encode()).digest()).rstrip(b"=").decode()
    estado = secrets.token_urlsafe(16)
    _logins_openrouter[estado] = (agora, verificador)
    parametros = urllib.parse.urlencode({"callback_url": volta, "code_challenge": desafio,
                                         "code_challenge_method": "S256", "state": estado, "key_label": "Kaizen"})
    return f"{OPENROUTER_LOGIN}?{parametros}"


def concluir_openrouter(codigo, estado):
    """Troca o código da volta pela chave e conecta o OpenRouter."""
    quando, verificador = _logins_openrouter.pop(estado or "", (0, None))
    if not verificador or not codigo or time.time() - quando > LOGIN_SEGUNDOS:
        raise ValueError("O login no OpenRouter expirou. Clique em \"Entrar com o OpenRouter\" de novo.")
    try:
        dados = _http(OPENROUTER_CHAVES, {"code": codigo, "code_verifier": verificador, "code_challenge_method": "S256"})
    except ErroConexao as erro:
        raise ValueError(f"O OpenRouter não confirmou o login ({erro}). Tente de novo.")
    conectar_nuvem("openrouter", dados.get("key"))


# =========================================================
#   Lista de destinos
# =========================================================

def listar():
    with conectar() as con:
        cadastrados = [{"id": str(l["id"]), "nome": l["nome"], "url": l["url"], "tipo": "ollama", "removivel": True}
                       for l in con.execute("SELECT * FROM servidores_ia ORDER BY id")]
    nuvem = [{"id": p, "nome": info["nome"], "url": _url_compat() if info.get("pede_url") else f"https://{info['host']}",
              "tipo": "nuvem", "removivel": True}
             for p, info in NUVEM.items() if conectado(p)]
    # as três aparecem sempre; as que faltam mostram como instalar
    ferramentas = [{"id": a, "nome": info["nome"], "url": "login da sua conta", "tipo": "agente", "removivel": False,
                    "instalado": bool(agentes.caminho(a)), "como_instalar": info["como_instalar"]}
                   for a, info in agentes.AGENTES.items()]
    return ([{"id": "local", "nome": "Este computador", "url": URL_LOCAL, "tipo": "ollama", "removivel": False}]
            + cadastrados + nuvem + ferramentas)


def obter(destino_id):
    return next((s for s in listar() if s["id"] == str(destino_id)), None)


def url_de(destino_id):
    destino = obter(destino_id)
    return destino["url"] if destino else URL_LOCAL


def preferido():
    destino_id = _config("servidor_preferido") or "local"
    destino = obter(destino_id)
    return destino_id if destino and destino.get("instalado", True) else "local"


def definir_preferido(destino_id):
    destino = obter(destino_id)
    if not destino:
        raise ValueError("Destino não encontrado.")
    if not destino.get("instalado", True):
        raise ValueError(f"Instale o {destino['nome']} e faça login nele pelo terminal primeiro.")
    _config("servidor_preferido", str(destino_id))


def status(destino, usar_cache=True):
    """{online, modelos, ms} do destino (Ollama, nuvem ou agente)."""
    if destino["tipo"] == "agente":
        # instalado = online; se faltar login, o erro aparece na primeira conversa
        instalado = destino.get("instalado", True)
        return {"online": instalado, "modelos": agentes.AGENTES[destino["id"]]["modelos"] if instalado else [], "ms": None}

    chave_cache = destino["id"] if destino["tipo"] == "nuvem" else destino["url"]
    validade = CACHE_NUVEM if destino["tipo"] == "nuvem" else CACHE_SEGUNDOS
    agora = time.time()
    if usar_cache and chave_cache in _status_cache and agora - _status_cache[chave_cache][0] < validade:
        return _status_cache[chave_cache][1]

    inicio = time.time()
    try:
        if destino["tipo"] == "nuvem":
            modelos = _modelos_nuvem(destino["id"], chave(destino["id"]))
        else:
            dados = _http(f"{destino['url']}/api/tags", timeout=3)
            modelos = sorted(m["name"] for m in dados.get("models", []))
        resultado = {"online": True, "modelos": modelos, "ms": round((time.time() - inicio) * 1000)}
    except (ErroConexao, KeyError, TypeError):
        resultado = {"online": False, "modelos": [], "ms": None}
    _status_cache[chave_cache] = (agora, resultado)
    return resultado


def listar_com_status(usar_cache=True):
    destinos = listar()
    escolhido = preferido()
    with ThreadPoolExecutor(max_workers=max(1, len(destinos))) as pool:
        estados = list(pool.map(lambda d: status(d, usar_cache), destinos))
    return [{**d, **st, "preferido": d["id"] == escolhido} for d, st in zip(destinos, estados)]


def adicionar(nome, url):
    url = normalizar_url(url)
    nome = (nome or "").strip() or urllib.parse.urlparse(url).hostname
    if url == normalizar_url(URL_LOCAL):
        raise ValueError("Esse já é o \"Este computador\".")

    st = status({"id": url, "url": url, "tipo": "ollama"}, usar_cache=False)
    if not st["online"]:
        raise ValueError(
            f"Não consegui falar com o Ollama em {url}. Confira se: o computador está ligado; "
            "o Ollama está rodando lá; ele aceita conexões de fora (OLLAMA_HOST com o IP da rede, "
            "ex. o do Tailscale); e este computador está na mesma rede (Tailscale ligado?).")

    with conectar() as con:
        try:
            novo = con.execute("INSERT INTO servidores_ia (nome, url) VALUES (?, ?)", (nome[:60], url)).lastrowid
        except sqlite3.IntegrityError:
            raise ValueError("Esse servidor já está cadastrado.")
    return {**obter(novo), **st}


def remover(destino_id):
    destino_id = str(destino_id)
    if destino_id == "local":
        raise ValueError("\"Este computador\" não pode ser removido.")
    if destino_id in NUVEM:
        _config(f"chave_{destino_id}", apagar=True)
        _config(f"url_{destino_id}", apagar=True)
        _config(f"{destino_id}_modelo_ok", apagar=True)
        _config(f"{destino_id}_sem_cota", apagar=True)
        _config(f"{destino_id}_negado", apagar=True)
        _status_cache.pop(destino_id, None)
    else:
        with conectar() as con:
            con.execute("DELETE FROM servidores_ia WHERE id = ?", (destino_id,))
    if _config("servidor_preferido") == destino_id:
        _config("servidor_preferido", apagar=True)


# =========================================================
#   Conversar (um caminho só pra Ollama, OpenAI e Gemini)
# =========================================================

def conversar(destino_id, modelo, mensagens, formato=None, progresso=None, limite_tokens=None, temperatura=None):
    """Manda [{role, content}] e devolve o texto da resposta.

    formato: JSON schema (força saída JSON) ou None.
    progresso(texto_parcial): chamado durante o streaming do Ollama.
    Levanta ErroConexao se não der pra falar com o destino.
    """
    destino = obter(destino_id)
    if not destino:
        raise ErroConexao(f"Destino \"{destino_id}\" não está configurado.")

    if destino["tipo"] == "nuvem":
        return _conversar_nuvem(destino_id, modelo, mensagens, formato)

    if destino["tipo"] == "agente":
        try:
            return _sem_raciocinio(agentes.conversar(destino_id, modelo, mensagens, formato))
        except agentes.ErroAgente as erro:
            raise ErroConexao(str(erro))

    # streaming só quando alguém acompanha o progresso: nesta versão do Ollama,
    # com stream o "think": False é ignorado e o qwen3 "pensa em voz alta"
    corpo = {"model": modelo, "messages": mensagens, "stream": bool(progresso), "think": False, "options": {}}
    if formato:
        corpo["format"] = formato
    if temperatura is not None:
        corpo["options"]["temperature"] = temperatura
    if limite_tokens:
        corpo["options"]["num_predict"] = limite_tokens
        corpo["options"]["num_ctx"] = 8192

    req = urllib.request.Request(f"{destino['url']}/api/chat", json.dumps(corpo).encode(),
                                 {"Content-Type": "application/json"})
    texto = ""
    try:
        # timeout vale entre pedaços, não pra resposta inteira: PC lento
        # demora no total, mas nunca fica 5 min sem mandar nada
        with urllib.request.urlopen(req, timeout=300) as r:
            for linha in r:
                if not linha.strip():
                    continue
                pedaco = json.loads(linha)
                if pedaco.get("error"):
                    raise ErroConexao(pedaco["error"])
                texto += pedaco.get("message", {}).get("content", "")
                if progresso:
                    progresso(texto)
                if pedaco.get("done"):
                    break
    except urllib.error.HTTPError as erro:
        raise ErroConexao(f"Ollama respondeu {erro.code}: {erro.read()[:200].decode(errors='replace')}")
    except (urllib.error.URLError, OSError) as erro:
        raise ErroConexao(f"Não consegui falar com \"{destino['nome']}\" ({erro}).")
    return _sem_raciocinio(texto)


def _sem_raciocinio(texto):
    """Tira o "pensamento em voz alta" (<think>…</think>) que alguns modelos soltam."""
    if "</think>" in texto:
        texto = texto.rsplit("</think>", 1)[1]
    return texto.strip()


def _conversar_nuvem(provedor, modelo, mensagens, formato):
    chave_api = chave(provedor)
    if formato:
        # nem todo modelo aceita schema estrito; pedir JSON + mostrar o schema é o que funciona em todos
        aviso = ("Responda SOMENTE com um objeto JSON válido que siga este JSON Schema:\n"
                 + json.dumps(formato, ensure_ascii=False))
        mensagens = [{"role": "system", "content": aviso}] + mensagens

    if provedor == "claude":
        cabecalhos = _cabecalhos(provedor, chave_api)
        corpo = {"model": modelo, "max_tokens": 16000,
                 "messages": [{"role": m["role"], "content": m["content"]} for m in mensagens if m["role"] != "system"]}
        sistema = "\n\n".join(m["content"] for m in mensagens if m["role"] == "system")
        if sistema:
            corpo["system"] = sistema
        if modelo in CLAUDE_COM_FALLBACK:
            corpo["fallbacks"] = "default"
            cabecalhos["anthropic-beta"] = "server-side-fallback-2026-07-01"
        dados = _http("https://api.anthropic.com/v1/messages", corpo, cabecalhos, timeout=300)
        if dados.get("stop_reason") == "refusal":
            raise ErroConexao("O Claude recusou esse pedido. Tente reformular ou use outro modelo.")
        # só os blocos de texto (o raciocínio vem em blocos "thinking", vazios por padrão)
        return "".join(b.get("text", "") for b in dados.get("content", []) if b.get("type") == "text").strip()

    if provedor in ("openai", "openrouter", "compat"):
        base = {"openai": "https://api.openai.com/v1", "openrouter": "https://openrouter.ai/api/v1"}.get(provedor)             or _url_compat()
        corpo = {"model": modelo, "messages": mensagens}
        # nem todo modelo grátis do OpenRouter aceita response_format; o schema já vai no prompt
        if formato and provedor != "openrouter":
            corpo["response_format"] = {"type": "json_object"}
        dados = _http(f"{base}/chat/completions", corpo, _cabecalhos(provedor, chave_api), timeout=300)
        return _sem_raciocinio(dados["choices"][0]["message"]["content"] or "")

    return _conversar_gemini(modelo, chave_api, mensagens, formato)


# ---------- Gemini: troca de modelo quando bate no limite grátis ----------

def _chamar_gemini(modelo, chave_api, mensagens, formato):
    sistema = "\n\n".join(m["content"] for m in mensagens if m["role"] == "system")
    corpo = {"contents": [{"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["content"]}]}
                          for m in mensagens if m["role"] != "system"]}
    if sistema:
        corpo["systemInstruction"] = {"parts": [{"text": sistema}]}
    if formato:
        corpo["generationConfig"] = {"responseMimeType": "application/json"}
    dados = _http(f"https://generativelanguage.googleapis.com/v1beta/models/{urllib.parse.quote(modelo)}:generateContent",
                  corpo, _cabecalhos("gemini", chave_api), timeout=300)
    try:
        return "".join(p.get("text", "") for p in dados["candidates"][0]["content"]["parts"])
    except (KeyError, IndexError):
        motivo = (dados.get("promptFeedback") or {}).get("blockReason") or "resposta vazia"
        raise ErroConexao(f"O Gemini não respondeu ({motivo}).")


def _gemini_sem_cota():
    return set(json.loads(_config("gemini_sem_cota") or "[]"))


def _ordem_gemini(pedido, modelos):
    """Flash estáveis, depois flash-lite, depois o resto: "pro" e "preview"
    costumam ficar fora do nível gratuito."""
    def peso(m):
        return (4 if re.search(r"preview|exp", m) else 0) + (2 if "pro" in m else 0) \
            + (1 if "lite" in m else 0) + (0 if "flash" in m else 3)
    resto = sorted(modelos, key=peso)
    return list(dict.fromkeys(m for m in [pedido, _config("gemini_modelo_ok")] + resto if m))[:6]


def _conversar_gemini(modelo, chave_api, mensagens, formato):
    sem_cota = _gemini_sem_cota()
    lembrado = _config("gemini_modelo_ok")
    # modelo que já respondeu "sem cota grátis" não é tentado de novo
    ordem = [lembrado] if modelo in sem_cota and lembrado else [modelo]
    ultimo = None
    teve_403 = False  # projeto sem acesso pesa mais que "sem cota" na explicação
    i = 0
    while i < len(ordem):
        for tentativa in range(2):
            try:
                texto = _chamar_gemini(ordem[i], chave_api, mensagens, formato)
                if ordem[i] != lembrado:
                    _config("gemini_modelo_ok", ordem[i])  # da próxima vez já começa por ele
                return texto
            except ErroConexao as erro:
                # 403 = o projeto da chave não tem acesso a esse modelo; 429 = sem cota/limite.
                # Nos dois casos, vale tentar os outros modelos da chave.
                if erro.status not in (403, 429):
                    raise
                ultimo = erro
                teve_403 = teve_403 or erro.status == 403
                if erro.sem_cota or erro.status == 403:
                    _config("gemini_sem_cota", json.dumps(sorted(_gemini_sem_cota() | {ordem[i]})))
                if erro.status == 403:  # guardado à parte: muda a explicação final
                    _config("gemini_negado", json.dumps(sorted(set(json.loads(_config("gemini_negado") or "[]")) | {ordem[i]})))
                elif erro.espera is not None and erro.espera <= 20 and tentativa == 0:
                    time.sleep(erro.espera + 0.3)  # limite por minuto: espera o que o Google pediu
                    continue
                break
        if len(ordem) == 1:
            try:
                bloqueados = _gemini_sem_cota()
                ordem = [m for j, m in enumerate(_ordem_gemini(ordem[0], _modelos_nuvem("gemini", chave_api)))
                         if j == 0 or m not in bloqueados]
            except ErroConexao:
                pass
        i += 1

    if teve_403 or json.loads(_config("gemini_negado") or "[]"):
        raise ErroConexao("O Google barrou o acesso do projeto dessa chave à API do Gemini (403) — isso tem acontecido com projetos novos no nível gratuito. Tente: ativar a verificação por telefone e em 2 etapas na conta Google e criar outra chave; se continuar, use o OpenRouter (grátis) em “Onde a IA roda”.", status=403)
    if ultimo is not None and ultimo.sem_cota:
        raise ErroConexao("Nenhum modelo do Gemini na sua chave tem uso gratuito liberado agora. "
                          "Confira em aistudio.google.com se a chave é do nível gratuito, ou tente mais tarde.",
                          status=429)
    espera = f"em {int(ultimo.espera) + 1} s" if ultimo is not None and ultimo.espera else "daqui a pouco"
    raise ErroConexao(f"Limite gratuito do Gemini atingido. Tente de novo {espera}.", status=429)


def modelos_para_chat(destino_id, modelos):
    """O modelo mais indicado primeiro (o chat começa por ele)."""
    if destino_id == "openrouter":
        return sorted(modelos, key=lambda m: m != "openrouter/free")
    if destino_id != "gemini":
        return modelos
    sem_cota = _gemini_sem_cota()
    lembrado = _config("gemini_modelo_ok")
    livres = [m for m in modelos if m not in sem_cota]
    estavel = [m for m in livres if "flash" in m and not re.search(r"preview|exp|thinking|lite", m)]
    primeiro = lembrado if lembrado in modelos else (estavel or livres or modelos or [None])[0]
    return ([primeiro] if primeiro else []) + [m for m in modelos if m != primeiro]
