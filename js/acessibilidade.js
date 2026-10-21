/* =========================================================
   ACESSIBILIDADE — texto maior, alto contraste, menos
   movimento, texto espaçado e leitura em voz alta
   ---------------------------------------------------------
   As escolhas ficam em kaizen.acessibilidade.v1 e viram
   classes no <html>; o script inline do index.html põe as
   classes antes da primeira pintura (sem pulo de tamanho).

   Voz: a do próprio aparelho (speechSynthesis), em
   português, sem rede. Com ela ligada, aparece 🔊 nas
   respostas do assistente, na sessão aberta e no flashcard,
   e "Ler" em qualquer texto selecionado.
========================================================= */


const CHAVE = "kaizen.acessibilidade.v1";
const PADRAO = { texto: "normal", contraste: false, movimento: false, espaco: false, voz: false, velocidade: 1 };
const CLASSES = { contraste: "alto-contraste", movimento: "menos-movimento", espaco: "texto-espacado" };

const modal = document.querySelector("#aces-modal");
const botaoAbrir = document.querySelector("#aces-abrir");
const raiz = document.documentElement;

let opcoes = ler();
let botaoSelecao = null;



/* ---------- guardar e aplicar ---------- */

function ler() {
    try {
        return { ...PADRAO, ...JSON.parse(localStorage.getItem(CHAVE) || "{}") };
    } catch (erro) {
        return { ...PADRAO };
    }
}


function gravar() {
    try {
        localStorage.setItem(CHAVE, JSON.stringify(opcoes));
    } catch (erro) {
        /* vale até fechar a aba */
    }
}


function aplicar() {
    raiz.classList.toggle("texto-grande", opcoes.texto === "grande");
    raiz.classList.toggle("texto-maior", opcoes.texto === "maior");
    Object.entries(CLASSES).forEach(([opcao, classe]) => raiz.classList.toggle(classe, Boolean(opcoes[opcao])));
    if (!opcoes.voz) parar();
    ligarBotoesDeVoz();
}


function desenharOpcoes() {
    modal.querySelectorAll("[data-texto]").forEach((chip) => chip.classList.toggle("ativo", chip.dataset.texto === opcoes.texto));
    modal.querySelectorAll("[data-opcao]").forEach((caixa) => { caixa.checked = Boolean(opcoes[caixa.dataset.opcao]); });
    modal.querySelector("#aces-velocidade").value = String(opcoes.velocidade);
    modal.querySelector("#aces-velocidade-linha").hidden = !opcoes.voz;
    modal.querySelector("#aces-voz-aviso").hidden = "speechSynthesis" in window;
}



/* ---------- voz ---------- */

function vozPortuguesa() {
    const vozes = speechSynthesis.getVoices();
    return vozes.find((v) => v.lang === "pt-BR") || vozes.find((v) => v.lang?.startsWith("pt")) || null;
}


function falar(texto, botao = null) {

    if (!("speechSynthesis" in window)) return;

    const falando = speechSynthesis.speaking && botao?.dataset.falando === "sim";
    parar();
    if (falando || !String(texto).trim()) return;   // tocar de novo no mesmo botão para

    // emoji a voz lê pelo nome ("memo", "livros"): sai antes
    const fala = new SpeechSynthesisUtterance(String(texto).replace(/\p{Extended_Pictographic}️?/gu, "").replace(/\s+/g, " ").trim());
    fala.lang = "pt-BR";
    fala.voice = vozPortuguesa();
    fala.rate = Number(opcoes.velocidade) || 1;

    if (botao) {
        botao.dataset.falando = "sim";
        botao.setAttribute("aria-pressed", "true");
        fala.onend = fala.onerror = () => {
            delete botao.dataset.falando;
            botao.setAttribute("aria-pressed", "false");
        };
    }

    speechSynthesis.speak(fala);

}


function parar() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    document.querySelectorAll("[data-falando]").forEach((b) => {
        delete b.dataset.falando;
        b.setAttribute("aria-pressed", "false");
    });
}


function botaoOuvir(rotulo, ler) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "aces-ouvir";
    botao.textContent = rotulo;
    botao.setAttribute("aria-pressed", "false");
    botao.addEventListener("click", (evento) => {
        evento.stopPropagation();
        falar(ler(), botao);
    });
    return botao;
}


