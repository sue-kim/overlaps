import { DateTime } from 'luxon';

export interface WorkSchedule { start:string; end:string; days:number[] }
export const workColors=[
  {id:'mint',name:'Green',background:'#deefe3',ink:'#275d3d',band:'#31875b'},
  {id:'rose',name:'Rose',background:'#f8e0e6',ink:'#8a354d',band:'#cc5273'},
  {id:'amber',name:'Gold',background:'#f8edca',ink:'#73520d',band:'#d8a52a'},
  {id:'charcoal',name:'Graphite',background:'#e9e6e2',ink:'#575047',band:'#797168'}
] as const;
export type WorkColorId=typeof workColors[number]['id'];
const legacyWorkColors:Record<string,WorkColorId>={coral:'rose',olive:'mint',clay:'charcoal'};
function colorById(color:unknown) {
  return typeof color==='string'?workColors.find(item=>item.id===(legacyWorkColors[color]||color)):undefined;
}
export const getWorkColor=(color:WorkColorId|undefined,index:number)=>colorById(color)||workColors[Math.max(0,index)%workColors.length];
export interface CityWorkHours extends WorkSchedule { visible:boolean; color?:WorkColorId }
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
    const color=colorById(item.color);
    result[id]={start:item.start,end:item.end,days:[...new Set(item.days.filter(day=>Number.isInteger(day)&&day>=1&&day<=7))].sort(),visible:item.visible,...(color?{color:color.id}:{})};
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

/** Join matching day segments so each continuous work-hour band has one label. */
export function workBandsInWeek(week:DateTime,zone:string,schedule:WorkSchedule=defaultWorkHours()) {
  const bands:{firstDay:number;lastDay:number;startMinute:number;endMinute:number}[]=[];
  for(let index=0;index<7;index++) {
    const day=week.plus({days:index}).startOf('day');
    for(const period of workHoursInDay(day,zone,schedule)) {
      const start=period.start.setZone(day.zone),end=period.end.setZone(day.zone);
      const startMinute=start.hour*60+start.minute;
      const endMinute=end>=day.plus({days:1})?1440:end.hour*60+end.minute;
      if(endMinute<=startMinute)continue;
      const adjoining=bands.find(band=>band.lastDay===index-1&&band.startMinute===startMinute&&band.endMinute===endMinute);
      if(adjoining)adjoining.lastDay=index;
      else bands.push({firstDay:index,lastDay:index,startMinute,endMinute});
    }
  }
  return bands;
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
