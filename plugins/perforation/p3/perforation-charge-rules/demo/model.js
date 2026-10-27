/* Fixed-seed synthetic teaching case. No network dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CaseModel=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
const config={
  "stage": "perforation",
  "scene": "p3",
  "id": "perforation-charge-rules",
  "kind": "charge",
  "title": "射孔弹型约束检索",
  "methods": [
    "kg"
  ],
  "topic": "射孔弹型智能选型",
  "controls": [
    {
      "key": "temp",
      "label": "井温编码 / °C",
      "min": 100,
      "max": 220,
      "step": 5,
      "value": 160
    },
    {
      "key": "id",
      "label": "最小通径 / mm",
      "min": 40,
      "max": 100,
      "step": 1,
      "value": 80
    },
    {
      "key": "wall",
      "label": "套管壁厚 / mm",
      "min": 6,
      "max": 18,
      "step": 0.5,
      "value": 10
    },
    {
      "key": "strength",
      "label": "岩石强度编码 / MPa",
      "min": 15,
      "max": 100,
      "step": 5,
      "value": 60
    },
    {
      "key": "holeWeight",
      "label": "大孔偏好权重",
      "min": 0,
      "max": 1,
      "step": 0.05,
      "value": 0.4
    }
  ],
  "background": "不同射孔弹设计在入口孔径、穿深和适用枪径上存在取舍，选型首先应检查井筒几何与适用环境。直接对所有型号评分会把不兼容候选排在前面。本例将规则过滤与偏好排序分开，逐型号列出温度、通径和壁厚的排除原因。",
  "visual": "孔径—穿深点图展示设计取舍，评分图同时标记规则通过者；偏好再高也不会使不满足通径的型号成为推荐。",
  "steps": [
    "虚构型号表构建",
    "适用规则逐项过滤",
    "性能代理修正",
    "偏好排序与解释"
  ],
  "details": [
    "提供六个明确标注教学名称的合成弹型编码。",
    "按井温编码、枪径和套管壁厚能力检查，保留排除原因。",
    "以强度编码对合成穿深作简单折减。",
    "对可行者按孔径/穿深偏好与成本排序，空集不返回推荐。"
  ],
  "metric": "通过数是规则检查结果；评分为归一化孔径与穿深加权减成本。没有现场正确型号标签，因此不展示虚假准确率。",
  "limit": "型号、温度能力、适用壁厚及性能全部虚构，不对应厂家产品。没有知识图谱推理或语义检索，不能用于射孔弹采购、装配或现场工艺选择。",
  "refs": [
    "charge",
    "entrance"
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
 const library=[{name:'教学深穿A',penetration:.65,hole:9,temp:150,gun:73,wall:12,cost:38},{name:'教学大孔B',penetration:.32,hole:16,temp:165,gun:89,wall:14,cost:34},{name:'教学均匀C',penetration:.45,hole:12,temp:180,gun:60,wall:10,cost:30},{name:'教学耐温D',penetration:.5,hole:10,temp:210,gun:73,wall:16,cost:50},{name:'教学细枪E',penetration:.36,hole:8,temp:150,gun:43,wall:9,cost:26},{name:'教学复合F',penetration:.57,hole:14,temp:180,gun:89,wall:15,cost:56}],rows=library.map(d=>{let reasons=[];if(d.temp<p.temp)reasons.push('温度编码不满足');if(d.gun>p.id)reasons.push('枪径超过通径');if(d.wall<p.wall)reasons.push('壁厚适用编码不满足');let adjusted=d.penetration/(1+p.strength/150),score=(1-p.holeWeight)*adjusted/.7+p.holeWeight*d.hole/18-.003*d.cost;return {...d,adjusted,score,feasible:!reasons.length,reasons:reasons.join('；')||'教学规则匹配'}}),feasible=rows.filter(d=>d.feasible),best=U.rank(feasible,d=>d.score)[0];
 return {metrics:[U.metric('通过规则候选',feasible.length,'种'),U.metric('推荐匹配评分',best?.score??null),U.metric('推荐穿深代理',best?.adjusted??null,'m'),U.metric('推荐入口孔径',best?.hole??null,'mm')],recommendation:best?`推荐教学编码 ${best.name}，匹配规则后按穿深/大孔偏好与成本排序。库内所有型号和性能均为虚构，不能用于采购或施工。`:'没有满足教学通径、温度、壁厚编码的候选型号。',note:'结构化规则检索，不宣称构建了完整知识图谱或语义大模型。实际选型需厂家手册、API试验和井下应力校正；这里性能表是显式合成数据。',charts:[U.chart('孔径与穿深取舍','入口孔径 / mm','修正穿深代理 / m',rows.map(d=>U.series(d.name+(d.feasible?' 可行':' 排除'),[[d.hole,d.adjusted]],true))),U.chart('型号匹配评分','虚构型号编码','评分',[U.series('所有候选',rows.map((d,i)=>[i,d.score])),U.series('规则通过',rows.flatMap((d,i)=>d.feasible?[[i,d.score]]:[]),true)])],rows,audit:{best,feasible:feasible.length}};
};
const defaults={"temp":160,"id":80,"wall":10,"strength":60,"holeWeight":0.4};
function run(inputs={}){const p={...defaults,...inputs};config.controls.forEach(c=>{if(!Number.isFinite(Number(p[c.key])))throw new Error('参数必须为有限数值：'+c.key);p[c.key]=U.clamp(Number(p[c.key]),c.min,c.max)});return algorithm(p,U)}
return {config,defaults,run};
});
