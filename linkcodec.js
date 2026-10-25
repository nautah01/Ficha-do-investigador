/* Codec do "link da ficha" (sem DOM): deixa o link curto guardando só o que não dá para recalcular.
   Carregado depois de rules.js e antes de share.js. Funções globais:
   - linkCompact(sheet) → objeto compacto ($v:2) pronto para JSON → deflate → base64url;
   - linkExpand(objeto) → ficha "crua" (ainda precisa passar por sanitizeSheet(), o que share.js já faz).
   O que NÃO vai no link, porque é recalculado ao abrir:
   - pisos das perícias que seguem a regra padrão (ensureSkillBudget) e Pontos/avisos de tela;
   - PV, Sanidade, PM, Mov., BD e Corpo quando iguais ao calculado pelos atributos;
   - o texto do histórico (já está dentro do Backstory) e a assinatura de "sortear atributos";
   - itens do catálogo: vai só o id (mais o que o jogador alterou, como munição ou quantidade).
   Perícias conhecidas viajam como número da lista LINK_SKILLS. ATENÇÃO: essa lista é CONGELADA —
   nunca reordene nem apague nomes; para novas perícias, só acrescente no final (nomes fora da lista
   viajam como texto e continuam funcionando). Links antigos (tags j/z) seguem sendo lidos por share.js. */

const LINK_ATTRS=['FOR','CON','POD','DES','APA','TAM','INT','EDU'];
const LINK_SKILLS=["Antropologia","Armas de Fogo (Arco)","Armas de Fogo (Armas Pesadas)","Armas de Fogo (Lança-chamas)","Armas de Fogo (Metralhadoras)","Armas de Fogo (Pistolas)","Armas de Fogo (Rifles)","Armas de Fogo (Submetralhadora)","Arqueologia","Arremessar","Arte/Ofício (Atuar)","Arte/Ofício (Canto)","Arte/Ofício (Desenho Técnico)","Arte/Ofício (Desenho)","Arte/Ofício (Escultura)","Arte/Ofício (Fotografia)","Arte/Ofício (Instrumento)","Arte/Ofício (Literatura)","Arte/Ofício (outra)","Arte/Ofício (Piano)","Arte/Ofício (Pintura)","Arte/Ofício (Saxofone)","Arte/Ofício (Trabalhos de Fazenda)","Arte/Ofício (Violão)","Arte/Ofício (Violino)","Avaliação","Cavalgar","Charme","Chaveiro","Ciência (Astronomia)","Ciência (Biologia)","Ciência (Botânica)","Ciência (Ciência Forense)","Ciência (Engenharia)","Ciência (Farmácia)","Ciência (Física)","Ciência (Geologia)","Ciência (Matemática)","Ciência (Meteorologia)","Ciência (outra)","Ciência (Química)","Ciência (Zoologia)","Consertos Elétricos","Consertos Mecânicos","Contabilidade","Direito","Dirigir Auto","Disfarce","Eletrônica","Encontrar","Escalar","Escutar","Esquivar","Furtividade","História","Intimidação","Lábia","Língua (outra)","Lutar (Brigar)","Lutar (Chicote)","Lutar (Corrente)","Lutar (Espada)","Lutar (Garrote)","Lutar (Lança)","Lutar (Machado)","Lutar (Mangual)","Lutar (Motosserra)","Medicina","Mitos de Cthulhu","Mundo Natural","Natação","Navegação","Nível de Crédito","Ocultismo","Operar Maquinário","Operar Maquinário Pesado","Persuasão","Pilotar (Aeronaves)","Pilotar (Barcos)","Pilotar (outra)","Prestidigitação","Primeiros Socorros","Psicanálise","Psicologia","Rastrear","Saltar","Sobrevivência","Usar Biblioteca","Usar Computadores","Língua Natural"];
/* campos só de tela/aparelho: nunca vão no link */
const LINK_DROP=new Set(['rolledC','skillNotice','edit','falta','ui','pinned','guide','portrait']);
/* imagens do item: o link não leva as do jogador; as do catálogo voltam sozinhas ao abrir */
const LINK_IMG=new Set(['img','imgPaths','imgSrc','imgI']);
const linkOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const linkSame=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

