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
    const wells = [...new Set(rows.map(row => row.well))];
    return [
      { type: 'box', title: '基线与回归绝对误差分布', unit: '孔隙度百分点', groups: [
        { label: '训练均值基线', values: numeric(rows.map(row => Math.abs(row.baseline - row.reference) * 100)) },
        { label: '岭回归预测', values: numeric(rows.map(row => Math.abs(row.prediction - row.reference) * 100)) }
      ], subtitle: '同一批异井评价样本，误差为孔隙度体积分数差乘 100。' },
      { type: 'dumbbell', title: '各测试井平均绝对误差变化', unit: '孔隙度百分点', beforeLabel: '训练均值基线', afterLabel: '岭回归',
        items: wells.map(well => { const group = rows.filter(row => row.well === well); return { label: '测试井组 ' + well,
          before: mean(group.map(row => Math.abs(row.baseline - row.reference))) * 100,
          after: mean(group.map(row => Math.abs(row.prediction - row.reference))) * 100 }; }),
        subtitle: '每口测试井均由其实际评价样本计算 MAE。' },
      { type: 'histogram', title: '孔隙度预测有符号误差分布', unit: '孔隙度百分点', bins: 12,
        values: numeric(rows.map(row => (row.prediction - row.reference) * 100)), subtitle: '预测减参考；正值为高估，负值为低估。' }
    ];
  }
  window.PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    build,
    anchor: '#charts'
  });
})();
