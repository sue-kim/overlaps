import { DateTime } from 'luxon';

/** A city's weekday 09:00–18:00 intervals intersecting one displayed calendar day. */
export function workHoursInDay(day:DateTime, zone:string) {
  const from=day.startOf('day'), to=from.plus({days:1});
  const periods:{start:DateTime;end:DateTime}[]=[];
  for(let local=from.setZone(zone).startOf('day');local<to;local=local.plus({days:1})) {
    if(local.weekday>5) continue;
    const start=local.set({hour:9}),end=local.set({hour:18});
    if(start<to&&end>from) periods.push({start:start<from?from:start,end:end>to?to:end});
  }
  return periods;
}

export function isWorkHour(instant:DateTime,zone:string) {
  const local=instant.setZone(zone);
  return local.weekday<=5&&local.hour>=9&&local.hour<18;
}
