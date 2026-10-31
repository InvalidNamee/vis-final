<script setup lang="ts">
import {computed,ref,watch} from 'vue';
import Pager from './Pager.vue';

/* Paged table; a column renders its slot (named after the column key) or the raw value. */
const props=withDefaults(defineProps<{columns:{key:string;title:string;width?:string;mono?:boolean}[];rows:any[];rowKey:(row:any)=>string;label:string;pageSize?:number;empty?:string}>(),{pageSize:10,empty:'没有匹配的条目'});
const page=ref(1);
watch(()=>props.rows.length,n=>{page.value=Math.min(page.value,Math.max(1,Math.ceil(n/props.pageSize)));});
const visible=computed(()=>props.rows.slice((page.value-1)*props.pageSize,page.value*props.pageSize));
</script>

<template>
  <div class="ui-table-wrap" role="region" :aria-label="label" tabindex="0">
    <table class="ui-table">
      <thead><tr><th v-for="c in columns" :key="c.key" scope="col" :style="c.width?{width:c.width}:undefined">{{ c.title }}</th></tr></thead>
      <tbody>
        <tr v-for="row in visible" :key="rowKey(row)">
          <td v-for="c in columns" :key="c.key" :class="{mono:c.mono}"><slot :name="c.key" :row="row">{{ row[c.key] }}</slot></td>
        </tr>
        <tr v-if="!rows.length"><td :colspan="columns.length" class="ui-table-empty">{{ empty }}</td></tr>
      </tbody>
    </table>
  </div>
  <Pager v-if="rows.length>pageSize" v-model:page="page" :total="rows.length" :size="pageSize" label="表格分页"/>
</template>
