/* =========================================================
   ENTREGAS — janela de entregar uma atividade
   ---------------------------------------------------------
   O botão "📤 Entregar" de cada atividade (js/estudos.js)
   abre esta janela: a pessoa escreve a resposta, anexa
   arquivos de texto/código e/ou cola um link (GitHub).
   Se a IA conectada for forte, ela corrige em segundo plano
   e a janela mostra a nota, os acertos, os erros e como
   melhorar. Regras e limites: entregas.py / js/nuvem/entregas.js.
========================================================= */


const API = "./api/estudos";
const ARQUIVOS_MAX = 10;
const ARQUIVO_MAX = 500_000;

const modal = document.querySelector("#entrega-modal");
const $ = (seletor) => modal.querySelector(seletor);

let itemAtual = null;
let anexos = [];          // [{ nome, conteudo }]
let vigia = null;


async function api(caminho, opcoes = {}) {
    const resposta = await fetch(API + caminho, {
        headers: { "Content-Type": "application/json" },
        ...opcoes,
        body: opcoes.body ? JSON.stringify(opcoes.body) : undefined
    });
    const corpo = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(corpo.erro || `HTTP ${resposta.status}`);
    return corpo;
}


function esc(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]);
}

// link vindo dos dados (backup, sincronia, IA): só http(s), nunca "javascript:"
function escLink(url) {
    return /^https?:\/\//i.test(String(url ?? "").trim()) ? esc(url) : "#";
}



function tamanho(bytes) {
    return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}


function quando(iso) {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}



/* ---------- abrir ---------- */

async function abrir(itemId, enunciado) {

    itemAtual = itemId;
    anexos = [];
    $("#entrega-enunciado").textContent = enunciado;
    $("#entrega-texto").value = "";
    $("#entrega-link").value = "";
    $("#entrega-arquivo").value = "";
    $("#entrega-erro").hidden = true;
    mostrarAnexos();
    $("#entrega-lista").innerHTML = `<p class="entrega-sutil">Carregando…</p>`;
    if (!modal.open) modal.showModal();
    await carregar();

}


// a janela pode fechar no meio da correção: a vigia continua e avisa a sessão quando a nota chega
async function carregar(itemId = itemAtual) {

    clearTimeout(vigia);
    if (itemId === null) return;
    const naTela = () => modal.open && itemId === itemAtual;

    let dados;
    try {
        dados = await api(`/entregas?item=${itemId}`);
    } catch (erro) {
        if (naTela()) $("#entrega-lista").innerHTML = `<p class="entrega-sutil">Não consegui carregar as entregas: ${esc(erro.message)}</p>`;
        return;
    }

    const { entregas, corretor } = dados;
    const corrigindo = entregas.some((e) => ["na-fila", "corrigindo"].includes(e.situacao));
    if (corrigindo) {
        vigia = setTimeout(async () => {
            if (!(await carregar(itemId))) document.dispatchEvent(new CustomEvent("kaizen:entrega"));
        }, 3000);
    }
    if (!naTela()) return corrigindo;

    $("#entrega-corretor").innerHTML = corretor.pode
        ? `✍️ Quem corrige: <b>${esc(corretor.nome)}</b>`
        : `⚠️ A IA conectada agora é pequena demais pra dar nota (ela chutaria). A entrega fica guardada e você pede a
           correção depois de conectar uma IA mais forte em <b>Onde a IA roda</b> (Claude Code, Gemini, ChatGPT,
           OpenRouter com modelo grande…).`;
    $("#entrega-titulo-lista").hidden = !entregas.length;
    $("#entrega-lista").innerHTML = entregas.map(cartao).join("");
    $("#entrega-nova-titulo").textContent = entregas.length ? "Entregar de novo" : "Sua entrega";
    return corrigindo;

}


