import { preflightThoughtSpaceV0 } from "./preflight.js";

try {
  const result = await preflightThoughtSpaceV0();
  for (const check of result.checks) {
    console.log(`${check.passed ? "PASS" : "FAIL"} ${check.name}: ${check.detail}`);
  }
  if (!result.passed) process.exitCode = 2;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
