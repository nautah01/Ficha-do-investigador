/* Compra de pontos (460) e criação guiada passo a passo.
   Passos: 1 atributos → 2 identidade e ocupação → 3 pontos ocupacionais → 4 pontos pessoais → 5 backstory.
   Os passos 3–5 acontecem na própria ficha, guiados por uma barra no topo (p.guide.step). */

/* ---------- janela genérica ---------- */
function wzModal(html,cls=''){
 const ov=document.createElement('div'),prev=document.activeElement;ov.className='ovl';
 ov.innerHTML=`<div class="dlg ${cls}" role="dialog" aria-modal="true">${html}</div>`;
 const box=ov.firstElementChild;
 const api={ov,box,close(v){document.removeEventListener('keydown',key,true);ov.remove();if(prev&&prev.focus)prev.focus();if(api.resolve)api.resolve(v)}};
 const key=e=>{
  if([...document.querySelectorAll('.ovl')].pop()!==ov||document.querySelector('dialog[open]'))return; /* só a janela do topo reage (e não quando o seletor de ocupação está aberto) */
  if(e.key==='Escape'){e.preventDefault();api.close(null)}
  else if(e.key==='Tab'){const fs=[...ov.querySelectorAll('button:not([disabled]),input:not([disabled]),select')],k=fs.indexOf(document.activeElement);if(!fs.length)return;e.preventDefault();fs[(k+(e.shiftKey?-1:1)+fs.length)%fs.length].focus()}
 };
 document.addEventListener('keydown',key,true);document.body.appendChild(ov);
 api.promise=new Promise(r=>{api.resolve=r});
 return api;
}

/* ---------- compra de pontos ---------- */
function openPointBuy(opt={}){
 const v={...(opt.initial||pointBuyStart())};
 const m=wzModal(`<h4>Compra de pontos (${POINT_BUY_TOTAL})</h4><p class="wz-help">Distribua exatamente ${POINT_BUY_TOTAL} pontos. Força, Constituição, Poder, Destreza e Aparência vão de 15 a 90; Tamanho, Inteligência e Educação, de 40 a 90 — sempre de 5 em 5.</p><div class="pb-total" role="status">Restam <b data-pb-left></b> pontos</div><div class="pb-grid">${ATTR_KEYS.map(k=>`<div class="pb-row"><label for="pb-${k}">${ATTR_NAMES[k]} <small>${ATTR_RANGE[k][0]}–${ATTR_RANGE[k][1]}</small></label><span class="pb-ctl"><button type="button" class="alt" data-pb="-" data-k="${k}" aria-label="Diminuir ${ATTR_NAMES[k]}">−</button><input id="pb-${k}" class="in" type="number" min="${ATTR_RANGE[k][0]}" max="${ATTR_RANGE[k][1]}" step="5" data-pbi="${k}"><button type="button" class="alt" data-pb="+" data-k="${k}" aria-label="Aumentar ${ATTR_NAMES[k]}">＋</button></span></div>`).join('')}</div><div class="row"><button type="button" class="alt" data-pb="min">Refazer</button><button type="button" class="alt" data-pb="cancel">Cancelar</button><button type="button" data-pb="ok">${esc(opt.okLabel||'Usar estes atributos')}</button></div>`,'pb-dlg');
 const left=()=>POINT_BUY_TOTAL-pointBuyUsed(v);
 const paint=()=>{
  ATTR_KEYS.forEach(k=>{const i=m.box.querySelector(`[data-pbi="${k}"]`);if(i!==document.activeElement)i.value=v[k]});
  const l=left(),b=m.box.querySelector('[data-pb-left]');b.textContent=l;b.parentElement.classList.toggle('bad',l<0);b.parentElement.classList.toggle('ok',l===0);
  m.box.querySelector('[data-pb="ok"]').disabled=!ATTR_KEYS.every(k=>{const[a,b]=ATTR_RANGE[k],n=+v[k];return n>=a&&n<=b&&n%5===0});
  ATTR_KEYS.forEach(k=>{const[mn,mx]=ATTR_RANGE[k];m.box.querySelector(`[data-pb="-"][data-k="${k}"]`).disabled=v[k]<=mn;m.box.querySelector(`[data-pb="+"][data-k="${k}"]`).disabled=v[k]>=mx||l<5});
 };
 m.box.addEventListener('click',e=>{
  const b=e.target.closest('[data-pb]');if(!b)return;const a=b.dataset.pb,k=b.dataset.k;
  if(a==='+'&&left()>=5&&v[k]<ATTR_RANGE[k][1])v[k]+=5;
  else if(a==='-'&&v[k]>ATTR_RANGE[k][0])v[k]-=5;
  else if(a==='min')Object.assign(v,pointBuyStart());
  else if(a==='cancel'){m.close(null);return}
  else if(a==='ok'){if(!ATTR_KEYS.every(k=>{const[min,max]=ATTR_RANGE[k],n=+v[k];return n>=min&&n<=max&&n%5===0}))return;if(left()!==0){askChoice({title:'Pontos não distribuídos',html:'Ainda restam <strong>'+left()+' pontos</strong> para distribuir.',choices:[{v:'ok',label:'Entendi',primary:true}]});return}m.close({...v});return}
  paint();
 });
 m.box.addEventListener('change',e=>{
  const i=e.target.closest('[data-pbi]');if(!i)return;const k=i.dataset.pbi;
  let n=normAttr(k,+i.value||ATTR_RANGE[k][0]);const room=v[k]+left();if(n>room)n=Math.max(ATTR_RANGE[k][0],Math.floor(room/5)*5);
  v[k]=n;i.value=n;paint();
 });
 paint();m.box.querySelector('[data-pbi="FOR"]').focus();
 return m.promise;
}
desk.addEventListener('click',async e=>{
 const b=e.target.closest('.pbb');if(!b)return;
 const k=+b.dataset.i,p=cur[k];if(!p)return;
 const valid=ATTR_KEYS.every(a=>+p.c[a]>0)&&pointBuyValid(p.c);
 const attrs=await openPointBuy({initial:valid?{...p.c}:pointBuyStart()});
 if(!attrs||cur[k]!==p)return;
 if(isBudget(p)&&hasBlankPoints(p)){
  const ok=await askConfirm({title:'Aplicar a compra de pontos?',html:p.blank?'Os atributos mudam e <strong>os pontos de perícia já distribuídos são zerados</strong> (os totais de pontos dependem dos atributos). A ocupação continua a mesma.':'Os atributos mudam e <strong>as perícias são redistribuídas</strong> com os pontos novos (mesma ocupação e origem). Valores digitados à mão se perdem.',ok:'Aplicar',danger:false});
  if(!ok||cur[k]!==p)return;
 }
 rerollAttrs(k,attrs);
});

