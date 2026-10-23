<script setup>
import ImportDialog from "./components/ImportDialog.vue";
import { provide, computed, watch, ref, onErrorCaptured } from 'vue';
import { createContentState, contentKey } from './state';
const state=createContentState();provide(contentKey,state);
const route=computed(()=>state.route.value),error=ref('');
const page=computed(()=>route.value.path.split('/')[1] || 'home');
const nav=[['/','地图总览'],['/chain','作业链'],['/cases','案例库'],['/guide','接入指南']];
function focusMain(){document.getElementById('main-content')?.focus();}
watch(()=>route.value.path,()=>{error.value='';window.scrollTo?.({top:0,behavior:'instant'});});
watch(()=>[state.atlas.value,route.value.path],()=>{const id=route.value.path.split('/')[2],A=state.atlas.value;const title=page.value==='scene'?A.index.byScene[id]?.name:page.value==='stage'?A.index.byStage[id]?.name:page.value==='method'?A.methods[id]?.name:({home:'地图总览',chain:'作业链',cases:'案例库',guide:'接入指南',admin:'内容管理'})[page.value];document.title=`${title || '页面不存在'} · 智能化可能性地图`;},{immediate:true});
onErrorCaptured(e=>{console.error(e);error.value=e.message;return false;});
</script>

<template>
<n-config-provider :theme-overrides="{common:{primaryColor:'#286957',primaryColorHover:'#347c65',fontSize:'16px'}}"><n-message-provider><n-dialog-provider>
  <a class="atlas-skip" href="#main-content" @click.prevent="focusMain">跳到主要内容</a>
  <header class="atlas-header"><div class="atlas-header-inner"><router-link class="atlas-brand" to="/"><span class="atlas-brand-icon" aria-hidden="true">↗</span><span><b>石油智能化地图</b><small>Petroleum Intelligence Atlas</small></span></router-link><nav aria-label="主导航"><router-link v-for="[path,label] in nav" :key="path" :to="`${path}`" :aria-current="route.path===path?'page':undefined" :class="{active:route.path===path}">{{ label }}</router-link><router-link to="/admin" :class="{active:page==='admin'}">管理</router-link></nav><n-button class="atlas-button primary" data-import>＋ 添加案例</n-button></div></header>
  <div class="atlas-layout"><aside class="atlas-sidebar"><span class="atlas-eyebrow">作业环节</span><nav aria-label="作业环节导航"><router-link v-for="stage in state.atlas.value.stages" :key="stage.id" :to="`/stage/${stage.id}`" :class="{active:route.path===`/stage/${stage.id}` || (page==='scene' && state.atlas.value.index.byScene[route.path.split('/')[2]]?.stageId===stage.id)}"><span class="atlas-code">{{ String(stage.idx).padStart(2,'0') }}</span><span>{{ stage.name }}</span><small>{{ stage.scenes.length }}</small></router-link></nav><div class="atlas-sidebar-note"><b>钻井课程作业</b><p>第 3 类 · 学号末两位 29</p><router-link to="/stage/drilling">五个子类别 →</router-link></div></aside>
    <main id="main-content" class="atlas-main" tabindex="-1"><section v-if="error" class="atlas-empty" role="alert"><h1>页面加载异常</h1><p>{{ error }}</p><router-link to="/">返回地图总览</router-link></section><router-view v-else /><footer class="atlas-footer"><span>石油勘探开发的智能化可能性地图</span><span>教学案例 · 纯前端运行 · 内容模块独立</span></footer></main>
  </div>
<ImportDialog /></n-dialog-provider></n-message-provider></n-config-provider></template>