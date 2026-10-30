(function () {
  'use strict';
  PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    replaceTitles: ['合成观测图', '提取结果与合成真值', '图像纵向候选像素统计'],
    build: ({ result }) => {
      const rows = result?.rows || [], image = result?.images?.[0];
      if (!image || !rows.length || rows.length !== image.width * image.height) return [];
      const { width, height } = image;
      const pixels = [...rows].sort((a, b) => a.y * width + a.x - b.y * width - b.x);
      if (!pixels.every((r, i) => r.x === i % width && r.y === Math.floor(i / width) && Number.isFinite(r.observed))) return [];
      const predicted = Array(height).fill(0), reference = Array(height).fill(0);
      const confusion = [[0, 0], [0, 0]];
      pixels.forEach(r => {
        predicted[r.y] += Number(Boolean(r.prediction));
        reference[r.y] += Number(Boolean(r.reference));
        confusion[Number(Boolean(r.reference))][Number(Boolean(r.prediction))]++;
      });
      return [
        {
          type: 'image-compare', title: '井壁观测与裂缝提取滑动对照', width, height,
          beforeLabel: '合成观测强度', afterLabel: '模型裂缝掩膜',
          subtitle: width + ' × ' + height + ' 像素；滑块对齐同一位置，右侧亮色仅表示模型候选，参考标签另在下方评价。',
          before: pixels.map(r => r.observed), after: pixels.map(r => r.prediction ? 1 : 0)
        },
        {
          type: 'profile', title: '裂缝候选与参考的纵向像素投影',
          subtitle: '纵轴为向下递增的图像行号；每行统计整幅图宽范围内的裂缝像素数，参考来自合成生成器。',
          depth: Array.from({ length: height }, (_, i) => i),
          tracks: [
            { label: '提取候选', unit: 'px / 行', values: predicted },
            { label: '合成参考', unit: 'px / 行', values: reference }
          ]
        },
        {
          type: 'matrix', title: '裂缝像素混淆矩阵', unit: 'px',
          subtitle: '行 = 合成参考，列 = 模型预测；共 ' + pixels.length + ' 个像素，背景正确数与裂缝漏检数分别计数。',
          xLabels: ['预测背景', '预测裂缝'], yLabels: ['参考背景', '参考裂缝'], values: confusion
        }
      ];
    }
  });
})();
