/* =========================================================
   FUNDO — tinta vermelha que acompanha o progresso
   ---------------------------------------------------------
   Dois modos, escolhidos pela pessoa (e lembrados):

     • "barra"    — a tinta enche de cima para baixo,
                    com tendões e gotas escorrendo;
     • "respingo" — respingos/manchas que se acumulam
                    espalhados pela tela.

   Em ambos: quanto maior a porcentagem de tarefas
   concluídas, mais vermelho o fundo, até cobrir tudo em
   100%; cada avanço dá um mini tremor na tela.

   Quando o fundo escurece, a página avisa (classe
   .sobre-escuro no body) para os textos clarearem e não
   ficarem apagados.

   Canvas de fundo (z-index -1). JS puro, sem bibliotecas.
========================================================= */


/* ---------- estado do módulo ---------- */

let canvas = null;
let ctx = null;

let largura = 0;
let altura = 0;
let dpr = 1;

let alvo = 0;      // nível desejado (0..1), vem do progresso
let nivel = 0;     // nível atual, persegue o alvo suavemente

let modo = "respingo";   // "barra" | "respingo"

/* dados do modo respingo */
let marcas = [];
let spray = [];

/* dados do modo barra */
let pingos = [];
let gotas = [];

let reduzir = false;
let iniciado = false;
let corpoTremendo = false;
let escuroAtual = false;
let forteAtual = false;


const CHAVE_MODO = "kaizen.fundo.modo";


/* ---------- cores ---------- */

const CLARO = [247, 247, 245];    // #f7f7f5 (fundo original)
const TINTA = [193, 0, 20];       // vermelho da tinta
const TINTA_FUNDA = [138, 0, 15]; // vermelho mais escuro


function mistura(a, b, t) {
    return [
        Math.round(a[0] + (b[0] - a[0]) * t),
        Math.round(a[1] + (b[1] - a[1]) * t),
        Math.round(a[2] + (b[2] - a[2]) * t)
    ];
}

function rgb(cor, alpha = 1) {
    return `rgba(${cor[0]}, ${cor[1]}, ${cor[2]}, ${alpha})`;
}

function aleatorio(min, max) {
    return min + Math.random() * (max - min);
}

function luminancia(cor) {
    return (0.299 * cor[0] + 0.587 * cor[1] + 0.114 * cor[2]) / 255;
}

/* Overshoot: dá o estalo de splat ao aparecer. */
function saidaEstalo(t) {
    const c = 1.70158;
    const p = t - 1;
    return 1 + (c + 1) * p * p * p + c * p * p;
}


/* =========================================================
   INÍCIO
========================================================= */

export function iniciarFundo() {

    if (iniciado) {
        return;
    }

    iniciado = true;

    reduzir =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;


    /* Recupera o modo salvo. */
    try {
        const salvo = localStorage.getItem(CHAVE_MODO);
        if (salvo === "barra" || salvo === "respingo") {
            modo = salvo;
        }
    } catch (erro) {
        /* ignora */
    }


    canvas = document.createElement("canvas");
    canvas.id = "fundo-tinta";

    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "-1";

    document.body.prepend(canvas);

    ctx = canvas.getContext("2d");


    criarSeletor();

    redimensionar();

    window.addEventListener("resize", redimensionar);

    requestAnimationFrame(loop);
}


