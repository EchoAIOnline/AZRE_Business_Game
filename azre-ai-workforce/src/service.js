import {tables} from './dealdesk.js';
import {audit,markdown,workflows} from './audit.js';
import {brief,safeAiError} from './agent.js';
import {mkdir,writeFile} from 'node:fs/promises';
import {operationsIntelligence,operationsMarkdown} from './operations-intelligence.js';
export function reportForOwner(report,owner){if(!report||!report.internalOwner||report.internalOwner===owner)return report;const safe={...report,operations:{...report.operations}};delete safe.operations.internalWorkforce;delete safe.internalOwner;return safe;}
export class Service{
 constructor({client,store,model,timeout=120000,reportDir='data/reports',briefImpl=brief,deadlineThresholdHours=72}){if(!Number.isFinite(deadlineThresholdHours)||deadlineThresholdHours<1||deadlineThresholdHours>720)throw new Error('INVALID_DEADLINE_THRESHOLD');Object.assign(this,{client,store,model,timeout,reportDir,briefImpl,deadlineThresholdHours});}
 async execute(workflow,{rulesOnly=false,period='daily',thresholdHours=this.deadlineThresholdHours,owner='ceo'}={}){
  if(!['daily','weekly','monthly'].includes(period))throw new Error('INVALID_REPORT_PERIOD');
  if(!workflows.includes(workflow))throw new Error('UNKNOWN_WORKFLOW');const id=this.store.start(workflow,this.timeout+30000);if(!id)throw new Error('WORKFLOW_BUSY');const signal=AbortSignal.timeout(this.timeout);const started=Date.now();
  try{
   const snapshot={};for(const table of tables)snapshot[table]=await this.client.collect(table,signal);
   const report=audit(snapshot,workflow);report.executionId=id;report.aiStatus=rulesOnly?'disabled':'pending';
   report.operations=operationsIntelligence(snapshot,report,{period,thresholdHours,history:this.store.operationalHistory?.()||[]});
   if(this.internalContext){report.operations.internalWorkforce=this.internalContext(owner);report.internalOwner=owner;}
   if(!rulesOnly){try{report.briefing=await this.briefImpl(report,{model:this.model,signal});report.aiStatus='completed';}catch(error){report.aiStatus='failed';report.aiError=safeAiError(error);}}
   report.elapsedSeconds=(Date.now()-started)/1000;
   report.operationalErrors=Object.entries(snapshot).filter(([,v])=>v.error).map(([table,v])=>({table,code:v.error}));if(report.aiStatus==='failed')report.operationalErrors.push({table:'OpenAI',code:report.aiError});
   await mkdir(this.reportDir,{recursive:true,mode:0o700});await writeFile(`${this.reportDir}/${id}.json`,JSON.stringify(report,null,2),{mode:0o600});await writeFile(`${this.reportDir}/${id}.md`,markdown(report)+operationsMarkdown(report.operations),{mode:0o600});
   this.store.finish(id,report.complete&&report.aiStatus!=='failed'?'Completed':'Error',report,report.complete&&report.aiStatus!=='failed'?null:'PARTIAL_EXECUTION');return report;
  }catch{this.store.finish(id,'Error',null,'EXECUTION_FAILED');throw new Error('EXECUTION_FAILED');}
 }
}
