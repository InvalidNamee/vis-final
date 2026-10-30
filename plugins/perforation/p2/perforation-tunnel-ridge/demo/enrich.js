(function () {
  'use strict';
  PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    build: ({ result }) => {
      if (!result || !result.rows?.length) return [];
      const rows = result.rows.filter(d => [d.depth, d.prediction, d.diameter, d.predictedDiameter].every(Number.isFinite));
      const batches = [...new Set(rows.map(d => d.batch))];
      return [
        { type: 'histogram', title: '留出靶试穿深残差分布', subtitle: `${rows.length} 个留出样本；残差 = 预测穿深 − 合成标签穿深，正值为高估。`, unit: 'm', bins: 12, values: rows.map(d => d.prediction - d.depth) },
        { type: 'box', title: '留出批次穿深误差分布', subtitle: '按靶试批次分组；每组包含该留出批次的全部样本，残差 = 预测 − 标签。', unit: 'm', groups: batches.map(batch => ({ label: `批次 ${batch + 1}`, values: rows.filter(d => d.batch === batch).map(d => d.prediction - d.depth) })) },
        { type: 'box', title: '留出批次入口孔径误差分布', subtitle: '孔径模型单独评价；残差 = 预测入口孔径 − 合成标签孔径，与穿深误差采用独立单位。', unit: 'mm', groups: batches.map(batch => ({ label: `批次 ${batch + 1}`, values: rows.filter(d => d.batch === batch).map(d => d.predictedDiameter - d.diameter) })) }
      ];
    }
  });
})();
