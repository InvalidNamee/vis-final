<script setup lang="ts">
defineProps<{num:string;kicker:string;title:string;sub?:string;clay?:boolean}>();
</script>

<template>
  <div class="sec-head">
    <div class="sec-rail"><span class="sec-num">{{ num }}</span><span class="kicker" :class="{clay}">{{ kicker }}</span><span v-if="$slots.default" class="r"><slot/></span></div>
    <h2>{{ title }}</h2>
    <p v-if="sub">{{ sub }}</p>
  </div>
</template>
