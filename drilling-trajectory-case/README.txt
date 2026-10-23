井眼轨迹智能控制 · 教学案例包

适用学号末两位 29：第 3 类钻井，场景 d3。
1. 直接打开 demo/index.html 可离线运行；无需后端、API 或安装依赖。
2. 原门户点击“添加案例”，选择或拖入整个 drilling-trajectory-case 文件夹，校验后添加。
3. 分发 ZIP 需先解压，再通过原入口导入文件夹。原导入器不直接解析 ZIP。
4. 修改以本文件夹为准；从仓库根运行 python scripts/build_drilling_cases.py，同步内置版本和 .dist 分发 ZIP。
5. node scripts/verify_drilling_cases.cjs 核查算法、源包与内置宿主兼容性。

文件：case.json 为元信息、背景和流程；demo/model.js 为独立算法；demo/demo.js 为业务交互；ui.js、demo.css 为本包自带呈现资源，不依赖其他案例。
所有数据、参数范围、阈值和响应系数均为教学合成设定；资料只支持业务定义和方法动机，不支持本例数值与现场收益。
详见研究依据.md。没有加载远程脚本、字体或在线模型。
