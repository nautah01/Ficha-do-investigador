/* Carrega rules-data.js + rules.js (sem DOM) e devolve as funções para os testes. */
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const code=['rules-data.js','rules.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
const names='gen genBlank calc dbBuild base BASE EXTRA SPECIAL_BASE OCC SEC SUB ATTR_KEYS ATTR_RANGE POINT_BUY_TOTAL SKILL_CAP normAttr pointBuyUsed pointBuyValid pointBuyStart rollAttrs sanMaxOf migrateSkillNames skillCapFor creditLiving creditLevelName fmtMoney chancesOf damageText malfText sanitizeSheet sanitizeState blankBudgetState isOccupationalSkill occupationChoiceSlots occupationChoiceUsage occupationChoiceRemaining occupationChoiceType isSocialChoiceAvailable occupationPointTotal occupationFor creditBounds isBudget resetBlankDistribution ensureSkillBudget skillFloor falta get rollLevel ROLL_LABEL'.split(' ');
module.exports=new Function('window',code+';return {'+names.join(',')+'}')({BGSEL:{}});
