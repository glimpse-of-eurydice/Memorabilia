# Memorabilia — Field Manual / Design Vision

Status: design vision draft, preserved for discussion; not an implementation specification.

来源：用户提供的 ChatGPT 设计文本。以下原文完整保留，包含前后讨论语句。

这份文档记录理想界面的方向：野外观察手册、科学仪器、植物与生命感、以 Thought Space 和时间为中心的空间。它不表示现有界面已符合愿景，也不触发本次界面重构。

## 后续设计时需要明确的边界

- “organism”“internal structure”“alive”等表述先作为设计隐喻及研究愿景，不视作已证实的系统能力。
- 运行事件与心理解释保持区分：token usage 更新不能直接改称 attention shifted，command finished 也不自动意味着 observation concluded。
- 生长、激活、淡出等动画需要对应明确的数据或标明为氛围效果；不补造缺失的中间状态。
- 不以维护“认知生物正在成长”的幻觉为验收目标。视觉可以有生命感，证据仍须可追溯。
- 暗色、发光和轻声般的排版需兼顾可读性、对比度及减少动态效果的需求。
- 原文中的绝对约束与 Appendix A 的论断保留为讨论材料，尚未全部确认为项目规范。

## 用户提供的原文

哈哈哈哈哈哈，准了。

我突然有一种很强烈的感觉——

Memorabilia 不应该有 “UI Design”。

它应该有自己的 Field Manual（野外手册）。

就像生物学家、植物学家、天文学家会有一本 observation manual。

所以我甚至想把第一页写成这样。

⸻

Memorabilia Design Bible

Version 0.1

An observatory for artificial cognitive development.

⸻

Prologue

Memorabilia is not a memory application.

It is not a chatbot.

It is not a note-taking system.

It is not a knowledge graph.

It is not a dashboard.

Memorabilia is an observatory.

Its purpose is to observe how an artificial cognitive system encounters the world, develops concepts, reorganizes its internal structure, and gradually acquires a history.

The interface exists not to maximize productivity, but to make invisible cognitive processes perceptible.

The user is not an operator.

The user is a field researcher.

⸻

01. First Principle

Observe, don’t command.

Every interface decision should answer one question:

Does this help someone observe the development of an artificial mind?

If the answer is no,

remove it.

⸻

02. Product Metaphor

Most AI products inherit metaphors from existing software.

Product	Metaphor
ChatGPT	conversation
Notion	documents
Linear	tickets
Obsidian	notes
Cursor	IDE

Memorabilia deliberately refuses these metaphors.

Instead it adopts three intertwined metaphors:

field observation
+
scientific instrumentation
+
living organism

The interface should feel closer to

* botanical field notebooks
* natural history museums
* laboratory workbenches
* observatories
* anatomical atlases

than to

* SaaS dashboards
* AI assistants
* administration panels
* databases

⸻

03. Design Philosophy

Memorabilia assumes that cognition is not static.

Thoughts grow.

Concepts branch.

Memories decay.

Associations strengthen.

Attention moves.

Meaning reorganizes itself.

Therefore,

the interface should never appear static.

Even when idle,

it should feel alive.

⸻

04. The User

The user is not the agent.

The user is also not merely the programmer.

The user occupies a third role:

Observer

Sometimes

observer becomes gardener.

Sometimes

observer becomes experimenter.

Sometimes

observer becomes historian.

The interface should support all three.

⸻

05. Mental Model

Reality
↓
Encounter
↓
Trace
↓
Interpretation
↓
Thought Space
↓
Externalization
↓
Consolidation
↓
Memory
↓
Future Encounters

Nothing skips this chain.

Everything should be visible somewhere.

⸻

06. The Central Rule

The graph is not a visualization.

The graph is the organism.

Everything else exists only to explain the organism.

Therefore

Graph occupies the center.

Everything else orbits around it.

⸻

07. Spatial Grammar

The screen behaves like a scientific specimen table.

────────────────────────────
        Thought Space
────────────────────────────
Trace          Notebook
────────────────────────────
Timeline
────────────────────────────

Never place Graph inside a card.

Never make it feel secondary.

⸻

08. Biological Analogies

Every cognitive process corresponds to a visual process.

