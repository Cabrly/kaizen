/* =========================================================
   CENA — Fuji ao amanhecer (estilo fotográfico)
   ---------------------------------------------------------
   Noite estrelada com lua, mar de nuvens e bordos vermelhos
   em primeiro plano. Como de verdade no Fuji: quem sobe de
   noite vira um cordão de lanternas de cabeça em zigue-zague,
   e os abrigos (as estações) são pontinhos quentes na encosta.

   Cada tarefa estica o cordão trilha acima e acende o próximo
   abrigo; o horizonte doura, a lua desce e a neve ganha o rosa
   do amanhecer (akafuji). 100%: o sol desponta no horizonte.

   Texturas com feTurbulence (rocha, estrias de neve, nuvens,
   granulado de foto) — nada de contorno nem cor chapada.
========================================================= */

import { el, ligarPecas, novaCena, pontoNaLinha, pop, quantas, reduzir, semente } from "./comum.js";
import { cadentes, camadaViva, juntar, SEM_MOVIMENTO } from "./vivos.js";


const NOITE = {
    ceuTopo: "#050d1a", ceuMeio: "#0f2b3a", ceuHorizonte: "#2a4a52",
    monte: "#0c1630", monteBase: "#070d1e", neve: "#c4d4ec", neveSombra: "#5d6f94",
    nuvemQuente: "#9aa3b8", nuvemFria: "#4a5670", nevoa: "#3a4c62"
};
const AMANHECER = {
    ceuTopo: "#0f2a4a", ceuMeio: "#3f6f80", ceuHorizonte: "#f2b066",
    monte: "#2a2c55", monteBase: "#141836", neve: "#ffe1cf", neveSombra: "#b48aa2",
    nuvemQuente: "#ffd9a0", nuvemFria: "#9a8fb0", nevoa: "#c9a68a"
};

const MONTE = "M-80 690 C 40 664 150 650 260 632 C 420 600 600 478 752 352 Q 790 334 838 336 Q 880 337 912 356 C 1070 478 1310 606 1600 648 L1600 1000 L0 1000 Z";
const NEVE = "M600 452 C 660 410 728 372 752 352 Q 790 334 838 336 Q 880 337 912 356 C 950 386 990 416 1035 448 C 960 470 880 476 830 470 C 760 474 700 462 640 432 Z";
const TRILHA = [[1046, 640], [930, 614], [1062, 586], [918, 558], [1032, 530], [898, 502], [992, 474], [880, 447], [952, 420], [868, 394], [912, 368], [846, 342]];
const ABRIGOS = [1, 2, 3, 4, 5, 6, 7, 9];          // vértices da trilha onde fica cada estação


