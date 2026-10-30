/* PluginViz contract adapter: current model outputs only; no network or model reruns. */
(function(){
  'use strict';
  PluginViz.mount({
    get:()=> ({result:window.__DEMO_RESULT__,state:window.__DEMO_STATE__}),
    replaceTitles:["尺寸约束与工具排序计算结果"],
    build:({result,state})=>{
      if(!result||!state)return [];

  const rows=(result.samples||[]).filter(d=>[d.score,d.clear].every(Number.isFinite));
  if(!rows.length)return [];
  return [
    {type:'bar',title:'打捞工具适配分排序',subtitle:'先按尺寸硬约束筛选，再比较适配分；不可行工具按模型输出记0分。',unit:'分',items:rows.map((d,i)=>({label:`${d.name} · ${d.ok?'尺寸可行':d.reason}`,value:d.score,selected:i===0&&d.ok}))},
    {type:'bar',title:'打捞工具通径净空对照',subtitle:'净空=最小通径−工具外径−6 mm；负值表示通径不满足，正值仍须满足接合尺寸。',unit:'mm',items:rows.map(d=>({label:d.name,value:d.clear,selected:d.ok}))},
    {type:'parallel',title:'打捞工具净空与适配分',subtitle:'两轴分别归一化；可行标记同时考虑通径与接合尺寸，显示全部候选。',axes:[{key:'clear',label:'净空',unit:'mm'},{key:'score',label:'适配分',unit:'分'}],items:rows.map((d,i)=>({label:`${d.name} · ${d.reason}`,clear:d.clear,score:d.score,feasible:d.ok,selected:i===0&&d.ok}))}
  ];

    }
  });
})();
