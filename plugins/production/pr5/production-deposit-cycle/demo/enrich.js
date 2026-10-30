/* PluginViz contract adapter: current model outputs only; no network or model reruns. */
(function(){
  'use strict';
  PluginViz.mount({
    get:()=> ({result:window.__caseResult,state:window.__caseState}),
    build:({result,state})=>{
      if(!result||!state)return [];

  const rows=(result.rows||[]).filter(d=>[d.day,d.loss,d.cost].every(Number.isFinite));
  const audit=result.audit||{},current=Math.round(state.cycle),best=audit.bestCycle;
  if(!rows.length||![current,best,state.cleanCost,state.price,audit.currentCost,audit.bestCost].every(Number.isFinite)||current<=0||best<=0)return [];
  const horizon=rows.at(-1).day;
  const periods=(label,cycle)=>Array.from({length:Math.ceil(horizon/cycle)},(_,i)=>({label,group:label,start:i*cycle,end:Math.min((i+1)*cycle,horizon)}));
  const costs=(label,cycle,total)=>{const cleaning=Math.floor(horizon/cycle)*state.cleanCost;return {label,segments:[{label:'损失油量折价',value:total-cleaning},{label:'清洗费用',value:cleaning}]}};
  const candidates=(result.charts?.[0]?.series?.[0]?.points||[]).filter(d=>d.every(Number.isFinite));
  return [
    {type:'gantt',title:'清洗周期排程对照',subtitle:'条段为相邻清洗日期之间的周期区间，右边界为清洗日；最后一段在180天观察期末截断，条宽不表示清洗施工耗时。',unit:'天',items:[...periods(`当前周期 · ${current}天`,current),...periods(`最优周期 · ${best}天`,best)]},
    {type:'stacked',title:'清洗周期总成本构成',subtitle:'180天总成本拆为损失油量×教学油价与清洗次数×单次费用，清洗次数按完整周期统计。',unit:'教学元',groups:[costs('当前周期',current,audit.currentCost),costs('最优周期',best,audit.bestCost)]},
    {type:'bar',title:'低成本清洗周期排序',subtitle:'从7–60天的54个候选中按总成本取前10项；高亮为本次最小成本周期。',unit:'教学元',items:[...candidates].sort((a,b)=>a[1]-b[1]).slice(0,10).map(([cycle,value])=>({label:`${cycle}天`,value,selected:cycle===best}))}
  ];

    }
  });
})();
