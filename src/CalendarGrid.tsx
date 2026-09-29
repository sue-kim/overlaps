import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { DateTime } from 'luxon';
import { CalendarDays, ChevronLeft, ChevronRight, CircleHelp, Check, Plus } from 'lucide-react';
import { timeLabel, wallTime, type City, type Slot } from './time';
import type { CalendarEvent } from './calendar';
import { layoutIntervals } from './layout';
import { workHoursInDay, isWorkHour } from './workHours';
const workColors=[['#d6edf2','#2c6572'],['#dce8f1','#365d78'],['#f2e5c9','#7a5b27'],['#e9def0','#6b4a7c'],['#dcece5','#386752'],['#f1e0db','#825345']];
const HOUR=48;
interface DragSelection {
  pointerId:number; element:HTMLButtonElement; column:HTMLElement; day:DateTime;
  anchorMinute:number; initialY:number; clientY:number; moved:boolean; lastRange:string;
  columnTop:number; preservePosition:boolean;
}
interface Props {
  selectionActive:boolean; showQuickSave:boolean; saveDisabled:boolean; selectionSaved:boolean; onSave:()=>void;
  showWorkHours:boolean; hiddenWorkCities:string[]; onToggleWorkHours:()=>void; onToggleWorkCity:(id:string)=>void;
  base:City; cities:City[]; week:DateTime; selected:DateTime; duration:number; h24:boolean; now:DateTime;
  slots:Slot[]; events:CalendarEvent[]; onSelect:(dt:DateTime)=>void; onWeek:(week:DateTime)=>void;
  onSelectRange:(dt:DateTime,minutes:number)=>void;
  onSlot:(slot:Slot)=>void; onEvent:(event:CalendarEvent)=>void;
}
export default function CalendarGrid({selectionActive,showQuickSave,saveDisabled,selectionSaved,onSave,showWorkHours,hiddenWorkCities,onToggleWorkHours,onToggleWorkCity,base,cities,week,selected,duration,h24,now,slots,events,onSelect,onSelectRange,onWeek,onSlot,onEvent}:Props) {
  const scroll=useRef<HTMLDivElement>(null);
  const keyboardMove=useRef(false);
  const drag=useRef<DragSelection|null>(null);
  const scrollFrame=useRef<number|null>(null);
  const suppressClick=useRef(false);
  const [dragging,setDragging]=useState(false);
  useEffect(()=>()=>{if(scrollFrame.current!==null)cancelAnimationFrame(scrollFrame.current);},[]);
  useLayoutEffect(()=>{
    const active=drag.current,container=scroll.current;
    if(!active?.preservePosition||!container)return;
    active.preservePosition=false;
    // Showing the preview caption must not move the calendar under the pointer.
    container.scrollTop+=active.column.getBoundingClientRect().top-active.columnTop;
  });

  function updateDrag(clientY:number) {
    const active=drag.current;if(!active)return;
    active.clientY=clientY;
    if(!active.moved) {
      if(Math.abs(clientY-active.initialY)<5)return;
      active.moved=true;setDragging(true);
    }
    const y=clientY-active.column.getBoundingClientRect().top;
    const endpoint=Math.max(0,Math.min(1440,Math.round(y/HOUR*2)*30));
    const first=Math.min(active.anchorMinute,endpoint);
    const last=Math.max(active.anchorMinute+30,endpoint);
    const atMinute=(minute:number)=>minute===1440?active.day.plus({days:1}).startOf('day'):wallTime(active.day.toISODate()!,`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`,active.day.zoneName!);
    const start=atMinute(first),end=atMinute(last);
    if(!start||!end)return;
    const minutes=end.diff(start,'minutes').minutes;
    const key=`${start.toISO()}/${minutes}`;
    if(minutes>0&&key!==active.lastRange){active.lastRange=key;onSelectRange(start,minutes);}
  }
  function autoScroll() {
    const active=drag.current,container=scroll.current;
    if(!active||!container)return;
    if(active.moved) {
      const bounds=container.getBoundingClientRect();
      const top=bounds.top+(container.querySelector('.week-header')?.clientHeight||0);
      const edge=28;
      const speed=active.clientY<top+edge?-Math.min(6,(top+edge-active.clientY)/4):active.clientY>bounds.bottom-edge?Math.min(6,(active.clientY-bounds.bottom+edge)/4):0;
      const before=container.scrollTop;
      container.scrollTop+=speed;
      if(container.scrollTop!==before)updateDrag(active.clientY);
    }
    scrollFrame.current=requestAnimationFrame(autoScroll);
  }
  function beginDrag(event:ReactPointerEvent<HTMLButtonElement>,day:DateTime,minute:number,dt:DateTime) {
    suppressClick.current=false;
    if(event.pointerType==='touch'||event.button!==0||!event.isPrimary||drag.current)return;
    const element=event.currentTarget,column=element.parentElement!;
    drag.current={pointerId:event.pointerId,element,column,day,anchorMinute:minute,initialY:event.clientY,clientY:event.clientY,moved:false,lastRange:'',columnTop:column.getBoundingClientRect().top,preservePosition:true};
    element.setPointerCapture(event.pointerId);
    element.focus({preventScroll:true});
    onSelect(dt);
    scrollFrame.current=requestAnimationFrame(autoScroll);
  }
  function finishDrag(event:ReactPointerEvent<HTMLButtonElement>) {
    const active=drag.current;if(!active||event.pointerId!==active.pointerId)return;
    if(event.type==='pointerup'&&active.moved)updateDrag(event.clientY);
    drag.current=null;suppressClick.current=true;setDragging(false);
    if(scrollFrame.current!==null){cancelAnimationFrame(scrollFrame.current);scrollFrame.current=null;}
    if(active.element.hasPointerCapture(active.pointerId))active.element.releasePointerCapture(active.pointerId);
  }
  const homeId=cities[0]?.id;
  const comparisonCities=cities.filter(city=>city.id!==homeId);
  const workCities=comparisonCities.filter(city=>!hiddenWorkCities.includes(city.id));
  const cityStyle=(id:string)=>{const color=workColors[cities.findIndex(c=>c.id===id)%workColors.length];return {'--work-bg':color[0],'--work-ink':color[1]} as React.CSSProperties;};
  const days=Array.from({length:7},(_,i)=>week.plus({days:i}));
  const railCities=[base,...cities.filter(c=>c.id!==base.id)].slice(0,3);
  const local=selected.setZone(base.zone);
  const railDay=local>=week&&local<week.plus({weeks:1})?local.startOf('day'):week;
  const hasOffsetChange=railCities.some(c=>days.some(day=>day.set({hour:12}).setZone(c.zone).offset!==week.set({hour:12}).setZone(c.zone).offset));
  const focusedTime=(local>=week&&local<week.plus({weeks:1})?local:week.set({hour:9})).set({minute:Math.floor(local.minute/30)*30,second:0,millisecond:0});
  useEffect(()=>{
    if(!keyboardMove.current)return;
    keyboardMove.current=false;
    const cell=scroll.current?.querySelector<HTMLButtonElement>(`[data-slot="${local.toFormat('yyyy-MM-dd HH:mm')}"]`);
    cell?.focus({preventScroll:true});cell?.scrollIntoView({block:'nearest',inline:'nearest'});
  },[selected.toISO()]);
  useEffect(()=>{
    const el=scroll.current;if(!el||!selectionActive||drag.current)return;
    const y=(local.hour+local.minute/60)*HOUR;
    if(y<el.scrollTop+20||y+Math.min(duration/60*HOUR,100)>el.scrollTop+el.clientHeight-75)el.scrollTop=Math.max(0,y-100);
  },[base.zone,selected.toISO(),duration,selectionActive]);
  const railWidth=railCities.length===1?64:railCities.length===2?100:140;
  const inWeek=local>=week && local<week.plus({days:7});
  const hasAllDay=events.some(e=>e.allDay);
  const monthLabel=week.month===days[6].month?week.toFormat('LLLL yyyy'):`${week.toFormat('LLL')} – ${days[6].toFormat('LLL yyyy')}`;
  function block(startValue:string,endValue:string,day:DateTime) {
    const start=DateTime.fromISO(startValue).setZone(base.zone),end=DateTime.fromISO(endValue).setZone(base.zone);
    if(start>=day.plus({days:1}) || end<=day) return null;
    const begin=start<day?0:start.hour*60+start.minute;
    const finish=end>=day.plus({days:1})?1440:end.hour*60+end.minute;
    return {top:begin/60*HOUR,height:Math.max(24,(finish-begin)/60*HOUR)};
  }
  return <section className="calendar-panel" data-dragging={dragging} aria-label="Weekly calendar">
    <a className="skip-calendar" href="#time-planner">Skip calendar to time controls</a>
    <div className="calendar-toolbar">
      <div className="calendar-title"><CalendarDays size={19}/><h2>{monthLabel}</h2><div className="week-nav"><button className="icon-button" aria-label="Previous week" onClick={()=>onWeek(week.minus({weeks:1}))}><ChevronLeft size={17}/></button><button className="icon-button" aria-label="Next week" onClick={()=>onWeek(week.plus({weeks:1}))}><ChevronRight size={17}/></button></div><button className="today-button" onClick={()=>{onWeek(now.setZone(base.zone).startOf('week'));onSelect(now);}}>Today</button></div>
    </div>
    <div className="work-hours-controls" aria-label="Work hours highlighting">
      <button type="button" className="work-hours-toggle" role="switch" aria-label="Highlight work hours" aria-checked={showWorkHours} onClick={onToggleWorkHours}><span className="switch-track" aria-hidden="true"><i/></span>Work hours</button>
      <div className="work-city-toggles">{comparisonCities.map(city=><button type="button" key={city.id} className="work-city-toggle" style={cityStyle(city.id)} aria-label={`Highlight work hours for ${city.name}`} aria-pressed={!hiddenWorkCities.includes(city.id)} disabled={!showWorkHours} onClick={()=>onToggleWorkCity(city.id)}><span className="work-city-check" aria-hidden="true">{!hiddenWorkCities.includes(city.id)&&<Check size={10}/>}</span>{city.name}</button>)}</div>
      <span className="work-hours-schedule">9am–6pm · Mon–Fri</span>
    </div>
    <>{hasOffsetChange&&<p className="dst-week-note">Clocks change this week. Side time labels follow {railDay.toFormat('ccc, LLL d')}; select a day to compare its exact times.</p>}</><div className="calendar-scroll" ref={scroll}>
      <div className="calendar-inner" style={{'--rail-width':`${railWidth}px`} as React.CSSProperties}>
        <div className="week-header">
          <div className="zone-labels">{railCities.map(c=><span key={c.id} className={c.id===base.id?'primary-zone':''} title={c.name}>{c.code}</span>)}</div>
          {days.map(day=><button key={day.toISODate()} className={`day-heading ${day.hasSame(now.setZone(base.zone),'day')?'is-today':''} ${selectionActive&&day.hasSame(local,'day')?'is-chosen':''}`} onClick={()=>{const dt=wallTime(day.toISODate()!,local.toFormat('HH:mm'),base.zone);if(dt)onSelect(dt);}}><span>{day.toFormat('ccc')}</span><strong>{day.day}</strong></button>)}
        </div>
        {hasAllDay&&<div className="all-day-row"><span>All day</span>{days.map(day=><div key={day.toISODate()}>{events.filter(e=>e.allDay&&e.start<=day.toISODate()!&&e.end>day.toISODate()!).map(e=><button key={e.id} onClick={()=>onEvent(e)}>{e.title}</button>)}</div>)}</div>}
        <div className="time-grid" style={{height:24*HOUR}}>
          <div className="time-rail">{Array.from({length:24},(_,hour)=><div className="hour-label-row" key={hour} style={{top:hour*HOUR}}>{railCities.map(c=>{const dt=railDay.set({hour}).setZone(c.zone);return <span key={c.id} className={`${c.id===base.id?'primary-zone':''} ${showWorkHours&&c.id!==homeId&&!hiddenWorkCities.includes(c.id)&&isWorkHour(dt,c.zone)?'work-hour-label':''}`} style={cityStyle(c.id)}>{h24?dt.toFormat('HH:mm'):dt.toFormat('h a').toLowerCase()}</span>;})}</div>)}</div>
          {days.map(day=><div className={`day-column ${day.weekday>5?'weekend':''}`} key={day.toISODate()}>
            {Array.from({length:48},(_,half)=>{const hour=Math.floor(half/2),minute=half%2*30;const dt=wallTime(day.toISODate()!,`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`,base.zone);return <button key={half} className={`time-cell ${hour>=9&&hour<18&&day.weekday<6?'working':''} ${half%2===0?'on-hour':''}`} style={{top:half*HOUR/2,height:HOUR/2}} disabled={!dt} tabIndex={dt?.hasSame(focusedTime,'minute')?0:-1} data-slot={dt?.toFormat('yyyy-MM-dd HH:mm')} onKeyDown={e=>{if(!dt)return;const changes:Record<string,{days?:number;minutes?:number}>={ArrowRight:{days:1},ArrowLeft:{days:-1},ArrowDown:{minutes:30},ArrowUp:{minutes:-30}};if(changes[e.key]){e.preventDefault();keyboardMove.current=true;onSelect(dt.plus(changes[e.key]));}}} onPointerDown={e=>dt&&beginDrag(e,day,half*30,dt)} onPointerMove={e=>{if(drag.current?.pointerId===e.pointerId)updateDrag(e.clientY);}} onPointerUp={finishDrag} onPointerCancel={finishDrag} onLostPointerCapture={finishDrag} onClick={e=>{if(suppressClick.current&&e.detail!==0){suppressClick.current=false;return;}if(dt)onSelect(dt);}} aria-label={`${day.toFormat('cccc, LLLL d')}, ${hour}:${String(minute).padStart(2,'0')} in ${base.name}. Use arrow keys to move.`} />;})}
            {showWorkHours&&workCities.map((city,index)=>workHoursInDay(day,city.zone).map((period,i)=>{
              const position=block(period.start.toISO()!,period.end.toISO()!,day);
              if(position){const end=period.end.setZone(base.zone);position.height=(end>=day.plus({days:1})?1440:end.hour*60+end.minute)/60*HOUR-position.top;}
              return position&&<div key={`${city.id}-${i}`} className="work-hours-band" data-work-city={city.id} style={{...position,...cityStyle(city.id),left:`${index/workCities.length*100}%`,width:`${100/workCities.length}%`}} aria-hidden="true"><span>{city.code}</span></div>;
            }))}
            {(()=>{
              const entries=[...events.filter(e=>!e.allDay).map(event=>({id:event.id,event,slot:null as Slot|null,style:block(event.start,event.end,day)})),...slots.map(slot=>({id:slot.id,event:null as CalendarEvent|null,slot,style:block(slot.start,DateTime.fromISO(slot.start).plus({minutes:slot.duration}).toISO()!,day)}))].filter(item=>item.style!==null);
              const positions=layoutIntervals(entries.map(item=>({id:item.id,start:item.style!.top,end:item.style!.top+item.style!.height})));
              return entries.map(({id,event,slot,style})=>{
                const lane=positions.get(id)!;
                return <button key={id} className={`calendar-event ${event?'imported-event':'saved-event'}`} style={{...style!,left:`calc(${lane.column/lane.columns*100}% + 3px)`,width:`calc(${100/lane.columns}% - 6px)`,right:'auto'}} onClick={()=>event?onEvent(event):onSlot(slot!)} title={event?`${event.title} · ${event.sourceName}`:slot!.title}><strong>{event?event.title:'Available'}</strong>{style!.height>35&&<span>{timeLabel(DateTime.fromISO(event?event.start:slot!.start).setZone(base.zone),h24)}</span>}</button>;
              });
            })()}
            {selectionActive&&inWeek&&(()=>{
              const style=block(selected.toISO()!,selected.plus({minutes:duration}).toISO()!,day);
              if(!style)return null;
              return <div className="selection-event" data-saved={selectionSaved} style={style}><strong>{timeLabel(local,h24)}</strong>
                {showQuickSave&&!dragging&&day.hasSame(local,'day')?<button type="button" className="calendar-quick-save" disabled={saveDisabled||selectionSaved} data-saved={selectionSaved} aria-label={selectionSaved?'Selected calendar time saved':'Save selected calendar time'} title={selectionSaved?'Saved':'Save time'} onClick={onSave}>{selectionSaved?<Check size={14}/>:<Plus size={14}/>}</button>:<span className="selection-dot"/>}
              </div>;
            })()}
            {day.hasSame(now.setZone(base.zone),'day')&&<div className="now-line" style={{top:(now.setZone(base.zone).hour+now.minute/60)*HOUR}}><i/></div>}
          </div>)}
        </div>
      </div>
    </div>
    <div className="calendar-legend"><div><span><i className="legend-work"/>{showWorkHours?'Colored bands: local work hours':`9–6 in ${base.name}`}</span><span><i className="legend-available"/>Your availability</span>{events.length>0&&<span><i className="legend-calendar"/>Calendar events</span>}</div><span className="calendar-hint"><CircleHelp size={13}/>Click or drag to select a time</span></div>
  </section>;
}
