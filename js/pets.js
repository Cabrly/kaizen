/* =========================================================
   PETS DE ESTUDO (opcional, aba Estudos)
   ---------------------------------------------------------
   Cada plano vira um bichinho. Plano que continua outro
   (pai_id) é o mesmo pet: ele "volta do jardim" pra
   aprender mais. O servidor só guarda o estado (aparência,
   compras); humor e pontos saem do progresso, toda vez:

   - feliz: estudou hoje, ou está em dia;
   - esperando: tem sessão hoje e ainda não começou;
   - triste: a última sessão passou sem nada feito (volta a
     ficar feliz quando o que ficou pra trás é feito).

   Pontos = 150 de boas-vindas + 10 por item feito + 20 por
   sessão completa + 100 por plano concluído − o que foi
   gasto na loja. Como é uma conta, marcar e desmarcar não
   fabrica pontos.
========================================================= */

import { ESPECIES, TONS, FUNDOS, ACESSORIOS, desenharPet, normalizar, imagemDe } from "./pets-arte.js";


const API = "./api";
const $ = (id) => document.querySelector(`#${id}`);
const NOMES = ["Mochi", "Tofu", "Nori", "Sushi", "Yuki", "Hana", "Sora", "Momo", "Taro", "Kiko",
               "Miso", "Pipoca", "Paçoca", "Biscoito", "Feijão", "Jujuba", "Bolinha", "Amora"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

const PONTOS = { item: 10, sessao: 20, plano: 100, boasVindas: 150 };
const SLOTS = { cabeca: "Cabeça", rosto: "Rosto", pescoco: "Pescoço", lado: "Na mão" };
const SECOES = { bichos: "Bichos", acessorios: "Acessórios", tons: "Tons de pelo", cenarios: "Cenários" };

let estado = { ligado: false, compras: [], pets: {}, encerrados: [] };
let dados = { planos: [], sessoes: [], itens: [] };
let aba = "cuidando";
let secaoLoja = "bichos";
let salvando = null;
let vigiaPlano = null;


/* ---------- conversa com o servidor ---------- */

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


async function carregar() {
    const [pets, backup] = await Promise.all([api("/estudos/pets"), api("/backup")]);
    estado = { ligado: false, compras: [], pets: {}, encerrados: [], ...(pets.dados || {}) };
    dados = backup.estudos || dados;
}


function salvar() {
    clearTimeout(salvando);
    salvando = setTimeout(() => api("/estudos/pets", { method: "POST", body: { dados: estado } }).catch(() => null), 300);
}


/* ---------- contas em cima do progresso ---------- */

function hoje() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}


function dataBonita(iso) {
    const [a, m, d] = iso.split("-").map(Number);
    return `${DIAS[new Date(a, m - 1, d).getDay()]}, ${d} de ${MESES[m - 1]}`;
}


const itensDa = (sessaoId) => dados.itens.filter((i) => i.sessao_id === sessaoId);

// estudada: tem item feito, ou a cópia de um "não fiz" foi feita depois
const foiEstudada = (sessaoId) => itensDa(sessaoId).some((i) =>
    i.estado === "feito" || dados.itens.some((c) => c.origem_id === i.id && c.estado === "feito"));


function progresso(plano) {
    const ids = new Set(dados.sessoes.filter((s) => s.plano_id === plano.id).map((s) => s.id));
    const itens = dados.itens.filter((i) => ids.has(i.sessao_id) && i.estado !== "nao-feito");
    const feitos = itens.filter((i) => i.estado === "feito").length;
    return { feitos, total: itens.length, pct: itens.length ? Math.round((100 * feitos) / itens.length) : 0 };
}


function concluido(plano) {
    if (estado.encerrados.includes(plano.id)) return true;
    const { feitos, total } = progresso(plano);
    return plano.status === "pronto" && total > 0 && feitos === total;
}


