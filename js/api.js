/* Indica se a aplicação encontrou o servidor SQLite. */
export let servidorDisponivel = false;

export async function carregarTarefas() {

    try {
        const respostaApi = await fetch("./api/tarefas");

        if (respostaApi.ok) {
            const documentoApi = await respostaApi.json();
            if (documentoApi && Array.isArray(documentoApi.tarefas)) {
                servidorDisponivel = true;
                return documentoApi.tarefas;
            }
        }
    } catch (erro) {
        /* O modo estático continua funcionando com dados.json. */
    }

    const resposta =
        await fetch("./dados.json");


    if (!resposta.ok) {

        const erro =
            new Error(
                `Resposta HTTP ${resposta.status}`
            );

        erro.name = "ProtocolError";

        erro.status =
            resposta.status;

        throw erro;

    }


    const documento =
        await resposta.json();


    if (
        typeof documento !== "object" ||
        documento === null ||
        !Array.isArray(documento.tarefas)
    ) {

        throw new SyntaxError(
            "Formato de dados inválido."
        );

    }


    return documento.tarefas;
}

export async function salvarTarefasServidor(tarefas, categorias = []) {
    if (!servidorDisponivel) {
        return false;
    }

    const resposta = await fetch("./api/tarefas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tarefas, categorias })
    });

    if (!resposta.ok) {
        throw new Error(`Falha ao salvar no banco (HTTP ${resposta.status})`);
    }

    return true;
}
