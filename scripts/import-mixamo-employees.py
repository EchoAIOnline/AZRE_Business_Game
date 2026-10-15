"""Convert user-downloaded Mixamo FBXs into AZRE GLBs. Blender 5.x.
blender -b --python scripts/import-mixamo-employees.py -- /tmp/azre-mixamo
Input: Josh/Joe/Louise/Suzie.fbx and Standing/Walking/StandUp/SitDown/Seated/Typing/LookAround.fbx.
No new rigging or mesh replacement is performed; rest-frame rotation correction preserves joint lengths.
"""
import bpy,os,sys,json
from mathutils import Matrix,Vector
root=sys.argv[sys.argv.index('--')+1];library='--library' in sys.argv
out='public/models/mixamo'+('/library' if library else '');os.makedirs(out,exist_ok=True)
sources={'DeskIdle':'Seated Idle With Hands On A Table.fbx','SitToType':'Sit To Type (Sitting To Typing).fbx','TypeToSit':'Type To Sit.fbx','Mouse':'Typing With Mouse Move.fbx','WalkCandidate':'Walking (preferred 2 male).fbx'} if library else {name:name+'.fbx' for name in ['Standing','Walking','StandUp','SitDown','Seated','Typing','LookAround']}
sourceRoot='/Users/asharizakar/Downloads/Avatar Animations' if library else root
reports={}
for asset,person in [('acquisitions-specialist','Josh'),('dispositions-specialist','Louise'),('operations-specialist','Joe'),('receptionist','Suzie')]:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.fbx(filepath=f'{root}/{person}.fbx')
 originals=set(bpy.data.objects);rig=next(o for o in originals if o.type=='ARMATURE');rig.animation_data_clear()
 target={b.name.split(':')[-1]:b for b in rig.pose.bones}
 for img in bpy.data.images:
  if img.size[0]>1024 or img.size[1]>1024:
   ratio=1024/max(img.size);img.scale(int(img.size[0]*ratio),int(img.size[1]*ratio))
 for label,filename in sources.items():
  for b in rig.pose.bones:b.matrix_basis.identity()
  bpy.ops.import_scene.fbx(filepath=f'{sourceRoot}/{filename}');added=[o for o in bpy.data.objects if o not in originals];src=next(o for o in added if o.type=='ARMATURE' and len(o.data.bones)==len(target) and o.animation_data and o.animation_data.action);source={b.name.split(':')[-1]:b for b in src.pose.bones}
  assert set(source)==set(target),'Skeleton bone set mismatch'
  assert all((b.parent.name.split(':')[-1] if b.parent else None)==(source[n].parent.name.split(':')[-1] if source[n].parent else None) for n,b in target.items()),'Skeleton hierarchy mismatch'
  ratio=target['Hips'].bone.head_local.length/source['Hips'].bone.head_local.length
  start,end=map(int,src.animation_data.action.frame_range);rig.animation_data_create();action=bpy.data.actions.new(label);rig.animation_data.action=action
  first=None;last=None;previous_rotations={}
  audit=[]
  for frame in range(start,end+1):
   bpy.context.scene.frame_set(frame)
   # Evaluate the source once, then compute the complete target pose in a
   # separate matrix map. Reading a target parent's evaluated pose while writing
   # its child's pose mixes current and stale dependency-graph evaluations.
   desired={}
   for n,b in target.items():
    sourceBone=source[n]
    rotation=sourceBone.matrix.to_quaternion() @ sourceBone.bone.matrix_local.to_quaternion().inverted() @ b.bone.matrix_local.to_quaternion()
    if b.parent:position=desired[b.parent.name.split(':')[-1]] @ b.parent.bone.matrix_local.inverted() @ b.bone.head_local
    else:position=b.bone.head_local+(sourceBone.matrix.translation-sourceBone.bone.head_local)*ratio
    desired[n]=Matrix.LocRotScale(position,rotation,Vector((1,1,1)))
   for n,b in target.items():
    kwargs={'parent_matrix':desired[b.parent.name.split(':')[-1]],'parent_matrix_local':b.parent.bone.matrix_local} if b.parent else {}
    basis=b.bone.convert_local_to_pose(desired[n],b.bone.matrix_local,invert=True,**kwargs)
    position,rotation,scale=basis.decompose();rotation.normalize()
    if n in previous_rotations and rotation.dot(previous_rotations[n])<0:rotation.negate()
    previous_rotations[n]=rotation.copy()
    b.rotation_mode='QUATERNION';b.location=position;b.rotation_quaternion=rotation;b.scale=scale
    b.keyframe_insert('rotation_quaternion',frame=frame-start);b.keyframe_insert('location',frame=frame-start)
   if label=='Typing' or library:
    audit.append({'time':(frame-start)/bpy.context.scene.render.fps,'bones':{n:{'position':list(rig.matrix_world @ m.translation),'quaternion':list((rig.matrix_world @ m).to_quaternion())} for n,m in desired.items()}})
   if label in ['Walking','WalkCandidate']:
    point=rig.matrix_world @ desired['Hips'].translation
    if first is None:first=point.copy()
    last=point.copy()
  if label in ['Walking','WalkCandidate']:reports[asset]={'source':person,'walkSpeed':(last-first).length/((end-start)/bpy.context.scene.render.fps),'jointCount':len(target)}
  if label=='Typing' or library:json.dump(audit,open(f'{root}/{asset}-{label}-audit.json','w'))
  for o in added:bpy.data.objects.remove(o,do_unlink=True)
  bpy.context.scene.frame_start=0;bpy.context.scene.frame_end=end-start;bpy.context.scene.frame_set(0)
  for o in originals:o.hide_render=o!=rig
  bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
  bpy.ops.export_scene.gltf(filepath=f'{out}/{asset}-{label}.glb',use_selection=True,export_format='GLB',export_animations=True,export_animation_mode='ACTIVE_ACTIONS',export_force_sampling=True,export_frame_range=True,export_extras=True)
  rig.animation_data.action=None
 if library:continue
 for b in rig.pose.bones:b.matrix_basis.identity()
 for o in originals:o.hide_render=False;o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=f'{out}/{asset}.glb',use_selection=True,export_format='GLB',export_animations=False,export_extras=True,export_image_format='WEBP',export_image_quality=85,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6)
json.dump(reports,open(f'{out}/manifest.json','w'),indent=2)
