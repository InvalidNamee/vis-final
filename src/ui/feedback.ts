import {reactive} from 'vue';

export type ToastKind='ok'|'warn'|'error'|'info';
export interface Toast{id:number;kind:ToastKind;title:string;sub?:string}
export const toasts=reactive<Toast[]>([]);
let seq=0;

export function toast(kind:ToastKind,title:string,sub?:string){
  const id=++seq;
  toasts.push({id,kind,title,sub});
  setTimeout(()=>dismiss(id),kind==='error'?6500:3800);
}
export function dismiss(id:number){const i=toasts.findIndex(t=>t.id===id);if(i>=0)toasts.splice(i,1);}

export interface ConfirmOptions{title:string;body:string;ok?:string;cancel?:string;danger?:boolean}
interface Pending extends Required<Omit<ConfirmOptions,'danger'>>{danger:boolean;resolve:(ok:boolean)=>void}
export const confirmState=reactive<{current:Pending|null}>({current:null});

/** Promise-based confirmation rendered by ConfirmHost; a newer request cancels the older one. */
export function confirm(options:ConfirmOptions){
  return new Promise<boolean>(resolve=>{
    confirmState.current?.resolve(false);
    confirmState.current={ok:'确认',cancel:'取消',danger:false,...options,resolve} as Pending;
  });
}
export function settle(ok:boolean){const pending=confirmState.current;confirmState.current=null;pending?.resolve(ok);}
