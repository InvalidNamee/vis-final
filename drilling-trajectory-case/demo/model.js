(function(g){
  'use strict';
  const rad=Math.PI/180;
  // Constant plane, 30 m step; midpoint integration is a teaching approximation.
  function advance(p,u,drift,gain){const angle=p.angle+gain*u+drift;return {x:p.x+30*Math.sin((p.angle+angle)*.5*rad),z:p.z+30*Math.cos((p.angle+angle)*.5*rad),angle,u,dls:Math.abs(angle-p.angle)};}
  function identify(){
    const rows=Array.from({length:24},(_,i)=>{const u=(i%7-3)/3;return {u,delta:2.4*u+.18+.05*Math.sin(i*1.7)};});
    const mx=rows.reduce((s,r)=>s+r.u,0)/rows.length,my=rows.reduce((s,r)=>s+r.delta,0)/rows.length;
    const gain=rows.reduce((s,r)=>s+(r.u-mx)*(r.delta-my),0)/rows.reduce((s,r)=>s+(r.u-mx)**2,0);
    return {gain,drift:my-gain*mx,rows};
  }
  function search(p,goal,state,model){
    const actions=[-1,-.75,-.5,-.25,0,.25,.5,.75,1];let best=null,count=0;
    // Three-step receding horizon, enumerate 729 sequences; only first is applied.
    for(const a of actions)for(const b of actions)for(const c of actions){
      let q=p,cost=0,valid=true;const seq=[a,b,c];
      for(let k=0;k<3;k++){
        const n=advance(q,seq[k],model.drift,model.gain);
        if(n.dls>state.limit+1e-9||n.angle<0||n.angle>85){valid=false;break;}
        cost+=.35*seq[k]**2+.6*(seq[k]-(q.u||0))**2;q=n;
      }
      if(!valid)continue;count++;
      const desired=Math.atan2(goal.x-q.x,Math.max(1,goal.z-q.z))/rad;
      cost+=(q.x-goal.x)**2/900+(q.z-goal.z)**2/900+.04*(q.angle-desired)**2;
      if(!best||cost<best.cost)best={u:a,cost,sequence:seq,endpoint:q};
    }
    return {best,count};
  }
  function simulate(s,controlled){
    const model=identify(),start={x:0,z:0,angle:s.angle,u:0,dls:0};let p=start;const rows=[p];let infeasible=false;
    for(let i=0;i<20;i++){
      let u=0;
      if(controlled){const pick=search(p,{x:s.target,z:500},s,model);if(!pick.best){infeasible=true;break;}u=pick.best.u;}
      // Freeze identified model; plant has a user-controlled unmodelled disturbance.
      p=advance(p,u,model.drift+s.disturbance,model.gain);
      rows.push(p);
    }
    return {rows,infeasible,miss:Math.hypot(p.x-s.target,p.z-500),maxDls:Math.max(...rows.map(r=>r.dls)),model};
  }
  const api={advance,identify,search,simulate};if(typeof module!=='undefined')module.exports=api;else g.TrajectoryModel=api;
})(typeof window!=='undefined'?window:globalThis);
