/* Fixed-seed synthetic teaching case. No network dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CaseModel=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
const config={
  "stage": "completion",
  "scene": "co3",
  "id": "completion-tubing-loads",
  "kind": "tubing",
  "title": "管柱热压载荷约束比较",
  "methods": [
    "opt"
  ],
  "topic": "完井管柱受力智能分析",
  "controls": [
    {
      "key": "length",
      "label": "管柱长度 / m",
      "min": 500,
      "max": 3500,
      "step": 100,
      "value": 2000
    },
    {
      "key": "temperature",
      "label": "温升 / °C",
      "min": 0,
      "max": 100,
      "step": 5,
      "value": 40
    },
    {
      "key": "pressure",
      "label": "内外压差 / MPa",
      "min": 0,
      "max": 35,
      "step": 1,
      "value": 15
    },
    {
      "key": "wall",
      "label": "当前壁厚 / mm",
      "min": 4,
      "max": 10,
      "step": 0.25,
      "value": 6
    },
    {
      "key": "yield",
      "label": "屈服强度编码 / MPa",
      "min": 300,
      "max": 700,
      "step": 25,
      "value": 550
    },
    {
      "key": "limit",
      "label": "教学系数下限",
      "min": 1.1,
      "max": 3,
      "step": 0.1,
      "value": 1.5
    }
  ],
  "background": "温度变化引起热伸长，封隔器约束又会把伸长转成轴向载荷；压差和自重进一步改变管柱受力。逐工况计算有助于发现高温高压组合下的裕度不足。本例用可解释的简化机理直接计算候选壁厚，展示热载荷、压力活塞力和重量的组成，不以固定安全系数替代计算。",
  "visual": "载荷组成图突出热力可能与自重反向；壁厚—系数曲线显示尺寸改变对组合应力的影响。自由伸长与全约束热力分别报告。",
  "steps": [
    "材料与工况定义",
    "热压轴向载荷分解",
    "组合应力计算",
    "壁厚候选约束筛选"
  ],
  "details": [
    "固定73mm外径，输入长度、温升、压差、壁厚和屈服编码。",
    "计算浮重、活塞力、全约束热力及自由热膨胀。",
    "用薄壁环向与简化轴向组合应力求教学屈服比。",
    "枚举4–10mm壁厚，选满足教学系数的最小质量候选。"
  ],
  "metric": "教学系数=屈服强度/简化组合应力；壁厚候选按质量递增比较。保留轴向拉压符号参与组合应力。不是商业管柱软件或经API认证的设计系数。",
  "limit": "全约束热假设与自由伸长是两个极端参考，不同时发生。忽略屈曲、弯曲、连接、腐蚀、摩阻和真实封隔器响应，不能据此判定管柱现场安全。",
  "refs": [
    "tubing"
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
 const calc=t=>{let Do=.073,Di=Do-2*t/1000,A=Math.PI*(Do*Do-Di*Di)/4,Ai=Math.PI*Di*Di/4,E=200e9,alpha=12e-6,weight=A*7850*9.81*p.length*.85,thermal=E*A*alpha*p.temperature,pressure=p.pressure*1e6*Ai,axial=weight+pressure-thermal,stress=axial/A/1e6,hoop=Math.abs(p.pressure)*Di/(2*t/1000),vm=Math.sqrt(stress*stress+hoop*hoop-stress*hoop),sf=p.yield/Math.max(vm,.001);return {wall:t,axial:axial/1000,thermal:thermal/1000,pressure:pressure/1000,weight:weight/1000,stress,hoop,vm,sf,mass:A*7850*p.length,freeExpansion:alpha*p.temperature*p.length,feasible:sf>=p.limit}};
 let rows=U.grid(4,10,.25).map(calc),best=rows.find(d=>d.feasible),cur=calc(p.wall);
 return {metrics:[U.metric('当前组合应力',cur.vm,'MPa'),U.metric('当前教学安全系数',cur.sf),U.metric('自由热伸长',cur.freeExpansion,'m'),U.metric('可行壁厚数量',rows.filter(d=>d.feasible).length,'组')],recommendation:best?`候选最小质量壁厚 ${best.wall.toFixed(2)} mm；安全系数 ${best.sf.toFixed(2)}。当前轴向合力 ${cur.axial.toFixed(1)} kN（负数为压缩）。`:'候选壁厚范围内无满足教学系数的方案。',note:'直井73mm管外径；轴向重量+活塞−全约束热膨胀，薄壁环向应力和简化von Mises。忽略弯曲、摩阻、屈曲、接头、腐蚀、三轴/符号耦合，不构成管柱强度校核。',charts:[U.chart('壁厚与载荷裕度','壁厚 / mm','教学安全系数',[U.series('候选',rows.map(d=>[d.wall,d.sf])),U.series('教学要求',[[4,p.limit],[10,p.limit]])]),U.chart('轴向载荷组成','载荷项编码：0重量 1活塞 2热力','kN',[U.series('载荷',[[0,cur.weight],[1,cur.pressure],[2,-cur.thermal]])])],rows,audit:{best,current:cur}};
};
const defaults={"length":2000,"temperature":40,"pressure":15,"wall":6,"yield":550,"limit":1.5};
function run(inputs={}){const p={...defaults,...inputs};config.controls.forEach(c=>{if(!Number.isFinite(Number(p[c.key])))throw new Error('参数必须为有限数值：'+c.key);p[c.key]=U.clamp(Number(p[c.key]),c.min,c.max)});return algorithm(p,U)}
return {config,defaults,run};
});
