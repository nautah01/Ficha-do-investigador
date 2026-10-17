const test=require('node:test'),assert=require('node:assert/strict');
const R=require('./load.js');

test('Bônus de Dano e Corpo em todas as faixas (inclusive acima de 204)',()=>{
 const t=[[2,'-2',-2],[64,'-2',-2],[65,'-1',-1],[84,'-1',-1],[85,'0',0],[124,'0',0],[125,'+1d4',1],[164,'+1d4',1],[165,'+1d6',2],[204,'+1d6',2],[205,'+2d6',3],[284,'+2d6',3],[285,'+3d6',4],[364,'+3d6',4],[365,'+4d6',5]];
 for(const[sum,db,corpo]of t){const c=R.calc({FOR:sum,TAM:0,CON:50,POD:50,DES:50});assert.equal(c.db,db,'db '+sum);assert.equal(c.corpo,corpo,'corpo '+sum)}
});
test('PV, PM, SAN inicial e Mov',()=>{
 const c=R.calc({FOR:60,CON:70,TAM:50,POD:65,DES:60});
 assert.equal(c.hp,12);assert.equal(c.pm,13);assert.equal(c.san,65);assert.equal(c.mov,9);
 assert.equal(R.calc({FOR:40,CON:50,TAM:60,POD:50,DES:40}).mov,7);
 assert.equal(R.calc({FOR:60,CON:50,TAM:60,POD:50,DES:40}).mov,8);
});
test('Valores-base corrigidos e especializações',()=>{
 const c={DES:60,EDU:70};
 assert.equal(R.base('Consertos Mecânicos',c),10);
 assert.equal(R.base('Consertos Elétricos',c),10);
 assert.equal(R.base('Armas de Fogo (Submetralhadora)',c),15);
 assert.equal(R.base('Lutar (Espada)',c),20);
 assert.equal(R.base('Mitos de Cthulhu',c),0);
 assert.equal(R.base('Pilotar (outra)',c),1);
 assert.ok(!('Mythos de Cthulhu' in R.EXTRA));
});
test('Pontos ocupacionais de Atleta e Andarilho: soma só o MELHOR atributo alternativo',()=>{
 const c={EDU:70,APA:80,DES:50,FOR:60};
 const at=R.OCC.find(o=>o.n==='Atleta'),an=R.OCC.find(o=>o.n==='Andarilho');
 assert.equal(R.occupationPointTotal(at,c),70*2+60*2);
 assert.equal(R.occupationPointTotal(an,c),70*2+80*2);
});
test('Atributos: faixas, múltiplos de 5 e compra de pontos (460)',()=>{
 assert.equal(R.normAttr('FOR',7),15);assert.equal(R.normAttr('FOR',200),90);assert.equal(R.normAttr('FOR',62),60);
 assert.equal(R.normAttr('TAM',20),40);assert.equal(R.normAttr('EDU',99),90);
 assert.equal(R.normAttr('FOR',0,true),0);
 const s=R.pointBuyStart();assert.equal(R.pointBuyUsed(s),195);assert.equal(R.POINT_BUY_TOTAL-195,265);
 const ok={FOR:60,CON:60,POD:60,DES:60,APA:60,TAM:60,INT:60,EDU:40};assert.equal(R.pointBuyUsed(ok),460);assert.ok(R.pointBuyValid(ok));
 assert.ok(!R.pointBuyValid({...ok,EDU:45}));
 for(let i=0;i<500;i++){const c=R.rollAttrs();for(const k of R.ATTR_KEYS){const[a,b]=R.ATTR_RANGE[k];assert.ok(c[k]>=a&&c[k]<=b&&c[k]%5===0,k+' '+c[k])}}
});
test('Gerador: teto de 75% respeitado, créditos na faixa e orçamento coerente',()=>{
 let n=0;
 for(const o of R.OCC)for(let k=0;k<60;k++){
  const p=R.gen(o.n,'*');n++;
  assert.ok(p.budget&&p.skillAllocations&&p.skillFloors);
  const cr=p.sk['Nível de Crédito'],range=R.creditBounds(p);
  assert.ok(cr>=range.min&&cr<=range.max,'crédito '+o.n);
  for(const[name,v]of Object.entries(p.sk)){
   const a=p.skillAllocations[name]||{occupational:0,personal:0},floor=p.skillFloors[name];
   assert.equal(v,floor+a.occupational+a.personal,`${o.n}/${name}: valor ${v} ≠ piso ${floor} + alocado`);
   if(name==='Nível de Crédito')continue;
   const bonus=floor-Math.max(0,+R.base(name,p.c)||0);
   assert.ok(v-bonus<=75,`${o.n}/${name}: ${v} (bônus ${bonus}) passa do teto de 75 por pontos gastos`);
  }
  const st=R.blankBudgetState(p);
  assert.ok(st.occupational.used<=st.occupational.total,`${o.n}: ocupacionais gastos ${st.occupational.used} > ${st.occupational.total}`);
  assert.ok(st.personal.used<=st.personal.total,`${o.n}: pessoais gastos ${st.personal.used} > ${st.personal.total}`);
  for(const[name,a]of Object.entries(p.skillAllocations))if(a.occupational>0&&name!=='Nível de Crédito')assert.ok(R.isOccupationalSkill(p,name),`${o.n}: ${name} não é perícia ocupacional válida`);
 }
 assert.ok(n>=1000);
});
test('SAN máxima = 99 − Mitos de Cthulhu',()=>{
 assert.equal(R.sanMaxOf({sk:{}}),99);assert.equal(R.sanMaxOf({sk:{'Mitos de Cthulhu':12}}),87);assert.equal(R.sanMaxOf({sk:{'Mitos de Cthulhu':150}}),0);
 const p={sk:{'Mythos de Cthulhu':5},custom:{},removed:{}};R.migrateSkillNames(p);assert.deepEqual(p.sk,{'Mitos de Cthulhu':5});
});
test('Crédito: gastos, dinheiro e bens (tabela do livro)',()=>{
 let l=R.creditLiving(0);assert.deepEqual([l.spend,l.cash,l.assets],[.5,.5,0]);
 l=R.creditLiving(5);assert.deepEqual([l.spend,l.cash,l.assets],[2,5,50]);
 l=R.creditLiving(30);assert.deepEqual([l.spend,l.cash,l.assets],[10,60,1500]);
 l=R.creditLiving(60);assert.deepEqual([l.spend,l.cash,l.assets],[50,300,30000]);
 l=R.creditLiving(95);assert.deepEqual([l.spend,l.cash,l.assets],[250,1900,190000]);
 l=R.creditLiving(99);assert.deepEqual([l.spend,l.cash,l.assets],[5000,50000,5000000]);
 l=R.creditLiving(30,20);assert.deepEqual([l.spend,l.cash,l.assets],[200,1200,30000]);
 assert.equal(R.creditLevelName(0),'Sem recursos');assert.equal(R.creditLevelName(9),'Pobre');assert.equal(R.creditLevelName(49),'Médio');assert.equal(R.creditLevelName(89),'Abastado');assert.equal(R.creditLevelName(98),'Rico');assert.equal(R.creditLevelName(99),'Podre de rico');
});
test('Combate: chances e texto de dano com Bônus de Dano',()=>{
 assert.deepEqual(R.chancesOf(65),{n:65,h:32,e:13});assert.deepEqual(R.chancesOf(1),{n:1,h:0,e:0});
 assert.equal(R.damageText('1D8 + BD','+1d4'),'1D8 +1D4');assert.equal(R.damageText('1D8 + BD','0'),'1D8');assert.equal(R.damageText('1D6 + BD','-1'),'1D6 − 1');
 assert.equal(R.damageText('1D3 + metade do BD','0'),'1D3');assert.match(R.damageText('1D3 + metade do BD','+1d4'),/½ BD/);
 assert.equal(R.damageText('2D6+4','+1d4'),'2D6+4');assert.equal(R.malfText(100),'100');assert.equal(R.malfText(96),'96–100');assert.equal(R.malfText(null),'—');
});
test('Sanitização: descarta lixo, escapa nomes perigosos e bloqueia poluição de protótipo',()=>{
 assert.equal(R.sanitizeSheet(null),null);assert.equal(R.sanitizeSheet({x:1}),null);
 const raw=JSON.parse('{"nome":"<img src=x onerror=alert(1)>","c":{"FOR":"60","CON":5000},"sk":{"Boa\\"><script>":50,"__proto__":{"x":1},"Encontrar":"3000"},"der":{"db":"<b>+1d4</b>"},"portrait":{"src":"javascript:alert(1)"},"equipment":[{"uid":"a b","img":"javascript:alert(1)","name":"x"}],"__proto__":{"poluido":true}}');
 const p=R.sanitizeSheet(raw);
 assert.equal(p.c.FOR,60);assert.equal(p.c.CON,999);assert.equal(p.sk['Encontrar'],999);
 assert.ok(!Object.keys(p.sk).some(k=>/[<>"]/.test(k)));assert.ok(!('poluido' in {}));assert.equal(p.portrait,undefined);
 assert.equal(p.equipment[0].img,'');assert.match(p.equipment[0].uid,/^[\w-]+$/);assert.match(p.der.db,/^[0-9dD+\-\s]*$/);
});
test('Estado importado: limita quantidade e descarta fichas inválidas',()=>{
 const good=R.gen('*','');const s=R.sanitizeState({cur:[good,{foo:1},null],occ:'x',qty:99,zTop:5});
 assert.equal(s.cur.length,1);assert.equal(s.qty,8);assert.equal(R.sanitizeState({cur:'x'}),null);
});
test('Nível de sucesso do d100 (inclui crítico e falha crítica)',()=>{
 assert.equal(R.rollLevel(1,10),'crit');assert.equal(R.rollLevel(100,80),'fumble');assert.equal(R.rollLevel(96,40),'fumble');assert.equal(R.rollLevel(96,60),'fail');
 assert.equal(R.rollLevel(13,65),'extreme');assert.equal(R.rollLevel(14,65),'hard');assert.equal(R.rollLevel(32,65),'hard');assert.equal(R.rollLevel(33,65),'regular');assert.equal(R.rollLevel(65,65),'regular');assert.equal(R.rollLevel(66,65),'fail');
});
