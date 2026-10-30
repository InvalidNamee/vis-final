(function () {
  'use strict';
  PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    build: ({ result }) => {
      if (!result || !result.rows?.length) return [];
      const rows = result.rows.filter(d => [d.rho, d.q, d.ecd, d.efficiency, d.score].every(Number.isFinite));
      if (!rows.length) return [];
      const xValues = [...new Set(rows.map(d => d.q))].sort((a, b) => a - b);
      const yValues = [...new Set(rows.map(d => d.rho))].sort((a, b) => a - b);
      const lookup = new Map(rows.map(d => [`${d.rho}/${d.q}`, d]));
      const values = yValues.map(rho => xValues.map(q => lookup.get(`${rho}/${q}`)?.efficiency * 100));
      const best = result.audit.best;
      const sampled = rows.filter((_, i) => i % Math.ceil(rows.length / 140) === 0 || rows[i] === best);
      const items = sampled.map(d => ({ ...d, efficiency: d.efficiency * 100, label: `${d.rho.toFixed(3)} g/cm³ · ${d.q.toFixed(1)} m³/min`, selected: d === best }));
      const panels = [];
      if (values.every(row => row.every(Number.isFinite))) panels.push({ type: 'contour', title: '密度与排量顶替响应等值线', subtitle: `完整 ${rows.length} 组教学响应网格；等值线为顶替代理值（%），压力可行性由下方平行坐标标注。`, xLabel: '排量 / m³/min', yLabel: '密度 / g/cm³', xValues, yValues, values, levels: 7 });
      panels.push({ type: 'parallel', title: '顶替参数与压力约束比较', subtitle: `从 ${rows.length} 组候选等间隔抽取 ${items.length} 组，保留最优可行点；点击候选查看参数。未满足压力窗的候选标记为不可行。`, maxLines: 160,
        axes: [{ key: 'rho', label: '密度', unit: 'g/cm³' }, { key: 'q', label: '排量', unit: 'm³/min' }, { key: 'ecd', label: 'ECD', unit: 'g/cm³' }, { key: 'efficiency', label: '顶替代理', unit: '%' }, { key: 'score', label: '目标值' }], items });
      return panels;
    }
  });
})();
