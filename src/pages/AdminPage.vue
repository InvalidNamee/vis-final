<script setup lang="ts">
import {computed,h,ref,watch} from 'vue';
import {useRoute,useRouter} from 'vue-router';
import {NButton,NTag,useDialog,useMessage} from 'naive-ui';
import {useContentStore} from '../stores/content';
import {useSessionStore} from '../stores/session';
import {changePassword} from '../services/management';
const route=useRoute(),router=useRouter(),content=useContentStore(),session=useSessionStore(),dialog=useDialog(),message=useMessage();
const user=ref(''),password=ref(''),passwordModal=ref(false),newPassword=ref(''),search=ref(''),editing=ref(false),model=ref<any>({});
const section=computed(()=>String(route.params.section||'overview'));
const title=computed(()=>({overview:'管理概览',cases:'案例管理',methods:'智能方法管理',scenes:'业务场景管理'}[section.value]||'管理概览'));
const options=[{label:'管理概览',key:'overview'},{label:'案例管理',key:'cases'},{label:'智能方法管理',key:'methods'},{label:'业务场景管理',key:'scenes'}];
const rows=computed(()=>{const all=section.value==='cases'?content.cases:section.value==='methods'?Object.values(content.atlas.methods):content.atlas.allScenes;return all.filter((r:any)=>JSON.stringify(r).toLowerCase().includes(search.value.toLowerCase()));});
const methodOptions=computed(()=>Object.entries(content.atlas.methods).map(([value,m]:any)=>({value,label:m.name})));
const stageOptions=computed(()=>content.atlas.stages.map((s:any)=>({value:s.id,label:s.name})));
const sceneOptions=computed(()=>content.atlas.allScenes.map((s:any)=>({value:s.id,label:s.stageName+' / '+s.name})));
function navigate(key:string){void router.push('/admin'+(key==='overview'?'':'/'+key));}
function signIn(){const r=session.login(user.value,password.value);if(!r.ok)message.error(r.error||'登录失败');else {password.value='';void router.push('/admin/cases');}}
function edit(row?:any){
 if(section.value==='cases'&&!row?.imported){message.info('内置案例请修改分类插件源文件；此处可隐藏或恢复。');return;}
 model.value=row?JSON.parse(JSON.stringify(row)):{key:'',id:'',name:'',title:'',abbr:'',desc:'',signal:'',stageId:content.atlas.stages[0]?.id,methods:[],diff:'中',status:'full',intro:'',point:'',problem:'',diffWhy:''};editing.value=true;
}
function save(){let r;
 if(section.value==='cases')r=window.CaseImport.updateMeta(model.value.id,{title:model.value.title,sceneId:model.value.sceneId,methods:model.value.methods,version:model.value.version,updated:model.value.updated});
 else if(section.value==='methods')r=window.ATLAS.saveMethod(model.value);
 else r=window.ATLAS.saveScene(model.value);
 if(!r.ok){message.error(r.error||'保存失败');return;}content.refresh();editing.value=false;message.success('修改已保存');if(route.query.edit)void router.replace({path:route.path});
}
function remove(row:any){dialog.warning({title:section.value==='cases'?(row.imported?'移除导入案例':'隐藏内置案例'):'删除管理条目',content:'确认后将更新当前浏览器中的记录。',positiveText:'确认',negativeText:'取消',onPositiveClick:()=>{let r;
 if(section.value==='cases')r={ok:window.__PackageService.removeConfirmed(row.id)};
 else if(section.value==='methods')r=window.ATLAS.deleteMethod(row.key);else r=window.ATLAS.deleteScene(row.id);
 if(!r.ok)message.error(r.error||'操作失败');else {content.refresh();message.success('已更新');}
 }});}
