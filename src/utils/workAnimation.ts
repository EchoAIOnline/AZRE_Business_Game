// Presentation-only loop: four typing/mouse sequences, then a twenty-second desk rest.
export function workAnimationPhase(time:number){
 const phase=((time%84)+84)%84,cycle=phase%16;
 const mouse=phase<64&&cycle>11&&cycle<15;
 const mouseBlend=mouse?Math.min(1,(cycle-11)*2,(15-cycle)*2):0;
 // Ease back into the authored clasped-hands seated pose and out of it after the pause.
 const linearRest=phase>=64?Math.min(1,phase-64):phase<1?1-phase:0;
 const restBlend=linearRest*linearRest*(3-2*linearRest);
 return {mouse,mouseBlend,restBlend,resting:phase>=64};
}

export function createWorkSchedule(seed:number,offset=0){
 let state=seed>>>0;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const tempo=.9+random()*.2;
 type Cycle={start:number;workEnd:number;end:number;mouseWindows:{start:number;end:number}[]};
 const cycles:Cycle[]=[];
 function nextCycle(){let cursor=cycles.at(-1)?.end||0;const start=cursor,mouseWindows=[];
  for(let i=0;i<4;i++){cursor+=8+random()*7;const end=cursor+2.5+random()*2;mouseWindows.push({start:cursor,end});cursor=end+1+random()*2;}
  const cycle={start,workEnd:cursor,end:cursor+20,mouseWindows};cycles.push(cycle);return cycle;
 }
 nextCycle();
 return (time:number)=>{
  const elapsed=Math.max(0,time+offset);while(cycles.at(-1)!.end<=elapsed)nextCycle();
  const cycle=cycles.find(c=>c.end>elapsed)!;
  const window=cycle.mouseWindows.find(w=>elapsed>w.start&&elapsed<w.end);
  const mouseBlend=window?Math.min(1,(elapsed-window.start)/.5,(window.end-elapsed)/.5):0;
  const linearRest=elapsed>=cycle.workEnd?Math.min(1,elapsed-cycle.workEnd):Math.max(0,1-(elapsed-cycle.start));
  return {mouse:!!window,mouseBlend,restBlend:linearRest*linearRest*(3-2*linearRest),resting:elapsed>=cycle.workEnd,motionTime:elapsed*tempo};
 };
}
