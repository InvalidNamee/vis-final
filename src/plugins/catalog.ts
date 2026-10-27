import type { CaseFile } from '../types';
const manifests = import.meta.glob('../../plugins/**/case.json', { eager:true, import:'default' }) as Record<string, any>;
const descriptors = import.meta.glob('../../plugins/**/plugin.json', { eager:true, import:'default' }) as Record<string, any>;
const texts = import.meta.glob(['../../plugins/**/*.{html,htm,js,mjs,cjs,css,svg,json,csv,txt,md}','!../../plugins/_templates/**','!../../plugins/**/case.json','!../../plugins/**/plugin.json'], { query:'?raw', import:'default' });
const urls = import.meta.glob(['../../plugins/**/*','!../../plugins/**/*.{html,htm,js,mjs,cjs,css,svg,json,csv,txt,md}','!../../plugins/_templates/**'], { query:'?url', import:'default' });
const resourcePaths=[...new Set([...Object.keys(texts),...Object.keys(urls)])];
const legacy = import.meta.glob(['../../plugins/**/*.case.js', '!../../plugins/_templates/**']);
const legacyDemo = import.meta.glob(['../../plugins/**/*.demo.js', '!../../plugins/_templates/**']);
const registrations = new Map<string,()=>void>();
export const catalog = Object.entries(manifests).map(([path,manifest])=>({path,manifest}));

export async function initializePlugins(){
  const ids=new Set<string>();
  for(const {path,manifest} of catalog){
    const [stage,scene,id]=path.replace('../../plugins/','').split('/');
    if(ids.has(manifest.id))throw Error(`Duplicate plugin ID: ${manifest.id}`);
    ids.add(manifest.id);
    if(manifest.id!==id || manifest.sceneId!==scene || window.ATLAS.index.byScene[scene]?.stageId!==stage)throw Error(`Plugin classification mismatch: ${path}`);
    // Reference/import fixtures can coexist with a replacement built-in case.
    if(descriptors[path.replace('case.json','plugin.json')]?.builtin===false)continue;
    const register=()=>{
      if(window.Cases.get(id)||window.CaseImport.blockedList().includes(id))return;
      const c=structuredClone(manifest),cfg=c.tabs.demo,base=path.slice(0,-'case.json'.length);
      let handle:any=null,epoch=0;
      c.tabs.demo={label:cfg.label,intro:cfg.intro,mount(root:HTMLElement,ctx:any){
        const token=++epoch;root.textContent='演示资源加载中…';
        const entries=resourcePaths.filter(p=>p.startsWith(base));
        Promise.all(entries.map(async p=>{
          const name=p.slice(base.length);
          if(texts[p]){
            const data=String(await texts[p]());return {name,enc:'text',data,size:new TextEncoder().encode(data).length} as CaseFile;
          }
          const response=await fetch(String(await urls[p]()));if(!response.ok)throw Error(`Resource HTTP ${response.status}: ${name}`);
          const blob=await response.blob();return window.__PackageService.readOne(new File([blob],name,{type:blob.type}));
        })).then(files=>{if(token!==epoch)return;root.textContent='';handle=window.CaseDemoHost.create(root,{files,demo:cfg,meta:c},ctx);})
          .catch(error=>{if(token!==epoch)return;root.textContent=`演示加载失败：${error.message}。`;const button=document.createElement('button');button.textContent='重试加载';button.onclick=()=>c.tabs.demo.mount(root,ctx);root.append(button);});
      },unmount(){epoch++;handle?.destroy();handle=null;}};
      c.status='ready';window.Cases.register(c);window.ATLAS.index.byScene[scene].demo=true;
    };
    registrations.set(id,register);register();
  }
  for(const path of Object.keys(legacy).sort()){
    await legacy[path]();
    const demo=path.replace('.case.js','.demo.js');if(legacyDemo[demo])await legacyDemo[demo]();
  }
  // Hidden legacy plugins are filtered after their traditional registration.
  for(const id of window.CaseImport.blockedList())if(!window.Cases.get(id)?.imported)window.Cases.unregister(id);
  window.__restorePlugin=(id)=>{const register=registrations.get(id);if(register)register();else location.reload();window.dispatchEvent(new Event('atlas:changed'));};
}
