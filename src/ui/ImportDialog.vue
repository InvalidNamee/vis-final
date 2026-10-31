<script setup lang="ts">
import {computed,ref,watch} from 'vue';
import {useRouter} from 'vue-router';
import Modal from './Modal.vue';
import ChipChecks from './ChipChecks.vue';
import {toast} from './feedback';
import {importer,importChecks,readPackage,closeImport,commitImport,downloadTemplate,filesFromDrop} from './importer';
import {atlas,methodKeys,colorOf} from '../core/store';
import demoTheme from '../styles/demo.css?raw';
import type {DemoHandle} from '../types';

const router=useRouter();
const dragging=ref(false),preview=ref(false),previewRoot=ref<HTMLElement|null>(null);
let handle:DemoHandle|null=null;

const methodOptions=computed(()=>methodKeys.value.map(k=>({value:k,label:atlas.value.methods[k].name,abbr:atlas.value.methods[k].abbr,color:colorOf(k)})));
const errors=computed(()=>importChecks.value.filter(c=>c.level==='error').length);
const warns=computed(()=>importChecks.value.filter(c=>c.level==='warn').length);
const canSubmit=computed(()=>!!importer.pkg&&!importer.loading&&!errors.value);
const kb=(n:number)=>n<1024?`${n} B`:`${(n/1024).toFixed(n<10240?1:0)} KB`;

function picked(event:Event){const input=event.target as HTMLInputElement;void readPackage([...(input.files||[])]);input.value='';}
async function dropped(event:DragEvent){dragging.value=false;void readPackage(await filesFromDrop(event.dataTransfer));}

function submit(){
  const {sceneId,id}=importer.meta,result=commitImport();
  if(!result.ok){toast('error','导入未完成',result.error);return;}
  if(result.stored)toast('ok','案例已导入并保存');else toast('warn','案例已导入','浏览器存储失败，仅本次访问有效');
  void router.push({path:`/scene/${sceneId}`,query:{case:id}});
}

function stopPreview(){handle?.destroy();handle=null;}
function mountPreview(){
  stopPreview();
  if(!previewRoot.value||!importer.pkg)return;
  handle=window.CaseDemoHost.create(previewRoot.value,{files:importer.files,demo:importer.pkg.tabs?.demo||importer.pkg.demo||{},meta:{...importer.meta}},{scene:window.ATLAS.index.byScene[importer.meta.sceneId],kase:importer.pkg,demoTheme});
}
watch(()=>[importer.visible,importer.files],()=>{preview.value=false;});
</script>

<template>
  <Modal :open="importer.visible" title="添加案例" width="1040px" :dismissable="!importer.loading" @close="closeImport">
    <p v-if="importer.error" class="imp-alert" role="alert">{{ importer.error }}</p>
    <div class="imp-grid">
      <div class="imp-source">
        <label class="imp-drop" :class="{on:dragging}" @dragover.prevent="dragging=true" @dragleave.self="dragging=false" @drop.prevent="dropped">
          <input class="sr-only" type="file" multiple @change="picked">
          <span class="imp-drop-ic" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4m0 0-4 4m4-4 4 4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg></span>
          <b>拖入案例文件夹或多选文件</b>
          <span>case.json 与 demo 资源一起选择，ZIP 请先解压。</span>
        </label>
        <div class="imp-pick">
          <label class="btn sm"><input class="sr-only" type="file" webkitdirectory multiple @change="picked">选择文件夹</label>
          <button type="button" class="btn sm ghost" @click="downloadTemplate">下载案例模板</button>
        </div>
        <div class="imp-files" :aria-busy="importer.loading">
          <div class="imp-files-head"><span>包内资源</span><span class="mono">{{ importer.loading?'读取中…':`${importer.files.length} 个文件` }}</span></div>
          <ul v-if="importer.files.length">
            <li v-for="f in importer.files" :key="f.name"><span class="mono nm">{{ f.name }}</span><span class="mono sz">{{ kb(f.size) }}</span></li>
          </ul>
          <p v-else class="imp-files-empty">{{ importer.pkg?'清单之外没有资源文件。':'尚未选择案例包。' }}</p>
        </div>
        <button v-if="importer.pkg" type="button" class="btn sm" @click="preview=true">试跑演示</button>
      </div>

      <form class="imp-form" @submit.prevent="canSubmit&&submit()">
        <label class="field"><span>案例名称 <i>*</i></span><input id="import-title" v-model="importer.meta.title" class="ui-input" maxlength="40"></label>
        <label class="field"><span>案例 ID <i>*</i></span><input id="import-id" v-model="importer.meta.id" class="ui-input mono" maxlength="40"></label>
        <label class="field"><span>所属场景 <i>*</i></span>
          <select id="import-scene" v-model="importer.meta.sceneId" class="ui-select">
            <option value="" disabled>选择业务场景</option>
            <optgroup v-for="st in atlas.stages" :key="st.id" :label="st.name"><option v-for="s in st.scenes" :key="s.id" :value="s.id">{{ s.name }}</option></optgroup>
          </select>
        </label>
        <div class="field"><span>智能方法</span><ChipChecks v-model="importer.meta.methods" :options="methodOptions" label="智能方法"/></div>
        <div class="field-row">
          <label class="field"><span>版本</span><input v-model="importer.meta.version" class="ui-input mono"></label>
          <label class="field"><span>更新日期</span><input v-model="importer.meta.updated" class="ui-input mono" placeholder="YYYY-MM-DD"></label>
        </div>
        <details class="imp-checks" :open="errors>0">
          <summary>接口校验结果<span class="mono" :data-state="errors?'error':warns?'warn':'ok'">{{ importer.pkg?`${errors} 错误 · ${warns} 提示`:'待选择' }}</span></summary>
          <ul><li v-for="(c,i) in importChecks" :key="i" :data-lv="c.level"><b>{{ c.msg }}</b><span v-if="c.hint">{{ c.hint }}</span></li></ul>
        </details>
      </form>
    </div>
    <template #footer>
      <button type="button" class="btn" @click="closeImport">取消</button>
      <button id="import-submit" type="button" class="btn primary" :disabled="!canSubmit" @click="submit">校验并添加</button>
    </template>
  </Modal>
  <Modal :open="preview" title="案例演示预览" width="1200px" @close="preview=false" @opened="mountPreview" @closed="stopPreview">
    <div ref="previewRoot" class="imp-preview"></div>
  </Modal>
</template>
