import './types';
import {router,consumeLegacyHash} from './router';
import {initializePlugins} from './plugins/catalog';
import {useContentStore} from './stores/content';
import {useImporterStore} from './stores/importer';
import {createPinia} from 'pinia';

export const pinia=createPinia();
export async function bootstrap(){
  await import('./content/atlas.js');await import('./runtime/registry.js');await import('./runtime/kit.js');await import('./runtime/case-demo-host.js');
  const content=useContentStore(pinia),importer=useImporterStore(pinia);
  window.__ImportUI={open:importer.open,close:importer.close};
  await import('./services/packages.js');
  await initializePlugins();await import('./compat/admin.js');
  const refresh=()=>content.refresh();
  // Preserve imperative API return values while publishing mutations to the store.
  for(const [object,keys]of [[window.Cases,['register','unregister']],[window.ATLAS,['saveScene','deleteScene','saveMethod','deleteMethod','reindex']],[window.CaseImport,['updateMeta']]] as [any,string[]][]){
    for(const key of keys){const fn=object[key];object[key]=function(...args:any[]){const result=fn.apply(object,args);refresh();return result;};}
  }
  window.addEventListener('atlas:changed',refresh);
  window.addEventListener('hashchange',()=>{consumeLegacyHash();refresh();});
  document.addEventListener('click',event=>{
    const el=(event.target as Element)?.closest?.('[data-import],[data-remove-case],[data-restore-case],[data-dl-template]') as HTMLElement|null;
    if(!el)return;event.preventDefault();
    if(el.hasAttribute('data-import'))window.CaseImport.open({sceneId:el.dataset.scene||''});
    else if(el.dataset.removeCase)window.CaseImport.remove(el.dataset.removeCase);
    else if(el.dataset.restoreCase)window.CaseImport.restore(el.dataset.restoreCase);
    else window.dispatchEvent(new Event('atlas:template'));
  });
  refresh();
  await router.isReady();consumeLegacyHash();
}
