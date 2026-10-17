/* ==========================================================================
   jogo.js — recursos de mesa da Ficha do Investigador (CoC 7E)
   Carregado ANTES do script principal do index.html. Expõe window.CthPlay.
   - Estado atual de jogo (PV, SAN, PM, Sorte) separado dos valores máximos
   - Regras de idade (15–89)
   - Rolador de d100 com dados de bônus/penalidade + marcação de perícias
   - Fase de desenvolvimento (helpers)
   - Campos de história da ficha oficial
   - Sanitização de fichas importadas (JSON de jogador / backup)
   ========================================================================== */
(function(){
'use strict';

const ATTRS=['FOR','CON','TAM','DES','APA','INT','POD','EDU'];
const MYTHOS='Mitos de Cthulhu';
const OLD_MYTHOS='Mythos de Cthulhu';
const FORMAT='cthulhu-investigador';
const VERSION=1;

const num=(v,d=0)=>{v=Math.floor(Number(v));return Number.isFinite(v)?v:d};
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const rnd=n=>Math.floor(Math.random()*n);
const escDefault=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------------------------------------------------------------- perícias */
const skillVal=(p,n)=>{
  if(p.sk&&Object.prototype.hasOwnProperty.call(p.sk,n))return num(p.sk[n]);
  if(p.custom&&Object.prototype.hasOwnProperty.call(p.custom,n))return num(p.custom[n]);
  return 0;
};
const mythos=p=>clamp(skillVal(p,MYTHOS),0,99);
const markable=n=>n!=='Nível de Crédito'&&n!==MYTHOS;

/* renomeia "Mythos de Cthulhu" → "Mitos de Cthulhu" em todos os mapas da ficha */
function migrate(p){
  if(!p||typeof p!=='object')return p;
  for(const key of ['sk','custom','removed','skillFloors','skillAllocations','marks']){
    const m=p[key];
    if(m&&typeof m==='object'&&Object.prototype.hasOwnProperty.call(m,OLD_MYTHOS)){
      if(!Object.prototype.hasOwnProperty.call(m,MYTHOS))m[MYTHOS]=m[OLD_MYTHOS];
      delete m[OLD_MYTHOS];
    }
  }
  return p;
}

/* ------------------------------------------------------------ estado atual */
const LIVE=[['hp','PV'],['san','Sanidade'],['pm','PM'],['luck','Sorte']];
const FLAGS=[['major','Ferimento grave'],['unconscious','Inconsciente'],['dying','Morrendo'],['temp','Insanidade temporária'],['indef','Insanidade indefinida']];

function maxes(p){
  const d=p.der||{};
  return{hp:Math.max(0,num(d.hp)),san:Math.max(0,99-mythos(p)),pm:Math.max(0,num(d.pm)),luck:99};
}
function startOf(p,k){
  const d=p.der||{},mx=maxes(p);
  return k==='san'?Math.min(num(d.san),mx.san):k==='luck'?Math.min(num(d.luck),99):Math.min(num(d[k]),mx[k]);
}
function live(p,k){
  const mx=maxes(p)[k];
  const v=p.live&&p.live[k]!=null?num(p.live[k],startOf(p,k)):startOf(p,k);
  return clamp(v,0,mx);
}
function setLive(p,k,v){
  p.live=p.live&&typeof p.live==='object'?p.live:{};
  p.live[k]=clamp(num(v),0,maxes(p)[k]);
  return p.live[k];
}
const hasLive=p=>!!(p.live&&Object.keys(p.live).length);

function liveInfo(p){
  const mx=maxes(p),san=live(p,'san'),hp=live(p,'hp'),m=mythos(p);
  const half=Math.floor(mx.hp/2);
  const parts=[];
  parts.push(`<span><b>PV</b> · Ferimento grave: um único ataque com dano ≥ <b>${half}</b>${hp<=0?' · <b class="live-alert">0 PV</b>':''}</span>`);
  parts.push(`<span><b>SAN</b> · máx. <b>${mx.san}</b>${m?` (99 − Mitos ${m})`:''} · inicial ${num(p.der&&p.der.san)} · temporária: perda ≥ <b>5</b> de uma vez (teste de INT) · indefinida: perder <b>${Math.max(1,Math.floor(san/5))}</b> ou mais em 1 hora${san<=0?' · <b class="live-alert">Insano</b>':''}</span>`);
  return parts.join('');
}

function liveHtml(p,i,esc){
  esc=esc||escDefault;
  const mx=maxes(p);
  const cards=LIVE.map(([k,l])=>{
    const roll=(k==='san'||k==='luck')?`<button type="button" class="rollb" data-roll="live:${k}" title="Rolar ${l}" aria-label="Rolar ${l}">🎲</button>`:'';
    return`<div class="live-card" data-live-card="${k}"><span class="live-lbl">${l}${roll}</span><div class="live-ctl"><button type="button" class="stepb" data-live-step="${k}:-1" aria-label="Diminuir ${l}">−</button><input class="in live-in" type="number" inputmode="numeric" min="0" max="${mx[k]}" value="${live(p,k)}" data-live="${k}" aria-label="${l} atual"><button type="button" class="stepb" data-live-step="${k}:1" aria-label="Aumentar ${l}">+</button></div><small class="live-max">de <b data-live-max="${k}">${mx[k]}</b></small></div>`;
  }).join('');
  const st=p.status&&typeof p.status==='object'?p.status:{};
  const flags=FLAGS.map(([k,l])=>`<label class="live-flag"><input type="checkbox" data-live-flag="${k}"${st[k]?' checked':''}> ${l}</label>`).join('');
  return`<section class="live-panel" aria-label="Estado de jogo"><div class="live-head"><span>Estado de jogo</span><button type="button" class="alt chip" data-live-reset title="Volta PV, SAN, PM e Sorte aos valores iniciais e limpa as condições">↺ Restaurar tudo</button></div><div class="live-grid">${cards}</div><div class="live-flags">${flags}</div><div class="live-info" data-live-info>${liveInfo(p)}</div></section>`;
}

function liveRefresh(p,el){
  if(!el)return;
  const mx=maxes(p);
  el.querySelectorAll('[data-live]').forEach(inp=>{
    const k=inp.dataset.live;
    inp.max=mx[k];
    if(document.activeElement!==inp)inp.value=live(p,k);
  });
  el.querySelectorAll('[data-live-max]').forEach(b=>{b.textContent=mx[b.dataset.liveMax]});
  el.querySelectorAll('[data-live-flag]').forEach(c=>{c.checked=!!(p.status&&p.status[c.dataset.liveFlag])});
  const info=el.querySelector('[data-live-info]');
  if(info)info.innerHTML=liveInfo(p);
  const m=el.querySelector('[data-mark-count]');
  if(m)m.textContent='('+markCount(p)+')';
  ageRefresh(p,el);
}

function liveText(p){
  if(!hasLive(p))return'';
  const mx=maxes(p);
  return`\nEstado atual: PV ${live(p,'hp')}/${mx.hp} | SAN ${live(p,'san')}/${mx.san} | PM ${live(p,'pm')}/${mx.pm} | Sorte ${live(p,'luck')}`;
}

/* -------------------------------------------------------------------- dados */
function rollD100(mod){
  mod=clamp(num(mod),-2,2);
  const units=rnd(10);
  const tens=Array.from({length:1+Math.abs(mod)},()=>rnd(10)*10);
  const all=tens.map(t=>{const v=t+units;return v===0?100:v});
  const result=mod>0?Math.min(...all):mod<0?Math.max(...all):all[0];
  return{result,all,mod};
}
function classify(r,v){
  v=num(v);
  if(r===1)return{k:'crit',label:'Sucesso Crítico',level:4};
  if(v<50?r>=96:r===100)return{k:'fumble',label:'Falha Crítica',level:0};
  if(r<=Math.floor(v/5))return{k:'extreme',label:'Sucesso Extremo',level:3};
  if(r<=Math.floor(v/2))return{k:'hard',label:'Sucesso Difícil',level:2};
  if(r<=v)return{k:'reg',label:'Sucesso Normal',level:1};
  return{k:'fail',label:'Fracasso',level:0};
}

const LOGS=new WeakMap();
const getLog=p=>{let l=LOGS.get(p);if(!l){l=[];LOGS.set(p,l)}return l};
function pushLog(p,e){const l=getLog(p);l.unshift(e);if(l.length>6)l.length=6}

function entryText(e){
  const mode=e.r.mod?` · ${e.r.mod>0?'bônus':'penalidade'} ×${Math.abs(e.r.mod)} (${e.r.all.join(' / ')})`:'';
  return`${e.label} ${e.val}% (${Math.floor(e.val/2)}/${Math.floor(e.val/5)}) — rolou ${e.r.result}${mode} → ${e.res.label}${e.marked?' · ✓ marcada':''}`;
}
function logHtml(p,esc){
  esc=esc||escDefault;
  const l=getLog(p);
  if(!l.length)return`<li class="roll-hint">Clique em 🎲 numa perícia ou atributo para rolar 1d100. O ✓ marca a perícia para a fase de desenvolvimento.</li>`;
  return l.map(e=>`<li class="r-${e.res.k}">${esc(entryText(e))}</li>`).join('');
}
const markCount=p=>p.marks&&typeof p.marks==='object'?Object.keys(p.marks).filter(n=>p.marks[n]&&markable(n)).length:0;

function rollBarHtml(p,i,esc){
  esc=esc||escDefault;
  const ui=p.ui||{},dice=clamp(num(ui.dice),-2,2);
  const opts=[[-2,'Penalidade ×2'],[-1,'Penalidade ×1'],[0,'Normal'],[1,'Bônus ×1'],[2,'Bônus ×2']]
    .map(([v,l])=>`<option value="${v}"${v===dice?' selected':''}>${l}</option>`).join('');
  return`<div class="roll-bar" data-roll-bar><div class="roll-ctl"><label class="roll-mode"><span>Dados</span><select class="in" data-dice aria-label="Dados de bônus ou penalidade">${opts}</select></label><label class="roll-auto"><input type="checkbox" data-automark${ui.autoMark!==false?' checked':''}> marcar sucessos</label><button type="button" class="alt chip" data-dev title="Rola a melhoria das perícias marcadas (fim da sessão)">📈 Desenvolvimento <b data-mark-count>(${markCount(p)})</b></button></div><ol class="roll-log" data-roll-log aria-live="polite">${logHtml(p,esc)}</ol></div>`;
}
function rollBarRefresh(p,el){
  if(!el)return;
  const log=el.querySelector('[data-roll-log]');
  if(log)log.innerHTML=logHtml(p);
  const m=el.querySelector('[data-mark-count]');
  if(m)m.textContent='('+markCount(p)+')';
  el.querySelectorAll('[data-mark]').forEach(b=>{
    const on=!!(p.marks&&p.marks[b.dataset.mark]);
    b.classList.toggle('on',on);
    b.setAttribute('aria-pressed',on?'true':'false');
  });
}
function rowTools(p,n,esc){
  esc=esc||escDefault;
  const on=!!(p.marks&&p.marks[n]);
  return`<button type="button" class="rollb" data-roll="s:${esc(n)}" title="Rolar ${esc(n)}" aria-label="Rolar ${esc(n)}">🎲</button>`
    +(markable(n)?`<button type="button" class="markb${on?' on':''}" data-mark="${esc(n)}" aria-pressed="${on}" title="Marcar para melhoria" aria-label="Marcar ${esc(n)} para melhoria">✓</button>`:'');
}

let toastTimer=0;
function showRoll(e){
  let t=document.getElementById('rollToast');
  if(!t){
    t=document.createElement('div');t.id='rollToast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');
    document.body.appendChild(t);
  }
  t.className='show r-'+e.res.k;
  t.textContent=entryText(e);
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{t.className=''},7000);
}

