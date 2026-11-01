/* Refresh standalone drawing resources. This command never creates distribution archives. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),check=process.argv.includes('--check');let cases=0;
// Keep standalone fallback tokens aligned with the framework; framework values win at runtime.
const themePath=path.join(__dirname,'plugin-theme.css'),theme=fs.readFileSync(themePath,'utf8');
const tokenSource=fs.readFileSync(path.join(root,'../assets/core/tokens.css'),'utf8');
const tokens=tokenSource.match(/:root\{([\s\S]*?)\n\}/)[1].replace(/\/\*[\s\S]*?\*\//g,'').split('\n').filter(line=>line.trim()).map(line=>'  '+line.trim()).join('\n');
const refreshed=theme.replace(/(:root \{\n)[\s\S]*?(\n \})/,(_,open,close)=>open+tokens+close);
if(check){if(theme!==refreshed)throw Error('Standalone theme tokens differ from framework')}else fs.writeFileSync(themePath,refreshed);

function walk(folder){for(const item of fs.readdirSync(folder,{withFileTypes:true})){if(item.name.startsWith('_'))continue;const current=path.join(folder,item.name);if(item.isDirectory())walk(current);else if(item.name==='case.json'){
 const descriptor=path.join(folder,'plugin.json');if(fs.existsSync(descriptor)&&JSON.parse(fs.readFileSync(descriptor)).builtin===false)continue;
 for(const file of ['plugin-viz.js','plugin-viz.css','plugin-theme.css']){const source=fs.readFileSync(path.join(__dirname,file)),target=path.join(folder,'demo',file);if(check){if(!fs.existsSync(target)||!source.equals(fs.readFileSync(target)))throw Error('Visualization copy differs: '+target)}else fs.writeFileSync(target,source)}cases++;
}}}
walk(root);console.log((check?'Checked ':'Synced ')+cases+' standalone visualization libraries; no ZIP generated');
