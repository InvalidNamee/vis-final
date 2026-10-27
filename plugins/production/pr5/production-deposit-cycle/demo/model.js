/* Fixed-seed synthetic teaching case. No network dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CaseModel=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
const config={
  "stage": "production",
  "scene": "pr5",
  "id": "production-deposit-cycle",
  "kind": "deposit",
  "title": "沉积状态与清洗周期搜索",
  "methods": [
    "ts"
  ],
  "topic": "结蜡 / 结垢预测",
  "controls": [
    {
      "key": "wat",
      "label": "析蜡温度编码 / °C",
      "min": 25,
      "max": 65,
      "step": 1,
      "value": 45
    },
    {
      "key": "temp",
      "label": "流动温度 / °C",
      "min": 15,
      "max": 65,
      "step": 1,
      "value": 32
    },
    {
      "key": "wax",
      "label": "含蜡编码 / %",
      "min": 2,
      "max": 30,
      "step": 1,
      "value": 15
    },
    {
      "key": "water",
      "label": "含水结垢代理 / %",
      "min": 0,
      "max": 90,
      "step": 5,
      "value": 50
    },
    {
      "key": "q0",
      "label": "无沉积油率 / m³/d",
      "min": 20,
      "max": 120,
      "step": 5,
      "value": 65
    },
    {
      "key": "price",
      "label": "教学油价 / 元每m³",
      "min": 100,
      "max": 800,
      "step": 25,
      "value": 400
    },
    {
      "key": "cleanCost",
      "label": "单次清洗教学成本 / 元",
      "min": 1000,
      "max": 30000,
      "step": 1000,
      "value": 8000
    },
    {
      "key": "cycle",
      "label": "当前清洗间隔 / 天",
      "min": 7,
      "max": 60,
      "step": 1,
      "value": 30
    }
  ],
  "background": "蜡与无机盐沉积机制不同，但都会增加流动阻力并影响产量。固定清洗周期可能在慢沉积井过度作业、快沉积井处理不及时。本例明确把两种机制简化为状态累积代理，比较180天内不同清洗间隔的产量损失与作业成本，说明周期选择依赖沉积速率与经济假设。",
  "visual": "清洗后的沉积状态下降形成锯齿曲线；周期—成本曲线展示过于频繁与过于稀疏清洗的取舍。该曲线由逐天模拟累计，不是预填最优周期。",
  "steps": [
    "温差含水沉积代理",
    "清洗状态正向模拟",
    "油量损失成本累计",
    "离散周期搜索"
  ],
  "details": [
    "温度低于析蜡编码产生温差项，含水引入独立教学结垢项。",
    "每日累积沉积，清洗日去除88%状态。",
    "损失率按1−exp(−状态)计算，加上实际模拟清洗次数成本。",
    "枚举7–60天间隔，选180天教学成本最小者。"
  ],
  "metric": "成本=Σ每日损失油率×教学油价+清洗次数×成本；推荐周期由同一模拟器穷举。未将沉积分数误称概率或真实结垢厚度。",
  "limit": "不含原油组分相平衡、水化学饱和度、流速剪切与化学兼容性；含水不是通用结垢概率。算法是状态模拟与计划优化，不宣称生存分析模型。",
  "refs": [
    "scale",
    "wax"
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
 const rate=U.clamp((p.wat-p.temp)/25,0,2)*p.wax/100*.06+.00004*p.water,trajectory=cycle=>{let deposit=0,cost=0,loss=0,cleans=0,rows=[];for(let day=1;day<=180;day++){deposit+=rate*(1+.12*Math.sin(day/14));let lost=p.q0*(1-Math.exp(-deposit));cost+=lost*p.price;loss+=lost;if(day%cycle===0){deposit*=.12;cost+=p.cleanCost;cleans++}rows.push({day,deposit,loss:lost,cost});}return {cycle,cost,loss,cleans,rows}},candidates=U.grid(7,60,1).map(trajectory),best=[...candidates].sort((a,b)=>a.cost-b.cost)[0],current=trajectory(Math.round(p.cycle));
 return {metrics:[U.metric('推荐清洗间隔',best.cycle,'天'),U.metric('推荐180天损失成本',best.cost,'教学元'),U.metric('当前间隔损失成本',current.cost,'教学元'),U.metric('累计沉积速率代理',rate,'/d')],recommendation:`教学候选清洗周期 ${best.cycle} 天，180天共 ${best.cleans} 次。成本=损失油量×教学油价+清洗次数×教学成本；未包含停井与化学兼容性。`,note:'结蜡温差累积+含水结垢代理；沉积状态非实验标定，清洗仅去除88%状态。温度低于析蜡温度促进教学沉积；无真实水化学饱和指数或生存模型。正向模拟所有周期取成本最小。',charts:[U.chart('清洗周期成本','间隔 / 天','180天教学成本',[U.series('候选成本',candidates.map(d=>[d.cycle,d.cost])),U.series('推荐',[[best.cycle,best.cost]],true)]),U.chart('沉积状态与清洗','时间 / 天','无量纲沉积代理',[U.series('当前周期',current.rows.map(d=>[d.day,d.deposit])),U.series('推荐周期',best.rows.map(d=>[d.day,d.deposit]))])],rows:current.rows.map((d,i)=>({...d,recommendedDeposit:best.rows[i].deposit})),audit:{bestCycle:best.cycle,rate,currentCost:current.cost,bestCost:best.cost}};
};
const defaults={"wat":45,"temp":32,"wax":15,"water":50,"q0":65,"price":400,"cleanCost":8000,"cycle":30};
function run(inputs={}){const p={...defaults,...inputs};config.controls.forEach(c=>{if(!Number.isFinite(Number(p[c.key])))throw new Error('参数必须为有限数值：'+c.key);p[c.key]=U.clamp(Number(p[c.key]),c.min,c.max)});return algorithm(p,U)}
return {config,defaults,run};
});
