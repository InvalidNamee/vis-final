<script setup lang="ts">
import {computed} from 'vue';
import {useAtlas} from '../../composables/useAtlas';
import {openPalette} from '../../composables/useSearch';
import {useSessionStore} from '../../stores/session';
const {route}=useAtlas(),session=useSessionStore();
const first=computed(()=>route.value.path.split('/')[1]||'home');
const mac=typeof navigator!=='undefined'&&/Mac|iPhone|iPad/.test(navigator.platform);
// Stage, scene and method pages all belong to the operations chain.
const nav:[string,string,string[]][]=[['/','总览',['home']],['/chain','作业链',['chain','stage','scene','method']],['/cases','案例库',['cases']],['/guide','接入指南',['guide']]];
</script>

<template>
  <header class="hdr"><div class="hdr-in">
    <router-link class="brand" to="/" aria-label="智能化可能性地图 总览">
      <span class="brand-mark" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M3 17l5-6 4 3 4-6 5 4"/><circle cx="8" cy="11" r="1.6" fill="currentColor" stroke="none"/></svg></span>
      <span class="brand-txt"><b>智能化可能性地图</b><span>Petro × AI Atlas</span></span>
    </router-link>
    <button class="hdr-search" type="button" aria-label="全站搜索" aria-haspopup="dialog" @click="openPalette()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
      <span class="t">搜索环节、场景、案例</span><kbd>{{ mac?'⌘':'Ctrl' }} K</kbd>
    </button>
    <nav class="nav" aria-label="主导航">
      <router-link v-for="[to,label,keys] in nav" :key="to" :to="to" :class="{on:keys.includes(first)}" :aria-current="route.path===to?'page':undefined">{{ label }}</router-link>
      <router-link to="/admin" :class="{on:first==='admin'}">{{ session.authenticated?'管理后台':'管理' }}</router-link>
      <n-button class="nav-add" type="primary" size="small" data-import>＋ 添加案例</n-button>
    </nav>
  </div></header>
</template>