/* ------------------------------------------------------------------- idade */
function ageRules(age){
  age=num(age,NaN);
  if(!(age>=15&&age<=89))return null;
  if(age<=19)return{edu:0,eduLoss:5,sizStr:5,phys:0,app:0,mov:0,luck2:true,label:'15–19'};
  if(age<=39)return{edu:1,eduLoss:0,sizStr:0,phys:0,app:0,mov:0,luck2:false,label:'20–39'};
  if(age<=49)return{edu:2,eduLoss:0,sizStr:0,phys:5,app:5,mov:1,luck2:false,label:'40–49'};
  if(age<=59)return{edu:3,eduLoss:0,sizStr:0,phys:10,app:10,mov:2,luck2:false,label:'50–59'};
  if(age<=69)return{edu:4,eduLoss:0,sizStr:0,phys:20,app:15,mov:3,luck2:false,label:'60–69'};
  if(age<=79)return{edu:4,eduLoss:0,sizStr:0,phys:40,app:20,mov:4,luck2:false,label:'70–79'};
  return{edu:4,eduLoss:0,sizStr:0,phys:80,app:25,mov:5,luck2:false,label:'80–89'};
}
function ageText(R){
  if(!R)return'';
  const a=[];
  if(R.eduLoss)a.push(`EDU −${R.eduLoss}`);
  if(R.sizStr)a.push(`perder ${R.sizStr} pontos entre FOR e TAM`);
  if(R.phys)a.push(`perder ${R.phys} pontos entre FOR, CON e DES`);
  if(R.app)a.push(`APA −${R.app}`);
  if(R.mov)a.push(`Mov −${R.mov}`);
  if(R.edu)a.push(`${R.edu} teste${R.edu>1?'s':''} de melhoria de EDU`);
  if(R.luck2)a.push('Sorte: rolar duas vezes e ficar com a maior');
  return`${R.label} anos: ${a.join(' · ')}`;
}
/* Aplica as regras em c (objeto de atributos). Não rola a Sorte (só sinaliza luck2). */
function applyAge(c,age){
  const R=ageRules(age);
  const out={changes:{},mov:0,luck2:false,log:[]};
  if(!R)return out;
  const add=(k,d)=>{
    const b=num(c[k]);let n=Math.max(1,b+d);
    if(d>0)n=Math.min(Math.max(b,99),n);
    c[k]=n;out.changes[k]=(out.changes[k]||0)+(n-b);
  };
  const spend=(keys,total)=>{
    let left=total;
    while(left>0){
      const chunk=Math.min(5,left);
      const ok=keys.filter(k=>num(c[k])-chunk>=1);
      if(!ok.length)break;
      add(ok[rnd(ok.length)],-chunk);left-=chunk;
    }
  };
  const fmt=o=>Object.entries(o).filter(([,v])=>v).map(([k,v])=>`${k} ${v>0?'+':'−'}${Math.abs(v)}`).join(', ');
  if(R.eduLoss){add('EDU',-R.eduLoss);out.log.push(`EDU −${R.eduLoss}`)}
  if(R.sizStr){
    const before={FOR:c.FOR,TAM:c.TAM};
    spend(['FOR','TAM'],R.sizStr);
    out.log.push('Perdas: '+fmt({FOR:num(c.FOR)-num(before.FOR),TAM:num(c.TAM)-num(before.TAM)}));
  }
  if(R.phys){
    const before={FOR:c.FOR,CON:c.CON,DES:c.DES};
    spend(['FOR','CON','DES'],R.phys);
    out.log.push('Perdas: '+fmt({FOR:num(c.FOR)-num(before.FOR),CON:num(c.CON)-num(before.CON),DES:num(c.DES)-num(before.DES)}));
  }
  if(R.app){add('APA',-R.app);out.log.push(`APA −${R.app}`)}
  if(R.mov){out.mov=-R.mov;out.log.push(`Mov −${R.mov}`)}
  for(let n=1;n<=R.edu;n++){
    const r=1+rnd(100),edu=num(c.EDU);
    if(r>edu||r>95){const g=1+rnd(10);add('EDU',g);out.log.push(`Teste de EDU ${n}: rolou ${r} (EDU ${edu}) → +${g}`)}
    else out.log.push(`Teste de EDU ${n}: rolou ${r} (EDU ${edu}) → sem ganho`);
  }
  out.luck2=!!R.luck2;
  return out;
}
function revertAge(c,applied){
  if(!applied||!applied.changes)return;
  for(const [k,d] of Object.entries(applied.changes)){
    if(ATTRS.includes(k))c[k]=clamp(num(c[k])-num(d),0,999);
  }
}
function ageHtml(p,i,esc){
  esc=esc||escDefault;
  const applied=p.ageApplied&&num(p.ageApplied.age)===num(p.idade,-1);
  return`<button type="button" class="alt chip age-btn" data-age-apply title="Aplica as regras de idade do livro (15–19, 20–39, 40+) aos atributos">${applied?'✓ Idade aplicada':'🎂 Regras de idade'}</button>${p.ageNote?`<small class="age-note">${esc(p.ageNote)}</small>`:''}`;
}
function ageRefresh(p,el){
  const b=el&&el.querySelector('[data-age-apply]');
  if(!b)return;
  const applied=p.ageApplied&&num(p.ageApplied.age)===num(p.idade,-1);
  b.textContent=applied?'✓ Idade aplicada':'🎂 Regras de idade';
}

