/* =========================================================
   CORTE — efeito ao concluir uma tarefa
   ---------------------------------------------------------
   Quando uma tarefa passa a "concluído", ela deve ser
   "cortada" por uma lâmina e selada como finalizada.

   Como os cards são recriados a cada renderização, este
   módulo apenas guarda QUAIS tarefas acabaram de ser
   concluídas. A renderização consulta e aplica o efeito
   uma única vez.
========================================================= */


const pendentes = new Set();
const costuras = new Set();


/*
    Registrado pelas ações (arrastar/menu/editar) no
    momento em que a tarefa vira concluída.
*/
export function marcarCorte(id) {
    pendentes.add(id);
}


/*
    Consumido pela renderização: devolve true uma única
    vez por tarefa recém-concluída.
*/
export function consumirCorte(id) {

    if (pendentes.has(id)) {
        pendentes.delete(id);
        return true;
    }

    return false;
}


/*
    Registrado quando uma tarefa SAI de concluída:
    a próxima renderização toca a animação de costura.
*/
export function marcarCostura(id) {
    costuras.add(id);
}


export function consumirCostura(id) {

    if (costuras.has(id)) {
        costuras.delete(id);
        return true;
    }

    return false;
}
