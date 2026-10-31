<script setup lang="ts">
import {computed,onErrorCaptured,ref,watch} from 'vue';
import {useRoute} from 'vue-router';
import {atlas} from './core/store';
import TopBar from './shell/TopBar.vue';
import ChainToc from './shell/ChainToc.vue';
import Breadcrumb from './shell/Breadcrumb.vue';
import SiteFooter from './shell/SiteFooter.vue';
import SearchPalette from './shell/SearchPalette.vue';
import ImportDialog from './ui/ImportDialog.vue';
import ToastHost from './ui/ToastHost.vue';
import ConfirmHost from './ui/ConfirmHost.vue';

const route=useRoute(),error=ref('');
const section=computed(()=>route.path.split('/')[1]||'home');
// Chain, stage and scene pages carry the operations-chain directory.
const withToc=computed(()=>['chain','stage','scene'].includes(section.value));
const TITLES:Record<string,string>={home:'地图总览',chain:'作业链',cases:'案例库',guide:'接入指南',admin:'内容管理'};

watch(()=>route.path,()=>{error.value='';});
watch(()=>[atlas.value,route.path] as const,()=>{
  const id=route.path.split('/')[2],A=atlas.value,s=section.value;
  const title=s==='scene'?A.index.byScene[id]?.name:s==='stage'?A.index.byStage[id]?.name:s==='method'?A.methods[id]?.name:TITLES[s];
  document.title=`${title||'页面不存在'} · 智能化可能性地图`;
},{immediate:true});
onErrorCaptured(e=>{console.error(e);error.value=(e as Error).message;return false;});
const focusMain=()=>document.getElementById('main-content')?.focus();
</script>

<template>
  <a class="skip" href="#main-content" @click.prevent="focusMain">跳到主要内容</a>
  <TopBar/>
  <div class="shell" :class="{'has-toc':withToc}">
    <ChainToc v-if="withToc"/>
    <main id="main-content" class="main" tabindex="-1">
      <Breadcrumb/>
      <div v-if="error" class="wrap empty-state" role="alert"><h1>页面加载异常</h1><p>{{ error }}</p><router-link class="btn" to="/">返回地图总览</router-link></div>
      <router-view v-else v-slot="{Component,route:r}">
        <Transition name="page" mode="out-in"><component :is="Component" :key="r.path"/></Transition>
      </router-view>
    </main>
  </div>
  <SiteFooter/>
  <ImportDialog/>
  <SearchPalette/>
  <ConfirmHost/>
  <ToastHost/>
</template>
