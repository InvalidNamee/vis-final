/* Case registry: the only contract between the site and a case.
   A case declares itself with Cases.register({...}); the shell reads it back by scene.
   Classic script on purpose: build checks load it into a bare vm context. */
(function (global) {
  'use strict';

  const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const STATUS = ['ready', 'draft'];
  const store = new Map();
  const problems = [];

  // The shell refreshes on this event; vm contexts without DOM events stay silent.
  function changed() {
    if (typeof global.dispatchEvent === 'function' && typeof Event === 'function') global.dispatchEvent(new Event('atlas:changed'));
  }

  function register(def) {
    if (!def || typeof def !== 'object') { problems.push('register() 收到非对象参数，已忽略'); return null; }
    if (!def.id) { problems.push('案例缺少 id 字段，已忽略：' + (def.title || '(无标题)')); return null; }
    if (store.has(def.id)) { problems.push('案例 id 重复，后者覆盖前者：' + def.id); store.delete(def.id); }
    store.set(def.id, def);
    changed();
    return def;
  }

  // Also used to hide a builtin case; persistence is the caller's decision.
  function unregister(id) {
    if (!store.has(id)) return false;
    store.delete(id);
    changed();
    return true;
  }

  const get = id => store.get(id) || null;
  const list = () => Array.from(store.values());

  // Imported cases come first, builtin cases keep registration order.
  function bySceneAll(sceneId) {
    const all = list().filter(c => c.sceneId === sceneId);
    return all.filter(c => c.imported).concat(all.filter(c => !c.imported));
  }
  const byScene = sceneId => bySceneAll(sceneId)[0] || null;

  function validate(c) {
    const out = [];
    const add = level => (label, detail) => out.push({ level, label, detail: detail || '' });
    const ok = add('ok'), warn = add('warn'), err = add('error');

    if (!c.id) err('id 缺失');
    else if (!ID_RE.test(c.id)) err('id 命名不规范', '只允许小写字母、数字与连字符，例如 welllog-layer');
    else ok('id 规范', c.id);

    const A = global.ATLAS;
    let scene = null;
    if (!c.sceneId) err('sceneId 缺失', '必须指向 ATLAS 中的某个场景 id');
    else if (A && A.index && A.index.byId) {
      scene = A.index.byId[c.sceneId];
      if (scene) ok('场景已绑定', scene.name + '（' + c.sceneId + '）');
      else err('sceneId 不存在', '在 data.js 中找不到 ' + c.sceneId);
    } else warn('数据层未就绪', '无法校验 sceneId');

    if (!c.title) err('title 缺失'); else ok('标题', c.title);
    if (c.version) ok('版本', c.version); else warn('未声明 version');
    if (c.updated) ok('更新日期', c.updated); else warn('未声明 updated');
    if (STATUS.indexOf(c.status) < 0) warn('status 建议填 ready 或 draft', '当前：' + c.status);

    const t = c.tabs || {};
    if (!t.background) err('缺少 tabs.background', '专业背景 tab 是必需项');
    else {
      const secs = t.background.sections || [];
      if (secs.length < 2) warn('background.sections 少于 2 段', '建议按四段式写：问题 / 介入点 / 数据 / 难度');
      else ok('background 段落', secs.length + ' 段');
      const bad = secs.filter(s => !s.title || !(s.html || s.body));
      if (bad.length) err('有段落缺 title 或内容', bad.map(s => s.title || '(无题)').join('、'));
    }

    if (!t.workflow) warn('缺少 tabs.workflow', '没有流程 tab，页面只显示两个 tab');
    else if (!(t.workflow.steps || []).length) err('workflow.steps 为空');
    else ok('workflow 步骤', t.workflow.steps.length + ' 步');

    if (!t.demo) warn('没有可运行示范', 'demo 为可选项，但带示范的场景更容易被立项');
    else if (typeof t.demo.mount !== 'function') err('tabs.demo.mount 不是函数', '应为 mount(root, ctx)');
    else ok('可运行示范', '已挂载 mount()');

    if (scene) {
      if (scene.demo && !t.demo) warn('场景标记了 demo:true，但案例没有示范', '二者应保持一致');
      if (!scene.demo && t.demo) warn('案例有示范，但场景未标记 demo:true', '列表页不会显示"可运行"徽标');
    }

    const siblings = bySceneAll(c.sceneId).filter(x => x.id !== c.id);
    if (siblings.length) ok('同场景还有 ' + siblings.length + ' 个案例', '多案例场景会在页面顶部显示案例切换器：' + siblings.map(x => x.id).join('、'));
    return out;
  }

  function validateAll() {
    const map = {};
    for (const c of list()) map[c.id] = validate(c);
    return map;
  }

  function stats() {
    const A = global.ATLAS, all = list();
    return {
      registered: all.length,
      ready: all.filter(c => c.status === 'ready').length,
      withDemo: all.filter(c => c.tabs && c.tabs.demo && typeof c.tabs.demo.mount === 'function').length,
      totalScenes: A ? A.allScenes.length : 0,
      coveredScenes: new Set(all.map(c => c.sceneId)).size
    };
  }

  global.Cases = {
    register, unregister, get, byScene, bySceneAll, list, validate, validateAll, stats,
    problems: () => problems.slice()
  };
})(window);

export {};
