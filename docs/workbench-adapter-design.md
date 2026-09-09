# Local pilot adapter 设计 v0.1

2026-09-09。状态：历史只读 adapter v0.1 已实现；实时注册、HTTP endpoint 和完整中间快照仍未实现。面向 `src/workbench/types.ts` 的只读 WorkbenchReader。
本阶段不调用模型、不运行历史命令、不改写任何原始实验数据。

## 1. 范围

第一版读取 `.trace-inspector/permutation-pilot/<batch>/<run>/t01..t03`。
支持六顺序 pilot 的已完成/失败记录；为正在运行的 encounter 定义接入方式。
H001 是 probe，不伪装成 encounter；baseline batch 在 encounter 列表中排除。
后续可单独定义 probe 比较接口，避免让本页假定所有观察都持续十分钟。

数据流：固定数据根目录 → catalog → source bundle → 纯映射 → EncounterView。

当前实现文件：

- `src/workbench/adapters/local-pilot-reader.ts`：文件读取、目录约束与 catalog。
- `src/workbench/adapters/map-pilot.ts`：不做 I/O 的映射、版本构造与证据引用。
- `src/workbench/workbench.test.ts`：合成来源的纯映射验收。

尚未创建的拆分文件（`pilot-source.ts`、`map-trace.ts`、`select-at.ts`）只有在实现体量需要时再拆出；当前避免为三百行以内的 adapter 过早分包。

保持这些模块在同一个应用中，不新增包或服务。先按职责写函数，只有实现体量需要时才拆文件。

## 2. 来源映射

| 输出 | 首选来源 | 规则 |
|---|---|---|
| encounter ID | batch / run / eid | 三段稳定组合；不使用 label 或目录绝对路径 |
| trajectoryId | batch / run | 不同 replacement 是不同轨迹，不能互相覆盖 |
| title / materials | config + step.material | W/L/K 对应材料说明；不从模型文本猜作者 |
| budgetMs | config.timeoutMs | 不硬编码；缺失为格式错误 |
| startedAt / endedAt | trace manifest | 保留 collector 生命周期定义，避免静默改成模型输出时间 |
| 状态与接受结果 | step + trace manifest + 批次状态 | 模型完成不代表输出被接受；保留失败原因 |
| events | 已完成的 events.json；活动 trace 的 raw.jsonl | 同一 normalizer；不将两份事件相加造成重复 |
| 初始 graph / notebook | before.json | origin=inherited，零时刻可见 |
| 本轮产物 | graph-after.raw.json / notebook-after.md | 即使被拒绝也保留有效候选版本 |
| 后续携带状态 | accepted-state.json | 用于核对 accepted，不能替代本轮产物 |
| remarks | 暂为空 | 旧数据没有独立留言通道；最终回应仍放在 message 事件 |

目录中 trace.json 是 collector 结果；其 traceDirectory 指向 manifest.json，后者才包含起止时间。
引用路径只在本地内部解析；浏览器不接收任意文件系统路径。
材料目录含多个文件时，不随意挑一个 hash 当整份材料 hash；没有定义好的材料摘要就 sourceHash=null。

## 3. 时间与顺序

时间原点使用 trace manifest.startedAt（collector 开始）。与现在十分钟的运行预算口径一致。
原事件 occurredAt 原样保留；elapsedMs 来自时间差，负值钳为0，时钟倒退按原始 sequence 单调化并产生诊断。
`order` 由稳定 source sequence 决定；不按事件文字或 graph.nodes 的顺序排序。

零时刻继承版本优先于任何运行事件。
结束快照放在运行结束之后的明确“结束快照可用”位置，order 大于最后事件。
这是后验归档位置，不宣称文件在这个精确时刻才写入；UI 必须显示 origin=end_checkpoint。
正在回放最后一个 turn/completed 事件时，不提前出现后验归档版本。

缺少完整时间来源时，不用文件 mtime 伪造模型时间；返回带具体路径代号的 source error，保留诊断。
刷新当前 elapsedMs 时，使用 reader 的可注入 clock；终态后不继续增加。

## 4. 两类产物独立转换

对 graph 和 notebook 各自读取 before / after，验证后构造版本。
Graph 验证 nodes/edges 数组、唯一字符串ID、边端点；描述优先 description，其次 summary，额外字段保留。
Notebook 保留字符串原文，不在 adapter 里做模型摘要或 Markdown 渲染。
Hash 按统一规范计算：graph 使用排序对象键、保留数组顺序的规范 JSON；notebook 使用原始 UTF-8 字符串。
原始文件 hash 与展示内容 hash 是不同用途；若需原始字节校验，内部 source bundle 单独保留。

