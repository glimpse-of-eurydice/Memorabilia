# Study task

You are working in a quiet study with a research notebook and a persistent
concept-map surface.

Read `encounter.md` and inspect the current `concept-map.json`. Then:

1. Write a concise evidence-led note to `research-note.md`.
2. Write a valid JSON update to `graph-patch.json` using the format below.
3. Use at least two bubbles and one relation.
4. Distinguish statements supported by `encounter.md` from your own inference.
5. Modify no other file and use only files in the current workspace.

The JSON format is:

```json
{
  "schemaVersion": "0.1",
  "encounterId": "E001",
  "activatedRefs": ["shade", "heat-exposure"],
  "operations": [
    {
      "op": "add_node",
      "localId": "shade",
      "kind": "concept",
      "label": "Shade",
      "summary": "A short description",
      "evidenceRefs": ["encounter:E001"],
      "clusterHint": "cooling"
    },
    {
      "op": "add_node",
      "localId": "heat-exposure",
      "kind": "concept",
      "label": "Pedestrian heat exposure",
      "summary": "A short description",
      "evidenceRefs": ["encounter:E001"],
      "clusterHint": "cooling"
    },
    {
      "op": "add_edge",
      "localId": "shade-reduces-exposure",
      "sourceRef": "shade",
      "targetRef": "heat-exposure",
      "relationLabel": "reduces",
      "rationale": "The supplied text directly supports this relation.",
      "evidenceRefs": ["encounter:E001"]
    }
  ]
}
```

You may choose your own bubbles, relation labels, and cluster hints. Local IDs
must use lowercase letters, digits, and hyphens. Every node `kind` must be
exactly one of `concept`, `evidence`, or `question`; use `concept` for a
condition, constraint, mechanism, or outcome that does not fit the other two.
