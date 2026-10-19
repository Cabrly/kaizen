/* =========================================================
   CENA — Ameixeira ao luar, com neve (yoru no ume)
   ---------------------------------------------------------
   Noite de inverno: lua cheia enorme com halo, o galho de
   ameixeira em silhueta de tinta com neve acumulada por cima,
   e as flores vermelhas com um brilho quente contra o frio.
   Neve caindo de verdade (camada viva, leve).

   Cada tarefa abre flores (da base pra ponta); antes de abrir,
   cada uma é só um botão. 100%: florada, a lua se intensifica
   e pétalas soltas flutuam no ar.
========================================================= */

import { el, novaCena, pop, quantas, semente } from "./comum.js";
import { espalhar, pincelada, preparar, selo, suavizar } from "./tinta.js";


/* Galhos: [pontos de controle, largura no início, largura no fim, seco a partir de]. */
const GALHOS = [
    [[[-60, 1010], [70, 880], [190, 790], [260, 660], [390, 570], [560, 530], [700, 440], [860, 375], [1010, 352]], 46, 7, .7],
    [[[260, 670], [215, 570], [235, 460], [195, 370]], 17, 4, .55],
    [[[560, 532], [620, 610], [700, 650], [800, 660]], 15, 3, .6],
    [[[700, 442], [740, 340], [720, 260]], 12, 3, .55],
    [[[860, 377], [930, 430], [1020, 452]], 10, 2.5, .55],
    [[[1010, 352], [1100, 314], [1180, 322]], 7, 1.5, .5],
    [[[390, 572], [430, 480], [490, 430]], 11, 2.5, .55],
    [[[150, 815], [60, 770], [10, 700]], 14, 3, .6]
];


function larguraDoGalho(w0, w1, i) {
    return (t) => (w0 + (w1 - w0) * Math.pow(t, .8)) * (0.85 + 0.25 * Math.sin(t * 9 + i));
}


