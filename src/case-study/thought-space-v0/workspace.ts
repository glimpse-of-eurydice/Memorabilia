import { createHash } from "node:crypto";
import { copyFile, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import type { CodexRuntimeMetadata, TraceEvent } from "../../trace-inspector/index.js";
import { auditSubjectText, resolveInside } from "./schema.js";
import type {
  EncounterManifest,
  LeakageAudit,
  ThoughtSpaceConfig,
  ThoughtSpaceSnapshot,
} from "./types.js";

export const ENCOUNTER_FILES = [
  "task.md",
  "encounter.md",
  "concept-map.json",
  "research-note.md",
  "graph-patch.json",
] as const;

export const PROBE_FILES = [
  "task.md",
  "retrieved-context.md",
  "response.md",
] as const;

export interface PreparedSubjectWorkspace {
  directory: string;
  allowedFiles: string[];
  writableFiles: string[];
  initialChecksums: Record<string, string>;
}

export function sha256Buffer(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function fileSha256(path: string): Promise<string> {
  return sha256Buffer(await readFile(path));
}

async function inventory(directory: string): Promise<Record<string, string>> {
  const entries = await readdir(directory, { withFileTypes: true });
  const result: Record<string, string> = {};
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isFile()) throw new Error(`Subject workspace contains non-file entry: ${entry.name}`);
    result[entry.name] = await fileSha256(join(directory, entry.name));
  }
  return result;
}

export async function prepareEncounterWorkspace(
  repositoryRoot: string,
  config: ThoughtSpaceConfig,
  encounter: EncounterManifest,
  initialSnapshot: ThoughtSpaceSnapshot,
): Promise<PreparedSubjectWorkspace> {
  const directory = await mkdtemp(join(tmpdir(), `${config.blindId}-study-`));
  const taskSource = resolveInside(repositoryRoot, "fixtures/case-studies/thought-space-v0/task.md");
  const encounterSource = resolveInside(repositoryRoot, encounter.materialFile);
  await copyFile(taskSource, join(directory, "task.md"));
  await copyFile(encounterSource, join(directory, "encounter.md"));
  await writeFile(join(directory, "concept-map.json"), `${JSON.stringify(initialSnapshot, null, 2)}\n`);
  await writeFile(join(directory, "research-note.md"), "");
  await writeFile(join(directory, "graph-patch.json"), "");
  const initialChecksums = await inventory(directory);
  const actualFiles = Object.keys(initialChecksums);
  if (JSON.stringify(actualFiles) !== JSON.stringify([...ENCOUNTER_FILES].sort())) {
    throw new Error(`Encounter subject workspace inventory mismatch: ${actualFiles.join(", ")}`);
  }
  return { directory, allowedFiles: [...ENCOUNTER_FILES], writableFiles: ["research-note.md", "graph-patch.json"], initialChecksums };
}

export async function prepareProbeWorkspace(
  repositoryRoot: string,
  config: ThoughtSpaceConfig,
  retrievedContext: string,
): Promise<PreparedSubjectWorkspace> {
  const directory = await mkdtemp(join(tmpdir(), `${config.blindId}-study-`));
  await copyFile(resolveInside(repositoryRoot, "fixtures/case-studies/thought-space-v0/probe-task.md"), join(directory, "task.md"));
  await writeFile(join(directory, "retrieved-context.md"), retrievedContext);
  await writeFile(join(directory, "response.md"), "");
  const initialChecksums = await inventory(directory);
  return { directory, allowedFiles: [...PROBE_FILES], writableFiles: ["response.md"], initialChecksums };
}

export interface WorkspaceChangeAudit {
  changedFiles: string[];
  unexpectedFiles: string[];
  missingFiles: string[];
}

export async function auditWorkspaceChanges(workspace: PreparedSubjectWorkspace): Promise<WorkspaceChangeAudit> {
  const current = await inventory(workspace.directory);
  const currentFiles = Object.keys(current);
  const missingFiles = workspace.allowedFiles.filter((file) => !(file in current));
  const unexpectedFiles = currentFiles.filter((file) => !workspace.allowedFiles.includes(file));
  const changedFiles = workspace.allowedFiles.filter((file) => current[file] !== workspace.initialChecksums[file]);
  unexpectedFiles.push(...changedFiles.filter((file) => !workspace.writableFiles.includes(file)));
  return { changedFiles, unexpectedFiles: [...new Set(unexpectedFiles)].sort(), missingFiles };
}

