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
"""
from datetime import date, datetime, timedelta
import json
import os
import re
import shutil
import sqlite3
import subprocess
import threading
import urllib.error
import urllib.request

import busca

DB = None                 # o server.py aponta pro kaizen.sqlite3
OLLAMA_URL = "http://127.0.0.1:11434"
MODELO_PADRAO = "qwen3:8b"
MODELO_CLAUDE = "sonnet"
CLAUDE_BIN = shutil.which("claude") or os.path.expanduser("~/.npm-global/bin/claude")
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
            CREATE INDEX IF NOT EXISTS idx_sessoes_data ON sessoes(data);
            CREATE INDEX IF NOT EXISTS idx_itens_sessao ON itens(sessao_id);
        """)
        # planos que estavam gerando quando o servidor caiu não vão terminar
        con.execute("UPDATE planos SET status = 'erro', erro = 'O servidor reiniciou no meio da geração.' "
                    "WHERE status = 'gerando'")


# =========================================================
#   IA: Ollama (padrão, local) ou Claude Code (opcional)
# =========================================================

class ErroIA(Exception):
    pass


def motores_disponiveis():
    """[{id, nome, recomendado}] — o que dá pra escolher na tela."""
    motores = []
    try:
        with urllib.request.urlopen(f"{OLLAMA_URL}/api/tags", timeout=2) as r:
            nomes = sorted(m["name"] for m in json.loads(r.read()).get("models", []))
        for nome in nomes:
            motores.append({"id": f"ollama:{nome}", "nome": f"{nome} (local)", "recomendado": nome == MODELO_PADRAO})
    except (urllib.error.URLError, OSError, ValueError):
        pass
    if os.path.exists(CLAUDE_BIN):
        motores.append({"id": "claude", "nome": "Claude (sua conta)", "recomendado": False})
    motores.sort(key=lambda m: not m["recomendado"])
    return motores


def _json_do_texto(texto):
    """Extrai o primeiro objeto JSON de uma resposta em texto livre."""
    inicio, fim = texto.find("{"), texto.rfind("}")
    if inicio < 0 or fim < inicio:
        raise ErroIA("A IA não devolveu JSON.")
    try:
        return json.loads(texto[inicio:fim + 1])
    except json.JSONDecodeError as erro:
        raise ErroIA(f"JSON inválido da IA: {erro}")


