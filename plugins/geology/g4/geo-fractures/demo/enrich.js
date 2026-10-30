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
    // The rose summarizes the actual Hough accumulator peak at each tested angle.
    // It represents votes from current thresholded pixels, never a fracture count.
    const sensitivity = finite(state && state.sensitivity) ? state.sensitivity : model.defaults.sensitivity;
    const threshold = 0.2 + 0.65 * sensitivity;
    const pixels = rows.filter(row => finite(row.observed) && row.observed > threshold);
    const items = [];
    for (let angle = 10; angle < 80; angle++) {
      const bins = new Map(), rad = angle * Math.PI / 180;
      pixels.forEach(row => { const rho = Math.round(-row.x * Math.sin(rad) + row.y * Math.cos(rad)); bins.set(rho, (bins.get(rho) || 0) + 1); });
      items.push({ angle, value: bins.size ? Math.max(...bins.values()) : 0 });
    }
    return [
      { type: 'rose', title: '霍夫方向峰值投票', unit: '票', items,
        subtitle: '每个角度取其 ρ 累加器最大票数；扫描范围 10°—79°，来自当前阈值候选像素，不表示裂缝条数。' },
      imageComparison(result, rows, '露头图像与主迹线掩膜对照'),
      binaryMatrix(rows, row => row.prediction, '主迹线像素检出矩阵', ['背景像素', '迹线像素'])
    ].filter(Boolean);
  }
  window.PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    build,
    anchor: '#charts'
  });
})();
