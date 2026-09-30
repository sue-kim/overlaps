import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { cities, wallTime, dayDifference, availabilityText, slotsToICS } from '../src/time';
import { expandCalendar, validateICS, type CalendarSource } from '../src/calendar';
const source=(body:string):CalendarSource=>({id:'test',name:'Test calendar',ics:`BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${body}\r\nEND:VCALENDAR`,floatingZone:'Asia/Seoul',syncedAt:'2026-09-29T00:00:00Z'});
test('Korean interview time converts to the prior date in both US cities',()=>{
 const start=wallTime('2026-09-29','00:30','Asia/Seoul')!;
 const sf=start.setZone('America/Los_Angeles'),ny=start.setZone('America/New_York');
 assert.equal(sf.toFormat('yyyy-MM-dd HH:mm'),'2026-09-28 08:30');
 assert.equal(ny.toFormat('yyyy-MM-dd HH:mm'),'2026-09-28 11:30');
 assert.equal(dayDifference(sf,start),-1);
});
test('US winter and summer offsets follow the selected date',()=>{
 assert.equal(wallTime('2026-07-01','09:00','America/New_York')!.setZone('Asia/Seoul').hour,22);
 assert.equal(wallTime('2026-12-01','09:00','America/New_York')!.setZone('Asia/Seoul').hour,23);
});
test('spring-forward missing time is rejected and fall-back offers two instants',()=>{
 assert.equal(wallTime('2026-03-08','02:30','America/New_York'),null);
 const choices=wallTime('2026-11-01','01:30','America/New_York')!.getPossibleOffsets();
 assert.equal(choices.length,2);assert.equal(Math.abs(choices[0].diff(choices[1],'hours').hours),1);
});
test('half-hour time zones retain their minutes',()=>{
 assert.equal(wallTime('2026-09-29','09:00','Asia/Seoul')!.setZone('Asia/Kolkata').toFormat('HH:mm'),'05:30');
});
test('copy text includes dates, named cities, and midnight rollover without UTC offsets',()=>{
 const text=availabilityText([{id:'one',start:'2026-09-29T14:30:00Z',duration:60,title:'Available'}],cities.slice(0,3));
 assert.match(text,/Seoul time:\nTuesday, September 29, 2026: 11:30 PM–Wednesday, September 30, 2026, 12:30 AM/);
 assert.match(text,/San Francisco time:\nTuesday, September 29, 2026: 7:30–8:30 AM/);
 assert.doesNotMatch(text,/UTC[+-]/);
});
test('copy text groups days and merges adjoining or overlapping slots without filling gaps',()=>{
 const slots=[
  {id:'late',start:'2026-09-29T13:00:00Z',duration:30,title:'Available'},
  {id:'tuesday-second',start:'2026-09-29T10:00:00Z',duration:60,title:'Available'},
  {id:'monday',start:'2026-09-28T09:00:00Z',duration:60,title:'Available'},
  {id:'tuesday-first',start:'2026-09-29T09:00:00Z',duration:60,title:'Available'},
  {id:'overlap',start:'2026-09-29T09:30:00Z',duration:60,title:'Available'},
 ];
 const original=JSON.stringify(slots);
 const text=availabilityText(slots,cities.slice(0,3));
 assert.match(text,/Seoul time:\nMonday, September 28, 2026: 6:00–7:00 PM\nTuesday, September 29, 2026: 6:00–8:00 PM, 10:00–10:30 PM/);
 assert.equal((text.match(/Seoul time:/g)||[]).length,1);
 assert.equal((text.match(/San Francisco time:/g)||[]).length,1);
 assert.equal((text.match(/New York time:/g)||[]).length,1);
 assert.equal(JSON.stringify(slots),original,'Formatting does not alter saved slots');
});
test('copy text keeps 24-hour formatting and AM/PM changes clear',()=>{
 const slots=[{id:'noon',start:'2026-09-29T02:30:00Z',duration:60,title:'Available'}];
 assert.match(availabilityText(slots,[cities[0]]),/11:30 AM–12:30 PM/);
 assert.match(availabilityText(slots,[cities[0]],true),/11:30–12:30/);
 assert.doesNotMatch(availabilityText(slots,[cities[0]],true),/AM|PM/);
});
test('copy text distinguishes the repeated hour when daylight saving ends',()=>{
 const text=availabilityText([{id:'fold',start:'2026-11-01T05:30:00Z',duration:60,title:'Available'}],[cities[2]]);
 assert.match(text,/Sunday, November 1, 2026: 1:30 AM EDT–1:30 AM EST/);
});
test('ICS export round-trips the original instant',()=>{
 const slot={id:'slot',start:'2026-09-29T00:00:00Z',duration:60,title:'Interview availability'};
 const s={...source(''),ics:slotsToICS([slot])};
 const events=expandCalendar(s,DateTime.fromISO('2026-09-28'),DateTime.fromISO('2026-10-05'));
 assert.equal(events.length,1);assert.equal(DateTime.fromISO(events[0].start).toMillis(),DateTime.fromISO(slot.start).toMillis());
 assert.equal(DateTime.fromISO(events[0].end).diff(DateTime.fromISO(events[0].start),'minutes').minutes,60);
});
test('recurrences honor IANA zones, exclusions, and changed instances',()=>{
 const s=source('BEGIN:VEVENT\r\nUID:weekly\r\nDTSTART;TZID=America/New_York:20260928T100000\r\nDTEND;TZID=America/New_York:20260928T110000\r\nRRULE:FREQ=DAILY;COUNT=4\r\nEXDATE;TZID=America/New_York:20260929T100000\r\nSUMMARY:Interview\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nUID:weekly\r\nRECURRENCE-ID;TZID=America/New_York:20260930T100000\r\nDTSTART;TZID=America/New_York:20260930T120000\r\nDTEND;TZID=America/New_York:20260930T130000\r\nSUMMARY:Moved interview\r\nEND:VEVENT');
 const events=expandCalendar(s,DateTime.fromISO('2026-09-28'),DateTime.fromISO('2026-10-05'));
 assert.equal(events.length,3);assert.equal(events[0].start,'2026-09-28T14:00:00.000Z');
 const moved=events.find(e=>e.title==='Moved interview');assert.equal(moved?.start,'2026-09-30T16:00:00.000Z');
});
test('all-day events remain dates, floating times use import zone',()=>{
 const s=source('BEGIN:VEVENT\r\nUID:day\r\nDTSTART;VALUE=DATE:20260929\r\nDTEND;VALUE=DATE:20260930\r\nSUMMARY:Holiday\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nUID:float\r\nDTSTART:20260929T090000\r\nDTEND:20260929T100000\r\nSUMMARY:Local\r\nEND:VEVENT');
 const events=expandCalendar(s,DateTime.fromISO('2026-09-28'),DateTime.fromISO('2026-10-05'));
 assert.equal(events.find(e=>e.allDay)?.start,'2026-09-29');assert.equal(events.find(e=>!e.allDay)?.start,'2026-09-29T00:00:00.000Z');
});
test('invalid calendar input has a recoverable error',()=>assert.throws(()=>validateICS('<html>Not a calendar</html>'),/not an iCalendar/));
test('embedded daylight-saving timezone definitions are registered',()=>{
 const s=source('BEGIN:VTIMEZONE\r\nTZID:America/New_York\r\nBEGIN:DAYLIGHT\r\nDTSTART:19700308T020000\r\nRRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU\r\nTZOFFSETFROM:-0500\r\nTZOFFSETTO:-0400\r\nEND:DAYLIGHT\r\nBEGIN:STANDARD\r\nDTSTART:19701101T020000\r\nRRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU\r\nTZOFFSETFROM:-0400\r\nTZOFFSETTO:-0500\r\nEND:STANDARD\r\nEND:VTIMEZONE\r\nBEGIN:VEVENT\r\nUID:vtz\r\nDTSTART;TZID=America/New_York:20261031T090000\r\nDTEND;TZID=America/New_York:20261031T100000\r\nRRULE:FREQ=DAILY;COUNT=3\r\nSUMMARY:DST series\r\nEND:VEVENT');
 const events=expandCalendar(s,DateTime.fromISO('2026-10-30'),DateTime.fromISO('2026-11-04'));
 assert.equal(events.length,3);assert.equal(events[0].start,'2026-10-31T13:00:00.000Z');assert.equal(events[1].start,'2026-11-01T14:00:00.000Z');
});
