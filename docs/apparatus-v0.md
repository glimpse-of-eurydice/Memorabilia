# Frozen Memorabilia apparatus contract: v0.1.0

## Purpose

This version demonstrates that the Thought Space observational scaffold inside
Memorabilia can be configured, observed, replayed, and intervened on in a
single-encounter run. Thought Space is an externalized graph interface, not a
claim about the agent's hidden cognitive state.

## Frozen substrate

- `gpt-5.6-sol` with medium reasoning effort
- network access disabled and approval policy `never`
- one neutral encounter and one fresh probe turn
- temporary subject workspace with an exact file allowlist
- graph patch schema `0.1`
- stable node, edge, and snapshot identifiers
- deterministic association and decay reducer seams
- deterministic graph traversal with baseline, knockout, and reinstatement
- SHA-256 hashes for inputs, snapshots, and retrieved context
- raw Trace Inspector evidence plus normalized events, spans, and findings
- agent message deltas retained only in raw evidence; one normalized
  model-reported event per complete message
- deterministic SVG layout; cluster hints affect color only

## Not frozen as a scientific claim

v0 does not establish that the graph reveals hidden cognition, that association
or decay is necessary, that encounter order matters, or that downstream model
behavior changes causally. Those require measurement calibration, multiple
encounters, repeated runs, and later ablations.

## Failure policy

Invalid graph output is preserved and not repaired. Runtime and orchestration
failures are written to the run bundle. No failure triggers a silent retry.

`no_leakage_observed` is an audited observation, not an operating-system-level
read-isolation guarantee.
