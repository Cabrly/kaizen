/* Sincronia do Kaizen: guarda um blob criptografado por código.

   O navegador deriva do código de sincronia um id (o nome do cofre) e uma
   chave AES; só o id e o blob cifrado chegam aqui. Sem login: quem tem o
   código tem o cofre.

   GET    /v1/cofre/:id                 → { versao, dados, atualizado_em } | 404
   PUT    /v1/cofre/:id  { base, dados } → grava se a versão atual for "base"
                                           (0 = cofre novo); senão 409 com a atual
   DELETE /v1/cofre/:id                 → apaga o cofre
   GET    /v1/cofre/:id  (Upgrade: websocket)
                                        → conexão ao vivo: manda { versao } ao
                                          conectar e a cada gravação; fecha com
                                          4404 quando o cofre é apagado

   A conexão ao vivo é o que deixa o app sem perguntar de tempos em tempos:
   ela hiberna enquanto nada muda (não conta pedido nem tempo), então cada
   aparelho gasta um pedido ao abrir e só volta a pedir quando há novidade.

   Cada cofre é um Durable Object: um código atende um pedido por vez, então
   dois aparelhos gravando juntos não se atropelam. O blob vai em pedaços de
   1 MB (o armazenamento aceita valores de até 2 MB cada), então um cofre
   aguenta até TAMANHO_MAXIMO, com as entregas das atividades e tudo.

   Estatísticas anônimas (um Durable Object só, "Estatisticas"): contagens por
   dia, sem nenhum identificador de pessoa ou aparelho.

   POST /v1/uso     { abertura, plataforma, versao, novo, semana, mes, eventos }
                    o app manda "abri hoje" uma vez por dia e, de vez em quando,
                    quantas vezes usou cada função (ver js/uso.js)
   POST /v1/visita  { acao, origem }  o site conta visitas e cliques
   GET  /v1/painel  Authorization: Bearer <PAINEL_CHAVE> → as contagens

   IA do Kaizen (grátis pra quem não tem chave própria): o Worker fala com o
   Gemini usando a chave do projeto, guardada como secret (GEMINI_CHAVE, e
   GEMINI_CHAVE_2 de reserva) — elas nunca vão pro navegador nem pro git.

   POST /v1/ia  { mensagens: [{ role, content }], json, usuario }  → { resposta, modelo }
   GET  /v1/ia                                                    → { modelos, ativa }

   Quem escolhe o modelo é o Worker (o pedido não pede um "pro" caro). Só
   aceita o app como origem (ou nenhuma, que é o server.py do PC). Limites:
   10 pedidos por minuto por IP; por dia, IA_POR_USUARIO por aparelho
   ("usuario" = id aleatório que o app sorteia uma vez), IA_POR_IP por IP
   (pega quem sorteia ids novos pra burlar) e IA_COTA_DIA no total — abaixo
   do limite diário da chave. IP e id vão pro contador só como hash do dia;
   a contagem "ia:pedidos" aparece no painel.

   Limite por IP: 120 pedidos por minuto no total, 10 por minuto em cofre que
   não existe (404) e 3 cofres novos por minuto. Quem tenta adivinhar códigos
   bate no segundo logo; o terceiro impede alguém de encher o armazenamento
   da conta criando cofre atrás de cofre. */

import { DurableObject } from "cloudflare:workers";

const TAMANHO_MAXIMO = 32_000_000;  // ~32 MB cifrados e comprimidos; cabe folgado na memória do Worker
const PEDACO = 1_000_000;
const UM_ANO = 365 * 24 * 60 * 60 * 1000;

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
};


function json(status, corpo) {
    return new Response(JSON.stringify(corpo), {
        status,
        headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
    });
}


export class Cofre extends DurableObject {

