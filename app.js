/* Interface da ficha: renderização, eventos, equipamentos, backup. */
function amnesiaAction(p,action,btn){
 const a=amn(p);
 if(action==='recall'){const st=amnesiaState(p);if(!st.sleeping)return;const give=Math.min(10,st.sleeping);a.released+=give;p.skillNotice=`Memória recuperada: +${give} pontos ocupacionais. O Guardião pode pedir um teste de Sanidade.`;p.edit=true;draw();return}
 if(action==='roll'){
  const usedSk=new Set(a.frag.map(f=>f.sk)),pool=AMNESIA_FRAGS.filter(f=>!usedSk.has(f.sk)&&!a.frag.some(x=>x.id===f.id));
  if(a.frag.length>=3||!pool.length)return;
  const f=pick(pool);ensureSkillBudget(p);if(p.removed)delete p.removed[f.sk];
  const now=p.sk[f.sk]!==undefined?+p.sk[f.sk]:Math.max(0,+base(f.sk,p.c)||0),floor=Object.prototype.hasOwnProperty.call(p.skillFloors,f.sk)?+p.skillFloors[f.sk]||0:Math.max(0,+base(f.sk,p.c)||0);
  p.sk[f.sk]=now+10;p.skillFloors[f.sk]=floor+10;a.frag.push({id:f.id,t:f.t,sk:f.sk});
  p.back=(p.back?String(p.back).replace(/\s+$/,'')+'\n':'')+`${FRAG_TAG} ${f.t} (+10 ${f.sk})`;p.skillNotice='';p.edit=true;draw();return}
 if(action==='reset'){
  for(const f of a.frag){if(p.sk[f.sk]!==undefined)p.sk[f.sk]=Math.max(0,p.sk[f.sk]-10);if(p.skillFloors[f.sk]!==undefined)p.skillFloors[f.sk]=Math.max(0,p.skillFloors[f.sk]-10)}
  a.frag=[];stripFragments(p);p.edit=true;draw();return}
 if(action==='seal'){const box=btn.closest('.amnesia-panel').querySelector('.am-sealed');box.classList.toggle('open');return}
}
function amnesiaRecallLabel(st){return st.full===0?'🧠 Defina a EDU primeiro':st.sleeping?`🧠 Recordar (+${Math.min(10,st.sleeping)} pts)`:'🧠 Memória completa'}
function amnesiaRefresh(p,el){
 const st=amnesiaState(p),set=(k,v)=>{const x=el.querySelector(`[data-am-${k}]`);if(x)x.textContent=String(v)};
 set('awake',st.awake);set('released',st.released);set('sleeping',st.sleeping);
 const b=el.querySelector('[data-am="recall"]');if(b){b.textContent=amnesiaRecallLabel(st);b.disabled=!st.sleeping}
}
function amnesiaPanel(p,i){
 const a=amn(p),st=amnesiaState(p),n=a.frag.length;
 const frags=n?a.frag.map(f=>`<li>${esc(f.t)} <b>+10 ${esc(f.sk)}</b></li>`).join(''):'<li class="am-none">Nenhum fragmento ainda. Sorteie até 3: cada um dá +10 numa perícia, sem gastar pontos.</li>';
 return`<section class="amnesia-panel" aria-label="Regras da Amnésia"><h3 class="st">🌫️ Amnésia</h3><p class="am-intro">Você acordou sem saber quem é. A mente esqueceu, mas o corpo ainda lembra.</p>
<div class="am-stats"><div><span>Pontos despertos</span><strong data-am-awake>${st.awake}</strong></div><div><span>Recuperados</span><strong data-am-released>${st.released}</strong></div><div><span>Adormecidos</span><strong data-am-sleeping>${st.sleeping}</strong></div></div>
<div class="am-actions"><button type="button" class="alt" data-am="recall" data-i="${i}" ${st.sleeping?'':'disabled'}>${amnesiaRecallLabel(st)}</button></div>
<h4 class="am-sub">Fragmentos de memória (${n}/3)</h4><ul class="am-frags">${frags}</ul>
<div class="am-actions"><button type="button" class="alt" data-am="roll" data-i="${i}" ${n>=3?'disabled':''}>🎲 Sortear fragmento</button><button type="button" class="alt" data-am="reset" data-i="${i}" ${n?'':'disabled'}>↺ Refazer fragmentos</button></div>
<label class="am-sealed-box"><span>Passado verdadeiro <small>· escrito pelo Guardião; fica borrado até clicar em Revelar</small></span><textarea class="in am-sealed" rows="3" data-am-sealed data-i="${i}" placeholder="Quem este investigador realmente era…">${esc(a.sealed)}</textarea></label>
<div class="am-actions"><button type="button" class="alt" data-am="seal" data-i="${i}">👁 Revelar / ocultar</button></div>
<small class="am-rules">Regras: só metade dos pontos ocupacionais (EDU × 4) está desperta; o resto volta quando o Guardião liberar “Recordar”, e cada lembrança pode pedir um teste de Sanidade. Os pontos ocupacionais valem para qualquer perícia, até 60%. Os fragmentos entram na Backstory.</small></section>`;
}
/* confirmação dinâmica reutilizada por todo o site: askConfirm({title,html,ok,danger}) → Promise<boolean> */
/* escolha do tipo de ficha em branco: askSheetType() → 'normal' | 'unlimited' | null */
function askSheetType(){return new Promise(ok=>{
 const ov=document.createElement('div'),prev=document.activeElement;ov.className='ovl';
 ov.innerHTML=`<div class="dlg sheet-type" role="dialog" aria-modal="true" aria-labelledby="stT"><h4 id="stT">Que tipo de ficha em branco?</h4><div class="sheet-opts"><button type="button" class="sheet-opt" data-t="normal"><span class="so-ico" aria-hidden="true">📜</span><strong>Ficha normal</strong><span class="so-desc">Segue as regras de criação de Chamado de Cthulhu. Você escolhe uma ocupação da lista, a faixa de Nível de Crédito dela é respeitada e os pontos ocupacionais e pessoais (INT × 2) são distribuídos com limites.</span></button><button type="button" class="sheet-opt" data-t="unlimited"><span class="so-ico" aria-hidden="true">♾️</span><strong>Ficha sem limites</strong><span class="so-desc">Tudo é livre. Você escreve a ocupação que quiser e edita qualquer atributo ou perícia sem mínimo nem máximo. Não há pontos a distribuir nem faixa de Nível de Crédito.</span></button></div><div class="row"><button type="button" class="alt" data-t="">Cancelar</button></div></div>`;
 const key=e=>{
  if(e.key==='Escape'){e.preventDefault();done(null)}
  else if(e.key==='Tab'){const bs=[...ov.querySelectorAll('button')],k=bs.indexOf(document.activeElement);e.preventDefault();bs[(k+(e.shiftKey?-1:1)+bs.length)%bs.length].focus()}
 };
 const done=v=>{document.removeEventListener('keydown',key,true);ov.remove();if(prev&&prev.focus)prev.focus();ok(v)};
 ov.addEventListener('click',e=>{const b=e.target.closest('button');if(b)done(b.dataset.t||null);else if(e.target===ov)done(null)});
 document.addEventListener('keydown',key,true);
 document.body.appendChild(ov);ov.querySelector('[data-t="normal"]').focus();
})}
function askConfirm(o){return new Promise(ok=>{
 const ov=document.createElement('div'),prev=document.activeElement;ov.className='ovl';
 ov.innerHTML=`<div class="dlg" role="alertdialog" aria-modal="true" aria-labelledby="dlgT"><h4 id="dlgT">${o.title}</h4><p>${o.html}</p><div class="row"><button class="alt" data-r="0">Cancelar</button><button class="${o.danger===false?'':'danger'}" data-r="1">${o.ok||'Confirmar'}</button></div></div>`;
 const key=e=>{
  if(e.key==='Escape'){e.preventDefault();done(false)}
  else if(e.key==='Tab'){const bs=[...ov.querySelectorAll('button')],k=bs.indexOf(document.activeElement);e.preventDefault();bs[(k+(e.shiftKey?-1:1)+bs.length)%bs.length].focus()}
 };
 const done=v=>{document.removeEventListener('keydown',key,true);ov.remove();if(prev&&prev.focus)prev.focus();ok(v)};
 ov.addEventListener('click',e=>{const b=e.target.closest('button');if(b)done(b.dataset.r==='1');else if(e.target===ov)done(false)});
 document.addEventListener('keydown',key,true);
 document.body.appendChild(ov);ov.querySelector('[data-r="0"]').focus();
})}
/* diálogo com N botões: askChoice({title,html,choices:[{v,label,primary?,danger?}]}) → valor escolhido ou null */
function askChoice(o){return new Promise(ok=>{
 const ov=document.createElement('div'),prev=document.activeElement;ov.className='ovl';
 ov.innerHTML=`<div class="dlg" role="alertdialog" aria-modal="true" aria-labelledby="chT"><h4 id="chT">${o.title}</h4><div class="dlg-body">${o.html}</div><div class="row">${o.choices.map(c=>`<button type="button" class="${c.danger?'danger':c.primary?'':'alt'}" data-c="${esc(c.v)}">${c.label}</button>`).join('')}</div></div>`;
 const key=e=>{
  if(e.key==='Escape'){e.preventDefault();done(null)}
  else if(e.key==='Tab'){const bs=[...ov.querySelectorAll('button')],k=bs.indexOf(document.activeElement);e.preventDefault();bs[(k+(e.shiftKey?-1:1)+bs.length)%bs.length].focus()}
 };
 const done=v=>{document.removeEventListener('keydown',key,true);ov.remove();if(prev&&prev.focus)prev.focus();ok(v)};
 ov.addEventListener('click',e=>{const b=e.target.closest('button');if(b)done(b.dataset.c);else if(e.target===ov)done(null)});
 document.addEventListener('keydown',key,true);
 document.body.appendChild(ov);(ov.querySelector('button:not(.alt):not(.danger)')||ov.querySelector('button')).focus();
})}
const confirmDel=name=>askConfirm({title:'Excluir ficha?',html:`<strong>${esc(name)}</strong> será apagada e isso não dá para desfazer.`,ok:'🗑 Excluir'});
const ttl=p=>[p.nome,p.occ].filter(Boolean).join(' — ')||(p.unlimited?'Ficha sem limites':'Ficha em branco');
const sel=document.getElementById('occ'),desk=document.getElementById('desk');
sel.innerHTML='<option value="*">🎲 Aleatória</option>'+[...OCC].sort(srt).map(o=>`<option>${o.n}</option>`).join('');
const sel2=document.getElementById('occ2');
const subOpts=()=>Object.entries(SUB).forEach(([n,s])=>Object.keys(s.o).forEach(k=>{sel.insertAdjacentHTML('beforeend',`<option value="${n}::${k}" hidden>${n} (${k})</option>`);sel2.insertAdjacentHTML('beforeend',`<option value="occ:${n}::${k}" hidden>${n} (${k}) — como secundária</option>`)}));
sel2.innerHTML='<option value="">Nenhuma</option><option value="*">🎲 Aleatória</option><optgroup label="Ocupações">'+[...OCC].sort(srt).map(o=>`<option value="occ:${o.n}">${o.n}</option>`).join('')+'</optgroup>';
subOpts();
let cur=[],zTop=10,drag=null,rsz=null,saveT=0,dirty=false,blockSaves=false,storeReady=false;
const unlimitedPanel=()=>`<aside class="skill-pool unlimited-note" role="note"><b>Ficha sem limites</b><small>Não há pontos para distribuir nem mínimos ou máximos. Edite livremente atributos, perícias, ocupação e Nível de Crédito.</small></aside>`;
const budgetModeGuidance=new WeakMap();
function guideBudgetMode(i,mode){
 const p=cur[i];if(!p)return;
 const previous=budgetModeGuidance.get(p);if(previous)clearTimeout(previous.timer);
 const hint={mode,timer:null};
 hint.timer=setTimeout(()=>{
  if(budgetModeGuidance.get(p)!==hint)return;
  budgetModeGuidance.delete(p);
  const currentIndex=cur.indexOf(p);if(currentIndex>=0)refresh(currentIndex);
 },3200);
 budgetModeGuidance.set(p,hint);
}
function budgetChoiceNote(p){
 const left=occupationChoiceRemaining(p);if(!left.any&&!left.social)return'';
 return`<aside class="budget-choice-note" data-budget-choice-note role="status" aria-live="polite" title="Use estas vagas ao distribuir pontos ocupacionais."><strong>Vagas da ocupação</strong>${left.any?`<span class="choice-count"><b>Perícias aleatórias</b><strong>${left.any}</strong></span>`:''}${left.social?`<span class="choice-count"><b>Perícias sociais</b><strong>${left.social}</strong></span>`:''}<small>escolha com pontos ocupacionais</small></aside>`;
}
function skillAllocationHint(p,n){
 const value=Math.max(0,+get(p,'s:'+n)||0),details=[`Normal ${value}%, Difícil ${value>>1}%, Extremo ${Math.floor(value/5)}%.`];
 const a=p.skillAllocations?.[n];
 if(isBudget(p)&&a){
  const occupational=Math.max(0,+a.occupational||0),personal=Math.max(0,+a.personal||0);
  if(occupational||personal)details.push(`${occupational} pontos ocupacionais e ${personal} pessoais distribuídos.`);
 }
 return details.join(' ');
}
function creationAttributesReady(p){return Object.keys(ATTR_RANGE).every(k=>+p.c?.[k]>0)}
function blankBudgetPanel(p,i){
 const b=blankBudgetState(p),credit=b.credit,mode=p.skillBudgetMode||'occupational',guideMode=budgetModeGuidance.get(p)?.mode;
  const creditReady=!!credit&&creationAttributesReady(p);
  const defaultNote=creditReady?'Pontos ocupacionais descontam o Crédito mínimo e valem para perícias da ocupação. Pontos pessoais equivalem a INT × 2. Trocar de ocupação zera a distribuição.':'Escolha uma ocupação e defina os atributos (ou use “Sortear atributos”) para calcular os pontos disponíveis. Pontos pessoais = INT × 2.';
  const creditParts=creditReady?`Mínimo <b>${credit.min}</b> · Máximo <b>${credit.max}</b>`:credit?'Defina os atributos para calcular a faixa':'Escolha uma ocupação para ver a faixa';
  return`<section class="blank-budgets" aria-label="Pontos de criação"><div class="budget-balance"><div class="budget-stat"><span>Pontos ocupacionais</span><strong><em data-budget-available="occupational">${b.occupational.available}</em><small>disponíveis de</small><span data-budget-total="occupational">${b.occupational.total}</span> pts</strong></div><div class="budget-stat"><span>Pontos pessoais · INT × 2</span><strong><em data-budget-available="personal">${b.personal.available}</em><small>disponíveis de</small><span data-budget-total="personal">${b.personal.total}</span> pts</strong></div></div><div class="budget-controls"><label class="budget-mode${guideMode?' is-guide':''}"><span>Distribuir agora</span><select data-budget-mode data-i="${i}" aria-label="Tipo de pontos a distribuir"><option value="occupational" ${mode==='occupational'?'selected':''}>Ocupacionais</option><option value="personal" ${mode==='personal'?'selected':''}>Pessoais</option></select></label><div class="credit-range" data-credit-range><b>Nível de Crédito da ocupação</b><span>${creditParts}</span></div></div>${budgetChoiceNote(p)}<small class="occ-legend" data-occ-legend ${mode==='occupational'&&creditReady?'':'hidden'}>${isAmnesia(p)?'🌫️ Instinto: qualquer perícia aceita pontos ocupacionais, mas só até 60%. Metade dos pontos está adormecida (veja Amnésia abaixo).':'<span class="occ-legend-mark"></span> Perícias destacadas em dourado são as da ocupação escolhida: gaste os pontos ocupacionais nelas.'}</small><small data-skill-pool-note class="${p.skillNotice?'has-warning':''}">${esc(p.skillNotice||defaultNote)}</small></section>`;
}
const inp=(p,i,k,attrs='',label='')=>`<input class="in" type="${k==='d:db'?'text':'number'}" data-i="${i}" data-k="${esc(k)}"${label?` aria-label="${esc(label)}"`:''} ${attrs} value="${esc(get(p,k))}">`;
const row=(p,i,n,rm)=>{
 const minimum=skillFloor(p,n);
 const occ=isOccupationHighlight(p,n),socialChoice=isSocialChoiceAvailable(p,n),title=occ?'Perícia da ocupação':socialChoice?'Vaga social disponível; confirme ao distribuir pontos ocupacionais':'';
 const allocationHint=skillAllocationHint(p,n),hintAttr=allocationHint?` title="${esc(allocationHint)}" aria-description="${esc(allocationHint)}"`:'';
 return`<span class="skill-row${occ?' occ-skill':''}${socialChoice&&(!isBudget(p)||(p.skillBudgetMode||'occupational')==='occupational')?' social-choice':''}"${title?` title="${title}"`:''}><span class="sk-label"><span class="sk-name">${esc(n)}</span></span><i>${inp(p,i,'s:'+n,`min="${minimum}" data-skill-input${hintAttr}`,n+' (%)')}<small data-f="${esc('s:'+n)}" aria-hidden="true">${fr(p,'s:'+n)}</small>${rm?`<button class="rmb" title="Remover perícia" data-i="${i}" data-n="${esc(n)}">✕</button>`:''}</i></span>`;
};
function uiOf(p,i){
 p.ui=p.ui||{};
 if(p.ui.x==null)p.ui.x=18+(i%6)*36;
 if(p.ui.y==null)p.ui.y=10+(i%6)*28;
 if(!p.ui.w)p.ui.w=520;
 if(p.ui.skillsWide){p.ui.w=520;delete p.ui.skillsWide}
 if(!p.ui.z)p.ui.z=++zTop;
 return p.ui;
}
function body(p,i){
 ensureSkillBudget(p);
 const bud=isBudget(p),free=!!p.unlimited,emptyOk=!!p.blank&&!p.budget;
 const st=Object.keys(p.c).map(k=>{const[mn,mx]=ATTR_RANGE[k]||[0,99],attrs=free?'min="0" max="999"':`min="${emptyOk?0:mn}" max="${mx}" step="5"`;return`<div><b>${k}</b>${inp(p,i,'c:'+k,attrs,ATTR_NAMES[k]||k)}<small data-f="c:${k}">${fr(p,'c:'+k)}</small></div>`}).join('');
 const sk=Object.entries(p.sk).sort((a,b)=>b[1]-a[1]).map(([n])=>row(p,i,n,1)).join('');
 const skillPool=free?unlimitedPanel():bud?blankBudgetPanel(p,i):`<aside class="skill-pool" role="status"><b>Pontos para redistribuir</b><strong><span data-skill-points>${p.skillPoints.available}</span> pts</strong><small data-skill-pool-note>${esc(p.skillNotice||'Reduza uma perícia acima do mínimo para liberar pontos; aumentos usam os pontos disponíveis.')}</small></aside>`;
 const hl=bud&&(p.skillBudgetMode||'occupational')==='occupational'?' hl-occ':'';
 const addM=bud?`<div class="add"><input class="in" style="width:76%" placeholder="Nova perícia (entra com o valor-base; gaste pontos nela)" list="skillSuggest" data-add="n" aria-label="Nome da nova perícia"><button class="addb" data-i="${i}" data-m="1">+ Adicionar</button></div>`:`<div class="add"><input class="in" style="width:58%" placeholder="Nova perícia do personagem" list="skillSuggest" data-add="n" aria-label="Nome da nova perícia"><input class="in" type="number" value="50" title="Valor" data-add="v" aria-label="Valor"><button class="addb" data-i="${i}" data-m="1">+ Adicionar</button></div>`;
 const d=[['hp','PV'],['san','Sanidade'],['luck','Sorte'],['pm','PM'],['mov','Mov'],['db','Bônus de Dano'],['corpo','Corpo']].map(([k,l])=>`<label class="der-field"><span>${l}</span>${inp(p,i,'d:'+k,k==='sanMax'?'readonly tabindex="-1" title="99 − Mitos de Cthulhu"':'',l)}</label>`).join('');
 const fa=`<button class="ftg" data-i="${i}">${p.falta?'▲ Ocultar perícias não treinadas':'▼ Perícias não treinadas'}</button>`+(p.falta?`<h3 style="margin:12px 0 4px;font-size:.9rem">Perícias não treinadas (valor-base)</h3><div class="sk${hl}">${falta(p).map(([n])=>row(p,i,n,1)).join('')}</div><div class="add"><input class="in" style="width:58%" placeholder="Nova perícia (ex.: Arte/Ofício (Cerâmica))" list="skillSuggest" data-add="n"><input class="in" type="number" value="1" title="Valor inicial" data-add="v"><button class="addb" data-i="${i}">+ Adicionar</button></div>`:'');
 const mobileActions=`<div class="mobile-card-actions"><button class="dupb" data-i="${i}" title="Criar uma cópia desta ficha">❐ Duplicar</button></div>`;
 const pb=free?'':`<button type="button" class="pbb" data-i="${i}" title="Distribuir 460 pontos entre os atributos (regra opcional do livro)">⚖ Compra de pontos</button>`;
 return`<div class="ficha-heading"><h2><input class="in nm" data-i="${i}" data-k="n:nome" aria-label="Nome do investigador" placeholder="Nome do investigador" value="${esc(p.nome)}"></h2><button class="burb" data-i="${i}" title="Enviar para o cemitério">🪦 <span class="bl">Cemitério</span></button></div>
  <div class="sub">${occSelect(p,i)}<span>Idade</span><input class="in age-input" data-i="${i}" data-k="n:idade" type="number" min="0" max="999" placeholder="idade" aria-label="Idade" value="${esc(p.idade)}"><span>anos</span>${p.sec?`<small>· secundária: ${esc(p.sec)}</small>`:''}</div>
  <div class="stats-head"><span>Atributos</span><span class="stats-tools"><button type="button" class="rrb" data-i="${i}" title="Sortear novos atributos (3d6×5 e 2d6+6×5) e recalcular tudo que depende deles">🎲 Sortear atributos</button>${pb}</span></div><div class="stats">${st}</div><div class="der">${d}</div>${skillPool}${isAmnesia(p)?amnesiaPanel(p,i):''}${typeof resourcesPanel==='function'?resourcesPanel(p,i):''}
  <h3 class="st skill-heading"><span>Perícias do personagem</span><small data-skill-count>${Object.keys(p.sk).length} perícias</small></h3><div class="sk${hl}">${sk}</div>${addM}${fa}${mobileActions}`;
}
function occSelect(p,i){
 if(!p.blank||p.unlimited)return`<input class="in occ-text" data-i="${i}" data-k="n:occ" aria-label="Ocupação do investigador" placeholder="${p.unlimited?'Ocupação (escreva livremente)':'Ocupação'}" value="${esc(p.occ||'')}">`;
 const current=String(p.occ||'');
 return`<button type="button" class="pickbtn blank-occ-picker" data-blank-occ data-i="${i}" aria-haspopup="dialog" aria-label="Escolher ocupação do investigador"><span class="pe">🧭</span><span class="pt">${esc(current||'Escolher ocupação')}</span><span class="pc">▾</span></button>`;
}
function backstory(p,i){
 const photo=p.portrait||{},hasPhoto=!!photo.src,zoom=Math.max(1,Math.min(3,+photo.zoom||1));
 const origins=(p.hist||[]).map(g=>`<div class="orig"><b>${esc(g.kind)}:</b> ${esc(g.n)}</div>`).join(''),credit=crRangeTxt(p)?`<div class="orig"><b>Nível de Crédito:</b> <small>${esc(crRangeTxt(p))}</small></div>`:'';
 return`<div class="backstory-layout"><section class="backstory-photo"><h3>Aparência do personagem</h3><canvas class="portrait-canvas" width="156" height="192" data-portrait-canvas data-i="${i}" aria-label="Enquadramento do retrato do personagem" tabindex="0"></canvas><div class="portrait-controls"><label class="portrait-file">${hasPhoto?'Trocar imagem':'Adicionar imagem'}<input type="file" accept="image/*" data-portrait-file data-i="${i}"></label><label data-portrait-zoom-label ${hasPhoto?'':'hidden'}>Zoom<input type="range" min="1" max="3" step="0.02" value="${zoom}" data-portrait-zoom data-i="${i}"></label><button type="button" class="alt" data-portrait-remove data-i="${i}" ${hasPhoto?'':'hidden'}>Remover imagem</button><small class="portrait-tip" ${hasPhoto?'':'hidden'}>Arraste a imagem para ajustar o recorte.</small></div></section><section class="backstory-text"><h3 class="st">Origem</h3><div class="hist">${origins||'<div class="orig"><small>Esta ficha não tem origem ocupacional definida.</small></div>'}${credit}</div><h3 class="st">Backstory</h3><textarea class="in bk" rows="8" data-i="${i}" data-k="n:back" placeholder="Quem é o personagem? De onde veio? O que já viveu ou descobriu?">${esc(p.back||'')}</textarea></section></div>`;
}
function card(p,i){
 const u=uiOf(p,i),tab=['equipment','backstory','combat'].includes(u.tab)?u.tab:'sheet',on=t=>tab===t;
 const cnt=p.equipment&&p.equipment.length?` (${p.equipment.length})`:'';
 return`<section class="win${p.pinned?' pinned':''}${u.collapsed?' collapsed':''}" data-i="${i}" style="left:${u.x}px;top:${u.y}px;width:${u.w}px;z-index:${u.z}">
  <header class="win-bar">
   <button class="colb" data-i="${i}" title="Recolher / expandir">${u.collapsed?'▢':'–'}</button>
   <span class="win-title">${esc(ttl(p))}</span>
   <button class="pdfb" data-i="${i}" title="Imprimir ou salvar esta ficha como PDF">📄 <span class="bl">PDF</span></button>
   <button class="shb" data-i="${i}" title="Compartilhar: baixar arquivo da ficha ou copiar link">📤 <span class="bl">Enviar</span></button>
   <button class="pinb${p.pinned?' on':''}" data-i="${i}" title="Manter na mesa: a ficha não some quando você gera novas">${p.pinned?'📌 <span class="bl">Mantida</span>':'📌 <span class="bl">Manter</span>'}</button>
   <button class="dupb" data-i="${i}" title="Duplicar">❐</button>
   <button class="delb" data-i="${i}" title="Excluir">🗑</button>
  </header>
  ${typeof guideBarHtml==='function'?guideBarHtml(p,i):''}
  <div class="win-tabs" role="tablist" aria-label="Seções da ficha"><button type="button" data-sheet-tab="sheet" role="tab" aria-selected="${on('sheet')}">🗂 Ficha</button><button type="button" data-sheet-tab="backstory" role="tab" aria-selected="${on('backstory')}">📖 Backstory</button><button type="button" data-sheet-tab="combat" role="tab" aria-selected="${on('combat')}">⚔️ Combate</button><button type="button" data-sheet-tab="equipment" role="tab" aria-selected="${on('equipment')}">🎒 Equipamentos${cnt}</button></div>
  <div class="win-body"><div class="win-pane sheet-pane" role="tabpanel" ${on('sheet')?'':'hidden'}>${body(p,i)}</div><div class="win-pane equipment-pane" role="tabpanel" ${on('equipment')?'':'hidden'}>${window.CthEquipment.render(p,i)}</div><div class="win-pane backstory-pane" role="tabpanel" ${on('backstory')?'':'hidden'}>${backstory(p,i)}</div><div class="win-pane combat-pane" role="tabpanel" ${on('combat')?'':'hidden'}>${typeof combatPanel==='function'?combatPanel(p,i):''}</div></div>
  <div class="rsz" data-i="${i}"></div>
 </section>`;
}
/* Gravação: marca como "sujo" e grava depois de 180 ms; ao sair da página grava na hora. Falhas aparecem na tela (veja showSaveBanner). */
function snapshot(){return{cur,occ:sel.value,occ2:sel2.value,qty:document.getElementById('qty').value,zTop}}
function persist(){
 dirty=true;clearTimeout(saveT);
 saveT=setTimeout(persistNow,180);
}
function persistNow(){
 clearTimeout(saveT);
 if(!storeReady||blockSaves||!dirty)return Promise.resolve();
 dirty=false;
 return FichaStore.save(snapshot());
}
addEventListener('pagehide',()=>{persistNow()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')persistNow()});
function saveBannerEl(){let b=document.getElementById('saveBanner');if(!b){b=document.createElement('div');b.id='saveBanner';b.className='save-banner';b.setAttribute('role','alert');b.hidden=true;document.body.insertBefore(b,document.body.firstChild)}return b}
function hideSaveBanner(){const b=document.getElementById('saveBanner');if(b)b.hidden=true}
function showSaveBanner(kind,err){
 const b=saveBannerEl();b.hidden=false;
 if(kind==='conflict'){
  b.innerHTML='<strong>⚠ As fichas foram alteradas em outra aba ou janela.</strong><span>Para não perder trabalho, esta aba parou de salvar até você escolher:</span><button type="button" data-sb="reload">Usar a versão da outra aba</button><button type="button" class="alt" data-sb="keep">Manter esta e sobrescrever</button>';
 }else{
  const full=err&&(err.name==='QuotaExceededError'||/quota|cheio|full/i.test(String(err.message||'')));
  b.innerHTML=`<strong>⚠ Não foi possível salvar as fichas.</strong><span>${full?'O armazenamento do navegador está cheio.':'O navegador recusou a gravação.'} Baixe um backup agora para não perder nada.</span><button type="button" data-sb="backup">💾 Baixar backup</button><button type="button" class="alt" data-sb="retry">Tentar de novo</button>`;
 }
}
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-sb]');if(!b)return;
 const act=b.dataset.sb;
 if(act==='backup'){const o=document.getElementById('bkpOut');if(o)o.click();return}
 if(act==='retry'){dirty=true;await persistNow();return}
 if(act==='keep'){blockSaves=false;hideSaveBanner();dirty=true;await FichaStore.save(snapshot(),{force:true});return}
 if(act==='reload'){const r=await FichaStore.reload();applyState(r.state);blockSaves=false;hideSaveBanner()}
});
FichaStore.onStatus(s=>{
 const el=document.getElementById('saved');if(!el)return;
 if(s.ok){const t=new Date();el.textContent='· salvo às '+String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0');el.classList.remove('save-err');hideSaveBanner();if(blockSaves&&!staleRemote)blockSaves=false}
 else if(s.conflict){el.textContent='· ⚠ não salvo (outra aba)';el.classList.add('save-err');dirty=true}
 else{el.textContent='· ⚠ NÃO SALVO';el.classList.add('save-err');dirty=true;showSaveBanner('error',s.error)}
});
let staleRemote=false;
FichaStore.onRemote(()=>{staleRemote=true;blockSaves=true;showSaveBanner('conflict')});
function fitDesk(){
 let w=800,h=560;
 const mob=document.body.classList.contains('mobile'),aw=fichaDeskW();
 cur.forEach((p,i)=>{
  const u=uiOf(p,i);
  if(!mob){
   const nx=Math.max(0,Math.min(u.x,aw-u.w)),ny=Math.max(0,Math.min(u.y,FICHA_MAXY));
   if(nx!==u.x||ny!==u.y){u.x=nx;u.y=ny;const el=winEl(i);if(el){el.style.left=nx+'px';el.style.top=ny+'px'}}
  }
  const el=winEl(i);w=Math.max(w,u.x+u.w);h=Math.max(h,u.y+(u.collapsed?56:el?el.offsetHeight:640))});
 desk.style.minWidth=Math.min(w,aw)+'px';desk.style.minHeight=h+'px';
}
/* limites: as janelas ficam dentro da largura da tela e não descem além de FICHA_MAXY */
const FICHA_MAXY=6000; /* limite só de segurança: a mesa cresce para baixo conforme as fichas descem */
function fichaDeskW(){return Math.max(280,document.documentElement.clientWidth-32)}
let fichaFitT=0;addEventListener('resize',()=>{clearTimeout(fichaFitT);fichaFitT=setTimeout(()=>{if(!document.body.classList.contains('mobile')){fitDesk();persist()}},120)});
/* Atualiza só as janelas cujo HTML mudou, mantendo o foco, a posição do cursor e a rolagem de quem não mudou. */
let renderCache=[];
const kebab=s=>s.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
function activeSig(root){
 const a=document.activeElement;if(!a||a===document.body||!root.contains(a))return null;
 const sel=a.tagName.toLowerCase()+Object.entries(a.dataset).map(([k,v])=>`[data-${kebab(k)}="${String(v).replace(/["\\]/g,'\\$&')}"]`).join('');
 let s=null,e=null;try{s=a.selectionStart;e=a.selectionEnd}catch(_){}
 return{sel,s,e};
}
function scrollSig(root){return[root,...root.querySelectorAll('.win-body,.win-pane,.sk,.eq-list,.cb-wrap')].map(x=>[x.scrollTop,x.scrollLeft])}
function swapWin(old,html){
 const sig=activeSig(old),sc=scrollSig(old),t=document.createElement('template');t.innerHTML=html.trim();
 const n=t.content.firstElementChild;old.replaceWith(n);
 const all=[n,...n.querySelectorAll('.win-body,.win-pane,.sk,.eq-list,.cb-wrap')];
 all.forEach((x,k)=>{if(sc[k]){x.scrollTop=sc[k][0];x.scrollLeft=sc[k][1]}});
 if(sig){const f=n.querySelector(sig.sel);if(f){try{f.focus({preventScroll:true});if(sig.s!=null&&f.setSelectionRange)f.setSelectionRange(sig.s,sig.e)}catch(_){}}}
 return n;
}
const draw=()=>{
 window.DynamicInfo?.hide();
 if(!cur.length){
  desk.innerHTML='<p class="empty">Nenhuma ficha. Clique em Gerar — e depois use “Manter” nas que quiser guardar.</p>';renderCache=[];
 }else{
  const htmls=cur.map(card),wins=[...desk.children].filter(el=>el.classList&&el.classList.contains('win'));
  if(wins.length!==renderCache.length||desk.querySelector(':scope > .empty')){
   desk.innerHTML=htmls.join('');hydratePortraits(desk);
  }else{
   const fresh=[];
   htmls.forEach((h,k)=>{
    if(k<wins.length){if(h!==renderCache[k])fresh.push(swapWin(wins[k],h))}
    else{desk.insertAdjacentHTML('beforeend',h);fresh.push(desk.lastElementChild)}
   });
   for(let k=wins.length-1;k>=htmls.length;k--)wins[k].remove();
   fresh.forEach(el=>hydratePortraits(el));
  }
  renderCache=htmls;
 }
 fitDesk();persist();
};
function portraitGeometry(img,w,h,p){
 const z=Math.max(1,Math.min(3,+p.zoom||1)),scale=Math.max(w/img.width,h/img.height)*z,iw=img.width*scale,ih=img.height*scale;
 const maxX=Math.max(0,(iw-w)/2/w),maxY=Math.max(0,(ih-h)/2/h),x=Math.max(-maxX,Math.min(maxX,+p.x||0)),y=Math.max(-maxY,Math.min(maxY,+p.y||0));
 p.x=x;p.y=y;return{iw,ih,x:w/2+x*w-iw/2,y:h/2+y*h-ih/2};
}
function hydratePortraits(root=desk){
 root.querySelectorAll('[data-portrait-canvas]').forEach(canvas=>{
  const p=cur[+canvas.dataset.i],photo=p&&p.portrait;if(!p)return;
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,156,192);ctx.fillStyle='#0b1715';ctx.fillRect(0,0,156,192);
  if(!photo||!photo.src)return;
  const img=new Image();img.onload=()=>{if(!canvas.isConnected)return;const g=portraitGeometry(img,156,192,photo);ctx.clearRect(0,0,156,192);ctx.drawImage(img,g.x,g.y,g.iw,g.ih)};img.src=photo.src;
 });
}
function paintPortrait(canvas,p){
 const photo=p.portrait;if(!photo||!photo.src)return;
 const img=new Image();img.onload=()=>{if(!canvas.isConnected)return;const ctx=canvas.getContext('2d'),g=portraitGeometry(img,156,192,photo);ctx.clearRect(0,0,156,192);ctx.drawImage(img,g.x,g.y,g.iw,g.ih)};img.src=photo.src;
}
async function shrinkPortrait(file){
 const bitmap=await createImageBitmap(file),scale=Math.min(1,640/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');
 canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close&&bitmap.close();return canvas.toDataURL('image/jpeg',.85);
}
function winEl(i){return desk.querySelector('.win[data-i="'+i+'"]')}
function bring(i){const p=cur[i];if(!p)return;p.ui.z=++zTop;const el=winEl(i);if(el)el.style.zIndex=p.ui.z;persist()}
/* rerolar atributos: sorteia os 8 atributos de novo e recalcula tudo que depende deles (mesma lógica da edição manual) */
const rollSig=p=>JSON.stringify(p.blank?p.c:[p.c,p.sk]);
/* ficha gerada: sorteia atributos novos e redistribui as perícias com a mesma ocupação, secundária, histórico e idioma */
function rerollFull(p,attrs){
 const occ=occupationFor(occRefOf(p));if(!occ)return false;
 const sec=p.sec?occupationFor(p.sec):null,spec=x=>x.occupation.n+(x.specialization?'::'+x.specialization:'');
 const oldLang=Object.keys(p.sk).find(n=>/^Língua \(/.test(n));
 const g=gen(spec(occ),sec?'occ:'+spec(sec):'',{hist:p.hist||[],lang:oldLang?oldLang.slice(8,-1):'',...(attrs?{c:attrs}:{})});
 const luck=p.der&&p.der.luck;
 p.c=g.c;p.sk=g.sk;p.skillFloors=g.skillFloors;p.skillAllocations=g.skillAllocations;p.budget=true;p.occKey=g.occKey;p.anyExtra=g.anyExtra;
 p.skillPoints={available:0};p.skillNotice='';p.creditRange=g.creditRange;
 p.der={...g.der,luck:luck!==undefined?luck:g.der.luck};
 p.rolledC=rollSig(p);p.edit=true;
 draw();return true;
}
/* ficha em branco: há pontos de criação já distribuídos (ocupacionais/pessoais) ou fragmentos de Amnésia? */
const hasBlankPoints=p=>!!p&&isBudget(p)&&(Object.values(p.skillAllocations||{}).some(a=>(+a.occupational||0)+(+a.personal||0)>0)||!!(p.amnesia&&Array.isArray(p.amnesia.frag)&&p.amnesia.frag.length));
function rerollAttrs(i,attrs){
 const p=cur[i];if(!p)return;
 if(!p.blank&&rerollFull(p,attrs))return;
 const next=attrs||rollAttrs();
 if(p.blank&&!p.unlimited){
  /* Os totais de pontos dependem dos atributos (ocupação e INT×2). Com atributos novos, a distribuição antiga deixa de valer:
     zera alocações e perícias para o mínimo (mesmo reset de trocar de ocupação), mantendo ocupação, Sorte e perícias adicionadas. */
  const luck=p.der&&p.der.luck,had=hasBlankPoints(p);
  Object.assign(p.c,next);
  p.der={...p.der,...calc(p.c)};if(luck!==undefined)p.der.luck=luck;
  resetBlankDistribution(p,p.occ);
  p.skillNotice=had?'Os atributos foram rerolados, então os pontos distribuídos foram zerados. Distribua os pontos novamente.':'';
  p.rolledC=rollSig(p);p.edit=true;
  draw();window.CthEquipment.refreshWarnings(p,winEl(i)&&winEl(i).querySelector('[data-eq-panel]'));persist();return;
 }
 const derived=['Esquivar','Língua Natural'].map(n=>({n,oldBase:base(n,p.c),oldFloor:skillFloor(p,n),value:p.sk[n]})),oldCredit=isBudget(p)?creditBounds(p):null,oldCreditValue=+p.sk['Nível de Crédito']||0,oldCreditFloor=skillFloor(p,'Nível de Crédito');
 Object.assign(p.c,next);
 const luck=p.der&&p.der.luck;
 p.der={...p.der,...calc(p.c)};if(luck!==undefined)p.der.luck=luck; /* a Sorte é outra rolagem: não muda */
 for(const d of derived)if(d.value!==undefined){const newBase=Math.max(0,+base(d.n,p.c)||0);if(p.unlimited){if((+d.value||0)===d.oldBase)p.sk[d.n]=newBase;p.skillFloors[d.n]=0}else{const bonus=Math.max(0,(+d.value||0)-d.oldFloor);p.sk[d.n]=newBase+bonus;p.skillFloors[d.n]=newBase}}
 if(isBudget(p)&&p.sk['Nível de Crédito']!==undefined){
  const range=creditBounds(p),floor=range?range.min:Math.max(0,+base('Nível de Crédito',p.c)||0),ceiling=range?range.max:999;
  const value=Math.max(floor,Math.min(ceiling,oldCreditValue));p.skillFloors['Nível de Crédito']=floor;p.sk['Nível de Crédito']=value;
  const allocations=p.skillAllocations&&p.skillAllocations['Nível de Crédito'];if(allocations){allocations.occupational=Math.max(0,value-floor);allocations.personal=0;if(!allocations.occupational)delete p.skillAllocations['Nível de Crédito']}
  p.skillNotice=value!==oldCreditValue||oldCreditFloor!==(range?range.min:floor)?`A faixa de Nível de Crédito mudou com os atributos${oldCredit?`; agora é ${floor}–${ceiling}`:''}.`:'';
 }
 p.rolledC=rollSig(p);p.edit=true;
 refresh(i);window.CthEquipment.refreshWarnings(p,winEl(i)&&winEl(i).querySelector('[data-eq-panel]'));
}
function refresh(i){
 const el=winEl(i),p=cur[i];if(!el)return;
 const smax=sanMaxOf(p);if(p.der&&+p.der.san>smax)p.der.san=smax;
 el.querySelectorAll('[data-k]').forEach(x=>{if(x!==document.activeElement)x.value=get(p,x.dataset.k)});
 el.querySelectorAll('[data-f]').forEach(x=>x.textContent=fr(p,x.dataset.f));
 el.querySelectorAll('[data-skill-input]').forEach(input=>{const n=input.dataset.k.slice(2),range=n==='Nível de Crédito'&&isBudget(p)?creditBounds(p):null;input.min=String(skillFloor(p,n));if(range)input.max=String(range.max);else input.removeAttribute('max')});
 if(p.unlimited){/* ficha sem limites: sem pontos nem faixas */}else if(isBudget(p)){
  const budgets=blankBudgetState(p);
  for(const type of ['occupational','personal']){
   const available=el.querySelector(`[data-budget-available="${type}"]`),total=el.querySelector(`[data-budget-total="${type}"]`);
   if(available)available.textContent=String(budgets[type].available);if(total)total.textContent=String(budgets[type].total);
  }
  const mode=el.querySelector('[data-budget-mode]');if(mode&&mode!==document.activeElement)mode.value=p.skillBudgetMode||'occupational';
  const modeLabel=el.querySelector('.budget-mode');if(modeLabel)modeLabel.classList.toggle('is-guide',!!budgetModeGuidance.get(p));
  const occMode=(p.skillBudgetMode||'occupational')==='occupational';
  el.querySelectorAll('.sk').forEach(box=>box.classList.toggle('hl-occ',occMode));
  el.querySelectorAll('.sk>.skill-row').forEach(skillRow=>{const input=skillRow.querySelector('[data-skill-input]'),name=input&&input.dataset.k.slice(2);if(name){skillRow.classList.toggle('occ-skill',isOccupationHighlight(p,name));skillRow.classList.toggle('social-choice',occMode&&isSocialChoiceAvailable(p,name));const hint=skillAllocationHint(p,name);if(hint){input.title=hint;input.setAttribute('aria-description',hint)}else{input.removeAttribute('title');input.removeAttribute('aria-description')}}});
  const choiceNote=el.querySelector('[data-budget-choice-note]'),choiceNoteHtml=budgetChoiceNote(p),choiceControls=el.querySelector('.budget-controls');
  if(choiceNoteHtml){if(choiceNote)choiceNote.outerHTML=choiceNoteHtml;else if(choiceControls)choiceControls.insertAdjacentHTML('afterend',choiceNoteHtml)}else if(choiceNote)choiceNote.remove();
  const creditReady=!!budgets.credit&&creationAttributesReady(p);
  const legend=el.querySelector('[data-occ-legend]');if(legend)legend.hidden=!(occMode&&creditReady);
  const range=el.querySelector('[data-credit-range] span');if(range)range.textContent=creditReady?`Mínimo ${budgets.credit.min} · Máximo ${budgets.credit.max}`:budgets.credit?'Defina os atributos para calcular a faixa':'Escolha uma ocupação para ver a faixa';
  const pointNote=el.querySelector('[data-skill-pool-note]');if(pointNote){pointNote.textContent=p.skillNotice||(creditReady?'Pontos ocupacionais já descontam o Crédito mínimo e só podem ser usados nas perícias da ocupação. Pontos pessoais = INT × 2. Trocar de ocupação zera os pontos distribuídos.':'Escolha uma ocupação e defina os atributos (ou use “Sortear atributos”) para calcular os pontos disponíveis. Pontos pessoais = INT × 2.');pointNote.classList.toggle('has-warning',!!p.skillNotice)}
 }else{
  const points=el.querySelector('[data-skill-points]');if(points)points.textContent=String(p.skillPoints&&p.skillPoints.available||0);
  const pointNote=el.querySelector('[data-skill-pool-note]');if(pointNote)pointNote.textContent=p.skillNotice||'Reduza uma perícia acima do mínimo para liberar pontos; aumentos usam os pontos disponíveis.';
 }
 if(isAmnesia(p))amnesiaRefresh(p,el);
 const t=el.querySelector('.win-title');if(t)t.textContent=ttl(p);
 if(typeof refreshExtras==='function')refreshExtras(p,el,i);
 persist();
}
function addMain(i,box){
 const p=cur[i],vi=box.querySelector('[data-add=v]'),nome=box.querySelector('[data-add=n]').value.replace(/[<>&"'`\\]/g,'').trim().slice(0,70);
 if(!nome||BAD_KEYS.has(nome)||p.sk[nome]!==undefined)return;
 /* nas fichas com orçamento a perícia entra com o valor-base: pontos só saem do orçamento, nunca "de graça" */
 const v=isBudget(p)?Math.max(0,+base(nome,p.c)||0):Math.max(0,Math.min(999,+(vi&&vi.value)||0));
 if(p.removed)delete p.removed[nome];if(p.custom)delete p.custom[nome];
 p.sk[nome]=v;if(isBudget(p)){ensureSkillBudget(p);p.skillFloors[nome]=v}p.edit=true;draw();
}
function addSkill(i,box){
 const p=cur[i],nome=box.querySelector('[data-add=n]').value.replace(/[<>&"']/g,'').trim(),v=Math.max(0,Math.min(999,+box.querySelector('[data-add=v]').value||0));
 if(p.removed&&p.removed[nome]){delete p.removed[nome];draw();return}
 if(!nome||p.sk[nome]!==undefined||nome in BASE||nome in EXTRA||(p.custom&&nome in p.custom))return;
 if(nome in SPECIAL_BASE&&p.removed)delete p.removed[nome];
 (p.custom=p.custom||{})[nome]=v;p.edit=true;draw();
}
async function approveEquipment(p,item){
 const warnings=window.CthEquipment.warnings(p,item);if(!warnings.length)return true;
 const html=`<strong>${esc(item.name)}</strong><br>${warnings.map(w=>`⚠ ${esc(w)}`).join('<br>')}<br>Esse aviso é só uma referência. Você pode combinar a escolha com o Guardião ou justificá-la no histórico do investigador.`;
 return askConfirm({title:'Confira este equipamento',html,ok:'Adicionar mesmo assim',danger:false});
}
desk.addEventListener('click',e=>{
 const i=e.target.closest('[data-i]');
 const idx=i?+i.dataset.i:NaN;
 const blankOcc=e.target.closest('[data-blank-occ]');if(blankOcc){const k=+blankOcc.dataset.i,p=cur[k];if(p&&p.blank&&window.openBlankOccupationPicker)window.openBlankOccupationPicker(p.occ,next=>{const live=cur[k];if(!live||!live.blank||live.occ===next)return;resetBlankDistribution(live,next);live.edit=true;draw();persist()});return}
 const amBtn=e.target.closest('[data-am]');if(amBtn){const k=+amBtn.dataset.i,p=cur[k];if(p&&isAmnesia(p))amnesiaAction(p,amBtn.dataset.am,amBtn);return}
 const removePortrait=e.target.closest('[data-portrait-remove]');if(removePortrait){const k=+removePortrait.dataset.i,p=cur[k];if(p){delete p.portrait;p.edit=true;draw()}return}
 const tab=e.target.closest('[data-sheet-tab]');if(tab){const k=+tab.closest('.win').dataset.i,chosen=tab.dataset.sheetTab;cur[k].ui.tab=['equipment','backstory','combat'].includes(chosen)?chosen:'sheet';draw();return}
 const eqAction=e.target.closest('[data-eq-action]');if(eqAction){
  const win=eqAction.closest('.win'),k=win?+win.dataset.i:NaN,p=cur[k],panel=eqAction.closest('[data-eq-panel]'),action=eqAction.dataset.eqAction;
  if(!p||!panel)return;
  if(action==='add-catalog'){
   const item=window.CthEquipment.catalog.find(x=>x.id===panel.querySelector('[data-eq-choice]').value);if(!item)return;
   (async()=>{if(!await approveEquipment(p,item)||cur[k]!==p)return;window.CthEquipment.addCatalog(p,item.id);p.edit=true;draw()})();return
  }
  if(action==='open-custom'){const form=panel.querySelector('.eq-custom');form.hidden=false;const cat=form.elements.category.value;form.querySelector('[data-eq-custom-fields]').innerHTML=window.CthEquipment.customFields(cat,`eqSkills-${k}`);form.elements.name.focus();return}
  if(action==='cancel-custom'){panel.querySelector('.eq-custom').hidden=true;return}
  if(action==='save-custom'){
   const form=panel.querySelector('.eq-custom');if(!form.reportValidity())return;const data=window.CthEquipment.customData(form),draft=window.CthEquipment.buildCustom(data);
   (async()=>{if(!await approveEquipment(p,draft)||cur[k]!==p)return;window.CthEquipment.ensure(p).push(draft);p.edit=true;draw()})();return
  }
  const item=window.CthEquipment.find(p,eqAction.dataset.eqId);if(!item)return;
  if(action==='remove'){const a=window.CthEquipment.ensure(p),n=a.indexOf(item);if(n>=0)a.splice(n,1);p.edit=true;draw();return}
  if(action==='shot'){item.loaded=Math.max(0,(+item.loaded||0)-1);p.edit=true;draw();return}
  if(action==='use'){item.uses=Math.max(0,(+item.uses||0)-1);p.edit=true;draw();return}
  if(action==='reserve'){item.reserve=(+item.reserve||0)+10;p.edit=true;draw();return}
  if(action==='transfer-ammo'){
   const sourceSelect=[...panel.querySelectorAll('[data-eq-ammo-source]')].find(x=>x.dataset.eqAmmoSource===item.uid),source=sourceSelect&&window.CthEquipment.find(p,sourceSelect.value);
   if(!source||source.kind!=='ammo'||!source.quantity)return;
   const moved=Math.min(10,+source.quantity||0);source.quantity-=moved;item.reserve=(+item.reserve||0)+moved;p.edit=true;draw();return
  }
  if(action==='reload'){const n=Math.max(0,(+item.capacity||0)-(+item.loaded||0)),m=Math.min(n,+item.reserve||0);item.loaded=(+item.loaded||0)+m;item.reserve=(+item.reserve||0)-m;p.edit=true;draw();return}
 }
 if(e.target.closest('.addb')){const b=e.target.closest('.addb');(b.dataset.m?addMain:addSkill)(+b.dataset.i,b.parentElement);return}
 if(e.target.closest('.pdfb')){const b=e.target.closest('.pdfb');savePdf([cur[+b.dataset.i]],b);return}
 if(e.target.closest('.burb')){const k=+e.target.closest('.burb').dataset.i,p=cur[k];askConfirm({title:'Levar ao cemitério?',html:`<strong>${esc(ttl(p))}</strong> será enterrado no cemitério. Em seguida você informa a causa da morte.`,ok:'🪦 Levar ao cemitério',danger:false}).then(y=>{if(y&&cur[k]===p)buryFicha(k)});return}
 if(e.target.closest('.delb')){const k=+e.target.closest('.delb').dataset.i,p=cur[k];confirmDel(ttl(p)).then(y=>{if(y&&cur[k]===p){cur.splice(k,1);draw()}});return}
 if(e.target.closest('.rrb')){
  const k=+e.target.closest('.rrb').dataset.i,p=cur[k];if(!p)return;
  const untouched=!hasBlankPoints(p)&&(ATTR_KEYS.every(a=>!+p.c[a])||!p.edit||rollSig(p)===p.rolledC);
  if(untouched)rerollAttrs(k);
  else askConfirm({title:'Sortear atributos?',html:`Os atributos de <strong>${esc(ttl(p))}</strong> serão substituídos por novos valores sorteados. ${p.blank?(p.unlimited?'PV, Sanidade, PM, Mov., Bônus de Dano, Corpo, Esquivar e Língua Natural são recalculados':'PV, Sanidade, PM, Mov., Bônus de Dano, Corpo, Esquivar e Língua Natural são recalculados, e <strong>os pontos de perícia já distribuídos são zerados</strong> (os totais de pontos mudam com os atributos novos; a ocupação continua a mesma)'):'As perícias também são redistribuídas com os pontos novos (mesma ocupação e histórico). <strong>Valores digitados à mão e pontos já redistribuídos se perdem</strong>'}. A Sorte não muda.`,ok:'🎲 Sortear',danger:false}).then(y=>{if(y&&cur[k]===p)rerollAttrs(k)});
  return;
 }
 if(e.target.closest('.ftg')){const p=cur[+e.target.closest('.ftg').dataset.i];p.falta=!p.falta;draw();return}
 if(e.target.closest('.rmb')){const x=e.target.closest('.rmb'),i=+x.dataset.i,p=cur[i],n=x.dataset.n;if(!p)return;
  askConfirm({title:'Remover perícia?',html:`<strong>${esc(n)}</strong> será removida desta ficha.`,ok:'Remover perícia',danger:true}).then(ok=>{if(!ok||cur[i]!==p)return;
   if(p.sk[n]!==undefined){ensureSkillBudget(p);if(!isBudget(p)&&!p.unlimited)p.skillPoints.available+=Math.max(0,(+p.sk[n]||0)-skillFloor(p,n));if(isBudget(p)&&p.skillAllocations)delete p.skillAllocations[n];delete p.sk[n];delete p.skillFloors[n];if(n in BASE||n in EXTRA)(p.removed=p.removed||{})[n]=1}
   else if(p.custom&&n in p.custom)delete p.custom[n];else(p.removed=p.removed||{})[n]=1;
   p.edit=true;draw();
  });return}
 if(e.target.closest('.colb')){const p=cur[idx];p.ui.collapsed=!p.ui.collapsed;draw();return}
 if(e.target.closest('.pinb')){const p=cur[idx];p.pinned=!p.pinned;draw();return}
 if(e.target.closest('.dupb')){const p=JSON.parse(JSON.stringify(cur[idx]));p.pinned=false;delete p.shareId;p.ui={...p.ui,x:(p.ui.x||0)+28,y:(p.ui.y||0)+28,z:++zTop,collapsed:false};p.nome=p.nome.replace(/ \(cópia\)$/,'')+' (cópia)';if(!cur[idx].nome)p.nome='';cur.push(p);draw();return}
});
desk.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.dataset.add==='n'){const b=e.target.parentElement.querySelector('.addb');(b.dataset.m?addMain:addSkill)(+b.dataset.i,e.target.parentElement)}});
desk.addEventListener('change',async e=>{
 const attrIn=e.target.closest('[data-k^="c:"]');if(attrIn){
  const i=+attrIn.dataset.i,p=cur[i],key=attrIn.dataset.k.slice(2);
  if(p&&!p.unlimited&&ATTR_RANGE[key]){
   const raw=+attrIn.value||0,nv=normAttr(key,raw,!!p.blank&&!p.budget);
   if(nv!==raw){attrIn.value=String(nv);attrIn.dispatchEvent(new Event('input',{bubbles:true}));const[mn,mx]=ATTR_RANGE[key];p.skillNotice=`${ATTR_NAMES[key]}: ${raw} foi ajustado para ${nv}. Os atributos vão de ${mn} a ${mx}, em múltiplos de 5.`;refresh(i)}
  }
  return;
 }
 const portraitFile=e.target.closest('[data-portrait-file]');if(portraitFile){const i=+portraitFile.dataset.i,p=cur[i],file=portraitFile.files&&portraitFile.files[0];portraitFile.value='';if(!p||!file)return;shrinkPortrait(file).then(src=>{p.portrait={src,zoom:1,x:0,y:0};p.edit=true;draw()}).catch(()=>alert('Não foi possível abrir essa imagem.'));return}
 const skillInput=e.target.closest('[data-skill-input]');if(skillInput){
  const i=+skillInput.dataset.i,p=cur[i],n=skillInput.dataset.k.slice(2);if(!p)return;
  ensureSkillBudget(p);
  if(p.unlimited){const inSk=Object.prototype.hasOwnProperty.call(p.sk,n),free=Math.max(0,Math.min(999,Math.floor(Number(skillInput.value)||0)));p.sk[n]=free;p.skillNotice='';p.edit=true;skillInput.value=String(free);if(inSk)refresh(i);else draw();persist();return}
  const wasMain=Object.prototype.hasOwnProperty.call(p.sk,n),old=Math.max(0,+get(p,'s:'+n)||0),minimum=skillFloor(p,n);
  let next=Math.max(0,Math.min(999,Math.floor(Number(skillInput.value)||0))),notice='';
  const creditRange=isBudget(p)&&n==='Nível de Crédito'?creditBounds(p):null;
  if(next<minimum){notice=`Não é possível reduzir ${n} para menos de ${minimum}%. O mínimo é ${minimum}%; a perícia foi ajustada para esse limite.`;next=minimum}
  else if(creditRange&&next>creditRange.max){notice=`O máximo de Nível de Crédito para esta ocupação é ${creditRange.max}%. O valor foi ajustado para esse limite.`;next=creditRange.max}
  else if(next===minimum)notice=`${n} chegou ao mínimo de ${minimum}%. Não é possível retirar mais pontos desta perícia.`;
  let confirmedChoiceType=null;
  if(isBudget(p)&&next>old&&(p.skillBudgetMode||'occupational')==='occupational'){
   const type=occupationChoiceType(p,n),available=blankBudgetState(p).occupational.available,cap=n==='Nível de Crédito'?(creditRange?.max??99):Math.max(old,skillCapFor(p,n));
   if(type&&Math.min(next,old+available,cap)>old){
    const kind=type==='social'?'vaga de perícia social':'vaga de perícia aleatória';
    const ok=await askConfirm({title:'Confirmar perícia escolhida',html:`<strong>${esc(n)}</strong> será escolhida para ocupar uma ${kind}. Ao confirmar, ela passa a brilhar em dourado.`,ok:'Confirmar escolha',danger:false});
    if(cur[i]!==p)return;
    if(!ok){skillInput.value=String(old);return}
    confirmedChoiceType=type;
   }
  }
  if(isBudget(p)&&next>old){
   const mode=p.skillBudgetMode||'occupational',budgets=blankBudgetState(p);
   if(mode==='personal'&&n==='Nível de Crédito'){next=old;notice='Nível de Crédito usa pontos ocupacionais, não pontos pessoais.';guideBudgetMode(i,'occupational')}
   else if(mode==='occupational'&&n!=='Nível de Crédito'&&!isOccupationalSkill(p,n)){next=old;notice=`${n} não faz parte das perícias desta ocupação. Use pontos pessoais para esta perícia.`;guideBudgetMode(i,'personal')}
   else{
    if(isAmnesia(p)&&mode==='occupational'&&n!=='Nível de Crédito'&&next>60){next=Math.max(old,60);notice='Instinto: com pontos ocupacionais, a Amnésia só chega a 60% numa perícia. Pontos pessoais podem passar disso.'}
    const cap=Math.max(old,skillCapFor(p,n));if(next>cap&&n!=='Nível de Crédito'){next=cap;notice=`Na criação, nenhuma perícia passa de ${SKILL_CAP}% com pontos gastos (só o Nível de Crédito tem faixa própria). ${n} ficou em ${cap}%.`}
    const available=budgets[mode].available,requested=next-old;
    if(requested>available){next=old+available;notice=`Há ${available} ponto(s) ${mode==='personal'?'pessoal(is)':'ocupacional(is)'} disponível(is) para ${n}; o valor foi limitado a ${next}%.`}
    const allocation=p.skillAllocations=p.skillAllocations||{},entry=allocation[n]=allocation[n]||{occupational:0,personal:0},spent=next-old;entry[mode]+=spent;if(mode==='occupational'&&spent>0&&confirmedChoiceType)entry.choiceType=confirmedChoiceType;
   }
  }else if(isBudget(p)&&next<old){
   const allocation=p.skillAllocations=p.skillAllocations||{},entry=allocation[n]||{occupational:0,personal:0};let refund=old-next;
   const first=p.skillBudgetMode||'occupational',second=first==='occupational'?'personal':'occupational';
   if((+entry.occupational||0)>0&&(+entry.personal||0)>0){let preview=refund;const returned={occupational:0,personal:0};for(const type of [first,second]){const amount=Math.min(preview,+entry[type]||0);returned[type]=amount;preview-=amount;if(!preview)break}if(preview>0)returned[first]+=preview;const removed=[];if(returned.occupational)removed.push(`<strong>${returned.occupational} ocupacionais</strong>`);if(returned.personal)removed.push(`<strong>${returned.personal} pessoais</strong>`);const ok=await askConfirm({title:'Confirmar redução da perícia',html:`Ao reduzir <strong>${esc(n)}</strong> em ${refund} ponto(s), serão devolvidos ${removed.join(' e ')}. O modo atual (<strong>${first==='occupational'?'Ocupacionais':'Pessoais'}</strong>) é devolvido primeiro.`,ok:'Confirmar redução',danger:false});if(cur[i]!==p)return;if(!ok){skillInput.value=String(old);return}}
   for(const type of [first,second]){const amount=Math.min(refund,+entry[type]||0);entry[type]=Math.max(0,(+entry[type]||0)-amount);refund-=amount;if(!refund)break}
   if(refund>0)entry[first]+=refund;
   if((+entry.occupational||0)===0)delete entry.choiceType;
   allocation[n]=entry;
   if(!entry.occupational&&!entry.personal)delete allocation[n];
  }else if(!isBudget(p)&&next>old){
   const cap=Math.max(old,SKILL_CAP);if(next>cap){next=cap;notice=`Na criação, nenhuma perícia passa de ${SKILL_CAP}% com pontos gastos.`}
   const available=p.skillPoints.available,requested=next-old;
   if(requested>available){next=old+available;notice=`Você tem ${available} ponto(s) disponível(is). ${n} pode chegar, no máximo, a ${next}%.`}
   p.skillPoints.available-=next-old;
  }else if(!isBudget(p)&&next<old)p.skillPoints.available+=old-next;
  p.sk[n]=next;p.skillNotice=notice;p.edit=true;skillInput.value=String(next);if(wasMain)refresh(i);else draw();persist();return;
 }
 const budgetMode=e.target.closest('[data-budget-mode]');if(budgetMode){const i=+budgetMode.dataset.i,p=cur[i];if(!p)return;const hint=budgetModeGuidance.get(p);if(hint)clearTimeout(hint.timer);budgetModeGuidance.delete(p);p.skillBudgetMode=budgetMode.value;p.skillNotice='';refresh(i);persist();return}
 const occupationMain=e.target.closest('[data-occ-main]'),occupationSpec=e.target.closest('[data-occ-spec]');if(occupationMain||occupationSpec){
  const control=occupationMain||occupationSpec,i=+control.dataset.i,p=cur[i];if(!p)return;
  let next;
  if(occupationMain)next=control.value;
  else{const info=occupationFor(p.occ),baseName=control.dataset.base||info?.occupation.n||'';next=baseName&&control.value?`${baseName} (${control.value})`:baseName}
  if(!p.blank&&!p.creditRange){const range=creditBounds(p);if(range)p.creditRange={base:[range.min,range.max],final:[range.min,range.max],mod:0}}
  if(p.blank){if(p.occ!==next)resetBlankDistribution(p,next)}else{ensureSkillBudget(p);p.occ=next;p.skillNotice=''}
  p.edit=true;draw();return;
 }
 const panel=e.target.closest('[data-eq-panel]');if(!panel)return;
 const yearSelect=e.target.closest('[data-eq-year]'),yearCustom=e.target.closest('[data-eq-year-custom]');
 if(yearSelect||yearCustom){
  const win=panel.closest('.win'),i=win?+win.dataset.i:+panel.dataset.i,p=cur[i];if(!p)return;
  if(yearSelect&&yearSelect.value==='custom'){const input=panel.querySelector('[data-eq-year-custom]');input.hidden=false;input.focus();return}
  const year=Number(yearCustom?yearCustom.value:yearSelect.value);if(!Number.isInteger(year)||year<1||year>9999)return;
  p.equipmentYear=year;p.edit=true;draw();persist();return;
 }
 if(e.target.matches('[data-eq-category]'))window.CthEquipment.updateCatalog(panel,e.target.value);
 if(e.target.matches('[data-eq-custom-category]')){const k=+panel.dataset.i;panel.querySelector('[data-eq-custom-fields]').innerHTML=window.CthEquipment.customFields(e.target.value,`eqSkills-${k}`)}
});
function onDragMove(e){
 const dr=desk.getBoundingClientRect();
 if(rsz){const p=cur[rsz.i];p.ui.w=Math.max(Math.min(340,fichaDeskW()),Math.min(1140,fichaDeskW()-p.ui.x,rsz.ow+(e.clientX-rsz.ox)));const el=winEl(rsz.i);if(el)el.style.width=p.ui.w+'px';return}
 if(!drag)return;
 const p=cur[drag.i];
 const el=winEl(drag.i),ww=el?el.offsetWidth:p.ui.w;
 p.ui.x=Math.max(0,Math.min(fichaDeskW()-ww,e.clientX-dr.left-drag.ox));
 p.ui.y=Math.max(0,Math.min(FICHA_MAXY,e.clientY-dr.top-drag.oy));
 if(el){el.style.left=p.ui.x+'px';el.style.top=p.ui.y+'px'}
 if(window.Cemiterio)Cemiterio.hover(e.clientX,e.clientY,true);
}
function onDragEnd(e){
 const C=window.Cemiterio,toBury=drag&&e&&C&&C.over(e.clientX,e.clientY)?drag.i:-1;
 if(C)C.hover(0,0,false);
 if(drag||rsz){drag=rsz=null;fitDesk();persist()}
 document.removeEventListener('pointermove',onDragMove);
 document.removeEventListener('pointerup',onDragEnd);
 if(toBury>=0)buryFicha(toBury);
}
desk.addEventListener('pointerdown',e=>{
 if(document.body.classList.contains('mobile'))return;
 const win=e.target.closest('.win');if(!win)return;
 const i=+win.dataset.i;bring(i);
 if(e.target.closest('.rsz')){rsz={i,ox:e.clientX,ow:cur[i].ui.w};document.addEventListener('pointermove',onDragMove);document.addEventListener('pointerup',onDragEnd);e.preventDefault();return}
 if(!e.target.closest('.win-bar')||e.target.closest('button'))return;
 const wr=win.getBoundingClientRect();
 drag={i,ox:e.clientX-wr.left,oy:e.clientY-wr.top};
 document.addEventListener('pointermove',onDragMove);
 document.addEventListener('pointerup',onDragEnd);
});
desk.addEventListener('input',e=>{
 const sealed=e.target.closest('[data-am-sealed]');if(sealed){const p=cur[+sealed.dataset.i];if(p){amn(p).sealed=sealed.value;p.edit=true;persist()}return}
 const zoom=e.target.closest('[data-portrait-zoom]');if(zoom){const i=+zoom.dataset.i,p=cur[i];if(!p)return;p.portrait=p.portrait||{src:'',x:0,y:0};p.portrait.zoom=+zoom.value;const win=zoom.closest('.win'),canvas=win&&win.querySelector('[data-portrait-canvas]');if(canvas)paintPortrait(canvas,p);p.edit=true;persist();return}
 const eq=e.target.closest('[data-eq-field]');if(eq){
  const win=eq.closest('.win'),k=win?+win.dataset.i:NaN,p=cur[k],item=p&&window.CthEquipment.find(p,eq.dataset.eqId);if(!item)return;
  let value=Math.max(0,Math.floor(+eq.value||0));if(eq.dataset.eqField==='loaded')value=Math.min(+item.capacity||0,value);item[eq.dataset.eqField]=value;p.edit=true;
  window.CthEquipment.refreshWarnings(p,win.querySelector('[data-eq-panel]'));persist();return;
 }
 const t=e.target,k=t.dataset.k;if(!k)return;
 const i=+t.dataset.i,p=cur[i],[a,x]=k.split(/:(.+)/);
  if(a==='s')return;
 if(a==='n'){p[x]=t.value;if(x==='back'){persist();return}}
 else{
  const v=x==='db'?t.value:x==='corpo'?Math.max(-20,Math.min(99,Math.trunc(+t.value||0))):Math.max(0,Math.min(999,+t.value||0));
  if(a==='c'){
   const derived=['Esquivar','Língua Natural'].map(n=>({n,oldBase:base(n,p.c),oldFloor:skillFloor(p,n),value:p.sk[n]})),oldCredit=isBudget(p)?creditBounds(p):null,oldCreditValue=+p.sk['Nível de Crédito']||0,oldCreditFloor=skillFloor(p,'Nível de Crédito');p.c[x]=v;
   p.der={...p.der,...calc(p.c)};
   for(const d of derived)if(d.value!==undefined){const newBase=Math.max(0,+base(d.n,p.c)||0);if(p.unlimited){if((+d.value||0)===d.oldBase)p.sk[d.n]=newBase;p.skillFloors[d.n]=0}else{const bonus=Math.max(0,(+d.value||0)-d.oldFloor);p.sk[d.n]=newBase+bonus;p.skillFloors[d.n]=newBase}}
   if(isBudget(p)&&p.sk['Nível de Crédito']!==undefined){
    const range=creditBounds(p),floor=range?range.min:Math.max(0,+base('Nível de Crédito',p.c)||0),ceiling=range?range.max:999;
    const value=Math.max(floor,Math.min(ceiling,oldCreditValue));p.skillFloors['Nível de Crédito']=floor;p.sk['Nível de Crédito']=value;
    const allocations=p.skillAllocations&&p.skillAllocations['Nível de Crédito'];if(allocations){allocations.occupational=Math.max(0,value-floor);allocations.personal=0;if(!allocations.occupational)delete p.skillAllocations['Nível de Crédito']}
    p.skillNotice=value!==oldCreditValue||oldCreditFloor!==(range?range.min:floor)?`A faixa de Nível de Crédito mudou com os atributos${oldCredit?`; agora é ${floor}–${ceiling}`:''}.`:'';
   }
  }else if(a==='d'){if(x==='sanMax')return;p.der[x]=x==='san'?Math.min(v,sanMaxOf(p)):v}else p.sk[x]=v;
 }
 p.edit=true;refresh(i);window.CthEquipment.refreshWarnings(p,winEl(i)&&winEl(i).querySelector('[data-eq-panel]'));
});
desk.addEventListener('pointerdown',e=>{
 const canvas=e.target.closest('[data-portrait-canvas]');if(!canvas)return;const i=+canvas.dataset.i,p=cur[i];if(!p||!p.portrait)return;
 canvas.setPointerCapture(e.pointerId);canvas._portraitDrag={x:e.clientX,y:e.clientY,ox:+p.portrait.x||0,oy:+p.portrait.y||0};e.stopPropagation();e.preventDefault();
});
desk.addEventListener('pointermove',e=>{
 const canvas=e.target.closest('[data-portrait-canvas]');if(!canvas||!canvas._portraitDrag)return;const p=cur[+canvas.dataset.i];if(!p||!p.portrait)return;
 const rect=canvas.getBoundingClientRect(),drag=canvas._portraitDrag;p.portrait.x=drag.ox+(e.clientX-drag.x)/rect.width;p.portrait.y=drag.oy+(e.clientY-drag.y)/rect.height;paintPortrait(canvas,p);p.edit=true;persist();
});
const endPortraitDrag=e=>{const canvas=e.target.closest&&e.target.closest('[data-portrait-canvas]');if(canvas&&canvas._portraitDrag){canvas._portraitDrag=null;persist()}};
desk.addEventListener('pointerup',endPortraitDrag);desk.addEventListener('pointercancel',endPortraitDrag);
function placeNew(p,i,anchors){
 const width=520;
 let x=28+(i%5)*40,y=16+(i%5)*32;
 if(anchors&&anchors.length){
  const maxX=Math.max(...anchors.map(a=>(a.ui&&a.ui.x||0)+(a.ui&&a.ui.w||520)));
  x=maxX+28+(i%3)*16;
  y=12+(i%5)*26;
  if(x+width>fichaDeskW()){x=28+(i%5)*40;y=16+(i%5)*32}
 }
 p.ui={x,y,w:width,z:++zTop,collapsed:false};
}
/* cemitério: arraste a ficha até o botão do cemitério no painel; ela só sai da mesa depois de confirmar */
function buryFicha(i){const p=cur[i];if(!p||!window.Cemiterio)return;Cemiterio.add({nome:p.nome,idade:p.idade,portrait:p.portrait},()=>{const k=cur.indexOf(p);if(k>=0){cur.splice(k,1);draw()}})}
async function go(){
 const q=Math.max(1,Math.min(8,+document.getElementById('qty').value||1));
 /* fichas geradas que você editou e não marcou com "Manter" seriam apagadas: pergunta antes */
 const edited=cur.filter(p=>!p.pinned&&p.edit);
 if(edited.length){
  const r=await askChoice({title:'Há fichas editadas sem “Manter”',html:`Gerar novas fichas remove as que não estão mantidas. Você editou estas:<ul class="choice-list">${edited.map(p=>`<li>${esc(ttl(p))}</li>`).join('')}</ul>`,choices:[{v:'pin',label:'📌 Manter e gerar',primary:true},{v:'replace',label:'Substituir mesmo assim',danger:true},{v:'cancel',label:'Cancelar'}]});
  if(!r||r==='cancel')return;
  if(r==='pin')edited.forEach(p=>{p.pinned=true});
 }
 const kept=cur.filter(p=>p.pinned);
 const neu=Array.from({length:q},()=>gen(sel.value,sel2.value));
 neu.forEach((p,i)=>placeNew(p,i,kept));
 cur=kept.concat(neu);draw();
}
document.getElementById('go').onclick=go;
document.getElementById('blank').onclick=async()=>{
 const type=await askSheetType();if(!type)return;
 const p=genBlank(type==='unlimited');placeNew(p,0,cur);cur.push(p);draw();
 const el=winEl(cur.length-1);if(el&&el.scrollIntoView)el.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});
};
window.DynamicInfo=(()=>{
 let box=null,host=null,timer=0,anchor=null,content='';
 function place(){if(!box||!anchor)return;const r=box.getBoundingClientRect(),a=anchor.getBoundingClientRect(),pad=10,gap=10;let left=a.left+(a.width-r.width)/2,top=a.top-r.height-gap;if(top<pad)top=a.bottom+gap;if(top+r.height>innerHeight-pad)top=Math.max(pad,Math.min(innerHeight-r.height-pad,a.top+(a.height-r.height)/2));left=Math.max(pad,Math.min(innerWidth-r.width-pad,left));box.style.left=left+'px';box.style.top=top+'px'}
 function show(text,owner,card,delay=500){if(!text||!card)return;const target=owner&&owner.matches&&owner.matches('dialog')?owner:document.body;if(host===target&&anchor===card&&(box||timer))return;hide();host=target;anchor=card;content=text;timer=setTimeout(()=>{timer=0;if(!anchor||!anchor.isConnected||(host.matches('dialog')&&!host.open))return;box=document.createElement('div');box.className='dynamic-info';box.setAttribute('role','tooltip');box.textContent=content;host.appendChild(box);place()},delay)}
 function hide(owner){if(owner&&host&&owner!==host)return;clearTimeout(timer);timer=0;if(box){box.remove();box=null}anchor=null;host=null;content=''}
 return{show,showNow:(text,card)=>show(text,null,card,0),hide};
})();
(function responsiveMode(){
 const media=matchMedia('(max-width: 760px)');
 const apply=()=>{
  const changed=document.body.classList.contains('mobile')!==media.matches;
  document.body.classList.toggle('mobile',media.matches);
  if(changed)window.dispatchEvent(new Event('resize'));
 };
 apply();
 if(media.addEventListener)media.addEventListener('change',apply);else media.addListener(apply);
})();
(function panelMin(){
 const KEY='coc7-painel-v1',bar=document.getElementById('panel'),btn=document.getElementById('panelBtn'),mn=document.getElementById('panelMin');
 let min=document.body.classList.contains('mobile');try{const saved=localStorage.getItem(KEY);if(saved!==null)min=saved==='1'}catch(_){}
 const apply=()=>{bar.hidden=min;btn.hidden=!min;document.body.classList.toggle('pmin',min)};
 const set=v=>{min=v;try{localStorage.setItem(KEY,v?'1':'0')}catch(_){}apply();(v?btn:mn).focus()};
 mn.onclick=()=>set(true);btn.onclick=()=>set(false);
 apply();
})();
/* Aplica um estado (carregado do banco ou da outra aba) na tela. */
function applyState(d){
 if(d&&Array.isArray(d.cur)){
  cur=d.cur;cur.forEach(migrateSkillNames);zTop=d.zTop||20;
  if(d.occ)sel.value=d.occ;if(d.occ2)sel2.value=d.occ2;
  if(d.qty)document.getElementById('qty').value=d.qty;
  cur.forEach(uiOf);
 }else cur=[];
 renderCache=[];desk.innerHTML='';draw();
 dirty=false;clearTimeout(saveT); /* só carregamos: não há o que gravar (evita ping-pong entre abas) */
}
(async function boot(){
 if(document.readyState==='loading')await new Promise(r=>document.addEventListener('DOMContentLoaded',r,{once:true})); /* espera todos os scripts da página */
 let loaded=null;
 try{loaded=await FichaStore.load()}
 catch(e){console.error(e);showSaveBanner('error',e);const b=saveBannerEl();b.querySelector('span').textContent='Não foi possível abrir o armazenamento do navegador. Recarregue a página; nada foi apagado. Se persistir, baixe um backup em outro navegador.';return}
 applyState(loaded&&loaded.state);
 storeReady=true;
 window.dispatchEvent(new Event('ficha:ready'));
})();

/* sugestões de perícia ao adicionar; ao digitar um nome conhecido o valor inicial vira o valor-base do livro */
(function skillSuggest(){
 const dl=document.getElementById('skillSuggest');
 if(dl)dl.innerHTML=[...new Set([...Object.keys(BASE),...Object.keys(EXTRA),...Object.keys(SPECIAL_BASE)])].filter(n=>n!=='Nível de Crédito').sort((a,b)=>a.localeCompare(b,'pt')).map(n=>`<option value="${esc(n)}">`).join('');
 desk.addEventListener('input',e=>{
  const n=e.target.closest('[data-add="n"]');if(!n)return;
  const box=n.parentElement,v=box.querySelector('[data-add=v]'),b=box.querySelector('.addb'),p=b&&cur[+b.dataset.i];
  if(!v||!p)return;const bv=base(n.value.trim(),p.c);if(bv!=null&&!Number.isNaN(bv))v.value=bv;
 });
})();
