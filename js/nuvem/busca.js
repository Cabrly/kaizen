/* =========================================================
   NUVEM / BUSCA — materiais de estudo direto do navegador
   ---------------------------------------------------------
   Mesma ideia do busca.py, dentro das regras do navegador
   (só dá pra consultar serviço que libera CORS):

   - Vídeos: Invidious e Piped (APIs abertas do YouTube,
     com duração), título original pelo noembed.
   - Documentação: link "!ducky" do DuckDuckGo restrito ao
     site oficial — no clique ele pula direto pro primeiro
     resultado, então o link nunca quebra.

   A IA nunca escreve link: ela só diz o que buscar.
========================================================= */


const INVIDIOUS_RESERVA = ["invidious.f5.si", "yewtu.be", "inv.nadeko.net"];
const PIPED = ["https://api.piped.private.coffee", "https://pipedapi.kavin.rocks", "https://pipedapi.adminforge.de"];

const CHAVE_CACHE = "kaizen.nuvem.busca.v1";
const MAX_CACHE = 300;


export const IDIOMAS = {
    pt: { nome: "Português", regiao: "BR", aula: "aula", documentacao: "documentação", marca: "português" },
    en: { nome: "English", regiao: "US", aula: "tutorial", documentacao: "documentation" },
    es: { nome: "Español", regiao: "ES", aula: "clase", documentacao: "documentación", marca: "español" }
};


let instanciasInvidious = null;



/* ---------- cache (sobrevive entre aberturas do app) ---------- */

function lerCache() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE_CACHE) || "{}");
    } catch (erro) {
        return {};
    }
}


function guardarCache(chave, valor) {

    try {
        const cache = lerCache();
        cache[chave] = valor;
        const chaves = Object.keys(cache);
        // mantém só os mais recentes (o objeto preserva a ordem de inserção)
        chaves.slice(0, Math.max(0, chaves.length - MAX_CACHE)).forEach((c) => delete cache[c]);
        localStorage.setItem(CHAVE_CACHE, JSON.stringify(cache));
    } catch (erro) {
        /* sem espaço: tudo bem, só não guarda */
    }

}


async function baixarJson(url, tempo = 8000) {

    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), tempo);

    try {
        const resposta = await fetch(url, { signal: controle.signal });
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
        return await resposta.json();
    } finally {
        clearTimeout(relogio);
    }

}



/* ---------- vídeos ---------- */

function video(id, titulo, canal, segundos) {
    return {
        tipo: "video",
        titulo,
        url: `https://www.youtube.com/watch?v=${id}`,
        fonte: canal || "YouTube",
        minutos: segundos ? Math.max(1, Math.round(segundos / 60)) : null
    };
}


async function viaInvidious(consulta, idioma) {

    if (!instanciasInvidious) {
        try {
            const lista = await baixarJson("https://api.invidious.io/instances.json?sort_by=health", 6000);
            instanciasInvidious = lista.filter((i) => i[1]?.api && i[1]?.type === "https").map((i) => i[0]);
        } catch (erro) {
            instanciasInvidious = [];
        }
        INVIDIOUS_RESERVA.forEach((h) => instanciasInvidious.includes(h) || instanciasInvidious.push(h));
    }

    for (const host of [...instanciasInvidious]) {

        try {

            const parametros = new URLSearchParams({ q: consulta, type: "video", region: IDIOMAS[idioma].regiao, hl: idioma });
            const itens = await baixarJson(`https://${host}/api/v1/search?${parametros}`);

            return itens
                .filter((v) => v.type === "video" && v.lengthSeconds)
                .map((v) => video(v.videoId, v.title, v.author, v.lengthSeconds));

        } catch (erro) {

            // instância fora do ar vai pro fim da fila
            instanciasInvidious = instanciasInvidious.filter((h) => h !== host).concat(host);

        }

    }

    throw new Error("invidious indisponível");

}


