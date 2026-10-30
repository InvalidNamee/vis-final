(function () {
  'use strict';
  PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    replaceTitles: ['自然伽马与层段响应', '电阻率与层段响应', '体积密度与层段响应'],
    build: ({ result }) => {
      const rows = result?.rows || [];
      if (!rows.length || !rows.every(r => [r.index, r.GR_API, r.RT_ohmm, r.RHOB_gcc].every(Number.isFinite))) return [];
      const audit = result.audit || {};
      return [
        {
          type: 'profile', title: '多曲线共深度剖面与候选层界',
          subtitle: '纵轴为向下递增的深度采样序号，非米制井深；三道使用各自物理单位，横向标线为当前识别层界。',
          depth: rows.map(r => r.index),
          tracks: [
            { label: '自然伽马', unit: 'API', values: rows.map(r => r.GR_API) },
            { label: '电阻率', unit: 'Ω·m', values: rows.map(r => r.RT_ohmm) },
            { label: '体积密度', unit: 'g·cm⁻³', values: rows.map(r => r.RHOB_gcc) }
          ],
          boundaries: rows.filter(r => r.boundary).map(r => r.index)
        },
        {
          type: 'bar', title: '层界匹配计数', unit: '条',
          subtitle: '以生成器参考层界为标签，在 ±' + audit.tolerance + ' 个采样点内一对一匹配；漏检数不计入识别层界总数。',
          items: [
            { label: '正确匹配', value: audit.tp },
            { label: '误检界面', value: audit.fp },
            { label: '漏检界面', value: audit.fn }
          ].filter(item => Number.isFinite(item.value))
        }
      ];
    }
  });
})();
