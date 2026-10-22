/* =========================================================
   NUVEM / ENTREGAS — o entregas.py de bolso
   ---------------------------------------------------------
   Entrega das atividades e correção pela IA, sem o PC. Os
   dados da entrega (resposta escrita, nota, correção, nome
   dos arquivos) ficam junto dos planos; o conteúdo dos
   arquivos vai pro IndexedDB do navegador, que aguenta bem
   mais que os ~5 MB do localStorage.

   As regras (quem corrige, limites, leitura do GitHub) são
   as mesmas do entregas.py. O servidor.js passa o que este
   módulo precisa em ligarEntregas(), pra não importar um ao
   outro em círculo.
========================================================= */


const ARQUIVOS_MAX = 10;
const ARQUIVO_MAX = 500_000;
const TEXTO_MAX = 50_000;
const PARA_IA = 200_000;
const GITHUB_ARQUIVOS = 15;
const GITHUB_TOTAL = 120_000;

const FORTES = /claude|sonnet|opus|haiku|gpt-?4|gpt-?5|chatgpt|(^|[/:\-])o[1-9]\b|gemini-(1\.5-pro|[2-9])|deepseek|grok|kimi|glm-?4|mistral-(large|medium)|command-r-plus|llama-?3\.[13]-?(70|405)b|llama-?4|qwen.*(max|plus)|gpt-oss/i;
const TAMANHO = /(\d+(?:\.\d+)?)b\b/i;
const MINIMO_B = 14;

let deps = null;
let fila = Promise.resolve();   // uma correção por vez



/* ---------- conteúdo dos arquivos (IndexedDB) ---------- */

let banco = null;

function abrirBanco() {
    banco ||= new Promise((resolver, rejeitar) => {
        const pedido = indexedDB.open("kaizen-entregas", 1);
        pedido.onupgradeneeded = () => pedido.result.createObjectStore("arquivos");
        pedido.onsuccess = () => resolver(pedido.result);
        pedido.onerror = () => rejeitar(pedido.error);
    });
    return banco;
}


async function guardados(modo, acao) {
    const db = await abrirBanco();
    return new Promise((resolver, rejeitar) => {
        const transacao = db.transaction("arquivos", modo);
        const pedido = acao(transacao.objectStore("arquivos"));
        transacao.oncomplete = () => resolver(pedido?.result);
        transacao.onerror = () => rejeitar(transacao.error);
    });
}

const lerConteudo = (id) => guardados("readonly", (s) => s.get(id)).catch(() => null);
const gravarConteudo = (id, arquivos) => guardados("readwrite", (s) => s.put(arquivos, id));
const apagarConteudo = (id) => guardados("readwrite", (s) => s.delete(id)).catch(() => null);


// fica pra sempre (o navegador não limpa sozinho quando falta espaço), se ele deixar
navigator.storage?.persist?.().catch(() => null);



/* ---------- quem corrige ---------- */

export function podeCorrigir(motor) {
    if (!motor || motor === "demo") return motor === "demo";
    if (motor.startsWith("nuvem@kaizen:")) return true;   // a IA do Kaizen escolhe um modelo bom sozinha
    const modelo = (motor.match(/^nuvem@[^:]+:(.+)$/) || [])[1] || motor;
    const tamanho = modelo.match(TAMANHO);
    if (tamanho && Number(tamanho[1]) < MINIMO_B) return false;
    return FORTES.test(modelo) || Boolean(tamanho);
}


async function corretor(motorDoPlano) {
    if (podeCorrigir(motorDoPlano)) return motorDoPlano;
    const { motores } = await deps.motores();
    return motores.find((m) => podeCorrigir(m.id))?.id || null;
}


function nomeDoMotor(motor) {
    if (motor === "demo") return "IA de demonstração";
    const [, provedor, modelo] = (motor || "").match(/^nuvem@([^:]+):(.+)$/) || [];
    return provedor ? `${deps.nomeProvedor(provedor)} (${modelo})` : motor;
}