    async ler() {
        const cofre = await this.ctx.storage.get(["versao", "dados", "atualizado_em", "pedacos"]);
        if (!cofre.has("versao")) return null;
        const { versao, atualizado_em, pedacos } = Object.fromEntries(cofre);
        if (!pedacos) return { versao, atualizado_em, dados: cofre.get("dados") };   // cofre de antes dos pedaços
        const chaves = Array.from({ length: pedacos }, (_, i) => `pedaco:${i}`);
        const partes = await this.ctx.storage.get(chaves);
        return { versao, atualizado_em, dados: chaves.map((c) => partes.get(c)).join("") };
    }

    async gravar(versao, dados, atualizado_em) {
        const pedacos = Math.ceil(dados.length / PEDACO);
        const antes = (await this.ctx.storage.get("pedacos")) || 0;
        const novo = { versao, atualizado_em, pedacos };
        for (let i = 0; i < pedacos; i++) novo[`pedaco:${i}`] = dados.slice(i * PEDACO, (i + 1) * PEDACO);
        // tudo na mesma transação: quem ler nunca pega metade velha, metade nova
        await this.ctx.storage.transaction(async (txn) => {
            await txn.put(novo);
            const sobras = ["dados", ...Array.from({ length: Math.max(0, antes - pedacos) }, (_, i) => `pedaco:${pedacos + i}`)];
            await txn.delete(sobras);
        });
    }

    async fetch(pedido) {

        if (pedido.headers.get("Upgrade") === "websocket") {
            const versao = await this.ctx.storage.get("versao");
            if (!versao) return json(404, { erro: "Nada sincronizado com esse código ainda." });
            const [cliente, servidor] = Object.values(new WebSocketPair());
            this.ctx.acceptWebSocket(servidor);
            // o ping do app é respondido sem acordar o objeto
            this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
            servidor.send(JSON.stringify({ versao }));
            return new Response(null, { status: 101, webSocket: cliente });
        }

        if (pedido.method === "GET") {
            const cofre = await this.ler();
            return cofre ? json(200, cofre) : json(404, { erro: "Nada sincronizado com esse código ainda." });
        }

        if (pedido.method === "DELETE") {
            await this.ctx.storage.deleteAlarm();
            await this.ctx.storage.deleteAll();
            this.avisar(null);
            return json(200, { ok: true });
        }

        if (pedido.method !== "PUT") return json(405, { erro: "Método não permitido." });

        const texto = await pedido.text();
        if (texto.length > TAMANHO_MAXIMO + 1000) return json(413, { erro: "Dados grandes demais pra sincronizar." });

        let corpo;
        try {
            corpo = JSON.parse(texto);
        } catch {
            return json(400, { erro: "JSON inválido." });
        }

        const { base, dados } = corpo || {};
        if (!Number.isInteger(base) || base < 0 || typeof dados !== "string" || !dados) {
            return json(400, { erro: "Esperava { base, dados }." });
        }
        if (dados.length > TAMANHO_MAXIMO) return json(413, { erro: "Dados grandes demais pra sincronizar." });

        const atual = await this.ler();

        if (!atual && base === 0) {
            const ip = pedido.headers.get("CF-Connecting-IP") || "sem-ip";
            if (!(await dentroDoLimite(this.env.LIMITE_NOVOS, ip))) return MUITAS_TENTATIVAS();
        }

        // alguém gravou antes: devolve o que está lá pra o aparelho decidir
        if ((atual?.versao || 0) !== base) {
            return atual ? json(409, atual) : json(404, { erro: "Esse código de sincronia não existe mais." });
        }

        const agora = Date.now();
        await this.gravar(base + 1, dados, agora);
        await this.ctx.storage.setAlarm(agora + UM_ANO);  // cofre esquecido por um ano se apaga sozinho
        this.avisar(base + 1);

        return json(200, { versao: base + 1, atualizado_em: agora });

    }

    async alarm() {
        await this.ctx.storage.deleteAll();
        this.avisar(null);
    }

    // conta a versão nova pros aparelhos conectados (null = o cofre sumiu)
    avisar(versao) {
        for (const ws of this.ctx.getWebSockets()) {
            try {
                if (versao) ws.send(JSON.stringify({ versao }));
                else ws.close(4404, "cofre apagado");
            } catch (erro) {
                /* conexão já caída */
            }
        }
    }

