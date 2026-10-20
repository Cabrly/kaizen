"""Entregas das atividades e correção pela IA.

Numa atividade da sessão a pessoa entrega uma resposta escrita, arquivos de
texto/código e/ou um link (de um repositório do GitHub o Kaizen lê o README
e os arquivos principais). Entregar marca a atividade como feita.

Se a IA disponível for forte o bastante (ver pode_corrigir), a entrega entra
numa fila e uma thread corrige: nota de 0 a 10, o que ficou bom, os erros,
como melhorar e os assuntos em que a pessoa mostrou dificuldade. As
dificuldades entram no perfil (estudos.perfil_texto), então os próximos
planos, flashcards e o chat já sabem onde reforçar.

Aqui no PC nada tem limite de espaço além do bom senso (ver os LIMITES).
Pela sincronia vai tudo, a não ser que a pessoa escolha poupar o celular em
"O que vai pro celular" (para_sincronia).
"""
from datetime import date, datetime, timedelta
import json
import queue
import re
import threading
import urllib.error
import urllib.parse
import urllib.request

import estudos
import servidores

ARQUIVOS_MAX = 10
ARQUIVO_MAX = 500_000        # caracteres por arquivo guardado
TEXTO_MAX = 50_000           # resposta escrita
PARA_IA = 200_000            # o que a IA consegue ler de uma entrega (o resto vai cortado)
GITHUB_ARQUIVOS = 15
GITHUB_TOTAL = 120_000

SISTEMA = estudos.PROMPTS["sistema_correcao"]
ESQUEMA = estudos.PROMPTS["esquema_correcao"]

# Modelos que corrigem bem. Os pequenos (até ~8B, como o qwen3:4b) dão nota
# aleatória, então nem tentam: a entrega fica guardada esperando uma IA melhor.
FORTES = re.compile(r"claude|sonnet|opus|haiku|gpt-?4|gpt-?5|chatgpt|(^|[/:\-])o[1-9]\b|gemini-(1\.5-pro|[2-9])|"
                    r"deepseek|grok|kimi|glm-?4|mistral-(large|medium)|command-r-plus|llama-?3\.[13]-?(70|405)b|"
                    r"llama-?4|qwen.*(max|plus)|gpt-oss", re.IGNORECASE)
TAMANHO = re.compile(r"(\d+(?:\.\d+)?)b\b", re.IGNORECASE)
MINIMO_B = 14                # bilhões de parâmetros pra um modelo sem nome conhecido corrigir

SINC_OPCOES = ("andamento", "tudo", "notas")


# =========================================================
#   Quem corrige
# =========================================================

def pode_corrigir(motor):
    if not motor:
        return False
    if motor == "claude" or motor.startswith("agente@"):
        return True                                   # Claude Code, Gemini CLI, Codex
    _, modelo = estudos._separar_motor(motor)
    tamanho = TAMANHO.search(modelo)
    if tamanho and float(tamanho.group(1)) < MINIMO_B:
        return False
    return bool(FORTES.search(modelo)) or bool(tamanho)


def corretor(motor_do_plano=None):
    """O motor que vai corrigir: o do plano, se for forte; senão o primeiro forte disponível
    (a lista já vem com o destino preferido na frente). None = nenhuma IA serve."""
    if pode_corrigir(motor_do_plano):
        return motor_do_plano
    motores, _ = estudos.motores_disponiveis()
    return next((m["id"] for m in motores if pode_corrigir(m["id"])), None)


def nome_do_motor(motor):
    destino, modelo = estudos._separar_motor(motor or "")
    nome = (servidores.obter(destino) or {}).get("nome", destino)
    return f"{nome} ({modelo})" if modelo else nome


def sobre_corretor():
    """Pra tela: quem vai corrigir agora, ou por que ninguém."""
    motor = corretor()
    return {"pode": bool(motor), "motor": motor, "nome": nome_do_motor(motor) if motor else None}


# =========================================================
#   Guardar, listar, apagar
# =========================================================

