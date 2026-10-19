/* =========================================================
   NUVEM / SERVIDOR — o server.py de bolso
   ---------------------------------------------------------
   Quando não há server.py (celular, site estático), o
   js/modo.js manda as chamadas /api/... pra cá. As rotas e
   as respostas são as mesmas do servidor Python, então as
   telas não sabem a diferença.

   Dados ficam no aparelho (localStorage). IA só na nuvem
   (Gemini, ChatGPT ou compatível). A lógica do plano é a
   do estudos.py, e os prompts vêm do mesmo prompts.json.
========================================================= */


import { PROVEDORES, ErroIA, lerConfig, salvarConfig, contasConectadas,
         listarModelos, modeloSugerido, conversar } from "./ia.js";

import { IDIOMAS, buscarVideos, linkDocumentacao } from "./busca.js";


const CHAVE_DADOS = "kaizen.nuvem.dados.v1";
const BLOCO = 10;
const CORES = ["#c90016", "#2f6f4f", "#3b5bdb", "#b8860b", "#7b2cbf", "#0b7285", "#5c5f66"];

let prompts = null;
const modelosEmCache = {};



/* =========================================================
   Armazenamento
========================================================= */

function ler() {

    try {
        const dados = JSON.parse(localStorage.getItem(CHAVE_DADOS) || "null");
        if (dados) return dados;
    } catch (erro) {
        /* corrompido: começa do zero */
    }

    return { seq: { plano: 0, sessao: 0, item: 0 }, planos: [], sessoes: [], itens: [] };

}


function gravar(dados) {
    localStorage.setItem(CHAVE_DADOS, JSON.stringify(dados));
}


function novoId(dados, tipo) {
    dados.seq[tipo] += 1;
    return dados.seq[tipo];
}


function hojeIso() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}


function agora() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace("T", " ");
}


function somarDias(iso, dias) {
    const [a, m, d] = iso.split("-").map(Number);
    const data = new Date(Date.UTC(a, m - 1, d + dias));
    return data.toISOString().slice(0, 10);
}


function diaDaSemana(iso) {
    // 0 = segunda … 6 = domingo (igual ao weekday() do Python)
    const [a, m, d] = iso.split("-").map(Number);
    return (new Date(Date.UTC(a, m - 1, d)).getUTCDay() + 6) % 7;
}


function datasDeEstudo(inicio, dias, quantidade, depoisDe = null) {

    let atual = inicio;

    if (depoisDe && somarDias(depoisDe, 1) > atual) {
        atual = somarDias(depoisDe, 1);
    }

    const datas = [];

    while (datas.length < quantidade) {
        if (dias.includes(diaDaSemana(atual))) datas.push(atual);
        atual = somarDias(atual, 1);
    }

    return datas;

}


// planos que estavam gerando quando o app foi fechado não vão terminar
(function recuperar() {
    const dados = ler();
    let mudou = false;
    dados.planos.forEach((p) => {
        if (p.status === "gerando") {
            Object.assign(p, { status: "erro", etapa: null, erro: "O app foi fechado no meio da geração. Tente de novo." });
            mudou = true;
        }
    });
    if (mudou) gravar(dados);
})();



/* =========================================================
   IA
========================================================= */

async function carregarPrompts() {

    if (!prompts) {
        const resposta = await fetch(new URL("../../prompts.json", import.meta.url));
        prompts = await resposta.json();
    }

    return prompts;

}


function separarMotor(motor) {
    const [, provedor, modelo] = (motor || "").match(/^nuvem@([^:]+):(.+)$/) || [];
    return { provedor, modelo };
}


function jsonDoTexto(texto) {

    const inicio = texto.indexOf("{");
    const fim = texto.lastIndexOf("}");

    if (inicio < 0 || fim < inicio) throw new ErroIA("A IA não devolveu JSON.");

    try {
        return JSON.parse(texto.slice(inicio, fim + 1));
    } catch (erro) {
        throw new ErroIA(`JSON inválido da IA: ${erro.message}`);
    }

}


