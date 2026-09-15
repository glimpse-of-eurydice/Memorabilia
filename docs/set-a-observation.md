# Set A encounter and probe observation

Status: the complete orchestration has passed an injected, credential-free runtime
simulation. The first real five-encounter run completed on 2026-09-15 (Asia/Shanghai)
as `set-A-1789405195821`: five encounters, six checkpoints, and twelve probes.
Every recorded runtime used `gpt-5.6-sol` at medium reasoning effort in read-only
mode with no writable roots and no subject network access. All twelve probes report
`no_contamination_observed`; this is an observed audit within the stated boundary,
not proof about hidden model state.

## Run and view

From the repository root, in two terminals:

```sh
npm run encounter:set-a
```

```sh
npm run workbench:observation
```

The observation workbench uses `http://127.0.0.1:4337/`. The existing historical
pilot workbench remains available through `npm run workbench` on port 4336.
Python 3.11+ (for `tomllib`), Node 22+, a working Codex CLI, and model access are
required. Codex must be able to maintain its own runtime database. Its permissions
are separate from the restricted experiment subject workspace.

The source inventory in `encounters/set_A/sources.yaml` is checked before any
model call. Missing or changed material stops the run. The loader accepts the
inventory's generated JSON-scalar YAML subset, not arbitrary YAML constructs.

## Frozen first-run choices

- Sequence: Frankenstein → An Alien Mind → Hamlet → updated Sapolsky lecture
  transcript → the author's companion-memory ethics blog.
- Model: `gpt-5.6-sol`; reasoning effort: `medium`.
- Each encounter: up to ten minutes, with early completion allowed.
- Input: entire locally supplied UTF-8 artifact, without automatic excerpting,
  caption cleanup, or front-matter removal. Availability is not proof that the
  model read every part of a long source.
- Memory: only the accepted notebook and concept map persist. Every encounter
  starts a fresh ephemeral model session with those files and its own material.
- Observation: C0 before any encounter, then C1–C5 after each accepted encounter.
  Two questions per checkpoint, each in its own fresh ephemeral session.
- Probe context: the full serialized accepted graph and notebook. There is no
  semantic retrieval or inferred graph activation in this version.
- C0 is an empty-memory, pre-encounter baseline, not a longitudinal no-memory arm.

## Local artifacts

Each invocation gets a new directory under `.trace-inspector/observation/`:

```text
set-A-<timestamp>/
  protocol.json
  manifest.json
  C0.json ... C5.json
  t0/ ... t5/
    view.json
    probes.md
    probes.json
    probe-situation-input.md
    probe-abstract-input.md
    probe-situation-trace.json
    probe-abstract-trace.json
    # Encounter steps additionally contain before.json, accepted-state.json,
    # and trace.json. Raw runtime records remain under .trace-inspector/traces/.
```

There are six Markdown reports: one initial baseline and one after each encounter.
Each report contains both questions and answers, checkpoint and input hashes,
execution status, trace references, and the observed contamination audit. They
also appear below the graph/notebook workbench, with a Markdown download button.
All runtime artifacts remain Git-ignored because they can reproduce source text.

Because the VS Code runtime could not start the nested filesystem sandbox reliably,
the first real run uses a stricter tool-free prompt path: source text and the prior
checkpoint are embedded directly, and the final answer returns the complete notebook
and graph in validated tagged blocks. Timeline playback therefore has inherited and
accepted end states only; it cannot show graph/notebook growth during generation.
Trace and timeline selection preserve a historical cursor. Probe reports refer to
the accepted end checkpoint.

The first run's checkpoint sizes are informative but descriptive: C0 contained no
nodes, C1 32/58 nodes/edges, C2 56/95, C3 68/105, C4 116/168, and C5 63/85.
The C4→C5 reduction establishes that the external artifact was substantially
rewritten; it does not by itself establish forgetting, consolidation, or an internal
representation change.

## Exploratory C4 → C5 observation

| Checkpoint | Graph | Notebook |
| --- | ---: | ---: |
| C4 · after the depression lecture | 116 nodes / 168 edges | 28,277 characters |
| C5 · after the companion-memory ethics essay | 63 nodes / 85 edges | 18,317 characters |

