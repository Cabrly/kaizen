/* =========================================================
   NUVEM / IA — Claude, Gemini, ChatGPT e compatíveis com OpenAI
   ---------------------------------------------------------
   Usado quando o Kaizen roda sem servidor (celular, site
   estático). As chamadas saem direto do navegador, com a
   chave que a pessoa colou — ela fica só neste aparelho.
========================================================= */


const CHAVE_CONFIG = "kaizen.nuvem.config.v1";


// os grátis primeiro: é assim que aparecem na tela
export const PROVEDORES = {
    gemini: {
        nome: "Gemini (Google)",
        ondePegar: "https://aistudio.google.com/apikey"
    },
    openrouter: {
        nome: "OpenRouter (modelos grátis)",
        ondePegar: "https://openrouter.ai/keys"
    },
    claude: {
        nome: "Claude (Anthropic)",
        ondePegar: "https://platform.claude.com/settings/keys"
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


export class ErroIA extends Error {

    constructor(mensagem, { status = null, espera = null, semCota = false } = {}) {
        super(mensagem);
        this.status = status;     // HTTP
        this.espera = espera;     // segundos que o serviço pediu pra esperar (429)
        this.semCota = semCota;   // 429 porque o modelo não tem cota no plano (grátis)
    }

}


/*
    O 429 do Gemini vem com o motivo: RetryInfo (quanto esperar) e
    QuotaFailure (qual cota). "limit: 0" ou cota 0 = esse modelo não tem
    uso gratuito — esperar não adianta, tem que trocar de modelo.
*/
function lerLimite(erro) {

    const detalhes = Array.isArray(erro?.details) ? erro.details : [];
    const atraso = detalhes.find((d) => String(d["@type"]).endsWith("RetryInfo"))?.retryDelay;
    const cotas = detalhes.filter((d) => String(d["@type"]).endsWith("QuotaFailure")).flatMap((d) => d.violations || []);

    return {
        espera: atraso ? parseFloat(atraso) : null,
        semCota: /limit:\s*0\b/.test(erro?.message || "") || cotas.some((v) => String(v.quotaValue) === "0")
    };

}


/*
    API do Claude: chamada direta do navegador precisa do header
    anthropic-dangerous-direct-browser-access (a chave é da própria
    pessoa e fica no aparelho dela, então tudo bem).
*/
const CLAUDE_API = "https://api.anthropic.com/v1";

// modelos que aceitam fallbacks: "default" — se o Claude recusar por
// segurança, a API refaz o pedido em outro modelo em vez de devolver a recusa
const CLAUDE_COM_FALLBACK = ["claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"];


function cabecalhosClaude(conta) {
    return {
        "x-api-key": conta.chave,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
    };
}



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
            throw new ErroIA(`${resposta.status}: ${mensagem || resposta.statusText}`,
                             { status: resposta.status, ...(resposta.status === 429 ? lerLimite(erro) : {}) });
        }

        return dados;

    } catch (erro) {

        if (erro instanceof ErroIA) throw erro;
        throw new ErroIA(erro.name === "AbortError" ? "A IA demorou demais pra responder." : "Sem conexão com o serviço de IA.");

    } finally {

        clearTimeout(relogio);

    }

}


const OPENROUTER_API = "https://openrouter.ai/api/v1";


function baseOpenAI(provedor, conta) {
    if (provedor === "openai") return "https://api.openai.com/v1";
    if (provedor === "openrouter") return OPENROUTER_API;
    return (conta.url || "").replace(/\/+$/, "");
}


function autorizacao(conta) {
    return conta.chave ? { Authorization: `Bearer ${conta.chave}` } : {};
}



/* ---------- modelos ---------- */

