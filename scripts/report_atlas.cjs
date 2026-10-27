// Documentation inventory from authoritative source packages; no distributions.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),context={window:{},localStorage:{getItem:()=>null}};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'src/content/atlas.js'),'utf8').replace(/\nexport \{\};\s*$/,''),context);
const atlas=context.window.ATLAS,drilling={d1:'多项式岭回归与约束网格搜索',d2:'正常基线与多通道EWMA',d3:'响应辨识与有限动作滚动搜索',d4:'局部退化回归与阈值寿命外推',d5:'双响应回归与配方约束搜索'};
let out='# 全场景案例目录\n\n本目录由 `node scripts/report_atlas.cjs` 从源包读取。主站保留原有13个模块和61个场景标题，每个场景对应一个内置教学包。原测井脚本已由新案例覆盖，旧脚本仅保存在测试夹具；教师初至波示例保留为导入兼容样例，不作为第二个内置案例。\n\n全部演示为本地计算，数据、阈值、物性和响应系数按各包说明使用教学合成。这里列出实际轻量算法，不能将原场景设想中的深度网络或强化学习方向视为已实现。\n';
let count=0;
for(const stage of atlas.stages){
  out+=`\n## ${stage.name}\n\n| 场景 | 实际方法 | 源包与依据 |\n| --- | --- | --- |\n`;
  for(const scene of stage.scenes){
    const dir=path.join(root,'plugins',stage.id,scene.id),cases=fs.readdirSync(dir).filter(id=>fs.existsSync(path.join(dir,id,'case.json'))).filter(id=>{const p=path.join(dir,id,'plugin.json');return !fs.existsSync(p)||JSON.parse(fs.readFileSync(p,'utf8')).builtin!==false;});
    if(cases.length!==1)throw Error(scene.id+': expected exactly one builtin');
    const folder=path.join(dir,cases[0]),m=JSON.parse(fs.readFileSync(path.join(folder,'case.json'),'utf8')),file=path.join(folder,'demo/model.js');
    const cfg=fs.existsSync(file)?require(file).config||{}:{};
    const method=drilling[scene.id]||cfg.method||cfg.algorithm||m.tabs.background.judge?.find(j=>/方法/.test(j.label))?.value;
    if(!method)throw Error('Missing method description '+scene.id);
    const rel=path.relative(root,folder).split(path.sep).join('/');
    out+=`| ${scene.id} ${scene.name} | ${method} | [案例](../${rel}/case.json) · [研究依据](../${rel}/研究依据.md) |\n`;count++;
  }
}
out+='\n## 验证入口\n\n- `npm test`：原接口与存档、标题、全部源包覆盖、算法边界、独立指标复算及服务单元测试。\n- `npm run build`：分类目录、标题、TypeScript及生产构建；不创建ZIP。\n- `npm run test:e2e`：全部61包的三部分、桌面与窄屏、原入口实际导入、刷新恢复、独立离线、控件重算及CSV下载。\n- `npm run test:base`：子路径History部署、深链接刷新、旧链接及资源404。\n\n网页打开不等于现场有效；计算和浏览器验收的范围由对应测试脚本确定，专业资料与合成假设详见各包研究依据。\n';
fs.writeFileSync(path.join(root,'docs/全场景案例目录.md'),out);console.log(`Documented ${count} source cases`);
