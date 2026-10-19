/* =========================================================
   NUVEM / IA — Gemini, ChatGPT e APIs compatíveis com OpenAI
   ---------------------------------------------------------
   Usado quando o Kaizen roda sem servidor (celular, site
   estático). As chamadas saem direto do navegador, com a
   chave que a pessoa colou — ela fica só neste aparelho.
========================================================= */


const CHAVE_CONFIG = "kaizen.nuvem.config.v1";


export const PROVEDORES = {
    gemini: {
        nome: "Gemini (Google)",
        ondePegar: "https://aistudio.google.com/apikey"
    },
    openai: {
        nome: "ChatGPT (OpenAI)",
        ondePegar: "https://platform.openai.com/api-keys"
    },
    compat: {
        nome: "Compatível com OpenAI",
        ondePegar: "https://openrouter.ai/keys",
        pedeUrl: true
    }
};


export class ErroIA extends Error {}



/* ---------- configuração (chaves, preferido) ---------- */

export function lerConfig() {

    try {
        const dados = JSON.parse(localStorage.getItem(CHAVE_CONFIG) || "{}");
        return { contas: {}, preferido: null, ...dados };
    } catch (erro) {
        return { contas: {}, preferido: null };
    }

}


export function salvarConfig(config) {

    try {
        localStorage.setItem(CHAVE_CONFIG, JSON.stringify(config));
    } catch (erro) {
        throw new ErroIA("Não consegui salvar neste navegador (armazenamento cheio ou bloqueado).");
    }

}


export function contasConectadas() {
    return Object.keys(lerConfig().contas).filter((p) => PROVEDORES[p]);
}



/* ---------- HTTP ---------- */

async function pedir(url, { corpo, cabecalhos = {}, tempo = 120000 } = {}) {

    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), tempo);

    try {

        const resposta = await fetch(url, {
            method: corpo ? "POST" : "GET",
            headers: { ...(corpo ? { "Content-Type": "application/json" } : {}), ...cabecalhos },
            body: corpo ? JSON.stringify(corpo) : undefined,
            signal: controle.signal
        });

        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            const erro = dados.error;
            const mensagem = typeof erro === "string" ? erro : erro?.message;
            throw new ErroIA(`${resposta.status}: ${mensagem || resposta.statusText}`);
        }

        return dados;

    } catch (erro) {

        if (erro instanceof ErroIA) throw erro;
        throw new ErroIA(erro.name === "AbortError" ? "A IA demorou demais pra responder." : "Sem conexão com o serviço de IA.");

    } finally {

        clearTimeout(relogio);

    }

}


function baseOpenAI(provedor, conta) {
    return provedor === "openai" ? "https://api.openai.com/v1" : (conta.url || "").replace(/\/+$/, "");
}


function autorizacao(conta) {
    return conta.chave ? { Authorization: `Bearer ${conta.chave}` } : {};
}



/* ---------- modelos ---------- */

export async function listarModelos(provedor, conta) {

    if (provedor === "gemini") {

        const dados = await pedir(
            `https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(conta.chave)}`);

        const fora = /embedding|image|tts|live|audio|robotics|computer|vision|aqa/;

        return (dados.models || [])
            .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
            .map((m) => m.name.replace(/^models\//, ""))
            .filter((nome) => nome.includes("gemini") && !fora.test(nome))
            .sort()
            .reverse()
            .slice(0, 8);

    }


    const dados = await pedir(`${baseOpenAI(provedor, conta)}/models`, { cabecalhos: autorizacao(conta) });
    const lista = dados.data || [];

    if (provedor === "openai") {

        const fora = /audio|realtime|transcribe|tts|image|search|embedding|moderation|instruct|codex|dall|whisper|babbage|davinci/;

        return lista
            .filter((m) => /^(gpt-|o\d)/.test(m.id) && !fora.test(m.id))
            .sort((a, b) => (b.created || 0) - (a.created || 0))
            .slice(0, 8)
            .map((m) => m.id);

    }

    return lista.map((m) => m.id).sort().slice(0, 40);

}


/*
    Modelo sugerido de cada provedor: o rápido e barato
    (Gemini "flash", OpenAI "mini"), que dá conta de plano
    e conversa.
*/
export function modeloSugerido(provedor, modelos) {

    const estavel = (m) => !/preview|exp|thinking|lite/.test(m);

    if (provedor === "gemini") {
        return modelos.find((m) => m.includes("flash") && estavel(m)) || modelos[0];
    }

    if (provedor === "openai") {
        return modelos.find((m) => m.includes("mini") && estavel(m)) || modelos[0];
    }

    return modelos[0];

}



/* ---------- conversa ---------- */

/*
    mensagens: [{ role: "system" | "user" | "assistant", content }]
    formato: JSON schema (pede JSON e mostra o schema) ou null.
*/
export async function conversar(provedor, modelo, mensagens, formato = null) {

    const conta = lerConfig().contas[provedor];

    if (!conta) {
        throw new ErroIA(`${PROVEDORES[provedor]?.nome || provedor} não está conectado.`);
    }


    if (formato) {
        // nem todo modelo aceita schema estrito; pedir JSON + mostrar o schema funciona em todos
        mensagens = [{
            role: "system",
            content: "Responda SOMENTE com um objeto JSON válido que siga este JSON Schema:\n" + JSON.stringify(formato)
        }, ...mensagens];
    }


    if (provedor === "gemini") {

        const sistema = mensagens.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");

        const corpo = {
            contents: mensagens
                .filter((m) => m.role !== "system")
                .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }))
        };

        if (sistema) corpo.systemInstruction = { parts: [{ text: sistema }] };
        if (formato) corpo.generationConfig = { responseMimeType: "application/json" };

        const dados = await pedir(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent` +
            `?key=${encodeURIComponent(conta.chave)}`,
            { corpo, tempo: 180000 });

        const partes = dados.candidates?.[0]?.content?.parts;

        if (!partes) {
            throw new ErroIA(`O Gemini não respondeu (${dados.promptFeedback?.blockReason || "resposta vazia"}).`);
        }

        return partes.map((p) => p.text || "").join("");

    }


    const corpo = { model: modelo, messages: mensagens };

    if (formato) corpo.response_format = { type: "json_object" };

    const dados = await pedir(`${baseOpenAI(provedor, conta)}/chat/completions`,
                              { corpo, cabecalhos: autorizacao(conta), tempo: 180000 });

    const texto = dados.choices?.[0]?.message?.content || "";

    // alguns modelos (qwen3, deepseek-r1…) soltam o raciocínio antes da resposta
    return texto.includes("</think>") ? texto.split("</think>").pop().trim() : texto.trim();

}
