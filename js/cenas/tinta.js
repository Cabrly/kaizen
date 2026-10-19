/* =========================================================
   TINTA — o kit de pincel das cenas em sumi-e
   ---------------------------------------------------------
   Papel washi com fibras, pincelada de largura variável (grossa
   onde o pincel pressiona, afinando na saída), borda áspera e
   falhas de pincel seco, aguada desfocada e o selo vermelho
   (hanko) com 改善. Os contornos de 改 e 善 vieram da fonte
   Noto Sans CJK JP (licença OFL), pra não depender de fonte
   instalada em quem usa.
========================================================= */

import { el, reduzir } from "./comum.js";


const GLIFO_KAI = "M562 31C537 164 492 292 429 385V107H61V218H313V370H60V678C60 796 92 830 202 830C225 830 307 830 331 830C422 830 455 793 469 658C436 650 385 630 362 612C358 702 352 717 321 717C301 717 234 717 219 717C183 717 177 712 177 677V479H313V512H429V475C452 491 475 509 487 521C503 502 518 482 532 460C556 547 586 626 623 696C561 771 476 828 364 868C388 893 424 947 437 974C543 930 626 873 693 801C748 870 817 926 903 967C920 934 958 885 986 861C896 825 826 768 770 696C830 595 870 471 895 319H970V206H647C663 157 677 106 688 54ZM771 319C756 419 732 505 697 579C659 502 632 414 613 319Z";
const GLIFO_ZEN = "M181 688V970H299V939H699V966H823V688ZM299 847V779H699V847ZM647 28C637 60 616 103 599 135L604 136H379L396 131C386 102 365 59 342 29L233 56C247 80 262 110 272 136H106V223H435V261H171V346H435V385H78V473H229L186 482C201 505 214 534 223 558H45V650H956V558H776L822 478L788 473H925V385H559V346H830V261H559V223H895V136H721C737 112 755 82 774 48ZM435 473V558H315L344 551C337 529 323 498 307 473ZM559 473H694C683 498 668 528 656 552L696 558H559Z";

export const TINTA = "#141210";


/* Filtros e degradês de papel e tinta. */
export function preparar(svg, id) {
    const d = el("defs", {}, svg);
    d.innerHTML = `
        <radialGradient id="${id}-papel" cx=".5" cy=".45" r=".75">
            <stop offset="0" stop-color="#f7f2e7"/><stop offset=".7" stop-color="#efe6d3"/><stop offset="1" stop-color="#ddcfb2"/></radialGradient>
        <filter id="${id}-textura" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="3"/>
            <feColorMatrix values="0 0 0 0 .45  0 0 0 0 .38  0 0 0 0 .28  0 0 0 .11 0"/></filter>
        <filter id="${id}-pincel" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="r"/>
            <feDisplacementMap in="SourceGraphic" in2="r" scale="4.5" xChannelSelector="R" yChannelSelector="G"/></filter>
        <filter id="${id}-aguada" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="21" result="r"/>
            <feDisplacementMap in="SourceGraphic" in2="r" scale="14" xChannelSelector="R" yChannelSelector="G"/>
            <feGaussianBlur stdDeviation="2.4"/></filter>
        <filter id="${id}-borrao"><feGaussianBlur stdDeviation="18"/></filter>
        <filter id="${id}-carimbo" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="2" seed="5" result="r"/>
            <feDisplacementMap in="SourceGraphic" in2="r" scale="2.5" xChannelSelector="R" yChannelSelector="G" result="d"/>
            <feColorMatrix in="r" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2 0 0 0 2.15" result="falhas"/>
            <feComposite in="d" in2="falhas" operator="in"/></filter>`;
    return d;
}


/* Folha de papel washi: tom envelhecido nas bordas, fibras e granulado. */
export function papel(svg, id, rand) {
    el("rect", { width: 1600, height: 1000, fill: `url(#${id}-papel)` }, svg);
    const fibras = el("g", { fill: "none", "stroke-linecap": "round" }, svg);
    for (let i = 0; i < 320; i++) {
        const x = rand() * 1600, y = rand() * 1000, c = 6 + rand() * 26, a = rand() * Math.PI;
        el("path", { d: `M${x.toFixed(0)} ${y.toFixed(0)} q ${(Math.cos(a) * c / 2 + rand() * 6).toFixed(1)} ${(Math.sin(a) * c / 2).toFixed(1)} ${(Math.cos(a) * c).toFixed(1)} ${(Math.sin(a) * c).toFixed(1)}`,
            stroke: "#a8946e", "stroke-opacity": (0.06 + rand() * 0.12).toFixed(2), "stroke-width": (0.5 + rand() * 0.9).toFixed(1) }, fibras);
    }
    el("rect", { width: 1600, height: 1000, filter: `url(#${id}-textura)` }, svg);
}


/* Curva suave (Catmull-Rom) passando pelos pontos de controle. */
export function suavizar(pontos, porTrecho = 16) {
    const saida = [];
    for (let i = 0; i < pontos.length - 1; i++) {
        const p0 = pontos[Math.max(0, i - 1)], p1 = pontos[i], p2 = pontos[i + 1], p3 = pontos[Math.min(pontos.length - 1, i + 2)];
        for (let k = 0; k < porTrecho; k++) {
            const t = k / porTrecho, t2 = t * t, t3 = t2 * t;
            saida.push([0, 1].map((e) => 0.5 * ((2 * p1[e]) + (-p0[e] + p2[e]) * t + (2 * p0[e] - 5 * p1[e] + 4 * p2[e] - p3[e]) * t2 + (-p0[e] + 3 * p1[e] - 3 * p2[e] + p3[e]) * t3)));
        }
    }
    saida.push(pontos[pontos.length - 1]);
    return saida;
}


