完井方式智能优选
案例：完井相似案例排序

通过原门户“添加案例”选择本目录内全部文件（包括demo子目录），或直接打开demo/index.html。
纯前端，不依赖网络、后端、模型API或外部库；所有参数在本地重算。
目录：case.json / demo/index.html / demo/demo.css / demo/demo.js / demo/model.js / 研究依据.md。
模型可用Node require：const m=require('./demo/model.js');m.run(m.defaults)。
所有数值为教学设置，不能作为施工、设备控制或安全判定。
本例不是大型深度模型。
日常修改不生成ZIP；独立导入无需修改主站接口。

可视化分析
----------
新增：排序条形图、组成堆叠图、平行坐标。
绘图资源包含在 demo/plugin-viz.js、demo/plugin-viz.css，数据适配位于 demo/enrich.js；整包导入和独立打开均使用包内资源。
