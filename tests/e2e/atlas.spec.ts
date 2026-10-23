import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const teacher=path.resolve('plugins/seismic/s3/firstbreak-stalta');
test('workflow facts preserve label/value pairs and original sample metrics',async({page})=>{
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:1000});await page.goto('/scene/d1?tab=flow');
    const cells=page.locator('.case-cells');await expect(cells.locator(':scope > div')).toHaveCount(3);
    await expect(cells.locator('.l')).toHaveText(['数据来源','切分单位','推荐范围']);
    await expect(cells.locator('.v')).toHaveText(['固定种子合成','虚拟井','教学约束内']);
    const layout=await cells.evaluate(e=>{
      const items=[...e.children],last=items.at(-1)!.getBoundingClientRect(),box=e.getBoundingClientRect();
      return {padding:items.map(c=>getComputedStyle(c.querySelector('.l')!).padding),height:box.height,lastWidth:last.width,width:box.width,
        pairs:items.map(c=>{const l=c.querySelector('.l')!.getBoundingClientRect(),v=c.querySelector('.v')!.getBoundingClientRect();return {labelTop:l.top,valueTop:v.top,labelRight:l.right,valueLeft:v.left};})};
    });
    expect(layout.padding).toEqual(['0px','0px','0px']);
    expect(layout.lastWidth).toBeGreaterThan(layout.width-4);
    if(width===390){expect(layout.height).toBeLessThan(200);for(const pair of layout.pairs){expect(Math.abs(pair.labelTop-pair.valueTop)).toBeLessThan(5);expect(pair.valueLeft).toBeGreaterThan(pair.labelRight);}}
    await cells.scrollIntoViewIfNeeded();await page.screenshot({path:`output/playwright/facts-${width}.png`});
  }
  await page.setViewportSize({width:1440,height:1000});await page.goto('/scene/w1?tab=flow');
  await expect(page.locator('.case-cells > div')).toHaveCount(6);
  await expect(page.locator('.case-cells .v').first()).toHaveText('42');
});
test('narrow content grids contain diagrams and code',async({page})=>{
  for(const width of [320,390,768,900]){
    await page.setViewportSize({width,height:850});
    for(const route of ['/','/guide','/stage/drilling',...['d1','d2','d3','d4','d5'].map(id=>`/scene/${id}?tab=bg`)]){
      await page.goto(route);await expect(page.locator('main h1')).toBeVisible();
      if(route.startsWith('/scene/'))await expect(page.locator('.atlas-content-section').first()).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth),`${width}px ${route}`).toBeLessThanOrEqual(width+1);
    }
  }
  await page.setViewportSize({width:390,height:850});await page.goto('/scene/d1?tab=bg');
  const diagram=page.getByRole('region',{name:'概念图，窄屏可横向滚动'}).first();
  await expect(diagram).toBeVisible();
  expect(await diagram.evaluate(e=>e.scrollWidth>e.clientWidth)).toBeTruthy();
  await diagram.evaluate(e=>{e.scrollLeft=120;});
  expect(await diagram.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);
  await diagram.scrollIntoViewIfNeeded();
  await page.screenshot({path:'output/playwright/background-390.png'});
  await page.goto('/guide');
  expect(await page.locator('.atlas-guide pre').first().evaluate(e=>e.clientWidth<=document.documentElement.clientWidth)).toBeTruthy();
});
test('builtin hide and restore survive reload',async({page})=>{
  await page.goto('/cases');
  const card=page.locator('.atlas-library-card').filter({hasText:'drilling-warning'});
  await card.getByRole('button',{name:'隐藏',exact:true}).click();
  await page.getByRole('button',{name:'确认',exact:true}).click();
  await expect(card).toHaveCount(0);await page.reload();await expect(card).toHaveCount(0);
  await page.getByRole('button',{name:'恢复 drilling-warning',exact:true}).click();
  await expect(card).toHaveCount(1);await page.reload();await expect(card).toHaveCount(1);
});
test('History routes, classified cases and legacy links',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/stage/drilling');await expect(page.locator('h1')).toContainText('钻井');
  await expect(page.locator('.atlas-scene-card')).toHaveCount(5);
  await page.reload();await expect(page.locator('.atlas-scene-card')).toHaveCount(5);
  await page.goto('/#/scene/d1?tab=demo');await expect(page).toHaveURL(/\/scene\/d1\?tab=demo$/);
  await expect(page.frameLocator('#case-demo-root iframe').locator('#heatmap')).toBeVisible();
  for(const [id,keyword]of [['d2','井下复杂事故前兆预警'],['d3','井眼轨迹智能控制'],['d4','钻具失效预测'],['d5','钻井液性能智能调控']]){
    await page.goto(`/scene/${id}?tab=demo`);await expect(page.frameLocator('#case-demo-root iframe').locator('h1')).toHaveText(keyword);
  }
  await page.goto('/scene/w1?tab=demo');await expect(page.locator('#case-demo-root')).not.toBeEmpty();
  await page.goto('/');await page.getByPlaceholder('搜索业务名称、参数或智能化方法…').fill('钻速');await expect(page.locator('.atlas-scene-card')).toHaveCount(1);
  expect(errors).toEqual([]);
});
test('original teacher package import, restore, management edit and CSV download',async({page})=>{
  await page.goto('/cases');await page.getByRole('button',{name:'＋ 添加案例',exact:true}).first().click();
  await page.locator('input[type=file]').first().setInputFiles([path.join(teacher,'case.json'),...fs.readdirSync(path.join(teacher,'demo')).map(n=>path.join(teacher,'demo',n))]);
  await expect(page.locator('#import-submit')).toBeEnabled();await page.locator('#import-submit').click();
  await expect(page).toHaveURL(/\/scene\/s3\?case=firstbreak-stalta/);await page.reload();
  await expect(page.locator('h1')).toContainText('初至波');
  await page.goto('/scene/s3?case=firstbreak-stalta&tab=demo');await expect(page.locator('#case-demo-root iframe')).toBeVisible();
  await page.goto('/admin/cases');await page.getByPlaceholder('管理员账号').fill('admin');await page.getByPlaceholder('管理员密码').fill('admin123');await page.getByRole('button',{name:'登录',exact:true}).click();
  await expect(page.locator('h1')).toHaveText('案例管理');await page.getByPlaceholder('搜索管理条目').fill('firstbreak-stalta');
  await page.getByRole('button',{name:'编辑',exact:true}).click();await page.getByPlaceholder('案例名称',{exact:true}).fill('初至波导入管理测试');await page.getByRole('button',{name:'保存修改',exact:true}).click();
  await expect(page.getByText('初至波导入管理测试',{exact:true})).toBeVisible();
  await page.reload();await expect(page.getByText('初至波导入管理测试',{exact:true})).toBeVisible();
  await page.goto('/scene/d1?tab=demo');await expect(page.frameLocator('#case-demo-root iframe').locator('#heatmap rect').first()).toBeAttached();const download=page.waitForEvent('download');await page.frameLocator('#case-demo-root iframe').getByRole('button',{name:'导出合成样本 CSV'}).click();expect((await download).suggestedFilename()).toContain('.csv');
});
test('production fallback, missing assets, and responsive layout',async({page,request})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  expect((await request.get('/scene/d3?tab=demo')).status()).toBe(200);
  expect((await request.get('/assets/not-present.js')).status()).toBe(404);
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
    await page.setViewportSize(viewport);await page.goto('/');await expect(page.locator('h1')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await page.screenshot({path:`output/playwright/home-${viewport.width}.png`,fullPage:true});
    await page.goto('/scene/d1?tab=demo');await expect(page.frameLocator('#case-demo-root iframe').locator('h1')).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(3);
    await expect(page.getByRole('tab',{name:'案例演示'})).toBeVisible();
    await expect.poll(async()=>Math.abs(await page.locator('#case-demo-root iframe').evaluate(frame=>frame.clientHeight)-await page.frameLocator('#case-demo-root iframe').locator('body').evaluate(body=>body.scrollHeight))).toBeLessThan(40);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await page.locator('#case-demo-root iframe').evaluate(frame=>window.scrollTo(0,frame.getBoundingClientRect().top+window.scrollY-80));
    await page.screenshot({path:`output/playwright/rop-${viewport.width}.png`});
  }
});
