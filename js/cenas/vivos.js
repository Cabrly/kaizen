/* =========================================================
   VIVOS — o que se mexe por cima da foto da cena
   ---------------------------------------------------------
   A cena é uma foto parada (leve). O movimento fica numa
   camada à parte, com poucos elementos e só transform/opacity
   (o navegador anima isso sem redesenhar a cena): estrelas
   cadentes, vaga-lumes, pétalas, aves.
   Cada função recebe o <svg> da camada e devolve "parar".
========================================================= */

import { el } from "./comum.js";


export const SEM_MOVIMENTO = matchMedia("(prefers-reduced-motion: reduce)").matches;


export function camadaViva(container) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 1600 1000");
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.classList.add("cena-viva");
    container.append(svg);
    return svg;
}


/* Junta vários "parar" num só. */
export function juntar(...paradas) {
    return () => paradas.forEach((parar) => parar?.());
}


/* Estrela cadente de vez em quando. quando() decide se ainda é noite. */
export function cadentes(svg, { quando = () => true, regiao = [250, 30, 1350, 300] } = {}) {
    if (SEM_MOVIMENTO) return () => {};
    if (!svg.querySelector("#cadente-grad")) {
        svg.insertAdjacentHTML("afterbegin", `<defs><linearGradient id="cadente-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>`);
    }
    let espera = null;
    const cair = () => {
        if (quando()) {
            const [x0, y0, larg, alt] = regiao;
            const x = x0 + Math.random() * larg, y = y0 + Math.random() * alt, comp = 140 + Math.random() * 120;
            const g = el("g", {}, svg);
            el("rect", { x: -comp, y: -1.2, width: comp, height: 2.4, rx: 1.2, fill: "url(#cadente-grad)" }, g);
            el("circle", { r: 2.4, fill: "#fff" }, g);
            g.animate([{ transform: `translate(${x}px, ${y}px) rotate(160deg) translateX(0)`, opacity: 0 },
                { opacity: 1, offset: .15 },
                { transform: `translate(${x}px, ${y}px) rotate(160deg) translateX(420px)`, opacity: 0 }],
                { duration: 1100, easing: "ease-in" }).finished.then(() => g.remove(), () => g.remove());
        }
        espera = setTimeout(cair, 5000 + Math.random() * 9000);
    };
    espera = setTimeout(cair, 1800);
    return () => clearTimeout(espera);
}


/* Vaga-lumes: quantos() diz quantos estão acesos agora; eles pairam e piscam. */
export function vagalumes(svg, { quantos, maximo = 60, area = [0, 300, 1600, 700] }) {
    if (SEM_MOVIMENTO) return () => {};
    svg.insertAdjacentHTML("afterbegin", `<defs><radialGradient id="vagalume-luz">
        <stop offset="0" stop-color="#fbffb0"/><stop offset=".25" stop-color="#d8ff6a" stop-opacity=".8"/><stop offset="1" stop-color="#9dff3a" stop-opacity="0"/></radialGradient></defs>`);
    const [ax, ay, al, aa] = area;
    const bichos = Array.from({ length: maximo }, () => {
        const x = ax + Math.random() * al, y = ay + Math.random() * aa;
        const g = el("g", { opacity: 0 }, svg);
        el("circle", { r: 14, fill: "url(#vagalume-luz)" }, g);
        el("circle", { r: 2, fill: "#fdffd8" }, g);
        const dx = (Math.random() - .5) * 120, dy = (Math.random() - .5) * 80;
        const voo = g.animate([{ transform: `translate(${x}px, ${y}px)` }, { transform: `translate(${x + dx}px, ${y + dy}px)` }, { transform: `translate(${x - dx * .4}px, ${y + dy * .6}px)` }, { transform: `translate(${x}px, ${y}px)` }],
            { duration: 9000 + Math.random() * 9000, iterations: Infinity, delay: -Math.random() * 9000, easing: "ease-in-out" });
        return { g, voo, piscar: null };
    });
    let acesos = -1;
    const atualizar = () => {
        const n = Math.min(maximo, quantos());
        if (n === acesos) return;
        acesos = n;
        bichos.forEach((b, i) => {
            if (i < n && !b.piscar) {
                b.piscar = b.g.animate([{ opacity: 0 }, { opacity: 1, offset: .3 }, { opacity: .15, offset: .6 }, { opacity: 1, offset: .8 }, { opacity: 0 }],
                    { duration: 2600 + Math.random() * 2600, iterations: Infinity, delay: -Math.random() * 3000 });
            } else if (i >= n && b.piscar) {
                b.piscar.cancel();
                b.piscar = null;
            }
        });
    };
    atualizar();
    const relogio = setInterval(atualizar, 1500);
    return () => { clearInterval(relogio); bichos.forEach((b) => { b.voo.cancel(); b.piscar?.cancel(); }); };
}


