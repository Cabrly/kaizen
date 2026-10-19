/* =========================================================
   CENA — Montanhas em aguada (sansui-ga 山水画)
   ---------------------------------------------------------
   A paisagem clássica: cordilheiras em aguada se sobrepondo na
   névoa, da mais clara (longe) à mais escura (perto), um
   penhasco com pinheiros e uma cabana, e o lago onde um
   barqueiro atravessa.
   Cada tarefa pinta mais um elemento (a montanha se espalha no
   papel como aguada) e o barco avança. 100%: o sol vermelho
   aparece e o selo 改善 é carimbado.
========================================================= */

import { el, novaCena, quantas, semente } from "./comum.js";
import { espalhar, papel, pincelada, preparar, selo, suavizar, TINTA } from "./tinta.js";
import { aves, camadaViva, juntar } from "./vivos.js";


/* Cume de montanha "de pincel": picos arredondados + ruído fino. */
function cordilheira(rand, base, picos, amplitude) {
    const pts = [];
    for (let x = -60; x <= 1660; x += 12) {
        let y = base;
        for (const [px, altura, largura] of picos) y -= altura * Math.exp(-(((x - px) / largura) ** 2));
        y += Math.sin(x * 0.05 + rand()) * amplitude * .15 + (rand() - .5) * amplitude * .12;
        pts.push([x, y]);
    }
    return pts;
}


function aguada(pai, id, pts, tom, fundo = 1060) {
    const idG = `${id}-ag${Math.random().toString(36).slice(2, 7)}`;
    const g = el("g", {}, pai);
    el("linearGradient", { id: idG, x1: 0, y1: 0, x2: 0, y2: 1 }, pai.ownerSVGElement.querySelector("defs")).innerHTML =
        `<stop offset="0" stop-color="${TINTA}" stop-opacity="${tom}"/><stop offset=".35" stop-color="${TINTA}" stop-opacity="${tom * .45}"/><stop offset="1" stop-color="${TINTA}" stop-opacity="0"/>`;
    const topo = Math.min(...pts.map((p) => p[1]));
    el("path", { d: `M${pts.map((p) => p.map((v) => v.toFixed(0)).join(" ")).join(" L")} L1660 ${fundo} L-60 ${fundo} Z`,
        fill: `url(#${idG})`, filter: `url(#${id}-aguada)`, "data-topo": topo }, g);
    // contorno do cume mais carregado (a tinta junta na borda da aguada)
    el("path", { d: `M${pts.map((p) => p.map((v) => v.toFixed(0)).join(" ")).join(" L")}`, stroke: TINTA, "stroke-opacity": (tom * .55).toFixed(2),
        "stroke-width": 2.2, fill: "none", filter: `url(#${id}-pincel)` }, g);
    return g;
}


function pinheiro(pai, x, y, escala, rand) {
    const g = el("g", { transform: `translate(${x} ${y}) scale(${escala})` }, pai);
    pincelada(g, suavizar([[0, 0], [6, -60], [-4, -120], [10, -190]], 10), (t) => 7 * (1 - t * .7), { seco: .5, cerdas: 3, semente: Math.floor(rand() * 99) });
    // copas: tufos achatados feitos de toques curtos do pincel (agulhas), mais densos no meio
    for (const [cy, larg] of [[-188, 40], [-152, 62], [-114, 78], [-78, 60]]) {
        const desvio = (rand() - .4) * 24;
        for (let k = 0; k < 46; k++) {
            const u = (rand() + rand() + rand()) / 3 - .5;                // concentra no centro do tufo
            const x = desvio + u * larg * 2, y = cy + (rand() - .6) * 16 * (1 - Math.abs(u));
            const ang = -20 + rand() * 40, c = 7 + rand() * 9;
            el("ellipse", { cx: x.toFixed(1), cy: y.toFixed(1), rx: c.toFixed(1), ry: (1.4 + rand() * 1.8).toFixed(1),
                transform: `rotate(${ang.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})`, fill: TINTA, opacity: (.55 + rand() * .45).toFixed(2) }, g);
        }
    }
    return g;
}


