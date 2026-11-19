/* Galeria: outras áreas (concursos, direito, finanças, idiomas, saúde, negócios, artes e humanas). */

import { atividade, khan, plano, sessao, wiki } from "./galeria-ajudas.js";

export default [

    plano("concursos-logica", "🧩", "Concursos e direito", "Iniciante", "Proposições, conjuntos e contagem: o raciocínio lógico que cai em concursos.", "Raciocínio lógico para concursos", "Wikipédia", [
        sessao("Proposições e conectivos", "Reconhecer proposições e os conectivos e, ou, se...então.", [
            wiki("Lógica proposicional", "Proposições, conectivos e valores lógicos.", 25),
            atividade("Verdadeiro ou falso?", "Classifique 10 frases como proposição ou não (ex.: 'Que horas são?' não é). Depois escreva 3 proposições compostas e diga o valor de cada, conhecendo o valor das simples.", 30)
        ], [
            ["O que é uma proposição?", "Uma sentença declarativa que pode ser classificada como verdadeira ou falsa."],
            ["Quando 'p e q' é verdadeira?", "Somente quando as duas são verdadeiras."],
            ["Quando 'p ou q' é falsa?", "Somente quando as duas são falsas."]
        ]),
        sessao("Tabelas-verdade e condicional", "Montar tabelas e entender o 'se...então'.", [
            wiki("Tabela-verdade", "Como montar e ler a tabela de proposições compostas.", 25),
            atividade("Monte 3 tabelas", "Faça a tabela-verdade de 'p e q', 'p ou q' e 'se p então q'. Em quais linhas o condicional é falso? Por que só em uma?", 35)
        ], [
            ["Quando 'se p então q' é falso?", "Só quando p é verdadeira e q é falsa."],
            ["Quantas linhas tem a tabela de 3 proposições simples?", "8 (2³)."],
            ["O que é uma tautologia?", "Proposição composta sempre verdadeira, qualquer que seja o valor das simples."]
        ]),
        sessao("Negação e equivalências", "Negar proposições corretamente e achar equivalentes.", [
            wiki("Leis de De Morgan", "Como negar 'e' e 'ou'.", 20),
            atividade("Negue direito", "Negue: 'Estudo e trabalho', 'Se chove, então fico em casa', 'Todo aluno passou'. Confira com tabela-verdade ou exemplo.", 35)
        ], [
            ["Qual a negação de 'p e q'?", "'não p ou não q' (De Morgan)."],
            ["Qual a negação de 'se p então q'?", "'p e não q'."],
            ["Qual a negação de 'todo A é B'?", "'Algum A não é B'."]
        ]),
        sessao("Conjuntos e diagramas", "Resolver problemas com diagramas de Venn.", [
            wiki("Teoria dos conjuntos", "União, interseção e diferença.", 25),
            atividade("Pesquisa de turma", "Numa turma de 40: 25 gostam de futebol, 18 de vôlei e 5 de nenhum. Quantos gostam dos dois? Monte o diagrama de Venn e resolva.", 35)
        ], [
            ["Como achar o total de A união B?", "n(A ∪ B) = n(A) + n(B) − n(A ∩ B)."],
            ["O que é a interseção?", "Os elementos que pertencem aos dois conjuntos."],
            ["O que é o conjunto vazio?", "O conjunto sem elementos, representado por ∅."]
        ]),
        sessao("Princípio da contagem e arranjos", "Contar possibilidades sem listar todas.", [
            wiki("Análise combinatória", "Princípio multiplicativo, arranjos e combinações.", 25),
            atividade("Placas e senhas", "Quantas placas de carro (3 letras e 4 números) existem? Quantas senhas de 6 dígitos sem repetir? Quantas comissões de 4 pessoas saem de 12?", 35)
        ], [
            ["Qual o princípio multiplicativo?", "Se uma etapa tem m possibilidades e a seguinte n, o total é m × n."],
            ["Qual a diferença entre arranjo e combinação?", "No arranjo a ordem importa; na combinação não."],
            ["Quanto é 4! ?", "24."]
        ]),
        sessao("Probabilidade e porcentagem", "Calcular chances e variações percentuais em problemas de prova.", [
            wiki("Probabilidade", "Eventos, espaço amostral e regras.", 25),
            atividade("Simulado rápido", "Resolva 5 questões de concurso (qualquer banca) de lógica e probabilidade em 40 minutos. Anote em quais você errou e por quê.", 45)
        ], [
            ["Como calcular a probabilidade de um evento?", "Casos favoráveis dividido pelos casos possíveis."],
            ["Quanto vale a soma das probabilidades de um evento e do seu complementar?", "1."],
            ["O que é um espaço amostral?", "O conjunto de todos os resultados possíveis de um experimento."]
        ])
    ]),

    plano("direito-constitucional", "⚖️", "Concursos e direito", "Iniciante", "Os princípios e direitos da Constituição, em linguagem direta.", "Direito constitucional básico", "Wikipédia", [
        sessao("O que é uma Constituição", "Entender o papel da Constituição e a hierarquia das normas.", [
            wiki("Constituição", "Conceito e funções.", 20),
            wiki("Constituição brasileira de 1988", "Contexto, estrutura e princípios.", 25),
            atividade("A pirâmide das normas", "Desenhe a hierarquia: Constituição, leis, decretos, portarias. Por que uma lei não pode contrariar a Constituição?", 25)
        ], [
            ["O que é a Constituição?", "A lei maior de um país, que organiza o Estado e garante direitos."],
            ["Como é chamada a Constituição de 1988?", "Constituição Cidadã, pela ampla garantia de direitos."],
            ["O que é inconstitucionalidade?", "Quando uma lei ou ato contraria a Constituição e pode ser anulado."]
        ]),
        sessao("Princípios fundamentais", "Conhecer os fundamentos e objetivos da República.", [
            wiki("Princípios Fundamentais na Constituição do Brasil", "Soberania, cidadania, dignidade, valores do trabalho e pluralismo.", 20, "Princípios fundamentais"),
            atividade("Cinco fundamentos", "Liste os fundamentos do art. 1º (soberania, cidadania, dignidade da pessoa humana, valores sociais do trabalho e da livre iniciativa, pluralismo político) e dê um exemplo de cada.", 30)
        ], [
            ["Qual a forma de governo e de Estado do Brasil?", "República (governo) e Federação (Estado)."],
            ["O que é dignidade da pessoa humana?", "O valor central que protege a pessoa de tratamento degradante e garante condições mínimas de vida."],
            ["Quantos poderes a Constituição prevê?", "Três: Legislativo, Executivo e Judiciário, independentes e harmônicos."]
        ]),
        sessao("Direitos e garantias fundamentais", "Reconhecer direitos individuais e os remédios constitucionais.", [
            wiki("Direitos fundamentais", "Direitos individuais, coletivos e sociais.", 25),
            wiki("Habeas corpus", "A garantia da liberdade de locomoção.", 15),
            atividade("Qual remédio é esse?", "Diga qual instrumento usar: habeas corpus, habeas data, mandado de segurança ou ação popular, em 4 situações do dia a dia.", 30)
        ], [
            ["Pra que serve o habeas corpus?", "Proteger a liberdade de ir e vir contra prisão ou ameaça ilegal."],
            ["O que é o habeas data?", "Garante conhecer e corrigir informações a seu respeito em bancos de dados públicos."],
            ["O que a Constituição diz sobre a igualdade?", "Que todos são iguais perante a lei, sem distinção de qualquer natureza."]
        ]),
        sessao("Direitos sociais e nacionalidade", "Entender educação, saúde, trabalho e quem é brasileiro.", [
            wiki("Direitos sociais", "Educação, saúde, trabalho, moradia, entre outros.", 20),
            wiki("Nacionalidade", "Brasileiros natos e naturalizados.", 15),
            atividade("Direitos no dia a dia", "Liste 6 direitos sociais do art. 6º e diga como cada um aparece na sua vida (escola, SUS, ônibus, aposentadoria).", 30)
        ], [
            ["Quais direitos sociais a Constituição lista no art. 6º?", "Educação, saúde, alimentação, trabalho, moradia, transporte, lazer, segurança, previdência social, proteção à maternidade e à infância e assistência aos desamparados."],
            ["Quem é brasileiro nato?", "Quem nasce no Brasil (mesmo de pais estrangeiros, em regra) ou é filho de brasileiros nas condições da lei."],
            ["Quais são os direitos políticos?", "Votar, ser votado e participar do governo, por exemplo por plebiscito e iniciativa popular."]
        ]),
        sessao("Organização do Estado e dos poderes", "Entender federação e as funções de cada poder.", [
            wiki("Federalismo", "União, estados, municípios e Distrito Federal.", 20),
            wiki("Separação de poderes", "Freios e contrapesos.", 20),
            atividade("Quem decide?", "Diga que ente (União, estado ou município) cuida de: escola infantil, rodovia federal, trânsito urbano, política monetária. Explique o critério.", 30)
        ], [
            ["O que é federação?", "Forma de Estado em que entes autônomos (União, estados, municípios, DF) dividem o poder dentro de um só país."],
            ["O que são freios e contrapesos?", "Mecanismos pelos quais um poder controla o outro, evitando abuso."],
            ["Quem faz as leis federais?", "O Congresso Nacional, composto pela Câmara dos Deputados e pelo Senado."]
        ]),
        sessao("Controle de constitucionalidade e STF", "Saber como uma lei é contestada e o papel do Supremo.", [
            wiki("Supremo Tribunal Federal", "Composição e competências.", 20),
            wiki("Controle de constitucionalidade", "Como se verifica se uma lei respeita a Constituição.", 20),
            atividade("Caso real", "Pesquise uma decisão recente do STF e explique em 5 linhas: qual lei foi contestada, o argumento de cada lado e o resultado.", 35)
        ], [
            ["Qual o papel do STF?", "Ser o guardião da Constituição, julgando, por exemplo, a constitucionalidade de leis."],
            ["O que é uma ADI?", "Ação Direta de Inconstitucionalidade, usada pra questionar uma lei federal ou estadual diretamente no STF."],
            ["Quantos ministros tem o STF?", "Onze."]
        ])
    ]),

    plano("financas-pessoais", "💰", "Finanças e negócios", "Para todos", "Orçamento, dívidas, reserva e investimentos, sem enrolação.", "Educação financeira", "Wikipédia", [
        sessao("Pra onde vai o seu dinheiro", "Fazer um orçamento real, com receitas e gastos.", [
            wiki("Orçamento doméstico", "Receitas, despesas fixas e variáveis.", 15, "Orçamento"),
            atividade("Seu orçamento do mês", "Liste tudo o que entra e sai em um mês: gastos fixos (aluguel, internet), variáveis (mercado, lazer) e pequenos (café, apps). Veja quanto sobra ou falta.", 40)
        ], [
            ["Qual a diferença entre gasto fixo e variável?", "Fixo é igual todo mês (aluguel); variável muda (lazer, mercado)."],
            ["Qual regra simples divide o orçamento?", "50/30/20: 50% necessidades, 30% desejos e 20% poupança e dívidas."],
            ["Por que anotar os gastos?", "Porque pequenas despesas invisíveis somam muito, e só vendo você escolhe o que cortar."]
        ]),
        sessao("Reserva de emergência", "Entender quanto guardar e onde deixar.", [
            wiki("Finanças pessoais", "Orçamento, reserva e planejamento do dinheiro.", 20),
            atividade("Calcule sua reserva", "Some seus gastos essenciais mensais e multiplique por 6. Esse é o alvo da sua reserva. Defina quanto poupar por mês e em quanto tempo chega lá.", 30)
        ], [
            ["Quanto deve ter a reserva de emergência?", "De 3 a 12 meses de gastos essenciais, conforme a estabilidade da renda."],
            ["Onde manter a reserva?", "Em algo seguro e com liquidez diária, como Tesouro Selic ou CDB de liquidez diária."],
            ["Pra que usar a reserva?", "Só pra imprevistos reais (saúde, perda de renda), não pra gastos planejados."]
        ]),
        sessao("Juros, dívidas e cartão de crédito", "Saber por que dívidas crescem e como sair delas.", [
            wiki("Juro", "Juros simples e compostos.", 20),
            wiki("Cartão de crédito", "Como funciona e o custo do rotativo.", 15),
            atividade("Quanto custa deixar pra depois", "Uma fatura de R$ 1.000 no rotativo com juros de 14% ao mês: quanto vira em 6 meses sem pagar? Compare com pagar à vista.", 30)
        ], [
            ["O que é o rotativo do cartão?", "O crédito automático quando você paga menos que o valor total da fatura, com juros muito altos."],
            ["Qual a melhor ordem pra quitar dívidas?", "Primeiro as de juros mais altos (cartão e cheque especial)."],
            ["Parcelar sem juros sai de graça?", "Nem sempre: o desconto à vista costuma compensar o parcelamento."]
        ]),
        sessao("Inflação e poder de compra", "Entender por que o dinheiro parado perde valor.", [
            wiki("Inflação", "Causas e como é medida.", 20),
            atividade("Dinheiro que encolhe", "Se a inflação é de 5% ao ano, quanto compra em 10 anos o que hoje custa R$ 100? Compare com um investimento que rende 10% ao ano.", 30)
        ], [
            ["O que é inflação?", "O aumento generalizado e contínuo dos preços."],
            ["Qual índice mede a inflação oficial no Brasil?", "O IPCA, calculado pelo IBGE."],
            ["O que é rendimento real?", "O rendimento descontando a inflação."]
        ]),
        sessao("Investimentos: renda fixa", "Conhecer Tesouro Direto, CDB e poupança.", [
            wiki("Renda fixa", "Títulos públicos e privados de rendimento previsível.", 20),
            wiki("Tesouro Direto", "Como investir em títulos do governo.", 15),
            atividade("Compare três opções", "Compare poupança, CDB e Tesouro Selic quanto a risco, liquidez, imposto e rendimento. Monte uma tabela e diga qual serve pra reserva.", 30)
        ], [
            ["O que é o Tesouro Selic?", "Título público pós-fixado que acompanha a taxa Selic, de baixo risco e liquidez diária."],
            ["O que é o FGC?", "O Fundo Garantidor de Créditos, que protege até R$ 250 mil por CPF e instituição em CDBs, poupança e outros."],
            ["O que significa liquidez?", "A facilidade de transformar o investimento em dinheiro sem perder valor."]
        ]),
        sessao("Renda variável e diversificação", "Entender risco, ações e a regra de não pôr tudo num lugar só.", [
            wiki("Ação (finanças)", "O que é ser sócio de uma empresa.", 20, "Ação"),
            wiki("Diversificação de investimentos", "Reduzir o risco espalhando o investimento.", 15),
            atividade("Perfil de investidor", "Responda: por quanto tempo posso deixar o dinheiro parado? Aguento ver o valor cair 20%? Defina seu perfil (conservador, moderado ou arrojado) e uma divisão entre renda fixa e variável.", 35)
        ], [
            ["O que é uma ação?", "Uma fração do capital de uma empresa."],
            ["Por que diversificar?", "Pra que a perda de um investimento seja compensada por outros."],
            ["Quanto maior o retorno esperado, maior costuma ser...", "O risco."]
        ])
    ]),

    plano("ingles-do-zero", "🗣️", "Idiomas", "Iniciante", "Do verbo to be ao passado e ao futuro, com vocabulário do dia a dia.", "Inglês do zero", "Wikipédia", [
        sessao("Alfabeto, sons e cumprimentos", "Pronunciar o alfabeto e se apresentar.", [
            wiki("Alfabeto inglês", "As letras e o seu nome em inglês.", 15, "Alfabeto latino"),
            atividade("Apresente-se", "Escreva e diga em voz alta: 'Hello, my name is…, I'm from…, I'm … years old.' Grave um áudio e ouça.", 25)
        ], [
            ["Como se diz 'prazer em conhecê-lo'?", "Nice to meet you."],
            ["Como se diz 'como vai?'", "How are you?"],
            ["Como se diz 'meu nome é'?", "My name is."]
        ]),
        sessao("Verbo to be", "Usar am, is e are em frases afirmativas, negativas e perguntas.", [
            wiki("Verbo", "O que é verbo e como se conjuga (revisão em português).", 15, "Verbos: revisão em português"),
            atividade("10 frases com to be", "Escreva 10 frases sobre você e sua família: 3 afirmativas, 3 negativas e 4 perguntas ('Are you…?').", 30)
        ], [
            ["Como conjugar to be no presente?", "I am, you are, he/she/it is, we are, you are, they are."],
            ["Como fazer a negativa de to be?", "Acrescentar 'not' depois do verbo: 'She is not (isn't) here'."],
            ["Como fazer pergunta com to be?", "Inverter: 'Are you tired?'"]
        ]),
        sessao("Presente simples e rotina", "Falar da sua rotina com verbos no presente.", [
            wiki("Tempo verbal", "Presente, passado e futuro nos verbos.", 15, "Tempos verbais: o presente"),
            atividade("Meu dia em inglês", "Descreva seu dia com 10 frases: 'I wake up at 7', 'She works…'. Repare no -s da 3ª pessoa do singular.", 30)
        ], [
            ["Como fica o verbo na 3ª pessoa do singular?", "Com -s ou -es: 'he works', 'she watches'."],
            ["Como se faz a negativa no presente simples?", "Com do not/does not + verbo: 'I don't like', 'he doesn't like'."],
            ["Como se diz 'eu acordo às 7'?", "I wake up at seven."]
        ]),
        sessao("Vocabulário essencial", "Aprender as palavras mais usadas do dia a dia.", [
            wiki("Língua inglesa", "A língua inglesa e seu vocabulário.", 15),
            atividade("50 palavras do cotidiano", "Monte 50 cartões (aqui no Kaizen ou no papel) com palavras de casa, comida, transporte e trabalho. Revise 10 por dia.", 35)
        ], [
            ["Como se diz 'obrigado' e 'de nada'?", "Thank you; you're welcome."],
            ["Como se diz 'desculpe'?", "Sorry (ou 'excuse me' pra chamar atenção)."],
            ["Como pedir algo educadamente?", "Could I have…, please?"]
        ]),
        sessao("Passado simples", "Contar o que aconteceu.", [
            wiki("Simple past", "O passado simples em inglês.", 15, "Passado simples (simple past)"),
            atividade("O que fiz no fim de semana", "Escreva 8 frases sobre o seu fim de semana no passado, com pelo menos 3 verbos irregulares (go → went, eat → ate, see → saw).", 30)
        ], [
            ["Como se forma o passado dos verbos regulares?", "Com -ed: 'work → worked'."],
            ["Qual o passado de 'go'?", "Went."],
            ["Como se faz a pergunta no passado?", "Did + sujeito + verbo base: 'Did you go?'"]
        ]),
        sessao("Futuro e planos", "Falar do que vai fazer.", [
            wiki("Tempo verbal", "Os tempos verbais, incluindo o futuro.", 15, "Tempos verbais: o futuro"),
            atividade("Meus planos", "Escreva 6 frases sobre planos: 3 com 'I'm going to…' (planos) e 3 com 'I will…' (decisões na hora).", 30)
        ], [
            ["Qual a diferença entre will e going to?", "Going to é plano já decidido; will é decisão no momento ou previsão."],
            ["Como se diz 'eu vou viajar'?", "I'm going to travel."],
            ["Como se faz pergunta com will?", "Will you come? (will vai pro início)."]
        ])
    ], { idioma: "pt" }),

    plano("corpo-humano", "🫀", "Saúde", "Iniciante", "Os sistemas do corpo e como eles trabalham juntos.", "Corpo humano: como funciona", "Wikipédia", [
        sessao("Células, tecidos e órgãos", "Entender os níveis de organização do corpo.", [
            wiki("Tecido (biologia)", "Os quatro tipos de tecido.", 20, "Tecido biológico"),
            atividade("Do micro ao macro", "Monte um esquema: célula → tecido → órgão → sistema → organismo. Dê um exemplo de cada nível.", 25)
        ], [
            ["Quais os 4 tecidos básicos do corpo?", "Epitelial, conjuntivo, muscular e nervoso."],
            ["O que é um órgão?", "Um conjunto de tecidos que realiza uma função."],
            ["O que é um sistema?", "Um conjunto de órgãos que trabalham juntos."]
        ]),
        sessao("Sistema circulatório", "Entender coração, vasos e sangue.", [
            wiki("Sistema circulatório", "O caminho do sangue.", 25),
            atividade("Siga o sangue", "Desenhe o percurso de uma gota de sangue: coração → pulmões → coração → corpo. Qual a diferença entre artéria e veia?", 30)
        ], [
            ["Quantas câmaras tem o coração humano?", "Quatro: dois átrios e dois ventrículos."],
            ["Qual a diferença entre artéria e veia?", "Artérias levam sangue do coração pro corpo; veias trazem de volta."],
            ["O que fazem as hemácias?", "Transportam oxigênio pelo sangue."]
        ]),
        sessao("Sistema respiratório", "Entender como o ar vira oxigênio no sangue.", [
            wiki("Sistema respiratório", "Vias aéreas, pulmões e trocas gasosas.", 25),
            atividade("Contando respirações", "Conte suas respirações por minuto em repouso e depois de subir uma escada. O que mudou e por quê?", 25)
        ], [
            ["Onde ocorrem as trocas gasosas?", "Nos alvéolos pulmonares."],
            ["Qual músculo ajuda a respirar?", "O diafragma."],
            ["O que acontece com o CO₂?", "Sai do sangue pros alvéolos e é expirado."]
        ]),
        sessao("Sistema digestório", "Acompanhar o alimento do prato ao sangue.", [
            wiki("Sistema digestivo", "Órgãos e etapas da digestão.", 25, "Sistema digestório"),
            atividade("Viagem do pão", "Descreva o que acontece com um pedaço de pão em cada órgão (boca, estômago, intestino delgado e grosso). Onde se absorve a maior parte dos nutrientes?", 30)
        ], [
            ["Onde ocorre a maior absorção de nutrientes?", "No intestino delgado."],
            ["Qual o papel do estômago?", "Misturar o alimento com ácido e enzimas, iniciando a digestão das proteínas."],
            ["O que faz o fígado?", "Produz bile, metaboliza nutrientes e filtra substâncias tóxicas."]
        ]),
        sessao("Sistema nervoso e sentidos", "Entender como o corpo capta e reage ao mundo.", [
            wiki("Sistema nervoso", "Cérebro, medula e nervos.", 25),
            atividade("Reflexo e voluntário", "Dê 3 exemplos de ato reflexo e 3 de ato voluntário. Por que o reflexo é mais rápido?", 25)
        ], [
            ["Qual a célula do sistema nervoso?", "O neurônio."],
            ["O que é um ato reflexo?", "Resposta rápida e involuntária, comandada pela medula, sem passar pelo cérebro."],
            ["O que é a sinapse?", "O ponto de comunicação entre dois neurônios."]
        ]),
        sessao("Sistema imunológico e saúde", "Entender como o corpo se defende.", [
            wiki("Sistema imunitário", "Células e anticorpos.", 25),
            atividade("Vacina e anticorpo", "Explique com suas palavras como uma vacina treina o sistema imunológico, e por que algumas precisam de reforço.", 30)
        ], [
            ["O que são anticorpos?", "Proteínas produzidas pelo corpo que reconhecem e neutralizam agentes invasores."],
            ["O que são leucócitos?", "Glóbulos brancos, as células de defesa do sangue."],
            ["Por que a vacina precisa de reforço?", "Pra manter a memória imunológica ativa e a proteção alta."]
        ])
    ]),

    plano("primeiros-socorros", "🚑", "Saúde", "Para todos", "O que fazer nos primeiros minutos, enquanto o socorro não chega.", "Primeiros socorros", "Wikipédia", [
        sessao("Avaliar a cena e chamar ajuda", "Saber agir com segurança e acionar o socorro certo.", [
            wiki("Primeiros socorros", "Princípios e prioridades.", 20),
            wiki("Serviço de Atendimento Móvel de Urgência", "O que é o SAMU e quando ligar.", 15),
            atividade("Anote os números", "Anote e memorize: SAMU 192, Bombeiros 193 e Polícia 190. Treine em voz alta o que dizer na ligação: local, o que aconteceu, quantas vítimas e estado.", 20)
        ], [
            ["Qual o telefone do SAMU?", "192."],
            ["Qual o primeiro passo ao encontrar uma vítima?", "Garantir a própria segurança e a da cena antes de ajudar."],
            ["O que dizer ao ligar pro socorro?", "Local exato, o que aconteceu, número de vítimas e estado delas."]
        ]),
        sessao("Parada cardiorrespiratória e massagem cardíaca", "Conhecer os passos da RCP.", [
            wiki("Ressuscitação cardiopulmonar", "Compressões e ritmo.", 25),
            atividade("Ritmo da massagem", "Treine o ritmo de 100 a 120 compressões por minuto ao som de uma música (por exemplo, 'Stayin' Alive'). Pratique num travesseiro, com as mãos no centro do peito.", 25)
        ], [
            ["Qual o ritmo das compressões na RCP?", "100 a 120 por minuto."],
            ["Onde posicionar as mãos?", "No centro do peito, sobre a metade inferior do esterno."],
            ["Qual a profundidade das compressões num adulto?", "Cerca de 5 cm, deixando o peito voltar a cada vez."]
        ]),
        sessao("Engasgo", "Agir no engasgo de adulto e de bebê.", [
            wiki("Manobra de Heimlich", "Como desobstruir as vias aéreas.", 20),
            atividade("Treine a manobra", "Peça pra alguém de confiança ficar de pé e treine, sem apertar de verdade, a posição das mãos acima do umbigo. Estude a diferença pro bebê (tapas nas costas).", 25)
        ], [
            ["Qual o sinal de engasgo grave?", "A pessoa não consegue falar, tossir nem respirar e leva as mãos ao pescoço."],
            ["Onde se posicionam as mãos na manobra de Heimlich?", "Acima do umbigo, abaixo das costelas, apertando pra dentro e pra cima."],
            ["No bebê, qual a conduta no engasgo?", "Alternar tapas nas costas e compressões no peito, sem a manobra de Heimlich do adulto."]
        ]),
        sessao("Hemorragias e ferimentos", "Estancar sangramentos e cuidar de cortes.", [
            wiki("Hemorragia", "Tipos e primeiros cuidados.", 20),
            atividade("Monte seu kit", "Liste o que deve ter num kit de primeiros socorros (gaze, atadura, soro, luvas, esparadrapo) e onde guardar em casa e no carro.", 20)
        ], [
            ["Como estancar um sangramento?", "Pressionando diretamente o local com gaze ou pano limpo, sem soltar."],
            ["Deve-se tirar um objeto cravado na pele?", "Não. Estabilize o objeto e procure socorro."],
            ["O que fazer num corte pequeno?", "Lavar com água e sabão, cobrir com curativo limpo."]
        ]),
        sessao("Queimaduras e choque elétrico", "Atender queimaduras e evitar o pior no choque.", [
            wiki("Queimadura", "Graus e conduta.", 20),
            atividade("Mitos e verdades", "Pesquise 5 mitos comuns (pasta de dente, manteiga, gelo na queimadura) e diga por que cada um é errado. O que fazer de fato: água corrente por 10 a 20 minutos.", 25)
        ], [
            ["O que fazer numa queimadura leve?", "Água corrente fria por 10 a 20 minutos e cobrir com pano limpo."],
            ["Pode passar manteiga ou pasta de dente?", "Não. Pioram e aumentam o risco de infecção."],
            ["No choque elétrico, o que fazer antes de tocar a vítima?", "Desligar a fonte de energia."]
        ]),
        sessao("Desmaio, convulsão e AVC", "Reconhecer e agir nas emergências mais comuns.", [
            wiki("Acidente vascular cerebral", "Sinais de alerta (rosto, braço, fala).", 20),
            atividade("Reconheça o AVC", "Decore a sigla do atendimento rápido (rosto torto, fraqueza num braço, fala enrolada, pressa em ligar 192). Explique a um familiar.", 20)
        ], [
            ["Quais sinais indicam um AVC?", "Rosto torto, fraqueza ou dormência num braço e dificuldade na fala. Ligue 192 na hora."],
            ["O que fazer numa convulsão?", "Proteger a cabeça, afastar objetos, deitar de lado depois e não colocar nada na boca."],
            ["O que fazer com quem desmaiou?", "Deitar de barriga pra cima com as pernas elevadas e ver se respira."]
        ])
    ]),

    plano("nutricao-basica", "🥗", "Saúde", "Iniciante", "O que são nutrientes, como ler rótulos e montar um prato equilibrado.", "Nutrição básica", "Wikipédia", [
        sessao("Macronutrientes", "Entender carboidratos, proteínas e gorduras.", [
            wiki("Macronutriente", "As funções de cada um.", 20),
            atividade("Seu prato de hoje", "Anote o que comeu hoje e classifique cada alimento como fonte de carboidrato, proteína ou gordura. Falta algum grupo?", 25)
        ], [
            ["Qual a principal função dos carboidratos?", "Fornecer energia."],
            ["Pra que servem as proteínas?", "Construir e reparar tecidos, além de várias funções do corpo."],
            ["Quantas calorias tem 1 g de proteína, carboidrato e gordura?", "4, 4 e 9 kcal, respectivamente."]
        ]),
        sessao("Vitaminas e minerais", "Saber onde encontrar os micronutrientes.", [
            wiki("Vitamina", "Tipos e fontes.", 20),
            wiki("Sais minerais", "Cálcio, ferro, sódio e outros.", 15, "Sais minerais"),
            atividade("Cores do prato", "Monte um prato com 5 cores diferentes de alimentos naturais. Escreva o nutriente principal de cada um.", 25)
        ], [
            ["Qual vitamina o sol ajuda a produzir?", "A vitamina D."],
            ["Qual mineral é essencial pros ossos?", "O cálcio."],
            ["O que a falta de ferro pode causar?", "Anemia."]
        ]),
        sessao("Guia alimentar para a população brasileira", "Aplicar a regra de ouro do Ministério da Saúde.", [
            wiki("Nutriente", "Os nutrientes e a base de uma alimentação saudável.", 20, "Nutrientes e alimentação saudável"),
            atividade("Classifique por processamento", "Separe os alimentos da sua despensa em: in natura, processados e ultraprocessados. Quantos de cada? Qual troca simples você faria?", 30)
        ], [
            ["O que são alimentos ultraprocessados?", "Formulações industriais com muitos aditivos e pouco alimento de verdade, como refrigerantes e salgadinhos."],
            ["Qual a regra de ouro do Guia Alimentar?", "Prefira alimentos in natura ou minimamente processados e preparações culinárias a ultraprocessados."],
            ["O que são alimentos in natura?", "Os que vêm direto da natureza, sem alteração, como frutas e legumes."]
        ]),
        sessao("Rótulos e informação nutricional", "Ler a tabela e a lista de ingredientes.", [
            wiki("Informação nutricional", "Como ler a tabela do rótulo.", 15),
            atividade("Detetive de rótulo", "Escolha 3 produtos parecidos e compare porção, açúcar, sódio e a lista de ingredientes (ordem decrescente). Qual é a melhor escolha?", 30)
        ], [
            ["Em que ordem os ingredientes aparecem no rótulo?", "Em ordem decrescente de quantidade."],
            ["Por que olhar o tamanho da porção?", "Porque os valores da tabela se referem a ela, e ela pode ser menor que o que você come."],
            ["Quais nomes disfarçam o açúcar?", "Xarope de milho, maltodextrina, glicose, sacarose, entre outros."]
        ]),
        sessao("Hidratação e hábitos", "Entender água, sono e refeições.", [
            wiki("Hidratação", "Quanto beber e sinais de desidratação.", 15, "Desidratação"),
            atividade("Diário da semana", "Por 7 dias, anote água, horário das refeições e sono. No fim, escolha um hábito pra melhorar na semana seguinte.", 30)
        ], [
            ["Qual um sinal simples de hidratação?", "A urina clara, de cor amarelo-claro."],
            ["Pular refeições faz bem?", "Costuma levar a exageros depois; regularidade ajuda o controle da fome."],
            ["Qual a importância do sono na alimentação?", "Dormir mal altera hormônios da fome e da saciedade, aumentando a vontade de comer."]
        ]),
        sessao("Planejando as refeições da semana", "Montar um cardápio simples, barato e equilibrado.", [
            wiki("Dieta (nutrição)", "Equilíbrio, variedade e adequação.", 15, "Dieta"),
            atividade("Cardápio de 3 dias", "Monte 3 dias de refeições com base no seu orçamento, usando alimentos in natura. Faça a lista de compras e some o custo.", 40)
        ], [
            ["O que significa uma dieta equilibrada?", "Variada e na medida: todos os grupos de alimentos nas quantidades adequadas."],
            ["Planejar o cardápio ajuda em quê?", "Reduz desperdício, custo e a escolha por comida pronta."],
            ["Quanto tempo leva pra sentir saciedade?", "Cerca de 20 minutos, por isso comer devagar ajuda."]
        ])
    ]),

    plano("administracao-empreendedorismo", "📈", "Finanças e negócios", "Iniciante", "Do planejamento ao marketing: como pensar e testar um negócio.", "Administração e empreendedorismo", "Wikipédia", [
        sessao("O que é administrar", "Entender planejar, organizar, dirigir e controlar.", [
            wiki("Administração", "Funções administrativas.", 20),
            atividade("Administre algo seu", "Escolha um projeto pessoal e descreva como você planeja, organiza, executa e controla. O que costuma falhar?", 25)
        ], [
            ["Quais as funções clássicas da administração?", "Planejar, organizar, dirigir e controlar (PODC)."],
            ["O que é eficiência e o que é eficácia?", "Eficiência é fazer bem feito (bons meios); eficácia é atingir o objetivo (bons resultados)."],
            ["O que é um objetivo SMART?", "Específico, mensurável, atingível, relevante e com prazo."]
        ]),
        sessao("Análise SWOT", "Mapear forças, fraquezas, oportunidades e ameaças.", [
            wiki("Análise SWOT", "A matriz e como usar.", 20, "Análise SWOT"),
            atividade("SWOT de uma ideia", "Faça a SWOT de uma ideia de negócio (ou da sua carreira): 3 forças, 3 fraquezas, 3 oportunidades e 3 ameaças. Quais ações saem disso?", 35)
        ], [
            ["O que o SWOT analisa?", "Forças e fraquezas (internas) e oportunidades e ameaças (externas)."],
            ["Quais fatores são internos?", "Forças e fraquezas."],
            ["Pra que serve a SWOT?", "Pra apoiar decisões e estratégia, vendo o cenário completo."]
        ]),
        sessao("Marketing e os 4 Ps", "Entender produto, preço, praça e promoção.", [
            wiki("Composto de marketing", "Os 4 Ps.", 20, "Marketing"),
            atividade("Os 4 Ps de uma marca", "Escolha uma marca que você conhece e descreva produto, preço, praça (onde vende) e promoção (como divulga).", 30)
        ], [
            ["Quais são os 4 Ps do marketing?", "Produto, preço, praça (distribuição) e promoção."],
            ["O que é público-alvo?", "O grupo de pessoas que a empresa quer atingir."],
            ["O que é proposta de valor?", "O benefício único que o produto promete entregar ao cliente."]
        ]),
        sessao("Finanças da empresa", "Entender receita, custo, lucro e ponto de equilíbrio.", [
            wiki("Ponto de equilíbrio", "Quando a receita cobre os custos.", 20, "Ponto de equilíbrio"),
            atividade("Quantos preciso vender?", "Você vende bolos por R$ 40, gasta R$ 15 de ingredientes por bolo e tem R$ 1.250 de custos fixos por mês. Quantos bolos precisa vender pra empatar?", 30)
        ], [
            ["O que é lucro?", "Receita menos custos e despesas."],
            ["O que é ponto de equilíbrio?", "O nível de vendas em que a receita iguala os custos, sem lucro nem prejuízo."],
            ["Qual a diferença entre custo fixo e variável?", "Fixo não muda com a venda (aluguel); variável cresce com ela (matéria-prima)."]
        ]),
        sessao("Modelo de negócio e MVP", "Testar uma ideia barato antes de investir.", [
            wiki("Business Model Canvas", "Os 9 blocos de um modelo de negócio.", 20, "Canvas de modelo de negócio"),
            atividade("Canvas de uma página", "Preencha um canvas simples da sua ideia: clientes, proposta de valor, canais, receita, custos e atividades-chave. Qual a hipótese mais arriscada pra testar?", 40)
        ], [
            ["O que é um MVP?", "Produto mínimo viável: a versão mais simples que permite testar a ideia com clientes reais."],
            ["Por que testar antes de investir?", "Pra descobrir cedo se alguém quer pagar, gastando pouco."],
            ["O que é validar uma hipótese?", "Testar com dados ou clientes se uma suposição do negócio é verdadeira."]
        ]),
        sessao("Liderança e trabalho em equipe", "Entender como pessoas trabalham bem juntas.", [
            wiki("Liderança", "Estilos e habilidades.", 20),
            atividade("O que faz uma boa equipe", "Lembre de uma equipe em que você gostou de trabalhar e de outra em que não. Liste 3 diferenças e o que o líder fazia.", 30)
        ], [
            ["O que é feedback?", "Retorno sobre o desempenho de alguém, pra reforçar o que vai bem e corrigir o que não vai."],
            ["Qual a diferença entre chefe e líder?", "O chefe manda pelo cargo; o líder inspira e influencia pela confiança."],
            ["Pra que serve delegar?", "Pra dividir tarefas, dar autonomia e liberar tempo pro que só você pode fazer."]
        ])
    ]),

    plano("fotografia", "📷", "Artes e hobbies", "Iniciante", "Exposição, composição e luz, no celular ou na câmera.", "Fotografia do zero", "Wikipédia", [
        sessao("Como a câmera enxerga", "Entender a luz, o sensor e o enquadramento.", [
            wiki("Fotografia", "História e princípios.", 20),
            atividade("Dez fotos, dez ângulos", "Escolha um objeto e fotografe-o de 10 ângulos diferentes (de cima, de baixo, de perto, de longe). Qual funcionou melhor e por quê?", 30)
        ], [
            ["O que é fotografar?", "Registrar a luz que chega a um sensor (ou filme)."],
            ["O que é enquadramento?", "A escolha do que entra e do que fica fora da foto."],
            ["Por que a luz é o elemento mais importante?", "Porque a fotografia é feita de luz: qualidade e direção definem o clima da imagem."]
        ]),
        sessao("Triângulo da exposição", "Equilibrar abertura, velocidade e ISO.", [
            wiki("Abertura (óptica)", "Quanta luz entra pela lente.", 15, "Abertura"),
            wiki("Velocidade do obturador", "Quanto tempo o sensor recebe luz.", 15),
            wiki("Sensibilidade ISO", "A sensibilidade do sensor à luz.", 15, "ISO"),
            atividade("Mesma cena, três exposições", "Se tiver câmera manual ou app que permita, fotografe a mesma cena com 3 velocidades diferentes e compare nitidez e movimento.", 35)
        ], [
            ["O que é a abertura?", "O tamanho da entrada de luz da lente; quanto menor o número f, maior a abertura."],
            ["O que a velocidade do obturador controla?", "O tempo que o sensor recebe luz, e a nitidez ou o borrão do movimento."],
            ["O que o ISO faz?", "Ajusta a sensibilidade do sensor; ISO alto clareia mas aumenta o ruído."]
        ]),
        sessao("Composição", "Usar regra dos terços, linhas e simetria.", [
            wiki("Regra dos terços", "Posicionar o assunto nos pontos de interesse.", 15),
            atividade("Regra dos terços na prática", "Ligue a grade da câmera do celular e faça 5 fotos com o assunto fora do centro. Compare com versões centralizadas.", 30)
        ], [
            ["O que é a regra dos terços?", "Dividir a imagem em 3 partes na horizontal e vertical e pôr o assunto nas interseções."],
            ["O que são linhas de condução?", "Linhas na cena que guiam o olhar do espectador até o assunto."],
            ["Quando centralizar funciona?", "Quando há simetria forte ou o assunto é muito marcante."]
        ]),
        sessao("Luz natural e hora dourada", "Aproveitar a luz do sol a seu favor.", [
            wiki("Hora dourada", "A luz suave do nascer e do pôr do sol.", 15, "Golden hour"),
            atividade("O mesmo lugar em 3 horários", "Fotografe o mesmo lugar de manhã cedo, ao meio-dia e no fim da tarde. Compare sombras, cores e clima.", 40)
        ], [
            ["O que é a hora dourada?", "A primeira e a última hora de sol, com luz suave, quente e sombras longas."],
            ["Por que evitar o sol do meio-dia?", "A luz fica dura, com sombras fortes e pouco favorecimento."],
            ["O que é contraluz?", "Quando a fonte de luz fica atrás do assunto, criando silhueta ou brilho nas bordas."]
        ]),
        sessao("Foco e profundidade de campo", "Desfocar o fundo e destacar o assunto.", [
            wiki("Profundidade de campo", "Como a abertura e a distância afetam o foco.", 20),
            atividade("Fundo desfocado", "Faça um retrato de um objeto com o fundo desfocado: aproxime-se do assunto e afaste-o do fundo. Use o modo retrato do celular e sem ele.", 30)
        ], [
            ["O que é profundidade de campo?", "A faixa de distância que aparece nítida na foto."],
            ["O que dá um fundo mais desfocado?", "Abertura maior (f menor), assunto mais perto e fundo mais longe."],
            ["Pra que serve o foco manual?", "Pra escolher exatamente o ponto nítido, quando o automático erra."]
        ]),
        sessao("Edição simples", "Ajustar luz, cor e corte sem exagerar.", [
            wiki("Edição de imagem", "Ajustes básicos e boas práticas.", 15, "Edição de imagem"),
            atividade("Antes e depois", "Edite 3 fotos suas ajustando só corte, brilho, contraste e saturação. Mostre o antes e depois e diga o que mudou e por quê.", 40)
        ], [
            ["Qual a primeira coisa a ajustar numa foto?", "O enquadramento (corte) e a exposição geral."],
            ["Por que não exagerar na saturação?", "Deixa as cores artificiais e perde detalhes."],
            ["O que é o formato RAW?", "Arquivo com todos os dados do sensor, que permite edição mais profunda sem perder qualidade."]
        ])
    ]),

    plano("teoria-musical", "🎼", "Artes e hobbies", "Iniciante", "Notas, ritmo, escalas e acordes pra entender e tocar qualquer música.", "Teoria musical básica", "Wikipédia", [
        sessao("Som, notas e pauta", "Entender altura, duração e leitura básica da pauta.", [
            wiki("Teoria musical", "Os elementos da música.", 20),
            wiki("Pauta musical", "Linhas, espaços e claves.", 20),
            atividade("Ache as notas", "Num teclado (ou app), toque as 7 notas naturais (dó a si) e ache-as na pauta na clave de sol. Anote o nome e a posição de cada.", 30)
        ], [
            ["Quais são as 7 notas musicais?", "Dó, ré, mi, fá, sol, lá e si."],
            ["Quantas linhas tem a pauta?", "Cinco."],
            ["Pra que serve a clave?", "Indica o nome das notas na pauta; a de sol marca a linha do sol."]
        ]),
        sessao("Ritmo, compasso e figuras", "Contar o tempo e ler valores de nota.", [
            wiki("Compasso", "Fórmulas e tempos.", 20, "Compasso (música)"),
            wiki("Figura (música)", "Semibreve, mínima, semínima e colcheia.", 20, "Figuras musicais"),
            atividade("Bata o ritmo", "Bata palmas num compasso 4/4 com semínimas, depois com colcheias, depois misturando. Escreva o ritmo com as figuras.", 30)
        ], [
            ["O que significa o compasso 4/4?", "Quatro tempos por compasso, com a semínima valendo um tempo."],
            ["Quantas colcheias cabem numa semínima?", "Duas."],
            ["O que é pulsação?", "A batida regular da música, o 'pulso'."]
        ]),
        sessao("Tons, semitons e escala maior", "Construir a escala de dó maior e entender intervalos.", [
            wiki("Escala maior", "A sequência de tons e semitons.", 20),
            atividade("Escala de dó e de sol", "Escreva a escala de dó maior (tom, tom, semitom, tom, tom, tom, semitom). Depois monte a de sol maior e descubra qual nota ganha sustenido.", 35)
        ], [
            ["Qual a fórmula da escala maior?", "Tom, tom, semitom, tom, tom, tom, semitom."],
            ["O que é um semitom?", "A menor distância entre duas notas no sistema ocidental (do dó ao dó sustenido)."],
            ["O que é uma armadura de clave?", "Os sustenidos ou bemóis que indicam a tonalidade da música."]
        ]),
        sessao("Intervalos", "Medir a distância entre notas e reconhecer o som delas.", [
            wiki("Intervalo (música)", "Terças, quintas, oitavas.", 20, "Intervalo musical"),
            atividade("Intervalos famosos", "Descubra o intervalo inicial de 3 músicas conhecidas (por exemplo, 'Parabéns pra você'). Cante os dois primeiros sons e nomeie a distância.", 30)
        ], [
            ["Quantas notas tem uma oitava?", "Oito notas da escala (de uma nota até a de mesmo nome, mais aguda)."],
            ["Qual o intervalo de dó a sol?", "Uma quinta justa."],
            ["O que dá a cor maior ou menor a um acorde?", "A terça: maior (alegre) ou menor (triste)."]
        ]),
        sessao("Acordes e tríades", "Montar acordes maiores e menores.", [
            wiki("Acorde", "Tríades e cifras.", 20),
            atividade("Monte 6 acordes", "Monte as tríades de dó maior, sol maior, fá maior, lá menor, mi menor e ré menor, escrevendo as 3 notas de cada.", 35)
        ], [
            ["Como se forma uma tríade maior?", "Fundamental, terça maior e quinta justa (ex.: dó-mi-sol)."],
            ["Como se forma uma tríade menor?", "Fundamental, terça menor e quinta justa (ex.: lá-dó-mi)."],
            ["O que é cifra?", "A notação por letras dos acordes: C, G, Am…"]
        ]),
        sessao("Campo harmônico", "Entender os acordes que combinam numa tonalidade.", [
            wiki("Campo harmônico", "Os acordes derivados da escala.", 20),
            atividade("Toque uma progressão", "No campo harmônico de dó maior (C, Dm, Em, F, G, Am, Bdim), toque a progressão I–V–vi–IV (C, G, Am, F) e reconheça em músicas populares.", 40)
        ], [
            ["Quais os acordes do campo harmônico de dó maior?", "C, Dm, Em, F, G, Am e Bdim."],
            ["O que é uma progressão harmônica?", "Uma sequência de acordes."],
            ["Por que muitas músicas usam I–V–vi–IV?", "Porque essa sequência soa familiar e agradável ao ouvido."]
        ])
    ]),

    plano("psicologia-introducao", "🧠", "Humanas", "Iniciante", "As grandes abordagens da psicologia, e como entender comportamento e emoções.", "Introdução à psicologia", "Wikipédia", [
        sessao("O que a psicologia estuda", "Entender a história e as áreas da psicologia.", [
            wiki("Psicologia", "Objeto, história e ramos.", 25),
            atividade("Psicologia no dia a dia", "Cite 5 situações do seu cotidiano que a psicologia estuda (memória, emoção, aprendizagem, motivação, relações) e uma pergunta que ela faria sobre cada.", 25)
        ], [
            ["O que estuda a psicologia?", "O comportamento e os processos mentais."],
            ["Quem fundou o primeiro laboratório de psicologia, em 1879?", "Wilhelm Wundt."],
            ["Psicólogo e psiquiatra são a mesma coisa?", "Não. O psiquiatra é médico e pode receitar remédios; o psicólogo trabalha com a mente e o comportamento, sem prescrever."]
        ]),
        sessao("Behaviorismo: aprender com consequências", "Entender o condicionamento clássico e operante.", [
            wiki("Behaviorismo", "Pavlov, Watson e Skinner.", 20),
            atividade("Condicione um hábito", "Pense num hábito que quer criar. Descreva o estímulo, a resposta e a recompensa (reforço) que o sustentaria.", 25)
        ], [
            ["O que Pavlov descobriu?", "O condicionamento clássico: um estímulo neutro passa a provocar resposta ao ser associado a outro."],
            ["O que é reforço positivo?", "Acrescentar algo agradável após um comportamento, pra aumentá-lo."],
            ["Quem desenvolveu o condicionamento operante?", "B. F. Skinner."]
        ]),
        sessao("Psicanálise e o inconsciente", "Conhecer as ideias de Freud.", [
            wiki("Psicanálise", "Inconsciente, id, ego e superego.", 25),
            atividade("Id, ego e superego", "Dê um exemplo do dia a dia em que o id (desejo), o superego (regra) e o ego (equilíbrio) 'conversam' na sua cabeça.", 25)
        ], [
            ["O que é o inconsciente para Freud?", "A parte da mente com desejos e memórias que influenciam o comportamento sem a gente perceber."],
            ["O que é o ego?", "A instância que mede o desejo (id) e as regras (superego) e se ajusta à realidade."],
            ["O que é um mecanismo de defesa?", "Forma inconsciente de lidar com a ansiedade, como a negação e a projeção."]
        ]),
        sessao("Cognição e desenvolvimento", "Entender como pensamos e como aprendemos ao crescer.", [
            wiki("Jean Piaget", "Os estágios do desenvolvimento cognitivo.", 20),
            wiki("Lev Vygotsky", "Zona de desenvolvimento proximal e interação social.", 20),
            atividade("Estágios de Piaget", "Monte um quadro com os 4 estágios (sensório-motor, pré-operatório, operatório concreto, operatório formal), a idade e uma característica de cada.", 30)
        ], [
            ["Quais os estágios de Piaget?", "Sensório-motor, pré-operatório, operatório concreto e operatório formal."],
            ["O que é a zona de desenvolvimento proximal?", "A distância entre o que a criança faz sozinha e o que faz com ajuda."],
            ["Qual a diferença central entre Piaget e Vygotsky?", "Piaget enfatiza a construção individual; Vygotsky, a interação social e a cultura."]
        ]),
        sessao("Emoções, motivação e personalidade", "Entender o que nos move e como nos diferenciamos.", [
            wiki("Emoção", "Funções e tipos de emoção.", 20),
            wiki("Motivação", "Fatores intrínsecos e extrínsecos.", 20),
            atividade("O que me motiva", "Liste 3 coisas que você faz por motivação interna (prazer) e 3 por externa (recompensa). Qual rende mais constância pra você?", 25)
        ], [
            ["Qual a diferença entre motivação intrínseca e extrínseca?", "Intrínseca vem do prazer na atividade; extrínseca, de recompensas ou pressões externas."],
            ["Pra que servem as emoções?", "Prepararem o corpo pra agir e comunicarem estados internos."],
            ["O que é personalidade?", "O conjunto de padrões estáveis de pensar, sentir e agir de uma pessoa."]
        ]),
        sessao("Psicologia social e saúde mental", "Entender grupos, preconceito e cuidado com a mente.", [
            wiki("Psicologia social", "Influência de grupos e conformidade.", 20),
            wiki("Saúde mental", "Bem-estar, transtornos e acesso ao cuidado.", 20),
            atividade("Sinais de alerta", "Liste sinais de que alguém precisa de ajuda (mudança de sono, isolamento, tristeza prolongada). Anote o CVV (188) e onde buscar atendimento gratuito (UBS, CAPS).", 30)
        ], [
            ["O que é conformidade?", "A tendência de mudar o comportamento pra se adequar ao grupo."],
            ["Qual o telefone do CVV?", "188, apoio emocional gratuito 24 horas."],
            ["O que é estigma em saúde mental?", "O preconceito que faz as pessoas esconderem sofrimento e evitarem procurar ajuda."]
        ])
    ])

];
