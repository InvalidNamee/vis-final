<script setup lang="ts">
import {computed} from 'vue';
import {useAtlas,pad} from '../composables/useAtlas';
import {vReveal} from '../composables/useReveal';
import PageHead from '../components/layout/PageHead.vue';
import Crumb from '../components/layout/Crumb.vue';
import StackBar from '../components/common/StackBar.vue';
const {atlas,matrix,methodKeys,colorOf,caseStats,host,tick}=useAtlas();
const ready=(st:any)=>{tick();return st.scenes.filter((s:any)=>host.Cases.byScene(s.id)).length;};
const parts=(id:string)=>methodKeys.value.filter(k=>matrix.value[id]?.[k]).map(k=>({value:matrix.value[id][k],color:`var(--c-${colorOf(k)})`,label:atlas.value.methods[k].abbr}));
const stats=computed<[number,string][]>(()=>[[atlas.value.stages.length,'作业环节'],[atlas.value.allScenes.length,'候选场景'],[caseStats.value.coveredScenes,'已接入场景']]);
</script>

<template>
  <div class="page"><div class="wrap">
    <Crumb :items="[['/','总览'],['','作业链']]"/>
    <PageHead idx="OPERATIONS CHAIN" title="石油作业链与方法分布" en="From exploration to production" blurb="沿上游到下游的作业环节排列，每行列出各智能方法覆盖的场景数和案例接入情况。点击方法标签可直接进入带筛选的环节页。" :stats="stats"/>
    <ol class="ops">
      <li v-for="(st,i) in atlas.stages" :key="st.id" class="op-row" v-reveal="Number(i)%6">
        <span class="op-idx">{{ pad(st.idx) }}</span>
        <div>
          <router-link class="op-name" :to="`/stage/${st.id}`">{{ st.name }}<span class="en">{{ st.en }}</span></router-link>
          <p class="op-blurb">{{ st.blurb }}</p>
          <div class="op-methods">
            <router-link v-for="k in methodKeys" :key="k" :to="`/stage/${st.id}?m=${k}`" :data-m="colorOf(k)" :class="{zero:!matrix[st.id]?.[k]}" :aria-label="`${st.name} · ${atlas.methods[k].name}：${matrix[st.id]?.[k]||0} 个场景`"><b>{{ atlas.methods[k].abbr }}</b>{{ matrix[st.id]?.[k]||0 }}</router-link>
          </div>
        </div>
        <div class="op-right">
          <span class="n">{{ st.scenes.length }}<small>场景</small></span>
          <StackBar v-if="parts(st.id).length" :parts="parts(st.id)"/>
          <span class="ready">已接入 {{ ready(st) }} / {{ st.scenes.length }}</span>
        </div>
      </li>
    </ol>
  </div></div>
</template>

