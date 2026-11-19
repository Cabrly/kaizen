/* =========================================================
   TRILHA — as sessões do plano como fases de um jogo
   ---------------------------------------------------------
   Lê as mesmas sessões do calendário (/calendario) e desenha
   um caminho em zigue-zague. As fases são livres: clicar abre
   a sessão no dia dela, só avisa se há fases anteriores
   por fazer ("recomendado").
========================================================= */


import { desenharPet } from "./pets-arte.js?v=3";


const secao = document.querySelector("#est-trilha");

const API = "./api/estudos";

const CHAVE_PLANO = "kaizen.trilha.plano.v1";

const estado = { planos: [], planoId: null, fases: [], sel: null, detalhe: null, pets: [] };

const TIPOS = { video: "Vídeo", doc: "Documentação", atividade: "Atividade" };


function duracao(min) {
    return min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, "0") : ""}` : `${min} min`;
}


function esc(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function lembrado() {
    try { return Number(localStorage.getItem(CHAVE_PLANO)) || null; } catch (e) { return null; }
}

function lembrar(id) {
    try { localStorage.setItem(CHAVE_PLANO, String(id)); } catch (e) { /* aba privada */ }
}

function diaCurto(iso) {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
}

function hojeIso() {
    const h = new Date();
    return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
}


async function pegar(caminho) {
    const r = await fetch(API + caminho);
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
}


async function carregar(planos) {

    estado.planos = planos.filter((p) => p.status === "pronto" && p.primeira_data);

    if (estado.planos.length === 0) {
        secao.hidden = true;
        return;
    }

    if (!estado.planos.some((p) => p.id === estado.planoId)) {
        const salvo = lembrado();
        estado.planoId = estado.planos.some((p) => p.id === salvo) ? salvo : estado.planos[0].id;
    }

    const plano = estado.planos.find((p) => p.id === estado.planoId);

    try {
        // um dia de folga de cada lado: o intervalo do calendário inclui as duas pontas
        const { sessoes } = await pegar(`/calendario?inicio=${plano.primeira_data}&fim=${plano.ultima_data}`);
        estado.fases = sessoes
            .filter((s) => s.plano_id === plano.id && !s.extra)
            .sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id);
    } catch (erro) {
        estado.fases = [];
    }

    const atual = estado.fases.findIndex((f) => situacao(f) !== "feita");
    if (estado.sel === null || !estado.fases[estado.sel] || estado.selPlano !== plano.id) {
        estado.sel = atual === -1 ? 0 : atual;
        estado.selPlano = plano.id;
    }

    secao.hidden = false;
    desenhar();
    carregarDetalhe();

}


async function carregarDetalhe() {

    const fase = estado.fases[estado.sel];
    if (!fase) return;

    try {
        const { sessao } = await pegar(`/sessoes/${fase.id}`);
        if (estado.fases[estado.sel]?.id === fase.id) {
            estado.detalhe = sessao;
            const alvo = secao.querySelector("#trilha-heroi");
            if (alvo) alvo.innerHTML = heroi();
        }
    } catch (erro) { /* fica só com o título */ }

}


function heroi() {

    const i = estado.sel;
    const fase = estado.fases[i];
    if (!fase) return "";

    const d = estado.detalhe && estado.detalhe.id === fase.id ? estado.detalhe : null;
    const faltando = estado.fases.slice(0, i).map((f, j) => ({ f, j })).filter(({ f }) => situacao(f) !== "feita");
    const feita = situacao(fase) === "feita";
    const total = d ? d.itens.reduce((s, it) => s + (it.minutos || 0), 0) : 0;

    return `
        <span class="trilha-etapa">Fase ${i + 1} de ${estado.fases.length} · sessão de ${diaCurto(fase.data)}</span>
        <h3>${esc(fase.topico)}</h3>
        ${d?.objetivo ? `<p class="trilha-objetivo">${esc(d.objetivo)}</p>` : ""}
        ${faltando.length && !feita ? `<p class="trilha-aviso">💡 Recomendo fazer antes a fase ${faltando[0].j + 1} (${esc(faltando[0].f.topico)}). Você pode começar mesmo assim.
            <button type="button" data-fase-ir="${faltando[0].j}">Ver fase ${faltando[0].j + 1}</button></p>` : ""}
        ${d ? `<details class="trilha-detalhes" ${window.matchMedia("(min-width: 1000px)").matches ? "open" : ""}>
            <summary>Ver o que tem nesta fase (${d.itens.length} itens${total ? ` · ${duracao(total)}` : ""})</summary>
            <ul class="trilha-itens">${d.itens.map((it) => `
                <li class="${it.estado}"><small>${TIPOS[it.tipo] || it.tipo}</small><span>${esc(it.titulo)}</span></li>`).join("")}</ul>
        </details>` : ""}
        <button type="button" class="btn-primario" data-fase-abrir="${i}">${feita ? "Rever fase" : fase.feitos ? "Continuar fase" : "Começar fase"}</button>`;

}


function situacao(fase) {
    if (fase.total > 0 && fase.feitos >= fase.total) return "feita";
    if (fase.feitos > 0 || fase.nao_feitos > 0) return "andamento";
    return "nova";
}



function escolhaPlanos(atual) {

    const cartoes = estado.planos.map((p) => {

        const total = p.total_itens || 0;
        const pct = total ? Math.round((100 * p.itens_feitos) / total) : 0;
        const bicho = estado.pets.find((b) => b.planos.some((pl) => pl.id === p.id));
        const avatar = bicho
            ? desenharPet(bicho, bicho.humor, { titulo: bicho.nome || "Bichinho" })
            : `<span class="trilha-avatar-letra">${esc((p.titulo || p.tema).trim().charAt(0).toUpperCase())}</span>`;
        const escolhido = p.id === atual.id;

        return `
            <button type="button" class="trilha-cartao ${escolhido ? "escolhido" : ""}" data-plano-id="${p.id}"
                    style="--cor:${esc(p.cor)}" aria-pressed="${escolhido}" ${estado.planos.length === 1 ? "disabled" : ""}>
                <span class="trilha-avatar">${avatar}</span>
                <span class="trilha-cartao-texto">
                    <strong>${esc(p.titulo || p.tema)}</strong>
                    <small>${pct === 0 ? "Pronto pra começar" : pct === 100 ? "Concluída" : `${pct}% feito`}</small>
                    <span class="trilha-mini"><i style="width:${pct}%"></i></span>
                </span>
            </button>`;

    }).join("");

    return `<div class="trilha-escolha" role="group" aria-label="Escolha a jornada">${cartoes}</div>`;

}


/* =========================================================
   FLORESTA DA JORNADA
   Céu com estrelas e lua, colinas, névoa, três fileiras de árvores,
   chão com mato e cogumelos, corujinha, vagalumes. Cada fase concluída
   acende uma fogueira (faíscas, fumaça, e barraca nas fases de chefe),
   que ilumina árvores, mato e pedras em volta. Ao terminar, amanhece.
========================================================= */

function floresta({ horizontal, LARG, alt, fogos, novosFogos, prog }) {

    const aleat = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
    const mix = (a, b, t) => a.map((v, k) => Math.round(v + (b[k] - v) * t));
    const rgb = (c) => `rgb(${c.join(",")})`;

    // quanto de luz de fogueira chega num ponto (0 a 1)
    const luzEm = (x, y) => fogos.reduce((m, g) => Math.max(m, 1 - Math.hypot(g.x - x, g.by - y) / 190), 0);

    // céu: amanhece um pouquinho a cada fase concluída
    const topo = mix([6, 16, 26], [24, 34, 56], prog).join(",");
    const base = mix([13, 36, 30], [92, 62, 40], prog).join(",");
    const ceu = `background-color: rgb(${base}); background-image: linear-gradient(180deg, rgb(${topo}) 0%, rgb(${base}) 100%);`;

    const defs = `<defs>
        <radialGradient id="luzfogo"><stop offset="0" stop-color="#ffb347" stop-opacity="${horizontal ? ".6" : ".26"}"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
        <radialGradient id="luzlua"><stop offset="0" stop-color="#cfe6ff" stop-opacity=".45"/><stop offset="1" stop-color="#cfe6ff" stop-opacity="0"/></radialGradient>
        <radialGradient id="luzsol"><stop offset="0" stop-color="#ffd27a" stop-opacity=".85"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
        <radialGradient id="luzcogu"><stop offset="0" stop-color="#7be0c8" stop-opacity=".7"/><stop offset="1" stop-color="#7be0c8" stop-opacity="0"/></radialGradient>
    </defs>`;

    const pinheiro = (x, yb, h, w, cor) => {
        const p = `M${x},${yb - h} L${x + w * .28},${yb - h * .62} L${x + w * .16},${yb - h * .62} L${x + w * .4},${yb - h * .3} L${x + w * .22},${yb - h * .3} L${x + w * .5},${yb - 8} L${x - w * .5},${yb - 8} L${x - w * .22},${yb - h * .3} L${x - w * .4},${yb - h * .3} L${x - w * .16},${yb - h * .62} L${x - w * .28},${yb - h * .62} Z`;
        return `<rect x="${x - 2.5}" y="${yb - 12}" width="5" height="12" fill="#1b130e"/><path d="${p}" fill="${cor}"/>`;
    };
    const frondosa = (x, yb, h, w, cor) => {
        const r = w * .3;
        return `<rect x="${x - 3}" y="${yb - h * .5}" width="6" height="${h * .5}" fill="#1b130e"/>
            <circle cx="${x}" cy="${yb - h * .72}" r="${r * 1.25}" fill="${cor}"/>
            <circle cx="${x - r * .9}" cy="${yb - h * .58}" r="${r}" fill="${cor}"/>
            <circle cx="${x + r * .9}" cy="${yb - h * .58}" r="${r}" fill="${cor}"/>`;
    };

    let ceuSvg = "", colinas = "", nevoa = "", arvoresFundo = "", arvoresMeio = "", arvoresPerto = "", chao = "", olhos = "", brilhos = "";

    // ---- estrelas
    const nEstrelas = horizontal ? Math.round(LARG / 28) : 22;
    for (let k = 0; k < nEstrelas; k++) {
        const x = Math.round(aleat(k + 40) * LARG), y = Math.round(aleat(k + 80) * alt * (horizontal ? .42 : .3));
        ceuSvg += `<circle class="${k % 4 === 0 ? "estrela-pisca" : ""}" style="animation-delay:${(aleat(k) * 4).toFixed(1)}s" cx="${x}" cy="${y}" r="${aleat(k + 5) > .75 ? 1.7 : 1}" fill="#fff" opacity="${(.25 + aleat(k + 7) * .45).toFixed(2)}"/>`;
    }

    // ---- lua (some aos poucos) e sol (aparece no fim)
    const luaX = horizontal ? 170 : 64, luaY = horizontal ? 46 : 44;
    ceuSvg += `<g opacity="${(1 - prog * .75).toFixed(2)}">
        <circle cx="${luaX}" cy="${luaY}" r="64" fill="url(#luzlua)"/>
        <circle cx="${luaX}" cy="${luaY}" r="22" fill="#e9f1fb"/>
        <circle cx="${luaX - 7}" cy="${luaY - 5}" r="4.5" fill="#cddaea"/><circle cx="${luaX + 8}" cy="${luaY + 6}" r="3.2" fill="#cddaea"/><circle cx="${luaX + 4}" cy="${luaY - 10}" r="2.2" fill="#cddaea"/>
    </g>`;
    if (prog > .85) {
        const o = Math.min(1, (prog - .85) / .15).toFixed(2);
        const sx = horizontal ? LARG - 150 : LARG / 2, sy = horizontal ? alt - 92 : 80;
        ceuSvg += `<g opacity="${o}"><circle cx="${sx}" cy="${sy}" r="110" fill="url(#luzsol)"/><circle cx="${sx}" cy="${sy}" r="30" fill="#ffd27a"/></g>`;
    }

    // ---- colinas distantes (só na horizontal)
    if (horizontal) {
        const colina = (yb, amp, passo, cor, fase) => {
            let d = `M0,${alt} L0,${yb}`;
            for (let x = 0; x <= LARG + passo; x += passo) d += ` L${x},${(yb - Math.sin(x / 110 + fase) * amp - Math.sin(x / 41 + fase * 2) * amp * .35).toFixed(1)}`;
            return `<path d="${d} L${LARG},${alt} Z" fill="${cor}"/>`;
        };
        colinas = colina(alt - 112, 16, 22, "rgb(15,40,48)", 1) + colina(alt - 78, 12, 20, "rgb(11,30,34)", 4);
    }

    // ---- névoa (bandas bem suaves que vão e vêm)
    const nNevoa = horizontal ? Math.round(LARG / 330) + 1 : 4;
    for (let k = 0; k < nNevoa; k++) {
        const x = horizontal ? 80 + k * 330 + aleat(k) * 90 : LARG * (.25 + aleat(k) * .5);
        const y = horizontal ? alt - 60 - aleat(k + 2) * 30 : 70 + k * (alt / nNevoa);
        nevoa += `<ellipse class="nevoa" style="animation-delay:${(-aleat(k + 9) * 12).toFixed(1)}s" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${150 + aleat(k + 4) * 60}" ry="${13 + aleat(k + 5) * 6}" fill="#cfe8e4" opacity=".075"/>`;
    }

    // ---- árvores: fundo (azuladas e pequenas), meio e perto (escuras e grandes)
    const arvore = (a, camada) => {
        const luz = luzEm(a.x, a.yb - a.h * .4);
        const claras = camada === "fundo" ? [[10, 26, 32], [26, 62, 58]] : camada === "meio" ? [[12, 28, 26], [56, 116, 78]] : [[7, 17, 16], [44, 98, 66]];
        const cor = rgb(mix(claras[0], claras[1], luz));
        return a.tipo === "f" ? frondosa(a.x, a.yb, a.h, a.w, cor) : pinheiro(a.x, a.yb, a.h, a.w, cor);
    };

    if (horizontal) {
        for (let x = 4; x < LARG; x += 30) arvoresFundo += arvore({ x: x + aleat(x + 1) * 16, yb: alt - 70, h: 34 + aleat(x + 2) * 28, w: 22, tipo: "p" }, "fundo");
        for (let x = 10; x < LARG; x += 40) {
            const tipo = aleat(x + 3) > .72 ? "f" : "p";
            arvoresMeio += arvore({ x: x + aleat(x + 4) * 22, yb: alt - 22, h: 56 + aleat(x + 5) * 44, w: 34 + aleat(x + 6) * 10, tipo }, "meio");
        }
        for (let x = 6; x < LARG; x += 52) arvoresPerto += arvore({ x: x + aleat(x + 7) * 26, yb: alt + 8, h: 74 + aleat(x + 8) * 40, w: 40 + aleat(x + 9) * 14, tipo: aleat(x + 10) > .8 ? "f" : "p" }, "perto");
    } else {
        for (let y = 10; y < alt; y += 36) {
            for (const lado of [0, 1]) {
                const x = lado ? LARG - 16 - aleat(y + 5 + lado) * 30 : 16 + aleat(y + lado) * 30;
                const perto = aleat(y + lado + 20) > .5;
                arvoresMeio += arvore({ x, yb: y + 40, h: (perto ? 70 : 52) + aleat(y + 6 + lado) * 40, w: perto ? 40 : 30, tipo: aleat(y + lado + 30) > .75 ? "f" : "p" }, perto ? "perto" : "meio");
            }
        }
    }

    // ---- chão com mato, pedras e cogumelos que brilham (horizontal)
    if (horizontal) {
        let d = `M0,${alt} L0,${alt - 12}`;
        for (let x = 0; x <= LARG + 20; x += 20) d += ` L${x},${(alt - 12 - Math.sin(x / 47) * 3).toFixed(1)}`;
        chao += `<path d="${d} L${LARG},${alt} Z" fill="rgb(7,17,14)"/>`;
        for (let x = 8; x < LARG; x += 26) {
            const y = alt - 11 + aleat(x) * 4, h = 8 + aleat(x + 1) * 9;
            const cor = rgb(mix([14, 44, 30], [74, 128, 70], luzEm(x, y)));
            chao += `<path d="M${x - 5},${y} Q${x - 4},${y - h * .7} ${x - 7},${y - h} Q${x - 1},${y - h * .6} ${x},${y - h * 1.15} Q${x + 1},${y - h * .6} ${x + 6},${y - h * .9} Q${x + 3},${y - h * .5} ${x + 5},${y} Z" fill="${cor}"/>`;
        }
        for (let k = 0; k < Math.round(LARG / 230); k++) {
            const x = 60 + k * 230 + aleat(k + 3) * 120, y = alt - 9;
            if (fogos.some((g) => Math.abs(g.x - x) < 40)) continue;
            chao += `<circle cx="${x.toFixed(0)}" cy="${y - 4}" r="14" fill="url(#luzcogu)" class="cogu-brilho" style="animation-delay:${(aleat(k) * 3).toFixed(1)}s"/>
                <rect x="${(x - 1.2).toFixed(1)}" y="${y - 4}" width="2.4" height="5" fill="#cfe9df"/>
                <path d="M${(x - 5).toFixed(1)},${y - 4} Q${x.toFixed(1)},${y - 12} ${(x + 5).toFixed(1)},${y - 4} Z" fill="#7be0c8"/>`;
        }
        for (let k = 0; k < Math.round(LARG / 150); k++) {
            const x = 30 + k * 150 + aleat(k + 12) * 90, y = alt - 8;
            chao += `<ellipse cx="${x.toFixed(0)}" cy="${y}" rx="${7 + aleat(k) * 6}" ry="${4 + aleat(k + 1) * 3}" fill="${rgb(mix([22, 30, 34], [96, 84, 70], luzEm(x, y)))}"/>`;
        }
    }

    // ---- corujinha espiando numa árvore (olhos que piscam)
    {
        const ox = horizontal ? 330 : 40, oy = horizontal ? alt - 62 : 150;
        olhos = `<g class="olhos"><circle cx="${ox}" cy="${oy}" r="2.6" fill="#ffe08a"/><circle cx="${ox + 9}" cy="${oy}" r="2.6" fill="#ffe08a"/></g>`;
    }

    // ---- brilho de cada fogueira (por cima das árvores)
    brilhos = fogos.map((g) => `<circle class="brilho-fogo" cx="${g.x}" cy="${g.by - 16}" r="${horizontal ? 120 : 76}" fill="url(#luzfogo)"/>`).join("");

    // ---- vagalumes: alguns frios pela floresta toda, mais quentes perto das fogueiras
    let vagalumes = "";
    const nFrios = horizontal ? Math.round(LARG / 160) : 6;
    for (let k = 0; k < nFrios; k++) {
        vagalumes += `<circle class="vagalume" style="animation-delay:${(aleat(k * 5) * 5).toFixed(1)}s" cx="${Math.round(aleat(k + 60) * LARG)}" cy="${Math.round(alt * (.3 + aleat(k + 90) * .55))}" r="1.8" fill="#bdf7e8"/>`;
    }
    fogos.forEach((g, k) => {
        for (let n = 0; n < 3; n++) {
            vagalumes += `<circle class="vagalume" style="animation-delay:${(aleat(k * 3 + n) * 3).toFixed(1)}s" cx="${Math.round(g.x + (aleat(k + n * 7) - .5) * 170)}" cy="${Math.round(g.by - 20 - aleat(k + n * 11) * 70)}" r="2" fill="#ffe9a8"/>`;
        }
    });

    // ---- fogueiras (faíscas, fumaça, pedras em volta, barraca nas fases de chefe)
    const fogueiras = fogos.map((g) => {
        const novo = novosFogos.some((n) => n.id === g.id);
        const faiscas = [0, 1, 2, 3].map((n) =>
            `<circle class="faisca" style="animation-delay:${(-n * .55).toFixed(2)}s; --dx:${(n % 2 ? 9 : -9) + n * 2}px" cx="${(n - 1.5) * 4}" cy="-26" r="1.5" fill="#ffd166"/>`).join("");
        const fumaca = [0, 1].map((n) =>
            `<ellipse class="fumaca" style="animation-delay:${(-n * 2.2).toFixed(1)}s" cx="${n ? 5 : -4}" cy="-42" rx="6" ry="4" fill="#9aa3a0"/>`).join("");
        const pedras = [-19, -11, 11, 19].map((px, n) =>
            `<ellipse cx="${px}" cy="${n % 2 ? 5 : 3}" rx="5" ry="3.4" fill="#4b4540"/><ellipse cx="${px}" cy="${(n % 2 ? 5 : 3) - 1.2}" rx="4" ry="2" fill="#6a625a"/>`).join("");
        const barraca = g.chefe
            ? `<g transform="translate(${horizontal ? 46 : (g.x < LARG / 2 ? -46 : 46)},6)">
                    <path d="M-22,0 L0,-34 L22,0 Z" fill="#7a3f33"/><path d="M0,-34 L22,0 L6,0 Z" fill="#5d2f27"/><path d="M-7,0 L0,-15 L7,0 Z" fill="#1a0f0c"/>
               </g>` : "";
        return `<g class="fogueira ${novo ? "acendendo" : ""}" transform="translate(${g.x},${g.by})">
            ${barraca}${pedras}${fumaca}
            <ellipse cx="0" cy="3" rx="17" ry="5" fill="#120d0a"/>
            <rect x="-15" y="-3" width="30" height="6" rx="3" fill="#6b4426" transform="rotate(-13)"/>
            <rect x="-15" y="-3" width="30" height="6" rx="3" fill="#7d5230" transform="rotate(13)"/>
            <path class="chama" d="M0,-6 C-11,-13 -10,-27 0,-40 C10,-27 11,-13 0,-6Z" fill="#ff8a1f"/>
            <path class="chama chama2" d="M0,-6 C-6,-12 -5,-22 0,-30 C5,-22 6,-12 0,-6Z" fill="#ffd166"/>
            ${faiscas}
        </g>`;
    }).join("");

    // parallax só no céu e nas colinas (as árvores precisam bater com a luz das fogueiras)
    const atras = `
        <g class="par par-ceu">${ceuSvg}</g>
        <g class="par par-colinas">${colinas}</g>
        <g class="par par-nevoa">${nevoa}</g>
        ${arvoresFundo}${arvoresMeio}${arvoresPerto}${chao}${brilhos}`;

    return { defs, atras, frente: `${olhos}${vagalumes}${fogueiras}`, ceu };
}


