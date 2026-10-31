<script setup lang="ts">
import {computed,nextTick} from 'vue';
import {useRoute,useRouter} from 'vue-router';
import {atlas,casesOf} from '../core/store';
import {pad,refName,cleanQuery} from '../core/format';
import ContentHtml from '../components/ContentHtml.vue';
import DemoHost from '../components/DemoHost.vue';
import MethodTag from '../components/MethodTag.vue';

const route=useRoute(),router=useRouter(),K=window.K;
const scene=computed(()=>atlas.value.index.byScene[String(route.params.id)]);
const stage=computed(()=>scene.value&&atlas.value.index.byStage[scene.value.stageId]);
const cases=computed(()=>scene.value?casesOf(scene.value.id):[]);
const kase=computed(()=>cases.value.find(c=>c.id===route.query.case)||cases.value[0]);

type TabKey='background'|'workflow'|'demo';
const LABEL:Record<TabKey,string>={background:'专业背景',workflow:'案例流程',demo:'案例演示'};
const SHORT:Record<TabKey,string>={background:'bg',workflow:'flow',demo:'demo'};
const ALIAS:Record<string,TabKey>={bg:'background',flow:'workflow',demo:'demo','1':'background','2':'workflow','3':'demo'};
const tabs=computed(()=>(['background','workflow','demo'] as TabKey[]).filter(k=>kase.value?.tabs[k]).map(key=>({key,label:kase.value!.tabs[key]!.label||LABEL[key]})));
const active=computed<TabKey|undefined>(()=>{const q=String(route.query.tab||''),key=ALIAS[q]||q as TabKey;return tabs.value.some(t=>t.key===key)?key:tabs.value[0]?.key;});
const background=computed(()=>kase.value?.tabs.background);
const workflow=computed(()=>kase.value?.tabs.workflow);

const sameStage=computed(()=>scene.value&&stage.value?stage.value.scenes.filter(s=>s.id!==scene.value!.id).slice(0,4):[]);
const firstMethod=computed(()=>scene.value?.methods[0]||'');
const sameMethod=computed(()=>scene.value?(atlas.value.index.byMethod[firstMethod.value]||[]).filter(s=>s.id!==scene.value!.id).slice(0,4):[]);

const go=(patch:Record<string,string>)=>router.push({path:route.path,query:cleanQuery({...route.query,...patch})});
const selectTab=(key:TabKey)=>go({tab:SHORT[key]});
// Arrow keys, Home and End move between tabs (WAI-ARIA tabs pattern).
function tabKey(event:KeyboardEvent,index:number){
  const n=tabs.value.length,map:Record<string,number>={ArrowLeft:index-1,ArrowRight:index+1,Home:0,End:n-1};
  if(!(event.key in map))return;
  event.preventDefault();
  const next=tabs.value[(map[event.key]+n)%n];
  void selectTab(next.key).then(()=>nextTick(()=>document.getElementById(`tab-${next.key}`)?.focus()));
}
</script>

