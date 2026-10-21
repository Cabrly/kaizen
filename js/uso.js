/* =========================================================
   USO ANÔNIMO — quantas pessoas usam o Kaizen, sem saber quem
   ---------------------------------------------------------
   Uma vez por dia o app manda pro servidor da sincronia só:
   "abri hoje", o tipo de aparelho (pc, celular, navegador),
   a versão e se é o primeiro dia da semana/do mês/de sempre
   (é assim que dá pra contar pessoas por semana e por mês
   sem nenhum identificador). De vez em quando manda também
   quantas vezes cada função foi usada (planos criados,
   entregas, flashcards…). Nada do que a pessoa escreve ou
   estuda, nenhum código, nenhuma chave.

   Desliga no botão "Privacidade" do rodapé. A demonstração
   (?demo) não conta.
========================================================= */

import { servidor } from "./cofre.js";


const CHAVE = "kaizen.uso.v1";        // { ultimo, pendentes, enviadoEm, desligado }
const ENVIAR_A_CADA = 60 * 60 * 1000;  // contagens de funções: no máximo uma vez por hora

const modal = document.querySelector("#priv-modal");
const botaoAbrir = document.querySelector("#priv-abrir");


/* Pedidos à API que contam como uso de uma função. */
const ROTAS = [
    ["POST", /\/api\/estudos\/planos$/, "plano_criado"],
    ["POST", /\/api\/estudos\/importar-plano$/, "plano_importado"],
    ["PATCH", /\/api\/estudos\/itens\/\d+$/, "item_feito", (corpo) => corpo?.estado === "feito"],
    ["POST", /\/api\/estudos\/entregas$/, "entrega"],
    ["PATCH", /\/api\/estudos\/cartoes\/\d+$/, "cartao_revisado"],
    ["POST", /\/api\/chat$/, "chat"]
];



/* ---------- estado guardado ---------- */

function ler() {
    try {
        return { pendentes: {}, ...JSON.parse(localStorage.getItem(CHAVE) || "{}") };
    } catch (erro) {
        return { pendentes: {} };
    }
}


function gravar(estado) {
    try {
        localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch (erro) {
        /* sem storage, conta de novo amanhã: paciência */
    }
}


export function usoLigado() {
    return !ler().desligado;
}


function hojeIso() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}


// segunda-feira da semana da data (pra saber se é o primeiro dia da semana)
function segundaDe(iso) {
    const [a, m, d] = iso.split("-").map(Number);
    const data = new Date(Date.UTC(a, m - 1, d));
    data.setUTCDate(data.getUTCDate() - ((data.getUTCDay() + 6) % 7));
    return data.toISOString().slice(0, 10);
}



/* ---------- envio ---------- */

async function enviar(corpo, { beacon = false } = {}) {
    const url = `${servidor()}/v1/uso`;
    const texto = JSON.stringify(corpo);
    if (beacon && navigator.sendBeacon) return navigator.sendBeacon(url, new Blob([texto], { type: "text/plain" }));
    const resposta = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: texto, keepalive: true });
    return resposta.ok;
}


async function versaoDoApp() {
    try {
        const novidades = await (await fetch(new URL("../novidades.json", import.meta.url), { cache: "no-cache" })).json();
        return novidades[0]?.versao || null;
    } catch (erro) {
        return null;
    }
}


async function abertura(modo) {

    const estado = ler();
    const hoje = hojeIso();

    if (estado.desligado || estado.ultimo === hoje) return;

    const corpo = {
        abertura: true,
        plataforma: modo === "servidor" ? "pc" : matchMedia("(pointer: coarse)").matches ? "celular" : "navegador",
        versao: await versaoDoApp(),
        // quem já usava antes desta contagem existir não é "novo"
        novo: !estado.ultimo && !window.kaizenJaUsado,
        semana: !estado.ultimo || segundaDe(estado.ultimo) !== segundaDe(hoje),
        mes: !estado.ultimo || estado.ultimo.slice(0, 7) !== hoje.slice(0, 7),
        eventos: estado.pendentes
    };

    try {
        if (await enviar(corpo)) {
            const atual = ler();
            gravar({ ...atual, ultimo: hoje, enviadoEm: Date.now(), pendentes: subtrair(atual.pendentes, corpo.eventos) });
        }
    } catch (erro) {
        /* sem internet: tenta de novo na próxima abertura */
    }

}


function subtrair(pendentes, enviados) {
    const sobra = { ...pendentes };
    Object.entries(enviados || {}).forEach(([nome, n]) => {
        sobra[nome] = (sobra[nome] || 0) - n;
        if (sobra[nome] <= 0) delete sobra[nome];
    });
    return sobra;
}


function contar(nome) {
    const estado = ler();
    if (estado.desligado) return;
    estado.pendentes[nome] = (estado.pendentes[nome] || 0) + 1;
    gravar(estado);
}


/* As contagens de funções saem juntas, no máximo uma vez por hora, ou ao fechar a aba. */
async function enviarPendentes(aoSair = false) {

    const estado = ler();
    if (estado.desligado || !estado.ultimo || !Object.keys(estado.pendentes).length) return;
    if (!aoSair && Date.now() - (estado.enviadoEm || 0) < ENVIAR_A_CADA) return;

    const eventos = { ...estado.pendentes };
    try {
        if (await enviar({ eventos }, { beacon: aoSair })) {
            const atual = ler();
            gravar({ ...atual, enviadoEm: Date.now(), pendentes: subtrair(atual.pendentes, eventos) });
        }
    } catch (erro) {
        /* fica pra próxima */
    }

}


/* Observa os pedidos à API (sem ler nada além do caminho e, no ✓, do estado). */
function vigiarApi() {

    const original = window.fetch;

    window.fetch = async (recurso, opcoes = {}) => {

        const resposta = await original(recurso, opcoes);

        try {
            const metodo = (opcoes.method || "GET").toUpperCase();
            const caminho = new URL(typeof recurso === "string" ? recurso : recurso.url, location.href).pathname;
            const regra = metodo !== "GET" && resposta.ok && ROTAS.find(([m, padrao]) => m === metodo && padrao.test(caminho));
            if (regra && (!regra[3] || regra[3](JSON.parse(opcoes.body || "{}")))) contar(regra[2]);
        } catch (erro) {
            /* contar nunca atrapalha o pedido */
        }

        return resposta;

    };

}



/* ---------- a janela de privacidade ---------- */

function ligarJanela() {

    const caixa = modal.querySelector("#priv-contar");

    botaoAbrir.addEventListener("click", () => {
        caixa.checked = usoLigado();
        modal.showModal();
    });
    modal.querySelectorAll("[data-fechar]").forEach((botao) => botao.addEventListener("click", () => modal.close()));

    caixa.addEventListener("change", () => {
        const estado = ler();
        gravar(caixa.checked ? { ...estado, desligado: false } : { ...estado, desligado: true, pendentes: {} });
    });

}



if (!new URLSearchParams(location.search).has("demo")) {

    vigiarApi();
    document.addEventListener("kaizen:uso", (evento) => contar(evento.detail));

    window.kaizenModo?.then((modo) => {
        setTimeout(() => abertura(modo), 4000);   // depois da tela pronta: não disputa a abertura
        setInterval(() => enviarPendentes(), 10 * 60 * 1000);
        document.addEventListener("visibilitychange", () => document.hidden && enviarPendentes(true));
    });

}

if (modal && botaoAbrir) ligarJanela();
