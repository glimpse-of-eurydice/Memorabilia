# Thought Space v0 Implementation Plan

## 0. Status and purpose

This document defines the first runnable Thought Space demo.

The purpose of v0 is not to demonstrate human-like cognitive development, discover the final primitive set, or establish that an external graph corresponds to a model's internal semantic schema. The purpose is to build and verify one complete developmental loop:

```text
configured environment and primitive seed
                  ↓
              encounter
                  ↓
     research and externalization
                  ↓
       proposed graph changes
                  ↓
    persistent Thought Space state
                  ↓
 state-conditioned retrieval and use
                  ↓
          probe / intervention
                  ↺
```

The unit of analysis is the developing system composed of:

```text
base model
+ environment and tools
+ externalization protocol
+ primitive layer
+ persistent Thought Space
+ retrieval mechanism
+ encounter history
```

---

# 1. v0 research and engineering goals

## 1.1 Primary engineering goal

Run a sequence of encounters from configuration without changing application code, while preserving enough evidence to reconstruct:

1. what the agent encountered;
2. what it explicitly attended to or articulated;
3. how its persistent Thought Space changed;
4. whether the resulting organization affected subsequent retrieval and behavior.

## 1.2 Primary v0 research question

> Can an agent-authored external knowledge organization persist across encounters and exert a traceable influence on later retrieval and research behavior?

This is deliberately narrower than asking whether higher-order cognitive organization emerges.

## 1.3 Secondary v0 question

> Can the same pipeline be rerun with a different primitive configuration or encounter ordering without modifying the pipeline implementation?

## 1.4 v0 success criteria

v0 is complete when one command can:

- load an environment, primitive seed, encounter sequence, and run budget from configuration;
- run at least six encounters in a clean workspace;
- record Encounter Trace and Externalization Trace through Trace Inspector;
- accept validated graph patches authored by the agent;
- save an immutable Thought Space snapshot after every encounter;
- use graph topology, rather than node text alone, in at least one later retrieval;
- record the exact retrieval path and context supplied to the model;
- run one deterministic or exact-match probe;
- perform one edge knockout and reinstatement test;
- replay the full trajectory through a linked user interface;
- rerun the same experience sequence under a second primitive configuration.

The linked interface connects the runtime timeline to Thought Space snapshots. It does not require that both systems share one backend.

---

# 2. Scope boundaries

## 2.1 Included in v0

- one base model;
- one researcher-like agent;
- one configured study environment;
- text-normalized encounter materials;
- explicit research notes and self-explanation;
- agent-authored nodes, edges, clusters, and relation labels;
- deterministic validation and application of graph patches;
- primitive configuration through a versioned config file;
- temporal snapshots and replay;
- graph-conditioned retrieval;
- one retrieval probe;
- one intervention and reinstatement sequence;
- two small primitive conditions.

## 2.2 Explicitly excluded from v0

- claims about the model's hidden internal cognition;
- real-time multi-day autonomous development;
- a literal two-hour exploration session;
- unrestricted browsing of the open web;
- autonomous consumption of raw YouTube video;
- values, identity, taste, or consciousness;
- self-modifying executable learning code;
- automatic discovery and validation of arbitrary organizational motifs;
- multi-agent development;
- production authentication or hosted deployment.

---

# 3. Important configuration distinctions

The initial config should distinguish four concepts that are easy to mix together.

## 3.1 Environment

The environment describes where the agent is and what it can access.

Examples:

- a study;
- bookshelves;
- a notebook;
- index cards;
- a concept-map surface;
- search or browsing tools;
- a clock and activity budget.

The study and stationery are not themselves cognitive primitives. They are environmental affordances and externalization tools.

## 3.2 Primitive seed

The primitive seed defines minimal persistent update and selection mechanisms.

Possible v0 primitives:

- association reinforcement;
- persistence and decay;
- bounded attention or selection;
- context-sensitive activation.

The config determines which mechanisms are enabled and their parameters. Their implementation is provided by the runtime.

## 3.3 Externalization protocol

This specifies what the agent is asked to produce after an encounter.

Examples:

- free research note;
- explicit self-explanation;
- graph-patch proposal;
- uncertainty report;
- proposed organizational hypothesis.