/* item de catálogo recém-criado (a "referência" contra a qual se compara), ou null */
function linkCatalogRef(id){
 const E=typeof window!=='undefined'&&window.CthEquipment;
 if(!E||!E.catalog||!E.addCatalog||!E.catalog.some(x=>x.id===id))return null;
 try{return E.addCatalog({equipment:[]},id)}catch(_){return null}
}

function linkCompactItem(it){
 if(!it||typeof it!=='object')return null;
 const ref=!it.custom&&typeof it.id==='string'?linkCatalogRef(it.id):null;
 if(!ref){const o={...it};delete o.uid;LINK_IMG.forEach(k=>delete o[k]);return o}
 const diff={},gone=[];
 for(const k of Object.keys(it)){if(k==='uid'||k==='id'||LINK_IMG.has(k))continue;if(!linkOwn(ref,k)||!linkSame(it[k],ref[k]))diff[k]=it[k]}
 for(const k of Object.keys(ref)){if(k==='uid'||k==='id'||LINK_IMG.has(k))continue;if(!linkOwn(it,k))gone.push(k)}
 if(gone.length)diff['-']=gone;
 return Object.keys(diff).length?[it.id,diff]:it.id;
}

function linkCompact(p){
 const q={$v:2},handled=new Set(['c','sk','skillFloors','skillAllocations','der','hist','equipment']);
 for(const k of Object.keys(p)){if(handled.has(k)||LINK_DROP.has(k))continue;q[k]=p[k]}
 for(const k of ['nome','idade','sec','back','occKey'])if(q[k]==='')delete q[k];
 if(q.occKey!==undefined&&q.occKey===q.occ)delete q.occKey;
 if(!q.anyExtra)delete q.anyExtra;
 if(q.skillPoints&&!(+q.skillPoints.available))delete q.skillPoints;
 if(q.budget===false)delete q.budget;
 q.c=LINK_ATTRS.map(k=>+(p.c&&p.c[k])||0);

 /* perícias + pisos + pontos gastos, juntos: [nome|índice, valor, piso|-1, ocupacionais, pessoais, tipo] */
 const sk=p.sk||{},floors=p.skillFloors||{},alloc=p.skillAllocations||{};
 const t={...p,skillFloors:{},skillPoints:{available:0}};ensureSkillBudget(t);const def=t.skillFloors; /* pisos padrão */
 q.$k=Object.keys(sk).map(n=>{
  const at=LINK_SKILLS.indexOf(n),e=[at>=0?at:n,Math.floor(+sk[n])||0];
  const fl=linkOwn(floors,n)&&(Math.max(0,+floors[n]||0)!==def[n])?Math.max(0,+floors[n]||0):-1;
  const a=alloc[n],o=a?Math.max(0,+a.occupational||0):0,pe=a?Math.max(0,+a.personal||0):0,ch=a?(a.choiceType==='any'?'a':a.choiceType==='social'?'s':''):'';
  if(fl>=0||o||pe||ch){e.push(fl);if(o||pe||ch){e.push(o);if(pe||ch){e.push(pe);if(ch)e.push(ch)}}}
  return e;
 });
 const lf={};for(const n of Object.keys(floors))if(!linkOwn(sk,n)&&Math.max(0,+floors[n]||0)!==def[n])lf[n]=Math.max(0,+floors[n]||0);
 if(Object.keys(lf).length)q.skillFloors=lf;
 const la={};for(const n of Object.keys(alloc))if(!linkOwn(sk,n))la[n]=alloc[n];
 if(Object.keys(la).length)q.skillAllocations=la;

 /* PV, Sanidade, PM, Mov., BD e Corpo: só o que difere do calculado pelos atributos (a Sorte sempre vai) */
 const full=calc(Object.fromEntries(LINK_ATTRS.map((k,i)=>[k,q.c[i]]))),d={};
 for(const k of Object.keys(p.der||{}))if(k==='luck'||!linkOwn(full,k)||String(p.der[k])!==String(full[k]))d[k]=p.der[k];
 if(Object.keys(d).length)q.der=d;

 if(Array.isArray(p.hist)&&p.hist.length)q.hist=p.hist.map(h=>{
  const e=[h.kind||'',h.n||''],sk2=Array.isArray(h.sk)?h.sk:[],cm=+h.crMod||0;
  if(sk2.length||cm){e.push(sk2);if(cm)e.push(cm)}
  return e;
 });
 if(Array.isArray(p.equipment)&&p.equipment.length)q.equipment=p.equipment.map(linkCompactItem).filter(x=>x!=null);
 return q;
}

