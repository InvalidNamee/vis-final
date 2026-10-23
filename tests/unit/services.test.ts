import {beforeEach,describe,it,expect,vi} from 'vitest';
import {createPinia,setActivePinia} from 'pinia';
import {mount} from '@vue/test-utils';
import LegacyHtml from '../../src/components/LegacyHtml.vue';
import {zipSync,unzipSync,strFromU8} from 'fflate';
beforeEach(async()=>{
  vi.resetModules();localStorage.clear();sessionStorage.clear();setActivePinia(createPinia());
  await import('../../src/content/atlas.js');await import('../../src/runtime/registry.js');await import('../../src/runtime/kit.js');await import('../../src/runtime/case-demo-host.js');
  window.__ImportUI={open:vi.fn(),close:vi.fn()};window.__restorePlugin=vi.fn();await import('../../src/services/packages.js');
});
describe('public service contracts',()=>{
  it('rejects invalid edits without partially changing imported metadata',()=>{
    const pkg={id:'editable',sceneId:'d1',title:'原案例',tabs:{background:{sections:[{title:'背景',html:'业务说明'}]}}};
    localStorage.setItem('atlas.casepack.v1',JSON.stringify([{pkg,meta:pkg,savedAt:1}]));window.CaseImport.loadSaved();
    expect(window.CaseImport.updateMeta('editable',{title:'无效修改',sceneId:'missing'}).ok).toBe(false);
    expect(window.CaseImport.list()[0].title).toBe('原案例');
    expect(window.CaseImport.updateMeta('editable',{version:'2'}).ok).toBe(true);
    expect(window.Cases.get('editable').title).toBe('原案例');
  });
  it('preserves method and scene management CRUD with persisted reload',async()=>{
    const a=window.ATLAS;
    expect(a.saveMethod({key:'test-method',abbr:'TM',name:'测试方法'}).ok).toBe(true);
    expect(a.saveScene({id:'test-scene',name:'测试场景',stageId:'drilling',methods:['test-method'],diff:'中'}).ok).toBe(true);
    expect(a.index.byScene['test-scene'].stageId).toBe('drilling');
    vi.resetModules();await import('../../src/content/atlas.js');
    expect(window.ATLAS.index.byScene['test-scene'].name).toBe('测试场景');
    expect(window.ATLAS.deleteScene('test-scene').ok).toBe(true);
    expect(window.ATLAS.deleteMethod('test-method').ok).toBe(true);
    expect(window.ATLAS.index.byScene['test-scene']).toBeUndefined();
  });
  it('preserves synchronous ZIP Blob and archive contents',async()=>{
    const blob=window.CaseImport.makeZip([{name:'案例.txt',text:'教学'}]);expect(blob).toBeInstanceOf(Blob);
    const array=await new Promise<ArrayBuffer>(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result as ArrayBuffer);r.readAsArrayBuffer(blob);});
    expect(strFromU8(unzipSync(new Uint8Array(array))['案例.txt'])).toBe('教学');
  });
  it('loads v1 stored definitions and v2 files without rewriting storage',()=>{
    const pkg={id:'stored',sceneId:'d1',title:'旧存档',tabs:{background:{sections:[{title:'背景',html:'<p>legacy</p>'}]}}};
    localStorage.setItem('atlas.casepack.v1',JSON.stringify([{pkg,meta:pkg,savedAt:1}]));const original=localStorage.getItem('atlas.casepack.v1');window.CaseImport.loadSaved();expect(window.Cases.get('stored').imported).toBe(true);expect(localStorage.getItem('atlas.casepack.v1')).toBe(original);
  });
  it('keeps normal authentication and persisted accounts',async()=>{
    const auth=await import('../../src/services/management');expect(auth.login('admin','wrong').ok).toBe(false);expect(auth.login('admin','admin123').ok).toBe(true);expect(auth.changePassword('new-pass').ok).toBe(true);auth.logout();expect(auth.login('admin','admin123').ok).toBe(false);expect(auth.login('admin','new-pass').ok).toBe(true);
  });
  it('rejects duplicate IDs and preserves well-separated import state',()=>{
    const pkg={id:'duplicate',sceneId:'d1',title:'案例',tabs:{background:{sections:[{title:'背景',html:'content'}]}}};window.Cases.register(pkg);expect(window.__PackageService.commit(pkg,pkg,[]).ok).toBe(false);
  });
});
it('content HTML preserves checklist interaction without Vue template execution',async()=>{
 const html=window.K.checklist([['钻井记录','时序','复核']]);const wrapper=mount(LegacyHtml,{props:{html}});await wrapper.get('.cl-item').trigger('click');expect(wrapper.get('#cl-txt').text()).toBe('1 / 1');wrapper.unmount();
});
