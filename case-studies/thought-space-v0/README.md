# Thought Space v0

Thought Space v0 is a bounded apparatus-validation case study. It records one
neutral research encounter, preserves the agent's explicit note and graph
proposal, applies a versioned external-state update, and tests whether the
resulting topology changes deterministic retrieval before a separate probe
turn consumes the retrieved context.

The unit of analysis is the base model plus its external scaffold. This case
does not expose hidden cognition, estimate a primitive effect, or test
experience-order effects.

## Commands

```bash
npm run preflight:thought-space-v0
npm run demo:thought-space-v0
npm run run:thought-space-v0
npm run view:thought-space-v0 -- <run-id>
npm run test:thought-space-v0
```

Real traces and model outputs stay under the ignored `.trace-inspector/`
directory. The tracked `examples/synthetic-v0-run/` export is credential-free
and uses the same viewer data contract.

## Evidence boundary

- Runtime messages, commands, files, and checksums are observed.
- Research notes, attention statements, and graph proposals are model-reported.
- Accepted graph state, deterministic traversal, and leakage flags are inferred
  by versioned local rules.
- `no_leakage_observed` means the audit found no boundary crossing. It is not a
  claim of operating-system-level read isolation.
