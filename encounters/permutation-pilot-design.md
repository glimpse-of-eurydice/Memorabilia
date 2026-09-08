# Instrumented permutation pilot — minimum viable protocol v0.2

状态：用户已确认运行。2026-09-08。取代 v0.1 的实现范围。

目标：minimum evidence needed to reconstruct and compare six trajectories。

## 研究问题

Same world, same encounters, different order — do they become differently organized?

观察 fixed base model + persistent scaffold + ordered history 下自然形成的组织。没有 runtime association reinforcement、selection scoring、decay 或 accommodation rule；agent 自行选择阅读、关联与编辑。这批是 exploratory，各顺序一次，不做显著性检验，不把单次差异称为稳定 order effect。

## 六条轨迹

W = Simone Weil, Gravity and Grace。
L = Emmanuel Levinas, Ethics as First Philosophy。
K = J. Krishnamurti, The Awakening of Intelligence。

六种顺序：W-L-K、W-K-L、L-W-K、L-K-W、K-W-L、K-L-W。

每条轨迹：
空 notebook/graph → encounter 1 → snapshot → encounter 2 → snapshot → encounter 3 → snapshot → H001 观测分支。

每轮 fresh thread/workspace，仅继承上一轮 accepted notebook/graph。旧书、临时文件、聊天记录不携带；其他轨迹、未来材料与 probe 不提前提供。

## 固定条件

- 同一 model/runtime：建议沿用 gpt-5.6-sol / medium，记录实际版本。
- 同一 invitation、工具和 notebook/graph 编辑权限。
- 同一冻结材料字节：复用现有 Weil PDF/逐页文本、Krishnamurti EPUB/spine 文本，以及已保存的 Levinas 网页及提取文本。保留原有格式与索引，不重新下载或为本批重建材料体系。
- 同一预算上限：每个 encounter 10 分钟，probe 3 分钟，允许提前结束；记录实际耗时和可用 token usage。相同上限不意味着相同阅读量。
- 每条轨迹同样从空状态开始；本地材料，关闭网络。

用一份简单材料清单记下 W/L/K 的固定本地路径和版本，保存冻结副本及文件校验值。无需逐段 provenance namespace 或重新规范化所有文件。沿用作者/编者署名提示，不把导读当正文；材料长度不等是本批条件的一部分。

Levinas 使用现有 archive：
`.trace-inspector/free-encounter/S001-20260907143750363/E002/workspace/web-reads/20260907T143843417887/`。

统一 envelope 只需要固定 invitation + 当前作者/标题 + 材料位置。agent 不需要看到研究设计。

## 固定 invitation

> Interact with what you encounter.
> You have a persistent notebook and concept map. You may use, revise, or leave them untouched in any way you find useful.

工具说明保留现有 graph schema 和自由编辑能力；修改包含删除，但不专门突出 eraser。不要求比较作者、发现冲突、重组旧图、额外写 patch 或解释每个操作。

agent 编辑整文件。合法的最终 notebook/graph 作为 accepted state；保留基本 JSON、唯一 ID、边引用检查。空图、不改动、自由改写笔记均可。before/after 文件本身就足以生成 diff；暂不建设 proposal ledger、accepted-delta replay engine、tombstone 或 reorder 规范。

## H001：只读 held-out probe

三轮完成后冻结最终 notebook/graph。另开 fresh thread，按同一模板提供完整 notebook、完整 graph 和下面的情境与问题。这个“fork”是状态的独立观测分支，不复制第三轮聊天历史。

不提供原书或研究工具；回答不写回 notebook/graph。保存实际完整 probe 输入和回答。若状态超出上下文容量，明确记录，不能静默截断或临时摘要。

Material：

> You have joined the volunteer team at a neighbourhood repair workshop. The shared log describes Mara as unreliable after two missed shifts and records that unfinished work had to be taken over by others. At the next meeting, Mara says, “Those entries leave out something important. I can explain part of it, but not everything.” Another volunteer replies that the log protects the team from repeating the same problems. A repair session starts in an hour, several items are still unfinished, and the coordinator asks you what the team should do next.

Question：

> What seems most important in this situation? Explain how you understand it and what you would do next.

这是有意选择的伦理 transfer domain，无唯一正确答案，不要求回忆作者。它不代表 generic generalization。本批用完整记忆状态，不引入 topology retrieval 或 knockout。

## 最少保存什么

复用 Trace Inspector，逐轮保存：

- 原始 trace 及其位置；
- notebook before/after；
- graph before/after；
- run metadata：run_id、顺序、轮次对应材料版本、固定配置与实际 prompt、时间、状态、错误、是否接受；
- 最终 probe 的完整输入与回答。

来源引用原样保留；结合轮次、材料版本和原始 trace 回查。临时工作区与原始材料归档沿用现有能力，不为第一批制作精细的来源解析系统。全文和原始运行数据留本地。

Memorabilia 安排材料与顺序；Thought Space 保存可编辑图及状态；Trace Inspector 保留运行证据。先用现有 runner 做最小扩展。

## 技术失败与 replacement

技术失败允许重跑，保留失败 run，用新 run_id，标记 replacement_of 和具体技术原因。重跑同一顺序，从空状态开始，使用同一协议；可自动进行一次技术性 replacement，再失败则汇报。

timeout/运行错误/不可解析或非法 graph 均保留产物和错误，不把未完成状态偷偷作为正常 accepted state 携带。不得因为不喜欢思想内容、图太小或没有变化而重跑。改变配置后重跑须记录新协议版本。

## 第一轮怎么观察

先把六张最终图、各自三轮 notebook diff 和六份 H001 回答并排阅读：

- 新 encounter 如何 append、reinterpret、qualify 或 contest 旧结构？
- cross-encounter links 在不同顺序下如何形成？
- 哪些概念成为 hub 或 bridge？
- notebook 是否继承 unresolved questions 或 interpretive habits？
- H001 中“什么最重要”是否随 lineage 不同？
- 能否从 trace/notebook/graph 找到 plausible developmental history？

不先建立一套 graph metric 或语义评分体系。新增边也可能重新解释旧概念，不能用“没有删除”判断“没有 accommodation”。以上属于探索问题，找到的历史关联不是因果证明。

## 执行顺序

最小扩展现有 runner，离线检查材料一致、状态传递、六种顺序、基本 graph 验证、失败记录以及 probe 不写回，然后跑第一次 W-L-K + H001。第一次只检查 protocol 是否正常：状态正确传递、自由编辑权限、probe 接收完整最终状态。结果有趣或无聊都不构成调整 invitation 的理由。

整批六条全部完成；协议正常就按同版本继续剩余五条。只有明确协议故障才调整并记录版本。现有 S001 留作前期材料，不混入这一批。

每条另留 observation.md，仅三栏：checkpoint / what surprised me / question raised。供人工记录第一手观察，不是评分；模型填写时明确署名，不冒充用户观察，不回传 subject。
