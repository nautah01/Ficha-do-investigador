/* Cemitério dos investigadores — salvo no navegador (localStorage). API usada pelo index.html: Cemiterio.add / hover / over */
(()=>{
const KEY='cthulhu-cemiterio';let list=[];
try{list=JSON.parse(localStorage.getItem(KEY)||'[]')}catch{}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mk=h=>{const d=document.createElement('div');d.innerHTML=h.trim();return d.firstChild};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(list))}catch{alert('Não foi possível salvar: o armazenamento do navegador está cheio.')}};

const fab=mk('<button id="cemFab" title="Cemitério — arraste uma ficha até aqui" aria-label="Abrir cemitério" aria-expanded="false">💀</button>');
const win=mk(`<section class="cem" id="cem" hidden aria-label="Cemitério dos investigadores">
<header class="cem-bar" title="Arraste para mover"><span>Cemitério · investigadores perdidos</span><button class="cem-x" aria-label="Fechar cemitério">✕</button></header>
<div class="cem-list" id="cemList"></div>
<footer class="cem-foot">Arraste uma ficha até a caveira (ou até esta janela) para enterrá-la.</footer></section>`);
const dlg=mk(`<dialog class="cem-dlg" id="cemDlg"><form id="cemForm" autocomplete="off"><h4 id="cemDlgT">Enterrar investigador</h4>
<label>Nome<input name="nome" required maxlength="80"></label>
<label>Idade<input name="idade" maxlength="3" inputmode="numeric"></label>
<label>Causa da morte<input name="causa" required maxlength="120" placeholder="Ex.: devorado por algo nas catacumbas"></label>
<label>Última frase (opcional)<input name="frase" maxlength="120"></label>
<div class="cem-photo"><canvas id="cemCrop" width="156" height="192" aria-label="Enquadramento da foto"></canvas><div class="cem-photo-ctl"><label class="cem-file">Foto (opcional)<input id="cemFile" type="file" accept="image/*"></label><label id="cemZoomL" hidden>Zoom<input id="cemZoom" type="range" min="1" max="3" step="0.02" value="1"></label><small id="cemTip" hidden>Arraste a foto para enquadrar</small><button type="button" id="cemNoPhoto" hidden>Remover foto</button></div></div>
<div class="row"><button type="button" id="cemCancel">Cancelar</button><button type="submit" id="cemOk">Enterrar</button></div></form></dialog>`);
document.body.append(fab,win,dlg);
const listEl=win.querySelector('#cemList'),form=dlg.querySelector('form'),cv=dlg.querySelector('#cemCrop'),cx=cv.getContext('2d');
let cur=null,done=null,ed={img:null,orig:'',z:1,x:0,y:0};

function render(){
 listEl.innerHTML=list.length?list.map(r=>`<article class="stone" data-id="${r.id}">
 <div class="stone-photo">${r.foto?`<img alt="Foto de ${esc(r.nome)}" src="${r.foto}">`:'<span>✝</span>'}</div>
 <h3>${esc(r.nome)}</h3><p class="stone-age">${r.idade!==''?esc(r.idade)+' anos':'&nbsp;'}</p>
 <p class="stone-cause">${esc(r.causa)}</p>${r.frase?`<blockquote>“${esc(r.frase)}”</blockquote>`:''}
 <div class="stone-act"><button data-a="edit">Editar</button><button data-a="del">Remover</button></div></article>`).join('')
 :'<p class="cem-empty">Nenhum investigador morreu… ainda.<br>Arraste uma ficha até a caveira.</p>';
}
function paint(c,w,h,s){ /* desenha a foto enquadrada (x,y em fração do quadro) */
 c.clearRect(0,0,w,h);const im=ed.img;
 if(!im){c.fillStyle='#6d6e67';c.fillRect(0,0,w,h);c.fillStyle='#d3d4cb';c.font=(w*.32)+'px serif';c.textAlign='center';c.textBaseline='middle';c.fillText('✝',w/2,h/2);return}
 const k=Math.max(w/im.width,h/im.height)*ed.z,iw=im.width*k,ih=im.height*k;
 c.drawImage(im,w/2+ed.x*w-iw/2,h/2+ed.y*h-ih/2,iw,ih);
}
function limit(){const im=ed.img;if(!im)return;const k=Math.max(156/im.width,192/im.height)*ed.z;
 ed.x=Math.max(-(im.width*k-156)/2/156,Math.min((im.width*k-156)/2/156,ed.x));ed.y=Math.max(-(im.height*k-192)/2/192,Math.min((im.height*k-192)/2/192,ed.y))}
