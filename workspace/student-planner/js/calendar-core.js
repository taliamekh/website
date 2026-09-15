/* Shared minute-accurate calendar math. Intervals are [start, end): touching
   events are not conflicts. Keep this independent of the DOM and network. */
(function (root) {
  const dateKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  function minutes(value) {
    const m = String(value || '').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
    if (!m) return null;
    let h = Number(m[1]);
    const min = Number(m[2] || 0);
    if (min > 59 || h > 24 || (h === 24 && min) || (m[3] && (h < 1 || h > 12))) return null;
    if (m[3]) h = h % 12 + (/pm/i.test(m[3]) ? 12 : 0);
    return h * 60 + min;
  }
  const time = n => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  function layout(events, from = 420, to = 1440) {
    const items = events.map((event, index) => ({ ...event, index, actualStart:event.start, actualEnd:event.end,
      start: Math.max(from, event.start), end: Math.min(to, event.end) }))
      .filter(e => Number.isFinite(e.start) && Number.isFinite(e.end) && e.end > e.start)
      .sort((a, b) => a.start - b.start || a.end - b.end || a.index - b.index);
    const result = [];
    let group = [], maxEnd = -Infinity;
    const finish = () => {
      const ends = [];
      for (const e of group) {
        let lane = ends.findIndex(end => end <= e.start);
        if (lane < 0) lane = ends.length;
        ends[lane] = e.end;
        e.lane = lane;
      }
      for (const e of group) result.push({ ...e, lanes: ends.length,
        top: (e.start - from) / (to - from) * 100,
        height: (e.end - e.start) / (to - from) * 100 });
      group = [];
    };
    for (const e of items) {
      if (e.start >= maxEnd) finish();
      group.push(e);
      maxEnd = group.length === 1 ? e.end : Math.max(maxEnd, e.end);
    }
    finish();
    return result;
  }
  function style(e) {
    return `top:${e.top}%;height:max(0px,calc(${e.height}% - 1px));left:calc(${e.lane / e.lanes * 100}% + 1px);width:calc(${100 / e.lanes}% - 2px);`;
  }
  function dayIndices(value) {
    const s = String(value || '').toUpperCase().replace(/MON(?:DAY)?/g, 'M').replace(/TUE(?:SDAY)?/g, 'T').replace(/WED(?:NESDAY)?/g, 'W').replace(/THU(?:RSDAY)?|TH/g, 'R').replace(/FRI(?:DAY)?/g, 'F').replace(/SAT(?:URDAY)?/g, 'SA').replace(/SUN(?:DAY)?/g, 'SU');
    const tokens = s.match(/SA|SU|[MTWRFU]/g) || [];
    return ['M','T','W','R','F','SA','SU'].flatMap((t,i) => tokens.includes(t) || (i === 6 && tokens.includes('U')) ? [i] : []);
  }
  function googleCovers(d, date) {
    const g = d.googleCalendar;
    return Boolean(g?.calendarId && g.from <= date && g.to >= date && Array.isArray(g.events));
  }
  function schoolEvents(d, from, to) {
    const result = [];
    for (let dt = new Date(from + 'T12:00:00'); dateKey(dt) <= to; dt.setDate(dt.getDate() + 1)) {
      const date = dateKey(dt), day = (dt.getDay() + 6) % 7;
      if (googleCovers(d, date)) {
        result.push(...d.googleCalendar.events.filter(e => e.date === date));
        continue;
      }
      (d.courses || []).filter(c => c.status === 'Active' && dayIndices(c.days).includes(day)).forEach(c => {
        const ov = (d.scheduleOverrides || []).find(o => o.courseId === c.id && o.date === date);
        if (ov?.action === 'cancel') return;
        const start = minutes(ov?.newTime || c.time);
        if (start == null) return;
        let end = minutes(ov?.newEndTime || c.endTime) ?? start + 75;
        if (end === 0 && start > 0) end = 1440;
        result.push({ date, start, end, time: time(start), endTime: time(end), title: c.code,
          detail: c.name, location: ov?.newRoom || c.room || '', kind: 'class', color: c.color,
          courseId: c.id, override: Boolean(ov) });
      });
      (d.labs || []).filter(l => l.date && l.status !== 'Done').forEach(l => {
        const delta = Math.round((Date.parse(date + 'T12:00:00Z') - Date.parse(l.date + 'T12:00:00Z')) / 86400000);
        const every = l.pattern === 'weekly' ? 7 : l.pattern === 'biweekly' ? 14 : 0;
        if (delta < 0 || (every ? delta % every !== 0 : delta !== 0)) return;
        const start = minutes(l.time);
        if (start == null) return;
        let end = minutes(l.endTime) ?? start + 90;
        if (end === 0 && start > 0) end = 1440;
        result.push({ date, start, end, time: time(start), endTime: time(end), title: l.course || 'Lab',
          detail: l.title, location: l.location || '', kind: 'lab', color: '#9BC09A', labId: l.id });
      });
    }
    return result.sort((a,b) => a.date.localeCompare(b.date) || (a.start ?? -1) - (b.start ?? -1));
  }
  function googleEvents(items, zone = 'America/Toronto') {
    const parts = value => {
      const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: zone, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23' }).formatToParts(new Date(value)).map(x => [x.type,x.value]));
      return { date:`${p.year}-${p.month}-${p.day}`, minute:Number(p.hour) * 60 + Number(p.minute) };
    };
    return items.filter(e => e.status !== 'cancelled' && e.start && e.end).flatMap(e => {
      const allDay = Boolean(e.start.date), s = allDay ? {date:e.start.date,minute:0} : parts(e.start.dateTime);
      const end = allDay ? {date:e.end.date,minute:0} : parts(e.end.dateTime);
      const result = [];
      for (let dt = new Date(s.date + 'T12:00:00'); dateKey(dt) <= end.date; dt.setDate(dt.getDate()+1)) {
        const date = dateKey(dt);
        if (date === end.date && end.minute === 0) break;
        const start = date === s.date ? s.minute : 0, finish = date === end.date ? end.minute : 1440;
        const title = e.summary || 'Untitled event';
        result.push({ googleId:e.id, etag:e.etag, recurringEventId:e.recurringEventId, date, allDay,
          start:allDay ? null : start, end:allDay ? null : finish,
          time:allDay ? '' : time(start), endTime:allDay ? '' : time(finish),
          title, detail:e.description || '', location:e.location || '',
          kind:/\b(lab|PA|tutorial)\b/i.test(title) ? 'lab' : 'class', color:'#C9A9E8', raw:e });
      }
      return result;
    });
  }
  const core = { dateKey, minutes, time, layout, style, schoolEvents, googleCovers, googleEvents };
  if (typeof module !== 'undefined') module.exports = core;
  else root.CalendarCore = core;
})(typeof window !== 'undefined' ? window : globalThis);
