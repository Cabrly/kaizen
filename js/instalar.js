/* =========================================================
   INSTALAR — app na tela inicial e dados que não somem
   ---------------------------------------------------------
   - Android/Chrome: quando o navegador oferece, mostra um
     botão "Instalar".
   - iPhone sem instalar: o iOS pode apagar os dados de site
     que fica dias sem uso; instalado na tela inicial, não.
     Então mostra como instalar (o Safari não tem botão).
   - Pede ao navegador pra guardar os dados de forma
     permanente (menos chance de limpeza automática).
   O aviso some pra sempre quando a pessoa fecha no ✕.
========================================================= */


const CHAVE_DISPENSADO = "kaizen.instalar.dispensado.v1";

const instalado =
    matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

const ehIos =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);


let pedidoDeInstalacao = null;



function dispensado() {
    try {
        return localStorage.getItem(CHAVE_DISPENSADO) === "1";
    } catch (erro) {
        return false;
    }
}


function dispensar() {
    try {
        localStorage.setItem(CHAVE_DISPENSADO, "1");
    } catch (erro) {
        /* sem localStorage: só esconde desta vez */
    }
    esconder();
}


function esconder() {
    document.querySelector(".aviso-instalar")?.remove();
}


function mostrar(texto, rotuloBotao = null, aoClicar = null) {

    if (dispensado() || document.querySelector(".aviso-instalar")) return;

    const aviso = document.createElement("div");
    aviso.className = "aviso-instalar";
    aviso.setAttribute("role", "status");

    const paragrafo = document.createElement("p");
    paragrafo.textContent = texto;
    aviso.append(paragrafo);

    if (rotuloBotao) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "btn-primario";
        botao.textContent = rotuloBotao;
        botao.addEventListener("click", aoClicar);
        aviso.append(botao);
    }

    const fechar = document.createElement("button");
    fechar.type = "button";
    fechar.className = "aviso-instalar-fechar";
    fechar.setAttribute("aria-label", "Fechar aviso");
    fechar.textContent = "✕";
    fechar.addEventListener("click", dispensar);
    aviso.append(fechar);

    document.body.append(aviso);

}


async function guardarDeVez() {

    try {
        if (!navigator.storage?.persist || await navigator.storage.persisted()) return;
        // no Chrome/Edge (e app instalado) isso não abre pergunta nenhuma;
        // em outros navegadores pode abrir, então só pede nesses casos
        if (instalado || navigator.userAgentData) await navigator.storage.persist();
    } catch (erro) {
        /* sem suporte: segue normal */
    }

}



// Android/Chrome: o navegador avisa quando dá pra instalar
window.addEventListener("beforeinstallprompt", (evento) => {

    evento.preventDefault();
    pedidoDeInstalacao = evento;

    mostrar("Instale o Kaizen como app: abre mais rápido e funciona sem internet.", "Instalar", async () => {
        pedidoDeInstalacao.prompt();
        await pedidoDeInstalacao.userChoice.catch(() => null);
        pedidoDeInstalacao = null;
        esconder();
    });

});

window.addEventListener("appinstalled", esconder);


// sem servidor os dados moram no aparelho: protege e, no iPhone, ensina a instalar
(async () => {

    if ((await window.kaizenModo) !== "nuvem") return;

    guardarDeVez();

    if (ehIos && !instalado) {
        mostrar("No iPhone, toque em Compartilhar (□↑) e depois em “Adicionar à Tela de Início”. " +
                "Assim o Kaizen vira app e seus dados não se perdem.");
    }

})();
