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

// pra onde o QR do "Usar no celular" leva (o mesmo da sincronia)
const ENDERECO_APP = "https://cabrly.github.io/kaizen/";


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
    // (o OpenRouter fica à vista em #srv-openrouter; as outras contas, em "Outras opções")
    const areasNuvem = painel.querySelectorAll("#srv-nuvem, #srv-openrouter");

    areasNuvem.forEach((area) => area.addEventListener("click", (evento) => {

        const abrir = evento.target.closest("[data-abrir-nuvem]");

        if (evento.target.closest("[data-entrar-openrouter]")) return entrarOpenRouter(evento.target.closest("button"));

        if (abrir) {
            const caixa = painel.querySelector(`[data-caixa-nuvem="${abrir.dataset.abrirNuvem}"]`);
            caixa.hidden = !caixa.hidden;
            if (!caixa.hidden) caixa.querySelector("input").focus();
        }

    }));


    areasNuvem.forEach((area) => area.addEventListener("submit", async (evento) => {

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

    }));


    // status atualizado sempre que a aba do assistente é aberta
    document.querySelector('.nav-tab[data-tela="ia"]')?.addEventListener("click", carregar);


    // PC: liberar a IA daqui pro celular (só consulta o Tailscale quando abre)
    const celular = painel.querySelector("#srv-celular");

    celular.addEventListener("toggle", () => { if (celular.open) carregarCelular(); });

    celular.addEventListener("click", async (evento) => {

        const botao = evento.target.closest("[data-celular]");

        if (!botao) return;
        if (botao.dataset.celular === "recarregar") return carregarCelular();
        if (botao.dataset.celular === "chave" && !confirm("Trocar a chave? O celular vai precisar da nova.")) return;

        botao.disabled = true;
        botao.textContent = "Aguarde…";

        try {
            const resposta = await fetch(`./api/remoto/${botao.dataset.celular}`, { method: "POST" });
            const dados = await resposta.json();
            if (!resposta.ok) throw new Error(dados.erro);
            renderizarCelular(dados);
        } catch (falha) {
            renderizarCelular({ ...ultimaCelular, erro: falha.message || "Não consegui falar com o Tailscale." });
        }

    });


    carregar();

    if (location.hash.startsWith("#pc=")) conectarPeloLink();

    const volta = new URLSearchParams(location.search);
    if (volta.has("code") && volta.has("state")) concluirOpenRouter(volta);

    // no programa de computador o login do OpenRouter termina no navegador:
    // ao voltar pra janela, a lista já mostra a IA conectada
    window.addEventListener("focus", () => { if (painel.offsetParent) carregar(); });

    // o cartão da IA local também oferece o OpenRouter
    window.addEventListener("kaizen:entrar-openrouter", (evento) => entrarOpenRouter(evento.detail));

}


/*
    Entrar com o OpenRouter: abre o login dele, que volta pra cá com
    ?code=&state=. Quem guarda o verificador é o servidor (server.py ou o
    de bolso), então a volta pode cair até no navegador do sistema.
*/
async function entrarOpenRouter(botao) {

    const erro = painel.querySelector("#srv-erro");

    botao.disabled = true;
    erro.textContent = "";

    try {
        const volta = location.origin + location.pathname + (window.KAIZEN_DESKTOP ? "?de=programa" : "");
        const { url } = await api("/openrouter/entrar", { method: "POST", body: { volta } });
        location.href = url;   // no programa, abre no navegador do sistema
        if (window.KAIZEN_DESKTOP) {
            erro.textContent = "Termine o login no navegador que abriu e volte pra cá.";
        }
    } catch (falha) {
        erro.textContent = falha.message;
    } finally {
        botao.disabled = false;
    }

}


async function concluirOpenRouter(volta) {

    history.replaceState(null, "", location.pathname);   // o código não fica no histórico

    document.querySelector('.nav-tab[data-tela="ia"]')?.click();
    painel.querySelector("#srv-mais").open = true;

    const erro = painel.querySelector("#srv-erro");
    erro.textContent = "Conectando o OpenRouter…";

    try {
        await api("/openrouter/concluir", { method: "POST", body: { codigo: volta.get("code"), estado: volta.get("state") } });
        erro.textContent = volta.get("de") === "programa"
            ? "OpenRouter conectado! Pode fechar esta aba e voltar pro programa do Kaizen."
            : "OpenRouter conectado! Os modelos grátis já estão prontos pra usar.";
        await carregar();
        avisarMudanca();
    } catch (falha) {
        erro.textContent = falha.message;
    }

}


