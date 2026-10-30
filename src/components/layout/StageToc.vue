<script setup lang="ts">
import {computed,ref,watch,nextTick,onMounted,onBeforeUnmount} from 'vue';
import {useAtlas,pad} from '../../composables/useAtlas';
const {atlas,route,host,tick}=useAtlas();
const root=ref<HTMLElement|null>(null),list=ref<HTMLElement|null>(null);
// Only used below the desktop breakpoint, where the TOC collapses into a floating button.
const open=ref(false);
const loc=computed(()=>{
  const [,kind,id]=route.value.path.split('/');
  const scene=kind==='scene'?atlas.value.index.byScene[id]:null;
  return {chain:kind==='chain',stage:kind==='stage'?id:scene?.stageId||'',scene:scene?.id||''};
});
// The current stage is always expanded; the reader can open more.
const expanded=ref(new Set<string>());
watch(()=>loc.value.stage,id=>{if(id)expanded.value=new Set([id]);},{immediate:true});
watch(()=>route.value.path,()=>{open.value=false;nextTick(reveal);});
function toggle(id:string){const s=new Set(expanded.value);s.has(id)?s.delete(id):s.add(id);expanded.value=s;}
const ready=(id:string)=>{tick();return !!host.Cases.byScene(id);};
const current=computed(()=>atlas.value.index.byStage[loc.value.stage]);
/** Keep the active entry visible inside the TOC's own scroll area. */
function reveal(){
  const box=list.value,el=box?.querySelector<HTMLElement>('[aria-current="page"]');if(!box||!el)return;
  const a=el.offsetTop-box.offsetTop,b=a+el.offsetHeight;
  if(a<box.scrollTop||b>box.scrollTop+box.clientHeight)box.scrollTop=a-box.clientHeight/3;
}
function outside(e:PointerEvent){if(open.value&&root.value&&!root.value.contains(e.target as Node))open.value=false;}
function esc(e:KeyboardEvent){if(e.key==='Escape'&&open.value){open.value=false;root.value?.querySelector<HTMLElement>('.toc-fab')?.focus();}}
onMounted(()=>{reveal();document.addEventListener('pointerdown',outside);document.addEventListener('keydown',esc);});
onBeforeUnmount(()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',esc);});
</script>

<template>
  <aside ref="root" class="toc" :class="{open}" aria-label="作业链目录">
    <button class="toc-fab" type="button" :aria-expanded="open" aria-controls="toc-body" @click="open=!open">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h13"/></svg>
      <span>{{ current?`${pad(current.idx)} ${current.name}`:'作业环节' }}</span>
    </button>
    <div id="toc-body" class="toc-body">
      <router-link class="toc-head" :class="{on:loc.chain}" to="/chain" :aria-current="loc.chain?'page':undefined">
        <span class="k">OPERATIONS CHAIN</span><b>作业链目录</b><span class="m">{{ atlas.stages.length }} 个环节 · {{ atlas.allScenes.length }} 个场景</span>
      </router-link>
      <nav ref="list" class="toc-list">
        <div v-for="st in atlas.stages" :key="st.id" class="toc-st" :class="{on:loc.stage===st.id,ex:expanded.has(st.id)}">
          <div class="toc-row">
            <router-link class="toc-l1" :to="`/stage/${st.id}`" :aria-current="loc.stage===st.id&&!loc.scene?'page':undefined"><span class="i">{{ pad(st.idx) }}</span><span class="nm">{{ st.name }}</span></router-link>
            <button class="toc-x" type="button" :aria-expanded="expanded.has(st.id)" :aria-label="`${expanded.has(st.id)?'收起':'展开'}${st.name}的场景`" @click="toggle(st.id)"><span class="n">{{ st.scenes.length }}</span><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>
          </div>
          <ul v-if="expanded.has(st.id)" class="toc-l2">
            <li v-for="s in st.scenes" :key="s.id"><router-link :to="`/scene/${s.id}`" :class="{on:loc.scene===s.id}" :aria-current="loc.scene===s.id?'page':undefined"><span class="dot" :class="{ok:ready(s.id)}" :title="ready(s.id)?'已接入案例':'尚无案例'" aria-hidden="true"></span><span class="nm">{{ s.name }}</span></router-link></li>
          </ul>
        </div>
      </nav>
      <p class="toc-lg"><span class="dot ok" aria-hidden="true"></span>已接入案例<span class="dot" aria-hidden="true"></span>尚无案例</p>
    </div>
  </aside>
</template>
