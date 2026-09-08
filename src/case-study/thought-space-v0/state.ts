import { createHash } from "node:crypto";
import type {
  GraphPatch,
  StateDelta,
  ThoughtEdge,
  ThoughtNode,
  ThoughtSpaceConfig,
  ThoughtSpaceSnapshot,
} from "./types.js";

export function sha256Text(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)]),
    );
  }
  return value;
}

export function stableJson(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

export function emptySnapshot(blindId: string): ThoughtSpaceSnapshot {
  const base = {
    schemaVersion: "0.1" as const,
    snapshotId: `snapshot:${blindId}:initial`,
    blindId,
    encounterId: "initial",
    parentSnapshotId: null,
    nodes: [] as ThoughtNode[],
    edges: [] as ThoughtEdge[],
  };
  return { ...base, hash: sha256Text(stableJson(base)) };
}

export function applyGraphPatch(
  previous: ThoughtSpaceSnapshot,
  patch: GraphPatch,
  config: ThoughtSpaceConfig,
): { snapshot: ThoughtSpaceSnapshot; delta: StateDelta } {
  const active = new Set(patch.activatedRefs);
  const primitiveGenerated: Array<Record<string, unknown>> = [];
  const nodes = previous.nodes.map((node) => {
    if (!config.primitiveSeed.decay.enabled || active.has(node.localId)) return { ...node };
    const persistence = node.persistence * (1 - config.primitiveSeed.decay.rate);
    primitiveGenerated.push({ op: "decay_node", nodeId: node.id, from: node.persistence, to: persistence });
    return { ...node, persistence };
  });
  const edges = previous.edges.map((edge) => {
    const source = previous.nodes.find((node) => node.id === edge.source);
    const target = previous.nodes.find((node) => node.id === edge.target);
    if (!config.primitiveSeed.decay.enabled || (source !== undefined && target !== undefined && active.has(source.localId) && active.has(target.localId))) return { ...edge };
    const weight = edge.weight * (1 - config.primitiveSeed.decay.rate);
    primitiveGenerated.push({ op: "decay_edge", edgeId: edge.id, from: edge.weight, to: weight });
    return { ...edge, weight };
  });
  const agentAuthored: Array<Record<string, unknown>> = [];

  for (const operation of patch.operations) {
    if (operation.op !== "add_node") continue;
    const node: ThoughtNode = {
      id: `node:${patch.encounterId}:${operation.localId}`,
      localId: operation.localId,
      kind: operation.kind,
      label: operation.label,
      summary: operation.summary,
      ...(operation.clusterHint === undefined ? {} : { clusterHint: operation.clusterHint }),
      activation: active.has(operation.localId) ? 1 : 0,
      persistence: 1,
      createdAtEncounter: patch.encounterId,
      lastActivatedAtEncounter: patch.encounterId,
      provenance: operation.evidenceRefs,
    };
    nodes.push(node);
    agentAuthored.push({ op: "add_node", nodeId: node.id, localId: operation.localId });
  }

  for (const operation of patch.operations) {
    if (operation.op !== "add_edge") continue;
    const source = nodes.find((node) => node.localId === operation.sourceRef);
    const target = nodes.find((node) => node.localId === operation.targetRef);
    if (source === undefined || target === undefined) throw new Error("Validated patch contained a dangling edge.");
    let weight = 1;
    const edgeId = `edge:${patch.encounterId}:${operation.localId}`;
    if (config.primitiveSeed.association.enabled && active.has(operation.sourceRef) && active.has(operation.targetRef)) {
      const from = weight;
      weight += config.primitiveSeed.association.increment;
      primitiveGenerated.push({ op: "association_reinforcement", edgeId, from, to: weight });
    }
    const edge: ThoughtEdge = {
      id: edgeId,
      localId: operation.localId,
      source: source.id,
      target: target.id,
      relationLabel: operation.relationLabel,
      rationale: operation.rationale,
      weight,
      enabled: true,
      createdAtEncounter: patch.encounterId,
      lastActivatedAtEncounter: patch.encounterId,
      provenance: operation.evidenceRefs,
    };
    edges.push(edge);
    agentAuthored.push({ op: "add_edge", edgeId, localId: operation.localId });
  }

  nodes.sort((a, b) => a.id.localeCompare(b.id));
  edges.sort((a, b) => a.id.localeCompare(b.id));
  const withoutHash = {
    schemaVersion: "0.1" as const,
    snapshotId: `snapshot:${config.blindId}:${patch.encounterId}`,
    blindId: config.blindId,
    encounterId: patch.encounterId,
    parentSnapshotId: previous.snapshotId,
    nodes,
    edges,
  };
  const snapshot = { ...withoutHash, hash: sha256Text(stableJson(withoutHash)) };
  return {
    snapshot,
    delta: {
      schemaVersion: "0.1",
      encounterId: patch.encounterId,
      agentAuthored,
      primitiveGenerated,
      rejected: [],
    },
  };
}
