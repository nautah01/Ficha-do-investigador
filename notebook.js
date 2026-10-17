/* Bloco de notas v2: vários quadros de pistas + livro de anotações (diário). Tudo salvo no navegador (IndexedDB). */
(()=>{
const $=id=>document.getElementById(id);
const win=$('note'),vp=$('noteViewport'),board=$('noteBoard'),cards=$('noteCards'),svg=$('noteLines'),ink=$('noteInk'),ctx=ink.getContext('2d'),
 empty=$('noteEmpty'),hint=$('noteHint'),status=$('noteStatus'),btn=$('notesFab'),diary=$('diary');
const W=2400,H=1600;
const HINTS={move:'Arraste o fundo para mover · Shift+arrastar seleciona várias peças · roda do mouse = zoom',select:'Selecionar: arraste no fundo para marcar várias peças ou toque nelas para somar',brush:'Pincel ativo: desenhe sobre o quadro',connect:'Interligar: toque na peça de origem e depois na de destino (a seta aponta para o destino)'};
const ask=o=>window.askConfirm?askConfirm(o):Promise.resolve(confirm(o.title));
const uid=()=>Math.random().toString(36).slice(2,9),clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),rnd=n=>(Math.random()*2-1)*n,say=t=>status.textContent=t;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
let DB,B,ready=false,mode='move',sel=new Set(),selLink=-1,pick=null,z=1,eraser=false,stroke=null,timer;
let view={x:20,y:20,k:1},tgt=null,anim=0,hist=[],hi=-1,needFit=false;
const get=id=>B.items.find(i=>i.id===id),el=it=>cards.querySelector(`[data-id="${it.id}"]`);
const on=(id,fn)=>$(id).addEventListener('click',e=>{if(ready)fn(e)});

/* ---------- salvamento ---------- */
const db=new Promise((ok,no)=>{try{const r=indexedDB.open('cthulhu-notas',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}catch(e){no(e)}});
const dbGet=()=>db.then(d=>new Promise((ok,no)=>{const q=d.transaction('kv').objectStore('kv').get('board');q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)}));
const dbSet=v=>db.then(d=>new Promise((ok,no)=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,'board');t.oncomplete=ok;t.onerror=()=>no(t.error)}));
function save(){if(!ready)return;clearTimeout(timer);say('Salvando…');timer=setTimeout(()=>{B.view={...view};dbSet(DB).then(()=>say('Salvo neste navegador'),()=>say('Não foi possível salvar'))},400)}
const newBoard=n=>({id:uid(),name:n,items:[],links:[],ink:''});
const newEntry=(t,x)=>({id:uid(),title:t||'',text:x||'',date:Date.now(),pin:false});
function migrate(v){ /* aceita o formato antigo (um quadro + texto) e o novo */
 if(v&&v.boards&&v.boards.length){v.diary=v.diary||{entries:[],cur:''};return v}
 const b=newBoard('Quadro 1');
 if(v&&v.items){b.items=v.items;b.links=(v.links||[]).map(l=>Array.isArray(l)?{a:l[0],b:l[1],d:'n'}:l);b.ink=v.ink||''}
 return{v:2,boards:[b],cur:b.id,diary:{entries:v&&v.book?[newEntry('Anotações antigas',v.book)]:[],cur:''}};
}

/* ---------- histórico (desfazer / refazer) ---------- */
const snapshot=()=>({items:B.items.map(i=>({...i})),links:B.links.map(l=>({...l})),ink:B.ink});
function commit(){hist=hist.slice(0,hi+1);hist.push(snapshot());if(hist.length>60)hist.shift();hi=hist.length-1;refresh();save()}
function restore(s){B.items=s.items.map(i=>({...i}));B.links=s.links.map(l=>({...l}));B.ink=s.ink;sel=new Set();selLink=-1;pick=null;renderAll();save()}
const undo=()=>{if(hi>0){hi--;restore(hist[hi])}},redo=()=>{if(hi<hist.length-1){hi++;restore(hist[hi])}};

