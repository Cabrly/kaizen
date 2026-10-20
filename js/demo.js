/* =========================================================
   MODO DEMONSTRAÇÃO — index.html?demo
   ---------------------------------------------------------
   É o que o site de divulgação mostra dentro da janelinha.
   Troca o localStorage por um de memória (nada fica salvo
   no navegador de quem visita e recarregar zera tudo),
   preenche tarefas e um plano de estudos de exemplo e
   responde o chat com uma IA de mentira. O que precisa de
   IA de verdade (plano novo, conectar conta) avisa que é
   só na versão completa.
========================================================= */


export const DEMO = new URLSearchParams(location.search).has("demo");


function instalarMemoria() {

    const dados = new Map();

    const memoria = {
        get length() { return dados.size; },
        key: (i) => [...dados.keys()][i] ?? null,
        getItem: (chave) => (dados.has(String(chave)) ? dados.get(String(chave)) : null),
        setItem: (chave, valor) => { dados.set(String(chave), String(valor)); },
        removeItem: (chave) => { dados.delete(String(chave)); },
        clear: () => dados.clear()
    };

    Object.defineProperty(window, "localStorage", { value: memoria, configurable: true });

}


function hoje(mais = 0) {
    const d = new Date();
    d.setDate(d.getDate() + mais);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}


function diaDaSemana(iso) {
    // 0 = segunda … 6 = domingo, como no resto do app
    const [a, m, d] = iso.split("-").map(Number);
    return (new Date(Date.UTC(a, m - 1, d)).getUTCDay() + 6) % 7;
}


