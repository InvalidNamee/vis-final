/* Fixed-seed synthetic teaching case. No network dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CaseModel=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
const config={
  "stage": "cementing",
  "scene": "c1",
  "id": "cement-bond-knn",
  "kind": "bond",
  "title": "胶结测井特征分类",
  "methods": [
    "cv",
    "ts"
  ],
  "topic": "固井质量智能评价",
  "controls": [
    {
      "key": "amp",
      "label": "CBL幅度 / mV",
      "min": 0,
      "max": 110,
      "step": 1,
      "value": 40
    },
    {
      "key": "att",
      "label": "声波衰减 / dB",
      "min": 0,
      "max": 22,
      "step": 0.5,
      "value": 11
    },
    {
      "key": "k",
      "label": "近邻数",
      "min": 1,
      "max": 15,
      "step": 2,
      "value": 5
    }
  ],
  "background": "水泥环承担套管外的层间封隔。CBL套管波幅降低、声波衰减增强通常反映胶结改善，但单条曲线不能识别完整周向通道，微环隙也会造成歧义。本例把幅度与衰减构成二维特征，借助已标注虚拟井段近邻对当前点做辅助分级，用相邻证据解释分类而不是只给颜色。",
  "visual": "二维点云展示胶结等级重叠，当前点落在混合区时邻域一致率降低；分类不能替代VDL、超声和施工资料联合解释。",
  "steps": [
    "虚拟井组划分",
    "训练尺度计算",
    "近邻投票分级",
    "留井混淆评价"
  ],
  "details": [
    "生成带井号、微环隙扰动的胶结特征，整井留出。",
    "仅从10口训练井计算两维均值与标准差。",
    "标准化距离选k个邻居，统计三类标签票数。",
    "5口未参与拟合的井累计真实与预测等级混淆计数。"
  ],
  "metric": "准确率=混淆矩阵对角线之和/测试段数；邻域一致率=max类别票数/k，是一致性而非概率。",
  "limit": "虚拟标签来自教学胶结状态，不是验窜真值。未处理快速地层、仪器偏心、周向通道或真实VDL图像；不宣称CNN识别。",
  "refs": [
    "bond",
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
 const r=U.rng(),data=[];for(let well=0;well<15;well++)for(let j=0;j<24;j++){let bond=r(),micro=r()<.15?1:0,amp=U.clamp(90*(1-bond)+micro*20+(r()-.5)*16,0,110),att=2+16*bond-micro*3+(r()-.5)*4;data.push({well,amp,att,label:bond>.65?2:bond>.32?1:0})}
 const train=data.filter(d=>d.well<10),test=data.filter(d=>d.well>=10),mu=[U.mean(train.map(d=>d.amp)),U.mean(train.map(d=>d.att))],sd=[U.sd(train.map(d=>d.amp)),U.sd(train.map(d=>d.att))];
 const predict=x=>{let near=train.map(d=>({d,dist:((d.amp-x.amp)/sd[0])**2+((d.att-x.att)/sd[1])**2})).sort((a,b)=>a.dist-b.dist).slice(0,p.k);let votes=[0,0,0];near.forEach(x=>votes[x.d.label]++);return {label:votes.indexOf(Math.max(...votes)),votes,near}};
 let cm=Array.from({length:3},()=>[0,0,0]);test.forEach(d=>cm[d.label][predict(d).label]++);const hit=cm.reduce((s,row,i)=>s+row[i],0),cur=predict({amp:p.amp,att:p.att}),names=['弱胶结','部分胶结','较好胶结'];
 return {metrics:[U.metric('留井测试准确率',100*hit/test.length,'%'),U.metric('测试井数',5,'口'),U.metric('邻域一致率',100*Math.max(...cur.votes)/p.k,'%')],recommendation:'当前解释：'+names[cur.label]+'；邻域一致率为投票比例，不是已校准概率。微环隙与快速地层需联合复核。',note:'15口教学虚拟井，每井24段；10井训练、5井测试。k由用户探索，不宣称独立调参后泛化结论。',charts:[U.chart('胶结特征与当前样本','CBL幅度 / mV','衰减 / dB',names.map((n,i)=>U.series(n,train.filter(d=>d.label===i).map(d=>[d.amp,d.att]),true)).concat(U.series('当前样本',[[p.amp,p.att]],true))),U.chart('测试混淆计数','真实等级 × 预测等级编码','段数',[U.series('计数',cm.flatMap((row,i)=>row.map((v,j)=>[i*3+j,v])))])],rows:test.map(d=>({...d,prediction:predict(d).label})),audit:{trainWells:[0,1,2,3,4,5,6,7,8,9],testWells:[10,11,12,13,14],confusion:cm}};
};
const defaults={"amp":40,"att":11,"k":5};
function run(inputs={}){const p={...defaults,...inputs};config.controls.forEach(c=>{if(!Number.isFinite(Number(p[c.key])))throw new Error('参数必须为有限数值：'+c.key);p[c.key]=U.clamp(Number(p[c.key]),c.min,c.max)});return algorithm(p,U)}
return {config,defaults,run};
});
