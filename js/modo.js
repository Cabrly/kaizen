/* =========================================================
   MODO — com servidor (PC) ou só na nuvem (celular)
   ---------------------------------------------------------
   Tem que ser o primeiro script da página. Envolve o fetch:
   chamadas pra /api/... vão pro server.py se ele existir;
   se não existir (site estático, celular), vão pro servidor
   de bolso em js/nuvem/servidor.js, que responde igual.

   Também registra o service worker que deixa o Kaizen
   instalável como app e abrindo sem internet.
========================================================= */


const fetchOriginal = window.fetch.bind(window);

let modo = null;


export function detectarModo() {

    if (!modo) {

        const controle = new AbortController();
        const relogio = setTimeout(() => controle.abort(), 2500);

        modo = fetchOriginal("./api/ia/status", { cache: "no-store", signal: controle.signal })
            .then((resposta) =>
                resposta.ok && (resposta.headers.get("content-type") || "").includes("json") ? "servidor" : "nuvem")
            .catch(() => "nuvem")
            .finally(() => clearTimeout(relogio));

        modo.then((m) => document.documentElement.dataset.modo = m);

    }

    return modo;

}


window.fetch = async (entrada, opcoes = {}) => {

    const url = new URL(typeof entrada === "string" ? entrada : entrada.url, location.href);

    if (url.origin === location.origin && url.pathname.includes("/api/") && (await detectarModo()) === "nuvem") {
        const { rotear } = await import("./nuvem/servidor.js");
        return rotear(url, opcoes);
    }

    return fetchOriginal(entrada, opcoes);

};


detectarModo();


if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(() => {
            /* sem service worker o app funciona igual, só não abre offline */
        });
    });
}
