import {z} from 'zod';
export const TASK_SOURCES=Object.freeze({WorkforceTasks:Object.freeze({system:'azre-workforce',entity:'internal-assignment'}),PluginTasks:Object.freeze({system:'dealdesk',entity:'crm-task'})});
export function taskSource(table,recordId){if(!TASK_SOURCES[table])throw new Error('INVALID_TASK_SOURCE');return {...TASK_SOURCES[table],evidenceTable:table,recordId};}
// A known ID cannot be combined with another source table. anyOf remains nested
// under the root response object, as required by Structured Outputs.
export function sourceBoundItem(base,observed,{emptyValues=false}={}){
 if(emptyValues&&observed.size){const fields=new Set(base.shape.field.options);const options=[...observed].map(([key,record])=>base.extend({table:z.literal(key.slice(0,key.indexOf('/'))),recordId:z.literal(record.id),field:z.enum(Object.keys(record).filter(k=>fields.has(k))),value:z.literal('')}));return options.length===1?options[0]:z.union(options);}
 const groups=new Map();for(const [key,record] of observed){const table=key.slice(0,key.indexOf('/'));if(!groups.has(table))groups.set(table,[]);groups.get(table).push(record.id);}
 const options=[...groups].map(([table,ids])=>base.extend({table:z.literal(table),recordId:z.enum([...new Set(ids)]),...(emptyValues?{value:z.literal('')}:{})}));
 if(!options.length)return emptyValues?base.extend({value:z.literal('')}):base;
 return options.length===1?options[0]:z.union(options);
}