export async function sobreCorretor() {
    const motor = new URLSearchParams(location.search).has("demo") ? "demo" : await corretor(null);
    return { pode: Boolean(motor), motor, nome: motor ? nomeDoMotor(motor) : null };
}



/* ---------- guardar, listar, apagar ---------- */

function limparArquivos(arquivos) {
    if (!Array.isArray(arquivos)) throw new RangeError("Arquivos inválidos.");
    if (arquivos.length > ARQUIVOS_MAX) throw new RangeError(`No máximo ${ARQUIVOS_MAX} arquivos por entrega.`);
    return arquivos.map((a) => {
        const nome = String(a?.nome || "").trim().slice(0, 120) || "arquivo.txt";
        const conteudo = String(a?.conteudo || "");
        if (conteudo.includes("\u0000")) throw new RangeError(`"${nome}" não é um arquivo de texto. Mande o código ou o texto, ou um link.`);
        if (conteudo.length > ARQUIVO_MAX) throw new RangeError(`"${nome}" passa de ${ARQUIVO_MAX / 1000} mil caracteres. Projeto grande: mande o link do GitHub.`);
        return { nome, conteudo, tamanho: new Blob([conteudo]).size };
    });
}


async function completa(e) {
    const conteudos = (await lerConteudo(e.id)) || [];
    const arquivos = e.arquivos.map((a) => {
        const c = conteudos.find((x) => x.nome === a.nome);
        return c ? { ...a, conteudo: c.conteudo, no_pc: undefined } : a;
    });
    return { ...e, arquivos, corretor: e.motor ? nomeDoMotor(e.motor) : null };
}


export async function listar(itemId) {
    const lista = (deps.ler().entregas || []).filter((e) => e.item_id === itemId).sort((a, b) => b.id - a.id);
    return Promise.all(lista.map(completa));
}


export async function obter(id) {
    const e = (deps.ler().entregas || []).find((x) => x.id === id);
    return e ? completa(e) : null;
}


// sem o conteúdo dos arquivos, pro histórico da ficha do pet
export function dosPlanos(planoIds) {
    const dados = deps.ler();
    const sessoes = new Map(dados.sessoes.filter((s) => planoIds.includes(s.plano_id)).map((s) => [s.id, s]));
    const itens = new Map(dados.itens.filter((i) => sessoes.has(i.sessao_id)).map((i) => [i.id, i]));
    return (dados.entregas || []).filter((e) => itens.has(e.item_id)).sort((a, b) => a.id - b.id).map((e) => {
        const item = itens.get(e.item_id);
        const sessao = sessoes.get(item.sessao_id);
        return { id: e.id, item_id: e.item_id, criado_em: e.criado_em, situacao: e.situacao, nota: e.nota,
                 correcao: e.correcao, link: e.link, sessao_id: sessao.id, topico: sessao.topico, atividade: item.descricao };
    });
}


export function resumoDosItens(dados, itemIds) {
    const resumo = {};
    (dados.entregas || []).filter((e) => itemIds.includes(e.item_id)).sort((a, b) => a.id - b.id).forEach((e) => {
        resumo[e.item_id] = { entregas: (resumo[e.item_id]?.entregas || 0) + 1, nota: e.nota, situacao: e.situacao };
    });
    return resumo;
}


