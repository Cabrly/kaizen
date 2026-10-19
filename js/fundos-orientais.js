/* =========================================================
   FUNDOS ORIENTAIS — desenhos por baixo da tinta do progresso
   ---------------------------------------------------------
   Cada desenho é um SVG gerado aqui (sem imagem nenhuma pra
   baixar). Fica numa camada fixa atrás do canvas da tinta:
   com 0% de progresso aparece limpo, e a tinta vermelha vai
   cobrindo conforme as tarefas são concluídas.

   Os sorteados (pétalas, montanhas) usam semente fixa: o
   desenho é o mesmo toda vez que o app abre.
========================================================= */


const PAPEL = "#f7f7f5", TINTA = "#171717", VERMELHO = "#c90016";
const NS = "http://www.w3.org/2000/svg";

// aleatório com semente: o mesmo desenho toda vez que a página abre
function semente(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }

function cumeeira(rand, largura, base, amplitude, passos) {
    // linha de montanha por deslocamento do ponto médio
    let pts = [[0, base], [largura, base]];
    let amp = amplitude;
    for (let n = 0; n < passos; n++) {
        const novos = [pts[0]];
        for (let i = 1; i < pts.length; i++) {
            const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
            novos.push([(x0 + x1) / 2, (y0 + y1) / 2 + (rand() - 0.5) * amp], pts[i]);
        }
        pts = novos;
        amp *= 0.55;
    }
    return pts;
}