/* Pétalas caindo e girando, levadas pelo vento. */
export function petalas(svg, { quantas = 28, cores = ["#ffc1d6", "#f5a3c0", "#ffd9e6"] } = {}) {
    if (SEM_MOVIMENTO) return () => {};
    const animacoes = [];
    for (let i = 0; i < quantas; i++) {
        const x = Math.random() * 1700 - 100, dur = 9000 + Math.random() * 9000, vento = 160 + Math.random() * 260;
        const p = el("ellipse", { rx: 5 + Math.random() * 3, ry: 3 + Math.random() * 2, fill: cores[i % cores.length], opacity: (.6 + Math.random() * .4).toFixed(2) }, svg);
        animacoes.push(p.animate(
            [{ transform: `translate(${x}px, -30px) rotate(0deg)` },
             { transform: `translate(${x + vento * .5}px, 500px) rotate(${180 + Math.random() * 180}deg)` },
             { transform: `translate(${x + vento}px, 1030px) rotate(${360 + Math.random() * 360}deg)` }],
            { duration: dur, iterations: Infinity, delay: -Math.random() * dur, easing: "linear" }));
    }
    return () => animacoes.forEach((a) => a.cancel());
}


/* Bando de aves (silhuetas de tinta) cruzando o céu de vez em quando. */
export function aves(svg, { cor = "#1a1410", altura = [140, 360], intervalo = [14000, 26000] } = {}) {
    if (SEM_MOVIMENTO) return () => {};
    let espera = null;
    const passar = () => {
        const y = altura[0] + Math.random() * (altura[1] - altura[0]), indo = Math.random() < .5;
        const bando = el("g", {}, svg);
        const quantas = 3 + Math.floor(Math.random() * 4);
        for (let k = 0; k < quantas; k++) {
            const ave = el("g", { transform: `translate(${(k * 34 + Math.random() * 14) * (indo ? -1 : 1)} ${k * 10 + Math.random() * 12})` }, bando);
            const asa = el("path", { d: "M-14 0 Q-6 -8 0 0 Q6 -8 14 0", stroke: cor, "stroke-width": 2.4, fill: "none", "stroke-linecap": "round" }, ave);
            asa.animate([{ transform: "scaleY(1)" }, { transform: "scaleY(-.5)" }, { transform: "scaleY(1)" }], { duration: 700 + Math.random() * 300, iterations: Infinity });
        }
        const [de, ate] = indo ? [-150, 1750] : [1750, -150];
        bando.animate([{ transform: `translate(${de}px, ${y}px)` }, { transform: `translate(${ate}px, ${y - 60}px)` }],
            { duration: 16000 + Math.random() * 6000, easing: "linear" }).finished.then(() => bando.remove(), () => bando.remove());
        espera = setTimeout(passar, intervalo[0] + Math.random() * (intervalo[1] - intervalo[0]));
    };
    espera = setTimeout(passar, 2500);
    return () => clearTimeout(espera);
}
