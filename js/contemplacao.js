/* =========================================================
   CONTEMPLAÇÃO — ver o fundo sem o quadro na frente
   ---------------------------------------------------------
   As cenas ficam atrás do quadro o tempo todo. Dois jeitos de
   vê-las inteiras:
     • modo contemplação: tecla Z (fora de campo de texto) ou o
       botão discreto no canto. Volta com clique ou tecla.
     • descanso de tela (desligado; liga no menu de fundos):
       depois de alguns minutos sem mexer, a interface esmaece
       sozinha. Mexeu o mouse, volta.
   Só esconde a interface (opacity): nada é desmontado.
========================================================= */


const CHAVE_DESCANSO = "kaizen.descanso.ligado";
const ESPERA_DESCANSO = 3 * 60 * 1000;

let ativo = false;
let motivo = null;          // "manual" | "descanso"
let relogio = null;
let aviso = null;


function ler(chave, padrao) {
    try {
        const valor = localStorage.getItem(chave);
        return valor === null ? padrao : valor === "1";
    } catch (erro) {
        return padrao;
    }
}


export function descansoLigado() {
    return ler(CHAVE_DESCANSO, false);   // desligado até a pessoa ligar no menu de fundos
}


export function definirDescanso(ligado) {
    try {
        localStorage.setItem(CHAVE_DESCANSO, ligado ? "1" : "0");
    } catch (erro) {
        /* aba privada: vale só nesta sessão */
    }
    rearmar();
}


function digitando(alvo) {
    return alvo && (alvo.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName));
}


function algoAberto() {
    // modal, menu ou diálogo aberto: não some com a interface por baixo da pessoa
    return document.querySelector("dialog[open], .modal.aberto, .modal:not([hidden]).ativo, .fundo-menu.aberto") !== null;
}


export function entrar(porque = "manual") {
    if (ativo) return;
    ativo = true;
    motivo = porque;
    document.body.classList.add("contemplando");
    aviso.textContent = porque === "manual" ? "Clique ou aperte qualquer tecla para voltar" : "Mexa o mouse para voltar";
    aviso.classList.remove("some");
    void aviso.offsetWidth;            // reinicia a animação de sumir
    aviso.classList.add("some");
}


export function sair() {
    if (!ativo) return;
    ativo = false;
    motivo = null;
    document.body.classList.remove("contemplando");
    rearmar();
}


function rearmar() {
    clearTimeout(relogio);
    if (!descansoLigado()) return;
    relogio = setTimeout(() => {
        if (!document.hidden && !algoAberto()) entrar("descanso");
        else rearmar();
    }, ESPERA_DESCANSO);
}


export function iniciarContemplacao() {

    aviso = document.createElement("div");
    aviso.className = "contemplar-aviso";
    aviso.setAttribute("role", "status");
    document.body.append(aviso);

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "contemplar-botao";
    botao.title = "Contemplar o fundo (tecla Z)";
    botao.setAttribute("aria-label", "Contemplar o fundo");
    botao.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>';
    botao.addEventListener("click", (evento) => {
        evento.stopPropagation();
        entrar("manual");
    });
    document.body.append(botao);

    document.addEventListener("keydown", (evento) => {
        if (ativo) {
            evento.preventDefault();
            sair();
            return;
        }
        rearmar();
        if ((evento.key === "z" || evento.key === "Z") && !evento.ctrlKey && !evento.metaKey && !evento.altKey && !digitando(evento.target) && !algoAberto()) {
            entrar("manual");
        }
    }, true);

    // clique volta (e não chega a clicar no que estava escondido)
    document.addEventListener("pointerdown", (evento) => {
        if (ativo) {
            evento.preventDefault();
            evento.stopPropagation();
            sair();
        } else {
            rearmar();
        }
    }, true);

    // no descanso, só mexer o mouse já volta; no modo manual, não (é pra ficar olhando)
    let ultimo = 0;
    document.addEventListener("pointermove", () => {
        const agora = performance.now();
        if (agora - ultimo < 400) return;
        ultimo = agora;
        if (ativo && motivo === "descanso") sair();
        else if (!ativo) rearmar();
    }, { passive: true });

    document.addEventListener("wheel", () => (ativo && motivo === "descanso" ? sair() : rearmar()), { passive: true });
    document.addEventListener("visibilitychange", rearmar);

    rearmar();
}
