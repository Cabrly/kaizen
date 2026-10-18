FROM python:3.12-slim

WORKDIR /app

# server.py usa só a biblioteca padrão do Python — sem dependências para instalar.
COPY . .

ENV HOST=0.0.0.0 \
    PORT=8000 \
    OLLAMA_URL=http://host.docker.internal:11434

EXPOSE 8000

CMD ["python3", "server.py"]
