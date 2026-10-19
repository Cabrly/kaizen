"""Empacota o server.py (com o front junto) num executável único, pro app de computador.

O Tauri chama esse executável de "sidecar" e procura por ele com o nome da
plataforma no fim (ex.: kaizen-servidor-x86_64-unknown-linux-gnu), em
src-tauri/binarios/. Uso: python empacotar_servidor.py [alvo-rust]
"""
from pathlib import Path
import shutil
import subprocess
import sys

DESKTOP = Path(__file__).resolve().parent
RAIZ = DESKTOP.parent
SAIDA = DESKTOP / "src-tauri" / "binarios"
NOME = "kaizen-servidor"

# Tudo que o navegador pede ao servidor (o resto do repositório não vai junto).
ARQUIVOS = ["index.html", "style.css", "sw.js", "manifest.webmanifest", "dados.json", "prompts.json"]
PASTAS = ["js", "icones"]   # js/ inclui js/cenas/


def alvo_rust():
    """Plataforma no formato do Rust; o Tauri exige ela no nome do sidecar."""
    if len(sys.argv) > 1:
        return sys.argv[1]
    saida = subprocess.run(["rustc", "-vV"], capture_output=True, text=True, check=True).stdout
    return next(linha.split(": ", 1)[1] for linha in saida.splitlines() if linha.startswith("host: "))


def main():
    separador = ";" if sys.platform == "win32" else ":"
    dados = [f"{RAIZ / a}{separador}." for a in ARQUIVOS] + [f"{RAIZ / p}{separador}{p}" for p in PASTAS]
    construir = DESKTOP / "build"
    subprocess.run([
        sys.executable, "-m", "PyInstaller", str(RAIZ / "server.py"),
        "--onefile", "--noconfirm", "--clean", "--name", NOME,
        "--distpath", str(construir / "dist"), "--workpath", str(construir / "work"),
        "--specpath", str(construir), "--paths", str(RAIZ),
        # o tarfile só importa o zstd na hora de abrir o pacote do Ollama no Linux
        "--hidden-import", "compression.zstd",
        *[arg for d in dados for arg in ("--add-data", d)],
    ], check=True)

    extensao = ".exe" if sys.platform == "win32" else ""
    SAIDA.mkdir(parents=True, exist_ok=True)
    destino = SAIDA / f"{NOME}-{alvo_rust()}{extensao}"
    shutil.copy2(construir / "dist" / f"{NOME}{extensao}", destino)
    print(f"Sidecar pronto: {destino}")


if __name__ == "__main__":
    main()
