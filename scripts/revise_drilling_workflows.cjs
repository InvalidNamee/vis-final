// Explicit editorial migration for the five source-authored drilling packages.
// Safe to repeat: the business flow figure is replaced, never appended twice.
const fs=require('node:fs'),path=require('node:path');
const {applyWorkflow}=require('./workflow_content.cjs');
for(const scene of fs.readdirSync(path.join(__dirname,'../plugins/drilling'))) {
  const base=path.join(__dirname,'../plugins/drilling',scene);
  for(const id of fs.readdirSync(base)) {
    const file=path.join(base,id,'case.json');
    if(!fs.existsSync(file))continue;
    const c=JSON.parse(fs.readFileSync(file,'utf8'));
    c.tabs.workflow.metrics.html=c.tabs.workflow.metrics.html.replace(/<figure class="figure"><div style="overflow-x:auto" tabindex="0" role="region" aria-label="案例业务流程，窄屏可横向滚动">[\s\S]*?<\/figure>/g,'').replace(/<p><strong>成果交付：<\/strong>[\s\S]*?<\/p>/g,'');
    applyWorkflow(c,'drilling');
    fs.writeFileSync(file,JSON.stringify(c,null,2)+'\n');
  }
}
console.log('Updated five drilling source workflows; no ZIP generated.');