async function gerarJson(motor, sistema, pedido, esquema) {

    const { provedor, modelo } = separarMotor(motor);

    if (!provedor) throw new ErroIA("Escolha uma IA conectada (Gemini, ChatGPT…).");

    const texto = await conversar(provedor, modelo,
        [{ role: "system", content: sistema }, { role: "user", content: pedido }], esquema);

    return jsonDoTexto(texto);

}


async function modelosDe(provedor, usarCache = true) {

    const guardado = modelosEmCache[provedor];

    if (usarCache && guardado && Date.now() - guardado.quando < 600000) {
        return guardado.estado;
    }

    const inicio = performance.now();
    let estado;

    try {
        const modelos = await listarModelos(provedor, lerConfig().contas[provedor]);
        estado = { online: true, modelos, ms: Math.round(performance.now() - inicio) };
    } catch (erro) {
        estado = { online: false, modelos: [], ms: null };
    }

    modelosEmCache[provedor] = { quando: Date.now(), estado };
    return estado;

}


function preferido() {
    const config = lerConfig();
    const contas = contasConectadas();
    return contas.includes(config.preferido) ? config.preferido : contas[0] || null;
}


async function destinosComStatus(usarCache = true) {

    const escolhido = preferido();

    return Promise.all(contasConectadas().map(async (p) => ({
        id: p,
        nome: PROVEDORES[p].nome,
        url: p === "compat" ? lerConfig().contas[p].url : "",
        tipo: "nuvem",
        removivel: true,
        preferido: p === escolhido,
        ...(await modelosDe(p, usarCache))
    })));

}


async function motores() {

    const destinos = await destinosComStatus();
    const lista = [];

    destinos.sort((a, b) => b.preferido - a.preferido).forEach((d) => {
        const sugerido = modeloSugerido(d.id, d.modelos);
        d.modelos.forEach((m) => lista.push({
            id: `nuvem@${d.id}:${m}`, modelo: m, servidor: d.nome, recomendado: m === sugerido
        }));
    });

    const padrao = (lista.find((m) => m.recomendado) || lista[0] || {}).id || "";

    return { motores: lista, padrao, recomendado: "um modelo da nuvem" };

}



/* =========================================================
   Planos
========================================================= */

function resumoPlano(dados, plano) {

    const sessoes = dados.sessoes.filter((s) => s.plano_id === plano.id);
    const ids = new Set(sessoes.map((s) => s.id));
    const itens = dados.itens.filter((i) => ids.has(i.sessao_id) && i.estado !== "nao-feito");
    const datas = sessoes.map((s) => s.data).sort();

    return {
        ...plano,
        respostas: undefined,
        total_itens: itens.length,
        itens_feitos: itens.filter((i) => i.estado === "feito").length,
        primeira_data: datas[0] || null,
        ultima_data: datas[datas.length - 1] || null
    };

}


function listarPlanos() {
    const dados = ler();
    return [...dados.planos].sort((a, b) => b.id - a.id).map((p) => resumoPlano(dados, p));
}


function obterPlano(id) {
    const dados = ler();
    const plano = dados.planos.find((p) => p.id === id);
    return plano ? resumoPlano(dados, plano) : null;
}


function atualizarPlano(id, mudancas) {
    const dados = ler();
    const plano = dados.planos.find((p) => p.id === id);
    if (plano) Object.assign(plano, mudancas);
    gravar(dados);
}


async function perguntas(tema, motor) {

    const { sistema_perguntas, esquema_perguntas } = await carregarPrompts();
    const dados = await gerarJson(motor || (await motores()).padrao, sistema_perguntas, `Assunto: ${tema}`, esquema_perguntas);

    const lista = (dados.perguntas || [])
        .filter((p) => p && String(p.pergunta || "").trim())
        .slice(0, 4)
        .map((p) => ({
            pergunta: p.pergunta.trim(),
            opcoes: (p.opcoes || []).map((o) => String(o).trim()).filter(Boolean).slice(0, 4)
        }));

    if (!lista.length) throw new ErroIA("A IA não conseguiu sugerir perguntas.");

    return lista;

}


