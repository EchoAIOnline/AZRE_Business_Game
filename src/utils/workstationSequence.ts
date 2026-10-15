export type DeskClip='Seated'|'SitToType'|'Mouse'|'TypeToSit';
export type DeskWeights=Partial<Record<DeskClip,number>>;
// Authored enter/exit clips finish before a new incompatible activity starts.
// No bone manipulation: a single employee mixer consumes these normalized weights.
export class WorkstationSequence{
 phase:DeskClip='Seated';elapsed=0;private previous:DeskClip|null=null;private fade=1;
 private desired=true;private hold:number;private repeats=1;private state:number;
 constructor(readonly durations:Record<DeskClip,number>,seed:number,readonly department:string){this.state=seed>>>0;this.hold=4+this.random()*12;}
 private random(){this.state=(Math.imul(this.state,1664525)+1013904223)>>>0;return this.state/4294967296;}
 setWorking(value:boolean){this.desired=value;}
 get resting(){return this.phase==='Seated';}
 get safeToStand(){return this.phase==='Seated'&&this.fade>=1;}
 private enter(phase:DeskClip){this.previous=this.phase;this.phase=phase;this.elapsed=0;this.fade=0;}
 restartSeated(){this.phase='Seated';this.previous=null;this.elapsed=0;this.fade=1;this.hold=5+this.random()*10;}
 update(dt:number){dt=Math.min(.05,Math.max(0,dt));this.elapsed+=dt;this.fade=Math.min(1,this.fade+dt/.45);
  if(this.phase==='Seated'){if(this.desired&&this.elapsed>=this.hold){this.repeats=this.department==='acquisitions'&&this.random()>.6?2:1;this.enter('SitToType');}}
  else if(this.phase==='SitToType'&&this.elapsed>=this.durations.SitToType)this.enter('Mouse');
  else if(this.phase==='Mouse'&&this.elapsed>=this.durations.Mouse*this.repeats)this.enter('TypeToSit');
  else if(this.phase==='TypeToSit'&&this.elapsed>=this.durations.TypeToSit){this.hold=(this.department==='operations'?12:6)+this.random()*14;this.enter('Seated');}
  const f=this.fade*this.fade*(3-2*this.fade);return {[this.phase]:f,...(this.previous&&f<1?{[this.previous]:1-f}:{})} as DeskWeights;
 }
}