function redimensionar() {

    dpr = window.devicePixelRatio || 1;

    largura = window.innerWidth;
    altura = window.innerHeight;

    canvas.width = Math.floor(largura * dpr);
    canvas.height = Math.floor(altura * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    gerarMarcas();
    gerarPingos();
}


/* =========================================================
   SELETOR DE MODO (canto inferior)
========================================================= */

function criarSeletor() {

    /* O gatilho é o próprio símbolo 改善, no topo esquerdo. */
    const simbolo = document.querySelector(".logo-jp");

    if (!simbolo) {
        return;
    }

    simbolo.classList.add("fundo-trigger");
    simbolo.setAttribute("role", "button");
    simbolo.setAttribute("tabindex", "0");
    simbolo.setAttribute("aria-haspopup", "true");
    simbolo.setAttribute("aria-expanded", "false");
    simbolo.title = "Escolher o fundo do progresso";


    const menu = document.createElement("div");
    menu.className = "fundo-menu";

    menu.innerHTML = `
        <span class="fundo-menu-titulo">Fundo do progresso</span>
        <button type="button" data-modo="barra">Barra escorrendo</button>
        <button type="button" data-modo="respingo">Respingos</button>
    `;

    document.body.appendChild(menu);


    menu.querySelectorAll("button").forEach((botao) => {
        botao.addEventListener("click", () => {
            definirModo(botao.dataset.modo);
            fecharMenu();
        });
    });


    function posicionar() {
        const c = simbolo.getBoundingClientRect();
        menu.style.top = `${c.bottom + 10}px`;
        menu.style.left = `${c.left}px`;
    }

    function abrirMenu() {
        posicionar();
        menu.classList.add("aberto");
        simbolo.setAttribute("aria-expanded", "true");
        marcarBotaoAtivo();
    }

    function fecharMenu() {
        menu.classList.remove("aberto");
        simbolo.setAttribute("aria-expanded", "false");
    }

    function alternar() {
        if (menu.classList.contains("aberto")) {
            fecharMenu();
        } else {
            abrirMenu();
        }
    }


    simbolo.addEventListener("click", (evento) => {
        evento.stopPropagation();
        alternar();
    });

    simbolo.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            alternar();
        }
    });

    document.addEventListener("click", (evento) => {
        if (
            !menu.contains(evento.target) &&
            evento.target !== simbolo
        ) {
            fecharMenu();
        }
    });

    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape") {
            fecharMenu();
        }
    });

    window.addEventListener("scroll", fecharMenu, true);

    window.addEventListener("resize", () => {
        if (menu.classList.contains("aberto")) {
            posicionar();
        }
    });
}


function marcarBotaoAtivo() {

    const menu = document.querySelector(".fundo-menu");

    if (!menu) {
        return;
    }

    menu.querySelectorAll("button").forEach((botao) => {
        botao.classList.toggle(
            "ativo",
            botao.dataset.modo === modo
        );
    });
}


function definirModo(novo) {

    if (novo !== "barra" && novo !== "respingo") {
        return;
    }

    modo = novo;

    try {
        localStorage.setItem(CHAVE_MODO, modo);
    } catch (erro) {
        /* ignora */
    }

    marcarBotaoAtivo();
}


/* =========================================================
   GERAÇÃO — RESPINGOS
========================================================= */

function gerarMarcas() {

    marcas = [];

    const total = Math.round((largura * altura) / 5200);
    const quantidade = Math.max(120, Math.min(340, total));

    for (let i = 0; i < quantidade; i++) {

        const limiar =
            Math.min(0.999, (i / quantidade) + aleatorio(-0.05, 0.05));

        marcas.push(criarMarca(Math.max(0, limiar)));
    }

    marcas.sort((a, b) => a.limiar - b.limiar);
}


function criarMarca(limiar) {

    const x = Math.random() * largura;
    const y = Math.random() * altura;

    const sorte = Math.random();
    let raio;

    if (sorte < 0.5) {
        raio = aleatorio(3, 9);        // pingos
    } else if (sorte < 0.78) {
        raio = aleatorio(10, 24);      // médios
    } else if (sorte < 0.94) {
        raio = aleatorio(26, 50);      // manchas grandes
    } else {
        raio = aleatorio(52, 82);      // manchões
    }

    const escura = Math.random() < 0.35;
    const cor = escura ? TINTA_FUNDA : TINTA;
    const alpha = aleatorio(0.82, 1);


    /* Manchas maiores ganham mais lóbulos = borda mais irregular. */
    const lobulos = [];
    const nLobulos =
        raio > 26 ? 5 : (raio > 12 ? 3 : (raio > 6 ? 2 : 1));

    for (let i = 0; i < nLobulos; i++) {
        lobulos.push({
            dx: aleatorio(-raio, raio) * 0.5,
            dy: aleatorio(-raio, raio) * 0.5,
            r: raio * aleatorio(0.55, 1)
        });
    }


    const satelites = [];
    const nSat =
        raio > 26 ? 9 : (raio > 12 ? 6 : (raio > 6 ? 3 : 1));

    for (let i = 0; i < nSat; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = raio * aleatorio(1.4, 3.2);
        satelites.push({
            dx: Math.cos(ang) * dist,
            dy: Math.sin(ang) * dist,
            r: aleatorio(0.8, 2.6)
        });
    }


    let risco = null;

    if (raio > 8 && Math.random() < 0.5) {
        const ang = Math.random() * Math.PI * 2;
        const comp = raio * aleatorio(2.5, 6);
        risco = {
            ang,
            comp,
            curva: aleatorio(-0.5, 0.5),
            larg: aleatorio(1, 2.4)
        };
    }


    return {
        x, y, raio, cor, alpha,
        lobulos, satelites, risco,
        limiar,
        aparecidoEm: null
    };
}


