/* Bloco de notas — quadro de pistas. Tudo salvo no navegador (IndexedDB), sem servidor. */
(()=>{
const $=id=>document.getElementById(id);
const win=$('note'),vp=$('noteViewport'),board=$('noteBoard'),cards=$('noteCards'),svg=$('noteLines'),
 ink=$('noteInk'),ctx=ink.getContext('2d'),empty=$('noteEmpty'),hint=$('noteHint'),status=$('noteStatus'),btn=$('notesBtn');
const W=2400,H=1600,HINTS={move:'Arraste o fundo para mover · roda do mouse para zoom · canto vermelho redimensiona · Delete exclui',
 pan:'Mover: arraste para percorrer o quadro · roda do mouse ou +/− para zoom',brush:'Pincel ativo: desenhe sobre o quadro',connect:'Interligar: clique em duas peças para ligá-las com barbante'};
let view={x:0,y:0,k:1},fitted=false,S={items:[],links:[],ink:'',book:''},mode='move',sel=null,selLink=-1,pick=null,z=1,eraser=false,stroke=null,timer;
const say=t=>status.textContent=t,clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),rnd=n=>(Math.random()*2-1)*n;
const get=id=>S.items.find(i=>i.id===id);

/* ---------- salvamento ---------- */
const db=new Promise((ok,no)=>{try{const r=indexedDB.open('cthulhu-notas',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}catch(e){no(e)}});
const dbGet=()=>db.then(d=>new Promise((ok,no)=>{const q=d.transaction('kv').objectStore('kv').get('board');q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)}));
const dbSet=v=>db.then(d=>new Promise((ok,no)=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,'board');t.oncomplete=ok;t.onerror=()=>no(t.error)}));
function save(){clearTimeout(timer);say('Salvando…');timer=setTimeout(()=>dbSet(S).then(()=>say('Salvo neste navegador'),()=>say('Não foi possível salvar')),400)}

/* ---------- peças ---------- */
function place(el,it){const s=el.style;s.left=it.x+'px';s.top=it.y+'px';s.width=it.w+'px';s.zIndex=it.z;s.setProperty('--r',it.r+'deg');if(it.type==='txt')s.height=it.h+'px'}
function mk(it,isNew){
 const el=document.createElement('div');el.className='nc '+it.type+(isNew?' new':'');el.dataset.id=it.id;
 if(it.type==='img'){
  el.innerHTML='<img alt="Foto do quadro" draggable="false"><input class="cap" maxlength="40" placeholder="Legenda" aria-label="Legenda da foto">';
  const im=el.firstChild,cp=el.lastChild;im.src=it.src;im.onload=drawLinks;cp.value=it.cap||'';cp.oninput=()=>{it.cap=cp.value;save()};
 }else{
  el.innerHTML='<i class="tape"></i><textarea aria-label="Texto da nota" placeholder="Escreva aqui…"></textarea>';
  const t=el.lastChild;t.value=it.text||'';t.oninput=()=>{it.text=t.value;save()};
 }
 el.insertAdjacentHTML('beforeend','<b class="rz" title="Redimensionar"></b>');
 place(el,it);cards.appendChild(el);return el;
}
function add(it,focus){
 const w=it.w;Object.assign(it,{id:Math.random().toString(36).slice(2,9),
  x:clamp((vp.clientWidth/2-view.x)/view.k-w/2+rnd(70),10,W-w-10),y:clamp((vp.clientHeight/2-view.y)/view.k-90+rnd(50),10,H-250),r:+rnd(5).toFixed(1),z:++z});
 S.items.push(it);const el=mk(it,true);select(it);empty.hidden=true;save();
 if(focus)el.querySelector('textarea').focus();
}
function el(it){return cards.querySelector(`[data-id="${it.id}"]`)}
function select(it){sel=it;selLink=-1;refresh()}
function refresh(){cards.querySelectorAll('.nc').forEach(e=>{e.classList.toggle('sel',!!sel&&e.dataset.id===sel.id);e.classList.toggle('pick',!!pick&&e.dataset.id===pick.id)});drawLinks();$('noteDelete').disabled=!sel&&selLink<0}