/* ---------- criação guiada: passos 1 e 2 (janelas) ---------- */
async function startGuidedCreation(){
 let attrs=null;
 /* passo 1: atributos */
 for(;;){
  const m=wzModal(`<h4>Passo 1 de 5 · Atributos</h4><p class="wz-help">Os atributos definem tudo o mais: pontos de perícia, PV, Sanidade e Mágica. Role os dados (3d6×5 e 2d6+6×5) ou, se o grupo preferir, distribua ${POINT_BUY_TOTAL} pontos.</p><div class="wz-attrs" data-wz-attrs></div><div class="row wz-step-actions wz-first-step"><button type="button" class="alt" data-w="points">⚖ Compra de pontos</button><button type="button" class="alt" data-w="roll">🎲 ${attrs?'Sortear de novo':'Rolar dados'}</button><button type="button" class="alt" data-w="cancel">Cancelar</button><button type="button" data-w="next" ${attrs?'':'disabled'}>Próximo →</button></div>`,'wz-dlg');
  const paint=()=>{m.box.querySelector('[data-wz-attrs]').innerHTML=attrs?ATTR_KEYS.map(k=>`<div><span>${ATTR_NAMES[k]}</span><b>${attrs[k]}</b><small>${attrs[k]>>1} / ${Math.floor(attrs[k]/5)}</small></div>`).join(''):'<p class="wz-empty">Ainda sem atributos. Role os dados ou use a compra de pontos.</p>'};
  paint();
  m.box.addEventListener('click',async e=>{
   const b=e.target.closest('[data-w]');if(!b)return;const a=b.dataset.w;
   if(a==='cancel')m.close('cancel');
   else if(a==='next')m.close('next');
   else if(a==='roll'){attrs=rollAttrs();m.close('again')}
   else if(a==='points'){const got=await openPointBuy({initial:attrs&&pointBuyValid(attrs)?attrs:pointBuyStart()});if(got){attrs=got;m.close('again')}}
  });
  const r=await m.promise;
  if(r==='next')break;
  if(r!=='again')return;
 }
 /* passo 2: identidade e ocupação */
 const tmp={blank:true,occ:'',c:attrs,sk:{}};let occ='';
 const m2=wzModal(`<h4>Passo 2 de 5 · Quem é o investigador?</h4><p class="wz-help">A ocupação define quais perícias recebem os pontos ocupacionais e a faixa de Nível de Crédito.</p><label class="wz-field">Nome<input class="in" data-w-name maxlength="60" placeholder="Nome do investigador"></label><label class="wz-field">Idade<input class="in" type="number" min="15" max="90" value="30" data-w-age></label><div class="wz-field"><span>Ocupação</span><button type="button" class="pickbtn" data-w="occ"><span class="pe">🧭</span><span class="pt" data-w-occ>Escolher ocupação</span><span class="pc">▾</span></button><small data-w-credit></small></div><div class="row wz-step-actions wz-second-step"><button type="button" class="alt" data-w="cancel">Cancelar</button><button type="button" data-w="next" disabled>Próximo →</button></div>`,'wz-dlg');
 m2.box.addEventListener('click',e=>{
  const b=e.target.closest('[data-w]');if(!b)return;const a=b.dataset.w;
  if(a==='cancel')m2.close('cancel');
  else if(a==='next'){if(occ)m2.close('next')}
  else if(a==='occ'&&window.openBlankOccupationPicker)window.openBlankOccupationPicker(occ,next=>{
   occ=next;tmp.occ=next;m2.box.querySelector('[data-w-occ]').textContent=next;
   const r=creditBounds(tmp);m2.box.querySelector('[data-w-credit]').textContent=r?`Nível de Crédito: ${r.min} a ${r.max}`:'';
   m2.box.querySelector('[data-w="next"]').disabled=!occ;
  });
 });
 const r2=await m2.promise;
 if(r2!=='next'||!occ)return;
 const nome=m2.box.querySelector('[data-w-name]').value.replace(/[<>&"']/g,'').trim().slice(0,60),age=Math.max(15,Math.min(90,Math.floor(+m2.box.querySelector('[data-w-age]').value||30)));
 /* cria a ficha normal já com os atributos e a ocupação */
 const p=genBlank(false);
 p.c={...attrs};p.der={...calc(p.c),luck:A()};p.nome=nome;p.idade=String(age);
 resetBlankDistribution(p,occ);
 p.skillBudgetMode='occupational';p.guide={step:3,phase:'budget',didAction:false};p.edit=true;p.rolledC=rollSig(p);
 placeNew(p,0,cur);cur.push(p);draw();
 const el=winEl(cur.length-1);if(el&&el.scrollIntoView)el.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});
}

