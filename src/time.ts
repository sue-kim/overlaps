import { DateTime } from 'luxon';

export interface City { id: string; name: string; country: string; zone: string; code: string }
export const cities: City[] = [
  {id:'seoul',name:'Seoul',country:'South Korea',zone:'Asia/Seoul',code:'SEL'},
  {id:'san-francisco',name:'San Francisco',country:'United States',zone:'America/Los_Angeles',code:'SFO'},
  {id:'new-york',name:'New York',country:'United States',zone:'America/New_York',code:'NYC'},
  {id:'london',name:'London',country:'United Kingdom',zone:'Europe/London',code:'LON'},
  {id:'paris',name:'Paris',country:'France',zone:'Europe/Paris',code:'PAR'},
  {id:'berlin',name:'Berlin',country:'Germany',zone:'Europe/Berlin',code:'BER'},
  {id:'tokyo',name:'Tokyo',country:'Japan',zone:'Asia/Tokyo',code:'TYO'},
  {id:'singapore',name:'Singapore',country:'Singapore',zone:'Asia/Singapore',code:'SIN'},
  {id:'sydney',name:'Sydney',country:'Australia',zone:'Australia/Sydney',code:'SYD'},
  {id:'melbourne',name:'Melbourne',country:'Australia',zone:'Australia/Melbourne',code:'MEL'},
  {id:'los-angeles',name:'Los Angeles',country:'United States',zone:'America/Los_Angeles',code:'LAX'},
  {id:'chicago',name:'Chicago',country:'United States',zone:'America/Chicago',code:'CHI'},
  {id:'austin',name:'Austin',country:'United States',zone:'America/Chicago',code:'AUS'},
  {id:'denver',name:'Denver',country:'United States',zone:'America/Denver',code:'DEN'},
  {id:'seattle',name:'Seattle',country:'United States',zone:'America/Los_Angeles',code:'SEA'},
  {id:'boston',name:'Boston',country:'United States',zone:'America/New_York',code:'BOS'},
  {id:'toronto',name:'Toronto',country:'Canada',zone:'America/Toronto',code:'YYZ'},
  {id:'vancouver',name:'Vancouver',country:'Canada',zone:'America/Vancouver',code:'YVR'},
  {id:'honolulu',name:'Honolulu',country:'United States',zone:'Pacific/Honolulu',code:'HNL'},
  {id:'amsterdam',name:'Amsterdam',country:'Netherlands',zone:'Europe/Amsterdam',code:'AMS'},
  {id:'zurich',name:'Zurich',country:'Switzerland',zone:'Europe/Zurich',code:'ZRH'},
  {id:'lisbon',name:'Lisbon',country:'Portugal',zone:'Europe/Lisbon',code:'LIS'},
  {id:'dubai',name:'Dubai',country:'United Arab Emirates',zone:'Asia/Dubai',code:'DXB'},
  {id:'mumbai',name:'Mumbai',country:'India',zone:'Asia/Kolkata',code:'BOM'},
  {id:'bengaluru',name:'Bengaluru',country:'India',zone:'Asia/Kolkata',code:'BLR'},
  {id:'delhi',name:'New Delhi',country:'India',zone:'Asia/Kolkata',code:'DEL'},
  {id:'shanghai',name:'Shanghai',country:'China',zone:'Asia/Shanghai',code:'SHA'},
  {id:'hong-kong',name:'Hong Kong',country:'Hong Kong',zone:'Asia/Hong_Kong',code:'HKG'},
  {id:'taipei',name:'Taipei',country:'Taiwan',zone:'Asia/Taipei',code:'TPE'},
  {id:'bangkok',name:'Bangkok',country:'Thailand',zone:'Asia/Bangkok',code:'BKK'},
  {id:'jakarta',name:'Jakarta',country:'Indonesia',zone:'Asia/Jakarta',code:'JKT'},
  {id:'auckland',name:'Auckland',country:'New Zealand',zone:'Pacific/Auckland',code:'AKL'},
  {id:'sao-paulo',name:'São Paulo',country:'Brazil',zone:'America/Sao_Paulo',code:'SAO'},
  {id:'mexico-city',name:'Mexico City',country:'Mexico',zone:'America/Mexico_City',code:'MEX'},
  {id:'buenos-aires',name:'Buenos Aires',country:'Argentina',zone:'America/Argentina/Buenos_Aires',code:'BUE'},
  {id:'cape-town',name:'Cape Town',country:'South Africa',zone:'Africa/Johannesburg',code:'CPT'},
  {id:'nairobi',name:'Nairobi',country:'Kenya',zone:'Africa/Nairobi',code:'NBO'},
  {id:'istanbul',name:'Istanbul',country:'Türkiye',zone:'Europe/Istanbul',code:'IST'},
];
const knownZones = new Set(cities.map(c=>c.zone));
for (const zone of Intl.supportedValuesOf('timeZone')) {
  if(knownZones.has(zone) || !zone.includes('/')) continue;
  const name=zone.split('/').at(-1)!.replaceAll('_',' ');
  cities.push({id:zone,name,country:zone.split('/')[0].replaceAll('_',' '),zone,code:name.slice(0,3).toUpperCase()});
}
export const defaultCities = ['seoul','san-francisco','new-york'];
export const timeLabel = (dt:DateTime, h24=false) => dt.toFormat(h24 ? 'HH:mm' : 'h:mm a');
export const utcLabel = (dt:DateTime) => `UTC${dt.toFormat('Z')}`;
export function relativeOffset(dt:DateTime, home:DateTime) {
  const diff = (dt.offset-home.offset)/60;
  return diff===0?'Same time':`${Math.abs(diff)}h ${diff>0?'ahead':'behind'}`;
}
export function dayDifference(dt:DateTime, home:DateTime) {
  return Math.round(DateTime.fromISO(dt.toISODate()!,{zone:'UTC'}).diff(DateTime.fromISO(home.toISODate()!,{zone:'UTC'}),'days').days);
}
export function wallTime(date:string,time:string,zone:string) {
  const dt=DateTime.fromISO(`${date}T${time}`,{zone});
  if(!dt.isValid || dt.toISODate()!==date || dt.toFormat('HH:mm')!==time) return null;
  return dt;
}
export interface Slot { id:string; start:string; duration:number; title:string }
export function mergeSlots(slots:Slot[]):Slot[] {
  const sorted=slots.map(slot=>({...slot,start:DateTime.fromISO(slot.start).toUTC().toISO()!}))
    .sort((a,b)=>DateTime.fromISO(a.start).toMillis()-DateTime.fromISO(b.start).toMillis());
  const merged:Slot[]=[];
  for(const slot of sorted) {
    const previous=merged.at(-1);
    const start=DateTime.fromISO(slot.start).toMillis();
    const end=start+slot.duration*60_000;
    const previousStart=previous?DateTime.fromISO(previous.start).toMillis():0;
    if(previous&&start<=previousStart+previous.duration*60_000) {
      previous.duration=(Math.max(end,previousStart+previous.duration*60_000)-previousStart)/60_000;
    } else merged.push(slot);
  }
  return merged;
}
export function isSlotCovered(slots:Slot[],candidate:Pick<Slot,'start'|'duration'>):boolean {
  const start=DateTime.fromISO(candidate.start).toMillis(),end=start+candidate.duration*60_000;
  return slots.some(slot=>{
    const savedStart=DateTime.fromISO(slot.start).toMillis();
    return savedStart<=start&&savedStart+slot.duration*60_000>=end;
  });
}
export function availabilityText(slots:Slot[], places:City[], h24=false) {
  const merged=mergeSlots(slots).map(slot=>{
    const start=DateTime.fromISO(slot.start,{zone:'utc'});
    return {start,end:start.plus({minutes:slot.duration})};
  });
  const sections=places.map(city=>{
    const days=new Map<string,{date:DateTime;times:string[]}>();
    for(const range of merged) {
      const start=range.start.setZone(city.zone).setLocale('en');
      const end=range.end.setZone(city.zone).setLocale('en');
      const sameDay=start.hasSame(end,'day');
      const showZones=start.offset!==end.offset||start.getPossibleOffsets().length>1||end.getPossibleOffsets().length>1;
      const compactStart=!h24&&sameDay&&!showZones&&start.toFormat('a')===end.toFormat('a');
      const startTime=compactStart?start.toFormat('h:mm'):timeLabel(start,h24);
      const endDate=sameDay?'':end.toFormat('cccc, LLLL d, yyyy')+', ';
      const time=`${startTime}${showZones?' '+start.offsetNameShort:''}–${endDate}${timeLabel(end,h24)}${showZones?' '+end.offsetNameShort:''}`;
      const key=start.toISODate()!;
      const day=days.get(key);
      if(day)day.times.push(time);
      else days.set(key,{date:start,times:[time]});
    }
    return `${city.name} time:\n`+[...days.values()].map(day=>`${day.date.toFormat('cccc, LLLL d, yyyy')}: ${day.times.join(', ')}`).join('\n');
  });
  return 'I am available at the following times:\n\n'+sections.join('\n\n')+'\n\nPlease let me know which time works best for you.';
}
export function slotsToICS(slots:Slot[]) {
  const stamp=(dt:DateTime)=>dt.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
  const escape=(s:string)=>s.replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(',','\\,').replaceAll(';','\\;');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Overlap//Interview Availability//EN','CALSCALE:GREGORIAN'];
  for(const slot of slots) lines.push('BEGIN:VEVENT',`UID:${slot.id}@overlap.local`,`DTSTAMP:${stamp(DateTime.now())}`,`DTSTART:${stamp(DateTime.fromISO(slot.start))}`,`DTEND:${stamp(DateTime.fromISO(slot.start).plus({minutes:slot.duration}))}`,`SUMMARY:${escape(slot.title)}`,'STATUS:TENTATIVE','TRANSP:TRANSPARENT','END:VEVENT');
  return [...lines,'END:VCALENDAR',''].join('\r\n');
}
