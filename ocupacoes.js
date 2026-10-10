/* Seletor visual de ocupações: troca os dois <select> por um painel com busca, categorias e cartões.
   Os <select> originais continuam na página (escondidos) e são eles que o gerador lê. */
(()=>{
const CAT={Acad:'Acadêmico',Lei:'Lei & Crime',Acao:'Ação',Of:'Ofícios',Sau:'Saúde',Art:'Artes & Mídia',Nat:'Natureza',Soc:'Sociedade',Ocu:'Oculto'};
const I={ /* nome: [emoji, categoria] */
'Advogado':['⚖️','Lei'],'Alienista (Psiquiatra)':['🧠','Sau'],'Andarilho':['🥾','Nat'],'Antiquário':['🏺','Acad'],'Arqueólogo':['⛏️','Acad'],'Artista':['🎨','Art'],'Atleta':['🏅','Acao'],'Autor':['✍️','Art'],'Barman':['🍸','Soc'],'Bibliotecário':['📚','Acad'],'Bombeiro':['🚒','Acao'],'Caçador':['🏹','Nat'],'Cientista':['🔬','Acad'],'Clero, Membro do':['⛪','Soc'],'Contador':['🧮','Soc'],'Contrabandista':['📦','Lei'],'Criminoso':['🗝️','Lei'],'Detetive Particular':['🕵️','Lei'],'Diletante':['🎩','Soc'],'Enfermeiro':['💉','Sau'],'Engenheiro':['📐','Of'],'Espião':['🕶️','Lei'],'Estudante':['🎓','Acad'],'Explorador':['🧭','Nat'],'Fanático':['🔥','Ocu'],'Fazendeiro':['🌾','Nat'],'Fotógrafo':['📷','Art'],'Guarda-caça':['🌲','Nat'],'Guarda-costas':['🛡️','Acao'],'Investigador de Polícia':['🔎','Lei'],'Jornalista':['📰','Art'],'Marinheiro':['⚓','Of'],'Mecânico':['🔧','Of'],'Médico':['🩺','Sau'],'Membro de Tribo':['🪶','Nat'],'Missionário':['✝️','Soc'],'Mordomo':['🍷','Soc'],'Motorista':['🚗','Of'],'Músico':['🎻','Art'],'Ocultista':['🔮','Ocu'],'Oficial de Polícia':['👮','Lei'],'Oficial Militar':['🎖️','Acao'],'Operário':['🏭','Of'],'Parapsicólogo':['👻','Ocu'],'Piloto':['✈️','Of'],'Político':['🏛️','Soc'],'Professor':['🧑‍🏫','Acad'],'Profissional de Entretenimento':['🎭','Art'],'Soldado':['🪖','Acao'],
'Mecânico de Carros':['🔧','Of'],'Lutador':['🥊','Acao'],'Médico de Guerra':['⛑️','Sau'],'Detetive Amador':['🔍','Lei'],'Jornalista Freelancer':['📰','Art'],'Ladrão de Casas':['🗝️','Lei'],'Jogador de Cartas':['🃏','Soc'],'Estudante de Ocultismo':['🕯️','Ocu'],'Cavaleiro':['🐎','Nat'],'Pintor Amador':['🖌️','Art'],'Eletricista':['⚡','Of']};
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const meta=n=>I[n]||['💼','Of'];
const clean=t=>{t=t.replace(/^!/,'');if(t==='@soc')return'Perícia social';if(t==='@lang')return'Língua';if(t==='@any')return'';t=t.split('|')[0].trim();return t.replace(/\s*\(.*\)$/,'')};
const skills=o=>{const all=o.s.map(t=>({k:t[0]==='!',n:clean(t)})).filter(x=>x.n);const keys=all.filter(x=>x.k).map(x=>x.n);return{keys:[...new Set(keys.length?keys:all.slice(0,3).map(x=>x.n))],all:[...new Set(all.map(x=>x.n))]}};
const items=(kind)=>kind==='occ'?OCC.map(o=>({v:o.n,n:o.n,o,cred:o.c,sub:SUB[o.n]})):
 OCC.map(o=>({v:'occ:'+o.n,n:o.n,o,cred:o.c,dup:1}));

const dlg=document.createElement('dialog');dlg.className='opk';dlg.setAttribute('aria-label','Escolher ocupação');
dlg.innerHTML=`<header><h4 id="opkT"></h4><span class="opk-hb"><button type="button" id="opkHelpBtn" aria-pressed="false">❔ Ajuda</button><button type="button" class="opk-x" aria-label="Fechar">✕</button></span></header>
<div class="opk-tools"><input id="opkQ" type="search" placeholder="Buscar ocupação ou perícia…" aria-label="Buscar"><div id="opkTabs" class="opk-tabs"></div></div>
<div id="opkChips" class="opk-chips"></div><div id="opkGrid" class="opk-grid" role="listbox"></div>
<div id="opkHelp" class="opk-help" tabindex="-1"></div>
<footer id="opkDet" class="opk-det">Passe o mouse (ou foque) sobre uma ocupação para ver as perícias.</footer>`;
document.body.appendChild(dlg);
const helpBox=$('#opkHelp'),helpBtn=$('#opkHelpBtn'),q=$('#opkQ'),grid=$('#opkGrid'),chips=$('#opkChips'),tabs=$('#opkTabs'),det=$('#opkDet');
let ctx=null,cat='',tab='sec',subItem=null,bgItem=null,bgView='list',bgSk=[];
const BGKEY='cthulhu-bg';
window.BGSEL={};try{window.BGSEL=JSON.parse(localStorage.getItem(BGKEY)||'{}')||{}}catch{}
const saveBG=()=>{try{localStorage.setItem(BGKEY,JSON.stringify(window.BGSEL))}catch{}};
const occName=v=>{if(v==='*'||v==='')return null;return(v.startsWith('occ:')?v.slice(4):v).split('::')[0]};

function btnText(sel){
 const v=sel.value;if(v==='*')return['🎲','Aleatória'];if(v==='')return['➖','Nenhuma'];
 const occ=v.startsWith('occ:'),[n,sp]=(occ?v.slice(4):v).split('::'),slot=sel.id==='occ'?'p':'s',pk=window.BGSEL[slot];
 let tag='';if(pk&&pk.occ===n&&pk.pick){const B=BG[n];if(pk.pick.custom)tag=(pk.pick.name||'').trim();else if(pk.pick.id){const o=B&&B.o.find(x=>x.id===pk.pick.id);if(o)tag=o.n.replace(/\s*\(.*\)$/,'')}}
 return[meta(n)[0],n+(sp?' ('+sp+')':'')+(tag?' · '+tag:'')+(occ?' — como secundária':'')];
}
const pickers=[];
function mount(selId,kind,title){
  const sel=document.getElementById(selId);if(!sel)return;const label=sel.closest('label');
  if(selId==='occ2'&&sel.value&&sel.value!=='*'){
   const previous=occName(sel.value);sel.value=OCC.some(o=>o.n===previous)?'occ:'+previous:'';
  }
  sel.classList.add('sr');sel.tabIndex=-1;
  const b=document.createElement('button');b.type='button';b.className='pickbtn';b.setAttribute('aria-haspopup','dialog');label.appendChild(b);
  const sync=()=>{const[e,t]=btnText(sel);b.innerHTML=`<span class="pe">${e}</span><span class="pt">${esc(t)}</span><span class="pc">▾</span>`};
  const update=()=>{
   if(selId==='occ'){
    const primary=occName(sel.value),secondary=occName(sel2.value);
    if(secondary&&window.secondaryBlocked(primary,secondary)){sel2.value='';sel2.dispatchEvent(new Event('change',{bubbles:true}))}
   }
   sync();
  };
  update();sel.addEventListener('change',update);pickers.push(sync);
 label.addEventListener('click',e=>{e.preventDefault();openPick({sel,kind,title,sync})});
}
function openPick(c){
  subItem=null;bgItem=null;ctx=c;cat='';q.value='';tab=c.kind==='sec'?'occ':'sec';$('#opkT').textContent=c.title;
  tabs.innerHTML='';
  tabs.hidden=true;
 chips.innerHTML='<button type="button" data-c="" aria-pressed="true">Todas</button>'+Object.entries(CAT).map(([k,v])=>`<button type="button" data-c="${k}" aria-pressed="false">${v}</button>`).join('');
 render();dlg.showModal();q.focus();
}
function list(){
 const c=ctx,t=norm(q.value.trim());let src=items(c.kind==='occ'?'occ':'sec');
  if(c.kind==='sec'){const primary=occName(document.getElementById('occ').value);src=src.filter(i=>!window.secondaryBlocked(primary,i.n))}
 return src.filter(i=>(!cat||meta(i.n)[1]===cat)&&(!t||norm(i.n).includes(t)||skills(i.o).all.some(s=>norm(s).includes(t)))).sort((a,b)=>a.n.localeCompare(b.n,'pt'));
}
function card(v,e,name,sub,tags,full,on,idx,nsub,bg){
 return`<button type="button" class="opk-card${on?' on':''}${nsub?' has-sub':''}" role="option" aria-selected="${on}" data-v="${esc(v)}" data-d="${esc(full)}"${nsub?' data-sub="1"':''} style="--d:${Math.min(idx,24)*18}ms"><span class="oe">${e}</span><span class="oname">${esc(name)}</span>${sub?`<span class="os">${esc(sub)}</span>`:''}<span class="ot">${tags.map(x=>`<i>${esc(x)}</i>`).join('')}</span>${nsub?`<span class="osub">▸ ${nsub} opções</span>`:''}${bg?'<span class="osub">✦ origem</span>':''}</button>`;
}
const tokTag=t=>{t=t.replace(/^!/,'');if(t==='@soc')return'Social';if(t==='@lang')return'Língua';if(t==='@any')return'';return t.split('|')[0].trim().replace(/^(Ciência|Arte\/Ofício) \((.*)\)$/,'$2')};
const shortSk=n=>n.replace(/^(Ciência|Arte\/Ofício) \((.*)\)$/,'$2');
function renderBG(){
 const B=BG[bgItem.occ],e=meta(bgItem.occ)[0];let h,i=0;
 if(bgView==='form'){
  h=`<div class="opk-subhead"><button type="button" data-bgback>← Voltar</button><strong>✍️ ${esc(B.kind)}: outro</strong><span>Escreva o nome e marque até 2 perícias (+10 em cada)</span></div>
<div class="opk-form"><label>Nome<input id="bgName" maxlength="60" placeholder="${esc(B.kind)} — escreva aqui" autocomplete="off"></label>
<div class="opk-pool" role="group" aria-label="Perícias (até 2)">${B.pool.map(n=>`<button type="button" data-sk="${esc(n)}" aria-pressed="${bgSk.includes(n)}">${esc(shortSk(n))}</button>`).join('')}</div>
<div class="opk-formact"><small id="bgCount">${bgSk.length}/2 perícias</small><button type="button" data-bgok>Confirmar</button></div></div>`;
 }else{
  h=`<div class="opk-subhead"><button type="button" data-bgback>← Voltar</button><strong>${e} ${esc(bgItem.occ)}</strong><span>${esc(B.q)}</span></div>`;
  h+=card('bg:random','🎲','Sortear','',['Escolhe uma opção ao gerar','Crédito varia pela opção'],'Sorteia '+B.kind.toLowerCase()+' ao gerar a ficha; o ajuste de crédito depende da opção sorteada',false,i++);
  h+=B.o.map(o=>{const tags=o.sk.map(s=>'+10 '+shortSk(s));if(o.crMod)tags.push(crFmt(o.crMod)+' Crédito');return card('bg:'+o.id,e,o.n,o.t,tags,o.n+' — '+o.t+' Bônus: +10 '+o.sk.join(', +10 ')+(o.crMod?' · faixa de Crédito '+crFmt(o.crMod):''),false,i++)}).join('');
  h+=card('bg:custom','✍️','Outro (escrever)','',['Você nomeia','até 2 perícias'],'Escreva o nome e escolha até 2 perícias da lista',false,i++);
  h+=card('bg:none','➖','Sem origem específica','',['Sem bônus'],'Não define origem nem bônus',false,i++);
 }
 grid.innerHTML=h;grid.scrollTop=0;det.textContent='Escolha a origem do personagem: ela dá +10 em 2 perícias e já escreve o começo do backstory (você pode editar depois).';
}
function render(){
 if(bgItem){dlg.classList.add('sub');return renderBG()}
 const c=ctx,cur=c.sel.value;let i=0,h='';dlg.classList.toggle('sub',!!subItem);
 if(subItem){
  const x=subItem,S=SUB[x.n],lbl=S.lbl.toLowerCase();
  h+=`<div class="opk-subhead"><button type="button" data-back>← Todas as ocupações</button><strong>${meta(x.n)[0]} ${esc(x.n)}</strong><span>Escolha: ${esc(lbl)}</span></div>`;
  h+=card(x.v,'🎲','Qualquer opção','',['Sorteia ao gerar'],'Sorteia '+lbl+' ao gerar a ficha',cur===x.v,i++);
  h+=Object.entries(S.o).map(([k,t])=>{const keys=t.filter(z=>z[0]==='!').map(tokTag).filter(Boolean),all=[...new Set(t.map(tokTag).filter(Boolean))],v=x.v+'::'+k,mod=S.crMod&&S.crMod[k]||0,tags=keys.slice(0,3);if(mod)tags.push(crFmt(mod)+' Crédito');
   return card(v,meta(x.n)[0],k,x.n,tags,x.n+' ('+k+') — perícias em destaque: '+all.join(', ')+(mod?' · faixa de Crédito '+crFmt(mod):''),cur===v,i++)}).join('');
  grid.innerHTML=h;grid.scrollTop=0;
  chips.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.c===cat));return;
 }
 const specials=c.kind==='occ'?[['*','🎲','Aleatória','Sorteia uma ocupação']]:[['','➖','Nenhuma','Sem ocupação secundária'],['*','🎲','Aleatória','Sorteia uma secundária']];
 if(!q.value&&!cat)h+=specials.map(([v,e,n,d])=>card(v,e,n,'',[d],d,cur===v,i++)).join('');
 h+=list().map(x=>{const s=skills(x.o);return card(x.v,meta(x.n)[0],x.n,x.cred?`Crédito ${x.cred[0]}–${x.cred[1]}`:CAT[meta(x.n)[1]],s.keys.slice(0,3),(x.cred?'Perícias: ':'Perícias de interesse: ')+s.all.join(', ')+(x.cred?` · Crédito ${x.cred[0]}–${x.cred[1]}`:''),cur===x.v||cur.startsWith(x.v+'::'),i++,x.sub?Object.keys(x.sub.o).length:0,!!BG[x.n])}).join('');
 grid.innerHTML=h||'<p class="opk-none">Nada encontrado. Tente outra palavra ou outra categoria.</p>';
 chips.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.c===cat));
 tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===tab));
}

