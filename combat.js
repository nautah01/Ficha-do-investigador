/* Painéis de Combate e de Recursos (Crédito). Só montam HTML a partir da ficha;
   os botões de munição reutilizam as ações data-eq-action do equipamento (tratadas em app.js). */

/* ---------------- Combate ---------------- */
function combatSkill(p,name){
 if(!name)return null;
 const v=get(p,'s:'+name);
 if(v!==undefined&&v!==null&&v!=='')return +v||0;
 const d=window.CthEquipment.skillValue(p,name);
 return d>0?d:null;
}
function combatRows(p){
 const rows=[{name:'Ataque desarmado',note:'soco, chute, cabeçada',skill:'Lutar (Brigar)',dmg:'1D3 + BD',range:'Toque',rate:'1'}];
 window.CthEquipment.ensure(p).forEach(it=>{
  if(it.kind==='firearm'||it.kind==='melee')rows.push({it,name:it.name||'Arma',skill:it.skill||'',dmg:it.damage,range:it.range,rate:it.rate,mal:it.mal,gun:it.kind==='firearm'});
 });
 return rows;
}
function combatRow(p,r){
 const v=combatSkill(p,r.skill),c=v==null?null:chancesOf(v),cell=x=>c?`<b>${x}%</b>`:'—';
 const it=r.it;
 const ammo=r.gun?`<span class="cb-ammo"><b>${+it.loaded||0}</b>/${+it.capacity||0} · reserva ${+it.reserve||0}</span><span class="cb-btns"><button type="button" class="cb-mini" data-eq-action="shot" data-eq-id="${esc(it.uid)}" title="Gastar 1 munição" aria-label="Gastar uma munição de ${esc(r.name)}" ${(+it.loaded||0)<1?'disabled':''}>−1</button><button type="button" class="cb-mini" data-eq-action="reload" data-eq-id="${esc(it.uid)}" ${(+it.reserve||0)<1||(+it.loaded||0)>=(+it.capacity||0)?'disabled':''} aria-label="Recarregar ${esc(r.name)}">Recarregar</button></span>`:'—';
 return`<tr class="cb-row"><th scope="row" data-label="Arma"><span class="cb-name">${esc(r.name)}</span>${r.note?`<small>${esc(r.note)}</small>`:''}${it&&(+it.quantity||0)>1?`<small>×${+it.quantity}</small>`:''}</th><td data-label="Perícia">${r.skill?esc(r.skill):'—'}${v==null&&r.skill?'<small>sem valor na ficha</small>':''}</td><td data-label="Normal" class="cb-c">${cell(c&&c.n)}</td><td data-label="Difícil" class="cb-c">${cell(c&&c.h)}</td><td data-label="Extremo" class="cb-c">${cell(c&&c.e)}</td><td data-label="Dano">${esc(damageText(r.dmg,p.der&&p.der.db))}</td><td data-label="Alcance">${esc(r.range||'—')}</td><td data-label="Ataques/rodada">${esc(r.rate||'—')}</td><td data-label="Munição"${r.gun?'':' class="cb-na"'}>${ammo}</td><td data-label="Falha">${r.gun?esc(malfText(r.mal)):'—'}</td></tr>`;
}
function combatInner(p){
 const dodge=combatSkill(p,'Esquivar')||0,d=chancesOf(dodge),der=p.der||{};
 const rows=combatRows(p);
 const hasWeapons=rows.length>1;
 return`<div class="cb-summary"><div><span>Esquivar</span><b>${d.n}%</b><small>${d.h} / ${d.e}</small></div><div><span>Bônus de Dano</span><b>${esc(der.db??'0')}</b></div><div><span>Corpo</span><b>${esc(der.corpo??0)}</b></div><div><span>PV</span><b>${esc(der.hp??0)}</b></div><div><span>Mov</span><b>${esc(der.mov??0)}</b></div></div>
 <div class="cb-wrap"><table class="cb-table"><thead><tr><th>Arma</th><th>Perícia</th><th>Normal</th><th>Difícil</th><th>Extremo</th><th>Dano</th><th>Alcance</th><th>Ataques/rodada</th><th>Munição</th><th>Falha</th></tr></thead><tbody>${rows.map(r=>combatRow(p,r)).join('')}</tbody></table></div>
 ${hasWeapons?'':'<p class="cb-empty">Armas adicionadas na aba Equipamentos aparecem aqui, com as chances já calculadas.</p>'}
 <small class="cb-legend">Normal = valor da perícia · Difícil = metade · Extremo = um quinto. <b>Falha:</b> um d100 igual ou maior que esse número faz a arma emperrar. O Bônus de Dano já está somado ao dano das armas corpo a corpo.</small>`;
}
function combatPanel(p,i){
 return`<section class="cb-panel" data-eq-panel data-combat-panel data-i="${i}"><div class="eq-intro"><b>Combate</b><span>Armas do equipamento, chances por nível de sucesso e controle de munição.</span></div><div data-combat-body>${combatInner(p)}</div></section>`;
}

