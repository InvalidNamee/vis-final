import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {existsSync,statSync,readdirSync} from 'node:fs';
import {resolve,sep} from 'node:path';
let config:any;
const caseGroups=readdirSync(resolve('plugins'),{withFileTypes:true}).filter(e=>e.isDirectory()&&!e.name.startsWith('_')).flatMap(e=>[
  {name:`cases-${e.name}`,test:new RegExp(`/plugins/${e.name}/.*case\\.json(?:\\?|$)`),priority:50},
  {name:`demos-${e.name}`,test:new RegExp(`/plugins/${e.name}/.*\\?raw`),priority:40}
]);
function guard(root:string,allAssets:boolean){return (req:any,res:any,next:any)=>{
  let name;try{name=decodeURIComponent((req.url||'/').split('?')[0]);}catch{res.statusCode=400;res.end('Invalid URL');return;}
  const base=config.base==='/'?'':config.base.replace(/\/$/,'');
  if(base&&name.startsWith(base+'/'))name=name.slice(base.length);
  if(!name.startsWith('/assets/')&&!(allAssets&&/\.(?:[cm]?js|css|json|png|jpe?g|svg|gif|ico|woff2?|map)$/i.test(name)))return next();
  const target=resolve(root,'.'+name);
  if(!target.startsWith(resolve(root)+sep)||!existsSync(target)||!statSync(target).isFile()){res.statusCode=404;res.setHeader('Content-Type','text/plain');res.end('Asset not found');return;}
  next();
};}
export default defineConfig({
  plugins:[vue(),{name:'atlas-static-404',configResolved(c){config=c;},configureServer(server){server.middlewares.use(guard(server.config.root,false));},configurePreviewServer(server){server.middlewares.use(guard(resolve(server.config.root,server.config.build.outDir),true));}}],base:process.env.ATLAS_BASE || '/',
  server:{host:'0.0.0.0',port:5173,watch:{ignored:['**/.dist/**','**/dist/**','**/output/**']}},
  build:{outDir:'dist',emptyOutDir:true,rolldownOptions:{output:{codeSplitting:{groups:[...caseGroups,{name:'framework',test:/node_modules\/(?:vue|@vue|pinia|vue-router)\//,priority:30},{name:'naive-data',test:/node_modules\/naive-ui\/es\/(?:data-table|upload|select|tree|virtual-list)\//,priority:20},{name:'naive-ui',test:/node_modules\/(?:naive-ui|vueuc|vooks|css-render)\//,priority:10}]}}}},
  test:{environment:'happy-dom',include:['tests/unit/**/*.test.ts']},
});
