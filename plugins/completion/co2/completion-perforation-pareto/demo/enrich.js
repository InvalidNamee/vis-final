(function () {
  'use strict';
  PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState || window.CaseModel.defaults }),
    build: ({ result, state }) => {
      if (!result || !result.rows?.length) return [];
      const rows = result.rows.filter(d => [d.n, d.phase, d.depth, d.productivity, d.risk, d.cost].every(Number.isFinite));
      const key = d => `${d.n}/${d.phase}/${d.depth}`;
      const front = new Set(result.audit.front.map(key));
      const best = result.audit.best && key(result.audit.best);
      const items = rows.map(d => ({ ...d, label: `${d.n} 孔/m · ${d.phase}° · ${d.depth} m${front.has(key(d)) ? ' · Pareto' : ''}`, feasible: d.risk <= state.risk, selected: key(d) === best }));
      const groups = [
        { label: '未满足出砂约束', values: rows.filter(d => d.risk > state.risk).map(d => d.productivity) },
        { label: '可行非前沿', values: rows.filter(d => d.risk <= state.risk && !front.has(key(d))).map(d => d.productivity) },
        { label: 'Pareto 前沿', values: rows.filter(d => front.has(key(d))).map(d => d.productivity) }
      ].filter(d => d.values.length);
      return [
        { type: 'parallel', title: '射孔方案多参数交互比较', subtitle: `完整 ${rows.length} 组候选；高亮当前权重选点，区分可行性。点击曲线选择候选并查看六项指标。`, maxLines: 160,
          axes: [{ key: 'n', label: '孔密', unit: '孔/m' }, { key: 'phase', label: '相位', unit: '°' }, { key: 'depth', label: '穿深', unit: 'm' }, { key: 'cost', label: '成本', unit: '教学单位' }, { key: 'risk', label: '出砂分数' }, { key: 'productivity', label: '产能代理' }], items },
        { type: 'box', title: '可行域与前沿产能分布', subtitle: '三组候选互不重叠；箱线图统计各组全部候选的教学产能代理。', groups },
        { type: 'bar', title: 'Pareto 候选加权评分排序', subtitle: `只比较非支配方案，评分为产能代理 − ${state.costWeight} × 成本 / 100；展示前 12 名。`, unit: '评分', sort: true,
          items: result.audit.front.map(d => ({ label: `${d.n} 孔/m · ${d.phase}° · ${d.depth} m`, value: d.productivity - state.costWeight * d.cost / 100, selected: key(d) === best })).sort((a, b) => b.value - a.value).slice(0, 12) }
      ];
    }
  });
})();
