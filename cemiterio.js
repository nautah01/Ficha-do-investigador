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
<footer class="cem-foot"><span>Arraste uma ficha até a caveira para enterrá-la.</span><button id="cemPng" title="Baixar o cemitério como imagem">Salvar imagem</button><button id="cemPdf" title="Baixar o cemitério como PDF">Salvar PDF</button></footer></section>`);
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
 <div class="stone-grass" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><b>✦</b><b>✦</b></div>
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
const ask=o=>window.askConfirm?askConfirm(o):Promise.resolve(confirm(o.title));
listEl.onclick=async e=>{
 const b=e.target.closest('button'),id=b&&b.closest('.stone').dataset.id,r=list.find(x=>x.id===id);if(!r)return;
 if(b.dataset.a==='edit')openDlg(r,false);
 else if(await ask({title:'Remover do cemitério?',html:'<strong>'+esc(r.nome)+'</strong> será removido do cemitério e isso não dá para desfazer.',ok:'🗑 Remover'})){list=list.filter(x=>x!==r);save();render()}
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
 open:o=>setOpen(o),
 add(p,cb){openDlg({id:Math.random().toString(36).slice(2,10),nome:p.nome||'',idade:p.idade??'',causa:'',frase:'',foto:''},true,cb)},
 over,
 hover(x,y,on){fab.classList.toggle('call',!!on);const h=!!on&&over(x,y);fab.classList.toggle('hot',h);win.classList.toggle('hot',h)}
};
/* ---------- salvar o cemitério como imagem / PDF ---------- */
const FONT='"Palatino Linotype",Palatino,Georgia,serif';
function wrap(c,t,w,max){const out=[];let line='';for(const word of String(t).split(/\s+/)){const test=line?line+' '+word:word;if(c.measureText(test).width>w&&line){out.push(line);line=word}else line=test}if(line)out.push(line);if(out.length>max){out.length=max;out[max-1]=out[max-1].replace(/.{0,2}$/,'…')}return out}
async function draw(){
 const imgs=await Promise.all(list.map(r=>r.foto?new Promise(ok=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>ok(null);i.src=r.foto}):null));
 const S=2,CW=260,G=40,P=50,cols=Math.min(4,list.length),m=document.createElement('canvas').getContext('2d');
 const W=Math.max(640,2*P+cols*CW+(cols-1)*G),x0=(W-(cols*CW+(cols-1)*G))/2;
 const cards=list.map((r,i)=>{
  m.font='600 20px '+FONT;const nameL=wrap(m,r.nome,CW-50,2);
  m.font='15px '+FONT;const causeL=wrap(m,r.causa,CW-50,4);
  m.font='italic 14px '+FONT;const quoteL=r.frase?wrap(m,'“'+r.frase+'”',CW-56,4):[];
  return{r,img:imgs[i],nameL,causeL,quoteL,h:47+118+28+nameL.length*24+8+20+8+causeL.length*20+(quoteL.length?22+quoteL.length*19:0)+40};
 });
 const rows=[];for(let i=0;i<cards.length;i+=cols)rows.push(cards.slice(i,i+cols));
 const H=P+110+rows.reduce((s,r)=>s+Math.max(...r.map(c=>c.h))+G,0)+P-G/2;
 const cv=document.createElement('canvas');cv.width=W*S;cv.height=H*S;const c=cv.getContext('2d');c.scale(S,S);
 const bg=c.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#0a1514');bg.addColorStop(1,'#1a2f2c');c.fillStyle=bg;c.fillRect(0,0,W,H);
 c.textAlign='center';c.textBaseline='alphabetic';c.fillStyle='#d8c58a';c.font='600 38px '+FONT;c.fillText('Cemitério dos Investigadores',W/2,P+34);
 c.fillStyle='#a89a74';c.font='italic 16px '+FONT;c.fillText(list.length+(list.length===1?' investigador perdido':' investigadores perdidos'),W/2,P+62);
 let y=P+110;
 for(const row of rows){
  const rh=Math.max(...row.map(k=>k.h));
  row.forEach((k,ci)=>{
   const x=x0+ci*(CW+G),h=rh,cx0=x+CW/2;
   c.fillStyle='#17271c';c.beginPath();c.ellipse(cx0,y+h,CW/2+12,13,0,0,7);c.fill();
   c.fillStyle='#47613a';c.beginPath();c.ellipse(cx0,y+h-3,CW/2+7,9,0,0,7);c.fill();
   const blades=[[-.42,18,-5],[-.31,12,5],[-.18,21,-7],[-.04,14,6],[.12,20,-5],[.27,13,7],[.39,19,-6]];
   blades.forEach(([dx,ht,lean],bi)=>{c.beginPath();c.moveTo(cx0+dx*CW,y+h+3);c.quadraticCurveTo(cx0+dx*CW+lean,y+h-ht*.48,cx0+dx*CW+lean*1.5,y+h-ht);c.strokeStyle=['#607746','#405b34','#73834b','#354e30'][bi%4];c.lineWidth=2.3;c.lineCap='round';c.stroke()});
   c.fillStyle='#c4ad70';c.font='8px Georgia,serif';c.fillText('✦',cx0-CW*.26,y+h-9);c.fillStyle='#b5bd8c';c.fillText('✦',cx0+CW*.29,y+h-6);
   const g=c.createLinearGradient(x,y,x+CW*.4,y+h);g.addColorStop(0,'#c3c4bb');g.addColorStop(.55,'#9a9b92');g.addColorStop(1,'#7d7e76');
   c.fillStyle=g;c.beginPath();c.moveTo(x,y+h);c.lineTo(x,y+110);c.ellipse(cx0,y+110,CW/2,110,0,Math.PI,0);c.lineTo(x+CW,y+h);c.closePath();c.fill();
   c.strokeStyle='rgba(241,235,209,.42)';c.lineWidth=2;c.stroke();
   c.save();c.strokeStyle='rgba(48,53,46,.22)';c.lineWidth=1;
   c.beginPath();c.moveTo(x+9,y+h-8);c.lineTo(x+9,y+112);c.ellipse(cx0,y+112,CW/2-9,101,0,Math.PI,0);c.lineTo(x+CW-9,y+h-8);c.stroke();c.restore();
   c.fillStyle='rgba(61,65,56,.58)';c.font='17px Georgia,serif';c.textBaseline='middle';c.fillText('✝',cx0,y+20);c.textBaseline='alphabetic';
   c.fillStyle='rgba(61,65,56,.58)';c.font='600 8px '+FONT;c.fillText('M E M O R I A',cx0,y+39);
   const py=y+47+59;c.save();c.beginPath();c.ellipse(cx0,py,48,59,0,0,7);c.clip();
   if(k.img){c.filter='grayscale(.9) sepia(.25)';c.drawImage(k.img,cx0-48,py-59,96,118);c.filter='none'}else{c.fillStyle='#6d6e67';c.fillRect(cx0-48,py-59,96,118);c.fillStyle='#d3d4cb';c.font='40px serif';c.textBaseline='middle';c.fillText('✝',cx0,py);c.textBaseline='alphabetic'}
   c.restore();c.beginPath();c.ellipse(cx0,py,48,59,0,0,7);c.lineWidth=4;c.strokeStyle='#c9b36a';c.stroke();
   let ty=y+47+118+34;c.fillStyle='#2b2c28';c.font='600 20px '+FONT;
   k.nameL.forEach(l=>{c.fillText(l,cx0,ty);ty+=24});
   ty+=-2;c.font='15px '+FONT;c.fillStyle='#3d3e39';c.fillText(k.r.idade!==''?k.r.idade+' anos':'',cx0,ty);ty+=28;
   c.fillStyle='#2b2c28';k.causeL.forEach(l=>{c.fillText(l,cx0,ty);ty+=20});
   if(k.quoteL.length){ty+=2;c.strokeStyle='rgba(43,44,40,.3)';c.lineWidth=1;c.beginPath();c.moveTo(cx0-50,ty);c.lineTo(cx0+50,ty);c.stroke();ty+=20;c.font='italic 14px '+FONT;c.fillStyle='#363731';k.quoteL.forEach(l=>{c.fillText(l,cx0,ty);ty+=19})}
  });
  y+=rh+G;
 }
 return{cv,W,H};
}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
function loadJsPdf(){return window.jspdf?Promise.resolve():new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
async function exportCem(kind,btn){
 if(!list.length){alert('Ainda não há investigadores no cemitério.');return}
 const t=btn.textContent;btn.disabled=true;btn.textContent='Gerando…';
 try{
  const {cv,W,H}=await draw();
  if(kind==='png')cv.toBlob(b=>download(b,'cemiterio-investigadores.png'),'image/png');
  else{await loadJsPdf();const {jsPDF}=window.jspdf,pdf=new jsPDF({unit:'px',format:[W,H],orientation:W>H?'l':'p',hotfixes:['px_scaling']});
   pdf.addImage(cv.toDataURL('image/jpeg',.92),'JPEG',0,0,W,H);download(pdf.output('blob'),'cemiterio-investigadores.pdf')}
 }catch{alert(kind==='pdf'?'Não foi possível gerar o PDF (a biblioteca precisa de internet). Tente salvar como imagem.':'Não foi possível gerar a imagem.')}
 btn.disabled=false;btn.textContent=t;
}
win.querySelector('#cemPng').onclick=e=>exportCem('png',e.currentTarget);
win.querySelector('#cemPdf').onclick=e=>exportCem('pdf',e.currentTarget);
render();
})();
