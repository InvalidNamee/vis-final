import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve('plugins');
function collect(dir:string):string[]{return fs.readdirSync(dir,{withFileTypes:true}).filter(e=>e.isDirectory()&&!e.name.startsWith('_')).flatMap(e=>{const p=path.join(dir,e.name);return [p,...collect(p)];});}
const packages=collect(root).filter(p=>fs.existsSync(path.join(p,'case.json'))).map(folder=>({folder,meta:JSON.parse(fs.readFileSync(path.join(folder,'case.json'),'utf8')),descriptor:fs.existsSync(path.join(folder,'plugin.json'))?JSON.parse(fs.readFileSync(path.join(folder,'plugin.json'),'utf8')):{}})).filter(p=>p.descriptor.builtin!==false);
const titles=JSON.parse(fs.readFileSync('tests/fixtures/original-titles.json','utf8'));
const stages=[...new Set(packages.map(p=>path.relative(root,p.folder).split(path.sep)[0]))];

test('all original scenes have exactly one replacement builtin',async({page})=>{
  expect(packages).toHaveLength(Object.keys(titles.scenes).length);
  expect(new Set(packages.map(p=>p.meta.sceneId)).size).toBe(61);
  await page.goto('/cases');await expect(page.locator('.atlas-library-card')).toHaveCount(12);
  expect(await page.evaluate(()=>window.Cases.stats().coveredScenes)).toBe(61);
  expect(await page.evaluate(()=>window.Cases.stats().withDemo)).toBe(61);
  const errors=await page.evaluate(()=>Object.entries(window.Cases.validateAll()).flatMap(([id,checks]:any)=>checks.filter((c:any)=>c.level==='error').map((c:any)=>id+': '+c.label)));
  expect(errors).toEqual([]);
});

for(const stage of stages){
 const group=packages.filter(p=>path.relative(root,p.folder).split(path.sep)[0]===stage);
 test(`${stage}: three sections, calculations and narrow layouts`,async({page})=>{
   test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
   for(const width of [1440,390]){
     await page.setViewportSize({width,height:1000});
     for(const {meta}of group){
       for(const tab of ['bg','flow','demo']){
         await page.goto(`/scene/${meta.sceneId}?tab=${tab}`);
         await expect(page.locator('main h1')).toHaveText(titles.scenes[meta.sceneId]);
         if(tab==='bg')await expect(page.locator('.atlas-content-section').first()).toBeVisible();
         if(tab==='flow')await expect(page.locator('.pipeline .pstep').first()).toBeVisible();
         if(tab!=='demo')expect(await page.locator('.atlas-content-html svg').count()).toBeGreaterThan(0);
         else{
           const frame=page.frameLocator('#case-demo-root iframe');
           await expect(frame.locator('h1')).toBeVisible();
           await expect(frame.locator('svg,canvas').first()).toBeVisible();
           expect(await frame.locator('input,select,textarea').count()).toBeGreaterThan(0);
           await expect(frame.locator('body')).not.toContainText(/\bNaN\b|\bundefined\b|\bInfinity\b/);
           expect(await frame.locator('html').evaluate(e=>e.scrollWidth<=e.clientWidth+1),`${meta.id}: iframe overflow at ${width}`).toBeTruthy();
         }
         expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${meta.id}/${tab}: outer overflow at ${width}`).toBeTruthy();
       }
     }
   }
   expect(errors).toEqual([]);
 });

 test(`${stage}: source packages import through original dialog`,async({page})=>{
   test.setTimeout(120000);
   for(const {folder,meta}of group){
     await page.goto('/cases');await page.getByRole('button',{name:'＋ 添加案例',exact:true}).first().click();
     await page.locator('input[type=file][webkitdirectory]').setInputFiles(folder);
     await expect(page.locator('#import-submit')).toBeEnabled();
     await page.locator('#import-submit').click();
     await expect(page).toHaveURL(new RegExp(`/scene/${meta.sceneId}\\?case=${meta.id}-local-1`));
     await page.reload();await expect(page.locator('main h1')).toHaveText(titles.scenes[meta.sceneId]);
     expect(await page.evaluate(()=>window.Cases.get(new URLSearchParams(location.search).get('case')!)?.imported),`${meta.id}: imported record must survive reload`).toBe(true);
     await page.getByRole('tab',{name:meta.tabs.demo.label||'案例演示',exact:true}).click();
     await expect(page.frameLocator('#case-demo-root iframe').locator('h1')).toBeVisible();
   }
 });

 test(`${stage}: standalone packages work without HTTP`,async({page})=>{
   test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route(/^https?:/,route=>route.abort());
   for(const {folder,meta}of group){
     await page.goto(pathToFileURL(path.join(folder,meta.tabs.demo.html)).href);
     await expect(page.locator('h1')).toBeVisible();await expect(page.locator('svg,canvas').first()).toBeVisible();
     await expect(page.locator('body')).not.toContainText(/\bNaN\b|\bundefined\b|\bInfinity\b/);
   }
   expect(errors).toEqual([]);
 });

 test(`${stage}: rendered parameters and CSV exports`,async({page})=>{
   test.setTimeout(120000);
   for(const {meta}of group){
     await page.goto(`/scene/${meta.sceneId}?tab=demo`);
     const frame=page.frameLocator('#case-demo-root iframe');
     await expect(frame.locator('h1')).toBeVisible();
     const digest=()=>frame.locator('body').evaluate(body=>{
       const nodes=body.querySelectorAll('#metrics,#plots,#charts,#recommendation,#heatmap,#response,#scatter');
       return [...nodes].map(e=>e.innerHTML).join('')+[...body.querySelectorAll('canvas')].map(e=>e.toDataURL()).join('');
     });
     const before=await digest();
     const range=frame.locator('input[type=range]').first();
     if(await range.count())await range.evaluate((e:HTMLInputElement)=>{e.value=e.value===e.max?e.min:e.max;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});
     else await frame.locator('textarea').first().fill('井号：复核井；井深：1000 m');
     await expect.poll(digest,{message:`${meta.id}: controls must change calculated results`}).not.toBe(before);
     const exported=page.waitForEvent('download',{timeout:10000});
     await frame.getByRole('button',{name:/CSV/i}).first().click();
     const download=await exported;expect(download.suggestedFilename()).toMatch(/\.csv$/i);
     const file=await download.path();expect(file).toBeTruthy();
     const text=fs.readFileSync(file!,'utf8');expect(text.length,meta.id).toBeGreaterThan(40);
     expect(text.split(/\r?\n/).length,meta.id).toBeGreaterThan(2);
     expect(text,meta.id).not.toMatch(/\bNaN\b|\bundefined\b|\bInfinity\b/);
   }
 });
}
