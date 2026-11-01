/* 教学实验：固定种子合成样本 → 按井切分 → 多项式岭回归 → 约束网格搜索。
   无网络、无第三方依赖。生成规则只用于造样本，不参与参数推荐。 */
(function (global) {
  'use strict';
  var ROCKS = ['砂岩', '页岩', '致密灰岩'];
  var LAMBDAS = [0.01, 0.1, 1, 10, 100];
  function random(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function generate(seed) {
    var rand = random(seed), rows = [];
    function normal() { return Math.sqrt(-2 * Math.log(Math.max(rand(), 1e-12))) * Math.cos(2 * Math.PI * rand()); }
    for (var well = 0; well < 18; well++) {
      var wellOffset = normal() * 0.8;
      for (var j = 0; j < 60; j++) {
        var rock = j % 3, wob = 40 + rand() * 120, rpm = 60 + rand() * 160, flow = 18 + rand() * 20;
        var w = (wob - 100) / 60, r = (rpm - 140) / 80, q = (flow - 28) / 10;
        // 人为构造的非线性响应，不是经验钻速公式，也不是工程标定结果。
        var expected = [38, 29, 23][rock] + (13 - rock * 2) * w + (9 - rock) * r + 3 * q
          - 11 * w * w - 8 * r * r - 2 * q * q + 2 * w * r + w * q - r * q;
        var rop = Math.max(0.5, expected + wellOffset + normal() * (1.3 + rock * 0.3));
        rows.push({ well: well + 1, rock: rock, wob: wob, rpm: rpm, flow: flow, rop: rop,
          split: well < 12 ? 'train' : well < 15 ? 'validation' : 'test' });
      }
    }
    return rows;
  }
  function features(row) {
    var w = (row.wob - 100) / 60, r = (row.rpm - 140) / 80, q = (row.flow - 28) / 10;
    var a = row.rock === 1 ? 1 : 0, b = row.rock === 2 ? 1 : 0;
    return [w, r, q, w * w, r * r, q * q, w * r, w * q, r * q, a, b, a * w, b * w, a * r, b * r, a * q, b * q];
  }
  function solve(matrix, rhs) {
    var a = matrix.map(function (row, i) { return row.concat(rhs[i]); }), n = rhs.length;
    for (var col = 0; col < n; col++) {
      var pivot = col;
      for (var k = col + 1; k < n; k++) if (Math.abs(a[k][col]) > Math.abs(a[pivot][col])) pivot = k;
      if (Math.abs(a[pivot][col]) < 1e-12) throw new Error('模型求解失败：矩阵接近奇异。');
      var temp = a[col]; a[col] = a[pivot]; a[pivot] = temp;
      var div = a[col][col];
      for (var j = col; j <= n; j++) a[col][j] /= div;
      for (var i = 0; i < n; i++) {
        if (i === col) continue;
        var f = a[i][col];
        for (var j2 = col; j2 <= n; j2++) a[i][j2] -= f * a[col][j2];
      }
    }
    return a.map(function (row) { return row[n]; });
  }
  function fit(rows, lambda) {
    var raw = rows.map(features), p = raw[0].length, n = rows.length;
    var mean = Array(p).fill(0), scale = Array(p).fill(0);
    raw.forEach(function (x) { x.forEach(function (v, j) { mean[j] += v / n; }); });
    raw.forEach(function (x) { x.forEach(function (v, j) { scale[j] += Math.pow(v - mean[j], 2) / n; }); });
    scale = scale.map(function (v) { return Math.sqrt(v) || 1; });
    var xtx = Array.from({ length: p + 1 }, function () { return Array(p + 1).fill(0); }), xty = Array(p + 1).fill(0);
    raw.forEach(function (x, i) {
      var z = [1].concat(x.map(function (v, j) { return (v - mean[j]) / scale[j]; }));
      for (var a = 0; a <= p; a++) {
        xty[a] += z[a] * rows[i].rop;
        for (var b = 0; b <= p; b++) xtx[a][b] += z[a] * z[b];
      }
    });
    // 目标：Σ(y-Xβ)² + λΣβ²，截距不惩罚。
    for (var d = 1; d <= p; d++) xtx[d][d] += lambda;
    var beta = solve(xtx, xty);
    return { lambda: lambda, mean: mean, scale: scale, beta: beta, predict: function (row) {
      // 与合成观测采用同一教学下限，避免线性输出出现负钻速。
      return Math.max(0.5, features(row).reduce(function (sum, v, j) { return sum + beta[j + 1] * (v - mean[j]) / scale[j]; }, beta[0]));
    } };
  }
  function evaluate(model, rows) {
    var avg = rows.reduce(function (s, r) { return s + r.rop; }, 0) / rows.length, ae = 0, sse = 0, sst = 0;
    rows.forEach(function (row) { var err = model.predict(row) - row.rop; ae += Math.abs(err); sse += err * err; sst += Math.pow(row.rop - avg, 2); });
    return { mae: ae / rows.length, r2: sst ? 1 - sse / sst : null };
  }
  function train(rows) {
    var training = rows.filter(function (r) { return r.split === 'train'; });
    var validation = rows.filter(function (r) { return r.split === 'validation'; });
    var testing = rows.filter(function (r) { return r.split === 'test'; });
    var candidates = LAMBDAS.map(function (lambda) { var model = fit(training, lambda); return { model: model, score: evaluate(model, validation) }; });
    var chosen = candidates.reduce(function (a, b) { return a.score.mae < b.score.mae ? a : b; });
    var avg = training.reduce(function (s, r) { return s + r.rop; }, 0) / training.length;
    return { model: chosen.model, candidates: candidates, test: testing, score: evaluate(chosen.model, testing),
      baseline: evaluate({ predict: function () { return avg; } }, testing) };
  }
  function optimize(model, state) {
    var best = null, grid = [], feasible = 0;
    for (var rpm = 60; rpm <= 220; rpm += 4) {
      for (var wob = 40; wob <= 160; wob += 4) {
        var point = { wob: wob, rpm: rpm, flow: state.flow, rock: state.rock };
        point.value = model.predict(point);
        point.feasible = wob <= state.maxWob && rpm <= state.maxRpm;
        grid.push(point);
        if (point.feasible) { feasible++; if (!best || point.value > best.value) best = point; }
      }
    }
    return { best: best, grid: grid, feasible: feasible };
  }
  var API = { generate: generate, fit: fit, train: train, evaluate: evaluate, optimize: optimize, features: features };
  global.DrillingROP = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof document === 'undefined') return;

  var rows = generate(20261023), learned = train(rows), model = learned.model;
  var ids = ['rock', 'wob', 'rpm', 'flow', 'max-wob', 'max-rpm'];
  var state, search, applied = false;
  function byId(id) { return document.getElementById(id); }
  function fmt(v, n) { return v === null ? '不可定义' : v.toFixed(n === undefined ? 1 : n); }
  function text(id, value) { byId(id).textContent = value; }
  function readState() { return { rock: +byId('rock').value, wob: +byId('wob').value, rpm: +byId('rpm').value, flow: +byId('flow').value, maxWob: +byId('max-wob').value, maxRpm: +byId('max-rpm').value }; }
  function line(x1, y1, x2, y2, extra) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" ' + (extra || '') + '/>'; }
  function label(x, y, value, extra) { return '<text x="' + x + '" y="' + y + '" ' + (extra || '') + '>' + value + '</text>'; }
  function color(t) { t = Math.max(0, Math.min(1, t)); return 'color-mix(in srgb,var(--jade) ' + (t * 100) + '%,var(--jade-l))'; }
  function drawHeatmap() {
    var x0 = 64, y0 = 25, width = 560, height = 328, cw = width / 31, ch = height / 41;
    function x(w) { return x0 + ((w - 40) / 4 + 0.5) * cw; }
    function y(r) { return y0 + ((220 - r) / 4 + 0.5) * ch; }
    var s = '<title id="heat-title">参数组合与预测机械钻速热力图</title><desc id="heat-desc">' + ROCKS[state.rock] + '，排量 ' + state.flow + ' L/s。灰色斜线区超出操作上限，圆圈是当前参数，菱形是推荐参数。</desc>';
    s += '<defs><pattern id="excluded" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="var(--card-soft)"/><path d="M-1 1L1-1M0 7L7 0M6 8L8 6" stroke="var(--line-2)" stroke-width="1"/></pattern><linearGradient id="ramp">';
    for (var c = 0; c <= 4; c++) s += '<stop offset="' + c * 25 + '%" stop-color="' + color(c / 4) + '"/>';
    s += '</linearGradient></defs>';
    search.grid.forEach(function (p) { s += '<rect x="' + (x(p.wob) - cw / 2) + '" y="' + (y(p.rpm) - ch / 2) + '" width="' + (cw + 0.15) + '" height="' + (ch + 0.15) + '" fill="' + (p.feasible ? color(p.value / 50) : 'url(#excluded)') + '"><title>钻压 ' + p.wob + ' kN，转速 ' + p.rpm + ' r/min：' + fmt(p.value) + ' m/h' + (p.feasible ? '' : '，超出操作上限') + '</title></rect>'; });
    s += '<rect x="' + x0 + '" y="' + y0 + '" width="' + width + '" height="' + height + '" fill="none" stroke="var(--line-2)"/>';
    [40, 60, 80, 100, 120, 140, 160].forEach(function (v) { s += label(x(v), y0 + height + 21, v, 'text-anchor="middle"'); });
    [60, 100, 140, 180, 220].forEach(function (v) { s += label(x0 - 12, y(v) + 4, v, 'text-anchor="end"'); });
    s += label(x0 + width / 2, y0 + height + 47, '钻压 kN', 'text-anchor="middle"');
    s += '<text transform="translate(19 ' + (y0 + height / 2) + ') rotate(-90)" text-anchor="middle">转速 r/min</text>';
    s += '<rect x="' + (x0 + width - 150) + '" y="' + (y0 + height + 62) + '" width="150" height="8" fill="url(#ramp)"/>';
    s += label(x0 + width - 150, y0 + height + 84, '0') + label(x0 + width, y0 + height + 84, '50 m/h', 'text-anchor="end"');
    var b = search.best, bx = x(b.wob), by = y(b.rpm);
    s += '<path d="M' + bx + ' ' + (by - 9) + 'l9 9-9 9-9-9z" fill="var(--clay)" stroke="var(--card)" stroke-width="2"/>';
    s += '<circle cx="' + x(state.wob) + '" cy="' + y(state.rpm) + '" r="7" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5"/>';
    if (state.wob === b.wob && state.rpm === b.rpm) s += '<circle cx="' + bx + '" cy="' + by + '" r="3" fill="var(--clay)"/>';
    byId('heatmap').innerHTML = s;
  }
  function drawResponse() {
    var w = 510, h = 280, left = 55, top = 42, right = 20, bottom = 60;
    function x(v) { return left + (v - 40) / 120 * (w - left - right); }
    function y(v) { return h - bottom - v / 60 * (h - bottom - top); }
    var s = '';
    [0, 20, 40, 60].forEach(function (v) { s += line(left, y(v), w - right, y(v), 'stroke="var(--line)"') + label(left - 8, y(v) + 4, v, 'text-anchor="end"'); });
    [40, 80, 120, 160].forEach(function (v) { s += label(x(v), h - bottom + 26, v, 'text-anchor="middle"'); });
    var path = '';
    for (var wob = 40; wob <= 160; wob += 2) path += (wob === 40 ? 'M' : 'L') + x(wob) + ',' + y(model.predict({ wob: wob, rpm: state.rpm, flow: state.flow, rock: state.rock }));
    s += '<path d="' + path + '" fill="none" stroke="var(--jade)" stroke-width="3"/>';
    s += line(x(state.maxWob), top, x(state.maxWob), h - bottom, 'stroke="var(--clay)" stroke-dasharray="5 4"');
    var limitX = x(state.maxWob), labelRight = limitX < left + 80;
    s += label(limitX + (labelRight ? 7 : -7), top + 12, '钻压上限', 'text-anchor="' + (labelRight ? 'start' : 'end') + '"');
    s += '<circle cx="' + x(state.wob) + '" cy="' + y(model.predict(state)) + '" r="5" fill="var(--card)" stroke="var(--ink)" stroke-width="2"/>';
    s += label(left, 22, '预测钻速 m/h', 'class="plot-y-label"') + label(w / 2, h - 5, '钻压 kN', 'text-anchor="middle"');
    byId('response').innerHTML = s;
  }
  function drawScatter() {
    var left = 55, top = 42, right = 485, bottom = 220, max = 60;
    function x(v) { return left + v / max * (right - left); }
    function y(v) { return bottom - v / max * (bottom - top); }
    var s = '';
    [0, 20, 40, 60].forEach(function (v) { s += line(left, y(v), right, y(v), 'stroke="var(--line)"') + label(left - 8, y(v) + 4, v, 'text-anchor="end"') + label(x(v), bottom + 26, v, 'text-anchor="middle"'); });
    s += line(x(0), y(0), x(max), y(max), 'stroke="var(--ink-4)" stroke-dasharray="5 4"');
    learned.test.forEach(function (p) { s += '<circle cx="' + x(p.rop) + '" cy="' + y(model.predict(p)) + '" r="3" fill="' + ['var(--jade)', 'var(--clay)', 'var(--clay)'][p.rock] + '" opacity=".6"><title>' + ROCKS[p.rock] + ' · 虚拟井 ' + p.well + '：观测 ' + fmt(p.rop) + '，预测 ' + fmt(model.predict(p)) + ' m/h</title></circle>'; });
    s += label(left, 22, '模型预测 m/h', 'class="plot-y-label"') + label(270, 276, '合成观测钻速 m/h', 'text-anchor="middle"');
    byId('scatter').innerHTML = s;
    text('mae', fmt(learned.score.mae, 2)); text('r2', fmt(learned.score.r2, 3)); text('baseline', fmt(learned.baseline.mae, 2));
    text('model-choice', '验证集从 5 个候选正则化强度中选择 λ = ' + model.lambda + '；选定后保持训练模型不变，最后才评价 3 口测试井。');
    byId('lambda-results').innerHTML = learned.candidates.map(function (c) { return '<span class="lambda-option' + (c.model.lambda === model.lambda ? ' selected' : '') + '">λ ' + c.model.lambda + '：<b>' + fmt(c.score.mae, 3) + '</b> m/h' + (c.model.lambda === model.lambda ? ' · 选中' : '') + '</span>'; }).join('');
  }
  function render() {
    state = readState(); search = optimize(model, state);
    ids.slice(1).forEach(function (id) { text(id + '-value', byId(id).value); });
    var current = model.predict(state), best = search.best;
    var feasible = state.wob <= state.maxWob && state.rpm <= state.maxRpm;
    var gain = (best.value / current - 1) * 100;
    text('current-rop', fmt(current)); text('best-rop', fmt(best.value));
    text('gain', (gain >= 0 ? '+' : '') + fmt(gain));
    text('gain-label', feasible ? '预测变化' : '约束调整后变化');
    text('recommend-text', ROCKS[state.rock] + '，排量 ' + state.flow + ' L/s：推荐钻压 ' + best.wob + ' kN、转速 ' + best.rpm + ' r/min。');
    text('map-summary', '当前有 ' + search.feasible + ' / ' + search.grid.length + ' 组参数满足上限。' + (feasible ? '调低操作上限，观察推荐点如何移动；切换岩层，观察整个响应面如何变化。' : '当前设置已经超出操作上限；推荐结果可能比当前更慢，因为先满足约束再追求钻速。'));
    text('status', !feasible ? '当前设置超出本次操作上限，请应用推荐参数或调整当前设置。' : applied ? '已应用推荐参数。继续改变岩层或操作上限，观察推荐如何变化。' : '比较的是模型预测值，预测变化不是实测提速收益。');
    byId('status').className = 'status' + (!feasible ? ' outside' : '');
    byId('apply').disabled = state.wob === best.wob && state.rpm === best.rpm;
    text('time-story', '假设连续钻进 100 m：当前预测需要 ' + fmt(100 / current) + ' h，推荐预测需要 ' + fmt(100 / best.value) + ' h。该时间只由进尺 ÷ 预测机械钻速计算，不是整段作业工期。');
    drawHeatmap(); drawResponse();
    window.__caseResult={learned:learned,search:search,model:model,rows:rows,current:current,best:best}; window.__caseState=Object.assign({},state);
  }
  ids.forEach(function (id) { byId(id).addEventListener(id === 'rock' ? 'change' : 'input', function () { applied = false; render(); }); });
  byId('apply').addEventListener('click', function () { byId('wob').value = search.best.wob; byId('rpm').value = search.best.rpm; applied = true; render(); });
  byId('reset').addEventListener('click', function () {
    var defaults = [0, 84, 108, 28, 140, 180]; ids.forEach(function (id, i) { byId(id).value = defaults[i]; }); applied = false; render();
  });
  byId('download').addEventListener('click', function () {
    var csv = '\uFEFFwell_id,split,rock,wob_kN,rpm,flow_L_s,rop_m_h\n' + rows.map(function (r) { return [r.well, r.split, ROCKS[r.rock], fmt(r.wob, 3), fmt(r.rpm, 3), fmt(r.flow, 3), fmt(r.rop, 3)].join(','); }).join('\n');
    var url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), a = document.createElement('a');
    a.href = url; a.download = 'drilling-rop-synthetic.csv'; a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });
  drawScatter(); render();
})(typeof window !== 'undefined' ? window : globalThis);
