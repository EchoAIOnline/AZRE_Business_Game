import {useEffect,useState,useRef} from 'react';

/** Both destinations reuse the same authenticated service and SQLite store. */
export function WorkforcePanel({destination,active,employeeId='',onNavigate}:{destination:string;active:boolean;employeeId?:string;onNavigate?:(screen:string,employee?:string)=>void}){
 const frame=useRef<HTMLIFrameElement>(null);
 const title=destination==='chat'?'AI Workforce messaging':destination==='tasks'?'AI Workforce task delegation':'AI Workforce executive management';
 useEffect(()=>{function receive(e:MessageEvent){if(e.origin!==location.origin||e.source!==frame.current?.contentWindow)return;if(e.data?.type==='azre-ready')frame.current?.contentWindow?.postMessage({type:'azre-view',active,employeeId},location.origin);if(e.data?.type==='azre-navigate'&&['chat','tasks','employees','approvals','activity','performance','settings','dealdesk'].includes(e.data.screen))onNavigate?.(e.data.screen,typeof e.data.employee==='string'?e.data.employee:'');}window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);},[onNavigate,active,employeeId]);
 useEffect(()=>{frame.current?.contentWindow?.postMessage({type:'azre-view',active,employeeId},location.origin);},[active,employeeId]);
 const [opened,setOpened]=useState(false),[online,setOnline]=useState<boolean|null>(null),[attempt,setAttempt]=useState(0);
 useEffect(()=>{if(active)setOpened(true);},[active]);
 useEffect(()=>{
  if(!active)return;
  let disposed=false;const controller=new AbortController();
  async function check(){try{const response=await fetch('/workforce/health',{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(6000)]),cache:'no-store'});const data=await response.json();if(!disposed)setOnline(response.ok&&data.service==='azre-workforce');}catch{if(!disposed)setOnline(false);}}
  void check();const timer=setInterval(check,15000);
  return()=>{disposed=true;controller.abort();clearInterval(timer);};
 },[active,attempt]);
 return <section className="wd-workforce" hidden={!active} aria-label={destination==='chat'?'AI Workforce Chat':destination==='tasks'?'Task Delegation':'Executive management'}>
  <div className="wd-workforce-status" role="status"><span>{online===null?'Checking workforce connection…':online?'● Connected to the existing AI Workforce service':'Workforce service unavailable'}</span><button onClick={()=>setAttempt(v=>v+1)}>Check connection</button></div>
  {online===false?<div className="wd-workforce-recovery"><h2>Reconnect AI Workforce</h2><p>The existing workforce service could not be reached. Conversations and tasks remain stored in its database.</p><p>Start or restart the AI Workforce background service, then choose Check connection. Service control: <code>node scripts/manage-background.js restart</code> from the azre-ai-workforce folder.</p><a href="http://127.0.0.1:3101" target="_blank" rel="noopener noreferrer">Check standalone workforce ↗</a></div>:opened&&online&&<iframe ref={frame} title={title} onLoad={()=>frame.current?.contentWindow?.postMessage({type:'azre-view',active,employeeId},location.origin)} src={destination==='chat'?'/workforce/?embedded=chat':destination==='tasks'?'/workforce/operations?embedded=tasks&view=tasks':'/workforce/console?embedded=management&view='+encodeURIComponent(destination)}/>}
 </section>;
}
