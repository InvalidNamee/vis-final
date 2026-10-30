/* Refresh standalone drawing resources. This command never creates distribution archives. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),check=process.argv.includes('--check');let cases=0;
function walk(folder){for(const item of fs.readdirSync(folder,{withFileTypes:true})){if(item.name.startsWith('_'))continue;const current=path.join(folder,item.name);if(item.isDirectory())walk(current);else if(item.name==='case.json'){
 const descriptor=path.join(folder,'plugin.json');if(fs.existsSync(descriptor)&&JSON.parse(fs.readFileSync(descriptor)).builtin===false)continue;
 for(const file of ['plugin-viz.js','plugin-viz.css']){const source=fs.readFileSync(path.join(__dirname,file)),target=path.join(folder,'demo',file);if(check){if(!fs.existsSync(target)||!source.equals(fs.readFileSync(target)))throw Error('Visualization copy differs: '+target)}else fs.writeFileSync(target,source)}cases++;
}}}
walk(root);console.log((check?'Checked ':'Synced ')+cases+' standalone visualization libraries; no ZIP generated');
