"""Planejador de estudos do Kaizen.

Fluxo de um plano novo:
1. A IA faz 3 perguntas rápidas sobre o assunto (nível, objetivo...).
2. Com as respostas e a disponibilidade (dias, minutos, início, semanas),
   a IA monta o ROTEIRO em blocos de até 10 sessões: tópico, objetivo,
   termos de busca e atividades. Ela nunca escreve link nem data.
3. O código distribui as sessões no calendário e o busca.py acha os
   materiais reais (vídeo que cabe no tempo + documentação oficial).

Tudo roda numa thread; a tela acompanha pelo campo "etapa" do plano.

Item marcado como "não feito" ganha uma cópia na próxima sessão do mesmo
plano (ou numa sessão de pendências criada no próximo dia de estudo).

Flashcards: o primeiro ✓ numa sessão põe ela na fila e uma thread gera os
cartões em segundo plano, então ao abrir a área de flashcards eles já estão
prontos. A revisão é espaçada (caixas de Leitner).

Perfil: um resumo, feito por código, do que a pessoa já estudou e do que
anda adiando, mais o "sobre mim" que ela escreve. Vai junto pro chat, pros
planos novos e pros flashcards, pra IA explicar a partir do que ela já sabe.
"""
from datetime import date, timedelta
from pathlib import Path
import json
import queue
import re
import sqlite3
import threading
import time
import unicodedata

import busca
import servidores

DB = None                 # o server.py aponta pro kaizen.sqlite3

# Prompts e schemas ficam num arquivo só, que a versão no navegador
# (js/nuvem) também lê — assim os dois nunca ficam diferentes.
PROMPTS = json.loads((Path(__file__).parent / "prompts.json").read_text(encoding="utf-8"))
MODELO_PADRAO = "qwen3:8b"
BLOCO = 10                # sessões por chamada à IA

CORES = ["#c90016", "#2f6f4f", "#3b5bdb", "#b8860b", "#7b2cbf", "#0b7285", "#5c5f66"]
DIAS_SEMANA = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"]


def conectar():
    con = sqlite3.connect(DB, timeout=10)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    return con


def init():
    with conectar() as con:
        con.executescript("""
            CREATE TABLE IF NOT EXISTS planos (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                tema        TEXT NOT NULL,
                respostas   TEXT NOT NULL DEFAULT '[]',
                dias        TEXT NOT NULL,
                minutos     INTEGER NOT NULL,
                horario     TEXT,
                inicio      TEXT NOT NULL,
                semanas     INTEGER NOT NULL,
                motor       TEXT NOT NULL,
                idioma      TEXT NOT NULL DEFAULT 'pt',
                cor         TEXT NOT NULL,
                status      TEXT NOT NULL DEFAULT 'gerando',
                etapa       TEXT,
                erro        TEXT,
                titulo      TEXT,
                doc_oficial TEXT,
                criado_em   TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            );
            CREATE TABLE IF NOT EXISTS sessoes (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                plano_id  INTEGER NOT NULL REFERENCES planos(id) ON DELETE CASCADE,
                data      TEXT NOT NULL,
                topico    TEXT NOT NULL,
                objetivo  TEXT,
                extra     INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS itens (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                sessao_id INTEGER NOT NULL REFERENCES sessoes(id) ON DELETE CASCADE,
                tipo      TEXT NOT NULL CHECK (tipo IN ('video', 'doc', 'atividade')),
                titulo    TEXT NOT NULL,
                url       TEXT,
                descricao TEXT,
                fonte     TEXT,
                minutos   INTEGER,
                estado    TEXT NOT NULL DEFAULT 'pendente'
                          CHECK (estado IN ('pendente', 'feito', 'nao-feito')),
                origem_id INTEGER REFERENCES itens(id) ON DELETE SET NULL
            );
            CREATE TABLE IF NOT EXISTS flashcards (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                sessao_id  INTEGER NOT NULL REFERENCES sessoes(id) ON DELETE CASCADE,
                frente     TEXT NOT NULL,
                verso      TEXT NOT NULL,
                caixa      INTEGER NOT NULL DEFAULT 0,
                revisar_em TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS perfil (
                id    INTEGER PRIMARY KEY CHECK (id = 1),
                sobre TEXT NOT NULL DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS pets_estado (
                id    INTEGER PRIMARY KEY CHECK (id = 1),
                dados TEXT NOT NULL DEFAULT '{}'
            );
            CREATE INDEX IF NOT EXISTS idx_flashcards_sessao ON flashcards(sessao_id);
            CREATE INDEX IF NOT EXISTS idx_sessoes_data ON sessoes(data);
            CREATE INDEX IF NOT EXISTS idx_itens_sessao ON itens(sessao_id);
        """)
        # bancos criados antes da opção de idioma
        colunas = {c[1] for c in con.execute("PRAGMA table_info(planos)")}
        if "idioma" not in colunas:
            con.execute("ALTER TABLE planos ADD COLUMN idioma TEXT NOT NULL DEFAULT 'pt'")
        # plano que continua outro (pet reativado): a IA sabe o que já foi estudado
        if "pai_id" not in colunas:
            con.execute("ALTER TABLE planos ADD COLUMN pai_id INTEGER")
        # planos que estavam gerando quando o servidor caiu não vão terminar
        con.execute("UPDATE planos SET status = 'erro', erro = 'O servidor reiniciou no meio da geração.' "
                    "WHERE status = 'gerando'")


# =========================================================
#   IA: Ollama (padrão, local), nuvem ou Claude Code/Gemini CLI/Codex
# =========================================================

class ErroIA(Exception):
    pass


# Motor = "<tipo>@<destino>:<modelo>". Exemplos:
#   "ollama@local:qwen3:8b", "ollama@1:qwen3:8b", "nuvem@gemini:gemini-…", "agente@claude-code:sonnet"
# Formatos antigos: "ollama:<modelo>" vale como Ollama deste computador; "claude" como o Claude Code.

