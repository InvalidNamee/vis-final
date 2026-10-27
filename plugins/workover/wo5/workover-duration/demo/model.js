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


const random=rng(1033),records=Array.from({length:180},(_,i)=>{const depth=1000+random()*3000,complexity=1+Math.floor(random()*5),prep=5+random()*4,trip=depth/150+random()*6,treat=4+complexity*6+random()*complexity*8,test=4+random()*5;return {id:i,depth,complexity,prep,trip,treat,test,total:prep+trip+treat+test}}),train=records.slice(0,120),test=records.slice(120);
function estimate(p){const near=train.map(r=>({r,d:((p.depth-r.depth)/3000)**2+((p.complexity-r.complexity)/4)**2})).sort((a,b)=>a.d-b.d).slice(0,p.neighbors).map(x=>x.r);return {near,lo:quant(near.map(x=>x.total),.1),mid:median(near.map(x=>x.total)),hi:quant(near.map(x=>x.total),.9)}}
function run(p){const current=estimate(p),pred=test.map(r=>estimate({...r,neighbors:p.neighbors}));return {metrics:[metric('预测总工期P50',current.mid,'h'),metric('独立井次MAE',mae(test.map(r=>r.total),pred.map(r=>r.mid)),'h'),metric('P10–P90覆盖率',100*mean(test.map((r,i)=>r.total>=pred[i].lo&&r.total<=pred[i].hi?1:0)),'%')],series:[line('相似井次工期',current.near.map((r,i)=>[i+1,r.total]),'#21796a'),line('条件中位数',current.near.map((r,i)=>[i+1,current.mid]),'#b96b38')],axes:['邻近井次序号','总工期 / h'],rows:['prep','trip','treat','test'].map((key,i)=>row(['准备','起下管','故障处理','试验'][i],median(current.near.map(r=>r[key])).toFixed(1)+' h','分工序中位数相加一般不等于总时长中位数')),recommendation:'教学排班参考区间 '+current.lo.toFixed(1)+'–'+current.hi.toFixed(1)+' h',detail:'120参考井次 / 60评价井次。当前查询不加入参考库。反复调整k会使测试变成探索评价；上线另设外部井次验证。',samples:records};}

const config={"id":"workover-duration","title":"修井周期预测","method":"相似工序条件分位数","business":"修井排班需要时间范围而不是一个承诺工期。以深度和故障复杂度检索历史井次，按准备、起下管、处理、试验四工序汇总，从相似井次的总时长估计分位区间。","controls":[{"key":"depth","label":"作业深度","min":1000,"max":4000,"step":100,"value":2500,"unit":"m"},{"key":"complexity","label":"故障复杂度","min":1,"max":5,"step":1,"value":3,"unit":"级"},{"key":"neighbors","label":"邻近历史井次","min":8,"max":30,"step":2,"value":16,"unit":"条"}],"seed":1033};const defaults={"depth":2500,"complexity":3,"neighbors":16};const calculate=run;return {config,defaults,run(inputs={}){const p={...defaults,...inputs};for(const c of config.controls){if(!Number.isFinite(p[c.key])||p[c.key]<c.min||p[c.key]>c.max)throw Error("Input outside teaching range: "+c.key)}const r=calculate(p);return {...r,charts:[{title:config.method+"计算结果",xlabel:r.axes[0],ylabel:r.axes[1],series:r.series,equalAspect:config.id==="fracture-geometry"}],note:r.detail,audit:{...r.audit,synthetic:true,seed:config.seed,method:config.method,inputs:p}}}};});
