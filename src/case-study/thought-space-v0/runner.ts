import { appendFile, copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import {
  recordCodexTurn,
  replayTrace,
  type RecordCodexTurnOptions,
  type RecordCodexTurnResult,
  type ReplayResult,
} from "../../trace-inspector/index.js";
import { validateGraphPatch } from "./schema.js";
import { loadThoughtSpaceInputs, preflightThoughtSpaceV0 } from "./preflight.js";
import { applyGraphPatch, emptySnapshot, sha256Text, stableJson } from "./state.js";
import { runAbaRetrieval } from "./retrieval.js";
import {
  auditLeakage,
  auditWorkspaceChanges,
  prepareEncounterWorkspace,
  prepareProbeWorkspace,
  subjectBundleTexts,
  type PreparedSubjectWorkspace,
} from "./workspace.js";
import type {
  LeakageAudit,
  PatchValidation,
  StateDelta,
  ThoughtSpaceRunManifest,
  ThoughtSpaceRunStatus,
  ThoughtSpaceSnapshot,
  TraceLink,
} from "./types.js";

export interface RunThoughtSpaceOptions {
  repositoryRoot?: string;
  now?: Date;
  runId?: string;
}

export interface RunThoughtSpaceDependencies {
  recordTurn?: (options: RecordCodexTurnOptions) => Promise<RecordCodexTurnResult>;
  replay?: (traceId: string) => Promise<ReplayResult>;
}

export interface ThoughtSpaceRunResult {
  runId: string;
  runDirectory: string;
  manifest: ThoughtSpaceRunManifest;
}

const CLAIM_BOUNDARY =
  "This v0 validates an observable external scaffold. It does not estimate primitive or experience-order effects or expose hidden model cognition.";

function defaultRunId(blindId: string, now: Date): string {
  const timestamp = now.toISOString().replace(/\.\d{3}Z$/, "Z").replace(/[-:]/g, "").replace("T", "-");
  return `${blindId}-${timestamp}`;
}

function traceLink(trace: RecordCodexTurnResult): TraceLink {
  return { traceId: trace.traceId, status: trace.status, eventCount: trace.eventCount, runtime: trace.runtime };
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeJsonLines(path: string, values: unknown[]): Promise<void> {
  await writeFile(path, values.length === 0 ? "" : `${values.map((value) => JSON.stringify(value)).join("\n")}\n`, "utf8");
}

function mergeLeakageAudits(left: LeakageAudit, right?: LeakageAudit): LeakageAudit {
  if (right === undefined) return left;
  const statuses = [left.status, right.status];
  const status = statuses.includes("runtime_control_failed")
    ? "runtime_control_failed"
    : statuses.includes("potential_boundary_crossing")
      ? "potential_boundary_crossing"
      : "no_leakage_observed";
  return {
    schemaVersion: "0.1",
    status,
    runtimeChecks: [...left.runtimeChecks.map((item) => `encounter: ${item}`), ...right.runtimeChecks.map((item) => `probe: ${item}`)],
    boundaryFindings: [...left.boundaryFindings.map((item) => `encounter: ${item}`), ...right.boundaryFindings.map((item) => `probe: ${item}`)],
    subjectFiles: [...new Set([...left.subjectFiles, ...right.subjectFiles])].sort(),
    claimBoundary: left.claimBoundary,
  };
}

async function preserveSubjectFile(workspace: PreparedSubjectWorkspace, sourceName: string, destination: string): Promise<string> {
  const source = join(workspace.directory, sourceName);
  try {
    const value = await readFile(source, "utf8");
    await writeFile(destination, value, "utf8");
    return value;
  } catch {
    await writeFile(destination, "", "utf8");
    return "";
  }
}

function statusAfterEncounter(
  trace: RecordCodexTurnResult,
  leakage: LeakageAudit,
  note: string,
  rawPatch: string,
  validation: PatchValidation,
): ThoughtSpaceRunStatus | null {
  if (trace.status !== "completed" || trace.collectorError !== null) return "encounter_failed";
  if (leakage.status === "runtime_control_failed") return "runtime_control_failed";
  if (note.trim() === "" || rawPatch.trim() === "" || !validation.valid) return "invalid_externalization";
  return null;
}

export async function runThoughtSpaceV0(
  options: RunThoughtSpaceOptions = {},
  dependencies: RunThoughtSpaceDependencies = {},
): Promise<ThoughtSpaceRunResult> {
  const repositoryRoot = resolve(options.repositoryRoot ?? process.cwd());
  const loaded = await loadThoughtSpaceInputs(repositoryRoot);
  const preflight = await preflightThoughtSpaceV0(repositoryRoot);
  if (!preflight.passed) throw new Error(`Thought Space preflight failed: ${preflight.checks.filter((check) => !check.passed).map((check) => check.detail).join("; ")}`);
  const now = options.now ?? new Date();
  const runId = options.runId ?? defaultRunId(loaded.config.blindId, now);
  if (!/^S[0-9]{3,}-[A-Za-z0-9_-]+$/.test(runId)) throw new Error(`Unsafe run ID: ${runId}`);
  const runDirectory = resolve(repositoryRoot, ".trace-inspector", "case-studies", "thought-space-v0", "runs", runId);
  await mkdir(dirname(runDirectory), { recursive: true });
  await mkdir(runDirectory, { recursive: false });
  const initialSnapshot = emptySnapshot(loaded.config.blindId);
  let manifest: ThoughtSpaceRunManifest = {
    schemaVersion: "0.1",
    caseStudyId: "thought-space-v0",
    runId,
    blindId: loaded.config.blindId,
    status: "running",
    startedAt: now.toISOString(),
    endedAt: null,
    configHash: sha256Text(stableJson(loaded.config)),
    encounterHash: sha256Text(loaded.encounterText),
    taskHash: sha256Text(loaded.taskText),
    probeTaskHash: sha256Text(loaded.probeTaskText),
    preSnapshotHash: initialSnapshot.hash,
    encounterTrace: null,
    probeTrace: null,
    snapshotHash: null,
    leakageStatus: null,
    noSilentRetry: true,
    claimBoundary: CLAIM_BOUNDARY,
  };
  await writeJson(join(runDirectory, "run-manifest.json"), manifest);
  await writeFile(join(runDirectory, "encounter.md"), loaded.encounterText, "utf8");
  await writeJson(join(runDirectory, "pre-snapshot.json"), initialSnapshot);

  const recordTurn = dependencies.recordTurn ?? recordCodexTurn;
  const replay = dependencies.replay ?? replayTrace;
  let encounterWorkspace: PreparedSubjectWorkspace | undefined;
  let probeWorkspace: PreparedSubjectWorkspace | undefined;
  try {
    encounterWorkspace = await prepareEncounterWorkspace(repositoryRoot, loaded.config, loaded.encounter, initialSnapshot);
    const encounterTrace = await recordTurn({
      prompt: loaded.taskText,
      cwd: encounterWorkspace.directory,
      timeoutMs: loaded.config.runtime.timeoutMs,
      sandboxMode: "workspaceWrite",
      networkAccess: false,
      model: loaded.config.runtime.model,
      reasoningEffort: loaded.config.runtime.reasoningEffort,
    });
    const encounterReplay = await replay(encounterTrace.traceId);
    const encounterWorkspaceAudit = await auditWorkspaceChanges(encounterWorkspace);
    const encounterLeakage = auditLeakage(
      encounterTrace.runtime,
      encounterWorkspace,
      encounterReplay.events,
      await subjectBundleTexts(encounterWorkspace),
      encounterWorkspaceAudit,
      loaded.config.runtime,
    );
    const note = await preserveSubjectFile(encounterWorkspace, "research-note.md", join(runDirectory, "research-note.md"));
    const rawPatch = await preserveSubjectFile(encounterWorkspace, "graph-patch.json", join(runDirectory, "graph-patch.raw.json"));
    let parsedPatch: unknown = null;
    let parseError: string | null = null;
    try {
      parsedPatch = JSON.parse(rawPatch);
    } catch (error) {
      parseError = error instanceof Error ? error.message : String(error);
    }
    const checked = parseError === null
      ? validateGraphPatch(parsedPatch)
      : { patch: null, validation: { valid: false, errors: [`Invalid JSON: ${parseError}`], acceptedOperationLocalIds: [], rejectedOperations: [] } satisfies PatchValidation };
    await writeJson(join(runDirectory, "graph-patch-validation.json"), checked.validation);
    await writeJson(join(runDirectory, "encounter-trace-link.json"), traceLink(encounterTrace));
    await writeJson(join(runDirectory, "encounter-workspace-audit.json"), encounterWorkspaceAudit);
    let finalLeakage = encounterLeakage;
    let status = statusAfterEncounter(encounterTrace, encounterLeakage, note, rawPatch, checked.validation);
    let snapshot: ThoughtSpaceSnapshot | null = null;
    let delta: StateDelta | null = null;

    if (status === null && checked.patch !== null) {
      ({ snapshot, delta } = applyGraphPatch(initialSnapshot, checked.patch, loaded.config));
      await writeJson(join(runDirectory, "state-delta.json"), delta);
      await writeJson(join(runDirectory, "snapshot.json"), snapshot);
      const retrievals = runAbaRetrieval(snapshot, loaded.config);
      await writeJsonLines(join(runDirectory, "retrievals.jsonl"), retrievals);
      if (retrievals.length === 0) {
        status = "insufficient_graph_structure";
      } else {
        const baseline = retrievals[0];
        if (baseline === undefined) throw new Error("Baseline retrieval was not produced.");
        probeWorkspace = await prepareProbeWorkspace(repositoryRoot, loaded.config, baseline.finalContext);
        const probeTrace = await recordTurn({
          prompt: loaded.probeTaskText,
          cwd: probeWorkspace.directory,
          timeoutMs: loaded.config.runtime.timeoutMs,
          sandboxMode: "workspaceWrite",
          networkAccess: false,
          model: loaded.config.runtime.model,
          reasoningEffort: loaded.config.runtime.reasoningEffort,
        });
        const probeReplay = await replay(probeTrace.traceId);
        const probeWorkspaceAudit = await auditWorkspaceChanges(probeWorkspace);
        const probeLeakage = auditLeakage(
          probeTrace.runtime,
          probeWorkspace,
          probeReplay.events,
          await subjectBundleTexts(probeWorkspace),
          probeWorkspaceAudit,
          loaded.config.runtime,
        );
        finalLeakage = mergeLeakageAudits(encounterLeakage, probeLeakage);
        await preserveSubjectFile(probeWorkspace, "response.md", join(runDirectory, "response.md"));
        await writeJson(join(runDirectory, "probe-trace-link.json"), traceLink(probeTrace));
        await writeJson(join(runDirectory, "probe-workspace-audit.json"), probeWorkspaceAudit);
        manifest.probeTrace = traceLink(probeTrace);
        if (probeTrace.status !== "completed" || probeTrace.collectorError !== null) status = "probe_failed";
        else if (finalLeakage.status === "runtime_control_failed") status = "runtime_control_failed";
        else status = "completed";
      }
    }

    if (snapshot === null) {
      await writeJsonLines(join(runDirectory, "retrievals.jsonl"), []);
      await writeFile(join(runDirectory, "response.md"), "", "utf8");
    }
    await writeJson(join(runDirectory, "leakage-audit.json"), finalLeakage);
    manifest = {
      ...manifest,
      status: status ?? "completed",
      endedAt: new Date().toISOString(),
      encounterTrace: traceLink(encounterTrace),
      snapshotHash: snapshot?.hash ?? null,
      leakageStatus: finalLeakage.status,
    };
    await writeJson(join(runDirectory, "run-manifest.json"), manifest);
    await mkdir(dirname(join(runDirectory, "../run-ledger.jsonl")), { recursive: true });
    await appendFile(resolve(runDirectory, "..", "run-ledger.jsonl"), `${JSON.stringify({ runId, status: manifest.status, encounterTraceId: manifest.encounterTrace?.traceId ?? null, probeTraceId: manifest.probeTrace?.traceId ?? null, snapshotHash: manifest.snapshotHash, leakageStatus: manifest.leakageStatus, runManifest: relative(repositoryRoot, join(runDirectory, "run-manifest.json")) })}\n`, "utf8");
    return { runId, runDirectory, manifest };
  } catch (error) {
    manifest = {
      ...manifest,
      status: "orchestration_failed",
      endedAt: new Date().toISOString(),
    };
    await writeJson(join(runDirectory, "run-manifest.json"), manifest);
    await writeJson(join(runDirectory, "orchestration-error.json"), {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    if (encounterWorkspace !== undefined) await rm(encounterWorkspace.directory, { recursive: true, force: true });
    if (probeWorkspace !== undefined) await rm(probeWorkspace.directory, { recursive: true, force: true });
  }
}
