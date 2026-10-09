import {useState} from 'react';
export type CrmRecord = Record<string, unknown>;
export const crmTables = ['Deals','Buyers','Agents','PluginTasks'] as const;
export type CrmTable = typeof crmTables[number];
export type CrmSnapshot = Record<CrmTable, CrmRecord[]>;
export const emptySnapshot = ():CrmSnapshot => ({Deals:[],Buyers:[],Agents:[],PluginTasks:[]});
export const recordLabel = (r:CrmRecord) => String(r.address || r.name || r.title || r.id || 'Record');
export async function readAll(table:CrmTable,password:string,signal:AbortSignal):Promise<CrmRecord[]> {
  const records:CrmRecord[]=[]; let offset=0;
  for (;;) {
    const response=await fetch('/api/dealdesk',{method:'POST',signal,headers:{'Content-Type':'application/json',Authorization:`Bearer ${password}`},body:JSON.stringify({table,offset})});
    const text=await response.text();let data;
    try {data=JSON.parse(text);} catch {throw new Error('The CRM API is unavailable at this address. Use the updated Vercel deployment, or restart the local development server.');}
    if (!response.ok) throw new Error(typeof data.error==='string'?data.error:`DealDesk read failed (${response.status}).`);
    if (!Array.isArray(data.records)) throw new Error('Invalid CRM response.');
    records.push(...data.records);
    if (data.next_offset===null) return records;
    if (!Number.isInteger(data.next_offset)||data.next_offset<=offset||data.next_offset>100000) throw new Error('DealDesk pagination could not be completed.');
    offset=data.next_offset;
  }
}
export function DealDeskRecords({snapshot,errors}:{snapshot:CrmSnapshot;errors:Partial<Record<CrmTable,string>>}) {
 const [table,setTable]=useState<CrmTable>('Deals');const [query,setQuery]=useState('');
 const records=snapshot[table].filter(r=>JSON.stringify(r).toLowerCase().includes(query.toLowerCase()));
 return <section><h2>CRM Records</h2><p>Read-only DealDesk data · Expand a record to inspect every field returned by the API.</p><div className="wd-filters">{crmTables.map(t=><button key={t} aria-pressed={table===t} onClick={()=>setTable(t)}>{t==='PluginTasks'?'Tasks':t} ({snapshot[t].length})</button>)}<input aria-label="Search CRM records" placeholder="Search all record fields…" value={query} onChange={e=>setQuery(e.target.value)}/></div>{errors[table]?<p role="alert">{errors[table]}</p>:<p>{records.length} records</p>}{records.map((record,index)=><details className="wd-record" key={String(record.id||index)}><summary>{recordLabel(record)}</summary><dl>{Object.entries(record).map(([key,value])=><div className="wd-row" key={key}><dt>{key}</dt><dd>{typeof value==='object'?<pre>{JSON.stringify(value,null,2)}</pre>:String(value??'—')}</dd></div>)}</dl></details>)}</section>;
}
