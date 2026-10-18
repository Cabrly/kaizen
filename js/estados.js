import {
    renderizarTarefas
} from "./renderizacao.js";



export function renderizarEstado(
    estado,
    tarefasVisiveis
) {

    const mensagem =
        document.querySelector(
            "[data-estado]"
        );


    const quadro =
        document.querySelector(
            "#quadro"
        );


    /*
        Remove as classes anteriores.
    */
    mensagem.className =
        "estado";


    /*
        CARREGANDO
    */
    if (estado.carregando) {

        mensagem.classList.add(
            "estado-carregando"
        );


        mensagem.textContent =
            "Carregando tarefas...";


        quadro.classList.add(
            "quadro-carregando"
        );


        renderizarTarefas(
            [],
            quadro
        );


        return;

    }


    quadro.classList.remove(
        "quadro-carregando"
    );


    /*
        ERRO
    */
    if (estado.erro !== null) {

        mensagem.classList.add(
            "estado-erro"
        );


        mensagem.textContent =
            estado.erro;


        renderizarTarefas(
            [],
            quadro
        );


        return;

    }


    /*
        ORIGEM VAZIA

        O arquivo foi carregado corretamente,
        mas não possui nenhuma tarefa.
    */
    if (
        estado.tarefas.length === 0
    ) {

        mensagem.classList.add(
            "estado-vazio"
        );


        mensagem.textContent =
            "Nenhuma tarefa cadastrada na fonte de dados.";


        renderizarTarefas(
            [],
            quadro
        );


        return;

    }


    /*
        RESULTADO VAZIO

        Existem tarefas na fonte,
        mas nenhuma corresponde aos
        critérios selecionados.
    */
    if (
        tarefasVisiveis.length === 0
    ) {

        mensagem.classList.add(
            "estado-resultado-vazio"
        );


        mensagem.textContent =
            "Nenhuma tarefa corresponde aos critérios. Altere ou limpe os filtros.";


        renderizarTarefas(
            [],
            quadro
        );


        return;

    }


    /*
        SUCESSO

        A mensagem informa quantas tarefas
        estão aparecendo em relação ao total.
    */
    mensagem.classList.add(
        "estado-sucesso"
    );


    mensagem.textContent =
        `${tarefasVisiveis.length} de ${estado.tarefas.length} tarefas`;


    renderizarTarefas(
        tarefasVisiveis,
        quadro
    );

}