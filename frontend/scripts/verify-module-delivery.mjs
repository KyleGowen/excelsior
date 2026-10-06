import {mkdirSync,mkdtempSync,cpSync,symlinkSync,readFileSync,readdirSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
let reportPath;
for(let i=2;i<process.argv.length;i++){if(process.argv[i]==='--report'&&process.argv[i+1])reportPath=resolve(process.argv[++i]);else throw new Error('Usage: verify-module-delivery.mjs [--report <fresh evidence.json>]');}
const frontend=resolve(import.meta.dirname,'..');
const temporary=mkdtempSync(join(tmpdir(),'excelsior-frontend-only-'));
const destination=join(temporary,'frontend');
const inputs=['src','scripts','examples','package.json','package-lock.json','tsconfig.app.json','tsconfig.modules.json','tsconfig.delivery.json','vite.modules.config.ts','vite.delivery.config.ts'];
const receipt={status:'failed',kind:'frontend-only-delivery',sourceInputs:inputs,backendSourcePresent:false,cardResourceTreePresent:false,dependencySource:'installed frontend dependencies; no second installation',steps:[],artifacts:[]};
try {
 for(const input of inputs)cpSync(join(frontend,input),join(destination,input),{recursive:true});
 symlinkSync(resolve(frontend,'node_modules'),join(destination,'node_modules'),'dir');
 if(existsSync(join(temporary,'src'))||existsSync(join(temporary,'migrations')))throw new Error('Unexpected backend source in delivery proof');
 for(const command of [['npm',['run','build:modules']],['npm',['run','build:delivery-proof']],['node_modules/.bin/tsc',['-p','tsconfig.delivery.json','--noEmit']]]){
  const result=spawnSync(command[0],command[1],{cwd:destination,encoding:'utf8'});
  receipt.steps.push({command:[command[0],...command[1]].join(' '),status:result.status===0?'passed':'failed'});
  if(result.status!==0)throw new Error((result.stdout+result.stderr).slice(-5000));
 }
 const exported=JSON.parse(readFileSync(join(destination,'package.json'),'utf8')).exports;
 for(const value of Object.values(exported))for(const entry of typeof value==='string'?[value]:Object.values(value))if(!existsSync(join(destination,entry)))throw new Error(`Missing package export: ${entry}`);
 const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]);
 receipt.artifacts=walk(join(destination,'dist/modules')).map(file=>({path:file.slice(destination.length+1),sha256:createHash('sha256').update(readFileSync(file)).digest('hex')}));
 const javascript=walk(join(destination,'dist/modules')).filter(file=>file.endsWith('.js')).map(file=>readFileSync(file,'utf8')).join('\n');
 if(/(?:from\s+|import\s*)["'](?:node:|\.\.\/.*src\/)/.test(javascript)||javascript.includes('/src/resources/'))throw new Error('Backend or resource dependency in built module');
 if(!javascript.includes('from "react"')&&!javascript.includes("from 'react'"))throw new Error('Expected external React import absent');
 receipt.exports=exported;receipt.status='passed';
}catch(error){receipt.error=String(error);process.exitCode=1;}finally{rmSync(temporary,{recursive:true});receipt.cleanup='temporary proof sources and outputs removed';}
if(process.env.MODULE_DELIVERY_REPORT)writeFileSync(process.env.MODULE_DELIVERY_REPORT,JSON.stringify(receipt,null,2)+'\n');
if(reportPath){mkdirSync(dirname(reportPath),{recursive:true});writeFileSync(reportPath,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({...receipt,artifacts:receipt.artifacts.length,...(reportPath?{reportPath}: {})},null,2));