/* ---------- barbante ---------- */
function drawLinks(){
 const c=it=>{const e=el(it);return e?[it.x+e.offsetWidth/2,it.y+e.offsetHeight/2]:null};
 svg.innerHTML=S.links.map(([a,b],i)=>{
  const A=c(get(a)),B=c(get(b));if(!A||!B)return'';
  const d=`x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}"`;
  return`<g class="${i===selLink?'lsel':''}"><line class="yarn" ${d}/><line class="hit" data-i="${i}" ${d}/><circle class="pin" cx="${A[0]}" cy="${A[1]}" r="5"/><circle class="pin" cx="${B[0]}" cy="${B[1]}" r="5"/></g>`}).join('');
}
svg.addEventListener('pointerdown',e=>{const i=e.target.dataset.i;if(i==null)return;sel=null;selLink=+i;refresh();vp.focus()});
function connect(it){
 if(!pick){pick=it;return refresh()}
 if(pick.id!==it.id){const k=S.links.findIndex(l=>l.includes(pick.id)&&l.includes(it.id));
  if(k>=0)S.links.splice(k,1);else S.links.push([pick.id,it.id]);save()}
 pick=null;refresh();
}

/* ---------- mover / redimensionar ---------- */
cards.addEventListener('pointerdown',e=>{
 const node=e.target.closest('.nc');if(!node||mode==='brush')return;
 const it=get(node.dataset.id);
 if(mode==='connect'){e.preventDefault();return connect(it)}
 select(it);if(e.target.matches('textarea,input'))return;
 e.preventDefault();it.z=++z;node.style.zIndex=z;
 const rz=e.target.classList.contains('rz'),sx=e.clientX,sy=e.clientY,o={...it};node.setPointerCapture(e.pointerId);
 node.onpointermove=m=>{const dx=(m.clientX-sx)/view.k,dy=(m.clientY-sy)/view.k;
  if(rz){it.w=clamp(o.w+dx,100,900);if(it.type==='txt')it.h=clamp(o.h+dy,70,700)}
  else{it.x=clamp(o.x+dx,0,W-60);it.y=clamp(o.y+dy,0,H-60)}
  place(node,it);drawLinks()};
 node.onpointerup=node.onpointercancel=()=>{node.onpointermove=node.onpointerup=node.onpointercancel=null;save()};
});

/* ---------- imagens ---------- */
async function shrink(f){
 const bmp=await createImageBitmap(f),k=Math.min(1,900/Math.max(bmp.width,bmp.height)),c=document.createElement('canvas');
 c.width=Math.round(bmp.width*k);c.height=Math.round(bmp.height*k);const g=c.getContext('2d');
 g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(bmp,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.85);
}
async function addImgs(files){
 for(const f of files){if(!/^image\//.test(f.type))continue;
  try{add({type:'img',src:await shrink(f),w:240,cap:''})}catch{say('Não foi possível abrir essa imagem')}}
}
$('noteAdd').onclick=()=>$('noteFiles').click();
$('noteFiles').onchange=e=>{addImgs([...e.target.files]);e.target.value=''};
$('noteAddText').onclick=()=>add({type:'txt',w:220,h:150,text:''},true);
vp.addEventListener('dragover',e=>e.preventDefault());
vp.addEventListener('drop',e=>{e.preventDefault();addImgs([...e.dataTransfer.files])});
document.addEventListener('paste',e=>{if(win.hidden||e.target.matches('textarea,input'))return;const f=[...(e.clipboardData?.files||[])];if(f.length){e.preventDefault();addImgs(f)}});

/* ---------- pincel ---------- */
function setMode(m){
 mode=mode===m?'move':m;pick=null;board.dataset.mode=mode;hint.textContent=HINTS[mode];
 $('noteBrush').setAttribute('aria-pressed',mode==='brush'&&!eraser);$('noteEraser').setAttribute('aria-pressed',mode==='brush'&&eraser);
 $('noteConnect').setAttribute('aria-pressed',mode==='connect');refresh();
}
$('noteBrush').onclick=()=>{const off=mode==='brush'&&!eraser;eraser=false;mode='move';if(!off)setMode('brush');else setMode('move')};
$('noteEraser').onclick=()=>{const off=mode==='brush'&&eraser;eraser=true;mode='move';if(!off)setMode('brush');else{eraser=false;setMode('move')}};
$('noteConnect').onclick=()=>setMode('connect');
const pt=e=>{const r=ink.getBoundingClientRect();return{x:(e.clientX-r.left)/view.k,y:(e.clientY-r.top)/view.k}};
ink.addEventListener('pointerdown',e=>{
 if(mode!=='brush')return;ink.setPointerCapture(e.pointerId);const p=pt(e);
 ctx.globalCompositeOperation=eraser?'destination-out':'source-over';
 ctx.strokeStyle=$('noteBrushColor').value;ctx.lineWidth=+$('noteBrushSize').value*(eraser?2:1);ctx.lineCap=ctx.lineJoin='round';
 ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+.01,p.y);ctx.stroke();stroke=p;
});
ink.addEventListener('pointermove',e=>{if(!stroke)return;const p=pt(e);ctx.beginPath();ctx.moveTo(stroke.x,stroke.y);ctx.lineTo(p.x,p.y);ctx.stroke();stroke=p});
ink.addEventListener('pointerup',()=>{if(stroke){stroke=null;S.ink=ink.toDataURL();save()}});
ink.addEventListener('pointercancel',()=>{stroke=null});

