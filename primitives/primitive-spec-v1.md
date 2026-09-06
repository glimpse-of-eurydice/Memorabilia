# Primitive Specification v1 — Design Worksheet

> **Status:** draft / not frozen
> **Purpose:** define the fixed three-primitive architecture for the first
> developmental-history experiment
> **Researcher-only:** this file must never enter a subject workspace.

## How to fill this in

Write freely inside each `[YOUR ANSWER]` block. Short answers are enough. If
you are uncertain, write the alternatives you are considering and why; do not
choose an arbitrary number just to remove a blank.

After this worksheet is complete, translate it into the exact equations,
schemas, provenance fields, tests, and config described in
[`primitive-spec-v1-reference.md`](primitive-spec-v1-reference.md). The
worksheet captures research decisions; the reference turns them into an
implementation contract.

## 1. What should v1 test?

Proposed primary question:

> Can a fixed minimal set of primitive dynamics, interacting with an identical
> multiset of encounters presented in different temporal orders, produce
> divergent, persistent, and behaviorally consequential trajectories of
> information organization?

Keep, revise, or replace it:

> [YOUR ANSWER]

For v1, the only intended manipulated variable is encounter order. Everything
else—including the primitive set—is fixed.

Is that the experiment you want to run?

> [YOUR ANSWER: yes / revision]

## 2. What counts as one developmental step?

A step should be an explicit experimental event, not elapsed wall-clock time.

Choose one:

- one accepted encounter;
- one encounter followed by one consolidation step;
- another definition.

> [YOUR ANSWER]

Should an invalid encounter output consume a developmental step?

> [YOUR ANSWER: recommended no; preserve the failed run without updating state]

## 3. Primitive A — Selection / Activation

Plain-language question:

> When a new encounter arrives, what from the existing organization becomes
> active with it?

### 3.1 Who proposes activation?

Choose one starting model:

- **Agent-led:** the agent names which existing structures became relevant;
  the runtime validates the references.
- **Runtime-led:** a deterministic rule selects structures without asking the
  agent.
- **Hybrid:** the runtime creates a candidate set, the agent scores/selects
  within it, and the runtime applies fixed bounds.

> [YOUR ANSWER]

Why is this the best choice for the first experiment?

> [YOUR ANSWER]

### 3.2 Candidate boundary

What existing structures may be considered?

> [YOUR ANSWER: nodes, edges, clusters, and/or other units]

How is the candidate set generated without secretly deciding relevance for the
agent?

> [YOUR ANSWER]

Maximum number activated per encounter:

> [YOUR ANSWER: number or “no cap,” with rationale]

If candidates tie, use:

> [YOUR ANSWER: recommended canonical ID order]

### 3.3 Expected observable signature

If Selection / Activation is working, what should we be able to observe in a
trace or later retrieval?

> [YOUR ANSWER]

## 4. Primitive B — Association

Plain-language question:

> When structures are active together, what becomes connected or stronger?

### 4.1 What can association change?

Should it operate on:

- newly proposed relations;
- pre-existing relations;
- both?

> [YOUR ANSWER: recommended both]

Who supplies the semantic relation label for a new edge?

> [YOUR ANSWER: recommended agent proposes; runtime never invents meaning]

### 4.2 Strengthening rule

Provisional rule:

```text
if both endpoints are active and the relation is eligible:
    new weight = min(max weight, old weight + increment)
```

Association increment:

> [YOUR ANSWER: v0 used 0.25]

Maximum relation weight:

> [YOUR ANSWER]

Should partial/numeric activation produce partial strengthening, or should v1
use a Boolean active/inactive rule?

> [YOUR ANSWER]

### 4.3 Expected observable signature

After repeated coactivation, what should differ from a matched relation that
was not repeatedly coactivated?

> [YOUR ANSWER]

## 5. Primitive C — Persistence / Decay / Reactivation

Plain-language question:

> What survives, what weakens when inactive, and what can return when cued?

### 5.1 What persists?

Should nodes and relations each have their own persistence value?

> [YOUR ANSWER: recommended yes]

Should relation weight and persistence remain separate variables?

> [YOUR ANSWER: recommended yes—strength and availability are different]

Initial persistence of a newly accepted structure:

> [YOUR ANSWER: v0 used 1.0]

### 5.2 Decay

Provisional rule:

```text
if a pre-existing structure was not activated during this step:
    new persistence = old persistence × (1 - decay rate)
```

Decay rate per developmental step:

> [YOUR ANSWER: v0 used 0.05]

What happens below the persistence threshold?

- retained but normally inaccessible;
- disabled but reactivatable;
- permanently removed;
- another policy.

> [YOUR ANSWER: avoid permanent deletion in v1 if possible]

Threshold:

> [YOUR ANSWER]

### 5.3 Reactivation

What kind of cue is sufficient to reactivate a weakened structure?

> [YOUR ANSWER]

How much persistence is restored?

> [YOUR ANSWER: fixed increment, proportional recovery, or reset]

