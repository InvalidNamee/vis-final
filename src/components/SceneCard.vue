<script setup>
import { computed, inject } from 'vue';
import { contentKey } from '../state';
const props = defineProps({ scene: Object });
const state = inject(contentKey);
const count = computed(() => { state.atlas.value; state.cases.value; return state.host.Cases.bySceneAll(props.scene.id).length; });
</script>

<template>
  <router-link class="atlas-scene-card" :to="`/scene/${scene.id}`">
    <div class="atlas-card-top"><span class="atlas-code">{{ scene.id.toUpperCase() }} · {{ scene.stageName }}</span><span class="atlas-pill" :class="count ? 'ready' : ''">{{ count ? `${count} 个案例` : '待接入案例' }}</span></div>
    <h3>{{ scene.name }}<span aria-hidden="true">↗</span></h3>
    <p>{{ scene.point || scene.intro }}</p>
    <div class="atlas-card-bottom"><span v-for="method in scene.methods" :key="method" class="atlas-method">{{ state.atlas.value.methods[method]?.name || method }}</span><span class="atlas-difficulty">难度 {{ scene.diff }}</span></div>
  </router-link>
</template>
