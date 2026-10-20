/* =========================================================
   PETS — aparência
   ---------------------------------------------------------
   Bichos e acessórios 3D são do Fluent Emoji, da Microsoft
   (licença MIT, ver icones/pets/LICENSE); os .svg da pasta
   foram desenhados aqui. O pet é montado em camadas: fundo,
   bicho (com o tom escolhido), acessórios e o humor por cima
   (brilho quando feliz; nuvem de chuva, gota e cor apagada
   quando triste), ou a reação de meme que a pessoa comprou.

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
    porco:     { nome: "Porquinho", custo: 100, ancora: [22, 50, 92, 50, 76] },
    vaca:      { nome: "Vaquinha",  custo: 150, ancora: [22, 44, 92, 50, 62] },
    raposa:    { nome: "Raposa",    custo: 200, ancora: [30, 56, 90, 50, 74] },
    panda:     { nome: "Panda",     custo: 200, ancora: [22, 52, 90, 50, 76] },
    urso:      { nome: "Urso",      custo: 200, ancora: [24, 54, 90, 50, 72] },
    coala:     { nome: "Coala",     custo: 200, ancora: [22, 50, 90, 50, 66] },
    pinguim:   { nome: "Pinguim",   custo: 200, ancora: [22, 40, 58, 50, 48] },
    macaco:    { nome: "Macaco",    custo: 200, ancora: [24, 52, 90, 50, 64] },
    coruja:    { nome: "Coruja",    custo: 300, ancora: [12, 28, 48, 50, 56] },
    tigre:     { nome: "Tigre",     custo: 300, ancora: [18, 50, 90, 50, 76] },
    leao:      { nome: "Leão",      custo: 300, ancora: [20, 50, 84, 50, 60] },
    lobo:      { nome: "Lobo",      custo: 300, ancora: [20, 48, 92, 50, 76] },
    fantasma:  { nome: "Fantasminha", custo: 300, ancora: [12, 28, 60, 50, 64] },
    robo:      { nome: "Robô",      custo: 400, ancora: [20, 40, 88, 50, 74] },
    alien:     { nome: "ET",        custo: 400, ancora: [12, 45, 92, 50, 76] },
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
    chiclete: { nome: "Chiclete", custo: 90,  filtro: "hue-rotate(-75deg) saturate(1.3)",          amostra: "#ff6fd0" },
    caramelo: { nome: "Vira-lata caramelo", custo: 100, filtro: "sepia(.6) saturate(1.7) hue-rotate(-10deg)", amostra: "#d38b3c" },
    filme:    { nome: "Filme antigo", custo: 110, filtro: "grayscale(1) contrast(1.15)",           amostra: "#9a9a9a" },
    noite:    { nome: "Noturno",  custo: 120, filtro: "brightness(.6) saturate(.7) contrast(1.15)", amostra: "#4a4a5c" },
    negativo: { nome: "Negativo", custo: 130, filtro: "invert(.9)",                                amostra: "#3d6bd6" },
    neon:     { nome: "Neon",     custo: 140, filtro: "saturate(2.4) contrast(1.1) brightness(1.05)", amostra: "#ff3df0" },
    fantasma: { nome: "Fantasminha", custo: 140, filtro: "grayscale(.4) brightness(1.25) opacity(.7)", amostra: "#dfe6f5" },
    dourado:  { nome: "Dourado",  custo: 150, filtro: "sepia(.7) saturate(1.8) hue-rotate(-12deg)", amostra: "#e8b84a" },
    // a cor gira sem parar (a animação passa por cima do filtro)
    rgb:      { nome: "RGB gamer", custo: 300, filtro: "none", classe: "pet-tom-rgb",
                amostra: "conic-gradient(#ff3b3b, #ffd23b, #3bff6a, #3bd8ff, #6a3bff, #ff3bd8, #ff3b3b)" }
};

// cenário atrás do pet (nas vistas grandes)
export const FUNDOS = {
    nenhum:    { nome: "Sem cenário",     custo: 0 },
    ceu:       { nome: "Céu de verão",    custo: 80 },
    banheiro:  { nome: "Banheiro",        custo: 80 },
    sakura:    { nome: "Sakura",          custo: 100 },
    floresta:  { nome: "Floresta",        custo: 100 },
    neve:      { nome: "Neve",            custo: 100 },
    praia:     { nome: "Praia",           custo: 120 },
    noite:     { nome: "Noite estrelada", custo: 120 },
    lofi:      { nome: "Quarto lo-fi",    custo: 150 },
    pordosol:  { nome: "Pôr do sol",      custo: 150 },
    espaco:    { nome: "Espaço",          custo: 180 },
    codigo:    { nome: "Código verde",    custo: 180 },
    arcoiris:  { nome: "Arco-íris",       custo: 200 },
    vaporwave: { nome: "Vaporwave",       custo: 220 }
};

/* slot: um por lugar. caixa = área visível da imagem (esq, topo, dir, base, em %),
   pra encaixar pela borda certa. tam = largura em relação ao rosto do bicho.
   svg: desenho da pasta (.svg) em vez do emoji. meme: a piada, mostrada na loja.
   Ajustes finos: lado (desvio pro lado), afunda (quanto o chapéu entra na cabeça),
   meio (ponto da imagem que vai na linha dos olhos), mira ("rosto" = meio da cara,
   "olhos" = chapéu que desce até as orelhas), gira (graus). */
