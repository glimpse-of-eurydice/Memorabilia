import { prepareThoughtSpaceDemo } from "./demo.js";

try {
  const runId = await prepareThoughtSpaceDemo();
  console.log(`Prepared credential-free Thought Space demo: ${runId}`);
  console.log(`Open with: npm run view -- ${runId}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
