/* =========================================================
   TUTORIAL — o passeio da primeira abertura
   ---------------------------------------------------------
   Quem abre o Kaizen pela primeira vez (nada "kaizen." no
   navegador, ver o script do <head>) ganha um passeio: a
   tela toda embaçada, menos o pedaço sendo explicado.
   Kanban → IA própria (e a do Kaizen, grátis e mais fraca)
   → cronograma de estudos. O botão Tutorial do rodapé
   mostra de novo.

   O "buraco" no embaçado são quatro faixas em volta do
   alvo: assim o alvo fica nítido sem mexer no z-index dele.
========================================================= */


const VISTO = "kaizen.tutorial.visto";

const GERAL = [
    {
        titulo: "Bem-vindo ao Kaizen 改善",
        texto: "Kaizen é melhorar um pouco todo dia. Em um minuto você vê as três partes do app: " +
               "o quadro de tarefas, a IA e o cronograma de estudos."
    },
    {
        tela: "kanban",
        alvo: "#tela-kanban .kanban",
        titulo: "1. Seu quadro Kanban",
        texto: "Suas tarefas em colunas: A fazer e Concluído. Arraste um cartão pra " +
               "mudar de coluna; concluir tarefas faz a cena do fundo mudar."
    },
    {
        tela: "kanban",
        alvo: "#botao-nova-tarefa",
        titulo: "Criar uma tarefa",
        texto: "Aqui você cria uma tarefa nova, com prioridade, categoria e prazo (ou no \"+ Adicionar tarefa\" " +
               "de cada coluna)."
    },
    {
        tela: "ia",
        alvo: "#ia-servidores",
        abrir: "#srv-mais",
        titulo: "2. Conecte a sua IA",
        texto: "O Kaizen funciona melhor com uma IA sua. No app de computador, o Claude Code e o Codex aparecem aqui " +
               "sozinhos, com o login da sua conta. Em “Outras opções” dá pra colar uma chave de API (o Gemini e o " +
               "OpenRouter têm chave grátis); ela fica só no seu aparelho.",
        aviso: "Sem chave nenhuma, você usa a <b>IA do Kaizen</b>: grátis, mas mais simples e com limite por dia. " +
               "Ela monta planos, flashcards e corrige atividades, mas <b>não conversa no chat</b>. " +
               "Com uma IA sua, tudo fica melhor e sem esse limite."
    },
    {
        tela: "estudos",
        alvo: "#est-novo-plano",
        titulo: "3. Seu cronograma de estudos",
        texto: "Diga o que quer aprender e a IA monta a rotina no calendário: vídeo, documentação oficial e " +
               "atividades pra cada dia, com flashcards pra revisar e um pet que cresce com o seu progresso."
    },
    {
        titulo: "Tudo pronto!",
        texto: "Comece criando o seu primeiro plano de estudos. Se quiser ver este passeio de novo, " +
               "é só tocar em <b>Tutorial</b> no rodapé.",
        final: true
    }
];


/* =========================================================
   PASSEIO DE PRESENTE
   Pro plano que alguém monta de presente (o pacote traz `presente`).
   Abre uma vez, depois que a pessoa adiciona o plano, e passa por
   cada área do sistema. O botão Tutorial do rodapé mostra de novo.
========================================================= */

const CHAVE_PRESENTE = "kaizen.tutorial.presente";   // "1" quando o plano de presente foi aberto neste navegador
const CHAVE_NOME = "kaizen.tutorial.presente.nome";
const CHAVE_NOTA = "kaizen.tutorial.presente.nota";   // texto extra sobre os pets de presente (opcional)

