/* =========================================================
   IA NESTE COMPUTADOR — confere, recomenda e instala
   ---------------------------------------------------------
   Ao abrir, pergunta ao servidor o que este computador tem
   (Ollama, modelos, memória, placa de vídeo). Se a IA já
   está pronta, mostra uma linha discreta. Se não, mostra a
   recomendação pro hardware e, com o "li e aceito", instala
   tudo sozinho (Ollama + modelo) com barra de progresso.

   No modo nuvem (celular/site) não existe servidor local:
   o cartão nem aparece.
========================================================= */


const CHAVE_MODELO_CHAT = "kaizen.chat.modelo.v1";   // a mesma do chat.js
const GB = 1024 ** 3;

const cartao = document.querySelector("#ia-local");
const abaIa = document.querySelector('[data-tela="ia"]');

let situacao = null;
let escolhido = null;
let acompanhando = null;
let listaAberta = false;      // "Trocar modelo" aberto continua aberto ao redesenhar
let aceitoMarcado = false;
let instalarAberto = false;   // com a nuvem em uso, o instalador só aparece se a pessoa pedir

if (cartao) {
    conferir();
    window.addEventListener("kaizen:servidores-mudaram", () => { if (!acompanhando) conferir(); });
}


function esc(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

const gb = (bytes) => `${(bytes / GB).toFixed(bytes < 10 * GB ? 1 : 0).replace(".", ",")} GB`;
const estrelas = (n, de = 5) => "★".repeat(n) + "☆".repeat(de - n);


async function conferir() {
    try {
        const resposta = await fetch("./api/ia/local", { cache: "no-store" });
        if (!resposta.ok) throw new Error();
        situacao = await resposta.json();
    } catch (erro) {
        cartao.hidden = true;           // modo nuvem: não há o que instalar aqui
        return;
    }
    cartao.hidden = false;
    abaIa?.classList.toggle("aba-aviso", !situacao.pronto && situacao.usa_local);
    // Sem IA, o seletor de modelo e o "IA indisponível" só repetem o que o cartão já diz.
    cartao.closest(".ia-config")?.classList.toggle("ia-sem-ia", !situacao.pronto && situacao.usa_local);
    if (!situacao.recomendado) document.querySelector("#srv-mais")?.setAttribute("open", "");
    escolhido = escolhido || situacao.recomendado || situacao.opcoes.find((o) => o.roda)?.nome || situacao.opcoes[0].nome;

    if (situacao.instalacao.ativo) {
        desenharProgresso(situacao.instalacao);
        acompanhar();
    } else {
        desenhar();
    }
}


function resumoHardware(hw) {
    const placa = hw.placa.nome
        ? `${esc(hw.placa.nome)}${hw.placa.memoria && hw.placa.acelera ? ` · ${gb(hw.placa.memoria)}` : ""}`
        : "sem placa de vídeo dedicada";
    return `
        <ul class="iai-hw">
            <li><span>Memória</span><strong>${gb(hw.memoria)}</strong></li>
            <li><span>Placa</span><strong>${placa}</strong></li>
            <li><span>Disco livre</span><strong>${gb(hw.disco_livre)}</strong></li>
        </ul>
        <p class="iai-potencia">
            <span class="iai-estrelas" aria-label="${situacao.potencia.estrelas} de 5">${estrelas(situacao.potencia.estrelas)}</span>
            ${esc(situacao.potencia.frase)}
        </p>`;
}


function desenhar() {
    const s = situacao;

    if (s.pronto) {
        const temRecomendado = !s.recomendado || s.modelos_instalados.includes(s.recomendado);
        cartao.innerHTML = `
            <p class="iai-ok"><span class="status-dot status-online"></span>
                IA instalada neste computador</p>
            ${temRecomendado ? "" : `<p class="iai-dica">O <strong>${esc(s.recomendado)}</strong> roda melhor
                no seu computador. <button type="button" class="iai-link" data-acao="abrir">Ver</button></p>`}
            <details class="iai-detalhes">
                <summary>Seu computador</summary>${resumoHardware(s.hardware)}
            </details>`;
        cartao.querySelector('[data-acao="abrir"]')?.addEventListener("click", () => {
            s.pronto = false;
            desenhar();
        });
        return;
    }

    if (!s.usa_local && !instalarAberto) {
        cartao.innerHTML = `
            <p class="iai-ok"><span class="status-dot status-online"></span>
                O chat está usando a IA na nuvem</p>
            <p class="iai-dica">Quer uma IA que roda neste computador, sem internet?
                <button type="button" class="iai-link" data-acao="instalar-aqui">Instalar aqui</button></p>`;
        cartao.querySelector('[data-acao="instalar-aqui"]').addEventListener("click", () => {
            instalarAberto = true;
            desenhar();
        });
        return;
    }

    const opcao = s.opcoes.find((o) => o.nome === escolhido);
    const total = opcao.download + (s.ollama.instalado ? 0 : s.download_ollama);
    const situacaoTexto = !s.recomendado
        ? "Neste computador a IA local fica lenta. A <strong>IA na nuvem</strong> (grátis, abaixo) funciona melhor."
        : s.ollama.instalado
            ? "O Ollama já está aqui, só falta o modelo."
            : "Ainda não tem IA aqui. O Kaizen instala tudo pra você.";

    cartao.innerHTML = `
        <h3 class="srv-titulo">IA neste computador</h3>
        <p class="iai-situacao">${situacaoTexto}</p>
        <div class="iai-escolhido">
            <strong>${esc(opcao.nome)}${opcao.nome === s.recomendado ? "<em>recomendado</em>" : ""}</strong>
            <small><span class="iai-estrelas">${estrelas(opcao.estrelas)}</span>
                ${opcao.roda ? `${esc(opcao.velocidade)} no seu PC` : "pesado demais pro seu PC"}</small>
        </div>
        <details class="iai-detalhes" id="iai-trocar" ${listaAberta ? "open" : ""}>
            <summary>Trocar modelo</summary>
            <div class="iai-modelos">
                ${s.opcoes.filter((o) => o.roda).map((o) => `
                    <label class="iai-modelo">
                        <input type="radio" name="iai-modelo" value="${esc(o.nome)}" ${o.nome === escolhido ? "checked" : ""}>
                        <span>${esc(o.nome)}</span>
                        <small><span class="iai-estrelas">${estrelas(o.estrelas)}</span> ${gb(o.download)}</small>
                    </label>`).join("")}
            </div>
        </details>
        <label class="iai-termos">
            <input type="checkbox" id="iai-aceito" ${aceitoMarcado ? "checked" : ""}>
            <span>Li e aceito os termos
                (${s.licencas.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" title="${esc(l.licenca)}">${esc(l.nome)}</a>`).join(" · ")})</span>
        </label>
        <button type="button" class="btn-primario iai-instalar" id="iai-instalar" ${aceitoMarcado ? "" : "disabled"}>
            ${s.ollama.instalado ? "Baixar o modelo" : "Instalar tudo"} · ${gb(total)}
        </button>
        <p class="est-erro" id="iai-erro" role="alert">${esc(s.instalacao.erro || "")}</p>
        ${s.recomendado ? `<p class="iai-dica">Não quer baixar nada? Use a IA na nuvem, grátis:
            <button type="button" class="iai-link" data-acao="nuvem">Entrar com o OpenRouter</button></p>` : ""}
        <details class="iai-detalhes">
            <summary>Seu computador</summary>${resumoHardware(s.hardware)}
        </details>`;

    cartao.querySelector("#iai-trocar").addEventListener("toggle", (evento) => { listaAberta = evento.target.open; });
    cartao.querySelectorAll('input[name="iai-modelo"]').forEach((radio) =>
        radio.addEventListener("change", () => { escolhido = radio.value; desenhar(); }));
    const aceito = cartao.querySelector("#iai-aceito");
    const botao = cartao.querySelector("#iai-instalar");
    aceito.addEventListener("change", () => { aceitoMarcado = aceito.checked; botao.disabled = !aceito.checked; });
    botao.addEventListener("click", instalar);
    cartao.querySelector('[data-acao="nuvem"]')?.addEventListener("click", (evento) =>
        window.dispatchEvent(new CustomEvent("kaizen:entrar-openrouter", { detail: evento.target })));
}


async function instalar() {
    const erro = cartao.querySelector("#iai-erro");
    try {
        const resposta = await fetch("./api/ia/local/instalar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ modelo: escolhido, aceito: true })
        });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.erro || `HTTP ${resposta.status}`);
        desenharProgresso(dados);
        acompanhar();
    } catch (falha) {
        erro.textContent = falha.message;
    }
}


function desenharProgresso(p) {
    const pct = p.total ? Math.min(100, Math.round((p.feito / p.total) * 100)) : null;
    cartao.innerHTML = `
        <h3 class="srv-titulo">Instalando a IA</h3>
        <p class="iai-situacao">${esc(p.texto)}</p>
        <div class="iai-barra ${pct === null ? "indeterminada" : ""}" role="progressbar"
             aria-valuemin="0" aria-valuemax="100" ${pct === null ? "" : `aria-valuenow="${pct}"`}>
            <span style="width: ${pct ?? 100}%"></span>
        </div>
        <p class="iai-dica">${pct === null ? "" : `${pct}% · ${gb(p.feito)} de ${gb(p.total)}`}</p>
        <p class="iai-dica">Pode continuar usando o Kaizen enquanto isso.</p>`;
}


function acompanhar() {
    clearInterval(acompanhando);
    acompanhando = setInterval(async () => {
        let p;
        try {
            p = await (await fetch("./api/ia/local/progresso", { cache: "no-store" })).json();
        } catch (erro) {
            return;
        }
        if (p.ativo) return desenharProgresso(p);

        clearInterval(acompanhando);
        acompanhando = null;
        if (p.concluido) {
            try { localStorage.setItem(CHAVE_MODELO_CHAT, p.modelo); } catch (erro) { /* aba privada */ }
            window.dispatchEvent(new CustomEvent("kaizen:servidores-mudaram"));
        }
        conferir();
    }, 700);
}
