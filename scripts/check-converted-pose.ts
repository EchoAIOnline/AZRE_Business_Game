import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {employeeBoneKey} from '../src/utils/employeeRig';
const library=process.argv.includes('--library');
for(const label of (library?['DeskIdle','SitToType','TypeToSit','Mouse','WalkCandidate']:['Typing']))for(const asset of ['acquisitions-specialist','dispositions-specialist','operations-specialist','receptionist']){
 const b=await fs.readFile(`public/models/mixamo/${library?'library/':''}${asset}-${label}.glb`),g=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 const audit=JSON.parse(await fs.readFile(`/private/tmp/azre-mixamo/${asset}-${label}-audit.json`,'utf8'));
 const bones=new Map<string,THREE.Object3D>();g.scene.traverse(n=>bones.set(employeeBoneKey(n.name),n));
 const mixer=new THREE.AnimationMixer(g.scene);const action=mixer.clipAction(g.animations[0]);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();
 const coordinate=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
 let posError=0,angleError=0;
 for(const frame of audit){mixer.setTime(frame.time);g.scene.updateMatrixWorld(true);for(const [name,value] of Object.entries(frame.bones) as [string,{position:number[];quaternion:number[]}][]){const bone=bones.get(employeeBoneKey(name));if(!bone)continue;const expected=new THREE.Vector3().fromArray(value.position).applyQuaternion(coordinate),actual=bone.getWorldPosition(new THREE.Vector3());posError=Math.max(posError,actual.distanceTo(expected));const [w,x,y,z]=value.quaternion,q=coordinate.clone().multiply(new THREE.Quaternion(x,y,z,w)).normalize();angleError=Math.max(angleError,q.angleTo(bone.getWorldQuaternion(new THREE.Quaternion()).normalize()));}}
 assert.ok(posError<.0001&&angleError<.0001,`Conversion fidelity failure ${asset} ${label}`);console.log(asset,label,{posError,angleError});
}
