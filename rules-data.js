/* Dados das regras de Chamado de Cthulhu 7e: perícias, ocupações, origens. Sem acesso ao DOM. */
const MAXA=90,MAXS=75; /* limites dos valores aleatórios: atributo e perícia */
/* perícias comuns usadas em "qualquer outra" e nos interesses pessoais, para evitar sorteios sem sentido */
const COMMON=['Encontrar','Escutar','Psicologia','Furtividade','Primeiros Socorros','Dirigir Auto','Usar Computadores','Eletrônica','Usar Biblioteca','Lutar (Brigar)','Esquivar','Persuasão','Lábia','Charme','Intimidação','História','Ocultismo','Armas de Fogo (Pistolas)','Natação','Escalar','Consertos Mecânicos','Mundo Natural','Avaliação','Saltar','Arremessar','Navegação','Chaveiro','Cavalgar'];
const LANGS=['Latim','Francês','Alemão','Italiano','Árabe','Grego'];
const SOC=['Charme','Lábia','Persuasão','Intimidação'];
const NF=['Edith','Dorothy','Mabel','Harriet','Clara','Eleanor','Agnes','Beatrice','Florence','Louise'];
const NM=['Arthur','Walter','Harold','Edmund','Henry','Frank','Albert','Raymond','Theodore','Victor'];
const SN=['Whitlock','Crane','Ashford','Bellamy','Hartwell','Kendrick','Dunmore','Sinclair','Prescott','Blackwood'];
const BASE={'Ciência (Química)':1,'Ciência (Geologia)':1,'Ciência (Botânica)':1,'Ciência (Zoologia)':1,'Ciência (Matemática)':1,'Ciência (Meteorologia)':1,'Ciência (Ciência Forense)':1,'Arte/Ofício (Escultura)':5,'Arte/Ofício (Desenho)':5,'Arte/Ofício (Piano)':5,'Arte/Ofício (Violino)':5,'Arte/Ofício (Canto)':5,'Arte/Ofício (Violão)':5,'Arte/Ofício (Saxofone)':5,'Antropologia':1,'Armas de Fogo (Pistolas)':20,'Armas de Fogo (Rifles)':25,'Arqueologia':1,'Arremessar':20,'Arte/Ofício (Pintura)':5,'Arte/Ofício (Fotografia)':5,'Avaliação':5,'Cavalgar':5,'Charme':15,'Chaveiro':1,'Ciência (Biologia)':1,'Ciência (Farmácia)':1,'Ciência (Astronomia)':1,'Consertos Elétricos':10,'Consertos Mecânicos':10,'Contabilidade':5,'Direito':5,'Dirigir Auto':20,'Disfarce':5,'Encontrar':25,'Usar Computadores':5,'Escutar':20,'Escalar':20,'Esquivar':0,'Eletrônica':1,'Lábia':5,'Intimidação':15,'História':5,'Furtividade':20,'Lutar (Brigar)':25,'Medicina':1,'Mundo Natural':10,'Natação':20,'Navegação':10,'Ocultismo':5,'Operar Maquinário':1,'Persuasão':10,'Pilotar (Barcos)':1,'Prestidigitação':10,'Primeiros Socorros':30,'Psicanálise':1,'Psicologia':10,'Saltar':20,'Rastrear':10,'Sobrevivência':10,'Usar Biblioteca':20,'Arte/Ofício (Literatura)':5,'Arte/Ofício (Instrumento)':5,'Arte/Ofício (Atuar)':5,'Arte/Ofício (Desenho Técnico)':5,'Arte/Ofício (Trabalhos de Fazenda)':5,'Ciência (Engenharia)':1,'Ciência (Física)':1,'Operar Maquinário Pesado':1,'Pilotar (Aeronaves)':1,'Nível de Crédito':0};
const E4='EDU*4',ED='EDU*2+DES*2|EDU*2+FOR*2',ART='Arte/Ofício (Pintura)|Arte/Ofício (Fotografia)|Arte/Ofício (Literatura)|Arte/Ofício (Instrumento)|Arte/Ofício (Atuar)',PF='Armas de Fogo (Pistolas)|Armas de Fogo (Rifles)',CR='Armas de Fogo (Pistolas)|Avaliação|Chaveiro|Consertos Mecânicos|Disfarce|Lutar (Brigar)|Prestidigitação';
/* n=nome, p=pontos (use | para alternativas, vale a maior), c=faixa de Crédito, s=perícias. Em s: A|B = sorteia uma; @soc = perícia social; @lang = língua; @any = qualquer outra (das COMMON); prefixo ! = perícia principal, recebe mais pontos */
const OCC=[
{n:'Advogado',p:E4,c:[30,80],s:['Contabilidade','!Direito','@soc','@soc','!Psicologia','Usar Biblioteca','@any','@any']},
{n:'Andarilho',p:'EDU*2+APA*2|EDU*2+DES*2|EDU*2+FOR*2',c:[0,5],s:['Escalar','!Escutar','!Furtividade','@soc','Navegação','Saltar','@any','@any']},
{n:'Antiquário',p:E4,c:[30,70],s:[ART,'!Avaliação','Encontrar','!História','@soc','@lang','Usar Biblioteca','@any']},
{n:'Arqueólogo',p:E4,c:[10,40],s:['!Arqueologia','Avaliação','!História','@lang','Usar Biblioteca','Encontrar','Navegação','Consertos Mecânicos']},
{n:'Artista',p:'EDU*2+POD*2|EDU*2+DES*2',c:[9,50],s:['!'+ART,'Encontrar','História|Mundo Natural','@soc','@lang','Psicologia','@any','@any']},
{n:'Atleta',p:'EDU*2+DES*2|EDU*2+FOR*2',c:[9,70],s:['Arremessar','Cavalgar','!Escalar','@soc','Lutar (Brigar)','!Natação','!Saltar','@any']},
{n:'Autor',p:E4,c:[9,30],s:['!Arte/Ofício (Literatura)','História','!Língua Natural','Mundo Natural|Ocultismo','@lang','Psicologia','Usar Biblioteca','@any']},
{n:'Bibliotecário',p:E4,c:[9,35],s:['Contabilidade','Língua Natural','@lang','!Usar Biblioteca','@any','@any','@any','@any']},
{n:'Clero, Membro do',p:E4,c:[9,60],s:['Contabilidade','Escutar','História','!@soc','@lang','!Psicologia','Usar Biblioteca','@any']},
{n:'Criminoso',p:ED,c:[5,65],s:['!Encontrar','!Furtividade','@soc','Psicologia',CR,CR,CR,CR]},
{n:'Detetive Particular',p:ED,c:[9,30],s:['Arte/Ofício (Fotografia)','Direito','Disfarce','!Encontrar','@soc','!Psicologia','Usar Biblioteca','@any']},
{n:'Diletante',p:'EDU*2+APA*2',c:[50,99],s:[PF,ART,'!Cavalgar','!@soc','@lang','@any','@any','@any']},
{n:'Engenheiro',p:E4,c:[30,60],s:['!Arte/Ofício (Desenho Técnico)','Consertos Elétricos','!Ciência (Engenharia)','Ciência (Física)','Consertos Mecânicos','Operar Maquinário Pesado','Usar Biblioteca','@any']},
{n:'Fanático',p:'EDU*2+APA*2|EDU*2+POD*2',c:[0,30],s:['Furtividade','História','!@soc','@soc','!Psicologia','@any','@any','@any']},
{n:'Fazendeiro',p:ED,c:[9,30],s:['!Arte/Ofício (Trabalhos de Fazenda)','Consertos Mecânicos','Dirigir Auto','@soc','!Mundo Natural','Operar Maquinário Pesado','Rastrear','@any']},
{n:'Investigador de Polícia',p:ED,c:[20,50],s:['Arte/Ofício (Atuar)|Disfarce','!Armas de Fogo (Pistolas)','Direito','Escutar','@soc','!Psicologia','!Encontrar','@any']},
{n:'Jornalista',p:E4,c:[9,30],s:['Arte/Ofício (Fotografia)','História','!Usar Biblioteca','Língua Natural','@soc','!Psicologia','Encontrar|Escutar','@any']},
{n:'Médico',p:E4,c:[30,80],s:['Ciência (Biologia)','Ciência (Farmácia)','!Medicina','Língua (Latim)','!Primeiros Socorros','Psicologia','@any','@any']},
{n:'Membro de Tribo',p:ED,c:[0,15],s:['Arremessar|Lutar (Brigar)','Encontrar','Escalar','Escutar','!Mundo Natural','Natação','Ocultismo','!Sobrevivência']},
{n:'Hacker [Moderna]',p:E4,c:[10,70],s:['!Consertos Elétricos','!Eletrônica','!Encontrar','@soc','!Usar Computadores','Usar Biblioteca','@any','@any']},
{n:'Missionário',p:E4,c:[0,30],s:[ART,'Consertos Mecânicos','!@soc','Medicina','Mundo Natural','!Primeiros Socorros','@any','@any']},
{n:'Músico',p:'EDU*2+DES*2|EDU*2+POD*2',c:[9,30],s:['!Arte/Ofício (Instrumento)','!Escutar','@soc','Psicologia','@any','@any','@any','@any']},
{n:'Oficial de Polícia',p:ED,c:[9,30],s:['!Armas de Fogo (Pistolas)','Direito','!Encontrar','@soc','!Lutar (Brigar)','Primeiros Socorros','Psicologia','Dirigir Auto|Cavalgar']},
{n:'Oficial Militar',p:ED,c:[20,70],s:['!Armas de Fogo (Pistolas)','Armas de Fogo (Rifles)|Lutar (Brigar)','Navegação','!@soc','@soc','Psicologia','Sobrevivência','Contabilidade|Esquivar']},
{n:'Ocultista',p:E4,c:[9,65],s:['!Antropologia','História','Usar Biblioteca','!Ocultismo','@lang','Ciência (Astronomia)','Persuasão','@any']},
{n:'Parapsicólogo',p:E4,c:[9,30],s:['Antropologia','Arte/Ofício (Fotografia)','História','!Usar Biblioteca','!Ocultismo','@lang','Psicologia','@any']},
{n:'Piloto',p:'EDU*2+DES*2',c:[20,70],s:['Consertos Elétricos','Consertos Mecânicos','!Navegação','Operar Maquinário Pesado','!Pilotar (Aeronaves)','Ciência (Astronomia)','@any','@any']},
{n:'Professor',p:E4,c:[20,70],s:['Língua Natural','!@lang','Psicologia','!Usar Biblioteca','@any','@any','@any','@any']},
{n:'Profissional de Entretenimento',p:'EDU*2+APA*2',c:[9,70],s:['!Arte/Ofício (Atuar)','Disfarce','Escutar','!@soc','@soc','Psicologia','@any','@any']},
{n:'Soldado',p:ED,c:[9,30],s:['!Armas de Fogo (Rifles)','Escalar|Natação','!Esquivar','Furtividade','!Lutar (Brigar)','Sobrevivência','Armas de Fogo (Pistolas)|Primeiros Socorros','Consertos Mecânicos|Primeiros Socorros|@lang']},
{n:'Cientista',p:E4,c:[9,50],s:['!Ciência (Biologia)|Ciência (Física)','!Ciência (Farmácia)|Ciência (Astronomia)','Ciência (Engenharia)','@lang','Usar Biblioteca','Psicologia','Encontrar','@any']},
{n:'Contador',p:E4,c:[30,70],s:['!Contabilidade','!Direito','Avaliação','Usar Biblioteca','Escutar','Persuasão|Lábia','Psicologia','@any']},
{n:'Enfermeiro',p:E4,c:[9,30],s:['!Primeiros Socorros','Escutar','!Medicina','Psicologia','Ciência (Biologia)','Ciência (Farmácia)','@soc','@any']},
{n:'Espião',p:ED,c:[20,60],s:['!Disfarce','!Furtividade','Escutar','Lábia','@lang','!Armas de Fogo (Pistolas)','Psicologia','Encontrar']},
{n:'Estudante',p:E4,c:[5,10],s:['!Usar Biblioteca','@lang','Psicologia','História','@any','@any','@any','@any']},
{n:'Explorador',p:ED,c:[9,60],s:['Escalar','!Navegação','!Sobrevivência','Natação','Rastrear','Mundo Natural','Primeiros Socorros','@lang']},
{n:'Fotógrafo',p:'EDU*2+DES*2|EDU*2+POD*2',c:[9,30],s:['!Arte/Ofício (Fotografia)','!Encontrar','Furtividade','Psicologia','@soc','Consertos Elétricos','Usar Biblioteca','@any']},
{n:'Guarda-caça',p:ED,c:[9,30],s:['!Armas de Fogo (Rifles)','!Rastrear','Furtividade','Sobrevivência','Mundo Natural','Escalar','Escutar','Primeiros Socorros']},
{n:'Marinheiro',p:ED,c:[9,30],s:['!Pilotar (Barcos)','!Navegação','Natação','Escalar','Consertos Mecânicos','Primeiros Socorros','Lutar (Brigar)','@any']},
{n:'Mecânico',p:ED,c:[9,30],s:['!Consertos Mecânicos','!Consertos Elétricos','Dirigir Auto','Operar Maquinário','Operar Maquinário Pesado','Escalar','Encontrar','Avaliação']},
{n:'Mordomo',p:'EDU*2+APA*2',c:[9,40],s:['Contabilidade','!Escutar','!Encontrar','Psicologia','@soc','Primeiros Socorros','Furtividade','@any']},
{n:'Motorista',p:ED,c:[9,30],s:['!Dirigir Auto','!Consertos Mecânicos','Escutar','Navegação','@soc','Encontrar','Primeiros Socorros','@any']},
{n:'Operário',p:ED,c:[9,30],s:['!Consertos Mecânicos','Consertos Elétricos','!Operar Maquinário Pesado','Escalar','Arremessar','Primeiros Socorros','Encontrar','@any']},
{n:'Político',p:'EDU*2+APA*2',c:[50,90],s:['!Charme','Intimidação','!Persuasão','!Lábia','História','Psicologia','Direito','Usar Biblioteca']},
{n:'Contrabandista',p:ED,c:[5,50],s:['!Dirigir Auto|Pilotar (Barcos)','!Furtividade','Lábia','Avaliação','Encontrar','Escutar','Armas de Fogo (Pistolas)','@any']},
{n:'Alienista (Psiquiatra)',p:E4,c:[30,80],s:['!Psicanálise','!Psicologia','Medicina','Ciência (Biologia)','Língua (Latim)','Escutar','Persuasão','Usar Biblioteca']},
{n:'Barman',p:'EDU*2+APA*2',c:[5,25],s:['Contabilidade','!Escutar','!Psicologia','@soc','@soc','Lutar (Brigar)','Encontrar','@any']},
{n:'Bombeiro',p:ED,c:[9,30],s:['!Escalar','Saltar','!Primeiros Socorros','Consertos Mecânicos','Dirigir Auto','Operar Maquinário Pesado','Arremessar','Esquivar']},
{n:'Caçador',p:ED,c:[9,30],s:['!Armas de Fogo (Rifles)','!Rastrear','Furtividade','Sobrevivência','Mundo Natural','Escutar','Primeiros Socorros','Encontrar']},
{n:'Guarda-costas',p:ED,c:[9,40],s:['!Lutar (Brigar)','Intimidação','!Armas de Fogo (Pistolas)','Escutar','Dirigir Auto','Primeiros Socorros','Psicologia','Esquivar']}
];
OCC.sort((a,b)=>a.n.localeCompare(b.n,'pt'));
/* ocupações secundárias: n=nome, s=perícias que ganham parte dos pontos de interesse */
/* ! = perícia principal da ocupação secundária (sempre recebe a maior parte dos pontos de interesse) */
const SEC=[
{n:'Fotógrafo',s:['!Arte/Ofício (Fotografia)','!Encontrar','Furtividade','Escalar']},
{n:'Mecânico de Carros',s:['!Consertos Mecânicos','Consertos Elétricos','!Dirigir Auto','Operar Maquinário']},
{n:'Lutador',s:['!Lutar (Brigar)','!Esquivar','Intimidação','Primeiros Socorros']},
{n:'Médico de Guerra',s:['!Primeiros Socorros','!Medicina',PF,'Sobrevivência']},
{n:'Médico',s:['!Medicina','!Primeiros Socorros','Ciência (Biologia)','Psicologia']},
{n:'Enfermeiro',s:['!Primeiros Socorros','Medicina','Psicologia','Escutar']},
{n:'Soldado',s:['!'+PF,'!Lutar (Brigar)','Furtividade','Sobrevivência']},
{n:'Detetive Amador',s:['!Encontrar','!Psicologia','Escutar','Usar Biblioteca']},
{n:'Jornalista Freelancer',s:['!Usar Biblioteca','Persuasão','Escutar','Arte/Ofício (Fotografia)']},
{n:'Motorista',s:['!Dirigir Auto','Consertos Mecânicos','Navegação','Escutar']},
{n:'Caçador',s:['!Armas de Fogo (Rifles)','!Rastrear','Furtividade','Mundo Natural']},
{n:'Marinheiro',s:['!Pilotar (Barcos)','Natação','!Navegação','Consertos Mecânicos']},
{n:'Ladrão de Casas',s:['!Chaveiro','!Furtividade','Prestidigitação','Escalar']},
{n:'Contrabandista',s:['!Dirigir Auto|Pilotar (Barcos)','Furtividade','Lábia','Avaliação']},
{n:'Jogador de Cartas',s:['!Prestidigitação','!Psicologia','Lábia','Contabilidade']},
{n:'Estudante de Ocultismo',s:['!Ocultismo','Usar Biblioteca','@lang','Antropologia']},
{n:'Cavaleiro',s:['!Cavalgar','Mundo Natural','Rastrear','Saltar']},
{n:'Pintor Amador',s:['!Arte/Ofício (Pintura)','Encontrar','Avaliação','História']},
{n:'Espião',s:['!Disfarce','!Furtividade','@lang','Escutar']},
{n:'Guarda-costas',s:['!Lutar (Brigar)','Intimidação','!Armas de Fogo (Pistolas)','Escutar']},
{n:'Contador',s:['!Contabilidade','Direito','Usar Biblioteca','Persuasão']},
{n:'Eletricista',s:['!Consertos Elétricos','Operar Maquinário','Escalar','Contabilidade']}
];
/* Especializações: cada ocupação pode ter uma sub-lista. "at" são as posições das perícias da ocupação que são trocadas pelas da opção escolhida (! = perícia principal) */
const SUB={
  'Cientista':{lbl:'Área de pesquisa',at:[0,1,2],o:{'Biologia':['!Ciência (Biologia)','!Ciência (Botânica)','Ciência (Zoologia)'],'Química':['!Ciência (Química)','!Ciência (Farmácia)','Ciência (Física)'],'Física':['!Ciência (Física)','!Ciência (Matemática)','Ciência (Engenharia)'],'Astronomia':['!Ciência (Astronomia)','!Ciência (Matemática)','Ciência (Física)'],'Geologia':['!Ciência (Geologia)','!Ciência (Química)','Ciência (Meteorologia)'],'Farmácia':['!Ciência (Farmácia)','!Ciência (Química)','Ciência (Biologia)'],'Zoologia':['!Ciência (Zoologia)','!Ciência (Biologia)','Mundo Natural'],'Ciência Forense':['!Ciência (Ciência Forense)','!Ciência (Química)','Ciência (Biologia)'],'Matemática':['!Ciência (Matemática)','!Ciência (Física)','Contabilidade'],'Meteorologia':['!Ciência (Meteorologia)','!Ciência (Física)','Ciência (Matemática)']},crMod:{'Ciência Forense':10,'Matemática':10}},
  'Estudante':{lbl:'Área de estudo',at:[3,4,5],o:{'Humanas':['!História','!Antropologia','Arqueologia'],'Ciências Naturais':['!Ciência (Biologia)','!Ciência (Química)','Ciência (Física)'],'Exatas e Engenharia':['!Ciência (Matemática)','!Ciência (Física)','Ciência (Engenharia)'],'Medicina e Saúde':['!Medicina','!Primeiros Socorros','Ciência (Biologia)'],'Direito':['!Direito','!Persuasão','Contabilidade'],'Letras':['!Arte/Ofício (Literatura)','!Língua (Latim)','História'],'Artes':['!Arte/Ofício (Pintura)','!Arte/Ofício (Escultura)','História'],'Ocultismo e Folclore':['!Ocultismo','!Antropologia','História']}},
  'Professor':{lbl:'Matéria',at:[4,5],o:{'História':['!História','Antropologia'],'Ciências':['!Ciência (Física)','!Ciência (Biologia)'],'Letras':['!Arte/Ofício (Literatura)','História'],'Matemática':['!Ciência (Matemática)','Contabilidade'],'Ocultismo e Folclore':['!Ocultismo','Antropologia']}},
  'Artista':{lbl:'Arte',at:[0],o:{'Pintura':['!Arte/Ofício (Pintura)'],'Escultura':['!Arte/Ofício (Escultura)'],'Desenho':['!Arte/Ofício (Desenho)'],'Fotografia':['!Arte/Ofício (Fotografia)'],'Poesia e Literatura':['!Arte/Ofício (Literatura)'],'Teatro':['!Arte/Ofício (Atuar)']},crMod:{'Pintura':10,'Escultura':10,'Teatro':10}},
  'Músico':{lbl:'Instrumento',at:[0],o:{'Piano':['!Arte/Ofício (Piano)'],'Violino':['!Arte/Ofício (Violino)'],'Canto':['!Arte/Ofício (Canto)'],'Violão':['!Arte/Ofício (Violão)'],'Saxofone':['!Arte/Ofício (Saxofone)']},crMod:{'Piano':10,'Violino':10}},
  'Médico':{lbl:'Especialidade',at:[0,1,5],o:{'Clínico geral':['Ciência (Biologia)','Ciência (Farmácia)','Psicologia'],'Cirurgião':['!Ciência (Biologia)','Encontrar','Escutar'],'Psiquiatra':['!Psicologia','Ciência (Biologia)','!Psicanálise'],'Legista / Patologista':['!Ciência (Biologia)','!Ciência (Ciência Forense)','Ciência (Farmácia)'],'Médico militar':['Ciência (Biologia)','Sobrevivência','!Armas de Fogo (Pistolas)']},crMod:{'Clínico geral':10,'Cirurgião':10}},
  'Engenheiro':{lbl:'Especialidade',at:[1,3,4,5],o:{'Mecânico':['Consertos Elétricos','Ciência (Física)','!Consertos Mecânicos','Operar Maquinário Pesado'],'Elétrico':['!Consertos Elétricos','Ciência (Física)','Consertos Mecânicos','Operar Maquinário'],'Civil':['Navegação','Ciência (Geologia)','Consertos Mecânicos','!Operar Maquinário Pesado'],'Químico':['Consertos Elétricos','!Ciência (Química)','Consertos Mecânicos','Operar Maquinário Pesado'],'Naval':['Consertos Mecânicos','Ciência (Física)','!Pilotar (Barcos)','Navegação'],'Aeronáutico':['Consertos Mecânicos','Ciência (Física)','!Pilotar (Aeronaves)','Consertos Elétricos']},crMod:{'Civil':10,'Naval':10,'Aeronáutico':10}},
  'Soldado':{lbl:'Função',at:[0,4,5],o:{'Infantaria':['!Armas de Fogo (Rifles)','!Lutar (Brigar)','Sobrevivência'],'Atirador de elite':['!Armas de Fogo (Rifles)','Escutar','!Encontrar'],'Cavalaria':['!Armas de Fogo (Rifles)','!Cavalgar','Sobrevivência'],'Médico de campo':['Armas de Fogo (Pistolas)','!Primeiros Socorros','!Medicina'],'Sapador':['Armas de Fogo (Rifles)','Consertos Mecânicos','!Operar Maquinário Pesado'],'Aviador':['Armas de Fogo (Pistolas)','!Pilotar (Aeronaves)','Navegação']},crMod:{'Atirador de elite':10,'Cavalaria':10,'Aviador':10}},
  'Criminoso':{lbl:'Tipo de criminoso',at:[0,1,4,5],o:{'Ladrão':['Encontrar','!Furtividade','!Chaveiro','Prestidigitação'],'Assaltante':['!Armas de Fogo (Pistolas)','!Intimidação','Lutar (Brigar)','Dirigir Auto'],'Falsário / Golpista':['!Lábia','!Disfarce','Avaliação','Prestidigitação'],'Brigão':['!Lutar (Brigar)','!Intimidação','Esquivar','Armas de Fogo (Pistolas)'],'Batedor de carteiras':['!Prestidigitação','!Furtividade','Encontrar','Disfarce']},crMod:{'Ladrão':10,'Falsário / Golpista':10}},
  'Atleta':{lbl:'Esporte',at:[2,4,5,6],o:{'Nadador':['Escalar','Lutar (Brigar)','!Natação','Saltar'],'Boxeador':['Escalar','!Lutar (Brigar)','!Esquivar','Saltar'],'Corredor':['Escalar','!Esquivar','Natação','!Saltar'],'Alpinista':['!Escalar','Lutar (Brigar)','Natação','!Saltar']},crMod:{'Boxeador':10}}
};
/* Histórico / origem: algumas ocupações perguntam de onde o personagem veio. Cada opção dá +10 em 2 perícias e escreve o início do backstory. "pool" = perícias oferecidas na opção "outro (escrever)" */
const WARS=[
 {id:'esp',n:'Guerra Hispano-Americana (1898)',sk:['Cavalgar','Armas de Fogo (Rifles)'],t:'Lutou em Cuba e nas Filipinas e voltou com histórias que poucos acreditam.'},
 {id:'mex',n:'Revolução Mexicana / Guerra da Fronteira',sk:['Cavalgar','Sobrevivência'],t:'Patrulhou a fronteira entre balas, poeira e bandidos.'},
 {id:'ww1',n:'Primeira Guerra Mundial (1914–1918)',sk:['Armas de Fogo (Rifles)','Sobrevivência'],t:'Sobreviveu às trincheiras da Grande Guerra e ainda ouve os canhões à noite.'},
 {id:'rus',n:'Intervenção na Rússia (1918–1920)',sk:['Sobrevivência','Escutar'],t:'Marchou pelo gelo russo numa guerra que o mundo preferiu esquecer.'},
 {id:'ww2',n:'Segunda Guerra Mundial (1939–1945)',sk:['Armas de Fogo (Rifles)','Esquivar'],t:'Atravessou a guerra mais sangrenta da história e voltou outra pessoa.'},
 {id:'cor',n:'Guerra da Coreia (1950–1953)',sk:['Sobrevivência','Armas de Fogo (Rifles)'],t:'Viveu o inverno brutal da Coreia, onde o frio matava tanto quanto o inimigo.'},
 {id:'fria',n:'Guerra Fria',sk:['Escutar','Encontrar'],t:'Serviu em postos de vigilância e operações que nunca constaram em relatório algum.'},
 {id:'vie',n:'Guerra do Vietnã',sk:['Sobrevivência','Furtividade'],t:'Patrulhou selvas onde cada passo podia ser o último.'},
 {id:'gol',n:'Guerra do Golfo (1990–1991)',sk:['Dirigir Auto','Armas de Fogo (Rifles)'],t:'Cruzou o deserto numa guerra curta, mas que deixou marcas longas.'}];
