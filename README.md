# Thought Space

Thought Space is an experimental scaffold for studying how persistent external
information organization develops across encounters and affects later
retrieval and interpretation.

This repository freezes **Thought Space apparatus v0.1.0**. The frozen version
validates one four-layer loop:

```text
Encounter trace
→ agent-authored note and graph patch
→ validated persistent snapshot
→ deterministic retrieval intervention
→ fresh probe turn
```

v0 is apparatus validation. It does not estimate primitive effects, experience
order effects, hidden model cognition, or human-like memory.

## Quick start

Requirements: Node.js 22 or later. A real run additionally requires a local
Codex Desktop app-server installation.

```bash
npm install
npm test
npm run preflight
npm run demo
npm run view -- S001-demo
```

Run one live, network-disabled encounter:

```bash
npm run run
npm run view -- <run-id>
```

The live subject receives only the neutral workspace files declared by the
protocol. Research code, hypotheses, evaluator material, and condition names
are not copied into its temporary workspace.

## Repository map

- `case-studies/thought-space-v0/`: claim boundary and standalone UI assets
- `fixtures/case-studies/thought-space-v0/`: frozen config, encounter, subject
  task, and credential-free synthetic inputs
- `src/case-study/thought-space-v0/`: schema, isolation checks, reducer,
  retrieval, runner, viewer, and tests
- `src/{collector,replay,adapters,analysis,core,server,store}/`: the minimal
  Trace Inspector substrate required by this frozen apparatus
- `examples/synthetic-v0-run/`: inspectable public output with no live trace or
  credential
- `docs/`: apparatus boundary, reproduction protocol, and source provenance

## Data boundary

All real runs are written below ignored `.trace-inspector/`. Do not force-add
that directory. Raw traces may contain local paths, runtime metadata, prompts,
and model outputs. Public examples must be synthetic or pass a separate export
and privacy audit.

See [the frozen apparatus contract](docs/apparatus-v0.md),
[reproduction instructions](docs/reproduction.md), and
[source provenance](docs/source-provenance.json).
