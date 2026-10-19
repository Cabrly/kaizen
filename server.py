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

ROOT = Path(__file__).parent
DB = ROOT / "kaizen.sqlite3"

# Em Docker, HOST vira 0.0.0.0 e OLLAMA_URL aponta para o host
# (ex.: http://host.docker.internal:11434), via variáveis de ambiente.
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "8000"))
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")

busca.CACHE_DB = DB
estudos.DB = DB
estudos.OLLAMA_URL = OLLAMA_URL


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
    """Lista os modelos baixados no Ollama. Levanta exceção se ele estiver fora do ar."""
    req = urllib.request.Request(f"{OLLAMA_URL}/api/tags")
    with urllib.request.urlopen(req, timeout=2) as resposta:
        dados = json.loads(resposta.read())
        return [modelo["name"] for modelo in dados.get("models", [])]


def ollama_chat(modelo, mensagens):
    """Envia a conversa ao Ollama e devolve o texto da resposta do assistente.

    Sem streaming: o handler HTTP do stdlib não lida bem com chunked
    responses de longa duração, então esperamos a resposta completa.
    """
    personalidade = [{"role": "system" , "content":"Voce é um galanteador que gosta de flertar com o usuario antes de qualquer coisa. e sempre vai terminar falando: Vixe menina Beijoo"}]

    corpo = json.dumps({
        "model": modelo,
        "messages": personalidade + mensagens,
        "stream": False,
        "think": False
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{OLLAMA_URL}/api/chat",
        data=corpo,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    # Modelos de 14B em GPU de 12GB podem demorar; margem generosa.
    with urllib.request.urlopen(req, timeout=180) as resposta:
        dados = json.loads(resposta.read())
        return dados["message"]["content"]


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.rota_estudos("GET"):
            return
        if self.path == "/api/tarefas":
            return self.responder(200, {"tarefas": listar()})
        if self.path == "/api/ia/status":
            try:
                modelos = ollama_modelos()
                return self.responder(200, {"disponivel": True, "modelos": modelos})
            except (urllib.error.URLError, OSError, json.JSONDecodeError):
                return self.responder(200, {"disponivel": False, "modelos": []})
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
        except urllib.error.URLError:
            return self.responder(502, {"erro": f"Não foi possível falar com o Ollama em {OLLAMA_URL}. Ele está rodando?"})

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
                return self.responder(200, {"motores": estudos.motores_disponiveis(),
                                            "padrao": f"ollama:{estudos.MODELO_PADRAO}"}) or True
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
                    str(corpo.get("tema", "")).strip(), corpo.get("motor") or f"ollama:{estudos.MODELO_PADRAO}")}) or True
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
    print(f"Kaizen disponível em http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
