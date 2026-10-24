/* =========================================================
   INTENSIDADE — quantos tópicos entram por dia de estudo
   ---------------------------------------------------------
   A mesma conta do estudos.py (blocos_por_dia). Sem isso, 2 h
   por dia continuava sendo 1 tópico: a duração só mudava o
   tamanho do vídeo, e o plano parecia o mesmo de 1 h.
   Valor = minutos por tópico (0 = um tópico só por dia).
========================================================= */


export const INTENSIDADES = { tranquilo: 0, equilibrado: 50, intenso: 30 };

const MAX_TOPICOS = 160;   // teto no plano inteiro: cada tópico faz uma busca de vídeo e de documentação


export function blocosPorDia(minutos, intensidade, diasPorSemana, semanas) {

    const porTopico = INTENSIDADES[intensidade] || 0;

    if (!porTopico) return 1;

    const blocos = Math.max(1, Math.min(6, Math.floor(minutos / porTopico + 0.4)));

    return Math.max(1, Math.min(blocos, Math.floor(MAX_TOPICOS / Math.max(1, diasPorSemana * semanas))));

}
