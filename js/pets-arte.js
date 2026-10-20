/* =========================================================
   PETS — desenho (SVG em código, como as cenas)
   ---------------------------------------------------------
   Todos os bichos usam o mesmo esqueleto (cabeça grande no
   centro, corpo embaixo), então qualquer acessório serve em
   qualquer um. Humor: "feliz", "esperando" ou "triste".
========================================================= */


export const ESPECIES = {
    gato:     { nome: "Gato",     custo: 0,   cor: "laranja" },
    cachorro: { nome: "Cachorro", custo: 0,   cor: "caramelo" },
    coelho:   { nome: "Coelho",   custo: 150, cor: "branco" },
    raposa:   { nome: "Raposa",   custo: 250, cor: "laranja" },
    coruja:   { nome: "Coruja",   custo: 300, cor: "marrom" },
    corvo:    { nome: "Corvo",    custo: 300, cor: "preto" }
};

export const CORES = {
    laranja:  { nome: "Laranja",  hex: "#f2a65a" },
    caramelo: { nome: "Caramelo", hex: "#d9a066" },
    branco:   { nome: "Branco",   hex: "#f3efe7" },
    cinza:    { nome: "Cinza",    hex: "#a7adb8" },
    marrom:   { nome: "Marrom",   hex: "#9a6b47" },
    preto:    { nome: "Preto",    hex: "#3b3b46" }
};

// slot: só um acessório por lugar (cabeça, pescoço, rosto)
export const ACESSORIOS = {
    "cachecol-brasa":   { nome: "Cachecol da Casa Brasa",   slot: "pescoco", custo: 120, cores: ["#9e1b25", "#e8b63c"] },
    "cachecol-musgo":   { nome: "Cachecol da Casa Musgo",   slot: "pescoco", custo: 120, cores: ["#1d5a3c", "#c3c9cf"] },
    "cachecol-mare":    { nome: "Cachecol da Casa Maré",    slot: "pescoco", custo: 120, cores: ["#1f3c78", "#b98f55"] },
    "cachecol-colmeia": { nome: "Cachecol da Casa Colmeia", slot: "pescoco", custo: 120, cores: ["#ecc440", "#2c2c2c"] },
    "gravata":          { nome: "Gravata-borboleta",        slot: "pescoco", custo: 60 },
    "laco":             { nome: "Laço",                     slot: "cabeca",  custo: 40 },
    "flor":             { nome: "Flor de cerejeira",        slot: "cabeca",  custo: 40 },
    "gorro":            { nome: "Gorro de lã",              slot: "cabeca",  custo: 100 },
    "chapeu-mago":      { nome: "Chapéu de mago",           slot: "cabeca",  custo: 200 },
    "coroa":            { nome: "Coroa",                    slot: "cabeca",  custo: 400 },
    "oculos":           { nome: "Óculos redondos",          slot: "rosto",   custo: 80 },
    "oculos-sol":       { nome: "Óculos escuros",           slot: "rosto",   custo: 120 }
};


/* ---------- cor ---------- */

function misturar(hex, alvo, t) {
    const a = parseInt(hex.slice(1), 16), b = parseInt(alvo.slice(1), 16);
    const canal = (deslocamento) => {
        const x = (a >> deslocamento) & 255, y = (b >> deslocamento) & 255;
        return Math.round(x + (y - x) * t);
    };
    return `#${((1 << 24) | (canal(16) << 16) | (canal(8) << 8) | canal(0)).toString(16).slice(1)}`;
}

const clarear = (hex, t) => misturar(hex, "#ffffff", t);
const escurecer = (hex, t) => misturar(hex, "#1a1a22", t);

