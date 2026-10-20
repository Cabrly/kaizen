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

import { ligarEntregas, listar as listarEntregas, obter as obterEntrega, criar as criarEntrega, corrigirDeNovo,
         excluir as excluirEntrega, sobreCorretor, resumoDosItens, linhaDoPerfil, dosPlanos,
         exportar as exportarEntregas, importar as importarEntregas } from "./entregas.js";


const CHAVE_DADOS = "kaizen.nuvem.dados.v1";
const BLOCO = 10;
const CORES = ["#c90016", "#2f6f4f", "#3b5bdb", "#b8860b", "#7b2cbf", "#0b7285", "#5c5f66"];
const DORMINDO = "9999-12-31";   // cartão de plano importado: só entra na revisão quando a sessão é estudada

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


// Pra achar tópico repetido: sem acento, maiúscula, pontuação e prefixo como "Sessão 11:"
function chaveTopico(topico) {
    return topico.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        .replace(/^\s*(sessao|aula|dia|semana|modulo|parte)\s*\d+\s*[:.\-]*\s*/, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}


// "Sessão 11: Mini projeto" -> "Mini projeto" (a data já diz qual é)
const PREFIXO_TOPICO = /^\s*(sess[aã]o|aula|dia|semana|m[oó]dulo|parte)\s*\d+\s*[:.\-–]*\s*/i;


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

    if (!provedor) throw new ErroIA("Escolha uma IA conectada (OpenRouter, Claude, ChatGPT…).");

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
        tipo: p === "pc" ? "pc" : "nuvem",
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


/* O plano anterior de uma continuação (pet reativado): título e o que já foi estudado. */
function estudadoAntes(dados, planoId) {

    const titulos = [];
    let topicos = [];
    const vistos = new Set();

    while (planoId && !vistos.has(planoId)) {
        vistos.add(planoId);
        const plano = dados.planos.find((p) => p.id === planoId);
        if (!plano) break;
        titulos.push(plano.titulo || plano.tema);
        topicos = dados.sessoes
            .filter((x) => x.plano_id === plano.id && !x.extra && foiEstudada(dados, x.id))
            .sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id)
            .map((x) => x.topico)
            .concat(topicos);
        planoId = plano.pai_id;
    }

    if (!titulos.length) return "";

    return `Continuação de "${titulos[0]}". Já estudou: ${[...new Set(topicos)].join(", ") || "pouca coisa"}.`;

}


async function perguntas(tema, motor, continuaDe = null) {

    const { sistema_perguntas, esquema_perguntas } = await carregarPrompts();
    const anterior = continuaDe ? estudadoAntes(completar(ler()), Number(continuaDe)) : "";
    const pedido = anterior
        ? `Assunto: ${tema}\n${anterior}\nO estudante quer ir além do que já viu: faça as perguntas pensando no ` +
          "próximo passo, mais aprofundado, sem perguntar o básico que ele já estudou."
        : `Assunto: ${tema}`;
    const dados = await gerarJson(motor || (await motores()).padrao, sistema_perguntas, pedido, esquema_perguntas);

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

    const anterior = plano.pai_id ? estudadoAntes(completar(ler()), plano.pai_id) : "";
    if (anterior) linhas.push(`${anterior} Este plano aprofunda: comece de onde ele parou e não repita esses tópicos.`);

    const historico = perfilTexto(completar(ler()), plano.id);
    if (historico) {
        linhas.push("O que o estudante já estudou em outros planos (aproveite e não repita o básico que ele já sabe):\n" + historico);
    }

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

        // modelo pequeno repete tópico; a repetida é descartada e o próximo
        // pedido repõe — com um teto, pra nunca ficar em loop
        const vistos = new Set();
        const maxPedidos = Math.ceil(total / BLOCO) + 3;
        let pedidos = 0;


        // --- roteiro, em blocos ---
        while (roteiro.length < total && pedidos < maxPedidos) {

            pedidos += 1;

            const quantas = Math.min(BLOCO, total - roteiro.length);

            atualizarPlano(id, { etapa: `Montando o roteiro: sessões ${roteiro.length + 1}–${roteiro.length + quantas} de ${total}` });

            const dados = await gerarJson(plano.motor, sistema_roteiro,
                                          pedidoRoteiro(plano, total, roteiro, quantas), esquema_roteiro);

            const novas = (dados.sessoes || []).filter((s) => {
                const chave = chaveTopico(String(s.topico || ""));
                if (!chave || vistos.has(chave)) return false;
                vistos.add(chave);
                s.topico = String(s.topico).replace(PREFIXO_TOPICO, "").trim() || s.topico;
                return true;
            });

            roteiro = roteiro.concat(novas.slice(0, quantas));
            titulo = titulo || dados.titulo;
            docOficial = docOficial || dados.documentacao_oficial || "";

        }


        if (!roteiro.length) throw new ErroIA("A IA não conseguiu montar o roteiro.");


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
    const pai = dados.planos.find((p) => p.id === Number(corpo.pai_id));

    dados.planos.push({
        id, tema, respostas: corpo.respostas || [], dias, minutos, horario: corpo.horario || null, inicio, semanas,
        motor: corpo.motor, idioma: IDIOMAS[corpo.idioma] ? corpo.idioma : "pt",
        cor: pai ? pai.cor : CORES[dados.planos.length % CORES.length], status: "gerando", etapa: "Na fila…",
        erro: null, titulo: null, doc_oficial: null, criado_em: agora(), pai_id: pai ? pai.id : null
    });

    gravar(dados);

    gerarPlano(id);  // segue sozinho; a tela acompanha pela etapa

    return obterPlano(id);

}


