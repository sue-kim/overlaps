import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { defaultWorkHours, isWorkHour, normalizeWorkHours, validWorkSchedule, workHoursInDay, workBandsInWeek } from '../src/workHours';

const seoul=(date:string)=>DateTime.fromISO(date,{zone:'Asia/Seoul'});
test('custom city hours and weekdays convert into the displayed date',()=>{
  const schedule={start:'09:30',end:'17:30',days:[2]};
  const periods=workHoursInDay(seoul('2026-09-30'),'America/Los_Angeles',schedule);
  assert.deepEqual(periods.map(({start,end})=>[start.setZone('Asia/Seoul').toFormat('yyyy-MM-dd HH:mm'),end.setZone('Asia/Seoul').toFormat('yyyy-MM-dd HH:mm')]),[['2026-09-30 01:30','2026-09-30 09:30']]);
  assert.equal(workHoursInDay(seoul('2026-10-01'),'America/Los_Angeles',schedule).length,0);
});
test('overnight work follows its start weekday and clips at display-day boundaries',()=>{
  const schedule={start:'22:00',end:'06:00',days:[5]};
  const friday=workHoursInDay(seoul('2026-10-02'),'Asia/Seoul',schedule);
  const saturday=workHoursInDay(seoul('2026-10-03'),'Asia/Seoul',schedule);
  assert.equal(friday[0].start.hour,22);
  assert.equal(friday[0].end.toISODate(),'2026-10-03');
  assert.equal(saturday[0].start.hour,0);
  assert.equal(saturday[0].end.hour,6);
  assert.equal(isWorkHour(seoul('2026-10-03T05:59'),'Asia/Seoul',schedule),true);
  assert.equal(isWorkHour(seoul('2026-10-03T06:00'),'Asia/Seoul',schedule),false);
  assert.equal(isWorkHour(seoul('2026-10-03T22:00'),'Asia/Seoul',schedule),false);
});
test('configured hours follow seasonal offsets',()=>{
  const schedule={start:'09:00',end:'17:00',days:[1,2,3,4,5]};
  const summer=workHoursInDay(seoul('2026-07-01'),'America/New_York',schedule).at(-1)!;
  const winter=workHoursInDay(seoul('2026-12-01'),'America/New_York',schedule).at(-1)!;
  assert.equal(summer.start.setZone('Asia/Seoul').hour,22);
  assert.equal(winter.start.setZone('Asia/Seoul').hour,23);
});
test('overnight hours span spring and fall clock changes without shifting local end times',()=>{
  const schedule={start:'22:00',end:'06:00',days:[6]};
  for(const [date,expectedHours] of [['2026-03-08',5],['2026-11-01',7]] as const) {
    const day=DateTime.fromISO(date,{zone:'America/New_York'});
    const [period]=workHoursInDay(day,'America/New_York',schedule);
    assert.equal(period.end.hour,6);
    assert.equal(period.end.diff(period.start,'hours').hours,expectedHours);
    assert.equal(isWorkHour(day.set({hour:5,minute:59}),'America/New_York',schedule),true);
  }
});
test('no weekdays means no work hours; equal or incomplete times are rejected',()=>{
  assert.deepEqual(workHoursInDay(seoul('2026-09-30'),'Asia/Seoul',{...defaultWorkHours(),days:[]}),[]);
  assert.equal(validWorkSchedule({...defaultWorkHours(),end:'09:00'}),false);
  assert.equal(validWorkSchedule({...defaultWorkHours(),start:''}),false);
});
test('stored settings retain visibility and sanitize malformed schedules',()=>{
  assert.deepEqual(normalizeWorkHours({seoul:{start:'10:00',end:'17:00',visible:false,color:'coral',days:[1,1,7,8,'2']},bad:{start:'25:00',end:'18:00',visible:true,days:[1]}}),{seoul:{start:'10:00',end:'17:00',visible:false,color:'coral',days:[1,7]}});
  assert.deepEqual(normalizeWorkHours(null),{});
});
test('work bands span adjacent days once without filling non-working days',()=>{
  const week=seoul('2026-09-28');
  assert.deepEqual(workBandsInWeek(week,'Asia/Seoul'),[{firstDay:0,lastDay:4,startMinute:540,endMinute:1080}]);
  assert.deepEqual(workBandsInWeek(week,'Asia/Seoul',{start:'09:00',end:'18:00',days:[1,3]}),[
    {firstDay:0,lastDay:0,startMinute:540,endMinute:1080},
    {firstDay:2,lastDay:2,startMinute:540,endMinute:1080}
  ]);
});
test('shared labels retain the two separate date segments for overseas work hours',()=>{
  assert.deepEqual(workBandsInWeek(seoul('2026-09-28'),'America/New_York'),[
    {firstDay:0,lastDay:4,startMinute:1320,endMinute:1440},
    {firstDay:1,lastDay:5,startMinute:0,endMinute:420}
  ]);
});