/* ---------- peças ---------- */
function place(e,it){const s=e.style;s.left=it.x+'px';s.top=it.y+'px';s.width=it.w+'px';s.zIndex=it.z;s.setProperty('--r',it.r+'deg');if(it.type==='txt')s.height=it.h+'px'}
function mk(it,isNew){
 const e=document.createElement('div');e.className='nc '+it.type+(isNew?' new':'');e.dataset.id=it.id;
 if(it.type==='img'){
  e.innerHTML='<img alt="Foto do quadro" draggable="false"><input class="cap" maxlength="40" placeholder="Legenda" aria-label="Legenda da foto">';
  const im=e.firstChild,cp=e.lastChild;im.src=it.src;im.onload=drawLinks;cp.value=it.cap||'';cp.oninput=()=>{it.cap=cp.value;save()};cp.onchange=commit;
 }else{
  e.innerHTML='<i class="tape"></i><textarea aria-label="Texto da nota" placeholder="Escreva aqui…"></textarea>';
  const t=e.lastChild;t.value=it.text||'';t.oninput=()=>{it.text=t.value;save()};t.onchange=commit;
 }
 e.insertAdjacentHTML('beforeend','<b class="rz" title="Redimensionar"></b>');place(e,it);cards.appendChild(e);return e;
}
const center=()=>({x:(vp.clientWidth/2-view.x)/view.k,y:(vp.clientHeight/2-view.y)/view.k});
function add(it,focus){
 const c=center();Object.assign(it,{id:uid(),x:clamp(c.x-it.w/2+rnd(70),10,W-it.w-10),y:clamp(c.y-90+rnd(50),10,H-250),r:+rnd(5).toFixed(1),z:++z});
 B.items.push(it);const e=mk(it,true);sel=new Set([it.id]);selLink=-1;empty.hidden=true;commit();if(focus)e.querySelector('textarea').focus();
}
function renderAll(){cards.innerHTML='';B.items.forEach(i=>mk(i));empty.hidden=B.items.length>0;loadInk();refresh()}
function loadInk(){ctx.clearRect(0,0,W,H);if(B.ink){const im=new Image(),id=B.id;im.onload=()=>{if(B.id===id)ctx.drawImage(im,0,0)};im.src=B.ink}}
function refresh(){
 cards.querySelectorAll('.nc').forEach(e=>{const s=sel.has(e.dataset.id);e.classList.toggle('sel',s);e.classList.toggle('one',s&&sel.size===1);e.classList.toggle('pick',!!pick&&pick.id===e.dataset.id)});
 drawLinks();
 $('noteDelete').disabled=!sel.size&&selLink<0;$('noteDup').disabled=!sel.size;$('noteDir').disabled=selLink<0;
 $('noteSelectionActions').hidden=!sel.size&&selLink<0;
 $('noteUndo').disabled=hi<1;$('noteRedo').disabled=hi>=hist.length-1;
 $('noteSelInfo').textContent=sel.size>1?sel.size+' peças selecionadas':'';
}
function del(){
 if(selLink>=0)B.links.splice(selLink,1);
 else if(sel.size){B.items.filter(i=>sel.has(i.id)).forEach(i=>el(i)?.remove());B.items=B.items.filter(i=>!sel.has(i.id));B.links=B.links.filter(l=>!sel.has(l.a)&&!sel.has(l.b))}
 else return;
 sel=new Set();selLink=-1;empty.hidden=B.items.length>0;commit();
}
function dup(){
 const src=B.items.filter(i=>sel.has(i.id));if(!src.length)return;const map={},out=[];
 src.forEach(i=>{const n={...i,id:uid(),x:clamp(i.x+32,0,W-60),y:clamp(i.y+32,0,H-60),z:++z};map[i.id]=n.id;out.push(n)});
 B.links.filter(l=>map[l.a]&&map[l.b]).forEach(l=>B.links.push({a:map[l.a],b:map[l.b],d:l.d}));
 out.forEach(n=>{B.items.push(n);mk(n,true)});sel=new Set(out.map(n=>n.id));selLink=-1;commit();
}

/* ---------- linhas direcionais ---------- */
const box=it=>{const e=el(it),h=e?e.offsetHeight:it.h||150;return{cx:it.x+it.w/2,cy:it.y+h/2,hw:it.w/2+4,hh:h/2+4}};
const edge=(b,tx,ty)=>{const dx=tx-b.cx,dy=ty-b.cy;if(!dx&&!dy)return[b.cx,b.cy];const s=1/Math.max(Math.abs(dx)/b.hw,Math.abs(dy)/b.hh);return[b.cx+dx*s,b.cy+dy*s]};
const arrow=(f,t)=>{const a=Math.atan2(t[1]-f[1],t[0]-f[0]),c=Math.cos(a),s=Math.sin(a),p=(d,w)=>`${t[0]-c*d-s*w},${t[1]-s*d+c*w}`;return`<polygon class="head" points="${t[0]},${t[1]} ${p(20,9)} ${p(20,-9)}"/>`};
function drawLinks(){
 svg.innerHTML=B.links.map((l,i)=>{
  const a=get(l.a),b=get(l.b);if(!a||!b)return'';
  const A=box(a),Bx=box(b),P=edge(A,Bx.cx,Bx.cy),Q=edge(Bx,A.cx,A.cy),d=`x1="${P[0]}" y1="${P[1]}" x2="${Q[0]}" y2="${Q[1]}"`;
  const hp=l.d==='r'||l.d==='b',hq=l.d==='f'||l.d==='b';
  return`<g class="${i===selLink?'lsel':''}"><line class="yarn" ${d}/><line class="hit" data-i="${i}" ${d}/>${hq?arrow(P,Q):`<circle class="pin" cx="${Q[0]}" cy="${Q[1]}" r="5"/>`}${hp?arrow(Q,P):`<circle class="pin" cx="${P[0]}" cy="${P[1]}" r="5"/>`}</g>`}).join('');
}
svg.addEventListener('pointerdown',e=>{const i=e.target.dataset.i;if(i==null)return;sel=new Set();selLink=+i;refresh();vp.focus({preventScroll:true})});
const cycleDir=()=>{const l=B.links[selLink];if(!l)return;l.d={f:'r',r:'b',b:'n',n:'f'}[l.d]||'f';commit()};
svg.addEventListener('dblclick',e=>{if(e.target.dataset.i!=null)cycleDir()});
function connect(it){
 if(!pick){pick=it;return refresh()}
 if(pick.id!==it.id){const k=B.links.findIndex(l=>(l.a===pick.id&&l.b===it.id)||(l.a===it.id&&l.b===pick.id));
  if(k>=0)B.links.splice(k,1);else B.links.push({a:pick.id,b:it.id,d:'f'});pick=null;commit();return}
 pick=null;refresh();
}

