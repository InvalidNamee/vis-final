/* Legacy admin API: Admin.route(path, query) returns console HTML, Admin.bind(root) wires it.
   The Vue admin page does not use this; it remains for callers of the original hash console.
   Account and session share storage with src/services/management.ts (djb2 hash, not a security boundary). */
(function (global) {
  'use strict';

  const KEY = 'atlas.admin.v1';
  const SESS = 'atlas.admin.session';

  function hash(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  function account() {
    let r = null;
    try { r = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { /* corrupt record is replaced */ }
    if (!r || !r.user || !r.hash) {
      r = { user: 'admin', hash: hash('admin123') };
      try { localStorage.setItem(KEY, JSON.stringify(r)); } catch (e) { /* storage unavailable */ }
    }
    return r;
  }

  const loggedIn = () => global.sessionStorage.getItem(SESS) === '1';
  const refresh = () => global.dispatchEvent(new Event('hashchange'));
  const go = hash => { global.location.hash = hash; };
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const A = () => global.ATLAS;
  const field = (label, input) => `<label class="imp-f"><span>${label}</span>${input}</label>`;
  const text = (id, value, attrs) => `<input type="text" id="${id}" value="${esc(value)}" ${attrs || ''}>`;
  const buttons = (id, editing, addLabel) => '<div style="display:flex;gap:8px;margin-top:12px">' +
    `<button class="btn primary sm" id="${id}-save">${editing ? '保存修改' : addLabel}</button>` +
    (editing ? `<button class="btn sm ghost" id="${id}-cancel">取消编辑</button>` : '') + '</div>';
  const table = (head, rows, style) => `<div class="matrix-wrap" style="box-shadow:var(--sh-1)${style || ''}"><table class="sys-table"><thead><tr>` +
    head.map(h => `<th>${h}</th>`).join('') + `</tr></thead><tbody>${rows}</tbody></table></div>`;
  const actions = (attr, id) => `<td><a href="#" class="link-remove" data-adm-edit-${attr}="${esc(id)}">编辑</a> ` +
    `<a href="#" class="link-remove" data-adm-del-${attr}="${esc(id)}">删除</a></td>`;

  /* ---------------- login ---------------- */
  function loginHTML(msg) {
    return '<main class="wrap" style="max-width:460px;padding-top:70px"><div class="adm-card">' +
      '<div class="eyebrow">ADMIN SIGN IN</div><h2 style="margin:8px 0 4px">管理员登录</h2>' +
      '<p class="small muted">登录后可管理案例、技术类别与场景。默认账号 <b>admin</b>，默认密码 <b>admin123</b>，登录后请尽快修改。</p>' +
      (msg ? `<div class="callout warn" style="margin:12px 0"><span class="ci">!</span><span>${esc(msg)}</span></div>` : '') +
      field('账号', '<input type="text" id="adm-user" autocomplete="username">') +
      field('密码', '<input type="password" id="adm-pass" autocomplete="current-password">') +
      '<div style="display:flex;gap:8px;margin-top:16px"><button class="btn primary" id="adm-login">登录</button><a class="btn ghost" href="#/">返回站点</a></div>' +
      '<p class="small muted" style="margin-top:14px">本站为纯静态演示，账号只做操作门槛，不是安全边界。</p></div></main>';
  }

  function doLogin() {
    const acc = account();
    if (document.getElementById('adm-user').value.trim() !== acc.user || hash(document.getElementById('adm-pass').value) !== acc.hash) {
      alert('账号或密码不对。默认 admin / admin123。');
      return;
    }
    global.sessionStorage.setItem(SESS, '1');
    go('#/admin/cases');
    refresh();
  }

  /* ---------------- console shell ---------------- */
  const TABS = [['', '概览'], ['cases', '案例管理'], ['methods', '技术管理'], ['scenes', '场景管理']];

  function shellHTML(cur, inner) {
    const stat = (n, l) => `<div><div class="n">${n}</div><div class="l">${l}</div></div>`;
    return '<main class="wrap"><div class="page-head"><div class="ph-top"><div>' +
      '<div class="ph-idx">ADMIN CONSOLE</div><h1>管理后台</h1>' +
      '<p class="blurb">增删改案例、技术类别与场景。所有改动保存在本机浏览器并立即生效；内置数据不动，刷新后由覆盖层自动恢复。</p></div>' +
      '<div class="ph-stat">' + stat(global.Cases.list().length, '案例') + stat(Object.keys(A().methods).length, '技术') + stat(A().allScenes.length, '场景') + '</div></div></div>' +
      '<div class="adm-bar"><div class="filters" style="border:0;padding:0">' +
      TABS.map(([k, label]) => `<button class="chip${cur === k ? ' on' : ''}" data-adm-tab="${k}">${label}</button>`).join('') + '</div>' +
      '<span class="mono" id="adm-msg"></span><span style="flex:1"></span>' +
      '<button class="btn sm" id="adm-pass-btn">改密码</button><button class="btn sm ghost" id="adm-logout">退出登录</button></div>' +
      inner + '</main>';
  }

  // Non-blocking feedback inside the page; also works in headless runs.
  function admMsg(message, isErr) {
    const el = document.getElementById('adm-msg');
    if (!el) return;
    el.textContent = message;
    el.style.color = isErr ? 'var(--bad)' : 'var(--jade-d)';
  }

  function chipBox(id, on) {
    const M = A().methods, sel = on || [];
    return `<div class="imp-methods" id="${id}">` + Object.keys(M).map(k => {
      const act = sel.indexOf(k) >= 0;
      return `<label class="imp-mchip${act ? ' on' : ''}" data-mkey="${k}"><input type="checkbox" value="${k}"${act ? ' checked' : ''}>` +
        `<b>${esc(M[k].abbr)}</b>${esc(M[k].name)}</label>`;
    }).join('') + '</div>';
  }

  const options = (items, sel) => items.map(([v, label]) => `<option value="${esc(v)}"${v === sel ? ' selected' : ''}>${esc(label)}</option>`).join('');
  const stageOptions = sel => options(A().stages.map(st => [st.id, st.idx + ' ' + st.name]), sel);
  const sceneOptions = sel => A().stages.map(st => `<optgroup label="${esc(st.name)}">` + options(st.scenes.map(sc => [sc.id, sc.name]), sel) + '</optgroup>').join('');

  /* ---------------- overview ---------------- */
  function overviewHTML() {
    const s = global.Cases.stats(), M = A().methods;
    return '<div class="adm-grid">' +
      `<div class="adm-card"><h4>案例接入</h4><p class="small muted">${s.registered} 个案例，覆盖 ${s.coveredScenes} / ${s.totalScenes} 个场景；其中 ${s.withDemo} 个带可运行示范。</p><a class="btn sm" href="#/cases">打开案例库 →</a></div>` +
      `<div class="adm-card"><h4>技术类别</h4><p class="small muted">当前 ${Object.keys(M).length} 类：${Object.keys(M).map(k => esc(M[k].name)).join('、')}。</p><p class="small muted">删除某类技术前，需要先把它从所有场景上摘掉。</p></div>` +
      '<div class="adm-card"><h4>安全提示</h4><p class="small muted">账号与所有数据都只存在本机浏览器；清浏览器数据会同时清掉案例存档与管理员改动。</p></div></div>';
  }

  /* ---------------- cases ---------------- */
  function casesHTML() {
    const rows = global.Cases.list().map(c => {
      const sc = A().index.byScene[c.sceneId];
      const chips = (c.methods || []).map(k => {
        const m = A().methods[k];
        return m ? `<span class="mtag sm" data-m="${m.colorKey || k}"><b>${esc(m.abbr)}</b>${esc(m.name)}</span>` : '';
      }).join('') || '<span class="dim-mark">继承场景</span>';
      return `<tr><td class="id">${esc(c.id)}</td><td><div class="nm">${esc(c.title || '（无标题）')}</div>` +
        `<div class="sc">${sc ? esc(sc.stageName) + ' / ' + esc(sc.name) : '⚠ 场景未匹配'}${c.imported ? ' <span class="badge-local">本地导入</span>' : ''}</div></td>` +
        `<td>${chips}</td><td class="sc">${esc(c.version || '—')}</td>` +
        `<td><a href="#" class="link-remove" data-adm-edit-case="${esc(c.id)}">编辑</a> <a href="#" class="link-remove" data-adm-del-case="${esc(c.id)}">删除</a></td></tr>`;
    }).join('');
    return '<div class="adm-note"><b>编辑</b>只对本机上传的案例生效（可改标题、场景、技术标签、版本）；插件案例的内容在磁盘文件里，请改源文件。同一个场景可以挂多个案例。</div>' +
      table(['案例 id', '标题 / 场景', '技术标签', '版本', '操作'], rows || '<tr><td colspan="5" class="empty">还没有案例</td></tr>');
  }

  function editCaseHTML(id) {
    const c = global.Cases.get(id);
    if (!c) return '';
    if (!c.imported) {
      return `<div class="adm-edit"><div class="callout warn"><span class="ci">!</span><span>「${esc(id)}」是插件案例（plugins/ 分类目录），内容在磁盘文件里，只能删除或改源文件，无法在线编辑。</span></div></div>`;
    }
    return `<div class="adm-edit" data-editing="${esc(id)}"><h4>编辑案例：${esc(id)}</h4><div class="adm-form">` +
      field('标题', text('adm-c-title', c.title || '', 'maxlength="40"')) +
      field('所属场景', `<select id="adm-c-scene">${sceneOptions(c.sceneId)}</select>`) +
      `<div class="imp-f"><span>技术标签</span>${chipBox('adm-c-methods', c.methods)}</div>` +
      '<div class="adm-f2">' + field('版本', text('adm-c-ver', c.version || '', 'maxlength="16"')) +
      field('更新日期', `<input type="date" id="adm-c-date" value="${esc(c.updated || '')}">`) + '</div></div>' +
      '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn primary sm" id="adm-c-save">保存修改</button><button class="btn sm ghost" id="adm-c-cancel">取消</button></div></div>';
  }

  /* ---------------- methods ---------------- */
  function methodsHTML(editKey) {
    const M = A().methods, editing = editKey ? M[editKey] : null, e = editing || {};
    const rows = Object.keys(M).map(k => {
      const m = M[k], used = A().allScenes.filter(s => s.methods.indexOf(k) >= 0).length;
      const builtin = !A().colors || A().colors[k] === k;
      return `<tr><td class="id">${esc(k)}</td><td class="nm">${esc(m.abbr)}</td>` +
        `<td>${esc(m.name)}${builtin ? ' <span class="dim-mark">内置</span>' : ' <span class="badge-local">自定义</span>'}</td>` +
        `<td class="sc">${esc(m.signal || '—')}</td><td>${used} 个场景</td>${actions('m', k)}</tr>`;
    }).join('');
    return `<div class="adm-edit"><h4>${editing ? '编辑技术：' + esc(editKey) : '新增技术类别'}</h4><div class="adm-form">` +
      '<label class="imp-f"><span>key（小写英文）<i>*</i></span>' +
      `<input type="text" id="adm-m-key" ${editing ? `value="${esc(editKey)}" readonly` : 'placeholder="agent"'} maxlength="12"><em>用于配色与场景标签，建好后不可改</em></label>` +
      '<div class="adm-f2">' + field('缩写 <i>*</i>', text('adm-m-abbr', e.abbr || '', 'placeholder="AG" maxlength="6"')) +
      field('名称 <i>*</i>', text('adm-m-name', e.name || '', 'placeholder="智能体" maxlength="20"')) + '</div>' +
      field('一句话说明', text('adm-m-desc', e.desc || '', 'maxlength="120"')) +
      field('擅长信号', text('adm-m-signal', e.signal || '', 'placeholder="预测 / 分段 / 异常" maxlength="24"')) +
      '</div>' + buttons('adm-m', editing, '添加技术') + '</div>' +
      table(['key', '缩写', '名称', '擅长信号', '使用量', '操作'], rows, ';margin-top:16px');
  }

  /* ---------------- scenes ---------------- */
  function scenesHTML(editId) {
    const editing = editId ? A().index.byScene[editId] : null, e = editing || {};
    const rows = A().allScenes.map(sc => {
      const n = global.Cases.bySceneAll(sc.id).length;
      return `<tr><td class="id">${esc(sc.id)}</td><td><div class="nm">${esc(sc.name)}${sc.__user ? ' <span class="badge-local">自定义</span>' : ''}</div>` +
        `<div class="sc">${esc(sc.stageName)}</div></td><td class="sc">${esc(sc.methods.join(' / '))}</td><td>${esc(sc.diff)}</td>` +
        `<td>${n ? `<span class="ok-mark">${n} 个案例</span>` : '<span class="dim-mark">未接入</span>'}</td>${actions('s', sc.id)}</tr>`;
    }).join('');
    const status = [['full', '详解'], ['ext', '待扩展']];
    return `<div class="adm-edit"><h4>${editing ? '编辑场景：' + esc(e.id) : '新增场景'}</h4><div class="adm-form">` +
      '<div class="adm-f2"><label class="imp-f"><span>场景 id <i>*</i></span>' +
      `<input type="text" id="adm-s-id" ${editing ? `value="${esc(e.id)}" readonly` : 'placeholder="w9"'} maxlength="8"></label>` +
      field('场景名称 <i>*</i>', text('adm-s-name', e.name || '', 'maxlength="30"')) + '</div>' +
      '<div class="adm-f3">' + field('所属环节', `<select id="adm-s-stage">${stageOptions(e.stageId || '')}</select>`) +
      field('难度', `<select id="adm-s-diff">${options(['低', '中', '高'].map(d => [d, d]), e.diff || '中')}</select>`) +
      field('状态', `<select id="adm-s-status">${options(status, e.status === 'ext' ? 'ext' : 'full')}</select>`) + '</div>' +
      `<div class="imp-f"><span>技术类别 <i>*</i></span>${chipBox('adm-s-methods', e.methods)}</div>` +
      field('场景介绍（一句话）', text('adm-s-intro', e.intro || '', 'maxlength="120"')) +
      field('AI 介入点', text('adm-s-point', e.point || '', 'maxlength="120"')) +
      field('业务问题描述', text('adm-s-problem', e.problem || '', 'maxlength="120"')) +
      field('难度原因', text('adm-s-why', e.diffWhy || '', 'maxlength="120"')) +
      '</div>' + buttons('adm-s', editing, '添加场景') + '</div>' +
      table(['id', '场景', '技术', '难度', '案例', '操作'], rows, ';margin-top:16px');
  }

  function route(p, q) {
    if (!loggedIn()) return loginHTML();
    const sub = p[1] || '', editId = q.edit || '';
    const inner = sub === 'cases' ? (editId ? editCaseHTML(editId) : '') + casesHTML()
      : sub === 'methods' ? methodsHTML(editId)
        : sub === 'scenes' ? scenesHTML(editId) : overviewHTML();
    return shellHTML(sub, inner);
  }

  /* ---------------- events ---------------- */
  const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  function chipVals(id) {
    const box = document.getElementById(id);
    return box ? Array.from(box.querySelectorAll('input:checked'), i => i.value) : [];
  }
  function bindChips(id) {
    const box = document.getElementById(id);
    if (box) box.addEventListener('change', e => { const lab = e.target.closest('.imp-mchip'); if (lab) lab.classList.toggle('on', e.target.checked); });
  }

  // One delegated handler per [data-*] edit/delete pair and per save/cancel form.
  function bindRow(root, attr, editHash, remove) {
    root.addEventListener('click', e => {
      const edit = e.target.closest(`[data-adm-edit-${attr}]`);
      if (edit) { e.preventDefault(); go(editHash + edit.getAttribute(`data-adm-edit-${attr}`)); return; }
      const del = e.target.closest(`[data-adm-del-${attr}]`);
      if (del) { e.preventDefault(); remove(del.getAttribute(`data-adm-del-${attr}`)); }
    });
  }
  function bindForm(root, prefix, back, save) {
    root.addEventListener('click', e => {
      if (e.target.id !== prefix + '-save' && e.target.id !== prefix + '-cancel') return;
      e.preventDefault();
      if (e.target.id === prefix + '-cancel') { go(back); return; }
      save();
    });
  }
  function report(r, okText) { if (!r.ok) admMsg(r.error, true); else admMsg(okText); refresh(); }
  function saved(r, back) { if (!r.ok) { admMsg(r.error, true); return; } go(back); refresh(); }

  function bind(root) {
    if (!loggedIn()) {
      const b = document.getElementById('adm-login');
      if (!b) return;
      b.addEventListener('click', doLogin);
      document.getElementById('adm-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
      return;
    }

    root.querySelectorAll('[data-adm-tab]').forEach(b => b.addEventListener('click', () => go('#/admin' + (b.dataset.admTab ? '/' + b.dataset.admTab : ''))));
    const logout = document.getElementById('adm-logout');
    if (logout) logout.addEventListener('click', () => { global.sessionStorage.removeItem(SESS); go('#/'); refresh(); });
    const pass = document.getElementById('adm-pass-btn');
    if (pass) pass.addEventListener('click', () => {
      const p = prompt('输入新密码（至少 6 位）：');
      if (p == null) return;
      if (p.length < 6) { alert('密码太短'); return; }
      const acc = account();
      acc.hash = hash(p);
      try { localStorage.setItem(KEY, JSON.stringify(acc)); alert('密码已更新'); } catch (e) { alert('保存失败：' + e.message); }
    });

    bindRow(root, 'case', '#/admin/cases?edit=', id => { global.CaseImport.remove(id); refresh(); });
    bindForm(root, 'adm-c', '#/admin/cases', () => {
      const r = global.CaseImport.updateMeta(root.querySelector('.adm-edit').dataset.editing, {
        title: val('adm-c-title'), sceneId: val('adm-c-scene'), methods: chipVals('adm-c-methods'),
        version: val('adm-c-ver'), updated: val('adm-c-date')
      });
      admMsg(r.ok ? '已保存，站点已同步更新。' : '保存失败：' + r.error, !r.ok);
      if (r.ok) { go('#/admin/cases'); refresh(); }
    });
    bindChips('adm-c-methods');

    bindRow(root, 'm', '#/admin/methods?edit=', key => {
      if (confirm('删除技术类别「' + key + '」？')) report(A().deleteMethod(key), '技术类别已删除。');
    });
    bindForm(root, 'adm-m', '#/admin/methods', () => saved(A().saveMethod({
      key: val('adm-m-key'), abbr: val('adm-m-abbr'), name: val('adm-m-name'), desc: val('adm-m-desc'), signal: val('adm-m-signal')
    }), '#/admin/methods'));

    bindRow(root, 's', '#/admin/scenes?edit=', id => {
      if (confirm('删除场景「' + id + '」？关联的环节列表会同步移除。')) report(A().deleteScene(id), '场景已删除。');
    });
    bindForm(root, 'adm-s', '#/admin/scenes', () => saved(A().saveScene({
      id: val('adm-s-id'), name: val('adm-s-name'), stageId: val('adm-s-stage'), methods: chipVals('adm-s-methods'),
      diff: val('adm-s-diff'), status: val('adm-s-status'), intro: val('adm-s-intro'), point: val('adm-s-point'),
      problem: val('adm-s-problem'), diffWhy: val('adm-s-why')
    }), '#/admin/scenes'));
    bindChips('adm-s-methods');
  }

  global.Admin = { loggedIn, route, bind };
})(window);

export {};
