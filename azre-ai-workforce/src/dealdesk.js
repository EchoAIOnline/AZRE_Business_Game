export const tables = ['Deals', 'Buyers', 'Agents', 'PluginTasks'];
export class IntegrationError extends Error { constructor(code) { super(code); this.code=code; } }
export class DealDesk {
  constructor({url='https://dealdesk.asharizakargroup.com/api/ai/plugin',key,fetchImpl=fetch,timeout=15000,retries=2,maxPages=100}) {
    const u=new URL(url); if(u.origin!=='https://dealdesk.asharizakargroup.com'||u.pathname!=='/api/ai/plugin'||u.search||u.hash||u.username||u.password) throw new IntegrationError('INVALID_ENDPOINT');
    Object.assign(this,{url,key,fetchImpl,timeout,retries,maxPages});
  }
  async read(table,{offset=0,limit=100,id,query,filters}={},signal) {
    if(!tables.includes(table)||!Number.isInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>100) throw new IntegrationError('INVALID_READ');
    const allowed={Deals:['queueStatus','pipelineType','listingType','address','offerDecision','subMarket','neighborhood','county','propertyType','acquisitionManager'],Buyers:['companyName','email','name','status'],Agents:['brokerage','doNotCall','email','name'],PluginTasks:['assignee','entityId','entityType','status']};
    if(query!==undefined&&(typeof query!=='string'||query.length>200)||filters&&Object.keys(filters).some(k=>!allowed[table].includes(k)))throw new IntegrationError('INVALID_READ');
    if(!this.key) throw new IntegrationError('AUTH_CONFIGURATION');
    for(let attempt=0;attempt<=this.retries;attempt++) {
      signal?.throwIfAborted();
      try {
        const response=await this.fetchImpl(this.url,{method:'POST',redirect:'error',headers:{Authorization:`Bearer ${this.key}`,'Content-Type':'application/json'},body:JSON.stringify({action:'read',table,offset,limit,include_archived:false,...(id?{id}:{}),...(query?{query}:{}),...(filters?{filters}:{})}),signal:AbortSignal.any([AbortSignal.timeout(this.timeout),...(signal?[signal]:[])])});
        if([401,403].includes(response.status)) throw new IntegrationError('AUTH_FAILED');
        if(response.status===404) throw new IntegrationError('NOT_FOUND');
        if(response.status===429||response.status>=500) throw new IntegrationError('RETRYABLE_UPSTREAM');
        if(!response.ok) throw new IntegrationError('UPSTREAM_REJECTED');
        const reader=response.body.getReader(); let size=0; const chunks=[];
        while(true) {const {done,value}=await reader.read(); if(done)break; size+=value.length;if(size>2_000_000){await reader.cancel();throw new IntegrationError('RESPONSE_TOO_LARGE');}chunks.push(value);}
        let data; try {data=JSON.parse(Buffer.concat(chunks).toString());}catch{throw new IntegrationError('INVALID_RESPONSE');}
        if(data.success!==true||!Array.isArray(data.records)||data.records.some(r=>!r||typeof r.id!=='string')||!(data.next_offset===null||Number.isInteger(data.next_offset)&&data.next_offset>offset)) throw new IntegrationError('INVALID_RESPONSE');
        return data;
      } catch(e) {
        if(signal?.aborted) throw new IntegrationError('EXECUTION_TIMEOUT');
        const code=e instanceof IntegrationError?e.code:'CONNECTION_ERROR';
        if(!['CONNECTION_ERROR','RETRYABLE_UPSTREAM'].includes(code)||attempt===this.retries) throw new IntegrationError(code);
        await new Promise(r=>setTimeout(r,Math.min(2000,200*2**attempt)));
      }
    }
  }
  async collect(table,signal) {
    const records=[];const seen=new Set();let offset=0;
    try {for(let p=0;p<this.maxPages;p++){const page=await this.read(table,{offset},signal);for(const record of page.records){if(seen.has(record.id))throw new IntegrationError('PAGINATION_DUPLICATE');seen.add(record.id);records.push(record);}if(page.next_offset===null)return {records,complete:true,error:null};offset=page.next_offset;}throw new IntegrationError('PAGE_LIMIT');}
    catch(e){return {records,complete:false,error:e.code||'INTEGRATION_ERROR'};}
  }
}
