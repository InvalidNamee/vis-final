<script setup lang="ts">
import {atlas,caseStats} from '../../core/store';
</script>

<template>
  <ol class="layers">
    <li class="layer" data-layer="1">
      <span class="ly-path mono">01 · DATA · src/content/atlas.js</span>
      <h3>场景元数据</h3>
      <p>{{ atlas.stages.length }} 个环节、{{ atlas.allScenes.length }} 个场景的名称、方法标签、难度与数据条件。这一层<b>不含案例实现</b>，管理后台的增改以浏览器本地覆盖层叠加。</p>
    </li>
    <li class="layer" data-layer="2">
      <span class="ly-path mono">02 · CASES · plugins/&lt;环节&gt;/&lt;场景&gt;/&lt;案例&gt;</span>
      <h3>案例包</h3>
      <p>每个案例一个文件夹：<b>case.json</b> 声明三块内容，demo/ 放独立可运行的演示页。当前 {{ caseStats.registered }} 个案例自动发现、按环节分块加载，也可通过“添加案例”导入。</p>
    </li>
    <li class="layer" data-layer="3">
      <span class="ly-path mono">03 · SHELL · src/</span>
      <h3>外壳与组件</h3>
      <p>路由、导航、检索、标签与版式组件，以及设计令牌。案例正文与演示由外壳托管，<b>案例包不需要改写</b>即可适配外壳更新。</p>
    </li>
  </ol>
</template>
