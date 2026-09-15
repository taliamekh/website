# Student Planner calendars

The planner lives at `/workspace/student-planner/` behind the existing Workspace gate.
Google connection code is implemented, but no live connection is active until the
OAuth setup below is completed. Never substitute sample events for the live calendar.

## Time layout

`calendar-core.js` positions events by their actual start and end minutes. Event
intervals are half-open: an event ending at 11:25 does not overlap one starting at
11:35, or even one starting at 11:25. Only real intersections get side-by-side lanes.
Text is clipped inside its block; it cannot enlarge the occupied time. Labels retain
the real time when a block is clipped to the visible range.

The dashboard week and full Class Schedule run from 7 am to midnight. Calendar day
view includes earlier hours if needed. The dashboard day widgets retain their
configurable ranges. All these time-axis views use the same layout helper. Dates
use local calendar days, not UTC dates that would advance during the evening.

## One-time Google setup

Use a Google Cloud project explicitly chosen for mekh.ca, not an unrelated app's
OAuth client. No credentials should be committed or pasted into the planner.

1. Enable Google Calendar API in the chosen Google Cloud project.
2. Configure the OAuth consent screen for the private planner, with the user's
   Google account allowed to use the app. Request these scopes:
   - `https://www.googleapis.com/auth/calendar.calendarlist.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
3. Create a Web application OAuth client. Register the exact redirect URI:
   `https://mekh.ca/api/google-calendar?action=callback`.
   For a separate local verification environment, additionally register
   `http://127.0.0.1:8001/api/google-calendar?action=callback`.
4. Set these server-side Vercel environment variables, and matching local values
   in ignored `.env.local` for local testing:
   - `GOOGLE_CALENDAR_CLIENT_ID`
   - `GOOGLE_CALENDAR_CLIENT_SECRET`
   - `GOOGLE_CALENDAR_REDIRECT_URI` (must match the current environment exactly)
   - Optional `GOOGLE_CALENDAR_COOKIE_SECRET` (otherwise purpose-derived from the
     existing Workspace auth secret; changing either applicable secret disconnects devices)
5. Deploy through the repo's normal reviewed branch/main workflow only when
   authorized. Vercel env changes require a new deployment.
6. Unlock Workspace, open Calendar → Connect Google Calendar, complete Google's
   consent flow, and select **Classes**. Google permissions technically cover
   accessible events; the website API restricts reads and writes to the calendar
   selected in the encrypted session. The account owner must approve this access.
7. Verify a user-approved event edit in each direction, using an explicitly
   disposable event if authorized. Do not edit real classes merely as test fixtures.

Official references: [web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server),
[events API](https://developers.google.com/workspace/calendar/api/v3/reference/events),
[recurring events](https://developers.google.com/workspace/calendar/api/guides/recurringevents).

## Synchronization behavior and limits

- Google is the source of truth for the selected school calendar. Existing course
  metadata and original local schedule records are preserved; they are not uploaded
  automatically or merged into Google. Inside the fetched date range the Google
  events replace local class/lab timetable occurrences, including empty days and
  cancellations, so deleted Google events cannot resurrect as duplicate seeds.
- The planner fetches three months back through one year ahead, on connection,
  every minute while visible, and when returning to the page. No background job
  runs while the planner is closed; it catches up next time it opens.
- Editing an event from the week dashboard, Class Schedule, Calendar, or linked
  course schedule opens the Google-backed editor. Saving writes to Google first.
  Recurring-event edits affect the selected occurrence; use Google Calendar for
  whole-series changes and deletions. Those changes are pulled into the planner.
- Non-school records (assignments, tests, expenses, etc.) stay local and are not
  automatically published to Google. File import/export is a manual transfer,
  not a two-way connection.
- Stable Google IDs replace cached events. ETags prevent silently overwriting an
  event changed elsewhere. Stable client IDs make creating an event retry-safe.
- Event times use the selected calendar's IANA zone. The editor rejects nonexistent
  spring-forward times and preserves an unchanged instant in repeated fall-back
  hours. All-day end dates are exclusive, following Google's model.
- Offline/errors retain the last saved events and show an error. No failed write
  is reported as successful. This is not an offline write queue.
- Connection state is per device. Refresh tokens are encrypted in an HttpOnly,
  SameSite=Lax cookie bound to the Workspace session, never in planner export or
  localStorage. Event data is cached in the planner's localStorage and can be part
  of a user-requested export. Disconnect clears the device token, not the events
  or Google's account-wide authorization; revoke that through Google if desired.

## Verification

Run `node scripts/check-planner-calendars.mjs` for time geometry, recurrence,
cancellations, timezone/DST, encrypted cookies, auth, CSRF, and conflicting edits.
Run `node --check` on the changed planner scripts and API, plus the existing
Workspace security tests. Use `scripts/workspace-preview.mjs` for gated local QA.

For isolated browser testing, run `node scripts/preview-planner-calendar-fixture.mjs`
and visit its printed URL (port 8126). This separate origin has in-memory test
events and makes no calls to Google. `/simulate-google` modifies only that fixture.
It must never be deployed; both test scripts are excluded by `.vercelignore`.
Test planner saves, incoming edits, conflicts, real versus false overlaps, midnight,
mobile scrolling, and desktop layout. Remove neither real events nor user storage
when finishing tests; stop the fixture server and close its temporary tabs.
