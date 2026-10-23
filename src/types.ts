export interface CaseFile { name: string; size: number; enc: 'text'|'dataurl'; data: string; mime?: string }
export interface Result { ok: boolean; error?: string; stored?: boolean }
export interface CaseMeta { id: string; sceneId: string; title: string; methods?: string[]; version?: string; updated?: string }
export interface Check { level: 'ok'|'warn'|'error'; msg: string; hint?: string }
declare global { interface Window {
  ATLAS: any; Cases: any; K: any; CaseDemoHost: any; CaseImport: any; Admin: any;
  __PackageService: any; __restorePlugin: (id:string)=>void;
  __ImportUI: {open:(opts?:any)=>void;close:()=>void};
} }
