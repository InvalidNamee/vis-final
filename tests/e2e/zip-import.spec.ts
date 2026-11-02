import {test,expect} from '@playwright/test';
import {zipSync,strToU8} from 'fflate';

for(const layout of ['root','wrapped','flat'])test(`ZIP import and persisted demo: ${layout}`,async({page})=>{
  const prefix=layout==='wrapped'?'my-case/':'';
  const resourcePrefix=layout==='flat'?'':prefix+'demo/';
  const id=`zip-${layout}-example`;
  const pkg={id,sceneId:'d1',title:'ZIP 案例导入',tabs:{background:{sections:[{title:'专业背景',html:'<p>案例说明</p>'}]},demo:{mode:'page',html:'demo/index.html'}}};
  const buffer=Buffer.from(zipSync({
    [prefix+'case.json']:strToU8(JSON.stringify(pkg)),
    [resourcePrefix+'index.html']:strToU8('<!doctype html><html><head><link rel="stylesheet" href="demo.css"></head><body><h1>ZIP 演示</h1><script src="demo.js"></script></body></html>'),
    [resourcePrefix+'demo.css']:strToU8('body{--zip-resource-loaded:yes}'),
    [resourcePrefix+'demo.js']:strToU8('document.querySelector("h1").dataset.ready="true";'),
    '__MACOSX/my-case/._case.json':strToU8('metadata'),
    '.DS_Store':strToU8('metadata'),
  }));
  await page.goto('/cases');
  await page.getByRole('button',{name:'＋ 添加案例',exact:true}).first().click();
  await expect(page.getByRole('button',{name:'选择 ZIP',exact:true})).toBeVisible();
  const chooser=page.waitForEvent('filechooser');
  await page.getByRole('button',{name:'选择 ZIP',exact:true}).click();
  await (await chooser).setFiles({name:'example.zip',mimeType:'application/zip',buffer});
  await expect(page.locator('#import-submit')).toBeEnabled();
  await expect(page.locator('.imp-files .nm')).toHaveText(layout==='flat'?['index.html','demo.css','demo.js']:['demo/index.html','demo/demo.css','demo/demo.js']);
  await page.getByRole('button',{name:'试跑演示',exact:true}).click();
  await expect(page.frameLocator('.imp-preview iframe').locator('h1')).toHaveAttribute('data-ready','true');
  await page.getByRole('dialog',{name:'案例演示预览',exact:true}).getByRole('button',{name:'关闭',exact:true}).click();
  await page.locator('#import-submit').click();
  await expect(page).toHaveURL(new RegExp(`/scene/d1\\?case=${id}$`));
  await page.goto(`/scene/d1?case=${id}&tab=demo`);
  await expect(page.frameLocator('#case-demo-root iframe').locator('h1')).toHaveAttribute('data-ready','true');
  await expect(page.frameLocator('#case-demo-root iframe').locator('body')).toHaveCSS('--zip-resource-loaded','yes');
  await page.reload();
  await expect(page.frameLocator('#case-demo-root iframe').locator('h1')).toHaveAttribute('data-ready','true');
});
