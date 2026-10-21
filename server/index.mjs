import { fileURLToPath } from 'node:url';
import path from 'node:path';
import express from 'express';
import { createCalendarApp } from './calendar-app.mjs';
const app = createCalendarApp();
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if(process.env.NODE_ENV==='production') {
  app.get('/index.html',(_req,res)=>res.redirect(308,'/'));
  app.get('/index.md',(_req,res,next)=>{res.type('text/markdown').set('Link','<https://overlaps-time.vercel.app/>; rel="canonical"');next();});
  app.use(express.static(path.join(root,'dist')));
  app.use((_req,res)=>res.status(404).set('X-Robots-Tag','noindex').type('text/plain').send('Page not found. Open / for the Overlap planner.'));
} else {
  const {createServer}=await import('vite');
  const vite=await createServer({root,server:{middlewareMode:true},appType:'spa'});
  app.use(vite.middlewares);
}
const port=Number(process.env.PORT || 5173);
app.listen(port,'127.0.0.1',()=>console.log(`Overlap is ready at http://127.0.0.1:${port}`));
