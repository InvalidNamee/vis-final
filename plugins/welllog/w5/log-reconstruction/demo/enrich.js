(function () {
  'use strict';
  PluginViz.mount({
    get: () => ({ result: window.__caseResult, state: window.__caseState }),
    replaceTitles: ['缺测曲线修复'],
    build: ({ result }) => {
      const rows = result?.rows || [];
      if (!rows.length || !rows.every(r => [r.index, r.reference, r.prediction].every(Number.isFinite))) return [];
      const missing = rows.filter(r => r.evaluated), observed = rows.filter(r => !r.evaluated && Number.isFinite(r.observed));
      const panels = [{
        type: 'profile', title: '缺测曲线与修复结果共轴剖面',
        subtitle: '纵轴为向下递增的采样序号；原始观测保留真实缺口，三道横轴均为 API，标线表示缺测段首尾采样点。',
        depth: rows.map(r => r.index),
        tracks: [
          { label: '含缺口观测', unit: 'API', values: rows.map(r => Number.isFinite(r.observed) ? r.observed : null) },
          { label: '插值修复', unit: 'API', values: rows.map(r => r.prediction) },
          { label: '合成参考', unit: 'API', values: rows.map(r => r.reference) }
        ],
        boundaries: [result.audit?.gapStart, result.audit?.gapEnd].filter(Number.isFinite)
      }];
      if (missing.length) panels.push({
        type: 'histogram', title: '缺测段插值误差频数', unit: 'API', bins: 12,
        subtitle: '仅统计 ' + missing.length + ' 个缺测评价点；误差 = 插值结果 − 合成无噪参考，正值表示高估。',
        values: missing.map(r => r.prediction - r.reference)
      });
      const groups = [];
      if (observed.length) groups.push({ label: '有观测段（' + observed.length + ' 点）', values: observed.map(r => r.observed - r.reference) });
      if (missing.length) groups.push({ label: '缺测插值段（' + missing.length + ' 点）', values: missing.map(r => r.prediction - r.reference) });
      if (groups.length) panels.push({
        type: 'box', title: '观测段与缺测插值段误差分布', unit: 'API', groups,
        subtitle: '两组来自不同采样位置，均以合成无噪参考计算有符号误差；用于比较误差范围，缺测段没有原始观测值。'
      });
      return panels;
    }
  });
})();
