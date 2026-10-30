(function () {
  'use strict';
  PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    replaceTitles: ['扶正器安放位置'],
    build: ({ result }) => {
      if (!result || !result.rows?.length) return [];
      const rows = result.rows.filter(d => [d.depth, d.baseline, d.optimized].every(Number.isFinite));
      if (!rows.length) return [];
      const supports = result.audit.positions.map(i => i * 10);
      const average = key => rows.reduce((sum, d) => sum + d[key], 0) / rows.length;
      return [
        { type: 'profile', title: '扶正器位置与井段居中度剖面', subtitle: '相对深度向下；横向分轨展示等距与动态规划居中度，横线为优化支点深度，支点轨为 0/1 指示。', depth: rows.map(d => d.depth), boundaries: supports,
          tracks: [{ label: '等距居中度', unit: '%', values: rows.map(d => d.baseline) }, { label: '优化居中度', unit: '%', values: rows.map(d => d.optimized) }, { label: '优化支点', values: rows.map(d => Number(supports.includes(d.depth))) }] },
        { type: 'dumbbell', title: '等距与优化居中度对照', subtitle: `同一 ${rows.length} 个深度节点、相同扶正器预算；最低值和节点均值分别比较。`, beforeLabel: '等距方案', afterLabel: '动态规划', unit: '%',
          items: [{ label: '最低居中度', before: Math.min(...rows.map(d => d.baseline)), after: Math.min(...rows.map(d => d.optimized)) }, { label: '平均居中度', before: average('baseline'), after: average('optimized') }] }
      ];
    }
  });
})();
