/* Fixed-seed synthetic teaching case. No network dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CaseModel=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
const config={
  "stage": "production",
  "scene": "pr2",
  "id": "production-decline-selection",
  "kind": "decline",
  "title": "递减曲线时间留出预测",
  "methods": [
    "ts"
  ],
  "topic": "产量智能预测",
  "controls": [
    {
      "key": "qi",
      "label": "初始合成油率 / m³/d",
      "min": 30,
      "max": 150,
      "step": 5,
      "value": 90
    },
    {
      "key": "decline",
      "label": "合成递减参数 / d",
      "min": 0.002,
      "max": 0.025,
      "step": 0.001,
      "value": 0.012
    },
    {
      "key": "noise",
      "label": "观测噪声幅值 / m³/d",
      "min": 0,
      "max": 16,
      "step": 1,
      "value": 6
    },
    {
      "key": "horizon",
      "label": "未来预测 / 天",
      "min": 7,
      "max": 90,
      "step": 1,
      "value": 30
    }
  ],
  "background": "产量递减预测可支持短期生产安排，但稳定工况趋势不能直接解释措施因果。本例比较指数与不同双曲递减形状，用早期历史拟合、较晚窗口选型、末期数据评价，展示时间外推误差和常数基线，避免随机打散时间造成乐观成绩。",
  "visual": "历史、拟合与未来延拓按时间排列；测试残差帮助发现系统性偏差。未来线没有实测观测，不把预测累计量写成已实现产量。",
  "steps": [
    "生产历史时间划分",
    "递减候选拟合",
    "验证窗口选择",
    "测试评价与未来延拓"
  ],
  "details": [
    "120天合成历史按60训练、20验证、40测试划分。",
    "枚举b=0/0.3/0.6/1及D网格，只在训练段求最优初始量。",
    "以验证MAE选择候选，测试不参与选择。",
    "报告末40天MAE和末7训练日常数基线，再预测未来。"
  ],
  "metric": "测试MAE与常数基线使用相同末期窗口；未来累计是逐天预测率求和。仅在同工况递减假设内成立，不给虚假置信区间。",
  "limit": "未使用时序神经网络、协变量或因果归因。未建模措施、停井、注采响应和非边界控制流，短历史与趋势突变会使外推失效。",
  "refs": [
    "production",
    "leakage"
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
 const r=U.rng(),data=Array.from({length:120},(_,t)=>({t,q:Math.max(.1,p.qi/(1+.6*p.decline*t)**(1/.6)+(r()-.5)*p.noise)})),train=data.slice(0,60),valid=data.slice(60,80),test=data.slice(80),candidates=[];
 for(let b of [0,.3,.6,1])for(let D of U.grid(.001,.03,.001)){let basis=t=>b===0?Math.exp(-D*t):(1+b*D*t)**(-1/b),qi=train.reduce((s,d)=>s+basis(d.t)*d.q,0)/train.reduce((s,d)=>s+basis(d.t)**2,0),mae=U.mae(valid.map(d=>d.q),valid.map(d=>qi*basis(d.t)));candidates.push({b,D,qi,mae})}let best=[...candidates].sort((a,b)=>a.mae-b.mae)[0],pred=t=>best.qi*(best.b===0?Math.exp(-best.D*t):(1+best.b*best.D*t)**(-1/best.b)),future=Array.from({length:Math.round(p.horizon)},(_,i)=>({t:120+i,q:pred(120+i)})),constant=U.mean(train.slice(-7).map(d=>d.q));
 return {metrics:[U.metric('时间留出MAE',U.mae(test.map(d=>d.q),test.map(d=>pred(d.t))),'m³/d'),U.metric('末7日常数基线MAE',U.mae(test.map(d=>d.q),test.map(()=>constant)),'m³/d'),U.metric('选中递减指数b',best.b),U.metric('未来累计产量代理',future.reduce((s,d)=>s+d.q,0),'m³')],recommendation:`验证窗选择 b=${best.b}、D=${best.D.toFixed(3)}/d。未来 ${p.horizon} 天按相同工况延拓；遇到措施、停井与注水变化须重建分段模型。`,note:'120天合成历史，0–59训练、60–79验证、80–119测试；测试不参与拟合或选型。当前控件反复探索后指标仅为教学对比，不是新独立现场评估。',charts:[U.chart('历史与递减预测','相对天数','油率 / m³/d',[U.series('合成观测',data.map(d=>[d.t,d.q]),true),U.series('模型',U.grid(0,119,1).map(t=>[t,pred(t)])),U.series('未来',future.map(d=>[d.t,d.q]))]),U.chart('测试残差','相对天数','观测−预测 / m³/d',[U.series('残差',test.map(d=>[d.t,d.q-pred(d.t)]))])],rows:data.map(d=>({...d,prediction:pred(d.t),split:d.t<60?'train':d.t<80?'validation':'test'})).concat(future.map(d=>({...d,prediction:d.q,split:'forecast'}))),audit:{best,trainEnd:59,validationEnd:79,testStart:80}};
};
const defaults={"qi":90,"decline":0.012,"noise":6,"horizon":30};
function run(inputs={}){const p={...defaults,...inputs};config.controls.forEach(c=>{if(!Number.isFinite(Number(p[c.key])))throw new Error('参数必须为有限数值：'+c.key);p[c.key]=U.clamp(Number(p[c.key]),c.min,c.max)});return algorithm(p,U)}
return {config,defaults,run};
});
