<script setup lang="ts">
import {computed,ref,watch,onBeforeUnmount} from 'vue';
import {useRouter} from 'vue-router';
import {useMessage} from 'naive-ui';
import {useContentStore} from '../stores/content';
import {useImporterStore} from '../stores/importer';
const store=useImporterStore(),router=useRouter(),message=useMessage(),preview=ref(false),previewRoot=ref<HTMLElement|null>(null);let handle:any;
const content=useContentStore();
const scenes=computed(()=>content.atlas.stages.map((s:any)=>({type:'group',label:s.name,key:s.id,children:s.scenes.map((c:any)=>({label:c.name,value:c.id}))})));
const methods=computed(()=>Object.entries(content.atlas.methods).map(([key,value]:any)=>({label:value.name,value:key})));
function changed({fileList}:any){const files=fileList.map((f:any)=>{if(f.file&&f.fullPath&&!f.file.webkitRelativePath)Object.defineProperty(f.file,'webkitRelativePath',{value:f.fullPath,configurable:true});return f.file;}).filter(Boolean);void store.read(files);}
function stopPreview(){handle?.destroy();handle=null;}
function mountPreview(){stopPreview();if(previewRoot.value)handle=window.CaseDemoHost.create(previewRoot.value,{files:store.files,demo:store.pkg?.tabs?.demo||store.pkg?.demo||{},meta:store.meta},{scene:window.ATLAS.index.byScene[store.meta.sceneId],kase:store.pkg});}
watch(()=>store.visible,v=>{if(!v){preview.value=false;stopPreview();}});
watch(()=>store.files,()=>{preview.value=false;stopPreview();});
function submit(){const scene=store.meta.sceneId,id=store.meta.id,result=store.commit();if(!result.ok){message.error(result.error);return;}result.stored?message.success('案例已导入并保存'):message.warning('案例已导入，但存储失败，仅本次有效');void router.push({path:`/scene/${scene}`,query:{case:id}});}
function downloadTemplate(){const c=window.CaseImport,blob=c.makeZip([{name:'my-case/case.json',text:JSON.stringify(c.template(),null,2)},{name:'my-case/demo/index.html',text:c.templates.html},{name:'my-case/demo/demo.css',text:c.templates.css},{name:'my-case/demo/demo.js',text:c.templates.js}]);const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='案例包模板.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
const templateListener=()=>downloadTemplate();window.addEventListener('atlas:template',templateListener);onBeforeUnmount(()=>{stopPreview();window.removeEventListener('atlas:template',templateListener);});
</script>
<template>
  <n-modal :show="store.visible" preset="card" title="添加案例" style="width:min(1000px,95vw)" :mask-closable="!store.loading" @close="store.close" @update:show="(v:boolean)=>{if(!v)store.close()}">
    <n-alert v-if="store.error" type="error" role="alert" style="margin-bottom:16px">{{store.error}}</n-alert>
    <n-grid cols="1 760:2" :x-gap="24" :y-gap="16"><n-gi>
      <n-upload :default-upload="false" multiple directory-dnd :show-file-list="false" @change="changed"><n-upload-dragger><n-space vertical align="center"><b>拖入案例文件夹或多选文件</b><span>case.json 与 demo 资源一起选择，ZIP 请先解压。</span><n-button>选择文件</n-button></n-space></n-upload-dragger></n-upload>
      <n-space style="margin:16px 0"><n-upload directory multiple :default-upload="false" :show-file-list="false" @change="changed"><n-button>选择文件夹</n-button></n-upload><n-button @click="downloadTemplate">下载案例模板</n-button></n-space>
      <n-spin :show="store.loading"><n-data-table size="small" :columns="[{title:'资源',key:'name'},{title:'字节',key:'size',width:90}]" :data="store.files" :max-height="250" :row-key="(r:any)=>r.name"/></n-spin>
      <n-button v-if="store.pkg" style="margin-top:16px" @click="preview=true">试跑演示</n-button>
    </n-gi><n-gi>
      <n-form :model="store.meta" label-placement="top">
        <n-form-item label="案例名称" required><n-input id="import-title" v-model:value="store.meta.title" :maxlength="40"/></n-form-item>
        <n-form-item label="案例 ID" required><n-input id="import-id" v-model:value="store.meta.id" :maxlength="40"/></n-form-item>
        <n-form-item label="所属场景" required><n-select id="import-scene" v-model:value="store.meta.sceneId" :options="scenes" filterable/></n-form-item>
        <n-form-item label="智能方法"><n-select v-model:value="store.meta.methods" :options="methods" multiple/></n-form-item>
        <n-grid :cols="2" :x-gap="12"><n-gi><n-form-item label="版本"><n-input v-model:value="store.meta.version"/></n-form-item></n-gi><n-gi><n-form-item label="更新日期"><n-input v-model:value="store.meta.updated" placeholder="YYYY-MM-DD"/></n-form-item></n-gi></n-grid>
      </n-form>
      <n-collapse><n-collapse-item title="接口校验结果" name="checks"><n-space vertical><n-alert v-for="(item,i) in store.checks" :key="i" :type="item.level==='error'?'error':item.level==='warn'?'warning':'success'" :title="item.msg">{{item.hint}}</n-alert></n-space></n-collapse-item></n-collapse>
    </n-gi></n-grid>
    <template #footer><n-space justify="end"><n-button @click="store.close">取消</n-button><n-button id="import-submit" type="primary" :disabled="!store.pkg||store.loading||store.checks.some(c=>c.level==='error')" @click="submit">校验并添加</n-button></n-space></template>
  </n-modal>
  <n-modal v-model:show="preview" preset="card" title="案例演示预览" style="width:min(1200px,96vw)" @after-enter="mountPreview" @after-leave="stopPreview"><div ref="previewRoot" style="min-height:350px"></div></n-modal>
</template>

