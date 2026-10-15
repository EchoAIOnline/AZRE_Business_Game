import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import * as THREE from 'three';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';
const folder=process.argv[2]||'/Users/asharizakar/Downloads/Avatar Animations';
// Inventory needs skeletons/tracks, not decoded texture pixels.
(globalThis as any).document={createElementNS:()=>({addEventListener(){},removeEventListener(){},set src(value:string){},style:{}})};
(globalThis as any).window=globalThis;
const canonical=(name:string)=>name.split(':').at(-1)!.replace(/^mixamorig\d*/, '');
const hash=(value:any)=>crypto.createHash('sha256').update(value).digest('hex');
const records:any[]=[];
for(const file of (await fs.readdir(folder)).filter(f=>/\.fbx$/i.test(f)).sort()){
 const bytes=await fs.readFile(path.join(folder,file));const record:any={file,bytes:bytes.length,fileHash:hash(bytes)};
 try{const scene=new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),folder+'/');
 const bones:any[]=[];scene.traverse(n=>{if(n instanceof THREE.Bone)bones.push({name:canonical(n.name),parent:n.parent instanceof THREE.Bone?canonical(n.parent.name):null,position:n.position.toArray(),quaternion:n.quaternion.toArray()});});record.sceneBoneNodes=bones.length;const primaryClip=scene.animations.find(c=>c.duration>0),hipTrack=primaryClip?.tracks.find(t=>t.name.endsWith('Hips.position')),hip=hipTrack?scene.getObjectByName(hipTrack.name.slice(0,-9)):undefined;const primary:any[]=[];hip?.traverse(n=>{if(n instanceof THREE.Bone)primary.push({name:canonical(n.name),parent:n.parent instanceof THREE.Bone?canonical(n.parent.name):null,position:n.position.toArray(),quaternion:n.quaternion.toArray()});});if(primary.length){bones.splice(0,bones.length,...primary);}const unique=new Map<string,any>();for(const bone of bones)if(!unique.has(bone.name))unique.set(bone.name,bone);bones.splice(0,bones.length,...unique.values());record.bones=bones;
 record.skeletonHash=hash(JSON.stringify(bones.map(b=>[b.name,b.parent]).sort()));record.restHash=hash(JSON.stringify(bones.sort((a,b)=>a.name.localeCompare(b.name))));
 record.clips=scene.animations.map(clip=>{let maxStep=0,moving=0;const tracks=clip.tracks.map(t=>{const dot=t.name.lastIndexOf('.'),name=canonical(t.name.slice(0,dot))+t.name.slice(dot);const size=t.getValueSize();let change=0;for(let i=size;i<t.values.length;i+=size){if(size===4){const a=new THREE.Quaternion().fromArray(t.values,i-size),b=new THREE.Quaternion().fromArray(t.values,i);change=Math.max(change,a.angleTo(b));}else for(let j=0;j<size;j++)change=Math.max(change,Math.abs(t.values[i+j]-t.values[j]));}if(change>1e-5)moving++;if(size===4)maxStep=Math.max(maxStep,change);return {name,type:t.ValueTypeName,keys:t.times.length,change};});
 const normalized=clip.tracks.map(t=>({name:canonical(t.name.slice(0,t.name.lastIndexOf('.')))+t.name.slice(t.name.lastIndexOf('.')),times:Array.from(t.times),values:Array.from(t.values)})).sort((a,b)=>a.name.localeCompare(b.name));
 return {name:clip.name,duration:clip.duration,trackCount:tracks.length,movingTracks:moving,static:moving===0,maxQuaternionStep:maxStep,animationHash:hash(JSON.stringify(normalized)),tracks};});
 scene.traverse(n=>{if(n instanceof THREE.Mesh){n.geometry.dispose();(Array.isArray(n.material)?n.material:[n.material]).forEach(m=>m.dispose());}});
 }catch(error){record.error=String(error);}records.push(record);console.log(file,record.bones?.length,record.clips?.map((c:any)=>[c.duration,c.static]),record.error||'');
}
await fs.mkdir('docs',{recursive:true});await fs.writeFile('docs/animation-library-inventory.json',JSON.stringify({folder,count:records.length,records},null,2));
