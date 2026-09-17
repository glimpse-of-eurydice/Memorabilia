import { spawn } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { replayTrace } from "../../trace-inspector/index.js";
import { startTimelineServer, type TimelineServer } from "../../trace-inspector/server/timeline-server.js";
import { loadViewerPayload, startThoughtSpaceViewerServer } from "./viewer-server.js";
import type { ThoughtSpaceRunManifest } from "./types.js";

function openBrowser(url: string): void {
  const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", url] : [url];
  const child = spawn(command, args, { detached: true, stdio: "ignore" });
  child.unref();
}

async function startTrace(traceId: string | undefined, port: number): Promise<TimelineServer | null> {
  if (traceId === undefined) return null;
  await replayTrace(traceId);
  return startTimelineServer(traceId, port);
}

try {
  const args = process.argv.slice(2);
  const runId = args.find((argument) => !argument.startsWith("--"));
  if (runId === undefined) throw new Error("Usage: npm run view:thought-space-v0 -- <run-id>");
  const repositoryRoot = process.cwd();
  const manifestPath = resolve(repositoryRoot, ".trace-inspector", "case-studies", "thought-space-v0", "runs", runId, "run-manifest.json");
  await access(manifestPath);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as ThoughtSpaceRunManifest;
  const encounterServer = await startTrace(manifest.encounterTrace?.traceId, 4318);
  const probeServer = await startTrace(manifest.probeTrace?.traceId, 4319);
  const payload = await loadViewerPayload(repositoryRoot, runId, {
    encounter: encounterServer?.url ?? null,
    probe: probeServer?.url ?? null,
  });
  const viewer = await startThoughtSpaceViewerServer(repositoryRoot, payload, 4322);
  console.log(`Viewing ${runId}`);
  console.log(viewer.url);
  if (encounterServer !== null) console.log(`Encounter trace: ${encounterServer.url}`);
  if (probeServer !== null) console.log(`Probe trace: ${probeServer.url}`);
  console.log("Press Ctrl+C to stop.");
  if (!args.includes("--no-open")) openBrowser(viewer.url);
  process.once("SIGINT", async () => {
    await viewer.close();
    if (encounterServer !== null) await encounterServer.close();
    if (probeServer !== null) await probeServer.close();
    process.exit(0);
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
