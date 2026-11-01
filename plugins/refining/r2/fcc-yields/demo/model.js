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


function yields(t,r,c){const severity=(t-490)/60+(r-4)/10,conversion=1-Math.exp(-(.7+severity)),weights=[3+8*severity**2,8+12*severity,40*conversion*Math.exp(-Math.max(0,severity-.85)*.7),28*(1-.45*conversion),22*(1-conversion),3+c*1.7+severity*2],total=weights.reduce((a,b)=>a+b,0);return weights.map(v=>100*v/total)}
function run(p){const names=['干气','液化气','汽油','轻循环油','油浆','焦炭'],current=yields(p.temperature,p.ratio,p.carbon),baseline=yields(490,4,p.carbon),scan=Array.from({length:13},(_,i)=>{const t=490+i*5;return {t,y:yields(t,p.ratio,p.carbon)}}),best=[...scan].sort((a,b)=>b.y[2]-a.y[2])[0];return {metrics:[metric('汽油代理收率',current[2],'%'),metric('相对参考汽油差',current[2]-baseline[2],'百分点'),metric('产物质量和',current.reduce((a,b)=>a+b,0),'%')],series:[line('汽油温度响应',scan.map(r=>[r.t,r.y[2]]),'var(--jade)'),line('焦炭温度响应',scan.map(r=>[r.t,r.y[5]]),'var(--clay)')],axes:['出口温度 / ℃','代理收率 / %'],rows:names.map((name,i)=>row(name,current[i].toFixed(2)+'%','参考 '+baseline[i].toFixed(2)+'%')),recommendation:'当前剂油比下教学汽油峰值温度 '+best.t+'℃；需同时评价焦炭与再生负荷',detail:'六产物归一化只保证非负和总和100%。温度扫描推荐由13点实际搜索，不读取固定最佳温度。',samples:scan.map(r=>({temperature:r.t,...Object.fromEntries(names.map((n,i)=>[n,r.y[i]]))}))};}

const config={"id":"fcc-yields","title":"催化裂化产物预测","method":"守恒约束产物代理","business":"催化裂化将重油转化为气体、汽油、轻循环油、油浆和焦炭。操作温度、剂油比和原料残炭影响转化与结焦；演示用守恒归一化代理解释多产物竞争。","controls":[{"key":"temperature","label":"提升管出口温度","min":490,"max":550,"step":5,"value":520,"unit":"℃"},{"key":"ratio","label":"剂油比","min":4,"max":10,"step":0.5,"value":6,"unit":"kg/kg"},{"key":"carbon","label":"原料残炭","min":0.2,"max":5,"step":0.2,"value":2,"unit":"%"}],"seed":null};const defaults={"temperature":520,"ratio":6,"carbon":2};const calculate=run;return {config,defaults,run(inputs={}){const p={...defaults,...inputs};for(const c of config.controls){if(!Number.isFinite(p[c.key])||p[c.key]<c.min||p[c.key]>c.max)throw Error("Input outside teaching range: "+c.key)}const r=calculate(p);return {...r,charts:[{title:config.method+"计算结果",xlabel:r.axes[0],ylabel:r.axes[1],series:r.series,equalAspect:config.id==="fracture-geometry"}],note:r.detail,audit:{...r.audit,synthetic:true,seed:config.seed,method:config.method,inputs:p}}}};});