// os cartões que vieram num plano importado entram na revisão de hoje
function acordarCartoes(sessaoId) {
    const dados = completar(ler());
    const dormindo = dados.flashcards.filter((f) => f.sessao_id === sessaoId && f.revisar_em === DORMINDO);
    if (!dormindo.length) return;
    dormindo.forEach((f) => { f.revisar_em = hojeIso(); });
    gravar(dados);
}


/* Plano que alguém compartilhou (js/compartilhar.js) vira um plano novo daqui:
   progresso zerado, datas a partir de `inicio` nos `dias` escolhidos. */
async function importarPlano(corpo) {

    const pacote = corpo.plano && typeof corpo.plano === "object" ? corpo.plano : {};
    if (pacote.app !== "kaizen-plano") throw new RangeError("Isso não é um plano do Kaizen.");

    const texto = (valor, maximo) => String(valor ?? "").trim().slice(0, maximo);
    const link = (url) => /^https?:\/\//i.test(String(url || "")) ? texto(url, 1000) : null;
    const sessoes = (Array.isArray(pacote.sessoes) ? pacote.sessoes : []).slice(0, 400)
        .filter((s) => s && typeof s === "object" && texto(s.topico, 200));
    if (!sessoes.length) throw new RangeError("O plano veio vazio.");

    const dias = [...new Set((corpo.dias || pacote.dias || []).map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
    if (!dias.length) throw new RangeError("Escolha pelo menos um dia da semana.");
    const inicio = /^\d{4}-\d{2}-\d{2}$/.test(corpo.inicio || "") ? corpo.inicio : hojeIso();
    const horario = /^\d{2}:\d{2}$/.test(corpo.horario ?? pacote.horario ?? "") ? (corpo.horario ?? pacote.horario) : null;
    const tema = texto(pacote.tema, 200) || texto(pacote.titulo, 200) || "Plano compartilhado";

    const padrao = await motores().then((m) => m.padrao).catch(() => "");   // sem IA conectada, o plano vem igual
    const dados = completar(ler());
    const id = novoId(dados, "plano");

    dados.planos.push({
        id, tema, respostas: [], dias, minutos: Math.min(480, Math.max(10, Number(pacote.minutos) || 60)), horario, inicio,
        semanas: Math.ceil(sessoes.length / dias.length), motor: padrao, idioma: IDIOMAS[pacote.idioma] ? pacote.idioma : "pt",
        cor: CORES[dados.planos.length % CORES.length], status: "pronto", etapa: null, erro: null,
        titulo: texto(pacote.titulo, 200) || tema, doc_oficial: texto(pacote.doc_oficial, 200), criado_em: agora(), pai_id: null
    });

    const datas = datasDeEstudo(inicio, dias, sessoes.length);

    sessoes.forEach((sessao, i) => {

        const sessaoId = novoId(dados, "sessao");
        dados.sessoes.push({ id: sessaoId, plano_id: id, data: datas[i], topico: texto(sessao.topico, 200),
                             objetivo: texto(sessao.objetivo, 1000), extra: 0 });

        (Array.isArray(sessao.itens) ? sessao.itens : []).slice(0, 12)
            .filter((item) => item && ["video", "doc", "atividade"].includes(item.tipo) && texto(item.titulo, 200))
            .forEach((item) => dados.itens.push({
                id: novoId(dados, "item"), sessao_id: sessaoId, tipo: item.tipo, titulo: texto(item.titulo, 200),
                url: link(item.url), descricao: texto(item.descricao, 4000) || null, fonte: texto(item.fonte, 100) || null,
                minutos: Number.isInteger(item.minutos) ? item.minutos : null, estado: "pendente", origem_id: null
            }));

        (Array.isArray(sessao.cartoes) ? sessao.cartoes : []).slice(0, 20)
            .filter((c) => c && texto(c.frente, 500) && texto(c.verso, 1000))
            .forEach((c) => dados.flashcards.push({
                id: novoId(dados, "cartao"), sessao_id: sessaoId, frente: texto(c.frente, 500),
                verso: texto(c.verso, 1000), caixa: 0, revisar_em: DORMINDO
            }));

    });

    gravar(dados);

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

    const entregas = resumoDosItens(dados, itens.filter((i) => i.tipo === "atividade").map((i) => i.id));

    return { ...sessao, tema: plano.tema, cor: plano.cor, horario: plano.horario,
             minutos: plano.minutos, plano_titulo: plano.titulo,
             itens: itens.map((i) => ({ ...i, entrega: entregas[i.id] || null })) };

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

    // feito numa sessão de pendências conta pro conteúdo de onde o item veio
    if (estado === "feito") {
        const conteudo = sessao.extra ? dados.itens.find((i) => i.id === item.origem_id)?.sessao_id : sessao.id;
        if (conteudo) {
            acordarCartoes(conteudo);
            pedirFlashcards(conteudo);
        }
    }

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
            id, nome: p.nome, onde_pegar: p.ondePegar, pede_url: Boolean(p.pedeUrl), pede_chave: Boolean(p.pedeChave),
            conectado: contasConectadas().includes(id)
        }))
    };
}