function pedidoRoteiro(plano, total, feitas, quantas) {

    const linhas = [`Assunto: ${plano.tema}`];

    (plano.respostas || []).forEach((r) => {
        if (r.resposta) linhas.push(`${r.pergunta} ${r.resposta}`);
    });

    linhas.push(`Duração de cada sessão: ${plano.minutos} minutos`);
    linhas.push(`Idioma dos materiais (vídeos e documentação): ${IDIOMAS[plano.idioma].nome}`);
    linhas.push(`O roteiro completo tem ${total} sessões.`);

    if (feitas.length) {
        linhas.push("Já planejado (não repita): " + feitas.map((s, i) => `${i + 1}. ${s.topico}`).join("; "));
    }

    const ultimo = feitas.length + quantas >= total;

    linhas.push(`Gere agora as sessões ${feitas.length + 1} a ${feitas.length + quantas} ` +
                `(${quantas} sessões).${ultimo ? " Este é o último bloco." : ""}`);

    if (plano.idioma !== "pt") {
        linhas.push("Escreva título, tópicos, objetivos e atividades em PORTUGUÊS DO BRASIL; " +
                    "só o campo busca_video vai no idioma dos materiais.");
    }

    return linhas.join("\n");

}


async function emParalelo(lista, funcao, limite = 3) {

    const resultados = new Array(lista.length);
    let proximo = 0;

    async function trabalhador() {
        while (proximo < lista.length) {
            const i = proximo++;
            resultados[i] = await funcao(lista[i], i);
        }
    }

    await Promise.all(Array.from({ length: Math.min(limite, lista.length) }, trabalhador));
    return resultados;

}


async function gerarPlano(id) {

    try {

        const { sistema_roteiro, esquema_roteiro } = await carregarPrompts();
        const plano = ler().planos.find((p) => p.id === id);
        const total = plano.dias.length * plano.semanas;

        let roteiro = [];
        let titulo = null;
        let docOficial = "";


        // --- roteiro, em blocos ---
        while (roteiro.length < total) {

            const quantas = Math.min(BLOCO, total - roteiro.length);

            atualizarPlano(id, { etapa: `Montando o roteiro: sessões ${roteiro.length + 1}–${roteiro.length + quantas} de ${total}` });

            const dados = await gerarJson(plano.motor, sistema_roteiro,
                                          pedidoRoteiro(plano, total, roteiro, quantas), esquema_roteiro);

            const novas = (dados.sessoes || []).filter((s) => String(s.topico || "").trim()).slice(0, quantas);

            if (!novas.length) throw new ErroIA("A IA devolveu um bloco vazio.");

            roteiro = roteiro.concat(novas);
            titulo = titulo || dados.titulo;
            docOficial = docOficial || dados.documentacao_oficial || "";

        }


        // --- materiais ---
        const minutosVideo = Math.max(8, Math.round(plano.minutos * 0.5));
        let feitos = 0;

        atualizarPlano(id, { etapa: "Buscando vídeos…" });

        const achados = await emParalelo(roteiro, async (sessao) => {

            const consulta = sessao.busca_video || `${sessao.topico} ${plano.tema} ${IDIOMAS[plano.idioma].aula}`;
            const videos = await buscarVideos(consulta, { idioma: plano.idioma, minutosMax: minutosVideo });

            feitos += 1;
            atualizarPlano(id, { etapa: `Buscando vídeos: ${feitos} de ${roteiro.length} sessões` });

            return videos;

        });


        // --- grava tudo ---
        const datas = datasDeEstudo(plano.inicio, plano.dias, roteiro.length);
        const usados = new Set();
        const dados = ler();

        roteiro.forEach((sessao, i) => {

            const sessaoId = novoId(dados, "sessao");

            dados.sessoes.push({
                id: sessaoId, plano_id: id, data: datas[i],
                topico: sessao.topico.trim(), objetivo: String(sessao.objetivo || "").trim(), extra: 0
            });

            const video = achados[i].find((v) => !usados.has(v.url));
            if (video) usados.add(video.url);

            const doc = linkDocumentacao({
                tema: plano.tema, topico: sessao.topico.trim(), termos: sessao.termos_doc,
                dominio: docOficial, idioma: plano.idioma
            });

            const materiais = (video ? [video] : []).concat(doc);

            materiais.forEach((m) => dados.itens.push({
                id: novoId(dados, "item"), sessao_id: sessaoId, tipo: m.tipo, titulo: m.titulo.slice(0, 200),
                url: m.url, descricao: null, fonte: m.fonte || null, minutos: m.minutos || null,
                estado: "pendente", origem_id: null
            }));

            (sessao.atividades || []).slice(0, 3).forEach((a) => {
                if (!String(a.titulo || "").trim()) return;
                dados.itens.push({
                    id: novoId(dados, "item"), sessao_id: sessaoId, tipo: "atividade",
                    titulo: a.titulo.trim().slice(0, 200), url: null, descricao: String(a.descricao || "").trim(),
                    fonte: null, minutos: Number.isInteger(a.minutos) ? a.minutos : null,
                    estado: "pendente", origem_id: null
                });
            });

        });

        const registro = dados.planos.find((p) => p.id === id);

        if (registro) {
            Object.assign(registro, { status: "pronto", etapa: null, titulo: titulo || plano.tema, doc_oficial: docOficial });
            gravar(dados);
        }

    } catch (erro) {

        atualizarPlano(id, { status: "erro", etapa: null, erro: String(erro.message || erro).slice(0, 500) });

    }

}


