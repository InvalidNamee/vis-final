(function () {
  'use strict';
  PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    replaceTitles: ['测试混淆计数'],
    build: ({ result }) => {
      if (!result || !result.rows?.length) return [];
      const rows = result.rows.filter(d => Number.isInteger(d.label) && Number.isInteger(d.prediction));
      const names = ['弱胶结', '部分胶结', '较好胶结'];
      const values = names.map(() => names.map(() => 0));
      rows.forEach(d => { if (values[d.label] && d.prediction >= 0 && d.prediction < 3) values[d.label][d.prediction]++; });
      const wells = [...new Set(rows.map(d => d.well))];
      return [
        { type: 'matrix', title: '留井胶结等级混淆矩阵', subtitle: `${rows.length} 个留出井段；行是真实等级，列是预测等级，对角线为正确分类。`, xLabels: names, yLabels: names, values, unit: '段' },
        { type: 'bar', title: '测试井分类准确率', subtitle: '每口井单独计算正确井段占比；均为未参与近邻库构建的测试井。', unit: '%', sort: true,
          items: wells.map(well => { const sample = rows.filter(d => d.well === well); return { label: `测试井 ${well + 1}（${sample.length} 段）`, value: 100 * sample.filter(d => d.label === d.prediction).length / sample.length }; }) }
      ];
    }
  });
})();
