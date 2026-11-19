/* =========================================================
   GALERIA DE PLANOS — planos prontos pra começar em 30 segundos
   ---------------------------------------------------------
   Cada plano está no mesmo formato do "compartilhar plano"
   (app: "kaizen-plano"), então entra pelo mesmo caminho:
   /api/estudos/importar-plano. Não precisa de IA, de chave
   nem de internet pra montar: a pessoa escolhe os dias e o
   plano aparece no calendário, com flashcards e atividades.

   Só links de documentação oficial e de enciclopédia, que
   duram. Nada de vídeo aqui: um link de vídeo morre, e o app
   já busca vídeo certo quando a IA monta um plano sob medida.
   `node scripts/conferir-galeria.mjs` confere se todo link
   ainda responde.

   Pra acrescentar um plano: copie um bloco de PLANOS, troque
   o conteúdo e confira os links.
========================================================= */

import { atividade, base, doc, sessao } from "./galeria-ajudas.js";
import ENEM_A from "./galeria-enem-a.js";
import ENEM_B from "./galeria-enem-b.js";
import AREAS from "./galeria-areas.js";

const MDN = "MDN Web Docs";
const PY = "Documentação do Python";
const REACT = "react.dev";
const GH = "GitHub Docs";
const BOLT = "SQLBolt";
const WIKI = "Wikipédia";



