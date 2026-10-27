import {computed,inject} from 'vue';
import {contentKey} from '../state';

export const pad=(n:number|string)=>String(n).padStart(2,'0');

/** Reactive view over window.ATLAS / window.Cases; every computed re-reads after store.refresh(). */
export function useAtlas(){
  const state:any=inject(contentKey);
  const host=state.host as Window;
  // Touch both refs so legacy imperative reads (Cases.*) are recomputed on refresh.
  const tick=()=>{state.atlas.value;state.cases.value;};
  const atlas=computed<any>(()=>state.atlas.value);
  const caseStats=computed(()=>{tick();return host.Cases.stats();});
  const sceneStats=computed(()=>{tick();return atlas.value.stats();});
  const matrix=computed<Record<string,Record<string,number>>>(()=>{tick();return atlas.value.countByStageMethod();});
  const methodKeys=computed(()=>Object.keys(atlas.value.methods));
  const colorOf=(k:string)=>atlas.value.methods[k]?.colorKey||k;
  const casesOf=(sceneId:string)=>{tick();return host.Cases.bySceneAll(sceneId) as any[];};
  return {state,host,tick,atlas,caseStats,sceneStats,matrix,methodKeys,colorOf,casesOf,route:state.route,navigate:state.navigate};
}
