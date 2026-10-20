/* Sincronia do Kaizen: guarda um blob criptografado por código.

   O navegador deriva do código de sincronia um id (o nome do cofre) e uma
   chave AES; só o id e o blob cifrado chegam aqui. Sem login: quem tem o
   código tem o cofre.

   GET    /v1/cofre/:id                 → { versao, dados, atualizado_em } | 404
   PUT    /v1/cofre/:id  { base, dados } → grava se a versão atual for "base"
                                           (0 = cofre novo); senão 409 com a atual
   DELETE /v1/cofre/:id                 → apaga o cofre

   Cada cofre é um Durable Object: um código atende um pedido por vez, então
   dois aparelhos gravando juntos não se atropelam. O blob vai em pedaços de
   1 MB (o armazenamento aceita valores de até 2 MB cada), então um cofre
   aguenta até TAMANHO_MAXIMO, com as entregas das atividades e tudo.

   Limite por IP: 120 pedidos por minuto no total e 10 por minuto em cofre que
   não existe (404). Quem tenta adivinhar códigos bate no segundo logo. */

import { DurableObject } from "cloudflare:workers";

const TAMANHO_MAXIMO = 32_000_000;  // ~32 MB cifrados e comprimidos; cabe folgado na memória do Worker
const PEDACO = 1_000_000;
const UM_ANO = 365 * 24 * 60 * 60 * 1000;

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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

        if (pedido.method === "GET") {
            const cofre = await this.ler();
            return cofre ? json(200, cofre) : json(404, { erro: "Nada sincronizado com esse código ainda." });
        }

        if (pedido.method === "DELETE") {
            await this.ctx.storage.deleteAlarm();
            await this.ctx.storage.deleteAll();
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

        // alguém gravou antes: devolve o que está lá pra o aparelho decidir
        if ((atual?.versao || 0) !== base) {
            return atual ? json(409, atual) : json(404, { erro: "Esse código de sincronia não existe mais." });
        }

        const agora = Date.now();
        await this.gravar(base + 1, dados, agora);
        await this.ctx.storage.setAlarm(agora + UM_ANO);  // cofre esquecido por um ano se apaga sozinho

        return json(200, { versao: base + 1, atualizado_em: agora });

    }

    async alarm() {
        await this.ctx.storage.deleteAll();
    }

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
