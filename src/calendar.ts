import ICAL from 'ical.js';
import { DateTime } from 'luxon';
export interface CalendarSource {id:string; name:string; ics:string; url?:string; provider?:'google'|'icloud'; syncedAt:string; floatingZone:string}
export interface CalendarEvent {id:string; title:string; start:string; end:string; allDay:boolean; sourceId:string; sourceName:string}
export function validateICS(text:string) {
  if(text.length>2_000_000) throw new Error('This calendar is too large. Please import a file smaller than 2 MB.');
  if(!text.trim().startsWith('BEGIN:VCALENDAR')) throw new Error('This is not an iCalendar file. Choose a calendar exported as .ics.');
  const component=new ICAL.Component(ICAL.parse(text));
  if(component.name!=='vcalendar') throw new Error('The file does not contain a calendar.');
  return component;
}
export function calendarName(text:string) {
  return String(validateICS(text).getFirstPropertyValue('x-wr-calname') || 'Imported calendar');
}
export function expandCalendar(source:CalendarSource, from:DateTime, to:DateTime):CalendarEvent[] {
  const root=validateICS(source.ics);
  ICAL.TimezoneService.reset();
  for(const component of root.getAllSubcomponents('vtimezone')) {
    const tzid=String(component.getFirstPropertyValue('tzid'));
    ICAL.TimezoneService.register(new ICAL.Timezone({component,tzid}),tzid);
  }
  const components=root.getAllSubcomponents('vevent');
  const masters=components.filter(c=>!c.hasProperty('recurrence-id'));
  const exceptions=components.filter(c=>c.hasProperty('recurrence-id'));
  const result:CalendarEvent[]=[];
  const calendarZone=String(root.getFirstPropertyValue('x-wr-timezone') || source.floatingZone);
  function convert(time:ICAL.Time, zone:string) {
    if(time.isDate) return time.toString();
    if(time.zone.tzid!=='floating' && time.zone.tzid!=='local') return DateTime.fromJSDate(time.toJSDate()).toUTC().toISO()!;
    const candidate=DateTime.fromISO(time.toString(),{zone});
    if(!candidate.isValid) throw new Error(`The calendar uses an unsupported time zone: ${zone}.`);
    return candidate.toUTC().toISO()!;
  }
  for(const component of masters) {
    if(component.getFirstPropertyValue('status')==='CANCELLED' || !component.hasProperty('dtstart')) continue;
    const event=new ICAL.Event(component);
    for(const exception of exceptions.filter(e=>e.getFirstPropertyValue('uid')===event.uid)) event.relateException(new ICAL.Event(exception));
    const zone=String(component.getFirstProperty('dtstart')?.getParameter('tzid') || calendarZone);
    const add=(start:ICAL.Time,end:ICAL.Time,item:ICAL.Event,key:string)=>{
      if(item.component.getFirstPropertyValue('status')==='CANCELLED') return;
      const occurrenceZone=String(item.component.getFirstProperty('dtstart')?.getParameter('tzid') || zone);
      const a=convert(start,occurrenceZone), b=convert(end,occurrenceZone);
      const startTime=DateTime.fromISO(a,{zone:from.zoneName!});
      let endTime=DateTime.fromISO(b,{zone:from.zoneName!});
      if(endTime<=startTime) endTime=startTime.plus(start.isDate?{days:1}:{minutes:30});
      if(startTime<to && endTime>from) result.push({id:`${source.id}-${event.uid}-${key}`,title:item.summary||'Untitled event',start:a,end:start.isDate?endTime.toISODate()!:endTime.toUTC().toISO()!,allDay:start.isDate,sourceId:source.id,sourceName:source.name});
    };
    if(event.isRecurring()) {
      const iterator=event.iterator();
      let count=0, occurrence:ICAL.Time|null;
      while((occurrence=iterator.next())) {
        if(++count>50_000) throw new Error('This recurring calendar is too large to expand safely. Import a smaller date range.');
        if(DateTime.fromISO(convert(occurrence,zone),{zone:from.zoneName!})>to.plus({days:2})) break;
        const detail=event.getOccurrenceDetails(occurrence);
        add(detail.startDate,detail.endDate,detail.item,occurrence.toString());
      }
    } else add(event.startDate,event.endDate,event,'single');
  }
  return result.sort((a,b)=>a.start.localeCompare(b.start));
}
