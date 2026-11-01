(function(){'use strict';const model=window.ExplorationModel,cfg=model.config,$=s=>document.querySelector(s),controls=$('#controls');$('#title').textContent=cfg.title;$('#business').textContent=cfg.business;cfg.controls.forEach(c=>{if(c.type==='textarea')return;const label=document.createElement('label');label.textContent=c.label+' ';const output=document.createElement('output'),input=document.createElement('input');input.type='range';input.min=c.min;input.max=c.max;input.step=c.step;input.value=c.value;input.name=c.key;input.setAttribute('aria-label',c.label);output.textContent=input.value;label.append(output,input);controls.append(label);input.addEventListener('input',()=>{output.textContent=input.value;render();});});if(cfg.mode==='report'){const label=document.createElement('label');label.textContent='录井原始记录（可删改字段）';const text=document.createElement('textarea');text.id='record';text.rows=4;text.value='井号：教学井A-01；井深：2380 m；岩性：砂岩；总烃：2.8 %；井段：2360-2380 m；描述：灰白色细砂岩，荧光斑点可见。';label.append(text);controls.append(label);text.addEventListener('input',render);}
let result;function render(){const values=Object.fromEntries([...controls.querySelectorAll('input')].map(el=>[el.name,Number(el.value)]));if($('#record'))values.text=$('#record').value;result=model.run(values);window.__caseResult=result;window.__caseState=values;$('#metrics').replaceChildren(...result.metrics.map(m=>{const d=document.createElement('div');const t=document.createElement('span');t.textContent=m.label;const b=document.createElement('strong');b.textContent=m.value===null?'未定义':Number(m.value).toFixed(Number.isInteger(m.value)?0:3);const u=document.createElement('span');u.textContent=m.unit;d.append(t,b,u);return d;}));$('#recommendation').textContent=result.recommendation;$('#note').textContent=result.note;const holder=$('#charts');holder.replaceChildren();result.images.forEach(im=>{const f=document.createElement('figure'),title=document.createElement('h2'),canvas=document.createElement('canvas');title.textContent=im.title;canvas.width=im.width;canvas.height=im.height;canvas.className='raster';canvas.setAttribute('aria-label',im.title);const ctx=canvas.getContext('2d'),image=ctx.createImageData(im.width,im.height);im.values.forEach((v,i)=>{v=Math.max(0,Math.min(1,v));image.data[i*4]=30+v*205;image.data[i*4+1]=50+v*175;image.data[i*4+2]=70+v*90;image.data[i*4+3]=255;});ctx.putImageData(image,0,0);const caption=document.createElement('figcaption');caption.textContent='横向 '+im.width+' 格，纵向 '+im.height+' 格；浅色表示高值或候选。'+(im.title.includes('提取')?' 亮色为提取候选，暗灰色为漏检参考，深底为背景。':' 合成观测，不是实测图像。');f.append(title,canvas,caption);holder.append(f);});result.charts.filter(ch=>ch.title!=='分类结果对照').forEach(ch=>{if(cfg.mode==='report'){const section=document.createElement('section'),h=document.createElement('h2');h.textContent='字段证据覆盖';section.append(h,coverageChart(result.rows));result.rows.forEach(row=>{const line=document.createElement('p');line.textContent=(row.start>=0?'● 已定位　':'○ 待核实　')+row.field+'：'+row.value;line.style.color=row.start>=0?'var(--ok)':'var(--warn)';section.append(line);});holder.append(section);return;}const f=document.createElement('figure'),title=document.createElement('h2'),scroll=document.createElement('div'),svg=svgNode('svg'),legend=document.createElement('figcaption');title.textContent=ch.title;scroll.className='chart-scroll';scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label',ch.title+'，窄屏可横向滚动');svg.classList.add('line-chart');svg.setAttribute('viewBox','0 0 760 350');svg.setAttribute('role','img');svg.setAttribute('aria-label',ch.title+'；横轴'+ch.xlabel+'；纵轴'+ch.ylabel);scroll.append(svg);f.append(title,scroll,legend);holder.append(f);plot(svg,ch,legend);});$('#rows').textContent=result.rows.length+' 条记录；显示前 8 条，完整结果可导出。';const table=$('#table');table.replaceChildren();if(result.rows.length){const keys=Object.keys(result.rows[0]);const head=document.createElement('tr');keys.forEach(key=>{let th=document.createElement('th');const labels={group:'虚拟组',well:'虚拟井',reference:'参考值',prediction:'模型结果',baseline:'基线',feature1:result.audit.featureNames?.[0]||'特征1',feature2:result.audit.featureNames?.[1]||'特征2',feature3:result.audit.featureNames?.[2]||'特征3',observed:'合成观测',score:'计算分数',flag:'异常候选',index:'采样序号',x:'横向网格',y:'纵向网格',value:'观测值',boundary:'候选界面',time_ms:'时间 / ms',amplitude:'相对振幅',ratio:'STA/LTA',trigger:'触发点',density:'密度 / g·cm⁻³',evaluated:'缺测评价点',field:'字段',source:'原文证据',start:'字符起点',trace:'道边界',GR_API:'伽马 / API',RT_ohmm:'电阻率 / Ω·m',RHOB_gcc:'密度 / g·cm⁻³',drilltime_min_per_m:'钻时 / min·m⁻¹'};th.textContent=labels[key]||key;th.scope='col';head.append(th);});table.append(head);result.rows.slice(0,8).forEach(row=>{const tr=document.createElement('tr');keys.forEach(key=>{const td=document.createElement('td'),v=row[key];td.textContent=v===null?'缺测':typeof v==='boolean'?(v?'是':'否'):typeof v==='number'?v.toFixed(3):String(v);tr.append(td);});table.append(tr);});}setTimeout(()=>parent.postMessage({type:'atlas:resize',h:document.body.scrollHeight},'*'),0);}

function coverageChart(rows){
 const ns='http://www.w3.org/2000/svg',box=document.createElement('div'),svg=document.createElementNS(ns,'svg');
 box.className='chart-scroll';box.tabIndex=0;box.setAttribute('role','region');box.setAttribute('aria-label','字段证据覆盖，窄屏可横向滚动');
 svg.setAttribute('viewBox','0 0 680 '+(55+rows.length*42));svg.setAttribute('role','img');svg.setAttribute('aria-label','字段证据覆盖：满条表示已定位，空条表示待核实');svg.style.cssText='display:block;width:100%;min-width:600px;height:auto';
 rows.forEach((row,i)=>{const y=20+i*42,hit=row.start>=0;
  const label=document.createElementNS(ns,'text');label.setAttribute('x','12');label.setAttribute('y',String(y+18));label.setAttribute('font-size','16');label.textContent=row.field;svg.append(label);
  const track=document.createElementNS(ns,'rect');track.setAttribute('x','100');track.setAttribute('y',String(y));track.setAttribute('width','420');track.setAttribute('height','25');track.setAttribute('rx','4');track.setAttribute('fill','var(--line)');svg.append(track);
  if(hit){const bar=track.cloneNode();bar.setAttribute('fill','var(--jade)');svg.append(bar);}
  const status=document.createElementNS(ns,'text');status.setAttribute('x','535');status.setAttribute('y',String(y+18));status.setAttribute('font-size','16');status.textContent=hit?'已定位':'待核实';svg.append(status);
 });box.append(svg);return box;
}
const colors=['var(--jade)','var(--clay)','var(--c-nlp)','var(--jade)'];
function svgNode(name,attrs={},text){
 const node=document.createElementNS('http://www.w3.org/2000/svg',name);
 Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,String(value)));
 if(text!==undefined)node.textContent=text;
 return node;
}
function plot(svg,ch,legend){
 const series=ch.series,all=series.flatMap(s=>s.points).filter(p=>p[1]!==null&&p.every(Number.isFinite));
 if(!all.length){svg.append(svgNode('text',{x:96,y:80},'当前无可绘制数据。'));return;}
 let xmin=Math.min(...all.map(p=>p[0])),xmax=Math.max(...all.map(p=>p[0])),ymin=Math.min(...all.map(p=>p[1])),ymax=Math.max(...all.map(p=>p[1]));
 if(ymax===ymin)ymax=ymin+1;
 if(xmax===xmin)xmax=xmin+1;
 const left=112,right=728,top=32,bottom=282;
 const xp=x=>left+(x-xmin)/(xmax-xmin)*(right-left),yp=y=>bottom-(y-ymin)/(ymax-ymin)*(bottom-top);
 const fmt=(v,span)=>Math.abs(v)>=1e5||(Math.abs(v)>0&&Math.abs(v)<1e-3)?v.toExponential(1):String(Number(v.toFixed(span<1?3:1)));
 // Reserve separate columns for the vertical axis name, tick text and plot.
 const middle=(top+bottom)/2;
 svg.append(svgNode('text',{class:'plot-y-label',x:24,y:middle,transform:`rotate(-90 24 ${middle})`,'text-anchor':'middle','dominant-baseline':'middle'},ch.ylabel));
 for(let i=0;i<=4;i++){
  const y=ymin+(ymax-ymin)*i/4,x=xmin+(xmax-xmin)*i/4;
  svg.append(svgNode('path',{d:`M${left} ${yp(y)}H${right}`,stroke:'var(--line)',fill:'none'}));
  svg.append(svgNode('text',{class:'plot-y-tick',x:left-12,y:yp(y),'text-anchor':'end','dominant-baseline':'middle'},fmt(y,ymax-ymin)));
  svg.append(svgNode('text',{class:'plot-x-tick',x:xp(x),y:306,'text-anchor':'middle'},fmt(x,xmax-xmin)));
 }
 series.forEach((s,j)=>{
  const color=colors[j%colors.length];
  if(s.scatter){
   s.points.filter(p=>p[1]!==null&&p.every(Number.isFinite)).forEach(([x,y])=>svg.append(svgNode('circle',{cx:xp(x),cy:yp(y),r:3,fill:color})));
  }else{
   let d='',gap=true;
   s.points.forEach(([x,y])=>{if(y===null||!Number.isFinite(x)||!Number.isFinite(y)){gap=true;return;}d+=(gap?'M':'L')+xp(x).toFixed(2)+' '+yp(y).toFixed(2)+' ';gap=false;});
   svg.append(svgNode('path',{d,stroke:color,'stroke-width':2,fill:'none','stroke-linejoin':'round'}));
  }
  const span=document.createElement('span');span.textContent='● '+s.name+' ';span.style.color=color;legend.append(span);
 });
 svg.append(svgNode('text',{class:'plot-x-label',x:(left+right)/2,y:337,'text-anchor':'middle'},ch.xlabel));
}

$('#reset').addEventListener('click',()=>{controls.querySelectorAll('input').forEach((el,i)=>{el.value=cfg.controls[i].value;el.previousSibling.textContent=el.value;});if($('#record'))$('#record').value=cfg.controls[0].value;render();});$('#export').addEventListener('click',()=>{const keys=Object.keys(result.rows[0]||{}),csv='\uFEFF'+keys.join(',')+'\n'+result.rows.map(row=>keys.map(k=>'"'+String(row[k]).replaceAll('"','""')+'"').join(',')).join('\n'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=cfg.id+'-synthetic.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});render();})();
