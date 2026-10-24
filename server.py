"""Servidor local do Kaizen: arquivos estáticos + API SQLite + ponte com o Ollama."""
from datetime import datetime
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import os
import signal
import sqlite3
import sys
import threading
import urllib.error
import urllib.parse
import urllib.request

import busca
import copias
import entregas
import estudos
import ia_local
import remoto
import servidores

# Empacotado (app de computador), os arquivos do app ficam na pasta temporária
# do PyInstaller e os dados vão pra pasta do usuário que o app passa em KAIZEN_DADOS.
ROOT = Path(getattr(sys, "_MEIPASS", Path(__file__).parent))
DADOS = Path(os.environ.get("KAIZEN_DADOS") or ROOT)
DADOS.mkdir(parents=True, exist_ok=True)
DB = DADOS / "kaizen.sqlite3"

# Em Docker, HOST vira 0.0.0.0 e OLLAMA_URL aponta para o host
# (ex.: http://host.docker.internal:11434), via variáveis de ambiente.
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "8000"))
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")

# O navegador só baixa daqui o próprio app (o mesmo que o desktop/empacotar_servidor.py leva).
# O resto da pasta (o banco com as chaves de API, sync/.env, o código, o .git) nunca sai.
ARQUIVOS_PUBLICOS = {"index.html", "style.css", "sw.js", "manifest.webmanifest", "dados.json", "prompts.json", "novidades.json",
                     "areas.json"}
PASTAS_PUBLICAS = ("js/", "icones/")
CORPO_MAXIMO = 100_000_000   # backup com todas as entregas cabe folgado

# Rodando só neste PC, o Host tem que ser este PC: barra o "DNS rebinding" (um site
# que aponta o próprio domínio pra 127.0.0.1 e lê a API). KAIZEN_HOSTS libera outros nomes.
HOSTS_LOCAIS = {"127.0.0.1", "localhost", "::1"}
HOSTS_EXTRAS = {h.strip().lower() for h in os.environ.get("KAIZEN_HOSTS", "").split(",") if h.strip()}
SO_LOCAL = HOST in HOSTS_LOCAIS

busca.CACHE_DB = DB
busca.ARQUIVO_AREAS = ROOT / "areas.json"
copias.DB = DB
copias.PASTA = DADOS / "copias"
estudos.DB = DB
servidores.DB = DB
servidores.URL_LOCAL = OLLAMA_URL
remoto.PORTA_LOCAL = PORT
ia_local.PASTA = DADOS / "ollama"


def init_db():
    dados = json.loads((ROOT / "dados.json").read_text(encoding="utf-8"))
    with sqlite3.connect(DB) as con:
        con.execute("""CREATE TABLE IF NOT EXISTS tarefas (
            id TEXT PRIMARY KEY, titulo TEXT NOT NULL, status TEXT NOT NULL,
            prioridade TEXT NOT NULL, categoria TEXT NOT NULL DEFAULT 'Geral',
            prazo TEXT NOT NULL
        )""")
        con.execute("CREATE TABLE IF NOT EXISTS categorias (nome TEXT PRIMARY KEY)")
        # chat e preferências que o navegador guarda; ficam aqui pra sobreviver a limpar o cache
        con.execute("CREATE TABLE IF NOT EXISTS guardados (chave TEXT PRIMARY KEY, valor TEXT NOT NULL)")
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


def guardados():
    with sqlite3.connect(DB) as con:
        return dict(con.execute("SELECT chave, valor FROM guardados"))


def guardar(mudancas):
    """{chave: valor} grava; valor None apaga. Só aceita chaves do Kaizen."""
    if not isinstance(mudancas, dict) or not all(isinstance(c, str) and c.startswith("kaizen.") for c in mudancas):
        raise ValueError("Chaves inválidas.")
    if not all(v is None or isinstance(v, str) for v in mudancas.values()):
        raise ValueError("Valores têm que ser texto.")
    with sqlite3.connect(DB) as con:
        con.executemany("DELETE FROM guardados WHERE chave = ?", [(c,) for c, v in mudancas.items() if v is None])
        con.executemany("INSERT OR REPLACE INTO guardados (chave, valor) VALUES (?, ?)",
                        [(c, v) for c, v in mudancas.items() if v is not None])


