import {createServer} from 'node:http';
import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../..');
const batchId=process.argv[2]??'batch-1788843247027';
if(!/^batch-\d+$/.test(batchId))throw Error('Invalid batch id');
const batch=join(root,'.trace-inspector/permutation-pilot',batchId);
const read=async(p,fallback=null)=>{try{return JSON.parse(await readFile(p,'utf8'));}catch{return fallback;}};
const txt=async p=>{try{return await readFile(p,'utf8');}catch{return '';}};
const cache=new Map();
async function traceInfo(id){
 const path=join(root,'.trace-inspector/traces',id,'raw.jsonl');
 try{
 const s=await stat(path);if(cache.get(id)?.mtime===s.mtimeMs)return cache.get(id).value;
 const records=(await readFile(path,'utf8')).split('\n').flatMap(l=>{try{return [JSON.parse(l)];}catch{return [];}});
 let workspace=null;const activity=[];let ended=false;
 for(const r of records){const p=r.payload,item=p.params?.item;
  const cwd=p.result?.cwd??p.params?.thread?.cwd;if(cwd)workspace=cwd;
  if(p.method==='turn/completed')ended=true;
  if(p.method==='item/completed'&&item?.type==='agentMessage')activity.push({at:r.receivedAt,kind:'message',text:item.text});
  if(p.method==='item/started'&&item?.type==='commandExecution')activity.push({at:r.receivedAt,kind:'command',text:item.command});
 }
 const value={id,workspace,started:records[0]?.receivedAt,last:records.at(-1)?.receivedAt,ended,activity:activity.slice(-12)};cache.set(id,{mtime:s.mtimeMs,value});return value;
 }catch{return null;}
}
async function snapshot(){
 const summary=await read(join(batch,'summary.json'));if(!summary)throw Error('Waiting for summary');
 const config=await read(join(batch,'config.json'));
 const traces=(await readdir(join(root,'.trace-inspector/traces'))).filter(x=>/^trace_[\w]+$/.test(x)).sort().reverse();
 const recent=(await Promise.all(traces.slice(0,24).map(traceInfo))).filter(Boolean);
 const used=new Set(summary.runs.flatMap(r=>[...r.steps.map(s=>s.traceId),r.probe?.traceId].filter(Boolean)));
 const runs=[];
 for(const r of summary.runs){
  const checkpoints=[];
  for(const [i,key] of ['t01','t02','t03','H001'].entries()){
   const dir=join(batch,r.id,key);const prompt=await txt(join(dir,'prompt.txt'));if(!prompt)continue;
   const saved=await read(join(dir,'trace.json'));const step=r.steps.find(s=>s.eid===key);
   let live=saved?await traceInfo(saved.traceId):null;
   if(!live&&!saved&&r.status==='running'){
    const ps=await stat(join(dir,'prompt.txt'));
    live=recent.find(t=>!used.has(t.id)&&Date.parse(t.started)>=ps.mtimeMs-2000&&t.workspace?.includes(key==='H001'?'permutation-probe-':'permutation-'))??null;
   }
   const before=await read(join(dir,key==='H001'?'state.json':'before.json'));
   const accepted=await read(join(dir,'accepted-state.json'));
   const candidate=await read(join(dir,'graph-after.raw.json'));
   let note=await txt(join(dir,'notebook-after.md')),graph=accepted?.graph??candidate;
   if(!saved&&live?.workspace){note=await txt(join(live.workspace,'notebook.md'));graph=await read(join(live.workspace,'concept-map.json'));}
   checkpoints.push({key,material:key==='H001'?'H001':r.order[i],status:step?(step.accepted?'accepted':'failed'):key==='H001'&&r.probe?r.probe.status:saved?saved.status:'running',before,graph,note,response:await txt(join(dir,'response.txt')),live,draft:!accepted&&key!=='H001'});
  }
  runs.push({...r,checkpoints});
 }
 return {batchId,status:summary.status,kind:config.kind??'permutation',checkpointsPerRun:config.checkpointsPerRun??4,orders:config.orders,runs,updated:new Date().toISOString()};
}
const server=createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'");
 try{if(req.method!=='GET'){res.writeHead(405);return res.end();}
 const path=new URL(req.url,'http://127.0.0.1').pathname;
 if(path==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(await readFile(join(here,'pilot-viewer.html')));}
 if(path==='/api/status'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(await snapshot()));}
 res.writeHead(404);res.end('Not found');
 }catch(e){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.message}));}
});
const port = Number(process.env.PORT ?? 4334);
server.listen(port,'127.0.0.1',()=>console.log(`http://127.0.0.1:${port}/`));
