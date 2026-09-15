import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { createHmac, createHash, randomBytes } from 'node:crypto';
import vm from 'node:vm';
import handler, { seal, unseal, validWorkspaceToken, validateEvent } from '../api/google-calendar.mjs';
const require=createRequire(import.meta.url);
const core=require('../workspace/student-planner/js/calendar-core.js');

for (const gap of [0,10,15,20]) {
  const blocks=core.layout([{start:605,end:685},{start:685+gap,end:775}]);
  assert.equal(blocks[0].lanes,1);assert.equal(blocks[1].lanes,1);
  assert.ok(blocks[0].top+blocks[0].height<=blocks[1].top+1e-8);
}
const conflict=core.layout([{start:600,end:700},{start:650,end:680},{start:680,end:720},{start:730,end:800}]);
assert.deepEqual(conflict.map(x=>x.lanes),[2,2,2,1]);
assert.equal(conflict[1].lane,conflict[2].lane);
const sameHour=core.layout([{start:600,end:610},{start:620,end:630}]);
assert.equal(sameHour.length,2);assert.ok(sameHour[0].top<sameHour[1].top);
assert.ok(Math.abs(core.layout([{start:1380,end:1440}])[0].top+core.layout([{start:1380,end:1440}])[0].height-100)<1e-8);
assert.equal(core.layout([{start:300,end:400},{start:1440,end:1500}]).length,0);
const clipped=core.layout([{start:400,end:450}])[0];assert.equal(clipped.start,420);assert.equal(clipped.actualStart,400);
assert.equal(core.dateKey(new Date(2026,8,15,23,59)),'2026-09-15');
assert.equal(core.minutes('12:00 am'),0);assert.equal(core.minutes('12 pm'),720);assert.equal(core.minutes('24:00'),1440);assert.equal(core.minutes('10:99'),null);

const state={courses:[{id:'math',code:'MATH 2004',status:'Active',days:'MW',time:'11:35',endTime:'12:55'}],labs:[{id:'lab',course:'MAAE 2400',date:'2026-09-07',pattern:'weekly',time:'18:05',endTime:'20:55'}],scheduleOverrides:[]};
const week=core.schoolEvents(state,'2026-09-14','2026-09-20');
assert.equal(week.length,3);assert.ok(week.some(e=>e.labId==='lab' && e.date==='2026-09-14'));
state.scheduleOverrides.push({courseId:'math',date:'2026-09-14',action:'cancel'});
assert.equal(core.schoolEvents(state,'2026-09-14','2026-09-14').length,1);
state.googleCalendar={calendarId:'school',from:'2026-09-14',to:'2026-09-20',events:[]};
assert.equal(core.schoolEvents(state,'2026-09-14','2026-09-20').length,0,'Deleted Google events must not resurrect seeded classes');
const google=core.googleEvents([{id:'same-id',summary:'MATH 2004',start:{dateTime:'2026-09-15T15:35:00Z'},end:{dateTime:'2026-09-15T16:55:00Z'}},{id:'gone',status:'cancelled'},{id:'overnight',start:{dateTime:'2026-09-15T23:30:00-04:00'},end:{dateTime:'2026-09-16T00:30:00-04:00'}},{id:'all-day',start:{date:'2026-09-15'},end:{date:'2026-09-17'}}]);
assert.equal(google[0].start,695);assert.equal(google[0].end,775);assert.equal(google[0].date,'2026-09-15');
assert.equal(google.filter(e=>e.googleId==='overnight').length,2);assert.equal(google.filter(e=>e.googleId==='all-day').length,2);

const context=vm.createContext({Intl,Date,console});
vm.runInContext(await readFile(new URL('../workspace/student-planner/js/google-calendar.js',import.meta.url),'utf8')+'\nglobalThis.sync=GoogleCalendarSync;',context);
assert.equal(context.sync.zonedInstant('2026-09-15T11:35','America/Toronto'),'2026-09-15T15:35:00.000Z');
assert.equal(context.sync.zonedInstant('2026-12-15T11:35','America/Toronto'),'2026-12-15T16:35:00.000Z');
assert.throws(()=>context.sync.zonedInstant('2026-03-08T02:30','America/Toronto'));

