export function validateGraph(g) {
  if (!g || !Array.isArray(g.nodes) || !Array.isArray(g.edges)) throw Error('Expected nodes and edges arrays');
  const ids = new Set();
  for (const n of g.nodes) {
    if (typeof n.id !== 'string' || !/^[\w:-]+$/.test(n.id) || ids.has(n.id) || typeof n.label !== 'string') throw Error('Invalid or duplicate node');
    ids.add(n.id);
  }
  const edges = new Set();
  for (const e of g.edges) {
    if (typeof e.id !== 'string' || !/^[\w:-]+$/.test(e.id) || edges.has(e.id) || !ids.has(e.source) || !ids.has(e.target) || typeof e.label !== 'string') throw Error('Invalid or dangling edge');
    edges.add(e.id);
  }
  return g;
}
