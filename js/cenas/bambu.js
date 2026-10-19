/* =========================================================
   CENA — Bambuzal à noite, com vaga-lumes
   ---------------------------------------------------------
   Noite verde-escura num bambuzal (pense em Arashiyama): o
   luar entra em feixes pela névoa, os colmos vão do quase
   preto (perto) ao verde-cinza (longe, na névoa) e cada um tem
   o lado da lua aceso. Uma lanterna de pedra (tōrō) no chão.

   Cada tarefa acende mais vaga-lumes (piscando e pairando, na
   camada viva) e aquece a lanterna. 100%: o bambuzal inteiro
   cintila e a lanterna brilha forte.
========================================================= */

import { el, novaCena, quantas, semente } from "./comum.js";
import { pincelada, preparar, suavizar } from "./tinta.js";
import { camadaViva, juntar, vagalumes } from "./vivos.js";


/* Colmos: x na base, inclinação, espessura, profundidade (0 = perto, 1 = longe). */
const COLMOS = [
    { x: 1500, inclina: -0.05, w: 26, longe: 0 },
    { x: 1360, inclina: 0.02, w: 21, longe: .12 },
    { x: 120, inclina: 0.04, w: 24, longe: .05 },
    { x: 260, inclina: -0.02, w: 17, longe: .3 },
    { x: 40, inclina: 0.06, w: 12, longe: .55 },
    { x: 400, inclina: 0.03, w: 11, longe: .7 },
    { x: 1220, inclina: -0.03, w: 12, longe: .62 },
    { x: 560, inclina: 0.01, w: 8, longe: .85 },
    { x: 1080, inclina: 0.02, w: 8, longe: .9 },
    { x: 760, inclina: -0.01, w: 6, longe: .95 },
    { x: 930, inclina: 0.02, w: 6, longe: .97 }
];

const MAX_VAGALUMES = 70;


function corColmo(longe) {
    // perto: verde quase preto; longe: some na névoa verde-azulada
    const perto = [8, 22, 16], nevoa = [62, 104, 98];
    return `rgb(${perto.map((v, i) => Math.round(v + (nevoa[i] - v) * longe)).join(",")})`;
}


function lanterna(pai, id) {
    // tōrō de pedra: base, fuste, caixa da luz (com treliça), telhado curvo e joia.
    // A lua bate pela esquerda; a vela acende a caixa por dentro.
    const g = el("g", { transform: "translate(1180 948)" }, pai);
    const halo = el("circle", { cx: 0, cy: -150, r: 260, fill: `url(#${id}-chama)`, opacity: .2 }, g);
    const poca = el("ellipse", { cx: 0, cy: 2, rx: 210, ry: 26, fill: `url(#${id}-chama)`, opacity: .2 }, g);
    const pedra = { fill: `url(#${id}-pedra)` };
    el("path", { d: "M-74 0 L74 0 L60 -28 L-60 -28 Z", ...pedra }, g);
    el("rect", { x: -19, y: -104, width: 38, height: 78, ...pedra }, g);
    for (const y of [-80, -56]) el("line", { x1: -19, y1: y, x2: 19, y2: y, stroke: "#0a1210", "stroke-width": 2 }, g);
    el("path", { d: "M-54 -104 L54 -104 L46 -122 L-46 -122 Z", ...pedra }, g);
    el("rect", { x: -42, y: -192, width: 84, height: 70, ...pedra }, g);
    const interior = el("rect", { x: -26, y: -180, width: 52, height: 48, fill: `url(#${id}-vela)`, opacity: .3 }, g);
    const trelica = el("g", { stroke: "#16201d", "stroke-width": 3 }, g);
    for (const x of [-9, 9]) el("line", { x1: x, y1: -180, x2: x, y2: -132 }, trelica);
    el("line", { x1: -26, y1: -156, x2: 26, y2: -156 }, trelica);
    el("rect", { x: -26, y: -180, width: 52, height: 48, fill: "none", stroke: "#16201d", "stroke-width": 3 }, g);
    el("path", { d: "M-84 -192 Q-42 -202 0 -238 Q42 -202 84 -192 Q95 -188 101 -199 L84 -203 Q42 -211 0 -251 Q-42 -211 -84 -203 L-101 -199 Q-95 -188 -84 -192 Z", ...pedra }, g);
    el("circle", { cx: 0, cy: -262, r: 12, ...pedra }, g);
    // luar na aresta de cima e musgo
    el("path", { d: "M-96 -197 Q-44 -206 0 -246", stroke: "#bfe8d6", "stroke-opacity": ".55", "stroke-width": 2.5, fill: "none", "stroke-linecap": "round" }, g);
    el("path", { d: "M-74 0 L-60 -28 M-42 -122 L-42 -192 M-19 -104 L-19 -26", stroke: "#9cc9b8", "stroke-opacity": ".35", "stroke-width": 2 }, g);
    for (const [x, y, r] of [[-50, -110, 7], [30, -112, 5], [-60, -4, 9], [52, -4, 6], [-70, -196, 6]]) {
        el("ellipse", { cx: x, cy: y, rx: r * 1.6, ry: r * .7, fill: "#3f6a4a", opacity: ".55" }, g);
    }
    return { halo, janela: interior, poca };
}