const key=randomBytes(32),encrypted=seal({refresh:'TEST-REFRESH'},key);
assert.equal(unseal(encrypted,key).refresh,'TEST-REFRESH');assert.equal(unseal(encrypted+'x',key),null);assert.equal(unseal(encrypted,randomBytes(32)),null);assert.ok(!encrypted.includes('TEST-REFRESH'));
const prior={...process.env},fetchBefore=globalThis.fetch;
process.env.WORKSPACE_AUTH_SECRET='test-calendar-workspace-secret-only';
process.env.GOOGLE_CALENDAR_CLIENT_ID='test-client';process.env.GOOGLE_CALENDAR_CLIENT_SECRET='test-secret';process.env.GOOGLE_CALENDAR_REDIRECT_URI='https://mekh.ca/api/google-calendar?action=callback';
const issued=String(Date.now()),token=issued+'.'+createHmac('sha256',process.env.WORKSPACE_AUTH_SECRET).update(issued).digest('hex');
assert.ok(validWorkspaceToken(token,process.env.WORKSPACE_AUTH_SECRET));assert.ok(!validWorkspaceToken(token+'x',process.env.WORKSPACE_AUTH_SECRET));assert.ok(!validWorkspaceToken(token,process.env.WORKSPACE_AUTH_SECRET,Date.now()+366*86400000));
const session=seal({refresh:'test-refresh',binding:createHash('sha256').update(token).digest('hex'),expires:Date.now()+60000,calendar:{id:'classes',summary:'Classes',timeZone:'America/Toronto'}});
let calls=[];
globalThis.fetch=async(url,options)=>{
  calls.push({url,options});
  if(url==='https://oauth2.googleapis.com/token')return {ok:true,status:200,json:async()=>({access_token:'test-access'})};
  return {ok:false,status:412,json:async()=>({error:{code:412}})};
};
async function request(action,method='GET',body,auth=true,origin='https://mekh.ca') {
  const headers={},res={statusCode:200,setHeader:(k,v)=>headers[k]=v,end:data=>res.data=data};
  const req={url:'/api/google-calendar?action='+action,method,headers:{origin,'content-type':'application/json',cookie:auth?`workspace_auth=${token}; planner_google=${session}`:''},body};
  await handler(req,res);return {...res,headers};
}
try {
  assert.equal((await request('events')).statusCode,400);
  const before=calls.length;assert.equal((await request('status','GET',undefined,false)).statusCode,401);assert.equal(calls.length,before);
  assert.equal((await request('event','POST',{},true,'https://evil.invalid')).statusCode,403);
  assert.equal((await request('status')).statusCode,200);
  const event={summary:'MATH',start:{dateTime:'2026-09-15T11:35:00-04:00'},end:{dateTime:'2026-09-15T12:55:00-04:00'},attendees:[{email:'must-not-send@example.invalid'}]};
  assert.equal(validateEvent(event).attendees,undefined);
  assert.throws(()=>validateEvent({...event,end:event.start}));
  const response=await request('event','POST',{id:'event_id',etag:'"old-version"',event});
  assert.equal(response.statusCode,409);assert.equal(calls.at(-1).options.headers['If-Match'],'"old-version"');assert.ok(!calls.at(-1).options.body.includes('attendees'));
  const connected=await request('connect','POST',{});assert.equal(connected.statusCode,200);assert.ok(connected.headers['Set-Cookie'][0].includes('HttpOnly; SameSite=Lax; Secure'));
  const authorization=new URL(JSON.parse(connected.data).url);assert.equal(authorization.origin,'https://accounts.google.com');assert.equal(authorization.searchParams.get('redirect_uri'),process.env.GOOGLE_CALENDAR_REDIRECT_URI);
  assert.equal((await request('callback&state=wrong&code=test')).statusCode,403);
  let saved=null;
  globalThis.fetch=async(url,options)=>{
    calls.push({url,options});
    if(url==='https://oauth2.googleapis.com/token')return {ok:true,status:200,json:async()=>({access_token:'test-access'})};
    if(options.method==='PATCH'){saved={...JSON.parse(options.body),id:'event_id',etag:'"next-version"'};return {ok:true,status:200,json:async()=>saved};}
    return {ok:true,status:200,json:async()=>({items:[saved]})};
  };
  const updated=await request('event','POST',{id:'event_id',etag:'"old-version"',event});
  assert.equal(updated.statusCode,200);assert.equal(JSON.parse(updated.data).event.summary,'MATH');assert.ok(!updated.data.includes('test-access'));
  const pulled=await request('events&from=2026-09-14&to=2026-09-20');
  assert.equal(pulled.statusCode,200);assert.equal(JSON.parse(pulled.data).items[0].id,'event_id');
  const query=new URL(calls.at(-1).url).searchParams;assert.equal(query.get('singleEvents'),'true');
} finally {globalThis.fetch=fetchBefore;for(const k of Object.keys(process.env))if(!(k in prior))delete process.env[k];Object.assign(process.env,prior);}
console.log('Calendar checks passed: exact gaps, true conflicts, recurrence, cancellation, midnight, DST, encrypted cookies, auth, CSRF and edit conflicts.');