/* ------------------------------------------------------------------ história */
const BIO=[
  ['desc','Descrição pessoal','Aparência, porte, jeito de falar e de se vestir…'],
  ['ideology','Ideologia e crenças','Fé, filosofia política, o que move o investigador…'],
  ['people','Pessoas significativas','Quem importa para ele e por quê…'],
  ['places','Locais significativos','Lugares com valor emocional…'],
  ['treasured','Pertences queridos','O objeto mais valioso para o investigador…'],
  ['traits','Traços','Qualidades e defeitos marcantes…'],
  ['scars','Ferimentos e cicatrizes','Marcas físicas e o que as causou…'],
  ['phobias','Fobias e manias','Medos, tiques e compulsões…'],
  ['tomes','Tomos, feitiços e artefatos','Tomos arcanos lidos, feitiços e artefatos…'],
  ['encounters','Encontros com entidades estranhas','Criaturas e fenômenos já presenciados…']
];
function bioHtml(p,i,esc){
  esc=esc||escDefault;
  const b=p.bio&&typeof p.bio==='object'?p.bio:{};
  const f=BIO.map(([k,l,ph])=>`<label class="bio-field"><span>${l}</span><textarea class="in bio-ta" data-i="${i}" data-k="b:${k}" rows="3" maxlength="3000" placeholder="${esc(ph)}">${esc(b[k]||'')}</textarea></label>`).join('');
  return`<section class="bio-panel"><h3 class="st">Detalhes do investigador</h3><div class="bio-grid">${f}</div></section>`;
}
function bioText(p){
  const b=p.bio&&typeof p.bio==='object'?p.bio:{};
  return BIO.filter(([k])=>String(b[k]||'').trim()).map(([k,l])=>`${l.toUpperCase()}\n${String(b[k]).trim()}`).join('\n\n');
}
function loreText(p){
  return[String(p.back||'').trim(),bioText(p)].filter(Boolean).join('\n\n');
}