export const bambu = {
    id: "bambu",
    nome: "Bambuzal com vaga-lumes",
    desc: "Noite no bambuzal: cada tarefa acende vaga-lumes",
    escuro: () => true,

    montar(container) {
        const { svg, id } = novaCena(container);
        const rand = semente(14);
        const defs = preparar(svg, id);
        defs.insertAdjacentHTML("beforeend", `
            <linearGradient id="${id}-noite" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#040b0a"/><stop offset=".55" stop-color="#0b201c"/><stop offset="1" stop-color="#173a33"/></linearGradient>
            <linearGradient id="${id}-feixe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#d6f3e6" stop-opacity=".24"/><stop offset="1" stop-color="#d6f3e6" stop-opacity="0"/></linearGradient>
            <linearGradient id="${id}-nevoa" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#5f948a" stop-opacity="0"/><stop offset=".6" stop-color="#5f948a" stop-opacity=".35"/><stop offset="1" stop-color="#2b5048" stop-opacity=".7"/></linearGradient>
            <radialGradient id="${id}-chama"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".85"/><stop offset=".35" stop-color="#ff9f4a" stop-opacity=".25"/><stop offset="1" stop-color="#ff9f4a" stop-opacity="0"/></radialGradient>
            <linearGradient id="${id}-pedra" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#3d4f49"/><stop offset=".45" stop-color="#22302c"/><stop offset="1" stop-color="#0f1714"/></linearGradient>
            <linearGradient id="${id}-vela" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#fff0b8"/><stop offset=".6" stop-color="#ffb24a"/><stop offset="1" stop-color="#e2702a"/></linearGradient>
            <radialGradient id="${id}-vagalume"><stop offset="0" stop-color="#fbffb0"/><stop offset=".25" stop-color="#d8ff6a" stop-opacity=".75"/><stop offset="1" stop-color="#9dff3a" stop-opacity="0"/></radialGradient>
            <radialGradient id="${id}-lua"><stop offset="0" stop-color="#eefcf4" stop-opacity=".9"/><stop offset=".2" stop-color="#cfeee0" stop-opacity=".35"/><stop offset="1" stop-color="#cfeee0" stop-opacity="0"/></radialGradient>`);

        el("rect", { width: 1600, height: 1000, fill: `url(#${id}-noite)` }, svg);
        el("circle", { cx: 820, cy: -40, r: 520, fill: `url(#${id}-lua)` }, svg);

        // colmos, do mais longe (névoa) ao mais perto; névoa entre as camadas
        const ordem = [...COLMOS].sort((a, b) => b.longe - a.longe);
        let nevoaPosta = false;
        ordem.forEach((c, ci) => {
            if (!nevoaPosta && c.longe < .5) {
                el("rect", { x: 0, y: 380, width: 1600, height: 620, fill: `url(#${id}-nevoa)` }, svg);
                nevoaPosta = true;
            }
            const g = el("g", { filter: `url(#${id}-pincel)` }, svg);
            const cor = corColmo(c.longe);
            let y = 1060, x = c.x, gomo = 0;
            while (y > -100) {
                const comp = 130 + rand() * 50;
                const x2 = x + c.inclina * comp, y2 = y - comp;
                const centro = suavizar([[x, y - 6], [(x + x2) / 2, (y + y2) / 2], [x2, y2 + 6]], 10);
                pincelada(g, centro, (t) => c.w * (1 + 0.14 * Math.cos(t * Math.PI * 2)), { fill: cor });
                // o lado da lua (esquerdo) aceso, mais forte perto
                pincelada(g, centro.map(([px, py]) => [px - c.w * .62, py]), () => c.w * .12, { fill: "#a9e0c8", opacity: (0.45 * (1 - c.longe)).toFixed(2) });
                pincelada(g, suavizar([[x2 - c.w * 1.2, y2 + 3], [x2, y2 - 2], [x2 + c.w * 1.2, y2 + 4]], 6), (t) => c.w * .2 * Math.sin(Math.PI * t) + .6,
                    { fill: corColmo(Math.max(0, c.longe - .25)) });
                // folhas em alguns nós altos
                if (y2 < 520 && rand() < .55) {
                    const lado = rand() < .5 ? -1 : 1;
                    for (let f = 0; f < 4; f++) {
                        const a = ((lado > 0 ? 10 : 170) + (rand() - .5) * 60) * Math.PI / 180, tam = (60 + rand() * 60) * (1 - c.longe * .5);
                        const pts = [[x2, y2], [x2 + Math.cos(a) * tam * .5, y2 + Math.sin(a) * tam * .5 + 8], [x2 + Math.cos(a) * tam, y2 + Math.sin(a) * tam + 22]];
                        pincelada(g, suavizar(pts, 8), (t) => Math.max(.4, tam * .08 * Math.sin(Math.PI * Math.pow(t, .55))), { fill: cor });
                    }
                }
                x = x2; y = y2; gomo++;
            }
            if (ci === ordem.length - 4) {
                // feixes de luar inclinados atravessando a névoa
                for (const [x0, larg] of [[520, 120], [760, 70], [980, 150], [1150, 60]]) {
                    el("path", { d: `M${x0} -20 L${x0 + larg} -20 L${x0 + larg + 260} 1000 L${x0 + 160} 1000 Z`, fill: `url(#${id}-feixe)` }, svg);
                }
            }
        });

        // chão: folhas caídas em silhueta
        el("path", { d: "M-40 960 C 300 930 600 950 900 940 C 1200 930 1400 945 1640 935 L1640 1040 L-40 1040 Z", fill: "#06110e" }, svg);
        const toro = lanterna(svg, id);

        // vaga-lumes "parados" (a foto): os acesos aparecem como pontos de luz
        const pontos = Array.from({ length: MAX_VAGALUMES }, () => {
            const x = 100 + rand() * 1400, y = 420 + rand() * 500;
            const g = el("g", { transform: `translate(${x.toFixed(0)} ${y.toFixed(0)})`, opacity: 0 }, svg);
            el("circle", { r: 13, fill: `url(#${id}-vagalume)` }, g);
            el("circle", { r: 1.8, fill: "#fdffd8" }, g);
            return g;
        });

        return {
            atualizar(feitos, total) {
                const fracao = total ? feitos / total : 0;
                const n = quantas(feitos, total, MAX_VAGALUMES);
                // na foto, metade aparece (a outra metade é a que pisca ao vivo)
                pontos.forEach((p, i) => p.setAttribute("opacity", i < n / 2 ? (.4 + (i % 3) * .2).toFixed(2) : "0"));
                toro.halo.setAttribute("opacity", (0.2 + fracao * 0.8).toFixed(2));
                toro.janela.setAttribute("opacity", (0.3 + fracao * 0.7).toFixed(2));
                toro.poca.setAttribute("opacity", (0.15 + fracao * 0.85).toFixed(2));
                return Promise.resolve();
            },
            comemorar() {}
        };
    },

    vivo(container, progresso) {
        const svg = camadaViva(container);
        const acesos = () => { const { feitos, total } = progresso(); return quantas(feitos, total, MAX_VAGALUMES); };
        return juntar(vagalumes(svg, { quantos: acesos, maximo: MAX_VAGALUMES, area: [80, 380, 1440, 560] }), () => svg.remove());
    }
};
