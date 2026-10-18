/* =========================================================
   BOLHA — gota de sangue que escorre entre as abas
   ---------------------------------------------------------
   A gota é feita de vários círculos em SVG, cada um preso
   à aba ativa por uma "mola". O filtro #kaizen-goo borra e
   corta o borrado, então os círculos viram uma massa só,
   de borda mole.

   Ao trocar de aba, os círculos da frente têm mola forte e
   os de trás mola fraca: a gota estica, afina e solta pingos,
   que depois são puxados de volta. Parada, a borda ondula
   de leve, como líquido.

   Não troca de tela: só observa a classe "ativa" que o
   telas.js já coloca nas abas.
========================================================= */


const nav =
    document.querySelector(".nav-telas");


const bolha =
    nav ? nav.querySelector(".nav-bolha") : null;


const abas =
    nav ? nav.querySelectorAll(".nav-tab") : [];


const SVG = "http://www.w3.org/2000/svg";

const QTD_CORPO = 12;     // círculos que formam a gota
const QTD_PINGOS = 3;     // pinguinhos que ficam pra trás

const AMORTECIMENTO = 0.8;
const MOLA_FRENTE = 0.11;
const MOLA_TRAS = 0.035;
const MOLA_PINGO = 0.022;


const menosMovimento =
    window.matchMedia("(prefers-reduced-motion: reduce)");


let svg = null;
let brilho = null;
let corpo = [];
let pingos = [];

let alvo = { x: 0, largura: 0, altura: 0 };
let direcao = 1;
let iniciado = false;


function criarSvg() {

    svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("class", "bolha-svg");
    svg.setAttribute("aria-hidden", "true");


    svg.innerHTML = `
        <defs>
            <filter id="kaizen-goo" x="-30%" y="-150%" width="160%" height="400%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
                <feColorMatrix
                    mode="matrix"
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
                />
            </filter>
        </defs>
        <g class="bolha-sangue" filter="url(#kaizen-goo)"></g>
    `;


    const grupo = svg.querySelector(".bolha-sangue");


    function circulo(raio) {
        const c = document.createElementNS(SVG, "circle");
        grupo.appendChild(c);
        return { el: c, x: 0, y: 0, vx: 0, vy: 0, raio, fase: Math.random() * Math.PI * 2 };
    }


    pingos = Array.from({ length: QTD_PINGOS }, (_, i) => circulo(4 + i));
    corpo = Array.from({ length: QTD_CORPO }, () => circulo(0));


    brilho = document.createElementNS(SVG, "ellipse");
    brilho.setAttribute("class", "bolha-brilho");
    svg.appendChild(brilho);


    bolha.appendChild(svg);

}


function medirAlvo() {

    const aba =
        nav.querySelector(".nav-tab.ativa") || abas[0];

    if (!aba) {
        return;
    }


    const novoX = aba.offsetLeft;

    if (novoX !== alvo.x) {
        direcao = novoX > alvo.x ? 1 : -1;
    }


    alvo = {
        x: novoX,
        largura: aba.offsetWidth,
        altura: aba.offsetHeight,
        topo: aba.offsetTop
    };


    svg.setAttribute("width", nav.clientWidth);
    svg.setAttribute("height", nav.clientHeight);

}


/*
    Onde cada círculo do corpo "quer" ficar: enfileirados
    dentro da aba, de forma que juntos formem uma pílula.
*/
function posicaoDoCirculo(i) {

    const raio = alvo.altura / 2;
    const inicio = alvo.x + raio;
    const fim = alvo.x + alvo.largura - raio;

    return {
        x: inicio + (fim - inicio) * (i / (QTD_CORPO - 1)),
        y: alvo.topo + raio
    };

}


function encaixar() {

    corpo.forEach((c, i) => {
        const p = posicaoDoCirculo(i);
        c.x = p.x; c.y = p.y; c.vx = 0; c.vy = 0;
    });

    pingos.forEach((p) => {
        const meio = posicaoDoCirculo(Math.floor(QTD_CORPO / 2));
        p.x = meio.x; p.y = meio.y; p.vx = 0; p.vy = 0;
    });

}