/* Pincelada: contorno de largura variável em volta da linha central.
   largura(t) dá a meia-largura em t (0 = onde o pincel encosta, 1 = onde sai).
   seco: a partir de que t a tinta acaba e as cerdas abrem riscos (kasure).
   Devolve um grupo (a tinta + as cerdas), que é o que pintar() anima. */
export function pincelada(pai, centro, largura, { seco = 1, cerdas = 9, semente = 1, ...atributos } = {}) {
    const ultimo = centro.length - 1;
    const normais = centro.map((p, i) => {
        const a = centro[Math.max(0, i - 1)], b = centro[Math.min(ultimo, i + 1)];
        const dx = b[0] - a[0], dy = b[1] - a[1], comp = Math.hypot(dx, dy) || 1;
        return [-dy / comp, dx / comp];
    });
    // ponta arredondada onde o pincel encosta
    const w = (i) => largura(i / ultimo) * Math.sqrt(Math.min(1, i / (ultimo * 0.012 + 1)));
    const lado = (sinal) => centro.map((p, i) => [p[0] + normais[i][0] * w(i) * sinal, p[1] + normais[i][1] * w(i) * sinal]);
    const pts = [...lado(1), ...lado(-1).reverse()];

    const grupo = el("g", {}, pai);
    el("path", { d: "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L") + " Z", fill: TINTA, ...atributos }, grupo);

    // cerdas: riscos da cor do papel correndo junto com o traço, mais abertos no fim
    if (seco < 1) {
        let s = semente * 9301 + 49297;
        const aleatorio = () => (s = (s * 16807) % 2147483647) / 2147483647;
        const fios = el("g", { fill: "none", "stroke-linecap": "round" }, grupo);
        for (let k = 0; k < cerdas; k++) {
            const desvio = -0.8 + (1.6 * (k + aleatorio() * 0.6)) / cerdas, comeca = seco + aleatorio() * (1 - seco) * 0.75;
            const i0 = Math.floor(comeca * ultimo);
            if (i0 >= ultimo - 2) continue;
            const linha = centro.slice(i0).map((p, j) => {
                const i = i0 + j;
                return `${(p[0] + normais[i][0] * w(i) * desvio).toFixed(1)} ${(p[1] + normais[i][1] * w(i) * desvio).toFixed(1)}`;
            });
            // fio mais fino que o vão entre cerdas: a tinta continua dominando
            el("path", { d: "M" + linha.join(" L"), stroke: "#f1e9d8", "stroke-width": (0.6 + aleatorio() * 1.4).toFixed(1),
                "stroke-opacity": (0.45 + aleatorio() * 0.45).toFixed(2) }, fios);
        }
    }
    grupo.centro = centro;
    return grupo;
}


/* Anima o pincel "passando": revela a pincelada ao longo da linha central,
   a partir da fração "de" (o que já estava pintado continua visível). */
export function pintar(svg, caminho, larguraMax, { de = 0, duracao = 1200, atraso = 0 } = {}) {
    if (reduzir) return Promise.resolve();
    const id = `msk${Math.random().toString(36).slice(2, 9)}`;
    const mascara = el("mask", { id, maskUnits: "userSpaceOnUse", x: -200, y: -200, width: 2000, height: 1400 }, svg.querySelector("defs"));
    const trilha = el("path", {
        d: "M" + caminho.centro.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L"),
        stroke: "#fff", "stroke-width": larguraMax * 2.8, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round",
        pathLength: 1, "stroke-dasharray": "1 1", "stroke-dashoffset": 1 - de
    }, mascara);
    caminho.setAttribute("mask", `url(#${id})`);
    return trilha.animate([{ strokeDashoffset: 1 - de }, { strokeDashoffset: 0 }],
        { duration: duracao, delay: atraso, easing: "cubic-bezier(.4,.1,.3,1)", fill: "forwards" }).finished.catch(() => {});
}


/* Aparece aos poucos, como aguada se espalhando no papel. */
export function espalhar(elemento, atraso = 0, duracao = 1400) {
    if (reduzir) return Promise.resolve();
    return elemento.animate([{ opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)" }],
        { duration: duracao, delay: atraso, easing: "ease-out", fill: "backwards" }).finished.catch(() => {});
}


/* Selo (hanko) vermelho com 改善 em baixo-relevo. */
export function selo(pai, id, x, y, tam, giro = -3) {
    const g = el("g", { transform: `translate(${x} ${y}) rotate(${giro})`, filter: `url(#${id}-carimbo)` }, pai);
    el("rect", { x: -tam / 2, y: -tam, width: tam, height: tam * 2, rx: tam * 0.08, fill: "#b8161c" }, g);
    const escala = (tam * 0.78) / 1000;
    el("path", { d: GLIFO_KAI, fill: "#f3e9dc", transform: `translate(${-tam * 0.39} ${-tam * 0.94}) scale(${escala})` }, g);
    el("path", { d: GLIFO_ZEN, fill: "#f3e9dc", transform: `translate(${-tam * 0.39} ${tam * 0.06}) scale(${escala})` }, g);
    return g;
}