function passosPresente(nome, notaPets = "") {

    const oi = nome ? `${nome}, ` : "";
    const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

    return [
        {
            titulo: `${oi}bem-vinda ao seu Kaizen 改善`,
            texto: "Este passeio foi feito só pra você. Em poucos minutos você conhece cada parte do sistema e como usar o seu plano " +
                   "pra Escola Naval. Dá pra pular e rever depois: é só tocar em <b>Tutorial</b> no rodapé."
        },
        {
            tela: "estudos", alvo: ".nav-telas",
            titulo: "As 4 telas",
            texto: "<b>Jornada</b> é a sua trilha de estudo. <b>Calendário</b> mostra as sessões dia a dia. <b>Tarefas</b> é um quadro " +
                   "simples de afazeres. <b>Assistente IA</b> tira dúvidas e corrige atividades. No celular ficam aqui embaixo."
        },
        {
            tela: "estudos", alvo: "#est-trilha .trilha-rolagem",
            titulo: "A Jornada: o seu mar até a prova",
            texto: "Cada círculo é uma fase, ou seja, uma sessão de estudo de cerca de 2 horas. Concluiu uma fase, acende uma " +
                   "<b>boia luminosa</b>. A cada cinco aparece um <b>farol</b>. E o céu vai clareando até <b>amanhecer</b> no fim do plano.",
            aviso: "As fases são livres: o Kaizen só <b>recomenda</b> seguir a ordem, não trava nada."
        },
        {
            tela: "estudos", alvo: "#est-trilha .trilha-heroi",
            titulo: "A fase do dia",
            texto: "Este cartão mostra a fase atual: o objetivo e o que tem nela (documentação e atividade). O botão <b>Começar fase</b> " +
                   "abre a sessão no calendário, onde você estuda e marca o que fez. Toque em qualquer círculo da trilha pra ver outra fase."
        },
        {
            tela: "estudos", alvo: ".trilha-ferramentas",
            titulo: "Mar ou floresta",
            texto: "O seu plano abre no mar. Se preferir, troque pra floresta aqui. É só visual."
        },
        {
            tela: "calendario", alvo: ".est-cal",
            titulo: "Calendário",
            texto: "Cada dia com sessão fica marcado. Toque num dia pra ver o que estudar nele. As datas foram distribuídas a partir " +
                   "do dia de início e dos dias da semana que você escolheu."
        },
        {
            tela: "calendario", alvo: "#est-dia",
            titulo: "A sessão do dia",
            texto: "Toque na sessão pra abrir. Cada item tem <b>✓</b> (fiz) e <b>✕</b> (não deu tempo: ele passa pra próxima sessão). " +
                   "Os links abrem a documentação. Nas <b>atividades</b> há o botão <b>Entregar</b>: você escreve ou anexa a resposta e, " +
                   "com uma IA conectada, ela corrige com nota de 0 a 10 e diz onde errou."
        },
        {
            tela: "estudos", alvo: "#fc-abrir",
            titulo: "Flashcards",
            texto: "Cada sessão traz cartões. Ao marcar ✓ na sessão, eles entram na sua revisão. Revise <b>todo dia</b>: o que você " +
                   "acerta volta cada vez mais tarde e o que erra volta logo. É o melhor jeito de fixar fórmulas e regras."
        },
        {
            tela: "estudos", alvo: "#est-planos",
            titulo: "O seu plano",
            texto: "O cartão mostra o progresso. <b>🗓 Remarcar</b>: mudou a rotina ou perdeu uns dias? Escolha novos dias da semana e o " +
                   "Kaizen redistribui o que falta, sem perder o que você já estudou. <b>📅</b> põe as sessões na agenda do celular."
        },
        {
            tela: "estudos", alvo: "#gal-abrir-topo",
            titulo: "Planos prontos",
            texto: "Quer estudar outro assunto junto (redação, inglês, ENEM...)? Aqui tem 34 planos prontos, com filtro por área e busca. " +
                   "Escolha, marque os dias e eles entram no calendário."
        },
        {
            tela: "estudos", alvo: "#est-mais", abrir: "#est-mais",
            titulo: "Mais: semana, pets e IA",
            texto: "<b>Semana</b> resume o que você estudou e o que fazer na próxima. <b>Pets</b>: o seu plano vira um bichinho que acompanha " +
                   "o seu progresso (ele aparece na trilha), e você compra roupinhas com os pontos do estudo. <b>O que a IA sabe</b> é o resumo " +
                   "do seu progresso que a IA usa pra te ajudar melhor."
        },
        ...(notaPets ? [{
            tela: "estudos", alvo: "#est-mais", abrir: "#est-mais",
            titulo: "Um presente na loja dos pets",
            texto: esc(notaPets) + " Abra <b>Mais → Pets</b> pra escolher o visual do seu bichinho."
        }] : []),
        {
            tela: "kanban", alvo: "#tela-kanban .kanban",
            titulo: "Tarefas",
            texto: "Um quadro simples (A fazer e Concluído) pro que não está no plano: <i>refazer as questões erradas, comprar o livro, " +
                   "tirar uma dúvida com o professor</i>. Arraste os cartões, com prazo e prioridade."
        },
        {
            tela: "ia", alvo: "#ia-servidores", abrir: "#srv-mais",
            titulo: "Conecte a sua IA",
            texto: "A <b>IA do Kaizen</b> (grátis) já monta planos e flashcards, mas tem limite por dia e não conversa no chat. Pra usar o chat sem " +
                   "limite, entre com a conta grátis do <b>OpenRouter</b> (um clique) ou conecte uma IA sua. A chave fica só no seu aparelho."
        },
        {
            tela: "ia", alvo: "#ia-form",
            titulo: "Converse com o Assistente",
            texto: "Escreva a sua dúvida (pode colar o enunciado de uma questão). Ele conhece o seu progresso e responde de forma organizada. " +
                   "Dica: depois de errar um tipo de problema, peça <i>\"me dê 3 questões parecidas e me explique a primeira\"</i>."
        },
        {
            tela: "estudos", alvo: "#cores",
            titulo: "Cor e tema",
            texto: "No topo: <b>◐</b> muda a cor do app (índigo, rosa, verde ou laranja) e <b>☾</b> alterna entre claro e escuro. " +
                   "Estude do jeito mais confortável pros seus olhos."
        },
        {
            alvo: ".rodape-backup",
            titulo: "Os seus dados",
            texto: "No rodapé: <b>Fazer backup</b> salva tudo num arquivo (faça de vez em quando). <b>Sincronizar aparelhos</b> gera um código " +
                   "pra usar o mesmo plano no celular e no computador, criptografado e sem conta. <b>Acessibilidade</b> aumenta o texto e muda " +
                   "o contraste. <b>PIN</b> protege a abertura do app."
        },
        {
            tela: "estudos", alvo: ".rodape-backup",
            titulo: "No celular, um cuidado",
            texto: "Seus estudos ficam guardados <b>neste navegador</b>. Abra o link no <b>Chrome</b> (Android) ou no <b>Safari</b> (iPhone), " +
                   "e não dentro do WhatsApp ou do Instagram, que esquecem tudo. Depois toque em <b>Adicionar à tela inicial</b> pra ele virar um app. " +
                   "E, de vez em quando, use <b>Fazer backup</b> pra não perder nada."
        },
        {
            titulo: "Como estudar com o plano",
            texto: "1) Uma sessão por dia, na ordem. 2) Faça o <b>diagnóstico inicial</b> sem estudar antes: ele é o seu ponto de partida. " +
                   "3) Mantenha um <b>caderno de erros</b>: todo erro vira uma linha. 4) A meta do edital é no mínimo <b>50% em cada disciplina</b>; " +
                   "mire em 70%. 5) A cada mês, revisão geral e simulado. 6) Perdeu uns dias? Sem culpa: use <b>🗓 Remarcar</b> e mantenha a " +
                   "<b>sequência 🔥</b> de dias estudando."
        },
        {
            titulo: `${oi}bons ventos!`,
            texto: "O seu plano começa pela <b>mensagem de abertura</b>: abra a primeira fase e escreva a sua razão. Quando quiser rever este passeio, " +
                   "toque em <b>Tutorial</b> no rodapé. Boa jornada rumo à Escola Naval ⚓",
            final: true
        }
    ];

}


