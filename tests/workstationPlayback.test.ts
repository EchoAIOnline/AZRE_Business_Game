import fs from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {employeeBoneKey} from '../src/utils/employeeRig';
const canonical=(name:string)=>employeeBoneKey(name).replace(/^mixamorig\d*/, '');
async function load(file:string,stripMesh=false){let bytes=await fs.readFile(file);if(stripMesh){const len=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+len).toString());for(const n of json.nodes){delete n.mesh;delete n.skin;}for(const k of ['meshes','materials','images','textures','samplers','extensionsRequired','extensionsUsed'])delete json[k];let text=JSON.stringify(json);while(Buffer.byteLength(text)%4)text+=' ';const data=Buffer.from(text),bin=bytes.subarray(20+len),out=Buffer.alloc(20+data.length+bin.length);out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(data.length,12);out.writeUInt32LE(0x4e4f534a,16);data.copy(out,20);bin.copy(out,20+data.length);bytes=out;}return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');}

import {EmployeeBehavior} from '../src/utils/employeeBehavior';
import {WorkstationSequence,type DeskClip} from '../src/utils/workstationSequence';
for(const [i,asset] of ['acquisitions-specialist','operations-specialist','dispositions-specialist','receptionist'].entries()){
 const model=await load(`public/models/mixamo/${asset}.glb`,true);
 const clips=new Map<DeskClip,THREE.AnimationClip>();for(const label of ['Seated','SitToType','Mouse','TypeToSit'] as const){const capture=await load(`public/models/mixamo/library/${asset}-${label==='Seated'?'DeskIdle':label}.glb`);clips.set(label,capture.animations[0]);}
 const sequence=new WorkstationSequence(Object.fromEntries([...clips].map(([name,clip])=>[name,clip.duration])) as Record<DeskClip,number>,511+i*239,asset);
 const mixer=new THREE.AnimationMixer(model.scene),actions=new Map([...clips].map(([name,clip])=>{const action=mixer.clipAction(clip).play().setEffectiveWeight(0);if(name==='SitToType'||name==='TypeToSit'){action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;}return [name,action] as const;}));
 const controller=new EmployeeBehavior({x:0,z:0},{minX:-3,maxX:3,minZ:-3,maxZ:3},[{x:1.5,z:0}],i*7,true);
 const movement=new Map<string,THREE.AnimationAction>();for(const name of ['Standing','StandUp','SitDown','Walking']){const source=await load(`public/models/mixamo/${name==='Walking'?'library/':''}${asset}-${name==='Walking'?'WalkCandidate':name}.glb`),action=mixer.clipAction(source.animations[0]).play().setEffectiveWeight(0);if(name==='StandUp'||name==='SitDown'){action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;}movement.set(name,action);}
 controller.transitionDurations={standUp:movement.get('StandUp')!.getClip().duration,sitDown:movement.get('SitDown')!.getClip().duration};let physical=controller.phase,walkWeight=0;const physicalHistory=new Set<string>();
 const bones:THREE.Bone[]=[];model.scene.traverse(n=>{if(n instanceof THREE.Bone&&/bip01(pelvis|spine[12]?|head|[lr](upperarm|forearm|hand|thigh|calf|foot))$/.test(employeeBoneKey(n.name)))bones.push(n);});let phase=sequence.phase,maxStep=0;const old=new Map<THREE.Bone,THREE.Quaternion>();
 for(let frame=0;frame<10*60*30;frame++){
  if(frame===40*30)controller.setState('WALKING');sequence.setWorking(!controller.wantsDeparture&&frame%(90*30)<65*30);let weights=controller.phase==='SEATED'?sequence.update(1/30):undefined;
  controller.update(1/30,[],[],sequence.resting,sequence.safeToStand);physicalHistory.add(controller.phase);
  if(controller.phase!==physical){if(controller.phase==='STANDING_UP')movement.get('StandUp')!.reset().play();if(controller.phase==='SITTING_DOWN')movement.get('SitDown')!.reset().play();if(controller.phase==='SEATED'){sequence.restartSeated();weights=sequence.update(0);phase='Seated';actions.get('Seated')!.reset().play();}physical=controller.phase;}

  if(phase!==sequence.phase){actions.get(sequence.phase)!.reset().play();phase=sequence.phase;}
  const rising=controller.phase==='STANDING_UP',lowering=controller.phase==='SITTING_DOWN',progress=controller.transitionProgress,transitionWeight=rising||lowering?Math.min(1,progress/.12,(1-progress)/.12):0,deskWeight=(1-controller.standBlend)*(1-transitionWeight);
  for(const [name,action] of actions)action.setEffectiveWeight(deskWeight*(weights?(weights[name]||0):name==='Seated'?1:0));
  walkWeight=THREE.MathUtils.damp(walkWeight,controller.speed>0?1:0,8,1/30);
  movement.get('Standing')!.setEffectiveWeight(controller.standBlend*(1-walkWeight)*(1-transitionWeight));movement.get('Walking')!.setEffectiveWeight(controller.standBlend*walkWeight*(1-transitionWeight));movement.get('StandUp')!.setEffectiveWeight(rising?transitionWeight:0);movement.get('SitDown')!.setEffectiveWeight(lowering?transitionWeight:0);
  const total=[...actions.values(),...movement.values()].reduce((sum,a)=>sum+a.getEffectiveWeight(),0);assert.ok(Math.abs(total-1)<1e-6,'chair transitions must retain a complete pose, never fall back to bind pose');

  mixer.update(1/30);model.scene.updateMatrixWorld(true);
  for(const b of bones){assert.ok(b.quaternion.toArray().every(Number.isFinite));if(old.has(b))maxStep=Math.max(maxStep,old.get(b)!.angleTo(b.quaternion));old.set(b,b.quaternion.clone());}
 }
 assert.ok(physicalHistory.has('SITTING_DOWN')&&physicalHistory.has('OUTBOUND'),'complete chair/walking cycle exercised');assert.ok(maxStep<.5,`${asset}: unexpected severe pose discontinuity ${maxStep}`);console.log(asset,'ten-minute mixer playback',maxStep);
}
