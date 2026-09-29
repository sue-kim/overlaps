import {test} from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error JavaScript module tested directly.
import {normalizeCalendarUrl} from '../server/calendar-url.mjs';
test('public iCloud feed links are normalized to HTTPS',()=>{
 assert.equal(normalizeCalendarUrl('webcal://p123-caldav.icloud.com/published/2/abc'),'https://p123-caldav.icloud.com/published/2/abc');
});
test('calendar fetch cannot target local networks or unrelated hosts',()=>{
 for(const url of ['http://127.0.0.1','https://localhost','https://p123-caldav.icloud.com.evil.com/path','https://p123-caldav.icloud.com:444/a','https://user:password@p123-caldav.icloud.com/a','https://example.com/a'])assert.throws(()=>normalizeCalendarUrl(url));
});

test('Google Calendar public and secret iCal links are accepted',()=>{
 for(const visibility of ['public','private-0123456789abcdef']) {
  const url=`https://calendar.google.com/calendar/ical/example%40gmail.com/${visibility}/basic.ics`;
  assert.equal(normalizeCalendarUrl(url),url);
 }
 assert.equal(normalizeCalendarUrl('https://www.google.com/calendar/ical/example%40gmail.com/public/basic.ics'),'https://calendar.google.com/calendar/ical/example%40gmail.com/public/basic.ics');
});
test('Google calendar fetch rejects non-feed paths and spoofed hosts',()=>{
 for(const url of ['https://calendar.google.com/calendar/u/0/r','https://calendar.google.com/calendar/embed?src=example','https://calendar.google.com.evil.com/calendar/ical/a/public/basic.ics','http://calendar.google.com/calendar/ical/a/public/basic.ics','https://www.google.com/url?q=https://localhost','https://calendar.google.com/calendar/ical/a/public/basic.ics?redirect=http://localhost'])assert.throws(()=>normalizeCalendarUrl(url));
});
