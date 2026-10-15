import {libraryClipDefinitions} from './animationLibrary';
import {inspectEmployeeRig,validateEmployeeClip} from './employeeRig';
import {prepareMixamoClips} from './mixamoClips';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
export type EmployeeClips={standing:THREE.AnimationClip;walking:THREE.AnimationClip;standUp:THREE.AnimationClip;sitDown:THREE.AnimationClip;walkSpeed:number;seated?:THREE.AnimationClip;typing?:THREE.AnimationClip;mouse?:THREE.AnimationClip;lookAround?:THREE.AnimationClip;posture?:THREE.AnimationClip;library?:Partial<Record<keyof typeof libraryClipDefinitions,THREE.AnimationClip>>};
const clipCache=new Map<string,Promise<EmployeeClips>>();
const normalized=(name:string)=>name.replace(/[^a-z0-9]/gi,'').toLowerCase();
// Animation-only Rocketbox assets: geometry, materials and character bind poses stay untouched.
export function loadEmployeeClips(avatar:THREE.Object3D,assetKey:string,embedded:THREE.AnimationClip[]=[],strideSpeed?:number):Promise<EmployeeClips>{

 const cached=clipCache.get(assetKey);if(cached)return cached;
 const request=(async()=>{
  if(inspectEmployeeRig(avatar).convention==='mixamo'){
   const base=assetKey.replace('/models/','/models/mixamo/').replace('.glb','');
   const [manifest,sources]=await Promise.all([fetch('/models/mixamo/manifest.json').then(r=>{if(!r.ok)throw new Error('Mixamo manifest unavailable');return r.json();}),Promise.all(['Standing','Walking','StandUp','SitDown','Seated','Typing','LookAround'].map(name=>new GLTFLoader().loadAsync(`${base}-${name}.glb`)))]);
   const labels=['Standing','Walking','StandUp','SitDown','Seated','Typing','LookAround'];sources.forEach((s,i)=>s.animations.forEach(clip=>clip.name=labels[i]));
   const prepared=prepareMixamoClips(avatar,embedded.length?embedded:sources.flatMap(s=>s.animations),strideSpeed??manifest[assetKey.split('/').pop()!.replace('.glb','')].walkSpeed);
   const curated=await Promise.all(Object.entries(libraryClipDefinitions).filter(([,definition])=>definition.runtime).map(async([label])=>{const result=await new GLTFLoader().loadAsync(base.replace('/mixamo/','/mixamo/library/')+`-${label}.glb`),clip=result.animations[0];validateEmployeeClip(avatar,clip);return [label,clip] as const;}));
   const library=Object.fromEntries(curated),walking=library.WalkCandidate.clone();walking.name='Walking';
   const libraryManifest=await fetch('/models/mixamo/library/manifest.json').then(r=>{if(!r.ok)throw new Error('Library stride calibration unavailable');return r.json();});
   const upgraded=prepareMixamoClips(avatar,[prepared.standing,walking,prepared.standUp,prepared.sitDown,prepared.seated!,...(prepared.typing?[prepared.typing]:[])],libraryManifest[assetKey.split('/').pop()!.replace('.glb','')].walkSpeed);
   return {...upgraded,lookAround:prepared.lookAround,library};
  }
  const names=new Map<string,string>();avatar.traverse(n=>names.set(normalized(n.name),n.name));
  const base=assetKey.replace('/models/','/models/animations/').replace('.glb','');
  const sources=await Promise.all(['Standing','Walking','StandUp','SitDown'].map(name=>new GLTFLoader().loadAsync(`${base}-${name}.glb`)));
  let walkSpeed=.8;
  const clips=sources.map((source,index)=>{
   const clip=source.animations[0].clone();
   clip.tracks=clip.tracks.filter(track=>{
    const dot=track.name.lastIndexOf('.'),name=names.get(normalized(track.name.slice(0,dot)));if(!name)return false;
    track.name=name+track.name.slice(dot);
    // Bip01 Pelvis carries locomotion in centimetres along local X. Navigation owns
    // horizontal travel; retain captured vertical/lateral sway, remove forward drift.
    if(normalized(name)==='bip01pelvis'&&track.name.endsWith('.position')){
     const values=track.values,first=values[0],last=values[values.length-3];
     if(index===1)walkSpeed=Math.abs(last-first)*.01/clip.duration;
     for(let i=0;i<track.times.length;i++){
      values[i*3]-=index===1?first+(last-first)*track.times[i]/clip.duration:values[i*3];
      if(index>1)values[i*3+2]=0;
     }
    }
    return !track.name.endsWith('.scale');
   });
   // Close looping clips without a hard jump at wraparound. Transitions are one-shot.
   if(index<2)for(const track of clip.tracks){const size=track.getValueSize(),end=track.times.at(-1)!;
    for(let i=0;i<track.times.length;i++){const blend=THREE.MathUtils.smoothstep(track.times[i],end-.18,end);if(!blend)continue;
     if(size===4){const q=new THREE.Quaternion().fromArray(track.values,i*size).slerp(new THREE.Quaternion().fromArray(track.values,0),blend);q.toArray(track.values,i*size);}
     else for(let j=0;j<size;j++)track.values[i*size+j]=THREE.MathUtils.lerp(track.values[i*size+j],track.values[j],blend);
    }
   }
   return clip.optimize();
  });
  return {standing:clips[0],walking:clips[1],standUp:clips[2],sitDown:clips[3],walkSpeed};
 })();clipCache.set(assetKey,request);request.catch(()=>clipCache.delete(assetKey));return request;
}
