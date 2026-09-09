import test from "node:test";
import assert from "node:assert/strict";
import { mapPilotEncounter, type PilotSourceBundle } from "./adapters/map-pilot.js";

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
    acceptedState: {notebook: "A note\n"},
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