function pontos() {
    const itens = dados.itens.filter((i) => i.estado === "feito").length;
    const sessoes = dados.sessoes.filter((s) => {
        const deles = itensDa(s.id);
        return deles.length && deles.every((i) => i.estado === "feito");
    }).length;
    const planos = dados.planos.filter(concluido).length;
    const gasto = estado.compras.reduce((soma, id) => soma + custo(id), 0);
    // bonus: só a demonstração usa, pra quem visita poder brincar à vontade na loja
    return Math.max(0, PONTOS.boasVindas + itens * PONTOS.item + sessoes * PONTOS.sessao + planos * PONTOS.plano
                       + (estado.bonus || 0) - gasto);
}


function humor(plano) {

    if (concluido(plano)) return { humor: "feliz", texto: "Plano concluído! Mora no jardim agora." };
    if (plano.status !== "pronto") return { humor: "esperando", texto: "Esperando o plano ficar pronto…" };

    const dia = hoje();
    const sessoes = dados.sessoes.filter((s) => s.plano_id === plano.id && !s.extra);
    const deHoje = sessoes.find((s) => s.data === dia);
    const passada = sessoes.filter((s) => s.data < dia).sort((a, b) => b.data.localeCompare(a.data))[0];

    if (deHoje && foiEstudada(deHoje.id)) return { humor: "feliz", texto: "Feliz da vida: você estudou hoje!" };
    if (passada && !foiEstudada(passada.id)) {
        return { humor: "triste", texto: `Tristinho: a sessão de ${dataBonita(passada.data)} ficou pra trás. Faça o que ficou pendente pra ele voltar a sorrir.` };
    }
    if (deHoje) return { humor: "esperando", texto: `Esperando a sessão de hoje: ${deHoje.topico}.` };
    if (passada) return { humor: "feliz", texto: "Em dia com os estudos!" };
    return { humor: "esperando", texto: "Ansioso pela primeira sessão." };

}


/* ---------- pets: um por corrente de planos ---------- */

function raiz(plano) {
    const vistos = new Set();
    while (plano.pai_id && !vistos.has(plano.id)) {
        vistos.add(plano.id);
        const pai = dados.planos.find((p) => p.id === plano.pai_id);
        if (!pai) break;
        plano = pai;
    }
    return plano;
}


function listarPets() {

    const grupos = new Map();

    dados.planos.forEach((p) => {
        const r = raiz(p).id;
        if (!grupos.has(r)) grupos.set(r, []);
        grupos.get(r).push(p);
    });

    let criou = false;

    const lista = [...grupos].map(([raizId, planos]) => {

        planos.sort((a, b) => a.id - b.id);
        const atual = planos[planos.length - 1];

        if (!estado.pets[raizId]) {
            estado.pets[raizId] = novoPet(Object.keys(estado.pets).length);
            criou = true;
        }

        const pet = estado.pets[raizId];
        return { id: raizId, ...pet, planos, atual, ...humor(atual), noJardim: concluido(atual) };

    });

    if (criou) salvar();

    return lista.sort((a, b) => b.atual.id - a.atual.id);

}


function novoPet(quantos) {
    const usados = new Set(Object.values(estado.pets).map((p) => p.nome));
    const livres = NOMES.filter((n) => !usados.has(n));
    return {
        nome: livres[Math.floor(Math.random() * livres.length)] || `Pet ${quantos + 1}`,
        especie: ["gato", "cachorro", "hamster"][quantos % 3], tom: "original", fundo: "nenhum", acessorios: []
    };
}


// itens da loja: bicho e acessório pelo id; tom e cenário com prefixo (há nomes repetidos)
function custo(id) {
    if (id.startsWith("tom:")) return TONS[id.slice(4)]?.custo ?? 0;
    if (id.startsWith("fundo:")) return FUNDOS[id.slice(6)]?.custo ?? 0;
    return ESPECIES[id]?.custo ?? ACESSORIOS[id]?.custo ?? 0;
}

const tem = (id) => custo(id) === 0 || estado.compras.includes(id);


/* ---------- editor de visual (ficha e adoção) ---------- */

