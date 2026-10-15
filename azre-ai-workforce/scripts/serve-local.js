import fs from 'node:fs';import {randomBytes} from 'node:crypto';import {config,parse} from 'dotenv';
config({path:'.env',quiet:true});const parent=fs.existsSync('../.env.local')?parse(fs.readFileSync('../.env.local')):{};
process.env.DEALDESK_PLUGIN_API_KEY||=parent.DEALDESK_PLUGIN_API_KEY2||parent.DEALDESK_PLUGIN_API_KEY;
process.env.CHAT_ACCESS_PASSWORD||=parent.OFFICE_ACCESS_PASSWORD;
if(!process.env.STATUS_API_TOKEN){const key=randomBytes(32).toString('hex');let content=fs.existsSync('.env')?fs.readFileSync('.env','utf8'):'';content=/^STATUS_API_TOKEN=/m.test(content)?content.replace(/^STATUS_API_TOKEN=.*$/m,`STATUS_API_TOKEN=${key}`):content+`\nSTATUS_API_TOKEN=${key}\n`;fs.writeFileSync('.env',content,{mode:0o600});process.env.STATUS_API_TOKEN=key;}
process.env.SCHEDULE_ENABLED='false';
await import('../src/cli.js');
