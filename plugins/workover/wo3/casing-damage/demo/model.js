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


function run(p){const random=rng(1031),raw=[],points=[];let tp=0,fp=0,fn=0;for(let z=0;z<80;z++){const truth=z>=31&&z<=40,arms=Array.from({length:12},(_,j)=>{const t=j*Math.PI/6;return 62+p.oval*Math.cos(2*t)+(random()-.5)*.8-(truth&&j===3?p.dent:0)}),a=mean(arms),b=arms.reduce((s,v,j)=>s+v*Math.cos(j*Math.PI/3),0)/6,c=arms.reduce((s,v,j)=>s+v*Math.sin(j*Math.PI/3),0)/6,res=arms.map((v,j)=>Math.abs(v-a-b*Math.cos(j*Math.PI/3)-c*Math.sin(j*Math.PI/3))),score=Math.max(...res),flag=score>p.threshold;tp+=flag&&truth?1:0;fp+=flag&&!truth?1:0;fn+=!flag&&truth?1:0;points.push([1000+z,score]);raw.push({depth:1000+z,score,truth,flag,arms})}return {metrics:[metric('精确率',tp+fp?100*tp/(tp+fp):null,'%'),metric('召回率',tp+fn?100*tp/(tp+fn):null,'%'),metric('误报深度层',fp,'层')],series:[line('角向残差',points,'#21796a'),line('判定阈值',points.map(v=>[v[0],p.threshold]),'#b96b38')],axes:['深度 / m','径向残差 / mm'],rows:raw.filter(r=>r.flag).slice(0,8).map(r=>row(r.depth+' m',r.score.toFixed(2)+' mm','需结合超声壁厚复核')),recommendation:raw.some(r=>r.flag)?'复核井段：'+raw.filter(r=>r.flag)[0].depth+' m 起':'当前阈值未检出局部残差；不代表套管完好',detail:'缩径真值为1031–1040 m。评价来自当前合成剖面，可反复调参，不称独立测试。',samples:raw};}

const config={"id":"casing-damage","title":"套管损伤智能识别","method":"多臂井径谐波残差","business":"多臂井径的同深度多方位读数可分离总体椭圆趋势与局部内凸。演示沿深度生成12臂半径，在每层拟合二阶角向谐波后观察残差，避免把正常椭圆全部判为损伤。","controls":[{"key":"dent","label":"局部缩径幅度","min":0,"max":12,"step":0.5,"value":6,"unit":"mm"},{"key":"oval","label":"背景椭圆幅度","min":0,"max":5,"step":0.5,"value":2,"unit":"mm"},{"key":"threshold","label":"残差判定阈值","min":1,"max":8,"step":0.5,"value":3,"unit":"mm"}],"seed":1031};const defaults={"dent":6,"oval":2,"threshold":3};const calculate=run;return {config,defaults,run(inputs={}){const p={...defaults,...inputs};for(const c of config.controls){if(!Number.isFinite(p[c.key])||p[c.key]<c.min||p[c.key]>c.max)throw Error("Input outside teaching range: "+c.key)}const r=calculate(p);return {...r,charts:[{title:config.method+"计算结果",xlabel:r.axes[0],ylabel:r.axes[1],series:r.series,equalAspect:config.id==="fracture-geometry"}],note:r.detail,audit:{...r.audit,synthetic:true,seed:config.seed,method:config.method,inputs:p}}}};});
