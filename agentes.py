"""IA pelas ferramentas de terminal que a pessoa já usa: Claude Code, Gemini CLI e Codex.

Cada uma usa o login da própria ferramenta (a assinatura do Claude, a conta
Google, a conta do ChatGPT), então não precisa de chave de API. Só funciona
com o server.py (PC ou app de computador): o navegador não roda programas.

Aparecem em "Onde a IA roda" sozinhas quando estão instaladas. Rodam sem
ferramentas (só texto), numa pasta temporária vazia, pra não ler nem mexer
em arquivo nenhum do computador.
"""
import glob
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time

TEMPO_MAXIMO = 600   # plano de estudo grande demora; o chat responde bem antes
CACHE_PATH = 60      # segundos: relê o PATH do sistema de vez em quando (instalou com o Kaizen aberto)


AGENTES = {
    "claude-code": {
        "nome": "Claude Code",
        "programa": "claude",
        "modelos": ["sonnet", "opus", "haiku"],
        "como_instalar": "https://claude.com/claude-code",
        "login": "claude  (e dentro dele, /login)",
    },
    "gemini-cli": {
        "nome": "Gemini CLI",
        "programa": "gemini",
        "modelos": ["padrão"],          # o 2.5 saiu do ar pra conta nova: a ferramenta escolhe o da conta
        "como_instalar": "https://github.com/google-gemini/gemini-cli",
        "login": "gemini  (e escolha Login with Google)",
    },
    "codex": {
        "nome": "Codex (ChatGPT)",
        "programa": "codex",
        "modelos": ["padrão"],          # o Codex escolhe o modelo da conta
        "como_instalar": "https://github.com/openai/codex",
        "login": "codex login",
    },
}


class ErroAgente(Exception):
    pass


_path_cache = (0.0, "")


