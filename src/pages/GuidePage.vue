<script setup lang="ts">
import {ref} from 'vue';
import PageHeader from '../components/PageHeader.vue';

const example=`{
  "id": "my-drilling-case",
  "sceneId": "d2",
  "title": "钻井参数异常监测",
  "tabs": {
    "background": { "lede": "业务说明", "sections": [] },
    "workflow": { "steps": [] },
    "demo": { "mode": "page", "html": "demo/index.html" }
  }
}`;
// Quoted strings followed by ":" are keys, the rest are values.
const tokens=example.split(/("(?:\\.|[^"\\])*")/g).map((text,i,parts)=>({text,kind:text.startsWith('"')?(/^\s*:/.test(parts[i+1]||'')?'tk-key':'tk-str'):''}));
const MODES=[{key:'page',label:'page · 独立页面'},{key:'module',label:'module · 模块挂载'},{key:'builtin',label:'builtin · 内置复用'}];
const mode=ref('page');
</script>

<template>
  <div class="page guide"><div class="wrap">
    <PageHeader idx="CONTENT INTEGRATION" en="Case package protocol" title="案例接入指南" blurb="内容模块与页面框架独立。原案例清单、文件包结构和演示接口保持兼容，外壳更新不要求案例包改写。">
      <template #actions><button type="button" class="btn primary" data-import>＋ 添加案例</button><button type="button" class="btn" data-dl-template>下载原案例模板</button></template>
    </PageHeader>
    <div class="guide-grid">
      <article class="guide-card"><span class="gc-no mono">01 · FOLDER</span><h2>案例包目录</h2>
        <pre class="code-block">my-case/
  case.json
  demo/
    index.html
    demo.css
    demo.js</pre>
        <p>ZIP 先解压，通过“添加案例”选择文件夹、拖入文件夹或多选文件。每个案例需有唯一 ID，并绑定现有 sceneId。</p>
      </article>
      <article class="guide-card"><span class="gc-no mono">02 · MANIFEST</span><h2>内容清单字段</h2>
        <pre class="code-block"><template v-for="(t,i) in tokens" :key="i"><span v-if="t.kind" :class="t.kind">{{ t.text }}</span><template v-else>{{ t.text }}</template></template></pre>
        <p>此处为结构摘要；完整可用示例请下载原模板，或参考 plugins/seismic/s3/firstbreak-stalta 中的老师示例。</p>
      </article>
      <article class="guide-card wide"><span class="gc-no mono">03 · DEMO</span><h2>演示挂载模式</h2>
        <div class="segmented" role="tablist" aria-label="演示模式">
          <button v-for="m in MODES" :key="m.key" type="button" role="tab" :aria-selected="mode===m.key" @click="mode=m.key">{{ m.label }}</button>
        </div>
        <div class="gc-mode" role="tabpanel">
          <template v-if="mode==='page'"><h3>独立 HTML 演示</h3><p>HTML、CSS 与 JS 由原宿主内联到 sandbox iframe。保留相对路径和文件名，不要求引入 Vue，不需要后端。</p></template>
          <template v-else-if="mode==='module'"><h3>模块挂载接口</h3>
            <pre class="code-block"><span class="tk-key">module.exports</span> = {
  <span class="tk-str">mount</span>(<span class="tk-param">root</span>, <span class="tk-param">api</span>) {
    <span class="tk-comment">// api: asset, readText, list, scene, kase, onDestroy, height</span>
  },
  <span class="tk-str">unmount</span>() { <span class="tk-comment">/* 清理资源 */</span> }
};</pre>
            <p>兼容 exports.mount 与 window.__CASE_MOUNT__。模块挂载在原 Shadow DOM 宿主内，离开演示时调用清理逻辑。</p></template>
          <template v-else><h3>内置演示复用</h3><p>清单使用 tabs.demo.builtin 指向已有案例 ID，复用该案例的演示挂载函数。传统插件继续调用 Cases.register()，mount 接收 root 与 scene、kase、K、atlas 上下文。</p></template>
        </div>
      </article>
      <article class="guide-card wide"><span class="gc-no mono">04 · STORAGE</span><h2>导入与版本更新</h2>
        <p>导入包保存在当前浏览器本地。换设备需重新导入；同场景可有多个案例，场景页可切换。ID 已占用时沿用原重名校验，请设置唯一 ID 或先移除旧导入。内置案例可隐藏并恢复。</p>
        <p>案例内容以源文件夹为准。日常同步不生成 ZIP；只有明确需要分发时才打包。教学合成数据、计算方法和工程边界应在正文说明。</p>
      </article>
    </div>
  </div></div>
</template>
