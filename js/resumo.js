/* =========================================================
   RESUMO DA SEMANA — o que você estudou nos últimos 7 dias
   ---------------------------------------------------------
   Sessões feitas, tempo, entregas e notas, flashcards, as
   dificuldades que as correções acharam e o que fazer na
   próxima semana. Tudo montado aqui com os dados que já
   existem (/api/backup?leve=1 e as entregas), sem IA: vale
   no PC, no celular e sem nenhuma IA conectada.

   Abre pelo botão 📊 na aba Estudos e sozinho uma vez por
   semana (domingo ou segunda), se teve estudo na semana.
========================================================= */


const VISTO = "kaizen.resumo.visto";   // segunda-feira da semana em que já abriu sozinho

const modal = document.querySelector("#resumo-modal");
const corpo = document.querySelector("#resumo-corpo");
const botaoAbrir = document.querySelector("#resumo-abrir");



/* ---------- datas ---------- */

function hojeIso() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}


function somarDias(iso, dias) {
    const [a, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}


function diaDaSemana(iso) {
    const [a, m, d] = iso.split("-").map(Number);
    return (new Date(Date.UTC(a, m - 1, d)).getUTCDay() + 6) % 7;   // 0 = segunda
}


function diaCurto(iso) {
    const [a, m, d] = iso.split("-").map(Number);
    return new Date(a, m - 1, d).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "");
}


function esc(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]);
}


async function api(caminho) {
    const resposta = await fetch(`./api${caminho}`);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    return resposta.json();
}



/* ---------- as contas ---------- */

async function calcular() {

    const { estudos } = await api("/backup?leve=1");
    const { planos, sessoes, itens } = estudos;
    const flashcards = estudos.flashcards || [];

    const hoje = hojeIso();
    const desde = somarDias(hoje, -6);
    const ate = somarDias(hoje, 7);

    const itensDa = (id) => itens.filter((i) => i.sessao_id === id);
    // conta como estudada se tem item feito, ou se a cópia de um "não fiz" foi feita depois
    const feito = (i) => i.estado === "feito" || itens.some((c) => c.origem_id === i.id && c.estado === "feito");
    const estudada = (s) => itensDa(s.id).some(feito);
    const originais = sessoes.filter((s) => !s.extra);
    const planoDe = (s) => planos.find((p) => p.id === s.plano_id);

    const daSemana = originais.filter((s) => s.data >= desde && s.data <= hoje);
    const estudadas = daSemana.filter(estudada);
    const itensFeitos = estudadas.flatMap((s) => itensDa(s.id).filter(feito));
    const minutos = itensFeitos.reduce((soma, i) => soma + (i.minutos || 0), 0);

    const atrasadas = originais
        .filter((s) => s.data < desde && !estudada(s) && itensDa(s.id).some((i) => i.estado === "pendente"))
        .concat(daSemana.filter((s) => s.data < hoje && !estudada(s)))
        .sort((a, b) => a.data.localeCompare(b.data));
    const proximas = originais.filter((s) => s.data > hoje && s.data <= ate).sort((a, b) => a.data.localeCompare(b.data));

    let entregas = [];
    if (planos.length) {
        try {
            entregas = (await api(`/estudos/entregas?planos=${planos.map((p) => p.id).join(",")}`)).entregas;
        } catch (erro) {
            /* sem entregas, o resumo sai sem essa parte */
        }
    }
    const daSemanaEntregas = entregas.filter((e) => (e.criado_em || "").slice(0, 10) >= desde);
    const notas = daSemanaEntregas.filter((e) => e.situacao === "corrigida" && Number.isFinite(e.nota));
    const media = notas.length ? notas.reduce((s, e) => s + e.nota, 0) / notas.length : null;
    const piorNota = notas.slice().sort((a, b) => a.nota - b.nota)[0];

    // dificuldades das correções dos últimos 30 dias, as que mais aparecem
    const contagem = new Map();
    entregas.filter((e) => (e.criado_em || "").slice(0, 10) >= somarDias(hoje, -30))
        .flatMap((e) => e.correcao?.dificuldades || [])
        .forEach((d) => contagem.set(d.toLowerCase(), (contagem.get(d.toLowerCase()) || 0) + 1));
    const dificuldades = [...contagem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([d]) => d);

    const cartoesHoje = flashcards.filter((f) => f.revisar_em <= hoje).length;
    const dominados = flashcards.filter((f) => f.caixa >= 4).length;

    return {
        desde, hoje, daSemana, estudadas, itensFeitos, minutos, atrasadas, proximas,
        entregas: daSemanaEntregas, media, piorNota, dificuldades, cartoesHoje, dominados,
        totalCartoes: flashcards.filter((f) => f.revisar_em !== "9999-12-31").length, planoDe,
        temPlanos: planos.some((p) => p.status === "pronto")
    };

}


