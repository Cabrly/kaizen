"""Busca de materiais de estudo sem chave de API.

O modelo de IA nunca escreve link: quem acha os materiais é este módulo.

Vídeos, em ordem de tentativa:
    YouTube direto -> Invidious -> Piped -> busca web (site:youtube.com)
Documentação:
    menu/sitemap do site oficial (na versão do idioma, se houver) -> busca web
Busca web:
    SearXNG (se SEARXNG_URL estiver definida) -> DuckDuckGo -> Brave

Toda busca recebe o idioma dos materiais ("pt", "en", "es" — ver IDIOMAS),
que ajusta região/idioma das fontes e a preferência na hora de escolher.

Tudo que vem de fora é frágil (instância pública cai, buscador pede
captcha, rede bloqueia YouTube), então:
- fonte que falha descansa uns minutos e a próxima assume;
- cada fonte espera um respiro entre consultas (rajada = bloqueio);
- resultados ficam em cache no SQLite (CACHE_DB) por 30 dias;
- nada aqui levanta exceção: no pior caso volta lista vazia.
"""
from concurrent.futures import ThreadPoolExecutor
from html import unescape
import gzip
import json
import os
import re
import sqlite3
import threading
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

SEARXNG_URL = os.environ.get("SEARXNG_URL", "").rstrip("/")
CACHE_DB = None          # o server.py aponta pro kaizen.sqlite3
CACHE_DIAS = 30

NAVEGADOR = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/130.0 Safari/537.36"
)

INVIDIOUS_RESERVA = ["invidious.f5.si", "yewtu.be", "inv.nadeko.net"]
PIPED = ["https://api.piped.private.coffee", "https://pipedapi.kavin.rocks", "https://pipedapi.adminforge.de"]

# Idiomas dos materiais. "locais" = como o idioma aparece em endereços
# (/pt-BR/docs, es.react.dev...); "aceitos" = locais que valem nas docs
# (inglês entra como reserva, porque muita documentação só existe nele).
IDIOMAS = {
    "pt": {"nome": "Português", "aceitar": "pt-BR,pt;q=0.9,en;q=0.7", "hl": "pt-BR", "gl": "BR",
           "ddg": "br-pt", "searxng": "pt-BR", "aula": "aula", "documentacao": "documentação",
           "locais": ("pt-br", "pt_br", "pt"), "aceitos": ("pt-br", "pt_br", "pt", "en", "en-us", "en_us")},
    "en": {"nome": "English", "aceitar": "en-US,en;q=0.9", "hl": "en", "gl": "US",
           "ddg": "us-en", "searxng": "en-US", "aula": "tutorial", "documentacao": "documentation",
           "locais": ("en", "en-us", "en_us"), "aceitos": ("en", "en-us", "en_us")},
    "es": {"nome": "Español", "aceitar": "es-ES,es;q=0.9,en;q=0.7", "hl": "es", "gl": "ES",
           "ddg": "es-es", "searxng": "es-ES", "aula": "clase", "marca_video": "español",
           "documentacao": "documentación",
           "locais": ("es", "es-es", "es_es", "es-419", "es-mx"), "aceitos": ("es", "es-es", "es_es", "es-419", "es-mx", "en", "en-us", "en_us")},
}


def idioma_valido(idioma):
    return idioma if idioma in IDIOMAS else "pt"


class Bloqueado(Exception):
    """A fonte respondeu, mas com captcha/página de bloqueio."""


ERROS = (Bloqueado, urllib.error.URLError, OSError, ValueError, KeyError, TypeError)


def _baixar(url, dados=None, timeout=8, bruto=False, idioma="pt"):
    req = urllib.request.Request(url, data=dados, headers={
        "User-Agent": NAVEGADOR,
        "Accept-Language": IDIOMAS[idioma_valido(idioma)]["aceitar"],
    })
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        conteudo = resp.read()
    if bruto:
        return conteudo
    return conteudo.decode("utf-8", errors="replace")


def _limpar(texto):
    return re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", "", texto or ""))).strip()


def _sem_acento(texto):
    return unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode().lower()


# ---------- Cache ----------