def ollama_modelos():
    """Modelos do destino de IA preferido (Ollama ou nuvem). Levanta ErroConexao se estiver fora."""
    destino = servidores.obter(servidores.preferido())
    estado = servidores.status(destino)
    if not estado["online"]:
        raise servidores.ErroConexao(f"{destino['nome']} está fora do ar.")
    return servidores.modelos_para_chat(destino["id"], estado["modelos"])


def ollama_chat(modelo, mensagens):
    """Manda a conversa pro destino preferido e devolve a resposta do assistente.

    Se o preferido for um Ollama de outra máquina e ela estiver fora do ar,
    tenta este computador.
    """
    if servidores.preferido() == "kaizen":
        raise ValueError(servidores.AVISO_CHAT)
    sistema = estudos.PROMPTS["sistema_chat"]
    historico = estudos.perfil_texto()
    if historico:
        sistema += "\n\nHistórico de estudos do usuário:\n" + historico
    personalidade = [{"role": "system", "content": sistema}]

    preferido = servidores.preferido()
    tentativas = [preferido]
    if preferido != "local" and servidores.obter(preferido)["tipo"] == "ollama":
        tentativas.append("local")

    for i, destino in enumerate(tentativas):
        try:
            return servidores.conversar(destino, modelo, personalidade + mensagens, servico="chat")
        except servidores.ErroConexao:
            if i == len(tentativas) - 1:
                raise

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # o navegador sempre confere se o arquivo mudou (responde 304 se não): sem isso ele
        # guarda o js antigo e um módulo novo importando um velho quebra a tela depois de atualizar
        self.send_header("Cache-Control", "no-cache")
        if self.path.startswith("/api/remoto/"):
            # o app do celular roda em outro endereço (GitHub Pages); a chave é que protege
            self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def parse_request(self):
        """Pelo túnel do Tailscale (IA do PC no celular) só passam as rotas da IA."""
        if not super().parse_request():
            return False
        if remoto.veio_pelo_tunel(self.headers) and urllib.parse.urlparse(self.path).path not in remoto.ROTAS_LIBERADAS:
            self.send_error(403, "Pelo celular, só a IA deste PC fica liberada.")
            return False
        if not self.origem_confiavel():
            self.send_error(403, "Pedido de fora do Kaizen.")
            return False
        return True

    def origem_confiavel(self):
        """Outro site aberto no navegador não pode mexer no Kaizen (CSRF) nem ler a API.

        O Host tem que ser este PC e, em pedido que muda algo, a Origin tem que ser
        o próprio Kaizen (o navegador sempre manda a Origin em POST/PUT/PATCH/DELETE).
        As rotas da IA remota têm chave e valem de qualquer origem (o celular).
        """
        if urllib.parse.urlparse(self.path).path in remoto.ROTAS_LIBERADAS:
            return True
        host = self.headers.get("Host", "")
        nome = (urllib.parse.urlsplit(f"//{host}").hostname or "").lower()
        if SO_LOCAL and nome not in HOSTS_LOCAIS | HOSTS_EXTRAS:
            return False
        origem = self.headers.get("Origin")
        if self.command not in ("GET", "HEAD") and origem is not None:
            return urllib.parse.urlsplit(origem).netloc.lower() == host.lower()
        return True

    def send_head(self):
        caminho = urllib.parse.unquote(urllib.parse.urlsplit(self.path).path).lstrip("/")
        publico = caminho in ("", *ARQUIVOS_PUBLICOS) or (caminho.startswith(PASTAS_PUBLICAS)
                                                          and ".." not in caminho and "\\" not in caminho)
        if not publico:
            self.send_error(404, "Arquivo não encontrado")
            return None
        return super().send_head()

    def list_directory(self, path):
        self.send_error(404, "Arquivo não encontrado")
        return None

    def ler_json(self):
        """Corpo do pedido em JSON ({} se vier vazio). Recusa corpo absurdo antes de ler."""
        tamanho = int(self.headers.get("Content-Length") or 0)
        if tamanho > CORPO_MAXIMO:
            raise ValueError("Pedido grande demais.")
        return json.loads(self.rfile.read(tamanho) or b"{}") if tamanho > 0 else {}

    def do_OPTIONS(self):
        if not self.path.startswith("/api/remoto/"):
            return self.responder(404, {"erro": "Rota não encontrada"})
        self.send_response(204)
        self.send_header("Access-Control-Allow-Methods", "GET, POST")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        if self.rota_estudos("GET"):
            return
        if self.path == "/api/tarefas":
            return self.responder(200, {"tarefas": listar()})
        if self.path == "/api/guardados":
            return self.responder(200, guardados())
        if self.path.split("?")[0] == "/api/uso-tokens":
            dias = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query).get("dias", ["30"])[0]
            return self.responder(200, {"dias": int(dias) if dias.isdigit() else 30,
                                        "servicos": servidores.uso_tokens(int(dias) if dias.isdigit() else 30)})
        if self.path == "/api/ia/local":
            return self.responder(200, ia_local.situacao())
        if self.path == "/api/ia/local/progresso":
            return self.responder(200, ia_local.progresso())
        if self.path == "/api/ping":
            # o js/modo.js pergunta isso pra saber que tem servidor: tem que responder na hora
            return self.responder(200, {"ok": True})
        if self.path == "/api/ia/status":
            servidor = servidores.obter(servidores.preferido())
            if servidor["id"] == "kaizen":
                return self.responder(200, {"disponivel": False, "modelos": [], "servidor": servidor["nome"],
                                            "aviso": servidores.AVISO_CHAT})
            try:
                modelos = ollama_modelos()
                return self.responder(200, {"disponivel": True, "modelos": modelos, "servidor": servidor["nome"]})
            except servidores.ErroConexao:
                return self.responder(200, {"disponivel": False, "modelos": [], "servidor": servidor["nome"]})
        return super().do_GET()

    def do_POST(self):
        if self.rota_estudos("POST"):
            return
        if self.path == "/api/ia/local/instalar":
            try:
                dados = self.ler_json()
                return self.responder(202, ia_local.instalar(dados.get("modelo"), dados.get("aceito") is True))
            except ValueError as erro:
                return self.responder(400, {"erro": str(erro)})
        if self.path != "/api/chat":
            return self.responder(404, {"erro": "Rota não encontrada"})
        try:
            dados = self.ler_json()
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
        if self.path == "/api/guardados":
            try:
                guardar(self.ler_json())
                return self.responder(200, {"ok": True})
            except (TypeError, ValueError, sqlite3.Error) as erro:
                return self.responder(400, {"erro": str(erro)})
        if self.path != "/api/tarefas":
            return self.responder(404, {"erro": "Rota não encontrada"})
        try:
            dados = self.ler_json()
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
        if partes[:2] == ["api", "copias"]:
            return self.rota_copias(metodo, partes[2:])
        if partes[:2] == ["api", "backup"]:
            return self.rota_backup(metodo, sincronia="sincronia=1" in url.query, leve="leve=1" in url.query)
        if partes[:2] == ["api", "remoto"]:
            return self.rota_remoto(metodo, partes[2:])
        if partes[:2] != ["api", "estudos"]:
            return False
        recurso = partes[2] if len(partes) > 2 else ""
        ident = int(partes[3]) if len(partes) > 3 and partes[3].isdigit() else None
        acao = partes[4] if len(partes) > 4 else None

        try:
            corpo = {}
            if metodo in ("POST", "PATCH"):
                corpo = self.ler_json()

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
                    str(corpo.get("tema", "")).strip(), corpo.get("motor") or estudos.motor_padrao(),
                    corpo.get("continua_de"))}) or True
            if metodo == "POST" and recurso == "planos" and not ident:
                return self.responder(201, {"plano": estudos.criar_plano(corpo)}) or True
            if metodo == "POST" and recurso == "planos" and ident and acao == "refazer":
                return self.responder(200, {"plano": estudos.refazer_plano(ident)}) or True
            if metodo == "POST" and recurso == "planos" and ident and acao == "refazer-cronograma":
                plano = estudos.refazer_cronograma(ident, corpo)
                return self.responder(200 if plano else 404, {"plano": plano}) or True
            if metodo == "POST" and recurso == "planos" and ident and acao == "dias":
                plano = estudos.remarcar_dias(ident, corpo.get("dias") or [])
                return self.responder(200 if plano else 404, {"plano": plano}) or True
            if metodo == "PATCH" and recurso == "sessoes" and ident:
                sessao = estudos.mover_sessao(ident, corpo.get("data"))
                return self.responder(200 if sessao else 404, {"sessao": sessao}) or True
            if metodo == "POST" and recurso == "importar-plano":
                return self.responder(201, {"plano": estudos.importar_plano(corpo)}) or True
            if metodo == "POST" and recurso == "sessoes" and ident and acao == "adiar":
                return self.responder(200, {"sessao": estudos.adiar_pendentes(ident)}) or True
            if metodo == "PATCH" and recurso == "itens" and ident:
                sessao = estudos.marcar_item(ident, corpo.get("estado"))
                return self.responder(200 if sessao else 404, {"sessao": sessao}) or True
            if metodo == "DELETE" and recurso == "planos" and ident:
                copias.salvar("antes-de-excluir-plano", espera=60)
                estudos.excluir_plano(ident)
                return self.responder(200, {"ok": True}) or True

            # perfil ("o que a IA sabe de você") e flashcards
            if metodo == "GET" and recurso == "perfil":
                return self.responder(200, estudos.perfil()) or True
            if metodo == "POST" and recurso == "perfil":
                estudos.salvar_sobre(corpo.get("sobre"))
                return self.responder(200, estudos.perfil()) or True
            if metodo == "GET" and recurso == "flashcards" and ident is None:
                return self.responder(200, estudos.listar_flashcards()) or True
            if metodo == "GET" and recurso == "flashcards":
                return self.responder(200, {"cartoes": estudos.cartoes(ident)}) or True
            if metodo == "GET" and recurso == "revisao":
                return self.responder(200, {"cartoes": estudos.cartoes(todos="todos=1" in url.query)}) or True
            if metodo == "GET" and recurso == "cartoes" and "sessoes=" in url.query:
                ids = [int(i) for i in urllib.parse.parse_qs(url.query)["sessoes"][0].split(",") if i.isdigit()]
                return self.responder(200, {"sessoes": estudos.cartoes_das_sessoes(ids)}) or True
            if metodo == "POST" and recurso == "flashcards" and ident and acao == "refazer":
                estudos.pedir_flashcards(ident, forcar=True)
                return self.responder(202, {"ok": True}) or True
            if metodo == "GET" and recurso == "pets":
                return self.responder(200, {"dados": estudos.obter_pets()}) or True
            if metodo == "POST" and recurso == "pets":
                return self.responder(200, {"dados": estudos.salvar_pets(corpo.get("dados"))}) or True
            # entregas das atividades e correção pela IA
            if metodo == "GET" and recurso == "entregas" and "planos=" in url.query:
                planos = [int(p) for p in urllib.parse.parse_qs(url.query)["planos"][0].split(",") if p.isdigit()]
                return self.responder(200, {"entregas": entregas.dos_planos(planos)}) or True
            if metodo == "GET" and recurso == "entregas" and ident is None:
                item = int(urllib.parse.parse_qs(url.query)["item"][0])
                return self.responder(200, {"entregas": entregas.listar(item),
                                            "corretor": entregas.sobre_corretor()}) or True
            if metodo == "GET" and recurso == "entregas":
                entrega = entregas.obter(ident)
                return self.responder(200 if entrega else 404, {"entrega": entrega}) or True
            if metodo == "POST" and recurso == "entregas" and ident is None:
                return self.responder(201, {"entrega": entregas.criar(corpo)}) or True
            if metodo == "POST" and recurso == "entregas" and acao == "corrigir":
                entrega = entregas.corrigir_de_novo(ident)
                return self.responder(200 if entrega else 404, {"entrega": entrega}) or True
            if metodo == "DELETE" and recurso == "entregas" and ident:
                entregas.excluir(ident)
                return self.responder(200, {"ok": True}) or True
            if metodo == "GET" and recurso == "sincronia-entregas":
                return self.responder(200, {"opcao": entregas.opcao_sincronia()}) or True
            if metodo == "POST" and recurso == "sincronia-entregas":
                return self.responder(200, {"opcao": entregas.definir_sincronia(corpo.get("opcao"))}) or True

            if metodo == "PATCH" and recurso == "cartoes" and ident:
                cartao = estudos.responder_cartao(ident, corpo.get("acertou") is True)
                return self.responder(200 if cartao else 404, {"cartao": cartao}) or True

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
                          "pede_url": bool(info.get("pede_url")), "conectado": servidores.conectado(prov)}
                         for prov, info in servidores.NUVEM.items()]
                self.responder(200, {"servidores": servidores.listar_com_status(usar_cache=False), "nuvem": nuvem,
                                     "cotas": servidores.cotas_do_dia()})
            elif metodo == "POST" and ident == "nuvem" and len(partes) == 2:
                corpo = self.ler_json()
                servidores.conectar_nuvem(partes[1], corpo.get("chave"), corpo.get("url"))
                self.responder(200, {"servidores": servidores.listar_com_status()})
            elif metodo == "POST" and partes == ["openrouter", "entrar"]:
                self.responder(200, {"url": servidores.entrar_openrouter(self.ler_json().get("volta"))})
            elif metodo == "POST" and partes == ["openrouter", "concluir"]:
                corpo = self.ler_json()
                servidores.concluir_openrouter(corpo.get("codigo"), corpo.get("estado"))
                self.responder(200, {"servidores": servidores.listar_com_status()})
            elif metodo == "POST" and not ident:
                corpo = self.ler_json()
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

    def rota_remoto(self, metodo, partes):
        """/api/remoto[...] — IA deste PC no celular (ver remoto.py)."""
        acao = partes[0] if partes else ""
        try:
            if acao in ("modelos", "conversar"):
                if not remoto.autorizado(self.headers.get("Authorization")):
                    return self.responder(401, {"erro": "Chave do PC errada. Confira no Kaizen do PC."}) or True
                if metodo == "GET" and acao == "modelos":
                    return self.responder(200, {"modelos": remoto.modelos()}) or True
                if metodo == "POST" and acao == "conversar":
                    corpo = self.ler_json()
                    resposta = remoto.conversar(corpo.get("modelo"), corpo.get("mensagens"), corpo.get("formato"))
                    return self.responder(200, {"resposta": resposta}) or True
            elif metodo == "GET" and not acao:
                return self.responder(200, remoto.situacao()) or True
            elif metodo == "POST" and acao in ("instalar", "abrir", "entrar", "conectar", "ligar", "desligar"):
                return self.responder(200, remoto.acao(acao)) or True
            elif metodo == "POST" and acao == "chave":
                remoto.trocar_chave()
                return self.responder(200, remoto.situacao()) or True
            self.responder(404, {"erro": "Rota não encontrada"})
        except servidores.ErroConexao as erro:
            self.responder(502, {"erro": str(erro)})
        except (OSError, ValueError) as erro:
            self.responder(400, {"erro": str(erro)})
        return True

    def rota_copias(self, metodo, resto):
        """GET lista as cópias automáticas; POST /api/copias/<nome>/restaurar volta a uma delas."""
        try:
            if metodo == "GET" and not resto:
                return self.responder(200, {"copias": copias.listar()}) or True
            if metodo == "POST" and len(resto) == 2 and resto[1] == "restaurar":
                copias.restaurar(urllib.parse.unquote(resto[0]))
                return self.responder(200, {"ok": True}) or True
            self.responder(404, {"erro": "Rota não encontrada"})
        except (ValueError, sqlite3.Error) as erro:
            self.responder(400, {"erro": f"Não consegui voltar a essa cópia: {erro}"})
        return True

    def rota_backup(self, metodo, sincronia=False, leve=False):
        """GET baixa tudo (kanban + estudos); POST restaura, substituindo.
        Mesmo formato do modo nuvem, então serve pra levar do celular pro PC.
        Chaves de API não entram no arquivo. Pra sincronia (?sincronia=1), os
        arquivos das entregas seguem a opção "O que vai pro celular". ?leve=1 vem sem
        as entregas (os pets só precisam dos planos pra contar pontos)."""
        try:
            if metodo == "GET":
                with sqlite3.connect(DB) as con:
                    categorias = [linha[0] for linha in con.execute("SELECT nome FROM categorias ORDER BY nome")]
                return self.responder(200, {
                    "app": "kaizen", "formato": 1,
                    "criado_em": datetime.now().isoformat(timespec="seconds"),
                    "kanban": {"tarefas": listar(), "categorias": categorias},
                    "estudos": entregas.para_sincronia(estudos.exportar()) if sincronia
                    else estudos.exportar(com_entregas=not leve),
                }) or True

            if metodo == "POST":
                dados = self.ler_json()
                if dados.get("app") != "kaizen":
                    raise ValueError("Esse arquivo não é um backup do Kaizen.")
                # restaurar (e a sincronia aplicando o que veio de outro aparelho) troca tudo de uma vez:
                # antes, uma cópia do que está aqui, pra poder voltar
                copias.salvar("antes-de-restaurar", espera=20)
                kanban = dados.get("kanban")
                if isinstance(kanban, dict) and isinstance(kanban.get("tarefas"), list):
                    with sqlite3.connect(DB) as con:
                        con.execute("DELETE FROM tarefas")
                        con.execute("DELETE FROM categorias")
                        con.executemany(
                            "INSERT INTO tarefas (id, titulo, status, prioridade, categoria, prazo) VALUES (?, ?, ?, ?, ?, ?)",
                            [(t["id"], t["titulo"], t["status"], t["prioridade"], t.get("categoria", "Geral"), t["prazo"])
                             for t in kanban["tarefas"]])
                        con.executemany("INSERT OR IGNORE INTO categorias (nome) VALUES (?)",
                                        [(nome,) for nome in kanban.get("categorias", [])])
                if isinstance(dados.get("estudos"), dict):
                    estudos.importar(dados["estudos"])
                return self.responder(200, {"ok": True}) or True

            self.responder(404, {"erro": "Rota não encontrada"})
        except (KeyError, TypeError, ValueError, sqlite3.Error) as erro:
            self.responder(400, {"erro": f"Não consegui restaurar: {erro}"})
        return True

    def responder(self, status, conteudo):
        corpo = json.dumps(conteudo, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)


def vigiar_stdin():
    """No app de computador, a entrada padrão é um cano aberto pelo app: quando
    ele fecha (app fechou ou travou), o servidor sai junto em vez de ficar órfão."""
    def esperar():
        try:
            while sys.stdin.read(1024):
                pass
        except (OSError, ValueError):
            pass
        ia_local.encerrar()
        os._exit(0)
    threading.Thread(target=esperar, daemon=True).start()


if __name__ == "__main__":
    if os.environ.get("KAIZEN_VIGIAR_STDIN") == "1" and sys.stdin:
        vigiar_stdin()
    # SIGTERM vira saída normal, pra o atexit desligar o Ollama que o Kaizen ligou.
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    if sys.stderr is None:  # executável sem console (Windows): o log do http.server iria pro nada e quebraria
        sys.stderr = open(DADOS / "servidor.log", "a", encoding="utf-8")
    init_db()
    estudos.init()
    servidores.init()
    copias.vigiar()
    if servidores.preferido() == "local":   # a IA daqui é a escolhida: deixa o Ollama ligado
        threading.Thread(target=ia_local.ligar, daemon=True).start()
    print(f"Kaizen disponível em http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), partial(Handler, directory=str(ROOT))).serve_forever()