function editorVisual(petCru) {

    const pet = normalizar(petCru);
    const chip = (dado, id, nome, ativo, icone = "") =>
        `<button type="button" class="pets-opcao ${ativo ? "ativa" : ""}" data-${dado}="${id}">${icone}${esc(nome)}</button>`;
    const icone = (id) => imagemDe(id) ? `<img src="${imagemDe(id)}" alt="">` : "🧣 ";

    const tons = Object.keys(TONS).filter((id) => tem(`tom:${id}`));
    const fundos = Object.keys(FUNDOS).filter((id) => tem(`fundo:${id}`));
    const porSlot = Object.entries(SLOTS)
        .map(([slot, nome]) => [nome, Object.keys(ACESSORIOS).filter((id) => ACESSORIOS[id].slot === slot && tem(id))])
        .filter(([, lista]) => lista.length);

    return `
        <span class="pets-rotulo">Bicho</span>
        <div class="pets-opcoes">${Object.keys(ESPECIES).filter(tem).map((id) =>
            chip("especie", id, ESPECIES[id].nome, pet.especie === id, `<img src="${imagemDe(id)}" alt="">`)).join("")}</div>
        <span class="pets-rotulo">Tom</span>
        <div class="pets-cores">${tons.map((id) => `
            <button type="button" class="pets-cor ${pet.tom === id ? "ativa" : ""}" data-tom="${id}" style="--c:${TONS[id].amostra}"
                    title="${TONS[id].nome}" aria-label="${TONS[id].nome}"></button>`).join("")}</div>
        ${fundos.length > 1 ? `<span class="pets-rotulo">Cenário</span>
            <div class="pets-opcoes">${fundos.map((id) => chip("fundo", id, FUNDOS[id].nome, pet.fundo === id)).join("")}</div>` : ""}
        ${porSlot.map(([nome, lista]) => `<span class="pets-rotulo">${nome}</span>
            <div class="pets-opcoes">${lista.map((id) => chip("acessorio", id, ACESSORIOS[id].nome, pet.acessorios.includes(id), icone(id))).join("")}</div>`).join("")}
        ${porSlot.length ? "" : `<p class="pets-dica">Na <button type="button" class="est-link" data-ir-loja>loja</button> tem chapéus, óculos, cachecóis e muito mais.</p>`}`;

}


/* ---------- a janela ---------- */

function abrir(petId = null) {

    const modal = $("pets-modal");
    if (!modal.open) modal.showModal();

    $("pets-convite").hidden = estado.ligado;
    $("pets-principal").hidden = !estado.ligado || petId !== null;
    $("pets-ficha").hidden = !estado.ligado || petId === null;

    if (!estado.ligado) {
        $("pets-vitrine").innerHTML = [
            [{ especie: "gato", acessorios: ["cachecol-brasa", "capelo"] }, "feliz"],
            [{ especie: "coruja", acessorios: ["oculos", "livros"] }, "esperando"],
            [{ especie: "cachorro", acessorios: ["bone"] }, "triste"]
        ].map(([pet, h]) => `<div class="pets-avatar">${desenharPet(pet, h)}</div>`).join("");
        return;
    }

    if (petId !== null) mostrarFicha(petId);
    else mostrarPainel();

}


function mostrarPainel() {

    $("pets-pontos").textContent = `⭐ ${pontos()} pontos`;
    document.querySelectorAll(".pets-aba").forEach((b) => b.classList.toggle("ativa", b.dataset.aba === aba));

    const painel = $("pets-painel");
    const pets = listarPets();

    if (aba === "loja") {
        painel.innerHTML = loja(pets);
        return;
    }

    const daqui = pets.filter((p) => (aba === "jardim") === p.noJardim);

    if (!daqui.length) {
        painel.innerHTML = `<p class="pets-vazio">${aba === "jardim"
            ? "O jardim ainda está vazio. Quando você concluir um plano, o pet dele vem morar aqui, com tudo o que vocês estudaram juntos."
            : "Nenhum pet por aqui. Crie um plano de estudo e ele ganha um bichinho na hora."}</p>`;
        return;
    }

    painel.innerHTML = `<div class="pets-grade ${aba === "jardim" ? "pets-jardim" : ""}">${daqui.map((p) => `
        <button type="button" class="pets-cartao" data-pet="${p.id}">
            <span class="pets-avatar">${desenharPet(p, p.humor, { titulo: p.nome, cenario: true })}</span>
            <strong>${esc(p.nome)}</strong>
            <small>${esc(p.atual.titulo || p.atual.tema)}</small>
            ${aba === "jardim"
                ? `<small class="pets-humor">${p.planos.length > 1 ? `${p.planos.length} planos juntos` : "Plano concluído"}</small>`
                : `<span class="pets-barra"><span style="width:${progresso(p.atual).pct}%"></span></span>
                   <small class="pets-humor pets-humor-${p.humor}">${{ feliz: "😊 feliz", esperando: "👀 esperando", triste: "😢 tristinho" }[p.humor]}</small>`}
        </button>`).join("")}</div>`;

}