/* ---------- excluir / limpar ---------- */
function del(){
 if(selLink>=0)S.links.splice(selLink,1);
 else if(sel){S.items=S.items.filter(i=>i!==sel);S.links=S.links.filter(l=>!l.includes(sel.id));el(sel)?.remove()}
 else return;
 sel=null;selLink=-1;empty.hidden=S.items.length>0;refresh();save();
}
$('noteDelete').onclick=del;
vp.addEventListener('keydown',e=>{if((e.key==='Delete'||e.key==='Backspace')&&!e.target.matches('textarea,input')){e.preventDefault();del()}});
const ask=o=>window.askConfirm?askConfirm(o):Promise.resolve(confirm(o.title));
$('noteClear').onclick=async()=>{
 if(!await ask({title:'Limpar o quadro?',html:'Fotos, textos, ligações e desenhos serão apagados e isso não dá para desfazer. O livro de anotações não é afetado.',ok:'🧹 Limpar quadro'}))return;
 S={items:[],links:[],ink:'',book:S.book};sel=null;selLink=-1;pick=null;cards.innerHTML='';ctx.clearRect(0,0,W,H);empty.hidden=false;refresh();save();
};
/* ---------- mover e zoom do quadro ---------- */
function applyView(){
 const w=vp.clientWidth,h=vp.clientHeight,lim=(v,size,len)=>{const lo=len-size*view.k-120,hi=120;return clamp(v,Math.min(lo,hi),Math.max(lo,hi))};
 view.x=lim(view.x,W,w);view.y=lim(view.y,H,h);
 board.style.transform=`translate(${view.x}px,${view.y}px) scale(${view.k})`;$('noteZoomVal').textContent=Math.round(view.k*100)+'%';
}
function zoomAt(cx,cy,k){k=clamp(k,.2,2.5);view.x=cx-(cx-view.x)*k/view.k;view.y=cy-(cy-view.y)*k/view.k;view.k=k;applyView()}
function zoomBtn(f){zoomAt(vp.clientWidth/2,vp.clientHeight/2,view.k*f)}
function fit(){
 const w=vp.clientWidth,h=vp.clientHeight;if(!w)return;
 if(!S.items.length){view={x:20,y:20,k:1};return applyView()}
 let x1=1e9,y1=1e9,x2=0,y2=0;
 S.items.forEach(i=>{const e=el(i);x1=Math.min(x1,i.x);y1=Math.min(y1,i.y);x2=Math.max(x2,i.x+i.w);y2=Math.max(y2,i.y+(e?e.offsetHeight:i.h||200))});
 const k=clamp(Math.min((w-80)/(x2-x1),(h-80)/(y2-y1)),.2,1);
 view={k,x:(w-(x2-x1)*k)/2-x1*k,y:(h-(y2-y1)*k)/2-y1*k};applyView();
}
$('noteZoomIn').onclick=()=>zoomBtn(1.25);$('noteZoomOut').onclick=()=>zoomBtn(.8);$('noteFit').onclick=fit;
vp.addEventListener('wheel',e=>{e.preventDefault();const r=vp.getBoundingClientRect();zoomAt(e.clientX-r.left,e.clientY-r.top,view.k*Math.exp(-e.deltaY*.0015))},{passive:false});
const ptrs=new Map();let pan=null,pinch=0;
const dist=()=>{const [a,b]=[...ptrs.values()];return Math.hypot(a[0]-b[0],a[1]-b[1])||1};
vp.addEventListener('pointerdown',e=>{
 if(e.target.closest('.note-zoom'))return;
 ptrs.set(e.pointerId,[e.clientX,e.clientY]);
 if(ptrs.size===2){pan=null;pinch=dist();return}
 if(mode==='brush'||!(e.target===vp||e.target===board||mode==='pan'))return;
 e.preventDefault();vp.focus({preventScroll:true});getSelection().removeAllRanges();
 if(mode!=='pan'){sel=null;selLink=-1;pick=null;refresh()}
 pan={x:e.clientX,y:e.clientY,vx:view.x,vy:view.y};vp.setPointerCapture(e.pointerId);vp.classList.add('grabbing');
});
vp.addEventListener('pointermove',e=>{
 if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,[e.clientX,e.clientY]);
 if(ptrs.size===2&&pinch){const d=dist(),r=vp.getBoundingClientRect(),[a,b]=[...ptrs.values()];zoomAt((a[0]+b[0])/2-r.left,(a[1]+b[1])/2-r.top,view.k*d/pinch);pinch=d}
 else if(pan){view.x=pan.vx+e.clientX-pan.x;view.y=pan.vy+e.clientY-pan.y;applyView()}
});
const endPtr=e=>{ptrs.delete(e.pointerId);pan=null;vp.classList.remove('grabbing');if(ptrs.size<2)pinch=0};
vp.addEventListener('pointerup',endPtr);vp.addEventListener('pointercancel',endPtr);
addEventListener('resize',applyView);

