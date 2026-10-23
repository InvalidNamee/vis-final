<script setup>
import { inject } from 'vue';
import { contentKey } from '../state';
const state=inject(contentKey);
</script>

<template><section class="atlas-section"><header class="atlas-page-heading"><span class="atlas-eyebrow">OPERATIONS MAP</span><h1>石油作业链与方法分布</h1><p>沿作业环节比较智能化方向与案例覆盖，选择环节进入业务场景。</p></header><ol class="atlas-operations"><li v-for="stage in state.atlas.value.stages" :key="stage.id"><span class="atlas-operation-index">{{ String(stage.idx).padStart(2,'0') }}</span><div><router-link :to="`/stage/${stage.id}`"><h2>{{ stage.name }} <span>↗</span></h2></router-link><p>{{ stage.blurb }}</p><div class="atlas-actions"><router-link v-for="(method,key) in state.atlas.value.methods" :key="key" :to="`/stage/${stage.id}?m=${key}`" class="atlas-method">{{ method.abbr }} · {{ stage.scenes.filter(s=>s.methods.includes(key)).length }}</router-link></div></div><span class="atlas-pill">{{ stage.scenes.length }} 个场景</span></li></ol></section></template>
