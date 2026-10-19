/* =========================================================
   SERVIDORES DE IA — onde a IA roda
   ---------------------------------------------------------
   "Este computador" sempre existe. Dá pra cadastrar outras
   máquinas com Ollama (ex.: pelo IP do Tailscale) e conectar
   ChatGPT ou Gemini com uma chave de API, e escolher qual o
   chat usa. Os planos de estudo podem usar modelos de
   qualquer destino online.

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

            if (remover && confirm(`Remover "${remover.dataset.nome}"?`)) {
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


    // contas na nuvem: botão abre o campo da chave; salvar testa e conecta
    painel.querySelector("#srv-nuvem").addEventListener("click", (evento) => {

        const abrir = evento.target.closest("[data-abrir-nuvem]");

        if (abrir) {
            const caixa = painel.querySelector(`[data-caixa-nuvem="${abrir.dataset.abrirNuvem}"]`);
            caixa.hidden = !caixa.hidden;
            if (!caixa.hidden) caixa.querySelector("input").focus();
        }

    });


    painel.querySelector("#srv-nuvem").addEventListener("submit", async (evento) => {

        evento.preventDefault();

        const caixa = evento.target.closest("[data-caixa-nuvem]");
        const botao = caixa.querySelector("button[type=submit]");

        botao.disabled = true;
        botao.textContent = "Testando…";
        erro.textContent = "";

        try {

            const { servidores } = await api(`/nuvem/${caixa.dataset.caixaNuvem}`, {
                method: "POST",
                body: {
                    chave: caixa.querySelector("[name=chave]").value,
                    url: caixa.querySelector("[name=url]")?.value
                }
            });

            renderizar(servidores);
            await carregar();
            avisarMudanca();

        } catch (falha) {

            erro.textContent = falha.message;
            botao.disabled = false;
            botao.textContent = "Salvar";

        }

    });


    // status atualizado sempre que a aba do assistente é aberta
    document.querySelector('.nav-tab[data-tela="ia"]')?.addEventListener("click", carregar);

    carregar();

}


async function carregar() {

    try {

        const { servidores, nuvem, modo } = await api("");

        // sem servidor (celular, site estático) a IA é só na nuvem:
        // nada de cadastrar Ollama
        const soNuvem = modo === "nuvem";
        painel.querySelector("#srv-form").hidden = soNuvem;
        painel.querySelector(".srv-dica").hidden = soNuvem;

        renderizar(servidores, soNuvem);
        renderizarNuvem(nuvem || []);

    } catch (falha) {
        painel.querySelector("#srv-erro").textContent = "Não consegui listar os servidores.";
    }

}


function renderizar(servidores, soNuvem = false) {

    // No celular é o único jeito de ter IA; no PC, abre se a IA em uso não é a daqui.
    // Só abre, nunca fecha: quem abriu na mão continua vendo.
    if (soNuvem || servidores.some((s) => s.preferido && s.id !== "local")) {
        painel.querySelector("#srv-mais").open = true;
    }

    if (soNuvem && servidores.length === 0) {
        painel.querySelector("#srv-lista").innerHTML = `
            <p class="srv-dica">Nenhuma IA conectada. Conecte o <b>OpenRouter</b> (modelos grátis)
            ou outra IA abaixo — a chave fica salva só neste aparelho.</p>`;
        return;
    }

    painel.querySelector("#srv-lista").innerHTML = servidores.map((s) => {

        const situacao = s.online
            ? `${s.modelos.length} modelo${s.modelos.length === 1 ? "" : "s"} · ${s.ms} ms`
            : (s.tipo === "nuvem" ? "chave recusada ou sem internet" : "offline");

        const endereco = s.tipo === "nuvem"
            ? "☁ nuvem — os textos vão pra esse serviço"
            : s.url.replace(/^https?:\/\//, "");

        return `
            <div class="srv-item ${s.online ? "" : "srv-offline"}">
                <button type="button" class="srv-usar" data-usar="${esc(s.id)}"
                        aria-pressed="${s.preferido}" title="Usar este servidor no chat">
                    <span class="status-dot ${s.online ? "status-online" : "status-offline"}"></span>
                    <span class="srv-texto">
                        <strong>${esc(s.nome)}</strong>
                        <small>${esc(endereco)}</small>
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


function renderizarNuvem(nuvem) {

    // só as que ainda não foram conectadas; as conectadas já estão na lista
    painel.querySelector("#srv-nuvem").innerHTML = nuvem.filter((n) => !n.conectado).map((n) => `
        <button type="button" class="srv-nuvem-botao" data-abrir-nuvem="${esc(n.id)}">☁ Conectar ${esc(n.nome)}</button>
        <form class="srv-form srv-caixa-nuvem" data-caixa-nuvem="${esc(n.id)}" hidden>
            ${n.pede_url ? `
            <input name="url" type="url" required autocomplete="off" spellcheck="false"
                   placeholder="URL da API (ex.: https://openrouter.ai/api/v1)" aria-label="URL da API">` : ""}
            <input name="chave" type="password" ${n.pede_url ? "" : "required"} autocomplete="off" spellcheck="false"
                   placeholder="Cole a chave de API${n.pede_url ? " (se precisar)" : ""}" aria-label="Chave de API do ${esc(n.nome)}">
            <a href="${esc(n.onde_pegar)}" target="_blank" rel="noopener noreferrer">Onde pegar a chave →</a>
            <button type="submit" class="btn-secundario">Salvar</button>
        </form>`).join("");

}
