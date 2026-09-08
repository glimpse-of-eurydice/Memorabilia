# Memorabilia

一个本地 agent development observation 原型：记录连续 encounters 如何改变显式 notebook / concept map，并观察后续情境回应。

研究对象是基础模型与外部持久状态的整体。graph 是 agent 留下的显式组织，不是隐藏认知的直接读出。

## 当前状态（2026-09-08）

- 六种 W/L/K 顺序全部完成：18 次 encounters + 6 次 H001。
- H001 无记忆 baseline 已完成 3 次独立重复。
- 可浏览 checkpoint、notebook、graph、原始运行关联及 H001 回答。
- 尚无持续 conversation / diary，也没有对 care 或 love 的可靠测量。

见 [项目状态](project-status.md) 和 [baseline 回答与审计](baseline-20260908.md)。

## 本地运行

需要 Node.js、已登录的 Codex CLI，以及已构建的 sibling Thought Space / Trace Inspector collector。默认依赖 ../thought-space/dist，可通过 TRACE_INSPECTOR_ROOT 覆盖；CODEX_BIN 可指定 CLI。当前依赖仍是本地路径，不是可独立安装的软件包。

```sh
node --test case-studies/free-encounter/*.test.mjs
node case-studies/free-encounter/baseline.mjs --check
PORT=4335 node case-studies/free-encounter/pilot-view.mjs batch-1788881549644
```

--check 需要本地原 pilot 记录，只校验模板、不调用模型。以下命令会新建批次并调用模型三次：

```sh
node case-studies/free-encounter/baseline.mjs
```

原 pilot 页面：

```sh
node case-studies/free-encounter/pilot-view.mjs batch-1788843247027
```

## 文件与职责

- case-studies/free-encounter/pilot.mjs：冻结材料、六顺序运行和状态继承。
- case-studies/free-encounter/baseline.mjs：空记忆 H001、独立重复和审计。
- case-studies/free-encounter/pilot-view.mjs：只读本地服务，默认 4334，可设置 PORT。
- encounters/：材料说明、准备与实验设计。
- docs/：当前状态与结果；根目录 thought-space 计划保留为早期设计参考。
- .trace-inspector/：本地输入、状态、traces 与运行记录，Git 忽略。

## 保存约定

失败记录保留；不因回答内容而重新抽样。独立 probe 不写回主线。原始证据、模型自述与分析推断分开。

Git 忽略书籍全文、原始 traces、ZIP、scratch 与环境文件。Git 提交不备份这些实验数据；它们需要独立备份。提交的 baseline 报告包含完整模型回答，不包含原书全文或私有绝对路径。
