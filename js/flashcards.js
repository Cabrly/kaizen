/* =========================================================
   FLASHCARDS e "O QUE A IA SABE DE VOCÊ" (aba Estudos)
   ---------------------------------------------------------
   Os cartões são gerados em segundo plano quando a pessoa
   marca ✓ numa sessão (estudos.py / js/nuvem). Aqui é só
   abrir e revisar: nada espera a IA na hora.

   Revisão espaçada: "acertei" empurra o cartão pra mais
   tarde (1, 3, 7, 14, 30 dias); "errei" traz de volta hoje.
========================================================= */


const API = "./api/estudos";
const $ = (id) => document.querySelector(`#${id}`);
const ATUALIZAR = 20000;   // ms entre olhadas no contador com a aba Estudos aberta
const GERANDO = 3000;      // ms entre olhadas com a janela aberta e cartões sendo gerados

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const estudo = { cartoes: [], posicao: 0, acertos: 0, virado: false, origem: null };

let relogioLista = null;


async function api(caminho, opcoes = {}) {

    const resposta = await fetch(API + caminho, {
        headers: { "Content-Type": "application/json" },
        ...opcoes,
        body: opcoes.body ? JSON.stringify(opcoes.body) : undefined
    });

    const documento = await resposta.json().catch(() => ({}));

    if (!resposta.ok) throw new Error(documento.erro || `HTTP ${resposta.status}`);

    return documento;

}


function esc(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]);
}


function dataCurta(iso) {
    const [, m, d] = iso.split("-").map(Number);
    return `${d} de ${MESES[m - 1]}`;
}


const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;



/* ---------- contador no botão ---------- */

async function atualizarContador() {

    try {
        const { para_hoje: n } = await api("/flashcards");
        $("fc-contador").textContent = n > 99 ? "99+" : String(n);
        $("fc-contador").hidden = !n;
    } catch (erro) {
        $("fc-contador").hidden = true;
    }

}



/* ---------- lista de conteúdos ---------- */

function mostrarLista() {
    $("fc-lista").hidden = false;
    $("fc-estudo").hidden = true;
    carregarLista();
}


async function carregarLista() {

    clearTimeout(relogioLista);

    const lista = $("fc-conteudos");
    let dados;

    try {
        dados = await api("/flashcards");
    } catch (erro) {
        lista.innerHTML = `<li class="fc-vazio">Não deu pra carregar: ${esc(erro.message)}</li>`;
        return;
    }

    const { conteudos, para_hoje: hoje } = dados;

    $("fc-revisar-hoje").textContent = hoje ? `Revisar os de hoje (${hoje})` : "Nada pra revisar hoje 🎉";
    $("fc-revisar-hoje").disabled = !hoje;
    $("fc-contador").textContent = String(hoje);
    $("fc-contador").hidden = !hoje;

    if (!conteudos.length) {
        lista.innerHTML = `<li class="fc-vazio">Ainda não tem cartões. Marque ✓ nos itens de uma sessão de estudo
            e os cartões daquele conteúdo aparecem aqui.</li>`;
        return;
    }

    lista.innerHTML = conteudos.map((c) => {

        const lado = c.situacao === "pronto"
            ? (c.para_hoje ? `<span class="fc-selo fc-selo-hoje">${c.para_hoje} pra hoje</span>`
                           : `<span class="fc-selo">${plural(c.total, "cartão", "cartões")}</span>`)
            : c.situacao === "gerando"
                ? `<span class="fc-selo fc-selo-gerando">preparando…</span>`
                : `<span class="fc-selo fc-selo-erro" title="${esc(c.erro)}">tentar de novo</span>`;

        return `<li>
            <button type="button" class="fc-conteudo" data-sessao="${c.sessao_id}" data-situacao="${c.situacao}"
                    style="--cor: ${esc(c.cor)}">
                <span class="fc-conteudo-texto">
                    <strong>${esc(c.topico)}</strong>
                    <small>${esc(c.plano_titulo || c.tema)} · ${dataCurta(c.data)}</small>
                </span>
                ${lado}
            </button>
        </li>`;

    }).join("");

    // enquanto a IA prepara algum, a lista se atualiza sozinha
    if (conteudos.some((c) => c.situacao === "gerando") && $("fc-modal").open) {
        relogioLista = setTimeout(carregarLista, GERANDO);
    }

}


async function cliqueNaLista(evento) {

    const botao = evento.target.closest(".fc-conteudo");
    if (!botao) return;

    const sessao = Number(botao.dataset.sessao);

    if (botao.dataset.situacao === "erro") {
        await api(`/flashcards/${sessao}/refazer`, { method: "POST" }).catch(() => null);
        carregarLista();
        return;
    }

    if (botao.dataset.situacao !== "pronto") return;

    const { cartoes } = await api(`/flashcards/${sessao}`);
    comecar(cartoes);

}



/* ---------- revisão ---------- */

function comecar(cartoes) {

    if (!cartoes.length) return;

    clearTimeout(relogioLista);
    Object.assign(estudo, { cartoes, posicao: 0, acertos: 0, virado: false });

    $("fc-lista").hidden = true;
    $("fc-estudo").hidden = false;
    $("fc-fim").hidden = true;
    $("fc-cartao").hidden = false;

    mostrarCartao();

}


function mostrarCartao() {

    const cartao = estudo.cartoes[estudo.posicao];

    estudo.virado = false;

    $("fc-progresso").textContent = `${estudo.posicao + 1} de ${estudo.cartoes.length}`;
    $("fc-topico").textContent = cartao.topico || "";
    $("fc-frente").textContent = cartao.frente;
    $("fc-verso").textContent = cartao.verso;
    $("fc-verso").hidden = true;
    $("fc-dica").hidden = false;
    $("fc-respostas").hidden = true;
    $("fc-cartao").classList.remove("virado");
    $("fc-cartao").focus();

}