let passos = GERAL;
let raiz = null;
let atual = 0;
let telaAntes = null;


function telaAtiva() {
    return document.querySelector(".nav-tab.ativa")?.dataset.tela || "kanban";
}


function irPara(tela) {
    if (tela && telaAtiva() !== tela) document.querySelector(`.nav-tab[data-tela="${tela}"]`)?.click();
}


function montar() {

    raiz = document.createElement("div");
    raiz.className = "tut";
    raiz.innerHTML = `
        <div class="tut-veu" data-lado="cima"></div>
        <div class="tut-veu" data-lado="baixo"></div>
        <div class="tut-veu" data-lado="esq"></div>
        <div class="tut-veu" data-lado="dir"></div>
        <div class="tut-anel" hidden></div>
        <section class="tut-balao" role="dialog" aria-modal="true" aria-labelledby="tut-titulo" tabindex="-1">
            <p class="tut-passo" aria-hidden="true"></p>
            <h2 class="tut-titulo" id="tut-titulo"></h2>
            <p class="tut-texto" aria-live="polite"></p>
            <p class="tut-aviso" hidden></p>
            <div class="tut-pontos" aria-hidden="true"></div>
            <div class="tut-acoes">
                <button type="button" class="tut-pular">Pular</button>
                <span class="tut-espaco"></span>
                <button type="button" class="btn-secundario tut-voltar">Voltar</button>
                <button type="button" class="btn-primario tut-proximo">Próximo</button>
            </div>
        </section>`;

    raiz.querySelector(".tut-pular").addEventListener("click", () => fechar(false));
    raiz.querySelector(".tut-voltar").addEventListener("click", () => mostrar(atual - 1));
    raiz.querySelector(".tut-proximo").addEventListener("click", () =>
        passos[atual].final ? fechar(true) : mostrar(atual + 1));
    // clique no embaçado não faz nada: o passeio só anda pelos botões
    raiz.addEventListener("keydown", teclado);

    document.body.append(raiz);

}


