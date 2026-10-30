<script setup lang="ts">
import {computed} from 'vue';
import {useAtlas,pad} from '../composables/useAtlas';
import PageHead from '../components/layout/PageHead.vue';
import MethodTag from '../components/common/MethodTag.vue';

const {atlas,route,navigate,methodKeys,colorOf,casesOf}=useAtlas();
const id=computed(()=>route.value.path.split('/')[2]);
const stage=computed(()=>atlas.value.index.byStage[id.value]);
const scenes=computed<any[]>(()=>stage.value?.scenes||[]);
const entries=computed(()=>scenes.value.map(scene=>({scene,cases:casesOf(scene.id).length})));
const methods=computed(()=>methodKeys.value.filter(k=>scenes.value.some(s=>s.methods.includes(k))));
const methodCount=(key:string)=>scenes.value.filter(s=>s.methods.includes(key)).length;
const difficultyCount=(level:string)=>scenes.value.filter(s=>s.diff===level).length;
function field(key:string){
  return computed<string>({get:()=>route.value.query[key]||'',set:value=>navigate(route.value.path,{...route.value.query,[key]:value})});
}
const search=field('q'),method=field('m'),difficulty=field('d'),implemented=field('ready');
const hasFilter=computed(()=>!!(search.value||method.value||difficulty.value||implemented.value));
const filtered=computed(()=>entries.value.filter(({scene:s,cases})=>
  (!search.value||`${s.name} ${s.point} ${s.stageName}`.toLowerCase().includes(search.value.toLowerCase()))&&
  (!method.value||s.methods.includes(method.value))&&(!difficulty.value||s.diff===difficulty.value)&&(!implemented.value||cases>0)));
const stats=computed<[number,string][]>(()=>[
  [scenes.value.length,'候选场景'],[entries.value.filter(e=>e.cases>0).length,'已接入场景'],[methods.value.length,'智能方法'],
]);
const stageIndex=computed(()=>atlas.value.stages.findIndex((s:any)=>s.id===id.value));
const prev=computed(()=>atlas.value.stages[stageIndex.value-1]);
const next=computed(()=>atlas.value.stages[stageIndex.value+1]);
function clear(){navigate(route.value.path);}
</script>

