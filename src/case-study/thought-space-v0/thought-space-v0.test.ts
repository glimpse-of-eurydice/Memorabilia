import assert from "node:assert/strict";
import { readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import type { RecordCodexTurnOptions, RecordCodexTurnResult, TraceEvent } from "../../trace-inspector/index.js";
import { prepareThoughtSpaceDemo } from "./demo.js";
import { preflightThoughtSpaceV0, loadThoughtSpaceInputs } from "./preflight.js";
import { runAbaRetrieval } from "./retrieval.js";
import { runThoughtSpaceV0 } from "./runner.js";
import { resolveInside, validateConfig, validateGraphPatch } from "./schema.js";
import { applyGraphPatch, emptySnapshot } from "./state.js";
import type { GraphPatch, ThoughtSpaceConfig } from "./types.js";
import { auditLeakage, auditWorkspaceChanges, prepareEncounterWorkspace, subjectBundleTexts } from "./workspace.js";

const ROOT = process.cwd();

async function validInputs(): Promise<{ config: ThoughtSpaceConfig; patch: GraphPatch }> {
  const loaded = await loadThoughtSpaceInputs(ROOT);
  const patch = validateGraphPatch(JSON.parse(await readFile(resolve(ROOT, "fixtures/case-studies/thought-space-v0/synthetic-patch.json"), "utf8"))).patch;
  assert.notEqual(patch, null);
  return { config: loaded.config, patch: patch as GraphPatch };
}

function runtime(cwd: string) {
  return {
    userAgent: "Codex Desktop/test",
    cliVersion: "test",
    platformFamily: "unix",
    platformOs: "macos",
    model: "gpt-5.6-sol",
    modelProvider: "openai",
    serviceTier: "default",
    reasoningEffort: "medium",
    approvalPolicy: "never",
    sandbox: { type: "workspaceWrite", writableRoots: [cwd], networkAccess: false },
    runtimeWorkspaceRoots: [cwd],
    instructionSources: [],
    multiAgentMode: "explicitRequestOnly",
  };
}

function traceResult(traceId: string, cwd: string): RecordCodexTurnResult {
  return { traceId, traceDirectory: `.trace-inspector/traces/${traceId}`, rawFile: `.trace-inspector/traces/${traceId}/raw.jsonl`, eventCount: 1, status: "completed", collectorError: null, runtime: runtime(cwd) };
}

function commandEvent(traceId: string, command: string): TraceEvent {
  return {
    schemaVersion: "0.1",
    eventId: `${traceId}:1`,
    traceId,
    sequence: 1,
    source: "codex",
    sourceEventType: "item/completed",
    kind: "command.completed",
    occurredAt: "2026-09-04T00:00:00.000Z",
    status: "completed",
    title: command,
    evidenceLevel: "observed",
    attributes: { item: { command } },
    rawRef: { file: "raw.jsonl", sequence: 1 },
  };
}

test("preflight validates the frozen subject bundle", async () => {
  const result = await preflightThoughtSpaceV0(ROOT);
  assert.equal(result.passed, true);
  assert.equal(result.config.runtime.networkAccess, false);
});

test("config rejects unsafe controls and graph patch rejects dangling edges", async () => {
  const { config, patch } = await validInputs();
  assert.throws(() => validateConfig({ ...config, runtime: { ...config.runtime, networkAccess: true } }));
  assert.throws(() => resolveInside(ROOT, "../outside.json"));
  const bad = structuredClone(patch);
  const edge = bad.operations.find((operation) => operation.op === "add_edge");
  assert.notEqual(edge, undefined);
  if (edge?.op === "add_edge") edge.targetRef = "missing";
  const checked = validateGraphPatch(bad);
  assert.equal(checked.validation.valid, false);
  assert.ok(checked.validation.rejectedOperations.some((item) => item.reason.includes("dangling")));
});

test("state replay is deterministic and separates primitive changes", async () => {
  const { config, patch } = await validInputs();
  const initial = emptySnapshot(config.blindId);
  const first = applyGraphPatch(initial, patch, config);
  const second = applyGraphPatch(initial, patch, config);
  assert.equal(first.snapshot.hash, second.snapshot.hash);
  assert.equal(first.snapshot.edges[0]?.weight, 1.25);
  assert.ok(first.delta.primitiveGenerated.some((item) => item.op === "association_reinforcement"));
  const disabled = structuredClone(config);
  disabled.primitiveSeed.association.enabled = false;
  const withoutAssociation = applyGraphPatch(initial, patch, disabled);
  assert.equal(withoutAssociation.snapshot.edges[0]?.weight, 1);

  const decayPatch = structuredClone(patch);
  decayPatch.activatedRefs = [];
  const decayed = applyGraphPatch(first.snapshot, decayPatch, config);
  assert.ok(decayed.delta.primitiveGenerated.some((item) => item.op === "decay_node"));
  assert.ok(decayed.delta.primitiveGenerated.some((item) => item.op === "decay_edge"));
});

test("ABA retrieval removes and reinstates the diagnostic path", async () => {
  const { config, patch } = await validInputs();
  const { snapshot } = applyGraphPatch(emptySnapshot(config.blindId), patch, config);
  const [baseline, knockout, reinstatement] = runAbaRetrieval(snapshot, config);
  assert.ok((baseline?.traversedEdgeIds.length ?? 0) > 0);
  assert.equal(knockout?.interventionEdgeId, snapshot.edges[0]?.id);
  assert.equal(knockout?.traversedEdgeIds.includes(snapshot.edges[0]?.id ?? ""), false);
  assert.deepEqual(reinstatement?.traversedEdgeIds, baseline?.traversedEdgeIds);
  assert.equal(reinstatement?.finalContextHash, baseline?.finalContextHash);
});

test("leakage audit detects traversal and validates subject inventory", async () => {
  const loaded = await loadThoughtSpaceInputs(ROOT);
  const workspace = await prepareEncounterWorkspace(ROOT, loaded.config, loaded.encounter, emptySnapshot(loaded.config.blindId));
  try {
    const workspaceAudit = await auditWorkspaceChanges(workspace);
    const clean = auditLeakage(runtime(workspace.directory), workspace, [commandEvent("clean", "sed -n '1,200p' encounter.md")], await subjectBundleTexts(workspace), workspaceAudit);
    assert.equal(clean.status, "no_leakage_observed");
    const escaped = auditLeakage(runtime(workspace.directory), workspace, [commandEvent("escaped", "find ../.. -type f")], await subjectBundleTexts(workspace), workspaceAudit);
    assert.equal(escaped.status, "potential_boundary_crossing");
  } finally {
    await rm(workspace.directory, { recursive: true, force: true });
  }
});

test("mocked runner completes both fresh turns without retry", async () => {
  const patchText = await readFile(resolve(ROOT, "fixtures/case-studies/thought-space-v0/synthetic-patch.json"), "utf8");
  const runId = "S001-test-integration";
  const runDirectory = resolve(ROOT, ".trace-inspector", "case-studies", "thought-space-v0", "runs", runId);
  const calls: RecordCodexTurnOptions[] = [];
  try {
    const result = await runThoughtSpaceV0(
      { repositoryRoot: ROOT, runId, now: new Date("2026-09-04T00:00:00.000Z") },
      {
        recordTurn: async (options) => {
          calls.push(options);
          if (calls.length === 1) {
            await writeFile(resolve(options.cwd, "research-note.md"), "Evidence-led note.");
            await writeFile(resolve(options.cwd, "graph-patch.json"), patchText);
            return traceResult("trace_encounter_test", options.cwd);
          }
          await writeFile(resolve(options.cwd, "response.md"), "Evidence supports the relation; the broader trade-off is inferred.");
          return traceResult("trace_probe_test", options.cwd);
        },
        replay: async (traceId) => ({ events: [commandEvent(traceId, traceId.includes("encounter") ? "cat encounter.md" : "cat retrieved-context.md")], spans: [], findings: [] }),
      },
    );
    assert.equal(result.manifest.status, "completed");
    assert.equal(result.manifest.leakageStatus, "no_leakage_observed");
    assert.equal(calls.length, 2);
    assert.notEqual(calls[0]?.cwd, calls[1]?.cwd);
    assert.equal(result.manifest.probeTrace?.traceId, "trace_probe_test");
    assert.notEqual(result.manifest.snapshotHash, null);
  } finally {
    await rm(runDirectory, { recursive: true, force: true });
  }
});

test("unexpected orchestration errors are preserved without retry", async () => {
  const runId = "S001-test-orchestration-error";
  const runDirectory = resolve(ROOT, ".trace-inspector", "case-studies", "thought-space-v0", "runs", runId);
  let calls = 0;
  try {
    await assert.rejects(() => runThoughtSpaceV0(
      { repositoryRoot: ROOT, runId, now: new Date("2026-09-04T00:00:00.000Z") },
      {
        recordTurn: async () => {
          calls += 1;
          throw new Error("collector unavailable");
        },
      },
    ));
    assert.equal(calls, 1);
    const manifest = JSON.parse(await readFile(resolve(runDirectory, "run-manifest.json"), "utf8")) as { status: string; noSilentRetry: boolean };
    const preservedError = JSON.parse(await readFile(resolve(runDirectory, "orchestration-error.json"), "utf8")) as { message: string };
    assert.equal(manifest.status, "orchestration_failed");
    assert.equal(manifest.noSilentRetry, true);
    assert.equal(preservedError.message, "collector unavailable");
  } finally {
    await rm(runDirectory, { recursive: true, force: true });
  }
});

test("credential-free demo contains no private paths or credentials", async () => {
  const runId = await prepareThoughtSpaceDemo(ROOT);
  const directory = resolve(ROOT, ".trace-inspector", "case-studies", "thought-space-v0", "runs", runId);
  const files = [
    "encounter.md",
    "graph-patch-validation.json",
    "graph-patch.raw.json",
    "leakage-audit.json",
    "research-note.md",
    "response.md",
    "retrievals.jsonl",
    "run-manifest.json",
    "snapshot.json",
    "state-delta.json",
  ];
  try {
    const generated = await Promise.all(files.map((file) => readFile(resolve(directory, file), "utf8")));
    const tracked = await Promise.all(files.map((file) => readFile(resolve(ROOT, "examples", "synthetic-v0-run", file), "utf8")));
    assert.deepEqual(generated, tracked);
    const serialized = generated.join("\n");
    assert.doesNotMatch(serialized, /\/(?:Users|home)\//);
    assert.doesNotMatch(serialized, /(?:api[_-]?key|bearer\s+[a-z0-9._-]+)/i);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
