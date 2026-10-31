<script setup lang="ts">
import {computed} from 'vue';
/* Proportional segments; widths grow in from zero (disabled under reduced motion). */
const props=defineProps<{parts:{value:number;color:string;label:string}[];label?:string}>();
const total=computed(()=>props.parts.reduce((a,p)=>a+p.value,0)||1);
</script>

<template>
  <div class="stack" role="img" :aria-label="label||parts.map(p=>`${p.label} ${p.value}`).join('，')">
    <i v-for="(p,i) in parts" :key="i" :style="{'--w':`${p.value/total*100}%`,background:p.color,'--i':i}" :title="`${p.label} · ${p.value}`"></i>
  </div>
</template>
