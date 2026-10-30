(function () {
  'use strict';
  PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    build: ({ result }) => {
      if (!result || !result.rows?.length) return [];
      const training = result.rows.slice(0, result.audit.train).filter(d => [d.prediction, d.rate].every(Number.isFinite));
      const testing = result.rows.slice(result.audit.train).filter(d => [d.prediction, d.rate].every(Number.isFinite));
      return [
        { type: 'histogram', title: '留出压差试验残差分布', subtitle: `${testing.length} 个留出压差点；残差 = 合成流量 − 反演直线流量，正值表示模型低估。`, unit: 'm³/d', bins: 6, values: testing.map(d => d.rate - d.prediction) },
        { type: 'box', title: '拟合与留出流量残差对照', subtitle: '按原有前 14 点拟合、后 7 点留出划分；残差 = 合成流量 − 预测流量，两个样本组互不重叠。', unit: 'm³/d', groups: [{ label: `拟合样本（${training.length} 点）`, values: training.map(d => d.rate - d.prediction) }, { label: `留出样本（${testing.length} 点）`, values: testing.map(d => d.rate - d.prediction) }] }
      ];
    }
  });
})();
