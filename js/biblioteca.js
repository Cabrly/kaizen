/* =========================================================
   BIBLIOTECA — o histórico de estudos em livros
   ---------------------------------------------------------
   Cada plano (com os que continuam ele) é um livro na
   estante. Abrindo o livro: o que foi estudado em cada dia,
   as atividades entregues com nota e correção, a nota média
   e os pontos que a IA viu que precisam de reforço. Plano
   concluído ganha o selo dourado.

   É o jeito de ver o histórico pra quem não quer pets (e
   funciona junto com eles). A capa se personaliza na loja,
   com os mesmos pontos dos pets (window.kaizenColecao, do
   js/pets.js). Aparência: js/livros-arte.js.
========================================================= */

import { PARTES, desenharLivro, normalizarLivro } from "./livros-arte.js?v=1";


const modal = document.querySelector("#biblioteca-modal");
const $ = (seletor) => modal.querySelector(seletor);
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

let colecao = null;
let dados = { planos: [], sessoes: [], itens: [] };
let aba = "estante";
let secaoLoja = "capa";
let livroAberto = null;     // id da raiz


function esc(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]);
}


function dataBonita(iso) {
    const [a, m, d] = String(iso).slice(0, 10).split("-").map(Number);
    return `${d} de ${MESES[m - 1]} de ${a}`;
}


/* ---------- livros = correntes de planos (como os pets) ---------- */

function livros() {

    const grupos = new Map();
    dados.planos.filter((p) => p.status === "pronto").forEach((p) => {
        const r = colecao.raiz(p).id;
        if (!grupos.has(r)) grupos.set(r, []);
        grupos.get(r).push(p);
    });

    return [...grupos].map(([id, planos]) => {
        planos.sort((a, b) => a.id - b.id);
        const atual = planos[planos.length - 1];
        return { id, planos, atual, livro: normalizarLivro(colecao.livros()[id]), concluido: colecao.concluido(atual),
                 titulo: planos[0].titulo || planos[0].tema };
    }).sort((a, b) => a.concluido - b.concluido || b.atual.id - a.atual.id);

}


const capa = (l, extra = {}) => desenharLivro({ ...l.livro, ...extra }, {
    titulo: l.titulo, subtitulo: l.planos.length > 1 ? `${l.planos.length} volumes` : "", cor: l.atual.cor, concluido: l.concluido
});


/* ---------- abrir ---------- */

async function abrir(raizId = null) {

    if (!modal.open) modal.showModal();
    $("#biblioteca-corpo").innerHTML = `<p class="biblioteca-vazia">Abrindo a biblioteca…</p>`;
    try {
        ({ dados } = await colecao.carregar());
    } catch (erro) {
        $("#biblioteca-corpo").innerHTML = `<p class="biblioteca-vazia">Não consegui abrir: ${esc(erro.message)}</p>`;
        return;
    }
    livroAberto = raizId;
    mostrar();

}


function mostrar() {

    $("#biblioteca-pontos").textContent = `⭐ ${colecao.pontos()} pontos`;
    modal.querySelectorAll(".biblioteca-aba").forEach((b) => b.classList.toggle("ativa", b.dataset.aba === aba && !livroAberto));

    if (livroAberto !== null) { mostrarLivro(); return; }
    $("#biblioteca-corpo").innerHTML = aba === "loja" ? loja() : estante();

}


function estante() {

    const lista = livros();
    if (!lista.length) {
        return `<p class="biblioteca-vazia">A estante está vazia. Cada plano de estudo vira um livro aqui, com tudo o que você
                estudou, as atividades entregues e as notas.</p>`;
    }

    const prateleira = (titulo, itens) => itens.length ? `
        <h3 class="biblioteca-subtitulo">${titulo}</h3>
        <div class="biblioteca-prateleira">${itens.map((l) => `
            <button type="button" class="biblioteca-livro" data-livro="${l.id}">
                ${capa(l)}
                <small>${l.concluido ? "Concluído" : `${colecao.progresso(l.atual).pct}% estudado`}</small>
            </button>`).join("")}</div>` : "";

    return prateleira("Estudando agora", lista.filter((l) => !l.concluido)) +
           prateleira("Concluídos", lista.filter((l) => l.concluido));

}


/* ---------- um livro: histórico completo ---------- */