/* ---------- criação guiada: tour contextual dos passos 3 a 5 ---------- */
const GUIDE_COPY={
 '3-budget':{title:'Pontos ocupacionais',text:p=>{const c=creditBounds(p);return`Aqui ficam os pontos da ocupação e a faixa de Nível de Crédito${c?` (${c.min}–${c.max}%)`:''}. Primeiro, confira o modo de distribuição. Depois vou destacar as perícias certas.`},next:'Ver perícias da ocupação →',target:'.blank-budgets'},
 '3-allocate':{title:'Sua ocupação em destaque',text:p=>{const left=blankBudgetState(p).occupational.available,choices=occupationChoiceRemaining(p);let extra='';if(choices.any||choices.social)extra=` A ocupação ainda pede ${[choices.any&&`${choices.any} escolha(s) aleatória(s)`,choices.social&&`${choices.social} escolha(s) social(is)`].filter(Boolean).join(' e ')}; o site vai confirmar essas vagas quando você aumentar uma perícia.`;return`Distribua pontos nas perícias douradas da ocupação${extra} Digite um novo valor em uma perícia para gastar pontos. Restam ${left} ocupacionais.`},next:'Continuar para pontos pessoais →',target:'.sk'},
 '4-budget':{title:'Pontos pessoais',text:p=>`Agora são ${blankBudgetState(p).personal.total} pontos (INT × 2), válidos para qualquer perícia. Clique em “Perícias pessoais” para escolher essa reserva antes de distribuir.`,next:'Continuar →',target:'.blank-budgets'},
 '4-allocate':{title:'Interesses do investigador',text:p=>`Escolha qualquer perícia e distribua pontos pessoais. Nenhuma perícia passa de ${SKILL_CAP}% durante a criação.`,next:'Ir para a Backstory →',target:'.sk'},
 '5-backstory':{title:'Quem é esta pessoa?',text:()=>'Registre algo sobre o investigador na Backstory: uma pessoa, um lugar ou um traço importante já basta para concluir. O campo está destacado.',next:'Concluir guia',target:'.backstory-text .bk'}
};
let guideOverlay=null,guideSpot=null,guideCard=null,guideTarget=null,guidePositionFrame=0;
function ensureGuideOverlay(){
 if(guideOverlay)return;
 guideOverlay=document.createElement('div');guideOverlay.className='guide-tour';guideOverlay.hidden=true;
 guideOverlay.innerHTML='<div class="guide-spot" aria-hidden="true"></div><section class="guide-coach" role="dialog" aria-modal="false" aria-labelledby="guide-tour-title"><div class="guide-coach-head"><span class="guide-mascot" aria-hidden="true">🐙</span><div><small data-guide-progress></small><h3 id="guide-tour-title"></h3></div><button type="button" class="guide-close" data-guide-action="exit" aria-label="Sair do guia" title="Sair do guia">×</button></div><p data-guide-text></p><small class="guide-task" data-guide-task></small><div class="guide-coach-actions"><button type="button" class="alt" data-guide-action="skip">Pular etapa</button><button type="button" data-guide-action="next"></button></div></section>';
 document.body.appendChild(guideOverlay);guideSpot=guideOverlay.querySelector('.guide-spot');guideCard=guideOverlay.querySelector('.guide-coach');
 guideOverlay.addEventListener('click',e=>{const b=e.target.closest('[data-guide-action]');if(b)advanceGuide(+guideOverlay.dataset.i,b.dataset.guideAction)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&guideOverlay&&!guideOverlay.hidden)advanceGuide(+guideOverlay.dataset.i,'exit')});
 addEventListener('resize',positionGuide);addEventListener('scroll',positionGuide,true);
}
function guideStage(p){const step=Math.max(3,Math.min(5,+p.guide.step||3)),phase=p.guide.phase||'budget';return step===5?'5-backstory':`${step}-${phase}`}
function guideTargetFor(p,i){const win=winEl(i),stage=guideStage(p);if(!win)return null;const pane=stage==='5-backstory'?win.querySelector('.backstory-pane'):win.querySelector('.sheet-pane');if(stage==='5-backstory'&&pane&&pane.hidden)return null;if(matchMedia('(max-width: 640px)').matches&&stage.endsWith('-budget'))return pane?.querySelector('.budget-controls')||pane?.querySelector('.blank-budgets');return pane?.querySelector(GUIDE_COPY[stage]?.target)||null}
function positionGuide(){
 if(!guideOverlay||guideOverlay.hidden||!guideTarget?.isConnected)return;
 cancelAnimationFrame(guidePositionFrame);guidePositionFrame=requestAnimationFrame(()=>{
  const r=guideTarget.getBoundingClientRect(),mobile=matchMedia('(max-width: 640px)').matches;
  const cap=mobile?Math.min(390,innerHeight*.44):Math.min(540,innerHeight*.62),h=Math.min(Math.max(r.height,52),cap),top=Math.max(8,Math.min(innerHeight-h-8,r.top));
  guideSpot.style.left=`${Math.max(8,r.left)}px`;guideSpot.style.top=`${top}px`;guideSpot.style.width=`${Math.max(24,Math.min(innerWidth-16,r.width))}px`;guideSpot.style.height=`${h}px`;
  if(mobile){guideCard.style.left='12px';guideCard.style.right='12px';guideCard.style.top='auto';guideCard.style.bottom=`calc(env(safe-area-inset-bottom, 0px) + var(--guide-bottom-offset, 74px))`}
  else{const w=Math.min(360,innerWidth-32),left=Math.max(16,Math.min(innerWidth-w-16,r.left+r.width-w)),below=top+h+14;guideCard.style.width=`${w}px`;guideCard.style.left=`${left}px`;guideCard.style.right='auto';guideCard.style.top=below+Math.min(220,guideCard.offsetHeight)<innerHeight?`${below}px`:'auto';guideCard.style.bottom=guideCard.style.top==='auto'?'16px':'auto'}
 });
}
function guideTourSync(){
 if(!cur||!desk)return;const activeIndex=cur.findIndex(p=>p.guide);ensureGuideOverlay();
 if(activeIndex<0){guideOverlay.hidden=true;guideTarget=null;return}
 const p=cur[activeIndex],stage=guideStage(p),copy=GUIDE_COPY[stage],win=winEl(activeIndex);if(!copy||!win){guideOverlay.hidden=true;return}
 p.ui=p.ui||{};const expectedTab=stage==='5-backstory'?'backstory':'sheet';if(p.ui.tab!==expectedTab){p.ui.tab=expectedTab;return}
 const target=guideTargetFor(p,activeIndex);if(!target){guideOverlay.hidden=true;return}
 guideOverlay.dataset.i=String(activeIndex);guideOverlay.hidden=false;guideTarget=target;
 const step=+p.guide.step,phase=p.guide.phase||'budget',left=step<5?blankBudgetState(p)[step===3?'occupational':'personal'].available:null;
 guideOverlay.querySelector('[data-guide-progress]').textContent=`CRIAÇÃO GUIADA · PASSO ${step} DE 5`;
 guideOverlay.querySelector('#guide-tour-title').textContent=copy.title;guideOverlay.querySelector('[data-guide-text]').textContent=copy.text(p);guideOverlay.querySelector('[data-guide-task]').textContent=phase==='allocate'&&step<5?(p.guide.didAction||left===0?'Etapa pronta para continuar.':'Sua próxima ação: altere o valor de uma perícia.') : stage==='5-backstory'?(p.guide.didAction?'Anotação registrada.':'Escreva uma linha ou pule esta etapa.'):'O restante da ficha fica suavemente escurecido enquanto você acompanha.';
 const next=guideOverlay.querySelector('[data-guide-action="next"]'),canNext=stage==='4-budget'?p.skillBudgetMode==='personal':phase!=='allocate'||!!p.guide.didAction||left===0||stage==='5-backstory'&&!!p.guide.didAction;
 next.textContent=copy.next;next.disabled=!canNext;next.title=canNext?'':stage==='5-backstory'?'Escreva uma linha ou pule esta etapa.':'Altere uma perícia antes de continuar.';
 guideOverlay.querySelector('[data-guide-action="skip"]').textContent=stage==='5-backstory'?'Concluir sem escrever':'Pular etapa';
 requestAnimationFrame(()=>{if(!guideTarget?.isConnected)return;const r=guideTarget.getBoundingClientRect();if(r.top<12||r.bottom>innerHeight-100)guideTarget.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});positionGuide()});
}
function advanceGuide(index,action){
 const p=cur[index];if(!p?.guide)return;const step=+p.guide.step,phase=p.guide.phase||'budget';
 const finish=()=>{delete p.guide;p.ui.tab='sheet';p.skillNotice='';p.edit=true;guideOverlay.hidden=true;draw()};
 if(action==='exit'){finish();return}
 if(action==='skip'){
 if(step===3){p.guide.step=4;p.guide.phase='budget';p.guide.didAction=false;p.skillBudgetMode='occupational';p.ui.tab='sheet'}
  else if(step===4){p.guide.step=5;p.guide.phase='backstory';p.guide.didAction=false;p.ui.tab='backstory'}
  else{finish();return}
  draw();return;
 }
 if(action!=='next')return;
 if(step===3&&phase==='budget'){p.guide.phase='allocate';p.guide.didAction=false;p.skillBudgetMode='occupational';p.ui.tab='sheet'}
 else if(step===3){p.guide.step=4;p.guide.phase='budget';p.guide.didAction=false;p.skillBudgetMode='occupational';p.ui.tab='sheet'}
 else if(step===4&&phase==='budget'){if(p.skillBudgetMode!=='personal')return;p.guide.phase='allocate';p.guide.didAction=false;p.ui.tab='sheet'}
 else if(step===4){p.guide.step=5;p.guide.phase='backstory';p.guide.didAction=false;p.ui.tab='backstory'}
 else finish();
 if(p.guide){p.edit=true;draw()}
}
/* A barra antiga virou um narrador flutuante com foco no alvo. */
function guideBarHtml(){return''}
desk.addEventListener('input',e=>{const field=e.target.closest('textarea.bk');if(!field)return;const i=+field.dataset.i,p=cur[i];if(p?.guide&&+p.guide.step===5){p.guide.didAction=!!field.value.trim();guideTourSync()}});
desk.addEventListener('change',e=>{const field=e.target.closest('[data-skill-input]');if(!field)return;const i=+field.dataset.i,p=cur[i];if(!p?.guide||(+p.guide.step!==3&&+p.guide.step!==4)||p.guide.phase!=='allocate')return;const type=+p.guide.step===3?'occupational':'personal';if((+p.skillAllocations?.[field.dataset.k.slice(2)]?.[type]||0)>0)p.guide.didAction=true;guideTourSync()});
const guidedBtn=document.getElementById('guided');if(guidedBtn)guidedBtn.onclick=startGuidedCreation;
