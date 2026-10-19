"""Servidores de IA (Ollama) que o Kaizen pode usar.

Sempre existe o "Este computador" (OLLAMA_URL). Dá pra cadastrar outros
— uma máquina mais forte em casa, ou um servidor alcançado pelo Tailscale
(ex.: http://100.80.57.121:11434) — e escolher qual é o preferido. O chat
usa o preferido; o plano de estudo pode usar um modelo de qualquer um.

Ollama não tem senha: quem for liberar o seu pra outras máquinas deve
deixá-lo visível só numa rede privada (Tailscale, VPN), nunca na internet.
"""
from concurrent.futures import ThreadPoolExecutor
import json
import re
import sqlite3
import time
import urllib.error
import urllib.parse
import urllib.request

DB = None
URL_LOCAL = "http://127.0.0.1:11434"   # o server.py troca pelo OLLAMA_URL

_status_cache = {}                      # url -> (quando, status)
CACHE_SEGUNDOS = 10


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


# ---------- lista ----------

def listar():
    with conectar() as con:
        cadastrados = [{"id": str(l["id"]), "nome": l["nome"], "url": l["url"], "removivel": True}
                       for l in con.execute("SELECT * FROM servidores_ia ORDER BY id")]
    return [{"id": "local", "nome": "Este computador", "url": URL_LOCAL, "removivel": False}] + cadastrados


def obter(servidor_id):
    return next((s for s in listar() if s["id"] == str(servidor_id)), None)


def url_de(servidor_id):
    servidor = obter(servidor_id)
    return servidor["url"] if servidor else URL_LOCAL


# ---------- preferido ----------

def preferido():
    with conectar() as con:
        linha = con.execute("SELECT valor FROM config WHERE chave = 'servidor_preferido'").fetchone()
    servidor_id = linha["valor"] if linha else "local"
    return servidor_id if obter(servidor_id) else "local"


def definir_preferido(servidor_id):
    if not obter(servidor_id):
        raise ValueError("Servidor não encontrado.")
    with conectar() as con:
        con.execute("INSERT INTO config (chave, valor) VALUES ('servidor_preferido', ?) "
                    "ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor", (str(servidor_id),))


# ---------- status ----------

def status(url, usar_cache=True):
    """{online, modelos, ms} — pergunta ao Ollama quais modelos ele tem."""
    agora = time.time()
    if usar_cache and url in _status_cache and agora - _status_cache[url][0] < CACHE_SEGUNDOS:
        return _status_cache[url][1]
    inicio = time.time()
    try:
        with urllib.request.urlopen(f"{url}/api/tags", timeout=3) as r:
            modelos = sorted(m["name"] for m in json.loads(r.read()).get("models", []))
        resultado = {"online": True, "modelos": modelos, "ms": round((time.time() - inicio) * 1000)}
    except (urllib.error.URLError, OSError, ValueError, KeyError):
        resultado = {"online": False, "modelos": [], "ms": None}
    _status_cache[url] = (agora, resultado)
    return resultado


def listar_com_status(usar_cache=True):
    servidores = listar()
    escolhido = preferido()
    with ThreadPoolExecutor(max_workers=max(1, len(servidores))) as pool:
        estados = list(pool.map(lambda s: status(s["url"], usar_cache), servidores))
    return [{**s, **st, "preferido": s["id"] == escolhido} for s, st in zip(servidores, estados)]


# ---------- cadastro ----------

def adicionar(nome, url):
    url = normalizar_url(url)
    nome = (nome or "").strip() or urllib.parse.urlparse(url).hostname
    if url == normalizar_url(URL_LOCAL):
        raise ValueError("Esse já é o \"Este computador\".")

    st = status(url, usar_cache=False)
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


def remover(servidor_id):
    if str(servidor_id) == "local":
        raise ValueError("\"Este computador\" não pode ser removido.")
    with conectar() as con:
        con.execute("DELETE FROM servidores_ia WHERE id = ?", (servidor_id,))
        con.execute("DELETE FROM config WHERE chave = 'servidor_preferido' AND valor = ?", (str(servidor_id),))
