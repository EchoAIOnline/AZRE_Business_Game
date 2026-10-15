import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader,type GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {loadEmployeeAsset} from '../src/utils/employeeAssets';
const source=new THREE.Group(),bone=new THREE.Bone(),mesh=new THREE.SkinnedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:'white'}));
mesh.add(bone);mesh.bind(new THREE.Skeleton([bone]));source.add(mesh);let loads=0;
const original=GLTFLoader.prototype.loadAsync;
GLTFLoader.prototype.loadAsync=async()=>{loads++;return {scene:source,scenes:[source],animations:[],cameras:[],asset:{version:'2.0'},userData:{}} as unknown as GLTF;};
try{
 const [a,b]=await Promise.all([loadEmployeeAsset('/test/employee.glb'),loadEmployeeAsset('/test/employee.glb')]);
 assert.equal(loads,1,'concurrent/repeated requests decode model once');
 const am=a.scene.children[0] as THREE.SkinnedMesh,bm=b.scene.children[0] as THREE.SkinnedMesh;
 assert.equal(am.frustumCulled,false,'animated limbs remain visible outside bind-pose bounds');
 assert.notEqual(am.skeleton,bm.skeleton);assert.notEqual(am.skeleton.bones[0],bm.skeleton.bones[0]);assert.equal(am.geometry,bm.geometry);assert.notEqual(am.material,bm.material);
 (am.material as THREE.MeshStandardMaterial).color.set('red');assert.equal((bm.material as THREE.MeshStandardMaterial).color.getHex(),0xffffff,'preview color changes do not affect office');
 console.log('Employee asset decoding, skeleton isolation, geometry reuse and independent materials passed');
}finally{GLTFLoader.prototype.loadAsync=original;}
