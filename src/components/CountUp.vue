<script setup lang="ts">
import {onBeforeUnmount,ref,watch} from 'vue';
import {reducedMotion} from '../core/motion';

/* Counts from the previous value to the new one; renders the final value directly under reduced motion. */
const props=withDefaults(defineProps<{value:number;duration?:number}>(),{duration:620});
const shown=ref(reducedMotion()?props.value:0);
let frame=0;
function run(to:number){
  cancelAnimationFrame(frame);
  if(reducedMotion()||typeof requestAnimationFrame!=='function'){shown.value=to;return;}
  const from=shown.value,start=performance.now();
  const step=(now:number)=>{
    const t=Math.min(1,(now-start)/props.duration),ease=1-Math.pow(1-t,3);
    shown.value=Math.round(from+(to-from)*ease);
    if(t<1)frame=requestAnimationFrame(step);
  };
  frame=requestAnimationFrame(step);
}
watch(()=>props.value,run,{immediate:true});
onBeforeUnmount(()=>cancelAnimationFrame(frame));
</script>

<template><span class="count">{{ shown }}</span></template>