/* ---------- mover / redimensionar (um ou vários) ---------- */
cards.addEventListener('pointerdown',e=>{
 const node=e.target.closest('.nc');if(!node||mode==='brush')return;
 const it=get(node.dataset.id);
 if(mode==='connect'){e.preventDefault();return connect(it)}
 if(e.shiftKey||e.ctrlKey||e.metaKey||mode==='select'){e.preventDefault();sel.has(it.id)?sel.delete(it.id):sel.add(it.id);selLink=-1;return refresh()}
 if(!sel.has(it.id)){sel=new Set([it.id]);selLink=-1;refresh()}
 if(e.target.matches('textarea,input'))return;
 e.preventDefault();vp.focus({preventScroll:true});
 const rz=e.target.classList.contains('rz')&&sel.size===1,sx=e.clientX,sy=e.clientY,grp=rz?[it]:B.items.filter(i=>sel.has(i.id)),org=new Map(grp.map(i=>[i.id,{x:i.x,y:i.y,w:i.w,h:i.h}]));
 grp.forEach(i=>{i.z=++z;el(i).style.zIndex=z});node.setPointerCapture(e.pointerId);let moved=false;
 node.onpointermove=m=>{const dx=(m.clientX-sx)/view.k,dy=(m.clientY-sy)/view.k;if(Math.abs(dx)+Math.abs(dy)>2)moved=true;
  for(const i of grp){const o=org.get(i.id);
   if(rz){i.w=clamp(o.w+dx,100,900);if(i.type==='txt')i.h=clamp(o.h+dy,70,700)}else{i.x=clamp(o.x+dx,0,W-60);i.y=clamp(o.y+dy,0,H-60)}
   place(el(i),i)}
  drawLinks()};
 node.onpointerup=node.onpointercancel=()=>{node.onpointermove=node.onpointerup=node.onpointercancel=null;if(moved)commit()};
});

