<script setup lang="ts">
import {computed} from 'vue';
import {useRoute} from 'vue-router';
import {atlas} from '../core/store';

const route=useRoute();
const LABELS:Record<string,string>={chain:'作业链',cases:'案例库',guide:'接入指南',admin:'内容管理'};
const items=computed<[string,string][]>(()=>{
  const [,page,id]=route.path.split('/'),A=atlas.value,home:[string,string]=['/','总览'],chain:[string,string]=['/chain','作业链'];
  if(page==='scene'){
    const scene=A.index.byScene[id],stage=scene&&A.index.byStage[scene.stageId];
    return stage?[home,chain,[`/stage/${stage.id}`,stage.name],['',scene.name]]:[];
  }
  if(page==='stage'){const stage=A.index.byStage[id];return stage?[home,chain,['',stage.name]]:[];}
  if(page==='method'){const m=A.methods[id];return m?[home,['','方法反查'],['',m.name]]:[];}
  return LABELS[page]?[home,['',LABELS[page]]]:[];
});
</script>

<template>
  <nav v-if="items.length" class="crumb" aria-label="当前位置">
    <ol>
      <li v-for="([to,label],i) in items" :key="i">
        <span v-if="i===items.length-1" aria-current="page">{{ label }}</span>
        <router-link v-else-if="to" :to="to">{{ label }}</router-link>
        <span v-else>{{ label }}</span>
      </li>
    </ol>
  </nav>
</template>
