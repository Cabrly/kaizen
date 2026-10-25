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

function video(id, titulo, canal, segundos, visualizacoes) {
    return {
        tipo: "video",
        titulo,
        url: `https://www.youtube.com/watch?v=${id}`,
        fonte: canal || "YouTube",
        minutos: segundos ? Math.max(1, Math.round(segundos / 60)) : null,
        visualizacoes: Number.isInteger(visualizacoes) && visualizacoes >= 0 ? visualizacoes : null
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
                .map((v) => video(v.videoId, v.title, v.author, v.lengthSeconds, v.viewCount));

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
                .map(({ v, id }) => video(id, v.title, v.uploaderName, v.duration, v.views));

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


// palavras da busca que não dizem o assunto (marca do idioma, "aula", "curso"…)
const GENERICAS_VIDEO = new Set(["aula", "aulas", "curso", "video", "videos", "tutorial", "completo", "completa", "portugues",
                                 "espanol", "english", "passo", "explicado", "iniciantes", "basico", "resumo"]);

const VAZIAS = new Set(["de", "da", "do", "das", "dos", "e", "em", "com", "para", "um", "uma", "no", "na", "the", "and",
                        "in", "to", "of", "a", "o", "os", "as", "how", "como"]);

const tokensDe = (texto) => new Set(String(texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .split(/[^a-z0-9]+/).filter((t) => t.length > 1 && !VAZIAS.has(t)));


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

    // dentro da mesma nota: o que a busca achou mais relevante E mais gente assistiu vem na frente
    // (curtidas não dá: o navegador não consegue ler a página do YouTube)
    const posicao = new Map(videos.map((v, i) => [v.url, i]));
    const popularidade = (v) => v.visualizacoes
        ? Math.min(1, Math.max(0, (Math.log10(v.visualizacoes) - 3) / 4))   // ~1 mil = 0, ~10 milhões = 1
        : 0.3;
    // só visualização premiava o vídeo famoso e genérico: o título também precisa falar do assunto da busca
    const termos = [...tokensDe(consulta)].filter((t) => !GENERICAS_VIDEO.has(t));
    const cobertura = (v) => {
        if (!termos.length) return 0.5;
        const titulo = tokensDe(v.titulo);
        return termos.filter((t) => titulo.has(t)).length / termos.length;
    };
    const pontos = (v) => (0.30 * (1 - posicao.get(v.url) / Math.max(videos.length, 1))
                         + 0.35 * cobertura(v) + 0.20 * popularidade(v)) / 0.85;

    const candidatos = await Promise.all(
        [...videos].sort((a, b) => nota(a) - nota(b) || pontos(b) - pontos(a)).slice(0, limite).map(tituloOriginal));

    return candidatos.sort((a, b) =>
        (nota(a) === 3) - (nota(b) === 3) || pareceIdioma(b.titulo, idioma) - pareceIdioma(a.titulo, idioma));

}



/* ---------- documentação ---------- */

export function linkDocumentacao({ tema, topico, termos, dominio, idioma = "pt", area = "", areas = null }) {

    const site = (dominio || "").replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");
    const assunto = `${tema} ${termos || topico}`;
    const dominios = site ? [] : dominiosDaArea(areas, area, idioma);

    let consulta;
    let rotulo;

    if (site) {
        consulta = `!ducky site:${site} ${termos || topico}`;
        rotulo = "documentação oficial";
    } else if (dominios.length) {
        // os 6 sites de autoridade mais importantes da área; o primeiro resultado é o que abre
        consulta = `!ducky ${areaTecnica(areas, area) ? termos || topico : assunto} (${dominios.slice(0, 6).map((d) => `site:${d}`).join(" OR ")})`;
        rotulo = "fontes oficiais";
    } else {
        // "documentação" na busca só ajuda em tecnologia (nas outras áreas puxava artigo sobre "documentação")
        consulta = `!ducky ${assunto}${area && !areaTecnica(areas, area) ? "" : ` ${IDIOMAS[idioma].documentacao}`}`;
        rotulo = "documentação";
    }

    return {
        tipo: "doc",
        titulo: `${topico} — ${rotulo}`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(consulta)}`,
        fonte: site || (dominios.length ? "fontes oficiais da área" : "busca")
    };

}



/* ---------- áreas do conhecimento (areas.json, o mesmo do busca.py) ---------- */

let areasPromessa = null;

/* { areas: {id: {...}}, evitar: [...] }. Sem o arquivo, volta vazio e tudo cai na busca livre. */
export function carregarAreas() {

    areasPromessa ||= fetch("./areas.json")
        .then((resposta) => (resposta.ok ? resposta.json() : {}))
        .catch(() => ({}))
        .then((dados) => ({
            areas: Object.fromEntries((dados.areas || []).map((a) => [a.id, a])),
            evitar: dados.evitar || []
        }));

    return areasPromessa;

}


const semAcento = (texto) => String(texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();


export const idsDeAreas = (areas) => Object.keys(areas?.areas || {});

export const descricaoDasAreas = (areas) =>
    Object.values(areas?.areas || {}).map((a) => `${a.id} (${a.nome})`).join("; ");

export const areaValida = (areas, id) => (areas?.areas?.[id] ? id : "");

export const areaTecnica = (areas, id) => Boolean(areas?.areas?.[id]?.tecnica);


/* Chute pelas palavras do tema, pra quando a IA não escolheu a área. "" = não sei. */
export function detectarArea(areas, texto) {

    const limpo = ` ${semAcento(texto).replace(/[^a-z0-9+#/]+/g, " ")} `;
    let melhor = "";
    let melhorPontos = 0;

    for (const area of Object.values(areas?.areas || {})) {

        let pontos = 0;

        for (const original of area.palavras || []) {
            const palavra = semAcento(original);
            const achou = palavra.endsWith("*") ? limpo.includes(` ${palavra.slice(0, -1)}`) : limpo.includes(` ${palavra} `);
            if (achou) pontos += 1 + (palavra.match(/ /g) || []).length;   // frase vale mais que palavra solta
        }

        if (pontos > melhorPontos) {
            melhor = area.id;
            melhorPontos = pontos;
        }

    }

    return melhor;

}


/* Sites de autoridade da área em ordem de prioridade: os do idioma primeiro, depois os gerais. */
export function dominiosDaArea(areas, area, idioma = "pt") {

    const dominios = areas?.areas?.[area]?.dominios || {};

    return [...new Set([...(dominios[idioma] || []), ...(dominios.geral || [])])];

}



/* ---------- documentos-base e fontes abertas (o mesmo do busca.py) ---------- */

/* Quantas palavras-chave aparecem no texto (frase de 2+ palavras vale mais; termo* casa o começo da palavra). */
function pontosDasChaves(chaves, texto) {

    // o ponto só conta dentro de número (14.133); fora disso é pontuação
    const limpo = ` ${semAcento(texto)
        .replace(/\./g, (m, i, s) => (/\d/.test(s[i - 1] || "") && /\d/.test(s[i + 1] || "") ? "." : " "))
        .replace(/[^a-z0-9.]+/g, " ")} `;

    let pontos = 0;

    for (const original of chaves || []) {
        const chave = semAcento(original);
        const achou = chave.endsWith("*") ? limpo.includes(` ${chave.slice(0, -1)}`) : limpo.includes(` ${chave} `);
        if (achou) pontos += 1 + (chave.match(/ /g) || []).length;
    }

    return pontos;

}


/*
    Leis e textos-base da área com endereço conferido (areas.json: Código Penal, CLT, LGPD…), os que mais combinam
    com o tema. Sem busca. O `contexto` (o assunto do plano) só entra se o tópico sozinho não casou com nada: senão
    "Direito Penal" puxaria o Código Penal até pra processo penal.
*/
export function documentosBase(areas, area, texto, idioma = "pt", limite = 1, contexto = "") {

    if (idioma !== "pt") return [];

    const docs = areas?.areas?.[area]?.documentos || [];

    for (const base of [texto, `${texto} ${contexto}`]) {

        const achados = docs
            .map((d, i) => ({ d, i, pontos: pontosDasChaves(d.chaves, base) }))
            .filter((x) => x.pontos > 0)
            .sort((a, b) => b.pontos - a.pontos || a.i - b.i)
            .slice(0, limite)
            .map((x) => x.d);

        if (achados.length) {
            return achados.map((d) => ({ tipo: "doc", titulo: d.titulo, url: d.url, fonte: new URL(d.url).host.replace(/^www\./, "") }));
        }

    }

    return [];

}


const radicaisDe = (texto) => new Set([...tokensDe(texto)].map((t) => t.slice(0, 5)));   // "derivada" = "derivadas"


async function wikipedia(consulta, idioma) {

    const base = `https://${idioma}.wikipedia.org/w/api.php?origin=*&format=json&`;

    // que parte das palavras do assunto o título tem ("Lei de Hubble" cobre metade de "lei de ohm")
    const cobertura = (titulo, alvo) => {
        const doTitulo = radicaisDe(titulo);
        return alvo.size ? [...alvo].filter((r) => doTitulo.has(r)).length / alvo.size : 0;
    };

    // 1) pelo título: "sinais vitais aferição" não é título de nada, mas "sinais vitais" é; encurta de trás pra frente
    const palavras = consulta.split(/\s+/).filter(Boolean);
    let achados = [];

    for (let n = palavras.length; n >= Math.max(1, Math.min(2, palavras.length)); n--) {
        const trecho = palavras.slice(0, n).join(" ");
        const alvo = radicaisDe(trecho);
        const d = await baixarJson(`${base}action=opensearch&limit=4&namespace=0&search=${encodeURIComponent(trecho)}`);
        achados = (d[1] || []).filter((t) => cobertura(t, alvo) > 0.5);
        if (achados.length) break;
    }

    // 2) senão, a busca de texto, que devolve de tudo ("Síndrome compartimental" pra "sinais vitais")
    if (!achados.length) {
        const alvo = radicaisDe(consulta);
        const d = await baixarJson(`${base}action=query&list=search&srlimit=5&srsearch=${encodeURIComponent(consulta)}`);
        achados = (d.query?.search || []).map((i) => i.title).filter((t) => cobertura(t, alvo) > 0.5)
            .sort((a, b) => cobertura(b, alvo) - cobertura(a, alvo));
    }

    return achados.slice(0, 3).map((titulo) => ({
        tipo: "doc", titulo, fonte: "Wikipédia",
        url: `https://${idioma}.wikipedia.org/wiki/${encodeURIComponent(titulo.replace(/ /g, "_"))}`
    }));

}


/* Artigos científicos de acesso aberto no idioma dos materiais (SciELO, revistas brasileiras…). */
async function openalex(consulta, idioma) {

    const parametros = new URLSearchParams({
        search: consulta, filter: `language:${idioma},open_access.is_oa:true,type:article`,
        "per-page": "4", select: "title,doi,best_oa_location"
    });

    const dados = await baixarJson(`https://api.openalex.org/works?${parametros}`, 10000);

    return (dados.results || [])
        .map((r) => {
            const local = r.best_oa_location || {};
            return { tipo: "doc", titulo: r.title, url: local.landing_page_url || r.doi || "", fonte: local.source?.display_name || "OpenAlex" };
        })
        .filter((x) => x.titulo && /^https?:\/\//.test(x.url));

}


/*
    Documentação de um tópico, da fonte mais confiável pra menos: site oficial (tecnologia) ou, nas outras áreas,
    o texto-base da área, depois Wikipédia e artigos abertos (um de cada, em rodízio), até 2 no total. O link de
    busca nas fontes da área vem sempre por último. Nunca lança erro.
*/
export async function documentacaoDaArea({ tema, topico, termos, dominio, idioma = "pt", area = "", areas = null }) {

    const link = linkDocumentacao({ tema, topico, termos, dominio, idioma, area, areas });

    if (dominio) return [link];

    const docs = documentosBase(areas, area, `${termos || ""} ${topico}`, idioma, 1, tema);
    const apis = areas?.areas?.[area]?.apis || [];

    const listas = await Promise.all(apis.map(async (nome) => {

        const consulta = nome === "wikipedia" ? (termos || topico) : `${tema} ${termos || topico}`;
        const chave = `api:${nome}:${idioma}:${consulta.toLowerCase()}`;
        let lista = lerCache()[chave];

        if (!lista) {
            try {
                lista = await (nome === "wikipedia" ? wikipedia : openalex)(consulta, idioma);
                if (lista.length) guardarCache(chave, lista);
            } catch (erro) {
                lista = [];   // fora do ar ou sem rede: fica só com o link de busca
            }
        }

        return lista;

    }));

    for (let i = 0; i < 3; i++) {
        for (const lista of listas) {
            if (lista[i] && docs.length < 2 && !docs.some((d) => d.url === lista[i].url)) docs.push(lista[i]);
        }
    }

    return [...docs, link];

}
