/* Fixed-seed synthetic teaching case. No network dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CaseModel=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
const config={
  "stage": "cementing",
  "scene": "c3",
  "id": "cement-loss-logistic",
  "kind": "loss",
  "title": "漏失风险逻辑回归",
  "methods": [
    "opt"
  ],
  "topic": "固井漏失风险预测",
  "controls": [
    {
      "key": "window",
      "label": "压力窗宽 / g/cm³",
      "min": 0.07,
      "max": 0.57,
      "step": 0.01,
      "value": 0.25
    },
    {
      "key": "rate",
      "label": "排量 / m³/min",
      "min": 0.5,
      "max": 4,
      "step": 0.1,
      "value": 2.5
    },
    {
      "key": "fracture",
      "label": "裂缝指示代理",
      "min": 0,
      "max": 1,
      "step": 0.05,
      "value": 0.6
    },
    {
      "key": "threshold",
      "label": "教学分数阈值",
      "min": 0.1,
      "max": 0.9,
      "step": 0.05,
      "value": 0.5
    }
  ],
  "background": "施工前的漏失复核需要同时考虑压力窗口、流动压耗与裂缝发育。漏失记录通常不平衡，简单报告准确率容易掩盖漏判。本例训练带正则的逻辑回归，用可调阈值展示召回与误报的变化，并比较当前井况下各排量的风险分数。",
  "visual": "排量响应显示分数与阈值交点；测试井的标签与预测分数并列，便于辨认高分误报与低分漏报。",
  "steps": [
    "井次分组与标签生成",
    "正则逻辑回归拟合",
    "留井分数评价",
    "阈值内排量筛选"
  ],
  "details": [
    "36虚拟井次整井划分24训练、12测试。",
    "训练集梯度下降拟合截距与三项特征；L2强度固定。",
    "按测试标签计算Brier、召回率与正常井误报率。",
    "枚举排量并保留低于当前阈值的候选，不修改模型。"
  ],
  "metric": "Brier=平均(预测分数−0/1标签)²；召回率=TP/(TP+FN)，误报率=FP/(FP+TN)，分母为零显示不可定义。",
  "limit": "小样本合成概率未经现场校准，不是工程漏失概率；模型没有学习真实地层破裂力学。阈值探索不相当于获得新独立测试。",
  "refs": [
    "cement",
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
 const r=U.rng(),data=[];for(let well=0;well<36;well++){let window=.07+.5*r(),rate=.5+3.5*r(),fracture=r(),z=-3+8*(.28-window)+.6*rate+1.7*fracture;data.push({well,window,rate,fracture,y:r()<1/(1+Math.exp(-z))?1:0})}
 const tr=data.slice(0,24),te=data.slice(24),feat=d=>[1,(d.window-.3)/.2,(d.rate-2)/2,d.fracture],w=[0,0,0,0];for(let iter=0;iter<1600;iter++){let g=[0,0,0,0];tr.forEach(d=>{let x=feat(d),e=1/(1+Math.exp(-U.dot(w,x)))-d.y;x.forEach((v,i)=>g[i]+=e*v/tr.length)});w.forEach((v,i)=>w[i]-=.08*(g[i]+(i?.03*v:0)))}
 const prob=d=>1/(1+Math.exp(-U.dot(w,feat(d)))),cur=prob({window:p.window,rate:p.rate,fracture:p.fracture}),cm={tp:0,fp:0,tn:0,fn:0};te.forEach(d=>cm[d.y?(prob(d)>=p.threshold?'tp':'fn'):(prob(d)>=p.threshold?'fp':'tn')]++);let alternatives=U.grid(.5,4,.1).map(rate=>({rate,risk:prob({window:p.window,rate,fracture:p.fracture})})),ok=alternatives.filter(d=>d.risk<p.threshold),best=ok.at(-1);
 return {metrics:[U.metric('模型漏失分数',100*cur,'%'),U.metric('留井Brier',U.mean(te.map(d=>(prob(d)-d.y)**2))),U.metric('测试召回率',cm.tp+cm.fn?100*cm.tp/(cm.tp+cm.fn):null,'%'),U.metric('测试误报率',cm.fp+cm.tn?100*cm.fp/(cm.fp+cm.tn):null,'%')],recommendation:best?`分数低于教学阈值的最大候选排量 ${best.rate.toFixed(1)} m³/min。该分数未现场校准，不是作业许可。`:'没有满足当前教学分数阈值的候选排量。',note:'36虚拟井次，前24训练、后12测试；逻辑回归全批梯度+L2。标签由带随机性的合成概率生成，风险阈值不参与拟合。小样本指标仅展示权衡。',charts:[U.chart('排量与漏失分数','排量 / m³/min','分数 / %',[U.series('当前井况',alternatives.map(d=>[d.rate,100*d.risk])),U.series('教学阈值',[[.5,p.threshold*100],[4,p.threshold*100]])]),U.chart('测试预测与标签','测试井序号','分数与标签',[U.series('模型分数',te.map((d,i)=>[i,prob(d)])),U.series('合成标签',te.map((d,i)=>[i,d.y]),true)])],rows:te.map(d=>({...d,prediction:prob(d)})),audit:{weights:w,confusion:cm,best}};
};
const defaults={"window":0.25,"rate":2.5,"fracture":0.6,"threshold":0.5};
function run(inputs={}){const p={...defaults,...inputs};config.controls.forEach(c=>{if(!Number.isFinite(Number(p[c.key])))throw new Error('参数必须为有限数值：'+c.key);p[c.key]=U.clamp(Number(p[c.key]),c.min,c.max)});return algorithm(p,U)}
return {config,defaults,run};
});
