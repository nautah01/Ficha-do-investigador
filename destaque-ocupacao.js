/* Destaque das perícias da ocupação na ficha em branco.
   Quando "Distribuir agora" está em "Ocupacionais", as perícias que aceitam pontos ocupacionais
   ganham um realce (★ + cor de destaque) e uma legenda aparece no painel de pontos.
   Usa só funções que o index.html já define (cur, occupationFor, occupationSkillRules, SOC). */
(()=>{
 const style=document.createElement('style');
 style.textContent=`
 .skill-row.is-occ{background:rgba(var(--gr),.17);border-left:3px solid var(--head);border-radius:3px;padding-left:5px;box-shadow:inset 0 0 0 1px rgba(var(--gr),.22)}
 .skill-row.is-occ .sk-name{color:var(--head);font-weight:700}
 .skill-row.is-occ .sk-name::before{content:"★ ";font-weight:400}
 .occ-legend{display:flex;align-items:flex-start;gap:7px;padding:6px 8px;border:1px solid rgba(var(--gr2),.28);border-radius:4px;background:rgba(var(--gr),.06);color:var(--muted);font-size:.74rem;line-height:1.4}
 .occ-legend b{flex:0 0 auto;padding:0 6px;border-left:3px solid var(--head);border-radius:3px;background:rgba(var(--gr),.17);color:var(--head)}
 .occ-legend[hidden]{display:none}`;
 document.head.appendChild(style);

 function matches(p,n,rules){
  return n==='Nível de Crédito'||rules.names.has(n)||(rules.social&&SOC.includes(n))||(rules.language&&/^Língua \(/.test(n));
 }
 function apply(){
  const desk=document.getElementById('desk');
  if(!desk||typeof cur==='undefined')return;
  desk.querySelectorAll('.win').forEach(win=>{
   const p=cur[+win.dataset.i];if(!p||!p.blank)return;
   const on=(p.skillBudgetMode||'occupational')==='occupational'&&!!occupationFor(p.occ);
   const rules=on?occupationSkillRules(p):null;
   win.querySelectorAll('.skill-row').forEach(row=>{
    const name=row.querySelector('.sk-name');
    row.classList.toggle('is-occ',!!(on&&name&&matches(p,name.textContent.trim(),rules)));
   });
   const box=win.querySelector('.blank-budgets');if(!box)return;
   let legend=box.querySelector('.occ-legend');
   if(!legend){legend=document.createElement('div');legend.className='occ-legend';const controls=box.querySelector('.budget-controls');controls?controls.after(legend):box.appendChild(legend)}
   legend.hidden=!on;
   if(on)legend.innerHTML='<b>★ Perícia</b><span>Perícias da ocupação escolhida (e Nível de Crédito) ficam destacadas.'+(rules.any?' A ocupação também aceita outras perícias à sua escolha, que não são marcadas.':'')+'</span>';
  });
 }
 const desk=document.getElementById('desk');
 if(!desk)return;
 new MutationObserver(apply).observe(desk,{childList:true});
 desk.addEventListener('change',()=>setTimeout(apply,0));
 apply();
})();
