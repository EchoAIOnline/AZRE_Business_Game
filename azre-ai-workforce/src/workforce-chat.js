import {groupMarkdown} from './group-markdown.js';
import {ChatService} from './chat.js';import {employees,employee,publicRegistry,GENERAL_ID,RYAN_ID,resolveMentions,human} from './agent-registry.js';
export class WorkforceChat{
 constructor({store,platformKnowledge,service,model,...limits}){this.store=store;this.clients=new Map(employees.map(a=>[a.id,new ChatService({store:store.scoped(a.id),service,model,knowledge:platformKnowledge?.forDepartment(a.knowledgeRole),employeeId:a.id,...limits})]));this.groupLocks=new Set();}
 registry(){return {employees:publicRegistry(),human,generalId:GENERAL_ID};}
 conversation(id,u){return this.store.ownedConversation(id,u);}
 channels(u){return [GENERAL_ID,...employees.map(a=>a.id)].map(id=>this.store.ensureChannel(u,id));}
 async send(id,user,text,emit){const c=this.conversation(id,user);if(c.agent_id!==GENERAL_ID)return this.clients.get(c.agent_id).send(id,user,text,emit);if(this.groupLocks.has(id))throw new Error('CONVERSATION_BUSY');this.groupLocks.add(id);try{this.store.appendGroup(id,user,text);const targets=resolveMentions(text).filter(a=>a.type!=='human');emit('stored',{conversationId:id,senderId:human.id,safeHtml:groupMarkdown(text)});for(const target of targets){try{await this.clients.get(target.id).send(id,user,text,(event,data)=>emit(event,{...data,senderId:target.id}));}catch(error){emit('error',{error:['DAILY_USAGE_LIMIT','CAPACITY_LIMIT','CONVERSATION_BUSY'].includes(error.message)?error.message:'CHAT_FAILED',senderId:target.id});}}if(!targets.length)emit('stored-only',{message:'Message saved. Mention @Ryan or @Marcus to request a response. @Ashari references the human CEO.'});}finally{this.groupLocks.delete(id);}}
}