Externalization should eventually become an ablation axis of its own, but v0 uses one fixed explicit-research condition.

## 3.4 Developmental schedule

This specifies when new information is available and when the agent may only reorganize existing material.

v0 should use logical phases and step budgets rather than wall-clock hours:

```text
encounter phase      receive one new material
research phase       inspect and take notes
externalize phase    propose graph changes
consolidate phase    apply persistence/decay/update rules
probe phase          optionally test organization-in-use
```

Later versions can compose these phases into a simulated day:

```text
exploration window
→ closed-library organization window
→ offline consolidation / dream window
```

---

# 4. Proposed configuration

Use one human-editable YAML file per experimental condition and separate material manifests for the experience sequence.

```yaml
schema_version: "0.1"

run:
  id: "study-association-persistence-order-a-r1"
  random_seed: 17
  model: "MODEL_ID"
  model_parameters:
    temperature: 0
  max_encounters: 6

environment:
  name: "the-study"
  description: >
    You are a researcher working in a quiet study. You can read supplied
    materials, write research notes, maintain index cards, and update a
    persistent concept map.
  affordances:
    - research_notebook
    - index_cards
    - concept_map
  external_access:
    mode: "fixture_only"
    network_enabled: false

schedule:
  clock: "logical_steps"
  per_encounter:
    research_turns: 1
    externalization_turns: 1
    consolidation_steps: 1
  post_encounter_probe: true
  offline_consolidation:
    enabled: false

primitive_seed:
  id: "association-persistence-v0"
  attention:
    enabled: true
    max_active_nodes: 8
  association:
    enabled: true
    coactivation_increment: 1.0
  persistence:
    enabled: true
    reactivation_increment: 0.25
  decay:
    enabled: true
    rate_per_encounter: 0.05
  context_activation:
    enabled: false

externalization:
  mode: "explicit_research"
  require_research_note: true
  require_graph_patch: true
  allow_new_relation_labels: true
  allow_cluster_proposals: true
  allow_executable_rule_changes: false

thought_space:
  snapshot_after_each_encounter: true
  retain_rejected_proposals: true
  graph_patch_validation: "strict"

retrieval:
  mode: "graph_traversal"
  seed_selection: "query_similarity"
  max_seed_nodes: 2
  max_hops: 2
  top_k: 5
  context_token_budget: 1200
  log_candidate_nodes: true
  log_traversal_paths: true

experience:
  manifest: "fixtures/experiences/research-sequence-a.yaml"

probes:
  manifest: "fixtures/probes/v0-retrieval-probes.yaml"

instrumentation:
  trace_inspector:
    enabled: true
    trace_id_prefix: "thought-space-v0"
```

All values above are provisional engineering defaults, not theoretical commitments.

---

# 5. The four-layer architecture

## Layer 1 — Encounter Trace

### Question

> What did the developing system receive and under what conditions?

### Owner

Trace Inspector owns runtime collection and evidence replay. Thought Space supplies domain metadata.

### Minimum record

```yaml
encounter_id:
run_id:
sequence:
material_id:
material_type:
normalized_content_hash:
content_presented_to_agent:
active_context:
active_goal:
available_tools:
state_snapshot_before:
started_at:
completed_at:
```

### v0 material types

Normalize every material to a textual encounter envelope:

```yaml
material_id: "paper-003"
type: "article"
title: "..."
source: "local_fixture"
content: "..."
metadata: {}
```

A book may be represented by a selected chapter or excerpt. A YouTube video may be represented by a frozen transcript plus metadata. Live book parsing, web browsing, and video transcription are ingestion adapters for later versions, not part of the cognitive loop.

## Layer 2 — Externalization Trace

### Question

> What did the agent explicitly attend to, articulate, and propose?

### Owner

The agent authors the content. Trace Inspector preserves it as model-reported evidence.

### Required output

```yaml
research_note:
attention_report:
questions_or_uncertainties:
graph_patch_proposal:
organization_hypotheses:
```

`attention_report` is a report produced by the agent. It must not be described as direct observation of model attention weights.

## Layer 3 — Developed Thought Space

### Question

> Which proposed structures became part of persistent developmental state?

### Owner

The agent proposes graph changes. The Thought Space state engine validates, applies, versions, and renders them.

