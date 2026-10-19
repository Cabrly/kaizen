/* =========================================================
   CHAT — tela do Assistente IA
   ---------------------------------------------------------
   Fala com o Ollama local através do server.py (rota
   /api/chat), que repassa a conversa para o modelo
   escolhido (qwen3:14b ou qwen2.5-coder:14b).

   O histórico da conversa é guardado no localStorage,
   assim como as tarefas do Kanban.
========================================================= */


const CHAVE_HISTORICO = "kaizen.chat.historico.v1";
const CHAVE_MODELO = "kaizen.chat.modelo.v1";


const elementoMensagens =
    document.querySelector("#ia-mensagens");


const formulario =
    document.querySelector("#ia-form");


const campoTexto =
    document.querySelector("#ia-input");


const seletorModelo =
    document.querySelector("#ia-modelo");


const botaoEnviar =
    document.querySelector("#ia-enviar");


const botaoLimpar =
    document.querySelector("#ia-limpar-chat");


const statusPonto =
    document.querySelector("#ia-status-dot");


const statusTexto =
    document.querySelector("#ia-status-texto");


/*
    Se algum destes elementos não existir, esta tela
    não está na página — encerra sem quebrar nada.
*/
if (
    elementoMensagens &&
    formulario &&
    campoTexto &&
    seletorModelo
) {

    iniciarChat();

}



function carregarHistorico() {

    try {

        const bruto = localStorage.getItem(CHAVE_HISTORICO);
        const dados = JSON.parse(bruto || "[]");

        return Array.isArray(dados) ? dados : [];

    } catch (erro) {

        return [];

    }

}


function salvarHistorico(historico) {

    try {
        localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historico));
    } catch (erro) {
        /* nada a fazer */
    }

}


function carregarModeloEscolhido() {

    try {
        return localStorage.getItem(CHAVE_MODELO) || "qwen3:14b";
    } catch (erro) {
        return "qwen3:14b";
    }

}


function salvarModeloEscolhido(modelo) {

    try {
        localStorage.setItem(CHAVE_MODELO, modelo);
    } catch (erro) {
        /* nada a fazer */
    }

}



function iniciarChat() {

    let historico = carregarHistorico();

    seletorModelo.value = carregarModeloEscolhido();


    renderizarHistorico(historico);
    verificarStatus();


    seletorModelo.addEventListener("change", () => {
        salvarModeloEscolhido(seletorModelo.value);
    });


    formulario.addEventListener("submit", async (evento) => {

        evento.preventDefault();

        const texto = campoTexto.value.trim();

        if (texto === "") {
            return;
        }


        const mensagemUsuario = {
            papel: "usuario",
            texto,
            hora: new Date().toISOString()
        };

        historico = [...historico, mensagemUsuario];

        salvarHistorico(historico);
        renderizarHistorico(historico);


        campoTexto.value = "";
        campoTexto.focus();


        await enviarParaAssistente(historico, (novoHistorico) => {
            historico = novoHistorico;
        });

    });


    if (botaoLimpar) {

        botaoLimpar.addEventListener("click", () => {

            historico = [];

            salvarHistorico(historico);
            renderizarHistorico(historico);

        });

    }


    /*
        Enter envia; Shift+Enter quebra linha.
    */
    campoTexto.addEventListener("keydown", (evento) => {

        if (evento.key === "Enter" && !evento.shiftKey) {

            evento.preventDefault();

            formulario.requestSubmit();

        }

    });

}



async function enviarParaAssistente(historico, aoAtualizar) {

    definirCarregando(true);

    const idBolhaEspera = mostrarBolhaEspera();


    try {

        const resposta = await fetch("./api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                modelo: seletorModelo.value,
                mensagens: historico.map((item) => ({
                    role: item.papel === "usuario" ? "user" : "assistant",
                    content: item.texto
                }))
            })
        });


        const documento = await resposta.json().catch(() => null);


        if (!resposta.ok || !documento || typeof documento.resposta !== "string") {

            const detalhe =
                documento && documento.erro
                    ? documento.erro
                    : `HTTP ${resposta.status}`;

            throw new Error(detalhe);

        }


        const mensagemAssistente = {
            papel: "assistente",
            texto: documento.resposta,
            hora: new Date().toISOString()
        };

        const novoHistorico = [...historico, mensagemAssistente];

        salvarHistorico(novoHistorico);
        aoAtualizar(novoHistorico);

        removerBolha(idBolhaEspera);
        renderizarHistorico(novoHistorico);

    } catch (erro) {

        removerBolha(idBolhaEspera);

        mostrarErro(
            "Não foi possível falar com o assistente. " +
            "Confira a IA em uso em \"Onde a IA roda\". " +
            `Detalhe: ${erro.message}`
        );

    } finally {

        definirCarregando(false);

    }

}



