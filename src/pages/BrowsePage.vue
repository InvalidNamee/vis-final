<script setup lang="ts">
import {computed} from 'vue';
import {useAtlas,pad} from '../composables/useAtlas';
import PageHead from '../components/layout/PageHead.vue';
import SceneRow from '../components/common/SceneRow.vue';
import StackBar from '../components/common/StackBar.vue';
const {atlas,host,route,navigate,methodKeys,colorOf,tick}=useAtlas();
const isMethod=computed(()=>route.value.path.startsWith('/method/'));
const id=computed(()=>route.value.path.split('/')[2]);
const entity=computed<any>(()=>isMethod.value?atlas.value.methods[id.value]:atlas.value.index.byStage[id.value]);
const scenes=computed<any[]>(()=>{tick();return entity.value?[...(isMethod.value?atlas.value.index.byMethod[id.value]||[]:entity.value.scenes)]:[];});
function field(key:string){return computed<string>({get:()=>route.value.query[key]||'',set:value=>navigate(route.value.path,{...route.value.query,[key]:value})});}
const search=field('q'),method=field('m'),difficulty=field('d'),implemented=field('ready');
const filtered=computed(()=>scenes.value.filter(s=>(!search.value||`${s.name} ${s.point} ${s.stageName}`.toLowerCase().includes(search.value.toLowerCase()))&&(!method.value||s.methods.includes(method.value))&&(!difficulty.value||s.diff===difficulty.value)&&(!implemented.value||host.Cases.byScene(s.id))));
const methods=computed(()=>methodKeys.value.filter(k=>scenes.value.some(s=>s.methods.includes(k))));
const hasFilter=computed(()=>!!(search.value||method.value||difficulty.value||implemented.value));
const count=(d:string)=>scenes.value.filter(s=>s.diff===d).length;
const stats=computed<[number,string][]>(()=>isMethod.value?[[scenes.value.length,'场景'],[new Set(scenes.value.map(s=>s.stageId)).size,'涉及环节'],[scenes.value.filter(s=>host.Cases.byScene(s.id)).length,'已接入案例']]:[[scenes.value.length,'场景'],[count('低'),'低难度'],[count('高'),'高难度']]);
// 方法页：按作业环节分组
const groups=computed(()=>atlas.value.stages.map((st:any)=>({st,items:filtered.value.filter(s=>s.stageId===st.id)})).filter((g:any)=>g.items.length));
const stageIndex=computed(()=>atlas.value.stages.findIndex((s:any)=>s.id===id.value));
const prev=computed(()=>isMethod.value?null:atlas.value.stages[stageIndex.value-1]);
const next=computed(()=>isMethod.value?null:atlas.value.stages[stageIndex.value+1]);
const methodBar=computed(()=>atlas.value.stages.map((st:any)=>({value:scenes.value.filter(s=>s.stageId===st.id).length,color:'var(--mc)',label:st.name})).filter((p:any)=>p.value));
function clear(){navigate(route.value.path);}
</script>

<template>
  <div v-if="entity" class="page browse" :data-m="isMethod?colorOf(id):undefined"><div class="wrap">
    <PageHead :idx="isMethod?`METHOD · ${entity.abbr}`:`STAGE ${pad(entity.idx)} / ${pad(atlas.stages.length)}`" :title="isMethod?`${entity.name}在石油勘探开发中的可应用场景`:`${entity.name}环节的可智能化场景`" :en="isMethod?entity.signal:entity.en" :blurb="entity.blurb||entity.desc" :stats="stats"/>

    <div class="filters" role="group" aria-label="场景筛选">
      <template v-if="!isMethod">
        <span class="lbl">方法</span>
        <button type="button" class="chip" :class="{on:!method}" :aria-pressed="!method" @click="method=''">全部方法</button>
        <button v-for="k in methods" :key="k" type="button" class="chip" :class="{on:method===k}" :data-m="colorOf(k)" :aria-pressed="method===k" @click="method=method===k?'':k">{{ atlas.methods[k].abbr }} {{ atlas.methods[k].name }}</button>
        <span class="divider"></span>
      </template>
      <span class="lbl">难度</span>
      <button type="button" class="chip" :class="{on:!difficulty}" :aria-pressed="!difficulty" @click="difficulty=''">全部难度</button>
      <button v-for="d in ['低','中','高']" :key="d" type="button" class="chip" :class="{on:difficulty===d}" :aria-pressed="difficulty===d" @click="difficulty=difficulty===d?'':d">{{ d }}</button>
      <span class="divider"></span>
      <n-input v-model:value="search" class="f-search" size="small" placeholder="搜索当前场景" clearable/>
      <n-checkbox class="f-ready" :checked="!!implemented" @update:checked="(v:boolean)=>implemented=v?'1':''">仅显示已有案例</n-checkbox>
      <button v-if="hasFilter" type="button" class="reset" @click="clear">清除筛选</button>
      <span class="count">{{ filtered.length }} / {{ scenes.length }} 个场景</span>
    </div>

    <TransitionGroup v-if="!isMethod" tag="div" name="list" class="scenes"><SceneRow v-for="s in filtered" :key="s.id" :scene="s"/></TransitionGroup>
    <div v-else class="scenes">
      <div v-if="methodBar.length" class="mg-bar"><span>环节分布</span><StackBar :parts="methodBar"/><span>{{ methodBar.length }} 个环节</span></div>
      <section v-for="g in groups" :key="g.st.id" class="method-group">
        <router-link class="mg-head" :to="`/stage/${g.st.id}?m=${id}`"><span class="idx">{{ pad(g.st.idx) }}</span><h3>{{ g.st.name }}</h3><span class="cnt">{{ g.items.length }} 个场景 →</span></router-link>
        <TransitionGroup tag="div" name="list" class="mg-list"><SceneRow v-for="s in g.items" :key="s.id" :scene="s"/></TransitionGroup>
      </section>
    </div>
    <div v-if="!filtered.length" class="empty"><b>当前条件下没有匹配的场景</b><button type="button" class="btn sm" @click="clear">清除筛选</button></div>

    <nav v-if="!isMethod" class="pager" aria-label="环节翻页">
      <router-link v-if="prev" class="prev" :to="`/stage/${prev.id}`"><span class="dir">← 上一环节 · {{ pad(prev.idx) }}</span><span class="t">{{ prev.name }}</span></router-link>
      <router-link v-else class="prev" to="/chain"><span class="dir">← 返回</span><span class="t">作业链</span></router-link>
      <router-link v-if="next" class="next" :to="`/stage/${next.id}`"><span class="dir">下一环节 · {{ pad(next.idx) }} →</span><span class="t">{{ next.name }}</span></router-link>
    </nav>
    <nav v-else class="pager" aria-label="方法切换">
      <router-link v-for="k in methodKeys.filter(k=>k!==id)" :key="k" :to="`/method/${k}`"><span class="dir">METHOD · {{ atlas.methods[k].abbr }}</span><span class="t">{{ atlas.methods[k].name }}</span></router-link>
    </nav>
  </div></div>
  <div v-else class="wrap empty-state"><div class="code-404">404</div><h1>场景分类不存在</h1><p>该环节或方法不在当前地图中。</p><router-link class="btn" to="/">返回地图总览</router-link></div>
</template>