/* ---------- imagens ---------- */
async function shrink(f){
 const bmp=await createImageBitmap(f),k=Math.min(1,900/Math.max(bmp.width,bmp.height)),c=document.createElement('canvas');
 c.width=Math.round(bmp.width*k);c.height=Math.round(bmp.height*k);const g=c.getContext('2d');
 g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(bmp,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.85);
}
async function addImgs(files){for(const f of files){if(!/^image\//.test(f.type))continue;try{add({type:'img',src:await shrink(f),w:240,cap:''})}catch{say('Não foi possível abrir essa imagem')}}}
on('noteAdd',()=>$('noteFiles').click());
$('noteFiles').onchange=e=>{if(ready)addImgs([...e.target.files]);e.target.value=''};
on('noteAddText',()=>add({type:'txt',w:220,h:150,text:''},true));
async function exportBoard(){
 const button=$('noteExport'),oldLabel=button.textContent;let host;
 button.disabled=true;button.textContent='Preparando…';say('Preparando imagem do quadro…');
 try{
  if(!window.html2canvas){
   await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';script.onload=resolve;script.onerror=()=>reject(new Error('Não foi possível carregar a biblioteca de exportação'));document.head.appendChild(script)});
  }
  const copy=board.cloneNode(true);
  copy.style.transform='none';copy.style.position='relative';copy.style.left='0';copy.style.top='0';copy.style.width=W+'px';copy.style.height=H+'px';
  copy.style.backgroundColor='#a46d4c';copy.style.backgroundImage='radial-gradient(ellipse at 48% 42%,rgba(233,185,136,.22),transparent 72%),radial-gradient(rgba(75,37,23,.2) .7px,transparent 1px),radial-gradient(rgba(239,195,149,.12) .65px,transparent 1px)';copy.style.backgroundSize='100% 100%,9px 9px,13px 13px';
  [copy,...copy.querySelectorAll('*')].forEach(node=>{node.style.setProperty('box-shadow','none','important');node.style.setProperty('filter','none','important');node.style.setProperty('text-shadow','none','important')});
  copy.querySelectorAll('.nc').forEach(card=>{card.classList.remove('sel','one','pick','new');card.querySelector('.rz')?.remove()});
  copy.querySelectorAll('.lsel').forEach(line=>line.classList.remove('lsel'));
  const sourceControls=board.querySelectorAll('textarea,input'),copyControls=copy.querySelectorAll('textarea,input');
  sourceControls.forEach((control,index)=>{if(copyControls[index])copyControls[index].value=control.value});
  const sourceCanvases=board.querySelectorAll('canvas'),copyCanvases=copy.querySelectorAll('canvas');
  sourceCanvases.forEach((canvas,index)=>{const target=copyCanvases[index];if(!target)return;target.width=canvas.width;target.height=canvas.height;target.getContext('2d').drawImage(canvas,0,0)});
  host=document.createElement('div');host.style.cssText=`position:absolute;left:0;top:0;width:${W}px;height:${H}px;overflow:visible;z-index:-1;pointer-events:none`;
  host.appendChild(copy);document.body.appendChild(host);
  const photoPins=[...copy.querySelectorAll('.nc.img')].map(card=>({x:parseFloat(card.style.left)||0,y:parseFloat(card.style.top)||0,w:card.offsetWidth,h:card.offsetHeight,r:parseFloat(card.style.getPropertyValue('--r'))||0}));
  const boardImage=await window.html2canvas(copy,{width:W,height:H,scale:1.5,windowWidth:Math.max(innerWidth,W),windowHeight:Math.max(innerHeight,H),scrollX:0,scrollY:0,backgroundColor:null,useCORS:true});
  const scale=1.5,frame=64,finished=document.createElement('canvas');finished.width=(W+frame*2)*scale;finished.height=(H+frame*2)*scale;
  const paint=finished.getContext('2d');paint.scale(scale,scale);
  const totalW=W+frame*2,totalH=H+frame*2;
  paint.fillStyle='#21140e';paint.fillRect(0,0,totalW,totalH);
  const rail=(x,y,w,h,vertical=false)=>{const g=paint.createLinearGradient(vertical?x:x,y,vertical?x+w:x,vertical?y:y+h);g.addColorStop(0,'#4a2a1a');g.addColorStop(.16,'#795034');g.addColorStop(.48,'#986744');g.addColorStop(.78,'#70472f');g.addColorStop(1,'#3a2116');paint.fillStyle=g;paint.fillRect(x,y,w,h)};
  rail(12,12,totalW-24,48);rail(12,H+frame,totalW-24,48);rail(12,60,48,H,true);rail(W+frame,60,48,H,true);
  const grain=(horizontal,y0,y1)=>{paint.save();paint.beginPath();if(horizontal){paint.rect(12,y0,totalW-24,y1-y0)}else{paint.rect(y0,60,y1-y0,H)}paint.clip();for(let i=0;i<22;i++){const pos=horizontal?y0+4+(i*17)%(y1-y0-5):y0+4+(i*13)%(y1-y0-5);paint.beginPath();if(horizontal){paint.moveTo(14,pos);paint.bezierCurveTo(totalW*.28,pos+(i%3-1)*3,totalW*.66,pos+(i%4-2)*2,totalW-14,pos+(i%2?2:-2))}else{paint.moveTo(pos,62);paint.bezierCurveTo(pos+(i%3-1)*2,H*.35,pos+(i%4-2)*3,H*.68,pos+(i%2?2:-2),H+frame-2)}paint.strokeStyle=i%3?'rgba(35,18,11,.2)':'rgba(239,194,145,.17)';paint.lineWidth=i%4===0?2:1;paint.stroke()}paint.restore()};
  grain(true,12,60);grain(true,H+frame,totalH-12);grain(false,12,60);grain(false,W+frame,totalW-12);
  paint.strokeStyle='rgba(20,12,8,.9)';paint.lineWidth=3;paint.strokeRect(8,8,totalW-16,totalH-16);paint.strokeStyle='rgba(225,182,128,.55)';paint.lineWidth=2;paint.strokeRect(54,54,W+20,H+20);
  paint.drawImage(boardImage,frame,frame,W,H);
  paint.strokeStyle='rgba(35,19,12,.8)';paint.lineWidth=5;paint.strokeRect(frame,frame,W,H);paint.strokeStyle='rgba(238,199,148,.42)';paint.lineWidth=1;paint.strokeRect(frame+5,frame+5,W-10,H-10);
  photoPins.forEach(pin=>{const angle=pin.r*Math.PI/180;paint.save();paint.translate(frame+pin.x+pin.w/2,frame+pin.y+pin.h/2);paint.rotate(angle);const y=-pin.h/2+12;paint.beginPath();paint.arc(0,y,7,0,Math.PI*2);paint.fillStyle='#321812';paint.fill();paint.beginPath();paint.arc(0,y,5.5,0,Math.PI*2);paint.fillStyle='#9d2920';paint.fill();paint.beginPath();paint.arc(-1.5,y-1.7,1.5,0,Math.PI*2);paint.fillStyle='rgba(255,225,190,.75)';paint.fill();paint.restore()});
  const blob=await new Promise((resolve,reject)=>finished.toBlob(value=>value?resolve(value):reject(new Error('Não foi possível criar o arquivo PNG')),'image/png'));
  const url=URL.createObjectURL(blob),link=document.createElement('a'),name=(B.name||'quadro-de-pistas').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()||'quadro-de-pistas';
  link.href=url;link.download=`${name}.png`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);say('Imagem PNG baixada');
 }catch(error){console.error('Falha ao exportar o quadro de pistas:',error);say('Não foi possível exportar. Verifique a conexão e tente novamente.');}
 finally{host?.remove();button.disabled=false;button.textContent=oldLabel}
}
on('noteExport',exportBoard);
vp.addEventListener('dragover',e=>e.preventDefault());
vp.addEventListener('drop',e=>{e.preventDefault();if(ready)addImgs([...e.dataTransfer.files])});
document.addEventListener('paste',e=>{if(!ready||win.hidden||$('noteBoardPanel').hidden||e.target.matches('textarea,input'))return;const f=[...(e.clipboardData?.files||[])];if(f.length){e.preventDefault();addImgs(f)}});

/* ---------- modos e pincel ---------- */
function setMode(m){
 mode=mode===m?'move':m;pick=null;board.dataset.mode=mode;hint.textContent=HINTS[mode];
 $('noteSelect').setAttribute('aria-pressed',mode==='select');$('noteBrush').setAttribute('aria-pressed',mode==='brush'&&!eraser);
 $('noteEraser').setAttribute('aria-pressed',mode==='brush'&&eraser);$('noteConnect').setAttribute('aria-pressed',mode==='connect');refresh();
}
on('noteSelect',()=>setMode('select'));on('noteConnect',()=>setMode('connect'));
on('noteBrush',()=>{const off=mode==='brush'&&!eraser;eraser=false;mode='move';setMode(off?'move':'brush')});
on('noteEraser',()=>{const off=mode==='brush'&&eraser;eraser=true;mode='move';if(off){eraser=false;setMode('move')}else setMode('brush')});
const pt=e=>{const r=ink.getBoundingClientRect();return{x:(e.clientX-r.left)/view.k,y:(e.clientY-r.top)/view.k}};
ink.addEventListener('pointerdown',e=>{
 if(mode!=='brush'||!ready)return;ink.setPointerCapture(e.pointerId);const p=pt(e);
 ctx.globalCompositeOperation=eraser?'destination-out':'source-over';ctx.strokeStyle=$('noteBrushColor').value;ctx.lineWidth=+$('noteBrushSize').value*(eraser?2:1);ctx.lineCap=ctx.lineJoin='round';
 ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+.01,p.y);ctx.stroke();stroke=p;
});
ink.addEventListener('pointermove',e=>{if(!stroke)return;const p=pt(e);ctx.beginPath();ctx.moveTo(stroke.x,stroke.y);ctx.lineTo(p.x,p.y);ctx.stroke();stroke=p});
ink.addEventListener('pointerup',()=>{if(stroke){stroke=null;B.ink=ink.toDataURL();commit()}});
ink.addEventListener('pointercancel',()=>{stroke=null});

/* ---------- botões de edição ---------- */
on('noteDelete',del);on('noteDup',dup);on('noteDir',cycleDir);on('noteUndo',undo);on('noteRedo',redo);
on('noteClear',async()=>{
 if(!await ask({title:'Limpar o quadro?',html:'Fotos, textos, ligações e desenhos <strong>deste quadro</strong> serão apagados. Os outros quadros e o livro de anotações não são afetados. Dá para desfazer logo em seguida.',ok:'🧹 Limpar quadro'}))return;
 B.items=[];B.links=[];B.ink='';sel=new Set();selLink=-1;pick=null;renderAll();commit();
});
vp.addEventListener('keydown',e=>{
 if(e.target.matches('textarea,input'))return;const k=e.key.toLowerCase(),c=e.ctrlKey||e.metaKey;
 if(k==='delete'||k==='backspace'){e.preventDefault();del()}
 else if(c&&k==='d'){e.preventDefault();dup()}
 else if(c&&k==='a'){e.preventDefault();sel=new Set(B.items.map(i=>i.id));selLink=-1;refresh()}
 else if(c&&k==='z'){e.preventDefault();e.shiftKey?redo():undo()}
 else if(c&&k==='y'){e.preventDefault();redo()}
 else if(k==='escape'){sel=new Set();selLink=-1;pick=null;refresh()}
});

/* ---------- mover, zoom suave e seleção por área ---------- */
const lim=(v,size,len,k)=>{const lo=len-size*k-120,hi=120;return clamp(v,Math.min(lo,hi),Math.max(lo,hi))};
const fix=v=>({k:v.k,x:lim(v.x,W,vp.clientWidth,v.k),y:lim(v.y,H,vp.clientHeight,v.k)});
function applyView(){view=fix(view);board.style.transform=`translate(${view.x}px,${view.y}px) scale(${view.k})`;$('noteZoomVal').textContent=Math.round(view.k*100)+'%'}
function goView(t,instant){tgt=fix(t);if(instant){view={...tgt};tgt=null;applyView();return}if(!anim)anim=requestAnimationFrame(step)}
function step(){anim=0;if(!tgt)return;const t=tgt,f=.2;view.x+=(t.x-view.x)*f;view.y+=(t.y-view.y)*f;view.k+=(t.k-view.k)*f;
 if(Math.abs(t.x-view.x)<.3&&Math.abs(t.y-view.y)<.3&&Math.abs(t.k-view.k)<.0008){view={...t};tgt=null}else anim=requestAnimationFrame(step);
 board.style.transform=`translate(${view.x}px,${view.y}px) scale(${view.k})`;$('noteZoomVal').textContent=Math.round(view.k*100)+'%'}
function zoomTo(cx,cy,k,instant){const c=tgt||view;k=clamp(k,.2,2.5);goView({k,x:cx-(cx-c.x)*k/c.k,y:cy-(cy-c.y)*k/c.k},instant)}
const zoomBtn=f=>zoomTo(vp.clientWidth/2,vp.clientHeight/2,(tgt||view).k*f);
function fit(instant){
 const w=vp.clientWidth,h=vp.clientHeight;if(!w)return;
 if(!B.items.length)return goView({x:20,y:20,k:1},instant);
 let x1=1e9,y1=1e9,x2=0,y2=0;B.items.forEach(i=>{const e=el(i);x1=Math.min(x1,i.x);y1=Math.min(y1,i.y);x2=Math.max(x2,i.x+i.w);y2=Math.max(y2,i.y+(e?e.offsetHeight:i.h||200))});
 const k=clamp(Math.min((w-80)/(x2-x1),(h-80)/(y2-y1)),.2,1);goView({k,x:(w-(x2-x1)*k)/2-x1*k,y:(h-(y2-y1)*k)/2-y1*k},instant);
}
$('noteZoomIn').onclick=()=>zoomBtn(1.3);$('noteZoomOut').onclick=()=>zoomBtn(1/1.3);$('noteFit').onclick=()=>fit();
vp.addEventListener('wheel',e=>{e.preventDefault();const r=vp.getBoundingClientRect(),c=tgt||view;zoomTo(e.clientX-r.left,e.clientY-r.top,c.k*Math.exp(-e.deltaY*(e.ctrlKey?.01:.0016)))},{passive:false});
const ptrs=new Map();let pan=null,pinch=0,marq=null;
const dist=()=>{const[a,b]=[...ptrs.values()];return Math.hypot(a[0]-b[0],a[1]-b[1])||1};
const toBoard=e=>{const r=vp.getBoundingClientRect();return{x:(e.clientX-r.left-view.x)/view.k,y:(e.clientY-r.top-view.y)/view.k}};
vp.addEventListener('pointerdown',e=>{
 if(e.target.closest('.note-zoom'))return;
 ptrs.set(e.pointerId,[e.clientX,e.clientY]);
 if(ptrs.size===2){pan=null;if(marq){marq.el.remove();marq=null}pinch=dist();return}
 if(mode==='brush'||!(e.target===vp||e.target===board))return;
 e.preventDefault();vp.focus({preventScroll:true});getSelection().removeAllRanges();tgt=null;
 if(mode==='select'||e.shiftKey){const p=toBoard(e),m=document.createElement('div');m.className='marq';board.appendChild(m);marq={x:p.x,y:p.y,el:m,base:e.shiftKey?new Set(sel):new Set()};vp.setPointerCapture(e.pointerId);return}
 sel=new Set();selLink=-1;pick=null;refresh();
 pan={x:e.clientX,y:e.clientY,vx:view.x,vy:view.y};vp.setPointerCapture(e.pointerId);vp.classList.add('grabbing');
});
vp.addEventListener('pointermove',e=>{
 if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,[e.clientX,e.clientY]);
 if(ptrs.size===2&&pinch){const d=dist(),r=vp.getBoundingClientRect(),[a,b]=[...ptrs.values()];tgt=null;zoomTo((a[0]+b[0])/2-r.left,(a[1]+b[1])/2-r.top,view.k*d/pinch,true);pinch=d}
 else if(marq){const p=toBoard(e),x=Math.min(marq.x,p.x),y=Math.min(marq.y,p.y),w=Math.abs(p.x-marq.x),h=Math.abs(p.y-marq.y),s=marq.el.style;
  s.left=x+'px';s.top=y+'px';s.width=w+'px';s.height=h+'px';sel=new Set(marq.base);
  B.items.forEach(i=>{const e2=el(i),ih=e2?e2.offsetHeight:150;if(i.x<x+w&&i.x+i.w>x&&i.y<y+h&&i.y+ih>y)sel.add(i.id)});refresh()}
 else if(pan){view.x=pan.vx+e.clientX-pan.x;view.y=pan.vy+e.clientY-pan.y;applyView()}
});
const endPtr=e=>{ptrs.delete(e.pointerId);if(pan)save();pan=null;if(marq){marq.el.remove();marq=null}vp.classList.remove('grabbing');if(ptrs.size<2)pinch=0};
vp.addEventListener('pointerup',endPtr);vp.addEventListener('pointercancel',endPtr);
addEventListener('resize',()=>{if(ready)applyView()});

