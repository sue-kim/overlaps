import { useId, useLayoutEffect, useRef, useState } from 'react';
import { Check, Minus, Plus, Settings2, X } from 'lucide-react';
import type { City } from './time';
import { getWorkColor, workColors, validWorkSchedule, type WorkHoursPreferences } from './workHours';

const weekdays=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
interface Props {
  cities:City[];
  preferences:WorkHoursPreferences;
  onSave:(preferences:WorkHoursPreferences)=>void;
}

export default function WorkHoursSettings({cities,preferences,onSave}:Props) {
  const id=useId();
  const popover=useRef<HTMLDivElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  const colorToggle=useRef<HTMLButtonElement>(null);
  const [colorsExpanded,setColorsExpanded]=useState(false);
  const [open,setOpen]=useState(false);
  const [cityId,setCityId]=useState(cities[0].id);
  const [draft,setDraft]=useState(preferences);
  const [position,setPosition]=useState({top:16,left:16});
  const city=cities.find(item=>item.id===cityId)||cities[0];
  const schedule=draft[city.id]||preferences[city.id];
  const selectedColor=getWorkColor(schedule.color,cities.findIndex(item=>item.id===city.id));
  const colorOptions=workColors.some(color=>color.id===selectedColor.id)?workColors:[...workColors,selectedColor];
  const colorOwner=(band:string)=>cities.find((item,index)=>item.id!==city.id&&getWorkColor((draft[item.id]||preferences[item.id]).color,index).band===band);
  const invalidCities=cities.filter(item=>!validWorkSchedule(draft[item.id]||preferences[item.id]));
  function updateSchedule(changes:Partial<typeof schedule>) {
    setDraft(old=>({...old,[city.id]:{...schedule,...changes,visible:true}}));
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
        <div className="work-settings-times">
          <label>Start<input type="time" required step="900" value={schedule.start} aria-invalid={!validWorkSchedule(schedule)} onChange={event=>updateSchedule({start:event.target.value})}/></label>
          <label>End<input type="time" required step="900" value={schedule.end} aria-invalid={!validWorkSchedule(schedule)} onChange={event=>updateSchedule({end:event.target.value})}/></label>
        </div>
        <div className="work-settings-colors" role="group" aria-labelledby={`${id}-color`}><span id={`${id}-color`}>Color</span><div id={`${id}-color-options`}>{(colorsExpanded?colorOptions:[selectedColor]).map(color=><button key={color.id} type="button" aria-label={color.name} title={colorOwner(color.band)?`${color.name} · used by ${colorOwner(color.band)!.name}`:color.name} disabled={!!colorOwner(color.band)} aria-pressed={selectedColor.id===color.id} style={{'--swatch-color':color.band} as React.CSSProperties} onClick={()=>{updateSchedule({color:color.id});if(colorsExpanded){setColorsExpanded(false);colorToggle.current?.focus();}}}><span aria-hidden="true">{selectedColor.id===color.id&&<Check size={14}/>}</span></button>)}</div><button ref={colorToggle} type="button" className="work-color-expand" aria-label={colorsExpanded?'Hide colors':'Show colors'} title={colorsExpanded?'Hide colors':'Show colors'} aria-expanded={colorsExpanded} aria-controls={`${id}-color-options`} onClick={()=>setColorsExpanded(value=>!value)}>{colorsExpanded?<Minus size={16}/>:<Plus size={16}/>}</button></div>
        {!schedule.days.length?<p className="work-settings-note">No working days selected for {city.name}.</p>:schedule.end<schedule.start&&<p className="work-settings-note">Ends the following day.</p>}
        {invalidCities.length>0&&<p className="work-settings-error" role="alert">Choose different start and end times for {invalidCities.map(item=>item.name).join(', ')}.</p>}
        </div>
        <div className="work-settings-actions"><button type="button" className="button" onClick={close}>Cancel</button><button type="submit" className="button button-primary" disabled={invalidCities.length>0}>Save</button></div>
      </form>
    </div>
  </>;
}
