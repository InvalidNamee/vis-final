(function () {
  'use strict';
  PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    replaceTitles: ['分段开度策略'],
    build: ({ result }) => {
      if (!result || !result.rows?.length) return [];
      const rows = result.rows.filter(d => Number.isFinite(d.day) && [d.oil, d.water, ...d.open].every(Number.isFinite));
      if (!rows.length) return [];
      const items = [];
      for (let segment = 0; segment < 3; segment++) {
        let episode;
        rows.forEach(d => {
          const value = d.open[segment] * 100;
          if (episode && episode.value === value && episode.end === d.day) episode.end = d.day + 1;
          else { episode = { label: `层段 ${segment + 1}`, start: d.day, end: d.day + 1, group: `开度 ${value}%`, value }; items.push(episode); }
        });
      }
      const sum = (sample, key) => sample.reduce((total, d) => total + d[key], 0);
      const baseline = result.audit.baseline;
      return [
        { type: 'gantt', title: '分层阀门开度动作泳道', subtitle: '每一泳道对应一个层段；区间 [d, d+1) 为第 d 日动作，连续相同开度合并，0% 表示关闭。色组为开度百分比。', unit: '模拟日', items },
        { type: 'stacked', title: '滚动控制日产液组成', subtitle: '每个模拟日的产油与产水代理分别堆叠；液量为两者之和。', unit: 'm³/d', groups: rows.map(d => ({ label: `第 ${d.day} 日`, segments: [{ label: '油', value: d.oil }, { label: '水', value: d.water }] })) },
        { type: 'dumbbell', title: '全开与滚动控制累计液量', subtitle: `同一 ${rows.length} 日模拟器结果；全开基线可能超过水处理上限，油水分别比较。`, beforeLabel: '全开基线', afterLabel: '滚动控制', unit: 'm³', items: [{ label: '累计油量', before: sum(baseline, 'oil'), after: sum(rows, 'oil') }, { label: '累计水量', before: sum(baseline, 'water'), after: sum(rows, 'water') }] }
      ];
    }
  });
})();
