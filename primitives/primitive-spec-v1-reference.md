# Primitive Specification v1 — Formal Reference

> **Status:** draft / not frozen
> **Target experiment:** v1 developmental-history experiment
> **Apparatus dependency:** Memorabilia v0.1.0
> **Researcher-only:** this document, its terminology, hypotheses, parameters,
> and ablation plan must never enter a subject workspace.

## How to use this reference

Start with [`primitive-spec-v1.md`](primitive-spec-v1.md). This longer document
is the implementation and preregistration reference used to translate the
completed worksheet into a frozen mechanism contract.

1. Replace every `[FILL: ...]` field before freezing v1.
2. Delete alternatives that were not selected; do not leave several possible
   mechanisms in the registered specification.
3. Express every state change as deterministic pseudocode or an equation.
4. Put every numeric value in the versioned config as well as this document.
5. Record expected signatures and null results before running the main study.
6. If a mechanism changes after the pilot, increment the spec version and
   preserve the earlier version. Never silently edit a frozen specification.

The test for whether something belongs here is simple:

> If changing it could alter a developmental trajectory, it must either be a
> named primitive, a fixed apparatus component, or an explicitly manipulated
> experimental variable.

## 1. Research question

### Primary v1 question

> Can a fixed minimal set of primitive dynamics, interacting with an identical
> multiset of encounters presented in different temporal orders, produce
> divergent, persistent, and behaviorally consequential trajectories of
> information organization?

### Manipulated variable

- Experience content: fixed
- Number of encounters: fixed
- Primitive set and parameters: fixed
- Model/runtime/prompt regime: fixed
- **Manipulated:** temporal order of encounters

### Primary units of observation

- Graph trajectory: `G0 → G1 → ... → Gn`
- Behavioral trajectory from non-learning probe forks: `B0 → B1 → ... → Bn`
- Final transfer behavior: `[FILL: exact endpoint probe(s)]`

## 2. Claim boundary

In v1, a **primitive** means a small, explicitly implemented state-transition
rule in the external Memorabilia scaffold. It does not mean:

- a biological primitive;
- a discovered mechanism inside the base model;
- transformer attention;
- a neuron, synapse, or biological engram;
- an exhaustive taxonomy of cognition;
- a property whose necessity or sufficiency has already been established.

Thought Space is an externalized observational surface. Its nodes and edges are
research objects produced by a model-plus-scaffold system, not direct readouts
of hidden cognition.

## 3. Fixed apparatus versus developmental variables

### Fixed constitutive substrate

These components make the experiment executable and are not candidate
primitives in v1:

- stable IDs and schema validation;
- immutable snapshots and SHA-256 hashes;
- serialization and run-bundle storage;
- Trace Inspector collection and replay;
- subject-workspace isolation and leakage audit;
- deterministic graph layout;
- frozen model, reasoning effort, prompts, and runtime controls;
- non-learning probe forks;
- `[FILL: fixed retrieval candidate-generation rule]`;
- `[FILL: any additional fixed component]`.

### Fixed v1 developmental architecture

| Primitive family | ID | One-sentence role | v1 status |
|---|---|---|---|
| Selection / Activation | `selection-activation-v1` | Determines which existing structures participate in the current encounter. | `[FILL: included / excluded]` |
| Association | `association-v1` | Establishes or strengthens relations among co-activated structures. | `[FILL: included / excluded]` |
| Persistence / Decay / Reactivation | `persistence-v1` | Determines what remains available, weakens, and returns across encounters. | `[FILL: included / excluded]` |

For the first v1 history experiment, the intended default is to include all
three families and hold them fixed. Component ablations belong to v2 unless a
small measurement pilot reveals that the architecture is inert.

## 4. Shared notation and state

Define the state immediately before encounter `E_t` as:

```text
G_t = (N_t, R_t)

node n:
  activation a_n
  persistence p_n
  provenance
  lastActivatedAt

relation r(u, v):
  weight w_r
  persistence p_r
  enabled
  provenance
  lastActivatedAt
```

### Required ranges

- Activation: `[FILL: Boolean or numeric range]`
- Node persistence: `[FILL: range, recommended 0..1]`
- Relation weight: `[FILL: range and upper bound]`
- Relation persistence: `[FILL: range, recommended 0..1]`
- Removal/deactivation threshold: `[FILL]`

### Time

One developmental step means `[FILL: normally one accepted encounter]`.
Decay must be based on explicit steps, not wall-clock time.

## 5. Primitive A — Selection / Activation

### Research role

Selection asks:

> What from the existing organization becomes active in relation to the
> current encounter?