function criarPlano(corpo) {

    const tema = String(corpo.tema || "").trim();
    const dias = [...new Set((corpo.dias || []).map(Number).filter((d) => d >= 0 && d <= 6))].sort();
    const minutos = Number(corpo.minutos) || 60;
    const semanas = Number(corpo.semanas) || 4;
    const inicio = corpo.inicio || hojeIso();

    if (!tema) throw new RangeError("Diga o que você quer estudar.");
    if (!dias.length) throw new RangeError("Escolha pelo menos um dia da semana.");
    if (minutos < 10 || minutos > 480 || semanas < 1 || semanas > 26) throw new RangeError("Minutos ou semanas fora do intervalo.");

    const dados = ler();
    const id = novoId(dados, "plano");

    dados.planos.push({
        id, tema, respostas: corpo.respostas || [], dias, minutos, horario: corpo.horario || null, inicio, semanas,
        motor: corpo.motor, idioma: IDIOMAS[corpo.idioma] ? corpo.idioma : "pt",
        cor: CORES[dados.planos.length % CORES.length], status: "gerando", etapa: "Na fila…",
        erro: null, titulo: null, doc_oficial: null, criado_em: agora()
    });

    gravar(dados);

    gerarPlano(id);  // segue sozinho; a tela acompanha pela etapa

    return obterPlano(id);

}


function excluirPlano(id) {
    const dados = ler();
    const sessoes = new Set(dados.sessoes.filter((s) => s.plano_id === id).map((s) => s.id));
    dados.planos = dados.planos.filter((p) => p.id !== id);
    dados.sessoes = dados.sessoes.filter((s) => !sessoes.has(s.id));
    dados.itens = dados.itens.filter((i) => !sessoes.has(i.sessao_id));
    gravar(dados);
}



/* =========================================================
   Calendário, sessões e o "não fiz"
========================================================= */

function calendario(inicio, fim) {

    const dados = ler();
    const planos = new Map(dados.planos.map((p) => [p.id, p]));

    return dados.sessoes
        .filter((s) => s.data >= inicio && s.data <= fim && planos.has(s.plano_id))
        .map((s) => {
            const p = planos.get(s.plano_id);
            const itens = dados.itens.filter((i) => i.sessao_id === s.id);
            return {
                id: s.id, data: s.data, topico: s.topico, extra: s.extra,
                plano_id: p.id, tema: p.tema, cor: p.cor, horario: p.horario,
                total: itens.length,
                feitos: itens.filter((i) => i.estado === "feito").length,
                nao_feitos: itens.filter((i) => i.estado === "nao-feito").length
            };
        })
        .sort((a, b) => a.data.localeCompare(b.data) || (a.horario == null) - (b.horario == null)
                        || String(a.horario).localeCompare(String(b.horario)) || a.id - b.id);

}


