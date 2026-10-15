import * as THREE from 'three';
import {inspectEmployeeRig,validateEmployeeClip} from './employeeRig';
import type {EmployeeClips} from './employeeClips';
export const mixamoClipNames=['Standing','Walking','StandUp','SitDown','Seated','Typing','Mouse','LookAround','Posture'] as const;
export type MixamoClipName=typeof mixamoClipNames[number];
export type MixamoClips=EmployeeClips&{seated:THREE.AnimationClip;typing?:THREE.AnimationClip;mouse?:THREE.AnimationClip;lookAround?:THREE.AnimationClip;posture?:THREE.AnimationClip};
// Accept exported clips with matching bindings, not merely a 'Mixamo-compatible' label.
// Inputs are copied so four independent mixers can reuse the decoded source asset safely.
export function prepareMixamoClips(root:THREE.Object3D,input:THREE.AnimationClip[],strideSpeed:number):MixamoClips{
 const rig=inspectEmployeeRig(root);if(!rig.skins||rig.missing.length)throw new Error(`Incomplete employee rig: ${rig.missing.join(', ')}`);
 if(!Number.isFinite(strideSpeed)||strideSpeed<=0||strideSpeed>3)throw new Error('Walking stride speed must be calibrated in metres per second.');
 const hips=rig.bones.get('bip01pelvis')!;root.updateMatrixWorld(true);
 const parentRotation=hips.parent!.getWorldQuaternion(new THREE.Quaternion()),inverse=parentRotation.clone().invert();
 const anchor=(name:string)=>{const source=input.find(c=>c.name.toLowerCase()===name.toLowerCase()),track=source?.tracks.find(t=>t.name===hips.name+'.position');return track?new THREE.Vector3().fromArray(track.values,0):hips.position.clone();};
 const standingAnchor=anchor('Standing'),seatedAnchor=anchor('Seated');
 const clips=new Map<MixamoClipName,THREE.AnimationClip>();
 for(const source of input){const name=mixamoClipNames.find(n=>n.toLowerCase()===source.name.toLowerCase());if(!name)continue;
  if(clips.has(name))throw new Error(`Duplicate employee clip: ${name}`);
  validateEmployeeClip(root,source);const clip=source.clone();
  clip.tracks=clip.tracks.filter(track=>!track.name.endsWith('.scale'));
  for(const track of clip.tracks)if(track.name===hips.name+'.position'&&!['Typing','Seated','LookAround'].includes(name)){
   // Derive world horizontal travel from the exported parent orientation: FBX
   // armature roots may retain a conversion rotation and centimetre units.
   const first=new THREE.Vector3().fromArray(track.values,0),last=new THREE.Vector3().fromArray(track.values,track.values.length-3);
   const startAnchor=name==='SitDown'||name==='Standing'||name==='Walking'?standingAnchor:seatedAnchor;
   const endAnchor=name==='StandUp'||name==='Standing'||name==='Walking'?standingAnchor:seatedAnchor;
   for(let i=0;i<track.times.length;i++){
    const t=track.times[i]/clip.duration,expected=first.clone().lerp(last,t),desired=startAnchor.clone().lerp(endAnchor,t);
    const correction=desired.sub(expected).applyQuaternion(parentRotation);correction.y=0;correction.applyQuaternion(inverse);
    new THREE.Vector3().fromArray(track.values,i*3).add(correction).toArray(track.values,i*3);
   }


  }
  clips.set(name,clip.optimize());
 }
 for(const required of ['Standing','Walking','StandUp','SitDown','Seated'] as const)if(!clips.has(required))throw new Error(`Missing required Mixamo animation: ${required}`);
 return {standing:clips.get('Standing')!,walking:clips.get('Walking')!,standUp:clips.get('StandUp')!,sitDown:clips.get('SitDown')!,seated:clips.get('Seated')!,typing:clips.get('Typing'),mouse:clips.get('Mouse'),lookAround:clips.get('LookAround'),posture:clips.get('Posture'),walkSpeed:strideSpeed};
}