/* -------------------------------------------------------------- sanitização */
const BADNAME=/[<>&"'`\\]/g;
const BLOCKED=new Set(['__proto__','constructor','prototype']);
const S=(v,max=3000)=>String(v==null?'':v).slice(0,max);
const cleanName=v=>S(v,80).replace(BADNAME,'').trim();
const N=(v,lo,hi,d=0)=>{v=Math.floor(Number(v));return Number.isFinite(v)?clamp(v,lo,hi):d};

function cleanMap(raw,valFn,maxKeys=500){
  const out={};
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;
  let n=0;
  for(const [k,v] of Object.entries(raw)){
    const name=cleanName(k);
    if(!name||BLOCKED.has(name)||n>=maxKeys)continue;
    const r=valFn(v);
    if(r===undefined)continue;
    out[name]=r;n++;
  }
  return out;
}
function cleanEquip(it){
  if(!it||typeof it!=='object'||Array.isArray(it))return null;
  const o={};
  for(const [k,v] of Object.entries(it)){
    if(BLOCKED.has(k)||k.length>40)continue;
    if(typeof v==='string')o[k]=v.slice(0,1500);
    else if(typeof v==='number'&&Number.isFinite(v))o[k]=v;
    else if(typeof v==='boolean')o[k]=v;
    else if(Array.isArray(v)&&v.length<=12&&v.every(x=>typeof x==='string'))o[k]=v.map(x=>x.slice(0,400));
  }
  const okUrl=u=>/^(equip-images\/|https:\/\/upload\.wikimedia\.org\/|data:image\/(png|jpeg|webp|gif);base64,)/i.test(u);
  for(const k of ['img','imgSrc'])if(typeof o[k]==='string'&&!okUrl(o[k]))delete o[k];
  if(Array.isArray(o.imgPaths))o.imgPaths=o.imgPaths.filter(u=>okUrl(u));
  return o;
}

function sanitize(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('ficha inválida');
  if(!raw.c||typeof raw.c!=='object')throw new Error('atributos ausentes');
  const p={};
  p.nome=S(raw.nome,120);
  p.idade=raw.idade===''||raw.idade==null?'':String(N(raw.idade,0,999,0));
  p.occ=S(raw.occ,120);p.sec=S(raw.sec,120);
  p.c={};for(const k of ATTRS)p.c[k]=N(raw.c[k],0,999,0);
  p.sk=cleanMap(raw.sk,v=>N(v,0,999,0));
  p.custom=cleanMap(raw.custom,v=>N(v,0,999,0));
  p.removed=cleanMap(raw.removed,v=>v?1:undefined);
  p.skillFloors=cleanMap(raw.skillFloors,v=>N(v,0,999,0));
  p.skillAllocations=cleanMap(raw.skillAllocations,v=>(v&&typeof v==='object')?{occupational:N(v.occupational,0,9999,0),personal:N(v.personal,0,9999,0)}:undefined);
  p.marks=cleanMap(raw.marks,v=>v?true:undefined);
  if(raw.skillPoints&&typeof raw.skillPoints==='object')p.skillPoints={available:N(raw.skillPoints.available,-9999,9999,0)};
  p.skillNotice=S(raw.skillNotice,400);
  p.skillBudgetMode=raw.skillBudgetMode==='personal'?'personal':'occupational';
  const d=raw.der&&typeof raw.der==='object'?raw.der:{};
  p.der={hp:N(d.hp,0,999,0),san:N(d.san,0,999,0),luck:N(d.luck,0,999,0),pm:N(d.pm,0,999,0),mov:N(d.mov,0,99,0),corpo:N(d.corpo,-9,99,0),db:S(d.db||'0',12).replace(BADNAME,'')};
  p.back=S(raw.back,12000);
  p.bio={};for(const [k] of BIO)if(raw.bio&&raw.bio[k])p.bio[k]=S(raw.bio[k],3000);
  p.hist=Array.isArray(raw.hist)?raw.hist.slice(0,6).map(g=>({kind:S(g&&g.kind,40),n:S(g&&g.n,120),t:S(g&&g.t,1500),sk:Array.isArray(g&&g.sk)?g.sk.slice(0,12).map(cleanName).filter(Boolean):[],crMod:N(g&&g.crMod,-50,50,0)})):[];
  if(raw.creditRange&&typeof raw.creditRange==='object'){
    const rg=a=>Array.isArray(a)?[N(a[0],0,99,0),N(a[1],0,99,0)]:[0,0];
    p.creditRange={base:rg(raw.creditRange.base),final:rg(raw.creditRange.final),mod:N(raw.creditRange.mod,-99,99,0)};
  }
  if(raw.amnesia&&typeof raw.amnesia==='object'){
    p.amnesia={frag:Array.isArray(raw.amnesia.frag)?raw.amnesia.frag.slice(0,60).map(f=>({id:S(f&&f.id,40).replace(BADNAME,''),t:S(f&&f.t,800),sk:Array.isArray(f&&f.sk)?f.sk.slice(0,6).map(cleanName).filter(Boolean):[]})):[],released:N(raw.amnesia.released,0,99,0),sealed:S(raw.amnesia.sealed,1500)};
  }
  for(const k of ['falta','edit','pinned','blank','unlimited','rolledC'])if(raw[k]!=null)p[k]=!!raw[k];
  if(raw.portrait&&typeof raw.portrait==='object'&&typeof raw.portrait.src==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(raw.portrait.src)&&raw.portrait.src.length<4e6){
    p.portrait={src:raw.portrait.src,zoom:Number.isFinite(+raw.portrait.zoom)?clamp(+raw.portrait.zoom,.5,6):1,x:Number.isFinite(+raw.portrait.x)?clamp(+raw.portrait.x,-500,500):0,y:Number.isFinite(+raw.portrait.y)?clamp(+raw.portrait.y,-500,500):0};
  }
  if(Array.isArray(raw.equipment))p.equipment=raw.equipment.slice(0,300).map(cleanEquip).filter(Boolean);
  if(raw.equipmentYear!=null)p.equipmentYear=N(raw.equipmentYear,1000,2200,1925);
  if(raw.live&&typeof raw.live==='object'){p.live={};for(const [k] of LIVE)if(raw.live[k]!=null)p.live[k]=N(raw.live[k],0,999,0)}
  if(raw.status&&typeof raw.status==='object'){p.status={};for(const [k] of FLAGS)if(raw.status[k])p.status[k]=true}
  p.movMod=N(raw.movMod,-20,0,0);
  if(raw.ageApplied&&typeof raw.ageApplied==='object'){
    const ch={};for(const k of ATTRS)if(raw.ageApplied.changes&&Number.isFinite(+raw.ageApplied.changes[k]))ch[k]=N(raw.ageApplied.changes[k],-200,200,0);
    p.ageApplied={age:N(raw.ageApplied.age,0,999,0),changes:ch,mov:N(raw.ageApplied.mov,-20,0,0),luckFrom:raw.ageApplied.luckFrom==null?null:N(raw.ageApplied.luckFrom,0,999,0),luckTo:raw.ageApplied.luckTo==null?null:N(raw.ageApplied.luckTo,0,999,0)};
  }
  p.ageNote=S(raw.ageNote,500);
  if(raw.ui&&typeof raw.ui==='object'){
    const u=raw.ui;
    p.ui={x:N(u.x,0,20000,24),y:N(u.y,0,20000,24),w:N(u.w,200,2000,520),h:N(u.h,0,5000,0),z:N(u.z,0,99999,1),collapsed:!!u.collapsed,tab:/^[a-z]{1,16}$/.test(String(u.tab))?String(u.tab):undefined,dice:N(u.dice,-2,2,0),autoMark:u.autoMark!==false};
    if(p.ui.tab===undefined)delete p.ui.tab;
  }
  return migrate(p);
}

/* Formato do arquivo trocado entre jogadores e mestre */
function buildExport(p){
  const copy=JSON.parse(JSON.stringify(p));
  delete copy.ui;delete copy.rolledC;
  return{format:FORMAT,version:VERSION,app:'Ficha do Investigador',exportedAt:new Date().toISOString(),ficha:copy};
}
function parseExport(d){
  if(!d||typeof d!=='object')throw new Error('arquivo não é uma ficha');
  if(d.format!==FORMAT)throw new Error('não é um arquivo de ficha do investigador');
  if(num(d.version,1)>VERSION)throw new Error('arquivo de uma versão mais nova do site');
  const list=Array.isArray(d.fichas)?d.fichas:d.ficha?[d.ficha]:[];
  if(!list.length)throw new Error('nenhuma ficha no arquivo');
  return list.slice(0,40).map(raw=>({hadDer:!!(raw&&raw.der),p:sanitize(raw)}));
}

window.CthPlay={
  ATTRS,MYTHOS,FORMAT,
  migrate,sanitize,buildExport,parseExport,
  maxes,live,setLive,hasLive,liveHtml,liveRefresh,liveText,
  rollD100,classify,entryText,pushLog,showRoll,rollBarHtml,rollBarRefresh,rowTools,markable,markCount,
  ageRules,ageText,applyAge,revertAge,ageHtml,ageRefresh,
  bioHtml,bioText,loreText,
  mythos,skillVal
};
})();
