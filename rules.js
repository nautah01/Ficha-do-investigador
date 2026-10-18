/* Regras e lógica pura da ficha (sem DOM): cálculos, geração, orçamento de pontos. Carregado depois de rules-data.js. */
const d6=()=>1+Math.floor(Math.random()*6),r=n=>Math.floor(Math.random()*n),pick=a=>a[r(a.length)];
const A=()=>Math.min(MAXA,(d6()+d6()+d6())*5),B=()=>Math.min(MAXA,(d6()+d6()+6)*5);
const base=(n,c)=>n==='Esquivar'?c.DES>>1:n==='Língua Natural'?Math.min(MAXS,c.EDU):n.startsWith('Língua (')?1:(BASE[n]??EXTRA[n]??SPECIAL_BASE[n]??(n.startsWith('Arte/Ofício (')?5:n.startsWith('Ciência (')||n.startsWith('Pilotar (')?1:undefined));
/* Bônus de Dano e Corpo pela soma FOR+TAM (livro): até 204 em faixas fixas; acima disso, +1d6 e +1 de Corpo a cada 80 pontos. */
const dbBuild=sum=>{if(sum<65)return['-2',-2];if(sum<85)return['-1',-1];if(sum<125)return['0',0];if(sum<165)return['+1d4',1];if(sum<205)return['+1d6',2];const k=Math.floor((sum-205)/80)+2;return['+'+k+'d6',k+1]};
const calc=c=>{const[db,corpo]=dbBuild((+c.FOR||0)+(+c.TAM||0));
 return{hp:Math.floor((c.CON+c.TAM)/10),san:c.POD,pm:Math.floor(c.POD/5),mov:(c.FOR>c.TAM&&c.DES>c.TAM)?9:(c.FOR<c.TAM&&c.DES<c.TAM)?7:8,db,corpo}};