<template>
  <div v-if="stage" class="page browse stage-page"><div class="wrap">
    <PageHead :idx="`STAGE ${pad(stage.idx)} / ${pad(atlas.stages.length)}`" :title="`${stage.name}环节的可智能化场景`" :en="stage.en" :blurb="stage.blurb||stage.desc" :stats="stats"/>

    <section class="stage-filters filters" aria-label="场景筛选">
      <div class="stage-filter-row" role="group" aria-label="智能方法筛选">
        <span class="stage-filter-label">智能方法</span>
        <div class="stage-options">
          <button type="button" class="chip" :class="{on:!method}" :aria-pressed="!method" @click="method=''">全部方法<span>{{ scenes.length }}</span></button>
          <button v-for="k in methods" :key="k" type="button" class="chip" :class="{on:method===k}" :data-m="colorOf(k)" :aria-pressed="method===k" @click="method=method===k?'':k"><b>{{ atlas.methods[k].abbr }}</b>{{ atlas.methods[k].name }}<span>{{ methodCount(k) }}</span></button>
        </div>
      </div>
      <div class="stage-filter-row" role="group" aria-label="应用难度筛选">
        <span class="stage-filter-label">应用难度</span>
        <div class="stage-options">
          <button type="button" class="chip" :class="{on:!difficulty}" :aria-pressed="!difficulty" @click="difficulty=''">全部难度</button>
          <button v-for="d in ['低','中','高']" :key="d" type="button" class="chip" :class="{on:difficulty===d}" :aria-pressed="difficulty===d" @click="difficulty=difficulty===d?'':d">{{ d }}<span>{{ difficultyCount(d) }}</span></button>
        </div>
      </div>
      <div class="stage-filter-tools">
        <n-input v-model:value="search" class="stage-search" size="small" placeholder="搜索当前场景" aria-label="搜索当前场景" clearable>
          <template #prefix><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg></template>
        </n-input>
        <n-checkbox :checked="!!implemented" @update:checked="(v:boolean)=>implemented=v?'1':''">仅显示已有案例</n-checkbox>
        <button v-if="hasFilter" class="stage-reset" type="button" @click="clear">清除筛选</button>
      </div>
    </section>

    <section class="stage-catalog" aria-labelledby="stage-catalog-title">
      <header class="stage-catalog-head">
        <div><h2 id="stage-catalog-title">场景目录<span>{{ filtered.length }} / {{ scenes.length }}</span></h2><p>查看专业背景、案例流程与交互演示。</p></div>
        <router-link to="/chain" class="stage-chain-link">全部作业环节<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></router-link>
      </header>
      <TransitionGroup v-if="filtered.length" tag="div" name="list" class="stage-scenes scenes">
        <router-link v-for="{scene:s,cases} in filtered" :key="s.id" class="stage-scene atlas-scene-card" :to="`/scene/${s.id}`">
          <div class="stage-scene-top"><span class="stage-scene-id">{{ s.id.toUpperCase() }}</span><span class="dtag" :data-d="s.diff">难度 {{ s.diff }}</span></div>
          <h3>{{ s.name }}</h3>
          <p class="stage-scene-description">{{ s.point||s.intro }}</p>
          <div class="stage-scene-methods"><MethodTag v-for="k in s.methods" :key="k" :k="k"/></div>
          <div class="stage-scene-bottom">
            <span class="stage-case-state" :class="{ready:cases}"><i aria-hidden="true"></i>{{ cases?`已接入 ${cases} 个案例`:'尚无案例' }}</span>
            <span class="stage-scene-action">查看场景<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></span>
          </div>
        </router-link>
      </TransitionGroup>
      <div v-else class="stage-empty" role="status"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg><h3>暂无匹配场景</h3><p>可调整关键词、智能方法或应用难度。</p><button type="button" class="btn sm" @click="clear">清除筛选</button></div>
    </section>

    <nav class="pager stage-pager" aria-label="环节翻页">
      <router-link v-if="prev" class="prev" :to="`/stage/${prev.id}`"><span class="dir">← 上一环节 · {{ pad(prev.idx) }}</span><span class="t">{{ prev.name }}</span></router-link>
      <router-link v-else class="prev" to="/chain"><span class="dir">← 返回</span><span class="t">作业链</span></router-link>
      <router-link v-if="next" class="next" :to="`/stage/${next.id}`"><span class="dir">下一环节 · {{ pad(next.idx) }} →</span><span class="t">{{ next.name }}</span></router-link>
    </nav>
  </div></div>
  <div v-else class="wrap empty-state"><div class="code-404">404</div><h1>场景分类不存在</h1><p>该环节不在当前地图中。</p><router-link class="btn" to="/chain">返回作业链</router-link></div>
</template>

