export const pad=(n:number|string)=>String(n).padStart(2,'0');
export const DIFFS=['低','中','高'] as const;
export const refName=(r:string|{name:string})=>typeof r==='string'?r:r.name;
/** Drops empty query values so URLs stay clean. */
export const cleanQuery=(q:Record<string,unknown>)=>Object.fromEntries(Object.entries(q).filter(([,v])=>v!==''&&v!=null)) as Record<string,string>;
