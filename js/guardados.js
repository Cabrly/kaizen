/* =========================================================
   GUARDADOS — chat e preferências também no banco do PC
   ---------------------------------------------------------
   Com o server.py (app de computador), tudo que o Kaizen
   guarda no navegador (kaizen.*) ganha uma cópia no SQLite.
   Se o cache for limpo, a próxima abertura traz de volta e
   recarrega a página uma vez, pra cada tela ler o que voltou.

   Tarefas e categorias ficam de fora: o servidor já é o dono
   delas. O PIN também, pra que apagar os dados do site tire
   um PIN esquecido. No celular e na demonstração, não faz nada.
========================================================= */


import { detectarModo } from "./modo.js";


const FORA = new Set(["kaizen.tarefas.v1", "kaizen.categorias.v1", "kaizen.pin.v1", "kaizen.pin.espera"]);
const RECARREGOU = "kaizen.guardados.recarregou";   // sessionStorage: evita recarregar em laço
const OLHAR = 3000;   // ms entre comparações

let enviado = {};


function retrato() {

    const atual = {};

    for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);
        if (chave.startsWith("kaizen.") && !FORA.has(chave)) atual[chave] = localStorage.getItem(chave);
    }

    return atual;

}


function mudancas(atual) {

    const diferenca = {};

    for (const [chave, valor] of Object.entries(atual)) {
        if (enviado[chave] !== valor) diferenca[chave] = valor;
    }

    for (const chave of Object.keys(enviado)) {
        if (!(chave in atual)) diferenca[chave] = null;
    }

    return diferenca;

}


function enviar(saindo = false) {

    let atual;
    try { atual = retrato(); } catch (erro) { return; }

    const diferenca = mudancas(atual);
    if (!Object.keys(diferenca).length) return;

    enviado = atual;

    fetch("./api/guardados", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(diferenca),
        keepalive: saindo,
    }).catch(() => {
        enviado = {};  // na próxima volta manda tudo de novo
    });

}


async function iniciar() {

    if ((await detectarModo()) !== "servidor") return;

    let doPc;
    try {
        const resposta = await fetch("./api/guardados", { cache: "no-store" });
        if (!resposta.ok) return;  // server.py antigo, sem a rota
        doPc = await resposta.json();
    } catch (erro) {
        return;
    }

    try {

        const local = retrato();
        const faltando = Object.keys(doPc).filter((chave) => !(chave in local) && !FORA.has(chave));

        faltando.forEach((chave) => localStorage.setItem(chave, doPc[chave]));

        // o que já estava igual no PC não precisa ir de novo
        enviado = Object.fromEntries(Object.entries(doPc).filter(([chave]) => !FORA.has(chave)));

        if (faltando.length && !sessionStorage.getItem(RECARREGOU)) {
            sessionStorage.setItem(RECARREGOU, "1");
            location.reload();
            return;
        }

    } catch (erro) {
        return;  // aba privada sem localStorage
    }

    enviar();
    setInterval(enviar, OLHAR);
    document.addEventListener("visibilitychange", () => document.hidden && enviar(true));

}


iniciar();
