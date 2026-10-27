<script setup lang="ts">
import {onMounted,ref,watch} from 'vue';
const props=defineProps<{value:number;duration?:number}>();
const shown=ref(props.value);
function run(from:number){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||!globalThis.requestAnimationFrame){shown.value=props.value;return;}
  const to=props.value,d=props.duration??640,t0=performance.now();
  const step=(t:number)=>{const k=Math.min(1,(t-t0)/d),e=1-Math.pow(1-k,3);shown.value=Math.round(from+(to-from)*e);if(k<1)requestAnimationFrame(step);};
  requestAnimationFrame(step);
}
onMounted(()=>run(0));
watch(()=>props.value,(_,old)=>run(old??0));
</script>

<template><span class="mono">{{ shown }}</span></template>
