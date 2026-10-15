import assert from 'node:assert/strict';
import {EmployeeBehavior,planEmployeePath,clearEmployeePosition,segmentClear,employeeStates} from '../src/utils/employeeBehavior';
const bounds={minX:-4,maxX:4,minZ:-4,maxZ:4};
const desk={x:0,z:0,halfWidth:1,halfDepth:.5,yaw:0};
const start={x:0,z:-2},goal={x:0,z:2};
const path=planEmployeePath(start,goal,bounds,[desk]);assert.ok(path.length>1,'finds a route around the desk');
let current=start;for(const p of path){assert.ok(segmentClear(current,p,bounds,[desk]),'every path edge avoids furniture');current=p;}
assert.deepEqual(planEmployeePath(start,{x:5,z:0},bounds,[]),[],'rejects outside department');
const wall={x:0,z:0,halfWidth:4,halfDepth:.01,yaw:0};assert.deepEqual(planEmployeePath(start,goal,bounds,[wall]),[],'cannot cross thin glass');
assert.equal(segmentClear({x:-2,z:0},{x:2,z:0},bounds,[],[{x:0,z:0}]),false,'other employees block movement');
const employee=new EmployeeBehavior(start,bounds,[{x:2,z:-2}],0);let stood=false,walked=false,returned=false,previous=start;employee.setState('WALKING');
for(let i=0;i<2200;i++){
 employee.update(.05,[desk],[]);assert.ok(clearEmployeePosition(employee.position,bounds,[desk]));
 assert.ok(Math.hypot(employee.position.x-previous.x,employee.position.z-previous.z)<=.65*.05+.000001,'speed limit');previous={...employee.position};
 stood ||= employee.phase==='STANDING_UP';walked ||= employee.state==='WALKING';
 if(walked&&employee.phase==='SEATED'){returned=true;break;}
}
assert.ok(stood&&walked&&returned,'ambient loop stands, walks, returns and sits');assert.deepEqual(employee.position,start);
for(const state of employeeStates.filter(s=>s!=='WALKING')){const e=new EmployeeBehavior(start,bounds,[goal],0);e.setState(state);e.update(.05,[],[]);assert.equal(e.state,state,'external visual status supported');assert.equal(e.phase,'SEATED');}
const waiting=new EmployeeBehavior(start,bounds,[{x:2,z:-2}]);waiting.setState('WALKING');
for(let i=0;i<49;i++)waiting.update(.05,[],[]);
const stopped={...waiting.position};for(let i=0;i<30;i++)waiting.update(.05,[],[{x:stopped.x+.03,z:stopped.z}]);assert.deepEqual(waiting.position,stopped,'waits for person without teleporting');
console.log('Employee navigation, ambient transitions, external visual states and dynamic avoidance passed');
