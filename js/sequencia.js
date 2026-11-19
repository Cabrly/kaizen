/* =========================================================
   SEQUÊNCIA — quantos dias seguidos você estudou
   ---------------------------------------------------------
   Conta o dia quando a pessoa marca um item como feito ou
   revisa um flashcard. Mostra "🔥 N dias" no topo dos estudos.

   - Se hoje ainda não teve estudo mas ontem teve, a sequência
     continua viva (aparece o aviso "estude hoje pra manter").
   - Perdeu um dia? Recomeça do 1, sem drama: o melhor recorde
     fica guardado.
   - Fica só neste aparelho (localStorage). Nada vai pra servidor
     além da contagem anônima de "chegou a 3 e a 7 dias".
========================================================= */

const CHAVE = "kaizen.sequencia.v1";   // { dias: ["2026-11-18", …] (os últimos 400), melhor, marcos: [3, 7] }

const ROTAS = [
    ["PATCH", /\/api\/estudos\/itens\/\d+$/, (corpo) => corpo?.estado === "feito"],
    ["PATCH", /\/api\/estudos\/cartoes\/\d+$/, () => true]
];


function ler() {
    try {
        return { dias: [], melhor: 0, marcos: [], ...JSON.parse(localStorage.getItem(CHAVE) || "{}") };
    } catch (erro) {
        return { dias: [], melhor: 0, marcos: [] };
    }
}


function gravar(estado) {
    try {
        localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch (erro) {
        /* sem storage a sequência só não fica guardada */
    }
}


function isoDe(data) {
    return new Date(data.getTime() - data.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}


function hojeIso() {
    return isoDe(new Date());
}


function diaAntes(iso, n = 1) {
    const [a, m, d] = iso.split("-").map(Number);
    return isoDe(new Date(a, m - 1, d - n));
}


/* Dias seguidos até hoje (ou até ontem, se hoje ainda não teve estudo). */
export function calcular(dias, hoje = hojeIso()) {

    const conjunto = new Set(dias);
    const estudouHoje = conjunto.has(hoje);
    let dia = estudouHoje ? hoje : diaAntes(hoje);
    let total = 0;

    while (conjunto.has(dia)) {
        total++;
        dia = diaAntes(dia);
    }

    return { total, estudouHoje, emRisco: total > 0 && !estudouHoje };

}


function registrar() {

    const estado = ler();
    const hoje = hojeIso();

    if (!estado.dias.includes(hoje)) {
        estado.dias = [...estado.dias, hoje].sort().slice(-400);
    }

    const { total } = calcular(estado.dias, hoje);
    estado.melhor = Math.max(estado.melhor, total);

    // marcos: avisa a contagem anônima uma vez por marco, e só quando a sequência chega nele
    [3, 7].forEach((marco) => {
        if (total >= marco && !estado.marcos.includes(marco)) {
            estado.marcos = [...estado.marcos, marco];
            document.dispatchEvent(new CustomEvent("kaizen:uso", { detail: `sequencia_${marco}` }));
        }
    });
    if (total < 3) estado.marcos = [];

    gravar(estado);
    desenhar();

}


/* ---------- o selo no topo dos estudos ---------- */

function desenhar() {

    const alvo = document.querySelector(".est-topo-acoes");
    if (!alvo) return;

    let selo = document.querySelector("#sequencia-selo");
    if (!selo) {
        selo = document.createElement("span");
        selo.id = "sequencia-selo";
        selo.className = "sequencia-selo";
        alvo.prepend(selo);
    }

    const estado = ler();
    const { total, emRisco } = calcular(estado.dias);

    if (total === 0) {
        selo.hidden = estado.dias.length === 0;   // quem nunca estudou não vê um "0": só quem já teve sequência
        selo.className = "sequencia-selo parada";
        selo.textContent = "Comece uma nova sequência hoje";
        selo.title = estado.melhor ? `Seu recorde é de ${estado.melhor} ${estado.melhor === 1 ? "dia" : "dias"}.` : "";
        return;
    }

    selo.hidden = false;
    selo.className = emRisco ? "sequencia-selo em-risco" : "sequencia-selo";
    selo.textContent = `🔥 ${total} ${total === 1 ? "dia" : "dias"}${emRisco ? " · estude hoje pra manter" : ""}`;
    selo.title = `Dias seguidos estudando. Recorde: ${Math.max(estado.melhor, total)}.`;

}


/* Observa só o caminho e, no ✓, o estado (como o uso anônimo faz). Nunca atrapalha o pedido. */
function vigiarApi() {

    const original = window.fetch;

    window.fetch = async (recurso, opcoes = {}) => {

        const resposta = await original(recurso, opcoes);

        try {
            const metodo = (opcoes.method || "GET").toUpperCase();
            const caminho = new URL(typeof recurso === "string" ? recurso : recurso.url, location.href).pathname;
            const regra = resposta.ok && ROTAS.find(([m, padrao]) => m === metodo && padrao.test(caminho));
            if (regra && regra[2](JSON.parse(opcoes.body || "{}"))) registrar();
        } catch (erro) {
            /* contar nunca atrapalha o pedido */
        }

        return resposta;

    };

}


vigiarApi();
window.kaizenModo?.then(desenhar);
document.addEventListener("kaizen:planos", desenhar);
document.addEventListener("kaizen:planos-vazio", desenhar);
