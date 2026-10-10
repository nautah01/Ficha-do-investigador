/* A lua fica fixa, acompanha a rolagem com discrição e conduz a troca entre os temas. */
(()=>{
const T=['green','red','blue','paper'],N={green:'verde',red:'vermelha',blue:'azul',paper:'de papel com linhas amarelas'},KEY='cthulhu-tema';
const root=document.documentElement,btn=document.getElementById('moon');if(!btn)return;
/* Mantém a lua no viewport, mesmo quando outros estilos ou scripts são aplicados. */
if(btn.parentElement!==root)root.appendChild(btn);
btn.style.setProperty('position','fixed','important');
btn.style.setProperty('top','10px','important');
btn.style.setProperty('right','10px','important');
btn.style.setProperty('left','auto','important');
btn.style.setProperty('bottom','auto','important');
btn.style.setProperty('z-index','6000','important');
const dots=[...btn.querySelectorAll('.mdots i')],reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');let tm,scrollFrame=0;
function apply(t,soft){
 if(soft&&!reduceMotion.matches){root.classList.add('tswap');clearTimeout(tm);tm=setTimeout(()=>root.classList.remove('tswap'),700)}
 if(t==='green')delete root.dataset.theme;else root.dataset.theme=t;
 const i=T.indexOf(t),nx=T[(i+1)%T.length];
 dots.forEach((d,k)=>d.classList.toggle('on',k===i));
 btn.setAttribute('aria-label','Mudar o cenário. Tema atual: '+N[t]+'.');
 btn.title='Cenário '+N[t]+' — clique para '+N[nx];
 try{localStorage.setItem(KEY,t)}catch{}
}
const cur=()=>T.includes(root.dataset.theme)?root.dataset.theme:'green';
function fadeOnScroll(){
 scrollFrame=0;
 const progress=Math.min(1,Math.max(0,window.scrollY/620));
 btn.style.opacity=String(.82-.66*progress);
}
function scheduleFade(){if(!scrollFrame)scrollFrame=requestAnimationFrame(fadeOnScroll)}
window.addEventListener('scroll',scheduleFade,{passive:true});
fadeOnScroll();
btn.addEventListener('click',()=>{
 btn.classList.remove('spin');void btn.offsetWidth;btn.classList.add('spin');
 const next=T[(T.indexOf(cur())+1)%T.length];
 if(document.startViewTransition&&!reduceMotion.matches){
  try{document.startViewTransition(()=>apply(next,false))}
  catch{apply(next,true)}
 }else apply(next,true);
});
btn.addEventListener('animationend',e=>{if(e.animationName==='moonFlight')btn.classList.remove('spin')});
apply(cur(),false);
})();