export const sansui = {
    id: "sansui",
    nome: "Montanhas ao pôr do sol",
    desc: "Aguada e aquarela: a paisagem se pinta e o sol se põe no lago",
    escuro: () => false,
    pinta: true,               // a pincelada nova aparece sendo pintada

    montar(container) {
        const { svg, id } = novaCena(container);
        const rand = semente(5);
        preparar(svg, id);
        papel(svg, id, rand);
        svg.querySelector("defs").insertAdjacentHTML("beforeend", `
            <linearGradient id="${id}-poente" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#b9c6e6"/><stop offset=".3" stop-color="#f6d6b0"/><stop offset=".5" stop-color="#f6a46a"/>
                <stop offset=".6" stop-color="#e86d4a"/><stop offset=".85" stop-color="#d98a6e"/><stop offset="1" stop-color="#c89a86"/></linearGradient>
            <radialGradient id="${id}-solHalo"><stop offset="0" stop-color="#ffd27a" stop-opacity=".9"/><stop offset=".3" stop-color="#ff9a5a" stop-opacity=".4"/><stop offset="1" stop-color="#ff7a4a" stop-opacity="0"/></radialGradient>
            <radialGradient id="${id}-solCor" cx=".45" cy=".4"><stop offset="0" stop-color="#ffcf7a"/><stop offset=".55" stop-color="#f05a2a"/><stop offset="1" stop-color="#c41c18"/></radialGradient>`);

        // aquarela do poente por cima do papel (multiplica: as fibras continuam aparecendo)
        const poente = el("rect", { width: 1600, height: 1000, fill: `url(#${id}-poente)`, style: "mix-blend-mode: multiply", opacity: 0 }, svg);
        const solHalo = el("circle", { cx: 1180, cy: 300, r: 420, fill: `url(#${id}-solHalo)`, opacity: 0 }, svg);
        const sol = el("circle", { cx: 1180, cy: 230, r: 64, fill: `url(#${id}-solCor)`, filter: `url(#${id}-pincel)` }, svg);
        const tela = el("g", {}, svg);

        const elementos = [];
        // da névoa pra frente: cada um é uma "peça" que a tarefa pinta
        elementos.push(aguada(tela, id, cordilheira(rand, 560, [[300, 170, 160], [620, 240, 130], [980, 150, 200], [1380, 210, 150]], 30), .18));
        elementos.push(aguada(tela, id, cordilheira(rand, 640, [[150, 140, 120], [520, 120, 160], [880, 230, 110], [1250, 130, 170]], 40), .32));
        elementos.push(aguada(tela, id, cordilheira(rand, 720, [[700, 160, 140], [1100, 110, 160], [1500, 190, 120]], 50), .5));

        // penhasco da esquerda (perto, tinta carregada) com pinheiros e cabana
        const penhasco = el("g", {}, tela);
        aguada(penhasco, id, [[-60, 300], [60, 280], [160, 330], [250, 420], [300, 520], [330, 640], [390, 720], [460, 800], [520, 880], [560, 1000]], .78);
        elementos.push(penhasco);
        elementos.push(pinheiro(tela, 120, 330, 1, rand));
        elementos.push(pinheiro(tela, 230, 440, .75, rand));

        const cabana = el("g", { transform: "translate(1300 760)" }, tela);
        aguada(cabana, id, [[-200, 30], [-80, -10], [60, -20], [200, 10], [260, 40]], .6, 160);
        pincelada(cabana, suavizar([[-46, -32], [0, -58], [46, -32]], 8), (t) => 5 * Math.sin(Math.PI * t) + 1.5);
        el("rect", { x: -34, y: -34, width: 68, height: 30, fill: "none", stroke: TINTA, "stroke-width": 3, filter: `url(#${id}-pincel)` }, cabana);
        elementos.push(cabana);

        // pássaros voltando: dois traços cada
        const passaros = el("g", {}, tela);
        for (const [x, y, s] of [[820, 300, 1], [860, 320, .8], [900, 290, .7], [940, 330, .6]]) {
            pincelada(passaros, suavizar([[x - 12 * s, y], [x - 4 * s, y - 6 * s], [x, y]], 5), (t) => 1.8 * Math.sin(Math.PI * t) + .4);
            pincelada(passaros, suavizar([[x, y], [x + 5 * s, y - 7 * s], [x + 14 * s, y - 2 * s]], 5), (t) => 1.8 * Math.sin(Math.PI * t) + .4);
        }
        elementos.push(passaros);

        // lago: linhas finas de pincel na horizontal
        // reflexo do sol no lago: pinceladas laranja na horizontal, mais largas perto da margem
        const reflexo = el("g", { opacity: 0 }, svg);
        for (let k = 0; k < 18; k++) {
            const y = 852 + k * 8, larg = 30 + k * 9 + rand() * 30, x = 1180 - larg / 2 + (rand() - .5) * 30;
            pincelada(reflexo, suavizar([[x, y], [x + larg / 2, y + (rand() - .5) * 2], [x + larg, y]], 6), (t) => 2.4 * Math.sin(Math.PI * t) + .4,
                { fill: k % 3 ? "#f08a4a" : "#ffd27a", opacity: (.85 - k * .03).toFixed(2) });
        }
        const agua = el("g", { opacity: ".5" }, svg);
        for (let k = 0; k < 16; k++) {
            const y = 850 + k * 9 + rand() * 6, x = 350 + rand() * 900, c = 60 + rand() * 160;
            pincelada(agua, suavizar([[x, y], [x + c / 2, y + (rand() - .5) * 2], [x + c, y]], 6), (t) => 1.4 * Math.sin(Math.PI * t) + .2);
        }
        // barqueiro: canoa, chapéu de palha e vara
        const barco = el("g", {}, svg);
        pincelada(barco, suavizar([[-46, 0], [0, 8], [50, -4]], 8), (t) => 6 * Math.sin(Math.PI * t) + 1);
        el("path", { d: "M-14 -6 L-4 -30 L6 -6 Z", fill: TINTA }, barco);
        el("path", { d: "M-20 -26 Q-4 -40 12 -26 Z", fill: TINTA }, barco);
        pincelada(barco, [[10, -26], [40, 18]], () => 1.4);

        const seloG = selo(svg, id, 1480, 860, 40);
        seloG.setAttribute("opacity", 0);
        let mostrados = 0;

        return {
            atualizar(feitos, total, animar) {
                const n = quantas(feitos, total, elementos.length);
                elementos.forEach((e, i) => e.setAttribute("opacity", i < n ? "1" : "0"));
                const fracao = total ? feitos / total : 0;
                barco.setAttribute("transform", `translate(${(420 + fracao * 760).toFixed(0)} ${(900 - fracao * 40).toFixed(0)})`);
                const completo = total > 0 && feitos >= total;
                // o sol desce até tocar o horizonte e avermelha; o poente esquenta a aquarela
                sol.setAttribute("cy", (200 + fracao * 200).toFixed(0));   // desce até pousar na crista do fundo
                sol.setAttribute("r", (58 + fracao * 22).toFixed(0));
                solHalo.setAttribute("cy", (200 + fracao * 200).toFixed(0));
                solHalo.setAttribute("opacity", (0.15 + fracao * 0.85).toFixed(2));
                poente.setAttribute("opacity", (0.12 + fracao * 0.78).toFixed(2));
                reflexo.setAttribute("opacity", Math.max(0, fracao * 1.3 - .3).toFixed(2));
                seloG.setAttribute("opacity", completo ? "1" : "0");
                const novos = elementos.slice(mostrados, n);
                mostrados = n;
                if (!animar || !novos.length) return Promise.resolve();
                novos.forEach((e, i) => espalhar(e, i * 500, 1600));
                if (completo) espalhar(seloG, novos.length * 500 + 900, 700);
                return new Promise((ok) => setTimeout(ok, novos.length * 500 + 1700));
            },
            comemorar() {}
        };
    },

    vivo(container) {
        const svg = camadaViva(container);
        return juntar(aves(svg, { cor: "#2a1a14", altura: [120, 330] }), () => svg.remove());
    }
};
