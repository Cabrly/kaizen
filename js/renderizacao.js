import {
    atualizarFundo
} from "./fundo.js";


import {
    consumirCorte,
    consumirCostura
} from "./corte.js";


export function renderizarTarefas(
    tarefas,
    quadro
) {

    const areas =
        quadro.querySelectorAll(
            "[data-tarefas]"
        );


    areas.forEach((area) => {

        area.replaceChildren();

    });


    tarefas.forEach((tarefa) => {

        const area =
            quadro.querySelector(
                `[data-tarefas="${tarefa.status}"]`
            );


        if (!area) {
            return;
        }


        const artigo =
            document.createElement(
                "article"
            );


        artigo.classList.add(
            "task"
        );


        /*
            Identidade e arraste do card.
            O id liga o card à tarefa no estado;
            draggable habilita o arrastar nativo.
        */
        artigo.dataset.id = tarefa.id;

        artigo.draggable = true;


        if (
            tarefa.status ===
            "em-andamento"
        ) {

            artigo.classList.add(
                "active"
            );

        }


        if (
            tarefa.status ===
            "concluido"
        ) {

            artigo.classList.add(
                "completed"
            );

        }


        const topo =
            document.createElement(
                "div"
            );


        topo.classList.add(
            "task-top"
        );


        const prioridade =
            document.createElement(
                "span"
            );


        prioridade.classList.add(
            "priority",
            obterClassePrioridade(
                tarefa
            )
        );


        prioridade.textContent =
            obterTextoPrioridade(
                tarefa
            );


        const menu =
            document.createElement(
                "button"
            );


        menu.type = "button";

        menu.classList.add(
            "menu"
        );

        menu.setAttribute(
            "aria-label",
            "Opções da tarefa"
        );

        menu.textContent = "•••";

        const categoria = document.createElement("span");
        categoria.classList.add("categoria");
        categoria.textContent = tarefa.categoria || "Geral";

        const etiquetas = document.createElement("div");
        etiquetas.classList.add("task-etiquetas");
        etiquetas.append(categoria, prioridade);


        const titulo =
            document.createElement(
                "h4"
            );


        titulo.textContent =
            tarefa.titulo;


        const descricao =
            document.createElement(
                "p"
            );


        descricao.textContent =
            obterDescricao(
                tarefa.status
            );


        const rodape =
            document.createElement(
                "div"
            );


        rodape.classList.add(
            "task-footer"
        );


        const prazo =
            document.createElement(
                "span"
            );


        if (
            tarefa.status ===
            "concluido"
        ) {

            prazo.textContent =
                "✓ Concluído";

        } else {

            prazo.textContent =
                `📅 ${formatarData(
                    tarefa.prazo
                )}`;

        }


        const avatar =
            document.createElement(
                "span"
            );


        avatar.classList.add(
            "avatar"
        );


        avatar.textContent =
            tarefa.titulo
                .charAt(0)
                .toUpperCase();


        topo.append(
            etiquetas,
            menu
        );


        rodape.append(
            prazo,
            avatar
        );


        artigo.append(
            topo,
            titulo,
            descricao,
            rodape
        );


        /*
            Tarefa concluída ganha manchas e selo.
            Se acabou de ser concluída, também o corte.
        */
        if (tarefa.status === "concluido") {
            decorarConcluida(artigo, tarefa.id);
        } else if (consumirCostura(tarefa.id)) {
            decorarCostura(artigo, tarefa.id);
        }


        area.append(
            artigo
        );

    });


    atualizarContadores(
        tarefas,
        quadro
    );


    atualizarProgresso(
        tarefas
    );
}



function obterClassePrioridade(
    tarefa
) {

    if (
        tarefa.status ===
        "concluido"
    ) {

        return "done-tag";

    }


    if (
        tarefa.prioridade ===
        "alta"
    ) {

        return "high";

    }


    if (
        tarefa.prioridade ===
        "media"
    ) {

        return "medium";

    }


    return "low";
}



function obterTextoPrioridade(
    tarefa
) {

    if (
        tarefa.status ===
        "concluido"
    ) {

        return "Feito";

    }


    const nomes = {

        alta: "Alta",

        media: "Média",

        baixa: "Baixa"

    };


    return nomes[
        tarefa.prioridade
    ];
}



function obterDescricao(
    status
) {

    const descricoes = {

        "a-fazer":
            "Tarefa aguardando início.",

        "em-andamento":
            "Tarefa em desenvolvimento.",

        "em-revisao":
            "Tarefa aguardando revisão.",

        "concluido":
            "Tarefa finalizada."

    };


    return descricoes[status];
}



function formatarData(
    data
) {

    const [
        ano,
        mes,
        dia
    ] = data.split("-");


    return `${dia}/${mes}/${ano}`;
}



function atualizarContadores(
    tarefas,
    quadro
) {

    const status = [

        "a-fazer",

        "em-andamento",

        "em-revisao",

        "concluido"

    ];


    status.forEach(
        (estado) => {

            const quantidade =
                tarefas.filter(
                    (tarefa) =>
                        tarefa.status ===
                        estado
                ).length;


            const contador =
                quadro.querySelector(
                    `[data-contador="${estado}"]`
                );


            if (contador) {

                contador.textContent =
                    quantidade;

            }

        }
    );
}