function definirCarregando(carregando) {

    botaoEnviar.disabled = carregando;
    campoTexto.disabled = carregando;

}



function renderizarHistorico(historico) {

    elementoMensagens.replaceChildren();


    if (historico.length === 0) {

        const vazio = document.createElement("p");

        vazio.className = "ia-vazio";
        vazio.textContent =
            "Nenhuma mensagem ainda. Escreva algo abaixo para começar.";

        elementoMensagens.append(vazio);

        return;

    }


    historico.forEach((mensagem) => {
        elementoMensagens.append(criarBolha(mensagem));
    });


    elementoMensagens.scrollTop = elementoMensagens.scrollHeight;

}



function criarBolha(mensagem) {

    const bolha = document.createElement("div");

    bolha.className =
        "ia-bolha " +
        (mensagem.papel === "usuario" ? "ia-bolha-usuario" : "ia-bolha-assistente");


    const texto = document.createElement("p");

    texto.textContent = mensagem.texto;

    bolha.append(texto);


    return bolha;

}



function mostrarBolhaEspera() {

    const id = `espera-${Date.now()}`;

    const bolha = document.createElement("div");

    bolha.className = "ia-bolha ia-bolha-assistente ia-bolha-espera";
    bolha.id = id;

    bolha.innerHTML =
        '<span class="ia-ponto"></span>' +
        '<span class="ia-ponto"></span>' +
        '<span class="ia-ponto"></span>';

    elementoMensagens.append(bolha);
    elementoMensagens.scrollTop = elementoMensagens.scrollHeight;

    return id;

}



function removerBolha(id) {

    const bolha = document.querySelector(`#${id}`);

    if (bolha) {
        bolha.remove();
    }

}



function mostrarErro(texto) {

    const erro = document.createElement("p");

    erro.className = "ia-erro";
    erro.textContent = texto;

    elementoMensagens.append(erro);
    elementoMensagens.scrollTop = elementoMensagens.scrollHeight;

}



async function verificarStatus() {

    if (!statusPonto || !statusTexto) {
        return;
    }


    try {

        const resposta = await fetch("./api/ia/status");
        const documento = await resposta.json();


        if (resposta.ok && documento.disponivel) {

            statusPonto.className = "status-dot status-online";

            const modelos =
                Array.isArray(documento.modelos) ? documento.modelos : [];

            statusTexto.textContent =
                `Conectado a "${documento.servidor || "Ollama"}" — ${modelos.length} modelo(s)`;


            /*
                A lista de modelos vem do servidor em uso (pode ser
                este computador ou outro). Mantém a escolha se ela
                existir lá; senão, um qwen3, senão o primeiro.
            */
            if (modelos.length > 0) {

                const atual = seletorModelo.value || carregarModeloEscolhido();

                seletorModelo.replaceChildren(...modelos.map((nome) => {
                    const opcao = document.createElement("option");
                    opcao.value = nome;
                    opcao.textContent = nome;
                    return opcao;
                }));

                // pra conversa, modelo que não "pensa em voz alta" responde em segundos
                const preferidos = ["qwen3:4b-instruct", "qwen3:8b"];

                seletorModelo.value = modelos.includes(atual)
                    ? atual
                    : (preferidos.find((m) => modelos.includes(m))
                        || modelos.find((m) => m.startsWith("qwen3")) || modelos[0]);

                salvarModeloEscolhido(seletorModelo.value);

            }

            return;

        }

        throw new Error("indisponível");

    } catch (erro) {

        statusPonto.className = "status-dot status-offline";

        statusTexto.textContent =
            "IA indisponível. Confira a IA em uso (abaixo).";

    }

}



// trocou o servidor em uso: atualiza status e lista de modelos
window.addEventListener("kaizen:servidores-mudaram", verificarStatus);
