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


function run(p){const grid=[];for(let q=2;q<=8.001;q+=.25)for(let sand=20;sand<=100;sand+=5){const cost=4*q+.5*sand,pressure=25+2.4*q+.055*sand+.8*p.stress,response=100*(1-Math.exp(-q/3))*(1-Math.exp(-sand/45))*Math.exp(-p.stress/35),ok=cost<=p.budget&&pressure<=p.pressure;grid.push({q:round(q),sand,cost,pressure,response,ok})}const feasible=grid.filter(r=>r.ok).sort((a,b)=>b.response-a.response),best=feasible[0],front=[];for(let q=2;q<=8.001;q+=.25){const r=feasible.filter(r=>Math.abs(r.q-q)<.01)[0];if(r)front.push([q,r.response])}return {metrics:[metric('枚举组合',grid.length,'组'),metric('可行组合',feasible.length,'组'),metric('最优响应代理',best?best.response:null,'分')],series:[line('各排量可行最优响应',front,'#21796a')],axes:['排量 / m³·min⁻¹','合成响应 / 分'],rows:feasible.slice(0,6).map(r=>row('排量 '+r.q+' / 砂量 '+r.sand,r.response.toFixed(2)+'分','成本 '+r.cost.toFixed(1)+'；压力 '+r.pressure.toFixed(1)+' MPa')),recommendation:best?'教学最优：排量 '+best.q+' m³/min，砂量 '+best.sand+' t':'无可行解；需要调整教学边界',detail:'推荐完全来自可行网格。曲线是每个排量下所有可行砂量的最大值，断开处表示无可行点。',samples:grid};}

const config={"id":"fracturing-search","title":"压裂参数智能优化","method":"压裂约束网格搜索","business":"压裂排量与支撑剂量同时影响裂缝延伸和施工压力。对紧砂岩单段，在教学成本和压力约束内比较不同组合，帮助解释产能代理值与可行域的区别。","controls":[{"key":"budget","label":"教学成本上限","min":30,"max":100,"step":5,"value":65,"unit":"单位"},{"key":"stress","label":"应力差","min":2,"max":10,"step":1,"value":6,"unit":"MPa"},{"key":"pressure","label":"施工压力上限","min":35,"max":65,"step":1,"value":50,"unit":"MPa"}],"seed":null};const defaults={"budget":65,"stress":6,"pressure":50};const calculate=run;return {config,defaults,run(inputs={}){const p={...defaults,...inputs};for(const c of config.controls){if(!Number.isFinite(p[c.key])||p[c.key]<c.min||p[c.key]>c.max)throw Error("Input outside teaching range: "+c.key)}const r=calculate(p);return {...r,charts:[{title:config.method+"计算结果",xlabel:r.axes[0],ylabel:r.axes[1],series:r.series,equalAspect:config.id==="fracture-geometry"}],note:r.detail,audit:{...r.audit,synthetic:true,seed:config.seed,method:config.method,inputs:p}}}};});
