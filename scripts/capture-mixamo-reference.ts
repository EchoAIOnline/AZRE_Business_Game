import fs from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import * as THREE from 'three';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';
import {employeeBoneKey} from '../src/utils/employeeRig';
const canonical=(name:string)=>employeeBoneKey(name).replace(/^mixamorig\d*/, '');
(globalThis as any).document={createElementNS:()=>({addEventListener(){},removeEventListener(){},set src(value:string){},style:{}})};(globalThis as any).window=globalThis;
const input=process.argv[2]||'/private/tmp/azre-mixamo/Typing.fbx',bytes=await fs.readFile(input),root=new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');root.scale.setScalar(.01);root.updateMatrixWorld(true);
const bones=new Map<string,THREE.Bone>();root.traverse(n=>{if(n instanceof THREE.Bone)if(!bones.has(canonical(n.name)))bones.set(canonical(n.name),n);});
const keys=[...bones.keys()],rest=keys.map(k=>bones.get(k)!.getWorldQuaternion(new THREE.Quaternion())),hips=bones.get('bip01pelvis')!,restHip=hips.getWorldPosition(new THREE.Vector3()),parents=keys.map(k=>bones.get(k)!.parent instanceof THREE.Bone?canonical(bones.get(k)!.parent!.name):null);
const mixer=new THREE.AnimationMixer(root),clip=root.animations[0],action=mixer.clipAction(clip);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();
const times=[],rotations=[],hipPositions=[];
for(let frame=0;frame<=Math.round(clip.duration*60);frame++){const t=Math.min(frame/60,clip.duration);mixer.setTime(t);root.updateMatrixWorld(true);times.push(t);rotations.push(keys.flatMap((key,i)=>bones.get(key)!.getWorldQuaternion(new THREE.Quaternion()).multiply(rest[i].clone().invert()).normalize().toArray().map(v=>Number(v.toFixed(7)))));hipPositions.push(hips.getWorldPosition(new THREE.Vector3()).toArray().map(v=>Number(v.toFixed(8))));}
const fixture={description:'Original Mixamo Typing FBX sampled independently through Three.js FBXLoader at 60 FPS, including mid-keyframe quaternion interpolation. Rotations are world motion relative to source rest frames.',duration:clip.duration,keys,parents,restHip:restHip.toArray(),times,rotations,hipPositions};
await fs.writeFile(process.argv[3]||'tests/fixtures/mixamo-typing-reference.json.gz',gzipSync(JSON.stringify(fixture)));console.log('Captured',times.length,'original source frames');
