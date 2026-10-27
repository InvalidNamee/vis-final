/* Fixed-seed synthetic teaching case. No network dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CaseModel=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
const config={
  "stage": "cementing",
  "scene": "c4",
  "id": "casing-centralizer-dp",
  "kind": "centralize",
  "title": "扶正器安放动态规划",
  "methods": [
    "opt"
  ],
  "topic": "套管居中度智能评估",
  "controls": [
    {
      "key": "angle",
      "label": "井斜基准 / °",
      "min": 0,
      "max": 80,
      "step": 5,
      "value": 45
    },
    {
      "key": "gap",
      "label": "环空间隙基准 / mm",
      "min": 15,
      "max": 45,
      "step": 1,
      "value": 25
    },
    {
      "key": "load",
      "label": "横向载荷编码",
      "min": 0.3,
      "max": 2,
      "step": 0.1,
      "value": 1
    },
    {
      "key": "budget",
      "label": "跨距段数",
      "min": 3,
      "max": 10,
      "step": 1,
      "value": 6
    }
  ],
  "background": "套管偏心会扩大宽边与窄边流速差，窄边泥浆残留使封隔更困难。扶正器数量有限时，等距安放未必覆盖高井斜或扩径段。本例在候选节点间计算跨距挠曲代理，用动态规划在固定预算下安排支点，并与同样数量的等距方案比较。",
  "visual": "沿井段居中度曲线对比显示薄弱跨距；安放散点标明优化支点向高载荷段集中，而非仅报告单个平均值。",
  "steps": [
    "井径井斜剖面构建",
    "跨距挠度代理计算",
    "支点预算动态规划",
    "等距方案对照"
  ],
  "details": [
    "240m教学井段以10m节点离散，井斜与间隙随深度变化。",
    "支点间抛物线型挠曲结合载荷、井斜和间隙得到居中度。",
    "状态为已用跨距数和末支点位置，最小化居中不足平方损失。",
    "回溯推荐支点，与相同端点和数量的等距方案评价。"
  ],
  "metric": "最低居中度为全节点最小值；目标是Σ(100−居中度)²而非直接最大化最低值，因此两指标可能不同时改善。",
  "limit": "不包含真实扶正器回复力/起动力、摩阻及套管弯曲刚度，不能直接作为下套管布置表。端点固定、预算为跨距段数，实际扶正器数为预算+1。",
  "refs": [
    "center",
    "cement"
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
 const n=24,L=240,step=10,inc=Array.from({length:n+1},(_,i)=>p.angle+25*Math.sin(i*.3)),gap=Array.from({length:n+1},(_,i)=>p.gap*(1+.3*Math.sin(i*.7))),quality=(a,b)=>{let values=[];for(let i=a;i<=b;i++){let sag=.8*p.load*Math.sin(Math.max(0,inc[i])*Math.PI/180)*(i-a)*(b-i);values.push([i*step,U.clamp(100*(1-sag/gap[i]),0,100)])}return values};
 const budget=Math.round(p.budget),dp=Array.from({length:budget+1},()=>Array(n+1).fill(Infinity)),prev=dp.map(r=>r.map(()=>-1));dp[0][0]=0;for(let k=1;k<=budget;k++)for(let b=1;b<=n;b++)for(let a=0;a<b;a++){let q=quality(a,b),cost=q.reduce((s,x)=>s+(100-x[1])**2,0);if(dp[k-1][a]+cost<dp[k][b]){dp[k][b]=dp[k-1][a]+cost;prev[k][b]=a}}
 let pos=[n],b=n;for(let k=budget;k>0;k--){b=prev[k][b];if(b<0)break;pos.push(b)}pos.reverse();let opt=pos.slice(1).flatMap((b,i)=>quality(pos[i],b).slice(i?1:0)),basepos=Array.from({length:budget+1},(_,i)=>Math.round(i*n/budget)),base=basepos.slice(1).flatMap((b,i)=>quality(basepos[i],b).slice(i?1:0));
 return {metrics:[U.metric('优化最低居中度',Math.min(...opt.map(x=>x[1])),'%'),U.metric('等距最低居中度',Math.min(...base.map(x=>x[1])),'%'),U.metric('优化偏心损失',dp[budget][n]),U.metric('扶正器含端点',pos.length,'个')],recommendation:'推荐教学安放深度：'+pos.map(x=>x*step+' m').join('、')+'。两端固定，预算表示跨距段数；动态规划最小化居中不足平方和。',note:'简化横向载荷挠曲代理，非API扶正器性能或真实套管梁模型；24个10m候选跨距节点，井径变化与井斜影响挠度。',charts:[U.chart('井段居中度','相对深度 / m','居中度 / %',[U.series('等距方案',base),U.series('动态规划',opt)]),U.chart('扶正器安放位置','相对深度 / m','节点指示',[U.series('推荐位置',pos.map(x=>[x*step,1]),true),U.series('等距位置',basepos.map(x=>[x*step,.5]),true)])],rows:opt.map((v,i)=>({depth:v[0],optimized:v[1],baseline:base[i]?.[1]})),audit:{positions:pos,budget,dpObjective:dp[budget][n]}};
};
const defaults={"angle":45,"gap":25,"load":1,"budget":6};
function run(inputs={}){const p={...defaults,...inputs};config.controls.forEach(c=>{if(!Number.isFinite(Number(p[c.key])))throw new Error('参数必须为有限数值：'+c.key);p[c.key]=U.clamp(Number(p[c.key]),c.min,c.max)});return algorithm(p,U)}
return {config,defaults,run};
});
