<script setup lang="ts">
import {computed} from 'vue';
import {useAtlas,pad} from '../composables/useAtlas';
import LegacyHtml from '../components/LegacyHtml.vue';
import DemoHost from '../components/DemoHost.vue';
import Crumb from '../components/layout/Crumb.vue';
import MethodTag from '../components/common/MethodTag.vue';
const {atlas,host,route,navigate,casesOf}=useAtlas();
const K=(host as any).K;
const scene=computed<any>(()=>atlas.value.index.byScene[route.value.path.split('/')[2]]);
const stage=computed<any>(()=>scene.value&&atlas.value.index.byStage[scene.value.stageId]);
const cases=computed<any[]>(()=>scene.value?casesOf(scene.value.id):[]);
const kase=computed<any>(()=>cases.value.find(c=>c.id===route.value.query.case)||cases.value[0]);
const tabs=computed(()=>['background','workflow','demo'].filter(k=>kase.value?.tabs[k]).map(key=>({key,label:kase.value.tabs[key].label||({background:'专业背景',workflow:'案例流程',demo:'案例演示'} as Record<string,string>)[key]})));
const active=computed(()=>{const alias:Record<string,string>={bg:'background',flow:'workflow',demo:'demo',1:'background',2:'workflow',3:'demo'};const key=alias[route.value.query.tab]||route.value.query.tab;return tabs.value.some(t=>t.key===key)?key:tabs.value[0]?.key;});
const background=computed(()=>kase.value?.tabs.background);
const workflow=computed(()=>kase.value?.tabs.workflow);
const sameStage=computed<any[]>(()=>scene.value?stage.value.scenes.filter((s:any)=>s.id!==scene.value.id).slice(0,4):[]);
const firstMethod=computed(()=>scene.value?.methods[0]);
const sameMethod=computed<any[]>(()=>scene.value?(atlas.value.index.byMethod[firstMethod.value]||[]).filter((s:any)=>s.id!==scene.value.id).slice(0,4):[]);
function selectTab(tab:string){navigate(route.value.path,{...route.value.query,tab:({background:'bg',workflow:'flow',demo:'demo'} as Record<string,string>)[tab]});}
function selectCase(id:string){navigate(route.value.path,{...route.value.query,case:id});}
function tabKey(event:KeyboardEvent,index:number){const keys=['ArrowLeft','ArrowRight','Home','End'];if(!keys.includes(event.key))return;event.preventDefault();const i=event.key==='Home'?0:event.key==='End'?tabs.value.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.value.length)%tabs.value.length;selectTab(tabs.value[i].key);document.getElementById(`tab-${tabs.value[i].key}`)?.focus();}
const tabNo=(i:number)=>pad(i+1);
</script>

