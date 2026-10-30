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

      const trend = curve(result, 1), upper = new Map(curve(result, 2)), predicted = new Map(trend);
      const errors = rows.filter(row => predicted.has(row.year)).map(row => ({...row, error: predicted.get(row.year) - row.depth}));
      return [
        {type: 'band', title: '腐蚀增长趋势与残差带', xLabel: '首次检测后 / a', yLabel: '缺陷深度 / mm',
          subtitle: '上界直接读取原模型2×拟合残差尺度×√(1+t/4)，下界以趋势对称；使用前4次检测，属于残差尺度示意范围。',
          points: trend.filter(([x]) => upper.has(x)).map(([x, value]) => ({x, mean: value, low: 2 * value - upper.get(x), high: upper.get(x)})),
          observed: rows.map(row => ({x: row.year, y: row.depth}))},
        {type: 'dumbbell', title: '历次检测与趋势估值', unit: 'mm', beforeLabel: '检测值', afterLabel: '趋势估值',
          subtitle: '第0–3年用于拟合，第4年为留后检测；逐年比较同单位深度。',
          items: errors.map(row => ({label: '第' + row.year + '年', before: row.depth, after: predicted.get(row.year)}))},
        boxes('腐蚀深度拟合与留后误差', 'mm', [
          {label: '拟合检测（4点）', values: errors.filter(row => row.year < 4).map(row => row.error)},
          {label: '留后检测（1点）', values: errors.filter(row => row.year === 4).map(row => row.error)}], '误差=趋势估值−检测深度；单点留后组展示该点本身。')
      ];
    }
  });
})();