/* ---------- vários quadros ---------- */
function renderTabs(){
 $('boardTabs').innerHTML=DB.boards.map(b=>`<button type="button" role="tab" class="bt${b.id===B.id?' on':''}" data-id="${b.id}" aria-selected="${b.id===B.id}">${esc(b.name)}</button>`).join('');
 $('boardDel').disabled=DB.boards.length<2;
}
function openBoard(id,first){
 if(B)B.view={...view};
 B=DB.boards.find(b=>b.id===id)||DB.boards[0];DB.cur=B.id;sel=new Set();selLink=-1;pick=null;z=Math.max(1,...B.items.map(i=>i.z||0));
 hist=[snapshot()];hi=0;renderAll();renderTabs();tgt=null;view=B.view?{...B.view}:{x:20,y:20,k:1};
 if(vp.clientWidth){applyView();if(!B.view&&B.items.length)fit(true)}else needFit=true;
 if(!first)save();
}
$('boardTabs').addEventListener('click',e=>{const b=e.target.closest('.bt');if(b&&ready&&b.dataset.id!==B.id)openBoard(b.dataset.id)});
$('boardTabs').addEventListener('dblclick',e=>{if(e.target.closest('.bt.on'))rename()});
on('boardAdd',()=>{const n=newBoard('Quadro '+(DB.boards.length+1));DB.boards.push(n);openBoard(n.id);rename()});
on('boardRen',rename);
on('boardDel',async()=>{
 if(DB.boards.length<2)return;
 if(!await ask({title:'Excluir este quadro?',html:`O quadro <strong>${esc(B.name)}</strong> e tudo o que há nele serão apagados e isso não dá para desfazer.`,ok:'🗑 Excluir quadro'}))return;
 const i=DB.boards.indexOf(B);DB.boards.splice(i,1);B=null;openBoard(DB.boards[Math.max(0,i-1)].id);
});
function rename(){
 const t=$('boardTabs').querySelector('.on');if(!t)return;const inp=document.createElement('input');inp.className='bt-in';inp.value=B.name;inp.maxLength=30;inp.setAttribute('aria-label','Nome do quadro');t.replaceWith(inp);inp.focus();inp.select();
 let done=false;const fin=ok=>{if(done)return;done=true;if(ok&&inp.value.trim())B.name=inp.value.trim();renderTabs();save()};
 inp.onblur=()=>fin(true);inp.onkeydown=e=>{if(e.key==='Enter')fin(true);else if(e.key==='Escape')fin(false)};
}

