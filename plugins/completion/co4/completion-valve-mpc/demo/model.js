/* Fixed-seed synthetic teaching case. No network dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CaseModel=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
const config={
  "stage": "completion",
  "scene": "co4",
  "id": "completion-valve-mpc",
  "kind": "valve",
  "title": "分段滑套滚动控制",
  "methods": [
    "opt"
  ],
  "topic": "智能完井滑套控制策略",
  "controls": [
    {
      "key": "water",
      "label": "第二段初始含水",
      "min": 0.1,
      "max": 0.9,
      "step": 0.05,
      "value": 0.65
    },
    {
      "key": "waterCap",
      "label": "水处理上限 / m³/d",
      "min": 10,
      "max": 120,
      "step": 5,
      "value": 65
    },
    {
      "key": "penalty",
      "label": "水量惩罚权重",
      "min": 0,
      "max": 2,
      "step": 0.1,
      "value": 0.6
    },
    {
      "key": "switchCost",
      "label": "开度切换代价",
      "min": 0,
      "max": 10,
      "step": 0.5,
      "value": 2
    },
    {
      "key": "days",
      "label": "模拟时长 / 天",
      "min": 7,
      "max": 45,
      "step": 1,
      "value": 21
    }
  ],
  "background": "智能完井通过分段阀门限制高含水层贡献，但关小一段会改变井筒内其他层的压降与贡献。固定全开无法体现水处理能力约束。本例以三段简化模拟器枚举阀门开度，滚动执行近期目标较好的动作，观察分段控制对累计油水的影响。",
  "visual": "开度时序显示高含水段被逐渐节流；与全开油率曲线比较必须同时查看累计水和水处理超限，避免只比较油量。",
  "steps": [
    "分段状态初始化",
    "两步开度候选预测",
    "油水与切换目标计算",
    "滚动执行与基线比较"
  ],
  "details": [
    "定义三段液量能力、初始含水和井筒共享干扰。",
    "枚举每段0/25/50/75/100%开度，预测两天固定动作。",
    "过滤两天水量上限，最大化两天油−水惩罚−切换成本。",
    "只执行首日动作并更新含水，次日重算；无可行动作时全关。"
  ],
  "metric": "累计油水是逐天模拟值求和；超限天数逐日计数。该两步固定动作搜索是滚动优化，不是强化学习，也不是完整多步动作树MPC。",
  "limit": "无真实储层网格、压力守恒或水锥模型；含水递增为教学状态方程。全开基线可能不满足水处理约束，不能称优化方案实现现场增产。",
  "refs": [
    "valve"
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
 const initial=[.15,p.water,.4],k=[60,80,45],levels=[0,.25,.5,.75,1],step=(water,open)=>{let liquid=open.map((v,i)=>v*k[i]/(1+.25*U.mean(open))),oil=liquid.reduce((s,q,i)=>s+q*(1-water[i]),0),w=liquid.reduce((s,q,i)=>s+q*water[i],0),next=water.map((v,i)=>U.clamp(v+.012*open[i]*(1+i*.3),0,.98));return {oil,water:w,next,open,liquid}};
 const roll=(optimize)=>{let state=[...initial],last=[1,1,1],rows=[];for(let day=0;day<Math.round(p.days);day++){let selected=optimize?[0,0,0]:last,best=-Infinity;if(optimize)for(let a of levels)for(let b of levels)for(let c of levels){let op=[a,b,c],s=step(state,op);if(s.water>p.waterCap)continue;let next=step(s.next,op);if(next.water>p.waterCap)continue;let score=s.oil+next.oil-p.penalty*(s.water+next.water)-p.switchCost*op.reduce((z,v,i)=>z+Math.abs(v-last[i]),0);if(score>best){best=score;selected=op}}let s=step(state,selected);rows.push({day:day+1,oil:s.oil,water:s.water,open:[...selected],feasible:s.water<=p.waterCap});state=s.next;last=selected}return rows};let rows=roll(true),base=roll(false),oil=rows.reduce((s,d)=>s+d.oil,0),baseOil=base.reduce((s,d)=>s+d.oil,0);
 return {metrics:[U.metric('滚动累计油代理',oil,'m³'),U.metric('全开累计油代理',baseOil,'m³'),U.metric('滚动累计水',rows.reduce((s,d)=>s+d.water,0),'m³'),U.metric('水上限超限天数',rows.filter(d=>!d.feasible).length,'天')],recommendation:'首日推荐开度：'+rows[0].open.map((x,i)=>'段'+(i+1)+' '+x*100+'%').join('、')+'。两步预测、每次只执行第一步，次日重新搜索；不是强化学习。',note:'三段简化井筒干扰与含水递增响应；125种开度组合，固定开度两步前瞻。全开基线可能超水处理约束，比较为同一教学模拟器结果。无可行动作时全关，动作切换代价进入目标。',charts:[U.chart('滚动控制与全开油率','模拟天数','油率代理 / m³/d',[U.series('滚动控制',rows.map(d=>[d.day,d.oil])),U.series('全开基线',base.map(d=>[d.day,d.oil]))]),U.chart('分段开度策略','模拟天数','开度 / %',[0,1,2].map(i=>U.series('段'+(i+1),rows.map(d=>[d.day,100*d.open[i]]))))],rows,audit:{firstAction:rows[0].open,baseline:base,oil,baseOil}};
};
const defaults={"water":0.65,"waterCap":65,"penalty":0.6,"switchCost":2,"days":21};
function run(inputs={}){const p={...defaults,...inputs};config.controls.forEach(c=>{if(!Number.isFinite(Number(p[c.key])))throw new Error('参数必须为有限数值：'+c.key);p[c.key]=U.clamp(Number(p[c.key]),c.min,c.max)});return algorithm(p,U)}
return {config,defaults,run};
});
