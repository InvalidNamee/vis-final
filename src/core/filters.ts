import {computed,reactive,ref,watch} from 'vue';
import {useRoute,useRouter} from 'vue-router';
import {cleanQuery} from './format';
import {casesOf} from './store';
import type {Scene} from '../types';

/* Scene filters live in the URL (?q, m, d, ready) so links such as the home matrix can preselect them.
   Edits replace the history entry instead of pushing one per keystroke. */
export function useSceneFilters(){
  const route=useRoute(),router=useRouter();
  const read=(key:string)=>{const v=route.query[key];return v==null?'':String(v);};
  const write=(key:string,value:string)=>router.replace({path:route.path,query:cleanQuery({...route.query,[key]:value})});
  const bind=(key:string)=>computed({get:()=>read(key),set:v=>void write(key,v)});

  // The search box keeps its own value so typing never waits for navigation.
  const typed=ref(read('q'));
  watch(()=>route.query.q,v=>{if((v??'')!==typed.value)typed.value=v==null?'':String(v);});

  const state=reactive({
    q:computed({get:()=>typed.value,set:v=>{typed.value=v;void write('q',v);}}),
    m:bind('m'),d:bind('d'),ready:bind('ready'),
    active:computed(()=>!!(typed.value||read('m')||read('d')||read('ready'))),
    clear:()=>{typed.value='';void router.replace({path:route.path});},
    apply(scenes:Scene[],withMethod=true){
      const q=typed.value.trim().toLowerCase(),m=read('m'),d=read('d'),ready=read('ready');
      return scenes.filter(s=>(!q||`${s.name} ${s.point} ${s.stageName}`.toLowerCase().includes(q))
        &&(!withMethod||!m||s.methods.includes(m))&&(!d||s.diff===d)&&(!ready||casesOf(s.id).length>0));
    },
  });
  return state;
}
export type SceneFilterState=ReturnType<typeof useSceneFilters>;
