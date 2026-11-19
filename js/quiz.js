/* =========================================================
   QUIZ — atividades de marcar, uma questão por vez
   ---------------------------------------------------------
   As atividades com "Questões de treino" vêm como texto na
   descrição (questões numeradas, alternativas (A) a (E) e um
   gabarito no fim). Aqui o texto vira uma prática em telas:
   ela marca uma alternativa por questão, e só no final vê o
   resultado com o gabarito e a resolução de cada uma.
========================================================= */


const CHAVE = "kaizen.quiz.v1";   // {idDoItem: {acertos, total, em}}


/* ---------- leitura do texto ---------- */

export function lerQuestoes(descricao) {

    const texto = String(descricao || "").replace(/\r/g, "");
    const inicio = texto.indexOf("Questões de treino");
    const marcaGab = "Gabarito (só olhe depois de tentar):";
    const iGab = texto.indexOf(marcaGab);

    if (inicio < 0 || iGab < 0 || iGab < inicio) return null;

    const corpo = texto.slice(texto.indexOf("\n\n", inicio) + 2, iGab).trim();
    const resto = texto.slice(iGab + marcaGab.length).trim();

    const gabaritos = new Map();
    const paragrafos = resto.split(/\n\n+/);
    let usados = 0;

    for (const par of paragrafos) {
        const m = par.match(/^(\d+)\) ([A-E])\. ([\s\S]*)$/);
        if (!m) break;
        gabaritos.set(Number(m[1]), { letra: m[2], resolucao: m[3].trim() });
        usados++;
    }

    const questoes = [];

    for (const bloco of corpo.split(/\n\n+(?=\d+\) )/)) {

        const num = bloco.match(/^(\d+)\) /);
        if (!num) return null;

        const linhas = bloco.slice(num[0].length).split("\n");
        const primeira = linhas.findIndex((l) => /^\(A\) /.test(l));
        if (primeira < 1) return null;

        const alternativas = [];

        for (let i = primeira; i < linhas.length; i++) {
            const m = linhas[i].match(/^\(([A-E])\) ([\s\S]*)$/);
            if (m) alternativas.push({ letra: m[1], texto: m[2] });
            else if (alternativas.length) alternativas[alternativas.length - 1].texto += " " + linhas[i].trim();
        }

        const gab = gabaritos.get(Number(num[1]));
        if (alternativas.length !== 5 || !gab) return null;

        questoes.push({
            enunciado: linhas.slice(0, primeira).join("\n").trim(),
            alternativas,
            certa: gab.letra,
            resolucao: gab.resolucao
        });

    }

    if (!questoes.length || questoes.length !== gabaritos.size) return null;

    return { questoes, extra: paragrafos.slice(usados).join("\n\n").trim() };

}


export function resultadoSalvo(id) {

    try {
        return JSON.parse(localStorage.getItem(CHAVE) || "{}")[id] || null;
    } catch (erro) {
        return null;
    }

}


function salvarResultado(id, acertos, total) {

    try {
        const todos = JSON.parse(localStorage.getItem(CHAVE) || "{}");
        todos[id] = { acertos, total, em: new Date().toISOString().slice(0, 10) };
        localStorage.setItem(CHAVE, JSON.stringify(todos));
    } catch (erro) { /* sem armazenamento: só não lembra */ }

}


const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));


/* ---------- a janela ---------- */

