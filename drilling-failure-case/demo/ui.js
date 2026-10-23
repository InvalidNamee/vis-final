(function(g){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const f=(v,n=2)=>v===null||!Number.isFinite(v)?'不可定义':v.toFixed(n);
  function plot(p,index){
    const W=700,H=340,L=85,R=24,T=38,B=64;
    const all=p.series.flatMap(s=>s.points).filter(a=>a.every(Number.isFinite));
    const extent=(k)=>{const v=all.map(a=>a[k]);let a=Math.min(...v),b=Math.max(...v);if(a===b){a-=1;b+=1;}return [a,b];};
    const xr=p.xRange||extent(0),yr=p.yRange||extent(1),x=v=>L+(v-xr[0])/(xr[1]-xr[0])*(W-L-R),y=v=>H-B-(v-yr[0])/(yr[1]-yr[0])*(H-T-B);
    let svg=`<defs><clipPath id="clip${index}"><rect x="${L}" y="${T}" width="${W-L-R}" height="${H-T-B}"/></clipPath></defs>`;
    for(let i=0;i<=4;i++){const xv=xr[0]+(xr[1]-xr[0])*i/4,yv=yr[0]+(yr[1]-yr[0])*i/4;svg+=`<path d="M${L} ${y(yv)}H${W-R}" stroke="#e3e8e4"/><text x="${L-10}" y="${y(yv)+5}" text-anchor="end">${f(yv,p.decimals??1)}</text><text x="${x(xv)}" y="${H-B+27}" text-anchor="middle">${f(xv,p.xDecimals??0)}</text>`;}
    svg+=`<text x="${L}" y="22">${esc(p.yLabel)}</text><text x="${(L+W-R)/2}" y="${H-8}" text-anchor="middle">${esc(p.xLabel)}</text><g clip-path="url(#clip${index})">`;
    (p.bands||[]).forEach(b=>{svg+=`<rect x="${x(b.from)}" y="${T}" width="${x(b.to)-x(b.from)}" height="${H-T-B}" fill="#f8ecdf"/>`;});
    (p.hlines||[]).forEach(v=>svg+=`<path d="M${L} ${y(v)}H${W-R}" stroke="#a34138" stroke-width="2" stroke-dasharray="6 5"/>`);
    (p.vlines||[]).forEach(v=>svg+=`<path d="M${x(v)} ${T}V${H-B}" stroke="#8e5229" stroke-width="2" stroke-dasharray="6 5"/>`);
    const colors=['#2f7d6b','#41699b','#b26a39','#7e5a8d'];
    p.series.forEach((s,i)=>{const pts=s.points.filter(a=>a.every(Number.isFinite)),color=s.color||colors[i%4];if(s.dots)pts.forEach(a=>svg+=`<circle cx="${x(a[0])}" cy="${y(a[1])}" r="3.5" fill="${color}" opacity=".65"><title>${esc(s.name)}：${f(a[0])}, ${f(a[1])}</title></circle>`);else svg+=`<path d="${pts.map((a,j)=>(j?'L':'M')+x(a[0])+','+y(a[1])).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5" ${s.dashed?'stroke-dasharray="7 5"':''}/>`;});svg+='</g>';
    return `<article class="chart"><h2>${esc(p.title)}</h2><p>${esc(p.note)}</p><div class="chart-scroll" role="region" tabindex="0" aria-label="${esc(p.title)}，窄屏可横向滚动"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(p.title+'；'+p.yLabel+'；'+p.xLabel)}">${svg}</svg></div><div class="legend">${p.series.map((s,i)=>`<span><i style="background:${s.color||colors[i%4]}"></i>${esc(s.name)}</span>`).join('')}</div></article>`;
  }
  function mount(c){
    const root=document.getElementById('app');let result;
    root.innerHTML=`<header><span class="badge">教学合成数据 · 本地计算 · 固定种子</span><h1>${esc(c.title)}</h1><p>${esc(c.intro)}</p></header><section class="experiment"><aside><h2>实验设置</h2><form id="controls">${c.controls.map(a=>`<label class="field" for="${a.id}"><span>${esc(a.label)} <output id="${a.id}-value"></output></span>${a.options?`<select id="${a.id}">${a.options.map(o=>`<option value="${esc(o[0])}">${esc(o[1])}</option>`).join('')}</select>`:`<input id="${a.id}" type="range" min="${a.min}" max="${a.max}" step="${a.step}" value="${a.value}">`}<small>${esc(a.hint||'')}</small></label>`).join('')}</form><button id="reset" class="quiet" type="button">恢复初始设置</button><p class="boundary">${esc(c.boundary)}</p></aside><div class="results"><h2>计算结果</h2><div id="metrics" class="metrics"></div><p id="status" role="status"></p><button id="apply" type="button" hidden>应用推荐参数</button><div id="plots"></div></div></section><section class="details"><h2>方法与评价边界</h2><p>${esc(c.method)}</p><div id="table"></div><button id="download" class="quiet" type="button">导出当前实验 CSV</button></section><footer>所有范围、阈值、响应系数和目标均为教学设置；合成评价不能证明现场效果。演示不连接设备。图表可通过下方数据表及 CSV 核对。</footer>`;
    const read=()=>Object.fromEntries(c.controls.map(a=>[a.id,a.options?document.getElementById(a.id).value:+document.getElementById(a.id).value]));
    function render(){const s=read();c.controls.forEach(a=>document.getElementById(a.id+'-value').textContent=a.options?'':s[a.id]+(a.unit?' '+a.unit:''));result=c.compute(s);document.getElementById('metrics').innerHTML=result.metrics.map(a=>`<div><span>${esc(a[0])}</span><strong>${esc(a[1])}</strong></div>`).join('');document.getElementById('status').textContent=result.summary;document.getElementById('plots').innerHTML=result.plots.map(plot).join('');const table=result.table;document.getElementById('table').innerHTML=`<h3>${esc(table.title)}</h3><div class="table-scroll"><table><thead><tr>${table.headers.map(v=>`<th scope="col">${esc(v)}</th>`).join('')}</tr></thead><tbody>${table.rows.map(r=>`<tr>${r.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="hint">${esc(table.note||'')}</p>`;document.getElementById('apply').hidden=!result.apply;}
    document.getElementById('controls').addEventListener('submit',e=>e.preventDefault());
    c.controls.forEach(a=>document.getElementById(a.id).addEventListener(a.options?'change':'input',render));
    document.getElementById('reset').onclick=()=>{c.controls.forEach(a=>document.getElementById(a.id).value=a.value);render();};
    document.getElementById('apply').onclick=()=>{if(result.apply){Object.entries(result.apply).forEach(([k,v])=>document.getElementById(k).value=v);render();}};
    document.getElementById('download').onclick=()=>{const rows=result.records;if(!rows.length)return;const keys=Object.keys(rows[0]),cell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const csv='\uFEFF'+[keys,...rows.map(r=>keys.map(k=>r[k]))].map(r=>r.map(cell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=c.id+'-synthetic.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
    c.controls.forEach(a=>document.getElementById(a.id).value=a.value);render();
  }
  g.CaseUI={mount,f,plot};
})(window);
