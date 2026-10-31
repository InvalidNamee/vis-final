<script setup lang="ts">
import {atlas,caseStats,methodKeys} from '../core/store';
</script>

<template>
  <footer class="footer">
    <div class="wrap footer-in">
      <div class="footer-about"><b>{{ atlas.meta.title }}</b><p>{{ atlas.meta.version }} · 更新于 {{ atlas.meta.updated }}</p></div>
      <nav class="footer-col" aria-label="地图"><h2>地图</h2><router-link to="/">总览</router-link><router-link to="/chain">作业链</router-link><router-link :to="`/method/${methodKeys[0]}`">方法反查</router-link></nav>
      <nav class="footer-col" aria-label="系统"><h2>系统</h2><router-link to="/cases">案例库（{{ caseStats.registered }} 个已接入）</router-link><router-link to="/guide">案例接入</router-link></nav>
      <div class="footer-col"><h2>贡献与纠错</h2><p>场景补充或内容勘误</p><a :href="`mailto:${atlas.meta.email}`">{{ atlas.meta.email }}</a></div>
    </div>
    <div class="wrap footer-bot mono"><span>已收录 {{ atlas.allScenes.length }} 个场景 · 覆盖 {{ atlas.stages.length }} 个环节</span><span>纯前端 · 无后端 · 教学合成数据</span></div>
  </footer>
</template>
