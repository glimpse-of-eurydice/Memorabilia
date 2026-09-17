/**
 * Public boundary for the vendored Trace Inspector evidence module.
 *
 * Memorabilia orchestration and observation code should import from this file
 * instead of reaching into Trace Inspector's internal directory structure.
 */
export {
  readThreadStartMetadata,
  recordCodexTurn,
  workspaceWritableRoots,
  type RecordCodexTurnOptions,
  type RecordCodexTurnResult,
} from "./collector/codex-app-server.js";
export {
  normalizeCodexMessage,
  type NormalizeContext,
} from "./adapters/codex/normalize-codex-message.js";
export {
  asJsonObject,
  isRawTraceRecord,
  readCodexMessage,
  type JsonObject,
  type RawCodexMessage,
  type RawTraceRecord,
} from "./adapters/codex/raw-codex-message.js";
export {
  replayTrace,
  type ReplayResult,
} from "./replay/replay-trace.js";
export {
  emptyCodexRuntimeMetadata,
  type CodexRuntimeMetadata,
  type CodexSandboxMetadata,
} from "./core/codex-runtime-metadata.js";
export type {
  EvidenceLevel,
  TraceEvent,
  TraceEventKind,
  TraceEventStatus,
} from "./core/trace-event.js";
export type {
  SpanReconstruction,
  TraceSpan,
  TraceSpanKind,
  TraceSpanStatus,
} from "./core/trace-span.js";
export type {
  DiagnosticFinding,
  DiagnosticRuleId,
  DiagnosticSeverity,
} from "./core/diagnostic-finding.js";
