import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { DateTime } from 'luxon';
import { updatedCalendarSource, type CalendarSource } from './calendar';

export const CALENDAR_UPDATE_INTERVAL=5*60*1000;

export async function fetchCalendarSource(url:string,floatingZone:string,existing?:CalendarSource,signal?:AbortSignal):Promise<CalendarSource> {
  const zone=existing?.floatingZone||floatingZone;
  const from=DateTime.now().setZone(zone).startOf('month').toISO()!;
  const response=await fetch('/api/calendar',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',signal:signal||AbortSignal.timeout(30000),body:JSON.stringify({url,from,floatingZone:zone})});
  const data=await response.json();
  if(!response.ok) throw new Error(data.error||'Could not update this calendar. Try again.');
  return updatedCalendarSource(data.ics,{existing,url:url.trim(),provider:data.provider,floatingZone:zone,importedFrom:data.importedFrom||from});
}

export function useCalendarUpdates(sources:CalendarSource[],setSources:Dispatch<SetStateAction<CalendarSource[]>>,autoUpdate:boolean,onUpdated:(message:string)=>void) {
  const latest=useRef(sources);
  latest.current=sources;
  const active=useRef(new Map<string,AbortController>());
  const attempted=useRef(new Map<string,number>());
  const [updating,setUpdating]=useState<string[]>([]);
  const [errors,setErrors]=useState<Record<string,string>>({});
  const update=useCallback(async(source:CalendarSource)=>{
    if(!source.url||active.current.has(source.id)) return false;
    const controller=new AbortController();
    active.current.set(source.id,controller);
    attempted.current.set(source.id,Date.now());
    setUpdating(ids=>[...new Set([...ids,source.id])]);
    setErrors(old=>{const next={...old};delete next[source.id];return next;});
    const timer=setTimeout(()=>controller.abort(),30000);
    try {
      const next=await fetchCalendarSource(source.url,source.floatingZone,source,controller.signal);
      if(controller.signal.aborted||!latest.current.some(item=>item.id===source.id&&item.url===source.url)) return false;
      setSources(old=>old.map(item=>item.id===source.id&&item.url===source.url?next:item));
      return true;
    } catch(error) {
      if(latest.current.some(item=>item.id===source.id)&&(!controller.signal.aborted||active.current.get(source.id)===controller)) {
        setErrors(old=>({...old,[source.id]:controller.signal.aborted?'The update timed out. Try again.':error instanceof Error?error.message:'Could not update. Try again.'}));
      }
      return false;
    } finally {
      clearTimeout(timer);
      if(active.current.get(source.id)===controller) {
        active.current.delete(source.id);
        setUpdating(ids=>ids.filter(id=>id!==source.id));
      }
    }
  },[setSources]);
  const updateNow=async(id?:string)=>{
    const linked=latest.current.filter(source=>source.url&&(!id||source.id===id)&&!active.current.has(source.id));
    const results=await Promise.all(linked.map(update));
    const count=results.filter(Boolean).length;
    if(count) onUpdated(count===1?'Calendar updated.':`${count} calendars updated.`);
  };
  useEffect(()=>{
    for(const [id,controller] of active.current) {
      if(!sources.some(source=>source.id===id&&source.url)) {controller.abort();}
    }
    setErrors(old=>Object.fromEntries(Object.entries(old).filter(([id])=>sources.some(source=>source.id===id))));
  },[sources]);
  useEffect(()=>{
    if(!autoUpdate)return;
    const check=()=>{
      if(document.visibilityState!=='visible'||!navigator.onLine)return;
      for(const source of latest.current) {
        const last=Math.max(Date.parse(source.syncedAt)||0,attempted.current.get(source.id)||0);
        if(source.url&&Date.now()-last>=CALENDAR_UPDATE_INTERVAL) void update(source);
      }
    };
    check();
    const timer=setInterval(check,30000);
    document.addEventListener('visibilitychange',check);
    window.addEventListener('online',check);
    return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',check);window.removeEventListener('online',check);};
  },[autoUpdate,sources,update]);
  useEffect(()=>()=>{for(const controller of active.current.values())controller.abort();active.current.clear();attempted.current.clear();},[]);
  return {updating,errors,updateNow};
}
