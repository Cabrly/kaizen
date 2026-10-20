/* =========================================================
   PETS — aparência
   ---------------------------------------------------------
   Bichos e acessórios 3D são do Fluent Emoji, da Microsoft
   (licença MIT, ver icones/pets/LICENSE). O pet é montado
   em camadas: fundo, bicho (com o tom escolhido), acessórios
   e o humor por cima (brilho quando feliz; nuvem de chuva,
   gota e cor apagada quando triste).

   Cada bicho tem "âncoras" em % da imagem: topo da cabeça,
   linha dos olhos, queixo, centro e largura do rosto. Os
   acessórios se encaixam nelas, então qualquer acessório
   serve em qualquer bicho.
========================================================= */


const PASTA = new URL("../icones/pets/", import.meta.url).href;

// topo/olhos/queixo/cx/largura em % da imagem do bicho
export const ESPECIES = {
    gato:      { nome: "Gato",      custo: 0,   ancora: [30, 55, 88, 50, 76], humores: true },
    cachorro:  { nome: "Cachorro",  custo: 0,   ancora: [20, 50, 90, 50, 70] },
    hamster:   { nome: "Hamster",   custo: 0,   ancora: [24, 52, 90, 50, 74] },
    coelho:    { nome: "Coelho",    custo: 100, ancora: [38, 62, 90, 50, 70] },
    pintinho:  { nome: "Pintinho",  custo: 100, ancora: [12, 30, 48, 50, 46] },
    sapo:      { nome: "Sapo",      custo: 100, ancora: [16, 36, 88, 50, 80] },
    rato:      { nome: "Ratinho",   custo: 100, ancora: [30, 56, 90, 50, 64] },
    raposa:    { nome: "Raposa",    custo: 200, ancora: [30, 56, 90, 50, 74] },
    panda:     { nome: "Panda",     custo: 200, ancora: [22, 52, 90, 50, 76] },
    urso:      { nome: "Urso",      custo: 200, ancora: [24, 54, 90, 50, 72] },
    coala:     { nome: "Coala",     custo: 200, ancora: [22, 50, 90, 50, 66] },
    pinguim:   { nome: "Pinguim",   custo: 200, ancora: [22, 40, 58, 50, 48] },
    macaco:    { nome: "Macaco",    custo: 200, ancora: [24, 52, 90, 50, 64] },
    coruja:    { nome: "Coruja",    custo: 300, ancora: [12, 28, 48, 50, 56] },
    tigre:     { nome: "Tigre",     custo: 300, ancora: [18, 50, 90, 50, 76] },
    leao:      { nome: "Leão",      custo: 300, ancora: [20, 50, 84, 50, 60] },
    unicornio: { nome: "Unicórnio", custo: 500, ancora: [20, 42, 80, 52, 52] },
    dragao:    { nome: "Dragão",    custo: 500, ancora: [16, 40, 80, 48, 56] }
};

// tons de pelo: filtro de cor só no bicho
export const TONS = {
    original: { nome: "Original", custo: 0,   filtro: "none",                                      amostra: "#f2a65a" },
    pastel:   { nome: "Pastel",   custo: 60,  filtro: "saturate(.55) brightness(1.12)",            amostra: "#f6d2b0" },
    rosa:     { nome: "Rosa",     custo: 80,  filtro: "hue-rotate(-40deg) saturate(1.1)",          amostra: "#f59ab8" },
    azul:     { nome: "Azul",     custo: 80,  filtro: "hue-rotate(185deg)",                        amostra: "#6aa8f0" },
    menta:    { nome: "Menta",    custo: 80,  filtro: "hue-rotate(95deg) saturate(.85)",           amostra: "#7fd6a8" },
    lilas:    { nome: "Lilás",    custo: 80,  filtro: "hue-rotate(240deg) saturate(.8)",           amostra: "#b49af0" },
    dourado:  { nome: "Dourado",  custo: 150, filtro: "sepia(.7) saturate(1.8) hue-rotate(-12deg)", amostra: "#e8b84a" },
    noite:    { nome: "Noturno",  custo: 120, filtro: "brightness(.6) saturate(.7) contrast(1.15)", amostra: "#4a4a5c" }
};

