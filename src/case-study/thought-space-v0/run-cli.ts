import { runThoughtSpaceV0 } from "./runner.js";

try {
  const result = await runThoughtSpaceV0();
  console.log(`Run: ${result.runId}`);
  console.log(`Status: ${result.manifest.status}`);
  console.log(`Encounter trace: ${result.manifest.encounterTrace?.traceId ?? "not recorded"}`);
  console.log(`Probe trace: ${result.manifest.probeTrace?.traceId ?? "not recorded"}`);
  console.log(`Snapshot: ${result.manifest.snapshotHash ?? "not produced"}`);
  console.log(`Leakage audit: ${result.manifest.leakageStatus ?? "not completed"}`);
  console.log(`Artifacts: ${result.runDirectory}`);
  if (result.manifest.status !== "completed") process.exitCode = 2;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
