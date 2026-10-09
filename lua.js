/* Lua fixa: o brilho acompanha a rolagem; trocar tema anima fase e cenário. */
(()=>{
const T=['green','red','blue','paper'],N={green:'verde',red:'vermelha',blue:'azul',paper:'de arquivo sobre madeira'},KEY='cthulhu-tema';
const root=document.documentElement,btn=document.getElementById('moon');if(!btn)return;
if(btn.parentElement!==root)root.appendChild(btn);
btn.style.setProperty('position','fixed','important');
btn.style.setProperty('top','max(10px, env(safe-area-inset-top))','important');
btn.style.setProperty('right','max(10px, env(safe-area-inset-right))','important');
btn.style.setProperty('left','auto','important');btn.style.setProperty('bottom','auto','important');btn.style.setProperty('z-index','6000','important');
const dots=[...btn.querySelectorAll('.mdots i')];let tm,scrollFrame=0;
function setScrollFade(){
 scrollFrame=0;
 const progress=Math.min(1,Math.max(0,window.scrollY)/420);
 btn.style.setProperty('--moon-opacity',String(.9-progress*.76));
}
function onScroll(){if(!scrollFrame)scrollFrame=requestAnimationFrame(setScrollFade)}
function apply(t){
 if(t==='green')delete root.dataset.theme;else root.dataset.theme=t;
 const i=T.indexOf(t),nx=T[(i+1)%T.length];
 dots.forEach((d,k)=>d.classList.toggle('on',k===i));
 btn.setAttribute('aria-label','Mudar o cenário. Tema atual: '+N[t]+'.');
 btn.title='Cenário '+N[t]+' — clique para '+N[nx];
 try{localStorage.setItem(KEY,t)}catch{}
}
function switchTheme(next,event){
 const oldSurface=getComputedStyle(btn).backgroundImage;
 const x=event?.clientX??(innerWidth-40),y=event?.clientY??40;
 root.style.setProperty('--theme-wave-x',x+'px');root.style.setProperty('--theme-wave-y',y+'px');
 const update=()=>apply(next);
 if(document.startViewTransition&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  document.startViewTransition(update);
 }else update();
 btn.classList.remove('spin');void btn.offsetWidth;btn.classList.add('spin');
 const veil=document.createElement('span');veil.className='moon-phase-veil';veil.setAttribute('aria-hidden','true');veil.style.backgroundImage=oldSurface;btn.append(veil);
 veil.addEventListener('animationend',()=>veil.remove(),{once:true});
 clearTimeout(tm);tm=setTimeout(()=>{btn.classList.remove('spin');veil.remove()},1100);
}
const cur=()=>T.includes(root.dataset.theme)?root.dataset.theme:'green';
btn.addEventListener('click',event=>switchTheme(T[(T.indexOf(cur())+1)%T.length],event));
window.addEventListener('scroll',onScroll,{passive:true});setScrollFade();apply(cur());
})();
