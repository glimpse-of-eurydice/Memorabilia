import type {
  RetrievalMode,
  RetrievalRecord,
  ThoughtSpaceConfig,
  ThoughtSpaceSnapshot,
} from "./types.js";
import { sha256Text } from "./state.js";

function buildContext(snapshot: ThoughtSpaceSnapshot, nodeIds: string[]): string {
  const selected = nodeIds.flatMap((id) => {
    const node = snapshot.nodes.find((candidate) => candidate.id === id);
    return node === undefined ? [] : [`- ${node.label}: ${node.summary}`];
  });
  const edgeLines = snapshot.edges
    .filter((edge) => edge.enabled && nodeIds.includes(edge.source) && nodeIds.includes(edge.target))
    .map((edge) => {
      const source = snapshot.nodes.find((node) => node.id === edge.source)?.label ?? edge.source;
      const target = snapshot.nodes.find((node) => node.id === edge.target)?.label ?? edge.target;
      return `- ${source} —[${edge.relationLabel}]→ ${target}: ${edge.rationale}`;
    });
  return ["# Retrieved ideas", "", ...selected, "", "# Retrieved relations", "", ...edgeLines, ""].join("\n");
}

function retrieve(
  snapshot: ThoughtSpaceSnapshot,
  config: ThoughtSpaceConfig,
  seedNodeId: string,
  mode: RetrievalMode,
  disabledEdgeId?: string,
): RetrievalRecord {
  const selected = new Set<string>([seedNodeId]);
  const traversed: string[] = [];
  let frontier = [seedNodeId];
  for (let hop = 0; hop < config.retrieval.maxHops && frontier.length > 0 && selected.size < config.retrieval.topK; hop += 1) {
    const next: string[] = [];
    for (const nodeId of frontier) {
      const edges = snapshot.edges
        .filter((edge) => edge.enabled && edge.id !== disabledEdgeId && (edge.source === nodeId || edge.target === nodeId))
        .sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id));
      for (const edge of edges) {
        const neighbor = edge.source === nodeId ? edge.target : edge.source;
        if (selected.has(neighbor)) continue;
        traversed.push(edge.id);
        selected.add(neighbor);
        next.push(neighbor);
        if (selected.size >= config.retrieval.topK) break;
      }
      if (selected.size >= config.retrieval.topK) break;
    }
    frontier = next;
  }
  const selectedNodeIds = [...selected];
  const finalContext = buildContext(snapshot, selectedNodeIds);
  return {
    schemaVersion: "0.1",
    retrievalId: `retrieval:${mode}`,
    mode,
    snapshotId: snapshot.snapshotId,
    snapshotHash: snapshot.hash,
    forcedSeedNodeId: seedNodeId,
    interventionEdgeId: disabledEdgeId ?? null,
    candidateNodeIds: snapshot.nodes.map((node) => node.id),
    traversedEdgeIds: traversed,
    selectedNodeIds,
    finalContext,
    finalContextHash: sha256Text(finalContext),
  };
}

export function runAbaRetrieval(
  snapshot: ThoughtSpaceSnapshot,
  config: ThoughtSpaceConfig,
): RetrievalRecord[] {
  const targetEdge = snapshot.edges.filter((edge) => edge.enabled).sort((a, b) => a.id.localeCompare(b.id))[0];
  if (targetEdge === undefined) return [];
  return [
    retrieve(snapshot, config, targetEdge.source, "baseline"),
    retrieve(snapshot, config, targetEdge.source, "knockout", targetEdge.id),
    retrieve(snapshot, config, targetEdge.source, "reinstatement"),
  ];
}
