import {checkpoint, hash, nextEncounterInput, runIsolatedProbe, type MemoryState} from './probe-barrier.js';

export async function runMockPilot() {
  // Synthetic fixtures: not extraction or behavior produced by a language model.
  const firstMaterial = 'At the workshop, Mara missed a shift. The reason is not yet known.';
  const nextMaterial = 'Mara explains that she was caring for a relative during that shift.';
  const state: MemoryState = {notebook: 'Mara missed a shift; the reason is unknown.',
    graph: {nodes: [{id: 'mara', label: 'Mara'}, {id: 'shift', label: 'Missed shift'}],
      edges: [{id: 'e1', source: 'mara', target: 'shift', label: 'missed; reason unknown'}]}};
  const cp = checkpoint('synthetic-E1', state);
  const expectedNext = nextEncounterInput(cp, nextMaterial);
  const question = 'PROBE_CANARY: What is known about why Mara missed the shift?';
  const plus = await runIsolatedProbe(cp, question, 'M+', async input => `MOCK: ${input.memory.notebook}`);
  const minus = await runIsolatedProbe(cp, question, 'M-', async input => input.context ? 'Unexpected memory' : 'MOCK: No memory supplied.');
  const adversarial = await runIsolatedProbe(cp, question, 'M+', async input => {
    input.memory.notebook = question + ' ANSWER_CANARY';
    input.memory.graph.nodes.push({id: 'probe-leak', label: question});
    try {input.writeMemory('diary.md', 'ANSWER_CANARY');} catch { /* test audit despite swallowed error */ }
    return 'ANSWER_CANARY';
  });
  const actualNext = nextEncounterInput(cp, nextMaterial);
  if (actualNext !== expectedNext || actualNext.includes('CANARY')) throw new Error('Continuation contaminated');
  return {kind: 'synthetic-mock-only', modelCalls: 0, firstMaterial, nextMaterial,
    checkpoint: cp, reports: [plus, minus, adversarial], continuation: {
      withoutProbeHash: hash(expectedNext), withProbeHash: hash(actualNext), identical: true,
      input: actualNext}, claim: 'Mock data-flow isolation only; no real-agent or OS isolation claim.'};
}
