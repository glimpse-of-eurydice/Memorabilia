import { createHash } from "node:crypto";
import type { TraceEvent } from "../../core/trace-event.js";
import type {
  AgentRemark,
  ArtifactHistory,
  ArtifactVersion,
  EncounterSummary,
  EncounterView,
  EvidenceRef,
  Graph,
  GraphEdge,
  GraphNode,
  HistoryGap,
  Position,
  WorkbenchDiagnostic,
  WorkbenchEvent,
} from "../types.js";

export interface PilotConfig {
  timeoutMs: number;
  model?: string;
  titles?: Record<string, string>;
}

export interface PilotStep {
  eid: string;
  material: string;
  traceId: string | null;
  status: string;
  error?: string | null;
  accepted: boolean;
}

export interface PilotTraceResult {
  traceId: string;
  status: string;
  collectorError?: string | null;
  rawFile?: string;
  traceDirectory?: string;
}

export interface PilotTraceManifest {
  startedAt: string;
  endedAt: string | null;
  status: string;
  eventCount: number;
}

export interface PilotSourceBundle {
  batchId: string;
  runId: string;
  step: PilotStep;
  config: PilotConfig;
  trace: PilotTraceResult | null;
  traceManifest: PilotTraceManifest | null;
  events: TraceEvent[];
  before: { notebook: string; graph: unknown } | null;
  graphAfter: unknown | null;
  notebookAfter: string | null;
  acceptedState: { notebook?: string; graph?: unknown } | null;
}

export interface MappedPilotEncounter {
  view: EncounterView;
  diagnostics: WorkbenchDiagnostic[];
}

const DEFAULT_TITLES: Record<string, string> = {
  W: "Simone Weil — Gravity and Grace",
  L: "Emmanuel Levinas — Ethics as First Philosophy",
  K: "J. Krishnamurti — The Awakening of Intelligence",
};

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function position(elapsedMs: number, order: number): Position {
  return { elapsedMs: Math.max(0, elapsedMs), order };
}

function evidence(traceId: string, event: TraceEvent | null): EvidenceRef {
  return {
    traceId,
    eventId: event?.eventId ?? null,
    rawSequence: event?.rawRef.sequence ?? null,
  };
}

function eventDetail(event: TraceEvent): string | null {
  const attributes = event.attributes;
  const item = attributes.item;
  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    for (const key of ["text", "command", "output", "title"]) {
      if (typeof record[key] === "string") return record[key] as string;
    }
  }
  for (const key of ["text", "command", "output", "title"]) {
    if (typeof attributes[key] === "string") return attributes[key] as string;
  }
  return null;
}

function workbenchKind(event: TraceEvent): WorkbenchEvent["kind"] {
  if (event.kind.startsWith("command")) return "command";
  if (event.kind.startsWith("file")) return "write";
  if (event.kind.startsWith("message")) return "message";
  if (event.kind === "unknown") return "unknown";
  if (event.kind === "plan.updated" || event.kind === "token_usage.updated") return "lifecycle";
  return "lifecycle";
}

function phase(event: TraceEvent): WorkbenchEvent["phase"] {
  if (event.status === "failed") return "failed";
  if (event.status === "interrupted") return "interrupted";
  if (event.status === "completed") return "completed";
  if (event.kind.endsWith("started")) return "started";
  if (event.kind.endsWith("completed")) return "completed";
  return "progress";
}

function mapEvents(bundle: PilotSourceBundle, startedAt: string): WorkbenchEvent[] {
  const start = Date.parse(startedAt);
  const traceId = bundle.trace?.traceId ?? bundle.step.traceId ?? "unknown-trace";
  return bundle.events
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .map((event) => {
      const occurred = Date.parse(event.occurredAt);
      const elapsed = Number.isFinite(start) && Number.isFinite(occurred) ? occurred - start : 0;
      return {
        id: event.eventId,
        position: position(elapsed, event.sequence),
        occurredAt: event.occurredAt,
        kind: workbenchKind(event),
        phase: phase(event),
        title: event.title,
        detail: eventDetail(event),
        evidenceLevel: event.evidenceLevel,
        evidence: [evidence(traceId, event)],
        sourceEventType: event.sourceEventType,
      };
    });
}

