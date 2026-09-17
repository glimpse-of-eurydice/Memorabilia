# Trace Inspector module

Trace Inspector is Memorabilia's runtime evidence layer. It records Codex
app-server messages, normalizes them into observable events, reconstructs
spans, reports diagnostics, and replays saved traces. It does not interpret
those records as hidden cognition or decide how agent memory should change.

Code outside this directory should import collector, replay, normalizer, and
core types from `index.ts`. The nested paths are implementation details, except
for the legacy timeline server used by the frozen Thought Space v0 viewer.

The module was originally vendored from Trace Inspector commit
`18eea88a72f37585aabd9c82095968ae600c32cd`. See
`docs/source-provenance.json` for the preserved source record. Memorabilia now
owns this integrated copy; active scripts do not load a sibling checkout.

Raw traces remain under the ignored `.trace-inspector/traces/` directory and
may contain sensitive prompts, paths, runtime metadata, and model output.