### Evidence sequence

```text
agent articulation
→ proposed patch
→ validation result
→ accepted/rejected operations
→ primitive-generated updates
→ immutable snapshot
```

### Minimum node model

```yaml
node_id:
label:
kind:
summary:
created_at_encounter:
last_activated_at_encounter:
activation:
persistence:
provenance:
status:
```

### Minimum edge model

```yaml
edge_id:
source:
target:
relation_label:
weight:
created_at_encounter:
last_activated_at_encounter:
provenance:
status:
```

### Graph operation vocabulary

```text
add_node
update_node
activate_node
deactivate_node
add_edge
update_edge
strengthen_edge
weaken_edge
remove_edge
propose_cluster
merge_nodes
split_node
```

For v0, `merge_nodes` and `split_node` may be recorded but rejected as unsupported. This preserves the proposal without pretending the runtime already implements it.

## Layer 4 — Organization-in-Use

### Question

> Did the persistent graph alter what the system retrieved or did next?

### Owner

Thought Space performs retrieval and probes. The model consumes the resulting context. Trace Inspector may display linked events but does not calculate retrieval.

### Required retrieval record

```yaml
retrieval_id:
query:
state_snapshot_id:
state_hash:
retrieval_mode:
candidate_nodes:
seed_nodes:
traversed_edges:
path_scores:
selected_nodes:
rejected_nodes:
final_context:
final_context_hash:
```

### Required behavioral link

Every model call using Thought Space must record both:

- the exact snapshot used; and
- the exact graph-derived context supplied.

This prevents the UI graph from becoming disconnected from the agent's actual computational path.

---

# 6. Graph authorship and primitive effects

The graph is agent-authored but not agent-self-certified.

## 6.1 Agent-authored content

The agent may decide:

- which concepts deserve bubbles;
- which relationships are worth expressing;
- how relations should be named;
- whether a cluster may exist;
- whether previous understanding needs revision;
- which parts of the graph it wants to revisit.

## 6.2 Runtime-owned invariants

The runtime decides:

- whether a patch is syntactically valid;
- whether referenced nodes exist;
- how IDs and provenance are assigned;
- how configured reinforcement and decay are applied;
- which snapshot is authoritative;
- how interventions are executed;
- what is supplied during graph traversal.

## 6.3 Structural novelty versus operator novelty

v0 permits structural novelty: new arrangements formed using available operations.

v0 may record but does not execute operator novelty: an agent-proposed new learning or retrieval rule.

```text
new edge, relation label, or cluster
    → allowed structural proposal

new executable rule that changes future update logic
    → record as organization hypothesis
    → do not execute automatically in v0
```

This lets the project observe candidate emergent organizational strategies without granting unrestricted self-modifying code.

---

# 7. The v0 encounter lifecycle

Each encounter follows the same state machine.

## Step 0 — Load state

- load the run config;
- load the latest immutable Thought Space snapshot;
- verify configuration and schema versions;
- start or link a Trace Inspector trace.

## Step 1 — Present encounter

- load one frozen material;
- construct the encounter envelope;
- record material hash and pre-encounter snapshot;
- give the material and current research task to the agent.

## Step 2 — Research

- allow one bounded research turn;
- permit reading existing Thought Space context;
- do not introduce additional external material in v0;
- preserve the model response and runtime events.

## Step 3 — Externalize

- request a research note;
- request explicit uncertainties;
- request a structured graph-patch proposal;
- save the proposal before validation.

## Step 4 — Validate and update

- validate graph operations;
- reject invalid operations with explicit reasons;
- apply accepted agent-authored operations;
- run configured primitive updates;
- write a `StateDelta`;
- create an immutable snapshot.

## Step 5 — Retrieve and probe

- issue a scheduled probe or the next research query;
- select seed nodes;
- traverse learned topology;
- save the complete retrieval path;
- construct bounded graph-derived context;
- record the downstream response and score.

## Step 6 — Close encounter

- link runtime events, externalization, graph delta, snapshot, retrieval, and probe;
- update the run ledger;
- proceed to the next encounter.

---

# 8. Consolidation and the simulated-day question

The proposed two-hour exploration period is conceptually interesting but premature for v0.