function toGraph(value: unknown): Graph {
  if (value === null || typeof value !== "object") throw new Error("graph must be an object");
  const source = value as Record<string, unknown>;
  if (!Array.isArray(source.nodes) || !Array.isArray(source.edges)) throw new Error("graph needs nodes and edges arrays");
  const nodeIds = new Set<string>();
  const nodes: GraphNode[] = source.nodes.map((item) => {
    if (item === null || typeof item !== "object") throw new Error("graph node must be an object");
    const node = item as Record<string, unknown>;
    if (typeof node.id !== "string" || typeof node.label !== "string" || nodeIds.has(node.id)) throw new Error("graph node has invalid or duplicate id");
    nodeIds.add(node.id);
    const {id: _id, label: _label, description: _description, summary: _summary, ...attributes} = node;
    return {id: node.id, label: node.label, description: typeof node.description === "string" ? node.description : typeof node.summary === "string" ? node.summary : null, attributes};
  });
  const edgeIds = new Set<string>();
  const edges: GraphEdge[] = source.edges.map((item) => {
    if (item === null || typeof item !== "object") throw new Error("graph edge must be an object");
    const edge = item as Record<string, unknown>;
    if (typeof edge.id !== "string" || typeof edge.source !== "string" || typeof edge.target !== "string" || edgeIds.has(edge.id) || !nodeIds.has(edge.source) || !nodeIds.has(edge.target)) throw new Error("graph edge has invalid id or endpoint");
    edgeIds.add(edge.id);
    const label = typeof edge.label === "string" ? edge.label : typeof edge.relationLabel === "string" ? edge.relationLabel : "";
    const {id: _id, source: _source, target: _target, label: _label, relationLabel: _relationLabel, ...attributes} = edge;
    return {id: edge.id, source: edge.source, target: edge.target, label, attributes};
  });
  return {nodes, edges};
}

function history<T>(versions: ArtifactVersion<T>[], issues: WorkbenchDiagnostic[], end: Position): ArtifactHistory<T> {
  const gaps: HistoryGap[] = versions.length > 1 ? [{from: versions[0]!.visibleFrom, to: end, reason: "only before/after snapshots were captured; intermediate writes are unknown"}] : [];
  return {coverage: versions.length > 1 ? "endpoints_only" : "partial", versions, gaps, issues};
}

