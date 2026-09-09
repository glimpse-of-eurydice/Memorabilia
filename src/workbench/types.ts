/** Workbench transport contract v0.1. No runtime, filesystem or UI dependencies. */
export type EvidenceLevel = 'observed' | 'model_reported' | 'inferred';
export interface EvidenceRef {
  traceId: string;
  /** Normalized event ID, when available. Raw content is fetched separately. */
  eventId: string | null;
  rawSequence: number | null;
}

/** One ordered position shared by timeline, trace and state history.
 * order resolves equal timestamps. Positions never come from JSON array order.
 */
export interface Position {
  elapsedMs: number;
  order: number;
}

export interface EncounterSummary {
  id: string;
  trajectoryId: string;
  title: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'interrupted';
  budgetMs: number;
  startedAt: string | null;
  endedAt: string | null;
  /** Actual elapsed time; may exceed the budget during shutdown. */
  elapsedMs: number;
  failure: {message: string; evidence: EvidenceRef[]} | null;
  materials: Array<{id: string; title: string; mediaType: string; sourceHash: string | null}>;
}

export interface WorkbenchEvent {
  id: string;
  position: Position;
  occurredAt: string;
  kind: 'lifecycle' | 'read' | 'write' | 'message' | 'command' | 'validation' | 'unknown';
  phase: 'started' | 'progress' | 'completed' | 'failed' | 'interrupted' | 'info';
  /** Observed operation title, not an invented mental state. */
  title: string;
  detail: string | null;
  evidenceLevel: EvidenceLevel;
  evidence: EvidenceRef[];
  sourceEventType: string;
}

export interface GraphNode {
  id: string;
  label: string;
  description: string | null;
  /** Preserve source fields (e.g. summary) without interpreting them as facts. */
  attributes: Record<string, unknown>;
}
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  attributes: Record<string, unknown>;
}
export interface Graph {nodes: GraphNode[]; edges: GraphEdge[]}

/** Graph and notebook are versioned separately: their writes may not be atomic. */
export interface ArtifactVersion<T> {
  id: string;
  visibleFrom: Position;
  content: T;
  contentHash: string;
  origin: 'inherited' | 'runtime_capture' | 'trace_reconstruction' | 'end_checkpoint';
  /** Visibility does not imply acceptance for the next encounter. */
  acceptance: 'draft' | 'accepted' | 'rejected';
  evidence: EvidenceRef[];
}
export interface HistoryGap {
  from: Position;
  to: Position;
  reason: string;
}
export interface ArtifactHistory<T> {
  coverage: 'captured_updates' | 'partial' | 'endpoints_only' | 'unavailable';
  versions: ArtifactVersion<T>[];
  gaps: HistoryGap[];
  /** Parse errors are not represented as an empty graph/notebook. */
  issues: Array<{position: Position; message: string; evidence: EvidenceRef[]}>;
}

export interface AgentRemark {
  id: string;
  position: Position;
  text: string;
  evidenceLevel: 'model_reported';
  trigger: 'agent_initiated' | 'prompted' | 'unknown';
  evidence: EvidenceRef[];
}

export interface WorkbenchDiagnostic {
  position: Position;
  message: string;
  evidence: EvidenceRef[];
}

/** Full snapshot response. Refresh replaces the payload; no inferred deletions
 * from partial streamed responses. revision increases on any payload change.
 */
export interface EncounterView {
  schemaVersion: '0.1';
  revision: number;
  capturedAt: string;
  encounter: EncounterSummary;
  events: WorkbenchEvent[];
  graph: ArtifactHistory<Graph>;
  notebook: ArtifactHistory<string>;
  remarks: AgentRemark[];
  diagnostics: WorkbenchDiagnostic[];
  /** Whether future refreshes may add data, including post-run finalization. */
  live: boolean;
}

/** Client-only state: browsing must not mutate the encounter. */
export type Selection =
  | {mode: 'live'}
  | {mode: 'history'; position: Position};

export interface WorkbenchReader {
  listEncounters(): Promise<EncounterSummary[]>;
  getEncounter(encounterId: string): Promise<EncounterView>;
}
