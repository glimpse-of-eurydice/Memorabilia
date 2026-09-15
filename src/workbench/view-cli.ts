import {ObservationReader} from './adapters/observation-reader.js';
import {createLocalPilotReader} from './adapters/local-pilot-reader.js';
import {createWorkbenchServer} from './server.js';

const port = Number(process.env.PORT ?? 4336);
const reader = process.env.OBSERVATION_ROOT ? new ObservationReader(process.env.OBSERVATION_ROOT) : createLocalPilotReader(process.env.PILOT_ROOT ?? '.trace-inspector/permutation-pilot');
const server = createWorkbenchServer(reader);
server.on('error', error => {console.error(error.message); process.exitCode = 1;});
server.listen(port, '127.0.0.1', () => console.log(`Memorabilia workbench: http://127.0.0.1:${port}/`));