export const ACESSORIOS = {
    capelo:     { nome: "Capelo de formatura", slot: "cabeca", custo: 120, tam: 0.95, caixa: [6, 16, 93, 94] },
    cartola:    { nome: "Cartola",             slot: "cabeca", custo: 150, tam: 0.8,  caixa: [7, 12, 93, 93] },
    coroa:      { nome: "Coroa",               slot: "cabeca", custo: 400, tam: 0.7,  caixa: [7, 22, 93, 93] },
    bone:       { nome: "Boné",                slot: "cabeca", custo: 80,  tam: 0.95, caixa: [5, 20, 93, 78] },
    "chapeu-sol": { nome: "Chapéu de sol",     slot: "cabeca", custo: 100, tam: 1.05, caixa: [7, 31, 93, 93] },
    capacete:   { nome: "Capacete de obra",    slot: "cabeca", custo: 120, tam: 0.85, caixa: [12, 6, 88, 93] },
    cowboy:     { nome: "Chapéu de caubói",    slot: "cabeca", custo: 130, tam: 1.05, caixa: [4, 30, 96, 93], svg: true },
    "chapeu-festa": { nome: "Chapéu de festa", slot: "cabeca", custo: 70,  tam: 0.55, caixa: [26, 3, 80, 96], svg: true },
    "gorro-natal": { nome: "Gorro de Natal",   slot: "cabeca", custo: 90,  tam: 0.95, caixa: [6, 16, 95, 90], svg: true, afunda: 0.16 },
    toalha:     { nome: "Toalha na cabeça",    slot: "cabeca", custo: 60,  tam: 0.95, caixa: [6, 11, 94, 88], svg: true, afunda: 0.3,
                  meme: "acabou de sair do banho" },
    "chapeu-aluminio": { nome: "Chapéu de alumínio", slot: "cabeca", custo: 110, tam: 0.7, caixa: [9, 6, 91, 96], svg: true,
                  meme: "pra se proteger das teorias da conspiração" },
    fone:       { nome: "Fone de ouvido",      slot: "cabeca", custo: 140, tam: 1.12, caixa: [2, 33, 98, 86], svg: true, mira: "olhos", meio: 72 },
    aureola:    { nome: "Auréola",             slot: "cabeca", custo: 160, tam: 0.75, caixa: [4, 34, 96, 66], svg: true, afunda: -0.12,
                  meme: "anjinho (só na aparência)" },
    chifres:    { nome: "Chifrinhos",          slot: "cabeca", custo: 160, tam: 0.9,  caixa: [6, 32, 94, 92], svg: true, afunda: 0.14 },
    "coroa-flores": { nome: "Coroa de flores", slot: "cabeca", custo: 110, tam: 0.95, caixa: [4, 44, 96, 82], svg: true, afunda: 0.1 },
    laco:       { nome: "Laço",                slot: "cabeca", custo: 40,  tam: 0.42, caixa: [6, 19, 93, 93], lado: 0.32 },
    sakura:     { nome: "Flor de cerejeira",   slot: "cabeca", custo: 40,  tam: 0.32, caixa: [6, 9, 93, 93],  lado: -0.32 },
    hibisco:    { nome: "Hibisco",             slot: "cabeca", custo: 50,  tam: 0.36, caixa: [9, 7, 96, 91],  lado: 0.32 },
    tulipa:     { nome: "Tulipa",              slot: "cabeca", custo: 50,  tam: 0.3,  caixa: [22, 8, 78, 94], lado: -0.3 },
    girassol:   { nome: "Girassol",            slot: "cabeca", custo: 60,  tam: 0.38, caixa: [16, 6, 84, 94], lado: -0.3 },
    trevo:      { nome: "Trevo da sorte",      slot: "cabeca", custo: 70,  tam: 0.3,  caixa: [16, 6, 84, 93], lado: 0.3 },
    estrela:    { nome: "Estrela",             slot: "cabeca", custo: 90,  tam: 0.34, caixa: [6, 6, 93, 93] },

    oculos:     { nome: "Óculos",              slot: "rosto",  custo: 80,  tam: 0.88, caixa: [6, 31, 93, 65] },
    "oculos-sol": { nome: "Óculos escuros",    slot: "rosto",  custo: 120, tam: 0.88, caixa: [6, 31, 93, 66] },
    "oculos-pixel": { nome: "Óculos pixelados", slot: "rosto", custo: 150, tam: 0.95, caixa: [2, 40, 98, 60], svg: true,
                  meme: "o clássico “deal with it”" },
    "oculos-coracao": { nome: "Óculos de coração", slot: "rosto", custo: 110, tam: 0.9, caixa: [4, 36, 96, 62], svg: true },
    "oculos-3d": { nome: "Óculos 3D",          slot: "rosto",  custo: 100, tam: 0.92, caixa: [4, 38, 96, 64], svg: true },
    monoculo:   { nome: "Monóculo",            slot: "rosto",  custo: 130, tam: 0.8,  caixa: [19, 37, 45, 63], svg: true,
                  meme: "muito chique, muito culto" },
    "oculos-protecao": { nome: "Óculos de proteção", slot: "rosto", custo: 100, tam: 0.95, caixa: [6, 6, 93, 93], meio: 50 },
    "mascara-mergulho": { nome: "Máscara de mergulho", slot: "rosto", custo: 120, tam: 0.95, caixa: [16, 6, 93, 44] },
    pao:        { nome: "Pão na cara",         slot: "rosto",  custo: 180, tam: 1.3,  caixa: [8, 24, 92, 88], svg: true, mira: "rosto", meio: 56,
                  meme: "o gato com a cara enfiada no pão" },

    bigode:     { nome: "Bigode",              slot: "boca",   custo: 70,  tam: 0.6,  caixa: [4, 37, 96, 65], svg: true },
    "dentes-vampiro": { nome: "Dentes de vampiro", slot: "boca", custo: 80, tam: 0.42, caixa: [30, 40, 70, 66], svg: true, meio: 44 },
    rosa:       { nome: "Rosa na boca",        slot: "boca",   custo: 90,  tam: 0.6,  caixa: [28, 6, 79, 93], gira: 75,
                  meme: "pronto pro tango" },

    "cachecol-brasa":   { nome: "Cachecol da Casa Brasa",   slot: "pescoco", custo: 120, cores: ["#a3202b", "#e9b949"] },
    "cachecol-musgo":   { nome: "Cachecol da Casa Musgo",   slot: "pescoco", custo: 120, cores: ["#1e6040", "#c9cfd5"] },
    "cachecol-mare":    { nome: "Cachecol da Casa Maré",    slot: "pescoco", custo: 120, cores: ["#21417f", "#c29a5d"] },
    "cachecol-colmeia": { nome: "Cachecol da Casa Colmeia", slot: "pescoco", custo: 120, cores: ["#efc843", "#2e2e2e"] },
    "gravata-borboleta": { nome: "Gravata-borboleta", slot: "pescoco", custo: 70, tam: 0.42, caixa: [7, 31, 93, 69], svg: true },
    coleira:    { nome: "Coleira com sininho", slot: "pescoco", custo: 60,  tam: 0.95, caixa: [6, 14, 94, 60], svg: true },
    bandana:    { nome: "Bandana",             slot: "pescoco", custo: 80,  tam: 0.85, caixa: [6, 12, 94, 78], svg: true },
    medalha:    { nome: "Medalha de ouro",     slot: "pescoco", custo: 200, tam: 0.36, caixa: [12, 7, 87, 93] },
    correntao:  { nome: "Correntão",           slot: "pescoco", custo: 220, tam: 0.8,  caixa: [6, 8, 94, 78], svg: true,
                  meme: "ostentação de quem fechou a semana" },
    gema:       { nome: "Pingente de gema",    slot: "pescoco", custo: 250, tam: 0.26, caixa: [6, 25, 93, 94] },

    livros:     { nome: "Pilha de livros",     slot: "lado", custo: 60,  caixa: [6, 13, 93, 93] },
    cafe:       { nome: "Café",                slot: "lado", custo: 50,  caixa: [8, 6, 92, 93] },
    cha:        { nome: "Chá",                 slot: "lado", custo: 40,  caixa: [7, 7, 93, 93] },
    "bubble-tea": { nome: "Bubble tea",        slot: "lado", custo: 70,  caixa: [19, 6, 81, 93] },
    pirulito:   { nome: "Pirulito",            slot: "lado", custo: 40,  caixa: [6, 6, 93, 93] },
    rosquinha:  { nome: "Rosquinha",           slot: "lado", custo: 40,  caixa: [12, 6, 88, 93] },
    croissant:  { nome: "Croissant",           slot: "lado", custo: 45,  caixa: [13, 13, 99, 99] },
    baguete:    { nome: "Baguete",             slot: "lado", custo: 45,  caixa: [13, 13, 86, 86] },
    queijo:     { nome: "Queijo",              slot: "lado", custo: 45,  caixa: [10, 7, 87, 93] },
    peixe:      { nome: "Peixinho",            slot: "lado", custo: 50,  caixa: [6, 18, 93, 93] },
    banana:     { nome: "Banana",              slot: "lado", custo: 30,  caixa: [7, 10, 93, 93], meme: "banana pra escala" },
    abacate:    { nome: "Abacate",             slot: "lado", custo: 40,  caixa: [9, 6, 93, 93] },
    melancia:   { nome: "Melancia",            slot: "lado", custo: 40,  caixa: [7, 7, 93, 93] },
    sorvete:    { nome: "Sorvete",             slot: "lado", custo: 50,  caixa: [18, 8, 81, 93] },
    pizza:      { nome: "Pizza",               slot: "lado", custo: 60,  caixa: [9, 6, 87, 93] },
    hamburguer: { nome: "Hambúrguer",          slot: "lado", custo: 60,  caixa: [6, 22, 93, 93] },
    sushi:      { nome: "Sushi",               slot: "lado", custo: 70,  caixa: [6, 19, 93, 93] },
    lamen:      { nome: "Lámen",               slot: "lado", custo: 70,  caixa: [13, 6, 93, 93] },
    pipoca:     { nome: "Pipoca",              slot: "lado", custo: 60,  caixa: [18, 6, 82, 93], meme: "só assistindo o drama" },
    bolo:       { nome: "Bolo de aniversário", slot: "lado", custo: 90,  caixa: [6, 6, 94, 93] },
    balao:      { nome: "Balão",               slot: "lado", custo: 50,  caixa: [21, 6, 85, 93] },
    coracao:    { nome: "Coração",             slot: "lado", custo: 30,  caixa: [6, 17, 93, 93] },
    bola:       { nome: "Bola",                slot: "lado", custo: 60,  caixa: [9, 9, 91, 91] },
    novelo:     { nome: "Novelo de lã",        slot: "lado", custo: 50,  caixa: [11, 7, 85, 93] },
    patinho:    { nome: "Patinho",             slot: "lado", custo: 60,  caixa: [6, 6, 93, 93] },
    ursinho:    { nome: "Ursinho de pelúcia",  slot: "lado", custo: 90,  caixa: [6, 6, 94, 94] },
    planta:     { nome: "Plantinha",           slot: "lado", custo: 70,  caixa: [20, 6, 79, 93] },
    "guarda-chuva": { nome: "Guarda-chuva",    slot: "lado", custo: 70,  caixa: [6, 6, 93, 93] },
    festa:      { nome: "Lança-confete",       slot: "lado", custo: 90,  caixa: [9, 7, 91, 93] },
    lupa:       { nome: "Lupa",                slot: "lado", custo: 80,  caixa: [7, 7, 93, 93] },
    abaco:      { nome: "Ábaco",               slot: "lado", custo: 90,  caixa: [6, 7, 93, 94] },
    celular:    { nome: "Celular",             slot: "lado", custo: 100, caixa: [19, 6, 81, 93] },
    microfone:  { nome: "Microfone",           slot: "lado", custo: 110, caixa: [6, 11, 93, 93] },
    skate:      { nome: "Skate",               slot: "lado", custo: 120, caixa: [6, 6, 93, 93] },
    joystick:   { nome: "Joystick",            slot: "lado", custo: 130, caixa: [13, 7, 87, 93] },
    varinha:    { nome: "Varinha mágica",      slot: "lado", custo: 150, caixa: [6, 6, 93, 93] },
    "bola-cristal": { nome: "Bola de cristal", slot: "lado", custo: 150, caixa: [13, 6, 87, 93], meme: "prevê a nota da prova" },
    videogame:  { nome: "Videogame",           slot: "lado", custo: 160, caixa: [6, 26, 93, 93] },
    violao:     { nome: "Violão",              slot: "lado", custo: 180, caixa: [6, 9, 93, 93] },
    cerebro:    { nome: "Cérebro gigante",     slot: "lado", custo: 180, caixa: [7, 16, 93, 93], meme: "big brain: depois de estudar tudo" },
    moai:       { nome: "Moai",                slot: "lado", custo: 190, caixa: [6, 6, 91, 93], meme: "🗿" },
    notebook:   { nome: "Notebook",            slot: "lado", custo: 200, caixa: [7, 6, 93, 93] },
    foguete:    { nome: "Foguete",             slot: "lado", custo: 220, caixa: [7, 7, 93, 93], meme: "rumo à aprovação" },
    trofeu:     { nome: "Troféu",              slot: "lado", custo: 300, caixa: [14, 6, 86, 93] }
};