const MODELOS = [
    {
        nome: "1 · Seigaiha 青海波", desc: "Ondas do mar em padrão clássico, bem suave",
        svg() {
            const R = 44, linhas = [];
            for (let k = 0; k <= 4; k++) {
                const y = k * R / 2, desloc = (k % 2) * R;
                for (const x of [desloc - 2 * R, desloc, desloc + 2 * R]) {
                    linhas.push(`<circle cx="${x}" cy="${y}" r="${R}" fill="${PAPEL}" stroke="#d9d6cf" stroke-width="1.4"/>`);
                    for (const f of [0.78, 0.56, 0.34])
                        linhas.push(`<circle cx="${x}" cy="${y}" r="${R * f}" fill="none" stroke="#e4e1db" stroke-width="1.2"/>`);
                }
            }
            return `<defs><pattern id="sei" width="${2 * R}" height="${R}" patternUnits="userSpaceOnUse">${linhas.join("")}</pattern>
                <linearGradient id="sei-some" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PAPEL}" stop-opacity="1"/><stop offset=".55" stop-color="${PAPEL}" stop-opacity=".2"/><stop offset="1" stop-color="${PAPEL}" stop-opacity="0"/></linearGradient></defs>
                <rect width="100%" height="100%" fill="url(#sei)"/>
                <rect width="100%" height="100%" fill="url(#sei-some)"/>`;
        }
    },
    {
        nome: "2 · Fuji ao amanhecer 富士", desc: "Sol vermelho, monte em tinta e névoa",
        vb: "0 0 1600 1000",
        svg() {
            return `<defs>
                <linearGradient id="fj-m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${TINTA}" stop-opacity=".22"/><stop offset="1" stop-color="${TINTA}" stop-opacity=".04"/></linearGradient>
                <linearGradient id="fj-nevoa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PAPEL}" stop-opacity="0"/><stop offset="1" stop-color="${PAPEL}" stop-opacity="1"/></linearGradient>
                <filter id="fj-blur"><feGaussianBlur stdDeviation="18"/></filter></defs>
                <circle cx="1180" cy="300" r="160" fill="${VERMELHO}" opacity=".16"/>
                <path d="M120 1000 C 420 900 640 700 760 560 L 800 520 L 840 560 C 960 700 1180 900 1480 1000 Z" fill="url(#fj-m)"/>
                <path d="M705 625 L 760 560 L 800 520 L 840 560 L 895 625 L 860 612 L 830 640 L 800 610 L 770 642 L 742 612 Z" fill="#fff" opacity=".85"/>
                <g stroke="${VERMELHO}" stroke-opacity=".22" stroke-width="3" fill="none" stroke-linecap="round">
                    <path d="M1010 420 h120 a24 24 0 0 0 0 -48 a30 30 0 0 0 -58 -6"/>
                    <path d="M1230 470 h170 a20 20 0 0 0 0 -40"/>
                </g>
                <rect x="0" y="760" width="1600" height="240" fill="url(#fj-nevoa)"/>
                <ellipse cx="500" cy="820" rx="420" ry="40" fill="#fff" opacity=".7" filter="url(#fj-blur)"/>
                <ellipse cx="1150" cy="860" rx="380" ry="36" fill="#fff" opacity=".7" filter="url(#fj-blur)"/>`;
        }
    },
    {
        nome: "3 · Sumi-e 墨絵", desc: "Montanhas em aguada de nanquim e selo vermelho",
        vb: "0 0 1600 1000",
        svg() {
            const rand = semente(7), camadas = [];
            const tons = [[560, .05, 120], [650, .08, 110], [740, .12, 90], [840, .18, 70]];
            tons.forEach(([base, op, amp], i) => {
                const pts = cumeeira(rand, 1600, base, amp * 2.2, 7);
                const d = "M0 1000 L" + pts.map(([x, y]) => `${x.toFixed(0)} ${y.toFixed(0)}`).join(" L") + " L1600 1000 Z";
                camadas.push(`<path d="${d}" fill="url(#se-g${i})" filter="url(#se-borra)"/>`);
            });
            const grads = tons.map(([, op], i) => `<linearGradient id="se-g${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${TINTA}" stop-opacity="${op}"/><stop offset=".6" stop-color="${TINTA}" stop-opacity="${op * .25}"/><stop offset="1" stop-color="${TINTA}" stop-opacity="0"/></linearGradient>`).join("");
            return `<defs>${grads}<filter id="se-borra"><feGaussianBlur stdDeviation="2.5"/></filter></defs>
                ${camadas.join("")}
                <g transform="translate(1460 120)"><rect width="58" height="58" rx="6" fill="${VERMELHO}" opacity=".75"/>
                <text x="29" y="41" text-anchor="middle" font-family="Noto Serif JP" font-weight="900" font-size="34" fill="${PAPEL}">改</text></g>
                <g stroke="${TINTA}" stroke-opacity=".35" stroke-width="2" fill="none" stroke-linecap="round">
                    <path d="M300 230 q 12 -8 24 0 q 12 -8 24 0"/><path d="M360 200 q 9 -6 18 0 q 9 -6 18 0"/></g>`;
        }
    },
    {
        nome: "4 · Sakura 桜", desc: "Galho de cerejeira nos cantos e pétalas caindo",
        vb: "0 0 1600 1000",
        svg() {
            const rand = semente(21);
            const flor = (x, y, r, op) => {
                const petalas = [0, 72, 144, 216, 288].map((a) =>
                    `<ellipse cx="0" cy="${-r * .55}" rx="${r * .42}" ry="${r * .58}" transform="rotate(${a})" fill="#f2b8c0"/>`).join("");
                return `<g transform="translate(${x} ${y}) rotate(${(rand() * 70) | 0})" opacity="${op}">${petalas}<circle r="${r * .2}" fill="${VERMELHO}"/></g>`;
            };
            const galhos = `<g fill="none" stroke="${TINTA}" stroke-linecap="round" opacity=".55">
                <path d="M1620 40 C 1480 90 1380 140 1240 260 C 1180 310 1120 330 1040 340" stroke-width="14"/>
                <path d="M1380 150 C 1360 210 1330 250 1290 300" stroke-width="7"/>
                <path d="M1240 260 C 1230 200 1200 170 1160 150" stroke-width="6"/>
                <path d="M1110 330 C 1080 380 1060 400 1020 420" stroke-width="4"/>
                <path d="M-20 900 C 120 860 210 820 320 760 C 370 730 420 720 470 724" stroke-width="12"/>
                <path d="M210 820 C 230 770 230 740 220 700" stroke-width="5"/></g>`;
            const flores = [[1250, 250, 26], [1180, 300, 22], [1300, 300, 20], [1050, 340, 24], [1020, 410, 18], [1160, 150, 20],
                [1400, 150, 22], [1330, 190, 17], [1110, 345, 15], [460, 720, 24], [330, 755, 20], [225, 700, 19], [380, 735, 16]]
                .map(([x, y, r]) => flor(x, y, r, .9)).join("");
            const caindo = Array.from({ length: 34 }, () => {
                const x = rand() * 1600, y = rand() * 1000;
                return `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="5" ry="8" transform="rotate(${(rand() * 180) | 0} ${x.toFixed(0)} ${y.toFixed(0)})" fill="#f2b8c0" opacity="${(.35 + rand() * .4).toFixed(2)}"/>`;
            }).join("");
            return galhos + flores + caindo;
        }
    },
    {
        nome: "5 · Ensō 円相 + caligrafia", desc: "Círculo zen de pincel e 改善 na vertical",
        vb: "0 0 1600 1000",
        svg() {
            // pincelada: anel com espessura variando, aberto no fim
            const cx = 1100, cy = 500, R = 300, pts1 = [], pts2 = [];
            for (let i = 0; i <= 120; i++) {
                const a = -1.2 + (i / 120) * 5.6, t = i / 120;
                const esp = 10 + 34 * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - t * .5);
                const rr = R + Math.sin(a * 3) * 6;
                pts1.push([cx + Math.cos(a) * (rr + esp), cy + Math.sin(a) * (rr + esp)]);
                pts2.push([cx + Math.cos(a) * (rr - esp), cy + Math.sin(a) * (rr - esp)]);
            }
            const d = "M" + pts1.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L") + " L" +
                pts2.reverse().map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L") + " Z";
            return `<path d="${d}" fill="${TINTA}" opacity=".09"/>
                <text x="240" y="230" font-family="Noto Serif JP" font-weight="900" font-size="190" fill="${TINTA}" opacity=".07" writing-mode="tb">改善</text>
                <rect x="232" y="660" width="34" height="34" rx="4" fill="${VERMELHO}" opacity=".55"/>`;
        }
    },
    {
        nome: "6 · Bambu 竹", desc: "Bambuzal em nanquim na lateral esquerda",
        vb: "0 0 1600 1000",
        svg() {
            const rand = semente(5), partes = [];
            [[70, 30, .16], [160, 22, .1], [235, 26, .2], [330, 16, .08]].forEach(([x, w, op]) => {
                let y = 1000;
                while (y > -60) {
                    const seg = 130 + rand() * 60;
                    partes.push(`<rect x="${x}" y="${(y - seg + 6).toFixed(0)}" width="${w}" height="${(seg - 10).toFixed(0)}" rx="${w / 2}" fill="${TINTA}" opacity="${op}"/>`);
                    partes.push(`<rect x="${x - 3}" y="${(y - 5).toFixed(0)}" width="${w + 6}" height="4" rx="2" fill="${TINTA}" opacity="${op * 1.6}"/>`);
                    y -= seg;
                }
            });
            const folha = (x, y, ang, tam, op) =>
                `<path d="M0 0 C ${tam * .3} -${tam * .12} ${tam * .75} -${tam * .1} ${tam} 0 C ${tam * .75} ${tam * .1} ${tam * .3} ${tam * .12} 0 0 Z" transform="translate(${x} ${y}) rotate(${ang})" fill="${TINTA}" opacity="${op}"/>`;
            for (let i = 0; i < 26; i++) {
                const x = 80 + rand() * 280, y = 60 + rand() * 600;
                partes.push(folha(x.toFixed(0), y.toFixed(0), (-40 + rand() * 80).toFixed(0), (70 + rand() * 60).toFixed(0), (.08 + rand() * .14).toFixed(2)));
            }
            partes.push(`<circle cx="1380" cy="190" r="70" fill="${VERMELHO}" opacity=".12"/>`);
            return partes.join("");
        }
    },
{
        nome: "7 · Torii no lago 鳥居", desc: "Portal vermelho sobre a água, reflexo e ondulações",
        vb: "0 0 1600 1000",
        svg() {
            const torii = (op) => `<g fill="${VERMELHO}" opacity="${op}">
                <path d="M1060 250 Q 1260 228 1460 250 L 1470 236 Q 1260 205 1050 236 Z"/>
                <rect x="1080" y="262" width="360" height="22" rx="3"/>
                <rect x="1110" y="300" width="300" height="16"/>
                <rect x="1135" y="262" width="28" height="398"/><rect x="1357" y="262" width="28" height="398"/>
                <rect x="1245" y="284" width="30" height="32" fill="${TINTA}" opacity=".5"/></g>`;
            const ondas = Array.from({ length: 9 }, (_, i) =>
                `<path d="M${1000 + (i % 3) * 40} ${690 + i * 28} q 60 -10 120 0 t 120 0 t 120 0" stroke="${TINTA}" stroke-opacity="${.12 - i * .01}" stroke-width="2" fill="none"/>`).join("");
            return `<defs><linearGradient id="tr-agua" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfd8dc" stop-opacity=".35"/><stop offset="1" stop-color="#cfd8dc" stop-opacity="0"/></linearGradient>
                <linearGradient id="tr-ref" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="${PAPEL}" stop-opacity="1"/></linearGradient></defs>
                <circle cx="420" cy="220" r="90" fill="${VERMELHO}" opacity=".08"/>
                <rect x="0" y="660" width="1600" height="340" fill="url(#tr-agua)"/>
                ${torii(.62)}
                <g transform="translate(0 1320) scale(1 -1)">${torii(.18)}</g>
                <rect x="1000" y="660" width="520" height="340" fill="url(#tr-ref)"/>
                ${ondas}
                <path d="M0 660 H1600" stroke="${TINTA}" stroke-opacity=".15" stroke-width="1.5"/>`;
        }
    },
    {
        nome: "8 · A Grande Onda 神奈川沖浪裏", desc: "Homenagem a Hokusai: onda com garras de espuma",
        vb: "0 0 1600 1000",
        svg() {
            const garras = Array.from({ length: 14 }, (_, i) => {
                const a = Math.PI * (1.05 + i * .055), x = 470 + Math.cos(a) * 300, y = 470 + Math.sin(a) * 300;
                return `<path d="M${x.toFixed(0)} ${y.toFixed(0)} q -14 -26 -2 -44 q 6 18 22 26 q -4 -24 10 -36 q 2 22 14 30 Z" fill="${PAPEL}" stroke="#2c4a6b" stroke-opacity=".35" stroke-width="2" transform="rotate(${(a * 180 / Math.PI + 90).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`;
            }).join("");
            const linhas = Array.from({ length: 6 }, (_, i) =>
                `<path d="M${120 + i * 30} 1000 C ${180 + i * 30} 700 ${260 + i * 20} 420 ${470 - i * 10} ${200 + i * 30} C ${640 - i * 14} ${110 + i * 26} ${800 - i * 20} ${200 + i * 20} ${760 - i * 10} ${330 + i * 14}" stroke="#2c4a6b" stroke-opacity="${.22 - i * .025}" stroke-width="3" fill="none"/>`).join("");
            return `<defs><linearGradient id="on-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2c4a6b" stop-opacity=".22"/><stop offset="1" stop-color="#2c4a6b" stop-opacity=".05"/></linearGradient></defs>
                <path d="M0 1000 L0 820 C 120 760 200 600 260 470 C 330 300 430 170 560 150 C 700 130 820 220 800 340 C 780 420 700 430 660 380 C 720 380 740 320 700 290 C 640 250 560 300 540 380 C 500 540 620 700 900 820 C 1100 900 1400 880 1600 860 L1600 1000 Z" fill="url(#on-g)"/>
                ${linhas}${garras}
                <path d="M1180 520 L 1240 440 L 1300 520 Z" fill="${TINTA}" opacity=".12"/>
                <path d="M1222 464 L 1240 440 L 1258 464 L 1240 458 Z" fill="#fff" opacity=".9"/>
                <circle cx="1380" cy="200" r="40" fill="${VERMELHO}" opacity=".14"/>`;
        }
    },
    {
        nome: "9 · Lanternas 提灯", desc: "Chōchin vermelhas penduradas com brilho quente",
        vb: "0 0 1600 1000",
        svg() {
            const lanterna = (x, y, s, op) => `<g transform="translate(${x} ${y}) scale(${s})" opacity="${op}">
                <ellipse cx="0" cy="0" rx="120" ry="120" fill="url(#ln-brilho)"/>
                <line x1="0" y1="-200" x2="0" y2="-70" stroke="${TINTA}" stroke-width="2"/>
                <rect x="-26" y="-72" width="52" height="12" rx="3" fill="${TINTA}"/>
                <ellipse cx="0" cy="0" rx="48" ry="62" fill="${VERMELHO}"/>
                ${[-40, -24, -8, 8, 24, 40].map((yy) => `<path d="M${-Math.sqrt(1 - (yy / 62) ** 2) * 48} ${yy} Q 0 ${yy + 4} ${Math.sqrt(1 - (yy / 62) ** 2) * 48} ${yy}" stroke="#7a000d" stroke-width="1.5" fill="none"/>`).join("")}
                <rect x="-26" y="60" width="52" height="12" rx="3" fill="${TINTA}"/>
                <text x="0" y="12" text-anchor="middle" font-family="Noto Serif JP" font-weight="900" font-size="34" fill="${PAPEL}" opacity=".9">祭</text>
                <path d="M-6 72 L -10 100 M0 72 L0 104 M6 72 L 10 100" stroke="${TINTA}" stroke-width="2"/></g>`;
            return `<defs><radialGradient id="ln-brilho"><stop offset="0" stop-color="#ffb347" stop-opacity=".35"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs>
                <path d="M-20 60 Q 400 170 800 90 Q 1200 10 1620 120" stroke="${TINTA}" stroke-opacity=".4" stroke-width="2" fill="none"/>
                ${lanterna(170, 230, .9, .55)}${lanterna(420, 260, .75, .45)}${lanterna(1180, 200, .8, .5)}${lanterna(1440, 270, 1, .6)}
                ${lanterna(1300, 230, .55, .35)}${lanterna(290, 210, .5, .3)}`;
        }
    },
    {
        nome: "10 · Carpas koi 鯉", desc: "Koi nadando num lago com folhas de lótus",
        vb: "0 0 1600 1000",
        svg() {
            const koi = (x, y, ang, s, cor) => `<g transform="translate(${x} ${y}) rotate(${ang}) scale(${s})" opacity=".55">
                <path d="M0 0 C 30 -34 110 -36 170 -6 C 200 6 220 0 250 -24 C 244 0 246 14 256 34 C 226 18 206 14 172 22 C 112 46 30 36 0 0 Z" fill="${PAPEL}" stroke="${TINTA}" stroke-opacity=".25" stroke-width="2"/>
                <path d="M40 -18 C 70 -30 100 -26 120 -12 C 100 0 70 2 40 -18 Z M110 10 C 130 4 150 8 160 18 C 140 26 120 22 110 10 Z" fill="${cor}"/>
                <path d="M70 18 C 80 40 96 50 112 52 C 104 36 98 28 90 20 Z M78 -26 C 90 -48 108 -56 124 -56 C 114 -42 106 -34 96 -26 Z" fill="${cor}" opacity=".7"/>
                <circle cx="22" cy="-6" r="3" fill="${TINTA}"/></g>`;
            const lotus = (x, y, r) => `<g transform="translate(${x} ${y})" opacity=".22"><path d="M0 0 L ${r} -8 A ${r} ${r * .7} 0 1 1 ${r} 8 Z" fill="#3f6b4a"/><path d="M0 0 L ${r * .8} ${r * .3} M0 0 L ${-r * .6} ${r * .5} M0 0 L ${-r * .7} ${-r * .4}" stroke="${PAPEL}" stroke-width="2"/></g>`;
            const ondulacoes = [[1200, 300], [350, 760], [900, 860]].map(([x, y]) =>
                [40, 80, 120].map((r, i) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .35}" fill="none" stroke="${TINTA}" stroke-opacity="${.12 - i * .03}" stroke-width="2"/>`).join("")).join("");
            return `<rect width="1600" height="1000" fill="#e8eef0" opacity=".5"/>
                ${ondulacoes}${lotus(180, 180, 90)}${lotus(1420, 800, 110)}${lotus(1500, 620, 60)}${lotus(110, 900, 70)}
                ${koi(1050, 230, 18, 1.1, VERMELHO)}${koi(300, 640, -22, 1, "#e07a1f")}${koi(1300, 760, 160, .9, VERMELHO)}`;
        }
    },
    {
        nome: "11 · Grous na lua 鶴", desc: "Lua cheia enorme e grous cruzando o céu",
        vb: "0 0 1600 1000",
        svg() {
            const grou = (x, y, s, op, asa) => `<g transform="translate(${x} ${y}) scale(${s})" opacity="${op}">
                <path d="M0 0 C 40 -10 80 -10 120 0 C 80 6 40 8 0 0 Z" fill="${TINTA}"/>
                <path d="M120 0 C 140 -4 160 -12 176 -24" stroke="${TINTA}" stroke-width="5" fill="none" stroke-linecap="round"/>
                <circle cx="176" cy="-24" r="5" fill="${VERMELHO}"/>
                <path d="M60 -2 C 40 ${-60 * asa} 10 ${-90 * asa} -40 ${-110 * asa} C 0 ${-70 * asa} 30 -30 50 -4 Z" fill="${TINTA}"/>
                <path d="M60 2 C 80 ${50 * asa} 100 ${70 * asa} 140 ${80 * asa} C 110 ${50 * asa} 90 20 70 4 Z" fill="${TINTA}" opacity=".8"/>
                <path d="M0 0 L -40 14 M0 0 L -44 6" stroke="${TINTA}" stroke-width="3" stroke-linecap="round"/></g>`;
            return `<defs><radialGradient id="gr-lua"><stop offset="0" stop-color="#f4ead2" stop-opacity=".9"/><stop offset=".85" stop-color="#efe3c4" stop-opacity=".7"/><stop offset="1" stop-color="#efe3c4" stop-opacity="0"/></radialGradient></defs>
                <circle cx="1120" cy="420" r="340" fill="url(#gr-lua)"/>
                ${grou(860, 360, .9, .32, 1)}${grou(1080, 470, .7, .26, -.8)}${grou(1260, 300, .55, .22, .9)}${grou(1380, 560, .45, .2, -1)}
                <path d="M0 880 Q 300 820 640 870 T 1600 850 V1000 H0 Z" fill="${TINTA}" opacity=".06"/>`;
        }
    },
    {
        nome: "12 · Pagode na neblina 五重塔", desc: "Torre de cinco andares, pinheiro e névoa",
        vb: "0 0 1600 1000",
        svg() {
            let andares = "";
            for (let i = 0; i < 5; i++) {
                const y = 760 - i * 105, l = 150 - i * 16;
                andares += `<path d="M${1250 - l} ${y} Q ${1250} ${y - 22} ${1250 + l} ${y} L ${1250 + l - 18} ${y + 14} L ${1250 - l + 18} ${y + 14} Z" fill="${TINTA}"/>
                    <rect x="${1250 - l * .45}" y="${y + 14}" width="${l * .9}" height="${105 - 20}" fill="${TINTA}" opacity=".7"/>`;
            }
            const rand = semente(3);
            const morro = (base, op, amp) => {
                const pts = cumeeira(rand, 1600, base, amp, 6);
                return `<path d="M0 1000 L${pts.map(([x, y]) => `${x.toFixed(0)} ${y.toFixed(0)}`).join(" L")} L1600 1000 Z" fill="${TINTA}" opacity="${op}"/>`;
            };
            const agulhas = (x, y, ang) => Array.from({ length: 9 }, (_, k) =>
                `<line x1="${x}" y1="${y}" x2="${(x + Math.cos((ang - 50 + k * 12) * Math.PI / 180) * 46).toFixed(0)}" y2="${(y + Math.sin((ang - 50 + k * 12) * Math.PI / 180) * 46).toFixed(0)}"/>`).join("");
            const pinheiro = `${morro(640, .05, 180)}${morro(720, .07, 120)}
                <g stroke="${TINTA}" stroke-opacity=".28" stroke-linecap="round" fill="none">
                    <path d="M-20 140 C 120 160 220 200 330 270 C 390 310 430 320 480 318" stroke-width="12"/>
                    <path d="M200 190 C 220 240 230 270 220 320" stroke-width="6"/>
                    <g stroke-width="2.5">${[[300, 255, -90], [390, 300, -80], [470, 316, -70], [220, 320, 90], [140, 165, -100], [240, 215, 80]].map(([x, y, a]) => agulhas(x, y, a)).join("")}</g></g>`;
            return `<defs><linearGradient id="pg-n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PAPEL}" stop-opacity="0"/><stop offset=".7" stop-color="${PAPEL}" stop-opacity=".95"/><stop offset="1" stop-color="${PAPEL}"/></linearGradient>
                <filter id="pg-b"><feGaussianBlur stdDeviation="22"/></filter></defs>
                <g opacity=".22">${andares}<rect x="1246" y="180" width="8" height="140" fill="${TINTA}"/>
                ${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="1250" cy="${200 + i * 18}" r="7" fill="none" stroke="${TINTA}" stroke-width="3"/>`).join("")}</g>
                ${pinheiro}
                <rect x="0" y="600" width="1600" height="400" fill="url(#pg-n)"/>
                <ellipse cx="1250" cy="700" rx="420" ry="60" fill="#fff" opacity=".8" filter="url(#pg-b)"/>
                <circle cx="1460" cy="150" r="50" fill="${VERMELHO}" opacity=".15"/>`;
        }
    },
    {
        nome: "13 · Jardim zen 枯山水", desc: "Areia rastelada contornando pedras",
        vb: "0 0 1600 1000",
        svg() {
            const pedras = [[1150, 380, 90, 60], [1300, 700, 60, 42], [380, 780, 110, 70]];
            let sulcos = "";
            for (let y = 20; y < 1000; y += 22)
                sulcos += `<path d="M0 ${y} Q 400 ${y + 6} 800 ${y} T 1600 ${y}" stroke="#cfcac0" stroke-width="2" fill="none"/>`;
            const aneis = pedras.map(([x, y, rx, ry]) => {
                let a = `<ellipse cx="${x}" cy="${y}" rx="${rx + 70}" ry="${ry + 60}" fill="${PAPEL}"/>`;
                for (let k = 1; k <= 4; k++) a += `<ellipse cx="${x}" cy="${y}" rx="${rx + k * 17}" ry="${ry + k * 15}" fill="none" stroke="#cfcac0" stroke-width="2"/>`;
                return a + `<path d="M${x - rx} ${y + 10} C ${x - rx} ${y - ry} ${x - rx * .2} ${y - ry * 1.1} ${x + rx * .3} ${y - ry * .9} C ${x + rx} ${y - ry * .6} ${x + rx} ${y + ry * .4} ${x + rx * .6} ${y + ry * .6} C ${x} ${y + ry * .8} ${x - rx * .8} ${y + ry * .6} ${x - rx} ${y + 10} Z" fill="#8a857c" opacity=".35"/>
                    <path d="M${x - rx * .6} ${y - ry * .3} q ${rx * .4} ${-ry * .3} ${rx * .9} ${-ry * .1}" stroke="#3f6b4a" stroke-opacity=".3" stroke-width="6" fill="none" stroke-linecap="round"/>`;
            }).join("");
            return `<g opacity=".9">${sulcos}</g>${aneis}`;
        }
    },
    {
        nome: "14 · Nuvens douradas 金雲", desc: "Padrão kumo em dourado, estilo biombo antigo",
        svg() {
            const nuvem = (x, y) => `<path d="M${x} ${y} h70 a16 16 0 0 0 0 -32 a22 22 0 0 0 -40 -10 a18 18 0 0 0 -34 8 a14 14 0 0 0 4 34 Z" fill="#e9d9a6" stroke="#c9a94e" stroke-width="1.5" opacity=".55"/>
                <path d="M${x + 6} ${y - 10} h52" stroke="#c9a94e" stroke-width="1.5" opacity=".5"/>`;
            return `<defs><pattern id="ku" width="240" height="160" patternUnits="userSpaceOnUse">${nuvem(20, 60)}${nuvem(140, 140)}
                <circle cx="200" cy="40" r="2" fill="#c9a94e" opacity=".5"/><circle cx="90" cy="120" r="2" fill="#c9a94e" opacity=".5"/></pattern>
                <radialGradient id="ku-v"><stop offset=".3" stop-color="${PAPEL}" stop-opacity=".85"/><stop offset="1" stop-color="${PAPEL}" stop-opacity="0"/></radialGradient></defs>
                <rect width="100%" height="100%" fill="url(#ku)"/><rect width="100%" height="100%" fill="url(#ku-v)"/>`;
        }
    },
    {
        nome: "15 · Fushimi Inari 千本鳥居", desc: "Corredor de mil torii sumindo em perspectiva",
        vb: "0 0 1600 1000",
        svg() {
            // ponto de fuga à direita do quadro; o portal da frente fica cortado na borda
            const fx = 1240, fy = 470, frente = { l: 560, h: 1150, base: 1080 };
            let portais = "";
            for (let i = 16; i >= 0; i--) {
                const s = Math.pow(0.8, i), l = frente.l * s, h = frente.h * s, base = fy + (frente.base - fy) * s;
                const w = 46 * s, op = (0.15 + 0.6 * Math.pow(s, 0.6)).toFixed(2);
                const x0 = fx - l, x1 = fx + l, topo = base - h;
                portais += `<g opacity="${op}">
                    <rect x="${x0}" y="${topo}" width="${w}" height="${h}" fill="${VERMELHO}"/>
                    <rect x="${x1 - w}" y="${topo}" width="${w}" height="${h}" fill="${VERMELHO}"/>
                    <path d="M${x0 - 50 * s} ${topo} Q ${fx} ${topo - 34 * s} ${x1 + 50 * s} ${topo} L ${x1 + 50 * s} ${topo + 26 * s} L ${x0 - 50 * s} ${topo + 26 * s} Z" fill="${TINTA}"/>
                    <rect x="${x0 - 14 * s}" y="${topo + 26 * s}" width="${2 * l + 28 * s}" height="${22 * s}" fill="${VERMELHO}"/>
                    <rect x="${x0}" y="${topo + 110 * s}" width="${2 * l}" height="${18 * s}" fill="${VERMELHO}"/></g>`;
            }
            return `<defs><radialGradient id="fi-luz" cx="${fx}" cy="${fy}" r="140" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff6e0"/><stop offset="1" stop-color="#fff6e0" stop-opacity="0"/></radialGradient>
                <linearGradient id="fi-some" x1="0" y1="0" x2="1" y2="0"><stop offset=".3" stop-color="${PAPEL}"/><stop offset=".55" stop-color="${PAPEL}" stop-opacity="0"/></linearGradient></defs>
                <circle cx="${fx}" cy="${fy}" r="140" fill="url(#fi-luz)"/>
                <g opacity=".55">${portais}</g>
                <rect width="1600" height="1000" fill="url(#fi-some)"/>`;
        }
    },
    {
        nome: "16 · Leques 扇", desc: "Leques sensu espalhados com ondas e sakura",
        vb: "0 0 1600 1000",
        svg() {
            const rand = semente(11);
            const leque = (x, y, r, ang, op, estampa) => {
                const varetas = Array.from({ length: 9 }, (_, i) => {
                    const a = (-150 + i * 15) * Math.PI / 180;
                    return `<line x1="0" y1="0" x2="${(Math.cos(a) * r).toFixed(1)}" y2="${(Math.sin(a) * r).toFixed(1)}" stroke="${TINTA}" stroke-opacity=".25" stroke-width="1.5"/>`;
                }).join("");
                const arco = (rr) => `M${(Math.cos(-150 * Math.PI / 180) * rr).toFixed(1)} ${(Math.sin(-150 * Math.PI / 180) * rr).toFixed(1)} A ${rr} ${rr} 0 0 1 ${(Math.cos(-30 * Math.PI / 180) * rr).toFixed(1)} ${(Math.sin(-30 * Math.PI / 180) * rr).toFixed(1)}`;
                return `<g transform="translate(${x} ${y}) rotate(${ang})" opacity="${op}">
                    <path d="${arco(r)} L ${(Math.cos(-30 * Math.PI / 180) * r * .35).toFixed(1)} ${(Math.sin(-30 * Math.PI / 180) * r * .35).toFixed(1)} A ${r * .35} ${r * .35} 0 0 0 ${(Math.cos(-150 * Math.PI / 180) * r * .35).toFixed(1)} ${(Math.sin(-150 * Math.PI / 180) * r * .35).toFixed(1)} Z" fill="${estampa}" stroke="${TINTA}" stroke-opacity=".3" stroke-width="2"/>
                    ${varetas}<circle r="5" fill="${TINTA}" opacity=".5"/></g>`;
            };
            return leque(200, 340, 220, -20, .35, VERMELHO) + leque(1380, 300, 260, 25, .3, "#2c4a6b") +
                leque(1260, 880, 200, -10, .28, "#c9a94e") + leque(300, 940, 160, 15, .25, "#f2b8c0") +
                Array.from({ length: 18 }, () => `<circle cx="${(rand() * 1600).toFixed(0)}" cy="${(rand() * 1000).toFixed(0)}" r="${(3 + rand() * 4).toFixed(1)}" fill="#f2b8c0" opacity=".5"/>`).join("");
        }
    },
];


const CHAVE_ARTE = "kaizen.fundo.arte";

function idDe(modelo) {
    // "Torii no lago 鳥居" -> "torii-no-lago" (o kanji e o que vem depois ficam de fora)
    return modelo.nome.split("·")[1].trim().split(/[\u3000-\u9fff+]/)[0].trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-");
}

export const ARTES = MODELOS.map((m) => ({
    id: idDe(m),
    nome: m.nome.split("·")[1].trim(),
    desc: m.desc,
    svg: m.svg,
    vb: m.vb || "0 0 1600 1000",
    ladrilho: !m.vb          // padrões repetidos: em tela grande o ladrilho não estica
}));


let camada = null;
let atual = null;


export function arteAtual() {
    return atual;
}


export function lerArteSalva() {
    try {
        const salva = localStorage.getItem(CHAVE_ARTE);
        return ARTES.some((a) => a.id === salva) ? salva : null;
    } catch (erro) {
        return null;
    }
}


/* Desenha (ou tira, com null) o desenho de fundo e lembra a escolha. */
export function definirArte(id) {
    const arte = ARTES.find((a) => a.id === id) || null;
    atual = arte ? arte.id : null;

    try {
        if (atual) localStorage.setItem(CHAVE_ARTE, atual);
        else localStorage.removeItem(CHAVE_ARTE);
    } catch (erro) {
        /* aba privada */
    }

    if (!camada) {
        camada = document.createElement("div");
        camada.id = "fundo-arte";
        camada.setAttribute("aria-hidden", "true");
        document.body.prepend(camada);
    }

    camada.innerHTML = arte
        ? `<svg xmlns="${NS}" ${arte.ladrilho ? "" : `viewBox="${arte.vb}" preserveAspectRatio="xMidYMid slice"`}>${arte.svg()}</svg>`
        : "";
}


/* Miniatura pro seletor: o mesmo desenho, encolhido. */
export function miniatura(arte) {
    // ids das <defs> ganham sufixo pra não colidir com o desenho grande
    const svg = arte.svg().replace(/id="([^"]+)"/g, 'id="$1-mini"').replace(/url\(#([^)]+)\)/g, "url(#$1-mini)");
    return `<svg xmlns="${NS}" viewBox="${arte.ladrilho ? "0 0 480 300" : arte.vb}" preserveAspectRatio="xMidYMid slice">${svg}</svg>`;
}
