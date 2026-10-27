<script setup lang="ts">
import {computed} from 'vue';
import {useAtlas} from '../../composables/useAtlas';
import MethodTag from './MethodTag.vue';
const props=defineProps<{scene:any;showStage?:boolean}>();
const {casesOf}=useAtlas();
const count=computed(()=>casesOf(props.scene.id).length);
</script>

<template>
  <router-link class="scene-row atlas-scene-card" :class="{'is-ext':scene.status==='ext'}" :to="`/scene/${scene.id}`">
    <div class="sr-n">{{ scene.id.toUpperCase() }}</div>
    <div class="sr-body">
      <div class="sr-name">{{ scene.name }}<span v-if="count" class="badge-ready">已接入案例{{ count>1?` ×${count}`:'' }}</span><span class="arrow" aria-hidden="true">→</span></div>
      <div class="sr-point">{{ scene.point || scene.intro }}</div>
      <div class="sr-meta"><span v-if="showStage" class="tag">{{ scene.stageName }}</span><MethodTag v-for="k in scene.methods" :key="k" :k="k"/></div>
    </div>
    <div class="sr-right"><span class="dtag" :data-d="scene.diff">难度 {{ scene.diff }}</span></div>
  </router-link>
</template>
