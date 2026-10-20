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

### A IA do seu PC no celular

O celular pode usar os modelos do seu computador (Ollama, Claude Code, Gemini
CLI, Codex) sem chave de API. A ligação passa pelo
[Tailscale](https://tailscale.com), uma rede privada e grátis entre os seus
aparelhos, e tudo se configura pela tela:

1. No Kaizen do PC: aba do assistente → **Outras opções** → **Usar a IA deste
   PC no celular**. Um passo de cada vez, cada um com um botão: instalar o
   Tailscale (no Windows, pelo winget), entrar na conta, ativar o HTTPS da rede
   (um clique, só na primeira vez) e **Liberar pro celular**.
2. No celular, instale o Tailscale com a mesma conta e aponte a câmera pro QR
   Code. Ou, no Kaizen do celular, toque em **Conectar Kaizen do meu PC** e
   digite o endereço e a chave.

O PC precisa estar ligado e com o Kaizen aberto. Os dados do celular continuam
no celular: só o texto de cada pedido vai pro PC, que devolve a resposta. Pelo
Tailscale, o PC responde só às duas rotas da IA (`/api/remoto/modelos` e
`/api/remoto/conversar`), e só com a chave. Tarefas, backup e chaves de API
continuam fechados ([`remoto.py`](../remoto.py)). Se a chave vazar, troque em
**Trocar a chave**.

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

### Entregar atividades e receber nota

Em cada atividade da sessão tem o botão **📤 Entregar**. Dá pra escrever a
resposta, anexar até 10 arquivos de código ou texto (ou arrastar pra janela) e
colar um link. De um repositório público do GitHub, o Kaizen lê o README e os
arquivos principais; de um link de arquivo (`/blob/`), só aquele arquivo.
Entregar marca a atividade como feita.

Se a IA conectada for forte (Claude Code, Gemini CLI, Codex, ChatGPT/GPT-4o,
Claude, Gemini 2.x, DeepSeek, modelos de 14B ou mais...), ela corrige sozinha
em segundo plano: **nota de 0 a 10**, o que ficou bom, os erros (citando o
arquivo e o trecho), como melhorar e os pontos em que você mostrou
dificuldade. Esses pontos entram no "o que a IA sabe de você", então os
próximos planos, flashcards e o chat reforçam exatamente isso. Modelos
pequenos (qwen3:4b, llama3.2:3b) dariam nota no chute: a entrega fica
guardada e você pede a correção depois de conectar uma IA melhor.

Limites: até 500 mil caracteres por arquivo, e a IA lê até 200 mil por
entrega. Projeto grande: mande o link do GitHub.

### Compartilhar um plano com a turma

O 🔗 de cada plano gera um link e um QR Code. Quem abre ganha uma cópia do
plano: o roteiro, os vídeos, as atividades e os flashcards. O seu progresso, as
suas entregas e as suas notas não vão junto. A pessoa escolhe os dias, a data
de início e o horário, e o plano entra como um plano novo dela. Os flashcards
de cada sessão só aparecem na revisão depois que ela estuda aquela sessão.
Quem não usa o Kaizen pode abrir o link direto no celular, sem instalar nada.

O plano vai cifrado pro mesmo servidor da sincronia, com uma chave que só
existe no link, e o link vale por 1 ano. **Parar de compartilhar** apaga o
plano do servidor (quem já abriu continua com a cópia). Também dá pra colar o
link em **+ Novo plano → Recebeu o link de um plano?**.

### Agenda do celular

O 📅 de cada plano baixa um arquivo `.ics` com as sessões de hoje em diante,
que o Google Agenda, o calendário do iPhone e o Outlook abrem. Com horário no
plano, cada sessão vira um evento com duração e um aviso antes (de 5 minutos a
1 hora). Sem horário, vira um evento de dia inteiro que avisa às 9h. Mudou o
plano? É só baixar de novo: as sessões são atualizadas, não duplicadas.

### Resumo da semana

O **📊 Semana** mostra os últimos 7 dias: as sessões estudadas do que estava
planejado, os itens concluídos e o tempo, as entregas com a média das notas e
os flashcards dominados. Também mostra até três dicas pra próxima semana, como
sessões atrasadas, assuntos em que as correções acharam dificuldade, uma nota
baixa pra refazer ou cartões esperando revisão. No domingo ou na segunda ele
abre sozinho, uma vez por semana. É tudo calculado no aparelho, sem IA.

### Pets de estudo (opcional)

Em **🐾 Pets → Ativar os pets**, cada plano ganha um bichinho. Ao criar um
plano, você adota o pet (bicho, cor, nome e roupinha) enquanto a IA monta o
roteiro.

- **Humor:** feliz quando você estuda no dia; tristinho quando a sessão passa
  sem nada feito. Ele volta a sorrir quando você faz o que ficou pendente.
- **Pontos:** você começa com 150 e ganha 10 por item feito, 20 por sessão
  completa e 100 por plano concluído. Na **Loja** eles viram 24 bichos (gato,
  cachorro, hamster, coelho, pintinho, sapo, ratinho, porquinho, vaquinha,
  raposa, panda, urso, coala, pinguim, macaco, coruja, tigre, leão, lobo,
  fantasminha, robô, ET, unicórnio e dragão), mais de 80 acessórios (capelo,
  coroa, óculos pixelados, pão na cara, chapéu de alumínio, bigode, correntão,
  cachecóis das quatro casas, comidinhas, violão…), 15 tons de pelo (até RGB
  gamer) e 13 cenários.
- **Status:** a seção Status da loja muda o jeito do pet reagir em cada humor.
  Triste: banho triste, violininho, "tá tudo bem" no meio do fogo, cri-cri,
  derretendo. Feliz: giro OIIA, vibando, stonks, óculos caindo, muito wow,
  rastro de arco-íris, discoteca, morri de rir. Esperando: teia de aranha,
  fazendo contas, olhar de canto, pensativo, soneca. Compre e escolha na ficha
  do pet qual usar em cada humor.
- **Jardim:** plano concluído, o pet vai morar lá. Clicando nele você vê tudo
  o que estudaram juntos (tópicos, vídeos, documentação) e revisa os
  flashcards daquele período.
- **Aprender mais:** reative um pet do jardim pra criar um plano novo no mesmo
  assunto. A IA recebe o que você já estudou, faz perguntas novas e monta um
  plano que aprofunda, sem repetir o básico.

Desligar os pets não apaga nada: aparência e compras ficam guardadas.

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

Aperte **Z** (ou o botão de olho no canto) pra ver a cena sem o quadro. O
descanso de tela (entra sozinho depois de 3 minutos parado) vem desligado: quem
quiser liga no menu de fundos. Tudo é desenhado em código (SVG), sem imagem pra
baixar.

## Acessibilidade

No botão **Acessibilidade** do rodapé:

- **Tamanho do texto**: normal, grande ou maior, no app inteiro.
- **Alto contraste**: fundo branco liso, texto preto, bordas fortes e foco bem visível.
- **Menos movimento**: sem animações nem o rastro do mouse. O Kaizen já liga
  sozinho se o sistema estiver com "reduzir movimento".
- **Texto mais espaçado**: mais espaço entre linhas, letras e palavras, o que
  ajuda na dislexia.
- **Leitura em voz alta**: 🔊 nas respostas do assistente, na sessão aberta e
  nos flashcards, e um botão **Ler** em cima de qualquer texto que você
  selecionar. Usa a voz do próprio aparelho, em português e sem internet.

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

Cada código guarda até uns 32 MB (já comprimidos e criptografados), o que dá
pra centenas de atividades entregues com arquivos. No programa de computador,
a janela de sincronia tem a opção **Arquivos das atividades entregues**: vão
todos pro outro aparelho (padrão), só os dos planos em andamento, ou nenhum
(vão só as notas e correções; os arquivos ficam no PC). No celular sem PC,
os arquivos ficam no próprio aparelho, sem limite apertado.

## Desenvolvimento

### Organização

- `server.py`: arquivos estáticos + API SQLite + ponte com a IA.
- `estudos.py` (planejador), `busca.py` (vídeos e documentação),
  `servidores.py` (destinos de IA), `agentes.py` (Claude Code, Gemini CLI,
  Codex), `ia_local.py` (instala o Ollama em um clique), `remoto.py` (a IA
  do PC no celular, pelo Tailscale).
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
| `KAIZEN_HOSTS` | — | outros nomes pelos quais você abre o Kaizen, separados por vírgula (ex.: `meupc,100.80.57.121`). Com `HOST=127.0.0.1`, o servidor recusa qualquer endereço que não seja `localhost`/`127.0.0.1`, pra nenhum site conseguir mexer nele |
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
