/* PluginViz contract adapter: current model outputs only; no network or model reruns. */
(function(){
  'use strict';
  PluginViz.mount({
    get:()=> ({result:window.__DEMO_RESULT__,state:window.__DEMO_STATE__}),
    build:({result,state})=>{
      if(!result||!state)return [];

  const points=(result.charts?.[0]?.series?.[0]?.points||[]).filter(d=>d.every(Number.isFinite));
  const samples=(result.samples||[]).filter(d=>Number.isFinite(d.i)&&Number.isFinite(d.value));
  if(!points.length||!Number.isFinite(state.limit))return [];
  const scores=new Map(points),monitor=samples.filter(d=>scores.has(d.i));
  const values=[[0,0],[0,0]];monitor.forEach(d=>values[Number(d.truth)][Number(scores.get(d.i)>state.limit)]++);
  const episodes=(label,predicate)=>{const items=[];let start=null,end=null;for(const d of samples){if(predicate(d)){if(start===null)start=d.i;end=d.i+1}else if(start!==null){items.push({label,start,end,group:label});start=null}}if(start!==null)items.push({label,start,end,group:label});return items};
  return [
    {type:'gantt',title:'修井负荷漂移与报警泳道',subtitle:'每点占1个采样区间；0–39为校准，40–74为正常监测，75–119为合成漂移。报警取原CUSUM分数超过当前控制限的连续区间。',unit:'采样点',items:[...episodes('基线校准',d=>d.i<40),...episodes('正常监测',d=>scores.has(d.i)&&!d.truth),...episodes('合成漂移',d=>d.truth),...episodes('CUSUM报警',d=>scores.has(d.i)&&scores.get(d.i)>state.limit)]},
    {type:'matrix',title:'修井漂移监测判定矩阵',subtitle:`只统计40–119的${monitor.length}个监测点；行是真实工况，列是CUSUM报警结果。`,unit:'点',xLabels:['未报警','报警'],yLabels:['正常监测','合成漂移'],values},
    {type:'box',title:'正常与漂移扭矩分布',subtitle:'排除基线校准点，比较当前合成正常窗与漂移窗的原始扭矩。',unit:'kN·m',groups:[{label:'正常监测',values:monitor.filter(d=>!d.truth).map(d=>d.value)},{label:'合成漂移',values:monitor.filter(d=>d.truth).map(d=>d.value)}]}
  ];

    }
  });
})();
