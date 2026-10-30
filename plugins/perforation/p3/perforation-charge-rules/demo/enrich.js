(function () {
  'use strict';
  PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState || window.CaseModel.defaults }),
    replaceTitles: ['型号匹配评分'],
    build: ({ result, state }) => {
      if (!result || !result.rows?.length) return [];
      const rows = result.rows.filter(d => [d.score, d.adjusted, d.hole, d.cost, d.temp, d.gun, d.wall].every(Number.isFinite));
      return [
        { type: 'bar', title: '射孔型号匹配评分排序', subtitle: '同时保留规则通过与排除型号；排除原因在标签中列明，排序本身不代表规则通过。', unit: '评分', sort: true, items: rows.map(d => ({ label: `${d.name} · ${d.feasible ? '规则通过' : d.reasons}`, value: d.score, group: d.feasible ? '规则通过' : '规则排除', selected: d.name === result.audit.best?.name })) },
        { type: 'matrix', title: '射孔型号规则匹配矩阵', subtitle: `1 为通过、0 为未通过；温度编码 ≥ ${state.temp}，枪径 ≤ ${state.id}，壁厚适用编码 ≥ ${state.wall}。`, unit: '通过指示', xLabels: ['温度', '通径', '壁厚'], yLabels: rows.map(d => d.name), values: rows.map(d => [Number(d.temp >= state.temp), Number(d.gun <= state.id), Number(d.wall >= state.wall)]) },
        { type: 'parallel', title: '射孔型号性能与成本比较', subtitle: '六个虚构教学型号；点击查看尺寸与性能，规则排除型号保留为不可行参考。', axes: [{ key: 'adjusted', label: '修正穿深', unit: 'm' }, { key: 'hole', label: '入口孔径', unit: 'mm' }, { key: 'gun', label: '枪径', unit: 'mm' }, { key: 'temp', label: '温度编码' }, { key: 'cost', label: '成本', unit: '教学单位' }], items: rows.map(d => ({ ...d, label: d.name, selected: d.name === result.audit.best?.name })) }
      ];
    }
  });
})();