/*
    Celular: o QR do PC abre .../#pc=ENDERECO~CHAVE, que conecta
    o "Kaizen do meu PC" sem digitar nada.
*/
async function conectarPeloLink() {

    const [url, chave] = decodeURIComponent(location.hash.slice(4)).split("~");

    history.replaceState(null, "", location.pathname + location.search);   // a chave não fica no histórico

    if ((await window.kaizenModo) !== "nuvem") return;   // aberto no próprio PC: não faz sentido

    document.querySelector('.nav-tab[data-tela="ia"]')?.click();
    painel.querySelector("#srv-mais").open = true;

    const erro = painel.querySelector("#srv-erro");
    erro.textContent = "Conectando no seu PC…";

    try {
        await api("/nuvem/pc", { method: "POST", body: { url, chave } });
        erro.textContent = "";
        await carregar();
        avisarMudanca();
    } catch (falha) {
        erro.textContent = falha.message;
    }

}


let ultimaCelular = {};
let esperaCelular = null;


async function carregarCelular(silencioso = false) {

    const corpo = painel.querySelector("#srv-celular-corpo");

    if (!silencioso) corpo.innerHTML = '<p class="srv-dica">Conferindo o Tailscale…</p>';

    try {
        const resposta = await fetch("./api/remoto");
        renderizarCelular(await resposta.json());
    } catch (falha) {
        if (!silencioso) corpo.innerHTML = '<p class="srv-dica">Não consegui conferir o Tailscale.</p>';
    }

}


/*
    Um passo de cada vez, cada um com um botão só:
    instalar → abrir → entrar → conectar → liberar → pronto (QR).
    Enquanto espera a pessoa (login, instalação, ativar HTTPS),
    confere sozinho a cada 3 s.
*/
const PASSOS_CELULAR = ["Tailscale", "Conta", "Liberar", "Celular"];

const ETAPAS_CELULAR = {
    instalar: {
        passo: 0,
        texto: "O celular fala com este PC por uma rede privada só sua, o <b>Tailscale</b> (grátis). Primeiro, instale ele aqui.",
        botao: (s) => s.pode_instalar ? ["instalar", "Instalar o Tailscale"] : null,
        link: (s) => s.pode_instalar ? null : ["https://tailscale.com/download", "Baixar o Tailscale ↗"],
        trabalhando: "Instalando… se o Windows pedir permissão, clique em <b>Sim</b>."
    },
    abrir: {
        passo: 0,
        texto: "O Tailscale está instalado, mas desligado.",
        botao: (s) => s.pode_abrir ? ["abrir", "Ligar o Tailscale"] : null,
        trabalhando: "Ligando o Tailscale…"
    },
    entrar: {
        passo: 1,
        texto: "Entre na sua conta do Tailscale (dá pra usar a do Google). No celular, você vai usar a mesma.",
        botao: (s) => s.link ? null : ["entrar", "Entrar na conta"],
        link: (s) => s.link ? [s.link, "Abrir a página de login ↗"] : null,
        trabalhando: "Esperando você entrar na página que abriu…"
    },
    conectar: {
        passo: 1,
        texto: "O Tailscale está desconectado.",
        botao: () => ["conectar", "Conectar"]
    },
    liberar: {
        passo: 2,
        texto: `Agora é só liberar: o celular passa a usar os modelos deste PC (Ollama, Claude Code…).
                Só aparelhos da sua conta enxergam, só a IA fica liberada e ela é protegida por uma chave.
                Suas tarefas e chaves de API continuam só aqui.`,
        botao: (s) => s.link ? null : ["ligar", "Liberar pro celular"],
        link: (s) => s.link ? [s.link, "Ativar o HTTPS ↗"] : null,
        trabalhando: "Falta um clique: o Tailscale pede pra ativar o HTTPS da sua rede (grátis). Clique em <b>Ativar o HTTPS</b>, confirme lá e volte aqui."
    }
};


