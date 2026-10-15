import fs from 'node:fs/promises';
import * as THREE from 'three';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';
const bytes=await fs.readFile('/private/tmp/azre-mixamo/Typing.fbx');
const fbx=new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
console.log('FBX',fbx.animations.map(c=>({duration:c.duration,tracks:c.tracks.length,first:c.tracks[0].name})));
const clip=fbx.animations[0];
for(const track of clip.tracks.filter(t=>t.name.endsWith('.quaternion'))){let largest=0;for(let i=4;i<track.values.length;i+=4){const a=new THREE.Quaternion().fromArray(track.values,i-4).normalize(),b=new THREE.Quaternion().fromArray(track.values,i).normalize();largest=Math.max(largest,a.angleTo(b));}if(largest>.3)console.log('jump',track.name,largest);}
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
for(const name of ['acquisitions-specialist','dispositions-specialist','operations-specialist','receptionist']){
 const b=await fs.readFile(`public/models/mixamo/${name}-Typing.glb`);const g=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 const c=g.animations[0];console.log(name,c.duration,c.tracks.length);
 for(const t of c.tracks.filter(t=>t.name.endsWith('.quaternion'))){let largest=0,frame=0;for(let i=4;i<t.values.length;i+=4){const a=new THREE.Quaternion().fromArray(t.values,i-4).normalize(),q=new THREE.Quaternion().fromArray(t.values,i).normalize(),angle=a.angleTo(q);if(angle>largest){largest=angle;frame=t.times[i/4];}}if(largest>.3)console.log('GLB jump',t.name,largest,frame);}
}
// Compare the exported Suzie skeleton against the independently parsed source FBX.
const glbBytes=await fs.readFile('public/models/mixamo/receptionist-Typing.glb');
const converted=await new GLTFLoader().parseAsync(glbBytes.buffer.slice(glbBytes.byteOffset,glbBytes.byteOffset+glbBytes.byteLength),'');
fbx.scale.setScalar(.01);
const sourceMixer=new THREE.AnimationMixer(fbx),outputMixer=new THREE.AnimationMixer(converted.scene);sourceMixer.clipAction(clip).play();outputMixer.clipAction(converted.animations[0]).play();
const key=(n:string)=>n.replace(/^mixamorig\d*:?/,'');const sb=new Map<string,THREE.Object3D>(),gb=new Map<string,THREE.Object3D>();fbx.traverse(n=>{if(n instanceof THREE.Bone)sb.set(key(n.name),n);});converted.scene.traverse(n=>{if(n instanceof THREE.Bone)gb.set(key(n.name),n);});
let largestPositionDifference=0,largestRotationDifference=0;
for(let t=0;t<clip.duration;t+=1/30){sourceMixer.setTime(t);outputMixer.setTime(t);fbx.updateMatrixWorld(true);converted.scene.updateMatrixWorld(true);for(const [name,b] of sb){const other=gb.get(name);if(!other)continue;largestPositionDifference=Math.max(largestPositionDifference,b.getWorldPosition(new THREE.Vector3()).distanceTo(other.getWorldPosition(new THREE.Vector3())));largestRotationDifference=Math.max(largestRotationDifference,b.getWorldQuaternion(new THREE.Quaternion()).angleTo(other.getWorldQuaternion(new THREE.Quaternion())));}}
console.log('Independent FBX / Suzie GLB comparison',{largestPositionDifference,largestRotationDifference});
sourceMixer.setTime(0);outputMixer.setTime(0);fbx.updateMatrixWorld(true);converted.scene.updateMatrixWorld(true);
for(const name of ['Hips','Spine2','Head','LeftArm','LeftForeArm','LeftHand','LeftHandIndex1','RightHand','LeftFoot']){const a=sb.get(name)!,b=gb.get(name)!;console.log(name,{source:a.getWorldPosition(new THREE.Vector3()).toArray(),glb:b.getWorldPosition(new THREE.Vector3()).toArray(),angle:a.getWorldQuaternion(new THREE.Quaternion()).angleTo(b.getWorldQuaternion(new THREE.Quaternion()))});}
async function restOnly(file:string){const bytes=await fs.readFile(file),len=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+len).toString());for(const n of json.nodes){delete n.mesh;delete n.skin;}delete json.meshes;delete json.materials;delete json.images;delete json.textures;delete json.samplers;delete json.extensionsRequired;delete json.extensionsUsed;let text=JSON.stringify(json);while(Buffer.byteLength(text)%4)text+=' ';const encoded=Buffer.from(text),bin=bytes.subarray(20+len),out=Buffer.alloc(20+encoded.length+bin.length);out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(encoded.length,12);out.writeUInt32LE(0x4e4f534a,16);encoded.copy(out,20);bin.copy(out,20+encoded.length);return new GLTFLoader().parseAsync(out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength),'');}
const freshBytes=await fs.readFile('/private/tmp/azre-mixamo/Typing.fbx');const freshSource=new FBXLoader().parse(freshBytes.buffer.slice(freshBytes.byteOffset,freshBytes.byteOffset+freshBytes.byteLength),'');freshSource.updateMatrixWorld(true);
const restModel=await restOnly('public/models/mixamo/receptionist.glb');restModel.scene.updateMatrixWorld(true);const sourceRest=new Map<string,THREE.Quaternion>(),targetRest=new Map<string,THREE.Quaternion>();freshSource.traverse(n=>{if(n instanceof THREE.Bone)sourceRest.set(key(n.name),n.getWorldQuaternion(new THREE.Quaternion()));});restModel.scene.traverse(n=>{if(n instanceof THREE.Bone)targetRest.set(key(n.name),n.getWorldQuaternion(new THREE.Quaternion()));});
let deltaError=0;
for(let t=0;t<clip.duration;t+=1/30){sourceMixer.setTime(t);outputMixer.setTime(t);fbx.updateMatrixWorld(true);converted.scene.updateMatrixWorld(true);for(const [name,b] of sb){const other=gb.get(name),sr=sourceRest.get(name),tr=targetRest.get(name);if(!other||!sr||!tr)continue;const sd=b.getWorldQuaternion(new THREE.Quaternion()).multiply(sr.clone().invert()).normalize(),td=other.getWorldQuaternion(new THREE.Quaternion()).multiply(tr.clone().invert()).normalize();deltaError=Math.max(deltaError,sd.angleTo(td));}}
console.log('Independent rest-relative world rotation error',deltaError);
