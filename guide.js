/* Guia dinâmico da criação guiada (passos 3 a 5).
   O guia leva a pessoa até cada parte da ficha: escurece o resto da tela, destaca a área com um brilho,
   marca pontos com pinos e caixinhas, e só avança quando a tarefa da etapa é feita (ou ao pular a etapa).
   Estado salvo na própria ficha: p.guide = {step, scene}. Depende de app.js e rules.js (cur, winEl, draw, refresh, persist, askConfirm...). */
(()=>{
'use strict';

const STEP_NAMES={3:'Pontos ocupacionais',4:'Pontos pessoais',5:'Backstory'};

/* ---------- utilidades ---------- */
const isMob=()=>document.body.classList.contains('mobile');
const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const idxOf=p=>cur.indexOf(p);
const winOf=p=>{const i=idxOf(p);return i<0?null:winEl(i)};
const q=(el,s)=>el?el.querySelector(s):null;
const firstName=p=>String(p.nome||'').trim().split(/\s+/)[0]||'seu investigador';
const plural=(n,um,varios)=>n===1?um:varios;
/* texto com **negrito**, palavra por palavra (cada palavra entra com um pequeno atraso) */
function words(s){
 let n=0;
 return String(s).split(/(\*\*[^*]+\*\*)/).map(part=>{
  const bold=/^\*\*[^*]+\*\*$/.test(part),t=bold?part.slice(2,-2):part;
  return t.split(/(\s+)/).map(w=>{
   if(!w)return'';
   if(/^\s+$/.test(w))return' ';
   const h=esc(w),i=n++;
   return`<span class="w" style="--i:${i}">${bold?`<b>${h}</b>`:h}</span>`;
  }).join('');
 }).join('');
}
const plain=s=>String(s).replace(/\*\*/g,'');
function ensureSheet(p,tab,budget){
 const u=p.ui=p.ui||{};let ch=false;
 if(u.collapsed){u.collapsed=false;ch=true}
 if(u.visualMode){u.visualMode=false;ch=true}
 if(tab&&u.tab!==tab){u.tab=tab;ch=true}
 if(budget&&u.budgetCollapsed){u.budgetCollapsed=false;ch=true}
 if(!p.edit){p.edit=true;ch=true}
 return ch;
}
function setMode(p,m){
 if((p.skillBudgetMode||'occupational')===m)return;
 p.skillBudgetMode=m;p.skillNotice='';
 const i=idxOf(p);if(i>=0)refresh(i);
}
const spendItem=(p,type)=>{const b=blankBudgetState(p)[type];return{label:type==='occupational'?'Gastar todos os pontos ocupacionais':'Gastar todos os pontos pessoais',detail:`${b.used}/${b.total}`,done:b.total>0&&b.available===0}};

/* ---------- roteiro ---------- */
/* spots(el,p) → elementos a destacar; pins(p) → textos das caixinhas (mesma ordem de spots, null = sem caixinha);
   task(p) → objetivos [{label,detail,done,opt}] (opt = recomendado, não trava); auto → avança sozinho ao concluir. */
const SCENES=[
 {id:'points',step:3,tab:'sheet',budget:true,next:'Entendi →',
  title:()=>'Os dois cofres de pontos',
  text:()=>'Vou te guiar daqui em diante. Veja estes dois blocos: é deles que saem os pontos das perícias.',
  spots:el=>[q(el,'.budget-balance .budget-stat:nth-child(1)'),q(el,'.budget-balance .budget-stat:nth-child(2)')],
  pins:p=>{const b=blankBudgetState(p);return[`Ocupacionais (${b.occupational.total}): só para perícias da profissão`,`Pessoais (${b.personal.total}): INT × 2, para qualquer perícia`]}},
 {id:'credit',step:3,tab:'sheet',budget:true,next:'Entendi →',
  title:()=>'Cofre e Nível de Crédito',
  text:p=>{const c=creditBounds(p);return`Este seletor decide de qual cofre saem os pontos. Já o **Nível de Crédito** diz quanto dinheiro e posses ${firstName(p)} tem${c?` (nesta ocupação, de ${c.min} a ${c.max})`:''}. O mínimo você já ganhou.`},
  spots:el=>[q(el,'.budget-mode'),q(el,'[data-credit-range]')],
  pins:p=>{const c=creditBounds(p);return['De qual cofre você gasta',c?`Faixa de crédito: ${c.min} a ${c.max}`:'Faixa de crédito']}},
 {id:'choice',step:3,tab:'sheet',budget:true,next:'Entendi →',
  when:p=>{const s=occupationChoiceSlots(p);return s.any+s.social>0},
  title:()=>'Vagas livres da ocupação',
  text:p=>{const s=occupationChoiceSlots(p),a=[];if(s.any)a.push(`**${s.any} ${plural(s.any,'perícia livre','perícias livres')}**`);if(s.social)a.push(`**${s.social} ${plural(s.social,'social','sociais')}**`);return`Sua ocupação deixa você escolher ${a.join(' e ')}. Ao gastar pontos ocupacionais numa perícia de fora da lista, ela ocupa uma vaga e fica dourada. As sociais aparecem em azul.`},
  spots:el=>[q(el,'[data-budget-choice-note]')],
  pins:()=>['Quantas vagas ainda restam']},
 {id:'spend-occ',step:3,tab:'sheet',budget:true,
  when:p=>blankBudgetState(p).occupational.total>0,
  enter:p=>{setMode(p,'occupational');return false},
  title:()=>'Gaste os pontos ocupacionais',
  text:p=>{const b=blankBudgetState(p),s=occupationChoiceSlots(p);return`Distribua os **${b.occupational.total} pontos** nas perícias em dourado${p.occ?` (as de ${p.occ})`:''}. Digite o valor ou use as setinhas. Nenhuma passa de ${SKILL_CAP}%.${s.any+s.social?' Reserve alguns para as vagas livres.':''}`},
  spots:el=>[q(el,'.sheet-pane .sk')],
  hint:()=>'Toque no número de uma perícia dourada, digite o novo valor e confirme com Enter.',
  task:p=>{
   const b=blankBudgetState(p).occupational,s=occupationChoiceSlots(p),r=occupationChoiceRemaining(p),items=[spendItem(p,'occupational')];
   if(s.any)items.push({label:`Escolher ${plural(s.any,'1 perícia livre',s.any+' perícias livres')}`,detail:`${s.any-r.any}/${s.any}`,done:r.any===0,opt:true});
   if(s.social)items.push({label:`Escolher ${plural(s.social,'1 perícia social',s.social+' perícias sociais')}`,detail:`${s.social-r.social}/${s.social}`,done:r.social===0,opt:true});
   return items;
  }},
 {id:'mode',step:4,tab:'sheet',budget:true,auto:true,
  enter:p=>{setMode(p,'occupational');return false},
  title:()=>'Hora de trocar de cofre',
  text:()=>'Os pontos ocupacionais ficaram para trás. Agora vêm os **pontos pessoais**: toque em “Perícias pessoais” para gastar deles.',
  spots:el=>[q(el,'.budget-mode-options button[value=personal]')],
  pins:()=>['Toque aqui'],
  hint:()=>'O botão brilhando é “Perícias pessoais”, logo abaixo de “Distribuir agora”.',
  task:p=>[{label:'Tocar em “Perícias pessoais”',done:(p.skillBudgetMode||'occupational')==='personal'}]},
 {id:'spend-pers',step:4,tab:'sheet',budget:true,
  when:p=>blankBudgetState(p).personal.total>0,
  enter:p=>{setMode(p,'personal');return false},
  title:()=>'Gaste os pontos pessoais',
  text:p=>`Use seus **${blankBudgetState(p).personal.total} pontos** (INT × 2) em qualquer perícia. Pense no que ${firstName(p)} gosta e sabe fazer. Nível de Crédito não aceita pontos pessoais.`,
  spots:el=>[q(el,'.sheet-pane .sk')],
  hint:()=>'Qualquer perícia serve. Digite o valor no campo dela e confirme com Enter.',
  task:p=>[spendItem(p,'personal')]},
 {id:'tab',step:5,tab:null,auto:true,
  enter:p=>{const u=p.ui;if(u.tab!=='sheet'){u.tab='sheet';return true}return false},
  title:()=>'Agora, a história',
  text:p=>`Quase lá! Toque na aba **Backstory** para dar vida a ${firstName(p)}.`,
  spots:el=>[q(el,'[data-sheet-tab=backstory]')],
  pins:()=>['Toque aqui'],
  task:p=>[{label:'Abrir a aba Backstory',done:!!(p.ui&&p.ui.tab==='backstory')}]},
 {id:'look',step:5,tab:'backstory',next:'Entendi →',
  title:p=>p.hist&&p.hist.length?'Aparência e origem':'Aparência do personagem',
  text:p=>p.hist&&p.hist.length?'Aqui você pode pôr uma **imagem** para imaginar o rosto (opcional) e ver a **origem** da ocupação, com os bônus que ela trouxe.':'Aqui você pode pôr uma **imagem** para imaginar o rosto de '+firstName(p)+' (opcional). Dá para ajustar o enquadramento arrastando e usando o zoom.',
  spots:(el,p)=>[q(el,'.backstory-photo'),p.hist&&p.hist.length?q(el,'.backstory-text .hist'):null],
  pins:p=>['Imagem do personagem (opcional)',p.hist&&p.hist.length?'Origem e faixa de crédito':null]},
 {id:'write',step:5,tab:'backstory',
  title:()=>'Escreva a história',
  text:p=>`Conte quem ${firstName(p)} é: **aparência, ideologia, pessoas e lugares importantes, pertences queridos e traços**. Poucas linhas já bastam!`,
  spots:el=>[q(el,'textarea.bk')],
  hint:p=>`Toque na caixa e comece por algo simples: de onde ${firstName(p)} veio?`,
  task:p=>{const n=String(p.back||'').trim().length;return[{label:'Escrever algumas linhas',detail:`${Math.min(n,40)}/40`,done:n>=40}]}},
 {id:'finale',step:5,tab:null,next:'✔ Concluir',
  title:()=>'Missão cumprida!',
  text:p=>{const b=blankBudgetState(p),r=[];if(b.occupational.available>0)r.push(`${b.occupational.available} ocupacionais`);if(b.personal.available>0)r.push(`${b.personal.available} pessoais`);return`**${firstName(p)}** está pronto para encarar o desconhecido.${r.length?` Ainda restam ${r.join(' e ')}: dá para gastar quando quiser.`:''} Falta só o equipamento e, se quiser, o PDF.`},
  spots:el=>[q(el,'.win-bar .pdfb'),q(el,'[data-sheet-tab=equipment]')],
  pins:()=>['Baixe a ficha em PDF','Equipamento do investigador']}
];
const avail=p=>SCENES.filter(s=>!s.when||s.when(p));

/* ---------- estado e DOM ---------- */
let S=null,root,card,dim,glowBox,pinBox,fab;
const $c=s=>card.querySelector(s);

function ensureDom(){
 if(root)return;
 root=document.createElement('div');root.className='cg-root';root.hidden=true;
 root.innerHTML=`<div class="cg-dim"></div><div class="cg-glows"></div><div class="cg-pins"></div>
<aside class="cg-card" role="dialog" aria-modal="false" aria-label="Guia da criação do investigador">
 <div class="cg-bubble">
  <div class="cg-head"><span class="cg-dots" aria-hidden="true"></span><span class="cg-step"></span>
   <button type="button" class="cg-hbtn" data-cg="min" aria-label="Minimizar o guia" title="Minimizar (Esc)">–</button>
   <button type="button" class="cg-hbtn" data-cg="exit" aria-label="Sair do guia" title="Sair do guia"><span class="l">Sair do guia</span><span class="s">✕</span></button></div>
  <h4 class="cg-title"></h4>
  <p class="cg-text" aria-hidden="true"></p><p class="cg-sr" aria-live="polite"></p>
  <ul class="cg-tasks" aria-label="Tarefas desta etapa"></ul>
  <p class="cg-hint" hidden></p>
  <button type="button" class="cg-find" data-cg="find" hidden>↧ Mostrar onde</button>
  <div class="cg-foot"><button type="button" class="cg-back" data-cg="back" aria-label="Voltar">←</button><button type="button" class="alt cg-skip" data-cg="skip">Pular etapa</button><span class="sp"></span><button type="button" class="cg-next" data-cg="next">Próximo →</button></div>
 </div></aside>`;
 document.body.appendChild(root);
 card=root.querySelector('.cg-card');dim=root.querySelector('.cg-dim');glowBox=root.querySelector('.cg-glows');pinBox=root.querySelector('.cg-pins');
 fab=document.createElement('button');fab.type='button';fab.className='cg-fab';fab.hidden=true;fab.setAttribute('aria-label','Retomar o guia');
 fab.innerHTML='<span aria-hidden="true">◈</span><span>Retomar guia</span>';
 document.body.appendChild(fab);
 fab.addEventListener('click',resume);
 root.addEventListener('click',e=>{
  const b=e.target.closest('[data-cg]');
  if(b){const a=b.dataset.cg;if(a==='min')pause();else if(a==='exit')exit();else if(a==='back')back();else if(a==='skip')next(true);else if(a==='next'){if(!b.disabled)next()}else if(a==='find')focusTarget(true);return}
 });
 dim.addEventListener('pointerdown',nudge);
 const act=()=>{if(S)S.lastAct=performance.now()};
 ['pointerdown','keydown','input','change'].forEach(t=>document.addEventListener(t,act,true));
 document.addEventListener('keydown',e=>{
  if(e.key!=='Escape'||!S||S.paused)return;
  if(document.querySelector('.ovl')||document.querySelector('dialog[open]'))return;
  e.preventDefault();pause();
 },true);
}

/* celular: reserva no fim da página o espaço do cartão, para qualquer alvo conseguir subir acima dele */
function setPad(on){
 document.body.classList.toggle('cg-active',!!on);
 if(on)document.body.style.setProperty('--cg-pad',(card.offsetHeight+28)+'px');else document.body.style.removeProperty('--cg-pad');
}
function nudge(){
 if(!S)return;
 card.classList.remove('shake');void card.offsetWidth;card.classList.add('shake');
 glowBox.querySelectorAll('.cg-glow').forEach(g=>{g.classList.remove('cg-hit');void g.offsetWidth;g.classList.add('cg-hit')});
}

/* ---------- controle ---------- */
function start(p){
 if(!p||typeof cur==='undefined'||idxOf(p)<0)return;
 ensureDom();
 for(const o of cur)if(o!==p&&o.guide)delete o.guide;
 if(S)teardown();
 p.guide=p.guide&&typeof p.guide==='object'?p.guide:{step:3};
 S={p,paused:false,sig:'',lastAct:performance.now(),raf:0,notes:[],focus:0};
 const list=avail(p),step=Math.max(3,Math.min(5,+p.guide.step||3));
 go(list.find(s=>s.id===p.guide.scene)||list.find(s=>s.step===step)||list[0]);
}
function teardown(){
 if(!S)return;
 cancelAnimationFrame(S.raf);['autoT','finT'].forEach(k=>clearTimeout(S[k]));
 root.hidden=true;fab.hidden=true;setPad(false);S=null;
}
function pause(){
 if(!S||S.paused)return;
 S.paused=true;cancelAnimationFrame(S.raf);S.raf=0;root.hidden=true;fab.hidden=false;setPad(false);
}
function resume(){
 if(!S||!S.paused)return;
 S.paused=false;root.hidden=false;fab.hidden=true;setPad(true);S.sig='';S.focus=40;S.lastAct=performance.now();loop();
}
async function exit(){
 if(!S)return;
 const p=S.p,ok=await askConfirm({title:'Sair do guia?',html:'A ficha fica como está e você continua editando livremente. Nada do que você já preencheu se perde.',ok:'Sair do guia',danger:false});
 if(!ok||!S||S.p!==p)return;
 end(p);
}
function end(p){
 delete p.guide;p.edit=true;if(p.ui)p.ui.tab='sheet';p.skillNotice='';
 teardown();draw();
}
function go(sc){
 const p=S.p;
 S.sc=sc;p.guide.scene=sc.id;p.guide.step=sc.step;
 S.done=false;S.hintShown=false;S.taskSig='';S.lastAct=performance.now();S.noHole=0;
 ['autoT'].forEach(k=>clearTimeout(S[k]));
 let ch=ensureSheet(p,sc.tab,sc.budget);
 if(sc.enter&&sc.enter(p))ch=true;
 if(ch)draw();else persist();
 root.hidden=false;fab.hidden=true;
 render();setPad(true);
 dim.classList.remove('cg-in');void dim.offsetWidth;dim.classList.add('cg-in');
 S.sig='';S.focus=40;
 if(!S.raf)loop();
}
function listPos(){const l=avail(S.p);return{l,i:l.indexOf(S.sc)}}
function next(skipping){
 if(!S||S.advancing)return;
 const{l,i}=listPos();
 if(i>=l.length-1){finish();return}
 if(!skipping&&S.sc.task&&!S.done)return;
 go(l[i+1]);
}
function back(){
 if(!S)return;
 const{l,i}=listPos();
 if(i>0)go(l[i-1]);
}
function finish(){
 if(!S||S.advancing)return;
 S.advancing=true;const p=S.p;
 $c('.cg-title').textContent='Boa sorte, investigador!';
 $c('.cg-text').innerHTML=words('Que as estrelas estejam a seu favor… ou não. Divirta-se na mesa!');
 confetti();
 S.finT=setTimeout(()=>{
  if(!S||S.p!==p)return;
  const el=winOf(p);end(p);
  const w=el&&winOf(p);if(w)w.scrollIntoView({behavior:reduce()?'auto':'smooth',block:'start'});
 },1700);
}
function confetti(){
 const box=document.createElement('div');box.className='cg-confetti';
 const r=card.getBoundingClientRect();box.style.left=(r.left+r.width/2)+'px';box.style.top=(r.top+r.height/2)+'px';
 const cols=['#d8c58a','#8fd0ac','#c0392b','#f2d98a','#5fae8a'];
 for(let k=0;k<26;k++){
  const i=document.createElement('i'),a=Math.random()*Math.PI*2,d=70+Math.random()*130;
  i.style.cssText=`background:${cols[k%cols.length]};--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d-60}px;--rot:${Math.random()*540-270}deg;animation-delay:${Math.random()*120}ms`;
  box.appendChild(i);
 }
 document.body.appendChild(box);setTimeout(()=>box.remove(),1600);
}

/* ---------- desenho do cartão ---------- */
function render(){
 const sc=S.sc,p=S.p,{l,i}=listPos();
 $c('.cg-dots').innerHTML=[1,2,3,4,5].map(n=>`<i class="${n<sc.step?'done':n===sc.step?'now':''}"></i>`).join('');
 $c('.cg-step').textContent=`Passo ${sc.step} de 5`;$c('.cg-step').title=STEP_NAMES[sc.step];
 $c('.cg-title').textContent=sc.title(p);
 S.fullText=sc.text(p);
 $c('.cg-text').innerHTML=words(S.fullText);$c('.cg-sr').textContent=sc.title(p)+'. '+plain(S.fullText);
 $c('.cg-hint').hidden=true;$c('.cg-find').hidden=true;
 card.classList.remove('ok');
 const last=i>=l.length-1,nb=$c('.cg-next');
 nb.textContent=sc.next||(last?'✔ Concluir':'Continuar →');nb.disabled=!!sc.task;nb.classList.remove('go');
 $c('.cg-back').hidden=i<=0;$c('.cg-skip').hidden=!sc.task;
 /* caixinhas e pinos */
 pinBox.innerHTML='';S.notes=[];
 const texts=sc.pins?sc.pins(p):[];let n=0;
 texts.forEach((t,k)=>{
  if(!t)return;n++;
  const note=document.createElement('div');note.className='cg-note';note.innerHTML=`<b>${n}</b>${esc(t)}`;note.style.display='none';
  const pin=document.createElement('div');pin.className='cg-pin';pin.textContent=n;pin.style.display='none';
  pinBox.append(note,pin);S.notes[k]={note,pin};
 });
 renderTasks(sc.task?sc.task(p):null);
}
function renderTasks(items){
 const ul=$c('.cg-tasks');
 ul.innerHTML=items?items.map(t=>`<li class="${t.done?'ok':''}${t.opt?' opt':''}"><span class="cg-chk" aria-hidden="true">✓</span><span>${esc(t.label)}${t.opt?'<em>(recomendado)</em>':''}</span>${t.detail?`<strong>${esc(t.detail)}</strong>`:''}</li>`).join(''):'';
}

/* ---------- laço de quadros: segue o alvo, pinta o foco, confere a tarefa ---------- */
function loop(){S.raf=requestAnimationFrame(tick)}
function holeRound(x,y,w,h,r){r=Math.max(0,Math.min(r,w/2,h/2));return`M${x+r} ${y}H${x+w-r}A${r} ${r} 0 0 1 ${x+w} ${y+r}V${y+h-r}A${r} ${r} 0 0 1 ${x+w-r} ${y+h}H${x+r}A${r} ${r} 0 0 1 ${x} ${y+h-r}V${y+r}A${r} ${r} 0 0 1 ${x+r} ${y}Z`}
function tick(ts){
 if(!S||S.paused)return;
 S.raf=requestAnimationFrame(tick);
 const p=S.p,i=idxOf(p);
 if(i<0){teardown();return}
 const sc=S.sc,el=winEl(i);
 if(!el)return;
 /* mantém a ficha no estado que a etapa precisa (aba certa, janela aberta, painel de pontos aberto) */
 if(ts-(S.lastFix||0)>250){S.lastFix=ts;if(!S.advancing&&ensureSheet(p,sc.tab,sc.budget)){draw();return}}
 /* alvos → buracos no escurecimento */
 const vw=root.clientWidth,vh=root.clientHeight,spots=sc.spots?sc.spots(el,p):[],holes=[];let exists=0;
 spots.forEach((e,k)=>{
  if(!e||!e.isConnected)return;exists++;
  const r=e.getBoundingClientRect();if(r.width<2||r.height<2)return;
  const pad=8,x0=Math.max(0,r.left-pad),y0=Math.max(0,r.top-pad),x1=Math.min(vw,r.right+pad),y1=Math.min(vh,r.bottom+pad);
  if(x1-x0<6||y1-y0<6)return;
  holes.push({k,x:x0,y:y0,w:x1-x0,h:y1-y0,cx:(r.left+r.right)/2,cy:(r.top+r.bottom)/2});
 });
 const sig=holes.map(h=>[h.x,h.y,h.w,h.h].map(Math.round).join(','))+`|${vw}x${vh}|${card.offsetHeight}`;
 if(sig!==S.sig){S.sig=sig;setPad(true);paint(holes,vw,vh)}
 /* alvo fora da tela: oferece um atalho */
 const lost=exists>0&&!holes.length;
 S.noHole=lost?(S.noHole||ts):0;
 $c('.cg-find').hidden=!(lost&&ts-S.noHole>700);
 /* rolagem inicial até o alvo */
 if(S.focus>0){S.focus--;if(focusTarget(false))S.focus=0}
 /* tarefa: confere a cada ~200 ms */
 if(ts-(S.lastTask||0)>200){
  S.lastTask=ts;
  const items=sc.task?sc.task(p):null,tsig=JSON.stringify(items);
  if(tsig!==S.taskSig){S.taskSig=tsig;renderTasks(items);S.lastAct=performance.now();S.sig='';S.hintShown&&hideHint()}
  const done=items?items.filter(t=>!t.opt).every(t=>t.done):true;
  if(sc.task){
   if(done&&!S.done)onDone();else if(!done&&S.done)onUndone();
   if(!done&&!S.hintShown&&sc.hint&&performance.now()-S.lastAct>15000)showHint();
  }
 }
}
function paint(holes,vw,vh){
 dim.style.clipPath=`path(evenodd,"M0 0H${vw}V${vh}H0Z${holes.map(h=>holeRound(h.x,h.y,h.w,h.h,12)).join('')}")`;
 const gl=glowBox.children;
 while(gl.length<holes.length){const g=document.createElement('div');g.className='cg-glow';glowBox.appendChild(g)}
 while(gl.length>holes.length)glowBox.lastChild.remove();
 holes.forEach((h,k)=>{const s=gl[k].style;s.left=h.x+'px';s.top=h.y+'px';s.width=h.w+'px';s.height=h.h+'px';s.borderRadius='12px'});
 chooseDock(holes,vw,vh);
 layoutNotes(holes,vw,vh);
}
function chooseDock(holes,vw,vh){
 if(isMob()){card.classList.remove('dock-l');return}
 const w=card.offsetWidth,h=card.offsetHeight;
 const ov=x0=>holes.reduce((s,t)=>{const a=Math.max(0,Math.min(x0+w,t.x+t.w)-Math.max(x0,t.x)),b=Math.max(0,Math.min(vh-16,t.y+t.h)-Math.max(vh-16-h,t.y));return s+a*b},0);
 const right=ov(vw-16-w),left=ov(16),onLeft=card.classList.contains('dock-l');
 if(onLeft&&left>0&&right<left)card.classList.remove('dock-l');
 else if(!onLeft&&right>0&&left<right)card.classList.add('dock-l');
}
function layoutNotes(holes,vw,vh){
 const cr=card.getBoundingClientRect(),cardR={l:cr.left-8,t:cr.top-14,r:cr.right+8,b:cr.bottom+8};
 const hit=(a,b)=>a.l<b.r&&a.r>b.l&&a.t<b.b&&a.b>b.t,hr=holes.map(h=>({l:h.x,t:h.y,r:h.x+h.w,b:h.y+h.h})),placed=[];
 S.notes.forEach((nn,k)=>{
  if(!nn)return;
  const{note,pin}=nn,h=holes.find(x=>x.k===k);
  if(!h){note.style.display='none';pin.style.display='none';return}
  note.style.display='';pin.style.display='';
  pin.style.left=h.x+'px';pin.style.top=h.y+'px';
  const maxW=isMob()?176:236,cw=Math.round(Math.max(120,Math.min(maxW,Math.max(h.w-12,150),vw-16)));
  note.style.width=cw+'px';
  const ch=note.offsetHeight,g=13;
  const cand={
   down:()=>({l:h.cx-cw/2,t:h.y+h.h+g,c:'up'}),
   up:()=>({l:h.cx-cw/2,t:h.y-ch-g,c:'down'}),
   right:()=>({l:h.x+h.w+g,t:h.cy-ch/2,c:'al'}),
   left:()=>({l:h.x-cw-g,t:h.cy-ch/2,c:'ar'})
  };
  let best=null;
  for(const s of['down','up','right','left']){
   const c=cand[s]();
   c.l=Math.max(8,Math.min(vw-cw-8,c.l));c.t=Math.max(8,Math.min(vh-ch-8,c.t));
   c.R={l:c.l,t:c.t,r:c.l+cw,b:c.t+ch};
   const bad=hr.some(x=>hit(c.R,x))||hit(c.R,cardR)||placed.some(x=>hit(c.R,x));
   if(!best)best=c;
   if(!bad){best=c;break}
  }
  note.className='cg-note '+best.c;note.style.left=best.l+'px';note.style.top=best.t+'px';
  note.style.setProperty('--ax',Math.max(14,Math.min(cw-14,h.cx-best.l))+'px');
  note.style.setProperty('--ay',Math.max(12,Math.min(ch-12,h.cy-best.t))+'px');
  placed.push(best.R);
 });
}
function focusTarget(force){
 if(!S)return true;
 const el=winOf(S.p),sc=S.sc;if(!el||!sc.spots)return true;
 const e=sc.spots(el,S.p).find(Boolean);if(!e)return true;
 const r=e.getBoundingClientRect();if(r.width<2||r.height<2)return false;
 const vh=root.clientHeight,free=vh-(isMob()?card.offsetHeight+16:0),top=r.height>free-120?84:Math.max(84,(free-r.height)/2-30),dy=r.top-top;
 if(force||Math.abs(dy)>28)scrollBy({top:dy,behavior:reduce()?'auto':'smooth'});
 return true;
}
function onDone(){
 S.done=true;
 card.classList.add('ok');
 const nb=$c('.cg-next');nb.disabled=false;nb.classList.add('go');nb.textContent=S.sc.auto?'Feito! ✓':(listPos().i>=listPos().l.length-1?'✔ Concluir':'Continuar →');
 glowBox.querySelectorAll('.cg-glow').forEach(g=>{g.classList.remove('cg-hit');void g.offsetWidth;g.classList.add('cg-hit')});
 hideHint();
 if(S.sc.auto){const sc=S.sc;S.autoT=setTimeout(()=>{if(S&&S.sc===sc&&S.done)next()},1000)}
}
function onUndone(){
 S.done=false;clearTimeout(S.autoT);
 card.classList.remove('ok');
 const nb=$c('.cg-next');nb.disabled=true;nb.classList.remove('go');nb.textContent=S.sc.next||'Continuar →';
}
function showHint(){
 S.hintShown=true;const h=$c('.cg-hint');h.textContent=S.sc.hint(S.p);h.hidden=false;
 nudge();
}
function hideHint(){if(S){S.hintShown=false;$c('.cg-hint').hidden=true}}

/* ---------- retomar ao abrir o site ---------- */
addEventListener('ficha:ready',()=>{const p=cur.find(x=>x&&x.guide);if(p)start(p)});

window.Coach={start,stop:()=>{if(S){const p=S.p;end(p)}},active:()=>!!S,state:()=>S,pause,resume};
})();
