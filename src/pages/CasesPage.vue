<script setup lang="ts">
import {computed,ref,watch} from 'vue';
import {useDialog} from 'naive-ui';
import {useAtlas} from '../composables/useAtlas';
import PageHead from '../components/layout/PageHead.vue';
import Crumb from '../components/layout/Crumb.vue';
import CountUp from '../components/common/CountUp.vue';
const {state,atlas,host,caseStats,tick}=useAtlas();
const dialog=useDialog();
function removeCase(c:any){dialog.warning({title:c.imported?'移除案例':'隐藏案例',content:'确认更新当前浏览器中的案例记录？',positiveText:'确认',negativeText:'取消',onPositiveClick:()=>(window as any).__PackageService.removeConfirmed(c.id)});}
const search=ref(''),origin=ref('');
const entries=computed<any[]>(()=>state.cases.value.filter((c:any)=>(!origin.value||(origin.value==='local'?c.imported:!c.imported))&&`${c.title} ${c.id} ${atlas.value.index.byScene[c.sceneId]?.name||''}`.toLowerCase().includes(search.value.toLowerCase())));
const currentPage=ref(1),pageSize=ref(12);
const visibleEntries=computed(()=>entries.value.slice((currentPage.value-1)*pageSize.value,currentPage.value*pageSize.value));
watch([search,origin,pageSize],()=>{currentPage.value=1;});
watch(()=>entries.value.length,()=>{currentPage.value=Math.min(currentPage.value,Math.max(1,Math.ceil(entries.value.length/pageSize.value)));});
const checks=computed<Record<string,any[]>>(()=>{tick();return host.Cases.validateAll();});
const blocked=computed<string[]>(()=>{tick();return host.CaseImport.blockedList().filter((id:string)=>!host.Cases.get(id));});
const errors=(id:string)=>(checks.value[id]||[]).filter(x=>x.level==='error').length;
const imported=computed(()=>state.cases.value.filter((c:any)=>c.imported).length);
const originOptions=[{label:'全部案例',value:''},{label:'本地导入',value:'local'},{label:'内置案例',value:'builtin'}];
</script>

<template>
  <div class="page"><div class="wrap">
    <Crumb :items="[['/','总览'],['','案例库']]"/>
    <PageHead idx="CASE LIBRARY" title="案例库与接入状态" en="Registered case packages" blurb="全部已注册案例、导入来源与协议校验结果。内置案例可隐藏并恢复，本地导入的案例保存在当前浏览器。"/>
    <div class="console-bar">
      <span class="stat"><span class="num"><CountUp :value="caseStats.registered"/><small>个</small></span><span class="lbl">已注册案例</span></span>
      <span class="stat"><span class="num"><CountUp :value="caseStats.withDemo"/><small>个</small></span><span class="lbl">可运行演示</span></span>
      <span class="stat"><span class="num"><CountUp :value="caseStats.coveredScenes"/><small>/ {{ atlas.allScenes.length }}</small></span><span class="lbl">已覆盖场景</span></span>
      <span class="stat"><span class="num"><CountUp :value="imported"/><small>个</small></span><span class="lbl">本地导入</span></span>
      <span class="sp"></span>
      <n-button type="primary" data-import>＋ 添加案例</n-button>
    </div>
    <form class="lib-filters" @submit.prevent>
      <n-input v-model:value="search" placeholder="名称、ID 或所属场景" clearable aria-label="案例搜索"/>
      <n-select v-model:value="origin" :options="originOptions" aria-label="案例来源"/>
      <n-button attr-type="button" @click="state.refresh">重新校验</n-button>
      <span class="mono lib-count">{{ entries.length }} 个结果</span>
    </form>
    <TransitionGroup tag="div" name="list" class="lib-grid">
      <article v-for="c in visibleEntries" :key="c.id" class="atlas-library-card">
        <div class="lc-top"><span class="id">{{ c.id }}</span><span class="lc-state" :class="errors(c.id)?'bad':'ok'">{{ errors(c.id)?`${errors(c.id)} 项错误`:'校验通过' }}</span></div>
        <h2>{{ c.title }}</h2>
        <p class="lc-scene">{{ atlas.index.byScene[c.sceneId]?.stageName }} / {{ atlas.index.byScene[c.sceneId]?.name||'场景未匹配' }}</p>
        <div class="lc-acts"><router-link class="btn sm primary" :to="`/scene/${c.sceneId}?case=${c.id}`">打开案例 →</router-link><n-button size="small" @click="removeCase(c)">{{ c.imported?'移除':'隐藏' }}</n-button></div>
        <details><summary>接口校验明细</summary><ul class="lc-checks"><li v-for="(check,i) in checks[c.id]||[]" :key="i" :class="check.level"><b>{{ check.level==='error'?'✕':check.level==='warn'?'!':'✓' }} {{ check.label }}</b><span>{{ check.detail }}</span></li></ul></details>
        <div class="lc-meta"><span>{{ c.imported?'本地导入':'内置案例' }} · v{{ c.version||'—' }}</span><span>{{ c.updated }}</span></div>
      </article>
    </TransitionGroup>
    <div v-if="entries.length" class="lib-pager"><n-pagination v-model:page="currentPage" v-model:page-size="pageSize" :item-count="entries.length" :page-sizes="[6,12,24]" :page-slot="5" show-size-picker aria-label="案例分页"/></div>
    <div v-else class="empty"><b>没有符合条件的案例</b>可清空搜索或切换来源。</div>
    <aside v-if="blocked.length" class="lib-blocked"><h2>已隐藏的内置案例</h2><div><n-button v-for="id in blocked" :key="id" size="small" :data-restore-case="id">恢复 {{ id }}</n-button></div></aside>
  </div></div>
</template>