def _limpar_arquivos(arquivos):
    if not isinstance(arquivos, list):
        raise ValueError("Arquivos inválidos.")
    if len(arquivos) > ARQUIVOS_MAX:
        raise ValueError(f"No máximo {ARQUIVOS_MAX} arquivos por entrega.")
    limpos = []
    for a in arquivos:
        nome = str((a or {}).get("nome", "")).strip()[:120] or "arquivo.txt"
        conteudo = str((a or {}).get("conteudo", ""))
        if "\x00" in conteudo:
            raise ValueError(f"\"{nome}\" não é um arquivo de texto. Mande o código ou o texto, ou um link.")
        if len(conteudo) > ARQUIVO_MAX:
            raise ValueError(f"\"{nome}\" passa de {ARQUIVO_MAX // 1000} mil caracteres. Projeto grande: mande o link do GitHub.")
        limpos.append({"nome": nome, "conteudo": conteudo, "tamanho": len(conteudo.encode("utf-8"))})
    return limpos


def _entrega(linha):
    e = dict(linha)
    e["arquivos"] = json.loads(e["arquivos"] or "[]")
    e["correcao"] = json.loads(e["correcao"]) if e["correcao"] else None
    e["corretor"] = nome_do_motor(e["motor"]) if e["motor"] else None
    return e


def listar(item_id):
    with estudos.conectar() as con:
        linhas = con.execute("SELECT * FROM entregas WHERE item_id = ? ORDER BY id DESC", (item_id,)).fetchall()
    return [_entrega(l) for l in linhas]


def obter(entrega_id):
    with estudos.conectar() as con:
        linha = con.execute("SELECT * FROM entregas WHERE id = ?", (entrega_id,)).fetchone()
    return _entrega(linha) if linha else None


def resumo_dos_itens(con, item_ids):
    """{item_id: {entregas, nota, situacao}} da entrega mais recente, pros selos na sessão."""
    if not item_ids:
        return {}
    marcas = ",".join("?" * len(item_ids))
    linhas = con.execute(f"""
        SELECT item_id, COUNT(*) AS entregas,
               (SELECT nota FROM entregas u WHERE u.item_id = e.item_id ORDER BY id DESC LIMIT 1) AS nota,
               (SELECT situacao FROM entregas u WHERE u.item_id = e.item_id ORDER BY id DESC LIMIT 1) AS situacao
        FROM entregas e WHERE item_id IN ({marcas}) GROUP BY item_id""", list(item_ids)).fetchall()
    return {l["item_id"]: {"entregas": l["entregas"], "nota": l["nota"], "situacao": l["situacao"]} for l in linhas}


def criar(dados):
    item_id = int(dados.get("item_id") or 0)
    texto = str(dados.get("texto") or "").strip()[:TEXTO_MAX]
    link = str(dados.get("link") or "").strip()[:500]
    arquivos = _limpar_arquivos(dados.get("arquivos") or [])
    if link and not re.match(r"^https?://", link):
        raise ValueError("O link precisa começar com http:// ou https://.")
    if not (texto or link or arquivos):
        raise ValueError("Escreva a resposta, anexe um arquivo ou cole um link.")

    with estudos.conectar() as con:
        item = con.execute("SELECT i.tipo, p.motor FROM itens i JOIN sessoes s ON s.id = i.sessao_id "
                           "JOIN planos p ON p.id = s.plano_id WHERE i.id = ?", (item_id,)).fetchone()
        if not item:
            raise ValueError("Atividade não encontrada.")
        motor = corretor(item["motor"])
        entrega_id = con.execute(
            "INSERT INTO entregas (item_id, texto, link, arquivos, criado_em, situacao, motor) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (item_id, texto, link, json.dumps(arquivos, ensure_ascii=False), datetime.now().isoformat(timespec="seconds"),
             "na-fila" if motor else "sem-corretor", motor)).lastrowid

    estudos.marcar_item(item_id, "feito")   # entregou = fez (e já puxa os flashcards da sessão)
    if motor:
        _enfileirar(entrega_id)
    return obter(entrega_id)


