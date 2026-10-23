(function(g){
  'use strict';
  function rng(seed){return function(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};}
  function generate(kind,noise){
    const rand=rng(20261024);let pit=0;
    return Array.from({length:180},(_,t)=>{
      const a=t<90?0:Math.min(1,(t-90)/30), active=kind!=='normal';
      const flow=(rand()-.5)*noise*1.5+(active&&kind==='kick'?3*a:active&&kind==='loss'?-3*a:0);
      const pressure=18+(rand()-.5)*noise*.6+(kind==='stuck'?3*a:kind==='loss'?-1.5*a:0);
      const torque=12+(rand()-.5)*noise*1.2+(kind==='stuck'?6*a:0);
      pit+=flow*60/1000;
      return {t,flow,pressure,torque,pit,precursor:active&&t>=90&&t<120};
    });
  }
  function calibrate(rows){return ['flow','pressure','torque'].map(key=>{
    const mean=rows.reduce((s,r)=>s+r[key],0)/rows.length;
    return {key,mean,sd:Math.sqrt(rows.reduce((s,r)=>s+(r[key]-mean)**2,0)/rows.length)||1};
  });}
  function score(rows,model,threshold,persistence){
    let ew=[0,0,0],run=0;
    return rows.map((r,i)=>{
      if(i<60)return {...r,score:0,alarm:false,z:[0,0,0]};
      const z=model.map(m=>(r[m.key]-m.mean)/m.sd);
      ew=ew.map((v,k)=>.22*z[k]+.78*v);
      const value=Math.max(...ew.map(Math.abs));run=value>=threshold?run+1:0;
      return {...r,score:value,alarm:run>=persistence,z:ew.slice()};
    });
  }
  function evaluate(rows){
    let tp=0,fp=0,tn=0,fn=0;
    rows.filter(r=>r.t>=60&&r.t<120).forEach(r=>{if(r.precursor){if(r.alarm)tp++;else fn++;}else{if(r.alarm)fp++;else tn++;}});
    const first=rows.find(r=>r.t>=90&&r.t<120&&r.precursor&&r.alarm);
    return {tp,fp,tn,fn,precision:tp+fp?tp/(tp+fp):null,recall:tp+fn?tp/(tp+fn):null,lead:first?120-first.t:null};
  }
  const api={rng,generate,calibrate,score,evaluate};
  if(typeof module!=='undefined')module.exports=api;else g.WarningModel=api;
})(typeof window!=='undefined'?window:globalThis);
