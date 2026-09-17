# Encounter / Probe Barrier — Design v0.1

Status: proposed protocol, not implemented or validated by this document.
Date: 2026-09-14

## Purpose and scope

Memorabilia remains an environment for building and observing persistent external memory. This protocol adds non-writing observation branches after accepted encounters. It does not redefine the project as a benchmark or assert access to internal model representations.

Question: under a specified encounter history and memory condition, does a frozen memory state change subsequent probe responses?

Isolation prevents probe-induced contamination of the main trajectory. It does not by itself establish divergence, an order effect, recall improvement, personality development, or care. Existing H001 observations are exploratory; the proposed effect sizes, significance claims and plots in the supplied discussion are examples, not results.

First implementation: one existing runtime, notebook + graph checkpoints, an empty-memory control, synthetic public fixtures, and isolation tests. Multi-provider support, multimodality, new memory dynamics and scoring dashboards are outside this slice.

## Existing implementation

- case-studies/free-encounter/pilot.mjs: accepts notebook/graph state after encounters; runs H001 only after three encounters; uses a separate temporary probe workspace, readOnly runtime mode, and embeds full memory into the prompt. This is full-context provision, not selective retrieval.
- The pilot records a probe state hash, but lacks a reusable per-checkpoint branch barrier and an audit proving next-encounter equivalence with versus without probes.
- Its tool check covers selected normalized event kinds. case-studies/free-encounter/probe-prompt.mjs has a broader raw item-start classifier already used by baseline code; unsupported operation types require review.
- Historical free-encounter runs dynamically imported a collector from `TRACE_INSPECTOR_ROOT` or `../thought-space`; their recorded runtime provenance remains authoritative. Current scripts import the integrated `src/trace-inspector/` module after a local build and no longer depend on a sibling checkout.
- src/case-study/thought-space-v0/runner.ts: separate probe workspace, retrieval records, workspace/leakage audits. It allows response.md in a disposable writable workspace. This illustrates why controlled output writes can be acceptable while writes to canonical memory cannot.
- `src/trace-inspector/collector/codex-app-server.ts` uses a fresh ephemeral thread/start. Fresh thread and readOnly alone do not prove complete isolation of filesystem reads, external stores or provider-side state.

## Two lanes, one-way data transfer

Main lane:
  accepted S0 -> encounter E1 -> accepted S1 -> encounter E2 -> accepted S2

Observation lane:
  S1 -> isolated copy -> context construction -> fresh probe P1 -> external report
  S2 -> isolated copy -> context construction -> fresh probe P2 -> external report

There is no report-to-main-lane edge. P1 and P2 are separate sessions, including when the question is identical. The next encounter consumes the accepted checkpoint, never a probe workspace or probe session.

Checkpoint creation happens after all specified encounter/consolidation writes finish. Background writers are paused for this serial v0 protocol. No query-aware consolidation is allowed against canonical state during probing.

## What the checkpoint covers

A versioned manifest lists exactly the persistent state that the next encounter may consume:

- graph and notebook bytes, with stable IDs and per-file hashes;
- diary, profile, semantic records, temporal revisions and other stores if later introduced;
- index/config versions and deterministic rebuild inputs where retrieval indexes are derived;
- any counters or RNG state that actually influence future behavior;
- parent checkpoint, producing encounter, schema version, model/runtime settings and code version.

Hashes cover canonical file ordering, paths and bytes, not object key order chosen accidentally by a serializer. No silent context truncation: a capacity violation is an explicit outcome.

The initial implementation exports only graph and notebook. Extending the backend requires extending export/restore and the audit together; unlisted live state must not become a hidden dependency.

## Barrier invariants

B1 — No probe material enters the encounter input.
Questions, answers, gold labels, scoring instructions, observer notes and probe traces are stored outside the subject-visible input bundle.

B2 — No shared mutable memory.
Probe retrieval and answer generation operate on an isolated export. TypeScript readonly declarations alone are insufficient. Do not hand a probe a writable backend handle.

B3 — Fresh conversational context.
Every probe starts a fresh session with no encounter chat history or previous probe turns. Only the specified checkpoint-derived context crosses the boundary.

B4 — Retrieval has no canonical side effects.
Read counts, access timestamps, salience reinforcement, caches, embeddings, graph links and query logs must not update canonical state. If a backend mutates on search, search a disposable clone. Capture those mutations in the observation lane if useful.

B5 — Outputs remain outside the main trajectory.
Reports and retrieval traces never enter later ingestion, dreaming, summary jobs or directory scans. Merely storing them in a different folder is not enough if a future job scans both folders.

B6 — Exact continuation input.
Canonical state and next-encounter input hashes before/after a probe must match, excluding explicitly documented observer-only metadata. Tests compare inputs, not stochastic LLM answers.

B7 — Honest failure status.
A failed or interrupted answer is not a memory failure. A barrier violation or unverifiable required check makes the observation invalid. Canonical integrity uncertainty blocks continuation pending recovery from the last verified checkpoint.

B8 — No future-information leakage.
A historical checkpoint cannot use an index built from later encounters. Gold answers and expected sources belong only to the evaluator, never to the retriever or answer model.

