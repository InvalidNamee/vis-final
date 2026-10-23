// Compatibility guard for the shell migration; no browser, build or ZIP output.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const spec=JSON.parse(read('docs/contracts/shell-content-v1.json'));
const saved={};
function element(){return {style:{},innerHTML:'',children:[],appendChild(n){this.children.push(n);},setAttribute(){},addEventListener(){},attachShadow(){const s=element();s.host=this;return s;}};}
const c={console,TextEncoder,Uint8Array,Uint32Array,DataView,document:{addEventListener(){},createElement:element,documentElement:element()},localStorage:{getItem:k=>saved[k]||null,setItem:(k,v)=>saved[k]=v},addEventListener(){},removeEventListener(){},getComputedStyle(){return {getPropertyValue:()=>''};},location:{hash:''}};
c.window=c;vm.createContext(c);
for(const file of ['src/content/atlas.js','src/runtime/registry.js','src/runtime/kit.js','src/runtime/case-demo-host.js','src/services/packages.js','src/compat/admin.js'])vm.runInContext(read(file).replace(/^import .*fflate.*;\r?\n/,'').replace(/\nexport \{\};\s*$/,''),c,{filename:file});
for(const [name,keys] of Object.entries(spec.globalAPIs))for(const key of keys)assert(key in c[name],name+'.'+key+' missing');
for(const key of ['saveMethod','deleteMethod','saveScene','deleteScene','isUserScene','reindex'])assert.equal(typeof c.ATLAS[key],'function','management API '+key);
assert.equal(c.CaseDemoHost.resolveMode({files:[{name:'demo/index.html'}],demo:{mode:'auto'}}),'page');
assert.equal(c.CaseDemoHost.resolveMode({files:[{name:'demo/demo.js'}],demo:{mode:'auto'}}),'module');
assert.equal(c.CaseDemoHost.resolveMode({files:[],demo:{mode:'builtin'}}),'builtin');
const manifest=JSON.parse(read('plugins/seismic/s3/firstbreak-stalta/case.json'));
const rec={v:2,pkg:manifest,meta:manifest,files:[{name:'demo/index.html',enc:'text',size:100,data:'<!doctype html><title>fixture</title><p>legacy page</p>'}],savedAt:1};
saved['atlas.casepack.v2']=JSON.stringify([rec]);const original=saved['atlas.casepack.v2'];
c.CaseImport.loadSaved();const imported=c.Cases.get(manifest.id);assert(imported.imported);assert.equal(typeof imported.tabs.demo.mount,'function');
assert.equal(saved['atlas.casepack.v2'],original,'restoring storage must not rewrite records');
c.Cases.register({id:'builtin-fixture',sceneId:manifest.sceneId,title:'fixture',tabs:{}});
assert.equal(c.Cases.bySceneAll(manifest.sceneId)[0].id,manifest.id,'import priority changed');
for(const syntax of ['module.exports={mount:mount};','exports.mount=mount;','window.__CASE_MOUNT__=mount;']){
  c.cleanupCount=0;c.unmountCount=0;
  const script='function mount(root,api){window.moduleKeys=Object.keys(api).sort();api.onDestroy(function(){window.cleanupCount++;});return {unmount:function(){window.unmountCount++;}};}'+syntax;
  const handle=c.CaseDemoHost.create(element(),{demo:{mode:'module',js:'demo.js'},files:[{name:'demo.js',enc:'text',data:script}]},{scene:{id:'s3'},kase:imported});
  assert.deepEqual(Array.from(c.moduleKeys),spec.moduleAPI.slice().sort());handle.destroy();assert.equal(c.cleanupCount,1);assert.equal(c.unmountCount,1);
}
console.log('PASS: module/import/admin APIs, original storage restoration, import priority, page/module/builtin modes and three module export lifecycles');
