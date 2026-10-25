/* Mobile first-use guidance and small-screen controls. */
(()=>{
 const welcome=document.getElementById('mobileWelcome');
 const desk=document.getElementById('desk');
 const panelBtn=document.getElementById('panelBtn');
 if(!welcome||!desk)return;
 let hadSheet=!!desk.querySelector('.win');

 function syncWelcome(){
  const isMobile=document.body.classList.contains('mobile');
  const onSheets=document.body.dataset.mtab==='fichas';
  const hasSheet=!!desk.querySelector('.win');
  welcome.hidden=!(isMobile&&onSheets&&!hasSheet);
  if(isMobile&&hasSheet&&!hadSheet){
   requestAnimationFrame(()=>desk.querySelector('.win')?.scrollIntoView({block:'start',behavior:'instant'}));
  }
  hadSheet=hasSheet;
  if(panelBtn){
   if(!panelBtn.dataset.desktopLabel)panelBtn.dataset.desktopLabel=panelBtn.textContent.trim();
   panelBtn.textContent=isMobile?'☰ Opções':panelBtn.dataset.desktopLabel;
   panelBtn.setAttribute('aria-label',isMobile?'Abrir opções de geração e dados':'Abrir painel de geração');
  }
 }

 welcome.addEventListener('click',e=>{
  const action=e.target.closest('[data-mobile-action]')?.dataset.mobileAction;
  const target=action==='guided'?'guided':action==='random'?'go':action==='blank'?'blank':null;
  if(target)document.getElementById(target)?.click();
 });
 new MutationObserver(syncWelcome).observe(desk,{childList:true,subtree:true});
 new MutationObserver(syncWelcome).observe(document.body,{attributes:true,attributeFilter:['class','data-mtab']});
 syncWelcome();
})();
