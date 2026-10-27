/* Fixed-seed synthetic teaching case. No network dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CaseModel=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
const config={
  "stage": "production",
  "scene": "pr1",
  "id": "production-card-centroid",
  "kind": "card",
  "title": "示功图形态特征诊断",
  "methods": [
    "cv"
  ],
  "topic": "抽油机井工况诊断",
  "controls": [
    {
      "key": "type",
      "label": "合成形态编码 0正常 1欠充满 2漏失",
      "min": 0,
      "max": 2,
      "step": 1,
      "value": 1
    },
    {
      "key": "fill",
      "label": "欠充满形态转折比例",
      "min": 0.2,
      "max": 0.9,
      "step": 0.05,
      "value": 0.5
    },
    {
      "key": "noise",
      "label": "载荷噪声 / kN",
      "min": 0,
      "max": 12,
      "step": 0.5,
      "value": 4
    },
    {
      "key": "stroke",
      "label": "冲程 / m",
      "min": 1,
      "max": 5,
      "step": 0.25,
      "value": 3
    }
  ],
  "background": "示功图记录光杆载荷随位移的闭合轨迹，是有杆泵工况复核的重要入口。形状压缩成面积与上下半程载荷等特征后，可以用少量可解释模板先筛出异常。本例对三类理想化教学形态做最近质心分类，同时展示当前卡片和特征空间中的邻近关系。",
  "visual": "闭合曲线显示欠充满转折与漏失形态；特征散点解释分类依据。图是合成地面载荷形态，不能与真实井下泵卡等同。",
  "steps": [
    "虚拟井示功卡生成",
    "环面积与载荷特征",
    "最近质心分类",
    "整井留出混淆评价"
  ],
  "details": [
    "18虚拟井各9张卡，12井训练、6井测试。",
    "计算归一化闭合面积及上下载荷均值。",
    "仅按训练标签计算三类质心，欧氏距离分配类别。",
    "按未训练井计准确率与混淆矩阵，交互卡仅探索。"
  ],
  "metric": "准确率=测试井卡片分类正确数/测试总数；归一化面积除以冲程×35kN，不受冲程量纲直接放大。",
  "limit": "未实现CNN、杆柱波动方程或复合故障识别。虚构三类形态未覆盖气锁、断脱、结蜡等全部故障，真实诊断需作业结论校验。",
  "refs": [
    "card",
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
 const r=U.rng(),names=['充满较好','供液不足','漏失形态'],shape=(type,fill,noise)=>Array.from({length:65},(_,i)=>{let t=i/64*2*Math.PI,x=(1-Math.cos(t))*p.stroke/2,up=t<=Math.PI,y=up?(type===1?(.3+.7*U.clamp(x/(p.stroke*fill),0,1)):type===2?(.85-.35*x/p.stroke):1):(type===2?.28+.25*x/p.stroke:.2);return [x,20+35*y+(r()-.5)*noise]}),features=curve=>{let area=0;for(let i=1;i<curve.length;i++)area+=(curve[i][0]-curve[i-1][0])*(curve[i][1]+curve[i-1][1])/2;return [Math.abs(area)/(p.stroke*35),U.mean(curve.slice(0,16).map(d=>d[1]))/60,U.mean(curve.slice(33,49).map(d=>d[1]))/60]};let train=[],test=[];for(let well=0;well<18;well++)for(let j=0;j<9;j++){let type=j%3,curve=shape(type,.4+.3*r(),3+3*r()),row={well,type,x:features(curve)};(well<12?train:test).push(row)}let cent=names.map((_,i)=>[0,1,2].map(j=>U.mean(train.filter(d=>d.type===i).map(d=>d.x[j])))),predict=x=>{let dist=cent.map(c=>Math.sqrt(c.reduce((s,v,j)=>s+(v-x[j])**2,0)));return dist.indexOf(Math.min(...dist))},curve=shape(Math.round(p.type),p.fill,p.noise),label=predict(features(curve)),cm=names.map(()=>[0,0,0]);test.forEach(d=>cm[d.type][predict(d.x)]++);
 return {metrics:[U.metric('留井分类准确率',100*cm.reduce((s,row,i)=>s+row[i],0)/test.length,'%'),U.metric('当前归一化面积',features(curve)[0]),U.metric('独立测试井',6,'口'),U.metric('模板类别',3,'种')],recommendation:'当前最近质心诊断：'+names[label]+'。仅识别三个理想化形态，真实地面示功图需考虑杆柱波动、气体和复合故障；不自动开停井。',note:'按18虚拟井切分12训练/6测试，各9张。以环面积、上下载荷均值做最近质心分类；没有使用CNN，当前探索卡由独立随机数后续生成。',charts:[U.chart('当前教学示功图','光杆位移 / m','载荷 / kN',[U.series('闭合卡片',curve)]),U.chart('形态特征空间','归一化面积','上半程均载 / 60',names.map((n,i)=>U.series(n,train.filter(d=>d.type===i).map(d=>[d.x[0],d.x[1]]),true)).concat(U.series('当前卡片',[[features(curve)[0],features(curve)[1]]],true)))],rows:test.map(d=>({well:d.well,type:d.type,prediction:predict(d.x),area:d.x[0]})),audit:{centroids:cent,confusion:cm,trainWells:12,testWells:6}};
};
const defaults={"type":1,"fill":0.5,"noise":4,"stroke":3};
function run(inputs={}){const p={...defaults,...inputs};config.controls.forEach(c=>{if(!Number.isFinite(Number(p[c.key])))throw new Error('参数必须为有限数值：'+c.key);p[c.key]=U.clamp(Number(p[c.key]),c.min,c.max)});return algorithm(p,U)}
return {config,defaults,run};
});