These guarantees cover the controlled local harness. They do not establish isolation of unobservable hosted-provider internals or eliminate temporal changes to a provider model.

## Probe transaction

1. Validate and freeze accepted checkpoint S_i; record hashes and parent.
2. Export a minimal isolated state copy and construct the intended condition.
3. Retrieve locally from that copy, or serialize full-context graph/notebook for v0.
4. Freeze the exact resulting context, its order and hashes.
5. Start a fresh answering session. Supply the question and context; do not expose canonical paths, evaluator files or prior probes.
6. Disable tool access where supported. A prompt saying 'do not use tools' is not enforcement. For a runtime that cannot disable tools, use restricted read visibility and classify attempted operations; an attempted disallowed operation invalidates the observation.
7. Record answer, runtime evidence and failures outside the subject bundle.
8. Re-audit canonical state, branch writes, access boundaries and continuation input.
9. Release disposable resources. Advance the main lane only from S_i when integrity checks pass.

An empty working directory plus readOnly does not necessarily restrict reads to that directory. Verify the actual runtime sandbox. If it cannot exclude repository/probe files, use a stronger execution boundary or a tool-free answer API before claiming the strong barrier passed.

No automatic retries chosen by answer quality. A predeclared infrastructure retry receives a new attempt ID and preserves the failed attempt.

## Memory conditions

First comparison: SAME checkpoint, SAME question, SAME answering configuration.

- M+: checkpoint memory is provided (initially full-context).
- M-: identical envelope and question with empty memory fields; no hidden retrieval or session history.

M- is an inference-time memory withholding condition. It is not an independently developed no-memory trajectory. Testing development without memory requires a separate protocol.

Record different context lengths as part of the intervention; do not claim token-matched control. Optional length controls can be added later.

Repeated probes at multiple checkpoints are dependent observations. Do not count them as independent agents, and do not equate variation in wording with a stable behavioral effect. Freeze probe definitions before an evaluated run; record subsequent protocol revisions.

## Observation record

Required:
- protocolVersion, runId, trajectoryId, encounterId, checkpointId;
- checkpointHash, probeId, probeVersion, questionHash, condition, attempt;
- actual runtime/model settings, collector revision, timestamps;
- retrievalMode: full_context | search | empty;
- candidate IDs, selected IDs/versions, source references and ranks where applicable;
- exact provided context hash and artifact reference;
- answer/trace artifact references;
- barrierStatus: passed | violated | unverifiable;
- barrier checks with evidence references;
- executionStatus independent of barrierStatus and score.

Full-context mode records provided artifacts and marks retrieval ranks not applicable.
Expected-source labels, rubric and scores are evaluator-only records.

Potential observation events:
probe.started, probe.context_prepared, probe.completed,
probe.failed, probe.barrier_checked.

These are harness lifecycle events, not inferred cognition. Future activation visuals distinguish retrieved candidates, actually provided records, and model citations.

## Acceptance tests (before a paid model run)

1. Inserting a mock probe between E1 and E2 preserves canonical bytes and E2's declared input bundle.
2. A malicious mock probe tries to overwrite graph/notebook and create a new memory file; canonical state remains unchanged and the violation is reported.
3. A retriever mutates access counts or salience; only the isolated branch changes.
4. Canary text from question, answer and evaluator notes never appears in later encounter inputs or consolidation inputs. This is a regression check, not a proof against all leakage.
5. Two probes cannot see each other's turns, scratch files or results.
6. M+ and M- use the same checkpoint and question; M- supplies zero memory content.
7. Timeout, crash and restart cannot promote probe state to the main checkpoint.
8. Historical retrieval cannot access records introduced after the selected checkpoint.
9. Runtime capability audit detects unrestricted read access or unsupported tools rather than labeling the run clean.
10. Failed encounter output is not promoted to an accepted checkpoint and is not silently probed as accepted state.

Use synthetic material with deliberately changing facts and interpretations. Publish fixtures and expected invariants; do not reuse private book passages.

## Minimal implementation plan

1. Extract pure checkpoint export and next-input construction functions from the existing workflow, preserving old experiment scripts.
2. Add one isolated probe runner and audit record, with a mock runtime for the acceptance tests.
3. Add a public two-encounter fixture with a probe after each encounter and M+/M- branches.
4. Run an explicitly requested small live smoke test; do not launch expensive replications as part of design work.
5. Connect reports to the workbench after the evidence chain works. Select a probe without merging its records into encounter memory.

Use a snapshot-scoped read interface instead of introducing a large backend registry. A future general write/retrieve/snapshot/reset backend may sit behind it; the observation lane must not receive write/reset capabilities.

## Decisions still open

- Primary probe target: factual recall, interpretation revision, or another preregistered construct? H001 can remain an exploratory behavioral probe, not a recall accuracy metric.
- What runtime can enforce the strong filesystem/tool boundary with acceptable effort?
- When selective retrieval arrives, which state is authoritative and which indexes can be rebuilt?
- If scheduled consolidation becomes wall-clock dependent, should probe time pause logical development time? v0 is serial and event-driven to avoid this confound.

Design agreement and implementation acceptance are separate milestones. No new experiment, score, or claim of demonstrated divergence is produced by this document.
