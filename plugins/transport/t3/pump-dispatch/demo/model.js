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


function run(p){const candidates=[];for(let n=1;n<=3;n++)for(let s=.6;s<=1.0001;s+=.02){const q=p.flow/n,available=95*s*s-.003*q*q,eta=clamp(.82-.5*(q/(95*s)-1)**2,.25,.84),power=850*9.81*(p.flow/3600)*available/eta/1000,ok=available>=p.head&&q>=20*s&&q<=135*s;candidates.push({n,s:round(s),available,eta,power,cost:power*p.price,ok})}const good=candidates.filter(r=>r.ok).sort((a,b)=>a.power-b.power),best=good[0];return {metrics:[metric('可行组合',good.length,'种'),metric('最低合成轴功率',best?.power??null,'kW'),metric('对应小时电费',best?.cost??null,'元/h')],series:[line('可行组合功率排序',good.map((r,i)=>[i+1,r.power]),'var(--jade)')],axes:['可行组合排名','轴功率 / kW'],rows:good.slice(0,6).map(r=>row(r.n+'台 × '+(r.s*100).toFixed(0)+'%转速',r.power.toFixed(2)+' kW','扬程 '+r.available.toFixed(1)+' m；效率 '+(100*r.eta).toFixed(1)+'%')),recommendation:best?'教学最优：'+best.n+'台，转速比 '+best.s:'无可行组合；需求超出教学泵库',detail:'功率使用所选转速可供扬程，而非仅使用需求扬程，因此多余扬程也消耗功率。合成密度850 kg/m³。',samples:candidates};}

const config={"id":"pump-dispatch","title":"集输系统工况优化","method":"并联泵组合枚举","business":"集输站在不同产量下需选择并联泵数和转速，满足流量与扬程再比较轴功率。只比较单台名义效率会忽略多台分流后的偏离最佳效率点。","controls":[{"key":"flow","label":"需求流量","min":60,"max":240,"step":10,"value":150,"unit":"m³/h"},{"key":"head","label":"所需扬程","min":20,"max":65,"step":5,"value":40,"unit":"m"},{"key":"price","label":"教学电价","min":0.3,"max":1.5,"step":0.1,"value":0.8,"unit":"元/kWh"}],"seed":null};const defaults={"flow":150,"head":40,"price":0.8};const calculate=run;return {config,defaults,run(inputs={}){const p={...defaults,...inputs};for(const c of config.controls){if(!Number.isFinite(p[c.key])||p[c.key]<c.min||p[c.key]>c.max)throw Error("Input outside teaching range: "+c.key)}const r=calculate(p);return {...r,charts:[{title:config.method+"计算结果",xlabel:r.axes[0],ylabel:r.axes[1],series:r.series,equalAspect:config.id==="fracture-geometry"}],note:r.detail,audit:{...r.audit,synthetic:true,seed:config.seed,method:config.method,inputs:p}}}};});