def _cache(chave, funcao):
    """Devolve do cache ou executa funcao() e guarda (só se vier algo)."""
    if CACHE_DB:
        try:
            with sqlite3.connect(CACHE_DB, timeout=5) as con:
                con.execute("CREATE TABLE IF NOT EXISTS busca_cache "
                            "(consulta TEXT PRIMARY KEY, resultados TEXT, criado_em REAL)")
                linha = con.execute(
                    "SELECT resultados FROM busca_cache WHERE consulta = ? AND criado_em > ?",
                    (chave, time.time() - CACHE_DIAS * 86400)).fetchone()
            if linha:
                return json.loads(linha[0])
        except sqlite3.Error:
            pass

    resultado = funcao()

    if CACHE_DB and resultado:
        try:
            with sqlite3.connect(CACHE_DB, timeout=5) as con:
                con.execute("INSERT OR REPLACE INTO busca_cache VALUES (?, ?, ?)",
                            (chave, json.dumps(resultado, ensure_ascii=False), time.time()))
        except sqlite3.Error:
            pass
    return resultado


# ---------- Fontes com respiro e descanso ----------

class Fonte:
    def __init__(self, nome, funcao, intervalo, descanso=600):
        self.nome, self.funcao = nome, funcao
        self.intervalo, self.descanso = intervalo, descanso
        self.trava = threading.Lock()
        self.ultima = 0.0
        self.fora_ate = 0.0

    def disponivel(self):
        return time.time() >= self.fora_ate

    def __call__(self, *args):
        """Executa com respiro; em 429 espera e tenta de novo; em falha, descansa."""
        with self.trava:
            for tentativa in range(2):
                espera = self.intervalo - (time.time() - self.ultima)
                if espera > 0:
                    time.sleep(espera)
                try:
                    return self.funcao(*args)
                except urllib.error.HTTPError as erro:
                    if erro.code != 429 or tentativa == 1:
                        self.fora_ate = time.time() + (120 if erro.code == 429 else self.descanso)
                        raise
                    time.sleep(3 * (tentativa + 1))
                except ERROS:
                    self.fora_ate = time.time() + self.descanso
                    raise
                finally:
                    self.ultima = time.time()


def _primeira_que_responde(fontes, *args):
    for fonte in fontes:
        if not fonte.disponivel():
            continue
        try:
            resultado = fonte(*args)
        except ERROS:
            continue
        if resultado:
            return resultado
    return []


# ---------- Busca web ----------

def _searxng(consulta, idioma):
    url = f"{SEARXNG_URL}/search?" + urllib.parse.urlencode(
        {"q": consulta, "format": "json", "language": IDIOMAS[idioma]["searxng"]})
    dados = json.loads(_baixar(url, idioma=idioma))
    return [{"titulo": r.get("title", ""), "url": r.get("url", ""), "resumo": r.get("content", "")[:200]}
            for r in dados.get("results", [])]


def _duckduckgo(consulta, idioma):
    html = _baixar("https://html.duckduckgo.com/html/",
                   urllib.parse.urlencode({"q": consulta, "kl": IDIOMAS[idioma]["ddg"]}).encode(), idioma=idioma)
    if "bots use DuckDuckGo" in html or "anomaly-modal" in html:
        raise Bloqueado("duckduckgo")
    resultados = []
    for href, titulo, resumo in re.findall(
            r'<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)</a>.*?'
            r'class="result__snippet"[^>]*>(.*?)</a>', html, re.S):
        alvo = urllib.parse.parse_qs(urllib.parse.urlparse(href).query).get("uddg")
        url = alvo[0] if alvo else href
        if "duckduckgo.com/y.js" not in url:  # anúncio
            resultados.append({"titulo": _limpar(titulo), "url": url, "resumo": _limpar(resumo)[:200]})
    return resultados


def _brave(consulta, idioma):
    html = _baixar("https://search.brave.com/search?" + urllib.parse.urlencode({"q": consulta, "source": "web"}),
                   idioma=idioma)
    resultados = []
    for bloco in html.split('data-type="web"')[1:]:
        url = re.search(r'<a href="(https?://[^"]+)"[^>]*class="[^"]*\bl1\b', bloco)
        titulo = re.search(r'class="title search-snippet-title[^"]*"[^>]*>(.*?)</div>', bloco, re.S)
        resumo = re.search(r'class="generic-snippet[^"]*"><div class="content[^"]*"[^>]*>(.*?)</div>', bloco, re.S)
        if url and titulo:
            resultados.append({"titulo": _limpar(titulo.group(1)), "url": unescape(url.group(1)),
                               "resumo": _limpar(resumo.group(1))[:200] if resumo else ""})
    if not resultados and "captcha" in html.lower():
        raise Bloqueado("brave")
    return resultados


