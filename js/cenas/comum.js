/* =========================================================
   CENAS INTERATIVAS — o que todas usam
   ---------------------------------------------------------
   Uma cena é { id, nome, desc, escuro, montar(container) }.
   montar devolve { atualizar(feitos, total, animar), comemorar() }:
     - atualizar: chamada quando o progresso muda. "animar"
       é falso na miniatura do menu (só desenha o estado).
     - comemorar: chamada uma vez quando chega a 100%.
   Desenho em SVG (viewBox 1600×1000, corta as sobras), estilo
   cartoon: cores chapadas e contorno grosso.
========================================================= */


export const NS = "http://www.w3.org/2000/svg";
export const CONTORNO = "#2b2024";
export const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;

let contador = 0;


/* SVG da cena dentro do container; id único pras <defs> não colidirem
   com outra cena (a miniatura e a grande ficam na mesma página). */
export function novaCena(container) {
    const id = `cn${++contador}`;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 1600 1000");
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.classList.add("cena");
    container.appendChild(svg);
    return { svg, id };
}


export function el(tag, atributos = {}, pai = null) {
    const elemento = document.createElementNS(NS, tag);
    for (const [chave, valor] of Object.entries(atributos)) {
        elemento.setAttribute(chave, valor);
    }
    if (pai) pai.appendChild(elemento);
    return elemento;
}


/* Aleatório com semente: a cena é a mesma toda vez que abre. */
export function semente(s) {
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
}


/* Quantas peças da cena ficam "ligadas". Cada tarefa feita liga pelo
   menos uma (quando há peças suficientes); 100% liga todas. */
export function quantas(feitos, total, pecas) {
    if (!total) return 0;
    if (feitos >= total) return pecas;
    return Math.min(pecas - 1, Math.round((pecas * feitos) / total));
}


/* Filtro de brilho (luz acesa). */
export function filtroBrilho(defs, id, forca = 8) {
    defs.insertAdjacentHTML("beforeend", `
        <filter id="${id}" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="${forca}" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>`);
    return `url(#${id})`;
}


/* "Pop" de algo que acabou de acender/aparecer. */
export function pop(elemento, atraso = 0) {
    if (reduzir || !elemento.animate) return;
    elemento.style.transformBox = "fill-box";
    elemento.style.transformOrigin = "center";
    elemento.animate(
        [{ transform: "scale(0.2)", opacity: 0 }, { transform: "scale(1.3)", opacity: 1, offset: 0.6 }, { transform: "scale(1)", opacity: 1 }],
        { duration: 650, delay: atraso, easing: "cubic-bezier(.34,1.56,.64,1)", fill: "backwards" }
    );
}


/* Liga/desliga as peças em ordem; devolve as que acabaram de ligar. */
export function ligarPecas(pecas, n, aplicar) {
    const novas = [];
    pecas.forEach((peca, i) => {
        const ligada = i < n;
        if (ligada && !peca.ligada) novas.push(peca);
        if (ligada !== peca.ligada) aplicar(peca, ligada);
        peca.ligada = ligada;
    });
    return novas;
}


/* Fogos de artifício: estouros de partículas no céu. */
export function fogos(svg, quantos = 6, cores = ["#ffd36b", "#ff6b6b", "#7ee0ff", "#ffffff", "#b388ff"]) {
    if (reduzir) return;
    const rand = Math.random;
    for (let k = 0; k < quantos; k++) {
        const x = 250 + rand() * 1100, y = 120 + rand() * 300;
        const cor = cores[k % cores.length];
        const grupo = el("g", { transform: `translate(${x} ${y})` }, svg);
        for (let i = 0; i < 22; i++) {
            const ang = (i / 22) * Math.PI * 2, dist = 90 + rand() * 70;
            const p = el("circle", { r: 5, fill: cor }, grupo);
            p.animate(
                [{ transform: "translate(0,0)", opacity: 1 },
                 { transform: `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist + 40}px)`, opacity: 0 }],
                { duration: 1300, delay: k * 420, easing: "cubic-bezier(.1,.7,.3,1)", fill: "both" }
            );
        }
        setTimeout(() => grupo.remove(), k * 420 + 1500);
    }
}


/* Chuva de coisinhas (pétalas, moedas, confete) caindo do topo. */
export function chuva(svg, desenhar, quantas = 50, duracao = 3200) {
    if (reduzir) return;
    for (let i = 0; i < quantas; i++) {
        const x = Math.random() * 1600, atraso = Math.random() * 1600;
        const grupo = el("g", {}, svg);
        desenhar(grupo, i);
        const deriva = (Math.random() - 0.3) * 300, giro = (Math.random() - 0.5) * 720;
        grupo.animate(
            [{ transform: `translate(${x}px, -60px) rotate(0deg)` },
             { transform: `translate(${x + deriva}px, 1060px) rotate(${giro}deg)` }],
            { duration: duracao * (0.7 + Math.random() * 0.6), delay: atraso, easing: "ease-in", fill: "both" }
        );
        setTimeout(() => grupo.remove(), atraso + duracao * 1.4);
    }
}


/* Ponto ao longo de uma linha quebrada, pela fração (0..1) do comprimento. */
export function pontoNaLinha(pontos, fracao) {
    const trechos = pontos.slice(1).map((p, i) => Math.hypot(p[0] - pontos[i][0], p[1] - pontos[i][1]));
    let resta = Math.max(0, Math.min(1, fracao)) * trechos.reduce((a, b) => a + b, 0);
    for (let i = 0; i < trechos.length; i++) {
        if (resta <= trechos[i] || i === trechos.length - 1) {
            const t = trechos[i] ? Math.min(1, resta / trechos[i]) : 0;
            return [pontos[i][0] + (pontos[i + 1][0] - pontos[i][0]) * t, pontos[i][1] + (pontos[i + 1][1] - pontos[i][1]) * t];
        }
        resta -= trechos[i];
    }
    return pontos[pontos.length - 1];
}


/* Estrelas piscando (cenas de noite). */
export function estrelas(pai, rand, quantas = 50, alturaMax = 520) {
    for (let i = 0; i < quantas; i++) {
        const estrela = el("circle", {
            cx: (rand() * 1600).toFixed(0), cy: (rand() * alturaMax).toFixed(0),
            r: (1 + rand() * 2.2).toFixed(1), fill: "#fff", class: "cena-estrela"
        }, pai);
        estrela.style.animationDelay = `${(rand() * 4).toFixed(2)}s`;
    }
}
