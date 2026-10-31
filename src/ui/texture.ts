/* Static background textures, drawn once at startup on a canvas and applied as CSS variables:
     --tex-paper  survey grid + contour lines for the page background
     --tex-night  sparser contours for the dark hero band
   The noise field is periodic over the tile, so the tiles repeat without seams.
   Colours come from tokens.css; a fixed seed keeps the pattern identical on every visit. */

const TILE=512;

function rng(seed:number){
  return ()=>{seed=seed+0x6d2b79f5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
}

// Value noise on a wrapping lattice; two octaves give gently irregular ridges.
function field(seed:number){
  const rand=rng(seed);
  const lattice=(n:number)=>Array.from({length:n*n},()=>rand()*2-1);
  const octaves=[{n:4,a:1,g:lattice(4)},{n:9,a:.22,g:lattice(9)}];
  const smooth=(t:number)=>t*t*(3-2*t);
  return (u:number,v:number)=>octaves.reduce((sum,{n,a,g})=>{
    const x=u*n,y=v*n,x0=Math.floor(x),y0=Math.floor(y),fx=smooth(x-x0),fy=smooth(y-y0);
    const at=(i:number,j:number)=>g[((j%n+n)%n)*n+((i%n+n)%n)];
    const top=at(x0,y0)+(at(x0+1,y0)-at(x0,y0))*fx,bottom=at(x0,y0+1)+(at(x0+1,y0+1)-at(x0,y0+1))*fx;
    return sum+a*(top+(bottom-top)*fy);
  },0);
}

// Marching squares over an N×N wrapped sample grid; returns line segments in tile pixels.
const EDGES:number[][][]=[[],[[3,0]],[[0,1]],[[3,1]],[[1,2]],[[3,0],[1,2]],[[0,2]],[[3,2]],[[2,3]],[[0,2]],[[0,1],[2,3]],[[1,2]],[[1,3]],[[0,1]],[[3,0]],[]];
function contour(values:Float32Array,n:number,level:number){
  const step=TILE/n,out:number[][]=[];
  const v=(i:number,j:number)=>values[(j%n)*n+(i%n)];
  const lerp=(a:number,b:number)=>(level-a)/(b-a||1e-6);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){
    const a=v(i,j),b=v(i+1,j),c=v(i+1,j+1),d=v(i,j+1);
    const code=(a>level?1:0)|(b>level?2:0)|(c>level?4:0)|(d>level?8:0);
    // Edge 0 top, 1 right, 2 bottom, 3 left.
    const point=(e:number)=>e===0?[i+lerp(a,b),j]:e===1?[i+1,j+lerp(b,c)]:e===2?[i+lerp(d,c),j+1]:[i,j+lerp(a,d)];
    for(const [e1,e2] of EDGES[code]){const p=point(e1),q=point(e2);out.push([p[0]*step,p[1]*step,q[0]*step,q[1]*step]);}
  }
  return out;
}
interface Style{seed:number;color:string;spacing:number;alpha:number;majorAlpha:number;grid?:{color:string;alpha:number}}

function paint(s:Style){
  const ratio=Math.min(2,window.devicePixelRatio||1),canvas=document.createElement('canvas');
  canvas.width=canvas.height=TILE*ratio;
  const ctx=canvas.getContext('2d');
  if(!ctx)return null;
  ctx.scale(ratio,ratio);ctx.lineCap='round';

  if(s.grid){
    // Survey sheet: fine 32px grid, 128px major lines and crosshair marks; 512 is a multiple of both.
    ctx.strokeStyle=s.grid.color;ctx.lineWidth=1;
    for(let x=0;x<TILE;x+=32){
      ctx.globalAlpha=s.grid.alpha*(x%128?1:2.2);
      ctx.beginPath();ctx.moveTo(x+.5,0);ctx.lineTo(x+.5,TILE);ctx.moveTo(0,x+.5);ctx.lineTo(TILE,x+.5);ctx.stroke();
    }
    ctx.globalAlpha=s.grid.alpha*5;
    for(let x=64;x<TILE;x+=128)for(let y=64;y<TILE;y+=128){ctx.beginPath();ctx.moveTo(x-5,y+.5);ctx.lineTo(x+6,y+.5);ctx.moveTo(x+.5,y-5);ctx.lineTo(x+.5,y+6);ctx.stroke();}
  }

  const n=128,noise=field(s.seed),values=new Float32Array(n*n);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++)values[j*n+i]=noise(i/n,j/n);
  ctx.strokeStyle=s.color;
  for(let k=-8;k<=8;k++){
    const major=k%4===0;
    ctx.globalAlpha=major?s.majorAlpha:s.alpha;ctx.lineWidth=major?1.3:.8;
    ctx.beginPath();
    for(const [x1,y1,x2,y2] of contour(values,n,k*s.spacing)){ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);}
    ctx.stroke();
  }
  return canvas;
}

function apply(name:string,canvas:HTMLCanvasElement|null){
  canvas?.toBlob(blob=>{if(blob)document.documentElement.style.setProperty(name,`url("${URL.createObjectURL(blob)}")`);},'image/png');
}

/** Draws both tiles after first paint; the page renders normally until they arrive. */
export function installTextures(){
  const run=()=>{
    const css=getComputedStyle(document.documentElement),token=(k:string)=>css.getPropertyValue(k).trim();
    apply('--tex-paper',paint({seed:7,color:token('--ink-3'),spacing:.14,alpha:.045,majorAlpha:.09,grid:{color:token('--ink-3'),alpha:.03}}));
    apply('--tex-night',paint({seed:23,color:token('--night-ink'),spacing:.15,alpha:.06,majorAlpha:.13}));
  };
  if('requestIdleCallback' in window)window.requestIdleCallback(run,{timeout:600});else setTimeout(run,60);
}