def gerar_json(motor, sistema, pedido, esquema):
    if motor == "claude":
        prompt = (f"{sistema}\n\nResponda SOMENTE com um objeto JSON que siga este JSON Schema:\n"
                  f"{json.dumps(esquema, ensure_ascii=False)}\n\n{pedido}")
        try:
            proc = subprocess.run(
                [CLAUDE_BIN, "-p", "--model", MODELO_CLAUDE, "--tools", "", "--strict-mcp-config",
                 "--no-session-persistence", "--output-format", "text"],
                input=prompt, capture_output=True, text=True, timeout=600, cwd="/tmp")
        except (OSError, subprocess.TimeoutExpired) as erro:
            raise ErroIA(f"Falha ao rodar o Claude: {erro}")
        if proc.returncode != 0:
            raise ErroIA((proc.stderr or proc.stdout or "Claude retornou erro").strip()[-300:])
        return _json_do_texto(proc.stdout)

    modelo = motor.removeprefix("ollama:")
    corpo = json.dumps({
        "model": modelo,
        "messages": [{"role": "system", "content": sistema}, {"role": "user", "content": pedido}],
        "format": esquema,
        "stream": False,
        "think": False,
        "options": {"temperature": 0.3, "num_ctx": 8192},
    }).encode()
    req = urllib.request.Request(f"{OLLAMA_URL}/api/chat", corpo, {"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=900) as r:
            return _json_do_texto(json.loads(r.read())["message"]["content"])
    except urllib.error.HTTPError as erro:
        raise ErroIA(f"Ollama respondeu {erro.code}: {erro.read()[:200].decode(errors='replace')}")
    except (urllib.error.URLError, OSError) as erro:
        raise ErroIA(f"Não consegui falar com o Ollama ({erro}). Ele está rodando?")


# ---------- Etapa 1: perguntas ----------

ESQUEMA_PERGUNTAS = {
    "type": "object",
    "properties": {"perguntas": {"type": "array", "items": {
        "type": "object",
        "properties": {"pergunta": {"type": "string"}, "opcoes": {"type": "array", "items": {"type": "string"}}},
        "required": ["pergunta", "opcoes"]}}},
    "required": ["perguntas"],
}

SISTEMA_PERGUNTAS = """Você ajuda a montar um plano de estudos personalizado. Responda em português do Brasil.
Faça EXATAMENTE 3 perguntas curtas pra entender: o nível atual da pessoa no assunto, o objetivo (o que quer
conseguir fazer) e um conhecimento prévio importante pro assunto. NÃO pergunte sobre horários, dias ou tempo
disponível (isso já é perguntado em outro lugar). Cada pergunta tem de 3 a 4 opções curtas (até 6 palavras),
específicas do assunto."""


def perguntas(tema, motor):
    dados = gerar_json(motor, SISTEMA_PERGUNTAS, f"Assunto: {tema}", ESQUEMA_PERGUNTAS)
    saida = []
    for p in dados.get("perguntas", [])[:4]:
        if isinstance(p, dict) and str(p.get("pergunta", "")).strip():
            opcoes = [str(o).strip() for o in p.get("opcoes", []) if str(o).strip()][:4]
            saida.append({"pergunta": p["pergunta"].strip(), "opcoes": opcoes})
    if not saida:
        raise ErroIA("A IA não conseguiu sugerir perguntas.")
    return saida


# ---------- Etapa 2: roteiro ----------

ESQUEMA_ROTEIRO = {
    "type": "object",
    "properties": {
        "titulo": {"type": "string"},
        "documentacao_oficial": {"type": "string"},
        "sessoes": {"type": "array", "items": {
            "type": "object",
            "properties": {
                "topico": {"type": "string"},
                "objetivo": {"type": "string"},
                "busca_video": {"type": "string"},
                "termos_doc": {"type": "string"},
                "atividades": {"type": "array", "items": {
                    "type": "object",
                    "properties": {"titulo": {"type": "string"}, "descricao": {"type": "string"},
                                   "minutos": {"type": "integer"}},
                    "required": ["titulo", "descricao", "minutos"]}},
            },
            "required": ["topico", "objetivo", "busca_video", "termos_doc", "atividades"]}},
    },
    "required": ["titulo", "documentacao_oficial", "sessoes"],
}

SISTEMA_ROTEIRO = """Você é um planejador de estudos. Responda SOMENTE com o JSON pedido, em português do Brasil.
Regras:
- Gere EXATAMENTE o número de sessões pedido, em ordem didática, continuando de onde o roteiro parou, sem repetir tópicos já planejados.
- "topico": título curto da sessão (máx. 6 palavras).
- "objetivo": uma frase com o que a pessoa saberá fazer ao final da sessão.
- "busca_video": 3 a 6 palavras em português pra achar uma aula em vídeo sobre o tópico (ex.: "react useState aula").
- "termos_doc": 2 a 5 palavras-chave técnicas EM INGLÊS do tópico, como aparecem na documentação (ex.: "state usestate hook").
- "atividades": 1 a 3 exercícios práticos e concretos, com entrega clara, que somem cerca de metade do tempo da sessão (a outra metade é pra vídeo e leitura, que o app anexa sozinho). NÃO crie atividade de "assistir vídeo" ou "ler documentação".
- Use ferramentas e práticas atuais do assunto; evite coisas obsoletas.
- Quando o pedido disser que é o último bloco, a última sessão deve ser um mini projeto que junta o que foi visto.
- "documentacao_oficial": domínio do site oficial de documentação do assunto (ex.: "react.dev"), ou "" se não houver.
- Não escreva links nem datas."""


def _pedido_roteiro(plano, respostas, total, feitas, quantas):
    linhas = [f"Assunto: {plano['tema']}"]
    for r in respostas:
        if r.get("resposta"):
            linhas.append(f"{r['pergunta']} {r['resposta']}")
    linhas += [f"Duração de cada sessão: {plano['minutos']} minutos",
               f"O roteiro completo tem {total} sessões."]
    if feitas:
        linhas.append("Já planejado (não repita): " + "; ".join(f"{i}. {s['topico']}" for i, s in enumerate(feitas, 1)))
    ultimo = len(feitas) + quantas >= total
    linhas.append(f"Gere agora as sessões {len(feitas) + 1} a {len(feitas) + quantas} "
                  f"({quantas} sessões).{' Este é o último bloco.' if ultimo else ''}")
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
        while len(roteiro) < total:
            quantas = min(BLOCO, total - len(roteiro))
            _etapa(plano_id, f"Montando o roteiro: sessões {len(roteiro) + 1}–{len(roteiro) + quantas} de {total}")
            dados = gerar_json(plano["motor"], SISTEMA_ROTEIRO,
                               _pedido_roteiro(plano, respostas, total, roteiro, quantas), ESQUEMA_ROTEIRO)
            novas = [s for s in dados.get("sessoes", []) if str(s.get("topico", "")).strip()][:quantas]
            if not novas:
                raise ErroIA("A IA devolveu um bloco vazio.")
            roteiro += novas
            titulo = titulo or dados.get("titulo")
            doc_oficial = doc_oficial or dados.get("documentacao_oficial", "")

        # --- materiais ---
        _etapa(plano_id, "Buscando vídeos e documentação…")
        ignorar = [plano["tema"]] + doc_oficial.split(".")[:1]
        minutos_video = max(8, round(plano["minutos"] * 0.5))
        busca.paginas_oficiais(doc_oficial)  # baixa o índice uma vez antes do paralelo
        feitos = [0]
        trava = threading.Lock()

        def materiais(sessao):
            videos = busca.buscar_videos(sessao.get("busca_video") or f"{sessao['topico']} {plano['tema']} aula",
                                         minutos_max=minutos_video, limite=4)
            docs = busca.buscar_documentacao(
                f"{sessao.get('termos_doc', '')} {sessao['topico']}", doc_oficial, ignorar=ignorar, limite=2)
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

    with conectar() as con:
        cor = CORES[con.execute("SELECT COUNT(*) FROM planos").fetchone()[0] % len(CORES)]
        plano_id = con.execute(
            "INSERT INTO planos (tema, respostas, dias, minutos, horario, inicio, semanas, motor, cor, etapa) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Na fila…')",
            (tema, json.dumps(dados.get("respostas", []), ensure_ascii=False), json.dumps(dias), minutos,
             dados.get("horario") or None, inicio, semanas, dados.get("motor") or f"ollama:{MODELO_PADRAO}", cor)
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
    return obter_sessao(sessao["id"])


def adiar_pendentes(sessao_id):
    """Tudo que ainda está pendente na sessão vira 'não feito' (e vai pra próxima)."""
    with conectar() as con:
        ids = [l[0] for l in con.execute(
            "SELECT id FROM itens WHERE sessao_id = ? AND estado = 'pendente'", (sessao_id,))]
    for item_id in ids:
        marcar_item(item_id, "nao-feito")
    return obter_sessao(sessao_id)