// pets salvos antes da troca de visual
const ANTIGOS = { corvo: "pinguim", "chapeu-mago": "cartola", flor: "sakura", gorro: "capacete", gravata: null };


const arquivo = (id) => ACESSORIOS[id]?.svg ? `${id}.svg` : `${id}.webp`;

export function imagemDe(id) {
    if (ESPECIES[id]) return `${PASTA}${id}.webp`;
    return ACESSORIOS[id] && !ACESSORIOS[id].cores ? `${PASTA}${arquivo(id)}` : null;
}


/* ---------- posição ---------- */

// o bicho ocupa 80% do palco, deixando espaço pra chapéu em cima e item do lado
const BICHO = { x: 13, y: 15, tam: 70 };
const noPalco = (x, y) => [BICHO.x + (x * BICHO.tam) / 100, BICHO.y + (y * BICHO.tam) / 100];


// pontos do rosto já no palco
function geometria(especie) {
    const [topo, olhos, queixo, cx, largura] = ESPECIES[especie].ancora;
    const [px, pTopo] = noPalco(cx, topo);
    return { px, pTopo, pOlhos: noPalco(cx, olhos)[1], pQueixo: noPalco(cx, queixo)[1], rosto: (largura * BICHO.tam) / 100 };
}


function camada(nome, esquerda, topo, largura, classe = "", estilo = "") {
    return `<img class="pet-camada ${classe}" src="${PASTA}${nome.includes(".") ? nome : `${nome}.webp`}" alt="" draggable="false"
                 style="left:${esquerda.toFixed(1)}%;top:${topo.toFixed(1)}%;width:${largura.toFixed(1)}%;${estilo}">`;
}


