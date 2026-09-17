import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {loadSetA,validateMemory,probePrompt,probes} from './set-a-protocol.js';
import {checkpoint,hash} from './probe-barrier.js';
import {ObservationReader} from '../workbench/adapters/observation-reader.js';

test('inventory validates order and rejects modified material before model calls',async()=>{
 const root=await mkdtemp(join(tmpdir(),'inventory-test-'));try{
 const base=join(root,'encounters','set_A');await mkdir(base,{recursive:true});
 const lines=['encounters:'];
 for(let i=1;i<=5;i++){await writeFile(join(base,`e${i}.txt`),'fixture');lines.push(`  - id: E${i}`,`    order: ${i}`,`    title: "Fixture ${i}"`,`    local_path: "e${i}.txt"`,`    sha256: "${hash('fixture')}"`);}
 await writeFile(join(base,'sources.yaml'),lines.join('\n'));
 assert.deepEqual((await loadSetA(root)).map(m=>m.id),['E1','E2','E3','E4','E5']);
 await writeFile(join(base,'e3.txt'),'changed');await assert.rejects(loadSetA(root),/checksum/);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('memory acceptance rejects dangling edges and duplicate nodes',()=>{
 const notebook='note';assert.throws(()=>validateMemory({notebook,graph:{nodes:[{id:'a',label:'A'}],edges:[{id:'e',source:'a',target:'b',label:'related'}]}}),/dangling/);
 assert.throws(()=>validateMemory({notebook,graph:{nodes:[{id:'a',label:'A'},{id:'a',label:'B'}],edges:[]}}),/duplicate/);
});
test('probe prompts are independent and do not mutate checkpoint',()=>{
 const cp=checkpoint('C1',{notebook:'prior encounter',graph:{nodes:[],edges:[]}});const before=JSON.stringify(cp);
 const a=probePrompt(cp.serializedState,probes[0].question),b=probePrompt(cp.serializedState,probes[1].question);
 assert.ok(!b.includes('Mara'));assert.ok(!a.includes(probes[1].question));assert.equal(JSON.stringify(cp),before);
});
test('observation reader reports pending probe and rejects traversal',async()=>{
 const root=await mkdtemp(join(tmpdir(),'observation-test-'));try{
 await mkdir(join(root,'set-A-123','t1'),{recursive:true});
 await writeFile(join(root,'set-A-123','t1','view.json'),JSON.stringify({encounter:{id:'observation/set-A-123/t1',trajectoryId:'observation/set-A-123'}}));
 const reader=new ObservationReader(root);assert.equal((await reader.listEncounters()).length,1);
 assert.match(await reader.getProbeMarkdown('observation/set-A-123/t1'),/appear/);
 await assert.rejects(reader.getProbeMarkdown('observation/../t1'),/Invalid/);
 }finally{await rm(root,{recursive:true,force:true});}
});

import {readFile} from 'node:fs/promises';
import {runSetA} from './set-a-runner.js';
import {emptyCodexRuntimeMetadata} from '../trace-inspector/index.js';

async function fixtureInventory(root:string){
 const base=join(root,'encounters','set_A');await mkdir(base,{recursive:true});const lines=['encounters:'];
 for(let i=1;i<=5;i++){await writeFile(join(base,`e${i}.txt`),`material-${i}`);lines.push(`  - id: E${i}`,`    order: ${i}`,`    title: "Fixture ${i}"`,`    local_path: "e${i}.txt"`,`    sha256: "${hash(`material-${i}`)}"`);}
 await writeFile(join(base,'sources.yaml'),lines.join('\n'));
}

test('full five-encounter mock produces six Markdown reports without probe carryover',async()=>{
 const root=await mkdtemp(join(tmpdir(),'set-a-full-test-'));
 try{
 await fixtureInventory(root);let encounters=0,calls=0;const workspaces=new Set<string>();
 const result=await runSetA(root,{runtimeConfig:async()=>({}),recordTurn:async options=>{
  assert.ok(!workspaces.has(options.cwd));workspaces.add(options.cwd);calls++;
  const traceId=`mock-${calls}`,traceDirectory=join(root,'traces',traceId);await mkdir(traceDirectory,{recursive:true});
  await options.onTraceStarted?.(traceId,traceDirectory);
  const isEncounter=options.prompt.includes('<encounter_material>');
  let answer='PROBE_CANARY response';
  if(isEncounter){
   assert.ok(options.prompt.includes(`"notebook":"${'encounter '.repeat(encounters).trim()}"`));assert.ok(!options.prompt.includes('PROBE_CANARY'));
   encounters++;
   answer=`<MEMORABILIA_NOTEBOOK>\n${'encounter '.repeat(encounters)}\n</MEMORABILIA_NOTEBOOK>\n<MEMORABILIA_GRAPH>\n{"nodes":[],"edges":[]}\n</MEMORABILIA_GRAPH>`;
  }else{assert.ok(options.prompt.includes('<external_memory>'));assert.ok(!options.prompt.includes('PROBE_CANARY'));}
  const rawFile=join(traceDirectory,'raw.jsonl');
  const messages=[{sequence:1,receivedAt:new Date().toISOString(),payload:{method:'item/completed',params:{item:{type:'agentMessage',id:traceId,text:answer,phase:'final_answer'}}}}];
  await writeFile(rawFile,messages.map(m=>JSON.stringify(m)).join('\n')+'\n');
  return {traceId,traceDirectory,rawFile,status:'completed',eventCount:1,collectorError:null,runtime:emptyCodexRuntimeMetadata()};
 }});
 assert.equal(encounters,5);assert.equal(calls,17);
 const reader=new ObservationReader(join(root,'.trace-inspector/observation'));
 const catalog=await reader.listEncounters();assert.equal(catalog.length,6);assert.ok(catalog.every(e=>e.status==='completed'));
 for(let i=0;i<=5;i++){
  const cp=JSON.parse(await readFile(join(result,`C${i}.json`),'utf8'));assert.equal(JSON.parse(cp.serializedState).notebook,'encounter '.repeat(i).trim());
  const md=await readFile(join(result,`t${i}`,'probes.md'),'utf8');assert.match(md,/情景题/);assert.match(md,/抽象题/);assert.equal((md.match(/PROBE_CANARY response/g)||[]).length,2);
  const records=JSON.parse(await readFile(join(result,`t${i}`,'probes.json'),'utf8'));assert.ok(records.every((r:any)=>r.checkpointUnchanged&&r.barrierStatus==='no_contamination_observed'));
 }
 assert.equal(JSON.parse(await readFile(join(result,'manifest.json'),'utf8')).status,'completed');
 }finally{await rm(root,{recursive:true,force:true});}
});

test('unexpected probe tool activity records failure and stops before encounter',async()=>{
 const root=await mkdtemp(join(tmpdir(),'set-a-failure-test-'));try{
 await fixtureInventory(root);let calls=0;
 await assert.rejects(runSetA(root,{runtimeConfig:async()=>({}),recordTurn:async options=>{
 calls++;assert.equal(options.sandboxMode,'readOnly');const traceDirectory=join(root,'trace');await mkdir(traceDirectory);
 const rawFile=join(traceDirectory,'raw.jsonl');await writeFile(rawFile,JSON.stringify({sequence:1,receivedAt:new Date().toISOString(),payload:{method:'item/completed',params:{item:{type:'commandExecution',id:'tool'}}}})+'\n');
 return {traceId:'mock',traceDirectory,rawFile,status:'completed',eventCount:1,collectorError:null,runtime:emptyCodexRuntimeMetadata()};
 }}),/Probe stopped/);assert.equal(calls,1);
 const runs=await import('node:fs/promises').then(fs=>fs.readdir(join(root,'.trace-inspector/observation')));
 const dir=join(root,'.trace-inspector/observation',runs[0]!);
 assert.equal(JSON.parse(await readFile(join(dir,'manifest.json'),'utf8')).status,'failed');
 const records=JSON.parse(await readFile(join(dir,'t0/probes.json'),'utf8'));assert.equal(records[0].barrierStatus,'violated');
 }finally{await rm(root,{recursive:true,force:true});}
});
