import {createWorkSchedule} from '../utils/workAnimation';
import {moveWalker,WalkObstacle} from '../utils/walkCollision';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type View = 'overview' | 'acquisitions' | 'dispositions' | 'operations' | 'ceo' | 'conference' | 'roam';
export const rooms = [
  { id:'acquisitions', name:'Acquisitions', detail:'One specialist workstation', x:-13, z:-9.5 },
  { id:'dispositions', name:'Dispositions', detail:'One specialist workstation', x:13, z:-9.5 },
  { id:'operations', name:'Operations', detail:'One specialist workstation', x:13, z:9.5 },
  { id:'ceo', name:'CEO office', detail:'Full-width executive suite · deeper rear wing', x:0, z:-21 },
  { id:'conference', name:'Conference', detail:'Shared deal review room', x:-13, z:7 },
] as const;

// Architectural scene uses native geometry and reusable materials. No business data is simulated.
export function LuxuryOffice({view, onSelect, ceiling, quality, paused}: {view:View; onSelect:(v:View)=>void; ceiling:boolean; quality:boolean; paused:boolean}) {
 const host=useRef<HTMLDivElement>(null); const state=useRef({view,ceiling,quality,onSelect,paused});
 const [failed,setFailed]=useState(false);
 useEffect(()=>{state.current={view,ceiling,quality,onSelect,paused};},[view,ceiling,quality,onSelect,paused]);
 useEffect(()=>{
  if(!host.current)return; const el=host.current;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch{setFailed(true);return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.setSize(el.clientWidth,el.clientHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15;
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  el.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#d6dde0');
  const camera=new THREE.PerspectiveCamera(52,el.clientWidth/el.clientHeight,.1,180); camera.position.set(0,3.8,20);
  const controls=new OrbitControls(camera,renderer.domElement); controls.enableDamping=true; controls.dampingFactor=.08;
  controls.maxPolarAngle=Math.PI/2-.03;controls.minDistance=3;controls.maxDistance=65;controls.target.set(0,2,-5);
  const geometry=new Set<THREE.BufferGeometry>(); const materials=new Set<THREE.Material>();const textures=new Set<THREE.Texture>();
  function mat(color:string,roughness=.6,metalness=0){const m=new THREE.MeshStandardMaterial({color,roughness,metalness});materials.add(m);return m;}
  const cream=mat('#e9dfcc',.28),black=mat('#161714',.28),brass=mat('#b9924d',.24,.8),wood=mat('#62452f',.65),white=mat('#ede8db',.6),chairMat=mat('#242822',.65),leaf=mat('#354d26',.8);
  const glass=new THREE.MeshPhysicalMaterial({color:'#bed6de',transparent:true,opacity:.12,roughness:.07,metalness:.1,depthWrite:false,side:THREE.DoubleSide});materials.add(glass);
  const glow=new THREE.MeshBasicMaterial({color:'#ffd798'});materials.add(glow);
  function mesh(g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=scene){geometry.add(g);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=m!==glass&&m!==glow;o.receiveShadow=true;parent.add(o);return o;}
  const collisionMeshes:THREE.Mesh[]=[];
  function box(w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material=cream,parent:THREE.Object3D=scene){const o=mesh((m===white&&h>.1?new RoundedBoxGeometry(w,h,d,3,Math.min(w,h,d)*.16):new THREE.BoxGeometry(w,h,d)),m,x,y,z,parent);if(h>.1&&y+h/2>.2&&y-h/2<1.7&&m.visible)collisionMeshes.push(o);return o;}
  function cylinder(r:number,h:number,x:number,y:number,z:number,m:THREE.Material=brass,parent:THREE.Object3D=scene){return mesh(new THREE.CylinderGeometry(r,r,h,24),m,x,y,z,parent);}
  function texture(draw:(c:CanvasRenderingContext2D)=>void,w=1024,h=512){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d')!);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;textures.add(t);return t;}
  let seed=12;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
  const marble=texture(c=>{c.fillStyle='#171715';c.fillRect(0,0,1024,512);for(let i=0;i<22;i++){c.beginPath();let x=rnd()*1024,y=rnd()*512;c.moveTo(x,y);for(let j=0;j<9;j++){x+=rnd()*140-50;y+=rnd()*100-35;c.lineTo(x,y);}c.strokeStyle=i%3===0?'#b79a60':'#524d40';c.lineWidth=.6+rnd()*1.4;c.stroke();}},1024,512);
  const marbleMat=mat('#ffffff',.23);marbleMat.map=marble;
  const stone=texture(c=>{c.fillStyle='#d9d0bd';c.fillRect(0,0,1024,512);for(let i=0;i<100;i++){c.beginPath();c.moveTo(rnd()*1024,rnd()*512);c.bezierCurveTo(rnd()*1024,rnd()*512,rnd()*1024,rnd()*512,rnd()*1024,rnd()*512);c.strokeStyle='rgba(121,109,88,.08)';c.lineWidth=rnd()*3;c.stroke();}});
  const stoneMat=mat('#ffffff',.3);stoneMat.map=stone;
  const rugTex=texture(c=>{c.fillStyle='#b6aa96';c.fillRect(0,0,1024,512);for(let i=0;i<23000;i++){c.fillStyle=rnd()>.5?'#c9bfad':'#a69b87';c.fillRect(rnd()*1024,rnd()*512,1+rnd()*4,1+rnd()*3);}});
  const rug=mat('#ffffff',.95);rug.map=rugTex;
  const building=new THREE.Group();scene.add(building);const roof=new THREE.Group();building.add(roof);const shell=new THREE.Group();building.add(shell);
  box(36,.35,41.5,0,-.2,-6.25,stoneMat); // Tile seams stay restrained.
  for(let x=-18;x<18;x+=2)box(.014,.008,41.5,x,.002,-6.25,mat('#bcb19d',.8));
  for(let z=-26;z<15;z+=2)box(36,.008,.014,0,.002,z,mat('#bcb19d',.8));
  box(36,.7,.22,0,.35,-27,cream,shell);box(.22,4.6,41.5,-18,2.3,-6.25,cream,shell);box(.22,4.6,41.5,18,2.3,-6.25,cream,shell);
  box(36,.12,41.5,0,4.6,-6.25,white,roof);
  // Walnut ceiling inset and warm perimeter coves.
  for(let x=-6.5;x<=6.5;x+=.22)box(.11,.13,39,x,4.48,-6.4,wood,roof);
  for(const x of [-7,7])box(.07,.04,40,x,4.38,-6.4,glow,roof);
  for(const x of [-16,-12,12,16])for(const z of [-24,-17,-11,-4,4,11]){cylinder(.09,.025,x,4.43,z,glow,roof);}
  for(const [r,y] of [[1.65,3.8],[1.25,3.3]]){const ring=mesh(new THREE.TorusGeometry(r,.045,8,64),glow,0,y,2,roof);ring.rotation.x=Math.PI/2;for(const x of [-r,r])box(.014,4.5-y,.014,x,(4.5+y)/2,2,brass,roof);}
  // Skyline is a lightweight architectural backdrop, not a photograph of specific properties.
  const city=new THREE.Group();scene.add(city);const skylineMat=mat('#879ea9',.8);
  for(let i=0;i<48;i++){const x=-40+i*1.7,h=2+rnd()*9;box(.7+rnd(),h,1.5,x,h/2,-43-rnd()*7,skylineMat,city);}
  for(let i=0;i<18;i++)cylinder(.3,1.2,-16+i*2,4,-38,mat('#79906c'),city);
  // Rear windows and black mullions; upper panes remain visible in arrival view.
  for(let x=-15;x<=15;x+=3){box(2.85,3.3,.035,x,2.75,-26.85,glass);box(.06,4.4,.08,x-1.5,2.2,-26.7,black);}
  function partition(x1:number,z1:number,x2:number,z2:number){const len=Math.hypot(x2-x1,z2-z1),vertical=x1===x2;const x=(x1+x2)/2,z=(z1+z2)/2;box(vertical?.035:len,3.5,vertical?len:.035,x,1.85,z,glass);box(vertical?.09:len,.065,vertical?len:.09,x,3.62,z,black);box(vertical?.09:len,.065,vertical?len:.09,x,.08,z,black);const n=Math.ceil(len/2.7);for(let i=0;i<=n;i++){box(.065,3.6,.065,x1+(x2-x1)*i/n,1.8,z1+(z2-z1)*i/n,black);}}
  // Interior doors are represented by brass pulls and an open corridor-side gap.
  function front(x:number,z1:number,z2:number,doorZ:number, opposite=false){
   // A full-height framed doorway with a glass leaf swung 90° into the suite.
   const width=1.4, height=3.25, inward=x<0?-1:1;
   partition(x,z1,x,doorZ-width/2);partition(x,doorZ+width/2,x,z2);
   for(const z of [doorZ-width/2,doorZ+width/2])box(.1,height,.1,x,height/2,z,black);
   box(.1,.1,width+.1,x,height,doorZ,black);
   const hinge=new THREE.Group();hinge.position.set(x,0,doorZ+(opposite?width/2:-width/2));scene.add(hinge);
   // Local leaf extends along +Z; rotation carries its free edge fully inside the room.
   hinge.rotation.y=inward*(opposite?-1:1)*Math.PI/2;hinge.scale.z=opposite?-1:1;
   box(.035,height-.14,width-.12,0,height/2,width/2,glass,hinge);
   for(const z of [.04,width-.04])box(.065,height-.08,.065,0,height/2,z,black,hinge);
   for(const y of [.06,height-.06])box(.065,.065,width,0,y,width/2,black,hinge);
   // Brass pull on both faces, mounts, and visible hinge barrels.
   for(const face of [-.08,.08]){
    cylinder(.025,.65,face,1.45,width-.19,brass,hinge);
    for(const y of [1.15,1.75])box(.09,.035,.035,face/2,y,width-.19,brass,hinge);
   }
   for(const y of [.3,1.6,2.95])cylinder(.035,.14,0,y,.03,brass,hinge);
  }
  front(-9.5,-14,0,-1.3,true);partition(-18,0,-9.5,0);front(9.5,-14,0,-1.3,true);partition(9.5,0,18,0);
  front(9.5,0,14,1.4);front(-9.5,0,14,1.3);
  // Full-width CEO suite starts behind both department wings.
  partition(-18,-14,-1.4,-14);partition(1.4,-14,18,-14);
  for(const side of [-1,1]){
   const door=new THREE.Group();door.position.set(side*1.4,0,-14);door.rotation.y=side*Math.PI/2;scene.add(door);
   box(1.3,3.1,.035,-side*.65,1.6,0,glass,door);
   for(const x of [-side*.03,-side*1.27])box(.06,3.2,.08,x,1.6,0,black,door);
   for(const y of [.04,3.18])box(1.3,.06,.08,-side*.65,y,0,black,door);
   cylinder(.025,.7,-side*1.1,1.4,.09,brass,door);
  }
  function plant(x:number,z:number,size=1){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);const pot=cylinder(.32*size,.65*size,0,.33*size,0,black,g);collisionMeshes.push(pot);cylinder(.33*size,.055*size,0,.66*size,0,brass,g);for(let i=0;i<12;i++){const a=i*2.4,h=(.8+rnd()*.75)*size;const stem=cylinder(.015*size,h,Math.cos(a)*.08,h/2+.6*size,Math.sin(a)*.08,wood,g);stem.rotation.z=Math.cos(a)*.3;const l=mesh(new THREE.SphereGeometry(1,8,6),leaf,Math.cos(a)*.3*size,h+.4*size,Math.sin(a)*.3*size,g);l.scale.set(.16*size,.6*size,.06*size);l.rotation.z=Math.cos(a)*.7;l.rotation.y=a;}}
  function sign(text:string,x:number,y:number,z:number,width=3.1,rot=0,height=width/2){const canvasHeight=Math.round(1024*height/width);const t=texture(c=>{c.fillStyle='#161815';c.fillRect(0,0,1024,canvasHeight);c.strokeStyle='#ba9654';c.lineWidth=9;c.strokeRect(6,6,1012,canvasHeight-12);c.textAlign='center';c.textBaseline='middle';c.fillStyle='#e4dbcb';c.font='500 58px Georgia';text.split('|').forEach((s,i,a)=>c.fillText(s,512,canvasHeight/2+(i-(a.length-1)/2)*80));},1024,canvasHeight);const m=new THREE.MeshBasicMaterial({map:t});materials.add(m);const p=mesh(new THREE.PlaneGeometry(width,height),m,x,y,z);p.rotation.y=rot;}
  const loader=new THREE.TextureLoader();let disposed=false;
  function emblem(x:number,y:number,z:number,size:number,rot=0){const t=loader.load('/brand/emblem.png',()=>{if(disposed)t.dispose();});t.colorSpace=THREE.SRGBColorSpace;textures.add(t);const m=new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,side:THREE.DoubleSide});materials.add(m);const p=mesh(new THREE.PlaneGeometry(size,size),m,x,y,z);p.rotation.y=rot;}
  function wordmark(x:number,y:number,z:number,size:number){const t=loader.load('/brand/reception-wordmark-transparent.png',()=>{if(disposed)t.dispose();});t.colorSpace=THREE.SRGBColorSpace;textures.add(t);const m=new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false});materials.add(m);mesh(new THREE.PlaneGeometry(size,size),m,x,y,z);}
  function chair(x:number,z:number,rot=0,fitted=false){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);const seatY=fitted?.54:.6;box(fitted?.64:.7,fitted?.12:.16,fitted?.64:.72,0,seatY,0,chairMat,g);box(fitted?.64:.7,fitted?.76:.85,.12,0,seatY+.45,fitted?.3:.34,chairMat,g);cylinder(.06,seatY-.1,0,(seatY-.1)/2+.04,0,black,g);for(const a of [0,1.26,2.51,3.77,5.03]){const b=box(.045,.05,.45,Math.sin(a)*.18,.08,Math.cos(a)*.18,black,g);b.rotation.y=a;}for(const x of [-.4,.4])box(.07,.06,.5,x,seatY+.28,0,black,g);}
  const interactives:THREE.Object3D[]=[];

  const avatarMixers:THREE.AnimationMixer[]=[];
  const workGestures:((time:number)=>void)[]=[];
  const schedules=new Map<string,ReturnType<typeof createWorkSchedule>>();
  function scheduleFor(id:string){let schedule=schedules.get(id);if(!schedule){const offsets:Record<string,number>={acquisitions:3,dispositions:29,operations:56};schedule=createWorkSchedule(Math.floor(Math.random()*4294967296),(offsets[id]||0)+Math.random()*5);schedules.set(id,schedule);}return schedule;}
  function humanSpecialist(x:number,z:number,url='/models/acquisitions-specialist.glb',working=true,scheduleId='acquisitions'){
   new GLTFLoader().load(url,gltf=>{
    if(disposed){gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose());}});return;}
    const avatar=gltf.scene;avatar.scale.setScalar(1.2);avatar.position.set(x,.037,z-1.05);scene.add(avatar);
    avatar.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;geometry.add(o.geometry);const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{materials.add(m);Object.values(m).forEach(v=>{if(v instanceof THREE.Texture)textures.add(v);});});}});
    const bones=new Map<string,THREE.Bone>();avatar.traverse(o=>{if(o instanceof THREE.Bone)bones.set(o.name.replace(/[^a-z0-9]/gi,'').toLowerCase(),o);});
    // Bind-space frames let mirrored fingers match despite different left/right bone axes.
    const bindWorld=new Map<string,THREE.Quaternion>();avatar.traverse(o=>{if(o instanceof THREE.SkinnedMesh)o.skeleton.bones.forEach((bone,i)=>{const q=new THREE.Quaternion().setFromRotationMatrix(o.skeleton.boneInverses[i].clone().invert());bindWorld.set(bone.name.replace(/[^a-z0-9]/gi,'').toLowerCase(),q);});});
    function mirrorTypingFingers(){
     const leftHand=bones.get('bip01lhand'),rightHand=bones.get('bip01rhand');if(!leftHand||!rightHand)return;
     avatar.updateMatrixWorld(true);const lh=leftHand.getWorldQuaternion(new THREE.Quaternion()),rh=rightHand.getWorldQuaternion(new THREE.Quaternion());
     for(let finger=0;finger<=4;finger++)for(const suffix of ['', '1','2']){
      const ln='bip01lfinger'+finger+suffix,rn='bip01rfinger'+finger+suffix,left=bones.get(ln),right=bones.get(rn);if(!left||!right)continue;
      const lb=bindWorld.get(ln),rb=bindWorld.get(rn),lhb=bindWorld.get('bip01lhand'),rhb=bindWorld.get('bip01rhand');if(!lb||!rb||!lhb||!rhb)continue;
      const rightRest=rhb.clone().invert().multiply(rb),leftRest=lhb.clone().invert().multiply(lb);
      const delta=rh.clone().invert().multiply(right.getWorldQuaternion(new THREE.Quaternion())).multiply(rightRest.invert());
      delta.set(delta.x,-delta.y,-delta.z,delta.w);
      const desired=lh.clone().multiply(delta).multiply(leftRest);
      left.quaternion.copy(left.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(desired));avatar.updateMatrixWorld(true);
      const nextSuffix=suffix===''?'1':suffix==='1'?'2':null;
      const lc=nextSuffix?bones.get('bip01lfinger'+finger+nextSuffix):null,rc=nextSuffix?bones.get('bip01rfinger'+finger+nextSuffix):null;
      const current=lc?lc.getWorldPosition(new THREE.Vector3()).sub(left.getWorldPosition(new THREE.Vector3())).normalize():new THREE.Vector3(0,1,0).applyQuaternion(left.getWorldQuaternion(new THREE.Quaternion()));
      const matching=rc?rc.getWorldPosition(new THREE.Vector3()).sub(right.getWorldPosition(new THREE.Vector3())).normalize():new THREE.Vector3(0,1,0).applyQuaternion(right.getWorldQuaternion(new THREE.Quaternion()));matching.x*=-1;
      const matched=left.getWorldQuaternion(new THREE.Quaternion()).premultiply(new THREE.Quaternion().setFromUnitVectors(current,matching));
      left.quaternion.copy(left.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(matched));avatar.updateMatrixWorld(true);
     }
    }
    const handVertices:{mesh:THREE.SkinnedMesh;indices:number[];palmIndices:number[];side:string}[]=[];
    avatar.traverse(o=>{if(!(o instanceof THREE.SkinnedMesh))return;const ids=o.geometry.getAttribute('skinIndex'),weights=o.geometry.getAttribute('skinWeight');
     for(const side of ['l','r']){const indices:number[]=[],palmIndices:number[]=[];for(let i=0;i<ids.count;i++){let influence=0,palmInfluence=0;for(let k=0;k<4;k++){const bone=o.skeleton.bones[ids.getComponent(i,k)],name=bone?.name.replace(/[^a-z0-9]/gi,'').toLowerCase();if(name==='bip01'+side+'hand')palmInfluence+=weights.getComponent(i,k);if(name?.startsWith('bip01'+side+'hand')||name?.startsWith('bip01'+side+'finger'))influence+=weights.getComponent(i,k);}if(influence>.5)indices.push(i);if(palmInfluence>.8)palmIndices.push(i);}handVertices.push({mesh:o,indices,palmIndices,side});}
    });
    function lowestHand(side:string,palmOnly=false){avatar.updateMatrixWorld(true);let low=Infinity;const v=new THREE.Vector3();for(const item of handVertices){if(item.side!==side)continue;item.mesh.skeleton.update();for(const index of (palmOnly?item.palmIndices:item.indices)){item.mesh.getVertexPosition(index,v);v.applyMatrix4(item.mesh.matrixWorld);low=Math.min(low,v.y);}}return low;}
    // Two-bone arm posing keeps hands on the real desk surface throughout the idle clip.
    function reach(side:string,target:THREE.Vector3,orient=true){
     const upper=bones.get('bip01'+side+'upperarm'),fore=bones.get('bip01'+side+'forearm'),hand=bones.get('bip01'+side+'hand');if(!upper||!fore||!hand)return;
     avatar.updateMatrixWorld(true);const originalHand=hand.getWorldQuaternion(new THREE.Quaternion());
     const a=upper.getWorldPosition(new THREE.Vector3()),b=fore.getWorldPosition(new THREE.Vector3()),c=hand.getWorldPosition(new THREE.Vector3());
     const l1=a.distanceTo(b),l2=b.distanceTo(c),direction=target.clone().sub(a),distance=Math.min(direction.length(),l1+l2-.002);direction.normalize();
     const along=(l1*l1-l2*l2+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along));
     const bend=new THREE.Vector3(side==='l'?1:-1,-.8,-.25);bend.addScaledVector(direction,-bend.dot(direction)).normalize();
     const elbow=a.clone().addScaledVector(direction,along).addScaledVector(bend,height);
     function aim(bone:THREE.Bone,child:THREE.Bone,dest:THREE.Vector3){
      const origin=bone.getWorldPosition(new THREE.Vector3()),current=child.getWorldPosition(new THREE.Vector3()).sub(origin).normalize(),desired=dest.clone().sub(origin).normalize();
      const world=bone.getWorldQuaternion(new THREE.Quaternion()),parent=bone.parent!.getWorldQuaternion(new THREE.Quaternion());
      world.premultiply(new THREE.Quaternion().setFromUnitVectors(current,desired));bone.quaternion.copy(parent.invert().multiply(world));avatar.updateMatrixWorld(true);
     }
     aim(upper,fore,elbow);aim(fore,hand,target);
     if(!orient){hand.quaternion.copy(hand.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(originalHand));avatar.updateMatrixWorld(true);return;}
     // Palm down; fingers point toward the monitor (+Z in office coordinates).
     const finger=bones.get('bip01'+side+'finger2');if(finger)aim(hand,finger,target.clone().add(new THREE.Vector3(0,-.008,.12)));
     const index=bones.get('bip01'+side+'finger1'),little=bones.get('bip01'+side+'finger4');
     if(finger&&index&&little){
      const wrist=hand.getWorldPosition(new THREE.Vector3());
      const forward=finger.getWorldPosition(new THREE.Vector3()).sub(wrist).normalize();
      const across=little.getWorldPosition(new THREE.Vector3()).sub(index.getWorldPosition(new THREE.Vector3()));
      const backOfHand=forward.clone().cross(across).normalize().multiplyScalar(side==='l'?1:-1);
      const up=new THREE.Vector3(0,1,0).addScaledVector(forward,-forward.y).normalize();
      const rotation=new THREE.Quaternion().setFromUnitVectors(backOfHand,up);
      const world=hand.getWorldQuaternion(new THREE.Quaternion()).premultiply(rotation);
      hand.quaternion.copy(hand.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world));avatar.updateMatrixWorld(true);
     }
    }
    if(working)workGestures.push(time=>{
     const {mouse:mousePhase,mouseBlend:blend,restBlend,motionTime}=scheduleFor(scheduleId)(time);
     time=motionTime;
     avatar.updateMatrixWorld(true);
     const idleWrists=new Map<string,THREE.Vector3>();for(const side of ['l','r']){const hand=bones.get('bip01'+side+'hand');if(hand)idleWrists.set(side,hand.getWorldPosition(new THREE.Vector3()));}
     const restingPose=new Map<THREE.Bone,THREE.Quaternion>();
     for(const [name,bone] of bones)if(/bip01[lr](upperarm|forearm|hand|finger)/.test(name))restingPose.set(bone,bone.quaternion.clone());
     const leftTarget=new THREE.Vector3(x+.16+Math.sin(time*1.6)*.02,1.075+Math.sin(time*9)*.004,z-.51);
     const rightTarget=new THREE.Vector3(THREE.MathUtils.lerp(x-.15,x-.48,blend),1.075+Math.sin(time*10)*.004,z-.51+blend*.04+(mousePhase?Math.sin(time*2)*.025:0));
     reach('l',leftTarget);reach('r',rightTarget);
     for(const [name,bone] of bones){
      const digit=name.match(/bip01([lr])finger([1-4])([12]?)$/);if(!digit)continue;
      const finger=Number(digit[2]),joint=Number(digit[3]||0),right= digit[1]==='r';
      const tap=Math.pow(Math.max(0,Math.sin(time*(8+finger*.45)+finger*1.7+(right?1.3:0))),3);
      // Offset each finger's keystroke; mouse hand relaxes around the mouse between typing bursts.
      const typing=1;
      bone.rotation.z+=(right?-1:1)*((.035+tap*(joint===0?.08:.12))*typing+.09*(1-typing));
     }
     mirrorTypingFingers();
     // Enforce clearance using the animated skin, including fingertips, rather than wrist position alone.
     for(const [side,target,surface] of [['l',leftTarget,1.022],['r',rightTarget,1.022]] as const){
      const lift=surface-lowestHand(side);if(lift>0&&Number.isFinite(lift)){target.y+=lift+.003;reach(side,target);}
     }
     if(blend>.99){
      // Place the underside of the palm on the mouse dome, instead of hovering the fingertips above it.
      const contact=1.041-lowestHand('r',true);if(Number.isFinite(contact)){rightTarget.y+=contact;reach('r',rightTarget);}
     }
     // Match the unmodified seated idle pose used by Dispositions and Operations.
     if(restBlend===1){for(const [bone,rest] of restingPose)bone.quaternion.copy(rest);avatar.updateMatrixWorld(true);}
     else if(restBlend>0){
      const starts=new Map<string,THREE.Vector3>();for(const side of ['l','r'])starts.set(side,bones.get('bip01'+side+'hand')!.getWorldPosition(new THREE.Vector3()));
      for(const [bone,rest] of restingPose)if(/hand|finger/i.test(bone.name))bone.quaternion.slerp(rest,Math.max(0,(restBlend-.6)/.4));
      for(const side of ['l','r']){const start=starts.get(side)!,end=idleWrists.get(side)!;const lifted=start.clone();lifted.y=1.22;const above=end.clone();above.y=1.22;
       const target=restBlend<.25?start.clone().lerp(lifted,restBlend/.25):restBlend<.6?lifted.lerp(above,(restBlend-.25)/.35):above.lerp(end,(restBlend-.6)/.4);reach(side,target,false);
      }
     }
    });
    if(gltf.animations.length){const mixer=new THREE.AnimationMixer(avatar);mixer.clipAction(gltf.animations[0]).play();mixer.setTime(Math.random()*gltf.animations[0].duration);avatarMixers.push(mixer);}
   },undefined,error=>console.error('Unable to load Acquisitions character',error));
  }
  function desk(x:number,z:number,id:View,ceo=false){const w=ceo?3.5:2.5;box(w,.14,1.3,x,.91,z,ceo?marbleMat:white);for(const dx of [-w/2+.25,w/2-.25])box(.5,.8,1.15,x+dx,.42,z,ceo?black:cream);box(w,.035,.06,x,.83,z+.66,brass);chair(x,z-1.05,Math.PI,!ceo);const monitor=box(.92,.59,.055,x,1.38,z+.2,black);cylinder(.04,.2,x,1.02,z+.2,black);box(.3,.025,.23,x,.96,z+.2,black);const screenMat=new THREE.MeshBasicMaterial({color:'#111b19'});materials.add(screenMat);
   const screenshot=id==='dispositions'?{url:'/brand/dispositions-buyers.png',ratio:1738/3010}:id==='acquisitions'?{url:'/brand/acquisitions-pipeline.png',ratio:1732/3016}:null;
   if(screenshot){
    const screenTexture=loader.load(screenshot.url,()=>{if(disposed)screenTexture.dispose();});screenTexture.colorSpace=THREE.SRGBColorSpace;textures.add(screenTexture);
    screenMat.map=screenTexture;screenMat.color.set('#ffffff');
   }
   const display=mesh(new THREE.PlaneGeometry(.85,screenshot?.85*screenshot.ratio:.51),screenMat,x,1.38,screenshot?z+.168:z+.232);
   if(screenshot)display.rotation.y=Math.PI;
   if(!screenshot)emblem(x,1.38,z+.236,.35);
   box(.64,.025,.23,x,.99,z-.38,black);
   if(!ceo){
    const keyMat=mat('#53575a',.65);for(let row=0;row<4;row++)for(let col=0;col<13;col++)box(.036,.012,.034,x-.285+col*.046,1.009,z-.455+row*.045,keyMat);
    box(.24,.012,.03,x,1.009,z-.285,keyMat);
    const mouse=mesh(new THREE.SphereGeometry(1,24,16),black,x-.48,1.014,z-.38);mouse.scale.set(.045,.026,.075);
    box(.003,.002,.055,x-.48,1.04,z-.405,keyMat);box(.015,.008,.024,x-.48,1.04,z-.405,brass);
    box(.2,.005,.23,x-.48,.985,z-.38,mat('#34383b',.9));
    workGestures.push(time=>{const {mouse:active,motionTime}=scheduleFor(id)(time);mouse.position.z=z-.38+(active?Math.sin(motionTime*2)*.025:0);});
   }cylinder(.05,.1,x+.9,1.05,z+.4,brass);
   const hit=box(w,2,2,x,1,z,new THREE.MeshBasicMaterial({visible:false}));materials.add(hit.material as THREE.Material);hit.userData.room=id;interactives.push(hit);monitor.userData.room=id;
   if(!ceo){ // One visible avatar per AI department, idle only.
    humanSpecialist(x,z,id==='acquisitions'?'/models/acquisitions-specialist.glb':id==='dispositions'?'/models/dispositions-specialist.glb':'/models/operations-specialist.glb',true,id);
   }
  }
  function cabinet(x:number,z:number,w=5){box(w,.85,.6,x,.43,z,black);box(w,.045,.64,x,.88,z,wood);for(let dx=-w/2+.5;dx<w/2;dx+=1){box(.025,.1,.025,x+dx,.58,z+.32,brass);cylinder(.1,.18,x+dx,1,z,brass);}box(w,.025,.04,x,.15,z+.32,glow);}
  desk(-13,-6,'acquisitions');desk(13,-6,'dispositions');desk(13,6,'operations');desk(0,-22,'ceo',true);
  for(const [x,z] of [[-13,-11],[13,-11],[13,11]]){cabinet(x,z);plant(x-2.8,z);plant(x+2.8,z);}
  for(const [x,z] of [[-13,-6],[13,-6],[13,6]]){box(6,.018,7,x,.015,z,rug);}
  function departmentSign(text:string,x:number,z:number,rot:number,width=3.8){
   const t=texture(c=>{c.fillStyle='#161815';c.fillRect(0,0,1024,180);c.strokeStyle='#ba9654';c.lineWidth=5;c.strokeRect(4,4,1016,172);c.textAlign='center';c.textBaseline='middle';c.fillStyle='#efe6d4';c.font='500 48px Georgia';c.fillText(text,512,90);},1024,180);
   const m=new THREE.MeshBasicMaterial({map:t});materials.add(m);
   const panel=mesh(new THREE.PlaneGeometry(width,.65),m,x,2.85,z);panel.rotation.y=rot;
  }
  // Corridor-facing front surfaces, not signs floating inside the rooms.
  departmentSign('ACQUISITIONS',-9.42,-4.3,Math.PI/2);
  departmentSign('DISPOSITIONS',9.42,-4.3,-Math.PI/2);
  departmentSign('OPERATIONS',9.42,4.5,-Math.PI/2);
  departmentSign('CONFERENCE',-9.42,4.4,Math.PI/2);
  departmentSign('CEO OFFICE · ASHARI ZAKAR',4,-13.91,0,4.3);
  // CEO shelving, lounge and walnut columns.
  for(const x of [16.7]){box(.7,3.5,5,x,1.75,-22.5,black);for(let z=-24;z<-20;z+=1.1){box(.72,.04,.8,x,1.2,z,wood);box(.72,.04,.8,x,2.3,z,wood);cylinder(.09,.24,x,2.46,z,brass);box(.72,.03,.08,x,2.65,z+.37,glow);}}
  box(8,.02,7,0,.025,-22,rug);for(const x of [-1.2,1.2]){box(.85,.5,.8,x,.4,-20.1,white);box(.85,.75,.15,x,.85,-19.73,white);}
  // Seating groups occupy the new executive wing without stretching furniture.
  // Center the three-sided TV lounge along the CEO suite's left wall.
  const ceoLoungeZ=(-27-14)/2;
  sofa(-11,ceoLoungeZ-2.2,0);sofa(-11,ceoLoungeZ+2.2,Math.PI);sofa(-8.2,ceoLoungeZ,-Math.PI/2);
  box(3,.45,1.3,-11,.25,ceoLoungeZ,marbleMat);
  sofa(10,-22,0);box(2,.45,1.1,10,.25,-19.8,marbleMat);plant(10,-25);
  box(.2,4.05,5.8,-17.82,2.3,ceoLoungeZ,black);
  const ceoTVTexture=loader.load('/brand/ceo-tv-map.png',()=>{if(disposed)ceoTVTexture.dispose();});ceoTVTexture.colorSpace=THREE.SRGBColorSpace;textures.add(ceoTVTexture);
  const ceoTVMat=new THREE.MeshBasicMaterial({map:ceoTVTexture});materials.add(ceoTVMat);
  mesh(new THREE.PlaneGeometry(5.6,5.6*1138/1630),ceoTVMat,-17.70,2.3,ceoLoungeZ).rotation.y=Math.PI/2;

  // Reception feature wall and counter.
  box(3.8,3.7,.24,-2.8,1.85,-4,marbleMat);for(const x of [-5,-1.38])for(let dx=0;dx<.8;dx+=.13)box(.07,3.8,.22,x+dx,1.9,-4,wood);
  emblem(-2.8,3.0,-3.85,1.15);wordmark(-2.8,1.78,-3.85,2.6);
  box(5.8,1.15,1.35,0,.59,-1,marbleMat);box(5.9,.08,1.4,0,1.2,-1,marbleMat);box(5.8,.055,.07,0,.08,-.3,glow);
  emblem(0,.63,-.31,.82);
  // Small freestanding reception plaque on the countertop, facing the lobby.
  box(1.1,.04,.3,1.8,1.26,-.8,brass);box(1.05,.13,.055,1.8,1.345,-.8,black);sign('RECEPTION',1.8,1.345,-.767,1.05,0,.13);
  chair(0,-2.5,Math.PI,true);humanSpecialist(0,-1.45,'/models/receptionist.glb',false);
  // Symmetrical lobby seating and coffee tables.
  box(14.5,.025,9,0,.025,7,rug);
  function sofa(x:number,z:number,rot:number){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);box(3.5,.5,1.15,0,.38,0,white,g);box(3.5,.7,.2,0,.92,-.48,white,g);for(const dx of [-1.7,1.7])box(.25,.66,1.2,dx,.68,0,white,g);for(const dx of [-1.4,1.4])box(.5,.5,.18,dx,.86,-.27,mat('#8c7953'),g);box(3.4,.04,.1,0,.12,.5,brass,g);}
  sofa(-5.8,7,Math.PI/2);sofa(5.8,7,-Math.PI/2);for(const x of [-2.8,2.8])for(const z of [3.6,10.2]){box(.95,.45,1,x,.33,z,white);box(.95,.65,.17,x,.82,z+(z<7?-.45:.45),white);}
  for(const x of [-2.6,2.6]){box(1.35,.48,2.5,x,.27,7,marbleMat);box(1.35,.025,2.5,x,.055,7,glow);cylinder(.17,.3,x,.68,7,black);for(let i=0;i<6;i++)mesh(new THREE.SphereGeometry(.09,8,8),white,x+Math.sin(i)*.2,.93,7+Math.cos(i)*.2);}
  for(const x of [-6.8,6.8])for(const z of [3,11.5])plant(x,z,1.15);
  // Expanded conference suite spans the entire former conference/support wing.
  box(6.6,.02,11,-13.5,.025,7,rug);
  box(3.8,.13,7,-13.5,.85,7,marbleMat);box(1,.75,5,-13.5,.4,7,black);
  // Chairs face local -Z; aim that direction toward the table center.
  function conferenceChair(x:number,z:number){chair(x,z,Math.atan2(x+13.5,z-7));}
  for(const z of [4.5,6.2,7.8,9.5]){conferenceChair(-16, z);conferenceChair(-11,z);}
  conferenceChair(-13.5,2.8);conferenceChair(-13.5,11.2);
  cabinet(-13.5,13.4,5.8);
  // Large wall-mounted 16:9 TV, with a branded standby screen (no simulated work).
  box(.22,2.5,4.45,-17.82,2.25,7,black);
  const tvTexture=loader.load('/brand/dealdesk-dashboard.png',()=>{if(disposed)tvTexture.dispose();});tvTexture.colorSpace=THREE.SRGBColorSpace;textures.add(tvTexture);
  const tvMat=new THREE.MeshBasicMaterial({map:tvTexture});materials.add(tvMat);
  mesh(new THREE.PlaneGeometry(4.3,4.3*1738/3016),tvMat,-17.69,2.25,7).rotation.y=Math.PI/2;
  for(const x of [-17,17])for(const z of [-12,12])plant(x,z,1.1);
  // Entrance: matched double glass leaves with perimeter rails, transom and brass pulls.
  partition(-18,14.3,-1.5,14.3);partition(1.5,14.3,18,14.3);
  for(const x of [-1.5,1.5])box(.1,3.55,.12,x,1.775,14.3,black);
  box(3.1,.1,.12,0,3.5,14.3,black);box(3,.035,.14,0,.03,14.3,brass);
  box(3,.035,.1,0,2.95,14.3,black);box(2.9,.46,.035,0,3.22,14.3,glass);
  for(const side of [-1,1]){
   const center=side*.75;
   box(1.42,2.78,.035,center,1.48,14.3,glass);
   for(const x of [side*1.47,side*.035])box(.06,2.9,.075,x,1.48,14.3,black);
   for(const y of [.07,2.9])box(1.45,.065,.075,center,y,14.3,black);
   for(const z of [14.20,14.40]){
    cylinder(.025,.75,side*.22,1.45,z,brass);
    for(const y of [1.12,1.78])box(.035,.035,.12,side*.22,y,14.3+(z-14.3)/2,brass);
   }
   for(const y of [.35,1.5,2.65])cylinder(.035,.14,side*1.45,y,14.3,brass);
   box(.26,.09,.12,side*1.1,2.8,14.25,black);
  }
  const ambient=new THREE.HemisphereLight('#fff4df','#958571',2);scene.add(ambient);
  const sun=new THREE.DirectionalLight('#fff0d1',3);sun.position.set(-10,20,-8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-20;sun.shadow.normalBias=.035;scene.add(sun);
  for(const [x,z] of [[0,1],[-13,-6],[13,-6],[13,6],[0,-22],[-10,-22],[10,-22]]){const light=new THREE.PointLight('#ffe0aa',32,13,2);light.position.set(x,3.9,z);scene.add(light);}
  // Static collision footprints come from the same transformed geometry as the visible scene.
  // Thin glass partitions and fully open door leaves remain solid; doorway gaps stay clear.
  scene.updateMatrixWorld(true);
  const obstacles:WalkObstacle[]=collisionMeshes.map(o=>{
   o.geometry.computeBoundingBox();const b=o.geometry.boundingBox!,center=b.getCenter(new THREE.Vector3()).applyMatrix4(o.matrixWorld),size=b.getSize(new THREE.Vector3());
   const scale=new THREE.Vector3(),rotation=new THREE.Quaternion(),position=new THREE.Vector3();o.matrixWorld.decompose(position,rotation,scale);
   const e=o.matrixWorld.elements;return {x:center.x,z:center.z,halfWidth:size.x*Math.abs(scale.x)/2,halfDepth:size.z*Math.abs(scale.z)/2,yaw:Math.atan2(e[8],e[10])};
  });
  const poses:Record<Exclude<View,'roam'>,{p:number[],t:number[]}>={overview:{p:[0,45,30],t:[0,0,-5]},acquisitions:{p:[-9.6,3.4,-.3],t:[-13,1.1,-6]},dispositions:{p:[9.8,3.4,-.3],t:[13,1.1,-6]},operations:{p:[9.8,3.4,12.8],t:[13,1.1,6]},ceo:{p:[0,3,-15.8],t:[0,1.3,-22]},conference:{p:[-10.8,2.9,12.5],t:[-16,1.8,7]}};
  let lastView:View|null=null,transition=false,frame=0;
  const pressed=new Set<string>(); let yaw=0,pitch=0;let looking=false;
  const forward=new THREE.Vector3(), roamTarget=new THREE.Vector3();
  function clearKeys(){pressed.clear();looking=false;renderer.domElement.style.cursor='grab';}
  function handleKeyDown(e:KeyboardEvent){
   if(state.current.view!=='roam'||state.current.paused)return;
   if(e.target instanceof HTMLElement && (e.target.matches('input,textarea,select')||e.target.isContentEditable||e.target.closest('[role=dialog]')))return;
   if(e.key==='Escape'){clearKeys();state.current.onSelect('overview');return;}
   if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();pressed.add(e.key);}
  }
  function handleKeyUp(e:KeyboardEvent){pressed.delete(e.key);}
  function visibilityChange(){if(document.hidden)clearKeys();}
  window.addEventListener('keydown',handleKeyDown);window.addEventListener('keyup',handleKeyUp);window.addEventListener('blur',clearKeys);document.addEventListener('visibilitychange',visibilityChange);
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down={x:0,y:0},drag=false;
  function pointerDown(e:PointerEvent){down={x:e.clientX,y:e.clientY};drag=false;if(state.current.view==='roam'&&!state.current.paused&&e.button===0){looking=true;renderer.domElement.setPointerCapture(e.pointerId);renderer.domElement.style.cursor='grabbing';}}
  function pointerMove(e:PointerEvent){if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)drag=true;if(looking&&state.current.view==='roam'&&!state.current.paused){yaw-=(e.clientX-down.x)*.004;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-down.y)*.004,-1.1,1.1);down={x:e.clientX,y:e.clientY};}}
  function pointerUp(e:PointerEvent){looking=false;renderer.domElement.style.cursor=state.current.view==='roam'?'grab':'default';if(renderer.domElement.hasPointerCapture(e.pointerId))renderer.domElement.releasePointerCapture(e.pointerId);if(state.current.view==='roam'||drag||e.target!==renderer.domElement)return;const rect=el.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(interactives)[0];if(hit)state.current.onSelect(hit.object.userData.room);}
  renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('pointercancel',clearKeys);
  controls.addEventListener('start',()=>{transition=false;});
  const resize=new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();});resize.observe(el);
  const clock=new THREE.Clock();function animate(){const dt=Math.min(clock.getDelta(),.05);const st=state.current;if(st.view!==lastView){clearKeys();lastView=st.view;transition=st.view!=='roam';if(st.view==='roam'){camera.position.set(0,1.7,12.9);yaw=0;pitch=0;}controls.enabled=st.view!=='roam';}
   if(st.paused)clearKeys();
   if(!st.paused){avatarMixers.forEach(m=>m.update(dt));workGestures.forEach(update=>update(clock.elapsedTime));}
   city.visible=st.view!=='overview';roof.visible=st.ceiling&&st.view!=='overview';shell.visible=st.view!=='overview';renderer.shadowMap.enabled=st.quality;
   if(transition&&st.view!=='roam'){const pose=poses[st.view],p=new THREE.Vector3(...pose.p as [number,number,number]),t=new THREE.Vector3(...pose.t as [number,number,number]);camera.position.lerp(p,1-Math.exp(-dt*5));controls.target.lerp(t,1-Math.exp(-dt*5));if(camera.position.distanceTo(p)<.025)transition=false;}
   if(st.view==='roam'){
    if(!st.paused){
     const turn=(Number(pressed.has('ArrowLeft'))-Number(pressed.has('ArrowRight')))*1.65*dt; yaw+=turn;
     const distance=(Number(pressed.has('ArrowUp'))-Number(pressed.has('ArrowDown')))*3.2*dt;
     const next=moveWalker(camera.position.x,camera.position.z,-Math.sin(yaw)*distance,-Math.cos(yaw)*distance,obstacles);
     camera.position.x=next.x;camera.position.z=next.z;
    }
    forward.set(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));roamTarget.copy(camera.position).add(forward);camera.lookAt(roamTarget);
   }else controls.update();renderer.render(scene,camera);frame=requestAnimationFrame(animate);}
  animate();return()=>{disposed=true;clearKeys();window.removeEventListener('keydown',handleKeyDown);window.removeEventListener('keyup',handleKeyUp);window.removeEventListener('blur',clearKeys);document.removeEventListener('visibilitychange',visibilityChange);cancelAnimationFrame(frame);resize.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointermove',pointerMove);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('pointercancel',clearKeys);geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <div ref={host} className="scene">{failed&&<div className="graphics-error">3D graphics are unavailable. Use the room directory to review the layout.</div>}</div>;
}
