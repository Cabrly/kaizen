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

const PASSOS = [
    {
        titulo: "Bem-vindo ao Kaizen 改善",
        texto: "Kaizen é melhorar um pouco todo dia. Em um minuto você vê as três partes do app: " +
               "o quadro de tarefas, a IA e o cronograma de estudos."
    },
    {
        tela: "kanban",
        alvo: "#tela-kanban .kanban",
        titulo: "1. Seu quadro Kanban",
        texto: "Suas tarefas em colunas: A fazer, Em andamento, Em revisão e Concluído. Arraste um cartão pra " +
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
        alvo: "#srv-mais .srv-corpo",
        abrir: "#srv-mais",
        titulo: "2. Conecte a sua IA",
        texto: "O Kaizen funciona melhor com uma IA sua: o Gemini e o OpenRouter têm chave grátis, e também dá pra usar " +
               "Claude, ChatGPT ou o Ollama no seu computador. A chave fica só no seu aparelho.",
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
        PASSOS[atual].final ? fechar(true) : mostrar(atual + 1));
    // clique no embaçado não faz nada: o passeio só anda pelos botões
    raiz.addEventListener("keydown", teclado);

    document.body.append(raiz);

}


function teclado(evento) {
    if (evento.key === "Escape") fechar(false);
    if (evento.key === "ArrowRight" && !PASSOS[atual].final) mostrar(atual + 1);
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

    atual = Math.max(0, Math.min(PASSOS.length - 1, indice));
    const passo = PASSOS[atual];

    irPara(passo.tela);
    if (passo.abrir) {
        const detalhes = document.querySelector(passo.abrir);
        if (detalhes) detalhes.open = true;
    }

    raiz.querySelector(".tut-passo").textContent = `${atual + 1} de ${PASSOS.length}`;
    raiz.querySelector(".tut-titulo").textContent = passo.titulo;
    raiz.querySelector(".tut-texto").innerHTML = passo.texto;
    const aviso = raiz.querySelector(".tut-aviso");
    aviso.hidden = !passo.aviso;
    aviso.innerHTML = passo.aviso || "";
    raiz.querySelector(".tut-pontos").innerHTML =
        PASSOS.map((_, i) => `<span class="${i === atual ? "ativo" : ""}"></span>`).join("");
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

    const passo = PASSOS[atual];
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


export function abrirTutorial() {

    if (raiz) return;
    telaAntes = telaAtiva();
    montar();
    window.addEventListener("resize", posicionar);
    window.addEventListener("scroll", posicionar, true);
    mostrar(0);

}


function iniciar() {

    document.querySelector("#tutorial-abrir")?.addEventListener("click", abrirTutorial);

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
