/* =========================================================
   PIN PRA ABRIR — tranca a tela deste aparelho
   ---------------------------------------------------------
   Opcional. Guarda só um hash (PBKDF2 com sal) do PIN no
   navegador; vale até fechar a aba. É uma tranca de tela pra
   computador compartilhado, não criptografia dos dados: quem
   esquece apaga os dados do site e o PIN vai junto.

   O script do <head> já esconde o app (html.travado) antes de
   desenhar, pra não aparecer nada por um instante.
========================================================= */


import { DEMO } from "./demo.js";


const CHAVE = "kaizen.pin.v1";            // { sal, hash } em hex
const CHAVE_ESPERA = "kaizen.pin.espera";  // até quando não aceita tentativa
const ABERTO = "kaizen.pin.aberto";        // sessionStorage
const TENTATIVAS = 5;
const ESPERA = 30_000;

const $ = (id) => document.querySelector(`#pin-${id}`);

let erradas = 0;


/* ---------- guardar e conferir ---------- */

const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
const deHex = (texto) => new Uint8Array(texto.match(/../g).map((par) => parseInt(par, 16)));


async function resumo(pin, sal) {
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: sal, iterations: 100_000, hash: "SHA-256" }, base, 256);
    return hex(new Uint8Array(bits));
}


function lerPin() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE));
    } catch (erro) {
        return null;
    }
}


async function confere(pin) {
    const guardado = lerPin();
    return Boolean(guardado) && (await resumo(pin, deHex(guardado.sal))) === guardado.hash;
}


async function gravarPin(pin) {
    const sal = crypto.getRandomValues(new Uint8Array(16));
    localStorage.setItem(CHAVE, JSON.stringify({ sal: hex(sal), hash: await resumo(pin, sal) }));
}


const pinValido = (pin) => /^\d{4,8}$/.test(pin);


/* ---------- tela de bloqueio ---------- */

function esperaRestante() {
    try {
        return Math.max(0, Number(localStorage.getItem(CHAVE_ESPERA) || 0) - Date.now());
    } catch (erro) {
        return 0;
    }
}


function destravar() {
    try { sessionStorage.setItem(ABERTO, "1"); } catch (erro) { /* aba privada */ }
    $("tela").hidden = true;
    document.documentElement.classList.remove("travado");
}


function travar() {

    const tela = $("tela");
    const campo = $("digitado");
    const erro = $("erro-abrir");

    tela.hidden = false;
    campo.focus();

    $("form-abrir").addEventListener("submit", async (evento) => {

        evento.preventDefault();

        const falta = esperaRestante();
        if (falta) {
            erro.textContent = `Muitas tentativas. Espere ${Math.ceil(falta / 1000)} segundos.`;
            return;
        }

        if (await confere(campo.value)) {
            destravar();
            return;
        }

        erradas++;
        campo.value = "";
        tela.classList.remove("errou");
        void tela.offsetWidth;  // reinicia a animação
        tela.classList.add("errou");

        if (erradas >= TENTATIVAS) {
            erradas = 0;
            try { localStorage.setItem(CHAVE_ESPERA, String(Date.now() + ESPERA)); } catch (e) { /* aba privada */ }
            erro.textContent = "Muitas tentativas. Espere 30 segundos.";
        } else {
            erro.textContent = "PIN errado.";
        }

    });

}


/* ---------- criar, trocar e tirar ---------- */

function configurar() {

    const modal = $("modal");
    const erro = $("erro-config");
    const campos = ["atual", "novo", "repetir"].map((nome) => $(nome));

    function abrir() {
        const tem = Boolean(lerPin());
        campos.forEach((campo) => campo.value = "");
        erro.textContent = "";
        $("campo-atual").hidden = !tem;
        $("tirar").hidden = !tem;
        $("salvar").textContent = tem ? "Trocar PIN" : "Salvar PIN";
        modal.showModal();
        (tem ? $("atual") : $("novo")).focus();
    }

    async function atualCerto() {
        if (!lerPin() || (await confere($("atual").value))) return true;
        erro.textContent = "O PIN atual está errado.";
        $("atual").focus();
        return false;
    }

    $("abrir").addEventListener("click", abrir);

    modal.querySelectorAll("[data-fechar]").forEach((botao) => botao.addEventListener("click", () => modal.close()));

    $("form-config").addEventListener("submit", async (evento) => {

        evento.preventDefault();
        erro.textContent = "";

        const novo = $("novo").value;
        if (!pinValido(novo)) {
            erro.textContent = "O PIN tem que ter de 4 a 8 números.";
            return;
        }
        if (novo !== $("repetir").value) {
            erro.textContent = "Os dois PINs novos não batem.";
            return;
        }
        if (!(await atualCerto())) return;

        await gravarPin(novo);
        try { sessionStorage.setItem(ABERTO, "1"); } catch (e) { /* aba privada */ }
        modal.close();

    });

    $("tirar").addEventListener("click", async () => {
        erro.textContent = "";
        if (!$("atual").value) {
            erro.textContent = "Digite o PIN atual pra tirar.";
            $("atual").focus();
            return;
        }
        if (!(await atualCerto())) return;
        localStorage.removeItem(CHAVE);
        modal.close();
    });

}


/* ---------- começo ---------- */

if ($("modal") && $("tela")) {

    if (DEMO || !crypto.subtle) {
        // demonstração não tranca; sem crypto.subtle (http fora do localhost) não dá pra conferir
        $("abrir").hidden = true;
        document.documentElement.classList.remove("travado");
    } else {
        configurar();
        if (document.documentElement.classList.contains("travado")) travar();
    }

}
