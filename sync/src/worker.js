/* Sincronia do Kaizen: guarda um blob criptografado por código.

   O navegador deriva do código de sincronia um id (o nome do cofre) e uma
   chave AES; só o id e o blob cifrado chegam aqui. Sem login: quem tem o
   código tem o cofre.

   GET    /v1/cofre/:id                 → { versao, dados, atualizado_em } | 404
   PUT    /v1/cofre/:id  { base, dados } → grava se a versão atual for "base"
                                           (0 = cofre novo); senão 409 com a atual
   DELETE /v1/cofre/:id                 → apaga o cofre */

const TAMANHO_MAXIMO = 1_500_000;  // o D1 aceita linhas de até 2 MB
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


async function ler(env, id) {
    return env.DB.prepare("SELECT versao, dados, atualizado_em FROM cofres WHERE id = ?").bind(id).first();
}


async function gravar(env, id, pedido) {

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

    const agora = Date.now();

    // uma instrução só, então dois aparelhos gravando juntos não se atropelam
    const resultado = base === 0
        ? await env.DB.prepare(
            "INSERT INTO cofres (id, versao, dados, atualizado_em) VALUES (?, 1, ?, ?) ON CONFLICT (id) DO NOTHING")
            .bind(id, dados, agora).run()
        : await env.DB.prepare(
            "UPDATE cofres SET versao = versao + 1, dados = ?, atualizado_em = ? WHERE id = ? AND versao = ?")
            .bind(dados, agora, id, base).run();

    if (resultado.meta.changes === 1) return json(200, { versao: base + 1, atualizado_em: agora });

    // alguém gravou antes: devolve o que está lá pra o aparelho decidir
    const atual = await ler(env, id);
    return atual ? json(409, atual) : json(404, { erro: "Esse código de sincronia não existe mais." });

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

        try {

            if (pedido.method === "GET") {
                const cofre = await ler(env, id);
                return cofre ? json(200, cofre) : json(404, { erro: "Nada sincronizado com esse código ainda." });
            }

            if (pedido.method === "PUT") return await gravar(env, id, pedido);

            if (pedido.method === "DELETE") {
                await env.DB.prepare("DELETE FROM cofres WHERE id = ?").bind(id).run();
                return json(200, { ok: true });
            }

            return json(405, { erro: "Método não permitido." });

        } catch (erro) {
            console.error(erro);
            return json(500, { erro: "O servidor de sincronia falhou. Tente de novo daqui a pouco." });
        }

    },

    async scheduled(evento, env) {
        await env.DB.prepare("DELETE FROM cofres WHERE atualizado_em < ?").bind(Date.now() - UM_ANO).run();
    }

};