const WAR_POOL=['Armas de Fogo (Rifles)','Armas de Fogo (Pistolas)','Lutar (Brigar)','Sobrevivência','Furtividade','Primeiros Socorros','Escalar','Natação','Cavalgar','Dirigir Auto','Navegação','Consertos Mecânicos','Esquivar','Escutar','Encontrar'];
const UNIS=[
  {id:'mis',n:'Universidade Miskatonic (Arkham)',sk:['Ocultismo','Usar Biblioteca'],t:'Passou pelos corredores de Miskatonic, onde o conhecimento proibido espreita nas estantes da biblioteca.',crMod:10},
  {id:'har',n:'Universidade de Harvard',sk:['Usar Biblioteca','Direito'],t:'Ligado a Harvard, entre bibliotecas imponentes e velhas famílias de Boston.',crMod:10},
  {id:'bos',n:'Universidade de Boston',sk:['História','Persuasão'],t:'Construiu sua vida acadêmica nas salas movimentadas de Boston.'},
  {id:'yal',n:'Universidade de Yale',sk:['História','Língua (Latim)'],t:'Passou por Yale, onde sociedades secretas sussurram atrás de portas fechadas.',crMod:10},
  {id:'col',n:'Universidade Columbia (Nova York)',sk:['Psicologia','Ciência (Matemática)'],t:'Estudou em Nova York, entre o ritmo da cidade e as ideias novas do século.',crMod:10},
  {id:'oxf',n:'Universidade de Oxford',sk:['Língua (Latim)','História'],t:'Formou-se em Oxford, cercado de tradição, latim e colégios centenários.',crMod:10},
  {id:'cam',n:'Universidade de Cambridge',sk:['Ciência (Matemática)','Ciência (Física)'],t:'Passou por Cambridge, onde números e teoremas parecem esconder algo a mais.',crMod:10},
  {id:'sor',n:'Sorbonne (Paris)',sk:['Arte/Ofício (Literatura)','Antropologia'],t:'Viveu em Paris e na Sorbonne, entre cafés, filósofos e viajantes de todo o mundo.',crMod:10}];
