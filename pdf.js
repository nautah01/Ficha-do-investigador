/* Exportação em PDF editável (pdf-lib local, via pdfkit.js). O layout é o mesmo do original; os valores viram campos de formulário com cálculo automático. */
function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)})}

/* ===== Campos editáveis e cálculo automático (formulário do PDF) =====
   Cada valor da ficha vira um campo de formulário. Metade/quinto, PV/PM/Mov/Bônus de Dano/Corpo e Sanidade máxima
   são campos calculados por JavaScript do próprio PDF: ao digitar um número, o resto é preenchido sozinho
   (Adobe Acrobat, Chrome, Edge e Firefox; leitores simples de celular mostram os valores gravados, sem recalcular). */
let PDF_PREFIX='f0_';
const PDF_JS_HEAD='var d=this;function n(f){var o=d.getField(f);if(!o)return 0;var x=parseInt(o.value,10);return isNaN(x)?0:x}function e(f){var o=d.getField(f);return !o||String(o.value)===""}';
const pdfQ=s=>JSON.stringify(String(s));
const pdfJs={
 halfFifth:src=>`${PDF_JS_HEAD}if(e(${pdfQ(src)})){event.value=""}else{var v=Math.max(0,n(${pdfQ(src)}));event.value=Math.floor(v/2)+" / "+Math.floor(v/5)}`,
 hp:(con,tam)=>`${PDF_JS_HEAD}event.value=(e(${pdfQ(con)})||e(${pdfQ(tam)}))?"":Math.floor((n(${pdfQ(con)})+n(${pdfQ(tam)}))/10)`,
 pm:pod=>`${PDF_JS_HEAD}event.value=e(${pdfQ(pod)})?"":Math.floor(n(${pdfQ(pod)})/5)`,
 mov:(f,t,dx)=>`${PDF_JS_HEAD}if(e(${pdfQ(f)})||e(${pdfQ(t)})||e(${pdfQ(dx)})){event.value=""}else{var F=n(${pdfQ(f)}),T=n(${pdfQ(t)}),D=n(${pdfQ(dx)});event.value=(F>T&&D>T)?9:(F<T&&D<T)?7:8}`,
 db:(f,t,corpo)=>`${PDF_JS_HEAD}if(e(${pdfQ(f)})||e(${pdfQ(t)})){event.value=""}else{var s=n(${pdfQ(f)})+n(${pdfQ(t)}),k=Math.floor((s-205)/80)+2;event.value=${corpo?'(s<65?-2:s<85?-1:s<125?0:s<165?1:s<205?2:k+1)':'(s<65?"-2":s<85?"-1":s<125?"0":s<165?"+1d4":s<205?"+1d6":"+"+k+"d6")'}}`,
 sanMax:mitos=>`${PDF_JS_HEAD}event.value=Math.max(0,99-${mitos?`Math.max(0,n(${pdfQ(mitos)}))`:'0'})`,
 /* campo "atual" (PV, PM, Sanidade): se estiver vazio, copia o valor inicial (PV/PM máx., Sanidade = POD); depois disso é livre para editar */
 fillMax:max=>`var o=this.getField(${pdfQ(max)});if(o&&String(event.value)===""&&String(o.value)!=="")event.value=o.value`
};
/* um campo de texto alinhado à linha de base do texto vizinho */
function pdfField(doc,o){
 const size=o.size||9,h=o.h||Math.ceil(size*1.35);
 doc.field({...o,size,h,y:o.baseline-size*0.92-(h-size*1.2)/2,color:o.color});
}
function pdfColors(){
 const css=getComputedStyle(document.documentElement),parse=(value,fallback)=>{
  const hex=value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if(hex){let h=hex[1];if(h.length===3)h=[...h].map(x=>x+x).join('');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
  const rgb=value.match(/^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:\s*[,/]\s*([\d.]+)%?)?\s*\)$/i);
  if(!rgb)return fallback;
  const a=rgb[4]===undefined?1:Math.min(1,+rgb[4]);return[+rgb[1],+rgb[2],+rgb[3]].map((n,i)=>Math.round(n*a+fallback[i]*(1-a)));
 };
 const bg=parse(css.getPropertyValue('--card').trim(),[13,30,28]);
 const get=(key,fallback)=>parse(css.getPropertyValue(key).trim(),fallback||bg);
 return{bg,text:get('--txt',[230,220,195]),muted:get('--muted',[159,176,163]),head:get('--head',[216,197,138]),gold:get('--gold',[168,139,74]),panel:get('--k5',[22,48,45]),line:get('--line',[168,139,74]),spine:get('--spine2',[143,35,35]),spineDark:get('--spine1',[90,20,20])};
}
function pdfFrame(doc,C){
 const W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight();
 doc.setFillColor(...C.bg);doc.rect(0,0,W,H,'F');
 doc.setDrawColor(...C.gold);doc.setLineWidth(.8);doc.roundedRect(22,22,W-44,H-44,4,4,'S');
 doc.setFillColor(...C.spineDark);doc.rect(22,22,9,H-44,'F');doc.setFillColor(...C.spine);doc.rect(25,22,5,H-44,'F');
}
function pdfText(doc,text,x,y,size,color,style='normal',align){
 doc.setFont('times',style);doc.setFontSize(size);doc.setTextColor(...color);doc.text(String(text??''),x,y,align?{align}:undefined);
}
function pdfCentered(doc,text,cx,y,size,color,style='normal'){
 doc.setFont('times',style);doc.setFontSize(size);const x=cx-doc.getTextWidth(String(text??''))/2;pdfText(doc,text,x,y,size,color,style);
}
function pdfWrapped(doc,text,x,y,width,size,lineHeight,color,style='normal'){
 doc.setFont('times',style);doc.setFontSize(size);doc.setTextColor(...color);
 const lines=doc.splitTextToSize(String(text??''),width);doc.text(lines,x,y,{lineHeightFactor:lineHeight/size});return y+Math.max(1,lines.length)*lineHeight;
}
function pdfSection(doc,title,y,C,right=560){
 pdfText(doc,title,39,y,10,C.head,'bold');doc.setDrawColor(...C.line);doc.setLineWidth(.45);doc.line(39,y+4,right,y+4);return y+16;
}
function pdfSkillColumns(doc,p,items,title,y,C,group,nameOf){
 if(!items.length)return y;
 const left=39,right=560,gap=14,colW=(right-left-gap*2)/3,bottom=804,valueW=64,nameW=colW-valueW-4;
 const startY=pdfSection(doc,title,y,C),room=bottom-startY-3;
 let font=6.6,lineH=7.5,rowGap=1.6,cols,heights;
 const layout=()=>{
  doc.setFont('times','normal');doc.setFontSize(font);cols=[[],[],[]];heights=[0,0,0];
  items.forEach((item,idx)=>{
   const lines=doc.splitTextToSize(String(item[0]),nameW),h=Math.max(lineH,lines.length*lineH)+rowGap;
   const col=heights.indexOf(Math.min(...heights));cols[col].push({item,idx,lines,h});heights[col]+=h;
  });
 };
 layout();
 while(Math.max(...heights)>room&&font>5.2){font=Math.max(5.2,font-.2);lineH=font+1;rowGap=1;layout()}
 cols.forEach((entries,col)=>{
  const x=left+col*(colW+gap);let yy=startY;
  entries.forEach(({item,idx,lines,h})=>{
   const [name,value]=item,fname=nameOf(group,idx);
   doc.setFont('times','normal');doc.setFontSize(font);doc.setTextColor(...C.text);doc.text(lines,x,yy,{lineHeightFactor:lineH/font});
   /* valor (editável) · % · metade / quinto (calculado) */
   const rx=x+colW,halfW=31,valW=19;
   pdfField(doc,{name:fname,x:rx-halfW-3-valW-4,w:valW,baseline:yy,size:font,align:'right',value:String(value),color:C.text,tip:`${name} (%)`});
   doc.setFont('times','bold');doc.setFontSize(font-.3);doc.setTextColor(...C.muted);doc.text('%',rx-halfW-4,yy);
   pdfField(doc,{name:fname+'_hf',x:rx-halfW,w:halfW,baseline:yy,size:font-.3,align:'right',readonly:true,value:`${value>>1} / ${Math.floor(value/5)}`,color:C.muted,tip:`${name}: metade / quinto`,calc:pdfJs.halfFifth(fname)});
   yy+=h;
  });
 });
 return startY+Math.max(...heights)+5;
}
async function pdfPortrait(p,C){
 const photo=p.portrait;if(!photo||!photo.src)return null;
 try{const img=new Image();await new Promise((ok,no)=>{img.onload=ok;img.onerror=no;img.src=photo.src});const canvas=document.createElement('canvas');canvas.width=468;canvas.height=576;const ctx=canvas.getContext('2d'),g=portraitGeometry(img,canvas.width,canvas.height,photo);ctx.fillStyle=`rgb(${C.bg.join(',')})`;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,g.x,g.y,g.iw,g.ih);return canvas.toDataURL('image/jpeg',.92)}catch(_){return null}
}
async function pdfInvestigator(doc,p,C){
 pdfFrame(doc,C);const W=doc.internal.pageSize.getWidth(),right=W-36,PF=PDF_PREFIX;
 const skills=Object.entries(p.sk||{}).sort((a,b)=>b[1]-a[1]);
 const absent=falta(p).map(([name])=>[name,+get(p,'s:'+name)||0]);
 const skName=(g,i)=>`${PF}${g}${i}`;
 const mitosAt=skills.findIndex(([n])=>n==='Mitos de Cthulhu'),mitosAbs=absent.findIndex(([n])=>n==='Mitos de Cthulhu');
 const mitosField=mitosAt>=0?skName('s',mitosAt):mitosAbs>=0?skName('a',mitosAbs):'';
 const portrait=await pdfPortrait(p,C),photoW=64,photoH=79,photoX=right-photoW,photoY=32,titleRight=portrait?photoX-10:right-39;
 /* aviso na margem superior, fora da moldura */
 doc.setFont('times','italic');doc.setFontSize(6.6);doc.setTextColor(...C.head);
 {const msg='Ficha editável e automática — use um aplicativo de PDF em que as duas funções funcionem (ex.: Adobe Acrobat). Alguns navegadores e visualizadores abrem o PDF só como editável, sem o cálculo automático.';let sz=6.6;while(sz>4.8&&doc.getTextWidth(msg)>W-60){sz-=.2;doc.setFontSize(sz)}pdfCentered(doc,msg,W/2,14,sz,C.head,'italic')}
 /* nome e linha de ocupação: campos de uma linha, com a fonte reduzida para caber */
 const fit=(text,max,size,min)=>{doc.setFont('times','bold');doc.setFontSize(size);while(size>min&&doc.getTextWidth(String(text))>max){size-=.5;doc.setFontSize(size)}return size};
 let y=55;
 const nameSize=fit(p.nome||'Investigador',titleRight-39-6,20,11);
 pdfField(doc,{name:PF+'nome',x:39,w:titleRight-39,baseline:y,size:nameSize,h:26,value:p.nome||'Investigador',color:C.head,tip:'Nome do investigador'});
 y+=22;
 if(portrait){doc.setDrawColor(...C.gold);doc.setLineWidth(.6);doc.roundedRect(photoX-2,photoY-2,photoW+4,photoH+4,2,2,'S');doc.addImage(portrait,'JPEG',photoX,photoY,photoW,photoH,undefined,'FAST')}
 doc.setDrawColor(...C.line);doc.setLineWidth(.7);doc.line(39,y+2,portrait?titleRight:right,y+2);y+=19;
 const meta=[p.occ,p.idade!==''?`${p.idade} anos`:'',p.sec?`+ ${p.sec}`:''].filter(Boolean).join(' · ');
 const metaSize=fit(meta,titleRight-39-6,9,6.5);
 pdfField(doc,{name:PF+'meta',x:39,w:titleRight-39,baseline:y,size:metaSize,value:meta,color:C.muted,tip:'Ocupação · idade'});y+=11+7;
 if(portrait)y=Math.max(y,photoY+photoH+9);
 const attrs=Object.entries(p.c||{}),gap=4,boxW=(right-39-gap*(attrs.length-1))/attrs.length,boxH=55;
 attrs.forEach(([key,value],i)=>{
  const x=39+i*(boxW+gap),fname=`${PF}c_${key}`;doc.setFillColor(...C.panel);doc.setDrawColor(...C.gold);doc.setLineWidth(.55);doc.roundedRect(x,y,boxW,boxH,4,4,'FD');
  pdfCentered(doc,key,x+boxW/2,y+13,7,C.head,'bold');
  pdfField(doc,{name:fname,x:x+4,w:boxW-8,baseline:y+32,size:15,align:'center',value:String(value),color:C.text,tip:`${key} (digite o valor: o resto se preenche sozinho)`});
  pdfField(doc,{name:fname+'_hf',x:x+3,w:boxW-6,baseline:y+46,size:7,align:'center',readonly:true,value:`${value>>1} / ${Math.floor(value/5)}`,color:C.muted,tip:`${key}: metade / quinto`,calc:pdfJs.halfFifth(fname)});
 });y+=boxH+8;
 /* derivados: PV, Sanidade e PM têm "atual" (livre) e "máx" (calculado); Sorte é livre; Mov, Bônus de Dano e Corpo são calculados */
 const der=p.der||{},auto=calc(p.c),blankV=v=>p.blank&&!(+v)?'':String(v);
 const cell=['PV','Sanidade','PM','Sorte','Mov','Bônus de Dano','Corpo'],cgap=4,cw=(right-39-cgap*(cell.length-1))/cell.length,ch=38;
 doc.setFillColor(...C.panel);doc.setDrawColor(...C.line);doc.setLineWidth(.5);doc.roundedRect(39,y,right-39,ch+8,4,4,'FD');
 const F=k=>`${PF}c_${k}`,D=k=>`${PF}d_${k}`;
 cell.forEach((label,i)=>{
  const x=39+i*(cw+cgap)+(i===0?0:0),cx=x+cw/2+(i===0?4:0),by=y+ch-6;
  pdfCentered(doc,label,cx,y+15,7.4,C.head,'bold');
  const pair=(key,cur,maxVal,maxCalc,fillFrom)=>{
   pdfField(doc,{name:D(key),x:cx-29,w:26,baseline:by,size:12,align:'right',value:blankV(cur),color:C.text,tip:`${label} atual (vazio = valor inicial)`,calc:pdfJs.fillMax(fillFrom||D(key+'max'))});
   pdfText(doc,'/',cx,by,11,C.muted,'normal','center');
   pdfField(doc,{name:D(key+'max'),x:cx+3,w:26,baseline:by,size:12,align:'left',readonly:true,value:String(maxVal),color:C.muted,tip:`${label} máximo (calculado)`,calc:maxCalc});
  };
  const one=(key,val,calcJs,ro)=>pdfField(doc,{name:D(key),x:cx-26,w:52,baseline:by,size:12,align:'center',readonly:!!ro,value:String(val),color:C.text,tip:ro?`${label} (calculado)`:label,...(calcJs?{calc:calcJs}:{})});
  if(label==='PV')pair('hp',der.hp,auto.hp,pdfJs.hp(F('CON'),F('TAM')));
  else if(label==='Sanidade')pair('san',der.san,sanMaxOf(p),pdfJs.sanMax(mitosField),F('POD')); /* Sanidade inicial = POD */
  else if(label==='PM')pair('pm',der.pm,auto.pm,pdfJs.pm(F('POD')));
  else if(label==='Sorte')one('luck',blankV(der.luck));
  else if(label==='Mov')one('mov',auto.mov,pdfJs.mov(F('FOR'),F('TAM'),F('DES')),true);
  else if(label==='Bônus de Dano')one('db',auto.db,pdfJs.db(F('FOR'),F('TAM'),false),true);
  else one('corpo',auto.corpo,pdfJs.db(F('FOR'),F('TAM'),true),true);
 });
 y+=ch+8+10;
 const hist=(p.hist||[]).map(g=>({label:`${g.kind}:`,value:g.n}));
 const cr=crRangeTxt(p);if(cr)hist.push({label:'Nível de Crédito:',value:cr});
 if(hist.length){y=pdfSection(doc,'Histórico',y,C,right);
  doc.setFont('times','bold');doc.setFontSize(8);const labelW=Math.max(...hist.map(h=>doc.getTextWidth(h.label)))+7,valX=39+labelW;
  for(const h of hist){pdfText(doc,h.label,39,y,8,C.muted,'bold');const end=pdfWrapped(doc,h.value,valX,y,right-valX,8,10,C.muted);y=Math.max(y+11,end+1)}y+=4;
 }
 let ySkills=pdfSkillColumns(doc,p,skills,'Perícias do personagem',y,C,'s',skName);
 if(absent.length)ySkills=pdfSkillColumns(doc,p,absent,'Perícias que não tenho (valor inicial)',ySkills,C,'a',skName);
 return ySkills;
}
function pdfLore(doc,p,C,startY){
 const W=doc.internal.pageSize.getWidth(),left=39,right=W-39,bottom=802,font=10.5,lineH=14;
 doc.setFont('times','normal');doc.setFontSize(font);const lines=doc.splitTextToSize(String(p.back||''),right-left);
 let offset=0,page=0,y=startY;
 while(offset<lines.length){
  if(page>0){
   doc.addPage('a4','portrait');pdfFrame(doc,C);
   pdfText(doc,p.nome||'Investigador',left,50,19,C.head,'bold');pdfText(doc,`${p.occ||''} · História do investigador`,left,70,9,C.muted);
   y=91;
  }
  const heading=page===0?'Backstory':'Backstory (continuação)';
  if(page===0&&Math.floor((bottom-(y+16))/lineH)<1){page=1;continue;}
  const textY=pdfSection(doc,heading,y,C,right),capacity=Math.floor((bottom-textY)/lineH);
  if(capacity<1){
   break;
  }
  const part=lines.slice(offset,offset+capacity);doc.setFont('times','normal');doc.setFontSize(font);doc.setTextColor(...C.text);
  doc.text(part,left,textY,{lineHeightFactor:lineH/font});offset+=part.length;page++;
 }
}
async function pdfImageData(src){
 if(!src)return null;
 try{
  const img=new Image();img.decoding='async';if(/^https?:/i.test(src))img.crossOrigin='anonymous';
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=src});
  const canvas=document.createElement('canvas'),scale=Math.min(1,512/Math.max(img.naturalWidth||1,img.naturalHeight||1));
  canvas.width=Math.max(1,Math.round((img.naturalWidth||1)*scale));canvas.height=Math.max(1,Math.round((img.naturalHeight||1)*scale));
  const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);
  return{data:canvas.toDataURL('image/png'),width:canvas.width,height:canvas.height};
 }catch(_){return null}
}
async function pdfEquipment(doc,p,C){
 const items=window.CthEquipment.pdfRows(p);if(!items.length)return;
 const W=doc.internal.pageSize.getWidth(),left=39,right=W-39,bottom=802;let y=0,page=0;
 const newPage=()=>{
  doc.addPage('a4','portrait');pdfFrame(doc,C);
  pdfText(doc,p.nome||'Investigador',left,50,19,C.head,'bold');
  pdfText(doc,`${p.occ||''} · Equipamentos · Cenário: ${window.CthEquipment.yearOf(p)}`,left,70,9,C.muted);
  y=pdfSection(doc,page?'Equipamentos (continuação)':'Equipamentos',91,C,right);page++;
 };
 newPage();
 for(const item of items){
  const art=await pdfImageData(item.image),imageSize=38;
  const textX=left+(art?imageSize+9:0),textWidth=right-textX;
  const title=`${item.quantity} × ${item.name} · ${item.category}`;
  doc.setFont('times','bold');doc.setFontSize(9);const titleLines=doc.splitTextToSize(title,textWidth);
  doc.setFont('times','normal');doc.setFontSize(8.2);const detailLines=item.detail?doc.splitTextToSize(item.detail,textWidth):[];
  const textHeight=titleLines.length*11+(detailLines.length?detailLines.length*10+3:0),height=Math.max(textHeight,imageSize)+8;
  if(y+height>bottom){newPage()}
  if(art){const ratio=Math.min(imageSize/art.width,imageSize/art.height),w=art.width*ratio,h=art.height*ratio;doc.addImage(art.data,'PNG',left+(imageSize-w)/2,y+(imageSize-h)/2,w,h,undefined,'FAST')}
  let textY=y;
  doc.setFont('times','bold');doc.setFontSize(9);doc.setTextColor(...C.head);doc.text(titleLines,textX,textY,{lineHeightFactor:11/9});textY+=titleLines.length*11;
  if(detailLines.length){doc.setFont('times','normal');doc.setFontSize(8.2);doc.setTextColor(...C.text);doc.text(detailLines,textX,textY+2,{lineHeightFactor:10/8.2})}
  y+=height;doc.setDrawColor(...C.line);doc.setLineWidth(.3);doc.line(left,y+2,right,y+2);y+=9;
 }
}
async function savePdf(list,b){
 if(!list.length||b.disabled)return;
 const label=b.innerHTML;b.textContent='⏳ Gerando…';b.disabled=true;
 try{
  if(typeof createMiniPdf!=='function')throw new Error('o arquivo pdfkit.js não foi carregado (confira se ele está na pasta do site e no index.html)');
  if(!window.PDFLib){try{await loadScript('pdf-lib.min.js')}catch(_){throw new Error('o arquivo pdf-lib.min.js não foi encontrado (envie-o para o GitHub junto com os outros arquivos do site)')}}
  const C=pdfColors(),pdf=await createMiniPdf(window.PDFLib);
  for(const [i,p] of list.entries()){
   if(i)pdf.addPage('a4','portrait');
   PDF_PREFIX=`f${i}_`;
   const loreStart=await pdfInvestigator(pdf,p,C);
   if(String(p.back||'').trim())pdfLore(pdf,p,C,loreStart);
   await pdfEquipment(pdf,p,C);
  }
  const name=(list.length===1?list[0].nome:'investigadores').replace(/[^\wÀ-ſ -]/g,'').trim().replace(/\s+/g,'_')||'ficha';
  await pdf.save(name+'.pdf',name);
 }catch(err){console.error(err);alert('Não foi possível gerar o PDF.\n\nDetalhe técnico: '+(err&&err.message||err));}
 finally{b.innerHTML=label;b.disabled=false}
}
sel.onchange=sel2.onchange=document.getElementById('qty').onchange=persist;