Wall-clock duration creates several uncontrolled quantities:

- model/API speed;
- number of tool calls;
- token consumption;
- network latency;
- amount of material encountered;
- opportunity for repeated self-prompting.

For v0, use equal logical budgets instead:

```text
one frozen material
+ one research turn
+ one externalization turn
+ one consolidation step
```

This preserves the conceptual distinction between taking in information and reorganizing existing information.

After the closed loop works, introduce schedule as an ablation:

```text
Condition S0
encounter → immediate update → next encounter

Condition S1
encounter → explicit organization period → next encounter

Condition S2
several encounters → closed-library consolidation → next day
```

A future `dream` phase should initially mean offline recombination of existing stored material under a fixed operation budget. It should not silently introduce new web content.

---

# 9. Initial demo scenario

## 9.1 Environment

A quiet research study with:

- a research notebook;
- index cards;
- a persistent concept-map surface;
- a shelf containing only the currently released materials;
- no open internet during v0.

The scene can be described narratively to the agent, but all functional affordances must map to explicit operations.

## 9.2 Research task

Use a narrow question that naturally contains repetition, contrast, and one contradiction. For example:

> Under what conditions can an external memory system be said to participate in an agent's reasoning rather than merely store information?

## 9.3 Six-encounter sequence

1. A short explanation of external memory as storage.
2. A case where retrieved notes improve later task performance.
3. A text about cognitive offloading or external representation.
4. A contrasting case where a visible graph is never used by the agent.
5. A repeated but differently framed discussion of functional dependence.
6. A contradiction or challenge to the agent's current organization.

Materials should be frozen local fixtures. Their purpose is to exercise the pipeline, not support publication-level conclusions.

## 9.4 Primitive conditions

Start with two configurations:

```text
P0: agent-authored graph only
    no automatic reinforcement or decay

P1: agent-authored graph
    + coactivation reinforcement
    + simple per-encounter decay
```

This tests config replaceability without requiring a theoretically mature primitive taxonomy.

---

# 10. v0 probe and intervention

## 10.1 Retrieval probe

Construct the experience sequence so that cue A repeatedly develops a relation with target B, while distractor C has similar surface vocabulary but no learned graph path from A.

Probe:

```text
Given cue A, retrieve one prior idea most relevant to the research question.
```

Primary measures:

- whether B appears in top-k retrieval;
- rank of B;
- graph path used to reach B;
- whether B entered the final model context.

## 10.2 ABA intervention

```text
A1 baseline
learned edge A—B present
→ run retrieval and probe

B knockout
disable A—B without deleting provenance
→ rerun the same retrieval and probe

A2 reinstatement
restore exactly A—B
→ rerun the same retrieval and probe
```

Also remove one unrelated matched-weight edge as a sham intervention.

The v0 claim is limited to functional dependence within this implemented scaffold. It is not a claim about the model's hidden representations.

---

# 11. Trace Inspector integration

Trace Inspector remains the observability layer rather than the Thought Space state engine.

## 11.1 Trace Inspector owns

- raw Codex runtime events;
- normalized runtime timeline;
- model messages and tool calls;
- externalization responses;
- trace replay;
- evidence inspection;
- run-level comparison.

## 11.2 Thought Space owns

- graph-patch schema and validation;
- persistent graph state;
- primitive updates;
- snapshots;
- graph traversal;
- retrieval context construction;
- probes and interventions.

## 11.3 Shared run bundle

```text
.thought-space/runs/<run-id>/
├── run-manifest.json
├── encounters.jsonl
├── externalizations.jsonl
├── graph-proposals.jsonl
├── state-deltas.jsonl
├── snapshots/
├── retrievals.jsonl
├── probes.jsonl
├── interventions.jsonl
└── trace-link.json
```

`trace-link.json` identifies the associated Trace Inspector trace without copying raw runtime evidence into the Thought Space store.

## 11.4 UI integration

The first UI need only support:

- a chronological encounter list;
- links to corresponding Trace Inspector events;
- the selected pre/post graph snapshots;
- accepted and rejected graph operations;
- retrieval traversal highlighting;
- intervention state;
- replay forward and backward through snapshots.

The graph view visualizes agent-authored organization. Rendering mechanics such as collision avoidance, zoom, and animation are deterministic UI behavior rather than cognitive claims.

