<script setup lang="ts">
import {computed} from 'vue';
import {mark} from '../core/search';
const props=defineProps<{text:string;terms:string[]}>();
const parts=computed(()=>mark(props.text,props.terms));
</script>

<template><template v-for="(p,i) in parts" :key="i"><mark v-if="p.hit">{{ p.t }}</mark><template v-else>{{ p.t }}</template></template></template>
