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


function run(p){const random=rng(1053),data=Array.from({length:100},(_,i)=>{const reference=80+30*Math.sin(i/13)+random()*5,raw=reference*(1+p.drift/100)+(random()-.5)*2+(i<p.outliers?35:0);return {i,reference,raw}}),cal=data.slice(0,p.window),ratios=cal.map(r=>r.reference/r.raw),k=median(ratios),kMean=mean(ratios),test=data.slice(60),corrected=test.map(r=>r.raw*k),rawError=mae(test.map(r=>r.reference),test.map(r=>r.raw));return {metrics:[metric('稳健比例系数',k,'倍'),metric('校正前评价MAE',rawError,'m³/h'),metric('校正后评价MAE',mae(test.map(r=>r.reference),corrected),'m³/h')],series:[line('参考流量',test.map(r=>[r.i,r.reference]),'#52667d'),line('原表',test.map(r=>[r.i,r.raw]),'#b96b38'),line('稳健校正',test.map((r,i)=>[r.i,corrected[i]]),'#21796a')],axes:['固定评价样本序号','流量 / m³·h⁻¹'],rows:[row('校准样本',p.window+'组','只取最前样本'),row('均值比例系数',kMean.toFixed(5),'易受异常比值影响'),row('中位比例系数',k.toFixed(5),'干净样本占多数才有稳健性动机；参考误差仍会传递')],recommendation:'候选比例系数 '+k.toFixed(5)+'；先核查参考表与流量稳定性',detail:'60–99固定评价，0–N−1校准；40–59等未选样本不用于估计。指标不是现场计量等级。',samples:data};}

const config={"id":"meter-calibration","title":"油气计量智能校正","method":"中位比例稳健校正","business":"交接计量中仪表结垢和零漂会累积系统偏差。用可靠参考表与待检表的同工况配对数据，稳健估计比例系数，展示少量异常点对校准的影响。","controls":[{"key":"drift","label":"待检表比例漂移","min":-10,"max":15,"step":1,"value":7,"unit":"%"},{"key":"outliers","label":"校准段离群点数","min":0,"max":12,"step":1,"value":4,"unit":"点"},{"key":"window","label":"校准样本数","min":20,"max":60,"step":5,"value":40,"unit":"点"}],"seed":1053};const defaults={"drift":7,"outliers":4,"window":40};const calculate=run;return {config,defaults,run(inputs={}){const p={...defaults,...inputs};for(const c of config.controls){if(!Number.isFinite(p[c.key])||p[c.key]<c.min||p[c.key]>c.max)throw Error("Input outside teaching range: "+c.key)}const r=calculate(p);return {...r,charts:[{title:config.method+"计算结果",xlabel:r.axes[0],ylabel:r.axes[1],series:r.series,equalAspect:config.id==="fracture-geometry"}],note:r.detail,audit:{...r.audit,synthetic:true,seed:config.seed,method:config.method,inputs:p}}}};});