def _path_do_sistema():
    """O PATH de agora, não o de quando o Kaizen abriu.

    O app de computador herda um PATH velho (quem instala o Codex com o Kaizen
    aberto não aparecia) ou curto (no Mac, app aberto pelo Finder não enxerga
    o Homebrew nem o npm). No Windows lê o registro; no Mac/Linux pergunta pro
    shell de login da pessoa, que é onde o instalador de cada ferramenta mexe.
    """
    if sys.platform == "win32":
        import winreg
        partes = []
        for raiz, chave in ((winreg.HKEY_CURRENT_USER, r"Environment"),
                            (winreg.HKEY_LOCAL_MACHINE, r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment")):
            try:
                with winreg.OpenKey(raiz, chave) as k:
                    partes.append(os.path.expandvars(winreg.QueryValueEx(k, "Path")[0]))
            except OSError:
                pass
        return os.pathsep.join(partes)
    shell = os.environ.get("SHELL") or ("/bin/zsh" if sys.platform == "darwin" else "/bin/bash")
    try:
        # -i -l: carrega o .zshrc/.bashrc/.profile, onde o nvm e o Homebrew se registram
        proc = subprocess.run([shell, "-ilc", "printf '\\n__PATH__%s' \"$PATH\""], capture_output=True,
                              text=True, timeout=8, stdin=subprocess.DEVNULL)
        return proc.stdout.rsplit("__PATH__", 1)[-1].strip() if "__PATH__" in proc.stdout else ""
    except (OSError, subprocess.SubprocessError):
        return ""


def _pastas_conhecidas():
    """Onde os instaladores costumam pôr essas ferramentas, caso o PATH não diga."""
    casa = os.path.expanduser("~")
    pastas = [os.path.join(casa, p) for p in (".local/bin", ".npm-global/bin", ".volta/bin", ".bun/bin",
                                               ".claude/local", "scoop/shims", ".yarn/bin")]
    pastas += sorted(glob.glob(os.path.join(casa, ".nvm/versions/node/*/bin")), reverse=True)
    if sys.platform == "win32":
        appdata, local = os.environ.get("APPDATA", ""), os.environ.get("LOCALAPPDATA", "")
        pastas += [os.path.join(appdata, "npm"), os.path.join(local, "pnpm"), os.path.join(local, "Volta", "bin"),
                   os.path.join(local, "Programs", "OpenAI", "Codex", "bin"),
                   os.environ.get("NVM_SYMLINK", ""), os.path.join(os.environ.get("ProgramFiles", ""), "nodejs")]
    else:
        pastas += ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/snap/bin"]
    return [p for p in pastas if p]


def path_completo():
    """PATH do processo + o do sistema + as pastas conhecidas, sem repetir. Também vai pros
    programas que o Kaizen abre: Claude Code e Gemini CLI feitos com npm precisam achar o node."""
    global _path_cache
    quando, sistema = _path_cache
    if time.time() - quando > CACHE_PATH:
        sistema = _path_do_sistema()
        _path_cache = (time.time(), sistema)
    vistas, pastas = set(), []
    for p in [*os.environ.get("PATH", "").split(os.pathsep), *sistema.split(os.pathsep), *_pastas_conhecidas()]:
        chave = os.path.normcase(os.path.normpath(p)) if p else ""
        if chave and chave not in vistas:
            vistas.add(chave)
            pastas.append(p)
    return os.pathsep.join(pastas)


def caminho(agente):
    """Onde o programa está, ou None."""
    return shutil.which(AGENTES[agente]["programa"], path=path_completo())


def instalados():
    return [a for a in AGENTES if caminho(a)]


def _texto_da_conversa(mensagens, formato):
    """As ferramentas recebem um texto só: junta instruções, conversa e o pedido de JSON."""
    sistema = "\n\n".join(m["content"] for m in mensagens if m["role"] == "system")
    conversa = [m for m in mensagens if m["role"] != "system"]

    partes = ["Responda só com texto, em português. Não use ferramentas nem leia ou altere arquivos."]
    if sistema:
        partes.append(sistema)
    if formato:
        partes.append("Responda SOMENTE com um objeto JSON válido que siga este JSON Schema:\n"
                      + json.dumps(formato, ensure_ascii=False))
    if len(conversa) == 1:
        partes.append(conversa[0]["content"])
    else:
        quem = {"user": "Usuário", "assistant": "Assistente"}
        historico = "\n\n".join(f"{quem.get(m['role'], m['role'])}: {m['content']}" for m in conversa)
        partes.append(f"Conversa até agora:\n\n{historico}\n\nResponda à última mensagem do usuário.")
    return "\n\n".join(partes)


def _comando(agente, programa, modelo, pasta):
    if agente == "claude-code":
        return [programa, "-p", "--model", modelo, "--tools", "", "--strict-mcp-config",
                "--no-session-persistence", "--output-format", "text"], None
    if agente == "gemini-cli":
        # sem terminal na entrada, o Gemini CLI responde e sai; sem --yolo ele não roda ferramenta nenhuma.
        # Plano antigo pode ter "gemini-2.5-…", que saiu do ar: aí vai o modelo da conta
        usar = modelo and modelo != "padrão" and not modelo.startswith("gemini-2.")
        return [programa, *(["-m", modelo] if usar else [])], None
    # Codex: sandbox só leitura numa pasta vazia; a resposta final vai pra um arquivo
    saida = os.path.join(pasta, "resposta.txt")
    comando = [programa, "exec", "--skip-git-repo-check", "--ephemeral", "--sandbox", "read-only",
               "--color", "never", "-o", saida]
    if modelo and modelo != "padrão":
        comando += ["-m", modelo]
    return comando + ["-"], saida


def conversar(agente, modelo, mensagens, formato=None):
    """Manda [{role, content}] pra ferramenta e devolve o texto da resposta."""
    programa = caminho(agente)
    if not programa:
        raise ErroAgente(f"O {AGENTES[agente]['nome']} não está instalado neste computador.")

    with tempfile.TemporaryDirectory(prefix="kaizen-") as pasta:
        comando, arquivo_saida = _comando(agente, programa, modelo, pasta)
        try:
            proc = subprocess.run(comando, input=_texto_da_conversa(mensagens, formato), capture_output=True,
                                  text=True, encoding="utf-8", errors="replace", timeout=TEMPO_MAXIMO, cwd=pasta,
                                  env={**os.environ, "PATH": path_completo()},
                                  # no app de computador, sem isso pisca uma janela preta a cada pergunta
                                  creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        except subprocess.TimeoutExpired:
            raise ErroAgente(f"O {AGENTES[agente]['nome']} demorou demais pra responder.")
        except OSError as erro:
            raise ErroAgente(f"Não consegui abrir o {AGENTES[agente]['nome']}: {erro}")

        texto = proc.stdout
        if arquivo_saida and os.path.isfile(arquivo_saida):
            with open(arquivo_saida, encoding="utf-8", errors="replace") as f:
                texto = f.read()

    if proc.returncode != 0 or not texto.strip():
        detalhe = (proc.stderr or proc.stdout or "").strip()[-300:]
        if any(p in detalhe.lower() for p in ("login", "log in", "sign in", "auth", "token", "credential", "api key")):
            detalhe = (f"o login dele expirou ou não foi feito. Abra um terminal, rode {AGENTES[agente]['login']} "
                       f"e tente de novo. ({detalhe[-150:]})")
        raise ErroAgente(f"O {AGENTES[agente]['nome']} não respondeu: {detalhe or 'erro desconhecido'}")
    return texto.strip()