async function mostrarLivro() {

    const l = livros().find((x) => x.id === livroAberto);
    if (!l) { livroAberto = null; mostrar(); return; }

    const ids = l.planos.map((p) => p.id);
    const sessoes = dados.sessoes.filter((s) => ids.includes(s.plano_id) && !s.extra && colecao.foiEstudada(s.id))
        .sort((a, b) => a.data.localeCompare(b.data));

    let entregas = [];
    try {
        entregas = (await (await fetch(`./api/estudos/entregas?planos=${ids.join(",")}`)).json()).entregas || [];
    } catch (erro) { /* sem entregas: o resto do livro aparece igual */ }

    const corrigidas = entregas.filter((e) => e.situacao === "corrigida");
    const media = corrigidas.length ? (corrigidas.reduce((s, e) => s + e.nota, 0) / corrigidas.length).toFixed(1) : null;
    const contagem = new Map();
    corrigidas.forEach((e) => (e.correcao?.dificuldades || []).forEach((d) => contagem.set(d, (contagem.get(d) || 0) + 1)));
    const dificuldades = [...contagem].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const daSessao = (sessaoId) => entregas.filter((e) => e.sessao_id === sessaoId ||
        dados.itens.some((i) => i.id === e.item_id && dados.itens.some((o) => o.id === i.origem_id && o.sessao_id === sessaoId)));

    $("#biblioteca-corpo").innerHTML = `
        <button type="button" class="est-link biblioteca-voltar" data-voltar>← Estante</button>

        <div class="biblioteca-livro-topo">
            <div class="biblioteca-capa-grande" id="biblioteca-capa">${capa(l)}</div>
            <div class="biblioteca-livro-info">
                <h3>${esc(l.titulo)}</h3>
                <p class="biblioteca-volumes">${l.planos.map((p) => esc(p.titulo || p.tema)).join(" → ")}</p>
                ${l.concluido ? `<p class="biblioteca-concluido">★ Plano concluído</p>`
                    : `<span class="pets-barra"><span style="width:${colecao.progresso(l.atual).pct}%"></span></span>`}
                <div class="biblioteca-numeros">
                    <span><strong>${sessoes.length}</strong> sessões estudadas</span>
                    <span><strong>${entregas.length}</strong> atividades entregues</span>
                    ${media ? `<span><strong>${media}</strong> nota média</span>` : ""}
                </div>
                ${dificuldades.length ? `<p class="biblioteca-reforcar">Pontos pra reforçar:
                    ${dificuldades.map(([d, n]) => `<span>${esc(d)}${n > 1 ? ` ×${n}` : ""}</span>`).join("")}</p>` : ""}
                ${sessoes.length ? `<button type="button" class="btn-secundario" data-revisar="${sessoes.map((s) => s.id).join(",")}">🃏 Revisar os cartões deste livro</button>` : ""}
            </div>
        </div>

        <details class="biblioteca-personalizar">
            <summary>🎨 Personalizar a capa</summary>
            <div id="biblioteca-editor">${editor(l)}</div>
        </details>

        <h3 class="biblioteca-subtitulo">Histórico</h3>
        ${sessoes.length ? `<ol class="biblioteca-historico">${sessoes.map((s) => `
            <li>
                <div class="biblioteca-dia"><strong>${esc(s.topico)}</strong><small>${dataBonita(s.data)}</small></div>
                <ul>${dados.itens.filter((i) => i.sessao_id === s.id).map((i) => `<li>${i.url
                    ? `<a href="${esc(i.url)}" target="_blank" rel="noopener">${i.tipo === "video" ? "🎥" : "📄"} ${esc(i.titulo)}</a>`
                    : `📝 ${esc(i.descricao || i.titulo)}`}</li>`).join("")}</ul>
                ${daSessao(s.id).map((e) => `
                    <div class="biblioteca-entrega">
                        ${e.situacao === "corrigida" ? `<span class="est-nota est-nota-${e.nota >= 7 ? "boa" : e.nota >= 5 ? "media" : "baixa"}">Nota ${e.nota}/10</span>`
                            : `<span class="est-nota">Entregue</span>`}
                        <span>${esc(e.correcao?.resumo || "Atividade entregue.")}</span>
                    </div>`).join("")}
            </li>`).join("")}</ol>`
            : `<p class="biblioteca-vazia">Ainda nada por aqui: marque ✓ nos itens das sessões e entregue as atividades,
               e tudo fica guardado neste livro.</p>`}`;

}


