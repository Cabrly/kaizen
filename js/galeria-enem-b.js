/* Galeria: ENEM e vestibular, parte 2 (humanas, linguagens e atualidades). */

import { atividade, INEP_PROVAS, khan, mundo, plano, sessao, wiki } from "./galeria-ajudas.js";

const AREA = "ENEM e vestibular";

export default [

    plano("enem-historia-brasil", "🇧🇷", AREA, "Iniciante", "Da colônia à redemocratização, ligando fatos e consequências.", "História do Brasil para o ENEM", "Wikipédia", [
        sessao("Brasil Colônia", "Entender a exploração, o açúcar, o ouro e a escravidão.", [
            wiki("Brasil Colônia", "Economia, sociedade e administração colonial.", 25),
            wiki("Escravidão no Brasil", "Como funcionou, resistências e consequências.", 20),
            atividade("Ciclos econômicos", "Faça uma tabela com pau-brasil, açúcar, ouro: período, região, mão de obra e consequência social de cada um.", 25)
        ], [
            ["O que foram as capitanias hereditárias?", "Divisão do território em faixas doadas a donatários, que as administravam e colonizavam."],
            ["Qual era a base econômica do Nordeste colonial?", "A produção de açúcar nos engenhos, com mão de obra escravizada."],
            ["O que foi o quilombo?", "Comunidade formada por pessoas escravizadas que fugiam e resistiam, como Palmares."]
        ]),
        sessao("Independência e Primeiro Reinado", "Compreender a vinda da família real e a Independência.", [
            wiki("Independência do Brasil", "Contexto, 1822 e o que mudou (e o que não mudou).", 25),
            wiki("Transferência da corte portuguesa para o Brasil", "A vinda da família real em 1808.", 20),
            atividade("Antes e depois de 1808", "Liste 5 mudanças que a chegada da corte trouxe ao Rio de Janeiro (abertura dos portos, Banco do Brasil, imprensa etc.) e quem se beneficiou de cada uma.", 25)
        ], [
            ["O que foi a abertura dos portos (1808)?", "Decreto de D. João VI que liberou o comércio do Brasil com nações amigas, em especial a Inglaterra."],
            ["Quem proclamou a Independência e quando?", "D. Pedro I, em 7 de setembro de 1822."],
            ["Por que a Independência manteve a escravidão e a monarquia?", "Porque foi conduzida pelas elites, que queriam preservar a ordem social e econômica."]
        ]),
        sessao("Segundo Reinado e abolição", "Entender o café, a Guerra do Paraguai e o fim da escravidão.", [
            wiki("Segundo Reinado", "Política, economia cafeeira e crise.", 25),
            wiki("Abolição da escravatura no Brasil", "As leis e o contexto até 1888.", 20),
            atividade("Caminho até a abolição", "Monte uma linha do tempo com Lei Eusébio de Queirós, Ventre Livre, Sexagenários e Lei Áurea. O que cada uma garantiu de fato?", 25)
        ], [
            ["O que dizia a Lei do Ventre Livre (1871)?", "Declarava livres os filhos de mulheres escravizadas nascidos a partir da lei."],
            ["Quando foi assinada a Lei Áurea?", "Em 13 de maio de 1888, pela princesa Isabel."],
            ["Qual o produto que sustentava o Brasil no Segundo Reinado?", "O café, concentrado no Vale do Paraíba e depois no oeste paulista."]
        ]),
        sessao("República Velha", "Entender o coronelismo, a política do café com leite e as revoltas.", [
            wiki("República Velha", "Oligarquias e política dos governadores.", 25),
            wiki("Coronelismo", "O poder local e o voto de cabresto.", 15),
            atividade("Como funcionava o voto", "Explique com suas palavras o voto de cabresto e a política do café com leite. Por que o sistema era chamado de oligárquico?", 25)
        ], [
            ["O que foi a política do café com leite?", "Alternância na presidência entre as elites de São Paulo (café) e de Minas Gerais (leite)."],
            ["O que foi a Guerra de Canudos?", "Conflito (1896-1897) entre o exército e o povoado de Antônio Conselheiro, no sertão da Bahia."],
            ["O que foi o voto de cabresto?", "O controle do voto dos eleitores pelos coronéis, sem liberdade de escolha."]
        ]),
        sessao("Era Vargas", "Compreender a Revolução de 1930, o Estado Novo e as leis trabalhistas.", [
            wiki("Era Vargas", "Governo Provisório, Constitucional e Estado Novo.", 25),
            wiki("Consolidação das Leis do Trabalho", "Os direitos trabalhistas criados na época.", 15),
            atividade("Dois lados de Vargas", "Faça duas colunas: avanços (CLT, voto feminino, indústria) e autoritarismo (censura, DIP, repressão). Qual era a imagem 'pai dos pobres'?", 25)
        ], [
            ["O que foi a Revolução de 1930?", "Movimento que derrubou a República Velha e levou Getúlio Vargas ao poder."],
            ["O que foi o Estado Novo (1937-1945)?", "Ditadura de Vargas, com censura, repressão política e centralização."],
            ["Que direitos a CLT consolidou?", "Carteira de trabalho, jornada, férias, salário mínimo, entre outros."]
        ]),
        sessao("Ditadura militar e redemocratização", "Entender o golpe de 1964, a repressão e a volta da democracia.", [
            wiki("Ditadura militar no Brasil", "1964 a 1985: governos, AI-5 e repressão.", 25),
            wiki("Diretas Já", "O movimento por eleições diretas.", 15),
            atividade("O AI-5", "Pesquise o que foi o Ato Institucional nº 5 e escreva um parágrafo explicando como ele mudou a vida política e cultural do país.", 25)
        ], [
            ["O que foi o AI-5 (1968)?", "O ato mais duro da ditadura: fechou o Congresso, suspendeu direitos e ampliou a censura e a tortura."],
            ["O que foram as Diretas Já?", "Campanha popular (1983-1984) por eleições presidenciais diretas."],
            ["Quando foi promulgada a atual Constituição?", "Em 5 de outubro de 1988."]
        ])
    ]),

    plano("enem-historia-geral", "🏛️", AREA, "Iniciante", "Antiguidade, Idade Média, revoluções e guerras mundiais.", "História geral para o ENEM", "Khan Academy", [
        sessao("Antiguidade clássica: Grécia e Roma", "Entender a democracia ateniense e o império romano.", [
            wiki("Grécia Antiga", "Cidades-estado, democracia e cultura.", 25),
            wiki("Roma Antiga", "República, Império e legado.", 25),
            khan("História mundial (Khan Academy)", "humanities/world-history", "Cursos de história com linha do tempo.", 30),
            atividade("Que democracia era essa?", "Compare a democracia ateniense com a de hoje: quem podia votar lá e quem pode aqui? O que mudou?", 25)
        ], [
            ["Quem participava da democracia ateniense?", "Só homens livres e filhos de atenienses; mulheres, escravizados e estrangeiros ficavam de fora."],
            ["Quais as fases de Roma?", "Monarquia, República e Império."],
            ["Qual o legado romano mais presente hoje?", "O direito, a língua latina (origem do português) e a engenharia."]
        ]),
        sessao("Idade Média e feudalismo", "Compreender a sociedade feudal e o poder da Igreja.", [
            wiki("Feudalismo", "Senhores, vassalos e servos.", 20),
            wiki("Idade Média", "Períodos e características.", 25),
            atividade("Pirâmide feudal", "Desenhe a pirâmide social feudal (rei, nobres, clero, servos) e descreva as obrigações de cada grupo.", 25)
        ], [
            ["O que era servidão?", "Relação em que o camponês vivia na terra do senhor, pagando obrigações em troca de proteção."],
            ["Qual era o papel da Igreja na Idade Média?", "Dava legitimidade ao poder, detinha terras e dominava a educação e a cultura."],
            ["O que foram as Cruzadas?", "Expedições militares cristãs, entre os séculos XI e XIII, para tomar Jerusalém dos muçulmanos."]
        ]),
        sessao("Renascimento, Reforma e Absolutismo", "Entender as transformações da Europa moderna.", [
            wiki("Renascimento", "A cultura humanista e a arte.", 25),
            wiki("Reforma Protestante", "Lutero e a divisão do cristianismo.", 20),
            wiki("Absolutismo", "O poder dos reis e o mercantilismo.", 20),
            atividade("Três rupturas", "Explique em 3 parágrafos como Renascimento (cultura), Reforma (religião) e Absolutismo (política) mudaram o pensamento europeu.", 30)
        ], [
            ["O que é humanismo?", "Corrente que valoriza o ser humano e a razão, central no Renascimento."],
            ["O que Lutero criticava em 1517?", "Entre outros pontos, a venda de indulgências pela Igreja Católica."],
            ["O que é mercantilismo?", "Política econômica que defendia acúmulo de metais preciosos, balança comercial favorável e colônias."]
        ]),
        sessao("Iluminismo e Revolução Francesa", "Compreender as ideias que derrubaram o Antigo Regime.", [
            wiki("Iluminismo", "Razão, liberdade e crítica ao absolutismo.", 25),
            wiki("Revolução Francesa", "Causas, fases e legado.", 25),
            atividade("Lema e ideias", "Explique 'Liberdade, Igualdade, Fraternidade' e relacione com pelo menos dois iluministas (Montesquieu, Rousseau, Voltaire).", 25)
        ], [
            ["O que defendia Montesquieu?", "A separação dos poderes em Executivo, Legislativo e Judiciário."],
            ["Quando começou a Revolução Francesa?", "Em 1789, com a Queda da Bastilha."],
            ["O que foi a Declaração dos Direitos do Homem e do Cidadão?", "Documento de 1789 que afirmou direitos individuais e a igualdade perante a lei."]
        ]),
        sessao("Revolução Industrial e imperialismo", "Entender a fábrica, o capitalismo e a divisão do mundo.", [
            wiki("Revolução Industrial", "Máquina a vapor, fábrica e sociedade.", 25),
            wiki("Imperialismo", "A partilha da África e da Ásia.", 20),
            atividade("O operário do século XIX", "Descreva a rotina de um operário inglês de 1850 (jornada, salário, moradia, trabalho infantil) e relacione com o surgimento dos sindicatos.", 25)
        ], [
            ["Onde começou a Revolução Industrial e por quê?", "Na Inglaterra, por reunir carvão, capital, mercado consumidor e mão de obra."],
            ["O que foi a Conferência de Berlim (1884-85)?", "A reunião em que potências europeias dividiram a África entre si."],
            ["O que são sindicatos?", "Organizações de trabalhadores que defendem melhores salários e condições de trabalho."]
        ]),
        sessao("Guerras mundiais e Guerra Fria", "Compreender os conflitos do século XX e a ordem que veio depois.", [
            wiki("Primeira Guerra Mundial", "Causas, o conflito e o Tratado de Versalhes.", 25),
            wiki("Segunda Guerra Mundial", "Nazifascismo, Holocausto e o fim da guerra.", 25),
            wiki("Guerra Fria", "EUA e URSS, corrida armamentista e blocos.", 20),
            atividade("Do Versalhes a Hitler", "Explique como o Tratado de Versalhes e a crise de 1929 ajudaram o nazismo a chegar ao poder na Alemanha.", 30)
        ], [
            ["Qual o estopim da Primeira Guerra Mundial?", "O assassinato do arquiduque Francisco Ferdinando, em Sarajevo, em 1914."],
            ["O que foi o Holocausto?", "O genocídio de cerca de 6 milhões de judeus (e de outros grupos) pelo regime nazista."],
            ["O que caracterizou a Guerra Fria?", "A disputa política, ideológica e militar entre EUA (capitalismo) e URSS (socialismo), sem conflito direto entre eles."]
        ])
    ]),

    plano("enem-geografia", "🌎", AREA, "Iniciante", "Mapas, clima, população, cidades, globalização e meio ambiente.", "Geografia para o ENEM", "Wikipédia", [
        sessao("Cartografia: ler e usar mapas", "Interpretar escala, coordenadas e legendas.", [
            wiki("Cartografia", "Mapas, escala, projeções e orientação.", 20),
            wiki("Coordenadas geográficas", "Latitude, longitude e fusos horários.", 20),
            atividade("O fuso do mundo", "Se são 14h em Brasília, que horas são em Lisboa (UTC+0), Tóquio (UTC+9) e Nova York (UTC−5)? Explique o cálculo.", 25)
        ], [
            ["O que é a escala de um mapa?", "A relação entre a distância no mapa e a distância real no terreno."],
            ["O que mede a latitude?", "A distância em graus ao norte ou ao sul da linha do Equador."],
            ["Por que existem fusos horários?", "Porque a Terra gira, então o Sol nasce em horas diferentes em cada longitude."]
        ]),
        sessao("Relevo, clima e biomas do Brasil", "Relacionar clima, vegetação e ocupação humana.", [
            wiki("Biomas do Brasil", "Amazônia, Cerrado, Caatinga, Mata Atlântica, Pampa e Pantanal.", 25),
            wiki("Clima do Brasil", "Tipos climáticos e fatores.", 20),
            atividade("Mapa dos biomas", "Desenhe o mapa do Brasil e pinte os 6 biomas. Pra cada um, escreva uma ameaça atual e uma característica da vegetação.", 30)
        ], [
            ["Quais são os 6 biomas brasileiros?", "Amazônia, Cerrado, Caatinga, Mata Atlântica, Pampa e Pantanal."],
            ["Qual bioma é o mais devastado, restando cerca de 12% da cobertura original?", "A Mata Atlântica."],
            ["O que causa o clima semiárido do sertão?", "Baixa umidade e chuvas irregulares, com seca prolongada."]
        ]),
        sessao("População e migrações", "Interpretar pirâmides etárias e fluxos migratórios.", [
            wiki("Demografia", "Natalidade, mortalidade e crescimento.", 20),
            wiki("Transição demográfica", "As fases do crescimento populacional.", 20),
            atividade("Pirâmide etária", "Compare a pirâmide etária do Brasil em 1980 e a atual: o que mudou na base e no topo? O que isso causa em saúde e previdência?", 30)
        ], [
            ["O que mostra uma pirâmide etária?", "A distribuição da população por idade e sexo."],
            ["O que é êxodo rural?", "A migração do campo para a cidade."],
            ["O que significa o envelhecimento da população?", "Aumento da proporção de idosos, por queda da natalidade e aumento da expectativa de vida."]
        ]),
        sessao("Urbanização e problemas urbanos", "Entender o crescimento das cidades e seus desafios.", [
            wiki("Urbanização", "Processo e consequências.", 20),
            wiki("Região metropolitana", "Conurbação e metrópoles.", 15),
            atividade("Problema e solução", "Escolha um problema da sua cidade (trânsito, moradia, enchente) e proponha duas soluções com agentes e meios. Isso treina a proposta de redação.", 30)
        ], [
            ["O que é conurbação?", "Quando o crescimento de cidades vizinhas as une numa só mancha urbana."],
            ["Por que a urbanização brasileira foi rápida e desigual?", "Pelo êxodo rural intenso a partir de 1950, sem planejamento e sem moradia suficiente."],
            ["O que é uma favela?", "Moradia precária em área sem infraestrutura, resultado da falta de acesso à moradia formal."]
        ]),
        sessao("Globalização e economia mundial", "Compreender o comércio, as multinacionais e os blocos econômicos.", [
            wiki("Globalização", "Integração econômica, cultural e tecnológica.", 25),
            wiki("Bloco econômico", "União Europeia, Mercosul e outros.", 20),
            atividade("Onde foi feito?", "Olhe 5 produtos que você usa (celular, tênis, roupa etc.) e descubra em que países cada parte foi feita. O que isso revela sobre a globalização?", 25)
        ], [
            ["O que é globalização?", "A crescente integração econômica, cultural e política do mundo, favorecida pela tecnologia."],
            ["O que é o Mercosul?", "Bloco econômico da América do Sul, formado originalmente por Brasil, Argentina, Paraguai e Uruguai."],
            ["O que é uma empresa multinacional?", "A que atua em vários países, em geral com sede num e fábricas em outros."]
        ]),
        sessao("Meio ambiente e sustentabilidade", "Entender mudanças climáticas, desmatamento e energia.", [
            wiki("Aquecimento global", "Causas, efeitos e acordos.", 25),
            wiki("Desenvolvimento sustentável", "O equilíbrio entre economia e ambiente.", 20),
            atividade("Matriz energética", "Compare fontes de energia (hidrelétrica, solar, eólica, petróleo): vantagens, desvantagens e impacto ambiental. Qual predomina no Brasil?", 30)
        ], [
            ["Qual o principal gás do efeito estufa agravado pelas atividades humanas?", "O dióxido de carbono (CO₂)."],
            ["O que é energia renovável?", "A que vem de fontes naturais que se regeneram, como sol, vento e água."],
            ["O que é desenvolvimento sustentável?", "O que atende às necessidades atuais sem comprometer as das gerações futuras."]
        ]),
        sessao("Geopolítica: conflitos e ordem mundial", "Compreender as tensões atuais e suas origens.", [
            wiki("Geopolítica", "Poder, território e recursos.", 20),
            wiki("Conflito israelo-palestino", "Origens e disputas.", 25),
            atividade("Mapa de um conflito", "Escolha um conflito atual, ache no mapa, e escreva as causas históricas, os atores envolvidos e o que está em disputa.", 30)
        ], [
            ["O que é geopolítica?", "O estudo da influência da geografia (território, recursos, posição) na política entre os Estados."],
            ["O que é um refugiado?", "Pessoa que foge do seu país por perseguição, guerra ou violência."],
            ["O que é o Conselho de Segurança da ONU?", "O órgão responsável pela paz mundial, com 5 membros permanentes com poder de veto."]
        ])
    ]),

    plano("enem-filosofia-sociologia", "💭", AREA, "Iniciante", "Os grandes pensadores e conceitos que o ENEM cobra, e que viram repertório de redação.", "Filosofia e sociologia para o ENEM", "Wikipédia", [
        sessao("O nascimento da filosofia", "Entender a passagem do mito à razão e os primeiros filósofos.", [
            wiki("Filosofia antiga", "Pré-socráticos, Sócrates, Platão e Aristóteles.", 25),
            wiki("Mito da caverna", "A alegoria de Platão sobre o conhecimento.", 15),
            atividade("A caverna de hoje", "Dê um exemplo atual do mito da caverna (redes sociais, bolha de informação?) e explique o que seria 'sair da caverna'.", 25)
        ], [
            ["O que é o método socrático?", "Um diálogo de perguntas que leva o outro a examinar suas próprias ideias."],
            ["O que o mito da caverna representa?", "A passagem da ignorância (sombras) ao conhecimento verdadeiro (luz)."],
            ["O que diferencia mito de filosofia?", "O mito explica pela tradição e pelo sobrenatural; a filosofia busca explicar pela razão e pelo argumento."]
        ]),
        sessao("Razão e conhecimento na era moderna", "Compreender Descartes, empirismo e Kant.", [
            wiki("René Descartes", "O racionalismo e a dúvida metódica.", 20),
            wiki("Immanuel Kant", "O criticismo e o imperativo categórico.", 25),
            atividade("Racionalismo x empirismo", "Faça uma tabela comparando racionalistas e empiristas: de onde vem o conhecimento pra cada um? Dê um exemplo de cada.", 30)
        ], [
            ["O que significa 'penso, logo existo'?", "A frase de Descartes: o fato de duvidar prova que existo como ser pensante."],
            ["O que defendem os empiristas?", "Que o conhecimento vem da experiência pelos sentidos."],
            ["O que é o imperativo categórico de Kant?", "Agir só segundo uma regra que você queira que valha para todos."]
        ]),
        sessao("Ética e política", "Entender o que é ser justo e como se organiza o poder.", [
            wiki("Ética", "Moral, dever e virtude.", 20),
            wiki("Contrato social", "Hobbes, Locke e Rousseau.", 25),
            atividade("Dilema ético", "Escolha um dilema (furtar remédio pra salvar alguém, por exemplo) e analise sob duas visões: a de Kant (dever) e a utilitarista (consequências).", 30)
        ], [
            ["Qual a diferença entre ética e moral?", "Moral são as regras de um grupo; ética é a reflexão sobre o que é certo e por quê."],
            ["O que defendia Hobbes?", "Que, sem Estado forte, haveria 'guerra de todos contra todos'."],
            ["O que é o contrato social?", "A ideia de que o poder do Estado nasce de um acordo entre as pessoas."]
        ]),
        sessao("Sociologia: os clássicos", "Conhecer Durkheim, Weber e Marx.", [
            wiki("Sociologia", "Objeto e origem da disciplina.", 20),
            wiki("Émile Durkheim", "Fato social e solidariedade.", 20),
            wiki("Karl Marx", "Luta de classes e mais-valia.", 25),
            atividade("Três olhares", "Resuma em 2 frases cada: o fato social (Durkheim), a ação social (Weber) e a luta de classes (Marx). Aplique os três a um tema como o trabalho.", 30)
        ], [
            ["O que é fato social, para Durkheim?", "Maneiras de agir e pensar que existem fora do indivíduo e exercem coerção sobre ele."],
            ["O que Weber estudou?", "A ação social e o sentido que as pessoas dão a ela (e a burocracia e o capitalismo)."],
            ["O que é luta de classes, para Marx?", "O conflito entre quem detém os meios de produção e quem vende sua força de trabalho."]
        ]),
        sessao("Cultura, ideologia e indústria cultural", "Analisar como valores e mídia moldam a sociedade.", [
            wiki("Indústria cultural", "A cultura como mercadoria.", 20),
            wiki("Etnocentrismo", "Julgar outras culturas pela própria.", 15),
            atividade("Etnocentrismo no dia a dia", "Descreva uma situação de etnocentrismo e como o relativismo cultural ajudaria a entendê-la.", 25)
        ], [
            ["O que é etnocentrismo?", "Julgar outras culturas tendo a própria como padrão de superioridade."],
            ["O que é indústria cultural?", "Conceito da Escola de Frankfurt: a produção em massa de cultura voltada ao consumo."],
            ["O que é relativismo cultural?", "Entender cada cultura a partir dos seus próprios valores."]
        ]),
        sessao("Cidadania, direitos humanos e desigualdade", "Entender direitos e desigualdades da sociedade brasileira.", [
            wiki("Direitos humanos", "A Declaração Universal de 1948.", 20),
            wiki("Desigualdade social", "Formas e causas.", 20),
            atividade("Uma redação em tópicos", "Escolha uma desigualdade (renda, gênero, raça, regional) e monte um esquema: problema, duas causas, dois efeitos, repertório (um pensador) e proposta.", 40)
        ], [
            ["O que é cidadania?", "O conjunto de direitos e deveres que permite a participação plena na vida social e política."],
            ["Quando foi proclamada a Declaração Universal dos Direitos Humanos?", "Em 1948, pela ONU."],
            ["O que é desigualdade social?", "A distribuição desigual de renda, oportunidades e direitos entre grupos."]
        ])
    ]),

    plano("enem-literatura", "📖", AREA, "Iniciante", "As escolas literárias, autores e obras que mais caem.", "Literatura brasileira para o ENEM", "Wikipédia", [
        sessao("Barroco e Arcadismo", "Reconhecer os dois primeiros movimentos e suas marcas.", [
            wiki("Barroco", "Contrastes, culto ao dualismo e Gregório de Matos.", 20, "Barroco no Brasil"),
            wiki("Arcadismo", "Simplicidade, vida bucólica e Cláudio Manuel da Costa.", 20, "Arcadismo no Brasil"),
            atividade("Dois poemas, duas épocas", "Leia um poema de Gregório de Matos e um de Tomás Antônio Gonzaga (Marília de Dirceu). Compare: tom, imagens e visão de mundo.", 30)
        ], [
            ["Que característica marca o Barroco?", "O conflito entre o espiritual e o material, com linguagem rebuscada e uso de antíteses."],
            ["O que significa 'fugere urbem' no Arcadismo?", "Fugir da cidade: valorização da vida simples no campo."],
            ["Quem é conhecido como 'Boca do Inferno'?", "Gregório de Matos, poeta barroco."]
        ]),
        sessao("Romantismo: poesia", "Entender as três gerações românticas.", [
            wiki("Romantismo", "Nacionalismo, subjetividade e as gerações.", 25, "Romantismo no Brasil"),
            wiki("Castro Alves", "O poeta dos escravos, da geração condoreira.", 15),
            atividade("Três gerações", "Monte um quadro com a geração indianista (Gonçalves Dias), a ultrarromântica (Álvares de Azevedo) e a condoreira (Castro Alves): tema e um verso conhecido de cada.", 30)
        ], [
            ["Qual era o tema da 1ª geração romântica?", "O nacionalismo e o indianismo, com o índio como herói."],
            ["Qual era o tema da 2ª geração romântica?", "O mal do século: pessimismo, morbidez e amor idealizado."],
            ["Qual era o tema da 3ª geração?", "A poesia social e política, como o abolicionismo de Castro Alves."]
        ]),
        sessao("Romantismo: prosa", "Reconhecer os tipos de romance e seus autores.", [
            wiki("José de Alencar", "Romances indianistas, urbanos e regionalistas.", 20),
            wiki("Machado de Assis", "Do Romantismo ao Realismo.", 25),
            atividade("Alencar em três tipos", "Liste uma obra de Alencar em cada tipo (indianista, urbano, regionalista) e resuma em 2 linhas a de sua escolha.", 25)
        ], [
            ["Quais obras indianistas de Alencar são famosas?", "O Guarani, Iracema e Ubirajara."],
            ["O que é romance regionalista?", "Obra que retrata costumes e paisagens de uma região específica."],
            ["Quem escreveu 'Memórias Póstumas de Brás Cubas'?", "Machado de Assis, em 1881, marco do Realismo brasileiro."]
        ]),
        sessao("Realismo, Naturalismo e Parnasianismo", "Compreender a crítica social e a poesia da forma.", [
            wiki("Realismo", "A representação objetiva e a crítica social.", 20, "Realismo no Brasil"),
            wiki("Naturalismo", "Determinismo e cientificismo.", 15, "Naturalismo no Brasil"),
            wiki("Parnasianismo", "A arte pela arte.", 15, "Parnasianismo no Brasil"),
            atividade("Do Romantismo ao Realismo", "Compare um trecho romântico e um realista: como cada um trata o amor, a sociedade e o narrador?", 30)
        ], [
            ["O que diferencia o Realismo do Romantismo?", "O Realismo é objetivo e crítico; o Romantismo é subjetivo e idealizador."],
            ["Qual obra naturalista de Aluísio Azevedo retrata a vida num cortiço?", "O Cortiço."],
            ["O que defendia o Parnasianismo?", "A arte pela arte, com perfeição formal e temas objetivos."]
        ]),
        sessao("Simbolismo e Pré-Modernismo", "Conhecer a transição pro século XX.", [
            wiki("Simbolismo", "Subjetividade, musicalidade e Cruz e Sousa.", 20, "Simbolismo no Brasil"),
            wiki("Pré-Modernismo", "Euclides da Cunha, Lima Barreto e Monteiro Lobato.", 25, "Pré-Modernismo no Brasil"),
            atividade("O país real", "Pesquise 'Os Sertões' e 'Triste Fim de Policarpo Quaresma'. Em que cada obra expõe o Brasil que a elite não via?", 30)
        ], [
            ["Quem é o principal nome do Simbolismo brasileiro?", "Cruz e Sousa."],
            ["O que é o Pré-Modernismo?", "Período (1902-1922) que denuncia problemas sociais e anuncia o Modernismo."],
            ["Qual livro de Euclides da Cunha narra Canudos?", "Os Sertões."]
        ]),
        sessao("Modernismo: primeira e segunda geração", "Entender a Semana de 22 e a renovação da literatura.", [
            wiki("Semana de Arte Moderna", "O marco do Modernismo (1922).", 20),
            wiki("Modernismo no Brasil", "Fases e autores.", 25),
            atividade("Manifesto em um parágrafo", "Explique o que os modernistas queriam romper (cânones, formas) e o que valorizavam (língua falada, cultura brasileira). Cite Oswald, Mário e Manuel Bandeira.", 30)
        ], [
            ["Quando foi a Semana de Arte Moderna?", "Em fevereiro de 1922, em São Paulo."],
            ["O que foi a antropofagia?", "Movimento de Oswald de Andrade: 'devorar' a cultura estrangeira e transformá-la em algo brasileiro."],
            ["Quem escreveu 'Macunaíma'?", "Mário de Andrade."]
        ]),
        sessao("Modernismo: prosa de 30 e poesia contemporânea", "Reconhecer regionalismo, Drummond, Clarice e Guimarães Rosa.", [
            wiki("Graciliano Ramos", "Vidas Secas e a prosa social de 30.", 20),
            wiki("Carlos Drummond de Andrade", "A poesia do cotidiano.", 15),
            wiki("Clarice Lispector", "A prosa intimista.", 15),
            atividade("Cinco obras, cinco temas", "Monte um quadro com Vidas Secas, A Hora da Estrela, Grande Sertão: Veredas, Capitães da Areia e Sagarana: autor, tema e região.", 35)
        ], [
            ["O que retrata 'Vidas Secas'?", "A miséria de uma família de retirantes no sertão nordestino."],
            ["O que caracteriza a prosa de Clarice Lispector?", "O foco no mundo interior das personagens, o fluxo de consciência."],
            ["O que é 'Grande Sertão: Veredas'?", "Romance de Guimarães Rosa, com linguagem inventiva, sobre jagunços do sertão mineiro."]
        ])
    ]),

    plano("enem-portugues", "🔤", AREA, "Iniciante", "Interpretação, gêneros, gramática útil e figuras de linguagem.", "Português para o ENEM", "Wikipédia", [
        sessao("Interpretação de texto", "Ler com atenção e achar o que o texto diz e o que insinua.", [
            wiki("Leitura crítica", "Compreender, inferir e questionar o texto.", 20, "Leitura crítica e interpretação"),
            INEP_PROVAS,
            atividade("Questão sob lupa", "Pegue uma questão de interpretação de uma prova antiga. Antes de olhar as alternativas, escreva com suas palavras a ideia do texto. Depois elimine as que distorcem, exageram ou fogem do texto.", 40)
        ], [
            ["O que é inferência?", "Concluir algo que não está dito explicitamente, mas que o texto sugere."],
            ["Que erros comuns há nas alternativas erradas?", "Extrapolar o texto, trocar uma ideia pelo contrário, generalizar demais ou citar algo que não aparece."],
            ["O que ajuda a achar a ideia principal?", "O título, a introdução, a conclusão e as palavras repetidas."]
        ]),
        sessao("Gêneros e tipos textuais", "Reconhecer a finalidade de cada gênero.", [
            wiki("Gênero textual", "Notícia, crônica, carta, charge, artigo.", 20),
            wiki("Tipologia textual", "Narração, descrição, dissertação, injunção.", 15),
            atividade("Que gênero é esse?", "Pegue 5 textos diferentes (uma notícia, uma charge, um anúncio, uma receita, um poema) e diga gênero, tipo predominante, público e objetivo.", 30)
        ], [
            ["Qual a diferença entre tipo e gênero textual?", "Tipo é a estrutura (narração, dissertação); gênero é a forma concreta (notícia, carta)."],
            ["Pra que serve uma charge?", "Fazer crítica social ou política com humor, combinando imagem e texto."],
            ["O que é função da linguagem?", "O foco da comunicação (emotiva, referencial, apelativa, poética etc.)."]
        ]),
        sessao("Variação linguística", "Entender que a língua muda por região, grupo e situação.", [
            wiki("Variação linguística", "Variedades regionais, sociais e situacionais.", 25),
            atividade("Fala e escrita", "Liste 5 expressões da sua região ou grupo e diga a versão formal. Explique por que variar não é 'errar' e quando a norma culta é exigida.", 25)
        ], [
            ["O que é variação linguística?", "As diferenças no uso da língua por região, classe, idade e situação."],
            ["Variedade informal é erro?", "Não. É adequada a certos contextos; o erro é usar a variedade inadequada à situação."],
            ["O que é preconceito linguístico?", "Julgar uma pessoa pela maneira como fala, tratando uma variedade como superior."]
        ]),
        sessao("Classes de palavras e funções", "Reconhecer substantivo, verbo, adjetivo e outros pelo uso.", [
            wiki("Classe gramatical", "As dez classes de palavras do português.", 20),
            atividade("Classifique", "Pegue um parágrafo e classifique 15 palavras. Repare como a mesma palavra pode mudar de classe conforme o uso ('o jantar', 'eu jantar').", 25)
        ], [
            ["O que é um adjetivo?", "A palavra que caracteriza o substantivo."],
            ["O que faz uma conjunção?", "Liga orações ou termos, expressando relações como adição, oposição ou causa."],
            ["O que faz o advérbio?", "Modifica um verbo, adjetivo ou outro advérbio, indicando circunstância."]
        ]),
        sessao("Concordância, regência e crase", "Evitar os desvios mais cobrados.", [
            wiki("Concordância verbal", "O verbo concorda com o sujeito.", 20),
            wiki("Crase", "Quando usar o acento grave.", 20),
            atividade("Reescreva certo", "Corrija: 'Fazem dois anos que moro aqui', 'Assisti o filme', 'Vou à pé', 'Houveram problemas'. Explique a regra de cada.", 30)
        ], [
            ["Como se usa o verbo 'haver' no sentido de existir?", "Fica no singular: 'Houve problemas'."],
            ["Quando ocorre crase?", "Quando se junta a preposição 'a' com o artigo feminino 'a' (ou o 'a' de aquele, aquela, aquilo)."],
            ["Qual a regência de 'assistir' no sentido de ver?", "Exige a preposição 'a': 'Assisti ao filme'."]
        ]),
        sessao("Pontuação e coesão", "Usar vírgulas e conectivos pra deixar o texto claro.", [
            wiki("Vírgula", "Usos obrigatórios e proibidos.", 20),
            wiki("Coesão textual", "Conectivos e referências.", 20),
            atividade("Vírgula muda sentido", "Mostre como a vírgula muda o sentido de 'Não, queremos comida' e 'Não queremos comida'. Pontue um parágrafo sem pontuação.", 25)
        ], [
            ["Pode-se separar sujeito e verbo com vírgula?", "Não, em regra."],
            ["Quando se usa vírgula antes de 'mas'?", "Sempre, pois é conjunção adversativa."],
            ["Pra que serve o ponto e vírgula?", "Marca uma pausa maior que a vírgula, separando partes de uma frase longa ou itens complexos."]
        ]),
        sessao("Figuras de linguagem", "Identificar metáfora, ironia, hipérbole e outras.", [
            wiki("Figura de linguagem", "As principais figuras.", 25),
            atividade("Ache as figuras", "Em letras de música ou poemas que você gosta, ache 5 figuras de linguagem (metáfora, comparação, ironia, hipérbole, antítese) e explique o efeito de cada uma.", 30)
        ], [
            ["Qual a diferença entre comparação e metáfora?", "A comparação usa conectivo ('como'); a metáfora identifica direto ('Ele é uma fera')."],
            ["O que é ironia?", "Dizer o contrário do que se pensa, com intenção crítica ou humorística."],
            ["O que é hipérbole?", "O exagero intencional pra dar ênfase."]
        ])
    ]),

    plano("enem-ingles", "🇬🇧", AREA, "Iniciante", "Estratégias de leitura pra resolver as questões de inglês (ou espanhol) sem medo.", "Inglês instrumental para o ENEM", "Wikipédia", [
        sessao("Estratégias de leitura", "Entender o texto sem traduzir palavra por palavra.", [
            wiki("Falso cognato", "Palavras parecidas com o português, mas de sentido diferente.", 20, "Falsos cognatos"),
            atividade("Leitura em 3 passos", "Pegue uma questão de inglês de uma prova antiga e faça: (1) leia o título e as imagens, (2) procure cognatos e nomes próprios, (3) ache a ideia de cada parágrafo. Depois leia as alternativas.", 40)
        ], [
            ["O que são cognatos?", "Palavras parecidas nas duas línguas e com o mesmo sentido, como 'important' e 'importante'."],
            ["O que são falsos cognatos?", "Palavras parecidas com sentido diferente: 'library' é biblioteca, não livraria."],
            ["Preciso entender todas as palavras?", "Não. Foque na ideia geral e nas palavras repetidas e em destaque."]
        ]),
        sessao("Tempos verbais essenciais", "Reconhecer presente, passado e futuro nos textos.", [
            wiki("Tempo verbal", "Os tempos verbais e seus usos.", 20, "Gramática da língua inglesa"),
            atividade("Que tempo é esse?", "Num texto curto em inglês, marque os verbos e classifique: presente, passado ou futuro. Repare nos finais -ed, was/were, will.", 30)
        ], [
            ["Como se forma o passado simples regular?", "Acrescentando -ed ao verbo ('work' → 'worked')."],
            ["Como se forma o futuro com 'will'?", "Will + verbo no infinitivo: 'will study'."],
            ["Como se forma o presente contínuo?", "Verbo to be + verbo com -ing: 'is studying'."]
        ]),
        sessao("Conectivos e palavras-chave", "Usar however, although, because e outras pra entender a lógica.", [
            wiki("Conjunção", "Conectivos e a relação entre ideias.", 15, "Conjunções (comparação com o português)"),
            atividade("Tabela de conectivos", "Monte a sua: however/but (oposição), because/since (causa), therefore/so (conclusão), although (concessão), and (adição). Ache cada um num texto real.", 30)
        ], [
            ["O que expressa 'however'?", "Oposição: 'no entanto'."],
            ["O que expressa 'although'?", "Concessão: 'embora'."],
            ["O que expressa 'therefore'?", "Conclusão: 'portanto'."]
        ]),
        sessao("Vocabulário de provas", "Aprender palavras que aparecem sempre.", [
            wiki("Inglês", "A língua inglesa no mundo, pra contextualizar.", 15, "Língua inglesa"),
            atividade("50 palavras", "Faça cartões (aqui no Kaizen ou no papel) com 50 palavras comuns em provas: environment, health, technology, young, however, although, rights, climate etc. Revise 10 por dia.", 35)
        ], [
            ["O que significa 'although'?", "Embora."],
            ["O que significa 'rights'?", "Direitos."],
            ["O que significa 'environment'?", "Meio ambiente."]
        ]),
        sessao("Textos jornalísticos e publicitários", "Interpretar notícia, anúncio e charge em inglês.", [
            wiki("Publicidade", "Como um anúncio persuade.", 15),
            atividade("Anúncio em inglês", "Ache um anúncio em inglês e responda: quem é o público? O que quer vender? Que recursos usa (imagem, slogan, humor)?", 30)
        ], [
            ["O que é um slogan?", "Frase curta e marcante que resume a ideia de uma marca."],
            ["O que revela o público-alvo de um texto?", "A linguagem, o tema e os valores a que o texto apela."],
            ["O que é um texto persuasivo?", "O que tenta convencer o leitor de algo ou levá-lo a agir."]
        ]),
        sessao("Simulado de inglês", "Treinar com 5 questões e analisar os erros.", [
            INEP_PROVAS,
            atividade("5 questões, 30 minutos", "Resolva 5 questões de línguas de uma prova antiga em 30 minutos. Para cada erro, anote: palavra que faltou, conectivo que enganou ou tempo verbal. Monte uma lista pra revisar.", 45)
        ], [
            ["Qual o melhor jeito de aprender com um erro?", "Descobrir a causa exata (vocabulário, estrutura ou leitura) e treinar aquele ponto."],
            ["Devo ler as alternativas antes do texto?", "Não é o ideal: leia o texto e entenda a ideia antes, pra não se influenciar."],
            ["Quantas questões de língua estrangeira tem o ENEM?", "Cinco, em inglês ou espanhol, à escolha do candidato."]
        ])
    ]),

    plano("enem-atualidades", "📰", AREA, "Iniciante", "Os temas que mais rendem como repertório: tecnologia, meio ambiente, saúde, direitos e democracia.", "Atualidades e temas de redação", "Wikipédia", [
        sessao("Tecnologia, redes e inteligência artificial", "Entender impactos e debates da era digital.", [
            wiki("Inteligência artificial", "O que é e como é usada.", 25),
            wiki("Desinformação", "Fake news e como combatê-las.", 20),
            atividade("Prós e contras", "Faça duas colunas sobre IA e redes sociais: benefícios e riscos (emprego, privacidade, desinformação). Escreva a sua tese em uma frase.", 30)
        ], [
            ["O que é desinformação?", "Informação falsa ou enganosa espalhada, intencionalmente ou não, que prejudica o debate público."],
            ["O que é a LGPD?", "A Lei Geral de Proteção de Dados, que protege os dados pessoais dos cidadãos."],
            ["Como checar uma notícia?", "Ver a fonte, a data, se outros veículos confiáveis noticiaram e usar agências de checagem."]
        ]),
        sessao("Meio ambiente e mudanças climáticas", "Reunir dados e propostas sobre clima e biodiversidade.", [
            wiki("Mudanças climáticas", "Causas, impactos e acordos.", 25),
            wiki("Acordo de Paris", "A meta global de limitar o aquecimento.", 20),
            atividade("Proposta ambiental", "Escreva uma proposta de intervenção pro desmatamento, com agente, ação, meio, finalidade e detalhamento.", 30)
        ], [
            ["Qual a meta principal do Acordo de Paris?", "Manter o aquecimento global bem abaixo de 2 °C, buscando 1,5 °C."],
            ["O que é a Amazônia pro clima?", "Uma grande reguladora de chuvas e estoque de carbono, importante pro equilíbrio climático."],
            ["O que é a pegada de carbono?", "A quantidade de gases de efeito estufa emitida por uma pessoa, produto ou atividade."]
        ]),
        sessao("Saúde pública e saúde mental", "Conhecer o SUS e os desafios de saúde da população.", [
            wiki("Sistema Único de Saúde", "Princípios e funcionamento.", 25),
            wiki("Saúde mental", "Desafios e cuidado.", 20),
            atividade("O SUS e você", "Liste 5 serviços do SUS que você ou sua família já usaram (vacina, UBS, SAMU, farmácia popular). Que problema do SUS você proporia resolver?", 30)
        ], [
            ["Quais os princípios do SUS?", "Universalidade, integralidade e equidade."],
            ["O que é o SAMU?", "O Serviço de Atendimento Móvel de Urgência, pelo telefone 192."],
            ["Por que cuidar da saúde mental é questão pública?", "Porque afeta a vida, o trabalho e a sociedade, e precisa de acesso a cuidado."]
        ]),
        sessao("Desigualdade, racismo e gênero", "Argumentar com dados e conceitos sobre desigualdades.", [
            wiki("Racismo estrutural", "Como o racismo se organiza nas instituições.", 20, "Racismo no Brasil"),
            wiki("Igualdade de gênero", "Direitos e desafios.", 20),
            atividade("Dados que sustentam", "Procure 3 dados (IBGE, IPEA, ONU) sobre desigualdade racial, de gênero ou de renda e escreva como cada um serviria num argumento.", 35)
        ], [
            ["O que é racismo estrutural?", "A discriminação que está embutida nas normas e instituições, não só em atos individuais."],
            ["Quando o voto feminino foi garantido no Brasil?", "Em 1932, no Código Eleitoral."],
            ["O que é a Lei Maria da Penha?", "Lei de 2006 que cria mecanismos pra coibir a violência doméstica contra a mulher."]
        ]),
        sessao("Democracia, política e participação", "Entender como funciona o Estado e o papel do cidadão.", [
            wiki("Democracia", "Formas de governo e participação.", 20),
            wiki("Separação de poderes", "Executivo, Legislativo e Judiciário.", 20),
            atividade("Quem faz o quê?", "Diga quem é responsável por: aprovar uma lei, sancioná-la, julgar se ela é constitucional e fiscalizar o dinheiro público. Cite um exemplo atual.", 30)
        ], [
            ["Quais são os três poderes?", "Executivo (executa), Legislativo (faz as leis) e Judiciário (julga)."],
            ["Voto é obrigatório no Brasil?", "Sim, entre 18 e 70 anos; é facultativo de 16 a 17, acima de 70 e para analfabetos."],
            ["O que é um plebiscito?", "Consulta popular feita antes de uma lei ou decisão ser tomada."]
        ]),
        sessao("Trabalho, educação e economia", "Entender o mercado de trabalho e a educação pública.", [
            wiki("Desemprego", "Tipos e causas.", 20),
            wiki("Educação no Brasil", "Desafios e avanços.", 20),
            atividade("Montando repertório", "Faça um mapa mental ligando os temas desta trilha (tecnologia, ambiente, saúde, desigualdade, democracia, trabalho) a pelo menos um dado ou autor de cada. Esse mapa é seu banco de repertório.", 40)
        ], [
            ["O que é informalidade no trabalho?", "Trabalho sem carteira assinada e sem direitos trabalhistas garantidos."],
            ["Qual o papel da educação no desenvolvimento?", "Aumenta a renda, reduz desigualdades e fortalece a cidadania."],
            ["O que é inflação?", "O aumento generalizado e contínuo dos preços, que reduz o poder de compra."]
        ])
    ])

];
