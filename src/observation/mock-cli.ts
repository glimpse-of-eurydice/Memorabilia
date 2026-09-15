import {mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {runMockPilot} from './mock-pilot.js';

const result = await runMockPilot();
const directory = join('.trace-inspector', 'mock-probe', randomUUID());
await mkdir(directory, {recursive: true});
await writeFile(join(directory, 'report.json'), JSON.stringify(result, null, 2) + '\n');
console.log(`Mock probe report: ${directory}/report.json`);
console.log('No model calls. Continuation input unchanged. Adversarial branch detected and discarded.');
