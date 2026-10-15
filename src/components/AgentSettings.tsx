import {operationsEmployee,acquisitionsEmployee,operationsCommandUrl} from '../utils/workforceDirectory';
import {loadEmployeeClips} from '../utils/employeeClips';
import {employeeBoneKey,inspectEmployeeRig} from '../utils/employeeRig';
import {employeeStates,type EmployeeState} from '../utils/employeeBehavior';
import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {loadEmployeeAsset} from '../utils/employeeAssets';
export type AgentId='acquisitions'|'dispositions'|'operations'|'receptionist';
const agents:Record<AgentId,{name:string;role:string;model:string}>={acquisitions:{name:acquisitionsEmployee.name,role:acquisitionsEmployee.position,model:'acquisitions-specialist'},dispositions:{name:'Elena Rostova',role:'Dispositions Specialist',model:'dispositions-specialist'},operations:{name:operationsEmployee.name,role:operationsEmployee.position,model:'operations-specialist'},receptionist:{name:'Receptionist',role:'Office Receptionist',model:'receptionist'}};
const providers:Record<string,string[]>={OpenAI:['gpt-4.1','gpt-4.1-mini'],Anthropic:['claude-sonnet-4-6','claude-haiku-4-5'],Google:['gemini-2.5-pro','gemini-2.5-flash']};
type Settings={name:string;role:string;instructions:string;provider:string;model:string};
function initial(id:AgentId):Settings{const fallback={name:agents[id].name,role:agents[id].role,instructions:'',provider:'',model:''};try{const saved=JSON.parse(localStorage.getItem(`azre-agent-${id}`)||'null');return saved?{...fallback,...Object.fromEntries(Object.entries(saved).filter(([k,v])=>k in fallback&&typeof v==='string')),...(['operations','acquisitions'].includes(id)?{name:id==='operations'?operationsEmployee.name:acquisitionsEmployee.name,role:id==='operations'?operationsEmployee.position:acquisitionsEmployee.position}:{})}:fallback;}catch{return fallback;}}
function AvatarPreview({id}:{id:AgentId}){
 const host=useRef<HTMLDivElement>(null);const [error,setError]=useState('');
 useEffect(()=>{if(!host.current)return;const el=host.current;let alive=true,model:THREE.Object3D|undefined;let renderer:THREE.WebGLRenderer;try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});}catch{setError('Avatar preview unavailable.');return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;el.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.01,100);scene.add(new THREE.HemisphereLight('#e9eff7','#252c39',1.35));
 const light=new THREE.DirectionalLight('#fff1df',3);light.position.set(-3,4,5);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-3;light.shadow.camera.right=3;light.shadow.camera.top=3;light.shadow.camera.bottom=-3;light.shadow.normalBias=.025;light.shadow.bias=-.0001;light.shadow.radius=4;scene.add(light);
 const fill=new THREE.DirectionalLight('#dce8ff',.8);fill.position.set(4,1,3);scene.add(fill);
 const rim=new THREE.DirectionalLight('#e2ecff',1.6);rim.position.set(2,3,-3);scene.add(rim);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(8,8),new THREE.ShadowMaterial({opacity:.22}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;floor.visible=false;scene.add(floor);
 const dispose=(o:THREE.Object3D)=>o.traverse(n=>{if(n instanceof THREE.Mesh){if(!n.geometry.userData.sharedEmployeeAsset)n.geometry.dispose();(Array.isArray(n.material)?n.material:[n.material]).forEach(m=>{Object.values(m).forEach(t=>{if(t instanceof THREE.Texture&&!t.userData.sharedEmployeeAsset)t.dispose();});m.dispose();});}});
 const resize=()=>{if(!el.clientWidth||!el.clientHeight)return;renderer.setSize(el.clientWidth,el.clientHeight);camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();if(model){const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());const distance=Math.max(size.y,size.x/camera.aspect)/(2*Math.tan(THREE.MathUtils.degToRad(17.5)))*1.22;camera.position.set(center.x,center.y,center.z+distance);camera.lookAt(center);}renderer.render(scene,camera);};
 const observer=new ResizeObserver(resize);observer.observe(el);
 const bones=new Map<string,THREE.Bone>(),rest=new Map<string,THREE.Quaternion>();
 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 let previewMixer:THREE.AnimationMixer|undefined;const previewClock=new THREE.Clock();
 let frame=0;const started=performance.now();
 function animate(){if(!alive)return;frame=requestAnimationFrame(animate);if(!model||!el.clientWidth||!el.clientHeight)return;
  const t=(performance.now()-started)/1000;
  if(previewMixer){previewMixer.update(reducedMotion.matches||document.hidden?0:Math.min(.05,previewClock.getDelta()));model.updateMatrixWorld(true);renderer.render(scene,camera);return;}
  for(const [name,q] of rest)bones.get(name)!.quaternion.copy(q);
  if(!reducedMotion.matches&&!document.hidden){
   const breathe=Math.sin(t*1.2)*.7+Math.sin(t*1.93)*.12;
   const spine=bones.get('bip01spine1')||bones.get('bip01spine');if(spine)spine.rotateX(breathe*.005);
   const head=bones.get('bip01head');if(head){head.rotateY(Math.sin(t*.43)*.018);head.rotateX(Math.sin(t*.71)*.008);}
   for(const side of ['l','r']){const arm=bones.get('bip01'+side+'upperarm');if(arm)arm.rotateZ(breathe*.002);}
  }
  model.updateMatrixWorld(true);renderer.render(scene,camera);
 }
 animate();
 void loadEmployeeAsset(`/models/${agents[id].model}.glb`).then(async g=>{if(!alive){dispose(g.scene);return;}model=g.scene;
 model.updateMatrixWorld(true);
 model.traverse(n=>{if(n instanceof THREE.Bone)bones.set(employeeBoneKey(n.name),n);});
 const mixamo=inspectEmployeeRig(model).convention==='mixamo';
 if(mixamo){const clips=await loadEmployeeClips(model,`/models/${agents[id].model}.glb`,g.animations);if(!alive){dispose(model);return;}previewMixer=new THREE.AnimationMixer(model);previewMixer.clipAction(clips.standing).play();previewMixer.update(0);}
 if(!mixamo){
 // Aim in world space so mirrored skeletons share the same relaxed silhouette.
 function aim(bone:THREE.Bone,child:THREE.Bone,direction:THREE.Vector3){
  model!.updateMatrixWorld(true);
  const current=child.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).normalize();
  const world=bone.getWorldQuaternion(new THREE.Quaternion()).premultiply(new THREE.Quaternion().setFromUnitVectors(current,direction.normalize()));
  bone.quaternion.copy(bone.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world));
 }
 for(const side of ['l','r']){
  const upper=bones.get('bip01'+side+'upperarm'),fore=bones.get('bip01'+side+'forearm'),hand=bones.get('bip01'+side+'hand');
  if(upper&&fore&&hand){
   const sign=Math.sign(fore.getWorldPosition(new THREE.Vector3()).x-upper.getWorldPosition(new THREE.Vector3()).x)||1;
   const bent=side==='r';
   aim(upper,fore,new THREE.Vector3(sign*(bent?.16:.1),-1,bent?-.16:-.07));
   aim(fore,hand,new THREE.Vector3(sign*(bent?.1:.025),-1,bent?.85:.52));
   // Hands hang inward beside the trouser seams rather than pointing outward.
   const middle=bones.get('bip01'+side+'finger2');
   if(middle)aim(hand,middle,new THREE.Vector3(-sign*.08,-1,.1));
   for(let finger=0;finger<5;finger++){
    const root=bones.get('bip01'+side+'finger'+finger),next=bones.get('bip01'+side+'finger'+finger+'1'),tip=bones.get('bip01'+side+'finger'+finger+'2');
    if(root&&next&&tip&&finger>0){
     const direction=next.getWorldPosition(new THREE.Vector3()).sub(root.getWorldPosition(new THREE.Vector3())).normalize();
     aim(next,tip,direction.add(new THREE.Vector3(0,0,.22)));
    }
   }
  }
 }
 // A small stagger in the feet creates a poised, asymmetric standing stance.
 for(const side of ['l','r']){
  const thigh=bones.get('bip01'+side+'thigh'),calf=bones.get('bip01'+side+'calf'),foot=bones.get('bip01'+side+'foot');
  if(thigh&&calf&&foot){
   model.updateMatrixWorld(true);const flat=foot.getWorldQuaternion(new THREE.Quaternion());
   const forward=side==='l';
   aim(thigh,calf,new THREE.Vector3(forward?-.025:.025,-1,forward?.12:-.08));
   aim(calf,foot,new THREE.Vector3(0,-1,forward?.06:-.14));
   model.updateMatrixWorld(true);foot.quaternion.copy(foot.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(flat));
  }
 }
 // A quiet three-quarter presentation with the gaze offset from the torso.
 const neck=bones.get('bip01neck'),head=bones.get('bip01head');
 if(neck)neck.rotateY(.08);if(head)head.rotateY(.12);
 }
 model.rotation.y=-.18;
 model.traverse(n=>{if(n instanceof THREE.Mesh){n.castShadow=true;n.receiveShadow=true;
  for(const material of (Array.isArray(n.material)?n.material:[n.material])){
   if(!mixamo&&material instanceof THREE.MeshStandardMaterial&&/body/i.test(material.name)&&id!=='receptionist'){
    material.color.setRGB(.94,.95,.98);material.roughness=.82;material.metalness=0;
   }
  }
 }});
 model.updateMatrixWorld(true);
 for(const [name,bone] of bones)rest.set(name,bone.quaternion.clone());
 model.traverse(n=>{if(n instanceof THREE.SkinnedMesh){n.skeleton.update();n.computeBoundingBox();n.computeBoundingSphere();}});
 const originalBounds=new THREE.Box3().setFromObject(model),originalSize=originalBounds.getSize(new THREE.Vector3());
 const extent=Math.max(originalSize.x,originalSize.y,originalSize.z);
 if(!Number.isFinite(extent)||extent<=0){dispose(model);model=undefined;setError('Avatar geometry could not be framed.');return;}
 model.scale.multiplyScalar(2.8/extent);model.updateMatrixWorld(true);
 const fittedBounds=new THREE.Box3().setFromObject(model),center=fittedBounds.getCenter(new THREE.Vector3());
 model.position.sub(center);model.updateMatrixWorld(true);
 scene.add(model);
 const grounded=new THREE.Box3().setFromObject(model);floor.position.y=grounded.min.y-.012;floor.visible=true;
 resize();}).catch(()=>{if(alive)setError('Could not load avatar preview.');});resize();
 return()=>{alive=false;cancelAnimationFrame(frame);if(previewMixer&&model){previewMixer.stopAllAction();previewMixer.uncacheRoot(model);}observer.disconnect();if(model)dispose(model);dispose(floor);renderer.dispose();renderer.domElement.remove();};},[id]);
 return <div className="agent-avatar" ref={host} aria-label={`Full body preview of ${agents[id].name}`}>{error&&<p role="alert">{error}</p>}</div>;
}
export function AgentSettings({id,onClose,secrets,onSecret,previewState,onPreview}:{id:AgentId;onClose:()=>void;secrets:Partial<Record<AgentId,string>>;onSecret:(id:AgentId,value:string)=>void;previewState?:EmployeeState;onPreview?:(id:AgentId,state:EmployeeState|undefined)=>void}){
 const [settings,setSettings]=useState(()=>initial(id)),[key,setKey]=useState(secrets[id]||''),[message,setMessage]=useState('');
 const update=(field:keyof Settings,value:string)=>{setSettings(s=>({...s,[field]:value}));setMessage('');};
 return <><header className="agent-heading"><div><span className="eyebrow">AZRE / AGENT CONFIGURATION</span><h2>Your specialist, configured.</h2></div><button onClick={onClose} aria-label="Close agent settings">×</button></header><div className="agent-layout"><aside className="agent-portrait"><span className="agent-status">● VISUAL SETUP</span><AvatarPreview id={id}/><div><h3>{settings.name||agents[id].name}</h3><p>{settings.role}</p></div></aside><form className="agent-form" onSubmit={e=>{e.preventDefault();try{localStorage.setItem(`azre-agent-${id}`,JSON.stringify(settings));onSecret(id,key);setMessage(id==='operations'?'Visual settings saved. Ryan’s live execution is managed in the operations command center.':'Settings saved. AI execution is not connected yet.');}catch{setMessage('Could not save settings in this browser.');}}}>{id==='operations'&&<div><a href={operationsCommandUrl()} target="_blank" rel="noopener noreferrer">Open Ryan’s operations command center ↗</a><p className="agent-key-note">Ryan’s live identity, tools and permissions come from the workforce registry. Settings below affect this visual preview; they do not configure his live provider.</p></div>}<span className="eyebrow">IDENTITY & BEHAVIOR</span><label>Agent name<input required readOnly={['operations','acquisitions'].includes(id)} maxLength={120} value={settings.name} onChange={e=>update('name',e.target.value)}/></label><label>Role<input required readOnly={['operations','acquisitions'].includes(id)} maxLength={160} value={settings.role} onChange={e=>update('role',e.target.value)}/></label><label>Custom instructions<textarea rows={5} maxLength={12000} placeholder="Define responsibilities, tone, and approval requirements…" value={settings.instructions} onChange={e=>update('instructions',e.target.value)}/></label><div className="agent-provider-row"><label>AI company<select value={settings.provider} onChange={e=>{setSettings(s=>({...s,provider:e.target.value,model:''}));setKey('');setMessage('');}}><option value="">Select a company</option>{Object.keys(providers).map(p=><option key={p}>{p}</option>)}</select></label><label>AI model<select disabled={!settings.provider} value={settings.model} onChange={e=>update('model',e.target.value)}><option value="">Select a model</option>{(providers[settings.provider]||[]).map(m=><option key={m}>{m}</option>)}</select></label></div><label>API key <span className="agent-optional">Optional · connect later</span><input type="password" autoComplete="off" spellCheck={false} disabled={!settings.provider} value={key} onChange={e=>{setKey(e.target.value);setMessage('');}} placeholder="Enter a provider API key"/></label><p className="agent-key-note">Masked and kept only in memory for this session. Keys are not saved to browser storage or sent to a provider. Secure server storage will be added with the AI connection.</p><label>Visual behavior preview<select value={previewState||'AMBIENT'} onChange={e=>onPreview?.(id,e.target.value==='AMBIENT'?undefined:e.target.value as EmployeeState)}><option value="AMBIENT">Automatic ambient behavior</option>{employeeStates.map(state=><option key={state} value={state}>{state.replaceAll('_',' ')}</option>)}</select></label><p className="agent-key-note">Preview applies when this modal closes. These are visual states; they do not execute tasks or change DealDesk records.</p><div className="agent-actions"><p role="status">{message||'Settings apply to this agent and save in this browser.'}</p><button type="submit">Save agent settings</button></div></form></div></>;
}
