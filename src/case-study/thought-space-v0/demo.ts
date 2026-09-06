import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadThoughtSpaceInputs } from "./preflight.js";
import { validateGraphPatch } from "./schema.js";
import { applyGraphPatch, emptySnapshot, sha256Text, stableJson } from "./state.js";
import { runAbaRetrieval } from "./retrieval.js";
import type { LeakageAudit, ThoughtSpaceRunManifest } from "./types.js";

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function prepareThoughtSpaceDemo(repositoryRootInput = process.cwd()): Promise<string> {
  const repositoryRoot = resolve(repositoryRootInput);
  const loaded = await loadThoughtSpaceInputs(repositoryRoot);
  const runId = "S001-demo";
  const runDirectory = resolve(repositoryRoot, ".trace-inspector", "case-studies", "thought-space-v0", "runs", runId);
  await mkdir(runDirectory, { recursive: true });
  const rawPatch = await readFile(resolve(repositoryRoot, "fixtures/case-studies/thought-space-v0/synthetic-patch.json"), "utf8");
  const note = await readFile(resolve(repositoryRoot, "fixtures/case-studies/thought-space-v0/synthetic-note.md"), "utf8");
  const response = await readFile(resolve(repositoryRoot, "fixtures/case-studies/thought-space-v0/synthetic-response.md"), "utf8");
  const checked = validateGraphPatch(JSON.parse(rawPatch));
  if (checked.patch === null) throw new Error(`Synthetic patch invalid: ${checked.validation.errors.join("; ")}`);
  const initial = emptySnapshot(loaded.config.blindId);
  const { snapshot, delta } = applyGraphPatch(initial, checked.patch, loaded.config);
  const retrievals = runAbaRetrieval(snapshot, loaded.config);
  const leakageAudit: LeakageAudit = {
    schemaVersion: "0.1",
    status: "no_leakage_observed",
    runtimeChecks: [],
    boundaryFindings: [],
    subjectFiles: ["concept-map.json", "encounter.md", "graph-patch.json", "research-note.md", "task.md"],
    claimBoundary: "Synthetic fixture only; no live runtime or operating-system isolation claim.",
  };
  const manifest: ThoughtSpaceRunManifest = {
    schemaVersion: "0.1",
    caseStudyId: "thought-space-v0",
    runId,
    blindId: loaded.config.blindId,
    status: "completed",
    startedAt: "2026-09-04T00:00:00.000Z",
    endedAt: "2026-09-04T00:00:01.000Z",
    configHash: sha256Text(stableJson(loaded.config)),
    encounterHash: sha256Text(loaded.encounterText),
    taskHash: sha256Text(loaded.taskText),
    probeTaskHash: sha256Text(loaded.probeTaskText),
    preSnapshotHash: initial.hash,
    encounterTrace: null,
    probeTrace: null,
    snapshotHash: snapshot.hash,
    leakageStatus: leakageAudit.status,
    noSilentRetry: true,
    claimBoundary: "Credential-free synthetic apparatus demo; no live-runtime or causal claim.",
  };
  await writeJson(resolve(runDirectory, "run-manifest.json"), manifest);
  await writeFile(resolve(runDirectory, "encounter.md"), loaded.encounterText);
  await writeFile(resolve(runDirectory, "research-note.md"), note);
  await writeFile(resolve(runDirectory, "graph-patch.raw.json"), rawPatch);
  await writeJson(resolve(runDirectory, "graph-patch-validation.json"), checked.validation);
  await writeJson(resolve(runDirectory, "state-delta.json"), delta);
  await writeJson(resolve(runDirectory, "snapshot.json"), snapshot);
  await writeFile(resolve(runDirectory, "retrievals.jsonl"), `${retrievals.map((item) => JSON.stringify(item)).join("\n")}\n`);
  await writeFile(resolve(runDirectory, "response.md"), response);
  await writeJson(resolve(runDirectory, "leakage-audit.json"), leakageAudit);
  return runId;
}