---

# 12. Implementation milestones

## M0 — Contracts and fixtures

Deliverables:

- config schema;
- encounter-material schema;
- externalization schema;
- graph-patch schema;
- state-delta and snapshot schema;
- retrieval/probe schema;
- six frozen encounter fixtures;
- one probe fixture.

Exit test:

- all examples validate;
- invalid graph references are rejected with stable errors.

## M1 — Layers 1 and 2

Deliverables:

- single-encounter runner;
- Trace Inspector trace linkage;
- research-note capture;
- structured graph-patch proposal capture;
- provenance linking encounter → externalization → proposal.

Exit test:

- one encounter can be replayed from raw input to proposed graph patch.

## M2 — Layer 3

Deliverables:

- graph validator;
- state reducer;
- primitive interface;
- P0 and P1 primitive configs;
- immutable snapshot store;
- temporal graph viewer.

Exit test:

- six prerecorded proposals deterministically rebuild the same final snapshot;
- changing the primitive config changes only primitive-generated deltas.

## M3 — Layer 4

Deliverables:

- graph traversal retrieval;
- full retrieval-path logging;
- bounded context builder;
- deterministic probe scorer;
- edge knockout, sham, and reinstatement operations.

Exit test:

- the sentinel edge test passes without an LLM;
- selected retrieval context matches the recorded path and snapshot.

## M4 — Closed-loop run

Deliverables:

- encounter state machine;
- six-encounter end-to-end run;
- run ledger;
- failure recovery from the latest completed encounter;
- linked runtime and graph replay.

Exit test:

- a fresh run completes from config with no manual state edits.

## M5 — Minimal ablation demo

Deliverables:

- same experience × P0/P1;
- same primitive × order A/order B;
- summary of graph and retrieval differences;
- blinded run labels in exported review artifacts.

Exit test:

- all four conditions run through identical code paths;
- config and encounter order are the only declared changes;
- uncontrolled runtime differences are recorded.

---

# 13. Tests required before calling v0 complete

## Schema and state tests

- invalid node and edge references are rejected;
- every accepted operation preserves encounter provenance;
- snapshot hashes are stable;
- event replay reconstructs the same state;
- unsupported operations remain visible as rejected proposals.

## Primitive tests

- disabling a primitive prevents its deltas;
- decay occurs exactly once per configured consolidation step;
- agent-authored and primitive-generated changes are distinguishable;
- primitive order of application is fixed and recorded.

## Retrieval tests

- topology can retrieve a node that vector similarity alone would miss;
- max-hop and top-k limits are respected;
- final context hashes match the actual model input;
- node-only, topology, and knockout modes are distinguishable in logs.

## Intervention tests

- knockout changes only the targeted active topology;
- underlying provenance is retained;
- reinstatement restores exactly the prior edge state;
- sham intervention is supported.

## Trace tests

- every encounter links to one externalization and one post-state snapshot;
- model-reported content is not mislabeled as observed internal cognition;
- missing or failed encounters remain visible and are not silently retried;
- sensitive raw trace data remains local.

---

# 14. Decisions intentionally deferred

The following questions should remain configurable or unresolved after v0:

- the final primitive taxonomy;
- whether attention is model-reported, externally calculated, or both;
- whether relation labels are open-ended or come from a controlled vocabulary;
- whether agent-proposed organizational rules may later become executable;
- whether offline consolidation resembles replay, recombination, compression, or critique;
- whether browsing is autonomous or supplied by the researcher;
- whether developmental time is measured in encounters, tokens, actions, or wall-clock duration;
- which organizational motifs count as higher-order emergence;
- how human annotation and independent model evaluation are combined.

---

# 15. Recommended starting decision

Build v0 around discrete encounters, not a two-hour simulated day.

The first pipeline should use:

```text
fixed local materials
+ one bounded research turn per encounter
+ one explicit externalization
+ one graph update
+ one consolidation step
+ scheduled retrieval probes
```

Keep `schedule` and `external_access` in configuration from the beginning. Once the four-layer loop is reliable, the study can add exploration windows, closed-library organization periods, and offline consolidation as controlled schedule interventions rather than mixing them into the first implementation.