const UNI_POOL=['História','Antropologia','Arqueologia','Ocultismo','Usar Biblioteca','Direito','Medicina','Psicologia','Ciência (Biologia)','Ciência (Física)','Ciência (Química)','Ciência (Matemática)','Arte/Ofício (Literatura)','Língua (Latim)','Contabilidade'];
const POLICE={q:'Em que cidade você serve (ou serviu)?',kind:'Cidade',o:[
 {id:'ark',n:'Arkham',sk:['Escutar','História'],t:'Patrulhou as ruas estreitas de Arkham, onde todos sabem de tudo e ninguém diz nada.'},
 {id:'bos',n:'Boston',sk:['Intimidação','Lutar (Brigar)'],t:'Aprendeu o ofício nas ruas duras de Boston.'},
 {id:'nyc',n:'Nova York',sk:['Armas de Fogo (Pistolas)','Psicologia'],t:'Serviu em Nova York, uma cidade que nunca dorme e raramente perdoa.'},
 {id:'chi',n:'Chicago',sk:['Intimidação','Dirigir Auto'],t:'Viu o crime organizado de perto nas ruas de Chicago.'},
 {id:'sf',n:'São Francisco',sk:['Persuasão','Encontrar'],t:'Trabalhou entre os cais, as brumas e os bairros misteriosos de São Francisco.'},
 {id:'lon',n:'Scotland Yard (Londres)',sk:['Direito','Encontrar'],t:'Passou pela Scotland Yard, entre névoa e casos que não fecham.'}],
 pool:['Direito','Lutar (Brigar)','Armas de Fogo (Pistolas)','Encontrar','Escutar','Psicologia','Intimidação','Persuasão','Dirigir Auto','Furtividade','Primeiros Socorros']};