    async webSocketMessage() { /* o app só manda ping, que a resposta automática atende */ }

    async webSocketClose(ws, codigo) {
        try {
            ws.close(codigo === 1005 ? 1000 : codigo, "tchau");
        } catch (erro) {
            /* já fechada */
        }
    }

}


/* ---------- estatísticas anônimas ---------- */

const PLATAFORMAS = ["pc", "navegador", "celular"];
const EVENTOS = ["plano_criado", "plano_importado", "plano_compartilhado", "item_feito", "entrega", "cartao_revisado",
                 "chat", "agenda", "resumo", "acessibilidade"];
const ACOES_SITE = ["visita", "baixar_windows", "baixar_mac", "baixar_linux", "navegador", "demo"];
const ORIGENS = ["direto", "whatsapp", "instagram", "google", "facebook", "x", "linkedin", "github", "youtube",
                 "tiktok", "telegram", "discord", "outro"];
const DIAS_NO_PAINEL = 180;


// o dia no horário de Brasília (sem horário de verão desde 2019)
function hojeBr() {
    return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}


export class Estatisticas extends DurableObject {

    constructor(ctx, env) {
        super(ctx, env);
        ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS contagem (
            dia TEXT NOT NULL, chave TEXT NOT NULL, valor INTEGER NOT NULL, PRIMARY KEY (dia, chave))`);
    }

    somar(mudancas) {
        const dia = hojeBr();
        for (const [chave, valor] of Object.entries(mudancas)) {
            this.ctx.storage.sql.exec(`INSERT INTO contagem (dia, chave, valor) VALUES (?, ?, ?)
                ON CONFLICT (dia, chave) DO UPDATE SET valor = valor + excluded.valor`, dia, chave, valor);
        }
    }

    ler() {
        const desde = new Date(Date.now() - DIAS_NO_PAINEL * 86400000).toISOString().slice(0, 10);
        return this.ctx.storage.sql.exec(
            "SELECT dia, chave, valor FROM contagem WHERE dia >= ? AND chave NOT LIKE 'ia:ip:%' ORDER BY dia", desde).toArray();
    }

    valorDe(dia, chave) {
        return this.ctx.storage.sql.exec("SELECT valor FROM contagem WHERE dia = ? AND chave = ?", dia, chave).toArray()[0]?.valor || 0;
    }

    // confere e já conta, de uma vez (o objeto atende um pedido por vez, então dois juntos não passam do teto)
    // ip e usuario já chegam como hash; os dois ficam em "ia:ip:*", que o painel não mostra
    reservarIA(ip, usuario, { cotaDia, porIp, porUsuario }) {
        const dia = hojeBr();
        const total = this.valorDe(dia, "ia:pedidos");
        if (total >= cotaDia) return "cota-dia";
        if (this.valorDe(dia, `ia:ip:u:${usuario}`) >= porUsuario) return "cota-usuario";
        if (this.valorDe(dia, `ia:ip:${ip}`) >= porIp) return "cota-ip";
        if (total === 0) {
            // primeiro pedido do dia: os contadores de ontem não servem mais
            this.ctx.storage.sql.exec("DELETE FROM contagem WHERE dia < ? AND chave LIKE 'ia:ip:%'", dia);
        }
        this.somar({ "ia:pedidos": 1, [`ia:ip:${ip}`]: 1, [`ia:ip:u:${usuario}`]: 1 });
        return null;
    }

    // o Google falhou: o pedido não gasta a cota de ninguém
    devolverIA(ip, usuario) {
        this.somar({ "ia:pedidos": -1, [`ia:ip:${ip}`]: -1, [`ia:ip:u:${usuario}`]: -1, "ia:falhas": 1 });
    }

}


/* Só passa o que está na lista; número fora do esperado é cortado. Nada da pessoa é guardado. */
function mudancasDoUso(corpo) {

    const m = {};

    if (corpo.abertura === true) {
        const plataforma = PLATAFORMAS.includes(corpo.plataforma) ? corpo.plataforma : "navegador";
        m.ativos = 1;
        m[`ativos:${plataforma}`] = 1;
        if (corpo.novo === true) { m.novos = 1; m[`novos:${plataforma}`] = 1; }
        if (corpo.semana === true) m.semana = 1;
        if (corpo.mes === true) m.mes = 1;
        if (/^\d{1,2}\.\d{1,3}\.\d{1,3}$/.test(corpo.versao || "")) m[`versao:${corpo.versao}`] = 1;
    }

    for (const [nome, vezes] of Object.entries(corpo.eventos && typeof corpo.eventos === "object" ? corpo.eventos : {})) {
        const n = Math.floor(Number(vezes));
        if (EVENTOS.includes(nome) && n > 0) m[`evento:${nome}`] = Math.min(n, 300);
    }

    return m;

}


function mudancasDaVisita(corpo) {
    const acao = ACOES_SITE.includes(corpo.acao) ? corpo.acao : null;
    if (!acao) return {};
    const m = { [`site:${acao}`]: 1 };
    if (acao === "visita") m[`origem:${ORIGENS.includes(corpo.origem) ? corpo.origem : "outro"}`] = 1;
    return m;
}


function chaveCerta(recebida, certa) {
    if (!certa || typeof recebida !== "string" || recebida.length !== certa.length) return false;
    let diferenca = 0;
    for (let i = 0; i < certa.length; i++) diferenca |= recebida.charCodeAt(i) ^ certa.charCodeAt(i);
    return diferenca === 0;
}


async function estatisticas(pedido, env, recurso, ip) {

    const contador = env.ESTATISTICAS.get(env.ESTATISTICAS.idFromName("geral"));

    if (recurso === "painel") {
        if (pedido.method !== "GET") return json(405, { erro: "Método não permitido." });
        const recebida = (pedido.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
        if (!chaveCerta(recebida, env.PAINEL_CHAVE)) {
            await dentroDoLimite(env.LIMITE_ERROS, ip);   // chute de chave gasta a cota de erros
            return json(401, { erro: "Chave do painel errada." });
        }
        return json(200, { hoje: hojeBr(), contagens: await contador.ler() });
    }

    if (pedido.method !== "POST") return json(405, { erro: "Método não permitido." });
    if (!(await dentroDoLimite(env.LIMITE_USO, ip))) return MUITAS_TENTATIVAS();

    let corpo;
    try {
        corpo = JSON.parse((await pedido.text()).slice(0, 4000));
    } catch {
        return json(400, { erro: "JSON inválido." });
    }

    const mudancas = recurso === "uso" ? mudancasDoUso(corpo || {}) : mudancasDaVisita(corpo || {});
    if (Object.keys(mudancas).length) await contador.somar(mudancas);
    return json(200, { ok: true });

}


/* ---------- IA do Kaizen ---------- */

// em ordem: o primeiro que responder (o 3.5-flash responde em ~3 s; o 3.8 é melhor, mas leva ~12 s e vive
// em "alta demanda"). "Alta demanda" (503) ou limite (429) passa pro próximo
const MODELOS_IA = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.5-flash-lite"];
const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_CARACTERES_IA = 260_000;   // a entrega mais o enunciado (o app corta a entrega em 200 mil)

// o app no GitHub Pages, o app de computador e quem testa em casa; sem Origin = server.py do PC
const ORIGENS_IA = /^(https:\/\/cabrly\.github\.io|https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?|tauri:\/\/localhost|https?:\/\/tauri\.localhost)$/;


async function hashDoDia(texto) {
    const bits = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`kaizen-ia:${hojeBr()}:${texto}`));
    return [...new Uint8Array(bits).slice(0, 8)].map((b) => b.toString(16).padStart(2, "0")).join("");
}


function mensagensValidas(corpo) {
    const mensagens = corpo?.mensagens;
    if (!Array.isArray(mensagens) || !mensagens.length || mensagens.length > 80) return null;
    let total = 0;
    for (const m of mensagens) {
        if (!m || !["system", "user", "assistant"].includes(m.role) || typeof m.content !== "string") return null;
        total += m.content.length;
    }
    return total <= MAX_CARACTERES_IA ? mensagens : null;
}


// a principal primeiro; a reserva entra quando a principal é negada (403) ou estoura (429)
const chavesGemini = (env) => [env.GEMINI_CHAVE, env.GEMINI_CHAVE_2].filter(Boolean);


async function chamarGemini(chave, modelo, mensagens, comoJson) {

    const sistema = mensagens.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const corpo = {
        contents: mensagens.filter((m) => m.role !== "system")
            .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        // pensar pouco: plano e flashcards saem bons assim, e bem mais rápido
        generationConfig: { maxOutputTokens: 24000, thinkingConfig: { thinkingLevel: "low" } }
    };
    if (sistema) corpo.systemInstruction = { parts: [{ text: sistema }] };
    if (comoJson) corpo.generationConfig.responseMimeType = "application/json";

    const resposta = await fetch(`${GEMINI_API}/${modelo}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": chave },
        body: JSON.stringify(corpo)
    });
    const dados = await resposta.json().catch(() => ({}));

    // a mensagem do Google não volta pro app (pode citar o projeto da chave)
    if (!resposta.ok) return { status: resposta.status, detalhe: dados.error?.message || "" };

    const partes = dados.candidates?.[0]?.content?.parts;
    if (!partes) return { status: 422, detalhe: dados.promptFeedback?.blockReason || "resposta vazia" };
    // só o texto da resposta (as partes "thought" são o raciocínio)
    return { texto: partes.filter((p) => !p.thought).map((p) => p.text || "").join("") };

}


