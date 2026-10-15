import fs from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {employeeBoneKey} from '../src/utils/employeeRig';
const canonical=(name:string)=>employeeBoneKey(name).replace(/^mixamorig\d*/, '');
async function load(file:string,stripMesh=false){let bytes=await fs.readFile(file);if(stripMesh){const len=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+len).toString());for(const n of json.nodes){delete n.mesh;delete n.skin;}for(const k of ['meshes','materials','images','textures','samplers','extensionsRequired','extensionsUsed'])delete json[k];let text=JSON.stringify(json);while(Buffer.byteLength(text)%4)text+=' ';const data=Buffer.from(text),bin=bytes.subarray(20+len),out=Buffer.alloc(20+data.length+bin.length);out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(data.length,12);out.writeUInt32LE(0x4e4f534a,16);data.copy(out,20);bin.copy(out,20+data.length);bytes=out;}return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');}
const labels=process.argv.includes('--library')?['DeskIdle','SitToType','TypeToSit','Mouse','WalkCandidate']:['Typing'];
for(const label of labels){const reference=JSON.parse(gunzipSync(await fs.readFile(label==='Typing'?'tests/fixtures/mixamo-typing-reference.json.gz':`tests/fixtures/library-${label}.json.gz`)).toString());
for(const asset of ['acquisitions-specialist','operations-specialist','dispositions-specialist','receptionist']){
 const model=await load(`public/models/mixamo/${asset}.glb`,true),capture=await load(`public/models/mixamo/${label==='Typing'?'':'library/'}${asset}-${label}.glb`),clip=capture.animations[0];assert.ok(Math.abs(clip.duration-reference.duration)<1e-6,'original duration and 30 FPS playback preserved');
 const bones=new Map<string,THREE.Bone>();model.scene.updateMatrixWorld(true);model.scene.traverse(n=>{if(n instanceof THREE.Bone)bones.set(canonical(n.name),n);});
 const rest=reference.keys.map((key:string,i:number)=>{const bone=bones.get(key)!;assert.ok(bone,`missing ${key}`);assert.equal(bone.parent instanceof THREE.Bone?canonical(bone.parent.name):null,reference.parents[i],'source hierarchy preserved');return bone.getWorldQuaternion(new THREE.Quaternion());});
 const hip=bones.get('bip01pelvis')!,restHip=hip.getWorldPosition(new THREE.Vector3()),sourceRestHip=new THREE.Vector3().fromArray(reference.restHip),ratio=restHip.length()/sourceRestHip.length();
 const mixer=new THREE.AnimationMixer(model.scene),action=mixer.clipAction(clip);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();let maxAngle=0,maxHipError=0;
 for(let frame=0;frame<reference.times.length;frame++){
  mixer.setTime(reference.times[frame]);model.scene.updateMatrixWorld(true);
  reference.keys.forEach((key:string,i:number)=>{const actual=bones.get(key)!.getWorldQuaternion(new THREE.Quaternion()).multiply(rest[i].clone().invert()).normalize(),expected=new THREE.Quaternion().fromArray(reference.rotations[frame],i*4).normalize();maxAngle=Math.max(maxAngle,actual.angleTo(expected));});
  const expectedHip=new THREE.Vector3().fromArray(reference.hipPositions[frame]).sub(sourceRestHip).multiplyScalar(ratio).add(restHip);maxHipError=Math.max(maxHipError,expectedHip.distanceTo(hip.getWorldPosition(new THREE.Vector3())));
 }
 assert.ok(maxAngle<.0001,`${asset}: motion differs from original FBX (${maxAngle} radians)`);assert.ok(maxHipError<.0001,`${asset}: hip transforms differ (${maxHipError} m)`);
 console.log(asset,label,{sourceFrames:reference.times.length,maxAngle,maxHipError});
}
}
console.log('All four characters reproduce original FBX motion relative to their own verified rest poses');
