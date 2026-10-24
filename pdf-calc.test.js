/* Confere se os cálculos que vão DENTRO do PDF (JavaScript de campos) dão o mesmo resultado das regras do site (rules.js). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..');
const src=['rules-data.js','rules.js','pdf.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
const el={onchange:null};
const ctx=vm.createContext({window:{BGSEL:{}},document:{getElementById:()=>el,createElement:()=>({}),head:{appendChild(){}}},sel:el,sel2:el,persist(){},console,Math});
vm.runInContext(src+';this.__t={pdfJs,calc,chancesOf,sanMaxOf}',ctx);
const {pdfJs,calc,chancesOf,sanMaxOf}=ctx.__t;
/* simula a API de formulário do PDF (this.getField(nome).value / event.value) */
function run(script,fields){
 const evt={value:''},self={getField:n=>n in fields?{value:fields[n]}:null};
 new Function('event',script).call(self,evt);return evt.value;
}
const rnd=()=>5*(3+Math.floor(Math.random()*16)); /* 15..90 */
test('metade / quinto de qualquer valor',()=>{
 for(let v=0;v<=200;v++){const c=chancesOf(v);assert.equal(run(pdfJs.halfFifth('x'),{x:String(v)}),`${c.h} / ${c.e}`)}
 assert.equal(run(pdfJs.halfFifth('x'),{x:''}),'');
});
test('PV, PM, Mov, Bônus de Dano e Corpo seguem calc() do site',()=>{
 for(let i=0;i<3000;i++){
  const c={FOR:rnd(),CON:rnd(),POD:rnd(),DES:rnd(),APA:rnd(),TAM:rnd(),INT:rnd(),EDU:rnd()};
  if(i%7===0){c.FOR=90+5*(i%40);c.TAM=90+5*((i*3)%40)} /* faixas acima de 204 */
  const f={FOR:c.FOR,CON:c.CON,POD:c.POD,DES:c.DES,TAM:c.TAM},a=calc(c);
  assert.equal(run(pdfJs.hp('CON','TAM'),f),a.hp);
  assert.equal(run(pdfJs.pm('POD'),f),a.pm);
  assert.equal(run(pdfJs.mov('FOR','TAM','DES'),f),a.mov);
  assert.equal(run(pdfJs.db('FOR','TAM',false),f),a.db);
  assert.equal(run(pdfJs.db('FOR','TAM',true),f),a.corpo);
 }
});
test('Sanidade máxima = 99 − Mitos de Cthulhu',()=>{
 for(const m of [0,1,5,33,98,99,120]){assert.equal(run(pdfJs.sanMax('m'),{m:String(m)}),sanMaxOf({sk:{'Mitos de Cthulhu':m}}))}
 assert.equal(run(pdfJs.sanMax(''),{}),99);
});
test('campo "atual" copia o máximo só quando está vazio',()=>{
 const f={mx:'12',at:''};
 const ev={value:''};new Function('event',pdfJs.fillMax('mx')).call({getField:n=>({value:f[n]})},ev);assert.equal(ev.value,'12');
 const ev2={value:'7'};new Function('event',pdfJs.fillMax('mx')).call({getField:n=>({value:f[n]})},ev2);assert.equal(ev2.value,'7');
});
