/* Ajustes só do celular: os filtros de tarefas começam recolhidos (o botão de adicionar fica à vista). */

const caixa = document.querySelector("#filtros-caixa");
const celular = window.matchMedia("(max-width: 700px)");

if (caixa) {
    const ajustar = () => { caixa.open = !celular.matches; };
    ajustar();
    celular.addEventListener("change", ajustar);
}
