import {dateDue} from './audit.js';

const contracted=new Set(['Seller Accepted Offer','Agent Sending Contract','Deal Under Contract']);
const terminal=new Set(['Completed','Failed','Canceled','Cancelled']);
const closed=new Set(['Offer Declined and Sold','Sold To Another Investor','Deal Canceled','No Longer Interested In Buying','Declined','Deal No Longer Available','Deal Successfully Closed']);
const departments=['Acquisitions','Dispositions','Marketing','Data','Finance','Administration'];
const supportedMilestones={inspectionDate:'Recorded inspection date',emdDate:'Recorded earnest-money date'};
const absentMilestones=['due-diligence deadline','financing deadline','scheduled closing date','buyer-contract deadline','title requirements'];

// Derived observations only. This module has no CRM mutation or employee execution capability.
export function operationsIntelligence(snapshot,auditReport,{period='daily',now=new Date(),thresholdHours=72,history=[]}={}){
 if(!['daily','weekly','monthly'].includes(period))throw new Error('INVALID_REPORT_PERIOD');
 if(!Number.isFinite(thresholdHours)||thresholdHours<1||thresholdHours>720)throw new Error('INVALID_DEADLINE_THRESHOLD');
 const milestones=[],gaps=[],contacts=[],financial=[];
 for(const d of snapshot.Deals.records){
  if(/DISPOSABLE.*(?:SYNTHETIC|TEST)/i.test(String(d.address||'')))continue;
  const active=contracted.has(d.offerDecision);
  for(const [field,label] of Object.entries(supportedMilestones)){
   const delta=dateDue(d[field],now.getTime());
   if(d[field]&&!closed.has(d.offerDecision))milestones.push({recordType:'Deals',recordId:d.id,field,label,value:d[field],state:delta===null?'invalid':delta<0?'overdue':delta<=thresholdHours*3600000?'approaching':'upcoming',basis:'recorded-date',contractVerified:false});
   else if(active)gaps.push({recordType:'Deals',recordId:d.id,field,reason:'Missing recorded milestone date; verify executed agreement.'});
  }
  if(active){if(!d.underContractDate)gaps.push({recordType:'Deals',recordId:d.id,field:'underContractDate',reason:'Missing recorded contract execution date.'});for(const field of absentMilestones)gaps.push({recordType:'Deals',recordId:d.id,field,reason:'No supported contractual source configured; not inferred from standard terms.'});}
  for(const field of ['renovationEstimate','newConstructionEstimate','listPrice','offerPrice','negotiatedAskingPrice'])if(d[field]!==null&&d[field]!==undefined&&(!Number.isFinite(Number(d[field]))||Number(d[field])<0))financial.push({recordType:'Deals',recordId:d.id,field,reason:'Invalid or negative recorded financial value; human review required.'});
 }
 for(const table of ['Buyers','Agents'])for(const r of snapshot[table].records)if(!r.name||!r.email&&!r.phone)contacts.push({recordType:table,recordId:r.id,reason:!r.name?'Missing contact name':'No recorded email or phone'});
 const tasks=snapshot.PluginTasks.records;
 const outstanding=tasks.filter(t=>!terminal.has(t.status));
 const horizon=period==='daily'?1:period==='weekly'?7:30;
 const prior=history.filter(r=>r.complete&&Date.parse(r.executedAt)>=now.getTime()-horizon*86400000&&Date.parse(r.executedAt)<now.getTime()).sort((a,b)=>Date.parse(a.executedAt)-Date.parse(b.executedAt));
 const baseline=prior[0];
 return {period,generatedAt:now.toISOString(),authorityLevel:1,readOnly:true,coverage:auditReport.completeness,
  verified:{activeTransactions:snapshot.Deals.records.filter(d=>contracted.has(d.offerDecision)).map(d=>({recordType:'Deals',recordId:d.id,pipelineStatus:d.offerDecision,queueStatus:d.queueStatus||null})),outstandingTasks:outstanding.map(t=>({recordType:'PluginTasks',recordId:t.id,status:t.status||'Unknown',assignee:t.assignee||null,relatedRecordId:t.entityId||null})),milestones,contactGaps:contacts,financialExceptions:financial},
  calculated:{observedOutstandingTaskCount:outstanding.length,observedCompletedTaskCount:tasks.filter(t=>t.status==='Completed').length,observedFailedTaskCount:tasks.filter(t=>t.status==='Failed').length,approachingMilestoneCount:milestones.filter(m=>m.state==='approaching').length,overdueMilestoneCount:milestones.filter(m=>m.state==='overdue').length,historySamples:prior.length,activeRecordChange:baseline&&auditReport.complete?auditReport.pipelineHealth.active-baseline.pipelineHealth.active:null,comparisonBasis:baseline&&auditReport.complete?'Change in observed active-record counts; not transaction completion or employee performance.':'No complete comparable baseline/current snapshot in reporting window.'},
  departmentCoverage:departments.map(department=>({department,status:'activity-not-established',reviewItems:auditReport.findings.filter(f=>f.department===department).length,basis:'Audit findings are review items, not evidence of employee activity or inactivity.'})),
  missingData:gaps,limitations:['Recorded milestone dates require executed-contract verification. closedDate is not a scheduled closing deadline.','Zero returned PluginTasks does not establish no company work.','No authorized vendor-assignment, financial-ledger, departmental activity or executed-contract integration is configured.','No verified transaction completion rates, expenditure totals or employee efficiency metrics are available.'],
  recommendations:auditReport.recommendations.map(r=>({recordType:r.recordType,recordId:r.recordId,department:r.department,priority:r.priority,text:r.action,basis:'operational-recommendation',requiresHumanReview:true})),
  executiveDecisions:[]};
}

export function operationsMarkdown(r){if(!r)return '';return `\n## ${r.period[0].toUpperCase()+r.period.slice(1)} operations intelligence\n\nAuthority: Level 1, read-only. Recorded dates require contract verification.\n\n### Verified observations\n\n\`\`\`json\n${JSON.stringify(r.verified,null,2)}\n\`\`\`\n\n### Calculated metrics\n\n\`\`\`json\n${JSON.stringify(r.calculated,null,2)}\n\`\`\`\n\n### Internal workforce and human-attested milestones\n\n\`\`\`json\n${JSON.stringify(r.internalWorkforce||null,null,2)}\n\`\`\`\n\n### Missing information and integration limits\n\n${r.limitations.map(s=>'- '+s).join('\n')}\n\n\`\`\`json\n${JSON.stringify(r.missingData,null,2)}\n\`\`\`\n\nDepartment activity remains unverified; review counts do not measure performance. Recommendations above require human review.\n`;}
