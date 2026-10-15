import {useState} from 'react';
import type {View} from './LuxuryOffice';
import {WorkforcePanel} from './WorkforcePanel';
const destinations=[['overview','Command Center','◈'],['chat','AI Workforce Chat','◌'],['tasks','Task Delegation','↗'],['employees','AI Employees','♧'],['approvals','CEO Approvals','◇'],['activity','Activity Monitor','≋'],['performance','Performance Reports','▥'],['dealdesk','Live DealDesk','▣'],['settings','Settings','⚙']] as const;
export function WorkstationDashboard({onClose}:{room:View|null;onRoom:(v:View)=>void;onClose:()=>void;onFocus:(v:View)=>void}){
 const [screen,setScreen]=useState<string>('overview'),[employee,setEmployee]=useState<string>('');
 function navigate(id:string,agent=''){setEmployee(agent);setScreen(id);}
 return <div className="command-shell">
  <aside className="command-sidebar"><div className="command-brand"><img src="/brand/emblem.png" alt="AZRE"/><div>AZRE<span>AI WORKFORCE</span></div></div><p className="command-caption">EXECUTIVE WORKSPACE</p><nav aria-label="Command Center navigation">{destinations.map(([id,title,icon])=><button key={id} aria-current={screen===id?'page':undefined} onClick={()=>navigate(id)}><span aria-hidden="true">{icon}</span>{title}</button>)}</nav><div className="command-human"><b>AZ</b><div>Ashari Zakar<small>Founder & CEO · Human</small></div></div></aside>
  <div className="command-workspace"><header className="command-header"><div><p>ASHARI ZAKAR REAL ESTATE, LLC</p><h1>AZRE AI Workforce Command Center</h1></div><button onClick={onClose} aria-label="Close workstation">×</button></header>
  <WorkforcePanel destination="chat" active={screen==='chat'} employeeId={employee}/>
  <WorkforcePanel destination="tasks" active={screen==='tasks'}/>
  <WorkforcePanel destination={['chat','tasks','dealdesk'].includes(screen)?'overview':screen} active={!['chat','tasks','dealdesk'].includes(screen)} onNavigate={navigate}/>
  <div className="command-dealdesk" hidden={screen!=='dealdesk'}>{screen==='dealdesk'&&<iframe title="Live DealDesk session" src="https://dealdesk.asharizakargroup.com" allow="clipboard-write"/>}<p>Sign in directly to DealDesk. <a href="https://dealdesk.asharizakargroup.com" target="_blank" rel="noopener noreferrer">Open Live DealDesk in a new tab ↗</a></p></div>
  <footer className="command-footer"><span>Executive oversight · Shared workforce service · Read-only AI DealDesk access</span><button onClick={onClose}>Return to 3D Office</button></footer></div>
 </div>;
}
