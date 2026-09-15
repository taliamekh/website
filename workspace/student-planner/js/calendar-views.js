/* Shared renderers for dashboard, schedule and Calendar. */
const PlannerCalendarViews = {
  action(e) {
    if (e.googleId) return `GoogleCalendarSync.openEvent(${escape(JSON.stringify(e.googleId))})`;
    if (e.courseId) return `editScheduleBlock(${escape(JSON.stringify(e.courseId))},${escape(JSON.stringify(e.date))})`;
    if (e.labId) return `editLabBlock(${escape(JSON.stringify(e.labId))})`;
    return `openDayDetail(${escape(JSON.stringify(e.date || today()))})`;
  },
  timed(e) {
    if (e.allDay || e.start != null) return e;
    const range = String(e.time || '').split(/[–—]/);
    const start = CalendarCore.minutes(range[0]);
    let end = CalendarCore.minutes(e.endTime || range[1]);
    if (end === 0 && start > 0) end = 1440;
    return { ...e, start, end: end ?? (start == null ? null : start + (e.type === 'todo' ? 15 : 60)) };
  },
  axis(from = 420, to = 1440) {
    let html = '<div class="minute-axis">';
    for (let min = from; min <= to; min += 60) {
      html += `<span style="top:${(min-from)/(to-from)*100}%">${formatTime12(CalendarCore.time(min))}</span>`;
    }
    return html + '</div>';
  },
  blocks(events, from = 420, to = 1440, className = 'minute-event') {
    return CalendarCore.layout(events.map(e=>this.timed(e)).filter(e=>e.start != null),from,to).map(e => {
      const color = /^#[0-9a-f]{6}$/i.test(e.color || '') ? e.color : ({class:'#C9A9E8',lab:'#9BC09A',test:'#F5D27A',exam:'#F0A6BC',todo:'#A8C5F0'}[e.kind || e.type] || '#C9A9E8');
      const timeLabel = formatTimeRange(CalendarCore.time(e.actualStart),CalendarCore.time(e.actualEnd));
      const label = `${timeLabel} · ${e.title}${e.location ? ' · '+e.location : ''}`;
      return `<button type="button" class="${className}" data-start="${e.start}" data-end="${e.end}" data-lane="${e.lane}" data-lanes="${e.lanes}" style="${CalendarCore.style(e)}--schedule-color:${color};--schedule-tint:${color}35;" title="${escape(label)}" aria-label="${escape(label)}" onclick="${this.action(e)}">
        <span class="minute-event-time">${escape(timeLabel)}</span>
        <strong>${escape(e.title)}</strong><small>${escape(e.location || e.detail || '')}</small>
      </button>`;
    }).join('');
  },
  events(d, from, to) {
    const layers = d.calendarLayers || {}, result = {};
    const add = (date,title,type,time,extra={}) => {
      if (!date || date<from || date>to) return;
      (result[date] ||= []).push({date,title,type,kind:type,time:time || '',...extra});
    };
    CalendarCore.schoolEvents(d,from,to).forEach(e => {
      if (layers[e.kind === 'lab' ? 'labs' : 'classes']) add(e.date,e.title,e.kind,formatTimeRange(e.time,e.endTime),{...e,time:formatTimeRange(e.time,e.endTime)});
    });
    if (layers.assignments) d.assignments.filter(a=>!a.submitted).forEach(a=>add(a.due,a.title,'todo',a.dueTime,{endTime:a.endTime}));
    if (layers.tests) d.tests.forEach(e=>add(e.date,e.title,'test',e.time,{endTime:e.endTime}));
    if (layers.exams) d.exams.forEach(e=>add(e.date,e.title,'exam',e.time,{endTime:e.endTime}));
    if (layers.labs) d.labs.forEach(e=>add(e.reportDue,e.title+' report','lab',''));
    if (layers.subs) d.subscriptions.forEach(e=>add(e.renews,'$ '+e.name,'sub',''));
    if (layers.imported) (d.importedCalendars || []).forEach(cal=>cal.events.forEach(e=>add(e.start,e.title,'imported',e.allDay?'':e.startTime,{endTime:e.endTime,allDay:e.allDay})));
    Object.values(result).forEach(list=>list.sort((a,b)=>(this.timed(a).start ?? 1441)-(this.timed(b).start ?? 1441)));
    return result;
  },
  weekWidget(d) {
    const monday = weekStart(0);
    const days = Array.from({length:7},(_,i)=>{const date=new Date(monday);date.setDate(date.getDate()+i);return {date,key:CalendarCore.dateKey(date)};});
    // Dashboard availability is independent of the Calendar's layer toggles.
    const events = this.events({...d,calendarLayers:{classes:true,labs:true,tests:true,exams:true}},days[0].key,days[6].key);
    return widgetBox('Week schedule · 7 am–midnight',`<div class="week-schedule" aria-label="This week's class schedule">
      ${days.map(day=>`<section class="week-schedule-day${day.key===today()?' is-today':''}">
        <header class="week-schedule-day-head"><span>${day.date.toLocaleDateString(undefined,{weekday:'short'})}</span><strong>${day.date.getDate()}</strong></header>
        <div class="week-schedule-block-grid" aria-label="7 am to midnight">${this.blocks(events[day.key] || [],420,1440,'week-schedule-block')}
          ${!events[day.key]?.length?'<div class="week-schedule-open">open day</div>':''}
        </div></section>`).join('')}
    </div>`);
  },
  banner() { return GoogleCalendarSync.banner(); },
  nextClass(d, opts = {}) {
    const date=today(),endDate=new Date();endDate.setDate(endDate.getDate()+7);
    const nowMinute=new Date().getHours()*60+new Date().getMinutes();
    const events=CalendarCore.schoolEvents(d,date,CalendarCore.dateKey(endDate)).filter(e=>e.start!=null);
    if(opts.variant==='list')return widgetBox("Today's classes",`<ul class="mini-list">${events.filter(e=>e.date===date).map(e=>`<li><button class="btn-soft" onclick="${this.action(e)}">${escape(e.title)} · ${escape(formatTimeRange(e.time,e.endTime))}</button></li>`).join('') || '<li>No classes today.</li>'}</ul>`);
    const e=events.find(e=>e.date>date || e.end>nowMinute);
    if(!e)return '<div class="widget-body widget-empty">No classes scheduled.</div>';
    const code=e.title.match(/\b[A-Z]{4}\s*\d{4}\b/)?.[0] || e.title;
    const label=e.date===date && e.start<=nowMinute?'In class right now':e.date===date?'Next class today':`Next class · ${new Date(e.date+'T12:00:00').toLocaleDateString(undefined,{weekday:'short'})}`;
    return `<div class="widget-body class-hero"><div class="class-hero-state">${escape(label)}</div><div class="class-hero-code">${escape(code)}</div>
      ${opts.variant==='minimal'?'':`<div class="class-hero-name">${escape(e.googleId?e.title:e.detail || '')}</div>`}
      <div class="class-hero-meta"><span>${icon('clock',13)} ${escape(formatTimeRange(e.time,e.endTime))}</span>${e.location?`<span>${icon('pin',13)} ${escape(e.location)}</span>`:''}</div></div>`;
  },
  detail(date) {
    const events=this.events({...Store.data,calendarLayers:{classes:true,labs:true,assignments:true,tests:true,exams:true,subs:true,imported:true}},date,date)[date] || [];
    Modal.open(`<h2>${new Date(date+'T12:00:00').toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</h2>
      <div class="day-detail-list">${events.map(e=>`<div class="day-detail-row"><div style="flex:1;min-width:0"><strong>${escape(e.title)}</strong><div class="text-mute">${escape(e.location || '')}</div><div>${escape(e.time)}</div></div>
        ${e.googleId||e.courseId||e.labId?`<button class="btn-soft" onclick="${this.action(e)}">Edit</button>`:''}</div>`).join('') || '<p>No events scheduled.</p>'}</div>`);
  },
  schedule(root) {
    const ws = weekStart(scheduleWeekOffset);
    const days = Array.from({length:7},(_,i)=>{const date=new Date(ws);date.setDate(date.getDate()+i);return {date,key:CalendarCore.dateKey(date)};});
    const events = CalendarCore.schoolEvents(Store.data,days[0].key,days[6].key);
    root.innerHTML = `<header class="page-header"><div><h1 class="page-title">${icon('calendar',22)} Class Schedule</h1>
      <p class="page-subtitle">7 am–midnight · blocks follow exact times. Tap a class to edit.</p></div>
      <div class="schedule-navigation"><button class="btn btn-ghost btn-sm" onclick="schedNav(-1)">◀ prev</button>
        <span>${ws.toLocaleDateString(undefined,{month:'short',day:'numeric'})} – ${days[6].date.toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span>
        <button class="btn btn-ghost btn-sm" onclick="schedNav(1)">next ▶</button>
        ${scheduleWeekOffset?'<button class="btn-soft" onclick="schedNav(\'today\')">today</button>':''}
      </div></header>${this.banner()}
      <div class="schedule precise-schedule mb-24"><div class="precise-week-inner">
        <div class="precise-week-head"><div></div>${days.map(d=>`<div>${d.date.toLocaleDateString(undefined,{weekday:'short'})} ${d.date.getDate()}</div>`).join('')}</div>
        <div class="precise-week-body">${this.axis()}${days.map(d=>`<div class="precise-day-column" aria-label="${d.key}">
          ${Array.from({length:17},(_,i)=>`<button class="minute-slot" style="top:${i/17*100}%;height:${100/17}%" aria-label="Add event ${d.key} ${i+7}:00" onclick="${CalendarCore.googleCovers(Store.data,d.key)?`GoogleCalendarSync.openEvent(null,'${d.key}','${String(i+7).padStart(2,'0')}:00')`:`addScheduleSlot('${d.key}',${i+7})`}"></button>`).join('')}
          ${this.blocks(events.filter(e=>e.date===d.key))}</div>`).join('')}</div>
      </div></div>`;
  },
  day(refDate) {
    const date = CalendarCore.dateKey(refDate), events=(this.events(Store.data,date,date)[date] || []).map(e=>this.timed(e));
    const from = Math.min(420,...events.filter(e=>e.start!=null).map(e=>Math.floor(e.start/60)*60));
    return `<div class="cal-day"><div class="cal-day-header"><h2>${refDate.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</h2></div>
      ${events.some(e=>e.start==null)?`<div class="calendar-all-day">${events.filter(e=>e.start==null).map(e=>`<button class="btn-soft" onclick="${this.action(e)}">${escape(e.title)}</button>`).join('')}</div>`:''}
      <div class="precise-single-day" style="--hour-count:${(1440-from)/60}">${this.axis(from)}<div class="precise-day-column">${this.blocks(events,from)}</div></div></div>`;
  },
  dayWidget(d, opts, inst, schoolOnly = false) {
    const date=today();
    const events=schoolOnly?CalendarCore.schoolEvents(d,date,date):(this.events({...d,calendarLayers:inst?.layers || d.calendarLayers},date,date)[date] || []);
    const from=Math.max(0,Math.min(1380,(Number(inst?.startH) || 7)*60));
    const to=Math.max(from+60,Math.min(1440,(Number(inst?.endH) || 24)*60));
    return widgetBox(schoolOnly?"Today's classes":"Today's schedule",`<div class="precise-single-day compact-day" style="--hour-count:${(to-from)/60}">${this.axis(from,to)}<div class="precise-day-column">${this.blocks(events,from,to)}</div></div>`);
  },
};