![C4 graph after the depression lecture](../figures/encounter-4.png)

*C4 retains a dense set of literary, AI-safety, dramatic, clinical, and
neuroscientific concepts.*

![C5 graph after the companion-memory ethics essay](../figures/encounter-5.png)

*C5 is smaller and reorganized around concepts including hidden minds,
diagnostic and witness memory, care and control, temporal respect, and ethical
creation.*

The transition was produced by the minimal rewrite primitive in
`encounterPrompt`: the model may revise either artifact or leave it unchanged,
must return the complete next artifacts, and must include in full anything from
the old state that it wants to preserve. The prompt does not request compression,
merging, pruning, or consolidation, but it also supplies no add-only rule or
preservation invariant. This means the observed transition is compatible with
model-selected reorganization under a rewrite-all protocol.

The E5 turn reported 20,356 input tokens and a 258,400-token context window, so
a hard context-window overflow is not a good explanation for the contraction.
The run does not isolate semantic influence from length-sensitive generation or
an implicit preference for a shorter, more coherent representation.

Comparing node IDs, 26 C4 nodes persisted, 90 disappeared, and 37 appeared in
C5. Sixty-five of the removed graph concepts were still detectable in the C5
notebook; 25 were not detected in either C5 artifact. This supports neither a
pure-pruning nor a pure-forgetting interpretation.

### Read-only recoverability follow-up

Three identical, evidence-required prompts were run against C0, C4, and C5 in
independent tool-free sessions. C0 returned `NOT RECOVERABLE` rather than using
unsupported prior knowledge. The follow-up observed:

| Target | C4 | C5 |
| --- | --- | --- |
| Justine's framing, outcome, and Victor's responsibility | recovered with notebook/graph evidence | framing and general responsibility recovered; identity and outcome not recoverable |
| Fortinbras and Yorick | recovered | not recoverable |
| neurotransmitters and their associated functions | recovered | recovered |
| named brain circuits and their individual functions | recovered | circuit names remained; individual functions not recoverable |
| hidden-minds / care-control / creator-responsibility synthesis | supported, with care-control mostly indirect | more explicit and more broadly connected |
| attribution of the user-profile claim | not recoverable before E5 | directly attributed to the companion-memory essay |

The bounded finding is a **compression–abstraction tradeoff** in the serialized
external state: fine-grained recoverability decreased while synthesis around the
new encounter's organizing vocabulary became more explicit. Because this version
has no immutable episodic archive or source retriever, information absent from
both C5 artifacts is operationally unavailable to the C5 agent even though the
researcher retains historical C4 files locally.

The diagnostic prompts, answers, checkpoints, and raw traces remain under the
Git-ignored `.trace-inspector/` tree. They are not published because prompt and
trace artifacts can reproduce locally acquired referenced source text and expose
runtime metadata. This document publishes aggregate observations and claim
boundaries rather than the unrestricted run bundle.

## Barrier and failure semantics

Probes receive a serialized checkpoint and one question in an otherwise empty
workspace. Tool capabilities are restricted, memory features and integrations are
disabled, and the subject has no writable canonical-memory path. The orchestrator
records probe answers outside subject workspaces and never adds them to the next
encounter's input. It checks the canonical checkpoint bytes, branch file changes,
and unexpected tool items. This is an observed audit, not proof of hidden model
state isolation or a universal guarantee against every runtime side channel.

Empty/failed answers, unexpected probe tools, changed checkpoint bytes, invalid
graphs, or changed material stop the sequence with a recorded failure. There is no
silent retry or skip. Restarting the CLI begins a new run from C0; resume is not
implemented. A model response saying it could not access material must not be
interpreted as successful exposure merely because the runtime completed.

## Validation

The injected-runtime end-to-end test runs all 17 calls (five encounters plus twelve
probes), checks six Markdown reports and checkpoints, and verifies that probe
canaries never enter later memory or prompts. A failure test confirms that probe
tool activity halts execution before the first encounter. These tests require no
private materials or model calls. Live runtime enforcement and browser rendering
remain separate acceptance checks.