<style scoped>
.stage-page{container-type:inline-size}
.stage-filters{display:flex;flex-direction:column;align-items:stretch;gap:0;position:static;margin:4px 0 26px;padding:0 18px;background:var(--card);border:1px solid var(--line);border-radius:var(--r-l);box-shadow:var(--sh-1);backdrop-filter:none;z-index:auto}
.stage-filter-row{display:grid;grid-template-columns:64px minmax(0,1fr);align-items:start;gap:12px;padding:14px 0}
.stage-filter-row+.stage-filter-row{padding-top:0}
.stage-filter-label{padding-top:7px;font-size:12px;color:var(--ink-3);line-height:1.6}
.stage-options{display:flex;flex-wrap:wrap;gap:7px}
.stage-filters .chip{display:inline-flex;align-items:center;gap:6px;max-width:100%;padding:5px 10px;border-radius:6px;font-family:var(--sans);font-size:12px;line-height:1.6;white-space:normal;text-align:left}
.stage-filters .chip b{font-family:var(--mono);font-size:10px;font-weight:500;color:var(--mc,var(--ink-3))}
.stage-filters .chip span{font-family:var(--mono);font-size:10px;opacity:.65;margin-left:2px}
.stage-filters .chip.on{background:var(--jade-l);border-color:color-mix(in srgb,var(--jade) 35%,var(--line));color:var(--jade-d)}
.stage-filters .chip.on[data-m]{background:color-mix(in srgb,var(--mc) 9%,var(--card));border-color:color-mix(in srgb,var(--mc) 40%,var(--line));color:var(--mc)}
.stage-filter-tools{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:12px 0;border-top:1px solid var(--line)}
.stage-search{width:260px;max-width:100%}
.stage-reset{margin-left:auto;padding:4px 0;border:0;background:none;color:var(--jade-d);font:inherit;font-size:12px;cursor:pointer}
.stage-reset:hover{text-decoration:underline;text-underline-offset:3px}
.stage-catalog-head{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px}
.stage-catalog-head h2{display:flex;align-items:center;gap:10px;font-size:17px;font-weight:650}
.stage-catalog-head h2 span{font-family:var(--mono);font-size:11px;font-weight:400;color:var(--ink-4)}
.stage-catalog-head p{font-size:12px;color:var(--ink-3);margin-top:3px}
.stage-chain-link{display:inline-flex;align-items:center;gap:6px;color:var(--ink-3);font-size:12px}
.stage-chain-link:hover{color:var(--jade-d)}
.stage-scenes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;position:relative}
.stage-scene{position:relative;display:flex;flex-direction:column;min-width:0;padding:18px 20px 0;background:var(--card);border:1px solid var(--line);border-radius:var(--r-l);box-shadow:var(--sh-1);color:var(--ink);transition:border-color .16s,box-shadow .16s}
.stage-scene:hover{border-color:color-mix(in srgb,var(--jade) 35%,var(--line));box-shadow:var(--sh-2)}
.stage-scene-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
.stage-scene-id{font-family:var(--mono);font-size:11px;color:var(--ink-4);letter-spacing:.06em}
.stage-scene .dtag{padding:2px 7px;font-size:10px}
.stage-scene h3{font-size:17px;line-height:1.5;font-weight:650;overflow-wrap:anywhere}
.stage-scene:hover h3{color:var(--jade-d)}
.stage-scene-description{margin-top:8px;font-size:13px;line-height:1.8;color:var(--ink-3);overflow-wrap:anywhere}
.stage-scene-methods{display:flex;flex-wrap:wrap;gap:6px;padding:16px 0 18px;margin-top:auto}
.stage-scene-methods :deep(.mtag){font-family:var(--sans);font-size:11px;white-space:normal}
.stage-scene-methods :deep(.mtag b){font-family:var(--mono);font-size:10px}
.stage-scene-bottom{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:12px 0;border-top:1px solid var(--line);font-size:11.5px}
.stage-case-state{display:inline-flex;align-items:center;gap:6px;color:var(--ink-4)}
.stage-case-state i{width:5px;height:5px;border-radius:50%;background:var(--line-3)}
.stage-case-state.ready{color:var(--jade-d)}
.stage-case-state.ready i{background:var(--jade)}
.stage-scene-action{display:inline-flex;align-items:center;gap:6px;color:var(--ink-3)}
.stage-scene:hover .stage-scene-action{color:var(--jade-d)}
.stage-empty{display:flex;flex-direction:column;align-items:center;padding:46px 20px;border:1px dashed var(--line-2);border-radius:var(--r-l);background:var(--card-soft);text-align:center;color:var(--ink-4)}
.stage-empty h3{margin:14px 0 4px;font-size:15px;color:var(--ink-2)}
.stage-empty p{margin-bottom:18px;font-size:13px;color:var(--ink-3)}
.stage-pager{margin-top:26px;padding:18px 0 0}
.stage-pager a{flex:1;min-width:0;max-width:320px;background:var(--card);gap:5px;padding:14px 16px;border-radius:var(--r-m)}
.stage-pager .dir{font-family:var(--sans);font-size:11px;letter-spacing:0}
.stage-pager .t{font-size:14px}
.stage-page a:focus-visible,.stage-page button:focus-visible{outline:2px solid var(--jade);outline-offset:3px}
@container (max-width:720px){.stage-scenes{grid-template-columns:minmax(0,1fr)}}
@media(max-width:560px){
  .stage-filters{padding:0 14px;margin-bottom:22px}
  .stage-filter-row{grid-template-columns:minmax(0,1fr);gap:8px;padding:12px 0}
  .stage-filter-label{padding-top:0;font-weight:500}
  .stage-search{width:100%}
  .stage-options{gap:6px}
  .stage-filters .chip{padding:5px 8px}
  .stage-scene{padding:16px 16px 0}
  .stage-chain-link{font-size:11px}
  .stage-pager{gap:10px}
  .stage-pager a{padding:12px}
}
</style>