const PLANOS = [

    /* ---------------------------------------------------------------- JavaScript */
    {
        id: "javascript", emoji: "🟨", area: "Programação", nivel: "Iniciante",
        resumo: "Do zero até buscar dados de uma API e mexer na página.",
        plano: {
            ...base, idioma: "pt", tema: "JavaScript do zero", titulo: "JavaScript do zero", doc_oficial: MDN,
            sessoes: [
                sessao("O que é JavaScript e como rodar", "Rodar o primeiro código no navegador e entender onde o JavaScript vive.", [
                    doc("O que é JavaScript?", "https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Core/Scripting/What_is_JavaScript", MDN, "Visão geral do que a linguagem faz na web e de onde o código roda."),
                    atividade("Seu primeiro script", "Abra o navegador, aperte F12 e vá na aba Console. Escreva console.log(\"Olá, Kaizen!\") e aperte Enter. Depois crie um arquivo index.html com uma tag <script> que mostra a mesma mensagem no console e abra-o no navegador.")
                ], [
                    ["Onde o JavaScript roda na web?", "No navegador (cada aba tem seu motor) e, fora dele, em ambientes como o Node.js."],
                    ["Pra que serve o console.log?", "Mostra valores no console do navegador. É a forma mais rápida de inspecionar o que o código está fazendo."],
                    ["HTML, CSS e JavaScript: o papel de cada um?", "HTML dá a estrutura, CSS dá a aparência e JavaScript dá o comportamento."]
                ]),
                sessao("Variáveis e tipos de dados", "Guardar valores com let e const e reconhecer os tipos básicos.", [
                    doc("Gramática e tipos", "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Grammar_and_types", MDN, "Declaração de variáveis, escopo e os tipos primitivos."),
                    atividade("Crie seu perfil em variáveis", "Declare variáveis com nome, idade, cidade e se você estuda programação (um booleano). Mostre tudo no console e use typeof em cada uma pra conferir o tipo.")
                ], [
                    ["Quando usar const e quando usar let?", "const pro que não vai ser reatribuído (o padrão); let pro que muda. Evite var."],
                    ["Quais são os tipos primitivos?", "string, number, boolean, null, undefined, bigint e symbol."],
                    ["Qual a diferença entre null e undefined?", "undefined é 'ainda sem valor'; null é 'sem valor, de propósito'."]
                ]),
                sessao("Operadores e condicionais", "Comparar valores e escolher caminhos com if/else.", [
                    doc("Controle de fluxo e tratamento de erros", "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Control_flow_and_error_handling", MDN, "if/else, switch e try/catch."),
                    atividade("Classificador de notas", "Escreva um código que recebe uma nota de 0 a 10 e mostra 'Aprovado' (7 ou mais), 'Recuperação' (de 5 a 6,9) ou 'Reprovado'. Teste com cinco notas diferentes, incluindo os limites 5 e 7.")
                ], [
                    ["Qual a diferença entre == e ===?", "== converte tipos antes de comparar; === compara valor e tipo. Prefira ===."],
                    ["O que é 'falsy' em JavaScript?", "Valores tratados como falsos num if: false, 0, \"\", null, undefined e NaN."],
                    ["Pra que serve o operador ternário?", "É um if/else numa expressão: condição ? valorSeVerdadeiro : valorSeFalso."]
                ]),
                sessao("Laços de repetição", "Repetir tarefas com for, while e for...of sem criar laços infinitos.", [
                    doc("Laços e iteração", "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Loops_and_iteration", MDN, "for, while, do...while, for...of e for...in."),
                    atividade("Tabuada e soma", "Mostre a tabuada do 7 (de 1 a 10) com um for. Depois some os números de 1 a 100 com um while e confira se o resultado é 5050.")
                ], [
                    ["Quais as três partes de um for clássico?", "Inicialização, condição e incremento: for (let i = 0; i < n; i++)."],
                    ["O que causa um laço infinito?", "Uma condição que nunca fica falsa, normalmente porque a variável do teste não é atualizada."],
                    ["Quando usar for...of?", "Pra percorrer os valores de algo iterável, como um array ou uma string."]
                ]),
                sessao("Funções", "Organizar código reaproveitável com funções e arrow functions.", [
                    doc("Funções", "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Functions", MDN, "Declaração, parâmetros, retorno, escopo e arrow functions."),
                    atividade("Biblioteca de funções", "Crie três funções: calcularMedia(a, b), ehPar(n) e saudacao(nome). Cada uma deve retornar um valor (não só mostrar no console). Teste todas com pelo menos três entradas.")
                ], [
                    ["Qual a diferença entre parâmetro e argumento?", "Parâmetro é o nome na definição da função; argumento é o valor passado na chamada."],
                    ["O que uma função retorna se não tiver return?", "undefined."],
                    ["O que é uma arrow function?", "Sintaxe curta de função: (a, b) => a + b. Ela não cria o próprio this."]
                ]),
                sessao("Arrays e objetos", "Guardar coleções e dados estruturados, e transformá-los com map, filter e reduce.", [
                    doc("Trabalhando com objetos", "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Working_with_objects", MDN, "Criar objetos, acessar propriedades e métodos."),
                    doc("Array", "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Array", MDN, "Referência dos métodos de array (map, filter, reduce, find…).", 20),
                    atividade("Lista de tarefas em dados", "Crie um array de objetos { titulo, feita }. Use filter pra listar só as pendentes, map pra listar só os títulos e find pra achar uma tarefa pelo título.")
                ], [
                    ["O que o map faz?", "Cria um array novo aplicando uma função a cada item. O original não muda."],
                    ["O que o filter devolve?", "Um array novo só com os itens em que a função retornou verdadeiro."],
                    ["Como acessar a propriedade nome de um objeto pessoa?", "pessoa.nome ou pessoa[\"nome\"] (a segunda serve quando o nome está numa variável)."]
                ]),
                sessao("DOM: mexendo na página", "Selecionar elementos e reagir a cliques.", [
                    doc("Introdução ao DOM", "https://developer.mozilla.org/pt-BR/docs/Web/API/Document_Object_Model/Introduction", MDN, "Como o navegador representa a página como uma árvore de objetos."),
                    atividade("Contador de cliques", "Crie uma página com um botão e um número. Cada clique no botão soma 1 ao número na tela (use querySelector e addEventListener). Extra: um segundo botão que zera.")
                ], [
                    ["O que é o DOM?", "A representação da página como uma árvore de objetos que o JavaScript consegue ler e alterar."],
                    ["Como selecionar um elemento pelo seletor CSS?", "document.querySelector(\"#id\") ou document.querySelector(\".classe\")."],
                    ["Como reagir a um clique?", "elemento.addEventListener(\"click\", funcao)."]
                ]),
                sessao("Assíncrono: promises e fetch", "Buscar dados de uma API sem travar a página.", [
                    doc("Usando promises", "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Using_promises", MDN, "O que é uma promise e como encadear com then/catch."),
                    doc("Usando a Fetch API", "https://developer.mozilla.org/pt-BR/docs/Web/API/Fetch_API/Using_Fetch", MDN, "Fazer requisições HTTP com fetch e ler a resposta.", 20),
                    atividade("Piada da hora", "Use fetch com async/await pra buscar dados de uma API pública sem chave (por exemplo https://api.github.com/users/octocat) e mostrar o nome e o número de repositórios na página. Trate o erro com try/catch.", 30)
                ], [
                    ["O que é uma promise?", "Um objeto que representa um resultado que ainda vai chegar: pendente, cumprida ou rejeitada."],
                    ["O que o await faz?", "Pausa a função async até a promise resolver e devolve o resultado, sem travar o resto da página."],
                    ["O fetch rejeita a promise num erro 404?", "Não. Só rejeita em falha de rede. Num 404 você precisa checar response.ok."]
                ])
            ]
        }
    },

    /* ---------------------------------------------------------------- Python */
    {
        id: "python", emoji: "🐍", area: "Programação", nivel: "Iniciante",
        resumo: "O tutorial oficial do Python, em oito encontros práticos.",
        plano: {
            ...base, idioma: "pt", tema: "Python para iniciantes", titulo: "Python para iniciantes", doc_oficial: PY,
            sessoes: [
                sessao("Primeiros passos no Python", "Usar o interpretador, fazer contas e trabalhar com texto.", [
                    doc("Uma introdução informal ao Python", "https://docs.python.org/pt-br/3/tutorial/introduction.html", PY, "Números, strings e listas no interpretador interativo."),
                    atividade("Calculadora no terminal", "Abra o interpretador (python no terminal) e resolva: a média de três notas, o resto da divisão de 17 por 5 e o texto \"kaizen\" em maiúsculas e repetido 3 vezes.")
                ], [
                    ["Qual a diferença entre / e // no Python?", "/ é divisão normal (devolve float); // é divisão inteira."],
                    ["Como se junta (concatena) dois textos?", "Com +: \"ka\" + \"izen\". Pra repetir, use *: \"ab\" * 3."],
                    ["Como o Python marca blocos de código?", "Pela indentação (os espaços no começo da linha), não por chaves."]
                ]),
                sessao("Controle de fluxo: if, for e range", "Tomar decisões e repetir tarefas.", [
                    doc("Mais ferramentas de controle de fluxo", "https://docs.python.org/pt-br/3/tutorial/controlflow.html", PY, "if, for, range, break/continue e definição de funções."),
                    atividade("FizzBuzz", "De 1 a 30, mostre o número. Se for múltiplo de 3 mostre Fizz, de 5 mostre Buzz, de ambos mostre FizzBuzz.")
                ], [
                    ["O que o range(5) gera?", "Os números 0, 1, 2, 3 e 4 (o 5 fica de fora)."],
                    ["Pra que servem break e continue?", "break sai do laço; continue pula pra próxima volta."],
                    ["Como escrever else if no Python?", "Com elif."]
                ]),
                sessao("Funções", "Reaproveitar código com def, parâmetros e retorno.", [
                    doc("Definindo funções", "https://docs.python.org/pt-br/3/tutorial/controlflow.html#defining-functions", PY, "def, return, valores padrão e argumentos nomeados."),
                    atividade("Mini biblioteca", "Escreva eh_primo(n), media(lista) e inverter_texto(texto). Cada uma devolve (return) o resultado. Teste com 3 entradas cada.")
                ], [
                    ["Como definir uma função com valor padrão?", "def saudar(nome=\"mundo\"): ... — se não passar nada, usa o padrão."],
                    ["Print e return são a mesma coisa?", "Não. print mostra na tela; return devolve o valor pra quem chamou a função."],
                    ["O que uma função sem return devolve?", "None."]
                ]),
                sessao("Listas, tuplas, dicionários e conjuntos", "Escolher a estrutura de dados certa pra cada problema.", [
                    doc("Estruturas de dados", "https://docs.python.org/pt-br/3/tutorial/datastructures.html", PY, "Métodos de lista, compreensões, tuplas, conjuntos e dicionários."),
                    atividade("Agenda de contatos", "Crie um dicionário {nome: telefone} com 4 contatos. Mostre todos ordenados por nome, busque um nome que existe e um que não existe (sem dar erro) e remova um contato.")
                ], [
                    ["Qual a diferença entre lista e tupla?", "A lista é mutável; a tupla não pode ser alterada depois de criada."],
                    ["Pra que serve um conjunto (set)?", "Guardar itens sem repetição e testar pertencimento rápido."],
                    ["Como pegar um valor do dicionário sem dar erro se a chave não existir?", "Com .get(chave, padrao)."]
                ]),
                sessao("Módulos e pacotes", "Usar código de outros arquivos e da biblioteca padrão.", [
                    doc("Módulos", "https://docs.python.org/pt-br/3/tutorial/modules.html", PY, "import, from ... import e como o Python acha módulos."),
                    atividade("Dois arquivos", "Crie util.py com uma função e importe-a em principal.py. Depois use o módulo random da biblioteca padrão pra sortear um item de uma lista.")
                ], [
                    ["Como importar uma função de outro arquivo?", "from util import minha_funcao (ou import util e chamar util.minha_funcao)."],
                    ["Pra que serve if __name__ == \"__main__\"?", "Roda um trecho só quando o arquivo é executado direto, e não quando é importado."],
                    ["O que é a biblioteca padrão?", "O conjunto de módulos que já vem com o Python (random, datetime, json, os…)."]
                ]),
                sessao("Arquivos e entrada/saída", "Ler e gravar arquivos de texto e JSON.", [
                    doc("Entrada e saída", "https://docs.python.org/pt-br/3/tutorial/inputoutput.html", PY, "f-strings, open(), with e o módulo json."),
                    atividade("Diário em arquivo", "Peça um texto no terminal com input() e acrescente-o a diario.txt com a data. Depois leia o arquivo e mostre todas as entradas.")
                ], [
                    ["Por que usar with open(...)?", "Ele fecha o arquivo sozinho no fim, mesmo se der erro."],
                    ["Qual o modo de abertura pra acrescentar no fim?", "\"a\" (append). \"w\" apaga e escreve do zero; \"r\" lê."],
                    ["O que é uma f-string?", "Um texto com f na frente que aceita expressões entre chaves: f\"Olá, {nome}\"."]
                ]),
                sessao("Erros e exceções", "Tratar falhas em vez de deixar o programa quebrar.", [
                    doc("Erros e exceções", "https://docs.python.org/pt-br/3/tutorial/errors.html", PY, "try/except/else/finally e como levantar exceções."),
                    atividade("Entrada à prova de erro", "Peça um número ao usuário e repita a pergunta até ele digitar um número válido (use try/except ValueError). Trate também a divisão por zero numa função de dividir.")
                ], [
                    ["Pra que serve o bloco try/except?", "Tentar um código e decidir o que fazer se ele lançar um erro."],
                    ["O que roda sempre, com ou sem erro?", "O bloco finally."],
                    ["Por que evitar um except sem tipo?", "Ele esconde até erros que você não previu. Capture o tipo específico."]
                ]),
                sessao("Classes e objetos", "Modelar coisas do mundo real com classes.", [
                    doc("Classes", "https://docs.python.org/pt-br/3/tutorial/classes.html", PY, "class, __init__, métodos, atributos e herança."),
                    atividade("Conta bancária", "Crie a classe Conta com saldo, depositar(valor) e sacar(valor) (recusando saque maior que o saldo). Crie duas contas e mostre que os saldos são independentes.", 30)
                ], [
                    ["O que é o __init__?", "O método que roda ao criar o objeto e prepara seus atributos."],
                    ["O que é o self?", "A referência ao próprio objeto, sempre o primeiro parâmetro de um método."],
                    ["Qual a diferença entre classe e objeto?", "A classe é o molde; o objeto é uma unidade criada a partir dele."]
                ])
            ]
        }
    },

    /* ---------------------------------------------------------------- HTML e CSS */
    {
        id: "html-css", emoji: "🎨", area: "Programação", nivel: "Iniciante",
        resumo: "Monte páginas bonitas e que funcionam no celular.",
        plano: {
            ...base, idioma: "pt", tema: "HTML e CSS", titulo: "HTML e CSS na prática", doc_oficial: MDN,
            sessoes: [
                sessao("A estrutura de uma página HTML", "Escrever um documento HTML válido com títulos, parágrafos e links.", [
                    doc("Referência de elementos HTML", "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Element", MDN, "Lista de todos os elementos, para consultar e entender o papel de cada um."),
                    atividade("Página sobre você", "Crie index.html com <h1> com seu nome, dois parágrafos, uma lista dos seus hobbies e um link pro seu perfil do GitHub. Abra no navegador.")
                ], [
                    ["Pra que serve a tag <head>?", "Guarda informações sobre a página (título, idioma, estilos) que não aparecem no corpo."],
                    ["Qual a diferença entre <ul> e <ol>?", "<ul> é lista com marcadores; <ol> é lista numerada."],
                    ["Como criar um link?", "<a href=\"endereço\">texto do link</a>."]
                ]),
                sessao("HTML semântico", "Usar header, nav, main, section e footer no lugar de divs pra tudo.", [
                    doc("Elementos de seção", "https://developer.mozilla.org/pt-BR/docs/Web/HTML/Element#sectioning_root", MDN, "Elementos que dão significado às partes da página."),
                    atividade("Refaça com semântica", "Reescreva sua página usando <header>, <nav>, <main> com duas <section> e <footer>. Troque toda <div> genérica que puder por um elemento com significado.")
                ], [
                    ["Por que usar HTML semântico?", "Ajuda leitores de tela, buscadores e quem mantém o código a entender a estrutura."],
                    ["Quando usar <section> e quando <article>?", "<article> é conteúdo que faz sentido sozinho (post, notícia); <section> agrupa um tema dentro da página."],
                    ["Quantos <main> uma página deve ter?", "Um só."]
                ]),
                sessao("CSS: seletores e o modelo de caixa", "Aplicar estilos e entender margin, border e padding.", [
                    doc("Introdução ao modelo de caixa", "https://developer.mozilla.org/pt-BR/docs/Web/CSS/CSS_box_model/Introduction_to_the_CSS_box_model", MDN, "Como o navegador calcula o tamanho de cada elemento."),
                    atividade("Cartão de visita", "Em CSS, estilize um cartão: largura de 320px, padding de 24px, borda de 2px, cantos arredondados, sombra e um espaço de 16px entre ele e o resto. Mude o box-sizing pra border-box e veja o que muda.")
                ], [
                    ["Qual a ordem das camadas do modelo de caixa, de dentro pra fora?", "Conteúdo, padding, borda e margin."],
                    ["O que o box-sizing: border-box faz?", "Faz width e height incluírem padding e borda, o que facilita o cálculo de tamanhos."],
                    ["Qual a diferença entre classe e id num seletor?", "Classe (.nome) pode se repetir em vários elementos; id (#nome) deve ser único na página."]
                ]),
                sessao("Cores, fontes e texto", "Dar identidade visual com tipografia e paleta consistentes.", [
                    doc("Estilizando texto", "https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Core/Text_styling", MDN, "Fontes, tamanhos, espaçamento e alinhamento."),
                    atividade("Paleta com variáveis", "Defina em :root as variáveis --cor-principal, --cor-fundo e --cor-texto e use var() no resto do CSS. Escolha uma fonte do Google Fonts pros títulos e confira se o texto tem bom contraste.")
                ], [
                    ["Como declarar uma variável CSS?", "--nome: valor; dentro de um seletor (geralmente :root) e usar com var(--nome)."],
                    ["Por que usar rem em vez de px pra fontes?", "rem acompanha o tamanho de fonte que a pessoa configurou no navegador."],
                    ["O que é contraste de cor e por que importa?", "A diferença entre texto e fundo. Contraste baixo dificulta a leitura, principalmente pra baixa visão."]
                ]),
                sessao("Flexbox", "Alinhar e distribuir itens numa linha ou coluna.", [
                    doc("Conceitos básicos de flexbox", "https://developer.mozilla.org/pt-BR/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox", MDN, "Eixo principal e transversal, justify-content, align-items e flex-wrap."),
                    atividade("Barra de navegação", "Faça um menu horizontal com a logo à esquerda e três links à direita, centralizados na vertical (display: flex, justify-content e align-items). Depois faça os links quebrarem pra baixo em telas estreitas com flex-wrap.")
                ], [
                    ["Qual propriedade liga o flexbox?", "display: flex no elemento pai."],
                    ["O que justify-content controla?", "O alinhamento dos itens no eixo principal (por padrão, na horizontal)."],
                    ["E o align-items?", "O alinhamento no eixo transversal (por padrão, na vertical)."]
                ]),
                sessao("Grid", "Montar layouts em linhas e colunas.", [
                    doc("Conceitos básicos de grid", "https://developer.mozilla.org/pt-BR/docs/Web/CSS/CSS_grid_layout/Basic_concepts_of_grid_layout", MDN, "grid-template-columns, fr, gap e posicionamento de itens."),
                    atividade("Galeria de cartões", "Crie uma galeria com 6 cartões em grid de 3 colunas iguais e espaço de 16px. Depois use repeat(auto-fit, minmax(220px, 1fr)) pra ela se ajustar sozinha à largura da tela.")
                ], [
                    ["Quando preferir grid a flexbox?", "Grid pra layouts em duas dimensões (linhas e colunas); flexbox pra uma dimensão."],
                    ["O que é a unidade fr?", "Uma fração do espaço livre do grid: 1fr 2fr divide o espaço em 1/3 e 2/3."],
                    ["Qual propriedade cria o espaço entre itens do grid?", "gap."]
                ]),
                sessao("Responsivo: media queries", "Fazer a página funcionar bem no celular e no computador.", [
                    doc("Usando media queries", "https://developer.mozilla.org/pt-BR/docs/Web/CSS/CSS_media_queries/Using_media_queries", MDN, "Aplicar estilos conforme largura, orientação e preferências."),
                    atividade("Mobile first", "Escreva o CSS da sua galeria pensando primeiro no celular (uma coluna) e use @media (min-width: 768px) pra passar a 2 colunas e @media (min-width: 1100px) pra 3. Teste redimensionando a janela e com o modo celular do F12.")
                ], [
                    ["O que significa 'mobile first'?", "Escrever o CSS base pra telas pequenas e ir acrescentando regras pra telas maiores."],
                    ["Que meta tag a página precisa pra ser responsiva no celular?", "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">."],
                    ["O que prefers-color-scheme detecta?", "Se a pessoa prefere tema claro ou escuro no sistema."]
                ]),
                sessao("Formulários e acessibilidade", "Criar formulários que todo mundo consegue usar.", [
                    doc("Acessibilidade na web", "https://developer.mozilla.org/pt-BR/docs/Web/Accessibility", MDN, "Princípios e técnicas pra páginas utilizáveis por todos."),
                    atividade("Formulário de contato", "Monte um formulário com nome, e-mail, mensagem e botão de enviar. Cada campo deve ter <label> ligado ao input, os obrigatórios com required e o foco do teclado bem visível. Navegue só com a tecla Tab pra testar.", 30)
                ], [
                    ["Pra que serve o <label for>?", "Liga o texto ao campo: leitores de tela leem o nome do campo e clicar no texto foca o input."],
                    ["Qual o texto alternativo de uma imagem?", "O atributo alt, que descreve a imagem pra quem não a vê."],
                    ["Por que nunca remover o contorno de foco sem trocar por outro?", "Quem navega só pelo teclado perde a noção de onde está."]
                ])
            ]
        }
    },

    /* ---------------------------------------------------------------- React */
    {
        id: "react", emoji: "⚛️", area: "Programação", nivel: "Intermediário",
        resumo: "O caminho oficial do React: componentes, estado e efeitos.",
        plano: {
            ...base, idioma: "pt", tema: "React", titulo: "React: do primeiro componente aos efeitos", doc_oficial: REACT,
            sessoes: [
                sessao("Seu primeiro componente", "Criar, exportar e usar um componente.", [
                    doc("Seu primeiro componente", "https://pt-br.react.dev/learn/your-first-component", REACT, "Um componente é uma função que devolve JSX."),
                    atividade("Perfil em componente", "Crie um componente Perfil que mostra uma foto, um nome e uma frase. Use-o três vezes na mesma página.")
                ], [
                    ["O que é um componente React?", "Uma função JavaScript que devolve JSX, descrevendo um pedaço da interface."],
                    ["Por que o nome do componente começa com maiúscula?", "É assim que o React distingue componentes (<Perfil />) de tags HTML (<div>)."],
                    ["O que é JSX?", "Uma sintaxe parecida com HTML dentro do JavaScript, que o build converte em chamadas de função."]
                ]),
                sessao("JSX e props", "Escrever marcação com JavaScript e passar dados pra componentes.", [
                    doc("Passando props para um componente", "https://pt-br.react.dev/learn/passing-props-to-a-component", REACT, "Como componentes pais mandam informação pros filhos."),
                    atividade("Cartão reutilizável", "Transforme seu Perfil em um componente que recebe nome, foto e descrição por props. Renderize uma lista de 4 pessoas a partir de um array, usando map e key.")
                ], [
                    ["Props podem ser alteradas pelo componente filho?", "Não. Props são somente leitura; quem quer mudar um dado usa estado."],
                    ["Pra que serve a prop key numa lista?", "Ajuda o React a identificar cada item entre renderizações. Use um id estável."],
                    ["Como inserir uma expressão JavaScript no JSX?", "Entre chaves: {nome} ou {idade + 1}."]
                ]),
                sessao("Renderização condicional e listas", "Mostrar coisas diferentes conforme o estado dos dados.", [
                    doc("Renderização condicional", "https://pt-br.react.dev/learn/conditional-rendering", REACT, "if, && e o operador ternário no JSX."),
                    doc("Renderizando listas", "https://pt-br.react.dev/learn/rendering-lists", REACT, "map, filter e keys.", 20),
                    atividade("Lista com filtro", "Mostre uma lista de tarefas com um indicador ✓ nas feitas. Mostre a mensagem 'Nada por aqui' se a lista estiver vazia.")
                ], [
                    ["Como renderizar algo só se uma condição for verdadeira?", "{condicao && <Componente />} ou um ternário {condicao ? <A /> : <B />}."],
                    ["O que acontece se usar o índice do array como key numa lista que muda de ordem?", "O React pode misturar o estado entre itens. Prefira um id estável."]
                ]),
                sessao("Respondendo a eventos", "Reagir a cliques e a digitação.", [
                    doc("Respondendo a eventos", "https://pt-br.react.dev/learn/responding-to-events", REACT, "Handlers, propagação e como passar funções como props."),
                    atividade("Botão de curtir", "Faça um botão que mostra um alerta ao ser clicado. Depois um campo de texto que mostra, em tempo real, quantos caracteres foram digitados.")
                ], [
                    ["Como passar um handler de clique?", "<button onClick={funcao}>, passando a função, e não chamando ela (nada de funcao())."],
                    ["O que é a propagação de eventos?", "O evento sobe do elemento clicado pros pais. Dá pra barrar com e.stopPropagation()."]
                ]),
                sessao("Estado: a memória do componente", "Guardar valores que mudam com o useState.", [
                    doc("State: a memória de um componente", "https://pt-br.react.dev/learn/state-a-components-memory", REACT, "useState e por que variáveis comuns não bastam."),
                    atividade("Contador e lista viva", "Faça um contador com + e −. Depois um formulário que adiciona itens a uma lista guardada no estado (sem alterar o array: crie um novo).", 30)
                ], [
                    ["O que o useState devolve?", "Um par: o valor atual e a função que atualiza o valor e pede uma nova renderização."],
                    ["Por que não alterar o array do estado direto (push)?", "O React compara por referência. Sem um array novo, ele pode não perceber a mudança."],
                    ["Quando o React renderiza de novo um componente?", "Quando o estado ou as props dele mudam."]
                ]),
                sessao("Escolhendo a estrutura do estado", "Decidir onde o estado mora e evitar dados duplicados.", [
                    doc("Escolhendo a estrutura do state", "https://pt-br.react.dev/learn/choosing-the-state-structure", REACT, "Princípios pra estado sem duplicação e sem contradição."),
                    doc("Compartilhando estado entre componentes", "https://pt-br.react.dev/learn/sharing-state-between-components", REACT, "Elevar o estado pro ancestral comum.", 20),
                    atividade("Lista com seleção", "Faça uma lista de contatos onde clicar em um mostra o detalhe ao lado. Guarde só o id do selecionado no estado, e não uma cópia do contato.")
                ], [
                    ["O que é 'elevar o estado' (lifting state up)?", "Mover o estado pro componente pai comum a quem precisa dele e passar por props."],
                    ["Por que guardar só o id do item selecionado?", "Evita duas cópias do mesmo dado que podem ficar fora de sincronia."]
                ]),
                sessao("Efeitos: sincronizar com o mundo de fora", "Usar useEffect com sabedoria (e saber quando não usar).", [
                    doc("Sincronizando com efeitos", "https://pt-br.react.dev/learn/synchronizing-with-effects", REACT, "Quando e como usar useEffect, dependências e limpeza."),
                    atividade("Título que acompanha", "Use useEffect pra atualizar o document.title com o valor do contador. Depois busque dados de uma API ao montar o componente, com loading e erro.", 30)
                ], [
                    ["Pra que serve o array de dependências do useEffect?", "Diz quando o efeito deve rodar de novo: só se algum dos valores listados mudar."],
                    ["Pra que serve a função de limpeza do efeito?", "Desfaz o que o efeito fez (um timer, uma assinatura) antes de rodar de novo ou ao sair da tela."],
                    ["Um cálculo a partir das props precisa de useEffect?", "Não. Calcule direto durante a renderização."]
                ]),
                sessao("Projeto final: um app pequeno", "Juntar tudo num app que você pode mostrar.", [
                    doc("Pensando em React", "https://pt-br.react.dev/learn/thinking-in-react", REACT, "O passo a passo oficial pra quebrar uma tela em componentes."),
                    atividade("Seu mini app", "Escolha um: lista de tarefas, buscador de filmes (com uma API pública) ou quadro de notas. Desenhe os componentes no papel, defina onde mora cada estado e construa. Publique o código no GitHub.", 60)
                ], [
                    ["Qual o primeiro passo do 'Pensando em React'?", "Dividir a interface em uma hierarquia de componentes."],
                    ["Qual o mínimo de estado que um app precisa?", "O menor conjunto de dados que muda; o resto se calcula a partir dele."]
                ])
            ]
        }
    },

    /* ---------------------------------------------------------------- Git e GitHub */
    {
        id: "git", emoji: "🌿", area: "Programação", nivel: "Iniciante",
        resumo: "Controle de versão sem medo: commits, branches e pull requests.",
        plano: {
            ...base, idioma: "pt", tema: "Git e GitHub", titulo: "Git e GitHub sem medo", doc_oficial: GH,
            sessoes: [
                sessao("O que é Git e por que usar", "Entender controle de versão e instalar o Git.", [
                    doc("Sobre o Git", "https://docs.github.com/pt/get-started/using-git/about-git", GH, "O que é um sistema de controle de versão e como o Git funciona."),
                    atividade("Instale e se apresente", "Instale o Git, abra o terminal e rode git --version. Configure seu nome e e-mail com git config --global user.name e user.email.", 20)
                ], [
                    ["O que é controle de versão?", "Um sistema que guarda o histórico das mudanças num projeto, permitindo voltar no tempo e trabalhar em equipe."],
                    ["Git e GitHub são a mesma coisa?", "Não. Git é a ferramenta de controle de versão; GitHub é um serviço online que hospeda repositórios Git."],
                    ["O que é um repositório?", "A pasta do projeto junto com todo o histórico de mudanças."]
                ]),
                sessao("Seu primeiro repositório e commit", "Criar um repositório e registrar mudanças com commits.", [
                    doc("Configurando o Git", "https://docs.github.com/pt/get-started/getting-started-with-git/set-up-git", GH, "Instalação e configuração inicial."),
                    atividade("Três commits", "Crie uma pasta, rode git init, crie um arquivo, e faça três commits com mensagens claras (git add e git commit -m). Rode git log --oneline pra ver o histórico.")
                ], [
                    ["Qual a diferença entre git add e git commit?", "add escolhe o que entra no próximo commit (área de preparação); commit grava essa foto no histórico."],
                    ["O que é uma boa mensagem de commit?", "Curta, no imperativo e dizendo o que mudou e por quê: 'Corrige cálculo do frete'."],
                    ["Pra que serve o git status?", "Mostra o que mudou, o que está preparado e o que ainda não foi rastreado."]
                ]),
                sessao("Desfazendo coisas com segurança", "Descartar mudanças, voltar arquivos e corrigir o último commit.", [
                    doc("Desfazendo mudanças no Git", "https://git-scm.com/book/pt-br/v2/Fundamentos-do-Git-Desfazendo-Coisas", "Pro Git (livro oficial)", "restore, amend e reset: o que cada um faz."),
                    atividade("Quebre e conserte", "Edite um arquivo de propósito e descarte a mudança com git restore. Depois erre a mensagem de um commit e corrija com git commit --amend (só em commit que ainda não foi enviado).")
                ], [
                    ["Como descartar mudanças não commitadas de um arquivo?", "git restore arquivo (ela some de vez, cuidado)."],
                    ["Quando é seguro usar git commit --amend?", "Só em commits que ainda não foram enviados ao repositório remoto."],
                    ["O que o git revert faz?", "Cria um novo commit que desfaz outro, sem apagar o histórico."]
                ]),
                sessao("GitHub: repositório remoto", "Enviar seu projeto pro GitHub e baixar de lá.", [
                    doc("Início rápido do GitHub", "https://docs.github.com/pt/get-started/start-your-journey/hello-world", GH, "Criar um repositório, uma branch, fazer um commit e abrir um pull request."),
                    atividade("Publique seu projeto", "Crie um repositório vazio no GitHub, ligue seu projeto com git remote add origin e envie com git push. Depois clone-o noutra pasta com git clone e confira que o histórico veio junto.")
                ], [
                    ["O que o git push faz?", "Envia seus commits locais pro repositório remoto."],
                    ["Qual a diferença entre git fetch e git pull?", "fetch só baixa as novidades; pull baixa e já junta (merge) na sua branch."],
                    ["O que é o origin?", "O apelido padrão do repositório remoto de onde você clonou."]
                ]),
                sessao("Branches", "Trabalhar numa funcionalidade sem mexer na versão principal.", [
                    doc("Branches no Git", "https://git-scm.com/book/pt-br/v2/Ramifica%C3%A7%C3%A3o-Branching-no-Git-Branches-em-Poucas-Palavras", "Pro Git (livro oficial)", "O que é uma branch e como o Git a representa."),
                    atividade("Funcionalidade numa branch", "Crie a branch teste com git switch -c teste, faça dois commits nela, volte pra main e confira que os arquivos novos não estão lá. Depois traga tudo com git merge teste.")
                ], [
                    ["O que é uma branch?", "Uma linha independente de desenvolvimento: um ponteiro leve pra um commit."],
                    ["Pra que usar uma branch por funcionalidade?", "Isola o trabalho em andamento e deixa a main sempre estável."],
                    ["O que é um merge?", "Juntar o histórico de uma branch noutra."]
                ]),
                sessao("Conflitos de merge", "Resolver o que acontece quando duas pessoas mudam a mesma linha.", [
                    doc("Conflitos de mesclagem", "https://docs.github.com/pt/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/about-merge-conflicts", GH, "Por que acontecem e como resolver."),
                    atividade("Provoque um conflito", "Em duas branches, altere a mesma linha de um arquivo de jeitos diferentes e faça o merge. Abra o arquivo, escolha a versão certa entre os marcadores <<<<<<<, ======= e >>>>>>>, e conclua com git add e git commit.", 30)
                ], [
                    ["Quando acontece um conflito?", "Quando duas branches alteram as mesmas linhas de um arquivo e o Git não sabe qual escolher."],
                    ["O que são os marcadores <<<<<<< e >>>>>>>?", "Mostram as duas versões da região em conflito, pra você decidir o que fica."],
                    ["Como terminar a resolução?", "Editar o arquivo, git add e git commit."]
                ]),
                sessao("Pull requests e colaboração", "Propor mudanças em projetos e revisar código.", [
                    doc("Sobre pull requests", "https://docs.github.com/pt/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests", GH, "Como propor e revisar mudanças."),
                    atividade("Abra um PR", "Crie uma branch no seu repositório, faça uma mudança, envie e abra um pull request pra main. Escreva uma descrição clara e faça o merge pelo GitHub.")
                ], [
                    ["O que é um pull request?", "Um pedido pra juntar as mudanças de uma branch noutra, com espaço pra revisão e discussão."],
                    ["Pra que serve um fork?", "Uma cópia do repositório de outra pessoa na sua conta, pra você propor mudanças sem ter acesso direto."],
                    ["O que fazer antes de abrir um PR?", "Atualizar sua branch, testar e escrever uma descrição que diga o que mudou e por quê."]
                ]),
                sessao("Boas práticas: .gitignore e README", "Deixar o repositório limpo e fácil de entender.", [
                    doc("Ignorando arquivos", "https://docs.github.com/pt/get-started/getting-started-with-git/ignoring-files", GH, "O que nunca deve ir pro repositório e como o .gitignore resolve."),
                    atividade("Repositório de portfólio", "Adicione um .gitignore ao seu projeto (sem node_modules, senhas ou arquivos .env), um README com o que o projeto faz e como rodar, e confira com git status que nada indevido será enviado.")
                ], [
                    ["O que nunca deve ser commitado?", "Senhas, chaves de API, arquivos .env e dependências baixadas (como node_modules)."],
                    ["O que o .gitignore faz?", "Lista arquivos e pastas que o Git deve ignorar."],
                    ["O que um bom README tem?", "O que o projeto é, como instalar, como rodar e um exemplo de uso."]
                ])
            ]
        }
    },

    /* ---------------------------------------------------------------- SQL */
    {
        id: "sql", emoji: "🗄️", area: "Dados", nivel: "Iniciante",
        resumo: "Consultas, junções e modelagem, treinando em exercícios interativos.",
        plano: {
            ...base, idioma: "en", tema: "SQL básico", titulo: "SQL básico com prática", doc_oficial: BOLT,
            sessoes: [
                sessao("SELECT: lendo dados", "Escolher colunas e entender o que é uma tabela.", [
                    doc("SQLBolt: Introdução ao SELECT", "https://sqlbolt.com/lesson/select_queries_introduction", BOLT, "Lição interativa com exercícios no próprio navegador (em inglês)."),
                    atividade("Anote o que aprendeu", "Termine os exercícios da lição. Depois escreva, com suas palavras, o que fazem SELECT, FROM e o asterisco (*), e por que listar colunas é melhor que usar *.", 20)
                ], [
                    ["Pra que serve o SELECT?", "Escolher quais colunas ler de uma tabela."],
                    ["O que o SELECT * faz?", "Traz todas as colunas. Em produção, prefira listar só as que precisa."],
                    ["O que é uma tabela?", "Um conjunto de linhas (registros) com as mesmas colunas (campos)."]
                ]),
                sessao("Filtrando com WHERE", "Pegar só as linhas que interessam.", [
                    doc("SQLBolt: restrições (parte 1)", "https://sqlbolt.com/lesson/select_queries_with_constraints", BOLT, "WHERE com números, e operadores de comparação."),
                    doc("SQLBolt: restrições (parte 2)", "https://sqlbolt.com/lesson/select_queries_with_constraints_pt_2", BOLT, "LIKE, IN, BETWEEN e NOT.", 20),
                    atividade("Cinco filtros", "Com as tabelas dos exercícios, escreva cinco consultas diferentes usando =, >, LIKE, IN e BETWEEN. Anote o que cada uma devolve.")
                ], [
                    ["Pra que serve o LIKE?", "Buscar por padrão em texto: LIKE 'Ana%' pega tudo que começa com Ana."],
                    ["Qual a diferença entre AND e OR?", "AND exige as duas condições; OR aceita qualquer uma."],
                    ["O que o % significa no LIKE?", "Qualquer sequência de caracteres (inclusive nenhum)."]
                ]),
                sessao("Ordenando e limitando", "Controlar a ordem e a quantidade do resultado.", [
                    doc("SQLBolt: filtrando e ordenando", "https://sqlbolt.com/lesson/filtering_sorting_query_results", BOLT, "DISTINCT, ORDER BY, LIMIT e OFFSET."),
                    atividade("Top 5", "Escreva consultas pra mostrar os 5 maiores e os 5 menores valores de uma coluna numérica, e uma que pule os 5 primeiros (paginação) com OFFSET.")
                ], [
                    ["Como ordenar do maior pro menor?", "ORDER BY coluna DESC."],
                    ["Pra que serve o DISTINCT?", "Remove linhas repetidas do resultado."],
                    ["Como pegar só as 10 primeiras linhas?", "LIMIT 10."]
                ]),
                sessao("JOIN: juntando tabelas", "Combinar dados de tabelas relacionadas.", [
                    doc("SQLBolt: junções", "https://sqlbolt.com/lesson/select_queries_with_joins", BOLT, "INNER JOIN com chaves entre tabelas."),
                    doc("SQLBolt: outras junções", "https://sqlbolt.com/lesson/select_queries_with_outer_joins", BOLT, "LEFT, RIGHT e FULL JOIN.", 20),
                    atividade("Desenhe e junte", "Desenhe no papel duas tabelas (clientes e pedidos) ligadas por uma chave. Escreva um INNER JOIN e um LEFT JOIN e explique em uma frase por que o segundo mostra clientes sem pedidos.", 30)
                ], [
                    ["O que faz um INNER JOIN?", "Devolve só as linhas que têm correspondência nas duas tabelas."],
                    ["E um LEFT JOIN?", "Devolve todas as linhas da tabela da esquerda, com NULL onde não houver correspondência."],
                    ["O que é uma chave estrangeira?", "Uma coluna que aponta pra chave primária de outra tabela."]
                ]),
                sessao("Agregações e GROUP BY", "Contar, somar e tirar médias por grupo.", [
                    doc("SQLBolt: agregações (parte 1)", "https://sqlbolt.com/lesson/select_queries_with_aggregates", BOLT, "COUNT, SUM, AVG, MIN, MAX."),
                    doc("SQLBolt: agregações (parte 2)", "https://sqlbolt.com/lesson/select_queries_with_aggregates_pt_2", BOLT, "GROUP BY e HAVING.", 20),
                    atividade("Relatório", "Escreva uma consulta que mostre, por categoria, a quantidade de itens e o valor médio, só das categorias com mais de 3 itens (precisa de GROUP BY e HAVING).", 30)
                ], [
                    ["Qual a diferença entre WHERE e HAVING?", "WHERE filtra linhas antes de agrupar; HAVING filtra grupos depois."],
                    ["O que o COUNT(*) conta?", "O número de linhas do grupo."],
                    ["O que o GROUP BY faz?", "Junta as linhas com o mesmo valor numa coluna, pra aplicar uma agregação em cada grupo."]
                ]),
                sessao("INSERT, UPDATE e DELETE", "Alterar dados com cuidado.", [
                    doc("SQLBolt: inserindo linhas", "https://sqlbolt.com/lesson/inserting_rows", BOLT, "INSERT INTO."),
                    doc("SQLBolt: atualizando e apagando", "https://sqlbolt.com/lesson/updating_rows", BOLT, "UPDATE e DELETE (e o perigo de esquecer o WHERE).", 20),
                    atividade("Seguro por padrão", "Escreva um INSERT, um UPDATE e um DELETE, sempre com WHERE. Explique o que aconteceria com cada um se o WHERE fosse esquecido.")
                ], [
                    ["O que acontece num UPDATE sem WHERE?", "Todas as linhas da tabela são alteradas."],
                    ["Como se evita apagar a coisa errada?", "Rode primeiro um SELECT com o mesmo WHERE pra ver quais linhas serão afetadas."],
                    ["Qual a sintaxe básica do INSERT?", "INSERT INTO tabela (colunas) VALUES (valores)."]
                ]),
                sessao("Criando tabelas e chaves", "Definir a estrutura do banco.", [
                    doc("SQLBolt: criando tabelas", "https://sqlbolt.com/lesson/creating_tables", BOLT, "CREATE TABLE, tipos, PRIMARY KEY e NOT NULL."),
                    atividade("Seu mini sistema", "Crie duas tabelas ligadas (por exemplo alunos e cursos) com chave primária e estrangeira, insira dados e faça um JOIN pra mostrar quem faz qual curso.", 30)
                ], [
                    ["O que é uma chave primária?", "A coluna (ou conjunto) que identifica cada linha de forma única."],
                    ["Pra que serve o NOT NULL?", "Impede que a coluna fique sem valor."],
                    ["O que é um tipo de dado em SQL?", "A definição do que a coluna aceita: inteiro, texto, data, decimal etc."]
                ]),
                sessao("Modelagem: pensando em tabelas", "Planejar um banco antes de criar as tabelas.", [
                    doc("Modelo relacional", "https://pt.wikipedia.org/wiki/Modelo_relacional", WIKI, "Tabelas, chaves e relacionamentos (1:1, 1:N, N:N) que sustentam os bancos SQL."),
                    atividade("Modele uma biblioteca", "Desenhe o modelo de uma biblioteca com livros, autores e empréstimos. Decida as chaves, os relacionamentos (um livro pode ter vários autores?) e escreva o CREATE TABLE de tudo.", 40)
                ], [
                    ["Como representar uma relação N:N?", "Com uma tabela de ligação com as chaves das duas tabelas."],
                    ["O que é normalização?", "Organizar as tabelas pra evitar dados repetidos e inconsistências."],
                    ["O que é uma entidade?", "Algo sobre o que se guardam dados, como cliente ou pedido; vira uma tabela."]
                ])
            ]
        }
    },

    /* ---------------------------------------------------------------- Estatística */
    {
        id: "estatistica", emoji: "📊", area: "Exatas", nivel: "Iniciante",
        resumo: "Média, desvio, probabilidade e como não se enganar com números.",
        plano: {
            ...base, idioma: "pt", tema: "Estatística básica", titulo: "Estatística básica", doc_oficial: WIKI,
            sessoes: [
                sessao("População, amostra e tipos de dados", "Entender de onde vêm os dados e o que se pode fazer com cada tipo.", [
                    doc("Estatística", "https://pt.wikipedia.org/wiki/Estat%C3%ADstica", WIKI, "Visão geral da área e das suas ramificações."),
                    doc("Amostragem", "https://pt.wikipedia.org/wiki/Amostragem", WIKI, "Por que se estuda uma amostra e como escolhê-la.", 20),
                    atividade("Classifique variáveis", "Liste 10 variáveis do seu dia a dia (altura, cor dos olhos, nota de uma prova, nº de irmãos…) e classifique cada uma como qualitativa ou quantitativa, discreta ou contínua.", 20)
                ], [
                    ["Qual a diferença entre população e amostra?", "A população é o grupo todo que interessa; a amostra é a parte dele que você realmente observa."],
                    ["Dê um exemplo de variável quantitativa contínua.", "Altura, peso ou temperatura: aceitam valores quebrados."],
                    ["Por que a amostra precisa ser aleatória?", "Pra representar a população e evitar viés (distorção sistemática)."]
                ]),
                sessao("Média, mediana e moda", "Resumir um conjunto de dados com um único número, sabendo quando cada um engana.", [
                    doc("Média", "https://pt.wikipedia.org/wiki/M%C3%A9dia", WIKI, "Tipos de média e propriedades."),
                    doc("Mediana", "https://pt.wikipedia.org/wiki/Mediana_(estat%C3%ADstica)", WIKI, "O valor central e por que resiste a valores extremos.", 20),
                    atividade("O salário que engana", "Calcule média, mediana e moda do conjunto: 1800, 2000, 2100, 2200, 2300, 25000. Explique qual medida representa melhor 'o salário típico' e por quê.")
                ], [
                    ["Quando a mediana é melhor que a média?", "Quando há valores muito extremos (outliers), que puxam a média."],
                    ["O que é a moda?", "O valor que mais se repete."],
                    ["Como achar a mediana de 6 números?", "Ordene e faça a média dos dois do meio."]
                ]),
                sessao("Variação: variância e desvio padrão", "Medir o quanto os dados se espalham.", [
                    doc("Desvio padrão", "https://pt.wikipedia.org/wiki/Desvio_padr%C3%A3o", WIKI, "A medida de dispersão mais usada e como interpretá-la."),
                    atividade("Duas turmas", "A turma A tirou 5, 5, 5, 5, 5 e a B tirou 0, 10, 0, 10, 5. As médias são iguais. Calcule o desvio padrão de cada uma e explique o que ele mostra que a média esconde.", 30)
                ], [
                    ["O que o desvio padrão mede?", "O quanto, em média, os valores se afastam da média."],
                    ["Dois grupos com a mesma média podem ser muito diferentes?", "Sim. O que os diferencia é a dispersão (variância ou desvio padrão)."],
                    ["Qual a relação entre variância e desvio padrão?", "O desvio padrão é a raiz quadrada da variância."]
                ]),
                sessao("Gráficos: contando a história certa", "Escolher e ler gráficos sem se deixar enganar.", [
                    doc("Histograma", "https://pt.wikipedia.org/wiki/Histograma", WIKI, "Como representar a distribuição de uma variável contínua."),
                    doc("Diagrama de caixa", "https://pt.wikipedia.org/wiki/Diagrama_de_caixa", WIKI, "Mediana, quartis e valores atípicos num só desenho.", 20),
                    atividade("Gráfico que mente", "Procure um gráfico de jornal ou rede social que pareça exagerar um resultado (eixo cortado, escala estranha). Anote o que há de enganoso e redesenhe do jeito honesto.")
                ], [
                    ["Pra que serve um histograma?", "Mostrar como os valores de uma variável se distribuem em faixas."],
                    ["Por que cortar o eixo Y engana?", "Faz pequenas diferenças parecerem enormes."],
                    ["O que o diagrama de caixa mostra?", "A mediana, os quartis e os valores atípicos."]
                ]),
                sessao("Probabilidade: o essencial", "Calcular chances de eventos simples e combinados.", [
                    doc("Probabilidade", "https://pt.wikipedia.org/wiki/Probabilidade", WIKI, "Definição, regras da soma e do produto, eventos independentes."),
                    atividade("Dados e moedas", "Calcule a chance de tirar 7 somando dois dados, de dar cara três vezes seguidas numa moeda e de tirar pelo menos uma cara em três lançamentos. Depois confira simulando 50 lançamentos reais.", 30)
                ], [
                    ["Como calcular a probabilidade de um evento?", "Casos favoráveis divididos pelos casos possíveis (quando todos são igualmente prováveis)."],
                    ["Dois eventos independentes: como calcular a chance de ambos?", "Multiplicando as probabilidades."],
                    ["Qual a probabilidade do complemento de um evento?", "1 menos a probabilidade do evento."]
                ]),
                sessao("Distribuição normal", "Reconhecer a curva do sino e usar a regra 68-95-99,7.", [
                    doc("Distribuição normal", "https://pt.wikipedia.org/wiki/Distribui%C3%A7%C3%A3o_normal", WIKI, "A curva, os parâmetros média e desvio e a regra empírica."),
                    atividade("A altura da turma", "Meça (ou pesquise) a altura de 20 pessoas, desenhe o histograma e veja se parece com um sino. Calcule média e desvio padrão e confira quantas pessoas ficam a 1 desvio da média (deveria ser ~68%).", 30)
                ], [
                    ["O que a regra 68-95-99,7 diz?", "Numa distribuição normal, cerca de 68%, 95% e 99,7% dos dados ficam a 1, 2 e 3 desvios da média."],
                    ["Quais parâmetros definem uma distribuição normal?", "A média e o desvio padrão."],
                    ["Por que a distribuição normal aparece tanto?", "Porque muitas variáveis são a soma de vários pequenos efeitos independentes (teorema central do limite)."]
                ]),
                sessao("Correlação não é causa", "Ler relações entre variáveis sem tirar conclusões erradas.", [
                    doc("Correlação", "https://pt.wikipedia.org/wiki/Correla%C3%A7%C3%A3o", WIKI, "Coeficiente de correlação e o que ele não significa."),
                    atividade("Correlações absurdas", "Pesquise 'correlações espúrias' e escolha duas que fazem rir. Explique, em um parágrafo, por que elas existem e o que uma terceira variável escondida poderia explicar.")
                ], [
                    ["Correlação prova que uma coisa causa a outra?", "Não. Duas variáveis podem andar juntas por acaso ou por uma terceira causa."],
                    ["O que significa uma correlação de −1?", "Relação linear perfeita e inversa: quando uma sobe, a outra desce."],
                    ["O que é uma variável de confusão?", "Uma terceira variável que influencia as duas e cria a aparência de relação."]
                ]),
                sessao("Intervalos de confiança e testes de hipóteses", "Entender como se conclui algo a partir de uma amostra.", [
                    doc("Intervalo de confiança", "https://pt.wikipedia.org/wiki/Intervalo_de_confian%C3%A7a", WIKI, "Uma faixa plausível pro valor verdadeiro."),
                    doc("Teste de hipóteses", "https://pt.wikipedia.org/wiki/Teste_de_hip%C3%B3teses", WIKI, "Hipótese nula, valor-p e erros.", 20),
                    atividade("Leia uma pesquisa", "Ache uma pesquisa de opinião com 'margem de erro de 3 pontos'. Escreva o que isso quer dizer pro resultado de um candidato com 40% e se dois candidatos com 40% e 42% estão realmente empatados.", 30)
                ], [
                    ["O que é a margem de erro de uma pesquisa?", "A incerteza por ter ouvido só uma amostra: o valor real deve estar numa faixa em torno do resultado."],
                    ["O que é a hipótese nula?", "A afirmação de 'nenhum efeito' que o teste tenta contestar."],
                    ["O que um valor-p pequeno indica?", "Que o resultado observado seria raro se a hipótese nula fosse verdadeira."]
                ])
            ]
        }
    },

    /* ---------------------------------------------------------------- Aprender a aprender */
    {
        id: "aprender", emoji: "🧠", area: "Estudos", nivel: "Para todos",
        resumo: "As técnicas que a ciência prova que funcionam. Ótimo pra começar.",
        plano: {
            ...base, idioma: "pt", tema: "Aprender a aprender", titulo: "Aprender a aprender", doc_oficial: WIKI, minutos: 45,
            sessoes: [
                sessao("Como a memória funciona", "Entender por que a gente esquece e o que ajuda a lembrar.", [
                    doc("Curva do esquecimento", "https://pt.wikipedia.org/wiki/Curva_do_esquecimento", WIKI, "O que Ebbinghaus descobriu sobre a rapidez com que esquecemos."),
                    atividade("Seu teste de esquecimento", "Leia uma lista de 10 palavras aleatórias, feche a lista e escreva quantas lembra agora. Repita em 1 hora e amanhã, sem reler. Anote como a curva caiu.", 20)
                ], [
                    ["O que é a curva do esquecimento?", "O gráfico de como a lembrança cai com o tempo se não revisamos: cai rápido no começo e devagar depois."],
                    ["O que atrapalha a memória de longo prazo?", "Estudar tudo de uma vez, sem revisar, e sem dormir bem."],
                    ["Por que dormir ajuda a aprender?", "Durante o sono o cérebro consolida o que foi estudado."]
                ]),
                sessao("Repetição espaçada", "Revisar na hora certa pra lembrar por muito mais tempo.", [
                    doc("Repetição espaçada", "https://pt.wikipedia.org/wiki/Repeti%C3%A7%C3%A3o_espa%C3%A7ada", WIKI, "A técnica por trás dos flashcards: revisar com intervalos crescentes."),
                    atividade("Monte seu calendário de revisão", "Escolha um assunto que está estudando e planeje revisões em 1, 3, 7, 14 e 30 dias. Anote as datas aqui no Kaizen: os flashcards das sessões fazem exatamente isso por você.", 20)
                ], [
                    ["Como funciona a repetição espaçada?", "Você revisa um conteúdo em intervalos cada vez maiores, na hora em que estava prestes a esquecer."],
                    ["Por que errar um cartão faz ele voltar mais cedo?", "Porque o erro mostra que a lembrança ainda está fraca e precisa de reforço."],
                    ["É melhor estudar 4 h num dia ou 1 h em 4 dias?", "Em geral 1 h em 4 dias: o espaçamento fixa melhor na memória."]
                ]),
                sessao("Recordação ativa", "Testar-se em vez de só reler.", [
                    doc("Efeito do teste", "https://pt.wikipedia.org/wiki/Efeito_do_teste", WIKI, "Por que tentar lembrar fortalece a memória mais do que reler."),
                    atividade("Feche o livro", "Depois de ler uma seção de qualquer matéria, feche tudo e escreva num papel tudo que lembra. Só então confira o que ficou de fora. Faça isso em vez de grifar e releia só as lacunas.", 25)
                ], [
                    ["O que é recordação ativa?", "Tentar lembrar a informação sem olhar, em vez de simplesmente reler."],
                    ["Por que reler e grifar rende pouco?", "Dá a sensação de familiaridade sem exigir esforço de lembrar, e ela engana."],
                    ["Qual o jeito mais simples de praticar recordação ativa?", "Fazer perguntas sobre o que leu e responder de cabeça, como nos flashcards."]
                ]),
                sessao("Técnica Pomodoro e foco", "Estudar em blocos curtos e sem distração.", [
                    doc("Técnica Pomodoro", "https://pt.wikipedia.org/wiki/T%C3%A9cnica_pomodoro", WIKI, "25 minutos de foco e 5 de pausa, em ciclos."),
                    atividade("Três pomodoros", "Faça três ciclos de 25 minutos de foco total (celular em outro cômodo) com 5 de pausa. Anote o que te distraiu e como evitar na próxima.", 90)
                ], [
                    ["Como funciona a técnica Pomodoro?", "25 minutos de foco, 5 de pausa e, a cada 4 ciclos, uma pausa maior."],
                    ["Por que deixar o celular longe ajuda?", "Só a presença do aparelho já consome atenção, mesmo sem usá-lo."],
                    ["O que fazer quando uma ideia estranha aparece durante o foco?", "Anotar num papel pra depois e voltar à tarefa."]
                ]),
                sessao("Método Feynman: explicar pra entender", "Descobrir o que você realmente sabe ao tentar explicar simples.", [
                    doc("Richard Feynman", "https://pt.wikipedia.org/wiki/Richard_Feynman", WIKI, "O físico que popularizou a ideia de explicar de forma simples pra realmente entender."),
                    atividade("Explique pra uma criança", "Escolha um conceito que acabou de estudar e explique-o por escrito como se fosse pra uma criança de 10 anos, sem jargão. Onde travar ou usar termos difíceis é onde você ainda não entendeu: volte à fonte e refaça.", 25)
                ], [
                    ["Qual a ideia do método Feynman?", "Explicar com palavras simples; onde você trava mostra o que ainda não entendeu."],
                    ["Por que jargão pode esconder falta de entendimento?", "Dá a impressão de saber sem que você consiga explicar o raciocínio."],
                    ["Quando usar o método?", "Depois de estudar um conceito, antes de seguir pro próximo."]
                ]),
                sessao("Prática deliberada e metas pequenas", "Treinar o que ainda está difícil, em passos que cabem na semana.", [
                    doc("Zona de desenvolvimento proximal", "https://pt.wikipedia.org/wiki/Zona_de_desenvolvimento_proximal", WIKI, "Aprende-se mais no ponto em que a tarefa é difícil, mas possível com ajuda."),
                    atividade("Mapa dos seus pontos fracos", "Liste três pontos em que você erra mais no que está aprendendo. Pra cada um, defina um exercício de 20 minutos que treine só aquilo, e quando vai fazê-lo na semana.", 25)
                ], [
                    ["O que é prática deliberada?", "Treinar de propósito o que ainda está difícil, com feedback, em vez de repetir o que já sabe."],
                    ["Por que metas pequenas funcionam?", "Dão vitórias frequentes, e a sensação de progresso mantém a motivação."],
                    ["Qual a diferença entre praticar muito e praticar bem?", "Quantidade sem foco no ponto fraco quase não melhora; qualidade, sim."]
                ]),
                sessao("Seu sistema de estudo", "Juntar tudo numa rotina que você consegue manter.", [
                    doc("Metacognição", "https://pt.wikipedia.org/wiki/Metacogni%C3%A7%C3%A3o", WIKI, "Pensar sobre o próprio aprendizado pra ajustá-lo."),
                    atividade("Seu plano de estudo", "Escreva uma rotina de uma página: horários fixos, duração dos blocos, o que revisar e quando, e o que fazer num dia em que não rende. Crie agora, no Kaizen, o plano de algo que quer aprender de verdade.", 30)
                ], [
                    ["O que é metacognição?", "Pensar sobre como você aprende pra monitorar e melhorar o próprio estudo."],
                    ["O que uma boa rotina de estudo precisa ter?", "Horários fixos, blocos curtos, revisão espaçada e um plano pros dias ruins."],
                    ["Por que a constância vence a intensidade?", "Estudar um pouco todo dia constrói hábito e memória melhor que maratonas ocasionais."]
                ])
            ]
        }
    }

];


/* A ordem aqui é a da galeria: o que mais gente procura (ENEM) logo depois do de estudar melhor. */
export default [...ENEM_A, ...ENEM_B, ...PLANOS, ...AREAS];
