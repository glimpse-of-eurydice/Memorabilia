# Memory boundary (planned v0.2)

This directory is reserved for Memorabilia's accepted external-memory state:
episodes, world representations, provenance, retrieval context construction,
and parameterized accessibility or persistence policies.

No v0.2 memory implementation exists here yet. The design contract is in
`docs/memorabilia-v0.2-memory-dialogue-design.md`. Runtime evidence belongs to
`src/trace-inspector/`; model-call orchestration belongs to `src/observation/`
or `src/consolidation/`; read-only projections belong to `src/workbench/`.
