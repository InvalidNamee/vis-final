# 石油勘探开发的智能化可能性地图

面向石油勘探开发课程的纯前端网站，按作业环节、业务场景和智能方法组织内容。保留原有 **13 个模块、61 个场景**的名称，每个场景均有专业背景、案例流程和交互演示。

专业背景说明 AI 承担的任务、数据门槛、量化收益与实施难度；案例流程展示输入、计算、交付物及复核环节；演示通过浏览器本地的教学模型和合成数据重算指标、绘制图表、导出 CSV。具体算法与数据口径见各案例的 `研究依据.md`。

## 技术与目录

主站使用 **Vue 3、TypeScript、Vue Router 和 Vite**，搜索使用 MiniSearch，文件处理使用 fflate。界面组件位于 `src/ui/`，响应式状态由 Vue 的 `ref`、`computed` 等接口维护。

| 路径 | 内容 |
| --- | --- |
| `src/main.ts`、`src/App.vue`、`src/router.ts` | 应用启动、外壳与 History 路由 |
| `src/pages/`、`src/shell/`、`src/components/` | 页面、导航及业务组件 |
| `src/core/`、`src/ui/` | 状态、搜索、筛选、弹窗及通用界面 |
| `src/content/atlas.js` | 模块、场景、方法与业务元数据 |
| `src/boot/`、`src/runtime/`、`src/services/` | 案例注册、演示宿主、导入与管理服务 |
| `assets/core/tokens.css` | 主题颜色、字号、间距等设计变量 |
| `assets/core/ui.css`、`src/styles/` | 内容组件、主站及演示宿主样式 |
| `plugins/` | 61 个内置案例源包、公共绘图资源及教师参考包 |
| `scripts/`、`tests/` | 内容校验、算法检查、单元与浏览器测试 |
| `deploy/`、`docs/` | 部署配置及专题文档 |

## 本地运行

使用 Node.js 22.12+ 与 npm，在项目根目录执行：

```sh
npm ci
npm run dev
```

开发地址默认是 `http://localhost:5173/`；端口占用时以终端输出为准。主站通过 HTTP 访问，案例自己的 `demo/index.html` 可独立在浏览器打开。

生产构建与本地预览：

```sh
npm run build
npm run preview
```

构建产物位于 `dist/`，预览地址默认是 `http://localhost:4173/`。修改源码后，开发服务直接读取更新；生产预览需重新构建并刷新页面。

主要入口为 `/chain`（作业链）、`/stage/:id`（作业环节）、`/method/:id`（智能方法）、`/scene/:id`（场景）、`/cases`（案例库）、`/guide`（接入指南）和 `/admin`（管理）。例如 `/scene/r5?tab=demo` 可直接打开产品质量软测量演示。

## 案例接入与维护

内置案例使用以下目录：

```text
plugins/<stageId>/<sceneId>/<caseId>/
  case.json              案例信息、专业背景、流程与演示入口
  README.txt             案例说明
  研究依据.md             专业资料、算法与数据口径
  demo/
    index.html           独立演示页面
    demo.js / demo.css   案例交互与样式
    model.js             模型实现，多数案例独立提供
    enrich.js            将模型结果适配为补充图表
    plugin-viz.js        包内公共绘图库副本
    plugin-viz.css       包内绘图样式副本
    plugin-theme.css     包内离线主题默认值
```

具体资源以各包实际文件为准。`src/boot/plugins.ts` 自动发现清单，演示资源按作业环节分块、在挂载时加载。日常直接维护源包，由 Vite 读取；案例标题和内容在内置页面与源包中使用同一份清单。

通过“案例库 → 添加案例”可选择或拖入完整案例文件夹，校验、预览后导入。保留资源相对路径；ZIP 先解压。导入包及其资源保存在当前浏览器中，独立打开演示使用包内文件。

演示宿主支持完整 HTML 页面与模块脚本：页面模式使用隔离 iframe，模块模式使用 Shadow DOM。传统注册式插件及 `ATLAS`、`Cases`、`CaseImport`、`K` 接口继续保留，具体协议见[案例接入文档](docs/如何添加新案例.md)。

教师初至波参考包保留在 `plugins/seismic/s3/firstbreak-stalta`，其 `plugin.json` 标记为 `builtin: false`；s3 的默认内置案例为 `seismic-first-arrival`。旧测井注册式案例保存在 `tests/fixtures/legacy-welllog`，用于兼容性测试。

`author_exploration.cjs`、`author_construction.cjs`、`author_operations.cjs` 等历史批量创作脚本仍在 `scripts/` 中，执行会重写案例文件，当前主题、流程和补充图表须与生成结果核对。旧 Python 入口承担源包校验及显式打包。**日常构建、校验和资源同步均不生成分发 ZIP；仅明确要求分发时使用打包选项。**

