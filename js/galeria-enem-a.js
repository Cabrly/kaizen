/* Galeria: ENEM e vestibular, parte 1 (estratégia, redação, matemática e ciências da natureza). */

import { atividade, INEP_ENEM, INEP_PROVAS, khan, phet, plano, sessao, wiki } from "./galeria-ajudas.js";

const AREA = "ENEM e vestibular";

export default [

    plano("enem-comecar", "🎯", AREA, "Para todos", "Conheça a prova, monte seu cronograma e treine com questões reais.", "ENEM: por onde começar", "INEP", [
        sessao("Como o ENEM funciona", "Entender as provas, os dias de aplicação e pra que serve a nota.", [
            INEP_ENEM,
            wiki("Exame Nacional do Ensino Médio", "História, estrutura e uso da nota.", 20),
            atividade("Mapa da prova", "Escreva numa folha: os 2 dias de prova, as 4 áreas de conhecimento e a redação. Anote quais áreas você domina mais e quais menos.", 20)
        ], [
            ["Quais são as 4 áreas de conhecimento do ENEM?", "Linguagens, Códigos e suas Tecnologias; Matemática; Ciências da Natureza; e Ciências Humanas. Mais a redação."],
            ["O ENEM usa qual método de correção das questões objetivas?", "A Teoria de Resposta ao Item (TRI), que considera a coerência dos acertos, não só a quantidade."],
            ["Pra que serve a nota do ENEM?", "Entrada em universidades pelo SiSU, bolsas do ProUni, financiamento do Fies e alguns processos seletivos."]
        ]),
        sessao("SiSU, ProUni e Fies", "Saber como a nota vira vaga, bolsa ou financiamento.", [
            wiki("Sistema de Seleção Unificada", "Como funciona a seleção e a nota de corte.", 20),
            wiki("Programa Universidade para Todos", "Bolsas de estudo em faculdades particulares.", 15),
            atividade("Sua lista de cursos", "Liste 3 cursos que você considera e pesquise a nota de corte aproximada de cada um nos últimos anos. Isso vira sua meta de nota.", 25)
        ], [
            ["O que é o SiSU?", "O sistema do governo que seleciona, com base na nota do ENEM, candidatos a vagas em instituições públicas de ensino superior."],
            ["O que é o ProUni?", "Programa que dá bolsas integrais ou parciais em instituições privadas, com base na nota do ENEM e na renda."],
            ["O que é nota de corte?", "A menor nota que garantiu uma vaga num curso na seleção anterior. Serve de referência, não de garantia."]
        ]),
        sessao("Montando um cronograma que dá pra cumprir", "Dividir o tempo entre as áreas sem estudar tudo de uma vez.", [
            wiki("Repetição espaçada", "A base de um cronograma de revisão eficaz.", 20),
            atividade("Cronograma da semana", "Monte uma semana de estudo com blocos de 1 hora: 2 de Matemática, 1 de cada área, 1 de redação e 1 de resolução de prova. Marque uma folga e uma revisão no fim de semana.", 30)
        ], [
            ["Vale mais estudar muito num dia ou um pouco todo dia?", "Um pouco todo dia: o espaçamento fixa melhor o conteúdo na memória."],
            ["Quanto do cronograma deve ser resolução de questões?", "Uma parte grande. Treinar com provas anteriores mostra o estilo da prova e onde você erra."],
            ["Por que reservar uma revisão semanal?", "Revisar logo antes de esquecer faz o conteúdo durar muito mais."]
        ]),
        sessao("Resolvendo provas anteriores", "Treinar com a prova real e aprender com cada erro.", [
            INEP_PROVAS,
            atividade("Faça uma prova de área", "Pegue uma prova de qualquer área (de um ano passado), cronometre 2 horas e responda 45 questões. Depois corrija e anote, para cada erro, o motivo: não sabia, errei na leitura ou faltou tempo.", 120)
        ], [
            ["Por que treinar com provas antigas?", "Elas mostram o estilo de cobrança, os temas mais frequentes e o tempo real que você tem."],
            ["O que fazer com uma questão errada?", "Descobrir o motivo do erro (conteúdo, leitura ou tempo) e revisar aquele ponto, em vez de só ver o gabarito."],
            ["Responder na ordem da prova é obrigatório?", "Não. Muita gente começa pelas questões mais fáceis pra garantir pontos e voltar nas difíceis."]
        ]),
        sessao("Gestão de tempo e energia", "Chegar bem ao dia da prova: sono, alimentação e ritmo.", [
            wiki("Técnica pomodoro", "Foco em blocos curtos, com pausas.", 15),
            wiki("Estresse", "O que o estresse faz com o corpo e a atenção.", 20),
            atividade("Seu plano pro dia da prova", "Escreva o que vai fazer na véspera (dormir cedo, separar documento e caneta preta) e como vai dividir as 5h30 de prova: quantos minutos por bloco de questões.", 25)
        ], [
            ["Qual material é obrigatório levar no ENEM?", "Documento oficial com foto e caneta esferográfica de tinta preta, em tubo transparente."],
            ["Por que dormir bem na véspera importa?", "O sono consolida o que você estudou e melhora a atenção, que pesa muito numa prova longa."],
            ["O que fazer se travar numa questão?", "Marque, pule e volte depois. Gastar muito tempo numa só custa várias outras."]
        ])
    ]),

    plano("enem-redacao", "✍️", AREA, "Iniciante", "As 5 competências, a estrutura e a proposta de intervenção, na prática.", "Redação do ENEM", "INEP", [
        sessao("O que a redação do ENEM pede", "Entender o texto dissertativo-argumentativo e como a nota é composta.", [
            wiki("Dissertação", "O texto dissertativo e como se argumenta nele.", 20, "Dissertação (base do texto dissertativo-argumentativo)"),
            INEP_ENEM,
            atividade("Leia uma nota 1000", "Procure uma redação nota 1000 de um ano passado e marque com cores: tese, argumentos, repertório e proposta de intervenção.", 30)
        ], [
            ["Qual o tipo de texto cobrado na redação do ENEM?", "Dissertativo-argumentativo, em prosa, sobre um tema de ordem social, científica, cultural ou política."],
            ["Quantas competências avaliam a redação e quanto vale cada uma?", "Cinco competências, de 0 a 200 pontos cada, totalizando 1000."],
            ["O que zera a redação?", "Fuga total ao tema, texto que não seja dissertativo-argumentativo, cópia dos textos de apoio, desrespeito aos direitos humanos, parte desconectada ou em branco."]
        ]),
        sessao("Competência 1: norma culta", "Escrever sem desvios graves de gramática, ortografia e pontuação.", [
            wiki("Norma culta", "O que é a variedade padrão da língua.", 15),
            wiki("Concordância verbal", "Quando o verbo concorda com o sujeito.", 20),
            atividade("Caçador de erros", "Reescreva um parágrafo seu e confira: concordância, crase, vírgulas, acentos e repetições. Leia em voz alta pra achar o que soa errado.", 25)
        ], [
            ["O que a Competência 1 avalia?", "O domínio da modalidade escrita formal da língua portuguesa."],
            ["Por que ler o texto em voz alta ajuda a revisar?", "Porque você percebe problemas de pontuação, repetição e concordância que a leitura silenciosa deixa passar."],
            ["Gíria e marcas de oralidade cabem na redação?", "Não, a linguagem deve ser formal e impessoal."]
        ]),
        sessao("Repertório sociocultural", "Reunir citações, fatos e referências pra fundamentar a argumentação.", [
            wiki("Cultura", "Conhecimento cultural: a matéria-prima do repertório.", 15, "Cultura (a base do repertório)"),
            atividade("Banco de repertório", "Monte uma lista com 10 referências usáveis em vários temas: 3 filósofos ou sociólogos, 3 fatos históricos, 2 filmes ou livros e 2 dados (IBGE, ONU). Escreva pra cada uma, em uma frase, como ela serve num argumento.", 40)
        ], [
            ["O que é repertório sociocultural?", "Conhecimento de áreas como história, filosofia, literatura e ciência que você usa pra sustentar seus argumentos."],
            ["Um repertório precisa estar ligado ao argumento?", "Sim. Citar sem relacionar com o tema vale pouco: explique como ele comprova a ideia."],
            ["Pode inventar dado ou citação?", "Não. Informação falsa prejudica a argumentação e pode ser penalizada."]
        ]),
        sessao("Tese e desenvolvimento", "Defender um ponto de vista claro e organizar dois argumentos.", [
            wiki("Argumentação", "Como construir argumentos que convencem.", 20),
            atividade("Introdução em 5 linhas", "Escolha um tema social e escreva só a introdução: contextualização, apresentação do tema e a tese (seu ponto de vista), em até 5 linhas.", 30)
        ], [
            ["O que é a tese?", "A ideia central que o texto defende, em geral colocada na introdução."],
            ["Quantos parágrafos tem a estrutura mais usada?", "Quatro: introdução, dois de desenvolvimento e conclusão com a proposta de intervenção."],
            ["Como cada parágrafo de desenvolvimento deve começar?", "Com a ideia principal (tópico frasal), seguida de explicação, exemplo e repertório."]
        ]),
        sessao("Coesão: conectando as ideias", "Usar conectivos pra dar sequência lógica ao texto.", [
            wiki("Coesão textual", "Os mecanismos que ligam as partes do texto.", 20),
            atividade("Troque os conectivos", "Pegue um texto seu e marque os conectivos. Troque os repetidos por outros que expressem a mesma relação (adição, oposição, causa, conclusão). Evite começar todo parágrafo igual.", 25)
        ], [
            ["O que é coesão?", "A ligação entre palavras, frases e parágrafos, feita por conectivos, pronomes e repetições bem usadas."],
            ["Cite conectivos de oposição.", "Mas, porém, entretanto, contudo, todavia, no entanto."],
            ["Cite conectivos de conclusão.", "Portanto, logo, assim, dessa forma, por isso."]
        ]),
        sessao("Proposta de intervenção", "Escrever uma solução completa, com os 5 elementos.", [
            wiki("Direitos humanos", "A proposta de intervenção precisa respeitá-los.", 15),
            atividade("Proposta com 5 elementos", "Escreva uma proposta de intervenção pro tema de sua escolha com: agente (quem), ação (o quê), modo/meio (como), finalidade (pra quê) e detalhamento. Deve respeitar os direitos humanos.", 35)
        ], [
            ["Quais os 5 elementos da proposta de intervenção?", "Agente, ação, modo ou meio, finalidade e detalhamento."],
            ["Pode propor algo que fira os direitos humanos?", "Não. Isso zera a redação."],
            ["O que é o agente?", "Quem vai executar a ação: governo, escola, mídia, ONGs, família etc."]
        ]),
        sessao("Simulado: escreva e corrija", "Escrever uma redação completa no tempo da prova e se corrigir.", [
            INEP_PROVAS,
            atividade("Redação em 60 minutos", "Escolha um tema de um ano anterior, cronometre 60 minutos e escreva uma redação completa. Depois, corrija usando as 5 competências e dê uma nota a cada uma. Anote os 2 pontos fracos pra próxima.", 90)
        ], [
            ["Quanto tempo gastar escrevendo a redação no dia da prova?", "Cerca de 1h a 1h30, deixando tempo pra rascunho e revisão."],
            ["Por que corrigir o próprio texto?", "Pra enxergar padrões de erro e saber qual competência melhorar primeiro."],
            ["O rascunho vale nota?", "Não. Só o texto passado a limpo na folha oficial é corrigido."]
        ])
    ], { minutos: 75 }),

    plano("enem-matematica", "🧮", AREA, "Iniciante", "A base que mais cai: frações, proporção, porcentagem, juros e equações.", "Matemática básica para o ENEM", "Khan Academy", [
        sessao("Operações, frações e decimais", "Fazer contas com frações e números decimais com segurança.", [
            wiki("Fração", "Tipos de fração e operações.", 20),
            khan("Matemática (Khan Academy)", "math", "Exercícios guiados de aritmética a álgebra, com correção na hora.", 30),
            atividade("10 contas à mão", "Resolva 10 operações com frações e decimais sem calculadora (some, subtraia, multiplique e divida). Confira depois.", 25)
        ], [
            ["Como somar frações com denominadores diferentes?", "Tire o mínimo múltiplo comum dos denominadores e some os numeradores."],
            ["Como dividir uma fração por outra?", "Multiplique a primeira pelo inverso da segunda."],
            ["Como transformar uma fração em decimal?", "Divida o numerador pelo denominador."]
        ]),
        sessao("Razão, proporção e regra de três", "Resolver problemas de proporcionalidade, que aparecem em quase toda prova.", [
            wiki("Proporcionalidade", "Grandezas diretamente e inversamente proporcionais.", 20),
            wiki("Regra de três", "Regra de três simples e composta.", 15),
            atividade("5 problemas do dia a dia", "Invente e resolva 5 problemas: receita de bolo pra mais pessoas, velocidade e tempo, escala de um mapa, consumo de combustível e divisão de despesas.", 25)
        ], [
            ["Quando usar regra de três direta e quando inversa?", "Direta quando as grandezas crescem juntas; inversa quando uma cresce e a outra diminui."],
            ["O que é uma razão?", "A comparação entre duas grandezas por divisão (a/b)."],
            ["O que é escala num mapa?", "A razão entre a distância no mapa e a distância real."]
        ]),
        sessao("Porcentagem", "Calcular descontos, aumentos e variações percentuais.", [
            wiki("Porcentagem", "Cálculo de porcentagens e variações.", 20),
            atividade("Desconto e aumento", "Calcule: 15% de desconto sobre R$ 240; aumento de 8% sobre R$ 1.500; e o que acontece se um preço sobe 20% e depois cai 20% (volta ao mesmo valor?).", 25)
        ], [
            ["Como calcular 15% de um valor?", "Multiplique o valor por 0,15."],
            ["Um preço sobe 20% e depois cai 20%. Volta ao original?", "Não. Fica 4% menor (1,2 × 0,8 = 0,96)."],
            ["Como achar o fator de aumento de 8%?", "1,08."]
        ]),
        sessao("Juros simples e compostos", "Entender como o dinheiro cresce (ou a dívida cresce) com o tempo.", [
            wiki("Juro", "Juros simples e compostos.", 20),
            atividade("Dois investimentos", "Compare R$ 1.000 a 2% ao mês por 12 meses em juros simples e em juros compostos. Qual rende mais? Quanto a diferença cresceria em 36 meses?", 30)
        ], [
            ["Qual a fórmula de juros simples?", "J = C · i · t (capital × taxa × tempo)."],
            ["Qual a fórmula do montante em juros compostos?", "M = C · (1 + i)^t."],
            ["Por que o juro composto cresce mais rápido?", "Porque os juros de cada período entram na base de cálculo do seguinte (juros sobre juros)."]
        ]),
        sessao("Equações do 1º e do 2º grau", "Resolver equações e interpretar problemas que viram equação.", [
            wiki("Equação do segundo grau", "Fórmula de Bhaskara e discriminante.", 20),
            khan("Álgebra (Khan Academy)", "math/algebra", "Equações e inequações, com exercícios.", 30),
            atividade("Do enunciado à equação", "Resolva: 'O dobro de um número mais 7 é igual a 25' e 'um retângulo tem área 48 e um lado 2 maior que o outro'. Monte a equação antes de resolver.", 30)
        ], [
            ["Qual a fórmula de Bhaskara?", "x = (−b ± √Δ) / 2a, com Δ = b² − 4ac."],
            ["O que o discriminante Δ indica?", "Δ > 0: duas raízes reais; Δ = 0: uma raiz real; Δ < 0: nenhuma raiz real."],
            ["Qual o primeiro passo de um problema de equação?", "Definir a incógnita (o que é x) e traduzir o enunciado em uma igualdade."]
        ]),
        sessao("Unidades e conversões", "Converter medidas de comprimento, massa, volume e tempo.", [
            wiki("Sistema Internacional de Unidades", "As unidades-base e os prefixos (quilo, mili, etc.).", 20),
            atividade("Conversões rápidas", "Converta: 3,5 km em m; 450 g em kg; 2,5 L em mL; 90 minutos em horas; 72 km/h em m/s. Explique a regra do último.", 25)
        ], [
            ["Como converter km/h em m/s?", "Divida por 3,6."],
            ["Quantos mililitros tem 1 litro?", "1000 mL."],
            ["Quanto é 1 m³ em litros?", "1000 litros."]
        ])
    ]),

    plano("enem-funcoes-geometria", "📐", AREA, "Intermediário", "Funções, áreas, volumes e trigonometria, os assuntos de maior peso.", "Funções e geometria para o ENEM", "Khan Academy", [
        sessao("Função afim e leitura de gráficos", "Interpretar e montar funções de 1º grau.", [
            wiki("Função afim", "Coeficientes e gráfico da função de 1º grau.", 20),
            khan("Álgebra (Khan Academy)", "math/algebra", "Funções lineares e gráficos.", 30),
            atividade("Táxi e celular", "Monte a função do preço de uma corrida (bandeirada + valor por km) e de um plano de celular. Faça o gráfico de cada uma e descubra a partir de quantos km o plano B compensa.", 30)
        ], [
            ["Qual a forma da função afim?", "f(x) = ax + b, onde a é o coeficiente angular e b o coeficiente linear."],
            ["O que o coeficiente a diz sobre o gráfico?", "Se a > 0 a reta sobe; se a < 0 desce. Seu valor é a inclinação."],
            ["Onde o gráfico corta o eixo y?", "No ponto (0, b)."]
        ]),
        sessao("Função quadrática", "Entender a parábola, o vértice e problemas de máximo e mínimo.", [
            wiki("Função quadrática", "Parábola, raízes e vértice.", 20),
            atividade("O lançamento", "Uma bola é lançada e sua altura é h(t) = −5t² + 20t. Ache o instante de altura máxima, a altura máxima e quando ela volta ao chão.", 30)
        ], [
            ["Como achar o vértice de uma parábola?", "x_v = −b/2a e y_v = −Δ/4a."],
            ["Quando a parábola tem concavidade pra cima?", "Quando a > 0 (tem ponto de mínimo)."],
            ["O que as raízes representam no gráfico?", "Os pontos onde a parábola corta o eixo x."]
        ]),
        sessao("Exponencial e logaritmo", "Modelar crescimento e decaimento e usar logaritmos.", [
            wiki("Função exponencial", "Crescimento e decaimento exponencial.", 20),
            wiki("Logaritmo", "Definição e propriedades.", 20),
            atividade("Crescimento de uma população", "Uma população de 1000 bactérias dobra a cada hora. Escreva a função e calcule quantas haverá em 6 horas. Depois use logaritmo pra achar quando chegará a 100.000.", 30)
        ], [
            ["O que é um logaritmo?", "O expoente a que se eleva a base pra obter um número: log₂8 = 3, pois 2³ = 8."],
            ["Qual a propriedade do log de um produto?", "log(a·b) = log a + log b."],
            ["Qual a diferença entre crescimento linear e exponencial?", "No linear soma-se a mesma quantidade a cada período; no exponencial multiplica-se pelo mesmo fator."]
        ]),
        sessao("Áreas e perímetros", "Calcular áreas de figuras planas, incluindo as compostas.", [
            wiki("Área", "Fórmulas de área das figuras planas.", 20),
            atividade("O terreno", "Um terreno tem formato de trapézio com bases de 20 m e 12 m e altura de 8 m. Calcule a área, o custo de cercar (preço por metro) e quantos pisos de 0,5 m² cobririam.", 30)
        ], [
            ["Qual a área do círculo?", "A = π · r²."],
            ["Qual a área do trapézio?", "A = (B + b) · h / 2."],
            ["Como calcular a área de uma figura composta?", "Divida em figuras simples, calcule cada área e some (ou subtraia)."]
        ]),
        sessao("Volumes e sólidos geométricos", "Calcular volumes de prismas, cilindros, pirâmides e esferas.", [
            wiki("Volume", "Volume dos principais sólidos.", 20),
            atividade("A caixa d'água", "Uma caixa cilíndrica tem 1,2 m de diâmetro e 1 m de altura. Calcule o volume em litros e quanto tempo leva pra encher com uma torneira de 20 L/min.", 30)
        ], [
            ["Qual o volume do cilindro?", "V = π · r² · h."],
            ["Qual o volume do prisma?", "Área da base × altura."],
            ["Quanto tem 1 m³ em litros?", "1000 litros."]
        ]),
        sessao("Teorema de Pitágoras e trigonometria", "Resolver triângulos retângulos com seno, cosseno e tangente.", [
            wiki("Teorema de Pitágoras", "A relação entre os lados do triângulo retângulo.", 15),
            wiki("Trigonometria", "Seno, cosseno e tangente.", 20),
            atividade("Altura sem medir", "Um prédio projeta sombra de 30 m quando o sol faz 60° com o chão. Use a tangente pra achar a altura. Depois ache a diagonal de uma tela de 16 cm por 9 cm.", 30)
        ], [
            ["Qual o enunciado do teorema de Pitágoras?", "Num triângulo retângulo, a² = b² + c² (hipotenusa ao quadrado é a soma dos quadrados dos catetos)."],
            ["O que é o seno de um ângulo agudo?", "A razão entre o cateto oposto e a hipotenusa."],
            ["Quanto vale a tangente de 45°?", "1."]
        ]),
        sessao("Análise combinatória e probabilidade", "Contar possibilidades e calcular chances.", [
            wiki("Análise combinatória", "Princípio fundamental da contagem, permutações e combinações.", 20),
            wiki("Probabilidade", "Cálculo de chances de eventos.", 20),
            atividade("Senhas e sorteios", "Quantas senhas de 4 dígitos existem? Quantas comissões de 3 pessoas saem de 10? Qual a chance de sortear duas bolas vermelhas de uma urna com 5 vermelhas e 3 azuis, sem reposição?", 35)
        ], [
            ["Qual a diferença entre permutação e combinação?", "Na permutação a ordem importa; na combinação não."],
            ["Quanto é 5! (cinco fatorial)?", "120."],
            ["Como calcular a probabilidade de eventos independentes seguidos?", "Multiplicando as probabilidades de cada um."]
        ])
    ]),

    plano("enem-fisica", "⚡", AREA, "Iniciante", "Movimento, forças, energia, calor, ondas e eletricidade, com simulações.", "Física para o ENEM", "PhET", [
        sessao("Cinemática: movimento uniforme e variado", "Resolver problemas de velocidade, aceleração e gráficos.", [
            wiki("Cinemática", "Posição, velocidade e aceleração.", 20),
            phet("Simulação: O Homem em Movimento", "simulations/moving-man", "Veja como posição, velocidade e aceleração se relacionam, mexendo no boneco.", 20),
            atividade("Viagem de carro", "Um carro percorre 150 km em 2 h e depois 90 km em 1 h. Calcule a velocidade média total. Depois calcule quanto tempo um carro de 0 a 20 m/s em aceleração de 4 m/s² leva.", 30)
        ], [
            ["Qual a fórmula da velocidade média?", "v = Δs / Δt (deslocamento dividido pelo tempo)."],
            ["O que é aceleração?", "A variação da velocidade por unidade de tempo (m/s²)."],
            ["O que a inclinação de um gráfico posição × tempo representa?", "A velocidade."]
        ]),
        sessao("Leis de Newton", "Aplicar as três leis a situações do dia a dia.", [
            wiki("Leis de Newton", "Inércia, F = m·a e ação e reação.", 20),
            phet("Simulação: Forças e Movimento", "simulations/forces-and-motion-basics", "Empurre objetos e veja o efeito de força, massa e atrito.", 20),
            atividade("Elevador", "Uma pessoa de 60 kg está num elevador que sobe com aceleração de 2 m/s². Calcule a força que o piso faz sobre ela (use g = 10 m/s²). E se descer com a mesma aceleração?", 30)
        ], [
            ["O que diz a 1ª lei de Newton?", "Um corpo mantém o repouso ou o movimento retilíneo uniforme se a força resultante for nula (inércia)."],
            ["Qual a fórmula da 2ª lei?", "F = m · a."],
            ["O que diz a 3ª lei?", "A toda ação corresponde uma reação de mesma intensidade e sentido oposto, em corpos diferentes."]
        ]),
        sessao("Trabalho, energia e potência", "Entender a conservação de energia e calcular potência.", [
            wiki("Conservação de energia", "A energia se transforma, não se perde.", 20),
            phet("Simulação: Energia no Parque de Skate", "simulations/energy-skate-park-basics", "Acompanhe energia cinética e potencial de um skatista.", 20),
            atividade("Queda livre", "Uma pedra de 2 kg cai de 20 m. Calcule a energia potencial no alto, a velocidade ao chegar no chão (sem atrito) e a potência de um motor que a sobe em 10 s.", 30)
        ], [
            ["Qual a fórmula da energia cinética?", "Ec = m · v² / 2."],
            ["Qual a fórmula da energia potencial gravitacional?", "Ep = m · g · h."],
            ["O que é potência?", "A energia transformada por unidade de tempo (watt = joule por segundo)."]
        ]),
        sessao("Termologia: calor e temperatura", "Diferenciar calor de temperatura e calcular trocas de calor.", [
            wiki("Calor", "Calor, temperatura e formas de propagação.", 20),
            phet("Simulação: Formas de Energia e Mudanças", "simulations/energy-forms-and-changes", "Aqueça objetos e veja a energia térmica se transferir.", 20),
            atividade("Café morno", "Calcule o calor necessário pra aquecer 200 g de água de 20 °C a 80 °C (c = 1 cal/g°C). Explique as 3 formas de propagação do calor numa panela no fogão.", 30)
        ], [
            ["Qual a diferença entre calor e temperatura?", "Temperatura mede o grau de agitação das partículas; calor é a energia térmica em trânsito entre corpos de temperaturas diferentes."],
            ["Quais as 3 formas de propagação do calor?", "Condução, convecção e irradiação."],
            ["Qual a fórmula do calor sensível?", "Q = m · c · ΔT."]
        ]),
        sessao("Ondas, som e luz", "Compreender frequência, comprimento de onda, reflexão e refração.", [
            wiki("Onda", "Tipos de onda e suas grandezas.", 20),
            phet("Simulação: Ondas em Corda", "simulations/wave-on-a-string", "Veja frequência, amplitude e velocidade de uma onda.", 20),
            atividade("A conta da onda", "Uma onda de frequência 5 Hz tem comprimento de 2 m. Qual a velocidade? Explique por que o som não se propaga no vácuo mas a luz sim.", 30)
        ], [
            ["Qual a equação fundamental da onda?", "v = λ · f (velocidade = comprimento de onda × frequência)."],
            ["O som é onda mecânica ou eletromagnética?", "Mecânica: precisa de um meio material."],
            ["O que é refração?", "A mudança de direção e velocidade da onda ao passar de um meio pra outro."]
        ]),
        sessao("Eletricidade: corrente, tensão e resistência", "Aplicar a lei de Ohm e entender circuitos simples.", [
            wiki("Lei de Ohm", "A relação entre tensão, corrente e resistência.", 20),
            phet("Simulação: Kit de Construção de Circuitos", "simulations/circuit-construction-kit-dc", "Monte circuitos com pilhas, lâmpadas e resistores.", 25),
            atividade("A conta de luz", "Um chuveiro de 5500 W é usado 30 minutos por dia durante 30 dias. Calcule o consumo em kWh e o custo se o kWh custa R$ 0,90.", 30)
        ], [
            ["Qual a lei de Ohm?", "U = R · i (tensão = resistência × corrente)."],
            ["Como calcular a energia elétrica consumida?", "E = P · t (potência em kW × tempo em horas = kWh)."],
            ["Em que difere um circuito em série de um em paralelo?", "Em série a corrente é a mesma e a tensão se divide; em paralelo a tensão é a mesma e a corrente se divide."]
        ])
    ]),

    plano("enem-quimica", "🧪", AREA, "Iniciante", "Átomo, tabela periódica, ligações, reações, soluções e química orgânica.", "Química para o ENEM", "Khan Academy", [
        sessao("Matéria, átomo e modelos atômicos", "Entender a estrutura do átomo e sua evolução histórica.", [
            wiki("Modelo atômico", "De Dalton a Bohr, o que cada modelo explicou.", 20),
            khan("Química (Khan Academy)", "science/chemistry", "Estrutura do átomo, com vídeos e exercícios.", 30),
            atividade("Linha do tempo", "Desenhe a linha do tempo dos modelos (Dalton, Thomson, Rutherford, Bohr) com uma frase e um desenho do que cada um propôs.", 25)
        ], [
            ["O que o experimento de Rutherford mostrou?", "Que o átomo tem um núcleo pequeno, denso e positivo, com muito espaço vazio ao redor."],
            ["Como se calcula o número de nêutrons?", "Massa (A) menos número atômico (Z)."],
            ["O que são isótopos?", "Átomos do mesmo elemento (mesmo Z) com número de massa diferente."]
        ]),
        sessao("Tabela periódica e propriedades", "Usar a posição na tabela pra prever o comportamento dos elementos.", [
            wiki("Tabela periódica", "Grupos, períodos e propriedades periódicas.", 20),
            atividade("Prevendo pela posição", "Sem consultar, diga pra cada elemento (Na, Cl, Ne, Fe, O) o grupo, se é metal, ametal ou gás nobre e se tende a ganhar ou perder elétrons. Depois confira.", 25)
        ], [
            ["Como a tabela periódica é organizada?", "Em ordem crescente de número atômico, com períodos (linhas) e grupos (colunas)."],
            ["O que os elementos de um mesmo grupo têm em comum?", "O mesmo número de elétrons na camada de valência, logo propriedades químicas parecidas."],
            ["Quais são os gases nobres?", "Elementos do grupo 18 (He, Ne, Ar, Kr, Xe, Rn), muito estáveis."]
        ]),
        sessao("Ligações químicas", "Diferenciar ligações iônica, covalente e metálica.", [
            wiki("Ligação química", "Os tipos de ligação e como se formam.", 20),
            atividade("Que ligação é essa?", "Classifique a ligação em NaCl, H₂O, O₂, Fe e CO₂, e explique pra cada uma como os elétrons se comportam e uma propriedade que isso explica (por exemplo, condutividade).", 30)
        ], [
            ["Como se forma uma ligação iônica?", "Por transferência de elétrons, de um metal para um ametal."],
            ["E uma ligação covalente?", "Por compartilhamento de pares de elétrons entre ametais."],
            ["Por que metais conduzem eletricidade?", "Por causa dos elétrons livres da ligação metálica."]
        ]),
        sessao("Funções inorgânicas e reações", "Reconhecer ácidos, bases, sais e óxidos e equilibrar reações.", [
            wiki("Reação química", "Tipos de reação e balanceamento.", 20),
            wiki("Ácido", "Definição e exemplos.", 15),
            atividade("Balanceie", "Balanceie: H₂ + O₂ → H₂O; Fe + O₂ → Fe₂O₃; CH₄ + O₂ → CO₂ + H₂O. Depois diga o que cada uma representa no dia a dia.", 30)
        ], [
            ["O que é balancear uma equação química?", "Ajustar os coeficientes pra que haja o mesmo número de átomos de cada elemento dos dois lados."],
            ["Qual a escala que mede acidez?", "A escala de pH, de 0 a 14 (7 é neutro)."],
            ["O que se forma na reação de um ácido com uma base?", "Um sal e água (neutralização)."]
        ]),
        sessao("Estequiometria e soluções", "Calcular quantidades de reagentes e concentrações.", [
            wiki("Estequiometria", "Cálculo das proporções numa reação.", 20),
            wiki("Mol", "A unidade de quantidade de matéria.", 15),
            atividade("Quantos gramas?", "Quantos gramas de água se formam a partir de 4 g de H₂? (H = 1; O = 16). Depois prepare mentalmente: quanto sal (em g) há em 500 mL de solução a 20 g/L?", 35)
        ], [
            ["Quantas partículas tem 1 mol?", "6,02 × 10²³ (número de Avogadro)."],
            ["O que é concentração comum?", "Massa de soluto por volume de solução (g/L)."],
            ["O que o coeficiente numa equação balanceada representa?", "A proporção em mols entre as substâncias."]
        ]),
        sessao("Química orgânica: o essencial", "Reconhecer hidrocarbonetos e funções orgânicas.", [
            wiki("Química orgânica", "O carbono e suas cadeias.", 20),
            wiki("Função orgânica", "Álcool, aldeído, cetona, ácido carboxílico, éster, amina.", 25),
            atividade("Nomes e funções", "Dê o nome e a função de: CH₃CH₂OH, CH₃COOH e CH₃CHO. Liste onde você encontra cada um no dia a dia.", 25)
        ], [
            ["Por que o carbono forma tantos compostos?", "Faz 4 ligações e se liga a outros carbonos em cadeias longas."],
            ["O que é um hidrocarboneto?", "Composto formado só por carbono e hidrogênio, como o metano e o butano."],
            ["Qual o grupo funcional dos álcoois?", "A hidroxila (–OH) ligada a carbono saturado."]
        ])
    ]),

    plano("enem-biologia", "🧬", AREA, "Iniciante", "Célula, genética, evolução, ecologia, corpo humano e saúde.", "Biologia para o ENEM", "Khan Academy", [
        sessao("Citologia: a célula", "Conhecer organelas, membrana e diferenças entre os tipos de célula.", [
            wiki("Célula", "Estrutura e funções das células.", 20),
            khan("Biologia (Khan Academy)", "science/biology", "Estrutura celular, com vídeos.", 30),
            atividade("Cidade-célula", "Compare a célula a uma cidade: que organela é a usina de energia, a fábrica de proteínas, o correio, a prefeitura? Faça o desenho.", 25)
        ], [
            ["Qual a organela que produz energia (ATP)?", "A mitocôndria."],
            ["Qual a diferença entre célula procariótica e eucariótica?", "A procariótica não tem núcleo delimitado por membrana; a eucariótica tem."],
            ["O que é difusão e osmose?", "Difusão é o movimento de moléculas de onde há mais pra onde há menos; osmose é a difusão da água através de uma membrana."]
        ]),
        sessao("Metabolismo: fotossíntese e respiração", "Entender como seres vivos obtêm e usam energia.", [
            wiki("Fotossíntese", "Como as plantas produzem glicose.", 20),
            wiki("Respiração celular", "Como a célula extrai energia da glicose.", 20),
            atividade("Equações lado a lado", "Escreva as equações da fotossíntese e da respiração celular e mostre como uma é quase o inverso da outra. Em que organelas ocorrem?", 25)
        ], [
            ["Qual a equação resumida da fotossíntese?", "6 CO₂ + 6 H₂O + luz → C₆H₁₂O₆ + 6 O₂."],
            ["Onde ocorre a fotossíntese na célula?", "Nos cloroplastos."],
            ["Qual a vantagem da respiração aeróbica?", "Rende muito mais ATP do que a fermentação."]
        ]),
        sessao("Genética: Mendel e hereditariedade", "Resolver cruzamentos e entender dominância.", [
            wiki("Leis de Mendel", "Segregação dos fatores e como resolver cruzamentos.", 20),
            atividade("Quadro de Punnett", "Cruze duas plantas heterozigotas (Aa × Aa). Monte o quadro e diga as proporções genotípicas e fenotípicas. Depois resolva o cruzamento Aa × aa.", 30)
        ], [
            ["Qual a proporção fenotípica de Aa × Aa (dominância completa)?", "3 dominantes para 1 recessivo."],
            ["O que é um genótipo e o que é um fenótipo?", "Genótipo é a constituição genética; fenótipo é a característica observada."],
            ["O que é um alelo?", "Cada uma das formas alternativas de um gene."]
        ]),
        sessao("DNA, síntese de proteínas e biotecnologia", "Entender o caminho do gene à proteína e as aplicações.", [
            wiki("DNA", "Estrutura e função do material genético.", 20),
            wiki("Biotecnologia", "Transgênicos, clonagem e terapia gênica.", 20),
            atividade("Transcreva e traduza", "A partir da fita de DNA TAC GGA CTT, escreva o RNAm e consulte uma tabela de códons pra descobrir os aminoácidos. Explique o que seria uma mutação nessa sequência.", 30)
        ], [
            ["Qual o fluxo da informação genética?", "DNA → RNA (transcrição) → proteína (tradução)."],
            ["Quais as bases nitrogenadas do DNA?", "Adenina, timina, citosina e guanina."],
            ["O que é um organismo transgênico?", "Um organismo que recebeu um gene de outra espécie."]
        ]),
        sessao("Evolução e seleção natural", "Compreender como as espécies mudam ao longo do tempo.", [
            wiki("Seleção natural", "O mecanismo de Darwin.", 20),
            wiki("Evolução", "Evidências e processos evolutivos.", 20),
            atividade("Explique a girafa", "Explique o pescoço da girafa pela visão de Lamarck e pela de Darwin, e diga qual explicação a ciência aceita e por quê.", 25)
        ], [
            ["O que diz a seleção natural?", "Indivíduos mais adaptados ao ambiente tendem a sobreviver e se reproduzir mais, passando suas características adiante."],
            ["Qual a diferença entre Lamarck e Darwin?", "Lamarck propunha herança de características adquiridas; Darwin, seleção natural sobre variação já existente."],
            ["O que são órgãos homólogos?", "Órgãos com a mesma origem evolutiva, mesmo que tenham funções diferentes."]
        ]),
        sessao("Ecologia e meio ambiente", "Entender cadeias alimentares, ciclos e impactos humanos.", [
            wiki("Ecologia", "Níveis de organização e relações entre seres vivos.", 20),
            wiki("Cadeia alimentar", "Produtores, consumidores e decompositores.", 15),
            atividade("Teia alimentar", "Desenhe uma teia alimentar de um ecossistema brasileiro (cerrado, mata atlântica ou caatinga) com pelo menos 8 seres. O que acontece se um predador de topo desaparece?", 30)
        ], [
            ["O que é um produtor?", "Organismo que faz o próprio alimento, geralmente por fotossíntese."],
            ["O que é bioacumulação?", "O acúmulo de substâncias tóxicas ao longo da cadeia alimentar, que aumenta nos níveis mais altos."],
            ["O que são decompositores?", "Fungos e bactérias que degradam matéria orgânica e devolvem nutrientes ao ambiente."]
        ]),
        sessao("Saúde humana: vírus, bactérias e imunidade", "Diferenciar agentes de doenças e entender vacinas.", [
            wiki("Sistema imunitário", "Defesas do corpo.", 20),
            wiki("Vacina", "Como as vacinas funcionam.", 15),
            atividade("Doença por doença", "Monte uma tabela com 6 doenças (gripe, dengue, tuberculose, malária, sarampo, cólera): agente (vírus, bactéria, protozoário), forma de transmissão e prevenção.", 30)
        ], [
            ["Como a vacina protege?", "Apresenta ao corpo o agente (ou parte dele) inativo, estimulando a produção de anticorpos e células de memória."],
            ["Antibiótico funciona contra vírus?", "Não, só contra bactérias."],
            ["Qual a diferença entre epidemia e pandemia?", "Epidemia é um surto numa região; pandemia, uma epidemia que se espalha por vários continentes."]
        ])
    ])

];