def _separar_motor(motor):
    if motor == "claude":
        return "claude-code", "sonnet"
    tipo, arroba, resto = motor.partition("@")
    if arroba and tipo in ("ollama", "nuvem", "agente"):
        destino, _, modelo = resto.partition(":")
        return destino, modelo
    return "local", motor.removeprefix("ollama:")


def motores_disponiveis():
    """(motores, padrao) — modelos de todos os destinos online, e o sugerido."""
    destinos = servidores.listar_com_status()
    motores = []
    for d in sorted(destinos, key=lambda d: not d["preferido"]):
        # no Gemini, o sugerido é o que tem cota grátis (ou já funcionou)
        sugerido = servidores.modelos_para_chat("gemini", d["modelos"])[0] if d["id"] == "gemini" and d["modelos"] else None
        for nome in d["modelos"]:
            motores.append({"id": f"{d['tipo']}@{d['id']}:{nome}", "modelo": nome, "servidor": d["nome"],
                            "recomendado": nome in (MODELO_PADRAO, sugerido)})

    # sugerido: o recomendado no servidor preferido; senão o recomendado em
    # qualquer um; senão um qwen3 qualquer; senão o primeiro que houver
    padrao = next((m["id"] for m in motores if m["recomendado"]), None) \
        or next((m["id"] for m in motores if m["modelo"].startswith("qwen3")), None) \
        or (motores[0]["id"] if motores else "")
    return motores, padrao


def motor_padrao():
    return motores_disponiveis()[1] or f"ollama@local:{MODELO_PADRAO}"


def _json_do_texto(texto):
    """Extrai o primeiro objeto JSON de uma resposta em texto livre."""
    inicio, fim = texto.find("{"), texto.rfind("}")
    if inicio < 0 or fim < inicio:
        raise ErroIA("A IA não devolveu JSON.")
    try:
        return json.loads(texto[inicio:fim + 1])
    except json.JSONDecodeError as erro:
        raise ErroIA(f"JSON inválido da IA: {erro}")


def gerar_json(motor, sistema, pedido, esquema, progresso=None, limite_tokens=4096):
    """Pede um JSON à IA. `progresso(texto_parcial)` é chamado enquanto o
    Ollama escreve (streaming) — em PC lento a tela mostra que está andando.
    `limite_tokens` corta modelo que entra em repetição e não para."""
    destino_id, modelo = _separar_motor(motor)
    mensagens = [{"role": "system", "content": sistema}, {"role": "user", "content": pedido}]

    # destino escolhido primeiro; se for um Ollama fora do ar, qualquer outro
    # Ollama online que tenha o mesmo modelo (ex.: a máquina de casa desligou)
    candidatos = [destino_id] + [
        d["id"] for d in servidores.listar_com_status()
        if d["id"] != destino_id and d["tipo"] == "ollama" and d["online"] and modelo in d["modelos"]
        and not motor.startswith(("nuvem@", "agente@"))]
    erro_conexao = None
    for candidato in candidatos:
        try:
            return _json_do_texto(servidores.conversar(candidato, modelo, mensagens, formato=esquema,
                                                       progresso=progresso, limite_tokens=limite_tokens,
                                                       temperatura=0.3))
        except servidores.ErroConexao as erro:
            erro_conexao = erro
    nome = (servidores.obter(destino_id) or {}).get("nome", destino_id)
    raise ErroIA(f"Não consegui usar \"{nome}\": {erro_conexao}")


# ---------- Etapa 1: perguntas ----------

ESQUEMA_PERGUNTAS = PROMPTS["esquema_perguntas"]
SISTEMA_PERGUNTAS = PROMPTS["sistema_perguntas"]


def estudado_antes(plano_id):
    """O plano anterior de uma continuação: título e tópicos já estudados (de toda a corrente)."""
    titulos, topicos, vistos = [], [], set()
    with conectar() as con:
        while plano_id and plano_id not in vistos:
            vistos.add(plano_id)
            plano = con.execute("SELECT id, tema, titulo, pai_id FROM planos WHERE id = ?", (plano_id,)).fetchone()
            if not plano:
                break
            titulos.append(plano["titulo"] or plano["tema"])
            topicos[:0] = [l["topico"] for l in con.execute("""
                SELECT topico FROM sessoes s WHERE plano_id = ? AND extra = 0
                  AND EXISTS (SELECT 1 FROM itens i WHERE i.sessao_id = s.id AND (i.estado = 'feito'
                       OR EXISTS (SELECT 1 FROM itens c WHERE c.origem_id = i.id AND c.estado = 'feito')))
                ORDER BY data, id""", (plano["id"],))]
            plano_id = plano["pai_id"]
    if not titulos:
        return ""
    return (f"Continuação de \"{titulos[0]}\". Já estudou: " + (", ".join(dict.fromkeys(topicos)) or "pouca coisa") + ".")


def perguntas(tema, motor, continua_de=None):
    pedido = f"Assunto: {tema}"
    anterior = estudado_antes(continua_de) if continua_de else ""
    if anterior:
        pedido += (f"\n{anterior}\nO estudante quer ir além do que já viu: faça as perguntas pensando no "
                   "próximo passo, mais aprofundado, sem perguntar o básico que ele já estudou.")
    dados = gerar_json(motor, SISTEMA_PERGUNTAS, pedido, ESQUEMA_PERGUNTAS, limite_tokens=1024)
    saida = []
    for p in dados.get("perguntas", [])[:4]:
        if isinstance(p, dict) and str(p.get("pergunta", "")).strip():
            opcoes = [str(o).strip() for o in p.get("opcoes", []) if str(o).strip()][:4]
            saida.append({"pergunta": p["pergunta"].strip(), "opcoes": opcoes})
    if not saida:
        raise ErroIA("A IA não conseguiu sugerir perguntas.")
    return saida