export async function criar(corpo) {

    const itemId = Number(corpo.item_id);
    const texto = String(corpo.texto || "").trim().slice(0, TEXTO_MAX);
    const link = String(corpo.link || "").trim().slice(0, 500);
    const arquivos = limparArquivos(corpo.arquivos || []);

    if (link && !/^https?:\/\//.test(link)) throw new RangeError("O link precisa começar com http:// ou https://.");
    if (!texto && !link && !arquivos.length) throw new RangeError("Escreva a resposta, anexe um arquivo ou cole um link.");

    let dados = deps.ler();
    const item = dados.itens.find((i) => i.id === itemId);
    if (!item) throw new RangeError("Atividade não encontrada.");
    const sessao = dados.sessoes.find((s) => s.id === item.sessao_id);
    const plano = dados.planos.find((p) => p.id === sessao.plano_id);
    const motor = await corretor(plano.motor);

    dados = deps.ler();   // pode ter mudado enquanto olhava as IAs
    dados.entregas ||= [];
    dados.seq.entrega ||= dados.entregas.reduce((m, e) => Math.max(m, e.id), 0);
    const entrega = {
        id: ++dados.seq.entrega, item_id: itemId, texto, link,
        arquivos: arquivos.map(({ nome, tamanho }) => ({ nome, tamanho })),
        criado_em: deps.agora().replace(" ", "T"), situacao: motor ? "na-fila" : "sem-corretor",
        nota: null, correcao: null, motor, erro: null
    };
    await gravarConteudo(entrega.id, arquivos.map(({ nome, conteudo }) => ({ nome, conteudo })));
    dados.entregas.push(entrega);
    deps.gravar(dados);

    deps.marcarItem(itemId, "feito");   // entregou = fez (e já puxa os flashcards da sessão)
    if (motor) enfileirar(entrega.id);
    return obter(entrega.id);

}


export async function corrigirDeNovo(id) {

    const dados = deps.ler();
    const e = (dados.entregas || []).find((x) => x.id === id);
    if (!e) return null;
    if (["na-fila", "corrigindo"].includes(e.situacao)) return obter(id);

    const item = dados.itens.find((i) => i.id === e.item_id);
    const plano = dados.planos.find((p) => p.id === dados.sessoes.find((s) => s.id === item?.sessao_id)?.plano_id);
    const motor = await corretor(plano?.motor);
    if (!motor) throw new RangeError("Nenhuma IA conectada é forte o bastante pra corrigir. Conecte uma em \"Onde a IA roda\".");

    atualizar(id, { situacao: "na-fila", motor, erro: null });
    enfileirar(id);
    return obter(id);

}


export async function excluir(id) {
    const dados = deps.ler();
    dados.entregas = (dados.entregas || []).filter((e) => e.id !== id);
    deps.gravar(dados);
    await apagarConteudo(id);
}


function atualizar(id, mudancas) {
    const dados = deps.ler();
    const e = (dados.entregas || []).find((x) => x.id === id);
    if (e) Object.assign(e, mudancas);
    deps.gravar(dados);
}



/* ---------- correção ---------- */

function enfileirar(id) {
    fila = fila
        .then(() => corrigir(id))
        .catch((erro) => atualizar(id, { situacao: "erro", erro: String(erro.message || erro).slice(0, 400) }));
}


async function pedido(dados, e) {

    const item = dados.itens.find((i) => i.id === e.item_id);
    const sessao = dados.sessoes.find((s) => s.id === item.sessao_id);
    const plano = dados.planos.find((p) => p.id === sessao.plano_id);

    const partes = [`Assunto do plano: ${plano.tema}`, `Tópico da sessão: ${sessao.topico}`];
    if (sessao.objetivo) partes.push(`Objetivo da sessão: ${sessao.objetivo}`);
    partes.push(`Enunciado da atividade: ${item.descricao || item.titulo}`, "\n=== ENTREGA DO ESTUDANTE ===");

    let sobra = PARA_IA;
    if (e.texto) {
        partes.push(`Resposta escrita:\n${e.texto.slice(0, sobra)}`);
        sobra -= e.texto.length;
    }
    for (const a of e.arquivos) {
        if (!a.conteudo) continue;
        if (sobra <= 0) { partes.push(`(arquivo ${a.nome} ficou de fora: a entrega passou do tamanho que a IA lê)`); continue; }
        partes.push(`Arquivo ${a.nome}:\n\`\`\`\n${a.conteudo.slice(0, sobra)}\n\`\`\``);
        sobra -= a.conteudo.length;
    }
    if (e.link) {
        partes.push(`Link entregue: ${e.link}`);
        const lido = sobra > 0 ? await lerGithub(e.link) : "";
        partes.push(lido ? lido.slice(0, sobra) : "(não deu pra ler o conteúdo do link: avalie pelo resto da entrega)");
    }
    return partes.join("\n\n");

}


async function corrigir(id) {

    const e = await obter(id);
    if (!e || e.situacao !== "na-fila") return;
    atualizar(id, { situacao: "corrigindo" });

    let correcao;
    if (e.motor === "demo") {
        await new Promise((r) => setTimeout(r, 2500));
        correcao = {
            nota: 8, resumo: "Boa entrega! (Esta é uma correção de demonstração: com uma IA conectada, ela lê o que você mandou de verdade.)",
            acertos: ["Seguiu o que a atividade pediu", "Organizou bem a resposta"],
            erros: ["Faltou testar um caso extremo"], como_melhorar: ["Teste com valores pequenos antes de entregar"],
            dificuldades: ["casos extremos"]
        };
    } else {
        const { sistema_correcao, esquema_correcao } = await deps.prompts();
        const texto = await pedido(deps.ler(), e);
        correcao = limparCorrecao(await deps.gerarJson(e.motor, sistema_correcao, texto, esquema_correcao));
    }
    atualizar(id, { situacao: "corrigida", nota: correcao.nota, correcao, erro: null });

}


function limparCorrecao(dados) {
    const lista = (chave, maximo) => (dados[chave] || []).map((x) => String(x).trim()).filter(Boolean).slice(0, maximo);
    const nota = Math.round(Number(dados.nota));
    if (!Number.isFinite(nota)) throw new Error("A IA não deu uma nota.");
    return { nota: Math.max(0, Math.min(10, nota)), resumo: String(dados.resumo || "").trim(),
             acertos: lista("acertos", 4), erros: lista("erros", 6), como_melhorar: lista("como_melhorar", 4),
             dificuldades: lista("dificuldades", 3).map((d) => d.slice(0, 40)) };
}


// o que o perfil conta pra IA sobre as atividades corrigidas (igual ao estudos.perfil_texto)
export function linhaDoPerfil(dados) {
    const corrigidas = (dados.entregas || []).filter((e) => e.situacao === "corrigida").sort((a, b) => b.id - a.id).slice(0, 20);
    if (!corrigidas.length) return "";
    const contagem = new Map();
    corrigidas.forEach((e) => (e.correcao?.dificuldades || []).forEach((d) => {
        contagem.set(d.toLowerCase(), (contagem.get(d.toLowerCase()) || 0) + 1);
    }));
    const media = corrigidas.reduce((s, e) => s + e.nota, 0) / corrigidas.length;
    let linha = `- Atividades corrigidas recentemente: nota média ${media.toFixed(1)}/10 em ${corrigidas.length} entregas.`;
    if (contagem.size) {
        const maiores = [...contagem].sort((a, b) => b[1] - a[1]).slice(0, 6);
        linha += ` Mostrou dificuldade em: ${maiores.map(([d, n]) => (n > 1 ? `${d} (${n}x)` : d)).join(", ")}.` +
                 " Reforce esses pontos com explicação e prática.";
    }
    return linha;
}



/* ---------- link do GitHub ---------- */

const GITHUB = /^https?:\/\/(www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/(tree|blob)\/([^/]+)(?:\/(.*))?)?\/?$/;
const CODIGO = /\.(py|js|jsx|ts|tsx|java|kt|c|h|cpp|hpp|cs|go|rs|rb|php|swift|dart|sql|html|css|scss|vue|svelte|md|txt|json|yml|yaml|sh|ipynb)$/i;
const IGNORAR = /(^|\/)(node_modules|dist|build|vendor|venv|\.venv|\.git|__pycache__|target|bin|obj)\/|\.min\.|package-lock\.json|yarn\.lock|pnpm-lock|\.lock$/i;


async function baixar(url) {
    const resposta = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    return resposta.text();
}


export async function lerGithub(url) {

    const m = url.trim().match(GITHUB);
    if (!m) return "";
    const [, , dono, repo, tipo, refDoLink, caminho = ""] = m;
    const raw = (ref, arq) => `https://raw.githubusercontent.com/${dono}/${repo}/${ref}/${arq.split("/").map(encodeURIComponent).join("/")}`;

    try {
        if (tipo === "blob") return `Arquivo ${caminho} (do GitHub):\n\`\`\`\n${(await baixar(raw(refDoLink, caminho))).slice(0, GITHUB_TOTAL)}\n\`\`\``;
        const ref = refDoLink || "HEAD";
        const arvore = JSON.parse(await baixar(`https://api.github.com/repos/${dono}/${repo}/git/trees/${ref}?recursive=1`));
        const arquivos = (arvore.tree || [])
            .filter((a) => a.type === "blob" && a.path.startsWith(caminho) && CODIGO.test(a.path) && !IGNORAR.test(a.path) && (a.size || 0) < 60_000)
            // README primeiro, depois os mais rasos e menores
            .sort((a, b) => (!/^readme/i.test(a.path.split("/").pop()) - !/^readme/i.test(b.path.split("/").pop()))
                || a.path.split("/").length - b.path.split("/").length || (a.size || 0) - (b.size || 0));

        const partes = [`Repositório ${dono}/${repo} (${arquivos.length} arquivos de código/texto):`];
        let total = 0;
        for (const a of arquivos.slice(0, GITHUB_ARQUIVOS)) {
            if (total >= GITHUB_TOTAL) break;
            const conteudo = (await baixar(raw(ref, a.path))).slice(0, GITHUB_TOTAL - total);
            partes.push(`Arquivo ${a.path}:\n\`\`\`\n${conteudo}\n\`\`\``);
            total += conteudo.length;
        }
        return partes.length > 1 ? partes.join("\n\n") : "";
    } catch (erro) {
        return "";
    }

}



/* ---------- backup ---------- */

// com o conteúdo dos arquivos, pro backup e pra sincronia
export async function exportar(dados) {
    return Promise.all((dados.entregas || []).map(async (e) => {
        const { corretor: _, ...resto } = await completa(e);
        return resto;
    }));
}


/* Grava as entregas do backup. Arquivo que veio só com o nome (ficou no PC) mantém o
   conteúdo que já estava aqui, se havia. Devolve a lista pra ir junto dos planos. */
export async function importar(entregas, itensValidos) {

    const lista = [];
    for (const e of entregas) {
        if (!itensValidos.has(e.item_id)) continue;
        const aqui = (await lerConteudo(e.id)) || [];
        const conteudos = (e.arquivos || []).map((a) => a.conteudo != null
            ? { nome: a.nome, conteudo: a.conteudo }
            : aqui.find((x) => x.nome === a.nome)).filter(Boolean);
        await gravarConteudo(e.id, conteudos);
        const situacao = ["na-fila", "corrigindo"].includes(e.situacao) ? "erro" : e.situacao;
        lista.push({
            ...e, situacao, erro: situacao === "erro" && e.situacao !== "erro" ? "A correção não terminou no outro aparelho." : e.erro,
            arquivos: (e.arquivos || []).map((a) => ({ nome: a.nome, tamanho: a.tamanho,
                                                      ...(conteudos.some((c) => c.nome === a.nome) ? {} : { no_pc: true }) }))
        });
    }
    return lista;

}



/* ---------- ligação com o servidor.js ---------- */

export function ligarEntregas(dependencias) {
    deps = dependencias;
    // a fila vive na página: o que estava nela quando a aba fechou não vai terminar
    const dados = deps.ler();
    let mudou = false;
    (dados.entregas || []).forEach((e) => {
        if (["na-fila", "corrigindo"].includes(e.situacao)) {
            Object.assign(e, { situacao: "erro", erro: "O app fechou no meio da correção." });
            mudou = true;
        }
    });
    if (mudou) deps.gravar(dados);
}
