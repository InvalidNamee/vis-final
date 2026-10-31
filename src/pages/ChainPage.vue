<script setup lang="ts">
import {computed} from 'vue';
import {atlas,matrix,methodKeys,colorOf,casesOf} from '../core/store';
import {pad} from '../core/format';
import {vReveal} from '../core/motion';
import PageHeader from '../components/PageHeader.vue';
import StackBar from '../components/StackBar.vue';
import type {Stage} from '../types';

const ready=(st:Stage)=>st.scenes.filter(s=>casesOf(s.id).length).length;
const parts=(id:string)=>methodKeys.value.filter(k=>matrix.value[id]?.[k]).map(k=>({value:matrix.value[id][k],color:`var(--c-${colorOf(k)})`,label:atlas.value.methods[k].abbr}));
const stats=computed<[number,string][]>(()=>[[atlas.value.stages.length,'作业环节'],[atlas.value.allScenes.length,'业务场景'],[atlas.value.allScenes.filter(s=>casesOf(s.id).length).length,'已接入场景']]);
</script>

<template>
  <div class="page"><div class="wrap">
    <PageHeader idx="OPERATIONS CHAIN" en="Upstream → Downstream" title="石油作业链全景" :blurb="atlas.meta.upstreamNote" :stats="stats"/>
    <ol class="chain-cards">
      <li v-for="(st,i) in atlas.stages" :key="st.id" v-reveal="i%4" class="chain-card">
        <header class="cc-head">
          <span class="cc-idx mono">{{ pad(st.idx) }}</span>
          <div class="cc-title">
            <router-link class="cc-name" :to="`/stage/${st.id}`">{{ st.name }}<span class="mono">{{ st.en }}</span></router-link>
            <p>{{ st.blurb }}</p>
          </div>
          <span class="cc-count mono"><b>{{ ready(st) }}</b> / {{ st.scenes.length }}<small>已接入</small></span>
        </header>
        <StackBar v-if="parts(st.id).length" class="cc-bar" :parts="parts(st.id)"/>
        <div class="cc-methods">
          <router-link v-for="k in methodKeys.filter(k=>matrix[st.id]?.[k])" :key="k" class="mtag" :data-m="colorOf(k)" :to="`/stage/${st.id}?m=${k}`"><b>{{ atlas.methods[k].abbr }}</b>{{ matrix[st.id][k] }}</router-link>
        </div>
        <ul class="cc-scenes" :aria-label="`${st.name}场景`">
          <li v-for="s in st.scenes" :key="s.id">
            <router-link :to="`/scene/${s.id}`" :class="{ready:casesOf(s.id).length}">
              <i aria-hidden="true"></i><span class="mono">{{ s.id.toUpperCase() }}</span><span class="nm">{{ s.name }}</span>
              <span class="ms"><b v-for="k in s.methods" :key="k" :data-m="colorOf(k)">{{ atlas.methods[k]?.abbr }}</b></span>
            </router-link>
          </li>
        </ul>
      </li>
    </ol>
  </div></div>
</template>
