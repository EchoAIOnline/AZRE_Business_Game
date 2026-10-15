import {createHash} from 'node:crypto';
import {readBody} from './chat-http.js';
import {RYAN_ID} from './agent-registry.js';
const errors=new Set(['TASK_NOT_FOUND','TASK_NOT_ASSIGNED','INVALID_TASK','INVALID_RECORD','RECORD_NOT_FOUND','CAPABILITY_DENIED','INVALID_TASK_TRANSITION','WORKER_TRANSITION_REQUIRED','REVIEW_EVIDENCE_REQUIRED','RETRY_LIMIT','IDEMPOTENCY_CONFLICT','INVALID_MONITOR_CONFIG','INVALID_PROPOSAL','INVALID_DECISION','APPROVAL_NOT_PENDING','BODY_TOO_LARGE','INVALID_JSON','INVALID_WORKFORCE_CONFIG','CONFIG_VERSION_CONFLICT','WORKFORCE_PAUSED','DELEGATION_DISABLED','EMPLOYEE_EXECUTION_DISABLED','TASK_CAPACITY_LIMIT','TASK_APPROVAL_REQUIRED','INVALID_MILESTONE','MILESTONE_NOT_FOUND']);
export async function operationsHttp(req,send,operations,owner,path,{interactive=false}={}){
 if(!path.startsWith('/operations/')||path.startsWith('/operations/reports/'))return false;
 try{
  if(req.method==='GET'&&path==='/operations/workforce'){send(200,operations.management.snapshot(owner));return true;}
  if(req.method==='GET'&&path==='/operations/dashboard'){send(200,operations.dashboard(owner));return true;}
  if(req.method!=='POST'){send(404,{error:'NOT_FOUND'});return true;}
  const b=await readBody(req);let result;
  if(['/operations/controls','/operations/integrations/check'].includes(path)&&!interactive){send(403,{error:'EXECUTIVE_SESSION_REQUIRED'});return true;}
  if(path==='/operations/controls'){send(200,operations.management.configure(owner,b));return true;}
  if(path==='/operations/integrations/check'){send(200,await operations.management.checkIntegrations(owner));return true;}
  if(path==='/operations/tasks'){result=await operations.createTask(owner,b,b.idempotencyKey,{actor:'human-ashari-zakar'});send(201,result);return true;}
  const approvalTask=path.match(/^\/operations\/tasks\/([a-z0-9-]+)\/request-approval$/);if(approvalTask){if(!interactive){send(403,{error:'EXECUTIVE_SESSION_REQUIRED'});return true;}const t=operations.state.task(approvalTask[1],owner);send(201,operations.state.propose(owner,'task-execution',JSON.stringify({taskId:t.id,payloadHash:createHash('sha256').update(JSON.stringify(t.payload)).digest('hex'),parameters:t.payload,scope:'One internal read-only task; no external actions authorized'})));return true;}
  const task=path.match(/^\/operations\/tasks\/([a-z0-9-]+)\/(transition|execute)$/);
  if(task){result=task[2]==='execute'?await operations.executeTask(owner,task[1]):operations.transitionTask(owner,task[1],b.status,{assigneeId:b.assigneeId,reviewEvidence:b.reviewEvidence});}
  else if(path==='/operations/milestones'){result=await operations.recordMilestone(owner,b);}
  else if(/^\/operations\/milestones\/[a-z0-9-]+\/close$/.test(path)){result=operations.state.closeMilestone(owner,path.split('/')[3],b.status);operations.milestoneAlerts(owner);}
  else if(path==='/operations/monitor/config'){result=operations.configureMonitor(owner,b);}
  else if(path==='/operations/monitor/run'){result=await operations.monitorNow(owner);}
  else if(path==='/operations/approvals'){result=operations.state.propose(owner,b.category,b.proposal);}
  else{const approval=path.match(/^\/operations\/approvals\/([a-z0-9-]+)\/decide$/);if(approval){if(!interactive){send(403,{error:'EXECUTIVE_SESSION_REQUIRED'});operations.state.event(owner,RYAN_ID,'approval-action-denied',approval[1],3,'denied',{});return true;}result=operations.state.decide(owner,approval[1],b.decision);}else{send(403,{error:'ACTION_NOT_AUTHORIZED'});operations.state.event(owner,RYAN_ID,'action-denied',path,3,'denied',{});return true;}}
  send(200,result);return true;
 }catch(e){const code=errors.has(e.message)?e.message:'OPERATIONS_FAILED';operations.state.event(owner,RYAN_ID,'request-failed',path,2,'failed',{code});send(code==='TASK_NOT_FOUND'?404:code==='CAPABILITY_DENIED'?403:code==='OPERATIONS_FAILED'?503:400,{error:code});return true;}
}
