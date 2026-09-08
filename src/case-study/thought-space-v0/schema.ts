import { isAbsolute, relative, resolve } from "node:path";
import type {
  EncounterManifest,
  GraphPatch,
  PatchValidation,
  ThoughtSpaceConfig,
} from "./types.js";

const SAFE_ID = /^[a-z0-9][a-z0-9-]*$/;
const SUBJECT_FORBIDDEN = [
  /\bprimitive\b/i,
  /\bablation\b/i,
  /\bexperimental condition\b/i,
  /\bevaluation\b/i,
  /trace inspector/i,
  /how do minimal cognitive primitives/i,
  /primitive learning dynamics and experience order/i,
  /\/Users\//,
  /\/home\//,
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertNumber(
  value: unknown,
  name: string,
  minimum: number,
  maximum: number,
): asserts value is number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new Error(`${name} must be between ${minimum} and ${maximum}.`);
  }
}

export function resolveInside(base: string, candidate: string): string {
  if (isAbsolute(candidate)) {
    throw new Error(`Expected a relative path, received: ${candidate}`);
  }
  const resolvedBase = resolve(base);
  const resolved = resolve(resolvedBase, candidate);
  const fromBase = relative(resolvedBase, resolved);
  if (fromBase === ".." || fromBase.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)) {
    throw new Error(`Path escapes repository root: ${candidate}`);
  }
  return resolved;
}

export function validateConfig(value: unknown): ThoughtSpaceConfig {
  if (!isRecord(value)) throw new Error("Config must be an object.");
  if (value.schemaVersion !== "0.1") throw new Error("Unsupported config schemaVersion.");
  if (value.caseStudyId !== "thought-space-v0") throw new Error("Unexpected caseStudyId.");
  if (typeof value.blindId !== "string" || !/^S[0-9]{3,}$/.test(value.blindId)) {
    throw new Error("blindId must use the form S001.");
  }
  const runtime = value.runtime;
  const schedule = value.schedule;
  const primitives = value.primitiveSeed;
  const retrieval = value.retrieval;
  const environment = value.environment;
  if (!isRecord(runtime) || !isRecord(schedule) || !isRecord(primitives) || !isRecord(retrieval) || !isRecord(environment)) {
    throw new Error("Config runtime, schedule, primitiveSeed, retrieval, and environment are required.");
  }
  if (typeof runtime.model !== "string" || runtime.model.length === 0) throw new Error("runtime.model is required.");
  if (runtime.reasoningEffort !== "medium") throw new Error("v0 reasoningEffort must be medium.");
  assertNumber(runtime.timeoutMs, "runtime.timeoutMs", 1_000, 600_000);
  if (runtime.networkAccess !== false || runtime.approvalPolicy !== "never") {
    throw new Error("v0 requires networkAccess=false and approvalPolicy=never.");
  }
  if (schedule.maxEncounters !== 1 || schedule.researchTurns !== 1 || schedule.externalizationTurns !== 1 || schedule.consolidationSteps !== 1) {
    throw new Error("v0 schedule must contain one encounter and one step per phase.");
  }
  const association = primitives.association;
  const decay = primitives.decay;
  if (!isRecord(association) || !isRecord(decay)) throw new Error("association and decay config are required.");
  if (typeof association.enabled !== "boolean" || typeof decay.enabled !== "boolean") throw new Error("Primitive enabled flags must be boolean.");
  assertNumber(association.increment, "association.increment", 0, 10);
  assertNumber(decay.rate, "decay.rate", 0, 1);
  assertNumber(retrieval.maxHops, "retrieval.maxHops", 1, 10);
  assertNumber(retrieval.topK, "retrieval.topK", 1, 100);
  assertNumber(retrieval.contextTokenBudget, "retrieval.contextTokenBudget", 64, 100_000);
  if (typeof value.encounterManifest !== "string") throw new Error("encounterManifest is required.");
  if (typeof environment.name !== "string" || !Array.isArray(environment.affordances)) throw new Error("environment is invalid.");
  return value as unknown as ThoughtSpaceConfig;
}

export function validateEncounter(value: unknown): EncounterManifest {
  if (!isRecord(value) || value.schemaVersion !== "0.1" || value.encounterId !== "E001") {
    throw new Error("Invalid v0 encounter manifest.");
  }
  if (typeof value.title !== "string" || typeof value.materialFile !== "string" || value.evidenceRef !== "encounter:E001") {
    throw new Error("Encounter title, materialFile, and evidenceRef are required.");
  }
  return value as unknown as EncounterManifest;
}