function semear() {

    const tarefas = [
        ["Revisar proposta do cliente", "a-fazer", "alta", "Trabalho", 1],
        ["Montar apresentação da sprint", "a-fazer", "media", "Trabalho", 3],
        ["Agendar dentista", "a-fazer", "baixa", "Pessoal", 8],
        ["Ler capítulo 4 de Clean Code", "em-andamento", "media", "Estudos", 2],
        ["Refatorar tela de login", "em-andamento", "alta", "Trabalho", 1],
        ["Comprar presente da Ana", "em-andamento", "baixa", "Pessoal", 5],
        ["Pagar conta de luz", "concluido", "alta", "Casa", -1],
        ["Corrigir bug do formulário", "concluido", "alta", "Trabalho", -2],
        ["Exercícios de JavaScript", "concluido", "media", "Estudos", -1],
        ["Organizar a escrivaninha", "concluido", "baixa", "Casa", -3]
    ].map(([titulo, status, prioridade, categoria, dias], i) =>
        ({ id: `demo-${i}`, titulo, status, prioridade, categoria, prazo: hoje(dias) }));

    // o plano de exemplo começa hoje: a primeira sessão já aparece no painel do dia
    const dados = { seq: { plano: 1, sessao: 0, item: 0 }, planos: [], sessoes: [], itens: [] };
    const datas = PLANO.map((s) => hoje(s.dia));

    dados.planos.push({
        id: 1, tema: "React", respostas: [], dias: [...new Set(datas.map(diaDaSemana))].sort(),
        minutos: 45, horario: "19:00", inicio: datas[0], semanas: 6, motor: "demo", idioma: "pt",
        cor: "#3b5bdb", status: "pronto", etapa: null, erro: null, titulo: "Introdução ao React",
        doc_oficial: "react.dev", criado_em: `${hoje()} 08:00:00`
    });

    PLANO.forEach((sessao, i) => {
        const sessaoId = ++dados.seq.sessao;
        dados.sessoes.push({ id: sessaoId, plano_id: 1, data: datas[i], topico: sessao.topico, objetivo: sessao.objetivo, extra: 0 });
        sessao.itens.forEach(([tipo, titulo, url, descricao, fonte, minutos]) => dados.itens.push({
            id: ++dados.seq.item, sessao_id: sessaoId, tipo, titulo, url, descricao, fonte, minutos,
            // na primeira sessão, o vídeo e a documentação já estão feitos
            estado: i === 0 && tipo !== "atividade" ? "feito" : "pendente", origem_id: null
        }));
    });

    // um plano já concluído, pra o jardim dos pets ter morador
    dados.planos.push({
        id: 2, tema: "Lógica de programação", respostas: [], dias: [0, 2, 4], minutos: 30, horario: null,
        inicio: hoje(-30), semanas: 1, motor: "demo", idioma: "pt", cor: "#2f6f4f", status: "pronto", etapa: null,
        erro: null, titulo: "Lógica de programação do zero", doc_oficial: null, criado_em: `${hoje(-30)} 08:00:00`, pai_id: null
    });
    dados.seq.plano = 2;
    [
        [-30, "Algoritmos e variáveis", "Pensar em passos e guardar valores.", "Lógica de Programação - Aula 1", "https://www.youtube.com/results?search_query=logica+de+programacao+aula+1"],
        [-28, "Condicionais", "Decidir com if e else.", "Estruturas condicionais", "https://www.youtube.com/results?search_query=estruturas+condicionais+logica"],
        [-26, "Laços de repetição", "Repetir tarefas com while e for.", "Laços de repetição", "https://www.youtube.com/results?search_query=lacos+de+repeticao+logica"]
    ].forEach(([dia, topico, objetivo, video, url]) => {
        const sessaoId = ++dados.seq.sessao;
        dados.sessoes.push({ id: sessaoId, plano_id: 2, data: hoje(dia), topico, objetivo, extra: 0 });
        dados.itens.push({ id: ++dados.seq.item, sessao_id: sessaoId, tipo: "video", titulo: video, url, descricao: null, fonte: "YouTube", minutos: 12, estado: "feito", origem_id: null });
        dados.itens.push({ id: ++dados.seq.item, sessao_id: sessaoId, tipo: "atividade", titulo: "Pratique", url: null, descricao: `Escreva um algoritmo usando ${topico.toLowerCase()}.`, fonte: null, minutos: 15, estado: "feito", origem_id: null });
    });

    // pets ligados na demonstração: o Mochi cuida do React, a Hana mora no jardim
    dados.pets = {
        ligado: true, encerrados: [], bonus: 1000, compras: ["cachecol-brasa", "chapeu-mago", "coruja"],
        pets: {
            1: { nome: "Mochi", especie: "gato", cor: "laranja", acessorios: ["cachecol-brasa"] },
            2: { nome: "Hana", especie: "coruja", cor: "marrom", acessorios: ["chapeu-mago"] }
        }
    };

    // cartões da primeira sessão (a que já tem itens feitos), prontos pra área de flashcards
    dados.flashcards = [
        ["O que é o React?", "Uma biblioteca JavaScript pra montar interfaces a partir de componentes reutilizáveis."],
        ["Pra que serve um componente?", "Junta um pedaço da tela (visual e comportamento) num bloco que dá pra reaproveitar."],
        ["O que é JSX?", "Uma sintaxe parecida com HTML dentro do JavaScript. Ex.: return <h1>Olá</h1>;"],
        ["React é um framework completo?", "Não: é uma biblioteca de interface. Rotas e dados vêm de outras ferramentas."],
        ["O que o React faz quando o estado muda?", "Atualiza na tela só o que mudou, sem recarregar a página."],
        ["Como é um componente funcional mínimo?", "Uma função que devolve JSX. Ex.: function Ola() { return <p>Oi</p>; }"]
    ].map(([frente, verso], i) => ({ id: i + 1, sessao_id: 1, frente, verso, caixa: 0, revisar_em: hoje() }));
    dados.seq.cartao = dados.flashcards.length;
    dados.perfil = { sobre: "Faço faculdade de ADS e aprendo melhor com exemplos práticos." };

    const conversa = [
        { papel: "usuario", texto: "Tenho 3 entregas essa semana e tô travado. Por onde começo?" },
        { papel: "assistente", texto: "Vamos por partes. Olhando seu quadro:\n\n1. **Refatorar tela de login** (alta, vence amanhã): comece por ela, de manhã, quando a cabeça está fresca.\n2. **Revisar proposta do cliente** (alta): reserve 1 hora à tarde.\n3. **Apresentação da sprint**: dá pra fazer em blocos de 25 min ao longo da semana.\n\nDica *kaizen*: termine uma coisa pequena hoje. Tirar a primeira tarefa da coluna dá ritmo pro resto." }
    ];

    const semente = {
        "kaizen.tarefas.v1": tarefas,
        "kaizen.categorias.v1": ["Trabalho", "Estudos", "Pessoal", "Casa"],
        "kaizen.nuvem.dados.v1": dados,
        "kaizen.chat.historico.v1": conversa,
        "kaizen.fundo.modo": "cena:pagode-lofi",
        "kaizen.instalar.dispensado.v1": "1"
    };

    for (const [chave, valor] of Object.entries(semente)) {
        localStorage.setItem(chave, typeof valor === "string" ? valor : JSON.stringify(valor));
    }

}



