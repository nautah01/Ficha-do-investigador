/* Catálogo e edição do inventário por investigador. Dados novos ficam dentro de cada ficha.
   - O catálogo é escolhido num seletor em cartões (busca + categorias), como o de ocupações.
   - Cada item prioriza imagens locais do catálogo e usa referências da Wikipédia como alternativa.
   - Munição não é mais um item: ela é controlada dentro da própria arma de fogo. */
(()=>{
 const SKILLS=['Armas de Fogo (Pistolas)','Armas de Fogo (Rifles)','Armas de Fogo (Arco)','Armas de Fogo (Metralhadoras)','Lutar (Brigar)','Lutar (Machado)','Lutar (Chicote)','Arremessar','Primeiros Socorros','Medicina','Psicologia','Dirigir Auto','Outro (escrever)'];
 const CATS=['Geral','Cura','Arma de fogo','Arma corpo a corpo'];
 const ICON={'Geral':'🎒','Cura':'🩹','Arma de fogo':'🔫','Arma corpo a corpo':'🗡️'};
 const CREDIT_JUSTIFICATIONS={inherited:'Item herdado',mission:'Comprado com dinheiro recebido em uma missão',gift:'Presente ou recebido de alguém',guardian:'Autorizado pelo Guardião'};
 const EQUIPMENT_YEARS=[1850,1900,1920,1950,1980,2000,2020,2026];
 /* q = termo de busca (título de artigo da Wikipédia em inglês) usado para achar a imagem de referência */
 const assetPaths=file=>{const enc=s=>s.split('/').map(encodeURIComponent).join('/'),v='20261011',staged=enc('Novas alterações');return[`equip-images/${enc(file)}?v=${v}`,`${staged}/equip-images/${enc(file)}?v=${v}`,`${staged}/${enc(file)}?v=${v}`,`${enc(file)}?v=${v}`]};
 const CATALOG=[
  {id:'wallet',cat:'Geral',name:'Carteira com identidade',q:'Wallet',imgPaths:assetPaths('download.png'),imgTransparent:true,imgRev:5,notes:'Carteira, documentos e identificação.'},
  {id:'notebook',cat:'Geral',name:'Caderno e lápis',q:'Pencil',imgPaths:assetPaths('caderno de anotações.png'),imgTransparent:true,imgRev:5},
  {id:'pen',cat:'Geral',name:'Caneta-tinteiro',q:'Fountain pen',imgPaths:assetPaths('caneta tinteiro.png'),imgTransparent:true,imgRev:5},
  {id:'flashlight',cat:'Geral',name:'Lanterna elétrica',q:'Flashlight',eraFrom:1899,imgPaths:assetPaths('lanterna eletrica.png'),imgTransparent:true,imgRev:5},
  {id:'batteries',cat:'Geral',name:'Pilhas',q:'Battery (electricity)',eraFrom:1896,imgPaths:assetPaths('pilhas.png'),imgTransparent:true,imgRev:5},
  {id:'compass',cat:'Geral',name:'Bússola com tampa',q:'Compass',imgPaths:assetPaths('busola.png'),imgTransparent:true,imgRev:5},
  {id:'binoculars',cat:'Geral',name:'Binóculos',q:'Binoculars',eraFrom:1854,imgPaths:assetPaths('Binoculos.png'),imgTransparent:true,imgRev:5},
  {id:'telescope',cat:'Geral',name:'Telescópio portátil',q:'Refracting telescope',imgPaths:assetPaths('telescopio portatil.png'),imgTransparent:true,imgRev:5},
  {id:'watch',cat:'Geral',name:'Relógio de bolso',q:'Pocket watch',imgPaths:assetPaths('relogio de bolso.png'),imgTransparent:true,imgRev:5},
  {id:'camera',cat:'Geral',name:'Câmera fotográfica',q:'Kodak Brownie',eraFrom:1900,imgPaths:assetPaths('camera.png'),imgTransparent:true,imgRev:5},
  {id:'typewriter',cat:'Geral',name:'Máquina de escrever Remington',q:'Typewriter',eraFrom:1874,eraTo:2011,creditMin:25,creditVintage:15,imgPaths:assetPaths('maquina de escrever.png'),imgTransparent:true,imgRev:5},
  {id:'dictaphone',cat:'Geral',name:'Ditafone de cilindro de cera',q:'Dictaphone',eraFrom:1907,eraTo:1947,creditMin:25,creditVintage:10,imgPaths:assetPaths('ditafone.png'),imgTransparent:true,imgRev:5},
  {id:'handcuffs',cat:'Geral',name:'Algemas',q:'Handcuff',imgPaths:assetPaths('algemas.png'),imgTransparent:true,imgRev:5},
  {id:'rope',cat:'Geral',name:'Corda (50 pés)',q:'Rope',imgPaths:assetPaths('cordas.png'),imgTransparent:true,imgRev:5},
  {id:'crowbar',cat:'Geral',name:'Pé de cabra',q:'Crowbar',imgPaths:assetPaths('pé de cabra.png'),imgTransparent:true,imgRev:5},
  {id:'tools',cat:'Geral',name:'Estojo de ferramentas',q:'Toolbox',imgPaths:assetPaths('estojo de ferramentas.png'),imgTransparent:true,imgRev:5},
  {id:'fieldbag',cat:'Geral',name:'Bolsa de lona',q:'Duffel bag',imgPaths:assetPaths('Bolsa de lona.png'),imgTransparent:true,imgRev:5},
  {id:'canteen',cat:'Geral',name:'Cantil',q:'Canteen (bottle)',imgPaths:assetPaths('Cantil.png'),imgTransparent:true,imgRev:5},
  {id:'matches',cat:'Geral',name:'Fósforos à prova d’água',q:'Match',imgPaths:assetPaths('Caixa de fosforos.png'),imgTransparent:true,imgRev:5},
  {id:'lantern',cat:'Geral',name:'Lanterna a querosene',q:'Kerosene lamp',imgPaths:assetPaths('Lanterna a querosene.png'),imgTransparent:true,imgRev:5},
  {id:'lockpick',cat:'Geral',name:'Kit de chaveiro',q:'Lock picking',imgPaths:assetPaths('Kit de chaveiro.png'),imgTransparent:true,imgRev:5,notes:'Ferramentas de precisão para fechaduras.'},
  {id:'shovel',cat:'Geral',name:'Pá',q:'Shovel',imgPaths:assetPaths('Pá.png'),imgTransparent:true,imgRev:5},
  {id:'umbrella',cat:'Geral',name:'Guarda-chuva',q:'Umbrella',imgPaths:assetPaths('Guarda chuva.png'),imgTransparent:true,imgRev:5},
  {id:'camera_flash',cat:'Geral',name:'Flash de magnésio',q:'Flash-lamp',eraFrom:1880,eraTo:1940,creditMin:20,creditVintage:10,imgPaths:assetPaths('Flash de magnesio.png'),imgTransparent:true,imgRev:5},
  {id:'map',cat:'Geral',name:'Mapa da região',q:'Map',imgPaths:assetPaths('mapa.jpg'),imgTransparent:false,imgRev:5},
  {id:'coat',cat:'Geral',name:'Casaco pesado',q:'Overcoat',imgPaths:assetPaths('casaco.png'),imgTransparent:true,imgRev:5,notes:'Proteção narrativa contra frio e chuva; sem armadura automática.'},
  {id:'gloves',cat:'Geral',name:'Luvas resistentes',q:'Protective glove',imgPaths:assetPaths('Luvas resistentes.png'),imgTransparent:true,imgRev:5},
  {id:'respirator',cat:'Geral',name:'Máscara de proteção',q:'Respirator',imgPaths:assetPaths('Mascara.png'),imgTransparent:true,imgRev:5},
  {id:'medicalcase',cat:'Cura',name:'Maleta médica',q:'Doctor\'s bag',notes:'Equipamento de atendimento; não concede cura automática.'},
  {id:'bandage',cat:'Cura',name:'Gaze e bandagens',q:'Bandage',notes:'Primeiros Socorros pode recuperar 1 PV se aplicada em até uma hora da lesão.'},
  {id:'aspirin',cat:'Cura',name:'Aspirina (12 comprimidos)',q:'Aspirin',uses:12,notes:'Alívio de sintomas; não recupera PV por si só.'},
  {id:'forceps',cat:'Cura',name:'Pinças médicas',q:'Forceps'},
  {id:'scalpel',cat:'Cura',name:'Jogo de bisturis',q:'Scalpel'},
  {id:'thermometer',cat:'Cura',name:'Termômetro clínico',q:'Medical thermometer'},
  {id:'syringe',cat:'Cura',name:'Seringas hipodérmicas',q:'Hypodermic needle'},
  {id:'alcohol',cat:'Cura',name:'Álcool medicinal',q:'Rubbing alcohol'},
  {id:'crutches',cat:'Cura',name:'Muletas',q:'Crutch',imgPaths:['equip-images/crutches.png?v=20261010','Novas%20altera%C3%A7%C3%B5es/equip-images/crutches.png?v=20261010','Novas%20altera%C3%A7%C3%B5es/crutches.png?v=20261010','crutches.png?v=20261010'],imgRev:4},
  {id:'pistol22',cat:'Arma de fogo',name:'Pistola automática .22 Short',q:'Semi-automatic pistol',skill:'Armas de Fogo (Pistolas)',damage:'1D6',range:'10 jardas',rate:'1 (até 3)',capacity:6,ammo:'.22 Short',mal:100,eraFrom:1900},
  {id:'derringer25',cat:'Arma de fogo',name:'Derringer .25 (cano único)',q:'Derringer',skill:'Armas de Fogo (Pistolas)',damage:'1D6',range:'3 jardas',rate:'1',capacity:1,ammo:'.25',mal:100,eraFrom:1900,creditMin:15,creditVintage:10},
  {id:'revolver32',cat:'Arma de fogo',name:'Revólver .32 / 7,65 mm',q:'Colt Police Positive',skill:'Armas de Fogo (Pistolas)',damage:'1D8',range:'15 jardas',rate:'1 (até 3)',capacity:6,ammo:'.32',mal:100,eraFrom:1905,eraTo:1947,creditMin:20,creditVintage:10},
  {id:'auto32',cat:'Arma de fogo',name:'Pistola automática .32 / 7,65 mm',q:'Colt Model 1903 Pocket Hammerless',skill:'Armas de Fogo (Pistolas)',damage:'1D8',range:'15 jardas',rate:'1 (até 3)',capacity:8,ammo:'.32',mal:99,eraFrom:1903,eraTo:1946,creditMin:30,creditVintage:15},
  {id:'luger',cat:'Arma de fogo',name:'Pistola Luger P08',q:'Luger pistol',skill:'Armas de Fogo (Pistolas)',damage:'1D10',range:'15 jardas',rate:'1 (até 3)',capacity:8,ammo:'9 mm',mal:99,creditMin:40,eraFrom:1908,eraTo:1942,creditVintage:20,imgRev:2},
  {id:'revolver45',cat:'Arma de fogo',name:'Revólver .45',q:'Colt New Service',skill:'Armas de Fogo (Pistolas)',damage:'1D10+2',range:'15 jardas',rate:'1 (até 3)',capacity:6,ammo:'.45 Colt',mal:100,creditMin:30,eraFrom:1898,eraTo:1944,creditVintage:20,imgRev:2},
  {id:'auto45',cat:'Arma de fogo',name:'Pistola automática .45',q:'M1911 pistol',skill:'Armas de Fogo (Pistolas)',damage:'1D10+2',range:'15 jardas',rate:'1 (até 3)',capacity:7,ammo:'.45',mal:100,creditMin:40,eraFrom:1911,creditVintage:10,imgRev:2},
  {id:'rifle22',cat:'Arma de fogo',name:'Rifle .22 de ferrolho',q:'Bolt action',skill:'Armas de Fogo (Rifles)',damage:'1D6+1',range:'30 jardas',rate:'1',capacity:6,ammo:'.22 Long Rifle',mal:99,eraFrom:1880},
  {id:'carbine30',cat:'Arma de fogo',name:'Carabina .30 de alavanca',q:'Winchester Model 1894',skill:'Armas de Fogo (Rifles)',damage:'2D6',range:'50 jardas',rate:'1',capacity:6,ammo:'.30',mal:98,eraFrom:1894},
  {id:'leeenfield',cat:'Arma de fogo',name:'Rifle Lee-Enfield .303',q:'Lee–Enfield',skill:'Armas de Fogo (Rifles)',damage:'2D6+4',range:'110 jardas',rate:'1',capacity:10,ammo:'.303',mal:100,eraFrom:1895,eraTo:1957,creditMin:35,creditVintage:-15},
  {id:'rifle3006',cat:'Arma de fogo',name:'Rifle .30-06 de ferrolho',q:'M1903 Springfield',skill:'Armas de Fogo (Rifles)',damage:'2D6+4',range:'110 jardas',rate:'1',capacity:5,ammo:'.30-06',mal:100,creditMin:40,eraFrom:1903,eraTo:1944,creditVintage:15,imgRev:2},
  {id:'elephantgun',cat:'Arma de fogo',name:'Rifle para elefantes (cano duplo)',q:'Double rifle',skill:'Armas de Fogo (Rifles)',damage:'3D6+4',range:'100 jardas',rate:'1 ou 2',capacity:2,ammo:'calibre pesado',mal:100,creditMin:60,eraFrom:1850,creditVintage:15,imgRev:2},
  {id:'shotgun12',cat:'Arma de fogo',name:'Espingarda calibre 12 (cano duplo)',q:'Double-barreled shotgun',skill:'Armas de Fogo (Rifles)',damage:'4D6 / 2D6 / 1D6',range:'10 / 20 / 50 jardas',rate:'1 ou 2',capacity:2,ammo:'calibre 12',mal:100,eraFrom:1870},
  {id:'shotgun12auto',cat:'Arma de fogo',name:'Espingarda calibre 12 semiautomática',q:'Browning Auto-5',skill:'Armas de Fogo (Rifles)',damage:'4D6 / 2D6 / 1D6',range:'10 / 20 / 50 jardas',rate:'1 (até 2)',capacity:5,ammo:'calibre 12',mal:100,creditMin:40,eraFrom:1902,eraTo:1998,creditVintage:10,imgRev:2},
  {id:'thompson',cat:'Arma de fogo',name:'Submetralhadora Thompson',q:'Thompson submachine gun',skill:'Armas de Fogo (Metralhadoras)',damage:'1D10+2',range:'20 jardas',rate:'1 ou rajada automática',capacity:20,ammo:'.45',mal:96,creditMin:60,eraFrom:1921,eraTo:1945,creditVintage:20,imgRev:2,caution:'Arma automática rara e normalmente indisponível a civis; confirme a disponibilidade com o Guardião.',notes:'Inclui carregador de 20 cartuchos na configuração de referência.'},
  {id:'crossbow',cat:'Arma de fogo',name:'Besta',q:'Crossbow',skill:'Armas de Fogo (Arco)',damage:'1D8+2',range:'50 jardas',rate:'1 a cada 2 rodadas',capacity:1,ammo:'virote',mal:96},
  {id:'smithwesson10',cat:'Arma de fogo',name:'Revólver Smith & Wesson Model 10 (.38)',q:'Smith & Wesson Model 10',skill:'Armas de Fogo (Pistolas)',damage:'1D8',range:'15 jardas',rate:'1 (até 3)',capacity:6,ammo:'.38 Special',mal:100,eraFrom:1899,creditMin:25,creditVintage:10,imgPaths:assetPaths('revólver-modelo-10.svg'),imgTransparent:true,imgRev:1},
  {id:'coltsa',cat:'Arma de fogo',name:'Revólver Colt Single Action Army (.45)',q:'Colt Single Action Army',skill:'Armas de Fogo (Pistolas)',damage:'1D10',range:'15 jardas',rate:'1',capacity:6,ammo:'.45 Colt',mal:100,eraFrom:1873,eraTo:1940,creditMin:30,creditVintage:20,imgPaths:assetPaths('revolver-antigo.svg'),imgTransparent:true,imgRev:1},
  {id:'m1911model',cat:'Arma de fogo',name:'Pistola Colt M1911 (.45)',q:'Colt M1911',skill:'Armas de Fogo (Pistolas)',damage:'1D10+2',range:'15 jardas',rate:'1 (até 3)',capacity:7,ammo:'.45 ACP',mal:100,creditMin:40,eraFrom:1911,creditVintage:10,imgPaths:assetPaths('pistola-1911.svg'),imgTransparent:true,imgRev:1},
  {id:'m1carbine',cat:'Arma de fogo',name:'Carabina M1 (.30 Carbine)',q:'M1 carbine',skill:'Armas de Fogo (Rifles)',damage:'2D6',range:'50 jardas',rate:'1 (até 2)',capacity:15,ammo:'.30 Carbine',mal:99,creditMin:50,eraFrom:1942,eraTo:1945,creditVintage:20,imgPaths:assetPaths('carabina-m1.svg'),imgTransparent:true,imgRev:1},
  {id:'remington870',cat:'Arma de fogo',name:'Espingarda Remington 870',q:'Remington Model 870',skill:'Armas de Fogo (Rifles)',damage:'4D6 / 2D6 / 1D6',range:'10 / 20 / 50 jardas',rate:'1',capacity:5,ammo:'calibre 12',mal:100,creditMin:35,eraFrom:1950,imgPaths:assetPaths('espingarda-870.svg'),imgTransparent:true,imgRev:1},
  {id:'ar15',cat:'Arma de fogo',name:'Rifle AR-15 (.223)',q:'AR-15',skill:'Armas de Fogo (Rifles)',damage:'2D6+4',range:'110 jardas',rate:'1 (até 2)',capacity:20,ammo:'.223 Remington',mal:99,creditMin:55,eraFrom:1959,creditVintage:10,imgPaths:assetPaths('rifle-ar15.svg'),imgTransparent:true,imgRev:1},
  {id:'glock17',cat:'Arma de fogo',name:'Pistola Glock 17 (9 mm)',q:'Glock 17',skill:'Armas de Fogo (Pistolas)',damage:'1D10',range:'15 jardas',rate:'1 (até 3)',capacity:17,ammo:'9 mm',mal:98,creditMin:45,eraFrom:1982,imgPaths:assetPaths('pistola-moderna.svg'),imgTransparent:true,imgRev:1},
  {id:'ak47',cat:'Arma de fogo',name:'Fuzil AK-47 (7,62 mm)',q:'AK-47',skill:'Armas de Fogo (Rifles)',damage:'2D6+1',range:'100 jardas',rate:'1 ou rajada automática',capacity:30,ammo:'7,62×39 mm',mal:100,creditMin:65,eraFrom:1949,creditVintage:10,caution:'Arma militar de acesso restrito; disponibilidade e posse dependem do cenário e do Guardião.',imgPaths:assetPaths('fuzil-classico.svg'),imgTransparent:true,imgRev:1},
  {id:'cigarettes',cat:'Geral',name:'Maço de cigarros',q:'Cigarette pack',eraFrom:1880,imgPaths:assetPaths('cigarros.svg'),imgTransparent:true,imgRev:1,notes:'Consumível narrativo; a quantidade e o hábito ficam a critério da mesa.'},
  {id:'cigar',cat:'Geral',name:'Caixa de charutos',q:'Cigar box',eraFrom:1850,creditMin:15,creditVintage:5,imgPaths:assetPaths('charutos.svg'),imgTransparent:true,imgRev:1},
  {id:'whiskey',cat:'Geral',name:'Garrafa de uísque',q:'Whiskey bottle',eraFrom:1850,creditMin:10,imgPaths:assetPaths('whisky.svg'),imgTransparent:true,imgRev:1},
  {id:'flask',cat:'Geral',name:'Frasco de bolso',q:'Hip flask',eraFrom:1850,creditMin:10,creditVintage:10,imgPaths:assetPaths('frasco-bolso.svg'),imgTransparent:true,imgRev:1},
  {id:'beer',cat:'Geral',name:'Garrafa de cerveja',q:'Beer bottle',eraFrom:1850,creditMin:5,imgPaths:assetPaths('cerveja.svg'),imgTransparent:true,imgRev:1},
  {id:'lighter',cat:'Geral',name:'Isqueiro de bolso',q:'Zippo lighter',eraFrom:1933,creditMin:10,imgPaths:assetPaths('isqueiro.svg'),imgTransparent:true,imgRev:1},
  {id:'club',cat:'Arma corpo a corpo',name:'Cassetete / porrete pequeno',q:'Baton (law enforcement)',imgPaths:['equip-images/small-club.png?v=20261010','Novas%20altera%C3%A7%C3%B5es/equip-images/small-club.png?v=20261010','Novas%20altera%C3%A7%C3%B5es/small-club.png?v=20261010','small-club.png?v=20261010'],imgRev:4,skill:'Lutar (Brigar)',damage:'1D6 + BD',range:'Toque'},
  {id:'baseballbat',cat:'Arma corpo a corpo',name:'Porrete grande / taco',q:'Baseball bat',skill:'Lutar (Brigar)',damage:'1D8 + BD',range:'Toque'},
  {id:'brassknuckles',cat:'Arma corpo a corpo',name:'Soco-inglês',q:'Brass knuckles',skill:'Lutar (Brigar)',damage:'1D3+1 + BD',range:'Toque'},
  {id:'knife_small',cat:'Arma corpo a corpo',name:'Faca pequena',q:'Pocketknife',skill:'Lutar (Brigar)',damage:'1D4 + BD',range:'Toque'},
  {id:'knife_medium',cat:'Arma corpo a corpo',name:'Faca média',q:'Hunting knife',skill:'Lutar (Brigar)',damage:'1D4+2 + BD',range:'Toque'},
  {id:'knife_large',cat:'Arma corpo a corpo',name:'Faca grande / machete',q:'Machete',imgPaths:['equip-images/machete.png?v=20261010','Novas%20altera%C3%A7%C3%B5es/equip-images/machete.png?v=20261010','Novas%20altera%C3%A7%C3%B5es/machete.png?v=20261010','machete.png?v=20261010'],imgRev:3,skill:'Lutar (Brigar)',damage:'1D8 + BD',range:'Toque'},
  {id:'hatchet',cat:'Arma corpo a corpo',name:'Machadinha',q:'Hand axe',imgPaths:['equip-images/hatchet.png?v=20261010','Novas%20altera%C3%A7%C3%B5es/equip-images/hatchet.png?v=20261010','Novas%20altera%C3%A7%C3%B5es/hatchet.png?v=20261010','hatchet.png?v=20261010'],imgRev:3,skill:'Lutar (Machado)',damage:'1D6+1 + BD',range:'Toque'},
  {id:'bullwhip',cat:'Arma corpo a corpo',name:'Chicote',q:'Bullwhip',skill:'Lutar (Chicote)',damage:'1D3 + metade do BD',range:'10 pés'},
 ];
 const NEW_LOCAL_IMAGES={
  ak47:'Ak 47.png',alcohol:'Alcool medicinal.png',aspirin:'Aspirina.png',bandage:'Bandagem.png',crossbow:'Besta.png',cigar:'Caixa de charutos.png',
  carbine30:'Carabina .30 de alavanca.png',m1carbine:'Carabina M1.png',beer:'Cerveja.png',bullwhip:'Chicote.png',cigarettes:'Cigarros.png',
  derringer25:'Derringer .25.png',shotgun12auto:'Espingada calibre 12 semiautomatica.png',shotgun12:'Espingarda calibre 12 cano duplo.png',remington870:'Espingarda remington 870.png',
  knife_medium:'Faca média.png',knife_small:'Faca pequena.png',flask:'Frasco de bolso.png',whiskey:'Garrafa de uisque.png',lighter:'Isqueiro.png',scalpel:'Jogo de bisturis.png',
  m1911model:'M1911.png',hatchet:'Machadinha.png',knife_large:'Machete.png',medicalcase:'Maleta medica.png',map:'Mapa da região.png',crutches:'Muletas.png',forceps:'Pinças medicas.png',
  pistol22:'Pistola automatica .22.png',auto32:'Pistola automatica .32.png',auto45:'Pistola automatica .45.png',glock17:'Pistola Glock-17.png',luger:'Pistola Luger P08.png',club:'Porrete pequeno.png',
  revolver32:'Revolver .32.png',revolver45:'Revolver .45.png',coltsa:'Revolver colt action single army.png',smithwesson10:'Revolver Smith.png',leeenfield:'Rifel Lee-Enfield .303.png',
  rifle22:'Rifle .22 de ferrolho.png',rifle3006:'Rifle .30-06 de ferrolho.png',ar15:'Rifle ar-15.png',elephantgun:'Rifle´para elefante cano duplo.png',syringe:'Seringa.png',
  brassknuckles:'Soco ingles.png',baseballbat:'Taco de beisebol.png',thermometer:'Termometro.png',thompson:'Thompson.png'
 };
 for(const item of CATALOG){const file=NEW_LOCAL_IMAGES[item.id];if(file){item.imgPaths=assetPaths(file);item.imgTransparent=true;item.imgRev=(item.imgRev||0)+1}}
 const CREDIT_REFERENCE={wallet:5,notebook:0,pen:5,flashlight:10,batteries:5,compass:10,binoculars:20,telescope:35,watch:15,camera:20,typewriter:25,dictaphone:25,handcuffs:20,rope:5,crowbar:5,tools:15,fieldbag:5,canteen:5,matches:0,lantern:10,lockpick:20,shovel:5,umbrella:5,camera_flash:20,map:0,coat:10,gloves:10,respirator:20,medicalcase:30,bandage:5,aspirin:5,forceps:15,scalpel:20,thermometer:5,syringe:10,alcohol:5,crutches:10,pistol22:25,rifle22:25,carbine30:25,shotgun12:30,crossbow:20,club:10,baseballbat:5,brassknuckles:10,knife_small:5,knife_medium:10,knife_large:15,hatchet:10,bullwhip:15,cigarettes:0};
 CATALOG.forEach(item=>{if(item.creditMin==null)item.creditMin=CREDIT_REFERENCE[item.id]??(item.cat==='Arma de fogo'?35:item.cat==='Arma corpo a corpo'?10:item.cat==='Cura'?10:5)});
 const localImagePaths=item=>Array.isArray(item&&item.imgPaths)?item.imgPaths:(item&&item.imgSrc?[item.imgSrc]:[]);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
 const uid=()=>`eq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
 const kindOf=cat=>cat==='Arma de fogo'?'firearm':cat==='Arma corpo a corpo'?'melee':cat==='Cura'?'healing':'general';
 const icon=item=>ICON[item.cat]||ICON.Geral;

 /* Fichas antigas: munição virou texto narrativo e Proteção foi unida a Geral. Nada é apagado. */
 function migrateItem(it){
  if(it.kind==='ammo'){it.kind='general';it.cat='Geral';if(!it.notes&&it.ammo)it.notes='Calibre '+it.ammo+'.'}
  if(it.kind==='protection'||it.cat==='Proteção'){it.kind='general';it.cat='Geral'}
  const latest=CATALOG.find(x=>x.id===it.id&&x.imgRev);
  if(latest&&it.imgRev!==latest.imgRev&&!it.imgManual){it.q=latest.q;it.imgPaths=localImagePaths(latest);it.img=it.imgPaths[0]||'';it.imgFixed=!!it.imgPaths.length;it.imgTransparent=!!latest.imgTransparent;it.imgNone=false;it.imgI=0;it.imgRev=latest.imgRev}
  return it;
 }
 const ensure=p=>{if(!Array.isArray(p.equipment))p.equipment=[];p.equipment.forEach(migrateItem);return p.equipment};
 const find=(p,id)=>ensure(p).find(x=>x.uid===id);
 function skillValue(p,skill){
  const defaults={'Armas de Fogo (Pistolas)':20,'Armas de Fogo (Rifles)':25,'Armas de Fogo (Arco)':15,'Armas de Fogo (Metralhadoras)':10,'Lutar (Brigar)':25,'Lutar (Machado)':15,'Lutar (Chicote)':5,'Arremessar':20,'Primeiros Socorros':30,'Medicina':1,'Psicologia':10,'Dirigir Auto':20};
  return p.sk&&p.sk[skill]!=null?(+p.sk[skill]||0):(defaults[skill]||0);
 }
 function yearOf(p){const y=Number(p&&p.equipmentYear);return Number.isInteger(y)&&y>=1&&y<=9999?y:1920}
 function periodState(p,item){
  const source=CATALOG.find(x=>x.id===item.id)||{},from=item.eraFrom??source.eraFrom,to=item.eraTo??source.eraTo,year=yearOf(p);
  if(from&&year<from)return{state:'future',message:`Ainda não existia em ${year}; só passa a existir a partir de ${from}.`};
  if(to&&year>to)return{state:'retired',message:`Saiu de linha por volta de ${to}; em ${year} pode ser difícil de encontrar e custar mais.`};
  return{state:'available',message:''};
 }
 function loadoutPressure(p,candidate){
  const equipment=ensure(p),items=equipment.slice();
  if(candidate&&!equipment.includes(candidate)&&!equipment.some(x=>x.uid&&x.uid===candidate.uid))items.push(candidate);
  let pressure=0;
  for(const held of items){
   const source=CATALOG.find(x=>x.id===held.id)||{},qty=held.quantity==null?1:Math.max(0,+held.quantity||0),base=+((held.creditMin??source.creditMin)??0),period=periodState(p,held),effectiveBase=base+(period.state==='retired'?+((held.creditVintage??source.creditVintage)??10):0),kind=held.kind||kindOf(held.cat||source.cat);
   if(!qty)continue;
   const creditImpact=effectiveBase>=70?15:effectiveBase>=60?12:effectiveBase>=50?10:effectiveBase>=40?7:effectiveBase>=30?5:effectiveBase>=20?4:effectiveBase>=10?3:2;
   const categoryImpact=kind==='firearm'?3:kind==='melee'?1:0,restrictedImpact=held.caution||source.caution?2:0;
   const perUnit=Math.min(15,creditImpact+categoryImpact+restrictedImpact);
   pressure+=Math.ceil(qty)*perUnit;
  }
  return pressure;
 }
 function suggestedCredit(p,item){
  const source=CATALOG.find(x=>x.id===item.id)||{},base=+((item.creditMin??source.creditMin)??0),period=periodState(p,item);
  const periodExtra=period.state==='retired'?+((item.creditVintage??source.creditVintage)??10):0;
  let required=base+periodExtra;
  const loadoutExtra=loadoutPressure(p,item);
  required=Math.max(0,required+loadoutExtra);
  return{required,base,loadoutExtra,periodExtra,period};
 }
 function creditStatus(p,item){
  const credit=suggestedCredit(p,item),current=skillValue(p,'Nível de Crédito'),margin=current-credit.required;
  const state=credit.required===0||margin>=10?'ok':margin>=0?'edge':'low';
  return{...credit,current,state};
 }
 function creditBadge(p,item){
  const c=creditStatus(p,item),justification=CREDIT_JUSTIFICATIONS[item.creditJustification],state=justification?'ok':c.state,label=justification?`Aviso dispensado: ${justification}`:c.state==='low'?'Abaixo do acesso legal sugerido':c.state==='edge'?'No limite do Crédito':'Crédito compatível';
  return`<span class="eq-credit is-${state}" title="${esc(label)} · personagem ${c.current}% · base ${c.base}% · época +${c.periodExtra}% · conjunto e quantidade +${c.loadoutExtra}%">${justification?'Crédito justificado':`Crédito ${c.required}%`}</span>`;
 }
 function creditJustificationHtml(p,item){
  const selected=CREDIT_JUSTIFICATIONS[item.creditJustification]?item.creditJustification:'',needed=creditStatus(p,item).state==='low';if(!needed&&!selected)return'';
  const options=Object.entries(CREDIT_JUSTIFICATIONS).map(([value,label])=>`<option value="${value}"${value===selected?' selected':''}>${esc(label)}</option>`).join('');
  return`<div class="eq-credit-justification"><label>Remover aviso de Crédito com justificativa<select data-eq-credit-justification data-eq-id="${esc(item.uid)}"><option value=""${selected?'':' selected'}>Manter aviso</option>${options}</select></label>${selected?`<small>Justificativa salva: ${esc(CREDIT_JUSTIFICATIONS[selected])}. Selecione “Manter aviso” para restaurá-lo.</small>`:''}</div>`;
 }
 function warnings(p,item){
  const out=[];
  const creditRule=suggestedCredit(p,item),period=creditRule.period;
  if(period.state!=='available')out.push(period.message);
  if(item.skill&&item.warnSkill!==false){const val=skillValue(p,item.skill);if(val<30)out.push(`Perícia ${item.skill}: ${val}%. É uma chance baixa; usar este item pode ser arriscado.`)}
  if(creditRule.required>0&&!CREDIT_JUSTIFICATIONS[item.creditJustification]){const credit=skillValue(p,'Nível de Crédito');if(credit<creditRule.required){const reasons=[];if(creditRule.loadoutExtra)reasons.push('o conjunto e as quantidades carregadas elevam a referência');if(period.state==='retired'&&creditRule.required>creditRule.base+creditRule.loadoutExtra)reasons.push('a raridade da época também eleva a referência');const reason=reasons.length?' '+reasons.join('; ')+'.':'';out.push(`Nível de Crédito ${credit}% está abaixo da referência narrativa de ${creditRule.required}% para este item.${reason} Converse com o Guardião ou acrescente uma justificativa à backstory; você ainda pode escolhê-lo.`)}}
  if(item.caution)out.push(item.caution);
  return out;
 }
 function newItem(template){
  const item={...template,uid:uid(),quantity:template.quantity||1};
  item.imgPaths=localImagePaths(item);
  if(item.imgPaths.length){item.img=item.imgPaths[0];item.imgFixed=true}
  if(item.kind==='firearm'){item.loaded=item.capacity||0;item.reserve=0}
  if(item.kind==='healing'&&item.uses==null)item.uses=item.quantity;
  return item;
 }
 function addCatalog(p,id){
  const t=CATALOG.find(x=>x.id===id);if(!t)return null;
  const item=newItem({...t,kind:kindOf(t.cat)});
  const urls=cachedUrls(item);if(urls.length&&!item.imgFixed){item.img=urls[0];item.imgI=0}
  ensure(p).push(item);return item;
 }
 function buildCustom(data){
  const cat=CATS.includes(data.category)?data.category:'Geral',kind=kindOf(cat);
  const item={uid:uid(),name:(data.name||'').trim(),cat,kind,quantity:data.quantity===''||data.quantity==null?1:Math.max(0,+data.quantity||0),creditMin:data.creditMin===''||data.creditMin==null?0:Math.max(0,Math.min(99,+data.creditMin||0)),notes:(data.notes||'').trim(),custom:true};
  if(kind==='firearm'){item.skill=data.skill||'Armas de Fogo (Pistolas)';item.damage=(data.damage||'').trim();item.range=(data.range||'').trim();item.rate=(data.rate||'').trim();item.capacity=Math.max(0,+data.capacity||0);item.loaded=item.capacity;item.reserve=Math.max(0,+data.reserve||0);item.ammo=(data.ammo||'').trim();item.mal=data.mal===''||data.mal==null?null:Math.max(0,+data.mal||0)}
  if(kind==='melee'){item.skill=(data.skill||'Lutar (Brigar)').trim();item.damage=(data.damage||'').trim();item.range=(data.range||'Toque').trim()}
  if(kind==='healing'){item.effect=(data.effect||'').trim();item.skill=data.skill||'';item.uses=Math.max(0,+data.uses||1)}
  const url=(data.img||'').trim();
  if(/^https?:\/\//i.test(url)){item.img=url;item.imgManual=true}
  return item;
 }
 function addCustom(p,data){const item=buildCustom(data);ensure(p).push(item);return item}
 const cats=()=>[...CATS];

 /* ---------- imagens de referência (Wikipédia) ---------- */
 const IMG_KEY='cthulhu-eq-img-v1';
 let imgCache={};try{imgCache=JSON.parse(localStorage.getItem(IMG_KEY)||'{}')||{}}catch{}
 const saveImgCache=()=>{try{localStorage.setItem(IMG_KEY,JSON.stringify(imgCache))}catch{}};
 const failed=new Set(),pending=new Map(),busy=new WeakSet(),queue=[];
 let active=0,persistT=0;
 function pump(){while(active<3&&queue.length){const j=queue.shift();active++;j.fn().then(j.ok,j.no).finally(()=>{active--;pump()})}}
 const run=fn=>new Promise((ok,no)=>{queue.push({fn,ok,no});pump()});
 const persistSoon=()=>{clearTimeout(persistT);persistT=setTimeout(()=>{if(typeof persist==='function')persist()},250)};
 async function wikiThumbs(lang,term){
  const base=`https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&piprop=thumbnail&pithumbsize=360`;
  const exact=await fetch(`${base}&redirects=1&titles=${encodeURIComponent(term)}`,{referrerPolicy:'no-referrer'});
  if(!exact.ok)throw new Error('HTTP '+exact.status);
  const direct=Object.values(((await exact.json()).query||{}).pages||{}).filter(p=>p.thumbnail&&p.thumbnail.source);
  if(direct.length)return[...new Set(direct.map(p=>p.thumbnail.source))];
  const search=await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=0&gsrlimit=8&gsrsearch=${encodeURIComponent(term)}&prop=pageimages&piprop=thumbnail&pithumbsize=360`,{referrerPolicy:'no-referrer'});
  if(!search.ok)throw new Error('HTTP '+search.status);
  const j=await search.json(),t=term.toLowerCase();
  const pages=Object.values((j.query&&j.query.pages)||{}).filter(p=>p.thumbnail&&p.thumbnail.source);
  pages.sort((a,b)=>((a.title||'').toLowerCase()===t?0:1)-((b.title||'').toLowerCase()===t?0:1)||(a.index||0)-(b.index||0));
  return[...new Set(pages.map(p=>p.thumbnail.source))];
 }
 function queriesFor(item){
  const out=[];
  const rev=+item.imgRev||1;
  if(item.q)out.push(['en',item.q,rev]);
  const nm=String(item.name||'').replace(/\s*\(.*?\)/g,'').replace(/\s*\/.*$/,'').trim();
  if(nm)out.push(['pt',nm,rev]);
  return out;
 }
 const keyOf=(lang,term,rev=1)=>lang+':v'+rev+':'+term.toLowerCase();
 function cachedUrls(item){for(const[lang,term,rev]of queriesFor(item)){const h=imgCache[keyOf(lang,term,rev)];if(Array.isArray(h)&&h.length)return h}return[]}
 async function findImages(item){
  let error=false;
  for(const[lang,term,rev]of queriesFor(item)){
   const key=keyOf(lang,term,rev),hit=imgCache[key];
   if(Array.isArray(hit)){if(hit.length)return{urls:hit,error:false};continue}
   if(failed.has(key)){error=true;continue}
   try{
    let pr=pending.get(key);
    if(!pr){pr=run(()=>wikiThumbs(lang,term));pending.set(key,pr);pr.then(()=>pending.delete(key),()=>pending.delete(key))}
    const urls=await pr;imgCache[key]=urls;saveImgCache();
    if(urls.length)return{urls,error:false};
   }catch{failed.add(key);error=true}
  }
  return{urls:[],error};
 }
 async function resolveImage(item){
  if(item.img||item.imgNone||item.imgManual||item.imgFixed||busy.has(item))return;
  busy.add(item);
  try{
   const{urls,error}=await findImages(item);
   if(urls.length){item.imgI=+item.imgI||0;item.img=urls[item.imgI%urls.length]}
   else if(!error)item.imgNone=true;
  }finally{busy.delete(item)}
 }
 async function cycleImage(item,thumb){
  if(!item||item.imgManual||item.imgFixed)return;
  const{urls}=await findImages(item);if(urls.length<2)return;
  item.imgI=((+item.imgI||0)+1)%urls.length;item.img=urls[item.imgI];item.imgNone=false;
  if(thumb&&thumb.isConnected)paintThumb(thumb,item);
  persistSoon();
 }
 function thumbInner(item){
  const fg=item.img?`<img class="eq-thumb-foreground" src="${esc(item.img)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`:'';
  const img=item.img?(item.imgTransparent?fg:`<img class="eq-thumb-backdrop" src="${esc(item.img)}" alt="" aria-hidden="true" loading="lazy" decoding="async" referrerpolicy="no-referrer">${fg}`):`<span class="eq-ph" aria-hidden="true">${icon(item)}</span>`;
  const cyc=item.img&&!item.imgManual&&!item.imgFixed?`<button type="button" class="eq-cycle" data-eq-action="cycle-img" data-eq-id="${esc(item.uid)}" title="Trocar a imagem de referência" aria-label="Trocar a imagem de referência">↻</button>`:'';
  return img+cyc;
 }
 const thumbHtml=item=>`<div class="eq-thumb${item.img?' has':''}${item.imgTransparent?' transparent':''}" data-eq-thumb="${esc(item.uid)}">${thumbInner(item)}</div>`;
 function wireThumb(th,item){
  const im=th.querySelector('.eq-thumb-foreground');if(!im||im.dataset.wired)return;im.dataset.wired='1';
  im.addEventListener('error',()=>{
   const wasFixed=item.imgFixed,paths=localImagePaths(item),pathIndex=paths.indexOf(item.img);
   if(wasFixed&&pathIndex>=0&&pathIndex+1<paths.length){item.img=paths[pathIndex+1];if(th.isConnected)paintThumb(th,item);persistSoon();return}
   item.img='';item.imgFixed=false;
   if(item.imgManual){item.imgManual=false;item.imgNone=false}else item.imgNone=wasFixed?false:true;
   if(th.isConnected)paintThumb(th,item);persistSoon();
   if(wasFixed)resolveImage(item).then(()=>{if(item.img&&th.isConnected)paintThumb(th,item);persistSoon()});
  },{once:true});
 }
 function paintThumb(th,item){th.classList.toggle('has',!!item.img);th.classList.toggle('transparent',!!item.imgTransparent);th.innerHTML=thumbInner(item);wireThumb(th,item)}
 /* Percorre as fichas com a aba de equipamentos aberta: liga o tratamento de erro e busca imagens que faltam. */
 function hydrate(root,list){
  if(!root||!Array.isArray(list))return;
  root.querySelectorAll('.win').forEach(w=>{
   const p=list[+w.dataset.i],pane=w.querySelector('.equipment-pane');
   if(!p||!pane||pane.hidden)return;
   pane.querySelectorAll('[data-eq-thumb]').forEach(th=>{
    const item=find(p,th.dataset.eqThumb);if(!item)return;
    wireThumb(th,item);
    if(!item.img&&!item.imgNone&&!item.imgManual)resolveImage(item).then(()=>{if(item.img&&th.isConnected){paintThumb(th,item);persistSoon()}else if(item.imgNone)persistSoon()});
   });
  });
 }
 function autoHydrate(){
  const desk=document.getElementById('desk');
  if(desk&&typeof cur!=='undefined')hydrate(desk,cur);
 }

 /* ---------- seletor de itens (cartões) ---------- */
 const DEFAULT_DET='Os itens fora de época continuam selecionáveis. Consulte os avisos e combine exceções com o Guardião.';
 let dlg,q,grid,chips,bar,det,io,pk=null;
 const shortSkill=s=>String(s||'').replace(/^Armas de Fogo \((.*)\)$/,'Fogo · $1').replace(/^Lutar \((.*)\)$/,'Lutar · $1');
 function describe(t){
  const parts=[t.name+' — '+t.cat];
  if(t.skill)parts.push('Perícia '+t.skill);
  if(t.damage)parts.push('Dano '+t.damage);
  if(t.range)parts.push('Alcance '+t.range);
  if(t.rate)parts.push('Ataques '+t.rate+'/rodada');
  if(t.capacity)parts.push('Carregador '+t.capacity+(t.ammo?' ('+t.ammo+')':''));
  if(t.uses)parts.push(t.uses+' usos');
  if(t.notes)parts.push(t.notes);
  if(t.caution)parts.push('⚠ '+t.caution);
  return parts.join(' · ');
 }
 function ensureDialog(){
  if(dlg)return;
  dlg=document.createElement('dialog');dlg.className='opk eqk';dlg.setAttribute('aria-label','Adicionar equipamento');
  dlg.innerHTML=`<header><h4 id="eqkT">Equipamentos</h4><span class="opk-hb"><button type="button" id="eqkHelpBtn" aria-pressed="false">❔ Ajuda</button><button type="button" class="opk-x" aria-label="Fechar">✕</button></span></header>
<div class="opk-tools"><input id="eqkQ" type="search" placeholder="Buscar item, arma ou perícia…" aria-label="Buscar equipamento" autocomplete="off"></div>
<div id="eqkChips" class="opk-chips"></div>
<div id="eqkGrid" class="opk-grid eqk-grid" role="listbox" aria-label="Itens disponíveis"></div>
<div id="eqkHelp" class="opk-help" tabindex="-1"></div>
<div id="eqkBar" class="eqk-bar" role="alert" hidden></div>
<footer id="eqkDet" class="opk-det"></footer>`;
  document.body.appendChild(dlg);
  q=dlg.querySelector('#eqkQ');grid=dlg.querySelector('#eqkGrid');chips=dlg.querySelector('#eqkChips');bar=dlg.querySelector('#eqkBar');det=dlg.querySelector('#eqkDet');
  const helpBox=dlg.querySelector('#eqkHelp'),helpBtn=dlg.querySelector('#eqkHelpBtn');
  helpBox.innerHTML=`<h5>Época do cenário</h5><p>O ano escolhido na ficha altera os avisos de disponibilidade. Um item pode ainda não existir naquela época ou estar fora de linha; ele continua selecionável, mas pode ser raro ou exigir uma explicação narrativa.</p><h5>Nível de Crédito</h5><p>Cada cartão mostra uma referência de Crédito para acesso legal e plausível. <span class="eq-credit is-ok">Verde</span> indica margem confortável; <span class="eq-credit is-edge">laranja</span> indica que está no limite; <span class="eq-credit is-low">vermelho</span> indica que o Crédito está abaixo da referência. A cor é um alerta, nunca bloqueia a escolha: converse com o Guardião ou justifique o item na backstory.</p><h5>Conjunto e quantidade</h5><p>Cada unidade carregada contribui para a referência de todos os equipamentos: itens simples acrescentam cerca de 2–5 pontos; itens caros ou restritos podem acrescentar 5–15, conforme o Crédito indicado e a categoria. As contribuições se somam. Por isso, levar duas armas ou várias unidades pode elevar também a referência dos itens comuns. Itens personalizados usam o nível definido por quem os criou; sem um nível informado, contam como item de Crédito 0.</p><button type="button" class="opk-back" data-eqk-help-back>← Voltar à lista</button>`;
  const setHelp=(on,returnFocus=true)=>{dlg.classList.toggle('help',on);helpBtn.setAttribute('aria-pressed',String(on));helpBtn.textContent=on?'← Lista':'❔ Ajuda';if(on){helpBox.scrollTop=0;helpBox.focus()}else if(returnFocus&&dlg.open)q.focus()};
  helpBtn.addEventListener('click',()=>setHelp(!dlg.classList.contains('help')));
  helpBox.addEventListener('click',e=>{if(e.target.closest('[data-eqk-help-back]'))setHelp(false)});
  dlg.addEventListener('close',()=>setHelp(false,false));
  q.addEventListener('input',()=>{hideBar();renderGrid()});
  chips.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&pk){pk.cat=b.dataset.c;hideBar();renderChips();renderGrid()}});
  grid.addEventListener('click',e=>{const c=e.target.closest('.eqk-card');if(c)choose(c.dataset.v)});
  const showDet=e=>{const c=e.target.closest('.eqk-card');if(!c)return;det.textContent=c.dataset.d;const hasPointer=Number.isFinite(e.clientX)&&Number.isFinite(e.clientY)&&(e.clientX!==0||e.clientY!==0);window.DynamicInfo?.show(c.dataset.d,hasPointer?e.clientX:NaN,hasPointer?e.clientY:NaN,dlg,c)};
  grid.addEventListener('pointerover',showDet);grid.addEventListener('pointermove',showDet);grid.addEventListener('focusin',showDet);
  grid.addEventListener('pointerleave',()=>window.DynamicInfo?.hide(dlg));grid.addEventListener('focusout',e=>{if(!grid.contains(e.relatedTarget))window.DynamicInfo?.hide(dlg)});
  q.addEventListener('keydown',e=>{if(e.key==='Enter'){const c=grid.querySelector('.eqk-card');if(c)c.click()}});
  bar.addEventListener('click',e=>{
   const b=e.target.closest('[data-eqk]');if(!b||!pk)return;
   const id=pk.pending;hideBar();
   if(b.dataset.eqk==='confirm'&&id){const t=CATALOG.find(x=>x.id===id);if(t)commit(t)}
  });
  dlg.querySelector('.opk-x').onclick=()=>dlg.close();
  dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
  dlg.addEventListener('close',()=>{pk=null;if(io){io.disconnect();io=null}hideBar();window.DynamicInfo?.hide(dlg)});
 }
 function hideBar(){if(bar){bar.hidden=true;bar.innerHTML=''}if(pk)pk.pending=null}
 function renderChips(){
  chips.innerHTML=['',...CATS].map(c=>`<button type="button" data-c="${esc(c)}" aria-pressed="${pk.cat===c}">${c?`${ICON[c]} ${esc(c)}`:'Todas'}</button>`).join('');
 }
 function filtered(){
  const t=norm(q.value.trim());
  return CATALOG.filter(x=>(!pk.cat||x.cat===pk.cat)&&(!t||norm([x.name,x.cat,x.skill,x.damage,x.ammo,x.notes].filter(Boolean).join(' ')).includes(t)))
   .sort((a,b)=>CATS.indexOf(a.cat)-CATS.indexOf(b.cat));
 }
 function cardHtml(t,i,have,p){
  const tags=[];
  if(t.skill)tags.push(shortSkill(t.skill));
  if(t.damage)tags.push('Dano '+t.damage);
  if(t.capacity)tags.push(t.capacity+(t.capacity===1?' tiro':' tiros'));
  if(t.uses)tags.push(t.uses+' usos');
  const era=periodState(p,t),stateClass=era.state==='available'?'':` eqk-${era.state}`,credit=creditStatus(p,t);
  return`<button type="button" class="opk-card eqk-card${stateClass}" role="option" aria-selected="false" data-v="${esc(t.id)}" data-d="${esc(describe(t)+' · '+(era.message||`Disponível em ${yearOf(p)}`)+` · Crédito ${credit.required}% sugerido; personagem ${credit.current}%`)}" style="--d:${Math.min(i,24)*14}ms"><span class="eqk-img${t.imgTransparent?' transparent':''}" data-eqk-img><span class="eq-ph" aria-hidden="true">${icon(t)}</span></span><span class="eqk-body"><span class="oname">${esc(t.name)}</span><span class="os">${esc(t.cat)}</span>${creditBadge(p,t)}${era.state!=='available'?`<span class="eqk-era">${era.state==='retired'?'Saiu de linha · difícil de achar':'Ainda não existia nesta época'}</span>`:''}${tags.length?`<span class="ot">${tags.slice(0,3).map(x=>`<i>${esc(x)}</i>`).join('')}</span>`:''}</span>${have?`<span class="eqk-have" title="Já está na ficha">✔ ×${have}</span>`:''}</button>`;
 }
 function renderGrid(keepScroll){
  if(!pk)return;
  window.DynamicInfo?.hide(dlg);
  const top=keepScroll?grid.scrollTop:0,list=filtered(),owned=ensure(pk.p);
  let html='',last='',i=0;
  const sections=!pk.cat&&new Set(list.map(x=>x.cat)).size>1;
  for(const t of list){
   if(sections&&t.cat!==last){html+=`<h5 class="eqk-sec">${ICON[t.cat]} ${esc(t.cat)}</h5>`;last=t.cat}
   html+=cardHtml(t,i++,owned.filter(x=>x.id===t.id).length,pk.p);
  }
  grid.innerHTML=html||'<p class="opk-none">Nada encontrado. Tente outra palavra ou outra categoria.</p>';
  grid.scrollTop=top;
  if(io)io.disconnect();
  io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){io&&io.unobserve(en.target);loadCardImg(en.target)}}),{root:grid,rootMargin:'160px'});
  grid.querySelectorAll('.eqk-card').forEach(c=>io.observe(c));
  det.textContent=pk.flash?`✔ ${pk.flash} adicionado à ficha. Escolha outro item ou feche a janela.`:`${yearOf(pk.p)} · Os itens fora de época aparecem esmaecidos, mas não ficam bloqueados.`;
 }
 async function loadCardImg(card){
  const t=CATALOG.find(x=>x.id===card.dataset.v),box=card.querySelector('[data-eqk-img]');if(!t||!box)return;
  const local=localImagePaths(t);let urls=local.length?local:cachedUrls(t);if(!urls.length)urls=(await findImages(t)).urls;
  if(!urls.length||!box.isConnected)return;
  const show=im=>{if(!box.isConnected)return;im.className='eqk-foreground';if(t.imgTransparent){box.replaceChildren(im);box.classList.add('has','transparent')}else{const back=im.cloneNode();back.className='eqk-backdrop';back.alt='';back.setAttribute('aria-hidden','true');box.replaceChildren(back,im);box.classList.add('has');box.classList.remove('transparent')}};
  const load=async(list,index=0)=>{
   for(let i=index;i<list.length;i++){
    const im=new Image();im.alt='';im.decoding='async';im.referrerPolicy='no-referrer';
    const ok=await new Promise(resolve=>{im.onload=()=>resolve(true);im.onerror=()=>resolve(false);im.src=list[i]});
    if(ok){show(im);return true}
   }
   return false;
  };
  if(!await load(urls)&&local.length){const fallback=(await findImages(t)).urls;await load(fallback)}
 }
 function choose(id){
  const t=CATALOG.find(x=>x.id===id);if(!t||!pk)return;
  const ws=warnings(pk.p,t);
  if(!ws.length){commit(t);return}
  pk.pending=id;
  bar.hidden=false;
  bar.innerHTML=`<div class="eqk-msg"><strong>${esc(t.name)}</strong> ${ws.map(w=>'⚠ '+esc(w)).join(' ')}<small>Os avisos são orientativos e não bloqueiam a escolha. Se necessário, combine com o Guardião ou justifique no histórico do investigador.</small></div><div class="eqk-btns"><button type="button" class="alt" data-eqk="cancel">Cancelar</button><button type="button" data-eqk="confirm">Adicionar mesmo assim</button></div>`;
  bar.querySelector('[data-eqk="confirm"]').focus();
 }
 function commit(t){
  hideBar();pk.opts.onAdd(t.id);pk.flash=t.name;renderGrid(true);
 }
 /* opts: {person, onAdd(id)} — onAdd é quem coloca o item na ficha e redesenha */
 function openPicker(opts){
  ensureDialog();
  pk={p:opts.person,opts,cat:'',flash:'',pending:null};
  dlg.querySelector('#eqkT').textContent='Equipamentos'+(pk.p.nome?' — '+pk.p.nome:'');
  q.value='';hideBar();renderChips();renderGrid();
  dlg.showModal();q.focus();
 }

 /* ---------- ficha: lista de itens do investigador ---------- */
 function customFields(cat,listId='eqSkills'){
  if(cat==='Arma de fogo')return`<label>Perícia<input name="skill" list="${esc(listId)}" value="Armas de Fogo (Pistolas)" required></label><label>Dano<input name="damage" placeholder="1D8+2"></label><label>Alcance<input name="range" placeholder="15 jardas"></label><label>Ataques por rodada<input name="rate" placeholder="1 (até 3)"></label><label>Calibre / munição<input name="ammo" placeholder=".45"></label><label>Capacidade do carregador<input type="number" name="capacity" min="0" value="6"></label><label>Munição na reserva<input type="number" name="reserve" min="0" value="0"></label><label>Falha (00–100)<input type="number" name="mal" min="0" max="100" placeholder="100"></label>`;
  if(cat==='Arma corpo a corpo')return`<label>Perícia<input name="skill" list="${esc(listId)}" value="Lutar (Brigar)" required></label><label>Dano<input name="damage" placeholder="1D6 + BD"></label><label>Alcance<input name="range" placeholder="Toque"></label>`;
  if(cat==='Cura')return`<label>Efeito / uso<input name="effect" placeholder="Ex.: bandagem; Primeiros Socorros pode recuperar 1 PV"></label><label>Perícia necessária<select name="skill"><option value="">Nenhuma / narrativa</option><option>Primeiros Socorros</option><option>Medicina</option></select></label><label>Usos disponíveis<input type="number" name="uses" min="0" value="1"></label>`;
  return`<label>Descrição<input name="description" placeholder="O que é e para que serve"></label>`;
 }
 function itemHtml(p,item){
  const warn=warnings(p,item),isGun=item.kind==='firearm',era=periodState(p,item),eraClass=era.state==='available'?'':` ${era.state}`;
  const skill=item.skill?`<span><b>Perícia</b> ${esc(item.skill)} (${skillValue(p,item.skill)}%)</span>`:'';
  const weaponDetails=(item.damage?`<span><b>Dano</b> ${esc(item.damage)}</span>`:'')+(item.range?`<span><b>Alcance</b> ${esc(item.range)}</span>`:'')+(item.rate?`<span><b>Ataques</b> ${esc(item.rate)}/rodada</span>`:'')+(item.mal!=null?`<span><b>Falha</b> ${esc(item.mal)}</span>`:'');
  const ammo=isGun?`<div class="eq-ammo"><span>Munição ${esc(item.ammo||'')}</span><label>Na arma <input type="number" min="0" max="9999" value="${+item.loaded||0}" data-eq-field="loaded" data-eq-id="${esc(item.uid)}"> / ${+item.capacity||0}</label><button type="button" data-eq-action="shot" data-eq-id="${esc(item.uid)}" title="Gastar uma bala">−1</button><label>Reserva <input type="number" min="0" max="9999" value="${+item.reserve||0}" data-eq-field="reserve" data-eq-id="${esc(item.uid)}"></label><button type="button" data-eq-action="reload" data-eq-id="${esc(item.uid)}" ${(+item.reserve||0)<1||(+item.loaded||0)>=(+item.capacity||0)?'disabled':''}>Recarregar</button><button type="button" data-eq-action="reserve" data-eq-id="${esc(item.uid)}" title="Adicionar 10 cartuchos à reserva">+10 reserva</button></div>`:'';
  const extra=item.kind==='healing'&&item.effect?`<span><b>Efeito</b> ${esc(item.effect)}</span>`:'';
  const uses=item.kind==='healing'?`<div class="eq-uses"><label>Usos <input type="number" min="0" max="9999" value="${+item.uses||0}" data-eq-field="uses" data-eq-id="${esc(item.uid)}"></label><button type="button" data-eq-action="use" data-eq-id="${esc(item.uid)}">−1 uso</button></div>`:'';
  const note=item.notes?`<p class="eq-note">${esc(item.notes)}</p>`:'';
  const warning=warn.length?`<div class="eq-warning" role="status">⚠ ${warn.map(esc).join(' ')}</div>`:'',creditJustification=creditJustificationHtml(p,item);
  return`<article class="eq-item${eraClass}" data-eq-item="${esc(item.uid)}">${thumbHtml(item)}<div class="eq-main"><div class="eq-item-head"><div><strong>${esc(item.name||'Item')}</strong><span class="eq-kind">${esc(item.cat||'Geral')}</span>${creditBadge(p,item)}${era.state!=='available'?`<span class="eq-era-label">${era.state==='retired'?'Fora de linha':'Fora de época'}</span>`:''}</div><button type="button" class="eq-remove danger" data-eq-action="remove" data-eq-id="${esc(item.uid)}" title="Remover item" aria-label="Remover ${esc(item.name)}">×</button></div><div class="eq-meta"><label>Qtd. <input type="number" min="0" max="9999" value="${+item.quantity||0}" data-eq-field="quantity" data-eq-id="${esc(item.uid)}"></label>${skill}${weaponDetails}${item.protection?`<span><b>Efeito</b> ${esc(item.protection)}</span>`:''}</div>${ammo}${uses}${extra?`<div class="eq-meta">${extra}</div>`:''}${note}${warning}${creditJustification}</div></article>`;
 }
 function render(p,i){
  const list=ensure(p),catOpts=CATS.map(c=>`<option>${c}</option>`).join(''),year=yearOf(p);
  const items=list.length?list.map(item=>itemHtml(p,item)).join(''):'<p class="eq-empty">Ainda não há equipamentos. Use “Adicionar equipamento” para escolher no catálogo ou crie um item personalizado.</p>';
  const skillsId=`eqSkills-${i}`;
  return`<section class="eq-panel" data-eq-panel data-i="${i}"><div class="eq-intro"><b>Equipamentos do investigador</b><span>Itens, armas e controle de munição ficam salvos nesta ficha.</span></div><div class="eq-era-control"><label for="eq-year-${i}">Época do cenário</label><select id="eq-year-${i}" data-eq-year data-i="${i}">${EQUIPMENT_YEARS.map(y=>`<option value="${y}"${y===year?' selected':''}>${y}</option>`).join('')}<option value="custom"${EQUIPMENT_YEARS.includes(year)?'':' selected'}>Outro ano…</option></select><input type="number" min="1" max="9999" value="${year}" data-eq-year-custom data-i="${i}" aria-label="Ano personalizado" ${EQUIPMENT_YEARS.includes(year)?'hidden':''}></div><div class="eq-add-row"><button type="button" data-eq-action="open-picker">＋ Adicionar equipamento</button><button type="button" class="alt" data-eq-action="open-custom">✍ Personalizado</button></div><datalist id="${skillsId}">${SKILLS.map(s=>`<option value="${esc(s)}">`).join('')}</datalist><form class="eq-custom" hidden><div class="eq-custom-head"><b>Novo equipamento</b><button type="button" class="alt" data-eq-action="cancel-custom">Cancelar</button></div><div class="eq-custom-grid"><label>Categoria<select name="category" data-eq-custom-category>${catOpts}</select></label><label class="eq-wide">Nome<input name="name" maxlength="90" required placeholder="Nome do item"></label><label>Quantidade<input type="number" name="quantity" min="0" value="1"></label><div class="eq-dynamic-fields" data-eq-custom-fields></div><label>Nível de Crédito sugerido<input type="number" name="creditMin" min="0" max="99" placeholder="Opcional"><small>Use apenas se o acesso ao item for restrito; deixe vazio para não avisar.</small></label><label class="eq-wide">Imagem (URL, opcional)<input type="url" name="img" placeholder="https://… — vazio: busca automática pelo nome"></label><label class="eq-wide">Observações<textarea name="notes" rows="2" maxlength="300" placeholder="Regras combinadas, origem ou explicação narrativa"></textarea></label></div><div class="eq-custom-actions"><button type="button" data-eq-action="save-custom">Adicionar item</button></div></form><div class="eq-list">${items}</div><p class="eq-footnote">As ilustrações locais têm fundo transparente; as imagens de referência externas podem variar.</p></section>`;
 }
 function refreshWarnings(p,root){
  if(!root)return;
  root.querySelectorAll('.eq-item').forEach(el=>{
   const item=find(p,el.dataset.eqItem),host=el.querySelector('.eq-main')||el,box=el.querySelector('.eq-warning');if(!item)return;
   const badge=el.querySelector('.eq-credit');if(badge)badge.outerHTML=creditBadge(p,item);
   const ws=warnings(p,item);
   if(box){if(ws.length)box.textContent='⚠ '+ws.join(' ');else box.remove()}
   else if(ws.length){const w=document.createElement('div');w.className='eq-warning';w.setAttribute('role','status');w.textContent='⚠ '+ws.join(' ');host.appendChild(w)}
   const oldJustification=el.querySelector('.eq-credit-justification'),nextJustification=creditJustificationHtml(p,item);
   if(oldJustification){if(nextJustification)oldJustification.outerHTML=nextJustification;else oldJustification.remove()}
   else if(nextJustification)host.insertAdjacentHTML('beforeend',nextJustification);
   const reload=el.querySelector('[data-eq-action="reload"]');if(reload)reload.disabled=(+item.reserve||0)<1||(+item.loaded||0)>=(+item.capacity||0);
  });
 }
 const addConfirmation=(p,item)=>warnings(p,item);
 function customData(form){const val=n=>form.elements[n]?form.elements[n].value:'';return{category:val('category'),name:val('name'),quantity:val('quantity'),creditMin:val('creditMin'),notes:[val('notes'),val('description')].filter(Boolean).join(' · '),skill:val('skill'),damage:val('damage'),range:val('range'),rate:val('rate'),ammo:val('ammo'),capacity:val('capacity'),reserve:val('reserve'),mal:val('mal'),effect:val('effect'),uses:val('uses'),img:val('img')}}
 function pdfRows(p){return ensure(p).map(x=>{const source=CATALOG.find(t=>t.id===x.id)||{},era=periodState(p,x);return{name:x.name||'Item',category:x.cat||'Geral',quantity:+x.quantity||0,image:x.img||localImagePaths(x)[0]||localImagePaths(source)[0]||'',detail:[x.skill&&`Perícia ${x.skill} (${skillValue(p,x.skill)}%)`,x.damage&&`dano ${x.damage}`,x.range&&`alcance ${x.range}`,x.kind==='firearm'&&`munição ${+x.loaded||0}/${+x.capacity||0} + ${+x.reserve||0} reserva`,x.kind==='firearm'&&x.ammo&&`calibre ${x.ammo}`,x.kind==='healing'&&x.effect&&`efeito ${x.effect}`,x.kind==='healing'&&`usos ${+x.uses||0}`,era.state!=='available'&&era.message,x.protection&&`efeito ${x.protection}`,x.notes].filter(Boolean).join(' · ')}})}
 function plainText(p){const rows=pdfRows(p);return rows.length?'\nEquipamentos:\n'+rows.map(x=>`- ${x.quantity}× ${x.name} [${x.category}]${x.detail?' — '+x.detail:''}`).join('\n'):''}

 /* ---------- ligação com a página (sem depender de alterações no index.html) ---------- */
 document.addEventListener('change',e=>{
  const select=e.target.closest('[data-eq-credit-justification]');if(!select)return;
  const win=select.closest('.win');if(!win||typeof cur==='undefined')return;
  const p=cur[+win.dataset.i],item=p&&find(p,select.dataset.eqId);if(!item)return;
  if(select.value&&CREDIT_JUSTIFICATIONS[select.value])item.creditJustification=select.value;else delete item.creditJustification;
  p.edit=true;if(typeof draw==='function')draw();if(typeof persist==='function')persist();
 });
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-eq-action="open-picker"],[data-eq-action="cycle-img"]');if(!b)return;
  const win=b.closest('.win');if(!win||typeof cur==='undefined')return;
  const p=cur[+win.dataset.i];if(!p)return;
  if(b.dataset.eqAction==='cycle-img'){cycleImage(find(p,b.dataset.eqId),b.closest('[data-eq-thumb]'));return}
  openPicker({person:p,onAdd:id=>{
   if(cur.indexOf(p)<0)return;
   addCatalog(p,id);p.edit=true;
   if(typeof draw==='function')draw();
  }});
 });
 let hydrateT=0;
 const scheduleHydrate=()=>{clearTimeout(hydrateT);hydrateT=setTimeout(autoHydrate,60)};
 document.addEventListener('DOMContentLoaded',()=>{
  const desk=document.getElementById('desk');
  if(desk)new MutationObserver(scheduleHydrate).observe(desk,{childList:true});
  scheduleHydrate();
 });
 addEventListener('online',()=>{failed.clear();scheduleHydrate()});

 window.CthEquipment={catalog:CATALOG,categories:cats,ensure,find,render,addCatalog,addCustom,buildCustom,customFields,customData,warnings,addConfirmation,refreshWarnings,skillValue,pdfRows,plainText,openPicker,hydrate,cycleImage,yearOf,periodState,suggestedCredit};
})();
