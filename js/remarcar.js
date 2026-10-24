/* =========================================================
   REMARCAR O CRONOGRAMA — botão 🗓 em cada plano
   ---------------------------------------------------------
   Duas coisas, as duas só no que ainda não foi estudado:
   - mudar os dias da semana (seg e ter viram qui e sex, na
     mesma ordem);
   - refazer: a IA monta de novo os tópicos que faltam,
     mantendo o que já foi feito (e dá pra trocar o tempo por
     dia e a intensidade).
   A mudança de um tópico só (adiantar pra hoje) fica na
   ficha do pet, na lista de próximas aulas.
========================================================= */


const modal = document.querySelector("#remarcar-modal");

const $ = (id) => document.querySelector(`#${id}`);

const API = "./api/estudos";

let plano = null;


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


function marcar(grupo, valor) {
    $(grupo).querySelectorAll(".est-chip").forEach((chip) => chip.classList.toggle("ativo", chip.dataset.valor === String(valor)));
}


async function abrir(planoId) {

    $("remarcar-erro").textContent = "";

    try {
        plano = (await api(`/planos/${planoId}`)).plano;
    } catch (erro) {
        alert(`Não consegui abrir o plano: ${erro.message}`);
        return;
    }

    $("remarcar-plano").textContent = plano.titulo || plano.tema;

    $("remarcar-dias").querySelectorAll(".est-chip").forEach((chip) =>
        chip.classList.toggle("ativo", plano.dias.includes(Number(chip.dataset.valor))));

    // minutos que não estão nos chips (plano importado, por exemplo) caem no mais próximo
    const opcoes = [...$("remarcar-minutos").querySelectorAll(".est-chip")].map((c) => Number(c.dataset.valor));
    marcar("remarcar-minutos", opcoes.reduce((perto, m) => (Math.abs(m - plano.minutos) < Math.abs(perto - plano.minutos) ? m : perto), opcoes[0]));
    marcar("remarcar-intensidade", plano.intensidade || "tranquilo");

    modal.showModal();

}


function terminou() {
    modal.close();
    document.dispatchEvent(new CustomEvent("kaizen:recarregar-estudos"));
}


async function aplicarDias(evento) {

    const dias = [...$("remarcar-dias").querySelectorAll(".est-chip.ativo")].map((c) => Number(c.dataset.valor));
    const botao = evento.currentTarget;

    if (!dias.length) {
        $("remarcar-erro").textContent = "Escolha pelo menos um dia da semana.";
        return;
    }

    botao.disabled = true;
    $("remarcar-erro").textContent = "";

    try {
        await api(`/planos/${plano.id}/dias`, { method: "POST", body: { dias } });
        terminou();
    } catch (erro) {
        $("remarcar-erro").textContent = erro.message;
    } finally {
        botao.disabled = false;
    }

}


async function refazer(evento) {

    const botao = evento.currentTarget;

    if (!confirm(`Refazer o cronograma de "${plano.titulo || plano.tema}"?\n\nOs tópicos que você ainda não estudou serão montados de novo pela IA. O que você já fez fica.`)) return;

    botao.disabled = true;
    $("remarcar-erro").textContent = "";

    try {
        await api(`/planos/${plano.id}/refazer-cronograma`, {
            method: "POST",
            body: {
                minutos: Number($("remarcar-minutos").querySelector(".est-chip.ativo")?.dataset.valor) || plano.minutos,
                intensidade: $("remarcar-intensidade").querySelector(".est-chip.ativo")?.dataset.valor || plano.intensidade
            }
        });
        terminou();
    } catch (erro) {
        $("remarcar-erro").textContent = erro.message;
    } finally {
        botao.disabled = false;
    }

}


if (modal) {

    document.querySelector("#est-planos")?.addEventListener("click", (evento) => {
        const botao = evento.target.closest("[data-remarcar-plano]");
        if (botao) abrir(Number(botao.dataset.remarcarPlano));
    });

    modal.querySelectorAll("[data-fechar]").forEach((botao) => botao.addEventListener("click", () => modal.close()));

    // dias: liga e desliga cada um; tempo e intensidade: um só
    $("remarcar-dias").addEventListener("click", (evento) => evento.target.closest(".est-chip")?.classList.toggle("ativo"));

    ["remarcar-minutos", "remarcar-intensidade"].forEach((grupo) =>
        $(grupo).addEventListener("click", (evento) => {
            const chip = evento.target.closest(".est-chip");
            if (chip) marcar(grupo, chip.dataset.valor);
        }));

    $("remarcar-aplicar-dias").addEventListener("click", aplicarDias);
    $("remarcar-refazer").addEventListener("click", refazer);

}
