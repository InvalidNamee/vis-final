/* Fixed-seed synthetic teaching case. No network dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CaseModel=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
const config={
  "stage": "perforation",
  "scene": "p1",
  "id": "perforation-robust-search",
  "kind": "robust",
  "title": "射孔损害情景稳健搜索",
  "methods": [
    "opt"
  ],
  "topic": "射孔参数优化",
  "controls": [
    {
      "key": "kh",
      "label": "渗流能力缩放编码",
      "min": 10,
      "max": 100,
      "step": 5,
      "value": 50
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
      "key": "damage",
      "label": "损害带厚度 / m",
      "min": 0.05,
      "max": 0.6,
      "step": 0.025,
      "value": 0.25
    },
    {
      "key": "budget",
      "label": "教学成本上限",
      "min": 25,
      "max": 100,
      "step": 5,
      "value": 65
    },
    {
      "key": "costWeight",
      "label": "成本惩罚",
      "min": 0,
      "max": 1,
      "step": 0.05,
      "value": 0.2
    }
  ],
  "background": "邻井经验不能消除近井损害厚度的不确定性，同一射孔方案在轻重损害情况下可能表现不同。设计时比较多个情景，可避免只对名义地层条件寻优。本例对每种孔密、相位、穿深在三种损害情景下评价，用最坏产量代理进行稳健排序。",
  "visual": "候选成本—最坏产量图与穿深敏感性曲线并列，揭示名义高产并不等于对损害误差稳健。三个情景是手工扰动，不是置信区间。",
  "steps": [
    "损害情景构造",
    "射孔参数组合枚举",
    "最坏表现评价",
    "预算风险约束筛选"
  ],
  "details": [
    "按当前损害厚度×0.7/1/1.3构造三种假设。",
    "枚举100种孔密、相位及穿深。",
    "根据教学表皮公式预测产量，取三情景最小值。",
    "过滤预算及出砂代理上限，按最坏产量减成本惩罚选点。"
  ],
  "metric": "最坏表现=min情景产量代理；目标=最坏表现−成本惩罚×成本。非概率稳健场景不能报告概率覆盖。",
  "limit": "没有实现真实弹型实验标定、储层模拟或井控设计。kh为教学缩放编码，产量单位仅便于解释响应；不输出装药或实际作业指令。",
  "refs": [
    "perf",
    "strategy",
    "skin"
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
 const estimate=(n,depth,phase,damage)=>{let skin=3/(n*depth+.2)+2*damage/(depth+.05)+.3*(1-Math.sin(phase*Math.PI/180)),q=p.kh*10/(7+skin),risk=(n/30)**2*80/p.strength;return {q,skin,risk}};
 let rows=[];for(let n of [4,8,12,16,20])for(let depth of [.2,.3,.4,.5,.6])for(let phase of [0,60,90,120]){let outcomes=[.7,1,1.3].map(s=>estimate(n,depth,phase,p.damage*s)),worst=Math.min(...outcomes.map(d=>d.q)),cost=2*n+50*depth+.03*phase,risk=Math.max(...outcomes.map(d=>d.risk));rows.push({n,depth,phase,worst,nominal:outcomes[1].q,cost,risk,score:worst-p.costWeight*cost,feasible:cost<=p.budget&&risk<=.65})}let feasible=rows.filter(d=>d.feasible),best=U.rank(feasible,d=>d.score)[0];
 return {metrics:[U.metric('可行组合',feasible.length,'组'),U.metric('推荐最坏产量代理',best?.worst??null,'m³/d'),U.metric('推荐名义产量代理',best?.nominal??null,'m³/d'),U.metric('损害场景',3,'个')],recommendation:best?`稳健候选：${best.n} 孔/m、${best.phase}°、穿深 ${best.depth} m。按三种损害情景最坏产量减成本惩罚排序。`:'预算及教学出砂分数下无可行射孔方案。',note:'损害厚度乘0.7、1、1.3为人为不确定性情景，不是概率区间。产量代理含有效连通和表皮项，不能代表现场测试产能。',charts:[U.chart('预算与最坏产量','成本 / 教学单位','最坏产量代理 / m³/d',[U.series('所有候选',rows.map(d=>[d.cost,d.worst]),true),U.series('可行候选',feasible.map(d=>[d.cost,d.worst]),true),U.series('推荐',best?[[best.cost,best.worst]]:[],true)]),U.chart('穿深与损害敏感性','穿深 / m','产量代理 / m³/d',[.7,1,1.3].map(s=>U.series('损害×'+s,U.grid(.2,.6,.02).map(depth=>[depth,estimate(best?.n||8,depth,best?.phase||90,p.damage*s).q]))))],rows,audit:{best,feasible:feasible.length}};
};
const defaults={"kh":50,"strength":70,"damage":0.25,"budget":65,"costWeight":0.2};
function run(inputs={}){const p={...defaults,...inputs};config.controls.forEach(c=>{if(!Number.isFinite(Number(p[c.key])))throw new Error('参数必须为有限数值：'+c.key);p[c.key]=U.clamp(Number(p[c.key]),c.min,c.max)});return algorithm(p,U)}
return {config,defaults,run};
});