# ---------- Etapa 2: roteiro ----------

ESQUEMA_ROTEIRO = PROMPTS["esquema_roteiro"]
SISTEMA_ROTEIRO = PROMPTS["sistema_roteiro"]


def _pedido_roteiro(plano, respostas, total, feitas, quantas):
    linhas = [f"Assunto: {plano['tema']}"]
    for r in respostas:
        if r.get("resposta"):
            linhas.append(f"{r['pergunta']} {r['resposta']}")
    linhas += [f"Duração de cada sessão: {plano['minutos']} minutos",
               f"Idioma dos materiais (vídeos e documentação): {busca.IDIOMAS[plano['idioma']]['nome']}",
               f"O roteiro completo tem {total} sessões."]
    anterior = estudado_antes(plano.get("pai_id")) if plano.get("pai_id") else ""
    if anterior:
        linhas.append(anterior + " Este plano aprofunda: comece de onde ele parou e não repita esses tópicos.")
    historico = perfil_texto(excluir_plano=plano["id"])
    if historico:
        linhas.append("O que o estudante já estudou em outros planos (aproveite e não repita o básico que ele já sabe):\n"
                      + historico)
    if feitas:
        linhas.append("Já planejado (não repita): " + "; ".join(f"{i}. {s['topico']}" for i, s in enumerate(feitas, 1)))
    ultimo = len(feitas) + quantas >= total
    linhas.append(f"Gere agora as sessões {len(feitas) + 1} a {len(feitas) + quantas} "
                  f"({quantas} sessões).{' Este é o último bloco.' if ultimo else ''}")
    if plano["idioma"] != "pt":
        # sem isso o modelo tende a escrever o plano todo no idioma dos materiais
        linhas.append("Escreva título, tópicos, objetivos e atividades em PORTUGUÊS DO BRASIL; "
                      "só o campo busca_video vai no idioma dos materiais.")
    return "\n".join(linhas)


def datas_de_estudo(inicio, dias, quantidade, depois_de=None):
    """Próximas `quantidade` datas (a partir de inicio) que caem nos dias escolhidos."""
    atual = date.fromisoformat(inicio)
    if depois_de:
        atual = max(atual, date.fromisoformat(depois_de) + timedelta(days=1))
    datas = []
    while len(datas) < quantidade:
        if atual.weekday() in dias:
            datas.append(atual.isoformat())
        atual += timedelta(days=1)
    return datas


def _chave_topico(topico):
    """Pra achar tópico repetido: sem acento, maiúscula, pontuação e prefixo como "Sessão 11:"."""
    t = unicodedata.normalize("NFKD", topico).encode("ascii", "ignore").decode().lower()
    t = re.sub(r"^\s*(sessao|aula|dia|semana|modulo|parte)\s*\d+\s*[:.\-]*\s*", "", t)
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


PREFIXO_TOPICO = re.compile(r"^\s*(sess[aã]o|aula|dia|semana|m[oó]dulo|parte)\s*\d+\s*[:.\-–]*\s*", re.IGNORECASE)


def _etapa(plano_id, texto):
    with conectar() as con:
        con.execute("UPDATE planos SET etapa = ? WHERE id = ?", (texto, plano_id))


