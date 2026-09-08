# Reproduction

## Credential-free apparatus check

```bash
npm ci
npm test
npm run preflight
npm run demo
npm run view -- S001-demo
```

The synthetic run is generated under ignored `.trace-inspector/`; its public,
tracked counterpart is in `examples/synthetic-v0-run/`.

## Live smoke run

```bash
npm run preflight
npm run run
npm run view -- <run-id>
```

A live run uses two fresh Codex turns. The encounter workspace and probe
workspace are different temporary directories. Both are deleted after their
allowed outputs, checksums, audits, and trace links have been preserved in the
run bundle.

Expected local output:

```text
.trace-inspector/case-studies/thought-space-v0/runs/<run-id>/
```

Do not commit live output. Report status, trace IDs, snapshot hash, and leakage
status separately after reviewing the bundle.

## Reproducibility boundary

Snapshot reduction, traversal, fixture generation, and hashing are
deterministic. Live model sampling and the Codex runtime are not claimed to be
bit-for-bit reproducible. The manifest records prompt/config hashes and runtime
metadata so runs can be audited and compared.
