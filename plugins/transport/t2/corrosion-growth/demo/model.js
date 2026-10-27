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


function run(p){const random=rng(1051),data=Array.from({length:5},(_,year)=>({year,depth:1.5+p.growth*year+(random()-.5)*p.noise*2})),fitModel=fit(data.slice(0,4).map(r=>[r.year,r.depth])),sd=Math.sqrt(mean(data.slice(0,4).map(r=>(r.depth-fitModel.predict(r.year))**2))),slope=fitModel.b,years=slope>0?(p.limit-fitModel.predict(4))/slope:null,pred=Array.from({length:13},(_,i)=>[i,fitModel.predict(i)]);return {metrics:[metric('估计增长率',slope,'mm/a'),metric('留后检测误差',Math.abs(data[4].depth-fitModel.predict(4)),'mm'),metric('至教学复核深度',years!==null?Math.max(0,years):null,'a')],series:[line('检测深度',data.map(r=>[r.year,r.depth]),'#52667d'),line('线性趋势',pred,'#21796a'),line('残差尺度上带',pred.map(r=>[r[0],r[1]+2*sd*Math.sqrt(1+r[0]/4)]),'#b96b38'),line('教学复核深度',[[0,p.limit],[12,p.limit]],'#995b68')],axes:['首次检测后 / a','缺陷深度 / mm'],rows:data.map(r=>row('第 '+r.year+' 年',r.depth.toFixed(3)+' mm',r.year===4?'留后评价，不参与拟合':'趋势拟合')),recommendation:slope>0?'预计 '+Math.max(0,years).toFixed(1)+' 年后触及教学复核线；需检测误差评估':'增长率非正，无法由线性模型给出触线年限',detail:'趋势带仅按残差尺度绘制，不是严格统计置信区间；不能据此推断爆破强度或真实剩余寿命。',samples:data};}

const config={"id":"corrosion-growth","title":"管道腐蚀智能评估","method":"重复检测腐蚀趋势拟合","business":"同一缺陷的重复内检测需要完成里程配准，再估计深度增长。演示假定配准已完成，用多次检测拟合趋势，显示检测误差如何放大外推年限的不确定性。","controls":[{"key":"growth","label":"真实深度增长率","min":0.05,"max":0.8,"step":0.05,"value":0.3,"unit":"mm/a"},{"key":"noise","label":"检测误差幅度","min":0.05,"max":0.5,"step":0.05,"value":0.2,"unit":"mm"},{"key":"limit","label":"教学复核深度","min":3,"max":7,"step":0.5,"value":5,"unit":"mm"}],"seed":1051};const defaults={"growth":0.3,"noise":0.2,"limit":5};const calculate=run;return {config,defaults,run(inputs={}){const p={...defaults,...inputs};for(const c of config.controls){if(!Number.isFinite(p[c.key])||p[c.key]<c.min||p[c.key]>c.max)throw Error("Input outside teaching range: "+c.key)}const r=calculate(p);return {...r,charts:[{title:config.method+"计算结果",xlabel:r.axes[0],ylabel:r.axes[1],series:r.series,equalAspect:config.id==="fracture-geometry"}],note:r.detail,audit:{...r.audit,synthetic:true,seed:config.seed,method:config.method,inputs:p}}}};});