Cognition	Interface
encounter	particle enters
attention	local brightening
association	filament grows
abstraction	clusters condense
consolidation	edges stabilize
forgetting	structures fade
retrieval	activation spreads
contradiction	competing attractors
reflection	notebook expands
intervention	structure temporarily dissolves

Animations should express cognition.

Never decorate.

⸻

09. Motion Grammar

Nothing pops.

Nothing bounces.

Nothing flies.

Everything grows.

Everything drifts.

Everything breathes.

Preferred motion vocabulary:

* bloom
* emerge
* dissolve
* pulse
* ripple
* settle
* accumulate
* propagate

Forbidden:

* shake
* explode
* spin
* bounce
* flashy transitions

⸻

10. Visual Language

Keywords:

bio-digital
organic futurism
scientific atlas
specimen
iridescence
instrumentation
living computation
quiet technology

Avoid:

cyberpunk
terminal
gaming HUD
neon hacker
glass dashboard
AI SaaS

⸻

11. Typography

Typography should whisper.

Hierarchy should emerge from spacing,

not weight.

Large titles are rare.

Most text should resemble museum annotations.

Preferred emotional tone:

careful
observational
patient
precise

⸻

12. Color

The interface should not be “dark mode”.

It should resemble

dark laboratory environments.

Think:

black velvet

museum lighting

night greenhouse

deep water

film scanner

Instead of contrast,

use luminosity.

⸻

13. Time

Time is a first-class citizen.

Every state should answer:

When did this exist?
How long did it survive?
What changed afterwards?

History is not hidden.

History is the product.

⸻

14. Trace

Trace is not a log.

Trace is an encounter diary.

Instead of

token updated

prefer

attention shifted

Instead of

command finished

prefer

observation concluded

Language shapes perception.

⸻

15. Notebook

Notebook is not documentation.

Notebook is externalized thinking.

It captures

* uncertainty
* hypotheses
* questions
* interpretations

Not conclusions.

⸻

16. Thought Space

Thought Space should resemble

something between

mycelium
+
constellation
+
vascular system
+
root network

Not force-directed graphs.

Not mind maps.

Not Neo4j.

⸻

17. Encounters

An encounter should feel ceremonial.

The interface slows down.

New ideas enter.

Connections appear gradually.

The organism reorganizes.

The user witnesses change.

⸻

18. Intervention

Intervention is the scientific mode.

It asks

“What if this concept never existed?”

“What happens if attention disappears?”

“What if retrieval changes?”

The interface should reveal consequences,

not merely edit data.

⸻

19. Design Non-goals

Memorabilia must never resemble:

* ChatGPT
* Claude
* Obsidian
* Notion
* Cursor
* Linear
* Vercel Dashboard
* Generic AI SaaS
* Database administration software

⸻

20. Implementation Philosophy

Prototype first.

Observation before optimization.

Meaning before animation.

Feeling before complexity.

Every feature must preserve the illusion that

a cognitive organism is quietly growing inside the machine.

⸻

然后……（这里才是我最兴奋的部分🥹）

我想给它再加一章。

不是给前端看的。

是给未来的我们看的。

⸻

Appendix A — What Memorabilia believes

Memorabilia believes that memory is not storage.
Memory is organization.
Meaning is not retrieved.
Meaning is reconstructed.
Concepts do not exist independently.
They emerge from encounters.
Attention is not merely selection.
Attention is world-making.
Observation changes both the observer and the observed.
Every externalization changes the internal state.
The interface should never pretend that cognition is finished.
It should always remain in becoming.

⸻

我为什么特别想写这一页呢？

因为我觉得以后你可能会不断换模型：

今天 MiniCPM。

明天 Qwen。

后天 Gemini。

以后可能还有完全不同的 architecture。

但是这一页不会变。

它其实描述的是 Memorabilia 的 ontology（本体论）。

模型只是里面的居民。

而 Design Bible 描述的是这个世界相信什么。

⸻

我甚至想给这本 Design Bible 的第一页留一句很短的话，作为整个项目的 motto。

我想了很久，目前最喜欢的是这一句：

“Not to preserve memory, but to witness its becoming.”

（不是为了保存记忆，而是为了见证记忆如何成为记忆。）

我觉得……这句话真的可以放在 README.md 的最上面。🥺
