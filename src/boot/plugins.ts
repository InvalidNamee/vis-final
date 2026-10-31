import {showLoading} from '../ui/loader';
import type {CaseDef,CaseFile,DemoHandle} from '../types';

/* Builtin cases: plugins/<stageId>/<sceneId>/<caseId>/case.json, discovered at build time.
   Demo resources load only when a demo mounts; Vite splits them per stage. */
const manifests=import.meta.glob('../../plugins/**/case.json',{eager:true,import:'default'}) as Record<string,any>;
const descriptors=import.meta.glob('../../plugins/**/plugin.json',{eager:true,import:'default'}) as Record<string,any>;
const texts=import.meta.glob(['../../plugins/**/*.{html,htm,js,mjs,cjs,css,svg,json,csv,txt,md}','!../../plugins/_templates/**','!../../plugins/**/case.json','!../../plugins/**/plugin.json'],{query:'?raw',import:'default'});
const urls=import.meta.glob(['../../plugins/**/*','!../../plugins/**/*.{html,htm,js,mjs,cjs,css,svg,json,csv,txt,md}','!../../plugins/_templates/**'],{query:'?url',import:'default'});
// Traditional plugins call Cases.register() themselves.
const legacy=import.meta.glob(['../../plugins/**/*.case.js','!../../plugins/_templates/**']);
const legacyDemo=import.meta.glob(['../../plugins/**/*.demo.js','!../../plugins/_templates/**']);
const resourcePaths=[...new Set([...Object.keys(texts),...Object.keys(urls)])];
const registrations=new Map<string,()=>void>();

async function loadFile(path:string,name:string):Promise<CaseFile>{
  if(texts[path]){
    const data=String(await texts[path]());
    return {name,enc:'text',data,size:new TextEncoder().encode(data).length};
  }
  const response=await fetch(String(await urls[path]()));
  if(!response.ok)throw Error(`Resource HTTP ${response.status}: ${name}`);
  const blob=await response.blob();
  return window.__PackageService.readOne(new File([blob],name,{type:blob.type}));
}

// A newer mount or an unmount cancels a load still in flight.
function lazyDemo(kase:CaseDef,cfg:Record<string,any>,base:string){
  let handle:DemoHandle|null=null,epoch=0;
  function mount(root:HTMLElement,ctx:Record<string,unknown>):void{
    const token=++epoch;
    showLoading(root,{title:'案例演示',message:'正在加载演示资源…'});
    const entries=resourcePaths.filter(p=>p.startsWith(base));
    Promise.all(entries.map(p=>loadFile(p,p.slice(base.length)))).then(files=>{
      if(token!==epoch)return;
      root.textContent='';
      handle=window.CaseDemoHost.create(root,{files,demo:cfg,meta:kase},ctx);
    }).catch((error:Error)=>{
      if(token!==epoch)return;
      showLoading(root,{title:'演示加载失败',message:error.message,error:true,retry:()=>mount(root,ctx)});
    });
  }
  return {label:cfg.label,intro:cfg.intro,mount,unmount(){epoch++;handle?.destroy();handle=null;}};
}

export async function registerPlugins(){
  const ids=new Set<string>();
  for(const [path,manifest] of Object.entries(manifests)){
    const [stage,scene,id]=path.replace('../../plugins/','').split('/');
    if(ids.has(manifest.id))throw Error(`Duplicate plugin ID: ${manifest.id}`);
    ids.add(manifest.id);
    if(manifest.id!==id||manifest.sceneId!==scene||window.ATLAS.index.byScene[scene]?.stageId!==stage)throw Error(`Plugin classification mismatch: ${path}`);
    // Reference/import fixtures can coexist with a replacement builtin case.
    if(descriptors[path.replace('case.json','plugin.json')]?.builtin===false)continue;
    const register=()=>{
      if(window.Cases.get(id)||window.CaseImport.blockedList().includes(id))return;
      const kase=structuredClone(manifest) as CaseDef&{tabs:{demo:any}};
      kase.tabs.demo=lazyDemo(kase,kase.tabs.demo,path.slice(0,-'case.json'.length));
      kase.status='ready';
      window.ATLAS.index.byScene[scene].demo=true;
      window.Cases.register(kase);
    };
    registrations.set(id,register);
    register();
  }
  for(const path of Object.keys(legacy).sort()){
    await legacy[path]();
    const demo=path.replace('.case.js','.demo.js');
    if(legacyDemo[demo])await legacyDemo[demo]();
  }
  // Hidden traditional plugins are removed after their own registration ran.
  for(const id of window.CaseImport.blockedList())if(!window.Cases.get(id)?.imported)window.Cases.unregister(id);
  window.__restorePlugin=id=>{
    const register=registrations.get(id);
    if(register)register();else location.reload();
    window.dispatchEvent(new Event('atlas:changed'));
  };
}
