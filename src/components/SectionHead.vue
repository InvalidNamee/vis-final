<script setup lang="ts">
defineProps<{num:string;kicker:string;title:string;sub?:string;id?:string}>();
</script>

<template>
  <header class="section-head">
    <div class="sh-text">
      <span class="sh-kicker mono"><b>{{ num }}</b>{{ kicker }}</span>
      <h2 :id="id">{{ title }}</h2>
      <p v-if="sub">{{ sub }}</p>
    </div>
    <div v-if="$slots.default" class="sh-actions"><slot/></div>
  </header>
</template>
