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

      const ranked = [...rows].sort((a, b) => Number(b.ok) - Number(a.ok) || a.power - b.power), good = ranked.filter(row => row.ok);
      return [
        {type: 'parallel', title: '泵组候选工况与能耗', subtitle: '读取全部63个实际枚举组合；可行组合按轴功率升序排列，首条可行为当前最优。',
          axes: [axis('n', '台数', '台'), axis('s', '转速比'), axis('available', '可供扬程', 'm'), axis('eta', '效率'), axis('power', '轴功率', 'kW'), axis('cost', '小时电费', '元/h')],
          items: ranked.map(row => ({...row, label: row.n + '台 · ' + (row.s * 100).toFixed(0) + '%转速', feasible: row.ok, selected: row === good[0]})), maxLines: 160},
        {type: 'bar', title: '低功率可行泵组排名', unit: 'kW', subtitle: '最低功率的前8个可行组合；可供扬程与流量边界均由原模型判定。',
          items: good.slice(0, 8).map(row => ({label: row.n + '台 · ' + (row.s * 100).toFixed(0) + '%', value: row.power, selected: row === good[0]}))},
        boxes('不同泵台数可行功率分布', 'kW', [1, 2, 3].map(n => ({label: n + '台', values: good.filter(row => row.n === n).map(row => row.power)})),
          '每组包含当前台数下全部可行转速点；无可行转速的组省略。')
      ];
    }
  });
})();