/* Põe (ou tira) os 🔊 onde faz sentido: respostas do assistente, sessão aberta e flashcard. */
function ligarBotoesDeVoz() {

    document.querySelectorAll(".aces-ouvir").forEach((b) => b.remove());
    if (!opcoes.voz) return;

    document.querySelectorAll(".ia-bolha-assistente:not(.ia-bolha-espera)").forEach((bolha) =>
        bolha.append(botaoOuvir("🔊", () => bolha.querySelector(".ia-md")?.innerText || bolha.innerText)));

    document.querySelectorAll(".est-sessao.aberta .est-sessao-corpo").forEach((corpo) => {
        if (!corpo.children.length) return;
        const titulo = corpo.closest(".est-sessao").querySelector(".est-sessao-cab")?.innerText || "";
        corpo.prepend(botaoOuvir("🔊 Ouvir a sessão", () => `${titulo}. ${[...corpo.children]
            .filter((filho) => !filho.matches("button")).map((filho) => filho.innerText).join(". ")}`));
    });

    const cartao = document.querySelector("#fc-cartao");
    if (cartao) {
        cartao.after(botaoOuvir("🔊 Ouvir o cartão", () => {
            const verso = document.querySelector("#fc-verso");
            return verso && !verso.hidden ? verso.textContent : document.querySelector("#fc-frente")?.textContent;
        }));
    }

}


/* Texto selecionado: um botão "Ler" flutuando em cima da seleção. */
function aoSelecionar() {

    if (!opcoes.voz) return;

    const selecao = document.getSelection();
    const texto = selecao?.toString().trim() || "";

    if (texto.length < 3 || !selecao.rangeCount) {
        botaoSelecao?.remove();
        return;
    }

    const caixa = selecao.getRangeAt(0).getBoundingClientRect();
    botaoSelecao ||= Object.assign(document.createElement("button"), { type: "button", className: "aces-ler-selecao" });
    botaoSelecao.textContent = "🔊 Ler";
    botaoSelecao.onclick = () => {
        falar(texto, botaoSelecao);
        botaoSelecao.remove();
    };
    botaoSelecao.style.top = `${Math.max(8, caixa.top + scrollY - 44)}px`;
    botaoSelecao.style.left = `${Math.min(innerWidth - 90, Math.max(8, caixa.left + scrollX + caixa.width / 2 - 36))}px`;
    (selecao.anchorNode?.parentElement?.closest("dialog[open]") || document.body).append(botaoSelecao);

}



/* ---------- ligações ---------- */

if (modal && botaoAbrir) {

    aplicar();

    botaoAbrir.addEventListener("click", () => {
        desenharOpcoes();
        modal.showModal();
    });
    modal.querySelectorAll("[data-fechar]").forEach((botao) => botao.addEventListener("click", () => modal.close()));

    modal.addEventListener("click", (evento) => {
        const chip = evento.target.closest("[data-texto]");
        if (!chip) return;
        opcoes.texto = chip.dataset.texto;
        gravar();
        aplicar();
        desenharOpcoes();
    });

    modal.addEventListener("change", (evento) => {
        const alvo = evento.target;
        if (alvo.dataset.opcao) opcoes[alvo.dataset.opcao] = alvo.checked;
        if (alvo.checked) document.dispatchEvent(new CustomEvent("kaizen:uso", { detail: "acessibilidade" }));
        if (alvo.id === "aces-velocidade") opcoes.velocidade = Number(alvo.value);
        gravar();
        aplicar();
        desenharOpcoes();
        if (alvo.dataset.opcao === "voz" && alvo.checked) falar("Leitura em voz alta ligada.");
    });

    modal.querySelector("#aces-testar").addEventListener("click", (evento) =>
        falar("Olá! Assim fica a leitura do Kaizen. Ajuste a velocidade se precisar.", evento.currentTarget));

    // as telas redesenham o chat, a sessão e o cartão: os 🔊 voltam junto
    let pendente = false;
    new MutationObserver(() => {
        if (!opcoes.voz || pendente) return;
        pendente = true;
        requestAnimationFrame(() => {
            pendente = false;
            const falta = [...document.querySelectorAll(".ia-bolha-assistente:not(.ia-bolha-espera)")].some((b) => !b.querySelector(".aces-ouvir"))
                || [...document.querySelectorAll(".est-sessao.aberta .est-sessao-corpo")].some((c) => c.children.length && !c.querySelector(".aces-ouvir"))
                || (document.querySelector("#fc-cartao") && !document.querySelector("#fc-cartao + .aces-ouvir"));
            if (falta) ligarBotoesDeVoz();
        });
    }).observe(document.body, { childList: true, subtree: true });

    document.addEventListener("selectionchange", () => {
        clearTimeout(aoSelecionar.espera);
        aoSelecionar.espera = setTimeout(aoSelecionar, 350);
    });

}
