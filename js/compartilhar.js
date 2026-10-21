/* =========================================================
   COMPARTILHAR PLANO — mandar um plano pra turma
   ---------------------------------------------------------
   O plano (roteiro, vídeos, atividades e flashcards, sem o
   progresso de quem mandou) vai cifrado pro mesmo servidor
   da sincronia, num cofre com nome e chave sorteados. O
   link leva os dois: .../#plano=<cofre>.<chave>. Quem abre
   escolhe os dias e a data de início, e o plano vira um
   plano novo dele (/api/estudos/importar-plano).
========================================================= */

import qrcode from "./vendor/qrcode.js";
import { servidor, enderecoApp, hex, paraBase64, deBase64, cifrar, decifrar } from "./cofre.js";


const CHAVE_LINKS = "kaizen.compartilhados.v1";   // {planoId: {cofre, chave}}: o link volta igual

const compartilhar = document.querySelector("#comp-modal");
const importar = document.querySelector("#imp-modal");

const $ = (id) => document.querySelector(`#${id}`);


let pacoteRecebido = null;



/* ---------- base64 de link (sem + / =) ---------- */

const paraLink = (bytes) => paraBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const deLink = (texto) => deBase64(texto.replace(/-/g, "+").replace(/_/g, "/"));


async function chaveDe(bruta) {
    return crypto.subtle.importKey("raw", bruta, "AES-GCM", false, ["encrypt", "decrypt"]);
}


function lerLinks() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE_LINKS) || "{}");
    } catch (erro) {
        return {};
    }
}


function gravarLinks(links) {
    try {
        localStorage.setItem(CHAVE_LINKS, JSON.stringify(links));
    } catch (erro) {
        /* sem localStorage o link só não é reaproveitado */
    }
}


function linkDe({ cofre, chave }) {
    return `${enderecoApp()}#plano=${cofre}.${chave}`;
}


async function api(caminho, opcoes = {}) {
    const resposta = await fetch(`./api${caminho}`, {
        ...opcoes, headers: { "Content-Type": "application/json", ...(opcoes.headers || {}) }
    });
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados.erro || `HTTP ${resposta.status}`);
    return dados;
}


async function cofreRemoto(metodo, cofre, corpo) {
    const resposta = await fetch(`${servidor()}/v1/cofre/${cofre}`, {
        method: metodo,
        headers: corpo ? { "Content-Type": "application/json" } : {},
        body: corpo ? JSON.stringify(corpo) : undefined
    });
    const dados = await resposta.json().catch(() => ({}));
    if (resposta.status === 404) throw new Error("Esse link não existe mais (a pessoa parou de compartilhar ou passou de 1 ano).");
    if (!resposta.ok) throw new Error(dados.erro || `O servidor respondeu ${resposta.status}.`);
    return dados;
}



/* ---------- quem manda ---------- */

/* O plano como ele vai no link: sem ids, sem estado, sem as cópias do "não fiz". */
async function montarPacote(planoId) {

    const { estudos } = await api("/backup?leve=1");
    const plano = estudos.planos.find((p) => p.id === planoId);

    if (!plano) throw new Error("Não achei esse plano.");

    const sessoes = estudos.sessoes
        .filter((s) => s.plano_id === planoId && !s.extra)
        .sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id);

    return {
        app: "kaizen-plano", formato: 1,
        tema: plano.tema, titulo: plano.titulo, doc_oficial: plano.doc_oficial, idioma: plano.idioma,
        minutos: plano.minutos, dias: plano.dias, horario: plano.horario,
        sessoes: sessoes.map((s) => ({
            topico: s.topico,
            objetivo: s.objetivo,
            itens: estudos.itens
                .filter((i) => i.sessao_id === s.id && !i.origem_id)
                .map(({ tipo, titulo, url, descricao, fonte, minutos }) => ({ tipo, titulo, url, descricao, fonte, minutos })),
            cartoes: (estudos.flashcards || [])
                .filter((f) => f.sessao_id === s.id)
                .map(({ frente, verso }) => ({ frente, verso }))
        }))
    };

}


