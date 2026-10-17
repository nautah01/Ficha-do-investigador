/* Persistência das fichas.
   - IndexedDB (banco "cthulhu-fichas"), muito maior que o limite de ~5 MB do localStorage: cabem retratos e equipamentos.
   - Migra sozinho o que estava no localStorage (chave antiga) na primeira abertura.
   - Falhas de gravação nunca são silenciosas: quem chama recebe o erro por onStatus().
   - Duas abas abertas: cada gravação carrega um número de revisão; se outra aba gravou antes, a gravação é recusada
     (conflito) e o app pergunta o que fazer, em vez de sobrescrever em silêncio. */
const STORE='coc7-investigadores-v2'; /* chave antiga (localStorage); também é o nome usado nos arquivos de backup */
const FichaStore=(()=>{
 const DB_NAME='cthulhu-fichas',OS='kv',KEY='state',BC_NAME='cthulhu-fichas-sync';
 const tabId=Math.random().toString(36).slice(2);
 let db=null,mode='idb',rev=0,chain=Promise.resolve(),statusCb=()=>{},remoteCb=()=>{},bc=null,legacyToRemove=false;
 try{if(window.BroadcastChannel){bc=new BroadcastChannel(BC_NAME);bc.onmessage=e=>{const m=e.data;if(m&&m.writer!==tabId)remoteCb({reason:'remote',rev:m.rev})}}}catch(_){bc=null}

 function openDb(){return new Promise((ok,no)=>{
  if(!window.indexedDB)return no(new Error('IndexedDB indisponível neste navegador'));
  let rq;try{rq=indexedDB.open(DB_NAME,1)}catch(e){return no(e)}
  rq.onupgradeneeded=()=>{if(!rq.result.objectStoreNames.contains(OS))rq.result.createObjectStore(OS)};
  rq.onsuccess=()=>ok(rq.result);rq.onerror=()=>no(rq.error||new Error('falha ao abrir o banco'));rq.onblocked=()=>no(new Error('banco bloqueado por outra aba'));
  setTimeout(()=>no(new Error('tempo esgotado ao abrir o banco')),5000);
 })}
 const tx=(kind,fn)=>new Promise((ok,no)=>{
  let t;try{t=db.transaction(OS,kind)}catch(e){return no(e)}
  let out;fn(t.objectStore(OS),v=>{out=v});
  t.oncomplete=()=>ok(out);t.onerror=()=>no(t.error||new Error('erro na transação'));t.onabort=()=>no(t.error||new Error('transação cancelada (armazenamento cheio?)'));
 });
 const readLegacy=()=>{try{const d=JSON.parse(localStorage.getItem(STORE)||'null');return d&&Array.isArray(d.cur)?d:null}catch(_){return null}};

 /* Lê o estado salvo. Devolve {state, mode, migrated}; state é null quando não há nada salvo. */
 async function load(){
  try{db=await openDb();mode='idb'}catch(e){mode='ls';console.warn('Usando localStorage:',e.message)}
  if(mode==='idb'){
   const rec=await tx('readonly',(st,set)=>{const g=st.get(KEY);g.onsuccess=()=>set(g.result)});
   if(rec&&rec.state&&Array.isArray(rec.state.cur)){rev=rec.rev||0;return{state:rec.state,mode,migrated:false}}
  }
  const legacy=readLegacy();
  if(legacy){
   if(mode==='idb'){
    const res=await save(legacy,{force:true});
    if(res&&res.ok)legacyToRemove=true; /* a cópia antiga só é apagada depois de uma segunda gravação bem-sucedida */
   }
   return{state:legacy,mode,migrated:mode==='idb'};
  }
  return{state:null,mode,migrated:false};
 }

 async function writeOnce(state,force){
  if(mode==='idb'){
   const res=await tx('readwrite',(st,set)=>{
    const g=st.get(KEY);
    g.onsuccess=()=>{
     const cur=g.result,stored=cur?cur.rev||0:0;
     if(cur&&!force&&stored!==rev&&cur.writer!==tabId){set({conflict:true});return}
     const nr=stored+1;st.put({state,rev:nr,writer:tabId,t:Date.now()},KEY);set({ok:true,rev:nr});
    };
   });
   if(res&&res.ok){rev=res.rev;try{bc&&bc.postMessage({writer:tabId,rev})}catch(_){}}
   return res||{ok:false};
  }
  localStorage.setItem(STORE,JSON.stringify(state)); /* modo de emergência */
  return{ok:true};
 }
 /* Grava o estado. As gravações entram numa fila, uma de cada vez. */
 function save(state,opt={}){
  const force=!!opt.force;
  const job=chain.then(async()=>{
   try{
    const res=await writeOnce(state,force);
    if(res.conflict){statusCb({ok:false,conflict:true});remoteCb({reason:'conflict'});return res}
    statusCb({ok:true,mode});
    if(legacyToRemove&&mode==='idb'){legacyToRemove=false;try{localStorage.removeItem(STORE)}catch(_){}}
    return res;
   }catch(e){statusCb({ok:false,error:e,mode});return{ok:false,error:e}}
  });
  chain=job.catch(()=>{});
  return job;
 }
 /* Relê o que está no banco (usado depois de um conflito: "usar a versão da outra aba"). */
 async function reload(){
  if(mode!=='idb')return{state:readLegacy()};
  const rec=await tx('readonly',(st,set)=>{const g=st.get(KEY);g.onsuccess=()=>set(g.result)});
  if(rec){rev=rec.rev||0}
  return{state:rec&&rec.state||null};
 }
 /* Importação de backup/arquivo: valida o formato antes de gravar por cima de tudo. */
 async function importState(raw){
  const clean=sanitizeState(typeof raw==='string'?JSON.parse(raw):raw);
  if(!clean)throw new Error('O arquivo não contém fichas válidas.');
  const res=await save(clean,{force:true});
  if(!res||!res.ok)throw (res&&res.error)||new Error('Não foi possível gravar as fichas importadas.');
  return clean.cur.length;
 }
 /* armazenamento auxiliar de outros módulos (ex.: Mesa do Guardião); não participa do controle de revisão das fichas */
 async function kvGet(key){
  if(mode==='idb')return tx('readonly',(st,set)=>{const g=st.get('x:'+key);g.onsuccess=()=>set(g.result)});
  try{return JSON.parse(localStorage.getItem('cthulhu-x-'+key)||'null')}catch(_){return null}
 }
 async function kvSet(key,val){
  if(mode==='idb')return tx('readwrite',st=>{st.put(val,'x:'+key)});
  localStorage.setItem('cthulhu-x-'+key,JSON.stringify(val));
 }
 async function usage(){try{const e=await navigator.storage.estimate();return{used:e.usage||0,quota:e.quota||0}}catch(_){return null}}
 try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(_){}
 return{load,save,reload,importState,kvGet,kvSet,usage,tabId,get mode(){return mode},onStatus:f=>{statusCb=f},onRemote:f=>{remoteCb=f}};
})();
window.FichaStore=FichaStore;
