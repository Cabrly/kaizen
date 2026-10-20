/* =========================================================
   LIVROS — aparência (Biblioteca de estudos)
   ---------------------------------------------------------
   Cada plano (com os que continuam ele) é um livro. A capa é
   montada em camadas, toda em CSS (classes .livro-*): o
   material da capa, a margem, o jeito do título, o fitilho
   marcador e um adesivo. Os adesivos são os emojis 3D dos
   pets (Fluent Emoji, MIT). Itens com custo entram na loja,
   com os mesmos pontos dos pets.
========================================================= */


const PASTA = new URL("../icones/pets/", import.meta.url).href;

// "cor" = a capa clássica usa a cor do plano
export const CAPAS = {
    classica:    { nome: "Clássica (cor do plano)", custo: 0 },
    caderno:     { nome: "Caderno quadriculado", custo: 60 },
    couro:       { nome: "Couro marrom",          custo: 60 },
    linho:       { nome: "Linho verde",           custo: 60 },
    vinho:       { nome: "Vinho",                 custo: 60 },
    noite:       { nome: "Azul-noite",            custo: 60 },
    preto:       { nome: "Couro preto",           custo: 80 },
    jeans:       { nome: "Jeans",                 custo: 100 },
    veludo:      { nome: "Veludo roxo",           custo: 120 },
    xadrez:      { nome: "Xadrez escocês",        custo: 120 },
    sakura:      { nome: "Estampa de sakura",     custo: 150 },
    madeira:     { nome: "Madeira",               custo: 150 },
    marmore:     { nome: "Mármore",               custo: 180 },
    pixel:       { nome: "Pixel retrô",           custo: 200 },
    galaxia:     { nome: "Galáxia",               custo: 250 },
    ouro:        { nome: "Folha de ouro",         custo: 300 }
};

export const MARGENS = {
    nenhuma:     { nome: "Sem margem",            custo: 0 },
    filete:      { nome: "Filete dourado",        custo: 60 },
    prata:       { nome: "Filete prateado",       custo: 60 },
    dupla:       { nome: "Moldura dupla",         custo: 80 },
    costura:     { nome: "Costura",               custo: 90 },
    cantos:      { nome: "Cantoneiras douradas",  custo: 120 },
    cantosprata: { nome: "Cantoneiras prateadas", custo: 100 },
    pergaminho:  { nome: "Pergaminho antigo",     custo: 150 },
    floral:      { nome: "Borda floral",          custo: 180 },
    arabesco:    { nome: "Arabesco",              custo: 200 }
};

export const TITULOS = {
    branco:      { nome: "Letra branca",          custo: 0 },
    manuscrito:  { nome: "Manuscrito",            custo: 60 },
    carimbo:     { nome: "Carimbo",               custo: 70 },
    prata:       { nome: "Gravado em prata",      custo: 80 },
    dourado:     { nome: "Gravado em ouro",       custo: 100 },
    neon:        { nome: "Neon",                  custo: 150 }
};

export const FITILHOS = {
    nenhum:      { nome: "Sem fitilho",           custo: 0 },
    vermelho:    { nome: "Fitilho vermelho",      custo: 30, cor: "#c90016" },
    azul:        { nome: "Fitilho azul",          custo: 30, cor: "#2f5fd0" },
    verde:       { nome: "Fitilho verde",         custo: 30, cor: "#2f8a4f" },
    dourado:     { nome: "Fitilho dourado",       custo: 50, cor: "#d9a520" },
    arcoiris:    { nome: "Fitilho arco-íris",     custo: 90, cor: "linear-gradient(#ff4d4d, #ffb347, #ffe53b, #4cd964, #3ba7ff, #8a5cff)" }
};

// adesivos = emojis que já existem na pasta dos pets
export const ADESIVOS = {
    nenhum:      { nome: "Sem adesivo",       custo: 0 },
    estrela:     { nome: "Estrela",           custo: 40 },
    coracao:     { nome: "Coração",           custo: 40 },
    sakura:      { nome: "Flor de cerejeira", custo: 40 },
    girassol:    { nome: "Girassol",          custo: 50 },
    trevo:       { nome: "Trevo da sorte",    custo: 50 },
    cafe:        { nome: "Café",              custo: 50 },
    foguete:     { nome: "Foguete",           custo: 80 },
    cerebro:     { nome: "Cérebro gigante",   custo: 90 },
    "bola-cristal": { nome: "Bola de cristal", custo: 100 },
    moai:        { nome: "Moai",              custo: 120 },
    gema:        { nome: "Gema",              custo: 120 },
    coroa:       { nome: "Coroa",             custo: 150 },
    trofeu:      { nome: "Troféu",            custo: 150 }
};

// partes da capa: chave no livro → [catálogo, valor padrão, nome na loja]
export const PARTES = {
    capa:    [CAPAS, "classica", "Capas"],
    margem:  [MARGENS, "nenhuma", "Margens"],
    titulo:  [TITULOS, "branco", "Títulos"],
    fitilho: [FITILHOS, "nenhum", "Fitilhos"],
    adesivo: [ADESIVOS, "nenhum", "Adesivos"]
};


// itens da loja: "livro:<parte>:<id>"
export function custoLivro(id) {
    const [, parte, valor] = id.split(":");
    return PARTES[parte]?.[0][valor]?.custo ?? 0;
}


export function normalizarLivro(livro = {}) {
    return Object.fromEntries(Object.entries(PARTES).map(([parte, [catalogo, padrao]]) =>
        [parte, catalogo[livro[parte]] ? livro[parte] : padrao]));
}


function esc(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]);
}


/* A capa inteira. cor = cor do plano (vale na capa clássica e no fitilho de quem não comprou um). */
export function desenharLivro(livroCru, { titulo = "", subtitulo = "", cor = "#c90016", concluido = false } = {}) {

    const livro = normalizarLivro(livroCru);
    const fita = FITILHOS[livro.fitilho].cor;

    return `<div class="livro livro-capa-${livro.capa} livro-margem-${livro.margem} livro-titulo-${livro.titulo}"
                 style="--cor-plano:${esc(cor)}" role="img" aria-label="${esc(titulo)}">
        <span class="livro-lombada"></span>
        <span class="livro-moldura"></span>
        <span class="livro-cantos"></span>
        <span class="livro-texto">
            <strong>${esc(titulo)}</strong>
            ${subtitulo ? `<small>${esc(subtitulo)}</small>` : ""}
        </span>
        ${livro.adesivo !== "nenhum" ? `<img class="livro-adesivo" src="${PASTA}${livro.adesivo}.webp" alt="" draggable="false">` : ""}
        ${fita ? `<span class="livro-fitilho" style="--fita:${fita}"></span>` : ""}
        ${concluido ? `<span class="livro-selo" title="Plano concluído">★</span>` : ""}
    </div>`;

}
