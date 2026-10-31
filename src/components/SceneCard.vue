<script setup lang="ts">
import {computed} from 'vue';
import {casesOf} from '../core/store';
import MethodTag from './MethodTag.vue';
import type {Scene} from '../types';

const props=defineProps<{scene:Scene;showStage?:boolean}>();
const count=computed(()=>casesOf(props.scene.id).length);
</script>

<template>
  <router-link class="scene-card" :class="{'is-ext':scene.status==='ext'}" :to="`/scene/${scene.id}`">
    <span class="sc-top">
      <span class="sc-id mono">{{ scene.id.toUpperCase() }}<template v-if="showStage"> · {{ scene.stageName }}</template></span>
      <span class="dtag" :data-d="scene.diff">难度 {{ scene.diff }}</span>
    </span>
    <span class="sc-name">{{ scene.name }}</span>
    <span class="sc-point">{{ scene.point||scene.intro }}</span>
    <span class="sc-foot">
      <span class="sc-methods"><MethodTag v-for="k in scene.methods" :key="k" :k="k" full/></span>
      <span class="sc-state" :class="{ready:count}"><i aria-hidden="true"></i>{{ count?`已接入 ${count} 个案例`:'尚无案例' }}</span>
    </span>
  </router-link>
</template>
