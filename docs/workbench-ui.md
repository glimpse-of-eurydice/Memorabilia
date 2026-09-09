# Encounter workbench

Run `npm run workbench`, then open http://127.0.0.1:4336/. `PORT` changes the port;
`PILOT_ROOT` selects the local permutation-pilot data directory. The default is
`.trace-inspector/permutation-pilot`. Existing viewers remain separate.

The workbench reads local historical encounters through `WorkbenchReader`.
It does not launch a model or modify experiment artifacts. The local source data
is intentionally ignored by Git; a fresh clone needs an available pilot dataset.

## Interaction

- Select a trajectory and material. The initial view is the end checkpoint.
- Drag the horizontal timeline to inspect the latest recorded graph and notebook
  at that time. The entire budget remains visible after an early finish.
- Click a trace event to select its exact timestamp and sequence. The full trace
  stays available and the selected event is highlighted.
- Use “结束快照” to select the checkpoint after the last event. Equal timestamps
  do not imply that an event and checkpoint have the same ordering.
- Select a graph node to read its label, description and stable ID.

Graph positions are a deterministic force layout of the union of captured graph
versions. Position is presentation, not evidence of time, importance or clustering.
Inherited and newly added nodes use distinct fills. Graph and notebook resolve
their versions separately against the shared cursor in `src/workbench/select-at.ts`.

## Limits

The pilot adapter has only before/after artifacts. The UI labels this gap and
holds the last recorded state; it does not reconstruct intermediate writes or
animate invented node creation. It shows recorded trace events, not hidden model
thoughts. Agent remarks remain empty unless supplied by the adapter.

This first surface is historical playback. Live subscriptions, runtime artifact
capture, conversation, long-term memory and dream consolidation are not implemented.
Notebook renders Markdown headings, emphasis, nested lists, quotations, links,
code blocks and tables with markdown-it. Raw HTML is escaped and unsafe link
protocols are rejected. The parser is served locally, without a CDN.

Validation: selection ordering and read-only HTTP routes are covered in
`src/workbench/selection.test.ts`. Browser visual/interaction acceptance remains
a separate manual step.
