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
  else if(a==='ok'){if(!ATTR_KEYS.every(k=>{const[min,max]=ATTR_RANGE[k],n=+v[k];return n>=min&&n<=max&&n%5===0}))return;if(left()!==0){window.alert('Ainda restam '+left()+' pontos para distribuir.');return}m.close({...v});return}
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
  const m=wzModal(`<h4>Passo 1 de 5 · Atributos</h4><p class="wz-help">Os atributos definem tudo o mais: pontos de perícia, PV, Sanidade e Mágica. Role os dados (3d6×5 e 2d6+6×5) ou, se o grupo preferir, distribua ${POINT_BUY_TOTAL} pontos.</p><div class="wz-attrs" data-wz-attrs></div><div class="row"><button type="button" class="alt" data-w="cancel">Cancelar</button><button type="button" class="alt" data-w="points">⚖ Compra de pontos</button><button type="button" class="alt" data-w="roll">🎲 ${attrs?'Sortear de novo':'Rolar dados'}</button><button type="button" data-w="next" ${attrs?'':'disabled'}>Próximo →</button></div>`,'wz-dlg');
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
 const m2=wzModal(`<h4>Passo 2 de 5 · Quem é o investigador?</h4><p class="wz-help">A ocupação define quais perícias recebem os pontos ocupacionais e a faixa de Nível de Crédito.</p><label class="wz-field">Nome<input class="in" data-w-name maxlength="60" placeholder="Nome do investigador"></label><label class="wz-field">Idade<input class="in" type="number" min="15" max="90" value="30" data-w-age></label><div class="wz-field"><span>Ocupação</span><button type="button" class="pickbtn" data-w="occ"><span class="pe">🧭</span><span class="pt" data-w-occ>Escolher ocupação</span><span class="pc">▾</span></button><small data-w-credit></small></div><div class="row"><button type="button" class="alt" data-w="cancel">Cancelar</button><button type="button" data-w="next" disabled>Próximo →</button></div>`,'wz-dlg');
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
 p.skillBudgetMode='occupational';p.guide={step:3};p.edit=true;p.rolledC=rollSig(p);
 placeNew(p,0,cur);cur.push(p);draw();
 const el=winEl(cur.length-1);if(el&&el.scrollIntoView)el.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});
}

/* ---------- criação guiada: passos 3 a 5 (barra na ficha) ---------- */
const GUIDE_TXT={
 3:{t:'Pontos ocupacionais',d:p=>{const c=creditBounds(p);return`Gaste nas perícias em dourado (as da sua ocupação) e defina o Nível de Crédito${c?` (${c.min} a ${c.max})`:''}. Nenhuma perícia passa de ${SKILL_CAP}%.`},left:p=>blankBudgetState(p).occupational.available},
 4:{t:'Pontos pessoais',d:p=>`INT × 2 = ${blankBudgetState(p).personal.total} pontos para qualquer perícia, seguindo os interesses do personagem. Nenhuma perícia passa de ${SKILL_CAP}%.`,left:p=>blankBudgetState(p).personal.available},
 5:{t:'Backstory',d:()=>'Escreva a história: aparência, ideologia, pessoas e lugares importantes, pertences queridos e traços. A aba Backstory já está aberta.',left:null}
};
function guideBarHtml(p,i){
 if(!p.guide)return'';
 const s=Math.max(3,Math.min(5,+p.guide.step||3)),g=GUIDE_TXT[s],left=g.left?g.left(p):null;
 const dots=[1,2,3,4,5].map(n=>`<i class="${n<s?'done':n===s?'now':''}"></i>`).join('');
 return`<div class="guide-bar" data-guide-bar data-i="${i}" role="region" aria-label="Criação guiada"><div class="gd-head"><span class="gd-dots" aria-hidden="true">${dots}</span><strong>Passo ${s} de 5 · ${g.t}</strong>${left!=null?`<span class="gd-left"><b data-guide-left>${left}</b> pts restantes</span>`:''}</div><p>${esc(g.d(p))}</p><div class="gd-actions"><button type="button" class="alt" data-guide="skip" data-i="${i}" title="Fechar o passo a passo e continuar editando livremente">Sair do guia</button>${s>3?`<button type="button" class="alt" data-guide="back" data-i="${i}">← Voltar</button>`:''}<button type="button" data-guide="${s===5?'finish':'next'}" data-i="${i}">${s===5?'✔ Concluir':'Próximo →'}</button></div></div>`;
}
function guideRefresh(p,el){
 const bar=el.querySelector('[data-guide-bar]');if(!bar||!p.guide)return;
 const s=Math.max(3,Math.min(5,+p.guide.step||3)),g=GUIDE_TXT[s];
 const l=bar.querySelector('[data-guide-left]');if(l&&g.left)l.textContent=g.left(p);
}
desk.addEventListener('click',async e=>{
 const b=e.target.closest('[data-guide]');if(!b)return;
 const k=+b.dataset.i,p=cur[k];if(!p||!p.guide)return;
 const act=b.dataset.guide,s=Math.max(3,Math.min(5,+p.guide.step||3));
 const go=step=>{p.guide.step=step;p.skillBudgetMode=step===4?'personal':'occupational';p.skillNotice='';p.ui=p.ui||{};p.ui.tab=step===5?'backstory':'sheet';p.edit=true;draw()};
 if(act==='skip'){delete p.guide;p.ui.tab='sheet';p.edit=true;draw();return}
 if(act==='finish'){delete p.guide;p.ui.tab='sheet';p.skillNotice='';p.edit=true;draw();return}
 if(act==='back'){go(s-1);return}
 if(act==='next'){
  const left=GUIDE_TXT[s].left(p);
  if(left>0){
   const ok=await askConfirm({title:'Ainda restam pontos',html:`Sobram <strong>${left}</strong> pontos ${s===3?'ocupacionais':'pessoais'}. Você pode voltar e gastá-los, ou continuar e usá-los depois.`,ok:'Continuar mesmo assim',danger:false});
   if(!ok||cur[k]!==p)return;
  }
  go(s+1);
 }
});
const guidedBtn=document.getElementById('guided');if(guidedBtn)guidedBtn.onclick=startGuidedCreation;