function obterSessao(id) {

    const dados = ler();
    const sessao = dados.sessoes.find((s) => s.id === id);

    if (!sessao) return null;

    const plano = dados.planos.find((p) => p.id === sessao.plano_id);
    const dataDaSessao = (sessaoId) => dados.sessoes.find((s) => s.id === sessaoId)?.data || null;
    const ordem = { video: 0, doc: 1, atividade: 2 };

    const itens = dados.itens
        .filter((i) => i.sessao_id === id)
        .sort((a, b) => ordem[a.tipo] - ordem[b.tipo] || a.id - b.id)
        .map((i) => {
            const origem = dados.itens.find((o) => o.id === i.origem_id);
            const copia = dados.itens.find((c) => c.origem_id === i.id);
            return { ...i, veio_de: origem ? dataDaSessao(origem.sessao_id) : null,
                     foi_para: copia ? dataDaSessao(copia.sessao_id) : null };
        });

    return { ...sessao, tema: plano.tema, cor: plano.cor, horario: plano.horario,
             minutos: plano.minutos, plano_titulo: plano.titulo, itens };

}


function proximaSessao(dados, sessao) {

    const ontem = somarDias(hojeIso(), -1);
    const referencia = sessao.data > ontem ? sessao.data : ontem;

    const proxima = dados.sessoes
        .filter((s) => s.plano_id === sessao.plano_id && s.data > referencia)
        .sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id)[0];

    if (proxima) return proxima;

    const plano = dados.planos.find((p) => p.id === sessao.plano_id);
    const ultima = dados.sessoes.filter((s) => s.plano_id === plano.id).map((s) => s.data).sort().pop();
    const [data] = datasDeEstudo(plano.inicio, plano.dias, 1, ultima > referencia ? ultima : referencia);

    const nova = { id: novoId(dados, "sessao"), plano_id: plano.id, data, topico: "Pendências",
                   objetivo: "Terminar o que ficou para trás.", extra: 1 };

    dados.sessoes.push(nova);
    return nova;

}


function marcarItem(id, estado) {

    if (!["pendente", "feito", "nao-feito"].includes(estado)) throw new RangeError("Estado inválido.");

    const dados = ler();
    const item = dados.itens.find((i) => i.id === id);

    if (!item) return null;

    const sessao = dados.sessoes.find((s) => s.id === item.sessao_id);
    const copia = dados.itens.find((c) => c.origem_id === id);

    item.estado = estado;

    if (estado === "nao-feito" && !copia) {

        const destino = proximaSessao(dados, sessao);
        dados.itens.push({ ...item, id: novoId(dados, "item"), sessao_id: destino.id, estado: "pendente", origem_id: id });

    } else if (estado !== "nao-feito" && copia && copia.estado === "pendente") {

        // desmarcou: a cópia volta atrás, se ainda não foi mexida
        dados.itens = dados.itens.filter((i) => i.id !== copia.id);
        const sessaoCopia = dados.sessoes.find((s) => s.id === copia.sessao_id);
        if (sessaoCopia?.extra && !dados.itens.some((i) => i.sessao_id === sessaoCopia.id)) {
            dados.sessoes = dados.sessoes.filter((s) => s.id !== sessaoCopia.id);
        }

    }

    gravar(dados);
    return obterSessao(sessao.id);

}


function adiarPendentes(sessaoId) {
    ler().itens.filter((i) => i.sessao_id === sessaoId && i.estado === "pendente")
        .forEach((i) => marcarItem(i.id, "nao-feito"));
    return obterSessao(sessaoId);
}



/* =========================================================
   Contas de IA e chat
========================================================= */

