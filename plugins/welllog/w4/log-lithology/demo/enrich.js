(function () {
  'use strict';
  PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    replaceTitles: ['异组样品特征分布', '分类结果对照'],
    build: ({ result }) => {
      const rows = result?.rows || [];
      if (!rows.length) return [];
      const classes = window.ExplorationModel.config.classes;
      const confusion = classes.map(() => classes.map(() => 0));
      rows.forEach(r => {
        const actual = classes.indexOf(r.reference), predicted = classes.indexOf(r.prediction);
        if (actual >= 0 && predicted >= 0) confusion[actual][predicted]++;
      });
      const names = result.audit?.featureNames || [];
      const items = rows.filter(r => [r.feature1, r.feature2, r.feature3].every(Number.isFinite)).map(r => ({ group: r.reference, feature1: r.feature1, feature2: r.feature2, feature3: r.feature3 }));
      const panels = [
        {
          type: 'matrix', title: '异井岩性分类混淆矩阵', unit: '条',
          subtitle: '行 = 参考岩性，列 = 预测岩性；' + rows.length + ' 条测试样本，对角线表示分类正确。',
          xLabels: classes.map(label => '预测' + label), yLabels: classes.map(label => '参考' + label), values: confusion
        },
        {
          type: 'sankey', title: '参考岩性与预测岩性流向', unit: '条',
          subtitle: '左侧为参考类别，右侧为预测类别；连线宽度对应同一批测试样本的实际数量。',
          nodes: classes.flatMap((label, i) => [{ id: 'ref-' + i, label: '参考' + label }, { id: 'pred-' + i, label: '预测' + label }]),
          links: confusion.flatMap((counts, i) => counts.map((value, j) => ({ source: 'ref-' + i, target: 'pred-' + j, value })).filter(link => link.value > 0))
        }
      ];
      if (items.length) panels.splice(1, 0, {
        type: 'scatter-matrix', title: '三项测井特征散点矩阵',
        subtitle: items.length + ' 条异井评价样本，按参考岩性着色；各坐标轴保留自然伽马、密度和电阻率的原始物理单位。',
        axes: [1, 2, 3].map((n, i) => ({ key: 'feature' + n, label: names[i] || '特征 ' + n })), items
      });
      return panels;
    }
  });
})();
