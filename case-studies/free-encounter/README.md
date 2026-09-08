# Free encounters

## Live permutation pilot

`node case-studies/free-encounter/pilot-view.mjs batch-1788843247027`
opens the local read-only dashboard at http://127.0.0.1:4334/.
It refreshes every three seconds, shows the six-order queue, recent trace
activity, notebook and graph before/after, and H001 responses. In-progress
workspace content is labelled draft. The pilot runner advances encounters
automatically; the dashboard does not feed materials or change run state.
The local server must remain running while viewing. No additional packages
or hosted service are required.

Local playground entry point using the existing Trace Inspector collector from
the sibling thought-space checkout (override with TRACE_INSPECTOR_ROOT).

Run from the memorabilia directory:

```sh
node --test case-studies/free-encounter/graph.test.mjs
node case-studies/free-encounter/run.mjs
node case-studies/free-encounter/view.mjs S001-RUN_TIMESTAMP
```

The live runner uses gpt-5.6-sol / medium, a ten-minute maximum per encounter,
workspace-write with networkAccess=true, and approvalPolicy=never. Each encounter
gets a fresh temporary workspace and fresh model thread; the notebook and graph
carry forward. Only the current material is supplied. The model may leave the
graph untouched. No association/decay reducer or probe is added in this mode.

The E002 workspace includes a Python standard-library reader for the designated
Levinas page. The agent must invoke it itself. It saves the actual HTML, extracted
text, URL, timestamp and hashes in web-reads/. The helper is URL-specific; the
underlying network-enabled shell is not a domain-restricted sandbox.

Runs and trace data are stored under ignored .trace-inspector/. Temporary subject
workspaces are preserved. Snapshots, raw graphs, validation, file inventories,
runtime metadata and normalized Trace Inspector events are retained for each
completed turn. Invalid state or a failed turn stops the sequence without retry.
The viewer shows pre/post graphs, node/edge details, notebook and normalized events.

Startup sandbox metadata precedes the turn-level network override; it should not
be read as proof that the override failed or succeeded. Actual webpage receipts
and command events are the evidence for a successful read. Isolation is auditable,
not an OS-level guarantee against all reads outside the workspace.

Implementation status (2026-09-08): the six-order pilot completed 18 encounters and six H001 probes. A three-repeat empty-memory H001 baseline also completed. Earlier pre-execution notes are superseded by ../../docs/project-status.md.

Baseline viewer: PORT=4335 node case-studies/free-encounter/pilot-view.mjs batch-1788881549644

Baseline prompt check (no model): node case-studies/free-encounter/baseline.mjs --check

New three-repeat baseline (model calls): node case-studies/free-encounter/baseline.mjs

The baseline preserves the original prompt envelope, uses empty notebook/graph, and records failures. BASELINE_RESUME accepts only a batch whose existing runs are already audited as completed; it skips those runs without resampling. See ../../docs/baseline-20260908.md for the startup-effort metadata caveat and B1 audit correction.
