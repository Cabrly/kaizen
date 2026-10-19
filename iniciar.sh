#!/bin/sh
# Kaizen: sobe o servidor e abre o navegador. Ctrl+C desliga.
cd "$(dirname "$0")" || exit 1
( sleep 2; (xdg-open http://localhost:8000 || open http://localhost:8000) >/dev/null 2>&1 ) &
exec python3 server.py
