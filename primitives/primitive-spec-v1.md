# Primitive specification v1 — Layer A worksheet

> **Status:** draft / not frozen
> **Scope:** research-design decisions required before v1 encounter design
> **Apparatus dependency:** Memorabilia v0.1.0
> **Researcher-only:** this file must never enter a subject workspace.

## How to use this worksheet

Fill only decisions that define the experimental paradigm. Do not choose a
number merely to eliminate a blank. Numerical values belong in
[`runtime-parameters-v1.json`](runtime-parameters-v1.json) and interpretive
criteria belong in [`preregistration-v1.md`](preregistration-v1.md).

Valid answers include `undecided`, with a sentence naming what evidence would
resolve the decision. Layer A must nevertheless be frozen before encounter
design and implementation begin.

## 1. Primary research question

Proposed v1 question:

> Can a fixed minimal set of primitive dynamics, interacting with an identical
> multiset of encounters presented in different temporal orders, produce
> divergent, persistent, and behaviorally consequential trajectories of
> information organization?

Keep or revise:

> [YOUR ANSWER]

Confirm the v1 manipulation:

- manipulated: encounter order;
- fixed: encounter multiset, primitive architecture, runtime parameter set,
  model/runtime, prompts, retrieval regime, and probes;
- observed: graph trajectory and behavior from non-learning probe forks.

> [YOUR ANSWER: confirm or revise]

## 2. One developmental step

Define one step as an experimental event, not elapsed wall-clock time.

> [YOUR ANSWER: e.g. one accepted encounter followed by one consolidation
> transition]

Does an invalid agent output consume a step or mutate developmental state?

> [YOUR ANSWER; recommended: preserve the failed trace, do neither]

## 3. Shared state and provenance

Which state variables exist conceptually? Numerical ranges do not belong here.

| State | Meaning | Applies to | Required? |
|---|---|---|---|
| activation | participation in the current step | node / relation / other | `[YOUR ANSWER]` |
| association strength | learned relational influence | relation | `[YOUR ANSWER]` |
| persistence | current functional availability across steps | node / relation | `[YOUR ANSWER]` |
| enabled/accessibility | eligibility for ordinary traversal | node / relation | `[YOUR ANSWER]` |

Required provenance should distinguish at minimum:

```text
model proposed
runtime accepted or rejected
primitive modified
final state
```

Add or revise required provenance fields:

> [YOUR ANSWER]

## 4. Primitive contract: Selection / Activation

**Question:** What from existing organization participates in the current
encounter?

**Inputs:**

> [YOUR ANSWER: encounter fields, pre-state fields, eligible units]

**Output:**

> [YOUR ANSWER: the conceptual shape of an activation decision]

Who proposes and who decides?

- agent-led;
- runtime-led;
- hybrid: runtime bounds candidates and the agent selects within them;
- another explicitly described policy.

> [YOUR ANSWER]

How is the candidate boundary created without covertly deciding relevance?

> [YOUR ANSWER]

What trace evidence must this primitive emit?

> [YOUR ANSWER]

Non-goal or forbidden interpretation:

> [YOUR ANSWER; must include that this is not transformer attention]

## 5. Primitive contract: Association

**Question:** When structures participate together, what becomes related or
stronger?

**Inputs:**

> [YOUR ANSWER: active-set and accepted-relation inputs]

**Output:**

> [YOUR ANSWER: new relation, changed association strength, or both]

May it operate on new relations, existing relations, or both?

> [YOUR ANSWER]

Who authors a relation's semantic label, and what may the runtime do?

> [YOUR ANSWER; recommended boundary: agent proposes meaning, runtime validates
> and applies mechanics]

What trace evidence must this primitive emit?

> [YOUR ANSWER]

Non-goal or forbidden interpretation:

> [YOUR ANSWER; must distinguish coactivation from semantic truth]

## 6. Primitive contract: Persistence / Decay / Reactivation

**Question:** What remains functionally available, what weakens through
inactivity, and what can return when cued?

**Inputs:**

> [YOUR ANSWER: active set, pre-existing state, cue eligibility]

**Output:**

