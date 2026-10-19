/* =========================================================
   SINCRONIA — os mesmos dados no PC e no celular
   ---------------------------------------------------------
   Um código (ex.: KZ7F-Q2MA-9XTD) liga os aparelhos. Dele
   saem, aqui no navegador, o nome do cofre e a chave AES:
   o servidor (sync/, um Cloudflare Worker) só guarda texto
   cifrado e nunca vê tarefas nem planos.

   Usa o mesmo retrato do backup (/api/backup), então vale
   igual com o server.py e no modo nuvem. A cada poucos
   segundos compara o retrato com o último sincronizado:
   mudou aqui → envia; mudou lá → aplica e recarrega;
   mudou nos dois → pergunta com qual ficar.
========================================================= */


const SERVIDOR_PADRAO = "https://kaizen-sync.cabrly.workers.dev";
const ENDERECO_APP = "https://cabrly.github.io/kaizen/";

const CHAVE_ESTADO = "kaizen.sincronia.v1";
const CHAVE_SERVIDOR = "kaizen.sincronia.servidor";  // pra testar ou usar um Worker próprio
const CHAVE_AVISO = "kaizen.sincronia.aviso";        // sessionStorage: recado depois do reload

const ALFABETO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";  // base32 do Crockford: sem I, L, O, U
const OLHAR_AQUI = 4000;     // ms entre comparações do retrato local (barato)
const OLHAR_NUVEM = 30000;   // ms entre consultas ao servidor com a tela aberta


const modal = document.querySelector("#sinc-modal");
const botaoAbrir = document.querySelector("#sinc-abrir");

const el = (id) => document.querySelector(`#sinc-${id}`);


let ocupado = false;
let ultimaNuvem = 0;
let situacao = { tipo: "ok", texto: "" };
const derivadas = new Map();



/* ---------- estado guardado ---------- */

function lerEstado() {
    try {
        const estado = JSON.parse(localStorage.getItem(CHAVE_ESTADO) || "null");
        return estado && typeof estado.codigo === "string" && Number.isInteger(estado.versao) ? estado : null;
    } catch (erro) {
        return null;
    }
}


function gravarEstado(estado) {
    try {
        if (estado) localStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado));
        else localStorage.removeItem(CHAVE_ESTADO);
    } catch (erro) {
        /* sem localStorage não tem como lembrar o código */
    }
}


function servidor() {
    try {
        return (localStorage.getItem(CHAVE_SERVIDOR) || SERVIDOR_PADRAO).replace(/\/+$/, "");
    } catch (erro) {
        return SERVIDOR_PADRAO;
    }
}


function enderecoApp() {
    // num site publicado (fork, domínio próprio) o QR aponta pra ele; no PC, pro GitHub Pages
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
    return location.protocol === "https:" && !local ? location.origin + location.pathname : ENDERECO_APP;
}



/* ---------- código e criptografia ---------- */

export function normalizarCodigo(texto) {

    const limpo = String(texto || "").toUpperCase()
        .replace(/O/g, "0").replace(/[IL]/g, "1")
        .split("").filter((c) => ALFABETO.includes(c)).join("");

    return limpo.length === 12 ? limpo.match(/.{4}/g).join("-") : null;

}


function gerarCodigo() {
    const bytes = crypto.getRandomValues(new Uint8Array(12));
    return normalizarCodigo(Array.from(bytes, (b) => ALFABETO[b & 31]).join(""));
}


const texto = (s) => new TextEncoder().encode(s);


async function derivar(codigo) {

    if (!crypto.subtle) {
        throw new Error("A sincronia precisa de conexão segura: abra o Kaizen por https ou pelo localhost.");
    }

    if (!derivadas.has(codigo)) {

        const base = await crypto.subtle.importKey("raw", texto(codigo), "PBKDF2", false, ["deriveBits", "deriveKey"]);
        const pbkdf2 = (sal) => ({ name: "PBKDF2", salt: texto(sal), iterations: 200000, hash: "SHA-256" });

        const bitsId = await crypto.subtle.deriveBits(pbkdf2("kaizen-sync/id"), base, 128);
        const chave = await crypto.subtle.deriveKey(pbkdf2("kaizen-sync/chave"), base,
            { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);

        derivadas.set(codigo, { id: hex(bitsId), chave });

    }

    return derivadas.get(codigo);

}


function hex(buffer) {
    return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
}


function paraBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binario = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(binario);
}


