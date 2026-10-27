<script setup lang="ts">
import {computed} from 'vue';
import {useAtlas} from '../../composables/useAtlas';
import CountUp from '../common/CountUp.vue';
import StackBar from '../common/StackBar.vue';
const {atlas,caseStats,sceneStats,methodKeys,colorOf}=useAtlas();
const total=computed(()=>atlas.value.allScenes.length);
const cover=computed(()=>total.value?Math.round(caseStats.value.coveredScenes/total.value*100):0);
const diffParts=computed(()=>[['低','var(--ok)'],['中','var(--warn)'],['高','var(--bad)']].map(([k,c])=>({value:sceneStats.value.diff[k]||0,color:c,label:`${k}难度`})));
const methodCounts=computed(()=>methodKeys.value.map(k=>({k,n:(atlas.value.index.byMethod[k]||[]).length,abbr:atlas.value.methods[k].abbr,color:`var(--c-${colorOf(k)})`})));
</script>

<template>
  <aside class="spec" aria-label="地图速览">
    <div class="spec-h"><span class="mono">AT A GLANCE · 速览</span><span class="mono">{{ atlas.meta.version }}</span></div>
    <div class="spec-body">
      <div class="spec-row"><span class="k">作业环节</span><span class="v"><CountUp :value="atlas.stages.length"/><small>个</small></span></div>
      <div class="spec-row"><span class="k">候选场景</span><span class="v"><CountUp :value="total"/><small>个</small></span></div>
      <div class="spec-row"><span class="k">难度分布（低 / 中 / 高）</span><span class="v" data-glance="diff"><CountUp :value="sceneStats.diff.低||0"/><small>/</small><CountUp :value="sceneStats.diff.中||0"/><small>/</small><CountUp :value="sceneStats.diff.高||0"/></span></div>
    </div>
    <StackBar class="spec-bar" :parts="diffParts"/>
    <div class="spec-body">
      <div class="spec-row"><span class="k">已接入案例</span><span class="v" data-glance="registered"><CountUp :value="caseStats.registered"/><small>个</small></span></div>
      <div class="spec-row"><span class="k">其中可运行演示</span><span class="v" data-glance="demo"><CountUp :value="caseStats.withDemo"/><small>个</small></span></div>
      <div class="spec-row"><span class="k">案例覆盖场景</span><span class="v" data-glance="covered"><CountUp :value="caseStats.coveredScenes"/><small>/ {{ total }} · {{ cover }}%</small></span></div>
    </div>
    <StackBar class="spec-bar" :parts="[{value:caseStats.coveredScenes,color:'var(--jade)',label:'已覆盖'},{value:Math.max(0,total-caseStats.coveredScenes),color:'var(--line)',label:'待覆盖'}]"/>
    <div class="spec-sub"><span class="mono">方法构成 · BY METHOD</span></div>
    <div class="comp">
      <StackBar class="comp-bar" :parts="methodCounts.map(m=>({value:m.n,color:m.color,label:m.abbr}))"/>
      <div class="comp-legend"><router-link v-for="m in methodCounts" :key="m.k" :to="`/method/${m.k}`"><i :style="{background:m.color}"></i>{{ m.abbr }}<b>{{ m.n }}</b></router-link></div>
    </div>
    <div class="spec-f"><span>数据截至 {{ atlas.meta.updated }}</span><span>教学用途</span></div>
  </aside>
</template>
