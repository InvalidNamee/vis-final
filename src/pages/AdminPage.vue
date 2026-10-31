<script setup lang="ts">
import {computed,ref,watch} from 'vue';
import {useRoute,useRouter} from 'vue-router';
import {atlas,cases,methodKeys,colorOf} from '../core/store';
import {signedIn,signIn,signOut,changePassword} from '../core/session';
import {DIFFS} from '../core/format';
import {confirm,toast} from '../ui/feedback';
import PageHeader from '../components/PageHeader.vue';
import Modal from '../ui/Modal.vue';
import DataTable from '../ui/DataTable.vue';
import ChipChecks from '../ui/ChipChecks.vue';
import type {Result} from '../types';

type Section='overview'|'cases'|'methods'|'scenes';
const route=useRoute(),router=useRouter();
const SECTIONS:{key:Section;label:string}[]=[{key:'overview',label:'管理概览'},{key:'cases',label:'案例管理'},{key:'methods',label:'智能方法管理'},{key:'scenes',label:'业务场景管理'}];
const section=computed<Section>(()=>(SECTIONS.find(s=>s.key===route.params.section)?.key)||'overview');
const title=computed(()=>SECTIONS.find(s=>s.key===section.value)!.label);
const to=(key:Section)=>key==='overview'?'/admin':`/admin/${key}`;

const user=ref(''),password=ref('');
function login(){
  const r=signIn(user.value,password.value);
  if(!r.ok){toast('error',r.error||'登录失败');return;}
  password.value='';void router.push('/admin/cases');
}
function logout(){signOut();void router.push('/');}
const passwordOpen=ref(false),newPassword=ref('');
function savePassword(){
  const r=changePassword(newPassword.value);
  if(!r.ok){toast('error',r.error||'修改失败');return;}
  newPassword.value='';passwordOpen.value=false;toast('ok','密码已更新');
}

const search=ref('');
watch(section,()=>{search.value='';});
const source=computed<any[]>(()=>section.value==='cases'?cases.value:section.value==='methods'?Object.values(atlas.value.methods):atlas.value.allScenes);
const rows=computed(()=>{const q=search.value.toLowerCase();return source.value.filter(r=>JSON.stringify(r).toLowerCase().includes(q));});
const columns=computed(()=>[
  {key:section.value==='methods'?'key':'id',title:'ID',width:'160px',mono:true},
  {key:section.value==='cases'?'title':'name',title:'名称'},
  ...(section.value==='cases'?[{key:'imported',title:'来源',width:'110px'},{key:'version',title:'版本',width:'90px',mono:true}]
    :section.value==='scenes'?[{key:'stageName',title:'所属环节',width:'110px'},{key:'diff',title:'难度',width:'70px'}]
      :[{key:'abbr',title:'缩写',width:'100px',mono:true}]),
  {key:'actions',title:'操作',width:'170px'},
]);
const rowKey=(r:any)=>r.id||r.key;

const editing=ref(false),isNew=ref(false),model=ref<Record<string,any>>({});
const methodOptions=computed(()=>methodKeys.value.map(k=>({value:k,label:atlas.value.methods[k].name,abbr:atlas.value.methods[k].abbr,color:colorOf(k)})));
function edit(row?:any){
  if(section.value==='cases'&&!row?.imported){toast('info','内置案例请修改分类插件源文件','此处可隐藏或恢复。');return;}
  isNew.value=!row;
  model.value=row?JSON.parse(JSON.stringify(row)):{key:'',id:'',name:'',abbr:'',desc:'',signal:'',stageId:atlas.value.stages[0]?.id,methods:[],diff:'中',status:'full',intro:'',point:'',problem:'',diffWhy:''};
  editing.value=true;
}
function save(){
  const m=model.value;
  const r:Result=section.value==='cases'?window.CaseImport.updateMeta(m.id,{title:m.title,sceneId:m.sceneId,methods:m.methods,version:m.version,updated:m.updated})
    :section.value==='methods'?window.ATLAS.saveMethod(m):window.ATLAS.saveScene(m);
  if(!r.ok){toast('error','保存失败',r.error);return;}
  editing.value=false;toast('ok','修改已保存');
  if(route.query.edit)void router.replace({path:route.path});
}
async function remove(row:any){
  const builtin=section.value==='cases'&&!row.imported;
  const ok=await confirm({title:section.value==='cases'?(row.imported?'移除导入案例':'隐藏内置案例'):'删除管理条目',body:`「${row.title||row.name}」的更改只作用于当前浏览器。`,danger:!builtin});
  if(!ok)return;
  const r:Result=section.value==='cases'?{ok:window.__PackageService.removeConfirmed(row.id)}
    :section.value==='methods'?window.ATLAS.deleteMethod(row.key):window.ATLAS.deleteScene(row.id);
  if(!r.ok)toast('error','操作失败',r.error);else if(section.value!=='cases')toast('ok','已更新');
}
// Legacy links: /admin/cases?edit=<id> opens the editor.
watch(()=>[route.query.edit,section.value,cases.value] as const,([id])=>{
  if(!id||section.value!=='cases'||editing.value)return;
  const row=cases.value.find(c=>c.id===id);if(row)edit(row);
},{immediate:true});
</script>

