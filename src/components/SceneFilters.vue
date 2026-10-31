<script setup lang="ts">
import {atlas,colorOf} from '../core/store';
import {DIFFS} from '../core/format';
import type {SceneFilterState} from '../core/filters';
import type {Scene} from '../types';

const props=defineProps<{state:SceneFilterState;scenes:Scene[];shown:number;methods?:string[]}>();
const count=(test:(s:Scene)=>boolean)=>props.scenes.filter(test).length;
const pick=(key:'m'|'d',value:string)=>{props.state[key]=props.state[key]===value?'':value;};
</script>

<template>
  <section class="filters" aria-label="场景筛选">
    <div v-if="methods" class="f-row" role="group" aria-label="智能方法筛选">
      <span class="f-label">智能方法</span>
      <div class="f-opts">
        <button type="button" class="chip" :aria-pressed="!state.m" @click="state.m=''">全部方法<small>{{ scenes.length }}</small></button>
        <button v-for="k in methods" :key="k" type="button" class="chip" :data-m="colorOf(k)" :aria-pressed="state.m===k" @click="pick('m',k)"><b>{{ atlas.methods[k].abbr }}</b>{{ atlas.methods[k].name }}<small>{{ count(s=>s.methods.includes(k)) }}</small></button>
      </div>
    </div>
    <div class="f-row" role="group" aria-label="应用难度筛选">
      <span class="f-label">应用难度</span>
      <div class="f-opts">
        <button type="button" class="chip" :aria-pressed="!state.d" @click="state.d=''">全部难度</button>
        <button v-for="d in DIFFS" :key="d" type="button" class="chip" :data-d="d" :aria-pressed="state.d===d" @click="pick('d',d)">{{ d }}<small>{{ count(s=>s.diff===d) }}</small></button>
      </div>
    </div>
    <div class="f-tools">
      <label class="f-search">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg>
        <input v-model="state.q" class="ui-input" type="search" placeholder="搜索当前场景" aria-label="搜索当前场景">
      </label>
      <label class="ui-check"><input type="checkbox" :checked="!!state.ready" @change="state.ready=($event.target as HTMLInputElement).checked?'1':''">仅显示已有案例</label>
      <span class="f-count mono" aria-live="polite">{{ shown }} / {{ scenes.length }} 个场景</span>
      <button v-if="state.active" type="button" class="f-reset" @click="state.clear">清除筛选</button>
    </div>
  </section>
</template>
