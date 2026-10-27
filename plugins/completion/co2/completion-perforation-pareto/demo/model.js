/* Fixed-seed synthetic teaching case. No network dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CaseModel=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
const config={
  "stage": "completion",
  "scene": "co2",
  "id": "completion-perforation-pareto",
  "kind": "pareto",
  "title": "射孔产能成本帕累托设计",
  "methods": [
    "opt"
  ],
  "topic": "射孔参数智能设计",
  "controls": [
    {
      "key": "damage",
      "label": "损害带厚度 / m",
      "min": 0.05,
      "max": 0.6,
      "step": 0.025,
      "value": 0.25
    },
    {
      "key": "strength",
      "label": "岩石强度编码 / MPa",
      "min": 30,
      "max": 120,
      "step": 5,
      "value": 70
    },
    {
      "key": "risk",
      "label": "教学出砂分数上限",
      "min": 0.1,
      "max": 0.9,
      "step": 0.05,
      "value": 0.5
    },
    {
      "key": "costWeight",
      "label": "成本偏好权重",
      "min": 0,
      "max": 0.8,
      "step": 0.05,
      "value": 0.25
    }
  ],
  "background": "完井阶段确定孔密、相位与穿深，要兼顾穿透损害带、流动面积、出砂倾向与作业成本。将多目标问题压成一个固定分数会隐藏取舍。本例先在出砂教学约束内找出产能与成本的非支配前沿，再用用户选择的偏好选取一个候选。",
  "visual": "成本—产能图中前沿点不存在同时更便宜且更高产的候选；约束图标明出砂分数排除的设计，帮助区分物理限制与偏好。",
  "steps": [
    "离散方案组合",
    "产能与风险代理计算",
    "非支配前沿提取",
    "偏好权重选点"
  ],
  "details": [
    "枚举孔密、相位及穿深的100种组合。",
    "用饱和连通响应与出砂代理评价，所有系数教学设定。",
    "先剔除超过出砂分数上限的方案，再做双目标支配判定。",
    "只在前沿按产能与成本偏好排序，显示无解。"
  ],
  "metric": "A支配B需产能不低、成本不高且至少一项严格更好；Pareto数量由运行时判定。产能代理不是现场产量。",
  "limit": "未建立真实射孔弹靶试或产能训练集，代理公式是显式教学假设；岩石强度编码不能转换为通用出砂安全阈值。",
  "refs": [
    "perf",
    "strategy"
  ]
};
const U=(function utilities() {
  const U={};
  U.rng=(seed=20261023)=>()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
  U.clamp=(x,a,b)=>Math.max(a,Math.min(b,x)); U.mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
  U.sd=a=>Math.sqrt(U.mean(a.map(v=>(v-U.mean(a))**2)))||1;
  U.mae=(a,b)=>U.mean(a.map((v,i)=>Math.abs(v-b[i])));
  U.grid=(a,b,s)=>Array.from({length:Math.floor((b-a)/s+1.0001)},(_,i)=>+(a+i*s).toFixed(8));
  U.solve=(A,b)=>{A=A.map((r,i)=>[...r,b[i]]);for(let i=0;i<b.length;i++){let k=i;for(let j=i+1;j<b.length;j++)if(Math.abs(A[j][i])>Math.abs(A[k][i]))k=j;[A[i],A[k]]=[A[k],A[i]];let p=A[i][i];if(Math.abs(p)<1e-12)throw Error('singular');for(let j=i;j<=b.length;j++)A[i][j]/=p;for(let k=0;k<b.length;k++)if(k!==i){let t=A[k][i];for(let j=i;j<=b.length;j++)A[k][j]-=t*A[i][j]}}return A.map(r=>r[b.length])};
  U.fit=(X,y,l=.01)=>{let n=X[0].length,A=Array.from({length:n},()=>Array(n).fill(0)),b=Array(n).fill(0);X.forEach((r,k)=>r.forEach((v,i)=>{b[i]+=v*y[k];r.forEach((w,j)=>A[i][j]+=v*w)}));A.forEach((r,i)=>r[i]+=i?l:0);return U.solve(A,b)};
  U.dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);U.metric=(label,value,unit='')=>({label,value,unit});
  U.chart=(title,xlabel,ylabel,series)=>({title,xlabel,ylabel,series});U.series=(name,points,scatter=false)=>({name,points,scatter});
  U.rank=(arr,f)=>[...arr].sort((a,b)=>f(b)-f(a));
  return U;
})();
const algorithm=function(p,U){
 let rows=[];for(let n of [4,8,12,16,20])for(let phase of [0,60,90,120])for(let depth of [.2,.3,.4,.5,.6]){let productivity=(1-Math.exp(-n/8))*(1-Math.exp(-depth/Math.max(.08,p.damage)))*(1+.14*Math.sin(phase*Math.PI/180)),risk=U.clamp((n/30)**1.6*(70/p.strength)+.12*depth,0,1),cost=3*n+80*depth+.04*phase;rows.push({n,phase,depth,productivity,risk,cost})}
 let feasible=rows.filter(d=>d.risk<=p.risk),front=feasible.filter(a=>!feasible.some(b=>b.productivity>=a.productivity&&b.cost<=a.cost&&(b.productivity>a.productivity||b.cost<a.cost))),best=U.rank(front,d=>d.productivity-p.costWeight*d.cost/100)[0];
 return {metrics:[U.metric('可行方案',feasible.length,'组'),U.metric('Pareto方案',front.length,'组'),U.metric('推荐产能代理',best?.productivity??null),U.metric('推荐出砂分数',best?.risk??null)],recommendation:best?`候选孔密 ${best.n} 孔/m，相位 ${best.phase}°，穿深 ${best.depth} m。仅在非支配前沿按产能−成本权重×成本/100选点。`:'教学出砂约束下无可行方案。',note:'100组离散教学方案，响应是饱和连通与损害穿透代理，不是商用射孔产能模型。点颜色区分可行与前沿，前沿不是唯一最优。',charts:[U.chart('产能与成本非支配前沿','成本 / 教学单位','产能代理',[U.series('所有方案',rows.map(d=>[d.cost,d.productivity]),true),U.series('Pareto',front.map(d=>[d.cost,d.productivity]),true),U.series('推荐',best?[[best.cost,best.productivity]]:[],true)]),U.chart('出砂约束与产能','出砂分数','产能代理',[U.series('可行',feasible.map(d=>[d.risk,d.productivity]),true),U.series('不满足约束',rows.filter(d=>d.risk>p.risk).map(d=>[d.risk,d.productivity]),true)])],rows,audit:{front,best,feasible:feasible.length}};
};
const defaults={"damage":0.25,"strength":70,"risk":0.5,"costWeight":0.25};
function run(inputs={}){const p={...defaults,...inputs};config.controls.forEach(c=>{if(!Number.isFinite(Number(p[c.key])))throw new Error('参数必须为有限数值：'+c.key);p[c.key]=U.clamp(Number(p[c.key]),c.min,c.max)});return algorithm(p,U)}
return {config,defaults,run};
});
