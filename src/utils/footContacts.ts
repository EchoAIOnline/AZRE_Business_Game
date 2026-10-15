import * as THREE from 'three';
import {employeeBoneKey} from './employeeRig';
// Contact correction layered after captured clips, not an authored replacement gait.
export class FootContacts{
 private legs:{thigh:THREE.Bone;calf:THREE.Bone;foot:THREE.Bone;ground:number;previous?:THREE.Vector3;anchor?:THREE.Vector3}[]=[];
 constructor(private root:THREE.Object3D){const bones=new Map<string,THREE.Bone>();root.updateMatrixWorld(true);root.traverse(n=>{if(n instanceof THREE.Bone)bones.set(employeeBoneKey(n.name),n);});for(const side of ['l','r']){const thigh=bones.get('bip01'+side+'thigh'),calf=bones.get('bip01'+side+'calf'),foot=bones.get('bip01'+side+'foot');if(thigh&&calf&&foot)this.legs.push({thigh,calf,foot,ground:foot.getWorldPosition(new THREE.Vector3()).y});}}
 update(dt:number,active:boolean){this.root.updateMatrixWorld(true);for(const leg of this.legs){const {thigh,calf,foot}=leg,raw=foot.getWorldPosition(new THREE.Vector3()),velocity=leg.previous?raw.distanceTo(leg.previous)/Math.max(dt,.001):Infinity;leg.previous=raw.clone();
  if(!active){leg.anchor=undefined;continue;}
  if(raw.y>leg.ground+.065||leg.anchor&&raw.clone().sub(leg.anchor).setY(0).length()>.24)leg.anchor=undefined;
  if(!leg.anchor&&raw.y<leg.ground+.035&&velocity<.22)leg.anchor=raw.clone();
  if(!leg.anchor)continue;
  const a=thigh.getWorldPosition(new THREE.Vector3()),b=calf.getWorldPosition(new THREE.Vector3()),c=raw,orientation=foot.getWorldQuaternion(new THREE.Quaternion()),l1=a.distanceTo(b),l2=b.distanceTo(c),target=leg.anchor.clone();target.y=raw.y;
  const direction=target.clone().sub(a),distance=direction.length();if(distance>=l1+l2-.001||distance<.001){leg.anchor=undefined;continue;}direction.normalize();
  const along=(l1*l1-l2*l2+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along));
  const bend=b.clone().sub(a).addScaledVector(direction,-b.clone().sub(a).dot(direction));if(bend.lengthSq()<1e-8){leg.anchor=undefined;continue;}bend.normalize();
  const knee=a.clone().addScaledVector(direction,along).addScaledVector(bend,height);
  const aim=(bone:THREE.Bone,child:THREE.Bone,point:THREE.Vector3)=>{const origin=bone.getWorldPosition(new THREE.Vector3()),current=child.getWorldPosition(new THREE.Vector3()).sub(origin).normalize(),desired=point.clone().sub(origin).normalize();const world=bone.getWorldQuaternion(new THREE.Quaternion()).premultiply(new THREE.Quaternion().setFromUnitVectors(current,desired));bone.quaternion.copy(bone.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world));this.root.updateMatrixWorld(true);};
  aim(thigh,calf,knee);aim(calf,foot,target);foot.quaternion.copy(foot.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(orientation));this.root.updateMatrixWorld(true);
 }}
}
