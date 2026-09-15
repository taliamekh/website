/* Google is the canonical store for the selected school calendar. Credentials
   stay in the server's encrypted HttpOnly cookie, never planner JSON/storage. */
const GoogleCalendarSync = {
  status: null, error: '', busy: false,
  async request(action, body, params={}) {
    const r=await fetch('/api/google-calendar?'+new URLSearchParams({action,...params}),{
      credentials:'same-origin',cache:'no-store',...(body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),signal:AbortSignal.timeout(60000),
    });
    let data;try { data=await r.json(); } catch { throw new Error('The Google Calendar service is unavailable in this preview.'); }
    if (!r.ok) {const err=new Error(data.error || 'Google Calendar request failed.');err.status=r.status;throw err;}
    return data;
  },
  async init() {
    try {
      this.status=await this.request('status');
      if (this.status.connected && this.status.calendar) await this.refresh();
      else this.renderStatus();
      const url=new URL(location.href);
      if(url.searchParams.has('google')) { const connected=url.searchParams.get('google')==='connected';url.searchParams.delete('google');history.replaceState(null,'',url);if(connected)await this.open();else Toast.show('Google Calendar connection cancelled.'); }
    } catch(e) {this.error=e.message;this.renderStatus();}
    this.timer=setInterval(()=>{if(document.visibilityState==='visible' && this.status?.calendar)this.refresh().catch(()=>{});},60000);
    window.addEventListener('focus',()=>{if(this.status?.calendar)this.refresh().catch(()=>{});});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible' && this.status?.calendar)this.refresh().catch(()=>{});});
  },
  renderStatus() {
    document.querySelectorAll('[data-google-status]').forEach(el=>{el.outerHTML=this.banner();});
  },
  banner() {
    const g=Store.data?.googleCalendar;
    let label=this.error || (this.status?.connected && g?.syncedAt ? `${g.calendarName} · updated ${new Date(g.syncedAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})} · ${g.timeZone}` : g?.syncedAt ? 'Showing saved calendar. Reconnect to update it.' : 'Google Calendar is not connected.');
    return `<div class="google-sync-bar" data-google-status><span>${escape(label)}</span><button class="btn-soft" onclick="GoogleCalendarSync.open()">${this.status?.connected?'Calendar connection':'Connect Google Calendar'}</button>${this.status?.calendar?'<button class="btn-soft" onclick="GoogleCalendarSync.openEvent()">Add event</button>':''}</div>`;
  },
  async refresh() {
    if(this.busy || !this.status?.calendar)return;
    this.busy=true;
    try {
      const fromDate=new Date();fromDate.setMonth(fromDate.getMonth()-3);fromDate.setDate(1);
      const toDate=new Date();toDate.setFullYear(toDate.getFullYear()+1);
      const from=CalendarCore.dateKey(fromDate),to=CalendarCore.dateKey(toDate);
      const data=await this.request('events',undefined,{from,to});
      if(data.calendar.id!==this.status?.calendar?.id)return;
      const events=CalendarCore.googleEvents(data.items,data.calendar.timeZone).filter(e=>e.date>=from && e.date<=to);
      const old=Store.data.googleCalendar;
      const changed=old?.calendarId!==data.calendar.id || JSON.stringify(old?.events)!==JSON.stringify(events);
      Store.data.googleCalendar={calendarId:data.calendar.id,calendarName:data.calendar.summary,timeZone:data.calendar.timeZone,from,to,events,syncedAt:new Date().toISOString()};
      Store.save();this.error='';
      if(changed && ['dashboard','schedule','calendar'].includes(Router.current))Router.refresh();
      this.renderStatus();
    } catch(e) {this.error=e.message;if(e.status===401)this.status.connected=false;this.renderStatus();throw e;} finally {this.busy=false;}
  },
  async open() {
    Modal.open('<h2>Google Calendar</h2><p role="status">Checking connection…</p>');
    try {
      this.status=await this.request('status');this.error='';
      if(!this.status.configured) {
        Modal.open(`<h2>Google Calendar</h2><p>The website’s Google connection needs its one-time setup before you can sign in.</p>
          <p class="text-mute">Once connected, choose your Classes calendar. Edits here save to Google, and changes in Google appear here automatically.</p>
          <button class="btn-soft" onclick="openCalendarFileTransferModal()">Import or export a calendar file</button>`);
        return;
      }
      if(!this.status.connected) {
        Modal.open(`<h2>Connect Google Calendar</h2><p>Sign in with the account containing your Classes calendar, then choose it from the calendar list.</p>
          <button class="btn" id="googleConnect">Continue with Google</button><p role="status" id="googleConnectionStatus"></p>`);
        document.getElementById('googleConnect').onclick=async()=>{
          try { const data=await this.request('connect',{});location.assign(data.url); }
          catch(e){document.getElementById('googleConnectionStatus').textContent=e.message;}
        };
        return;
      }
      const data=await this.request('calendars');
      const preferred=this.status.calendar?.id || data.items.find(c=>c.summary==='Classes')?.id;
      Modal.open(`<h2>School calendar connection</h2><p>Use the selected Google calendar for your school timetable. Your saved course records stay available.</p>
        <label class="label" for="schoolCalendarSelect">School calendar</label>
        <select class="select" id="schoolCalendarSelect">${!preferred?'<option value="">Choose a calendar</option>':''}${data.items.map(c=>`<option value="${escape(c.id)}"${c.id===preferred?' selected':''}>${escape(c.summary)}</option>`).join('')}</select>
        <p class="text-mute">Edits save directly to this calendar. The planner checks for changes every minute while open and when you return. Times use the calendar’s time zone.</p>
        <div class="row flex-wrap"><button class="btn" id="googleSelect">${this.status.calendar?'Refresh calendar':'Use this calendar'}</button><button class="btn-soft" id="googleDisconnect">Disconnect</button></div>
        <p role="status" id="googleConnectionStatus"></p><button class="btn-soft" onclick="openCalendarFileTransferModal()">Import or export a file</button>`);
      document.getElementById('googleSelect').onclick=async()=>{
        const button=document.getElementById('googleSelect');button.disabled=true;
        try {if(this.busy)throw new Error('A calendar refresh is running. Try again in a moment.');const calendarId=document.getElementById('schoolCalendarSelect').value;if(!calendarId)throw new Error('Choose a calendar first.');const changed=this.status.calendar?.id!==calendarId;const selected=await this.request('select',{calendarId});this.status.calendar=selected.calendar;if(changed){Store.data.calendarLayers={...Store.data.calendarLayers,classes:true,labs:true};Store.save();}await this.refresh();Modal.close();Router.refresh();Toast.show('School calendar connected.');}
        catch(e){document.getElementById('googleConnectionStatus').textContent=e.message;}finally{button.disabled=false;}
      };
      document.getElementById('googleDisconnect').onclick=async()=>{
        try {await this.request('disconnect',{});this.status.connected=false;this.status.calendar=null;this.error='';Modal.close();Router.refresh();Toast.show('Disconnected. Saved events remain available.');}
        catch(e){document.getElementById('googleConnectionStatus').textContent=e.message;}
      };
    } catch(e){this.error=e.message;Modal.open(`<h2>Google Calendar</h2><p>${escape(e.message)}</p><button class="btn-soft" onclick="GoogleCalendarSync.open()">Try again</button><button class="btn-soft" onclick="GoogleCalendarSync.reconnect()">Reconnect Google</button>`);}
  },
  async reconnect() {
    try { const data=await this.request('connect',{});location.assign(data.url); }
    catch(e) {Toast.show(e.message);}
  },
  courseEvents(code) {
    const key=String(code).replace(/\s/g,'').toUpperCase();
    return (Store.data.googleCalendar?.events || []).filter(e=>e.kind==='class' && e.date>=today() && e.title.replace(/\s/g,'').toUpperCase().includes(key)).sort((a,b)=>a.date.localeCompare(b.date) || a.start-b.start);
  },
  async openEvent(id=null,date=today(),startTime='09:00') {
    if(!this.status?.connected || !this.status?.calendar)return this.open();
    const current=id?Store.data.googleCalendar?.events.find(e=>e.googleId===id):null;
    if(id && !current){Toast.show('Refresh the calendar to open this event.');return;}
    const raw=current?.raw,allDay=Boolean(raw?.start?.date),zone=Store.data.googleCalendar?.timeZone || this.status.calendar.timeZone;
    const localDateTime=value=>{
      const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value)).map(x=>[x.type,x.value]));
      return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
    };
    const start=raw?allDay?raw.start.date:localDateTime(raw.start.dateTime):`${date}T${startTime}`;
    const end=raw?allDay?raw.end.date:localDateTime(raw.end.dateTime):localDateTime(this.zonedInstant(`${date}T${startTime}`,zone,60));
    const requestId=crypto.randomUUID().replaceAll('-','');
    Modal.open(`<h2>${id?'Edit calendar event':'Add calendar event'}</h2>
      ${raw?.recurringEventId?'<p>This edits this occurrence of the recurring class.</p>':''}
      <form class="google-event-form" id="googleEventForm">
        <label>Title<input class="input" name="summary" required maxlength="1000" value="${escape(raw?.summary || '')}"></label>
        <div class="google-event-times"><label>Start<input class="input" name="start" type="${allDay?'date':'datetime-local'}" required value="${escape(start)}"></label>
        <label>End${allDay?' (exclusive)':''}<input class="input" name="end" type="${allDay?'date':'datetime-local'}" required value="${escape(end)}"></label></div>
        <span class="text-mute">${escape(zone)}</span><label>Location<input class="input" name="location" maxlength="1000" value="${escape(raw?.location || '')}"></label>
        <label>Notes<textarea class="input" name="description" maxlength="6000" rows="4">${escape(raw?.description || '')}</textarea></label>
        <div class="row flex-wrap"><button class="btn" type="submit">Save to Google Calendar</button>${id?'<button class="btn-soft" type="button" id="reloadGoogleEvent">Reload event</button>':''}</div><p role="status" id="googleEventStatus"></p>
      </form>`);
    document.getElementById('reloadGoogleEvent')?.addEventListener('click',async()=>{try{await this.refresh();await this.openEvent(id);}catch(e){document.getElementById('googleEventStatus').textContent=e.message;}});
    document.getElementById('googleEventForm').onsubmit=async ev=>{
      ev.preventDefault();const form=ev.currentTarget,button=form.querySelector('[type=submit]'),values=Object.fromEntries(new FormData(form));button.disabled=true;
      try {
        const event={summary:values.summary,location:values.location,description:values.description,
          start:allDay?{date:values.start}:{dateTime:raw && values.start===start?raw.start.dateTime:this.zonedInstant(values.start,zone),timeZone:zone},
          end:allDay?{date:values.end}:{dateTime:raw && values.end===end?raw.end.dateTime:this.zonedInstant(values.end,zone),timeZone:zone}};
        if(Date.parse(event.end.date || event.end.dateTime)<=Date.parse(event.start.date || event.start.dateTime))throw new Error('End must be later than start.');
        const saved=await this.request('event',{id,etag:raw?.etag,requestId,event});
        const g=Store.data.googleCalendar;g.events=g.events.filter(e=>e.googleId!==saved.event.id).concat(CalendarCore.googleEvents([saved.event],zone));Store.save();
        Modal.close();Router.refresh();Toast.show('Saved to Google Calendar.');await this.refresh();
      } catch(e){const status=document.getElementById('googleEventStatus');if(status)status.textContent=e.message;else Toast.show(e.message);}finally{button.disabled=false;}
    };
  },
  zonedInstant(local,zone,addMinutes=0) {
    // Resolve wall time in the calendar zone, not the device's zone. Reject
    // nonexistent spring-forward times rather than silently moving a class.
    const target=Date.parse(local+'Z');if(!Number.isFinite(target))throw new Error('Enter a valid date and time.');
    const wall=instant=>{
      const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(instant)).map(x=>[x.type,x.value]));
      return Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`);
    };
    let value=target;for(let i=0;i<4;i++)value+=target-wall(value);
    if(wall(value)!==target)throw new Error('That time does not exist because of daylight saving time. Choose another time.');
    return new Date(value+addMinutes*60000).toISOString();
  },
};