function loja(pets) {

    const saldo = pontos();
    const modelo = normalizar(pets.find((p) => !p.noJardim) || pets[0] || { especie: "gato" });

    const cartao = (id, nome, desenho) => {
        const comprado = tem(id);
        const preco = custo(id);
        return `<div class="pets-item ${comprado ? "comprado" : ""}">
            <span class="pets-avatar">${desenho}</span>
            <strong>${esc(nome)}</strong>
            ${comprado
                ? `<small class="pets-seu">✓ É seu</small>`
                : `<button type="button" class="btn-primario pets-comprar" data-comprar="${id}" ${saldo < preco ? "disabled" : ""}>⭐ ${preco}</button>`}
        </div>`;
    };

    const itens = {
        bichos: () => Object.entries(ESPECIES).map(([id, e]) => cartao(id, e.nome, desenharPet({ especie: id }, "feliz"))),
        tons: () => Object.entries(TONS).map(([id, t]) => cartao(`tom:${id}`, t.nome, desenharPet({ ...modelo, tom: id, acessorios: [] }, "esperando"))),
        cenarios: () => Object.entries(FUNDOS).map(([id, f]) => cartao(`fundo:${id}`, f.nome, desenharPet({ ...modelo, fundo: id }, "feliz", { cenario: true }))),
        acessorios: () => Object.entries(SLOTS).map(([slot, nome]) => `
            <h3 class="pets-subtitulo">${nome}</h3>
            <div class="pets-grade pets-loja">${Object.entries(ACESSORIOS).filter(([, a]) => a.slot === slot)
                .map(([id, a]) => cartao(id, a.nome, desenharPet({ ...modelo, acessorios: [id] }, "esperando"))).join("")}</div>`)
    };

    const corpo = secaoLoja === "acessorios"
        ? itens.acessorios().join("")
        : `<div class="pets-grade pets-loja">${itens[secaoLoja]().join("")}</div>`;

    return `<p class="pets-dica">Você começa com 150 pontos e ganha mais estudando: 10 por item feito, 20 por sessão completa e 100 por plano concluído.</p>
        <div class="pets-secoes">${Object.entries(SECOES).map(([id, nome]) =>
            `<button type="button" class="pets-opcao ${secaoLoja === id ? "ativa" : ""}" data-secao="${id}">${nome}</button>`).join("")}</div>
        ${corpo}`;

}