/* ---------- abas: quadro / livro de anotações ---------- */
const tabs={noteBoardTab:'noteBoardPanel',noteTextTab:'noteTextPanel'},book=$('noteTxt');
Object.keys(tabs).forEach(t=>$(t).onclick=()=>{
 for(const k in tabs){const on=k===t;$(k).setAttribute('aria-selected',on);$(k).tabIndex=on?0:-1;$(tabs[k]).hidden=!on}
 if(t==='noteBoardTab')applyView();else book.focus();
});
book.oninput=()=>{S.book=book.value;save()};

/* ---------- janela ---------- */
function openN(o){win.hidden=!o;btn.setAttribute('aria-pressed',o);if(o&&!fitted){fitted=true;fit()}}
btn.onclick=()=>openN(win.hidden);$('noteX').onclick=()=>openN(false);
$('noteMin').onclick=()=>win.classList.toggle('min');
const bar=win.querySelector('.note-bar');
bar.addEventListener('dblclick',e=>{if(!e.target.closest('button'))win.classList.toggle('min')});
bar.addEventListener('pointerdown',e=>{
 if(e.target.closest('button')||document.body.classList.contains('mobile'))return;
 const r=win.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top;bar.setPointerCapture(e.pointerId);
 bar.onpointermove=m=>{win.style.left=clamp(m.clientX-dx,0,innerWidth-80)+'px';win.style.top=clamp(m.clientY-dy,0,innerHeight-40)+'px'};
 bar.onpointerup=()=>{bar.onpointermove=bar.onpointerup=null};
});
Object.assign(win.style,{left:'24px',top:'80px',width:Math.min(960,innerWidth-48)+'px',height:Math.min(620,innerHeight-110)+'px'});

/* ---------- carregar ---------- */
dbGet().then(v=>{
 if(v&&v.items){S=v;S.links=S.links||[];S.book=S.book||''}book.value=S.book;book.readOnly=false;
 S.items.forEach(i=>{z=Math.max(z,i.z||0);mk(i)});empty.hidden=S.items.length>0;drawLinks();
 if(S.ink){const im=new Image();im.onload=()=>ctx.drawImage(im,0,0);im.src=S.ink}
 ['noteAdd','noteAddText','noteBrush','noteEraser','noteConnect','noteBrushColor','noteBrushSize','noteClear'].forEach(i=>$(i).disabled=false);
 say(S.items.length?'Quadro carregado':'Quadro vazio');
}).catch(()=>say('Este navegador não permite salvar as notas'));
})();
