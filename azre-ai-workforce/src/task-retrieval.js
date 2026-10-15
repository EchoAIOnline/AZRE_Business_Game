import {taskSource} from './evidence-sources.js';
export async function crmTaskSummary(client,{signal,observed}={}){
 const snapshot=await client.collect('PluginTasks',signal);
 const records=snapshot.records.slice(0,6).map(r=>{const record=Object.fromEntries(['id','title','status','priority','dueDate','assignee','entityId','entityType'].filter(k=>r[k]!==undefined).map(k=>[k,r[k]]));record.source=taskSource('PluginTasks',r.id);observed?.set('PluginTasks/'+r.id,record);return record;});
 const metric=snapshot.complete?{id:'crm_task_records_returned',label:'DealDesk CRM PluginTasks records returned; excludes internal workforce assignments',count:snapshot.records.length,source:{system:'dealdesk',entity:'crm-task'}}:null;
 if(metric)observed?.set('Summary/'+metric.id,metric);
 return {source:{system:'dealdesk',entity:'crm-task',evidenceTable:'PluginTasks'},complete:snapshot.complete,error:snapshot.error,metric,records,retrievedAt:new Date().toISOString(),scope:'Complete count only if retrieval succeeded. Up to six source-specific record samples. Zero CRM tasks does not mean no internal workforce work.'};
}