function mover(c, destino, mola) {

    c.vx = (c.vx + (destino.x - c.x) * mola) * AMORTECIMENTO;
    c.vy = (c.vy + (destino.y - c.y) * mola) * AMORTECIMENTO;

    c.x += c.vx;
    c.y += c.vy;

}


function quadro(tempo) {

    const t = tempo / 1000;
    const raioBase = alvo.altura / 2;
    const parado = menosMovimento.matches;


    corpo.forEach((c, i) => {

        /*
            0 = círculo mais atrás, 1 = mais à frente,
            na direção em que a gota está indo.
        */
        const frente =
            direcao > 0 ? i / (QTD_CORPO - 1) : 1 - i / (QTD_CORPO - 1);

        const mola =
            MOLA_TRAS + (MOLA_FRENTE - MOLA_TRAS) * frente;


        if (parado) {
            const p = posicaoDoCirculo(i);
            c.x = p.x; c.y = p.y;
        } else {
            mover(c, posicaoDoCirculo(i), mola);
        }


        // quanto mais rápido, mais fino: é isso que faz a gota "escorrer"
        const velocidade = Math.hypot(c.vx, c.vy);
        const afinar = Math.min(0.3, velocidade * 0.025);
        const ondular = parado ? 0 : Math.sin(t * 2.6 + c.fase) * 0.9;

        c.el.setAttribute("cx", c.x.toFixed(2));
        c.el.setAttribute("cy", (c.y + (parado ? 0 : Math.cos(t * 2 + c.fase) * 0.8)).toFixed(2));
        c.el.setAttribute("r", Math.max(2, raioBase * (1 - afinar) + ondular).toFixed(2));

    });


    // Pingos seguem o círculo de trás, bem devagar, e vão sendo engolidos
    const rabo =
        direcao > 0 ? corpo[0] : corpo[QTD_CORPO - 1];

    pingos.forEach((p, i) => {

        if (parado) {
            p.x = rabo.x; p.y = rabo.y;
        } else {
            mover(p, { x: rabo.x, y: rabo.y }, MOLA_PINGO * (1 + i * 0.6));
        }

        const distancia = Math.abs(p.x - rabo.x);
        const raio = distancia < 3 ? 0 : p.raio + Math.min(3, distancia * 0.03);

        p.el.setAttribute("cx", p.x.toFixed(2));
        p.el.setAttribute("cy", (p.y + Math.min(6, distancia * 0.04)).toFixed(2));
        p.el.setAttribute("r", raio.toFixed(2));

    });


    // Brilho na parte de cima da gota, acompanhando o miolo
    const esquerda = Math.min(...corpo.map((c) => c.x));
    const direita = Math.max(...corpo.map((c) => c.x));
    const meioY = corpo[Math.floor(QTD_CORPO / 2)].y;

    brilho.setAttribute("cx", ((esquerda + direita) / 2 - raioBase * 0.3).toFixed(2));
    brilho.setAttribute("cy", (meioY - raioBase * 0.48).toFixed(2));
    brilho.setAttribute("rx", Math.max(4, (direita - esquerda) * 0.38).toFixed(2));
    brilho.setAttribute("ry", (raioBase * 0.22).toFixed(2));


    requestAnimationFrame(quadro);

}


if (nav && bolha && abas.length) {

    criarSvg();
    nav.classList.add("com-bolha");

    medirAlvo();
    encaixar();
    iniciado = true;

    requestAnimationFrame(quadro);


    const observadorClasse =
        new MutationObserver(() => medirAlvo());

    abas.forEach((aba) => {
        observadorClasse.observe(aba, {
            attributes: true,
            attributeFilter: ["class"]
        });
    });


    /*
        Fonte carregando ou tela mudando de tamanho mudam
        a largura das abas: reposiciona sem escorrer.
    */
    const observadorTamanho =
        new ResizeObserver(() => {
            if (!iniciado) return;
            medirAlvo();
            encaixar();
        });

    observadorTamanho.observe(nav);
    abas.forEach((aba) => observadorTamanho.observe(aba));

}