const columns=computed<any[]>(()=>[
 {title:'ID',key:section.value==='methods'?'key':'id',width:160},
 {title:'名称',key:section.value==='cases'?'title':'name',minWidth:200},
 ...(section.value==='cases'?[{title:'来源',key:'imported',width:110,render:(r:any)=>h(NTag,{type:r.imported?'success':'default'},()=>r.imported?'本地导入':'内置')},{title:'版本',key:'version',width:90}]:section.value==='scenes'?[{title:'所属环节',key:'stageName',width:100},{title:'难度',key:'diff',width:70}]:[{title:'缩写',key:'abbr',width:100}]),
 {title:'操作',key:'actions',width:180,render:(r:any)=>h('div',{style:'display:flex;gap:8px'},[h(NButton,{size:'small',onClick:()=>edit(r)},()=> '编辑'),h(NButton,{size:'small',onClick:()=>remove(r)},()=>section.value==='cases'&&!r.imported?'隐藏':'删除')])}
]);
watch(()=>[route.query.edit,section.value,content.cases],()=>{if(route.query.edit&&section.value==='cases'){const row=content.cases.find((r:any)=>r.id===route.query.edit);if(row)edit(row);}}, {immediate:true});
function updatePassword(){const r=changePassword(newPassword.value);if(!r.ok)message.error(r.error||'修改失败');else{newPassword.value='';passwordModal.value=false;message.success('密码已更新');}}
</script>
<template>
 <section class="atlas-section">
  <n-card v-if="!session.authenticated" title="管理员登录" style="max-width:460px;margin:32px auto">
   <n-alert type="info" style="margin-bottom:20px">本地教学管理。初始账号 admin / admin123，已有账号继续有效。</n-alert>
   <n-form @submit.prevent="signIn"><n-form-item label="账号"><n-input v-model:value="user" placeholder="管理员账号" autocomplete="username"/></n-form-item><n-form-item label="密码"><n-input v-model:value="password" type="password" placeholder="管理员密码" autocomplete="current-password" @keydown.enter.prevent="signIn"/></n-form-item><n-button type="primary" block @click="signIn">登录</n-button></n-form>
  </n-card>
  <template v-else><n-space justify="space-between" align="center"><h1>{{title}}</h1><n-space><n-button @click="passwordModal=true">修改密码</n-button><n-button @click="session.logout();router.push('/')">退出管理</n-button></n-space></n-space>
   <n-menu mode="horizontal" :value="section" :options="options" @update:value="navigate" style="margin:20px 0"/>
   <n-grid v-if="section==='overview'" cols="1 600:3" :x-gap="16" :y-gap="16"><n-gi><n-card><n-statistic label="案例" :value="content.cases.length"/></n-card></n-gi><n-gi><n-card><n-statistic label="业务场景" :value="content.atlas.allScenes.length"/></n-card></n-gi><n-gi><n-card><n-statistic label="智能方法" :value="Object.keys(content.atlas.methods).length"/></n-card></n-gi></n-grid>
   <template v-else><n-space style="margin:20px 0"><n-input v-model:value="search" placeholder="搜索管理条目" clearable/><n-button v-if="section!=='cases'" type="primary" @click="edit()">新增条目</n-button><n-button v-else data-import>添加案例</n-button></n-space><n-data-table :columns="columns" :data="rows" :row-key="(r:any)=>r.id||r.key" :pagination="{pageSize:10}" :scroll-x="760"/></template>
  </template>
 </section>
 <n-modal v-model:show="editing" preset="card" title="管理条目编辑" style="width:min(650px,94vw)"><n-form :model="model">
  <template v-if="section==='cases'"><n-form-item label="案例名称"><n-input v-model:value="model.title" :maxlength="40" placeholder="案例名称"/></n-form-item><n-form-item label="所属场景"><n-select v-model:value="model.sceneId" :options="sceneOptions" filterable/></n-form-item><n-form-item label="版本"><n-input v-model:value="model.version"/></n-form-item><n-form-item label="更新日期"><n-input v-model:value="model.updated"/></n-form-item></template>
  <template v-else><n-form-item :label="section==='methods'?'方法 ID':'场景 ID'"><n-input v-if="section==='methods'" v-model:value="model.key"/><n-input v-else v-model:value="model.id"/></n-form-item><n-form-item label="名称"><n-input v-model:value="model.name" placeholder="条目名称"/></n-form-item></template>
  <template v-if="section==='methods'"><n-form-item label="缩写"><n-input v-model:value="model.abbr"/></n-form-item><n-form-item label="方法说明"><n-input v-model:value="model.desc" type="textarea"/></n-form-item><n-form-item label="处理任务"><n-input v-model:value="model.signal"/></n-form-item></template>
  <template v-if="section==='scenes'"><n-form-item label="所属环节"><n-select v-model:value="model.stageId" :options="stageOptions"/></n-form-item><n-form-item label="技术难度"><n-select v-model:value="model.diff" :options="['低','中','高'].map(value=>({label:value,value}))"/></n-form-item><n-form-item label="内容状态"><n-select v-model:value="model.status" :options="[{label:'已收录',value:'full'},{label:'待扩展',value:'ext'}]"/></n-form-item><n-form-item v-for="field in [{key:'intro',label:'业务背景'},{key:'point',label:'智能方法介入点'},{key:'problem',label:'业务问题'},{key:'diffWhy',label:'技术难度说明'}]" :key="field.key" :label="field.label"><n-input v-model:value="model[field.key]" type="textarea"/></n-form-item></template>
  <n-form-item v-if="section!=='methods'" label="智能方法"><n-select v-model:value="model.methods" :options="methodOptions" multiple/></n-form-item>
 </n-form><template #footer><n-space justify="end"><n-button @click="editing=false">取消</n-button><n-button type="primary" @click="save">保存修改</n-button></n-space></template></n-modal>
 <n-modal v-model:show="passwordModal" preset="card" title="管理密码修改" style="width:min(460px,94vw)"><n-input v-model:value="newPassword" type="password" placeholder="新密码（至少 6 位）"/><template #footer><n-button type="primary" @click="updatePassword">保存密码</n-button></template></n-modal>
</template>
