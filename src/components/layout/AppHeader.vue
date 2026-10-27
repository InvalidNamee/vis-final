<script setup lang="ts">
import {computed,ref} from 'vue';
import {useAtlas,pad} from '../../composables/useAtlas';
import {useSessionStore} from '../../stores/session';
const {atlas,route}=useAtlas(),session=useSessionStore();
const open=ref(false);
const first=computed(()=>route.value.path.split('/')[1]||'home');
const nav:[string,string,string[]][]=[['/','总览',['home','stage','method','scene']],['/chain','作业链',['chain']],['/cases','案例库',['cases']],['/guide','接入指南',['guide']]];
const currentStage=computed(()=>{const [,kind,id]=route.value.path.split('/');return kind==='stage'?id:kind==='scene'?atlas.value.index.byScene[id]?.stageId:'';});
</script>

<template>
  <header class="hdr"><div class="hdr-in">
    <router-link class="brand" to="/" aria-label="智能化可能性地图 总览">
      <span class="brand-mark" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M3 17l5-6 4 3 4-6 5 4"/><circle cx="8" cy="11" r="1.6" fill="currentColor" stroke="none"/></svg></span>
      <span class="brand-txt"><b>智能化可能性地图</b><span>Petro × AI Atlas</span></span>
    </router-link>
    <nav class="nav" aria-label="主导航">
      <n-button class="nav-stage" quaternary size="small" @click="open=true">作业环节 ▾</n-button>
      <router-link v-for="[to,label,keys] in nav" :key="to" :to="to" :class="{on:keys.includes(first)}" :aria-current="route.path===to?'page':undefined">{{ label }}</router-link>
      <router-link to="/admin" :class="{on:first==='admin'}">{{ session.authenticated?'管理后台':'管理' }}</router-link>
      <n-button class="nav-add" type="primary" size="small" data-import>＋ 添加案例</n-button>
    </nav>
  </div></header>
  <n-drawer v-model:show="open" placement="left" :width="300">
    <n-drawer-content title="作业环节" closable :native-scrollbar="false">
      <nav class="stage-drawer" aria-label="作业环节导航">
        <router-link v-for="st in atlas.stages" :key="st.id" :to="`/stage/${st.id}`" :class="{on:currentStage===st.id}" @click="open=false">
          <span class="i">{{ pad(st.idx) }}</span><span class="nm">{{ st.name }}</span><span class="n">{{ st.scenes.length }}</span>
        </router-link>
      </nav>
    </n-drawer-content>
  </n-drawer>
</template>