BUSCA_WEB = ([Fonte("searxng", _searxng, 0.2)] if SEARXNG_URL else []) + [
    Fonte("duckduckgo", _duckduckgo, 1.5),
    Fonte("brave", _brave, 2.5),
]


def buscar_web(consulta, idioma="pt"):
    consulta = re.sub(r"\s+", " ", consulta).strip()
    idioma = idioma_valido(idioma)
    return _cache(f"web:{idioma}:{consulta.lower()}", lambda: _primeira_que_responde(BUSCA_WEB, consulta, idioma))


# ---------- Vídeos ----------

def _video(video_id, titulo, canal, segundos):
    return {
        "tipo": "video",
        "titulo": titulo,
        "url": f"https://www.youtube.com/watch?v={video_id}",
        "fonte": canal or "YouTube",
        "minutos": max(1, round(segundos / 60)) if segundos else None,
    }


def _youtube(consulta, idioma):
    html = _baixar("https://www.youtube.com/results?" + urllib.parse.urlencode(
        {"search_query": consulta, "hl": IDIOMAS[idioma]["hl"], "gl": IDIOMAS[idioma]["gl"]}), timeout=5, idioma=idioma)
    m = re.search(r"var ytInitialData = (\{.*?\});</script>", html, re.S)
    if not m:
        raise Bloqueado("youtube")
    pilha, videos = [json.loads(m.group(1))], []
    while pilha:
        atual = pilha.pop()
        if isinstance(atual, dict):
            v = atual.get("videoRenderer")
            if v and v.get("videoId") and v.get("lengthText"):
                partes = [int(p) for p in re.findall(r"\d+", v["lengthText"].get("simpleText", ""))]
                segundos = 0
                for p in partes:
                    segundos = segundos * 60 + p
                videos.append(_video(
                    v["videoId"],
                    "".join(r.get("text", "") for r in v.get("title", {}).get("runs", [])),
                    "".join(r.get("text", "") for r in v.get("ownerText", {}).get("runs", [])),
                    segundos))
            pilha.extend(atual.values())
        elif isinstance(atual, list):
            pilha.extend(reversed(atual))
    return videos


_instancias_invidious = []


def _invidious(consulta, idioma):
    if not _instancias_invidious:
        try:
            lista = json.loads(_baixar("https://api.invidious.io/instances.json?sort_by=health", timeout=6))
            _instancias_invidious.extend(
                i[0] for i in lista if i[1].get("api") and i[1].get("type") == "https")
        except ERROS:
            pass
        _instancias_invidious.extend(h for h in INVIDIOUS_RESERVA if h not in _instancias_invidious)

    for host in list(_instancias_invidious):
        try:
            itens = json.loads(_baixar(f"https://{host}/api/v1/search?" + urllib.parse.urlencode(
                {"q": consulta, "type": "video", "region": IDIOMAS[idioma]["gl"], "hl": idioma}), timeout=8))
        except ERROS:
            _instancias_invidious.remove(host)
            _instancias_invidious.append(host)  # vai pro fim da fila
            continue
        return [_video(v["videoId"], v.get("title", ""), v.get("author"), v.get("lengthSeconds"))
                for v in itens if v.get("type") == "video" and v.get("lengthSeconds")]
    raise Bloqueado("invidious")


def _piped(consulta, idioma):  # o Piped não tem filtro de idioma: vale a consulta
    for api in PIPED:
        try:
            dados = json.loads(_baixar(f"{api}/search?" + urllib.parse.urlencode(
                {"q": consulta, "filter": "videos"}), timeout=8))
        except ERROS:
            continue
        videos = []
        for v in dados.get("items", []):
            m = re.search(r"v=([\w-]{11})", v.get("url", ""))
            if m and v.get("duration", 0) > 0:
                videos.append(_video(m.group(1), v.get("title", ""), v.get("uploaderName"), v["duration"]))
        return videos
    raise Bloqueado("piped")


def _videos_pela_web(consulta, idioma):
    videos, vistos = [], set()
    for r in buscar_web(f"site:youtube.com {consulta}", idioma):
        m = re.search(r"youtube\.com/watch\?v=([\w-]{11})", r["url"])
        if m and m.group(1) not in vistos:
            vistos.add(m.group(1))
            videos.append(_video(m.group(1), re.sub(r"\s*[-–|]\s*YouTube$", "", r["titulo"]), "YouTube", None))
    return videos


