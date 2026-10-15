import {overlapsObstacle,type WalkObstacle} from './walkCollision';
export const employeeStates=['IDLE','WORKING','WALKING','COLLABORATING','TASK_COMPLETED','AWAITING_APPROVAL','ERROR'] as const;
export type EmployeeState=typeof employeeStates[number];
export type Point={x:number;z:number};
export type Boundary={minX:number;maxX:number;minZ:number;maxZ:number};
export const EMPLOYEE_RADIUS=.3;
export function clearEmployeePosition(p:Point,b:Boundary,obstacles:WalkObstacle[],others:Point[]=[]){return p.x>=b.minX&&p.x<=b.maxX&&p.z>=b.minZ&&p.z<=b.maxZ&&!obstacles.some(o=>overlapsObstacle(p.x,p.z,o,EMPLOYEE_RADIUS))&&!others.some(o=>Math.hypot(o.x-p.x,o.z-p.z)<EMPLOYEE_RADIUS*2+.08);}
export function segmentClear(a:Point,b:Point,boundary:Boundary,obstacles:WalkObstacle[],others:Point[]=[]){const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.06));for(let i=1;i<=steps;i++)if(!clearEmployeePosition({x:a.x+(b.x-a.x)*i/steps,z:a.z+(b.z-a.z)*i/steps},boundary,obstacles,others))return false;return true;}
// Bounded grid search; every edge is checked, including diagonals and thin partitions.
export function planEmployeePath(start:Point,goal:Point,b:Boundary,obstacles:WalkObstacle[]):Point[]{
 if(!clearEmployeePosition(start,b,obstacles)||!clearEmployeePosition(goal,b,obstacles))return [];
 if(segmentClear(start,goal,b,obstacles))return [goal];
 const step=.35,cols=Math.floor((b.maxX-b.minX)/step)+1,rows=Math.floor((b.maxZ-b.minZ)/step)+1;
 const point=(key:number)=>({x:b.minX+(key%cols)*step,z:b.minZ+Math.floor(key/cols)*step});
 const nearest=(p:Point)=>Math.round((p.z-b.minZ)/step)*cols+Math.round((p.x-b.minX)/step);
 const first=nearest(start);if(first<0||first>=cols*rows||!segmentClear(start,point(first),b,obstacles))return [];
 const queue=[first],parents=new Map<number,number>([[first,-1]]);let end=-1;
 for(let i=0;i<queue.length&&i<2500;i++){
  const key=queue[i],p=point(key);
  if(Math.hypot(p.x-goal.x,p.z-goal.z)<step*1.5&&segmentClear(p,goal,b,obstacles)){end=key;break;}
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const x=key%cols+dx,z=Math.floor(key/cols)+dz;if(x<0||z<0||x>=cols||z>=rows)continue;
   const next=z*cols+x;if(parents.has(next)||!segmentClear(p,point(next),b,obstacles))continue;parents.set(next,key);queue.push(next);
  }
 }
 if(end<0)return [];const route:Point[]=[goal];while(end!==-1){route.unshift(point(end));end=parents.get(end)!;}return route;
}
export type EmployeePhase='SEATED'|'STANDING_UP'|'OUTBOUND'|'STANDING_IDLE'|'RETURNING'|'ALIGNING'|'SITTING_DOWN';
export class EmployeeBehavior{
 state:EmployeeState='WORKING';phase:EmployeePhase='SEATED';position:Point;yaw=0;speed=0;standBlend=0;blockedTime=0;
 transitionDurations={standUp:2.4,sitDown:2.4};transitionProgress=0;
 private elapsed=0;private phaseTime=0;private nextBreak:number;private path:Point[]=[];private override:EmployeeState|null=null;private cycle=0;
 constructor(readonly home:Point,readonly boundary:Boundary,readonly destinations:Point[],offset=0,readonly ambientWorking=true){this.position={...home};this.nextBreak=150+offset+Math.random()*120;this.state=ambientWorking?'WORKING':'IDLE';}
 setState(state:EmployeeState|null){if(state==='WALKING'&&this.override!==state)this.nextBreak=this.elapsed;this.override=state;}
 private enter(phase:EmployeePhase){this.phase=phase;this.phaseTime=0;this.blockedTime=0;}
 get wantsDeparture(){return this.elapsed>=this.nextBreak&&(!this.override||this.override==='WALKING');}
 update(dt:number,obstacles:WalkObstacle[],others:Point[],deskResting=false,allowDeparture=true){
  dt=Math.max(0,Math.min(dt,.05));this.elapsed+=dt;this.phaseTime+=dt;this.speed=0;
  const status=this.override;
  if(this.phase==='SEATED'){
   this.state=status&&status!=='WALKING'?status:(!this.ambientWorking||deskResting||status==='WALKING'?'IDLE':'WORKING');
   if(allowDeparture&&(!status||status==='WALKING')&&this.elapsed>=this.nextBreak){
    const goal=this.destinations[this.cycle%this.destinations.length];
    const path=goal?planEmployeePath(this.home,goal,this.boundary,obstacles):[];
    if(path.length){this.path=path;this.enter('STANDING_UP');this.state='IDLE';}else this.nextBreak=this.elapsed+15;
   }
  }else if(this.phase==='STANDING_UP'){
   const t=Math.min(1,this.phaseTime/this.transitionDurations.standUp);this.transitionProgress=t;this.standBlend=t*t*(3-2*t);this.state='IDLE';if(t===1)this.enter('OUTBOUND');
  }else if(this.phase==='ALIGNING'){
   this.state='IDLE';const turn=Math.atan2(Math.sin(-this.yaw),Math.cos(-this.yaw));this.yaw+=turn*Math.min(1,dt*5);
   if(Math.abs(turn)<.025){this.yaw=0;this.enter('SITTING_DOWN');}
  }else if(this.phase==='SITTING_DOWN'){
   const t=Math.min(1,this.phaseTime/this.transitionDurations.sitDown);this.transitionProgress=t;this.standBlend=1-t*t*(3-2*t);this.state='IDLE';if(t===1){this.position={...this.home};this.enter('SEATED');this.nextBreak=this.elapsed+180+Math.random()*180+(this.cycle++%3)*19;}
  }else if(this.phase==='STANDING_IDLE'){
   this.state=status&&status!=='WORKING'&&status!=='WALKING'?status:'IDLE';
   if(this.phaseTime>5||(status&&status!=='WALKING')){this.path=planEmployeePath(this.position,this.home,this.boundary,obstacles);if(this.path.length)this.enter('RETURNING');else this.blockedTime+=dt;}
  }else{
   this.state='WALKING';const target=this.path[0];
   if(!target){if(this.phase==='OUTBOUND')this.enter('STANDING_IDLE');else this.enter('ALIGNING');return;}
   const dx=target.x-this.position.x,dz=target.z-this.position.z,distance=Math.hypot(dx,dz),step=Math.min(distance,.65*dt);
   if(distance<.025){this.path.shift();return;}
   const angle=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(angle-this.yaw),Math.cos(angle-this.yaw));
   this.yaw+=Math.max(-dt*2.5,Math.min(dt*2.5,delta));
   // Turn towards the next segment before stepping, rather than skating sideways.
   if(Math.abs(delta)>.45){this.state='IDLE';return;}
   const next={x:this.position.x+dx/distance*step,z:this.position.z+dz/distance*step};
   if(segmentClear(this.position,next,this.boundary,obstacles,others)){
    this.position=next;this.speed=.65;this.blockedTime=0;

   }else{
    this.blockedTime+=dt;this.state='IDLE';
    if(this.blockedTime>2){const goal=this.phase==='OUTBOUND'?this.path.at(-1)!:this.home;const route=planEmployeePath(this.position,goal,this.boundary,obstacles);if(route.length)this.path=route;this.blockedTime=0;}
   }
  }
 }
}