// cenário atrás do pet (nas vistas grandes)
export const FUNDOS = {
    nenhum:   { nome: "Sem cenário",     custo: 0 },
    ceu:      { nome: "Céu de verão",    custo: 80 },
    sakura:   { nome: "Sakura",          custo: 100 },
    floresta: { nome: "Floresta",        custo: 100 },
    praia:    { nome: "Praia",           custo: 120 },
    noite:    { nome: "Noite estrelada", custo: 120 },
    arcoiris: { nome: "Arco-íris",       custo: 200 }
};

/* slot: um por lugar. caixa = área visível da imagem (esq, topo, dir, base, em %),
   pra encaixar pela borda certa. tam = largura em relação ao rosto do bicho. */
export const ACESSORIOS = {
    capelo:     { nome: "Capelo de formatura", slot: "cabeca", custo: 120, tam: 0.95, caixa: [6, 16, 93, 94] },
    cartola:    { nome: "Cartola",             slot: "cabeca", custo: 150, tam: 0.8,  caixa: [7, 12, 93, 93] },
    coroa:      { nome: "Coroa",               slot: "cabeca", custo: 400, tam: 0.7,  caixa: [7, 22, 93, 93] },
    bone:       { nome: "Boné",                slot: "cabeca", custo: 80,  tam: 0.95, caixa: [5, 20, 93, 78] },
    "chapeu-sol": { nome: "Chapéu de sol",     slot: "cabeca", custo: 100, tam: 1.05, caixa: [7, 31, 93, 93] },
    capacete:   { nome: "Capacete de obra",    slot: "cabeca", custo: 120, tam: 0.85, caixa: [12, 6, 88, 93] },
    laco:       { nome: "Laço",                slot: "cabeca", custo: 40,  tam: 0.42, caixa: [6, 19, 93, 93], lado: 0.32 },
    sakura:     { nome: "Flor de cerejeira",   slot: "cabeca", custo: 40,  tam: 0.32, caixa: [6, 9, 93, 93],  lado: -0.32 },
    hibisco:    { nome: "Hibisco",             slot: "cabeca", custo: 50,  tam: 0.36, caixa: [9, 7, 96, 91],  lado: 0.32 },
    girassol:   { nome: "Girassol",            slot: "cabeca", custo: 60,  tam: 0.38, caixa: [16, 6, 84, 94], lado: -0.3 },
    trevo:      { nome: "Trevo da sorte",      slot: "cabeca", custo: 70,  tam: 0.3,  caixa: [16, 6, 84, 93], lado: 0.3 },
    estrela:    { nome: "Estrela",             slot: "cabeca", custo: 90,  tam: 0.34, caixa: [6, 6, 93, 93] },
    oculos:     { nome: "Óculos",              slot: "rosto",  custo: 80,  tam: 0.88, caixa: [6, 31, 93, 65] },
    "oculos-sol": { nome: "Óculos escuros",    slot: "rosto",  custo: 120, tam: 0.88, caixa: [6, 31, 93, 66] },
    "cachecol-brasa":   { nome: "Cachecol da Casa Brasa",   slot: "pescoco", custo: 120, cores: ["#a3202b", "#e9b949"] },
    "cachecol-musgo":   { nome: "Cachecol da Casa Musgo",   slot: "pescoco", custo: 120, cores: ["#1e6040", "#c9cfd5"] },
    "cachecol-mare":    { nome: "Cachecol da Casa Maré",    slot: "pescoco", custo: 120, cores: ["#21417f", "#c29a5d"] },
    "cachecol-colmeia": { nome: "Cachecol da Casa Colmeia", slot: "pescoco", custo: 120, cores: ["#efc843", "#2e2e2e"] },
    gema:       { nome: "Pingente de gema",    slot: "pescoco", custo: 250, tam: 0.26, caixa: [6, 25, 93, 94] },
    livros:     { nome: "Pilha de livros",     slot: "lado", custo: 60,  caixa: [6, 13, 93, 93] },
    cafe:       { nome: "Café",                slot: "lado", custo: 50,  caixa: [8, 6, 92, 93] },
    "bubble-tea": { nome: "Bubble tea",        slot: "lado", custo: 70,  caixa: [19, 6, 81, 93] },
    pirulito:   { nome: "Pirulito",            slot: "lado", custo: 40,  caixa: [6, 6, 93, 93] },
    balao:      { nome: "Balão",               slot: "lado", custo: 50,  caixa: [21, 6, 85, 93] },
    coracao:    { nome: "Coração",             slot: "lado", custo: 30,  caixa: [6, 17, 93, 93] },
    bola:       { nome: "Bola",                slot: "lado", custo: 60,  caixa: [9, 9, 91, 91] },
    festa:      { nome: "Lança-confete",       slot: "lado", custo: 90,  caixa: [9, 7, 91, 93] },
    microfone:  { nome: "Microfone",           slot: "lado", custo: 110, caixa: [6, 11, 93, 93] },
    varinha:    { nome: "Varinha mágica",      slot: "lado", custo: 150, caixa: [6, 6, 93, 93] },
    videogame:  { nome: "Videogame",           slot: "lado", custo: 160, caixa: [6, 26, 93, 93] },
    violao:     { nome: "Violão",              slot: "lado", custo: 180, caixa: [6, 9, 93, 93] },
    notebook:   { nome: "Notebook",            slot: "lado", custo: 200, caixa: [7, 6, 93, 93] }
};

