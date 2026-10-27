<script setup lang="ts">
import {computed,ref} from 'vue';
import {useAtlas} from '../composables/useAtlas';
import {vReveal} from '../composables/useReveal';
import SectionHead from '../components/layout/SectionHead.vue';
import SceneRow from '../components/common/SceneRow.vue';
import GlanceSpec from '../components/home/GlanceSpec.vue';
import StageChain from '../components/home/StageChain.vue';
import MethodPanel from '../components/home/MethodPanel.vue';
import StageMethodMatrix from '../components/home/StageMethodMatrix.vue';
import SystemLayers from '../components/home/SystemLayers.vue';
const {atlas,caseStats}=useAtlas();
const search=ref(''),hoverStage=ref('');
const q=computed(()=>search.value.trim().toLowerCase());
const results=computed(()=>q.value?atlas.value.allScenes.filter((s:any)=>`${s.name} ${s.intro} ${s.point} ${s.stageName}`.toLowerCase().includes(q.value)):[]);
const firstDemo=computed(()=>atlas.value.allScenes.find((s:any)=>s.id==='d1')?.id||atlas.value.allScenes[0]?.id);
</script>

<template><div class="page home">
  <section class="hero"><div class="wrap"><div class="hero-grid">
    <div class="hero-main">
      <div class="hero-top rise d1">
        <span class="hero-badge">{{ atlas.meta.version }} · {{ atlas.allScenes.length }} 个候选场景</span>
        <span class="hero-badge alt">案例系统 · {{ caseStats.registered }} 个已接入</span>
      </div>
      <h1 class="rise d2">石油勘探开发的<em>智能化</em><br>可能性地图</h1>
      <p class="hero-lead rise d3">把整条作业链拆成 {{ atlas.allScenes.length }} 个候选场景，逐个说明哪一步适合引入算法、需要准备什么数据、难点在哪里。每个场景配有专业背景、案例流程和可在浏览器中运行的教学演示。</p>
      <div class="hero-note rise d3"><p><b>场景元数据、案例内容与可运行演示三者分离。</b>新增案例只需提交一个案例包，导航、检索与统计会自动接入。</p></div>
      <label class="hero-search rise d4"><span class="sr-only">搜索场景</span><n-input v-model:value="search" placeholder="搜索业务名称、参数或智能化方法…" clearable round><template #prefix><span class="mono hs-k">SEARCH</span></template></n-input></label>
      <div class="hero-acts rise d5">
        <router-link class="btn primary" to="/chain">浏览完整作业链 <span class="ar">→</span></router-link>
        <router-link class="btn" :to="`/scene/${firstDemo}?tab=demo`">打开一个可运行演示</router-link>
      </div>
    </div>
    <GlanceSpec class="rise d3"/>
  </div></div></section>

  <section v-if="q" class="section tight"><div class="wrap">
    <div class="sub-head"><span class="kicker">SEARCH</span><h2>场景检索结果</h2><p>“{{ search.trim() }}” 匹配 {{ results.length }} 个场景，检索范围包括名称、业务背景、介入点与所属环节。</p></div>
    <TransitionGroup tag="div" name="list" class="scenes"><SceneRow v-for="s in results" :key="s.id" :scene="s" show-stage/></TransitionGroup>
    <div v-if="!results.length" class="empty"><b>没有匹配的场景</b>可换用环节名、方法名或更短的关键词。</div>
  </div></section>

  <section class="section" v-reveal><div class="wrap">
    <SectionHead num="01" kicker="BY STAGE" title="作业环节链条" sub="沿作业链从上游到下游排列，节点下方色条表示该环节的方法构成；悬停时下方矩阵同步高亮对应行。"><router-link class="btn sm ghost" to="/chain">完整链条 →</router-link></SectionHead>
    <StageChain :active="hoverStage" @hover="hoverStage=$event"/>
  </div></section>

  <section class="section" v-reveal><div class="wrap">
    <SectionHead num="02" kicker="BY METHOD" title="智能方法索引" sub="从已有技术方向反查跨环节的适用场景，进入后按环节分组列出。"/>
    <MethodPanel/>
  </div></section>

  <section class="section" v-reveal><div class="wrap">
    <SectionHead num="03" kicker="MATRIX" title="方法与环节分布矩阵" sub="格内数字为该环节中使用该方法的场景数，颜色越深场景越多，空白处是尚未覆盖的组合。点击格子带筛选条件进入环节页。"/>
    <StageMethodMatrix :active="hoverStage" @hover="hoverStage=$event"/>
  </div></section>

  <section class="section" v-reveal><div class="wrap">
    <SectionHead num="04" kicker="SYSTEM" clay title="系统分层结构" sub="新增案例只涉及第二层的一个文件夹，外壳与数据层无需改动。"><router-link class="btn primary sm" to="/guide">接入指南 →</router-link></SectionHead>
    <SystemLayers/>
    <div class="sys-acts"><router-link class="btn" to="/cases">案例库与校验结果 →</router-link><button class="btn ghost" type="button" data-import>＋ 添加案例</button></div>
  </div></section>
</div></template>
