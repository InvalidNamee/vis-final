(function () {
  'use strict';
  const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
  PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    replaceTitles: ['孔隙度评价序列'],
    build: ({ result }) => {
      const rows = (result?.rows || []).filter(r => [r.reference, r.prediction, r.baseline].every(Number.isFinite));
      if (!rows.length) return [];
      const error = (row, key) => 100 * (row[key] - row.reference);
      const wells = [...new Set(rows.map(r => r.well))];
      return [
        {
          type: 'box', title: '孔隙度校准前后误差分布', unit: '孔隙度百分点',
          subtitle: rows.length + ' 条异井评价样本；有符号误差 = 估计值 − 合成参考值，正值表示高估。',
          groups: [
            { label: '未校准', values: rows.map(r => error(r, 'baseline')) },
            { label: '校准后', values: rows.map(r => error(r, 'prediction')) }
          ]
        },
        {
          type: 'histogram', title: '校准后孔隙度误差频数', unit: '孔隙度百分点', bins: 12,
          subtitle: '统计全部 ' + rows.length + ' 条异井评价样本的有符号误差；频数合计等于评价样本数。',
          values: rows.map(r => error(r, 'prediction'))
        },
        {
          type: 'dumbbell', title: '各测试井校准前后平均绝对误差', unit: '孔隙度百分点',
          beforeLabel: '未校准', afterLabel: '校准后',
          subtitle: '每口虚拟测试井使用同一批样本比较；误差越小，孔隙度估计越接近合成参考。',
          items: wells.map(well => {
            const group = rows.filter(r => r.well === well);
            return { label: '测试井 ' + well + '（' + group.length + ' 点）', before: mean(group.map(r => Math.abs(error(r, 'baseline')))), after: mean(group.map(r => Math.abs(error(r, 'prediction')))) };
          })
        }
      ];
    }
  });
})();
