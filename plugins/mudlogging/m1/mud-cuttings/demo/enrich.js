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
    const labels = model.config.classes;
    const values = labels.map(() => labels.map(() => 0));
    rows.forEach(row => { const y = labels.indexOf(row.reference), x = labels.indexOf(row.prediction); if (x >= 0 && y >= 0) values[y][x]++; });
    return [
      { type: 'matrix', title: '异组分类混淆矩阵', xLabels: labels, yLabels: labels, values, unit: '样本',
        subtitle: '行表示参考岩性或相类别，列表示模型分类；仅统计未参与训练的评价组。' },
      { type: 'scatter-matrix', title: '评价样本三特征分布',
        axes: [1, 2, 3].map((n, i) => ({ key: 'feature' + n, label: audit.featureNames[i] })),
        items: rows.filter(row => [row.feature1, row.feature2, row.feature3].every(finite)).map(row => ({
          group: row.reference, feature1: row.feature1, feature2: row.feature2, feature3: row.feature3 })),
        subtitle: '三个特征两两组合；颜色按合成参考类别分组，坐标单位见各特征名称。' },
      { type: 'bar', title: '各类别错分样本数', unit: '样本', items: labels.map(label => ({ label,
        value: rows.filter(row => row.reference === label && row.prediction !== label).length })),
        subtitle: '按参考类别统计错分，不将类别编码作为连续数值连线。' }
    ];
  }
  window.PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    build,
    replaceTitles: ['分类结果对照']
  });
})();