function desenhar() {

    const plano = estado.planos.find((p) => p.id === estado.planoId);
    const fases = estado.fases;

    const feitas = fases.filter((f) => situacao(f) === "feita").length;
    const atualIdx = fases.findIndex((f) => situacao(f) !== "feita");
    const hoje = hojeIso();

    // vertical no celular, horizontal no computador (mais espaço)
    const horizontal = window.matchMedia("(min-width: 1000px)").matches;

    let LARG, alt, pos;

    if (horizontal) {
        const PASSO = 175, X0 = 120, Y = [150, 118, 96, 118, 150, 182, 204, 182];
        pos = fases.map((_, i) => ({ x: X0 + i * PASSO, y: Y[i % 8] }));
        LARG = X0 + Math.max(fases.length - 1, 0) * PASSO + 120;
        alt = 310;
    } else {
        const PASSO = 70, TOPO = 58, X = [250, 320, 350, 320, 250, 180, 150, 180];
        pos = fases.map((_, i) => ({ x: X[i % 8], y: TOPO + i * PASSO }));
        LARG = 480;
        alt = TOPO + Math.max(fases.length - 1, 0) * PASSO + 40;
    }

    const trecho = (a, p) => horizontal
        ? `C${(a.x + p.x) / 2},${a.y} ${(a.x + p.x) / 2},${p.y} ${p.x},${p.y}`
        : `C${a.x},${(a.y + p.y) / 2} ${p.x},${(a.y + p.y) / 2} ${p.x},${p.y}`;

    const caminho = pos.map((p, i) => i === 0 ? `M${p.x},${p.y}` : trecho(pos[i - 1], p)).join(" ");

    // trecho já percorrido
    const caminhoFeito = atualIdx === -1 ? caminho
        : pos.slice(0, atualIdx + 1).map((p, i) => i === 0 ? `M${p.x},${p.y}` : trecho(pos[i - 1], p)).join(" ");

    // nome da fase em até 2 linhas (no modo horizontal o texto fica embaixo da pedra)
    const linhas = (texto, max) => {
        const palavras = texto.split(" ");
        const saida = [""];
        palavras.forEach((w) => {
            const ult = saida.length - 1;
            if ((saida[ult] + " " + w).trim().length <= max || !saida[ult]) saida[ult] = (saida[ult] + " " + w).trim();
            else saida.push(w);
        });
        if (saida.length > 2) { saida.length = 2; saida[1] = saida[1].slice(0, max - 1) + "…"; }
        return saida;
    };

    // o pet fica na fase onde a pessoa parou (a primeira por fazer; no fim, a última)
    const petIdx = atualIdx === -1 ? fases.length - 1 : atualIdx;
    const petDe = estado.pets.find((p) => p.planos.some((pl) => pl.id === plano.id)) || null;


    // ---------- floresta: escura no começo, uma fogueira acesa por fase concluída ----------
    const fogos = fases.map((f, i) => ({ f, i })).filter(({ f }) => situacao(f) === "feita").map(({ f, i }) => {
        const { x, y } = pos[i];
        const r = (i + 1) % 5 === 0 ? 26 : 21;
        const lado = x > 300 ? "esq" : "dir";
        return horizontal
            ? { id: f.id, x, by: y - r - 8, chefe: (i + 1) % 5 === 0 }
            : { id: f.id, x: lado === "dir" ? x - r - 32 : x + r + 32, by: y + 16, chefe: (i + 1) % 5 === 0 };
    });

    // a primeira vez que o plano aparece, as fogueiras já estão acesas; só as novas "acendem" com animação
    if (estado.fogosDe !== plano.id) {
        estado.fogosDe = plano.id;
        estado.fogosVistos = new Set(fogos.map((g) => g.id));
    }
    const novosFogos = fogos.filter((g) => !estado.fogosVistos.has(g.id));
    estado.fogosVistos = new Set(fogos.map((g) => g.id));

    const prog = fases.length ? feitas / fases.length : 0;
    const cena = floresta({ horizontal, LARG, alt, fogos, novosFogos, prog });
    const { ceu } = cena;

    const nos = fases.map((f, i) => {

        const s = situacao(f);
        const chefe = (i + 1) % 5 === 0;
        const atual = i === atualIdx;
        const r = chefe ? 26 : 21;
        const { x, y } = pos[i];
        const icone = s === "feita" ? "★" : chefe ? "🏆" : String(i + 1);
        const lado = x > 300 ? "esq" : "dir";
        const tx = horizontal ? x : (lado === "dir" ? x + r + 12 : x - r - 12);
        const ancora = horizontal ? "middle" : (lado === "dir" ? "start" : "end");
        const maxV = lado === "dir" ? Math.max(14, Math.floor((LARG - tx - 8) / 8.8)) : 36;
        const nome = horizontal ? linhas(f.topico, 17) : linhas(f.topico, maxV);
        const yNome = horizontal ? y + r + 26 : y - 6 - (nome.length - 1) * 9;
        const yData = yNome + nome.length * 18;
        const atrasada = s !== "feita" && f.data < hoje;

        const bicho = i === petIdx && petDe
            ? `<foreignObject class="trilha-pet" x="${horizontal ? x - r - 86 : (lado === "dir" ? x - r - 84 : x + r + 6)}" y="${y - 54}" width="78" height="78">
                   <div xmlns="http://www.w3.org/1999/xhtml" class="trilha-pet-pula">${desenharPet(petDe, petDe.humor, { titulo: `${petDe.nome || "Seu bichinho"} está aqui` })}</div>
               </foreignObject>` : "";

        return `
            <g class="trilha-no ${s} ${atual ? "atual" : ""} ${i === estado.sel ? "escolhida" : ""} ${chefe ? "chefe" : ""}"
               data-fase="${i}" tabindex="0" role="button"
               aria-label="Fase ${i + 1}: ${esc(f.topico)}, ${f.feitos} de ${f.total} feitos">
                ${bicho}
                ${atual ? `<circle class="pulso" cx="${x}" cy="${y}" r="${r + 6}"/>` : ""}
                <circle class="base" cx="${x}" cy="${y + 7}" r="${r}"/>
                <circle class="disco" cx="${x}" cy="${y}" r="${r}"/>
                ${atual ? `<g class="balao"><rect x="${x - 38}" y="${y - r - 40}" width="76" height="28" rx="10"/><path d="M${x - 7},${y - r - 12} l7,8 l7,-8z"/><text x="${x}" y="${y - r - 26}" text-anchor="middle" dominant-baseline="central">Começar</text></g>` : ""}
                <text class="num" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central">${icone}</text>
                <text class="rotulo" x="${tx}" y="${yNome}" text-anchor="${ancora}">${nome.map((l, k) => `<tspan x="${tx}" dy="${k ? 18 : 0}">${esc(l)}</tspan>`).join("")}</text>
                <text class="data ${atrasada ? "atrasada" : ""}" x="${tx}" y="${yData}" text-anchor="${ancora}">${diaCurto(f.data)}${f.total ? ` · ${f.feitos}/${f.total}` : ""}${atrasada ? " · atrasada" : ""}</text>
            </g>`;

    }).join("");

    secao.innerHTML = `
        <header class="trilha-topo">
            <div>
                <h3>Trilha</h3>
                <p>${feitas} de ${fases.length} fases${atualIdx >= 0 ? ` · você está na fase ${atualIdx + 1}` : " · trilha completa 🎉"}</p>
            </div>
            ${escolhaPlanos(plano)}
        </header>
        <div class="trilha-barra"><div style="width:${fases.length ? Math.round(100 * feitas / fases.length) : 0}%"></div></div>
        <div class="trilha-heroi" id="trilha-heroi">${heroi()}</div>
        <div class="trilha-rolagem floresta ${horizontal ? "horizontal" : ""}" style="--cor:${esc(plano.cor)}; ${ceu}">
            <svg viewBox="0 0 ${LARG} ${alt}" ${horizontal ? `style="width:${LARG}px;height:${alt}px"` : ""} role="group" aria-label="Mapa das fases">
                ${cena.defs}
                <g aria-hidden="true">${cena.atras}</g>
                <path class="trilha-fio" d="${caminho}"/>
                <path class="trilha-fio feito" d="${caminhoFeito}"/>
                <g aria-hidden="true">${cena.frente}</g>
                ${nos}
            </svg>
        </div>`;

    // deixa a fase atual à vista
    const caixa = secao.querySelector(".trilha-rolagem");
    const alvoIdx = atualIdx === -1 ? fases.length - 1 : atualIdx;
    if (horizontal) {
        caixa.scrollLeft = Math.max(0, pos[alvoIdx].x - caixa.clientWidth / 2);
        caixa.style.setProperty("--sx", caixa.scrollLeft + "px");
        let quadro = 0;
        caixa.addEventListener("scroll", () => {
            if (quadro) return;
            quadro = requestAnimationFrame(() => { quadro = 0; caixa.style.setProperty("--sx", caixa.scrollLeft + "px"); });
        }, { passive: true });
    } else if (atualIdx > 3) {
        caixa.scrollTop = Math.max(0, (pos[atualIdx].y - 120) * (caixa.scrollHeight / alt));
    }

}


