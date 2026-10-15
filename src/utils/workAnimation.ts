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

export function createWorkSchedule(seed:number,offset=0,department='acquisitions'){
 let state=seed>>>0;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const tempo=.9+random()*.2;
 type Segment={start:number;end:number;activity:string};
 const segments:Segment[]=[];
 function next(){const previous=segments.at(-1),start=previous?.end||0;
  const choice=random();let activity=previous?.activity==='typing'?'review':choice<.38?'typing':choice<.58?'mouse':department==='receptionist'&&choice>.8?'entrance':department==='dispositions'&&choice>.76?'communication':'review';
  if(department==='operations'&&choice>.55)activity='review';
  const duration=activity==='typing'?3+random()*5:activity==='mouse'?2+random()*3:6+random()*10;
  segments.push({start,end:start+duration,activity});
 }
 next();
 return (time:number)=>{
  const elapsed=Math.max(0,time+offset);while(segments.at(-1)!.end<=elapsed)next();
  while(segments.length>2&&segments[1].end<=elapsed)segments.shift();
  const segment=segments.find(s=>s.end>elapsed)!;
  const edge=Math.max(0,Math.min(1,(elapsed-segment.start)/1.2,(segment.end-elapsed)/1.2)),blend=edge*edge*(3-2*edge);
  const mouse=segment.activity==='mouse',typing=segment.activity==='typing',resting=!mouse&&!typing;
  return {activity:segment.activity,typingBlend:typing?blend:0,mouse,mouseBlend:mouse?blend:0,restBlend:resting?blend:0,resting,motionTime:elapsed*tempo};
 };
}
