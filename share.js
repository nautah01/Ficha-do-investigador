/* Compartilhar fichas e Mesa do Guardião.
   - Jogador: baixa a ficha como arquivo (.json, leva retrato e equipamento) ou copia um link (dados dentro da URL, sem imagens).
   - Qualquer pessoa: importa arquivos ou links; tudo passa por sanitizeSheet() antes de entrar.
   - Guardião: a Mesa guarda cópias das fichas recebidas neste navegador, mostra PV/SAN/PM/Sorte e rola testes de grupo. */
const SHARE_APP='ficha-do-investigador';
const slug=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase()||'investigador';
const newShareId=()=>'s-'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);

/* cópia da ficha pronta para sair do navegador (sem posição de janela nem estado de tela) */
function sheetForShare(p,light){
 const c=JSON.parse(JSON.stringify(p));
 delete c.ui;delete c.pinned;delete c.guide;
 if(light){
  delete c.portrait;
  if(Array.isArray(c.equipment))c.equipment=c.equipment.map(it=>{const o={...it};delete o.img;delete o.imgPaths;delete o.imgSrc;delete o.imgI;return o});
 }
 return c;
}
const wrapSheets=list=>({app:SHARE_APP,kind:list.length===1?'sheet':'sheets',version:1,exportedAt:new Date().toISOString(),...(list.length===1?{sheet:list[0]}:{sheets:list})});
function downloadText(name,text,type='application/json'){
 const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type}));
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function downloadSheet(p){
 if(!p.shareId){p.shareId=newShareId();persist()}
 downloadText(`${slug(p.nome||p.occ)}.ficha.json`,JSON.stringify(wrapSheets([sheetForShare(p,false)])));
}

/* ---------- link: JSON → (deflate) → base64url dentro do hash ---------- */
const b64u={
 enc(bytes){let s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')},
 dec(str){str=str.replace(/-/g,'+').replace(/_/g,'/');const s=atob(str.padEnd(Math.ceil(str.length/4)*4,'=')),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b}
};
async function streamBytes(stream,limit){
 const r=stream.getReader(),parts=[];let n=0;
 for(;;){const{done,value}=await r.read();if(done)break;n+=value.length;if(n>limit){try{r.cancel()}catch(_){}throw new Error('Dados grandes demais.')}parts.push(value)}
 const out=new Uint8Array(n);let o=0;for(const x of parts){out.set(x,o);o+=x.length}return out;
}
async function packLink(obj){
 let bytes=new TextEncoder().encode(JSON.stringify(obj)),tag='j';
 if(window.CompressionStream){const cs=new CompressionStream('deflate-raw'),w=cs.writable.getWriter();w.write(bytes);w.close();bytes=await streamBytes(cs.readable,5e6);tag='z'}
 return tag+b64u.enc(bytes);
}
async function unpackLink(code){
 code=String(code||'').trim();const tag=code[0];let bytes=b64u.dec(code.slice(1));
 if(tag==='z'){if(!window.DecompressionStream)throw new Error('Este navegador não abre links comprimidos.');const ds=new DecompressionStream('deflate-raw'),w=ds.writable.getWriter();w.write(bytes);w.close();bytes=await streamBytes(ds.readable,2e6)}
 else if(tag!=='j')throw new Error('Link inválido.');
 return JSON.parse(new TextDecoder().decode(bytes));
}
async function sheetLink(p){
 const code=await packLink(wrapSheets([sheetForShare(p,true)]));
 return location.href.split('#')[0]+'#ficha='+code;
}

/* ---------- leitura de arquivo, texto ou link ---------- */
function sheetsFromData(data){
 let raw=[];
 if(data&&data.kind==='sheet'&&data.sheet)raw=[data.sheet];
 else if(data&&Array.isArray(data.sheets))raw=data.sheets;
 else if(data&&data.c&&data.sk)raw=[data];
 else if(data&&Array.isArray(data.cur))raw=data.cur; /* estado completo exportado */
 return raw.slice(0,50).map(sanitizeSheet).filter(Boolean);
}
async function sheetsFromText(text){
 text=String(text||'').trim();if(!text)throw new Error('Nada para importar.');
 const m=text.match(/#ficha=([A-Za-z0-9_\-]+)/)||(/^[jz][A-Za-z0-9_\-]{20,}$/.test(text)?[0,text]:null);
 const data=m?await unpackLink(m[1]):JSON.parse(text);
 const list=sheetsFromData(data);
 if(!list.length)throw new Error('Não encontrei nenhuma ficha válida nesse conteúdo.');
 return list;
}
function addSheetsToDesk(list){
 list.forEach((p,k)=>{delete p.shareId;p.pinned=true;p.edit=true;placeNew(p,k,cur);cur.push(p)});
 draw();
 const el=winEl(cur.length-1);if(el&&el.scrollIntoView)el.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});
}

