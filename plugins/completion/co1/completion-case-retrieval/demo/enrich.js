(function () {
  'use strict';
  PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState || window.CaseModel.defaults }),
    replaceTitles: ['方案得分'],
    build: ({ result, state }) => {
      if (!result || !result.rows?.length) return [];
      const rows = result.rows.filter(d => [d.score, d.capacity, d.sandout, d.cost, d.support].every(Number.isFinite));
      return [
        { type: 'bar', title: '完井方式综合评分排序', subtitle: '倒距离加权邻井产能代理减去出砂与成本惩罚；评分可为负值。', unit: '评分', sort: true, items: rows.map(d => ({ label: `${d.name}（支持 ${d.support} 例${d.fallback ? '，回退检索' : ''}）`, value: d.score, selected: d.type === result.audit.best?.type })) },
        { type: 'stacked', title: '完井方式评分组成', subtitle: '正向产能贡献与负向出砂、成本惩罚分别堆叠；代数和等于综合评分。', unit: '评分', groups: rows.map(d => ({ label: d.name, segments: [{ label: '产能贡献', value: d.capacity }, { label: '出砂惩罚', value: -state.penalty * d.sandout }, { label: '成本惩罚', value: -.006 * d.cost }] })) },
        { type: 'parallel', title: '完井候选多指标比较', subtitle: '四种完井方式及各自近邻支持数量；点击候选查看指标。', axes: [{ key: 'capacity', label: '产能代理' }, { key: 'sandout', label: '出砂代理' }, { key: 'cost', label: '成本', unit: '教学单位' }, { key: 'support', label: '支持案例', unit: '例' }, { key: 'score', label: '综合评分' }], items: rows.map(d => ({ ...d, label: d.name, selected: d.type === result.audit.best?.type })) }
      ];
    }
  });
})();
