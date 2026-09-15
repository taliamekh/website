import { createHmac, timingSafeEqual, createHash, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

const API = 'https://www.googleapis.com/calendar/v3';
const SCOPES = 'https://www.googleapis.com/auth/calendar.calendarlist.readonly https://www.googleapis.com/auth/calendar.events';
const AGE = 365 * 86400;
const COOKIE = 'planner_google';
const STATE_COOKIE = 'planner_google_state';
const secret = () => process.env.WORKSPACE_AUTH_SECRET || process.env.EXPENSES_AUTH_SECRET || '';
const cookieKey = () => createHash('sha256').update('planner-google-v1:' + (process.env.GOOGLE_CALENDAR_COOKIE_SECRET || secret())).digest();
const eq = (a,b) => typeof a === 'string' && typeof b === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a),Buffer.from(b));
const binding = token => createHash('sha256').update(token || '').digest('hex');
const cookies = req => Object.fromEntries(String(req.headers.cookie || '').split(';').map(p=>{const i=p.indexOf('=');return [p.slice(0,i).trim(),p.slice(i+1)];}));
export function validWorkspaceToken(token, key, now = Date.now()) {
  const [issued, sig, extra] = String(token || '').split('.');
  if (!key || extra || !/^\d+$/.test(issued || '') || !Number.isSafeInteger(Number(issued))) return false;
  if (Number(issued)>now+300000 || now-Number(issued)>AGE*1000) return false;
  return eq(sig,createHmac('sha256',key).update(issued).digest('hex'));
}
export function seal(value, key = cookieKey()) {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm',key,iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);
  return Buffer.concat([iv,cipher.getAuthTag(),body]).toString('base64url');
}
export function unseal(value, key = cookieKey()) {
  try {
    const b=Buffer.from(value || '', 'base64url');
    if(b.length<29 || b.toString('base64url')!==value)return null;
    const cipher=createDecipheriv('aes-256-gcm',key,b.subarray(0,12));
    cipher.setAuthTag(b.subarray(12,28));
    return JSON.parse(Buffer.concat([cipher.update(b.subarray(28)),cipher.final()]).toString('utf8'));
  } catch { return null; }
}
function fail(status,message) { const e=new Error(message); e.status=status; throw e; }
export function validateEvent(body) {
  if (typeof body?.summary !== 'string' || !body.summary.trim() || body.summary.length>1000) fail(400,'An event title is required.');
  const clean={summary:body.summary.trim(),description:String(body.description || '').slice(0,6000),location:String(body.location || '').slice(0,1000)};
  const allDay=Boolean(body.start?.date);
  for (const k of ['start','end']) {
    const value=body[k];
    if (allDay) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value?.date || '') || !Number.isFinite(Date.parse(value.date))) fail(400,'Invalid event date.');
      clean[k]={date:value.date};
    } else {
      if (typeof value?.dateTime!=='string' || value.dateTime.length>45 || !/T.*(?:Z|[+-]\d\d:\d\d)$/.test(value.dateTime) || !Number.isFinite(Date.parse(value.dateTime))) fail(400,'Invalid event time.');
      clean[k]={dateTime:value.dateTime};
      if (value.timeZone) { try { new Intl.DateTimeFormat('en',{timeZone:value.timeZone}); } catch { fail(400,'Invalid time zone.'); } clean[k].timeZone=value.timeZone; }
    }
  }
  const start=Date.parse(clean.start.date || clean.start.dateTime),end=Date.parse(clean.end.date || clean.end.dateTime);
  if (end<=start) fail(400,'End must be later than start.');
  // Never accept attendees, organizer, calendar IDs, or arbitrary Google fields.
  return clean;
}
async function bodyJson(req) {
  if (req.body) {
    if (Buffer.byteLength(JSON.stringify(req.body))>16384) fail(413,'Request too large.');
    return typeof req.body==='string'?JSON.parse(req.body):req.body;
  }
  let body=''; for await (const chunk of req) { body+=chunk; if(Buffer.byteLength(body)>16384) fail(413,'Request too large.'); }
  try { return JSON.parse(body || '{}'); } catch { fail(400,'Invalid JSON.'); }
}
async function googleFetch(url,options) {
  const r=await fetch(url,{...options,signal:AbortSignal.timeout(15000)});
  const data=r.status===204?{}:await r.json();
  if (!r.ok) {
    if (r.status===412) fail(409,'This event changed in Google Calendar. Reload it before saving again.');
    if (r.status===409) fail(409,'This event already exists. Refresh the calendar.');
    if (r.status===401 || data.error==='invalid_grant') fail(401,'Reconnect Google Calendar to continue.');
    if (r.status===403) fail(403,'Google did not allow this action. Check calendar permissions and that the Calendar API is enabled.');
    if (r.status===404 || r.status===410) fail(404,'This event is no longer available. Refresh the calendar.');
    fail(r.status>=500?502:400,'Google Calendar could not complete the request. Try again.');
  }
  return data;
}
async function tokenRequest(params) {
  return googleFetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:process.env.GOOGLE_CALENDAR_CLIENT_ID,client_secret:process.env.GOOGLE_CALENDAR_CLIENT_SECRET,...params})});
}
const eventFields = e => Object.fromEntries(['id','etag','summary','description','location','start','end','status','recurringEventId','originalStartTime','updated','htmlLink'].filter(k=>e[k]!==undefined).map(k=>[k,e[k]]));

