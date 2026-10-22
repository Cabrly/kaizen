/* =========================================================
   ESTUDOS — planos de estudo montados pela IA
   ---------------------------------------------------------
   Calendário do mês + painel do dia. Cada sessão abre ali
   mesmo com vídeo, documentação e atividades; ✓ marca como
   feito e ✕ como "não fiz" (o servidor leva o item pra
   próxima sessão do mesmo plano).

   O plano novo é um assistente de 2 passos: assunto e,
   depois, as perguntas da IA + disponibilidade.
========================================================= */


const tela =
    document.querySelector("#tela-estudos");


const API = "./api/estudos";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho",
               "agosto", "setembro", "outubro", "novembro", "dezembro"];

const DIAS_CURTOS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

const ICONES = { video: "🎥", doc: "📄", atividade: "📝" };

const NOMES_TIPO = { video: "Vídeo", doc: "Documentação", atividade: "Atividades" };

const SIGLAS_IDIOMA = { pt: "PT", en: "EN", es: "ES" };

const CHAVE_IDIOMA = "kaizen.estudos.idioma.v1";


const estado = {
    mes: inicioDoMes(new Date()),
    diaSelecionado: hojeIso(),
    sessoes: [],
    planos: [],
    abertas: new Set(),
    vigia: null
};



/* ---------- utilidades ---------- */

function hojeIso() {
    return isoDe(new Date());
}


