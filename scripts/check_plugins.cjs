const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const ctx={window:{},localStorage:{getItem:()=>null}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(ROOT,'src/content/atlas.js'),'utf8').replace(/\nexport \{\};\s*$/,''),ctx);
function folders(dir){return fs.readdirSync(dir,{withFileTypes:true}).filter(e=>e.isDirectory()&&e.name!=='_templates').flatMap(e=>{const p=path.join(dir,e.name);return [p,...folders(p)];});}
const ids=new Set();let count=0;
for(const folder of folders(path.join(ROOT,'plugins'))){
 const manifest=['case.json','plugin.json'].map(f=>path.join(folder,f)).find(f=>fs.existsSync(f));if(!manifest)continue;
 const m=JSON.parse(fs.readFileSync(manifest,'utf8')),[stage,scene,id]=path.relative(path.join(ROOT,'plugins'),folder).split(path.sep);
 if(ids.has(m.id))throw Error(`Duplicate plugin ID: ${m.id}`);ids.add(m.id);
 if(id!==m.id||scene!==m.sceneId||ctx.window.ATLAS.index.byScene[scene]?.stageId!==stage)throw Error(`Invalid classification: ${folder}`);
 if(path.basename(manifest)==='case.json'&&m.tabs?.demo?.html&&!fs.existsSync(path.join(folder,m.tabs.demo.html)))throw Error(`Missing demo HTML: ${folder}`);
 count++;
}
console.log(`PASS: ${count} classified plugins, unique IDs and demo entries`);
