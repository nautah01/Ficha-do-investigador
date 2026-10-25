/* Navegação inferior no celular, espelhada nos quatro destinos do aplicativo. */
(()=>{
 const body=document.body,nav=document.createElement('nav');nav.id='mobTabs';nav.setAttribute('aria-label','Navegação principal');
 nav.innerHTML=[
  ['investigators','Investigadores','Investigadores'],
  ['investigation','Investigação','Investigação'],
  ['keeper','Guardião','Mesa do Guardião'],
  ['archive','Arquivo','Arquivo']
 ].map(([key,label,accessible])=>`<button type="button" data-mobile-destination="${key}" aria-label="${accessible}" aria-current="${body.dataset.mtab===key?'page':'false'}">${label}</button>`).join('');
 body.appendChild(nav);
 nav.addEventListener('click',e=>{
  const button=e.target.closest('[data-mobile-destination]');
  if(button)window.AppShell?.navigate(button.dataset.mobileDestination,button);
 });
 const sync=()=>nav.querySelectorAll('[data-mobile-destination]').forEach(button=>button.setAttribute('aria-current',button.dataset.mobileDestination===body.dataset.mtab?'page':'false'));
 new MutationObserver(sync).observe(body,{attributes:true,attributeFilter:['data-mtab']});
 const cemetery=document.getElementById('cem');
 if(cemetery)new MutationObserver(()=>{
  if(body.classList.contains('mobile')&&!cemetery.hidden&&body.dataset.mtab!=='archive')window.AppShell?.navigate('archive',{keepCemetery:true});
 }).observe(cemetery,{attributes:true,attributeFilter:['hidden']});
 sync();
})();
