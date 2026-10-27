# 石油勘探开发的智能化可能性地图

Vue 3 + TypeScript + Vue Router + Pinia + Naive UI + Vite 的纯前端课程网站。原有 13 个模块和 61 个场景名称保留，全部 61 个场景均有专业背景、案例流程和可交互教学演示。学号末两位 29 对应的五个钻井案例继续保留。

## 开发与构建

使用 Node.js 24：

```sh
npm ci
npm run dev
npm run build
npm run preview
```

开发服务监听 `0.0.0.0:5173`。主站使用 HTTP 与 History 路由，不再通过双击根目录 HTML 运行；案例自己的 `demo/index.html` 仍可独立打开。生产产物位于 `dist/`，部署需配置 SPA 回退，见 `deploy/nginx.conf`。缺失静态文件应返回 404。

子路径部署例：PowerShell 中设置 `$env:ATLAS_BASE='/atlas/'` 后构建，服务器将该前缀映射到构建目录，并回退至 `/atlas/index.html`。同一浏览器来源下保留原 localStorage 存档；更换域名、协议或端口不会自动共享浏览器数据。

## 案例目录

```text
plugins/<stageId>/<sceneId>/<caseId>/
  case.json
  demo/
  README.txt
```

Vite 自动发现清单并按环节分块、按需加载演示，不需要逐项编辑入口。[全场景目录](docs/全场景案例目录.md)列出实际算法、源包与研究依据。每包自包含，可通过原“添加案例”入口导入。

原测井示范已由 `plugins/welllog/w1/welllog-layer` 中的新清单式案例覆盖，保持原 ID，旧脚本仅在 `tests/fixtures/legacy-welllog` 用于兼容测试。老师初至波原包保留在 `plugins/seismic/s3/firstbreak-stalta`，标记为仅导入样例，主站 s3 使用新的内置案例。传统注册式插件接口继续有效。完整协议见 [案例接入文档](docs/如何添加新案例.md)。

源码修改直接由开发服务读取；`npm run build` 更新生产站点，不创建分发 ZIP。旧 Python 命令保留为验证入口，只有用户明确要求分发时才加 `--zip`。

## 验证

```sh
npm test
npm run build
npm run test:e2e
npm run test:base
node scripts/report_atlas.cjs
```

端到端测试使用本机 Edge，逐一覆盖全部61包的三部分、桌面与390px窄屏、实际导入、独立离线、参数重算和CSV下载，另保留原管理与History路由回归。子路径测试独立构建至忽略目录。接口、存档、模型与标题检查共同验证兼容性。

`npm run verify:atlas` 单独运行全场景源包与算法检查；`npm run test:atlas` 单独运行全场景浏览器矩阵。`scripts/author_exploration.cjs`、`author_construction.cjs`、`author_operations.cjs` 及对应目录保存本轮新增案例的可复现维护源码，不在日常构建时自动改写案例包。

案例流程的业务情境、规模、交付物与任务失败模式维护于 `scripts/workflow_content.cjs`，上述三个维护脚本会同步应用。原五个钻井源包用 `node scripts/revise_drilling_workflows.cjs` 显式同步流程文案；该脚本可重复运行。流程概览采用实际样本、分组、搜索范围和评价口径，合成数据声明及模型边界保留在专业背景与研究依据。维护操作均不生成 ZIP。

[架构与兼容说明](docs/外壳框架重构方案.md)。推荐与指标由本地教学算法计算；各源包的研究依据文件说明专业资料和合成假设。
