import { useId, useLayoutEffect, useRef, useState } from 'react';
import { Check, Settings2, X } from 'lucide-react';
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
  const [open,setOpen]=useState(false);
  const [cityId,setCityId]=useState(cities[0].id);
  const [draft,setDraft]=useState(preferences);
  const [position,setPosition]=useState({top:16,left:16});
  const city=cities.find(item=>item.id===cityId)||cities[0];
  const schedule=draft[city.id]||preferences[city.id];
  const selectedColor=getWorkColor(schedule.color,cities.findIndex(item=>item.id===city.id));
  const invalidCities=cities.filter(item=>!validWorkSchedule(draft[item.id]||preferences[item.id]));
  function updateSchedule(changes:Partial<typeof schedule>) {
    setDraft(old=>({...old,[city.id]:{...schedule,...changes,visible:true}}));
  }
  useLayoutEffect(()=>{
    if(!open)return;
    const place=()=>{
      const bounds=trigger.current!.getBoundingClientRect();
      const width=Math.min(420,window.innerWidth-32);
      const height=Math.min(popover.current!.scrollHeight+2,window.innerHeight-32);
      setPosition({left:Math.max(16,Math.min(bounds.right-width,window.innerWidth-width-16)),top:Math.max(16,Math.min(bounds.bottom+8,window.innerHeight-height-16))});
    };
    place();window.addEventListener('resize',place);
    return()=>window.removeEventListener('resize',place);
  },[open,draft,city.id]);
  function prepare() {
    if(open)return;
    setDraft(preferences);
    const bounds=trigger.current!.getBoundingClientRect();
    const width=Math.min(420,window.innerWidth-32);
    setPosition({left:Math.max(16,Math.min(bounds.right-width,window.innerWidth-width-16)),top:Math.max(16,Math.min(bounds.bottom+8,window.innerHeight-390))});
  }
  function close() {popover.current?.hidePopover();}
  return <>
    <button ref={trigger} type="button" className="work-settings-button" popoverTarget={id} onClick={prepare} aria-label="Work hours settings" aria-expanded={open} aria-controls={id} aria-haspopup="dialog"><Settings2 size={15}/>Settings</button>
    <div ref={popover} id={id} popover="auto" className="work-settings-popover" role="dialog" aria-labelledby={`${id}-title`} style={{...position,maxHeight:`calc(100dvh - ${position.top+16}px)`}} onToggle={event=>{
      const visible=event.newState==='open';setOpen(visible);
      if(visible)popover.current?.querySelector('select')?.focus({preventScroll:true});
    }}>
      <form onSubmit={event=>{event.preventDefault();if(invalidCities.length)return;onSave({...draft,[city.id]:{...schedule,visible:true}});close();}}>
        <div className="work-settings-heading"><h3 id={`${id}-title`}>Work hours</h3><button type="button" className="icon-button" onClick={close} aria-label="Close work hours settings"><X size={17}/></button></div>
        <p className="work-settings-description">Set local working days and hours. Saving shows them on the calendar.</p>
        <label className="work-settings-city">City<select aria-label="City" value={city.id} onChange={event=>setCityId(event.target.value)}>{cities.map((item,index)=><option key={item.id} value={item.id}>{item.name}{index===0?' (Home)':''}</option>)}</select></label>
        <div className="work-settings-colors" role="group" aria-labelledby={`${id}-color`}><span id={`${id}-color`}>Color</span><div>{workColors.map(color=><button key={color.id} type="button" aria-label={color.name} title={color.name} aria-pressed={selectedColor.id===color.id} style={{'--swatch-color':color.band,'--swatch-check':color.id==='amber'?color.ink:'#fff'} as React.CSSProperties} onClick={()=>updateSchedule({color:color.id})}><span aria-hidden="true">{selectedColor.id===color.id&&<Check size={14}/>}</span></button>)}</div></div>
        <fieldset className="work-settings-days"><legend>Working days</legend><div>{weekdays.map((day,index)=>{
          const selected=schedule.days.includes(index+1);
          return <button key={day} type="button" aria-label={day} aria-pressed={selected} onClick={()=>updateSchedule({days:selected?schedule.days.filter(value=>value!==index+1):[...schedule.days,index+1].sort()})}>{day.slice(0,3)}</button>;
        })}</div></fieldset>
        <div className="work-settings-times">
          <label>Start<input type="time" required step="900" value={schedule.start} aria-invalid={!validWorkSchedule(schedule)} onChange={event=>updateSchedule({start:event.target.value})}/></label>
          <label>End<input type="time" required step="900" value={schedule.end} aria-invalid={!validWorkSchedule(schedule)} onChange={event=>updateSchedule({end:event.target.value})}/></label>
        </div>
        {!schedule.days.length?<p className="work-settings-note">No working days selected for {city.name}.</p>:schedule.end<schedule.start&&<p className="work-settings-note">Ends the following day.</p>}
        {invalidCities.length>0&&<p className="work-settings-error" role="alert">Choose different start and end times for {invalidCities.map(item=>item.name).join(', ')}.</p>}
        <div className="work-settings-actions"><button type="button" className="button" onClick={close}>Cancel</button><button type="submit" className="button button-primary" disabled={invalidCities.length>0}>Save changes</button></div>
      </form>
    </div>
  </>;
}