export default async function handler(req,res) {
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  const json=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(data));};
  const redirect=url=>{res.statusCode=303;res.setHeader('Location',url);res.end();};
  let setting=[];
  try {
    const c=cookies(req), workspace=c.workspace_auth;
    if (!validWorkspaceToken(workspace,secret())) return json(401,{error:'Unlock Workspace first.'});
    const url=new URL(req.url,'https://local.invalid'), action=url.searchParams.get('action') || 'status';
    const configured=Boolean(process.env.GOOGLE_CALENDAR_CLIENT_ID && process.env.GOOGLE_CALENDAR_CLIENT_SECRET && process.env.GOOGLE_CALENDAR_REDIRECT_URI);
    const callback=configured?new URL(process.env.GOOGLE_CALENDAR_REDIRECT_URI):null;
    const cookie=(name,value,age=AGE)=>{
      setting.push(`${name}=${value}; Path=/api/google-calendar; Max-Age=${age}; HttpOnly; SameSite=Lax${callback?.protocol==='https:'?'; Secure':''}`);
      res.setHeader('Set-Cookie',setting);
    };
    let session=unseal(c[COOKIE]);
    if (session?.binding!==binding(workspace) || session?.expires<Date.now()) session=null;
    if (action==='status' && req.method==='GET') return json(200,{configured,connected:Boolean(session?.refresh),calendar:session?.calendar || null});
    if (!configured) return json(503,{error:'Google Calendar connection is not configured for this website yet.'});
    if (callback.pathname!=='/api/google-calendar' || callback.searchParams.get('action')!=='callback' || (callback.protocol!=='https:' && !['localhost','127.0.0.1'].includes(callback.hostname))) fail(503,'Invalid Calendar connection configuration.');
    if (req.method!=='GET') {
      if (req.headers.origin!==callback.origin || !String(req.headers['content-type']).startsWith('application/json')) fail(403,'Request must come from this website.');
    }
    if (action==='connect' && req.method==='POST') {
      const nonce=randomBytes(32).toString('base64url');
      cookie(STATE_COOKIE,seal({nonce,binding:binding(workspace),expires:Date.now()+600000}),600);
      return json(200,{url:'https://accounts.google.com/o/oauth2/v2/auth?'+new URLSearchParams({client_id:process.env.GOOGLE_CALENDAR_CLIENT_ID,redirect_uri:callback.href,response_type:'code',scope:SCOPES,access_type:'offline',prompt:'consent',state:nonce}).toString()});
    }
    if (action==='callback' && req.method==='GET') {
      const state=unseal(c[STATE_COOKIE]); cookie(STATE_COOKIE,'',0);
      if (!state || state.expires<Date.now() || state.binding!==binding(workspace) || !eq(state.nonce,url.searchParams.get('state'))) fail(403,'Google sign-in expired. Start again from the planner.');
      if (url.searchParams.has('error')) return redirect('/workspace/student-planner/?google=cancelled#calendar');
      if (!url.searchParams.get('code')) fail(400,'Missing authorization code.');
      const t=await tokenRequest({grant_type:'authorization_code',code:url.searchParams.get('code'),redirect_uri:callback.href});
      if (!t.refresh_token || SCOPES.split(' ').some(scope=>!String(t.scope || '').split(' ').includes(scope))) fail(403,'Calendar read and edit access is required. Reconnect and allow both requested permissions.');
      cookie(COOKIE,seal({refresh:t.refresh_token,binding:binding(workspace),expires:Date.now()+AGE*1000}));
      return redirect('/workspace/student-planner/?google=connected#calendar');
    }
    if (action==='disconnect' && req.method==='POST') { cookie(COOKIE,'',0);return json(200,{ok:true}); }
    if (!session?.refresh) fail(401,'Connect Google Calendar first.');
    const t=await tokenRequest({grant_type:'refresh_token',refresh_token:session.refresh});
    const headers={Authorization:`Bearer ${t.access_token}`,'Content-Type':'application/json'};
    const get=path=>googleFetch(API+path,{headers});
    if (action==='calendars' && req.method==='GET') {
      const items=[];let page='';
      do { const data=await get('/users/me/calendarList?'+new URLSearchParams({minAccessRole:'writer',maxResults:'250',...(page?{pageToken:page}:{})}));items.push(...data.items || []);page=data.nextPageToken; } while(page);
      return json(200,{items:items.map(e=>({id:e.id,summary:e.summary,timeZone:e.timeZone,accessRole:e.accessRole}))});
    }
    const body=req.method==='POST'?await bodyJson(req):{};
    if (action==='select' && req.method==='POST') {
      if (typeof body.calendarId!=='string' || body.calendarId.length>500) fail(400,'Choose a calendar.');
      const cal=await get('/users/me/calendarList/'+encodeURIComponent(body.calendarId));
      if (!['owner','writer'].includes(cal.accessRole)) fail(403,'This calendar is read-only.');
      session.calendar={id:cal.id,summary:cal.summary,timeZone:cal.timeZone || 'America/Toronto'};
      cookie(COOKIE,seal(session)); return json(200,{calendar:session.calendar});
    }
    if (!session.calendar) fail(400,'Choose the school calendar first.');
    const path='/calendars/'+encodeURIComponent(session.calendar.id)+'/events';
    if (action==='events' && req.method==='GET') {
      const from=url.searchParams.get('from'),to=url.searchParams.get('to');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(to || '') || !Number.isFinite(Date.parse(from)) || !Number.isFinite(Date.parse(to)) || to<from || Date.parse(to)-Date.parse(from)>550*86400000) fail(400,'Invalid calendar range.');
      // UTC padding includes all local dates in either direction; client clips
      // using the selected calendar's IANA zone, including DST transitions.
      const params=new URLSearchParams({timeMin:new Date(Date.parse(from)-86400000).toISOString(),timeMax:new Date(Date.parse(to)+2*86400000).toISOString(),singleEvents:'true',orderBy:'startTime',maxResults:'2500'});
      const items=[]; let page='';
      do { if(page)params.set('pageToken',page);const data=await get(path+'?'+params);items.push(...(data.items || []).map(eventFields));page=data.nextPageToken;if(items.length>20000)fail(413,'Choose a shorter calendar range.'); } while(page);
      return json(200,{items,calendar:session.calendar});
    }
    if (action==='event' && req.method==='POST') {
      const clean=validateEvent(body.event);
      let target=path,method='POST';
      if(body.id) {
        if (!/^[a-zA-Z0-9_-]{1,1024}$/.test(body.id) || typeof body.etag!=='string' || body.etag.length>200) fail(400,'Refresh the event before editing.');
        target+='/'+encodeURIComponent(body.id);method='PATCH';headers['If-Match']=body.etag;
      } else {
        // Stable client-generated ID makes create safe to retry after a timeout.
        if(!/^[0-9a-f]{32}$/.test(body.requestId || '')) fail(400,'Missing event request ID.');
        clean.id=body.requestId;
      }
      try {
        const event=await googleFetch(API+target+'?sendUpdates=none',{method,headers,body:JSON.stringify(clean)});
        return json(200,{event:eventFields(event)});
      } catch(e) {
        if(method!=='POST' || e.status!==409)throw e;
        const existing=await get(path+'/'+clean.id);
        const sameTime=(a,b)=>a?.date? a.date===b?.date : !b?.date && Date.parse(a?.dateTime)===Date.parse(b?.dateTime);
        if(existing.summary!==clean.summary || !sameTime(existing.start,clean.start) || !sameTime(existing.end,clean.end) || (existing.location || '')!==clean.location || (existing.description || '')!==clean.description)throw e;
        return json(200,{event:eventFields(existing)});
      }
    }
    return json(405,{error:'Method not allowed.'});
  } catch (e) { return json(e.status || 502,{error:e.status?e.message:'Calendar connection failed. Try again.'}); }
}
