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
    const image = result.images[0];
    const before = image.values.map(clamp);
    const flags = new Map(rows.map(row => [row.trace, Boolean(row.prediction)]));
    return [
      { type: 'image-compare', title: '地震剖面与候选边界叠加', width: image.width, height: image.height, before,
        after: before.map((value, i) => flags.get(i % image.width) ? 1 : value),
        beforeLabel: '合成地震剖面', afterLabel: '候选道边界叠加',
        subtitle: '右侧在同一剖面上将超阈值道边界标亮；标亮列是模型候选，不是另一幅观测或人工参考。' },
      { type: 'bar', title: '道边界不连续评分排序', sort: true, unit: '1−局部相关系数',
        items: rows.map(row => ({ label: '道边界 ' + row.trace, value: row.score, selected: Boolean(row.prediction) })),
        subtitle: '按实际评分排序，候选状态随不连续阈值更新。' },
      binaryMatrix(rows, row => row.prediction, '断层道边界检出矩阵', ['连续边界', '错断边界'])
    ];
  }
  window.PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    build,
    anchor: '#charts'
  });
})();
