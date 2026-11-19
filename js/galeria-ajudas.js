/* Peças pra escrever os planos da galeria (js/galeria-dados.js e js/galeria-*.js). */

export const base = { app: "kaizen-plano", formato: 1, dias: [0, 2, 4], minutos: 60 };

export const doc = (titulo, url, fonte, descricao, minutos = 25) => ({ tipo: "doc", titulo, url, fonte, descricao, minutos });
export const atividade = (titulo, descricao, minutos = 25) => ({ tipo: "atividade", titulo, descricao, minutos });
export const sessao = (topico, objetivo, itens, cartoes) => ({
    topico, objetivo, itens, cartoes: cartoes.map(([frente, verso]) => ({ frente, verso }))
});

/* Artigo da Wikipédia em português. `artigo` é o título exato do artigo; `rotulo` é o que aparece no plano. */
export const wiki = (artigo, descricao, minutos = 20, rotulo = artigo) =>
    doc(rotulo, `https://pt.wikipedia.org/wiki/${encodeURIComponent(artigo.replace(/ /g, "_"))}`, "Wikipédia", descricao, minutos);

/* Página da Khan Academy em português (só endereços de matéria/curso, que duram). */
export const khan = (rotulo, caminho, descricao, minutos = 30) =>
    doc(rotulo, `https://pt.khanacademy.org/${caminho}`, "Khan Academy", descricao, minutos);

/* Simulações interativas de física e química (PhET, Universidade do Colorado). */
export const phet = (rotulo, caminho, descricao, minutos = 20) =>
    doc(rotulo, `https://phet.colorado.edu/pt_BR/${caminho}`, "PhET", descricao, minutos);

/* Página do Mundo Educação (matérias do ensino médio). */
export const mundo = (rotulo, caminho, descricao, minutos = 20) =>
    doc(rotulo, `https://mundoeducacao.uol.com.br/${caminho}`, "Mundo Educação", descricao, minutos);

export const INEP_PROVAS = doc("Provas e gabaritos do ENEM", "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos", "INEP", "As provas oficiais de todos os anos, pra treinar com questões reais.", 30);
export const INEP_ENEM = doc("ENEM no site do INEP", "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem", "INEP", "Informações oficiais do exame: inscrição, datas e como a prova é feita.", 15);

/* Monta um plano da galeria. `extra` sobrescreve campos do pacote (minutos, dias, idioma…). */
export const plano = (id, emoji, area, nivel, resumo, titulo, fonte, sessoes, extra = {}) => ({
    id, emoji, area, nivel, resumo,
    plano: { ...base, idioma: "pt", tema: titulo, titulo, doc_oficial: fonte, sessoes, ...extra }
});