// pets salvos antes da troca de visual
const ANTIGOS = { corvo: "pinguim", "chapeu-mago": "cartola", flor: "sakura", gorro: "capacete", gravata: null };


export function imagemDe(id) {
    if (ESPECIES[id]) return `${PASTA}${id}.webp`;
    return ACESSORIOS[id] && !ACESSORIOS[id].cores ? `${PASTA}${id}.webp` : null;
}


/* ---------- posição ---------- */

// o bicho ocupa 80% do palco, deixando espaço pra chapéu em cima e item do lado
const BICHO = { x: 13, y: 15, tam: 70 };
const noPalco = (x, y) => [BICHO.x + (x * BICHO.tam) / 100, BICHO.y + (y * BICHO.tam) / 100];


function camada(nome, esquerda, topo, largura, classe = "") {
    return `<img class="pet-camada ${classe}" src="${PASTA}${nome}.webp" alt="" draggable="false"
                 style="left:${esquerda.toFixed(1)}%;top:${topo.toFixed(1)}%;width:${largura.toFixed(1)}%">`;
}


function acessorio(id, especie) {

    const a = ACESSORIOS[id];
    const [topo, olhos, queixo, cx, largura] = ESPECIES[especie].ancora;
    const [px, pTopo] = noPalco(cx, topo);
    const [, pOlhos] = noPalco(cx, olhos);
    const [, pQueixo] = noPalco(cx, queixo);
    const rosto = (largura * BICHO.tam) / 100;

    if (a.cores) return cachecol(a.cores, px, pQueixo, rosto);

    if (a.slot === "lado") {
        return camada(id, 66, 62, 32, "pet-item");
    }

    const w = rosto * a.tam;
    const [, cTopo, , cBase] = a.caixa;
    const esquerda = px - w / 2 + (a.lado || 0) * rosto;

    if (a.slot === "rosto") {
        return camada(id, esquerda, pOlhos - (((cTopo + cBase) / 2) * w) / 100, w);
    }
    if (a.slot === "pescoco") {
        return camada(id, esquerda, pQueixo - 4 - (cTopo * w) / 100, w);
    }
    // chapéus e enfeites: a base do item senta um pouco abaixo do topo da cabeça
    const afunda = a.lado ? 0.12 * rosto : 0.08 * rosto;
    return camada(id, esquerda, pTopo + afunda - (cBase * w) / 100, w);

}


