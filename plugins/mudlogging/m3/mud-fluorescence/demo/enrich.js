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
    return [
      imageComparison(result, rows, '荧光图像与亮区掩膜对照'),
      binaryMatrix(rows, row => row.prediction, '荧光候选像素检出矩阵', ['背景像素', '参考亮区']),
      { type: 'box', title: '参考亮区与背景亮度分布', unit: '归一化亮度', groups: [false, true].map(value => ({
        label: value ? '参考荧光亮区' : '参考背景', values: numeric(rows.filter(row => row.reference === value).map(row => row.observed)) })),
        subtitle: '由当前合成图像实际像素统计；分组来自生成器真值，亮度不换算为含油量。' }
    ].filter(Boolean);
  }
  window.PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    build,
    anchor: '#charts'
  });
})();
