<script setup lang="ts">
import CountUp from './CountUp.vue';
defineProps<{idx:string;title:string;en?:string;blurb?:string;stats?:[number,string][]}>();
</script>

<template>
  <header class="page-header">
    <div class="ph-main">
      <span class="ph-idx mono">{{ idx }}<template v-if="en"> · {{ en }}</template></span>
      <h1>{{ title }}</h1>
      <p v-if="blurb" class="ph-blurb">{{ blurb }}</p>
      <div v-if="$slots.actions" class="ph-actions"><slot name="actions"/></div>
    </div>
    <dl v-if="stats?.length" class="ph-stats">
      <div v-for="[n,label] in stats" :key="label"><dt>{{ label }}</dt><dd><CountUp :value="n"/></dd></div>
    </dl>
  </header>
</template>
