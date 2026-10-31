export type Level = 'ok'|'warn'|'error';
export interface Result { ok: boolean; error?: string; stored?: boolean }

export interface Method { key: string; abbr: string; name: string; desc: string; signal: string; colorKey?: string }
export type SceneRef = string|{name: string; href?: string};
export interface Scene {
  id: string; name: string; methods: string[]; diff: string; diffWhy: string; point: string; intro: string; problem: string;
  data: string[][]; refs: SceneRef[]; datasets: string[]; cross: string[]; status: string;
  stageId: string; stageName: string; stageIdx: number; demo?: boolean; __user?: boolean;
}
export interface Stage { id: string; idx: number; name: string; en: string; blurb: string; desc?: string; scenes: Scene[] }
export interface Atlas {
  meta: {title: string; tagline: string; version: string; updated: string; upstreamNote: string; email: string};
  methods: Record<string, Method>; stages: Stage[]; allScenes: Scene[]; colors: Record<string, string>;
  index: {scene: Record<string, Scene>; byScene: Record<string, Scene>; byId: Record<string, Scene>; byStage: Record<string, Stage>; byMethod: Record<string, Scene[]>};
  stats(): {total: number; full: number; ext: number; diff: Record<string, number>};
  countByStageMethod(): Record<string, Record<string, number>>;
  saveMethod(m: Record<string, unknown>): Result; deleteMethod(key: string): Result;
  saveScene(s: Record<string, unknown>): Result; deleteScene(id: string): Result;
  isUserScene(id: string): boolean; reindex(): void;
}

export interface Section { no?: number; en?: string; title: string; html?: string; body?: string }
export interface Step { name: string; role?: string; do?: string; effect?: string; trap?: string }
export interface DemoContext { scene: Scene; kase: CaseDef; K: unknown; atlas: Atlas; demoTheme: string }
export interface Demo { label?: string; intro?: string; mode?: string; mount(root: HTMLElement, ctx: DemoContext|Record<string, unknown>): unknown; unmount?(): void }
export interface CaseTabs {
  background?: {label?: string; judge?: unknown[]|null; lede?: string; sections?: Section[]};
  workflow?: {label?: string; title?: string; lead?: string[]; stats?: unknown[]|null; steps?: Step[]; metrics?: {title?: string; html?: string}|null; fails?: {name: string; why: string}[]|null};
  demo?: Demo;
}
export interface CaseDef { id: string; sceneId: string; title: string; methods?: string[]; version?: string; updated?: string; status?: string; imported?: boolean; tabs: CaseTabs }
export interface CaseCheck { level: Level; label: string; detail: string }
export interface CaseStats { registered: number; ready: number; withDemo: number; totalScenes: number; coveredScenes: number }

export interface CaseFile { name: string; size: number; enc: 'text'|'dataurl'; data: string; mime?: string }
export interface CaseMeta { id: string; sceneId: string; title: string; methods: string[]; version: string; updated: string }
export interface Check { level: Level; msg: string; hint?: string }
export interface DemoHandle { mode: string; destroy(): void }

declare global {
  interface Window {
    ATLAS: Atlas;
    Cases: {
      register(def: CaseDef): CaseDef|null; unregister(id: string): boolean; get(id: string): CaseDef|null;
      byScene(id: string): CaseDef|null; bySceneAll(id: string): CaseDef[]; list(): CaseDef[];
      validate(c: CaseDef): CaseCheck[]; validateAll(): Record<string, CaseCheck[]>; stats(): CaseStats; problems(): string[];
    };
    K: Record<string, (...args: any[]) => string>;
    CaseDemoHost: {create(root: HTMLElement, pkg: Record<string, unknown>, ctx?: Record<string, unknown>): DemoHandle; resolveMode(pkg: Record<string, unknown>): string; [k: string]: unknown};
    CaseImport: {
      open(opts?: {sceneId?: string}): void; close(): void; loadSaved(): void; remove(id: string): boolean; restore(id: string): boolean;
      updateMeta(id: string, patch: Partial<CaseMeta>): Result; blockedList(): string[]; list(): unknown[];
      template(): Record<string, unknown>; check(pkg: unknown, meta: CaseMeta): Check[];
      makeZip(entries: {name: string; text?: string; binary?: Uint8Array}[]): Blob;
      templates: {manifest: string; html: string; css: string; js: string};
    };
    Admin: {loggedIn(): boolean; route(p: string[], q: Record<string, string>): string; bind(root: HTMLElement): void};
    __PackageService: {
      readOne(file: File): Promise<CaseFile>; stripRoot(files: CaseFile[]): CaseFile[]; pickManifest(files: CaseFile[]): CaseFile|null;
      setFiles(files: CaseFile[]): void; check(pkg: unknown, meta: CaseMeta, files: CaseFile[]): Check[];
      commit(pkg: unknown, meta: CaseMeta, files: CaseFile[]): Result; removeConfirmed(id: string): boolean;
    };
    __restorePlugin(id: string): void;
    __ImportUI: {open(opts?: {sceneId?: string}): void; close(): void};
    __CASE_MOUNT__?: unknown;
  }
}