def corrigir_de_novo(entrega_id):
    """Depois de um erro, ou com uma IA melhor conectada."""
    with estudos.conectar() as con:
        linha = con.execute("SELECT e.situacao, p.motor FROM entregas e JOIN itens i ON i.id = e.item_id "
                            "JOIN sessoes s ON s.id = i.sessao_id JOIN planos p ON p.id = s.plano_id "
                            "WHERE e.id = ?", (entrega_id,)).fetchone()
        if not linha:
            return None
        if linha["situacao"] in ("na-fila", "corrigindo"):
            return obter(entrega_id)
        motor = corretor(linha["motor"])
        if not motor:
            raise ValueError("Nenhuma IA conectada é forte o bastante pra corrigir. Conecte uma em \"Onde a IA roda\".")
        con.execute("UPDATE entregas SET situacao = 'na-fila', motor = ?, erro = NULL WHERE id = ?", (motor, entrega_id))
    _enfileirar(entrega_id)
    return obter(entrega_id)


def excluir(entrega_id):
    with estudos.conectar() as con:
        con.execute("DELETE FROM entregas WHERE id = ?", (entrega_id,))


# =========================================================
#   Correção (uma por vez, numa thread)
# =========================================================

_fila = queue.Queue()
_trava = threading.Lock()
_trabalhador = None


def _enfileirar(entrega_id):
    global _trabalhador
    _fila.put(entrega_id)
    with _trava:
        if not _trabalhador or not _trabalhador.is_alive():
            _trabalhador = threading.Thread(target=_trabalhar, daemon=True)
            _trabalhador.start()


def _trabalhar():
    while True:
        try:
            entrega_id = _fila.get(timeout=30)
        except queue.Empty:
            return
        try:
            _corrigir(entrega_id)
        except Exception as erro:  # qualquer falha fica na entrega; a fila segue
            with estudos.conectar() as con:
                con.execute("UPDATE entregas SET situacao = 'erro', erro = ? WHERE id = ?", (str(erro)[:400], entrega_id))


def _pedido(con, entrega):
    contexto = con.execute("""
        SELECT i.titulo, i.descricao, s.topico, s.objetivo, p.tema
        FROM itens i JOIN sessoes s ON s.id = i.sessao_id JOIN planos p ON p.id = s.plano_id
        WHERE i.id = ?""", (entrega["item_id"],)).fetchone()
    partes = [f"Assunto do plano: {contexto['tema']}", f"Tópico da sessão: {contexto['topico']}"]
    if contexto["objetivo"]:
        partes.append(f"Objetivo da sessão: {contexto['objetivo']}")
    partes.append(f"Enunciado da atividade: {contexto['descricao'] or contexto['titulo']}")

    sobra = PARA_IA
    material = ["\n=== ENTREGA DO ESTUDANTE ==="]
    if entrega["texto"]:
        material.append("Resposta escrita:\n" + entrega["texto"][:sobra])
        sobra -= len(entrega["texto"])
    for a in entrega["arquivos"]:
        if sobra <= 0:
            material.append(f"(arquivo {a['nome']} ficou de fora: a entrega passou do tamanho que a IA lê)")
            continue
        material.append(f"Arquivo {a['nome']}:\n```\n{a['conteudo'][:sobra]}\n```")
        sobra -= len(a["conteudo"])
    if entrega["link"]:
        material.append(f"Link entregue: {entrega['link']}")
        lido = ler_github(entrega["link"]) if sobra > 0 else ""
        material.append(lido[:sobra] if lido else "(não deu pra ler o conteúdo do link: avalie pelo resto da entrega)")
    return "\n\n".join(partes + material)


