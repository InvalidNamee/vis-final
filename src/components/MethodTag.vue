<script setup lang="ts">
import {computed} from 'vue';
import {atlas,colorOf} from '../core/store';
const props=defineProps<{k:string;link?:boolean;full?:boolean}>();
const method=computed(()=>atlas.value.methods[props.k]);
</script>

<template>
  <router-link v-if="method&&link" class="mtag" :data-m="colorOf(k)" :to="`/method/${k}`"><b>{{ method.abbr }}</b>{{ method.name }}</router-link>
  <span v-else-if="method" class="mtag" :data-m="colorOf(k)" :title="method.name"><b>{{ method.abbr }}</b><template v-if="full">{{ method.name }}</template></span>
</template>
