import {taskSource} from './evidence-sources.js';
export const workflows=['daily-audit','pipeline-review','task-review','executive-briefing'];
export const pipelineValues=['No Offer Made Yet','Seller Counter-Offered','Monitoring Pending Status Before Offer','Requires A Buyers Agent','Made Verbal Offer On Property','Made Written Offer On Property','Monitoring Pending Status After Offer','Monitoring Offer After Seller Declined','Research','Analyzing','Seller Accepted Offer','Agent Sending Contract','Deal Under Contract','Listing Removed - Now Off Market','Offer Declined','Offer Declined and Sold','Sold To Another Investor','Deal Canceled','Priced Too High To Buy','No Longer Interested In Buying','Declined','Deal No Longer Available','Deal Successfully Closed'];
const closed=new Set(['Offer Declined and Sold','Sold To Another Investor','Deal Canceled','No Longer Interested In Buying','Declined','Deal No Longer Available','Deal Successfully Closed']);
// Supported DFD stages and a documented spelling already handled by retrieval.
// Preserve raw source labels and counts; this only prevents false schema alarms.
const compatiblePipelineValues=new Set([...pipelineValues,'Available','No Longer Available','Listing Removed - Now Off-Market']);
export function communication(d){
  const meaningful=['Spoke With Agent','Offer Declined','Offer Accepted'];
  if(meaningful.includes(d.contactStatus))return 'documented';
  // A timestamp or outbound attempt alone does not establish meaningful communication.
  if(d.contactStatus==='Agent Not Contacted Yet')return 'not-contacted';
  return 'unknown'; // Free-text logs are review evidence, never executable instructions or automatic proof.
}
export function dateDue(value,now){if(!value)return null;const s=String(value);const time=/^\d{4}-\d{2}-\d{2}$/.test(s)?Date.parse(s+'T23:59:59'+new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',timeZoneName:'longOffset'}).formatToParts(new Date(s+'T17:00:00Z')).find(p=>p.type==='timeZoneName').value.replace('GMT','')):Date.parse(s);return Number.isFinite(time)?time-now:null;}
const count=(rs,k)=>rs.reduce((a,r)=>{const v=r[k]||'Unknown';a[v]=(a[v]||0)+1;return a;},{});
export function audit(snapshot,workflow,now=new Date()) {
  const findings=[];const add=(r,type,detail,department='Acquisitions',priority='Normal')=>findings.push({recordId:r.id,recordType:r.entityType||'Deals',type,detail,department,priority,basis:'verified-record',requiresHumanReview:true});
  const deals=snapshot.Deals.records;const tasks=snapshot.PluginTasks.records.filter(t=>!['Completed','Canceled','Cancelled','Failed'].includes(t.status)); const seen=new Map();
  for(const d of deals){
    if(/DISPOSABLE.*(?:SYNTHETIC|TEST)/i.test(String(d.address||''))){add(d,'test-record','Record is explicitly labelled disposable synthetic test data; exclude from business priorities','Operations','Low');continue;}
    for(const field of ['address','propertyType','listingType','offerDecision','queueStatus'])if(!d[field])add(d,'missing-field',`Missing ${field}`);
    if(d.offerDecision&&!compatiblePipelineValues.has(d.offerDecision))add(d,'unknown-pipeline-status',`Unsupported offerDecision: ${d.offerDecision}`);
    const c=communication(d);if(d.queueStatus==='In Queue'&&c==='documented'||d.queueStatus==='In Pipeline'&&c==='not-contacted')add(d,'queue-inconsistency',`Queue ${d.queueStatus}; communication evidence ${c}`);
    else if(c==='unknown')add(d,'communication-unverified','Review communication history; attached agent is not proof of contact');
    if(d.queueStatus&&!['In Queue','In Pipeline'].includes(d.queueStatus))add(d,'unknown-queue-status','Review unsupported queueStatus');
    if(d.queueStatus==='In Queue'&&d.pipelineType&&d.pipelineType!=='azre-queue')add(d,'pipeline-identity-conflict','Queue placement conflicts with derived pipelineType');
    const validMls=d.mls&&!['n/a','na','none','unknown','0','-'].includes(String(d.mls).trim().toLowerCase());const key=validMls?`mls:${String(d.mls).trim().toLowerCase()}`:`address:${String(d.address||'').trim().toLowerCase().replace(/\s+/g,' ')}`;
    if(key!=='address:'){if(seen.has(key))add(d,'potential-duplicate',`Compare with record ${seen.get(key)}`);else seen.set(key,d.id);}
    if(closed.has(d.offerDecision))continue;
    if(['Research','Analyzing'].includes(d.offerDecision)&&!d.renovationARV&&!d.newConstructionARV)add(d,'underwriting','Awaiting recorded underwriting values');
    if(['Seller Counter-Offered','Made Written Offer On Property','Made Verbal Offer On Property'].includes(d.offerDecision))add(d,'offer-review','Review pending offer and documented response','Acquisitions','High');
    if(d.contactStatus==='Waiting To Hear Back')add(d,'response-pending','Review outstanding agent response','Acquisitions','High');
    for(const [field,dept] of [['nextFollowUpDate','Acquisitions'],['inspectionDate','Transactions'],['emdDate','Transactions']]){const due=dateDue(d[field],now.getTime());if(due!==null&&due<86400000)add(d,'deadline',`${field}: ${d[field]}`,dept,due<0?'Urgent':'High');}
    if(['Seller Accepted Offer','Agent Sending Contract','Deal Under Contract'].includes(d.offerDecision)){if(!d.underContractDate)add(d,'transaction-information','Verify contract date and deadlines','Transactions','High');add(d,'disposition-review','Review buyer readiness using recorded buyer criteria','Dispositions','High');}
  }
  const taskReview=tasks.map(t=>{const due=dateDue(t.dueDate,now.getTime());const invalid=t.dueDate&&due===null;return {recordId:t.id,relatedRecordId:t.entityId||null,recordType:'PluginTasks',relatedRecordType:t.entityType||null,source:taskSource('PluginTasks',t.id),title:t.title||'Untitled',status:t.status||'Unknown',assignee:t.assignee||null,department:t.entityType==='Buyers'?'Dispositions':t.entityType==='Deals'?'Acquisitions':'Operations',dueDate:t.dueDate||null,overdue:due!==null&&due<0,blocked:!t.assignee||!t.entityId||!!invalid,priority:due!==null&&due<0?'Urgent':t.priority||'Normal'};}).sort((a,b)=>['Urgent','High','Normal','Low'].indexOf(a.priority)-['Urgent','High','Normal','Low'].indexOf(b.priority)||String(a.dueDate||'9999').localeCompare(String(b.dueDate||'9999')));
  for(const t of taskReview)if(t.overdue||t.blocked)add({id:t.recordId,entityType:'PluginTasks'},t.overdue?'overdue-task':'potentially-blocked-task',t.overdue?'Recorded task deadline is overdue':'Verify assignee, related record and due date',t.department,t.priority);
  const completeness=Object.fromEntries(Object.entries(snapshot).map(([k,v])=>[k,{examined:v.records.length,complete:v.complete,error:v.error}]));
  return {workflow,executedAt:now.toISOString(),timezone:'America/New_York',localTime:now.toLocaleString('en-US',{timeZone:'America/New_York'}),complete:Object.values(snapshot).every(v=>v.complete),completeness,pipelineHealth:{examined:deals.length,active:deals.filter(d=>!closed.has(d.offerDecision)).length,queueDistribution:count(deals,'queueStatus'),pipelineDistribution:count(deals,'offerDecision')},findings,taskReview,recommendations:findings.map(f=>({...f,basis:'rule-recommendation',action:`Human review: ${f.detail}`}))};
}
export function markdown(r){return `# AZRE Operations Manager\n\n${r.localTime} America/New_York\n\nAudit coverage: **${r.complete?'Complete retrieval':'PARTIAL'}**. AI briefing: ${r.aiStatus||'not run'}.\n\n## Executive summary\n\n${r.briefing?.executiveSummary||'Rule-based audit; executive AI briefing unavailable.'}\n\n## Pipeline health\n\n${r.pipelineHealth.active} active of ${r.pipelineHealth.examined} examined records.\n\n\`\`\`json\n${JSON.stringify(r.completeness,null,2)}\n\`\`\`\n\n## Verified findings and recommended human actions\n\n${r.recommendations.map(f=>`- [${f.priority}] ${f.department}: ${f.action} (${f.recordType}/${f.recordId})`).join('\n')||'No rule findings in retrieved records.'}\n\n## Task review\n\n\`\`\`json\n${JSON.stringify(r.taskReview,null,2)}\n\`\`\`\n\n## AI execution metadata\n\n\`\`\`json\n${JSON.stringify(r.aiExecution||null,null,2)}\n\`\`\`\n\n## AI recommendations (unverified until human review)\n\n\`\`\`json\n${JSON.stringify(r.briefing||null,null,2)}\n\`\`\`\n`;}
