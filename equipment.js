/* Catálogo e edição do inventário por investigador. Dados novos ficam dentro de cada ficha.
   - O catálogo é escolhido num seletor em cartões (busca + categorias), como o de ocupações.
   - Cada item mostra uma imagem de referência buscada na Wikipédia (cache no navegador).
   - Munição não é mais um item: ela é controlada dentro da própria arma de fogo. */
(()=>{
 const SKILLS=['Armas de Fogo (Pistolas)','Armas de Fogo (Rifles)','Armas de Fogo (Arco)','Armas de Fogo (Metralhadoras)','Lutar (Brigar)','Lutar (Machado)','Lutar (Chicote)','Arremessar','Primeiros Socorros','Medicina','Psicologia','Dirigir Auto','Outro (escrever)'];
 const CATS=['Geral','Cura','Arma de fogo','Arma corpo a corpo'];
 const ICON={'Geral':'🎒','Cura':'🩹','Arma de fogo':'🔫','Arma corpo a corpo':'🗡️'};
 /* q = termo de busca (título de artigo da Wikipédia em inglês) usado para achar a imagem de referência */
 const CATALOG=[
  {id:'wallet',cat:'Geral',name:'Carteira com identidade',q:'Wallet',notes:'Carteira, documentos e identificação.'},
  {id:'notebook',cat:'Geral',name:'Caderno e lápis',q:'Pencil'},
  {id:'pen',cat:'Geral',name:'Caneta-tinteiro',q:'Fountain pen'},
  {id:'flashlight',cat:'Geral',name:'Lanterna elétrica',q:'Flashlight'},
  {id:'batteries',cat:'Geral',name:'Pilhas',q:'Battery (electricity)',imgRev:2},
  {id:'compass',cat:'Geral',name:'Bússola com tampa',q:'Compass'},
  {id:'binoculars',cat:'Geral',name:'Binóculos',q:'Binoculars'},
  {id:'telescope',cat:'Geral',name:'Telescópio portátil',q:'Refracting telescope'},
  {id:'watch',cat:'Geral',name:'Relógio de bolso',q:'Pocket watch'},
  {id:'camera',cat:'Geral',name:'Câmera fotográfica',q:'Kodak Brownie'},
  {id:'typewriter',cat:'Geral',name:'Máquina de escrever Remington',q:'Typewriter'},
  {id:'dictaphone',cat:'Geral',name:'Ditafone',q:'Dictaphone',imgRev:2},
  {id:'handcuffs',cat:'Geral',name:'Algemas',q:'Handcuff',imgRev:2},
  {id:'rope',cat:'Geral',name:'Corda (50 pés)',q:'Rope'},
  {id:'crowbar',cat:'Geral',name:'Pé de cabra',q:'Crowbar',imgRev:2},
  {id:'tools',cat:'Geral',name:'Estojo de ferramentas',q:'Toolbox',imgRev:2},
  {id:'fieldbag',cat:'Geral',name:'Bolsa de lona',q:'Duffel bag'},
  {id:'canteen',cat:'Geral',name:'Cantil',q:'Canteen (bottle)'},
  {id:'matches',cat:'Geral',name:'Fósforos à prova d’água',q:'Match'},
  {id:'lantern',cat:'Geral',name:'Lanterna a querosene',q:'Kerosene lamp'},
  {id:'lockpick',cat:'Geral',name:'Kit de chaveiro',q:'Lock picking',notes:'Ferramentas de precisão para fechaduras.'},
  {id:'shovel',cat:'Geral',name:'Pá',q:'Shovel'},
  {id:'umbrella',cat:'Geral',name:'Guarda-chuva',q:'Umbrella'},
  {id:'identity',cat:'Geral',name:'Crachá ou distintivo',q:'Badge'},
  {id:'camera_flash',cat:'Geral',name:'Flash de magnésio',q:'Flash-lamp',imgRev:2},
  {id:'map',cat:'Geral',name:'Mapa da região',q:'Map'},
  {id:'coat',cat:'Geral',name:'Casaco pesado',q:'Overcoat',notes:'Proteção narrativa contra frio e chuva; sem armadura automática.'},
  {id:'gloves',cat:'Geral',name:'Luvas resistentes',q:'Protective glove',imgRev:2},
  {id:'respirator',cat:'Geral',name:'Máscara de proteção',q:'Respirator'},
  {id:'medicalcase',cat:'Cura',name:'Maleta médica',q:'Doctor\'s bag',notes:'Equipamento de atendimento; não concede cura automática.'},
  {id:'bandage',cat:'Cura',name:'Gaze e bandagens',q:'Bandage',notes:'Primeiros Socorros pode recuperar 1 PV se aplicada em até uma hora da lesão.'},
  {id:'aspirin',cat:'Cura',name:'Aspirina (12 comprimidos)',q:'Aspirin',uses:12,notes:'Alívio de sintomas; não recupera PV por si só.'},
  {id:'forceps',cat:'Cura',name:'Pinças médicas',q:'Forceps'},
  {id:'scalpel',cat:'Cura',name:'Jogo de bisturis',q:'Scalpel'},
  {id:'thermometer',cat:'Cura',name:'Termômetro clínico',q:'Medical thermometer'},
  {id:'syringe',cat:'Cura',name:'Seringas hipodérmicas',q:'Hypodermic needle'},
  {id:'alcohol',cat:'Cura',name:'Álcool medicinal',q:'Rubbing alcohol'},
  {id:'crutches',cat:'Cura',name:'Muletas',q:'Crutch',imgRev:2},
  {id:'pistol22',cat:'Arma de fogo',name:'Pistola automática .22 Short',q:'Semi-automatic pistol',skill:'Armas de Fogo (Pistolas)',damage:'1D6',range:'10 jardas',rate:'1 (até 3)',capacity:6,ammo:'.22 Short',mal:100},
  {id:'derringer25',cat:'Arma de fogo',name:'Derringer .25 (cano único)',q:'Derringer',skill:'Armas de Fogo (Pistolas)',damage:'1D6',range:'3 jardas',rate:'1',capacity:1,ammo:'.25',mal:100},
  {id:'revolver32',cat:'Arma de fogo',name:'Revólver .32 / 7,65 mm',q:'Colt Police Positive',skill:'Armas de Fogo (Pistolas)',damage:'1D8',range:'15 jardas',rate:'1 (até 3)',capacity:6,ammo:'.32',mal:100},
  {id:'auto32',cat:'Arma de fogo',name:'Pistola automática .32 / 7,65 mm',q:'Colt Model 1903 Pocket Hammerless',skill:'Armas de Fogo (Pistolas)',damage:'1D8',range:'15 jardas',rate:'1 (até 3)',capacity:8,ammo:'.32',mal:99},
  {id:'luger',cat:'Arma de fogo',name:'Pistola Luger P08',q:'Luger pistol',skill:'Armas de Fogo (Pistolas)',damage:'1D10',range:'15 jardas',rate:'1 (até 3)',capacity:8,ammo:'9 mm',mal:99,creditMin:40,imgRev:2},
  {id:'revolver45',cat:'Arma de fogo',name:'Revólver .45',q:'Colt New Service',skill:'Armas de Fogo (Pistolas)',damage:'1D10+2',range:'15 jardas',rate:'1 (até 3)',capacity:6,ammo:'.45 Colt',mal:100,creditMin:30,imgRev:2},
  {id:'auto45',cat:'Arma de fogo',name:'Pistola automática .45',q:'M1911 pistol',skill:'Armas de Fogo (Pistolas)',damage:'1D10+2',range:'15 jardas',rate:'1 (até 3)',capacity:7,ammo:'.45',mal:100,creditMin:40,imgRev:2},
  {id:'rifle22',cat:'Arma de fogo',name:'Rifle .22 de ferrolho',q:'Bolt action',skill:'Armas de Fogo (Rifles)',damage:'1D6+1',range:'30 jardas',rate:'1',capacity:6,ammo:'.22 Long Rifle',mal:99},
  {id:'carbine30',cat:'Arma de fogo',name:'Carabina .30 de alavanca',q:'Winchester Model 1894',skill:'Armas de Fogo (Rifles)',damage:'2D6',range:'50 jardas',rate:'1',capacity:6,ammo:'.30',mal:98},
  {id:'leeenfield',cat:'Arma de fogo',name:'Rifle Lee-Enfield .303',q:'Lee–Enfield',skill:'Armas de Fogo (Rifles)',damage:'2D6+4',range:'110 jardas',rate:'1',capacity:10,ammo:'.303',mal:100},
  {id:'rifle3006',cat:'Arma de fogo',name:'Rifle .30-06 de ferrolho',q:'M1903 Springfield',skill:'Armas de Fogo (Rifles)',damage:'2D6+4',range:'110 jardas',rate:'1',capacity:5,ammo:'.30-06',mal:100,creditMin:40,imgRev:2},
  {id:'elephantgun',cat:'Arma de fogo',name:'Rifle para elefantes (cano duplo)',q:'Double rifle',skill:'Armas de Fogo (Rifles)',damage:'3D6+4',range:'100 jardas',rate:'1 ou 2',capacity:2,ammo:'calibre pesado',mal:100,creditMin:60,imgRev:2},
  {id:'shotgun12',cat:'Arma de fogo',name:'Espingarda calibre 12 (cano duplo)',q:'Double-barreled shotgun',skill:'Armas de Fogo (Rifles)',damage:'4D6 / 2D6 / 1D6',range:'10 / 20 / 50 jardas',rate:'1 ou 2',capacity:2,ammo:'calibre 12',mal:100},
  {id:'shotgun12auto',cat:'Arma de fogo',name:'Espingarda calibre 12 semiautomática',q:'Browning Auto-5',skill:'Armas de Fogo (Rifles)',damage:'4D6 / 2D6 / 1D6',range:'10 / 20 / 50 jardas',rate:'1 (até 2)',capacity:5,ammo:'calibre 12',mal:100,creditMin:40,imgRev:2},
  {id:'thompson',cat:'Arma de fogo',name:'Submetralhadora Thompson',q:'Thompson submachine gun',skill:'Armas de Fogo (Metralhadoras)',damage:'1D10+2',range:'20 jardas',rate:'1 ou rajada automática',capacity:20,ammo:'.45',mal:96,creditMin:60,imgRev:2,caution:'Arma automática rara e normalmente indisponível a civis; confirme a disponibilidade com o Guardião.',notes:'Inclui carregador de 20 cartuchos na configuração de referência.'},
  {id:'crossbow',cat:'Arma de fogo',name:'Besta',q:'Crossbow',skill:'Armas de Fogo (Arco)',damage:'1D8+2',range:'50 jardas',rate:'1 a cada 2 rodadas',capacity:1,ammo:'virote',mal:96},
  {id:'club',cat:'Arma corpo a corpo',name:'Cassetete / porrete pequeno',q:'Baton (law enforcement)',imgRev:2,skill:'Lutar (Brigar)',damage:'1D6 + BD',range:'Toque'},
  {id:'baseballbat',cat:'Arma corpo a corpo',name:'Porrete grande / taco',q:'Baseball bat',skill:'Lutar (Brigar)',damage:'1D8 + BD',range:'Toque'},
  {id:'brassknuckles',cat:'Arma corpo a corpo',name:'Soco-inglês',q:'Brass knuckles',skill:'Lutar (Brigar)',damage:'1D3+1 + BD',range:'Toque'},
  {id:'knife_small',cat:'Arma corpo a corpo',name:'Faca pequena',q:'Pocketknife',skill:'Lutar (Brigar)',damage:'1D4 + BD',range:'Toque'},
  {id:'knife_medium',cat:'Arma corpo a corpo',name:'Faca média',q:'Hunting knife',skill:'Lutar (Brigar)',damage:'1D4+2 + BD',range:'Toque'},
  {id:'knife_large',cat:'Arma corpo a corpo',name:'Faca grande / machete',q:'Machete',skill:'Lutar (Brigar)',damage:'1D8 + BD',range:'Toque'},
  {id:'hatchet',cat:'Arma corpo a corpo',name:'Machadinha',q:'Hand axe',imgRev:2,skill:'Lutar (Machado)',damage:'1D6+1 + BD',range:'Toque'},
  {id:'bullwhip',cat:'Arma corpo a corpo',name:'Chicote',q:'Bullwhip',skill:'Lutar (Chicote)',damage:'1D3 + metade do BD',range:'10 pés'},
  {id:'blackjack',cat:'Arma corpo a corpo',name:'Cassetete flexível (blackjack)',q:'Blackjack (weapon)',skill:'Lutar (Brigar)',damage:'1D8 + BD',range:'Toque'}
 ];
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
  if(latest&&it.imgRev!==latest.imgRev&&!it.imgManual){it.q=latest.q;it.img='';it.imgNone=false;it.imgI=0;it.imgRev=latest.imgRev}
  return it;
 }
 const ensure=p=>{if(!Array.isArray(p.equipment))p.equipment=[];p.equipment.forEach(migrateItem);return p.equipment};
 const find=(p,id)=>ensure(p).find(x=>x.uid===id);
 function skillValue(p,skill){
  const defaults={'Armas de Fogo (Pistolas)':20,'Armas de Fogo (Rifles)':25,'Armas de Fogo (Arco)':15,'Armas de Fogo (Metralhadoras)':10,'Lutar (Brigar)':25,'Lutar (Machado)':15,'Lutar (Chicote)':5,'Arremessar':20,'Primeiros Socorros':30,'Medicina':1,'Psicologia':10,'Dirigir Auto':20};
  return p.sk&&p.sk[skill]!=null?(+p.sk[skill]||0):(defaults[skill]||0);
 }
 function warnings(p,item){
  const out=[];
  if(item.skill&&item.warnSkill!==false){const val=skillValue(p,item.skill);if(val<30)out.push(`Perícia ${item.skill}: ${val}%. É uma chance baixa; usar este item pode ser arriscado.`)}
  if(+item.creditMin>0){const credit=skillValue(p,'Nível de Crédito');if(credit<+item.creditMin)out.push(`Nível de Crédito ${credit}% está abaixo do patamar sugerido de ${+item.creditMin}% para este item. Converse com o Guardião ou acrescente uma justificativa narrativa à backstory; você ainda pode escolhê-lo.`)}
  if(item.caution)out.push(item.caution);
  return out;
 }
 function newItem(template){
  const item={...template,uid:uid(),quantity:template.quantity||1};
  if(item.kind==='firearm'){item.loaded=item.capacity||0;item.reserve=0}
  if(item.kind==='healing'&&item.uses==null)item.uses=item.quantity;
  return item;
 }
 function addCatalog(p,id){
  const t=CATALOG.find(x=>x.id===id);if(!t)return null;
  const item=newItem({...t,kind:kindOf(t.cat)});
  const urls=cachedUrls(item);if(urls.length){item.img=urls[0];item.imgI=0}
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
  if(item.img||item.imgNone||item.imgManual||busy.has(item))return;
  busy.add(item);
  try{
   const{urls,error}=await findImages(item);
   if(urls.length){item.imgI=+item.imgI||0;item.img=urls[item.imgI%urls.length]}
   else if(!error)item.imgNone=true;
  }finally{busy.delete(item)}
 }
 async function cycleImage(item,thumb){
  if(!item||item.imgManual)return;
  const{urls}=await findImages(item);if(urls.length<2)return;
  item.imgI=((+item.imgI||0)+1)%urls.length;item.img=urls[item.imgI];item.imgNone=false;
  if(thumb&&thumb.isConnected)paintThumb(thumb,item);
  persistSoon();
 }
 function thumbInner(item){
  const img=item.img?`<img class="eq-thumb-backdrop" src="${esc(item.img)}" alt="" aria-hidden="true" loading="lazy" decoding="async" referrerpolicy="no-referrer"><img class="eq-thumb-foreground" src="${esc(item.img)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`:`<span class="eq-ph" aria-hidden="true">${icon(item)}</span>`;
  const cyc=item.img&&!item.imgManual?`<button type="button" class="eq-cycle" data-eq-action="cycle-img" data-eq-id="${esc(item.uid)}" title="Trocar a imagem de referência" aria-label="Trocar a imagem de referência">↻</button>`:'';
  return img+cyc;
 }
 const thumbHtml=item=>`<div class="eq-thumb${item.img?' has':''}" data-eq-thumb="${esc(item.uid)}">${thumbInner(item)}</div>`;
 function wireThumb(th,item){
  const im=th.querySelector('.eq-thumb-foreground');if(!im||im.dataset.wired)return;im.dataset.wired='1';
  im.addEventListener('error',()=>{
   item.img='';
   if(item.imgManual){item.imgManual=false;item.imgNone=false}else item.imgNone=true;
   if(th.isConnected)paintThumb(th,item);persistSoon();
  },{once:true});
 }
 function paintThumb(th,item){th.classList.toggle('has',!!item.img);th.innerHTML=thumbInner(item);wireThumb(th,item)}
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
 const DEFAULT_DET='Passe o mouse (ou foque) sobre um item para ver os detalhes. Imagens de referência buscadas na Wikipédia.';
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
  dlg.innerHTML=`<header><h4 id="eqkT">Equipamentos</h4><span class="opk-hb"><button type="button" class="opk-x" aria-label="Fechar">✕</button></span></header>
<div class="opk-tools"><input id="eqkQ" type="search" placeholder="Buscar item, arma ou perícia…" aria-label="Buscar equipamento" autocomplete="off"></div>
<div id="eqkChips" class="opk-chips"></div>
<div id="eqkGrid" class="opk-grid eqk-grid" role="listbox" aria-label="Itens disponíveis"></div>
<div id="eqkBar" class="eqk-bar" role="alert" hidden></div>
<footer id="eqkDet" class="opk-det"></footer>`;
  document.body.appendChild(dlg);
  q=dlg.querySelector('#eqkQ');grid=dlg.querySelector('#eqkGrid');chips=dlg.querySelector('#eqkChips');bar=dlg.querySelector('#eqkBar');det=dlg.querySelector('#eqkDet');
  q.addEventListener('input',()=>{hideBar();renderGrid()});
  chips.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&pk){pk.cat=b.dataset.c;hideBar();renderChips();renderGrid()}});
  grid.addEventListener('click',e=>{const c=e.target.closest('.eqk-card');if(c)choose(c.dataset.v)});
  const showDet=e=>{const c=e.target.closest('.eqk-card');if(c)det.textContent=c.dataset.d};
  grid.addEventListener('mouseover',showDet);grid.addEventListener('focusin',showDet);
  q.addEventListener('keydown',e=>{if(e.key==='Enter'){const c=grid.querySelector('.eqk-card');if(c)c.click()}});
  bar.addEventListener('click',e=>{
   const b=e.target.closest('[data-eqk]');if(!b||!pk)return;
   const id=pk.pending;hideBar();
   if(b.dataset.eqk==='confirm'&&id){const t=CATALOG.find(x=>x.id===id);if(t)commit(t)}
  });
  dlg.querySelector('.opk-x').onclick=()=>dlg.close();
  dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
  dlg.addEventListener('close',()=>{pk=null;if(io){io.disconnect();io=null}hideBar()});
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
 function cardHtml(t,i,have){
  const tags=[];
  if(t.skill)tags.push(shortSkill(t.skill));
  if(t.damage)tags.push('Dano '+t.damage);
  if(t.capacity)tags.push(t.capacity+(t.capacity===1?' tiro':' tiros'));
  if(t.uses)tags.push(t.uses+' usos');
  return`<button type="button" class="opk-card eqk-card" role="option" aria-selected="false" data-v="${esc(t.id)}" data-d="${esc(describe(t))}" style="--d:${Math.min(i,24)*14}ms"><span class="eqk-img" data-eqk-img><span class="eq-ph" aria-hidden="true">${icon(t)}</span></span><span class="eqk-body"><span class="oname">${esc(t.name)}</span><span class="os">${esc(t.cat)}</span>${tags.length?`<span class="ot">${tags.slice(0,3).map(x=>`<i>${esc(x)}</i>`).join('')}</span>`:''}</span>${have?`<span class="eqk-have" title="Já está na ficha">✔ ×${have}</span>`:''}</button>`;
 }
 function renderGrid(keepScroll){
  if(!pk)return;
  const top=keepScroll?grid.scrollTop:0,list=filtered(),owned=ensure(pk.p);
  let html='',last='',i=0;
  const sections=!pk.cat&&new Set(list.map(x=>x.cat)).size>1;
  for(const t of list){
   if(sections&&t.cat!==last){html+=`<h5 class="eqk-sec">${ICON[t.cat]} ${esc(t.cat)}</h5>`;last=t.cat}
   html+=cardHtml(t,i++,owned.filter(x=>x.id===t.id).length);
  }
  grid.innerHTML=html||'<p class="opk-none">Nada encontrado. Tente outra palavra ou outra categoria.</p>';
  grid.scrollTop=top;
  if(io)io.disconnect();
  io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){io&&io.unobserve(en.target);loadCardImg(en.target)}}),{root:grid,rootMargin:'160px'});
  grid.querySelectorAll('.eqk-card').forEach(c=>io.observe(c));
  det.textContent=pk.flash?`✔ ${pk.flash} adicionado à ficha. Escolha outro item ou feche a janela.`:DEFAULT_DET;
 }
 async function loadCardImg(card){
  const t=CATALOG.find(x=>x.id===card.dataset.v),box=card.querySelector('[data-eqk-img]');if(!t||!box)return;
  let urls=cachedUrls(t);if(!urls.length)urls=(await findImages(t)).urls;
  if(!urls.length||!box.isConnected)return;
  const im=new Image();im.alt='';im.decoding='async';im.referrerPolicy='no-referrer';
  im.onload=()=>{if(box.isConnected){const back=im.cloneNode();back.className='eqk-backdrop';back.alt='';back.setAttribute('aria-hidden','true');im.className='eqk-foreground';box.replaceChildren(back,im);box.classList.add('has')}};
  im.src=urls[0];
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
  const warn=warnings(p,item),isGun=item.kind==='firearm';
  const skill=item.skill?`<span><b>Perícia</b> ${esc(item.skill)} (${skillValue(p,item.skill)}%)</span>`:'';
  const weaponDetails=(item.damage?`<span><b>Dano</b> ${esc(item.damage)}</span>`:'')+(item.range?`<span><b>Alcance</b> ${esc(item.range)}</span>`:'')+(item.rate?`<span><b>Ataques</b> ${esc(item.rate)}/rodada</span>`:'')+(item.mal!=null?`<span><b>Falha</b> ${esc(item.mal)}</span>`:'');
  const ammo=isGun?`<div class="eq-ammo"><span>Munição ${esc(item.ammo||'')}</span><label>Na arma <input type="number" min="0" max="9999" value="${+item.loaded||0}" data-eq-field="loaded" data-eq-id="${esc(item.uid)}"> / ${+item.capacity||0}</label><button type="button" data-eq-action="shot" data-eq-id="${esc(item.uid)}" title="Gastar uma bala">−1</button><label>Reserva <input type="number" min="0" max="9999" value="${+item.reserve||0}" data-eq-field="reserve" data-eq-id="${esc(item.uid)}"></label><button type="button" data-eq-action="reload" data-eq-id="${esc(item.uid)}" ${(+item.reserve||0)<1||(+item.loaded||0)>=(+item.capacity||0)?'disabled':''}>Recarregar</button><button type="button" data-eq-action="reserve" data-eq-id="${esc(item.uid)}" title="Adicionar 10 cartuchos à reserva">+10 reserva</button></div>`:'';
  const extra=item.kind==='healing'&&item.effect?`<span><b>Efeito</b> ${esc(item.effect)}</span>`:'';
  const uses=item.kind==='healing'?`<div class="eq-uses"><label>Usos <input type="number" min="0" max="9999" value="${+item.uses||0}" data-eq-field="uses" data-eq-id="${esc(item.uid)}"></label><button type="button" data-eq-action="use" data-eq-id="${esc(item.uid)}">−1 uso</button></div>`:'';
  const note=item.notes?`<p class="eq-note">${esc(item.notes)}</p>`:'';
  const warning=warn.length?`<div class="eq-warning" role="status">⚠ ${warn.map(esc).join(' ')}</div>`:'';
  return`<article class="eq-item" data-eq-item="${esc(item.uid)}">${thumbHtml(item)}<div class="eq-main"><div class="eq-item-head"><div><strong>${esc(item.name||'Item sem nome')}</strong><span class="eq-kind">${esc(item.cat||'Geral')}</span></div><button type="button" class="eq-remove danger" data-eq-action="remove" data-eq-id="${esc(item.uid)}" title="Remover item" aria-label="Remover ${esc(item.name)}">×</button></div><div class="eq-meta"><label>Qtd. <input type="number" min="0" max="9999" value="${+item.quantity||0}" data-eq-field="quantity" data-eq-id="${esc(item.uid)}"></label>${skill}${weaponDetails}${item.protection?`<span><b>Efeito</b> ${esc(item.protection)}</span>`:''}</div>${ammo}${uses}${extra?`<div class="eq-meta">${extra}</div>`:''}${note}${warning}</div></article>`;
 }
 function render(p,i){
  const list=ensure(p),catOpts=CATS.map(c=>`<option>${c}</option>`).join('');
  const items=list.length?list.map(item=>itemHtml(p,item)).join(''):'<p class="eq-empty">Ainda não há equipamentos. Use “Adicionar equipamento” para escolher no catálogo ou crie um item personalizado.</p>';
  const skillsId=`eqSkills-${i}`;
  return`<section class="eq-panel" data-eq-panel data-i="${i}"><div class="eq-intro"><b>Equipamentos do investigador</b><span>Itens, armas e controle de munição ficam salvos nesta ficha.</span></div><div class="eq-add-row"><button type="button" data-eq-action="open-picker">＋ Adicionar equipamento</button><button type="button" class="alt" data-eq-action="open-custom">✍ Personalizado</button></div><datalist id="${skillsId}">${SKILLS.map(s=>`<option value="${esc(s)}">`).join('')}</datalist><form class="eq-custom" hidden><div class="eq-custom-head"><b>Novo equipamento</b><button type="button" class="alt" data-eq-action="cancel-custom">Cancelar</button></div><div class="eq-custom-grid"><label>Categoria<select name="category" data-eq-custom-category>${catOpts}</select></label><label class="eq-wide">Nome<input name="name" maxlength="90" required placeholder="Nome do item"></label><label>Quantidade<input type="number" name="quantity" min="0" value="1"></label><div class="eq-dynamic-fields" data-eq-custom-fields></div><label>Nível de Crédito sugerido<input type="number" name="creditMin" min="0" max="99" placeholder="Opcional"><small>Use apenas se o acesso ao item for restrito; deixe vazio para não avisar.</small></label><label class="eq-wide">Imagem (URL, opcional)<input type="url" name="img" placeholder="https://… — vazio: busca automática pelo nome"></label><label class="eq-wide">Observações<textarea name="notes" rows="2" maxlength="300" placeholder="Regras combinadas, origem ou explicação narrativa"></textarea></label></div><div class="eq-custom-actions"><button type="button" data-eq-action="save-custom">Adicionar item</button></div></form><div class="eq-list">${items}</div><p class="eq-footnote">Avisos de perícia baixa e restrições especiais são orientativos. Converse com o Guardião ou explique a escolha no histórico; o sistema não bloqueia equipamentos nem aplica cura ou dano automaticamente. Imagens de referência: Wikipédia.</p></section>`;
 }
 function refreshWarnings(p,root){
  if(!root)return;
  root.querySelectorAll('.eq-item').forEach(el=>{
   const item=find(p,el.dataset.eqItem),host=el.querySelector('.eq-main')||el,box=el.querySelector('.eq-warning');if(!item)return;
   const ws=warnings(p,item);
   if(box){if(ws.length)box.textContent='⚠ '+ws.join(' ');else box.remove()}
   else if(ws.length){const w=document.createElement('div');w.className='eq-warning';w.setAttribute('role','status');w.textContent='⚠ '+ws.join(' ');host.appendChild(w)}
   const reload=el.querySelector('[data-eq-action="reload"]');if(reload)reload.disabled=(+item.reserve||0)<1||(+item.loaded||0)>=(+item.capacity||0);
  });
 }
 const addConfirmation=(p,item)=>warnings(p,item);
 function customData(form){const val=n=>form.elements[n]?form.elements[n].value:'';return{category:val('category'),name:val('name'),quantity:val('quantity'),creditMin:val('creditMin'),notes:[val('notes'),val('description')].filter(Boolean).join(' · '),skill:val('skill'),damage:val('damage'),range:val('range'),rate:val('rate'),ammo:val('ammo'),capacity:val('capacity'),reserve:val('reserve'),mal:val('mal'),effect:val('effect'),uses:val('uses'),img:val('img')}}
 function pdfRows(p){return ensure(p).map(x=>({name:x.name||'Item',category:x.cat||'Geral',quantity:+x.quantity||0,detail:[x.skill&&`Perícia ${x.skill} (${skillValue(p,x.skill)}%)`,x.damage&&`dano ${x.damage}`,x.range&&`alcance ${x.range}`,x.kind==='firearm'&&`munição ${+x.loaded||0}/${+x.capacity||0} + ${+x.reserve||0} reserva`,x.kind==='firearm'&&x.ammo&&`calibre ${x.ammo}`,x.kind==='healing'&&x.effect&&`efeito ${x.effect}`,x.kind==='healing'&&`usos ${+x.uses||0}`,x.protection&&`efeito ${x.protection}`,x.notes].filter(Boolean).join(' · ')}))}
 function plainText(p){const rows=pdfRows(p);return rows.length?'\nEquipamentos:\n'+rows.map(x=>`- ${x.quantity}× ${x.name} [${x.category}]${x.detail?' — '+x.detail:''}`).join('\n'):''}

 /* ---------- ligação com a página (sem depender de alterações no index.html) ---------- */
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

 window.CthEquipment={catalog:CATALOG,categories:cats,ensure,find,render,addCatalog,addCustom,buildCustom,customFields,customData,warnings,addConfirmation,refreshWarnings,skillValue,pdfRows,plainText,openPicker,hydrate,cycleImage};
})();
