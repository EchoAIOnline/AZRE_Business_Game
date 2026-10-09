import React,{useState,useRef,useEffect} from 'react';
import {WorkstationDashboard} from './components/WorkstationDashboard';
import {LuxuryOffice,rooms,View} from './components/LuxuryOffice';
export default function App(){
 const [view,setView]=useState<View>('roam');const [ceiling,setCeiling]=useState(true);const [quality,setQuality]=useState(true);const [reference,setReference]=useState(false);
 const [dealdeskRoom,setDealdeskRoom]=useState<View|null>(null);const browserDialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(dealdeskRoom)browserDialog.current?.showModal();else browserDialog.current?.close();},[dealdeskRoom]);
 const refButton=useRef<HTMLButtonElement>(null);
 const closeReference=()=>{setReference(false);refButton.current?.focus();};
 const selected=rooms.find(r=>r.id===view);
 return <div className="headquarters">
  <header className="masthead"><div className="brand"><img src="/brand/emblem.png" alt="AZRE emblem"/><div><span className="eyebrow">ASHARI ZAKAR REAL ESTATE</span><h1>Private headquarters<span> / ATLANTA</span></h1></div></div><div className="preview-mark"><span/>ARCHITECTURAL PREVIEW</div><details className="office-menu"><summary>Explore the office <span aria-hidden="true">⌄</span></summary><div className="view-panel"><span className="eyebrow">EXPLORE THE OFFICE</span><h2>{selected?.name|| (view==='overview'?'The complete floor':view==='roam'?'Walk through AZRE':'Welcome to AZRE')}</h2><p>{selected?.detail||(view==='roam'?'↑ / ↓ Move forward & backward · ← / → Turn · Drag mouse to look · Esc Floor overview':'A spacious headquarters. Three specialist desks. One coordinated team.')}</p><div className="view-switch"><button className={view==='roam'?'active':''} onClick={()=>setView('roam')}>Free roam · Arrow keys</button><button className={view==='overview'?'active':''} onClick={()=>setView('overview')}>Floor overview</button></div><div className="scene-options"><label><input type="checkbox" checked={ceiling} disabled={view==='overview'} onChange={e=>setCeiling(e.target.checked)}/>Show ceiling</label><label><input type="checkbox" checked={quality} onChange={e=>setQuality(e.target.checked)}/>Detailed shadows</label></div><button ref={refButton} className="reference-button" onClick={()=>setReference(true)}>View layout reference ↗</button></div></details></header>
  <LuxuryOffice view={view} onSelect={setView} ceiling={ceiling} quality={quality} paused={reference||!!dealdeskRoom} onOpenDealDesk={setDealdeskRoom}/>

  <div className="scene-note"><span className="eyebrow">{view==='overview'?'01 / FLOOR OVERVIEW':'01 / OFFICE INTERIOR'}</span><p>{view==='roam'?'↑ ↓ Walk · ← → Turn · Drag mouse to look':'Drag to orbit · Scroll to zoom · Click a workstation'}</p></div>
  <nav className="room-dock" aria-label="Office rooms">{rooms.map((r,i)=><button key={r.id} className={view===r.id?'selected':''} onClick={()=>setView(r.id as View)}><span className="room-index">0{i+1}</span><span><strong>{r.name}</strong><small>{r.id==='ceo'?'Executive suite':r.id==='conference'?'Shared review space':'One AI workstation'}</small></span><span className="room-arrow">↗</span></button>)}</nav>
  <footer><span>VISUAL DESIGN ONLY</span><p>DealDesk browser access · AI task execution deferred</p><span>AZRE / LEVEL 01</span></footer>
  <dialog ref={browserDialog} className="dealdesk-dialog workstation-dialog" aria-label="DealDesk browser" onCancel={()=>setDealdeskRoom(null)}>
   <WorkstationDashboard room={dealdeskRoom} onRoom={setDealdeskRoom} onClose={()=>setDealdeskRoom(null)} onFocus={v=>{setView(v);setDealdeskRoom(null);}}/>
  </dialog>
  {reference&&<div className="reference-overlay" role="dialog" aria-modal="true" aria-label="Floor plan reference" onKeyDown={e=>{if(e.key==='Escape')closeReference();if(e.key==='Tab')e.preventDefault();}} onClick={closeReference}><div className="reference-card" onClick={e=>e.stopPropagation()}><button autoFocus onClick={closeReference} aria-label="Close reference">Close ×</button><img src="/brand/floor-reference.png" alt="Supplied floor plan: CEO at rear center, Acquisitions left, Dispositions right, Operations lower right, conference and support rooms lower left, central lobby"/><p>Supplied layout reference. The interactive scene keeps one workstation per AI department.</p></div></div>}
 </div>;
}
