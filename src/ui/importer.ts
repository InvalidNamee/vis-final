import {computed,markRaw,reactive} from 'vue';
import {track} from '../core/store';
import type {CaseFile,CaseMeta} from '../types';

/* Import dialog state. Reading and validation stay in services/packages.js (window.__PackageService). */
const today=()=>new Date().toISOString().slice(0,10);
const blank=(sceneId=''):CaseMeta=>({id:'',sceneId,title:'',methods:[],version:'1.0.0',updated:today()});

export const importer=reactive({
  visible:false,loading:false,error:'',
  pkg:null as Record<string,any>|null,
  files:markRaw([]) as CaseFile[],
  meta:blank(),
});
// A newer open/read/close invalidates a read still in flight.
let generation=0;

function setPackage(pkg:Record<string,any>|null,files:CaseFile[]){
  importer.pkg=pkg&&markRaw(pkg);importer.files=markRaw(files);
  window.__PackageService.setFiles(files);
}

export function openImport(opts:{sceneId?:string}={}){
  generation++;
  Object.assign(importer,{visible:true,loading:false,error:'',meta:blank(opts.sceneId||'')});
  setPackage(null,[]);
}
export function closeImport(){generation++;importer.visible=false;importer.loading=false;}

export async function readPackage(input:File[]){
  const token=++generation;
  importer.loading=true;importer.error='';
  try{
    const svc=window.__PackageService;
    const rows=svc.stripRoot(await Promise.all(input.map(svc.readOne)));
    if(token!==generation)return;
    const manifest=svc.pickManifest(rows);
    if(!manifest)throw Error('没有找到案例 JSON 清单');
    const parsed=JSON.parse(manifest.data);
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error('清单必须是 JSON 对象');
    setPackage(parsed,rows.filter(r=>r!==manifest));
    // Re-importing a package that is already registered gets a free "-local-n" ID.
    const sceneId=importer.meta.sceneId||parsed.sceneId||'';
    let id=parsed.id||`${sceneId}-case`,n=1;
    while(window.Cases.get(id))id=`${parsed.id||sceneId}-local-${n++}`;
    importer.meta={id,sceneId,title:parsed.title||'',methods:[...(parsed.methods||window.ATLAS.index.byScene[sceneId]?.methods||[])],version:parsed.version||'1.0.0',updated:parsed.updated||today()};
  }catch(e){
    if(token===generation){setPackage(null,[]);importer.error=(e as Error).message;}
  }finally{
    if(token===generation)importer.loading=false;
  }
}

// track(): the ID check reads Cases, which changes outside this state.
export const importChecks=computed(()=>{track();return importer.pkg?window.__PackageService.check(importer.pkg,{...importer.meta},importer.files):[];});

export function commitImport(){
  const result=window.__PackageService.commit(importer.pkg,{...importer.meta,methods:[...importer.meta.methods]},importer.files);
  if(result.ok)closeImport();
  return result;
}

export function downloadTemplate(){
  const c=window.CaseImport;
  const blob=c.makeZip([
    {name:'my-case/case.json',text:JSON.stringify(c.template(),null,2)},
    {name:'my-case/demo/index.html',text:c.templates.html},
    {name:'my-case/demo/demo.css',text:c.templates.css},
    {name:'my-case/demo/demo.js',text:c.templates.js},
  ]);
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='案例包模板.zip';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

/** Files from a drop, walking dropped folders and keeping their relative paths. */
export async function filesFromDrop(dt:DataTransfer|null):Promise<File[]>{
  if(!dt)return [];
  // Entries must be taken synchronously; the DataTransfer is cleared after the event.
  const entries=[...dt.items].map(i=>i.webkitGetAsEntry?.()).filter((e):e is FileSystemEntry=>!!e);
  if(!entries.length)return [...dt.files];
  const out:File[]=[];
  async function walk(entry:FileSystemEntry,prefix:string){
    if(entry.isFile){
      const file=await new Promise<File>((resolve,reject)=>(entry as FileSystemFileEntry).file(resolve,reject));
      if(prefix)Object.defineProperty(file,'webkitRelativePath',{value:prefix+file.name,configurable:true});
      out.push(file);
    }else if(entry.isDirectory){
      const reader=(entry as FileSystemDirectoryEntry).createReader();
      for(;;){
        const batch=await new Promise<FileSystemEntry[]>((resolve,reject)=>reader.readEntries(resolve,reject));
        if(!batch.length)break;
        for(const child of batch)await walk(child,prefix+entry.name+'/');
      }
    }
  }
  for(const entry of entries)await walk(entry,'');
  return out;
}
