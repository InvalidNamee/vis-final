/* PluginViz contract adapter: current model outputs only; no network or model reruns. */
(function(){
  'use strict';
  PluginViz.mount({
    get:()=> ({result:window.__caseResult,state:window.__caseState}),
    replaceTitles:["分层配注量"],
    build:({result,state})=>{
      if(!result||!state)return [];

  const rows=(result.rows||[]).filter(d=>[d.allocation,d.baseline,d.cap,d.benefit,d.baselineBenefit].every(Number.isFinite));
  if(!rows.length)return [];
  return [
    {type:'bar',title:'分层配注量与吸水上限',subtitle:'每层分别列出等配、优化配注和吸水上限；等配为对照值，可能超过该层上限。',unit:'m³/d',items:rows.flatMap(d=>[{label:`层${d.layer} · 等配`,group:`层${d.layer}`,value:d.baseline},{label:`层${d.layer} · 优化`,group:`层${d.layer}`,value:d.allocation,selected:true},{label:`层${d.layer} · 上限`,group:`层${d.layer}`,value:d.cap}])},
    {type:'dumbbell',title:'分层稳油代理收益变化',subtitle:'同一层的等配与优化响应；数值来自模型的无量纲净稳油代理。',unit:'代理值',beforeLabel:'等配',afterLabel:'优化配注',items:rows.map(d=>({label:`层${d.layer}`,before:d.baselineBenefit,after:d.benefit}))}
  ];

    }
  });
})();
