<script setup lang="ts">
import {provide,computed,watch,ref,onErrorCaptured} from 'vue';
import {zhCN,dateZhCN} from 'naive-ui';
import ImportDialog from './components/ImportDialog.vue';
import AppHeader from './components/layout/AppHeader.vue';
import AppFooter from './components/layout/AppFooter.vue';
import Crumb from './components/layout/Crumb.vue';
import {createContentState,contentKey} from './state';
import {themeOverrides} from './theme';
const state=createContentState();provide(contentKey,state);
const route=computed(()=>state.route.value),error=ref('');
const page=computed(()=>route.value.path.split('/')[1]||'home');
function focusMain(){document.getElementById('main-content')?.focus();}
watch(()=>route.value.path,()=>{error.value='';});
watch(()=>[state.atlas.value,route.value.path],()=>{
  const id=route.value.path.split('/')[2],A:any=state.atlas.value;
  const title=page.value==='scene'?A.index.byScene[id]?.name:page.value==='stage'?A.index.byStage[id]?.name:page.value==='method'?A.methods[id]?.name:({home:'地图总览',chain:'作业链',cases:'案例库',guide:'接入指南',admin:'内容管理'} as Record<string,string>)[page.value];
  document.title=`${title||'页面不存在'} · 智能化可能性地图`;
},{immediate:true});
onErrorCaptured((e:any)=>{console.error(e);error.value=e.message;return false;});
</script>

<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN" :theme-overrides="themeOverrides"><n-message-provider><n-dialog-provider>
    <a class="skip" href="#main-content" @click.prevent="focusMain">跳到主要内容</a>
    <AppHeader/>
    <main id="main-content" class="shell-main" tabindex="-1">
      <Crumb/>
      <div v-if="error" class="wrap empty-state" role="alert"><h1>页面加载异常</h1><p>{{ error }}</p><router-link class="btn" to="/">返回地图总览</router-link></div>
      <router-view v-else v-slot="{Component,route:r}">
        <Transition name="page" mode="out-in"><component :is="Component" :key="r.path"/></Transition>
      </router-view>
    </main>
    <AppFooter/>
    <ImportDialog/>
  </n-dialog-provider></n-message-provider></n-config-provider>
</template>
