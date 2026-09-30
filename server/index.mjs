import { fileURLToPath } from 'node:url';
import path from 'node:path';
import express from 'express';
import { createCalendarApp } from './calendar-app.mjs';
const app = createCalendarApp();
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if(process.env.NODE_ENV==='production') {
  app.use(express.static(path.join(root,'dist')));
  app.get('/{*path}',(_req,res)=>res.sendFile(path.join(root,'dist','index.html')));
} else {
  const {createServer}=await import('vite');
  const vite=await createServer({root,server:{middlewareMode:true},appType:'spa'});
  app.use(vite.middlewares);
}
const port=Number(process.env.PORT || 5173);
app.listen(port,'127.0.0.1',()=>console.log(`Overlap is ready at http://127.0.0.1:${port}`));