/* As dicas saem das contas, nesta ordem de prioridade; no máximo três. */
function sugestoes(r) {

    const lista = [];
    const antiga = r.atrasadas[0];
    const proxima = r.proximas[0];

    if (!r.estudadas.length && r.daSemana.length) {
        lista.push(`Semana parada, acontece. Volte com só 15 minutos${antiga ? `, começando por <strong>${esc(antiga.topico)}</strong>` : ""}: o difícil é recomeçar.`);
    }
    if (r.atrasadas.length) {
        lista.push(`${r.atrasadas.length === 1 ? "Ficou 1 sessão" : `Ficaram ${r.atrasadas.length} sessões`} pra trás. ` +
                   `Na sessão, o "não fiz" joga o que faltou pro próximo dia de estudo, sem acumular culpa.`);
    }
    if (r.dificuldades.length) {
        lista.push(`As correções apontaram dificuldade em <strong>${r.dificuldades.map(esc).join("</strong>, <strong>")}</strong>. ` +
                   "Peça no Assistente IA uma explicação com exemplos e um exercício curto.");
    }
    if (r.piorNota && r.piorNota.nota < 6) {
        lista.push(`A atividade "${esc(r.piorNota.atividade)}" ficou com ${r.piorNota.nota}/10. Releia a correção, refaça e entregue de novo: a nota nova substitui a antiga.`);
    }
    if (r.cartoesHoje) {
        lista.push(`${r.cartoesHoje} ${r.cartoesHoje === 1 ? "flashcard espera" : "flashcards esperam"} revisão. Cinco minutos resolvem e é o que mais fixa o conteúdo.`);
    }
    if (!lista.length && r.estudadas.length) {
        lista.push(`Semana redonda! ${proxima ? `A próxima é <strong>${esc(proxima.topico)}</strong>, ${diaCurto(proxima.data)}.` : "Que tal um plano novo pra continuar?"}`);
    }
    if (!lista.length) {
        lista.push(proxima ? `Sua próxima sessão é <strong>${esc(proxima.topico)}</strong>, ${diaCurto(proxima.data)}.` : "Crie um plano pra começar: o resumo aparece aqui toda semana.");
    }

    return lista.slice(0, 3);

}



/* ---------- a janela ---------- */

function horas(minutos) {
    const h = Math.floor(minutos / 60);
    return h ? `${h}h${String(minutos % 60).padStart(2, "0")}` : `${minutos} min`;
}


function bloco(numero, rotulo, detalhe = "") {
    return `<div class="resumo-bloco"><strong>${numero}</strong><span>${rotulo}</span>${detalhe ? `<small>${detalhe}</small>` : ""}</div>`;
}


function desenhar(r) {

    const feitas = r.estudadas.length;
    const total = r.daSemana.length;

    corpo.innerHTML = `
        <p class="resumo-periodo">${diaCurto(r.desde)} a ${diaCurto(r.hoje)}</p>

        <div class="resumo-blocos">
            ${bloco(`${feitas}<small>/${total}</small>`, "sessões estudadas", total ? `${Math.round((100 * feitas) / total)}% do planejado` : "nada agendado")}
            ${bloco(r.itensFeitos.length, "itens concluídos", r.minutos ? `${horas(r.minutos)} de vídeo e atividade` : "")}
            ${bloco(r.entregas.length, r.entregas.length === 1 ? "entrega" : "entregas", r.media !== null ? `média ${r.media.toFixed(1).replace(".", ",")}` : "sem nota ainda")}
            ${bloco(r.dominados, "cartões dominados", `${r.cartoesHoje} pra revisar hoje`)}
        </div>

        ${r.estudadas.length ? `
        <h3 class="resumo-sub">O que você estudou</h3>
        <ul class="resumo-lista">
            ${r.estudadas.map((s) => `<li><span class="resumo-ponto" style="background:${esc(r.planoDe(s)?.cor)}"></span>
                <span>${esc(s.topico)}</span><small>${diaCurto(s.data)}</small></li>`).join("")}
        </ul>` : ""}

        <h3 class="resumo-sub">Pra próxima semana</h3>
        <ul class="resumo-dicas">${sugestoes(r).map((d) => `<li>${d}</li>`).join("")}</ul>

        ${r.proximas.length ? `<p class="resumo-proximas">${r.proximas.length} ${r.proximas.length === 1 ? "sessão agendada" : "sessões agendadas"} nos próximos 7 dias.</p>` : ""}`;

}


async function abrir() {

    corpo.innerHTML = `<p class="resumo-periodo">Somando a sua semana…</p>`;
    if (!modal.open) modal.showModal();

    try {
        desenhar(await calcular());
    } catch (erro) {
        corpo.innerHTML = `<p class="est-erro">Não consegui montar o resumo: ${esc(erro.message)}</p>`;
    }

}


/* Domingo ou segunda, uma vez por semana, se teve estudo agendado na semana. */
async function talvezAbrirSozinho() {

    const hoje = hojeIso();
    if (![6, 0].includes(diaDaSemana(hoje)) || new URLSearchParams(location.search).has("demo")) return;

    const segunda = somarDias(hoje, -diaDaSemana(hoje));
    let visto;
    try {
        visto = localStorage.getItem(VISTO);
    } catch (erro) {
        return;
    }
    // no domingo vale a semana que está acabando; na segunda, a que acabou
    const semana = diaDaSemana(hoje) === 6 ? segunda : somarDias(segunda, -7);
    if (visto === semana) return;

    const r = await calcular().catch(() => null);
    if (!r?.temPlanos || !r.daSemana.length || document.querySelector("dialog[open]")) return;

    try {
        localStorage.setItem(VISTO, semana);
    } catch (erro) {
        /* sem storage, abre de novo na próxima vez */
    }
    desenhar(r);
    modal.showModal();

}



if (modal && corpo && botaoAbrir) {

    botaoAbrir.addEventListener("click", abrir);
    modal.querySelectorAll("[data-fechar]").forEach((botao) => botao.addEventListener("click", () => modal.close()));

    // espera o resto do app (novidades, sincronia) se ajeitar antes de decidir
    window.kaizenModo?.then(() => setTimeout(talvezAbrirSozinho, 2500));

}
