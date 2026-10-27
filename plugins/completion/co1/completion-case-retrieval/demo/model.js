/* Fixed-seed synthetic teaching case. No network dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CaseModel=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
const config={
  "stage": "completion",
  "scene": "co1",
  "id": "completion-case-retrieval",
  "kind": "completion",
  "title": "完井相似案例排序",
  "methods": [
    "kg",
    "opt"
  ],
  "topic": "完井方式智能优选",
  "controls": [
    {
      "key": "perm",
      "label": "渗透率 / mD",
      "min": 20,
      "max": 820,
      "step": 20,
      "value": 240
    },
    {
      "key": "sand",
      "label": "出砂倾向编码",
      "min": 0,
      "max": 1,
      "step": 0.05,
      "value": 0.6
    },
    {
      "key": "water",
      "label": "出水风险编码",
      "min": 0,
      "max": 1,
      "step": 0.05,
      "value": 0.3
    },
    {
      "key": "penalty",
      "label": "出砂惩罚权重",
      "min": 0,
      "max": 3,
      "step": 0.1,
      "value": 1.5
    }
  ],
  "background": "裸眼、套管射孔、筛管和砾石充填对储层接触、防砂与投入有不同取舍。邻井案例能提供经验线索，但相似地质与工况比单纯高产排名更有意义。本例在合成案例库中检索相近储层，再按防砂偏好给方式排序，公开距离、支持案例数和评分组成。",
  "visual": "产能与成本散点体现方式取舍；评分随出砂惩罚变化，说明推荐取决于明确偏好，不存在不附条件的通用最佳完井。",
  "steps": [
    "储层特征标准化",
    "相似虚拟案例检索",
    "方式表现加权汇总",
    "多目标候选排序"
  ],
  "details": [
    "用预设尺度比较渗透率、出砂倾向与出水编码。",
    "64案例中取16近邻，避免井号进入距离。",
    "每种方式以倒距离权重汇总产能、出砂与成本代理。",
    "显式评分权重排序，展示稀疏类别回退支持量。"
  ],
  "metric": "案例距离为三维归一化欧氏距离；评分=产能代理−出砂权重×出砂代理−0.006×成本。未定义准确率，不伪造推荐命中率。",
  "limit": "这是结构化案例推理，不是已构建的现场知识图谱。合成完井方式表现不能支持真实工程选择，出水编码只参与相似度而非实际水锥模拟。",
  "refs": [
    "completion"
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
 const r=U.rng(),types=['裸眼','套管射孔','筛管','砾石充填'],rows=[];for(let i=0;i<64;i++){let sand=r(),water=r(),perm=20+800*r(),type=i%4,capacity=(.7+perm/1000)*(type===0?1.15:type===1?1:type===2?.92:.82),sandout=U.clamp(sand*[1,.8,.35,.13][type]+(r()-.5)*.08,0,1),cost=[20,35,48,70][type];rows.push({id:'虚拟邻井-'+(i+1),sand,water,perm,type,capacity,sandout,cost})}
 const distance=d=>Math.sqrt(((d.perm-p.perm)/800)**2+(d.sand-p.sand)**2+(d.water-p.water)**2);let near=rows.map(d=>({...d,distance:distance(d)})).sort((a,b)=>a.distance-b.distance).slice(0,16),candidates=types.map((name,type)=>{let nn=near.filter(d=>d.type===type),fallback=!nn.length;if(fallback)nn=rows.filter(d=>d.type===type).sort((a,b)=>distance(a)-distance(b)).slice(0,2);let weight=d=>1/(.05+distance(d)),total=nn.reduce((s,d)=>s+weight(d),0),avg=key=>nn.reduce((s,d)=>s+d[key]*weight(d),0)/total,capacity=avg('capacity'),sandout=avg('sandout'),cost=avg('cost'),score=capacity-p.penalty*sandout-.006*cost;return {name,type,capacity,sandout,cost,score,support:nn.length,supportIDs:nn.map(d=>d.id).join(' / '),fallback}}),best=U.rank(candidates,d=>d.score)[0];
 return {metrics:[U.metric('最优相似案例评分',best.score),U.metric('推荐出砂代理',best.sandout),U.metric('候选方式',candidates.length,'种'),U.metric('最近邻距离',near[0].distance)],recommendation:`推荐候选 ${best.name}；评分=产能代理−出砂权重×出砂代理−0.006×成本。证据来自合成近邻，不是知识图谱或现场方案批准。`,note:'64个虚拟案例。距离按预设物理尺度归一化，16近邻按倒距离加权；缺少某类时按相同三维距离回退该类最近2例，明细列出支持井号和回退标记。不训练神经网络，评分没有真实经济含义。',charts:[U.chart('方案成本与产能','成本 / 教学单位','产能代理',candidates.map(d=>U.series(d.name,[[d.cost,d.capacity]],true))),U.chart('方案得分','候选方式编码','综合评分',[U.series('评分',candidates.map(d=>[d.type,d.score]))])],rows:candidates,audit:{best,neighbors:near.map(d=>d.id)}};
};
const defaults={"perm":240,"sand":0.6,"water":0.3,"penalty":1.5};
function run(inputs={}){const p={...defaults,...inputs};config.controls.forEach(c=>{if(!Number.isFinite(Number(p[c.key])))throw new Error('参数必须为有限数值：'+c.key);p[c.key]=U.clamp(Number(p[c.key]),c.min,c.max)});return algorithm(p,U)}
return {config,defaults,run};
});
