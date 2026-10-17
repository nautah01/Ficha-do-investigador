/* Exportação em PDF (jsPDF carregado sob demanda). Movido sem alterações do index.html. */
function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
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
function pdfSkillColumns(doc,p,items,title,y,C){
 if(!items.length)return y;
 const left=39,right=560,gap=14,colW=(right-left-gap*2)/3,bottom=804,valueW=52,nameW=colW-valueW-5;
 const startY=pdfSection(doc,title,y,C),room=bottom-startY-3;
 let font=6.6,lineH=7.5,rowGap=1.6,cols,heights,labels;
 const layout=()=>{
  doc.setFont('times','normal');doc.setFontSize(font);cols=[[],[],[]];heights=[0,0,0];labels=[];
  for(const item of items){
   const lines=doc.splitTextToSize(String(item[0]),nameW),h=Math.max(lineH,lines.length*lineH)+rowGap;
   const col=heights.indexOf(Math.min(...heights));cols[col].push({item,lines,h});heights[col]+=h;
  }
 };
 layout();
 while(Math.max(...heights)>room&&font>5.2){font=Math.max(5.2,font-.2);lineH=font+1;rowGap=1;layout()}
 cols.forEach((entries,col)=>{
  const x=left+col*(colW+gap);let yy=startY;
  entries.forEach(({item,lines,h})=>{
   const [name,value]=item;doc.setFont('times','normal');doc.setFontSize(font);doc.setTextColor(...C.text);doc.text(lines,x,yy,{lineHeightFactor:lineH/font});
   const val=`${value}% · ${(value>>1)} / ${Math.floor(value/5)}`;
   doc.setFont('times','bold');doc.setFontSize(font-.3);doc.setTextColor(...C.muted);doc.text(val,x+colW,yy,{align:'right'});
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
 pdfFrame(doc,C);const W=doc.internal.pageSize.getWidth(),right=W-36;
 const portrait=await pdfPortrait(p,C),photoW=64,photoH=79,photoX=right-photoW,photoY=32,titleRight=portrait?photoX-10:right-39;
 let y=55;y=pdfWrapped(doc,p.nome||'Investigador',39,y,titleRight-39,20,22,C.head,'bold');
 if(portrait){doc.setDrawColor(...C.gold);doc.setLineWidth(.6);doc.roundedRect(photoX-2,photoY-2,photoW+4,photoH+4,2,2,'S');doc.addImage(portrait,'JPEG',photoX,photoY,photoW,photoH,undefined,'FAST')}
 doc.setDrawColor(...C.line);doc.setLineWidth(.7);doc.line(39,y+2,portrait?titleRight:right,y+2);y+=19;
 const meta=[p.occ,p.idade!==''?`${p.idade} anos`:'',p.sec?`+ ${p.sec}`:''].filter(Boolean).join(' · ');
 y=pdfWrapped(doc,meta,39,y,titleRight-39,9,11,C.muted)+7;
 if(portrait)y=Math.max(y,photoY+photoH+9);
 const attrs=Object.entries(p.c||{}),gap=4,boxW=(right-39-gap*(attrs.length-1))/attrs.length,boxH=55;
 attrs.forEach(([key,value],i)=>{
  const x=39+i*(boxW+gap);doc.setFillColor(...C.panel);doc.setDrawColor(...C.gold);doc.setLineWidth(.55);doc.roundedRect(x,y,boxW,boxH,4,4,'FD');
  pdfCentered(doc,key,x+boxW/2,y+13,7,C.head,'bold');pdfCentered(doc,value,x+boxW/2,y+32,15,C.text,'normal');
  pdfCentered(doc,`${value>>1} / ${Math.floor(value/5)}`,x+boxW/2,y+46,7,C.muted,'normal');
 });y+=boxH+8;
 const pairs=[['PV',p.der.hp],['Sanidade',p.der.san],['Sorte',p.der.luck],['PM',p.der.pm],['Mov',p.der.mov],['Bônus de Dano',p.der.db],['Corpo',p.der.corpo]];
 doc.setFont('times','bold');doc.setFontSize(7.4);
 const pairRows=[[]];let rowW=0,maxW=right-39-16;
 for(const [label,value] of pairs){doc.setFont('times','bold');const lw=doc.getTextWidth(label);doc.setFont('times','normal');const vw=doc.getTextWidth(String(value));const width=lw+vw+10;if(rowW&&rowW+width>maxW){pairRows.push([]);rowW=0}pairRows[pairRows.length-1].push({label,value,lw,width});rowW+=width}
 const derH=pairRows.length*13+12;doc.setFillColor(...C.panel);doc.setDrawColor(...C.line);doc.setLineWidth(.5);doc.roundedRect(39,y,right-39,derH,4,4,'FD');
 pairRows.forEach((row,ri)=>{let x=47;const yy=y+14+ri*13;row.forEach(pair=>{pdfText(doc,pair.label,x,yy,7.4,C.head,'bold');x+=pair.lw+3;pdfText(doc,pair.value,x,yy,7.4,C.text);x+=doc.getTextWidth(String(pair.value))+9})});y+=derH+10;
 const hist=(p.hist||[]).map(g=>({label:`${g.kind}:`,value:g.n}));
 const cr=crRangeTxt(p);if(cr)hist.push({label:'Nível de Crédito:',value:cr});
 if(hist.length){y=pdfSection(doc,'Histórico',y,C,right);
  doc.setFont('times','bold');doc.setFontSize(8);const labelW=Math.max(...hist.map(h=>doc.getTextWidth(h.label)))+7,valX=39+labelW;
  for(const h of hist){pdfText(doc,h.label,39,y,8,C.muted,'bold');const end=pdfWrapped(doc,h.value,valX,y,right-valX,8,10,C.muted);y=Math.max(y+11,end+1)}y+=4;
 }
 let ySkills=pdfSkillColumns(doc,p,Object.entries(p.sk||{}).sort((a,b)=>b[1]-a[1]),'Perícias do personagem',y,C);
 const absent=falta(p).map(([name])=>[name,+get(p,'s:'+name)||0]);
 if(absent.length)ySkills=pdfSkillColumns(doc,p,absent,'Perícias que não tenho (valor inicial)',ySkills,C);
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
 const label=b.textContent;b.textContent='⏳ Gerando…';b.disabled=true;
 try{
  if(!window.jspdf)await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
  const {jsPDF}=window.jspdf,C=pdfColors(),pdf=new jsPDF({unit:'pt',format:'a4',orientation:'portrait',compress:true});
  for(const [i,p] of list.entries()){
   if(i)pdf.addPage('a4','portrait');
   const loreStart=await pdfInvestigator(pdf,p,C);
   if(String(p.back||'').trim())pdfLore(pdf,p,C,loreStart);
   await pdfEquipment(pdf,p,C);
  }
  const name=(list.length===1?list[0].nome:'investigadores').replace(/[^\w\u00C0-\u017F -]/g,'').trim().replace(/\s+/g,'_')||'ficha';
  pdf.save(name+'.pdf');
 }catch(_){alert('Não foi possível gerar o PDF. Verifique sua conexão e tente novamente.');}
 finally{b.textContent=label;b.disabled=false}
}
sel.onchange=sel2.onchange=document.getElementById('qty').onchange=persist;