FONTES_VIDEO = [
    Fonte("youtube", _youtube, 0.5, descanso=3600),
    Fonte("invidious", _invidious, 0.8),
    Fonte("piped", _piped, 0.8),
    Fonte("web", _videos_pela_web, 0),
]


def buscar_videos(consulta, minutos_max=None, limite=2, idioma="pt"):
    """Melhores vídeos pra uma sessão: curtos o bastante pra caber nela."""
    consulta = re.sub(r"\s+", " ", consulta).strip()
    idioma = idioma_valido(idioma)
    # "clase" sozinho não convence o YouTube; "español" no fim, sim
    marca = IDIOMAS[idioma].get("marca_video")
    if marca and _sem_acento(marca) not in _sem_acento(consulta):
        consulta = f"{consulta} {marca}"
    videos = _cache(f"video:{idioma}:{consulta.lower()}",
                    lambda: _primeira_que_responde(FONTES_VIDEO, consulta, idioma))

    def nota(v):
        m = v.get("minutos")
        if m is None:
            return 1                       # sem duração: aceitável, mas no meio da fila
        if minutos_max and m > minutos_max:
            return 3                       # não cabe na sessão
        return 0 if m >= 4 else 2          # muito curto costuma ser raso

    # sort é estável: dentro da mesma nota fica a ordem de relevância da busca
    return sorted(videos, key=nota)[:limite]


_PORTUGUES = re.compile(r"[ãõç]|\b(do|da|dos|das|com|aula|em|no|na|um|uma|seu|sua|você|não|é)\b", re.I)
_ESPANHOL = re.compile(r"[ñ¿¡]|\b(el|los|las|del|clase|cómo|qué|y|en|un|una|su|tu|usted|curso de|"
                       r"desde|cero|fácil|gratis|principiantes|español)\b", re.I)
_INGLES = re.compile(r"\b(the|and|how|to|with|for|in|of|your|you|learn|beginners?|tutorial|course|crash)\b", re.I)


def parece_idioma(texto, idioma):
    """Chute barato do idioma de um título, só pra ordenar candidatos."""
    texto = texto or ""
    pt, es, en = bool(_PORTUGUES.search(texto)), bool(_ESPANHOL.search(texto)), bool(_INGLES.search(texto))
    if idioma == "pt":
        return pt
    if idioma == "es":
        return es and not pt
    return en and not pt and not es


def titulo_original(video):
    """Invidious/Piped devolvem o título traduzido pelo YouTube (as instâncias
    ficam fora do Brasil). O noembed repassa o oEmbed do YouTube com o título
    original — e funciona mesmo onde o youtube.com é bloqueado."""
    def buscar():
        dados = json.loads(_baixar("https://noembed.com/embed?" + urllib.parse.urlencode({"url": video["url"]}), timeout=5))
        return {"titulo": dados.get("title"), "fonte": dados.get("author_name")} if dados.get("title") else {}

    try:
        original = _cache(f"oembed:{video['url']}", buscar)
    except ERROS:
        return video
    return {**video, "titulo": original.get("titulo") or video["titulo"], "fonte": original.get("fonte") or video["fonte"]}


# ---------- Documentação oficial (sitemap) ----------

def _urls_do_sitemap(url, profundidade=0):
    conteudo = _baixar(url, timeout=8, bruto=True)
    if conteudo[:2] == b"\x1f\x8b":
        conteudo = gzip.decompress(conteudo)
    texto = conteudo.decode("utf-8", errors="replace")
    locs = [unescape(l.strip()) for l in re.findall(r"<loc>(.*?)</loc>", texto, re.S)]
    if "<sitemapindex" in texto and profundidade == 0:
        urls = []
        for filho in locs[:6]:
            try:
                urls += _urls_do_sitemap(filho, 1)
            except ERROS:
                pass
        return urls
    return locs


