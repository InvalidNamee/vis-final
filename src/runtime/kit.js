/* Render kit K: cases call semantic helpers and never write shell class names.
   The markup below is styled by assets/core/ui.css; changing the look means editing that file only. */
(function (global) {
  'use strict';

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const pad = n => (n < 10 ? '0' : '') + n;
  const join = (items, fn) => (items || []).map(fn).join('');

  // Minimal inline markup inside case text: **bold** and `mono`.
  // The code style stays inline because module demos may render rich() inside Shadow DOM.
  function rich(s) {
    return esc(s)
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/`([^`]+)`/g, '<code style="font-family:var(--mono);font-size:.92em;background:var(--paper-2);padding:1px 4px;border-radius:3px">$1</code>');
  }

  function mtag(keys) {
    const M = (global.ATLAS && global.ATLAS.methods) || {};
    return join(keys, k => `<span class="mtag" data-m="${k}"><b>${(M[k] || { abbr: k.toUpperCase() }).abbr}</b></span>`);
  }
  const dtag = d => `<span class="dtag" data-d="${esc(d)}">难度 ${esc(d)}</span>`;

  const figure = (svg, no, caption) => `<div class="figure">${svg}</div>` +
    (caption ? `<div class="figcap"><b>图 ${esc(no)}</b><span>${rich(caption)}</span></div>` : '');

  const sec4 = (no, en, title, body) =>
    `<div class="sec4"><div class="sn">${pad(no)}<span>${esc(en)}</span></div><div class="sec4-body"><h3>${esc(title)}</h3>${body}</div></div>`;

  const judge = cells => '<div class="judge">' + join(cells, c =>
    `<div class="jc"><div class="jl">${esc(c.label)}</div><div class="jv">${c.html || rich(c.value)}</div>` +
    (c.desc ? `<div class="jd">${rich(c.desc)}</div>` : '') + '</div>') + '</div>';

  const dtable = (head, rows) => '<table class="dtable"><thead><tr>' + join(head, h => `<th>${esc(h)}</th>`) +
    '</tr></thead><tbody>' + join(rows, r => '<tr>' + join(r, c => `<td>${rich(c)}</td>`) + '</tr>') + '</tbody></table>';

  // ContentHtml toggles .done on click and updates #cl-txt / #cl-fill.
  function checklist(items, title) {
    const tick = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>';
    const rows = items.map((d, i) => {
      const [name, spec, note] = Array.isArray(d) ? d : [d, '', ''];
      return `<div class="cl-item" data-cl="${i}"><span class="cl-box">${tick}</span>` +
        `<span><span class="cl-t">${esc(name)}</span><span class="cl-s">${esc(spec)}</span></span>` +
        `<span class="cl-n">${esc(note)}</span></div>`;
    }).join('');
    return `<div class="checklist"><div class="cl-head"><span>${esc(title || '数据准备清单')} · ${items.length} 项</span>` +
      `<span class="cl-prog"><span id="cl-txt">0 / ${items.length}</span><span class="cl-bar"><i id="cl-fill"></i></span></span></div>${rows}</div>`;
  }

  function refs(list, hrefPrefix) {
    return '<div class="refs">' + join(list, r => {
      const name = typeof r === 'string' ? r : r.name;
      const href = typeof r === 'string' ? (hrefPrefix || '#/method/cv') : (r.href || hrefPrefix);
      return href ? `<a class="ref" href="${href}">${esc(name)}<span class="ar">↗</span></a>` : `<span class="ref">${esc(name)}</span>`;
    }) + '</div>';
  }

  function meter(diff) {
    const lv = diff === '低' ? 1 : diff === '高' ? 3 : 2;
    return '<div class="meter">' + [1, 2, 3].map(i => `<i class="${i <= lv ? 'on' : ''}${i === 3 && lv === 3 ? ' hi' : ''}"></i>`).join('') + '</div>';
  }

  // Label/value pairs; plain numbers are emphasised, a third array item marks the value as raw HTML.
  const cells = items => '<div class="case-cells">' + join(items, c => {
    const [l, v, raw] = Array.isArray(c) ? c : [c.label, c.value, c.html];
    const value = raw ? v : /^[\d.]+$/.test(String(v)) ? `<b>${esc(v)}</b>` : esc(v);
    return `<div><div class="l">${esc(l)}</div><div class="v">${value}</div></div>`;
  }) + '</div>';

  const pipeline = steps => '<div class="pipeline">' + join(steps, (s, i) =>
    `<div class="pstep"><div class="pn">${pad(i + 1)}</div><div class="pc">` +
    `<h4>${esc(s.name)}${s.role ? `<span class="role">${esc(s.role)}</span>` : ''}</h4>` +
    `<div class="pdo">${rich(s.do)}</div>` +
    (s.effect ? `<div class="peff"><span class="k">预期效果</span><span>${rich(s.effect)}</span></div>` : '') +
    (s.trap ? `<div class="peff trap"><span class="k">常见坑</span><span>${rich(s.trap)}</span></div>` : '') +
    '</div></div>') + '</div>';

  const fails = items => '<div class="fails">' + join(items, (f, i) =>
    `<div class="fail"><div class="fi">FAIL ${pad(i + 1)}</div><h5>${esc(f.name)}</h5><p>${rich(f.why)}</p></div>`) + '</div>';

  const callout = (text, kind) => `<div class="callout${kind === 'warn' ? ' warn' : ''}">` +
    `<span class="ci">${kind === 'warn' ? '注意' : '说明'}</span><span>${rich(text)}</span></div>`;

  // Tiny JS highlighter: comments and strings are stashed before keyword replacement.
  function highlight(src) {
    const stash = [];
    const keep = html => '\u0001' + (stash.push(html) - 1) + '\u0002';
    return esc(String(src)
      .replace(/\/\/[^\n]*/g, m => keep(`<span class="c">${esc(m)}</span>`))
      .replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g, m => keep(`<span class="s">${esc(m)}</span>`)))
      .replace(/\b(var|let|const|function|return|if|else|for|while|new|this|typeof|true|false|null|undefined)\b/g, '<span class="k">$1</span>')
      .replace(/\u0001(\d+)\u0002/g, (_, i) => stash[+i]);
  }

  function code(src, opts) {
    const o = opts || {};
    return '<div class="code"><div class="code-top"><span class="dots"><i></i><i></i><i></i></span>' +
      esc(o.file || 'snippet.js') + (o.note ? ' · ' + esc(o.note) : '') + `</div><pre>${highlight(src)}</pre></div>`;
  }

  const tree = lines => `<div class="tree">${lines.join('<br>')}</div>`;

  global.K = {
    esc, pad, rich, mtag, dtag, figure, sec4, judge, dtable, checklist, refs, meter,
    cells, pipeline, fails, callout, code, tree, highlight
  };
})(window);

export {};