async function abrirCompartilhar(planoId, nome) {

    $("comp-nome").textContent = nome;
    $("comp-pronto").hidden = true;
    $("comp-status").textContent = "Preparando o link…";
    compartilhar.dataset.plano = planoId;
    compartilhar.showModal();

    try {

        const links = lerLinks();
        let guardado = links[planoId];

        if (!guardado) {
            const bruta = crypto.getRandomValues(new Uint8Array(16));
            const cofre = hex(crypto.getRandomValues(new Uint8Array(16)));
            await cofreRemoto("PUT", cofre, { base: 0, dados: await cifrar(await chaveDe(bruta), await montarPacote(planoId)) });
            guardado = { cofre, chave: paraLink(bruta) };
            gravarLinks({ ...lerLinks(), [planoId]: guardado });
            document.dispatchEvent(new CustomEvent("kaizen:uso", { detail: "plano_compartilhado" }));
        }

        mostrarLink(linkDe(guardado), nome);

    } catch (erro) {

        $("comp-status").textContent = `Não deu pra gerar o link: ${erro.message}`;

    }

}


function mostrarLink(link, nome) {

    const qr = qrcode(0, "M");
    qr.addData(link);
    qr.make();

    $("comp-qr").innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    $("comp-link").value = link;
    $("comp-enviar").hidden = !navigator.share;
    $("comp-enviar").onclick = () => navigator.share({
        title: `Plano de estudos: ${nome}`,
        text: `Te mandei meu plano de ${nome} no Kaizen. Abre aí:`,
        url: link
    }).catch(() => {});
    $("comp-status").textContent = "";
    $("comp-pronto").hidden = false;

}


async function pararDeCompartilhar() {

    const planoId = compartilhar.dataset.plano;
    const guardado = lerLinks()[planoId];

    if (!guardado || !confirm("Parar de compartilhar? O link deixa de funcionar (quem já abriu continua com a cópia).")) return;

    try {
        await cofreRemoto("DELETE", guardado.cofre);
    } catch (erro) {
        if (!/não existe mais/.test(erro.message)) {
            alert(`Não deu: ${erro.message}`);
            return;
        }
    }

    const links = lerLinks();
    delete links[planoId];
    gravarLinks(links);
    compartilhar.close();

}



/* ---------- quem recebe ---------- */

function lerDoLink(texto) {
    const achado = String(texto || "").match(/#plano=([a-f0-9]{32})\.([A-Za-z0-9_-]{20,})/);
    return achado ? { cofre: achado[1], chave: achado[2] } : null;
}


function hojeIso() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}


function abrirImportar(link = "") {

    pacoteRecebido = null;
    $("imp-link").value = link;
    $("imp-campo-link").hidden = false;
    $("imp-previa").hidden = true;
    $("imp-erro").textContent = "";
    $("imp-enviar").textContent = "Abrir plano";
    importar.showModal();

    if (link) carregarPacote();

}


async function carregarPacote() {

    const alvo = lerDoLink($("imp-link").value);

    if (!alvo) {
        $("imp-erro").textContent = "Esse não parece um link de plano do Kaizen (ele tem \"#plano=\").";
        return;
    }

    $("imp-erro").textContent = "";
    $("imp-enviar").disabled = true;
    $("imp-enviar").textContent = "Abrindo…";

    try {

        const cofre = await cofreRemoto("GET", alvo.cofre);
        let pacote;
        try {
            pacote = await decifrar(await chaveDe(deLink(alvo.chave)), cofre.dados);
        } catch (erro) {
            throw new Error("O link veio cortado ou errado. Peça pra pessoa mandar de novo.");
        }
        if (pacote?.app !== "kaizen-plano") throw new Error("Isso não é um plano do Kaizen.");

        pacoteRecebido = pacote;
        mostrarPrevia(pacote);

    } catch (erro) {

        $("imp-erro").textContent = erro.message;
        $("imp-enviar").textContent = "Abrir plano";

    } finally {

        $("imp-enviar").disabled = false;

    }

}


