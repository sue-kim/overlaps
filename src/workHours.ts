import { DateTime } from 'luxon';

export interface WorkSchedule { start:string; end:string; days:number[] }
// Keep the stored IDs stable when updating the palette.
export const workColors=[
  {id:'mint',name:'Blue',background:'#dceafb',ink:'#194c86',band:'#2878d0'},
  {id:'rose',name:'Teal',background:'#d8f0ec',ink:'#075a54',band:'#008b83'},
  {id:'amber',name:'Purple',background:'#eae1fa',ink:'#503288',band:'#805ad5'},
  {id:'charcoal',name:'Orange',background:'#f9e4d7',ink:'#87411c',band:'#d46732'},
  {id:'ochre',name:'Gold',background:'#f5ebc7',ink:'#695000',band:'#ad8300'},
  {id:'mauve',name:'Pink',background:'#f8dfeb',ink:'#822e56',band:'#c44882'},
  {id:'sage',name:'Green',background:'#e1efd8',ink:'#315d22',band:'#4e8f38'},
  {id:'indigo',name:'Indigo',background:'#e0e4f7',ink:'#303b82',band:'#4856bd'}
] as const;
export type WorkColorId=typeof workColors[number]['id'] | `#${string}`;
const legacyWorkColors:Record<string,WorkColorId>={coral:'rose',olive:'mint',clay:'charcoal'};
function colorById(color:unknown) {
  if(typeof color==='string'&&/^#[0-9a-f]{6}$/i.test(color)) {
    const hex=color.toLowerCase() as WorkColorId;
    const channels=[1,3,5].map(start=>parseInt(hex.slice(start,start+2),16));
    const background='#'+channels.map(channel=>Math.round(channel*.14+255*.86).toString(16).padStart(2,'0')).join('');
    return {id:hex,name:'Custom',band:hex,background,ink:'#243f47'};
  }
  return typeof color==='string'?workColors.find(item=>item.id===(legacyWorkColors[color]||color)):undefined;
}
function generatedColor(index:number):WorkColorId {
  const hue=(index*137.508)%360;
  const saturation=.62+(Math.floor(index/36)%3)*.06;
  const lightness=.40+(Math.floor(index/12)%3)*.07;
  const a=saturation*Math.min(lightness,1-lightness);
  const channel=(offset:number)=>{
    const k=(offset+hue/30)%12;
    return Math.round(255*(lightness-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,'0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}
export const getWorkColor=(color:WorkColorId|undefined,index:number)=>colorById(color)||workColors[Math.max(0,index)]||colorById(generatedColor(index))!;
export interface CityWorkHours extends WorkSchedule { visible:boolean; color?:WorkColorId }
export type WorkHoursPreferences=Record<string,CityWorkHours>;
export const defaultWorkHours=(visible=true):CityWorkHours=>({start:'09:00',end:'18:00',days:[1,2,3,4,5],visible});
/** Preserve existing distinct colors, then replace duplicates with unused colors. */
export function assignWorkColors(preferences:WorkHoursPreferences,cityIds:string[]):WorkHoursPreferences {
  const result={...preferences};
  const used=new Set<string>();
  const pending:string[]=[];
  for(const [index,id] of cityIds.entries()) {
    const preference=preferences[id]||defaultWorkHours(index!==0);
    const color=preference.color?getWorkColor(preference.color,index):undefined;
    result[id]={...preference};
    if(color&&!used.has(color.band)) {
      used.add(color.band);result[id].color=color.id;
    } else pending.push(id);
  }
  let index=0;
  for(const id of pending) {
    let color=getWorkColor(undefined,index++);
    while(used.has(color.band))color=getWorkColor(undefined,index++);
    result[id].color=color.id;used.add(color.band);
  }
  return result;
}
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
