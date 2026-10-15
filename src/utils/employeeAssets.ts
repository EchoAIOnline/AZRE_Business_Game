import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import {GLTFLoader,type GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
const decoder=new DRACOLoader().setDecoderPath('/models/draco/').setWorkerLimit(1);
const replacements=new Set(['acquisitions-specialist','dispositions-specialist','operations-specialist','receptionist']);
const assets=new Map<string,Promise<GLTF>>();
export async function loadEmployeeAsset(url:string):Promise<GLTF>{
 const file=url.split('/').pop()?.replace('.glb','');if(file&&replacements.has(file))url=`/models/mixamo/${file}.glb`;
 let request=assets.get(url);
 if(!request){request=new GLTFLoader().setDRACOLoader(decoder).loadAsync(url);assets.set(url,request);request.catch(()=>assets.delete(url));}
 const source=await request,scene=clone(source.scene) as THREE.Group;
 scene.traverse(o=>{if(o instanceof THREE.Mesh){
  // Animated limbs can move outside the imported bind-pose bounding sphere.
  // Four employees are cheap to render and must not flicker at frustum edges.
  if(o instanceof THREE.SkinnedMesh)o.frustumCulled=false;
  // Geometry and decoded textures are shared; materials are personal to each preview.
  o.geometry.userData.sharedEmployeeAsset=true;
  const copy=(material:THREE.Material)=>{const result=material.clone();if(url.includes('/mixamo/')&&result instanceof THREE.MeshStandardMaterial){result.metalness=0;result.metalnessMap=null;result.roughness=.72;result.roughnessMap=null;if(result instanceof THREE.MeshPhysicalMaterial)result.specularIntensity=.35;}Object.values(result).forEach(value=>{if(value instanceof THREE.Texture)value.userData.sharedEmployeeAsset=true;});return result;};
  o.material=Array.isArray(o.material)?o.material.map(copy):copy(o.material);
 }});
 return {...source,scene,scenes:[scene]};
}
