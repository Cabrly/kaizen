/* =========================================================
   TEMA — claro/escuro e cor (índigo, rosa, verde, laranja)
   O início segue o aparelho (script no <head>, sem piscar);
   os botões do topo trocam e guardam a escolha.
========================================================= */

const html = document.documentElement;
const botaoTema = document.querySelector("#tema-alternar");
const menuCores = document.querySelector("#cores");

function guardar(chave, valor) {
    try { localStorage.setItem(chave, valor); } catch (e) { /* aba privada */ }
}

function mostrarTema() {
    const escuro = html.dataset.tema === "escuro";
    if (botaoTema) {
        botaoTema.textContent = escuro ? "☀" : "☾";
        botaoTema.setAttribute("aria-pressed", String(escuro));
        botaoTema.title = escuro ? "Mudar para o tema claro" : "Mudar para o tema escuro";
    }
}

function mostrarCor() {
    const atual = html.dataset.cor || "indigo";
    menuCores?.querySelectorAll("[data-cor]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cor === atual)));
}

botaoTema?.addEventListener("click", () => {
    html.dataset.tema = html.dataset.tema === "escuro" ? "claro" : "escuro";
    guardar("kaizen.tema", html.dataset.tema);
    mostrarTema();
});

menuCores?.addEventListener("click", (e) => {
    const botao = e.target.closest("[data-cor]");
    if (!botao) return;
    html.dataset.cor = botao.dataset.cor;
    guardar("kaizen.cor", botao.dataset.cor);
    mostrarCor();
    menuCores.open = false;
});

// fecha o menu de cores ao clicar fora
document.addEventListener("click", (e) => {
    if (menuCores?.open && !menuCores.contains(e.target)) menuCores.open = false;
});

mostrarTema();
mostrarCor();
