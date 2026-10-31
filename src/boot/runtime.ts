import '../types';
import {refresh} from '../core/store';
import {consumeLegacyHash,router} from '../router';
import {openImport,closeImport,downloadTemplate} from '../ui/importer';
import {toast} from '../ui/feedback';
import {registerPlugins} from './plugins';

/* Load order matters: data → registry → kit → demo host → import service → plugins → legacy admin.
   Each runtime file is a classic script that installs one global; build checks load the same files in vm. */
export async function bootRuntime(){
  await import('../content/atlas.js');
  await import('../runtime/registry.js');
  await import('../runtime/kit.js');
  await import('../runtime/case-demo-host.js');
  window.__ImportUI={open:openImport,close:closeImport};
  await import('../services/packages.js');
  await registerPlugins();
  await import('../compat/admin.js');

  // Runtime mutators emit atlas:changed; the legacy admin emits hashchange.
  window.addEventListener('atlas:changed',refresh);
  window.addEventListener('hashchange',()=>{consumeLegacyHash();refresh();});
  window.addEventListener('atlas:notice',e=>{const {title,sub}=(e as CustomEvent).detail||{};toast('ok',title,sub);});
  window.addEventListener('atlas:template',downloadTemplate);
  document.addEventListener('click',delegate);
  refresh();
  await router.isReady();
  consumeLegacyHash();
}

// Case content and legacy HTML can trigger shell actions with data attributes.
function delegate(event:MouseEvent){
  const el=(event.target as Element|null)?.closest?.('[data-import],[data-remove-case],[data-restore-case],[data-dl-template]') as HTMLElement|null;
  if(!el)return;
  event.preventDefault();
  if(el.hasAttribute('data-import'))window.CaseImport.open({sceneId:el.dataset.scene||''});
  else if(el.dataset.removeCase)window.CaseImport.remove(el.dataset.removeCase);
  else if(el.dataset.restoreCase)window.CaseImport.restore(el.dataset.restoreCase);
  else downloadTemplate();
}
