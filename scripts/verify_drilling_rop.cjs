const assert = require('node:assert/strict');
const m = require('../drilling-rop-case/demo/demo.js');
const data = m.generate(20261023);
assert.deepEqual(data,m.generate(20261023),'fixed seed must reproduce data');
assert.equal(data.length,1080);
const sets = ['train','validation','test'].map(s => new Set(data.filter(r=>r.split===s).map(r=>r.well)));
assert.deepEqual(sets.map(s=>s.size),[12,3,3]);
for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)for(const id of sets[i])assert(!sets[j].has(id),'well leakage');
const fit=m.train(data);
assert(fit.score.mae<fit.baseline.mae,'regression should outperform mean baseline');
assert(Number.isFinite(fit.score.r2));
assert.equal(m.evaluate({predict:()=>1},[{rop:1},{rop:1}]).r2,null);
// Changing test labels must not affect fitted coefficients or model selection.
const perturbed=m.train(data.map(r=>r.split==='test'?{...r,rop:r.rop+1000}:r));
assert.equal(perturbed.model.lambda,fit.model.lambda);
assert.deepEqual(perturbed.model.beta,fit.model.beta);
let count=0;
for(const rock of [0,1,2])for(const flow of [18,28,38])for(const maxWob of [40,100,160])for(const maxRpm of [60,140,220]){
 const s={rock,flow,maxWob,maxRpm}; const o=m.optimize(fit.model,s);
 assert.equal(o.grid.length,1271);
 assert(o.best.wob<=maxWob && o.best.rpm<=maxRpm);
 assert(o.best.value>=fit.model.predict({...s,wob:40,rpm:60})-1e-10);
 assert(o.grid.every(p=>Number.isFinite(p.value)&&p.value>=0.5));
 count++;
}
console.log(JSON.stringify({checks:'PASS',constraintScenarios:count,lambda:fit.model.lambda,test:fit.score,baseline:fit.baseline},null,2));