/* ---------- janela "compartilhar esta ficha" ---------- */
desk.addEventListener('click',async e=>{
 const b=e.target.closest('.shb');if(!b)return;
 const k=+b.dataset.i,p=cur[k];if(!p)return;
 const m=wzModal(`<h4>Enviar ${esc(p.nome||'esta ficha')}</h4><p class="wz-help">Para jogar online, mande ao Guardião o <b>arquivo</b> (leva retrato e equipamento) ou um <b>link</b> (mais prático, mas sem imagens). O Guardião abre tudo na Mesa do Guardião.</p><div class="sh-opts"><button type="button" data-sh="file">⬇ Baixar arquivo da ficha (.json)</button><button type="button" data-sh="link">🔗 Copiar link</button></div><p class="sh-msg" role="status" aria-live="polite"></p><div class="row"><button type="button" class="alt" data-sh="close">Fechar</button></div>`,'wz-dlg');
 const msg=t=>{m.box.querySelector('.sh-msg').textContent=t};
 m.box.addEventListener('click',async ev=>{
  const a=ev.target.closest('[data-sh]');if(!a)return;
  if(a.dataset.sh==='close')m.close(null);
  else if(a.dataset.sh==='file'){downloadSheet(p);msg('Arquivo baixado.')}
  else if(a.dataset.sh==='link'){
   try{
    const url=await sheetLink(p);
    try{await navigator.clipboard.writeText(url)}catch(_){const t=document.createElement('textarea');t.value=url;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}
    msg(url.length>8000?`Link copiado (${url.length} caracteres: longo; alguns apps de mensagem cortam links grandes. Prefira o arquivo).`:'Link copiado. O retrato e as imagens dos itens não vão no link.');
   }catch(err){msg('Não foi possível gerar o link: '+err.message)}
  }
 });
});

/* ---------- janela "importar ficha" ---------- */
function openImport(target){
 const toMesa=target==='mesa';
 const m=wzModal(`<h4>${toMesa?'Adicionar à Mesa do Guardião':'Importar ficha'}</h4><p class="wz-help">Escolha arquivo(s) de ficha (.json) ou cole um link/código de ficha.</p><label class="wz-field">Arquivo(s)<input type="file" accept=".json,application/json" multiple data-im="files"></label><label class="wz-field">Ou cole um link ou o conteúdo<textarea class="in" rows="3" data-im="text" placeholder="https://…#ficha=…"></textarea></label><p class="sh-msg" role="status" aria-live="polite"></p><div class="row"><button type="button" class="alt" data-im="cancel">Cancelar</button><button type="button" data-im="go">Importar</button></div>`,'wz-dlg');
 const msg=t=>{m.box.querySelector('.sh-msg').textContent=t};
 m.box.addEventListener('click',async e=>{
  const b=e.target.closest('[data-im]');if(!b)return;
  if(b.dataset.im==='cancel'){m.close(null);return}
  if(b.dataset.im!=='go')return;
  try{
   const files=[...m.box.querySelector('[data-im="files"]').files],text=m.box.querySelector('[data-im="text"]').value;
   let list=[];
   for(const f of files){if(f.size>25e6)throw new Error(`${f.name}: arquivo grande demais.`);list.push(...await sheetsFromText(await f.text()))}
   if(text.trim())list.push(...await sheetsFromText(text));
   if(!list.length)throw new Error('Escolha um arquivo ou cole um link.');
   if(toMesa)await mesaAdd(list);else addSheetsToDesk(list);
   m.close(list.length);
  }catch(err){msg('⚠ '+(err&&err.message||'Não foi possível importar.'))}
 });
 return m.promise;
}
document.getElementById('impSheet')?.addEventListener('click',()=>openImport('desk'));