function teclado(evento) {
    if (evento.key === "Escape") fechar(false);
    if (evento.key === "ArrowRight" && !passos[atual].final) mostrar(atual + 1);
    if (evento.key === "ArrowLeft" && atual > 0) mostrar(atual - 1);
    // o foco fica dentro do balão
    if (evento.key === "Tab") {
        const botoes = [...raiz.querySelectorAll(".tut-balao button:not([hidden])")];
        const i = botoes.indexOf(document.activeElement);
        const proximo = evento.shiftKey ? (i <= 0 ? botoes.length - 1 : i - 1) : (i + 1) % botoes.length;
        botoes[proximo].focus();
        evento.preventDefault();
    }
}


function mostrar(indice) {

    atual = Math.max(0, Math.min(passos.length - 1, indice));
    const passo = passos[atual];

    irPara(passo.tela);
    if (passo.abrir) {
        const detalhes = document.querySelector(passo.abrir);
        if (detalhes) detalhes.open = true;
    }

    raiz.querySelector(".tut-passo").textContent = `${atual + 1} de ${passos.length}`;
    raiz.querySelector(".tut-titulo").textContent = passo.titulo;
    raiz.querySelector(".tut-texto").innerHTML = passo.texto;
    const aviso = raiz.querySelector(".tut-aviso");
    aviso.hidden = !passo.aviso;
    aviso.innerHTML = passo.aviso || "";
    raiz.querySelector(".tut-pontos").innerHTML =
        passos.map((_, i) => `<span class="${i === atual ? "ativo" : ""}"></span>`).join("");
    raiz.querySelector(".tut-voltar").hidden = atual === 0;
    raiz.querySelector(".tut-pular").hidden = Boolean(passo.final);
    raiz.querySelector(".tut-proximo").textContent = passo.final ? "Começar" : atual === 0 ? "Vamos lá" : "Próximo";

    // a tela trocou agora: espera ela pintar antes de medir o alvo
    const alvo = passo.alvo && document.querySelector(passo.alvo);
    if (alvo) alvo.scrollIntoView({ block: "center", behavior: "instant" });
    requestAnimationFrame(() => requestAnimationFrame(posicionar));
    raiz.querySelector(".tut-proximo").focus();

}


function posicionar() {

    if (!raiz) return;

    const passo = passos[atual];
    const alvo = passo.alvo && document.querySelector(passo.alvo);
    const largura = window.innerWidth;
    const altura = window.innerHeight;
    const veus = Object.fromEntries([...raiz.querySelectorAll(".tut-veu")].map((v) => [v.dataset.lado, v]));
    const anel = raiz.querySelector(".tut-anel");
    const balao = raiz.querySelector(".tut-balao");

    const caixa = (el, x, y, w, h) => Object.assign(el.style, {
        left: `${x}px`, top: `${y}px`, width: `${Math.max(0, w)}px`, height: `${Math.max(0, h)}px`
    });

    let r = alvo?.getBoundingClientRect();
    if (!r || !r.width || !r.height) r = null;

    if (!r) {
        // sem alvo: embaça tudo e o balão vai pro meio
        caixa(veus.cima, 0, 0, largura, altura);
        [veus.baixo, veus.esq, veus.dir].forEach((v) => caixa(v, 0, 0, 0, 0));
        anel.hidden = true;
        balao.classList.add("tut-centro");
        balao.style.left = balao.style.top = "";
        return;
    }

    const folga = 8;
    const x = Math.max(0, r.left - folga);
    const y = Math.max(0, r.top - folga);
    const w = Math.min(largura, r.right + folga) - x;
    const h = Math.min(altura, r.bottom + folga) - y;

    caixa(veus.cima, 0, 0, largura, y);
    caixa(veus.baixo, 0, y + h, largura, altura - y - h);
    caixa(veus.esq, 0, y, x, h);
    caixa(veus.dir, x + w, y, largura - x - w, h);
    anel.hidden = false;
    caixa(anel, x, y, w, h);

    // o balão vai embaixo do alvo se couber; senão em cima; senão do lado; senão por cima, embaixo na tela
    balao.classList.remove("tut-centro");
    const bw = balao.offsetWidth;
    const bh = balao.offsetHeight;
    const margem = 16;
    const noMeio = Math.min(Math.max(margem, x + w / 2 - bw / 2), largura - bw - margem);
    const naAltura = Math.min(Math.max(margem, y), altura - bh - margem);
    let top;
    let left = noMeio;
    if (y + h + margem + bh <= altura) top = y + h + margem;
    else if (y - margem - bh >= 0) top = y - margem - bh;
    else if (x + w + margem + bw <= largura - margem) [top, left] = [naAltura, x + w + margem];
    else if (x - margem - bw >= margem) [top, left] = [naAltura, x - margem - bw];
    else top = altura - bh - margem;
    balao.style.left = `${left}px`;
    balao.style.top = `${Math.max(margem, top)}px`;

}


