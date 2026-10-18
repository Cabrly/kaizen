# Gerenciador de Tarefas Acadêmicas — Kaizen

Projeto desenvolvido para a disciplina de Desenvolvimento Frontend — 2026.2.

## Entrega E4

A aplicação utiliza um estado único para controlar:

- tarefas;
- busca por título;
- filtro por status;
- filtro por prioridade;
- ordenação por prazo;
- estado de carregamento;
- tratamento de erros.

A lista exibida é derivada do estado original, sem alterar o array de tarefas carregado do arquivo JSON.

## Funcionalidades

- Carregamento de tarefas utilizando Fetch API;
- Estado de carregamento;
- Estado de erro;
- Estado de fonte vazia;
- Estado de resultado vazio;
- Busca por título;
- Filtro por status;
- Filtro por prioridade;
- Combinação de múltiplos critérios;
- Ordenação por prazo;
- Limpeza dos filtros;
- Interface responsiva;
- Feedback acessível com `aria-live`;
- Atualização centralizada da interface.

## Tecnologias

- HTML5
- CSS3
- JavaScript
- ES Modules
- Fetch API
- JSON

## Página publicada

[Acessar aplicação no GitHub Pages](https://cabrly.github.io/Trabalho-facul/)

## Modo com banco de dados local

Para salvar as tarefas em SQLite, abra um terminal nesta pasta e execute:

```bash
python3 server.py
```

Depois acesse `http://localhost:8000`. O banco será criado automaticamente em
`kaizen.sqlite3`, usando `dados.json` apenas para a carga inicial. A página do
GitHub Pages continua funcionando no modo estático, com armazenamento local do
navegador.
