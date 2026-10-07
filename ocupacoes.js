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
const items=(kind)=>kind==='occ'?OCC.map(o=>({v:o.n,n:o.n,o,cred:o.c})):
 [...SEC.map(o=>({v:o.n,n:o.n,o,sec:1})),...OCC.map(o=>({v:'occ:'+o.n,n:o.n,o,cred:o.c,dup:1}))];

const dlg=document.createElement('dialog');dlg.className='opk';dlg.setAttribute('aria-label','Escolher ocupação');
dlg.innerHTML=`<header><h4 id="opkT"></h4><button type="button" class="opk-x" aria-label="Fechar">✕</button></header>
<div class="opk-tools"><input id="opkQ" type="search" placeholder="Buscar ocupação ou perícia…" aria-label="Buscar"><div id="opkTabs" class="opk-tabs"></div></div>
<div id="opkChips" class="opk-chips"></div><div id="opkGrid" class="opk-grid" role="listbox"></div>
<footer id="opkDet" class="opk-det">Passe o mouse (ou foque) sobre uma ocupação para ver as perícias.</footer>`;
document.body.appendChild(dlg);
const q=$('#opkQ'),grid=$('#opkGrid'),chips=$('#opkChips'),tabs=$('#opkTabs'),det=$('#opkDet');
let ctx=null,cat='',tab='sec';

function btnText(sel){
 const v=sel.value;if(v==='*')return['🎲','Aleatória'];if(v==='')return['➖','Nenhuma'];
 const n=v.startsWith('occ:')?v.slice(4):v;return[meta(n)[0],n+(v.startsWith('occ:')?' (como secundária)':'')];
}
const pickers=[];
function mount(selId,kind,title){
 const sel=document.getElementById(selId);if(!sel)return;const label=sel.closest('label');
 sel.classList.add('sr');sel.tabIndex=-1;
 const b=document.createElement('button');b.type='button';b.className='pickbtn';b.setAttribute('aria-haspopup','dialog');label.appendChild(b);
 const sync=()=>{const[e,t]=btnText(sel);b.innerHTML=`<span class="pe">${e}</span><span class="pt">${esc(t)}</span><span class="pc">▾</span>`};
 sync();sel.addEventListener('change',sync);pickers.push(sync);
 label.addEventListener('click',e=>{e.preventDefault();openPick({sel,kind,title,sync})});
}
function openPick(c){
 ctx=c;cat='';q.value='';tab='sec';$('#opkT').textContent=c.title;
 tabs.innerHTML=c.kind==='sec'?'<button type="button" data-t="sec">Especialidades</button><button type="button" data-t="occ">Ocupações completas</button>':'';
 tabs.hidden=c.kind!=='sec';
 chips.innerHTML='<button type="button" data-c="" aria-pressed="true">Todas</button>'+Object.entries(CAT).map(([k,v])=>`<button type="button" data-c="${k}" aria-pressed="false">${v}</button>`).join('');
 render();dlg.showModal();q.focus();
}
function list(){
 const c=ctx,t=norm(q.value.trim());let src=items(c.kind==='occ'?'occ':'sec');
 if(c.kind==='sec')src=src.filter(i=>tab==='sec'?i.sec:i.dup);
 return src.filter(i=>(!cat||meta(i.n)[1]===cat)&&(!t||norm(i.n).includes(t)||skills(i.o).all.some(s=>norm(s).includes(t)))).sort((a,b)=>a.n.localeCompare(b.n,'pt'));
}
function card(v,e,name,sub,tags,full,on,idx){
 return`<button type="button" class="opk-card${on?' on':''}" role="option" aria-selected="${on}" data-v="${esc(v)}" data-d="${esc(full)}" style="--d:${Math.min(idx,24)*18}ms"><span class="oe">${e}</span><span class="oname">${esc(name)}</span>${sub?`<span class="os">${esc(sub)}</span>`:''}<span class="ot">${tags.map(x=>`<i>${esc(x)}</i>`).join('')}</span></button>`;
}
function render(){
 const c=ctx,cur=c.sel.value;let i=0,h='';
 if(c.kind==='sec'&&tab==='sec'||c.kind==='occ'){}
 const specials=c.kind==='occ'?[['*','🎲','Aleatória','Sorteia uma ocupação']]:[['','➖','Nenhuma','Sem ocupação secundária'],['*','🎲','Aleatória','Sorteia uma secundária']];
 if(!q.value&&!cat)h+=specials.map(([v,e,n,d])=>card(v,e,n,'',[d],d,cur===v,i++)).join('');
 const L=list();
 h+=L.map(x=>{const s=skills(x.o);return card(x.v,meta(x.n)[0],x.n,x.cred?`Crédito ${x.cred[0]}–${x.cred[1]}`:CAT[meta(x.n)[1]],s.keys.slice(0,3),(x.cred?'Perícias: ':'Perícias de interesse: ')+s.all.join(', ')+(x.cred?` · Crédito ${x.cred[0]}–${x.cred[1]}`:''),cur===x.v,i++)}).join('');
 grid.innerHTML=h||'<p class="opk-none">Nada encontrado. Tente outra palavra ou outra categoria.</p>';
 chips.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.c===cat));
 tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===tab));
}
q.addEventListener('input',render);
chips.addEventListener('click',e=>{const b=e.target.closest('button');if(b){cat=b.dataset.c;render()}});
tabs.addEventListener('click',e=>{const b=e.target.closest('button');if(b){tab=b.dataset.t;render()}});
grid.addEventListener('click',e=>{const b=e.target.closest('.opk-card');if(!b)return;ctx.sel.value=b.dataset.v;ctx.sel.dispatchEvent(new Event('change',{bubbles:true}));dlg.close()});
const showDet=e=>{const b=e.target.closest('.opk-card');if(b)det.textContent=b.dataset.d};
grid.addEventListener('mouseover',showDet);grid.addEventListener('focusin',showDet);
q.addEventListener('keydown',e=>{if(e.key==='Enter'){const b=grid.querySelector('.opk-card:not([data-v="*"]):not([data-v=""])')||grid.querySelector('.opk-card');if(b)b.click()}});
dlg.querySelector('.opk-x').onclick=()=>dlg.close();
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
mount('occ','occ','Ocupação principal');mount('occ2','sec','Ocupação secundária');
window.syncPickers=()=>pickers.forEach(f=>f());
setTimeout(window.syncPickers,0);
})();
