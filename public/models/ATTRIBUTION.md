# Acquisitions specialist

Source: Microsoft Rocketbox, Business_Male_01
https://github.com/microsoft/Microsoft-Rocketbox

Copyright (c) 2020 Microsoft. MIT license; see ROCKETBOX-LICENSE.md.

Seated idle animation: m_sit_table_breathe_01.max.fbx from the same repository.
Converted from FBX to GLB with Blender, textures resized to 1024 pixels and embedded as PNG, and animation retargeted and baked to the character skeleton.

This animation is a visual idle demonstration. It does not represent business task execution.

## Additional staff

Dispositions: Business_Male_02. Operations: Business_Male_03. Receptionist: Business_Female_01.
All are from the same Microsoft Rocketbox library and covered by ROCKETBOX-LICENSE.md.
The receptionist uses f_sit_table_breathe_01.max.fbx; the specialists use m_sit_table_breathe_01.max.fbx.
Converted with the same embedded-texture and seated-animation process described above.

## Authored animation packs

Animation-only GLBs in `animations/` are baked onto the same four original skeletons from Microsoft Rocketbox (same MIT license). For each male/female rig: `idle_neutral_01`, `walk_slow_01`, `sit_stand_up_chair_01`, `sit_down_chair_01`, under `Assets/Animations/all_animations_max_motextr_{static,xy,xyz}` in the original repository. No replacement meshes or materials are included. These are original library animations; individual motion-capture provenance has not been established.

## Active Mixamo employees

`mixamo/` contains the AZRE game's optimized Joe, Josh, Louise and Suzie characters and animation exports downloaded directly from Adobe Mixamo under the user's signed-in account on 2026-10-09. These replace the Rocketbox employees at runtime.

Captured clips: Breathing Idle; Walking (Male Standard Walk); Sit To Stand; Stand To Sit; Sitting Idle (Sitting With Breathing Idle); Typing (Sitting At A Computer And Typing); Sitting (Sitting Looking Side To Side). See `docs/mixamo-employees.md` and `scripts/import-mixamo-employees.py` for transformations. These assets are included for use in this application, not as a standalone character/animation distribution.

Adobe usage FAQ: https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html
Mixamo: https://www.mixamo.com/

The Draco decoder is distributed with Three.js and comes from Google's Draco project (Apache-2.0): https://github.com/google/draco/blob/main/LICENSE
