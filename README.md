# Kaizen — kanban + estudos com IA local

改善 — melhoria contínua, um passo de cada vez.

<p align="center">
  <a href="https://github.com/Cabrly/kaizen/releases/latest"><img alt="Baixar o Kaizen para Windows, Linux e Mac" src="https://img.shields.io/badge/%E2%AC%87%20BAIXAR%20O%20KAIZEN-Windows%20%C2%B7%20Linux%20%C2%B7%20Mac-c90016?style=for-the-badge"></a>
  <br>
  <sub>ou use no navegador: <a href="https://cabrly.github.io/kaizen/">cabrly.github.io/kaizen</a> (celular ou PC, IA na nuvem — de graça com o <a href="#ia-de-graça-openrouter">OpenRouter</a>)</sub>
</p>

Kanban de tarefas com um assistente de estudos: você diz o que quer
aprender ("quero estudar React") e a IA monta a rotina no calendário,
com **vídeo**, **documentação oficial** e **atividades** pra cada dia.
Roda inteiro na sua máquina, com modelos leves do [Ollama](https://ollama.com).
Não precisa de chave de API nem de conta em serviço nenhum.

## Fundos que reagem às tarefas

Clique no símbolo **改善** no topo pra escolher o fundo. Além da tinta vermelha
que enche com o progresso, há **cenas que mudam a cada tarefa concluída**:

| Cena | A cada tarefa | Em 100% |
|---|---|---|
| Pagode lofi | janelas e lanternas do pagode acendem | tudo aceso; estrelas cadentes e pétalas o tempo todo |
| Fuji ao amanhecer | o cordão de lanternas sobe a trilha e o céu doura | o sol nasce sobre o mar de nuvens |
| Ensō dourado | o pincel de ouro avança no círculo zen | o círculo se fecha e o selo é carimbado |
| Ameixeira ao luar | flores vermelhas abrem no galho com neve | florada e pétalas no ar |
| Bambuzal com vaga-lumes | mais vaga-lumes acendem | a lanterna de pedra brilha forte |
| Montanhas ao pôr do sol | a paisagem é pintada em aguada | o sol pousa na crista e doura o lago |

Pra ver a cena inteira, sem o quadro na frente: aperte **Z** (ou o botão de
olho no canto). Parado por 3 minutos, o app entra sozinho em **descanso de
tela**. Tudo é desenhado em código (SVG), sem imagem pra baixar.

## Programa de computador (instalador)

Na página [Releases](https://github.com/Cabrly/kaizen/releases/latest), baixe o
instalador do seu sistema e abra com dois cliques. Não precisa de Python,
terminal nem navegador: o Kaizen abre na janela dele.

| Sistema | Arquivo |
|---|---|
| Windows | `Kaizen_x.y.z_x64-setup.exe` |
| Ubuntu / Debian | `Kaizen_x.y.z_amd64.deb` |
| Outras distros Linux | `Kaizen_x.y.z_amd64.AppImage` |
| Mac (Apple Silicon) | `Kaizen_x.y.z_aarch64.dmg` |

- **"O Windows protegeu o computador"** na primeira vez: clique em
  **Mais informações → Executar assim mesmo**. Aparece porque o app não tem
  certificado de assinatura (que é pago); no Mac, abra com botão direito → Abrir.
- **Atualiza sozinho**: quando sai versão nova, o app avisa ao abrir e se
  atualiza num clique. Suas tarefas e planos ficam na pasta do usuário
  (não junto do programa), então atualizar ou reinstalar não apaga nada.
- **IA em um clique**: na aba **Assistente IA**, o Kaizen confere se o
  computador já tem o Ollama e algum modelo. Se não tiver, lê a memória e a
  placa de vídeo, recomenda o modelo que roda bem ali (com estrelas de
  potência e a velocidade esperada) e, depois do "li e aceito", baixa e liga
  tudo sozinho, sem terminal e sem senha de administrador. Em computador fraco
  ele recomenda a IA na nuvem (grátis) em vez de deixar travando.

### Gerar os instaladores (pra quem mantém o projeto)

O código do programa fica em `desktop/`: uma janela [Tauri](https://tauri.app)
na frente do mesmo `server.py`, empacotado com PyInstaller.

```bash
cd desktop
python -m venv .venv && .venv/bin/pip install pyinstaller
.venv/bin/python empacotar_servidor.py   # gera o servidor em src-tauri/binarios/
npm install
npm run dev                              # abre o app pra testar
npm run build                            # instaladores em src-tauri/target/release/bundle/
```

Lançar uma versão: `git tag v1.2.0 && git push origin v1.2.0`. O GitHub Actions
(`.github/workflows/lancamento.yml`) compila pra Windows, Linux e Mac e publica
na Releases, com o arquivo de atualização automática. Precisa do segredo
`TAURI_SIGNING_PRIVATE_KEY` no repositório (Settings → Secrets → Actions) com o
conteúdo da chave privada gerada por `npm run chaves`. **Não perca essa chave:**
sem ela, quem já instalou não recebe mais atualização.

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
dela). Na primeira vez, conecte uma IA (veja abaixo).

### IA de graça: OpenRouter

O jeito recomendado de usar sem pagar nada:

1. Crie uma conta grátis em [openrouter.ai](https://openrouter.ai) (dá pra entrar com a conta Google).
2. Em [openrouter.ai/keys](https://openrouter.ai/keys), clique em **Create Key** e copie a chave (`sk-or-…`).
3. No Kaizen: **Assistente IA → Onde a IA roda → ☁ Conectar OpenRouter (modelos grátis)**, cole e salve.

Pronto: chat e planos usam o `openrouter/free`, que escolhe sozinho um modelo
gratuito disponível a cada pedido (a lista mostra só os grátis, se quiser fixar
um). Modelo grátis pode ficar lento quando está cheio, e a conta sem créditos
tem um limite diário de pedidos — um plano gasta poucos.

**Outras opções:** **Claude** e **ChatGPT** (chave de API, pagos por uso),
qualquer API compatível com OpenAI (Groq…) e **Gemini** — este tem nível grátis,
mas o Google tem barrado projetos novos com o erro 403 "project denied access";
se acontecer, use o OpenRouter.

Sem servidor, o Kaizen funciona assim:

- os dados (tarefas, planos, chaves) ficam **no aparelho** — pra usar os
  mesmos no PC e no celular, ligue a sincronia (abaixo);
- a IA é só na nuvem (sem Ollama);
- vídeos vêm do Invidious/Piped e a documentação é um link que cai direto na
  página do site oficial.

O mesmo código decide sozinho: se encontra o `server.py`, usa ele; se não
encontra, liga o "servidor de bolso" em `js/nuvem/`.

### PC e celular com os mesmos dados

No rodapé, **Sincronizar aparelhos → Gerar código neste aparelho**. Aparece
um código (tipo `KZ7F-Q2MA-9XTD`) e um QR: aponte a câmera do celular pro QR,
ou abra o Kaizen no outro aparelho e digite o código. A partir daí as tarefas
e os planos de estudo seguem juntos sozinhos — vale pro PC com o `server.py`
e pro app do celular. Se os dois mudarem sem internet, o Kaizen pergunta com
qual versão ficar.

Tudo é criptografado no navegador com uma chave tirada do próprio código: o
servidor de sincronia ([`sync/`](sync/), um Cloudflare Worker) só guarda texto
cifrado. Sem conta nem senha, então **quem tiver o código vê os dados** —
não mostre pra ninguém. As chaves de IA não sincronizam (conecte em cada
aparelho). **Fazer backup / Restaurar backup** continua lá pra guardar um
arquivo.

### Publicar a sua versão

Faça um fork (ou suba o código num repositório seu) e ative
**Settings → Pages → Deploy from a branch → `main` / `(root)`**. Pronto: o
endereço `https://<seu-usuario>.github.io/<repositório>/` já é o app.

A sincronia usa o servidor do projeto por padrão. Pra ter o seu (grátis na
Cloudflare): em `sync/`, rode `npm install`, `npx wrangler login` e
`npm run deploy`; depois troque o `SERVIDOR_PADRAO` em `js/sincronia.js`
pelo endereço que o deploy mostrar. Cada código vira um Durable Object
(SQLite, incluso no plano grátis), então não tem banco pra criar.

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
| **PC fraco** | sem placa boa, 8 GB de RAM | notebook comum | `llama3.2:3b` (2 GB) ou `qwen3:1.7b` (1,4 GB) — mais lento e planos mais simples |
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
Claude (ou o OpenRouter, de graça).

Modelos leves, testados montando 12 sessões de React (o app descarta tópico
repetido e pede outro no lugar):

| Modelo | Tamanho | Resultado |
|---|---|---|
| `llama3.2:3b` | 2,0 GB | 12 sessões coerentes, com o mini projeto |
| `qwen3:1.7b` | 1,4 GB | 12 sessões, progressão boa, fecha no mini projeto |
| `gemma3:1b` | 0,8 GB | não serve: quebra o formato da resposta |
| `qwen2.5:3b` | 1,9 GB | não serve: entra em loop |

**Pro chat** use `qwen3:4b-instruct` (`ollama pull qwen3:4b-instruct`): responde
em ~2 s. O `qwen3:4b` comum sempre "pensa em voz alta" antes de responder e
leva mais de um minuto numa conversa; nos planos isso não atrapalha (e ajuda).
O instruct, por outro lado, monta planos piores (fugiu do assunto no teste).

Qualquer modelo instalado no Ollama aparece pra escolher.

### Claude Code, Gemini CLI e Codex (sem chave de API)

Se você já usa uma dessas ferramentas de terminal, o Kaizen usa ela pelo login
da sua conta (a assinatura do Claude, a conta Google ou a do ChatGPT), sem
precisar de chave de API:

- [Claude Code](https://claude.com/claude-code) — modelos `sonnet`, `opus` e `haiku`
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) — `gemini-2.5-flash` e `gemini-2.5-pro`
- [Codex](https://github.com/openai/codex) — o modelo configurado na sua conta

Instale, faça login uma vez no terminal e abra o Kaizen: elas aparecem sozinhas
em **Assistente IA → Onde a IA roda**, pro chat e pros planos de estudo. Rodam
só com texto, numa pasta temporária vazia, sem ler nem alterar seus arquivos
(`agentes.py`). Só no PC ou no app de computador: o navegador do celular não
roda programas.

### Configuração (variáveis de ambiente, todas opcionais)

| Variável | Padrão | Pra quê |
|---|---|---|
| `PORT` / `HOST` | `8000` / `127.0.0.1` | onde o servidor escuta |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | onde está o Ollama |
| `SEARXNG_URL` | — | instância [SearXNG](https://docs.searxng.org) própria pra busca web (mais estável que os buscadores públicos, se você for hospedar pra muita gente) |
