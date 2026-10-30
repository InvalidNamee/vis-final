/* PluginViz contract adapter: current model outputs only; no network or model reruns. */
(function(){
  'use strict';
  PluginViz.mount({
    get:()=> ({result:window.__DEMO_RESULT__,state:window.__DEMO_STATE__}),
    build:({result,state})=>{
      if(!result||!state)return [];

  const rows=(result.samples||[]).filter(d=>Number.isFinite(d.depth)&&Number.isFinite(d.score)&&Array.isArray(d.arms)&&d.arms.every(Number.isFinite));
  if(!rows.length)return [];
  const values=[[0,0],[0,0]];rows.forEach(d=>values[Number(d.truth)][Number(d.flag)]++);
  return [
    {type:'matrix',title:'套损层段判定矩阵',subtitle:`当前${rows.length}个合成深度层；行是真实缩径标签，列是残差阈值判定。`,unit:'层',xLabels:['未检出','检出'],yLabels:['背景层','缩径层'],values},
    {type:'profile',title:'套管半径与残差深度联排',subtitle:'同一深度轴向下排列；最小臂半径取当层12臂最小值，角向残差来自原模型。',depth:rows.map(d=>d.depth),tracks:[{label:'最小臂半径',unit:'mm',values:rows.map(d=>Math.min(...d.arms))},{label:'角向残差',unit:'mm',values:rows.map(d=>d.score)},{label:'检出状态',unit:'0/1',values:rows.map(d=>Number(d.flag))}]},
    {type:'box',title:'背景与缩径残差分布',subtitle:'按合成真值分组；当前阈值只改变检出结果，不改变半径采样。',unit:'mm',groups:[{label:'背景层',values:rows.filter(d=>!d.truth).map(d=>d.score)},{label:'缩径层',values:rows.filter(d=>d.truth).map(d=>d.score)}]}
  ];

    }
  });
})();