/* ---------- livro de anotações (diário) ---------- */
const D=()=>DB.diary,entry=()=>D().entries.find(e=>e.id===D().cur);
const longDate=t=>new Date(t).toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'});
function renderIdx(){
 const q=norm($('diaSearch').value),L=[...D().entries].filter(e=>!q||norm(e.title+' '+e.text).includes(q)).sort((a,b)=>(b.pin?1:0)-(a.pin?1:0)||b.date-a.date);
 $('diaList').innerHTML=L.map(e=>`<li><button type="button" data-id="${e.id}" class="${e.id===D().cur?'on':''}"><span class="t">${e.pin?'🔖 ':''}${esc(e.title||'Sem título')}</span><i></i><span class="d">${new Date(e.date).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</span></button></li>`).join('')||'<li class="none">Nenhuma entrada encontrada.</li>';
 $('diaTotal').textContent=D().entries.length+(D().entries.length===1?' entrada':' entradas');
}
function showEntry(v2){
 const e=entry();if(!e)return;$('diaTitle').value=e.title;$('diaText').value=e.text;$('diaDate').textContent=longDate(e.date);
 $('diaPin').setAttribute('aria-pressed',e.pin);diary.classList.toggle('pinned',e.pin);words();renderIdx();if(v2)diary.dataset.view=v2;
}
const words=()=>{const n=($('diaText').value.trim().match(/\S+/g)||[]).length;$('diaCount').textContent=n+(n===1?' palavra':' palavras')};
function newDia(){const e=newEntry('','');D().entries.unshift(e);D().cur=e.id;$('diaSearch').value='';showEntry('page');$('diaTitle').focus();save()}
on('diaNew',newDia);
$('diaList').addEventListener('click',e=>{const b=e.target.closest('button');if(b){D().cur=b.dataset.id;showEntry('page');save()}});
$('diaSearch').addEventListener('input',renderIdx);
$('diaTitle').addEventListener('input',()=>{const e=entry();if(e){e.title=$('diaTitle').value;renderIdx();save()}});
$('diaText').addEventListener('input',()=>{const e=entry();if(e){e.text=$('diaText').value;words();save()}});
on('diaPin',()=>{const e=entry();if(e){e.pin=!e.pin;showEntry();save()}});
on('diaBack',()=>{diary.dataset.view='index'});
on('diaDel',async()=>{
 const e=entry();if(!e)return;
 if(!await ask({title:'Apagar esta entrada?',html:`<strong>${esc(e.title||'Sem título')}</strong> será apagada do livro e isso não dá para desfazer.`,ok:'🗑 Apagar entrada'}))return;
 D().entries=D().entries.filter(x=>x!==e);if(!D().entries.length)D().entries.push(newEntry('',''));D().cur=D().entries[0].id;showEntry('index');save();
});
new ResizeObserver(()=>diary.classList.toggle('narrow',diary.clientWidth<660)).observe(diary);