It must not be described as transformer attention.

### Inputs

- Current encounter: `[FILL: exact fields visible to the mechanism]`
- Pre-encounter snapshot: `[FILL]`
- Candidate nodes/relations: `[FILL: how candidates are generated]`
- Model-authored activation proposal, if any: `[FILL: schema or none]`

### Output

```ts
interface ActivationDecision {
  candidateRef: string;
  modelProposed: boolean | number | null;
  runtimeAccepted: boolean;
  activationValue: number;
  reasonCode: string;
}
```

### Decision rule

Choose exactly one model and delete the others:

- `[FILL: model proposes candidates; runtime validates and applies them]`
- `[FILL: runtime selects deterministically from encounter/state overlap]`
- `[FILL: hybrid—model scores candidates; runtime applies a frozen threshold]`

Exact rule or pseudocode:

```text
[FILL]
```

### Tie-breaking and bounds

- Maximum activated nodes: `[FILL]`
- Maximum activated relations: `[FILL]`
- Tie-break: `[FILL: recommended canonical ID ascending]`
- Unknown reference behavior: `[FILL: reject / ignore with recorded reason]`
- Empty activation behavior: `[FILL]`

### Required provenance

For every candidate, preserve:

```text
candidate generated
→ model proposed or did not propose
→ runtime accepted or rejected
→ final activation value
```

### Functional signature

If this primitive is functioning, then `[FILL: observable signature]`.

### Possible confounds

- semantic similarity hidden inside candidate generation;
- unconstrained model choice presented as a runtime primitive;
- different candidate pool sizes across experience orders;
- activation labels prompted directly by the researcher.

## 6. Primitive B — Association

### Research role

Association asks:

> When structures are co-activated, which relations are created or
> strengthened?

It must be able to strengthen a pre-existing relation. Otherwise it is only a
graph-construction rule.

### Eligible objects

- New accepted relations: `[FILL: eligible?]`
- Existing enabled relations: `[FILL: eligible? expected yes]`
- Disabled or decayed relations: `[FILL: eligible for reactivation?]`
- Relation with only one activated endpoint: `[FILL]`

### Update equation

Provisional form—replace with the frozen v1 rule:

```text
if activated(source) and activated(target) and relation is eligible:
    w' = min(w_max, w + α × coactivation(source, target))
else:
    w' = w
```

- Association increment `α`: `[FILL: v0 used 0.25]`
- Maximum weight `w_max`: `[FILL]`
- Coactivation function: `[FILL: Boolean 0/1 or numeric]`
- Multiple activations in one encounter: `[FILL]`
- Self-relations: `[FILL: recommended reject]`

### Relation creation

Who proposes a new relation?

`[FILL: agent proposes; runtime validates / deterministic runtime rule / other]`

The runtime must not invent a semantic relation label unless that rule is
explicitly registered.

### Required provenance

```text
relation candidate
→ model-authored or pre-existing
→ activation evidence for both endpoints
→ weight before
→ primitive delta
→ weight after
```

### Functional signature

If this primitive is functioning, repeated coactivation should `[FILL]` while
matched non-coactivated relations should `[FILL]`.

### Possible confounds

- reinforcement occurring only at relation creation;
- unlimited weight growth;
- repeated wording rather than repeated conceptual activation;
- relation labels encoding the expected experimental conclusion.

## 7. Primitive C — Persistence / Decay / Reactivation

### Research role

This family asks:

> What survives between encounters, what weakens when inactive, and what can
> return when partially cued?

### Persistence state

- Node persistence variable: `[FILL]`
- Relation persistence variable: `[FILL]`
- Initial persistence for new structures: `[FILL: v0 used 1.0]`
- Whether weight and persistence are distinct: `[FILL: recommended yes]`

### Decay rule

Provisional multiplicative form:

```text
if structure existed before E_t and was not activated at t:
    p' = p × (1 - δ)
else:
    p' = p
```

- Decay rate `δ`: `[FILL: v0 used 0.05]`
- Decay granularity: `[FILL: per encounter / explicit consolidation step]`
- Grace period for newly created structures: `[FILL]`
- Threshold behavior: `[FILL: disabled / retained but inaccessible / removed]`
- Lower bound: `[FILL]`

### Reactivation rule

Provisional form:

```text
if an eligible weakened structure is activated again:
    p' = min(p_max, p + ρ × (p_max - p))
```

- Reactivation rate `ρ`: `[FILL]`
- Maximum persistence `p_max`: `[FILL]`
- Minimum cue required: `[FILL]`
- Can disabled structures reactivate?: `[FILL]`
- Does reactivation also affect relation weight?: `[FILL]`

