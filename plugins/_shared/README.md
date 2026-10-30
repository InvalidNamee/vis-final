# 案例可视化资源

`plugin-viz.js` 和 `plugin-viz.css` 是 61 个独立案例使用的 SVG/Canvas 绘图源文件。每个案例的 `demo/` 内保存副本，保证本地打开和文件夹导入时不依赖其他案例目录。

- `demo/enrich.js` 将当前模型结果适配为图表描述，不改变已有预测、搜索和评价算法。
- 配色统一从 CSS 变量读取；独立打开时的默认色值集中在 `plugin-viz.css` 中。
- 支持排序条形、哑铃、直方、箱线、矩阵、平行坐标、等值线、堆叠、流向、范围带、时间泳道、共轴剖面、方向玫瑰、散点矩阵及图像滑动对照。
- 公共库变更后执行 `node plugins/_shared/sync.cjs` 更新各包；执行 `node plugins/_shared/sync.cjs --check` 只检查副本一致性。两个命令均不创建 ZIP。
- 教师参考包 `seismic/s3/firstbreak-stalta` 不参与同步。
