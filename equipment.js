/* Catálogo e edição do inventário por investigador. Dados novos ficam dentro de cada ficha. */
(()=>{
 const SKILLS=['Armas de Fogo (Pistolas)','Armas de Fogo (Rifles)','Armas de Fogo (Arco)','Armas de Fogo (Metralhadoras)','Lutar (Brigar)','Lutar (Machado)','Lutar (Chicote)','Arremessar','Primeiros Socorros','Medicina','Psicologia','Dirigir Auto','Outro (escrever)'];
 const CATALOG=[
  {id:'wallet',cat:'Geral',name:'Carteira com identidade',price:null,notes:'Carteira, documentos e identificação.'},
  {id:'notebook',cat:'Geral',name:'Caderno e lápis',price:.25},
  {id:'pen',cat:'Geral',name:'Caneta-tinteiro',price:1.8},
  {id:'flashlight',cat:'Geral',name:'Lanterna elétrica',price:2.4},
  {id:'batteries',cat:'Geral',name:'Pilhas',price:.6},
  {id:'compass',cat:'Geral',name:'Bússola com tampa',price:2.85},
  {id:'binoculars',cat:'Geral',name:'Binóculos',price:28.5},
  {id:'telescope',cat:'Geral',name:'Telescópio portátil',price:3.45},
  {id:'watch',cat:'Geral',name:'Relógio de bolso',price:5.95},
  {id:'camera',cat:'Geral',name:'Câmera fotográfica',price:null},
  {id:'typewriter',cat:'Geral',name:'Máquina de escrever Remington',price:40},
  {id:'dictaphone',cat:'Geral',name:'Ditafone',price:39.95},
  {id:'handcuffs',cat:'Geral',name:'Algemas',price:3.35},
  {id:'rope',cat:'Geral',name:'Corda (50 pés)',price:8.6},
  {id:'crowbar',cat:'Geral',name:'Pé de cabra',price:2.25},
  {id:'tools',cat:'Geral',name:'Estojo de ferramentas',price:14.9},
  {id:'fieldbag',cat:'Geral',name:'Bolsa de lona',price:3.45},
  {id:'canteen',cat:'Geral',name:'Cantíl',price:1.69},
  {id:'matches',cat:'Geral',name:'Fósforos à prova d’água',price:.48},
  {id:'lantern',cat:'Geral',name:'Lanterna a querosene',price:1.3},
  {id:'lockpick',cat:'Geral',name:'Kit de chaveiro',price:7.74,notes:'Ferramentas de precisão para fechaduras.'},
  {id:'shovel',cat:'Geral',name:'Pá',price:.95},
  {id:'umbrella',cat:'Geral',name:'Guarda-chuva',price:1.79},
  {id:'identity',cat:'Geral',name:'Crachá ou distintivo',price:null},
  {id:'camera_flash',cat:'Geral',name:'Flash de magnésio',price:null},
  {id:'map',cat:'Geral',name:'Mapa da região',price:null},
  {id:'medicalcase',cat:'Cura',name:'Maleta médica',price:10.45,notes:'Equipamento de atendimento; não concede cura automática.'},
  {id:'bandage',cat:'Cura',name:'Gaze e bandagens',price:.69,notes:'Primeiros Socorros pode recuperar 1 PV se aplicada em até uma hora da lesão.'},
  {id:'aspirin',cat:'Cura',name:'Aspirina (12 comprimidos)',price:.1,uses:12,notes:'Alívio de sintomas; não recupera PV por si só.'},
  {id:'forceps',cat:'Cura',name:'Pinças médicas',price:3.59},
  {id:'scalpel',cat:'Cura',name:'Jogo de bisturis',price:1.39},
  {id:'thermometer',cat:'Cura',name:'Termômetro clínico',price:.69},
  {id:'syringe',cat:'Cura',name:'Seringas hipodérmicas',price:12.5},
  {id:'alcohol',cat:'Cura',name:'Álcool medicinal',price:.2},
  {id:'crutches',cat:'Cura',name:'Muletas',price:1.59},
  {id:'coat',cat:'Proteção',name:'Casaco pesado',price:null,notes:'Proteção narrativa contra frio e chuva; sem armadura automática.'},
  {id:'gloves',cat:'Proteção',name:'Luvas resistentes',price:null},
  {id:'respirator',cat:'Proteção',name:'Máscara de proteção',price:null},
  {id:'pistol22',cat:'Arma de fogo',name:'Pistola automática .22 Short',skill:'Armas de Fogo (Pistolas)',damage:'1D6',range:'10 jardas',rate:'1 (até 3)',capacity:6,ammo:'.22 Short',mal:100,price:25},
  {id:'derringer25',cat:'Arma de fogo',name:'Derringer .25 (cano único)',skill:'Armas de Fogo (Pistolas)',damage:'1D6',range:'3 jardas',rate:'1',capacity:1,ammo:'.25',mal:100,price:12},
  {id:'revolver32',cat:'Arma de fogo',name:'Revólver .32 / 7,65 mm',skill:'Armas de Fogo (Pistolas)',damage:'1D8',range:'15 jardas',rate:'1 (até 3)',capacity:6,ammo:'.32',mal:100,price:15},
  {id:'auto32',cat:'Arma de fogo',name:'Pistola automática .32 / 7,65 mm',skill:'Armas de Fogo (Pistolas)',damage:'1D8',range:'15 jardas',rate:'1 (até 3)',capacity:8,ammo:'.32',mal:99,price:20},
  {id:'luger',cat:'Arma de fogo',name:'Pistola Luger P08',skill:'Armas de Fogo (Pistolas)',damage:'1D10',range:'15 jardas',rate:'1 (até 3)',capacity:8,ammo:'9 mm',mal:99,price:75},
  {id:'revolver45',cat:'Arma de fogo',name:'Revólver .45',skill:'Armas de Fogo (Pistolas)',damage:'1D10+2',range:'15 jardas',rate:'1 (até 3)',capacity:6,ammo:'.45 Colt',mal:100,price:30},
  {id:'auto45',cat:'Arma de fogo',name:'Pistola automática .45',skill:'Armas de Fogo (Pistolas)',damage:'1D10+2',range:'15 jardas',rate:'1 (até 3)',capacity:7,ammo:'.45',mal:100,price:40},
  {id:'rifle22',cat:'Arma de fogo',name:'Rifle .22 de ferrolho',skill:'Armas de Fogo (Rifles)',damage:'1D6+1',range:'30 jardas',rate:'1',capacity:6,ammo:'.22 Long Rifle',mal:99,price:13},
  {id:'carbine30',cat:'Arma de fogo',name:'Carabina .30 de alavanca',skill:'Armas de Fogo (Rifles)',damage:'2D6',range:'50 jardas',rate:'1',capacity:6,ammo:'.30',mal:98,price:19},
  {id:'leeenfield',cat:'Arma de fogo',name:'Rifle Lee-Enfield .303',skill:'Armas de Fogo (Rifles)',damage:'2D6+4',range:'110 jardas',rate:'1',capacity:10,ammo:'.303',mal:100,price:50},
  {id:'rifle3006',cat:'Arma de fogo',name:'Rifle .30-06 de ferrolho',skill:'Armas de Fogo (Rifles)',damage:'2D6+4',range:'110 jardas',rate:'1',capacity:5,ammo:'.30-06',mal:100,price:75},
  {id:'elephantgun',cat:'Arma de fogo',name:'Rifle para elefantes (cano duplo)',skill:'Armas de Fogo (Rifles)',damage:'3D6+4',range:'100 jardas',rate:'1 ou 2',capacity:2,ammo:'calibre pesado',mal:100,price:400},
  {id:'shotgun12',cat:'Arma de fogo',name:'Espingarda calibre 12 (cano duplo)',skill:'Armas de Fogo (Rifles)',damage:'4D6 / 2D6 / 1D6',range:'10 / 20 / 50 jardas',rate:'1 ou 2',capacity:2,ammo:'calibre 12',mal:100,price:40},
  {id:'shotgun12auto',cat:'Arma de fogo',name:'Espingarda calibre 12 semiautomática',skill:'Armas de Fogo (Rifles)',damage:'4D6 / 2D6 / 1D6',range:'10 / 20 / 50 jardas',rate:'1 (até 2)',capacity:5,ammo:'calibre 12',mal:100,price:45},
  {id:'thompson',cat:'Arma de fogo',name:'Submetralhadora Thompson',skill:'Armas de Fogo (Metralhadoras)',damage:'1D10+2',range:'20 jardas',rate:'1 ou rajada automática',capacity:20,ammo:'.45',mal:96,price:200,caution:'Arma automática rara e normalmente indisponível a civis; confirme a disponibilidade com o Guardião.',notes:'Inclui carregador de 20 cartuchos na configuração de referência.'},
  {id:'crossbow',cat:'Arma de fogo',name:'Besta',skill:'Armas de Fogo (Arco)',damage:'1D8+2',range:'50 jardas',rate:'1 a cada 2 rodadas',capacity:1,ammo:'virote',mal:96,price:10},
  {id:'club',cat:'Arma corpo a corpo',name:'Cassetete / porrete pequeno',skill:'Lutar (Brigar)',damage:'1D6 + BD',range:'Toque',price:3},
  {id:'baseballbat',cat:'Arma corpo a corpo',name:'Porrete grande / taco',skill:'Lutar (Brigar)',damage:'1D8 + BD',range:'Toque',price:3},
  {id:'brassknuckles',cat:'Arma corpo a corpo',name:'Soco-inglês',skill:'Lutar (Brigar)',damage:'1D3+1 + BD',range:'Toque',price:1},
  {id:'knife_small',cat:'Arma corpo a corpo',name:'Faca pequena',skill:'Lutar (Brigar)',damage:'1D4 + BD',range:'Toque',price:2},
  {id:'knife_medium',cat:'Arma corpo a corpo',name:'Faca média',skill:'Lutar (Brigar)',damage:'1D4+2 + BD',range:'Toque',price:2},
  {id:'knife_large',cat:'Arma corpo a corpo',name:'Faca grande / machete',skill:'Lutar (Brigar)',damage:'1D8 + BD',range:'Toque',price:4},
  {id:'hatchet',cat:'Arma corpo a corpo',name:'Machadinha',skill:'Lutar (Machado)',damage:'1D6+1 + BD',range:'Toque',price:3},
  {id:'bullwhip',cat:'Arma corpo a corpo',name:'Chicote',skill:'Lutar (Chicote)',damage:'1D3 + metade do BD',range:'10 pés',price:5},
  {id:'blackjack',cat:'Arma corpo a corpo',name:'Cassetete flexível (blackjack)',skill:'Lutar (Brigar)',damage:'1D8 + BD',range:'Toque',price:2},
  {id:'ammo22short',cat:'Munição',name:'Munição .22 Short (100)',ammo:'.22 Short',price:null,quantity:100},
  {id:'ammo22',cat:'Munição',name:'Munição .22 Long Rifle (100)',ammo:'.22 Long Rifle',price:.54,quantity:100},
  {id:'ammo32',cat:'Munição',name:'Munição .32 (100)',ammo:'.32',price:5.95,quantity:100},
  {id:'ammo25',cat:'Munição',name:'Munição .25 rimfire (100)',ammo:'.25',price:1.34,quantity:100},
  {id:'ammo9mm',cat:'Munição',name:'Munição 9 mm (100)',ammo:'9 mm',price:null,quantity:100},
  {id:'ammo45',cat:'Munição',name:'Munição .45 automática (100)',ammo:'.45',price:4.43,quantity:100},
  {id:'ammo45colt',cat:'Munição',name:'Munição .45 Colt (100)',ammo:'.45 Colt',price:null,quantity:100},
  {id:'ammo12',cat:'Munição',name:'Cartuchos calibre 12 (25)',ammo:'calibre 12',price:.93,quantity:25},
  {id:'ammo20',cat:'Munição',name:'Cartuchos calibre 20 (25)',ammo:'calibre 20',price:.85,quantity:25},
  {id:'ammo303',cat:'Munição',name:'Munição .303 (100)',ammo:'.303',price:null,quantity:100},
  {id:'ammo30',cat:'Munição',name:'Munição .30 (100)',ammo:'.30',price:null,quantity:100},
  {id:'ammo3006',cat:'Munição',name:'Munição .30-06 (100)',ammo:'.30-06',price:7.63,quantity:100}
 ];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=n=>Number.isFinite(+n)?'$'+(+n).toFixed(+n%1?2:0):'—';
 const uid=()=>`eq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
 const ensure=p=>{if(!Array.isArray(p.equipment))p.equipment=[];return p.equipment};
 const find=(p,id)=>ensure(p).find(x=>x.uid===id);
 function skillValue(p,skill){
  const defaults={'Armas de Fogo (Pistolas)':20,'Armas de Fogo (Rifles)':25,'Armas de Fogo (Arco)':15,'Armas de Fogo (Metralhadoras)':10,'Lutar (Brigar)':25,'Lutar (Machado)':15,'Lutar (Chicote)':5,'Arremessar':20,'Primeiros Socorros':30,'Medicina':1,'Psicologia':10,'Dirigir Auto':20};
  return p.sk&&p.sk[skill]!=null?(+p.sk[skill]||0):(defaults[skill]||0);
 }
 function creditFloor(price){if(!Number.isFinite(+price))return 0;if(price>10000)return 99;if(price>=1000)return 90;if(price>=200)return 50;if(price>50)return 10;if(price>5)return 1;return 0}
 function warnings(p,item){
  const out=[];
  if(item.skill&&item.warnSkill!==false){const val=skillValue(p,item.skill);if(val<30)out.push(`Perícia ${item.skill}: ${val}%. É uma chance baixa para usar este item.`)}
  if(item.caution)out.push(item.caution);
  if(item.price!=null){const cr=skillValue(p,'Nível de Crédito'),min=creditFloor(+item.price);if(cr<min)out.push(`O custo de referência (${money(item.price)} nos anos 1920) pode pesar para Crédito ${cr}%; a faixa indicativa seria ${min}% ou mais.`)}
  return out;
 }
 function newItem(template){
  const item={...template,uid:uid(),quantity:template.quantity||1};
  if(item.kind==='firearm'){item.loaded=item.capacity||0;item.reserve=0}
  if(item.kind==='healing'&&item.uses==null)item.uses=item.quantity;
  return item;
 }
 function addCatalog(p,id){const t=CATALOG.find(x=>x.id===id);if(!t)return null;const item=newItem({...t,kind:t.cat==='Arma de fogo'?'firearm':t.cat==='Arma corpo a corpo'?'melee':t.cat==='Cura'?'healing':t.cat==='Munição'?'ammo':t.cat==='Proteção'?'protection':'general'});ensure(p).push(item);return item}
 function buildCustom(data){
  const cat=data.category,kind=cat==='Arma de fogo'?'firearm':cat==='Arma corpo a corpo'?'melee':cat==='Cura'?'healing':cat==='Munição'?'ammo':cat==='Proteção'?'protection':'general';
  const item={uid:uid(),name:data.name.trim(),cat,kind,quantity:data.quantity===''?1:Math.max(0,+data.quantity||0),price:data.price===''?null:Math.max(0,+data.price||0),notes:(data.notes||'').trim(),custom:true};
  if(kind==='firearm'){item.skill=data.skill||'Armas de Fogo (Pistolas)';item.damage=(data.damage||'').trim();item.range=(data.range||'').trim();item.rate=(data.rate||'').trim();item.capacity=Math.max(0,+data.capacity||0);item.loaded=item.capacity;item.reserve=Math.max(0,+data.reserve||0);item.ammo=(data.ammo||'').trim();item.mal=data.mal===''?null:Math.max(0,+data.mal||0)}
  if(kind==='melee'){item.skill=(data.skill||'Lutar (Brigar)').trim();item.damage=(data.damage||'').trim();item.range=(data.range||'Toque').trim()}
  if(kind==='healing'){item.effect=(data.effect||'').trim();item.skill=data.skill||'';item.uses=Math.max(0,+data.uses||1)}
  if(kind==='ammo'){item.ammo=(data.ammo||'').trim()}
  if(kind==='protection'){item.protection=(data.protection||'').trim()}
  return item;
 }
 function addCustom(p,data){const item=buildCustom(data);ensure(p).push(item);return item}
 function cats(){return['Geral','Cura','Proteção','Arma de fogo','Arma corpo a corpo','Munição']}
 function catalogOptions(cat='Geral'){
  return CATALOG.filter(x=>!cat||x.cat===cat).map(x=>`<option value="${esc(x.id)}">${esc(x.name)}${x.price!=null?` · ${money(x.price)}`:''}</option>`).join('')||'<option value="">Nenhum item nesta categoria</option>';
 }
 const ammoKey=s=>String(s||'').trim().toLocaleLowerCase('pt-BR');
 function ammoReserveControl(list,item){
  const sources=list.filter(x=>x.kind==='ammo'&&ammoKey(x.ammo)===ammoKey(item.ammo)&&(+x.quantity||0)>0);
  if(!sources.length)return`<button type="button" data-eq-action="reserve" data-eq-id="${esc(item.uid)}" title="Adicionar 10 cartuchos manualmente à reserva">+10 reserva</button>`;
  return`<label>Estoque <select data-eq-ammo-source="${esc(item.uid)}">${sources.map(x=>`<option value="${esc(x.uid)}">${esc(x.name)} (${+x.quantity||0})</option>`).join('')}</select></label><button type="button" data-eq-action="transfer-ammo" data-eq-id="${esc(item.uid)}" title="Transferir até 10 cartuchos do estoque para esta arma">Puxar +10</button>`;
 }
 function customFields(cat,listId='eqSkills'){
  if(cat==='Arma de fogo')return`<label>Perícia<input name="skill" list="${esc(listId)}" value="Armas de Fogo (Pistolas)" required></label><label>Dano<input name="damage" placeholder="1D8+2"></label><label>Alcance<input name="range" placeholder="15 jardas"></label><label>Ataques por rodada<input name="rate" placeholder="1 (até 3)"></label><label>Calibre / munição<input name="ammo" placeholder=".45"></label><label>Capacidade do carregador<input type="number" name="capacity" min="0" value="6"></label><label>Munição na reserva<input type="number" name="reserve" min="0" value="0"></label><label>Falha (00–100)<input type="number" name="mal" min="0" max="100" placeholder="100"></label>`;
  if(cat==='Arma corpo a corpo')return`<label>Perícia<input name="skill" list="${esc(listId)}" value="Lutar (Brigar)" required></label><label>Dano<input name="damage" placeholder="1D6 + BD"></label><label>Alcance<input name="range" placeholder="Toque"></label>`;
  if(cat==='Cura')return`<label>Efeito / uso<input name="effect" placeholder="Ex.: bandagem; Primeiros Socorros pode recuperar 1 PV"></label><label>Perícia necessária<select name="skill"><option value="">Nenhuma / narrativa</option><option>Primeiros Socorros</option><option>Medicina</option></select></label><label>Usos disponíveis<input type="number" name="uses" min="0" value="1"></label>`;
  if(cat==='Munição')return`<label>Calibre compatível<input name="ammo" placeholder=".45, 12, etc."></label><p class="eq-help">A quantidade representa cartuchos individuais, para facilitar o controle durante a sessão.</p>`;
  if(cat==='Proteção')return`<label>Proteção / efeito<input name="protection" placeholder="Ex.: protege do frio; colete reduz dano conforme o guardião"></label><p class="eq-help">O item registra a regra combinada; não altera PV ou dano automaticamente.</p>`;
  return`<label>Descrição<input name="description" placeholder="O que é e para que serve"></label>`;
 }
 function render(p,i){
  const list=ensure(p),catOpts=cats().map(c=>`<option>${c}</option>`).join('');
  const items=list.length?list.map(item=>{
   const warn=warnings(p,item),isGun=item.kind==='firearm',isAmmo=item.kind==='ammo';
   const skill=item.skill?`<span><b>Perícia</b> ${esc(item.skill)} (${skillValue(p,item.skill)}%)</span>`:'';
   const weaponDetails=(item.damage?`<span><b>Dano</b> ${esc(item.damage)}</span>`:'')+(item.range?`<span><b>Alcance</b> ${esc(item.range)}</span>`:'')+(item.rate?`<span><b>Ataques</b> ${esc(item.rate)}/rodada</span>`:'')+(item.mal!=null?`<span><b>Falha</b> ${esc(item.mal)}</span>`:'');
   const ammo=isGun?`<div class="eq-ammo"><span>Munição ${esc(item.ammo||'')}</span><label>Na arma <input type="number" min="0" max="9999" value="${+item.loaded||0}" data-eq-field="loaded" data-eq-id="${esc(item.uid)}"> / ${+item.capacity||0}</label><button type="button" data-eq-action="shot" data-eq-id="${esc(item.uid)}" title="Gastar uma bala">−1</button><label>Reserva <input type="number" min="0" max="9999" value="${+item.reserve||0}" data-eq-field="reserve" data-eq-id="${esc(item.uid)}"></label><button type="button" data-eq-action="reload" data-eq-id="${esc(item.uid)}" ${(+item.reserve||0)<1||(+item.loaded||0)>=(+item.capacity||0)?'disabled':''}>Recarregar</button>${ammoReserveControl(list,item)}</div>`:'';
   const extra=item.kind==='healing'&&item.effect?`<span><b>Efeito</b> ${esc(item.effect)}</span>`:'';
   const uses=item.kind==='healing'?`<div class="eq-uses"><label>Usos <input type="number" min="0" max="9999" value="${+item.uses||0}" data-eq-field="uses" data-eq-id="${esc(item.uid)}"></label><button type="button" data-eq-action="use" data-eq-id="${esc(item.uid)}">−1 uso</button></div>`:'';
   const note=item.notes?`<p class="eq-note">${esc(item.notes)}</p>`:'';
   const warning=warn.length?`<div class="eq-warning" role="status">⚠ ${warn.map(esc).join(' ')}</div>`:'';
   return`<article class="eq-item" data-eq-item="${esc(item.uid)}"><div class="eq-item-head"><div><strong>${esc(item.name||'Item sem nome')}</strong><span class="eq-kind">${esc(item.cat||'Geral')}</span></div><button type="button" class="eq-remove danger" data-eq-action="remove" data-eq-id="${esc(item.uid)}" title="Remover item" aria-label="Remover ${esc(item.name)}">×</button></div><div class="eq-meta"><label>Qtd. <input type="number" min="0" max="9999" value="${+item.quantity||0}" data-eq-field="quantity" data-eq-id="${esc(item.uid)}"></label>${item.price!=null?`<span><b>Custo ref.</b> ${money(item.price)}</span>`:''}${skill}${weaponDetails}${isAmmo?`<span><b>Calibre</b> ${esc(item.ammo||'não definido')}</span>`:''}${item.protection?`<span><b>Efeito</b> ${esc(item.protection)}</span>`:''}</div>${ammo}${uses}${extra?`<div class="eq-meta">${extra}</div>`:''}${note}${warning}</article>`;
  }).join(''):'<p class="eq-empty">Ainda não há equipamentos. Adicione um item do catálogo ou crie um item personalizado.</p>';
  const skillsId=`eqSkills-${i}`;
  return`<section class="eq-panel" data-eq-panel data-i="${i}"><div class="eq-intro"><b>Equipamentos do investigador</b><span>Itens e munição ficam salvos nesta ficha. Os custos são referências narrativas dos anos 1920.</span></div><div class="eq-add-row"><label>Categoria<select data-eq-category>${catOpts}</select></label><label class="eq-choice-label">Item<select data-eq-choice>${catalogOptions()}</select></label><button type="button" data-eq-action="add-catalog">＋ Adicionar</button><button type="button" class="alt" data-eq-action="open-custom">＋ Personalizado</button></div><datalist id="${skillsId}">${SKILLS.map(s=>`<option value="${esc(s)}">`).join('')}</datalist><form class="eq-custom" hidden><div class="eq-custom-head"><b>Novo equipamento</b><button type="button" class="alt" data-eq-action="cancel-custom">Cancelar</button></div><div class="eq-custom-grid"><label>Categoria<select name="category" data-eq-custom-category>${catOpts}</select></label><label class="eq-wide">Nome<input name="name" maxlength="90" required placeholder="Nome do item"></label><label>Quantidade<input type="number" name="quantity" min="0" value="1"></label><label>Custo de referência (US$)<input type="number" name="price" min="0" step="0.01" placeholder="Opcional"></label><div class="eq-dynamic-fields" data-eq-custom-fields></div><label class="eq-wide">Observações<textarea name="notes" rows="2" maxlength="300" placeholder="Regras combinadas, origem ou explicação narrativa"></textarea></label></div><div class="eq-custom-actions"><button type="button" data-eq-action="save-custom">Adicionar item</button></div></form><div class="eq-list">${items}</div><p class="eq-footnote">Avisos de perícia e custo são sugestões: converse com o Guardião ou explique a escolha na história. O sistema não bloqueia equipamentos nem aplica cura ou dano automaticamente.</p></section>`;
 }
 function refreshWarnings(p,root){if(!root)return;root.querySelectorAll('.eq-item').forEach(el=>{const item=find(p,el.dataset.eqItem),box=el.querySelector('.eq-warning');if(!item)return;const ws=warnings(p,item);if(box){if(ws.length)box.textContent='⚠ '+ws.join(' ');else box.remove()}else if(ws.length){const w=document.createElement('div');w.className='eq-warning';w.setAttribute('role','status');w.textContent='⚠ '+ws.join(' ');el.appendChild(w)}const reload=el.querySelector('[data-eq-action="reload"]');if(reload)reload.disabled=(+item.reserve||0)<1||(+item.loaded||0)>=(+item.capacity||0)})}
 function addConfirmation(p,item){const list=warnings(p,item);return list}
 function updateCatalog(panel,cat){const s=panel.querySelector('[data-eq-choice]');if(s){s.innerHTML=catalogOptions(cat);s.selectedIndex=0}}
 function customData(form){const val=n=>form.elements[n]?form.elements[n].value:'';return{category:val('category'),name:val('name'),quantity:val('quantity'),price:val('price'),notes:[val('notes'),val('description')].filter(Boolean).join(' · '),skill:val('skill'),damage:val('damage'),range:val('range'),rate:val('rate'),ammo:val('ammo'),capacity:val('capacity'),reserve:val('reserve'),mal:val('mal'),effect:val('effect'),uses:val('uses'),protection:val('protection')}}
 function pdfRows(p){return ensure(p).map(x=>({name:x.name||'Item',category:x.cat||'Geral',quantity:+x.quantity||0,detail:[x.skill&&`Perícia ${x.skill} (${skillValue(p,x.skill)}%)`,x.damage&&`dano ${x.damage}`,x.range&&`alcance ${x.range}`,x.kind==='firearm'&&`munição ${+x.loaded||0}/${+x.capacity||0} + ${+x.reserve||0} reserva`,x.ammo&&`calibre ${x.ammo}`,x.kind==='healing'&&x.effect&&`efeito ${x.effect}`,x.kind==='healing'&&`usos ${+x.uses||0}`,x.protection&&`efeito ${x.protection}`,x.price!=null&&`ref. ${money(x.price)}`,x.notes].filter(Boolean).join(' · ')}))}
 function plainText(p){const rows=pdfRows(p);return rows.length?'\nEquipamentos:\n'+rows.map(x=>`- ${x.quantity}× ${x.name} [${x.category}]${x.detail?' — '+x.detail:''}`).join('\n'):''}
 window.CthEquipment={catalog:CATALOG,categories:cats,ensure,find,render,addCatalog,addCustom,buildCustom,customFields,customData,catalogOptions,updateCatalog,warnings,addConfirmation,refreshWarnings,skillValue,creditFloor,pdfRows,plainText};
})();