// cachecol das casas, desenhado (o pacote não tem as cores das casas)
function cachecol([a, b], cx, queixo, rosto) {
    const w = rosto * 1.02;
    return `<svg class="pet-camada" viewBox="0 0 100 60" style="left:${(cx - w / 2).toFixed(1)}%;top:${(queixo - w * 0.12).toFixed(1)}%;width:${w.toFixed(1)}%">
        <path d="M4 10 Q50 30 96 10 L97 24 Q50 46 3 24 Z" fill="${a}"/>
        <path d="M3.5 15 Q50 36 96.5 15" fill="none" stroke="${b}" stroke-width="2.6"/>
        <path d="M3.5 20 Q50 41 96.5 20" fill="none" stroke="${b}" stroke-width="2.6"/>
        <path d="M4 10 Q50 30 96 10 L96 14 Q50 34 4 14 Z" fill="#fff" opacity="0.18"/>
        <g transform="rotate(-7 70 34)">
            <path d="M62 28 L78 28 L79 58 L63 58 Z" fill="${a}"/>
            <rect x="62.4" y="36" width="16.2" height="3" fill="${b}"/>
            <rect x="62.6" y="43" width="16.2" height="3" fill="${b}"/>
            <rect x="62.8" y="50" width="16.2" height="3" fill="${b}"/>
            <path d="M62 28 L66 28 L67 58 L63 58 Z" fill="#000" opacity="0.12"/>
        </g>
        <path d="M3 24 Q50 46 97 24 L97 26 Q50 49 3 26 Z" fill="#000" opacity="0.15"/>
    </svg>`;
}


/* ---------- o pet inteiro ---------- */

export function normalizar(pet = {}) {
    const especie = ESPECIES[pet.especie] ? pet.especie : (ESPECIES[ANTIGOS[pet.especie]] ? ANTIGOS[pet.especie] : "gato");
    const acessorios = (pet.acessorios || []).map((id) => (id in ANTIGOS ? ANTIGOS[id] : id)).filter((id) => ACESSORIOS[id]);
    return { ...pet, especie, tom: TONS[pet.tom] ? pet.tom : "original", fundo: FUNDOS[pet.fundo] ? pet.fundo : "nenhum", acessorios };
}


export function desenharPet(petCru, humor = "esperando", { titulo = "", cenario = false } = {}) {

    const pet = normalizar(petCru);
    const especie = ESPECIES[pet.especie];
    const [topo, olhos, , cx, largura] = especie.ancora;
    const [px, pTopo] = noPalco(cx, topo);
    const [, pOlhos] = noPalco(cx, olhos);
    const rosto = (largura * BICHO.tam) / 100;

    const imagem = especie.humores && humor !== "esperando" ? `${pet.especie}-${humor}` : pet.especie;
    const usar = (slot) => pet.acessorios.filter((id) => ACESSORIOS[id].slot === slot).slice(0, 1)
                                          .map((id) => acessorio(id, pet.especie)).join("");

    let clima = "";
    if (humor === "feliz") {
        clima = camada("brilho", 70, 4, 24, "pet-brilho");
    } else if (humor === "triste") {
        // com chapéu, a nuvem vai pro canto de cima pra não cobrir o acessório
        const chapeu = pet.acessorios.some((id) => ACESSORIOS[id].slot === "cabeca" && !ACESSORIOS[id].lado);
        clima = (chapeu ? camada("chuva", 64, -4, 32, "pet-chuva") : camada("chuva", px - 17, Math.max(-6, pTopo - 30), 34, "pet-chuva")) +
                (especie.humores ? "" : camada("gota", px + rosto * 0.22, pOlhos + 2, 9, "pet-gota"));
    }

    return `<div class="pet pet-${humor} ${cenario && pet.fundo !== "nenhum" ? `pet-fundo-${pet.fundo}` : ""}" role="img" aria-label="${titulo}" title="${titulo}">
        <div class="pet-corpo">
            <img class="pet-camada pet-bicho" src="${PASTA}${imagem}.webp" alt="" draggable="false"
                 style="left:${BICHO.x}%;top:${BICHO.y}%;width:${BICHO.tam}%;filter:${TONS[pet.tom].filtro}">
            ${usar("pescoco")}
            ${usar("rosto")}
            ${usar("cabeca")}
            ${usar("lado")}
        </div>
        ${clima}
    </div>`;

}