/* ---------------- Recursos (Crédito) ---------------- */
const creditEra=p=>p.creditEra||(window.CthEquipment.yearOf(p)>=1980?'modern':'classic');
const creditNow=p=>Math.max(0,Math.min(99,Math.floor(+get(p,'s:Nível de Crédito')||0)));
const resourcesSummary=p=>`Nível de Crédito ${creditNow(p)}% · ${creditLevelName(creditNow(p))}`;
function resourcesInner(p,i){
 const era=creditEra(p),L=creditLiving(creditNow(p),CREDIT_ERA_MULT[era]);
 return`<label class="res-era">Época <select data-credit-era data-i="${i}" aria-label="Época para os valores em dinheiro"><option value="classic"${era==='classic'?' selected':''}>Anos 1920 (valores do livro)</option><option value="modern"${era==='modern'?' selected':''}>Época atual (× ${CREDIT_ERA_MULT.modern})</option></select></label>
 <table class="res-table"><tbody><tr><th>Nível de vida</th><td>${esc(L.level)}</td></tr><tr><th>Gastos por dia</th><td>${fmtMoney(L.spend)}</td></tr><tr><th>Dinheiro em mãos</th><td>${fmtMoney(L.cash)}</td></tr><tr><th>Bens (patrimônio)</th><td>${fmtMoney(L.assets)}</td></tr></tbody></table>
 <small class="res-note">Tabela do livro derivada do Nível de Crédito. Gastos são o que o investigador gasta por dia sem se preocupar; Dinheiro é o que tem em mãos; Bens são o patrimônio total (imóveis, investimentos), não dinheiro vivo. Combine ajustes de época com o Guardião.</small>`;
}
function resourcesPanel(p,i){
 return`<details class="res-panel" data-res data-i="${i}"${p.ui&&p.ui.resOpen?' open':''}><summary>💰 Recursos <span data-res-sum>${esc(resourcesSummary(p))}</span></summary><div data-res-body>${resourcesInner(p,i)}</div></details>`;
}

/* atualiza os painéis quando a ficha muda (chamado por refresh()) */
function refreshExtras(p,el,i){
 const cb=el.querySelector('[data-combat-body]');if(cb)cb.innerHTML=combatInner(p);
 const rs=el.querySelector('[data-res-body]');
 if(rs&&!(rs.contains(document.activeElement))){rs.innerHTML=resourcesInner(p,i);const s=el.querySelector('[data-res-sum]');if(s)s.textContent=resourcesSummary(p)}
 if(typeof guideRefresh==='function')guideRefresh(p,el,i);
}
desk.addEventListener('change',e=>{
 const era=e.target.closest('[data-credit-era]');if(!era)return;
 const k=+era.closest('.win').dataset.i,p=cur[k];if(!p)return;
 p.creditEra=era.value==='modern'?'modern':'classic';p.edit=true;refresh(k);
});
desk.addEventListener('toggle',e=>{
 const d=e.target.closest&&e.target.closest('[data-res]');if(!d||e.target!==d)return;
 const p=cur[+d.dataset.i];if(p){p.ui=p.ui||{};p.ui.resOpen=d.open;persist()}
},true);
