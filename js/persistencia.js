/* =========================================================
   PERSISTÊNCIA — guarda as tarefas no navegador
   ---------------------------------------------------------
   Salva o array de tarefas no localStorage para que as
   alterações (mover, criar, editar, excluir) sobrevivam ao
   recarregar a página. O dados.json continua servindo apenas
   como semente na primeira execução.
========================================================= */


const CHAVE = "kaizen.tarefas.v1";
const CHAVE_CATEGORIAS = "kaizen.categorias.v1";

/*
    O localStorage é a base local do aplicativo: ele sobrevive a
    recarregamentos e ao fechamento do navegador. A validação evita que
    um valor salvo por engano impeça o quadro de iniciar.
*/
function tarefaValida(tarefa) {
    return tarefa &&
        typeof tarefa === "object" &&
        typeof tarefa.id === "string" &&
        typeof tarefa.titulo === "string" &&
        typeof tarefa.status === "string" &&
        typeof tarefa.prioridade === "string" &&
        typeof tarefa.prazo === "string";
}


/*
    Devolve as tarefas salvas ou null
    (quando nunca houve nada salvo, ou
    o conteúdo está corrompido).
*/
export function carregarSalvo() {

    let bruto = null;

    try {
        bruto = localStorage.getItem(CHAVE);
    } catch (erro) {
        /* localStorage bloqueado (ex.: aba privada). */
        return null;
    }

    if (!bruto) {
        return null;
    }

    try {

        const dados = JSON.parse(bruto);

        if (Array.isArray(dados) && dados.every(tarefaValida)) {
            return dados.map((tarefa) => ({
                ...tarefa,
                categoria: typeof tarefa.categoria === "string" && tarefa.categoria.trim()
                    ? tarefa.categoria.trim()
                    : "Geral"
            }));
        }

    } catch (erro) {
        /* JSON inválido → ignora e recomeça da semente. */
        return null;
    }

    return null;
}


/*
    Grava o array de tarefas e informa se o navegador aceitou a gravação.
*/
export function salvar(tarefas) {

    try {

        localStorage.setItem(
            CHAVE,
            JSON.stringify(tarefas)
        );

        return true;

    } catch (erro) {
        /* Sem espaço ou bloqueado: o chamador pode informar o usuário. */
        return false;
    }
}

export function carregarCategorias() {
    try {
        const dados = JSON.parse(localStorage.getItem(CHAVE_CATEGORIAS) || "[]");
        return Array.isArray(dados) ? dados.filter((item) => typeof item === "string" && item.trim()) : [];
    } catch (erro) {
        return [];
    }
}

export function salvarCategorias(categorias) {
    try {
        localStorage.setItem(CHAVE_CATEGORIAS, JSON.stringify([...new Set(categorias)]));
        return true;
    } catch (erro) {
        return false;
    }
}


/*
    Limpa o armazenamento (usado por um eventual
    botão de "restaurar exemplo").
*/
export function limparSalvo() {

    try {
        localStorage.removeItem(CHAVE);
    } catch (erro) {
        /* nada a fazer */
    }
}
