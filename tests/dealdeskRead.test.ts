import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/dealdesk.ts';
import {readAll} from '../src/components/DealDeskRecords.tsx';
test('private CRM requires authentication and forces scoped reads with pagination',async()=>{
 process.env.OFFICE_ACCESS_PASSWORD='test-only-password-over-24-characters';process.env.DEALDESK_PLUGIN_API_KEY='test-only-api-key';
 const original=globalThis.fetch;let outbound:any;
 globalThis.fetch=async(_url,options)=>{outbound=JSON.parse(String(options?.body));return new Response(JSON.stringify({success:true,records:[],next_offset:null}));};
 async function call(auth:string,body:unknown,cookie=''){let result:any;const headers:Record<string,string>={};const res:any={setHeader(k:string,v:string){headers[k]=v;},end(value:string){result=JSON.parse(value)}};await handler({method:'POST',headers:{authorization:auth,cookie},body} as any,res);return {status:res.statusCode,result,headers};}
 try{
 assert.equal((await call('',{table:'Deals'})).status,401);
 const auth=`Bearer ${process.env.OFFICE_ACCESS_PASSWORD}`;
 assert.equal((await call(auth,{table:'Secret'})).status,400);
 assert.equal((await call(auth,{table:'Deals',offset:-1})).status,400);
 assert.equal((await call(auth,{table:'Agents',offset:100,action:'write'})).status,200);
 assert.deepEqual(outbound,{action:'read',table:'Agents',offset:100,limit:100,include_archived:false});
 const signedIn=await call(auth,{table:'Deals'});const cookie=signedIn.headers['Set-Cookie'].split(';')[0];
 assert.match(signedIn.headers['Set-Cookie'],/HttpOnly/);
 assert.equal((await call('',{table:'Buyers'},cookie)).status,200);
 assert.equal((await call('',{table:'Buyers'},cookie+'invalid')).status,401);
 const logout=await call('',{action:'logout'},cookie);assert.match(logout.headers['Set-Cookie'],/Max-Age=0/);
 process.env.OFFICE_ACCESS_PASSWORD='short-ok';assert.equal((await call('Bearer short-ok',{table:'Deals'})).status,200);
 assert.equal((await call('',{table:'Deals'},cookie)).status,401);
 }finally{globalThis.fetch=original;delete process.env.OFFICE_ACCESS_PASSWORD;delete process.env.DEALDESK_PLUGIN_API_KEY;}
});
test('reader retrieves all pages and rejects non-JSON errors and broken pagination',async()=>{
 const original=globalThis.fetch;const offsets:number[]=[];
 try{
 globalThis.fetch=async(_url,options)=>{const {offset}=JSON.parse(String(options?.body));offsets.push(offset);return new Response(JSON.stringify({records:[{id:String(offset)}],next_offset:offset===0?100:null}));};
 assert.equal((await readAll('Deals','test',new AbortController().signal)).length,2);assert.deepEqual(offsets,[0,100]);
 globalThis.fetch=async()=>new Response('<html>404</html>',{status:404});
 await assert.rejects(readAll('Deals','test',new AbortController().signal),/API is unavailable/);
 globalThis.fetch=async()=>new Response(JSON.stringify({records:[],next_offset:0}));
 await assert.rejects(readAll('Deals','test',new AbortController().signal),/pagination/);
 }finally{globalThis.fetch=original;}
});
