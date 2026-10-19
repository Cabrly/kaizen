/* =========================================================
   FOTO DA CENA — desenha uma vez, mostra como imagem pronta
   ---------------------------------------------------------
   A cena é um SVG com filtros pesados (rocha, nuvens com
   relevo, granulado). Deixá-lo vivo na página faz o navegador
   recalcular tudo a cada quadro, e o vidro fosco dos cartões
   borra por cima de novo: o app trava. Aqui a cena é montada
   fora da página, no estado do progresso, e vira um canvas
   parado. Só se refaz quando o progresso (ou o tamanho da
   janela) muda.
========================================================= */


export async function fotografar(def, feitos, total, largura, altura) {
    const rascunho = document.createElement("div");
    def.montar(rascunho).atualizar(feitos, total, false);

    const svg = rascunho.querySelector("svg");
    svg.setAttribute("width", largura);
    svg.setAttribute("height", altura);

    const texto = new XMLSerializer().serializeToString(svg);
    const endereco = URL.createObjectURL(new Blob([texto], { type: "image/svg+xml" }));

    try {
        const imagem = new Image();
        imagem.src = endereco;
        await imagem.decode();

        const quadro = document.createElement("canvas");
        quadro.width = largura;
        quadro.height = altura;
        quadro.getContext("2d").drawImage(imagem, 0, 0, largura, altura);
        return quadro;
    } finally {
        URL.revokeObjectURL(endereco);
    }
}
