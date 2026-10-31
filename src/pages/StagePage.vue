<script setup lang="ts">
import {computed} from 'vue';
import {useRoute} from 'vue-router';
import {atlas,methodKeys,casesOf} from '../core/store';
import {pad} from '../core/format';
import {useSceneFilters} from '../core/filters';
import PageHeader from '../components/PageHeader.vue';
import SceneFilters from '../components/SceneFilters.vue';
import SceneCard from '../components/SceneCard.vue';

const route=useRoute(),filters=useSceneFilters();
const id=computed(()=>String(route.params.id));
const stage=computed(()=>atlas.value.index.byStage[id.value]);
const scenes=computed(()=>stage.value?.scenes||[]);
const methods=computed(()=>methodKeys.value.filter(k=>scenes.value.some(s=>s.methods.includes(k))));
const shown=computed(()=>filters.apply(scenes.value));
const stats=computed<[number,string][]>(()=>[[scenes.value.length,'候选场景'],[scenes.value.filter(s=>casesOf(s.id).length).length,'已接入场景'],[methods.value.length,'智能方法']]);
const at=computed(()=>atlas.value.stages.findIndex(s=>s.id===id.value));
const prev=computed(()=>atlas.value.stages[at.value-1]);
const next=computed(()=>atlas.value.stages[at.value+1]);
</script>

<template>
  <div v-if="stage" class="page"><div class="wrap">
    <PageHeader :idx="`STAGE ${pad(stage.idx)} / ${pad(atlas.stages.length)}`" :en="stage.en" :title="`${stage.name}环节的可智能化场景`" :blurb="stage.blurb||stage.desc" :stats="stats"/>
    <SceneFilters :state="filters" :scenes="scenes" :shown="shown.length" :methods="methods"/>
    <section aria-labelledby="catalog-title">
      <header class="block-head"><h2 id="catalog-title">场景目录</h2><router-link to="/chain" class="link-arrow">全部作业环节 →</router-link></header>
      <TransitionGroup v-if="shown.length" tag="ul" name="list" class="scene-grid" role="list" aria-label="场景目录">
        <li v-for="s in shown" :key="s.id"><SceneCard :scene="s"/></li>
      </TransitionGroup>
      <div v-else class="empty" role="status"><b>暂无匹配场景</b>可调整关键词、智能方法或应用难度。<button type="button" class="btn sm" @click="filters.clear">清除筛选</button></div>
    </section>
    <nav class="pager" aria-label="环节翻页">
      <router-link v-if="prev" class="prev" :to="`/stage/${prev.id}`"><span class="dir mono">← 上一环节 · {{ pad(prev.idx) }}</span><span class="t">{{ prev.name }}</span></router-link>
      <router-link v-else class="prev" to="/chain"><span class="dir mono">← 返回</span><span class="t">作业链</span></router-link>
      <router-link v-if="next" class="next" :to="`/stage/${next.id}`"><span class="dir mono">下一环节 · {{ pad(next.idx) }} →</span><span class="t">{{ next.name }}</span></router-link>
    </nav>
  </div></div>
  <div v-else class="wrap empty-state"><div class="code-404 mono">404</div><h1>场景分类不存在</h1><p>该环节不在当前地图中。</p><router-link class="btn" to="/chain">返回作业链</router-link></div>
</template>
