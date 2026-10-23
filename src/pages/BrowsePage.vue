<script setup>
import { computed, inject } from 'vue';
import { contentKey } from '../state';
import SceneCard from '../components/SceneCard.vue';
const state = inject(contentKey), route = computed(() => state.route.value);
const isMethod = computed(() => route.value.path.startsWith('/method/'));
const id = computed(() => route.value.path.split('/')[2]);
const entity = computed(() => isMethod.value ? state.atlas.value.methods[id.value] : state.atlas.value.index.byStage[id.value]);
const scenes = computed(() => { state.atlas.value; state.cases.value; return entity.value ? [...(isMethod.value ? state.atlas.value.index.byMethod[id.value] || [] : entity.value.scenes)] : []; });
function field(key) { return computed({get: () => route.value.query[key] || '', set: value => state.navigate(route.value.path, {...route.value.query, [key]:value})}); }
const search = field('q'), method = field('m'), difficulty = field('d'), implemented = field('ready');
const filtered = computed(() => scenes.value.filter(s => (!search.value || `${s.name} ${s.point} ${s.stageName}`.toLowerCase().includes(search.value.toLowerCase())) && (!method.value || s.methods.includes(method.value)) && (!difficulty.value || s.diff === difficulty.value) && (!implemented.value || state.host.Cases.byScene(s.id))));
const methods = computed(() => Object.entries(state.atlas.value.methods).filter(([key]) => scenes.value.some(s => s.methods.includes(key))));
function clear(){state.navigate(route.value.path);}
</script>

<template>
  <section v-if="entity" class="atlas-section"><router-link class="atlas-back" to="/">← 地图总览</router-link><header class="atlas-page-heading"><span class="atlas-eyebrow">{{ isMethod ? 'METHOD INDEX' : `OPERATION ${String(entity.idx).padStart(2,'0')}` }}</span><h1>{{ entity.name }}{{ isMethod ? '在石油勘探开发中的可应用场景' : '环节的可智能化场景' }}</h1><p>{{ entity.blurb || entity.desc }}</p></header><n-form inline class="atlas-filterbar" @submit.prevent><n-form-item label="关键词"><n-input v-model:value="search" placeholder="搜索当前场景" clearable/></n-form-item><n-form-item v-if="!isMethod" label="智能方法"><n-select v-model:value="method" :options="[{label:'全部方法',value:''},...methods.map(([key,m])=>({label:m.name,value:key}))]" style="min-width:160px"/></n-form-item><n-form-item label="技术难度"><n-select v-model:value="difficulty" :options="[{label:'全部难度',value:''},...['低','中','高'].map(value=>({label:value,value}))]" style="min-width:130px"/></n-form-item><n-checkbox :checked="!!implemented" @update:checked="v=>implemented=v?'1':''">仅显示已有案例</n-checkbox><n-button @click="clear">清除筛选</n-button></n-form><div class="atlas-section-caption"><h2>场景列表</h2><span>{{ filtered.length }} / {{ scenes.length }} 个场景</span></div><div class="atlas-scene-grid"><SceneCard v-for="scene in filtered" :key="scene.id" :scene="scene"/></div><p v-if="!filtered.length" class="atlas-empty">当前条件下没有匹配的场景。</p></section>
  <section v-else class="atlas-empty"><h1>场景分类不存在</h1><router-link to="/">返回地图总览</router-link></section>
</template>