<template>
  <div v-if="scene&&stage" class="page scene-page"><div class="wrap">
    <header class="scene-head">
      <div class="sh-meta">
        <router-link class="tag" :to="`/stage/${stage.id}`">环节 {{ pad(stage.idx) }} · {{ stage.name }}</router-link>
        <MethodTag v-for="k in scene.methods" :key="k" :k="k" link/>
        <span v-if="kase" class="badge-ready">已接入案例{{ cases.length>1?` ×${cases.length}`:'' }}</span>
        <span v-else class="badge-wip">未接入案例</span>
      </div>
      <h1>{{ scene.name }}</h1>
      <p class="sh-intro">{{ scene.intro }}</p>
      <div class="sh-foot">
        <span class="dtag" :data-d="scene.diff">难度 {{ scene.diff }}</span>
        <span v-if="scene.status==='ext'" class="badge-wip">待扩展</span>
        <span class="tag">{{ scene.id.toUpperCase() }}</span>
        <button type="button" class="btn sm" data-import :data-scene="scene.id">＋ 添加案例</button>
      </div>
    </header>

    <template v-if="kase">
      <div class="case-bar">
        <span class="badge-ready">{{ kase.imported?'本地导入':'内置案例' }}</span>
        <span class="cb-title">{{ kase.title }}</span>
        <span class="cb-id mono">{{ kase.id }} · v{{ kase.version||'—' }}</span>
        <label v-if="cases.length>1" class="cb-switch">当前案例
          <select class="ui-select sm" :value="kase.id" @change="go({case:($event.target as HTMLSelectElement).value})"><option v-for="c in cases" :key="c.id" :value="c.id">{{ c.title }}</option></select>
        </label>
      </div>
      <div class="tabs" role="tablist" aria-label="案例内容">
        <button v-for="(t,i) in tabs" :id="`tab-${t.key}`" :key="t.key" type="button" class="tab" role="tab" :aria-selected="active===t.key" :aria-controls="`panel-${t.key}`" :tabindex="active===t.key?0:-1" @click="selectTab(t.key)" @keydown="tabKey($event,i)">
          <span class="mono" aria-hidden="true">{{ pad(i+1) }}</span>{{ t.label }}
        </button>
      </div>
      <Transition name="panel" mode="out-in">
        <section v-if="active==='background'&&background" id="panel-background" :key="`${kase.id}-bg`" class="case-panel" role="tabpanel" aria-labelledby="tab-background">
          <ContentHtml v-if="background.judge" :html="K.judge(background.judge)"/>
          <div v-if="background.lede" class="lede-block"><span class="kicker">专业场景介绍</span><p v-html="K.rich(background.lede)"></p></div>
          <article v-for="(s,i) in background.sections||[]" :key="i" class="content-section">
            <div class="sn mono">{{ pad(s.no||i+1) }}<span>{{ s.en }}</span></div>
            <div class="cs-body"><h2>{{ s.title }}</h2><ContentHtml :html="s.html||s.body||''"/></div>
          </article>
        </section>
        <section v-else-if="active==='workflow'&&workflow" id="panel-workflow" :key="`${kase.id}-flow`" class="case-panel" role="tabpanel" aria-labelledby="tab-workflow">
          <div class="wf-head">
            <div><span class="kicker">CASE WALKTHROUGH</span><h2>{{ workflow.title||'案例流程' }}</h2><p v-for="(lead,i) in workflow.lead||[]" :key="i" v-html="K.rich(lead)"></p></div>
            <ContentHtml v-if="workflow.stats" :html="K.cells(workflow.stats)"/>
          </div>
          <ContentHtml :html="K.pipeline(workflow.steps||[])"/>
          <article v-if="workflow.metrics" class="content-section"><div class="sn mono">EVAL<span>METRICS</span></div><div class="cs-body"><h2>{{ workflow.metrics.title||'评价指标' }}</h2><ContentHtml :html="workflow.metrics.html||''"/></div></article>
          <article v-if="workflow.fails?.length" class="content-section"><div class="sn mono">FAIL<span>MODES</span></div><div class="cs-body"><h2>模型失败模式</h2><ContentHtml :html="K.fails(workflow.fails)"/></div></article>
        </section>
        <section v-else-if="active==='demo'&&kase.tabs.demo" id="panel-demo" key="demo" class="case-panel" role="tabpanel" aria-labelledby="tab-demo">
          <p v-if="kase.tabs.demo.intro" class="demo-intro">{{ kase.tabs.demo.intro }}</p>
          <DemoHost :key="`${scene.id}/${kase.id}`" :scene="scene" :kase="kase"/>
        </section>
      </Transition>
    </template>

    <div v-else class="no-case">
      <article class="content-section"><div class="sn mono">01<span>PROBLEM</span></div><div class="cs-body"><h2>业务问题</h2><p>{{ scene.problem }}</p></div></article>
      <article class="content-section"><div class="sn mono">02<span>INTERVENTION</span></div><div class="cs-body"><h2>智能方法介入点</h2><p>{{ scene.point }}</p></div></article>
      <article class="content-section"><div class="sn mono">03<span>DATA</span></div><div class="cs-body"><h2>数据条件</h2><ContentHtml :html="K.dtable(['数据类型','规模 / 规格','标注要求'],scene.data||[])"/></div></article>
      <article class="content-section"><div class="sn mono">04<span>DIFFICULTY</span></div><div class="cs-body"><h2>技术难度与参考方向</h2><p><span class="dtag" :data-d="scene.diff">难度 {{ scene.diff }}</span> {{ scene.diffWhy }}</p><ContentHtml :html="K.meter(scene.diff)"/><div class="refs-list"><span v-for="r in scene.refs" :key="refName(r)" class="tag">{{ refName(r) }}</span></div></div></article>
      <div class="pending">
        <span class="badge-wip">案例待接入</span>
        <h2>案例接入状态</h2>
        <p>本场景的业务问题、介入点、数据条件与难度已收录，尚未配套可讲解、可运行的案例。提交一个案例包后，本页会自动出现专业背景、案例流程和案例演示三个标签页。</p>
        <div class="pending-actions"><button type="button" class="btn primary" data-import :data-scene="scene.id">＋ 为本场景添加案例</button><router-link class="btn" to="/cases">已接入案例</router-link><router-link class="btn ghost" to="/guide">接入指南</router-link></div>
      </div>
    </div>

    <aside class="related" aria-labelledby="related-title">
      <h2 id="related-title">相关场景</h2>
      <div class="rel-grid">
        <nav :aria-label="`同环节 · ${stage.name}`"><h3>同环节 · {{ stage.name }}</h3><router-link v-for="s in sameStage" :key="s.id" :to="`/scene/${s.id}`"><span>{{ s.name }}</span><span class="go">→</span></router-link><p v-if="!sameStage.length">本环节暂无其他场景</p></nav>
        <nav :aria-label="`同方法 · ${atlas.methods[firstMethod]?.name||''}`"><h3>同方法 · {{ atlas.methods[firstMethod]?.name }}</h3><router-link v-for="s in sameMethod" :key="s.id" :to="`/scene/${s.id}`"><span>{{ s.name }}</span><span class="go">{{ s.stageName }} →</span></router-link><p v-if="!sameMethod.length">暂无同方法场景</p></nav>
      </div>
      <div class="rel-acts"><router-link class="btn" :to="`/stage/${stage.id}`">← 返回{{ stage.name }}环节</router-link><router-link class="btn ghost" to="/">返回总览</router-link></div>
    </aside>
  </div></div>
  <div v-else class="wrap empty-state"><div class="code-404 mono">404</div><h1>业务场景不存在</h1><p>该场景编号不在当前地图中。</p><router-link class="btn" to="/">返回地图总览</router-link></div>
</template>