async function renderizarCelular(s) {

    const corpo = painel.querySelector("#srv-celular-corpo");
    const etapa = ETAPAS_CELULAR[s.etapa];

    ultimaCelular = s;
    clearTimeout(esperaCelular);

    if (etapa) {

        const passos = PASSOS_CELULAR.map((nome, i) =>
            `<li class="${i < etapa.passo ? "feito" : i === etapa.passo ? "atual" : ""}">${nome}</li>`).join("");
        const botao = etapa.botao?.(s);
        const link = etapa.link?.(s);

        corpo.innerHTML = `
            <ol class="srv-etapas" aria-label="Passos">${passos}</ol>
            <p class="srv-dica">${s.trabalhando && etapa.trabalhando ? etapa.trabalhando : etapa.texto}</p>
            ${s.erro ? `<p class="est-erro">${esc(s.erro)}</p>` : ""}
            <div class="srv-celular-acoes">
                ${botao ? `<button type="button" class="btn-primario" data-celular="${botao[0]}">${botao[1]}</button>` : ""}
                ${link ? `<a class="btn-primario" href="${esc(link[0])}" target="_blank" rel="noopener noreferrer">${link[1]}</a>` : ""}
                <button type="button" class="srv-celular-conferir" data-celular="recarregar">Conferir de novo</button>
            </div>`;

        if (s.trabalhando || s.link) {
            esperaCelular = setTimeout(() => painel.querySelector("#srv-celular").open && carregarCelular(true), 3000);
        }

        return;

    }

    const link = `${ENDERECO_APP}#pc=${encodeURIComponent(`${s.url}~${s.chave}`)}`;
    const { default: qrcode } = await import("./vendor/qrcode.js");
    const qr = qrcode(0, "M");
    qr.addData(link);
    qr.make();

    corpo.innerHTML = `
        <ol class="srv-etapas" aria-label="Passos">${PASSOS_CELULAR.map((nome, i) =>
            `<li class="${i < 3 ? "feito" : "atual"}">${nome}</li>`).join("")}</ol>
        <ol class="srv-passos">
            <li>No celular, instale o <a href="https://tailscale.com/download" target="_blank" rel="noopener noreferrer">Tailscale</a>
                e entre com a mesma conta deste PC.</li>
            <li>Aponte a câmera pro QR. Ou, no Kaizen do celular, vá em <b>Conectar Kaizen do meu PC</b> e digite os dados abaixo.</li>
            <li>Deixe este PC ligado com o Kaizen aberto enquanto usa.</li>
        </ol>
        <div class="sinc-qr">${qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true })}</div>
        <div class="srv-celular-dados">
            <small>Endereço</small><code>${esc(s.url.replace(/^https:\/\//, ""))}</code>
            <small>Chave</small><code>${esc(s.chave)}</code>
        </div>
        ${s.erro ? `<p class="est-erro">${esc(s.erro)}</p>` : ""}
        <div class="srv-celular-acoes">
            <button type="button" class="btn-secundario" data-celular="chave">Trocar a chave</button>
            <button type="button" class="btn-secundario" data-celular="desligar">Desligar</button>
        </div>`;

}


let cotas = {};   // usos de hoje por IA, do que a última listagem trouxe


/*
    Quantos usos da IA ainda sobram hoje, em pedidos (não em tokens). A IA grátis do Kaizen tem o limite de
    verdade no servidor dela; o OpenRouter, o do plano grátis (50 por dia, 1000 com créditos) contando só o que
    passou por aqui; as outras só mostram quantas vezes foram usadas.
*/
function usoDeHoje(id) {

    const c = cotas[id];

    if (!c) return "";

    let texto;

    if (typeof c.restantes === "number") {
        texto = c.restantes > 0 ? `Hoje: restam ${c.restantes} de ${c.limite} usos`
            : c.motivo === "cota-dia" ? "Hoje: a cota geral da IA grátis acabou, volta amanhã"
            : c.motivo === "cota-ip" ? "Hoje: o limite da sua rede acabou, volta amanhã"
            : `Hoje: os ${c.limite} usos acabaram, volta amanhã`;
    } else if (c.limite) {
        texto = `Hoje: ${c.usadas} de ${c.limite} usos (pelo Kaizen)`;
    } else if (c.usadas) {
        texto = `Hoje: ${c.usadas} ${c.usadas === 1 ? "uso" : "usos"}`;
    } else {
        return "";
    }

    const acabando = typeof c.restantes === "number" ? c.restantes <= 2 : Boolean(c.limite) && c.usadas >= c.limite * 0.9;

    return `<small class="srv-uso ${acabando ? "srv-uso-acabando" : ""}"
        title="Um uso é uma pergunta do assistente, um bloco do roteiro, um conjunto de cartões, uma correção ou uma mensagem do chat. Zera à meia-noite.">${esc(texto)}</small>`;

}


