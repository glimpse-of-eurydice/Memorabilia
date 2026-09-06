import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { auditSubjectText, resolveInside, validateConfig, validateEncounter } from "./schema.js";
import type { EncounterManifest, ThoughtSpaceConfig } from "./types.js";

export interface ThoughtSpacePreflight {
  schemaVersion: "0.1";
  passed: boolean;
  config: ThoughtSpaceConfig;
  encounter: EncounterManifest;
  checks: Array<{ name: string; passed: boolean; detail: string }>;
}

export async function loadThoughtSpaceInputs(repositoryRootInput = process.cwd()): Promise<{
  config: ThoughtSpaceConfig;
  encounter: EncounterManifest;
  encounterText: string;
  taskText: string;
  probeTaskText: string;
}> {
  const repositoryRoot = resolve(repositoryRootInput);
  const config = validateConfig(JSON.parse(await readFile(resolveInside(repositoryRoot, "fixtures/case-studies/thought-space-v0/config.json"), "utf8")));
  const encounter = validateEncounter(JSON.parse(await readFile(resolveInside(repositoryRoot, config.encounterManifest), "utf8")));
  return {
    config,
    encounter,
    encounterText: await readFile(resolveInside(repositoryRoot, encounter.materialFile), "utf8"),
    taskText: await readFile(resolveInside(repositoryRoot, "fixtures/case-studies/thought-space-v0/task.md"), "utf8"),
    probeTaskText: await readFile(resolveInside(repositoryRoot, "fixtures/case-studies/thought-space-v0/probe-task.md"), "utf8"),
  };
}

export async function preflightThoughtSpaceV0(repositoryRootInput = process.cwd()): Promise<ThoughtSpacePreflight> {
  const loaded = await loadThoughtSpaceInputs(repositoryRootInput);
  const subjectFindings = [
    ...auditSubjectText("task.md", loaded.taskText),
    ...auditSubjectText("encounter.md", loaded.encounterText),
    ...auditSubjectText("probe-task.md", loaded.probeTaskText),
  ];
  const checks = [
    { name: "subject-content-leakage-scan", passed: subjectFindings.length === 0, detail: subjectFindings.length === 0 ? "No researcher-only terms or private paths found." : subjectFindings.join("; ") },
    { name: "runtime-controls", passed: loaded.config.runtime.networkAccess === false && loaded.config.runtime.approvalPolicy === "never", detail: "Network disabled and approval policy pinned to never." },
    { name: "single-encounter-schedule", passed: loaded.config.schedule.maxEncounters === 1, detail: `maxEncounters=${loaded.config.schedule.maxEncounters}` },
  ];
  return { schemaVersion: "0.1", passed: checks.every((check) => check.passed), config: loaded.config, encounter: loaded.encounter, checks };
}
