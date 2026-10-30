(function(){'use strict';PluginViz.mount({get:()=>({result:window.__caseResult,state:window.__caseState}),build:({result:r,state:s})=>{
 const xs=[...new Set(r.search.grid.map(p=>p.wob))].sort((a,b)=>a-b),ys=[...new Set(r.search.grid.map(p=>p.rpm))].sort((a,b)=>a-b),lookup=new Map(r.search.grid.map(p=>[p.wob+':'+p.rpm,p.value])),test=r.learned.test;
 const groups=[0,1,2].map((rock,i)=>({label:['砂岩','页岩','致密灰岩'][i],values:test.filter(p=>p.rock===rock).map(p=>r.model.predict(p)-p.rop)}));
 return [{type:'contour',title:'钻压转速响应等值线',subtitle:'与原热力图使用相同的1,271个回归预测点；等值线为预测钻速（m/h），固定当前岩层与循环流量。',xLabel:'钻压 / kN',yLabel:'转速 / r·min⁻¹',xValues:xs,yValues:ys,values:ys.map(y=>xs.map(x=>lookup.get(x+':'+y)))},
 {type:'parallel',title:'可行钻井参数与预测钻速',subtitle:'每条线表示一组通过当前操作上限的候选，选择候选线查看原始单位数值。',axes:[{key:'wob',label:'钻压',unit:'kN'},{key:'rpm',label:'转速',unit:'r/min'},{key:'value',label:'预测钻速',unit:'m/h'}],items:r.search.grid.filter(p=>p.feasible).map(p=>({...p,selected:p.wob===r.best.wob&&p.rpm===r.best.rpm}))},
 {type:'box',title:'不同岩层的测试井预测误差',unit:'预测减观测 / m·h⁻¹',groups},
 {type:'dumbbell',title:'独立测试井钻速预测误差对照',unit:'MAE / m·h⁻¹',beforeLabel:'训练均值基线',afterLabel:'岭回归',items:[{label:'全部测试井',before:r.learned.baseline.mae,after:r.learned.score.mae}]}];}})})();
