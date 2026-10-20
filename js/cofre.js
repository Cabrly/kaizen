/* =========================================================
   COFRE — o que a sincronia e o compartilhamento de planos
   dividem: o endereço do servidor (sync/, um Cloudflare
   Worker), o do app publicado e a criptografia (gzip +
   AES-GCM). O servidor só vê texto cifrado.
========================================================= */


const SERVIDOR_PADRAO = "https://kaizen-sync.kaizen-sync.workers.dev";
const ENDERECO_APP = "https://cabrly.github.io/kaizen/";
const CHAVE_SERVIDOR = "kaizen.sincronia.servidor";  // pra testar ou usar um Worker próprio


export function servidor() {
    try {
        return (localStorage.getItem(CHAVE_SERVIDOR) || SERVIDOR_PADRAO).replace(/\/+$/, "");
    } catch (erro) {
        return SERVIDOR_PADRAO;
    }
}

export function enderecoApp() {
    // num site publicado (fork, domínio próprio) o QR aponta pra ele; no PC, pro GitHub Pages
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
    return location.protocol === "https:" && !local ? location.origin + location.pathname : ENDERECO_APP;
}



/* ---------- bytes e criptografia ---------- */

export const texto = (s) => new TextEncoder().encode(s);


export function hex(buffer) {
    return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
}


export function paraBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binario = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(binario);
}


export function deBase64(b64) {
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}


async function passarPor(dados, transformacao) {
    return new Response(new Blob([dados]).stream().pipeThrough(transformacao)).arrayBuffer();
}


export async function cifrar(chave, retrato) {

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const gzip = typeof CompressionStream === "function";
    let conteudo = texto(JSON.stringify(retrato));

    if (gzip) conteudo = await passarPor(conteudo, new CompressionStream("gzip"));

    const cifrado = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, chave, conteudo);

    return JSON.stringify({ v: 1, z: gzip, iv: paraBase64(iv), c: paraBase64(cifrado) });

}


export async function decifrar(chave, dados) {

    const envelope = JSON.parse(dados);
    let conteudo = await crypto.subtle.decrypt({ name: "AES-GCM", iv: deBase64(envelope.iv) }, chave, deBase64(envelope.c));

    if (envelope.z) {
        if (typeof DecompressionStream !== "function") throw new Error("Este navegador é antigo demais pra sincronizar.");
        conteudo = await passarPor(conteudo, new DecompressionStream("gzip"));
    }

    return JSON.parse(new TextDecoder().decode(conteudo));

}
