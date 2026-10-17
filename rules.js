/* Regras puras de CoC 7E usadas pela ficha. Mantidas fora do DOM para facilitar revisão e testes. */
(()=>{
 const floor=n=>Math.floor(Number(n)||0);
 function baseSkill(name,characteristics){
  if(name==='Esquivar')return floor(characteristics.DES/2);
  if(name==='Língua Natural')return floor(characteristics.EDU);
  if(String(name).startsWith('Língua ('))return 1;
  return undefined;
 }
 function derived(characteristics,{movementPenalty=0}={}){
  const sum=floor(characteristics.FOR)+floor(characteristics.TAM);
  const [db,build]=sum<65?['-2',-2]:sum<85?['-1',-1]:sum<125?['0',0]:sum<165?['+1d4',1]:['+1d6',2];
  const baseMove=characteristics.FOR>characteristics.TAM&&characteristics.DES>characteristics.TAM?9:(characteristics.FOR<characteristics.TAM&&characteristics.DES<characteristics.TAM?7:8);
  return{hp:floor((characteristics.CON+characteristics.TAM)/10),san:floor(characteristics.POD),sanMax:99,pm:floor(characteristics.POD/5),mov:Math.max(0,baseMove-floor(movementPenalty)),db,corpo:build};
 }
 function occupationPointTotal(formulas,characteristics,choice=0){
  const list=String(formulas||'').split('|');
  const formula=list[Math.max(0,Math.min(list.length-1,floor(choice)))];
  if(!formula)return 0;
  return Math.max(0,formula.split('+').reduce((sum,term)=>{const[key,multiplier]=term.split('*');return sum+(Number(characteristics[key])||0)*(Number(multiplier)||0)},0));
 }
 function ageProfile(age){
  const n=Number(age);
  const invalid={valid:false,physicalLoss:0,physicalCharacteristics:[],singlePhysicalLoss:false,appLoss:0,movementPenalty:0,eduChecks:0,eduLoss:0,luckRolls:0};
  if(!Number.isInteger(n)||n<15)return invalid;
  if(n<20)return{valid:true,physicalLoss:5,physicalCharacteristics:['FOR','TAM'],singlePhysicalLoss:true,appLoss:0,movementPenalty:0,eduChecks:0,eduLoss:5,luckRolls:2};
  if(n<40)return{valid:true,physicalLoss:0,physicalCharacteristics:[],singlePhysicalLoss:false,appLoss:0,movementPenalty:0,eduChecks:1,eduLoss:0,luckRolls:0};
  if(n<50)return{valid:true,physicalLoss:5,physicalCharacteristics:['FOR','CON','DES'],singlePhysicalLoss:false,appLoss:5,movementPenalty:1,eduChecks:2,eduLoss:0,luckRolls:0};
  if(n<60)return{valid:true,physicalLoss:10,physicalCharacteristics:['FOR','CON','DES'],singlePhysicalLoss:false,appLoss:10,movementPenalty:2,eduChecks:3,eduLoss:0,luckRolls:0};
  if(n<70)return{valid:true,physicalLoss:20,physicalCharacteristics:['FOR','CON','DES'],singlePhysicalLoss:false,appLoss:15,movementPenalty:3,eduChecks:4,eduLoss:0,luckRolls:0};
  if(n<80)return{valid:true,physicalLoss:40,physicalCharacteristics:['FOR','CON','DES'],singlePhysicalLoss:false,appLoss:20,movementPenalty:4,eduChecks:4,eduLoss:0,luckRolls:0};
  if(n<90)return{valid:true,physicalLoss:80,physicalCharacteristics:['FOR','CON','DES'],singlePhysicalLoss:false,appLoss:25,movementPenalty:5,eduChecks:4,eduLoss:0,luckRolls:0};
  return{valid:true,physicalLoss:80*Math.floor(n/10)-640,physicalCharacteristics:['FOR','CON','DES'],singlePhysicalLoss:false,appLoss:25,movementPenalty:Math.floor(n/10)-3,eduChecks:0,eduLoss:0,luckRolls:0};
 }
 window.CoCRules=Object.freeze({baseSkill,derived,occupationPointTotal,ageProfile});
})();
