(function () {
  'use strict';
  PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    build: ({ result }) => {
      if (!result || !result.rows?.length) return [];
      const rows = result.rows.filter(d => [d.n, d.depth, d.phase, d.cost, d.risk, d.worst, d.nominal, d.score].every(Number.isFinite));
      const key = d => `${d.n}/${d.phase}/${d.depth}`;
      const best = result.audit.best && key(result.audit.best);
      const label = d => `${d.n} 孔/m · ${d.phase}° · ${d.depth} m`;
      const top = rows.filter(d => d.feasible).sort((a, b) => b.score - a.score).slice(0, 10);
      return [
        { type: 'parallel', title: '稳健射孔候选并行比较', subtitle: `完整 ${rows.length} 组候选；可行标记同时考虑预算与出砂约束，高亮稳健目标最优点。点击查看参数。`, maxLines: 160,
          axes: [{ key: 'n', label: '孔密', unit: '孔/m' }, { key: 'depth', label: '穿深', unit: 'm' }, { key: 'phase', label: '相位', unit: '°' }, { key: 'cost', label: '成本', unit: '教学单位' }, { key: 'risk', label: '出砂分数' }, { key: 'worst', label: '最坏产量', unit: 'm³/d' }], items: rows.map(d => ({ ...d, label: label(d), selected: key(d) === best })) },
        { type: 'dumbbell', title: '可行候选名义与最坏产量', subtitle: '按稳健目标排名前 10 的可行方案；比较损害厚度 1 倍情景与三个指定情景中的最坏值。', beforeLabel: '名义情景', afterLabel: '最坏情景', unit: 'm³/d', items: top.map(d => ({ label: label(d), before: d.nominal, after: d.worst })) },
        { type: 'bar', title: '可行射孔方案稳健评分排序', subtitle: '目标为最坏产量代理减去成本权重乘成本；只展示可行方案前 10 名。', sort: true, unit: '教学评分', items: top.map(d => ({ label: label(d), value: d.score, selected: key(d) === best })) }
      ];
    }
  });
})();
