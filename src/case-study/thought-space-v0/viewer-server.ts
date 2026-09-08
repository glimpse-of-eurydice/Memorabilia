import { createServer, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  LeakageAudit,
  PatchValidation,
  RetrievalRecord,
  StateDelta,
  ThoughtSpaceRunManifest,
  ThoughtSpaceSnapshot,
  ThoughtSpaceViewerPayload,
} from "./types.js";

export interface ThoughtSpaceViewerServer {
  url: string;
  close: () => Promise<void>;
}

function headers(response: ServerResponse, contentType: string): void {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", contentType);
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
}

async function optionalText(path: string): Promise<string> {
  try { return await readFile(path, "utf8"); } catch { return ""; }
}

async function optionalJson<T>(path: string): Promise<T | null> {
  const text = await optionalText(path);
  return text === "" ? null : JSON.parse(text) as T;
}

function jsonLines<T>(text: string): T[] {
  return text.split("\n").filter((line) => line.trim() !== "").map((line) => JSON.parse(line) as T);
}

export async function loadViewerPayload(
  repositoryRoot: string,
  runId: string,
  traceUrls: ThoughtSpaceViewerPayload["traceUrls"] = { encounter: null, probe: null },
): Promise<ThoughtSpaceViewerPayload> {
  if (!/^S[0-9]{3,}-[A-Za-z0-9_-]+$/.test(runId)) throw new Error(`Unsafe run ID: ${runId}`);
  const directory = resolve(repositoryRoot, ".trace-inspector", "case-studies", "thought-space-v0", "runs", runId);
  const manifest = await optionalJson<ThoughtSpaceRunManifest>(resolve(directory, "run-manifest.json"));
  const validation = await optionalJson<PatchValidation>(resolve(directory, "graph-patch-validation.json"));
  const leakageAudit = await optionalJson<LeakageAudit>(resolve(directory, "leakage-audit.json"));
  if (manifest === null || validation === null || leakageAudit === null) throw new Error(`Incomplete Thought Space run: ${runId}`);
  return {
    manifest,
    encounter: await optionalText(resolve(directory, "encounter.md")),
    researchNote: await optionalText(resolve(directory, "research-note.md")),
    rawPatch: await optionalText(resolve(directory, "graph-patch.raw.json")),
    validation,
    delta: await optionalJson<StateDelta>(resolve(directory, "state-delta.json")),
    snapshot: await optionalJson<ThoughtSpaceSnapshot>(resolve(directory, "snapshot.json")),
    retrievals: jsonLines<RetrievalRecord>(await optionalText(resolve(directory, "retrievals.jsonl"))),
    response: await optionalText(resolve(directory, "response.md")),
    leakageAudit,
    traceUrls,
  };
}

export async function startThoughtSpaceViewerServer(
  repositoryRoot: string,
  payload: ThoughtSpaceViewerPayload,
  port = 4322,
): Promise<ThoughtSpaceViewerServer> {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
      if (request.method !== "GET") {
        headers(response, "application/json; charset=utf-8");
        response.statusCode = 405;
        response.end('{"error":"Method not allowed"}\n');
        return;
      }
      if (url.pathname === "/api/thought-space") {
        headers(response, "application/json; charset=utf-8");
        response.statusCode = 200;
        response.end(`${JSON.stringify(payload)}\n`);
        return;
      }
      const files: Record<string, [string, string]> = {
        "/": ["case-studies/thought-space-v0/ui/index.html", "text/html; charset=utf-8"],
        "/index.html": ["case-studies/thought-space-v0/ui/index.html", "text/html; charset=utf-8"],
        "/styles.css": ["case-studies/thought-space-v0/ui/styles.css", "text/css; charset=utf-8"],
        "/app.js": ["dist/case-study/thought-space-v0/ui-app.js", "text/javascript; charset=utf-8"],
      };
      const target = files[url.pathname];
      if (target === undefined) {
        headers(response, "application/json; charset=utf-8");
        response.statusCode = 404;
        response.end('{"error":"Not found"}\n');
        return;
      }
      headers(response, target[1]);
      response.statusCode = 200;
      response.end(await readFile(resolve(repositoryRoot, target[0])));
    } catch (error) {
      headers(response, "application/json; charset=utf-8");
      response.statusCode = 500;
      response.end(`${JSON.stringify({ error: error instanceof Error ? error.message : String(error) })}\n`);
    }
  });
  await new Promise<void>((ok, fail) => {
    server.once("error", fail);
    server.listen(port, "127.0.0.1", () => { server.removeListener("error", fail); ok(); });
  });
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise<void>((ok, fail) => server.close((error) => error === undefined ? ok() : fail(error))) };
}