/* =========================================================
   Rotas que a demonstração responde sozinha (o resto segue
   pro servidor de bolso em js/nuvem/servidor.js)
========================================================= */

const SO_NA_VERSAO_COMPLETA =
    "Na demonstração não dá pra fazer isso. Baixe o Kaizen (é grátis) ou abra o app pra usar com a sua IA.";

function json(status, corpo) {
    return new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
}


export async function rotaDemo(url, opcoes = {}) {

    const metodo = (opcoes.method || "GET").toUpperCase();
    const caminho = url.pathname.slice(url.pathname.indexOf("/api/"));

    if (caminho === "/api/ia/status") {
        return json(200, { disponivel: true, modelos: ["demonstração"], servidor: "IA de demonstração" });
    }

    if (caminho === "/api/chat" && metodo === "POST") {
        const corpo = JSON.parse(opcoes.body || "{}");
        const ultima = [...(corpo.mensagens || [])].reverse().find((m) => m.role === "user");
        await new Promise((r) => setTimeout(r, 900 + Math.random() * 700));
        return json(200, { resposta: responder(ultima ? ultima.content : ""), modelo: "demonstração" });
    }

    const criaAlgo = metodo !== "GET" && (
        caminho.startsWith("/api/estudos/perguntas") ||
        caminho === "/api/estudos/planos" ||
        caminho.startsWith("/api/ia/servidores") ||
        caminho.startsWith("/api/ia/local")
    );

    if (criaAlgo) return json(400, { erro: SO_NA_VERSAO_COMPLETA });

    return null;

}


function responder(pergunta) {

    const p = pergunta.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

    if (/react|estud|aprend|plano|curso/.test(p)) {
        return "Seu plano de **React** está na aba **Estudos**: 12 sessões de 45 min, cada uma com vídeo, documentação oficial e uma atividade.\n\n" +
            "- Hoje é **O que é React**: falta só a atividade prática.\n" +
            "- Não deu tempo? Marque ✕ e o item vai sozinho pra próxima sessão.\n\n" +
            "Na versão completa, é só escrever o que você quer aprender que a IA monta um plano novo em cerca de um minuto.";
    }

    if (/comec|travad|priori|primeiro|urgente|semana|hoje|fazer/.test(p)) {
        return "Pelo seu quadro, eu iria nesta ordem:\n\n" +
            "1. **Refatorar tela de login** (alta, vence amanhã)\n" +
            "2. **Revisar proposta do cliente** (alta)\n" +
            "3. **Ler capítulo 4 de Clean Code**, em blocos de 25 min\n\n" +
            "Arraste a primeira pra **Concluído** quando terminar e veja a cena do fundo mudar.";
    }

    if (/cena|fundo|paisag|pagode|fuji/.test(p)) {
        return "Clique no selo **改善** no canto de cima pra trocar a cena. São seis, e cada tarefa concluída muda a paisagem: no pagode, acendem janelas e lanternas. Aperte **Z** pra ver a cena inteira.";
    }

    if (/^(oi|ola|e ai|eai|bom dia|boa tarde|boa noite)\b/.test(p)) {
        return "Oi! Eu sou a IA de demonstração do Kaizen. Pergunte por onde começar a semana, sobre o plano de React ou sobre as cenas do fundo.";
    }

    return "Esta é uma **demonstração**, então minhas respostas são prontas. No Kaizen de verdade, a IA roda no seu computador (com o Ollama) ou na nuvem (o OpenRouter tem modelos grátis) e responde qualquer pergunta.\n\n" +
        "Experimente aqui:\n" +
        "- arrastar uma tarefa pra **Concluído**;\n" +
        "- abrir a aba **Estudos** e marcar um item;\n" +
        "- trocar a cena no selo **改善**.";

}


