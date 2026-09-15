import {createHash, randomUUID} from 'node:crypto';

export interface MemoryState {
  notebook: string;
  graph: {nodes: Array<{id: string; label: string}>; edges: Array<{id: string; source: string; target: string; label: string}>};
}
export interface Checkpoint {id: string; serializedState: string; hash: string}
export const hash = (text: string) => createHash('sha256').update(text).digest('hex');

export function checkpoint(id: string, state: MemoryState): Checkpoint {
  const serializedState = JSON.stringify(state);
  return Object.freeze({id, serializedState, hash: hash(serializedState)});
}
function restore(cp: Checkpoint): MemoryState {
  if (hash(cp.serializedState) !== cp.hash) throw new Error('Checkpoint integrity failure');
  return JSON.parse(cp.serializedState) as MemoryState;
}
export function nextEncounterInput(cp: Checkpoint, material: string): string {
  restore(cp);
  return JSON.stringify({memory: cp.serializedState, material});
}
export interface ProbeInput {
  sessionId: string;
  question: string;
  context: string;
  /** Disposable branch only. No canonical store or previous session handle. */
  memory: MemoryState;
  writeMemory: (path: string, value: string) => void;
}
export interface ProbeReport {
  checkpointId: string;
  checkpointHash: string;
  sessionId: string;
  condition: 'M+' | 'M-';
  question: string;
  questionHash: string;
  context: string;
  contextHash: string;
  retrievalMode: 'full_context' | 'empty';
  answer: string | null;
  executionStatus: 'completed' | 'failed';
  barrierStatus: 'passed' | 'violated';
  violations: string[];
  error: string | null;
  scope: 'mock-in-process';
}

/** Tests data flow only: this is NOT an OS sandbox for untrusted runtime code. */
export async function runIsolatedProbe(cp: Checkpoint, question: string,
  condition: 'M+' | 'M-', runtime: (input: ProbeInput) => Promise<string>): Promise<ProbeReport> {
  const original = restore(cp);
  const memory = condition === 'M+' ? original : {notebook: '', graph: {nodes: [], edges: []}};
  const before = JSON.stringify(memory);
  const context = condition === 'M+' ? before : '';
  const violations: string[] = [];
  const sessionId = randomUUID();
  let answer: string | null = null, error: string | null = null;
  try {
    answer = await runtime({sessionId, question, context, memory,
      writeMemory(path) {violations.push(`Blocked memory write: ${path}`); throw new Error('Probe memory writes forbidden');}});
    if (!answer.trim()) throw new Error('Empty probe response');
  } catch (failure) {error = failure instanceof Error ? failure.message : String(failure);}
  if (JSON.stringify(memory) !== before) violations.push('Disposable memory was mutated');
  restore(cp);
  return {checkpointId: cp.id, checkpointHash: cp.hash, sessionId, condition,
    question, questionHash: hash(question), context, contextHash: hash(context),
    retrievalMode: condition === 'M+' ? 'full_context' : 'empty', answer,
    executionStatus: error ? 'failed' : 'completed', barrierStatus: violations.length ? 'violated' : 'passed',
    violations, error, scope: 'mock-in-process'};
}
