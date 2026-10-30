import {createApp} from 'vue';
import {create,NConfigProvider,NMessageProvider,NDialogProvider,NButton,NInput,NSelect,NForm,NFormItem,NDataTable,NModal,NCard,NTabs,NTabPane,NTag,NAlert,NSpin,NEmpty,NUpload,NUploadDragger,NMenu,NResult,NCheckbox,NInputNumber,NDescriptions,NDescriptionsItem,NCollapse,NCollapseItem,NStatistic,NGrid,NGi,NSpace,NDrawer,NDrawerContent,NPagination,NRadioGroup,NRadioButton} from 'naive-ui';
import {pinia,bootstrap} from './bootstrap';
import {router} from './router';
import App from './App.vue';
import {showLoading} from './components/common/loading';
import '../assets/core/ui.css';
import './styles/shell.css';
import './styles/home.css';
import './styles/pages.css';
import './styles/motion.css';
import './styles/naive.css';
const app=createApp(App);app.use(pinia);app.use(router);
app.use(create({components:[NConfigProvider,NMessageProvider,NDialogProvider,NButton,NInput,NSelect,NForm,NFormItem,NDataTable,NModal,NCard,NTabs,NTabPane,NTag,NAlert,NSpin,NEmpty,NUpload,NUploadDragger,NMenu,NResult,NCheckbox,NInputNumber,NDescriptions,NDescriptionsItem,NCollapse,NCollapseItem,NStatistic,NGrid,NGi,NSpace,NDrawer,NDrawerContent,NPagination,NRadioGroup,NRadioButton]}));
bootstrap().then(()=>app.mount('#view')).catch(error=>{
  const panel=showLoading(document.getElementById('view')!,{title:'地图加载失败',message:error.message,retry:()=>location.reload(),error:true});
  panel.classList.replace('atlas-loader--inline','atlas-loader--startup');
  console.error(error);
});
