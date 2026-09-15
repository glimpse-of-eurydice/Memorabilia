import test from 'node:test';
import assert from 'node:assert/strict';
import {checkpoint, nextEncounterInput, runIsolatedProbe} from '../observation/probe-barrier.js';
import {runMockPilot} from '../observation/mock-pilot.js';

const fixture = () => checkpoint('E1', {notebook: 'original', graph: {nodes: [], edges: []}});
test('M+/M- and malicious probe leave the next encounter byte-identical', async () => {
  const result = await runMockPilot();
  assert.equal(result.continuation.withProbeHash, result.continuation.withoutProbeHash);
  assert.deepEqual(result.reports.map(r => r.barrierStatus), ['passed', 'passed', 'violated']);
  assert.equal(result.reports[1]?.context, '');
  assert.equal(result.reports[0]?.questionHash, result.reports[1]?.questionHash);
  assert.equal(result.reports[2]?.violations.length, 2);
});
test('failed probe and mutable retrieval metadata cannot affect canonical state', async () => {
  const cp = fixture(), before = nextEncounterInput(cp, 'next');
  const failed = await runIsolatedProbe(cp, 'q', 'M+', async input => {
    Object.assign(input.memory, {accessCount: 1});
    input.memory.notebook = 'bad';
    throw new Error('Mock runtime failure');
  });
  assert.equal(failed.executionStatus, 'failed');
  assert.equal(failed.barrierStatus, 'violated');
  assert.equal(nextEncounterInput(cp, 'next'), before);
  const seen: string[] = [];
  const runtime = async (input: Parameters<Parameters<typeof runIsolatedProbe>[3]>[0]) => {
    seen.push(input.memory.notebook); return 'ok';
  };
  const a = await runIsolatedProbe(cp, 'q', 'M+', runtime);
  const b = await runIsolatedProbe(cp, 'q', 'M+', runtime);
  assert.deepEqual(seen, ['original', 'original']);
  assert.notEqual(a.sessionId, b.sessionId);
});
test('corrupt checkpoint is rejected before invoking the runtime', async () => {
  let called = false;
  await assert.rejects(runIsolatedProbe({...fixture(), serializedState: '{}'}, 'q', 'M+', async () => {
    called = true; return 'bad';
  }), /integrity/);
  assert.equal(called, false);
});