function linkExpandItem(e){
 if(typeof e==='string'||Array.isArray(e)){
  const id=String(Array.isArray(e)?e[0]:e),diff=Array.isArray(e)&&e[1]&&typeof e[1]==='object'?e[1]:{};
  const ref=linkCatalogRef(id),it=ref?{...ref}:{id,name:id,cat:'Geral',kind:'general',quantity:1};
  for(const k of Object.keys(diff))if(k!=='-'&&!BAD_KEYS.has(k))it[k]=diff[k];
  if(Array.isArray(diff['-']))diff['-'].forEach(k=>{if(typeof k==='string')delete it[k]});
  delete it.uid;return it;
 }
 if(e&&typeof e==='object'&&!Array.isArray(e)){const o={...e};delete o.uid;return o}
 return null;
}

function linkExpand(q){
 if(!q||typeof q!=='object'||q.$v!==2)throw new Error('Link inválido.');
 const p={};
 for(const k of Object.keys(q)){if(k==='$v'||k==='$k'||k==='c'||k==='der'||k==='hist'||k==='equipment'||BAD_KEYS.has(k))continue;p[k]=q[k]}
 const arr=Array.isArray(q.c)?q.c:[];
 p.c=Object.fromEntries(LINK_ATTRS.map((k,i)=>[k,+arr[i]||0]));
 const sk={},floors=q.skillFloors&&typeof q.skillFloors==='object'&&!Array.isArray(q.skillFloors)?{...q.skillFloors}:{};
 const alloc=q.skillAllocations&&typeof q.skillAllocations==='object'&&!Array.isArray(q.skillAllocations)?{...q.skillAllocations}:{};
 for(const e of (Array.isArray(q.$k)?q.$k:[]).slice(0,2000)){
  if(!Array.isArray(e))continue;
  const name=typeof e[0]==='number'?LINK_SKILLS[e[0]]:typeof e[0]==='string'?e[0]:'';
  if(!name||BAD_KEYS.has(name))continue;
  sk[name]=+e[1]||0;
  if(e.length>2&&+e[2]>=0)floors[name]=+e[2];
  if(e[3]||e[4]||e[5])alloc[name]={occupational:+e[3]||0,personal:+e[4]||0,...(e[5]==='a'?{choiceType:'any'}:e[5]==='s'?{choiceType:'social'}:{})};
 }
 p.sk=sk;
 if(Object.keys(floors).length)p.skillFloors=floors;
 if(Object.keys(alloc).length||(!q.unlimited&&(q.blank||q.budget)))p.skillAllocations=alloc; /* fichas com orçamento sempre têm o mapa, mesmo vazio */
 p.der={...calc(p.c),...(q.der&&typeof q.der==='object'&&!Array.isArray(q.der)?q.der:{})};
 if(Array.isArray(q.hist))p.hist=q.hist.slice(0,6).filter(Array.isArray).map(e=>({kind:String(e[0]??''),n:String(e[1]??''),t:'',sk:Array.isArray(e[2])?e[2]:[],crMod:+e[3]||0}));
 if(Array.isArray(q.equipment))p.equipment=q.equipment.slice(0,500).map(linkExpandItem).filter(Boolean);
 if(!p.blank&&p.occKey===undefined&&p.occ)p.occKey=p.occ;
 return p;
}