def _gerar_plano(plano_id):
    try:
        with conectar() as con:
            plano = dict(con.execute("SELECT * FROM planos WHERE id = ?", (plano_id,)).fetchone())
        dias = json.loads(plano["dias"])
        respostas = json.loads(plano["respostas"])
        total = len(dias) * plano["semanas"]

        # --- roteiro, em blocos ---
        roteiro, titulo, doc_oficial = [], None, ""
        vistos = set()
        # modelo pequeno repete tópico; a repetida é descartada e o próximo pedido
        # repõe — com um teto, pra nunca ficar em loop
        pedidos, max_pedidos = 0, -(-total // BLOCO) + 3
        while len(roteiro) < total and pedidos < max_pedidos:
            pedidos += 1
            quantas = min(BLOCO, total - len(roteiro))
            inicio_bloco = len(roteiro)
            ultima = [-1]
            _etapa(plano_id, f"Montando o roteiro: sessão {inicio_bloco + 1} de {total}")

            def ao_escrever(parcial):
                # cada "topico" que aparece no texto parcial é uma sessão nova
                n = min(parcial.count('"topico"'), quantas)
                if n != ultima[0] and n > 0:
                    ultima[0] = n
                    _etapa(plano_id, f"Montando o roteiro: sessão {inicio_bloco + n} de {total}")

            dados = gerar_json(plano["motor"], SISTEMA_ROTEIRO,
                               _pedido_roteiro(plano, respostas, total, roteiro, quantas), ESQUEMA_ROTEIRO,
                               progresso=ao_escrever, limite_tokens=350 * quantas + 600)
            novas = []
            for sessao in dados.get("sessoes", []):
                chave = _chave_topico(str(sessao.get("topico", "")))
                if chave and chave not in vistos:
                    vistos.add(chave)
                    # "Sessão 11: Mini projeto" -> "Mini projeto" (a data já diz qual é)
                    sessao["topico"] = PREFIXO_TOPICO.sub("", sessao["topico"]).strip() or sessao["topico"]
                    novas.append(sessao)
            roteiro += novas[:quantas]
            titulo = titulo or dados.get("titulo")
            doc_oficial = doc_oficial or dados.get("documentacao_oficial", "")

        if not roteiro:
            raise ErroIA("A IA não conseguiu montar o roteiro.")

        # --- materiais ---
        _etapa(plano_id, "Buscando vídeos e documentação…")
        idioma = busca.idioma_valido(plano["idioma"])
        ignorar = [plano["tema"]] + doc_oficial.split(".")[:1]
        minutos_video = max(8, round(plano["minutos"] * 0.5))
        busca.paginas_oficiais(doc_oficial, idioma)  # baixa o índice uma vez antes do paralelo
        feitos = [0]
        trava = threading.Lock()

        def materiais(sessao):
            consulta = sessao.get("busca_video") or f"{sessao['topico']} {plano['tema']} {busca.IDIOMAS[idioma]['aula']}"
            videos = busca.buscar_videos(consulta, minutos_max=minutos_video, limite=8, idioma=idioma)
            # título original (não o traduzido pelo YouTube) e, entre os que
            # cabem na sessão, aula no idioma escolhido primeiro
            videos = [busca.titulo_original(v) for v in videos]
            videos.sort(key=lambda v: ((v.get("minutos") or 0) > minutos_video,
                                       not busca.parece_idioma(v["titulo"], idioma)))
            # sitemap: casa com tópico + termos; busca web: assunto + termos técnicos
            # no idioma dos materiais (o tópico em português puxaria página em português)
            docs = busca.buscar_documentacao(
                f"{sessao.get('termos_doc', '')} {sessao['topico']}", doc_oficial, ignorar=ignorar, limite=2,
                idioma=idioma,
                consulta_web=f"{plano['tema']} {sessao.get('termos_doc', '')} {busca.IDIOMAS[idioma]['documentacao']}")
            with trava:
                feitos[0] += 1
                _etapa(plano_id, f"Buscando vídeos e documentação: {feitos[0]} de {len(roteiro)} sessões")
            return videos, docs

        achados = busca.em_paralelo(materiais, roteiro, paralelo=4)

        # --- grava tudo ---
        datas = datas_de_estudo(plano["inicio"], dias, len(roteiro))
        videos_usados = set()
        with conectar() as con:
            for sessao, data, (videos, docs) in zip(roteiro, datas, achados):
                sid = con.execute("INSERT INTO sessoes (plano_id, data, topico, objetivo) VALUES (?, ?, ?, ?)",
                                  (plano_id, data, sessao["topico"].strip(), sessao.get("objetivo", "").strip())).lastrowid
                video = next((v for v in videos if v["url"] not in videos_usados), None)
                materiais_sessao = ([video] if video else []) + docs
                if video:
                    videos_usados.add(video["url"])
                for m in materiais_sessao:
                    con.execute("INSERT INTO itens (sessao_id, tipo, titulo, url, fonte, minutos) VALUES (?, ?, ?, ?, ?, ?)",
                                (sid, m["tipo"], m["titulo"][:200], m["url"], m.get("fonte"), m.get("minutos")))
                for a in sessao.get("atividades", [])[:3]:
                    if str(a.get("titulo", "")).strip():
                        con.execute("INSERT INTO itens (sessao_id, tipo, titulo, descricao, minutos) VALUES (?, 'atividade', ?, ?, ?)",
                                    (sid, a["titulo"].strip()[:200], str(a.get("descricao", "")).strip(),
                                     a.get("minutos") if isinstance(a.get("minutos"), int) else None))
            con.execute("UPDATE planos SET status = 'pronto', etapa = NULL, titulo = ?, doc_oficial = ? WHERE id = ?",
                        (titulo or plano["tema"], doc_oficial, plano_id))

    except Exception as erro:  # a thread nunca pode morrer calada
        with conectar() as con:
            con.execute("UPDATE planos SET status = 'erro', etapa = NULL, erro = ? WHERE id = ?",
                        (str(erro)[:500] or type(erro).__name__, plano_id))


# =========================================================
#   Operações usadas pelas rotas
# =========================================================

def criar_plano(dados):
    tema = str(dados.get("tema", "")).strip()
    dias = sorted({int(d) for d in dados.get("dias", []) if str(d).isdigit() and 0 <= int(d) <= 6})
    minutos = int(dados.get("minutos") or 60)
    semanas = int(dados.get("semanas") or 4)
    inicio = str(dados.get("inicio") or date.today().isoformat())
    date.fromisoformat(inicio)  # valida
    if not tema:
        raise ValueError("Diga o que você quer estudar.")
    if not dias:
        raise ValueError("Escolha pelo menos um dia da semana.")
    if not 10 <= minutos <= 480 or not 1 <= semanas <= 26:
        raise ValueError("Minutos ou semanas fora do intervalo.")
    pai_id = int(dados["pai_id"]) if str(dados.get("pai_id") or "").isdigit() else None

    with conectar() as con:
        if pai_id and not con.execute("SELECT 1 FROM planos WHERE id = ?", (pai_id,)).fetchone():
            pai_id = None
        # a continuação fica com a cor do plano anterior (é o mesmo pet)
        pai = con.execute("SELECT cor FROM planos WHERE id = ?", (pai_id,)).fetchone() if pai_id else None
        cor = pai["cor"] if pai else CORES[con.execute("SELECT COUNT(*) FROM planos").fetchone()[0] % len(CORES)]
        plano_id = con.execute(
            "INSERT INTO planos (tema, respostas, dias, minutos, horario, inicio, semanas, motor, idioma, cor, etapa, pai_id) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Na fila…', ?)",
            (tema, json.dumps(dados.get("respostas", []), ensure_ascii=False), json.dumps(dias), minutos,
             dados.get("horario") or None, inicio, semanas, dados.get("motor") or motor_padrao(),
             busca.idioma_valido(dados.get("idioma")), cor, pai_id)
        ).lastrowid
    threading.Thread(target=_gerar_plano, args=(plano_id,), daemon=True).start()
    return obter_plano(plano_id)


def obter_plano(plano_id):
    with conectar() as con:
        linha = con.execute(f"{_SELECT_PLANOS} WHERE p.id = ? GROUP BY p.id", (plano_id,)).fetchone()
    return _plano(linha) if linha else None


_SELECT_PLANOS = """
    SELECT p.*, COUNT(i.id) AS total_itens,
           COALESCE(SUM(i.estado = 'feito'), 0) AS itens_feitos,
           MIN(s.data) AS primeira_data, MAX(s.data) AS ultima_data
    FROM planos p
    LEFT JOIN sessoes s ON s.plano_id = p.id
    LEFT JOIN itens i ON i.sessao_id = s.id AND i.estado != 'nao-feito'
"""


def _plano(linha):
    p = dict(linha)
    p["dias"] = json.loads(p["dias"])
    p.pop("respostas", None)
    return p


def listar_planos():
    with conectar() as con:
        return [_plano(l) for l in con.execute(f"{_SELECT_PLANOS} GROUP BY p.id ORDER BY p.id DESC")]


def excluir_plano(plano_id):
    with conectar() as con:
        con.execute("DELETE FROM planos WHERE id = ?", (plano_id,))


def calendario(inicio, fim):
    """Sessões no intervalo, com contagem de itens por estado."""
    with conectar() as con:
        linhas = con.execute("""
            SELECT s.id, s.data, s.topico, s.extra, p.id AS plano_id, p.tema, p.cor, p.horario,
                   COUNT(i.id) AS total,
                   COALESCE(SUM(i.estado = 'feito'), 0) AS feitos,
                   COALESCE(SUM(i.estado = 'nao-feito'), 0) AS nao_feitos
            FROM sessoes s
            JOIN planos p ON p.id = s.plano_id
            LEFT JOIN itens i ON i.sessao_id = s.id
            WHERE s.data BETWEEN ? AND ?
            GROUP BY s.id
            ORDER BY s.data, p.horario IS NULL, p.horario, s.id
        """, (inicio, fim)).fetchall()
    return [dict(l) for l in linhas]


def obter_sessao(sessao_id):
    with conectar() as con:
        sessao = con.execute("""
            SELECT s.*, p.tema, p.cor, p.horario, p.minutos, p.titulo AS plano_titulo
            FROM sessoes s JOIN planos p ON p.id = s.plano_id WHERE s.id = ?
        """, (sessao_id,)).fetchone()
        if not sessao:
            return None
        itens = con.execute("""
            SELECT i.*,
                   so.data AS veio_de,
                   (SELECT sd.data FROM itens c JOIN sessoes sd ON sd.id = c.sessao_id
                     WHERE c.origem_id = i.id) AS foi_para
            FROM itens i
            LEFT JOIN itens o ON o.id = i.origem_id
            LEFT JOIN sessoes so ON so.id = o.sessao_id
            WHERE i.sessao_id = ?
            ORDER BY CASE i.tipo WHEN 'video' THEN 0 WHEN 'doc' THEN 1 ELSE 2 END, i.id
        """, (sessao_id,)).fetchall()
    resultado = dict(sessao)
    resultado["itens"] = [dict(i) for i in itens]
    return resultado


def _proxima_sessao(con, sessao):
    """Próxima sessão do mesmo plano a partir de amanhã; cria uma de pendências se não houver."""
    referencia = max(sessao["data"], (date.today() - timedelta(days=1)).isoformat())
    proxima = con.execute(
        "SELECT * FROM sessoes WHERE plano_id = ? AND data > ? ORDER BY data, id LIMIT 1",
        (sessao["plano_id"], referencia)).fetchone()
    if proxima:
        return proxima

    plano = con.execute("SELECT * FROM planos WHERE id = ?", (sessao["plano_id"],)).fetchone()
    ultima = con.execute("SELECT MAX(data) FROM sessoes WHERE plano_id = ?", (sessao["plano_id"],)).fetchone()[0]
    data = datas_de_estudo(plano["inicio"], json.loads(plano["dias"]), 1, depois_de=max(ultima, referencia))[0]
    sid = con.execute("INSERT INTO sessoes (plano_id, data, topico, objetivo, extra) VALUES (?, ?, ?, ?, 1)",
                      (sessao["plano_id"], data, "Pendências", "Terminar o que ficou para trás.")).lastrowid
    return con.execute("SELECT * FROM sessoes WHERE id = ?", (sid,)).fetchone()


def marcar_item(item_id, estado):
    """Muda o estado; 'nao-feito' leva uma cópia pra próxima sessão. Devolve a sessão atualizada."""
    if estado not in ("pendente", "feito", "nao-feito"):
        raise ValueError("Estado inválido.")
    with conectar() as con:
        item = con.execute("SELECT * FROM itens WHERE id = ?", (item_id,)).fetchone()
        if not item:
            return None
        sessao = con.execute("SELECT * FROM sessoes WHERE id = ?", (item["sessao_id"],)).fetchone()
        con.execute("UPDATE itens SET estado = ? WHERE id = ?", (estado, item_id))

        copia = con.execute("SELECT * FROM itens WHERE origem_id = ?", (item_id,)).fetchone()
        if estado == "nao-feito" and not copia:
            destino = _proxima_sessao(con, sessao)
            con.execute("INSERT INTO itens (sessao_id, tipo, titulo, url, descricao, fonte, minutos, origem_id) "
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        (destino["id"], item["tipo"], item["titulo"], item["url"], item["descricao"],
                         item["fonte"], item["minutos"], item_id))
        elif estado != "nao-feito" and copia and copia["estado"] == "pendente":
            # desmarcou: a cópia volta atrás, se ainda não foi mexida
            con.execute("DELETE FROM itens WHERE id = ?", (copia["id"],))
            con.execute("DELETE FROM sessoes WHERE id = ? AND extra = 1 "
                        "AND NOT EXISTS (SELECT 1 FROM itens WHERE sessao_id = ?)",
                        (copia["sessao_id"], copia["sessao_id"]))
        # feito numa sessão de pendências conta pro conteúdo de onde o item veio
        conteudo = sessao["id"]
        if estado == "feito" and sessao["extra"] and item["origem_id"]:
            origem = con.execute("SELECT sessao_id FROM itens WHERE id = ?", (item["origem_id"],)).fetchone()
            conteudo = origem["sessao_id"] if origem else None
    if estado == "feito" and conteudo:
        pedir_flashcards(conteudo)
    return obter_sessao(sessao["id"])


def adiar_pendentes(sessao_id):
    """Tudo que ainda está pendente na sessão vira 'não feito' (e vai pra próxima)."""
    with conectar() as con:
        ids = [l[0] for l in con.execute(
            "SELECT id FROM itens WHERE sessao_id = ? AND estado = 'pendente'", (sessao_id,))]
    for item_id in ids:
        marcar_item(item_id, "nao-feito")
    return obter_sessao(sessao_id)


# =========================================================
#   Perfil: o que a IA sabe sobre a pessoa
# =========================================================

def obter_sobre():
    with conectar() as con:
        linha = con.execute("SELECT sobre FROM perfil WHERE id = 1").fetchone()
    return linha["sobre"] if linha else ""


def salvar_sobre(texto):
    texto = str(texto or "").strip()[:1500]
    with conectar() as con:
        con.execute("INSERT INTO perfil (id, sobre) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET sobre = excluded.sobre",
                    (texto,))
    return texto


def perfil_texto(excluir_plano=None):
    """Resumo curto pra IA, montado por código (não gasta IA nem tempo):
    por plano, o que a pessoa respondeu nas perguntas, o que já concluiu
    (os mais recentes) e o que vive adiando."""
    with conectar() as con:
        planos = con.execute("SELECT id, tema, respostas FROM planos WHERE status = 'pronto' AND id IS NOT ? "
                             "ORDER BY id DESC LIMIT 8", (excluir_plano,)).fetchall()
        linhas = []
        for plano in planos:
            feitos = [l["topico"] for l in con.execute("""
                SELECT s.topico, MAX(s.data) AS quando FROM sessoes s
                WHERE s.plano_id = ? AND s.extra = 0
                  AND EXISTS (SELECT 1 FROM itens i WHERE i.sessao_id = s.id AND (i.estado = 'feito'
                       OR EXISTS (SELECT 1 FROM itens c WHERE c.origem_id = i.id AND c.estado = 'feito')))
                GROUP BY s.topico ORDER BY quando DESC LIMIT 12""", (plano["id"],))]
            adiados = [l["topico"] for l in con.execute("""
                SELECT s.topico FROM sessoes s JOIN itens i ON i.sessao_id = s.id
                WHERE s.plano_id = ? AND s.extra = 0 AND i.estado = 'nao-feito'
                GROUP BY s.topico ORDER BY COUNT(*) DESC LIMIT 4""", (plano["id"],))]
            respostas = [r.get("resposta", "").strip() for r in json.loads(plano["respostas"] or "[]")
                         if isinstance(r, dict) and r.get("resposta")]
            linha = f"- {plano['tema']}"
            if respostas:
                linha += f" (contou: {'; '.join(respostas[:3])})"
            linha += (": já estudou " + ", ".join(reversed(feitos)) + ".") if feitos else ": ainda não concluiu nenhuma sessão."
            if adiados:
                linha += " Adiou: " + ", ".join(adiados) + "."
            linhas.append(linha)
    sobre = obter_sobre()
    if sobre:
        linhas.append(f"- O que a pessoa contou sobre si: {sobre}")
    return "\n".join(linhas)


def perfil():
    return {"texto": perfil_texto(), "sobre": obter_sobre()}


# =========================================================
#   Flashcards
# =========================================================

ESQUEMA_FLASHCARDS = PROMPTS["esquema_flashcards"]
SISTEMA_FLASHCARDS = PROMPTS["sistema_flashcards"]
INTERVALOS = [0, 1, 3, 7, 14, 30]   # dias até revisar de novo, por caixa
JANELA = 14                          # dias de conteúdo estudado que aparecem

_fila = queue.Queue()                # uma geração por vez: o Ollama local não aguenta várias juntas
_na_fila = set()
_falhas = {}                         # sessao_id -> (quando, erro): não tenta de novo sem parar
_trava = threading.Lock()
_trabalhador = None


def pedir_flashcards(sessao_id, forcar=False):
    """Põe a sessão na fila de geração (quem gera confere se já tem cartões)."""
    global _trabalhador
    with _trava:
        if sessao_id in _na_fila:
            return
        falha = _falhas.get(sessao_id)
        if falha and not forcar and time.time() - falha[0] < 600:
            return
        _na_fila.add(sessao_id)
        _falhas.pop(sessao_id, None)
        _fila.put((sessao_id, forcar))
        if not _trabalhador or not _trabalhador.is_alive():
            _trabalhador = threading.Thread(target=_trabalhar, daemon=True)
            _trabalhador.start()


def _trabalhar():
    while True:
        try:
            sessao_id, forcar = _fila.get(timeout=30)
        except queue.Empty:
            return
        try:
            _gerar_flashcards(sessao_id, forcar)
        except Exception as erro:  # qualquer falha só marca a sessão; a fila segue
            _falhas[sessao_id] = (time.time(), str(erro))
        finally:
            with _trava:
                _na_fila.discard(sessao_id)


def _pedido_flashcards(con, sessao):
    itens = con.execute("SELECT tipo, titulo, descricao FROM itens WHERE sessao_id = ? ORDER BY id",
                        (sessao["id"],)).fetchall()
    linhas = [f"Assunto do plano: {sessao['tema']}", f"Tópico da sessão: {sessao['topico']}"]
    if sessao["objetivo"]:
        linhas.append(f"Objetivo da sessão: {sessao['objetivo']}")
    for i in itens:
        if i["tipo"] == "atividade":
            linhas.append(f"Atividade: {i['descricao'] or i['titulo']}")
        else:
            linhas.append(f"Material estudado: {i['titulo']}")
    historico = perfil_texto()
    if historico:
        linhas.append("Quem é o estudante (ajuste o nível):\n" + historico)
    return "\n".join(linhas)


# resposta cortada no meio (modelo pequeno que esquece de escapar aspas) fica curta ou para numa palavra de ligação
CORTADA = re.compile(r"\b(o|a|os|as|um|uma|de|do|da|dos|das|e|com|para|pra|em|no|na|que|por|ao)$", re.IGNORECASE)


def cartoes_bons(lista):
    """Tira cartão vazio, cortado no meio e repetido."""
    vistos, bons = set(), []
    for c in lista if isinstance(lista, list) else []:
        if not isinstance(c, dict):
            continue
        frente, verso = str(c.get("frente", "")).strip(), str(c.get("verso", "")).strip()
        if (len(frente) < 8 or len(verso.split()) < 4 or CORTADA.search(verso) or verso.endswith((",", "\""))
                or frente.lower() in vistos):
            continue
        vistos.add(frente.lower())
        bons.append((frente, verso))
    return bons[:8]


def _gerar_flashcards(sessao_id, forcar):
    with conectar() as con:
        sessao = con.execute("SELECT s.*, p.tema, p.motor FROM sessoes s JOIN planos p ON p.id = s.plano_id "
                             "WHERE s.id = ?", (sessao_id,)).fetchone()
        if not sessao:
            return
        if not forcar and con.execute("SELECT 1 FROM flashcards WHERE sessao_id = ?", (sessao_id,)).fetchone():
            return
        pedido = _pedido_flashcards(con, sessao)

    motor = sessao["motor"]
    cartoes_novos = []
    for _ in range(2):  # modelo pequeno às vezes devolve lista vazia ou cartão cortado: tenta mais uma vez
        try:
            dados = gerar_json(motor, SISTEMA_FLASHCARDS, pedido, ESQUEMA_FLASHCARDS, limite_tokens=1500)
        except ErroIA:
            # o motor do plano sumiu (conta removida, PC desligado): vai o padrão de agora
            if motor != sessao["motor"] or motor_padrao() == motor:
                raise
            motor = motor_padrao()
            dados = gerar_json(motor, SISTEMA_FLASHCARDS, pedido, ESQUEMA_FLASHCARDS, limite_tokens=1500)
        cartoes_novos = cartoes_bons(dados.get("cartoes"))
        if len(cartoes_novos) >= 3:
            break
    if not cartoes_novos:
        raise ErroIA("A IA não devolveu cartões.")

    hoje = date.today().isoformat()
    with conectar() as con:
        if forcar:
            con.execute("DELETE FROM flashcards WHERE sessao_id = ?", (sessao_id,))
        elif con.execute("SELECT 1 FROM flashcards WHERE sessao_id = ?", (sessao_id,)).fetchone():
            return
        con.executemany("INSERT INTO flashcards (sessao_id, frente, verso, revisar_em) VALUES (?, ?, ?, ?)",
                        [(sessao_id, f, v, hoje) for f, v in cartoes_novos])


def listar_flashcards():
    """Conteúdos dos últimos dias (e os mais antigos com revisão pra hoje).
    O que foi estudado e ainda não tem cartões entra na fila aqui mesmo."""
    hoje = date.today().isoformat()
    desde = (date.today() - timedelta(days=JANELA)).isoformat()
    with conectar() as con:
        linhas = con.execute("""
            SELECT s.id, s.plano_id, s.topico, s.data, p.tema, p.titulo AS plano_titulo, p.cor,
                   (SELECT COUNT(*) FROM flashcards f WHERE f.sessao_id = s.id) AS total,
                   (SELECT COUNT(*) FROM flashcards f WHERE f.sessao_id = s.id AND f.revisar_em <= ?) AS para_hoje
            FROM sessoes s JOIN planos p ON p.id = s.plano_id
            WHERE s.extra = 0 AND (
                (s.data BETWEEN ? AND ? AND EXISTS (
                    SELECT 1 FROM itens i WHERE i.sessao_id = s.id AND (i.estado = 'feito'
                      OR EXISTS (SELECT 1 FROM itens c WHERE c.origem_id = i.id AND c.estado = 'feito'))))
                OR EXISTS (SELECT 1 FROM flashcards f WHERE f.sessao_id = s.id AND f.revisar_em <= ?))
            ORDER BY s.data DESC, s.id DESC
        """, (hoje, desde, hoje, hoje)).fetchall()

    conteudos = []
    for linha in linhas:
        c = dict(linha)
        c["sessao_id"] = c.pop("id")
        if not c["total"]:
            pedir_flashcards(c["sessao_id"])
        falha = None if c["total"] else _falhas.get(c["sessao_id"])
        c["situacao"] = "pronto" if c["total"] else "erro" if falha else "gerando"
        c["erro"] = falha[1] if falha else None
        conteudos.append(c)
    return {"conteudos": conteudos, "para_hoje": sum(c["para_hoje"] for c in conteudos)}


def cartoes(sessao_id=None):
    """Cartões de um conteúdo (os de hoje primeiro) ou, sem conteúdo, todos os de hoje.
    Conteúdo antigo sem cartões (aberto pelo jardim dos pets) entra na fila."""
    hoje = date.today().isoformat()
    with conectar() as con:
        if sessao_id:
            linhas = con.execute("""
                SELECT f.*, s.topico FROM flashcards f JOIN sessoes s ON s.id = f.sessao_id
                WHERE f.sessao_id = ? ORDER BY f.revisar_em > ?, f.caixa, f.id""", (sessao_id, hoje)).fetchall()
            if not linhas:
                pedir_flashcards(sessao_id)
        else:
            linhas = con.execute("""
                SELECT f.*, s.topico FROM flashcards f JOIN sessoes s ON s.id = f.sessao_id
                WHERE f.revisar_em <= ? ORDER BY f.caixa, s.data, f.id""", (hoje,)).fetchall()
        return [dict(l) for l in linhas]


def responder_cartao(cartao_id, acertou):
    """Acertou: sobe uma caixa e volta mais tarde. Errou: volta pra caixa 0 (hoje)."""
    with conectar() as con:
        cartao = con.execute("SELECT * FROM flashcards WHERE id = ?", (cartao_id,)).fetchone()
        if not cartao:
            return None
        caixa = min(cartao["caixa"] + 1, len(INTERVALOS) - 1) if acertou else 0
        quando = (date.today() + timedelta(days=INTERVALOS[caixa])).isoformat()
        con.execute("UPDATE flashcards SET caixa = ?, revisar_em = ? WHERE id = ?", (caixa, quando, cartao_id))
        return dict(con.execute("SELECT * FROM flashcards WHERE id = ?", (cartao_id,)).fetchone())


# =========================================================
#   Pets (opcional): o servidor só guarda; a regra fica no js/pets.js
# =========================================================

def obter_pets():
    with conectar() as con:
        linha = con.execute("SELECT dados FROM pets_estado WHERE id = 1").fetchone()
    return json.loads(linha["dados"]) if linha else {}


def salvar_pets(dados):
    if not isinstance(dados, dict):
        raise ValueError("Estado dos pets inválido.")
    texto = json.dumps(dados, ensure_ascii=False)
    if len(texto) > 200_000:
        raise ValueError("Estado dos pets grande demais.")
    with conectar() as con:
        con.execute("INSERT INTO pets_estado (id, dados) VALUES (1, ?) "
                    "ON CONFLICT(id) DO UPDATE SET dados = excluded.dados", (texto,))
    return dados


# =========================================================
#   Backup (mesmo formato do modo nuvem: dá pra levar do
#   celular pro PC e vice-versa)
# =========================================================

COLUNAS_PLANO = ["id", "tema", "respostas", "dias", "minutos", "horario", "inicio", "semanas", "motor", "idioma",
                 "cor", "status", "etapa", "erro", "titulo", "doc_oficial", "criado_em", "pai_id"]
COLUNAS_SESSAO = ["id", "plano_id", "data", "topico", "objetivo", "extra"]
COLUNAS_ITEM = ["id", "sessao_id", "tipo", "titulo", "url", "descricao", "fonte", "minutos", "estado", "origem_id"]
COLUNAS_CARTAO = ["id", "sessao_id", "frente", "verso", "caixa", "revisar_em"]


def exportar():
    with conectar() as con:
        planos = []
        for linha in con.execute("SELECT * FROM planos ORDER BY id"):
            p = dict(linha)
            p["dias"] = json.loads(p["dias"])
            p["respostas"] = json.loads(p["respostas"] or "[]")
            planos.append(p)
        sessoes = [dict(l) for l in con.execute("SELECT * FROM sessoes ORDER BY id")]
        itens = [dict(l) for l in con.execute("SELECT * FROM itens ORDER BY id")]
        flashcards = [dict(l) for l in con.execute("SELECT * FROM flashcards ORDER BY id")]
    return {"planos": planos, "sessoes": sessoes, "itens": itens, "flashcards": flashcards,
            "perfil": {"sobre": obter_sobre()}, "pets": obter_pets()}


def importar(dados):
    """Substitui todos os planos pelos do backup (mantém os ids, que ligam
    planos, sessões, itens e as cópias do "não fiz")."""
    planos, sessoes, itens = (dados.get(k) or [] for k in ("planos", "sessoes", "itens"))
    if not all(isinstance(x, list) for x in (planos, sessoes, itens)):
        raise ValueError("Backup com formato inválido.")

    with conectar() as con:
        cartoes_antes = [dict(l) for l in con.execute("SELECT * FROM flashcards")]
        con.execute("DELETE FROM itens")
        con.execute("DELETE FROM sessoes")
        con.execute("DELETE FROM planos")
        for p in planos:
            p = {**p, "dias": json.dumps(p.get("dias") or []), "respostas": json.dumps(p.get("respostas") or [],
                                                                                         ensure_ascii=False)}
            if p.get("status") == "gerando":  # não tem mais quem termine
                p.update(status="erro", etapa=None, erro="O backup foi feito no meio da geração.")
            p.setdefault("idioma", "pt")
            con.execute(f"INSERT INTO planos ({', '.join(COLUNAS_PLANO)}) VALUES ({', '.join('?' * len(COLUNAS_PLANO))})",
                        [p.get(c) for c in COLUNAS_PLANO])
        # ordem por id: a cópia de um "não fiz" sempre vem depois do original
        for s in sorted(sessoes, key=lambda x: x["id"]):
            con.execute(f"INSERT INTO sessoes ({', '.join(COLUNAS_SESSAO)}) VALUES ({', '.join('?' * len(COLUNAS_SESSAO))})",
                        [s.get(c) for c in COLUNAS_SESSAO])
        for i in sorted(itens, key=lambda x: x["id"]):
            con.execute(f"INSERT INTO itens ({', '.join(COLUNAS_ITEM)}) VALUES ({', '.join('?' * len(COLUNAS_ITEM))})",
                        [i.get(c) for c in COLUNAS_ITEM])
        # backup de versão antiga não tem cartões: ficam os daqui que ainda têm sessão
        sessoes_ok = {s["id"] for s in sessoes}
        for f in (cartoes_antes if dados.get("flashcards") is None else dados["flashcards"]):
            if f.get("sessao_id") in sessoes_ok:
                con.execute(f"INSERT INTO flashcards ({', '.join(COLUNAS_CARTAO)}) "
                            f"VALUES ({', '.join('?' * len(COLUNAS_CARTAO))})", [f.get(c) for c in COLUNAS_CARTAO])
    if isinstance(dados.get("perfil"), dict) and "sobre" in dados["perfil"]:
        salvar_sobre(dados["perfil"]["sobre"])
    if isinstance(dados.get("pets"), dict):
        salvar_pets(dados["pets"])
