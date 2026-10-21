/* =========================================================
   AGENDA — as sessões de um plano no calendário do celular
   ---------------------------------------------------------
   Botão 📅 em cada plano: gera um arquivo .ics (o formato
   que Google Agenda, iPhone e Outlook abrem) com uma
   sessão por evento e um aviso antes. Com horário no plano
   o evento tem hora e duração; sem horário, é de dia
   inteiro e o aviso toca às 9h. Cada sessão tem um UID
   fixo: importar de novo atualiza em vez de duplicar.
========================================================= */


const modal = document.querySelector("#agenda-modal");

const $ = (id) => document.querySelector(`#${id}`);

let atual = null;   // { plano, sessoes }



async function api(caminho) {
    const resposta = await fetch(`./api${caminho}`);
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados.erro || `HTTP ${resposta.status}`);
    return dados;
}


function hojeIso() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}



/* ---------- o arquivo .ics (RFC 5545) ---------- */

const escapar = (texto) => String(texto ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");


// linhas de no máximo 75 bytes; a continuação começa com um espaço
function dobrar(linha) {
    const codificador = new TextEncoder();
    const partes = [];
    let atualLinha = "";
    for (const letra of linha) {
        if (codificador.encode(atualLinha + letra).length > (partes.length ? 74 : 75)) {
            partes.push(atualLinha);
            atualLinha = "";
        }
        atualLinha += letra;
    }
    partes.push(atualLinha);
    return partes.join("\r\n ");
}


const dataIcs = (iso) => iso.replace(/-/g, "");

function somarMinutos(iso, horario, minutos) {
    const [a, m, d] = iso.split("-").map(Number);
    const [h, min] = horario.split(":").map(Number);
    const fim = new Date(Date.UTC(a, m - 1, d, h, min + minutos));
    return fim.toISOString().slice(0, 16).replace(/[-:]/g, "") + "00";
}


function montarIcs(plano, sessoes, avisoMinutos) {

    const nome = plano.titulo || plano.tema;
    const agora = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const linhas = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Kaizen//Planos de estudo//PT", "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH", `X-WR-CALNAME:${escapar(`Kaizen: ${nome}`)}`
    ];

    sessoes.forEach((s) => {

        const inicio = plano.horario
            ? [`DTSTART:${dataIcs(s.data)}T${plano.horario.replace(":", "")}00`, `DTEND:${somarMinutos(s.data, plano.horario, plano.minutos)}`]
            : [`DTSTART;VALUE=DATE:${dataIcs(s.data)}`, `DTEND;VALUE=DATE:${dataIcs(somarDias(s.data, 1))}`];

        linhas.push(
            "BEGIN:VEVENT",
            `UID:kaizen-${plano.id}-${s.id}@cabrly.github.io`,
            `DTSTAMP:${agora}`,
            ...inicio,
            `SUMMARY:${escapar(`📚 ${s.topico} · ${nome}`)}`,
            `DESCRIPTION:${escapar(`Sessão do plano "${nome}" (${plano.minutos} min). Abra o Kaizen pra ver o vídeo, a documentação e as atividades.`)}`,
            "BEGIN:VALARM", "ACTION:DISPLAY",
            `DESCRIPTION:${escapar(`Hora de estudar: ${s.topico}`)}`,
            plano.horario ? `TRIGGER:-PT${avisoMinutos}M` : "TRIGGER:PT9H",
            "END:VALARM",
            "END:VEVENT"
        );

    });

    linhas.push("END:VCALENDAR");

    return linhas.map(dobrar).join("\r\n") + "\r\n";

}


function somarDias(iso, dias) {
    const [a, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}


function nomeDeArquivo(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "plano";
}



/* ---------- a janela ---------- */

async function abrir(planoId) {

    $("agenda-erro").textContent = "";
    $("agenda-baixar").disabled = true;
    $("agenda-resumo").textContent = "Lendo as sessões…";
    modal.showModal();

    try {

        const { plano } = await api(`/estudos/planos/${planoId}`);
        const de = hojeIso() > (plano.primeira_data || "") ? hojeIso() : plano.primeira_data;
        const { sessoes } = await api(`/estudos/calendario?inicio=${de}&fim=${plano.ultima_data || de}`);

        atual = { plano, sessoes: sessoes.filter((s) => s.plano_id === plano.id) };

        const n = atual.sessoes.length;
        $("agenda-resumo").textContent = n
            ? `${n} ${n === 1 ? "sessão" : "sessões"} de "${plano.titulo || plano.tema}", de hoje em diante, ` +
              (plano.horario ? `às ${plano.horario}, com ${plano.minutos} min cada.` : "como eventos de dia inteiro (o plano não tem horário).")
            : "Esse plano não tem mais sessões daqui pra frente.";
        $("agenda-aviso-linha").hidden = !plano.horario;
        $("agenda-baixar").disabled = !n;

    } catch (erro) {

        $("agenda-resumo").textContent = "";
        $("agenda-erro").textContent = `Não consegui ler o plano: ${erro.message}`;

    }

}


function baixar() {

    const { plano, sessoes } = atual;
    const arquivo = new Blob([montarIcs(plano, sessoes, Number($("agenda-aviso").value) || 10)], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(arquivo);
    link.download = `kaizen-${nomeDeArquivo(plano.titulo || plano.tema)}.ics`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 10000);
    document.dispatchEvent(new CustomEvent("kaizen:uso", { detail: "agenda" }));

    $("agenda-baixar").textContent = "Baixado! Abra o arquivo";
    setTimeout(() => ($("agenda-baixar").textContent = "Baixar pra agenda"), 3000);

}



if (modal) {

    modal.querySelectorAll("[data-fechar]").forEach((botao) => botao.addEventListener("click", () => modal.close()));

    document.querySelector("#est-planos")?.addEventListener("click", (evento) => {
        const botao = evento.target.closest("[data-agenda-plano]");
        if (botao) abrir(Number(botao.dataset.agendaPlano));
    });

    $("agenda-baixar").addEventListener("click", baixar);

}

