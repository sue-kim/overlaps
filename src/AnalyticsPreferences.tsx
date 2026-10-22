import { useEffect, useState } from 'react';
import { ANALYTICS_CHOICE_KEY, analyticsConfigured, readAnalyticsChoice, saveAnalyticsChoice, startAnalytics, stopAnalytics } from './analytics';

export default function AnalyticsPreferences() {
  const enabled=analyticsConfigured();
  const [choice,setChoice]=useState(readAnalyticsChoice);
  const [editing,setEditing]=useState(false);
  useEffect(()=>{
    if(enabled&&choice==='granted')startAnalytics();
  },[enabled,choice]);
  useEffect(()=>{
    if(!enabled)return;
    const changed=(event:StorageEvent)=>{
      if(event.key===ANALYTICS_CHOICE_KEY||event.key===null) {
        const next=readAnalyticsChoice();
        if(next!=='granted')stopAnalytics();
        setChoice(next);
      }
    };
    window.addEventListener('storage',changed);
    return()=>window.removeEventListener('storage',changed);
  },[enabled]);
  if(!enabled)return null;
  const choose=(next:'granted'|'denied')=>{saveAnalyticsChoice(next);setChoice(next);setEditing(false);};
  return <><button className="analytics-settings" onClick={()=>setEditing(true)}>Analytics preferences</button>
    {(choice===null||editing)&&<section className="analytics-notice" aria-labelledby="analytics-heading">
      <div><h2 id="analytics-heading">Help improve Overlap?</h2><p>Allow Google Analytics to measure visits and general actions, such as saving or copying times. Our analytics events do not include calendar content or entered values. <a href="#analytics-privacy">How analytics works</a></p></div>
      <div className="analytics-actions"><button className="button" onClick={()=>choose('denied')}>No thanks</button><button className="button button-primary" onClick={()=>choose('granted')}>Allow analytics</button>{editing&&choice!==null&&<button className="analytics-close" onClick={()=>setEditing(false)}>Keep my choice</button>}</div>
    </section>}
  </>;
}
