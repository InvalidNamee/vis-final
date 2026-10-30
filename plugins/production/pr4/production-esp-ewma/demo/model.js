/* Fixed-seed synthetic teaching case. No network dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CaseModel=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
const config={
  "stage": "production",
  "scene": "pr4",
  "id": "production-esp-ewma",
  "kind": "esp",
  "title": "电泵电流温度渐变监测",
  "methods": [
    "ts"
  ],
  "topic": "电潜泵故障预警",
  "controls": [
    {
      "key": "drift",
      "label": "每分钟退化漂移 / A",
      "min": 0.01,
      "max": 0.18,
      "step": 0.01,
      "value": 0.08
    },
    {
      "key": "alpha",
      "label": "EWMA当前权重",
      "min": 0.05,
      "max": 0.8,
      "step": 0.05,
      "value": 0.25
    },
    {
      "key": "threshold",
      "label": "教学异常分数阈值",
      "min": 1,
      "max": 5,
      "step": 0.25,
      "value": 2.5
    },
    {
      "key": "persist",
      "label": "持续超限 / min",
      "min": 1,
      "max": 8,
      "step": 1,
      "value": 3
    }
  ],
  "background": "电潜泵退化可能在电流和温度曲线上缓慢显现，而运行频率改变也会产生相似信号。监测首先要建立可比的正常基线，再跟踪多通道偏移。本例使用仅由早期正常段计算的尺度和因果EWMA，展示报警延迟与误报权衡，报警进入人工复核。",
  "visual": "原始电流温度曲线与平滑异常分数并列，100min为合成退化起点；报警标记只由当时及过去样本计算。",
  "steps": [
    "正常基线标定",
    "多通道标准化",
    "因果EWMA与持续报警",
    "监测窗延迟误报评价"
  ],
  "details": [
    "0–59min仅用于正常均值与标准差，不混入退化段。",
    "电流及温度分别换算成相对基线偏移。",
    "递推EWMA，取最大绝对分数并要求连续超限。",
    "在60–179min评价，正常40min计误报、退化80min计召回。"
  ],
  "metric": "检出延迟=退化窗首次持续报警时间−100；无报警显示不可定义。分数不是概率，召回按相关分钟样本计算而非独立故障事件。",
  "limit": "没有真实设备寿命标签，不能报告提前失效小时数。未区分气锁、结垢、电机绝缘与传感器漂移；正常工况切换需重新标定。",
  "refs": [
    "esp",
    "ewma"
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
 const r=U.rng(),data=Array.from({length:180},(_,t)=>({t,current:45+(r()-.5)*3+(t>=100?(t-100)*p.drift:0),temperature:80+(r()-.5)*4+(t>=100?(t-100)*p.drift*.8:0)})),base=data.slice(0,60),mu=[U.mean(base.map(d=>d.current)),U.mean(base.map(d=>d.temperature))],sd=[U.sd(base.map(d=>d.current)),U.sd(base.map(d=>d.temperature))];let z=[0,0],count=0;let rows=data.map(d=>{let raw=[(d.current-mu[0])/sd[0],(d.temperature-mu[1])/sd[1]];z=z.map((v,i)=>p.alpha*raw[i]+(1-p.alpha)*v);let score=Math.max(...z.map(Math.abs)),alarm=d.t>=60&&score>=p.threshold;count=alarm?count+1:0;return {...d,score,alarm:count>=p.persist,label:d.t>=100}}),evalRows=rows.slice(60),tp=evalRows.filter(d=>d.label&&d.alarm).length,fp=evalRows.filter(d=>!d.label&&d.alarm).length,first=rows.find(d=>d.t>=100&&d.alarm),actualFirst=evalRows.find(d=>d.alarm),falseRate=100*fp/40;
 return {metrics:[U.metric('监测段召回率',100*tp/80,'%'),U.metric('正常监测段误报率',falseRate,'%'),U.metric('首次有效检出延迟',first?first.t-100:null,'min'),U.metric('基线电流均值',mu[0],'A')],recommendation:actualFirst?`监测窗首次持续报警在 ${actualFirst.t} min。复核传感器、频率工况及泵运行资料；不自动停泵。全部报警均已绘出，包括可能的正常段误报；评价延迟另外使用合成标签计算。`:'监测窗内未形成持续报警，继续监测；不能据此证明设备无故障。',note:'前60min仅校准，60–99正常监测、100–179渐变。EWMA只用当前及过去信息；阈值为最大标准化通道分数，不是故障概率或NIST正态控制限。合成异常起点不是失效时间。',charts:[U.chart('电泵标准化监测','时间 / min','相对正常基线 / 标准差',[U.series('电流z分数',data.map(d=>[d.t,(d.current-mu[0])/sd[0]])),U.series('温度z分数',data.map(d=>[d.t,(d.temperature-mu[1])/sd[1]]))]),U.chart('平滑异常分数','时间 / min','最大绝对EWMA',[U.series('分数',rows.map(d=>[d.t,d.score])),U.series('教学阈值',[[60,p.threshold],[179,p.threshold]]),U.series('持续报警',rows.filter(d=>d.alarm).map(d=>[d.t,d.score]),true)])],rows,audit:{mu,sd,tp,fp,firstTrue:first?.t??null,actualFirst:actualFirst?.t??null,baseline:[0,59],monitor:[60,179]}};
};
const defaults={"drift":0.08,"alpha":0.25,"threshold":2.5,"persist":3};
function run(inputs={}){const p={...defaults,...inputs};config.controls.forEach(c=>{if(!Number.isFinite(Number(p[c.key])))throw new Error('参数必须为有限数值：'+c.key);p[c.key]=U.clamp(Number(p[c.key]),c.min,c.max)});return algorithm(p,U)}
return {config,defaults,run};
});
