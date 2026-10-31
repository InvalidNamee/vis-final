<script setup lang="ts">
import {atlas,matrix,methodKeys,colorOf} from '../../core/store';
import {pad} from '../../core/format';
import StackBar from '../StackBar.vue';

/* Thirteen stages in chain order; hovering a tile highlights its matrix row. */
defineProps<{active?:string}>();
const emit=defineEmits<{hover:[id:string]}>();
const parts=(id:string)=>methodKeys.value.filter(k=>matrix.value[id]?.[k]).map(k=>({value:matrix.value[id][k],color:`var(--c-${colorOf(k)})`,label:atlas.value.methods[k].abbr}));
</script>

<template>
  <div class="stage-grid-wrap">
    <div class="stage-flow mono" aria-hidden="true"><span>上游 · 勘探</span><i></i><span>下游 · 储运炼化</span></div>
    <ol class="stage-grid" aria-label="作业环节">
      <li v-for="(st,i) in atlas.stages" :key="st.id" :style="{'--i':i}">
        <router-link class="stage-tile" :class="{on:active===st.id}" :to="`/stage/${st.id}`" @mouseenter="emit('hover',st.id)" @mouseleave="emit('hover','')" @focus="emit('hover',st.id)" @blur="emit('hover','')">
          <span class="st-idx mono">{{ pad(st.idx) }}</span>
          <span class="st-name">{{ st.name }}</span>
          <span class="st-en">{{ st.en }}</span>
          <span class="st-n"><b>{{ st.scenes.length }}</b>场景</span>
          <StackBar v-if="parts(st.id).length" class="st-bar" :parts="parts(st.id)"/>
          <span v-else class="st-bar st-bar-empty"></span>
        </router-link>
      </li>
    </ol>
  </div>
</template>
