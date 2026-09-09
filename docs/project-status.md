# 项目状态 — 2026-09-08

## 已完成

1. 原型支持自由阅读、notebook / graph 编辑、逐轮状态继承与原始证据记录。
2. 六种顺序 pilot batch-1788843247027 完成 18 次 encounter 和 6 次 H001。
3. 无记忆 baseline batch-1788881549644 完成 3 次 H001；完整结果见 baseline-20260908.md。
4. 原 live viewer 支持三次 baseline 的队列、响应、运行事件与正确的进度计数；新增 PORT 选项。
5. 建立 Git 首次版本记录；原始数据与材料留本地。

## 当前理解

用户观察：六条轨迹结论趋同，解释用词有所不同。

Codex 辅助观察：三份 baseline 同样避免人格标签、保护隐私并安排工作。该回应不依赖新增阅读记忆；尚不能确定记忆是否影响更细的解释与决策。未开展人工盲审或统计推断。

## 验证与限制

- 五项无模型测试通过：graph 验证、空记忆 prompt、输入消息与工具调用分类。
- baseline builder 逐字重建原六份 H001 prompt 成功。
- 三份完成记录离线复核：相同输入、零工具调用、空工作区、只读且 subject 网络关闭、无额外 instructionSources。
- 默认 thread effort 元数据从原先 medium 变成 low；请求仍在 turn/start 设为 medium，最终生效值未独立回显。
- live HTTP 状态接口已检查；未完成自动化浏览器视觉验收。
- 本地路径依赖、材料及原始结果尚不是 fresh clone 可完全重现的打包分发。
- 第一批启动失败与 B1 审计误判保留，无基于回答内容的重跑。

## 后续候选（尚未执行）

- 人工阅读 baseline 与六条回答，区分结论、解释和具体操作。
- 选一个具有不同关切的 encounter，先明确研究问题再决定对照。
- 建立稳定的 checkpoint 格式和代码/数据独立备份。
- 逐步整理 collector 接口；不先做大规模架构重写。

## 提交边界

这是 Memorabilia 目录的首次 Git 提交，纳入已有原型代码、设计材料及此次 baseline 与文档。随后与 origin/main 的既有 v0.1.0 历史合并，保留远端源码、测试、primitives 和理论说明。ZIP、书籍全文、原始 traces、临时工作区不纳入版本库。

## 2026-09-09：工作台开发起点

- 本地 tag `pilot-baseline-20260908` 固定 a611ce4，原 v0.1.0 保留。
- 新增 src/workbench/types.ts 和 docs/workbench-contract.md；覆盖单一时间选择、独立图谱/笔记版本、实时事件、自述与历史缺口。
- 23 项核心测试和 5 项 free-encounter 测试通过；接口通过 TypeScript 检查。
- 此次仅定义接口，未重写 runner、迁移记录或实现新工作台。tag 不包含原始数据备份；本次未推送远端。

## 2026-09-09：Adapter 设计

接口提交 af4c059 和稳定 tag 已推送 origin。新增历史只读 adapter：`LocalPilotReader` 能读取已完成 free-encounter pilot，转换 18 条 encounter 为 `EncounterView`；纯映射测试纳入 npm test。验收补强后，adapter 会核对 `accepted-state` 与候选 graph/notebook；缺失 `startedAt` 进入 `EncounterView.diagnostics`；真实路径通过 realpath 检查，拒绝越出 pilot root 的符号链接。实时注册、新 HTTP 端点与完整中间快照仍未实现；不运行新实验。
