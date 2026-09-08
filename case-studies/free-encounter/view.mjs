import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'../..');
const id=process.argv[2];
if(!/^S001-[0-9]+$/.test(id??'')) throw Error('Provide run ID');
const dir=join(root,'.trace-inspector/free-encounter',id);
const server=createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'");
  if(url.pathname==='/') {res.setHeader('Content-Type','text/html; charset=utf-8');res.end(await readFile(join(here,'viewer.html')));return;}
  if(url.pathname==='/api/run') {
   const manifest=JSON.parse(await readFile(join(dir,'manifest.json'),'utf8'));
   const steps=[];
   for(const step of manifest.steps) {
    const read=async name=>JSON.parse(await readFile(join(dir,step.id,name),'utf8'));
    steps.push({...step,graph:await read('snapshot.json'),pre:await read('pre-snapshot.json'),validation:await read('validation.json'),
     note:await readFile(join(dir,step.id,'notebook.md'),'utf8'),events:await read('events.json')});
   }
   res.setHeader('Content-Type','application/json');res.end(JSON.stringify({...manifest,steps}));return;
  }
  res.statusCode=404;res.end('Not found');
 }catch(e){res.statusCode=500;res.end('Unable to read run');}
});
server.listen(4333,'127.0.0.1',()=>console.log('http://127.0.0.1:4333/'));
