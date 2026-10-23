(function(g){
  'use strict';
  function generate(load){
    let seed=20261025;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
    let damage=.08;return Array.from({length:161},(_,t)=>{
      const rate=.0035*load**3*(1+.12*Math.sin(t/12));if(t)damage+=rate;
      // Damage is hidden from the estimator; the sensor is a noisy calibrated proxy.
      return {t,damage,sensor:damage+(rand()-.5)*.035,rate};
    });
  }
  function estimate(rows,time,window){
    const observed=rows.filter(r=>r.t<=time),recent=observed.slice(-window);
    const n=recent.length,mx=recent.reduce((s,r)=>s+r.t,0)/n,my=recent.reduce((s,r)=>s+r.sensor,0)/n;
    const xx=recent.reduce((s,r)=>s+(r.t-mx)**2,0);
    const slope=xx?recent.reduce((s,r)=>s+(r.t-mx)*(r.sensor-my),0)/xx:0,intercept=my-slope*mx;
    const current=intercept+slope*time;
    const sigma=n>2?Math.sqrt(recent.reduce((s,r)=>s+(r.sensor-intercept-slope*r.t)**2,0)/(n-2)):0;
    const rul=current>=1?0:slope>1e-8?Math.max(0,(1-current)/slope):null;
    // ±2 residual SD is a sensitivity band, NOT a calibrated confidence interval.
    return {slope,intercept,current,sigma,rul,low:slope>1e-8?Math.max(0,(1-current-2*sigma)/slope):null,high:slope>1e-8?Math.max(0,(1-current+2*sigma)/slope):null};
  }
  function evaluate(rows,window,cutoff){
    const fail=rows.find(r=>r.damage>=1);if(!fail||fail.t>cutoff)return {mae:null,n:0,fail:null};
    const errors=[];for(let t=Math.max(window,20);t<fail.t;t+=5){const e=estimate(rows,t,window);if(e.rul!==null)errors.push(Math.abs(e.rul-(fail.t-t)));}
    return {mae:errors.length?errors.reduce((a,b)=>a+b,0)/errors.length:null,n:errors.length,fail:fail.t};
  }
  const api={generate,estimate,evaluate};if(typeof module!=='undefined')module.exports=api;else g.FailureModel=api;
})(typeof window!=='undefined'?window:globalThis);
