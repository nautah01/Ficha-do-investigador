/* Backup: baixa tudo (fichas, bloco de notas, cemitério) num arquivo .json e carrega de volta em qualquer navegador */
(()=>{
const FORMAT='cthulhu-backup',LS=['coc7-investigadores-v2','cthulhu-cemiterio'];
const $=id=>document.getElementById(id);
const open=()=>new Promise((ok,no)=>{const r=indexedDB.open('cthulhu-notas',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const getNotes=async()=>{const d=await open();return new Promise((ok,no)=>{const q=d.transaction('kv').objectStore('kv').get('board');q.onsuccess=()=>ok(q.result??null);q.onerror=()=>no(q.error)})};
const setNotes=async v=>{const d=await open();return new Promise((ok,no)=>{const t=d.transaction('kv','readwrite'),s=t.objectStore('kv');v==null?s.delete('board'):s.put(v,'board');t.oncomplete=ok;t.onerror=()=>no(t.error)})};

async function exportar(){
 try{
  const ls={};LS.forEach(k=>ls[k]=localStorage.getItem(k));
  const data={format:FORMAT,version:1,exportedAt:new Date().toISOString(),ls,notas:await getNotes()};
  const d=new Date(),pad=n=>String(n).padStart(2,'0'),nome=`cthulhu-backup-${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}.json`;
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'}));a.download=nome;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
 }catch{alert('Não foi possível gerar o backup neste navegador.')}
}

async function importar(file){
 let data;
 try{data=JSON.parse(await file.text())}catch{return alert('Este arquivo não é um backup válido.')}
 if(!data||data.format!==FORMAT||typeof data.ls!=='object')return alert('Este arquivo não parece ser um backup deste site.');
 for(const k of LS){const v=data.ls[k];if(v!=null)try{JSON.parse(v)}catch{return alert('O backup está corrompido ('+k+').')}}
 if(!await(window.askConfirm?askConfirm({title:'Carregar este backup?',html:'Isso vai <strong>substituir</strong> as fichas, o bloco de notas e o cemitério deste navegador pelos do arquivo. Não dá para desfazer.',ok:'📂 Carregar dados'}):Promise.resolve(confirm('Carregar este backup vai substituir os dados deste navegador. Continuar?'))))return;
 try{
  LS.forEach(k=>data.ls[k]==null?localStorage.removeItem(k):localStorage.setItem(k,data.ls[k]));
  await setNotes(data.notas);
 }catch{return alert('Não foi possível gravar os dados neste navegador (armazenamento cheio ou bloqueado).')}
 location.reload();
}

const inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';inp.hidden=true;document.body.appendChild(inp);
inp.onchange=()=>{const f=inp.files[0];inp.value='';if(f)importar(f)};
$('bkpOut').onclick=exportar;$('bkpIn').onclick=()=>inp.click();
})();
