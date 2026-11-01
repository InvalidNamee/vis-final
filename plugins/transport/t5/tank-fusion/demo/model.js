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


function run(p){const random=rng(1054),data=Array.from({length:100},(_,i)=>{const truth=6+Math.sin(i/20)*.7,radar=truth+(random()-.5)*.08*Math.sqrt(12)+(i>=50?p.bias:0),vision=truth+(random()-.5)*p.fog*Math.sqrt(12),wr=1/.08**2,wv=1/p.fog**2,fused=(radar*wr+vision*wv)/(wr+wv);return {i,truth,radar,vision,fused,flag:Math.abs(radar-vision)>p.gate}});return {metrics:[metric('雷达MAE',mae(data.map(r=>r.truth),data.map(r=>r.radar)),'m'),metric('视觉MAE',mae(data.map(r=>r.truth),data.map(r=>r.vision)),'m'),metric('融合MAE',mae(data.map(r=>r.truth),data.map(r=>r.fused)),'m')],series:[line('液位真值',data.map(r=>[r.i,r.truth]),'var(--ink-3)'),line('雷达读数',data.map(r=>[r.i,r.radar]),'var(--clay)'),line('加权融合',data.map(r=>[r.i,r.fused]),'var(--jade)')],axes:['分钟序号','液位 / m'],rows:[row('源间超差',data.filter(r=>r.flag).length+'点','仅表示两源不一致'),row('雷达融合权重',(1/.08**2/(1/.08**2+1/p.fog**2)*100).toFixed(1)+'%','有漂移时高权重可能适得其反'),row('视觉输入','合成已识别刻度','未实现图像识别')],recommendation:data.some(r=>r.flag)?'源间超差，进入仪表与视频人工复核':'未触发源间超差；不证明无泄漏',detail:'误差由当前100点真值实际计算。融合不保证优于单源，故意保留偏置场景展示失效边界。',samples:data};}

const config={"id":"tank-fusion","title":"储罐液位与泄漏智能监控","method":"液位多源方差加权融合","business":"储罐雷达液位与视频刻度识别可以互相核对。演示将视频读数当作已完成识别的观测值，以已知噪声尺度融合，同时监视源间差值，区分精度改善和传感器失配报警。","controls":[{"key":"fog","label":"视觉噪声标准尺度","min":0.05,"max":0.8,"step":0.05,"value":0.3,"unit":"m"},{"key":"bias","label":"雷达液位漂移","min":0,"max":1,"step":0.1,"value":0.4,"unit":"m"},{"key":"gate","label":"交叉偏差阈值","min":0.2,"max":1.5,"step":0.1,"value":0.7,"unit":"m"}],"seed":1054};const defaults={"fog":0.3,"bias":0.4,"gate":0.7};const calculate=run;return {config,defaults,run(inputs={}){const p={...defaults,...inputs};for(const c of config.controls){if(!Number.isFinite(p[c.key])||p[c.key]<c.min||p[c.key]>c.max)throw Error("Input outside teaching range: "+c.key)}const r=calculate(p);return {...r,charts:[{title:config.method+"计算结果",xlabel:r.axes[0],ylabel:r.axes[1],series:r.series,equalAspect:config.id==="fracture-geometry"}],note:r.detail,audit:{...r.audit,synthetic:true,seed:config.seed,method:config.method,inputs:p}}}};});
