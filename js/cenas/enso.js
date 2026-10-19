/* =========================================================
   CENA — Ensō dourado (kintsugi)
   ---------------------------------------------------------
   O círculo zen pintado em OURO sobre papel preto: a estética
   do kintsugi, que conserta com ouro — melhoria contínua.
   O ouro tem brilho metálico de verdade (feSpecularLighting
   sobre o relevo da pincelada), as cerdas secas deixam o preto
   aparecer e folhas de ouro (kinpaku) salpicam o papel.

   Cada tarefa leva o pincel mais um trecho e solta mais folhas
   de ouro. 100%: o círculo se fecha e o selo vermelho é batido.
========================================================= */

import { el, novaCena, quantas, semente } from "./comum.js";
import { espalhar, pincelada, pintar, preparar, selo } from "./tinta.js";


const CENTRO = [1030, 470];
const RAIO = 285;
const INICIO = -100 * Math.PI / 180;
const VARREDURA = 340 * Math.PI / 180;
const TRECHOS = 12;


function linhaCentral(fracao) {
    const passos = Math.max(2, Math.round(300 * fracao));
    return Array.from({ length: passos + 1 }, (_, i) => {
        const t = (i / passos) * fracao, a = INICIO + t * VARREDURA;
        const r = RAIO + Math.sin(t * 7) * 9 + Math.sin(t * 2.3 + 1) * 6 + Math.max(0, t - 0.88) * 140;
        return [CENTRO[0] + Math.cos(a) * r, CENTRO[1] + Math.sin(a) * r];
    });
}


function largura(fracao) {
    return (s) => {
        const t = s * fracao;
        const encosta = 20 * Math.exp(-(((t - 0.035) / 0.05) ** 2));
        const saida = fracao >= 1 ? 1 - Math.max(0, (t - 0.74) / 0.26) ** 1.5 * 0.9 : 1;
        const pausa = fracao < 1 ? Math.min(1, 0.45 + ((fracao - t) / 0.05)) : 1;
        return Math.max(2.5, (34 + encosta + Math.sin(t * 13) * 3) * saida * pausa);
    };
}


/* Folha de ouro: lasca irregular, com um lado mais claro (o reflexo). */
function folhaDeOuro(pai, id, x, y, tam, rand) {
    const lados = 5 + Math.floor(rand() * 3), pts = [];
    for (let k = 0; k < lados; k++) {
        const a = (k / lados) * Math.PI * 2 + rand() * .5, r = tam * (.55 + rand() * .55);
        pts.push(`${(x + Math.cos(a) * r).toFixed(1)} ${(y + Math.sin(a) * r * (.6 + rand() * .5)).toFixed(1)}`);
    }
    return el("path", { d: `M${pts.join(" L")} Z`, fill: `url(#${id}-folha)`, opacity: (.55 + rand() * .45).toFixed(2),
        transform: `rotate(${(rand() * 360).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})` }, pai);
}


