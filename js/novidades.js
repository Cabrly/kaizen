/* =========================================================
   NOVIDADES — o que mudou em cada versão
   ---------------------------------------------------------
   A lista fica em novidades.json (a mais nova primeiro; o
   workflow de lançamento usa o mesmo arquivo pras notas da
   versão). Na primeira abertura depois de uma atualização,
   a janela abre sozinha com as versões que a pessoa ainda
   não viu. Quem acabou de instalar não vê nada; o botão
   Novidades do rodapé abre a lista quando quiser.
========================================================= */


const VISTA = "kaizen.novidades.vista";
const modal = document.querySelector("#novidades-modal");
const botaoAbrir = document.querySelector("#novidades-abrir");


// "1.10.0" > "1.9.2"
function maior(a, b) {
    const [x, y] = [a, b].map((v) => String(v).split(".").map(Number));
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
        if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
    }
    return false;
}


function dataBonita(iso) {
    const [a, m, d] = iso.split("-");
    return `${d}/${m}/${a}`;
}


function mostrar(versoes, titulo) {
    modal.querySelector("#novidades-titulo").textContent = titulo;
    const lista = modal.querySelector("#novidades-lista");
    lista.replaceChildren(...versoes.map((v) => {
        const bloco = document.createElement("section");
        bloco.className = "novidades-versao";
        const cabeca = document.createElement("h3");
        cabeca.textContent = `Versão ${v.versao}`;
        const quando = document.createElement("small");
        quando.textContent = dataBonita(v.data);
        cabeca.append(" ", quando);
        const itens = document.createElement("ul");
        itens.append(...v.itens.map((texto) => Object.assign(document.createElement("li"), { textContent: texto })));
        bloco.append(cabeca, itens);
        return bloco;
    }));
    if (!modal.open) modal.showModal();
}


async function iniciar() {

    let versoes;
    try {
        versoes = await (await fetch(new URL("../novidades.json", import.meta.url), { cache: "no-cache" })).json();
    } catch (erro) {
        return;
    }
    if (!versoes.length) return;

    const atual = versoes[0].versao;
    botaoAbrir.hidden = false;
    botaoAbrir.addEventListener("click", () => mostrar(versoes, "Novidades do Kaizen"));
    modal.querySelectorAll("[data-fechar]").forEach((b) => b.addEventListener("click", () => modal.close()));

    if (new URLSearchParams(location.search).has("demo")) return;

    let vista;
    try { vista = localStorage.getItem(VISTA); } catch (erro) { return; }
    // sem registro: quem já usava o Kaizen antes desta janela existir vê o que veio desde a 1.0.0
    // (o index.html olha o localStorage antes das telas gravarem nele); quem acabou de instalar, nada
    if (vista === null) vista = window.kaizenJaUsado ? "1.0.0" : atual;

    const novas = versoes.filter((v) => maior(v.versao, vista));
    try { localStorage.setItem(VISTA, atual); } catch (erro) { /* sem storage: mostra de novo na próxima, paciência */ }
    if (novas.length) mostrar(novas, `O Kaizen foi atualizado pra versão ${atual}`);

}


if (modal && botaoAbrir) iniciar();
