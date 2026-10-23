<script setup>
import { computed, inject } from 'vue';
import { contentKey } from '../state';
import LegacyHtml from '../components/LegacyHtml.vue';
import DemoHost from '../components/DemoHost.vue';
import {NTabs,NTabPane} from 'naive-ui';
const state = inject(contentKey), K = state.host.K;
const route = computed(() => state.route.value);
const scene = computed(() => state.atlas.value.index.byScene[route.value.path.split('/')[2]]);
const cases = computed(() => { state.atlas.value; state.cases.value; return scene.value ? state.host.Cases.bySceneAll(scene.value.id) : []; });
const kase = computed(() => cases.value.find(c => c.id === route.value.query.case) || cases.value[0]);
const tabs = computed(() => ['background','workflow','demo'].filter(k => kase.value?.tabs[k]).map(key => ({key, label:kase.value.tabs[key].label || ({background:'专业背景',workflow:'案例流程',demo:'案例演示'})[key]})));
const active = computed(() => { const alias = {bg:'background',flow:'workflow',demo:'demo',1:'background',2:'workflow',3:'demo'}; const key = alias[route.value.query.tab] || route.value.query.tab; return tabs.value.some(t => t.key === key) ? key : tabs.value[0]?.key; });
const background = computed(() => kase.value?.tabs.background);
const workflow = computed(() => kase.value?.tabs.workflow);
const related = computed(() => { state.atlas.value; state.cases.value; return scene.value ? state.atlas.value.allScenes.filter(s => s.id !== scene.value.id && (s.stageId === scene.value.stageId || s.methods.some(k => scene.value.methods.includes(k)))).slice(0,4) : []; });
function selectTab(tab) { state.navigate(route.value.path, {...route.value.query,tab:({background:'bg',workflow:'flow',demo:'demo'})[tab]}); }
function selectCase(event) { state.navigate(route.value.path, {...route.value.query, case:event}); }
function tabKey(event,index){const keys=['ArrowLeft','ArrowRight','Home','End'];if(!keys.includes(event.key))return;event.preventDefault();const i=event.key==='Home'?0:event.key==='End'?tabs.value.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.value.length)%tabs.value.length;selectTab(tabs.value[i].key);document.getElementById(`tab-${tabs.value[i].key}`)?.focus();}
</script>