# Pedaços de endereço que indicam idioma (/fr/docs, /zh-CN/...). Lista fechada
# de propósito: um padrão genérico de 2 letras pegaria /js/, /ui/, /v2/...
LOCAL = re.compile(
    r"^(ar|az|be|bg|bn|ca|cs|da|de|el|en|es|et|fa|fi|fr|he|hi|hr|hu|id|it|ja|ka|kk|ko|lt|lv|mk|ms|nb|nl|no|pl|"
    r"pt|ro|ru|sk|sl|sr|sv|ta|th|tr|uk|ur|uz|vi|zh|zh[-_](cn|tw|hans|hant)|en[-_](us|gb)|pt[-_](br|pt)|"
    r"es[-_](es|mx|419)|fr[-_]fr|de[-_]de|ja[-_]jp|ko[-_]kr|ru[-_]ru|it[-_]it|pl[-_]pl|tr[-_]tr)$", re.I)

RAIZES_DOC = ("learn", "docs", "doc", "guide", "guides", "reference", "tutorial", "manual", "book", "handbook")


def _locais_da_url(url):
    partes = urllib.parse.urlparse(url)
    segmentos = [s for s in partes.path.split("/") if s] + [partes.netloc.split(".")[0]]
    return {s.lower() for s in segmentos if LOCAL.match(s)}


def _idioma_aceito(url, idioma):
    """Sem marca de idioma no endereço = aceito; com marca, só as do idioma (ou inglês de reserva)."""
    return _locais_da_url(url) <= set(IDIOMAS[idioma]["aceitos"])


def _no_idioma(url, idioma):
    return bool(_locais_da_url(url) & set(IDIOMAS[idioma]["locais"]))


def _links_da_pagina(url, host, idioma):
    """Links internos de uma página, com o texto do link como título."""
    req = urllib.request.Request(url, headers={"User-Agent": NAVEGADOR, "Accept-Language": IDIOMAS[idioma]["aceitar"]})
    with urllib.request.urlopen(req, timeout=8) as resp:
        url = resp.geturl()  # links relativos valem a partir da URL final (pós-redirecionamento)
        html = resp.read().decode("utf-8", errors="replace")
    host = urllib.parse.urlparse(url).netloc or host
    links = {}
    for href, texto in re.findall(r'<a[^>]+href="([^"#]+)"[^>]*>(.*?)</a>', html, re.S):
        absoluto = urllib.parse.urljoin(url, unescape(href))
        partes = urllib.parse.urlparse(absoluto)
        titulo = _limpar(texto)
        if partes.netloc == host and partes.scheme.startswith("http") and 2 < len(titulo) < 90:
            links.setdefault(absoluto.split("?")[0], titulo)
    return links


def paginas_oficiais(dominio, idioma="pt"):
    """Páginas do site oficial: [{url, titulo}].

    Junta o sitemap (se houver) com os links do menu da home e das páginas
    de documentação (/learn, /docs, /guide...). Tenta antes a versão no
    idioma (pt-br.react.dev, es.react.dev...).
    """
    dominio = re.sub(r"^https?://", "", (dominio or "").strip()).split("/")[0].removeprefix("www.")
    if not dominio or "." not in dominio:
        return []
    idioma = idioma_valido(idioma)
    subdominios = [f"{l}.{dominio}" for l in IDIOMAS[idioma]["locais"] if l not in ("en", "en-us", "en_us")
                   and "_" not in l][:2]

    def coletar(host):
        paginas = {}
        try:
            for u in _urls_do_sitemap(f"https://{host}/sitemap.xml"):
                paginas.setdefault(u, "")
        except ERROS:
            pass
        try:
            links = _links_da_pagina(f"https://{host}/", host, idioma)
        except ERROS:
            links = {}
        # páginas de documentação linkadas na home trazem o menu completo
        raizes = [u for u in links
                  if set(urllib.parse.urlparse(u).path.lower().strip("/").split("/")[:3]) & set(RAIZES_DOC)]
        for raiz in sorted(raizes, key=len)[:3]:
            try:
                links.update({k: v for k, v in _links_da_pagina(raiz, host, idioma).items() if k not in links})
            except ERROS:
                pass
        for u, titulo in links.items():
            if titulo or u not in paginas:
                paginas[u] = titulo
        return {u: t for u, t in paginas.items() if _idioma_aceito(u, idioma)}

    def baixar():
        paginas = {}
        for host in subdominios:  # versão traduzida do site, se existir
            paginas = coletar(host)
            if len(paginas) >= 5:
                break
        if len(paginas) < 5:
            paginas = coletar(dominio) or coletar(f"www.{dominio}")
        # muita documentação mora em docs.<site> (docs.python.org...)
        if not dominio.startswith("docs."):
            for u, t in coletar(f"docs.{dominio}").items():
                paginas.setdefault(u, t)
        return [{"url": u, "titulo": t} for u, t in paginas.items()][:20000] if len(paginas) >= 5 else []

    return _cache(f"oficial:{idioma}:{dominio}", baixar)


