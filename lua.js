/* A lua do cenário troca o tema do site: verde (padrão) → vermelha → azul → papel… */
(()=>{
const T=['green','red','blue','paper'],N={green:'verde',red:'vermelha',blue:'azul',paper:'de papel com linhas amarelas'},KEY='cthulhu-tema';
const root=document.documentElement,btn=document.getElementById('moon');if(!btn)return;
const dots=[...btn.querySelectorAll('.mdots i')];let tm;
function apply(t,anim){
 if(anim){root.classList.add('tswap');clearTimeout(tm);tm=setTimeout(()=>root.classList.remove('tswap'),700)}
 if(t==='green')delete root.dataset.theme;else root.dataset.theme=t;
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
