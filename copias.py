"""Cópias automáticas do banco: a rede de segurança contra perder planos e tarefas.

O Kaizen guarda uma cópia do banco (kaizen.sqlite3) antes de qualquer coisa que troca os dados de
uma vez (restaurar um backup, a sincronia aplicar o que veio de outro aparelho, excluir um plano) e
uma vez por dia de uso. Ficam na pasta "copias" ao lado do banco; as 40 mais novas são mantidas.
Dá pra voltar a qualquer uma pelo botão "Cópias automáticas" do rodapé.
"""
import re
import sqlite3
import threading
import time
from datetime import datetime
from pathlib import Path

DB = None            # o server.py aponta pro kaizen.sqlite3
PASTA = None         # idem: <pasta dos dados>/copias

MANTER = 40
INTERVALO_AUTOMATICA = 12 * 3600     # segundos: no máximo uma cópia "do dia" a cada 12 h
MOTIVOS = {
    "automatica": "Cópia automática",
    "antes-de-restaurar": "Antes de restaurar ou sincronizar",
    "antes-de-excluir-plano": "Antes de excluir um plano",
    "antes-de-voltar": "Antes de voltar a uma cópia",
}
NOME = re.compile(r"^kaizen-(\d{8}-\d{6})-([a-z-]+)\.sqlite3$")

# as tabelas do usuário; config, chaves de IA e cache de busca ficam como estão
TABELAS = ["tarefas", "categorias", "planos", "sessoes", "itens", "flashcards", "entregas", "perfil", "pets_estado"]

_trava = threading.Lock()
_ultima = {}         # motivo -> quando (time.time()), pra não encher a pasta com cópias iguais


def _pasta():
    PASTA.mkdir(parents=True, exist_ok=True)
    return PASTA


def salvar(motivo="automatica", espera=0):
    """Copia o banco agora. `espera`: se já houve uma cópia desse motivo há menos de `espera` s, não faz outra.
    Devolve o nome do arquivo (ou None se não copiou). Nunca levanta erro: a cópia não pode atrapalhar o uso."""
    try:
        with _trava:
            agora = time.time()
            if espera and agora - _ultima.get(motivo, 0) < espera:
                return None
            if not Path(DB).exists():
                return None
            nome = f"kaizen-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{motivo}.sqlite3"
            destino = _pasta() / nome
            if destino.exists():     # duas cópias no mesmo segundo
                return None
            origem = sqlite3.connect(f"file:{Path(DB).as_posix()}?mode=ro", uri=True, timeout=10)
            copia = sqlite3.connect(destino)
            try:
                origem.backup(copia)     # consistente mesmo com o servidor gravando
            finally:
                copia.close()
                origem.close()
            _ultima[motivo] = agora
            _podar()
            return nome
    except (OSError, sqlite3.Error):
        return None


def _podar():
    arquivos = sorted((p for p in _pasta().iterdir() if NOME.match(p.name)), reverse=True)
    for velho in arquivos[MANTER:]:
        try:
            velho.unlink()
        except OSError:
            pass


def _contar(arquivo):
    try:
        con = sqlite3.connect(f"file:{arquivo.as_posix()}?mode=ro", uri=True, timeout=5)
        try:
            return {t: con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0] for t in ("planos", "sessoes", "tarefas")}
        finally:
            con.close()
    except sqlite3.Error:
        return None


def listar():
    """As cópias, da mais nova pra mais velha, com o que tem dentro."""
    if not PASTA or not Path(PASTA).exists():
        return []
    lista = []
    for p in sorted(Path(PASTA).iterdir(), reverse=True):
        m = NOME.match(p.name)
        if not m:
            continue
        conteudo = _contar(p)
        if conteudo is None:
            continue
        quando = datetime.strptime(m.group(1), "%Y%m%d-%H%M%S")
        lista.append({"nome": p.name, "quando": quando.isoformat(timespec="seconds"), "tipo": m.group(2),
                      "motivo": MOTIVOS.get(m.group(2), m.group(2)), "tamanho": p.stat().st_size, **conteudo})
    return lista


def _colunas(con, banco, tabela):
    return [l[1] for l in con.execute(f"PRAGMA {banco}.table_info({tabela})")]


def restaurar(nome):
    """Volta tarefas e estudos pra como estavam na cópia. Antes, copia o estado de agora (dá pra desfazer)."""
    if not NOME.match(nome or ""):
        raise ValueError("Cópia inválida.")
    origem = Path(PASTA) / nome
    if not origem.is_file():
        raise ValueError("Essa cópia não existe mais.")
    if _contar(origem) is None:
        raise ValueError("Essa cópia está danificada.")

    salvar("antes-de-voltar")

    con = sqlite3.connect(DB, timeout=30)
    try:
        con.execute("ATTACH DATABASE ? AS copia", (origem.as_posix(),))
        con.execute("BEGIN IMMEDIATE")
        existentes = {l[0] for l in con.execute("SELECT name FROM copia.sqlite_master WHERE type='table'")}
        # filhos primeiro ao apagar, pais primeiro ao inserir
        tabelas = [t for t in TABELAS if t in existentes]
        for t in reversed(tabelas):
            con.execute(f"DELETE FROM main.{t}")
        for t in tabelas:
            comuns = [c for c in _colunas(con, "copia", t) if c in _colunas(con, "main", t)]
            lista = ", ".join(comuns)
            con.execute(f"INSERT INTO main.{t} ({lista}) SELECT {lista} FROM copia.{t}")
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


def vigiar():
    """Uma cópia ao abrir o app e outra a cada 12 h aberto, só se o banco mudou desde a última cópia."""
    def laco():
        while True:
            try:
                copias = listar()
                ultima = next(iter(copias), None)
                ultima_do_dia = next((c for c in copias if c["tipo"] == "automatica"), None)
                velha = not ultima_do_dia or \
                    time.time() - datetime.fromisoformat(ultima_do_dia["quando"]).timestamp() > INTERVALO_AUTOMATICA
                mudou = not ultima or Path(DB).stat().st_mtime > datetime.fromisoformat(ultima["quando"]).timestamp()
                if velha and mudou:
                    salvar("automatica")
            except (OSError, ValueError):
                pass
            time.sleep(3600)

    threading.Thread(target=laco, daemon=True).start()
