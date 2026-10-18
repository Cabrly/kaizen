/* =========================================================
   TINTA — rastro do cursor estilo "lâmina de katana"
   ---------------------------------------------------------
   Um corte fino e afiado que segue o mouse: núcleo prateado
   brilhante, ponta fina nas duas extremidades e um fio
   vermelho discreto (a cor do carimbo 改善). Faíscas curtas
   saltam nos golpes rápidos.

   JS puro. Sem frameworks, sem bibliotecas, sem rede.
   Exporta iniciarTinta(), chamado uma vez pelo main.js.
========================================================= */


export function iniciarTinta() {

    /* Respeita quem prefere menos animação. */
    const reduzirMovimento =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

    if (reduzirMovimento) {
        return;
    }

    /* Evita iniciar duas vezes. */
    if (document.getElementById("tinta-canvas")) {
        return;
    }


    /* =========================
       CANVAS EM TELA CHEIA
    ========================= */

    const canvas =
        document.createElement("canvas");

    canvas.id = "tinta-canvas";

    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999";

    document.body.appendChild(canvas);


    const ctx = canvas.getContext("2d");


    let dpr = 1;

    function redimensionar() {

        dpr = window.devicePixelRatio || 1;

        canvas.width =
            Math.floor(window.innerWidth * dpr);

        canvas.height =
            Math.floor(window.innerHeight * dpr);

        /* Desenhamos em coordenadas de CSS. */
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    redimensionar();

    window.addEventListener("resize", redimensionar);


    /* =========================
       PARÂMETROS DA LÂMINA
    ========================= */

    const VIDA_PONTO = 200;   // ms até o corte sumir (curto = ágil)
    const MAX_PONTOS = 55;    // teto de pontos guardados
    const LARGURA_MAX = 11;   // espessura no "bojo" da lâmina

    /* Fio vermelho do carimbo (#c90016). */
    const COR_FIO = "201, 0, 22";


    /* =========================
       ESTADO
    ========================= */

    const pontos = [];       // { x, y, t }
    const faiscas = [];      // { x, y, vx, vy, vida, comp }

    const MAX_FAISCAS = 30;

    let ultimoX = null;
    let ultimoY = null;


    /* =========================
       CAPTURA DO MOVIMENTO
    ========================= */

    function registrar(x, y) {

        const agora = performance.now();

        pontos.push({ x, y, t: agora });

        if (pontos.length > MAX_PONTOS) {
            pontos.shift();
        }

        /* Velocidade do gesto → faíscas no golpe. */
        if (ultimoX !== null) {

            const dx = x - ultimoX;
            const dy = y - ultimoY;

            const velocidade = Math.hypot(dx, dy);

            if (velocidade > 30) {

                const quantidade =
                    Math.min(2, Math.floor(velocidade / 30));

                for (let i = 0; i < quantidade; i++) {
                    lancarFaisca(x, y, dx, dy);
                }
            }
        }

        ultimoX = x;
        ultimoY = y;
    }


    function lancarFaisca(x, y, dx, dy) {

        if (faiscas.length > MAX_FAISCAS) {
            return;
        }

        /* Sai quase na direção do golpe, com leque estreito. */
        const angulo =
            Math.atan2(dy, dx) +
            (Math.random() - 0.5) * 0.7;

        const forca = 4 + Math.random() * 5;

        faiscas.push({
            x,
            y,
            vx: Math.cos(angulo) * forca,
            vy: Math.sin(angulo) * forca,
            vida: 1,
            comp: 6 + Math.random() * 8   // comprimento do risco
        });
    }


    window.addEventListener(
        "mousemove",
        (evento) => {
            registrar(evento.clientX, evento.clientY);
        },
        { passive: true }
    );

    window.addEventListener(
        "touchmove",
        (evento) => {
            const toque = evento.touches[0];

            if (toque) {
                registrar(toque.clientX, toque.clientY);
            }
        },
        { passive: true }
    );


    /* =========================
       GEOMETRIA DA LÂMINA
    ========================= */

    /*
        Constrói uma fita afiada a partir dos pontos vivos.
        A espessura segue uma parábola: zero nas pontas e
        máxima no meio → formato de folha/lâmina.
    */
    function desenharLamina(agora) {

        /* Descarta pontos velhos. */
        while (
            pontos.length &&
            agora - pontos[0].t > VIDA_PONTO
        ) {
            pontos.shift();
        }

        if (pontos.length < 3) {
            return;
        }

        const n = pontos.length;

        const esquerda = [];
        const direita = [];

        for (let i = 0; i < n; i++) {

            const p = pontos[i];

            /* Direção local (usa os vizinhos). */
            const ant = pontos[Math.max(0, i - 1)];
            const prox = pontos[Math.min(n - 1, i + 1)];

            let dx = prox.x - ant.x;
            let dy = prox.y - ant.y;

            const comp = Math.hypot(dx, dy) || 1;

            dx /= comp;
            dy /= comp;

            /* Normal perpendicular à direção. */
            const nx = -dy;
            const ny = dx;

            /* Posição na lâmina: 0 = cauda, 1 = cursor. */
            const s = i / (n - 1);

            /* Parábola: 0 nas pontas, 1 no meio. */
            const perfil = 4 * s * (1 - s);

            const meia = (LARGURA_MAX * perfil) / 2;

            esquerda.push({
                x: p.x + nx * meia,
                y: p.y + ny * meia
            });

            direita.push({
                x: p.x - nx * meia,
                y: p.y - ny * meia
            });
        }


        /* ---- corpo da lâmina (aço translúcido) ---- */

        ctx.beginPath();
        ctx.moveTo(esquerda[0].x, esquerda[0].y);

        for (let i = 1; i < n; i++) {
            ctx.lineTo(esquerda[i].x, esquerda[i].y);
        }

        for (let i = n - 1; i >= 0; i--) {
            ctx.lineTo(direita[i].x, direita[i].y);
        }

        ctx.closePath();

        /* Gradiente da cauda (transparente) ao cursor (aço). */
        const grad = ctx.createLinearGradient(
            pontos[0].x,
            pontos[0].y,
            pontos[n - 1].x,
            pontos[n - 1].y
        );

        grad.addColorStop(0, "rgba(220, 225, 235, 0)");
        grad.addColorStop(0.55, "rgba(228, 232, 240, 0.35)");
        grad.addColorStop(1, "rgba(245, 248, 255, 0.55)");

        ctx.fillStyle = grad;
        ctx.fill();


        /* ---- fio vermelho (borda de um lado) ---- */

        ctx.beginPath();
        ctx.moveTo(esquerda[0].x, esquerda[0].y);

        for (let i = 1; i < n; i++) {
            ctx.lineTo(esquerda[i].x, esquerda[i].y);
        }

        ctx.strokeStyle = `rgba(${COR_FIO}, 0.5)`;
        ctx.lineWidth = 1.2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();


        /* ---- brilho central (o gume) ---- */

        ctx.beginPath();
        ctx.moveTo(pontos[0].x, pontos[0].y);

        for (let i = 1; i < n; i++) {
            ctx.lineTo(pontos[i].x, pontos[i].y);
        }

        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 1.6;
        ctx.stroke();
    }


    /* =========================
       FAÍSCAS (riscos curtos)
    ========================= */

    function desenharFaiscas() {

        ctx.lineCap = "round";

        for (let i = faiscas.length - 1; i >= 0; i--) {

            const f = faiscas[i];

            f.x += f.vx;
            f.y += f.vy;

            f.vx *= 0.9;
            f.vy *= 0.9;

            f.vida -= 0.05;

            if (f.vida <= 0) {
                faiscas.splice(i, 1);
                continue;
            }

            /* Risco na direção do movimento. */
            const dir = Math.hypot(f.vx, f.vy) || 1;

            const ux = f.vx / dir;
            const uy = f.vy / dir;

            const comp = f.comp * f.vida;

            ctx.beginPath();
            ctx.moveTo(f.x, f.y);
            ctx.lineTo(f.x - ux * comp, f.y - uy * comp);

            ctx.strokeStyle =
                `rgba(255, 240, 235, ${f.vida})`;

            ctx.lineWidth = 1.4;
            ctx.stroke();
        }
    }


    /* =========================
       LOOP
    ========================= */

    function loop() {

        const agora = performance.now();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        desenharLamina(agora);
        desenharFaiscas();

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
}
