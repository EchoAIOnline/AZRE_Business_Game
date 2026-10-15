import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {audit,communication} from '../src/audit.js';
import {operationsIntelligence} from '../src/operations-intelligence.js';
import {Service} from '../src/service.js';
import {Store} from '../src/store.js';
import {createApi} from '../src/server.js';
const now=new Date('2026-10-14T12:00:00-04:00');
const snapshot=(deals=[],tasks=[],agents=[])=>Object.fromEntries(['Deals','Buyers','Agents','PluginTasks'].map(t=>[t,{records:t==='Deals'?deals:t==='PluginTasks'?tasks:t==='Agents'?agents:[],complete:true,error:null}]));
const report=(s,options={})=>operationsIntelligence(s,audit(s,'daily-audit',now),{now,...options});
test('contract monitoring uses recorded dates, discloses unsupported dates and never derives default deadlines',()=>{
 const r=report(snapshot([{id:'d',offerDecision:'Deal Under Contract',underContractDate:'2026-10-01',emdDate:'2026-10-13',inspectionDate:'2026-10-16',closedDate:'2026-10-31'}]));
 assert.equal(r.verified.milestones[0].state,'approaching');assert.equal(r.verified.milestones[1].state,'overdue');
 assert.ok(r.missingData.some(g=>g.field==='scheduled closing date'));assert.ok(r.missingData.some(g=>g.field==='due-diligence deadline'));
 assert.ok(r.verified.milestones.every(m=>m.contractVerified===false));assert.equal(r.authorityLevel,1);
});
test('partial retrieval and zero tasks cannot establish company inactivity, finance or performance',()=>{
 const s=snapshot([{id:'d',renovationEstimate:-1}],[],[{id:'a',name:'Agent'}]);s.PluginTasks.complete=false;s.PluginTasks.error='AUTH_FAILED';
 const r=report(s);assert.equal(r.coverage.PluginTasks.complete,false);assert.equal(r.calculated.observedOutstandingTaskCount,0);
 assert.equal(r.verified.financialExceptions[0].recordId,'d');assert.equal(r.verified.contactGaps[0].recordId,'a');
 assert.ok(r.departmentCoverage.every(d=>d.status==='activity-not-established'));assert.equal(r.calculated.activeRecordChange,null);
});
test('terminal task states excluded and weekly comparisons reflect only complete observed baselines',()=>{
 const s=snapshot([{id:'d'}],[{id:'t',status:'Assigned'},{id:'c',status:'Completed'},{id:'f',status:'Failed'},{id:'x',status:'Canceled'}]);
 const baseline={complete:true,executedAt:'2026-10-12T12:00:00Z',pipelineHealth:{active:3}};
 const r=report(s,{period:'weekly',history:[baseline,{...baseline,complete:false,pipelineHealth:{active:999}}]});
 assert.equal(r.calculated.activeRecordChange,-2);assert.equal(r.calculated.observedOutstandingTaskCount,1);assert.equal(r.calculated.observedCompletedTaskCount,1);assert.equal(r.calculated.historySamples,1);
 assert.throws(()=>report(s,{period:'quarterly'}),/INVALID_REPORT_PERIOD/);
});
test('queue communication requires meaningful evidence rather than an outbound attempt or date alone',()=>{
 assert.equal(communication({lastContactDate:'2026-10-14',contactStatus:'Sent Initial Text Message'}),'unknown');
 assert.equal(communication({contactStatus:'Spoke With Agent'}),'documented');
});
test('monthly intelligence persists and exports even when AI is unavailable; histories survive reopen',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'azre-ops-')),db=join(dir,'state.sqlite');let store=new Store(db);
 try{const s=snapshot([{id:'d',offerDecision:'Deal Under Contract'}]);const service=new Service({store,client:{collect:async t=>s[t]},reportDir:dir,briefImpl:async()=>{throw new Error('secret');}});
 const r=await service.execute('executive-briefing',{period:'monthly'});assert.equal(r.aiStatus,'failed');assert.equal(r.operations.period,'monthly');
 assert.match(readFileSync(join(dir,r.executionId+'.md'),'utf8'),/Monthly operations intelligence/);assert.equal(JSON.parse(readFileSync(join(dir,r.executionId+'.json'))).operations.authorityLevel,1);
 store.close();store=new Store(db);assert.equal(store.operationalHistory()[0].operations.period,'monthly');
 }finally{store.close();rmSync(dir,{recursive:true});}
});
test('operational report endpoint requires authorization and rejects unsupported period without execution',async()=>{
 let calls=0;const key='k'.repeat(32);const api=createApi({store:{},execute:async(w,o)=>{calls++;return {workflow:w,...o};}},key);
 await new Promise(r=>api.listen(0,'127.0.0.1',r));
 try{const url=`http://127.0.0.1:${api.address().port}/operations/reports/`;
 assert.equal((await fetch(url+'weekly',{method:'POST'})).status,401);
 assert.equal((await fetch(url+'quarterly',{method:'POST',headers:{Authorization:'Bearer '+key}})).status,400);assert.equal(calls,0);
 const r=await fetch(url+'weekly',{method:'POST',headers:{Authorization:'Bearer '+key}});assert.equal(r.status,200);assert.deepEqual(await r.json(),{workflow:'executive-briefing',rulesOnly:true,period:'weekly',owner:'ceo'});
 }finally{await new Promise(r=>api.close(r));}
});
