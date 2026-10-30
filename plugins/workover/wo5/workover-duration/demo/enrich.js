/* PluginViz contract adapter: current model outputs only; no network or model reruns. */
(function(){
  'use strict';
  PluginViz.mount({
    get:()=> ({result:window.__DEMO_RESULT__,state:window.__DEMO_STATE__}),
    replaceTitles:["相似工序条件分位数计算结果"],
    build:({result,state})=>{
      if(!result||!state)return [];

  const near=(result.audit?.neighbors||[]).filter(d=>[d.prep,d.trip,d.treat,d.test,d.total].every(Number.isFinite));
  if(!near.length)return [];
  const stages=[['prep','准备'],['trip','起下管'],['treat','故障处理'],['test','试验']];
  return [
    {type:'stacked',title:'相似井次工序耗时构成',subtitle:`展示当前距离最近的${Math.min(18,near.length)}/${near.length}个邻近参考井次，每条为同一井次的四工序实际合成时长，相加等于该井次总时长。`,unit:'h',groups:near.slice(0,18).map(d=>({label:`参考井次 ${d.id}`,segments:stages.map(([key,label])=>({label,value:d[key]}))}))},
    {type:'box',title:'相似井次工序耗时分布',subtitle:'四工序分别统计同一邻近集合；分工序中位数之和不等于总工期中位数。',unit:'h',groups:stages.map(([key,label])=>({label,values:near.map(d=>d[key])}))},
    {type:'histogram',title:'相似井次总工期分布',subtitle:'仅使用当前邻近参考井次，当前查询与60个评价井次均未加入参考样本。',unit:'h',bins:8,values:near.map(d=>d.total)}
  ];

    }
  });
})();
