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
    const found = rows.filter(row => row.start >= 0);
    return [
      { type: 'bar', title: '录井字段缺项统计', unit: '项', items: rows.map(row => ({ label: row.field, value: row.start < 0 ? 1 : 0 })),
        subtitle: '每个目标字段缺失记 1，已在原文定位记 0；修改记录后逐项更新。' },
      { type: 'bar', title: '已定位字段证据长度', unit: '字符', items: found.map(row => ({ label: row.field, value: row.source.length })),
        subtitle: '直接统计匹配原文片段的字符数，长度不代表抽取置信度。' },
      { type: 'gantt', title: '录井字段原文证据位置', unit: '字符', items: found.map(row => ({ label: row.field,
        start: row.start, end: row.start + row.source.length, group: '匹配原文' })),
        subtitle: '区间使用文本中的实际字符起点及匹配长度；缺项字段不生成证据区间。' }
    ];
  }
  window.PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    build,
    anchor: '#charts'
  });
})();