function acessorio(id, especie, classe = "") {

    const a = ACESSORIOS[id];
    const { px, pTopo, pOlhos, pQueixo, rosto } = geometria(especie);

    if (a.cores) return cachecol(a.cores, px, pQueixo, rosto);

    if (a.slot === "lado") {
        return camada(arquivo(id), 66, 62, 32, `pet-item ${classe}`);
    }

    const w = rosto * a.tam;
    const [, cTopo, , cBase] = a.caixa;
    const meio = ((a.meio ?? (cTopo + cBase) / 2) * w) / 100;
    const esquerda = px - w / 2 + (a.lado || 0) * rosto;
    const pos = (topo) => camada(arquivo(id), esquerda, topo, w, classe, a.gira ? `transform:rotate(${a.gira}deg)` : "");

    if (a.slot === "rosto") {
        return pos((a.mira === "rosto" ? (pTopo + pQueixo) / 2 : pOlhos) - meio);
    }
    if (a.slot === "boca") {
        return pos(pOlhos + (pQueixo - pOlhos) * 0.55 - meio);
    }
    if (a.slot === "pescoco") {
        return pos(pQueixo - 4 - (cTopo * w) / 100);
    }
    if (a.mira === "olhos") {
        return pos(pOlhos - meio);
    }
    // chapéus e enfeites: a base do item senta um pouco abaixo do topo da cabeça
    const afunda = (a.afunda ?? (a.lado ? 0.12 : 0.08)) * rosto;
    return pos(pTopo + afunda - (cBase * w) / 100);

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


/* ---------- reações (memes) ----------
   O jeito do pet ficar feliz, triste ou esperando. Cada uma brinca com um meme
   conhecido, remontado com os emojis e CSS (nenhuma foto do meme original).
   desenho(g, pet) devolve camadas atrás e na frente do bicho; cara = qual
   carinha o gato usa (ele tem desenho próprio pra feliz e triste). */

const fala = (texto, x, y, classe = "", estilo = "") =>
    `<span class="pet-fala ${classe}" style="left:${x}%;top:${y}%;${estilo}">${texto}</span>`;

// os bichos sem carinha triste ganham uma lágrima
const lagrima = (g, pet) => ESPECIES[pet.especie].humores ? "" : camada("gota", g.px + g.rosto * 0.22, g.pOlhos + 2, 9, "pet-gota");

export const REACOES = {
    "banho-triste": { nome: "Banho triste", humor: "triste", custo: 150, cara: "triste",
        meme: "o gatinho molhado chorando no banho",
        desenho: (g, pet) => ({ frente:
            camada("chuveiro", 66, -4, 34) +
            [0, 1, 2].map((i) => `<span class="pet-pingo" style="left:${68 + i * 4}%;top:${24 + i * 2}%;animation-delay:${i * 0.3}s"></span>`).join("") +
            camada("banheira", 9, 62, 82) +
            camada("bolhas", 2, 60, 22, "pet-bolha") + camada("bolhas", 80, 66, 16, "pet-bolha pet-atraso") +
            camada("patinho", 66, 61, 14) + lagrima(g, pet) }) },
    violino: { nome: "Violininho triste", humor: "triste", custo: 100, cara: "triste",
        meme: "a música mais triste do mundo tocando ao fundo",
        desenho: (g, pet) => ({ frente: camada("violino", 58, 52, 38, "pet-violino") + camada("notas", 4, 4, 24, "pet-nota-triste") + lagrima(g, pet) }) },
    "tudo-bem": { nome: "Tá tudo bem", humor: "triste", custo: 180, cara: "feliz",
        meme: "tomando café enquanto tudo pega fogo",
        desenho: () => ({
            atras: `<span class="pet-brasa"></span>` + camada("fogo", -6, 30, 30, "pet-fogo") + camada("fogo", 76, 26, 30, "pet-fogo pet-atraso"),
            frente: camada("fogo", 2, 66, 24, "pet-fogo pet-atraso") + camada("fogo", 80, 68, 22, "pet-fogo") +
                    camada("cafe", 58, 58, 28) + fala("tá tudo bem", 50, 3, "pet-fala-centro") }) },
    grilo: { nome: "Cri-cri", humor: "triste", custo: 90, cara: "esperando",
        meme: "aquele silêncio constrangedor",
        desenho: () => ({ frente: camada("grilo", 4, 72, 26, "pet-grilo") + fala("cri cri", 4, 60, "pet-fala-cri") }) },
    derretendo: { nome: "Derretendo", humor: "triste", custo: 120, cara: "triste",
        meme: "derretendo de tristeza 🫠",
        desenho: (g) => ({ atras: `<span class="pet-poca"></span>`,
                           frente: camada("respingos", g.px + g.rosto * 0.25, g.pTopo - 4, 16, "pet-gota") }) },

    oiia: { nome: "Giro OIIA", humor: "feliz", custo: 200, cara: "feliz",
        meme: "o gato que gira sem parar: oiia oiia",
        desenho: () => ({ frente: camada("notas", 4, 4, 22, "pet-nota") + fala("oiia", 66, 8, "pet-fala-oiia") + fala("oiia", 6, 70, "pet-fala-oiia pet-atraso") }) },
    vibando: { nome: "Vibando", humor: "feliz", custo: 120, cara: "feliz",
        meme: "balançando a cabeça no ritmo da música",
        desenho: () => ({ frente: camada("notas", 70, 2, 24, "pet-nota") + camada("notas", 2, 30, 18, "pet-nota pet-atraso") }) },
    stonks: { nome: "Stonks", humor: "feliz", custo: 150, cara: "feliz",
        meme: "o conhecimento só sobe 📈",
        desenho: () => ({ atras: camada("grafico", 54, 2, 42, "pet-grafico"),
                          frente: camada("dinheiro", 2, 8, 26, "pet-voa") + fala("STONKS", 50, 84, "pet-fala-centro pet-fala-stonks") }) },
    "deal": { nome: "Óculos caindo", humor: "feliz", custo: 180, cara: "esperando",
        meme: "os óculos pixelados descendo do céu: “deal with it”",
        desenho: (g, pet) => ({ frente: acessorio("oculos-pixel", pet.especie, "pet-cai") }) },
    wow: { nome: "Muito wow", humor: "feliz", custo: 140, cara: "feliz",
        meme: "muito estudo. tão foco. wow",
        desenho: () => ({ frente: [["muito estudo", 3, 5, "#ff3d7f"], ["tão foco", 58, 20, "#1fa2ff"], ["wow", 6, 60, "#f2a100"], ["mto sabido", 48, 80, "#2bb673"]]
            .map(([t, x, y, cor], i) => fala(t, x, y, "pet-doge", `color:${cor};animation-delay:${i * 0.6}s`)).join("") }) },
    "arco-iris": { nome: "Rastro de arco-íris", humor: "feliz", custo: 220, cara: "feliz",
        meme: "voando pelo espaço com um rastro de arco-íris",
        desenho: (g) => ({ atras: `<span class="pet-trilha" style="top:${(g.pOlhos - 10).toFixed(1)}%"></span>` +
                                  camada("brilho", 4, 8, 12, "pet-brilho") + camada("brilho", 84, 72, 10, "pet-brilho pet-atraso") }) },
    discoteca: { nome: "Discoteca", humor: "feliz", custo: 160, cara: "feliz",
        meme: "a sexta-feira chegou",
        desenho: () => ({ atras: `<span class="pet-luzes"></span>`, frente: camada("globo-disco", 38, -8, 24, "pet-globo") }) },
    morri: { nome: "Morri de rir", humor: "feliz", custo: 100, cara: "feliz",
        meme: "💀💀💀 kkkkk",
        desenho: () => ({ frente: camada("caveira", 4, 40, 18, "pet-sobe") + camada("rindo", 76, 34, 20, "pet-sobe pet-atraso") +
                                  camada("caveira", 72, 66, 14, "pet-sobe pet-atraso2") + fala("kkkkk", 4, 80, "pet-fala-kkk") }) },

    esqueleto: { nome: "Esperando até hoje", humor: "esperando", custo: 120, cara: "esperando",
        meme: "esperando tanto que até criou teia",
        desenho: () => ({ frente: camada("teia", -6, -6, 34) + camada("teia", 72, -6, 34, "pet-espelho") + camada("ampulheta", 76, 62, 18, "pet-ampulheta") }) },
    contas: { nome: "Fazendo contas", humor: "esperando", custo: 120, cara: "esperando",
        meme: "a moça confusa fazendo contas",
        desenho: () => ({ frente: [["x²", 4, 8], ["π", 80, 6], ["√2", 80, 46], ["∑", 4, 46], ["÷", 42, 0], ["∫", 14, 76], ["a+b", 68, 76]]
            .map(([t, x, y], i) => fala(t, x, y, "pet-conta", `animation-delay:${(i * 0.45).toFixed(2)}s`)).join("") }) },
    "de-canto": { nome: "Olhar de canto", humor: "esperando", custo: 90, cara: "esperando",
        meme: "te julgando de canto de olho",
        desenho: () => ({ frente: camada("olhos", 68, 2, 26, "pet-olhar") }) },
    pensando: { nome: "Pensativo", humor: "esperando", custo: 80, cara: "esperando",
        meme: "processando… processando…",
        desenho: () => ({ frente: camada("pensamento", 58, -4, 40, "pet-balao") + fala("?", 74, 3, "pet-fala-pensa") }) },
    soneca: { nome: "Soneca", humor: "esperando", custo: 60, cara: "esperando",
        meme: "só mais cinco minutinhos",
        desenho: () => ({ frente: camada("zzz", 66, 0, 26, "pet-zzz") }) }
};


/* ---------- o pet inteiro ---------- */

export function normalizar(pet = {}) {
    const especie = ESPECIES[pet.especie] ? pet.especie : (ESPECIES[ANTIGOS[pet.especie]] ? ANTIGOS[pet.especie] : "gato");
    const acessorios = (pet.acessorios || []).map((id) => (id in ANTIGOS ? ANTIGOS[id] : id)).filter((id) => ACESSORIOS[id]);
    const reacoes = Object.fromEntries(Object.entries(pet.reacoes || {}).filter(([humor, id]) => REACOES[id]?.humor === humor));
    return { ...pet, especie, tom: TONS[pet.tom] ? pet.tom : "original", fundo: FUNDOS[pet.fundo] ? pet.fundo : "nenhum", acessorios, reacoes };
}


export function desenharPet(petCru, humor = "esperando", { titulo = "", cenario = false } = {}) {

    const pet = normalizar(petCru);
    const especie = ESPECIES[pet.especie];
    const g = geometria(pet.especie);
    const reacaoId = pet.reacoes[humor];
    const reacao = REACOES[reacaoId];

    const cara = reacao ? reacao.cara : humor;
    const imagem = especie.humores && cara !== "esperando" ? `${pet.especie}-${cara}` : pet.especie;
    const usar = (slot) => pet.acessorios.filter((id) => ACESSORIOS[id].slot === slot).slice(0, 1)
                                          .map((id) => acessorio(id, pet.especie)).join("");

    let atras = "";
    let frente = "";
    if (reacao) {
        ({ atras = "", frente = "" } = reacao.desenho(g, pet));
    } else if (humor === "feliz") {
        frente = camada("brilho", 70, 4, 24, "pet-brilho");
    } else if (humor === "triste") {
        // com chapéu, a nuvem vai pro canto de cima pra não cobrir o acessório
        const chapeu = pet.acessorios.some((id) => ACESSORIOS[id].slot === "cabeca" && !ACESSORIOS[id].lado);
        frente = (chapeu ? camada("chuva", 64, -4, 32, "pet-chuva") : camada("chuva", g.px - 17, Math.max(-6, g.pTopo - 30), 34, "pet-chuva")) +
                 lagrima(g, pet);
    }

    const classes = [reacao ? `pet-r pet-r-${reacaoId}` : `pet-${humor}`, cenario && pet.fundo !== "nenhum" ? `pet-fundo-${pet.fundo}` : ""];
    const tom = TONS[pet.tom];

    return `<div class="pet ${classes.join(" ")}" role="img" aria-label="${titulo}" title="${titulo}">
        ${atras}
        <div class="pet-corpo">
            <img class="pet-camada pet-bicho ${tom.classe || ""}" src="${PASTA}${imagem}.webp" alt="" draggable="false"
                 style="left:${BICHO.x}%;top:${BICHO.y}%;width:${BICHO.tam}%;filter:${tom.filtro}">
            ${usar("pescoco")}
            ${usar("boca")}
            ${usar("rosto")}
            ${usar("cabeca")}
            ${usar("lado")}
        </div>
        ${frente}
    </div>`;

}
