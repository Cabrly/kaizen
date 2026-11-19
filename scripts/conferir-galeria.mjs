// Confere se todo link da galeria de planos (js/galeria-dados.js) ainda responde.
// Uso: node scripts/conferir-galeria.mjs
import PLANOS from "../js/galeria-dados.js";

const links = new Map();
for (const { id, plano } of PLANOS) {
    for (const s of plano.sessoes) for (const i of s.itens) if (i.url) links.set(i.url, `${id}: ${s.topico}`);
}

let ruins = 0;
const lista = [...links];
// duas tentativas: a Wikipédia e alguns sites devolvem 429 ou falham de vez em quando
async function responde(url) {
    for (let tentativa = 0; tentativa < 3; tentativa++) {
        try {
            const r = await fetch(url.split("#")[0], { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 kaizen-conferir" }, signal: AbortSignal.timeout(25000) });
            if (r.ok) return null;
            if (r.status !== 429 && r.status < 500) return r.status;
        } catch (e) { if (tentativa === 2) return e.message; }
        await new Promise((ok) => setTimeout(ok, 1500 * (tentativa + 1)));
    }
    return "sem resposta";
}
for (let a = 0; a < lista.length; a += 5) {
    await Promise.all(lista.slice(a, a + 5).map(async ([url, onde]) => {
        const erro = await responde(url);
        if (erro) { ruins++; console.log(`✗ ${erro}  ${url}   (${onde})`); }
    }));
}
console.log(`${lista.length} links, ${ruins} com problema`);
process.exit(ruins ? 1 : 0);
