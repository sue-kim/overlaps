import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cities } from '../src/time';
import { assignWorkColors, defaultWorkHours, getWorkColor, workColors } from '../src/workHours';

const bands=(preferences:ReturnType<typeof assignWorkColors>,ids:string[])=>ids.map((id,index)=>getWorkColor(preferences[id].color,index).band);
test('every supported city receives a distinct color without cycling the palette',()=>{
  const ids=cities.map(city=>city.id);
  const preferences=assignWorkColors({},ids);
  assert.equal(new Set(bands(preferences,ids)).size,ids.length);
  assert.deepEqual(assignWorkColors(preferences,ids),preferences);
});
test('saved four-color repetitions are repaired without changing work schedules or unique choices',()=>{
  const ids=cities.slice(0,10).map(city=>city.id);
  const saved=Object.fromEntries(ids.map((id,index)=>[id,{...defaultWorkHours(false),start:'10:00',color:workColors[index%4].id}]));
  const restored=assignWorkColors(saved,ids);
  assert.equal(new Set(bands(restored,ids)).size,ids.length);
  ids.forEach(id=>{assert.equal(restored[id].start,'10:00');assert.equal(restored[id].visible,false);});
  ids.slice(0,4).forEach(id=>assert.equal(restored[id].color,saved[id].color));
  assert.deepEqual(assignWorkColors(restored,[...ids].reverse()),restored);
});
test('adding after removal selects an unused color and accounts for custom hex values',()=>{
  const saved={a:{...defaultWorkHours(),color:workColors[0].band},b:{...defaultWorkHours(),color:'ochre' as const},removed:{...defaultWorkHours(),color:'rose' as const}};
  const next=assignWorkColors(saved,['a','b','new']);
  assert.equal(next.new.color,'rose');
  assert.equal(new Set(bands(next,['a','b','new'])).size,3);
  assert.equal(next.removed,saved.removed);
});