async function ia(pedido, env, ip) {

    const origem = pedido.headers.get("Origin");
    if (origem && !ORIGENS_IA.test(origem)) return json(403, { erro: "A IA do Kaizen só atende o próprio app." });

    const ativa = chavesGemini(env).length > 0;
    if (pedido.method === "GET") return json(200, { modelos: [MODELOS_IA[0]], ativa });
    if (pedido.method !== "POST") return json(405, { erro: "Método não permitido." });
    if (!ativa) return json(503, { erro: "A IA do Kaizen está desligada no momento." });

    if (!(await dentroDoLimite(env.LIMITE_IA, ip))) {
        return json(429, { erro: "Muitos pedidos seguidos pra IA do Kaizen. Espere um minuto.", motivo: "minuto", espera: 60 });
    }

    const texto = await pedido.text();
    if (texto.length > MAX_CARACTERES_IA * 2) return json(413, { erro: "Pedido grande demais pra IA." });

    let corpo;
    try {
        corpo = JSON.parse(texto);
    } catch {
        return json(400, { erro: "JSON inválido." });
    }
    const mensagens = mensagensValidas(corpo);
    if (!mensagens) return json(400, { erro: "Esperava { mensagens: [{ role, content }] }." });
    if (typeof corpo.usuario !== "string" || !/^[A-Za-z0-9_-]{16,64}$/.test(corpo.usuario)) {
        return json(400, { erro: "Falta o id do aparelho. Atualize o Kaizen." });
    }

    // o id do aparelho é o limite de cada pessoa; o do IP pega quem troca de id pra burlar
    const contador = env.ESTATISTICAS.get(env.ESTATISTICAS.idFromName("geral"));
    const [quem, usuario] = await Promise.all([hashDoDia(ip), hashDoDia(corpo.usuario)]);
    const recusa = await contador.reservarIA(quem, usuario, {
        cotaDia: Number(env.IA_COTA_DIA) || 6500,
        porIp: Number(env.IA_POR_IP) || 300,
        porUsuario: Number(env.IA_POR_USUARIO) || 40
    });

    if (recusa === "cota-dia") {
        return json(429, { erro: "A IA grátis do Kaizen já atendeu todo mundo que dava hoje. Volta amanhã, ou conecte uma chave sua em \"Onde a IA roda\".", motivo: recusa });
    }
    if (recusa) {
        return json(429, { erro: "Você chegou no limite diário da IA grátis do Kaizen. Ela volta amanhã; pra usar mais, conecte uma chave sua em \"Onde a IA roda\".", motivo: recusa });
    }

    let ultimo = null;
    tentativas:
    for (const [n, chave] of chavesGemini(env).entries()) {
        for (const modelo of MODELOS_IA) {
            const r = await chamarGemini(chave, modelo, mensagens, corpo.json === true);
            if (r.texto !== undefined) return json(200, { resposta: r.texto, modelo });
            ultimo = r;
            console.error(`gemini chave ${n + 1} ${modelo}: ${r.status} ${r.detalhe.slice(0, 200)}`);
            if ([401, 403].includes(r.status)) continue tentativas;            // chave negada: vai pra próxima
            if (![429, 500, 503, 504].includes(r.status)) break tentativas;    // erro do pedido: nada resolve
        }
    }

    await contador.devolverIA(quem, usuario);
    if (ultimo.status === 422) return json(422, { erro: "A IA não quis responder esse pedido. Tente reformular." });
    return json(503, { erro: "A IA do Kaizen está sobrecarregada agora. Tente de novo daqui a pouco." });

}


