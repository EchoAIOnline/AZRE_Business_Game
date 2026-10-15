const compatibility=new Set(['Unsupported offerDecision: Available','Unsupported offerDecision: Listing Removed - Now Off-Market']);
function deadlineField(a){return a.source_key?.startsWith('milestone:')?a.source_key.split(':').at(-1):a.detail?.match(/^(inspectionDate|emdDate|nextFollowUpDate):/)?.[1];}
export function classifyAlert(a){
 const field=deadlineField(a),milestone=['deadline','overdue-milestone','approaching-milestone','invalid-milestone'].includes(a.kind)&&field;
 let category='operational-review',severity='Normal',requiresAction=true,evidenceState='recorded-unverified',incompleteRecord=false,confirmedRisk=false;
 if(a.kind==='communication-unverified'){category='data-quality';severity='Informational';requiresAction=false;incompleteRecord=true;}
 else if(a.kind==='test-record'){category='test-data';severity='Informational';requiresAction=false;}
 else if(a.kind==='unknown-pipeline-status'&&compatibility.has(a.detail)){category='application-compatibility';severity='Informational';requiresAction=false;}
 else if(['missing-field','unknown-pipeline-status','potential-duplicate','queue-inconsistency'].includes(a.kind)){category='data-quality';incompleteRecord=a.kind==='missing-field';}
 else if(['failed','blocked','stalled-task','overdue-task'].includes(a.kind)){category='internal-workflow';severity='High';evidenceState='system-observed';confirmedRisk=true;}
 else if(a.kind==='source-unavailable'){category='integration';severity='High';evidenceState='system-observed';confirmedRisk=true;}
 else if(milestone||/contract-milestone|missing-contract-date/.test(a.kind)){category='deadline-review';severity='High';evidenceState=a.source_key?.startsWith('contract:')?'human-attested':'recorded-unverified';}
 const canonicalKey=milestone?'dealdesk:Deals:'+a.target+':milestone:'+field:(a.source_key?.startsWith('task:')?'azre-workforce:'+a.source_key:a.source_key?.startsWith('contract:')?'human-contract:'+a.source_key:'dealdesk:'+a.source_key);
 return {...a,canonicalKey,category,severity,requiresAction,evidenceState,incompleteRecord,confirmedRisk,classificationVersion:1};
}
export function alertAudit(rows){
 const grouped=new Map();for(const row of rows){const a=classifyAlert(row);const key=a.owner+'|'+a.canonicalKey;if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(a);}
 const groups=[...grouped.values()].map(items=>{items.sort((a,b)=>(b.kind==='overdue-milestone')-(a.kind==='overdue-milestone')||b.last_seen.localeCompare(a.last_seen));return {...items[0],status:items.some(a=>a.status==='Open')?'Open':items[0].status,originalAlertIds:items.map(a=>a.id),duplicateCount:items.length-1,history:items.map(a=>({id:a.id,kind:a.kind,status:a.status,detail:a.detail,created:a.created,lastSeen:a.last_seen}))};});
 const active=groups.filter(g=>g.history.some(h=>h.status==='Open'));
 const countBy=(rs,k)=>rs.reduce((a,r)=>(a[r[k]]=(a[r[k]]||0)+1,a),{});
 const totals={rawAlerts:rows.length,uniqueIssues:groups.length,duplicateAlerts:rows.length-groups.length,openUniqueIssues:active.length,critical:active.filter(a=>a.severity==='Critical').length,requiresAction:active.filter(a=>a.requiresAction).length,informational:active.filter(a=>!a.requiresAction).length,incompleteRecordIssues:active.filter(a=>a.incompleteRecord).length,incompleteRecordCount:new Set(active.filter(a=>a.incompleteRecord).map(a=>a.target)).size,confirmedOperationalRisks:active.filter(a=>a.confirmedRisk).length,unverifiedOperationalReviewItems:active.filter(a=>a.requiresAction&&a.category!=='data-quality'&&!a.confirmedRisk).length,byCategory:countBy(active,'category'),bySeverity:countBy(active,'severity')};
 const rank={Critical:0,High:1,Normal:2,Informational:3};groups.sort((a,b)=>(b.status==='Open')-(a.status==='Open')||rank[a.severity]-rank[b.severity]||b.last_seen.localeCompare(a.last_seen));
 return {totals,groups,definition:'Issue counts deduplicate matching record/field deadline findings. Informational communication gaps support bulk data review, not individual urgent tasks. Recorded offer/deadline statuses are review candidates, not independently confirmed contractual exposure. Original rows and histories are retained.'};
}