export function mapPilotEncounter(bundle: PilotSourceBundle): MappedPilotEncounter {
  const diagnostics: WorkbenchDiagnostic[] = [];
  const encounterId = `${bundle.batchId}/${bundle.runId}/${bundle.step.eid}`;
  const traceId = bundle.trace?.traceId ?? bundle.step.traceId ?? "unknown-trace";
  const startedAt = bundle.traceManifest?.startedAt ?? null;
  const endedAt = bundle.traceManifest?.endedAt ?? null;
  const startMs = startedAt ? Date.parse(startedAt) : Number.NaN;
  const endMs = startedAt && endedAt ? Date.parse(endedAt) - startMs : 0;
  const events = startedAt ? mapEvents(bundle, startedAt) : [];
  const endPosition = position(endMs, (events.at(-1)?.position.order ?? 0) + 1);
  const refs = (event: TraceEvent | null): EvidenceRef[] => [evidence(traceId, event)];
  const issue = (message: string, at = endPosition) => diagnostics.push({position: at, message, evidence: refs(events.at(-1) ? bundle.events.at(-1)! : null)});
  if (!startedAt) issue("trace manifest has no startedAt; timeline position is unavailable; elapsed time is shown as unavailable", {elapsedMs: 0, order: 0});

  const graphVersions: ArtifactVersion<Graph>[] = [];
  const notebookVersions: ArtifactVersion<string>[] = [];
  if (bundle.before) {
    try {
      graphVersions.push({id: `${encounterId}:graph:before`, visibleFrom: position(0, 0), content: toGraph(bundle.before.graph), contentHash: hash(stableJson(bundle.before.graph)), origin: "inherited", acceptance: "accepted", evidence: refs(null)});
    } catch (error) { issue(`before graph invalid: ${String(error)}`, position(0, 0)); }
    notebookVersions.push({id: `${encounterId}:notebook:before`, visibleFrom: position(0, 0), content: bundle.before.notebook, contentHash: hash(bundle.before.notebook), origin: "inherited", acceptance: "accepted", evidence: refs(null)});
  } else issue("before.json is missing; inherited state cannot be shown", position(0, 0));
  let graphAfterValue: Graph | null = null;
  if (bundle.graphAfter !== null) {
    try {
      graphAfterValue = toGraph(bundle.graphAfter);
    } catch (error) { issue(`after graph invalid: ${String(error)}`); }
  } else issue("graph-after.raw.json is missing; no end graph is exposed");
  const acceptedGraph = bundle.acceptedState?.graph === undefined ? null : (() => { try { return toGraph(bundle.acceptedState!.graph); } catch { return null; } })();
  const graphMatchesAccepted = graphAfterValue !== null && acceptedGraph !== null && stableJson(graphAfterValue) === stableJson(acceptedGraph);
  const notebookMatchesAccepted = bundle.notebookAfter !== null && bundle.acceptedState?.notebook !== undefined && bundle.notebookAfter === bundle.acceptedState.notebook;
  const acceptanceConsistent = !bundle.step.accepted || (graphMatchesAccepted && notebookMatchesAccepted);
  if (bundle.step.accepted && !acceptanceConsistent) issue("accepted-state does not match the candidate graph/notebook; candidate remains rejected", endPosition);
  const candidateAcceptance: ArtifactVersion<Graph>["acceptance"] = bundle.step.accepted && acceptanceConsistent ? "accepted" : "rejected";
  if (graphAfterValue !== null) graphVersions.push({id: `${encounterId}:graph:after`, visibleFrom: endPosition, content: graphAfterValue, contentHash: hash(stableJson(graphAfterValue)), origin: "end_checkpoint", acceptance: candidateAcceptance, evidence: refs(events.at(-1) ? bundle.events.at(-1)! : null)});
  if (bundle.notebookAfter !== null) notebookVersions.push({id: `${encounterId}:notebook:after`, visibleFrom: endPosition, content: bundle.notebookAfter, contentHash: hash(bundle.notebookAfter), origin: "end_checkpoint", acceptance: candidateAcceptance, evidence: refs(events.at(-1) ? bundle.events.at(-1)! : null)});
  else issue("notebook-after.md is missing; no end notebook is exposed");
  const status: EncounterSummary["status"] = bundle.step.status === "interrupted" ? "interrupted" : bundle.step.accepted && acceptanceConsistent && bundle.trace?.status === "completed" ? "completed" : bundle.trace?.status === "running" ? "running" : "failed";
  const summary: EncounterSummary = {id: encounterId, trajectoryId: `${bundle.batchId}/${bundle.runId}`, title: bundle.config.titles?.[bundle.step.material] ?? DEFAULT_TITLES[bundle.step.material] ?? bundle.step.material, status, budgetMs: bundle.config.timeoutMs, startedAt, endedAt, elapsedMs: Math.max(0, endMs), failure: status === "failed" ? {message: bundle.step.error ?? bundle.trace?.collectorError ?? "encounter output was not accepted", evidence: refs(events.at(-1) ? bundle.events.at(-1)! : null)} : null, materials: [{id: bundle.step.material, title: bundle.config.titles?.[bundle.step.material] ?? DEFAULT_TITLES[bundle.step.material] ?? bundle.step.material, mediaType: "text", sourceHash: null}]};
  const view: EncounterView = {schemaVersion: "0.1", revision: 1, capturedAt: new Date().toISOString(), encounter: summary, events, graph: history(graphVersions, diagnostics, endPosition), notebook: history(notebookVersions, diagnostics, endPosition), remarks: [] as AgentRemark[], diagnostics, live: status === "running"};
  return {view, diagnostics};
}