const BG={
 'Soldado':{q:'Em que conflito você serviu?',kind:'Conflito',o:WARS,pool:WAR_POOL},
 'Oficial Militar':{q:'Em que conflito você serviu?',kind:'Conflito',o:WARS,pool:WAR_POOL},
 'Professor':{q:'Em que universidade você leciona (ou lecionou)?',kind:'Universidade',o:UNIS,pool:UNI_POOL},
 'Estudante':{q:'Em que universidade você estuda?',kind:'Universidade',o:UNIS,pool:UNI_POOL},
 'Médico':{q:'Onde você se formou ou trabalhou?',kind:'Formação / hospital',o:[
  {id:'ark',n:'Sanatório e hospital de Arkham',sk:['Psicologia','Psicanálise'],t:'Atendeu em Arkham, onde certos pacientes dizem coisas que ninguém deveria ouvir.'},
  {id:'jh',n:'Johns Hopkins (Baltimore)',sk:['Medicina','Ciência (Biologia)'],t:'Formou-se em Johns Hopkins, uma das melhores escolas de medicina do país.',crMod:10},
  {id:'hm',n:'Harvard Medical School',sk:['Medicina','Ciência (Farmácia)'],t:'Estudou medicina em Harvard e trouxe de lá um respeito quase religioso pelo método.',crMod:10},
  {id:'mil',n:'Hospital militar',sk:['Primeiros Socorros','Sobrevivência'],t:'Aprendeu a salvar vidas debaixo de fogo, em hospitais de campanha.'},
  {id:'rur',n:'Consultório no interior',sk:['Persuasão','Psicologia'],t:'Cuida de uma cidade pequena, onde todos têm segredos e poucos pagam em dinheiro.',crMod:-10},
  {id:'bel',n:'Hospital Bellevue (Nova York)',sk:['Primeiros Socorros','Psicologia'],t:'Trabalhou em Bellevue, onde viu o pior e o mais estranho que a cidade tem a oferecer.'}],
  pool:['Medicina','Primeiros Socorros','Psicologia','Psicanálise','Ciência (Biologia)','Ciência (Farmácia)','Ciência (Química)','Persuasão','Encontrar','Escutar','Língua (Latim)']},
 'Oficial de Polícia':POLICE,'Investigador de Polícia':POLICE,
 'Detetive Particular':{q:'De onde vem a sua carreira?',kind:'Origem',o:[
   {id:'pk',n:'Agência Pinkerton',sk:['Furtividade','Armas de Fogo (Pistolas)'],t:'Começou na Pinkerton, seguindo suspeitos e aprendendo a não ser visto.',crMod:10},
   {id:'ex',n:'Ex-policial',sk:['Direito','Intimidação'],t:'Deixou o distintivo, mas aproveitou a experiência, os contatos e a estabilidade que conquistou na polícia.',crMod:10},
   {id:'solo',n:'Escritório próprio',sk:['Lábia','Encontrar'],t:'Abriu o próprio escritório e vive de casos pequenos e promessas grandes.'},
  {id:'mil',n:'Ex-militar',sk:['Armas de Fogo (Pistolas)','Sobrevivência'],t:'Trocou a farda pelo sobretudo, mas a disciplina ficou.'},
   {id:'seg',n:'Investigador de seguradora',sk:['Contabilidade','Avaliação'],t:'Passou anos desmascarando fraudes e acidentes suspeitos para uma seguradora.',crMod:10},
  {id:'div',n:'Casos de divórcio e fofocas',sk:['Disfarce','Escutar'],t:'Sabe mais segredos de família do que qualquer padre, e cobra por cada um.'}],
  pool:['Furtividade','Encontrar','Escutar','Disfarce','Lábia','Persuasão','Direito','Psicologia','Armas de Fogo (Pistolas)','Lutar (Brigar)','Dirigir Auto','Avaliação','Contabilidade']},
 'Jornalista':{q:'Para qual jornal você escreve (ou escreveu)?',kind:'Jornal',o:[
  {id:'adv',n:'Arkham Advertiser',sk:['Escutar','Persuasão'],t:'Cobriu os assuntos de Arkham, incluindo os que o editor mandou esquecer.'},
  {id:'glo',n:'Boston Globe',sk:['Usar Biblioteca','Persuasão'],t:'Trabalhou em Boston, atrás de documentos e de fontes que só falam em off.'},
   {id:'nyt',n:'The New York Times',sk:['Usar Biblioteca','Lábia'],t:'Fez carreira em Nova York, onde um furo vale mais do que uma amizade.',crMod:10},
  {id:'chi',n:'Chicago Tribune',sk:['Encontrar','Intimidação'],t:'Cobriu a guerra das gangues em Chicago e nunca mais dormiu direito.'},
   {id:'tab',n:'Tabloide sensacionalista',sk:['Lábia','Arte/Ofício (Fotografia)'],t:'Escreveu para um tabloide que vive de monstros, fantasmas e escândalos.'},
   {id:'cor',n:'Correspondente no exterior',sk:['Sobrevivência','Persuasão'],t:'Enviou reportagens de lugares remotos, nem sempre em segurança.'}],
  pool:['Persuasão','Lábia','Encontrar','Escutar','Psicologia','História','Arte/Ofício (Fotografia)','Direito','Usar Biblioteca','Disfarce']},
 'Clero, Membro do':{q:'A qual igreja ou ordem você pertence?',kind:'Denominação',o:[
  {id:'cat',n:'Igreja Católica',sk:['Língua (Latim)','História'],t:'Foi ordenado na Igreja Católica e conhece de perto seus arquivos e seus segredos.'},
  {id:'bat',n:'Igreja Batista',sk:['Persuasão','Psicologia'],t:'Prega para uma congregação fiel e conhece os problemas de cada família.'},
   {id:'ang',n:'Igreja Anglicana',sk:['História','Usar Biblioteca'],t:'Serve numa paróquia antiga, cheia de registros que quase ninguém lê.',crMod:10},
  {id:'met',n:'Igreja Metodista',sk:['Persuasão','Primeiros Socorros'],t:'Aprendeu a consolar e a cuidar dos doentes de sua comunidade.'},
   {id:'ord',n:'Ordem monástica',sk:['Usar Biblioteca','Ocultismo'],t:'Fez voto de pobreza e passou anos copiando manuscritos num mosteiro, sem acumular patrimônio.',crMod:-10},
   {id:'mis',n:'Missões no exterior',sk:['Sobrevivência','Antropologia'],t:'Levou a fé a terras distantes e voltou com perguntas novas.'}],
  pool:['Psicologia','Persuasão','História','Ocultismo','Língua (Latim)','Primeiros Socorros','Antropologia','Usar Biblioteca','Escutar']},
 'Ocultista':{q:'O que despertou seu interesse pelo oculto?',kind:'Origem',o:[
   {id:'family',n:'Família de ocultistas',sk:['Ocultismo','História'],t:'Cresceu entre símbolos, livros e rituais de família; alguns segredos foram passados como herança.',crMod:10},
  {id:'forbidden',n:'Achado que não devia',sk:['Usar Biblioteca','Ocultismo'],t:'Encontrou um objeto ou manuscrito que abriu uma porta para perguntas que era melhor não fazer.'},
   {id:'society',n:'Sociedade secreta',sk:['Persuasão','Língua (Latim)'],t:'Foi iniciado numa sociedade que estuda aquilo que o mundo prefere tratar como superstição.',crMod:10},
   {id:'survivor',n:'Sobreviveu a um ritual',sk:['Psicologia','Ocultismo'],t:'Sobreviveu a uma cerimônia inexplicável e desde então tenta entender o que aconteceu.'},
  {id:'research',n:'Pesquisa acadêmica',sk:['Antropologia','Usar Biblioteca'],t:'Começou pesquisando crenças antigas, até que as fontes passaram a responder de formas impossíveis.'}],
  pool:['Ocultismo','História','Antropologia','Usar Biblioteca','Psicologia','Língua (Latim)','Ciência (Astronomia)','Persuasão','Encontrar']},
  'Antiquário':{q:'O que despertou seu interesse por antiguidades?',kind:'Origem',o:[
    {id:'wealth',n:'Busca por riquezas',sk:['Avaliação','Encontrar'],t:'Aprendeu a reconhecer peças valiosas e percorre leilões, escavações e espólios atrás da próxima fortuna.'},
    {id:'history',n:'Paixão pela história',sk:['História','Usar Biblioteca'],t:'Cada objeto antigo é uma pista sobre quem viveu antes; pesquisa sua procedência e preserva suas histórias.'},
    {id:'supernatural',n:'Relíquias sobrenaturais e de culto',sk:['Ocultismo','Avaliação'],t:'Gastou grande parte das economias em objetos ligados a cultos e fenômenos inexplicáveis, tentando separar superstição de perigo real.',crMod:-10},
    {id:'heir',n:'Negócio de família',sk:['Contabilidade','Persuasão'],t:'Herdou uma loja ou coleção e aprendeu a negociar com clientes, credores e parentes que disputam cada peça.',crMod:10},
    {id:'expedition',n:'Caçador de antiguidades',sk:['Arqueologia','Sobrevivência'],t:'Financiou expedições caras atrás de artefatos esquecidos e consumiu boa parte das próprias economias.',crMod:-10}],
   pool:['Avaliação','Encontrar','História','Usar Biblioteca','Ocultismo','Arqueologia','Contabilidade','Persuasão','Sobrevivência','Antropologia']},
  'Fanático':{q:'O que alimenta seu fanatismo?',kind:'Origem',o:[
    {id:'faith',n:'Devoção religiosa',sk:['Persuasão','História'],t:'Uma fé profunda guia suas escolhas; conhece escrituras e tenta convencer os outros de que seu caminho é o certo.'},
    {id:'cause',n:'Causa política ou social',sk:['Persuasão','Intimidação'],t:'Dedica a vida a uma causa e mobiliza aliados, enfrentando quem considera responsável pela injustiça.'},
    {id:'donor',n:'Doou quase todo o patrimônio',sk:['Persuasão','Usar Biblioteca'],t:'Entregou a maior parte de suas economias à causa ou instituição que considera essencial.',crMod:-10},
   {id:'conspiracy',n:'Teorias da conspiração',sk:['Usar Biblioteca','Psicologia'],t:'Reúne recortes, relatos e coincidências numa grande teoria, convencido de que alguém está escondendo a verdade.'},
    {id:'celebrity',n:'Obcecado por uma pessoa',sk:['Psicologia','Escutar'],t:'Acompanha cada gesto de sua figura de interesse e acredita compreender motivações que ninguém mais percebe.'},
    {id:'cult',n:'Culto sobrenatural',sk:['Ocultismo','História'],t:'Acredita numa entidade ou doutrina proibida e procura sinais de que forças ocultas estão agindo no mundo.'}],
   pool:['Persuasão','Intimidação','Usar Biblioteca','Psicologia','Escutar','Ocultismo','História','Lábia','Encontrar','Antropologia']},
  'Motorista':{q:'Para quem ou para que você dirige?',kind:'Origem',o:[
   {id:'escape',n:'Motorista de fuga',sk:['Dirigir Auto','Furtividade'],t:'Conhece rotas de saída e sabe manter a calma quando cada segundo conta; seu passado pode envolver trabalhos ilegais.'},
    {id:'valet',n:'Manobrista',sk:['Dirigir Auto','Charme'],t:'Estacionou carros de clientes exigentes e aprendeu a lidar com gente importante sem chamar atenção.'},
    {id:'chauffeur',n:'Motorista particular de ricos',sk:['Dirigir Auto','Escutar'],t:'Passou anos transportando famílias influentes e ouviu conversas que nunca deveriam sair do carro.',crMod:10},
    {id:'taxi',n:'Taxista',sk:['Dirigir Auto','Navegação'],t:'Conhece as ruas, os atalhos e os hábitos da cidade, além das histórias que os passageiros contam durante a corrida.'},
    {id:'ambulance',n:'Motorista de ambulância',sk:['Dirigir Auto','Primeiros Socorros'],t:'Levou feridos ao hospital contra o relógio e viu de perto acidentes que pareciam impossíveis.'}],
   pool:['Dirigir Auto','Furtividade','Charme','Escutar','Navegação','Primeiros Socorros','Consertos Mecânicos','Encontrar','Psicologia','Intimidação']},
 'Criminoso':{q:'Você já foi preso?',kind:'Passado criminal',o:[
   {id:'served',n:'Sim, cumpri pena',sk:['Lutar (Brigar)','Psicologia'],t:'Cumpriu pena, perdeu o emprego e boa parte dos bens; agora tenta reconstruir a vida.',crMod:-10},
   {id:'escaped',n:'Sim, mas escapei',sk:['Furtividade','Escalar'],t:'Foi preso, mas conseguiu fugir; desde então, vive olhando por cima do ombro.'},
   {id:'never',n:'Nunca fui pego',sk:['Disfarce','Furtividade'],t:'Nunca passou pela cadeia e tem orgulho de não deixar rastros.'},
   {id:'wrongful',n:'Fui preso injustamente',sk:['Direito','Lábia'],t:'Foi detido por um crime que não cometeu e aprendeu a desconfiar da lei.'},
   {id:'reformatory',n:'Passei por um reformatório',sk:['Intimidação','Psicologia'],t:'Cresceu num reformatório, onde aprendeu cedo a ler as pessoas e se defender.'}],
  pool:['Furtividade','Disfarce','Lábia','Direito','Lutar (Brigar)','Intimidação','Escalar','Encontrar','Psicologia']}
};
/* Amnésia: ocupação exclusiva da ficha em branco normal. Não entra em OCC, então não aparece no gerador. */
const AMNESIA_OCC={n:'Amnésia',p:'EDU*4',c:[0,99],s:['@any']};
const FRAG_TAG='Fragmento de memória:';
const AMNESIA_FRAGS=[
 {id:'piano',sk:'Arte/Ofício (Piano)',t:'Seus dedos tocam sozinhos uma melodia que você jura nunca ter ouvido.'},
 {id:'pistol',sk:'Armas de Fogo (Pistolas)',t:'Você acordou com a mão fechada sobre o cabo de uma arma, sem saber de quem era.'},
 {id:'scar',sk:'Medicina',t:'Uma cicatriz de cirurgia cuidadosa corta suas costelas, e ninguém se lembra de ter operado você.'},
 {id:'aid',sk:'Primeiros Socorros',t:'Você estanca ferimentos de estranhos sem hesitar, como se já tivesse feito isso mil vezes.'},
 {id:'latin',sk:'Língua (Latim)',t:'Palavras em latim escapam de você enquanto dorme.'},
 {id:'lock',sk:'Chaveiro',t:'Seus dedos abrem qualquer fechadura antes de você pensar nela.'},
 {id:'pharma',sk:'Ciência (Farmácia)',t:'O cheiro de uma farmácia faz o nome de cada remédio vir à sua língua.'},
 {id:'draw',sk:'Arte/Ofício (Desenho)',t:'Há tinta antiga sob suas unhas e um rosto que você desenha sem parar.'},
 {id:'swim',sk:'Natação',t:'Diante de água funda, o corpo já está pulando antes da mente.'},
 {id:'nav',sk:'Navegação',t:'Você aponta o norte sem bússola, e o mapa na sua cabeça não é desta cidade.'},
 {id:'drive',sk:'Dirigir Auto',t:'Seu pé procura uma embreagem que não existe.'},
 {id:'climb',sk:'Escalar',t:'Muros altos parecem convites, e seus braços conhecem a escalada.'},
 {id:'lie',sk:'Lábia',t:'Mentiras saem prontas dos seus lábios, e você teme de quem as aprendeu.'},
 {id:'psych',sk:'Psicologia',t:'Você sabe quando alguém mente e não consegue explicar por quê.'},
 {id:'listen',sk:'Escutar',t:'Passos que ninguém mais ouve fazem você se virar, sempre cedo demais.'},
 {id:'knot',sk:'Pilotar (Barcos)',t:'Você ata nós de marinheiro sem olhar, e o cheiro de maresia dói.'},
 {id:'occult',sk:'Ocultismo',t:'Certos símbolos gelam sua nuca. Você sabe o que significam, mas não de onde.'},
 {id:'arch',sk:'Arqueologia',t:'A poeira de ruínas antigas lhe parece estranhamente familiar.'},
 {id:'acct',sk:'Contabilidade',t:'Você soma colunas de números de cabeça, de um escritório que não consegue ver.'},
 {id:'photo',sk:'Arte/Ofício (Fotografia)',t:'Você enquadra tudo com as mãos, como se segurasse uma câmera.'},
 {id:'dodge',sk:'Esquivar',t:'Você se esquiva de golpes antes de eles existirem.'},
 {id:'fight',sk:'Lutar (Brigar)',t:'Seus punhos têm hábitos violentos que você preferia não ter.'},
 {id:'stealth',sk:'Furtividade',t:'Você pisa sem fazer barulho, como quem foge há muito tempo.'},
 {id:'mech',sk:'Consertos Mecânicos',t:'Máquinas quebradas parecem pedir conserto, e você sabe onde mexer.'},
 {id:'horse',sk:'Cavalgar',t:'Cavalos se acalmam ao seu toque, ainda que você não saiba por quê.'},
 {id:'law',sk:'Direito',t:'Artigos de lei surgem na sua cabeça nos momentos mais estranhos.'},
 {id:'hist',sk:'História',t:'Datas de batalhas esquecidas aparecem na sua mente, nítidas demais.'},
 {id:'survive',sk:'Sobrevivência',t:'Você acende fogo na chuva e dorme com um olho aberto.'},
 {id:'disguise',sk:'Disfarce',t:'Você muda de postura e de voz sem perceber, e se pergunta qual delas é a sua.'},
 {id:'intimid',sk:'Intimidação',t:'As pessoas recuam quando você as encara, e isso assusta você mais do que a elas.'},
 {id:'persuade',sk:'Persuasão',t:'Estranhos confiam em você rápido demais.'}];
