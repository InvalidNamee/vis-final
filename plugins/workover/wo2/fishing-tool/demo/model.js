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


const tools=[['外捞筒 A',0,50,75,90,45],['外捞筒 B',0,70,95,112,60],['外捞筒 C',0,88,110,130,70],['内捞矛 A',1,35,55,72,50],['内捞矛 B',1,52,72,88,65],['内捞矛 C',1,68,88,104,75]];
function run(p){const ranked=tools.map(t=>{const target=t[1]?p.fish*.78:p.fish,clear=p.bore-t[4]-6,ok=target>=t[2]&&target<=t[3]&&clear>=0;return {name:t[0],clear,ok,score:ok?100-25*Math.abs(target-(t[2]+t[3])/2)/(t[3]-t[2])-Math.max(0,p.inclination-t[5]):0,reason:clear<0?'通径不足':target<t[2]||target>t[3]?'接合尺寸不符':'尺寸可行'}}).sort((a,b)=>b.score-a.score);const good=ranked.filter(r=>r.ok);return {metrics:[metric('尺寸可行工具',good.length,'种'),metric('首选净空',good.length?good[0].clear:null,'mm'),metric('首选适配分',good.length?good[0].score:null,'分')],series:[line('工具适配分',ranked.map((r,i)=>[i+1,r.score]),'#21796a')],axes:['工具排序','适配分'],rows:ranked.map(r=>row(r.name,r.score.toFixed(1)+'分',r.reason+'；净空 '+r.clear.toFixed(1)+' mm')),recommendation:good.length?'尺寸筛选首选：'+good[0].name:'当前教学工具库无可行工具；需补充尺寸资料与目录',detail:'硬约束先于排序。内径=0.78×外径仅为教学假设，可行不等于现场可用。',samples:ranked};}

const config={"id":"fishing-tool","title":"落物打捞工具智能选型","method":"尺寸约束与工具排序","business":"油管断落后的外捞与内捞工具需要先满足落物接合尺寸和井眼通径，再比较适配条件。尺寸不兼容的工具应被排除，不能靠高匹配分抵消硬约束。","controls":[{"key":"fish","label":"落物外径","min":45,"max":105,"step":1,"value":73,"unit":"mm"},{"key":"bore","label":"最小通径","min":90,"max":160,"step":1,"value":124,"unit":"mm"},{"key":"inclination","label":"井斜","min":0,"max":75,"step":5,"value":30,"unit":"°"}],"seed":null};const defaults={"fish":73,"bore":124,"inclination":30};const calculate=run;return {config,defaults,run(inputs={}){const p={...defaults,...inputs};for(const c of config.controls){if(!Number.isFinite(p[c.key])||p[c.key]<c.min||p[c.key]>c.max)throw Error("Input outside teaching range: "+c.key)}const r=calculate(p);return {...r,charts:[{title:config.method+"计算结果",xlabel:r.axes[0],ylabel:r.axes[1],series:r.series,equalAspect:config.id==="fracture-geometry"}],note:r.detail,audit:{...r.audit,synthetic:true,seed:config.seed,method:config.method,inputs:p}}}};});