function mostrarFicha(petId) {

    const pet = listarPets().find((p) => p.id === petId);
    if (!pet) { abrir(); return; }

    const ficha = $("pets-ficha");
    const ids = pet.planos.map((p) => p.id);
    const estudadas = dados.sessoes
        .filter((s) => ids.includes(s.plano_id) && !s.extra && foiEstudada(s.id))
        .sort((a, b) => a.data.localeCompare(b.data));
    const ultimaData = dados.sessoes.filter((s) => s.plano_id === pet.atual.id).map((s) => s.data).sort().pop();
    const podeEncerrar = !pet.noJardim && pet.atual.status === "pronto" && ultimaData && ultimaData < hoje();

    ficha.innerHTML = `
        <button type="button" class="est-link pets-voltar" data-voltar>← Seus pets</button>

        <div class="pets-ficha-topo">
            <div class="pets-avatar pets-avatar-grande" id="pets-ficha-avatar">${desenharPet(pet, pet.humor, { titulo: pet.nome, cenario: true })}</div>
            <div class="pets-ficha-info">
                <input class="pets-nome" id="pets-nome" value="${esc(pet.nome)}" maxlength="20" aria-label="Nome do pet">
                <p class="pets-ficha-plano">${pet.planos.map((p) => esc(p.titulo || p.tema)).join(" → ")}</p>
                <p class="pets-humor-texto pets-humor-${pet.humor}">${esc(pet.texto)}</p>
                ${pet.noJardim ? "" : `<span class="pets-barra"><span style="width:${progresso(pet.atual).pct}%"></span></span>`}
            </div>
        </div>

        <h3 class="pets-subtitulo">Visual</h3>
        <div class="pets-editor" id="pets-editor">${editorVisual(pet)}</div>

        <h3 class="pets-subtitulo">O que vocês estudaram juntos</h3>
        ${estudadas.length ? `
            <div class="pets-acoes">
                <button type="button" class="btn-secundario" data-revisar="${estudadas.map((s) => s.id).join(",")}">🃏 Revisar os cartões de ${esc(pet.nome)}</button>
            </div>
            <ol class="pets-historico">${estudadas.map((s) => `
                <li>
                    <div class="pets-historico-topo">
                        <span><strong>${esc(s.topico)}</strong><small>${dataBonita(s.data)}</small></span>
                        <button type="button" class="est-link" data-revisar="${s.id}">🃏 cartões</button>
                    </div>
                    <ul>${itensDa(s.id).map((i) => `<li>${i.url
                        ? `<a href="${esc(i.url)}" target="_blank" rel="noopener">${i.tipo === "video" ? "🎥" : "📄"} ${esc(i.titulo)}</a>`
                        : `📝 ${esc(i.descricao || i.titulo)}`}</li>`).join("")}</ul>
                </li>`).join("")}
            </ol>`
            : `<p class="pets-vazio">Ainda nada por aqui: marque ✓ nos itens das sessões e o que vocês estudarem fica guardado com ${esc(pet.nome)}.</p>`}

        <div class="form-acoes">
            ${podeEncerrar ? `<button type="button" class="btn-secundario" data-encerrar="${pet.atual.id}">Concluir e levar pro jardim</button>` : ""}
            ${pet.noJardim ? `<button type="button" class="btn-primario" data-reativar="${pet.id}">✨ Aprender mais com ${esc(pet.nome)}</button>` : ""}
        </div>`;

    ficha.dataset.pet = petId;
    delete ficha.dataset.adocao;

}


/* ---------- adoção: enquanto a IA monta o plano ---------- */

// "Montando o roteiro: sessão 3 de 12" → ~15%; a busca de materiais é a segunda metade
function andamento(etapa = "") {
    const m = etapa.match(/(\d+)(?:–\d+)? de (\d+)/);
    const parte = m ? Math.min(1, Number(m[1]) / Number(m[2])) : 0;
    if (/roteiro/i.test(etapa)) return 5 + parte * 55;
    if (/busc/i.test(etapa)) return 60 + parte * 38;
    return 3;
}


function mostrarAdocao(plano) {

    const pet = listarPets().find((p) => p.planos.some((pl) => pl.id === plano.id));
    if (!pet) return;

    const reativado = pet.planos.length > 1;
    const modal = $("pets-modal");
    const ficha = $("pets-ficha");

    if (!modal.open) modal.showModal();
    $("pets-convite").hidden = true;
    $("pets-principal").hidden = true;
    ficha.hidden = false;
    ficha.dataset.pet = pet.id;
    ficha.dataset.adocao = plano.id;

    ficha.innerHTML = `
        <h2 class="modal-titulo">${reativado ? `${esc(pet.nome)} está se arrumando pra nova jornada` : "Adote o pet deste plano"}</h2>
        <p class="sinc-texto">${reativado
            ? "Enquanto a IA monta o plano novo, que tal um visual novo?"
            : "Enquanto a IA monta seu plano, escolha quem vai estudar com você."}</p>

        <div class="pets-adocao">
            <div class="pets-avatar pets-avatar-grande" id="pets-ficha-avatar">${desenharPet(pet, "feliz", { titulo: pet.nome, cenario: true })}</div>
            <div class="pets-adocao-opcoes">
                <label class="campo-modal"><span>Nome</span>
                    <input class="pets-nome" id="pets-nome" value="${esc(pet.nome)}" maxlength="20"></label>
                <div class="pets-editor" id="pets-editor">${editorVisual(pet)}</div>
            </div>
        </div>

        <div class="pets-geracao" id="pets-geracao">
            <p id="pets-etapa">A IA está começando…</p>
            <span class="pets-barra pets-barra-grande"><span id="pets-etapa-barra" style="width:3%"></span></span>
        </div>

        <div class="form-acoes">
            <button type="button" class="btn-secundario" id="pets-fechar-adocao" data-fechar-adocao>Fechar (a IA continua trabalhando)</button>
            <button type="button" class="btn-primario" id="pets-comecar" hidden data-fechar-adocao>Começar a estudar!</button>
        </div>`;

    acompanharPlano(plano.id);

}


