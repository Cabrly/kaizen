/* =========================================================
   CENA — Pagode lofi (Chureito-tō à noite)
   ---------------------------------------------------------
   Estilo "lofi": noite roxa e azul, brilhos macios, cerejeiras
   em flor. O pagode vermelho de cinco andares, o Fuji ao luar e
   a cidade lá embaixo.

   Cada tarefa acende janelas e lanternas do pagode, de baixo
   pra cima, e a luz quente escorre na varanda e no beiral; a
   cidade também vai acendendo. 100%: tudo aceso e o topo brilha.
   Estrelas cadentes de vez em quando (camada viva, leve).
========================================================= */

import { el, ligarPecas, novaCena, quantas, semente } from "./comum.js";
import { cadentes, camadaViva, juntar, petalas } from "./vivos.js";


const CX = 1290;                                   // eixo do pagode
const ANDARES = [                                  // de baixo pra cima
    { w: 340, h: 100, beiral: 80, telhado: 46 },
    { w: 300, h: 88, beiral: 74, telhado: 42 },
    { w: 262, h: 80, beiral: 68, telhado: 38 },
    { w: 226, h: 72, beiral: 62, telhado: 35 },
    { w: 192, h: 66, beiral: 58, telhado: 33 }
];


function hex(cor) {
    const n = parseInt(cor.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function misturar(a, b, t) {
    const x = hex(a), y = hex(b);
    return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
}


function defs(svg, id) {
    const d = el("defs", {}, svg);
    d.innerHTML = `
        <linearGradient id="${id}-ceu" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#0d0b2b"/><stop offset=".45" stop-color="#241d5c"/>
            <stop offset=".72" stop-color="#4b357e"/><stop offset="1" class="horizonte"/></linearGradient>
        <radialGradient id="${id}-luaHalo"><stop offset="0" stop-color="#fff1d6" stop-opacity=".45"/><stop offset=".3" stop-color="#c9b6ff" stop-opacity=".18"/><stop offset="1" stop-color="#c9b6ff" stop-opacity="0"/></radialGradient>
        <mask id="${id}-crescente"><rect x="-80" y="-80" width="160" height="160" fill="#fff"/><circle cx="18" cy="-12" r="44" fill="#000"/></mask>
        <linearGradient id="${id}-via" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b7a6ff" stop-opacity="0"/><stop offset=".5" stop-color="#d6c8ff" stop-opacity=".16"/><stop offset="1" stop-color="#b7a6ff" stop-opacity="0"/></linearGradient>
        <filter id="${id}-borrao"><feGaussianBlur stdDeviation="22"/></filter>
        <filter id="${id}-borraoLeve"><feGaussianBlur stdDeviation="3"/></filter>
        <filter id="${id}-brilho" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.2"/></filter>

        <linearGradient id="${id}-fuji" x1="0" y1="0" x2="0" y2="1"><stop offset=".2" stop-color="#3d3a82"/><stop offset="1" stop-color="#211c4f"/></linearGradient>
        <linearGradient id="${id}-neve" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8f8fd0"/><stop offset=".55" stop-color="#dcdcff"/><stop offset="1" stop-color="#eeeaff"/></linearGradient>
        <linearGradient id="${id}-nevoaCidade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9fb8" stop-opacity="0"/><stop offset="1" stop-color="#ff9fb8" stop-opacity=".5"/></linearGradient>

        <linearGradient id="${id}-parede" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e1f33"/><stop offset="1" stop-color="#4a142a"/></linearGradient>
        <linearGradient id="${id}-telhado" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f8a86"/><stop offset=".55" stop-color="#245a5f"/><stop offset="1" stop-color="#173c45"/></linearGradient>
        <linearGradient id="${id}-shoji" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2a6"/><stop offset="1" stop-color="#ffab5e"/></linearGradient>
        <radialGradient id="${id}-luz"><stop offset="0" stop-color="#ffc77a" stop-opacity=".75"/><stop offset=".45" stop-color="#ff9a5a" stop-opacity=".28"/><stop offset="1" stop-color="#ff8a5a" stop-opacity="0"/></radialGradient>
        <radialGradient id="${id}-lanterna" cx=".45" cy=".4"><stop offset="0" stop-color="#fff0c0"/><stop offset=".5" stop-color="#ffb35c"/><stop offset="1" stop-color="#e2583a"/></radialGradient>
        <radialGradient id="${id}-topo"><stop offset="0" stop-color="#ffe9b0" stop-opacity=".9"/><stop offset="1" stop-color="#ffb070" stop-opacity="0"/></radialGradient>

        <radialGradient id="${id}-flor" cx=".5" cy=".75" r=".75"><stop offset="0" stop-color="#ffc6dc"/><stop offset=".6" stop-color="#e48ab4"/><stop offset="1" stop-color="#8f4a8a"/></radialGradient>
        <radialGradient id="${id}-florSombra" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#b86aa6"/><stop offset="1" stop-color="#4e2c66"/></radialGradient>

        <filter id="${id}-massa" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
        <filter id="${id}-granulado" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/>
            <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .06 0"/></filter>`;
}


function ceu(svg, id, rand) {
    el("rect", { width: 1600, height: 1000, fill: `url(#${id}-ceu)` }, svg);
    el("rect", { x: -200, y: 60, width: 2000, height: 260, fill: `url(#${id}-via)`, transform: "rotate(-14 800 200)", filter: `url(#${id}-borrao)` }, svg);

    const estrelas = el("g", {}, svg);
    for (let i = 0; i < 520; i++) {
        const y = Math.pow(rand(), 1.6) * 720, b = rand();
        el("circle", { cx: (rand() * 1600).toFixed(0), cy: y.toFixed(0), r: (0.35 + b * b * 1.5).toFixed(2),
            fill: b > .9 ? "#ffe9c8" : (b > .7 ? "#dcd4ff" : "#fff"), opacity: (0.25 + b * 0.75 - y / 1500).toFixed(2) }, estrelas);
    }
    // estrelas cintilantes de quatro pontas
    for (let i = 0; i < 22; i++) {
        const x = rand() * 1600, y = 30 + rand() * 420, t = 5 + rand() * 9;
        const g = el("g", { transform: `translate(${x.toFixed(0)} ${y.toFixed(0)})` }, estrelas);
        el("circle", { r: t * .9, fill: "#cfc4ff", opacity: ".25", filter: `url(#${id}-brilho)` }, g);
        el("path", { d: `M0 ${-t} Q1 -1 ${t} 0 Q1 1 0 ${t} Q-1 1 ${-t} 0 Q-1 -1 0 ${-t} Z`, fill: "#fff6e6" }, g);
    }

    // lua crescente
    const lua = el("g", { transform: "translate(260 160)" }, svg);
    el("circle", { r: 230, fill: `url(#${id}-luaHalo)` }, lua);
    el("circle", { r: 46, fill: "#fff1d8", mask: `url(#${id}-crescente)` }, lua);

    // nuvens finas, roxas
    for (const [x, y, rx, ry, o] of [[420, 430, 380, 22, .22], [1050, 380, 300, 16, .16], [760, 470, 520, 28, .2], [1400, 450, 260, 18, .14]]) {
        el("ellipse", { cx: x, cy: y, rx, ry, fill: "#b49ad8", opacity: o, filter: `url(#${id}-borraoLeve)` }, svg);
    }
}


function fujiECidade(svg, id, rand) {
    // Fuji ao luar
    el("path", { d: "M-40 790 C 160 740 330 640 470 520 Q 520 478 560 476 Q 610 476 650 512 C 790 630 970 730 1180 780 L1180 900 L-40 900 Z", fill: `url(#${id}-fuji)` }, svg);
    // borda de baixo da neve: escorre em línguas de comprimentos diferentes
    const borda = [];
    for (let k = 0; k <= 34; k++) {
        const x = 414 + k * (314 / 34), base = 570 + Math.abs(k - 17) * -1.2;
        const lingua = k % 2 ? 6 + rand() * 10 : 18 + Math.max(0, Math.sin(k * 1.3) * 26 + rand() * 30);
        borda.push(`${x.toFixed(1)} ${(base + lingua).toFixed(1)}`);
    }
    el("path", { d: `M414 570 C 432 556 452 538 470 520 Q 520 478 560 476 Q 610 476 650 512 C 680 538 705 556 728 572 L${borda.reverse().join(" L")} Z`, fill: `url(#${id}-neve)` }, svg);
    for (const d of ["M560 480 L556 560 L560 610", "M600 486 L620 560 L636 600", "M520 490 L500 556 L486 590"]) {
        el("path", { d, stroke: "#fff", "stroke-opacity": ".45", "stroke-width": 2.5, fill: "none", "stroke-linecap": "round" }, svg);
    }

    // morros escuros e a cidade com janelinhas
    el("path", { d: "M-40 760 C 200 730 380 745 560 735 C 760 724 980 742 1200 730 L1200 1000 L-40 1000 Z", fill: "#1d1846" }, svg);
    const nevoa = el("rect", { x: -40, y: 640, width: 1300, height: 160, fill: `url(#${id}-nevoaCidade)` }, svg);
    const janelas = [];
    const fileiras = [[748, .55, 0.6], [790, .75, 0.8], [838, .95, 1]];
    for (const [base, cor, escala] of fileiras) {
        const tom = misturar("#120f30", "#2a2257", cor * .4);
        for (let x = -30; x < 1180;) {
            const w = (26 + rand() * 46) * escala, h = (18 + rand() * 60) * escala;
            el("rect", { x: x.toFixed(0), y: (base - h).toFixed(0), width: w.toFixed(0), height: (h + 200).toFixed(0), fill: tom }, svg);
            for (let jy = base - h + 6 * escala; jy < base - 4; jy += 9 * escala) {
                for (let jx = x + 5 * escala; jx < x + w - 5 * escala; jx += 8 * escala) {
                    if (rand() < .55) {
                        janelas.push(el("rect", { x: jx.toFixed(1), y: jy.toFixed(1), width: (3 * escala).toFixed(1), height: (3.4 * escala).toFixed(1),
                            fill: rand() < .8 ? "#ffd58a" : "#ffeacc", opacity: 0 }, svg));
                    }
                }
            }
            x += w + rand() * 6;
        }
    }
    // ordem fixa de acendimento, embaralhada
    janelas.forEach((j) => j.ordem = rand());
    janelas.sort((a, b) => a.ordem - b.ordem);
    return { janelas, nevoa };
}


/* Cerejeira pintada: copa feita de centenas de florzinhas, mais claras em
   cima (luar) e mais quentes embaixo (a luz das lanternas), com volume de
   sombra por trás e galhos aparecendo entre as flores. */
function cerejeiras(svg, id, rand, cx, cy, raio, quantos) {
    const g = el("g", {}, svg);
    const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;

    // galhos (silhueta roxa) saindo do tronco para os lados
    const galho = (x1, y1, x2, y2, larg) => el("path", { d: `M${x1} ${y1} Q ${(x1 + x2) / 2 + (rand() - .5) * 60} ${(y1 + y2) / 2 - 30} ${x2} ${y2}`,
        stroke: "#25122f", "stroke-width": larg, fill: "none", "stroke-linecap": "round" }, g);
    galho(cx - 20, 1060, cx + 10, cy + 40, 30);
    const pontas = [];
    for (let k = 0; k < 9; k++) {
        const a = Math.PI + (k / 8) * Math.PI + (rand() - .5) * .3;
        const x = cx + Math.cos(a) * raio * 1.35 * (.6 + rand() * .4), y = cy + Math.sin(a) * raio * .5 * (.6 + rand() * .4);
        galho(cx + 10, cy + 40, x, y, 6 + rand() * 6);
        pontas.push([x, y]);
    }

    // tufos: cachos compactos de flores com vãos entre eles (é o que dá cara de cerejeira)
    const centros = [[cx, cy], ...pontas];
    const tufos = [];
    for (let i = 0; i < quantos * 1.6; i++) {
        const [bx, by] = centros[Math.floor(rand() * centros.length)];
        tufos.push([bx + gauss() * raio * .6, by + gauss() * raio * .3, raio * (.1 + rand() * .11)]);
    }
    tufos.sort((a, b) => a[1] - b[1]);                      // os de baixo por cima (mais perto)
    const massa = el("g", { filter: `url(#${id}-massa)` }, g);
    const flores = el("g", {}, g);
    for (const [tx, ty, rc] of tufos) {
        const alto = Math.max(0, Math.min(1, (cy + raio * .3 - ty) / (raio * .7)));     // 1 = topo, pega luar
        el("ellipse", { cx: tx.toFixed(0), cy: (ty + rc * .15).toFixed(0), rx: (rc * 1.15).toFixed(0), ry: (rc * .85).toFixed(0),
            fill: alto > .5 ? "#d98cbc" : "#9c4f8e", opacity: ".9" }, massa);
        for (let k = 0; k < 46; k++) {
            const x = tx + gauss() * rc * .75, y = ty + gauss() * rc * .55;
            const topo = (ty - y) / rc;                                                // em cima do tufo = luz
            const tons = topo > .25 ? (alto > .5 ? ["#fff0f6", "#ffd9ea", "#ffe6f1"] : ["#ffc6dd", "#f8b2cf", "#ffd0e3"])
                : (alto > .4 ? ["#f39cc2", "#ea8ab6", "#f6aacb"] : ["#c96aa2", "#b85b96", "#e07fae"]);
            el("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: (1.8 + rand() * 3.2).toFixed(1), fill: tons[Math.floor(rand() * 3)], opacity: (.75 + rand() * .25).toFixed(2) }, flores);
        }
        // luz quente das lanternas por baixo dos tufos mais baixos
        if (alto < .3 && rand() < .5) el("ellipse", { cx: tx.toFixed(0), cy: (ty + rc * .5).toFixed(0), rx: (rc * .9).toFixed(0), ry: (rc * .35).toFixed(0), fill: "#ffb38a", opacity: ".22" }, flores);
    }
    return g;
}


function pagode(svg, id) {
    const pecas = [];
    let base = 1032;

    ANDARES.forEach((a, i) => {
        const xl = CX - a.w / 2, xr = CX + a.w / 2, topo = base - a.h, cume = topo - a.telhado;
        const g = el("g", {}, svg);

        // parede, pilares e janelas de shoji
        el("rect", { x: xl, y: topo + 8, width: a.w, height: a.h, fill: `url(#${id}-parede)` }, g);
        const vaos = [xl, xl + a.w / 3, xl + 2 * a.w / 3, xr];
        for (let k = 0; k < 3; k++) {
            const x0 = vaos[k] + 14, x1 = vaos[k + 1] - 6, y0 = topo + 26, y1 = base - (i ? 22 : 14);
            const luz = el("ellipse", { cx: ((x0 + x1) / 2).toFixed(0), cy: (y1 + 10).toFixed(0), rx: ((x1 - x0) * 1.1).toFixed(0), ry: 40, fill: `url(#${id}-luz)`, opacity: 0 }, g);
            const shoji = el("rect", { x: x0, y: y0, width: x1 - x0, height: y1 - y0, fill: "#1f1430" }, g);
            const grade = el("g", { stroke: "#2c1830", "stroke-width": 2 }, g);
            for (let t = 1; t < 4; t++) el("line", { x1: x0 + (x1 - x0) * t / 4, y1: y0, x2: x0 + (x1 - x0) * t / 4, y2: y1 }, grade);
            el("line", { x1: x0, y1: (y0 + y1) / 2, x2: x1, y2: (y0 + y1) / 2 }, grade);
            pecas.push({ tipo: "janela", shoji, luz });
        }
        for (const x of vaos) {
            el("rect", { x: Math.min(x, xr - 10) - (x === xl ? 0 : 5), y: topo + 8, width: 10, height: a.h, fill: "#a8323f" }, g);
        }

        // varanda (andares de cima apoiam no telhado de baixo)
        if (i > 0) {
            const varanda = el("g", { fill: "#b3383f" }, g);
            el("rect", { x: xl - 16, y: base - 22, width: a.w + 32, height: 4 }, varanda);
            el("rect", { x: xl - 16, y: base - 6, width: a.w + 32, height: 5 }, varanda);
            for (let x = xl - 14; x <= xr + 14; x += 18) el("rect", { x, y: base - 22, width: 3, height: 20 }, varanda);
        }

        // beiral escuro com mãos-francesas e o telhado de pontas erguidas
        const pontaE = [xl - a.beiral, topo - 12], pontaD = [xr + a.beiral, topo - 12];
        el("path", { d: `M${pontaE[0] + 10} ${topo + 2} Q ${xl - a.beiral * .3} ${topo + 18} ${xl} ${topo + 18} L${xr} ${topo + 18} Q ${xr + a.beiral * .3} ${topo + 18} ${pontaD[0] - 10} ${topo + 2} Z`, fill: "#2c1026" }, g);
        for (let x = xl + 8; x < xr; x += 16) el("rect", { x, y: topo + 8, width: 8, height: 8, fill: "#7a2638" }, g);
        const telhado = `M${pontaE[0]} ${pontaE[1]} Q ${xl - a.beiral * .35} ${topo + 10} ${xl} ${topo + 10} L${xr} ${topo + 10} Q ${xr + a.beiral * .35} ${topo + 10} ${pontaD[0]} ${pontaD[1]} Q ${xr + a.beiral * .15} ${topo - a.telhado * .35} ${CX + a.w * .3} ${cume} L${CX - a.w * .3} ${cume} Q ${xl - a.beiral * .15} ${topo - a.telhado * .35} ${pontaE[0]} ${pontaE[1]} Z`;
        el("path", { d: telhado, fill: `url(#${id}-telhado)` }, g);
        // telhas (linhas) e o luar na aresta de cima
        for (let t = 1; t < 9; t++) {
            const f = t / 9;
            el("path", { d: `M${(CX - a.w * .3 + (pontaE[0] - (CX - a.w * .3)) * f).toFixed(0)} ${(cume + (pontaE[1] + 18 - cume) * f).toFixed(0)} L${(CX + a.w * .3 + (pontaD[0] - (CX + a.w * .3)) * f).toFixed(0)} ${(cume + (pontaD[1] + 18 - cume) * f).toFixed(0)}`,
                stroke: "#163a40", "stroke-opacity": ".45", "stroke-width": 1.5, fill: "none" }, g);
        }
        el("path", { d: `M${pontaE[0]} ${pontaE[1]} Q ${xl - a.beiral * .15} ${topo - a.telhado * .35} ${CX - a.w * .3} ${cume} L${CX + a.w * .3} ${cume} Q ${xr + a.beiral * .15} ${topo - a.telhado * .35} ${pontaD[0]} ${pontaD[1]}`,
            stroke: "#a9e3da", "stroke-opacity": ".55", "stroke-width": 2.5, fill: "none", "stroke-linecap": "round" }, g);

        // lanternas penduradas nas pontas do beiral
        for (const [px, py] of [pontaE, pontaD]) {
            const lx = px + (px < CX ? 16 : -16), ly = py + 44;
            el("line", { x1: px + (px < CX ? 10 : -10), y1: py + 4, x2: lx, y2: ly - 12, stroke: "#1a0f1f", "stroke-width": 1.5 }, g);
            const halo = el("circle", { cx: lx, cy: ly, r: 46, fill: `url(#${id}-luz)`, opacity: 0 }, g);
            el("rect", { x: lx - 6, y: ly - 14, width: 12, height: 4, rx: 1, fill: "#1a0f1f" }, g);
            const corpo = el("ellipse", { cx: lx, cy: ly, rx: 10, ry: 12, fill: "#4a1d2c" }, g);
            el("rect", { x: lx - 6, y: ly + 10, width: 12, height: 4, rx: 1, fill: "#1a0f1f" }, g);
            pecas.push({ tipo: "lanterna", corpo, halo });
        }

        base = cume + 10;
    });

    // sorin (o mastro de anéis no topo)
    const topo = el("g", {}, svg);
    const brilhoTopo = el("circle", { cx: CX, cy: base - 120, r: 120, fill: `url(#${id}-topo)`, opacity: 0 }, topo);
    el("rect", { x: CX - 4, y: base - 190, width: 8, height: 190, fill: "#2b2238" }, topo);
    for (let k = 0; k < 9; k++) {
        el("ellipse", { cx: CX, cy: base - 30 - k * 15, rx: 15 - k * .6, ry: 4, fill: "#3b3150", stroke: "#8f86b8", "stroke-opacity": ".5", "stroke-width": 1 }, topo);
    }
    el("circle", { cx: CX, cy: base - 196, r: 7, fill: "#e8c87a" }, topo);
    return { pecas, brilhoTopo };
}


export const pagodeLofi = {
    id: "pagode-lofi",
    nome: "Pagode lofi",
    desc: "Noite estrelada: cada tarefa acende uma luz do pagode",
    escuro: () => true,

    montar(container) {
        const { svg, id } = novaCena(container);
        const rand = semente(77);
        defs(svg, id);
        ceu(svg, id, rand);
        const cidade = fujiECidade(svg, id, rand);
        cerejeiras(svg, id, rand, 180, 900, 210, 40);
        const { pecas, brilhoTopo } = pagode(svg, id);
        cerejeiras(svg, id, rand, 1180, 1010, 170, 26);
        el("rect", { width: 1600, height: 1000, filter: `url(#${id}-granulado)` }, svg);
        const horizonte = svg.querySelector(".horizonte");

        return {
            atualizar(feitos, total, animar) {
                const n = total ? feitos / total : 0;
                ligarPecas(pecas, quantas(feitos, total, pecas.length), (peca, ligada) => {
                    if (peca.tipo === "janela") {
                        peca.shoji.setAttribute("fill", ligada ? `url(#${id}-shoji)` : "#1f1430");
                        peca.luz.setAttribute("opacity", ligada ? "1" : "0");
                    } else {
                        peca.corpo.setAttribute("fill", ligada ? `url(#${id}-lanterna)` : "#4a1d2c");
                        peca.halo.setAttribute("opacity", ligada ? "1" : "0");
                    }
                });
                const acesas = Math.round(cidade.janelas.length * (0.18 + 0.82 * n));
                cidade.janelas.forEach((j, i) => j.setAttribute("opacity", i < acesas ? (0.55 + (i % 5) * 0.09).toFixed(2) : "0"));
                cidade.nevoa.setAttribute("opacity", (0.35 + n * 0.65).toFixed(2));
                horizonte.setAttribute("stop-color", misturar("#4b3270", "#b9688f", n));
                brilhoTopo.setAttribute("opacity", total && feitos >= total ? "1" : "0");
            },
            comemorar() {}
        };
    },

    /* Por cima da foto: estrelas cadentes de vez em quando e pétalas no vento. */
    vivo(container) {
        const svg = camadaViva(container);
        return juntar(cadentes(svg), petalas(svg, { quantas: 24 }), () => svg.remove());
    }
};
