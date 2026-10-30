import MiniSearch from 'minisearch';
import {computed,reactive} from 'vue';
import {useAtlas,pad} from './useAtlas';

export type SearchKind='scene'|'case'|'stage'|'method';
export interface SearchDoc{id:string;kind:SearchKind;title:string;sub:string;snip:string;text:string;to:string}
export interface SearchHit extends SearchDoc{score:number;terms:string[]}

const CJK=/[㐀-鿿豈-﫿]/;
/** Chinese has no word breaks: CJK runs index as single chars plus bigrams, queries use bigrams only. */
export function tokenize(text:string,query=false):string[]{
  const out:string[]=[];
  for(const run of text.toLowerCase().match(/[㐀-鿿豈-﫿]+|[a-z0-9]+(?:\.[0-9]+)*/g)||[]){
    if(!CJK.test(run)){out.push(run);continue;}
    const ch=[...run];
    if(!query||ch.length===1)out.push(...ch);
    for(let i=0;i<ch.length-1;i++)out.push(ch[i]+ch[i+1]);
  }
  return out;
}

const strip=(s:string)=>s.replace(/<[^>]*>/g,' ').replace(/&[a-z0-9#]+;/gi,' ');
/** Every string inside a case tab, whatever shape the package author used. */
function collect(v:any,out:string[]=[]):string[]{
  if(typeof v==='string')out.push(strip(v));
  else if(Array.isArray(v))v.forEach(x=>collect(x,out));
  else if(v&&typeof v==='object')Object.values(v).forEach(x=>collect(x,out));
  return out;
}
const join=(...parts:any[])=>collect(parts).join(' ').replace(/\s+/g,' ').trim();

export function buildDocs(atlas:any,cases:any[]):SearchDoc[]{
  const abbr=(ms:string[])=>(ms||[]).map(k=>atlas.methods[k]?.abbr||k).join(' / ');
  const docs:SearchDoc[]=[];
  for(const st of atlas.stages)docs.push({id:`stage:${st.id}`,kind:'stage',title:st.name,sub:`${pad(st.idx)} · ${st.en}`,snip:st.blurb||'',text:join(st.en,st.blurb,st.scenes.map((s:any)=>s.name)),to:`/stage/${st.id}`});
  for(const s of atlas.allScenes)docs.push({id:`scene:${s.id}`,kind:'scene',title:s.name,sub:`${s.stageName} · ${abbr(s.methods)}`,snip:s.point||s.intro||'',text:join(s.point,s.intro,s.problem,s.diffWhy,s.data,s.refs,s.datasets,s.cross,(s.methods||[]).map((k:string)=>atlas.methods[k]?.name)),to:`/scene/${s.id}`});
  for(const [k,m] of Object.entries<any>(atlas.methods))docs.push({id:`method:${k}`,kind:'method',title:m.name,sub:m.abbr,snip:m.desc||'',text:join(m.abbr,m.desc,m.signal),to:`/method/${k}`});
  for(const c of cases){
    const scene=atlas.index.byScene[c.sceneId];if(!scene)continue;
    docs.push({id:`case:${c.id}`,kind:'case',title:c.title||c.id,sub:`${scene.name} · ${abbr(c.methods)}`,snip:strip(c.tabs?.background?.lede||c.tabs?.workflow?.title||''),text:join(c.id,c.tabs?.background,c.tabs?.workflow,c.tabs?.demo?.label,c.tabs?.demo?.intro),to:`/scene/${c.sceneId}?case=${encodeURIComponent(c.id)}`});
  }
  return docs;
}

const KIND_BOOST:Record<SearchKind,number>={stage:1.6,scene:1.6,method:2.2,case:1};
export function buildIndex(docs:SearchDoc[]){
  const ms=new MiniSearch<SearchDoc>({
    fields:['title','sub','text'],storeFields:['kind','title','sub','snip','text','to'],
    tokenize:t=>tokenize(t),
    // Case bodies are long and repetitive; weight navigation targets above body-text hits.
    searchOptions:{tokenize:t=>tokenize(t,true),combineWith:'AND',boost:{title:4,sub:1.5},boostDocument:(_id,_t,doc:any)=>KIND_BOOST[doc?.kind as SearchKind]||1,prefix:t=>!CJK.test(t),fuzzy:t=>!CJK.test(t)&&t.length>4?0.2:false},
  });
  ms.addAll(docs);return ms;
}

export function runSearch(ms:MiniSearch<SearchDoc>,q:string,limit=40):SearchHit[]{
  if(!tokenize(q,true).length)return [];
  return ms.search(q).slice(0,limit).map((r:any)=>({id:r.id,kind:r.kind,title:r.title,sub:r.sub,snip:r.snip,text:r.text,to:r.to,score:r.score,terms:r.terms}));
}

/** Split text into highlighted / plain parts for the matched terms. */
export function mark(text:string,terms:string[]){
  const ts=terms.filter(Boolean).sort((a,b)=>b.length-a.length).map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  if(!ts.length)return [{t:text,hit:false}];
  return text.split(new RegExp(`(${ts.join('|')})`,'gi')).filter(Boolean).map(t=>({t,hit:ts.some(x=>new RegExp(`^(?:${x})$`,'i').test(t))}));
}

/** Short excerpt: the stored summary when it matches, otherwise a window around the first hit in the full text. */
export function excerpt(hit:SearchHit,size=72){
  const has=(s:string)=>hit.terms.find(t=>s.toLowerCase().includes(t));
  if(!hit.snip||!has(hit.snip)){const t=has(hit.text);if(t){const i=hit.text.toLowerCase().indexOf(t),from=Math.max(0,i-size/3|0);return (from?'…':'')+hit.text.slice(from,from+size)+(from+size<hit.text.length?'…':'');}}
  return hit.snip.length>size*1.6?hit.snip.slice(0,size*1.6|0)+'…':hit.snip;
}

/** Shared palette state so the header button, shortcuts and the home search open the same dialog. */
export const palette=reactive({open:false,query:''});
export function openPalette(query?:string){if(query!=null)palette.query=query;palette.open=true;}

/** Index rebuilds lazily after the content store refreshes (imports, admin edits). */
export function useSearch(){
  const {atlas,host,tick}=useAtlas();
  const index=computed(()=>{tick();return buildIndex(buildDocs(atlas.value,(host as any).Cases.list()));});
  return {search:(q:string,limit?:number)=>runSearch(index.value,q,limit)};
}
