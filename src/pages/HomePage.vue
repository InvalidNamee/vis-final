<script setup>
import { computed, inject, ref } from 'vue';
import { contentKey } from '../state';
import SceneCard from '../components/SceneCard.vue';
const state = inject(contentKey), search = ref('');
const atlas = computed(() => state.atlas.value);
const stats = computed(() => { state.atlas.value; state.cases.value; return state.host.Cases.stats(); });
const results = computed(() => atlas.value.allScenes.filter(s => `${s.name} ${s.intro} ${s.point} ${s.stageName}`.toLowerCase().includes(search.value.trim().toLowerCase())));
const drilling = computed(() => atlas.value.index.byStage.drilling);
const ready = stage => stage.scenes.filter(s => state.host.Cases.byScene(s.id)).length;
</script>

<template>
  <section class="atlas-hero">
    <div><span class="atlas-eyebrow">PETROLEUM INTELLIGENCE ATLAS</span><h1>石油勘探开发的<br><em>智能化可能性地图</em></h1><p>从石油业务出发，连接作业场景、智能方法与可运行案例。按环节浏览，按问题检索，在交互实验中理解方法与边界。</p><div class="atlas-actions"><router-link class="atlas-button primary" to="/stage/drilling">浏览钻井案例 <span>↗</span></router-link><router-link class="atlas-button" to="/cases">案例库</router-link></div></div>
    <aside class="atlas-overview"><span class="atlas-eyebrow">课程作业 · 第 3 类</span><h2>钻井智能化</h2><p>学号末两位 29 · 五个子类别</p><div class="atlas-large-number">{{ drilling ? ready(drilling) : 0 }}<small> / 5</small></div><div class="atlas-progress"><i :style="{width: `${drilling ? ready(drilling) / 5 * 100 : 0}%`}"></i></div><div class="atlas-overview-stats"><span><b>{{ atlas.stages.length }}</b>作业环节</span><span><b>{{ atlas.allScenes.length }}</b>业务场景</span><span><b>{{ stats.registered }}</b>已接入案例</span></div></aside>
  </section>
  <section class="atlas-section">
    <div class="atlas-section-heading"><div><span class="atlas-eyebrow">SCENE EXPLORER</span><h2>业务场景检索</h2></div><label class="atlas-search"><span class="sr-only">搜索场景</span><n-input v-model:value="search" placeholder="搜索业务名称、参数或智能化方法…" clearable/></label></div>
    <div v-if="search.trim()" class="atlas-scene-grid"><SceneCard v-for="scene in results" :key="scene.id" :scene="scene"/><p v-if="!results.length" class="atlas-empty">没有匹配的场景，可尝试其他关键词。</p></div>
    <template v-else><div class="atlas-section-caption"><h3>钻井课程案例</h3><router-link to="/stage/drilling">全部 5 个子类别 →</router-link></div><div class="atlas-scene-grid"><SceneCard v-for="scene in drilling?.scenes || []" :key="scene.id" :scene="scene"/></div></template>
  </section>
  <section class="atlas-section"><div class="atlas-section-heading"><div><span class="atlas-eyebrow">OPERATIONS</span><h2>石油作业环节</h2></div><span class="atlas-muted">覆盖勘探、建井、生产与加工</span></div><div class="atlas-stage-grid"><router-link v-for="stage in atlas.stages" :key="stage.id" :to="`/stage/${stage.id}`" class="atlas-stage-card"><span class="atlas-code">{{ String(stage.idx).padStart(2, '0') }} / {{ stage.en }}</span><h3>{{ stage.name }}<span>→</span></h3><p>{{ stage.blurb }}</p><div><span>{{ stage.scenes.length }} 个场景</span><span>{{ ready(stage) }} 已接入</span></div></router-link></div></section>
  <section class="atlas-section"><div class="atlas-section-heading"><div><span class="atlas-eyebrow">METHODS</span><h2>智能方法索引</h2></div></div><div class="atlas-method-grid"><router-link v-for="(method,key) in atlas.methods" :key="key" :to="`/method/${key}`"><span class="atlas-code">{{ method.abbr }}</span><h3>{{ method.name }}</h3><p>{{ method.desc }}</p><b>{{ (atlas.index.byMethod[key] || []).length }} 个适配场景 →</b></router-link></div></section>
</template>
