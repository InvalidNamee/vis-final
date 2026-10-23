/* Code-level checks: real importer/iframe inlining, model isolation, constraints,
   rendering and event handlers with a minimal DOM. This is not browser visual QA. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const keys=['rop','warning','trajectory','failure','fluid'];
const plain=v=>JSON.parse(JSON.stringify(v));
function filesAt(folder){return fs.readdirSync(path.join(ROOT,folder),{withFileTypes:true}).flatMap(e=>e.isDirectory()?filesAt(folder+'/'+e.name):[{name:folder+'/'+e.name,size:fs.statSync(path.join(ROOT,folder,e.name)).size,enc:'text',data:read(folder+'/'+e.name)}]);}
function context(store={}){
  const nodes=new Map(),events=[];const node=id=>{if(!nodes.has(id))nodes.set(id,{id,value:'',innerHTML:'',textContent:'',hidden:false,style:{},listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},setAttribute(){},appendChild(){},click(){this.clicked=true;},classList:{add(){},remove(){}}});return nodes.get(id);};
  const c={console,TextEncoder,TextDecoder,Blob,Uint8Array,Uint32Array,DataView,URL:{createObjectURL(){return 'blob:synthetic-test';},revokeObjectURL(){}},setTimeout(fn){fn();return 1;},clearTimeout(){},setInterval(){return 1;},clearInterval(){},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]},document:{getElementById:node,addEventListener(type,fn){events.push({type,fn});},createElement:()=>node('created'+nodes.size),body:node('body'),documentElement:node('html')},addEventListener(){},parent:{postMessage(){}},location:{hash:''},btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary')};
  c.window=c;c.nodes=nodes;vm.createContext(c);return c;
}
function run(c,p){vm.runInContext(read(p),c,{filename:p,timeout:30000});}
function portal(store){const c=context(store);for(const p of ['assets/data.js','assets/core/registry.js','assets/core/kit.js','assets/core/case-demo-host.js','assets/core/case-upload.js'])run(c,p);return c;}
function pack(folder){const manifest=JSON.parse(read(folder+'/case.json')),files=filesAt(folder+'/demo').map(f=>({...f,name:f.name.slice(folder.length+1)}));return {manifest,files};}
let importChecks=0,renderChecks=0,scenarios=0;
// Use original import validation, store-restoration path and srcdoc builder.
for(const folder of [...keys.map(k=>'drilling-'+k+'-case'),'firstbreak-pick-case']){
  const p=pack(folder),c=portal({});
  // check() exposes the original UI validation; its closure keeps the file list.
  // Test-only injection of files leaves the production importer unchanged.
  const importer=read('assets/core/case-upload.js').replace('check: function (pkg, meta) { return checkAll(pkg, meta, S.files); }','check: function (pkg, meta, files) { return checkAll(pkg, meta, files); }');
  vm.runInContext(importer,c);
  const checks=c.CaseImport.check(p.manifest,p.manifest,p.files);
  assert.equal(checks.filter(r=>r.level==='error').length,0,folder+': '+JSON.stringify(checks));importChecks++;
  const records=[{v:2,pkg:p.manifest,meta:p.manifest,files:p.files,savedAt:Date.now()}];
  const restored=portal({'atlas.casepack.v2':JSON.stringify(records)}),kase=restored.Cases.get(p.manifest.id);
  assert(kase&&kase.imported&&typeof kase.tabs.demo.mount==='function');
  assert.equal(restored.Cases.validate(kase).filter(r=>r.level==='error').length,0);
  const doc=c.CaseDemoHost.buildPageDoc({files:p.files,demo:p.manifest.tabs.demo},'verification');
  assert(!/<script\b[^>]*\ssrc\s*=|<link\b[^>]*stylesheet/i.test(doc),'unresolved script/style in '+folder);
  assert(!/\b(?:fetch|XMLHttpRequest)\s*\(/.test(p.files.map(f=>f.data).join('\n')),'network dependency');
  const rendering=context();
  for(const tag of doc.matchAll(/<(?:input|select)\b[^>]*>/gi)){
    const id=/\bid="([^"]+)"/.exec(tag[0]),value=/\bvalue="([^"]*)"/.exec(tag[0]);
    if(id&&value)rendering.document.getElementById(id[1]).value=value[1];
  }
  rendering.document.getElementById('rock').value='0';
  for(const script of doc.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi))vm.runInContext(script[1],rendering,{timeout:30000});
  // Verify that executing the actual inlined scripts produced chart markup.
  assert([...rendering.nodes.values()].some(n=>/\b(?:path|circle|rect)\b/.test(n.innerHTML)),folder+' did not render');
  renderChecks++;
}
// Built-in adapters are generated from the same source; imports win after refresh.
const builtins=portal({});
for(const k of keys){
  const p=pack('drilling-'+k+'-case');run(builtins,'assets/cases/'+p.manifest.id+'.case.js');
  const kase=builtins.Cases.byScene(p.manifest.sceneId);assert.equal(kase.title,p.manifest.title);
  let captured;builtins.CaseDemoHost.create=(root,pkg)=>{captured=pkg;return {destroy(){}};};
  kase.tabs.demo.mount({},{});
  const normalize=files=>plain(files).map(f=>({...f,data:f.data.replace(/\r\n/g,'\n')})).sort((a,b)=>a.name.localeCompare(b.name));
  assert.equal(JSON.stringify(normalize(captured.files)),JSON.stringify(normalize(p.files)),p.manifest.id+' source/adapter drift');
  assert.equal(builtins.Cases.validate(kase).filter(r=>r.level==='error').length,0);
}
for(const k of keys){const p=pack('drilling-'+k+'-case'),rec={v:2,pkg:p.manifest,meta:p.manifest,files:p.files};const c=portal({'atlas.casepack.v2':JSON.stringify([rec])});run(c,'assets/cases/'+p.manifest.id+'.case.js');assert(c.Cases.get(p.manifest.id).imported,'built-in must preserve restored upload');}

const W=require('../drilling-warning-case/demo/model.js');
for(const kind of ['normal','kick','loss','stuck'])for(const noise of [.5,1,3]){
  const raw=W.generate(kind,noise);assert.deepEqual(raw,W.generate(kind,noise));
  const model=W.calibrate(raw.slice(0,60)),all=W.score(raw,model,2,3),prefix=W.score(raw.slice(0,110),model,2,3);
  assert.deepEqual(prefix,all.slice(0,110),'warning future leakage');
  for(const threshold of [.5,2,6])for(const persistence of [1,3,8]){const rows=W.score(raw,model,threshold,persistence),e=W.evaluate(rows);assert.equal(e.tp+e.fp+e.fn+e.tn,60);if(kind==='normal'){assert.equal(e.recall,null);assert.equal(e.lead,null);}assert(rows.every(r=>Number.isFinite(r.score)));scenarios++;}
}
const T=require('../drilling-trajectory-case/demo/model.js'),model=T.identify();
for(const angle of [5,20,65])for(const target of [100,250,380])for(const limit of [.5,2,3])for(const disturbance of [-.6,0,.6]){
  const s={angle,target,limit,disturbance},a=T.simulate(s,true),b=T.simulate(s,false);
  assert(Number.isFinite(a.miss)&&a.rows.length<=21);assert.equal(b.rows.length,21);
  const p={x:0,z:0,angle,u:0,dls:0},pick=T.search(p,{x:target,z:500},s,model);
  if(pick.best){let q=p;for(const u of pick.best.sequence){const next=T.advance(q,u,model.drift,model.gain);assert(next.dls<=limit+1e-9&&next.angle>=0&&next.angle<=85);q=next;}}
  scenarios++;
}
const R=require('../drilling-failure-case/demo/model.js');
for(const load of [.8,1.3,1.6])for(const time of [20,70,160])for(const window of [6,16,30]){
  const rows=R.generate(load),e=R.estimate(rows,time,window),cut=R.estimate(rows.slice(0,time+1),time,window);assert.deepEqual(e,cut,'RUL future leakage');
  const poisoned=rows.map(r=>({...r,damage:9999}));assert.deepEqual(e,R.estimate(poisoned,time,window),'hidden truth must not enter predictor');
  if(e.rul!==null){assert(e.rul>=0&&e.low<=e.high);}
  const v=R.evaluate(rows,window,time);if(!rows.some(r=>r.damage>=1&&r.t<=time)){assert.equal(v.mae,null);assert.equal(v.n,0);}scenarios++;
}
const F=require('../drilling-fluid-case/demo/model.js'),data=F.generate(),fit=F.train(data);
assert.deepEqual(data,F.generate());assert(fit.score.pv<fit.baseline.pv&&fit.score.yp<fit.baseline.yp);
const changed=F.train(data.map(r=>r.split==='test'?{...r,pv:r.pv+1000,yp:r.yp-1000}:r));assert.deepEqual(fit.model.beta,changed.model.beta);assert.equal(fit.model.lambda,changed.model.lambda);
const sets=['train','validation','test'].map(split=>new Set(data.filter(r=>r.split===split).map(r=>r.batch)));
assert.deepEqual(sets.map(s=>s.size),[12,3,3]);for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)for(const id of sets[i])assert(!sets[j].has(id));
for(const temp of [30,70,110])for(const solids of [2,5,8])for(const pvMin of [10,17,28]){
 const s={temp,solids,pvMin,pvMax:22,ypMin:13,ypMax:16},o=F.optimize(fit.model,s);assert.equal(o.grid.length,961);
 const valid=o.grid.filter(r=>r.valid);if(!valid.length)assert.equal(o.best,null);else{assert(o.best.valid);assert.equal(o.best.cost,Math.min(...valid.map(r=>r.cost)));}scenarios++;
}
// All min/max controls must produce finite plots and derived metrics. Exercise UI handlers.
for(const k of keys.slice(1)){
 const c=context();run(c,'drilling-'+k+'-case/demo/model.js');let config;c.CaseUI={f:(v,n=2)=>v===null?'不可定义':v.toFixed(n),mount:v=>config=v};run(c,'drilling-'+k+'-case/demo/demo.js');
 const defaults=Object.fromEntries(config.controls.map(a=>[a.id,a.value]));
 run(c,'drilling-'+k+'-case/demo/ui.js');
 const states=[defaults,...config.controls.flatMap(a=>a.options?a.options.map(o=>({...defaults,[a.id]:o[0]})):[{...defaults,[a.id]:a.min},{...defaults,[a.id]:a.max}])];
 for(const state of states){const result=config.compute(state);for(const p of result.plots){for(const series of p.series)for(const point of series.points)assert(point.every(Number.isFinite),k+' nonfinite point');const markup=c.CaseUI.plot(p,0);assert(!/NaN|Infinity|undefined/.test(markup),k+' invalid SVG');}assert(result.records.length);scenarios++;}
 c.CaseUI.mount(config);const input=config.controls[0];c.nodes.get(input.id).value=input.options?input.options.at(-1)[0]:input.max;c.nodes.get(input.id).listeners[input.options?'change':'input']();
 assert(c.nodes.get('metrics').innerHTML.includes('<strong>'));c.nodes.get('reset').onclick();assert.equal(c.nodes.get(input.id).value,input.value);
 c.nodes.get('download').onclick();
 if(!c.nodes.get('apply').hidden){c.nodes.get('apply').onclick();assert(c.nodes.get('status').textContent);}
}
console.log(JSON.stringify({checks:'PASS',importerPackages:importChecks,inlinedDemosExecuted:renderChecks,derivedScenarios:scenarios,fluidLambda:fit.model.lambda,fluidTest:fit.score,fluidBaseline:fit.baseline,visualBrowserQA:'not performed; browser file URL policy'},null,2));