Does reactivation restore accessibility only, or also strengthen association?

> [YOUR ANSWER]

### 5.4 Expected observable signature

What difference should exist between an inactive structure, a partially cued
structure, and a repeatedly reactivated structure?

> [YOUR ANSWER]

## 6. How can existing organization change?

v0 can mainly add nodes and edges. v1 must decide what happens when a later
encounter qualifies or conflicts with an existing relation.

Which operations should an agent be allowed to propose?

- revise a node summary;
- revise a relation;
- add a qualifier;
- supersede an old relation while preserving it in provenance;
- disable a relation;
- another operation.

> [YOUR ANSWER]

Give one concrete example of how competing information should change the graph:

> [YOUR ANSWER]

What must never be erased from provenance?

> [YOUR ANSWER]

## 7. Execution order

Proposed order for each encounter:

```text
1. Load pre-encounter snapshot
2. Present encounter and permitted retrieved context
3. Generate activation candidates
4. Record agent-proposed activation and graph changes
5. Validate without repairing invalid output
6. Resolve the final active set
7. Decay pre-existing inactive structures
8. Reactivate eligible weakened active structures
9. Apply accepted additions/revisions
10. Strengthen eligible co-activated relations
11. Save agent-authored and primitive-generated deltas separately
12. Create and hash the immutable next snapshot
13. Run probes as non-learning forks
```

Accept this order or describe the change you want:

> [YOUR ANSWER]

If two primitives modify the same value, which one takes precedence?

> [YOUR ANSWER]

## 8. What must the encounters make possible?

Fill in a provisional encounter ID or idea for each function. The final order
conditions must use the same checksummed material multiset.

| Function | Why it is needed | Encounter idea or ID |
|---|---|---|
| Initial relation formation | Creates something that can later develop | `[YOUR ANSWER]` |
| Repeated coactivation | Allows existing-edge association | `[YOUR ANSWER]` |
| Competing/qualifying information | Allows revision rather than accumulation | `[YOUR ANSWER]` |
| Inactive interval | Gives decay an opportunity | `[YOUR ANSWER]` |
| Partial cue | Tests selection and reactivation | `[YOUR ANSWER]` |
| Novel transfer | Tests organization-in-use | `[YOUR ANSWER]` |

What should both order conditions see immediately before the final probe, so
that the result is not merely “whatever came last”?

> [YOUR ANSWER]

## 9. Behavioral measurement

Probes must fork from a snapshot and must not update the developmental graph.

Which checkpoints should receive probes?

> [YOUR ANSWER: every encounter or selected checkpoints]

Minimal calibration conditions:

- no graph context;
- intact graph context;
- registered knockout context;
- reinstated context.

What behavior should change if Thought Space is functionally consequential?

> [YOUR ANSWER]

What behavior should remain invariant?

> [YOUR ANSWER]

## 10. Results declared in advance

Complete these before the main experiment.

### Evidence consistent with a history effect

> [YOUR ANSWER: specify trajectory and behavioral criteria without requiring a
> preferred direction]

### Meaningful null result

> [YOUR ANSWER]

### Apparatus failure rather than a scientific null

> [YOUR ANSWER: include “a primitive never received an eligible input” and
> “different graph contexts cannot affect the calibration probe”]

### Result that would weaken the Thought Space measurement regime

> [YOUR ANSWER: for example, graph differences do not predict downstream
> behavior]

## 11. Future ablations — registered, not run in v1

| Condition | Selection | Association | Persistence family |
|---|---:|---:|---:|
| `P_all` | on | on | on |
| `P_no_selection` | off | on | on |
| `P_no_association` | on | off | on |
| `P_no_persistence` | on | on | off |
| `P_base` | off | off | off |

`P_base` still includes schema, storage, snapshots, serialization, retrieval,
and trace collection. It is not a representation-free agent.

Do you want to change or add any future condition?

> [YOUR ANSWER]

## 12. Ready-to-formalize checklist

- [ ] The primary v1 question is correct.
- [ ] One developmental step is defined.
- [ ] Activation proposer and candidate boundary are chosen.
- [ ] Association can strengthen existing edges.
- [ ] Association increment and upper bound are chosen.
- [ ] Persistence, decay, threshold, and reactivation are defined separately.
- [ ] Competing information can revise organization without erasing history.
- [ ] Primitive execution order is accepted.
- [ ] Every primitive has at least one eligible encounter.
- [ ] Probe checkpoints and non-learning isolation are defined.
- [ ] Supporting, null, and apparatus-failure outcomes are stated.
- [ ] Unresolved choices are explicitly marked rather than guessed.

## 13. Worksheet record

| Field | Value |
|---|---|
| Worksheet version | `1.0-draft` |
| Author | `[YOUR ANSWER]` |
| Date completed | `[YOUR ANSWER]` |
| Apparatus dependency | `Memorabilia v0.1.0` |
| Notes | `[YOUR ANSWER]` |