/* ---------- link na barra de endereço ---------- */
window.addEventListener('ficha:ready',async()=>{
 const m=location.hash.match(/^#ficha=([A-Za-z0-9_\-]+)/);if(!m)return;
 history.replaceState(null,'',location.pathname+location.search);
 try{
  const list=await sheetsFromText('#ficha='+m[1]),names=list.map(p=>esc(p.nome||p.occ||'Investigador')).join(', ');
  const r=await askChoice({title:'Ficha recebida por link',html:`Este link traz: <strong>${names}</strong>. O que fazer?`,choices:[{v:'desk',label:'Adicionar à minha mesa',primary:true},{v:'mesa',label:'Guardar na Mesa do Guardião'},{v:'no',label:'Ignorar'}]});
  if(r==='desk')addSheetsToDesk(list);else if(r==='mesa'){await mesaAdd(list);openMesa()}
 }catch(err){askChoice({title:'Link inválido',html:esc(err.message||'Não foi possível ler a ficha deste link.'),choices:[{v:'ok',label:'Ok',primary:true}]})}
});

/* ===================== Mesa do Guardião ===================== */
let mesa={v:1,list:[]};
async function mesaLoad(){try{const d=await FichaStore.kvGet('mesa');if(d&&Array.isArray(d.list))mesa={v:1,list:d.list.map(x=>({id:String(x.id||newShareId()),t:+x.t||0,sheet:sanitizeSheet(x.sheet)})).filter(x=>x.sheet)}}catch(_){}}
let mesaSaveT=0;const mesaSave=()=>{clearTimeout(mesaSaveT);mesaSaveT=setTimeout(()=>{FichaStore.kvSet('mesa',mesa).catch(err=>console.warn('Mesa não salva:',err))},300)};
async function mesaAdd(list){
 await mesaLoad();
 for(const s of list){
  const id=s.shareId||newShareId(),c=sheetForShare(s,false);c.shareId=id;
  const at=mesa.list.findIndex(x=>x.id===id);
  if(at>=0)mesa.list[at]={id,t:Date.now(),sheet:c};else mesa.list.push({id,t:Date.now(),sheet:c});
 }
 await FichaStore.kvSet('mesa',mesa);
}
const skillOfSheet=(s,name)=>{const v=get(s,'s:'+name);return v===undefined||v===null||v===''?null:(+v||0)};
function mesaSkillNames(){
 const names=new Set([...Object.keys(BASE),...Object.keys(EXTRA)]);
 mesa.list.forEach(x=>Object.keys(x.sheet.sk||{}).forEach(n=>names.add(n)));
 return[...names].sort((a,b)=>a.localeCompare(b,'pt'));
}
function mesaHtml(testSkill,rolls){
 const rows=mesa.list.map(x=>{const s=x.sheet,d=s.der||{};
  const num=(f,v)=>`<input class="in ms-num" type="number" min="0" max="999" value="${+v||0}" data-ms-f="${f}" data-ms-id="${esc(x.id)}" aria-label="${f} de ${esc(s.nome||'investigador')}">`;
  return`<tr><th scope="row" data-label="Investigador"><b>${esc(s.nome||'Sem nome')}</b><small>${esc(s.occ||'')}${s.idade?' · '+esc(s.idade)+' anos':''}</small></th><td data-label="PV">${num('hp',d.hp)}</td><td data-label="SAN">${num('san',d.san)}<small>máx ${sanMaxOf(s)}</small></td><td data-label="PM">${num('pm',d.pm)}</td><td data-label="Sorte">${num('luck',d.luck)}</td><td data-label="Esquivar">${skillOfSheet(s,'Esquivar')??'—'}</td><td data-label="BD / Corpo">${esc(d.db??'0')} / ${esc(d.corpo??0)}</td><td data-label="" class="ms-acts"><button type="button" class="alt" data-ms="open" data-ms-id="${esc(x.id)}" title="Copiar esta ficha para a sua mesa">Abrir</button><button type="button" class="alt danger" data-ms="del" data-ms-id="${esc(x.id)}" aria-label="Remover ${esc(s.nome||'investigador')} da Mesa">🗑</button></td></tr>`}).join('');
 let test='';
 if(testSkill){
  const trs=mesa.list.map(x=>{const v=skillOfSheet(x.sheet,testSkill),c=v==null?null:chancesOf(v),r=rolls&&rolls[x.id];
   return`<tr><th scope="row" data-label="Investigador">${esc(x.sheet.nome||'Sem nome')}</th><td data-label="Valor">${c?c.n+'%':'—'}</td><td data-label="Difícil">${c?c.h+'%':'—'}</td><td data-label="Extremo">${c?c.e+'%':'—'}</td><td data-label="d100">${r?`<b>${r.roll}</b>`:''}</td><td data-label="Resultado">${r?`<span class="ms-res ${r.level}">${ROLL_LABEL[r.level]}</span>`:''}</td></tr>`}).join('');
  test=`<table class="ms-table ms-test"><thead><tr><th>Investigador</th><th>Valor</th><th>Difícil</th><th>Extremo</th><th>d100</th><th>Resultado</th></tr></thead><tbody>${trs}</tbody></table>`;
 }
 return`<div class="ms-wrap">${mesa.list.length?`<table class="ms-table"><thead><tr><th>Investigador</th><th>PV</th><th>SAN</th><th>PM</th><th>Sorte</th><th>Esquivar</th><th>BD / Corpo</th><th></th></tr></thead><tbody>${rows}</tbody></table>`:'<p class="wz-empty">A Mesa está vazia. Peça aos jogadores o arquivo ou o link da ficha (botão 📤 Enviar) e use “Adicionar fichas”.</p>'}</div>
 <h5 class="ms-sub">Teste de grupo</h5><div class="ms-testbar"><label>Perícia<input class="in" list="msSkills" data-ms-skill placeholder="Ex.: Encontrar" value="${esc(testSkill||'')}"></label><datalist id="msSkills">${mesaSkillNames().map(n=>`<option value="${esc(n)}">`).join('')}</datalist><button type="button" data-ms="roll" ${mesa.list.length?'':'disabled'}>🎲 Rolar d100 para todos</button></div>${test}`;
}
async function openMesa(){
 await mesaLoad();
 const m=wzModal(`<h4>🕯️ Mesa do Guardião</h4><p class="wz-help">Fichas recebidas dos jogadores, guardadas só neste navegador. Os números de PV, SAN, PM e Sorte podem ser ajustados aqui durante a sessão.</p><div class="ms-toolbar"><button type="button" data-ms="add">📥 Adicionar fichas</button></div><div data-ms-body></div><div class="row"><button type="button" class="alt" data-ms="close">Fechar</button></div>`,'wz-dlg ms-dlg');
 let skill='',rolls=null;
 const body=m.box.querySelector('[data-ms-body]');
 const paint=()=>{body.innerHTML=mesaHtml(skill,rolls)};paint();
 body.addEventListener('input',e=>{
  const f=e.target.closest('[data-ms-f]');
  if(f){const x=mesa.list.find(y=>y.id===f.dataset.msId);if(x){x.sheet.der[f.dataset.msF]=Math.max(0,Math.min(999,Math.floor(+f.value||0)));mesaSave()}}
 });
 body.addEventListener('change',e=>{const s=e.target.closest('[data-ms-skill]');if(s){skill=s.value.trim();rolls=null;paint();const n=body.querySelector('[data-ms-skill]');n&&n.focus()}});
 m.box.addEventListener('click',async e=>{
  const b=e.target.closest('[data-ms]');if(!b)return;const a=b.dataset.ms;
  if(a==='close'){m.close(null);return}
  if(a==='add'){const n=await openImport('mesa');if(n){await mesaLoad();paint()}return}
  if(a==='roll'){
   const sk=body.querySelector('[data-ms-skill]').value.trim();if(!sk)return;skill=sk;rolls={};
   mesa.list.forEach(x=>{const v=skillOfSheet(x.sheet,skill);if(v==null)return;const roll=1+Math.floor(Math.random()*100);rolls[x.id]={roll,level:rollLevel(roll,v)}});
   paint();return;
  }
  const id=b.dataset.msId,x=mesa.list.find(y=>y.id===id);if(!x)return;
  if(a==='open'){const c=JSON.parse(JSON.stringify(x.sheet));addSheetsToDesk([c]);m.close(null)}
  else if(a==='del'){const ok=await askConfirm({title:'Remover da Mesa?',html:`<strong>${esc(x.sheet.nome||'Investigador')}</strong> sai da Mesa do Guardião (a ficha original do jogador não é afetada).`,ok:'Remover'});if(ok){mesa.list=mesa.list.filter(y=>y.id!==id);await FichaStore.kvSet('mesa',mesa);paint()}}
 });
}
document.getElementById('gmTable')?.addEventListener('click',openMesa);
