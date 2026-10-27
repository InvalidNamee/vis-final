<script setup lang="ts">
defineProps<{items:[string,string][]}>();
</script>

<template>
  <nav class="crumb" aria-label="当前位置">
    <template v-for="([to,label],i) in items" :key="i">
      <span v-if="i" class="sep" aria-hidden="true">/</span>
      <span v-if="i===items.length-1" class="cur" aria-current="page">{{ label }}</span>
      <router-link v-else-if="to" :to="to">{{ label }}</router-link>
      <span v-else>{{ label }}</span>
    </template>
  </nav>
</template>
