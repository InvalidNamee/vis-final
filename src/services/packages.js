import {zipSync,strToU8} from 'fflate';
/* Case package import (v2: multi-file / folder packages)
     my-case/case.json        required: metadata, background, workflow
     my-case/demo/index.html  optional: page-mode demo (sandboxed iframe)
     my-case/demo/demo.js     optional: module-mode mount script when there is no HTML
     my-case/demo/*           optional: assets, inlined as data URLs
   Imported packages live in localStorage and register into Cases immediately.
   Classic script on purpose: build checks load it into a vm context after stripping the import line. */
(function (global) {
  'use strict';

  const KEY = 'atlas.casepack.v2';
  const KEY_V1 = 'atlas.casepack.v1';
  const KEY_BLOCKED = 'atlas.case.blocked.v1';
  const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const MAX_TOTAL = 6 * 1024 * 1024;
  const WARN_TOTAL = 1.6 * 1024 * 1024;
  const TEXT_EXT = ['json', 'js', 'mjs', 'css', 'html', 'htm', 'svg', 'txt', 'csv', 'tsv', 'md', 'xml', 'yaml', 'yml', 'geojson'];
  const MIME = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
    svg: 'image/svg+xml', ico: 'image/x-icon', mp3: 'audio/mpeg', wav: 'audio/wav',
    mp4: 'video/mp4', webm: 'video/webm', woff: 'font/woff', woff2: 'font/woff2',
    ttf: 'font/ttf', otf: 'font/otf', json: 'application/json', csv: 'text/csv', pdf: 'application/pdf'
  };

  let saved = [];
  let memFallback = null;
  let pendingFiles = [];   // demo files of the package open in the import dialog

  function extOf(name) { const m = /\.([a-z0-9]+)$/i.exec(String(name).split('?')[0]); return m ? m[1].toLowerCase() : ''; }
  const isTextName = n => TEXT_EXT.indexOf(extOf(n)) >= 0;
  const isHtml = n => ['html', 'htm'].indexOf(extOf(n)) >= 0;
  const isJs = n => ['js', 'mjs'].indexOf(extOf(n)) >= 0;
  const isCss = n => extOf(n) === 'css';
  const kb = n => Math.max(1, Math.round(n / 1024));
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  const sceneOf = id => (global.ATLAS && global.ATLAS.index.byScene[id]) || null;
  const demoCfg = pkg => (pkg && ((pkg.tabs && pkg.tabs.demo) || pkg.demo)) || {};
  const modeOf = (files, cfg) => files.length ? global.CaseDemoHost.resolveMode({ files, demo: cfg }) : 'none';

  // Keys starting with _ are template notes and are dropped on import.
  function clean(obj) {
    if (Array.isArray(obj)) return obj.map(clean);
    if (!obj || typeof obj !== 'object') return obj;
    const out = {};
    for (const k of Object.keys(obj)) if (k.charAt(0) !== '_') out[k] = clean(obj[k]);
    return out;
  }

  /* ---------------- storage ---------------- */
  function readStore(key) {
    try {
      const raw = JSON.parse(global.localStorage.getItem(key) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      return (key === KEY && memFallback) || [];
    }
  }
  function writeStore(list) {
    memFallback = list;
    try { global.localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
  }

  // Hidden builtin cases: survives reloads; only applies to non-imported cases.
  function readBlocklist() {
    try { const r = JSON.parse(global.localStorage.getItem(KEY_BLOCKED) || '[]'); return Array.isArray(r) ? r : []; } catch (e) { return []; }
  }
  function writeBlocklist(list) {
    try { global.localStorage.setItem(KEY_BLOCKED, JSON.stringify(list)); } catch (e) { /* storage unavailable */ }
  }
  function applyBlocklist() {
    for (const id of readBlocklist()) {
      const c = global.Cases.get(id);
      if (c && !c.imported) global.Cases.unregister(id);
    }
  }

  /* ---------------- reading files ---------------- */
  function readOne(file) {
    return new Promise((resolve, reject) => {
      const name = file.webkitRelativePath || file.name, text = isTextName(name), fr = new FileReader();
      fr.onload = () => resolve({
        name, size: file.size,
        mime: file.type || MIME[extOf(name)] || (text ? 'text/plain' : 'application/octet-stream'),
        enc: text ? 'text' : 'dataurl',
        data: String(fr.result)
      });
      fr.onerror = () => reject(new Error('读取失败：' + name));
      if (text) fr.readAsText(file, 'utf-8'); else fr.readAsDataURL(file);
    });
  }

  // A folder upload prefixes every path with the folder name; drop it.
  function stripRoot(files) {
    if (files.length < 2) return files;
    const segs = files.map(f => f.name.split('/'));
    const root = segs[0][0];
    if (!segs.every(s => s.length > 1 && s[0] === root)) return files;
    for (const f of files) f.name = f.name.slice(root.length + 1);
    return files;
  }

  function pickManifest(files) {
    const jsons = files.filter(f => extOf(f.name) === 'json' && f.enc === 'text');
    return jsons.find(f => /(^|\/)(case|[a-z0-9._-]+\.case)\.json$/i.test(f.name)) || jsons[0] || null;
  }

  /* ---------------- record -> case definition ---------------- */
  function backgroundTab(b) {
    return {
      label: b.label || '专业背景',
      judge: Array.isArray(b.judge) && b.judge.length ? b.judge : null,
      lede: b.lede || '',
      sections: (b.sections || []).map((s, i) => ({ no: s.no || i + 1, en: s.en || '', title: s.title || '未命名段落', html: s.html || s.body || '' }))
    };
  }
  function workflowTab(w) {
    return {
      label: w.label || '案例流程', title: w.title || '案例流程', lead: w.lead || [], stats: w.stats || null,
      steps: (w.steps || []).map(s => ({ name: s.name || '未命名步骤', role: s.role || '', do: s.do || '', effect: s.effect || '', trap: s.trap || '' })),
      metrics: w.metrics || null, fails: w.fails || null
    };
  }

  // Saved uploads restore before plugins register, so a builtin reference resolves at mount time.
  function builtinDemo(cfg) {
    const src = global.Cases.get(cfg.builtin);
    let target = null, resolving = false;
    const demo = {
      label: cfg.label || (src && src.tabs && src.tabs.demo && src.tabs.demo.label) || '可运行示范',
      intro: cfg.intro || '',
      mode: 'builtin',
      mount(root, ctx) {
        if (resolving) throw new Error('内置演示存在循环引用：' + cfg.builtin);
        const c = global.Cases.get(cfg.builtin), d = c && c.tabs && c.tabs.demo;
        if (!d || d === demo || typeof d.mount !== 'function') throw new Error('复用的内置演示不可用：' + cfg.builtin);
        target = d;
        resolving = true;
        try { return d.mount(root, ctx); } finally { resolving = false; }
      },
      unmount() {
        const previous = target;
        target = null;
        if (previous && typeof previous.unmount === 'function') previous.unmount();
      }
    };
    return demo;
  }

  function packageDemo(cfg, files, mode, meta) {
    let handle = null;
    return {
      label: cfg.label || '可运行示范', intro: cfg.intro || '', mode,
      mount(root, ctx) { handle = global.CaseDemoHost.create(root, { files, demo: cfg, meta }, ctx); },
      unmount() { if (handle) { try { handle.destroy(); } catch (e) { /* demo already gone */ } handle = null; } }
    };
  }

  function toCase(rec) {
    const pkg = clean(rec.pkg) || {}, meta = rec.meta || {}, t = pkg.tabs || {}, files = rec.files || [];
    const cfg = demoCfg(pkg), mode = modeOf(files, cfg), tabs = {};
    if (t.background) tabs.background = backgroundTab(t.background);
    if (t.workflow) tabs.workflow = workflowTab(t.workflow);
    if (cfg.builtin && (mode === 'none' || mode === 'builtin')) tabs.demo = builtinDemo(cfg);
    else if (mode === 'page' || mode === 'module') tabs.demo = packageDemo(cfg, files, mode, rec.meta);
    return {
      id: meta.id,
      sceneId: meta.sceneId,
      title: meta.title,
      methods: (meta.methods && meta.methods.length ? meta.methods : (sceneOf(meta.sceneId) || {}).methods || []).slice(),
      version: meta.version || '1.0.0',
      updated: meta.updated || today(),
      status: 'ready',
      imported: true,
      packFiles: files.length,
      tabs
    };
  }

  /* ---------------- validation: [{level, msg, hint}] ---------------- */
  function checker() {
    const out = [];
    const add = level => (msg, hint) => out.push({ level, msg, hint: hint || '' });
    return { out, ok: add('ok'), warn: add('warn'), err: add('error') };
  }

  function checkIdentity(c, meta) {
    if (!meta.id) c.err('案例 id 没填', '建议「环节-关键词」，例如 welllog-layer');
    else if (!ID_RE.test(meta.id)) c.err('案例 id 格式不合法：' + meta.id, '只能小写字母、数字、连字符，不能有空格或下划线');
    else if (global.Cases.get(meta.id)) c.err('案例 id 已被占用：' + meta.id, '换一个 id；若是之前上传的旧版本，先在案例库里移除');
    else c.ok('id 可用：' + meta.id);

    const sc = meta.sceneId ? sceneOf(meta.sceneId) : null;
    if (!meta.sceneId) c.err('没有选择所属场景', '下拉框里按环节分组，选场景即等于选定分类');
    else if (!sc) c.err('场景不存在：' + meta.sceneId, '场景 id 必须来自现有业务场景');
    else {
      c.ok('绑定场景：' + sc.stageName + ' / ' + sc.name, '分类自动继承：' + sc.stageName + ' · ' + (sc.methods || []).join(' / '));
      const occupied = global.Cases.byScene(sc.id);
      if (occupied && occupied.id !== meta.id) c.warn('该场景已有案例：' + occupied.id, '上传后会覆盖它的显示（旧案例仍留在案例库里）');
    }

    const mm = meta.methods || [];
    const badM = mm.filter(k => !(global.ATLAS.methods && global.ATLAS.methods[k]));
    if (badM.length) c.err('技术标签不存在：' + badM.join('、'), '取值以首页「按方法找」面板为准；需要新类别请先让管理员在管理后台添加');
    else if (!mm.length) c.ok('技术标签：继承场景', '会沿用所选场景自带的方法标签参与检索');
    else c.ok('技术标签：' + mm.join(' / '), '案例库与场景页会按它展示');

    if (!meta.title) c.err('案例名称没填', '会显示在场景页标题与案例库列表里');
    else if (meta.title.length > 40) c.warn('案例名称偏长（' + meta.title.length + ' 字）', '建议 6–20 字，页面标题不折行');
    else c.ok('名称：' + meta.title);
  }

  function checkContent(c, t) {
    if (!t.background) c.err('缺少 tabs.background', '专业背景是必填块，没有它场景页不会出现 tab');
    else {
      const secs = t.background.sections || [];
      if (!secs.length) c.err('background.sections 为空', '至少要有一段；建议四段式');
      else {
        const bad = [];
        secs.forEach((s, i) => {
          if (!s || !s.title) bad.push('sections[' + i + '] 缺 title');
          else if (!s.html && !s.body) bad.push('sections[' + i + '] 缺 html');
        });
        if (bad.length) c.err('段落字段不全', bad.join('；'));
        else c.ok('专业背景：' + secs.length + ' 段');
        if (secs.length < 4) c.warn('只有 ' + secs.length + ' 段', '建议四段：当前做法与问题 / 智能方法介入点 / 数据准备要求 / 难度与参考');
      }
      const j = t.background.judge;
      if (j && j.length && j.length !== 4) c.warn('judge 有 ' + j.length + ' 项', '"30 秒判断"按四列排版，建议正好 4 项');
    }

    if (!t.workflow) c.warn('没有 tabs.workflow', '页面会少"案例流程"这个 tab，可以后补');
    else {
      const steps = t.workflow.steps || [];
      const badStep = steps.filter(s => !s || !s.name);
      if (!steps.length) c.err('workflow.steps 为空', '至少写一步；每步需要 name，可选 do / effect / trap');
      else if (badStep.length) c.err('有步骤缺 name', '检查 steps 数组第 ' + (steps.indexOf(badStep[0]) + 1) + ' 项');
      else c.ok('案例流程：' + steps.length + ' 步');
    }
  }

  // Local src / href / url() references that point outside the package.
  function missingRefs(files, htmlFile, cssFiles) {
    const missing = [];
    const scan = (text, from) => {
      const re = /(?:src|href)\s*=\s*["']([^"'#]+)["']|url\(\s*["']?([^"')]+)["']?\s*\)/gi;
      let m;
      while ((m = re.exec(text))) {
        const ref = m[1] || m[2] || '';
        if (!ref || /^(data:|https?:|mailto:|tel:|#|\/\/)/i.test(ref) || !/[.][a-z0-9]{2,5}$/i.test(ref)) continue;
        if (!global.CaseDemoHost.findFile(files, ref)) missing.push(from + ' → ' + ref);
      }
    };
    scan(htmlFile.data, 'index.html');
    for (const f of cssFiles) scan(f.data, f.name);
    return missing;
  }

  function checkDemo(c, cfg, files) {
    const mode = modeOf(files, cfg);
    const jsFile = files.find(f => isJs(f.name)) || null;
    const htmlFile = files.find(f => isHtml(f.name)) || null;
    const cssFiles = files.filter(f => isCss(f.name));

    if (mode === 'page') {
      c.ok('示范：整页模式（沙箱）', htmlFile.name + ' 会在隔离的 iframe 里运行，写多复杂都不会影响主站');
      if (htmlFile.size < 60) c.warn('示范页内容过短', 'index.html 看起来是空壳，检查是不是存错文件');
      const missing = missingRefs(files, htmlFile, cssFiles);
      if (missing.length) c.warn('有 ' + missing.length + ' 处引用的文件不在包里', missing.slice(0, 4).join('；') + (missing.length > 4 ? ' …' : ''));
      else c.ok('示范页内引用的文件都能找到');
    } else if (mode === 'module') {
      if (!jsFile) c.err('没有可运行的示范脚本', '模块模式需要 demo.js；或者放一个 index.html 走整页模式');
      else {
        try { new Function(jsFile.data); c.ok('示范脚本语法通过：' + jsFile.name); }   // syntax check only, never executed
        catch (e) { c.err('示范脚本有语法错误：' + jsFile.name, e.message); }
        if (!/\bmount\b/.test(jsFile.data) && !/__CASE_MOUNT__/.test(jsFile.data)) {
          c.warn('脚本里没看到 mount 相关代码', '需要导出 mount(root, api)：module.exports={mount} 或 window.__CASE_MOUNT__=function(root,api){}');
        }
        c.ok('示范：模块模式（Shadow DOM）', '样式自动隔离，可以直接用 var(--jade) 这类站点配色令牌');
      }
    } else if (cfg.builtin) {
      const src = global.Cases.get(cfg.builtin);
      if (!src || !src.tabs.demo || typeof src.tabs.demo.mount !== 'function') c.err('demo.builtin 指向的示范不存在：' + cfg.builtin, '改成一个已注册案例的 id，或删掉整个 demo 块');
      else c.ok('复用内置示范：' + cfg.builtin, '不推荐：包里已经有文件时，会优先用包里的示范');
    } else {
      c.warn('这个案例没有可运行示范', '想加示范就在包里放 demo/index.html 或 demo/demo.js；已经有文件但没被识别，检查 demo 字段');
    }

    for (const f of cssFiles) {
      const open = (f.data.match(/{/g) || []).length, close = (f.data.match(/}/g) || []).length;
      if (open !== close) c.warn('样式大括号不配对：' + f.name, '{ 有 ' + open + ' 个，} 有 ' + close + ' 个，可能少了一个 }');
    }
  }

  function checkSize(c, cfg, files, pkg) {
    const total = files.reduce((a, f) => a + f.size, 0);
    if (!files.length) {
      if (!cfg.builtin) c.warn('包里只有清单，没有示范文件', '这是允许的（只有讲解没有示范），但带示范的场景更容易被立项');
      else c.ok('只有清单 + 复用内置示范');
    } else {
      c.ok('文件清单：' + (files.length + 1) + ' 个，共 ' + kb(total) + ' KB', files.map(f => f.name).slice(0, 6).join('、') + (files.length > 6 ? ' …' : ''));
      if (total > MAX_TOTAL) c.err('包太大：' + kb(total) + ' KB', '上限 6 MB；图片先压缩，视频请放外部链接');
      else if (total > WARN_TOTAL) c.warn('包偏大（' + kb(total) + ' KB）', '会占用浏览器本地存储，建议压到 1.5 MB 以内');
    }
    const all = JSON.stringify(pkg);
    if (/<script/i.test(all)) c.err('清单内容里出现 <script> 标签', '清单只放文字；脚本请放进单独的 .js 文件');
    if (all.length > 200000) c.warn('清单偏大（' + Math.round(all.length / 1024) + ' KB）', '长图建议改成精简的 SVG 路径');
  }

  function checkAll(pkg, meta, files) {
    const c = checker();
    if (!pkg) {
      c.err('还没有案例包', '把整个案例文件夹拖进左边，或点「选择文件夹」；最快的方式是先下载模板');
      return c.out;
    }
    const p = clean(pkg), list = files || [];
    checkIdentity(c, meta);
    checkContent(c, p.tabs || {});
    checkDemo(c, demoCfg(p), list);
    checkSize(c, demoCfg(p), list, p);
    return c.out;
  }

  /* ---------------- templates (downloaded verbatim by 下载案例模板) ---------------- */
  function templateManifest() {
    return {
      _readme: '这是案例包清单模板。以 _ 开头的字段是说明文字，导入时会被忽略，可以删掉。',
      _files: '同目录下可以放 demo/index.html、demo/demo.css、demo/demo.js 以及任意图片素材。上传时把整个文件夹拖进弹窗即可。',
      _usage: '1) 改 id / sceneId / title；2) 填 tabs.background 与 tabs.workflow；3) 示范页放 demo/index.html（整页模式），或只放 demo/demo.js（模块模式）；4) 在网站「＋ 添加案例」里拖入整个文件夹。',
      id: 'your-case-id',
      sceneId: 'w1',
      methods: ['ts'],
      _methods: '可选项：这个案例涉及哪些 AI 技术。数组，取值见首页「按方法找」面板（如 cv / ts / nlp / opt / kg）。不填或留空则自动继承所选场景的技术标签。',
      title: '你的案例名称',
      version: '1.0.0',
      updated: today(),
      tabs: {
        _note: 'background 必填，workflow 建议填，demo 可选（没有示范就整块删掉）。',
        background: {
          label: '专业背景',
          lede: '一段 100–200 字的导语：这个环节在干什么、为什么值得用算法做。',
          judge: [
            { label: '数据形态', value: '曲线 / 图像', desc: '原始数据长什么样' },
            { label: '标注成本', value: '高', desc: '谁来标、标多久' },
            { label: '可见收益', value: '快', desc: '从哪一步开始省人力' },
            { label: '难度', value: '中', desc: '卡点是什么' }
          ],
          sections: [
            { no: 1, en: 'PROBLEM', title: '当前做法与问题', html: '<p>现在由谁、用什么方法做，一天能做多少，误差多大。</p>' },
            { no: 2, en: 'INTERVENTION', title: '智能方法介入点', html: '<p>算法替代其中哪一步，输出什么，人还需要做什么。</p>' },
            { no: 3, en: 'DATA', title: '数据准备要求', html: '<p>需要哪些数据、多少量、怎么标注。</p>' },
            { no: 4, en: 'DIFFICULTY', title: '难度与参考方向', html: '<p>难点在哪，可以先从哪条技术路线试。</p>' }
          ]
        },
        workflow: {
          label: '案例流程',
          title: '案例实施流程',
          lead: ['第一段：这个流程解决什么问题、适用条件是什么。', '第二段：整体思路。'],
          stats: [['样本量', '42 口井'], ['周期', '3 周']],
          steps: [
            { name: '数据整理', role: '数据', do: '把原始数据统一格式、深度对齐、剔除异常段。', effect: '得到可直接进模型的样本集。', trap: '深度基准不统一会让下游全部错位。' },
            { name: '标注与切分', role: '标注', do: '按层段标注，留出独立验证集。', effect: '有可复现的评测口径。' }
          ],
          metrics: { title: '评价指标与判定规则', html: '<p>写清指标定义与容差，例如"界面误差 ≤ 0.5 m 记为命中"。</p>' },
          fails: [
            { name: '过分割', why: '噪声波动被当成界面，层数虚高。' },
            { name: '薄层漏检', why: '最小层厚规则把有价值的薄层合并掉了。' }
          ]
        },
        demo: {
          _note: 'mode: auto 会自动判断：有 html 走整页模式，只有 js 走模块模式，都没有就看 builtin。',
          mode: 'auto',
          html: 'demo/index.html',
          js: 'demo/demo.js',
          label: '可运行示范',
          intro: '拖这个滑杆，看阈值怎么影响分层结果。',
          height: 560
        }
      }
    };
  }

  var TPL_HTML = [
    '<!DOCTYPE html>',
    '<html lang="zh-CN">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>示范：阈值法划分储层</title>',
    '<link rel="stylesheet" href="demo.css">',
    '</head>',
    '<body>',
    '<div class="panel">',
    '  <h1>阈值法划分储层</h1>',
    '  <p class="lead">这个文件是案例包自带的示范页样板。它是完整的 HTML，图表、Canvas、WebGL、第三方库都可以放，',
    '  运行在隔离的 iframe 里，不会影响主站样式。</p>',
    '',
    '  <div class="ctl">',
    '    <label for="th">伽马阈值 <output id="out">75</output> API</label>',
    '    <input type="range" id="th" min="30" max="120" value="75" step="1">',
    '  </div>',
    '',
    '  <svg id="log" viewBox="0 0 660 230" role="img" aria-label="随阈值变化的储层划分"></svg>',
    '',
    '  <p class="note" id="note"></p>',
    '</div>',
    '<script src="demo.js"></scr' + 'ipt>',
    '</body>',
    '</html>'
  ].join('\n');

  var TPL_CSS = [
    '/* 示范页样式。运行在 iframe 里，可以随便写，不会影响主站。 */',
    ':root{--ink:#242b2e;--ink-2:#4d565b;--ink-3:#79828a;--line:#e9e4d8;--jade:#2f7d6b;--paper:#fbfaf6}',
    '*{box-sizing:border-box}',
    'body{margin:0;padding:18px 20px 24px;background:var(--paper);color:var(--ink);',
    '  font-family:"Inter","PingFang SC","Microsoft YaHei",system-ui,sans-serif;font-size:13px;line-height:1.7}',
    '.panel{max-width:760px}',
    'h1{font-size:19px;margin:0 0 6px;letter-spacing:-.01em}',
    '.lead{margin:0 0 16px;color:var(--ink-2);font-size:12.5px;line-height:1.75}',
    '.ctl{display:flex;align-items:center;gap:14px;margin-bottom:12px;flex-wrap:wrap}',
    '.ctl label{font-size:12px;color:var(--ink-2);display:flex;align-items:center;gap:6px}',
    '.ctl output{font-family:ui-monospace,monospace;font-size:13px;color:var(--jade);font-weight:600}',
    '.ctl input[type=range]{flex:1;min-width:220px;accent-color:var(--jade);height:18px}',
    '#log{width:100%;height:auto;border:1px solid var(--line);border-radius:8px;background:#fff}',
    '.note{margin-top:10px;font-size:12px;color:var(--ink-3)}',
    '.note b{color:var(--ink)}'
  ].join('\n');

  var TPL_JS = [
    '/* =========================================================',
    '   示范脚本模板（整页模式）',
    '   ---------------------------------------------------------',
    '   这份文件由 index.html 通过 <script src="demo.js"> 引入，',
    '   运行在沙箱 iframe 里，可以自由操作 document。',
    '',
    '   包里其它素材可以直接用相对路径引用：',
    '     <img src="core.png">   → 由宿主自动替换成 data URL',
    '     var url = window.caseAsset("core.png");',
    '   ========================================================= */',
    '',
    '(function () {',
    '  "use strict";',
    '',
    '  /* 1. 造一条假的伽马曲线：三段不同基线 + 噪声 */',
    '  var N = 240, curve = [];',
    '  var segs = [[60, 9], [92, 7], [48, 11]];',
    '  for (var i = 0; i < N; i++) {',
    '    var s = segs[Math.min(2, Math.floor(i / (N / 3)))];',
    '    var rnd = (Math.sin(i * 12.9898) * 43758.5453) % 1;',
    '    curve.push(Math.max(12, Math.min(140, s[0] + (rnd - 0.5) * s[1] * 3.2)));',
    '  }',
    '',
    '  var svg = document.getElementById("log");',
    '  var range = document.getElementById("th");',
    '  var out = document.getElementById("out");',
    '  var note = document.getElementById("note");',
    '',
    '  var W = 660, H = 230, L = 42, R = 14, T = 14, B = 26;',
    '  var x = function (i) { return L + i / (N - 1) * (W - L - R); };',
    '  var y = function (v) { return T + (1 - (v - 10) / 130) * (H - T - B); };',
    '',
    '  function draw() {',
    '    var th = Number(range.value);',
    '    out.textContent = th;',
    '',
    '    var s = "";',
    '    /* 网格与坐标 */',
    '    [30, 60, 90, 120].forEach(function (v) {',
    '      s += \'<line x1="\' + L + \'" y1="\' + y(v) + \'" x2="\' + (W - R) + \'" y2="\' + y(v) +',
    '           \'" stroke="#efece1" stroke-width="1"/>\';',
    '      s += \'<text x="\' + (L - 8) + \'" y="\' + (y(v) + 3) + \'" font-size="9" fill="#9ba3a9" \' +',
    '           \'text-anchor="end" font-family="monospace">\' + v + \'</text>\';',
    '    });',
    '',
    '    /* 阈值线 */',
    '    s += \'<line x1="\' + L + \'" y1="\' + y(th) + \'" x2="\' + (W - R) + \'" y2="\' + y(th) +',
    '         \'" stroke="#b26a39" stroke-width="1.2" stroke-dasharray="4 3"/>\';',
    '',
    '    /* 低于阈值的连续段 → 储层，填底色 */',
    '    var i = 0, runs = 0;',
    '    while (i < N) {',
    '      if (curve[i] < th) {',
    '        var j = i;',
    '        while (j < N && curve[j] < th) j++;',
    '        if (j - i >= 3) {',
    '          runs++;',
    '          s += \'<rect x="\' + x(i) + \'" y="\' + T + \'" width="\' + (x(j - 1) - x(i)) +',
    '               \'" height="\' + (H - T - B) + \'" fill="#e6f1ec" opacity=".85"/>\';',
    '        }',
    '        i = j;',
    '      } else i++;',
    '    }',
    '',
    '    /* 曲线 */',
    '    var d = "";',
    '    for (var k = 0; k < N; k++) d += (k ? "L" : "M") + x(k).toFixed(1) + " " + y(curve[k]).toFixed(1);',
    '    s += \'<path d="\' + d + \'" fill="none" stroke="#2f7d6b" stroke-width="1.4" stroke-linejoin="round"/>\';',
    '',
    '    s += \'<text x="\' + (L + 2) + \'" y="\' + (H - 8) + \'" font-size="9.5" fill="#9ba3a9" \' +',
    '         \'font-family="monospace">0 m</text>\';',
    '    s += \'<text x="\' + (W - R) + \'" y="\' + (H - 8) + \'" font-size="9.5" fill="#9ba3a9" \' +',
    '         \'text-anchor="end" font-family="monospace">深度 30 m</text>\';',
    '',
    '    svg.innerHTML = s;',
    '    note.innerHTML = "当前阈值 <b>" + th + " API</b>，低于阈值的连续井段被划为储层，共 <b>" + runs +',
    '      " 段</b>。把阈值拖低会并入更多泥质段，拖高会切碎有效储层——这正是人工卡层最费时的地方。";',
    '  }',
    '',
    '  range.addEventListener("input", draw);',
    '  draw();',
    '})();'
  ].join('\n');

  var TPL_README = [
    '案例包模板',
    '==========',
    '',
    '目录结构：',
    '',
    '  my-case/',
    '    case.json          清单：元信息 + 专业背景 + 案例流程（必需）',
    '    demo/index.html    示范页（整页模式，可选）',
    '    demo/demo.css      示范页样式（可选）',
    '    demo/demo.js       示范页脚本；没有 html 时它就是模块模式的挂载脚本（可选）',
    '    任意素材            图片 / JSON 数据 / 字体，放进来即可被引用',
    '',
    '怎么用：',
    '',
    '  1. 解压这个包，用编辑器改 case.json 里的 id / sceneId / title 和两块正文。',
    '  2. 打开网站首页右上角「＋ 添加案例」，把 my-case 整个文件夹拖进弹窗。',
    '  3. 右侧会逐项校验，红色错误改完再提交。',
    '',
    '示范的两种写法：',
    '',
    '  A. 整页模式 —— 有 demo/index.html',
    '     想怎么画就怎么画，运行在沙箱 iframe 里，样式不会污染主站。',
    '     <link href="demo.css"> 与 <script src="demo.js"> 会被自动内联，',
    '     图片等素材的 src 会被自动替换成 data URL。',
    '',
    '  B. 模块模式 —— 只有 demo/demo.js',
    '     脚本会被执行，并用 Shadow DOM 隔离样式。需要导出 mount：',
    '',
    '       module.exports = {',
    '         mount: function (root, api) {',
    '           // root: 你的容器；api.asset("x.png") 取素材，api.scene 取场景元数据',
    '         },',
    '         unmount: function () { /* 清定时器、事件监听 */ }',
    '       };',
    '',
    '     或者 window.__CASE_MOUNT__ = function (root, api) { ... };',
    '',
    '  都没有的话，可以在 case.json 里写 tabs.demo.builtin = "welllog-layer"',
    '  复用系统已有的示范。',
    '',
    '注意：案例存在浏览器 localStorage 里，换电脑/换浏览器要重新上传。',
    '要永久发布给所有人看，请用开发者方式：把源包放进 plugins/<stageId>/<sceneId>/<caseId>/，然后构建站点。',
    ''
  ].join('\n');

  /* ---------------- lifecycle ---------------- */
  function loadSaved() {
    saved = readStore(KEY).filter(r => r && r.pkg && r.meta && r.meta.id);
    // v1 records only hold the manifest; they upgrade in memory and storage is left untouched.
    for (const r of readStore(KEY_V1)) {
      if (!r || !r.pkg || !r.meta || !r.meta.id || saved.some(x => x.meta.id === r.meta.id)) continue;
      saved.push({ v: 1, pkg: r.pkg, meta: r.meta, files: [], savedAt: r.savedAt });
    }
    for (const r of saved) if (!global.Cases.get(r.meta.id)) global.Cases.register(toCase(r));   // JS plugins win
    applyBlocklist();
  }

  const notice = (title, sub) => global.dispatchEvent(new CustomEvent('atlas:notice', { detail: { title, sub } }));

  // Imported case: drop the stored package. Builtin case: add to the hidden list.
  function remove(id, confirmed) {
    const c = global.Cases.get(id);
    if (!c) return false;
    const name = c.title || id;
    const msg = c.imported
      ? '从本机移除案例「' + name + '」？\n将删除浏览器里保存的这份案例包，磁盘上的文件不受影响。'
      : '删除插件案例「' + name + '」？\n它的 .js 文件仍留在磁盘上，但会立即从站点消失，刷新后也保持隐藏；\n在案例库的「已隐藏」区可以随时恢复。';
    if (!confirmed && !global.confirm(msg)) return false;
    if (c.imported) {
      saved = saved.filter(r => r.meta.id !== id);
      writeStore(saved);
    } else {
      const bl = readBlocklist();
      if (bl.indexOf(id) < 0) { bl.push(id); writeBlocklist(bl); }
    }
    global.Cases.unregister(id);
    notice('已删除「' + name + '」', '页面已同步更新');
    return true;
  }

  // The plugin loader re-registers the case once it leaves the hidden list.
  function restore(id) {
    writeBlocklist(readBlocklist().filter(x => x !== id));
    global.__restorePlugin(id);
    return true;
  }

  // Only imported cases are editable; patch = { title, sceneId, methods, version, updated }.
  // Validation happens on a copy so a rejected edit leaves the stored record unchanged.
  function updateMeta(id, patch) {
    const original = saved.find(r => r.meta.id === id);
    if (!original) return { ok: false, error: '不是本机上传的案例，无法在线编辑（插件案例请改源文件）' };
    const rec = Object.assign({}, original, { meta: Object.assign({}, original.meta) });
    const p = patch || {};
    if (p.title != null) rec.meta.title = String(p.title).slice(0, 40);
    if (p.version != null) rec.meta.version = String(p.version).slice(0, 16);
    if (p.updated != null) rec.meta.updated = String(p.updated).slice(0, 10);
    if (p.sceneId != null) {
      if (!sceneOf(p.sceneId)) return { ok: false, error: '目标场景不存在：' + p.sceneId };
      rec.meta.sceneId = p.sceneId;
    }
    if (p.methods != null) {
      if (!Array.isArray(p.methods)) return { ok: false, error: 'methods 应为数组' };
      rec.meta.methods = p.methods.filter(k => global.ATLAS.methods && global.ATLAS.methods[k]);
    }
    const next = saved.map(r => r === original ? rec : r);
    if (!writeStore(next)) return { ok: false, error: '浏览器存储失败' };
    saved = next;
    global.Cases.unregister(id);
    global.Cases.register(toCase(rec));
    return { ok: true };
  }

  const list = () => saved.map(r => ({ id: r.meta.id, title: r.meta.title, sceneId: r.meta.sceneId, files: (r.files || []).length, savedAt: r.savedAt }));

  function makeZip(entries) {
    const files = {};
    for (const e of entries) files[e.name] = e.binary || strToU8(e.text || '');
    return new Blob([zipSync(files, { level: 0 })], { type: 'application/zip' });
  }

  function commit(pkg, meta, files) {
    const errors = checkAll(pkg, meta, files).filter(r => r.level === 'error');
    if (errors.length) return { ok: false, error: errors.map(r => r.msg).join('; ') };
    const rec = { v: 2, pkg, meta, files, savedAt: new Date().toISOString() };
    const next = saved.filter(r => r.meta.id !== meta.id).concat(rec);
    const stored = writeStore(next);
    saved = next;
    global.Cases.register(toCase(rec));
    return { ok: true, stored };
  }

  global.CaseImport = {
    open: opts => global.__ImportUI.open(opts || {}),
    close: () => global.__ImportUI.close(),
    loadSaved, remove: id => remove(id, false), restore, updateMeta,
    blockedList: readBlocklist, list, template: templateManifest,
    check: (pkg, meta) => checkAll(pkg, meta, pendingFiles),
    makeZip,
    templates: { manifest: TPL_README, html: TPL_HTML, css: TPL_CSS, js: TPL_JS }
  };
  // Shell-only service used by the import dialog and admin pages.
  global.__PackageService = {
    readOne, stripRoot, pickManifest, toCase, commit,
    setFiles: files => { pendingFiles = files; },
    check: checkAll,
    removeConfirmed: id => remove(id, true)
  };
  loadSaved();
})(window);