/* ---------- ajuda: o que é Nível de Crédito ---------- */
const BANDS=[['Sem recursos',0,0,'#6b2323'],['Pobre',1,9,'#8a5a2b'],['Médio',10,49,'#5b7a3a'],['Abastado',50,89,'#3f7f86'],['Rico',90,98,'#8a6fc0'],['Podre de rico',99,99,'#a88732']];
function helpHtml(){
 const ex=n=>{const o=OCC.find(x=>x.n===n);return o?`<div class="hx"><span>${meta(n)[0]} ${esc(n)} <b>${o.c[0]}–${o.c[1]}</b></span><div class="hbar"><i style="left:${o.c[0]}%;width:${Math.max(1.5,o.c[1]-o.c[0])}%"></i></div></div>`:''};
 return`<h5>O que é o Nível de Crédito?</h5>
<p>É uma perícia especial que representa a <strong>riqueza, a classe social e o padrão de vida</strong> do investigador: renda, patrimônio, moradia, roupas e acesso a recursos. Não mede caráter nem competência. Vai de <strong>0 a 99</strong>.</p>
<div class="hscale">${BANDS.map(([n,a,b,c])=>`<div style="flex:${Math.max(b-a+1,6)};background:${c}"><b>${n}</b><small>${a===b?a:a+'–'+b}</small></div>`).join('')}</div>
<p>As faixas são: <strong>0</strong> sem recursos; <strong>1–9</strong> pobre; <strong>10–49</strong> padrão médio; <strong>50–89</strong> abastado; <strong>90–98</strong> rico; <strong>99</strong> podre de rico.</p>
<h5>Como a ocupação define a faixa?</h5>
<p>O intervalo no cartão (por exemplo, <strong>Crédito 9–30</strong>) é a faixa plausível daquela ocupação. A ficha sorteia um valor dentro do intervalo final. A profissão dá um ponto de partida; origem, especialidade e histórico podem ajustá-lo quando descrevem uma mudança concreta de recursos.</p>
<div class="hex">${ex('Andarilho')}${ex('Detetive Particular')}${ex('Advogado')}${ex('Diletante')}</div>
<h5>Como funcionam os ajustes de +10 e −10?</h5>
<p>Um ajuste desloca <strong>os dois limites</strong> da faixa em 10 pontos. Os ajustes das escolhas aplicáveis se somam, com o efeito total limitado a <strong>−10 até +20</strong>. Eles não alteram os pontos de perícia já distribuídos pelo gerador.</p>
<p>Exemplo: um <strong>Detetive Particular</strong> começa em <strong>9–30</strong>. Ter servido como ex-policial acrescenta <strong>+10</strong>; ter estudado na <strong>Universidade Miskatonic</strong> acrescenta mais <strong>+10</strong>. A faixa passa a <strong>29–50</strong>, coerente com experiência profissional e formação universitária. Ser estudante, policial ou médico, por si só, não reduz Crédito. Um −10 representa uma perda ou renúncia financeira explícita, como gastar as economias numa coleção ou fazer voto de pobreza.</p>
<h5>Por que isso afeta as perícias?</h5>
<p>Na criação de personagem de Chamado de Cthulhu, o Crédito é comprado com os <strong>pontos de perícia da ocupação</strong>. Quanto maior o valor escolhido, menos pontos sobram para as outras perícias profissionais; a faixa mínima e máxima da ocupação continua valendo.</p>
<h5>Ocupação secundária e especialidades</h5>
<p>As <strong>etiquetas</strong> mostram perícias principais da ocupação. Na ocupação secundária não há outra faixa de Crédito: ela reforça perícias com pontos de interesse pessoal (INT × 2) e deve ser diferente da ocupação principal. Cartões com <strong>▸ opções</strong> permitem escolher uma área, especialidade ou origem; essas escolhas também podem afetar a faixa quando indicado.</p>
<button type="button" class="opk-back">← Voltar à lista</button>`;
}
function setHelp(on){dlg.classList.toggle('help',on);helpBtn.setAttribute('aria-pressed',on);helpBtn.textContent=on?'← Lista':'❔ Ajuda';if(on){helpBox.innerHTML=helpHtml();helpBox.scrollTop=0;helpBox.focus()}else q.focus()}
helpBtn.addEventListener('click',()=>setHelp(!dlg.classList.contains('help')));
helpBox.addEventListener('click',e=>{if(e.target.closest('.opk-back'))setHelp(false)});
dlg.addEventListener('close',()=>{subItem=null;bgItem=null;dlg.classList.remove('help');helpBtn.setAttribute('aria-pressed',false);helpBtn.textContent='❔ Ajuda'});
q.addEventListener('input',()=>{subItem=null;bgItem=null;render()});
chips.addEventListener('click',e=>{const b=e.target.closest('button');if(b){cat=b.dataset.c;subItem=null;render()}});
tabs.addEventListener('click',e=>{const b=e.target.closest('button');if(b){tab=b.dataset.t;subItem=null;render()}});
function setBG(slot,v){if(v)window.BGSEL[slot]=v;else delete window.BGSEL[slot];saveBG()}
function choose(v){ /* aplica a escolha e, se a ocupação tem origem, pergunta */
 ctx.sel.value=v;ctx.sel.dispatchEvent(new Event('change',{bubbles:true}));
 const slot=ctx.kind==='occ'?'p':'s',n=occName(v),has=n&&BG[n]&&(ctx.kind==='occ'||v.startsWith('occ:'));
 setBG(slot,null);
 if(has){bgItem={occ:n,slot};bgView='list';bgSk=[];render();return}
 ctx.sync();dlg.close();
}
function finishBG(pick){setBG(bgItem.slot,pick?{occ:bgItem.occ,pick}:null);ctx.sync();dlg.close()}
grid.addEventListener('click',e=>{
 if(bgItem){
  if(e.target.closest('[data-bgback]')){if(bgView==='form'){bgView='list'}else{bgItem=null}render();return}
  const sk=e.target.closest('[data-sk]');
  if(sk){const n=sk.dataset.sk,on=bgSk.includes(n);if(on)bgSk=bgSk.filter(x=>x!==n);else if(bgSk.length<2)bgSk.push(n);sk.setAttribute('aria-pressed',bgSk.includes(n));$('#bgCount').textContent=bgSk.length+'/2 perícias';return}
  if(e.target.closest('[data-bgok]')){finishBG({custom:true,name:$('#bgName').value,sk:bgSk});return}
  const c2=e.target.closest('.opk-card');if(!c2)return;const v=c2.dataset.v;
  if(v==='bg:custom'){bgView='form';render();$('#bgName').focus();return}
  if(v==='bg:random'){finishBG(null);return}
  if(v==='bg:none'){finishBG({none:true});return}
  finishBG({id:v.slice(3)});return;
 }
 if(e.target.closest('[data-back]')){subItem=null;render();return}
 const b=e.target.closest('.opk-card');if(!b)return;
 if(b.dataset.sub){subItem=items(ctx.kind==='occ'?'occ':'sec').find(x=>x.v===b.dataset.v)||null;render();return}
 choose(b.dataset.v);
});
const showDet=e=>{const b=e.target.closest('.opk-card');if(b)det.textContent=b.dataset.d};
grid.addEventListener('mouseover',showDet);grid.addEventListener('focusin',showDet);
q.addEventListener('keydown',e=>{if(e.key==='Enter'){const b=grid.querySelector('.opk-card:not([data-v="*"]):not([data-v=""])')||grid.querySelector('.opk-card');if(b)b.click()}});
dlg.querySelector('.opk-x').onclick=()=>dlg.close();
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
mount('occ','occ','Ocupação principal');mount('occ2','sec','Ocupação secundária');
window.syncPickers=()=>pickers.forEach(f=>f());
setTimeout(window.syncPickers,0);
})();
