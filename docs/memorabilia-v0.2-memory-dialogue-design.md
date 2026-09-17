# Memorabilia v0.2：经验层与世界表征层的对话

副标题：借鉴 Graphiti 与 Letta，以 selective replay、forgetting 和 downscaling 建立可观察的记忆循环。

日期：2026-09-17。状态：**设计提案，尚未实现**。代码核对基点：`00ea837`。

本文依据你提供的两份阅读讨论、当前仓库源码，以及当日查阅的论文和官方资料。神经科学部分核对了论文摘要与公开说明；没有把附件中的 ChatGPT 解读视为已经逐项验证的论文结论。外部实现会变化，下面区分论文、现行产品设计和 Memorabilia 的自定义方案。

阅读路线：先读第 1、5、6 节理解整体；第 7–10 节解释参数与运行；第 11 节是房间界面；第 12–14 节用于实施与验证。

## 1. 建议采用什么架构

建议在现有 Memorabilia 上实现一个轻量的双层记忆循环：

> **Encounter notebook + episodic graph 保存“发生了什么、当时如何理解”；world representation + diary 保存“这些经历逐渐形成了什么理解、这种理解如何变化”。两者通过有预算、可追溯的 sleep operator 对话。**

借鉴关系是：

| 来源 | 值得借鉴的职责 | 在 Memorabilia 中的落点 |
| --- | --- | --- |
| Graphiti | 将经验、实体关系和来源连接起来；增量更新；按时间与语义检索 | 有出处的 episodic graph 与 retrieval 层 |
| Letta | 前台活动与后台记忆整理分工；分层提供上下文；保存记忆修订历史 | foreground / sleep 两种运行模式与 context builder |
| Memorabilia 自己定义 | 哪些经验被重放；什么逐渐淡出；哪些解释被加强或修正 | replay policy、accessibility decay、world downscaling、行为观察 |

这里可以采用 hippocampus–neocortex 的**功能类比**，但“graph 是海马、文字是皮层”过于简单。两层都可以用文字与关系表达：真正的区别是**情境依赖程度、更新节奏、可回溯性以及如何影响下一次活动**。

第一版建议继续使用现有 TypeScript、文件与快照机制，先实现这套分工。**不把 Letta server、Graphiti 图数据库和当前 runtime 一次性全部引入。** 第 4 节给出以后真正接入 Graphiti 的方式；它是可替换的检索实现，不是架构成立的前提。

第一版形成的循环应当是：

```text
                     existing world representation W_t
                           |                  ^
        expectations /     |                  | supported revisions
        open questions     v                  |
new encounter --> encode episode --> select replay --> consolidate
                        |                 |              |
                        v                 v              v
                  notebook + graph   replay record   W_(t+1) + diary
                        |                                |
                        +---------- retrieval -----------+
                                         |
                                         v
                              next encounter / response
```

你问的“可以用 parameter 设计吗”：**可以，而且适合这样做。** 参数控制重放预算、衰减速度、保护窗口和更新强度；LLM 负责提出有语义内容的解释与修订。这里的 parameter 是外部记忆系统的参数，第一版不训练或修改基础模型权重。

## 2. 从睡眠论文中保留哪些想法

### 2.1 把阅读内容压缩成四个设计原则