// sessões do plano de exemplo (dia = quantos dias depois da primeira)
const PLANO =[
    { dia: 0, topico: "O que é React", objetivo: "Entender a definição e a finalidade do React.", itens: [
        ["video", "React JS // Dicionário do Programador", "https://www.youtube.com/watch?v=NhUr8cwDiiM", null, "Código Fonte TV", 10],
        ["doc", "Início rápido - React", "https://pt-br.react.dev/learn", null, "pt-br.react.dev", null],
        ["doc", "React - Uma biblioteca JavaScript para criar interfaces de usuário", "https://pt-br.reactjs.org/", null, "pt-br.reactjs.org", null],
        ["atividade", "Criar um componente básico", null, "Implemente um componente funcional que exiba um texto na tela.", null, 15]
    ] },
    { dia: 2, topico: "Componentes em React", objetivo: "Construir componentes reutilizáveis em React.", itens: [
        ["video", "Simplificando o conceito de componentes e propriedades no React", "https://www.youtube.com/watch?v=00nfvN2UTZc", null, "Rocketseat", 9],
        ["doc", "Componentes", "https://pt-br.react.dev/reference/react/components", null, "pt-br.react.dev", null],
        ["doc", "Mantendo seus Componentes Puros", "https://pt-br.react.dev/learn/keeping-components-pure", null, "pt-br.react.dev", null],
        ["atividade", "Desenvolver um componente de botão", null, "Crie um componente de botão que mude a cor ao ser clicado.", null, 15]
    ] },
    { dia: 7, topico: "Props e State", objetivo: "Passar dados entre componentes e gerenciar estado interno.", itens: [
        ["video", "ReactJS - O que são Components, Props e State", "https://www.youtube.com/watch?v=TlD49IAEPmc", null, "Vinicius Dacal", 5],
        ["doc", "Gerenciamento de estado", "https://pt-br.react.dev/learn/managing-state", null, "pt-br.react.dev", null],
        ["doc", "Estado como um Snapshot", "https://pt-br.react.dev/learn/state-as-a-snapshot", null, "pt-br.react.dev", null],
        ["atividade", "Criar um componente com props e state", null, "Desenvolva um componente que receba props e atualize seu estado com base nelas.", null, 15]
    ] },
    { dia: 9, topico: "Eventos em React", objetivo: "Manipular eventos de interação do usuário em componentes.", itens: [
        ["video", "Curso  React: Eventos no React (onClick, onChange e onSubmit) - #09", "https://www.youtube.com/watch?v=uqmRi4JXk3s", null, "Matheus Battisti - Hora de Codar", 11],
        ["doc", "Respondendo a Eventos", "https://pt-br.react.dev/learn/responding-to-events", null, "pt-br.react.dev", null],
        ["doc", "Separando Eventos de Effects", "https://pt-br.react.dev/learn/separating-events-from-effects", null, "pt-br.react.dev", null],
        ["atividade", "Implementar um evento de clique", null, "Crie um componente que exiba uma mensagem ao ser clicado.", null, 15]
    ] },
    { dia: 14, topico: "Listas e Chaves", objetivo: "Renderizar listas de elementos em React com chaves únicas.", itens: [
        ["video", "JOVENS REAGEM A YTPBR - O JULGAMENTO DO CHACH E JANELA DA RUA", "https://www.youtube.com/watch?v=CQHL_Rc_Clk", null, "Janela da Rua", 13],
        ["doc", "Renderizando Listas", "https://pt-br.react.dev/learn/rendering-lists", null, "pt-br.react.dev", null],
        ["doc", "JavaScript entre Chaves no JSX", "https://pt-br.react.dev/learn/javascript-in-jsx-with-curly-braces", null, "pt-br.react.dev", null],
        ["atividade", "Exibir uma lista de usuários", null, "Crie um componente que exiba uma lista de usuários com chaves únicas.", null, 15]
    ] },
    { dia: 16, topico: "Condicionais em React", objetivo: "Controlar a renderização de componentes com base em condições.", itens: [
        ["video", "Curso React: Renderização condicional (if) - #12", "https://www.youtube.com/watch?v=7ewepbLCvHc", null, "Matheus Battisti - Hora de Codar", 12],
        ["doc", "Renderização condicional - React", "https://pt-br.react.dev/learn/conditional-rendering", null, "pt-br.react.dev", null],
        ["doc", "Renderização condicional no React: if, ternário, && e null", "https://coddy.tech/docs/pt/react/conditional-rendering", null, "coddy.tech", null],
        ["atividade", "Mostrar conteúdo com base em um estado", null, "Desenvolva um componente que exiba diferentes mensagens com base no estado.", null, 15]
    ] },
    { dia: 21, topico: "Formulários em React", objetivo: "Gerenciar entradas de formulários com estado.", itens: [
        ["video", "Curso React: Componentização de formulário - #22", "https://www.youtube.com/watch?v=dZtuJ2Ns7q8", null, "Matheus Battisti - Hora de Codar", 17],
        ["doc", "Gerenciamento de estado", "https://pt-br.react.dev/learn/managing-state", null, "pt-br.react.dev", null],
        ["doc", "Estado como um Snapshot", "https://pt-br.react.dev/learn/state-as-a-snapshot", null, "pt-br.react.dev", null],
        ["atividade", "Criar um formulário de cadastro", null, "Desenvolva um formulário que colete dados do usuário e os armazene em estado.", null, 15]
    ] },
    { dia: 23, topico: "Componentes de Classe", objetivo: "Criar componentes de classe com ciclo de vida.", itens: [
        ["video", "Componentes funcionais para componentes de classe [Desafio de React] - Curso de React - Aula 32", "https://www.youtube.com/watch?v=JDiH9BMzjNs", null, "CFBCursos", 11],
        ["doc", "Componentes", "https://pt-br.react.dev/reference/react/components", null, "pt-br.react.dev", null],
        ["doc", "Mantendo seus Componentes Puros", "https://pt-br.react.dev/learn/keeping-components-pure", null, "pt-br.react.dev", null],
        ["atividade", "Implementar um componente de classe", null, "Desenvolva um componente de classe que exiba um texto e atualize seu estado.", null, 15]
    ] },
    { dia: 28, topico: "Context API", objetivo: "Compartilhar estado entre componentes sem props drilling.", itens: [
        ["video", "Context API: Aprenda a compartilhar informações entre componentes | Simples e Rápido", "https://www.youtube.com/watch?v=06GdS_2bmgs", null, "Hero Code", 17],
        ["doc", "Passando Dados Profundamente com Contexto", "https://pt-br.react.dev/learn/passing-data-deeply-with-context", null, "pt-br.react.dev", null],
        ["doc", "Escalando com Reducer e Context", "https://pt-br.react.dev/learn/scaling-up-with-reducer-and-context", null, "pt-br.react.dev", null],
        ["atividade", "Criar um contexto para tema escuro", null, "Desenvolva um contexto que permita alternar entre tema escuro e claro.", null, 15]
    ] },
    { dia: 30, topico: "Introdução a Hooks", objetivo: "Entender os conceitos básicos de hooks em React.", itens: [
        ["video", "Dominando o React Hook useState | Aprenda a Gerenciar o Estado no React", "https://www.youtube.com/watch?v=E-gIg2dXWv4", null, "DevClub | Programação", 16],
        ["doc", "Hooks", "https://pt-br.react.dev/reference/react/hooks", null, "pt-br.react.dev", null],
        ["doc", "Hooks", "https://pt-br.react.dev/reference/react-dom/hooks", null, "pt-br.react.dev", null],
        ["atividade", "Usar o hook useState", null, "Crie um componente que use o useState para gerenciar um estado.", null, 15]
    ] },
    { dia: 35, topico: "Mini Projeto: To-Do List", objetivo: "Criar uma aplicação To-Do List usando conceitos aprendidos em React.", itens: [
        ["video", "Construa o seu ToDO List em React Js  | Protótipo parte 1", "https://www.youtube.com/watch?v=fG5iKnJGbvM", null, "laiza do conecta elas ⚡", 8],
        ["doc", "useState", "https://pt-br.react.dev/reference/react/useState", null, "pt-br.react.dev", null],
        ["doc", "Component", "https://pt-br.react.dev/reference/react/Component", null, "pt-br.react.dev", null],
        ["atividade", "Implementar a lógica de adição de tarefas", null, "Desenvolva a funcionalidade de adicionar tarefas à lista, usando o state e eventos de input.", null, 15],
        ["atividade", "Adicionar funcionalidade de marcação de tarefas como concluídas", null, "Implemente a funcionalidade de marcar tarefas como concluídas e removê-las da lista.", null, 15]
    ] },
    { dia: 37, topico: "Mini Projeto: Contador de Palavras", objetivo: "Criar um aplicativo que conta o número de palavras em um texto usando React.", itens: [
        ["video", "Criando contador com React Hooks", "https://www.youtube.com/watch?v=Dip3fPxWuGs", null, "Isla Lab", 4],
        ["doc", "useState", "https://pt-br.react.dev/reference/react/useState", null, "pt-br.react.dev", null],
        ["doc", "useEffect", "https://pt-br.react.dev/reference/react/useEffect", null, "pt-br.react.dev", null],
        ["atividade", "Criar o componente principal com input e exibição do texto", null, "Desenvolva o componente que recebe o texto do usuário e exibe-o na tela.", null, 15],
        ["atividade", "Implementar a contagem de palavras e exibi-la", null, "Adicione a lógica de contagem de palavras e exiba o resultado em tempo real.", null, 15]
    ] }
];


// por último: o PLANO acima precisa existir antes de semear
if (DEMO) {
    instalarMemoria();
    semear();
    document.documentElement.dataset.demo = "";
}
