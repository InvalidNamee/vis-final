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


const logistic=(x,m,s)=>1/(1+Math.exp(-(x-m)/s));
function run(p){const fraction=t=>(1-p.crude/100)*logistic(t,210,65)+p.crude/100*logistic(t,420,85),grid=[];for(let cut=160;cut<=240;cut+=5)for(let reflux=1;reflux<=3.001;reflux+=.1){const energy=20+12*reflux+.08*(cut-160),end=cut-10*(reflux-1),light=100*fraction(cut),middle=100*(fraction(350)-fraction(cut)),heavy=100*(1-fraction(350)),objective=light+middle*.75-energy*.12,ok=energy<=p.energy&&end<=p.quality;grid.push({cut,reflux:round(reflux),energy,end,light,middle,heavy,objective,ok})}const good=grid.filter(r=>r.ok).sort((a,b)=>b.objective-a.objective),best=good[0];return {metrics:[metric('可行设定',good.length,'组'),metric('最优轻馏分收率',best?.light??null,'%'),metric('最优目标代理',best?.objective??null,'分')],series:[line('原油累计馏程',Array.from({length:51},(_,i)=>[100+i*10,100*fraction(100+i*10)]),'var(--jade)')],axes:['沸程温度 / ℃','累计体积分数 / %'],rows:best?[row('轻馏分',best.light.toFixed(2)+'%','切点 '+best.cut+'℃'),row('中馏分',best.middle.toFixed(2)+'%','终点350℃'),row('重馏分',best.heavy.toFixed(2)+'%','三馏分严格合计100%'),row('能耗与质量',best.energy.toFixed(1)+' / '+best.end.toFixed(1)+'℃','均满足当前教学约束')]:[],recommendation:best?'教学设定：切点 '+best.cut+'℃，回流比 '+best.reflux:'无可行设定；请调整教学约束',detail:'优化目标是轻收率+0.75×中收率−0.12×能耗，不等于产品价值。原油比例改变累计馏程，切割三段保持总量守恒。',samples:grid};}

const config={"id":"distillation-optimization","title":"常减压装置操作优化","method":"馏程切割与回流网格","business":"常减压装置通过切割点与回流强度分离不同沸程组分。演示在合成原油馏程下比较轻、中、重馏分质量守恒，以及轻产品收率、分离质量和热负荷的权衡。","controls":[{"key":"crude","label":"原油重质比例","min":20,"max":70,"step":5,"value":45,"unit":"%"},{"key":"energy","label":"教学能耗上限","min":30,"max":85,"step":5,"value":60,"unit":"单位"},{"key":"quality","label":"轻产品终馏点上限","min":170,"max":230,"step":5,"value":205,"unit":"℃"}],"seed":null};const defaults={"crude":45,"energy":60,"quality":205};const calculate=run;return {config,defaults,run(inputs={}){const p={...defaults,...inputs};for(const c of config.controls){if(!Number.isFinite(p[c.key])||p[c.key]<c.min||p[c.key]>c.max)throw Error("Input outside teaching range: "+c.key)}const r=calculate(p);return {...r,charts:[{title:config.method+"计算结果",xlabel:r.axes[0],ylabel:r.axes[1],series:r.series,equalAspect:config.id==="fracture-geometry"}],note:r.detail,audit:{...r.audit,synthetic:true,seed:config.seed,method:config.method,inputs:p}}}};});
