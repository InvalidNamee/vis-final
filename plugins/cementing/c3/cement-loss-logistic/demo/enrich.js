(function () {
  'use strict';
  PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState || window.CaseModel.defaults }),
    build: ({ result, state }) => {
      if (!result || !result.rows?.length) return [];
      const rows = result.rows.filter(d => Number.isFinite(d.prediction) && (d.y === 0 || d.y === 1));
      const values = [[0, 0], [0, 0]];
      rows.forEach(d => values[d.y][Number(d.prediction >= state.threshold)]++);
      const bins = Array.from({ length: 5 }, (_, i) => ({ label: `${i * 20}–${(i + 1) * 20}%`, segments: [{ label: '未漏失', value: 0 }, { label: '漏失', value: 0 }] }));
      rows.forEach(d => bins[Math.min(4, Math.max(0, Math.floor(d.prediction * 5)))].segments[d.y].value++);
      return [
        { type: 'matrix', title: '漏失阈值分类混淆矩阵', subtitle: `${rows.length} 口留出井；行是真实标签，列是按 ${(state.threshold * 100).toFixed(0)}% 分数阈值划分的预测标签。`, xLabels: ['未漏失', '漏失'], yLabels: ['未漏失', '漏失'], values, unit: '口' },
        { type: 'histogram', title: '测试井漏失评分分布', subtitle: '只统计固定留井样本的模型输出；当前井况输入不改变测试分数，分类阈值单独影响混淆矩阵。', values: rows.map(d => d.prediction * 100), bins: 6, unit: '%' },
        { type: 'stacked', title: '漏失评分区间与真实标签', subtitle: '按模型分数每 20 个百分点分箱；每个色段表示对应真实标签的井数。', groups: bins, unit: '口' }
      ];
    }
  });
})();
