/* =========================================================
   AÇÕES — torna o Kanban interativo
   ---------------------------------------------------------
   Reúne todas as operações que alteram as tarefas:

     • arrastar e soltar entre colunas (e reordenar);
     • criar tarefa (cabeçalho e botão de cada coluna);
     • editar e excluir pelo menu ••• do card;
     • mover pelo menu (funciona no toque e no teclado).

   Nada aqui consulta filtros: apenas altera estado.tarefas
   e chama aoAlterar(), mantendo o fluxo
   estado → derivação → renderização do main.js.

   JS puro, sem bibliotecas.
========================================================= */


import {
    marcarCorte,
    marcarCostura
} from "./corte.js";


/* Colunas do quadro, na ordem. */
const STATUS = [
    { valor: "a-fazer", nome: "A fazer" },
    { valor: "em-andamento", nome: "Em andamento" },
    { valor: "em-revisao", nome: "Em revisão" },
    { valor: "concluido", nome: "Concluído" }
];


const PRIORIDADES = [
    { valor: "alta", nome: "Alta" },
    { valor: "media", nome: "Média" },
    { valor: "baixa", nome: "Baixa" }
];


/*
    Ponto de entrada.
    Recebe o estado (fonte única) e o callback
    aoAlterar(), que persiste e re-renderiza.
*/
export function iniciarAcoes({ estado, aoAlterar }) {

    const quadro =
        document.querySelector("#quadro");

    const botaoNova =
        document.querySelector(".add-task");

    /* Constrói o modal uma única vez. */
    const modal = criarModal();


    /* ---------- helpers de dados ---------- */

    function gerarId() {

        if (
            window.crypto &&
            typeof window.crypto.randomUUID === "function"
        ) {
            return "t-" + window.crypto.randomUUID().slice(0, 8);
        }

        return "t-" + Date.now().toString(36);
    }


    function encontrarIndice(id) {
        return estado.tarefas.findIndex(
            (tarefa) => tarefa.id === id
        );
    }


    function criarTarefa(dados) {

        const id = gerarId();

        estado.tarefas.push({
            id: id,
            titulo: dados.titulo,
            status: dados.status,
            prioridade: dados.prioridade,
            categoria: dados.categoria,
            prazo: dados.prazo
        });

        /* Nasceu já concluída? Também recebe o corte. */
        if (dados.status === "concluido") {
            marcarCorte(id);
        }

        aoAlterar();
    }


    function atualizarTarefa(id, dados) {

        const i = encontrarIndice(id);

        if (i === -1) {
            return;
        }

        /* Virou concluída agora? Marca para o corte. */
        if (
            dados.status === "concluido" &&
            estado.tarefas[i].status !== "concluido"
        ) {
            marcarCorte(id);
        }

        /* Saiu de concluída? Marca para a costura. */
        if (
            estado.tarefas[i].status === "concluido" &&
            dados.status !== "concluido"
        ) {
            marcarCostura(id);
        }

        estado.tarefas[i] = {
            ...estado.tarefas[i],
            ...dados
        };

        aoAlterar();
    }


    function excluirTarefa(id) {

        const i = encontrarIndice(id);

        if (i === -1) {
            return;
        }

        estado.tarefas.splice(i, 1);

        aoAlterar();
    }


    /*
        Move a tarefa para outra coluna e, opcionalmente,
        a reposiciona antes de outra tarefa (reordenação).
    */
    function moverTarefa(id, novoStatus, idReferencia) {

        const i = encontrarIndice(id);

        if (i === -1) {
            return;
        }

        /* Retira a tarefa do array. */
        const [tarefa] = estado.tarefas.splice(i, 1);

        /* Entrou em concluído agora? Marca para o corte. */
        if (
            novoStatus === "concluido" &&
            tarefa.status !== "concluido"
        ) {
            marcarCorte(id);
        }

        /* Saiu de concluído? Marca para a costura. */
        if (
            tarefa.status === "concluido" &&
            novoStatus !== "concluido"
        ) {
            marcarCostura(id);
        }

        tarefa.status = novoStatus;

        /* Descobre onde reinserir. */
        let destino = estado.tarefas.length;

        if (idReferencia) {

            const ref = encontrarIndice(idReferencia);

            if (ref !== -1) {
                destino = ref;
            }
        }

        estado.tarefas.splice(destino, 0, tarefa);

        aoAlterar();
    }


    /* ================================================
       ARRASTAR E SOLTAR
    ================================================ */

    let idArrastado = null;


    quadro.addEventListener("dragstart", (evento) => {

        const card = evento.target.closest(".task");

        if (!card) {
            return;
        }

        idArrastado = card.dataset.id;

        card.classList.add("arrastando");

        evento.dataTransfer.effectAllowed = "move";

        /* Necessário no Firefox para iniciar o arrasto. */
        evento.dataTransfer.setData("text/plain", idArrastado);
    });


    quadro.addEventListener("dragend", (evento) => {

        const card = evento.target.closest(".task");

        if (card) {
            card.classList.remove("arrastando");
        }

        idArrastado = null;

        limparRealces();
    });


    function limparRealces() {

        quadro
            .querySelectorAll(".solto-ativo")
            .forEach((alvo) =>
                alvo.classList.remove("solto-ativo")
            );
    }


    /*
        A coluna inteira recebe o card, não só a faixa
        interna das tarefas: soltar no título, no vazio
        ou perto do botão "+ Adicionar" também move.
    */
    function areaDoAlvo(evento) {

        const coluna = evento.target.closest("[data-coluna]");

        return coluna
            ? coluna.querySelector("[data-tarefas]")
            : null;
    }


    /*
        Descobre antes de qual card o item deve entrar,
        comparando a posição vertical do cursor com o
        meio de cada card já presente na coluna.
    */
    function cardDeReferencia(area, y) {

        const cards = [
            ...area.querySelectorAll(".task:not(.arrastando)")
        ];

        for (const card of cards) {

            const caixa = card.getBoundingClientRect();
            const meio = caixa.top + caixa.height / 2;

            if (y < meio) {
                return card;
            }
        }

        return null;
    }


    quadro.addEventListener("dragover", (evento) => {

        const area = areaDoAlvo(evento);

        if (!area || !idArrastado) {
            return;
        }

        /* Permite o "drop". */
        evento.preventDefault();

        evento.dataTransfer.dropEffect = "move";

        limparRealces();

        area.classList.add("solto-ativo");
        area.closest("[data-coluna]").classList.add("solto-ativo");
    });


    quadro.addEventListener("drop", (evento) => {

        const area = areaDoAlvo(evento);

        if (!area || !idArrastado) {
            return;
        }

        evento.preventDefault();

        const novoStatus = area.dataset.tarefas;

        const ref = cardDeReferencia(area, evento.clientY);

        const idReferencia = ref ? ref.dataset.id : null;

        /* Evita usar a própria tarefa como referência. */
        if (idReferencia !== idArrastado) {
            moverTarefa(idArrastado, novoStatus, idReferencia);
        }

        limparRealces();

        idArrastado = null;
    });


    /* ================================================
       MENU ••• DO CARD
    ================================================ */

    let menuAberto = null;


    function fecharMenu() {

        if (menuAberto) {
            menuAberto.remove();
            menuAberto = null;
        }
    }


    document.addEventListener("click", (evento) => {

        const botaoMenu = evento.target.closest(".menu");

        /* Clique fora → fecha qualquer menu. */
        if (!botaoMenu) {

            if (
                menuAberto &&
                !evento.target.closest(".menu-tarefa")
            ) {
                fecharMenu();
            }

            return;
        }

        evento.stopPropagation();

        const card = botaoMenu.closest(".task");

        if (!card) {
            return;
        }

        const id = card.dataset.id;

        /* Alterna: se já estava aberto neste card, fecha. */
        if (menuAberto && menuAberto.dataset.id === id) {
            fecharMenu();
            return;
        }

        fecharMenu();

        menuAberto = construirMenu(id);

        posicionarMenu(menuAberto, botaoMenu);

        document.body.appendChild(menuAberto);
    });


    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape") {
            fecharMenu();
        }
    });


    window.addEventListener("scroll", fecharMenu, true);


    function construirMenu(id) {

        const tarefa =
            estado.tarefas[encontrarIndice(id)];

        const menu = document.createElement("div");

        menu.className = "menu-tarefa";
        menu.dataset.id = id;


        /* Editar */
        const editar = itemMenu("✎  Editar");

        editar.addEventListener("click", () => {
            fecharMenu();
            abrirModal("editar", tarefa);
        });


        /* Excluir */
        const excluir = itemMenu("🗑  Excluir");

        excluir.classList.add("perigo");

        excluir.addEventListener("click", () => {
            fecharMenu();
            excluirTarefa(id);
        });


        menu.append(editar, excluir, separador());


        /* Mover para… */
        const rotulo = document.createElement("span");
        rotulo.className = "menu-rotulo";
        rotulo.textContent = "Mover para";
        menu.append(rotulo);

        STATUS.forEach((s) => {

            const opcao = itemMenu(s.nome);

            if (tarefa && tarefa.status === s.valor) {
                opcao.classList.add("atual");
                opcao.textContent = "• " + s.nome;
            }

            opcao.addEventListener("click", () => {
                fecharMenu();

                if (!tarefa || tarefa.status !== s.valor) {
                    moverTarefa(id, s.valor, null);
                }
            });

            menu.append(opcao);
        });

        return menu;
    }


    function itemMenu(texto) {

        const botao = document.createElement("button");

        botao.type = "button";
        botao.className = "menu-item";
        botao.textContent = texto;

        return botao;
    }


    function separador() {

        const linha = document.createElement("div");
        linha.className = "menu-sep";

        return linha;
    }


    function posicionarMenu(menu, botao) {

        const caixa = botao.getBoundingClientRect();

        /* Abre logo abaixo do botão, alinhado à direita. */
        menu.style.position = "fixed";
        menu.style.top = `${caixa.bottom + 6}px`;

        /*
            Garante que não vaze pela direita da tela.
            Como a largura só é conhecida após inserir,
            usamos um recuo fixo seguro a partir do botão.
        */
        menu.style.left = `${Math.max(8, caixa.right - 180)}px`;
    }


    /* ================================================
       MODAL (criar / editar)
    ================================================ */

    /*
        Guarda o modo atual e o id em edição
        para o submit saber o que fazer.
    */
    let modoAtual = "criar";
    let idEmEdicao = null;


    function abrirModal(modo, tarefa) {

        modoAtual = modo;
        idEmEdicao = tarefa ? tarefa.id : null;

        const form = modal.querySelector("form");

        modal.querySelector(".modal-titulo").textContent =
            modo === "editar" ? "Editar tarefa" : "Nova tarefa";

        form.titulo.value = tarefa ? tarefa.titulo : "";

        form.status.value =
            tarefa ? tarefa.status : "a-fazer";

        form.prioridade.value =
            tarefa ? tarefa.prioridade : "media";

        atualizarOpcoesCategorias(form);
        form.categoria.value = tarefa ? (tarefa.categoria || "Geral") : "Geral";

        form.prazo.value =
            tarefa ? tarefa.prazo : hoje();

        if (typeof modal.showModal === "function") {
            modal.showModal();
        } else {
            modal.setAttribute("open", "");
        }

        /* Foca o título para digitar de imediato. */
        form.titulo.focus();
    }


    function hoje() {

        const d = new Date();

        const mes =
            String(d.getMonth() + 1).padStart(2, "0");

        const dia =
            String(d.getDate()).padStart(2, "0");

        return `${d.getFullYear()}-${mes}-${dia}`;
    }


    function criarModal() {

        const dialog = document.createElement("dialog");

        dialog.className = "modal";


        const form = document.createElement("form");
        form.noValidate = false;


        form.innerHTML = `
            <h3 class="modal-titulo">Nova tarefa</h3>

            <label class="campo-modal">
                <span>Título</span>
                <input
                    name="titulo"
                    type="text"
                    maxlength="80"
                    required
                    placeholder="Ex.: Revisar acessibilidade"
                    autocomplete="off"
                >
            </label>

            <label class="campo-modal">
                <span>Status</span>
                <select name="status">
                    ${STATUS.map(
                        (s) =>
                            `<option value="${s.valor}">${s.nome}</option>`
                    ).join("")}
                </select>
            </label>

            <label class="campo-modal">
                <span>Prioridade</span>
                <select name="prioridade">
                    ${PRIORIDADES.map(
                        (p) =>
                            `<option value="${p.valor}">${p.nome}</option>`
                    ).join("")}
                </select>
            </label>

            <label class="campo-modal">
                <span>Categoria</span>
                <select
                    name="categoria"
                    required
                ></select>
            </label>

            <label class="campo-modal">
                <span>Prazo</span>
                <input name="prazo" type="date" required>
            </label>

            <div class="form-acoes">
                <button type="button" class="btn-secundario" data-cancelar>
                    Cancelar
                </button>
                <button type="submit" class="btn-primario">
                    Salvar
                </button>
            </div>
        `;


        dialog.appendChild(form);
        document.body.appendChild(dialog);


        /* Cancelar. */
        form
            .querySelector("[data-cancelar]")
            .addEventListener("click", () => fecharModal(dialog));


        /* Fecha ao clicar no fundo escuro. */
        dialog.addEventListener("click", (evento) => {
            if (evento.target === dialog) {
                fecharModal(dialog);
            }
        });


        /* Submit → cria ou edita. */
        form.addEventListener("submit", (evento) => {

            evento.preventDefault();

            const dados = {
                titulo: form.titulo.value.trim(),
                status: form.status.value,
                prioridade: form.prioridade.value,
                categoria: form.categoria.value.trim(),
                prazo: form.prazo.value
            };

            if (dados.titulo === "" || dados.categoria === "" || dados.prazo === "") {
                return;
            }

            if (modoAtual === "editar" && idEmEdicao) {
                atualizarTarefa(idEmEdicao, dados);
            } else {
                criarTarefa(dados);
            }

            fecharModal(dialog);
        });


        return dialog;
    }


    function atualizarOpcoesCategorias(form) {
        const campo = form.categoria;
        const categorias = [...new Set([
            ...estado.categorias,
            ...estado.tarefas.map((tarefa) => tarefa.categoria || "Geral")
        ])].sort((a, b) => a.localeCompare(b, "pt-BR"));
        const select = document.createElement("select");
        select.name = "categoria";
        select.required = true;
        select.innerHTML = categorias.map((categoria) => `<option value="${categoria.replaceAll('"', '&quot;')}">${categoria}</option>`).join("");
        campo.replaceWith(select);
    }


    function fecharModal(dialog) {

        if (typeof dialog.close === "function") {
            dialog.close();
        } else {
            dialog.removeAttribute("open");
        }
    }


    /* ================================================
       BOTÕES DE "ADICIONAR"
    ================================================ */

    /* Cabeçalho → nova tarefa (coluna padrão A fazer). */
    if (botaoNova) {
        botaoNova.addEventListener("click", () => {
            abrirModal("criar", null);
        });
    }


    /*
        Botão "+ Adicionar tarefa" de cada coluna.
        Pré-seleciona o status daquela coluna.
    */
    quadro.addEventListener("click", (evento) => {

        const botao = evento.target.closest(".add-column-task");

        if (!botao) {
            return;
        }

        const coluna = botao.closest("[data-coluna]");

        const status =
            coluna ? coluna.dataset.coluna : "a-fazer";

        abrirModal("criar", {
            titulo: "",
            status: status,
            prioridade: "media",
            categoria: "Geral",
            prazo: hoje()
        });

        /* Corrige o id: acima passamos um "molde", não uma tarefa real. */
        idEmEdicao = null;
        modoAtual = "criar";
    });
}
