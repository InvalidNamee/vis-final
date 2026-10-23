import {createApp} from 'vue';
import {create, NConfigProvider,NMessageProvider,NDialogProvider,NLayout,NLayoutHeader,NLayoutSider,NLayoutContent,NButton,NInput,NSelect,NForm,NFormItem,NDataTable,NModal,NCard,NTabs,NTabPane,NTag,NAlert,NSpin,NEmpty,NUpload,NUploadDragger,NMenu,NBreadcrumb,NBreadcrumbItem,NResult,NCheckbox,NInputNumber,NDescriptions,NDescriptionsItem,NCollapse,NCollapseItem,NStatistic,NGrid,NGi,NSpace} from 'naive-ui';
import {pinia,bootstrap} from './bootstrap';
import {router} from './router';
import App from './App.vue';
import '../assets/core/tokens.css';
import '../assets/core/ui.css';
const app=createApp(App);app.use(pinia);app.use(router);
app.use(create({components:[NConfigProvider,NMessageProvider,NDialogProvider,NLayout,NLayoutHeader,NLayoutSider,NLayoutContent,NButton,NInput,NSelect,NForm,NFormItem,NDataTable,NModal,NCard,NTabs,NTabPane,NTag,NAlert,NSpin,NEmpty,NUpload,NUploadDragger,NMenu,NBreadcrumb,NBreadcrumbItem,NResult,NCheckbox,NInputNumber,NDescriptions,NDescriptionsItem,NCollapse,NCollapseItem,NStatistic,NGrid,NGi,NSpace]}));
bootstrap().then(()=>app.mount('#view')).catch(error=>{document.getElementById('view')!.textContent=`初始化失败：${error.message}`;console.error(error);});

import './styles.css';
