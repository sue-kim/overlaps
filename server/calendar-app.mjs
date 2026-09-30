import express from 'express';
import { normalizeCalendarUrl } from './calendar-url.mjs';

export function createCalendarApp({trustProxy=false}={}) {
  const app = express();
  // Vercel terminates HTTPS before forwarding requests to the function.
  if(trustProxy) app.set('trust proxy',1);
  app.disable('x-powered-by');
  app.use(express.json({limit:'8kb'}));
  app.post('/api/calendar', async (req,res)=>{
    res.set('Cache-Control','no-store');
    const origin=req.get('origin');
    if(origin && origin!==`${req.protocol}://${req.get('host')}`) return res.status(403).json({error:'Calendar requests must come from this app.'});
    let url;
    try {url=normalizeCalendarUrl(req.body?.url);} catch(error){return res.status(400).json({error:error.message});}
    const provider=new URL(url).hostname==='calendar.google.com'?'google':'icloud';
    const providerName=provider==='google'?'Google Calendar':'iCloud';
    try {
      const response=await fetch(url,{signal:AbortSignal.timeout(15000),redirect:'error',headers:{Accept:'text/calendar'}});
      if(!response.ok) return res.status(502).json({error:provider==='google'?'Google Calendar could not open this feed. Copy its current Secret address in iCal format, or use an exported .ics file.':'iCloud could not open this calendar. Check that Public Calendar is on and copy the link again.'});
      if(Number(response.headers.get('content-length'))>2_000_000) return res.status(413).json({error:'This calendar is larger than 2 MB. Import a smaller calendar file instead.'});
      let size=0; const chunks=[];
      for await(const chunk of response.body) {
        size+=chunk.length;
        if(size>2_000_000) {await response.body.cancel().catch(()=>{});return res.status(413).json({error:'This calendar is larger than 2 MB.'});}
        chunks.push(chunk);
      }
      const ics=Buffer.concat(chunks).toString('utf8');
      if(!ics.trim().startsWith('BEGIN:VCALENDAR')) return res.status(422).json({error:`This link did not return a calendar. Copy the iCal feed link from ${providerName}.`});
      res.json({ics,provider});
    } catch {res.status(502).json({error:`Could not reach ${providerName}. Check your connection and calendar link, then try again.`});}
  });
  app.use('/api',(_req,res)=>res.status(404).json({error:'Not found'}));
  return app;
}