function deBase64(b64) {
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}


async function passarPor(dados, transformacao) {
    return new Response(new Blob([dados]).stream().pipeThrough(transformacao)).arrayBuffer();
}


async function cifrar(chave, retrato) {

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const gzip = typeof CompressionStream === "function";
    let conteudo = texto(JSON.stringify(retrato));

    if (gzip) conteudo = await passarPor(conteudo, new CompressionStream("gzip"));

    const cifrado = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, chave, conteudo);

    return JSON.stringify({ v: 1, z: gzip, iv: paraBase64(iv), c: paraBase64(cifrado) });

}


async function decifrar(chave, dados) {

    const envelope = JSON.parse(dados);
    let conteudo = await crypto.subtle.decrypt({ name: "AES-GCM", iv: deBase64(envelope.iv) }, chave, deBase64(envelope.c));

    if (envelope.z) {
        if (typeof DecompressionStream !== "function") throw new Error("Este navegador é antigo demais pra sincronizar.");
        conteudo = await passarPor(conteudo, new DecompressionStream("gzip"));
    }

    return JSON.parse(new TextDecoder().decode(conteudo));

}



/* ---------- retrato dos dados ---------- */

async function exportar() {
    const resposta = await fetch("./api/backup", { cache: "no-store" });
    if (!resposta.ok) throw new Error(`Não consegui ler os dados deste aparelho (HTTP ${resposta.status}).`);
    return resposta.json();
}


async function aplicar(retrato) {

    const resposta = await fetch("./api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(retrato)
    });

    if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => ({}));
        throw new Error(corpo.erro || `Não consegui gravar os dados (HTTP ${resposta.status}).`);
    }

}


// mesma ordem de chaves sempre, pra o hash não mudar à toa
function canonico(valor) {
    if (Array.isArray(valor)) return valor.map(canonico);
    if (valor && typeof valor === "object") {
        return Object.fromEntries(Object.keys(valor).sort().map((k) => [k, canonico(valor[k])]));
    }
    return valor;
}


async function marca(retrato) {

    // o quadro sempre completa as categorias com "Geral" e as das tarefas ao abrir
    // (main.js, sincronizarControles); sem isso, só abrir já pareceria mudança
    const tarefas = retrato.kanban?.tarefas || [];
    const categorias = [...new Set(["Geral", ...(retrato.kanban?.categorias || []),
        ...tarefas.map((t) => t.categoria || "Geral")])].sort();

    const essencial = canonico({ kanban: { tarefas, categorias }, estudos: retrato.estudos });
    return hex(await crypto.subtle.digest("SHA-256", texto(JSON.stringify(essencial))));
}


function contar(retrato) {
    return { tarefas: retrato.kanban?.tarefas?.length || 0, planos: retrato.estudos?.planos?.length || 0 };
}


function gerando(retrato) {
    return (retrato.estudos?.planos || []).some((p) => p.status === "gerando");
}



/* ---------- conversa com o servidor ---------- */

async function pedir(metodo, id, corpo) {

    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), 15000);

    try {

        const resposta = await fetch(`${servidor()}/v1/cofre/${id}`, {
            method: metodo,
            headers: corpo ? { "Content-Type": "application/json" } : {},
            body: corpo ? JSON.stringify(corpo) : undefined,
            cache: "no-store",
            signal: controle.signal
        });

        return { status: resposta.status, corpo: await resposta.json().catch(() => ({})) };

    } catch (erro) {

        throw new Error("Sem conexão com o servidor de sincronia.");

    } finally {

        clearTimeout(relogio);

    }

}


function falhou(r) {
    return new Error(r.corpo?.erro || `O servidor de sincronia respondeu ${r.status}.`);
}



/* ---------- o ciclo ---------- */

