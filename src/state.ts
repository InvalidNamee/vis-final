import {computed} from 'vue';
import {storeToRefs} from 'pinia';
import {router} from './router';
import {useContentStore} from './stores/content';
export const contentKey=Symbol('content');
export function createContentState(){
  const store=useContentStore(),{atlas,cases}=storeToRefs(store);
  const route=computed(()=>({path:router.currentRoute.value.path,query:router.currentRoute.value.query as Record<string,string>}));
  return {host:window,atlas,cases,route,refresh:store.refresh,navigate:(path:string,query:Record<string,any>={})=>router.push({path,query:Object.fromEntries(Object.entries(query).filter(([,v])=>v!==''&&v!=null))})};
}