<template>
  <div class="page admin"><div class="wrap">
    <template v-if="!signedIn">
      <PageHeader idx="ADMIN" title="内容管理登录" blurb="本地教学管理，数据保存在当前浏览器。"/>
      <form class="adm-login" @submit.prevent="login">
        <h2>管理员登录</h2>
        <p class="note">初始账号 admin / admin123，已有账号继续有效。账号只做操作门槛，不是安全边界。</p>
        <label class="field"><span>账号</span><input v-model="user" class="ui-input" placeholder="管理员账号" autocomplete="username"></label>
        <label class="field"><span>密码</span><input v-model="password" class="ui-input" type="password" placeholder="管理员密码" autocomplete="current-password"></label>
        <button type="submit" class="btn primary block">登录</button>
      </form>
    </template>
    <template v-else>
      <PageHeader idx="ADMIN" :title="title" blurb="案例元数据、智能方法与业务场景的本地管理；修改以浏览器覆盖层叠加在源数据上。">
        <template #actions><button type="button" class="btn sm" @click="passwordOpen=true">修改密码</button><button type="button" class="btn sm ghost" @click="logout">退出管理</button></template>
      </PageHeader>
      <nav class="adm-nav" aria-label="管理分区">
        <router-link v-for="s in SECTIONS" :key="s.key" :to="to(s.key)" :aria-current="section===s.key?'page':undefined">{{ s.label }}</router-link>
      </nav>
      <div v-if="section==='overview'" class="adm-stats">
        <router-link to="/admin/cases"><b>{{ cases.length }}</b><span>案例</span></router-link>
        <router-link to="/admin/scenes"><b>{{ atlas.allScenes.length }}</b><span>业务场景</span></router-link>
        <router-link to="/admin/methods"><b>{{ methodKeys.length }}</b><span>智能方法</span></router-link>
      </div>
      <template v-else>
        <div class="adm-tools">
          <input v-model="search" class="ui-input" type="search" placeholder="搜索管理条目" aria-label="搜索管理条目">
          <button v-if="section!=='cases'" type="button" class="btn primary" @click="edit()">新增条目</button>
          <button v-else type="button" class="btn primary" data-import>添加案例</button>
        </div>
        <DataTable :key="section" :columns="columns" :rows="rows" :row-key="rowKey" :label="title">
          <template #imported="{row}"><span :class="row.imported?'badge-ready':'badge-wip'">{{ row.imported?'本地导入':'内置' }}</span></template>
          <template #actions="{row}">
            <span class="row-acts"><button type="button" class="btn sm" @click="edit(row)">编辑</button><button type="button" class="btn sm ghost" @click="remove(row)">{{ section==='cases'&&!row.imported?'隐藏':'删除' }}</button></span>
          </template>
        </DataTable>
      </template>
    </template>
  </div></div>

  <Modal :open="editing" title="管理条目编辑" width="640px" @close="editing=false">
    <form class="adm-form" @submit.prevent="save">
      <template v-if="section==='cases'">
        <label class="field"><span>案例名称</span><input v-model="model.title" class="ui-input" maxlength="40" placeholder="案例名称"></label>
        <label class="field"><span>所属场景</span><select v-model="model.sceneId" class="ui-select"><optgroup v-for="st in atlas.stages" :key="st.id" :label="st.name"><option v-for="s in st.scenes" :key="s.id" :value="s.id">{{ s.name }}</option></optgroup></select></label>
        <div class="field-row"><label class="field"><span>版本</span><input v-model="model.version" class="ui-input mono"></label><label class="field"><span>更新日期</span><input v-model="model.updated" class="ui-input mono" placeholder="YYYY-MM-DD"></label></div>
      </template>
      <template v-else>
        <label class="field"><span>{{ section==='methods'?'方法 ID':'场景 ID' }}</span><input v-if="section==='methods'" v-model="model.key" class="ui-input mono" :readonly="!isNew"><input v-else v-model="model.id" class="ui-input mono" :readonly="!isNew"></label>
        <label class="field"><span>名称</span><input v-model="model.name" class="ui-input" placeholder="条目名称"></label>
      </template>
      <template v-if="section==='methods'">
        <label class="field"><span>缩写</span><input v-model="model.abbr" class="ui-input mono"></label>
        <label class="field"><span>方法说明</span><textarea v-model="model.desc" class="ui-input" rows="3"></textarea></label>
        <label class="field"><span>处理任务</span><input v-model="model.signal" class="ui-input"></label>
      </template>
      <template v-if="section==='scenes'">
        <div class="field-row">
          <label class="field"><span>所属环节</span><select v-model="model.stageId" class="ui-select"><option v-for="st in atlas.stages" :key="st.id" :value="st.id">{{ st.name }}</option></select></label>
          <label class="field"><span>技术难度</span><select v-model="model.diff" class="ui-select"><option v-for="d in DIFFS" :key="d" :value="d">{{ d }}</option></select></label>
          <label class="field"><span>内容状态</span><select v-model="model.status" class="ui-select"><option value="full">已收录</option><option value="ext">待扩展</option></select></label>
        </div>
        <label v-for="f in [{key:'intro',label:'业务背景'},{key:'point',label:'智能方法介入点'},{key:'problem',label:'业务问题'},{key:'diffWhy',label:'技术难度说明'}]" :key="f.key" class="field"><span>{{ f.label }}</span><textarea v-model="model[f.key]" class="ui-input" rows="2"></textarea></label>
      </template>
      <div v-if="section!=='methods'" class="field"><span>智能方法</span><ChipChecks v-model="model.methods" :options="methodOptions" label="智能方法"/></div>
    </form>
    <template #footer><button type="button" class="btn" @click="editing=false">取消</button><button type="button" class="btn primary" @click="save">保存修改</button></template>
  </Modal>
  <Modal :open="passwordOpen" title="管理密码修改" width="440px" @close="passwordOpen=false">
    <label class="field"><span>新密码</span><input v-model="newPassword" class="ui-input" type="password" placeholder="新密码（至少 6 位）" autocomplete="new-password"></label>
    <template #footer><button type="button" class="btn primary" @click="savePassword">保存密码</button></template>
  </Modal>
</template>
