export type WalkObstacle={x:number;z:number;halfWidth:number;halfDepth:number;yaw:number};
export const WALK_RADIUS=.24;
export function overlapsObstacle(x:number,z:number,o:WalkObstacle,radius=WALK_RADIUS){
 const c=Math.cos(o.yaw),s=Math.sin(o.yaw),dx=x-o.x,dz=z-o.z;
 const localX=c*dx-s*dz,localZ=s*dx+c*dz;
 const gapX=Math.max(Math.abs(localX)-o.halfWidth,0),gapZ=Math.max(Math.abs(localZ)-o.halfDepth,0);
 return gapX*gapX+gapZ*gapZ<radius*radius;
}
export function moveWalker(x:number,z:number,dx:number,dz:number,obstacles:WalkObstacle[]){
 // Short steps prevent crossing thin glass walls, even with a long requested move.
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.06));
 const clear=(px:number,pz:number)=>px>=-17.65&&px<=17.65&&pz>=-26.5&&pz<=13.8&&!obstacles.some(o=>overlapsObstacle(px,pz,o));
 for(let i=0;i<steps;i++){
  const nx=x+dx/steps,nz=z+dz/steps;
  if(clear(nx,nz)){x=nx;z=nz;continue;}
  // Resolve each axis independently to slide along walls rather than stop abruptly.
  if(clear(nx,z))x=nx;
  if(clear(x,nz))z=nz;
 }
 return {x,z};
}
