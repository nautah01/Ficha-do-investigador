/* Mini gerador de PDF sobre o pdf-lib (vendor/pdf-lib.min.js, local, sem internet).
   Oferece o subconjunto da interface do jsPDF que o pdf.js usa (texto, linhas, retângulos, imagens, páginas)
   e acrescenta campos de formulário (field) com cálculo automático em JavaScript do PDF. */
async function createMiniPdf(L){
 const{PDFDocument,StandardFonts,rgb,TextAlignment,PDFName,PDFHexString}=L;
 const pdfDoc=await PDFDocument.create();
 const fonts={
  normal:await pdfDoc.embedFont(StandardFonts.TimesRoman),
  bold:await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
  italic:await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
  bolditalic:await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic)
 };
 const W=595.28,H=841.89,charset=new Set(fonts.normal.getCharacterSet());
 const pages=[],images=[],fields=[];
 let page=null;
 const addPage=()=>{page=pdfDoc.addPage([W,H]);pages.push(page);return page};
 addPage();
 let fill=[0,0,0],stroke=[0,0,0],lw=1,tcolor=[0,0,0],fstyle='normal',fsize=12;
 const col=a=>rgb(a[0]/255,a[1]/255,a[2]/255);
 const font=()=>fonts[fstyle]||fonts.normal;
 /* caracteres que a fonte padrão do PDF não tem viram "?" (evita erro ao gerar) */
 const safe=s=>{let o='';for(const ch of String(s??'')){const c=ch.codePointAt(0);o+=c===10?'\n':c===9?' ':charset.has(c)?ch:'?'}return o};
 const tw=s=>font().widthOfTextAtSize(safe(s).replace(/\n/g,' '),fsize);
 function breakWord(word,max,out){let piece='';for(const ch of word){if(piece&&tw(piece+ch)>max){out.push(piece);piece=ch}else piece+=ch}return piece}
 const api={
  internal:{pageSize:{getWidth:()=>W,getHeight:()=>H}},
  getNumberOfPages:()=>pages.length,
  addPage(){addPage();return api},
  setFillColor(r,g,b){fill=[r,g,b];return api},
  setDrawColor(r,g,b){stroke=[r,g,b];return api},
  setTextColor(r,g,b){tcolor=[r,g,b];return api},
  setLineWidth(w){lw=w;return api},
  setFont(_name,style){fstyle=style||'normal';return api},
  setFontSize(s){fsize=s;return api},
  getTextWidth:s=>tw(s),
  splitTextToSize(text,max){
   const lines=[];
   String(text??'').split(/\r?\n/).forEach(par=>{
    if(par===''){lines.push('');return}
    let cur='';
    for(const word of par.split(' ')){
     const t=cur?cur+' '+word:word;
     if(tw(t)<=max)cur=t;
     else{if(cur)lines.push(cur);cur=tw(word)>max?breakWord(word,max,lines):word}
    }
    lines.push(cur);
   });
   return lines;
  },
  text(t,x,y,o={}){
   const list=(Array.isArray(t)?t:[t]).flatMap(s=>safe(s).split('\n')),lh=fsize*(o.lineHeightFactor||1.15);
   list.forEach((ln,i)=>{
    const w=font().widthOfTextAtSize(ln,fsize);let xx=x;
    if(o.align==='right')xx=x-w;else if(o.align==='center')xx=x-w/2;
    if(ln)page.drawText(ln,{x:xx,y:H-(y+i*lh),size:fsize,font:font(),color:col(tcolor)});
   });
   return api;
  },
  line(x1,y1,x2,y2){page.drawLine({start:{x:x1,y:H-y1},end:{x:x2,y:H-y2},thickness:lw,color:col(stroke)});return api},
  rect(x,y,w,h,style='S'){
   const f=/F/.test(style),s=/S|D/.test(style);
   page.drawRectangle({x,y:H-y-h,width:w,height:h,color:f?col(fill):undefined,borderColor:s?col(stroke):undefined,borderWidth:s?lw:0});
   return api;
  },
  roundedRect(x,y,w,h,rx,_ry,style='S'){
   const r=Math.max(0,Math.min(rx,w/2,h/2)),f=/F/.test(style),s=/S|D/.test(style);
   const d=`M${x+r},${y} H${x+w-r} A${r},${r} 0 0 1 ${x+w},${y+r} V${y+h-r} A${r},${r} 0 0 1 ${x+w-r},${y+h} H${x+r} A${r},${r} 0 0 1 ${x},${y+h-r} V${y+r} A${r},${r} 0 0 1 ${x+r},${y} Z`;
   page.drawSvgPath(d,{x:0,y:H,color:f?col(fill):undefined,borderColor:s?col(stroke):undefined,borderWidth:s?lw:0});
   return api;
  },
  addImage(data,format,x,y,w,h){images.push({page,data,format:String(format).toUpperCase(),x,y,w,h});return api},
  /* campo de formulário editável. o: {name,x,y,w,h,value,size,align,color,readonly,tip,multiline,calc} (y = topo, em pt) */
  field(o){fields.push({...o,page});return api},
  async save(filename,title){
   for(const im of images){
    try{
     const img=im.format==='JPEG'||im.format==='JPG'?await pdfDoc.embedJpg(im.data):await pdfDoc.embedPng(im.data);
     im.page.drawImage(img,{x:im.x,y:H-im.y-im.h,width:im.w,height:im.h});
    }catch(_){/* imagem inválida: a ficha sai sem ela */}
   }
   const form=pdfDoc.getForm(),order=[];
   for(const f of fields){
    const tf=form.createTextField(f.name);
    if(f.multiline)tf.enableMultiline();
    tf.addToPage(f.page,{x:f.x,y:H-f.y-f.h,width:f.w,height:f.h,font:fonts.normal,textColor:col(f.color||[0,0,0]),borderWidth:0});
    for(const w of tf.acroField.getWidgets())w.dict.set(PDFName.of('MK'),pdfDoc.context.obj({R:0})); /* sem fundo nem borda: o campo some no layout */
    tf.setFontSize(f.size||9);
    tf.setAlignment(f.align==='right'?TextAlignment.Right:f.align==='center'?TextAlignment.Center:TextAlignment.Left);
    tf.setText(safe(f.value));
    if(f.readonly)tf.enableReadOnly();
    tf.updateAppearances(fonts.normal);
    if(f.tip)tf.acroField.dict.set(PDFName.of('TU'),PDFHexString.fromText(safe(f.tip)));
    if(f.calc){
     /* script em ASCII puro (PDFDocEncoding) para qualquer leitor aceitar */
     const hex=Array.from(f.calc).map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join('');
     const action=pdfDoc.context.obj({S:'JavaScript',JS:PDFHexString.of(hex)});
     tf.acroField.dict.set(PDFName.of('AA'),pdfDoc.context.obj({C:action}));
     order.push(tf.ref);
    }
   }
   if(order.length)form.acroForm.dict.set(PDFName.of('CO'),pdfDoc.context.obj(order));
   if(title)pdfDoc.setTitle(title);
   pdfDoc.setCreator('Ficha do Investigador');pdfDoc.setProducer('Ficha do Investigador (pdf-lib)');
   const bytes=await pdfDoc.save({updateFieldAppearances:false});
   if(typeof document!=='undefined'&&filename){
    const a=document.createElement('a'),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
   }
   return bytes;
  }
 };
 return api;
}
if(typeof module!=='undefined')module.exports={createMiniPdf};
