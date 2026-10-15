import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {loadEmployeeClips} from '../src/utils/employeeClips';
// Test rig geometry without browser image decoding; source GLBs stay untouched.
async function loadRig(file:string){const bytes=await fs.readFile(file),length=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+length).toString());
 for(const mesh of json.meshes)for(const primitive of mesh.primitives)delete primitive.material;
 delete json.materials;delete json.images;delete json.textures;delete json.samplers;
 let text=JSON.stringify(json);while(text.length%4)text+=' ';
 const encoded=Buffer.from(text),bin=bytes.subarray(20+length),out=Buffer.alloc(20+encoded.length+bin.length);
 out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(encoded.length,12);out.writeUInt32LE(0x4e4f534a,16);encoded.copy(out,20);bin.copy(out,20+encoded.length);
 return new GLTFLoader().parseAsync(out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength),'');}
for(const name of ['acquisitions-specialist','dispositions-specialist','operations-specialist','receptionist']){
 const rig=await loadRig(`public/models/${name}.glb`);let skins=0;rig.scene.traverse(o=>{if(o instanceof THREE.SkinnedMesh)skins++;});assert.ok(skins,'existing model is skinned');assert.equal(rig.animations.length,1);
 const original=GLTFLoader.prototype.loadAsync;GLTFLoader.prototype.loadAsync=async function(url:string){const bytes=await fs.readFile('public'+url);return this.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');};
 const request=loadEmployeeClips(rig.scene,`/models/${name}.glb`);assert.equal(loadEmployeeClips(rig.scene,`/models/${name}.glb`),request,'clips are reused');const clips=await request;GLTFLoader.prototype.loadAsync=original;
 assert.ok(clips.walkSpeed>.2&&clips.walkSpeed<2,'captured root travel gives realistic walk speed');
 const mixer=new THREE.AnimationMixer(rig.scene),stand=mixer.clipAction(clips.standing).play();mixer.setTime(0);rig.scene.updateMatrixWorld(true);
 const nodes=new Map<string,THREE.Object3D>();rig.scene.traverse(n=>nodes.set(n.name.replace(/[^a-z0-9]/gi,'').toLowerCase(),n));
 const foot=nodes.get('bip01lfoot')!,hand=nodes.get('bip01lhand')!;
 assert.ok(hand.getWorldPosition(new THREE.Vector3()).y>foot.getWorldPosition(new THREE.Vector3()).y+.5,'standing hand above feet');
 stand.stop();const walk=mixer.clipAction(clips.walking).play();mixer.setTime(0);rig.scene.updateMatrixWorld(true);const a=foot.getWorldPosition(new THREE.Vector3());
 mixer.setTime(.45);rig.scene.updateMatrixWorld(true);const b=foot.getWorldPosition(new THREE.Vector3());assert.ok(a.distanceTo(b)>.1,'walking articulates legs');
 rig.scene.traverse(o=>{assert.ok([...o.position.toArray(),...o.quaternion.toArray()].every(Number.isFinite),'finite transforms');});
 mixer.setTime(clips.walking.duration);rig.scene.updateMatrixWorld(true);const loop=foot.getWorldPosition(new THREE.Vector3());assert.ok(a.distanceTo(loop)<.001,'walk cycle loops cleanly');walk.stop();mixer.uncacheRoot(rig.scene);
 for(const transition of [clips.standUp,clips.sitDown]){const action=mixer.clipAction(transition).setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();for(let t=0;t<transition.duration;t+=.1){mixer.setTime(t);rig.scene.traverse(o=>assert.ok([...o.position.toArray(),...o.quaternion.toArray()].every(Number.isFinite)));}action.stop();}
 console.log(name,'compatible standing and walking clip playback passed');
}
