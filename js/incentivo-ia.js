/* =========================================================
   INCENTIVO AO OPENROUTER — janelinha ao abrir o Assistente IA
   ---------------------------------------------------------
   Aparece uma vez por sessão enquanto o OpenRouter não estiver
   conectado. "Não mostrar mais" vale pra sempre neste aparelho.
   O botão usa o mesmo caminho do "Entrar com o OpenRouter" do
   painel (servidores.js). Quem usa só um agente (Claude Code,
   Codex…) também vê: o OpenRouter é a opção grátis e de um clique.
========================================================= */


const modal = document.querySelector("#incentivo-ia");

const CHAVE = "kaizen.incentivo-ia.v1";

let jaTentou = false;


function silenciado() {
    try {
        return localStorage.getItem(CHAVE) === "nunca";
    } catch (erro) {
        return false;
    }
}


async function talvezMostrar() {

    if (!modal || jaTentou || silenciado()) return;

    // no site de demonstração não há o que conectar
    if (new URLSearchParams(location.search).has("demo")) return;

    jaTentou = true;

    try {
        const resposta = await fetch("./api/ia/servidores");
        if (!resposta.ok) return;

        const { nuvem = [] } = await resposta.json();

        const semOpenRouter = nuvem.some((n) => n.id === "openrouter" && !n.conectado);
        const naTela = document.body.classList.contains("tela-ia-ativa");

        if (semOpenRouter && naTela && !document.querySelector("dialog[open]")) {
            modal.showModal();
        }
    } catch (erro) {
        /* sem painel de IA ou sem rede: não incomoda */
    }
}


if (modal) {

    document.addEventListener("kaizen:tela", (evento) => {
        if (evento.detail === "ia") talvezMostrar();
    });

    modal.querySelectorAll("[data-fechar]").forEach((botao) =>
        botao.addEventListener("click", () => modal.close()));

    modal.querySelector("#incentivo-entrar").addEventListener("click", (evento) => {
        modal.close();
        window.dispatchEvent(new CustomEvent("kaizen:entrar-openrouter", { detail: evento.currentTarget }));
    });

    modal.querySelector("#incentivo-nunca").addEventListener("click", () => {
        try {
            localStorage.setItem(CHAVE, "nunca");
        } catch (erro) {
            /* sem armazenamento: só fecha */
        }
        modal.close();
    });
}