function mostrarPrevia(pacote) {

    const materiais = pacote.sessoes.reduce((soma, s) => soma + s.itens.filter((i) => i.tipo !== "atividade").length, 0);
    const atividades = pacote.sessoes.reduce((soma, s) => soma + s.itens.filter((i) => i.tipo === "atividade").length, 0);
    const cartoes = pacote.sessoes.reduce((soma, s) => soma + (s.cartoes?.length || 0), 0);
    const nome = document.createElement("strong");

    nome.textContent = pacote.titulo || pacote.tema;
    const contar = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
    $("imp-resumo").replaceChildren(nome, ` · ${contar(pacote.sessoes.length, "sessão", "sessões")}, ` +
        `${contar(materiais, "vídeo ou página", "vídeos e páginas")}, ${contar(atividades, "atividade", "atividades")}` +
        `${cartoes ? ` e ${contar(cartoes, "flashcard", "flashcards")}. Os flashcards de cada sessão entram na sua ` +
        "revisão quando você estudar ela." : "."}`);

    importar.querySelectorAll("#imp-dias .est-chip").forEach((chip) =>
        chip.classList.toggle("ativo", (pacote.dias || []).includes(Number(chip.dataset.valor))));
    $("imp-inicio").value = hojeIso();
    $("imp-horario").value = pacote.horario || "";

    $("imp-campo-link").hidden = true;
    $("imp-previa").hidden = false;
    $("imp-enviar").textContent = "Adicionar aos meus estudos";

}


async function adicionar() {

    const dias = [...importar.querySelectorAll("#imp-dias .est-chip.ativo")].map((c) => Number(c.dataset.valor));

    if (!dias.length) {
        $("imp-erro").textContent = "Escolha pelo menos um dia.";
        return;
    }

    $("imp-enviar").disabled = true;

    try {

        await api("/estudos/importar-plano", {
            method: "POST",
            body: JSON.stringify({ plano: pacoteRecebido, dias, inicio: $("imp-inicio").value, horario: $("imp-horario").value })
        });

        importar.close();
        document.querySelector('.nav-tab[data-tela="estudos"]')?.click();
        document.dispatchEvent(new CustomEvent("kaizen:recarregar-estudos"));

    } catch (erro) {

        $("imp-erro").textContent = `Não deu pra adicionar: ${erro.message}`;

    } finally {

        $("imp-enviar").disabled = false;

    }

}



/* ---------- ligações ---------- */

if (compartilhar && importar) {

    [compartilhar, importar].forEach((modal) =>
        modal.querySelectorAll("[data-fechar]").forEach((botao) => botao.addEventListener("click", () => modal.close())));

    document.querySelector("#est-planos")?.addEventListener("click", (evento) => {
        const botao = evento.target.closest("[data-compartilhar-plano]");
        if (botao) abrirCompartilhar(Number(botao.dataset.compartilharPlano), botao.closest(".est-plano").querySelector("h3").textContent);
    });

    $("comp-copiar").addEventListener("click", async (evento) => {
        try {
            await navigator.clipboard.writeText($("comp-link").value);
            evento.currentTarget.textContent = "Link copiado!";
            setTimeout(() => ($("comp-copiar").textContent = "Copiar link"), 2000);
        } catch (erro) {
            $("comp-link").select();
        }
    });

    $("comp-parar").addEventListener("click", pararDeCompartilhar);

    $("imp-abrir")?.addEventListener("click", () => {
        document.querySelector("#est-assistente")?.close();
        abrirImportar();
    });

    importar.querySelector("#imp-dias").addEventListener("click", (evento) =>
        evento.target.closest(".est-chip")?.classList.toggle("ativo"));

    $("imp-form").addEventListener("submit", (evento) => {
        evento.preventDefault();
        if (pacoteRecebido) adicionar();
        else carregarPacote();
    });

    // link aberto: .../#plano=cofre.chave (sai da barra de endereço na hora)
    if (lerDoLink(location.hash)) {
        const link = location.href;
        history.replaceState(null, "", location.pathname + location.search);
        window.kaizenModo.then(() => abrirImportar(link));
    }

}
