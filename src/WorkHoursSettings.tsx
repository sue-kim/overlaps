import { useId, useLayoutEffect, useRef, useState } from 'react';
import { Check, Settings2, X } from 'lucide-react';
import type { City } from './time';
import { getWorkColor, workColors, validWorkSchedule, type WorkHoursPreferences } from './workHours';

const weekdays=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
interface Props {
  cities:City[];
  h24:boolean;
  preferences:WorkHoursPreferences;
  onSave:(preferences:WorkHoursPreferences)=>void;
}

export default function WorkHoursSettings({cities,h24,preferences,onSave}:Props) {
  const id=useId();
  const popover=useRef<HTMLDivElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  const palette=useRef<HTMLDivElement>(null);
  const paletteHovered=useRef(false);
  const [colorsExpanded,setColorsExpanded]=useState(false);
  const [open,setOpen]=useState(false);
  const [cityId,setCityId]=useState(cities[0].id);
  const [draft,setDraft]=useState(preferences);
  const [position,setPosition]=useState({top:16,left:16});
  const city=cities.find(item=>item.id===cityId)||cities[0];
  const schedule=draft[city.id]||preferences[city.id];
  const selectedColor=getWorkColor(schedule.color,cities.findIndex(item=>item.id===city.id));
  const minutes=(time:string)=>{const [hour,minute]=time.split(':').map(Number);return hour*60+minute;};
  const startMinute=minutes(schedule.start),endMinute=minutes(schedule.end)||1440;
  const timeText=(value:number)=>{
    const hour=Math.floor(value/60)%24,minute=String(value%60).padStart(2,'0');
    return h24?`${String(hour).padStart(2,'0')}:${minute}`:`${hour%12||12}:${minute} ${hour<12?'AM':'PM'}`;
  };
  function updateTime(field:'start'|'end',value:number) {
    const bounded=field==='start'?Math.min(value,1425):value;
    const time=`${String(Math.floor(bounded/60)%24).padStart(2,'0')}:${String(bounded%60).padStart(2,'0')}`;
    if(time!==schedule[field==='start'?'end':'start'])updateSchedule({[field]:time});
  }
  const colorOptions=workColors.some(color=>color.id===selectedColor.id)?workColors:[...workColors,selectedColor];
  const colorOwner=(band:string)=>cities.find((item,index)=>item.id!==city.id&&getWorkColor((draft[item.id]||preferences[item.id]).color,index).band===band);
  const invalidCities=cities.filter(item=>!validWorkSchedule(draft[item.id]||preferences[item.id]));
  function updateSchedule(changes:Partial<typeof schedule>) {
    setDraft(old=>({...old,[city.id]:{...schedule,...changes,visible:true}}));
  }
  function selectColor(color:typeof selectedColor) {
    const owner=colorOwner(color.band);
    setDraft(old=>({...old,
      ...(owner?{[owner.id]:{...(old[owner.id]||preferences[owner.id]),color:selectedColor.id}}:{}),
      [city.id]:{...(old[city.id]||preferences[city.id]),color:color.id,visible:true}
    }));
  }
  useLayoutEffect(()=>{
    if(!open)return;
    const place=()=>{
      const bounds=trigger.current!.getBoundingClientRect();
      const width=Math.min(360,window.innerWidth-32);
      const height=Math.min(popover.current!.scrollHeight+2,window.innerHeight-32);
      setPosition({left:Math.max(16,Math.min(bounds.right-width,window.innerWidth-width-16)),top:Math.max(16,Math.min(bounds.bottom+8,window.innerHeight-height-16))});
    };
    place();window.addEventListener('resize',place);
    return()=>window.removeEventListener('resize',place);
  },[open,draft,city.id,colorsExpanded]);
  function prepare() {
    if(open)return;
    setDraft(preferences);
    setColorsExpanded(false);
    const bounds=trigger.current!.getBoundingClientRect();
    const width=Math.min(360,window.innerWidth-32);
    setPosition({left:Math.max(16,Math.min(bounds.right-width,window.innerWidth-width-16)),top:Math.max(16,Math.min(bounds.bottom+8,window.innerHeight-390))});
  }
  function close() {popover.current?.hidePopover();}
  return <>
    <button ref={trigger} type="button" className="work-settings-button" popoverTarget={id} onClick={prepare} aria-label="Work hours settings" aria-expanded={open} aria-controls={id} aria-haspopup="dialog"><Settings2 size={15}/>Settings</button>
    <div ref={popover} id={id} popover="auto" className="work-settings-popover" role="dialog" aria-labelledby={`${id}-title`} style={{...position,maxHeight:`calc(100dvh - ${position.top+16}px)`}} onToggle={event=>{
      const visible=event.newState==='open';setOpen(visible);
      if(visible)popover.current?.querySelector<HTMLButtonElement>('[role=tab][aria-selected=true]')?.focus({preventScroll:true});
    }}>
      <form onSubmit={event=>{event.preventDefault();if(invalidCities.length)return;onSave({...draft,[city.id]:{...schedule,visible:true}});close();}}>
        <div className="work-settings-heading"><h3 id={`${id}-title`}>Work hours</h3><button type="button" className="icon-button" onClick={close} aria-label="Close work hours settings"><X size={17}/></button></div>
        <div className="work-settings-cities" role="tablist" aria-label="City" onKeyDown={event=>{
          const index=cities.findIndex(item=>item.id===city.id);
          const next=event.key==='ArrowRight'?(index+1)%cities.length:event.key==='ArrowLeft'?(index-1+cities.length)%cities.length:event.key==='Home'?0:event.key==='End'?cities.length-1:null;
          if(next===null)return;
          event.preventDefault();setCityId(cities[next].id);setColorsExpanded(false);
          event.currentTarget.querySelectorAll<HTMLButtonElement>('[role=tab]')[next]?.focus();
        }}>{cities.map((item,index)=><button key={item.id} id={`${id}-${item.id}`} type="button" role="tab" aria-selected={city.id===item.id} aria-controls={`${id}-schedule`} tabIndex={city.id===item.id?0:-1} title={index===0?`${item.name} (Home)`:item.name} onClick={()=>{setCityId(item.id);setColorsExpanded(false);}}>{item.name}</button>)}</div>
        <div id={`${id}-schedule`} role="tabpanel" aria-labelledby={`${id}-${city.id}`}>
        <fieldset className="work-settings-days"><legend>Working days</legend><div>{weekdays.map((day,index)=>{
          const selected=schedule.days.includes(index+1);
          return <button key={day} type="button" aria-label={day} aria-pressed={selected} onClick={()=>updateSchedule({days:selected?schedule.days.filter(value=>value!==index+1):[...schedule.days,index+1].sort()})}>{day.slice(0,3)}</button>;
        })}</div></fieldset>
        <div className="work-settings-hours" role="group" aria-label="Working hours">
          <div className="work-hours-value"><span>Hours</span><output>{timeText(startMinute)} – {timeText(endMinute)}</output></div>
          <div className="work-hours-slider">
            <div className="work-hours-track" aria-hidden="true">
              {endMinute>startMinute?<span style={{left:`${startMinute/14.4}%`,width:`${(endMinute-startMinute)/14.4}%`}}/>:<><span style={{width:`${endMinute/14.4}%`}}/><span style={{left:`${startMinute/14.4}%`,right:0}}/></>}
            </div>
            <input type="range" min="0" max="1440" step="15" value={startMinute} aria-label="Work starts" aria-valuetext={timeText(startMinute)} onChange={event=>updateTime('start',Number(event.target.value))}/>
            <input type="range" min="0" max="1440" step="15" value={endMinute} aria-label="Work ends" aria-valuetext={timeText(endMinute)} onChange={event=>updateTime('end',Number(event.target.value))}/>
          </div>
          <div className="work-hours-scale" aria-hidden="true"><span>{h24?'00:00':'12 AM'}</span><span>{h24?'12:00':'12 PM'}</span><span>{h24?'24:00':'12 AM'}</span></div>
        </div>
        <div className="work-settings-colors" role="group" aria-labelledby={`${id}-color`}>
          <span id={`${id}-color`}>Color</span>
          <div ref={palette} className="work-color-palette" data-expanded={colorsExpanded} style={{'--color-count':colorOptions.length} as React.CSSProperties}
            onPointerEnter={event=>{if(event.pointerType==='mouse'||event.pointerType==='pen'){paletteHovered.current=true;setColorsExpanded(true);}}}
            onPointerLeave={event=>{if(event.pointerType==='touch')return;paletteHovered.current=false;if(!palette.current?.querySelector(':focus-visible'))setColorsExpanded(false);}}
            onFocus={event=>{if(event.target.matches(':focus-visible'))setColorsExpanded(true);}}
            onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget)&&!paletteHovered.current)setColorsExpanded(false);}}>
            {colorOptions.map((color,index)=><button key={color.id} type="button" aria-label={color.name} title={color.name} aria-pressed={selectedColor.id===color.id} aria-hidden={!colorsExpanded&&selectedColor.id!==color.id} tabIndex={!colorsExpanded&&selectedColor.id!==color.id?-1:0} style={{'--swatch-color':color.background,'--swatch-band':color.band,'--swatch-ink':color.ink,'--color-index':index} as React.CSSProperties} onClick={()=>{if(!colorsExpanded){setColorsExpanded(true);return;}selectColor(color);if(!paletteHovered.current)setColorsExpanded(false);}}><span aria-hidden="true">{selectedColor.id===color.id&&<Check size={14}/>}</span></button>)}
          </div>
        </div>
        {!schedule.days.length?<p className="work-settings-note">No working days selected for {city.name}.</p>:schedule.end<schedule.start&&<p className="work-settings-note">Ends the following day.</p>}
        {invalidCities.length>0&&<p className="work-settings-error" role="alert">Choose different start and end times for {invalidCities.map(item=>item.name).join(', ')}.</p>}
        </div>
        <div className="work-settings-actions"><button type="button" className="button" onClick={close}>Cancel</button><button type="submit" className="button button-primary" disabled={invalidCities.length>0}>Save</button></div>
      </form>
    </div>
  </>;
}
