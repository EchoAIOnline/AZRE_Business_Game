import {test} from 'node:test';import assert from 'node:assert/strict';
import {sourceBoundItem,taskSource} from '../src/evidence-sources.js';
import {chatSchema,validateChat,chatTools} from '../src/chat.js';
import {crmTaskSummary} from '../src/task-retrieval.js';
import {alertAudit} from '../src/alert-intelligence.js';
import {audit} from '../src/audit.js';
import {renderExecutive} from '../src/presentation.js';
test('source-bound references prevent an internal task ID from becoming a CRM PluginTask reference',()=>{
 const id='12345678-1234-1234-1234-123456789abc';const observed=new Map([['WorkforceTasks/'+id,{id,title:'Internal',status:'Review',source:taskSource('WorkforceTasks',id)}],['PluginTasks/crm-task',{id:'crm-task',title:'CRM',source:taskSource('PluginTasks','crm-task')}]]);
 const schema=sourceBoundItem(chatSchema.shape.references.element,observed);assert.ok(schema.safeParse({table:'WorkforceTasks',recordId:id}).success);assert.ok(schema.safeParse({table:'PluginTasks',recordId:'crm-task'}).success);assert.ok(!schema.safeParse({table:'PluginTasks',recordId:id}).success);assert.ok(!schema.safeParse({table:'WorkforceTasks',recordId:'crm-task'}).success);
 const facts=sourceBoundItem(chatSchema.shape.facts.element,observed,{emptyValues:true});assert.ok(facts.safeParse({table:'WorkforceTasks',recordId:id,field:'status',value:''}).success);assert.ok(!facts.safeParse({table:'WorkforceTasks',recordId:id,field:'offerDecision',value:''}).success);
 const output={summary:'Combined sources',facts:[],recommendations:[],references:[{table:'PluginTasks',recordId:id}],coverage:'Fixture'};assert.throws(()=>validateChat(output,observed),e=>e.validationFailure.reason==='reference-source-not-read');output.references=[{table:'WorkforceTasks',recordId:id},{table:'PluginTasks',recordId:'crm-task'}];assert.equal(validateChat(output,observed).references.length,2);
});
test('CRM summary counts only CRM records, retains explicit source and never fabricates a zero for partial retrieval',async()=>{
 const observed=new Map();const client={collect:async table=>{assert.equal(table,'PluginTasks');return {records:[{id:'crm',title:'CRM record'}],complete:true,error:null};}};
 const result=await crmTaskSummary(client,{observed});assert.equal(result.metric.count,1);assert.equal(result.records[0].source.system,'dealdesk');const snapshot=Object.fromEntries(['Deals','Buyers','Agents','PluginTasks'].map(t=>[t,{records:t==='PluginTasks'?[{id:'crm',entityType:'Deals',entityId:'d',status:'Open'}]:[],complete:true,error:null}]));const review=audit(snapshot,'task-review').taskReview[0];assert.equal(review.recordType,'PluginTasks');assert.equal(review.relatedRecordType,'Deals');assert.equal(review.source.system,'dealdesk');assert.ok(observed.has('PluginTasks/crm'));assert.ok(!observed.has('WorkforceTasks/crm'));
 const partial=await crmTaskSummary({collect:async()=>({records:[],complete:false,error:'AUTH_FAILED'})},{observed:new Map()});assert.equal(partial.metric,null);
 let forbiddenReads=0;const tools=chatTools({client:{...client,read:async()=>{forbiddenReads++;return {records:[]};}},allowedTables:['Deals','Buyers']});assert.ok(!tools.some(t=>t.name==='get_crm_task_summary'));
 const read=tools.find(t=>t.name==='get_dealdesk_record');try{await read.invoke({},JSON.stringify({table:'WorkforceTasks',recordId:'local'}));}catch{}assert.equal(forbiddenReads,0);
});
const a=(id,kind,target,detail,source_key)=>({id,owner:'ceo',kind,target,detail,source_key,status:'Open',created:'2026-10-14',last_seen:'2026-10-14'});
test('semantic deadline duplicates are grouped without deleting historical alert rows or inventing critical risk',()=>{
 const rows=[a('one','deadline','deal','inspectionDate: 2026-01-01','finding:Deals:deal:deadline:inspectionDate: 2026-01-01'),a('two','overdue-milestone','deal','Recorded inspection date','milestone:deal:inspectionDate'),a('three','communication-unverified','other','Unknown contact evidence','finding:other:communication')];const original=JSON.stringify(rows),audit=alertAudit(rows);
 assert.equal(audit.totals.rawAlerts,3);assert.equal(audit.totals.uniqueIssues,2);assert.equal(audit.totals.duplicateAlerts,1);assert.equal(audit.totals.critical,0);assert.equal(audit.totals.requiresAction,1);assert.equal(audit.totals.informational,1);assert.equal(audit.totals.confirmedOperationalRisks,0);assert.equal(audit.groups[0].history.length,2);assert.equal(JSON.stringify(rows),original);
});
test('incomplete records, compatibility noise and system-observed failures have different categories',()=>{
 const r=alertAudit([a('a','missing-field','d','Missing address','missing:d'),a('b','unknown-pipeline-status','b','Unsupported offerDecision: Available','compat:b'),a('c','failed','task','Task failed','task:task')]);assert.equal(r.totals.incompleteRecordIssues,1);assert.equal(r.totals.confirmedOperationalRisks,1);assert.equal(r.totals.informational,1);assert.equal(r.totals.byCategory['application-compatibility'],1);
});
test('verified supported pipeline labels no longer trigger false unknown-status alarms; raw values remain unchanged',()=>{
 const snapshot=Object.fromEntries(['Deals','Buyers','Agents','PluginTasks'].map(t=>[t,{records:t==='Deals'?[{id:'d',offerDecision:'Available'},{id:'e',offerDecision:'Listing Removed - Now Off-Market'},{id:'f',offerDecision:'Unverified Legacy Label'}]:[],complete:true,error:null}]));const r=audit(snapshot,'daily-audit');assert.equal(r.findings.filter(f=>f.type==='unknown-pipeline-status').length,1);assert.equal(r.pipelineHealth.pipelineDistribution.Available,1);assert.equal(snapshot.Deals.records[1].offerDecision,'Listing Removed - Now Off-Market');
});
test('a workforce status cannot be substituted for an assignment count',()=>{const observed=new Map([['WorkforceTasks/task',{id:'task',status:'Review'}],['Summary/internal_openTasks',{id:'internal_openTasks',count:1}]]);const facts=[{table:'WorkforceTasks',recordId:'task',field:'status',value:'Review'},{table:'Summary',recordId:'internal_openTasks',field:'count',value:'1'}];assert.throws(()=>renderExecutive({facts,narrative:'The workforce reports {{fact:0}} open assignment.',mode:'conversation'},observed),/UNVERIFIED_NARRATIVE_REFERENCE/);assert.match(renderExecutive({facts,narrative:'The workforce reports {{fact:1}} open assignment.',mode:'conversation'},observed).narrative,/1 open assignment/);});
