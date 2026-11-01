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


function simulate(seq,p){let heat=0;return seq.map((steam,i)=>{heat=heat*(1-p.loss)+steam*(1-Math.exp(-p.soak/3));const oil=480*(1-Math.exp(-heat/1100))*Math.exp(-i*.13);return {cycle:i+1,steam,heat,oil}})}
function run(p){const plans=[];for(let a=300;a<=1200;a+=100)for(let b=300;b<=1200;b+=100)for(let c=300;c<=1200;c+=100){if(a+b+c>p.steam)continue;const seq=[a,b,c],sim=simulate(seq,p),oil=sim.reduce((s,r)=>s+r.oil,0);plans.push({seq,sim,oil,total:a+b+c})}plans.sort((a,b)=>b.oil-a.oil);const best=plans[0],equal=Math.floor(p.steam/3/100)*100,baseline=simulate([equal,equal,equal],p),baseOil=baseline.reduce((s,r)=>s+r.oil,0);return {metrics:[metric('可行周期计划',plans.length,'种'),metric('累计教学产油',best.oil,'t'),metric('累计油汽比',best.oil/best.total,'t/t')],series:[line('优化计划周期产油',best.sim.map(r=>[r.cycle,r.oil]),'var(--jade)'),line('均分预算周期产油',baseline.map(r=>[r.cycle,r.oil]),'var(--clay)')],axes:['周期','合成产油 / t'],rows:best.sim.map(r=>row('推荐周期 '+r.cycle,r.steam+' t注汽','热状态 '+r.heat.toFixed(1)+'；产油 '+r.oil.toFixed(1)+' t')).concat([row('推荐总注汽量',best.total+' t','预算余量 '+(p.steam-best.total)+' t'),row('均分基线总注汽量',equal*3+' t','每周期 '+equal+' t；预算余量 '+(p.steam-equal*3)+' t'),row('两计划用汽差',best.total-equal*3+' t','产油差同时包含分配与总注汽量差，不能单独归因为分配优化')]),recommendation:'三周期注汽 '+best.seq.join(' / ')+' t；相对取整均分计划产油差 '+(best.oil-baseOil).toFixed(1)+' t（含用汽量差）',detail:'枚举以累计产油为目标，油汽比只作伴随指标。均分方案每周期按100 t向下取整，可能比推荐计划少用汽；表中分别列出两计划总用量及预算余量，产油差不能单独归因于分配优化。',samples:plans.map(r=>({plan:r.seq.join('/'),oil:r.oil,steam:r.total}))};}

const config={"id":"steam-cycle","title":"蒸汽吞吐注采参数优化","method":"多周期热量状态搜索","business":"蒸汽吞吐同井交替注汽和生产，上一周期剩余热量会影响下一周期。演示对三周期注汽分配穷举，比较累计产油与油汽比，避免只追求单周期峰值。","controls":[{"key":"steam","label":"三周期注汽总预算","min":1200,"max":3000,"step":100,"value":2100,"unit":"t"},{"key":"loss","label":"周期间热损失比例","min":0.1,"max":0.6,"step":0.05,"value":0.3,"unit":"比例"},{"key":"soak","label":"焖井时间","min":2,"max":10,"step":1,"value":5,"unit":"d"}],"seed":null};const defaults={"steam":2100,"loss":0.3,"soak":5};const calculate=run;return {config,defaults,run(inputs={}){const p={...defaults,...inputs};for(const c of config.controls){if(!Number.isFinite(p[c.key])||p[c.key]<c.min||p[c.key]>c.max)throw Error("Input outside teaching range: "+c.key)}const r=calculate(p);return {...r,charts:[{title:config.method+"计算结果",xlabel:r.axes[0],ylabel:r.axes[1],series:r.series,equalAspect:config.id==="fracture-geometry"}],note:r.detail,audit:{...r.audit,synthetic:true,seed:config.seed,method:config.method,inputs:p}}}};});