async function ciclo(olharNuvem = false) {

    const estado = lerEstado();

    if (!estado || ocupado) return;

    ocupado = true;

    try {

        const local = await exportar();

        if (gerando(local)) return;  // espera a IA terminar o plano

        const atual = await marca(local);
        const { id, chave } = await derivar(estado.codigo);

        if (atual !== estado.marca) {

            mostrarSituacao("andando", "Enviando…");

            const r = await pedir("PUT", id, { base: estado.versao, dados: await cifrar(chave, local) });

            if (r.status === 200) gravarEstado({ ...estado, versao: r.corpo.versao, marca: atual, quando: Date.now() });
            else if (r.status === 409) await chegou(estado, r.corpo, local, atual, chave);
            else if (r.status === 404) return esquecido();
            else throw falhou(r);

        } else if (olharNuvem || Date.now() - ultimaNuvem > OLHAR_NUVEM) {

            ultimaNuvem = Date.now();

            const r = await pedir("GET", id);

            if (r.status === 404) return esquecido();
            if (r.status !== 200) throw falhou(r);

            if (r.corpo.versao > estado.versao) await chegou(estado, r.corpo, local, atual, chave);
            else gravarEstado({ ...estado, quando: Date.now() });

        }

        mostrarSituacao("ok");

    } catch (erro) {

        mostrarSituacao("erro", `${erro.message} Tento de novo sozinho.`);

    } finally {

        ocupado = false;

    }

}


// o cofre tem uma versão mais nova que a deste aparelho
async function chegou(estado, cofre, local, atual, chave) {

    const remoto = await decifrar(chave, cofre.dados);

    if (await marca(remoto) === atual) {  // já está igual (ex.: outra aba enviou)
        gravarEstado({ ...estado, versao: cofre.versao, marca: atual, quando: Date.now() });
        return;
    }

    if (atual !== estado.marca && await perguntarConflito(local, remoto, cofre.atualizado_em) === "aqui") {

        const { id } = await derivar(estado.codigo);
        const r = await pedir("PUT", id, { base: cofre.versao, dados: await cifrar(chave, local) });

        if (r.status === 200) gravarEstado({ ...estado, versao: r.corpo.versao, marca: atual, quando: Date.now() });
        else if (r.status !== 409) throw falhou(r);  // 409: mudou de novo, o próximo ciclo resolve
        return;

    }

    if (editando()) {  // não recarrega no meio de uma edição; tenta de novo logo
        ultimaNuvem = 0;
        return;
    }

    await adotar(estado.codigo, cofre.versao, remoto, "Atualizado com o que veio do outro aparelho.");

}


// grava o retrato remoto aqui e recarrega a tela com ele
async function adotar(codigo, versao, remoto, recado) {

    await aplicar(remoto);

    // a marca é a do que ficou gravado (a importação pode ajustar detalhes),
    // senão este aparelho reenviaria o que acabou de receber
    gravarEstado({ codigo, versao, marca: await marca(await exportar()), quando: Date.now() });

    try {
        sessionStorage.setItem(CHAVE_AVISO, recado);
    } catch (erro) {
        /* sem recado, só recarrega */
    }

    location.reload();

}


function esquecido() {
    gravarEstado(null);
    mostrarSituacao("ok");
    avisar("A sincronia foi desligada: o código foi apagado em outro aparelho.");
}


function editando() {
    const foco = document.activeElement;
    return Boolean(document.querySelector("dialog[open]:not(#sinc-modal)")) ||
        Boolean(foco && (foco.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(foco.tagName)));
}



/* ---------- ligar, conectar, desligar ---------- */

async function gerar() {

    const local = await exportar();

    for (let tentativa = 0; tentativa < 3; tentativa++) {

        const codigo = gerarCodigo();
        const { id, chave } = await derivar(codigo);
        const r = await pedir("PUT", id, { base: 0, dados: await cifrar(chave, local) });

        if (r.status === 200) {
            gravarEstado({ codigo, versao: r.corpo.versao, marca: await marca(local), quando: Date.now() });
            return;
        }

        if (r.status !== 409) throw falhou(r);  // 409 = código já usado (quase impossível): sorteia outro

    }

    throw new Error("Não consegui gerar um código. Tente de novo.");

}


