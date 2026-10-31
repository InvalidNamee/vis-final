/* Case demo host: renders a package's demo files as an isolated, offline page.
     page   — the package has an HTML file; it runs in a sandboxed iframe via srcdoc.
     module — only demo.js; it runs inside Shadow DOM and exports mount(root, api).
   Every referenced file is inlined as a data URL, so demos never make network requests.
     CaseDemoHost.create(container, pkg, ctx) -> { mode, destroy() }
     pkg = { files:[{name,size,mime,enc,data}], demo:{mode,html,js,height}, meta } */
(function (global) {
  'use strict';

  const MIME = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
    webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon', bmp: 'image/bmp',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', mp4: 'video/mp4', webm: 'video/webm',
    woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf',
    json: 'application/json', csv: 'text/csv', txt: 'text/plain', pdf: 'application/pdf'
  };
  const TEXT_EXT = ['json', 'js', 'mjs', 'css', 'html', 'htm', 'svg', 'txt', 'csv', 'tsv', 'md', 'xml', 'yaml', 'yml', 'geojson'];

  // Site tokens copied into demos; module demos may use var(--jade) etc. directly.
  const TOKENS = ['--paper', '--paper-2', '--paper-3', '--card', '--card-soft',
    '--line', '--line-2', '--line-3', '--ink', '--ink-2', '--ink-3', '--ink-4', '--ink-inv',
    '--jade', '--jade-d', '--jade-l', '--clay', '--clay-d', '--clay-l',
    '--ok', '--ok-bg', '--warn', '--warn-bg', '--bad', '--bad-bg',
    '--sans', '--mono', '--r-s', '--r-m', '--r-l', '--sh-1', '--sh-2',
    '--demo-font-size', '--demo-title-size', '--demo-heading-size', '--demo-value-size'];

  const BASE_CSS =
    '.cd-box{display:block;font-family:var(--sans,system-ui,sans-serif);font-size:13px;line-height:1.72;color:var(--ink,#16202b);padding:2px 0 6px}' +
    '.cd-err{border:1px solid var(--bad,#b8322a);background:var(--bad-bg,#fbeae8);color:var(--bad,#b8322a);border-radius:8px;padding:11px 13px;font-size:12px;line-height:1.7}' +
    '.cd-err b{display:block;margin-bottom:4px;font-size:12.5px}' +
    '.cd-err code{font-family:var(--mono,monospace);background:rgba(0,0,0,.05);padding:1px 4px;border-radius:3px}';

  const LOCAL_REF = /^(data:|https?:|mailto:|tel:|#|\/\/)/i;
  let seq = 0;

  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const clip = s => String(s).split('?')[0].split('#')[0];
  function extOf(name) { const m = /\.([a-z0-9]+)$/i.exec(clip(name)); return m ? m[1].toLowerCase() : ''; }
  const baseOf = name => String(name).split('/').pop();
  const isCss = n => extOf(n) === 'css';
  const isJs = n => ['js', 'mjs'].indexOf(extOf(n)) >= 0;
  const isHtml = n => ['html', 'htm'].indexOf(extOf(n)) >= 0;
  const isCode = n => isHtml(n) || isJs(n) || isCss(n);
  const isText = n => TEXT_EXT.indexOf(extOf(n)) >= 0;
  const mimeOf = n => MIME[extOf(n)] || (isText(n) ? 'text/plain' : 'application/octet-stream');

  // Exact path first, then a case-insensitive basename match.
  function findFile(files, ref) {
    if (!ref || !files) return null;
    const r = clip(String(ref).replace(/^\.\//, ''));
    const bn = baseOf(r).toLowerCase();
    return files.find(f => f.name === r) || files.find(f => baseOf(f.name).toLowerCase() === bn) || null;
  }
  const firstOf = (files, test) => (files || []).find(f => test(f.name)) || null;

  function urlOf(f) {
    if (!f) return '';
    if (f.enc === 'dataurl') return f.data;
    return 'data:' + (f.mime || mimeOf(f.name)) + ';charset=utf-8,' + encodeURIComponent(f.data);
  }

  function resolveMode(pkg) {
    const d = (pkg && pkg.demo) || {}, files = (pkg && pkg.files) || [];
    const mode = d.mode || 'auto';
    if (mode === 'builtin' || mode === 'page' || mode === 'module') return mode;
    if (findFile(files, d.html) || firstOf(files, isHtml)) return 'page';
    if (findFile(files, d.js) || firstOf(files, isJs)) return 'module';
    return 'none';
  }

  function tokenCss(selector) {
    const cs = global.getComputedStyle(document.documentElement);
    let out = (selector || ':host') + '{';
    for (const t of TOKENS) { const v = cs.getPropertyValue(t); if (v) out += t + ':' + v.trim() + ';'; }
    return out + '}';
  }

  /* ---------------- page mode: one self-contained HTML document ---------------- */
  const cssText = (css, map, files) => String(css)
    .replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (all, q, ref) => {
      if (/^(data:|https?:|\/\/)/i.test(ref)) return all;
      const f = findFile(files, ref);
      return f ? 'url("' + map[f.name] + '")' : all;
    })
    .replace(/<\/style/gi, '<\\/style');
  const jsText = js => String(js).replace(/<\/script/gi, '<\\/script');
  const styleTag = (src, css) => '<style data-src="' + esc(src) + '">' + css + '</style>';
  const scriptTag = (src, js) => '<script data-src="' + esc(src) + '">' + jsText(js) + '</script' + '>';

  // Reports body height to the parent; documentElement.scrollHeight would never shrink with content.
  function reporter(token, assets) {
    return '<script>window.__ASSETS__=' + assets + ';' +
      'window.caseAsset=function(n){return window.__ASSETS__[n]||""};' +
      '(function(){var last=-1;function send(){' +
      'var b=document.body;if(!b)return;var cs=getComputedStyle(b);' +
      'var h=Math.ceil(Math.max(b.scrollHeight,b.getBoundingClientRect().height)+' +
      '(parseFloat(cs.marginTop)||0)+(parseFloat(cs.marginBottom)||0));' +
      'h=Math.min(h,9000);if(Math.abs(h-last)>2){last=h;' +
      'try{parent.postMessage({__caseDemo:"' + token + '",h:h},"*")}catch(e){}}}' +
      'document.addEventListener("DOMContentLoaded",function(){send();' +
      'try{if(window.ResizeObserver){new ResizeObserver(send).observe(document.body)}}catch(e){}});' +
      'window.addEventListener("load",send);' +
      'var n=0,t=setInterval(function(){send();if(++n>40)clearInterval(t)},400);' +
      '})();</script' + '>';
  }

  function buildPageDoc(pkg, token, theme) {
    const files = pkg.files || [], d = pkg.demo || {};
    const htmlFile = findFile(files, d.html) || firstOf(files, isHtml);
    let html = htmlFile ? String(htmlFile.data)
      : '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><p>包里没有 HTML 文件。</p></body></html>';

    // Only assets go into the lookup table; html/css/js are inlined below and would double the size.
    const map = {};
    for (const f of files) {
      if (isCode(f.name)) continue;
      map[f.name] = urlOf(f);
      if (!map[baseOf(f.name)]) map[baseOf(f.name)] = urlOf(f);
    }
    const used = new Set();

    html = html.replace(/<link\b[^>]*>/gi, tag => {
      if (!/stylesheet/i.test(tag)) return tag;
      const m = /href\s*=\s*["']([^"']+)["']/i.exec(tag), f = m && findFile(files, m[1]);
      if (!f || !isCss(f.name)) return tag;
      used.add(f.name);
      return styleTag(m[1], cssText(f.data, map, files));
    });
    html = html.replace(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>\s*<\/script\s*>/gi, (tag, src) => {
      const f = findFile(files, src);
      if (!f || !isJs(f.name)) return tag;
      used.add(f.name);
      return scriptTag(src, f.data);
    });
    html = html.replace(/\b(src|href|poster)\s*=\s*["']([^"']+)["']/gi, (all, attr, ref) => {
      if (LOCAL_REF.test(ref)) return all;
      const f = findFile(files, ref);
      return !f || isCode(f.name) ? all : attr + '="' + map[f.name] + '"';
    });

    // Unreferenced stylesheets, then unreferenced scripts, go to the end of body.
    let tail = '';
    for (const f of files) if (!used.has(f.name) && isCss(f.name)) { used.add(f.name); tail += styleTag(f.name, cssText(f.data, map, files)); }
    for (const f of files) if (!used.has(f.name) && isJs(f.name)) { used.add(f.name); tail += scriptTag(f.name, f.data); }

    const head = reporter(token, JSON.stringify(map).replace(/</g, '\\u003c'));
    if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, m => m + head);
    else if (/<html[^>]*>/i.test(html)) html = html.replace(/<html[^>]*>/i, m => m + '<head><meta charset="utf-8">' + head + '</head>');
    else html = '<!DOCTYPE html><html><head><meta charset="utf-8">' + head + '</head><body>' + html + '</body></html>';

    // The shell theme goes last so it also follows unreferenced package CSS.
    if (theme) tail += '<style data-atlas-demo-theme>' + cssText(tokenCss(':root') + theme, map, files) + '</style>';
    if (tail) html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, tail + '</body>') : html + tail;
    return html;
  }

  function createPage(host, pkg, ctx) {
    const token = 'cd' + (++seq) + Date.now().toString(36);
    const minH = Math.max(220, Number(pkg.demo && pkg.demo.height) || 520);
    const frame = document.createElement('iframe');
    frame.className = 'cd-iframe';
    frame.setAttribute('sandbox', 'allow-scripts allow-forms allow-modals allow-popups allow-downloads');
    frame.setAttribute('referrerpolicy', 'no-referrer');
    frame.setAttribute('title', ((pkg.meta && pkg.meta.title) || '案例示范') + '（沙箱）');
    frame.style.height = minH + 'px';
    frame.srcdoc = buildPageDoc(pkg, token, ctx && ctx.demoTheme);
    host.appendChild(frame);

    function onMessage(e) {
      if (e.source !== frame.contentWindow || !e.data || e.data.__caseDemo !== token) return;
      frame.style.height = Math.min(9000, Math.max(minH, Number(e.data.h))) + 'px';
    }
    global.addEventListener('message', onMessage);
    return {
      mode: 'page',
      destroy() { global.removeEventListener('message', onMessage); frame.remove(); }
    };
  }

  /* ---------------- module mode: Shadow DOM + demo.js ---------------- */
  function errBox(box, title, detail) {
    const d = document.createElement('div');
    d.className = 'cd-err';
    d.innerHTML = '<b>' + esc(title) + '</b>' + esc(detail || '');
    box.appendChild(d);
  }

  // Accepts module.exports={mount}, exports.default={mount} and window.__CASE_MOUNT__.
  function mountTarget(out) {
    if (typeof out.mount === 'function') return out;
    if (out.default && typeof out.default.mount === 'function') return out.default;
    if (typeof global.__CASE_MOUNT__ === 'function') return { mount: global.__CASE_MOUNT__ };
    return null;
  }

  function runModule(box, jsFile, api) {
    const mod = { exports: {} };
    let fn;
    try { fn = new Function('module', 'exports', 'api', 'root', 'console', String(jsFile.data) + '\n;return module.exports;'); }
    catch (e) { errBox(box, 'demo.js 有语法错误（第 ' + (e.lineNumber || '?') + ' 行附近）', e.message); return null; }
    try { delete global.__CASE_MOUNT__; } catch (e) { global.__CASE_MOUNT__ = null; }
    let out;
    try { out = fn(mod, mod.exports, api, box, global.console) || mod.exports; }
    catch (e) { errBox(box, 'demo.js 在加载阶段抛出异常', e.message); return null; }
    const target = out && mountTarget(out);
    if (!target) {
      errBox(box, 'demo.js 没有导出 mount', '支持三种写法：module.exports={mount(root,api){}}、exports.mount=function(root,api){}、window.__CASE_MOUNT__=function(root,api){}。');
      return null;
    }
    try { return target.mount(box, api) || target; }
    catch (e) { errBox(box, 'mount() 执行失败', e.message); return null; }
  }

  function createModule(host, pkg, ctx) {
    const files = pkg.files || [], d = pkg.demo || {};
    const shadow = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    const style = document.createElement('style');
    style.textContent = [tokenCss(), BASE_CSS].concat(files.filter(f => isCss(f.name)).map(f => String(f.data)), (ctx && ctx.demoTheme) || '').join('\n');
    shadow.appendChild(style);
    const box = document.createElement('div');
    box.className = 'cd-box';
    shadow.appendChild(box);

    const cleanups = [];
    const api = {
      asset: name => urlOf(findFile(files, name)),
      readText(name) { const f = findFile(files, name); return Promise.resolve(f && f.enc === 'text' ? f.data : ''); },
      list: () => files.map(f => f.name),
      scene: (ctx && ctx.scene) || null,
      kase: (ctx && ctx.kase) || null,
      onDestroy(fn) { if (typeof fn === 'function') cleanups.push(fn); },
      height(px) { if (px) host.style.minHeight = Number(px) + 'px'; }
    };

    const jsFile = findFile(files, d.js) || firstOf(files, isJs);
    let live = null;
    if (!jsFile) errBox(box, '没有找到 demo.js', '把示范脚本命名为 demo.js 放进包里，或改用 index.html 整页模式。');
    else live = runModule(box, jsFile, api);

    return {
      mode: 'module',
      destroy() {
        try { if (live && typeof live.unmount === 'function') live.unmount(); } catch (e) { /* demo cleanup errors stay inside the demo */ }
        for (const fn of cleanups) { try { fn(); } catch (e) { /* same */ } }
        try { if (shadow.host === host) host.innerHTML = ''; } catch (e) { /* detached host */ }
      }
    };
  }

  function create(container, pkg, ctx) {
    const none = { mode: 'none', destroy() {} };
    if (!container) return none;
    container.innerHTML = '';
    const mode = resolveMode(pkg);
    if (mode === 'page') return createPage(container, pkg, ctx);
    if (mode === 'module') return createModule(container, pkg, ctx);
    return none;
  }

  global.CaseDemoHost = { create, resolveMode, buildPageDoc, findFile, isText, mimeOf };
})(window);

export {};