async function viaPiped(consulta) {

    for (const api of PIPED) {

        try {

            const dados = await baixarJson(`${api}/search?${new URLSearchParams({ q: consulta, filter: "videos" })}`);

            return (dados.items || [])
                .map((v) => ({ v, id: (v.url || "").match(/v=([\w-]{11})/)?.[1] }))
                .filter(({ v, id }) => id && v.duration > 0)
                .map(({ v, id }) => video(id, v.title, v.uploaderName, v.duration));

        } catch (erro) {
            /* próxima instância */
        }

    }

    throw new Error("piped indisponível");

}


const PORTUGUES = /[ãõç]|\b(do|da|dos|das|com|aula|em|no|na|um|uma|seu|sua|você|não|é|para|pra|como|neste|nesta|aprenda|aprender|aprendendo|entenda|entendendo|curso|iniciantes|usar|fazer|parte|zero)\b/i;
const ESPANHOL = /[ñ¿¡]|\b(el|los|las|del|clase|cómo|qué|y|en|un|una|su|tu|usted|curso de|desde|cero|fácil|gratis|principiantes|español)\b/i;
const INGLES = /\b(the|and|how|to|with|for|in|of|your|you|learn|beginners?|tutorial|course|crash)\b/i;


function pareceIdioma(texto, idioma) {

    const pt = PORTUGUES.test(texto);
    const es = ESPANHOL.test(texto);
    const en = INGLES.test(texto);

    if (idioma === "pt") return pt;
    if (idioma === "es") return es && !pt;
    return en && !pt && !es;

}


/*
    As instâncias ficam fora do Brasil e o YouTube traduz o
    título; o noembed devolve o original.
*/
async function tituloOriginal(v) {

    const chave = `oembed:${v.url}`;
    const guardado = lerCache()[chave];

    if (guardado) return { ...v, ...guardado };

    try {
        const dados = await baixarJson(`https://noembed.com/embed?${new URLSearchParams({ url: v.url })}`, 5000);
        if (!dados.title) return v;
        const original = { titulo: dados.title, fonte: dados.author_name || v.fonte };
        guardarCache(chave, original);
        return { ...v, ...original };
    } catch (erro) {
        return v;
    }

}


/*
    Até `limite` vídeos que cabem em `minutosMax`, no idioma
    escolhido primeiro. Nunca lança erro: no pior caso, [].
*/
export async function buscarVideos(consulta, { idioma = "pt", minutosMax = null, limite = 8 } = {}) {

    // "aula"/"clase" sozinho não convence o YouTube (ainda mais quando a IA escreve a busca
    // em inglês, tipo "react useState tutorial"); "português"/"español" no fim, sim
    const marca = IDIOMAS[idioma].marca;
    const semAcento = (texto) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

    if (marca && !semAcento(consulta).includes(semAcento(marca))) {
        consulta = `${consulta} ${marca}`;
    }

    const chave = `video:${idioma}:${consulta.toLowerCase()}`;
    let videos = lerCache()[chave];

    if (!videos) {
        try {
            videos = await viaInvidious(consulta, idioma);
        } catch (erro) {
            try {
                videos = await viaPiped(consulta);
            } catch (erro2) {
                videos = [];
            }
        }
        if (videos.length) guardarCache(chave, videos);
    }


    const nota = (v) => {
        if (v.minutos == null) return 1;
        if (minutosMax && v.minutos > minutosMax) return 3;   // não cabe na sessão
        return v.minutos >= 4 ? 0 : 2;                        // muito curto costuma ser raso
    };

    const candidatos = await Promise.all(
        [...videos].sort((a, b) => nota(a) - nota(b)).slice(0, limite).map(tituloOriginal));

    return candidatos.sort((a, b) =>
        (nota(a) === 3) - (nota(b) === 3) || pareceIdioma(b.titulo, idioma) - pareceIdioma(a.titulo, idioma));

}



/* ---------- documentação ---------- */

export function linkDocumentacao({ tema, topico, termos, dominio, idioma = "pt" }) {

    const site = (dominio || "").replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");

    const consulta = site
        ? `!ducky site:${site} ${termos || topico}`
        : `!ducky ${tema} ${termos || topico} ${IDIOMAS[idioma].documentacao}`;

    return {
        tipo: "doc",
        titulo: `${topico} — ${site ? "documentação oficial" : "documentação"}`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(consulta)}`,
        fonte: site || "busca"
    };

}