PALAVRAS_VAZIAS = {"de", "da", "do", "das", "dos", "e", "em", "com", "para", "um", "uma", "no", "na",
                   "the", "and", "in", "to", "of", "a", "o", "os", "as", "how", "como", "html", "htm", "www"}


def _tokens(texto):
    return {t for t in re.split(r"[^a-z0-9]+", _sem_acento(texto)) if len(t) > 1 and t not in PALAVRAS_VAZIAS}


def escolher_paginas(paginas, termos, ignorar=(), limite=2, idioma="pt"):
    """Páginas cujo endereço/título mais combinam com os termos."""
    alvo = _tokens(termos) - _tokens(" ".join(ignorar))
    if not alvo:
        return []
    pontuadas = []
    for p in paginas:
        caminho = urllib.parse.urlparse(p["url"]).path
        nota = len(alvo & (_tokens(caminho) | _tokens(p["titulo"])))
        if nota:
            # empate: versão no idioma escolhido primeiro, depois o caminho mais
            # curto (costuma ser a página principal do assunto)
            fora_do_idioma = 0 if _no_idioma(p["url"], idioma) else 1
            pontuadas.append((-nota, fora_do_idioma, len(caminho), p["url"], p))
    pontuadas.sort(key=lambda x: x[:4])

    # a mesma página em dois idiomas conta uma vez só
    escolhidas, vistas = [], set()
    for *_, p in pontuadas:
        chave = "/".join(s for s in urllib.parse.urlparse(p["url"]).path.lower().split("/") if not LOCAL.match(s))
        if chave not in vistas:
            vistas.add(chave)
            escolhidas.append(p)
        if len(escolhidas) == limite:
            break
    return escolhidas


def titulo_de_url(url):
    """Título legível a partir do endereço (evita baixar cada página)."""
    pedaco = urllib.parse.urlparse(url).path.rstrip("/").split("/")[-1] or urllib.parse.urlparse(url).netloc
    pedaco = re.sub(r"\.(html?|md|php)$", "", pedaco)
    return re.sub(r"[-_]+", " ", pedaco).strip().capitalize()


def buscar_documentacao(termos, dominio_oficial="", ignorar=(), limite=2, idioma="pt", consulta_web=None):
    """Docs pra uma sessão: oficial pelo menu/sitemap; se não achar, busca web
    (com `consulta_web`, se vier — ela deve estar no idioma dos materiais)."""
    idioma = idioma_valido(idioma)
    escolhidas = escolher_paginas(paginas_oficiais(dominio_oficial, idioma), termos, ignorar, limite, idioma)
    if escolhidas:
        return [{"tipo": "doc", "titulo": p["titulo"] or titulo_de_url(p["url"]), "url": p["url"],
                 "fonte": urllib.parse.urlparse(p["url"]).netloc} for p in escolhidas]

    fora = ("youtube.com", "facebook.com", "instagram.com", "tiktok.com", "x.com", "twitter.com")
    docs = []
    for r in buscar_web(consulta_web or termos, idioma):
        dominio = urllib.parse.urlparse(r["url"]).netloc.removeprefix("www.")
        if not any(dominio.endswith(f) for f in fora) and _idioma_aceito(r["url"], idioma):
            docs.append({"tipo": "doc", "titulo": r["titulo"], "url": r["url"], "fonte": dominio})
    return docs[:limite]


def em_paralelo(funcao, lista, paralelo=4):
    with ThreadPoolExecutor(max_workers=paralelo) as pool:
        return list(pool.map(funcao, lista))


if __name__ == "__main__":
    import sys
    idioma = sys.argv[1] if len(sys.argv) > 1 else "pt"
    t = time.time()
    for v in buscar_videos(" ".join(sys.argv[2:]) or f"react useState {IDIOMAS[idioma]['aula']}",
                           minutos_max=30, idioma=idioma):
        print("video |", v["minutos"], "min |", v["fonte"], "|", v["titulo"][:60], "|", v["url"])
    for d in buscar_documentacao("react useState hook state", "react.dev", ignorar=["react"], idioma=idioma):
        print("doc   |", d["fonte"], "|", d["titulo"], "|", d["url"])
    print(f"{time.time() - t:.1f}s")
