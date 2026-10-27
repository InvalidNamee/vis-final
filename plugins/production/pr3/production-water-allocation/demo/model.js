/* Fixed-seed synthetic teaching case. No network dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CaseModel=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
const config={
  "stage": "production",
  "scene": "pr3",
  "id": "production-water-allocation",
  "kind": "injection",
  "title": "分层注水边际收益调配",
  "methods": [
    "opt"
  ],
  "topic": "智能注水调配",
  "controls": [
    {
      "key": "total",
      "label": "总配注预算 / m³/d",
      "min": 100,
      "max": 420,
      "step": 5,
      "value": 300
    },
    {
      "key": "cap",
      "label": "第一层吸水上限 / m³/d",
      "min": 40,
      "max": 180,
      "step": 5,
      "value": 120
    },
    {
      "key": "water",
      "label": "第一层含水编码",
      "min": 0.1,
      "max": 0.9,
      "step": 0.05,
      "value": 0.65
    }
  ],
  "background": "分层注水分配需要在有限水量与不同层段吸水能力之间权衡。已经高含水的优势通道继续增注，未必产生最大的增油响应。本例以三层边际递减的响应代理，在总量和层上限约束下分配小步水量，展示层间调整对整体目标的影响。",
  "visual": "分层配注与上限比较标出受限层；凹响应曲线显示继续增注的边际价值逐渐降低，因此最优不等于平均分配。",
  "steps": [
    "层段凹响应定义",
    "可分配预算离散",
    "最大边际收益分配",
    "等配方案约束对照"
  ],
  "details": [
    "为三层定义吸水上限、含水编码和递减收益代理。",
    "总量以5m³/d离散，预算不足、容量用满或最大边际收益不为正则停止。",
    "每步选增配后目标增量最大的未满层，仅正收益时分配。",
    "输出各层配注、未分配量与等配目标，同时展示上限。"
  ],
  "metric": "目标=Σ[增益×(1−含水)×70×(1−exp(−q/70))−0.0005q²]；在总量不超过预算、同一分层凹函数和等步长下，正边际贪心分配是离散最优；允许保留水量。",
  "limit": "未模拟层间串流、注采滞后、压力或破裂；等配基线可能越过单层上限，不能当现场可行方案。所有收益是教学代理。",
  "refs": [
    "waterflood"
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
 const cap=[p.cap,160,140],gain=[1.2,.9,1.1],water=[p.water,.5,.3],benefit=(q,i)=>gain[i]*(1-water[i])*70*(1-Math.exp(-q/70))-.0005*q*q;let allocation=[0,0,0],budget=Math.round(p.total/5)*5;for(let used=0;used<budget;used+=5){let choices=[0,1,2].filter(i=>allocation[i]+5<=cap[i]);if(!choices.length)break;let i=U.rank(choices,i=>benefit(allocation[i]+5,i)-benefit(allocation[i],i))[0];if(benefit(allocation[i]+5,i)-benefit(allocation[i],i)<=0)break;allocation[i]+=5}let baseline=[budget/3,budget/3,budget/3],rows=[0,1,2].map(i=>({layer:i+1,allocation:allocation[i],baseline:baseline[i],cap:cap[i],benefit:benefit(allocation[i],i),baselineBenefit:benefit(baseline[i],i)})),net=rows.reduce((s,d)=>s+d.benefit,0);
 return {metrics:[U.metric('优化稳油代理',net),U.metric('等配稳油代理',rows.reduce((s,d)=>s+d.baselineBenefit,0)),U.metric('已分配注水',U.mean(allocation)*3,'m³/d'),U.metric('未分配预算',budget-allocation.reduce((s,v)=>s+v,0),'m³/d')],recommendation:'分层教学配注：'+allocation.map((q,i)=>'层'+(i+1)+' '+q+' m³/d').join('、')+'。离散凹收益按最大边际收益逐步分配5 m³/d，总量不超过预算；最大边际收益不再为正时保留未分配额度。',note:'三层无交叉耦合的凹注采响应代理；等配可能违反层吸水上限，单独展示。未模拟真实连通系数、压裂压力、滞后与地层压力；不得作为配注指令。',charts:[U.chart('分层配注量','层号','注水 / m³/d',[U.series('优化',rows.map(d=>[d.layer,d.allocation])),U.series('等配',rows.map(d=>[d.layer,d.baseline])),U.series('吸水上限',rows.map(d=>[d.layer,d.cap]))]),U.chart('分层边际响应','配注 / m³/d','净稳油代理',[0,1,2].map(i=>U.series('层'+(i+1),U.grid(0,cap[i],5).map(q=>[q,benefit(q,i)]))))],rows,audit:{allocation,cap,budget,net}};
};
const defaults={"total":300,"cap":120,"water":0.65};
function run(inputs={}){const p={...defaults,...inputs};config.controls.forEach(c=>{if(!Number.isFinite(Number(p[c.key])))throw new Error('参数必须为有限数值：'+c.key);p[c.key]=U.clamp(Number(p[c.key]),c.min,c.max)});return algorithm(p,U)}
return {config,defaults,run};
});
