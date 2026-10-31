<script setup lang="ts">
import {computed,ref} from 'vue';
import {atlas,matrix,methodKeys} from '../../core/store';
import {pad} from '../../core/format';

/* Stage × method heat table; every non-empty cell links to the stage page filtered by that method. */
const props=defineProps<{active?:string}>();
const emit=defineEmits<{hover:[id:string]}>();
const col=ref('');
const max=computed(()=>Math.max(1,...atlas.value.stages.flatMap(st=>methodKeys.value.map(k=>matrix.value[st.id]?.[k]||0))));
const level=(n:number)=>n?Math.min(5,Math.ceil(n/max.value*5)):0;
const n=(stage:string,k:string)=>matrix.value[stage]?.[k]||0;
function enter(stage:string,k=''){col.value=k;emit('hover',stage);}
function leave(){col.value='';emit('hover','');}
</script>

<template>
  <div class="matrix-wrap" role="region" aria-label="方法与环节分布矩阵，窄屏可横向滚动" tabindex="0" @mouseleave="leave">
    <table class="matrix">
      <caption class="sr-only">方法与环节分布矩阵</caption>
      <thead><tr><th scope="col">环节</th><th v-for="k in methodKeys" :key="k" scope="col" :class="{x:col===k}">{{ atlas.methods[k].abbr }}</th><th scope="col">合计</th></tr></thead>
      <tbody>
        <tr v-for="st in atlas.stages" :key="st.id" :class="{x:props.active===st.id}">
          <th scope="row"><i class="mono">{{ pad(st.idx) }}</i>{{ st.name }}</th>
          <td v-for="k in methodKeys" :key="k" :class="{x:col===k}" :data-l="level(n(st.id,k))">
            <router-link :to="`/stage/${st.id}?m=${k}`" :aria-label="`${st.name} · ${atlas.methods[k].name}：${n(st.id,k)} 个场景`" @mouseenter="enter(st.id,k)" @focus="enter(st.id,k)" @blur="leave">{{ n(st.id,k)||'·' }}</router-link>
          </td>
          <td class="sum"><router-link :to="`/stage/${st.id}`" @mouseenter="enter(st.id)" @focus="enter(st.id)" @blur="leave">{{ st.scenes.length }}</router-link></td>
        </tr>
      </tbody>
      <tfoot><tr><th scope="row">合计</th><td v-for="k in methodKeys" :key="k" :class="{x:col===k}">{{ (atlas.index.byMethod[k]||[]).length }}</td><td>{{ atlas.allScenes.length }}</td></tr></tfoot>
    </table>
  </div>
  <div class="heat-legend"><span>场景数</span><span class="steps" aria-hidden="true"><i v-for="l in [1,2,3,4,5]" :key="l" :data-l="l"></i></span><span>少 → 多</span><span class="sep">·</span><span>一个场景可对应多种方法，列合计会多于场景总数</span></div>
</template>