async function conectar(codigo) {

    const { id, chave } = await derivar(codigo);
    const r = await pedir("GET", id);

    if (r.status === 404) throw new Error("Não achei nada com esse código. Confira se digitou certo.");
    if (r.status !== 200) throw falhou(r);

    const remoto = await decifrar(chave, r.corpo.dados);
    const local = await exportar();
    const atual = await marca(local);

    if (await marca(remoto) === atual) {
        gravarEstado({ codigo, versao: r.corpo.versao, marca: atual, quando: Date.now() });
        return;
    }

    const aqui = contar(local);
    const la = contar(remoto);

    if ((aqui.tarefas || aqui.planos) && !confirm(
        `No outro aparelho: ${la.tarefas} tarefa(s) e ${la.planos} plano(s).\n` +
        `Neste aparelho: ${aqui.tarefas} tarefa(s) e ${aqui.planos} plano(s).\n\n` +
        "Conectar SUBSTITUI os dados deste aparelho pelos do outro. Continuar?")) {
        return;
    }

    await adotar(codigo, r.corpo.versao, remoto, "Pronto! Este aparelho agora está sincronizado.");

}


async function apagarDaNuvem() {

    const estado = lerEstado();
    if (!estado) return;

    if (!confirm("Apagar os dados da nuvem e desligar a sincronia em todos os aparelhos?\n\n" +
                 "O que está em cada aparelho continua lá.")) return;

    const { id } = await derivar(estado.codigo);
    const r = await pedir("DELETE", id);
    if (r.status !== 200) throw falhou(r);

    gravarEstado(null);

}



/* ---------- tela ---------- */

function perguntarConflito(local, remoto, quandoLa) {

    return new Promise((resolver) => {

        const aqui = contar(local);
        const la = contar(remoto);
        const hora = new Date(quandoLa).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

        const dialogo = document.createElement("dialog");
        dialogo.className = "modal sinc-conflito";
        dialogo.innerHTML = `
            <h2 class="modal-titulo">Mudou nos dois aparelhos</h2>
            <p class="sinc-texto">Enquanto este aparelho estava sem sincronizar, o outro também mudou.
                Com qual versão você quer ficar? A outra é descartada.</p>
            <div class="sinc-escolhas">
                <button type="button" class="btn-secundario" data-escolha="aqui">
                    <strong>Deste aparelho</strong>
                    <span>${aqui.tarefas} tarefa(s), ${aqui.planos} plano(s)</span>
                </button>
                <button type="button" class="btn-secundario" data-escolha="la">
                    <strong>Do outro aparelho</strong>
                    <span>${la.tarefas} tarefa(s), ${la.planos} plano(s)</span>
                    <span>enviado em ${hora}</span>
                </button>
            </div>`;

        dialogo.addEventListener("cancel", (evento) => evento.preventDefault());  // tem que escolher
        dialogo.querySelectorAll("[data-escolha]").forEach((botao) => botao.addEventListener("click", () => {
            dialogo.close();
            dialogo.remove();
            resolver(botao.dataset.escolha);
        }));

        document.body.append(dialogo);
        dialogo.showModal();

    });

}


function quandoFoi(ms) {
    const minutos = Math.round((Date.now() - ms) / 60000);
    if (minutos < 1) return "agora";
    if (minutos < 60) return `há ${minutos} min`;
    const horas = Math.round(minutos / 60);
    return horas < 24 ? `há ${horas} h` : new Date(ms).toLocaleDateString("pt-BR");
}


function mostrarSituacao(tipo, textoSituacao = "") {

    situacao = { tipo, texto: textoSituacao };

    const estado = lerEstado();

    if (botaoAbrir) {
        botaoAbrir.textContent = !estado ? "Sincronizar aparelhos"
            : tipo === "erro" ? "Sincronia: sem conexão"
            : "Sincronizado ✓";
        botaoAbrir.dataset.situacao = estado ? tipo : "";
    }

    if (modal?.open) desenhar();

}