function escura(hex) {
    const n = parseInt(hex.slice(1), 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 < 0.42;
}

// lado direito = lado esquerdo espelhado
const espelho = (svg) => `${svg}<g transform="translate(200 0) scale(-1 1)">${svg}</g>`;

const TINTA = "#2b2b33";
const ROSA = "#f4a7b6";


/* ---------- olhos e boca ---------- */

function rosto(humor, olhosClaros, bico) {

    const iris = olhosClaros ? "#ffd75e" : TINTA;
    const linha = olhosClaros ? "#f6ecd8" : TINTA;
    const bochecha = `<ellipse cx="70" cy="108" rx="9" ry="5.5" fill="${ROSA}" opacity="${humor === "feliz" ? 0.7 : 0.4}"/>`;

    let olhos, boca, extra = "";

    if (humor === "feliz") {
        olhos = espelho(`<path d="M71 95 Q80 84 89 95" fill="none" stroke="${linha}" stroke-width="4.2" stroke-linecap="round"/>`);
        boca = `<path d="M91 109 Q100 120 109 109 Q100 113 91 109 Z" fill="#c95b6c" stroke="${linha}" stroke-width="2.4" stroke-linejoin="round"/>`;
    } else if (humor === "triste") {
        olhos = espelho(`
            <ellipse cx="80" cy="96" rx="7.5" ry="8.5" fill="${iris}"/>
            ${olhosClaros ? `<ellipse cx="80" cy="97" rx="3.6" ry="5" fill="${TINTA}"/>` : ""}
            <circle cx="77.5" cy="93.5" r="2.6" fill="#fff"/>
            <path d="M69 88 Q78 83 89 80" fill="none" stroke="${linha}" stroke-width="3" stroke-linecap="round"/>`);
        boca = `<path d="M92 115 Q100 107 108 115" fill="none" stroke="${linha}" stroke-width="3" stroke-linecap="round"/>`;
        extra = `<path class="pet-lagrima" d="M122 104 Q118 112 122 115 Q126 112 122 104 Z" fill="#8fc7ff" stroke="#5aa0e6" stroke-width="1"/>`;
    } else {
        olhos = espelho(`
            <ellipse cx="80" cy="95" rx="7.5" ry="9" fill="${iris}"/>
            ${olhosClaros ? `<ellipse cx="80" cy="96" rx="3.6" ry="5.4" fill="${TINTA}"/>` : ""}
            <circle cx="77.2" cy="91.5" r="3" fill="#fff"/>
            <circle cx="82.5" cy="98.5" r="1.4" fill="#fff" opacity="0.8"/>`);
        boca = `<path d="M94 110 Q97 114 100 110 Q103 114 106 110" fill="none" stroke="${linha}" stroke-width="2.4" stroke-linecap="round"/>`;
    }

    return espelho(bochecha) + olhos + (bico ? "" : boca) + extra;

}


/* ---------- bichos ---------- */

// cada um devolve { atras, frente }: o que fica atrás da cabeça e o que vai por cima dela
const BICHOS = {

    gato(c, humor) {
        const orelha = humor === "triste"
            ? `<g transform="rotate(-22 74 52)"><path d="M58 68 L60 30 Q62 25 67 28 L94 52 Z" fill="${c}"/><path d="M65 60 L66 38 L85 53 Z" fill="${ROSA}"/></g>`
            : `<path d="M58 68 L60 30 Q62 25 67 28 L94 52 Z" fill="${c}"/><path d="M65 60 L66 38 L85 53 Z" fill="${ROSA}"/>`;
        return {
            atras: `<path d="M138 170 C 172 172, 182 134, 164 112" fill="none" stroke="${c}" stroke-width="13" stroke-linecap="round"/>
                    <path d="M168 120 C 172 116, 168 108, 162 108" fill="none" stroke="${escurecer(c, 0.25)}" stroke-width="13" stroke-linecap="round"/>
                    ${espelho(orelha)}`,
            frente: `${espelho(`<path d="M64 104 L42 100 M64 110 L43 113" stroke="${escurecer(c, 0.45)}" stroke-width="1.6" stroke-linecap="round" opacity="0.55"/>`)}
                     <path d="M96.5 103 L103.5 103 L100 107 Z" fill="${ROSA}"/>`
        };
    },

    cachorro(c, humor) {
        const caida = humor === "triste" ? 30 : 16;
        return {
            atras: `<path d="M140 162 Q166 150 162 128" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="round" class="pet-rabo"/>`,
            frente: `${espelho(`<ellipse cx="55" cy="88" rx="15" ry="30" transform="rotate(${caida} 55 70)" fill="${escurecer(c, 0.28)}"/>`)}
                     <ellipse cx="100" cy="110" rx="21" ry="15" fill="${clarear(c, 0.6)}"/>
                     <ellipse cx="100" cy="102.5" rx="7.5" ry="5.5" fill="${TINTA}"/>
                     <ellipse cx="98" cy="101" rx="2.4" ry="1.4" fill="#fff" opacity="0.7"/>`
        };
    },

    coelho(c, humor) {
        const angulo = humor === "triste" ? -58 : -8;
        const orelha = `<g transform="rotate(${angulo} 84 56)"><ellipse cx="84" cy="24" rx="12" ry="33" fill="${c}"/><ellipse cx="84" cy="26" rx="5.5" ry="24" fill="${ROSA}"/></g>`;
        return {
            atras: espelho(orelha),
            frente: `<path d="M96.5 103 L103.5 103 L100 107 Z" fill="${ROSA}"/>
                     <path d="M95 118 L95 123 M105 118 L105 123" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`
        };
    },

    raposa(c, humor) {
        const ponta = escurecer(c, 0.62);
        const orelha = `<path d="M56 72 L54 22 L98 50 Z" fill="${c}"/><path d="M54 22 L55 38 L68 30 Z" fill="${ponta}"/><path d="M62 62 L61 36 L84 51 Z" fill="${clarear(c, 0.55)}"/>`;
        return {
            atras: `<path d="M136 178 C 190 182, 194 118, 160 104 C 174 134, 164 156, 130 160 Z" fill="${c}"/>
                    <path d="M160 104 C 176 112, 182 128, 178 140 C 170 128, 166 116, 160 104 Z" fill="#fff8ef"/>
                    ${espelho(humor === "triste" ? `<g transform="rotate(-20 76 54)">${orelha}</g>` : orelha)}`,
            frente: `<path d="M50 96 Q58 128 100 132 Q142 128 150 96 Q128 114 100 110 Q72 114 50 96 Z" fill="#fff8ef"/>
                     <ellipse cx="100" cy="104" rx="6" ry="4.5" fill="${TINTA}"/>`
        };
    },

    coruja(c) {
        return {
            atras: espelho(`<path d="M60 60 L54 30 L84 48 Z" fill="${escurecer(c, 0.2)}"/>`),
            frente: `${espelho(`<circle cx="80" cy="95" r="20" fill="${clarear(c, 0.55)}"/>`)}
                     <path d="M94 104 L106 104 L100 116 Z" fill="#f2a93b" stroke="#c97f1f" stroke-width="1.4" stroke-linejoin="round"/>`,
            bico: true,
            corpo: `${espelho(`<ellipse cx="58" cy="156" rx="14" ry="26" transform="rotate(14 58 156)" fill="${escurecer(c, 0.22)}"/>`)}
                    ${[0, 1, 2].map((i) => `<path d="M${88 + i * 12} ${158 + (i % 2) * 6} q4 5 8 0" fill="none" stroke="${escurecer(c, 0.3)}" stroke-width="2" stroke-linecap="round"/>`).join("")}`
        };
    },

    corvo(c) {
        return {
            atras: `<path d="M90 44 Q94 22 100 40 Q106 20 110 44 Z" fill="${c}"/>`,
            frente: `<path d="M90 102 Q100 96 110 102 L100 122 Z" fill="#6f7480" stroke="#4d515b" stroke-width="1.4" stroke-linejoin="round"/>
                     <path d="M95 101 Q100 99 104 101" fill="none" stroke="#9aa0ab" stroke-width="2" stroke-linecap="round"/>`,
            bico: true,
            corpo: espelho(`<ellipse cx="58" cy="156" rx="14" ry="27" transform="rotate(14 58 156)" fill="${escurecer(c, 0.3)}"/>`)
        };
    }

};


/* ---------- acessórios ---------- */

function cachecol([a, b]) {
    return `<path d="M54 130 Q100 152 146 130 L148 143 Q100 166 52 143 Z" fill="${a}"/>
            <path d="M53 135 Q100 157 147 135" fill="none" stroke="${b}" stroke-width="3"/>
            <path d="M53 140 Q100 162 147 140" fill="none" stroke="${b}" stroke-width="3"/>
            <g transform="rotate(-6 124 150)">
                <path d="M114 146 L134 146 L134 186 L114 186 Z" fill="${a}"/>
                <rect x="114" y="156" width="20" height="4" fill="${b}"/>
                <rect x="114" y="164" width="20" height="4" fill="${b}"/>
                <rect x="114" y="174" width="20" height="4" fill="${b}"/>
                ${[0, 1, 2, 3, 4].map((i) => `<path d="M${116 + i * 4} 186 v6" stroke="${a}" stroke-width="2.2" stroke-linecap="round"/>`).join("")}
            </g>`;
}

const DESENHO_ACESSORIO = {
    "cachecol-brasa": () => cachecol(ACESSORIOS["cachecol-brasa"].cores),
    "cachecol-musgo": () => cachecol(ACESSORIOS["cachecol-musgo"].cores),
    "cachecol-mare": () => cachecol(ACESSORIOS["cachecol-mare"].cores),
    "cachecol-colmeia": () => cachecol(ACESSORIOS["cachecol-colmeia"].cores),

    gravata: () => `<path d="M100 141 L80 131 L80 151 Z" fill="#c0392b"/><path d="M100 141 L120 131 L120 151 Z" fill="#c0392b"/>
                    <path d="M100 141 L84 134 M100 141 L116 134" stroke="#8e2a20" stroke-width="1.6"/>
                    <rect x="94" y="135" width="12" height="12" rx="4" fill="#a93226"/>`,

    laco: () => `<g transform="translate(136 52) rotate(18)">
                    <path d="M0 0 C -18 -16, -26 6, -6 4 Z" fill="#ef6f8f"/><path d="M0 0 C 18 -16, 26 6, 6 4 Z" fill="#ef6f8f"/>
                    <path d="M0 0 L -10 16 M0 0 L 8 16" stroke="#e05578" stroke-width="4" stroke-linecap="round"/>
                    <circle r="5" fill="#d94b6e"/></g>`,

    flor: () => `<g transform="translate(64 52)">
                    ${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-8" rx="6" ry="9" transform="rotate(${a})" fill="#ffc8d6" stroke="#f3a3ba" stroke-width="1"/>`).join("")}
                    <circle r="4.5" fill="#f7d35c"/></g>`,

    gorro: () => `<path d="M46 80 Q46 26 100 24 Q154 26 154 80 Z" fill="#d1495b"/>
                  ${[64, 82, 100, 118, 136].map((x) => `<path d="M${x} 32 Q${x - 2} 56 ${x} 78" fill="none" stroke="#b23a4b" stroke-width="2" opacity="0.7"/>`).join("")}
                  <path d="M42 72 Q100 60 158 72 L158 88 Q100 76 42 88 Z" fill="#f3efe7"/>
                  <circle cx="100" cy="20" r="12" fill="#f3efe7"/>`,

    "chapeu-mago": () => `<path d="M64 54 Q86 30 94 -6 Q102 -16 110 -6 Q118 28 138 54 Z" fill="#5a47a8"/>
                          <path d="M110 -6 Q122 -4 128 6" fill="none" stroke="#5a47a8" stroke-width="7" stroke-linecap="round"/>
                          <ellipse cx="100" cy="54" rx="56" ry="11" fill="#47388a"/>
                          <path d="M70 46 Q100 54 132 46 L134 52 Q100 60 68 52 Z" fill="#f2c94c"/>
                          <path d="M96 18 l2.5 5 5.5 .8 -4 3.8 1 5.4 -5 -2.6 -5 2.6 1 -5.4 -4 -3.8 5.5 -.8 Z" fill="#f7dd72"/>
                          <circle cx="112" cy="34" r="2" fill="#f7dd72"/><circle cx="84" cy="36" r="1.6" fill="#f7dd72"/>`,

    coroa: () => `<path d="M72 50 L68 20 L86 34 L100 12 L114 34 L132 20 L128 50 Z" fill="#f2c14e" stroke="#c99a2e" stroke-width="2" stroke-linejoin="round"/>
                  <rect x="72" y="44" width="56" height="8" rx="3" fill="#e0ad3a"/>
                  <circle cx="100" cy="36" r="4" fill="#e0475b"/><circle cx="84" cy="42" r="3" fill="#4aa3df"/><circle cx="116" cy="42" r="3" fill="#4aa3df"/>`,

    oculos: () => `${espelho(`<circle cx="80" cy="95" r="14" fill="rgba(255,255,255,0.18)" stroke="${TINTA}" stroke-width="3"/>`)}
                   <path d="M94 93 Q100 89 106 93" fill="none" stroke="${TINTA}" stroke-width="3"/>`,

    "oculos-sol": () => `${espelho(`<path d="M64 88 Q80 84 94 88 Q94 104 80 106 Q66 104 64 88 Z" fill="#23232b" stroke="${TINTA}" stroke-width="2.4"/><path d="M70 92 L76 90" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.6"/>`)}
                         <path d="M94 90 Q100 87 106 90" fill="none" stroke="${TINTA}" stroke-width="3"/>`
};


/* ---------- o pet inteiro ---------- */

export function desenharPet({ especie = "gato", cor, acessorios = [] } = {}, humor = "esperando", { titulo = "" } = {}) {

    const bicho = BICHOS[especie] ? especie : "gato";
    const base = (CORES[cor] || CORES[ESPECIES[bicho].cor]).hex;
    const partes = BICHOS[bicho](base, humor);
    const usar = (slot) => acessorios.filter((id) => ACESSORIOS[id]?.slot === slot && DESENHO_ACESSORIO[id])
                                     .slice(0, 1).map((id) => DESENHO_ACESSORIO[id]()).join("");

    const contorno = escurecer(base, 0.35);

    return `<svg class="pet pet-${humor}" viewBox="0 -22 200 222" role="img" aria-label="${titulo}" xmlns="http://www.w3.org/2000/svg">
        ${titulo ? `<title>${titulo}</title>` : ""}
        <ellipse class="pet-sombra" cx="100" cy="194" rx="48" ry="7" fill="#000" opacity="0.13"/>
        <g class="pet-corpo">
            ${partes.atras}
            <ellipse cx="100" cy="160" rx="46" ry="34" fill="${base}" stroke="${contorno}" stroke-width="2"/>
            <ellipse cx="100" cy="168" rx="27" ry="20" fill="${clarear(base, 0.5)}"/>
            ${espelho(`<ellipse cx="80" cy="190" rx="13" ry="7" fill="${base}" stroke="${contorno}" stroke-width="2"/>`)}
            ${partes.corpo || ""}
            ${usar("pescoco")}
            <g class="pet-cabeca"${humor === "triste" ? ' transform="translate(0 5) rotate(-5 100 140)"' : ""}>
                <circle cx="100" cy="92" r="50" fill="${base}" stroke="${contorno}" stroke-width="2"/>
                <ellipse cx="84" cy="66" rx="16" ry="9" fill="#fff" opacity="0.18" transform="rotate(-20 84 66)"/>
                ${partes.frente}
                ${rosto(humor, escura(base), Boolean(partes.bico))}
                ${usar("rosto")}
                ${usar("cabeca")}
            </g>
        </g>
        ${humor === "feliz" ? `<g class="pet-brilho" fill="#ffd75e">
            <path d="M160 34 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z"/>
            <path d="M38 62 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z"/>
        </g>` : ""}
    </svg>`;

}
