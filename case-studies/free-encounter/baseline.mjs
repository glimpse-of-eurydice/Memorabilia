import {mkdir, mkdtemp, readFile, writeFile, readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {buildProbePrompt, toolStarts} from './probe-prompt.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
process.chdir(root);
const sourceId = 'batch-1788843247027';
const source = join(root, '.trace-inspector/permutation-pilot', sourceId);
const hash = text => createHash('sha256').update(text).digest('hex');
const json = (p, value) => writeFile(p, JSON.stringify(value, null, 2) + '\n');
const original = JSON.parse(await readFile(join(source, 'config.json'), 'utf8'));
const previous = JSON.parse(await readFile(join(source, 'summary.json'), 'utf8'));
// Verify this builder reproduces every original probe before any model call.
for (const run of previous.runs.filter(r => r.status === 'completed')) {
  const out = join(source, run.id, 'H001');
  const state = JSON.parse(await readFile(join(out, 'state.json'), 'utf8'));
  if (buildProbePrompt(state.notebook, state.graph, original.stimulus, original.question) !== await readFile(join(out, 'prompt.txt'), 'utf8')) throw Error('Original probe template mismatch');
}
const state = {notebook: '', graph: {nodes: [], edges: []}};
const prompt = buildProbePrompt(state.notebook, state.graph, original.stimulus, original.question);
if (process.argv.includes('--check')) {
  console.log('All original probe prompts match; baseline uses empty memory and the same template. No model calls.');
  process.exit(0);
}
const collector = resolve(process.env.TRACE_INSPECTOR_ROOT ?? join(root, '../thought-space'));
const {recordCodexTurn} = await import(pathToFileURL(join(collector, 'dist/collector/codex-app-server.js')));
const {replayTrace} = await import(pathToFileURL(join(collector, 'dist/replay/replay-trace.js')));
const resumeId = process.env.BASELINE_RESUME;
if (resumeId && !/^batch-\d+$/.test(resumeId)) throw Error('Invalid resume ID');
const batchId = resumeId ?? 'batch-' + Date.now();
const batch = join(root, '.trace-inspector/permutation-pilot', batchId);
await mkdir(batch, {recursive: true});
const config = {...original, version: 'baseline-0.1', kind: 'no-memory-baseline', sourceBatch: sourceId,
  orders: ['B1', 'B2', 'B3'], repeats: 3, encountersPerRun: 0, checkpointsPerRun: 1,
  replacementOf: process.env.BASELINE_REPLACEMENT_OF ?? null,
  intervention: 'Empty notebook and empty graph; original H001 envelope and situation unchanged.',
  retryPolicy: 'Stop and preserve failure; no automatic retries', inputHash: hash(prompt)};
if (!resumeId) await json(join(batch, 'config.json'), config);
else {
  const saved = JSON.parse(await readFile(join(batch, 'config.json'), 'utf8'));
  if (saved.inputHash !== config.inputHash || saved.model !== config.model || saved.effort !== config.effort) throw Error('Resume configuration mismatch');
}
const summary = resumeId ? JSON.parse(await readFile(join(batch, 'summary.json'), 'utf8')) : {batch, status: 'running', runs: []};
if (resumeId && summary.runs.some(r => r.status !== 'completed')) throw Error('Resume requires all saved runs accepted after audit');
summary.status = 'running';
const save = () => json(join(batch, 'summary.json'), summary);
await save();
console.log('BATCH_ID', batchId);
for (const order of config.orders) {
  if (summary.runs.some(r => r.order === order && r.status === 'completed')) continue;
  const id = order + '-' + Date.now(), dir = join(batch, id), out = join(dir, 'H001');
  await mkdir(out, {recursive: true});
  const work = await mkdtemp(join(tmpdir(), 'permutation-probe-'));
  const run = {id, order, attempt: 1, replacement_of: null, status: 'running', steps: []};
  summary.runs.push(run);
  await json(join(out, 'state.json'), state);
  await writeFile(join(out, 'prompt.txt'), prompt);
  await json(join(out, 'workspace.json'), {path: work});
  await save();
  try {
    console.log(order, 'started');
    const trace = await recordCodexTurn({prompt, cwd: work, timeoutMs: config.probeTimeoutMs,
      sandboxMode: 'readOnly', networkAccess: false, model: config.model, reasoningEffort: config.effort});
    await json(join(out, 'trace.json'), trace);
    run.probe = {traceId: trace.traceId, status: trace.status, error: trace.collectorError};
    if (!trace.eventCount) throw Error(trace.collectorError ?? 'No runtime events');
    const {events} = await replayTrace(trace.traceId);
    await json(join(out, 'events.json'), events);
    const records = (await readFile(resolve(root, trace.rawFile), 'utf8')).trim().split('\n').map(l => JSON.parse(l).payload);
    const items = records.filter(p => p.method === 'item/completed').map(p => p.params?.item).filter(Boolean);
    const messages = items.filter(i => i.type === 'agentMessage');
    const finals = messages.filter(i => i.phase === 'final');
    const response = (finals.length ? finals : messages.slice(-1)).map(i => i.text ?? '').join('\n');
    await writeFile(join(out, 'response.txt'), response);
    const toolItems = toolStarts(records);
    const workspaceFiles = await readdir(work);
    const audit = {runtime: trace.runtime, toolItemTypes: toolItems.map(p => p.params.item.type), workspaceFiles,
      inputHash: hash(prompt), stateHash: hash(JSON.stringify(state)), requestedEffort: config.effort,
      effortNote: 'runtime.reasoningEffort is thread/start metadata; collector sends medium in turn/start. Effective turn effort is not independently echoed.',
      claimBoundary: 'Observable runtime audit; not proof of hidden cognition or OS-level read isolation.'};
    await json(join(out, 'audit.json'), audit);
    run.probe = {traceId: trace.traceId, status: trace.status, error: trace.collectorError,
      toolCalls: toolItems.length, inputHash: hash(prompt), stateHash: audit.stateHash};
    if (trace.status !== 'completed' || trace.collectorError || !response || toolItems.length || workspaceFiles.length) throw Error('Probe completion/tool/workspace audit failed');
    if (trace.runtime.model !== config.model || trace.runtime.instructionSources.length || trace.runtime.sandbox?.type !== 'readOnly' || trace.runtime.approvalPolicy !== 'never' || trace.runtime.sandbox.networkAccess !== false || trace.runtime.runtimeWorkspaceRoots.length !== 1 || resolve(trace.runtime.runtimeWorkspaceRoots[0]) !== resolve(work)) throw Error('Runtime controls mismatch');
    run.status = 'completed';
    console.log(order, 'completed', trace.traceId);
  } catch (error) {
    run.status = 'failed'; run.error = error.message; summary.status = 'failed';
    process.exitCode = 1;
  }
  await json(join(dir, 'manifest.json'), run);
  await save();
  if (run.status === 'failed') break;
}
if (summary.status === 'running') summary.status = 'completed';
await save();
console.log('FINISHED', batchId, summary.status);
