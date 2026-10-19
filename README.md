# Kaizen — kanban + estudos com IA local

改善 — melhoria contínua, um passo de cada vez.

Kanban de tarefas com um assistente de estudos: você diz o que quer
aprender ("quero estudar React") e a IA monta a rotina no calendário,
com **vídeo**, **documentação oficial** e **atividades** pra cada dia.
Roda inteiro na sua máquina, com modelos leves do [Ollama](https://ollama.com).
Não precisa de chave de API nem de conta em serviço nenhum.

## Como rodar

Precisa de **Python 3.9+** e do **Ollama**. O servidor usa só a biblioteca padrão
do Python, então não há nada pra instalar com pip.

```bash
ollama pull qwen3:8b      # modelo recomendado (~5 GB)
ollama serve              # se o Ollama ainda não estiver rodando
python3 server.py
```

Abra `http://localhost:8000`. O banco (`kaizen.sqlite3`) é criado sozinho.

Atalho: dois cliques em **`iniciar.bat`** (Windows) ou `./iniciar.sh` (Linux/Mac)
sobe o servidor e já abre o navegador.

### IA em outro computador

Sem placa de vídeo boa? A IA pode rodar em outra máquina. Na aba
**Assistente IA → Onde a IA roda**, cadastre o endereço dela (ex.: o IP do
[Tailscale](https://tailscale.com), `100.x.y.z`) e escolha qual usar. Os
planos de estudo podem usar modelos de qualquer servidor online.

Na outra máquina, o Ollama precisa aceitar conexões da rede:
`OLLAMA_HOST=<IP do Tailscale>:11434 ollama serve`. Use só em rede privada
(Tailscale, VPN): o Ollama não tem senha.

Com Docker: `docker compose up -d` (o container fala com o Ollama da máquina).

## Aba Estudos

1. **+ Novo plano** → escreva o assunto e escolha o **idioma dos materiais**
   (Português, English ou Español). Vídeos e documentação são buscados nesse
   idioma, inclusive a versão traduzida do site oficial quando existe
   (`pt-br.react.dev`, `es.react.dev`…). O texto do plano fica em português.
2. A IA faz 3 perguntas rápidas (nível, objetivo, base). Clique numa das
   respostas prontas ou escreva a sua. Depois escolha os dias, o tempo por dia
   e por quantas semanas.
3. Em cerca de um minuto o calendário se preenche. Clique num dia, abra a
   sessão e vá marcando:
   - **✓** feito;
   - **✕** não fiz: o item vai sozinho pra próxima sessão daquele plano (ou
     pra uma sessão de *Pendências* no próximo dia de estudo). Clicar de novo
     desfaz.

### Como os materiais são escolhidos

Modelo pequeno inventa link, então **a IA nunca escreve URL**. Ela só monta o
roteiro: tópicos, ordem, objetivo, termos de busca e atividades. Quem acha os
materiais é o `busca.py`:

- **Vídeos:** busca no YouTube, com Invidious/Piped e busca web como reserva
  (funciona até em rede que bloqueia o YouTube). Escolhe um vídeo que cabe no
  tempo da sessão e não repete vídeo entre sessões.
- **Documentação:** lê o menu e o sitemap do site oficial do assunto (em
  português quando existe, ex. `pt-br.react.dev`) e casa cada tópico com a
  página certa.
- As datas são calculadas pelo código a partir dos dias escolhidos, não pela IA.

### Qual modelo usar

Teste com o mesmo plano (React, 12 sessões de 1h) numa RTX A2000 12 GB:

| Modelo | Tempo do roteiro | Observação |
|---|---|---|
| `qwen3:4b` | ~45 s | o mais leve; bom pra PC sem placa de vídeo boa |
| **`qwen3:8b`** | ~65 s | **recomendado**: melhor equilíbrio entre qualidade e velocidade |
| `qwen3:14b` | ~145 s | mais lento e não foi melhor |
| `gemma3:4b` | ~46 s | conteúdo desatualizado e estourava o tempo das sessões |

### Que computador precisa

O servidor em si é leve e roda em qualquer máquina. Quem pesa é a IA local:

| Modelo | RAM | Com placa de vídeo | Só com processador |
|---|---|---|---|
| `qwen3:4b` | 8 GB | 4 GB de VRAM já fica rápido | funciona; plano de 12 sessões em ~2–4 min* |
| `qwen3:8b` | 16 GB | 6–8 GB de VRAM (ex.: RTX 3050/3060) | funciona, mas lento: ~5–10 min* |
| Claude | qualquer | não precisa | roda na nuvem (precisa da conta) |

Cada modelo ocupa de 3 a 5 GB em disco. \*Tempos sem GPU são estimativa; os
medidos foram numa RTX A2000 12 GB (4b ≈ 63 tokens/s, 8b ≈ 33 tokens/s).

Qualquer modelo instalado no Ollama aparece pra escolher. Se você tiver o
[Claude Code](https://claude.com/claude-code) instalado e logado, ele também
aparece como opção.

### Configuração (variáveis de ambiente, todas opcionais)

| Variável | Padrão | Pra quê |
|---|---|---|
| `PORT` / `HOST` | `8000` / `127.0.0.1` | onde o servidor escuta |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | onde está o Ollama |
| `SEARXNG_URL` | — | instância [SearXNG](https://docs.searxng.org) própria pra busca web (mais estável que os buscadores públicos, se você for hospedar pra muita gente) |

---

## Histórico: Gerenciador de Tarefas Acadêmicas

Projeto desenvolvido para a disciplina de Desenvolvimento Frontend — 2026.2.

### Entrega E4

A aplicação utiliza um estado único para controlar:

- tarefas;
- busca por título;
- filtro por status;
- filtro por prioridade;
- ordenação por prazo;
- estado de carregamento;
- tratamento de erros.

A lista exibida é derivada do estado original, sem alterar o array de tarefas carregado do arquivo JSON.

### Funcionalidades

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

### Tecnologias

- HTML5
- CSS3
- JavaScript
- ES Modules
- Fetch API
- JSON

### Página publicada

[Acessar aplicação no GitHub Pages](https://cabrly.github.io/Trabalho-facul/)

### Modo com banco de dados local

Para salvar as tarefas em SQLite, abra um terminal nesta pasta e execute:

```bash
python3 server.py
```

Depois acesse `http://localhost:8000`. O banco será criado automaticamente em
`kaizen.sqlite3`, usando `dados.json` apenas para a carga inicial. A página do
GitHub Pages continua funcionando no modo estático, com armazenamento local do
navegador.
