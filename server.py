"""Servidor local do Kaizen: arquivos estáticos + API SQLite + ponte com o Ollama."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import os
import sqlite3
import urllib.error
import urllib.parse
import urllib.request

import busca
import estudos
import servidores

ROOT = Path(__file__).parent
DB = ROOT / "kaizen.sqlite3"

# Em Docker, HOST vira 0.0.0.0 e OLLAMA_URL aponta para o host
# (ex.: http://host.docker.internal:11434), via variáveis de ambiente.
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "8000"))
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")

busca.CACHE_DB = DB
estudos.DB = DB
servidores.DB = DB
servidores.URL_LOCAL = OLLAMA_URL


def init_db():
    dados = json.loads((ROOT / "dados.json").read_text(encoding="utf-8"))
    with sqlite3.connect(DB) as con:
        con.execute("""CREATE TABLE IF NOT EXISTS tarefas (
            id TEXT PRIMARY KEY, titulo TEXT NOT NULL, status TEXT NOT NULL,
            prioridade TEXT NOT NULL, categoria TEXT NOT NULL DEFAULT 'Geral',
            prazo TEXT NOT NULL
        )""")
        con.execute("CREATE TABLE IF NOT EXISTS categorias (nome TEXT PRIMARY KEY)")
        colunas = {row[1] for row in con.execute("PRAGMA table_info(tarefas)")}
        if "categoria" not in colunas:
            con.execute("ALTER TABLE tarefas ADD COLUMN categoria TEXT NOT NULL DEFAULT 'Geral'")
        if con.execute("SELECT COUNT(*) FROM tarefas").fetchone()[0] == 0:
            con.executemany(
                "INSERT OR IGNORE INTO tarefas (id, titulo, status, prioridade, categoria, prazo) VALUES (?, ?, ?, ?, ?, ?)",
                [(t["id"], t["titulo"], t["status"], t["prioridade"], t.get("categoria", "Geral"), t["prazo"])
                 for t in dados.get("tarefas", [])],
            )
        con.executemany("INSERT OR IGNORE INTO categorias (nome) VALUES (?)", [(t.get("categoria", "Geral"),) for t in dados.get("tarefas", [])])


def listar():
    with sqlite3.connect(DB) as con:
        con.row_factory = sqlite3.Row
        return [dict(row) for row in con.execute("SELECT * FROM tarefas")]


def ollama_modelos():
    """Modelos do destino de IA preferido (Ollama ou nuvem). Levanta ErroConexao se estiver fora."""
    destino = servidores.obter(servidores.preferido())
    estado = servidores.status(destino)
    if not estado["online"]:
        raise servidores.ErroConexao(f"{destino['nome']} está fora do ar.")
    return estado["modelos"]


def ollama_chat(modelo, mensagens):
    """Manda a conversa pro destino preferido e devolve a resposta do assistente.

    Se o preferido for um Ollama de outra máquina e ela estiver fora do ar,
    tenta este computador.
    """
    personalidade = [{"role": "system", "content": (
        "Você é o assistente do Kaizen, um app de tarefas e estudos. "
        "Responda sempre em português do Brasil, de forma clara e direta.")}]

    preferido = servidores.preferido()
    tentativas = [preferido]
    if preferido != "local" and servidores.obter(preferido)["tipo"] == "ollama":
        tentativas.append("local")

    for i, destino in enumerate(tentativas):
        try:
            return servidores.conversar(destino, modelo, personalidade + mensagens)
        except servidores.ErroConexao:
            if i == len(tentativas) - 1:
                raise

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.rota_estudos("GET"):
            return
        if self.path == "/api/tarefas":
            return self.responder(200, {"tarefas": listar()})
        if self.path == "/api/ia/status":
            servidor = servidores.obter(servidores.preferido())
            try:
                modelos = ollama_modelos()
                return self.responder(200, {"disponivel": True, "modelos": modelos, "servidor": servidor["nome"]})
            except servidores.ErroConexao:
                return self.responder(200, {"disponivel": False, "modelos": [], "servidor": servidor["nome"]})
        return super().do_GET()

    def do_POST(self):
        if self.rota_estudos("POST"):
            return
        if self.path != "/api/chat":
            return self.responder(404, {"erro": "Rota não encontrada"})
        try:
            dados = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
            modelo = dados.get("modelo") or "qwen3:14b"
            mensagens = dados.get("mensagens")
            if not isinstance(mensagens, list) or not mensagens:
                return self.responder(400, {"erro": "Nenhuma mensagem enviada."})
            resposta = ollama_chat(modelo, mensagens)
            return self.responder(200, {"resposta": resposta, "modelo": modelo})
        except (KeyError, TypeError, ValueError) as erro:
            return self.responder(400, {"erro": str(erro)})
        except TimeoutError:
            return self.responder(504, {"erro": "O modelo demorou demais para responder."})
        except servidores.ErroConexao as erro:
            nome = servidores.obter(servidores.preferido())["nome"]
            return self.responder(502, {"erro": f"Não foi possível usar \"{nome}\": {erro}"})

    def do_PUT(self):
        if self.path != "/api/tarefas":
            return self.responder(404, {"erro": "Rota não encontrada"})
        try:
            dados = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
            tarefas = dados["tarefas"]
            categorias = dados.get("categorias", [])
            with sqlite3.connect(DB) as con:
                con.execute("DELETE FROM tarefas")
                con.execute("DELETE FROM categorias")
                con.executemany(
                    "INSERT INTO tarefas (id, titulo, status, prioridade, categoria, prazo) VALUES (?, ?, ?, ?, ?, ?)",
                    [(t["id"], t["titulo"], t["status"], t["prioridade"], t.get("categoria", "Geral"), t["prazo"])
                     for t in tarefas],
                )
                con.executemany("INSERT OR IGNORE INTO categorias (nome) VALUES (?)", [(nome,) for nome in categorias])
            return self.responder(200, {"tarefas": listar()})
        except (KeyError, TypeError, ValueError, sqlite3.Error) as erro:
            return self.responder(400, {"erro": str(erro)})

    def do_PATCH(self):
        if not self.rota_estudos("PATCH"):
            self.responder(404, {"erro": "Rota não encontrada"})

    def do_DELETE(self):
        if not self.rota_estudos("DELETE"):
            self.responder(404, {"erro": "Rota não encontrada"})

    def rota_estudos(self, metodo):
        """Rotas /api/estudos/... da aba Estudos. Devolve True se atendeu."""
        url = urllib.parse.urlparse(self.path)
        partes = url.path.strip("/").split("/")
        if partes[:3] == ["api", "ia", "servidores"]:
            return self.rota_servidores(metodo, partes[3:])
        if partes[:2] != ["api", "estudos"]:
            return False
        recurso = partes[2] if len(partes) > 2 else ""
        ident = int(partes[3]) if len(partes) > 3 and partes[3].isdigit() else None
        acao = partes[4] if len(partes) > 4 else None

        try:
            corpo = {}
            if metodo in ("POST", "PATCH"):
                tamanho = int(self.headers.get("Content-Length", 0))
                corpo = json.loads(self.rfile.read(tamanho) or b"{}") if tamanho else {}

            if metodo == "GET" and recurso == "motores":
                motores, padrao = estudos.motores_disponiveis()
                return self.responder(200, {"motores": motores, "padrao": padrao,
                                            "recomendado": estudos.MODELO_PADRAO}) or True
            if metodo == "GET" and recurso == "planos" and ident is None:
                return self.responder(200, {"planos": estudos.listar_planos()}) or True
            if metodo == "GET" and recurso == "planos":
                plano = estudos.obter_plano(ident)
                return self.responder(200 if plano else 404, {"plano": plano}) or True
            if metodo == "GET" and recurso == "calendario":
                q = urllib.parse.parse_qs(url.query)
                return self.responder(200, {"sessoes": estudos.calendario(q["inicio"][0], q["fim"][0])}) or True
            if metodo == "GET" and recurso == "sessoes" and ident:
                sessao = estudos.obter_sessao(ident)
                return self.responder(200 if sessao else 404, {"sessao": sessao}) or True
            if metodo == "POST" and recurso == "perguntas":
                return self.responder(200, {"perguntas": estudos.perguntas(
                    str(corpo.get("tema", "")).strip(), corpo.get("motor") or estudos.motor_padrao())}) or True
            if metodo == "POST" and recurso == "planos":
                return self.responder(201, {"plano": estudos.criar_plano(corpo)}) or True
            if metodo == "POST" and recurso == "sessoes" and ident and acao == "adiar":
                return self.responder(200, {"sessao": estudos.adiar_pendentes(ident)}) or True
            if metodo == "PATCH" and recurso == "itens" and ident:
                sessao = estudos.marcar_item(ident, corpo.get("estado"))
                return self.responder(200 if sessao else 404, {"sessao": sessao}) or True
            if metodo == "DELETE" and recurso == "planos" and ident:
                estudos.excluir_plano(ident)
                return self.responder(200, {"ok": True}) or True

            self.responder(404, {"erro": "Rota não encontrada"})
        except estudos.ErroIA as erro:
            self.responder(502, {"erro": str(erro)})
        except (KeyError, TypeError, ValueError) as erro:
            self.responder(400, {"erro": str(erro)})
        except sqlite3.Error as erro:
            self.responder(500, {"erro": f"Erro no banco: {erro}"})
        return True

    def rota_servidores(self, metodo, partes):
        """/api/ia/servidores[/<id>[/preferido]] — onde a IA roda."""
        ident = partes[0] if partes else None
        try:
            if metodo == "GET" and not ident:
                nuvem = [{"id": prov, "nome": info["nome"], "onde_pegar": info["onde_pegar"],
                          "conectado": bool(servidores.chave(prov))} for prov, info in servidores.NUVEM.items()]
                self.responder(200, {"servidores": servidores.listar_com_status(usar_cache=False), "nuvem": nuvem})
            elif metodo == "POST" and ident == "nuvem" and len(partes) == 2:
                tamanho = int(self.headers.get("Content-Length", 0))
                corpo = json.loads(self.rfile.read(tamanho) or b"{}") if tamanho else {}
                servidores.conectar_nuvem(partes[1], corpo.get("chave"))
                self.responder(200, {"servidores": servidores.listar_com_status()})
            elif metodo == "POST" and not ident:
                tamanho = int(self.headers.get("Content-Length", 0))
                corpo = json.loads(self.rfile.read(tamanho) or b"{}") if tamanho else {}
                self.responder(201, {"servidor": servidores.adicionar(corpo.get("nome"), corpo.get("url"))})
            elif metodo == "POST" and ident and partes[1:] == ["preferido"]:
                servidores.definir_preferido(ident)
                self.responder(200, {"servidores": servidores.listar_com_status()})
            elif metodo == "DELETE" and ident:
                servidores.remover(ident)
                self.responder(200, {"servidores": servidores.listar_com_status()})
            else:
                self.responder(404, {"erro": "Rota não encontrada"})
        except ValueError as erro:
            self.responder(400, {"erro": str(erro)})
        return True

    def responder(self, status, conteudo):
        corpo = json.dumps(conteudo, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)


if __name__ == "__main__":
    init_db()
    estudos.init()
    servidores.init()
    print(f"Kaizen disponível em http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
