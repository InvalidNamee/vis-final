/* PluginViz contract adapter: current model outputs only; no network or model reruns. */
(function(){
  'use strict';
  PluginViz.mount({
    get:()=> ({result:window.__DEMO_RESULT__,state:window.__DEMO_STATE__}),
    replaceTitles:["加权案例检索计算结果"],
    build:({result,state})=>{
      if(!result||!state)return [];

  const ranked=(result.audit?.ranked||[]).filter(d=>[d.d,d.depth,d.water].every(Number.isFinite));
  if(!ranked.length)return [];
  const faultNames=['落物','出水','砂卡','套损'];
  return [
    {type:'bar',title:'修井案例相似分排序',subtitle:'展示当前井况检索的前8条；相似分为100/(1+加权距离)，标签对应实际案例编号与故障。',unit:'分',items:ranked.slice(0,8).map((d,i)=>({label:`${d.id} · ${faultNames[d.fault]}`,value:100/(1+d.d),selected:i===0}))},
    {type:'parallel',title:'候选井况与相似度对照',subtitle:'各轴按当前候选范围归一化；距离同时包含故障失配惩罚，选择曲线可查看具体井况。',axes:[{key:'depth',label:'深度',unit:'m'},{key:'water',label:'含水率',unit:'%'},{key:'score',label:'相似分',unit:'分'}],items:ranked.map((d,i)=>({label:`${d.id} · ${faultNames[d.fault]} · ${d.plan}`,depth:d.depth,water:d.water,score:100/(1+d.d),selected:i===0}))},
    {type:'box',title:'案例库各故障作业深度分布',subtitle:'按24条原有历史案例的故障标签分组，展示当前检索所依赖的参考范围。',unit:'m',groups:faultNames.map((label,i)=>({label,values:ranked.filter(d=>d.fault===i).map(d=>d.depth)}))}
  ];

    }
  });
})();
