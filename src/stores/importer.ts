import {defineStore} from 'pinia';
import {ref,shallowRef,computed} from 'vue';
import type {CaseFile,CaseMeta,Check} from '../types';
export const useImporterStore=defineStore('importer',()=>{
  const visible=ref(false),loading=ref(false),error=ref('');const pkg=shallowRef<any>(null),files=shallowRef<CaseFile[]>([]);
  const meta=ref<CaseMeta>({id:'',sceneId:'',title:'',methods:[],version:'1.0.0',updated:''});
  let generation=0;
  function open(opts:any={}){generation++;visible.value=true;loading.value=false;error.value='';pkg.value=null;files.value=[];window.__PackageService.setFiles([]);meta.value={id:'',sceneId:opts.sceneId||'',title:'',methods:[],version:'1.0.0',updated:new Date().toISOString().slice(0,10)};}
  function close(){generation++;visible.value=false;loading.value=false;}
  async function read(input:File[]){const token=++generation;loading.value=true;error.value='';try{
    const rows=window.__PackageService.stripRoot(await Promise.all(input.map(window.__PackageService.readOne)));
    if(token!==generation)return;
    const manifest=window.__PackageService.pickManifest(rows);if(!manifest)throw Error('没有找到案例 JSON 清单');
    const parsed=JSON.parse(manifest.data);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error('清单必须是 JSON 对象');
    pkg.value=parsed;files.value=rows.filter((r:CaseFile)=>r!==manifest);window.__PackageService.setFiles(files.value);
    const sceneId=meta.value.sceneId||parsed.sceneId||'';let id=parsed.id||`${sceneId}-case`,i=1;while(window.Cases.get(id))id=`${parsed.id||sceneId}-local-${i++}`;
    meta.value={id,sceneId,title:parsed.title||'',methods:parsed.methods||window.ATLAS.index.byScene[sceneId]?.methods||[],version:parsed.version||'1.0.0',updated:parsed.updated||new Date().toISOString().slice(0,10)};
  }catch(e:any){if(token===generation){pkg.value=null;files.value=[];window.__PackageService.setFiles([]);error.value=e.message;}}finally{if(token===generation)loading.value=false;}}
  const checks=computed<Check[]>(()=>pkg.value?window.__PackageService.check(pkg.value,meta.value,files.value):[]);
  function commit(){const result=window.__PackageService.commit(pkg.value,meta.value,files.value);if(result.ok)close();return result;}
  return {visible,loading,error,pkg,files,meta,checks,open,close,read,commit};
});
