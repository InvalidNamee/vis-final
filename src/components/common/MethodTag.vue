<script setup lang="ts">
import {computed} from 'vue';
import {useAtlas} from '../../composables/useAtlas';
const props=defineProps<{k:string;sm?:boolean;link?:boolean}>();
const {atlas,colorOf}=useAtlas();
const m=computed(()=>atlas.value.methods[props.k]);
</script>

<template>
  <router-link v-if="m && link" class="mtag" :class="{sm}" :data-m="colorOf(k)" :to="`/method/${k}`"><b>{{ m.abbr }}</b>{{ m.name }}</router-link>
  <span v-else-if="m" class="mtag" :class="{sm}" :data-m="colorOf(k)"><b>{{ m.abbr }}</b>{{ m.name }}</span>
</template>
