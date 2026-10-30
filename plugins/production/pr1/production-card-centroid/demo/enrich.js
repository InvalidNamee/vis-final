/* PluginViz contract adapter: current model outputs only; no network or model reruns. */
(function(){
  'use strict';
  PluginViz.mount({
    get:()=> ({result:window.__caseResult,state:window.__caseState}),
    build:({result,state})=>{
      if(!result||!state)return [];

  const labels=['充满较好','供液不足','漏失形态'];
  const rows=(result.rows||[]).filter(d=>Number.isFinite(d.area)&&labels[d.type]);
  if(!rows.length||!result.audit?.confusion)return [];
  return [
    {type:'matrix',title:'示功图工况分类矩阵',subtitle:`6口留出井的${rows.length}张卡；行是真实工况，列是最近质心预测。`,xLabels:labels,yLabels:labels,values:result.audit.confusion,unit:'张'},
    {type:'box',title:'各工况闭合面积分布',subtitle:'采用留出井卡片的真实工况分组，面积已按冲程×35 kN归一化。',groups:labels.map((label,i)=>({label,values:rows.filter(d=>d.type===i).map(d=>d.area)}))}
  ];

    }
  });
})();
