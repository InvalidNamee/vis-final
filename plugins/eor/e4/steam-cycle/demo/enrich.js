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
    replaceTitles: [window.OperationsModel.config.method + '计算结果'],
    build: ({result, state}) => {
      if (!result || !Array.isArray(result.samples)) return [];
      const rows = result.samples;
      const inputs = state || result.audit?.inputs || {};

      const optimized = curve(result, 0), baseline = new Map(curve(result, 1));
      const ranked = [...rows].sort((a, b) => b.oil - a.oil);
      return [
        {type: 'bar', title: '三周期产油对照', unit: 't', subtitle: '当前枚举最优计划与按100 t向下取整的均分计划；两者总用汽量可能不同。',
          items: optimized.flatMap(([cycle, oil]) => [
            {label: '周期' + cycle + ' · 最优', group: '最优计划', value: oil},
            {label: '周期' + cycle + ' · 均分', group: '取整均分', value: baseline.get(cycle)}])},
        {type: 'dumbbell', title: '周期产油变化', unit: 't', beforeLabel: '取整均分', afterLabel: '最优计划',
          subtitle: '同周期、同单位产油比较；变化同时包含注汽分配与总注汽量差。',
          items: optimized.map(([cycle, oil]) => ({label: '周期' + cycle, before: baseline.get(cycle), after: oil}))},
        {type: 'parallel', title: '三周期注汽计划与累计产油', subtitle: '全部可行计划实际枚举结果；首条为当前累计产油最高计划。',
          axes: [axis('first', '首周期注汽', 't'), axis('second', '次周期注汽', 't'), axis('third', '三周期注汽', 't'), axis('steam', '总注汽', 't'), axis('oil', '累计产油', 't')],
          items: ranked.map((row, i) => {const [first, second, third] = row.plan.split('/').map(Number); return {...row, first, second, third, label: row.plan + ' t', selected: i === 0, feasible: true};}), maxLines: 160}
      ];
    }
  });
})();
