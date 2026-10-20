"""IA pelas ferramentas de terminal que a pessoa já usa: Claude Code, Gemini CLI e Codex.

Cada uma usa o login da própria ferramenta (a assinatura do Claude, a conta
Google, a conta do ChatGPT), então não precisa de chave de API. Só funciona
com o server.py (PC ou app de computador): o navegador não roda programas.

Aparecem em "Onde a IA roda" sozinhas quando estão instaladas. Rodam sem
ferramentas (só texto), numa pasta temporária vazia, pra não ler nem mexer
em arquivo nenhum do computador.
"""
import json
import os
import shutil
import subprocess
import tempfile

TEMPO_MAXIMO = 600   # plano de estudo grande demora; o chat responde bem antes


AGENTES = {
    "claude-code": {
        "nome": "Claude Code",
        "programa": "claude",
        "modelos": ["sonnet", "opus", "haiku"],
        "como_instalar": "https://claude.com/claude-code",
    },
    "gemini-cli": {
        "nome": "Gemini CLI",
        "programa": "gemini",
        "modelos": ["gemini-2.5-flash", "gemini-2.5-pro"],
        "como_instalar": "https://github.com/google-gemini/gemini-cli",
    },
    "codex": {
        "nome": "Codex (ChatGPT)",
        "programa": "codex",
        "modelos": ["padrão"],          # o Codex escolhe o modelo da conta
        "como_instalar": "https://github.com/openai/codex",
    },
}


class ErroAgente(Exception):
    pass


def caminho(agente):
    """Onde o programa está, ou None. O npm global nem sempre está no PATH do serviço."""
    programa = AGENTES[agente]["programa"]
    pastas = [os.path.expanduser("~/.npm-global/bin"), os.path.expanduser("~/.local/bin"),
              os.path.join(os.environ.get("APPDATA", ""), "npm"),
              os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "OpenAI", "Codex", "bin")]
    extras = [os.path.join(p, programa + ext) for p in pastas for ext in ("", ".exe", ".cmd")]
    return shutil.which(programa) or next((c for c in extras if os.path.isfile(c)), None)


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
        # sem terminal na entrada, o Gemini CLI responde e sai; sem --yolo ele não roda ferramenta nenhuma
        return [programa, "-m", modelo], None
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
        if any(p in detalhe.lower() for p in ("login", "auth", "not logged", "credential", "api key")):
            detalhe = f"faça login no {AGENTES[agente]['nome']} pelo terminal e tente de novo. ({detalhe})"
        raise ErroAgente(f"O {AGENTES[agente]['nome']} não respondeu: {detalhe or 'erro desconhecido'}")
    return texto.strip()