function editor(l) {
    return Object.entries(PARTES).map(([parte, [catalogo, , nome]]) => {
        const meus = Object.keys(catalogo).filter((id) => colecao.tem(`livro:${parte}:${id}`));
        return meus.length > 1 ? `<span class="pets-rotulo">${nome}</span>
            <div class="pets-opcoes">${meus.map((id) => `<button type="button" class="pets-opcao ${l.livro[parte] === id ? "ativa" : ""}"
                data-parte="${parte}" data-valor="${id}">${esc(catalogo[id].nome)}</button>`).join("")}</div>` : "";
    }).join("") || `<p class="pets-dica">Na <button type="button" class="est-link" data-ir-loja>loja</button> tem capas, margens,
                    títulos gravados, fitilhos e adesivos.</p>`;
}


/* ---------- loja ---------- */

function loja() {

    const saldo = colecao.pontos();
    const modelo = livros()[0] || { titulo: "Meu livro", planos: [{}], atual: { cor: "#c90016" }, livro: normalizarLivro(), concluido: false };
    const [catalogo] = PARTES[secaoLoja];

    return `<p class="pets-dica">Os pontos são os mesmos dos pets: 10 por item feito, 20 por sessão completa e 100 por plano concluído.</p>
        <div class="pets-secoes">${Object.entries(PARTES).map(([parte, [, , nome]]) =>
            `<button type="button" class="pets-opcao ${secaoLoja === parte ? "ativa" : ""}" data-secao="${parte}">${nome}</button>`).join("")}</div>
        <div class="biblioteca-loja">${Object.entries(catalogo).map(([id, item]) => {
            const chave = `livro:${secaoLoja}:${id}`;
            const meu = colecao.tem(chave);
            return `<div class="pets-item ${meu ? "comprado" : ""}">
                <span class="biblioteca-previa">${capa(modelo, { [secaoLoja]: id })}</span>
                <strong>${esc(item.nome)}</strong>
                ${meu ? `<small class="pets-seu">✓ É seu</small>`
                    : `<button type="button" class="btn-primario pets-comprar" data-comprar="${chave}" ${saldo < item.custo ? "disabled" : ""}>⭐ ${item.custo}</button>`}
            </div>`;
        }).join("")}</div>`;

}


/* ---------- cliques ---------- */

modal?.addEventListener("click", (evento) => {

    const alvo = evento.target.closest("button");
    if (!alvo) return;

    if (alvo.hasAttribute("data-fechar")) { modal.close(); return; }
    if (alvo.dataset.aba) { aba = alvo.dataset.aba; livroAberto = null; mostrar(); return; }
    if (alvo.dataset.secao) { secaoLoja = alvo.dataset.secao; mostrar(); return; }
    if (alvo.dataset.livro) { livroAberto = Number(alvo.dataset.livro); mostrar(); return; }
    if (alvo.hasAttribute("data-voltar")) { livroAberto = null; mostrar(); return; }
    if (alvo.hasAttribute("data-ir-loja")) { aba = "loja"; livroAberto = null; mostrar(); return; }

    if (alvo.dataset.comprar) {
        if (colecao.comprar(alvo.dataset.comprar)) mostrar();
        return;
    }

    if (alvo.dataset.parte) {
        const guardados = colecao.livros();
        guardados[livroAberto] = { ...normalizarLivro(guardados[livroAberto]), [alvo.dataset.parte]: alvo.dataset.valor };
        colecao.salvar();
        // redesenha só a capa e o editor, sem perder a rolagem
        const l = livros().find((x) => x.id === livroAberto);
        $("#biblioteca-capa").innerHTML = capa(l);
        $("#biblioteca-editor").innerHTML = editor(l);
        return;
    }

    if (alvo.dataset.revisar) {
        modal.close();
        document.dispatchEvent(new CustomEvent("kaizen:revisar", { detail: { sessoes: alvo.dataset.revisar.split(",").map(Number) } }));
    }

});


document.querySelector("#biblioteca-abrir")?.addEventListener("click", () => {
    colecao = window.kaizenColecao;
    if (colecao) abrir();
});