function isoDe(data) {
    const local = new Date(data.getTime() - data.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}


function dataDe(iso) {
    const [a, m, d] = iso.split("-").map(Number);
    return new Date(a, m - 1, d);
}


function inicioDoMes(data) {
    return new Date(data.getFullYear(), data.getMonth(), 1);
}


function diaCurto(iso) {
    const d = dataDe(iso);
    return `${DIAS_CURTOS[(d.getDay() + 6) % 7]}, ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}


function diaLongo(iso) {
    const texto = dataDe(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}


function esc(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// link vindo dos dados (backup, sincronia, IA): só http(s), nunca "javascript:"
function escLink(url) {
    return /^https?:\/\//i.test(String(url ?? "").trim()) ? esc(url) : "#";
}



function duracao(minutos) {
    if (!minutos) return "";
    if (minutos < 60) return `${minutos} min`;
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}


async function api(caminho, opcoes = {}) {

    const resposta = await fetch(API + caminho, {
        headers: { "Content-Type": "application/json" },
        ...opcoes,
        body: opcoes.body ? JSON.stringify(opcoes.body) : undefined
    });

    const documento = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        throw new Error(documento.erro || `HTTP ${resposta.status}`);
    }

    return documento;

}



/* ---------- início ---------- */

function iniciarEstudos() {

    tela.querySelector("#est-mes-anterior").addEventListener("click", () => mudarMes(-1));
    tela.querySelector("#est-mes-proximo").addEventListener("click", () => mudarMes(1));

    tela.querySelector("#est-hoje").addEventListener("click", () => {
        estado.mes = inicioDoMes(new Date());
        selecionarDia(hojeIso());
        carregarCalendario();
    });

    tela.querySelector("#est-novo-plano").addEventListener("click", () => abrirAssistente());

    // pet reativado no jardim: plano novo no mesmo assunto, sabendo o que já foi estudado
    document.addEventListener("kaizen:continuar-plano", (evento) => abrirAssistente(evento.detail));
    document.addEventListener("kaizen:recarregar-estudos", () => atualizarTudo());

    // entregou ou a correção chegou (js/entregas.js): a atividade ficou feita e ganhou nota
    document.addEventListener("kaizen:entrega", async () => {
        for (const id of estado.abertas) {
            try {
                mostrarSessaoAtualizada((await api(`/sessoes/${id}`)).sessao, false);
            } catch (erro) { /* sessão sumiu: tudo bem */ }
        }
    });

    tela.querySelector("#est-calendario").addEventListener("click", (evento) => {
        const dia = evento.target.closest("[data-dia]");
        if (dia) selecionarDia(dia.dataset.dia);
    });

    tela.querySelector("#est-dia").addEventListener("click", cliqueNoDia);
    tela.querySelector("#est-planos").addEventListener("click", cliqueNosPlanos);

    iniciarAssistente();
    atualizarTudo();

}


async function atualizarTudo() {
    await Promise.all([carregarPlanos(), carregarCalendario()]);
}


function mudarMes(delta) {
    estado.mes = new Date(estado.mes.getFullYear(), estado.mes.getMonth() + delta, 1);
    carregarCalendario();
}



/* ---------- planos ---------- */

async function carregarPlanos() {

    try {
        estado.planos = (await api("/planos")).planos;
    } catch (erro) {
        estado.planos = [];
    }

    renderizarPlanos();


    /*
        Enquanto algum plano estiver sendo gerado, pergunta
        de 2 em 2 segundos. Quando terminar, recarrega tudo.
    */
    const gerando = estado.planos.some((p) => p.status === "gerando");

    if (gerando && !estado.vigia) {

        estado.vigia = setInterval(async () => {

            const antes = estado.planos.filter((p) => p.status === "gerando").length;
            await carregarPlanos();
            const depois = estado.planos.filter((p) => p.status === "gerando").length;

            if (depois < antes) {
                carregarCalendario();
            }

        }, 2000);

    } else if (!gerando && estado.vigia) {

        clearInterval(estado.vigia);
        estado.vigia = null;

    }

}


function renderizarPlanos() {

    const lista = tela.querySelector("#est-planos");

    if (estado.planos.length === 0) {
        lista.innerHTML = "";
        return;
    }


    lista.innerHTML = estado.planos.map((p) => {

        const pct = p.total_itens ? Math.round((100 * p.itens_feitos) / p.total_itens) : 0;

        let corpo;

        if (p.status === "gerando") {
            corpo = `<p class="est-plano-etapa"><span class="est-girando"></span>${esc(p.etapa || "Gerando…")}</p>`;
        } else if (p.status === "erro") {
            corpo = `<p class="est-plano-erro">Não deu certo: ${esc(p.erro)}</p>
                <button type="button" class="btn-secundario est-refazer" data-refazer-plano="${p.id}">↻ Tentar de novo</button>`;
        } else {
            corpo = `
                <div class="est-progresso"><div style="width:${pct}%; background:${esc(p.cor)}"></div></div>
                <p class="est-plano-info">${pct}% · ${DIAS_CURTOS.filter((_, i) => p.dias.includes(i)).join(", ")} · ${duracao(p.minutos)}
                · <span class="est-idioma" title="Idioma dos materiais">${SIGLAS_IDIOMA[p.idioma] || "PT"}</span>
                ${p.ultima_data ? ` · até ${diaCurto(p.ultima_data)}` : ""}</p>`;
        }


        return `
            <article class="est-plano est-plano-${p.status}" style="--cor:${esc(p.cor)}" data-plano="${p.id}">
                <header>
                    <h3 title="${esc(p.titulo || p.tema)}">${esc(p.titulo || p.tema)}</h3>
                    ${p.status === "pronto" ? `
                    <button type="button" class="est-icone" data-agenda-plano="${p.id}"
                            title="Pôr as sessões na agenda do celular" aria-label="Pôr ${esc(p.tema)} na agenda">📅</button>
                    <button type="button" class="est-icone" data-compartilhar-plano="${p.id}"
                            title="Compartilhar com a turma" aria-label="Compartilhar ${esc(p.tema)}">🔗</button>` : ""}
                    <button type="button" class="est-icone" data-excluir-plano="${p.id}"
                            title="Excluir plano" aria-label="Excluir plano ${esc(p.tema)}">✕</button>
                </header>
                ${corpo}
            </article>`;

    }).join("");

    // os pets (js/pets.js) põem o bichinho de cada plano aqui
    document.dispatchEvent(new CustomEvent("kaizen:planos", { detail: { planos: estado.planos } }));

}


async function cliqueNosPlanos(evento) {

    // deu erro: gera de novo com as mesmas respostas, sem refazer o assistente
    const refazer = evento.target.closest("[data-refazer-plano]");

    if (refazer) {
        refazer.disabled = true;
        try {
            await api(`/planos/${refazer.dataset.refazerPlano}/refazer`, { method: "POST" });
        } catch (erro) {
            alert(`Não consegui tentar de novo: ${erro.message}`);
        }
        atualizarTudo();
        return;
    }

    const botao = evento.target.closest("[data-excluir-plano]");

    if (!botao) return;

    const plano = estado.planos.find((p) => p.id === Number(botao.dataset.excluirPlano));

    if (!confirm(`Excluir o plano "${plano?.titulo || plano?.tema}" e todas as sessões dele?`)) {
        return;
    }

    await api(`/planos/${botao.dataset.excluirPlano}`, { method: "DELETE" });
    atualizarTudo();

}



/* ---------- calendário ---------- */

function diasDaGrade() {

    // semana começando na segunda
    const primeiro = estado.mes;
    const recuo = (primeiro.getDay() + 6) % 7;
    const inicio = new Date(primeiro.getFullYear(), primeiro.getMonth(), 1 - recuo);

    return Array.from({ length: 42 }, (_, i) =>
        new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i));

}


async function carregarCalendario() {

    const dias = diasDaGrade();

    tela.querySelector("#est-titulo-mes").textContent =
        `${MESES[estado.mes.getMonth()]} ${estado.mes.getFullYear()}`;

    try {
        const { sessoes } = await api(`/calendario?inicio=${isoDe(dias[0])}&fim=${isoDe(dias[41])}`);
        estado.sessoes = sessoes;
    } catch (erro) {
        estado.sessoes = [];
    }

    renderizarCalendario(dias);
    renderizarDia();

}


function renderizarCalendario(dias) {

    const hoje = hojeIso();
    const porDia = {};

    estado.sessoes.forEach((s) => {
        (porDia[s.data] ||= []).push(s);
    });


    const cabecalho = DIAS_CURTOS.map((d) => `<div class="est-cal-cab">${d}</div>`).join("");

    const celulas = dias.map((data) => {

        const iso = isoDe(data);
        const doDia = porDia[iso] || [];
        const atrasado = iso < hoje && doDia.some((s) => s.feitos + s.nao_feitos < s.total);
        const completo = doDia.length > 0 && doDia.every((s) => s.total > 0 && s.feitos + s.nao_feitos >= s.total);

        const classes = [
            "est-cal-dia",
            data.getMonth() !== estado.mes.getMonth() ? "fora" : "",
            iso === hoje ? "hoje" : "",
            iso === estado.diaSelecionado ? "selecionado" : "",
            atrasado ? "atrasado" : "",
            completo ? "completo" : ""
        ].join(" ");


        const marcas = doDia.slice(0, 2).map((s) =>
            `<span class="est-cal-sessao" style="--cor:${esc(s.cor)}">${esc(s.topico)}</span>`).join("");

        const extra = doDia.length > 2 ? `<span class="est-cal-mais">+${doDia.length - 2}</span>` : "";


        return `
            <button type="button" class="${classes}" data-dia="${iso}"
                    aria-label="${diaLongo(iso)}${doDia.length ? `, ${doDia.length} sessão(ões)` : ""}">
                <span class="est-cal-num">${data.getDate()}</span>
                ${marcas}${extra}
            </button>`;

    }).join("");


    tela.querySelector("#est-calendario").innerHTML = cabecalho + celulas;

}


function selecionarDia(iso) {

    estado.diaSelecionado = iso;

    const data = dataDe(iso);

    if (data.getMonth() !== estado.mes.getMonth() || data.getFullYear() !== estado.mes.getFullYear()) {
        estado.mes = inicioDoMes(data);
        carregarCalendario();
        return;
    }

    tela.querySelectorAll(".est-cal-dia.selecionado").forEach((el) => el.classList.remove("selecionado"));
    tela.querySelector(`[data-dia="${iso}"]`)?.classList.add("selecionado");

    renderizarDia();

}



/* ---------- painel do dia ---------- */

async function renderizarDia() {

    const painel = tela.querySelector("#est-dia");
    const iso = estado.diaSelecionado;
    const doDia = estado.sessoes.filter((s) => s.data === iso);


    let html = `<h3 class="est-dia-titulo">${esc(diaLongo(iso))}${iso === hojeIso() ? " <span>hoje</span>" : ""}</h3>`;


    if (doDia.length === 0) {

        html += `<div class="est-vazio"><p>Nada de estudo neste dia.</p>${await dicaProxima(iso)}</div>`;
        painel.innerHTML = html;
        return;

    }


    painel.innerHTML = html + doDia.map((s) => `
        <article class="est-sessao" data-sessao="${s.id}" style="--cor:${esc(s.cor)}">
            <button type="button" class="est-sessao-cab" data-abrir-sessao="${s.id}"
                    aria-expanded="${estado.abertas.has(s.id)}">
                <span class="est-sessao-tema">${esc(s.tema)}${s.horario ? ` · ${esc(s.horario)}` : ""}</span>
                <strong>${esc(s.topico)}</strong>
                <span class="est-sessao-progresso">${s.feitos}/${s.total}</span>
            </button>
            <div class="est-sessao-corpo"></div>
        </article>`).join("");


    for (const id of estado.abertas) {
        if (doDia.some((s) => s.id === id)) {
            await abrirSessao(id);
        }
    }

}


async function dicaProxima(iso) {

    /*
        Dia vazio aponta a próxima sessão — um clique e você
        está nela, mesmo que seja em outro mês.
    */
    const futuras = estado.sessoes.filter((s) => s.data > iso);

    let proxima = futuras[0];

    if (!proxima) {
        try {
            const fim = isoDe(new Date(dataDe(iso).getTime() + 120 * 86400000));
            const { sessoes } = await api(`/calendario?inicio=${iso}&fim=${fim}`);
            proxima = sessoes.find((s) => s.data > iso);
        } catch (erro) {
            proxima = null;
        }
    }

    if (!proxima) {
        return estado.planos.length
            ? ""
            : `<p class="est-sutil">Crie um plano em <b>+ Novo plano</b> e a IA monta sua rotina.</p>`;
    }

    return `<button type="button" class="btn-secundario" data-ir-dia="${proxima.data}">
                Próxima: ${diaCurto(proxima.data)} — ${esc(proxima.topico)} →
            </button>`;

}


async function abrirSessao(id) {

    const artigo = tela.querySelector(`[data-sessao="${id}"]`);

    if (!artigo) return;

    const { sessao } = await api(`/sessoes/${id}`);

    artigo.classList.add("aberta");
    artigo.querySelector(".est-sessao-cab").setAttribute("aria-expanded", "true");
    artigo.querySelector(".est-sessao-corpo").innerHTML = corpoSessao(sessao);

    atualizarResumo(sessao);

}


function corpoSessao(sessao) {

    const grupos = { video: [], doc: [], atividade: [] };

    sessao.itens.forEach((item) => grupos[item.tipo].push(item));


    const blocos = Object.entries(grupos)
        .filter(([, itens]) => itens.length)
        .map(([tipo, itens]) => `
            <section class="est-grupo">
                <h4>${ICONES[tipo]} ${NOMES_TIPO[tipo]}</h4>
                ${itens.map(linhaItem).join("")}
            </section>`)
        .join("");


    const temPendente = sessao.itens.some((i) => i.estado === "pendente");
    const passou = sessao.data < hojeIso();


    return `
        ${sessao.objetivo ? `<p class="est-objetivo">${esc(sessao.objetivo)}</p>` : ""}
        ${blocos || `<p class="est-sutil">Sessão sem itens.</p>`}
        ${passou && temPendente ? `
            <button type="button" class="btn-secundario est-adiar" data-adiar="${sessao.id}">
                Passar o que ficou pendente pra próxima sessão
            </button>` : ""}`;

}


function linhaItem(item) {

    const titulo = item.url
        ? `<a href="${escLink(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.titulo)}</a>`
        : `<span>${esc(item.titulo)}</span>`;

    const meta = [
        item.fonte ? esc(item.fonte) : "",
        item.minutos ? duracao(item.minutos) : ""
    ].filter(Boolean).join(" · ");

    const avisos = [
        item.veio_de ? `<span class="est-aviso veio">↩ veio de ${diaCurto(item.veio_de)}</span>` : "",
        item.foi_para ? `<span class="est-aviso foi">↪ foi para ${diaCurto(item.foi_para)}</span>` : ""
    ].join("");


    return `
        <div class="est-item est-item-${item.estado}">
            <div class="est-item-texto">
                ${titulo}
                ${item.descricao ? `<p>${esc(item.descricao)}</p>` : ""}
                ${meta || avisos ? `<small>${meta}${avisos}</small>` : ""}
                ${item.tipo === "atividade" ? botaoEntrega(item) : ""}
            </div>
            <div class="est-item-acoes">
                <button type="button" class="est-marca feito" data-item="${item.id}" data-estado="feito"
                        aria-pressed="${item.estado === "feito"}" title="Feito">✓</button>
                <button type="button" class="est-marca nao" data-item="${item.id}" data-estado="nao-feito"
                        aria-pressed="${item.estado === "nao-feito"}" title="Não fiz — passa pra próxima sessão">✕</button>
            </div>
        </div>`;

}


// entrega e correção da atividade (a janela é do js/entregas.js)
function botaoEntrega(item) {

    const e = item.entrega;
    const selo = !e ? ""
        : e.situacao === "corrigida" ? `<span class="est-nota est-nota-${e.nota >= 7 ? "boa" : e.nota >= 5 ? "media" : "baixa"}">Nota ${e.nota}/10</span>`
        : ["na-fila", "corrigindo"].includes(e.situacao) ? `<span class="est-nota">Corrigindo…</span>`
        : `<span class="est-nota">Entregue</span>`;

    return `<button type="button" class="est-entregar" data-entregar="${item.id}">
                ${e ? `📎 ${e.entregas > 1 ? `${e.entregas} entregas` : "Ver entrega"}` : "📤 Entregar"} ${selo}
            </button>`;

}


function atualizarResumo(sessao) {

    // mantém o "2/4" do cabeçalho e o calendário em dia sem recarregar tudo
    const resumo = estado.sessoes.find((s) => s.id === sessao.id);

    if (!resumo) return;

    resumo.total = sessao.itens.length;
    resumo.feitos = sessao.itens.filter((i) => i.estado === "feito").length;
    resumo.nao_feitos = sessao.itens.filter((i) => i.estado === "nao-feito").length;

    const contador = tela.querySelector(`[data-sessao="${sessao.id}"] .est-sessao-progresso`);

    if (contador) {
        contador.textContent = `${resumo.feitos}/${resumo.total}`;
    }

}


async function cliqueNoDia(evento) {

    const irDia = evento.target.closest("[data-ir-dia]");

    if (irDia) {
        selecionarDia(irDia.dataset.irDia);
        return;
    }


    const cabecalho = evento.target.closest("[data-abrir-sessao]");

    if (cabecalho) {

        const id = Number(cabecalho.dataset.abrirSessao);
        const artigo = cabecalho.closest(".est-sessao");

        if (estado.abertas.has(id)) {
            estado.abertas.delete(id);
            artigo.classList.remove("aberta");
            cabecalho.setAttribute("aria-expanded", "false");
        } else {
            estado.abertas.add(id);
            await abrirSessao(id);
        }

        return;

    }


    const marca = evento.target.closest("[data-item]");

    if (marca) {

        // clicar de novo no estado atual desmarca (volta pra pendente)
        const novo = marca.getAttribute("aria-pressed") === "true" ? "pendente" : marca.dataset.estado;

        marca.closest(".est-item").classList.add("salvando");

        try {
            const { sessao } = await api(`/itens/${marca.dataset.item}`, { method: "PATCH", body: { estado: novo } });
            mostrarSessaoAtualizada(sessao, novo === "nao-feito");
        } catch (erro) {
            alert(`Não consegui salvar: ${erro.message}`);
            marca.closest(".est-item")?.classList.remove("salvando");
        }

        return;

    }


    const adiar = evento.target.closest("[data-adiar]");

    if (adiar) {
        const { sessao } = await api(`/sessoes/${adiar.dataset.adiar}/adiar`, { method: "POST" });
        mostrarSessaoAtualizada(sessao, true);
    }

}


function mostrarSessaoAtualizada(sessao, mexeuEmOutrosDias) {

    const artigo = tela.querySelector(`[data-sessao="${sessao.id}"]`);

    if (artigo) {
        artigo.querySelector(".est-sessao-corpo").innerHTML = corpoSessao(sessao);
    }

    atualizarResumo(sessao);


    if (mexeuEmOutrosDias) {
        // um item foi (ou voltou) pra outra sessão: o calendário muda
        carregarCalendario();
    } else {
        renderizarCalendario(diasDaGrade());
        tela.querySelector(`[data-dia="${estado.diaSelecionado}"]`)?.classList.add("selecionado");
    }

    carregarPlanos();

}



/* =========================================================
   ASSISTENTE DE PLANO NOVO (2 passos)
========================================================= */

const assistente = {
    dialogo: null,
    perguntas: [],
    motores: [],
    aviso: "",
    continuaDe: null   // plano que este continua (pet reativado)
};


function iniciarAssistente() {

    assistente.dialogo = document.querySelector("#est-assistente");

    const d = assistente.dialogo;


    d.querySelector("#est-form-tema").addEventListener("submit", (evento) => {
        evento.preventDefault();
        irParaPerguntas();
    });


    d.querySelector("#est-form-plano").addEventListener("submit", (evento) => {
        evento.preventDefault();
        gerarPlano();
    });


    d.querySelectorAll("[data-fechar]").forEach((botao) =>
        botao.addEventListener("click", () => d.close()));

    d.querySelector("#est-voltar").addEventListener("click", () => mostrarPasso(1));


    // atalho pra tela de servidores, na aba do assistente
    d.querySelector("#est-config-ia").addEventListener("click", () => {
        d.close();
        document.querySelector('.nav-tab[data-tela="ia"]')?.click();
        document.querySelector("#srv-url")?.focus();
    });


    // chips: um clique escolhe (nos dias, liga/desliga)
    d.addEventListener("click", (evento) => {

        const chip = evento.target.closest(".est-chip");

        if (!chip) return;

        const grupo = chip.closest("[data-grupo]");

        if (grupo.dataset.multiplo === "sim") {
            chip.classList.toggle("ativo");
        } else {
            grupo.querySelectorAll(".est-chip").forEach((c) => c.classList.toggle("ativo", c === chip));
            const outro = grupo.querySelector(".est-outra");
            if (outro) outro.value = "";
        }

        atualizarResumoPlano();

    });


    d.addEventListener("input", (evento) => {

        if (evento.target.classList.contains("est-outra") && evento.target.value) {
            evento.target.closest("[data-grupo]").querySelectorAll(".est-chip")
                .forEach((c) => c.classList.remove("ativo"));
        }

        atualizarResumoPlano();

    });

}


async function abrirAssistente({ planoId = null, tema = "", aviso = "" } = {}) {

    const d = assistente.dialogo;

    d.querySelector("#est-form-tema").reset();
    d.querySelector("#est-inicio").value = hojeIso();

    assistente.continuaDe = planoId;
    d.querySelector("#est-tema").value = tema;
    d.querySelector("#est-continuacao").hidden = !planoId;
    d.querySelector("#est-continuacao").textContent = aviso;

    try {
        d.querySelector("#est-idioma").value = localStorage.getItem(CHAVE_IDIOMA) || "pt";
    } catch (erro) {
        /* sem localStorage: fica o padrão (português) */
    }
    d.querySelector("#est-erro-tema").textContent = assistente.aviso || "";

    mostrarPasso(1);
    d.showModal();
    d.querySelector("#est-tema").focus();


    /*
        Recarrega os modelos a cada abertura: um servidor pode ter
        caído ou voltado desde a última vez. Agrupa por servidor.
    */
    try {

        const { motores, padrao, recomendado } = await api("/motores");
        const seletor = d.querySelector("#est-motor");
        const escolhido = seletor.value;
        const grupos = {};

        motores.forEach((m) => {
            (grupos[m.servidor] ||= []).push(m);
        });

        assistente.motores = motores;

        seletor.innerHTML = Object.entries(grupos).map(([servidor, lista]) => `
            <optgroup label="${esc(servidor)}">
                ${lista.map((m) => `<option value="${esc(m.id)}">${esc(m.modelo)}${m.recomendado ? " — recomendado" : ""}</option>`).join("")}
            </optgroup>`).join("");

        seletor.value = motores.some((m) => m.id === escolhido) ? escolhido : padrao;


        // quem baixou o projeto agora pode ainda não ter o modelo
        if (motores.length === 0) {
            assistente.aviso =
                `Nenhuma IA encontrada. Instale o Ollama (ollama.com) e rode: ollama pull ${recomendado}, ` +
                `ou cadastre outro computador em "Configurar onde a IA roda".`;
        } else if (!motores.some((m) => m.recomendado)) {
            assistente.aviso =
                `Dica: o modelo recomendado é o ${recomendado}. Instale com: ollama pull ${recomendado}`;
        } else {
            assistente.aviso = "";
        }

        d.querySelector("#est-erro-tema").textContent = assistente.aviso;

    } catch (erro) {
        d.querySelector("#est-erro-tema").textContent = "Não consegui listar os modelos de IA.";
    }

}


function mostrarPasso(numero) {

    const d = assistente.dialogo;

    d.querySelector("#est-form-tema").hidden = numero !== 1;
    d.querySelector("#est-form-plano").hidden = numero !== 2;

}


async function irParaPerguntas() {

    const d = assistente.dialogo;
    const tema = d.querySelector("#est-tema").value.trim();
    const botao = d.querySelector("#est-continuar");

    if (!tema) return;


    botao.disabled = true;
    botao.textContent = "Pensando em perguntas…";
    d.querySelector("#est-erro-tema").textContent = "";


    try {

        const { perguntas } = await api("/perguntas", {
            method: "POST",
            body: { tema, motor: d.querySelector("#est-motor").value, continua_de: assistente.continuaDe }
        });

        assistente.perguntas = perguntas;

    } catch (erro) {

        // sem perguntas o plano sai igual, só menos personalizado
        assistente.perguntas = [];

    } finally {

        botao.disabled = false;
        botao.textContent = "Continuar";

    }


    d.querySelector("#est-subtitulo").textContent = tema;

    d.querySelector("#est-perguntas").innerHTML = assistente.perguntas.map((p, i) => `
        <div class="est-pergunta" data-grupo="pergunta-${i}">
            <span class="est-rotulo">${esc(p.pergunta)}</span>
            <div class="est-chips">
                ${p.opcoes.map((o) => `<button type="button" class="est-chip">${esc(o)}</button>`).join("")}
                <input class="est-outra" placeholder="Outra resposta…" aria-label="Outra resposta">
            </div>
        </div>`).join("");


    atualizarResumoPlano();
    mostrarPasso(2);

}


function lerDisponibilidade() {

    const d = assistente.dialogo;

    const valor = (grupo) => d.querySelector(`[data-grupo="${grupo}"] .est-chip.ativo`)?.dataset.valor;

    return {
        dias: [...d.querySelectorAll('[data-grupo="dias"] .est-chip.ativo')].map((c) => Number(c.dataset.valor)),
        minutos: Number(valor("minutos") || 60),
        semanas: Number(valor("semanas") || 4),
        inicio: d.querySelector("#est-inicio").value || hojeIso(),
        horario: d.querySelector("#est-horario").value || null
    };

}


function atualizarResumoPlano() {

    const d = assistente.dialogo;
    const disp = lerDisponibilidade();
    const resumo = d.querySelector("#est-resumo");
    const botao = d.querySelector("#est-gerar");

    if (disp.dias.length === 0) {
        resumo.textContent = "Escolha pelo menos um dia.";
        botao.disabled = true;
        return;
    }


    // mesma conta do servidor: N-ésimo dia de estudo a partir do início
    const total = disp.dias.length * disp.semanas;
    let atual = dataDe(disp.inicio);
    let contados = 0;
    let ultimo = atual;

    while (contados < total) {
        if (disp.dias.includes((atual.getDay() + 6) % 7)) {
            contados += 1;
            ultimo = atual;
        }
        atual = new Date(atual.getFullYear(), atual.getMonth(), atual.getDate() + 1);
    }


    resumo.textContent =
        `${total} sessões de ${duracao(disp.minutos)} · termina em ${diaCurto(isoDe(ultimo))}`;

    botao.disabled = false;

}


async function gerarPlano() {

    const d = assistente.dialogo;
    const botao = d.querySelector("#est-gerar");

    const respostas = assistente.perguntas.map((p, i) => {
        const grupo = d.querySelector(`[data-grupo="pergunta-${i}"]`);
        const resposta = grupo.querySelector(".est-chip.ativo")?.textContent.trim()
            || grupo.querySelector(".est-outra").value.trim();
        return { pergunta: p.pergunta, resposta };
    });


    botao.disabled = true;

    const idioma = d.querySelector("#est-idioma").value;

    try {
        localStorage.setItem(CHAVE_IDIOMA, idioma);
    } catch (erro) {
        /* nada a fazer */
    }


    try {

        const { plano } = await api("/planos", {
            method: "POST",
            body: {
                tema: d.querySelector("#est-tema").value.trim(),
                motor: d.querySelector("#est-motor").value,
                idioma,
                respostas,
                pai_id: assistente.continuaDe,
                ...lerDisponibilidade()
            }
        });

        d.close();
        carregarPlanos();

        // com os pets ligados, a pessoa adota o bichinho enquanto a IA monta o plano
        document.dispatchEvent(new CustomEvent("kaizen:plano-criado", { detail: { plano } }));

    } catch (erro) {

        d.querySelector("#est-resumo").textContent = `Erro: ${erro.message}`;

    } finally {

        botao.disabled = false;

    }

}



/*
    Começa só no fim: as funções e constantes acima
    (como "assistente") já existem quando isto roda.
*/
if (tela) {
    iniciarEstudos();
}