> [YOUR ANSWER: persistence and/or accessibility transitions]

Define the distinct roles of persistence, decay, and reactivation:

> [YOUR ANSWER]

Should node and relation persistence be represented separately? Should
association strength and persistence remain distinct?

> [YOUR ANSWER]

What does crossing a low-persistence boundary mean conceptually: retained but
normally inaccessible, disabled but reactivatable, permanently removed, or
another policy?

> [YOUR ANSWER]

What kind of event is eligible to reactivate a weakened structure?

> [YOUR ANSWER]

What trace evidence must this primitive emit?

> [YOUR ANSWER]

Non-goal or forbidden interpretation:

> [YOUR ANSWER; recommended: no irreversible provenance loss]

## 7. Graph revision policy

Later encounters must be able to reorganize prior structure rather than only
append to it. Select the permitted semantic operations:

- qualify an existing claim or relation;
- revise a node or relation while preserving its prior version;
- supersede without erasing;
- disable while retaining provenance;
- merge or split representational units;
- another operation.

> [YOUR ANSWER]

Give one example of how competing evidence changes the graph:

> [YOUR ANSWER]

What information must never be erased?

> [YOUR ANSWER]

## 8. Primitive execution order

Proposed conceptual order:

```text
1. Load the immutable pre-encounter snapshot.
2. Present the encounter and permitted retrieved context.
3. Record model-proposed activation and graph revision.
4. Validate proposals without semantic repair.
5. Resolve the accepted active set.
6. Apply inactivity-dependent decay to pre-existing structure.
7. Apply eligible reactivation.
8. Apply accepted additions and revisions.
9. Apply association to eligible co-active structure.
10. Save model-authored and primitive-generated deltas separately.
11. Hash the immutable next snapshot.
12. Fork probes from the snapshot without learning from them.
```

Accept or revise:

> [YOUR ANSWER]

If primitive operations target the same state variable, define conceptual
precedence (not numeric magnitude):

> [YOUR ANSWER]

## 9. Encounter requirements

The final order conditions must use the same checksummed material multiset.
Specify what the multiset must make possible; do not write the encounters yet.

| Functional requirement | Required encounter property |
|---|---|
| Initial relation formation | `[YOUR ANSWER]` |
| Repeated coactivation | `[YOUR ANSWER]` |
| Competing or qualifying information | `[YOUR ANSWER]` |
| Inactive interval | `[YOUR ANSWER]` |
| Partial cue and reactivation opportunity | `[YOUR ANSWER]` |
| Novel transfer probe | `[YOUR ANSWER]` |

What must be balanced immediately before final probes so that an order effect
cannot be reduced to recency?

> [YOUR ANSWER]

What semantic constraints prevent one ordering from being inherently more
coherent, informative, or difficult?

> [YOUR ANSWER]

## 10. Behavioral-probe contract

Probes fork from a registered snapshot and cannot update developmental state.

At which developmental checkpoints are probes required?

> [YOUR ANSWER]

Which probe inputs are held identical across order conditions?

> [YOUR ANSWER]

What runtime evidence proves the probe received the intended graph-derived
context and remained non-learning?

> [YOUR ANSWER]

Do not define evidence for a history effect here; that is Layer C.

## 11. Layer A freeze record

- [ ] The primary question and sole v1 manipulation are fixed.
- [ ] One developmental step is defined.
- [ ] Each primitive has explicit inputs, outputs, ownership, provenance, and
      a non-goal.
- [ ] Graph revision can change organization without erasing history.
- [ ] Primitive execution order and conflict precedence are fixed.
- [ ] Encounter functional requirements and recency controls are fixed.
- [ ] Behavioral probes are non-learning and their checkpoints are fixed.
- [ ] Numerical choices have been removed to Layer B.
- [ ] Interpretive outcome criteria have been removed to Layer C.
- [ ] Remaining unknowns are named rather than guessed.

| Field | Value |
|---|---|
| Spec version | `1.0-draft` |
| Author | `[YOUR ANSWER]` |
| Frozen on | `undecided` |
| Frozen commit | `undecided` |
| Apparatus dependency | `Memorabilia v0.1.0` |
