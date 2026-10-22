import ICAL from 'ical.js';
import { DateTime } from 'luxon';

// Read the full export so history can be removed before the stored-calendar limit.
export const MAX_CALENDAR_DOWNLOAD_BYTES = 50_000_000;
export const MAX_CALENDAR_BYTES = 2_000_000;

export function futureCalendar(text, { from, floatingZone = 'UTC' }) {
  if (new TextEncoder().encode(text).byteLength > MAX_CALENDAR_DOWNLOAD_BYTES) {
    throw new RangeError('This calendar is larger than 50 MB. Export a smaller calendar file.');
  }
  if (!text.trim().startsWith('BEGIN:VCALENDAR')) {
    throw new Error('This is not an iCalendar file. Choose a calendar exported as .ics.');
  }
  const cutoff = DateTime.fromISO(from);
  if (!cutoff.isValid) throw new Error('Choose a valid calendar start date.');
  const root = new ICAL.Component(ICAL.parse(text));
  if (root.name !== 'vcalendar') throw new Error('The file does not contain a calendar.');
  ICAL.TimezoneService.reset();
  for (const component of root.getAllSubcomponents('vtimezone')) {
    const tzid = String(component.getFirstPropertyValue('tzid'));
    ICAL.TimezoneService.register(new ICAL.Timezone({ component, tzid }), tzid);
  }
  const calendarZone = String(root.getFirstPropertyValue('x-wr-timezone') || floatingZone);
  function instant(time, component) {
    const zone = String(component.getFirstProperty('dtstart')?.getParameter('tzid') || calendarZone);
    const value = !time.isDate && time.zone.tzid !== 'floating' && time.zone.tzid !== 'local'
      ? DateTime.fromJSDate(time.toJSDate())
      : DateTime.fromISO(time.toString(), { zone });
    if (!value.isValid) throw new Error(`The calendar uses an unsupported time zone: ${zone}.`);
    return value;
  }
  function upcoming(start, end, component) {
    return instant(start, component) >= cutoff || instant(end, component) > cutoff;
  }
  const events = root.getAllSubcomponents('vevent');
  const exceptions = new Map();
  for (const component of events.filter(item => item.hasProperty('recurrence-id'))) {
    const uid = component.getFirstPropertyValue('uid');
    if (!exceptions.has(uid)) exceptions.set(uid, []);
    exceptions.get(uid).push(component);
  }
  const keep = new Set(root.getAllSubcomponents('vtimezone'));
  for (const component of events.filter(item => !item.hasProperty('recurrence-id'))) {
    if (!component.hasProperty('dtstart') || component.getFirstPropertyValue('status') === 'CANCELLED') continue;
    const event = new ICAL.Event(component);
    const related = exceptions.get(event.uid) || [];
    const retainedExceptions = related.filter(item => {
      // Keep overrides of future instances, even if they were moved into the past.
      // A past THISANDFUTURE override can still change future occurrences.
      const recurrence = item.getFirstProperty('recurrence-id');
      if (recurrence.getParameter('range') === 'THISANDFUTURE'
        || instant(recurrence.getFirstValue(), component) >= cutoff) return true;
      if (!item.hasProperty('dtstart')) return false;
      const exception = new ICAL.Event(item);
      return upcoming(exception.startDate, exception.endDate, item);
    });
    for (const exception of related) event.relateException(new ICAL.Event(exception));
    let hasFuture = !event.isRecurring()
      && upcoming(event.startDate, event.endDate, component);
    if (event.isRecurring()) {
      hasFuture = retainedExceptions.some(item => item.hasProperty('dtstart')
        && item.getFirstPropertyValue('status') !== 'CANCELLED'
        && upcoming(new ICAL.Event(item).startDate, new ICAL.Event(item).endDate, item));
      const iterator = event.iterator();
      let occurrence, count = 0;
      while (!hasFuture && (occurrence = iterator.next())) {
        // Preserve complex series conservatively rather than lose upcoming events.
        if (++count > 50_000) { hasFuture = true; break; }
        const detail = event.getOccurrenceDetails(occurrence);
        if (detail.item.component.getFirstPropertyValue('status') !== 'CANCELLED') {
          hasFuture = upcoming(detail.startDate, detail.endDate, detail.item.component);
        }
      }
    }
    if (hasFuture) {
      keep.add(component);
      retainedExceptions.forEach(item => keep.add(item));
    }
  }
  for (const component of [...root.getAllSubcomponents()]) {
    if (!keep.has(component)) root.removeSubcomponent(component);
  }
  const result = root.toString();
  if (new TextEncoder().encode(result).byteLength > MAX_CALENDAR_BYTES) {
    throw new RangeError('This month and future events in this calendar exceed 2 MB. Import a smaller calendar.');
  }
  return result;
}
