/* A lua controla os quatro cenários e revela cada nova paleta como uma onda. */
(()=>{
 'use strict';

 const themes=['green','red','blue','paper'];
 const names={green:'verde',red:'vermelho',blue:'azul',paper:'papel pautado'};
 const storageKey='cthulhu-tema';
 const root=document.documentElement;
 const button=document.getElementById('moon');
 const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 if(!button)return;

 const dots=[...button.querySelectorAll('.mdots i')];
 let scrollFrame=0, fallbackTimer;

 function currentTheme(){
  return themes.includes(root.dataset.theme)?root.dataset.theme:'green';
 }

 function saveTheme(theme){
  if(theme==='green')delete root.dataset.theme;
  else root.dataset.theme=theme;

  const index=themes.indexOf(theme);
  const next=themes[(index+1)%themes.length];
  dots.forEach((dot,dotIndex)=>dot.classList.toggle('on',dotIndex===index));
  button.setAttribute('aria-label',`Trocar cenário. Tema atual: ${names[theme]}.`);
  button.title=`Cenário ${names[theme]} — clique para ${names[next]}`;

  try{localStorage.setItem(storageKey,theme)}catch(_){/* armazenamento pode estar bloqueado */}
 }

 function updateScrollFade(){
  scrollFrame=0;
  const progress=Math.min(1,Math.max(0,window.scrollY/620));
  button.style.setProperty('--moon-scroll-opacity',String(.82-.66*progress));
 }

 function scheduleScrollFade(){
  if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScrollFade);
 }

 function revealTheme(theme){
  if(reduceMotion.matches||typeof document.startViewTransition!=='function'){
   root.classList.add('tswap');
   saveTheme(theme);
   clearTimeout(fallbackTimer);
   fallbackTimer=setTimeout(()=>root.classList.remove('tswap'),650);
   return;
  }

  const rect=button.getBoundingClientRect();
  const x=rect.left+rect.width/2;
  const y=rect.top+rect.height/2;
  const radius=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
  const compact=window.matchMedia('(max-width: 640px), (pointer: coarse)').matches;
  const transition=document.startViewTransition(()=>saveTheme(theme));

  transition.ready.then(()=>{
   root.animate([
    {clipPath:`circle(0 at ${x}px ${y}px)`,offset:0},
    {clipPath:`circle(${radius*.58}px at ${x}px ${y}px)`,offset:.64},
    {clipPath:`circle(${radius}px at ${x}px ${y}px)`,offset:1}
   ],
    {duration:compact?760:1050,easing:'cubic-bezier(.16,.72,.22,1)',fill:'none',pseudoElement:'::view-transition-new(root)'}
   );
   root.animate(
    {transform:['translateX(-25px) scale(.72)','translateX(5px) scale(1.08)','translateX(0) scale(1)'],filter:['brightness(.72) saturate(.6)','brightness(1.35) saturate(1.3)','brightness(1) saturate(1)']},
    {duration:780,easing:'cubic-bezier(.2,.75,.25,1)',pseudoElement:'::view-transition-new(theme-moon)'}
   );
  }).catch(()=>{/* uma transição interrompida não impede a troca do tema */});
 }

 button.addEventListener('click',()=>{
  const index=themes.indexOf(currentTheme());
  revealTheme(themes[(index+1)%themes.length]);
 });

 window.addEventListener('scroll',scheduleScrollFade,{passive:true});
 window.addEventListener('resize',scheduleScrollFade,{passive:true});
 updateScrollFade();
 saveTheme(currentTheme());
})();
