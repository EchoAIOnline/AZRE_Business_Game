import * as THREE from 'three';
const normalize=(name:string)=>name.replace(/[^a-z0-9]/gi,'').toLowerCase();
const aliases:Record<string,string>={hips:'pelvis',spine:'spine',spine1:'spine1',spine2:'spine2',neck:'neck',head:'head',lefteye:'leye',righteye:'reye'};
for(const [side,prefix] of [['Left','l'],['Right','r']]){
 for(const [source,target] of [['Shoulder','clavicle'],['Arm','upperarm'],['ForeArm','forearm'],['Hand','hand'],['UpLeg','thigh'],['Leg','calf'],['Foot','foot'],['ToeBase','toe0']])aliases[normalize(side+source)]=prefix+target;
 for(const [digit,index] of [['Thumb',0],['Index',1],['Middle',2],['Ring',3],['Pinky',4]] as const)for(let joint=1;joint<=3;joint++)aliases[normalize(side+'Hand'+digit+joint)]=prefix+'finger'+index+(joint===1?'':joint-1);
}
// Semantic lookup only: names, hierarchy, bind matrices and animation bindings are not changed.
export function employeeBoneKey(name:string){const key=normalize(name);const humanoid=key.replace(/^mixamorig\d*/, '');return aliases[humanoid]?'bip01'+aliases[humanoid]:key;}
export function inspectEmployeeRig(root:THREE.Object3D){
 const bones=new Map<string,THREE.Bone>();let skins=0,triangles=0;
 root.traverse(n=>{if(n instanceof THREE.Bone){const key=employeeBoneKey(n.name);if(bones.has(key))throw new Error(`Duplicate humanoid bone: ${n.name}`);bones.set(key,n);}if(n instanceof THREE.SkinnedMesh)skins++;if(n instanceof THREE.Mesh)triangles+=(n.geometry.index?.count||n.geometry.attributes.position?.count||0)/3;});
 const required=['pelvis','spine','head','lupperarm','lforearm','lhand','rupperarm','rforearm','rhand','lthigh','lcalf','lfoot','rthigh','rcalf','rfoot'];
 const missing=required.filter(name=>!bones.has('bip01'+name));
 const convention=[...bones.values()].some(b=>/^mixamorig/i.test(b.name))?'mixamo':[...bones.values()].some(b=>/^Bip01/i.test(b.name))?'rocketbox':'humanoid';
 return {bones,skins,triangles,missing,convention,fingerSupport:['l','r'].every(side=>bones.has('bip01'+side+'finger1')),eyeSupport:bones.has('bip01leye')&&bones.has('bip01reye')};
}
export function validateEmployeeClip(root:THREE.Object3D,clip:THREE.AnimationClip){
 const names=new Set<string>();root.traverse(n=>names.add(n.name));
 if(!clip.tracks.length||!Number.isFinite(clip.duration)||clip.duration<=0)throw new Error(`Invalid animation: ${clip.name}`);
 for(const track of clip.tracks){const split=track.name.lastIndexOf('.'),bone=track.name.slice(0,split),property=track.name.slice(split+1);if(!names.has(bone)||!['position','quaternion','scale','morphTargetInfluences'].includes(property))throw new Error(`Unbound animation track: ${track.name}`);
  if(![...track.times,...track.values].every(Number.isFinite))throw new Error(`Non-finite animation track: ${track.name}`);
 }
}
