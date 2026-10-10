/* A lua do cenário troca o tema do site: verde (padrão) → vermelha → azul → papel… */
(()=>{
const T=['green','red','blue','paper'],N={green:'verde',red:'vermelha',blue:'azul',paper:'de papel com linhas amarelas'},KEY='cthulhu-tema';
const root=document.documentElement,btn=document.getElementById('moon');if(!btn)return;
/* A lua fica na camada fixa da página, mesmo se o HTML ao redor mudar. */
if(btn.parentElement!==root)root.appendChild(btn);
btn.style.setProperty('position','fixed','important');
btn.style.setProperty('top','max(10px, env(safe-area-inset-top))','important');
btn.style.setProperty('right','max(10px, env(safe-area-inset-right))','important');
btn.style.setProperty('left','auto','important');
btn.style.setProperty('bottom','auto','important');
btn.style.setProperty('z-index','6000','important');
const dots=[...btn.querySelectorAll('.mdots i')],reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');let tm,busy=false,scrollFrame=0;
function apply(t,anim){
 if(anim&&!document.startViewTransition){root.classList.add('tswap');clearTimeout(tm);tm=setTimeout(()=>root.classList.remove('tswap'),700)}
 if(t==='green')delete root.dataset.theme;else root.dataset.theme=t;
 const i=T.indexOf(t),nx=T[(i+1)%T.length];
 dots.forEach((d,k)=>d.classList.toggle('on',k===i));
 btn.setAttribute('aria-label','Mudar o cenário. Tema atual: '+N[t]+'.');
 btn.title='Cenário '+N[t]+' — clique para '+N[nx];
 try{localStorage.setItem(KEY,t)}catch{}
}
const cur=()=>T.includes(root.dataset.theme)?root.dataset.theme:'green';
function updateScrollFade(){
 scrollFrame=0;
 const progress=Math.min(window.scrollY/420,1);
 btn.style.setProperty('--scroll-opacity',(0.46-0.30*progress).toFixed(3));
}
window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScrollFade)},{passive:true});
updateScrollFade();
btn.addEventListener('click',async()=>{
 if(busy)return;
 busy=true;btn.setAttribute('aria-busy','true');btn.classList.remove('spin');void btn.offsetWidth;btn.classList.add('spin');
 const next=T[(T.indexOf(cur())+1)%T.length];
 if(document.startViewTransition&&!reduceMotion.matches){
  const rect=btn.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;
  const radius=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
  const transition=document.startViewTransition(()=>apply(next,true));
  transition.ready.then(()=>root.animate(
   {clipPath:[`circle(0 at ${x}px ${y}px)`,`circle(${radius}px at ${x}px ${y}px)`]},
   {duration:1050,easing:'cubic-bezier(.16,.72,.22,1)',pseudoElement:'::view-transition-new(root)'}
  )).catch(()=>{});
  try{await transition.finished}catch{}
 }else apply(next,true);
 btn.classList.remove('spin');btn.removeAttribute('aria-busy');busy=false;
});
apply(cur(),false);
})();