1. **新经验与长期理解有不同的更新节奏。** 快速留下具体经验，长期理解经过跨经验比较再改变。Rasch & Born 的综述将睡眠描述为主动的巩固过程，涉及近期记忆重激活及其向长期知识的整合。[论文摘要](https://pubmed.ncbi.nlm.nih.gov/23589831/)
2. **巩固可以改变记忆的表达形式。** Klinzing 等人的综述讨论了 replay、网络之间的信息交流以及向 gist / abstraction 的转化。这启发我们同时保留具体记录和抽象解释，而不是只维护不断扩大的摘要。[论文](https://www.nature.com/articles/s41593-019-0467-3)
3. **episodic 与 schematic representation 可以共存。** Moscovitch 等人的 transformation 视角强调记忆表征及其神经基础会变化；这里借鉴的是详细经验与概括表征的区分，不假设时间一到，海马记录就全部搬入皮层。[论文](https://www.annualreviews.org/content/journals/10.1146/annurev-psych-113011-143733)
4. **加强与削弱可以共同发生。** Klinzing 等人将 systems consolidation 放在 global synaptic downscaling 的背景中讨论。工程上可以对应为“有限重放 + 选择性加强 + 活跃结构预算”，但具体公式由我们提出并验证。[论文](https://www.nature.com/articles/s41593-019-0467-3)

这些原则不要求模拟脑波、神经递质、DG/CA3 或 NREM/REM 阶段。它们也没有给出“保留 30 次”“每轮乘 0.98”之类的工程数值。

### 2.2 三个容易混淆的词

| 词 | 本提案中的明确含义 | 不能由此推断 |
| --- | --- | --- |
| replay | 将选定的旧经验再次作为一次新 consolidation 调用的输入 | UI 拖动时间轴就发生了学习 |
| forgetting | 某些记录更难进入上下文，或超出 agent 可访问范围 | 基础模型中的知识被删除了 |
| transformation | 新增或修订了跨经验解释，并检验它是否影响新情境 | 摘要更短、更抽象就证明了发展 |

尤其需要区分两种 replay：**Trace Inspector 的 replay 是观察者重看记录；memory replay 是系统重新处理经验。** 后者会产生新的 sleep run、候选修订及接受记录。

## 3. 现在已经有什么

仓库里并存三个阶段，不能把它们合并描述成一个已经具备全部能力的系统。

### 3.1 当前 Set A 主流程

依据 [set-a-runner.ts](../src/observation/set-a-runner.ts) 的 `encounterPrompt`、`parseEncounterAnswer`、`runSetA`：

```text
previous complete notebook + complete graph + current material
                              |
                              v
                    fresh encounter session
                              |
                              v
                 complete replacement notebook + graph
                              |
                       structural validation
                              |
                              v
                       accepted checkpoint
                          /         \
                         v           v
                  isolated probes   next encounter
```

这里已经有持久外部状态、独立模型会话、结构校验、checkpoint 和 probe barrier。但每次继续携带的是完整 notebook / graph，仍没有独立的 episodic store 和 world store。

Set A 的 C4→C5 出现图谱与笔记收缩，项目记录为 116/168 节点/边降到 63/85，笔记从 28,277 降到 18,317 字符。它说明现有全量重写允许明显的重组和细节损失；不能据此断言已经实现了 selective replay 或生物式遗忘。数据与限定见 [Set A observation](set-a-observation.md)。

### 3.2 可复用能力与缺口

| 能力 | 当前实际状态 | v0.2 的处理 |
| --- | --- | --- |
| agent 自由编辑 notebook / graph | free-encounter pilot 支持；Set A 改为 tool-free 全量返回 | 保留自由表达，但分开本次记录与长期结构 |
| graph 基础校验 | 唯一 ID、端点存在等；未约束事实/假设/来源语义 | 增加类型、来源、版本和操作校验 |
| trace 采集与历史回放 | 已有 collector、normalizer、viewer | 复用；增加记忆生命周期事件 |
| patch / reducer | 冻结 v0 已有 `applyGraphPatch` | 借用模式，不能直接当成熟多轮更新器 |
| 简单衰减 | 冻结 v0 对未激活的旧节点 persistence、旧边 weight 做乘法衰减 | 迁入新协议并定义明确的时钟；Set A 未接入 |
| 简单加强 | 冻结 v0 对符合激活条件的新边加 association increment | 不能误称已有跨轮 replay reinforcement |
| 确定性检索干预 | 冻结 v0 有固定 seed、按边权遍历、knockout/reinstatement | 可借用记录格式；新增面向文本问题的检索 |
| 当前 probe 上下文 | Set A 提供完整 checkpoint；不是语义检索 | 新增检索模式，同时保留 full-context 诊断模式 |
| observation barrier | 已有隔离流程与无模型测试；真实运行保留边界限定 | 扩展到所有新 store、索引、计数器和 sleep |
| Graph / Notebook / Trace 联动 | 已有只读 workbench 与共享时间选择 | 在现有界面上增加 world、diary、sleep 视图 |
| 运行中细粒度记忆版本 | 旧数据主要只有 before/after；没有完整中间写入记录 | 新协议在接受每个阶段时明确产生版本 |
| 近 30 次经验可回溯 | 尚未实现为 agent 可用的独立检索窗口 | 新增 recent episode store |
| world representation / diary | 未实现为独立状态 | 新增 world cards 与带引用的 diary entries |
| sleep scheduler / selective replay | 尚未实现 | 新增有预算的离线操作 |
| Graphiti / Letta 依赖 | 当前 `package.json` 未集成 | 先借鉴设计；后续按需要适配 |

相关源码：[free-encounter/pilot.mjs](../case-studies/free-encounter/pilot.mjs)、[冻结 v0 reducer](../src/case-study/thought-space-v0/state.ts)、[冻结 v0 retrieval](../src/case-study/thought-space-v0/retrieval.ts)、[probe-barrier.ts](../src/observation/probe-barrier.ts)、[workbench types](../src/workbench/types.ts)。

一个具体限制：冻结版虽然配置了 `contextTokenBudget`，当前 retrieval 函数没有执行对应的 token 裁剪。因此 v0.2 需要真正的 context budget 检查，不能只复制配置字段。

## 4. Graphiti 与 Letta 分别值得借鉴什么

### 4.1 Graphiti：经验到关系的可追溯索引

Graphiti 是构建和查询 temporal knowledge graph 的开源框架；Zep 是使用相关技术的产品体系。它们不应被视为同一个可直接安装的组件。Graphiti 的核心值得借鉴：episode 保留来源，entity / relation 从中提取，后续经验增量更新关系，查询可以结合语义、关键词和图结构。[官方仓库](https://github.com/getzep/graphiti)

论文中的 episode、semantic entity、community 三层说明：**Graphiti 本身已经跨越 episodic 与 semantic 表达，不能整体直接等同于 hippocampus。** community 的主题摘要也不自动等于 Memorabilia 要研究的 world schema。[Zep / Graphiti 论文](https://arxiv.org/html/2501.13956v1)

对本项目最有价值的设计如下。右侧都是本提案的应用方式。

| 借鉴点 | Memorabilia 中的用法 |
| --- | --- |
| Episode → entity / relation 的来源链 | 从任何关系回到哪次 encounter、哪段材料、哪条当时笔记 |
| 增量整合与实体消歧 | “Victor”和“Victor Frankenstein”可以同一实体；不同作品中的同名人物保留不同 scope |
| 时间化关系 | 区分“当时如此”与“现在如此”，保留被替代的关系版本 |
| 混合检索与 reranking | 用文字问题找相关经验，再沿关系补充有限上下文 |
| 自定义实体/边类型 | 区分材料陈述、agent 解释、类比、假设和反例关系 |
| namespace | 不同 trajectory 的经验隔离；不跨实验轨迹合并实体 |

检索配方、类型约束和分区分别见 [Searching](https://help.getzep.com/graphiti/working-with-data/searching)、[Custom types](https://help.getzep.com/graphiti/core-concepts/custom-entity-and-edge-types)、[Namespacing](https://help.getzep.com/graphiti/core-concepts/graph-namespacing)。文档存在不同代 API 写法，集成时需锁定版本并核对签名。

**时间失效与记忆变淡必须分开。** Graphiti 的 `valid_at / invalid_at` 表达关系所述事实的有效时间，`created_at / expired_at` 涉及系统记录时间；`episodes` 提供 episode 引用。这些字段不是 memory accessibility 或 belief confidence。[EntityEdge 源码](https://github.com/getzep/graphiti/blob/main/graphiti_core/edges.py)

例如，“甲已经离开某公司”可以让旧雇佣关系结束；“十次 encounter 没再提到甲”不应让这条关系在事实意义上失效。我们另设 `accessibility` 和 `strength`，不借用 `invalid_at` 实现 decay。

还有两项特别需要调整：

- **文学或哲学解释不适合一律按新事实覆盖旧事实。** “照顾可能变成控制”与“照顾可能表达尊重”可以在不同 scope 下共存。默认记录 `tension / qualifies / contradicts`，需要明确证据才结束旧版本。
- **相同关系被反复提取，不代表多次独立观察。** 同一材料的重读、摘要、diary 和 replay 均要追溯到同一个来源，避免重复计证。

在本文检查的官方接口中，没有看到一套现成的、满足本提案定义的 replay-protected decay 与 world downscaling 协议。它们仍由 Memorabilia 实现；这不是对所有 Graphiti 扩展的不存在证明。

### 4.2 Letta：记忆整理作为独立的计算阶段

需要把三个时间点分开：

| 层次 | 已核对的设计 | 借鉴方式 |
| --- | --- | --- |
| MemGPT，2023/2024 | 用分层记忆和数据调入调出管理有限 context | 当前上下文只是持久记忆的有限视图 |
| Sleep-time Compute，2025 | 在 query 到来前处理 context，形成更适合后续使用的文本表征 | 将 consolidation 做成明确的离线 operator |
| Context Repositories / 当前 MemFS，2026 | 文件式、版本化记忆与后台 reflection；按需加载内容 | 可审查的版本修订、紧凑常驻摘要、详细内容按需取用 |

来源：[MemGPT](https://arxiv.org/abs/2310.08560)、[Sleep-time Compute](https://arxiv.org/html/2504.13171v1)、[Context Repositories](https://www.letta.com/blog/context-repositories/)。

2025 论文的 `rethink_memory` 是用新字符串重写文本 context 的一种实现；其约 5 倍结果涉及特定数学任务的 **test-time compute**，不能转换成 Memorabilia 整个系统成本降低 5 倍，也不能证明生物记忆机制。[论文及附录 F/K](https://arxiv.org/html/2504.13171v1)

截至本次查阅，旧 sleep-time agents 文档链接已跳转到 Memory & dreaming。现行页面说明：后台任务回看近期对话、整合经验；可以按完成的步骤数或 context compaction 触发，也可以启用额外 agent review。[当前文档](https://docs.letta.com/configuration/memory)

MemFS 文档则说明：`system/` 内容常驻 context，其他文件按需读取；记忆使用 Git 版本化，后台整理可使用 worktree。MemFS **默认没有语义/向量索引**，相应搜索能力需要另外配置。[MemFS](https://docs.letta.com/concepts/memfs)

因此，前一份讨论对 Letta 的判断需要稍作修正：**“2025 论文主要研究提前计算”成立，但不能据此把 2026 Letta 的目标限定为预测未来问题。** 它也明确讨论从经验中形成可迁移的学习，以及记忆的 generalization / hygiene。[Context Constitution 说明](https://www.letta.com/blog/context-constitution/)、[2026 memory evaluation](https://www.letta.com/blog/evaluating-memory-in-production-agents/)

Memorabilia 的区别应落在可操作的选择上：显式的来源链、重放预算、遗忘制度、世界解释的修订轨迹，以及这些机制对未来行为的作用。不能只靠使用“development”这个词区分。

### 4.3 怎样把两者结合起来

建议的职责边界是：

```text
Letta-inspired orchestration
    foreground call / offline sleep call / context budget
                            |
                            v
Memorabilia memory policy
    select / decay / validate / commit / checkpoint / observe
                            |
                            v
Graphiti-inspired memory index
    episodes / scoped entities / relations / sources / retrieval
```

**让一个 orchestrator 拥有接受记忆写入的权力。** foreground 和 sleep 是同一基础模型的两种调用角色即可，不要求常驻两个服务，也不要求不同模型。

| 实施选择 | 收益与代价 | 建议 |
| --- | --- | --- |
| 本地实现必要机制 | 复用现有 runtime / 文件 / 快照，协议容易检查；检索能力需自己逐步补足 | v0.2 默认 |
| 增加 Graphiti adapter | 可利用其抽取、消歧与混合检索；增加 Python、数据库、embedding 和抽取成本 | 检索需求得到验证后加入 |
| 全面迁移到 Letta runtime 并接 Graphiti | 可利用完整 agent harness；需要重新验证隔离、状态导出和调度 | 后续独立迁移项目 |

若真正接入 Graphiti，建议增加一个窄接口 `EpisodeIndex`：`ingestAcceptedEpisode`、`searchSnapshot`、`getEpisode`、`exportProjection`。Graphiti 的输出须先保存并接受，再进入 checkpoint。它不能绕过 Memorabilia 的 policy 直接删除、合并或改写 world cards。

接入方式可以是 Python sidecar，由 TypeScript orchestrator 调用；不是给被试直接开放一个能写入全局数据库的 MCP。namespace 用 trajectory / branch 隔离，probe 使用冻结导出或独立副本。**仅传 `group_id` 或事实时间过滤不足以恢复历史 checkpoint**：实体摘要、索引、失效信息也可能包含之后才学到的内容。

Graphiti 的抽取过程依赖模型，重跑原始 episode 不保证得到完全一样的图。所以“可重建”的是**从已接受的抽取结果与版本化配置重建索引**；不能把重新调用 LLM 当作精确恢复历史。

## 5. Architecture：两层记忆、一个提交入口、一个观察面

### 5.1 总体架构图

```text
                         MEMORABILIA ORCHESTRATOR
                  logical clock / budgets / accepted state
                                      |
       +------------------------------+-----------------------------+
       |                                                            |
       v                                                            v
FOREGROUND MODE                                               SLEEP MODE
read new encounter                                     read frozen memory bundle
retrieve bounded context                               select & replay experiences
write episode note + patch                             propose world revisions
       |                                                            |
       v                                                            v
+---------------------------+                         +---------------------------+
| EXPERIENCE LAYER          | -- replay + evidence --> | WORLD LAYER               |
| fast / contextual        |                         | slower / cross-encounter  |
|                           | <-- questions / cues -- |                           |
| recent raw encounters     |                         | world cards + relations   |
| per-encounter notebooks   |                         | world.md projection       |
| episodic graph            |                         | diary of accepted changes |
| accessibility metadata    |                         | strength / scope / status |
+---------------------------+                         +---------------------------+
       |                                                            |
       +----------------------------+-------------------------------+
                                    |
                         VALIDATE + COMMIT ONCE
                    versions / provenance / policy effects
                                    |
                             accepted checkpoint
                           /          |          \
                          v           v           v
                 next foreground   observatory   isolated probe copy
                      context        read-only       |
                                                    v
                                              observer report
                                             (no return arrow)

Research archive: raw sources / old versions / rejected outputs / full traces
                  observer access; outside the subject's memory permissions
```

经验层和 world 层都属于外部记忆系统。图中的 hippocampus / cortex 类比不对应基础模型内部具体神经结构。

### 5.2 四个可见对象分别写什么

| 对象 | 回答的问题 | 更新原则 |
| --- | --- | --- |
| Encounter notebook | “这次遇到了什么？当时注意到什么、困惑什么？” | 每次生成独立记录；后来重读产生新 revision，不抹掉旧记录 |
| Episodic graph | “谁/什么在这次经验中与什么有关？依据在哪里？” | 增量关系、来源和跨经验链接；区分材料内容与解释 |
| World representation | “跨经验形成了哪些可迁移、可修正的理解？” | 用有 scope 和证据的 world cards 表达，只在 sleep 提交修订 |
| Diary | “这次整理后，哪些理解发生了变化，哪些仍不确定？” | 从已接受的 world delta 生成带引用的叙述；按条目保留历史 |

因此 notebook 和 diary 可以都很有文学性，但所处位置不同：前者贴近具体 encounter，后者描述解释的连续变化。不要让它们变成两份互相改写的无限总摘要。

### 5.3 避免四份记忆互相矛盾

需要明确每类信息的权威来源：

- **原始材料**：不可覆盖的 source artifact。
- **当时的理解**：该 encounter 的 notebook 版本及提取记录。
- **当前 world claim**：带版本的 world card；`world.md` 和 world graph 是它的可读投影。
- **变化的自述**：diary entry，标记为 `model_reported`，引用具体 world revision。

World card 的正文可以由模型自由写；结构字段提供边界。不要让 Markdown、JSON 和图的 label 分别成为三份可独立改写的“最终真相”。

Diary 可以在未来作为连续性线索进入有限上下文，但**不能被计算为新增外部证据**。其中尚未出现在已接受 world patch 中的新解释，要回到下一次候选修订，不能借 diary 偷渡为稳定 schema。

## 6. Pipeline：一次 encounter 到下一次 encounter

### 6.1 前台：快速记录，保留出处

```text
1. Receive E_t and identify exact supplied source bytes
                           |
2. Freeze parent checkpoint S_(t-1)
                           |
3. Build bounded context from W_(t-1) + relevant recent episodes
                           |
4. Foreground model encounters E_t
                           |
5. Propose: E_t notebook + episodic relations + open questions
                           |
6. Validate source links / graph patch / output budget
                           |
7. Commit S_t^awake; advance encounter clock once
                           |
8. Sleep due? -- no --> next encounter
       |
      yes
       v
   offline pipeline
```

对大材料，必须记录“提供给模型的范围”。存了整本书不等于模型读完了整本书。可以分块读取，但需要保存 source hash、chunk ID 和实际提供记录；不要用 summary 替代后仍声称完整暴露。

前台允许 agent 自己整合：它可以在 notebook 中比较过去经验、提议新关系、记录“可能需要修订某解释”。这些是本次解释与候选，不立即覆盖稳定的 world cards。这样前台仍有自主表达空间，同时能观察“即时解释”如何经过 sleep 变成长期结构。

### 6.2 离线：重放、修订、削弱、提交

```text
S_t^awake + policy version + replay seed
                    |
                    v
          A. Freeze candidate inventory
                    |
                    v
          B. Select at most k episodes
        recent / tension / exploration
                    |
                    v
          C. Build replay bundle
  selected notes + bounded source passages + relevant world cards
                    |
                    v
          D. One consolidation model call
  propose / qualify / support / contrast / merge / suspend
                    |
                    v
          E. Validate semantic patch structure and provenance
                    |
                    v
          F. Apply policy effects exactly once
  update accessibility / reinforce / downscale / enforce active limits
                    |
                    v
          G. Produce world projection + diary linked to accepted delta
                    |
                    v
          H. Commit S_t^sleep atomically
                    |
          +---------+----------+
          v                    v
  next encounter          read-only probe branches
```

阶段 E 的自动校验能查来源是否存在、是否被提供、操作是否合法，**不能单凭 JSON schema 证明模型概括正确**。语义质量由保留证据、反例和后续评估共同检查。

第一版把 diary 与候选 patch 放在同一次模型输出，校验时核对引用；若 diary 声称的变化没有被接受，则整次候选退回或不发布该叙述。这样不必为每轮额外调用一个 diary agent。

Sleep 读取的只有当前允许的记忆和过去来源，不包含下一份 encounter、未来 probe 问题或答案。v0.2 无需预测未来题目。

### 6.3 双向 dialogue 具体发生在哪里

**经验层 → world 层**：例如几次经验分别涉及人物的隐瞒、观察者误判和照顾者越界。Sleep 比较它们，提出“过去信息可以辅助理解，但其适用性需要由当前语境校验”的候选解释，并标明支持与反例。

**World 层 → 经验层**：以后遇到新材料时，这条解释可以让系统提出“旧信息与当前表述是否冲突？”这个检索问题，再找到相关旧经验。新材料仍要形成独立记录；不能为了贴合旧解释而改写原文。

第一版只实现两条温和反馈：world 的 open questions 影响一部分 replay 槽位；紧凑 world context 参与下一次理解。不立即加入复杂的 attention learning 或让所有 replay 都受当前 world model 支配。

### 6.4 用三个很小的合成 encounter 理解整个过程

假设 agent 连续读到三个活动记录。下面展示一种可能的产物，不规定模型必须学出这条结论。

| 时点 | 经验层记录 | World / diary 变化 |
| --- | --- | --- |
| E1 | “参观者没有提问”；notebook 猜测可能缺少兴趣，graph 将猜测标为 interpretation | 尚不把猜测提升成一般规则 |
| E2 | “另一位沉默的参观者后来发来详细问题”；保留人物、时间、两种行为的出处 | 前台记录它与 E1 猜测存在张力 |
| E3 | “第三位参观者明确表示对主题不感兴趣”；保留直接表述 | 保留这一不同情境，不强行消解差异 |
| SL1 | 重放 E1–E3 的有关片段和笔记 | 提议：沉默本身不足以判断兴趣；直接表述和后续行为可帮助区分。Diary 说明原先的解释被收窄 |
| E4 | 遇到新的“活动中没人发言”情境 | 紧凑 world context 可能促使 agent 保留多种解释、寻找补充信息；是否如此需要实际观察 |

到 E31 以后，E1 原文可能已退出可访问窗口，但这条有限范围的理解仍可能保留。此时 agent 可以应用该理解，却未必能复述 E1 的人物和具体措辞。**一般理解与具体细节有不同的保存轨迹**，这就是本方案最直接的目标。

## 7. 近 30 次 encounter、retrieval 与 forgetting

### 7.1 先把“保留”拆成三个预算

| 预算 | 本提案的约定 | 不代表什么 |
| --- | --- | --- |
| 可访问经验窗口 | 最近 30 次**已接受** encounter 保留材料、笔记、关系和可寻址内容 | 不是最近 30 天，也不是每轮全部塞入 context |
| 每次上下文预算 | 只提供检索选中的片段与 world cards | 保存在窗口里不保证每次都会想起 |
| 历史证据存储 | observer archive 保留旧版本与来源，去重保存 | 不能据此声称总磁盘占用恒定 |

**近 30 次的承诺是可回溯性，不是 recall accuracy 的保证。** 按明确 encounter ID / source span 读取应可验证；自然语言问题能否找到对应记录仍取决于检索及上下文构造。

最小版建议窗口外原文退出 agent 可访问范围，保留已被接受的 world cards 及有限 evidence capsules。研究者仍可从 archive 查看原文。如果以后希望某些旧经验长期鲜活，可增加有独立上限的 pinned episode 池；初版先不加。

### 7.2 第 31 次到来时发生什么

```text
Before E31:
    agent-accessible full episodes = E01 ... E30

Admission boundary:
    E31 is staged, not silently appended to an unbounded active store
    if consolidation is enabled and E01 was never replayed:
        reserve one replay slot for E01 before its exit
        commit sleep successfully / defer admission on failure

After accepted transition:
    agent-accessible full episodes = E02 ... E31
    E01 full artifact             = observer archive
    E01-derived world claim       = may remain with bounded evidence capsule
    source handle                 = retained, marked archive_only
```

离开窗口不强制产生 schema。Sleep 完全可以判断某次经验没有值得迁移的内容；必须记录这一结果，不能为了“什么都留下”而制造概括。

Evidence capsule 是有限的依据摘要或已选摘录，标明它是摘要还是原文，保留 source hash 与 span。它能支撑某条已有 world claim，不能保证重建整次经验。全文不可用时，回答必须区分“记得概括”与“能够核对细节”。

窗口退出同时更新原文索引、向量索引、图投影与缓存的访问资格。混合了 E01 内容的实体摘要也不能原样留在近期索引中；从仍可访问的已接受抽取记录重新生成投影，或把明确保留的概括登记成 world card。这样不会发生“原文不能读，但旧摘要仍把全部细节带回来”的旁路。

### 7.3 容量并不会由 N=30 自动解决

30 本书可能很大，world cards、diary 和 trace 也会增长。建议同时配置：

- 每次 encounter 的材料准入大小与实际暴露预算；超额时报容量状态，不静默截断。
- 每次 notebook、episode patch 的大小限制。
- active episodic graph 和 active world cards 的数量/文本预算。
- 每次检索、每次 sleep 的 token 预算。
- source blobs 按内容 hash 去重，历史使用 delta + 周期性快照，避免反复复制累计全文。

活跃图上限约束默认图投影，不取消窗口内每个 episode 的独立记录。某个节点因图容量退出默认显示后，窗口内对应的原文、笔记和已接受抽取仍应能按 episode ID 读取。

第一版保证的是**活跃记忆和每轮计算有上限**。完整研究 archive 仍随实验增长；若总磁盘也必须严格有界，需要另外规定归档到外部存储或删除政策，并接受部分历史不能再核查。

### 7.4 一个具体检索流程

```text
query / current-encounter cues
              |
              v
checkpoint + trajectory + agent-access eligibility filter
              |
      +-------+--------+
      v                v
recent source/note   world cards
keyword retrieval   keyword retrieval
      |                |
      +-------+--------+
              |
     optional semantic candidates
              |
     bounded graph neighborhood expansion
              |
     deduplicate + rank + diversity
              |
     build context within token budget
              |
     provide source passages + scoped claims
              |
     log exact supplied IDs / versions / text hash
```

初版先做近期原文/笔记关键词检索，加一跳图扩展；小规模可使用本地索引或扫描。语义 embedding 与 Graphiti 在这个接口后增加。必须保留一条**不依赖已提取图节点的原文检索路径**，否则抽取时漏掉的人名、数字或措辞永远无法被找回。

先过滤资格，再排序与截取；若后端只能先返回候选，需要有界翻页补足。不能从所有年代的结果取 top-k 后随手剔除旧记录，导致近期候选被挤掉。

回答具体细节时优先提供原始片段；world claim 用来解释和引导检索，不能冒充原文证据。旧事实若有适用时间或 scope，应一起进入 context。

Context builder 固定分区与配额，例如 world 2,000、近期证据 4,000、近期笔记/diary 2,000 tokens，总计 8,000；这只是起始预算，需要按所用 tokenizer 校验，并另外为新材料、指令和输出留空间。裁剪必须记下被省略的记录，不截断半个 JSON 或半段引用后仍称原样提供。

## 8. 参数如何控制 replay、decay 与 downscaling

本节全部是**可试验的工程假设**。除你提出的窗口 30 外，数值只是便于建立第一个 pilot 的起点，不是从神经科学推导的常数，也不替换仓库现有的 v1 preregistration。

### 8.1 四类元数据不要混成一个分数

| 字段 | 含义 | 典型改变原因 |
| --- | --- | --- |
| `accessibility` | 一次经验被自发检索/重放的倾向 | encounter 时间推进、接受的 replay |
| `strength` | 一条 world claim 在有限上下文中的显著程度 | downscaling、replay、新的支持 |
| `evidenceStatus` | 支持、冲突与范围情况 | 新的独立证据或明确反例 |
| `validTime / revisionTime` | 关系适用时间、系统何时持有此版本 | 事实变化、修订提交 |

初版不必用一个看似精确的 `confidence=0.93`。可以先用 `tentative / supported / contested / superseded` 加支持/反例列表。即使以后有 confidence，它也不等于检索权重，更不能因不断 replay 自己写的内容就上涨。

### 8.2 Episodic decay：越来越不容易自发想起

实验默认用**已接受 encounter 的序号**计时，避免停机、读报告或运行 probe 使 agent 多“衰老”几天。

```text
Between accepted updates:
    a_i(t) = a_i(t0) * 2 ^ (-(t - t0) / H_e)

After one accepted sleep that actually replayed episode i:
    a_i <- min(1, a_i + replay_boost)
```

`H_e` 是 accessibility 的半衰期，例如 15 次 encounter；`replay_boost` 可暂设 0.15。首次记录 `a_i=1`。保存更新时间，保证恢复后不重复衰减；一次 sleep 对同一 episode 最多强化一次。

为保留近期可回溯性，accessibility 只作为自然检索排序的温和因素，不能阻断按 ID 读取窗口内原文。明确细节查询可进入不使用 decay 排序的核查模式，记录该模式；因此我们能区分“自发想起困难”和“内容已不可访问”。

单纯降低分数未必产生可观察的遗忘：若候选只有三个而预算容纳全部，结果不会变化。效果必须经过竞争、有限 context 或窗口退出才体现。

### 8.3 Selective replay：先用可解释的五个槽位

建议每 3 次已接受 encounter 运行一次 sleep；每次最多 replay 5 个不同 episode：

| 槽位 | 选择方法 | 用途 |
| --- | --- | --- |
| 2 个近期/未处理 | 优先从未 replay，再按最早待处理顺序 | 避免新经验持续饥饿 |
| 2 个关联/张力 | 与 open question、候选冲突或相关 world claim 有关，兼顾来源差异 | 让两层发生对话 |
| 1 个探索 | 从剩余有资格经验中按固定 seed 均匀抽样 | 减少旧 schema 自我确认 |

不足 5 个就使用实际可用数；重复命中只算一次；空槽按“未处理 → 其他近期 → 探索”补齐。排序同分用稳定 ID。每条记录选择原因、候选列表和抽样 seed。

一个 replay unit 是某次经验的笔记、相关图边和有限来源片段，**不是自动重读整本书**。如果本轮只提供 gist，记录 `fidelity=gist`，不得声称重放了原始细节。每轮还要有 replay input tokens 上限。

这种配额方案比一开始引入十几个 salience 权重更容易理解。之后可以比较 recency-only、uniform-random、tension-aware；不是先让 LLM 给每项打一个含义不清的“重要性总分”。

### 8.4 World downscaling：显著性下降，不等于判断为假

每次成功的逻辑 sleep，对已存在的 active world claim 执行一次：

```text
w_j_next = clip(
    gamma * w_j
    + eta_new * new_independent_support_j
    + eta_replay * replay_support_j / (1 + prior_replay_support_count_j),
    0, 1
)
```

示例起点：`gamma=0.98`、`eta_new=0.10`、`eta_replay=0.03`。

- `new_independent_support_j` 初版取 0/1：本轮是否出现尚未计入、同 scope 下的独立支持来源。
- `replay_support_j` 取 0/1：被重放的材料是否被明确用于支持该 claim；仅出现在候选列表不算。
- 新 claim 用固定初始值（例如 0.3）建立，从下一次 sleep 开始衰减；不重复计算创建奖励。
- 重读同一来源可以维持显著性，但不增加独立证据数量；反复 replay 的增益递减。
- 反例修改 scope、状态或生成对立候选；不简单把 `w` 减掉某个数就当处理了语义冲突。

可以把这理解成：旧理解平时逐渐退到背景；被重新用到的部分暂时保持清晰；真正的新依据才改变它有多少外部支持。

**统一乘 0.98 不会改变纯权重排序，也不会自动改善信噪比。** 要产生资源释放，需要有选择性增强、固定阈值或活跃容量竞争。建议低于阈值的 claim 退出常驻 world 投影；超容量时依据 strength、来源冗余与明确规则退为 dormant。

Dormant 的全文若已移入 observer archive，则 agent 不能偷偷检索回来。以后新经验重新建立类似解释时，保留新的修订来源；若要支持可检索 dormant 池，必须给它另设有限容量，不能把所有历史藏在这个名字下面。

时间久未被提及的可靠知识不应因此变成 `false`。状态、可访问性和事实有效性始终分开。

### 8.5 建议的起始配置

| 参数 | 初始提案 | 解释 |
| --- | --- | --- |
| `recentEncounterLimit` | 30 | 最近完整经验的可访问窗口 |
| `clock` | accepted encounter index | probe、UI 操作不推进 |
| `sleepEveryEncounters` | 3 | 第一版固定调度，另有窗口退出前的处理检查 |
| `replayMaxEpisodes` | 5 | 同一 sleep 内不同 episode 数 |
| `replayMix` | 2 / 2 / 1 | 未处理、关联/张力、探索 |
| `episodeHalfLifeEncounters` | 15 | accessibility 半衰期 |
| `episodeReplayBoost` | 0.15 | 每次接受重放的有界增益 |
| `worldDownscaleGamma` | 0.98 | 每个成功逻辑 sleep 一次 |
| `worldDormantThreshold` | 0.15 | 不再默认提供的阈值 |
| `maxActiveWorldCards` | 100 | 包含 tentative / contested，防止它们另行无限增长 |
| `maxWorldCardTokens` | 300 | 正文、scope 与有限证据 capsule 的总预算；完整来源列表放 archive |
| `maxEpisodicNodes / Edges` | 600 / 1,200 | 活跃图投影上限；原文检索仍独立可用 |
| `memoryContextTokens` | 8,000 | 不含当前新材料与输出保留额 |
| `sleepInputTokens / OutputTokens` | 12,000 / 3,000 | 包含 replay、被比较的 world 与指令 |
| `activeDiaryEntries` | 10 | 每条另有限长；老条目进 observer archive |
| `archiveReadBySubject` | false | 第一版采用严格实验边界 |

预算是要实现的硬检查，不是让 prompt “尽量简短”。过大来源的准入上限、每条 notebook / diary 的具体上限仍需根据 pilot 材料校准；在确定这些上限前，只能声称有条数上限，不能声称活跃字节数有严格上限。

数值敏感性很直观：`0.98^30 ≈ 0.545`，未加强的权重经过 30 次 sleep 约剩一半；若每 3 个 encounter 才 sleep，就是约 90 次 encounter。调 sleep 频率同时改变了总衰减，比较实验时必须把这个因素明确控制。

## 9. 最少需要哪些数据对象

以下是拟议契约，不是已有 API。第一版可以用 JSON / JSONL / Markdown 完成，不需要先建设通用 memory platform。

### 9.1 Episode：保留具体经验与可变解释

一个 episode 至少包含：

```text
Episode
  id / trajectoryId / acceptedEncounterIndex
  source: artifactHash, title, suppliedSpanRefs
  exposure: providedChunkRefs, readingCoverageStatus
  notebook: acceptedRevisionId, contentHash
  relations: acceptedExtractionRevisionId
  accessibility: value, updatedAtEncounterIndex
  replay: count, lastAcceptedSleepId
  retention: recent_full | archive_only
```

source bytes 与最初的 notebook version 不覆盖。重读后可以增加 `notebook revision`、链接或质疑；原先怎么理解仍能从历史中查看。工作台的“Notebook”可以是这些独立记录的聚合视图。

图边至少补充 `sourceEpisodeIds`、`sourceSpanRefs`、`claimKind`、`scope`、`revisionId`。其中 `claimKind` 可为 `source_assertion / agent_interpretation / hypothesis / analogy`，具体谓词仍可自由表达。材料中的一句话首先是“来源提出的陈述”，不是系统已经验证的世界事实。

### 9.2 World card：一条可修订的理解

示例仅展示形状；以下内容是合成说明，不是现有 agent 的真实记忆，也不是给被试预置的结论：

```json
{
  "id": "W-012",
  "revision": 2,
  "statement": "相同行为可能有不同原因，需要结合当下情境解释。",
  "scope": "信息不完整、存在多种合理解释的情境",
  "evidenceStatus": "tentative",
  "supportRefs": ["E-004:span-12", "E-009:span-03"],
  "counterRefs": [],
  "openQuestion": "哪些情境允许仅凭行为作出较可靠的判断？",
  "strength": 0.43,
  "createdBySleepId": "SL-003",
  "updatedBySleepId": "SL-004",
  "supersedes": "W-012@1"
}
```

`supportRefs` 指向证据，不自动证明 statement 已被充分支持。v0.2 可以设置“至少来自两个不同来源组，才允许标记跨经验支持”的工作规则，但这只是阻止单次印象过早升级的门槛。两次阅读同一篇文章、两个文本引用同一事件，不一定是独立证据。

初版允许一次重要经验产生 tentative card，并明确单一来源；不能为了满足门槛虚构第二份证据。合并 world cards 时保留 alias / supersedes 关系及全部历史出处，活跃 card 中只展示有限证据摘录。

完整的来源去重账本由 orchestrator 保存并纳入 checkpoint manifest，记录已计证的 source group / span / claim revision。它不作为全文记忆提供给 agent，但会影响未来强化，不能成为未被快照记录的隐藏状态。账本与审计历史可能增长，也计入 archive 的存储成本。

建议语义操作只有六类：`propose`、`revise`、`link_evidence`、`relate`、`merge`、`suspend`。数值强化、衰减、容量退出由 policy 执行，模型不能直接指定“把我的 confidence 提高到 1”。

### 9.3 Sleep run：为什么这次改了

至少保存：父 checkpoint hash、policy hash、逻辑步、seed、候选与选中 IDs、选择原因、实际提供片段、输入 hash、模型配置、原始输出、候选 patch、校验结果、policy delta、接受后的 checkpoint hash。

必须分开保存：

```text
model_proposed:
    revise W-012 scope
    link E-009 as counterevidence

policy_applied:
    downscale W-008 strength 0.42 -> 0.4116
    reinforce E-009 accessibility
    move E-001 outside recent window
```

这样观察者能看出一次变化来自模型解释还是预先设定的机械规则，而不是把所有变化都称作 agent 自发发展。

### 9.4 状态目录与权威边界

```text
.trace-inspector/dialogue/<trajectory>/
  canonical/                         # only orchestrator writes
    manifest.json                    # current accepted checkpoint pointer
    episode-catalog.json
    episodic-graph.json
    world.json                       # authoritative world cards/relations
    diary-index.json
    policy-state.json                # clocks, counters, seed, support-ledger hash
  blobs/                             # content-addressed source/note objects
  operations/                        # accepted patches and policy effects
  checkpoints/                       # manifests + hashes; periodic full state
  indexes/                           # derived from accepted, versioned records
  sleep-runs/                        # candidates, traces, accepted/rejected results
  observer-archive/                  # old records and original audit evidence
  probes/                            # isolated inputs and reports

Disposable subject bundle:
  allowed recent sources + selected notes + world projection
  (no repository root, probe folder, or observer archive mounted)
```

目录分开本身不构成隔离。真正的 subject bundle 必须由 manifest 白名单构建，并通过运行时权限或 tool-free 输入限制可读内容。若 source blob 仍能从任意本地路径读取，“archive-only”就只是标签，遗忘制度实际没有生效。

## 10. Sleep 的调度、提交与失败

### 10.1 先实现离线阶段，再实现真正并发

第一版建议**串行、事件驱动**：每 3 次 encounter 后进入 sleep，完成后才接受下一次 encounter。这里“后台”指任务职责与用户交互分离，不承诺第一版已经实现不中断前台的并发服务。

这样可以直接知道：哪份经验进入了哪次 sleep；下一次 encounter 用的是 sleep 前还是后的 world。等循环可验证后，再借鉴 Letta 的分支工作方式做真正异步：foreground 读旧版本，sleep 在父版本副本上产生候选，提交时检查父版本是否仍匹配。

若前台已经推进 canonical state，旧 sleep patch 标记为 stale，重新准备输入或按明确合并规则处理。不能把旧版本的整个 `world.md` 覆盖新版本。

### 10.2 最小提交协议

1. 创建 `sleepId`，固定 parent hash、logical sleep ordinal 和输入。
2. 在 staging 区生成候选输出，校验引用、预算和操作。
3. 在 staging 上计算全部 policy effects、world 投影与 diary。
4. 检查父版本未改变、输出完整、source / index / policy manifest 一致。
5. 先写完不可变产物，再原子切换 accepted manifest；最后标记 run 成功。

`parentCheckpoint + logicalSleepOrdinal + policyHash` 形成幂等识别依据；`attemptId` 单独标识执行重试。恢复时已经提交的逻辑 sleep 不能再次 decay 或 reinforcement。

失败保留旧 checkpoint 与失败记录，不能接受一半 world、一半 diary。原子 manifest 切换足以支撑单进程本地 MVP；引入并发时再增加锁或 compare-and-swap 机制。

### 10.3 原有 probe barrier 扩展到新状态

现有 [barrier 设计](encounter-probe-barrier.md) 已明确禁止 probe 反向影响主轨迹。v0.2 的 checkpoint 需要覆盖：episode 可访问目录、graph、world cards、diary、索引版本、参数、时钟、replay counters 和随机状态。

- probe 在冻结副本上检索；检索的访问次数和缓存不回写 canonical。
- sleep 不读取 probe 问题、回答、评分、observer notes 或其 traces。
- 从 probe 返回后，下一次 encounter 的实际输入 hash 应与未插入 probe 时一致。
- 历史 probe 必须使用历史索引/投影，不能查询后来的全局图再按日期伪装成旧状态。
- 可选择观察 `S_t^awake` 和 `S_t^sleep`，明确它们是两个阶段，不能把同一步的不同状态都叫 C_t。

这些约束使观测不会变成一次无意的复习。它们不能证明托管模型不可观察的内部状态完全隔离。

## 11. 房间感的观测界面

### 11.1 一个房间，四种观看距离

可以继续使用当前工作台的暖白、苔绿与纸张感：近处是刚经历的材料和笔记，远处是形成的理解。空间布局不需要 3D，稳定位置和相互可追溯的对象已经可以产生“住在记忆里”的感觉。

```text
+------------------------------------------------------------------------------+
| MEMORABILIA  | trajectory A | E12 / after sleep | historical / live             |
| E01 --- E02 --- E03 -- [SL1] --- ... --- E12 -- [SL4]                           |
+-----------------------+-------------------------------+----------------------+
| RECENT ENCOUNTERS      | RELATION WALL                 | WORLD SHELF          |
|                       |                               |                      |
| E12  current          | [Episodes] [World] [Bridge]    | W12  tentative       |
| E11                   |                               | scope / evidence     |
| E10                   |  E04 ---- supports ---- W12    | counterexamples      |
| ...                   |   \                     /     | open questions       |
| full access: 30       |    E09 -- qualifies ---       | changes since SL3    |
+-----------------------+-------------------------------+----------------------+
| WRITING DESK                                                                 |
| [Encounter notebook] [Diary]                                                 |
| E12: what was encountered      /      SL4: what changed in interpretation      |
+------------------------------------------------------------------------------+
| TRACE DRAWER: selected 5 -> provided 4 -> proposed 3 revisions -> accepted 2    |
| source links | before/after | policy changes | probe reports                   |
+------------------------------------------------------------------------------+
```

图中计数是界面示例，不是当前实验结果。`selected` 与 `provided` 可以不同，例如输入预算使一个候选没有进入本次模型 context；两者必须分别记录。

### 11.2 三种 graph 视图

| 视图 | 显示什么 | 主要交互 |
| --- | --- | --- |
| Episodes | 近期经验、具体概念与来源关系 | 点节点看当时笔记、材料片段和当前可访问状态 |
| World | world cards 及 qualifies / contrasts / supports 等关系 | 点卡片看适用范围、修订史和未解决问题 |
| Bridge | 选中的 world claim 与其支持/反例 episode | 顺着来源观察具体经历怎样形成一种理解 |

这比把两层塞进一张越来越大的图更容易理解。Graph 是关系视图，Notebook / World / Diary 是文字视图，选择共享稳定 ID 和 checkpoint。

### 11.3 动画与视觉必须对应记录

- 明暗可以表示 accessibility，但标尺固定，避免每次按当前最大值重新归一化，掩盖整体 downscaling。
- 边宽可以表示明确的 strength；不要将它标作“真实确信程度”。
- replay 动画只在对应 sleep run 实际提供该记录时出现；被选入候选不等于被读取。
- 对比视图区分模型修订、policy 衰减、窗口退出和单纯布局变化。
- 历史记录缺少中间快照时，继续沿用现有 coverage / gap 提示。
- “当前 agent 可访问”与“观察者可在 archive 查看”使用不同标记，避免研究者误以为 agent 仍记得。

World 与 diary 的版本也必须由共享时间游标解析；查看 E8 时不能旁边显示 E12 的最新 world。界面浏览保持只读，不能因用户点开一条旧记录就提高它的 accessibility。

“Sleep”先作为时间轴上的可展开阶段，不立即做梦境生成或漂浮粒子。最有价值的空间体验是：**从书架上的一种理解，能走回桌上的原始笔记，再看到它经过哪次整理改变。**

## 12. 具体需要改什么、加什么

### 12.1 复用与修改清单

| 位置 | 现在负责什么 | 建议改动 |
| --- | --- | --- |
| `src/trace-inspector/` | runtime 采集、事件归一化与证据回放 | 继续复用公开 `index.ts`；接入新调用角色与 run 关联信息 |
| `src/observation/set-a-runner.ts` | Set A 的全量重写、接受与 probe | 保留旧协议，提取可复用调用/接受步骤给新 runner |
| `src/observation/probe-barrier.ts` | graph + notebook checkpoint、mock barrier | 为 v0.2 增加完整 manifest / export；旧 schema 继续可读 |
| `src/case-study/thought-space-v0/state.ts` | 冻结版 patch、衰减 | 参考其纯 reducer 和 delta 记录模式，另写 v0.2 reducer |
| `src/case-study/thought-space-v0/retrieval.ts` | 固定 seed 图遍历干预 | 参考检索记录；新增原文检索与预算，不直接代替新 retriever |
| `src/workbench/types.ts` | encounter、graph、notebook 的观察契约 | 新版本增加 phase、sleep、world、diary、provenance；保持旧 adapter |
| `src/workbench/select-at.ts` | 按同一游标选择各 artifact 版本 | 扩展到新 artifact 类型，继续禁止未来版本提前出现 |
| `src/workbench/adapters/` | 读取旧 pilot 和 observation 数据 | 增加 dialogue reader，不让旧记录伪装具备新元数据 |
| `web/workbench/` | 当前房间的基础布局、图与笔记 | 逐步加 world shelf、diary tab、bridge view、sleep diff |
| `primitives/` | v1 研究设计与参数生命周期 | 保留现有承诺；新参数另存为 v0.2 exploratory policy |

### 12.2 建议新增的最小模块

先保持同一应用中的小模块，体量不大时允许合并文件：

```text
src/memory/
  types.ts               # episode / world / patch / manifest
  store.ts               # immutable objects + atomic accepted pointer
  episode-index.ts       # source lookup, text search, graph projection
  context.ts             # exact context construction and budget accounting
  policy.ts              # decay, selection, strength, active capacity

src/consolidation/
  sleep.ts               # frozen inputs -> model proposal -> validation
  reducer.ts             # apply accepted semantic patch + policy delta

src/observation/
  dialogue-runner.ts      # new protocol; does not rewrite Set A history

src/workbench/adapters/
  dialogue-reader.ts

fixtures/memory-dialogue/
  synthetic-encounters/  # small public material with provenance/contradictions
  policy.json
```

这些是待创建的路径，本次只交付设计文档。Graphiti adapter 以后可以实现 `episode-index.ts` 后面的接口，不必先拆出一个独立仓库。

### 12.3 如何接续已有 Set A，而不制造历史

现有累计 notebook / graph 已混合具体经验与跨经验解释，不能简单把整个 notebook 重命名成 episodic memory，把同一个 graph 复制一份就叫 cortex。

推荐两个明确入口：

1. **新实验从空 v0.2 state 开始。** 最容易判断新机制带来的变化。
2. **保留一个 legacy seed。** 原 checkpoint 原样保存并标记 `legacy_mixed`；若运行一次转换，另记迁移调用、候选拆分和缺失来源，不回填成过去已经发生的 sleep。

旧节点的出处不能可靠推断时标记 `provenance_unknown`。不能因为它在 C4 出现就武断认定来自 E4：它也可能是更早经验的重新表达。

当前研究者保存的材料与历史 checkpoint 可以用于后验分析，但未经显式迁移不能成为新 agent 的隐形可读记忆。

## 13. 怎样验证这套设计有用

### 13.1 先确认机制确实按定义运行

第一批验收用合成 fixture 和 mock runtime，不需要先跑付费模型实验：

| 验收 | 应观察到什么 |
| --- | --- |
| 30/31 窗口 | E31 接受后，E02–E31 按 ID 原样可读；E01 全文对 subject 不可读 |
| 证据保留 | world / graph 引用能追溯到被提供的 span；缺失与 archive-only 状态明确 |
| replay 去重 | 同一来源重放十次，独立支持来源数不增加 |
| 幂等恢复 | 同一 sleep 崩溃重试不会二次衰减或重复追加 diary |
| 预算有效 | context / replay / active state 超额有明确处理记录，无隐性截断 |
| 写入原子性 | 模拟 diary 或 graph 校验失败，旧 accepted checkpoint 完整保留 |
| 反例与 scope | 同名不同角色不合并；观点并存不被当作事实更新自动清除 |
| 历史隔离 | 查询 E8 checkpoint 无法获得 E9 以后产生的摘要、关系或索引信号 |
| probe barrier | 插入 probe 不改变主状态及下一次 encounter 的输入 hash |
| UI 时间一致 | graph、notebook、world、diary 均不显示所选位置之后的版本 |

如果复用旧 A–B–A 检索干预，额外确认被 knockout 的边也从最终 context 移除；只禁止遍历某条边，不保证该边不会通过其他已选节点进入上下文。

### 13.2 Retrieval accuracy 与 representation change 分开测

| 目标 | 观察指标 | 解释边界 |
| --- | --- | --- |
| 近期可回溯 | 窗口内 source ID / span 读取成功率、hash 一致性 | 存储与访问契约 |
| 找到正确证据 | Recall@k、来源准确率、context 中证据覆盖率 | 检索质量 |
| 有据回答 | 细节答对且出处正确、缺信息时恰当表示不知道 | 包含检索与生成两环 |
| 形成跨经验解释 | 支持来源多样性、scope、反例保留、无依据泛化率 | 记忆生成质量 |
| 影响新经验 | 新情境解释/预测/行动的差异，以及移除相关记忆后是否改变 | 外部记忆的功能作用 |
| 可持续运行 | 活跃字节数、context tokens、sleep tokens、延迟、archive 增长 | 系统资源代价 |

近 30 次之外的细节遗漏，应记为 retention 制度的结果，和窗口内检索失败分开。冻结版或 Set A 的 full-context 回答结果，也不能直接充当新 selective retrieval 的准确率。

Transformation 至少需要后续新情境检验。仅看 diary 更连贯、图更稀疏、schema 更多，还不足以证明经验改变了行为。基础模型本来就可能会说出类似结论，现有 [baseline 观察](baseline-20260908.md) 也提示了这一点。

### 13.3 初期比较不需要一次做完整因子实验

先跑三个逐步增加机制的条件：

| 条件 | 内容 | 先回答什么 |
| --- | --- | --- |
| A | 相同 recent-30 与检索，关闭 sleep，world 保持初始状态 | 只有可检索经验时如何表现 |
| B | 相同 recent-30，加固定预算的均匀 replay + consolidation；关闭 decay/downscaling | 独立整理阶段能带来什么 |
| C | selective replay + consolidation + 提案中的 decay/downscaling | 整套有选择记忆政策的表现与代价 |

A→B 同时增加后台计算，不能单独归因于“consolidation 算法”；B→C 同时改变 selection 与 weakening，也不能单独归因于 forgetting。先将它们当体系比较，记录实际 compute。看到稳定现象后，再固定 replay 选择/预算，只比较 F0 无衰减、F1 时间衰减、F2 replay-protected 衰减。

还可以在**同一冻结 checkpoint**上分别提供 episodic-only、world-only、both、empty context，检查哪类记忆参与了回答。它是当次读出干预，不等于经历完全相同的独立发展轨迹。

短的 5-encounter Set A 足够看流程，不足以观察 30-window 退出或缓慢 downscaling。应先用跨过 30 的合成序列验证机械行为，再设计独立的真实材料 pilot。新 probe 和评分规则在分析前确定，存放在观察者一侧。

## 14. 推荐实施顺序

### 第一步：让经验可回溯，建立四个对象的边界

实现 episode store、recent-30、独立 notebook records、来源引用、world / diary 的空结构和版本 manifest。保持原 Set A 可运行。

**完成标志**：原文不再只能从累计 notebook 猜；第 31 次之后窗口行为明确；旧实验仍可原样浏览。

### 第二步：让记忆进入 context 的过程可见

实现原文/笔记检索、一跳关系扩展、context budget、精确输入日志。先不使用复杂 salience scorer；用固定公开 fixture 查找人名、数字、相似事件和冲突来源。

**完成标志**：能解释“有这条记忆却没答出来”发生在存储、检索、预算还是生成环节。

### 第三步：加入一个最小 sleep operator

按固定 encounter 数触发，一次模型调用产出 world patch 与 diary；通过 reducer 接受。先跑无衰减条件，再接入第 8 节的可开关规则。

**完成标志**：一次 sleep 的选材、输入、语义变化和数值变化都可以被重放检查；失败不污染已接受状态。

### 第四步：把循环放进房间

增加 world shelf、diary、sleep diff 和 bridge view。沿用现有时间游标和历史缺口说明；先展示已接受阶段，不承诺 token 级认知动画。

**完成标志**：从 world card 点回原始 encounter，再查看哪次 sleep 改了它，全程来源和时间一致。

### 第五步：依据检索结果决定是否接 Graphiti

当关系消歧、语义检索或数据规模确实超出本地简易实现，再增加 Graphiti adapter，并重新验证 namespace、历史快照、模型抽取记录和 probe 隔离。真正并发 sleep 与 Letta runtime 迁移留作独立阶段。

第一版暂缓脑波模拟、多 sleep stage、多 agent swarm、自动训练基础模型、无限可检索历史和让所有 schema 决定所有 attention。它们不是实现上述闭环的必要条件。

## 15. 已做出的设计选择与仍需校准的部分

本报告建议优先采用这些选择：**同一 runtime 两种调用角色；本地单一提交入口；recent-30 完整经验；分离具体经验与 world cards；有限 selective replay；外部参数控制 accessibility / strength；observer archive 与 agent memory 分开；房间界面显示真实版本与来源。**

仍需在实现/pilot 阶段校准：单份材料与笔记的容量、跨经验支持的判定、world card 粒度、中文检索分词、embedding 是否必要、sleep 频率及数值强度。它们应写入版本化 policy，而不是隐藏在 prompt 或 UI 配色中。

有关层级与参数冻结的项目约定，继续遵循 [Primitive design lifecycle](../primitives/README.md)。这份 v0.2 提案没有把尚未回答的 v1 研究设计问题替你定死。

## 16. 资料索引

### 本次阅读的项目资料

- 用户提供的两份讨论：睡眠/记忆综述串读，以及 Sleep-time Compute 与 hippocampus–neocortex dialogue 的比较。它们提供问题与方案线索，不作为外部实现已被验证的证据。
- [项目 README](../README.md)、[Set A 结果与运行协议](set-a-observation.md)、[encounter/probe barrier](encounter-probe-barrier.md)。
- [workbench contract](workbench-contract.md)、[workbench guide](workbench-ui.md)、[UI 设计愿景](../design.md)。
- 第 3、12 节链接或列出的对应源码；代码现状优先于较早设计文档中的未来计划。

### 论文与官方实现资料

1. Rasch & Born (2013), [About Sleep's Role in Memory](https://doi.org/10.1152/physrev.00032.2012)：encoding / consolidation、离线重激活。
2. Klinzing, Niethard & Born (2019), [Mechanisms of systems memory consolidation during sleep](https://www.nature.com/articles/s41593-019-0467-3)：replay、downscaling 背景与表征转化。
3. Moscovitch et al. (2016), [Episodic Memory and Beyond](https://www.annualreviews.org/content/journals/10.1146/annurev-psych-113011-143733)：episodic memory 的 transformation 视角。
4. Packer et al., [MemGPT](https://arxiv.org/abs/2310.08560)：分层管理有限 context。
5. Lin et al. (2025), [Sleep-time Compute](https://arxiv.org/html/2504.13171v1)：方法、实验边界与附录实现。
6. Letta (2026), [Context Repositories](https://www.letta.com/blog/context-repositories/)、[MemFS](https://docs.letta.com/concepts/memfs)、[Memory & dreaming](https://docs.letta.com/configuration/memory)：文件式记忆、版本与后台整理。
7. Letta (2026), [Context Constitution](https://www.letta.com/blog/context-constitution/)、[Evaluating Memory in Production Agents](https://www.letta.com/blog/evaluating-memory-in-production-agents/)：设计理念及 usage / generation 的评价划分；不将产品愿景当作认知能力证明。
8. Zep / Graphiti (2025), [A Temporal Knowledge Graph Architecture for Agent Memory](https://arxiv.org/html/2501.13956v1)：episode、semantic、community 和时间建模。
9. [Graphiti repository](https://github.com/getzep/graphiti)、[EntityEdge](https://github.com/getzep/graphiti/blob/main/graphiti_core/edges.py)、[search](https://help.getzep.com/graphiti/working-with-data/searching)、[custom types](https://help.getzep.com/graphiti/core-concepts/custom-entity-and-edge-types)、[namespacing](https://help.getzep.com/graphiti/core-concepts/graph-namespacing)：接口与实际建模参考。

外部页面核对日期均为 2026-09-17；GitHub `main` 与在线文档不是固定版本。开始接入依赖时应固定具体版本或 commit，重新跑 adapter 的验收，而不是把本文当作未经检查即可复制的 SDK 调用手册。
