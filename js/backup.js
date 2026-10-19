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


if (botaoBaixar && botaoRestaurar && seletorArquivo) {

    botaoBaixar.addEventListener("click", baixar);
    botaoRestaurar.addEventListener("click", () => seletorArquivo.click());
    seletorArquivo.addEventListener("change", restaurar);

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
