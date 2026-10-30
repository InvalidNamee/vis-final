/* PluginViz contract adapter: current model outputs only; no network or model reruns. */
(function(){
  'use strict';
  PluginViz.mount({
    get:()=> ({result:window.__caseResult,state:window.__caseState}),
    build:({result,state})=>{
      if(!result||!state)return [];

  const rows=(result.rows||[]).filter(d=>Number.isFinite(d.t)&&Number.isFinite(d.score));
  if(!rows.length)return [];
  const monitor=rows.filter(d=>d.t>=60),values=[[0,0],[0,0]];
  monitor.forEach(d=>values[Number(d.label)][Number(d.alarm)]++);
  const episodes=(label,predicate)=>{const list=[];let start=null,end=null;for(const d of rows){if(predicate(d)){if(start===null)start=d.t;end=d.t+1}else if(start!==null){list.push({label,start,end,group:label});start=null}}if(start!==null)list.push({label,start,end,group:label});return list};
  return [
    {type:'gantt',title:'电泵工况与报警事件泳道',subtitle:'各采样点代表1 min区间；真值漂移起点只用于评价，报警取当前持续性判断。',unit:'min',items:[...episodes('基线校准',d=>d.t<60),...episodes('正常监测',d=>d.t>=60&&!d.label),...episodes('合成漂移',d=>d.label),...episodes('持续报警',d=>d.alarm)]},
    {type:'matrix',title:'电泵监测状态判定矩阵',subtitle:`仅统计60–179 min的${monitor.length}个监测点；行是真实状态，列是持续报警结果。`,unit:'点',xLabels:['未报警','持续报警'],yLabels:['正常监测','合成漂移'],values},
    {type:'box',title:'正常与漂移异常分数分布',subtitle:'排除前60 min校准窗，使用当前EWMA最大绝对标准分。',unit:'标准分',groups:[{label:'正常监测',values:monitor.filter(d=>!d.label).map(d=>d.score)},{label:'合成漂移',values:monitor.filter(d=>d.label).map(d=>d.score)}]}
  ];

    }
  });
})();
