/* Modo celular: barra de abas inferior (Fichas · Quadro · Livro · Cemitério) */
(()=>{
const body=document.body,nav=document.createElement('nav');nav.id='mobTabs';nav.setAttribute('aria-label','Seções do site');
nav.innerHTML=[['fichas','🧾','Fichas'],['quadro','📌','Quadro'],['livro','📖','Livro'],['cemiterio','🪦','Cemitério']].map(([k,i,t])=>`<button type="button" data-t="${k}"><span aria-hidden="true">${i}</span>${t}</button>`).join('');
body.appendChild(nav);
const cem=document.getElementById('cem'),note=document.getElementById('note');
function go(t){
 body.dataset.mtab=t;
 nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',b.dataset.t===t?'page':'false'));
 note.classList.remove('min');
 if(window.Notas){Notas.open(t==='quadro'||t==='livro');if(t==='quadro'||t==='livro')Notas.tab(t==='quadro'?'board':'book')}
 if(window.Cemiterio)Cemiterio.open(t==='cemiterio');
 scrollTo(0,0);
}
nav.addEventListener('click',e=>{const b=e.target.closest('button');if(b)go(b.dataset.t)});
let was=false;
function sync(){
 const m=body.classList.contains('mobile');
 if(m&&!was)go('fichas');
 if(!m&&was){delete body.dataset.mtab;if(window.Notas)Notas.open(false);if(window.Cemiterio)Cemiterio.open(false)}
 was=m;
}
new MutationObserver(sync).observe(body,{attributes:true,attributeFilter:['class']});
if(cem)new MutationObserver(()=>{
 if(!body.classList.contains('mobile'))return;
 if(!cem.hidden&&body.dataset.mtab!=='cemiterio')go('cemiterio');
 else if(cem.hidden&&body.dataset.mtab==='cemiterio')go('fichas');
}).observe(cem,{attributes:true,attributeFilter:['hidden']});
sync();
})();