def _corrigir(entrega_id):
    with estudos.conectar() as con:
        linha = con.execute("SELECT * FROM entregas WHERE id = ?", (entrega_id,)).fetchone()
        if not linha or linha["situacao"] != "na-fila":
            return
        entrega = _entrega(linha)
        con.execute("UPDATE entregas SET situacao = 'corrigindo' WHERE id = ?", (entrega_id,))
        pedido = _pedido(con, entrega)

    dados = estudos.gerar_json(entrega["motor"], SISTEMA, pedido, ESQUEMA, limite_tokens=3000)
    correcao = limpar_correcao(dados)
    with estudos.conectar() as con:
        con.execute("UPDATE entregas SET situacao = 'corrigida', nota = ?, correcao = ?, erro = NULL WHERE id = ?",
                    (correcao["nota"], json.dumps(correcao, ensure_ascii=False), entrega_id))


def limpar_correcao(dados):
    def lista(chave, maximo):
        return [str(x).strip() for x in (dados.get(chave) or []) if str(x).strip()][:maximo]
    try:
        nota = round(float(dados.get("nota")))
    except (TypeError, ValueError):
        raise estudos.ErroIA("A IA não deu uma nota.")
    return {"nota": max(0, min(10, nota)), "resumo": str(dados.get("resumo") or "").strip(),
            "acertos": lista("acertos", 4), "erros": lista("erros", 6), "como_melhorar": lista("como_melhorar", 4),
            "dificuldades": [d[:40] for d in lista("dificuldades", 3)]}


# =========================================================
#   Link do GitHub: README e arquivos principais
# =========================================================

GITHUB = re.compile(r"^https?://(www\.)?github\.com/([\w.-]+)/([\w.-]+?)(?:\.git)?(?:/(tree|blob)/([^/]+)(?:/(.*))?)?/?$")
CODIGO = re.compile(r"\.(py|js|jsx|ts|tsx|java|kt|c|h|cpp|hpp|cs|go|rs|rb|php|swift|dart|sql|html|css|scss|vue|svelte|"
                    r"md|txt|json|yml|yaml|sh|ipynb)$", re.IGNORECASE)
IGNORAR = re.compile(r"(^|/)(node_modules|dist|build|vendor|venv|\.venv|\.git|__pycache__|target|bin|obj)/|"
                     r"\.min\.|package-lock\.json|yarn\.lock|pnpm-lock|\.lock$", re.IGNORECASE)


def _baixar(url, limite=GITHUB_TOTAL):
    req = urllib.request.Request(url, headers={"User-Agent": "Kaizen", "Accept": "application/vnd.github+json"})
    with urllib.request.urlopen(req, timeout=10) as resposta:
        return resposta.read(limite + 1).decode("utf-8", errors="replace")


def ler_github(url):
    """Texto com os arquivos de um repositório público (ou um arquivo só, num link /blob/). "" se não der."""
    m = GITHUB.match(url.strip())
    if not m:
        return ""
    dono, repo, tipo, ref, caminho = m.group(2), m.group(3), m.group(4), m.group(5), (m.group(6) or "")
    raw = lambda ref_, arq: f"https://raw.githubusercontent.com/{dono}/{repo}/{ref_}/{urllib.parse.quote(arq)}"
    try:
        if tipo == "blob":
            return f"Arquivo {caminho} (do GitHub):\n```\n{_baixar(raw(ref, caminho))[:GITHUB_TOTAL]}\n```"
        ref = ref or "HEAD"
        arvore = json.loads(_baixar(f"https://api.github.com/repos/{dono}/{repo}/git/trees/{ref}?recursive=1", 5_000_000))
        arquivos = [a for a in arvore.get("tree", []) if a.get("type") == "blob" and a["path"].startswith(caminho)
                    and CODIGO.search(a["path"]) and not IGNORAR.search(a["path"]) and a.get("size", 0) < 60_000]
        # README primeiro, depois os mais rasos (src/main.py antes de src/utils/x/y.py) e menores
        arquivos.sort(key=lambda a: (not a["path"].lower().split("/")[-1].startswith("readme"),
                                     a["path"].count("/"), a.get("size", 0)))
        partes, total = [f"Repositório {dono}/{repo} ({len(arquivos)} arquivos de código/texto):"], 0
        for a in arquivos[:GITHUB_ARQUIVOS]:
            if total >= GITHUB_TOTAL:
                break
            conteudo = _baixar(raw(ref, a["path"]), GITHUB_TOTAL - total)
            partes.append(f"Arquivo {a['path']}:\n```\n{conteudo}\n```")
            total += len(conteudo)
        return "\n\n".join(partes) if len(partes) > 1 else ""
    except (urllib.error.URLError, OSError, ValueError, KeyError, TypeError):
        return ""