const tokens=(o,spec)=>{const S=OCC.includes(o)&&SUB[o.n],t=[...o.s];if(!S)return{t,spec:'',crMod:0};const k=spec&&S.o[spec]?spec:pick(Object.keys(S.o));S.at.forEach((ix,j)=>{if(S.o[k][j]!=null)t[ix]=S.o[k][j]});return{t,spec:k,crMod:S.crMod&&S.crMod[k]||0}};
/* escolha feita no seletor (ocupacoes.js): {p:{occ,pick},s:{occ,pick}}; pick = {id} | {none:true} | {custom:true,name,sk:[...]} | vazio = sortear */
function bgFor(slot,oo){
 const B=BG[oo.n];if(!B)return null;const pk=(window.BGSEL||{})[slot],ch=pk&&pk.occ===oo.n?pk.pick:null;
 if(ch&&ch.none)return null;
 if(ch&&ch.custom){const nm=(ch.name||'').trim()||B.kind;return{kind:B.kind,n:nm,sk:(ch.sk||[]).filter(x=>x in BASE).slice(0,2),t:B.kind+': '+nm+'.',crMod:0}}
 const op=(ch&&B.o.find(x=>x.id===ch.id))||pick(B.o);return{kind:B.kind,n:op.n,sk:op.sk,t:op.t,crMod:op.crMod||0};
}
const crFmt=n=>(n>0?'+':'')+n;
function creditBounds(p){
 if(p.unlimited)return null;
 if(p.blank){
  const occupationInfo=occInfoOf(p);
  if(!occupationInfo)return null;
  const total=isAmnesia(p)?amnesiaState(p).usable:occupationPointTotal(occupationInfo.occupation,p.c),mod=occupationInfo.specialization&&SUB[occupationInfo.occupation.n]?.crMod?.[occupationInfo.specialization]||0;
  const max=Math.max(0,Math.min(99,total,occupationInfo.occupation.c[1]+mod));
  return{min:Math.max(0,Math.min(max,occupationInfo.occupation.c[0]+mod)),max};
 }
 const range=p.creditRange;
 if(range&&Array.isArray(range.final)&&range.final.length>=2)return{min:+range.final[0]||0,max:+range.final[1]||0};
 const occ=OCC.find(o=>p.occ===o.n||String(p.occ||'').startsWith(o.n+' ('));
 return occ?{min:occ.c[0],max:occ.c[1]}:null;
}
function occupationFor(value){
 const name=String(value||''),exact=OCC.find(o=>o.n===name);
 if(exact)return{occupation:exact,specialization:''};
 const specialized=name.match(/^(.*) \((.*)\)$/),baseName=specialized?specialized[1]:name,occupation=OCC.find(o=>o.n===baseName);
 return occupation?{occupation,specialization:specialized&&SUB[baseName]?.o[specialized[2]]?specialized[2]:''}:null;
}
function occupationPointTotal(o,c){
 return Math.max(...o.p.split('|').map(f=>f.split('+').reduce((sum,term)=>{const[k,m]=term.split('*');return sum+(+c[k]||0)*(+m||0)},0)));
}
const isAmnesia=p=>!!p&&p.blank&&!p.unlimited&&p.occ==='Amnésia';
/* Fichas em branco normais e fichas geradas (budget) usam o mesmo orçamento: pontos ocupacionais + pessoais. A sem limites não tem orçamento. */
const isBudget=p=>!!p&&!p.unlimited&&!!(p.blank||p.budget);
const occRefOf=p=>p.blank?p.occ:(p.occKey||p.occ);
const occInfoOf=p=>isAmnesia(p)?{occupation:AMNESIA_OCC,specialization:''}:occupationFor(occRefOf(p));
function amn(p){const a=p.amnesia&&typeof p.amnesia==='object'?p.amnesia:(p.amnesia={});if(!Array.isArray(a.frag))a.frag=[];a.released=Math.max(0,Math.floor(+a.released||0));if(typeof a.sealed!=='string')a.sealed='';return a}
function amnesiaState(p){const a=amn(p),full=occupationPointTotal(AMNESIA_OCC,p.c),awake=Math.floor(full/2/5)*5,released=Math.min(Math.max(0,full-awake),a.released);return{full,awake,released,usable:awake+released,sleeping:Math.max(0,full-awake-released)}}
const stripFragments=p=>{p.back=String(p.back||'').split('\n').filter(l=>!l.startsWith(FRAG_TAG)).join('\n').replace(/\n+$/,'')};
const crRangeTxt=p=>{const c=p.creditRange;if(!c||!c.mod)return'';return`faixa ${c.base[0]}–${c.base[1]} ajustada para ${c.final[0]}–${c.final[1]} (${crFmt(c.mod)})`};
const histTxt=p=>{const origins=(p.hist||[]).map(h=>`${h.kind}: ${h.n}`).join(' | '),range=crRangeTxt(p);return[origins?'Histórico: '+origins:'',range?'Nível de Crédito: '+range:'',p.back||''].filter(Boolean).join('\n')};
window.secondaryBlocked=(main,secondary)=>main===secondary||(main==='Soldado'&&secondary==='Oficial Militar');
function gen(sel,sel2,keep){
 const[selN,selSub]=String(sel).split('::'),o=sel==='*'?pick(OCC):OCC.find(x=>x.n===selN),oT=tokens(o,selSub);
 const c=keep&&keep.c?{...keep.c}:rollAttrs();
 const lang=keep&&keep.lang||pick(LANGS),sk={},bs=n=>base(n,c),cu=n=>sk[n]??bs(n);
 const ALL=Object.keys(BASE).filter(n=>n!=='Nível de Crédito'),used=new Set(),keys=[],choiceKinds={};let anyExtra=0; /* vagas ocupacionais que viraram "qualquer perícia" porque todas as alternativas já estavam usadas */
 const res=(t,keep,choiceType)=>{let op=(t==='@soc'?SOC.join('|'):t==='@any'?COMMON.join('|'):t).split('|').map(x=>x==='@lang'?'Língua ('+lang+')':x);
  if(!keep)op=op.filter(x=>!used.has(x));let actualChoiceType=choiceType;if(!op.length){op=ALL.filter(x=>!used.has(x));if(!keep){anyExtra++;actualChoiceType='any'}}const n=pick(op);used.add(n);if(actualChoiceType)choiceKinds[n]=actualChoiceType;return n};
  const isOcc2=sel2.startsWith('occ:'),s2Parts=isOcc2?sel2.slice(4).split('::'):[],s2N=s2Parts[0]||'',s2Spec=s2Parts[1]||'';
 const requestedSec=sel2==='*'?pick(OCC.filter(x=>!window.secondaryBlocked(o.n,x.n))):isOcc2?OCC.find(x=>x.n===s2N):null;
  const sec=requestedSec&&!window.secondaryBlocked(o.n,requestedSec.n)?requestedSec:null,secT=sec?tokens(sec,s2Spec):null;
  const hist=keep&&Array.isArray(keep.hist)?keep.hist:[bgFor('p',o),isOcc2&&sec?bgFor('s',sec):null].filter(Boolean);
  const rawCreditMod=(oT.crMod||0)+(secT?secT.crMod||0:0)+hist.reduce((sum,g)=>sum+(g.crMod||0),0);
  const creditMod=Math.max(-10,Math.min(20,rawCreditMod));
 const occS=oT.t.map(t=>{const k=t[0]==='!',token=k?t.slice(1):t,kind=token==='@any'?'any':token==='@soc'?'social':null,n=res(token,false,kind);if(k)keys.push(n);return n});
 const s2=[],keys2=[];
 if(sec){const hasK=secT.t.some(t=>t[0]==='!');secT.t.forEach((t,i)=>{if(t==='@any')return;const n=res(t.replace(/^!/,''),true);if(!s2.includes(n))s2.push(n);if((t[0]==='!'||(!hasK&&i===0))&&!keys2.includes(n))keys2.push(n)})}
 let occP=Math.max(...o.p.split('|').map(f=>f.split('+').reduce((a,t)=>{const[k,m]=t.split('*');return a+c[k]*m},0)));
  const crMax=Math.max(0,Math.min(99,occP,o.c[1]+creditMod)),crMin=Math.max(0,Math.min(crMax,o.c[0]+creditMod));
  const cr=Math.max(crMin,Math.min(crMax,Math.round((crMin+r(crMax-crMin+1))/5)*5));
 sk['Nível de Crédito']=cr;occP-=cr;
 /* distribui pontos em múltiplos de 5, proporcional ao peso de cada perícia (com um pouco de variação) e respeitando um teto; o que sobra vai de 5 em 5 */
 const dist=(pts,items)=>{
  const it=items.map(i=>({...i,w:i.w*(.8+Math.random()*.4)}));
  for(let pass=0;pass<4&&pts>=5;pass++){
   const act=it.filter(i=>cu(i.n)<i.cap),W=act.reduce((a,i)=>a+i.w,0);if(!act.length)break;const budget=pts;
   act.forEach(i=>{const add=Math.min(Math.floor(budget*i.w/W/5)*5,i.cap-cu(i.n),pts);if(add>0){sk[i.n]=cu(i.n)+add;pts-=add}});
  }
  while(pts>=5){const act=it.filter(i=>cu(i.n)+5<=i.cap);if(!act.length)break;const W=act.reduce((a,i)=>a+i.w,0);let x=Math.random()*W,pk=act[0];for(const a of act){x-=a.w;if(x<=0){pk=a;break}}sk[pk.n]=cu(pk.n)+5;pts-=5}
  return pts};
 /* degraus de nível: as perícias principais (!) sobem primeiro (50→65→75) e as demais da lista ficam em 30-40; só depois o resto é sorteado com pesos */
 const lift=(pts,list,t)=>{let go=true;while(go&&pts>0){go=false;for(const n of list){const inc=Math.min(5,t-cu(n),SKILL_CAP-cu(n));if(inc>0&&pts>=inc){sk[n]=cu(n)+inc;pts-=inc;go=true}}}return pts};
 const tiers=(pts,K,N,T)=>{for(const[w,t]of T)pts=lift(pts,w==='K'?K:N,t);return pts};
 const alloc={},track=(kind,before)=>{for(const n of Object.keys(sk)){const d=sk[n]-(before[n]??bs(n));if(d>0){const entry=alloc[n]=alloc[n]||{occupational:0,personal:0};entry[kind]+=d;if(kind==='occupational'&&choiceKinds[n])entry.choiceType=choiceKinds[n]}}};
  let snap={...sk};
  const K1=[...new Set(occS.filter(n=>keys.includes(n)))],N1=[...new Set(occS)].filter(n=>!K1.includes(n));
 const oi=[...new Set(occS)].map(n=>({n,w:keys.includes(n)?3:1,cap:keys.includes(n)?MAXS:50}));
 occP=tiers(occP,K1,N1,[['K',50],['N',30],['K',65],['N',40],['K',75]]);
 occP=dist(occP,oi);if(occP>=5)occP=dist(occP,oi.map(i=>({...i,cap:MAXS})));
  track('occupational',snap);if(cr>crMin)alloc['Nível de Crédito']={occupational:cr-crMin,personal:0};snap={...sk};
 /* interesses pessoais: 70% vão para a ocupação secundária, cuja perícia-chave é sempre treinada de verdade (45→60→70); o resto vai para hobbies */
 const I=c.INT*2,secP=s2.length?Math.round(I*.7/5)*5:0;let rest=I-secP;
 if(s2.length){const K2=keys2,N2=s2.filter(n=>!K2.includes(n));let left=tiers(secP,K2,N2,[['K',45],['N',30],['K',60],['N',40],['K',70]]);
  const si=s2.map(n=>({n,w:K2.includes(n)?3:1,cap:K2.includes(n)?75:50}));left=dist(left,si);if(left>=5)left=dist(left,si.map(i=>({...i,cap:MAXS})));rest+=left}
 track('personal',snap);snap={...sk};
 const pool=COMMON.filter(n=>!occS.includes(n)&&!s2.includes(n)).sort(()=>Math.random()-.5).slice(0,4);
 const ri=[...pool.map(n=>({n,w:1,cap:55})),...oi.map(i=>({n:i.n,w:keys.includes(i.n)?.5:.8,cap:65}))];
 rest=dist(rest,ri);if(rest>=5)dist(rest,ri.map(i=>({...i,cap:MAXS})));
  track('personal',snap);
 if(sk['Esquivar']===undefined)sk['Esquivar']=bs('Esquivar');
 if(sk['Língua Natural']===undefined)sk['Língua Natural']=bs('Língua Natural');
 const bonus={};hist.forEach(g=>g.sk.forEach(n=>{const old=sk[n]??base(n,c),nw=Math.max(old,Math.min(old+10,85));sk[n]=nw;bonus[n]=(bonus[n]||0)+(nw-old)}));
 const skillFloors=Object.fromEntries(Object.keys(sk).map(n=>[n,n==='Nível de Crédito'?crMin:Math.max(0,+base(n,c)||0)+(bonus[n]||0)]));
 return{hist,back:hist.map(g=>g.t).join('\n'),nome:pick([...NF,...NM])+' '+pick(SN),idade:20+r(20),occ:o.n+(oT.spec?` (${oT.spec})`:''),occKey:o.n+(oT.spec?` (${oT.spec})`:''),budget:true,anyExtra,skillAllocations:alloc,sec:sec?sec.n+(secT.spec?` (${secT.spec})`:''):'',c,sk,skillFloors,skillPoints:{available:0},skillNotice:'',creditRange:{base:[o.c[0],o.c[1]],final:[crMin,crMax],mod:creditMod},edit:false,der:{...calc(c),luck:A()}};
}
function genBlank(unlimited){
 const c={FOR:0,CON:0,POD:0,DES:0,APA:0,TAM:0,INT:0,EDU:0},sk={};
 BLANK_SK.forEach(n=>sk[n]=base(n,c));
 return{nome:'',idade:'',occ:'',sec:'',c,sk,edit:false,pinned:true,blank:true,...(unlimited?{unlimited:true}:{}),der:{hp:0,san:0,luck:0,pm:0,mov:0,db:'0',corpo:0}};
}
const srt=(a,b)=>a.n.localeCompare(b.n,'pt');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=(p,k)=>{const[a,x]=k.split(/:(.+)/);return a==='c'?p.c[x]:a==='d'?(x==='sanMax'?sanMaxOf(p):p.der[x]):a==='n'?p[x]:p.sk[x]??(p.custom&&x in p.custom?p.custom[x]:base(x,p.c))};
function ensureSkillBudget(p){
 p.skillFloors=p.skillFloors&&typeof p.skillFloors==='object'?p.skillFloors:{};
 p.skillPoints=p.skillPoints&&typeof p.skillPoints==='object'?p.skillPoints:{available:0};
 p.skillPoints.available=Math.max(0,Math.floor(+p.skillPoints.available||0));
 for(const n of Object.keys(p.sk||{}))if(!Object.prototype.hasOwnProperty.call(p.skillFloors,n)){
  const cr=n==='Nível de Crédito'?creditBounds(p):null;
  p.skillFloors[n]=p.unlimited?0:cr?cr.min:Math.max(0,+base(n,p.c)||0);
 }
 for(const n of Object.keys(p.custom||{}))if(!Object.prototype.hasOwnProperty.call(p.skillFloors,n))p.skillFloors[n]=p.unlimited?0:Math.max(0,+base(n,p.c)||0,+p.custom[n]||0);
}
const skillFloor=(p,n)=>{
 ensureSkillBudget(p);
 if(p.unlimited)return 0;
 if(Object.prototype.hasOwnProperty.call(p.skillFloors,n))return Math.max(0,+p.skillFloors[n]||0);
 const cr=n==='Nível de Crédito'?creditBounds(p):null;
 return cr?cr.min:Math.max(0,+base(n,p.c)||0);
};
function occupationSkillRules(p){
 const info=occupationFor(occRefOf(p));if(!info)return{any:0,social:false,language:false,names:new Set()};
 const variants=SUB[info.occupation.n];
 const lists=variants?(info.specialization?[tokens(info.occupation,info.specialization).t]:Object.keys(variants.o).map(k=>tokens(info.occupation,k).t)):[info.occupation.s];
 const rules={any:0,social:false,language:false,names:new Set()};
 lists.flat().forEach(raw=>String(raw).replace(/^!/,'').split('|').forEach(name=>{
  if(name==='@any')rules.any++;else if(name==='@soc')rules.social=true;else if(name==='@lang')rules.language=true;else rules.names.add(name.trim());
 }));
 rules.any+=Math.max(0,Math.floor(+p.anyExtra||0)); /* vagas extras de "qualquer perícia" criadas pelo gerador */
 return rules;
}
function occupationChoiceSlots(p){
 if(isAmnesia(p))return{any:0,social:0};
 const info=occInfoOf(p);if(!info)return{any:0,social:0};
 const variants=SUB[info.occupation.n],list=variants&&info.specialization?tokens(info.occupation,info.specialization).t:info.occupation.s;
 const slots={any:0,social:0};
 list.forEach(raw=>{const name=String(raw).replace(/^!/,'');if(name==='@any')slots.any++;else if(name==='@soc')slots.social++});
 slots.any+=Math.max(0,Math.floor(+p.anyExtra||0));
 return slots;
}
function occupationChoiceUsage(p){
 const rules=occupationSkillRules(p),slots=occupationChoiceSlots(p),used={any:0,social:0};
 for(const[n,a]of Object.entries(p.skillAllocations||{})){
  if((+a?.occupational||0)<=0||n==='Nível de Crédito'||rules.names.has(n)||(rules.language&&/^Língua \(/.test(n)))continue;
  let type=a.choiceType;
  if(type!=='any'&&type!=='social')type=SOC.includes(n)&&rules.social&&used.social<slots.social?'social':'any';
  used[type]++;
 }
 return{any:Math.min(slots.any,used.any),social:Math.min(slots.social,used.social)};
}
function occupationChoiceRemaining(p){const total=occupationChoiceSlots(p),used=occupationChoiceUsage(p);return{any:Math.max(0,total.any-used.any),social:Math.max(0,total.social-used.social)}}
function hasExplicitOccupationalSkill(rules,n){return rules.names.has(n)||(rules.language&&/^Língua \(/.test(n))}
function occupationChoiceType(p,n){
 if(isAmnesia(p)||n==='Nível de Crédito')return null;
 const rules=occupationSkillRules(p),entry=p.skillAllocations&&p.skillAllocations[n];
 if(hasExplicitOccupationalSkill(rules,n)||(+entry?.occupational||0)>0)return null;
 const remaining=occupationChoiceRemaining(p);
 if(rules.social&&SOC.includes(n)&&remaining.social>0)return'social';
 if(remaining.any>0)return'any';
 return null;
}
function isSocialChoiceAvailable(p,n){return occupationChoiceType(p,n)==='social'}
function isOccupationalSkill(p,n){
 if(isAmnesia(p))return true;
 const rules=occupationSkillRules(p);
 if(hasExplicitOccupationalSkill(rules,n))return true;
 if((+p.skillAllocations?.[n]?.occupational||0)>0)return true;
 return!!occupationChoiceType(p,n);
}
let occHlCache={key:null,rules:null};
function isOccupationHighlight(p,n){
 if(isAmnesia(p))return n==='Nível de Crédito';
 if(!isBudget(p)||!occupationFor(occRefOf(p)))return false;
 if(n==='Nível de Crédito')return true;
 if(occHlCache.key!==occRefOf(p)){occHlCache={key:occRefOf(p),rules:occupationSkillRules(p)}}
 const rules=occHlCache.rules;
 return hasExplicitOccupationalSkill(rules,n)||(+p.skillAllocations?.[n]?.occupational||0)>0;
}
function blankBudgetState(p){
 ensureSkillBudget(p);
 const info=occInfoOf(p),range=creditBounds(p),creditBase=range?range.min:0;
 const allocations=p.skillAllocations||{};
 const usedOcc=Object.values(allocations).reduce((sum,a)=>sum+(+a.occupational||0),0);
 const usedPersonal=Object.values(allocations).reduce((sum,a)=>sum+(+a.personal||0),0);
 const occupationalTotal=info?Math.max(0,(isAmnesia(p)?amnesiaState(p).usable:occupationPointTotal(info.occupation,p.c))-creditBase):0;
 const personalTotal=Math.max(0,(+p.c.INT||0)*2);
 return{occupational:{total:occupationalTotal,used:usedOcc,available:Math.max(0,occupationalTotal-usedOcc)},personal:{total:personalTotal,used:usedPersonal,available:Math.max(0,personalTotal-usedPersonal)},credit:range};
}
function resetBlankDistribution(p,occupation){
 stripFragments(p);delete p.amnesia;
 p.occ=occupation;p.skillAllocations={};p.skillPoints={available:0};p.skillNotice='';
 ensureSkillBudget(p);
 const range=creditBounds(p);
 for(const n of Object.keys(p.custom||{})){p.custom[n]=Math.max(0,+base(n,p.c)||0);p.skillFloors[n]=p.custom[n]}
 for(const n of Object.keys(p.sk||{})){
  const minimum=n==='Nível de Crédito'&&range?range.min:Math.max(0,+base(n,p.c)||0);
  p.skillFloors[n]=minimum;p.sk[n]=minimum;
 }
}
const fr=(p,k)=>{const v=+get(p,k)||0;return(v>>1)+' / '+Math.floor(v/5)};
const falta=p=>Object.entries({...BASE,...EXTRA,...(p.custom||{})}).filter(([n])=>p.sk[n]===undefined&&!(p.removed&&p.removed[n])).sort((a,b)=>a[0].localeCompare(b[0],'pt'));

/* ===================== Atributos: validação, rolagem e compra de pontos ===================== */
function rollAttrs(){return{FOR:A(),CON:A(),POD:A(),DES:A(),APA:A(),TAM:B(),INT:B(),EDU:B()}}
/* normaliza um atributo para o múltiplo de 5 dentro da faixa de criação; allowEmpty mantém 0 (campo ainda não preenchido) */
function normAttr(k,v,allowEmpty){
 const n=Math.round((+v||0)/5)*5;
 if(!n&&allowEmpty)return 0;
 const[min,max]=ATTR_RANGE[k]||[15,90];
 return Math.max(min,Math.min(max,n));
}
const pointBuyUsed=c=>ATTR_KEYS.reduce((s,k)=>s+(+c[k]||0),0);
function pointBuyValid(c){return ATTR_KEYS.every(k=>{const[a,b]=ATTR_RANGE[k],v=+c[k];return v>=a&&v<=b&&v%5===0})&&pointBuyUsed(c)===POINT_BUY_TOTAL}
/* ponto de partida da compra de pontos: mínimos da faixa; sobram 460 − 195 = 265 pontos */
const pointBuyStart=()=>Object.fromEntries(ATTR_KEYS.map(k=>[k,ATTR_RANGE[k][0]]));

/* ===================== Sanidade máxima (99 − Mitos de Cthulhu) ===================== */
const sanMaxOf=p=>Math.max(0,99-Math.max(0,Math.floor(+(p&&p.sk&&p.sk['Mitos de Cthulhu'])||0)));
/* nome antigo da perícia → nome atual, em todos os mapas da ficha */
function migrateSkillNames(p){
 const MAP={'Mythos de Cthulhu':'Mitos de Cthulhu'};
 for(const key of ['sk','custom','removed','skillFloors','skillAllocations']){
  const d=p&&p[key];if(!d||typeof d!=='object')continue;
  for(const[from,to]of Object.entries(MAP))if(Object.prototype.hasOwnProperty.call(d,from)){if(!Object.prototype.hasOwnProperty.call(d,to))d[to]=d[from];delete d[from]}
 }
 return p;
}
/* teto de uma perícia ao gastar pontos: 75, exceto Nível de Crédito (limite da ocupação) */
function skillCapFor(p,n){if(n==='Nível de Crédito'){const r=creditBounds(p);return r?r.max:99}return SKILL_CAP}

/* ===================== Crédito: gastos, dinheiro e bens (livro, p. 45) ===================== */
const CREDIT_ERA_MULT={classic:1,modern:20};
const creditLevelName=cr=>cr<=0?'Sem recursos':cr<10?'Pobre':cr<50?'Médio':cr<90?'Abastado':cr<99?'Rico':'Podre de rico';
function creditLiving(cr,mult=1){
 cr=Math.max(0,Math.min(99,Math.floor(+cr||0)));
 let spend,cash,assets;
 if(cr===0){spend=.5;cash=.5;assets=0}
 else if(cr<10){spend=2;cash=cr;assets=cr*10}
 else if(cr<50){spend=10;cash=cr*2;assets=cr*50}
 else if(cr<90){spend=50;cash=cr*5;assets=cr*500}
 else if(cr<99){spend=250;cash=cr*20;assets=cr*2000}
 else{spend=5000;cash=50000;assets=5000000}
 return{cr,level:creditLevelName(cr),spend:spend*mult,cash:cash*mult,assets:assets*mult}
}
const fmtMoney=n=>n===0?'—':'$'+(Number.isInteger(n)?n.toLocaleString('en-US'):n.toFixed(2));

/* ===================== Testes de d100 ===================== */
/* 01 = sucesso crítico; 100 (ou 96–100 se a perícia for menor que 50) = falha crítica */
function rollLevel(roll,skill){
 skill=Math.max(0,Math.floor(+skill||0));
 if(roll===1)return'crit';
 if(skill<50?roll>=96:roll===100)return'fumble';
 if(roll<=Math.floor(skill/5))return'extreme';
 if(roll<=Math.floor(skill/2))return'hard';
 if(roll<=skill)return'regular';
 return'fail';
}
const ROLL_LABEL={crit:'Sucesso crítico',extreme:'Sucesso extremo',hard:'Sucesso difícil',regular:'Sucesso normal',fail:'Falha',fumble:'Falha crítica'};

/* ===================== Combate ===================== */
const chancesOf=v=>{v=Math.max(0,Math.floor(+v||0));return{n:v,h:Math.floor(v/2),e:Math.floor(v/5)}};
/* troca "BD" no texto do dano pelo Bônus de Dano real do investigador */
function damageText(dmg,db){
 const s=String(dmg||'');if(!s)return'—';
 const d=String(db??'0').trim().toUpperCase().replace('−','-'),zero=d===''||d==='0';
 if(/metade do BD/i.test(s))return zero?s.replace(/\s*\+\s*metade do BD/i,''):s.replace(/metade do BD/i,'½ BD ('+d+')');
 return s.replace(/\s*\+\s*BD\b/i,zero?'':(d[0]==='-'?' − '+d.slice(1):' '+d));
}
const malfText=m=>m==null||m===''?'—':(+m>=100?'100':m+'–100');

/* ===================== Sanitização de fichas importadas ===================== */
const BAD_KEYS=new Set(['__proto__','constructor','prototype']);
const cleanName=n=>{n=String(n??'').replace(/[<>&"'`\\]/g,'').replace(/\s+/g,' ').trim().slice(0,70);return BAD_KEYS.has(n)?'':n};
const clampInt=(v,min,max)=>{v=Math.floor(+v);return Number.isFinite(v)?Math.max(min,Math.min(max,v)):min};
function deepClean(v,depth=0){
 if(v===null)return null;
 const t=typeof v;
 if(t==='string')return v.slice(0,100000);
 if(t==='number')return Number.isFinite(v)?v:0;
 if(t==='boolean')return v;
 if(depth>8)return null;
 if(Array.isArray(v))return v.slice(0,5000).map(x=>deepClean(x,depth+1));
 if(t==='object'){const o={};for(const k of Object.keys(v)){if(BAD_KEYS.has(k))continue;o[k]=deepClean(v[k],depth+1)}return o}
 return null;
}
function cleanDict(d,max=999){const o={};if(!d||typeof d!=='object'||Array.isArray(d))return o;for(const k of Object.keys(d)){const n=cleanName(k);if(!n)continue;const v=d[k];if(typeof v==='number'||typeof v==='string')o[n]=clampInt(v,0,max)}return o}
const SAFE_IMG=/^(https?:\/\/|equip-images\/|data:image\/(png|jpe?g|webp|gif);base64,)/i;
function cleanItem(it){
 if(!it||typeof it!=='object'||Array.isArray(it))return null;
 const o=deepClean(it);
 o.uid=String(o.uid||'').replace(/[^\w-]/g,'').slice(0,60)||'eq-'+Math.random().toString(36).slice(2,10);
 if(typeof o.img!=='string'||!SAFE_IMG.test(o.img))o.img='';
 if(Array.isArray(o.imgPaths))o.imgPaths=o.imgPaths.filter(x=>typeof x==='string'&&SAFE_IMG.test(x)).slice(0,6);
 return o;
}
/* valida e normaliza uma ficha vinda de fora (backup, arquivo, link); devolve null se não parecer uma ficha */
function sanitizeSheet(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 if(!raw.c||typeof raw.c!=='object'||!raw.sk||typeof raw.sk!=='object')return null;
 const p=deepClean(raw);
 const S=(k,max)=>{p[k]=typeof p[k]==='string'?p[k].slice(0,max):(typeof p[k]==='number'?String(p[k]):'')};
 ['nome','occ','sec','occKey'].forEach(k=>S(k,120));S('back',20000);S('idade',8);
 p.c=Object.fromEntries(ATTR_KEYS.map(k=>[k,clampInt(raw.c[k],0,999)]));
 p.sk=cleanDict(raw.sk);
 for(const k of ['custom','removed','skillFloors'])if(raw[k]!==undefined){p[k]=k==='removed'?Object.fromEntries(Object.keys(cleanDict(raw[k])).map(n=>[n,true])):cleanDict(raw[k])}
 if(raw.skillAllocations&&typeof raw.skillAllocations==='object'){p.skillAllocations={};for(const k of Object.keys(raw.skillAllocations)){const n=cleanName(k),a=raw.skillAllocations[k];if(n&&a&&typeof a==='object')p.skillAllocations[n]={occupational:clampInt(a.occupational,0,999),personal:clampInt(a.personal,0,999),...(a.choiceType==='any'||a.choiceType==='social'?{choiceType:a.choiceType}:{})}}}
 const d=raw.der&&typeof raw.der==='object'?raw.der:{};
 p.der={hp:clampInt(d.hp,0,999),san:clampInt(d.san,0,999),luck:clampInt(d.luck,0,999),pm:clampInt(d.pm,0,999),mov:clampInt(d.mov,0,99),corpo:clampInt(d.corpo,-20,99),db:String(d.db??'0').replace(/[^0-9dD+\-\s]/g,'').slice(0,12)||'0'};
 ['edit','pinned','blank','unlimited','budget'].forEach(k=>{if(k in p)p[k]=!!p[k]});
 const ph=raw.portrait;
 if(ph&&typeof ph==='object'&&typeof ph.src==='string'&&/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(ph.src))p.portrait={src:ph.src,x:+ph.x||0,y:+ph.y||0,zoom:Math.max(1,Math.min(3,+ph.zoom||1))};else delete p.portrait;
 if(raw.ui&&typeof raw.ui==='object'){const u=raw.ui;p.ui={...p.ui,x:clampInt(u.x,0,20000),y:clampInt(u.y,0,20000),w:clampInt(u.w||520,300,2000),z:clampInt(u.z,0,1e6)};if(u.h!=null)p.ui.h=clampInt(u.h,0,5000)}else delete p.ui;
 if(Array.isArray(raw.equipment))p.equipment=raw.equipment.map(cleanItem).filter(Boolean).slice(0,500);else delete p.equipment;
 if(Array.isArray(raw.hist))p.hist=raw.hist.filter(h=>h&&typeof h==='object').slice(0,6).map(h=>({kind:String(h.kind||'').slice(0,60),n:String(h.n||'').slice(0,120),t:String(h.t||'').slice(0,2000),sk:(Array.isArray(h.sk)?h.sk:[]).map(cleanName).filter(Boolean).slice(0,4),crMod:clampInt(h.crMod,-20,20)}));
 if(raw.creditRange&&typeof raw.creditRange==='object'){const cr=raw.creditRange,pair=a=>Array.isArray(a)?[clampInt(a[0],0,99),clampInt(a[1],0,99)]:[0,99];p.creditRange={base:pair(cr.base),final:pair(cr.final),mod:clampInt(cr.mod,-20,20)}}
 if(raw.equipmentYear!==undefined)p.equipmentYear=clampInt(raw.equipmentYear,1,9999);
 migrateSkillNames(p);
 return p;
}
function sanitizeState(d){
 if(!d||typeof d!=='object'||!Array.isArray(d.cur))return null;
 return{cur:d.cur.slice(0,200).map(sanitizeSheet).filter(Boolean),occ:String(d.occ||'').slice(0,120),occ2:String(d.occ2||'').slice(0,160),qty:clampInt(d.qty||1,1,8),zTop:clampInt(d.zTop||20,1,1e6)};
}
