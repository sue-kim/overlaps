import { DateTime } from 'luxon';

export interface WorkSchedule { start:string; end:string; days:number[] }
export interface CityWorkHours extends WorkSchedule { visible:boolean }
export type WorkHoursPreferences=Record<string,CityWorkHours>;
export const defaultWorkHours=(visible=true):CityWorkHours=>({start:'09:00',end:'18:00',days:[1,2,3,4,5],visible});
const validTime=(value:unknown):value is string=>typeof value==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export function validWorkSchedule(schedule:WorkSchedule) {
  return validTime(schedule.start)&&validTime(schedule.end)&&schedule.start!==schedule.end;
}
export function normalizeWorkHours(value:unknown):WorkHoursPreferences {
  if(!value||typeof value!=='object'||Array.isArray(value))return {};
  const result:WorkHoursPreferences={};
  for(const [id,entry] of Object.entries(value)) {
    if(!entry||typeof entry!=='object')continue;
    const item=entry as Partial<CityWorkHours>;
    if(!validTime(item.start)||!validTime(item.end)||item.start===item.end||!Array.isArray(item.days)||typeof item.visible!=='boolean')continue;
    result[id]={start:item.start,end:item.end,days:[...new Set(item.days.filter(day=>Number.isInteger(day)&&day>=1&&day<=7))].sort(),visible:item.visible};
  }
  return result;
}
function workPeriod(day:DateTime,schedule:WorkSchedule) {
  const [startHour,startMinute]=schedule.start.split(':').map(Number);
  const [endHour,endMinute]=schedule.end.split(':').map(Number);
  return {
    start:day.set({hour:startHour,minute:startMinute}),
    end:(schedule.end<schedule.start?day.plus({days:1}):day).set({hour:endHour,minute:endMinute})
  };
}

/** Local workdays belong to the shift's start date, including overnight shifts. */
export function workHoursInDay(day:DateTime, zone:string, schedule:WorkSchedule=defaultWorkHours()) {
  if(!validWorkSchedule(schedule))return [];
  const from=day.startOf('day'), to=from.plus({days:1});
  const periods:{start:DateTime;end:DateTime}[]=[];
  for(let local=from.setZone(zone).startOf('day').minus({days:1});local<to;local=local.plus({days:1})) {
    if(!schedule.days.includes(local.weekday)) continue;
    const {start,end}=workPeriod(local,schedule);
    if(start<to&&end>from) periods.push({start:start<from?from:start,end:end>to?to:end});
  }
  return periods;
}

export function isWorkHour(instant:DateTime,zone:string,schedule:WorkSchedule=defaultWorkHours()) {
  if(!validWorkSchedule(schedule))return false;
  const local=instant.setZone(zone);
  return [local.startOf('day').minus({days:1}),local.startOf('day')].some(day=>{
    if(!schedule.days.includes(day.weekday))return false;
    const {start,end}=workPeriod(day,schedule);
    return local>=start&&local<end;
  });
}
