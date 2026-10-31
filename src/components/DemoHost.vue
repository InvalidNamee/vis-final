<script setup lang="ts">
import {onBeforeUnmount,onMounted,ref,watch} from 'vue';
import demoTheme from '../styles/demo.css?raw';
import type {CaseDef,Demo,Scene} from '../types';

/* Mounts tabs.demo.mount(root, ctx) and always calls unmount when leaving; the shell never touches the demo DOM. */
const props=defineProps<{scene:Scene;kase:CaseDef}>();
const root=ref<HTMLElement|null>(null),error=ref('');
let mounted:Demo|null=null;

function cleanup(){
  const previous=mounted;mounted=null;
  try{previous?.unmount?.();}catch(e){console.error(e);}
}
function mount(){
  cleanup();error.value='';
  if(!root.value)return;
  root.value.innerHTML='';
  const demo=props.kase?.tabs?.demo;
  if(!demo?.mount){error.value='该案例没有可运行的演示入口。';return;}
  mounted=demo;
  try{demo.mount(root.value,{scene:props.scene,kase:props.kase,K:window.K,atlas:window.ATLAS,demoTheme});}
  catch(e){cleanup();root.value.innerHTML='';error.value=`演示加载失败：${(e as Error).message}`;}
}
onMounted(mount);
watch(()=>[props.kase,props.scene],mount,{flush:'post'});
onBeforeUnmount(cleanup);
</script>

<template>
  <div class="demo-host">
    <p v-if="error" class="demo-error" role="alert">{{ error }}</p>
    <div id="case-demo-root" ref="root"></div>
  </div>
</template>
