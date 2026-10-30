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
    const dt = audit.dt;
    // The model exports threshold through its metric rather than audit.
    const threshold = result.metrics.find(metric => metric.label === '能量比阈值');
    const active = threshold ? episodes(rows, row => row.ratio > threshold.value, row => row.time_ms, dt, '能量比超阈值', '触发函数') : [];
    rows.filter(row => row.reference).forEach(row => active.push({ label: '合成参考初至', start: row.time_ms, end: row.time_ms + dt, group: '初至标记' }));
    rows.filter(row => row.trigger).forEach(row => active.push({ label: '模型首次触发', start: row.time_ms, end: row.time_ms + dt, group: '初至标记' }));
    const descriptors = [
      { type: 'gantt', title: '初至参考与触发时间泳道', unit: 'ms', items: active,
        subtitle: '条带为连续超阈值采样区间；初至标记宽度仅为一个采样间隔，不表示事件持续时间。' },
      { type: 'box', title: '初至前后能量比分布', unit: 'STA/LTA', groups: [false, true].map(after => ({
        label: after ? '参考初至及之后' : '参考初至之前', values: numeric(rows.filter((row, i) => i >= audit.lta && (i >= audit.onset) === after).map(row => row.ratio)) })),
        subtitle: '排除长窗尚未建立的采样点，按生成器参考初至分组。' }
    ];
    if (audit.pick >= 0) descriptors.push({ type: 'dumbbell', title: '参考初至与拾取时间', unit: 'ms', beforeLabel: '合成参考', afterLabel: '首次触发',
      items: [{ label: '当前地震道', before: audit.onset * dt, after: audit.pick * dt }], subtitle: '同一时间轴上的参考与实际拾取；未触发时不绘制拾取值。' });
    return descriptors;
  }
  window.PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    build,
    anchor: '#charts'
  });
})();
