/* Fixed-seed synthetic teaching case. No network dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CaseModel=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
const config={
  "stage": "perforation",
  "scene": "p4",
  "id": "perforation-skin-inversion",
  "kind": "skin",
  "title": "多级压差表皮反演",
  "methods": [
    "ts",
    "opt"
  ],
  "topic": "射孔效果智能评估",
  "controls": [
    {
      "key": "kh",
      "label": "已知kh教学缩放",
      "min": 30,
      "max": 120,
      "step": 5,
      "value": 70
    },
    {
      "key": "noise",
      "label": "流量噪声幅值 / m³/d",
      "min": 0,
      "max": 10,
      "step": 0.5,
      "value": 3
    },
    {
      "key": "operating",
      "label": "比较工况压差 / MPa",
      "min": 2,
      "max": 12,
      "step": 0.5,
      "value": 8
    },
    {
      "key": "targetSkin",
      "label": "目标表皮情景",
      "min": 0,
      "max": 8,
      "step": 0.5,
      "value": 2
    }
  ],
  "background": "射孔效果通常需结合试井或产量压差资料解释。正表皮提示井筒附近流动受限，却可能来自损害、部分打开或射孔等多种原因。本例从多级压差—流量点反求教学产能指数与表皮，显示噪声带来的不确定性，再比较目标表皮情景的响应。",
  "visual": "压差流量直线及留出残差揭示拟合程度；多个物理机制可产生同一斜率，所以拟合好不能直接证明补孔一定有效。",
  "steps": [
    "多级压差样本构造",
    "产能指数最小二乘",
    "表皮与区间反演",
    "目标表皮情景比较"
  ],
  "details": [
    "生成21个教学压差点，前14拟合、后7留出。",
    "通过原点最小二乘拟合q=JΔp。",
    "用已知教学kh与固定几何项7反求表皮，以残差平方和/(n−1)估计零截距回归方差，近似传播斜率误差。",
    "固定比较压差展示当前与目标表皮情景产量，不做现场补孔决策。"
  ],
  "metric": "表皮=kh/J−7；测试MAE只在留出点计算。近似1.96区间假定kh精确、独立同方差残差，未覆盖地质参数误差。",
  "limit": "简化稳态线性关系忽略多相流、非达西、压力恢复和层间贡献；测试是同一虚拟井的压差点，不能称跨井泛化。表皮不能唯一归因射孔。",
  "refs": [
    "skin",
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
 const r=U.rng(),trueSkin=5.5,trueJ=p.kh/(7+trueSkin),rows=U.grid(2,12,.5).map((dp,i)=>({test:i+1,drawdown:dp,rate:Math.max(0,trueJ*dp+(r()-.5)*p.noise)})),train=rows.slice(0,14),test=rows.slice(14),J=train.reduce((s,d)=>s+d.drawdown*d.rate,0)/train.reduce((s,d)=>s+d.drawdown*d.drawdown,0),skin=p.kh/Math.max(J,.001)-7,residual=Math.sqrt(train.reduce((s,d)=>s+(d.rate-J*d.drawdown)**2,0)/(train.length-1)),jse=residual/Math.sqrt(train.reduce((s,d)=>s+d.drawdown*d.drawdown,0)),lo=p.kh/(J+1.96*jse)-7,hi=p.kh/Math.max(.001,J-1.96*jse)-7,projected=p.kh/(7+p.targetSkin)*p.operating;
 return {metrics:[U.metric('反演表皮',skin),U.metric('测试流量MAE',U.mae(test.map(d=>d.rate),test.map(d=>J*d.drawdown)),'m³/d'),U.metric('当前压差产量估计',J*p.operating,'m³/d'),U.metric('目标表皮情景产量',projected,'m³/d')],recommendation:`表皮教学区间约 ${lo.toFixed(2)}–${hi.toFixed(2)}，假定kh精确、零截距和近似独立同方差噪声。目标表皮情景仅作敏感性比较，不能据此决定补孔。`,note:'21个虚拟多级压差点，前14拟合、后7评价。拟合q=JΔp，再用J=kh/(7+s)反演；kh项含单位换算的教学缩放。地层损害、部分打开和射孔均能影响表皮，反演不能唯一归因射孔。',charts:[U.chart('压差试验与拟合','压差 / MPa','流量 / m³/d',[U.series('拟合样本',train.map(d=>[d.drawdown,d.rate]),true),U.series('留出点',test.map(d=>[d.drawdown,d.rate]),true),U.series('反演直线',[[2,J*2],[12,J*12]])]),U.chart('留出残差','试验序号','残差 / m³/d',[U.series('留出残差',test.map(d=>[d.test,d.rate-J*d.drawdown]))])],rows:rows.map(d=>({...d,prediction:J*d.drawdown})),audit:{J,skin,interval:[lo,hi],train:14,test:7}};
};
const defaults={"kh":70,"noise":3,"operating":8,"targetSkin":2};
function run(inputs={}){const p={...defaults,...inputs};config.controls.forEach(c=>{if(!Number.isFinite(Number(p[c.key])))throw new Error('参数必须为有限数值：'+c.key);p[c.key]=U.clamp(Number(p[c.key]),c.min,c.max)});return algorithm(p,U)}
return {config,defaults,run};
});
