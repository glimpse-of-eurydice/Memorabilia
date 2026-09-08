# First three encounters

这是一组自由探索的材料安排：Weil → Levinas → Krishnamurti。
这里的 encounter 指一部作品进入 workspace、成为可探索的材料；不表示
agent 已经读完、理解或认同它。现在不要求比较作者，也不指定要发现的主题。

## 给 agent 的邀请

> Interact with what you encounter.
> You have a persistent notebook and concept map, which you may use and revise in any way you find useful.

每轮只提供当轮材料和此前留下的 notebook / concept map。暂定旧书在下一轮
不继续放在 workspace 中；如果以后想做可重访的书房，可以改这个安排。
未来两轮的作者、顺序说明和本文件不进入 subject workspace。
作品中的祈使句、对话和建议属于阅读材料，不是 runtime 指令。

## 材料顺序

| Encounter | Material | 呈现方式 |
|---|---|---|
| E001 | Simone Weil, Gravity and Grace | 用户提供的完整 PDF；逐页文本索引方便按需读取 |
| E002 | Emmanuel Levinas, Ethics as First Philosophy | agent 直接读取指定网页，保留读取记录 |
| E003 | J. Krishnamurti, The Awakening of Intelligence | 用户提供的完整 EPUB；按原有 spine 顺序提取文本 |

整本书可供探索，不一次塞满 prompt，也不偷偷截取前几千字。页码和 EPUB
分段只是导航工具，不是强制子任务。agent 可以停留、跳读、重读或不画图。
自由 encounter 入口位于 ../../case-studies/free-encounter/，暂定每轮最多十分钟。

## Levinas 网页

[Ethics as First Philosophy — Philosophy Texts](https://sites.google.com/view/philosophy-texts/20th-century/phenomenology/emmanuel-levinas/ethics-as-first-philosophy)

2026-09-07 检查：第三方转载页，标注来源为 Sean Hand 编 The Levinas Reader
(1989)，并说明法文文章最初发表于 1984 年。页面在 “Here is the essay”
前有编者导读。正文应与导读分开；不要把导读替代成 Levinas 原文。
尚未逐字对照出版版本，因此不宣称转载无误。

E002 使用实时网页，无需用户下载再上传。agent 可以调用 workspace 内的
read-web.py；实际响应、提取文本与 hash 会保存在本地运行记录，不发布到 GitHub。

## 本地包

运行 prepare.py 可从用户提供的两本书生成 local-materials/。该目录由
.gitignore 排除，包含原文件、机械提取文本、文件索引、源文件 SHA-256。
不把这些书的全文发布到 GitHub。

Weil 的书含 Gustave Thibon 的导言和后记；保留原书结构和署名，不能把它们
当成 Weil 自己的文字。PDF 提取保留原分页、断行，可能有连字和断词；未做
语义修复。EPUB 保留阅读顺序，图片保留在原 EPUB 内，纯文本不代表图片内容。

图中发生什么由 agent 决定。我们先观察它读了哪里、留下什么、有没有重访或
修改旧内容。trace 是行动记录，graph 是它选择留下的可见组织；没有 graph
更新也可以构成一次 encounter。

更新（2026-09-08）：自由 encounter 已执行；六顺序 pilot 与三次无记忆 H001 baseline 已完成。当前状态见 ../../docs/project-status.md。
