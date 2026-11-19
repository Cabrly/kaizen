/* =========================================================
   GALERIA DE PLANOS — o jeito mais rápido de começar
   ---------------------------------------------------------
   Quem abre o Kaizen pela primeira vez não precisa esperar a
   IA nem configurar nada: escolhe um plano pronto (js/galeria-
   dados.js), marca os dias e ele já está no calendário.

   Aparece em dois lugares:
   - no lugar da lista de planos, enquanto a pessoa não tem nenhum;
   - numa janela, pelo link "plano pronto" do assistente de novo plano.

   Quem recebe o pacote é o js/compartilhar.js (o mesmo caminho
   do "plano que alguém mandou"), pelo evento kaizen:abrir-pacote.
   Nada aqui conversa com servidor.
========================================================= */

import PLANOS from "./galeria-dados.js";


const esc = (texto) => String(texto).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const DESTAQUES = ["enem-comecar", "aprender", "financas-pessoais", "javascript"];   // o que aparece direto no estado vazio, de áreas diferentes


function contagens({ plano }) {
    const cartoes = plano.sessoes.reduce((soma, s) => soma + s.cartoes.length, 0);
    return `${plano.sessoes.length} sessões · ${cartoes} flashcards`;
}


function cartao(item) {
    return `
        <article class="gal-cartao">
            <span class="gal-emoji" aria-hidden="true">${item.emoji}</span>
            <div class="gal-corpo">
                <h4>${esc(item.plano.titulo)}</h4>
                <p>${esc(item.resumo)}</p>
                <p class="gal-meta"><span class="gal-chip">${esc(item.nivel)}</span> ${esc(contagens(item))}</p>
            </div>
            <button type="button" class="btn-primario gal-comecar" data-galeria-plano="${esc(item.id)}"
                    aria-label="Começar o plano ${esc(item.plano.titulo)}">Começar</button>
        </article>`;
}


/* Sem nenhum plano ainda: mostra os planos prontos no lugar da lista vazia. */
function mostrarNoVazio(lista) {

    const destaque = DESTAQUES.map((id) => PLANOS.find((p) => p.id === id)).filter(Boolean);

    lista.innerHTML = `
        <section class="gal-vazio" aria-label="Planos prontos">
            <header>
                <h3>Comece agora, sem esperar a IA</h3>
                <p>Escolha um plano pronto, marque os dias e ele já aparece no calendário, com materiais, atividades e flashcards.
                   Quando quiser outro assunto, é só criar um plano novo.</p>
            </header>
            <div class="gal-lista">${destaque.map(cartao).join("")}</div>
            <button type="button" class="est-link" data-galeria-todos>Ver todos os ${PLANOS.length} planos prontos →</button>
        </section>`;

}


/* ---------- a janela com todos os planos ---------- */

let janela = null;
const AREAS = [...new Set(PLANOS.map((p) => p.area))];
let filtro = { area: "", busca: "" };

const semAcento = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* Desenha a lista da janela conforme a área e a busca. */
function desenharLista() {

    const busca = semAcento(filtro.busca.trim());
    const lista = PLANOS.filter((p) => (!filtro.area || p.area === filtro.area)
        && (!busca || semAcento(`${p.plano.titulo} ${p.resumo} ${p.area}`).includes(busca)));

    janela.querySelector(".gal-lista-grande").innerHTML = lista.length
        ? lista.map(cartao).join("")
        : `<p class="gal-nada">Nenhum plano com esse filtro. Tente outra área, ou crie um plano sob medida com a IA.</p>`;
    janela.querySelector(".gal-contagem").textContent = `${lista.length} ${lista.length === 1 ? "plano" : "planos"}`;
    janela.querySelectorAll("[data-gal-area]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.galArea === filtro.area)));

}

function abrirJanela() {

    if (!janela) {
        janela = document.createElement("dialog");
        janela.className = "modal gal-modal";
        janela.setAttribute("aria-labelledby", "gal-titulo");
        janela.innerHTML = `
            <h2 class="modal-titulo" id="gal-titulo">Planos prontos</h2>
            <p class="sinc-texto">Sem IA e sem espera: o plano entra no seu calendário na hora. Os links são só de documentação oficial e de enciclopédia.</p>
            <div class="gal-filtros" role="group" aria-label="Filtrar por área">
                <button type="button" class="gal-area" data-gal-area="" aria-pressed="true">Todos</button>
                ${AREAS.map((a) => `<button type="button" class="gal-area" data-gal-area="${esc(a)}" aria-pressed="false">${esc(a)}</button>`).join("")}
            </div>
            <div class="gal-busca">
                <input type="search" id="gal-busca" placeholder="Buscar: redação, física, Python, inglês…" autocomplete="off" aria-label="Buscar plano pronto">
                <span class="gal-contagem" aria-live="polite"></span>
            </div>
            <div class="gal-lista gal-lista-grande"></div>
            <div class="form-acoes"><button type="button" class="btn-secundario" data-fechar>Fechar</button></div>`;
        janela.querySelector("[data-fechar]").addEventListener("click", () => janela.close());
        janela.querySelector(".gal-filtros").addEventListener("click", (evento) => {
            const botao = evento.target.closest("[data-gal-area]");
            if (!botao) return;
            filtro.area = botao.dataset.galArea;
            desenharLista();
        });
        janela.querySelector("#gal-busca").addEventListener("input", (evento) => {
            filtro.busca = evento.target.value;
            desenharLista();
        });
        document.body.append(janela);
        desenharLista();
    }

    document.querySelector("#est-assistente")?.close();
    janela.showModal();
    document.dispatchEvent(new CustomEvent("kaizen:uso", { detail: "galeria_aberta" }));

}


/* O pacote do plano, sem os campos só da galeria (é o formato do "compartilhar plano"). */
function escolher(id) {

    const item = PLANOS.find((p) => p.id === id);
    if (!item) return;

    janela?.close();
    document.dispatchEvent(new CustomEvent("kaizen:abrir-pacote", { detail: { pacote: structuredClone(item.plano), origem: "galeria" } }));

}


document.addEventListener("click", (evento) => {

    const escolhido = evento.target.closest("[data-galeria-plano]");
    if (escolhido) return escolher(escolhido.dataset.galeriaPlano);

    if (evento.target.closest("[data-galeria-todos], #gal-abrir")) abrirJanela();

});

// js/estudos.js avisa quando não há nenhum plano pra desenhar
document.addEventListener("kaizen:planos-vazio", ({ detail }) => mostrarNoVazio(detail.lista));
