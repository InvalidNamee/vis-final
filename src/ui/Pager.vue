<script setup lang="ts">
import {computed} from 'vue';

const props=withDefaults(defineProps<{page:number;total:number;size:number;sizes?:number[];label?:string}>(),{label:'分页'});
const emit=defineEmits<{'update:page':[n:number];'update:size':[n:number]}>();
const pages=computed(()=>Math.max(1,Math.ceil(props.total/props.size)));
// Current page ±2 plus both ends, with gaps marked by 0.
const slots=computed(()=>{
  const n=pages.value,p=props.page,set=new Set([1,n,p-2,p-1,p,p+1,p+2].filter(i=>i>=1&&i<=n));
  const out:number[]=[];
  [...set].sort((a,b)=>a-b).forEach((i,k,all)=>{if(k&&i-all[k-1]>1)out.push(0);out.push(i);});
  return out;
});
const go=(n:number)=>emit('update:page',Math.min(pages.value,Math.max(1,n)));
</script>

<template>
  <nav class="ui-pager" :aria-label="label">
    <button type="button" class="ui-pager-btn" :disabled="page<=1" aria-label="上一页" @click="go(page-1)">‹</button>
    <template v-for="(n,i) in slots" :key="i">
      <span v-if="!n" class="ui-pager-gap" aria-hidden="true">…</span>
      <button v-else type="button" class="ui-pager-btn" :aria-current="n===page?'page':undefined" @click="go(n)">{{ n }}</button>
    </template>
    <button type="button" class="ui-pager-btn" :disabled="page>=pages" aria-label="下一页" @click="go(page+1)">›</button>
    <label v-if="sizes" class="ui-pager-size"><span class="sr-only">每页数量</span>
      <select class="ui-select sm" :value="size" @change="emit('update:size',Number(($event.target as HTMLSelectElement).value))">
        <option v-for="s in sizes" :key="s" :value="s">{{ s }} / 页</option>
      </select>
    </label>
  </nav>
</template>
