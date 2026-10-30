(function () {
  'use strict';
  const model = window.ExplorationModel;
  if (!model || !window.PluginViz) return;
  const finite = Number.isFinite;
  const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const numeric = values => values.filter(finite);
  const clamp = value => Math.max(0, Math.min(1, value));
  function binaryMatrix(rows, prediction, title, labels) {
    const values = [[0, 0], [0, 0]];
    rows.forEach(row => { values[Number(Boolean(row.reference))][Number(Boolean(prediction(row)))]++; });
    return { type: 'matrix', title, xLabels: labels, yLabels: labels, values, unit: '个',
      subtitle: '行表示合成参考，列表示模型判定；总数等于本次实际评价记录数。' };
  }
  function episodes(rows, predicate, coordinate, step, label, group) {
    const items = [];
    let start = null, end = null;
    rows.forEach(row => {
      const value = coordinate(row);
      if (predicate(row) && finite(value)) {
        if (start !== null && value > end + step * 1.01) { items.push({ label, start, end: end + step, group }); start = null; }
        if (start === null) start = value;
        end = value;
      } else if (start !== null) { items.push({ label, start, end: end + step, group }); start = null; }
    });
    if (start !== null) items.push({ label, start, end: end + step, group });
    return items;
  }
  function imageComparison(result, rows, title) {
    const image = result.images && result.images[0];
    if (!image || rows.length !== image.width * image.height) return null;
    return { type: 'image-compare', title, width: image.width, height: image.height,
      before: rows.map(row => clamp(row.observed)), after: rows.map(row => row.prediction ? 1 : 0),
      beforeLabel: '合成观测亮度', afterLabel: '模型提取掩膜',
      subtitle: '滑块两侧共用像素坐标；左侧为当前合成观测，右侧仅为模型二值掩膜。' };
  }
  function build({ result, state }) {
    if (!result || !Array.isArray(result.rows) || !result.rows.length) return [];
    const rows = result.rows, audit = result.audit || {};
    const windows = [];
    for (let start = 0; start < rows.length; start += 60) {
      const part = rows.slice(start, start + 60);
      windows.push({ label: '采样 ' + start + '—' + (start + part.length - 1),
        before: Math.sqrt(mean(part.map(row => (row.observed - row.reference) ** 2))),
        after: Math.sqrt(mean(part.map(row => (row.prediction - row.reference) ** 2))) });
    }
    return [
      { type: 'histogram', title: '滤波后有符号误差分布', unit: '相对振幅', bins: 14,
        values: numeric(rows.map(row => row.prediction - row.reference)), subtitle: '滤波结果减合成无噪参考，使用本次全部采样点。' },
      { type: 'box', title: '滤波前后误差分布', unit: '相对振幅', groups: [
        { label: '原始观测误差', values: numeric(rows.map(row => row.observed - row.reference)) },
        { label: '滤波后误差', values: numeric(rows.map(row => row.prediction - row.reference)) }
      ], subtitle: '两组均减去同一合成无噪参考，保留误差符号。' },
      { type: 'dumbbell', title: '分段滤波前后均方根误差', unit: '相对振幅', beforeLabel: '原始 RMSE', afterLabel: '滤波 RMSE', items: windows,
        subtitle: '按采样顺序每 60 点分段，分别计算同一段的处理前后 RMSE。' }
    ];
  }
  window.PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    build,
    anchor: '#charts'
  });
})();
