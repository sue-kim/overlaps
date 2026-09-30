import { useEffect, useMemo, useRef, useState } from 'react';
import { DateTime } from 'luxon';
import { ArrowDownToLine, ArrowRight, CalendarDays, Check, Clock3, Copy, House, Link, LoaderCircle, Moon, Plus, RefreshCw, Search, ShieldCheck, Sun, Trash2, Upload, X } from 'lucide-react';
import { cities, initialCityIds, timeLabel, utcLabel, relativeOffset, dayDifference, availabilityText, slotsToICS, mergeSlots, isSlotCovered, type Slot } from './time';
import { calendarName, expandCalendar, validateICS, type CalendarSource, type CalendarEvent } from './calendar';
import CalendarGrid from './CalendarGrid';
import { defaultWorkHours, getWorkColor, normalizeWorkHours, type WorkHoursPreferences } from './workHours';
function initial<T>(key:string,fallback:T):T {try{const value=localStorage.getItem(key);return value?JSON.parse(value):fallback;}catch{return fallback;}}
function AnalogClock({time,night}:{time:DateTime;night:boolean}) {return <div className={`analog-clock ${night?'night':''}`} aria-hidden="true"><i className="clock-tick top"/><i className="clock-tick right"/><i className="clock-tick bottom"/><i className="clock-tick left"/><i className="clock-hand hour" style={{transform:`rotate(${(time.hour%12)*30+time.minute/2}deg)`}}/><i className="clock-hand minute" style={{transform:`rotate(${time.minute*6}deg)`}}/><i className="clock-center"/></div>;}
function Modal({title,onClose,children,className=''}:{title:string;onClose:()=>void;children:React.ReactNode;className?:string}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close();},[]);
  return <dialog ref={ref} className={`modal ${className}`} onCancel={onClose} onClick={e=>{if(e.target===ref.current)onClose();}} aria-label={title}><div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={20}/></button></div>{children}</dialog>;
}
export default function App() {
  const [cityIds,setCityIds]=useState<string[]>(()=>initialCityIds(initial('overlap-cities',null)));
  const places=cityIds.map(id=>cities.find(c=>c.id===id)!);
  const home=places[0];
  const [baseId,setBaseId]=useState(()=>initial('overlap-base',home.id));
  const base=places.find(c=>c.id===baseId)||home;
  const [copyCityId,setCopyCityId]=useState<string>(()=>{const saved=initial('overlap-copy-city',base.id);return places.some(city=>city.id===saved)?saved:base.id;});
  const copyCity=places.find(city=>city.id===copyCityId)||home;
  const [now,setNow]=useState(DateTime.now());
  const [selected,setSelected]=useState<DateTime>(DateTime.now().startOf('minute'));
  const [hasSelection,setHasSelection]=useState(false);
  const [live,setLive]=useState(true);
  const [weekDate,setWeekDate]=useState(DateTime.now().setZone(base.zone).startOf('week').toISODate()!);
  const week=DateTime.fromISO(weekDate,{zone:base.zone}).startOf('week');
  const [duration,setDuration]=useState(30);
  const [h24,setH24]=useState<boolean>(()=>initial<boolean>('overlap-24h',false)===true);
  const [workPreferences,setWorkPreferences]=useState<WorkHoursPreferences>(()=>{
    const saved=initial<unknown>('overlap-work-preferences',null);
    if(saved!==null){
      const restored=normalizeWorkHours(saved);
      return {...restored,...Object.fromEntries(places.map((city,index)=>{
        const preference=restored[city.id]||defaultWorkHours(index!==0);
        return [city.id,{...preference,color:getWorkColor(preference.color,index).id}];
      }))};
    }
    const enabled=initial<boolean>('overlap-work-hours',true)!==false;
    const hidden=initial<unknown>('overlap-hidden-work-cities',[]);
    return Object.fromEntries(places.map((city,index)=>[city.id,{...defaultWorkHours(enabled&&index!==0&&!(Array.isArray(hidden)&&hidden.includes(city.id))),color:getWorkColor(undefined,index).id}]));
  });
  const workHours=Object.fromEntries(places.map((city,index)=>[city.id,workPreferences[city.id]||defaultWorkHours(index!==0)]));
  const [storedSlots,setSlots]=useState<Slot[]>(()=>{const value=initial<Slot[]>('overlap-slots',[]);return Array.isArray(value)?value.filter(s=>DateTime.fromISO(s.start).isValid&&s.duration>0&&typeof s.id==='string'):[];});
  const slots=useMemo(()=>mergeSlots(storedSlots),[storedSlots]);
  const [sources,setSources]=useState<CalendarSource[]>(()=>{const value=initial<CalendarSource[]>('overlap-sources',[]);return Array.isArray(value)?value.filter(s=>typeof s.ics==='string'&&typeof s.name==='string'):[];});
  const [modal,setModal]=useState<'city'|'calendar'|'saved'|'copy'|null>(null);
  const [eventDetail,setEventDetail]=useState<CalendarEvent|null>(null);
  const [search,setSearch]=useState('');
  const [calendarTab,setCalendarTab]=useState<'file'|'icloud'|'google'>('file');
  const [url,setUrl]=useState('');
  const [loading,setLoading]=useState(false);
  const [calendarError,setCalendarError]=useState('');
  const [timeError,setTimeError]=useState('');
  const [toast,setToast]=useState('');
  const [clearedTimes,setClearedTimes]=useState<{slots:Slot[];selection:Pick<Slot,'start'|'duration'>|null}|null>(null);
  const [copyFallback,setCopyFallback]=useState('');
  const [storageError,setStorageError]=useState('');
  const fileInput=useRef<HTMLInputElement>(null);
  const local=selected.setZone(base.zone);
  const clockTime=live?now:selected;
  const homeTime=clockTime.setZone(home.zone);
  useEffect(()=>{const tick=setInterval(()=>setNow(DateTime.now()),15000);return()=>clearInterval(tick);},[]);
  useEffect(()=>{try {localStorage.setItem('overlap-cities',JSON.stringify(cityIds));localStorage.setItem('overlap-base',JSON.stringify(base.id));localStorage.setItem('overlap-copy-city',JSON.stringify(copyCity.id));localStorage.setItem('overlap-24h',JSON.stringify(h24));localStorage.setItem('overlap-work-preferences',JSON.stringify(workPreferences));localStorage.setItem('overlap-slots',JSON.stringify(slots));localStorage.setItem('overlap-sources',JSON.stringify(sources));setStorageError('');}catch{setStorageError('Browser storage is full or unavailable. These changes will last for this session only.');}},[cityIds,base.id,copyCity.id,h24,slots,sources,workPreferences]);
  useEffect(()=>{if(toast){const timer=setTimeout(()=>{setToast('');setClearedTimes(null);},toast==='All times cleared.'?8000:3600);return()=>clearTimeout(timer);}},[toast,clearedTimes]);
  const calendarData=useMemo(()=>{
    const events:CalendarEvent[]=[],errors:string[]=[];
    for(const source of sources) try{events.push(...expandCalendar(source,week,week.plus({weeks:1})));}catch(error){errors.push(`${source.name}: ${error instanceof Error?error.message:'Could not read events.'}`);}
    return {events,errors};
  },[sources,week.toISO()]);
  const conflicts=useMemo(()=>sources.flatMap(source=>{
    try{return expandCalendar(source,selected,selected.plus({minutes:duration})).filter(event=>!event.allDay);}
    catch{return [];}
  }),[sources,selected.toISO(),duration]);
  const overnight=places.filter(c=>{const h=selected.setZone(c.zone).hour;return h<7||h>=22;});
  function showTime(dt:DateTime,minutes:number) {setDuration(minutes);setSelected(dt);setHasSelection(true);setLive(false);setTimeError('');if(dt.setZone(base.zone)<week||dt.setZone(base.zone)>=week.plus({weeks:1}))setWeekDate(dt.setZone(base.zone).startOf('week').toISODate()!);}
  function selectTime(dt:DateTime,minutes=30) {minutes=Math.max(30,minutes);if(isSlotCovered(slots,{start:dt.toUTC().toISO()!,duration:minutes})){setHasSelection(false);setLive(true);setTimeError('This time is already saved.');return;}showTime(dt,minutes);}
  function viewSlot(slot:Slot) {showTime(DateTime.fromISO(slot.start),slot.duration);}
  function clearSelection() {setHasSelection(false);setLive(true);setTimeError('');}
  function changeBase(id:string) {const city=places.find(c=>c.id===id)!;setBaseId(id);setWeekDate(selected.setZone(city.zone).startOf('week').toISODate()!);setTimeError('');}
  function removeCity(id:string){if(cityIds.length===1)return;const next=cityIds.filter(c=>c!==id);setCityIds(next);if(base.id===id)setBaseId(next[0]);if(copyCity.id===id)setCopyCityId(next[0]);}
  const currentSlot:Slot={id:crypto.randomUUID(),start:selected.toUTC().toISO()!,duration,title:'Interview availability'};
  const savedSelection=slots.find(slot=>isSlotCovered([slot],currentSlot));
  const selectionSaved=!!savedSelection;
  function saveRange(dt:DateTime,minutes:number){minutes=Math.max(30,minutes);const slot:Slot={id:crypto.randomUUID(),start:dt.toUTC().toISO()!,duration:minutes,title:'Interview availability'};const merged=mergeSlots([...slots,slot]);const saved=merged.find(item=>isSlotCovered([item],slot))!;const combined=merged.length<=slots.length&&!isSlotCovered(slots,slot);setSlots(old=>mergeSlots([...old,slot]));viewSlot(saved);setToast(combined?'Availability saved. Adjoining times are combined.':'Availability saved.');}
  function removeSlot(id:string){setSlots(old=>mergeSlots(old).filter(slot=>slot.id!==id));if(hasSelection&&savedSelection?.id===id)clearSelection();setToast('Saved time removed.');}
  function clearTimes(){setClearedTimes({slots,selection:hasSelection?currentSlot:null});setSlots([]);clearSelection();setToast('All times cleared.');}
  function undoClearTimes(){if(!clearedTimes)return;setSlots(old=>mergeSlots([...old,...clearedTimes.slots]));if(clearedTimes.selection)showTime(DateTime.fromISO(clearedTimes.selection.start),clearedTimes.selection.duration);setClearedTimes(null);setToast('Times restored.');}
  async function copy(items:Slot[],city=copyCity) {const text=availabilityText(items,[city],h24);try{await navigator.clipboard.writeText(text);setToast(`${items.length===1?'Time':`${items.length} times`} copied in ${city.name} time.`);}catch{setCopyFallback(text);setModal('copy');}}
  function download(items:Slot[]) {const blob=new Blob([slotsToICS(items)],{type:'text/calendar;charset=utf-8'});const link=document.createElement('a');const objectUrl=URL.createObjectURL(blob);link.href=objectUrl;link.download='overlap-availability.ics';link.click();setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);setToast('Calendar file downloaded. Open it in Apple Calendar to add these times.');}
  function addSource(ics:string,name:string,feedUrl?:string,existingId?:string,provider?:'google'|'icloud'){validateICS(ics);const source={id:existingId||crypto.randomUUID(),name,ics,url:feedUrl,provider,syncedAt:DateTime.now().toISO()!,floatingZone:base.zone};expandCalendar(source,week,week.plus({weeks:1}));setSources(old=>existingId?old.map(s=>s.id===existingId?source:s):[...old,source]);setCalendarError('');if(!existingId)setModal(open=>open==='calendar'?null:open);setToast(existingId?'Calendar refreshed.':'Calendar added. Its events now follow your selected city.');}
  async function importFile(file?:File){if(!file)return;setCalendarError('');if(file.name.toLowerCase().endsWith('.zip')){setCalendarError('Unzip the Google Calendar export, then choose an .ics file inside.');return;}if(file.size>2_000_000){setCalendarError('Choose a calendar file smaller than 2 MB.');return;}setLoading(true);try{const text=await file.text();addSource(text,calendarName(text)==='Imported calendar'?file.name.replace(/\.ics$/i,''):calendarName(text));}catch(error){setCalendarError(error instanceof Error?error.message:'Could not read this calendar. Try exporting it again.');}finally{setLoading(false);if(fileInput.current)fileInput.current.value='';}}
  async function connectCalendar(feedUrl=url,existing?:CalendarSource){setCalendarError('');setLoading(true);try{const response=await fetch('/api/calendar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:feedUrl})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not connect to this calendar.');addSource(data.ics,existing?.name||calendarName(data.ics),feedUrl.trim(),existing?.id,data.provider);setUrl('');}catch(error){setCalendarError(error instanceof Error?error.message:'Could not connect. Please try again.');}finally{setLoading(false);}}
  function openCalendars(){setCalendarError('');setModal('calendar');}
  const matches=cities.filter(c=>!cityIds.includes(c.id)&&`${c.name} ${c.country} ${c.zone}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())).slice(0,search?35:9);
  const possible=hasSelection?local.getPossibleOffsets():[];
  return <div className="app-shell" onPointerDown={e=>{if(e.target instanceof Element&&!e.target.closest('.time-cell,.calendar-event,.selection-event,.day-heading,.all-day-row,.skip-calendar,#time-planner,dialog'))clearSelection();}}>
    <header className="app-header"><a href="/" className="brand" aria-label="Overlap home"><span className="brand-mark"><i/><i/></span>overlap<span className="brand-period">.</span></a><div className="header-separator"/><span className="brand-tagline">A little closer, across time.</span><div className="header-right"><span className="local-date">{now.setZone(home.zone).toFormat('cccc, LLLL d')}</span><button className="format-toggle" onClick={()=>setH24(!h24)} aria-label={`Switch to ${h24?'12':'24'}-hour time`}><span className={!h24?'active':''}>12h</span><span className={h24?'active':''}>24h</span></button><button className="button calendar-connect" onClick={openCalendars}><CalendarDays size={16}/>{sources.length?`My calendars (${sources.length})`:'Connect calendar'}<Plus size={15}/></button></div></header>
    <main>
      <div className="planner-layout">
      <section className="clocks-section" aria-label="World clocks"><div className="clocks-row" data-single-city={places.length===1}>{places.map(city=>{const dt=clockTime.setZone(city.zone),night=dt.hour<7||dt.hour>=19,day=dayDifference(dt,homeTime);return <article className={`city-card ${city.id===base.id?'city-active':''}`} key={city.id}>
        <div className="city-card-top"><button className="city-name-button" onClick={()=>changeBase(city.id)} title={`Show calendar in ${city.name} time`}><span>{city.name}</span>{city.id===home.id&&<span className="home-badge"><House size={10}/>Home</span>}</button><div className="city-actions">{city.id!==home.id&&<button className="icon-button" aria-label={`Make ${city.name} home`} onClick={()=>{setCityIds([city.id,...cityIds.filter(id=>id!==city.id)]);changeBase(city.id);}}><House size={13}/></button>}{cityIds.length>1&&<button className="icon-button" aria-label={`Remove ${city.name}`} onClick={()=>removeCity(city.id)}><X size={14}/></button>}</div></div>
        <div className="city-time-row"><div><div className="city-time">{dt.toFormat(h24?'HH:mm':'h:mm')}{!h24&&<span>{dt.toFormat('a')}</span>}</div><div className="city-date">{dt.toFormat('ccc, LLL d')}{day!==0&&<span className="day-change">{day>0?'+':''}{day} day</span>}</div></div><AnalogClock time={dt} night={night}/></div>
        <div className="city-card-footer"><span>{night?<Moon size={12}/>:<Sun size={13}/>} {dt.offsetNameShort} <span className="utc-offset">{utcLabel(dt)}</span></span><span>{city.id===home.id?'Your local time':relativeOffset(dt,homeTime)}</span></div>
      </article>;})}<button className="add-city-card" onClick={()=>{setSearch('');setModal('city');}}><span><Plus size={21}/></span>Add city</button></div></section>
      <CalendarGrid activeSlotId={hasSelection?savedSelection?.id:undefined} onViewSlot={viewSlot} selectionActive={hasSelection&&!selectionSaved} onSaveRange={saveRange} onCancelSelection={clearSelection} onRemoveSlot={slot=>removeSlot(slot.id)} workHours={workHours} onWorkHoursChange={preferences=>setWorkPreferences(old=>({...old,...preferences}))} base={base} cities={places} week={week} selected={selected} duration={duration} h24={h24} now={now} slots={slots} events={calendarData.events} onSelect={selectTime} onSelectRange={selectTime} onWeek={date=>setWeekDate(date.toISODate()!)} onEvent={setEventDetail}/>
        <aside id="time-planner" tabIndex={-1} className="time-panel" aria-label="Time planner"><div className="panel-heading"><h2>Find a time</h2><Clock3 size={18}/></div><p className="panel-description">Start with one city. See it everywhere.</p>
          {timeError&&<p role="alert" className="inline-error">{timeError}</p>}
          {possible.length>1&&<label className="dst-choice">This time occurs twice<select aria-label="Daylight saving occurrence" value={local.offset} onChange={e=>selectTime(possible.find(t=>t.offset===Number(e.target.value))!)}>{possible.map(t=><option value={t.offset} key={t.offset}>{t.offsetNameShort} ({utcLabel(t)})</option>)}</select></label>}
          {hasSelection?<>
          <div className="city-comparisons">{places.map(city=>{const dt=selected.setZone(city.zone),end=dt.plus({minutes:duration});return <div className="comparison-row" key={city.id}><span className={`city-dot ${city.id===home.id?'home-dot':''}`}/><div className="comparison-city"><strong>{city.name}</strong><span>{dt.toFormat('ccc, LLL d')} · {dt.offsetNameShort}</span></div><div className="comparison-time"><strong>{timeLabel(dt,h24)}</strong><span>to {timeLabel(end,h24)}{!end.hasSame(dt,'day')?' (+1 day)':''}</span></div></div>;})}</div>
          <div className={`timing-note ${conflicts.length?'conflict':''}`}>{conflicts.length?<><CalendarDays size={15}/><span>Overlaps {conflicts.length} calendar {conflicts.length===1?'event':'events'}.</span></>:overnight.length?<><Moon size={15}/><span>A late night or early start in {overnight.map(c=>c.name).join(' and ')}.</span></>:<><Sun size={15}/><span>Everyone is within daytime hours.</span></>}</div></>:<p className="selection-empty">Click or drag on the calendar to save a time.</p>}
          {slots.length>0&&<section className="saved-availability" aria-labelledby="saved-availability-heading">
            <div className="saved-availability-heading"><h3 id="saved-availability-heading">Saved times</h3><span>{slots.length}</span></div>
            <label className="saved-timezone">Time zone<select aria-label="Saved times time zone" value={copyCity.id} onChange={e=>setCopyCityId(e.target.value)}>{places.map(city=><option value={city.id} key={city.id}>{city.name}</option>)}</select></label>
            <ol className="availability-list">{slots.map(slot=>{
              const start=DateTime.fromISO(slot.start).setZone(copyCity.zone),end=start.plus({minutes:slot.duration});
              const date=start.toFormat('cccc, LLL d, yyyy');
              const range=`${timeLabel(start,h24)}–${end.hasSame(start,'day')?'':`${end.toFormat('ccc, LLL d')} · `}${timeLabel(end,h24)}`;
              const active=hasSelection&&savedSelection?.id===slot.id;
              return <li className="availability-row" data-active={active} key={slot.id}>
                <button className="availability-view" aria-label={`View ${date}, ${range} in ${copyCity.name}`} aria-pressed={active} onClick={()=>viewSlot(slot)}><strong>{date}</strong><span>{range}</span></button>
                <button className="availability-remove" aria-label={`Remove availability: ${date}, ${range} in ${copyCity.name}`} title="Remove this time" onClick={()=>removeSlot(slot.id)}><X size={14}/></button>
              </li>;
            })}</ol>
          </section>}
          <div className="panel-actions"><button className="button copy-button" aria-label={slots.length?`Copy times (${slots.length} saved)`:'Copy this time'} title={slots.length?`Copy all ${slots.length} saved ${slots.length===1?'time':'times'} in ${copyCity.name} time`:`Copy selected time in ${base.name} time`} onClick={()=>copy(slots.length?slots:[currentSlot],slots.length?copyCity:base)} disabled={!slots.length&&(!hasSelection||!!timeError)}><Copy size={15}/>{slots.length?'Copy times':'Copy time'}</button></div>
          <button className="clear-times-button" onClick={clearTimes} disabled={!slots.length&&!hasSelection} title="Clear all saved times and the current selection"><Trash2 size={13}/>Clear all</button>
        </aside>
      </div>
      {(storageError||calendarData.errors.length>0)&&<div className="status-errors" role="alert">{storageError}{calendarData.errors.map(e=><p key={e}>{e}</p>)}</div>}
      <footer><span><ShieldCheck size={13}/>Your plans stay in this browser.</span></footer>
    </main>
    {toast&&<div className="toast" role="status"><Check size={17}/><span>{toast}</span>{toast==='All times cleared.'&&clearedTimes&&<button className="toast-undo" onClick={undoClearTimes}>Undo</button>}</div>}
    {modal==='city'&&<Modal title="Add a city" onClose={()=>setModal(null)}><p className="modal-description">Bring another corner of the world into view.</p><label className="search-input"><Search size={18}/><input autoFocus placeholder="Search cities or time zones" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="city-search-results">{matches.length?matches.map(city=><button key={city.id} onClick={()=>{setCityIds([...cityIds,city.id]);setWorkPreferences(old=>old[city.id]?old:{...old,[city.id]:{...defaultWorkHours(),color:getWorkColor(undefined,cityIds.length).id}});setModal(null);setToast(`${city.name} added to your world.`);}}><span className="search-city-code">{city.code}</span><span><strong>{city.name}</strong><small>{city.country}</small></span><span className="search-city-time">{timeLabel(clockTime.setZone(city.zone),h24)}<Plus size={16}/></span></button>):<p className="empty-search">No matching cities. Try a nearby city or a time zone like “Pacific”.</p>}</div></Modal>}
    {modal==='calendar'&&<Modal title="Your calendars" onClose={()=>setModal(null)} className="calendar-modal"><p className="modal-description">Your events, in whichever time zone you need.</p>
      {sources.length>0&&<div className="connected-calendars">{sources.map(source=><div className="connected-calendar" key={source.id}><span className="connected-icon"><CalendarDays size={18}/></span><div><strong>{source.name}</strong><small>{source.url?`${source.provider==='google'?'Google Calendar':'iCloud'} · Read-only`:'Imported file'} · {DateTime.fromISO(source.syncedAt).toFormat('LLL d, h:mm a')}</small></div>{source.url&&<button className="icon-button" disabled={loading} aria-label={`Refresh ${source.name}`} onClick={()=>connectCalendar(source.url,source)}><RefreshCw size={15}/></button>}<button className="icon-button" aria-label={`Remove ${source.name}`} onClick={()=>setSources(sources.filter(s=>s.id!==source.id))}><Trash2 size={15}/></button></div>)}</div>}
      <div className="modal-tabs"><button className={calendarTab==='file'?'active':''} onClick={()=>{setCalendarTab('file');setCalendarError('');setUrl('');}}><Upload size={15}/>Import a file</button><button className={calendarTab==='icloud'?'active':''} onClick={()=>{setCalendarTab('icloud');setCalendarError('');setUrl('');}}><Link size={15}/>iCloud link</button><button className={calendarTab==='google'?'active':''} onClick={()=>{setCalendarTab('google');setCalendarError('');setUrl('');}}><CalendarDays size={15}/>Google Calendar</button></div>
      {calendarTab==='file'?<div className="import-section"><div className="upload-area" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();importFile(e.dataTransfer.files[0]);}}><span className="upload-symbol"><CalendarDays size={26}/></span><h3>A familiar calendar. A new perspective.</h3><p>Drop an .ics file from Apple or Google Calendar here.</p><button className="button button-primary" disabled={loading} onClick={()=>fileInput.current?.click()}>{loading?<LoaderCircle size={16} className="spin"/>:<Upload size={15}/>}Choose calendar file</button><input hidden type="file" ref={fileInput} accept=".ics,text/calendar" onChange={e=>importFile(e.target.files?.[0])}/></div><p className="calendar-instructions"><strong>Google Calendar:</strong> On your computer, open Settings → Import &amp; export → Export. Unzip the download, then choose an .ics file inside.</p><p className="calendar-instructions">In Apple Calendar on your Mac, select a calendar, then choose <strong>File → Export → Export</strong>. Import that .ics file here. To update it, remove the old import above and import a fresh export.</p><p className="privacy-note"><ShieldCheck size={15}/>The file stays in this browser. No account needed.</p></div>:calendarTab==='google'?<form className="icloud-section" onSubmit={e=>{e.preventDefault();connectCalendar();}}><label>Google Calendar iCal link<input type="password" autoComplete="off" spellCheck={false} placeholder="Paste your Google Calendar iCal link" value={url} onChange={e=>setUrl(e.target.value)} required/></label><div className="calendar-instructions"><ol><li>Open Google Calendar on your computer.</li><li>Go to <strong>Settings → your calendar → Integrate calendar</strong>.</li><li>Copy the <strong>Secret address in iCal format</strong> and paste it above.</li></ol><p>This link gives access to your calendar. Keep it private. It is saved in this browser and sent to this app’s server to fetch events. The server does not store your calendar.</p><p>If your account hides the secret address, import an exported .ics file instead. Public iCal links also work.</p><a href="https://support.google.com/calendar/answer/37648?hl=en" target="_blank" rel="noreferrer">Google’s calendar connection guide <ArrowRight size={12}/></a></div><button className="button button-primary" disabled={loading||!url.trim()}>{loading?<LoaderCircle className="spin" size={16}/>:<Link size={16}/>} {loading?'Importing…':'Import Google Calendar'}</button><p className="privacy-note">Read-only import. Use Refresh to fetch changes. No Google sign-in or edits to your calendar.</p></form>:<form className="icloud-section" onSubmit={e=>{e.preventDefault();connectCalendar();}}><label>Public iCloud calendar link<input type="url" placeholder="webcal://p123-caldav.icloud.com/published/…" value={url} onChange={e=>setUrl(e.target.value)} required/></label><div className="calendar-instructions"><p>In iCloud Calendar, open the sharing options for a calendar, enable <strong>Public Calendar</strong>, then copy its link.</p><p>A public calendar is accessible to anyone with its link. If you prefer to keep it private, use a file import.</p><a href="https://support.apple.com/en-ca/guide/icloud/mm6b1a9479/1.0/icloud/1.0" target="_blank" rel="noreferrer">Apple’s calendar sharing guide <ArrowRight size={12}/></a></div><button className="button button-primary" disabled={loading||!url.trim()}>{loading?<LoaderCircle className="spin" size={16}/>:<Link size={16}/>} {loading?'Connecting…':'Connect read-only calendar'}</button><p className="privacy-note">Refresh here to fetch updates. This does not sign in to Apple or change your calendar.</p></form>}
      {calendarError&&<p role="alert" className="inline-error">{calendarError}</p>}
    </Modal>}
    {modal==='saved'&&<Modal title="Your saved times" onClose={()=>setModal(null)}><p className="modal-description">A shortlist of moments that could work.</p>{slots.length?<><div className="saved-times-list">{slots.map(slot=><div className="saved-time" key={slot.id}><button onClick={()=>{selectTime(DateTime.fromISO(slot.start));setDuration(slot.duration);setModal(null);}}><strong>{DateTime.fromISO(slot.start).setZone(base.zone).toFormat('ccc, LLL d')}</strong><span>{timeLabel(DateTime.fromISO(slot.start).setZone(base.zone),h24)} · {slot.duration} min · {base.name}</span></button><button className="icon-button" aria-label={`Delete saved time ${DateTime.fromISO(slot.start).setZone(base.zone).toFormat('LLL d h:mm a')}`} onClick={()=>removeSlot(slot.id)}><Trash2 size={16}/></button></div>)}</div><div className="saved-actions"><button className="button button-primary" onClick={()=>copy(slots)}><Copy size={15}/>Copy all availability</button><button className="button" onClick={()=>download(slots)}><ArrowDownToLine size={15}/>Export .ics</button></div><p className="privacy-note">Exported times are marked tentative and available. You choose whether to add them to your calendar.</p></>:<div className="empty-state"><Clock3 size={32}/><h3>Make room for your next conversation.</h3><p>Select a time on the calendar, then save your availability. Your shortlist will be waiting here.</p><button className="button button-primary" onClick={()=>setModal(null)}>Find a time <ArrowRight size={15}/></button></div>}</Modal>}
    {modal==='copy'&&<Modal title="Copy your availability" onClose={()=>setModal(null)}><p className="modal-description">Clipboard access isn’t available. Select and copy the text below.</p><textarea className="copy-fallback" readOnly value={copyFallback} onFocus={e=>e.target.select()} autoFocus/></Modal>}
    {eventDetail&&<Modal title={eventDetail.title} onClose={()=>setEventDetail(null)}><p className="modal-description">{eventDetail.sourceName} · Read-only calendar event</p><div className="event-details">{places.map(city=><div key={city.id}><strong>{city.name}</strong><span>{eventDetail.allDay?`${eventDetail.start} · All day`:`${DateTime.fromISO(eventDetail.start).setZone(city.zone).toFormat('ccc, LLL d')} · ${timeLabel(DateTime.fromISO(eventDetail.start).setZone(city.zone),h24)} – ${DateTime.fromISO(eventDetail.end).setZone(city.zone).toFormat(h24?'ccc, LLL d HH:mm':'ccc, LLL d h:mm a')}`}</span></div>)}</div></Modal>}
  </div>;
}
