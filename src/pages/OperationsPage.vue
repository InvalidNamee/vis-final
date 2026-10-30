<script setup lang="ts">
import {computed} from 'vue';
import {useAtlas,pad} from '../composables/useAtlas';
import {vReveal} from '../composables/useReveal';
import PageHead from '../components/layout/PageHead.vue';
import StackBar from '../components/common/StackBar.vue';
const {atlas,matrix,methodKeys,colorOf,caseStats,host,tick}=useAtlas();
const isReady=(id:string)=>{tick();return !!host.Cases.byScene(id);};
const ready=(st:any)=>st.scenes.filter((s:any)=>isReady(s.id)).length;
const parts=(id:string)=>methodKeys.value.filter(k=>matrix.value[id]?.[k]).map(k=>({value:matrix.value[id][k],color:`var(--c-${colorOf(k)})`,label:atlas.value.methods[k].abbr}));
const stats=computed<[number,string][]>(()=>[[atlas.value.stages.length,'作业环节'],[atlas.value.allScenes.length,'候选场景'],[caseStats.value.coveredScenes,'已接入场景']]);
</script>

<template>
  <div class="page"><div class="wrap">
    <PageHead idx="OPERATIONS CHAIN" title="石油作业链与方法分布" en="From exploration to production" blurb="沿上游到下游的作业环节排列，每张卡片列出该环节的智能方法覆盖数和全部场景条目。点击方法标签进入带筛选的环节页，点击场景条目进入场景详情。" :stats="stats"/>
    <ol class="ops">
      <li v-for="(st,i) in atlas.stages" :key="st.id" class="op-card" v-reveal="Number(i)%6">
        <header class="op-head">
          <span class="op-idx">{{ pad(st.idx) }}</span>
          <div class="op-title">
            <router-link class="op-name" :to="`/stage/${st.id}`">{{ st.name }}<span class="en">{{ st.en }}</span></router-link>
            <p class="op-blurb">{{ st.blurb }}</p>
          </div>
          <div class="op-right">
            <span class="n">{{ st.scenes.length }}<small>场景</small></span>
            <StackBar v-if="parts(st.id).length" :parts="parts(st.id)"/>
            <span class="ready">已接入 {{ ready(st) }} / {{ st.scenes.length }}</span>
          </div>
        </header>
        <div class="op-methods">
          <router-link v-for="k in methodKeys" :key="k" :to="`/stage/${st.id}?m=${k}`" :data-m="colorOf(k)" :class="{zero:!matrix[st.id]?.[k]}" :aria-label="`${st.name} · ${atlas.methods[k].name}：${matrix[st.id]?.[k]||0} 个场景`"><b>{{ atlas.methods[k].abbr }}</b>{{ matrix[st.id]?.[k]||0 }}</router-link>
        </div>
        <ul class="op-scenes" :aria-label="`${st.name}场景`">
          <li v-for="s in st.scenes" :key="s.id">
            <router-link class="op-scene" :to="`/scene/${s.id}`">
              <span class="dot" :class="{ok:isReady(s.id)}" :title="isReady(s.id)?'已接入案例':'尚无案例'" aria-hidden="true"></span>
              <span class="sid">{{ s.id.toUpperCase() }}</span>
              <span class="nm">{{ s.name }}</span>
              <span class="m" aria-hidden="true"><i v-for="k in s.methods" :key="k" :data-m="colorOf(k)">{{ atlas.methods[k]?.abbr }}</i></span>
            </router-link>
          </li>
        </ul>
      </li>
    </ol>
  </div></div>
</template>
