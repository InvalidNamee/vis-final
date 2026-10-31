import {computed,shallowRef} from 'vue';
import type {Atlas,CaseDef} from '../types';

/* Reactive view over the imperative globals (window.ATLAS / Cases / CaseImport).
   Runtime mutators emit `atlas:changed`; boot wires that event to refresh(). */
const version=shallowRef(0);
export function refresh(){version.value++;}
/** Call inside a computed or render to re-run after the next refresh. */
export const track=()=>version.value;

// A new shallow copy per version, so templates reading atlas.x re-render after in-place edits.
export const atlas=computed<Atlas>(()=>{track();return {...window.ATLAS};});
export const cases=computed<CaseDef[]>(()=>{track();return window.Cases.list();});
export const caseStats=computed(()=>{track();return window.Cases.stats();});
export const sceneStats=computed(()=>{track();return window.ATLAS.stats();});
export const matrix=computed(()=>{track();return window.ATLAS.countByStageMethod();});
export const checks=computed(()=>{track();return window.Cases.validateAll();});
export const hidden=computed(()=>{track();return window.CaseImport.blockedList().filter(id=>!window.Cases.get(id));});
export const methodKeys=computed(()=>Object.keys(atlas.value.methods));

export function casesOf(sceneId:string){track();return window.Cases.bySceneAll(sceneId);}
/** Admin-created methods borrow one of the five palette colours. */
export const colorOf=(key:string)=>atlas.value.methods[key]?.colorKey||key;
