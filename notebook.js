/* Bloco de notas — quadro de pistas. Tudo salvo no navegador (IndexedDB), sem servidor. */
(()=>{
const $=id=>document.getElementById(id);
const win=$('note'),vp=$('noteViewport'),board=$('noteBoard'),cards=$('noteCards'),svg=$('noteLines'),
 ink=$('noteInk'),ctx=ink.getContext('2d'),empty=$('noteEmpty'),hint=$('noteHint'),status=$('noteStatus'),btn=$('notesBtn');
const W=2400,H=1600,HINTS={move:'Arraste para mover · canto vermelho para redimensionar · Delete exclui',
 brush:'Pincel ativo: desenhe sobre o quadro',connect:'Interligar: clique em duas peças para ligá-las com barbante'};
let S={items:[],links:[],ink:''},mode='move',sel=null,selLink=-1,pick=null,z=1,eraser=false,stroke=null,timer;
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
  x:clamp(vp.scrollLeft+vp.clientWidth/2-w/2+rnd(70),10,W-w-10),y:clamp(vp.scrollTop+vp.clientHeight/2-90+rnd(50),10,H-250),r:+rnd(5).toFixed(1),z:++z});
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
 node.onpointermove=m=>{const dx=m.clientX-sx,dy=m.clientY-sy;
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
const pt=e=>{const r=ink.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
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
$('noteClear').onclick=()=>{
 if(!confirm('Limpar o quadro? Fotos, textos, ligações e desenhos serão apagados e isso não dá para desfazer.'))return;
 S={items:[],links:[],ink:''};sel=null;selLink=-1;pick=null;cards.innerHTML='';ctx.clearRect(0,0,W,H);empty.hidden=false;refresh();save();
};
vp.addEventListener('pointerdown',e=>{if(e.target===vp||e.target===board){sel=null;selLink=-1;pick=null;refresh()}});

/* ---------- janela ---------- */
function openN(o){win.hidden=!o;btn.setAttribute('aria-pressed',o)}
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
 if(v&&v.items){S=v;S.links=S.links||[]}
 S.items.forEach(i=>{z=Math.max(z,i.z||0);mk(i)});empty.hidden=S.items.length>0;drawLinks();
 if(S.ink){const im=new Image();im.onload=()=>ctx.drawImage(im,0,0);im.src=S.ink}
 ['noteAdd','noteAddText','noteBrush','noteEraser','noteConnect','noteBrushColor','noteBrushSize','noteClear'].forEach(i=>$(i).disabled=false);
 say(S.items.length?'Quadro carregado':'Quadro vazio');
}).catch(()=>say('Este navegador não permite salvar as notas'));
})();
