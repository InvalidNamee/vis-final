<script setup lang="ts">
import CountUp from '../common/CountUp.vue';
defineProps<{idx?:string;title:string;en?:string;blurb?:string;stats?:[number,string][]}>();
</script>

<template>
  <header class="page-head rise">
    <div class="ph-top">
      <div>
        <div v-if="idx" class="ph-idx">{{ idx }}</div>
        <h1>{{ title }}<span v-if="en" class="en">{{ en }}</span></h1>
        <p v-if="blurb" class="blurb">{{ blurb }}</p>
        <div v-if="$slots.actions" class="ph-actions"><slot name="actions"/></div>
      </div>
      <div v-if="stats?.length" class="ph-stat">
        <div v-for="[n,l] in stats" :key="l"><div class="n"><CountUp :value="n"/></div><div class="l">{{ l }}</div></div>
      </div>
    </div>
  </header>
</template>
