import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parse} from 'dotenv';
const env=parse(fs.readFileSync('.env')),root='http://127.0.0.1:3101';
const headers={'Content-Type':'application/json','X-AZRE-Request':'1'};
const login=await fetch(root+'/auth/login',{method:'POST',headers,body:JSON.stringify({password:env.CHAT_ACCESS_PASSWORD})});assert.equal(login.status,200);
headers.Cookie=login.headers.get('set-cookie').split(';')[0];
try{
 const create=await fetch(root+'/chat/conversations',{method:'POST',headers,body:JSON.stringify({agentId:'azre-operations-manager'})});assert.equal(create.status,201);const conversation=await create.json();
 const response=await fetch(root+`/chat/conversations/${conversation.id}/messages`,{method:'POST',headers,body:JSON.stringify({message:'Run a weekly read-only operational audit using run_operational_audit with period weekly. Explain coverage and limitations. Do not claim verified employee activity, transaction profits, or an independent MLS search. Keep property-specific conclusions limited to records you actually read.'})});
 const body=await response.text();const events=[];for(const block of body.split('\n\n')){const event=block.split('\n').find(s=>s.startsWith('event: '))?.slice(7),raw=block.split('\n').find(s=>s.startsWith('data: '))?.slice(6);if(raw)events.push({event,...JSON.parse(raw)});}
 fs.writeFileSync('data/operations-phase-a-chat-validation.json',JSON.stringify({conversationId:conversation.id,events},null,2),{mode:0o600});
 assert.ok(!events.some(e=>e.event==='error'),'Live chat error; see sanitized local evidence');const completed=events.find(e=>e.event==='complete');assert.ok(completed,'No completion');assert.ok(completed.metadata.toolCalls.some(t=>t.tool==='run_operational_audit'&&t.status==='completed'));
 console.log(JSON.stringify({model:completed.metadata.configuredModel,apiStatus:completed.metadata.apiStatus,usage:completed.metadata.usage,estimatedCostUsd:completed.metadata.estimatedCostUsd,elapsedSeconds:completed.metadata.elapsedSeconds,tools:completed.metadata.toolCalls.map(t=>({tool:t.tool,status:t.status})),narrative:completed.output.presentation.narrative}));
}finally{await fetch(root+'/auth/logout',{method:'POST',headers,body:'{}'});}
