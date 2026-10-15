# AZRE curated animation library

77 FBXs inspected. All contain the same normalized 65-joint hierarchy; 16 are static poses or character-only files. Extra scene bone proxies were deduplicated when inspecting the animated rig. Hierarchy compatibility is not proof of matching rest frames or usable movement: only the selected captures receive target-specific conversion and fidelity tests.

## Active sequence

Seated Idle With Hands On A Table → Sit To Type → authored typing/mouse capture → Type To Sit → hands-on-table review. Independent schedules use complete captures and 0.45-second normalized fades. Acquisitions sometimes repeats the work capture; Operations has longer review pauses. Navigation waits for the seated exit and fade to finish before standing. Reception remains seated/idle with occasional bounded walks because its existing counter has no keyboard. All four character bindings were validated, including the reception model in the isolated test.

Selected: Seated Idle With Hands On A Table (4.167 s), Sit To Type (1.2 s), Type To Sit (0.933 s), Typing With Mouse Move (16.467 s), Walking (preferred 2 male) (1.233 s). The walking candidate was reviewed in isolation; its root-motion stride is calibrated separately per employee, and horizontal movement remains owned by collision-aware navigation. The hands-on-table capture replaces Sitting Idle for the default rest pose. Existing chair transition captures remain. Lewis Typing stays the reference baseline; its motion is effectively the same typing/mouse capture, so it is not alternated as a fictitious separate activity.

The hands-on-table idle is active at the user's request. Its captured hand motion is preserved without procedural corrections or furniture changes. Catwalk/stylized walking and emphatic gestures are not activated. Other clips are deferred, not declared incompatible by their names.

## Stability safeguards

One mixer per employee; captured local tracks remain unchanged for desk clips. No hand, finger, posture, head or foot IK corrections in the new sequence. One-shot entry/exit actions clamp at their authored endpoints. Blend weights sum to one, including the frame when sitting finishes, preventing a transient bind-pose reset. Walking uses target-specific rest frames and calibrated root motion.

Independent Three.js FBX samples verify conversion at 60 Hz, including quaternion interpolation, for all five candidates on all four models. A ten-minute actual mixer simulation per model exercises full desk/chair/walking cycles and checks complete blend weights, finite poses and core-joint continuity; maximum observed frame step was 0.270 rad, including chair transitions and walking, compared with the previous conversion defect near pi radians. A twenty-minute scheduler test verifies safe departure, non-synchronized phases and completed authored transitions. Build and browser runtime results are recorded below after final review.

## File-by-file inventory

