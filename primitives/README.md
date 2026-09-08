# Primitive design lifecycle

> **Researcher-only:** nothing in this directory may enter a subject
> workspace.

Memorabilia freezes concepts before parameters. A blank is not a defect when
the experiment cannot yet identify the answer: use **undecided**,
**pilot-dependent**, or **implementation detail** instead of inventing a
commitment.

> A good primitive is not one that explains everything.
> A good primitive is one that leaves something genuinely capable of emerging.

## The three layers

| Layer | Decision type | When it becomes fixed | Document |
|---|---|---|---|
| A | Research design | Before encounter design and v1 implementation | [`primitive-spec-v1.md`](primitive-spec-v1.md) |
| B | Numerical/runtime calibration | After pilot, before confirmatory v1 runs | [`runtime-parameters-v1.json`](runtime-parameters-v1.json) |
| C | Interpretation and analysis commitments | After v0.5 measurement validation, before confirmatory v1 runs | [`preregistration-v1.md`](preregistration-v1.md) |

The conceptual reasons for including the primitives are kept separately in
[`primitive-philosophy.md`](primitive-philosophy.md). This prevents a runtime
default from quietly becoming a theoretical claim.

## Current sequence

1. Complete and freeze Layer A.
2. Design a checksummed encounter multiset and order conditions from that
   contract.
3. Run v0.5 to calibrate whether graph-derived context can affect registered
   probes at all.
4. Use pilot runs to calibrate Layer B, then freeze a parameter-file hash.
5. Register Layer C without inspecting confirmatory outcomes.
6. Run the developmental-history experiment.

Pilot runs are exploratory and must be identified as such. Their outputs do
not enter the confirmatory v1 analysis.

In the parameter file, `null` means genuinely undecided; the inherited v0
values are provisional starting points, not theoretical commitments.
Non-conceptual deterministic policies such as tie-breaking are also calibrated
during the pilot and frozen before confirmatory runs, but they remain named
implementation details rather than cognitive primitives or numerical entries.

## Current priority

The present goal is a clean developmental paradigm:

- a fixed minimal primitive architecture;
- a controlled encounter multiset;
- experience-order manipulation;
- trajectory observation;
- non-learning behavioral probes.

Primitive ablations and parameter studies come later. In particular,
Selection, Association, and Persistence are fixed together in the first
developmental-history experiment; that experiment does not yet estimate their
individual causal contributions.
