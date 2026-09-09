import test from 'node:test';
import assert from 'node:assert/strict';
import type {ArtifactHistory,WorkbenchReader} from './types.js';
import {versionAt} from './select-at.js';
import {createWorkbenchServer} from './server.js';

test('cursor respects endpoint order and keeps last known state across a gap', () => {
  const history: ArtifactHistory<string> = {coverage:'endpoints_only',gaps:[],issues:[],versions:[
    {id:'before',visibleFrom:{elapsedMs:0,order:0},content:'before',contentHash:'a',origin:'inherited',acceptance:'accepted',evidence:[]},
    {id:'after',visibleFrom:{elapsedMs:3000,order:3},content:'after',contentHash:'b',origin:'end_checkpoint',acceptance:'accepted',evidence:[]},
  ]};
  assert.equal(versionAt(history,{elapsedMs:2000,order:50})?.content,'before');
  assert.equal(versionAt(history,{elapsedMs:3000,order:2})?.content,'before');
  assert.equal(versionAt(history,{elapsedMs:3000,order:3})?.content,'after');
  assert.equal(versionAt({...history,versions:[]},{elapsedMs:3000,order:3}),null);
});

test('graph and notebook can resolve different version positions', () => {
  const h = (at:number):ArtifactHistory<string> => ({coverage:'captured_updates',gaps:[],issues:[],versions:[{id:'v',visibleFrom:{elapsedMs:at,order:1},content:'written',contentHash:'x',origin:'runtime_capture',acceptance:'draft',evidence:[]}]});
  assert.equal(versionAt(h(10),{elapsedMs:15,order:2})?.content,'written');
  assert.equal(versionAt(h(20),{elapsedMs:15,order:2}),null);
});

test('HTTP serves every client module and only exposes the read-only catalog API', async () => {
  const reader:WorkbenchReader={listEncounters:async()=>[],getEncounter:async()=>{throw new Error('unexpected lookup');}};
  const server=createWorkbenchServer(reader);
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();assert.ok(address&&typeof address!=='string');
  const base=`http://127.0.0.1:${address.port}`;
  try {
    for(const path of ['/','/styles.css','/app.js','/graph.js','/select-at.js']) {
      const response=await fetch(base+path);assert.equal(response.status,200,path);assert.ok((await response.text()).length>0);
    }
    assert.deepEqual(await (await fetch(base+'/api/encounters')).json(),[]);
    assert.equal((await fetch(base+'/api/encounter?id=../../secret')).status,400);
    assert.equal((await fetch(base+'/api/encounters',{method:'POST'})).status,405);
    assert.equal((await fetch(base+'/.trace-inspector/traces/raw.json')).status,404);
  } finally {await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
});
