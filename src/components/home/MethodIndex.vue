<script setup lang="ts">
import {atlas,methodKeys,colorOf} from '../../core/store';
import CountUp from '../CountUp.vue';
</script>

<template>
  <ul class="method-index" aria-label="方法目录">
    <li v-for="k in methodKeys" :key="k">
      <router-link class="method-card" :data-m="colorOf(k)" :to="`/method/${k}`">
        <span class="mc-abbr mono">{{ atlas.methods[k].abbr }}</span>
        <span class="mc-name">{{ atlas.methods[k].name }}</span>
        <span class="mc-signal mono">{{ atlas.methods[k].signal }}</span>
        <span class="mc-desc">{{ atlas.methods[k].desc }}</span>
        <span class="mc-count"><b><CountUp :value="(atlas.index.byMethod[k]||[]).length"/></b>个场景<span class="go" aria-hidden="true">→</span></span>
      </router-link>
    </li>
  </ul>
</template>