async function desenhar() {

    const estado = lerEstado();

    el("desligada").hidden = Boolean(estado);
    el("ligada").hidden = !estado;
    el("desligar").hidden = !estado;
    el("apagar").hidden = !estado;

    if (!estado) return;

    const link = `${enderecoApp()}#sync=${estado.codigo}`;

    el("codigo-mostrado").textContent = estado.codigo;
    el("copiar").dataset.link = link;
    el("status").textContent = situacao.tipo === "erro" ? situacao.texto
        : situacao.tipo === "andando" ? situacao.texto
        : `Sincronizado ${quandoFoi(estado.quando || Date.now())}.`;
    el("status").dataset.situacao = situacao.tipo;

    if (el("qr").dataset.link !== link) {
        const { default: qrcode } = await import("./vendor/qrcode.js");
        const qr = qrcode(0, "M");
        qr.addData(link);
        qr.make();
        el("qr").innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
        el("qr").dataset.link = link;
    }

}


function erroNaTela(mensagem = "") {
    el("erro").textContent = mensagem;
}


// roda uma ação do painel com o botão travado e o erro aparecendo no próprio painel
async function acao(botao, trabalho) {

    erroNaTela();
    botao.disabled = true;

    try {
        await trabalho();
        await desenhar();
        mostrarSituacao("ok");
    } catch (erro) {
        erroNaTela(erro.message);
    } finally {
        botao.disabled = false;
    }

}


function abrir() {
    erroNaTela();
    desenhar();
    if (!modal.open) modal.showModal();
    if (lerEstado()) ciclo(true);
}


function avisar(mensagem) {

    const aviso = document.createElement("div");
    aviso.className = "sinc-aviso";
    aviso.setAttribute("role", "status");
    aviso.textContent = mensagem;
    document.body.append(aviso);

    setTimeout(() => aviso.remove(), 5000);

}



/* ---------- ligação com a página ---------- */

if (modal && botaoAbrir) {

    botaoAbrir.addEventListener("click", abrir);

    modal.querySelectorAll("[data-fechar]").forEach((botao) => botao.addEventListener("click", () => modal.close()));

    el("gerar").addEventListener("click", (evento) => acao(evento.currentTarget, gerar));

    el("form-codigo").addEventListener("submit", (evento) => {
        evento.preventDefault();
        const codigo = normalizarCodigo(el("codigo").value);
        if (!codigo) return erroNaTela("O código tem 12 letras e números, tipo KZ7F-Q2MA-9XTD.");
        acao(evento.submitter || el("form-codigo").querySelector("button"), () => conectar(codigo));
    });

    el("copiar").addEventListener("click", async (evento) => {
        const botao = evento.currentTarget;
        try {
            await navigator.clipboard.writeText(botao.dataset.link);
            botao.textContent = "Link copiado ✓";
        } catch (erro) {
            prompt("Copie o link:", botao.dataset.link);
        }
        setTimeout(() => botao.textContent = "Copiar link", 2000);
    });

    el("desligar").addEventListener("click", () => {
        if (!confirm("Desligar a sincronia neste aparelho? Os dados daqui continuam aqui.")) return;
        gravarEstado(null);
        desenhar();
        mostrarSituacao("ok");
    });

    el("apagar").addEventListener("click", (evento) => acao(evento.currentTarget, apagarDaNuvem));

    mostrarSituacao("ok");


    // link do QR: .../#sync=CODIGO
    const doLink = location.hash.startsWith("#sync=") ? normalizarCodigo(location.hash.slice(6)) : null;

    if (location.hash.startsWith("#sync=")) {
        history.replaceState(null, "", location.pathname + location.search);  // o código não fica no histórico
    }

    try {
        const recado = sessionStorage.getItem(CHAVE_AVISO);
        if (recado) {
            sessionStorage.removeItem(CHAVE_AVISO);
            avisar(recado);
        }
    } catch (erro) {
        /* sem recado */
    }


    window.kaizenModo.then(() => {

        if (doLink && lerEstado()?.codigo !== doLink) {
            abrir();
            el("codigo").value = doLink;
            acao(el("form-codigo").querySelector("button"), () => conectar(doLink));
        }

        // dá um tempo pro quadro carregar antes do primeiro retrato
        setTimeout(() => ciclo(true), 1500);
        setInterval(() => { if (!document.hidden) ciclo(); }, OLHAR_AQUI);

        document.addEventListener("visibilitychange", () => ciclo(!document.hidden));
        window.addEventListener("online", () => ciclo(true));

    });

}
