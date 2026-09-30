import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cities,initialCityIds} from '../src/time';

test('first visit starts with only the browser time zone as home',()=>{
  assert.deepEqual(initialCityIds(null,'Asia/Seoul'),['seoul']);
  assert.deepEqual(initialCityIds(null,'America/New_York'),['new-york']);
  assert.deepEqual(initialCityIds(null,'America/Los_Angeles'),['los-angeles']);
  assert.deepEqual(initialCityIds(null,'Europe/London'),['london']);
});

test('saved city order and home survive a different browser time zone',()=>{
  const saved=['san-francisco','seoul','new-york'];
  assert.deepEqual(initialCityIds(saved,'Europe/London'),saved);
  assert.deepEqual(initialCityIds(['new-york'],'Asia/Seoul'),['new-york']);
});

test('UTC, aliases, and fractional-offset zones have valid home clocks',()=>{
  for(const zone of ['UTC','Asia/Calcutta','Asia/Kathmandu','Etc/GMT+3']) {
    const [id]=initialCityIds(null,zone);
    const home=cities.find(city=>city.id===id)!;
    const canonical=(value:string)=>new Intl.DateTimeFormat('en',{timeZone:value}).resolvedOptions().timeZone;
    assert.equal(canonical(home.zone),canonical(zone));
    assert.deepEqual(initialCityIds([id],'Asia/Seoul'),[id]);
  }
});

test('empty or invalid city settings recover to the local home',()=>{
  for(const saved of [[],{},['not-a-city'],[null]])assert.deepEqual(initialCityIds(saved,'Asia/Seoul'),['seoul']);
  assert.deepEqual(initialCityIds(null,'invalid-zone'),['UTC']);
});
