<script setup lang="ts">
import {computed,ref} from 'vue';
import {atlas,caseStats} from '../core/store';
import {searchSite,openPalette} from '../core/search';
import {vReveal} from '../core/motion';
import SectionHead from '../components/SectionHead.vue';
import SceneCard from '../components/SceneCard.vue';
import GlancePanel from '../components/home/GlancePanel.vue';
import StageGrid from '../components/home/StageGrid.vue';
import MethodIndex from '../components/home/MethodIndex.vue';
import MethodMatrix from '../components/home/MethodMatrix.vue';
import SystemLayers from '../components/home/SystemLayers.vue';
import type {Scene} from '../types';

const search=ref(''),hoverStage=ref('');
const q=computed(()=>search.value.trim());
const hits=computed(()=>q.value?searchSite(q.value,Infinity):[]);
// The home list shows scenes; other kinds open in the site search dialog.
const results=computed(()=>hits.value.filter(h=>h.kind==='scene').map(h=>atlas.value.index.byScene[h.id.slice(6)]).filter((s):s is Scene=>!!s));
const others=computed(()=>hits.value.length-results.value.length);
const firstDemo=computed(()=>atlas.value.index.byScene.d1?.id||atlas.value.allScenes[0]?.id);
</script>

<template>
  <div class="home">
    <section class="hero">
      <div class="wrap hero-grid">
        <div class="hero-main">
          <div class="hero-badges rise d1"><span>{{ atlas.meta.version }} · {{ atlas.allScenes.length }} 个候选场景</span><span>案例系统 · {{ caseStats.registered }} 个已接入</span></div>
          <h1 class="rise d2">石油勘探开发的<em>智能化</em>可能性地图</h1>
          <p class="hero-lead rise d3">把整条作业链拆成 {{ atlas.allScenes.length }} 个候选场景，逐个说明哪一步适合引入算法、需要准备什么数据、难点在哪里。每个场景配有专业背景、案例流程和可在浏览器中运行的教学演示。</p>
          <p class="hero-note rise d3"><b>场景元数据、案例内容与可运行演示三者分离。</b>新增案例只需提交一个案例包，导航、检索与统计会自动接入。</p>
          <label class="hero-search rise d4">
            <span class="sr-only">搜索场景</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
            <input v-model="search" type="search" placeholder="搜索业务名称、参数或智能化方法…">
          </label>
          <div class="hero-acts rise d5">
            <router-link class="btn primary" to="/chain">浏览完整作业链 <span aria-hidden="true">→</span></router-link>
            <router-link class="btn light" :to="`/scene/${firstDemo}?tab=demo`">打开一个可运行演示</router-link>
          </div>
        </div>
        <GlancePanel class="rise d3"/>
      </div>
    </section>

    <section v-if="q" class="section"><div class="wrap">
      <SectionHead num="—" kicker="SEARCH" title="场景检索结果" :sub="`“${q}” 匹配 ${results.length} 个场景，检索范围包括名称、业务背景、介入点、数据需求与所用方法。`">
        <button v-if="others" class="btn sm ghost" type="button" @click="openPalette(q)">另有 {{ others }} 条环节、方法与案例结果 →</button>
      </SectionHead>
      <TransitionGroup v-if="results.length" tag="ul" name="list" class="scene-grid" role="list" aria-label="场景检索结果">
        <li v-for="s in results" :key="s.id"><SceneCard :scene="s" show-stage/></li>
      </TransitionGroup>
      <div v-else class="empty"><b>没有匹配的场景</b>可换用环节名、方法名或更短的关键词。</div>
    </div></section>

    <section v-reveal class="section"><div class="wrap">
      <SectionHead num="01" kicker="BY STAGE" title="作业环节链条" sub="从上游勘探到下游储运炼化依次排列，色条表示该环节的方法构成；悬停时下方矩阵同步高亮对应行。"><router-link class="btn sm ghost" to="/chain">完整链条 →</router-link></SectionHead>
      <StageGrid :active="hoverStage" @hover="hoverStage=$event"/>
    </div></section>

    <section v-reveal class="section"><div class="wrap">
      <SectionHead num="02" kicker="BY METHOD" title="智能方法索引" sub="从已有技术方向反查跨环节的适用场景，进入后按环节分组列出。"/>
      <MethodIndex/>
    </div></section>

    <section v-reveal class="section"><div class="wrap">
      <SectionHead num="03" kicker="MATRIX" title="方法与环节分布矩阵" sub="格内数字为该环节中使用该方法的场景数，颜色越深场景越多，空白处是尚未覆盖的组合。点击格子带筛选条件进入环节页。"/>
      <MethodMatrix :active="hoverStage" @hover="hoverStage=$event"/>
    </div></section>

    <section v-reveal class="section"><div class="wrap">
      <SectionHead num="04" kicker="SYSTEM" title="系统分层结构" sub="新增案例只涉及第二层的一个文件夹，外壳与数据层无需改动。"><router-link class="btn primary sm" to="/guide">接入指南 →</router-link></SectionHead>
      <SystemLayers/>
      <div class="sys-acts"><router-link class="btn" to="/cases">案例库与校验结果 →</router-link><button class="btn ghost" type="button" data-import>＋ 添加案例</button></div>
    </div></section>
  </div>
</template>
