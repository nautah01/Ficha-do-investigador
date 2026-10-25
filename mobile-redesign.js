/* Small-screen controls and sheet navigation. */
(()=>{
 const desk=document.getElementById('desk');
 const panelBtn=document.getElementById('panelBtn');
 const moreTools=document.getElementById('noteMoreTools');
 const boardActions=document.getElementById('boardActions');
 if(!desk)return;
 let hadSheet=!!desk.querySelector('.win');
 let priorMobile=null;

 function sync(){
  const isMobile=document.body.classList.contains('mobile');
  if(priorMobile!==isMobile){
   if(moreTools)moreTools.open=!isMobile;
   if(boardActions)boardActions.open=!isMobile;
   priorMobile=isMobile;
  }
  const hasSheet=!!desk.querySelector('.win');
  if(isMobile&&hasSheet&&!hadSheet){
   requestAnimationFrame(()=>desk.querySelector('.win')?.scrollIntoView({block:'start',behavior:'instant'}));
  }
  hadSheet=hasSheet;
  if(panelBtn){
   if(!panelBtn.dataset.desktopLabel)panelBtn.dataset.desktopLabel=panelBtn.textContent.trim();
   panelBtn.textContent=isMobile?'☰ Painel':panelBtn.dataset.desktopLabel;
   panelBtn.setAttribute('aria-label',isMobile?'Abrir painel':'Abrir painel de geração');
   panelBtn.title=isMobile?'Abrir painel':'Abrir painel de geração';
  }
 }
 new MutationObserver(sync).observe(desk,{childList:true,subtree:true});
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
 sync();
})();