export const enso = {
    id: "enso",
    nome: "Ensō dourado",
    desc: "Kintsugi: o círculo zen pintado em ouro, trecho a trecho",
    escuro: () => true,
    pinta: true,               // a pincelada nova aparece sendo pintada

    montar(container) {
        const { svg, id } = novaCena(container);
        const rand = semente(9);
        const defs = preparar(svg, id);
        defs.insertAdjacentHTML("beforeend", `
            <radialGradient id="${id}-preto" cx=".62" cy=".45" r=".8">
                <stop offset="0" stop-color="#211c17"/><stop offset=".55" stop-color="#110e0b"/><stop offset="1" stop-color="#050403"/></radialGradient>
            <linearGradient id="${id}-ouro" gradientUnits="userSpaceOnUse" x1="720" y1="160" x2="1340" y2="790">
                <stop offset="0" stop-color="#8a6a24"/><stop offset=".18" stop-color="#f6dc8a"/><stop offset=".32" stop-color="#b98a2e"/>
                <stop offset=".5" stop-color="#ffefb8"/><stop offset=".64" stop-color="#c79a3c"/><stop offset=".82" stop-color="#7a5718"/>
                <stop offset="1" stop-color="#e8c56c"/></linearGradient>
            <linearGradient id="${id}-folha" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#fff2bf"/><stop offset=".45" stop-color="#e2b752"/><stop offset="1" stop-color="#8f6a22"/></linearGradient>
            <radialGradient id="${id}-aura"><stop offset=".6" stop-color="#e2b24a" stop-opacity="0"/><stop offset=".82" stop-color="#e2b24a" stop-opacity=".16"/><stop offset="1" stop-color="#e2b24a" stop-opacity="0"/></radialGradient>
            <filter id="${id}-metal" x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="r"/>
                <feDisplacementMap in="SourceGraphic" in2="r" scale="4.5" xChannelSelector="R" yChannelSelector="G" result="base"/>
                <feTurbulence type="fractalNoise" baseFrequency="0.06 0.012" numOctaves="3" seed="2" result="veios"/>
                <feComposite in="veios" in2="base" operator="in" result="relevoVeios"/>
                <feGaussianBlur in="base" stdDeviation="3.5" result="alfa"/>
                <feComposite in="alfa" in2="relevoVeios" operator="arithmetic" k2="1" k3=".6" result="relevo"/>
                <feSpecularLighting in="relevo" surfaceScale="5" specularConstant="1.25" specularExponent="22" lighting-color="#fff4d2" result="brilho">
                    <fePointLight x="700" y="80" z="520"/></feSpecularLighting>
                <feComposite in="brilho" in2="base" operator="in" result="reflexo"/>
                <feComposite in="base" in2="reflexo" operator="arithmetic" k2="1" k3=".85"/></filter>
            <radialGradient id="${id}-cintila"><stop offset="0" stop-color="#ffd978" stop-opacity=".35"/><stop offset="1" stop-color="#ffd978" stop-opacity="0"/></radialGradient>`);

        // papel preto: fibras claras e granulado
        el("rect", { width: 1600, height: 1000, fill: `url(#${id}-preto)` }, svg);
        const fibras = el("g", { fill: "none", "stroke-linecap": "round" }, svg);
        for (let i = 0; i < 260; i++) {
            const x = rand() * 1600, y = rand() * 1000, c = 8 + rand() * 30, a = rand() * Math.PI;
            el("path", { d: `M${x.toFixed(0)} ${y.toFixed(0)} q ${(Math.cos(a) * c / 2 + rand() * 6).toFixed(1)} ${(Math.sin(a) * c / 2).toFixed(1)} ${(Math.cos(a) * c).toFixed(1)} ${(Math.sin(a) * c).toFixed(1)}`,
                stroke: "#5a4e40", "stroke-opacity": (0.08 + rand() * 0.14).toFixed(2), "stroke-width": (0.5 + rand() * 0.8).toFixed(1) }, fibras);
        }
        el("rect", { width: 1600, height: 1000, filter: `url(#${id}-textura)`, opacity: ".5" }, svg);

        // aura quente atrás do círculo (o ouro "ilumina" o papel)
        const aura = el("circle", { cx: CENTRO[0], cy: CENTRO[1], r: RAIO * 1.45, fill: `url(#${id}-aura)`, opacity: 0 }, svg);

        // folhas de ouro e pó: perto do traço e espalhadas, em ordem de aparecimento
        const ouro = el("g", {}, svg);
        const salpicos = [];
        for (let i = 0; i < 90; i++) {
            const perto = rand() < .6, t = rand();
            const a = INICIO + t * VARREDURA, r = RAIO + (rand() - .5) * 170;
            const x = perto ? CENTRO[0] + Math.cos(a) * r : 80 + rand() * 1440, y = perto ? CENTRO[1] + Math.sin(a) * r : 40 + rand() * 920;
            const tam = rand() < .12 ? 9 + rand() * 12 : 2 + rand() * 5;
            const g = el("g", {}, ouro);
            if (tam > 6) el("circle", { cx: x.toFixed(0), cy: y.toFixed(0), r: (tam * 2.6).toFixed(0), fill: `url(#${id}-cintila)` }, g);
            folhaDeOuro(g, id, x, y, tam, rand);
            salpicos.push({ g, ordem: perto ? t : rand() });
        }
        salpicos.sort((a, b) => a.ordem - b.ordem);

        const traco = el("g", { filter: `url(#${id}-metal)` }, svg);
        const secos = el("g", {}, svg);           // cerdas fora do filtro: o reflexo do ouro não pode clareá-las
        const seloG = selo(svg, id, CENTRO[0] + RAIO + 140, CENTRO[1] + RAIO - 30, 48);
        seloG.setAttribute("opacity", 0);

        let pinceladaAtual = null, fracaoAtual = 0;

        return {
            atualizar(feitos, total, animar) {
                const fracao = quantas(feitos, total, TRECHOS) / TRECHOS;
                const anterior = fracaoAtual;
                fracaoAtual = fracao;
                pinceladaAtual?.remove();
                pinceladaAtual = null;
                if (fracao > 0) {
                    pinceladaAtual = pincelada(traco, linhaCentral(fracao), largura(fracao),
                        { fill: `url(#${id}-ouro)`, seco: fracao >= 1 ? 0.6 : 1, cerdas: 16, semente: 3 });
                    secos.replaceChildren();
                    const fios = pinceladaAtual.querySelector("g");
                    if (fios) {
                        fios.querySelectorAll("path").forEach((fio) => fio.setAttribute("stroke", "#0d0b09"));
                        secos.append(fios);
                    }
                }
                const visiveis = Math.round(salpicos.length * (0.15 + 0.85 * fracao) * (fracao > 0 ? 1 : 0));
                const novos = [];
                salpicos.forEach((s, i) => {
                    const mostra = i < visiveis;
                    if (mostra && s.g.getAttribute("opacity") === "0") novos.push(s.g);
                    s.g.setAttribute("opacity", mostra ? "1" : "0");
                });
                aura.setAttribute("opacity", (fracao * 1).toFixed(2));
                const completo = fracao >= 1;
                seloG.setAttribute("opacity", completo ? "1" : "0");

                if (!animar || fracao <= anterior) return Promise.resolve();
                const duracao = 900 + (fracao - anterior) * 2600;
                novos.forEach((g, i) => espalhar(g, 300 + (i / Math.max(1, novos.length)) * duracao, 700));
                if (completo) espalhar(seloG, duracao + 300, 600);
                const pintando = pintar(svg, pinceladaAtual, 54, { de: anterior / fracao, duracao });
                secos.setAttribute("mask", pinceladaAtual.getAttribute("mask") || "");
                return pintando.then(() => { secos.removeAttribute("mask"); }).then(() => new Promise((ok) => setTimeout(ok, completo ? 1000 : 300)));
            },
            comemorar() {}
        };
    }
};
