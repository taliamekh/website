// Local-only API fixture for visual round-trip testing. Separate origin/storage;
// no Google credentials, no outbound network calls and no production event writes.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const root=new URL('../workspace/student-planner/',import.meta.url);
const date=new Date().toLocaleDateString('en-CA',{timeZone:'America/Toronto'});
const cal={id:'test-school',summary:'Calendar TEST ONLY',timeZone:'America/Toronto'};
let events=[
  {id:'test-a',summary:'TEST · First class',etag:'"1"',start:{dateTime:date+'T10:05:00-04:00'},end:{dateTime:date+'T11:25:00-04:00'}},
  {id:'test-b',summary:'TEST · Ten-minute gap',etag:'"1"',start:{dateTime:date+'T11:35:00-04:00'},end:{dateTime:date+'T12:55:00-04:00'}},
  {id:'test-c',summary:'TEST · Real conflict',etag:'"1"',start:{dateTime:date+'T11:45:00-04:00'},end:{dateTime:date+'T12:15:00-04:00'}},
];
const files=new Set(['index.html','css/app.css','css/calendar.css','js/app.js','js/calendar-core.js','js/calendar-views.js','js/google-calendar.js']);
createServer(async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1:8126');res.setHeader('Cache-Control','no-store');
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
  try {
    if(url.pathname==='/api/google-calendar') {
      const action=url.searchParams.get('action');
      if(action==='status')return json(200,{configured:true,connected:true,calendar:cal});
      if(action==='calendars')return json(200,{items:[{...cal,accessRole:'owner'}]});
      if(action==='select')return json(200,{calendar:cal});
      if(action==='events')return json(200,{items:events,calendar:cal});
      if(action==='event' && req.method==='POST'){
        let text='';for await(const chunk of req)text+=chunk;const body=JSON.parse(text);
        const old=events.find(e=>e.id===body.id);
        if(old && old.etag!==body.etag)return json(409,{error:'This event changed in Google Calendar. Reload it before saving again.'});
        const event={...body.event,id:body.id || body.requestId,etag:'"'+Date.now()+'"'};
        events=events.filter(e=>e.id!==event.id).concat(event);return json(200,{event});
      }
      return json(404,{error:'Fixture action not supported.'});
    }
    // Test-only control page mimics edits arriving from Google while the planner
    // remains open. Only fixture data in memory is modified.
    if(url.pathname==='/simulate-google') {
      if(req.method==='POST'){events=events.map(e=>e.id==='test-a'?{...e,summary:'TEST · Updated in Google',etag:'"external-'+Date.now()+'"',start:{dateTime:date+'T09:45:00-04:00'},end:{dateTime:date+'T11:15:00-04:00'}}:e);res.setHeader('Content-Type','text/html');return res.end('<p>Test event updated. Return to the planner.</p>');}
      res.setHeader('Content-Type','text/html');return res.end('<h1>Google Calendar test fixture</h1><form method="post"><button>Simulate Google edit</button></form>');
    }
    if(url.pathname==='/mobile') {
      res.setHeader('Content-Type','text/html; charset=utf-8');
      const view=['dashboard','schedule','calendar'].includes(url.searchParams.get('view'))?url.searchParams.get('view'):'dashboard';
      return res.end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>390px mobile calendar test</title><style>body{margin:0;background:#ddd;font:14px system-ui}nav{padding:12px}iframe{display:block;width:390px;height:844px;border:0;margin:0 16px}</style><nav>Mobile test · 390 × 844 <a href="/mobile?view=dashboard">Dashboard</a> · <a href="/mobile?view=schedule">Class Schedule</a> · <a href="/mobile?view=calendar">Calendar</a></nav><iframe name="phone" title="390px phone preview" src="/workspace/student-planner/#${view}"></iframe>`);
    }
    let path=url.pathname.replace(/^\/workspace\/student-planner\//,'') || 'index.html';
    if(!files.has(path)){res.statusCode=404;return res.end();}
    const content=await readFile(new URL(path,root));
    res.setHeader('Content-Type',path.endsWith('.css')?'text/css':path.endsWith('.js')?'text/javascript':'text/html');res.end(content);
  } catch {json(500,{error:'Fixture error'});}
}).listen(8126,'127.0.0.1',()=>console.log('Calendar test fixture at http://127.0.0.1:8126/workspace/student-planner/#calendar'));