# =========================================================
#   Sincronia: o que vai pro celular (escolha feita no PC)
# =========================================================

def opcao_sincronia():
    # padrão: tudo vai (o cofre da sincronia aguenta ~32 MB comprimidos); a opção fica pra quem quiser poupar o celular
    valor = servidores._config("sinc_entregas")
    return valor if valor in SINC_OPCOES else "tudo"


def definir_sincronia(valor):
    if valor not in SINC_OPCOES:
        raise ValueError("Opção inválida.")
    servidores._config("sinc_entregas", valor)
    return valor


def para_sincronia(retrato_estudos):
    """Tira o conteúdo dos arquivos que não vão pro celular. A nota, a correção e a
    resposta escrita sempre vão; o PC guarda os arquivos (ver importar)."""
    opcao = opcao_sincronia()
    if opcao == "tudo":
        return retrato_estudos
    em_andamento = _planos_em_andamento(retrato_estudos) if opcao == "andamento" else set()
    plano_da_sessao = {s["id"]: s["plano_id"] for s in retrato_estudos["sessoes"]}
    plano_do_item = {i["id"]: plano_da_sessao.get(i["sessao_id"]) for i in retrato_estudos["itens"]}
    entregas = []
    for e in retrato_estudos.get("entregas", []):
        if plano_do_item.get(e["item_id"]) not in em_andamento:
            e = {**e, "arquivos": [{"nome": a["nome"], "tamanho": a.get("tamanho"), "no_pc": True} for a in e["arquivos"]]}
        entregas.append(e)
    return {**retrato_estudos, "entregas": entregas}


def _planos_em_andamento(retrato_estudos):
    """Plano com algo pendente ou com sessão nas últimas 2 semanas (ou pela frente)."""
    corte = (date.today() - timedelta(days=14)).isoformat()
    pendentes = {i["sessao_id"] for i in retrato_estudos["itens"] if i["estado"] == "pendente"}
    return {s["plano_id"] for s in retrato_estudos["sessoes"] if s["data"] >= corte or s["id"] in pendentes}


# =========================================================
#   Backup
# =========================================================

COLUNAS = ["id", "item_id", "texto", "link", "arquivos", "criado_em", "situacao", "nota", "correcao", "motor", "erro"]


def exportar(con):
    return [_entrega(l) for l in con.execute("SELECT * FROM entregas ORDER BY id")]


def importar(con, entregas, antes):
    """Grava as entregas do backup. Arquivo que veio só com o nome (ficou no PC na hora
    de sincronizar) pega o conteúdo da entrega igual que já estava aqui."""
    guardados = {e["id"]: {a["nome"]: a for a in e["arquivos"]} for e in antes}
    itens = {l[0] for l in con.execute("SELECT id FROM itens")}
    for e in entregas:
        if e.get("item_id") not in itens:
            continue
        arquivos = []
        for a in e.get("arquivos") or []:
            if a.get("no_pc"):
                a = guardados.get(e["id"], {}).get(a["nome"], a)
            arquivos.append(a)
        if e.get("situacao") in ("na-fila", "corrigindo"):   # a fila de quem mandou não vem junto
            e = {**e, "situacao": "erro", "erro": "A correção não terminou no outro aparelho."}
        linha = {**e, "arquivos": json.dumps(arquivos, ensure_ascii=False),
                 "correcao": json.dumps(e["correcao"], ensure_ascii=False) if e.get("correcao") else None}
        con.execute(f"INSERT INTO entregas ({', '.join(COLUNAS)}) VALUES ({', '.join('?' * len(COLUNAS))})",
                    [linha.get(c) for c in COLUNAS])
