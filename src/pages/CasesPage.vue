<script setup>
import { computed, inject, ref } from 'vue';
import {useDialog} from 'naive-ui';
import { contentKey } from '../state';
const dialog=useDialog();
function removeCase(c){dialog.warning({title:c.imported?'移除案例':'隐藏案例',content:'确认更新当前浏览器中的案例记录？',positiveText:'确认',negativeText:'取消',onPositiveClick:()=>window.__PackageService.removeConfirmed(c.id)});}
const state=inject(contentKey), search=ref(''), origin=ref('');
const entries=computed(() => state.cases.value.filter(c => (!origin.value || (origin.value==='local'?c.imported:!c.imported)) && `${c.title} ${c.id} ${state.atlas.value.index.byScene[c.sceneId]?.name || ''}`.toLowerCase().includes(search.value.toLowerCase())));
const checks=computed(() => { state.atlas.value; state.cases.value; return state.host.Cases.validateAll(); });
const blocked=computed(() => { state.atlas.value; state.cases.value; return state.host.CaseImport.blockedList().filter(id=>!state.host.Cases.get(id)); });
const stats=computed(() => { state.atlas.value; state.cases.value; return state.host.Cases.stats(); });
const errors=id => (checks.value[id]||[]).filter(x=>x.level==='error').length;
</script>

<template>
  <section class="atlas-section"><header class="atlas-page-heading"><span class="atlas-eyebrow">CASE LIBRARY</span><h1>案例库与接入状态</h1><p>查看全部案例、导入来源与协议校验结果。已有同学案例包继续通过原入口导入。</p></header><div class="atlas-library-summary"><span><b>{{ stats.registered }}</b>已注册案例</span><span><b>{{ stats.withDemo }}</b>可运行演示</span><span><b>{{ stats.coveredScenes }}</b>已覆盖场景</span><n-button class="atlas-button primary" data-import>＋ 添加案例</n-button></div><form class="atlas-filterbar" @submit.prevent><label>案例搜索<n-input v-model:value="search" placeholder="名称、ID 或所属场景" clearable/></label><label>来源<n-select v-model:value="origin" :options="[{label:'全部案例',value:''},{label:'本地导入',value:'local'},{label:'内置案例',value:'builtin'}]" style="min-width:140px"/></label><n-button attr-type="button" class="atlas-button" @click="state.refresh">重新校验</n-button></form><div class="atlas-case-list"><article v-for="c in entries" :key="c.id" class="atlas-library-card"><div class="atlas-card-top"><span class="atlas-code">{{ c.id }}</span><span class="atlas-pill" :class="errors(c.id)?'error':'ready'">{{ errors(c.id)?`${errors(c.id)} 项错误`:'校验通过' }}</span></div><h2>{{ c.title }}</h2><p>{{ state.atlas.value.index.byScene[c.sceneId]?.stageName }} / {{ state.atlas.value.index.byScene[c.sceneId]?.name || '场景未匹配' }}</p><div class="atlas-card-bottom"><span>{{ c.imported?'本地导入':'内置案例' }} · v{{ c.version || '—' }}</span><span>{{ c.updated }}</span></div><div class="atlas-actions"><router-link class="atlas-button primary" :to="`/scene/${c.sceneId}?case=${c.id}`">打开案例 →</router-link><n-button class="atlas-button" @click="removeCase(c)">{{ c.imported?'移除':'隐藏' }}</n-button></div><details><summary>接口校验明细</summary><ul class="atlas-checks"><li v-for="(check,i) in checks[c.id] || []" :key="i" :class="check.level"><b>{{ check.level==='error'?'✕':check.level==='warn'?'!':'✓' }} {{ check.label }}</b><span>{{ check.detail }}</span></li></ul></details></article></div><p v-if="!entries.length" class="atlas-empty">没有符合条件的案例。</p><aside v-if="blocked.length" class="atlas-notice"><h2>已隐藏的内置案例</h2><div class="atlas-actions"><n-button v-for="id in blocked" :key="id" class="atlas-button" :data-restore-case="id">恢复 {{ id }}</n-button></div></aside></section>
</template>
