(function () {
  'use strict';
  PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    replaceTitles: ['轴向载荷组成'],
    build: ({ result }) => {
      if (!result || !result.rows?.length) return [];
      const rows = result.rows.filter(d => [d.wall, d.weight, d.pressure, d.thermal, d.axial, d.sf, d.mass, d.vm].every(Number.isFinite));
      const current = result.audit.current, best = result.audit.best;
      const cases = [{ label: `当前 ${current.wall.toFixed(2)} mm`, data: current }];
      if (best) cases.push({ label: `最小可行壁厚 ${best.wall.toFixed(2)} mm`, data: best });
      return [
        { type: 'stacked', title: '管柱轴向载荷组成', subtitle: '重量 + 活塞压力 − 全约束热膨胀；拉力为正、压力为负，代数和为轴向合力。', unit: 'kN', groups: cases.map(({ label, data }) => ({ label, segments: [{ label: '浮重', value: data.weight }, { label: '活塞压力', value: data.pressure }, { label: '热膨胀约束', value: -data.thermal }] })) },
        { type: 'bar', title: '候选壁厚轴向合力', subtitle: '零点两侧分别为拉伸与压缩；使用与载荷堆叠图一致的符号约定。', unit: 'kN', items: rows.map(d => ({ label: `${d.wall.toFixed(2)} mm`, value: d.axial, group: d.feasible ? '满足教学安全系数' : '未满足教学安全系数', selected: d.wall === best?.wall })) },
        { type: 'parallel', title: '壁厚质量与强度比较', subtitle: '完整壁厚网格；点击候选查看质量、组合应力和教学安全系数。', axes: [{ key: 'wall', label: '壁厚', unit: 'mm' }, { key: 'mass', label: '质量', unit: 'kg' }, { key: 'vm', label: '组合应力', unit: 'MPa' }, { key: 'sf', label: '教学安全系数' }], items: rows.map(d => ({ ...d, label: `${d.wall.toFixed(2)} mm`, selected: d.wall === best?.wall })) }
      ];
    }
  });
})();
