import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp, mkdir, symlink, writeFile, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import { mapPilotEncounter, type PilotSourceBundle } from "./adapters/map-pilot.js";
import { LocalPilotReader, PilotSourceError } from "./adapters/local-pilot-reader.js";

function bundle(overrides: Partial<PilotSourceBundle> = {}): PilotSourceBundle {
  return {
    batchId: "batch-1",
    runId: "WLK-1",
    step: {eid: "t01", material: "W", traceId: "trace-1", status: "completed", accepted: true},
    config: {timeoutMs: 600_000},
    trace: {traceId: "trace-1", status: "completed"},
    traceManifest: {startedAt: "2026-09-09T00:00:00.000Z", endedAt: "2026-09-09T00:00:03.000Z", status: "completed", eventCount: 2},
    events: [
      {schemaVersion: "0.1", eventId: "trace-1:1", traceId: "trace-1", sequence: 1, source: "codex", sourceEventType: "turn/started", kind: "turn.started", occurredAt: "2026-09-09T00:00:01.000Z", title: "Turn started", evidenceLevel: "observed", attributes: {}, rawRef: {file: "raw.jsonl", sequence: 1}},
      {schemaVersion: "0.1", eventId: "trace-1:2", traceId: "trace-1", sequence: 2, source: "codex", sourceEventType: "turn/completed", kind: "turn.completed", occurredAt: "2026-09-09T00:00:03.000Z", status: "completed", title: "Turn completed", evidenceLevel: "observed", attributes: {}, rawRef: {file: "raw.jsonl", sequence: 2}},
    ],
    before: {notebook: "", graph: {nodes: [], edges: []}},
    graphAfter: {nodes: [{id: "self_observer", label: "The observer / self", description: "A concept", extra: "kept"}], edges: []},
    notebookAfter: "A note\n",
    acceptedState: {notebook: "A note\n", graph: {nodes: [{id: "self_observer", label: "The observer / self", description: "A concept", extra: "kept"}], edges: []}},
    ...overrides,
  };
}

test("maps an accepted pilot step into shared timeline and endpoint histories", () => {
  const result = mapPilotEncounter(bundle()).view;
  assert.equal(result.encounter.id, "batch-1/WLK-1/t01");
  assert.equal(result.encounter.title, "Simone Weil — Gravity and Grace");
  assert.equal(result.events[0]?.position.elapsedMs, 1_000);
  assert.equal(result.events[1]?.position.order, 2);
  assert.equal(result.graph.coverage, "endpoints_only");
  assert.deepEqual(result.graph.versions.map(version => version.content.nodes.length), [0, 1]);
  assert.equal(result.graph.versions[1]?.content.nodes[0]?.description, "A concept");
  assert.equal(result.graph.versions[1]?.content.nodes[0]?.attributes.extra, "kept");
  assert.equal(result.notebook.versions[1]?.content, "A note\n");
  assert.equal(result.live, false);
});

test("keeps a rejected endpoint visible and does not treat it as accepted memory", () => {
  const result = mapPilotEncounter(bundle({step: {...bundle().step, accepted: false, status: "failed", error: "invalid graph"}, trace: {traceId: "trace-1", status: "completed"}})).view;
  assert.equal(result.encounter.status, "failed");
  assert.equal(result.graph.versions[1]?.acceptance, "rejected");
  assert.equal(result.graph.versions[1]?.origin, "end_checkpoint");
});

test("distinguishes an invalid graph from an empty graph", () => {
  const result = mapPilotEncounter(bundle({graphAfter: {nodes: [{id: "broken", label: "broken"}], edges: [{id: "dangling", source: "broken", target: "missing", label: "x"}]}})).view;
  assert.equal(result.graph.versions.length, 1);
  assert.match(result.graph.issues[0]?.message ?? "", /after graph invalid/);
  assert.equal(result.graph.versions[0]?.content.nodes.length, 0);
});

test("reports accepted-state mismatch and unavailable timing as diagnostics", () => {
  const result = mapPilotEncounter(bundle({
    acceptedState: {notebook: "different\n", graph: {nodes: [], edges: []}},
    traceManifest: {startedAt: "", endedAt: null, status: "completed", eventCount: 0},
  })).view;
  assert.equal(result.encounter.status, "failed");
  assert.equal(result.graph.versions[1]?.acceptance, "rejected");
  assert.equal(result.diagnostics.length, 2);
  assert.match(result.diagnostics.map(item => item.message).join(" "), /accepted-state/);
  assert.match(result.diagnostics.map(item => item.message).join(" "), /startedAt/);
});

test("reader loads a pilot bundle and rejects a symlinked run directory", async () => {
  const root = await mkdtemp(join(tmpdir(), "memorabilia-workbench-"));
  try {
    const pilotRoot = join(root, ".trace-inspector", "permutation-pilot");
    const batch = join(pilotRoot, "batch-1");
    const run = join(batch, "WLK-1");
    const step = join(run, "t01");
    const trace = join(root, ".trace-inspector", "traces", "trace-1");
    await mkdir(step, {recursive: true});
    await mkdir(trace, {recursive: true});
    await writeFile(join(batch, "config.json"), JSON.stringify({timeoutMs: 600000}));
    await writeFile(join(batch, "summary.json"), JSON.stringify({status: "completed", runs: [{id: "WLK-1", order: "WLK", status: "completed", steps: [{eid: "t01", material: "W", traceId: "trace-1", status: "completed", accepted: true}]}]}));
    await writeFile(join(step, "before.json"), JSON.stringify({notebook: "", graph: {nodes: [], edges: []}}));
    await writeFile(join(step, "graph-after.raw.json"), JSON.stringify({nodes: [], edges: []}));
    await writeFile(join(step, "notebook-after.md"), "note");
    await writeFile(join(step, "accepted-state.json"), JSON.stringify({notebook: "note", graph: {nodes: [], edges: []}}));
    await writeFile(join(step, "events.json"), "[]");
    await writeFile(join(step, "trace.json"), JSON.stringify({traceId: "trace-1", traceDirectory: ".trace-inspector/traces/trace-1", status: "completed"}));
    await writeFile(join(trace, "manifest.json"), JSON.stringify({startedAt: "2026-09-09T00:00:00.000Z", endedAt: "2026-09-09T00:00:01.000Z", status: "completed", eventCount: 0}));
    const reader = new LocalPilotReader(pilotRoot);
    const summaries = await reader.listEncounters();
    assert.equal(summaries.length, 1);
    assert.equal(summaries[0]?.id, "batch-1/WLK-1/t01");
    assert.equal((await reader.getEncounter("batch-1/WLK-1/t01")).encounter.status, "completed");
    await rm(run, {recursive: true, force: true});
    await symlink(root, run, "dir");
    await assert.rejects(() => reader.listEncounters(), (error: unknown) => error instanceof PilotSourceError && /outside pilot root/.test(error.message));
  } finally {
    await rm(root, {recursive: true, force: true});
  }
  assert.ok(true, "filesystem fixture setup is covered by mapping tests; live reader uses the same source shape");
});
