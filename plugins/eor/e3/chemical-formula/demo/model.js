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


const random=rng(1042),response=(a,b,s)=>25+35*(1-Math.exp(-a/1.1))+18*(1-Math.exp(-b/.35))-s*.18-4*a*b,records=Array.from({length:180},(_,i)=>{const a=.2+random()*2.8,b=.05+random()*.95,s=5+random()*75;return {i,a,b,s,y:response(a,b,s)+(random()-.5)*5}}),train=records.slice(0,120),cal=records.slice(120,150),test=records.slice(150);
function predict(a,b,s,h){const weights=train.map(r=>Math.exp(-.5*(((a-r.a)/3)**2+((b-r.b)/1)**2+((s-r.s)/80)**2)/(h*h)));return train.reduce((v,r,i)=>v+r.y*weights[i],0)/weights.reduce((a,b)=>a+b,0)}
function run(p){const half=quant(cal.map(r=>Math.abs(r.y-predict(r.a,r.b,r.s,p.bandwidth))),.9),grid=[];for(let a=.2;a<=3.001;a+=.2)for(let b=.1;b<=1.001;b+=.1){const cost=a+1.8*b,y=predict(a,b,p.salinity,p.bandwidth);if(cost<=p.budget)grid.push({a:round(a),b:round(b),cost,y})}grid.sort((a,b)=>b.y-a.y);const best=grid[0],pred=test.map(r=>predict(r.a,r.b,r.s,p.bandwidth));return {metrics:[metric('评价集MAE',mae(test.map(r=>r.y),pred),'百分点'),metric('探索区间覆盖',100*mean(test.map((r,i)=>Math.abs(r.y-pred[i])<=half?1:0)),'%'),metric('推荐预测效率',best?.y??null,'%')],series:[line('评价观测与预测',test.map((r,i)=>[r.y,pred[i]]),'#21796a'),line('理想一致线',[[20,20],[80,80]],'#b96b38')],axes:['合成实验效率 / %','核回归预测 / %'],scatter:true,rows:grid.slice(0,5).map(r=>row('聚合物 '+r.a.toFixed(1)+' / 表活 '+r.b.toFixed(1)+' g/L',r.y.toFixed(1)+'%','成本 '+r.cost.toFixed(2)+'；探索半宽 '+half.toFixed(1))),recommendation:best?'候选配方 '+best.a.toFixed(1)+' / '+best.b.toFixed(1)+' g/L；需室内复核':'教学成本约束内无候选',detail:'按实验编号固定120/30/30切分；带宽由用户探索指定，反复查看评价数据不能称最终外部验证。所有浓度和效率合成。',samples:records};}

const config={"id":"chemical-formula","title":"化学驱配方智能筛选","method":"局部核回归配方筛选","business":"化学驱配方的聚合物、表活剂用量与矿化度共同影响室内驱替效率。小样本条件下先比较邻近实验响应和距离，筛选下一轮候选配方，再进行实验复核。","controls":[{"key":"salinity","label":"矿化度","min":5,"max":80,"step":5,"value":35,"unit":"g/L"},{"key":"budget","label":"配方教学成本上限","min":1,"max":5,"step":0.2,"value":3,"unit":"单位"},{"key":"bandwidth","label":"核带宽","min":0.2,"max":0.8,"step":0.1,"value":0.4,"unit":"归一尺度"}],"seed":1042};const defaults={"salinity":35,"budget":3,"bandwidth":0.4};const calculate=run;return {config,defaults,run(inputs={}){const p={...defaults,...inputs};for(const c of config.controls){if(!Number.isFinite(p[c.key])||p[c.key]<c.min||p[c.key]>c.max)throw Error("Input outside teaching range: "+c.key)}const r=calculate(p);return {...r,charts:[{title:config.method+"计算结果",xlabel:r.axes[0],ylabel:r.axes[1],series:r.series,equalAspect:config.id==="fracture-geometry"}],note:r.detail,audit:{...r.audit,synthetic:true,seed:config.seed,method:config.method,inputs:p}}}};});
