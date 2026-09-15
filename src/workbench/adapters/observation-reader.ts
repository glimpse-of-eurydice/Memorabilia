import {readFile,readdir,realpath} from 'node:fs/promises';
import {resolve,join,relative,isAbsolute} from 'node:path';
import type {WorkbenchReader,EncounterView} from '../types.js';

/** Serves only the observation views and reports, never arbitrary run artifacts. */
export class ObservationReader implements WorkbenchReader {
 constructor(private root:string) {this.root=resolve(root);}
 private async file(id:string,name:'view.json'|'probes.md'){
  if(!/^observation\/set-A-\d+\/t[0-5]$/.test(id))throw new Error('Invalid observation ID');
  const path=join(this.root,...id.split('/').slice(1),name);
  const [root,target]=await Promise.all([realpath(this.root),realpath(path)]);
  const rel=relative(root,target);
  if(rel==='..'||rel.startsWith('../')||isAbsolute(rel))throw new Error('Observation path escapes root');
  return readFile(target,'utf8');
 }
 async listEncounters(){
  let entries;
  try{entries=await readdir(this.root,{withFileTypes:true});}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return [];throw e;}
  const runs=entries.filter(e=>e.isDirectory()&&/^set-A-\d+$/.test(e.name));
  const result=[];
  for(const run of runs)for(let i=0;i<=5;i++)try{result.push((await this.getEncounter(`observation/${run.name}/t${i}`)).encounter);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
  return result.sort((a,b)=>b.trajectoryId.localeCompare(a.trajectoryId)||a.id.localeCompare(b.id));
 }
 async getEncounter(id:string):Promise<EncounterView>{return JSON.parse(await this.file(id,'view.json'));}
 async getProbeMarkdown(id:string):Promise<string>{try{return await this.file(id,'probes.md');}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return 'Probe observations will appear after the encounter checkpoint is accepted.';throw e;}}
}