function virar() {

    if (estudo.virado || $("fc-estudo").hidden || !$("fc-fim").hidden) return;

    estudo.virado = true;

    $("fc-verso").hidden = false;
    $("fc-dica").hidden = true;
    $("fc-respostas").hidden = false;
    $("fc-cartao").classList.add("virado");

}


async function responder(acertou) {

    if (!estudo.virado) return;

    const cartao = estudo.cartoes[estudo.posicao];
    estudo.virado = false;  // evita duplo clique contar duas vezes
    if (acertou) estudo.acertos++;

    api(`/cartoes/${cartao.id}`, { method: "PATCH", body: { acertou } }).catch(() => null);

    estudo.posicao++;

    if (estudo.posicao < estudo.cartoes.length) {
        mostrarCartao();
    } else {
        terminar();
    }

}


function terminar() {

    const total = estudo.cartoes.length;
    const erros = total - estudo.acertos;

    $("fc-cartao").hidden = true;
    $("fc-respostas").hidden = true;
    $("fc-fim").hidden = false;
    $("fc-progresso").textContent = "";
    $("fc-topico").textContent = "";

    $("fc-fim-titulo").textContent = estudo.acertos === total ? "Gabaritou! 🎉" : `${estudo.acertos} de ${total} certos`;
    $("fc-fim-texto").textContent = erros
        ? `${plural(erros, "cartão que você errou volta", "cartões que você errou voltam")} pra revisão de hoje. Os certos voltam daqui a alguns dias.`
        : "Os cartões voltam daqui a alguns dias, cada vez mais espaçados.";

    $("fc-fim-voltar").focus();

}



/* ---------- o que a IA sabe ---------- */

async function abrirPerfil() {

    const modal = $("perfil-modal");

    $("perfil-erro").textContent = "";
    $("perfil-texto").textContent = "Carregando…";
    modal.showModal();

    try {
        const { texto, sobre } = await api("/perfil");
        mostrarPerfil(texto);
        $("perfil-sobre").value = sobre || "";
    } catch (erro) {
        $("perfil-texto").textContent = "";
        $("perfil-erro").textContent = `Não deu pra carregar: ${erro.message}`;
    }

}


function mostrarPerfil(texto) {
    $("perfil-texto").textContent = texto ||
        "Ainda não tem nada aqui. Crie um plano de estudos e marque ✓ no que for estudando: a IA passa a saber o que você já viu.";
}


async function salvarPerfil(evento) {

    evento.preventDefault();
    $("perfil-erro").textContent = "";

    try {
        const { texto } = await api("/perfil", { method: "POST", body: { sobre: $("perfil-sobre").value } });
        mostrarPerfil(texto);
        $("perfil-modal").close();
    } catch (erro) {
        $("perfil-erro").textContent = `Não deu pra salvar: ${erro.message}`;
    }

}



/* ---------- ligações ---------- */

function iniciar() {

    const modal = $("fc-modal");
    const telaEstudos = $("tela-estudos");

    $("fc-abrir").addEventListener("click", () => {
        modal.showModal();
        mostrarLista();
    });

    $("fc-conteudos").addEventListener("click", cliqueNaLista);
    $("fc-revisar-hoje").addEventListener("click", async () => comecar((await api("/revisao")).cartoes));
    $("fc-cartao").addEventListener("click", virar);
    $("fc-errei").addEventListener("click", () => responder(false));
    $("fc-acertei").addEventListener("click", () => responder(true));
    $("fc-voltar").addEventListener("click", mostrarLista);
    $("fc-fim-voltar").addEventListener("click", mostrarLista);

    modal.addEventListener("keydown", (evento) => {
        if ($("fc-estudo").hidden) return;
        if (evento.key === " " || evento.key === "Enter") {
            if (!estudo.virado && evento.target.closest(".fc-cartao, #fc-estudo")) { evento.preventDefault(); virar(); }
        } else if (evento.key === "1") {
            responder(false);
        } else if (evento.key === "2") {
            responder(true);
        }
    });

    modal.addEventListener("close", () => { clearTimeout(relogioLista); atualizarContador(); });

    // ficha do pet: "revisar os cartões deste pet" (sessões de qualquer época)
    document.addEventListener("kaizen:revisar", async (evento) => {
        const listas = await Promise.all(evento.detail.sessoes.map((id) => api(`/flashcards/${id}`).then((r) => r.cartoes).catch(() => [])));
        const todos = listas.flat();
        if (!modal.open) modal.showModal();
        if (todos.length) {
            comecar(todos);
        } else {
            $("fc-lista").hidden = false;
            $("fc-estudo").hidden = true;
            await carregarLista();
            $("fc-conteudos").insertAdjacentHTML("afterbegin", `<li class="fc-vazio">Os cartões desse conteúdo estão sendo
                preparados agora. Volte em alguns segundos.</li>`);
        }
    });

    $("perfil-abrir").addEventListener("click", abrirPerfil);
    $("perfil-form").addEventListener("submit", salvarPerfil);

    document.querySelectorAll("#fc-modal [data-fechar], #perfil-modal [data-fechar]")
        .forEach((botao) => botao.addEventListener("click", () => botao.closest("dialog").close()));

    // abrir o app já põe na fila o que faltar; com a aba Estudos aberta, o contador acompanha
    atualizarContador();
    setInterval(() => {
        if (!document.hidden && !telaEstudos.hidden) atualizarContador();
    }, ATUALIZAR);

}


if ($("fc-modal") && $("tela-estudos")) iniciar();
