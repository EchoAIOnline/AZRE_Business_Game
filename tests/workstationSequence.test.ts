import assert from 'node:assert/strict';
import {WorkstationSequence} from '../src/utils/workstationSequence';
const duration={Seated:4.3,SitToType:1.2,Mouse:16.466667,TypeToSit:.933333};
const sequences=['acquisitions','dispositions','operations'].map((role,i)=>new WorkstationSequence(duration,43+i*101,role));
const histories=sequences.map(()=>new Set<string>());let asynchronous=false;
for(let frame=0;frame<20*60*30;frame++){
 for(const [i,s] of sequences.entries()){
  const old=s.phase,elapsed=s.elapsed;s.setWorking(frame<10*60*30);const weights=s.update(1/30);histories[i].add(s.phase);
  assert.ok(Math.abs(Object.values(weights).reduce((a,b)=>a+b!,0)-1)<1e-8,'all skeletal blend weights sum to one');
  if(old!==s.phase&&old!=='Seated')assert.ok(elapsed+1/30>=duration[old],'authored action must complete before changing state');
  assert.ok(!s.safeToStand||s.phase==='Seated','walk only begins at a safe seated pose');
 }
 if(new Set(sequences.map(s=>s.phase)).size>1)asynchronous=true;
}
assert.ok(asynchronous,'employees have independent schedules');for(const history of histories)assert.deepEqual([...history].sort(),['Mouse','Seated','SitToType','TypeToSit'].sort());
for(const s of sequences){assert.equal(s.phase,'Seated');assert.equal(s.safeToStand,true);}
console.log('Twenty-minute independent desk sequences: normalized blends, authored completion, safe departure and rest passed');
