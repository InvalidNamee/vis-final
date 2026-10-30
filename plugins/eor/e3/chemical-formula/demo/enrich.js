(function () {
  'use strict';
  // Read the current renderer output; never rerun or alter the model.
  const finite = Number.isFinite;
  const numbers = values => values.filter(finite);
  const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
  const quantile = (values, p) => {
    const sorted = numbers(values).sort((a, b) => a - b);
    if (!sorted.length) return null;
    const index = (sorted.length - 1) * p, low = Math.floor(index);
    return sorted[low] + (sorted[Math.ceil(index)] - sorted[low]) * (index - low);
  };
  const curve = (result, index) => (result.series?.[index]?.points || [])
    .filter(point => finite(point[0]) && finite(point[1]));
  const residuals = (result, observed, predicted) => {
    const lookup = new Map(curve(result, predicted));
    return curve(result, observed).filter(([x]) => lookup.has(x))
      .map(([x, y]) => ({x, value: lookup.get(x) - y}));
  };
  const axis = (key, label, unit) => ({key, label, ...(unit ? {unit} : {})});
  const histogram = (title, unit, values, subtitle) => ({type: 'histogram', title,
    unit, values: numbers(values), bins: 12, subtitle});
  const boxes = (title, unit, groups, subtitle) => ({type: 'box', title, unit,
    groups: groups.map(group => ({...group, values: numbers(group.values)}))
      .filter(group => group.values.length), subtitle});
  const contour = (rows, xKey, yKey, zKey, title, xLabel, yLabel, subtitle) => {
    const valid = rows.filter(row => [row[xKey], row[yKey], row[zKey]].every(finite));
    const xValues = [...new Set(valid.map(row => row[xKey]))].sort((a, b) => a - b);
    const yValues = [...new Set(valid.map(row => row[yKey]))].sort((a, b) => a - b);
    const lookup = new Map(valid.map(row => [row[xKey] + ':' + row[yKey], row[zKey]]));
    const values = yValues.map(y => xValues.map(x => lookup.get(x + ':' + y)));
    // Incomplete grids are omitted rather than interpolated or filled with made-up data.
    if (xValues.length < 2 || yValues.length < 2 || !values.every(row => row.every(finite))) return null;
    return {type: 'contour', title, xLabel, yLabel, xValues, yValues, values, levels: 7, subtitle};
  };
  const episodes = (rows, key, label) => {
    const items = []; let start = null, previous = null;
    for (const row of rows) {
      if (row[key] && start === null) start = row.i;
      if (start !== null && (!row[key] || (previous !== null && row.i !== previous + 1))) {
        items.push({label, start, end: previous + 1});
        start = row[key] ? row.i : null;
      }
      previous = row.i;
    }
    if (start !== null) items.push({label, start, end: previous + 1});
    return items;
  };
  const confusion = (rows, truthKey, flagKey, title, negative, positive, subtitle) => {
    const values = [[0, 0], [0, 0]];
    for (const row of rows) values[Number(Boolean(row[truthKey]))][Number(Boolean(row[flagKey]))]++;
    return {type: 'matrix', title, unit: '条', xLabels: ['未触发', '触发复核'],
      yLabels: [negative, positive], values, subtitle};
  };
  PluginViz.mount({
    get: () => ({result: window.__DEMO_RESULT__, state: window.__DEMO_STATE__}),
    build: ({result, state}) => {
      if (!result || !Array.isArray(result.samples)) return [];
      const rows = result.samples;
      const inputs = state || result.audit?.inputs || {};

      const evaluation = curve(result, 0);
      const split = row => row.i < 120 ? '训练' : row.i < 150 ? '校准' : '评价';
      const candidates = result.audit?.candidates || [];
      const half = result.audit?.intervalHalf;
      return [
        histogram('驱替效率评价误差分布', '百分点', evaluation.map(([observed, predicted]) => predicted - observed),
          '固定30条评价实验；误差=核回归预测−实验效率，均来自当前带宽计算结果。'),
        {type: 'parallel', title: '驱替候选配方与预测效率', subtitle: '当前矿化度、带宽及成本上限下的全部可行候选；按核回归预测效率降序排列，首条为当前最优。',
          axes: [axis('a', '聚合物', 'g/L'), axis('b', '表面活性剂', 'g/L'), axis('cost', '配方成本', '单位'), axis('y', '预测效率', '%')],
          items: candidates.map((row, i) => ({...row, label: row.a + ' / ' + row.b + ' g/L', selected: i === 0, feasible: true})), maxLines: 160},
        {type: 'scatter-matrix', title: '实验浓度与效率分组', subtitle: '按固定120/30/30训练、校准、评价分组；各维度来自实验样本。',
          axes: [axis('a', '聚合物 / g·L⁻¹'), axis('b', '表活 / g·L⁻¹'), axis('s', '矿化度 / g·L⁻¹'), axis('y', '效率 / %')],
          items: rows.map(row => ({...row, group: split(row)}))},
        finite(half) ? {type: 'band', title: '配方评价预测与校准残差带', xLabel: '评价实验编号', yLabel: '驱替效率 / %',
          subtitle: '按150–179号固定评价实验排列；半宽来自30条校准实验绝对残差P90，为经验探索区间。',
          points: evaluation.map((point, i) => ({x: 150 + i, mean: point[1], low: point[1] - half, high: point[1] + half})),
          observed: evaluation.map((point, i) => ({x: 150 + i, y: point[0]}))} : null
      ].filter(Boolean);
    }
  });
})();
