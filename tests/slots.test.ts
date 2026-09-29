import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mergeSlots,isSlotCovered,type Slot} from '../src/time';
const slot=(id:string,start:string,duration:number):Slot=>({id,start,duration,title:'Interview availability'});

test('saved ranges merge adjoining and overlapping slots while preserving gaps and source data',()=>{
 const input=[slot('later','2026-09-29T03:00:00Z',60),slot('second','2026-09-29T01:00:00Z',60),slot('first','2026-09-29T00:00:00Z',60),slot('inside','2026-09-29T00:30:00Z',30)];
 const original=JSON.stringify(input);
 assert.deepEqual(mergeSlots(input),[slot('first','2026-09-29T00:00:00.000Z',120),slot('later','2026-09-29T03:00:00.000Z',60)]);
 assert.equal(JSON.stringify(input),original);
 const bridged=mergeSlots([...input,slot('bridge','2026-09-29T02:00:00Z',60)]);
 assert.deepEqual(bridged,[slot('first','2026-09-29T00:00:00.000Z',240)]);
 assert.deepEqual(mergeSlots(bridged),bridged,'Normalizing persisted ranges is idempotent');
});
test('saved range coverage rejects duplicates and contained times but permits extensions',()=>{
 const saved=mergeSlots([slot('saved','2026-09-29T09:00:00+09:00',120)]);
 assert.equal(isSlotCovered(saved,{start:'2026-09-29T00:00:00Z',duration:120}),true);
 assert.equal(isSlotCovered(saved,{start:'2026-09-29T00:30:00Z',duration:30}),true);
 assert.equal(isSlotCovered(saved,{start:'2026-09-29T01:30:00Z',duration:60}),false);
 assert.equal(isSlotCovered(saved,{start:'2026-09-29T02:00:00Z',duration:60}),false);
});
test('saved ranges merge across midnight and daylight-saving offsets by actual instant',()=>{
 assert.deepEqual(mergeSlots([slot('night','2026-09-29T23:30:00+09:00',30),slot('morning','2026-09-30T00:00:00+09:00',30)]),[slot('night','2026-09-29T14:30:00.000Z',60)]);
 assert.deepEqual(mergeSlots([slot('daylight','2026-11-01T01:00:00-04:00',60),slot('standard','2026-11-01T01:00:00-05:00',60)]),[slot('daylight','2026-11-01T05:00:00.000Z',120)]);
});
