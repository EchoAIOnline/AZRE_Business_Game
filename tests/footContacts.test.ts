import assert from 'node:assert/strict';
import * as THREE from 'three';
import {FootContacts} from '../src/utils/footContacts';
const root=new THREE.Group(),thigh=new THREE.Bone(),calf=new THREE.Bone(),foot=new THREE.Bone();thigh.name='mixamorigLeftUpLeg';calf.name='mixamorigLeftLeg';foot.name='mixamorigLeftFoot';thigh.position.y=1;calf.position.set(0,-.5,.1);foot.position.set(0,-.5,-.1);root.add(thigh);thigh.add(calf);calf.add(foot);root.updateMatrixWorld(true);
const rest=[thigh.quaternion.clone(),calf.quaternion.clone(),foot.quaternion.clone()],contacts=new FootContacts(root);contacts.update(.05,true);contacts.update(.05,true);const anchor=foot.getWorldPosition(new THREE.Vector3());
for(let i=0;i<8;i++){root.position.x+=.003;[thigh,calf,foot].forEach((bone,j)=>bone.quaternion.copy(rest[j]));root.updateMatrixWorld(true);contacts.update(.05,true);assert.ok(foot.getWorldPosition(new THREE.Vector3()).distanceTo(anchor)<.001,'planted foot stays fixed while pelvis travels');assert.ok([...foot.quaternion.toArray()].every(Number.isFinite));}
contacts.update(.05,false);root.position.x+=.1;[thigh,calf,foot].forEach((bone,j)=>bone.quaternion.copy(rest[j]));root.updateMatrixWorld(true);contacts.update(.05,false);assert.ok(foot.getWorldPosition(new THREE.Vector3()).distanceTo(anchor)>.05,'seated mode releases foot contact');
console.log('Foot planting, finite IK and contact release passed');
