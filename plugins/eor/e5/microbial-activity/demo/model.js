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


function simulate(p,mu,death,feed=-1){let b=.2,n=p.nutrient;const rows=[];for(let d=0;d<=30;d++){if(d===feed)n+=3;rows.push({day:d,b,n});const growth=mu*n/(1+n)*Math.exp(-p.salt/130),next=b*Math.exp(growth-death);n=Math.max(0,n-.65*Math.max(0,next-b));b=next}return rows}
function run(p){const random=rng(1044),truth=simulate(p,.32,.09),observed=truth.map(r=>({...r,y:Math.max(.001,r.b+(random()-.5)*p.noise*2)}));let best={loss:Infinity};for(let mu=.2;mu<=.401;mu+=.02)for(let death=.04;death<=.141;death+=.01){const sim=simulate(p,mu,death),loss=mean(observed.slice(0,15).map((r,i)=>(r.y-sim[i].b)**2));if(loss<best.loss)best={mu,death,sim,loss}}const plans=Array.from({length:11},(_,i)=>{const day=15+i,sim=simulate(p,best.mu,best.death,day);return {day,sim,final:sim[30].b}}).sort((a,b)=>b.final-a.final),winner=plans[0];return {metrics:[metric('后16日活性MAE',mae(observed.slice(15).map(r=>r.y),best.sim.slice(15).map(r=>r.b)),'相对单位'),metric('拟合最大生长率',best.mu,'d⁻¹'),metric('拟合衰亡率',best.death,'d⁻¹')],series:[line('合成观测',observed.map(r=>[r.day,r.y]),'var(--ink-3)'),line('拟合无补给',best.sim.map(r=>[r.day,r.b]),'var(--jade)'),line('候选补给',winner.sim.map(r=>[r.day,r.b]),'var(--clay)')],axes:['培养时间 / d','相对活性'],rows:plans.slice(0,5).map(r=>row('第 '+r.day+' 日补给',r.final.toFixed(3),'第30日活性；固定补充3 g/L')),recommendation:'培养瓶候选补给日 '+winner.day+'；不是现场注入指令',detail:'拟合只用0–14日，15–30日评价；搜索使用拟合模型而非后续观测标签。选择后仍须独立培养实验。',samples:observed,audit:{feedCandidates:plans.map(r=>({day:r.day,final:r.final}))}};}

const config={"id":"microbial-activity","title":"微生物采油菌群活性预测","method":"营养耦合活性参数拟合","business":"微生物采油依赖培养条件和代谢产物，活性受营养、盐度及衰亡共同影响。演示以合成培养活性曲线拟合生长和衰亡，再比较补充营养时机。","controls":[{"key":"salt","label":"盐度","min":10,"max":90,"step":5,"value":40,"unit":"g/L"},{"key":"nutrient","label":"初始营养浓度","min":1,"max":10,"step":0.5,"value":5,"unit":"g/L"},{"key":"noise","label":"培养观测误差","min":0,"max":0.3,"step":0.02,"value":0.1,"unit":"相对活性"}],"seed":1044};const defaults={"salt":40,"nutrient":5,"noise":0.1};const calculate=run;return {config,defaults,run(inputs={}){const p={...defaults,...inputs};for(const c of config.controls){if(!Number.isFinite(p[c.key])||p[c.key]<c.min||p[c.key]>c.max)throw Error("Input outside teaching range: "+c.key)}const r=calculate(p);return {...r,charts:[{title:config.method+"计算结果",xlabel:r.axes[0],ylabel:r.axes[1],series:r.series,equalAspect:config.id==="fracture-geometry"}],note:r.detail,audit:{...r.audit,synthetic:true,seed:config.seed,method:config.method,inputs:p}}}};});
