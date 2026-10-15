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
const schedule=createWorkSchedule(404);let typed=0,paused=0;
for(let t=1;t<300;t+=.05){const p=schedule(t);if(p.typingBlend>0)typed++;if(p.resting)paused++;assert.ok(p.typingBlend>=0&&p.typingBlend<=1);assert.ok(p.mouseBlend>=0&&p.mouseBlend<=1);}
assert.ok(paused>typed,'employees spend more time reviewing than continuously typing');
const reception=createWorkSchedule(42,0,'receptionist'),dispositions=createWorkSchedule(42,0,'dispositions');
let entrance=false,communication=false;
for(let t=0;t<1000;t++){entrance ||= reception(t).activity==='entrance';communication ||= dispositions(t).activity==='communication';}
assert.ok(entrance&&communication,'department schedules include distinct attention patterns');
console.log('Independent, bounded work bursts and department schedules passed');
