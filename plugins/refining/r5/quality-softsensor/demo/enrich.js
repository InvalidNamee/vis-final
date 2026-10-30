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

      const predicted = curve(result, 1), high = new Map(curve(result, 2)), low = new Map(curve(result, 3));
      const observation = new Map(curve(result, 0)), evaluation = rows.filter(row => row.split === 'evaluation');
      const training = rows.filter(row => row.split === 'train');
      if (!training.length) return [];
      const baseline = mean(training.map(row => row.y));
      const errors = predicted.filter(([x]) => observation.has(x)).map(([x, y]) => y - observation.get(x));
      const lookup = new Map(predicted);
      return [
        {type: 'band', title: '闪点软测量与校准残差带', xLabel: '固定评价时间序号', yLabel: '闪点 / ℃',
          subtitle: '60条独立校准残差的绝对值P90作为半宽；读取原模型上下界，显示60条评价记录的经验区间。',
          points: predicted.filter(([x]) => high.has(x) && low.has(x)).map(([x, value]) => ({x, mean: value, low: low.get(x), high: high.get(x)})),
          observed: curve(result, 0).map(([x, y]) => ({x, y}))},
        boxes('闪点基线与软测量误差分布', '℃', [
          {label: '训练均值基线（60点）', values: evaluation.map(row => baseline - row.y)},
          {label: '局部软测量（60点）', values: errors}], '同一固定评价集；误差=估计−化验值，基线只使用180条训练标签的均值。'),
        histogram('闪点软测量预测误差分布', '℃', errors, '固定60条评价记录；随化验回配、近邻数量及噪声参数更新。'),
        {type: 'scatter-matrix', title: '评价工况与闪点预测关系', subtitle: '固定评价集60条；温度、流量是当前回配后的过程特征，闪点为化验标签和实际预测。',
          axes: [axis('temperature', '塔温 / ℃'), axis('flow', '流量'), axis('y', '化验闪点 / ℃'), axis('prediction', '预测闪点 / ℃')],
          items: evaluation.filter(row => lookup.has(row.i)).map(row => ({...row, prediction: lookup.get(row.i), group: '评价'}))}
      ];
    }
  });
})();