### Required provenance

```text
pre-step persistence
→ activation status
→ decay/reactivation rule and parameters
→ primitive delta
→ post-step persistence
```

### Functional signature

- Repeatedly inactive structures should `[FILL]`.
- A matched partial cue should `[FILL]`.
- A reactivated structure should alter later retrieval by `[FILL]`.

### Possible confounds

- different numbers of decay steps across order conditions;
- confusing low association weight with low persistence;
- physically deleting structures and losing intervention provenance;
- letting probe turns count as reactivation events.

## 8. Cross-primitive execution order

The order of state transitions is itself part of the architecture and must be
frozen. Recommended provisional order:

```text
1. Load immutable pre-encounter snapshot G_t
2. Present only encounter E_t and allowed retrieved context
3. Generate activation candidates
4. Record model-proposed activation and graph operations
5. Validate proposals without repairing them
6. Resolve final activated set
7. Apply decay to pre-existing inactive structures
8. Apply reactivation to eligible weakened active structures
9. Apply accepted structural additions/revisions
10. Apply association to eligible co-activated relations
11. Save agent-authored and primitive-generated deltas separately
12. Produce immutable G_(t+1) and hash
13. Fork non-learning probes; do not write probe activity into G_(t+1)
```

Frozen v1 order:

```text
[FILL: confirm or replace the sequence above]
```

If two rules modify the same state variable, precedence is `[FILL]`.

## 9. Supported graph operations for v1

The v0 `add_node` / `add_edge` patch is insufficient for repeated activation,
competing information, and reactivation. Register the v1 operations here:

| Operation | Model may propose? | Runtime may generate? | Required evidence | Decision |
|---|---:|---:|---|---|
| `add_node` | yes | no | encounter ref | `[FILL]` |
| `add_edge` | yes | no | encounter ref | `[FILL]` |
| `activate_ref` | `[FILL]` | `[FILL]` | activation provenance | `[FILL]` |
| `revise_node` | `[FILL]` | no | encounter ref + prior ref | `[FILL]` |
| `revise_edge` | `[FILL]` | no | encounter ref + prior edge | `[FILL]` |
| `qualify_edge` | `[FILL]` | no | encounter ref + prior edge | `[FILL]` |
| `supersede_edge` | `[FILL]` | no | contradiction evidence | `[FILL]` |
| `reactivate_ref` | `[FILL]` | `[FILL]` | cue + prior ref | `[FILL]` |

Executable learning rules submitted by the model remain forbidden.

## 10. Encounter requirements implied by the primitives

The encounter set must give every fixed primitive a chance to operate without
naming the primitive or desired outcome to the subject.

| Requirement | Why needed | Planned encounter(s) |
|---|---|---|
| Initial relation formation | Establishes a structure that can later change | `[FILL]` |
| Repeated coactivation | Makes existing-edge association observable | `[FILL]` |
| Competing or qualifying information | Tests revision rather than accumulation | `[FILL]` |
| Inactive interval | Gives decay a controlled opportunity | `[FILL]` |
| Partial cue | Tests selection and reactivation | `[FILL]` |
| Novel transfer | Tests organization-in-use | `[FILL]` |

Both order conditions must contain exactly the same material multiset and the
same number of developmental steps. Prefer a common final anchor encounter so
that the endpoint comparison is not reducible to which material appeared last.

## 11. Probe isolation

Every behavioral probe must run as a fresh, non-learning fork from a named
snapshot:

```text
G_t ──→ probe context ──→ B_t
 │
 └──→ next encounter ──→ G_(t+1)
```

Probe prompts, responses, retrievals, and traces are recorded, but they must
not modify the main developmental state or become visible to later encounters.

Probe modes for measurement calibration:

- `R0`: no graph-derived context
- `R1`: intact graph context
- `R2`: registered knockout context
- `R3`: reinstated graph context

## 12. Predicted and disconfirming observations

Complete this section before the main v1 run.

### Result that would support a history-sensitive phenomenon

`[FILL: specify graph-trajectory and behavioral criteria without requiring a
particular direction of difference]`

### Meaningful null result

`[FILL: same multiset/order manipulation produces no stable divergence across
registered measures and repetitions]`

### Apparatus failure rather than a scientific null

- primitives never receive an eligible input;
- graph state differs but probe contexts do not;
- probe contexts differ but the model cannot behaviorally discriminate them in
  the measurement-calibration task;
- runtime controls or leakage boundary fail;
- `[FILL: additional invalidation criteria]`.

### Outcome that would weaken the Thought Space measurement regime

