import {after, before, test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
// @ts-expect-error JavaScript Vercel entry point tested directly.
import calendarApp from '../api/calendar.js';

const server=createServer(calendarApp);
let endpoint:string;
const request=globalThis.fetch.bind(globalThis);
const feed='https://calendar.google.com/calendar/ical/example%40gmail.com/public/basic.ics';
const headers={'Content-Type':'application/json','X-Forwarded-Proto':'https',Origin:''};

before(async()=>{
  await new Promise<void>((resolve,reject)=>{
    server.once('error',reject);
    server.listen(0,'127.0.0.1',resolve);
  });
  const address=server.address();
  assert.ok(address && typeof address!=='string');
  endpoint=`http://127.0.0.1:${address.port}/api/calendar`;
  headers.Origin=`https://127.0.0.1:${address.port}`;
});
after(()=>server.listening?new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve())):undefined);

test('Vercel HTTPS requests can import a feed without caching it',async t=>{
  const ics='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR';
  const upstream=t.mock.method(globalThis,'fetch',async(url:string,options:RequestInit)=>{
    assert.equal(url,feed);
    assert.equal(options.redirect,'error');
    assert.ok(options.signal);
    return new Response(ics);
  });
  const response=await request(endpoint,{method:'POST',headers,body:JSON.stringify({url:feed})});
  assert.equal(response.status,200);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.deepEqual(await response.json(),{ics,provider:'google'});
  assert.equal(upstream.mock.callCount(),1);
});

test('calendar endpoint rejects a different origin before fetching',async t=>{
  const upstream=t.mock.method(globalThis,'fetch',()=>{throw new Error('Must not fetch');});
  const response=await request(endpoint,{method:'POST',headers:{...headers,Origin:'https://unrelated.example'},body:JSON.stringify({url:feed})});
  assert.equal(response.status,403);
  assert.equal(upstream.mock.callCount(),0);
});

test('calendar endpoint rejects unsupported feed URLs before fetching',async t=>{
  const upstream=t.mock.method(globalThis,'fetch',()=>{throw new Error('Must not fetch');});
  const response=await request(endpoint,{method:'POST',headers,body:JSON.stringify({url:'https://localhost/private'})});
  assert.equal(response.status,400);
  assert.equal(upstream.mock.callCount(),0);
});

test('calendar endpoint rejects oversized and non-calendar responses',async t=>{
  const upstream=t.mock.method(globalThis,'fetch',async()=>new Response('too large',{headers:{'Content-Length':'2000001'}}));
  const large=await request(endpoint,{method:'POST',headers,body:JSON.stringify({url:feed})});
  assert.equal(large.status,413);
  upstream.mock.mockImplementation(async()=>new Response('<html>not a calendar</html>'));
  const invalid=await request(endpoint,{method:'POST',headers,body:JSON.stringify({url:feed})});
  assert.equal(invalid.status,422);
});

test('calendar endpoint does not expose upstream errors or accept GET imports',async t=>{
  t.mock.method(globalThis,'fetch',()=>{throw new Error('A private upstream detail');});
  const response=await request(endpoint,{method:'POST',headers,body:JSON.stringify({url:feed})});
  assert.equal(response.status,502);
  assert.doesNotMatch(await response.text(),/private upstream/);
  const get=await request(endpoint);
  assert.equal(get.status,404);
});
