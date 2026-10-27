<script setup lang="ts">
import {useAtlas} from '../../composables/useAtlas';
import CountUp from '../common/CountUp.vue';
const {atlas,methodKeys,colorOf}=useAtlas();
</script>

<template>
  <div class="methods">
    <router-link v-for="k in methodKeys" :key="k" class="mcard" :data-m="colorOf(k)" :to="`/method/${k}`">
      <div class="abbr"><b>{{ atlas.methods[k].abbr }}</b><span>{{ atlas.methods[k].signal }}</span></div>
      <div class="nm">{{ atlas.methods[k].name }}</div>
      <div class="ds">{{ atlas.methods[k].desc }}</div>
      <div class="cnt"><b><CountUp :value="(atlas.index.byMethod[k]||[]).length"/></b>个场景<span class="go" aria-hidden="true">→</span></div>
    </router-link>
  </div>
</template>
