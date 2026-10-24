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


import { DEMO, rotaDemo } from "./demo.js";


const fetchOriginal = window.fetch.bind(window);

let modo = null;


export function detectarModo() {

    if (!modo && DEMO) {
        // a demonstração nunca fala com o server.py, mesmo rodando no PC
        modo = Promise.resolve("nuvem");
        document.documentElement.dataset.modo = "nuvem";
    }

    if (!modo && window.KAIZEN_DESKTOP) {
        // o app de computador SEMPRE tem servidor (a janela só abre depois que ele responde). Achar que
        // não tem faria a tela trabalhar com dados vazios do modo nuvem e a sincronia mandar isso pro cofre,
        // apagando os planos nos outros aparelhos
        modo = Promise.resolve("servidor");
        document.documentElement.dataset.modo = "servidor";
    }

    if (!modo) {

        // /api/ping responde na hora (não pergunta nada pro Ollama nem pra nuvem). Sem server.py (site,
        // celular), o 404 também chega na hora; só o servidor travado demora, e aí esperamos mais um pouco
        // em vez de concluir "sem servidor" e trabalhar com dados vazios
        const perguntar = async (tentativa) => {
            const controle = new AbortController();
            const relogio = setTimeout(() => controle.abort(), 10000);
            try {
                const resposta = await fetchOriginal("./api/ping", { cache: "no-store", signal: controle.signal });
                return resposta.ok && (resposta.headers.get("content-type") || "").includes("json") ? "servidor" : "nuvem";
            } catch (erro) {
                // demorou (travado): tenta de novo, até 3 vezes; sem rede ou recusou: não tem servidor
                return erro.name === "AbortError" && tentativa < 3 ? perguntar(tentativa + 1) : "nuvem";
            } finally {
                clearTimeout(relogio);
            }
        };

        modo = perguntar(1);

        modo.then((m) => document.documentElement.dataset.modo = m);

    }

    return modo;

}


window.fetch = async (entrada, opcoes = {}) => {

    const url = new URL(typeof entrada === "string" ? entrada : entrada.url, location.href);

    if (DEMO && url.origin === location.origin && url.pathname.includes("/api/")) {
        const resposta = await rotaDemo(url, opcoes);
        if (resposta) return resposta;
    }

    if (url.origin === location.origin && url.pathname.includes("/api/") && (await detectarModo()) === "nuvem") {
        const { rotear } = await import("./nuvem/servidor.js");
        return rotear(url, opcoes);
    }

    return fetchOriginal(entrada, opcoes);

};


// outros scripts leem daqui (importar este arquivo de novo envolveria o fetch duas vezes)
window.kaizenModo = detectarModo();


if ("serviceWorker" in navigator && location.protocol !== "file:" && !DEMO) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(() => {
            /* sem service worker o app funciona igual, só não abre offline */
        });
    });
}
