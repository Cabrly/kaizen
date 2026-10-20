/* Service worker do Kaizen: deixa o app instalável e abrindo sem internet.

   Rede primeiro (online pega sempre a versão nova; offline usa a cópia
   guardada). /api e outros sites nunca passam por aqui. */

const CACHE = "kaizen-v13";

const ARQUIVOS = [
    "./",
    "./index.html",
    "./style.css",
    "./dados.json",
    "./prompts.json",
    "./manifest.webmanifest",
    "./icones/icone-192.png",
    "./icones/icone-512.png",
    "./js/modo.js",
    "./js/backup.js",
    "./js/sincronia.js",
    "./js/vendor/qrcode.js",
    "./js/instalar.js",
    "./js/main.js",
    "./js/telas.js",
    "./js/bolha.js",
    "./js/chat.js",
    "./js/estudos.js",
    "./js/servidores.js",
    "./js/ia-local.js",
    "./js/api.js",
    "./js/estados.js",
    "./js/tinta.js",
    "./js/fundo.js",
    "./js/contemplacao.js",
    "./js/fundos-orientais.js",
    "./js/acoes.js",
    "./js/persistencia.js",
    "./js/renderizacao.js",
    "./js/corte.js",
    "./js/nuvem/servidor.js",
    "./js/nuvem/ia.js",
    "./js/nuvem/busca.js"
];


self.addEventListener("install", (evento) => {
    evento.waitUntil(
        caches.open(CACHE)
            .then((cache) => cache.addAll(ARQUIVOS))
            .catch(() => { /* um arquivo faltando não impede o resto */ })
            .then(() => self.skipWaiting()));
});


self.addEventListener("activate", (evento) => {
    evento.waitUntil(
        caches.keys()
            .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
            .then(() => self.clients.claim()));
});


self.addEventListener("fetch", (evento) => {

    const url = new URL(evento.request.url);

    if (evento.request.method !== "GET" || url.origin !== location.origin || url.pathname.includes("/api/")) {
        return;
    }

    evento.respondWith(
        fetch(evento.request)
            .then((resposta) => {
                if (resposta.ok) {
                    const copia = resposta.clone();
                    caches.open(CACHE).then((cache) => cache.put(evento.request, copia));
                }
                return resposta;
            })
            .catch(() => caches.match(evento.request, { ignoreSearch: true })
                .then((guardada) => guardada || caches.match("./index.html"))));

});