function acompanharPlano(planoId) {

    clearInterval(vigiaPlano);

    const passo = async () => {

        let plano;
        try {
            plano = (await api(`/estudos/planos/${planoId}`)).plano;
        } catch (erro) {
            return;
        }

        const etapa = $("pets-etapa");
        if (!etapa || Number($("pets-ficha").dataset.adocao) !== planoId) { clearInterval(vigiaPlano); return; }

        if (plano?.status === "pronto") {
            clearInterval(vigiaPlano);
            etapa.textContent = `Pronto! “${plano.titulo || plano.tema}” já está no calendário.`;
            $("pets-etapa-barra").style.width = "100%";
            $("pets-comecar").hidden = false;
            $("pets-fechar-adocao").hidden = true;
            $("pets-geracao").classList.add("pronto");
            document.dispatchEvent(new CustomEvent("kaizen:recarregar-estudos"));
        } else if (plano?.status === "erro") {
            clearInterval(vigiaPlano);
            etapa.textContent = `Não deu certo: ${plano.erro}. O pet fica guardado pra próxima tentativa.`;
            $("pets-geracao").classList.add("erro");
        } else if (plano) {
            etapa.textContent = plano.etapa || "A IA está trabalhando…";
            $("pets-etapa-barra").style.width = `${Math.round(andamento(plano.etapa))}%`;
        }

    };

    passo();
    vigiaPlano = setInterval(passo, 1500);

}


/* ---------- cliques ---------- */

function aoClicar(evento) {

    const alvo = evento.target.closest("button");
    if (!alvo) return;

    const fichaId = Number($("pets-ficha").dataset.pet);
    const pet = estado.pets[fichaId];

    if (alvo.dataset.aba) { aba = alvo.dataset.aba; mostrarPainel(); return; }
    if (alvo.dataset.secao) { secaoLoja = alvo.dataset.secao; mostrarPainel(); return; }
    if (alvo.dataset.pet) { abrir(Number(alvo.dataset.pet)); return; }
    if (alvo.hasAttribute("data-voltar")) { abrir(); return; }
    if (alvo.hasAttribute("data-ir-loja")) { aba = "loja"; abrir(); return; }

    if (alvo.dataset.comprar) {
        const id = alvo.dataset.comprar;
        if (pontos() >= custo(id) && !estado.compras.includes(id)) {
            estado.compras.push(id);
            salvar();
            mostrarPainel();
        }
        return;
    }

    if (alvo.hasAttribute("data-fechar-adocao")) { $("pets-modal").close(); return; }

    if (pet && (alvo.dataset.especie || alvo.dataset.tom || alvo.dataset.fundo || alvo.dataset.acessorio)) {
        Object.assign(pet, normalizar(pet));   // traz pets do visual antigo pro novo
        if (alvo.dataset.especie) pet.especie = alvo.dataset.especie;
        if (alvo.dataset.tom) pet.tom = alvo.dataset.tom;
        if (alvo.dataset.fundo) pet.fundo = alvo.dataset.fundo;
        if (alvo.dataset.acessorio) {
            const id = alvo.dataset.acessorio;
            const slot = ACESSORIOS[id].slot;
            pet.acessorios = pet.acessorios.includes(id)
                ? pet.acessorios.filter((a) => a !== id)
                : [...pet.acessorios.filter((a) => ACESSORIOS[a]?.slot !== slot), id];
        }
        salvar();
        decorarPlanos();
        // redesenha só o bicho e o editor: a tela não pula e a barra da adoção continua andando
        const humorAgora = $("pets-ficha").dataset.adocao ? "feliz" : (listarPets().find((p) => p.id === fichaId)?.humor || "esperando");
        $("pets-ficha-avatar").innerHTML = desenharPet(pet, humorAgora, { titulo: pet.nome, cenario: true });
        $("pets-editor").innerHTML = editorVisual(pet);
        return;
    }

    if (alvo.dataset.revisar) {
        $("pets-modal").close();
        document.dispatchEvent(new CustomEvent("kaizen:revisar", { detail: { sessoes: alvo.dataset.revisar.split(",").map(Number) } }));
        return;
    }

    if (alvo.dataset.encerrar) {
        estado.encerrados.push(Number(alvo.dataset.encerrar));
        salvar(); abrir(fichaId); decorarPlanos();
        return;
    }

    if (alvo.dataset.reativar) {
        const atual = listarPets().find((p) => p.id === fichaId)?.atual;
        if (!atual) return;
        $("pets-modal").close();
        document.dispatchEvent(new CustomEvent("kaizen:continuar-plano", { detail: {
            planoId: atual.id,
            tema: atual.tema,
            aviso: `🐾 ${pet.nome} vai aprender mais com você. A IA já sabe o que vocês estudaram em “${atual.titulo || atual.tema}” e vai montar um plano pra aprofundar.`
        } }));
    }

}


