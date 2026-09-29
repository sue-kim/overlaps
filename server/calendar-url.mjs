export function normalizeCalendarUrl(value) {
  const help='Use an iCloud public calendar link or a Google Calendar iCal link.';
  if(typeof value !== 'string' || value.length > 4096) throw new Error(help);
  let url;
  try {url=new URL(value.trim().replace(/^webcal:/i, 'https:'));} catch {throw new Error(help);}
  const iCloud=/^(?:p\d+-caldav|calendars)\.icloud\.com$/i.test(url.hostname);
  const google=['calendar.google.com','www.google.com'].includes(url.hostname)
    && /^\/calendar\/ical\/[^/]+\/(?:public|private-[a-z0-9]+)\/basic\.ics$/i.test(url.pathname)
    && !url.search;
  if(url.protocol !== 'https:' || (!iCloud&&!google) || url.port || url.username || url.password || url.hash) throw new Error(help);
  if(google) url.hostname='calendar.google.com';
  return url.href;
}