async function listaDestinos() {
    return {
        modo: "nuvem",
        servidores: await destinosComStatus(false),
        nuvem: Object.entries(PROVEDORES).map(([id, p]) => ({
            id, nome: p.nome, onde_pegar: p.ondePegar, pede_url: Boolean(p.pedeUrl),
            conectado: contasConectadas().includes(id)
        }))
    };
}


async function conectarNuvem(provedor, chave, url) {

    if (!PROVEDORES[provedor]) throw new RangeError("Provedor desconhecido.");

    chave = String(chave || "").trim();
    url = String(url || "").trim().replace(/\/+$/, "");

    if (PROVEDORES[provedor].pedeUrl) {
        if (!/^https?:\/\//.test(url)) throw new RangeError("Informe a URL da API (ex.: https://openrouter.ai/api/v1).");
    } else if (chave.length < 20) {
        throw new RangeError("Cole a chave de API completa.");
    }

    let modelos;

    try {
        modelos = await listarModelos(provedor, { chave, url });
    } catch (erro) {
        throw new RangeError(`Não funcionou (${erro.message}). Confira a chave${url ? " e a URL" : ""}.`);
    }

    if (!modelos.length) throw new RangeError("Conectou, mas a conta não tem nenhum modelo de conversa liberado.");

    const config = lerConfig();
    config.contas[provedor] = url ? { chave, url } : { chave };
    config.preferido = config.preferido || provedor;
    salvarConfig(config);
    delete modelosEmCache[provedor];

    return destinosComStatus();

}


function removerConta(provedor) {
    const config = lerConfig();
    delete config.contas[provedor];
    if (config.preferido === provedor) config.preferido = null;
    salvarConfig(config);
}


function definirPreferido(provedor) {
    if (!contasConectadas().includes(provedor)) throw new RangeError("Conecte essa conta primeiro.");
    const config = lerConfig();
    config.preferido = provedor;
    salvarConfig(config);
}


async function statusChat() {

    const p = preferido();

    if (!p) return { disponivel: false, modelos: [], servidor: "nenhuma IA conectada" };

    const estado = await modelosDe(p);
    const sugerido = modeloSugerido(p, estado.modelos);

    // o sugerido primeiro, pra o chat já começar com ele
    const modelos = sugerido ? [sugerido, ...estado.modelos.filter((m) => m !== sugerido)] : estado.modelos;

    return { disponivel: estado.online, modelos, servidor: PROVEDORES[p].nome };

}


async function chat(corpo) {

    const p = preferido();

    if (!p) throw new ErroIA("Conecte o Gemini ou o ChatGPT em \"Onde a IA roda\".");

    const { sistema_chat } = await carregarPrompts();
    const mensagens = Array.isArray(corpo.mensagens) ? corpo.mensagens : [];

    if (!mensagens.length) throw new RangeError("Nenhuma mensagem enviada.");

    const resposta = await conversar(p, corpo.modelo || (await statusChat()).modelos[0],
                                     [{ role: "system", content: sistema_chat }, ...mensagens]);

    return { resposta, modelo: corpo.modelo };

}



/* =========================================================
   Backup — mesmo formato do server.py: o arquivo feito no
   celular restaura no PC e vice-versa. Sem as chaves de IA.
========================================================= */

const CHAVE_TAREFAS = "kaizen.tarefas.v1";       // as mesmas do js/persistencia.js
const CHAVE_CATEGORIAS = "kaizen.categorias.v1";


function lerJson(chave, padrao) {
    try {
        return JSON.parse(localStorage.getItem(chave) || "null") ?? padrao;
    } catch (erro) {
        return padrao;
    }
}


function exportarBackup() {

    const dados = ler();

    return {
        app: "kaizen",
        formato: 1,
        criado_em: agora().replace(" ", "T"),
        kanban: { tarefas: lerJson(CHAVE_TAREFAS, []), categorias: lerJson(CHAVE_CATEGORIAS, []) },
        estudos: { planos: dados.planos, sessoes: dados.sessoes, itens: dados.itens }
    };

}


function restaurarBackup(corpo) {

    if (corpo.app !== "kaizen") throw new RangeError("Esse arquivo não é um backup do Kaizen.");

    if (Array.isArray(corpo.kanban?.tarefas)) {
        localStorage.setItem(CHAVE_TAREFAS, JSON.stringify(corpo.kanban.tarefas));
        localStorage.setItem(CHAVE_CATEGORIAS, JSON.stringify(corpo.kanban.categorias || []));
    }

    const e = corpo.estudos;

    if (e && Array.isArray(e.planos) && Array.isArray(e.sessoes) && Array.isArray(e.itens)) {

        const maior = (lista) => lista.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0);

        const planos = e.planos.map((p) => p.status === "gerando"
            ? { ...p, status: "erro", etapa: null, erro: "O backup foi feito no meio da geração." }
            : { idioma: "pt", ...p });

        gravar({
            seq: { plano: maior(planos), sessao: maior(e.sessoes), item: maior(e.itens) },
            planos, sessoes: e.sessoes, itens: e.itens
        });

    }

}



