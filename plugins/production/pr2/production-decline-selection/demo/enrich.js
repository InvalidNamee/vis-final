/* PluginViz contract adapter: current model outputs only; no network or model reruns. */
(function(){
  'use strict';
  PluginViz.mount({
    get:()=> ({result:window.__caseResult,state:window.__caseState}),
    build:({result,state})=>{
      if(!result||!state)return [];

  const rows=(result.rows||[]).filter(d=>Number.isFinite(d.q)&&Number.isFinite(d.prediction));
  const splits=[['train','训练窗'],['validation','验证窗'],['test','测试窗']];
  const test=rows.filter(d=>d.split==='test');
  const validation=rows.filter(d=>d.split==='validation');
  const future=rows.filter(d=>d.split==='forecast');
  if(!test.length)return [];
  const sorted=validation.map(d=>Math.abs(d.q-d.prediction)).sort((a,b)=>a-b);
  const quant=p=>{const i=(sorted.length-1)*p,a=Math.floor(i),b=Math.ceil(i);return sorted[a]+(sorted[b]-sorted[a])*(i-a)};
  const panels=[
    {type:'box',title:'分时段预测残差分布',subtitle:'残差为观测−预测；训练、验证与测试按时间切分，未来外推不参与误差统计。',unit:'m³/d',groups:splits.map(([key,label])=>({label,values:rows.filter(d=>d.split===key).map(d=>d.q-d.prediction)}))},
    {type:'dumbbell',title:'测试窗产量预测误差对照',subtitle:'同一40天测试窗的平均绝对误差，基线为训练窗末7日均值。',unit:'m³/d',beforeLabel:'常数基线',afterLabel:'递减模型',items:[{label:'测试窗 MAE',before:result.metrics[1].value,after:result.metrics[0].value}]}
  ];
  if(sorted.length&&future.length)panels.push({type:'band',title:'产量外推与经验残差带',subtitle:'半宽采用20天验证窗绝对残差的P80，围绕外推值对称展开；未按预测期校准，不是置信区间。',xLabel:'相对天数',yLabel:'油率 / m³/d',points:future.map(d=>({x:d.t,mean:d.prediction,low:d.prediction-quant(.8),high:d.prediction+quant(.8)}))});
  return panels;

    }
  });
})();
