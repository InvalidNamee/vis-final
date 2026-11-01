(function(root,factory){if(typeof module==="object"&&module.exports)module.exports=factory();else root.OperationsModel=factory()})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";

const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const quant=(a,p)=>{const b=[...a].sort((x,y)=>x-y),i=(b.length-1)*p,l=Math.floor(i);return b[l]+(b[Math.ceil(i)]-b[l])*(i-l)};
const median=a=>quant(a,.5),clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
const rng=(seed=20261023)=>()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
const fit=points=>{const x=mean(points.map(p=>p[0])),y=mean(points.map(p=>p[1])),den=points.reduce((s,p)=>s+(p[0]-x)**2,0),b=den?points.reduce((s,p)=>s+(p[0]-x)*(p[1]-y),0)/den:0;return {a:y-b*x,b,predict:t=>y+b*(t-x)}};
const mae=(a,b)=>mean(a.map((v,i)=>Math.abs(v-b[i])));
const metric=(label,value,unit='')=>({label,value:Number.isFinite(value)?value:null,unit});
const line=(name,points,color)=>({name,points,color});
const row=(label,value,note='')=>({label,value,note});
const round=v=>Math.round(v*1000)/1000;


function run(p){const random=rng(1062),data=Array.from({length:60},(_,d)=>({d,y:2+p.growth*d+(random()-.5)*p.noise*2})),m=fit(data.slice(0,40).map(r=>[r.d,r.y])),forecast=Array.from({length:101},(_,d)=>[d,m.predict(d)]),time=m.b>0?Math.max(0,(p.limit-m.predict(39))/m.b):null;return {metrics:[metric('后20日MAE',mae(data.slice(40).map(r=>r.y),data.slice(40).map(r=>m.predict(r.d))),'mm/s'),metric('估计退化斜率',m.b,'mm/s/d'),metric('第39日后触线时间',time,'d')],series:[line('合成振动RMS',data.map(r=>[r.d,r.y]),'var(--ink-3)'),line('线性外推',forecast,'var(--jade)'),line('教学复核线',[[0,p.limit],[100,p.limit]],'var(--clay)')],axes:['监测时间 / d','振动RMS / mm·s⁻¹'],rows:[row('拟合窗口','0–39日','不包含后20日'),row('评价窗口','40–59日','仅用于误差统计'),row('未建模因素','转速 / 载荷 / 维修','换工况应重新建基线')],recommendation:time===null?'未估计到正退化趋势，需补充观测':'第39日后约 '+time.toFixed(1)+' d 触及教学线；安排复测示意',detail:'第39日为预测发出时点，后20日观测不参与触线时间估计。无失效真值，不报告寿命预测准确率。',samples:data};}

const config={"id":"equipment-maintenance","title":"炼化设备预测性维护","method":"振动退化趋势外推","business":"炼化旋转设备在稳定转速和负荷下，振动趋势可以辅助安排复测与检修。演示对固定工况机泵的退化趋势拟合，说明单一振动外推和真实剩余寿命的区别。","controls":[{"key":"growth","label":"振动增长斜率","min":0.01,"max":0.1,"step":0.005,"value":0.04,"unit":"mm/s/d"},{"key":"noise","label":"振动观测噪声","min":0.05,"max":0.5,"step":0.05,"value":0.2,"unit":"mm/s"},{"key":"limit","label":"教学复核振动值","min":4,"max":8,"step":0.5,"value":6,"unit":"mm/s"}],"seed":1062};const defaults={"growth":0.04,"noise":0.2,"limit":6};const calculate=run;return {config,defaults,run(inputs={}){const p={...defaults,...inputs};for(const c of config.controls){if(!Number.isFinite(p[c.key])||p[c.key]<c.min||p[c.key]>c.max)throw Error("Input outside teaching range: "+c.key)}const r=calculate(p);return {...r,charts:[{title:config.method+"计算结果",xlabel:r.axes[0],ylabel:r.axes[1],series:r.series,equalAspect:config.id==="fracture-geometry"}],note:r.detail,audit:{...r.audit,synthetic:true,seed:config.seed,method:config.method,inputs:p}}}};});
