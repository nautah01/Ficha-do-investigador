/* A lua do cenário troca o tema do site: verde (padrão) → vermelha → azul → papel… */
(()=>{
const T=['green','red','blue','paper'],N={green:'verde',red:'vermelha',blue:'azul',paper:'de papel com linhas amarelas'},KEY='cthulhu-tema';
const root=document.documentElement,btn=document.getElementById('moon');if(!btn)return;
/* Mantém a lua na camada fixa do botão que reabre o painel. */
if(btn.parentElement!==root)root.appendChild(btn);
btn.style.setProperty('position','fixed','important');
btn.style.setProperty('top','10px','important');
btn.style.setProperty('right','10px','important');
btn.style.setProperty('left','auto','important');
btn.style.setProperty('bottom','auto','important');
btn.style.setProperty('z-index','6000','important');
const dots=[...btn.querySelectorAll('.mdots i')];let tm;
function setTheme(t){
 if(t==='green')delete root.dataset.theme;else root.dataset.theme=t;
 const i=T.indexOf(t),nx=T[(i+1)%T.length];
 dots.forEach((d,k)=>d.classList.toggle('on',k===i));
 btn.setAttribute('aria-label','Mudar o cenário. Tema atual: '+N[t]+'.');
 btn.title='Cenário '+N[t]+' — clique para '+N[nx];
 try{localStorage.setItem(KEY,t)}catch{}
}
function apply(t,anim){
 if(!anim){setTheme(t);return}
 clearTimeout(tm);
 if(document.startViewTransition&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  const r=btn.getBoundingClientRect();
  root.style.setProperty('--theme-x',(r.left+r.width/2)+'px');
  root.style.setProperty('--theme-y',(r.top+r.height/2)+'px');
  document.startViewTransition(()=>setTheme(t));
 }else{
  root.classList.add('tswap');setTheme(t);
  tm=setTimeout(()=>root.classList.remove('tswap'),700);
 }
}
const cur=()=>T.includes(root.dataset.theme)?root.dataset.theme:'green';
btn.addEventListener('click',()=>{
 btn.classList.remove('spin');void btn.offsetWidth;btn.classList.add('spin');
 apply(T[(T.indexOf(cur())+1)%T.length],true);
});
btn.addEventListener('animationend',e=>{if(e.animationName==='moonSwap')btn.classList.remove('spin')});
const fadeMoon=()=>root.style.setProperty('--moon-visibility',String(Math.max(.08,1-window.scrollY/900)));
window.addEventListener('scroll',fadeMoon,{passive:true});fadeMoon();
apply(cur(),false);
})();
