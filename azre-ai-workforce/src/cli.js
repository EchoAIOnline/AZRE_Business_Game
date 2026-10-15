import {WorkforceChat} from './workforce-chat.js';
import {OperationsService} from './operations-service.js';
import {PlatformKnowledgeService} from './knowledge-service.js';
import fs from 'node:fs';
import {KnowledgeIndex} from './knowledge.js';
import {DealDesk} from './dealdesk.js';
import {ChatStore} from './chat-store.js';
import {ChatService} from './chat.js';
import {Service} from './service.js';
import {createApi,schedule} from './server.js';
const client=new DealDesk({url:process.env.DEALDESK_PLUGIN_URL,key:process.env.DEALDESK_PLUGIN_API_KEY});
const store=new ChatStore(process.env.STATE_DB||'data/operations.sqlite');
const service=new Service({client,store,model:process.env.OPENAI_MODEL,reportDir:process.env.REPORT_DIR||'data/reports',deadlineThresholdHours:Number(process.env.OPERATIONS_DEADLINE_THRESHOLD_HOURS||72)});
const [command,workflow='daily-audit']=process.argv.slice(2);
try{
 const knowledge=process.env.KNOWLEDGE_ENABLED==='true'||command==='knowledge-index'?new KnowledgeIndex({config:JSON.parse(fs.readFileSync(process.env.KNOWLEDGE_CONFIG||'config/knowledge.json','utf8')),dbPath:process.env.KNOWLEDGE_DB||'data/knowledge.sqlite'}):null;
 if(command==='knowledge-index'){const result=await knowledge.sync();console.log(JSON.stringify(result,null,2));knowledge.close();store.close();if(result.errors.length)process.exitCode=1;}
 else  if(command==='verify'){let failed=false;for(const table of ['Deals','Buyers','Agents','PluginTasks']){try{const page=await client.read(table,{limit:1});console.log(JSON.stringify({table,authenticated:true,records:page.records.length,pagination:page.next_offset!==null}));}catch(e){failed=true;console.log(JSON.stringify({table,error:e.code}));}}store.close();if(failed)process.exitCode=1;}
 else if(command==='run'){const periodArg=process.argv.indexOf('--period');const r=await service.execute(workflow,{rulesOnly:process.argv.includes('--rules-only'),period:periodArg<0?'daily':process.argv[periodArg+1]});console.log(JSON.stringify({executionId:r.executionId,complete:r.complete,aiStatus:r.aiStatus,period:r.operations.period,coverage:r.completeness,findings:r.findings.length}));store.close();if(!r.complete||r.aiStatus==='failed')process.exitCode=1;}
 else if(command==='serve'){const chat=new WorkforceChat({store,service,platformKnowledge:knowledge?new PlatformKnowledgeService({index:knowledge}):null,model:process.env.OPENAI_MODEL,dailyLimit:Number(process.env.CHAT_DAILY_TOKEN_LIMIT||400000),turnLimit:Number(process.env.CHAT_TURN_TOKEN_LIMIT||80000),maxConcurrent:Number(process.env.CHAT_MAX_CONCURRENT||2),inputLimit:Number(process.env.CHAT_INPUT_TOKEN_LIMIT||16000),outputLimit:Number(process.env.CHAT_OUTPUT_TOKEN_LIMIT||2000),reportOutputLimit:Number(process.env.CHAT_REPORT_OUTPUT_TOKEN_LIMIT||3200),maxToolCalls:Number(process.env.CHAT_MAX_TOOL_CALLS||8),maxToolBytes:Number(process.env.CHAT_TOOL_RESPONSE_BYTES||14000),historyMessages:Number(process.env.CHAT_HISTORY_MESSAGES||12),historyChars:Number(process.env.CHAT_HISTORY_CHARS||6000)});const operations=new OperationsService({store,service,workforce:chat,stalledHours:Number(process.env.OPERATIONS_STALLED_HOURS||48)});chat.clients.get('azre-operations-manager').operations=operations;operations.start();const server=createApi(service,process.env.STATUS_API_TOKEN,{chat,operations,password:process.env.CHAT_ACCESS_PASSWORD,userId:process.env.CHAT_USER_ID||'ceo'});const jobs=schedule(service,{enabled:process.env.SCHEDULE_ENABLED==='true',auditCron:process.env.AUDIT_CRON,briefingCron:process.env.BRIEFING_CRON});server.listen(Number(process.env.PORT||3101),process.env.HOST||'127.0.0.1',()=>console.log('AZRE Operations Manager API started'));for(const s of ['SIGINT','SIGTERM'])process.on(s,async()=>{jobs.forEach(j=>j.stop());await operations.stop();server.close(()=>{knowledge?.close();store.close();process.exit(0);});});}
 else throw new Error('Use run <workflow>, verify, or serve');
}catch{console.error('Command failed. Check configuration and sanitized execution history.');store.close();process.exitCode=1;}
