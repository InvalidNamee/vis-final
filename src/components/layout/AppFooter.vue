<script setup lang="ts">
import {useAtlas} from '../../composables/useAtlas';
const {atlas,caseStats,methodKeys}=useAtlas();
</script>

<template>
  <footer class="ftr"><div class="wrap">
    <div class="ftr-in">
      <div class="ftr-col" style="max-width:30ch"><h5>关于</h5><p>{{ atlas.meta.title }}</p><p style="margin-top:8px;color:var(--ink-4)">{{ atlas.meta.version }} · 更新于 {{ atlas.meta.updated }}</p></div>
      <div class="ftr-col"><h5>地图</h5><router-link to="/">总览</router-link><router-link to="/chain">作业链</router-link><router-link :to="`/method/${methodKeys[0]}`">方法反查</router-link></div>
      <div class="ftr-col"><h5>系统</h5><router-link to="/cases">案例库（{{ caseStats.registered }} 个已接入）</router-link><router-link to="/guide">案例接入</router-link></div>
      <div class="ftr-col"><h5>贡献与纠错</h5><p>场景补充或内容勘误</p><a :href="`mailto:${atlas.meta.email}`">{{ atlas.meta.email }}</a></div>
    </div>
    <div class="ftr-bot"><span>已收录 {{ atlas.allScenes.length }} 个场景 · 覆盖 {{ atlas.stages.length }} 个环节</span><span>纯前端 · 无后端 · 教学合成数据</span></div>
  </div></footer>
</template>
