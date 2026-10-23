const {spawn,spawnSync}=require('node:child_process');
const path=require('node:path');
const {chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'..'),vite=path.join(root,'node_modules/vite/bin/vite.js');
const env={...process.env,ATLAS_BASE:'/atlas/'};
const build=spawnSync(process.execPath,[vite,'build','--outDir','.dist/base-build'],{cwd:root,env,encoding:'utf8'});
if(build.status!==0){console.error(build.stdout,build.stderr);process.exit(1);}
const server=spawn(process.execPath,[vite,'preview','--outDir','.dist/base-build','--host','127.0.0.1','--port','5177','--strictPort'],{cwd:root,env,stdio:'pipe',windowsHide:true});
let browser;
(async()=>{
  const origin='http://127.0.0.1:5177';
  let ready=false;
  for(let i=0;i<100;i++){
    if(server.exitCode!==null)throw Error('Preview server exited');
    try{ready=(await fetch(origin+'/atlas/')).ok;}catch{}
    if(ready)break;
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  if(!ready)throw Error('Preview server unavailable');
  browser=await chromium.launch({channel:'msedge'});
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/atlas/scene/d1?tab=demo');
  await page.frameLocator('#case-demo-root iframe').locator('#heatmap rect').first().waitFor({state:'attached'});
  await page.reload();await page.locator('h1').filter({hasText:'钻速'}).waitFor();
  await page.goto(origin+'/atlas/#/stage/drilling');
  await page.waitForURL('**/atlas/stage/drilling');
  if(await page.locator('.atlas-scene-card').count()!==5)throw Error('Incorrect base-path scene list');
  if((await fetch(origin+'/atlas/assets/missing.js')).status!==404)throw Error('Missing asset must return 404');
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS: /atlas/ History deep link, refresh, legacy hash, demo resources, missing asset 404');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();server.kill();});
