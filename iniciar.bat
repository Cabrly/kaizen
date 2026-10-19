@echo off
rem Kaizen: sobe o servidor e abre o navegador. Feche esta janela pra desligar.
cd /d "%~dp0"
echo Kaizen em http://localhost:8000  (feche esta janela pra desligar)
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:8000"
python server.py
if errorlevel 1 (
    echo.
    echo Nao consegui iniciar. O Python 3.9+ esta instalado? https://www.python.org/downloads/
    pause
)
