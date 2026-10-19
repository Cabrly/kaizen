# Kaizen — kanban + estudos com IA local

改善 — melhoria contínua, um passo de cada vez.

**Use agora:** https://cabrly.github.io/kaizen/ (celular ou PC, IA na nuvem) · ou baixe a versão completa (abaixo).

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

## No celular (iPhone e Android)

O Kaizen também roda inteiro no navegador, sem servidor nenhum. Abra
**https://cabrly.github.io/kaizen/** no celular.

- **iPhone:** no Safari, toque em Compartilhar → *Adicionar à Tela de Início*.
- **Android:** no Chrome, menu ⋮ → *Instalar app*.

Vira um app com ícone próprio, que abre até sem internet (só a IA precisa
dela). Na primeira vez, vá em **Assistente IA → Onde a IA roda** e conecte o
**Gemini** (a chave é grátis no [Google AI Studio](https://aistudio.google.com/apikey)),
o **OpenRouter** (modelos grátis, chave em [openrouter.ai/keys](https://openrouter.ai/keys)), o **Claude**, o **ChatGPT** ou qualquer API compatível com OpenAI (Groq…).

Se o Gemini responder que o projeto da chave foi negado (403), crie a chave num **projeto novo** no AI Studio; se continuar, o bloqueio é da conta Google — use o OpenRouter.

Sem servidor, o Kaizen funciona assim:

- os dados (tarefas, planos, chaves) ficam **só no aparelho**, sem
  sincronizar entre celular e PC;
- a IA é só na nuvem (sem Ollama);
- vídeos vêm do Invidious/Piped e a documentação é um link que cai direto na
  página do site oficial.

O mesmo código decide sozinho: se encontra o `server.py`, usa ele; se não
encontra, liga o "servidor de bolso" em `js/nuvem/`.

### Publicar a sua versão

Faça um fork (ou suba o código num repositório seu) e ative
**Settings → Pages → Deploy from a branch → `main` / `(root)`**. Pronto: o
endereço `https://<seu-usuario>.github.io/<repositório>/` já é o app.

## Baixar e rodar no PC (versão completa)

No GitHub, **Code → Download ZIP** (ou `git clone`), extraia e dê dois cliques
no `iniciar.bat` (Windows) ou rode `./iniciar.sh` (Linux/Mac). Precisa de
Python 3.9+; com o Ollama instalado, a IA roda no seu computador.

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

O servidor em si é leve e roda em qualquer máquina. Quem pesa é a IA local, e
o que manda é a **memória da placa de vídeo (VRAM)**: o modelo inteiro precisa
caber nela, além do que o sistema já ocupa (~0,5–1 GB no Windows).

| Nível | Placa | Exemplos | Modelo |
|---|---|---|---|
| **Mínimo** | 6 GB de VRAM, 8 GB de RAM | GTX 1660, RTX 2060, RTX 3050 | `qwen3:4b` inteiro na placa |
| **Recomendado** | 12 GB de VRAM, 16 GB de RAM | RTX 3060 12 GB, RTX 4070 | `qwen3:8b` com folga |
| Mac | M1 ou mais novo, 16 GB | — | `qwen3:8b` (memória compartilhada) |

O que foi medido (plano de React):

| Máquina | Modelo | Velocidade | Plano |
|---|---|---|---|
| RTX A2000 12 GB (nível RTX 3060) | `qwen3:8b` | ~33 tokens/s | 12 sessões em ~65 s |
| RTX A2000 12 GB | `qwen3:4b` | ~63 tokens/s | 12 sessões em ~45 s |
| GTX 1060 3 GB + 8 GB RAM | `qwen3:4b` | ~7,5 tokens/s (metade na CPU) | 3 sessões em ~2,5 min |

Abaixo do mínimo funciona, só que devagar (a tela mostra o progresso sessão a
sessão). Nesse caso compensa usar a IA de outra máquina (veja abaixo) ou o
Claude. Modelos menores que 4B (`qwen3:1.7b`, `qwen2.5:3b`) foram testados e
não servem: repetem sessões ou entram em loop.

**Pro chat** use `qwen3:4b-instruct` (`ollama pull qwen3:4b-instruct`): responde
em ~2 s. O `qwen3:4b` comum sempre "pensa em voz alta" antes de responder e
leva mais de um minuto numa conversa; nos planos isso não atrapalha (e ajuda).
O instruct, por outro lado, monta planos piores (fugiu do assunto no teste).

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