export async function listarModelos(provedor, conta) {

    if (provedor === "claude") {
        // a API já devolve os mais novos primeiro
        const dados = await pedir(`${CLAUDE_API}/models?limit=100`, { cabecalhos: cabecalhosClaude(conta) });
        return (dados.data || []).map((m) => m.id).filter((id) => id.startsWith("claude-")).slice(0, 12);
    }

    if (provedor === "gemini") {

        const dados = await pedir(
            `https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(conta.chave)}`);

        const fora = /embedding|image|imagen|banana|veo|tts|live|audio|robotics|computer|vision|aqa/;

        return (dados.models || [])
            .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
            .map((m) => m.name.replace(/^models\//, ""))
            .filter((nome) => nome.includes("gemini") && !fora.test(nome))
            .sort()
            .reverse()
            .slice(0, 8);

    }


    if (provedor === "openrouter") {

        // a lista de modelos deles é pública: valida a chave à parte
        await pedir(`${OPENROUTER_API}/key`, { cabecalhos: autorizacao(conta) });

        const dados = await pedir(`${OPENROUTER_API}/models`);
        const fora = /lyria|content-safety|guard|moderation/;

        // só os grátis; "openrouter/free" escolhe sozinho um grátis disponível
        return (dados.data || [])
            .map((m) => m.id)
            .filter((id) => (id.endsWith(":free") || id === "openrouter/free") && !fora.test(id))
            .sort((a, b) => (b === "openrouter/free") - (a === "openrouter/free") || a.localeCompare(b))
            .slice(0, 20);

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

    if (provedor === "claude") {
        return modelos.includes("claude-opus-5-5") ? "claude-opus-5-5" : modelos[0];
    }

    if (provedor === "openrouter") {
        return modelos.includes("openrouter/free") ? "openrouter/free" : modelos[0];
    }

    if (provedor === "gemini") {
        // o que já funcionou nesta chave (ver conversar: 429 sem cota troca de modelo)
        const conta = lerConfig().contas.gemini || {};
        if (conta.modeloOk && modelos.includes(conta.modeloOk)) return conta.modeloOk;
        const livres = modelos.filter((m) => !(conta.semCota || []).includes(m));
        return livres.find((m) => m.includes("flash") && estavel(m)) || livres[0] || modelos[0];
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


    if (provedor === "claude") {

        const sistema = mensagens.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
        const cabecalhos = cabecalhosClaude(conta);

        const corpo = {
            model: modelo,
            max_tokens: 16000,
            messages: mensagens.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content }))
        };

        if (sistema) corpo.system = sistema;

        if (CLAUDE_COM_FALLBACK.includes(modelo)) {
            corpo.fallbacks = "default";
            cabecalhos["anthropic-beta"] = "server-side-fallback-2026-07-01";
        }

        const dados = await pedir(`${CLAUDE_API}/messages`, { corpo, cabecalhos, tempo: 300000 });

        if (dados.stop_reason === "refusal") {
            throw new ErroIA("O Claude recusou esse pedido. Tente reformular ou use outro modelo.");
        }

        // só os blocos de texto (o raciocínio vem em blocos "thinking", vazios por padrão)
        return (dados.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();

    }


    if (provedor === "gemini") {
        return conversarGemini(modelo, conta, mensagens, formato);
    }


    const corpo = { model: modelo, messages: mensagens };

    // nem todo modelo grátis do OpenRouter aceita response_format; o schema já vai no prompt
    if (formato && provedor !== "openrouter") corpo.response_format = { type: "json_object" };

    const dados = await pedir(`${baseOpenAI(provedor, conta)}/chat/completions`,
                              { corpo, cabecalhos: autorizacao(conta), tempo: 180000 });

    const texto = dados.choices?.[0]?.message?.content || "";

    // alguns modelos (qwen3, deepseek-r1…) soltam o raciocínio antes da resposta
    return texto.includes("</think>") ? texto.split("</think>").pop().trim() : texto.trim();

}



/* ---------- Gemini: troca de modelo quando bate no limite grátis ---------- */

async function chamarGemini(modelo, conta, mensagens, formato) {

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


/*
    Ordem de tentativa quando o modelo pedido não tem cota: os "flash"
    estáveis, depois os "flash-lite", depois o resto — os "pro" e os
    "preview" costumam ficar fora do nível gratuito.
*/
function ordemGemini(pedido, conta, modelos) {

    const peso = (m) =>
        (/preview|exp/.test(m) ? 4 : 0) + (/pro/.test(m) ? 2 : 0) + (m.includes("lite") ? 1 : 0) + (m.includes("flash") ? 0 : 3);

    const resto = [...modelos].sort((a, b) => peso(a) - peso(b));

    return [...new Set([pedido, conta.modeloOk, ...resto].filter(Boolean))].slice(0, 6);

}


async function conversarGemini(modelo, conta, mensagens, formato) {

    // modelo que já respondeu "sem cota grátis" não é tentado de novo
    const semCota = new Set(conta.semCota || []);
    let ordem = semCota.has(modelo) && conta.modeloOk ? [conta.modeloOk] : [modelo];
    let ultimo = null;
    let teve403 = false;   // projeto sem acesso pesa mais que "sem cota" na explicação

    for (let i = 0; i < ordem.length; i++) {

        for (let tentativa = 0; tentativa < 2; tentativa++) {

            try {

                const texto = await chamarGemini(ordem[i], conta, mensagens, formato);

                if (ordem[i] !== conta.modeloOk) {
                    // lembra o que funcionou: da próxima vez já começa por ele
                    const config = lerConfig();
                    if (config.contas.gemini) {
                        config.contas.gemini.modeloOk = ordem[i];
                        salvarConfig(config);
                    }
                }

                return texto;

            } catch (erro) {

                // 403 = o projeto da chave não tem acesso a esse modelo; 429 = sem cota/limite.
                // Nos dois casos, vale tentar os outros modelos da chave.
                if (!(erro instanceof ErroIA) || ![403, 429].includes(erro.status)) throw erro;

                ultimo = erro;
                teve403 = teve403 || erro.status === 403;

                if (erro.semCota || erro.status === 403) {
                    const config = lerConfig();
                    const g = config.contas.gemini;
                    if (g) {
                        g.semCota = [...new Set([...(g.semCota || []), ordem[i]])];
                        // guardado à parte: muda a explicação final
                        if (erro.status === 403) g.negado = [...new Set([...(g.negado || []), ordem[i]])];
                        salvarConfig(config);
                    }
                }

                // limite por minuto: espera o que o Google pediu (se for pouco) e tenta de novo
                if (!erro.semCota && erro.espera != null && erro.espera <= 20 && tentativa === 0) {
                    await new Promise((r) => setTimeout(r, erro.espera * 1000 + 300));
                    continue;
                }

                break;

            }

        }

        // na primeira falha, monta a lista de outros modelos da chave pra tentar
        if (ordem.length === 1) {
            try {
                const bloqueados = new Set(lerConfig().contas.gemini?.semCota || []);
                ordem = ordemGemini(ordem[0], conta, await listarModelos("gemini", conta))
                    .filter((m, j) => j === 0 || !bloqueados.has(m));
            } catch (erro) {
                /* sem lista: fica só com o pedido */
            }
        }

    }

    if (teve403 || lerConfig().contas.gemini?.negado?.length) {
        throw new ErroIA(
            "O Google recusou o acesso dessa chave à API do Gemini (o projeto dela está bloqueado). " +
            "Gere uma chave nova em aistudio.google.com/apikey — de preferência num projeto novo, " +
            "pela opção do próprio AI Studio (as chaves de lá começam com \"AIza\").", { status: 403 });
    }

    throw new ErroIA(ultimo?.semCota
        ? "Nenhum modelo do Gemini na sua chave tem uso gratuito liberado agora. " +
          "Confira em aistudio.google.com se a chave é do nível gratuito, ou tente mais tarde."
        : `Limite gratuito do Gemini atingido. Tente de novo ${ultimo?.espera ? `em ${Math.ceil(ultimo.espera)} s` : "daqui a pouco"}.`,
        { status: 429 });

}