| File | Activity | Duration | Decision |
|---|---|---:|---|
| Agreeing.fbx | communication | 4.700s | Deferred: no visual approval for ambient use; not imported automatically |
| Annoyed Head Shake.fbx | communication | 2.567s | Deferred: no visual approval for ambient use; not imported automatically |
| Breathing Idle.fbx | idle / posture | 9.933s | Deferred: no visual approval for ambient use; not imported automatically |
| Catwalk Idle To Walk Forward (male).fbx | locomotion | 1.333s | Deferred: runway/stylized locomotion is unnecessary for this stability-focused upgrade |
| Catwalk Idle Twist R.fbx | locomotion | 3.333s | Deferred: runway/stylized locomotion is unnecessary for this stability-focused upgrade |
| Catwalk Twist R To Walk 180 (male).fbx | locomotion | 2.700s | Deferred: runway/stylized locomotion is unnecessary for this stability-focused upgrade |
| Catwalk Walk Forward 01 (preferred).fbx | locomotion | 1.233s | Deferred: runway/stylized locomotion is unnecessary for this stability-focused upgrade |
| Catwalk Walk Forward Arc 90L.fbx | locomotion | 2.367s | Deferred: runway/stylized locomotion is unnecessary for this stability-focused upgrade |
| Catwalk Walk Forward Arc 90R.fbx | locomotion | 2.400s | Deferred: runway/stylized locomotion is unnecessary for this stability-focused upgrade |
| Catwalk Walk Stop.fbx | locomotion | 1.667s | Deferred: runway/stylized locomotion is unnecessary for this stability-focused upgrade |
| Ch07_nonPBR.fbx | static / character | 0.033s | Excluded from motion playback: static pose or character-only file |
| Ch23_nonPBR.fbx | static / character | 0.033s | Excluded from motion playback: static pose or character-only file |
| Ch33_nonPBR.fbx | static / character | 0.033s | Excluded from motion playback: static pose or character-only file |
| Ch41_nonPBR.fbx | static / character | 0.033s | Excluded from motion playback: static pose or character-only file |
| Female Sitting Pose (Arms Raised).fbx | static / character | 0.033s | Excluded from motion playback: static pose or character-only file |
| Female Sitting Pose.fbx | static / character | 0.033s | Excluded from motion playback: static pose or character-only file |
| Female Standing Pose.fbx | static / character | 0.033s | Excluded from motion playback: static pose or character-only file |
| Having A Meeting with Another, Male.fbx | communication | 46.667s | Deferred: no visual approval for ambient use; not imported automatically |
| Leaning on Desk.fbx | idle / posture | 3.333s | Deferred: no visual approval for ambient use; not imported automatically |
| Lewis Typing.fbx | desk work | 16.467s | Existing tested role retained; new file inspected, no redundant runtime asset added |
| Male Sitting Pose (1).fbx | static / character | 0.033s | Excluded from motion playback: static pose or character-only file |
| Male Sitting Pose (2).fbx | static / character | 0.033s | Excluded from motion playback: static pose or character-only file |
| Male Sitting Pose (3).fbx | static / character | 0.033s | Excluded from motion playback: static pose or character-only file |
| Male Sitting Pose (4).fbx | static / character | 0.033s | Excluded from motion playback: static pose or character-only file |
| Male Sitting Pose (5).fbx | static / character | 0.033s | Excluded from motion playback: static pose or character-only file |
| Male Sitting Pose (for couch chair).fbx | static / character | 0.033s | Excluded from motion playback: static pose or character-only file |
| Male Sitting Pose.fbx | static / character | 0.033s | Excluded from motion playback: static pose or character-only file |
| Male Standing Pose (1).fbx | static / character | 0.033s | Excluded from motion playback: static pose or character-only file |
| Male Standing Pose.fbx | static / character | 0.033s | Excluded from motion playback: static pose or character-only file |
| Male Talking On Cell Phone while Pacing.fbx | locomotion | 42.233s | Deferred: no visual approval for ambient use; not imported automatically |
| Neutral Idle.fbx | idle / posture | 8.767s | Deferred: no visual approval for ambient use; not imported automatically |
| Pacing And Talking On A Phone (female).fbx | locomotion | 37.633s | Deferred: no visual approval for ambient use; not imported automatically |
| Seated Idle With Hands On A Table.fbx | desk work | 4.167s | Selected as default seated idle at user request; source motion retained |
| Sit To Stand.fbx | chair transition | 2.267s | Existing tested role retained; new file inspected, no redundant runtime asset added |
| Sit To Type (Sitting To Typing).fbx | desk work | 1.200s | Selected and converted; independent FBX fidelity validated for all four characters |
| Sitting (Sit With Fidgeting Feet).fbx | idle / posture | 1.167s | Deferred: no visual approval for ambient use; not imported automatically |
| Sitting (preferred).fbx | idle / posture | 7.000s | Deferred: no visual approval for ambient use; not imported automatically |
| Sitting Banging Fist.fbx | celebration / emphatic gesture | 2.633s | Excluded from ambient work: exaggerated or task-specific gesture |
| Sitting Clap (female).fbx | celebration / emphatic gesture | 5.667s | Excluded from ambient work: exaggerated or task-specific gesture |
| Sitting Idle.fbx | idle / posture | 4.300s | Existing tested role retained; new file inspected, no redundant runtime asset added |
| Sitting Looking At Documents On Desk Finger Dice Idle.fbx | desk work | 4.800s | Deferred: no visual approval for ambient use; not imported automatically |
| Sitting On Toilet (not preferred).fbx | idle / posture | 4.000s | Deferred: no visual approval for ambient use; not imported automatically |
| Sitting Rubbing Arm.fbx | idle / posture | 7.967s | Deferred: no visual approval for ambient use; not imported automatically |
| Sitting Talking with Another Person.fbx | communication | 44.967s | Deferred: no visual approval for ambient use; not imported automatically |
| Sitting Talking with Someone Else (directly across).fbx | communication | 5.000s | Deferred: no visual approval for ambient use; not imported automatically |
| Sitting Thumbs Up.fbx | celebration / emphatic gesture | 3.833s | Excluded from ambient work: exaggerated or task-specific gesture |
| Sitting With Hands On Lap.fbx | idle / posture | 7.000s | Excluded duplicate: Sitting (preferred).fbx |
| Sitting at Desk Getting A Victory.fbx | celebration / emphatic gesture | 5.600s | Excluded from ambient work: exaggerated or task-specific gesture |
| Stand To Sit.fbx | chair transition | 2.233s | Existing tested role retained; new file inspected, no redundant runtime asset added |
| Standard Standing Idle.fbx | idle / posture | 3.000s | Deferred: no visual approval for ambient use; not imported automatically |
| Standing Acknowledging.fbx | communication | 1.933s | Deferred: no visual approval for ambient use; not imported automatically |
| Standing Arm Stretching.fbx | idle / posture | 8.867s | Deferred: no visual approval for ambient use; not imported automatically |
| Standing Bored.fbx | idle / posture | 10.667s | Deferred: no visual approval for ambient use; not imported automatically |
| Standing Cocky Head Turn While Talking With Another.fbx | communication | 2.533s | Deferred: no visual approval for ambient use; not imported automatically |
| Standing Happy Idle.fbx | idle / posture | 2.933s | Deferred: no visual approval for ambient use; not imported automatically |
| Standing Idle.fbx | idle / posture | 8.333s | Deferred: no visual approval for ambient use; not imported automatically |
| Standing Neutral Idle (1).fbx | idle / posture | 8.767s | Excluded duplicate: Neutral Idle.fbx |
| Standing Pointing Backwards.fbx | communication | 3.600s | Deferred: no visual approval for ambient use; not imported automatically |
| Standing Pointing Forward.fbx | communication | 4.700s | Deferred: no visual approval for ambient use; not imported automatically |
| Standing Shoulder Rubbing.fbx | idle / posture | 5.833s | Deferred: no visual approval for ambient use; not imported automatically |
| Standing Telling A Secret.fbx | communication | 10.900s | Deferred: no visual approval for ambient use; not imported automatically |
| Standing Weight Shift (preferred idle).fbx | idle / posture | 9.433s | Deferred: no visual approval for ambient use; not imported automatically |
| Swagger Walk (preferred).fbx | locomotion | 2.800s | Deferred: runway/stylized locomotion is unnecessary for this stability-focused upgrade |
| Texting While Standing.fbx | communication | 23.567s | Deferred: no visual approval for ambient use; not imported automatically |
| Thoughtful Head Nod.fbx | communication | 2.933s | Deferred: no visual approval for ambient use; not imported automatically |
| Thoughtful Head Shake.fbx | communication | 3.067s | Deferred: no visual approval for ambient use; not imported automatically |
| Tut Hip Hop Dance (contract signed).fbx | celebration / emphatic gesture | 12.100s | Excluded from ambient work: exaggerated or task-specific gesture |
| Type To Sit.fbx | desk work | 0.933s | Selected and converted; independent FBX fidelity validated for all four characters |
| Typing With Mouse Move.fbx | desk work | 16.467s | Selected and converted; independent FBX fidelity validated for all four characters |
| Unarmed Idle 01.fbx | idle / posture | 11.600s | Deferred: no visual approval for ambient use; not imported automatically |
| Victory 2 While Sitting At Desk.fbx | celebration / emphatic gesture | 6.100s | Excluded from ambient work: exaggerated or task-specific gesture |
| Walk In Circle With Coffee.fbx | locomotion | 17.367s | Deferred: no visual approval for ambient use; not imported automatically |
| Walking (not preferred).fbx | locomotion | 1.233s | Deferred: no visual approval for ambient use; not imported automatically |
| Walking (preferred 2 male).fbx | locomotion | 1.233s | Selected and converted; independent FBX fidelity validated for all four characters |
| Walking (preferred male).fbx | locomotion | 1.033s | Deferred: no visual approval for ambient use; not imported automatically |
| Walking While Texting.fbx | locomotion | 4.000s | Deferred: no visual approval for ambient use; not imported automatically |
| Walking with a Swagger (male).fbx | locomotion | 1.033s | Deferred: runway/stylized locomotion is unnecessary for this stability-focused upgrade |