/* ---------- o bichinho nos cartões dos planos ---------- */

function decorarPlanos() {

    document.querySelectorAll(".est-plano-pet").forEach((el) => el.remove());
    if (!estado.ligado) return;

    const pets = listarPets();

    document.querySelectorAll(".est-plano[data-plano]").forEach((cartao) => {
        const id = Number(cartao.dataset.plano);
        const pet = pets.find((p) => p.planos.some((pl) => pl.id === id));
        if (!pet || pet.atual.id !== id) return;
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = `est-plano-pet pets-avatar`;
        botao.title = `${pet.nome}: ${pet.texto}`;
        botao.setAttribute("aria-label", `${pet.nome}, ${pet.humor}`);
        botao.innerHTML = desenharPet(pet, pet.humor);
        botao.addEventListener("click", () => abrir(pet.id));
        cartao.querySelector("header").prepend(botao);
    });

}


async function atualizar() {
    try {
        await carregar();
    } catch (erro) {
        return;
    }
    decorarPlanos();
    if ($("pets-modal").open && !$("pets-principal").hidden) mostrarPainel();
}


function esc(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]);
}


/* ---------- ligações ---------- */

function iniciar() {

    const modal = $("pets-modal");

    $("pets-abrir").addEventListener("click", async () => {
        await atualizar();
        abrir();
    });

    $("pets-ligar").addEventListener("click", () => {
        estado.ligado = true;
        salvar();
        abrir();
        decorarPlanos();
    });

    $("pets-desligar").addEventListener("click", () => {
        estado.ligado = false;   // aparência e compras ficam guardadas pra quando voltar
        salvar();
        modal.close();
        decorarPlanos();
    });

    modal.addEventListener("click", aoClicar);
    modal.querySelectorAll("[data-fechar]").forEach((b) => b.addEventListener("click", () => modal.close()));

    modal.addEventListener("change", (evento) => {
        if (evento.target.id !== "pets-nome") return;
        const pet = estado.pets[Number($("pets-ficha").dataset.pet)];
        const nome = evento.target.value.trim().slice(0, 20);
        if (pet && nome) { pet.nome = nome; salvar(); decorarPlanos(); }
    });

    // os planos foram redesenhados (marcou item, plano novo…): humor e pontos mudam
    document.addEventListener("kaizen:planos", atualizar);

    document.addEventListener("kaizen:plano-criado", async (evento) => {
        await atualizar();
        if (estado.ligado && evento.detail.plano) mostrarAdocao(evento.detail.plano);
    });

    modal.addEventListener("close", () => {
        clearInterval(vigiaPlano);
        delete $("pets-ficha").dataset.adocao;
    });

    atualizar();

}


if ($("pets-modal") && $("tela-estudos")) iniciar();