async function conectarNuvem(provedor, chave, url) {

    if (!PROVEDORES[provedor]) throw new RangeError("Provedor desconhecido.");

    chave = String(chave || "").trim();
    url = String(url || "").trim().replace(/\/+$/, "");

    // o endereço do PC vem como "meu-pc.tail1234.ts.net:8443"
    if (provedor === "pc" && url && !/^https?:\/\//.test(url)) url = `https://${url}`;

    if (PROVEDORES[provedor].pedeChave && !chave) throw new RangeError("Cole a chave que aparece no Kaizen do PC.");

    if (PROVEDORES[provedor].pedeUrl) {
        if (!/^https?:\/\//.test(url)) throw new RangeError("Informe a URL da API (ex.: https://openrouter.ai/api/v1).");
    } else if (chave.length < 20) {
        throw new RangeError("Cole a chave de API completa.");
    }

    let modelos;

    try {
        modelos = await listarModelos(provedor, { chave, url });
    } catch (erro) {
        if (provedor === "pc" && !erro.status) {
            throw new RangeError("Não achei o PC. Confira se ele está ligado com o Kaizen aberto e se o Tailscale está ligado aqui no celular.");
        }
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

    if (!p) throw new ErroIA("Conecte uma IA em \"Onde a IA roda\" (o OpenRouter tem modelos grátis).");

    const { sistema_chat } = await carregarPrompts();
    const mensagens = Array.isArray(corpo.mensagens) ? corpo.mensagens : [];

    if (!mensagens.length) throw new RangeError("Nenhuma mensagem enviada.");

    const historico = perfilTexto(completar(ler()));
    const sistema = historico ? `${sistema_chat}\n\nHistórico de estudos do usuário:\n${historico}` : sistema_chat;

    const resposta = await conversar(p, corpo.modelo || (await statusChat()).modelos[0],
                                     [{ role: "system", content: sistema }, ...mensagens]);

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


async function exportarBackup(leve = false) {

    const dados = completar(ler());

    return {
        app: "kaizen",
        formato: 1,
        criado_em: agora().replace(" ", "T"),
        kanban: { tarefas: lerJson(CHAVE_TAREFAS, []), categorias: lerJson(CHAVE_CATEGORIAS, []) },
        estudos: { planos: dados.planos, sessoes: dados.sessoes, itens: dados.itens,
                   flashcards: dados.flashcards, entregas: leve ? [] : await exportarEntregas(dados),
                   perfil: dados.perfil, pets: dados.pets }
    };

}


async function restaurarBackup(corpo) {

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

        // backup de versão antiga não tem cartões: ficam os daqui que ainda têm sessão
        const antes = completar(ler());
        const ids = new Set(e.sessoes.map((x) => x.id));
        const flashcards = (Array.isArray(e.flashcards) ? e.flashcards : antes.flashcards).filter((f) => ids.has(f.sessao_id));
        // backup de versão antiga não tem entregas: ficam as daqui
        const entregas = await importarEntregas(Array.isArray(e.entregas) ? e.entregas : await exportarEntregas(antes),
                                                new Set(e.itens.map((i) => i.id)));

        gravar({
            seq: { plano: maior(planos), sessao: maior(e.sessoes), item: maior(e.itens), cartao: maior(flashcards),
                   entrega: maior(entregas) },
            planos, sessoes: e.sessoes, itens: e.itens, flashcards, entregas,
            perfil: e.perfil && typeof e.perfil.sobre === "string" ? { sobre: e.perfil.sobre } : antes.perfil,
            pets: e.pets && typeof e.pets === "object" ? e.pets : antes.pets
        });

    }

}



/* =========================================================
   Perfil e flashcards — o mesmo que o estudos.py faz no PC
========================================================= */

const INTERVALOS = [0, 1, 3, 7, 14, 30];   // dias até revisar de novo, por caixa
const JANELA = 14;                         // dias de conteúdo estudado que aparecem

const naFila = new Set();
const falhas = new Map();                  // sessao_id -> { quando, erro }
let fila = Promise.resolve();              // uma geração por vez


function completar(dados) {
    // dados gravados antes dos flashcards
    dados.flashcards ||= [];
    dados.perfil ||= { sobre: "" };
    dados.pets ||= {};
    dados.entregas ||= [];
    dados.seq.cartao ||= dados.flashcards.reduce((m, f) => Math.max(m, f.id), 0);
    return dados;
}


/* Sessão "conta" como estudada se tem item feito, ou se a cópia de um "não fiz" foi feita depois. */
function foiEstudada(dados, sessaoId) {
    return dados.itens.some((i) => i.sessao_id === sessaoId &&
        (i.estado === "feito" || dados.itens.some((c) => c.origem_id === i.id && c.estado === "feito")));
}


function perfilTexto(dados, excluirPlano = null) {

    const linhas = [];

    dados.planos
        .filter((p) => p.status === "pronto" && p.id !== excluirPlano)
        .sort((a, b) => b.id - a.id)
        .slice(0, 8)
        .forEach((plano) => {

            const sessoes = dados.sessoes.filter((s) => s.plano_id === plano.id && !s.extra);

            const feitos = [...new Set(sessoes
                .filter((s) => foiEstudada(dados, s.id))
                .sort((a, b) => a.data.localeCompare(b.data))
                .map((s) => s.topico))].slice(-12);

            const contagem = new Map();
            sessoes.forEach((s) => {
                const n = dados.itens.filter((i) => i.sessao_id === s.id && i.estado === "nao-feito").length;
                if (n) contagem.set(s.topico, (contagem.get(s.topico) || 0) + n);
            });
            const adiados = [...contagem].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t);

            const respostas = (plano.respostas || []).map((r) => String(r.resposta || "").trim()).filter(Boolean);

            let linha = `- ${plano.tema}`;
            if (respostas.length) linha += ` (contou: ${respostas.slice(0, 3).join("; ")})`;
            linha += feitos.length ? `: já estudou ${feitos.join(", ")}.` : ": ainda não concluiu nenhuma sessão.";
            if (adiados.length) linha += ` Adiou: ${adiados.join(", ")}.`;
            linhas.push(linha);

        });

    const atividades = linhaDoPerfil(dados);
    if (atividades) linhas.push(atividades);

    const sobre = dados.perfil?.sobre;
    if (sobre) linhas.push(`- O que a pessoa contou sobre si: ${sobre}`);

    return linhas.join("\n");

}


function perfil() {
    const dados = completar(ler());
    return { texto: perfilTexto(dados), sobre: dados.perfil.sobre };
}


function salvarSobre(texto) {
    const dados = completar(ler());
    dados.perfil.sobre = String(texto || "").trim().slice(0, 1500);
    gravar(dados);
    return perfil();
}


function pedidoFlashcards(dados, sessao, plano) {

    const linhas = [`Assunto do plano: ${plano.tema}`, `Tópico da sessão: ${sessao.topico}`];

    if (sessao.objetivo) linhas.push(`Objetivo da sessão: ${sessao.objetivo}`);

    dados.itens.filter((i) => i.sessao_id === sessao.id).forEach((i) => {
        linhas.push(i.tipo === "atividade" ? `Atividade: ${i.descricao || i.titulo}` : `Material estudado: ${i.titulo}`);
    });

    const historico = perfilTexto(dados);
    if (historico) linhas.push("Quem é o estudante (ajuste o nível):\n" + historico);

    return linhas.join("\n");

}


// resposta cortada no meio costuma parar numa palavra de ligação
const CORTADA = /(^|\s)(o|a|os|as|um|uma|de|do|da|dos|das|e|com|para|pra|em|no|na|que|por|ao)$/i;


/* Tira cartão vazio, cortado no meio e repetido. */
function cartoesBons(lista) {

    const vistos = new Set();

    return (Array.isArray(lista) ? lista : [])
        .map((c) => ({ frente: String(c?.frente || "").trim(), verso: String(c?.verso || "").trim() }))
        .filter((c) => {
            const chave = c.frente.toLowerCase();
            if (c.frente.length < 8 || c.verso.split(/\s+/).length < 4 || CORTADA.test(c.verso) ||
                /[,"]$/.test(c.verso) || vistos.has(chave)) return false;
            vistos.add(chave);
            return true;
        })
        .slice(0, 8);

}


async function gerarFlashcards(sessaoId, forcar) {

    let dados = completar(ler());
    const sessao = dados.sessoes.find((s) => s.id === sessaoId);
    if (!sessao) return;
    if (!forcar && dados.flashcards.some((f) => f.sessao_id === sessaoId)) return;

    const plano = dados.planos.find((p) => p.id === sessao.plano_id);
    const { sistema_flashcards, esquema_flashcards } = await carregarPrompts();
    const pedido = pedidoFlashcards(dados, sessao, plano);

    let novos = [];

    if (plano.motor === "demo") {
        // demonstração: cartões simples tirados do próprio plano, sem IA
        novos = cartoesBons([
            { frente: `Qual o objetivo de estudar "${sessao.topico}"?`, verso: sessao.objetivo || sessao.topico },
            ...dados.itens.filter((i) => i.sessao_id === sessao.id && i.tipo === "atividade")
                .map((i) => ({ frente: `Como praticar ${sessao.topico.toLowerCase()}?`, verso: i.descricao || i.titulo }))
        ]);
    } else {
        let motor = plano.motor;
        // modelo pequeno às vezes devolve lista vazia ou cartão cortado: tenta mais uma vez
        for (let tentativa = 0; tentativa < 2 && novos.length < 3; tentativa++) {
            let resposta;
            try {
                resposta = await gerarJson(motor, sistema_flashcards, pedido, esquema_flashcards);
            } catch (erro) {
                // a conta do plano foi removida: vai a IA preferida de agora
                const padrao = (await motores()).padrao;
                if (motor !== plano.motor || !padrao || padrao === motor) throw erro;
                motor = padrao;
                resposta = await gerarJson(motor, sistema_flashcards, pedido, esquema_flashcards);
            }
            novos = cartoesBons(resposta.cartoes);
        }
    }

    if (!novos.length) throw new ErroIA("A IA não devolveu cartões.");

    dados = completar(ler());  // pode ter mudado enquanto a IA respondia
    if (forcar) dados.flashcards = dados.flashcards.filter((f) => f.sessao_id !== sessaoId);
    else if (dados.flashcards.some((f) => f.sessao_id === sessaoId)) return;

    novos.forEach((c) => dados.flashcards.push({ id: novoId(dados, "cartao"), sessao_id: sessaoId, ...c,
                                                 caixa: 0, revisar_em: hojeIso() }));
    gravar(dados);

}


function pedirFlashcards(sessaoId, forcar = false) {

    if (naFila.has(sessaoId)) return;

    const falha = falhas.get(sessaoId);
    if (falha && !forcar && Date.now() - falha.quando < 600000) return;

    naFila.add(sessaoId);
    falhas.delete(sessaoId);

    fila = fila
        .then(() => gerarFlashcards(sessaoId, forcar))
        .catch((erro) => falhas.set(sessaoId, { quando: Date.now(), erro: erro.message || String(erro) }))
        .finally(() => naFila.delete(sessaoId));

}


function listarFlashcards() {

    const dados = completar(ler());
    const hoje = hojeIso();
    const desde = somarDias(hoje, -JANELA);

    const conteudos = dados.sessoes
        .filter((s) => !s.extra)
        .filter((s) => (s.data >= desde && s.data <= hoje && foiEstudada(dados, s.id)) ||
                       dados.flashcards.some((f) => f.sessao_id === s.id && f.revisar_em <= hoje))
        .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id)
        .map((s) => {

            const plano = dados.planos.find((p) => p.id === s.plano_id);
            const deles = dados.flashcards.filter((f) => f.sessao_id === s.id);

            if (!deles.length) pedirFlashcards(s.id);

            const falha = deles.length ? null : falhas.get(s.id);

            return {
                sessao_id: s.id, plano_id: s.plano_id, topico: s.topico, data: s.data,
                tema: plano.tema, plano_titulo: plano.titulo, cor: plano.cor,
                total: deles.length,
                para_hoje: deles.filter((f) => f.revisar_em <= hoje).length,
                situacao: deles.length ? "pronto" : falha ? "erro" : "gerando",
                erro: falha?.erro || null
            };

        });

    return { conteudos, para_hoje: conteudos.reduce((soma, c) => soma + c.para_hoje, 0) };

}


function cartoes(sessaoId = null) {

    const dados = completar(ler());
    const hoje = hojeIso();
    const topico = (id) => dados.sessoes.find((s) => s.id === id)?.topico;
    const data = (id) => dados.sessoes.find((s) => s.id === id)?.data || "";

    if (sessaoId && !dados.flashcards.some((f) => f.sessao_id === sessaoId)) pedirFlashcards(sessaoId);

    const lista = sessaoId
        ? dados.flashcards.filter((f) => f.sessao_id === sessaoId)
            .sort((a, b) => (a.revisar_em > hoje) - (b.revisar_em > hoje) || a.caixa - b.caixa || a.id - b.id)
        : dados.flashcards.filter((f) => f.revisar_em <= hoje)
            .sort((a, b) => a.caixa - b.caixa || data(a.sessao_id).localeCompare(data(b.sessao_id)) || a.id - b.id);

    return lista.map((f) => ({ ...f, topico: topico(f.sessao_id) }));

}


function salvarPets(estado) {
    if (!estado || typeof estado !== "object" || Array.isArray(estado)) throw new RangeError("Estado dos pets inválido.");
    const dados = completar(ler());
    dados.pets = estado;
    gravar(dados);
    return estado;
}


function responderCartao(id, acertou) {

    const dados = completar(ler());
    const cartao = dados.flashcards.find((f) => f.id === id);

    if (!cartao) return null;

    cartao.caixa = acertou ? Math.min(cartao.caixa + 1, INTERVALOS.length - 1) : 0;
    cartao.revisar_em = somarDias(hojeIso(), INTERVALOS[cartao.caixa]);

    gravar(dados);
    return { ...cartao };

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
        if (area === "backup" && metodo === "GET") return json(200, await exportarBackup(url.searchParams.has("leve")));
        if (area === "backup" && metodo === "POST") { await restaurarBackup(corpo); return json(200, { ok: true }); }
        if (area === "ia" && recurso === "status") return json(200, await statusChat());

        if (area === "ia" && recurso === "servidores") {
            if (metodo === "GET" && !ident) return json(200, await listaDestinos());
            if (metodo === "POST" && ident === "nuvem") return json(200, { servidores: await conectarNuvem(acao, corpo.chave, corpo.url) });
            if (metodo === "POST" && acao === "preferido") { definirPreferido(ident); return json(200, { servidores: await destinosComStatus() }); }
            if (metodo === "DELETE" && ident) { removerConta(ident); return json(200, { servidores: await destinosComStatus() }); }
            if (metodo === "POST" && !ident) throw new RangeError("No celular a IA roda só na nuvem: conecte o OpenRouter (grátis), o Claude ou outra.");
        }

        if (area === "estudos") {
            if (metodo === "GET" && recurso === "motores") return json(200, await motores());
            if (metodo === "GET" && recurso === "planos" && !ident) return json(200, { planos: listarPlanos() });
            if (metodo === "GET" && recurso === "planos") return json(200, { plano: obterPlano(id) });
            if (metodo === "GET" && recurso === "calendario") return json(200, { sessoes: calendario(url.searchParams.get("inicio"), url.searchParams.get("fim")) });
            if (metodo === "GET" && recurso === "sessoes") return json(200, { sessao: obterSessao(id) });
            if (metodo === "POST" && recurso === "perguntas") return json(200, { perguntas: await perguntas(String(corpo.tema || "").trim(), corpo.motor, corpo.continua_de) });
            if (metodo === "POST" && recurso === "planos") return json(201, { plano: criarPlano(corpo) });
            if (metodo === "POST" && recurso === "importar-plano") return json(201, { plano: await importarPlano(corpo) });
            if (metodo === "POST" && recurso === "sessoes" && acao === "adiar") return json(200, { sessao: adiarPendentes(id) });
            if (metodo === "PATCH" && recurso === "itens") return json(200, { sessao: marcarItem(id, corpo.estado) });
            if (metodo === "DELETE" && recurso === "planos") { excluirPlano(id); return json(200, { ok: true }); }

            if (metodo === "GET" && recurso === "perfil") return json(200, perfil());
            if (metodo === "POST" && recurso === "perfil") return json(200, salvarSobre(corpo.sobre));
            if (metodo === "GET" && recurso === "flashcards" && !ident) return json(200, listarFlashcards());
            if (metodo === "GET" && recurso === "flashcards") return json(200, { cartoes: cartoes(id) });
            if (metodo === "GET" && recurso === "revisao") return json(200, { cartoes: cartoes() });
            if (metodo === "POST" && recurso === "flashcards" && acao === "refazer") { pedirFlashcards(id, true); return json(202, { ok: true }); }
            if (metodo === "GET" && recurso === "pets") return json(200, { dados: completar(ler()).pets });
            if (metodo === "POST" && recurso === "pets") return json(200, { dados: salvarPets(corpo.dados) });
            if (metodo === "GET" && recurso === "entregas" && url.searchParams.has("planos")) {
                return json(200, { entregas: dosPlanos(url.searchParams.get("planos").split(",").map(Number)) });
            }
            if (metodo === "GET" && recurso === "entregas" && !ident) {
                return json(200, { entregas: await listarEntregas(Number(url.searchParams.get("item"))), corretor: await sobreCorretor() });
            }
            if (metodo === "GET" && recurso === "entregas") return json(200, { entrega: await obterEntrega(id) });
            if (metodo === "POST" && recurso === "entregas" && !ident) return json(201, { entrega: await criarEntrega(corpo) });
            if (metodo === "POST" && recurso === "entregas" && acao === "corrigir") return json(200, { entrega: await corrigirDeNovo(id) });
            if (metodo === "DELETE" && recurso === "entregas") { await excluirEntrega(id); return json(200, { ok: true }); }
            if (metodo === "PATCH" && recurso === "cartoes") {
                const cartao = responderCartao(id, corpo.acertou === true);
                return json(cartao ? 200 : 404, { cartao });
            }
        }

        // /api/tarefas e o resto: sem servidor, o kanban usa o modo estático dele
        return json(404, { erro: "Rota não encontrada" });

    } catch (erro) {

        if (erro instanceof ErroIA) return json(502, { erro: erro.message });
        return json(400, { erro: erro.message || String(erro) });

    }

}


ligarEntregas({ ler: () => completar(ler()), gravar, agora, motores, gerarJson, marcarItem,
                prompts: carregarPrompts, nomeProvedor: (p) => PROVEDORES[p]?.nome || p });
