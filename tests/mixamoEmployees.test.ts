import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {inspectEmployeeRig} from '../src/utils/employeeRig';
import {prepareMixamoClips} from '../src/utils/mixamoClips';
const labels=['Standing','Walking','StandUp','SitDown','Seated','Typing','LookAround'];
async function rigOnly(file:string){const bytes=await fs.readFile(file),len=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+len).toString());for(const n of json.nodes){delete n.mesh;delete n.skin;}delete json.meshes;delete json.materials;delete json.images;delete json.textures;delete json.samplers;delete json.extensionsRequired;delete json.extensionsUsed;
 let text=JSON.stringify(json);while(Buffer.byteLength(text)%4)text+=' ';const encoded=Buffer.from(text),bin=bytes.subarray(20+len),out=Buffer.alloc(20+encoded.length+bin.length);out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(encoded.length,12);out.writeUInt32LE(0x4e4f534a,16);encoded.copy(out,20);bin.copy(out,20+encoded.length);return new GLTFLoader().parseAsync(out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength),'');}
const manifest=JSON.parse(await fs.readFile('public/models/mixamo/manifest.json','utf8'));
for(const asset of Object.keys(manifest)){
 const model=await rigOnly(`public/models/mixamo/${asset}.glb`);const skin=new THREE.SkinnedMesh();model.scene.add(skin);const rig=inspectEmployeeRig(model.scene);assert.equal(rig.convention,'mixamo');assert.equal(rig.bones.size,65);assert.deepEqual(rig.missing,[]);assert.ok(rig.fingerSupport);
 const source=await Promise.all(labels.map(async name=>{const g=await rigOnly(`public/models/mixamo/${asset}-${name}.glb`);g.animations[0].name=name;return g.animations[0];}));
 const clips=prepareMixamoClips(model.scene,source,manifest[asset].walkSpeed);const mixer=new THREE.AnimationMixer(model.scene);
 for(const [name,clip] of Object.entries(clips)){if(!(clip instanceof THREE.AnimationClip))continue;const action=mixer.clipAction(clip).setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();for(let time=0;time<clip.duration;time+=.2){mixer.setTime(time);model.scene.updateMatrixWorld(true);for(const bone of rig.bones.values())assert.ok([...bone.position.toArray(),...bone.quaternion.toArray()].every(Number.isFinite));}mixer.setTime(0);model.scene.updateMatrixWorld(true);console.log(asset,name,'head',rig.bones.get('bip01head')!.getWorldPosition(new THREE.Vector3()).toArray().map(n=>n.toFixed(2)));action.stop();}
 // Runtime must leave the original typing capture untouched.
 const originalTyping=source.find(c=>c.name==='Typing')!;
 for(const track of originalTyping.tracks.filter(t=>!t.name.endsWith('.scale'))){const prepared=clips.typing!.tracks.find(t=>t.name===track.name)!;assert.deepEqual(prepared.values,track.values,'typing rotations/hip motion are not procedurally rewritten');}
 assert.throws(()=>prepareMixamoClips(model.scene,[],1),/Missing required/);
 const inputHip=source[1].tracks.find(t=>t.name.endsWith('Hips.position'))!;const outputHip=clips.walking.tracks.find(t=>t.name===inputHip.name)!;assert.notDeepEqual(inputHip.values,outputHip.values,'navigation strips root travel from a copy');
}
console.log('All four Mixamo rigs and captured clip bindings passed');
