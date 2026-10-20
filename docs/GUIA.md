# Guia do Kaizen

Tudo o que não coube no [README](../README.md): instalação em detalhe, opções de
IA, aba Estudos, dados e desenvolvimento.

- [Instalação](#instalação)
- [IA: onde ela roda](#ia-onde-ela-roda)
- [Aba Estudos](#aba-estudos)
- [Fundos que reagem às tarefas](#fundos-que-reagem-às-tarefas)
- [Seus dados](#seus-dados)
- [Desenvolvimento](#desenvolvimento)

## Instalação

### Programa de computador

Na [página de versões](https://github.com/Cabrly/kaizen/releases/latest), baixe
o instalador do seu sistema e abra com dois cliques. Não precisa de Python,
terminal nem navegador: o Kaizen abre na janela dele.

| Sistema | Arquivo |
|---|---|
| Windows | `Kaizen_x.y.z_x64-setup.exe` |
| Ubuntu / Debian | `Kaizen_x.y.z_amd64.deb` |
| Outras distros Linux | `Kaizen_x.y.z_amd64.AppImage` |
| Mac (Apple Silicon) | `Kaizen_x.y.z_aarch64.dmg` |

- **"O Windows protegeu o computador"** na primeira vez: clique em
  **Mais informações → Executar assim mesmo**. Aparece porque o app não tem
  certificado de assinatura (que é pago). No Mac, abra com botão direito → Abrir.
- **Atualiza sozinho**: quando sai versão nova, o app avisa ao abrir e se
  atualiza num clique. Seus dados ficam na pasta do usuário, então atualizar
  ou reinstalar não apaga nada.

### No celular (iPhone e Android)

Abra **https://cabrly.github.io/kaizen/** no celular.

- **iPhone:** no Safari, toque em Compartilhar → *Adicionar à Tela de Início*.
- **Android:** no Chrome, menu ⋮ → *Instalar app*.

Vira um app com ícone próprio, que abre até sem internet (só a IA precisa
dela). Na primeira vez, conecte uma IA: o jeito mais fácil é o
[OpenRouter](#ia-de-graça-com-o-openrouter).

No navegador, o Kaizen funciona sem servidor:

- os dados ficam **no aparelho** (pra usar os mesmos no PC e no celular, ligue a [sincronia](#seus-dados));
- a IA é só na nuvem (sem Ollama nem Claude Code/Gemini CLI/Codex);
- vídeos vêm do Invidious/Piped e a documentação é um link direto pro site oficial.

### Pelo código

Precisa de **Python 3.9+**. O servidor usa só a biblioteca padrão, nada de `pip install`.

```bash
git clone https://github.com/Cabrly/kaizen.git
cd kaizen
python3 server.py
```

Abra `http://localhost:8000`. O banco (`kaizen.sqlite3`) é criado sozinho.

Atalho: dois cliques em **`iniciar.bat`** (Windows) ou `./iniciar.sh`
(Linux/Mac) sobe o servidor e já abre o navegador.

Com Docker: `docker compose up -d` (o container fala com o Ollama da máquina).

## IA: onde ela roda

Tudo se configura em **Assistente IA → Onde a IA roda**.

| Opção | Custo | Onde funciona |
|---|---|---|
| No seu computador (Ollama) | grátis | programa de computador / código |
| OpenRouter | grátis | em todo lugar |
| Claude Code, Gemini CLI, Codex | sua assinatura | programa de computador / código |
| Claude, ChatGPT, Gemini, Groq… (chave de API) | por uso | em todo lugar |
| Ollama em outro computador | grátis | programa de computador / código |

### IA no seu computador, em um clique

Na aba **Assistente IA**, o Kaizen confere se o computador já tem o Ollama e
algum modelo. Se não tiver, lê a memória e a placa de vídeo, recomenda o modelo
que roda bem ali (com estrelas de potência e a velocidade esperada) e, depois
do "li e aceito", baixa e liga tudo sozinho, sem terminal e sem senha de
administrador. Em computador fraco, recomenda a IA na nuvem (grátis) em vez de
deixar travando.

Pelo terminal, se preferir: `ollama pull qwen3:8b`.

### IA de graça com o OpenRouter

1. Crie uma conta grátis em [openrouter.ai](https://openrouter.ai) (dá pra entrar com a conta Google).
2. Em [openrouter.ai/keys](https://openrouter.ai/keys), clique em **Create Key** e copie a chave (`sk-or-…`).
3. No Kaizen: **Assistente IA → Onde a IA roda → ☁ Conectar OpenRouter (modelos grátis)**, cole e salve.

Chat e planos passam a usar o `openrouter/free`, que escolhe sozinho um modelo
gratuito a cada pedido (a lista mostra só os grátis, se quiser fixar um).
Modelo grátis pode ficar lento quando está cheio, e a conta sem créditos tem um
limite diário de pedidos. Um plano gasta poucos.

O **Gemini** tem nível grátis, mas o Google tem barrado projetos novos com o
erro 403 "project denied access". Se acontecer, use o OpenRouter.

### Claude Code, Gemini CLI e Codex

Se você já usa uma dessas ferramentas, o Kaizen usa o login da sua conta (a
assinatura do Claude, a conta Google ou a do ChatGPT), sem chave de API:

- [Claude Code](https://claude.com/claude-code): modelos `sonnet`, `opus` e `haiku`
- [Gemini CLI](https://github.com/google-gemini/gemini-cli): `gemini-2.5-flash` e `gemini-2.5-pro`
- [Codex](https://github.com/openai/codex): o modelo configurado na sua conta

Instale e faça login uma vez. Elas aparecem sozinhas na lista, pro chat e pros
planos de estudo, e o Kaizen roda cada uma em segundo plano: você conversa pela
interface, sem abrir terminal. Rodam só com texto, numa pasta temporária vazia,
sem ler nem alterar seus arquivos ([`agentes.py`](../agentes.py)).

### Ollama em outro computador

Sem placa de vídeo boa? Cadastre o endereço de outra máquina (ex.: o IP do
[Tailscale](https://tailscale.com), `100.x.y.z`) e escolha qual usar. Nela, o
Ollama precisa aceitar conexões da rede:

```bash
OLLAMA_HOST=<IP do Tailscale>:11434 ollama serve
```

Use só em rede privada (Tailscale, VPN): o Ollama não tem senha.

### Qual modelo usar

O que manda é a **memória da placa de vídeo (VRAM)**: o modelo inteiro precisa
caber nela, além do que o sistema já ocupa (~0,5–1 GB no Windows).

| Nível | Placa | Exemplos | Modelo |
|---|---|---|---|
| PC fraco | sem placa boa, 8 GB de RAM | notebook comum | `llama3.2:3b` (2 GB) ou `qwen3:1.7b` (1,4 GB) |
| Mínimo | 6 GB de VRAM, 8 GB de RAM | GTX 1660, RTX 2060, RTX 3050 | `qwen3:4b` |
| **Recomendado** | 12 GB de VRAM, 16 GB de RAM | RTX 3060 12 GB, RTX 4070 | `qwen3:8b` |
| Mac | M1 ou mais novo, 16 GB | — | `qwen3:8b` |

Teste com o mesmo plano (React, 12 sessões de 1h):

| Máquina | Modelo | Velocidade | Plano |
|---|---|---|---|
| RTX A2000 12 GB (nível RTX 3060) | **`qwen3:8b`** | ~33 tokens/s | 12 sessões em ~65 s |
| RTX A2000 12 GB | `qwen3:4b` | ~63 tokens/s | 12 sessões em ~45 s |
| RTX A2000 12 GB | `qwen3:14b` | — | ~145 s, e não foi melhor |
| RTX A2000 12 GB | `gemma3:4b` | — | ~46 s, conteúdo desatualizado |
| GTX 1060 3 GB + 8 GB RAM | `qwen3:4b` | ~7,5 tokens/s (metade na CPU) | 3 sessões em ~2,5 min |

Modelos leves (o app descarta tópico repetido e pede outro no lugar):

| Modelo | Tamanho | Resultado |
|---|---|---|
| `llama3.2:3b` | 2,0 GB | 12 sessões coerentes, com o mini projeto |
| `qwen3:1.7b` | 1,4 GB | 12 sessões, boa progressão |
| `gemma3:1b` | 0,8 GB | não serve: quebra o formato da resposta |
| `qwen2.5:3b` | 1,9 GB | não serve: entra em loop |

**Pro chat**, use `qwen3:4b-instruct`: responde em ~2 s. O `qwen3:4b` comum
"pensa em voz alta" antes de responder e leva mais de um minuto numa conversa.
Nos planos isso ajuda; o instruct, por outro lado, monta planos piores.

## Aba Estudos

1. **+ Novo plano** → escreva o assunto e escolha o **idioma dos materiais**
   (Português, English ou Español). Vídeos e documentação vêm nesse idioma,
   inclusive a versão traduzida do site oficial quando existe
   (`pt-br.react.dev`, `es.react.dev`…). O texto do plano fica em português.
2. A IA faz 3 perguntas rápidas (nível, objetivo, base). Clique numa resposta
   pronta ou escreva a sua. Depois escolha os dias, o tempo por dia e por
   quantas semanas.
3. Em cerca de um minuto o calendário se preenche. Abra a sessão e vá marcando:
   - **✓** feito;
   - **✕** não fiz: o item vai sozinho pra próxima sessão daquele plano (ou pra
     uma sessão de *Pendências* no próximo dia de estudo). Clicar de novo desfaz.

### Flashcards

Quando você marca ✓ numa sessão, o Kaizen gera em segundo plano de 5 a 6
cartões daquele conteúdo. Ao abrir **🃏 Flashcards**, eles já estão prontos:
escolha um conteúdo dos últimos 14 dias ou **Revisar os de hoje**.

A revisão é espaçada: o cartão que você acerta volta em 1, 3, 7, 14 e depois
30 dias; o que você erra volta no mesmo dia. No teclado: **espaço** vira o
cartão, **1** = errei, **2** = acertei.

### O que a IA sabe de você

O Kaizen monta sozinho um resumo do seu progresso: o que você contou ao criar
cada plano, o que já concluiu e o que anda adiando. Dá pra completar com um
texto seu em **🧠 O que a IA sabe** (ex.: "faço ADS, aprendo melhor com
exemplos"). Esse resumo vai junto pro chat, pros planos novos e pros
flashcards, pra IA explicar a partir do que você já sabe. Ele é feito por
código, sem gastar IA, e fica só com você (entra no backup e na sincronia).

### Como os materiais são escolhidos

Modelo pequeno inventa link, então **a IA nunca escreve URL**. Ela só monta o
roteiro: tópicos, ordem, objetivo, termos de busca e atividades. Quem acha os
materiais é o [`busca.py`](../busca.py):

- **Vídeos:** busca no YouTube, com Invidious/Piped e busca web como reserva
  (funciona até em rede que bloqueia o YouTube). Escolhe um vídeo que cabe no
  tempo da sessão e não repete vídeo entre sessões.
- **Documentação:** lê o menu e o sitemap do site oficial do assunto e casa
  cada tópico com a página certa.
- **Datas:** calculadas pelo código a partir dos dias escolhidos, não pela IA.

## Fundos que reagem às tarefas

Clique no símbolo **改善** no topo pra escolher o fundo. Além da tinta vermelha
que enche com o progresso, há cenas que mudam a cada tarefa concluída:

| Cena | A cada tarefa | Em 100% |
|---|---|---|
| Pagode lofi | janelas e lanternas do pagode acendem | estrelas cadentes e pétalas o tempo todo |
| Fuji ao amanhecer | o cordão de lanternas sobe a trilha e o céu doura | o sol nasce sobre o mar de nuvens |
| Ensō dourado | o pincel de ouro avança no círculo zen | o círculo se fecha e o selo é carimbado |
| Ameixeira ao luar | flores vermelhas abrem no galho com neve | florada e pétalas no ar |
| Bambuzal com vaga-lumes | mais vaga-lumes acendem | a lanterna de pedra brilha forte |
| Montanhas ao pôr do sol | a paisagem é pintada em aguada | o sol pousa na crista e doura o lago |

Aperte **Z** (ou o botão de olho no canto) pra ver a cena sem o quadro. Parado
por 3 minutos, o app entra sozinho em descanso de tela. Tudo é desenhado em
código (SVG), sem imagem pra baixar.

## Seus dados

- **Sem conta e sem senha:** não existe banco de usuários, então não tem o que vazar.
- **No programa de computador**, tarefas, planos, chat e preferências ficam num
  banco SQLite na pasta do usuário. Limpar o cache do navegador não apaga nada.
- **PIN pra abrir** (botão **PIN** no rodapé), opcional, pra computador compartilhado.
- **Fazer backup / Restaurar backup** no rodapé, pra guardar um arquivo.

### PC e celular com os mesmos dados

No rodapé, **Sincronizar aparelhos → Gerar código neste aparelho**. Aparece um
código (tipo `KZ7F-Q2MA-9XTD`) e um QR: aponte a câmera do celular pro QR, ou
abra o Kaizen no outro aparelho e digite o código. A partir daí, tarefas e
planos de estudo seguem juntos sozinhos. Se os dois mudarem sem internet, o
Kaizen pergunta com qual versão ficar.

Tudo é criptografado no navegador com uma chave tirada do próprio código: o
servidor de sincronia ([`sync/`](../sync/), um Cloudflare Worker) só guarda
texto cifrado e limita tentativas de adivinhar códigos. Como não tem conta,
**quem tiver o código vê os dados**: não mostre pra ninguém. Se alguém viu,
toque em **Trocar o código**, e o antigo para de funcionar na hora. As chaves
de IA não sincronizam (conecte em cada aparelho).

## Desenvolvimento

### Organização

- `server.py`: arquivos estáticos + API SQLite + ponte com a IA.
- `estudos.py` (planejador), `busca.py` (vídeos e documentação),
  `servidores.py` (destinos de IA), `agentes.py` (Claude Code, Gemini CLI,
  Codex), `ia_local.py` (instala o Ollama em um clique).
- `prompts.json`: prompts e schemas usados pelo Python e pelo navegador.
- `js/`: o app, sem build. O `js/modo.js` decide sozinho: se encontra o
  `server.py`, usa ele; se não, liga o "servidor de bolso" em `js/nuvem/`. É
  assim que o mesmo código vira o site do celular.
- `desktop/`: janela [Tauri](https://tauri.app) na frente do mesmo
  `server.py`, empacotado com PyInstaller.
- `sync/`: servidor de sincronia (Cloudflare Worker + Durable Objects).

### Variáveis de ambiente (todas opcionais)

| Variável | Padrão | Pra quê |
|---|---|---|
| `PORT` / `HOST` | `8000` / `127.0.0.1` | onde o servidor escuta |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | onde está o Ollama |
| `SEARXNG_URL` | — | instância [SearXNG](https://docs.searxng.org) própria pra busca web (mais estável que os buscadores públicos, se for hospedar pra muita gente) |

### Gerar os instaladores

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
na página de versões, com o arquivo de atualização automática. Precisa do
segredo `TAURI_SIGNING_PRIVATE_KEY` no repositório (Settings → Secrets →
Actions) com a chave privada gerada por `npm run chaves`. **Não perca essa
chave:** sem ela, quem já instalou não recebe mais atualização.

### Publicar a sua versão

Faça um fork e ative **Settings → Pages → Deploy from a branch → `main` / `(root)`**.
O endereço `https://<seu-usuario>.github.io/<repositório>/` já é o app.

A sincronia usa o servidor do projeto por padrão. Pra ter o seu (grátis na
Cloudflare): em `sync/`, rode `npm install`, `npx wrangler login` e
`npm run deploy`, e troque o `SERVIDOR_PADRAO` em `js/sincronia.js` pelo
endereço que o deploy mostrar. Cada código vira um Durable Object (SQLite,
incluso no plano grátis), então não tem banco pra criar.
