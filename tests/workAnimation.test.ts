import assert from 'node:assert/strict';
import {workAnimationPhase,createWorkSchedule} from '../src/utils/workAnimation';
let starts=0,previous=false;
for(let t=0;t<84;t+=.1){const current=workAnimationPhase(t).mouse;if(current&&!previous)starts++;previous=current;}
assert.equal(starts,4);
assert.equal(workAnimationPhase(66).restBlend,1);
assert.equal(workAnimationPhase(83).mouse,false);
assert.equal(workAnimationPhase(86).restBlend,0);
assert.equal(workAnimationPhase(82).restBlend,1);
assert.equal(workAnimationPhase(97).mouse,true);
console.log('Four mouse sequences, rest, and resume checks passed');

const staff=[createWorkSchedule(101,3),createWorkSchedule(202,29),createWorkSchedule(303,56)];
let different=false;
for(let t=0;t<250;t+=.2){const phases=staff.map(s=>s(t));if(new Set(phases.map(p=>`${p.mouse}:${p.resting}`)).size>1)different=true;}
assert.ok(different,'staff independently switch between typing, mouse use, and rest');
const schedule=createWorkSchedule(404);let mouseStarts=0,wasMouse=false,restStart=-1,restEnd=-1;
for(let t=1;t<150;t+=.05){const p=schedule(t);if(p.mouse&&!wasMouse)mouseStarts++;wasMouse=p.mouse;if(p.resting&&restStart<0){restStart=t;assert.equal(mouseStarts,4);}if(restStart>=0&&!p.resting){restEnd=t;break;}}
assert.ok(Math.abs(restEnd-restStart-20)<.1,'randomized cycle preserves 20-second rest');
console.log('Independent staff schedules passed');
