/* Fixed-seed synthetic teaching case. No network dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CaseModel=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
const config={
  "stage": "perforation",
  "scene": "p2",
  "id": "perforation-tunnel-ridge",
  "kind": "tunnel",
  "title": "孔道尺寸回归代理",
  "methods": [
    "opt"
  ],
  "topic": "射孔孔道形态预测",
  "controls": [
    {
      "key": "energy",
      "label": "教学能量编码",
      "min": 30,
      "max": 120,
      "step": 2,
      "value": 80
    },
    {
      "key": "strength",
      "label": "靶件强度编码 / MPa",
      "min": 15,
      "max": 100,
      "step": 5,
      "value": 50
    },
    {
      "key": "stress",
      "label": "围压编码 / MPa",
      "min": 5,
      "max": 65,
      "step": 5,
      "value": 30
    },
    {
      "key": "target",
      "label": "教学穿深目标 / m",
      "min": 0.1,
      "max": 1.2,
      "step": 0.05,
      "value": 0.6
    }
  ],
  "background": "射孔孔道的有效穿深受靶件强度、围压与弹型性能影响，少量靶试需要与井下条件区分。代理模型可以快速比较编码组合，但不能把常压靶试直接当井下实效。本例以多批虚拟试验拟合穿深，按批留出评价，并显示能量响应与目标的交点。",
  "visual": "合成与预测穿深散点体现留出误差；能量响应曲线只覆盖训练参数范围，推荐是满足目标的最小候选编码。孔道尺寸示意按预测穿深与入口径构造收尖轮廓，不代表三维CT。",
  "steps": [
    "虚拟靶试批次生成",
    "多项式特征构造",
    "固定正则岭回归",
    "留批评价与目标反求"
  ],
  "details": [
    "12批各20样本；8批拟合、4批测试。",
    "构造截距、能量、强度、围压、能量平方及能量×强度项。",
    "固定L2正则求解正规方程，未以测试集选择系数。",
    "比较测试MAE与训练均值基线，再枚举编码反求穿深目标。"
  ],
  "metric": "MAE=测试穿深绝对残差均值；均值基线只用训练穿深均值。推荐目标由同一回归模型计算，不使用生成真值直接推荐。",
  "limit": "实现穿深和入口孔径两个回归目标，收尖轮廓为几何示意；没有清洁度或三维形态预测。虚拟批次没有真实材料域差异，留批成绩不能外推真实靶试，能量编码不是装药参数。",
  "refs": [
    "perf",
    "charge",
    "ridge",
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
 const r=U.rng(),truth=(energy,strength,stress)=>.15+.012*energy-.003*strength-.002*stress+.000018*energy*energy-.000035*energy*strength,feature=(e,s,t)=>[1,e/100,s/100,t/100,(e/100)**2,e*s/10000],data=[];for(let batch=0;batch<12;batch++)for(let i=0;i<20;i++){let energy=30+90*r(),strength=15+85*r(),stress=5+60*r(),depth=Math.max(.02,truth(energy,strength,stress)+(r()-.5)*.06),diameter=Math.max(3,7+.065*energy-.018*strength-.012*stress+(r()-.5)*.8);data.push({batch,energy,strength,stress,depth,diameter})}let tr=data.filter(d=>d.batch<8),te=data.filter(d=>d.batch>=8),X=tr.map(d=>feature(d.energy,d.strength,d.stress)),w=U.fit(X,tr.map(d=>d.depth),.005),wd=U.fit(X,tr.map(d=>d.diameter),.005),predict=(e,s,t)=>Math.max(.02,U.dot(w,feature(e,s,t))),diam=(e,s,t)=>Math.max(3,U.dot(wd,feature(e,s,t))),pred=predict(p.energy,p.strength,p.stress),diameter=diam(p.energy,p.strength,p.stress),rows=te.map(d=>({...d,prediction:predict(d.energy,d.strength,d.stress),predictedDiameter:diam(d.energy,d.strength,d.stress)})),candidate=U.grid(30,120,1).find(e=>predict(e,p.strength,p.stress)>=p.target),outline=U.grid(0,1,.025).map(t=>[pred*t,diameter/2*Math.sqrt(1-t)]);
 return {metrics:[U.metric('预测穿深',pred,'m'),U.metric('按批穿深MAE',U.mae(rows.map(d=>d.depth),rows.map(d=>d.prediction)),'m'),U.metric('预测入口孔径',diameter,'mm'),U.metric('孔径留批MAE',U.mae(rows.map(d=>d.diameter),rows.map(d=>d.predictedDiameter)),'mm'),U.metric('均值基线穿深MAE',U.mae(rows.map(d=>d.depth),rows.map(()=>U.mean(tr.map(d=>d.depth)))),'m')],recommendation:candidate?`达到教学穿深目标的最小候选能量编码 ${candidate}。能量编码不是炸药用量或现场装药建议。`:'候选编码范围内达不到穿深目标。',note:'12个虚拟靶试批次，8批训练、4批留出。两个6项岭回归分别预测穿深与孔径，正则固定不使用测试选型。孔道轮廓按预测尺寸的平方根收尖形态示意，未模拟真实爆轰或三维CT。',charts:[U.chart('孔道预测尺寸示意','距入口轴向距离 / m','半径 / mm',[U.series('上边界',outline),U.series('下边界',outline.map(d=>[d[0],-d[1]]))]),U.chart('测试靶试穿深预测','合成穿深 / m','预测穿深 / m',[U.series('留出批次',rows.map(d=>[d.depth,d.prediction]),true),U.series('理想一致线',[[0,0],[1.6,1.6]])]),U.chart('能量编码响应','教学能量编码','预测穿深 / m',[U.series('回归预测',U.grid(30,120,2).map(e=>[e,predict(e,p.strength,p.stress)])),U.series('教学目标',[[30,p.target],[120,p.target]])])],rows,audit:{weights:w,diameterWeights:wd,trainBatches:[0,1,2,3,4,5,6,7],testBatches:[8,9,10,11],candidate}};
};
const defaults={"energy":80,"strength":50,"stress":30,"target":0.6};
function run(inputs={}){const p={...defaults,...inputs};config.controls.forEach(c=>{if(!Number.isFinite(Number(p[c.key])))throw new Error('参数必须为有限数值：'+c.key);p[c.key]=U.clamp(Number(p[c.key]),c.min,c.max)});return algorithm(p,U)}
return {config,defaults,run};
});
