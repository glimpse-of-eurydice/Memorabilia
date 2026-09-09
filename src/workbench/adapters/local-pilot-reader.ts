import { access, readdir, readFile, realpath } from "node:fs/promises";
import { resolve, relative, join, dirname } from "node:path";
import type { TraceEvent } from "../../core/trace-event.js";
import type { EncounterSummary, EncounterView, WorkbenchReader } from "../types.js";
import { mapPilotEncounter, type PilotConfig, type PilotSourceBundle, type PilotStep, type PilotTraceManifest, type PilotTraceResult } from "./map-pilot.js";

interface SummaryFile {status: string; runs: Array<{id: string; order: string; status: string; steps: PilotStep[]}>}

export class PilotSourceError extends Error {
  constructor(message: string, readonly sourcePath: string) {
    super(`${message} (${sourcePath})`);
    this.name = "PilotSourceError";
  }
}

function assertSegment(value: string, label: string): void {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error(`Invalid ${label}: ${value}`);
}

async function json<T>(path: string): Promise<T> {
  try { return JSON.parse(await readFile(path, "utf8")) as T; }
  catch (error) { throw new PilotSourceError(`Cannot read JSON: ${String(error)}`, path); }
}

async function text(path: string): Promise<string | null> {
  try { return await readFile(path, "utf8"); }
  catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    throw new PilotSourceError(`Cannot read text: ${String(error)}`, path);
  }
}

async function exists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

export class LocalPilotReader implements WorkbenchReader {
  private readonly root: string;
  private readonly catalog = new Map<string, {batchId: string; runId: string; step: PilotStep; config: PilotConfig}>();

  constructor(rootDirectory: string) {
    this.root = resolve(rootDirectory);
  }

  private safePath(...segments: string[]): string {
    for (const [index, segment] of segments.entries()) assertSegment(segment, `path segment ${index}`);
    const path = resolve(this.root, ...segments);
    const rel = relative(this.root, path);
    if (rel.startsWith("..") || rel.includes("/../") || rel.includes("\\..\\")) throw new Error("Path escapes pilot root");
    return path;
  }

  private async refreshCatalog(): Promise<void> {
    this.catalog.clear();
    let batches: string[];
    try { batches = (await readdir(this.root, {withFileTypes: true})).filter(entry => entry.isDirectory() && /^batch-\d+$/.test(entry.name)).map(entry => entry.name); }
    catch (error) { throw new PilotSourceError(`Cannot list pilot root: ${String(error)}`, this.root); }
    for (const batchId of batches.sort()) {
      const batch = this.safePath(batchId);
      await this.verifyPath(batch);
      const config = await json<PilotConfig & {kind?: string}>(join(batch, "config.json"));
      if (config.kind === "no-memory-baseline") continue;
      const summary = await json<SummaryFile>(join(batch, "summary.json"));
      for (const run of summary.runs) {
        assertSegment(run.id, "run id");
        for (const step of run.steps) {
          if (!/^t\d+$/.test(step.eid)) continue;
          this.catalog.set(`${batchId}/${run.id}/${step.eid}`, {batchId, runId: run.id, step, config});
        }
      }
    }
  }

  async listEncounters(): Promise<EncounterSummary[]> {
    await this.refreshCatalog();
    const entries = await Promise.all([...this.catalog.values()].map(async entry => {
      const bundle = await this.loadBundle(entry);
      return mapPilotEncounter(bundle).view.encounter;
    }));
    return entries.sort((a, b) => a.id.localeCompare(b.id));
  }

  async getEncounter(encounterId: string): Promise<EncounterView> {
    const parts = encounterId.split("/");
    if (parts.length !== 3) throw new PilotSourceError("Encounter id must be batch/run/eid", encounterId);
    await this.refreshCatalog();
    const entry = this.catalog.get(encounterId);
    if (!entry) throw new PilotSourceError("Encounter not found", encounterId);
    return mapPilotEncounter(await this.loadBundle(entry)).view;
  }

