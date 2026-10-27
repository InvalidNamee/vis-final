<script setup lang="ts">
import PageHead from '../components/layout/PageHead.vue';
import Crumb from '../components/layout/Crumb.vue';
import { ref } from 'vue';
const example = `{
  "id": "my-drilling-case",
  "sceneId": "d2",
  "title": "钻井参数异常监测",
  "tabs": {
    "background": { "lede": "业务说明", "sections": [] },
    "workflow": { "steps": [] },
    "demo": { "mode": "page", "html": "demo/index.html" }
  }
}`;
const mode=ref('page');
</script>

<template>
  <div class="page atlas-guide"><div class="wrap">
    <Crumb :items="[['/','总览'],['','接入指南']]"/>
    <PageHead idx="CONTENT INTEGRATION" title="案例接入指南" en="Case package protocol" blurb="内容模块与页面框架独立。原案例清单、文件包结构和演示接口保持兼容，外壳更新不要求案例包改写。">
      <template #actions><n-button type="primary" data-import>＋ 添加案例</n-button><n-button data-dl-template>下载原案例模板</n-button></template>
    </PageHead>
    <div class="g-grid">
      <article class="g-card"><div class="fx">01 · FOLDER</div><h2>案例包目录</h2><pre>my-case/
  case.json
  demo/
    index.html
    demo.css
    demo.js</pre><p>ZIP 先解压，通过“添加案例”选择文件夹、拖入文件夹或多选文件。每个案例需有唯一 ID，并绑定现有 sceneId。</p></article>
      <article class="g-card"><div class="fx">02 · MANIFEST</div><h2>内容清单字段</h2><pre>{{ example }}</pre><p>此处为结构摘要；完整可用示例请下载原模板，或参考 plugins/seismic/s3/firstbreak-stalta 中的老师示例。</p></article>
    </div>
    <article class="g-card"><div class="fx">03 · DEMO</div><h2>演示挂载模式</h2>
      <n-radio-group v-model:value="mode" class="g-modes" size="small" aria-label="演示模式"><n-radio-button v-for="m in ['page','module','builtin']" :key="m" :value="m">{{ m }}</n-radio-button></n-radio-group>
      <template v-if="mode==='page'"><h3>独立 HTML 演示</h3><p>HTML、CSS 与 JS 由原宿主内联到 sandbox iframe。保留相对路径和文件名，不要求引入 Vue，不需要后端。</p></template>
      <template v-else-if="mode==='module'"><h3>模块挂载接口</h3><pre>module.exports = {
  mount(root, api) {
    // api: asset, readText, list, scene, kase, onDestroy, height
  },
  unmount() { /* 清理资源 */ }
};</pre><p>兼容 exports.mount 与 window.__CASE_MOUNT__。模块挂载在原 Shadow DOM 宿主内，离开演示时调用清理逻辑。</p></template>
      <template v-else><h3>内置演示复用</h3><p>清单使用 tabs.demo.builtin 指向已有案例 ID，复用该案例的演示挂载函数。传统插件继续调用 Cases.register()，mount 接收 root 与 scene、kase、K、atlas 上下文。</p></template>
    </article>
    <article class="g-card"><div class="fx">04 · STORAGE</div><h2>导入与版本更新</h2><p>导入包保存在当前浏览器本地。换设备需重新导入；同场景可有多个案例，场景页可切换。ID 已占用时沿用原重名校验，请设置唯一 ID 或先移除旧导入。内置案例可隐藏并恢复。</p><p>案例内容以源文件夹为准。日常同步不生成 ZIP；只有明确需要分发时才打包。教学合成数据、计算方法和工程边界应在正文说明。</p></article>
  </div></div>
</template>