export function auditSubjectText(label: string, text: string): string[] {
  return SUBJECT_FORBIDDEN.flatMap((pattern) =>
    pattern.test(text) ? [`${label} matched forbidden subject pattern ${pattern.source}`] : [],
  );
}

export function validateGraphPatch(value: unknown): {
  patch: GraphPatch | null;
  validation: PatchValidation;
} {
  const errors: string[] = [];
  const rejectedOperations: PatchValidation["rejectedOperations"] = [];
  if (!isRecord(value)) {
    return { patch: null, validation: { valid: false, errors: ["Graph patch must be an object."], acceptedOperationLocalIds: [], rejectedOperations } };
  }
  if (value.schemaVersion !== "0.1") errors.push("schemaVersion must be 0.1.");
  if (value.encounterId !== "E001") errors.push("encounterId must be E001.");
  if (!Array.isArray(value.activatedRefs) || !value.activatedRefs.every((item) => typeof item === "string" && SAFE_ID.test(item))) {
    errors.push("activatedRefs must contain safe local IDs.");
  }
  if (!Array.isArray(value.operations)) errors.push("operations must be an array.");
  if (errors.length > 0 || !Array.isArray(value.operations)) {
    return { patch: null, validation: { valid: false, errors, acceptedOperationLocalIds: [], rejectedOperations } };
  }

  const operations = value.operations;
  const localIds = new Set<string>();
  const nodeIds = new Set<string>();
  let nodeCount = 0;
  let edgeCount = 0;
  for (const raw of operations) {
    const op = isRecord(raw) ? raw : {};
    const localId = typeof op.localId === "string" ? op.localId : null;
    if (localId === null || !SAFE_ID.test(localId)) {
      rejectedOperations.push({ localId, reason: "Operation localId is missing or unsafe." });
      continue;
    }
    if (localIds.has(localId)) {
      rejectedOperations.push({ localId, reason: "Duplicate operation localId." });
      continue;
    }
    localIds.add(localId);
    if (op.op === "add_node") {
      const validKind = op.kind === "concept" || op.kind === "evidence" || op.kind === "question";
      const refs = op.evidenceRefs;
      if (!validKind || typeof op.label !== "string" || op.label.trim() === "" || typeof op.summary !== "string" || op.summary.trim() === "" || !Array.isArray(refs) || !refs.every((ref) => ref === "encounter:E001") || (op.clusterHint !== undefined && typeof op.clusterHint !== "string")) {
        rejectedOperations.push({ localId, reason: "Invalid add_node fields or evidence reference." });
        continue;
      }
      nodeIds.add(localId);
      nodeCount += 1;
    } else if (op.op === "add_edge") {
      edgeCount += 1;
    } else {
      rejectedOperations.push({ localId, reason: "Unsupported operation." });
    }
  }

  for (const raw of operations) {
    if (!isRecord(raw) || raw.op !== "add_edge" || typeof raw.localId !== "string" || rejectedOperations.some((item) => item.localId === raw.localId)) continue;
    const refs = raw.evidenceRefs;
    if (typeof raw.sourceRef !== "string" || typeof raw.targetRef !== "string" || !nodeIds.has(raw.sourceRef) || !nodeIds.has(raw.targetRef) || raw.sourceRef === raw.targetRef || typeof raw.relationLabel !== "string" || raw.relationLabel.trim() === "" || typeof raw.rationale !== "string" || raw.rationale.trim() === "" || !Array.isArray(refs) || !refs.every((ref) => ref === "encounter:E001")) {
      rejectedOperations.push({ localId: raw.localId, reason: "Invalid add_edge fields, dangling reference, or evidence reference." });
    }
  }

  if (nodeCount < 2) errors.push("At least two valid add_node operations are required.");
  if (edgeCount < 1) errors.push("At least one add_edge operation is required.");
  if (rejectedOperations.length > 0) errors.push("One or more operations were rejected.");
  const rejectedIds = new Set(rejectedOperations.map((item) => item.localId));
  const acceptedOperationLocalIds = operations.flatMap((raw) =>
    isRecord(raw) && typeof raw.localId === "string" && !rejectedIds.has(raw.localId) ? [raw.localId] : [],
  );
  const valid = errors.length === 0;
  return {
    patch: valid ? (value as unknown as GraphPatch) : null,
    validation: { valid, errors, acceptedOperationLocalIds, rejectedOperations },
  };
}