/* =========================================================
   GERAÇÃO — BARRA (tendões)
========================================================= */

function gerarPingos() {

    pingos = [];

    const espaco = 64;
    const quantidade = Math.max(4, Math.ceil(largura / espaco));

    for (let i = 0; i < quantidade; i++) {
        pingos.push({
            x: (i + 0.5) * (largura / quantidade),
            amp: 16 + Math.random() * 46,
            larg: 7 + Math.random() * 12,
            vel: 0.6 + Math.random() * 1.1,
            fase: Math.random() * Math.PI * 2
        });
    }
}


/* =========================================================
   ATUALIZAÇÃO (chamada pelo progresso)
========================================================= */

export function atualizarFundo(porcentagem) {

    if (!iniciado) {
        return;
    }

    const novo =
        Math.max(0, Math.min(1, (porcentagem || 0) / 100));

    if (novo > alvo + 0.001) {
        estourar();
        tremer();
    }

    alvo = novo;
}


function estourar() {

    if (reduzir || modo !== "respingo") {
        return;
    }

    const origemX = Math.random() * largura;
    const origemY = Math.random() * altura;
    const quantidade = Math.round(aleatorio(8, 16));

    for (let i = 0; i < quantidade; i++) {
        if (spray.length > 120) {
            break;
        }
        const ang = Math.random() * Math.PI * 2;
        const forca = aleatorio(2, 9);
        spray.push({
            x: origemX,
            y: origemY,
            vx: Math.cos(ang) * forca,
            vy: Math.sin(ang) * forca - 1,
            r: aleatorio(1.5, 5),
            vida: 1
        });
    }
}


/* =========================================================
   TREMOR (mini shake)
========================================================= */

function tremer() {

    if (reduzir || corpoTremendo) {
        return;
    }

    corpoTremendo = true;

    const alvos =
        document.querySelectorAll("header, main, footer");

    alvos.forEach((el) => el.classList.add("tremor"));

    window.setTimeout(() => {
        alvos.forEach((el) => el.classList.remove("tremor"));
        corpoTremendo = false;
    }, 380);
}


/* =========================================================
   DESENHO — RESPINGOS
========================================================= */

function desenharMarca(m, escala) {

    ctx.fillStyle = rgb(m.cor, m.alpha);

    m.lobulos.forEach((l) => {
        ctx.beginPath();
        ctx.arc(
            m.x + l.dx * escala,
            m.y + l.dy * escala,
            Math.max(0.3, l.r * escala),
            0, Math.PI * 2
        );
        ctx.fill();
    });

    m.satelites.forEach((s) => {
        ctx.beginPath();
        ctx.arc(
            m.x + s.dx * escala,
            m.y + s.dy * escala,
            Math.max(0.3, s.r * escala),
            0, Math.PI * 2
        );
        ctx.fill();
    });

    if (m.risco) {
        const r = m.risco;
        const ex = m.x + Math.cos(r.ang) * r.comp * escala;
        const ey = m.y + Math.sin(r.ang) * r.comp * escala;
        const cx = m.x + Math.cos(r.ang + r.curva) * r.comp * 0.5 * escala;
        const cy = m.y + Math.sin(r.ang + r.curva) * r.comp * 0.5 * escala;

        ctx.strokeStyle = rgb(m.cor, m.alpha);
        ctx.lineWidth = Math.max(0.5, r.larg * escala);
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.quadraticCurveTo(cx, cy, ex, ey);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(ex, ey, Math.max(0.5, r.larg * escala), 0, Math.PI * 2);
        ctx.fill();
    }
}


function desenharSpray() {

    for (let i = spray.length - 1; i >= 0; i--) {
        const p = spray[i];

        p.vx *= 0.94;
        p.vy = p.vy * 0.94 + 0.35;
        p.x += p.vx;
        p.y += p.vy;
        p.vida -= 0.025;

        if (p.vida <= 0) {
            spray.splice(i, 1);
            continue;
        }

        ctx.fillStyle = rgb(TINTA, Math.min(1, p.vida));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.vida, 0, Math.PI * 2);
        ctx.fill();
    }
}


function desenharRespingos(tempo) {

    const dur = 220;

    marcas.forEach((m) => {
        if (nivel >= m.limiar) {
            if (m.aparecidoEm === null) {
                m.aparecidoEm = tempo;
            }
            let escala = 1;
            if (!reduzir) {
                const t = Math.min(1, (tempo - m.aparecidoEm) / dur);
                escala = saidaEstalo(t);
            }
            desenharMarca(m, escala);
        } else {
            m.aparecidoEm = null;
        }
    });

    if (!reduzir) {
        desenharSpray();
    }
}