/* ficha em branco: atributos zerados, sem nome/ocupação, perícias mais usadas com o valor inicial */
const BLANK_SK=['Esquivar','Encontrar','Escutar','Psicologia','Usar Biblioteca','Furtividade','Lutar (Brigar)','Armas de Fogo (Pistolas)','Armas de Fogo (Rifles)','Primeiros Socorros','Persuasão','Lábia','Charme','Intimidação','Ocultismo','História','Dirigir Auto','Escalar','Mundo Natural','Consertos Mecânicos','Eletrônica','Usar Computadores','Língua Natural','Nível de Crédito',
 'Consertos Elétricos','Contabilidade','Direito','Disfarce','Língua (outra)','Medicina','Mitos de Cthulhu','Natação','Navegação','Operar Maquinário','Operar Maquinário Pesado','Pilotar (Aeronaves)','Pilotar (Barcos)','Pilotar (outra)','Prestidigitação','Psicanálise','Rastrear','Saltar','Sobrevivência',
 'Avaliação','Cavalgar','Chaveiro','Arremessar','Antropologia','Arqueologia'];
const EXTRA={'Arte/Ofício (outra)':5,'Ciência (outra)':1,'Língua (outra)':1,'Pilotar (outra)':1,'Mitos de Cthulhu':0};
/* Especializações que não aparecem na lista "não treinadas" (e portanto não entram no PDF), mas têm valor-base conhecido ao adicionar uma perícia nova. */
const SPECIAL_BASE={'Lutar (Espada)':20,'Lutar (Lança)':20,'Lutar (Machado)':15,'Lutar (Corrente)':15,'Lutar (Garrote)':15,'Lutar (Mangual)':10,'Lutar (Motosserra)':10,'Lutar (Chicote)':5,'Armas de Fogo (Submetralhadora)':15,'Armas de Fogo (Metralhadoras)':10,'Armas de Fogo (Arco)':15,'Armas de Fogo (Lança-chamas)':10,'Armas de Fogo (Armas Pesadas)':10};
/* Faixas de criação dos atributos (3d6×5 e (2d6+6)×5) e compra de pontos. */
const ATTR_KEYS=['FOR','CON','POD','DES','APA','TAM','INT','EDU'];
const ATTR_RANGE={FOR:[15,90],CON:[15,90],POD:[15,90],DES:[15,90],APA:[15,90],TAM:[40,90],INT:[40,90],EDU:[40,90]};
const POINT_BUY_TOTAL=460;
const ATTR_NAMES={FOR:'Força',CON:'Constituição',POD:'Poder',DES:'Destreza',APA:'Aparência',TAM:'Tamanho',INT:'Inteligência',EDU:'Educação'};
const SKILL_CAP=75; /* teto de uma perícia ao gastar pontos de criação (Nível de Crédito tem faixa própria) */
