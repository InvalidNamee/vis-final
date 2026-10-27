<script setup lang="ts">
import {useAtlas,pad} from '../../composables/useAtlas';
import StackBar from '../common/StackBar.vue';
defineProps<{active?:string}>();
const emit=defineEmits<{hover:[id:string]}>();
const {atlas,matrix,methodKeys,colorOf}=useAtlas();
const parts=(id:string)=>methodKeys.value.filter(k=>matrix.value[id]?.[k]).map(k=>({value:matrix.value[id][k],color:`var(--c-${colorOf(k)})`,label:atlas.value.methods[k].abbr}));
</script>

<template>
  <div class="chain-wrap">
    <div class="chain-scroll" role="region" aria-label="作业环节链条，窄屏可横向滚动" tabindex="0">
      <ol class="chain">
        <li v-for="(st,i) in atlas.stages" :key="st.id" :style="{'--si':i}">
          <router-link class="step" :class="{on:active===st.id}" :to="`/stage/${st.id}`" @mouseenter="emit('hover',st.id)" @mouseleave="emit('hover','')" @focus="emit('hover',st.id)" @blur="emit('hover','')">
            <div class="step-idx">{{ pad(st.idx) }}</div>
            <div class="step-name">{{ st.name }}</div>
            <div class="step-n">{{ st.scenes.length }}<span>场景</span></div>
            <StackBar v-if="parts(st.id).length" class="step-bar" :parts="parts(st.id)"/>
            <div v-else class="step-bar"><i class="empty"></i></div>
          </router-link>
        </li>
      </ol>
    </div>
    <div class="chain-hint">← 横向滚动查看全部 {{ atlas.stages.length }} 个环节 →</div>
  </div>
</template>