function commandFromEvent(event: TraceEvent): string | null {
  if (event.kind !== "command.started" && event.kind !== "command.completed") return null;
  const item = event.attributes.item;
  if (typeof item === "object" && item !== null && "command" in item && typeof item.command === "string") return item.command;
  return event.title;
}

export function auditLeakage(
  runtime: CodexRuntimeMetadata,
  workspace: PreparedSubjectWorkspace,
  events: TraceEvent[],
  subjectTexts: Array<{ label: string; text: string }>,
  workspaceAudit: WorkspaceChangeAudit,
  expectedRuntime?: { model: string; reasoningEffort: string },
): LeakageAudit {
  const runtimeChecks: string[] = [];
  const boundaryFindings = subjectTexts.flatMap(({ label, text }) => auditSubjectText(label, text));
  if (runtime.approvalPolicy !== "never") runtimeChecks.push(`approvalPolicy=${String(runtime.approvalPolicy)}`);
  if (runtime.sandbox?.type !== "workspaceWrite") runtimeChecks.push(`sandbox.type=${String(runtime.sandbox?.type)}`);
  if (runtime.sandbox?.networkAccess !== false) runtimeChecks.push(`networkAccess=${String(runtime.sandbox?.networkAccess)}`);
  if (expectedRuntime !== undefined && runtime.model !== expectedRuntime.model) runtimeChecks.push(`model=${String(runtime.model)}`);
  if (expectedRuntime !== undefined && runtime.reasoningEffort !== expectedRuntime.reasoningEffort) runtimeChecks.push(`reasoningEffort=${String(runtime.reasoningEffort)}`);
  if (runtime.runtimeWorkspaceRoots.length !== 1 || resolve(runtime.runtimeWorkspaceRoots[0] ?? "") !== resolve(workspace.directory)) {
    runtimeChecks.push(`runtimeWorkspaceRoots=${JSON.stringify(runtime.runtimeWorkspaceRoots)}`);
  }
  if (runtime.instructionSources.length !== 0) runtimeChecks.push(`instructionSources=${JSON.stringify(runtime.instructionSources)}`);
  boundaryFindings.push(...workspaceAudit.unexpectedFiles.map((file) => `Unexpected or disallowed file change: ${file}`));
  boundaryFindings.push(...workspaceAudit.missingFiles.map((file) => `Missing subject file: ${file}`));
  for (const event of events) {
    const command = commandFromEvent(event);
    if (command === null) continue;
    if (/(?:^|[\s'"(])\.\.(?:\/|\s|$)/.test(command)) boundaryFindings.push(`Parent traversal command observed: ${command}`);
    const absolutePaths = command.match(/\/(?:Users|home|private|tmp|var)\/[^\s'";|)]+/g) ?? [];
    for (const path of absolutePaths) {
      if (!resolve(path).startsWith(`${resolve(workspace.directory)}/`) && resolve(path) !== resolve(workspace.directory)) {
        boundaryFindings.push(`External absolute path observed: ${path}`);
      }
    }
    if (/\bfind\s+(?:\/|\.\.)/.test(command)) boundaryFindings.push(`Broad filesystem scan observed: ${command}`);
  }
  const status = runtimeChecks.length > 0
    ? "runtime_control_failed"
    : boundaryFindings.length > 0
      ? "potential_boundary_crossing"
      : "no_leakage_observed";
  return {
    schemaVersion: "0.1",
    status,
    runtimeChecks,
    boundaryFindings: [...new Set(boundaryFindings)],
    subjectFiles: workspace.allowedFiles.map((file) => basename(file)).sort(),
    claimBoundary: "No leakage observed is an audited observation, not an operating-system-level read-isolation guarantee.",
  };
}

export async function subjectBundleTexts(workspace: PreparedSubjectWorkspace): Promise<Array<{ label: string; text: string }>> {
  const readable = workspace.allowedFiles.filter((file) => !workspace.writableFiles.includes(file));
  return Promise.all(readable.map(async (file) => ({ label: file, text: await readFile(join(workspace.directory, file), "utf8") })));
}
