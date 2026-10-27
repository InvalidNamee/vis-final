<script setup lang="ts">
// Proportional segments; widths grow from zero on mount (see .grow in motion.css).
defineProps<{parts:{value:number;color:string;label?:string}[];total?:number}>();
</script>

<template>
  <span class="grow-bar" role="img" :aria-label="parts.map(p=>`${p.label||''} ${p.value}`).join('，')">
    <i v-for="(p,i) in parts" :key="i" :style="{flex:`${p.value} 1 0`,background:p.color,'--gi':i}" :title="p.label?`${p.label} ${p.value}`:undefined"></i>
  </span>
</template>