- accepted=true 且产物与 accepted-state 一致：accepted 版本。
- step 未结束：合法快照为 draft。
- accepted=false：本轮合法产物为 rejected，不回退掩盖它。
- 非法 graph：记 issue，显示上一个有效版本；不把它当空图。
- notebook 缺失：记 issue；空字符串是合法内容。
- 内容没有改变：可以去重内容，但保留审计状态变化；不凭空生成一次编辑。

第一版历史数据默认 endpoints_only。中间区域显示“缺少中间快照，显示上次已知状态”。
原始 trace 里的 patch 留作未来重建能力，第一版不执行或自动解析任意 shell 写入。

## 5. 实时路径的限制与设计

旧 runner 在结束后才将 traceId 写入 step。现有 viewer 用近期 trace + 临时目录推测活动关联，这不能作为可靠接口。

第一版已交付已完成记录读取。实时接入需要一个明确的运行注册记录：

`{ encounterId, traceId, workspaceId, startedAt, status }`

由 runner/collector 在启动时发布，adapter 只消费。找不到注册信息时显示等待，不按时间相近猜测别的运行。
服务端读取追加的 raw.jsonl；忽略尚未写完的最后一行，完整行解析失败要报告，不静默跳过。
每次刷新可以先重放当前完整前缀；随后再按需优化增量读取。
消息流按现有 normalizer 聚合，同一 event ID 可以更新 detail，前端按 ID 更新而非重复追加。

Graph / notebook 可先读取注册工作区中的合法快照，记录“本次观察到更新”的时间与 hash。
轮询可能漏掉快速写入；标为 partial，不能声称完整捕获。
完整生长回放需后续持久版本捕获机制；仅在内存里轮询不能保证服务器重启后仍可回放。
读取工作区失败不清空内容；保留最近快照并报告问题。

## 6. 状态与错误

- queued：有明确计划但尚未启动的 encounter；startedAt/endedAt=null。
- running：有活动注册且尚未结束；批次停止但 step 不完整则报告 interrupted/failed，并注明来自编排层的判断。
- completed：模型完成且产物通过接受检查。
- failed：collector 错误、输出校验失败或明确编排失败，即使底层 turn.completed 也如此。
- interrupted：明确中断/超时，保留其 trace 和可能存在的 draft/rejected 产物。

不要仅根据最后一次文件修改时间判断运行仍活跃。
listEncounters 不把不可读目录当成零次实验。根目录不存在、格式损坏明确返回错误。
第一版 getEncounter 按需隔离单条错误；catalog 已知的坏条目应报告标识与原因，不静默从列表消失。

现有接口对“全局诊断/已知坏条目/缺失时间”表达不足：实现前建议增加 `diagnostics` 和 catalog 结果包装，或定义可类型区分的 reader error。
不为了勉强满足当前非空 elapsedMs 而制造时间值。 queued 可为0；已开始但时间不可恢复应为 source error。

## 7. 刷新一致性与路径边界

每次读取前后核对关键源文件 fingerprint；变化中最多有限重读，仍不稳定返回上次完整payload并标明暂时无法刷新。
没有缓存时返回可重试错误，不混合两次读到的状态。
revision 只在内容（不含 capturedAt）改变时增加；客户端在同一 reader 会话中忽略倒序响应。
服务重启需附带 sessionId 或让客户端显式清空 revision 缓存；当前 v0.1 类型需要补这个小字段后再实现实时HTTP。

由 catalog 将opaque encounter ID 映射到已验证路径。拒绝 ../、越根路径和越根 symlink。
工作区访问只接受 runner 明确登记且校验的路径，不接受浏览器传来的绝对路径。
详情中可能含私有内容；保持本地服务，公开 demo 使用独立清理后的 fixtures。

## 8. 第一轮实现验收

使用提交进 Git 的小型合成 fixture，不依赖用户的书籍或真实 traces：

1. completed + accepted：before/after 正确，events 可追溯。
2. rejected：accepted-state 是旧状态，但候选 after 仍显示为 rejected。
3. 缺失/非法 graph 与真正空图分开。
4. 一次graph更新和另一次notebook更新在选择时互不提前。
5. 同毫秒事件稳定排序；endpoint 在结束事件后才显示。
6. malformed 完整 JSONL 行报错，未完成末行等待。
7. 未知事件保留；userMessage 不算工具或 agent 留言。
8. 越根路径拒绝；读取不修改原始文件。
9. 同内容 revision 不变，变更递增；重启不误丢新快照。

离线人工核对再选一条真实 WLK 轨迹，比较节点数、笔记内容、起止时间和最终状态。
不需要新增模型实验。实时注册和持久版本捕获作为下一步实现，不混入第一轮只读历史 adapter。
