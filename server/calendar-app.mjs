import express from 'express';
import { normalizeCalendarUrl } from './calendar-url.mjs';
import { DateTime } from 'luxon';
import { futureCalendar, MAX_CALENDAR_DOWNLOAD_BYTES } from '../src/future-calendar.js';

export function createCalendarApp({trustProxy=false}={}) {
  const app = express();
  // Vercel terminates HTTPS before forwarding requests to the function.
  if(trustProxy) app.set('trust proxy',1);
  app.disable('x-powered-by');
  app.use('/api',(_req,res,next)=>{res.set('X-Robots-Tag','noindex, nofollow');next();});
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
      const response=await fetch(url,{signal:AbortSignal.timeout(15000),redirect:'error',cache:'no-store',headers:{Accept:'text/calendar','Cache-Control':'no-cache'}});
      if(!response.ok) return res.status(502).json({error:provider==='google'?'Google Calendar could not open this feed. Copy its current Secret address in iCal format, or use an exported .ics file.':'iCloud could not open this calendar. Check that Public Calendar is on and copy the link again.'});
      if(Number(response.headers.get('content-length'))>MAX_CALENDAR_DOWNLOAD_BYTES) {
        await response.body?.cancel().catch(()=>{});
        return res.status(413).json({error:'This calendar is larger than 50 MB. Export a smaller calendar file.'});
      }
      let size=0; const chunks=[];
      for await(const chunk of response.body) {
        size+=chunk.length;
        if(size>MAX_CALENDAR_DOWNLOAD_BYTES) return res.status(413).json({error:'This calendar is larger than 50 MB. Export a smaller calendar file.'});
        chunks.push(chunk);
      }
      const ics=Buffer.concat(chunks).toString('utf8');
      if(!ics.trim().startsWith('BEGIN:VCALENDAR')) return res.status(422).json({error:`This link did not return a calendar. Copy the iCal feed link from ${providerName}.`});
      const from=req.body?.from || DateTime.now().toUTC().startOf('month').toISO();
      let filtered;
      try {filtered=futureCalendar(ics,{from,floatingZone:req.body?.floatingZone || 'UTC'});}
      catch(error) {return res.status(error instanceof RangeError?413:422).json({error:error.message});}
      res.json({ics:filtered,provider,importedFrom:from});
    } catch {res.status(502).json({error:`Could not reach ${providerName}. Check your connection and calendar link, then try again.`});}
  });
  app.use('/api',(_req,res)=>res.status(404).json({error:'Not found'}));
  return app;
}
