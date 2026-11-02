import {beforeEach,describe,it,expect,vi} from 'vitest';
import {zipSync,strToU8} from 'fflate';

beforeEach(async()=>{
  vi.resetModules();localStorage.clear();
  await import('../../src/content/atlas.js');
  await import('../../src/runtime/registry.js');
  await import('../../src/runtime/case-demo-host.js');
  window.__ImportUI={open:vi.fn(),close:vi.fn()};
  await import('../../src/services/packages.js');
});

const pkg={id:'zip-example',sceneId:'d1',title:'ZIP 导入示例',tabs:{
  background:{sections:[{title:'专业背景',html:'<p>案例说明</p>'}]},demo:{mode:'page',html:'demo/index.html'},
}};
const archive=(entries:Record<string,Uint8Array>,name='case.zip')=>new File([new Uint8Array(zipSync(entries)).buffer],name,{type:'application/zip'});
const resources=(prefix='')=>({
  [prefix+'case.json']:strToU8(JSON.stringify(pkg)),
  [prefix+'demo/index.html']:strToU8('<!doctype html><html><body><h1>ZIP 示例</h1></body></html>'),
  [prefix+'demo/图片.png']:new Uint8Array([137,80,78,71,0,255]),
});

describe('ZIP case import',()=>{
  it.each(['','my-case/'])('imports %s and restores resource paths and binary bytes after saving',async prefix=>{
    const {openImport,readPackage,importer,importChecks,commitImport}=await import('../../src/ui/importer');
    openImport();await readPackage([archive({...resources(prefix),'__MACOSX/my-case/._case.json':strToU8('metadata'),'.DS_Store':strToU8('metadata')})]);
    expect(importer.error).toBe('');expect(importer.meta.title).toBe(pkg.title);
    expect(importer.files.map(f=>f.name)).toEqual(['demo/index.html','demo/图片.png']);
    expect(importer.files[1].enc).toBe('dataurl');
    expect(importer.files[1].data).toBe('data:image/png;base64,iVBORwD/');
    expect(importChecks.value.filter(c=>c.level==='error')).toEqual([]);
    expect(commitImport().ok).toBe(true);
    const saved=JSON.parse(localStorage.getItem('atlas.casepack.v2')!);
    expect(saved[0].files.map((f:{name:string})=>f.name)).toEqual(['demo/index.html','demo/图片.png']);
    window.Cases.unregister(pkg.id);window.CaseImport.loadSaved();
    expect(window.Cases.get(pkg.id)?.imported).toBe(true);
  });
  it('imports a wrapped manifest-only ZIP',async()=>{
    const {readPackage,importer}=await import('../../src/ui/importer');
    await readPackage([archive({'my-case/case.json':strToU8(JSON.stringify({...pkg,tabs:{background:pkg.tabs.background}}))})]);
    expect(importer.error).toBe('');expect(importer.pkg?.id).toBe(pkg.id);expect(importer.files).toEqual([]);
  });
  it('keeps loose-file and directory imports working',async()=>{
    const {readPackage,importer}=await import('../../src/ui/importer');
    for(const prefix of ['','my-case/']){
      const files=Object.entries(resources(prefix)).map(([name,data])=>{
        const file=new File([new Uint8Array(data).buffer],name.split('/').pop()!);
        Object.defineProperty(file,'webkitRelativePath',{value:name});return file;
      });
      await readPackage(files);expect(importer.error).toBe('');
      expect(importer.files.map(f=>f.name)).toEqual(['demo/index.html','demo/图片.png']);
    }
  });
  it('rejects a corrupt ZIP and clears the previously selected package',async()=>{
    const {readPackage,importer}=await import('../../src/ui/importer');
    await readPackage([archive(resources())]);
    await readPackage([new File(['broken'],'broken.zip')]);
    expect(importer.error).toContain('无法读取 ZIP');expect(importer.pkg).toBeNull();expect(importer.loading).toBe(false);
  });
  it('reports a missing manifest and rejects mixed ZIP selections',async()=>{
    const {readPackage,importer}=await import('../../src/ui/importer');
    await readPackage([archive({'demo/index.html':strToU8('demo')})]);
    expect(importer.error).toContain('没有找到案例 JSON 清单');
    await readPackage([archive(resources()),new File(['{}'],'case.json')]);
    expect(importer.error).toContain('单独选择一个 ZIP');
  });
  it('rejects excessive expanded content before reading it into the import form',async()=>{
    const {readPackage,importer}=await import('../../src/ui/importer');
    await readPackage([archive({'large.txt':new Uint8Array(8*1024*1024+1)})]);
    expect(importer.error).toContain('超过 8 MB');expect(importer.files).toEqual([]);
  });
});
