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
/* A lua permanece no canto e recua suavemente quando a página desce. */
let scrollTick=false;
function moveMoon(){
 const distance=Math.min(window.scrollY/700,1);
 btn.style.setProperty('--moon-away',distance.toFixed(3));
 scrollTick=false;
}
window.addEventListener('scroll',()=>{if(!scrollTick){requestAnimationFrame(moveMoon);scrollTick=true}},{passive:true});
moveMoon();
const phase=document.createElement('span');phase.className='mphase';phase.setAttribute('aria-hidden','true');btn.appendChild(phase);
const dots=[...btn.querySelectorAll('.mdots i')];let tm;
function apply(t,anim){
 if(anim){
  const oldColor=getComputedStyle(root).getPropertyValue('--k0').trim()||'#030707';
  const wipe=document.createElement('div');wipe.className='theme-wipe';wipe.style.setProperty('--wipe-color',oldColor);document.body.appendChild(wipe);
  requestAnimationFrame(()=>wipe.classList.add('open'));wipe.addEventListener('animationend',()=>wipe.remove(),{once:true});
  root.classList.add('tswap');clearTimeout(tm);tm=setTimeout(()=>root.classList.remove('tswap'),850);
 }
 if(t==='green')delete root.dataset.theme;else root.dataset.theme=t;
 if(anim){btn.classList.remove('phase-shift');void btn.offsetWidth;btn.classList.add('phase-shift');setTimeout(()=>btn.classList.remove('phase-shift'),820)}
 const i=T.indexOf(t),nx=T[(i+1)%T.length];
 dots.forEach((d,k)=>d.classList.toggle('on',k===i));
 btn.setAttribute('aria-label','Mudar o cenário. Tema atual: '+N[t]+'.');
 btn.title='Cenário '+N[t]+' — clique para '+N[nx];
 try{localStorage.setItem(KEY,t)}catch{}
}
const cur=()=>T.includes(root.dataset.theme)?root.dataset.theme:'green';
btn.addEventListener('click',()=>{
 btn.classList.remove('spin');void btn.offsetWidth;btn.classList.add('spin');
 apply(T[(T.indexOf(cur())+1)%T.length],true);
});
btn.addEventListener('animationend',e=>{if(e.animationName==='moonSwap')btn.classList.remove('spin')});
apply(cur(),false);
})();
