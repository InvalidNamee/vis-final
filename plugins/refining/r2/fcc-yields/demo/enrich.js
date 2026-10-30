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

      const names = ['干气', '液化气', '汽油', '轻循环油', '油浆', '焦炭'];
      const current = rows.find(row => row.temperature === inputs.temperature);
      const comparison = result.rows.map(row => ({label: row.label, before: parseFloat(row.note.replace(/^参考\s*/, '')), after: parseFloat(row.value)}))
        .filter(row => finite(row.before) && finite(row.after));
      return [
        {type: 'stacked', title: '温度扫描六产物组成', unit: '%', subtitle: '当前剂油比与残炭下490–550℃共13个真实扫描点；每条六产物收率合计100%。',
          groups: rows.map(row => ({label: row.temperature + '℃', segments: names.map(label => ({label, value: row[label]}))}))},
        current ? {type: 'sankey', title: '当前工况六产物流向', unit: '%', subtitle: '100份原料到六类产物；链接读取当前温度扫描点的未取整收率，合计100%。',
          nodes: [{id: 'feed', label: '原料100份'}, ...names.map((label, i) => ({id: 'product-' + i, label}))],
          links: names.map((label, i) => ({source: 'feed', target: 'product-' + i, value: current[label]}))} : null,
        {type: 'dumbbell', title: '参考工况与当前产物收率', unit: '%', beforeLabel: '490℃ · 剂油比4', afterLabel: '当前工况',
          subtitle: '参考工况保留当前原料残炭；端点读取模型结果表，两位小数。', items: comparison}
      ].filter(Boolean);
    }
  });
})();