function redraw(){limit();paint(cx,156,192)}
function setPhoto(src,p){
 ed={img:null,orig:src||'',z:p&&p.z||1,x:p&&p.x||0,y:p&&p.y||0};
 for(const i of['#cemZoomL','#cemTip','#cemNoPhoto'])dlg.querySelector(i).hidden=!src;
 dlg.querySelector('#cemZoom').value=ed.z;paint(cx,156,192);
 if(src){const im=new Image();im.onload=()=>{ed.img=im;redraw()};im.src=src}
}
dlg.querySelector('#cemZoom').oninput=e=>{ed.z=+e.target.value;redraw()};
cv.addEventListener('wheel',e=>{if(!ed.img)return;e.preventDefault();ed.z=Math.min(3,Math.max(1,ed.z-e.deltaY*.002));dlg.querySelector('#cemZoom').value=ed.z;redraw()},{passive:false});
let drag=null;
cv.addEventListener('pointerdown',e=>{if(!ed.img)return;cv.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,ox:ed.x,oy:ed.y}});
cv.addEventListener('pointermove',e=>{if(!drag)return;const r=cv.getBoundingClientRect();ed.x=drag.ox+(e.clientX-drag.x)/r.width;ed.y=drag.oy+(e.clientY-drag.y)/r.height;redraw()});
cv.addEventListener('pointerup',()=>drag=null);cv.addEventListener('pointercancel',()=>drag=null);
function openDlg(rec,isNew,cb){
 cur={rec,isNew};done=cb||null;
 dlg.querySelector('#cemDlgT').textContent=isNew?'Enterrar investigador':'Editar lápide';
 dlg.querySelector('#cemOk').textContent=isNew?'Enterrar':'Salvar';
 for(const k of['nome','idade','causa','frase'])form.elements[k].value=rec[k]??'';
 setPhoto(rec.orig||rec.foto||'',{z:rec.fz,x:rec.fx,y:rec.fy});dlg.showModal();form.elements[isNew?'causa':'nome'].focus();
}
async function shrink(f){
 const b=await createImageBitmap(f),k=Math.min(1,480/Math.max(b.width,b.height)),c=document.createElement('canvas');
 c.width=Math.round(b.width*k);c.height=Math.round(b.height*k);c.getContext('2d').drawImage(b,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.85);
}
dlg.querySelector('#cemFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(f)try{setPhoto(await shrink(f))}catch{alert('Não foi possível abrir essa imagem.')}};
dlg.querySelector('#cemNoPhoto').onclick=()=>setPhoto('');
dlg.querySelector('#cemCancel').onclick=()=>dlg.close();
form.onsubmit=e=>{
 e.preventDefault();const f=form.elements,r=cur.rec;
 Object.assign(r,{nome:f.nome.value.trim(),idade:f.idade.value.trim(),causa:f.causa.value.trim(),frase:f.frase.value.trim()});
 if(ed.img){const o=document.createElement('canvas');o.width=234;o.height=288;paint(o.getContext('2d'),234,288);Object.assign(r,{foto:o.toDataURL('image/jpeg',.88),orig:ed.orig,fz:ed.z,fx:ed.x,fy:ed.y})}else Object.assign(r,{foto:'',orig:''});
 if(cur.isNew)list.unshift(r);save();render();dlg.close();
 if(cur.isNew){setOpen(true);if(done)done()}
};
listEl.onclick=e=>{
 const b=e.target.closest('button'),id=b&&b.closest('.stone').dataset.id,r=list.find(x=>x.id===id);if(!r)return;
 if(b.dataset.a==='edit')openDlg(r,false);
 else if(confirm('Remover '+r.nome+' do cemitério? Isso não dá para desfazer.')){list=list.filter(x=>x!==r);save();render()}
};

function setOpen(o){win.hidden=!o;fab.setAttribute('aria-expanded',o)}
fab.onclick=()=>setOpen(win.hidden);
win.querySelector('.cem-x').onclick=()=>setOpen(false);
const bar=win.querySelector('.cem-bar');
bar.addEventListener('pointerdown',e=>{
 if(e.target.closest('button')||document.body.classList.contains('mobile'))return;
 const r=win.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top;bar.setPointerCapture(e.pointerId);
 bar.onpointermove=m=>{win.style.left=Math.max(0,Math.min(innerWidth-80,m.clientX-dx))+'px';win.style.top=Math.max(0,Math.min(innerHeight-40,m.clientY-dy))+'px';win.style.bottom='auto'};
 bar.onpointerup=()=>{bar.onpointermove=bar.onpointerup=null};
});

const inside=(n,x,y)=>{const r=n.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom};
const over=(x,y)=>inside(fab,x,y)||(!win.hidden&&inside(win,x,y));
window.Cemiterio={
 add(p,cb){openDlg({id:Math.random().toString(36).slice(2,10),nome:p.nome||'',idade:p.idade??'',causa:'',frase:'',foto:''},true,cb)},
 over,
 hover(x,y,on){fab.classList.toggle('call',!!on);const h=!!on&&over(x,y);fab.classList.toggle('hot',h);win.classList.toggle('hot',h)}
};
render();
})();
