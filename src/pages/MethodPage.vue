<script setup lang="ts">
import {computed} from 'vue';
import {useRoute} from 'vue-router';
import {atlas,methodKeys,colorOf,casesOf,track} from '../core/store';
import {pad} from '../core/format';
import {useSceneFilters} from '../core/filters';
import PageHeader from '../components/PageHeader.vue';
import SceneFilters from '../components/SceneFilters.vue';
import SceneCard from '../components/SceneCard.vue';
import StackBar from '../components/StackBar.vue';

const route=useRoute(),filters=useSceneFilters();
const id=computed(()=>String(route.params.id));
const method=computed(()=>atlas.value.methods[id.value]);
const scenes=computed(()=>{track();return [...(atlas.value.index.byMethod[id.value]||[])];});
const shown=computed(()=>filters.apply(scenes.value,false));
const groups=computed(()=>atlas.value.stages.map(st=>({st,items:shown.value.filter(s=>s.stageId===st.id)})).filter(g=>g.items.length));
const stats=computed<[number,string][]>(()=>[[scenes.value.length,'场景'],[new Set(scenes.value.map(s=>s.stageId)).size,'涉及环节'],[scenes.value.filter(s=>casesOf(s.id).length).length,'已接入案例']]);
const spread=computed(()=>atlas.value.stages.map(st=>({value:scenes.value.filter(s=>s.stageId===st.id).length,color:'var(--mc)',label:st.name})).filter(p=>p.value));
</script>

<template>
  <div v-if="method" class="page" :data-m="colorOf(id)"><div class="wrap">
    <PageHeader :idx="`METHOD · ${method.abbr}`" :en="method.signal" :title="`${method.name}在石油勘探开发中的可应用场景`" :blurb="method.desc" :stats="stats"/>
    <SceneFilters :state="filters" :scenes="scenes" :shown="shown.length"/>
    <div v-if="spread.length" class="spread"><span>环节分布</span><StackBar :parts="spread"/><span class="mono">{{ spread.length }} 个环节</span></div>
    <section v-for="g in groups" :key="g.st.id" class="method-group" :aria-label="g.st.name">
      <router-link class="mg-head" :to="`/stage/${g.st.id}?m=${id}`"><span class="mono">{{ pad(g.st.idx) }}</span><h2>{{ g.st.name }}</h2><span class="mono cnt">{{ g.items.length }} 个场景 →</span></router-link>
      <TransitionGroup tag="ul" name="list" class="scene-grid" role="list"><li v-for="s in g.items" :key="s.id"><SceneCard :scene="s"/></li></TransitionGroup>
    </section>
    <div v-if="!shown.length" class="empty" role="status"><b>当前条件下没有匹配的场景</b><button type="button" class="btn sm" @click="filters.clear">清除筛选</button></div>
    <nav class="pager" aria-label="方法切换">
      <router-link v-for="k in methodKeys.filter(k=>k!==id)" :key="k" :to="`/method/${k}`"><span class="dir mono">METHOD · {{ atlas.methods[k].abbr }}</span><span class="t">{{ atlas.methods[k].name }}</span></router-link>
    </nav>
  </div></div>
  <div v-else class="wrap empty-state"><div class="code-404 mono">404</div><h1>场景分类不存在</h1><p>该方法不在当前地图中。</p><router-link class="btn" to="/">返回地图总览</router-link></div>
</template>