/* =========================================================
   DESENHO — BARRA
========================================================= */

function soltarGota(x, y) {
    if (gotas.length > 60) {
        return;
    }
    gotas.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y,
        vy: 0.6 + Math.random() * 1.4,
        r: 2.5 + Math.random() * 4,
        rastro: 0
    });
}


function desenharGotas() {

    for (let i = gotas.length - 1; i >= 0; i--) {
        const g = gotas[i];

        g.vy += 0.22;
        g.y += g.vy;
        g.rastro = Math.min(g.rastro + g.vy, 90);

        if (g.y - g.r > altura) {
            gotas.splice(i, 1);
            continue;
        }

        ctx.strokeStyle = rgb(TINTA, 0.8);
        ctx.lineWidth = g.r * 0.9;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(g.x, g.y - g.rastro);
        ctx.lineTo(g.x, g.y);
        ctx.stroke();

        ctx.fillStyle = rgb(TINTA);
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
        ctx.fill();
    }
}


function desenharBarra(tempo) {

    const linha = nivel * altura;

    if (linha > 0) {

        const grad = ctx.createLinearGradient(0, 0, 0, linha || 1);
        grad.addColorStop(0, rgb(TINTA_FUNDA));
        grad.addColorStop(1, rgb(TINTA));

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, largura, linha);

        const segundos = tempo / 1000;
        ctx.fillStyle = rgb(TINTA);

        pingos.forEach((p) => {
            const oscila = reduzir
                ? 0.6
                : 0.5 + 0.5 * Math.sin(segundos * p.vel + p.fase);

            const comprimento = p.amp * oscila;
            const base = linha + comprimento;

            ctx.beginPath();
            ctx.moveTo(p.x - p.larg / 2, linha);
            ctx.lineTo(p.x + p.larg / 2, linha);
            ctx.lineTo(p.x + p.larg / 2, base);
            ctx.lineTo(p.x - p.larg / 2, base);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.arc(p.x, base, p.larg / 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    if (!reduzir) {
        const enchendo = alvo - nivel > 0.002;

        if (
            (enchendo || Math.random() < 0.03) &&
            nivel > 0.01 && nivel < 0.99 &&
            Math.random() < 0.35
        ) {
            const p = pingos[Math.floor(Math.random() * pingos.length)];
            if (p) {
                soltarGota(p.x, linha + p.amp * 0.5);
            }
        }

        desenharGotas();
    }
}


/* =========================================================
   ADAPTAÇÃO DAS CORES DA PÁGINA
   ---------------------------------------------------------
   Quando o fundo fica escuro, avisamos a página para clarear
   os textos que ficam por cima do fundo.
========================================================= */

function ajustarContraste(corBase) {

    /*
        Dois estágios de legibilidade:

        • "contraste-forte" começa cedo (~28% do progresso):
          o fundo ainda está claro, mas já ganha tinta/manchas,
          então reforçamos os textos para não apagarem.

        • "sobre-escuro" entra quando o fundo fica realmente
          escuro: aí os textos passam a claros.
    */

    const escuro =
        modo === "barra"
            ? nivel >= 0.32
            : luminancia(corBase) < 0.5;

    const forte = !escuro && nivel >= 0.28;


    if (escuro !== escuroAtual) {
        escuroAtual = escuro;
        document.body.classList.toggle("sobre-escuro", escuro);
    }

    if (forte !== forteAtual) {
        forteAtual = forte;
        document.body.classList.toggle("contraste-forte", forte);
    }
}


/* =========================================================
   LOOP
========================================================= */

function loop(tempo) {

    nivel += (alvo - nivel) * 0.06;
    if (Math.abs(alvo - nivel) < 0.0008) {
        nivel = alvo;
    }

    ctx.clearRect(0, 0, largura, altura);


    /* Base: o branco esquenta com o nível. */
    const t = modo === "barra" ? nivel : Math.pow(nivel, 1.3);
    const corBase = mistura(CLARO, TINTA_FUNDA, t);

    ctx.fillStyle = rgb(corBase);
    ctx.fillRect(0, 0, largura, altura);


    if (modo === "barra") {
        desenharBarra(tempo);
    } else {
        desenharRespingos(tempo);
    }


    ajustarContraste(corBase);

    requestAnimationFrame(loop);
}