## 主题与图表维护

UI、静态 SVG、图例和曲线使用框架主题变量。`--jade` 是主色的历史变量名，当前为蓝色。独立案例的 `plugin-theme.css` 提供低优先级默认值，宿主主题可以覆盖；栅格图像中表达观测数据的像素配色可保留。

补充图表由 `plugins/_shared/plugin-viz.js` 和 `plugin-viz.css` 统一维护，各包的 `enrich.js` 从当前计算结果生成图表描述。支持 15 类视图，包括矩阵、平行坐标、等值线、箱线、范围带、共轴剖面、散点矩阵和图像滑动对照。

- 补充 SVG 保持比例，宽度最多 900px，且不放大到超过绘图原始宽度。
- 特征散点矩阵按变量数调整单元格布局，最多四个变量，图高不超过约 545px。
- 图表默认锁定纵向滚动；实际内容超过容器可视高度时才开启，容器最高 600px。参数变化及窗口缩放后重新判断。
- SVG 图例和交互读数位于滚动区外；窄屏在图表区域内横向滚动。
- 图像滑动对照最多 600×480px，保持原始比例。

修改公共绘图资源或框架主题变量后执行：

```sh
node plugins/_shared/sync.cjs
node plugins/_shared/sync.cjs --check
npm run build
```

同步命令从框架读取离线主题默认值，并将三份公共资源复制到 61 个案例；`--check` 仅校验主题及副本一致性。教师参考包不参与同步。绘图库接口见[公共资源说明](plugins/_shared/README.md)。

## 验证命令

| 命令 | 检查内容 |
| --- | --- |
| `npm run typecheck` | TypeScript 与 Vue 类型 |
| `npm run build` | 原始标题、案例分类、类型与生产构建 |
| `npm test` | 标题、外壳接口、算法、全场景源包及单元测试 |
| `npm run verify:atlas` | 全场景源包及各业务组算法检查 |
| `npm run test:e2e` | 主站浏览器回归与全场景矩阵 |
| `npm run test:atlas` | 61 个案例的页面、导入、离线、重算和 CSV 测试 |
| `npm run test:base` | `/atlas/` 子路径、刷新、旧链接和静态资源 404 |
| `node plugins/_shared/sync.cjs --check` | 主题默认值及公共资源副本 |
| `node scripts/report_atlas.cjs` | 场景与案例覆盖统计 |

`npm run test:e2e` 和 `npm run test:atlas` 使用 Playwright 检查生产预览，运行前需执行 `npm run build`。`npm run test:base` 会自行构建子路径版本并启动预览服务。

浏览器通道与服务地址以 [Playwright 配置](playwright.config.ts)和[子路径测试脚本](scripts/test_base.cjs)为准，运行环境需具备对应浏览器。自动化覆盖范围与视口以 `tests/e2e/` 中的实际用例为准；图表高度、内容完整性和滚动行为还需在实际页面中复核。

验收历史见[全场景验收记录](docs/全场景验收记录.md)，当前结果以本地实际执行输出为准。

## 部署与浏览器存档

生产服务器将 `dist/` 内容作为静态站点发布。History 路由需要将页面深链接回退到 `index.html`，缺失的 JS、CSS 等静态资源保持 404。根路径配置见 [nginx.conf](deploy/nginx.conf)。

子路径构建示例：

```sh
ATLAS_BASE=/atlas/ npm run build
```

PowerShell 使用 `$env:ATLAS_BASE='/atlas/'` 后运行 `npm run build`。服务器将该前缀映射到构建目录，页面回退至 `/atlas/index.html`，配置见 [nginx-subpath.conf](deploy/nginx-subpath.conf)。

导入案例、管理修改与内置案例的隐藏状态保存在浏览器 `localStorage`，管理登录状态保存在 `sessionStorage`。同一来源下可继续读取原存档；更换域名、协议或端口后使用另一份浏览器存储。旧 `#/scene/...` 链接由路由层转换为 History 地址。

## 专题文档

- [全场景案例目录](docs/全场景案例目录.md)：各场景算法、源包与研究依据。
- [案例接入文档](docs/如何添加新案例.md)：清单、导入与演示接口。
- [外壳架构与兼容说明](docs/外壳框架重构方案.md)：模块、管理和存档契约。
- [钻井案例交付说明](docs/钻井作业交付说明.md)：五个钻井案例的交付范围。
- [项目约束](AGENTS.md)：标题规范、原始模块名称及构建分发要求。
