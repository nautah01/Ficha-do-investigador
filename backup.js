/* Backup: baixa tudo (fichas, bloco de notas, cemitério) num arquivo .json e carrega de volta em qualquer navegador */
(()=>{
const FORMAT='cthulhu-backup',BACKUP_VERSION=3,LS=['coc7-investigadores-v2','cthulhu-cemiterio','cthulhu-bg'],THEMES=['green','red','blue','paper'];
const $=id=>document.getElementById(id);
const open=()=>new Promise((ok,no)=>{const r=indexedDB.open('cthulhu-notas',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const getNotes=async()=>{const d=await open();return new Promise((ok,no)=>{const q=d.transaction('kv').objectStore('kv').get('board');q.onsuccess=()=>ok(q.result??null);q.onerror=()=>no(q.error)})};
const setNotes=async v=>{const d=await open();return new Promise((ok,no)=>{const t=d.transaction('kv','readwrite'),s=t.objectStore('kv');v==null?s.delete('board'):s.put(v,'board');t.oncomplete=ok;t.onerror=()=>no(t.error)})};
function parseStored(key,value){
 if(value==null)return null;if(typeof value!=='string')throw new Error(`Formato inválido: ${key}`);
 let parsed;try{parsed=JSON.parse(value)}catch{throw new Error(`JSON inválido: ${key}`)}
 if(key==='coc7-investigadores-v2'&&(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||!Array.isArray(parsed.cur)||parsed.cur.some(p=>!p||typeof p!=='object'||Array.isArray(p)||!p.c||typeof p.c!=='object'||Array.isArray(p.c)||!p.sk||typeof p.sk!=='object'||Array.isArray(p.sk)||p.der!=null&&(typeof p.der!=='object'||Array.isArray(p.der))||p.tags!=null&&(!Array.isArray(p.tags)||p.tags.some(t=>typeof t!=='string'))||p.parkedSkills!=null&&(typeof p.parkedSkills!=='object'||Array.isArray(p.parkedSkills)))||parsed.campaigns!=null&&(!Array.isArray(parsed.campaigns)||parsed.campaigns.some(c=>!c||typeof c!=='object'||Array.isArray(c)||typeof c.id!=='string'||typeof c.name!=='string'))||parsed.activeCampaignId!=null&&typeof parsed.activeCampaignId!=='string'))throw new Error('Estrutura de fichas, etiquetas ou campanhas inválida');
 if(key==='cthulhu-cemiterio'&&(!Array.isArray(parsed)||parsed.some(p=>!p||typeof p!=='object'||Array.isArray(p)||typeof p.id!=='string'||typeof p.nome!=='string'||typeof p.causa!=='string')))throw new Error('Estrutura do cemitério inválida');
 if(key==='cthulhu-bg'&&(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||Object.entries(parsed).some(([slot,pick])=>!['p','s'].includes(slot)||!pick||typeof pick!=='object'||typeof pick.occ!=='string'||!pick.pick||typeof pick.pick!=='object')))throw new Error('Estrutura das origens inválida');
 return parsed;
}
function validNotes(value){
 if(value==null)return true;
 if(typeof value!=='object'||Array.isArray(value))return false;
 const validItem=i=>i&&typeof i==='object'&&!Array.isArray(i)&&typeof i.id==='string'&&['txt','img'].includes(i.type)&&Number.isFinite(+i.x)&&Number.isFinite(+i.y)&&Number.isFinite(+i.w);
 if(value.boards!=null&&(!Array.isArray(value.boards)||value.boards.some(b=>!b||typeof b!=='object'||Array.isArray(b)||typeof b.id!=='string'||!Array.isArray(b.items)||b.items.some(i=>!validItem(i))||b.links!=null&&(!Array.isArray(b.links)||b.links.some(l=>Array.isArray(l)?l.length<2||typeof l[0]!=='string'||typeof l[1]!=='string':!l||typeof l!=='object'||typeof l.a!=='string'||typeof l.b!=='string')))))return false;
 if(value.diary!=null&&(typeof value.diary!=='object'||Array.isArray(value.diary)||value.diary.entries!=null&&(!Array.isArray(value.diary.entries)||value.diary.entries.some(e=>!e||typeof e!=='object'||typeof e.id!=='string'||typeof e.text!=='string'))))return false;
 if(value.items!=null&&(!Array.isArray(value.items)||value.items.some(i=>!validItem(i))))return false;
 if(value.links!=null&&(!Array.isArray(value.links)||value.links.some(l=>Array.isArray(l)?l.length<2||typeof l[0]!=='string'||typeof l[1]!=='string':!l||typeof l!=='object'||typeof l.a!=='string'||typeof l.b!=='string')))return false;
 return true;
}

async function exportar(){
 try{
  if(window.Notas&&window.Notas.flush)await window.Notas.flush();
  if(window.flushFichaSave)await window.flushFichaSave();
  const ls={};LS.forEach(k=>ls[k]=localStorage.getItem(k));
  if(window.getFichaBackupState)ls[LS[0]]=JSON.stringify(window.getFichaBackupState());
  const storedTheme=localStorage.getItem('cthulhu-tema')||document.documentElement.dataset.theme||'green';
  const tema=THEMES.includes(storedTheme)?storedTheme:'green';
  const data={format:FORMAT,version:BACKUP_VERSION,exportedAt:new Date().toISOString(),ls,tema,notas:await getNotes()};
  const d=new Date(),pad=n=>String(n).padStart(2,'0'),nome=`cthulhu-backup-${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}.json`;
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'}));a.download=nome;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
 }catch{alert('Não foi possível gerar o backup neste navegador.')}
}

async function importar(file){
 let data;
 try{data=JSON.parse(await file.text())}catch{return alert('Este arquivo não é um backup válido.')}
 if(!data||data.format!==FORMAT||!data.ls||typeof data.ls!=='object'||Array.isArray(data.ls)||![1,2,BACKUP_VERSION].includes(data.version??1))return alert('Este arquivo não parece ser um backup deste site.');
 if((data.version??1)<BACKUP_VERSION){data={...data,version:BACKUP_VERSION,ls:{...data.ls,'cthulhu-bg':data.ls['cthulhu-bg']??null},notas:data.notas??null}}
 if(data.tema!=null&&!THEMES.includes(data.tema))return alert('O tema informado no backup não é válido.');
 try{for(const k of LS)parseStored(k,data.ls[k]??null)}catch(error){return alert('O backup não passou na validação: '+error.message)}
 if(!validNotes(data.notas??null))return alert('A estrutura dos quadros ou anotações do backup é inválida.');
 if(!await(window.askConfirm?askConfirm({title:'Carregar este backup?',html:'Isso vai <strong>substituir</strong> as fichas, o tema, os quadros de pistas, o livro de anotações e o cemitério deste navegador pelos do arquivo. Não dá para desfazer.',ok:'📂 Carregar dados'}):Promise.resolve(confirm('Carregar este backup vai substituir os dados deste navegador. Continuar?'))))return;
 let oldNotes,oldFicha=null;const oldLocal={};
 try{if(window.getFichaBackupState)oldFicha=window.getFichaBackupState();if(window.Notas&&window.Notas.flush)await window.Notas.flush();oldNotes=await getNotes();for(const k of [...LS.slice(1),'cthulhu-tema'])oldLocal[k]=localStorage.getItem(k)}catch{return alert('Não foi possível preparar a restauração. Nenhum dado foi alterado.')}
 try{
  await setNotes(data.notas??null);
  if(window.importFichaState)await window.importFichaState(parseStored(LS[0],data.ls[LS[0]]??null));
  LS.slice(1).forEach(k=>data.ls[k]==null?localStorage.removeItem(k):localStorage.setItem(k,data.ls[k]));
  if(data.tema!=null)localStorage.setItem('cthulhu-tema',data.tema);
 }catch(error){
  let rollbackFailed=false;
  try{await setNotes(oldNotes)}catch{rollbackFailed=true}
  try{if(window.importFichaState)await window.importFichaState(oldFicha)}catch{rollbackFailed=true}
  for(const[k,v]of Object.entries(oldLocal))try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch{rollbackFailed=true}
  return alert(rollbackFailed?'A restauração falhou e não foi possível reverter todas as alterações. Faça uma cópia dos dados atuais antes de continuar.':'A restauração falhou; os dados anteriores foram restaurados. Verifique o espaço e tente novamente.');
 }
 location.reload();
}

const inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';inp.hidden=true;document.body.appendChild(inp);
inp.onchange=()=>{const f=inp.files[0];inp.value='';if(f)importar(f)};
$('bkpOut').onclick=exportar;$('bkpIn').onclick=()=>inp.click();
})();
