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


const random=rng(1029),plans=['诊断成像与打捞复核','产剖定位与分层封堵复核','冲砂解卡工艺复核','套管检测与补贴复核'];
const records=Array.from({length:24},(_,i)=>({id:'WO-'+(i+1),fault:i%4,depth:1000+random()*3000,water:20+random()*75,plan:plans[i%4]}));
const distance=(a,b)=>3*(a.fault!==b.fault)+Math.abs(a.depth-b.depth)/3000+Math.abs(a.water-b.water)/75;
function run(p){const ranked=records.map(r=>({...r,d:distance(p,r)})).sort((a,b)=>a.d-b.d);let correct=0;for(const q of records){const best=records.filter(r=>r!==q).sort((a,b)=>distance(q,a)-distance(q,b))[0];correct+=best.fault===q.fault?1:0}return {metrics:[metric('候选案例',ranked.length,'条'),metric('留一故障匹配率',100*correct/records.length,'%'),metric('首选相似分',100/(1+ranked[0].d),'分')],series:[line('候选相似分',ranked.slice(0,8).map((r,i)=>[i+1,100/(1+r.d)]),'#21796a')],axes:['候选排名','相似分'],rows:ranked.slice(0,6).map(r=>row(r.id+' · '+r.plan,(100/(1+r.d)).toFixed(1)+'分','深度 '+Math.round(r.depth)+' m；含水 '+r.water.toFixed(1)+'%；故障 '+r.fault)),recommendation:'首选证据：'+ranked[0].id+' → 故障类型 '+ranked[0].fault+' → '+ranked[0].plan,detail:'检索分由用户井况和案例属性实际计算。留一匹配只验证结构化故障检索，不代表修井成功率。',samples:records,audit:{ranked}};}

const config={"id":"workover-plan","title":"修井作业方案智能推荐","method":"加权案例检索","business":"产水突升或机械故障发生后，工程师需要从井史中找到井况接近且工艺匹配的修井记录。演示将故障、深度和含水率组织为结构化证据，而非让文本模型直接下指令。","controls":[{"key":"depth","label":"作业深度","min":1000,"max":4000,"step":100,"value":2400,"unit":"m"},{"key":"water","label":"含水率","min":20,"max":95,"step":5,"value":70,"unit":"%"},{"key":"fault","label":"故障类型编号","min":0,"max":3,"step":1,"value":1,"unit":"0落物/1出水/2砂卡/3套损"}],"seed":1029};const defaults={"depth":2400,"water":70,"fault":1};const calculate=run;return {config,defaults,run(inputs={}){const p={...defaults,...inputs};for(const c of config.controls){if(!Number.isFinite(p[c.key])||p[c.key]<c.min||p[c.key]>c.max)throw Error("Input outside teaching range: "+c.key)}const r=calculate(p);return {...r,charts:[{title:config.method+"计算结果",xlabel:r.axes[0],ylabel:r.axes[1],series:r.series,equalAspect:config.id==="fracture-geometry"}],note:r.detail,audit:{...r.audit,synthetic:true,seed:config.seed,method:config.method,inputs:p}}}};});