<template>
  <section v-if="scene" class="atlas-section atlas-scene-page" :key="scene.id">
    <nav class="atlas-breadcrumb" aria-label="当前位置"><router-link to="/">地图</router-link><span>/</span><router-link :to="`/stage/${scene.stageId}`">{{ scene.stageName }}</router-link><span>/</span><span>{{ scene.name }}</span></nav>
    <header class="atlas-detail-heading"><div><span class="atlas-eyebrow">{{ scene.id.toUpperCase() }} · {{ scene.stageName }}</span><h1>{{ scene.name }}</h1><p>{{ scene.intro }}</p><div class="atlas-actions"><span v-for="method in scene.methods" :key="method" class="atlas-method">{{ state.atlas.value.methods[method]?.name || method }}</span><span class="atlas-pill">难度 {{ scene.diff }}</span></div></div><n-button class="atlas-button" data-import :data-scene="scene.id">＋ 添加案例</n-button></header>
    <template v-if="kase">
      <div class="atlas-case-bar"><div><span class="atlas-pill ready">{{ kase.imported ? '本地导入' : '内置案例' }}</span><span>{{ kase.title }}</span><small>v{{ kase.version || '—' }}</small></div><label v-if="cases.length > 1">当前案例<n-select :value="kase.id" :options="cases.map(c=>({label:c.title,value:c.id}))" @update:value="selectCase" style="min-width:220px"/></label></div>
      <n-tabs :value="active" type="line" role="tablist" aria-label="案例内容" @update:value="selectTab"><n-tab-pane v-for="(tab,i) in tabs" :key="tab.key" :name="tab.key" :tab="tab.label" :tab-props="{id:`tab-${tab.key}`,role:'tab',tabindex:active===tab.key?0:-1,'aria-selected':active===tab.key,'aria-controls':`panel-${tab.key}`,onKeydown:e=>tabKey(e,i)}"><template #tab>{{tab.label}}</template></n-tab-pane></n-tabs>
      <section v-if="active==='background' && background" id="panel-background" role="tabpanel" aria-labelledby="tab-background" class="panel on atlas-case-panel" :key="`${kase.id}-background`">
        <LegacyHtml v-if="background.judge" :html="K.judge(background.judge)"/><p v-if="background.lede" class="atlas-lead" v-html="K.rich(background.lede)"></p>
        <article v-for="(section,i) in background.sections || []" :key="i" class="atlas-content-section"><div class="atlas-section-number">{{ String(section.no || i+1).padStart(2,'0') }}<span>{{ section.en }}</span></div><div><h2>{{ section.title }}</h2><LegacyHtml :html="section.html || section.body || ''"/></div></article>
      </section>
      <section v-if="active==='workflow' && workflow" id="panel-workflow" role="tabpanel" aria-labelledby="tab-workflow" class="panel on atlas-case-panel" :key="`${kase.id}-workflow`">
        <div class="atlas-workflow-heading"><div><h2>{{ workflow.title || '案例流程' }}</h2><p v-for="(lead,i) in workflow.lead || []" :key="i" v-html="K.rich(lead)"></p></div><LegacyHtml v-if="workflow.stats" :html="K.cells(workflow.stats)"/></div>
        <LegacyHtml :html="K.pipeline(workflow.steps || [])"/>
        <article v-if="workflow.metrics" class="atlas-content-section"><div class="atlas-section-number">评价</div><div><h2>{{ workflow.metrics.title || '评价指标' }}</h2><LegacyHtml :html="workflow.metrics.html || ''"/></div></article>
        <article v-if="workflow.fails?.length" class="atlas-content-section"><div class="atlas-section-number">限制</div><div><h2>模型失败模式</h2><LegacyHtml :html="K.fails(workflow.fails)"/></div></article>
      </section>
      <section v-if="active==='demo'" id="panel-demo" role="tabpanel" aria-labelledby="tab-demo" class="panel on atlas-case-panel"><p v-if="kase.tabs.demo.intro" class="atlas-lead">{{ kase.tabs.demo.intro }}</p><DemoHost :key="`${scene.id}/${kase.id}`" :scene="scene" :kase="kase"/></section>
    </template>
    <template v-else>
      <div class="atlas-notice"><h2>案例待接入</h2><p>本场景已收录业务背景与方法方向，可通过“添加案例”接入专业背景、流程及演示。</p></div>
      <article class="atlas-content-section"><div class="atlas-section-number">01</div><div><h2>业务问题</h2><p>{{ scene.problem }}</p></div></article>
      <article class="atlas-content-section"><div class="atlas-section-number">02</div><div><h2>智能方法介入点</h2><p>{{ scene.point }}</p></div></article>
      <article class="atlas-content-section"><div class="atlas-section-number">03</div><div><h2>数据条件</h2><LegacyHtml :html="K.dtable(['数据类型','规模 / 规格','标注要求'],scene.data || [])"/></div></article>
      <article class="atlas-content-section"><div class="atlas-section-number">04</div><div><h2>技术难度与参考方向</h2><p>{{ scene.diffWhy }}</p><div class="atlas-actions"><span v-for="ref in scene.refs || []" :key="ref" class="atlas-method">{{ ref }}</span></div></div></article>
    </template>
    <aside class="atlas-related"><h2>相关业务场景</h2><div><router-link v-for="s in related" :key="s.id" :to="`/scene/${s.id}`"><span>{{ s.name }}</span><small>{{ s.stageName }} →</small></router-link></div></aside>
  </section>
  <section v-else class="atlas-empty"><h1>业务场景不存在</h1><router-link to="/">返回地图总览</router-link></section>
</template>
