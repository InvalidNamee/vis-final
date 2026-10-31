<script setup lang="ts">
import {computed,ref,watch} from 'vue';
import {useRoute} from 'vue-router';
import {openPalette} from '../core/search';
import {signedIn} from '../core/session';

const route=useRoute(),menu=ref(false);
// Same file as the favicon (public/favicon.svg), resolved against the deploy base path.
const logo=`${import.meta.env.BASE_URL}favicon.svg`;
const section=computed(()=>route.path.split('/')[1]||'home');
const mac=typeof navigator!=='undefined'&&/Mac|iPhone|iPad/.test(navigator.platform);
// Stage, scene and method pages all belong to the operations chain.
const NAV:{to:string;label:string;keys:string[]}[]=[
  {to:'/',label:'总览',keys:['home']},
  {to:'/chain',label:'作业链',keys:['chain','stage','scene','method']},
  {to:'/cases',label:'案例库',keys:['cases']},
  {to:'/guide',label:'接入指南',keys:['guide']},
];
const items=computed(()=>[...NAV,{to:'/admin',label:signedIn.value?'管理后台':'管理',keys:['admin']}]);
const current=(keys:string[],to:string)=>route.path===to?'page':keys.includes(section.value)?'true':undefined;
watch(()=>route.fullPath,()=>{menu.value=false;});
</script>

<template>
  <header class="topbar">
    <div class="topbar-in">
      <router-link class="brand" to="/" aria-label="智能化可能性地图 总览">
        <img class="brand-mark" :src="logo" width="34" height="34" alt="">

        <span class="brand-txt"><b>智能化可能性地图</b><small>PETRO × AI ATLAS</small></span>
      </router-link>
      <nav class="nav" :class="{open:menu}" aria-label="主导航">
        <router-link v-for="n in items" :key="n.to" :to="n.to" :aria-current="current(n.keys,n.to)">{{ n.label }}</router-link>
      </nav>
      <div class="topbar-tools">
        <button class="tb-search" type="button" aria-label="全站搜索" aria-haspopup="dialog" @click="openPalette()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <span class="t">搜索环节、场景、案例</span><kbd>{{ mac?'⌘':'Ctrl' }} K</kbd>
        </button>
        <button type="button" class="btn primary sm tb-add" data-import>＋ 添加案例</button>
        <button type="button" class="tb-menu" :aria-expanded="menu" aria-label="主导航菜单" @click="menu=!menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path v-if="!menu" d="M4 7h16M4 12h16M4 17h16"/><path v-else d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </div>
    </div>
  </header>
</template>
