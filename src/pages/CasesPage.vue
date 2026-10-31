<script setup lang="ts">
import {computed,ref,watch} from 'vue';
import {atlas,cases,caseStats,checks,hidden,refresh} from '../core/store';
import {confirm,toast} from '../ui/feedback';
import PageHeader from '../components/PageHeader.vue';
import CountUp from '../components/CountUp.vue';
import Pager from '../ui/Pager.vue';
import type {CaseDef} from '../types';

const search=ref(''),origin=ref(''),page=ref(1),size=ref(12);
const sceneName=(c:CaseDef)=>atlas.value.index.byScene[c.sceneId]?.name||'';
const entries=computed(()=>{
  const q=search.value.toLowerCase();
  return cases.value.filter(c=>(!origin.value||(origin.value==='local')===!!c.imported)&&`${c.title} ${c.id} ${sceneName(c)}`.toLowerCase().includes(q));
});
const visible=computed(()=>entries.value.slice((page.value-1)*size.value,page.value*size.value));
watch([search,origin,size],()=>{page.value=1;});
watch(()=>entries.value.length,n=>{page.value=Math.min(page.value,Math.max(1,Math.ceil(n/size.value)));});
const imported=computed(()=>cases.value.filter(c=>c.imported).length);
const errors=(id:string)=>(checks.value[id]||[]).filter(x=>x.level==='error').length;

async function remove(c:CaseDef){
  const ok=await confirm({title:c.imported?'移除导入案例':'隐藏内置案例',body:c.imported?`从当前浏览器移除「${c.title}」，磁盘上的源文件不受影响。`:`隐藏「${c.title}」，刷新后仍保持隐藏，可在本页底部恢复。`,danger:true});
  if(ok)window.__PackageService.removeConfirmed(c.id);
}
function revalidate(){refresh();toast('info','已重新校验',`${cases.value.length} 个案例`);}
</script>

<template>
  <div class="page"><div class="wrap">
    <PageHeader idx="CASE LIBRARY" en="Registered case packages" title="案例库与接入状态" blurb="全部已注册案例、导入来源与协议校验结果。内置案例可隐藏并恢复，本地导入的案例保存在当前浏览器。">
      <template #actions><button type="button" class="btn primary" data-import>＋ 添加案例</button></template>
    </PageHeader>
    <dl class="console">
      <div><dt>已注册案例</dt><dd><CountUp :value="caseStats.registered"/></dd></div>
      <div><dt>可运行演示</dt><dd><CountUp :value="caseStats.withDemo"/></dd></div>
      <div><dt>已覆盖场景</dt><dd><CountUp :value="caseStats.coveredScenes"/><small>/ {{ atlas.allScenes.length }}</small></dd></div>
      <div><dt>本地导入</dt><dd><CountUp :value="imported"/></dd></div>
    </dl>
    <form class="lib-tools" role="search" @submit.prevent>
      <input v-model="search" class="ui-input" type="search" placeholder="名称、ID 或所属场景" aria-label="案例搜索">
      <select v-model="origin" class="ui-select" aria-label="案例来源"><option value="">全部案例</option><option value="local">本地导入</option><option value="builtin">内置案例</option></select>
      <button type="button" class="btn" @click="revalidate">重新校验</button>
      <span class="mono lib-count">{{ entries.length }} 个结果</span>
    </form>
    <TransitionGroup v-if="entries.length" tag="ul" name="list" class="lib-grid" role="list" aria-label="案例列表">
      <li v-for="c in visible" :key="c.id">
        <article class="lib-card" :aria-label="c.title">
          <div class="lc-top"><span class="mono">{{ c.id }}</span><span class="lc-state" :data-state="errors(c.id)?'bad':'ok'">{{ errors(c.id)?`${errors(c.id)} 项错误`:'校验通过' }}</span></div>
          <h2>{{ c.title }}</h2>
          <p class="lc-scene">{{ atlas.index.byScene[c.sceneId]?.stageName }} / {{ sceneName(c)||'场景未匹配' }}</p>
          <details><summary>接口校验明细</summary><ul class="lc-checks"><li v-for="(x,i) in checks[c.id]||[]" :key="i" :data-lv="x.level"><b>{{ x.label }}</b><span>{{ x.detail }}</span></li></ul></details>
          <div class="lc-foot">
            <span class="mono">{{ c.imported?'本地导入':'内置案例' }} · v{{ c.version||'—' }} · {{ c.updated }}</span>
            <span class="lc-acts"><button type="button" class="btn sm ghost" @click="remove(c)">{{ c.imported?'移除':'隐藏' }}</button><router-link class="btn sm primary" :to="`/scene/${c.sceneId}?case=${c.id}`">打开案例 →</router-link></span>
          </div>
        </article>
      </li>
    </TransitionGroup>
    <div v-else class="empty"><b>没有符合条件的案例</b>可清空搜索或切换来源。</div>
    <Pager v-if="entries.length" v-model:page="page" v-model:size="size" :total="entries.length" :sizes="[6,12,24]" label="案例分页"/>
    <aside v-if="hidden.length" class="lib-hidden" aria-labelledby="hidden-title">
      <h2 id="hidden-title">已隐藏的内置案例</h2>
      <div><button v-for="id in hidden" :key="id" type="button" class="btn sm" :data-restore-case="id">恢复 {{ id }}</button></div>
    </aside>
  </div></div>
</template>
