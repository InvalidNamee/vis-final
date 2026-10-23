import {defineStore} from 'pinia';
import {shallowRef} from 'vue';
export const useContentStore=defineStore('content',()=>{
  const atlas=shallowRef<any>(window.ATLAS),cases=shallowRef<any[]>([]);
  function refresh(){atlas.value={...window.ATLAS};cases.value=window.Cases.list();}
  return {atlas,cases,refresh};
});
