<script setup lang="ts">
import {computed,reactive,ref,watch} from 'vue';
import {useRoute} from 'vue-router';
import {atlas,casesOf} from '../core/store';
import {pad} from '../core/format';

/* Operations-chain directory for chain / stage / scene pages: a sticky card on desktop, a bottom sheet below 1024px. */
const route=useRoute();
const sheet=ref(false),expanded=reactive<Record<string,boolean>>({});
const here=computed(()=>{
  const [,page,id]=route.path.split('/');
  const sceneId=page==='scene'?id:'';
  const stageId=page==='stage'?id:atlas.value.index.byScene[sceneId]?.stageId||'';
  return {stageId,sceneId};
});
watch(()=>here.value.stageId,id=>{if(id)expanded[id]=true;},{immediate:true});
watch(()=>route.fullPath,()=>{sheet.value=false;});
const ready=(id:string)=>casesOf(id).length>0;
</script>

<template>
  <aside class="toc" :class="{open:sheet}" aria-label="作业链目录">
    <button type="button" class="toc-fab" :aria-expanded="sheet" aria-controls="toc-panel" @click="sheet=!sheet">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h13"/></svg>作业环节
    </button>
    <div class="toc-scrim" aria-hidden="true" @click="sheet=false"></div>
    <div id="toc-panel" class="toc-panel">
      <div class="toc-head">
        <router-link to="/chain" class="toc-title">作业链目录</router-link>
        <span class="mono">{{ atlas.stages.length }} 环节 · {{ atlas.allScenes.length }} 场景</span>
        <button type="button" class="toc-close" aria-label="关闭目录" @click="sheet=false">×</button>
      </div>
      <ol class="toc-stages">
        <li v-for="st in atlas.stages" :key="st.id" class="toc-stage" :class="{on:here.stageId===st.id}">
          <div class="toc-row">
            <router-link class="toc-link" :to="`/stage/${st.id}`" :aria-current="route.path===`/stage/${st.id}`?'page':undefined"><span class="mono">{{ pad(st.idx) }}</span>{{ st.name }}</router-link>
            <button type="button" class="toc-x" :aria-expanded="!!expanded[st.id]" :aria-label="`${expanded[st.id]?'收起':'展开'}${st.name}场景`" @click="expanded[st.id]=!expanded[st.id]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
            </button>
          </div>
          <ul v-show="expanded[st.id]" class="toc-scenes" :aria-label="`${st.name}场景`">
            <li v-for="s in st.scenes" :key="s.id">
              <router-link :to="`/scene/${s.id}`" :class="{ready:ready(s.id)}" :aria-current="here.sceneId===s.id?'page':undefined">{{ s.name }}</router-link>
            </li>
          </ul>
        </li>
      </ol>
    </div>
  </aside>
</template>
