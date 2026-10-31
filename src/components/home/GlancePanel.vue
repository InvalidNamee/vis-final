<script setup lang="ts">
import {computed} from 'vue';
import {atlas,caseStats,sceneStats,methodKeys,colorOf} from '../../core/store';
import CountUp from '../CountUp.vue';
import StackBar from '../StackBar.vue';

const total=computed(()=>atlas.value.allScenes.length);
const cover=computed(()=>total.value?Math.round(caseStats.value.coveredScenes/total.value*100):0);
const diffParts=computed(()=>([['低','var(--ok)'],['中','var(--warn)'],['高','var(--bad)']] as const).map(([k,color])=>({value:sceneStats.value.diff[k]||0,color,label:`${k}难度`})));
const methods=computed(()=>methodKeys.value.map(k=>({k,n:(atlas.value.index.byMethod[k]||[]).length,abbr:atlas.value.methods[k].abbr,color:`var(--c-${colorOf(k)})`})));
</script>

<template>
  <aside class="glance" aria-label="地图速览">
    <div class="gl-head mono"><span>AT A GLANCE · 速览</span><span>{{ atlas.meta.version }}</span></div>
    <dl class="gl-grid">
      <div><dt>作业环节</dt><dd><CountUp :value="atlas.stages.length"/><small>个</small></dd></div>
      <div><dt>候选场景</dt><dd><CountUp :value="total"/><small>个</small></dd></div>
      <div><dt>已接入案例</dt><dd data-glance="registered"><CountUp :value="caseStats.registered"/><small>个</small></dd></div>
      <div><dt>可运行演示</dt><dd data-glance="demo"><CountUp :value="caseStats.withDemo"/><small>个</small></dd></div>
    </dl>
    <div class="gl-block">
      <div class="gl-label"><span>案例覆盖场景</span><b data-glance="covered"><CountUp :value="caseStats.coveredScenes"/> / {{ total }} · {{ cover }}%</b></div>
      <StackBar :parts="[{value:caseStats.coveredScenes,color:'var(--jade)',label:'已覆盖'},{value:Math.max(0,total-caseStats.coveredScenes),color:'var(--line-2)',label:'待覆盖'}]"/>
    </div>
    <div class="gl-block">
      <div class="gl-label"><span>难度分布（低 / 中 / 高）</span><b data-glance="diff">{{ sceneStats.diff.低||0 }} / {{ sceneStats.diff.中||0 }} / {{ sceneStats.diff.高||0 }}</b></div>
      <StackBar :parts="diffParts"/>
    </div>
    <div class="gl-block">
      <div class="gl-label"><span>方法构成</span><b>{{ methods.length }} 类</b></div>
      <StackBar :parts="methods.map(m=>({value:m.n,color:m.color,label:m.abbr}))"/>
      <div class="gl-legend"><router-link v-for="m in methods" :key="m.k" :to="`/method/${m.k}`"><i :style="{background:m.color}"></i>{{ m.abbr }}<b>{{ m.n }}</b></router-link></div>
    </div>
    <div class="gl-foot mono"><span>数据截至 {{ atlas.meta.updated }}</span><span>教学用途</span></div>
  </aside>
</template>