<template>
  <div v-if="scene" class="page scene-page atlas-scene-page"><div class="wrap">
    <Crumb :items="[['/','总览'],['/chain','作业链'],[`/stage/${stage.id}`,stage.name],['',scene.name]]"/>
    <header class="detail-head rise">
      <div class="dh-top">
        <div>
          <div class="dh-kicker">
            <router-link class="tag" :to="`/stage/${stage.id}`">环节 {{ pad(stage.idx) }} · {{ stage.name }}</router-link>
            <MethodTag v-for="k in scene.methods" :key="k" :k="k" link/>
            <span v-if="kase" class="badge-ready">已接入案例{{ cases.length>1?` ×${cases.length}`:'' }}</span>
            <span v-else class="badge-wip">未接入案例</span>
          </div>
          <h1 class="dh-title">{{ scene.name }}</h1>
          <p class="dh-sub">{{ scene.intro }}</p>
          <div class="dh-tags"><span class="dtag" :data-d="scene.diff">难度 {{ scene.diff }}</span><span v-if="scene.status==='ext'" class="badge-wip">待扩展</span><span class="tag">{{ scene.id.toUpperCase() }}</span></div>
        </div>
        <n-button data-import :data-scene="scene.id">＋ 添加案例</n-button>
      </div>
    </header>

    <template v-if="kase">
      <div class="case-bar">
        <div><span class="badge-ready">{{ kase.imported?'本地导入':'内置案例' }}</span><span class="ct">{{ kase.title }}</span><small>{{ kase.id }} · v{{ kase.version||'—' }}</small></div>
        <label v-if="cases.length>1">当前案例<n-select size="small" :value="kase.id" :options="cases.map(c=>({label:c.title,value:c.id}))" @update:value="selectCase"/></label>
      </div>
      <n-tabs class="scene-tabs" :value="active" type="line" role="tablist" aria-label="案例内容" @update:value="selectTab">
        <n-tab-pane v-for="(tab,i) in tabs" :key="tab.key" :name="tab.key" :tab="tab.label" :tab-props="({id:`tab-${tab.key}`,role:'tab','aria-label':tab.label,tabindex:active===tab.key?0:-1,'aria-selected':active===tab.key,'aria-controls':`panel-${tab.key}`,onKeydown:(e:KeyboardEvent)=>tabKey(e,i)} as any)"><template #tab><span class="mono tab-no" aria-hidden="true">{{ tabNo(i) }}</span>{{ tab.label }}</template></n-tab-pane>
      </n-tabs>
      <Transition name="panel-fade" mode="out-in">
        <section v-if="active==='background'&&background" id="panel-background" :key="`${kase.id}-background`" role="tabpanel" aria-labelledby="tab-background" class="case-panel">
          <LegacyHtml v-if="background.judge" :html="K.judge(background.judge)"/>
          <div v-if="background.lede" class="lede-block"><span class="kicker plain">专业场景介绍</span><p v-html="K.rich(background.lede)"></p></div>
          <article v-for="(section,i) in background.sections||[]" :key="i" class="atlas-content-section"><div class="sn">{{ pad(section.no||Number(i)+1) }}<span>{{ section.en }}</span></div><div><h2>{{ section.title }}</h2><LegacyHtml :html="section.html||section.body||''"/></div></article>
        </section>
        <section v-else-if="active==='workflow'&&workflow" id="panel-workflow" :key="`${kase.id}-workflow`" role="tabpanel" aria-labelledby="tab-workflow" class="case-panel">
          <div class="wf-head"><div><span class="kicker clay">CASE WALKTHROUGH</span><h2 style="margin-top:8px">{{ workflow.title||'案例流程' }}</h2><p v-for="(lead,i) in workflow.lead||[]" :key="i" v-html="K.rich(lead)"></p></div><LegacyHtml v-if="workflow.stats" :html="K.cells(workflow.stats)"/></div>
          <LegacyHtml :html="K.pipeline(workflow.steps||[])"/>
          <article v-if="workflow.metrics" class="atlas-content-section"><div class="sn">EVAL<span>METRICS</span></div><div><h2>{{ workflow.metrics.title||'评价指标' }}</h2><LegacyHtml :html="workflow.metrics.html||''"/></div></article>
          <article v-if="workflow.fails?.length" class="atlas-content-section"><div class="sn">FAIL<span>MODES</span></div><div><h2>模型失败模式</h2><LegacyHtml :html="K.fails(workflow.fails)"/></div></article>
        </section>
        <section v-else-if="active==='demo'" id="panel-demo" key="demo" role="tabpanel" aria-labelledby="tab-demo" class="case-panel">
          <p v-if="kase.tabs.demo.intro" class="demo-intro">{{ kase.tabs.demo.intro }}</p>
          <DemoHost :key="`${scene.id}/${kase.id}`" :scene="scene" :kase="kase"/>
        </section>
      </Transition>
    </template>

    <div v-else class="sec4-wrap">
      <div class="sec4"><div class="sn">01<span>PROBLEM</span></div><div class="sec4-body"><h3>业务问题</h3><p>{{ scene.problem }}</p></div></div>
      <div class="sec4"><div class="sn">02<span>INTERVENTION</span></div><div class="sec4-body"><h3>智能方法介入点</h3><p>{{ scene.point }}</p></div></div>
      <div class="sec4"><div class="sn">03<span>DATA</span></div><div class="sec4-body"><h3>数据条件</h3><LegacyHtml :html="K.dtable(['数据类型','规模 / 规格','标注要求'],scene.data||[])"/></div></div>
      <div class="sec4"><div class="sn">04<span>DIFFICULTY</span></div><div class="sec4-body"><h3>技术难度与参考方向</h3><p><span class="dtag" :data-d="scene.diff">难度 {{ scene.diff }}</span> {{ scene.diffWhy }}</p><LegacyHtml :html="K.meter(scene.diff)"/><div class="refs-list"><span v-for="r in scene.refs||[]" :key="typeof r==='string'?r:r.name" class="tag">{{ typeof r==='string'?r:r.name }}</span></div></div></div>
      <div class="pending">
        <div class="pending-top"><span class="badge-wip">案例待接入</span><h3>案例接入状态</h3></div>
        <p>本场景的业务问题、介入点、数据条件与难度已收录，尚未配套可讲解、可运行的案例。提交一个案例包后，本页会自动出现专业背景、案例流程和案例演示三个标签页。</p>
        <div class="pending-lines"><div class="pending-line"></div><div class="pending-line"></div><div class="pending-line"></div></div>
        <div class="pending-actions"><button type="button" class="btn primary" data-import :data-scene="scene.id">＋ 为本场景添加案例</button><router-link class="btn" to="/cases">已接入案例</router-link><router-link class="btn ghost" to="/guide">接入指南</router-link></div>
      </div>
    </div>

    <aside class="related">
      <span class="kicker">RELATED</span><h2 style="margin-top:8px">相关场景</h2>
      <div class="rel-grid">
        <div class="rel-col"><h5>同环节 · {{ stage.name }}</h5><router-link v-for="s in sameStage" :key="s.id" class="rel-item" :to="`/scene/${s.id}`"><span class="nm">{{ s.name }}</span><span class="go">→</span></router-link><p v-if="!sameStage.length" class="rel-empty">本环节暂无其他场景</p></div>
        <div class="rel-col"><h5>同方法 · {{ atlas.methods[firstMethod]?.name }}</h5><router-link v-for="s in sameMethod" :key="s.id" class="rel-item" :to="`/scene/${s.id}`"><span class="nm">{{ s.name }}</span><span class="go">{{ s.stageName }} →</span></router-link><p v-if="!sameMethod.length" class="rel-empty">暂无同方法场景</p></div>
      </div>
      <div class="rel-acts"><router-link class="btn" :to="`/stage/${stage.id}`">← 返回{{ stage.name }}环节</router-link><router-link class="btn ghost" to="/">返回总览</router-link></div>
    </aside>
  </div></div>
  <div v-else class="wrap empty-state"><div class="code-404">404</div><h1>业务场景不存在</h1><p>该场景编号不在当前地图中。</p><router-link class="btn" to="/">返回地图总览</router-link></div>
</template>
