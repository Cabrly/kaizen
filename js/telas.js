/* =========================================================
   TELAS — alterna entre o quadro Kanban e o Assistente IA
   ---------------------------------------------------------
   Duas telas, uma visível por vez. Nenhum recarregamento
   de página: apenas troca de atributos/classe.
========================================================= */


const abas =
    document.querySelectorAll(".nav-tab");


const paineis = {
    kanban: document.querySelector("#tela-kanban"),
    ia: document.querySelector("#tela-ia")
};


const botaoNovaTarefa =
    document.querySelector("#botao-nova-tarefa");


const CHAVE = "kaizen.tela-ativa.v1";


function lembrarTela(nome) {
    try {
        localStorage.setItem(CHAVE, nome);
    } catch (erro) {
        /* nada a fazer */
    }
}


function telaLembrada() {
    try {
        const salva = localStorage.getItem(CHAVE);
        return salva === "ia" ? "ia" : "kanban";
    } catch (erro) {
        return "kanban";
    }
}


function ativarTela(nome) {

    abas.forEach((aba) => {

        const ativa =
            aba.dataset.tela === nome;

        aba.classList.toggle("ativa", ativa);
        aba.setAttribute("aria-selected", String(ativa));

    });


    Object.entries(paineis).forEach(([chave, painel]) => {

        if (!painel) {
            return;
        }

        painel.hidden = chave !== nome;

    });


    /*
        O botão "Nova tarefa" só faz sentido
        dentro do quadro Kanban.
    */
    if (botaoNovaTarefa) {
        botaoNovaTarefa.hidden = nome !== "kanban";
    }


    document.body.classList.toggle("tela-ia-ativa", nome === "ia");


    lembrarTela(nome);

}


abas.forEach((aba) => {

    aba.addEventListener("click", () => {
        ativarTela(aba.dataset.tela);
    });

});


ativarTela(telaLembrada());
