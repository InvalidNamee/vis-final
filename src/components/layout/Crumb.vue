<script setup lang="ts">
import {computed} from 'vue';
import {useAtlas} from '../../composables/useAtlas';
const {atlas,route}=useAtlas();
const items=computed<[string,string][]>(()=>{
  const [,page,id]=route.value.path.split('/');
  const home:[string,string]=['/','总览'];
  if(page==='scene'){
    const scene=atlas.value.index.byScene[id],stage=scene&&atlas.value.index.byStage[scene.stageId];
    return stage?[home,['/chain','作业链'],[`/stage/${stage.id}`,stage.name],['',scene.name]]:[];
  }
  if(page==='stage'){
    const stage=atlas.value.index.byStage[id];
    return stage?[home,['/chain','作业链'],['',stage.name]]:[];
  }
  if(page==='method'){
    const method=atlas.value.methods[id];
    return method?[home,['','方法反查'],['',method.name]]:[];
  }
  const label=({chain:'作业链',cases:'案例库',guide:'接入指南',admin:'内容管理'} as Record<string,string>)[page];
  return label?[home,['',label]]:[];
});
</script>

<template>
  <nav v-show="items.length" class="crumb wrap" aria-label="当前位置">
    <template v-for="([to,label],i) in items" :key="i">
      <span v-if="i" class="sep" aria-hidden="true">/</span>
      <span v-if="i===items.length-1" class="cur" aria-current="page">{{ label }}</span>
      <router-link v-else-if="to" :to="to">{{ label }}</router-link>
      <span v-else>{{ label }}</span>
    </template>
  </nav>
</template>