`[FILL: e.g. graph divergence is dominated by externalization wording and does
not predict downstream behavior]`

## 13. Configuration block to freeze

```json
{
  "schemaVersion": "1.0-draft",
  "primitiveArchitectureId": "selection-association-persistence-v1",
  "selection": {
    "enabled": true,
    "candidateRule": "[FILL]",
    "threshold": "[FILL]",
    "topK": "[FILL]"
  },
  "association": {
    "enabled": true,
    "increment": "[FILL]",
    "maxWeight": "[FILL]",
    "coactivationRule": "[FILL]"
  },
  "persistence": {
    "enabled": true,
    "decayRate": "[FILL]",
    "reactivationRate": "[FILL]",
    "disableThreshold": "[FILL]"
  }
}
```

Strings containing `[FILL]` must be rejected by preflight once the spec is
frozen.

## 14. Implementation tests required before v1

- Same pre-state, encounter, config, and patch produce the same snapshot hash.
- Candidate generation is identical across replay.
- Canonical tie-breaking is stable.
- Association strengthens an existing eligible edge.
- Association does not change a matched ineligible edge.
- Decay changes only pre-existing inactive structures.
- Reactivation changes only eligible weakened structures.
- Weight and persistence updates are independently attributable.
- Competing information can revise, qualify, or supersede an old relation
  without erasing its provenance.
- Probe forks cannot write to developmental state.
- Both experience orders contain the same checksummed material multiset.
- Both orders contain the same number of decay/consolidation steps.
- Researcher-only terminology is absent from every subject bundle.
- Invalid model output is preserved without repair or retry.

## 15. Future ablation registry — not run in v1

Prepare implementation seams now, but do not interpret these cells until v1
demonstrates a phenomenon worth explaining.

| Condition | Selection | Association | Persistence family | Purpose |
|---|---:|---:|---:|---|
| `P_all` | on | on | on | v1 developmental architecture |
| `P_no_selection` | off | on | on | Later necessity test |
| `P_no_association` | on | off | on | Later necessity test |
| `P_no_persistence` | on | on | off | Later necessity test |
| `P_base` | off | off | off | Constitutive scaffold control |

`P_base` still includes storage, schema, snapshots, serialization, retrieval
apparatus, and trace collection. It is not a representation-free agent.

## 16. Open decisions

| ID | Decision | Options | Choice | Rationale | Decided before pilot? |
|---|---|---|---|---|---:|
| D01 | Who proposes activation? | model / runtime / hybrid | `[FILL]` | `[FILL]` | yes |
| D02 | Activation scale | Boolean / numeric | `[FILL]` | `[FILL]` | yes |
| D03 | Weight cap | value | `[FILL]` | `[FILL]` | yes |
| D04 | Decay unit | encounter / consolidation step | `[FILL]` | `[FILL]` | yes |
| D05 | Below-threshold state | inaccessible / disabled / removed | `[FILL]` | `[FILL]` | yes |
| D06 | Existing-relation revision | revise / qualify / supersede vocabulary | `[FILL]` | `[FILL]` | yes |
| D07 | Probe checkpoints | every step / selected steps | `[FILL]` | `[FILL]` | yes |
| D08 | Repetitions per order | integer | `[FILL]` | `[FILL]` | before main run |

## 17. Freeze checklist

- [ ] No `[FILL]` marker remains in the frozen spec or config.
- [ ] Primitive inputs and outputs have schemas.
- [ ] Every update has exact pseudocode/equation and parameter values.
- [ ] Execution order and precedence are explicit.
- [ ] Model-proposed, runtime-accepted, primitive-generated, and final state are
      distinguishable.
- [ ] Encounter IDs, contents, order manifests, and hashes are frozen.
- [ ] Probe forks are non-learning and independently traced.
- [ ] Predictions, nulls, and apparatus-failure criteria are preregistered.
- [ ] All deterministic and integration tests pass.
- [ ] Leakage preflight passes.
- [ ] A credential-free synthetic trajectory can be replayed in the viewer.
- [ ] Version, commit SHA, and date are recorded below.

## 18. Version record

| Field | Value |
|---|---|
| Spec version | `1.0-draft` |
| Status | draft |
| Author | `[FILL]` |
| Frozen date | `[FILL]` |
| Git commit | `[FILL]` |
| Apparatus dependency | `Memorabilia v0.1.0` |
| Encounter-set version | `[FILL]` |
| Evaluation-protocol version | `[FILL]` |

### Change log

| Date | Version | Change | Reason |
|---|---|---|---|
| `[FILL]` | `1.0-draft` | Initial specification | `[FILL]` |