function escolher(i) {
    if (!estado.fases[i]) return;
    estado.sel = i;
    estado.detalhe = null;
    desenhar();
    carregarDetalhe();
}


function abrirFase(i) {
    const fase = estado.fases[i];
    if (fase) document.dispatchEvent(new CustomEvent("kaizen:abrir-sessao", { detail: { sessaoId: fase.id, data: fase.data } }));
}


secao.addEventListener("click", (e) => {

    const ir = e.target.closest("[data-fase-ir]");
    if (ir) return escolher(Number(ir.dataset.faseIr));

    const abrir = e.target.closest("[data-fase-abrir]");
    if (abrir) return abrirFase(Number(abrir.dataset.faseAbrir));

    const no = e.target.closest("[data-fase]");
    if (no) escolher(Number(no.dataset.fase));

});

secao.addEventListener("keydown", (e) => {
    const no = e.target.closest?.("[data-fase]");
    if (no && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        escolher(Number(no.dataset.fase));
    }
});

secao.addEventListener("click", (e) => {
    const cartao = e.target.closest("[data-plano-id]");
    if (!cartao) return;
    estado.planoId = Number(cartao.dataset.planoId);
    estado.sel = null;
    estado.detalhe = null;
    lembrar(estado.planoId);
    carregar(estado.planos);
});

document.addEventListener("kaizen:pets", (e) => {
    estado.pets = e.detail.pets || [];
    if (estado.fases.length && !secao.hidden) desenhar();
});

// o estudos.js avisa a cada recarga dos planos (inclusive depois de marcar ✓)
document.addEventListener("kaizen:planos", (e) => carregar(e.detail.planos));


// trocou entre computador e celular (ou girou a tela): refaz o mapa na direção certa
window.matchMedia("(min-width: 1000px)").addEventListener("change", () => {
    if (estado.fases.length && !secao.hidden) desenhar();
});

// menu "Mais": fecha ao escolher uma opção ou clicar fora
document.addEventListener("click", (e) => {
    const mais = document.querySelector("#est-mais");
    if (!mais || !mais.open) return;
    if (!mais.contains(e.target) || e.target.closest(".est-mais-menu button")) mais.open = false;
});
