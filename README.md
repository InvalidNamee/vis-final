# 石油勘探开发的智能化可能性地图

Vue 3 + TypeScript + Vue Router + Pinia + Naive UI + Vite 的纯前端课程网站。原有 13 个模块和 61 个场景名称保留，钻井类别包含五个教学案例。

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

Vite 自动发现清单并按需加载演示，不需要逐项编辑入口。钻井案例位于 `plugins/drilling/d1` 至 `d5`；老师原包保留在 `plugins/seismic/s3/firstbreak-stalta`，作为导入兼容样例。传统注册式插件位于 `plugins/welllog/w1/welllog-layer`。完整协议见 [案例接入文档](docs/如何添加新案例.md)。

源码修改直接由开发服务读取；`npm run build` 更新生产站点，不创建分发 ZIP。旧 Python 命令保留为验证入口，只有用户明确要求分发时才加 `--zip`。

## 验证

```sh
npm test
npm run build
npm run test:e2e
npm run test:base
```

端到端测试使用本机 Edge，覆盖真实页面、导入、管理、下载、History 深链接和移动布局。子路径测试独立构建至忽略目录。接口、存档、模型与标题检查共同验证兼容性。

[架构与兼容说明](docs/外壳框架重构方案.md)。推荐与指标由本地教学算法计算；各源包的研究依据文件说明专业资料和合成假设。
