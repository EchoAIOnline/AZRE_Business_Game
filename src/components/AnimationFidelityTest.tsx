import {libraryClipDefinitions,type LibraryClipName} from '../utils/animationLibrary';
import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {loadEmployeeAsset} from '../utils/employeeAssets';
import {employeeBoneKey,validateEmployeeClip} from '../utils/employeeRig';
const staff={Josh:'acquisitions-specialist',Joe:'operations-specialist',Louise:'dispositions-specialist',Suzie:'receptionist'} as const;
// Deliberately independent of the office controller, clip preparer, IK and schedules.
export function AnimationFidelityTest(){
 const host=useRef<HTMLDivElement>(null),[person,setPerson]=useState<keyof typeof staff>('Suzie'),[clipName,setClipName]=useState('Typing'),[source,setSource]=useState('glb'),[status,setStatus]=useState('Loading'),[playing,setPlaying]=useState(true);
 const replay=useRef<()=>void>(()=>{});const running=useRef(true);running.current=playing;
 useEffect(()=>{if(!host.current)return;let alive=true,frame=0,model:THREE.Object3D|undefined,mixer:THREE.AnimationMixer|undefined;
  const mount=host.current,renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(mount.clientWidth,mount.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;mount.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#b6b8bb');const camera=new THREE.PerspectiveCamera(40,mount.clientWidth/mount.clientHeight,.01,100);camera.position.set(2,1.5,3);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.85,0);controls.enableDamping=true;
  scene.add(new THREE.HemisphereLight(0xffffff,0x52565b,2));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(3,4,4);scene.add(light);const grid=new THREE.GridHelper(8,32);scene.add(grid);
  const disposeModel=(object:THREE.Object3D)=>object.traverse(n=>{if(n instanceof THREE.Mesh){if(!n.geometry.userData.sharedEmployeeAsset)n.geometry.dispose();(Array.isArray(n.material)?n.material:[n.material]).forEach(m=>{Object.values(m).forEach(value=>{if(value instanceof THREE.Texture&&!value.userData.sharedEmployeeAsset)value.dispose();});m.dispose();});}});
  const clock=new THREE.Clock();let total=0,frames=0;const render=()=>{const dt=Math.min(clock.getDelta(),.05);if(running.current&&!document.hidden)mixer?.update(dt);controls.update();renderer.render(scene,camera);total+=dt;frames++;if(total>1&&mixer){mount.dataset.time=mixer.time.toFixed(3);mount.dataset.fps=String(Math.round(frames/total));total=0;frames=0;}frame=requestAnimationFrame(render);};render();
  const resize=new ResizeObserver(()=>{renderer.setSize(mount.clientWidth,mount.clientHeight);camera.aspect=mount.clientWidth/mount.clientHeight;camera.updateProjectionMatrix();});resize.observe(mount);
  setStatus('Loading selected original capture…');
  void(async()=>{let clip:THREE.AnimationClip;
   if(source==='fbx'){
    const [character,capture]=await Promise.all([new FBXLoader().loadAsync(`/__animation-source/${person}.fbx`),new FBXLoader().loadAsync(clipName==='Typing'?'/__animation-source/Typing.fbx':`/__animation-library/${clipName}.fbx`)]);model=character;model.scale.setScalar(.01);clip=capture.animations[0].clone();
    const names=new Map<string,string>();model.traverse(n=>{if(n instanceof THREE.Bone)names.set(employeeBoneKey(n.name),n.name);});
    for(const track of clip.tracks){const dot=track.name.lastIndexOf('.'),bone=names.get(employeeBoneKey(track.name.slice(0,dot)));if(!bone)throw new Error(`Missing source binding: ${track.name}`);track.name=bone+track.name.slice(dot);}
   }else{
    const [character,capture]=await Promise.all([loadEmployeeAsset(`/models/${staff[person]}.glb`),new GLTFLoader().loadAsync(`/models/mixamo/${clipName==='Typing'?'':'library/'}${staff[person]}-${clipName}.glb`)]);model=character.scene;clip=capture.animations[0].clone();
   }
   if(!alive){disposeModel(model);return;}validateEmployeeClip(model,clip);model.traverse(n=>{if(n instanceof THREE.SkinnedMesh)n.frustumCulled=false;});scene.add(model);
   mixer=new THREE.AnimationMixer(model);const action=mixer.clipAction(clip);if(clipName==='SitToType'||clipName==='TypeToSit'){action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;}replay.current=()=>{action.reset().play();};action.setEffectiveTimeScale(1);action.setEffectiveWeight(1);action.play();mixer.update(0);
   model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model);controls.target.copy(bounds.getCenter(new THREE.Vector3()));camera.position.copy(controls.target).add(new THREE.Vector3(1.7,1,2.7));controls.update();
   setStatus(`${person} · ${source.toUpperCase()} · ${clipName} · ${clip.duration.toFixed(6)} seconds · 1× · one mixer / one action · no corrections`);
  })().catch(error=>{if(alive)setStatus(String(error));});
  return()=>{alive=false;cancelAnimationFrame(frame);resize.disconnect();controls.dispose();mixer?.stopAllAction();if(mixer&&model)mixer.uncacheRoot(model);if(model)disposeModel(model);grid.geometry.dispose();(grid.material as THREE.Material).dispose();renderer.dispose();renderer.domElement.remove();};
 },[person,source,clipName]);
 return <main style={{height:'100vh',display:'flex',flexDirection:'column',background:'#0b1220',color:'#fff'}}><header style={{padding:16,display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}><strong>Mixamo animation fidelity test</strong><label>Employee <select value={person} onChange={e=>setPerson(e.target.value as keyof typeof staff)}>{Object.keys(staff).map(n=><option key={n}>{n}</option>)}</select></label><label>Clip <select value={clipName} onChange={e=>setClipName(e.target.value)}><option value="Typing">Original typing baseline</option>{Object.entries(libraryClipDefinitions).map(([name,definition])=><option key={name} value={name}>{definition.purpose}</option>)}</select></label><label>Source <select value={source} onChange={e=>setSource(e.target.value)}><option value="glb">Converted GLB — original clip</option><option value="fbx">Original FBX download</option></select></label><button onClick={()=>setPlaying(p=>!p)}>{playing?'Pause':'Play'}</button><button onClick={()=>replay.current()}>Replay</button><a href="/">Return to office</a></header><p role="status" style={{padding:'0 16px'}}>{status}</p><div ref={host} data-testid="animation-fidelity-canvas" style={{flex:1,minHeight:0}}/></main>;
}
