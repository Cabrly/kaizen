/* =========================================================
   SERVIDORES DE IA — onde a IA roda
   ---------------------------------------------------------
   "Este computador" sempre existe. Dá pra cadastrar outras
   máquinas com Ollama (ex.: pelo IP do Tailscale) e escolher
   qual o chat usa. Os planos de estudo podem usar modelos
   de qualquer servidor online.

   Quando algo muda, avisa o resto da página com o evento
   "kaizen:servidores-mudaram".
========================================================= */


const painel =
    document.querySelector("#ia-servidores");


if (painel) {
    iniciarServidores();
}



function esc(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}


async function api(caminho, opcoes = {}) {

    const resposta = await fetch("./api/ia/servidores" + caminho, {
        headers: { "Content-Type": "application/json" },
        ...opcoes,
        body: opcoes.body ? JSON.stringify(opcoes.body) : undefined
    });

    const documento = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        throw new Error(documento.erro || `HTTP ${resposta.status}`);
    }

    return documento;

}


function avisarMudanca() {
    window.dispatchEvent(new CustomEvent("kaizen:servidores-mudaram"));
}



function iniciarServidores() {

    const lista = painel.querySelector("#srv-lista");
    const formulario = painel.querySelector("#srv-form");
    const erro = painel.querySelector("#srv-erro");


    lista.addEventListener("click", async (evento) => {

        const usar = evento.target.closest("[data-usar]");
        const remover = evento.target.closest("[data-remover]");

        try {

            if (usar && usar.getAttribute("aria-pressed") !== "true") {
                const { servidores } = await api(`/${usar.dataset.usar}/preferido`, { method: "POST" });
                renderizar(servidores);
                avisarMudanca();
            }

            if (remover && confirm(`Remover o servidor "${remover.dataset.nome}"?`)) {
                const { servidores } = await api(`/${remover.dataset.remover}`, { method: "DELETE" });
                renderizar(servidores);
                avisarMudanca();
            }

        } catch (falha) {
            erro.textContent = falha.message;
        }

    });


    formulario.addEventListener("submit", async (evento) => {

        evento.preventDefault();

        const botao = formulario.querySelector("button");

        botao.disabled = true;
        botao.textContent = "Testando…";
        erro.textContent = "";

        try {

            await api("", {
                method: "POST",
                body: {
                    nome: formulario.querySelector("#srv-nome").value,
                    url: formulario.querySelector("#srv-url").value
                }
            });

            formulario.reset();
            await carregar();
            avisarMudanca();

        } catch (falha) {

            erro.textContent = falha.message;

        } finally {

            botao.disabled = false;
            botao.textContent = "Testar e adicionar";

        }

    });


    // status atualizado sempre que a aba do assistente é aberta
    document.querySelector('.nav-tab[data-tela="ia"]')?.addEventListener("click", carregar);

    carregar();

}


async function carregar() {

    try {
        const { servidores } = await api("");
        renderizar(servidores);
    } catch (falha) {
        painel.querySelector("#srv-erro").textContent = "Não consegui listar os servidores.";
    }

}


function renderizar(servidores) {

    painel.querySelector("#srv-lista").innerHTML = servidores.map((s) => {

        const situacao = s.online
            ? `${s.modelos.length} modelo${s.modelos.length === 1 ? "" : "s"} · ${s.ms} ms`
            : "offline";

        return `
            <div class="srv-item ${s.online ? "" : "srv-offline"}">
                <button type="button" class="srv-usar" data-usar="${esc(s.id)}"
                        aria-pressed="${s.preferido}" title="Usar este servidor no chat">
                    <span class="status-dot ${s.online ? "status-online" : "status-offline"}"></span>
                    <span class="srv-texto">
                        <strong>${esc(s.nome)}</strong>
                        <small>${esc(s.url.replace(/^https?:\/\//, ""))}</small>
                        <small>${situacao}</small>
                    </span>
                    ${s.preferido ? '<span class="srv-em-uso">em uso</span>' : ""}
                </button>
                ${s.removivel ? `
                    <button type="button" class="srv-remover" data-remover="${esc(s.id)}" data-nome="${esc(s.nome)}"
                            title="Remover" aria-label="Remover ${esc(s.nome)}">✕</button>` : ""}
            </div>`;

    }).join("");

}
