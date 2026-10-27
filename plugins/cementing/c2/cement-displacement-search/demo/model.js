/* Fixed-seed synthetic teaching case. No network dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CaseModel=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
const config={
  "stage": "cementing",
  "scene": "c2",
  "id": "cement-displacement-search",
  "kind": "displace",
  "title": "浆体密度与排量约束搜索",
  "methods": [
    "opt"
  ],
  "topic": "注水泥参数优化",
  "controls": [
    {
      "key": "rho",
      "label": "当前浆体密度 / g/cm³",
      "min": 1.35,
      "max": 1.95,
      "step": 0.025,
      "value": 1.7
    },
    {
      "key": "q",
      "label": "当前排量 / m³/min",
      "min": 0.5,
      "max": 4,
      "step": 0.1,
      "value": 2
    },
    {
      "key": "pore",
      "label": "孔隙当量密度 / g/cm³",
      "min": 1.2,
      "max": 1.7,
      "step": 0.025,
      "value": 1.35
    },
    {
      "key": "fracture",
      "label": "破裂当量密度 / g/cm³",
      "min": 1.4,
      "max": 2.2,
      "step": 0.025,
      "value": 1.85
    },
    {
      "key": "gap",
      "label": "环空间隙 / mm",
      "min": 15,
      "max": 45,
      "step": 1,
      "value": 25
    },
    {
      "key": "standoff",
      "label": "居中度 / %",
      "min": 30,
      "max": 100,
      "step": 5,
      "value": 75
    }
  ],
  "background": "注水泥时既要顶替泥浆形成连续水泥环，又要避免循环压力超过地层承受窗口。高排量可能改善顶替，却增加摩阻与ECD；密度增加又会改变静液柱。本例用明确的教学响应面同时画出这两种作用，在密度下界与ECD上界间比较候选，展示约束对推荐的决定作用。",
  "visual": "ECD曲线随排量向上弯曲；候选散点中顶替代理较高的点也可能越过压力上界。绿色区域只代表用户给定教学窗。",
  "steps": [
    "井况与压力窗定义",
    "候选浆排量枚举",
    "ECD与顶替代理计算",
    "可行方案目标排序"
  ],
  "details": [
    "指定环空间隙、居中度及两条当量密度边界。",
    "枚举25种浆体密度和36种排量，不外推范围。",
    "分别计算密度加平方摩阻项与饱和顶替响应。",
    "过滤越界候选，再最大化顶替代理减排量惩罚。"
  ],
  "metric": "可行组合数直接计数；推荐目标=顶替代理−0.015Q²。展示当前与推荐ECD，不预填真实顶替提升。",
  "limit": "未计算真实非牛顿流变、温压密度、浆柱分段、窄边窜流或漏失起裂；0.03密度裕度完全是教学设定。无解时保留无可行结果。",
  "refs": [
    "cement",
    "center"
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
 const response=(rho,q)=>{let ecd=rho+.032*q*q/(p.gap/25);let efficiency=U.clamp(.35+.42*(1-Math.exp(-q/1.4))+.23*(1-Math.exp(-(rho-1.25)*3))-.15*(1-p.standoff/100),0,1);return {rho,q,ecd,efficiency,feasible:ecd<=p.fracture&&rho>=p.pore+.03,score:efficiency-.015*q*q}};
 let rows=U.grid(1.35,1.95,.025).flatMap(r=>U.grid(.5,4,.1).map(q=>response(r,q))),good=rows.filter(d=>d.feasible),best=U.rank(good,d=>d.score)[0],current=response(p.rho,p.q);
 return {metrics:[U.metric('当前顶替代理值',100*current.efficiency,'%'),U.metric('当前ECD',current.ecd,'g/cm³'),U.metric('可行组合',good.length,'组'),U.metric('推荐目标值',best?best.score:null,'')],recommendation:best?`推荐密度 ${best.rho.toFixed(3)} g/cm³、排量 ${best.q.toFixed(1)} m³/min；ECD ${best.ecd.toFixed(3)} g/cm³。目标=顶替代理值−0.015×排量²。`:'当前教学压力窗内无可行方案，须重新设计；不返回伪推荐。',note:'教学经验响应面，不是标定水力学或实际顶替效率。ECD采用简化排量平方摩阻项；破裂当量密度与孔隙压力由用户指定。',charts:[U.chart('排量响应与压力窗','排量 / m³/min','ECD / g/cm³',[U.series('当前密度ECD',U.grid(.5,4,.1).map(q=>[q,response(p.rho,q).ecd])),U.series('破裂边界',[[.5,p.fracture],[4,p.fracture]])]),U.chart('候选顶替与ECD','ECD / g/cm³','顶替代理 / %',[U.series('不满足教学窗',rows.filter(d=>!d.feasible).map(d=>[d.ecd,100*d.efficiency]),true),U.series('可行',good.map(d=>[d.ecd,100*d.efficiency]),true),U.series('推荐',best?[[best.ecd,100*best.efficiency]]:[],true)])],rows,audit:{feasible:good.length,best,current}};
};
const defaults={"rho":1.7,"q":2,"pore":1.35,"fracture":1.85,"gap":25,"standoff":75};
function run(inputs={}){const p={...defaults,...inputs};config.controls.forEach(c=>{if(!Number.isFinite(Number(p[c.key])))throw new Error('参数必须为有限数值：'+c.key);p[c.key]=U.clamp(Number(p[c.key]),c.min,c.max)});return algorithm(p,U)}
return {config,defaults,run};
});