function atualizarProgresso(
    tarefas
) {

    const texto =
        document.querySelector(
            "#progresso-texto"
        );


    const barra =
        document.querySelector(
            "#progresso-barra"
        );


    if (
        tarefas.length === 0
    ) {

        texto.textContent =
            "0%";

        barra.style.width =
            "0%";


        atualizarFundo(0);

        return;

    }


    const concluidas =
        tarefas.filter(
            (tarefa) =>
                tarefa.status ===
                "concluido"
        ).length;


    const porcentagem =
        Math.round(
            (
                concluidas /
                tarefas.length
            ) * 100
        );


    texto.textContent =
        `${porcentagem}%`;


    barra.style.width =
        `${porcentagem}%`;


    /*
        Alimenta o fundo de tinta com a mesma
        porcentagem exibida na barra.
    */
    atualizarFundo(porcentagem);
}



/* =========================================================
   DECORAÇÃO DE TAREFA CONCLUÍDA
   ---------------------------------------------------------
   Manchas vermelhas fixas + selo 完了. Quando a tarefa
   acabou de ser concluída, dispara também o corte de lâmina.
========================================================= */

/*
    Guarda a decoração de cada tarefa concluída (ângulo e
    manchas), gerada UMA vez por id. Sem isso, cada
    re-render sortearia tudo de novo — o que fazia as
    manchas "piscarem" e o ângulo às vezes cair reto.
*/
const decoracoesConcluidas = new Map();


function obterDecoracao(id) {

    if (decoracoesConcluidas.has(id)) {
        return decoracoesConcluidas.get(id);
    }

    /*
        Sempre inclinado de verdade: escolhe um lado e um
        ângulo com magnitude mínima, nunca perto de 0.
    */
    const lado = Math.random() < 0.5 ? -1 : 1;
    const tilt = (lado * (2.5 + Math.random() * 2)).toFixed(2);

    const manchas = [];
    const quantidade = 4 + Math.floor(Math.random() * 4);

    for (let i = 0; i < quantidade; i++) {

        const tamanho = 16 + Math.random() * 44;

        manchas.push({
            w: tamanho,
            h: tamanho * (0.7 + Math.random() * 0.6),
            left: Math.random() * 100,
            top: Math.random() * 100,
            rot: Math.random() * 360,
            op: (0.35 + Math.random() * 0.4).toFixed(2)
        });
    }

    const deco = { tilt, manchas };

    decoracoesConcluidas.set(id, deco);

    return deco;
}


function decorarConcluida(artigo, id) {

    artigo.classList.add("concluida-selada");

    const deco = obterDecoracao(id);

    /* Inclinação fixa desta tarefa. */
    artigo.style.setProperty("--tilt", `${deco.tilt}deg`);


    /* Camada de manchas (atrás do texto, em multiply). */
    const capa = document.createElement("div");
    capa.classList.add("selo-concluido");

    deco.manchas.forEach((m) => {

        const mancha = document.createElement("span");
        mancha.classList.add("mancha");

        mancha.style.width = `${m.w}px`;
        mancha.style.height = `${m.h}px`;

        mancha.style.left = `${m.left}%`;
        mancha.style.top = `${m.top}%`;

        mancha.style.transform =
            `translate(-50%, -50%) rotate(${m.rot}deg)`;

        mancha.style.opacity = m.op;

        capa.append(mancha);
    });

    artigo.append(capa);


    /* Selo/carimbo de finalizada (marca d'água). */
    const selo = document.createElement("span");
    selo.classList.add("selo-carimbo");
    selo.textContent = "完了";

    artigo.append(selo);


    /* Corte de lâmina, apenas na transição. */
    if (consumirCorte(id)) {

        artigo.classList.add("cortada-agora");

        const linha = document.createElement("span");
        linha.classList.add("corte-linha");

        artigo.append(linha);
    }
}



/* =========================================================
   COSTURA — quando uma tarefa SAI de concluída
   ---------------------------------------------------------
   O card se endireita, o carimbo e as manchas somem e
   pontos de costura ✕ surgem ao longo do antigo corte.
   Tudo é transitório: some ao fim da animação.
========================================================= */

function decorarCostura(artigo, id) {

    artigo.classList.add("costurando");

    const deco = decoracoesConcluidas.get(id);


    /* Recria as manchas (mesmas posições) para desbotarem. */
    if (deco) {

        artigo.style.setProperty("--tilt", `${deco.tilt}deg`);

        const capa = document.createElement("div");
        capa.classList.add("selo-concluido");

        deco.manchas.forEach((m) => {

            const mancha = document.createElement("span");
            mancha.classList.add("mancha");

            mancha.style.width = `${m.w}px`;
            mancha.style.height = `${m.h}px`;
            mancha.style.left = `${m.left}%`;
            mancha.style.top = `${m.top}%`;
            mancha.style.transform =
                `translate(-50%, -50%) rotate(${m.rot}deg)`;
            mancha.style.opacity = m.op;

            capa.append(mancha);
        });

        artigo.append(capa);
    }


    /* Carimbo que desbota junto. */
    const selo = document.createElement("span");
    selo.classList.add("selo-carimbo");
    selo.textContent = "完了";
    artigo.append(selo);


    /* Linha de pontos ✕ costurando o corte. */
    const costura = document.createElement("div");
    costura.classList.add("costura");

    const total = 7;

    for (let i = 0; i < total; i++) {

        const ponto = document.createElement("span");
        ponto.classList.add("ponto");
        ponto.textContent = "✕";

        const lx = 12 + (76 * i) / (total - 1);
        const ly = 50 + (lx - 50) * 0.18;

        ponto.style.left = `${lx}%`;
        ponto.style.top = `${ly}%`;

        /* Aparecem em sequência: efeito de costura. */
        ponto.style.animationDelay = `${(i * 0.06).toFixed(2)}s`;

        costura.append(ponto);
    }

    artigo.append(costura);


    /* Já pode esquecer a decoração antiga desta tarefa. */
    decoracoesConcluidas.delete(id);
}
