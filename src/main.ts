import {createApp} from 'vue';
import {router} from './router';
import {bootRuntime} from './boot/runtime';
import {showLoading} from './ui/loader';
import {installTextures} from './ui/texture';
import App from './App.vue';
import '../assets/core/ui.css';
import './styles/shell.css';
import './styles/controls.css';
import './styles/home.css';
import './styles/pages.css';
import './styles/motion.css';

const app=createApp(App);
app.use(router);
installTextures();
bootRuntime().then(()=>app.mount('#view')).catch(error=>{
  const panel=showLoading(document.getElementById('view')!,{title:'地图加载失败',message:error.message,retry:()=>location.reload(),error:true});
  panel.classList.replace('atlas-loader--inline','atlas-loader--startup');
  console.error(error);
});
