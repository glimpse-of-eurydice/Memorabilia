import type { CodexRuntimeMetadata } from "../../core/codex-runtime-metadata.js";

export const THOUGHT_SPACE_CONFIG_PATH =
  "fixtures/case-studies/thought-space-v0/config.json";
export const THOUGHT_SPACE_CASE_ID = "thought-space-v0";

export interface ThoughtSpaceConfig {
  schemaVersion: "0.1";
  caseStudyId: "thought-space-v0";
  blindId: string;
  runtime: {
    model: string;
    reasoningEffort: string;
    timeoutMs: number;
    networkAccess: false;
    approvalPolicy: "never";
  };
  environment: {
    name: string;
    affordances: string[];
  };
  schedule: {
    maxEncounters: 1;
    researchTurns: 1;
    externalizationTurns: 1;
    consolidationSteps: 1;
  };
  primitiveSeed: {
    id: string;
    association: { enabled: boolean; increment: number };
    decay: { enabled: boolean; rate: number };
  };
  retrieval: {
    maxHops: number;
    topK: number;
    contextTokenBudget: number;
  };
  encounterManifest: string;
}

export interface EncounterManifest {
  schemaVersion: "0.1";
  encounterId: "E001";
  title: string;
  materialFile: string;
  evidenceRef: "encounter:E001";
}

export type NodeKind = "concept" | "evidence" | "question";

export interface AddNodeOperation {
  op: "add_node";
  localId: string;
  kind: NodeKind;
  label: string;
  summary: string;
  evidenceRefs: string[];
  clusterHint?: string;
}

export interface AddEdgeOperation {
  op: "add_edge";
  localId: string;
  sourceRef: string;
  targetRef: string;
  relationLabel: string;
  rationale: string;
  evidenceRefs: string[];
}

export type GraphOperation = AddNodeOperation | AddEdgeOperation;

export interface GraphPatch {
  schemaVersion: "0.1";
  encounterId: "E001";
  activatedRefs: string[];
  operations: GraphOperation[];
}

export interface PatchValidation {
  valid: boolean;
  errors: string[];
  acceptedOperationLocalIds: string[];
  rejectedOperations: Array<{ localId: string | null; reason: string }>;
}

export interface ThoughtNode {
  id: string;
  localId: string;
  kind: NodeKind;
  label: string;
  summary: string;
  clusterHint?: string;
  activation: number;
  persistence: number;
  createdAtEncounter: string;
  lastActivatedAtEncounter: string;
  provenance: string[];
}

export interface ThoughtEdge {
  id: string;
  localId: string;
  source: string;
  target: string;
  relationLabel: string;
  rationale: string;
  weight: number;
  enabled: boolean;
  createdAtEncounter: string;
  lastActivatedAtEncounter: string;
  provenance: string[];
}

export interface ThoughtSpaceSnapshot {
  schemaVersion: "0.1";
  snapshotId: string;
  blindId: string;
  encounterId: string;
  parentSnapshotId: string | null;
  nodes: ThoughtNode[];
  edges: ThoughtEdge[];
  hash: string;
}

export interface StateDelta {
  schemaVersion: "0.1";
  encounterId: string;
  agentAuthored: Array<Record<string, unknown>>;
  primitiveGenerated: Array<Record<string, unknown>>;
  rejected: PatchValidation["rejectedOperations"];
}

export type RetrievalMode = "baseline" | "knockout" | "reinstatement";

export interface RetrievalRecord {
  schemaVersion: "0.1";
  retrievalId: string;
  mode: RetrievalMode;
  snapshotId: string;
  snapshotHash: string;
  forcedSeedNodeId: string;
  interventionEdgeId: string | null;
  candidateNodeIds: string[];
  traversedEdgeIds: string[];
  selectedNodeIds: string[];
  finalContext: string;
  finalContextHash: string;
}

export type LeakageStatus =
  | "no_leakage_observed"
  | "potential_boundary_crossing"
  | "runtime_control_failed";

export interface LeakageAudit {
  schemaVersion: "0.1";
  status: LeakageStatus;
  runtimeChecks: string[];
  boundaryFindings: string[];
  subjectFiles: string[];
  claimBoundary: string;
}

export interface TraceLink {
  traceId: string;
  status: string;
  eventCount: number;
  runtime: CodexRuntimeMetadata;
}

export type ThoughtSpaceRunStatus =
  | "running"
  | "completed"
  | "insufficient_graph_structure"
  | "invalid_externalization"
  | "runtime_control_failed"
  | "encounter_failed"
  | "probe_failed"
  | "orchestration_failed";

export interface ThoughtSpaceRunManifest {
  schemaVersion: "0.1";
  caseStudyId: "thought-space-v0";
  runId: string;
  blindId: string;
  status: ThoughtSpaceRunStatus;
  startedAt: string;
  endedAt: string | null;
  configHash: string;
  encounterHash: string;
  taskHash: string;
  probeTaskHash: string;
  preSnapshotHash: string;
  encounterTrace: TraceLink | null;
  probeTrace: TraceLink | null;
  snapshotHash: string | null;
  leakageStatus: LeakageStatus | null;
  noSilentRetry: true;
  claimBoundary: string;
}

export interface ThoughtSpaceViewerPayload {
  manifest: ThoughtSpaceRunManifest;
  encounter: string;
  researchNote: string;
  rawPatch: string;
  validation: PatchValidation;
  delta: StateDelta | null;
  snapshot: ThoughtSpaceSnapshot | null;
  retrievals: RetrievalRecord[];
  response: string;
  leakageAudit: LeakageAudit;
  traceUrls: { encounter: string | null; probe: string | null };
}