/* ---------- abas, janela e carregamento ---------- */
const tabs={noteBoardTab:'noteBoardPanel',noteTextTab:'noteTextPanel'};
Object.keys(tabs).forEach(t=>$(t).onclick=()=>{
 for(const k in tabs){const o=k===t;$(k).setAttribute('aria-selected',o);$(k).tabIndex=o?0:-1;$(tabs[k]).hidden=!o}
 if(t==='noteBoardTab'&&ready){applyView();if(needFit){needFit=false;if(!B.view&&B.items.length)fit(true)}}
 hint.style.visibility=t==='noteBoardTab'?'':'hidden';
});
function openN(o){win.hidden=!o;btn.setAttribute('aria-pressed',o);if(o&&ready&&needFit&&!$('noteBoardPanel').hidden){needFit=false;applyView();if(!B.view&&B.items.length)fit(true)}}
btn.onclick=()=>{openN(win.hidden);if(win.hidden===false)window.Notas?.tab('board')};$('noteX').onclick=()=>openN(false);$('noteMin').onclick=()=>win.classList.toggle('min');
const bar=win.querySelector('.note-bar');
bar.addEventListener('dblclick',e=>{if(!e.target.closest('button'))win.classList.toggle('min')});
bar.addEventListener('pointerdown',e=>{
 if(e.target.closest('button')||document.body.classList.contains('mobile'))return;
 const r=win.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top;bar.setPointerCapture(e.pointerId);
 bar.onpointermove=m=>{win.style.left=clamp(m.clientX-dx,0,innerWidth-80)+'px';win.style.top=clamp(m.clientY-dy,0,innerHeight-40)+'px'};
 bar.onpointerup=()=>{bar.onpointermove=bar.onpointerup=null};
});
Object.assign(win.style,{left:'24px',top:'80px',width:Math.min(1000,innerWidth-48)+'px',height:Math.min(660,innerHeight-110)+'px'});

const loaded=dbGet().then(v=>{
 DB=migrate(v);
 if(!D().entries.length)D().entries.push(newEntry('',''));
 if(!entry())D().cur=D().entries[0].id;
 openBoard(DB.cur,true);showEntry('page');ready=true;
 say(B.items.length?'Quadro carregado':'Quadro vazio');
}).catch(()=>say('Este navegador não permite salvar as notas'));
window.Notas={open:openN,tab:n=>$(n==='book'?'noteTextTab':'noteBoardTab').click(),async flush(){await loaded;if(!ready)throw new Error('As notas ainda não foram carregadas');clearTimeout(timer);B.view={...view};await dbSet(DB)}};
})();