async function carregar() {

    try {

        const { servidores, nuvem, modo, cotas: cotasHoje } = await api("");

        cotas = cotasHoje || {};

        // sem servidor (celular, site estático) a IA é só na nuvem:
        // nada de cadastrar Ollama
        const soNuvem = modo === "nuvem";
        painel.querySelector("#srv-form").closest("details").hidden = soNuvem;
        painel.querySelector(".srv-dica").hidden = soNuvem;
        painel.querySelector("#srv-celular").hidden = soNuvem;

        renderizar(servidores, soNuvem);
        renderizarNuvem(nuvem || []);

    } catch (falha) {
        painel.querySelector("#srv-erro").textContent = "Não consegui listar os servidores.";
    }

}


function renderizar(servidores, soNuvem = false) {

    if (soNuvem && servidores.length === 0) {
        painel.querySelector("#srv-lista").innerHTML = `
            <p class="srv-dica">Nenhuma IA conectada. Conecte o <b>OpenRouter</b> (modelos grátis)
            ou outra IA abaixo — a chave fica salva só neste aparelho.</p>`;
        return;
    }

    painel.querySelector("#srv-lista").innerHTML = servidores.map((s) => {

        if (s.tipo === "agente" && !s.instalado) return `
            <div class="srv-item srv-offline">
                <div class="srv-usar">
                    <span class="status-dot status-offline"></span>
                    <span class="srv-texto">
                        <strong>${esc(s.nome)}</strong>
                        <small>⌨ não instalado neste computador</small>
                        <small><a href="${esc(s.como_instalar)}" target="_blank" rel="noopener noreferrer">Como instalar</a>
                            (depois faça login no terminal: ele aparece aqui sozinho)</small>
                    </span>
                </div>
            </div>`;

        const situacao = s.online
            ? `${s.modelos.length} modelo${s.modelos.length === 1 ? "" : "s"}${s.ms == null ? "" : ` · ${s.ms} ms`}`
            : ({ nuvem: "chave recusada ou sem internet", pc: "PC desligado, Kaizen fechado ou Tailscale desligado" }[s.tipo] || "offline");

        const endereco = {
            nuvem: "☁ nuvem — os textos vão pra esse serviço",
            pc: "💻 seu computador, pelo Tailscale",
            agente: "⌨ usa o login da sua conta"
        }[s.tipo] || s.url.replace(/^https?:\/\//, "");

        return `
            <div class="srv-item ${s.online ? "" : "srv-offline"}">
                <button type="button" class="srv-usar" data-usar="${esc(s.id)}"
                        aria-pressed="${s.preferido}" title="Usar este servidor no chat">
                    <span class="status-dot ${s.online ? "status-online" : "status-offline"}"></span>
                    <span class="srv-texto">
                        <strong>${esc(s.nome)}</strong>
                        <small>${esc(endereco)}</small>
                        <small>${situacao}</small>
                        ${usoDeHoje(s.id)}
                    </span>
                    ${s.preferido ? '<span class="srv-em-uso">em uso</span>' : ""}
                </button>
                ${s.removivel ? `
                    <button type="button" class="srv-remover" data-remover="${esc(s.id)}" data-nome="${esc(s.nome)}"
                            title="Remover" aria-label="Remover ${esc(s.nome)}">✕</button>` : ""}
            </div>`;

    }).join("") + (soNuvem || servidores.some((s) => s.tipo === "agente") ? "" : `
        <p class="srv-dica">Usa <b>Claude Code</b>, <b>Gemini CLI</b> ou <b>Codex</b>? Instale e faça login
        no terminal que ele aparece aqui sozinho, sem chave de API.</p>`);

}


// O OpenRouter é o caminho grátis recomendado: entra com um clique, e colar
// a chave fica de plano B (quando o login não volta, por exemplo).
const ENTRAR_OPENROUTER = `
    <div class="srv-openrouter">
        <button type="button" class="btn-primario" data-entrar-openrouter>Entrar com o OpenRouter (grátis)</button>
        <p class="srv-dica">Abre o site do OpenRouter: entre com a conta Google, clique em <b>Authorize</b>
            e você volta pra cá com a IA pronta. Não precisa de cartão nem de copiar chave.</p>
    </div>`;

const PASSOS_OPENROUTER = `
    <ol class="srv-passos">
        <li>Abra <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer">openrouter.ai</a>
            e clique em <b>Sign in</b>. Dá pra entrar com a conta Google.</li>
        <li>Vá em <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">openrouter.ai/keys</a>,
            clique em <b>Create Key</b>, dê um nome (ex.: Kaizen) e confirme.</li>
        <li>Copie a chave que aparece (começa com <code>sk-or-</code>). Ela só aparece uma vez!</li>
        <li>Cole aqui embaixo e clique em <b>Salvar</b>. Não precisa de cartão.</li>
    </ol>`;


const PASSOS_PC = `
    <ol class="srv-passos">
        <li>Instale o <a href="https://tailscale.com/download" target="_blank" rel="noopener noreferrer">Tailscale</a>
            no PC e aqui, com a mesma conta.</li>
        <li>No Kaizen do PC: aba do assistente → <b>Outras opções</b> → <b>Usar a IA deste PC no celular</b> →
            <b>Liberar pro celular</b>.</li>
        <li>Aponte a câmera pro QR que aparece lá, ou digite o endereço e a chave aqui.</li>
    </ol>`;


function renderizarNuvem(nuvem) {

    // só as que ainda não foram conectadas; as conectadas já estão na lista.
    // O OpenRouter (o caminho grátis) fica à vista; o resto, em "Outras opções"
    const faltam = nuvem.filter((n) => !n.conectado);

    const cartao = (n) => `
        ${n.id === "openrouter" ? ENTRAR_OPENROUTER : ""}
        <button type="button" class="srv-nuvem-botao" data-abrir-nuvem="${esc(n.id)}">${n.id === "openrouter"
            ? "Prefiro colar uma chave do OpenRouter" : `☁ Conectar ${esc(n.nome)}`}</button>
        <form class="srv-form srv-caixa-nuvem" data-caixa-nuvem="${esc(n.id)}" hidden>
            ${n.id === "openrouter" ? PASSOS_OPENROUTER : ""}
            ${n.id === "pc" ? PASSOS_PC : ""}
            ${n.id === "pc" ? `
            <input name="url" required autocomplete="off" spellcheck="false" autocapitalize="off"
                   placeholder="Endereço (ex.: meu-pc.tail1234.ts.net:8443)" aria-label="Endereço do PC">` : n.pede_url ? `
            <input name="url" type="url" required autocomplete="off" spellcheck="false"
                   placeholder="URL da API (ex.: https://openrouter.ai/api/v1)" aria-label="URL da API">` : ""}
            <input name="chave" type="password" ${n.pede_url && !n.pede_chave ? "" : "required"} autocomplete="off" spellcheck="false"
                   placeholder="${n.id === "pc" ? "Chave do PC (XXXX-XXXX-XXXX-XXXX)" : `Cole a chave de API${n.pede_url ? " (se precisar)" : ""}`}"
                   aria-label="Chave do ${esc(n.nome)}">
            ${n.id === "pc" ? "" : `<a href="${esc(n.onde_pegar)}" target="_blank" rel="noopener noreferrer">Onde pegar a chave →</a>`}
            <button type="submit" class="btn-secundario">Salvar</button>
        </form>`;

    painel.querySelector("#srv-openrouter").innerHTML = faltam.filter((n) => n.id === "openrouter").map(cartao).join("");
    painel.querySelector("#srv-nuvem").innerHTML = faltam.filter((n) => n.id !== "openrouter").map(cartao).join("");

}
