const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const expected=require('../tests/fixtures/original-titles.json');
const context={window:{},localStorage:{getItem:()=>null}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../src/content/atlas.js'),'utf8').replace(/\nexport \{\};\s*$/,''),context);
const a=context.window.ATLAS;
const actual={title:a.meta.title,stages:Object.fromEntries(a.stages.map(s=>[s.id,s.name])),scenes:Object.fromEntries(Object.values(a.index.byScene).map(s=>[s.id,s.name])),methods:Object.fromEntries(Object.entries(a.methods).map(([k,v])=>[k,v.name]))};
assert.deepEqual(JSON.parse(JSON.stringify(actual)),expected);
console.log(`PASS: original ${a.stages.length} module titles and ${Object.keys(a.index.byScene).length} scene titles preserved`);
