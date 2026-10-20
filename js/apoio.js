/* =========================================================
   APOIAR O PROJETO — botão no rodapé que abre o Pix
   ---------------------------------------------------------
   Pra trocar a chave, mude só o PIX abaixo. Com a chave
   vazia o botão nem aparece. O QR é um BR Code estático
   (padrão do Banco Central): o banco abre com a chave e o
   nome preenchidos, e a pessoa escolhe o valor.
========================================================= */

import qrcode from "./vendor/qrcode.js";


const PIX = {
    chave: "cc99ff46-3c97-468b-a006-e71fbb7d7364",
    nome: "Vitor Cabral",        // até 25 letras
    cidade: "Palmas"       // até 15 letras
};


const modal = document.querySelector("#apoio-modal");
const botaoAbrir = document.querySelector("#apoio-abrir");


if (modal && botaoAbrir && PIX.chave.trim()) {

    const chave = PIX.chave.trim();
    const codigo = brCode(chave, limpar(PIX.nome || "KAIZEN", 25), limpar(PIX.cidade || "BRASIL", 15));
    let desenhado = false;

    botaoAbrir.hidden = false;

    botaoAbrir.addEventListener("click", () => {
        if (!desenhado) {
            // só monta o QR na primeira vez que alguém abre
            const qr = qrcode(0, "M");
            qr.addData(codigo);
            qr.make();
            modal.querySelector("#apoio-qr").innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
            modal.querySelector("#apoio-chave").textContent = chave;
            desenhado = true;
        }
        modal.showModal();
    });

    modal.querySelectorAll("[data-fechar]").forEach((botao) => botao.addEventListener("click", () => modal.close()));

    copiarAoClicar(modal.querySelector("#apoio-copiar-chave"), chave, "Chave copiada!");
    copiarAoClicar(modal.querySelector("#apoio-copiar-codigo"), codigo, "Código copiado!");
}


function copiarAoClicar(botao, texto, recado) {
    const original = botao.textContent;
    botao.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(texto);
        } catch (erro) {
            window.prompt("Copie:", texto);
            return;
        }
        botao.textContent = recado;
        setTimeout(() => (botao.textContent = original), 2000);
    });
}


/* O BR Code aceita só ASCII maiúsculo no nome e na cidade. */
function limpar(texto, limite) {
    return texto.normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^A-Za-z0-9 ]/g, "").trim().toUpperCase().slice(0, limite);
}

function campo(id, valor) {
    return id + String(valor.length).padStart(2, "0") + valor;
}

function brCode(chave, nome, cidade) {
    const corpo =
        campo("00", "01") +
        campo("26", campo("00", "br.gov.bcb.pix") + campo("01", chave)) +
        campo("52", "0000") +
        campo("53", "986") +
        campo("58", "BR") +
        campo("59", nome) +
        campo("60", cidade) +
        campo("62", campo("05", "***")) +
        "6304";
    return corpo + crc16(corpo);
}

/* CRC16-CCITT (polinômio 0x1021, início 0xFFFF), como pede o manual do Pix. */
function crc16(texto) {
    let crc = 0xffff;
    for (let i = 0; i < texto.length; i++) {
        crc ^= texto.charCodeAt(i) << 8;
        for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
}
