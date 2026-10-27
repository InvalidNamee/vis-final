/* Full-source audit. --partial supports development without claiming completion. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..'),partial=process.argv.includes('--partial');
const read=p=>fs.readFileSync(path.resolve(ROOT,p),'utf8');
const c={window:{},localStorage:{getItem:()=>null}};vm.createContext(c);
vm.runInContext(read('src/content/atlas.js').replace(/\nexport \{\};\s*$/,''),c);
const scenes=c.window.ATLAS.index.byScene;
function folders(dir){return fs.readdirSync(dir,{withFileTypes:true}).filter(e=>e.isDirectory()&&!e.name.startsWith('_')).flatMap(e=>{const p=path.join(dir,e.name);return [p,...folders(p)];});}
const packages=folders(path.join(ROOT,'plugins')).filter(p=>fs.existsSync(path.join(p,'case.json'))).map(folder=>({folder,manifest:JSON.parse(fs.readFileSync(path.join(folder,'case.json'),'utf8')),descriptor:fs.existsSync(path.join(folder,'plugin.json'))?JSON.parse(fs.readFileSync(path.join(folder,'plugin.json'),'utf8')):{}}));
const builtins=packages.filter(p=>p.descriptor.builtin!==false),coverage=new Map(),ids=new Set(),models=[];
function finite(value,location){if(typeof value==='number')assert(Number.isFinite(value),`${location}: nonfinite number`);else if(Array.isArray(value))value.forEach((v,i)=>finite(v,location+'['+i+']'));else if(value&&typeof value==='object')for(const[k,v]of Object.entries(value))finite(v,location+'.'+k);}
function numericSignature(result){return JSON.stringify({metrics:result.metrics,charts:result.charts,rows:result.rows});}
for(const {folder,manifest:m}of builtins){
  assert(!ids.has(m.id),'Duplicate ID '+m.id);ids.add(m.id);
  const sc=scenes[m.sceneId];assert(sc,`Unknown scene ${m.sceneId}`);
  assert.equal(sc.status,'full',`${m.id}: completed source scene still marked as pending`);
  assert(!coverage.has(sc.id),`More than one default for ${sc.id}`);coverage.set(sc.id,m.id);
  assert(m.title,`Case title missing: ${m.id}`);
  assert(m.tabs?.background?.sections?.length>=3,`${m.id}: business background incomplete`);
  assert(m.tabs?.workflow?.steps?.length>=3,`${m.id}: workflow incomplete`);
  const background=m.tabs.background.sections.map(s=>s.html||s.body||'').join('');
  const flow=m.tabs.workflow.metrics?.html||'';
  assert(/<svg\b|<canvas\b|<img\b/i.test(background),`${m.id}: explanatory background graphic missing`);
  assert(/<svg\b|<canvas\b|<img\b/i.test(flow),`${m.id}: explanatory workflow graphic missing`);
  assert(/https:\/\//.test(background),`${m.id}: primary references missing from page`);
  for(const title of [m.title,m.tabs.workflow.title,...m.tabs.background.sections.map(s=>s.title),...m.tabs.workflow.steps.map(s=>s.name)].filter(Boolean))assert(!/[?？]|为什么|怎样|怎么|如何/.test(title),`${m.id}: invalid title ${title}`);
  for(const filename of ['README.txt','研究依据.md',m.tabs.demo.html])assert(fs.existsSync(path.join(folder,filename)),`${m.id}: ${filename} missing`);
  const research=fs.readFileSync(path.join(folder,'研究依据.md'),'utf8');assert(/https:\/\//.test(research)&&/合成|教学/.test(research),`${m.id}: research/source boundary missing`);
  const modelPath=path.join(folder,'demo/model.js');
  if(fs.existsSync(modelPath)){
    const api=require(modelPath);
    if(typeof api.run==='function'&&api.defaults){
      const input=structuredClone(api.defaults),first=api.run(input),second=api.run(structuredClone(api.defaults));
      assert.deepEqual(first,second,`${m.id}: nondeterministic default run`);finite(first,m.id);
      assert(first.metrics?.length,`${m.id}: no computed metrics`);assert(first.charts?.length,`${m.id}: no data charts`);assert(first.rows?.length,`${m.id}: no export data`);
      const unchanged=[];let varied=0;
      for(const control of api.config?.controls||[]){
        if(control.type==='text'||control.type==='textarea'){
          const populated=api.run({...api.defaults,[control.key]:control.value||'井号：教学井；井深：2000 m；岩性：砂岩；总烃：2 %；井段：1980-2000 m'}),empty=api.run({...api.defaults,[control.key]:''});
          finite(populated,m.id+':text');finite(empty,m.id+':empty');
          if(numericSignature(populated)===numericSignature(empty))unchanged.push(control.key);else varied++;
          continue;
        }
        if(!Number.isFinite(control.min)||!Number.isFinite(control.max))continue;
        const low=api.run({...api.defaults,[control.key]:control.min}),high=api.run({...api.defaults,[control.key]:control.max});finite(low,m.id+':min');finite(high,m.id+':max');
        if(numericSignature(low)===numericSignature(high))unchanged.push(control.key);else varied++;
      }
      assert(varied>0,`${m.id}: parameters do not affect any computed output`);
      models.push({id:m.id,metrics:first.metrics.length,rows:first.rows.length,changedControls:varied,unchangedControls:unchanged});
    }
  }
}
const missing=Object.keys(scenes).filter(id=>!coverage.has(id));
if(!partial)assert.equal(missing.length,0,'Missing scenes: '+missing.join(', '));
const report={mode:partial?'partial-development':'complete-audit',builtins:builtins.length,scenes:Object.keys(scenes).length,covered:coverage.size,missing,uniformModels:models.length,models};
fs.mkdirSync(path.join(ROOT,'output/playwright'),{recursive:true});fs.writeFileSync(path.join(ROOT,'output/playwright/source-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,models:undefined},null,2));
