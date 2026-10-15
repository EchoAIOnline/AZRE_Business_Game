import fs from 'node:fs';
import assert from 'node:assert/strict';
import {config,parse} from 'dotenv';
import {DealDesk} from '../src/dealdesk.js';
import {ChatStore} from '../src/chat-store.js';
import {Service} from '../src/service.js';
config({quiet:true});
const parent=fs.existsSync('../.env.local')?parse(fs.readFileSync('../.env.local')):{};
const client=new DealDesk({url:process.env.DEALDESK_PLUGIN_URL,key:process.env.DEALDESK_PLUGIN_API_KEY||parent.DEALDESK_PLUGIN_API_KEY2||parent.DEALDESK_PLUGIN_API_KEY});
const store=new ChatStore(process.env.STATE_DB||'data/operations.sqlite');
const service=new Service({client,store,model:process.env.OPENAI_MODEL,reportDir:process.env.REPORT_DIR||'data/reports'});
const results=[];
try{for(const period of ['daily','weekly','monthly']){
 const r=await service.execute('executive-briefing',{rulesOnly:true,period});
 assert.equal(r.complete,true,'Incomplete live DealDesk coverage');assert.equal(r.operations.authorityLevel,1);
 assert.equal(store.latest().report.executionId,r.executionId);
 const reportDir=service.reportDir;assert.equal(JSON.parse(fs.readFileSync(`${reportDir}/${r.executionId}.json`)).operations.period,period);assert.match(fs.readFileSync(`${reportDir}/${r.executionId}.md`,'utf8'),/operations intelligence/);
 const item={period,executionId:r.executionId,complete:r.complete,coverage:r.completeness,elapsedSeconds:r.elapsedSeconds,metrics:r.operations.calculated,activeTransactions:r.operations.verified.activeTransactions.length,missingContractInformation:r.operations.missingData.length,apiStatus:'not-attempted',reason:'Deterministic source-backed operational report; no AI generation claimed.'};results.push(item);console.log(JSON.stringify(item));
}fs.writeFileSync('data/operations-phase-a-validation.json',JSON.stringify({verifiedAt:new Date().toISOString(),results},null,2),{mode:0o600});}finally{store.close();}
