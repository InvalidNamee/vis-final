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


function run(p){const random=rng(1032),values=Array.from({length:120},(_,i)=>10+(random()-.5)*p.noise*2+(i>=75?p.drift*Math.min(1,(i-74)/15):0)),base=values.slice(0,40),m=mean(base),sd=Math.sqrt(mean(base.map(v=>(v-m)**2))),scores=[];let s=0,fp=0,tp=0,first=null;for(let i=40;i<120;i++){s=Math.max(0,s+(values[i]-m)/sd-.5);const flag=s>p.limit;if(flag&&i<75)fp++;if(flag&&i>=75){tp++;if(first===null)first=i}scores.push([i,s])}return {metrics:[metric('正常窗误报点',fp,'/35'),metric('漂移窗召回率',100*tp/45,'%'),metric('首次检出延迟',first===null?null:first-75,'点')],series:[line('CUSUM',scores,'var(--jade)'),line('教学控制限',scores.map(v=>[v[0],p.limit]),'var(--clay)')],axes:['采样点','累积标准分'],rows:[row('基线均值',m.toFixed(3),'仅前40点'),row('基线标准差',sd.toFixed(3),'后续不更新'),row('漂移起点','75','真值只用于评价')],recommendation:first===null?'当前设置未检出漂移':'第 '+first+' 点进入人工复核队列',detail:'每点为合成采样，点级召回率不是独立事故检出率。0–39为校准，40–74为正常评价，75–119为漂移评价。',samples:values.map((v,i)=>({i,value:v,truth:i>=75}))};}

const config={"id":"workover-risk","title":"修井作业风险预警","method":"单侧累积和异常监测","business":"磨铣修井中相同工序内扭矩缓慢升高可能提示负荷变化。相较单点阈值，累积和监测可保留持续的小偏移；工序切换必须先单独识别。","controls":[{"key":"drift","label":"磨铣扭矩漂移","min":0,"max":4,"step":0.2,"value":2,"unit":"kN·m"},{"key":"noise","label":"观测噪声幅度","min":0.2,"max":2,"step":0.1,"value":0.8,"unit":"kN·m"},{"key":"limit","label":"CUSUM教学控制限","min":2,"max":15,"step":0.5,"value":7,"unit":"分"}],"seed":1032};const defaults={"drift":2,"noise":0.8,"limit":7};const calculate=run;return {config,defaults,run(inputs={}){const p={...defaults,...inputs};for(const c of config.controls){if(!Number.isFinite(p[c.key])||p[c.key]<c.min||p[c.key]>c.max)throw Error("Input outside teaching range: "+c.key)}const r=calculate(p);return {...r,charts:[{title:config.method+"计算结果",xlabel:r.axes[0],ylabel:r.axes[1],series:r.series,equalAspect:config.id==="fracture-geometry"}],note:r.detail,audit:{...r.audit,synthetic:true,seed:config.seed,method:config.method,inputs:p}}}};});
