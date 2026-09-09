# Encounter 工作台接口 v0.1

状态：2026-09-09，类型与行为约定；历史只读 adapter 已实现，HTTP endpoint 与新界面仍未实现。
类型入口：`src/workbench/types.ts`。本次不迁移旧文件，不改变 runner 或记忆规则。

## 稳定起点

工作台开发前的提交为 `a611ce4b40f2ebe88f1e08386f5e96a3de6ac489`。
已创建本地稳定标记 `pilot-baseline-20260908`，保留原 `v0.1.0`。
它是代码与已提交报告的检查点，不是被 Git 忽略的书籍、ZIP 和真实 traces 的备份。
恢复查看可用 `git show pilot-baseline-20260908:README.md`；不用覆盖正在工作的目录。

## 数据流与职责

运行记录/文件版本 → adapter → EncounterView → 界面。

- runner：模型调用、运行生命周期、接受状态的决定。
- adapter：读取来源、映射事件、构造可证实的版本与缺口。
- contract：共享数据形状，无模型/文件系统/UI 依赖。
- UI：保存唯一 Selection，据此选择状态、高亮事件与展示节点。

旧的 Trace Inspector TraceEvent 不改变。adapter 将它转换为 WorkbenchEvent，并保留 evidence 引用。
未知事件必须保留，不能偷偷丢弃。read 仅在有明确证据时分类；否则保留 command/unknown。
已有脚本继续使用现有数据格式。未来先做只读 adapter，不要求历史数据迁移。

## 单一历史位置

Position = elapsedMs + order。order 是 adapter 为可见记录分配的稳定全序，处理同毫秒事件。
原始 trace 顺序优先；无法确定写入和事件先后时，不伪造精度，应到最早可确认位置才暴露版本。

- 时间轴固定预算（默认600000ms）；提前结束标记实际结束点，剩余区间无活动。
- 超预算仍保留真实 elapsedMs，界面可显示超时区，不能截掉证据。
- 拖到 t 时，相当于选中 t 毫秒全部已确认更新之后的位置。
- 点击 trace 使用该事件的 Position；“开始写入”不能显示写完后的内容。
- 各 artifact 选择 visibleFrom <= Selection 的最新版本。
- trace 列表保留完整，高亮选中位置之前最近的事件；没有此前事件就不高亮。
- 点击节点不移动时间，详情读取所选历史版本。
- live 跟随最新可确认位置；手动选择后进入 history，新数据到达不改变选择。
- 浏览历史时提示有新事件；明确点击“跟随实时”才返回 live。

## Graph 与 Notebook

两者分别保存版本，不能把独立写入误装成原子更新。
无 graph 版本与 nodes=[] 不同；无 notebook 版本与空字符串不同。
继承内容位于零时刻；未继承且尚未写入时，显示“尚无图谱更新/尚未留下笔记”。
非法或正在写入的 JSON 放入 issues，继续展示最后有效版本并提示，不生成假空图。
acceptance 描述该版本的状态；后续审计改变 acceptance 不改变原先可见时间。

节点点击展示 label、description、小字 id。源数据仅有 summary 时，adapter 可用于 description，但在 attributes 保留原值。
同 ID 视为同节点，换 ID 按删除+新增处理，不自动语义合并。
节点出生仅能解释为首次可确认可见；一批写入的节点同时出现。
节点数组顺序和图形坐标都不是形成时间。布局位置由UI负责，不改变 graph 内容。

## 历史证据不足

旧 pilot 保证 before/after，不保证每次中间写入都有完整快照。
endpoints_only 在开始显示 before，结束确认后显示 after；中间明确提示“缺少中间快照，显示上次已知状态”。
有完整且可验证的 patch 才可 trace_reconstruction；重建来源可展开，不执行历史 shell 命令来还原。
partial 使用 gaps 标明未知区间。captured_updates 只代表记录到的更新，不代表观察到了每次内部变化。
未来若需要完整写入历史，需另加版本捕获；单靠浏览器轮询无法保证不漏快速连续写入。

## 运行记录与 Agent 留言

运行标题来自事件；不得合成“正在沉思”等心理状态。
AgentRemark 必须来自实际模型输出，明确 model_reported 与触发方式。没有留言时为空数组。
remarks 是显式留言，不把所有日志或隐藏推理重命名为留言。
留言本身不自动写入长期记忆。

## 第一版读取接口

WorkbenchReader.listEncounters / getEncounter 是只读端口，首先可实现本地数据 adapter。
建议未来 HTTP 映射：GET /api/workbench/encounters 和 GET /api/workbench/encounters/:id。
这些路由目前未实现。刷新返回完整 EncounterView；revision 递增，客户端不接受较旧响应覆盖新数据。
404 表示不存在；读取失败作为错误返回，不能伪装成空列表。断线保留上次数据并显示连接状态。
运行结束后仍可能在归档；live=false 表示服务端不预期再自动追加本次运行数据。
`diagnostics` 保存来源不完整、接受状态不一致、非法 graph 和时间不可用等问题；这些问题不能被映射成空数据。

## 实现时的验收项

1. queued / 无版本、空图、继承图分别显示。
2. 时间轴和 trace 点击在同一 Position 得到相同 artifact 版本。
3. 相同毫秒内多事件按 order 排列；写入开始不泄露后续版本。
4. graph 更新不使 notebook 提前跳到下一版本。
5. endpoints_only 不生成假的逐节点生长动画。
6. history 模式不会因刷新跳回实时；断线不会清空内容。
7. 查看与节点点击不触发模型或改写实验状态。

这些是后续行为测试的验收要求；当前只定义类型，没有虚构已完成的运行测试。

## Adapter 设计

见 [本地 pilot adapter 设计](workbench-adapter-design.md)。第一版读取历史 endpoints，实时接入先补显式运行注册；刷新会话标识仍留给 HTTP 实现。