function hex(cor) {
    const n = parseInt(cor.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function misturar(a, b, t) {
    const x = hex(a), y = hex(b);
    return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
}


/* Galhos de bordo (momiji) em contraluz, ramificando a partir do canto. */
function bordos(pai, rand) {
    const g = el("g", {}, pai);
    const folha = (x, y, tam, ang, cor) => {
        // folha de bordo: 5 pontas (a do meio maior)
        const pontas = [[0, -1], [0.62, -0.62], [0.95, 0.1], [-0.95, 0.1], [-0.62, -0.62]];
        const d = "M0 0.35 " + pontas.map(([px, py], i) => {
            const meio = [(px * 0.42).toFixed(2), (py * 0.42).toFixed(2)];
            return `L${meio.join(" ")} L${px.toFixed(2)} ${py.toFixed(2)}`;
        }).join(" ") + " Z";
        el("path", { d, fill: cor, transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(0)}) scale(${tam.toFixed(1)})` }, g);
    };
    const cores = ["#7a0d0d", "#9c1a12", "#5e0a0a", "#b8321c", "#4a0808"];
    const galho = (x, y, ang, comp, esp, nivel) => {
        const x2 = x + Math.cos(ang) * comp, y2 = y + Math.sin(ang) * comp;
        el("path", { d: `M${x.toFixed(1)} ${y.toFixed(1)} Q ${((x + x2) / 2 + Math.sin(ang) * comp * .12).toFixed(1)} ${((y + y2) / 2 - Math.cos(ang) * comp * .12).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`,
            stroke: "#1a0c0c", "stroke-width": esp.toFixed(1), fill: "none", "stroke-linecap": "round" }, g);
        if (nivel >= 5 || comp < 14) {
            for (let k = 0; k < 7; k++) {
                folha(x2 + (rand() - .5) * 40, y2 + (rand() - .5) * 30, 7 + rand() * 6, rand() * 360, cores[(rand() * cores.length) | 0]);
            }
            return;
        }
        const ramos = 2 + (rand() < .4 ? 1 : 0);
        for (let k = 0; k < ramos; k++) {
            galho(x2, y2, ang + (k - (ramos - 1) / 2) * 0.55 + (rand() - .5) * .3, comp * (0.68 + rand() * .12), esp * 0.66, nivel + 1);
        }
    };
    galho(1620, 1020, -2.5, 150, 16, 0);
    galho(1500, 1030, -2.0, 120, 12, 1);
    galho(1180, 1040, -1.75, 90, 9, 2);
    return g;
}


export const fuji = {
    id: "fuji",
    nome: "Fuji ao amanhecer",
    desc: "Lanternas sobem a montanha; o sol nasce em 100%",
    escuro: (nivel) => nivel < 0.8,

    montar(container) {
        const { svg, id } = novaCena(container);
        const rand = semente(42);
        const defs = el("defs", {}, svg);
        defs.innerHTML = `
            <linearGradient id="${id}-ceu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" class="c0"/><stop offset=".45" class="c1"/><stop offset=".66" class="c2"/></linearGradient>
            <radialGradient id="${id}-aurora" cx="220" cy="650" r="700" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#ffcf7a" stop-opacity=".95"/><stop offset=".35" stop-color="#f29a5a" stop-opacity=".35"/><stop offset="1" stop-color="#f29a5a" stop-opacity="0"/></radialGradient>
            <radialGradient id="${id}-lua" cx=".42" cy=".4" r=".65">
                <stop offset="0" stop-color="#e9dcc4"/><stop offset=".7" stop-color="#b9a68c"/><stop offset="1" stop-color="#8a7a66"/></radialGradient>
            <radialGradient id="${id}-luaHalo"><stop offset=".55" stop-color="#e9dcc4" stop-opacity=".25"/><stop offset="1" stop-color="#e9dcc4" stop-opacity="0"/></radialGradient>
            <linearGradient id="${id}-monte" x1="0" y1="0" x2="0" y2="1">
                <stop offset=".3" class="m0"/><stop offset="1" class="m1"/></linearGradient>
            <linearGradient id="${id}-neve" x1="0" y1="0" x2="1" y2=".4">
                <stop offset="0" class="n1"/><stop offset=".45" class="n0"/><stop offset="1" class="n0"/></linearGradient>
            <linearGradient id="${id}-estriasCor" x1="0" y1="0" x2="0" y2="1">
                <stop offset=".35" class="n0" stop-opacity=".95"/><stop offset="1" class="n0" stop-opacity="0"/></linearGradient>
            <linearGradient id="${id}-nuvens" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" class="q0"/><stop offset=".55" class="q1"/><stop offset="1" class="q1"/></linearGradient>
            <linearGradient id="${id}-nevoa" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" class="v0" stop-opacity="0"/><stop offset=".5" class="v0" stop-opacity=".7"/><stop offset="1" class="v0" stop-opacity="0"/></linearGradient>
            <linearGradient id="${id}-aro" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#ffd59a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd59a" stop-opacity="0"/></linearGradient>
            <radialGradient id="${id}-sol"><stop offset="0" stop-color="#fffbe8"/><stop offset=".25" stop-color="#ffe6a0"/><stop offset=".6" stop-color="#ffb25a" stop-opacity=".55"/><stop offset="1" stop-color="#ff8a3a" stop-opacity="0"/></radialGradient>
            <radialGradient id="${id}-luzinha"><stop offset="0" stop-color="#fff2c4"/><stop offset=".35" stop-color="#ffcf6a" stop-opacity=".7"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
            <clipPath id="${id}-recorte"><path d="${MONTE}"/></clipPath>

            <filter id="${id}-rocha" x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.03 0.005" numOctaves="4" seed="8"/>
                <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.8 0 0 0 -0.75"/></filter>
            <filter id="${id}-estrias" x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.045 0.0035" numOctaves="3" seed="2" result="r"/>
                <feColorMatrix in="r" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  6 0 0 0 -3.05" result="a"/>
                <feComposite in="SourceGraphic" in2="a" operator="in"/></filter>
            <filter id="${id}-bordaNeve" x="-5%" y="-5%" width="110%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.07 0.025" numOctaves="3" seed="5" result="r"/>
                <feDisplacementMap in="SourceGraphic" in2="r" scale="26" xChannelSelector="R" yChannelSelector="G"/></filter>
            <filter id="${id}-nuvem" x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.012" numOctaves="5" seed="11" result="r"/>
                <feColorMatrix in="r" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.4 0 0 0 -1.2" result="a"/>
                <feDiffuseLighting in="r" surfaceScale="9" diffuseConstant="1.15" lighting-color="#fff" result="relevo">
                    <feDistantLight azimuth="200" elevation="38"/></feDiffuseLighting>
                <feComposite in="SourceGraphic" in2="relevo" operator="arithmetic" k1="1.25" k2="0.1" k3="0" k4="0" result="pintada"/>
                <feComposite in="pintada" in2="a" operator="in"/></filter>
            <filter id="${id}-crateras" x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="3"/>
                <feColorMatrix values="0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0 0.15  1.6 0 0 0 -0.7"/></filter>
            <filter id="${id}-desfoque"><feGaussianBlur stdDeviation="14"/></filter>
            <filter id="${id}-suave"><feGaussianBlur stdDeviation="1.1"/></filter>
            <radialGradient id="${id}-gRavina" cx="830" cy="330" r="330" gradientUnits="userSpaceOnUse">
                <stop offset=".35" stop-color="#fff"/><stop offset=".62" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
            <mask id="${id}-mRavinas"><rect width="1600" height="1000" fill="url(#${id}-gRavina)"/></mask>
            <linearGradient id="${id}-luar" x1="0" y1="0" x2="1" y2="0">
                <stop offset=".45" stop-color="#8fb0e0" stop-opacity="0"/><stop offset="1" stop-color="#8fb0e0" stop-opacity=".22"/></linearGradient>
            <filter id="${id}-granulado" x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="9"/>
                <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .07 0"/></filter>
            <clipPath id="${id}-luaRecorte"><circle r="88"/></clipPath>
            <radialGradient id="${id}-gEstrias" cx="830" cy="430" r="330" gradientTransform="matrix(1 0 0 .62 0 163)" gradientUnits="userSpaceOnUse">
                <stop offset=".25" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
            <mask id="${id}-mEstrias"><rect width="1600" height="1000" fill="url(#${id}-gEstrias)"/></mask>
            <linearGradient id="${id}-gNuvens" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".35" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff"/></linearGradient>
            <mask id="${id}-mNuvens" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#${id}-gNuvens)"/></mask>
            <radialGradient id="${id}-volume" cx="420" cy="620" r="520" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#02050f" stop-opacity=".55"/><stop offset="1" stop-color="#02050f" stop-opacity="0"/></radialGradient>`;

        // ---------- céu, via láctea e estrelas ----------
        el("rect", { width: 1600, height: 1000, fill: `url(#${id}-ceu)` }, svg);
        const aurora = el("rect", { width: 1600, height: 1000, fill: `url(#${id}-aurora)` }, svg);
        const estrelas = el("g", {}, svg);
        el("ellipse", { cx: 600, cy: 140, rx: 900, ry: 90, transform: "rotate(-18 600 140)", fill: "#9fb8d8", opacity: ".07", filter: `url(#${id}-desfoque)` }, estrelas);
        for (let i = 0; i < 420; i++) {
            const y = Math.pow(rand(), 1.4) * 600, brilho = rand();
            const estrela = el("circle", { cx: (rand() * 1600).toFixed(0), cy: y.toFixed(0), r: (0.4 + brilho * brilho * 1.6).toFixed(2),
                fill: brilho > .92 ? "#fff3d8" : "#ffffff", opacity: (0.3 + brilho * .7 - y / 1400).toFixed(2) }, estrelas);
            if (brilho > .85) { estrela.classList.add("cena-estrela"); estrela.style.animationDelay = `${(rand() * 4).toFixed(2)}s`; }
        }

        // ---------- lua (com crateras) ----------
        const lua = el("g", {}, svg);
        el("circle", { r: 170, fill: `url(#${id}-luaHalo)` }, lua);
        el("circle", { r: 88, fill: `url(#${id}-lua)` }, lua);
        el("rect", { x: -88, y: -88, width: 176, height: 176, filter: `url(#${id}-crateras)`, "clip-path": `url(#${id}-luaRecorte)`, opacity: ".55" }, lua);
        el("circle", { r: 88, fill: "none", stroke: "#fff4dc", "stroke-opacity": ".25", "stroke-width": 2 }, lua);

        // ---------- sol (desponta em 100%, à esquerda no horizonte) ----------
        const sol = el("circle", { cx: 120, cy: 628, r: 120, fill: `url(#${id}-sol)`, opacity: 0 }, svg);

        // ---------- o monte ----------
        el("path", { d: MONTE, fill: `url(#${id}-monte)` }, svg);
        el("rect", { width: 1600, height: 1000, filter: `url(#${id}-rocha)`, "clip-path": `url(#${id}-recorte)`, opacity: ".3" }, svg);
        const aro = el("path", { d: "M260 632 C 420 600 600 478 752 352", stroke: `url(#${id}-aro)`, "stroke-width": 3, fill: "none", opacity: 0 }, svg);
        const camadaNeve = el("g", { "clip-path": `url(#${id}-recorte)` }, svg);
        el("path", { d: NEVE, fill: `url(#${id}-neve)`, filter: `url(#${id}-bordaNeve)` }, camadaNeve);
        // estrias de neve escorrendo pelas ravinas
        // cume liso por cima da borda irregular
        el("path", { d: "M690 400 C 720 380 740 364 752 352 Q 790 334 838 336 Q 880 337 912 356 C 935 374 960 392 985 410 C 900 425 780 425 690 400 Z", fill: `url(#${id}-neve)` }, camadaNeve);
        // ravinas: a neve escorre em sulcos que irradiam do cume, cada um de um comprimento
        const ravinas = el("g", { mask: `url(#${id}-mRavinas)`, filter: `url(#${id}-suave)`, class: "fj-ravinas" }, camadaNeve);
        for (let k = 0; k < 64; k++) {
            const ang = (28 + (k / 63) * 122) * Math.PI / 180;
            const onda = Math.sin(k * 1.7) * 0.5 + Math.sin(k * 0.53 + 1) * 0.35 + rand() * 0.4;
            const r0 = 150 + Math.abs(Math.cos(ang)) * 90, comp = 60 + Math.max(0, onda + .25) * 210;
            const esp = 2.5 + rand() * 4.5, curva = (rand() - .5) * 0.06;
            const [cx, cy] = [830, 300];
            const ponto = (r, a, lado) => [cx + Math.cos(a + curva * (r - r0) / 60) * r + Math.cos(a + Math.PI / 2) * lado,
                                           cy + Math.sin(a + curva * (r - r0) / 60) * r * 0.62 + Math.sin(a + Math.PI / 2) * lado];
            const a1 = ponto(r0, ang, -esp), a2 = ponto(r0, ang, esp), fim = ponto(r0 + comp, ang, 0);
            el("path", { d: `M${a1[0].toFixed(1)} ${a1[1].toFixed(1)} L${fim[0].toFixed(1)} ${fim[1].toFixed(1)} L${a2[0].toFixed(1)} ${a2[1].toFixed(1)} Z`, class: "n0f" }, ravinas);
        }
        // lado oeste do cone na sombra (a luz da lua vem do leste)
        el("rect", { width: 1600, height: 1000, fill: `url(#${id}-volume)`, "clip-path": `url(#${id}-recorte)` }, svg);
        el("rect", { width: 1600, height: 1000, fill: `url(#${id}-luar)`, "clip-path": `url(#${id}-recorte)` }, svg);

        // ---------- cordão de lanternas e abrigos ----------
        const passos = [];
        const comprimento = TRILHA.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - TRILHA[i][0], p[1] - TRILHA[i][1]), 0);
        const cordao = el("g", {}, svg);
        for (let d = 0; d <= comprimento; d += 9) {
            const [x, y] = pontoNaLinha(TRILHA, d / comprimento);
            const ponto = el("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: 1.5, fill: "#fff1c8", opacity: 0, class: "fj-lanterna" }, cordao);
            ponto.style.animationDelay = `${(rand() * 2.5).toFixed(2)}s`;
            passos.push(ponto);
        }
        const abrigos = ABRIGOS.map((i) => {
            const [x, y] = TRILHA[i];
            const g = el("g", { transform: `translate(${x} ${y - 3})`, opacity: 0 }, svg);
            el("circle", { r: 7, fill: `url(#${id}-luzinha)` }, g);
            el("circle", { r: 1.6, fill: "#fff4d0" }, g);
            return { g };
        });

        // ---------- névoa sobre o lago e mar de nuvens ----------
        const nevoa = el("rect", { x: 0, y: 560, width: 1600, height: 200, fill: `url(#${id}-nevoa)` }, svg);
        el("path", { d: "M1010 830 C 1120 776 1240 748 1350 752 C 1440 756 1530 728 1620 712 L1620 900 C 1400 880 1200 870 1010 830 Z", fill: "#0a0d18", opacity: ".92" }, svg);
        const nuvemBase = el("rect", { x: 0, y: 700, width: 1600, height: 300, fill: `url(#${id}-nuvens)`, opacity: ".55", mask: `url(#${id}-mNuvens)` }, svg);
        const mar = el("g", { mask: `url(#${id}-mNuvens)` }, svg);
        const nuvens1 = el("rect", { x: -100, y: 640, width: 1800, height: 360, fill: `url(#${id}-nuvens)`, filter: `url(#${id}-nuvem)` }, mar);
        const mar2 = el("g", { mask: `url(#${id}-mNuvens)` }, svg);
        const nuvens2 = el("rect", { x: -100, y: 780, width: 1800, height: 220, fill: `url(#${id}-nuvens)`, filter: `url(#${id}-nuvem)`, opacity: ".85" }, mar2);
        nuvens1.classList.add("fj-nuvem-deriva");

        bordos(svg, rand);
        el("rect", { width: 1600, height: 1000, filter: `url(#${id}-granulado)` }, svg);

        // ---------- luz conforme o nível ----------
        const stops = (classe) => [...svg.querySelectorAll(`.${classe}`)];
        const pintar = (classe, cor) => stops(classe).forEach((s) => s.style.stopColor = cor);

        function iluminar(n) {
            const m = (k) => misturar(NOITE[k], AMANHECER[k], n);
            pintar("c0", m("ceuTopo")); pintar("c1", m("ceuMeio")); pintar("c2", m("ceuHorizonte"));
            pintar("m0", m("monte")); pintar("m1", m("monteBase"));
            pintar("n0", m("neve")); pintar("n1", m("neveSombra"));
            ravinas.style.fill = m("neve");
            pintar("q0", m("nuvemQuente")); pintar("q1", m("nuvemFria")); pintar("v0", m("nevoa"));
            aurora.style.opacity = (0.15 + n * 0.85).toFixed(2);
            estrelas.style.opacity = Math.max(0.05, 1 - n * 1.1).toFixed(2);
            lua.setAttribute("transform", `translate(${(1110 + n * 190).toFixed(0)} ${(220 + n * 400).toFixed(0)})`);   // põe-se atrás da encosta
            lua.style.opacity = (1 - n * 0.75).toFixed(2);
            aro.style.opacity = Math.max(0, (n - 0.45) * 1.8).toFixed(2);
            sol.style.opacity = Math.max(0, (n - 0.82) * 5.5).toFixed(2);
            const aceso = Math.round(n * passos.length);
            passos.forEach((p, i) => p.style.opacity = i < aceso ? (0.5 + 0.5 * (1 - n)).toFixed(2) : "0");
            nuvemBase.style.opacity = (0.45 + n * 0.35).toFixed(2);
            nevoa.style.opacity = (0.8 + n * 0.2).toFixed(2);
            nuvens2.style.opacity = (0.75 + n * 0.25).toFixed(2);
        }

        let nivel = 0, animacao = null;
        function irPara(alvo, animar) {
            cancelAnimationFrame(animacao);
            if (!animar || reduzir) { nivel = alvo; iluminar(nivel); return; }
            const de = nivel, inicio = performance.now(), duracao = 2200;
            const passo = (agora) => {
                const t = Math.min(1, (agora - inicio) / duracao), suave = 1 - Math.pow(1 - t, 3);
                nivel = de + (alvo - de) * suave;
                iluminar(nivel);
                if (t < 1) animacao = requestAnimationFrame(passo);
            };
            animacao = requestAnimationFrame(passo);
        }
        iluminar(0);

        return {
            atualizar(feitos, total, animar) {
                const novos = ligarPecas(abrigos, quantas(feitos, total, abrigos.length),
                    (abrigo, ligado) => abrigo.g.setAttribute("opacity", ligado ? "1" : "0"));
                if (animar) novos.forEach((abrigo, i) => pop(abrigo.g, 1400 + i * 200));
                irPara(total ? feitos / total : 0, animar);
            },
            comemorar() {
                if (reduzir) return;
                sol.animate([{ transform: "translateY(60px)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }],
                    { duration: 3000, easing: "ease-out" });
                aurora.animate([{ opacity: .6 }, { opacity: 1 }, { opacity: 1 }], { duration: 3000 });
            }
        };
    },

    /* Ao vivo: estrelas cadentes enquanto é madrugada e as lanternas de cabeça
       cintilando trilha acima (até onde o progresso chegou). */
    vivo(container, progresso) {
        const svg = camadaViva(container);
        const cintilar = () => {
            if (SEM_MOVIMENTO) return () => {};
            const grupo = el("g", {}, svg);
            const comprimento = TRILHA.slice(1).reduce((t, p, i) => t + Math.hypot(p[0] - TRILHA[i][0], p[1] - TRILHA[i][1]), 0);
            const luzes = [];
            for (let d = 0; d <= comprimento; d += 9) {
                const [x, y] = pontoNaLinha(TRILHA, d / comprimento);
                const luz = el("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: 2.2, fill: "#fff6d6", opacity: 0 }, grupo);
                luzes.push({ luz, fracao: d / comprimento, anima: null });
            }
            const atualizar = () => {
                const { fracao } = progresso();
                luzes.forEach((l) => {
                    const acesa = l.fracao <= fracao && fracao < 0.95;
                    if (acesa && !l.anima) {
                        l.anima = l.luz.animate([{ opacity: 0 }, { opacity: .95 }, { opacity: .1 }, { opacity: .8 }, { opacity: 0 }],
                            { duration: 1800 + Math.random() * 2400, iterations: Infinity, delay: -Math.random() * 3000 });
                    } else if (!acesa && l.anima) {
                        l.anima.cancel();
                        l.anima = null;
                    }
                });
            };
            atualizar();
            const relogio = setInterval(atualizar, 2000);
            return () => { clearInterval(relogio); luzes.forEach((l) => l.anima?.cancel()); };
        };
        return juntar(cadentes(svg, { quando: () => progresso().fracao < 0.7, regiao: [200, 30, 1200, 260] }), cintilar(), () => svg.remove());
    }
};