function fechar(terminou) {

    try { localStorage.setItem(VISTO, terminou ? "terminou" : "pulou"); } catch (erro) { /* aba privada */ }
    raiz?.remove();
    raiz = null;
    window.removeEventListener("resize", posicionar);
    window.removeEventListener("scroll", posicionar, true);

    // terminou: vai pro cronograma (é o próximo passo natural); pulou: volta pra onde estava
    irPara(terminou ? "estudos" : telaAntes);

}


export function abrirTutorial(conjunto = "geral", dados = {}) {

    if (raiz) return;
    passos = conjunto === "presente" ? passosPresente(dados.nome, dados.notaPets) : GERAL;
    telaAntes = telaAtiva();
    montar();
    window.addEventListener("resize", posicionar);
    window.addEventListener("scroll", posicionar, true);
    mostrar(0);

}


function iniciar() {

    // quem tem o plano de presente revê o passeio dele; os outros, o geral
    document.querySelector("#tutorial-abrir")?.addEventListener("click", () => {
        let presente = false, nome = "", notaPets = "";
        try { presente = localStorage.getItem(CHAVE_PRESENTE) === "1"; nome = localStorage.getItem(CHAVE_NOME) || ""; notaPets = localStorage.getItem(CHAVE_NOTA) || ""; } catch (erro) { /* sem storage: passeio geral */ }
        abrirTutorial(presente ? "presente" : "geral", { nome, notaPets });
    });

    // o plano de presente acabou de ser adicionado (js/compartilhar.js): abre o passeio exclusivo uma vez
    document.addEventListener("kaizen:tutorial-presente", ({ detail }) => {
        try {
            localStorage.setItem(VISTO, "terminou");   // o passeio geral não precisa mais aparecer
            if (localStorage.getItem(CHAVE_PRESENTE) === "1") return;   // já viu: não repete sozinho
            localStorage.setItem(CHAVE_PRESENTE, "1");
            localStorage.setItem(CHAVE_NOME, detail?.nome || "");
            localStorage.setItem(CHAVE_NOTA, detail?.notaPets || "");
        } catch (erro) { /* sem storage: mostra mesmo assim */ }
        setTimeout(() => abrirTutorial("presente", { nome: detail?.nome || "", notaPets: detail?.notaPets || "" }), 900);
    });

    // abriu por um link de plano compartilhado: o passeio geral cobriria a janela de escolher os dias
    if (window.kaizenAbriuLink || /#plano=/.test(location.hash)) return;

    const params = new URLSearchParams(location.search);
    if (params.has("demo")) return;

    let visto = null;
    try { visto = localStorage.getItem(VISTO); } catch (erro) { return; }

    // só quem nunca usou o Kaizen neste navegador (quem já usava não precisa do passeio)
    if (params.has("tutorial") || (!visto && !window.kaizenJaUsado)) {
        try { localStorage.setItem(VISTO, "abriu"); } catch (erro) { /* aba privada */ }
        // deixa as telas montarem primeiro (o quadro e a lista de IAs vêm do servidor)
        setTimeout(abrirTutorial, 900);
    }

}


iniciar();
