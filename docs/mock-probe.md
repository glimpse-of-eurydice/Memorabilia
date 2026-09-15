# Mock probe barrier

Run `npm run probe:mock`. This invokes no model and writes an isolated report to
`.trace-inspector/mock-probe/<id>/report.json`. Tests are included in `npm test`.

The fixture uses two synthetic workshop materials and a manually authored first
checkpoint. It compares the next encounter input with and without M+, M-, and
an adversarial probe. The latter mutates its disposable notebook/graph and tries
to create a diary record through a blocked write capability. Its observation is
marked violated, while canonical continuation remains unchanged.

M+ provides the full checkpoint; M- supplies empty memory with the same question.
Responses are deterministic mock strings, not measurements of recall or divergence.
No second real encounter is executed: its exact input is constructed and compared.

## Boundary

This is an in-process data-flow prototype, not an operating-system sandbox.
Runtime callbacks are trusted test doubles with no canonical backend passed in.
Arbitrary JavaScript could still access filesystem/global state. Session IDs
demonstrate fresh invocation identity, not provider session isolation. Mutation
audits compare final disposable state, not all transient writes.

Checkpoint snapshots contain only notebook and graph; additional future memory
stores must extend the export and audit. Hashing uses exact serialized bytes.
Real runtime read restrictions, tool enforcement, timeouts, crash recovery,
historical indexes and background consolidation remain unimplemented.

## Preparing encounter materials

Start with a small text-only set so perception errors do not confound memory.
Each material should record an ID, original text, source/permission, ordering,
and what is explicitly stated versus inferred. Keep probe questions and expected
sources in a separate evaluator-only file, not in subject materials.

Useful contrasts: a concrete episode; a competing account; an explicit correction;
an ambiguous addition that should not erase the earlier record; and ordinary
conversation or entertainment with no required lesson. Topic variety is welcome,
but define the behavioral question before expanding disciplines or modalities.

Avoid inserting unique probe-only wording into the encounters. State whether a
probe tests factual recall or interpretation; philosophical readings do not have
a single gold interpretation. Public fixtures should be self-authored or clearly
licensed. Later multimodal fixtures need frozen source files, not just mutable
links, plus a record of exactly what text/images/frames the model received.