const MUITAS_TENTATIVAS = () => json(429, { erro: "Muitas tentativas. Espere um minuto e tente de novo." });

// IPs que estouraram a cota de erros (por instância do Worker; o limite da Cloudflare cobre o resto)
const bloqueados = new Map();

async function dentroDoLimite(limite, ip) {
    if (!limite) return true;  // sem o binding (wrangler dev antigo), não limita
    const { success } = await limite.limit({ key: ip });
    return success;
}


export default {

    async fetch(pedido, env) {

        if (pedido.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

        const url = new URL(pedido.url);
        const [, versaoApi, recurso, id] = url.pathname.split("/");

        if (url.pathname === "/") return json(200, { app: "kaizen-sync", ok: true });

        if (versaoApi === "v1" && recurso === "ia" && !id) {
            const ip = pedido.headers.get("CF-Connecting-IP") || "sem-ip";
            if ((bloqueados.get(ip) || 0) > Date.now()) return MUITAS_TENTATIVAS();
            try {
                return await ia(pedido, env, ip);
            } catch (erro) {
                console.error(erro);
                return json(500, { erro: "A IA do Kaizen falhou. Tente de novo daqui a pouco." });
            }
        }

        if (versaoApi === "v1" && ["uso", "visita", "painel"].includes(recurso) && !id) {
            const ip = pedido.headers.get("CF-Connecting-IP") || "sem-ip";
            if ((bloqueados.get(ip) || 0) > Date.now()) return MUITAS_TENTATIVAS();
            try {
                return await estatisticas(pedido, env, recurso, ip);
            } catch (erro) {
                console.error(erro);
                return json(500, { erro: "Falhou. Tente de novo daqui a pouco." });
            }
        }
        if (versaoApi !== "v1" || recurso !== "cofre" || !/^[a-f0-9]{32,64}$/.test(id || "")) {
            return json(404, { erro: "Rota não encontrada." });
        }

        const ip = pedido.headers.get("CF-Connecting-IP") || "sem-ip";
        if ((bloqueados.get(ip) || 0) > Date.now() || !(await dentroDoLimite(env.LIMITE_GERAL, ip))) {
            return MUITAS_TENTATIVAS();
        }

        try {
            const resposta = await env.COFRES.get(env.COFRES.idFromName(id)).fetch(pedido);
            // só código que não existe gasta essa cota; quem estoura fica bloqueado um minuto
            if (resposta.status === 404 && !(await dentroDoLimite(env.LIMITE_ERROS, ip))) {
                if (bloqueados.size > 5000) bloqueados.forEach((ate, chave) => ate < Date.now() && bloqueados.delete(chave));
                bloqueados.set(ip, Date.now() + 60_000);
                return MUITAS_TENTATIVAS();
            }
            return resposta;
        } catch (erro) {
            console.error(erro);
            return json(500, { erro: "O servidor de sincronia falhou. Tente de novo daqui a pouco." });
        }

    }

};
