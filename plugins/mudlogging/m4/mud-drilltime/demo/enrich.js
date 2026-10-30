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
    const boundaries = audit.boundary || [];
    const groups = Array.from({ length: boundaries.length + 1 }, (_, index) => ({
      label: '参考层段 ' + (index + 1), values: numeric(rows.filter(row => boundaries.filter(boundary => row.index >= boundary).length === index).map(row => row.drilltime_min_per_m))
    }));
    return [
      { type: 'profile', title: '钻时与变化评分深度联排', depth: rows.map(row => row.index),
        tracks: [
          { label: '每米钻时', values: rows.map(row => row.drilltime_min_per_m), unit: 'min/m' },
          { label: '双窗变化评分', values: rows.map(row => row.score) }
        ], boundaries: audit.picks || [], subtitle: '纵轴为向下增加的深度采样序号；横线标记模型实际识别的候选界面。' },
      { type: 'box', title: '参考层段钻时分布', unit: 'min/m', groups,
        subtitle: '按生成器真实层界分组，展示层内噪声和层间差异，不使用预测界面重定义参考层段。' },
      { type: 'bar', title: '候选界面变化评分', items: rows.filter(row => row.boundary).map(row => ({ label: '采样点 ' + row.index, value: row.score })),
        subtitle: '仅展示模型阈值筛选与间隔抑制后保留的候选位置。' }
    ];
  }
  window.PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    build,
    anchor: '#charts'
  });
})();
