/* =========================================================
   BACKUP — baixar e restaurar tudo num arquivo
   ---------------------------------------------------------
   Tarefas do kanban + planos de estudo (com o que foi feito).
   O formato é o mesmo no PC e no celular: dá pra fazer o
   backup num e restaurar no outro. Chaves de IA não vão no
   arquivo — no aparelho novo, é só conectar de novo.
========================================================= */


const botaoBaixar = document.querySelector("#backup-baixar");
const botaoRestaurar = document.querySelector("#backup-restaurar");
const seletorArquivo = document.querySelector("#backup-arquivo");
const botaoCopias = document.querySelector("#backup-copias");


if (botaoBaixar && botaoRestaurar && seletorArquivo) {

    botaoBaixar.addEventListener("click", baixar);
    botaoRestaurar.addEventListener("click", () => seletorArquivo.click());
    seletorArquivo.addEventListener("change", restaurar);

}

// As cópias automáticas são do server.py (PC e app de computador): no celular e no site não existem
if (botaoCopias) {
    window.kaizenModo?.then((modo) => {
        if (modo !== "servidor") return;
        botaoCopias.hidden = false;
        botaoCopias.addEventListener("click", abrirCopias);
    });
}



function hojeIso() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}


async function baixar() {

    try {

        const resposta = await fetch("./api/backup");

        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

        const dados = await resposta.json();
        const arquivo = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
        const link = document.createElement("a");

        link.href = URL.createObjectURL(arquivo);
        link.download = `kaizen-backup-${hojeIso()}.json`;
        document.body.append(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(link.href), 10000);

    } catch (erro) {

        alert(`Não consegui gerar o backup: ${erro.message}`);

    }

}


function quando(iso) {
    return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}


async function abrirCopias() {

    let copias;
    try {
        const resposta = await fetch("./api/copias", { cache: "no-store" });
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
        copias = (await resposta.json()).copias;
    } catch (erro) {
        alert(`Não consegui ler as cópias: ${erro.message}`);
        return;
    }

    const dialogo = document.createElement("dialog");
    dialogo.className = "modal copias";
    dialogo.innerHTML = `
        <h2 class="modal-titulo">Cópias automáticas</h2>
        <p class="sinc-texto">O Kaizen guarda uma cópia dos seus dados neste computador uma vez por dia, e antes de
            restaurar um backup, de sincronizar ou de excluir um plano. Escolha uma pra voltar a como estava.</p>
        <ul class="copias-lista"></ul>
        <div class="modal-acoes"><button type="button" class="btn-secundario" data-fechar>Fechar</button></div>`;

    const lista = dialogo.querySelector(".copias-lista");

    if (!copias.length) {
        lista.innerHTML = `<li class="copias-vazia">Ainda não há cópias. A primeira sai daqui a pouco.</li>`;
    }

    copias.forEach((c) => {
        const item = document.createElement("li");
        const texto = document.createElement("span");
        const titulo = document.createElement("strong");
        titulo.textContent = quando(c.quando);
        const detalhe = document.createElement("small");
        detalhe.textContent = `${c.motivo} · ${c.planos} plano(s), ${c.tarefas} tarefa(s)`;
        texto.append(titulo, detalhe);
        const voltar = document.createElement("button");
        voltar.type = "button";
        voltar.className = "btn-secundario";
        voltar.textContent = "Voltar a esta";
        voltar.addEventListener("click", () => voltarA(c, dialogo));
        item.append(texto, voltar);
        lista.append(item);
    });

    dialogo.querySelector("[data-fechar]").addEventListener("click", () => dialogo.close());
    dialogo.addEventListener("close", () => dialogo.remove());
    document.body.append(dialogo);
    dialogo.showModal();

}


async function voltarA(copia, dialogo) {

    if (!confirm(`Voltar à cópia de ${quando(copia.quando)}?

` +
                 `${copia.planos} plano(s) de estudo e ${copia.tarefas} tarefa(s).
` +
                 "O que está aqui agora também é guardado numa cópia antes, então dá pra desfazer.")) return;

    try {
        const resposta = await fetch(`./api/copias/${encodeURIComponent(copia.nome)}/restaurar`, { method: "POST" });
        const resultado = await resposta.json().catch(() => ({}));
        if (!resposta.ok) throw new Error(resultado.erro || `HTTP ${resposta.status}`);
        dialogo.close();
        location.reload();
    } catch (erro) {
        alert(erro.message);
    }

}


async function restaurar() {

    const arquivo = seletorArquivo.files[0];
    seletorArquivo.value = "";  // deixa escolher o mesmo arquivo de novo depois

    if (!arquivo) return;


    let dados;

    try {
        dados = JSON.parse(await arquivo.text());
    } catch (erro) {
        alert("Esse arquivo não é um backup do Kaizen (não consegui ler).");
        return;
    }

    if (dados?.app !== "kaizen") {
        alert("Esse arquivo não é um backup do Kaizen.");
        return;
    }


    const tarefas = dados.kanban?.tarefas?.length || 0;
    const planos = dados.estudos?.planos?.length || 0;
    const quando = String(dados.criado_em || "").slice(0, 10).split("-").reverse().join("/") || "data desconhecida";

    const confirmou = confirm(
        `Restaurar o backup de ${quando}?\n\n` +
        `${tarefas} tarefa(s) e ${planos} plano(s) de estudo.\n` +
        "Isso SUBSTITUI as tarefas e os planos que estão neste aparelho.");

    if (!confirmou) return;


    try {

        const resposta = await fetch("./api/backup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json().catch(() => ({}));

        if (!resposta.ok) throw new Error(resultado.erro || `HTTP ${resposta.status}`);

        location.reload();

    } catch (erro) {

        alert(`Não consegui restaurar: ${erro.message}`);

    }

}