  private async loadBundle(entry: {batchId: string; runId: string; step: PilotStep; config: PilotConfig}): Promise<PilotSourceBundle> {
    const dir = this.safePath(entry.batchId, entry.runId, entry.step.eid);
    await this.verifyPath(dir);
    const readSourceText = async (name: string) => this.readCheckedText(join(dir, name));
    const beforeRaw = await readSourceText("before.json");
    const before = beforeRaw === null ? null : (() => {
      try { return JSON.parse(beforeRaw) as {notebook: string; graph: unknown}; }
      catch (error) { throw new PilotSourceError(`Cannot parse before.json: ${String(error)}`, join(dir, "before.json")); }
    })();
    const trace = await this.optionalJson<PilotTraceResult>(join(dir, "trace.json"));
    let traceManifest: PilotTraceManifest | null = null;
    let events: TraceEvent[] = [];
    if (trace?.traceDirectory) {
      assertSegment(trace.traceId, "trace id");
      const traceRoot = resolve(this.root, "../traces");
      const manifestPath = resolve(traceRoot, trace.traceId, "manifest.json");
      await this.verifyPath(manifestPath, traceRoot);
      traceManifest = await this.optionalJson<PilotTraceManifest>(manifestPath, traceRoot);
      const replayText = await readSourceText("events.json");
      if (replayText !== null) {
        try { events = JSON.parse(replayText) as TraceEvent[]; }
        catch (error) { throw new PilotSourceError(`Cannot parse events.json: ${String(error)}`, join(dir, "events.json")); }
      } else {
        const eventPath = resolve(traceRoot, trace.traceId, "events.jsonl");
        const eventText = await this.readCheckedText(eventPath, traceRoot);
        if (eventText !== null) events = eventText.split("\n").filter(Boolean).map(line => JSON.parse(line) as TraceEvent);
      }
    }
    const graphRaw = await readSourceText("graph-after.raw.json");
    let graphAfter: unknown | null = null;
    if (graphRaw !== null) { try { graphAfter = JSON.parse(graphRaw); } catch { graphAfter = graphRaw; } }
    const acceptedRaw = await readSourceText("accepted-state.json");
    let acceptedState: {notebook?: string; graph?: unknown} | null = null;
    if (acceptedRaw !== null) {
      try { acceptedState = JSON.parse(acceptedRaw) as {notebook?: string; graph?: unknown}; }
      catch (error) { throw new PilotSourceError(`Cannot parse accepted-state.json: ${String(error)}`, join(dir, "accepted-state.json")); }
    }
    return {batchId: entry.batchId, runId: entry.runId, step: entry.step, config: entry.config, trace, traceManifest, events, before, graphAfter, notebookAfter: await readSourceText("notebook-after.md"), acceptedState};
  }

  private async optionalJson<T>(path: string, allowedRoot = this.root): Promise<T | null> {
    await this.verifyPath(path, allowedRoot);
    if (!await exists(path)) return null;
    return json<T>(path);
  }

  private async readCheckedText(path: string, allowedRoot = this.root): Promise<string | null> {
    await this.verifyPath(path, allowedRoot);
    return text(path);
  }

  private async verifyPath(path: string, allowedRoot = this.root): Promise<void> {
    const root = await realpath(allowedRoot);
    let target: string;
    let probe = path;
    while (true) {
      try {
        target = await realpath(probe);
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw new PilotSourceError(`Cannot resolve source path: ${String(error)}`, path);
        const parent = dirname(probe);
        if (parent === probe) return;
        probe = parent;
      }
    }
    const rel = relative(root, target);
    if (rel.startsWith("..") || rel === ".." || rel.includes("/../") || rel.includes("\\..\\")) {
      throw new PilotSourceError("Source path resolves outside pilot root", path);
    }
  }
}

export function createLocalPilotReader(rootDirectory: string): WorkbenchReader {
  return new LocalPilotReader(rootDirectory);
}