function abrir(itemId, quiz, titulo) {

    const respostas = new Array(quiz.questoes.length).fill(null);
    let atual = 0;

    const d = document.createElement("dialog");
    d.className = "quiz";
    d.setAttribute("aria-label", "Prática de questões");
    document.body.appendChild(d);

    const fechar = () => { d.close(); d.remove(); };
    d.addEventListener("cancel", (e) => { e.preventDefault(); fechar(); });

    function questao() {

        const q = quiz.questoes[atual];
        const total = quiz.questoes.length;
        const marcada = respostas[atual];
        const ultima = atual === total - 1;

        d.innerHTML = `
            <div class="quiz-topo">
                <button type="button" class="quiz-x" aria-label="Sair">✕</button>
                <div class="quiz-barra" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${atual}"><i style="width:${(atual / total) * 100}%"></i></div>
                <span class="quiz-conta">${atual + 1}/${total}</span>
            </div>
            <p class="quiz-enunciado">${esc(q.enunciado)}</p>
            <div class="quiz-opcoes" role="radiogroup">
                ${q.alternativas.map((a) => `
                    <button type="button" class="quiz-opcao${marcada === a.letra ? " marcada" : ""}" role="radio" aria-checked="${marcada === a.letra}" data-letra="${a.letra}">
                        <b>${a.letra}</b><span>${esc(a.texto)}</span>
                    </button>`).join("")}
            </div>
            <div class="quiz-rodape">
                <button type="button" class="quiz-voltar" ${atual === 0 ? "disabled" : ""}>Voltar</button>
                <button type="button" class="quiz-seguir" ${marcada ? "" : "disabled"}>${ultima ? "Ver resultado" : "Próxima"}</button>
            </div>`;

        d.querySelector(".quiz-x").onclick = fechar;
        d.querySelector(".quiz-voltar").onclick = () => { atual--; questao(); };
        d.querySelector(".quiz-seguir").onclick = () => { if (ultima) resultado(); else { atual++; questao(); } };
        d.querySelectorAll(".quiz-opcao").forEach((b) => b.onclick = () => {
            respostas[atual] = b.dataset.letra;
            d.querySelectorAll(".quiz-opcao").forEach((o) => {
                const sel = o === b;
                o.classList.toggle("marcada", sel);
                o.setAttribute("aria-checked", String(sel));
            });
            d.querySelector(".quiz-seguir").disabled = false;
        });

    }

    function resultado() {

        const total = quiz.questoes.length;
        const acertos = quiz.questoes.filter((q, i) => respostas[i] === q.certa).length;
        const nota = acertos / total;
        salvarResultado(itemId, acertos, total);

        const frase = nota === 1 ? "Perfeito! Gabarito limpo."
            : nota >= 0.8 ? "Muito bem! Falta pouco pra zerar os erros."
            : nota >= 0.6 ? "Bom caminho. Veja onde escorregou e tente de novo."
            : "Faz parte. Leia as resoluções, reveja o vídeo e refaça.";

        d.innerHTML = `
            <div class="quiz-fim${nota === 1 ? " perfeito" : ""}">
                <div class="quiz-placar"><b>${acertos}</b><span>de ${total}</span></div>
                <p class="quiz-frase">${frase}</p>
            </div>
            <ol class="quiz-revisao">
                ${quiz.questoes.map((q, i) => {
                    const certa = respostas[i] === q.certa;
                    const dela = q.alternativas.find((a) => a.letra === respostas[i]);
                    const gab = q.alternativas.find((a) => a.letra === q.certa);
                    return `<li class="${certa ? "certa" : "errada"}">
                        <p class="quiz-r-enun">${esc(q.enunciado)}</p>
                        <p class="quiz-r-linha"><span class="quiz-selo">${certa ? "✓ Acertou" : "✕ Errou"}</span> Sua resposta: <b>(${respostas[i]})</b> ${esc(dela ? dela.texto : "")}</p>
                        ${certa ? "" : `<p class="quiz-r-linha">Gabarito: <b>(${q.certa})</b> ${esc(gab ? gab.texto : "")}</p>`}
                        <p class="quiz-r-res">${esc(q.resolucao)}</p>
                    </li>`;
                }).join("")}
            </ol>
            <div class="quiz-rodape fim">
                <button type="button" class="quiz-voltar" data-acao="refazer">Refazer</button>
                <button type="button" class="quiz-seguir" data-acao="feito">Marcar atividade como feita</button>
                <button type="button" class="quiz-voltar" data-acao="fechar">Fechar</button>
            </div>`;

        d.querySelector("[data-acao=refazer]").onclick = () => { respostas.fill(null); atual = 0; questao(); };
        d.querySelector("[data-acao=fechar]").onclick = () => { fechar(); atualizarSelos(); };
        d.querySelector("[data-acao=feito]").onclick = () => {
            fechar();
            document.querySelector(`.est-marca.feito[data-item="${itemId}"][aria-pressed="false"]`)?.click();
            setTimeout(atualizarSelos, 600);
        };

        if (nota === 1) document.dispatchEvent(new CustomEvent("kaizen:uso", { detail: "quiz_perfeito" }));

    }

    questao();
    d.showModal();

}


function atualizarSelos() {

    document.querySelectorAll("[data-quiz]").forEach((botao) => {
        const r = resultadoSalvo(botao.dataset.quiz);
        const selo = botao.parentElement.querySelector(".quiz-ultimo");
        if (selo) selo.textContent = r ? `Última tentativa: ${r.acertos}/${r.total}` : "";
    });

}


document.addEventListener("click", (evento) => {

    const botao = evento.target.closest("[data-quiz]");
    if (!botao) return;

    const fonte = botao.closest(".est-item-texto")?.querySelector(".quiz-fonte");
    const quiz = lerQuestoes(fonte?.textContent || "");
    if (!quiz) return;

    abrir(botao.dataset.quiz, quiz, botao.closest(".est-item-texto")?.querySelector("a, span")?.textContent || "");

});


// pra o estudos.js saber se vale mostrar o botão
window.kaizenQuiz = { lerQuestoes, resultadoSalvo };
