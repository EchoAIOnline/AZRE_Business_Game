"""Blender: bake original Rocketbox clips to existing employee rigs; no appearance edits.
Run: blender -b --python scripts/bake-employee-animations.py -- /tmp/azre-rocketbox
Source FBX clips are downloaded separately from microsoft/Microsoft-Rocketbox.
"""
import bpy,sys,os
root=sys.argv[sys.argv.index('--')+1]
models=[('acquisitions-specialist','Business_Male_01','m'),('dispositions-specialist','Business_Male_02','m'),('operations-specialist','Business_Male_03','m'),('receptionist','Business_Female_01','f')]
for asset,model,sex in models:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.fbx(filepath=f'{root}/Assets/Avatars/Professions/{model}/Export/{model}.fbx')
 rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
 for o in list(bpy.data.objects):
  if o!=rig:bpy.data.objects.remove(o,do_unlink=True)
 rig.animation_data_clear()
 for label,file in [('Standing','idle_neutral_01'),('Walking','walk_slow_01'),('StandUp','sit_stand_up_chair_01'),('SitDown','sit_down_chair_01')]:
  old=set(bpy.data.objects);bpy.ops.import_scene.fbx(filepath=f'{root}/{sex}_{file}.fbx')
  imported=[o for o in bpy.data.objects if o not in old];source=next(o for o in imported if o.type=='ARMATURE')
  start,end=map(int,source.animation_data.action.frame_range)
  for bone in rig.pose.bones:
   if source.pose.bones.get(bone.name):
    c=bone.constraints.new('COPY_TRANSFORMS');c.target=source;c.subtarget=bone.name;c.target_space='WORLD';c.owner_space='WORLD'
  bpy.context.view_layer.objects.active=rig;bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
  bpy.ops.nla.bake(frame_start=start,frame_end=end,step=1,only_selected=False,visual_keying=True,clear_constraints=True,use_current_action=False,bake_types={'POSE'})
  action=rig.animation_data.action;action.name=label;action.use_fake_user=True
  for o in imported:bpy.data.objects.remove(o,do_unlink=True)
  bpy.context.scene.frame_start=start;bpy.context.scene.frame_end=end;bpy.context.scene.frame_set(start)
  bpy.ops.export_scene.gltf(filepath=f'public/models/animations/{asset}-{label}.glb',export_format='GLB',export_animations=True,export_animation_mode='ACTIVE_ACTIONS',export_force_sampling=True,export_frame_range=True)
  rig.animation_data.action=None