/* =========================================================
   Roteador: mesmas rotas e respostas do server.py
========================================================= */

function json(status, corpo) {
    return new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
}


export async function rotear(url, opcoes = {}) {

    const metodo = (opcoes.method || "GET").toUpperCase();
    const caminho = url.pathname.slice(url.pathname.indexOf("/api/") + 1).split("/");
    const corpo = typeof opcoes.body === "string" && opcoes.body ? JSON.parse(opcoes.body) : {};
    const [, area, recurso, ident, acao] = caminho;
    const id = Number(ident);

    try {

        if (area === "chat" && metodo === "POST") return json(200, await chat(corpo));
        if (area === "backup" && metodo === "GET") return json(200, exportarBackup());
        if (area === "backup" && metodo === "POST") { restaurarBackup(corpo); return json(200, { ok: true }); }
        if (area === "ia" && recurso === "status") return json(200, await statusChat());

        if (area === "ia" && recurso === "servidores") {
            if (metodo === "GET" && !ident) return json(200, await listaDestinos());
            if (metodo === "POST" && ident === "nuvem") return json(200, { servidores: await conectarNuvem(acao, corpo.chave, corpo.url) });
            if (metodo === "POST" && acao === "preferido") { definirPreferido(ident); return json(200, { servidores: await destinosComStatus() }); }
            if (metodo === "DELETE" && ident) { removerConta(ident); return json(200, { servidores: await destinosComStatus() }); }
            if (metodo === "POST" && !ident) throw new RangeError("No celular a IA roda só na nuvem: conecte o Gemini ou o ChatGPT.");
        }

        if (area === "estudos") {
            if (metodo === "GET" && recurso === "motores") return json(200, await motores());
            if (metodo === "GET" && recurso === "planos" && !ident) return json(200, { planos: listarPlanos() });
            if (metodo === "GET" && recurso === "planos") return json(200, { plano: obterPlano(id) });
            if (metodo === "GET" && recurso === "calendario") return json(200, { sessoes: calendario(url.searchParams.get("inicio"), url.searchParams.get("fim")) });
            if (metodo === "GET" && recurso === "sessoes") return json(200, { sessao: obterSessao(id) });
            if (metodo === "POST" && recurso === "perguntas") return json(200, { perguntas: await perguntas(String(corpo.tema || "").trim(), corpo.motor) });
            if (metodo === "POST" && recurso === "planos") return json(201, { plano: criarPlano(corpo) });
            if (metodo === "POST" && recurso === "sessoes" && acao === "adiar") return json(200, { sessao: adiarPendentes(id) });
            if (metodo === "PATCH" && recurso === "itens") return json(200, { sessao: marcarItem(id, corpo.estado) });
            if (metodo === "DELETE" && recurso === "planos") { excluirPlano(id); return json(200, { ok: true }); }
        }

        // /api/tarefas e o resto: sem servidor, o kanban usa o modo estático dele
        return json(404, { erro: "Rota não encontrada" });

    } catch (erro) {

        if (erro instanceof ErroIA) return json(502, { erro: erro.message });
        return json(400, { erro: erro.message || String(erro) });

    }

}