function cartao(e) {

    const c = e.correcao;
    const situacao = {
        "na-fila": "⏳ Na fila da correção…",
        corrigindo: `⏳ ${esc(e.corretor || "A IA")} está corrigindo…`,
        "sem-corretor": "Guardada (sem correção: nenhuma IA forte conectada)",
        erro: `Não deu pra corrigir: ${esc(e.erro || "erro desconhecido")}`
    }[e.situacao];

    const lista = (titulo, itens, classe) => itens?.length
        ? `<h5>${titulo}</h5><ul class="${classe}">${itens.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "";

    const nota = c ? `<span class="entrega-nota entrega-nota-${c.nota >= 7 ? "boa" : c.nota >= 5 ? "media" : "baixa"}">${c.nota}<small>/10</small></span>` : "";

    return `
        <article class="entrega-cartao">
            <header>
                ${nota}
                <div>
                    <strong>Entrega de ${quando(e.criado_em)}</strong>
                    <small>${c ? `corrigida por ${esc(e.corretor || "IA")}` : situacao}</small>
                </div>
            </header>
            ${c ? `
                <p class="entrega-resumo">${esc(c.resumo)}</p>
                ${lista("✓ O que ficou bom", c.acertos, "entrega-acertos")}
                ${lista("✗ O que errou", c.erros, "entrega-erros")}
                ${lista("→ Como melhorar", c.como_melhorar, "entrega-melhorar")}
                ${c.dificuldades?.length ? `<p class="entrega-dificuldades">Pontos pra reforçar: ${c.dificuldades.map((d) => `<span>${esc(d)}</span>`).join("")}</p>` : ""}` : ""}
            <details class="entrega-o-que">
                <summary>O que você entregou</summary>
                ${e.texto ? `<pre class="entrega-pre">${esc(e.texto)}</pre>` : ""}
                ${e.link ? `<p>🔗 <a href="${escLink(e.link)}" target="_blank" rel="noopener noreferrer">${esc(e.link)}</a></p>` : ""}
                ${e.arquivos.map((a) => a.conteudo != null
                    ? `<details><summary>📄 ${esc(a.nome)} <small>${tamanho(a.tamanho || 0)}</small></summary><pre class="entrega-pre">${esc(a.conteudo)}</pre></details>`
                    : `<p>📄 ${esc(a.nome)} <small>(guardado no PC)</small></p>`).join("")}
            </details>
            <div class="entrega-acoes">
                ${["na-fila", "corrigindo"].includes(e.situacao) ? ""
                    : `<button type="button" class="btn-secundario" data-corrigir="${e.id}">${c ? "Corrigir de novo" : "Pedir correção"}</button>`}
                <button type="button" class="est-link entrega-apagar" data-apagar="${e.id}">Apagar</button>
            </div>
        </article>`;

}



/* ---------- anexos ---------- */

function mostrarAnexos() {
    $("#entrega-anexos").innerHTML = anexos.map((a, i) => `
        <span class="entrega-anexo">📄 ${esc(a.nome)} <small>${tamanho(new Blob([a.conteudo]).size)}</small>
            <button type="button" data-tirar="${i}" aria-label="Tirar ${esc(a.nome)}">✕</button></span>`).join("");
}


async function anexar(arquivos) {

    erro("");
    for (const arquivo of arquivos) {
        if (anexos.length >= ARQUIVOS_MAX) { erro(`No máximo ${ARQUIVOS_MAX} arquivos por entrega.`); break; }
        if (arquivo.size > ARQUIVO_MAX * 2) { erro(`"${arquivo.name}" é grande demais. Projeto grande: mande o link do GitHub.`); continue; }
        const conteudo = await arquivo.text();
        if (conteudo.includes("\u0000")) { erro(`"${arquivo.name}" não é texto nem código. Imagem e PDF ainda não dá: mande o código ou um link.`); continue; }
        if (conteudo.length > ARQUIVO_MAX) { erro(`"${arquivo.name}" passa de ${ARQUIVO_MAX / 1000} mil caracteres. Mande o link do GitHub.`); continue; }
        anexos = anexos.filter((a) => a.nome !== arquivo.name).concat({ nome: arquivo.name, conteudo });
    }
    mostrarAnexos();

}


function erro(texto) {
    $("#entrega-erro").textContent = texto;
    $("#entrega-erro").hidden = !texto;
}



/* ---------- ações ---------- */

async function entregar() {

    const botao = $("#entrega-enviar");
    botao.disabled = true;
    erro("");

    try {
        await api("/entregas", { method: "POST", body: {
            item_id: itemAtual, texto: $("#entrega-texto").value, link: $("#entrega-link").value, arquivos: anexos
        } });
        $("#entrega-texto").value = "";
        $("#entrega-link").value = "";
        anexos = [];
        mostrarAnexos();
        document.dispatchEvent(new CustomEvent("kaizen:entrega"));
        await carregar();
        $("#entrega-lista").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (falha) {
        erro(falha.message);
    } finally {
        botao.disabled = false;
    }

}


modal?.addEventListener("click", async (evento) => {

    const alvo = evento.target.closest("button");
    if (!alvo) return;

    if (alvo.hasAttribute("data-fechar")) { modal.close(); return; }
    if (alvo.id === "entrega-enviar") { entregar(); return; }
    if (alvo.dataset.tirar) { anexos.splice(Number(alvo.dataset.tirar), 1); mostrarAnexos(); return; }

    try {
        if (alvo.dataset.corrigir) {
            await api(`/entregas/${alvo.dataset.corrigir}/corrigir`, { method: "POST" });
            await carregar();
        } else if (alvo.dataset.apagar && confirm("Apagar esta entrega? A nota e a correção vão junto.")) {
            await api(`/entregas/${alvo.dataset.apagar}`, { method: "DELETE" });
            document.dispatchEvent(new CustomEvent("kaizen:entrega"));
            await carregar();
        }
    } catch (falha) {
        alert(falha.message);
    }

});


modal?.addEventListener("close", () => { itemAtual = null; });

$("#entrega-arquivo")?.addEventListener("change", (evento) => anexar([...evento.target.files]).then(() => { evento.target.value = ""; }));

// arrastar arquivos pra cima da janela também anexa
modal?.addEventListener("dragover", (evento) => evento.preventDefault());
modal?.addEventListener("drop", (evento) => {
    evento.preventDefault();
    if (evento.dataTransfer?.files?.length) anexar([...evento.dataTransfer.files]);
});

document.addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-entregar]");
    if (!botao || !modal) return;
    const item = botao.closest(".est-item");
    abrir(Number(botao.dataset.entregar), item?.querySelector(".est-item-texto p")?.textContent
        || item?.querySelector(".est-item-texto span, .est-item-texto a")?.textContent || "");
});