/* Neve em cima do galho: só onde ele é quase horizontal (em pé, ela escorrega). */
function neveNoGalho(pai, id, centro, largura, rand) {
    const n = centro.length - 1, trechos = [];
    let atual = [];
    centro.forEach((p, i) => {
        const a = centro[Math.max(0, i - 1)], b = centro[Math.min(n, i + 1)];
        const dx = b[0] - a[0], dy = b[1] - a[1], comp = Math.hypot(dx, dy) || 1;
        let nx = -dy / comp, ny = dx / comp;
        if (ny > 0) { nx = -nx; ny = -ny; }                       // a normal de cima
        const deitado = Math.abs(dy) < Math.abs(dx) * 1.4;
        if (deitado) {
            const w = largura(i / n), h = (4 + rand() * 4 + Math.sin(i * .9) * 2.5) * Math.min(1.8, .6 + w / 16);
            atual.push([p[0] + nx * w * .85, p[1] + ny * w * .85, h]);
        } else if (atual.length) {
            trechos.push(atual);
            atual = [];
        }
    });
    if (atual.length) trechos.push(atual);
    for (const t of trechos.filter((t) => t.length > 3)) {
        const base = t.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`);
        const topo = t.map(([x, y, h], k) => {
            const afina = Math.min(1, k / 3, (t.length - 1 - k) / 3);
            return `${x.toFixed(1)} ${(y - h * afina).toFixed(1)}`;
        }).reverse();
        el("path", { d: `M${base.join(" L")} L${topo.join(" L")} Z`, fill: `url(#${id}-neve)` }, pai);
    }
}


function desenharFlor(pai, id, x, y, r, rand) {
    const g = el("g", { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(rand() * 72).toFixed(0)})` }, pai);
    const botao = el("circle", { r: (r * .36).toFixed(1), fill: `url(#${id}-botao)` }, g);
    const flor = el("g", { opacity: 0 }, g);
    el("circle", { r: (r * 2.4).toFixed(1), fill: `url(#${id}-calor)` }, flor);       // brilho quente no frio
    for (let k = 0; k < 5; k++) {
        const a = (k * 72) * Math.PI / 180;
        el("circle", { cx: (Math.cos(a) * r * .55).toFixed(1), cy: (Math.sin(a) * r * .55).toFixed(1), r: (r * (.5 + rand() * .08)).toFixed(1),
            fill: `url(#${id}-petala)`, opacity: (.86 + rand() * .12).toFixed(2) }, flor);
    }
    for (let k = 0; k < 8; k++) {
        const a = rand() * Math.PI * 2, c = r * (.35 + rand() * .32);
        el("line", { x1: 0, y1: 0, x2: (Math.cos(a) * c).toFixed(1), y2: (Math.sin(a) * c).toFixed(1), stroke: "#3a0f0c", "stroke-width": .9 }, flor);
        el("circle", { cx: (Math.cos(a) * c).toFixed(1), cy: (Math.sin(a) * c).toFixed(1), r: 1.3, fill: "#f5d58a" }, flor);
    }
    el("circle", { r: (r * .15).toFixed(1), fill: "#ffd66b" }, flor);
    // um pouquinho de neve em cima de algumas flores
    if (rand() < .4) el("ellipse", { cx: 0, cy: (-r * .7).toFixed(1), rx: (r * .5).toFixed(1), ry: (r * .18).toFixed(1), fill: "#f2f5ff", opacity: ".9" }, flor);
    return { botao, flor };
}


export const ume = {
    id: "ume",
    nome: "Ameixeira ao luar",
    desc: "Noite de neve: cada tarefa abre flores vermelhas",
    escuro: () => true,
    pinta: true,               // as flores abrem ao vivo quando a tarefa é concluída

    montar(container) {
        const { svg, id } = novaCena(container);
        const rand = semente(31);
        const defs = preparar(svg, id);
        defs.insertAdjacentHTML("beforeend", `
            <linearGradient id="${id}-noite" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#070b1d"/><stop offset=".55" stop-color="#16203f"/><stop offset="1" stop-color="#2b3358"/></linearGradient>
            <radialGradient id="${id}-luaCor" cx=".42" cy=".38" r=".7">
                <stop offset="0" stop-color="#fffaf0"/><stop offset=".75" stop-color="#f3e7cc"/><stop offset="1" stop-color="#dccbaa"/></radialGradient>
            <radialGradient id="${id}-luaHalo"><stop offset=".3" stop-color="#e9e3ff" stop-opacity=".42"/><stop offset=".55" stop-color="#a9b8f0" stop-opacity=".14"/><stop offset="1" stop-color="#a9b8f0" stop-opacity="0"/></radialGradient>
            <clipPath id="${id}-luaRecorte"><circle cx="1120" cy="330" r="200"/></clipPath>
            <filter id="${id}-crateras" x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="4" seed="4"/>
                <feColorMatrix values="0 0 0 0 .55  0 0 0 0 .5  0 0 0 0 .45  1.7 0 0 0 -0.85"/></filter>
            <linearGradient id="${id}-neve" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b9c6ef"/></linearGradient>
            <linearGradient id="${id}-chao" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#d9e1fb"/><stop offset=".4" stop-color="#8f9ccf"/><stop offset="1" stop-color="#3a4374"/></linearGradient>
            <radialGradient id="${id}-petala" cx=".4" cy=".35"><stop offset="0" stop-color="#ff5a5f"/><stop offset=".7" stop-color="#d0142a"/><stop offset="1" stop-color="#8a0a1a"/></radialGradient>
            <radialGradient id="${id}-botao" cx=".35" cy=".3"><stop offset="0" stop-color="#e2343c"/><stop offset="1" stop-color="#6e0812"/></radialGradient>
            <radialGradient id="${id}-calor"><stop offset="0" stop-color="#ff4a4a" stop-opacity=".32"/><stop offset="1" stop-color="#ff4a4a" stop-opacity="0"/></radialGradient>
            <radialGradient id="${id}-floco"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`);

        el("rect", { width: 1600, height: 1000, fill: `url(#${id}-noite)` }, svg);
        for (let i = 0; i < 160; i++) {
            el("circle", { cx: (rand() * 1600).toFixed(0), cy: (rand() * 620).toFixed(0), r: (.4 + rand() * 1.1).toFixed(2), fill: "#dfe6ff", opacity: (.15 + rand() * .55).toFixed(2) }, svg);
        }

        // lua cheia
        const halo = el("circle", { cx: 1120, cy: 330, r: 560, fill: `url(#${id}-luaHalo)` }, svg);
        el("circle", { cx: 1120, cy: 330, r: 200, fill: `url(#${id}-luaCor)` }, svg);
        el("rect", { x: 920, y: 130, width: 400, height: 400, filter: `url(#${id}-crateras)`, "clip-path": `url(#${id}-luaRecorte)`, opacity: ".45" }, svg);

        // chão de neve com sombra azul
        el("path", { d: "M-40 900 C 300 860 700 905 1100 880 C 1300 868 1480 880 1640 870 L1640 1040 L-40 1040 Z", fill: `url(#${id}-chao)`, opacity: ".9" }, svg);

        // galho em silhueta, neve por cima
        const tinta = el("g", { filter: `url(#${id}-pincel)` }, svg);
        const neve = el("g", {}, svg);
        const centros = GALHOS.map(([controle, w0, w1, seco], i) => {
            const centro = suavizar(controle, 18);
            const larg = larguraDoGalho(w0, w1, i);
            const galho = pincelada(tinta, centro, larg, { fill: "#0b0910", seco, cerdas: Math.round(3 + w0 / 5), semente: i + 2 });
            galho.querySelectorAll("path[stroke]").forEach((fio) => fio.setAttribute("stroke", "#3b4470"));
            neveNoGalho(neve, id, centro, larg, rand);
            return centro;
        });

        // flores ao longo dos galhos, da base pra ponta
        const lugares = [];
        centros.forEach((centro, i) => {
            const n = i === 0 ? 15 : 3;
            for (let k = 0; k < n; k++) {
                const idx = Math.floor(centro.length * (0.2 + 0.8 * (k + rand() * .6) / n));
                const [x, y] = centro[Math.min(centro.length - 1, idx)];
                lugares.push({ x: x + (rand() - .5) * 28, y: y + (rand() - .5) * 24, r: 12 + rand() * 7, ordem: i === 0 ? idx / centro.length : 0.3 + rand() * 0.7 });
            }
        });
        lugares.sort((a, b) => a.ordem - b.ordem);
        const flores = lugares.map(({ x, y, r }) => desenharFlor(svg, id, x, y, r, rand));

        // neve no ar (parada na foto; a camada viva faz cair)
        const flocos = el("g", {}, svg);
        for (let i = 0; i < 180; i++) {
            const r = rand() < .1 ? 4 + rand() * 4 : 1 + rand() * 2.2;
            el("circle", { cx: (rand() * 1600).toFixed(0), cy: (rand() * 1000).toFixed(0), r: r.toFixed(1), fill: r > 4 ? `url(#${id}-floco)` : "#fff", opacity: (.35 + rand() * .55).toFixed(2) }, flocos);
        }

        // pétalas soltas (só em 100%)
        const petalas = el("g", { opacity: 0 }, svg);
        for (let i = 0; i < 26; i++) {
            const x = 300 + rand() * 1200, y = 250 + rand() * 600;
            el("ellipse", { cx: x.toFixed(0), cy: y.toFixed(0), rx: 6, ry: 4, fill: `url(#${id}-petala)`, transform: `rotate(${(rand() * 180).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})`, opacity: (.6 + rand() * .4).toFixed(2) }, petalas);
        }

        const seloG = selo(svg, id, 1460, 760, 42);
        seloG.setAttribute("opacity", 0);
        let abertas = 0;

        return {
            atualizar(feitos, total, animar) {
                const n = quantas(feitos, total, flores.length);
                const fracao = total ? feitos / total : 0;
                const novas = [];
                flores.forEach((f, i) => {
                    const aberta = i < n;
                    f.flor.setAttribute("opacity", aberta ? "1" : "0");
                    f.botao.setAttribute("opacity", aberta ? "0" : "1");
                    if (aberta && i >= abertas) novas.push(f);
                });
                abertas = n;
                halo.setAttribute("opacity", (0.65 + fracao * 0.35).toFixed(2));
                const completo = total > 0 && feitos >= total;
                petalas.setAttribute("opacity", completo ? "1" : "0");
                seloG.setAttribute("opacity", completo ? "1" : "0");
                if (!animar || !novas.length) return Promise.resolve();
                novas.forEach((f, i) => pop(f.flor, i * 220));
                if (completo) { espalhar(petalas, novas.length * 220, 1200); espalhar(seloG, novas.length * 220 + 500, 700); }
                return new Promise((ok) => setTimeout(ok, novas.length * 220 + 1000));
            },
            comemorar() {}
        };
    },

    /* Neve caindo: poucos flocos, só transform (barato). */
    vivo(container) {
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 1600 1000");
        svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
        svg.classList.add("cena-viva");
        container.append(svg);
        const animacoes = [];
        for (let i = 0; i < 45; i++) {
            const x = Math.random() * 1600, r = 1.2 + Math.random() * 2.6, dur = 9000 + Math.random() * 9000;
            const floco = el("circle", { cx: 0, cy: 0, r: r.toFixed(1), fill: "#fff", opacity: (.4 + Math.random() * .5).toFixed(2) }, svg);
            const deriva = 40 + Math.random() * 80;
            animacoes.push(floco.animate(
                [{ transform: `translate(${x}px, -20px)` }, { transform: `translate(${x + deriva}px, 500px)` }, { transform: `translate(${x - deriva * .3}px, 1020px)` }],
                { duration: dur, iterations: Infinity, delay: -Math.random() * dur, easing: "linear" }));
        }
        return () => { animacoes.forEach((a) => a.cancel()); svg.remove(); };
    }
};
