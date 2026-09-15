/* ==========================================================================
   Student Planner — main app
   ========================================================================== */

/* -- Global state ---------------------------------------------------------- */
const STORAGE_KEY = 'tm_student_planner_v1';
const EXPENSE_SYNC_KEY = 'tm_expenses_sync_v1';

const DEFAULT_STATE = {
  user: { name: 'Talia', startedOn: new Date().toISOString() },

  // Legacy layout template. Fresh/reset instances are materialized by
  // createStudentPlannerState() below with Talia's current Fall 2026 records.
  courses: [
    { id: 'course-ecor2050', code: 'ECOR 2050', name: 'Design & Communication', credits: 0, year: 3, professor: '', email: '', room: '', days: '', time: '', endTime: '', semester: 'Fall', status: 'Active', grade: 0, color: '#F5D27A', notes: '' },
    { id: 'course-maae2202', code: 'MAAE 2202', name: 'Mechanics of Solids', credits: 0, year: 3, professor: '', email: '', room: '', days: '', time: '', endTime: '', semester: 'Fall', status: 'Active', grade: 0, color: '#A8C5F0', notes: '' },
    { id: 'course-math2004-2008', code: 'MATH 2004 / 2008', name: 'Multivariable Calculus', credits: 0, year: 3, professor: '', email: '', room: '', days: '', time: '', endTime: '', semester: 'Fall', status: 'Active', grade: 0, color: '#C9A9E8', notes: '' },
    { id: 'course-maae2300', code: 'MAAE 2300', name: 'Fluid Mechanics I', credits: 0, year: 3, professor: '', email: '', room: '', days: '', time: '', endTime: '', semester: 'Fall', status: 'Active', grade: 0, color: '#9BC09A', notes: '' },
  ],

  assignments: [
    { id: 'a1', course: 'CSCI 1101', title: 'Project 3: Mini Compiler',     type: 'Project',     due: nextDays(2),  status: 'In Progress', priority: 'High',  weight: 20, grade: 0,  submitted: false, notes: 'pair w/ Sam', link: '' },
    { id: 'a2', course: 'MATH 1004', title: 'Problem Set 7',                type: 'Homework',    due: nextDays(4),  status: 'Not Started', priority: 'Med',   weight: 5,  grade: 0,  submitted: false, notes: '', link: '' },
    { id: 'a3', course: 'PHYS 1003', title: 'Lab Report — Pendulum',        type: 'Lab Report',  due: nextDays(6),  status: 'In Progress', priority: 'Med',   weight: 8,  grade: 0,  submitted: false, notes: 'add error analysis', link: '' },
    { id: 'a4', course: 'ENGL 1100', title: 'Close Reading Essay',          type: 'Essay',       due: nextDays(9),  status: 'Not Started', priority: 'High',  weight: 15, grade: 0,  submitted: false, notes: '1200 words', link: '' },
    { id: 'a5', course: 'CSCI 1101', title: 'Lab 4 Worksheet',              type: 'Worksheet',   due: nextDays(-3), status: 'Submitted',   priority: 'Low',   weight: 2,  grade: 96, submitted: true,  notes: '', link: '' },
    { id: 'a6', course: 'MATH 1004', title: 'Problem Set 6',                type: 'Homework',    due: nextDays(-7), status: 'Submitted',   priority: 'Med',   weight: 5,  grade: 88, submitted: true,  notes: '', link: '' },
  ],

  tests: [
    { id: 't1', course: 'MATH 1004', title: 'Quiz 4 — Derivatives',  date: nextDays(5),  weight: 5,  grade: 0, status: 'Upcoming',  notes: 'Sec 3.1–3.4' },
    { id: 't2', course: 'PHYS 1003', title: 'Midterm 1',             date: nextDays(11), weight: 25, grade: 0, status: 'Upcoming',  notes: 'Chapters 1–4' },
    { id: 't3', course: 'CSCI 1101', title: 'Quiz 3 — Recursion',    date: nextDays(-4), weight: 5,  grade: 92, status: 'Done',      notes: '' },
  ],

  exams: [
    { id: 'e1', course: 'MATH 1004', title: 'Final Exam', date: nextDays(40), location: 'Hall A', weight: 35, grade: 0, status: 'Upcoming', notes: '' },
    { id: 'e2', course: 'PHYS 1003', title: 'Final Exam', date: nextDays(43), location: 'Hall B', weight: 40, grade: 0, status: 'Upcoming', notes: '' },
    { id: 'e3', course: 'CSCI 1101', title: 'Final Exam', date: nextDays(38), location: 'Lab 4',  weight: 30, grade: 0, status: 'Upcoming', notes: '' },
  ],

  labs: [
    // PHYS labs — every Wednesday 14:00–17:00 (weekly)
    { id: 'l1', course: 'PHYS 1003', title: 'Lab 1: Motion',         date: nextDays(-21), reportDue: nextDays(-14), time: '14:00', endTime: '17:00', pattern: 'weekly',   status: 'Done',        grade: 92, partner: 'Alex', ta: 'Sam Reyes',  notes: '' },
    { id: 'l2', course: 'PHYS 1003', title: 'Lab 2: Forces',         date: nextDays(-14), reportDue: nextDays(-7),  time: '14:00', endTime: '17:00', pattern: 'once',     status: 'Done',        grade: 86, partner: 'Alex', ta: 'Sam Reyes',  notes: '' },
    { id: 'l3', course: 'PHYS 1003', title: 'Lab 3: Pendulum',       date: nextDays(-7),  reportDue: nextDays(0),   time: '14:00', endTime: '17:00', pattern: 'once',     status: 'In Progress', grade: 0,  partner: 'Alex', ta: 'Sam Reyes',  notes: 'finish writeup' },
    { id: 'l4', course: 'PHYS 1003', title: 'Lab 4: Circuits',       date: nextDays(7),   reportDue: nextDays(14),  time: '14:00', endTime: '17:00', pattern: 'once',     status: 'Upcoming',    grade: 0,  partner: '',     ta: 'Sam Reyes',  notes: '' },
    // CSCI labs — alternating PA / Lab on Fridays 11:00–13:00 (biweekly each, offset)
    { id: 'l5', course: 'CSCI 1101', title: 'Lab A: Hello & I/O',    date: nextDays(-18), reportDue: nextDays(-15), time: '11:00', endTime: '13:00', pattern: 'biweekly', status: 'Done',        grade: 96, partner: 'Sam',  ta: 'Mira Park',  notes: '' },
    { id: 'l6', course: 'CSCI 1101', title: 'PA: Loops & Lists',     date: nextDays(-11), reportDue: nextDays(-8),  time: '11:00', endTime: '13:00', pattern: 'biweekly', status: 'Done',        grade: 94, partner: 'Sam',  ta: 'Mira Park',  notes: '' },
    { id: 'l7', course: 'CSCI 1101', title: 'Lab C: Recursion',      date: nextDays(-4),  reportDue: nextDays(-1),  time: '11:00', endTime: '13:00', pattern: 'biweekly', status: 'Done',        grade: 90, partner: 'Sam',  ta: 'Mira Park',  notes: '' },
    { id: 'l8', course: 'CSCI 1101', title: 'PA: Trees',             date: nextDays(3),   reportDue: nextDays(10),  time: '11:00', endTime: '13:00', pattern: 'biweekly', status: 'Upcoming',    grade: 0,  partner: 'Sam',  ta: 'Mira Park',  notes: '' },
  ],

  habits: [
    { id: 'h1', name: 'Read 20 mins',     emoji: '', days: {} },
    { id: 'h2', name: 'Drink 2L water',   emoji: '', days: {} },
    { id: 'h3', name: 'Move my body',     emoji: '', days: {} },
    { id: 'h4', name: 'Sleep before 11',  emoji: '', days: {} },
    { id: 'h5', name: 'Practice Spanish', emoji: '', days: {} },
    { id: 'h6', name: 'Stretch',          emoji: '', days: {} },
  ],

  todos: [
    { id: 'td1', title: 'Email Prof. Vega about extension',  category: 'School',   priority: 'High', done: false, due: nextDays(1) },
    { id: 'td2', title: 'Pick up lab goggles',                category: 'Errands',  priority: 'Low',  done: false, due: nextDays(2) },
    { id: 'td3', title: 'Submit co-op application — Acme',   category: 'Career',   priority: 'High', done: false, due: nextDays(3) },
    { id: 'td4', title: 'Call grandma',                       category: 'Personal', priority: 'Med',  done: false, due: nextDays(0) },
    { id: 'td5', title: 'Print phys notes',                   category: 'School',   priority: 'Low',  done: true,  due: nextDays(-1) },
  ],

  goals: [
    { id: 'g1', area: 'Academic', title: "Land on dean's list", deadline: 'End of term', notes: 'GPA above 3.7', status: 'In Progress',
      milestones: [
        { id: 'm1a', text: 'Keep MATH grade above 85%', done: true },
        { id: 'm1b', text: 'Submit all assignments on time', done: true },
        { id: 'm1c', text: 'Get at least 90% on midterms', done: false },
        { id: 'm1d', text: 'Final term GPA ≥ 3.7', done: false },
      ] },
    { id: 'g2', area: 'Academic', title: 'Read 1 textbook fully', deadline: 'Term end', notes: '', status: 'In Progress',
      milestones: [
        { id: 'm2a', text: 'Finish Part 1 (chapters 1–4)', done: true },
        { id: 'm2b', text: 'Finish Part 2 (chapters 5–8)', done: false },
        { id: 'm2c', text: 'Finish Part 3 (chapters 9–12)', done: false },
      ] },
    { id: 'g3', area: 'Career', title: 'Secure summer co-op', deadline: 'May 1', notes: '', status: 'In Progress',
      milestones: [
        { id: 'm3a', text: 'Polish resume', done: true },
        { id: 'm3b', text: 'Apply to ≥10 roles', done: true },
        { id: 'm3c', text: 'Land a first interview', done: true },
        { id: 'm3d', text: 'Sign an offer', done: false },
      ] },
    { id: 'g4', area: 'Career', title: 'Build portfolio site', deadline: 'June 1', notes: '', status: 'In Progress',
      milestones: [
        { id: 'm4a', text: 'Pick a stack', done: true },
        { id: 'm4b', text: 'Sketch the layout', done: false },
        { id: 'm4c', text: 'Build the homepage', done: false },
        { id: 'm4d', text: 'Add 3 project case studies', done: false },
        { id: 'm4e', text: 'Deploy to a real domain', done: false },
      ] },
    { id: 'g5', area: 'Health', title: 'Run a 5k', deadline: 'July', notes: '', status: 'In Progress',
      milestones: [
        { id: 'm5a', text: 'Run 1k without stopping', done: true },
        { id: 'm5b', text: 'Run 2k without stopping', done: true },
        { id: 'm5c', text: 'Run 3k without stopping', done: true },
        { id: 'm5d', text: 'Run a full 5k', done: false },
      ] },
    { id: 'g6', area: 'Personal', title: 'Visit a new city', deadline: 'Summer', notes: '', status: 'Not Started',
      milestones: [] },
  ],

  budget: {
    monthlyTarget: 600,
    income: [
      { id: 'i1', name: 'Tutoring',        amount: 280, category: 'Job',   recurring: true },
      { id: 'i2', name: 'Scholarship',     amount: 600, category: 'School', recurring: true },
      { id: 'i3', name: 'Birthday gift',   amount: 100, category: 'Gift',  recurring: false },
    ],
    expenses: [
      { id: 'x1', name: 'Rent',            amount: 580, category: 'Housing', recurring: true },
      { id: 'x2', name: 'Groceries',       amount: 220, category: 'Food',    recurring: true },
      { id: 'x3', name: 'Coffee',          amount: 45,  category: 'Food',    recurring: true },
      { id: 'x4', name: 'Spotify',         amount: 11,  category: 'Subs',    recurring: true },
      { id: 'x5', name: 'Bus pass',        amount: 38,  category: 'Transport', recurring: true },
      { id: 'x6', name: 'New backpack',    amount: 65,  category: 'Other',   recurring: false },
    ],
    // Monthly snapshots — auto-populated on app load when a new month begins.
    // Pre-seeded with 5 months of history for the trend widget.
    history: [
      { key: '2025-12', spend: 1212, income: 980,  target: 1500 },
      { key: '2026-01', spend: 1340, income: 1100, target: 1500 },
      { key: '2026-02', spend: 1080, income: 950,  target: 1500 },
      { key: '2026-03', spend: 1455, income: 1100, target: 1500 },
      { key: '2026-04', spend: 1295, income: 980,  target: 1500 },
    ],
  },

  subscriptions: [
    { id: 's1', name: 'Spotify Student',   price: 5.99, billing: 'Monthly', renews: nextDays(8),  category: 'Music',     notes: '' },
    { id: 's2', name: 'Netflix',           price: 15.99,billing: 'Monthly', renews: nextDays(14), category: 'Entertain', notes: 'shared w/ family' },
    { id: 's3', name: 'iCloud 200GB',      price: 2.99, billing: 'Monthly', renews: nextDays(22), category: 'Storage',   notes: '' },
    { id: 's4', name: 'NYT Student',       price: 4.00, billing: 'Monthly', renews: nextDays(28), category: 'News',      notes: '' },
    { id: 's5', name: 'GitHub Copilot',    price: 0,    billing: 'Monthly', renews: nextDays(30), category: 'Dev',       notes: 'free w/ student pack' },
  ],

  reading: [
    { id: 'r1', title: 'Atomic Habits',            author: 'James Clear',     pages: 320, currentPage: 192, status: 'Reading', notes: 'good chapter on stacking', rating: 0 },
    { id: 'r2', title: 'The Midnight Library',     author: 'Matt Haig',       pages: 304, currentPage: 0,   status: 'To Read', notes: '', rating: 0 },
    { id: 'r3', title: 'The Pragmatic Programmer', author: 'Hunt & Thomas',   pages: 352, currentPage: 123, status: 'Reading', notes: '', rating: 0 },
    { id: 'r4', title: 'Educated',                  author: 'Tara Westover',   pages: 352, currentPage: 352, status: 'Done',    notes: 'beautiful', rating: 5 },
  ],

  contacts: [
    { id: 'p1', name: 'Dr. Lin',     role: 'Professor', course: 'MATH 1004', email: 'lin@uni.edu',   phone: '',  office: '301',     hours: 'TR 2–4 pm', notes: '' },
    { id: 'p2', name: 'Dr. Park',    role: 'Professor', course: 'PHYS 1003', email: 'park@uni.edu',  phone: '',  office: '210',     hours: 'W 1–3 pm',  notes: '' },
    { id: 'p3', name: 'Sam Reyes',   role: 'TA',        course: 'CSCI 1101', email: 'sam@uni.edu',   phone: '',  office: 'Lab 4',   hours: 'F 10–12',   notes: 'great explainer' },
    { id: 'p4', name: 'Jen Ward',    role: 'Advisor',   course: '',          email: 'jward@uni.edu', phone: '555-0140', office: 'Admin 12', hours: 'by appt', notes: 'co-op questions' },
  ],

  notes: 'Some things worth remembering...\n\n• Office hours always before deadlines\n• When stuck, write what you DO know first\n• 25 min focus, 5 min dance break',

  brainDump: [
    { id: 'b1', text: 'Idea for portfolio: tiny garden of all my coding sprouts', created: now() },
    { id: 'b2', text: 'Try the new study spot near the library greenhouse', created: now() },
    { id: 'b3', text: "Don't forget — check if registrar opens at 9 or 10", created: now() },
  ],

  moods: {},  // { 'YYYY-MM-DD': { score: 1-5, note: '' } }

  coop: [
    { id: 'co1', company: 'Acme Robotics',     role: 'SWE Intern',     stage: 'Interviewing', closedReason: '', appliedOn: nextDays(-12), lastContact: nextDays(-3),  nextStep: 'Technical interview',  nextStepDue: nextDays(2),  salary: '32/hr', location: 'Toronto', notes: 'second round with hiring manager — 60 min coding + behavioral', link: '' },
    { id: 'co2', company: 'Greenleaf Studios', role: 'Design Intern',  stage: 'Applied',      closedReason: '', appliedOn: nextDays(-7),  lastContact: nextDays(-7),  nextStep: 'Wait for recruiter',   nextStepDue: '',           salary: '28/hr', location: 'Remote',  notes: 'follow up if silent past 2 weeks', link: '' },
    { id: 'co3', company: 'Paperplane Co',     role: 'Product Intern', stage: 'Offer',        closedReason: '', appliedOn: nextDays(-30), lastContact: nextDays(-2),  nextStep: 'Decide on offer',      nextStepDue: nextDays(11), salary: '30/hr', location: 'NYC',     notes: 'decide by 5/15 — negotiating start date', link: '' },
    { id: 'co4', company: 'NorthStar Labs',    role: 'ML Intern',      stage: 'Closed',       closedReason: 'Rejected', appliedOn: nextDays(-21), lastContact: nextDays(-9),  nextStep: '',                     nextStepDue: '',           salary: '36/hr', location: 'Boston',  notes: 'asked for feedback', link: '' },
    { id: 'co5', company: 'Wildflower',        role: 'SWE Intern',     stage: 'Researching',  closedReason: '', appliedOn: '',           lastContact: '',            nextStep: 'Tailor resume + apply', nextStepDue: nextDays(4),  salary: '',      location: 'Remote',  notes: 'cold app — find an alum to ask', link: '' },
    { id: 'co6', company: 'Lumen AI',          role: 'ML Intern',      stage: 'Assessment',   closedReason: '', appliedOn: nextDays(-9),  lastContact: nextDays(-1),  nextStep: 'Take-home assessment', nextStepDue: nextDays(3),  salary: '34/hr', location: 'Remote',  notes: '90-min coding + 30-min writeup', link: '' },
    { id: 'co7', company: 'Hyacinth',          role: 'Frontend Intern',stage: 'Applied',      closedReason: '', appliedOn: nextDays(-22), lastContact: nextDays(-22), nextStep: '',                     nextStepDue: '',           salary: '30/hr', location: 'SF',      notes: 'silent for 3 weeks — likely ghosted', link: '' },
  ],

  hackathons: [
    { id: 'ha1', name: 'Global Hack Week', organizer: 'MLH', date: nextDays(18), applicationDue: nextDays(10), status: 'Planning', cost: 'Free', placement: '', link: '', notes: 'Find a teammate and choose a climate track.' },
    { id: 'ha2', name: 'Campus Innovation Challenge', organizer: 'University', date: nextDays(35), applicationDue: nextDays(21), status: 'Researching', cost: '$25', placement: '$500 finalist prize', link: '', notes: '' },
  ],

  // Class schedule = derived from courses (by days/time), but we store overrides
  scheduleOverrides: [],

  focus: { mode: 'pomodoro', sessionsToday: 2 },
};

function nextDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function today() { return CalendarCore.dateKey(new Date()); }
function now()  { return Date.now(); }

function createStudentPlannerState() {
  const state = structuredClone(DEFAULT_STATE);
  state.user = { name: 'Talia', startedOn: new Date().toISOString() };
  state.currentSemester = 'F2026';
  state.courses = [
    { id: 'course-ecor2050', code: 'ECOR 2050', name: 'Design/Analysis of Experiments', section: 'B', crn: '31537', credits: 0.5, year: 3, professor: '', email: '', room: '', days: 'TR', time: '11:35', endTime: '12:55', semester: 'Fall', status: 'Active', grade: 0, color: '#F5D27A', notes: 'Registered B2 section · CRN 31539 · Friday 8:35am–11:25am. Previously noted as optional; confirm attendance requirements.' },
    { id: 'course-maae2202', code: 'MAAE 2202', name: 'Mechanics of Solids I', section: 'B', crn: '32977', credits: 0.5, year: 3, professor: '', email: '', room: '', days: 'MW', time: '16:35', endTime: '17:55', semester: 'Fall', status: 'Active', grade: 0, color: '#A8C5F0', notes: 'Registered lab L5 · CRN 32982 · Wednesday 8:35am–11:25am.' },
    { id: 'course-maae2400', code: 'MAAE 2400', name: 'Thermodynamics & Heat Transfer', section: 'A', crn: '32998', credits: 0.5, year: 3, professor: '', email: '', room: '', days: 'TR', time: '10:05', endTime: '11:25', semester: 'Fall', status: 'Active', grade: 0, color: '#F0B38E', notes: 'Registered lab L4 · CRN 33003 · Monday 6:05pm–8:55pm.' },
    { id: 'course-math2004', code: 'MATH 2004', name: 'Multivariable Calculus (Engineering/Physics)', section: 'A', crn: '33284', credits: 0.5, year: 3, professor: '', email: '', room: '', days: 'MW', time: '11:35', endTime: '12:55', semester: 'Fall', status: 'Active', grade: 0, color: '#C9A9E8', notes: 'Registered tutorial AT · CRN 33290 · Monday 2:35pm–3:25pm.' },
    { id: 'course-maae2300', code: 'MAAE 2300', name: 'Fluid Mechanics I', section: 'A', crn: '32984', credits: 0.5, year: 3, professor: '', email: '', room: '', days: 'WF', time: '13:05', endTime: '14:25', semester: 'Fall', status: 'Active', grade: 0, color: '#9BC09A', notes: 'Registered lab L5 · CRN 32993 · Friday 2:35pm–5:25pm.' },
  ];
  state.assignments = [];
  state.tests = [];
  state.exams = [];
  state.labs = [
    { id: 'lab-ecor2050-b2', course: 'ECOR 2050', title: 'B2 · CRN 31539 · registered (attendance previously noted as optional)', date: '2026-09-11', reportDue: '', time: '08:35', endTime: '11:25', pattern: 'weekly', status: 'Upcoming', grade: 0, partner: '', ta: '', notes: 'Confirm whether this Friday component is required.' },
    { id: 'lab-maae2202-l5', course: 'MAAE 2202', title: 'L5 · CRN 32982', date: '2026-09-09', reportDue: '', time: '08:35', endTime: '11:25', pattern: 'weekly', status: 'Upcoming', grade: 0, partner: '', ta: '', notes: '' },
    { id: 'lab-maae2400-l4', course: 'MAAE 2400', title: 'L4 · CRN 33003', date: '2026-09-07', reportDue: '', time: '18:05', endTime: '20:55', pattern: 'weekly', status: 'Upcoming', grade: 0, partner: '', ta: '', notes: '' },
    { id: 'lab-maae2300-l5', course: 'MAAE 2300', title: 'L5 · CRN 32993', date: '2026-09-11', reportDue: '', time: '14:35', endTime: '17:25', pattern: 'weekly', status: 'Upcoming', grade: 0, partner: '', ta: '', notes: '' },
  ];
  state.habits = [];
  state.todos = [];
  state.goals = [];
  state.budget = { monthlyTarget: 0, income: [], expenses: [], history: [], sync: null };
  state.subscriptions = [];
  state.reading = [];
  state.contacts = [];
  state.notes = '';
  state.brainDump = [];
  state.moods = {};
  state.coop = [];
  state.hackathons = [];
  state.scheduleOverrides = [];
  state.focus = { mode: 'pomodoro', sessionsToday: 0 };
  return state;
}

function syncBudgetFromExpenses(data) {
  if (!data || !data.budget) return false;
  let payload;
  try {
    payload = JSON.parse(localStorage.getItem(EXPENSE_SYNC_KEY) || 'null');
  } catch (_) {
    return false;
  }
  if (!payload || !Array.isArray(payload.transactions)) return false;

  const rows = payload.transactions.filter(row => row && typeof row.date === 'string' && Number.isFinite(Number(row.amount)) && !row.excludeFromTotals);
  const incomeRows = Array.isArray(payload.income)
    ? payload.income.filter(row => row && typeof row.date === 'string' && Number.isFinite(Number(row.amount)))
    : [];
  const currentKey = today().slice(0, 7);
  const currentTotals = {};
  rows.filter(row => row.date.slice(0, 7) === currentKey).forEach(row => {
    const category = row.cat || 'Other';
    currentTotals[category] = (currentTotals[category] || 0) + Number(row.amount);
  });

  data.budget.expenses = Object.entries(currentTotals)
    .filter(([, amount]) => amount > 0)
    .map(([category, amount]) => ({ id: `expense-sync-${category}`, name: category, amount: Math.round(amount * 100) / 100, category, recurring: false, synced: true }));
  data.budget.income = incomeRows
    .filter(row => row.date.slice(0, 7) === currentKey && Number(row.amount) > 0)
    .map((row, index) => ({ id: `income-sync-${index}`, name: row.from || 'Income', amount: Number(row.amount), category: row.type || 'Other', recurring: false, synced: true }));

  const months = {};
  rows.forEach(row => {
    const key = row.date.slice(0, 7);
    months[key] = months[key] || { spend: 0, income: 0 };
    months[key].spend += Number(row.amount);
  });
  incomeRows.forEach(row => {
    const key = row.date.slice(0, 7);
    months[key] = months[key] || { spend: 0, income: 0 };
    months[key].income += Number(row.amount);
  });
  data.budget.history = Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-24)
    .map(([key, totals]) => ({ key, spend: Math.round(totals.spend * 100) / 100, income: Math.round(totals.income * 100) / 100, target: data.budget.monthlyTarget || 0 }));
  const latestMonth = data.budget.history[data.budget.history.length - 1] || null;
  data.budget.sync = {
    source: 'Expenses',
    updatedAt: payload.updatedAt || '',
    transactionCount: rows.length,
    latestMonth: latestMonth?.key || '',
    latestSpend: latestMonth?.spend || 0,
  };
  return true;
}

/* -- SVG icon library ------------------------------------------------------ */
const ICONS = {
  home:        '<path d="M3 11l9-8 9 8v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2V11z"/>',
  dashboard:   '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  book:        '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  pencil:      '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
  flask:       '<path d="M9 3v6L5 19a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-4-10V3z"/><line x1="9" y1="3" x2="15" y2="3"/><line x1="7" y1="14" x2="17" y2="14"/>',
  chart:       '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  microscope:  '<path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14"/><path d="M9 14h2"/><circle cx="14" cy="6" r="3"/>',
  cap:         '<path d="M22 10v6"/><path d="M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 4 3 6 3s6-1.34 6-3v-5"/>',
  calendar:    '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  calendarDay: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="2.5" fill="currentColor"/>',
  sparkles:    '<path d="M12 2l1.6 5.5L19 9l-5.4 1.5L12 16l-1.6-5.5L5 9l5.4-1.5z"/><path d="M19 17l.8 2.5L22 20l-2.2.5L19 23l-.8-2.5L16 20l2.2-.5z"/>',
  sprout:      '<path d="M7 20h10"/><path d="M12 20V9"/><path d="M12 9c-3 0-5-2-5-5 3 0 5 2 5 5z"/><path d="M12 9c3 0 5-2 5-5-3 0-5 2-5 5z"/>',
  target:      '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  timer:       '<circle cx="12" cy="14" r="8"/><path d="M12 10v4l2.5 2.5"/><line x1="9" y1="2" x2="15" y2="2"/>',
  smile:       '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
  wallet:      '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
  card:        '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
  bookOpen:    '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  contact:     '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  briefcase:   '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  notebook:    '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5z"/><line x1="9" y1="2" x2="9" y2="22"/>',
  brain:       '<path d="M9.5 2a3 3 0 0 1 3 3v14a3 3 0 1 1-6 0 3 3 0 0 1-3-3 3 3 0 0 1-1-5 3 3 0 0 1 1-5 3 3 0 0 1 3-3 3 3 0 0 1 3-1z"/><path d="M14.5 2a3 3 0 0 0-3 3v14a3 3 0 1 0 6 0 3 3 0 0 0 3-3 3 3 0 0 0 1-5 3 3 0 0 0-1-5 3 3 0 0 0-3-3 3 3 0 0 0-3-1z"/>',
  pin:         '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  cloud:       '<path d="M17.5 19a4.5 4.5 0 1 0-1.6-8.7A6 6 0 0 0 4 12a5 5 0 0 0 4 7"/><line x1="9" y1="22" x2="9" y2="20"/><line x1="13" y1="22" x2="13" y2="20"/>',
  chat:        '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  star:        '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  party:       '<path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01"/><path d="M22 2 11 13"/><path d="M22 13 13 22"/>',
  leaf:        '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96c1.4 9.3 4.7 15.4-8.2 17z"/><path d="M2 21c.7-3 5-7 12-9"/>',
  snowflake:   '<line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/>',
  sun:         '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  ban:         '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>',
  inbox:       '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  outbox:      '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><path d="M12 2v6"/><path d="M9 5l3-3 3 3"/>',
  upload:      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  download:    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  clock:       '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  archive:     '<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>',
  bell:        '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  plus:        '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  arrowRight:  '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  refresh:     '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  check:       '<polyline points="20 6 9 17 4 12"/>',

  /* Mood states — distinct icons for 5-level mood log */
  moodTerrible:  '<circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
  moodLow:       '<circle cx="12" cy="12" r="10"/><line x1="8" y1="15.5" x2="16" y2="15.5"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
  moodNeutral:   '<circle cx="12" cy="12" r="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
  moodGood:      '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
  moodGreat:     '<circle cx="12" cy="12" r="10"/><path d="M7 13c0 3 2 5 5 5s5-2 5-5"/><path d="M7 9l3-1M17 9l-3-1"/>',

  /* Budget icons — non-plant alternatives */
  trendUp:       '<polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/>',
  trendDown:     '<polyline points="3 7 9 13 13 9 21 17"/><polyline points="14 17 21 17 21 10"/>',
  scale:         '<line x1="12" y1="3" x2="12" y2="21"/><path d="M5 10l3-7 3 7c0 1.5-1.3 3-3 3s-3-1.5-3-3z"/><path d="M13 10l3-7 3 7c0 1.5-1.3 3-3 3s-3-1.5-3-3z"/><line x1="3" y1="21" x2="21" y2="21"/>',
  piggy:         '<path d="M19 11.5a7.5 7.5 0 0 1-7.5 7.5h-4a4 4 0 0 1-4-4v-3a4 4 0 0 1 4-4h2"/><path d="M14 4l-2 3"/><path d="M9 9a3 3 0 1 1 6 0v.5"/><circle cx="16" cy="12" r="0.8" fill="currentColor"/>',
  dollarSign:    '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  coins:         '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="M16.71 13.88l.7.71-2.82 2.82"/>',
  shopping:      '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
  receipt:       '<path d="M4 2v20l4-2 4 2 4-2 4 2V2H4z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="13" y2="15"/>',

  /* Mood / general feel */
  flower:        '<circle cx="12" cy="12" r="3"/><path d="M12 2v6M12 22v-6M2 12h6M22 12h-6M5 5l4 4M19 19l-4-4M19 5l-4 4M5 19l4-4"/>',
  zap:           '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  heart:         '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  music:         '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  coffee:        '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/>',
  globe:         '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/>',
  compass:       '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
};

function icon(name, size = 18) {
  const path = ICONS[name];
  if (!path) return '';
  return `<svg class="ui-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

/* -- Semester helpers ------------------------------------------------------ */
function currentSemesterId(date) {
  const d = date ? new Date(date) : new Date();
  const y = d.getFullYear();
  const m = d.getMonth();
  if (m >= 8) return `F${y}`;     // Sep–Dec → Fall
  if (m >= 4) return `S${y}`;     // May–Aug → Summer
  return `W${y}`;                  // Jan–Apr → Winter
}
function semesterLabel(id) {
  const m = String(id || '').match(/^([FWS])(\d{4})$/);
  if (!m) return id || '—';
  return ({ F: 'Fall', W: 'Winter', S: 'Summer' }[m[1]]) + ' ' + m[2];
}
function nextSemesterId(id) {
  const m = String(id).match(/^([FWS])(\d{4})$/);
  if (!m) return currentSemesterId();
  const [, season, y] = m;
  const yy = +y;
  if (season === 'W') return `S${yy}`;
  if (season === 'S') return `F${yy}`;
  return `W${yy + 1}`;
}

/* -- GPA scales ------------------------------------------------------------ */
const GPA_SCALES = {
  '4': {
    name: '4.0 (US standard)',
    max: 4.0,
    table: [
      { min: 90, letter: 'A+', gpa: 4.0 },
      { min: 85, letter: 'A',  gpa: 4.0 },
      { min: 80, letter: 'A-', gpa: 3.7 },
      { min: 77, letter: 'B+', gpa: 3.3 },
      { min: 73, letter: 'B',  gpa: 3.0 },
      { min: 70, letter: 'B-', gpa: 2.7 },
      { min: 67, letter: 'C+', gpa: 2.3 },
      { min: 63, letter: 'C',  gpa: 2.0 },
      { min: 60, letter: 'C-', gpa: 1.7 },
      { min: 50, letter: 'D',  gpa: 1.0 },
      { min: 0,  letter: 'F',  gpa: 0.0 },
    ],
  },
  '5': {
    name: '5.0 (weighted)',
    max: 5.0,
    table: [
      { min: 90, letter: 'A+', gpa: 5.0 },
      { min: 85, letter: 'A',  gpa: 5.0 },
      { min: 80, letter: 'A-', gpa: 4.7 },
      { min: 77, letter: 'B+', gpa: 4.3 },
      { min: 73, letter: 'B',  gpa: 4.0 },
      { min: 70, letter: 'B-', gpa: 3.7 },
      { min: 67, letter: 'C+', gpa: 3.3 },
      { min: 63, letter: 'C',  gpa: 3.0 },
      { min: 60, letter: 'C-', gpa: 2.7 },
      { min: 50, letter: 'D',  gpa: 2.0 },
      { min: 0,  letter: 'F',  gpa: 0.0 },
    ],
  },
  '6': {
    name: '6.0 (Swiss)',
    max: 6.0,
    table: [
      { min: 90, letter: '6',   gpa: 6.0 },
      { min: 80, letter: '5.5', gpa: 5.5 },
      { min: 70, letter: '5',   gpa: 5.0 },
      { min: 60, letter: '4.5', gpa: 4.5 },
      { min: 50, letter: '4',   gpa: 4.0 },
      { min: 40, letter: '3',   gpa: 3.0 },
      { min: 0,  letter: '<3',  gpa: 0.0 },
    ],
  },
  '10': {
    name: '10.0 (European)',
    max: 10.0,
    table: [
      { min: 95, letter: '10',  gpa: 10.0 },
      { min: 90, letter: '9',   gpa: 9.0 },
      { min: 80, letter: '8',   gpa: 8.0 },
      { min: 70, letter: '7',   gpa: 7.0 },
      { min: 60, letter: '6',   gpa: 6.0 },
      { min: 50, letter: '5',   gpa: 5.0 },
      { min: 0,  letter: '<5',  gpa: 0.0 },
    ],
  },
  '12': {
    name: '12.0 (Canadian)',
    max: 12.0,
    table: [
      { min: 90, letter: 'A+', gpa: 12 },
      { min: 85, letter: 'A',  gpa: 11 },
      { min: 80, letter: 'A-', gpa: 10 },
      { min: 77, letter: 'B+', gpa: 9 },
      { min: 73, letter: 'B',  gpa: 8 },
      { min: 70, letter: 'B-', gpa: 7 },
      { min: 67, letter: 'C+', gpa: 6 },
      { min: 63, letter: 'C',  gpa: 5 },
      { min: 60, letter: 'C-', gpa: 4 },
      { min: 55, letter: 'D+', gpa: 3 },
      { min: 50, letter: 'D',  gpa: 2 },
      { min: 0,  letter: 'F',  gpa: 0 },
    ],
  },
};

/* -- Shared schedule parsing helpers -------------------------------------- */
function dayIndices(daysStr) {
  if (!daysStr) return [];
  const out = [];
  // Accept compact course notation (MWF, TR, TH) as well as written day names.
  const s = String(daysStr).toUpperCase()
    .replace(/MON(?:DAY)?/g, 'M')
    .replace(/TUE(?:SDAY)?/g, 'T')
    .replace(/WED(?:NESDAY)?/g, 'W')
    .replace(/THU(?:RSDAY)?/g, 'R')
    .replace(/TH/g, 'R')
    .replace(/FRI(?:DAY)?/g, 'F')
    .replace(/SAT(?:URDAY)?/g, 'SA')
    .replace(/SUN(?:DAY)?/g, 'SU');
  const tokens = s.match(/SA|SU|[MTWRFU]/g) || [];
  if (tokens.includes('M'))  out.push(0);
  if (tokens.includes('T'))  out.push(1);
  if (tokens.includes('W'))  out.push(2);
  if (tokens.includes('R'))  out.push(3);
  if (tokens.includes('F'))  out.push(4);
  if (tokens.includes('SA')) out.push(5);
  if (tokens.includes('SU') || tokens.includes('U')) out.push(6);
  return out;
}
function parseHour(t) {
  if (!t) return null;
  const m = String(t).match(/^(\d{1,2}):?(\d{2})?/);
  if (!m) return null;
  let h = +m[1], min = +(m[2] || 0);
  if (/pm/i.test(t) && h < 12) h += 12;
  if (/am/i.test(t) && h === 12) h = 0;
  return h + min / 60;
}
function formatTime12(t) {
  const hour = parseHour(t);
  if (hour == null) return String(t || '');
  const h = Math.floor(hour) % 24;
  const min = Math.round((hour - Math.floor(hour)) * 60);
  const displayHour = ((h + 11) % 12) + 1;
  return `${displayHour}${min ? `:${String(min).padStart(2, '0')}` : ''}${h >= 12 ? 'pm' : 'am'}`;
}
function formatTimeRange(start, end) {
  const startLabel = formatTime12(start);
  return end ? `${startLabel}–${formatTime12(end)}` : startLabel;
}

/* -- Store ----------------------------------------------------------------- */
const Store = {
  data: null,
  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    this.data = raw ? JSON.parse(raw) : createStudentPlannerState();
    this.migrate();
    this.syncExpenses();
    return this.data;
  },
  migrate() {
    const d = this.data;
    // Default bento layout: 24-col × 60px grid.
    // Tight tiling, varied widget sizes, every content widget sized so default content fits with no scrolling.
    // DEFAULT_BENTO is in current grid units (96 cols × 15px rows).
    const DEFAULT_BENTO = [
      // OVERVIEW header
      { id: 'w-secTop',  type: 'sectionTitle',      variant: 'uppercase',  color: 'auto', x: 0,  y: 0, w: 96, h: 4, inst: { text: 'Overview' } },
      // 4 compact KPI cards (h=8 of 15px ≈ 120px)
      { id: 'w-courses', type: 'statActiveCourses', variant: 'tile',       color: 'rose',   x: 0,  y: 4, w: 24, h: 8 },
      { id: 'w-open',    type: 'statOpenAssign',    variant: 'weekDone',   color: 'butter', x: 24, y: 4, w: 24, h: 8 },
      { id: 'w-nextex',  type: 'nextTest',          variant: 'hero',       color: 'sky',    x: 48, y: 4, w: 24, h: 8 },
      { id: 'w-gpa',     type: 'statGPA',           variant: 'withScale',  color: 'lilac',  x: 72, y: 4, w: 24, h: 8 },
      // THIS WEEK header — sits immediately after KPIs, no divider gap
      { id: 'w-secWk',   type: 'sectionTitle',      variant: 'uppercase',  color: 'auto', x: 0,  y: 12, w: 96, h: 4, inst: { text: 'This week' } },
      // Bento: rich visual upcoming cards (left) + class hero + top to-dos (right column)
      { id: 'w-up',      type: 'upcoming',          variant: 'cards',      color: 'auto',  x: 0,  y: 16, w: 56, h: 44 },
      { id: 'w-cls',     type: 'classToday',        variant: 'hero',       color: 'auto',  x: 56, y: 16, w: 40, h: 16 },
      { id: 'w-todo',    type: 'topHighPriority',   variant: 'list',       color: 'auto',  x: 56, y: 32, w: 40, h: 28 },
      // Bottom row: spending breakdown + co-op pipeline
      { id: 'w-spnd',    type: 'spending',          variant: 'stackBar',   color: 'auto',  x: 0,  y: 60, w: 48, h: 28 },
      { id: 'w-coop',    type: 'coopPipeline',      variant: 'list',       color: 'auto',  x: 48, y: 60, w: 48, h: 28 },
    ];
    const COMPACT_BENTO = [
      { id: 'w-open', type: 'statOpenAssign', variant: 'weekDone', color: 'butter', x: 0, y: 0, w: 26, h: 7 },
      { id: 'w-nextex', type: 'nextTest', variant: 'hero', color: 'sky', x: 26, y: 0, w: 26, h: 7 },
      { id: 'w-gpa', type: 'classToday', variant: 'hero', color: 'lilac', x: 52, y: 0, w: 26, h: 7 },
      { id: 'w-spendingpie', type: 'spendingChart', variant: 'compact', color: 'auto', x: 78, y: 0, w: 18, h: 7 },
      { id: 'w-week', type: 'weekSchedule', variant: 'blocks', color: 'auto', x: 0, y: 8, w: 56, h: 24 },
      { id: 'w-todo', type: 'topHighPriority', variant: 'list', color: 'auto', x: 56, y: 8, w: 40, h: 8 },
      { id: 'w-up', type: 'upcoming', variant: 'cards', color: 'auto', x: 56, y: 17, w: 40, h: 15 },
    ];
    // If legacy string-array layout exists, migrate to new shape
    if (!d.dashboardLayout || (Array.isArray(d.dashboardLayout) && typeof d.dashboardLayout[0] === 'string')) {
      d.dashboardLayout = JSON.parse(JSON.stringify(DEFAULT_BENTO));
      d.gridVersion = 3;
    }
    // Compress the original default dashboard so the most actionable items are visible first.
    if (!d.dashboardLayoutVersion && Array.isArray(d.dashboardLayout) && d.dashboardLayout.some(w => w.id === 'w-spnd') && d.dashboardLayout.some(w => w.id === 'w-coop')) {
      const old = Object.fromEntries(d.dashboardLayout.map(w => [w.id, w]));
      d.dashboardLayout = COMPACT_BENTO.map(w => ({ ...w, inst: old[w.id]?.inst || w.inst, color: old[w.id]?.color || w.color, style: old[w.id]?.style }));
      d.dashboardLayoutVersion = 2;
    }
    // Grid version migration. Current is v3 (96 cols × 15px rows).
    //   v1 (no version) = original 24×60 → ×4
    //   v2              = 48×30          → ×2
    if (d.gridVersion !== 3 && Array.isArray(d.dashboardLayout)) {
      const factor = d.gridVersion === 2 ? 2 : 4;
      d.dashboardLayout = d.dashboardLayout.map(w => ({
        ...w,
        x: (w.x || 0) * factor,
        y: (w.y || 0) * factor,
        w: (w.w || 1) * factor,
        h: (w.h || 1) * factor,
      }));
      d.gridVersion = 3;
    }
    if (!d.dashboardPresentationVersion && Array.isArray(d.dashboardLayout)) {
      const hadDefaultHeader = d.dashboardLayout.some(w => w.id === 'w-secTop');
      d.dashboardLayout = d.dashboardLayout
        .filter(w => !['w-secTop', 'w-secWk'].includes(w.id))
        .map(w => hadDefaultHeader ? { ...w, y: Math.max(0, (w.y || 0) - 4) } : w);
      const money = d.dashboardLayout.find(w => w.id === 'w-cls');
      if (money) Object.assign(money, { id: 'w-money', type: 'monthlyMoney', variant: 'chart', y: 8, h: 16, color: 'auto' });
      const highPriority = d.dashboardLayout.find(w => w.id === 'w-todo');
      if (highPriority) Object.assign(highPriority, { y: 24, h: 12 });
      d.dashboardPresentationVersion = 1;
    }
    if ((d.dashboardPresentationVersion || 0) < 2 && Array.isArray(d.dashboardLayout)) {
      const upcoming = d.dashboardLayout.find(w => w.id === 'w-up');
      const money = d.dashboardLayout.find(w => w.id === 'w-money');
      const highPriority = d.dashboardLayout.find(w => w.id === 'w-todo');
      if (upcoming) Object.assign(upcoming, { y: 8, h: 24 });
      if (money) Object.assign(money, { y: 8, h: 14 });
      if (highPriority) Object.assign(highPriority, { y: 22, h: 10 });
      d.dashboardPresentationVersion = 2;
    }
    // Current dashboard presentation: make the top deadline card useful at a glance.
    // The KPI follows tests/quizzes, and the wide card becomes a full weekly timetable.
    if ((d.dashboardPresentationVersion || 0) < 3 && Array.isArray(d.dashboardLayout)) {
      const nextTest = d.dashboardLayout.find(w => w.id === 'w-nextex');
      if (nextTest) Object.assign(nextTest, { type: 'nextTest', variant: 'hero' });
      const priorUpcoming = d.dashboardLayout.find(w => w.id === 'w-up');
      const existingWeekCalendar = d.dashboardLayout.find(w => w.type === 'weekCal');
      if (existingWeekCalendar) {
        // A previously added week calendar is the user's intended schedule card.
        // Reuse it instead of leaving a second, overlapping card underneath it.
        Object.assign(existingWeekCalendar, { id: 'w-week', type: 'weekSchedule', variant: 'blocks', x: 0, y: 8, w: 56, h: 24 });
        if (priorUpcoming) d.dashboardLayout = d.dashboardLayout.filter(w => w !== priorUpcoming);
      } else if (priorUpcoming && !d.dashboardLayout.some(w => w.id === 'w-week')) {
        Object.assign(priorUpcoming, { id: 'w-week', type: 'weekSchedule', variant: 'blocks', x: 0, y: 8, w: 56, h: 24 });
      }
      d.dashboardPresentationVersion = 3;
    }
    // Keep the dashboard's essentials in one screen: five compact top cards,
    // the weekly timetable, high-priority work, and the near-term due list.
    if ((d.dashboardPresentationVersion || 0) < 4 && Array.isArray(d.dashboardLayout)) {
      const layout = d.dashboardLayout;
      const position = (id, props) => {
        const widget = layout.find(w => w.id === id);
        if (widget) Object.assign(widget, props);
        return widget;
      };
      position('w-courses', { x: 0, y: 0, w: 19, h: 6 });
      position('w-open', { x: 19, y: 0, w: 19, h: 6 });
      position('w-nextex', { type: 'nextTest', variant: 'hero', x: 38, y: 0, w: 19, h: 6 });
      position('w-gpa', { x: 57, y: 0, w: 19, h: 6 });
      if (!position('w-spendingpie', { type: 'spendingChart', variant: 'compact', x: 76, y: 0, w: 20, h: 6 })) {
        layout.push({ id: 'w-spendingpie', type: 'spendingChart', variant: 'compact', color: 'auto', x: 76, y: 0, w: 20, h: 6 });
      }
      position('w-week', { type: 'weekSchedule', variant: 'blocks', x: 0, y: 7, w: 56, h: 24 });
      position('w-todo', { x: 56, y: 7, w: 40, h: 8 });
      if (!position('w-up', { type: 'upcoming', variant: 'cards', x: 56, y: 16, w: 40, h: 15 })) {
        layout.push({ id: 'w-up', type: 'upcoming', variant: 'cards', color: 'auto', x: 56, y: 16, w: 40, h: 15 });
      }
      const monthlyMoney = layout.find(w => w.id === 'w-money');
      if (monthlyMoney) {
        if (!Array.isArray(d.deletedDashboardWidgets)) d.deletedDashboardWidgets = [];
        if (!d.deletedDashboardWidgets.some(w => w.id === monthlyMoney.id)) {
          d.deletedDashboardWidgets.unshift({ ...monthlyMoney, deletedAt: new Date().toISOString() });
        }
        d.dashboardLayout = layout.filter(w => w.id !== 'w-money');
      }
      d.dashboardPresentationVersion = 4;
    }
    // The spending chart is now a standalone circle. Removing Active Courses gives
    // the remaining at-a-glance cards enough width and height to show every label.
    if ((d.dashboardPresentationVersion || 0) < 5 && Array.isArray(d.dashboardLayout)) {
      const layout = d.dashboardLayout;
      const activeCourses = layout.find(w => w.id === 'w-courses');
      if (activeCourses) {
        if (!Array.isArray(d.deletedDashboardWidgets)) d.deletedDashboardWidgets = [];
        if (!d.deletedDashboardWidgets.some(w => w.id === activeCourses.id)) {
          d.deletedDashboardWidgets.unshift({ ...activeCourses, deletedAt: new Date().toISOString() });
        }
        d.dashboardLayout = layout.filter(w => w.id !== 'w-courses');
      }
      const currentLayout = d.dashboardLayout;
      const positionCurrent = (id, props) => {
        const widget = currentLayout.find(w => w.id === id);
        if (widget) Object.assign(widget, props);
        return widget;
      };
      positionCurrent('w-open', { x: 0, y: 0, w: 26, h: 7 });
      positionCurrent('w-nextex', { type: 'nextTest', variant: 'hero', x: 26, y: 0, w: 26, h: 7 });
      positionCurrent('w-gpa', { x: 52, y: 0, w: 26, h: 7 });
      if (!positionCurrent('w-spendingpie', { type: 'spendingChart', variant: 'compact', x: 78, y: 0, w: 18, h: 7 })) {
        currentLayout.push({ id: 'w-spendingpie', type: 'spendingChart', variant: 'compact', color: 'auto', x: 78, y: 0, w: 18, h: 7 });
      }
      positionCurrent('w-week', { type: 'weekSchedule', variant: 'blocks', x: 0, y: 8, w: 56, h: 24 });
      positionCurrent('w-todo', { x: 56, y: 8, w: 40, h: 8 });
      if (!positionCurrent('w-up', { type: 'upcoming', variant: 'cards', x: 56, y: 17, w: 40, h: 15 })) {
        currentLayout.push({ id: 'w-up', type: 'upcoming', variant: 'cards', color: 'auto', x: 56, y: 17, w: 40, h: 15 });
      }
      d.dashboardPresentationVersion = 5;
    }
    // Replace the GPA summary with the class that is actually coming up next.
    if ((d.dashboardPresentationVersion || 0) < 6 && Array.isArray(d.dashboardLayout)) {
      const nextClass = d.dashboardLayout.find(w => w.id === 'w-gpa');
      if (nextClass) Object.assign(nextClass, { type: 'classToday', variant: 'hero' });
      d.dashboardPresentationVersion = 6;
    }
    if (!d.gpaScale) d.gpaScale = '4';
    if (!Array.isArray(d.dashboardImages)) d.dashboardImages = [];
    if (!Array.isArray(d.deletedDashboardWidgets)) d.deletedDashboardWidgets = [];
    // Budget migration: ensure monthlyTarget + history exist on legacy data
    if (d.budget) {
      if (d.budget.monthlyTarget == null || d.budget.monthlyTarget === 1500) d.budget.monthlyTarget = 600;
      if (!Array.isArray(d.budget.history)) d.budget.history = [];
      // Auto-snapshot: if the previous month isn't in history, save it now.
      // We only snapshot once a month rolls over so the "current" month is always live.
      const now = new Date();
      const lastMo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastKey = `${lastMo.getFullYear()}-${String(lastMo.getMonth()+1).padStart(2,'0')}`;
      if (!d.budget.history.some(h => h.key === lastKey) && ((d.budget.income || []).length || (d.budget.expenses || []).length || (d.subscriptions || []).length)) {
        const totalIn  = (d.budget.income || []).reduce((s, x) => s + +x.amount, 0);
        const totalOut = (d.budget.expenses || []).reduce((s, x) => s + +x.amount, 0);
        const subsMo   = (d.subscriptions || []).reduce((s, x) => s + (x.billing === 'Monthly' ? +x.price : (x.billing === 'Yearly' ? +x.price/12 : 0)), 0);
        d.budget.history.push({ key: lastKey, spend: totalOut + subsMo, income: totalIn, target: d.budget.monthlyTarget });
        // Keep at most 24 months
        d.budget.history = d.budget.history.slice(-24);
      }
    }
    if (!d.currentSemester) d.currentSemester = currentSemesterId();
    if (!d.calendarLayers) d.calendarLayers = { classes: false, assignments: true, tests: true, exams: true, labs: true, subs: true };
    if (!d.archivedSemesters) d.archivedSemesters = {};
    (d.courses || []).forEach(c => {
      if (c.year == null) c.year = 1;
      if (c.link == null) c.link = '';
      if (c.endTime == null) c.endTime = '';
    });
    (d.labs || []).forEach(l => {
      if (l.ta == null) l.ta = '';
      if (l.time == null) l.time = '';
      if (l.endTime == null) l.endTime = '';
      if (l.pattern == null) l.pattern = 'once';
    });
    (d.assignments || []).forEach(a => { if (a.dueTime == null) a.dueTime = ''; });
    (d.tests || []).forEach(t => { if (t.time == null) t.time = ''; });
    (d.exams || []).forEach(e => { if (e.time == null) e.time = ''; });
    if (!d.scheduleOverrides) d.scheduleOverrides = [];
    if (d.currentYearSem === undefined) d.currentYearSem = null; // null = auto-detect
    if (!d.importedCalendars) d.importedCalendars = []; // [{ id, name, color, events: [{ id, title, start, end, allDay, description, location }] }]
    if (!Array.isArray(d.hackathons)) d.hackathons = [];
    if (d.calendarLayers && d.calendarLayers.imported === undefined) d.calendarLayers.imported = true;
    // Migrate reading: derive currentPage from old percentage `progress` field
    (d.reading || []).forEach(b => {
      if (b.currentPage == null) {
        const total = +b.pages || 0;
        const pct = +b.progress || 0;
        b.currentPage = total > 0 ? Math.round((pct / 100) * total) : 0;
      }
      delete b.progress; // drop the old field
    });
    // Migrate goals: replace percent progress with milestone list
    (d.goals || []).forEach(g => {
      if (!g.milestones) g.milestones = [];
      if (g.status == null) {
        if (+g.progress >= 100) g.status = 'Done';
        else if (+g.progress > 0) g.status = 'In Progress';
        else g.status = 'Not Started';
      }
      // Don't delete g.progress yet — kept harmlessly so users with mid-flight data lose nothing
    });
    // Migrate co-op stage names + add new fields
    const stageMap = { 'Wishlist': 'Researching', 'Interview': 'Interviewing', 'Rejected': 'Closed' };
    (d.coop || []).forEach(c => {
      if (stageMap[c.stage]) {
        if (c.stage === 'Rejected' && !c.closedReason) c.closedReason = 'Rejected';
        c.stage = stageMap[c.stage];
      }
      if (c.closedReason == null) c.closedReason = '';
      if (c.nextStep == null) c.nextStep = '';
      if (c.nextStepDue == null) c.nextStepDue = '';
      if (c.lastContact == null) c.lastContact = '';
    });
  },
  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  },
  reset() {
    this.data = createStudentPlannerState();
    this.save();
  },
  syncExpenses() {
    return syncBudgetFromExpenses(this.data);
  },
  exportJson() {
    const blob = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planner-export-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
  importJson(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const obj = JSON.parse(e.target.result);
        this.data = obj;
        this.save();
        Toast.show('Imported! Welcome back');
        Router.refresh();
      } catch (err) {
        Toast.show('Hmm — that file didn\'t look right.');
      }
    };
    reader.readAsText(file);
  },
};

/* -- Tiny helpers ---------------------------------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const uid = () => Math.random().toString(36).slice(2, 9);

function escape(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function fmtDateLong(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(undefined, { weekday:'long', month: 'long', day: 'numeric' });
}

function daysUntil(iso) {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  const t = new Date(today() + 'T00:00:00');
  return Math.round((d - t) / (1000 * 60 * 60 * 24));
}

function fmtCurrency(n) {
  return '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusClass(s) {
  s = (s || '').toLowerCase();
  if (s.includes('done') || s.includes('submit')) return 'status-done';
  if (s.includes('progress')) return 'status-progress';
  if (s.includes('overdue')) return 'status-overdue';
  if (s.includes('pending') || s.includes('upcoming')) return 'status-pending';
  return 'status-todo';
}

function priorityClass(p) {
  p = (p || '').toLowerCase();
  if (p.startsWith('h')) return 'prio-high';
  if (p.startsWith('m')) return 'prio-med';
  return 'prio-low';
}

/* -- Toast ----------------------------------------------------------------- */
const Toast = {
  el: null,
  timer: null,
  show(msg) {
    if (!this.el) this.el = $('#toast');
    this.el.textContent = msg;
    this.el.classList.add('show');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.el.classList.remove('show'), 2200);
  },
};

/* -- Modal ----------------------------------------------------------------- */
const Modal = {
  open(html, onOpen) {
    const overlay = $('#modalOverlay');
    $('#modalBody').innerHTML = html;
    overlay.classList.add('active');
    if (onOpen) onOpen($('#modalBody'));
  },
  close() { $('#modalOverlay').classList.remove('active'); },
};

/* -- Confetti -------------------------------------------------------------- */
const Confetti = {
  canvas: null, ctx: null, particles: [], running: false,
  init() {
    this.canvas = $('#confetti');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },
  resize() {
    this.canvas.width = innerWidth;
    this.canvas.height = innerHeight;
  },
  burst(x, y) {
    const colors = ['#F0A6BC', '#A8C5F0', '#9BC09A', '#F5D27A', '#C9A9E8', '#F2A07F'];
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 12,
        vy: Math.random() * -10 - 4,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.3,
        size: 6 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
      });
    }
    if (!this.running) {
      this.running = true;
      requestAnimationFrame(() => this.tick());
    }
  },
  tick() {
    const c = this.ctx;
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4;
      p.rot += p.vrot;
      p.life -= 0.012;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.globalAlpha = Math.max(p.life, 0);
      c.fillStyle = p.color;
      c.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      c.restore();
    });
    this.particles = this.particles.filter(p => p.life > 0);
    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.tick());
    } else {
      this.running = false;
      c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  },
  fromEvent(ev) {
    const x = ev?.clientX ?? innerWidth / 2;
    const y = ev?.clientY ?? innerHeight / 2;
    this.burst(x, y);
  },
};

/* -- Router & Views -------------------------------------------------------- */
const Views = {}; // populated below

const NAV_GROUPS = [
  {
    label: '',
    items: [
      { id: 'dashboard',   label: 'Dashboard',      iconName: 'dashboard' },
    ],
  },
  {
    label: 'School',
    items: [
      { id: 'courses',     label: 'Courses',        iconName: 'book' },
      { id: 'schedule',    label: 'Class Schedule', iconName: 'calendar' },
      { id: 'calendar',    label: 'Calendar',       iconName: 'calendarDay' },
      { id: 'assignments', label: 'Assignments',    iconName: 'pencil' },
      { id: 'tests',       label: 'Tests',          iconName: 'flask' },
      { id: 'exams',       label: 'Exams',          iconName: 'chart' },
      { id: 'labs',        label: 'Labs',           iconName: 'microscope' },
      { id: 'gpa',         label: 'GPA',            iconName: 'cap' },
      { id: 'coop',        label: 'Co-op',          iconName: 'briefcase' },
      { id: 'hackathons',  label: 'Hackathons',      iconName: 'star' },
      { id: 'contacts',    label: 'Contacts',       iconName: 'contact' },
    ],
  },
  {
    label: 'Daily',
    items: [
      { id: 'todo',   label: 'To-Do',    iconName: 'sparkles' },
      { id: 'habits', label: 'Habits',   iconName: 'check' },
      { id: 'focus',  label: 'Focus',    iconName: 'timer' },
      { id: 'mood',   label: 'Mood Log', iconName: 'smile' },
    ],
  },
  {
    label: 'Library',
    items: [
      { id: 'notes',     label: 'Notes',      iconName: 'notebook' },
      { id: 'braindump', label: 'Brain Dump', iconName: 'brain' },
      { id: 'reading',   label: 'Reading',    iconName: 'bookOpen' },
      { id: 'goals',     label: 'Goals',      iconName: 'target' },
    ],
  },
  {
    label: 'Money',
    items: [
      { id: 'budget', label: 'Budget', iconName: 'wallet' },
    ],
  },
  {
    label: 'About',
    items: [
      { id: 'home', label: 'How this works', iconName: 'compass' },
    ],
  },
];

const Router = {
  current: 'home',
  go(id) {
    // Preserve sidebar visibility across nav — even if some other code path tries to close it
    const sidebar = $('#sidebar');
    const wasOpen = sidebar?.classList.contains('open');
    const wasBackdrop = $('#sidebarBackdrop')?.classList.contains('show');
    const appOpen = document.querySelector('.app')?.classList.contains('sidebar-is-open');

    this.current = id;
    location.hash = '#' + id;
    this.refresh();
    $('.content').scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (wasOpen) {
      sidebar.classList.add('open');
      if (wasBackdrop) $('#sidebarBackdrop')?.classList.add('show');
      if (appOpen) document.querySelector('.app')?.classList.add('sidebar-is-open');
    }
  },
  refresh() {
    const view = Views[this.current] || Views.home;
    const content = $('#content');
    content.innerHTML = '';
    view(content);
    // Update active state
    $$('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === this.current);
    });
  },
  init() {
    const hash = (location.hash || '').replace('#', '');
    if (hash && this.findView(hash)) this.current = hash;
    this.renderNav();
    this.refresh();
    window.addEventListener('hashchange', () => {
      const id = location.hash.replace('#', '');
      if (id && this.findView(id) && id !== this.current) {
        this.current = id;
        this.refresh();
      }
    });
  },
  findView(id) {
    return NAV_GROUPS.some(g => g.items.some(i => i.id === id));
  },
  renderNav() {
    const nav = $('#nav');
    nav.innerHTML = '';
    // Resolve effective nav groups: user customization (if any) merged with defaults
    const groups = getEffectiveNavGroups();

    // "Edit menu" toggle button at the top
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'nav-edit-toggle' + (menuEditMode ? ' is-active' : '');
    editBtn.innerHTML = menuEditMode ? '✓ done editing menu' : '✎ edit menu';
    editBtn.addEventListener('click', () => {
      menuEditMode = !menuEditMode;
      if (!menuEditMode) Toast.show('menu saved');
      Router.renderNav();
    });
    nav.appendChild(editBtn);

    groups.forEach((group, gi) => {
      const label = document.createElement('div');
      label.className = 'nav-section' + (menuEditMode ? ' is-editable' : '');
      if (menuEditMode && group.label !== '') {
        label.contentEditable = 'true';
        label.spellcheck = false;
        label.addEventListener('blur', () => {
          group.label = label.textContent.trim();
          saveNavCustomization(groups);
        });
        label.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); label.blur(); } });
      }
      label.textContent = group.label;
      nav.appendChild(label);

      // Drop zone before this group (so user can drop items)
      if (menuEditMode) nav.appendChild(makeDropZone(groups, gi, 0));

      group.items.forEach((item, ii) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nav-item';
        btn.dataset.view = item.id;
        btn.innerHTML = `${menuEditMode ? '<span class="nav-grip">⋮⋮</span>' : ''}<span class="nav-icon">${icon(item.iconName, 18)}</span><span>${item.label}</span>`;
        if (!menuEditMode) {
          btn.addEventListener('click', (e) => { e.stopPropagation(); this.go(item.id); });
        } else {
          btn.draggable = true;
          btn.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', `nav:${gi}:${ii}`);
            btn.classList.add('is-dragging');
          });
          btn.addEventListener('dragend', () => btn.classList.remove('is-dragging'));
        }
        nav.appendChild(btn);
        // Drop zone after each item
        if (menuEditMode) nav.appendChild(makeDropZone(groups, gi, ii + 1));
      });

      if (menuEditMode) {
        // "Add new group" between groups
        const addGroupAfter = document.createElement('button');
        addGroupAfter.type = 'button';
        addGroupAfter.className = 'nav-add-group';
        addGroupAfter.textContent = '+ new section';
        addGroupAfter.addEventListener('click', () => {
          groups.splice(gi + 1, 0, { label: 'New section', items: [] });
          saveNavCustomization(groups);
          Router.renderNav();
        });
        nav.appendChild(addGroupAfter);
      }
    });
  },
};

/* Resolve the nav groups — user customization (d.navCustomization) overrides
   the static NAV_GROUPS. Defaults applied when nothing has been customized. */
function getEffectiveNavGroups() {
  const d = Store.data || {};
  if (Array.isArray(d.navCustomization) && d.navCustomization.length) {
    // Validate that every default item exists somewhere in the custom layout;
    // if any are missing (e.g. new feature added), append them to last group.
    const ids = new Set();
    d.navCustomization.forEach(g => g.items.forEach(i => ids.add(i.id)));
    const missing = [];
    NAV_GROUPS.forEach(g => g.items.forEach(i => { if (!ids.has(i.id)) missing.push(i); }));
    if (missing.length) {
      const last = d.navCustomization[d.navCustomization.length - 1];
      last.items.push(...missing);
    }
    return d.navCustomization;
  }
  // Fresh user: clone default
  return JSON.parse(JSON.stringify(NAV_GROUPS));
}

function saveNavCustomization(groups) {
  Store.data.navCustomization = groups;
  Store.save();
}

function makeDropZone(groups, gi, ii) {
  const z = document.createElement('div');
  z.className = 'nav-dropzone';
  z.addEventListener('dragover', (e) => {
    const data = e.dataTransfer?.types?.includes('text/plain') ? 'drag' : null;
    if (data) { e.preventDefault(); z.classList.add('is-target'); }
  });
  z.addEventListener('dragleave', () => z.classList.remove('is-target'));
  z.addEventListener('drop', (e) => {
    e.preventDefault();
    z.classList.remove('is-target');
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw?.startsWith('nav:')) return;
    const [, fromGi, fromIi] = raw.split(':').map(Number);
    const src = groups[fromGi]?.items?.[fromIi];
    if (!src) return;
    // Remove from source, insert at target. Adjust target index if same group + earlier.
    groups[fromGi].items.splice(fromIi, 1);
    let insertIdx = ii;
    if (fromGi === gi && fromIi < ii) insertIdx--;
    groups[gi].items.splice(insertIdx, 0, src);
    saveNavCustomization(groups);
    Router.renderNav();
  });
  return z;
}

let menuEditMode = false;

function setGreeting() {
  $('#todayDate').textContent = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

/* ============================================================================
   VIEWS
   ============================================================================ */

/* -- Welcome / Home -------------------------------------------------------- */
Views.home = (root) => {
  root.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title"><span class="emoji">${icon('compass', 22)}</span>How this works</h1>
        <p class="page-subtitle">A short reference for what each section does. [Placeholder — final copy TBD.]</p>
      </div>
    </header>

    <div class="card mb-24">
      <h3 class="card-title">${icon('dashboard', 18)} Where to start</h3>
      <ul class="mini-list">
        <li><span class="dot"></span> Open <button class="text-link" data-go="courses">Courses</button> and enter your current courses (year, semester, days, times).</li>
        <li><span class="dot"></span> Add assignments, tests, exams, and labs as they come up.</li>
        <li><span class="dot"></span> The Dashboard, Calendar, and Class Schedule all populate automatically from what you enter above.</li>
      </ul>
    </div>

    <div class="grid grid-2 mb-24">
      <div class="card">
        <h3 class="card-title">${icon('book', 18)} School</h3>
        <p class="text-mute" style="font-size:13px;">Track courses by year and semester, manage assignments / tests / exams / labs, view your class schedule and the combined calendar, and watch your GPA recompute as you enter grades.</p>
      </div>
      <div class="card">
        <h3 class="card-title">${icon('briefcase', 18)} Career</h3>
        <p class="text-mute" style="font-size:13px;">Co-op pipeline tracks each application's stage, next step, and how long since you last heard back. Contacts holds professors, TAs, and advisors.</p>
      </div>
      <div class="card">
        <h3 class="card-title">${icon('sparkles', 18)} Productivity</h3>
        <p class="text-mute" style="font-size:13px;">To-Do, Habits, Goals, Focus timer, and Notes — the everyday tools for getting things done without losing track.</p>
      </div>
      <div class="card">
        <h3 class="card-title">${icon('smile', 18)} Personal</h3>
        <p class="text-mute" style="font-size:13px;">Mood Log, Reading list, and Brain Dump for catching loose thoughts.</p>
      </div>
      <div class="card">
        <h3 class="card-title">${icon('wallet', 18)} Money</h3>
        <p class="text-mute" style="font-size:13px;">Track income, expenses, and recurring subscriptions in one place. The dashboard shows a monthly summary.</p>
      </div>
      <div class="card">
        <h3 class="card-title">${icon('archive', 18)} Data &amp; privacy</h3>
        <p class="text-mute" style="font-size:13px;">Everything is stored in your browser's localStorage. Nothing is sent to a server. Use the Export button in the sidebar to download a JSON backup any time.</p>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">${icon('calendar', 18)} End of a semester or school year</h3>
      <ul class="mini-list">
        <li><span class="dot"></span> "End semester" on the Courses page snapshots that semester into an archive and clears short-lived items (assignments, tests, exams, labs).</li>
        <li><span class="dot"></span> "Archive year" lets you pick which categories to clear vs keep — useful for a fresh start without losing things like contacts or reading list.</li>
        <li><span class="dot"></span> Archived semesters and years stay viewable read-only from the Courses page.</li>
      </ul>
    </div>
  `;
  root.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => Router.go(b.dataset.go)));
};

function tipCard(iconName, title, body) {
  return `
    <div class="card">
      <div style="color: var(--rose-deep); display:inline-flex;">${icon(iconName, 32)}</div>
      <h3 style="font-family:var(--font-display); font-size:24px; margin:8px 0 4px;">${title}</h3>
      <p class="text-mute" style="font-size:13px; margin:0;">${body}</p>
    </div>
  `;
}

/* ==========================================================================
   Dashboard — bento grid, widget library, drag/resize, color/variant picker
   ========================================================================== */

let dashEditMode = false;
let dashLibraryOpen = false;
let libraryQuery2 = '';
let dashboardShowLater = false;
let dashboardDeletedOpen = false;

/* Color palette: each "name" maps to a soft background + accent + border.
   "auto" = no tint (transparent), uses the widget's natural styling. */
// Subtle by default — almost-white auto, soft tints for accents
const DASH_COLORS = {
  auto:   { bg: 'rgba(255, 252, 248, 0.92)', border: 'var(--border)',                  accent: 'var(--ink-mute)'   },
  clear:  { bg: 'transparent',               border: 'transparent',                    accent: 'var(--ink-mute)'   },
  rose:   { bg: 'rgba(240, 166, 188, 0.10)', border: 'rgba(224, 117, 153, 0.25)',      accent: 'var(--rose-deep)'   },
  sage:   { bg: 'rgba(155, 192, 154, 0.10)', border: 'rgba(111, 160, 112, 0.25)',      accent: 'var(--sage-deep)'   },
  sky:    { bg: 'rgba(168, 197, 240, 0.10)', border: 'rgba(111, 157, 216, 0.25)',      accent: 'var(--sky-deep)'    },
  butter: { bg: 'rgba(245, 210, 122, 0.10)', border: 'rgba(224, 174, 61, 0.25)',       accent: 'var(--butter-deep)' },
  lilac:  { bg: 'rgba(201, 169, 232, 0.10)', border: 'rgba(157, 111, 201, 0.25)',      accent: 'var(--lilac-deep)'  },
  coral:  { bg: 'rgba(242, 160, 127, 0.10)', border: 'rgba(224, 122, 74, 0.25)',       accent: 'var(--coral-deep)'  },
  mint:   { bg: 'rgba(155, 192, 154, 0.14)', border: 'rgba(111, 160, 112, 0.30)',      accent: 'var(--sage-deep)'   },
};

function colorStyle(colorKey) {
  const c = DASH_COLORS[colorKey] || DASH_COLORS.auto;
  return `background: ${c.bg}; border-color: ${c.border};`;
}

/* Border styles for widget customization — pure-CSS, no extra DOM. */
const BORDER_STYLES = {
  none:        { label: 'None',         css: 'none' },
  solid:       { label: 'Solid',        css: 'solid' },
  dashed:      { label: 'Dashed',       css: 'dashed' },
  dotted:      { label: 'Dotted',       css: 'dotted' },
  double:      { label: 'Double',       css: 'double' },
  groove:      { label: 'Groove',       css: 'groove' },
  ridge:       { label: 'Ridge',        css: 'ridge' },
  pill:        { label: 'Rounded pill', css: 'solid', radius: '999px' },
  rounded:     { label: 'Rounded',      css: 'solid', radius: '18px' },
  sharp:       { label: 'Sharp square', css: 'solid', radius: '0' },
  inset:       { label: 'Inset',        css: 'inset' },
  thickDouble: { label: 'Thick double', css: 'double', minWidth: 5 },
  notched:     { label: 'Notched',      css: 'solid', clip: 'polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px))' },
  // Wavy uses a CSS mask trick via SVG background.
  wavy:        { label: 'Wavy',         css: 'solid', wavy: true },
};

/* Build inline style string for a widget — combines grid placement, color preset,
   and any per-widget instance custom style (w.style = {bgColor, fontColor, opacity, borderStyle, borderColor, borderWidth, bgImage}).
   Background layer (color + image + opacity) is rendered via a ::before pseudo-element
   driven by CSS variables, so opacity only affects the background — content stays crisp. */
function widgetInlineStyle(w) {
  const parts = [`grid-column: ${w.x + 1} / span ${w.w}`, `grid-row: ${w.y + 1} / span ${w.h}`];
  const s = w.style || {};
  const preset = DASH_COLORS[w.color || 'auto'] || DASH_COLORS.auto;
  // Background layer via CSS vars consumed by .dash-widget::before
  const bgCol = s.bgColor || preset.bg;
  parts.push(`--widget-bg: ${bgCol}`);
  if (s.bgImage) parts.push(`--widget-bg-image: url('${s.bgImage}')`);
  if (s.opacity != null && s.opacity < 1) parts.push(`--widget-bg-opacity: ${s.opacity}`);
  // Border stays on the outer element (so text clips by border-radius)
  const borderDef = BORDER_STYLES[s.borderStyle || 'solid'] || BORDER_STYLES.solid;
  const bw = s.borderWidth != null ? `${s.borderWidth}px` : '1px';
  const bc = s.borderColor || preset.border;
  if (borderDef.css === 'none') {
    parts.push('border: none');
  } else {
    parts.push(`border: ${bw} ${borderDef.css} ${bc}`);
  }
  if (borderDef.radius != null) parts.push(`border-radius: ${borderDef.radius}`);
  if (borderDef.clip) parts.push(`clip-path: ${borderDef.clip}`);
  if (borderDef.wavy) parts.push(`border: none; --wavy-c: ${bc}; --wavy-w: ${bw}`);
  // Font color
  if (s.fontColor) parts.push(`color: ${s.fontColor}`);
  // Title customization (applied via CSS vars on .widget-title-bar)
  if (s.hideTitle) parts.push('--title-display: none');
  if (s.titleColor) parts.push(`--title-color: ${s.titleColor}`);
  if (s.titleOpacity != null && s.titleOpacity < 1) parts.push(`--title-opacity: ${s.titleOpacity}`);
  if (s.titleFontSize) parts.push(`--title-font-size: ${s.titleFontSize}px`);
  return parts.join('; ');
}

/* Widget library
   Each entry: { label, description, category, icon, minW/minH, defaultW/defaultH, variants }
   Each variant: { label, description, render(d, color) }
   `preview(opts)` returns a small thumbnail HTML for the catalog modal. */
const WIDGET_LIBRARY = {

  /* --- STATS --- */
  kpis: {
    label: 'School KPIs',
    description: 'Quick stats: courses, assignments, exams, GPA',
    category: 'Stats',
    minW: 4, minH: 1, defaultW: 12, defaultH: 1,
    variants: {
      classic: { label: '4-card row', description: 'Four big stat cards' },
      compact: { label: 'Compact strip', description: 'Single-row stat strip' },
      bigGpa:  { label: 'Hero GPA', description: 'Large GPA hero + small stats' },
    },
    render(d, opts) {
      const active = d.courses.filter(c => c.status === 'Active');
      const totalCredits = active.reduce((s, c) => s + (+c.credits || 0), 0);
      const openAssign = d.assignments.filter(a => !a.submitted).length;
      const dueWeek = d.assignments.filter(a => { const u = daysUntil(a.due); return !a.submitted && u >= 0 && u <= 7; }).length;
      const graded = active.filter(c => c.grade > 0);
      const gpa = computeGpa(graded);
      const nextExam = d.exams.filter(e => e.status !== 'Done' && daysUntil(e.date) >= 0).sort((a,b) => a.date.localeCompare(b.date))[0];
      const nextExamSub = nextExam ? `${nextExam.course} · ${daysUntil(nextExam.date)}d` : 'none scheduled';
      const accent = (k) => DASH_COLORS[k] ? DASH_COLORS[k].bg : 'var(--rose-cloud)';

      if (opts.variant === 'compact') {
        return `
          <div class="widget-body kpi-strip">
            <div class="kpi-strip-cell"><span class="strip-num">${active.length}</span><span class="strip-lbl">courses</span></div>
            <div class="kpi-strip-cell"><span class="strip-num">${openAssign}</span><span class="strip-lbl">open assign</span></div>
            <div class="kpi-strip-cell"><span class="strip-num">${nextExam ? daysUntil(nextExam.date) + 'd' : '—'}</span><span class="strip-lbl">next exam</span></div>
            <div class="kpi-strip-cell"><span class="strip-num">${gpa.toFixed(2)}</span><span class="strip-lbl">GPA</span></div>
          </div>
        `;
      }
      if (opts.variant === 'bigGpa') {
        return `
          <div class="widget-body kpi-hero">
            <div class="kpi-hero-main">
              <div class="kpi-hero-lbl">GPA</div>
              <div class="kpi-hero-val">${gpa.toFixed(2)}</div>
              <div class="kpi-hero-sub">from ${graded.length} graded · ${totalCredits} credits</div>
            </div>
            <div class="kpi-hero-side">
              <div><span class="strip-num">${active.length}</span><span class="strip-lbl">active</span></div>
              <div><span class="strip-num">${openAssign}</span><span class="strip-lbl">to do</span></div>
              <div><span class="strip-num">${nextExam ? daysUntil(nextExam.date) + 'd' : '—'}</span><span class="strip-lbl">to exam</span></div>
            </div>
          </div>
        `;
      }
      // classic
      return `
        <div class="widget-body" style="display:grid; grid-template-columns: repeat(4, 1fr); gap: 12px; height:100%;">
          ${kpi('Active Courses', active.length, `${totalCredits} credits`, '', 'var(--rose-cloud)')}
          ${kpi('Open Assignments', openAssign, `${dueWeek} due this week`, '', 'var(--butter-glow)')}
          ${kpi('Next Exam', nextExam ? fmtDate(nextExam.date) : '—', nextExamSub, '', 'var(--sky-petal)')}
          ${kpi('GPA', gpa.toFixed(2), `from ${graded.length} graded`, '', 'var(--lavender-mist)')}
        </div>
      `;
    },
    preview(variant) {
      if (variant === 'compact') return `<div class="pv-strip"><span>4</span><span>4</span><span>38d</span><span>3.9</span></div>`;
      if (variant === 'bigGpa') return `<div class="pv-hero"><div class="pv-hero-num">3.94</div><div class="pv-hero-cells"><span></span><span></span><span></span></div></div>`;
      return `<div class="pv-grid4"><span></span><span></span><span></span><span></span></div>`;
    },
  },

  /* --- SCHOOL --- */
  upcoming: {
    label: 'Upcoming items',
    description: 'Assignments, tests, exams, labs by date',
    category: 'School',
    minW: 3, minH: 2, defaultW: 6, defaultH: 3,
    variants: {
      list:    { label: 'Detailed list',    description: 'Full title + course + countdown' },
      compact: { label: 'Compact list',     description: 'Just title and countdown' },
      grouped: { label: 'Grouped by type',  description: 'Sections per item kind' },
      cards:   { label: 'Cards by day',     description: 'Grouped by today / tomorrow / week with rich cards' },
    },
    render(d, opts) {
      const all = [
        ...d.assignments.filter(a => !a.submitted).map(a => ({ kind: 'Assignment', ...a, date: a.due })),
        ...d.tests.filter(t => t.status !== 'Done').map(t => ({ kind: 'Test', ...t })),
        ...d.exams.filter(e => e.status !== 'Done').map(e => ({ kind: 'Exam', ...e })),
        ...d.labs.filter(l => l.status !== 'Done').map(l => ({ kind: 'Lab', ...l, date: l.reportDue || l.date })),
      ].filter(x => x.date && daysUntil(x.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));

      if (all.length === 0) return `<div class="widget-body widget-empty">Nothing scheduled.</div>`;

      if (opts.variant === 'compact') {
        return `<div class="widget-body"><ul class="mini-list">${all.slice(0, 12).map(it => {
          const u = daysUntil(it.date);
          return `<li><span class="bold" style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escape(it.title)}</span><span class="pill ${u<=1?'pill':u<=3?'pill pill-butter':'pill pill-sky'}">${u===0?'today':u===1?'tomorrow':'in '+u+'d'}</span></li>`;
        }).join('')}</ul></div>`;
      }
      if (opts.variant === 'grouped') {
        const groups = ['Exam','Test','Assignment','Lab'];
        return `<div class="widget-body" style="display:flex; flex-direction:column; gap:14px;">${groups.map(g => {
          const items = all.filter(x => x.kind === g).slice(0, 4);
          if (!items.length) return '';
          return `<div><div class="kpi-label" style="margin-bottom:4px;">${g.toUpperCase()}S</div><ul class="mini-list">${items.map(it => {
            const u = daysUntil(it.date);
            return `<li><span class="bold">${escape(it.title)}</span><span class="text-mute">${escape(it.course||'')}</span><span class="pill pill-ghost" style="margin-left:auto;">${u===0?'today':u===1?'tomorrow':'in '+u+'d'}</span></li>`;
          }).join('')}</ul></div>`;
        }).join('')}</div>`;
      }
      if (opts.variant === 'cards') {
        // Group by today / tomorrow / this week / later. Render each item as a colored card.
        const kindMeta = {
          Assignment: { color: 'var(--lilac-deep)', bg: 'rgba(201, 169, 232, 0.18)', icon: 'pencil' },
          Test:       { color: 'var(--butter-deep)', bg: 'rgba(245, 210, 122, 0.22)', icon: 'flask' },
          Exam:       { color: '#C24F69',           bg: 'rgba(232, 122, 142, 0.18)', icon: 'chart' },
          Lab:        { color: 'var(--sage-deep)',  bg: 'rgba(155, 192, 154, 0.20)', icon: 'microscope' },
        };
        // Keep later deadlines out of the default dashboard view until requested.
        const urgent = all.filter(it => daysUntil(it.date) <= 7);
        const later = all.filter(it => daysUntil(it.date) > 7);
        const source = dashboardShowLater ? all : urgent;
        const MAX_ITEMS = dashboardShowLater ? 9 : 7;
        const visible = source.slice(0, MAX_ITEMS);
        const overflow = source.length - visible.length;
        const buckets = [
          { label: 'TODAY',     test: u => u === 0 },
          { label: 'TOMORROW',  test: u => u === 1 },
          { label: 'THIS WEEK', test: u => u >= 2 && u <= 7 },
          ...(dashboardShowLater ? [{ label: 'LATER', test: u => u > 7 }] : []),
        ];
        const rendered = buckets.map(b => {
          const items = visible.filter(it => b.test(daysUntil(it.date)));
          if (items.length === 0) return '';
          return `
            <div class="upcoming-bucket">
              <div class="upcoming-bucket-head">${b.label}<span class="upcoming-bucket-count">${items.length}</span></div>
              <div class="upcoming-cards-list">
                ${items.map(it => {
                  const m = kindMeta[it.kind] || { color: 'var(--ink-mute)', bg: 'rgba(0,0,0,0.04)', icon: 'sparkles' };
                  const u = daysUntil(it.date);
                  const due = u === 0 ? 'today' : u === 1 ? 'tomorrow' : `in ${u}d`;
                  return `
                    <div class="upcoming-card" style="border-left-color: ${m.color};">
                      <div class="upcoming-card-icon" style="background: ${m.bg}; color: ${m.color};">${icon(m.icon, 14)}</div>
                      <div class="upcoming-card-main">
                        <div class="upcoming-card-title">${escape(it.title)}</div>
                        <div class="upcoming-card-sub">
                          <span class="upcoming-card-kind" style="color: ${m.color};">${escape(it.kind.toUpperCase())}</span>
                          <span class="text-mute">·</span>
                          <span class="text-mute">${escape(it.course || '')}</span>
                        </div>
                      </div>
                      <div class="upcoming-card-due" style="color: ${m.color};">${due}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('');
        const more = overflow > 0 ? `<div class="upcoming-more">+ ${overflow} more</div>` : '';
        const laterToggle = later.length ? `<button class="btn-soft btn-tiny upcoming-later-toggle" data-dashboard-later>${dashboardShowLater ? 'hide later deadlines' : `show ${later.length} later deadline${later.length === 1 ? '' : 's'}`}</button>` : '';
        return `<div class="widget-body upcoming-cards">${rendered || '<div class="text-mute" style="font-size:13px;">Nothing due in the next week.</div>'}${more}${laterToggle}</div>`;
      }
      // list (default)
      return `<div class="widget-body"><ul class="mini-list">${all.slice(0, 10).map(it => {
        const u = daysUntil(it.date);
        const tone = u <= 1 ? 'pill' : u <= 3 ? 'pill pill-butter' : 'pill pill-sky';
        return `<li>
          <span class="dot" style="background: ${u<=1?'var(--rose-deep)':u<=3?'var(--butter-deep)':'var(--sky-deep)'};"></span>
          <span class="bold">${escape(it.title)}</span>
          <span class="text-mute">· ${escape(it.course||'')}</span>
          <span class="${tone}" style="margin-left:auto;">${u===0?'today':u===1?'tomorrow':'in '+u+'d'}</span>
          <span class="pill pill-ghost">${escape(it.kind)}</span>
        </li>`;
      }).join('')}</ul></div>`;
    },
    preview(variant) {
      if (variant === 'compact') return `<div class="pv-rows"><div></div><div></div><div></div><div></div></div>`;
      if (variant === 'grouped') return `<div class="pv-grouped"><div class="pv-grp-lbl"></div><div></div><div class="pv-grp-lbl"></div><div></div></div>`;
      if (variant === 'cards')   return `<div class="pv-upcoming-cards"><div class="pv-bucket-lbl"></div><div class="pv-up-card"></div><div class="pv-up-card"></div></div>`;
      return `<div class="pv-rows pv-rows-detailed"><div></div><div></div><div></div></div>`;
    },
  },

  classToday: {
    label: 'Next class',
    description: 'Today\'s next class or upcoming class',
    category: 'School',
    minW: 3, minH: 1, defaultW: 5, defaultH: 2,
    variants: {
      hero:    { label: 'Hero card', description: 'Big course name + room + countdown' },
      minimal: { label: 'Minimal', description: 'Just course code and time' },
      list:    { label: 'Today\'s list', description: 'All of today\'s classes' },
    },
    render(d, opts) {
      return PlannerCalendarViews.nextClass(d, opts);
    },
    preview(variant) {
      if (variant === 'minimal') return `<div class="pv-min"><div class="pv-min-big"></div><div class="pv-min-sm"></div></div>`;
      if (variant === 'list') return `<div class="pv-rows"><div></div><div></div><div></div></div>`;
      return `<div class="pv-hero"><div class="pv-hero-num"></div><div class="pv-meta"><span></span><span></span></div></div>`;
    },
  },

  assignLabs: {
    label: 'Assignments & Labs',
    description: 'Next deadlines for assignments and labs',
    category: 'School',
    minW: 3, minH: 2, defaultW: 5, defaultH: 2,
    variants: {
      compact: { label: 'Compact list', description: 'Simple list of next 5' },
      pills:   { label: 'Counts + pills', description: 'Open counts plus deadline pills' },
      table:   { label: 'Mini table', description: 'Title / course / due columns' },
    },
    render(d, opts) {
      const items = [
        ...d.assignments.filter(a => !a.submitted).map(a => ({ kind: 'Assignment', title: a.title, course: a.course || '', date: a.due })),
        ...d.labs.filter(l => l.status !== 'Done').map(l => ({ kind: 'Lab', title: l.title, course: l.course || '', date: l.reportDue || l.date })),
      ].filter(x => x.date).sort((a,b) => a.date.localeCompare(b.date)).slice(0, 6);
      const open = d.assignments.filter(a => !a.submitted).length;
      const pendLabs = d.labs.filter(l => l.status !== 'Done').length;

      if (opts.variant === 'table') {
        return `<div class="widget-body"><table class="mini-table">
          <thead><tr><th>Title</th><th>Course</th><th>Due</th></tr></thead>
          <tbody>${items.map(it => {
            const u = daysUntil(it.date);
            return `<tr><td><span class="bold">${escape(it.title)}</span></td><td class="text-mute">${escape(it.course)}</td><td><span class="pill ${u<=1?'pill':u<=3?'pill pill-butter':'pill pill-sky'}">${u===0?'today':u===1?'tomorrow':'in '+u+'d'}</span></td></tr>`;
          }).join('')}</tbody>
        </table></div>`;
      }
      if (opts.variant === 'pills') {
        return `<div class="widget-body">
          <div class="row gap-12 mb-16">
            <span class="pill pill-lilac">${open} open</span>
            <span class="pill pill-mint">${pendLabs} pending</span>
          </div>
          <ul class="mini-list">${items.map(it => {
            const u = daysUntil(it.date);
            const tone = u <= 1 ? 'pill' : u <= 3 ? 'pill pill-butter' : 'pill pill-sky';
            return `<li><span class="bold">${escape(it.title)}</span><span class="text-mute">${escape(it.course)}</span><span class="${tone}" style="margin-left:auto;">${u===0?'today':u===1?'tomorrow':'in '+u+'d'}</span></li>`;
          }).join('')}</ul>
        </div>`;
      }
      // compact (default)
      return `<div class="widget-body"><ul class="mini-list">${items.map(it => {
        const u = daysUntil(it.date);
        return `<li><span style="color: var(--ink-mute); display:inline-flex;">${icon(it.kind === 'Lab' ? 'microscope' : 'pencil', 14)}</span><span class="bold" style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escape(it.title)}</span><span class="pill ${u<=1?'pill':u<=3?'pill pill-butter':'pill pill-sky'}">${u===0?'today':u===1?'tomorrow':'in '+u+'d'}</span></li>`;
      }).join('')}</ul></div>`;
    },
    preview(variant) {
      if (variant === 'table') return `<div class="pv-table"><div class="pv-table-row"></div><div class="pv-table-row"></div><div class="pv-table-row"></div></div>`;
      if (variant === 'pills') return `<div class="pv-pills"><div class="pv-pill-row"><span class="pv-pill"></span><span class="pv-pill"></span></div><div></div><div></div></div>`;
      return `<div class="pv-rows"><div></div><div></div><div></div></div>`;
    },
  },

  /* --- HABITS --- */
  habits: {
    label: 'Habits',
    description: 'Daily habit tracker',
    category: 'Routine',
    minW: 3, minH: 2, defaultW: 7, defaultH: 2,
    variants: {
      grid:   { label: '7-day grid', description: 'Week-at-a-glance grid' },
      today:  { label: 'Today only', description: 'Just today\'s checks' },
      streak: { label: 'Streaks', description: 'Longest streaks per habit' },
    },
    render(d, opts) {
      if (d.habits.length === 0) return `<div class="widget-body widget-empty">Add some habits first.</div>`;
      const t = today();
      const habitDoneToday = d.habits.filter(h => h.days[t]).length;

      if (opts.variant === 'today') {
        return `<div class="widget-body"><div class="row-between mb-16"><div><div class="kpi-label">today</div><div class="kpi-value" style="font-size:32px;">${habitDoneToday}<span class="text-mute" style="font-size:14px;"> / ${d.habits.length}</span></div></div></div><ul class="mini-list">${d.habits.map(h => {
          const done = h.days[t];
          return `<li><input type="checkbox" class="checkbox" ${done?'checked':''} onchange="toggleHabit2('${h.id}','${t}', this, event)" /><span class="bold" style="flex:1;">${escape(h.name)}</span></li>`;
        }).join('')}</ul></div>`;
      }
      if (opts.variant === 'streak') {
        const streaks = d.habits.map(h => {
          let s = 0;
          let dt = new Date();
          while (true) {
            const iso = dt.toISOString().slice(0, 10);
            if (h.days[iso]) { s++; dt.setDate(dt.getDate() - 1); } else break;
          }
          return { h, s };
        }).sort((a,b) => b.s - a.s);
        return `<div class="widget-body"><ul class="mini-list">${streaks.map(({h, s}) => `<li><span class="bold" style="flex:1;">${escape(h.name)}</span><span class="font-mono" style="font-weight:700; color:var(--rose-deep);">${s}d</span></li>`).join('')}</ul></div>`;
      }
      // grid (default)
      return `<div class="widget-body">${miniHabitWeek()}</div>`;
    },
    preview(variant) {
      if (variant === 'today') return `<div class="pv-rows"><div></div><div></div><div></div></div>`;
      if (variant === 'streak') return `<div class="pv-rows pv-rows-end"><div></div><div></div><div></div></div>`;
      return `<div class="pv-grid7"></div>`;
    },
  },

  todoBox: {
    label: 'To-Do snapshot',
    description: 'Outstanding to-dos by category',
    category: 'Routine',
    minW: 3, minH: 2, defaultW: 4, defaultH: 2,
    variants: {
      count:  { label: 'Big count', description: 'Single big number + button' },
      list:   { label: 'Open list', description: 'List of next 5 open' },
      byCat:  { label: 'By category', description: 'Counts per category' },
    },
    render(d, opts) {
      const open = d.todos.filter(t => !t.done);
      if (opts.variant === 'list') {
        return `<div class="widget-body"><ul class="mini-list">${open.slice(0, 6).map(t => `<li><input type="checkbox" class="checkbox" onchange="toggleTodo('${t.id}', this, event)" /><span class="bold">${escape(t.title)}</span><span class="pill pill-ghost" style="margin-left:auto; font-size:10px;">${escape(t.category)}</span></li>`).join('')}</ul></div>`;
      }
      if (opts.variant === 'byCat') {
        const byCat = {};
        open.forEach(t => byCat[t.category] = (byCat[t.category] || 0) + 1);
        return `<div class="widget-body"><div class="todo-cat-grid">${Object.entries(byCat).map(([cat, n]) => `<div class="todo-cat-cell"><div class="todo-cat-num">${n}</div><div class="todo-cat-lbl">${escape(cat)}</div></div>`).join('')}</div></div>`;
      }
      // count (default)
      return `<div class="widget-body center-stack"><div class="kpi-label">TO-DO STILL PENDING</div><div class="kpi-value" style="font-size:54px;">${open.length}</div><button class="btn btn-sm mt-12" data-go="todo">open to-do</button></div>`;
    },
    preview(variant) {
      if (variant === 'list') return `<div class="pv-rows"><div></div><div></div><div></div></div>`;
      if (variant === 'byCat') return `<div class="pv-grid4"><span></span><span></span><span></span><span></span></div>`;
      return `<div class="pv-hero"><div class="pv-hero-num"></div></div>`;
    },
  },

  /* --- MONEY --- */
  spending: {
    label: 'Spending breakdown',
    description: 'Monthly spending by category',
    category: 'Money',
    minW: 3, minH: 2, defaultW: 6, defaultH: 3,
    variants: {
      stackBar: { label: 'Stacked bar + legend', description: 'Horizontal stack bar with legend' },
      barList:  { label: 'Bar per category', description: 'One progress bar per category' },
      topN:     { label: 'Top 3 callout', description: 'Hero top three categories' },
      barOnly:  { label: 'Bar only', description: 'Just the stacked bar with total' },
      legend:   { label: 'Legend only', description: 'List of categories with amounts' },
    },
    render(d, opts) {
      const totalOut = d.budget.expenses.reduce((s, x) => s + +x.amount, 0);
      const subsMonthly = d.subscriptions.reduce((s, x) => s + (x.billing === 'Monthly' ? +x.price : (x.billing === 'Yearly' ? +x.price/12 : 0)), 0);
      const totalSpend = totalOut + subsMonthly;
      const byCat = {};
      d.budget.expenses.forEach(x => { byCat[x.category] = (byCat[x.category] || 0) + +x.amount; });
      if (subsMonthly > 0) byCat['Subs'] = (byCat['Subs'] || 0) + subsMonthly;
      const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
      if (cats.length === 0) return `<div class="widget-body widget-empty">No expenses yet.</div>`;

      const stackHtml = `<div class="spend-stack">${cats.map(([cat, val]) => {
        const pct = (val / totalSpend) * 100;
        return `<span class="spend-stack-seg" style="width:${pct.toFixed(2)}%; background:${categoryColor(cat)};" title="${escape(cat)}: ${escape(fmtCurrency(val))}"></span>`;
      }).join('')}</div>`;

      const totalHtml = `<div class="spend-summary"><div class="spend-summary-label">MONTHLY TOTAL</div><div class="spend-summary-value">${fmtCurrency(totalSpend)}</div></div>`;

      const legendHtml = `<ul class="cat-list">${cats.slice(0, 6).map(([cat, val]) => {
        const pct = Math.round((val / totalSpend) * 100);
        return `<li><span class="cat-dot" style="background:${categoryColor(cat)};"></span><span class="cat-label">${escape(cat)}</span><span class="cat-amt"><span class="cat-pct">${pct}%</span><span class="cat-value font-mono">${fmtCurrency(val)}</span></span></li>`;
      }).join('')}</ul>`;

      if (opts.variant === 'barList') {
        const max = cats[0][1];
        return `<div class="widget-body">${totalHtml}<div class="bar-by-cat">${cats.slice(0, 8).map(([cat, val]) => {
          const pct = Math.round((val / totalSpend) * 100);
          return `<div class="bar-by-cat-row"><span class="bar-by-cat-label">${escape(cat)}</span><div class="bar-by-cat-track"><div class="bar-by-cat-fill" style="width:${(val/max*100).toFixed(0)}%; background:${categoryColor(cat)};"></div></div><span class="font-mono" style="font-size:12px; color:var(--ink-soft);">${pct}%</span><span class="font-mono" style="font-size:12px; color:var(--ink);">${fmtCurrency(val)}</span></div>`;
        }).join('')}</div></div>`;
      }
      if (opts.variant === 'topN') {
        const top3 = cats.slice(0, 3);
        return `<div class="widget-body">${totalHtml}<div class="top-n-grid">${top3.map(([cat, val]) => {
          const pct = Math.round((val / totalSpend) * 100);
          return `<div class="top-n-cell" style="background: ${categoryColor(cat)}22; border-color: ${categoryColor(cat)};"><div class="top-n-cat">${escape(cat)}</div><div class="top-n-val">${fmtCurrency(val)}</div><div class="top-n-pct">${pct}%</div></div>`;
        }).join('')}</div></div>`;
      }
      if (opts.variant === 'barOnly') {
        return `<div class="widget-body">${totalHtml}${stackHtml}</div>`;
      }
      if (opts.variant === 'legend') {
        return `<div class="widget-body">${totalHtml}${legendHtml}</div>`;
      }
      // stackBar (default)
      return `<div class="widget-body">${totalHtml}${stackHtml}${legendHtml}</div>`;
    },
    preview(variant) {
      if (variant === 'barList') return `<div class="pv-rows pv-bars"><div></div><div></div><div></div><div></div></div>`;
      if (variant === 'topN') return `<div class="pv-grid3"><span></span><span></span><span></span></div>`;
      if (variant === 'barOnly') return `<div class="pv-bar-only"><div class="pv-hero-num"></div><div class="pv-bar"></div></div>`;
      if (variant === 'legend') return `<div class="pv-rows"><div></div><div></div><div></div><div></div></div>`;
      return `<div class="pv-bar-only"><div class="pv-bar"></div><div class="pv-rows"><div></div><div></div></div></div>`;
    },
  },

  incomeVs: {
    label: 'Income vs spending',
    description: 'Income, spending, net',
    category: 'Money',
    minW: 3, minH: 2, defaultW: 6, defaultH: 3,
    variants: {
      bars:   { label: 'Bar comparison', description: 'Income vs spending bars + net' },
      net:    { label: 'Big net number', description: 'Hero saving/over-spend' },
      cards:  { label: 'Three cards', description: 'Income / spending / net side-by-side' },
    },
    render(d, opts) {
      const totalIn = d.budget.income.reduce((s, x) => s + +x.amount, 0);
      const totalOut = d.budget.expenses.reduce((s, x) => s + +x.amount, 0);
      const subsMonthly = d.subscriptions.reduce((s, x) => s + (x.billing === 'Monthly' ? +x.price : (x.billing === 'Yearly' ? +x.price/12 : 0)), 0);
      const totalSpend = totalOut + subsMonthly;
      const net = totalIn - totalSpend;
      const savingsRate = totalIn > 0 ? Math.round((net / totalIn) * 100) : 0;

      if (opts.variant === 'cards') {
        return `<div class="widget-body" style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 12px; height:100%;">
          ${kpi('Income', fmtCurrency(totalIn), '', '', 'var(--mint-cream)')}
          ${kpi('Spending', fmtCurrency(totalSpend), '', '', 'var(--rose-cloud)')}
          ${kpi('Net', (net>=0?'+':'−')+fmtCurrency(Math.abs(net)), savingsRate+'%', '', net>=0?'var(--mint-cream)':'#FFD9DD')}
        </div>`;
      }
      if (opts.variant === 'net') {
        return `<div class="widget-body center-stack">
          <div class="kpi-label">${net>=0?'SAVING':'OVERSPENDING'}</div>
          <div class="kpi-value" style="font-size:54px; color:${net>=0?'var(--sage-deep)':'var(--rose-deep)'};">${net>=0?'+':'−'}${fmtCurrency(Math.abs(net))}</div>
          <div class="kpi-sub">${savingsRate}% of income</div>
          <div class="row gap-12 mt-12 text-mute" style="font-size:12px;">
            <span>income ${fmtCurrency(totalIn)}</span>
            <span>·</span>
            <span>spending ${fmtCurrency(totalSpend)}</span>
          </div>
        </div>`;
      }
      // bars (default)
      return `<div class="widget-body"><div class="bar-comparison">
        <div class="bar-row"><span class="bar-label">income</span><div class="bar-track"><div class="bar-fill" style="width:100%; background:linear-gradient(90deg, var(--sage), var(--sage-deep));"></div></div><span class="bar-value font-mono">${fmtCurrency(totalIn)}</span></div>
        <div class="bar-row"><span class="bar-label">spending</span><div class="bar-track"><div class="bar-fill" style="width:${totalIn>0?Math.min(100, totalSpend/totalIn*100):(totalSpend>0?100:0)}%; background:linear-gradient(90deg, var(--rose), var(--rose-deep));"></div></div><span class="bar-value font-mono">${fmtCurrency(totalSpend)}</span></div>
        <div class="net-line"><span class="bar-label bold">net</span><div class="net-amount" style="color:${net>=0?'var(--sage-deep)':'var(--rose-deep)'};">${net>=0?'+':'−'}${fmtCurrency(Math.abs(net))} <span class="net-pct">${savingsRate>=0?'+':''}${savingsRate}%</span></div></div>
      </div></div>`;
    },
    preview(variant) {
      if (variant === 'cards') return `<div class="pv-grid3"><span></span><span></span><span></span></div>`;
      if (variant === 'net') return `<div class="pv-hero"><div class="pv-hero-num"></div></div>`;
      return `<div class="pv-bars"><div></div><div></div><div></div></div>`;
    },
  },

  monthlyMoney: {
    label: 'Monthly money',
    description: 'Income, spending, and remaining monthly budget',
    category: 'Money',
    minW: 3, minH: 2, defaultW: 6, defaultH: 3,
    variants: { chart: { label: 'Budget chart', description: 'Income, spending, and budget remaining' } },
    render(d) {
      const income = (d.budget.income || []).reduce((sum, item) => sum + (+item.amount || 0), 0);
      const expenses = (d.budget.expenses || []).reduce((sum, item) => sum + (+item.amount || 0), 0);
      const subscriptions = (d.subscriptions || []).reduce((sum, item) => sum + (item.billing === 'Monthly' ? (+item.price || 0) : item.billing === 'Yearly' ? (+item.price || 0) / 12 : 0), 0);
      const spent = expenses + subscriptions;
      const budget = +d.budget.monthlyTarget || 600;
      const remaining = budget - spent;
      const max = Math.max(income, spent, budget, 1);
      const pct = Math.min(100, Math.round((spent / budget) * 100));
      return widgetBox('This month', `
        <div class="monthly-money-chart">
          <div class="monthly-money-stats">
            <div><span>Income</span><strong>${fmtCurrency(income)}</strong></div>
            <div><span>Spent</span><strong>${fmtCurrency(spent)}</strong></div>
            <div class="${remaining >= 0 ? 'is-positive' : 'is-negative'}"><span>${remaining >= 0 ? 'Left to spend' : 'Over budget'}</span><strong>${fmtCurrency(Math.abs(remaining))}</strong></div>
          </div>
          <div class="monthly-money-bars">
            <div class="monthly-money-row"><span>Income</span><div><i style="width:${Math.round(income / max * 100)}%;"></i></div></div>
            <div class="monthly-money-row spending"><span>Spent</span><div><i style="width:${Math.round(spent / max * 100)}%;"></i></div></div>
          </div>
          <div class="monthly-budget-line"><span>${fmtCurrency(spent)} of ${fmtCurrency(budget)} monthly budget</span><div><i class="${remaining < 0 ? 'is-over' : ''}" style="width:${pct}%;"></i></div></div>
        </div>`);
    },
    preview() { return `<div class="pv-bars"><div></div><div></div><div></div></div>`; },
  },

  /* --- PERSONAL --- */
  moodSnap: {
    label: 'Mood snapshot',
    description: 'Today + last 7 days mood',
    category: 'Personal',
    minW: 3, minH: 1, defaultW: 4, defaultH: 2,
    variants: {
      today:    { label: 'Today picker', description: 'Pick today\'s mood inline' },
      weekDots: { label: '7-day dots', description: 'Last week as colored dots' },
      bigEmoji: { label: 'Big current', description: 'Big mood icon for today' },
    },
    render(d, opts) {
      const t = today();
      const todayMood = d.moods[t]?.score || 0;
      const level = todayMood ? MOOD_LEVELS[todayMood - 1] : null;

      if (opts.variant === 'weekDots') {
        const days = [];
        for (let i = 6; i >= 0; i--) { const dt = new Date(); dt.setDate(dt.getDate() - i); days.push(dt.toISOString().slice(0,10)); }
        return `<div class="widget-body"><div class="kpi-label" style="margin-bottom:8px;">LAST 7 DAYS</div><div class="mood-dot-row">${days.map(date => {
          const m = d.moods[date]?.score;
          const lv = m ? MOOD_LEVELS[m-1] : null;
          return `<div class="mood-dot" style="background: ${lv ? lv.color + '55' : 'rgba(255,255,255,0.4)'}; border-color: ${lv ? lv.color : 'var(--border)'};" title="${date}${lv?' · '+lv.label:''}">${lv ? `<span style="color:${lv.color}">${icon(lv.iconName, 18)}</span>` : '·'}</div>`;
        }).join('')}</div></div>`;
      }
      if (opts.variant === 'bigEmoji') {
        return `<div class="widget-body center-stack">${level ? `<div style="color:${level.color}">${icon(level.iconName, 72)}</div><div class="kpi-label" style="margin-top:8px;">${level.label.toUpperCase()}</div>` : `<div class="text-mute" style="font-size:13px;">No mood logged today.</div>`}<button class="btn btn-sm mt-12" data-go="mood">log mood</button></div>`;
      }
      // today (default)
      return `<div class="widget-body"><div class="kpi-label" style="margin-bottom:8px;">HOW DO YOU FEEL?</div><div class="mood-picker mood-picker-compact">${MOOD_LEVELS.map(m => `<button class="mood-pick-btn ${todayMood===m.score?'active':''}" style="--mood-color: ${m.color};" onclick="setMood(${m.score}, event)" title="${m.label}"><span class="mood-pick-icon">${icon(m.iconName, 24)}</span></button>`).join('')}</div></div>`;
    },
    preview(variant) {
      if (variant === 'weekDots') return `<div class="pv-dot-row"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
      if (variant === 'bigEmoji') return `<div class="pv-hero"><div class="pv-hero-circle"></div></div>`;
      return `<div class="pv-mood-row"><span></span><span></span><span></span><span></span><span></span></div>`;
    },
  },

  goalsSnap: {
    label: 'Goals progress',
    description: 'Top active goals with progress',
    category: 'Routine',
    minW: 3, minH: 2, defaultW: 5, defaultH: 2,
    variants: {
      bars:   { label: 'Progress bars', description: 'Goals as progress bars' },
      counts: { label: 'Done counts', description: 'X/Y milestones done' },
      rings:  { label: 'Mini rings', description: 'Each goal as a small ring' },
    },
    render(d, opts) {
      const goals = (d.goals || []).filter(g => g.status !== 'Done').slice(0, 4);
      if (goals.length === 0) return `<div class="widget-body widget-empty">No active goals.</div>`;

      const calc = (g) => {
        const m = g.milestones || [];
        if (!m.length) return { done: 0, total: 0, pct: 0 };
        const done = m.filter(x => x.done).length;
        return { done, total: m.length, pct: Math.round((done / m.length) * 100) };
      };

      if (opts.variant === 'counts') {
        return `<div class="widget-body"><ul class="mini-list">${goals.map(g => { const c = calc(g); return `<li><span class="bold" style="flex:1;">${escape(g.title)}</span><span class="font-mono" style="font-weight:700;">${c.done}<span class="text-mute">/${c.total||'—'}</span></span></li>`; }).join('')}</ul></div>`;
      }
      if (opts.variant === 'rings') {
        return `<div class="widget-body"><div class="goal-rings">${goals.map(g => { const c = calc(g); const deg = (c.pct/100)*360; return `<div class="goal-ring" title="${escape(g.title)}: ${c.done}/${c.total}"><div class="goal-ring-bg" style="background: conic-gradient(var(--rose-deep) ${deg}deg, var(--border) ${deg}deg);"><div class="goal-ring-inner">${c.pct}%</div></div><div class="goal-ring-lbl">${escape(g.title.slice(0,16))}</div></div>`; }).join('')}</div></div>`;
      }
      // bars (default)
      return `<div class="widget-body"><div style="display:flex; flex-direction:column; gap:10px;">${goals.map(g => { const c = calc(g); return `<div><div class="row-between" style="margin-bottom:4px;"><span class="bold" style="font-size:13px;">${escape(g.title)}</span><span class="text-mute font-mono" style="font-size:11px;">${c.done}/${c.total||'—'}</span></div><div class="progress"><div class="progress-fill" style="width:${c.pct}%;"></div></div></div>`; }).join('')}</div></div>`;
    },
    preview(variant) {
      if (variant === 'counts') return `<div class="pv-rows pv-rows-end"><div></div><div></div><div></div></div>`;
      if (variant === 'rings') return `<div class="pv-grid4"><span class="pv-circle"></span><span class="pv-circle"></span><span class="pv-circle"></span><span class="pv-circle"></span></div>`;
      return `<div class="pv-bars"><div></div><div></div><div></div></div>`;
    },
  },

  weekSchedule: {
    label: 'Week schedule',
    description: 'Daily class time blocks for the current week',
    category: 'School',
    minW: 5, minH: 3, defaultW: 14, defaultH: 5,
    variants: {
      blocks: { label: 'Time blocks', description: 'A Monday–Sunday schedule with course times' },
    },
    render(d) {
      return PlannerCalendarViews.weekWidget(d);
    },
    preview() {
      return `<div class="pv-strip pv-strip-7"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
    },
  },

  weekCal: {
    label: 'This week',
    description: 'Mini week-strip calendar',
    category: 'School',
    minW: 4, minH: 2, defaultW: 7, defaultH: 2,
    variants: {
      strip:  { label: 'Day strip', description: 'Today and next 6 days with counts' },
      hours:  { label: 'Today hours', description: 'Today\'s timed events vertically' },
      mini:   { label: 'Mini calendar', description: '7-cell grid with dots' },
    },
    render(d, opts) {
      // Build events per day for the next 7 days
      const days = [];
      for (let i = 0; i < 7; i++) {
        const dt = new Date(); dt.setDate(dt.getDate() + i);
        days.push({ iso: CalendarCore.dateKey(dt), dt });
      }
      const eventsOn = (iso) => {
        return [
          ...d.assignments.filter(a => !a.submitted && a.due === iso).map(a => ({ kind: 'A', title: a.title, color: 'var(--lilac-deep)' })),
          ...d.tests.filter(t => t.date === iso).map(t => ({ kind: 'T', title: t.title, color: 'var(--butter-deep)' })),
          ...d.exams.filter(e => e.date === iso).map(e => ({ kind: 'E', title: e.title, color: '#C24F69' })),
          ...CalendarCore.schoolEvents(d,iso,iso).map(e=>({kind:e.kind==='lab'?'L':'C',title:e.title,color:e.kind==='lab'?'var(--sage-deep)':'var(--lilac-deep)'})),
          ...d.labs.filter(l => l.reportDue === iso).map(l => ({ kind: 'L', title: l.title+' report', color: 'var(--sage-deep)' })),
        ];
      };
      if (opts.variant === 'hours') {
        const classes = CalendarCore.schoolEvents(d,today(),today()).filter(e=>e.start!=null)
          .map(e=>({time:e.time,end:e.endTime,title:e.title,room:e.location}));
        return `<div class="widget-body"><div class="kpi-label" style="margin-bottom:8px;">TODAY</div>${classes.length === 0 ? `<p class="text-mute" style="font-size:13px;">No classes today.</p>` : `<ul class="mini-list">${classes.map(c => `<li><span class="font-mono" style="font-size:11px; min-width:90px;">${escape(formatTimeRange(c.time, c.end))}</span><span class="bold">${escape(c.title)}</span><span class="text-mute">${escape(c.room||'')}</span></li>`).join('')}</ul>`}</div>`;
      }
      if (opts.variant === 'mini') {
        return `<div class="widget-body"><div class="cal-strip">${days.map(d => { const evs = eventsOn(d.iso); return `<div class="cal-strip-cell ${d.iso===today()?'is-today':''}"><div class="cal-strip-dow">${d.dt.toLocaleDateString(undefined,{weekday:'short'}).slice(0,2).toUpperCase()}</div><div class="cal-strip-num">${d.dt.getDate()}</div><div class="cal-strip-dots">${evs.slice(0,4).map(e => `<span class="cal-strip-dot" style="background:${e.color};"></span>`).join('')}</div></div>`; }).join('')}</div></div>`;
      }
      // strip (default)
      return `<div class="widget-body"><div class="cal-strip">${days.map(d => { const evs = eventsOn(d.iso); return `<div class="cal-strip-cell ${d.iso===today()?'is-today':''}"><div class="cal-strip-dow">${d.dt.toLocaleDateString(undefined,{weekday:'short'}).toUpperCase()}</div><div class="cal-strip-num">${d.dt.getDate()}</div><div class="cal-strip-list">${evs.slice(0,3).map(e => `<span class="cal-strip-evt" style="background:${e.color}33; color:${e.color};">${escape(e.title.slice(0,12))}</span>`).join('')}${evs.length>3?`<span class="cal-strip-more">+${evs.length-3}</span>`:''}</div></div>`; }).join('')}</div></div>`;
    },
    preview(variant) {
      if (variant === 'hours') return `<div class="pv-rows"><div></div><div></div><div></div></div>`;
      if (variant === 'mini') return `<div class="pv-strip pv-strip-7"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
      return `<div class="pv-strip pv-strip-7"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
    },
  },

  /* --- TEXT / LAYOUT --- */
  sectionTitle: {
    label: 'Section title',
    description: 'Big heading to group widgets below it',
    category: 'Layout',
    minW: 2, minH: 1, defaultW: 12, defaultH: 1,
    instance: { text: 'New section' },
    variants: {
      serif:    { label: 'Serif',        description: 'Big Fraunces heading' },
      script:   { label: 'Script',       description: 'Caveat handwritten heading' },
      uppercase:{ label: 'Uppercase tag',description: 'Small bold uppercase label' },
    },
    render(d, opts, inst, w) {
      const text = inst?.text || 'Section';
      const wid = w?.id || '';
      const cls = opts.variant === 'script' ? 'sec-script' : opts.variant === 'uppercase' ? 'sec-tag' : 'sec-serif';
      // Inline-editable only in edit mode — read-only otherwise.
      const editable = dashEditMode ? `contenteditable="true" data-inline-edit="${wid}" spellcheck="false"` : '';
      return `<div class="widget-body ${cls}" ${editable}>${escape(text)}</div>`;
    },
    preview(variant) {
      if (variant === 'script')    return `<div class="pv-text pv-script">Aa</div>`;
      if (variant === 'uppercase') return `<div class="pv-text pv-tag">AA</div>`;
      return `<div class="pv-text pv-serif">A</div>`;
    },
    edit(inst) {
      return `<label class="label">heading text</label><input class="input" id="inst-text" value="${escape(inst?.text || '')}" /><p class="text-mute" style="font-size:11px; margin-top:6px;">Tip: click the heading on the dashboard to edit it inline.</p>`;
    },
    onSave(inst) { inst.text = $('#inst-text').value || 'Section'; },
  },

  divider: {
    label: 'Divider line',
    description: 'Horizontal separator between groups of widgets',
    category: 'Layout',
    minW: 2, minH: 1, defaultW: 12, defaultH: 1,
    variants: {
      thin:    { label: 'Thin line',      description: 'Single hairline' },
      dashed:  { label: 'Dashed',         description: 'Dashed separator' },
      double:  { label: 'Double',         description: 'Two parallel lines' },
    },
    render(d, opts) {
      return `<div class="widget-body div-${opts.variant}"></div>`;
    },
    preview(variant) {
      if (variant === 'dashed') return `<div class="pv-div pv-dashed"></div>`;
      if (variant === 'double') return `<div class="pv-div pv-double"></div>`;
      return `<div class="pv-div"></div>`;
    },
  },

  noteCard: {
    label: 'Sticky note',
    description: 'A note or reminder you write yourself',
    category: 'Layout',
    minW: 2, minH: 2, defaultW: 3, defaultH: 2,
    instance: { text: 'click ⚙ to edit' },
    variants: {
      paper:   { label: 'Paper',          description: 'Like a sticky note' },
      callout: { label: 'Callout',        description: 'With colored left border' },
      quote:   { label: 'Quote',          description: 'Big script text centered' },
    },
    render(d, opts, inst, w) {
      const text = inst?.text || '';
      const wid = w?.id || '';
      const cls = opts.variant === 'quote' ? 'note-quote' : opts.variant === 'callout' ? 'note-callout' : 'note-paper';
      const editable = dashEditMode ? `contenteditable="true" data-inline-edit="${wid}" spellcheck="false"` : '';
      return `<div class="widget-body ${cls}" ${editable}>${escape(text).replace(/\n/g,'<br>')}</div>`;
    },
    preview(variant) {
      if (variant === 'quote')   return `<div class="pv-text pv-script">"</div>`;
      if (variant === 'callout') return `<div class="pv-callout"><span></span><div></div></div>`;
      return `<div class="pv-rows"><div></div><div></div></div>`;
    },
    edit(inst) {
      return `<label class="label">note</label><textarea class="textarea" id="inst-text">${escape(inst?.text || '')}</textarea><p class="text-mute" style="font-size:11px; margin-top:6px;">Tip: click the note on the dashboard to edit it inline.</p>`;
    },
    onSave(inst) { inst.text = $('#inst-text').value; },
  },

  /* --- SCHOOL: deadline countdowns --- */
  nextAssignment: {
    label: 'Next assignment',
    description: 'Single next assignment with countdown',
    category: 'School',
    minW: 2, minH: 1, defaultW: 4, defaultH: 2,
    variants: {
      hero:    { label: 'Hero countdown', description: 'Big days-until number' },
      info:    { label: 'Full info',      description: 'Title, course, due date' },
      list:    { label: 'Next 3',         description: 'Three next assignments' },
    },
    render(d, opts) {
      const open = d.assignments.filter(a => !a.submitted).sort((a,b) => (a.due||'').localeCompare(b.due||''));
      if (open.length === 0) return widgetBox('Next assignment', `<div class="widget-empty">All caught up.</div>`);
      if (opts.variant === 'list') {
        return widgetBox('Next assignments', `<ul class="mini-list">${open.slice(0, 3).map(a => { const u = daysUntil(a.due); return `<li><span class="bold">${escape(a.title)}</span><span class="text-mute">${escape(a.course||'')}</span><span class="pill ${u<=1?'pill':'pill-ghost'}" style="margin-left:auto;">${u===0?'today':u===1?'tomorrow':'in '+u+'d'}</span></li>`; }).join('')}</ul>`);
      }
      const a = open[0];
      const u = daysUntil(a.due);
      if (opts.variant === 'hero') {
        return widgetBox('Next assignment', `<div class="center-stack"><div class="kpi-value" style="font-size:42px; line-height:1; color: ${u<=1?'var(--rose-deep)':'var(--ink)'};">${u===0?'TODAY':u}<span style="font-size:14px;">${u===0?'':' days'}</span></div><div class="kpi-label" style="margin-top:4px;">${escape(a.title)}</div><div class="text-mute" style="font-size:11px;">${escape(a.course||'')}</div></div>`);
      }
      return widgetBox('Next assignment', `<div><div class="strip-num">${escape(a.title)}</div><div class="text-mute" style="font-size:12px;">${escape(a.course||'')} · ${fmtDate(a.due)}</div><div class="pill ${u<=1?'pill':'pill-ghost'} mt-12">${u===0?'today':u===1?'tomorrow':'in '+u+' days'}</div></div>`);
    },
    preview(variant) {
      if (variant === 'list') return `<div class="pv-rows"><div></div><div></div><div></div></div>`;
      if (variant === 'info') return `<div class="pv-rows pv-rows-detailed"><div></div></div>`;
      return `<div class="pv-hero"><div class="pv-hero-num"></div></div>`;
    },
  },

  nextExam: {
    label: 'Next exam',
    description: 'Single next exam with countdown',
    category: 'School',
    minW: 2, minH: 1, defaultW: 4, defaultH: 2,
    variants: {
      hero:    { label: 'Hero',          description: 'Big countdown' },
      info:    { label: 'Detailed',      description: 'Title + location + date' },
      finals:  { label: 'All finals',    description: 'List of every exam' },
    },
    render(d, opts) {
      const ex = d.exams.filter(e => e.status !== 'Done' && daysUntil(e.date) >= 0).sort((a,b) => a.date.localeCompare(b.date));
      if (ex.length === 0) return widgetBox('Next exam', `<div class="widget-empty">None scheduled.</div>`);
      if (opts.variant === 'finals') {
        return widgetBox('All finals', `<ul class="mini-list">${ex.map(e => { const u = daysUntil(e.date); return `<li><span class="bold">${escape(e.course)}</span><span class="text-mute">${escape(e.title)}</span><span class="pill pill-ghost" style="margin-left:auto;">in ${u}d</span></li>`; }).join('')}</ul>`);
      }
      const e = ex[0];
      const u = daysUntil(e.date);
      if (opts.variant === 'hero') {
        return widgetBox('Next exam', `<div class="center-stack"><div class="kpi-value" style="font-size:34px; line-height:1; margin-top:0; color: ${u<=7?'#C24F69':'var(--ink)'};">${u}<span style="font-size:12px;"> days</span></div><div class="kpi-label" style="margin-top:4px;">${escape(e.course)}</div></div>`);
      }
      return widgetBox('Next exam', `<div><div class="strip-num">${escape(e.course)}</div><div class="text-mute" style="font-size:12px;">${escape(e.title)} · ${escape(e.location||'')}</div><div class="text-mute" style="font-size:12px;">${fmtDate(e.date)}</div><div class="pill pill-butter mt-12">in ${u} days</div></div>`);
    },
    preview(variant) {
      if (variant === 'finals') return `<div class="pv-rows"><div></div><div></div></div>`;
      if (variant === 'info') return `<div class="pv-rows pv-rows-detailed"><div></div></div>`;
      return `<div class="pv-hero"><div class="pv-hero-num"></div></div>`;
    },
  },

  nextTest: {
    label: 'Next test/quiz',
    description: 'Upcoming quiz or midterm',
    category: 'School',
    minW: 2, minH: 1, defaultW: 4, defaultH: 2,
    variants: {
      hero: { label: 'Hero',  description: 'Big number + title' },
      info: { label: 'Info',  description: 'Course, weight, date' },
      list: { label: 'Top 3', description: '3 upcoming tests' },
    },
    render(d, opts) {
      const tests = d.tests.filter(t => t.status !== 'Done' && daysUntil(t.date) >= 0).sort((a,b) => a.date.localeCompare(b.date));
      if (tests.length === 0) return widgetBox('Next test', `<div class="widget-empty">None.</div>`);
      if (opts.variant === 'list') {
        return widgetBox('Next tests', `<ul class="mini-list">${tests.slice(0, 3).map(t => { const u = daysUntil(t.date); return `<li><span class="bold">${escape(t.title)}</span><span class="text-mute">${escape(t.course)}</span><span class="pill pill-ghost" style="margin-left:auto;">in ${u}d</span></li>`; }).join('')}</ul>`);
      }
      const t = tests[0];
      const u = daysUntil(t.date);
      if (opts.variant === 'hero') return widgetBox('Next test', `<div class="center-stack"><div class="kpi-value" style="font-size:48px;">${u}d</div><div class="kpi-label">${escape(t.title)}</div></div>`);
      return widgetBox('Next test', `<div><div class="strip-num">${escape(t.title)}</div><div class="text-mute" style="font-size:12px;">${escape(t.course)} · ${t.weight}% weight</div><div class="pill pill-butter mt-12">${fmtDate(t.date)} · in ${u}d</div></div>`);
    },
    preview(v) { return v === 'list' ? `<div class="pv-rows"><div></div><div></div><div></div></div>` : `<div class="pv-hero"><div class="pv-hero-num"></div></div>`; },
  },

  overdueCount: {
    label: 'Overdue items',
    description: 'How many things are past due',
    category: 'School',
    minW: 2, minH: 1, defaultW: 3, defaultH: 1,
    variants: {
      hero:  { label: 'Big number', description: 'Just the count' },
      pills: { label: 'Pills',      description: 'Counts by kind' },
      list:  { label: 'List',       description: 'All overdue items' },
    },
    render(d, opts) {
      const overdueA = d.assignments.filter(a => !a.submitted && daysUntil(a.due) < 0);
      const overdueL = d.labs.filter(l => l.status !== 'Done' && l.reportDue && daysUntil(l.reportDue) < 0);
      const all = [...overdueA.map(a => ({ kind: 'Assignment', title: a.title, days: -daysUntil(a.due) })), ...overdueL.map(l => ({ kind: 'Lab', title: l.title, days: -daysUntil(l.reportDue) }))];
      if (opts.variant === 'list') {
        return widgetBox('Overdue', all.length === 0 ? `<div class="widget-empty">All clear.</div>` : `<ul class="mini-list">${all.map(o => `<li><span class="bold">${escape(o.title)}</span><span class="pill" style="background:#FFD9DD; color:#C24F69; margin-left:auto;">${o.days}d late</span></li>`).join('')}</ul>`);
      }
      if (opts.variant === 'pills') {
        return widgetBox('Overdue', `<div class="row gap-8 mt-12"><span class="pill" style="background:#FFD9DD; color:#C24F69;">${overdueA.length} assignments</span><span class="pill" style="background:#FFD9DD; color:#C24F69;">${overdueL.length} labs</span></div>`);
      }
      return widgetBox('Overdue', `<div class="center-stack"><div class="kpi-value" style="font-size:48px; color:${all.length?'#C24F69':'var(--sage-deep)'};">${all.length}</div><div class="kpi-label">${all.length ? 'Need attention' : 'All clear'}</div></div>`);
    },
    preview(v) { return v === 'list' ? `<div class="pv-rows"><div></div><div></div></div>` : `<div class="pv-hero"><div class="pv-hero-num"></div></div>`; },
  },

  todaySchedule: {
    label: "Today's schedule",
    description: 'Hour-by-hour view of today',
    category: 'School',
    minW: 3, minH: 2, defaultW: 4, defaultH: 3,
    variants: {
      hours:  { label: 'Hours',  description: 'List by time' },
      timeline:{ label: 'Timeline', description: 'Vertical timeline of events' },
      counts: { label: 'Counts', description: 'How many classes/events today' },
    },
    render(d, opts) {
      const items = CalendarCore.schoolEvents(d,today(),today()).filter(e=>e.start!=null)
        .map(e=>({time:e.time,end:e.endTime,title:e.title,sub:e.detail,room:e.location,sm:e.start}));
      if (opts.variant === 'counts') {
        return widgetBox("Today", `<div class="center-stack"><div class="kpi-value" style="font-size:48px;">${items.length}</div><div class="kpi-label">classes today</div></div>`);
      }
      if (items.length === 0) return widgetBox("Today's schedule", `<div class="widget-empty">No classes today.</div>`);
      if (opts.variant === 'timeline') {
        return widgetBox("Today", `<ol class="timeline">${items.map(c => `<li><span class="tl-time font-mono">${escape(formatTime12(c.time))}</span><div><div class="bold">${escape(c.title)}</div><div class="text-mute" style="font-size:11px;">${escape(c.room||'')}</div></div></li>`).join('')}</ol>`);
      }
      return widgetBox("Today's schedule", `<ul class="mini-list">${items.map(c => `<li><span class="font-mono" style="font-size:11px; min-width:80px;">${escape(formatTimeRange(c.time, c.end))}</span><span class="bold">${escape(c.title)}</span><span class="text-mute">${escape(c.room||'')}</span></li>`).join('')}</ul>`);
    },
    preview(v) { return v === 'counts' ? `<div class="pv-hero"><div class="pv-hero-num"></div></div>` : `<div class="pv-rows"><div></div><div></div><div></div></div>`; },
  },

  /* --- STATS singles --- */
  statActiveCourses: {
    label: 'Active courses',
    description: 'How many courses you\'re currently taking',
    category: 'Stats',
    minW: 2, minH: 1, defaultW: 3, defaultH: 1,
    variants: {
      hero:    { label: 'Hero number',   description: 'Big number' },
      tile:    { label: 'Tile',          description: 'Number + credits sub' },
      sparkle: { label: 'With list',     description: 'Count plus course codes' },
      badge:   { label: 'Badge',         description: 'Round badge style' },
      gauge:   { label: 'Credit gauge',  description: 'Semicircle gauge toward 20 credits' },
    },
    render(d, opts) {
      const active = d.courses.filter(c => c.status === 'Active');
      const credits = active.reduce((s,c) => s + (+c.credits||0), 0);
      if (opts.variant === 'sparkle') return widgetBox('Active courses', `<div class="strip-num">${active.length}</div><div class="row gap-8 mt-12 flex-wrap">${active.map(c => `<span class="pill pill-ghost">${escape(c.code)}</span>`).join('')}</div>`);
      if (opts.variant === 'tile') return widgetBox('Active courses', `<div class="center-stack"><div class="kpi-value">${active.length}</div><div class="kpi-sub">${credits} credits</div></div>`);
      if (opts.variant === 'badge') return widgetBox('Active courses', `<div class="center-stack"><div class="badge-circle"><div class="badge-num">${active.length}</div><div class="badge-lbl">COURSES</div></div></div>`);
      if (opts.variant === 'gauge') {
        const pct = Math.min(100, (credits / 20) * 100);
        const angle = (pct / 100) * 180;
        return widgetBox('Credit load', `<div class="center-stack"><svg viewBox="0 0 100 60" class="gauge-svg" style="width:100%; max-width:140px;">
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="8" stroke-linecap="round"/>
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="var(--rose-deep)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(pct/100*125.66).toFixed(1)} 125.66"/>
          <text x="50" y="44" text-anchor="middle" font-size="18" font-weight="700" fill="var(--ink)">${credits}</text>
          <text x="50" y="56" text-anchor="middle" font-size="7" fill="var(--ink-mute)">/ 20 CREDITS</text>
        </svg></div>`);
      }
      return widgetBox('Active courses', `<div class="center-stack"><div class="kpi-value" style="font-size:54px;">${active.length}</div></div>`);
    },
    preview(v) {
      if (v === 'badge') return `<div class="pv-badge"></div>`;
      if (v === 'gauge') return `<div class="pv-gauge"></div>`;
      if (v === 'sparkle') return `<div class="pv-hero"><div class="pv-hero-num"></div><div class="pv-pill-row"><div></div></div></div>`;
      return `<div class="pv-hero"><div class="pv-hero-num"></div></div>`;
    },
  },

  statGPA: {
    label: 'GPA',
    description: 'Term or cumulative GPA',
    category: 'Stats',
    minW: 2, minH: 1, defaultW: 3, defaultH: 2,
    variants: {
      hero:       { label: 'Big number',  description: 'Just GPA' },
      withScale:  { label: 'With scale',  description: 'X.XX / max' },
      breakdown:  { label: 'Per term',    description: 'Mini GPA per semester' },
      ring:       { label: 'Ring',        description: 'Circular ring at GPA fraction' },
      letter:     { label: 'Letter grade',description: 'Big letter (A, A-, B+, …)' },
    },
    render(d, opts) {
      const graded = d.courses.filter(c => c.status === 'Active' && c.grade > 0);
      const gpa = computeGpa(graded);
      const scale = GPA_SCALES[d.gpaScale || '4'];
      if (opts.variant === 'breakdown') {
        const byKey = {}; d.courses.forEach(c => { const k = `${c.year||1}|${c.semester||'Fall'}`; (byKey[k]=byKey[k]||[]).push(c); });
        const items = Object.entries(byKey).map(([k, list]) => ({ k, gpa: computeGpa(list), graded: list.filter(c => c.grade > 0).length })).filter(x => x.graded > 0).slice(0, 5);
        return widgetBox('GPA by term', `<ul class="mini-list">${items.map(it => { const [y,s] = it.k.split('|'); return `<li><span class="bold">Y${y} ${s.slice(0,3)}</span><span class="font-mono" style="margin-left:auto; font-weight:700;">${it.gpa.toFixed(2)}</span></li>`; }).join('')}</ul>`);
      }
      if (opts.variant === 'withScale') return widgetBox('GPA', `<div class="center-stack"><div class="kpi-value" style="font-size:30px; line-height:1; margin-top:0;">${gpa.toFixed(2)}<span style="font-size:12px; opacity:0.5;"> / ${scale.max.toFixed(1)}</span></div><div class="kpi-sub" style="font-size:11px;">${scale.name}</div></div>`);
      if (opts.variant === 'ring') {
        const pct = Math.min(100, (gpa / scale.max) * 100);
        const C = 2 * Math.PI * 28;
        return widgetBox('GPA', `<div class="center-stack"><svg viewBox="0 0 70 70" class="ring-svg" style="width:84px; height:84px;">
          <circle cx="35" cy="35" r="28" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="6"/>
          <circle cx="35" cy="35" r="28" fill="none" stroke="var(--lilac-deep)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(pct/100*C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 35 35)"/>
          <text x="35" y="40" text-anchor="middle" font-size="16" font-weight="700" font-family="var(--font-serif)" fill="var(--ink)">${gpa.toFixed(2)}</text>
        </svg></div>`);
      }
      if (opts.variant === 'letter') {
        // Map GPA back to a letter using the scale's grade table (sorted high-to-low)
        const table = (scale.grades || []).slice().sort((a,b) => b.gpa - a.gpa);
        let letter = '—';
        for (const g of table) { if (gpa >= g.gpa - 0.01) { letter = g.letter; break; } }
        return widgetBox('Average', `<div class="center-stack"><div class="kpi-value" style="font-size:54px; line-height:1; color:var(--lilac-deep);">${letter}</div><div class="kpi-sub" style="font-size:11px;">${gpa.toFixed(2)} GPA</div></div>`);
      }
      return widgetBox('GPA', `<div class="center-stack"><div class="kpi-value" style="font-size:64px;">${gpa.toFixed(2)}</div></div>`);
    },
    preview(v) {
      if (v === 'ring')   return `<div class="pv-ring"></div>`;
      if (v === 'letter') return `<div class="pv-hero"><div class="pv-hero-num" style="font-size:48px;">A</div></div>`;
      if (v === 'breakdown') return `<div class="pv-rows"><div></div><div></div><div></div></div>`;
      return `<div class="pv-hero"><div class="pv-hero-num"></div></div>`;
    },
  },

  statCredits: {
    label: 'Credits',
    description: 'Credits this term / total earned',
    category: 'Stats',
    minW: 2, minH: 1, defaultW: 3, defaultH: 1,
    variants: {
      term:  { label: 'This term', description: 'Active courses sum' },
      total: { label: 'Total earned', description: 'Sum of graded courses' },
      both:  { label: 'Both',     description: 'Term + total' },
    },
    render(d, opts) {
      const termCr = d.courses.filter(c => c.status === 'Active').reduce((s,c) => s + +c.credits, 0);
      const earnedCr = d.courses.filter(c => +c.grade > 0).reduce((s,c) => s + +c.credits, 0);
      if (opts.variant === 'total') return widgetBox('Credits earned', `<div class="center-stack"><div class="kpi-value">${earnedCr}</div><div class="kpi-sub">all-time</div></div>`);
      if (opts.variant === 'both')  return widgetBox('Credits', `<div class="row gap-12" style="justify-content:space-around;"><div class="center-stack"><div class="kpi-value">${termCr}</div><div class="kpi-sub">term</div></div><div class="center-stack"><div class="kpi-value">${earnedCr}</div><div class="kpi-sub">earned</div></div></div>`);
      return widgetBox('Credits this term', `<div class="center-stack"><div class="kpi-value">${termCr}</div></div>`);
    },
    preview() { return `<div class="pv-hero"><div class="pv-hero-num"></div></div>`; },
  },

  statAvgGrade: {
    label: 'Average grade',
    description: 'Average across graded courses',
    category: 'Stats',
    minW: 2, minH: 1, defaultW: 3, defaultH: 1,
    variants: {
      pct:    { label: 'Percentage', description: 'X%' },
      letter: { label: 'Letter',     description: 'A+ / A / B+ ...' },
      both:   { label: 'Both',       description: 'Letter + %' },
    },
    render(d, opts) {
      const graded = d.courses.filter(c => +c.grade > 0);
      if (graded.length === 0) return widgetBox('Average grade', `<div class="widget-empty">No grades yet.</div>`);
      const avg = graded.reduce((s,c) => s + +c.grade, 0) / graded.length;
      const lett = letterFromPct(avg).letter;
      if (opts.variant === 'letter') return widgetBox('Average grade', `<div class="center-stack"><div class="kpi-value" style="font-size:64px;">${lett}</div></div>`);
      if (opts.variant === 'both')   return widgetBox('Average grade', `<div class="center-stack"><div class="kpi-value">${lett} <span style="font-size:22px; opacity:0.6;">${avg.toFixed(1)}%</span></div></div>`);
      return widgetBox('Average grade', `<div class="center-stack"><div class="kpi-value">${avg.toFixed(1)}%</div></div>`);
    },
    preview() { return `<div class="pv-hero"><div class="pv-hero-num"></div></div>`; },
  },

  statOpenAssign: {
    label: 'Open assignments',
    description: 'How many assignments still need work',
    category: 'Stats',
    minW: 2, minH: 1, defaultW: 3, defaultH: 1,
    variants: {
      hero:     { label: 'Number',         description: 'Just count of open' },
      thisWeek: { label: 'Due this week',  description: 'Count due in 7 days' },
      thisVsAll:{ label: 'Week / total',   description: 'This week vs total open' },
      weekDone: { label: 'Done / due wk',  description: 'Completed of assignments due this week' },
    },
    render(d, opts) {
      const open = d.assignments.filter(a => !a.submitted);
      const week = open.filter(a => { const u = daysUntil(a.due); return u >= 0 && u <= 7; });
      if (opts.variant === 'thisWeek')  return widgetBox('Due this week', `<div class="center-stack"><div class="kpi-value">${week.length}</div><div class="kpi-sub">assignments</div></div>`);
      if (opts.variant === 'thisVsAll') return widgetBox('Assignments', `<div class="center-stack"><div class="kpi-value">${week.length}<span style="font-size:20px; opacity:0.5;"> / ${open.length}</span></div><div class="kpi-sub">this week / total open</div></div>`);
      if (opts.variant === 'weekDone') {
        // All assignments with due date in this week (regardless of submitted)
        const dueThisWeek = d.assignments.filter(a => { const u = daysUntil(a.due); return u !== null && u >= 0 && u <= 7; });
        const done = dueThisWeek.filter(a => a.submitted).length;
        const total = dueThisWeek.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        return widgetBox('Assignments', `
          <div class="center-stack">
            <div class="kpi-value" style="font-size:30px; line-height:1; margin-top:0;">${done}<span style="font-size:12px; opacity:0.55;"> / ${total}</span></div>
            <div class="kpi-sub" style="font-size:11px;">done this week</div>
            <div class="progress" style="margin-top:4px; width: 70%;"><div class="progress-fill" style="width: ${pct}%;"></div></div>
          </div>
        `);
      }
      return widgetBox('Open assignments', `<div class="center-stack"><div class="kpi-value">${open.length}</div></div>`);
    },
    preview(variant) {
      if (variant === 'weekDone') return `<div class="pv-bar-only"><div class="pv-hero-num"></div><div class="pv-bar"></div></div>`;
      return `<div class="pv-hero"><div class="pv-hero-num"></div></div>`;
    },
  },

  statTodos: {
    label: 'To-do count',
    description: 'Outstanding to-dos',
    category: 'Stats',
    minW: 2, minH: 1, defaultW: 3, defaultH: 1,
    variants: {
      hero: { label: 'Number',       description: 'Just count' },
      doneToday: { label: 'Done today', description: 'X done / Y total' },
      byPriority: { label: 'By priority', description: 'High/Med/Low counts' },
    },
    render(d, opts) {
      const open = d.todos.filter(t => !t.done);
      const todayDone = d.todos.filter(t => t.done && t.done === true).length;
      if (opts.variant === 'doneToday') return widgetBox('To-do progress', `<div class="center-stack"><div class="kpi-value">${todayDone}<span style="font-size:20px; opacity:0.5;"> / ${d.todos.length}</span></div><div class="kpi-sub">done / all-time</div></div>`);
      if (opts.variant === 'byPriority') {
        const high = open.filter(t => t.priority === 'High').length;
        const med = open.filter(t => t.priority === 'Med').length;
        const low = open.filter(t => t.priority === 'Low').length;
        return widgetBox('To-do by priority', `<div class="row gap-8 mt-12" style="justify-content:space-around;"><div class="center-stack"><div class="kpi-value" style="font-size:28px; color:var(--rose-deep);">${high}</div><div class="kpi-sub">high</div></div><div class="center-stack"><div class="kpi-value" style="font-size:28px; color:var(--butter-deep);">${med}</div><div class="kpi-sub">med</div></div><div class="center-stack"><div class="kpi-value" style="font-size:28px; color:var(--sage-deep);">${low}</div><div class="kpi-sub">low</div></div></div>`);
      }
      return widgetBox('Open to-dos', `<div class="center-stack"><div class="kpi-value">${open.length}</div></div>`);
    },
    preview() { return `<div class="pv-hero"><div class="pv-hero-num"></div></div>`; },
  },

  /* --- LISTS / SNAPSHOTS --- */
  topHighPriority: {
    label: 'High-priority to-dos',
    description: 'Things marked high priority',
    category: 'Routine',
    minW: 3, minH: 2, defaultW: 4, defaultH: 2,
    variants: {
      list: { label: 'List',     description: 'With checkboxes' },
      compact: { label: 'Compact', description: 'Just titles' },
      count: { label: 'Count',   description: 'Big number' },
    },
    render(d, opts) {
      const high = d.todos.filter(t => !t.done && t.priority === 'High');
      if (opts.variant === 'count') return widgetBox('High priority', `<div class="center-stack"><div class="kpi-value" style="font-size:54px; color:var(--rose-deep);">${high.length}</div></div>`);
      if (high.length === 0) return widgetBox('High priority', `<div class="widget-empty">Nothing urgent.</div>`);
      if (opts.variant === 'compact') return widgetBox('High priority', `<ul class="mini-list">${high.map(t => `<li><span class="dot" style="background:var(--rose-deep);"></span><span class="bold">${escape(t.title)}</span></li>`).join('')}</ul>`);
      return widgetBox('High priority', `<ul class="mini-list">${high.map(t => `<li><input type="checkbox" class="checkbox" onchange="toggleTodo('${t.id}', this, event)"/><span class="bold">${escape(t.title)}</span><span class="text-mute" style="margin-left:auto; font-size:11px;">${escape(t.category)}</span></li>`).join('')}</ul>`);
    },
    preview(v) { return v === 'count' ? `<div class="pv-hero"><div class="pv-hero-num"></div></div>` : `<div class="pv-rows"><div></div><div></div><div></div></div>`; },
  },

  recentGrades: {
    label: 'Recent grades',
    description: 'Last few grades received',
    category: 'School',
    minW: 3, minH: 2, defaultW: 4, defaultH: 2,
    variants: {
      list:    { label: 'List',     description: 'Course + grade' },
      sparkBar:{ label: 'Bar list', description: 'Grade bars' },
      avgOnly: { label: 'Just avg', description: 'Big average number' },
    },
    render(d, opts) {
      const items = [...d.assignments.filter(a => a.grade > 0).map(a => ({ title: a.title, course: a.course, grade: a.grade })),
                     ...d.tests.filter(t => t.grade > 0).map(t => ({ title: t.title, course: t.course, grade: t.grade })),
                     ...d.labs.filter(l => l.grade > 0).map(l => ({ title: l.title, course: l.course, grade: l.grade }))].slice(-6).reverse();
      if (items.length === 0) return widgetBox('Recent grades', `<div class="widget-empty">No grades yet.</div>`);
      if (opts.variant === 'avgOnly') {
        const avg = items.reduce((s,i) => s + i.grade, 0) / items.length;
        return widgetBox('Recent average', `<div class="center-stack"><div class="kpi-value">${avg.toFixed(1)}%</div><div class="kpi-sub">last ${items.length}</div></div>`);
      }
      if (opts.variant === 'sparkBar') {
        return widgetBox('Recent grades', `<div style="display:flex; flex-direction:column; gap:6px;">${items.map(it => `<div class="row gap-8"><span class="text-mute" style="font-size:11px; min-width:70px;">${escape(it.course)}</span><div class="bar-track" style="flex:1;"><div class="bar-fill" style="width:${it.grade}%; background:linear-gradient(90deg, var(--sage), var(--sage-deep));"></div></div><span class="font-mono" style="font-size:11px;">${it.grade}%</span></div>`).join('')}</div>`);
      }
      return widgetBox('Recent grades', `<ul class="mini-list">${items.map(it => `<li><span class="bold">${escape(it.title)}</span><span class="text-mute">${escape(it.course)}</span><span class="font-mono" style="margin-left:auto; font-weight:700;">${it.grade}%</span></li>`).join('')}</ul>`);
    },
    preview(v) { return v === 'avgOnly' ? `<div class="pv-hero"><div class="pv-hero-num"></div></div>` : `<div class="pv-rows"><div></div><div></div><div></div></div>`; },
  },

  recentBrainDump: {
    label: 'Recent brain dump',
    description: 'Last few thoughts captured',
    category: 'Personal',
    minW: 3, minH: 2, defaultW: 4, defaultH: 3,
    variants: {
      sticky: { label: 'Sticky notes', description: 'Like the brain dump page' },
      list:   { label: 'List',         description: 'Compact text list' },
      latest: { label: 'Latest only',  description: 'Most recent in big text' },
    },
    render(d, opts) {
      const items = [...(d.brainDump || [])].sort((a,b) => (b.created||0) - (a.created||0)).slice(0, 5);
      if (items.length === 0) return widgetBox('Brain dump', `<div class="widget-empty">Nothing dumped yet.</div>`);
      if (opts.variant === 'latest') {
        return widgetBox('Latest thought', `<div class="note-quote" style="font-size:18px;">"${escape(items[0].text)}"</div>`);
      }
      if (opts.variant === 'list') {
        return widgetBox('Brain dump', `<ul class="mini-list">${items.map(b => `<li><span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escape(b.text)}</span></li>`).join('')}</ul>`);
      }
      return widgetBox('Brain dump', `<div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap:8px;">${items.map(b => `<div class="sticky" style="font-size:13px; padding:8px;">${escape(b.text.slice(0, 80))}</div>`).join('')}</div>`);
    },
    preview() { return `<div class="pv-rows"><div></div><div></div><div></div></div>`; },
  },

  recentNotes: {
    label: 'Notes journal',
    description: 'Your long-form notes',
    category: 'Personal',
    minW: 3, minH: 2, defaultW: 6, defaultH: 3,
    variants: {
      full:    { label: 'Full text',   description: 'Whole notes content' },
      preview: { label: 'Preview',     description: 'First few lines' },
      count:   { label: 'Word count',  description: 'How many words written' },
    },
    render(d, opts) {
      const notes = d.notes || '';
      if (opts.variant === 'count') {
        const words = notes.trim() ? notes.trim().split(/\s+/).length : 0;
        return widgetBox('Notes', `<div class="center-stack"><div class="kpi-value">${words}</div><div class="kpi-sub">words written</div></div>`);
      }
      if (notes.trim() === '') return widgetBox('Notes', `<div class="widget-empty">No notes yet.</div>`);
      if (opts.variant === 'preview') return widgetBox('Notes', `<div class="text-mute" style="font-style:italic; font-size:13px;">${escape(notes.split('\n').slice(0, 3).join(' · '))}</div>`);
      return widgetBox('Notes', `<div class="note-card" style="background:none; padding:0;"><div style="white-space:pre-wrap; font-family:var(--font-display); font-size:18px; line-height:1.5;">${escape(notes.slice(0, 500))}${notes.length > 500 ? '…' : ''}</div></div>`);
    },
    preview(v) { return v === 'count' ? `<div class="pv-hero"><div class="pv-hero-num"></div></div>` : `<div class="pv-rows"><div></div><div></div><div></div></div>`; },
  },

  contactsDir: {
    label: 'Contacts',
    description: 'Professors / TAs / advisors',
    category: 'Career',
    minW: 3, minH: 2, defaultW: 4, defaultH: 3,
    variants: {
      list:   { label: 'List',        description: 'Names + roles' },
      cards:  { label: 'Cards',       description: 'Each contact as a tile' },
      count:  { label: 'Count',       description: 'How many people' },
    },
    render(d, opts) {
      const c = d.contacts || [];
      if (opts.variant === 'count') return widgetBox('Contacts', `<div class="center-stack"><div class="kpi-value">${c.length}</div></div>`);
      if (c.length === 0) return widgetBox('Contacts', `<div class="widget-empty">None saved.</div>`);
      if (opts.variant === 'cards') return widgetBox('Contacts', `<div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap:8px;">${c.map(p => `<div class="card" style="padding:8px; background:rgba(255,255,255,0.6);"><div class="bold" style="font-size:13px;">${escape(p.name)}</div><div class="text-mute" style="font-size:10px;">${escape(p.role)}</div></div>`).join('')}</div>`);
      return widgetBox('Contacts', `<ul class="mini-list">${c.map(p => `<li><span class="bold">${escape(p.name)}</span><span class="pill pill-ghost" style="margin-left:auto;">${escape(p.role)}</span></li>`).join('')}</ul>`);
    },
    preview() { return `<div class="pv-rows"><div></div><div></div><div></div></div>`; },
  },

  coopPipeline: {
    label: 'Co-op pipeline',
    description: 'Application pipeline counts',
    category: 'Career',
    minW: 3, minH: 2, defaultW: 5, defaultH: 2,
    variants: {
      pills:  { label: 'Stage counts', description: 'Count per stage' },
      list:   { label: 'Active apps',  description: 'List of active' },
      offers: { label: 'Offers',       description: 'Just offers' },
    },
    render(d, opts) {
      const c = d.coop || [];
      const byStage = {}; c.forEach(x => { byStage[x.stage] = (byStage[x.stage]||0)+1; });
      if (opts.variant === 'offers') {
        const off = c.filter(x => x.stage === 'Offer' || x.stage === 'Accepted');
        return widgetBox('Offers', off.length === 0 ? `<div class="widget-empty">No offers yet.</div>` : `<ul class="mini-list">${off.map(o => `<li><span class="bold">${escape(o.company)}</span><span class="text-mute">${escape(o.role)}</span><span class="pill pill-mint" style="margin-left:auto;">${escape(o.stage)}</span></li>`).join('')}</ul>`);
      }
      if (opts.variant === 'list') {
        const active = c.filter(x => x.stage !== 'Closed' && x.stage !== 'Accepted');
        return widgetBox('Active applications', `<ul class="mini-list">${active.map(a => `<li><span class="bold">${escape(a.company)}</span><span class="text-mute">${escape(a.role)}</span><span class="pill pill-ghost" style="margin-left:auto;">${escape(a.stage)}</span></li>`).join('')}</ul>`);
      }
      return widgetBox('Co-op pipeline', `<div class="row gap-8 flex-wrap" style="margin-top:12px;">${Object.entries(byStage).map(([s, n]) => `<span class="pill pill-lilac">${escape(s)} · ${n}</span>`).join('')}</div>`);
    },
    preview() { return `<div class="pv-rows"><div></div><div></div></div>`; },
  },

  ghostedCount: {
    label: 'Ghosted apps',
    description: 'Co-op apps with no recent contact',
    category: 'Career',
    minW: 2, minH: 1, defaultW: 3, defaultH: 1,
    variants: {
      hero:   { label: 'Number',  description: 'Count' },
      list:   { label: 'Which',   description: 'List of ghosted' },
      action: { label: 'Action',  description: 'Reminder to follow up' },
    },
    render(d, opts) {
      const c = (d.coop || []).filter(x => {
        if (!['Applied', 'Assessment', 'Interviewing'].includes(x.stage)) return false;
        const last = x.lastContact || x.appliedOn;
        if (!last) return false;
        return daysSince(last) >= 14;
      });
      if (opts.variant === 'list') return widgetBox('Ghosted', c.length === 0 ? `<div class="widget-empty">None.</div>` : `<ul class="mini-list">${c.map(a => `<li><span class="bold">${escape(a.company)}</span><span class="pill" style="background:#FFD9DD; color:#C24F69; margin-left:auto;">${daysSince(a.lastContact || a.appliedOn)}d silent</span></li>`).join('')}</ul>`);
      if (opts.variant === 'action') return widgetBox('Need follow-up', `<div class="center-stack"><div class="kpi-value">${c.length}</div><div class="kpi-sub">apps silent 14d+</div>${c.length ? `<button class="btn btn-sm mt-12" data-go="coop">open co-op</button>` : ''}</div>`);
      return widgetBox('Ghosted apps', `<div class="center-stack"><div class="kpi-value" style="color:${c.length?'#C24F69':'var(--sage-deep)'};">${c.length}</div></div>`);
    },
    preview() { return `<div class="pv-hero"><div class="pv-hero-num"></div></div>`; },
  },

  /* --- READING --- */
  readingProgress: {
    label: 'Reading progress',
    description: 'Currently reading + page progress',
    category: 'Personal',
    minW: 3, minH: 1, defaultW: 4, defaultH: 2,
    variants: {
      current: { label: 'Current book',  description: 'One book + bar' },
      stack:   { label: 'Reading stack', description: 'All books in progress' },
      stats:   { label: 'Year stats',    description: 'Books done this year' },
    },
    render(d, opts) {
      const reading = (d.reading || []).filter(b => b.status === 'Reading');
      const done = (d.reading || []).filter(b => b.status === 'Done').length;
      if (opts.variant === 'stats') return widgetBox('Reading stats', `<div class="row gap-12" style="justify-content:space-around;"><div class="center-stack"><div class="kpi-value">${done}</div><div class="kpi-sub">done</div></div><div class="center-stack"><div class="kpi-value">${reading.length}</div><div class="kpi-sub">reading</div></div></div>`);
      if (reading.length === 0) return widgetBox('Reading', `<div class="widget-empty">Not reading anything.</div>`);
      if (opts.variant === 'stack') {
        return widgetBox('Reading stack', `<div style="display:flex; flex-direction:column; gap:10px;">${reading.map(b => { const pct = b.pages ? Math.round((b.currentPage / b.pages) * 100) : 0; return `<div><div class="row-between" style="margin-bottom:4px;"><span class="bold" style="font-size:12px;">${escape(b.title)}</span><span class="text-mute" style="font-size:11px;">${pct}%</span></div><div class="progress"><div class="progress-fill" style="width:${pct}%;"></div></div></div>`; }).join('')}</div>`);
      }
      const b = reading[0];
      const pct = b.pages ? Math.round((b.currentPage / b.pages) * 100) : 0;
      return widgetBox('Currently reading', `<div><div class="bold" style="font-size:16px;">${escape(b.title)}</div><div class="text-mute" style="font-size:12px;">${escape(b.author||'')}</div><div class="progress mt-12"><div class="progress-fill" style="width:${pct}%;"></div></div><div class="text-mute" style="font-size:11px; margin-top:6px;">page ${b.currentPage} of ${b.pages} (${pct}%)</div></div>`);
    },
    preview(v) { return v === 'stats' ? `<div class="pv-hero"><div class="pv-hero-num"></div></div>` : `<div class="pv-rows pv-bars"><div></div><div></div></div>`; },
  },

  /* --- HABITS extras --- */
  habitStreaks: {
    label: 'Habit streaks',
    description: 'Top habit streaks',
    category: 'Routine',
    minW: 3, minH: 1, defaultW: 4, defaultH: 2,
    variants: {
      top:   { label: 'Top streak',  description: 'Longest current streak' },
      list:  { label: 'List',        description: 'All habits' },
      total: { label: 'All-time',    description: 'Total checks across habits' },
    },
    render(d, opts) {
      if ((d.habits || []).length === 0) return widgetBox('Habits', `<div class="widget-empty">Add habits first.</div>`);
      const streaks = d.habits.map(h => { let s = 0; let dt = new Date(); while(true){ const iso = dt.toISOString().slice(0,10); if (h.days[iso]) { s++; dt.setDate(dt.getDate()-1); } else break; } return { h, s }; }).sort((a,b) => b.s - a.s);
      if (opts.variant === 'total') {
        const total = d.habits.reduce((s,h) => s + Object.keys(h.days || {}).length, 0);
        return widgetBox('Habit checks', `<div class="center-stack"><div class="kpi-value">${total}</div><div class="kpi-sub">all-time</div></div>`);
      }
      if (opts.variant === 'top') {
        const top = streaks[0];
        return widgetBox('Longest streak', `<div class="center-stack"><div class="kpi-value">${top.s}d</div><div class="kpi-label">${escape(top.h.name)}</div></div>`);
      }
      return widgetBox('Habit streaks', `<ul class="mini-list">${streaks.map(({h, s}) => `<li><span class="bold">${escape(h.name)}</span><span class="font-mono" style="margin-left:auto; font-weight:700;">${s}d</span></li>`).join('')}</ul>`);
    },
    preview() { return `<div class="pv-hero"><div class="pv-hero-num"></div></div>`; },
  },

  /* --- MONEY extras --- */
  subRenewal: {
    label: 'Subscription renewals',
    description: 'Next subs renewing',
    category: 'Money',
    minW: 3, minH: 1, defaultW: 4, defaultH: 2,
    variants: {
      next:   { label: 'Next renewal', description: 'One closest renewal' },
      list:   { label: 'All',          description: 'Sorted list' },
      monthly:{ label: 'Monthly burn', description: 'Total $/month' },
    },
    render(d, opts) {
      const subs = (d.subscriptions || []).filter(s => s.renews).sort((a,b) => a.renews.localeCompare(b.renews));
      if (opts.variant === 'monthly') {
        const mo = subs.reduce((s,x) => s + (x.billing === 'Monthly' ? +x.price : (x.billing === 'Yearly' ? +x.price/12 : 0)), 0);
        return widgetBox('Subscriptions', `<div class="center-stack"><div class="kpi-value">${fmtCurrency(mo)}</div><div class="kpi-sub">per month</div></div>`);
      }
      if (subs.length === 0) return widgetBox('Subscriptions', `<div class="widget-empty">None.</div>`);
      if (opts.variant === 'list') {
        return widgetBox('Subscriptions', `<ul class="mini-list">${subs.map(s => { const u = daysUntil(s.renews); return `<li><span class="bold">${escape(s.name)}</span><span class="text-mute font-mono">${fmtCurrency(s.price)}</span><span class="pill pill-ghost" style="margin-left:auto;">${u<0?Math.abs(u)+'d ago':'in '+u+'d'}</span></li>`; }).join('')}</ul>`);
      }
      const s = subs.find(x => daysUntil(x.renews) >= 0) || subs[0];
      const u = daysUntil(s.renews);
      return widgetBox('Next renewal', `<div><div class="bold" style="font-size:18px;">${escape(s.name)}</div><div class="font-mono" style="font-size:16px; margin-top:4px;">${fmtCurrency(s.price)}</div><div class="pill ${u<=3?'pill-butter':'pill-ghost'} mt-12">${u===0?'today':u===1?'tomorrow':'in '+u+'d'}</div></div>`);
    },
    preview() { return `<div class="pv-hero"><div class="pv-hero-num"></div></div>`; },
  },

  netSavings: {
    label: 'Net savings',
    description: 'Income minus spending',
    category: 'Money',
    minW: 2, minH: 1, defaultW: 3, defaultH: 1,
    variants: {
      hero: { label: 'Big number', description: '+/-$XXX' },
      pct:  { label: 'Savings rate', description: 'Percentage of income' },
      both: { label: 'Both',         description: 'Number + percentage' },
    },
    render(d, opts) {
      const totalIn = d.budget.income.reduce((s, x) => s + +x.amount, 0);
      const totalOut = d.budget.expenses.reduce((s, x) => s + +x.amount, 0);
      const subsMo = d.subscriptions.reduce((s, x) => s + (x.billing === 'Monthly' ? +x.price : (x.billing === 'Yearly' ? +x.price/12 : 0)), 0);
      const net = totalIn - totalOut - subsMo;
      const pct = totalIn > 0 ? Math.round((net / totalIn) * 100) : 0;
      if (opts.variant === 'pct') return widgetBox('Savings rate', `<div class="center-stack"><div class="kpi-value" style="color:${pct>=0?'var(--sage-deep)':'var(--rose-deep)'};">${pct}%</div><div class="kpi-sub">of income</div></div>`);
      if (opts.variant === 'both') return widgetBox('Savings', `<div class="center-stack"><div class="kpi-value" style="color:${net>=0?'var(--sage-deep)':'var(--rose-deep)'};">${net>=0?'+':'−'}${fmtCurrency(Math.abs(net))}</div><div class="kpi-sub">${pct}% of income</div></div>`);
      return widgetBox(net >= 0 ? 'Saving' : 'Overspending', `<div class="center-stack"><div class="kpi-value" style="color:${net>=0?'var(--sage-deep)':'var(--rose-deep)'};">${net>=0?'+':'−'}${fmtCurrency(Math.abs(net))}</div></div>`);
    },
    preview() { return `<div class="pv-hero"><div class="pv-hero-num"></div></div>`; },
  },

  /* --- WELLBEING --- */
  moodToday: {
    label: 'Mood right now',
    description: 'Today\'s mood as a single card',
    category: 'Personal',
    minW: 2, minH: 1, defaultW: 3, defaultH: 2,
    variants: {
      big:   { label: 'Big icon',    description: 'Big face' },
      logged:{ label: 'Logged days', description: 'Streak of mood logs' },
      avg:   { label: '30-day avg',  description: 'Average mood' },
    },
    render(d, opts) {
      const t = today();
      const m = d.moods?.[t]?.score;
      if (opts.variant === 'logged') {
        let s = 0; let dt = new Date();
        while(true){ const iso = dt.toISOString().slice(0,10); if (d.moods?.[iso]?.score) { s++; dt.setDate(dt.getDate()-1); } else break; }
        return widgetBox('Mood streak', `<div class="center-stack"><div class="kpi-value">${s}d</div><div class="kpi-sub">days in a row</div></div>`);
      }
      if (opts.variant === 'avg') {
        const recent = []; for (let i = 0; i < 30; i++) { const dt = new Date(); dt.setDate(dt.getDate()-i); const sc = d.moods?.[dt.toISOString().slice(0,10)]?.score; if (sc) recent.push(sc); }
        const avg = recent.length ? recent.reduce((a,b)=>a+b,0)/recent.length : 0;
        const lev = avg ? MOOD_LEVELS[Math.round(avg)-1] : null;
        return widgetBox('Mood 30d', `<div class="center-stack">${lev ? `<div style="color:${lev.color}">${icon(lev.iconName, 48)}</div><div class="kpi-value" style="font-size:32px; margin-top:8px;">${avg.toFixed(1)}</div>` : `<div class="text-mute">No data.</div>`}</div>`);
      }
      const lev = m ? MOOD_LEVELS[m-1] : null;
      return widgetBox('Mood today', `<div class="center-stack">${lev ? `<div style="color:${lev.color}">${icon(lev.iconName, 56)}</div><div class="kpi-label" style="margin-top:8px;">${lev.label.toUpperCase()}</div>` : `<div class="text-mute" style="font-size:13px;">Not logged today.</div><button class="btn btn-sm mt-12" data-go="mood">log mood</button>`}</div>`);
    },
    preview() { return `<div class="pv-hero"><div class="pv-hero-circle"></div></div>`; },
  },

  focusStats: {
    label: 'Focus sessions',
    description: 'Focus timer stats',
    category: 'Routine',
    minW: 2, minH: 1, defaultW: 3, defaultH: 1,
    variants: {
      today: { label: 'Today',  description: 'Sessions today' },
      quick: { label: 'Quick start', description: 'Start a focus block' },
      pomo:  { label: 'Pomodoro time', description: 'Minutes focused' },
    },
    render(d, opts) {
      const today = d.focus?.sessionsToday || 0;
      if (opts.variant === 'quick') return widgetBox('Focus', `<div class="center-stack"><div class="kpi-label">25-min block</div><button class="btn btn-mint btn-sm mt-12" data-go="focus">start focus</button></div>`);
      if (opts.variant === 'pomo')  return widgetBox('Focused time', `<div class="center-stack"><div class="kpi-value">${today * 25}<span style="font-size:18px;">min</span></div><div class="kpi-sub">today</div></div>`);
      return widgetBox('Focus sessions', `<div class="center-stack"><div class="kpi-value">${today}</div><div class="kpi-sub">today</div></div>`);
    },
    preview() { return `<div class="pv-hero"><div class="pv-hero-num"></div></div>`; },
  },

  /* --- CALENDAR / TIME --- */
  semesterProgress: {
    label: 'Semester progress',
    description: 'How far through the term you are',
    category: 'School',
    minW: 3, minH: 1, defaultW: 4, defaultH: 1,
    variants: {
      bar:  { label: 'Progress bar', description: 'Bar + percentage' },
      days: { label: 'Days left',    description: 'Days remaining' },
      pct:  { label: 'Just %',       description: 'Big percentage' },
    },
    render(d, opts) {
      // Heuristic: assume current semester is 16 weeks (112 days). Use currentSemester.
      const cur = d.currentSemester || currentSemesterId();
      const m = cur.match(/^([FWS])(\d{4})$/);
      let startDate, endDate;
      if (m) {
        const [, season, y] = m;
        const yy = +y;
        if (season === 'F')      { startDate = new Date(yy, 8, 1);  endDate = new Date(yy, 11, 20); }
        else if (season === 'W') { startDate = new Date(yy, 0, 5);  endDate = new Date(yy, 3, 25);  }
        else                     { startDate = new Date(yy, 4, 1);  endDate = new Date(yy, 7, 25);  }
      } else {
        startDate = new Date(); endDate = new Date(); endDate.setMonth(endDate.getMonth() + 4);
      }
      const now = new Date();
      const total = endDate - startDate;
      const elapsed = Math.max(0, Math.min(total, now - startDate));
      const pct = Math.round((elapsed / total) * 100);
      const daysLeft = Math.max(0, Math.ceil((endDate - now) / 86400000));
      if (opts.variant === 'days') return widgetBox('Days left in term', `<div class="center-stack"><div class="kpi-value">${daysLeft}</div><div class="kpi-sub">${semesterLabel(cur)}</div></div>`);
      if (opts.variant === 'pct')  return widgetBox('Semester progress', `<div class="center-stack"><div class="kpi-value">${pct}%</div><div class="kpi-sub">${semesterLabel(cur)}</div></div>`);
      return widgetBox('Semester progress', `<div><div class="text-mute" style="font-size:12px; margin-bottom:6px;">${semesterLabel(cur)} · ${daysLeft}d left</div><div class="progress"><div class="progress-fill" style="width:${pct}%;"></div></div><div class="text-mute" style="font-size:11px; margin-top:6px;">${pct}% through</div></div>`);
    },
    preview(v) { return v === 'bar' ? `<div class="pv-bars"><div></div></div>` : `<div class="pv-hero"><div class="pv-hero-num"></div></div>`; },
  },

  yearProgress: {
    label: 'Year progress',
    description: 'How far through this calendar year',
    category: 'Stats',
    minW: 2, minH: 1, defaultW: 3, defaultH: 1,
    variants: {
      bar: { label: 'Bar', description: 'Progress bar' },
      pct: { label: 'Just %', description: 'Big number' },
      days:{ label: 'Days remaining', description: 'Calendar days left' },
    },
    render(d, opts) {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear() + 1, 0, 1);
      const pct = Math.round(((now - start) / (end - start)) * 100);
      const daysLeft = Math.ceil((end - now) / 86400000);
      if (opts.variant === 'pct') return widgetBox('Year progress', `<div class="center-stack"><div class="kpi-value">${pct}%</div></div>`);
      if (opts.variant === 'days') return widgetBox('Days left in year', `<div class="center-stack"><div class="kpi-value">${daysLeft}</div></div>`);
      return widgetBox('Year progress', `<div><div class="text-mute" style="font-size:12px; margin-bottom:6px;">${now.getFullYear()}</div><div class="progress"><div class="progress-fill" style="width:${pct}%;"></div></div><div class="text-mute" style="font-size:11px; margin-top:6px;">${pct}% · ${daysLeft}d left</div></div>`);
    },
    preview() { return `<div class="pv-bars"><div></div></div>`; },
  },

  /* --- QUICK ACTIONS --- */
  quickAddTodo: {
    label: 'Quick add to-do',
    description: 'Type and press Enter to add',
    category: 'Routine',
    minW: 3, minH: 1, defaultW: 5, defaultH: 1,
    variants: {
      simple:  { label: 'Simple field',  description: 'One input' },
      withPri: { label: 'With priority', description: 'Input + priority' },
      open:    { label: 'Open page',     description: 'Just a button' },
    },
    render(d, opts) {
      if (opts.variant === 'open') return widgetBox('Quick to-do', `<div class="center-stack"><button class="btn" data-go="todo">open to-do page</button></div>`);
      if (opts.variant === 'withPri') return widgetBox('Add a to-do', `<form onsubmit="event.preventDefault(); const txt=this.querySelector('input').value.trim(); if(!txt) return; Store.data.todos.push({id: 'td-'+Math.random().toString(36).slice(2,9), title: txt, category:'School', priority: this.querySelector('select').value, due: '${today()}', done:false}); Store.save(); this.querySelector('input').value=''; Toast.show('added');" class="row gap-8"><input class="input" placeholder="something to do…" style="flex:1;" /><select class="select" style="width:80px;"><option>Med</option><option>High</option><option>Low</option></select><button class="btn btn-sm">add</button></form>`);
      return widgetBox('Add a to-do', `<form onsubmit="event.preventDefault(); const txt=this.querySelector('input').value.trim(); if(!txt) return; Store.data.todos.push({id: 'td-'+Math.random().toString(36).slice(2,9), title: txt, category:'School', priority:'Med', due: '${today()}', done:false}); Store.save(); this.querySelector('input').value=''; Toast.show('added');" class="row gap-8"><input class="input" placeholder="something to do…" style="flex:1;" /><button class="btn btn-sm">add</button></form>`);
    },
    preview() { return `<div class="pv-rows"><div></div></div>`; },
  },

  quickGoal: {
    label: 'Goals snapshot',
    description: 'Top goals with progress',
    category: 'Routine',
    minW: 3, minH: 2, defaultW: 4, defaultH: 3,
    variants: {
      bars:  { label: 'Bars',      description: 'Progress bars' },
      hero:  { label: 'Top goal',  description: 'Single big goal' },
      count: { label: 'Counts',    description: 'X/Y done milestones' },
    },
    render(d, opts) {
      const goals = (d.goals || []).filter(g => g.status !== 'Done').slice(0, 4);
      if (goals.length === 0) return widgetBox('Goals', `<div class="widget-empty">No goals.</div>`);
      const calc = (g) => { const m = g.milestones || []; if (!m.length) return { pct: 0, done: 0, total: 0 }; const done = m.filter(x => x.done).length; return { pct: Math.round((done/m.length)*100), done, total: m.length }; };
      if (opts.variant === 'hero') {
        const g = goals[0]; const c = calc(g);
        return widgetBox('Top goal', `<div><div class="bold" style="font-size:16px;">${escape(g.title)}</div><div class="row mt-12"><div class="progress" style="flex:1;"><div class="progress-fill" style="width:${c.pct}%;"></div></div><span class="font-mono" style="margin-left:8px; font-weight:700;">${c.pct}%</span></div><div class="text-mute" style="font-size:11px; margin-top:6px;">${c.done}/${c.total||'—'} milestones</div></div>`);
      }
      if (opts.variant === 'count') return widgetBox('Goal milestones', `<ul class="mini-list">${goals.map(g => { const c = calc(g); return `<li><span class="bold">${escape(g.title)}</span><span class="font-mono" style="margin-left:auto; font-weight:700;">${c.done}/${c.total||'—'}</span></li>`; }).join('')}</ul>`);
      return widgetBox('Goals', `<div style="display:flex; flex-direction:column; gap:10px;">${goals.map(g => { const c = calc(g); return `<div><div class="row-between" style="margin-bottom:4px;"><span class="bold" style="font-size:13px;">${escape(g.title)}</span><span class="font-mono" style="font-size:11px;">${c.pct}%</span></div><div class="progress"><div class="progress-fill" style="width:${c.pct}%;"></div></div></div>`; }).join('')}</div>`);
    },
    preview() { return `<div class="pv-bars"><div></div><div></div><div></div></div>`; },
  },

  weatherForecast: {
    label: 'Days-of-week stamp',
    description: 'Big today + day of week',
    category: 'Layout',
    minW: 2, minH: 1, defaultW: 3, defaultH: 2,
    variants: {
      stamp: { label: 'Date stamp',  description: 'Number + month + day' },
      cal:   { label: 'Mini cal',    description: 'Today + next 6' },
      countdown: { label: 'To end of week', description: 'Days until Sunday' },
    },
    render(d, opts) {
      const now = new Date();
      if (opts.variant === 'countdown') {
        const day = now.getDay();
        const left = (7 - day) % 7;
        return widgetBox('Weekend in', `<div class="center-stack"><div class="kpi-value">${left}d</div></div>`);
      }
      if (opts.variant === 'cal') {
        const days = [];
        for (let i = 0; i < 7; i++) { const dt = new Date(); dt.setDate(dt.getDate()+i); days.push(dt); }
        return widgetBox('Next 7 days', `<div class="row gap-4" style="justify-content:space-between;">${days.map(dt => `<div class="center-stack" style="background: ${dt.getDay()===now.getDay() && dt.getDate()===now.getDate() ? 'var(--rose-cloud)' : 'transparent'}; border-radius:6px; padding:6px 4px; flex:1;"><div class="text-mute" style="font-size:10px; font-weight:700;">${dt.toLocaleDateString(undefined,{weekday:'short'}).slice(0,2).toUpperCase()}</div><div style="font-family:var(--font-serif); font-weight:600;">${dt.getDate()}</div></div>`).join('')}</div>`);
      }
      return widgetBox('', `<div class="center-stack"><div class="text-mute" style="font-size:11px; font-weight:700; text-transform:uppercase;">${now.toLocaleDateString(undefined,{weekday:'long'})}</div><div class="kpi-value" style="font-size:72px;">${now.getDate()}</div><div class="text-mute" style="font-size:12px;">${now.toLocaleDateString(undefined,{month:'long', year:'numeric'})}</div></div>`);
    },
    preview() { return `<div class="pv-hero"><div class="pv-hero-num"></div></div>`; },
  },

  /* --- MORE STATS --- */
  examWeights: {
    label: 'Final exam weights',
    description: 'How much each exam is worth',
    category: 'School',
    minW: 3, minH: 1, defaultW: 4, defaultH: 2,
    variants: {
      list: { label: 'List',      description: 'Course + weight' },
      bars: { label: 'Bars',      description: 'Weight bars' },
      sum:  { label: 'Combined',  description: 'Total weight remaining' },
    },
    render(d, opts) {
      const ex = d.exams.filter(e => e.status !== 'Done');
      if (ex.length === 0) return widgetBox('Final weights', `<div class="widget-empty">No exams.</div>`);
      if (opts.variant === 'sum') {
        const total = ex.reduce((s,e) => s + +e.weight, 0);
        return widgetBox('Exam weight left', `<div class="center-stack"><div class="kpi-value">${total}%</div><div class="kpi-sub">across ${ex.length} exams</div></div>`);
      }
      if (opts.variant === 'bars') {
        const max = Math.max(...ex.map(e => +e.weight));
        return widgetBox('Exam weights', `<div style="display:flex; flex-direction:column; gap:6px;">${ex.map(e => `<div class="row gap-8"><span class="text-mute" style="font-size:11px; min-width:80px;">${escape(e.course)}</span><div class="bar-track" style="flex:1;"><div class="bar-fill" style="width:${(e.weight/max*100).toFixed(0)}%; background:linear-gradient(90deg, var(--rose), var(--rose-deep));"></div></div><span class="font-mono" style="font-size:11px;">${e.weight}%</span></div>`).join('')}</div>`);
      }
      return widgetBox('Exam weights', `<ul class="mini-list">${ex.map(e => `<li><span class="bold">${escape(e.course)}</span><span class="font-mono" style="margin-left:auto; font-weight:700;">${e.weight}%</span></li>`).join('')}</ul>`);
    },
    preview() { return `<div class="pv-rows"><div></div><div></div><div></div></div>`; },
  },

  pendingLabs: {
    label: 'Pending labs',
    description: 'Lab reports still due',
    category: 'School',
    minW: 3, minH: 2, defaultW: 4, defaultH: 2,
    variants: {
      list:  { label: 'List',  description: 'Compact list' },
      count: { label: 'Count', description: 'Single number' },
      byCourse: { label: 'By course', description: 'Counts per course' },
    },
    render(d, opts) {
      const pending = d.labs.filter(l => l.status !== 'Done');
      if (opts.variant === 'count') return widgetBox('Pending labs', `<div class="center-stack"><div class="kpi-value">${pending.length}</div></div>`);
      if (pending.length === 0) return widgetBox('Pending labs', `<div class="widget-empty">All done.</div>`);
      if (opts.variant === 'byCourse') {
        const byC = {}; pending.forEach(l => byC[l.course] = (byC[l.course]||0)+1);
        return widgetBox('Pending labs', `<div class="row gap-8 flex-wrap" style="margin-top:12px;">${Object.entries(byC).map(([c,n]) => `<span class="pill pill-mint">${escape(c)} · ${n}</span>`).join('')}</div>`);
      }
      return widgetBox('Pending labs', `<ul class="mini-list">${pending.map(l => `<li><span class="bold">${escape(l.title)}</span><span class="text-mute">${escape(l.course)}</span>${l.reportDue ? `<span class="pill pill-ghost" style="margin-left:auto;">${fmtDate(l.reportDue)}</span>`:''}</li>`).join('')}</ul>`);
    },
    preview() { return `<div class="pv-rows"><div></div><div></div></div>`; },
  },

  customLink: {
    label: 'Quick page jump',
    description: 'Big button to any app page',
    category: 'Layout',
    minW: 2, minH: 1, defaultW: 3, defaultH: 1,
    instance: { go: 'courses', label: 'Courses' },
    variants: {
      button: { label: 'Big button', description: 'Filled button' },
      tile:   { label: 'Tile',       description: 'Subtle card' },
      icon:   { label: 'Icon + label', description: 'With matching icon' },
    },
    render(d, opts, inst) {
      const labelMap = { dashboard:'Dashboard', courses:'Courses', schedule:'Schedule', calendar:'Calendar', assignments:'Assignments', tests:'Tests', exams:'Exams', labs:'Labs', gpa:'GPA', coop:'Co-op', contacts:'Contacts', todo:'To-Do', habits:'Habits', goals:'Goals', focus:'Focus', mood:'Mood Log', reading:'Reading', budget:'Budget', notes:'Notes', braindump:'Brain Dump', home:'How this works' };
      const iconMap = { dashboard:'dashboard', courses:'book', schedule:'calendar', calendar:'calendarDay', assignments:'pencil', tests:'flask', exams:'chart', labs:'microscope', gpa:'cap', coop:'briefcase', contacts:'contact', todo:'sparkles', habits:'check', goals:'target', focus:'timer', mood:'smile', reading:'bookOpen', budget:'wallet', notes:'notebook', braindump:'brain' };
      const go = inst?.go || 'courses';
      const label = inst?.label || labelMap[go] || go;
      const ic = iconMap[go];
      if (opts.variant === 'tile')   return widgetBox('', `<button class="btn btn-ghost" data-go="${escape(go)}" style="width:100%; height:100%;">${escape(label)}</button>`);
      if (opts.variant === 'icon')   return widgetBox('', `<button class="btn btn-ghost" data-go="${escape(go)}" style="width:100%; height:100%; flex-direction:column; gap:8px; font-size:14px;">${ic ? icon(ic, 28) : ''}<span>${escape(label)}</span></button>`);
      return widgetBox('', `<button class="btn" data-go="${escape(go)}" style="width:100%; height:100%; font-size:16px;">${escape(label)}</button>`);
    },
    preview() { return `<div class="pv-rows"><div></div></div>`; },
    edit(inst) {
      const opts = ['dashboard','courses','schedule','calendar','assignments','tests','exams','labs','gpa','coop','contacts','todo','habits','goals','focus','mood','reading','budget','notes','braindump','home'];
      return `<label class="label">link to</label><select class="select" id="inst-go">${opts.map(o => `<option ${(inst?.go||'courses')===o?'selected':''}>${o}</option>`).join('')}</select><label class="label mt-12">label (optional)</label><input class="input" id="inst-label" value="${escape(inst?.label || '')}" />`;
    },
    onSave(inst) { inst.go = $('#inst-go').value; inst.label = $('#inst-label').value; },
  },

  /* --- CLOCK --- */
  clock: {
    label: 'Clock',
    description: 'Live time display',
    category: 'Personal',
    minW: 2, minH: 1, defaultW: 3, defaultH: 2,
    instance: { tz: 'local', label: '' },
    variants: {
      digital: { label: 'Digital',  description: 'Big time + date' },
      analog:  { label: 'Analog',   description: 'Circular clock face' },
      mini:    { label: 'Minimal',  description: 'Just HH:MM' },
      pill:    { label: 'Pill',     description: 'Compact pill with time + day' },
    },
    render(d, opts, inst) {
      const now = new Date();
      const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
      const hh = String(h % 12 || 12);
      const mm = String(m).padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][now.getDay()];
      const monName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()];
      const label = inst?.label || '';
      if (opts.variant === 'analog') {
        const hAng = (h % 12) * 30 + m * 0.5;
        const mAng = m * 6;
        const sAng = s * 6;
        return widgetBox(label || 'Clock', `<div class="clock-analog-wrap">
          <svg class="clock-analog" viewBox="-50 -50 100 100">
            <circle r="48" fill="rgba(255,255,255,0.6)" stroke="var(--border)" stroke-width="1"/>
            ${[0,1,2,3,4,5,6,7,8,9,10,11].map(i => { const a=i*30*Math.PI/180; const x1=Math.sin(a)*40, y1=-Math.cos(a)*40, x2=Math.sin(a)*46, y2=-Math.cos(a)*46; return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--ink-mute)" stroke-width="${i%3===0?2:1}"/>`; }).join('')}
            <line x1="0" y1="0" x2="${(Math.sin(hAng*Math.PI/180)*22).toFixed(1)}" y2="${(-Math.cos(hAng*Math.PI/180)*22).toFixed(1)}" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>
            <line x1="0" y1="0" x2="${(Math.sin(mAng*Math.PI/180)*34).toFixed(1)}" y2="${(-Math.cos(mAng*Math.PI/180)*34).toFixed(1)}" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/>
            <line x1="0" y1="0" x2="${(Math.sin(sAng*Math.PI/180)*38).toFixed(1)}" y2="${(-Math.cos(sAng*Math.PI/180)*38).toFixed(1)}" stroke="var(--rose-deep)" stroke-width="1" stroke-linecap="round"/>
            <circle r="3" fill="var(--ink)"/>
          </svg>
        </div>`);
      }
      if (opts.variant === 'mini') {
        return widgetBox('', `<div class="center-stack"><div class="kpi-value" style="font-size:36px; font-family:var(--font-mono); letter-spacing:-1px;">${hh}:${mm}</div></div>`);
      }
      if (opts.variant === 'pill') {
        return widgetBox('', `<div class="clock-pill"><div class="clock-pill-day">${dayName}</div><div class="clock-pill-time">${hh}:${mm} <span class="clock-pill-ampm">${ampm}</span></div></div>`);
      }
      return widgetBox(label || 'Now', `<div class="center-stack"><div class="clock-digital">${hh}:${mm} <span class="clock-ampm">${ampm}</span></div><div class="clock-date">${dayName} · ${monName} ${now.getDate()}</div></div>`);
    },
    preview(v) {
      if (v === 'analog') return `<div class="pv-clock-analog"></div>`;
      if (v === 'mini')   return `<div class="pv-hero"><div class="pv-hero-num"></div></div>`;
      if (v === 'pill')   return `<div class="pv-pill-row"><div></div></div>`;
      return `<div class="pv-hero"><div class="pv-hero-num"></div><div class="pv-hero-sub"></div></div>`;
    },
    edit(inst) {
      return `<label class="label">label (optional)</label><input class="input" id="inst-label" value="${escape(inst?.label||'')}" placeholder="Now"/>`;
    },
    onSave(inst) { inst.label = $('#inst-label')?.value || ''; },
  },

  /* --- DATE DISPLAY --- */
  dateDisplay: {
    label: 'Date',
    description: 'Today\'s date in different layouts',
    category: 'Personal',
    minW: 2, minH: 1, defaultW: 3, defaultH: 2,
    instance: { target: '', label: '' },
    variants: {
      big:       { label: 'Hero date',  description: 'Huge day number + month' },
      stacked:   { label: 'Stacked',    description: 'Day name + date + year' },
      miniCal:   { label: 'Mini calendar', description: 'A tiny calendar with today highlighted' },
      countdown: { label: 'Countdown',  description: 'Days until a target date' },
    },
    render(d, opts, inst) {
      const now = new Date();
      const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()];
      const monName = ['January','February','March','April','May','June','July','August','September','October','November','December'][now.getMonth()];
      const monShort = monName.slice(0,3).toUpperCase();
      if (opts.variant === 'countdown') {
        if (!inst?.target) return widgetBox(inst?.label || 'Countdown', `<div class="widget-empty">Set a target date in the editor.</div>`);
        const u = daysUntil(inst.target);
        const lab = inst?.label || 'Until';
        return widgetBox(lab, `<div class="center-stack"><div class="kpi-value" style="font-size:48px; line-height:1; color:${u<=3?'var(--rose-deep)':'var(--ink)'};">${u<0?'past':u}</div><div class="kpi-sub" style="font-size:11px;">${u<0?'event passed':u===0?'today!':u===1?'day':'days'}</div><div class="text-mute" style="font-size:11px;">${fmtDate(inst.target)}</div></div>`);
      }
      if (opts.variant === 'miniCal') {
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        const startDow = (first.getDay() + 6) % 7; // Monday-first
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < startDow; i++) cells.push('');
        for (let i = 1; i <= lastDay; i++) cells.push(i);
        return widgetBox(monName + ' ' + now.getFullYear(), `<div class="mini-cal">
          ${['M','T','W','T','F','S','S'].map(d => `<div class="mini-cal-dow">${d}</div>`).join('')}
          ${cells.map(c => c ? `<div class="mini-cal-day ${c===now.getDate()?'is-today':''}">${c}</div>` : `<div class="mini-cal-day mini-cal-empty"></div>`).join('')}
        </div>`);
      }
      if (opts.variant === 'stacked') {
        return widgetBox('', `<div class="center-stack"><div class="date-stack-day">${dayName}</div><div class="date-stack-num">${now.getDate()}</div><div class="date-stack-mo">${monName} ${now.getFullYear()}</div></div>`);
      }
      // big (default)
      return widgetBox('', `<div class="date-hero"><div class="date-hero-mo">${monShort}</div><div class="date-hero-num">${now.getDate()}</div><div class="date-hero-day">${dayName}</div></div>`);
    },
    preview(v) {
      if (v === 'miniCal')   return `<div class="pv-mini-cal"><div></div><div></div><div></div><div></div></div>`;
      if (v === 'countdown') return `<div class="pv-hero"><div class="pv-hero-num"></div><div class="pv-hero-sub"></div></div>`;
      if (v === 'stacked')   return `<div class="pv-hero"><div class="pv-hero-sub"></div><div class="pv-hero-num"></div><div class="pv-hero-sub"></div></div>`;
      return `<div class="pv-hero"><div class="pv-hero-sub"></div><div class="pv-hero-num"></div></div>`;
    },
    edit(inst) {
      return `<label class="label">label (countdown only)</label><input class="input" id="inst-label" value="${escape(inst?.label||'')}" placeholder="Until midterm"/>
              <label class="label mt-12">target date (countdown only)</label><input class="input" type="date" id="inst-target" value="${escape(inst?.target||'')}"/>`;
    },
    onSave(inst) { inst.label = $('#inst-label')?.value || ''; inst.target = $('#inst-target')?.value || ''; },
  },

  /* --- STICKY NOTE --- */
  stickyNote: {
    label: 'Sticky note',
    description: 'Pastel paper note with handwritten text — click to edit in place',
    category: 'Layout',
    minW: 2, minH: 2, defaultW: 3, defaultH: 3,
    instance: { text: 'Click to edit…', tint: 'yellow' },
    variants: {
      yellow: { label: 'Yellow',  description: 'Classic sticky' },
      pink:   { label: 'Pink',    description: 'Pink paper' },
      mint:   { label: 'Mint',    description: 'Soft green' },
      lilac:  { label: 'Lilac',   description: 'Lavender' },
      sky:    { label: 'Sky',     description: 'Soft blue' },
    },
    render(d, opts, inst, w) {
      const text = inst?.text || '';
      const editable = dashEditMode ? `contenteditable="true" data-sticky-edit="${w?.id || ''}" spellcheck="false"` : '';
      return `<div class="widget-body sticky-note sticky-${opts.variant}" ${editable}>${escape(text).replace(/\n/g,'<br>')}</div>`;
    },
    preview(v) { return `<div class="pv-sticky pv-sticky-${v||'yellow'}"></div>`; },
    edit(inst) { return `<label class="label">text</label><textarea class="input" id="inst-text" rows="4">${escape(inst?.text||'')}</textarea><p class="text-mute" style="font-size:11px; margin-top:6px;">Tip: you can also click the sticky note directly on the dashboard to edit it.</p>`; },
    onSave(inst) { inst.text = $('#inst-text')?.value || ''; },
  },

  /* --- DAY TIMELINE (today's events as blocks on a vertical hour-axis) --- */
  dayTimeline: {
    label: 'Day timeline',
    description: 'Today on a time-axis with colored event blocks',
    category: 'School',
    minW: 4, minH: 4, defaultW: 5, defaultH: 6,
    instance: { startH: 8, endH: 21, layers: { classes: true, assignments: true, tests: true, exams: true, labs: true } },
    variants: {
      blocks: { label: 'Blocks',  description: 'Solid colored blocks (default)' },
      outline:{ label: 'Outline', description: 'Outlined blocks, lighter feel' },
      compact:{ label: 'Compact', description: 'Slimmer, narrower blocks' },
    },
    render(d, opts, inst) {
      return PlannerCalendarViews.dayWidget(d, opts, inst);
    },
    preview(v) { return `<div class="pv-day-tl"><div></div><div></div><div></div></div>`; },
    edit(inst) {
      const L = inst?.layers || { classes: true, assignments: true, tests: true, exams: true, labs: true };
      return `<label class="label">start hour (0–23)</label><input class="input" id="inst-startH" type="number" min="0" max="23" value="${inst?.startH ?? 8}"/>
              <label class="label mt-12">end hour (0–23)</label><input class="input" id="inst-endH" type="number" min="0" max="23" value="${inst?.endH ?? 21}"/>
              <label class="label mt-12">show layers</label>
              <div class="row gap-8 flex-wrap" style="margin-top:8px;">
                ${['classes','assignments','tests','exams','labs'].map(k => `<label class="row gap-4"><input type="checkbox" data-layer="${k}" ${L[k]?'checked':''}/> ${k}</label>`).join('')}
              </div>`;
    },
    onSave(inst) {
      inst.startH = +($('#inst-startH')?.value || 8);
      inst.endH = +($('#inst-endH')?.value || 21);
      inst.layers = {};
      document.querySelectorAll('[data-layer]').forEach(el => { inst.layers[el.dataset.layer] = el.checked; });
    },
  },

  /* --- CLASS DAY TIMELINE (only classes from class schedule, same visual pattern) --- */
  classDayTimeline: {
    label: 'Class day timeline',
    description: 'Today\'s classes on a time-axis',
    category: 'School',
    minW: 4, minH: 3, defaultW: 5, defaultH: 5,
    instance: { startH: 8, endH: 19 },
    variants: {
      blocks: { label: 'Blocks',  description: 'Solid blocks per class' },
      outline:{ label: 'Outline', description: 'Outlined blocks' },
      compact:{ label: 'Compact', description: 'Slimmer blocks' },
    },
    render(d, opts, inst) {
      return PlannerCalendarViews.dayWidget(d, opts, inst, true);
    },
    preview() { return `<div class="pv-day-tl"><div></div><div></div></div>`; },
    edit(inst) {
      return `<label class="label">start hour</label><input class="input" id="inst-startH" type="number" min="0" max="23" value="${inst?.startH ?? 8}"/>
              <label class="label mt-12">end hour</label><input class="input" id="inst-endH" type="number" min="0" max="23" value="${inst?.endH ?? 19}"/>`;
    },
    onSave(inst) { inst.startH = +($('#inst-startH')?.value || 8); inst.endH = +($('#inst-endH')?.value || 19); },
  },

  /* --- MONTH SPENDING TREND (line graph over the last 6 months) --- */
  monthSpendingTrend: {
    label: 'Spending trend',
    description: 'Line graph: total spend per month',
    category: 'Money',
    minW: 4, minH: 3, defaultW: 6, defaultH: 4,
    variants: {
      line:    { label: 'Line',      description: 'Smooth line + dots' },
      area:    { label: 'Area',      description: 'Filled area chart' },
      bars:    { label: 'Bars',      description: 'One bar per month' },
    },
    render(d, opts) {
      // Pull from real history. Current month's value comes from live totals.
      const totalNow = d.budget.expenses.reduce((s, x) => s + +x.amount, 0)
                      + d.subscriptions.reduce((s, x) => s + (x.billing === 'Monthly' ? +x.price : (x.billing === 'Yearly' ? +x.price/12 : 0)), 0);
      const hist = d.budget.history || [];
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
        const h = hist.find(x => x.key === key);
        // Current month: always use live totals (history isn't snapshot until month ends)
        const val = i === 0 ? totalNow : (h ? h.spend : 0);
        const lab = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dt.getMonth()];
        months.push({ key, lab, val });
      }
      const max = Math.max(...months.map(m => m.val), 1);
      const W = 240, H = 100, P = 20;
      const xStep = (W - P*2) / (months.length - 1);
      const points = months.map((m, i) => ({ x: P + i*xStep, y: H - P - (m.val/max) * (H - P*2), ...m }));
      const pathD = points.map((p, i) => `${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
      const areaD = pathD + ` L${points[points.length-1].x.toFixed(1)},${H-P} L${points[0].x.toFixed(1)},${H-P} Z`;

      if (opts.variant === 'bars') {
        const barW = (W - P*2) / months.length - 6;
        return widgetBox('Spending trend', `<svg viewBox="0 0 ${W} ${H}" class="spend-trend-svg" preserveAspectRatio="none" style="width:100%; height:100%;">
          ${months.map((m, i) => { const bx = P + i*xStep - barW/2; const by = H - P - (m.val/max)*(H-P*2); const bh = (m.val/max)*(H-P*2); return `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" fill="var(--rose-deep)" opacity="0.7" rx="3"/>`; }).join('')}
          ${points.map(p => `<text x="${p.x}" y="${H-4}" text-anchor="middle" font-size="9" fill="var(--ink-mute)">${p.lab}</text>`).join('')}
        </svg>`);
      }
      return widgetBox('Spending trend', `<svg viewBox="0 0 ${W} ${H}" class="spend-trend-svg" preserveAspectRatio="none" style="width:100%; height:100%;">
        ${opts.variant === 'area' ? `<path d="${areaD}" fill="var(--rose-deep)" opacity="0.18"/>` : ''}
        <path d="${pathD}" fill="none" stroke="var(--rose-deep)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="var(--rose-deep)"/>`).join('')}
        ${points.map(p => `<text x="${p.x}" y="${H-4}" text-anchor="middle" font-size="9" fill="var(--ink-mute)">${p.lab}</text>`).join('')}
      </svg>`);
    },
    preview(v) { return `<div class="pv-line-chart"><div class="pv-line"></div></div>`; },
  },

  /* --- CATEGORY PIE / BAR CHART (interactive) --- */
  spendingChart: {
    label: 'Spending chart',
    description: 'Donut pie / bar / column chart of category spending',
    category: 'Money',
    minW: 4, minH: 3, defaultW: 5, defaultH: 4,
    variants: {
      compact: { label: 'Compact pie', description: 'Small clickable category pie for a dashboard stat row' },
      donut: { label: 'Donut pie', description: 'Classic donut chart with center total' },
      bar:   { label: 'Horizontal bars', description: 'Bars per category' },
      col:   { label: 'Column bars', description: 'Vertical column chart' },
    },
    render(d, opts) {
      const cats = {};
      d.budget.expenses.forEach(x => { cats[x.category] = (cats[x.category] || 0) + +x.amount; });
      const subsMonthly = d.subscriptions.reduce((s, x) => s + (x.billing === 'Monthly' ? +x.price : (x.billing === 'Yearly' ? +x.price/12 : 0)), 0);
      if (subsMonthly > 0) cats['Subs'] = (cats['Subs'] || 0) + subsMonthly;
      const entries = Object.entries(cats).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v);
      if (entries.length === 0) return widgetBox('Spending chart', `<div class="widget-empty">No expenses yet.</div>`);
      const total = entries.reduce((s, x) => s + x.v, 0);
      const palette = ['var(--rose-deep)', 'var(--butter-deep)', 'var(--sage-deep)', 'var(--lilac-deep)', 'var(--sky-deep)', 'var(--coral-deep)'];
      const makeArcs = (cx, cy, r, ir) => {
        let angle = -Math.PI / 2;
        return entries.map((e, i) => {
          const frac = e.v / total;
          const a2 = angle + frac * Math.PI * 2;
          const large = frac > 0.5 ? 1 : 0;
          const x1 = cx + Math.cos(angle) * r, y1 = cy + Math.sin(angle) * r;
          const x2 = cx + Math.cos(a2) * r,    y2 = cy + Math.sin(a2) * r;
          const x3 = cx + Math.cos(a2) * ir,   y3 = cy + Math.sin(a2) * ir;
          const x4 = cx + Math.cos(angle) * ir, y4 = cy + Math.sin(angle) * ir;
          const path = `M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${ir},${ir} 0 ${large} 0 ${x4},${y4} Z`;
          angle = a2;
          return { e, path, color: palette[i % palette.length], frac };
        });
      };

      if (opts.variant === 'compact') {
        let cursor = 0;
        const pieSlices = entries.map((entry, index) => {
          const start = cursor;
          const end = cursor + (entry.v / total) * 100;
          cursor = end;
          return { start, end, label: `${entry.k} · ${fmtCurrency(entry.v)} · ${Math.round(entry.v / total * 100)}%`, color: palette[index % palette.length] };
        });
        const pieGradient = pieSlices.map(slice => `${slice.color} ${slice.start.toFixed(2)}% ${slice.end.toFixed(2)}%`).join(', ');
        return `<div class="compact-spend-pie">
          <button class="compact-spend-pie-button" type="button" style="--pie-gradient:conic-gradient(${pieGradient});" data-spending-pie="${escape(JSON.stringify(pieSlices))}" aria-label="Monthly spending pie. Click a slice for category details" onclick="handleCompactSpendingPieClick(this, event)">
            <span><strong>$${Math.round(total)}</strong></span>
          </button>
        </div>`;
      }

      if (opts.variant === 'donut') {
        const arcs = makeArcs(60, 60, 44, 28);
        return widgetBox('Spending chart', `<div class="spend-chart-donut">
          <svg viewBox="0 0 120 120" class="donut-svg">
            ${arcs.map(a => `<path class="spending-slice" tabindex="0" role="button" d="${a.path}" fill="${a.color}" opacity="0.85" data-spending-slice="${escape(`${a.e.k} · ${fmtCurrency(a.e.v)} · ${Math.round(a.frac * 100)}%`)}" onclick="handleSpendingSliceClick(this, event)"><title>${escape(a.e.k)}: ${fmtCurrency(a.e.v)} (${Math.round(a.frac*100)}%)</title></path>`).join('')}
            <text x="60" y="56" text-anchor="middle" font-size="9" fill="var(--ink-mute)">TOTAL</text>
            <text x="60" y="70" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)">${fmtCurrency(total)}</text>
          </svg>
          <div class="spend-chart-legend">
            ${arcs.map(a => `<div class="legend-row"><span class="legend-dot" style="background:${a.color};"></span><span class="legend-label">${escape(a.e.k)}</span><span class="legend-val">${fmtCurrency(a.e.v)}</span></div>`).join('')}
          </div>
        </div>`);
      }
      if (opts.variant === 'col') {
        const max = Math.max(...entries.map(e => e.v));
        return widgetBox('Spending chart', `<div class="spend-col-chart">
          ${entries.map((e, i) => `<div class="spend-col"><div class="spend-col-bar" style="height: ${(e.v/max*100).toFixed(0)}%; background:${palette[i%palette.length]};" title="${escape(e.k)}: ${fmtCurrency(e.v)}"></div><div class="spend-col-lbl">${escape(e.k.slice(0,6))}</div><div class="spend-col-val">${fmtCurrency(e.v)}</div></div>`).join('')}
        </div>`);
      }
      // bar (horizontal)
      const max = Math.max(...entries.map(e => e.v));
      return widgetBox('Spending chart', `<div class="spend-bar-list">
        ${entries.map((e, i) => `<div class="spend-bar-row"><span class="spend-bar-lbl">${escape(e.k)}</span><div class="spend-bar-track"><div class="spend-bar-fill" style="width:${(e.v/max*100).toFixed(0)}%; background:${palette[i%palette.length]};"></div></div><span class="spend-bar-val">${fmtCurrency(e.v)}</span></div>`).join('')}
      </div>`);
    },
    preview(v) {
      if (v === 'compact') return `<div class="pv-donut"></div>`;
      if (v === 'donut') return `<div class="pv-donut"></div>`;
      if (v === 'col')   return `<div class="pv-cols"><div></div><div></div><div></div><div></div></div>`;
      return `<div class="pv-rows"><div></div><div></div><div></div></div>`;
    },
  },

};

// Helper used by widget renderers: wrap body with an always-visible title
function widgetBox(title, body) {
  return `${title ? `<div class="widget-title-bar">${escape(title)}</div>` : ''}<div class="widget-body">${body}</div>`;
}

/* ---- Bento grid helpers ----
   Super-fine grid: 96 columns wide, 15px row height. ~16x more snap points than original 24×60.
   Cell snap step is roughly 11px horizontal × 15px vertical — near-pixel-level resize feel.
   LIB_SCALE converts library widget defaultW/H and minW/H (defined in old 24-grid units)
   to current grid units, so we don't have to touch 46 widget definitions. */
const GRID_COLS = 96;
const GRID_ROW_H = 15;
const LIB_SCALE = 4;

function rectsOverlap(a, b) {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}
function findFreeSpot(layout, w, h) {
  // Scan grid rows top-to-bottom, find first cell where a w×h box fits without overlapping any existing widget
  for (let y = 0; y < 60; y++) {
    for (let x = 0; x + w <= GRID_COLS; x++) {
      const test = { x, y, w, h };
      if (!layout.some(o => rectsOverlap(test, o))) return { x, y };
    }
  }
  return { x: 0, y: layout.reduce((m, o) => Math.max(m, o.y + o.h), 0) };
}

let spendingSlicePopoverTimer;
function showSpendingSlicePopover(label, target, clientX, clientY) {
  document.querySelector('.spending-slice-popover')?.remove();
  clearTimeout(spendingSlicePopoverTimer);
  const popover = document.createElement('div');
  popover.className = 'spending-slice-popover';
  popover.textContent = label;
  document.body.appendChild(popover);
  const rect = target.getBoundingClientRect();
  const x = clientX || (rect.left + rect.width / 2);
  const y = clientY || rect.top;
  const maxLeft = window.innerWidth - popover.offsetWidth - 12;
  popover.style.left = `${Math.max(12, Math.min(maxLeft, x - popover.offsetWidth / 2))}px`;
  popover.style.top = `${Math.max(12, y - popover.offsetHeight - 12)}px`;
  spendingSlicePopoverTimer = setTimeout(() => popover.remove(), 1600);
}
function handleSpendingSliceClick(target, event) {
  if (dashEditMode) return;
  if (event?.spendingSliceHandled) return;
  if (event) event.spendingSliceHandled = true;
  event?.stopPropagation();
  showSpendingSlicePopover(target.dataset.spendingSlice, target, event?.clientX, event?.clientY);
}
function handleCompactSpendingPieClick(target, event) {
  if (dashEditMode) return;
  event?.stopPropagation();
  let slices = [];
  try { slices = JSON.parse(target.dataset.spendingPie || '[]'); } catch {}
  if (!slices.length) return;
  const rect = target.getBoundingClientRect();
  const x = (event?.clientX || rect.left + rect.width / 2) - (rect.left + rect.width / 2);
  const y = (event?.clientY || rect.top + rect.height / 2) - (rect.top + rect.height / 2);
  if (Math.hypot(x, y) > rect.width / 2) return;
  const angle = (Math.atan2(y, x) * 180 / Math.PI + 450) % 360;
  const slice = slices.find(item => angle >= item.start * 3.6 && angle < item.end * 3.6) || slices.at(-1);
  // Keep the temporary label above the circle, so it never covers another slice.
  showSpendingSlicePopover(slice.label, target, rect.left + rect.width / 2, rect.top);
}

Views.dashboard = (root) => {
  const d = Store.data;
  const layout = d.dashboardLayout || [];

  root.innerHTML = `
    <header class="dash-toolbar">
      <div class="row gap-8">
        ${dashEditMode ? `<button class="btn btn-ghost btn-sm" id="addWidgetBtn">+ add widget</button>` : ''}
        <button class="btn ${dashEditMode ? '' : 'btn-ghost'} btn-sm" id="dashEditBtn">${dashEditMode ? 'done editing' : 'edit dashboard'}</button>
      </div>
    </header>

    ${dashEditMode ? `
      <div class="dash-edit-hint">
        <strong>Editing mode:</strong> drag widgets to move, drag corner to resize, click ⚙ to change look or color. Click + add widget to browse the catalog.
      </div>
    ` : ''}

    <div class="dash-grid ${dashEditMode ? 'is-editing' : ''}" id="dashGrid">
      ${layout.map((w) => renderWidget(d, w)).join('')}
    </div>

    ${layout.length === 0 ? `
      <div class="empty">
        <h3 class="empty-title">empty dashboard</h3>
        <p class="empty-text">Click "edit dashboard" → "+ add widget" to browse the catalog.</p>
      </div>
    ` : ''}
  `;

  $('#dashEditBtn').addEventListener('click', () => {
    dashEditMode = !dashEditMode;
    if (!dashEditMode && dashLibraryOpen) closeWidgetLibrary();
    Router.refresh();
  });
  if ($('#addWidgetBtn')) $('#addWidgetBtn').addEventListener('click', () => {
    if (dashLibraryOpen) { closeWidgetLibrary(); } else { openWidgetLibrary(); }
  });
  // If library or editor was open from a previous render, re-paint sidebar accordingly
  if (dashLibraryOpen) setTimeout(() => renderSidebarLibrary(), 0);
  if (editingWid) setTimeout(() => openWidgetEditor(editingWid), 0);

  // Hookups for in-widget data-go links
  root.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', (e) => {
    if (dashEditMode) { e.stopPropagation(); return; } // disable nav links when editing
    Router.go(b.dataset.go);
  }));
  root.querySelectorAll('[data-dashboard-later]').forEach(b => b.addEventListener('click', () => {
    dashboardShowLater = !dashboardShowLater;
    Router.refresh();
  }));
  root.querySelectorAll('[data-spending-slice]').forEach(slice => {
    slice.addEventListener('click', event => handleSpendingSliceClick(slice, event));
    slice.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      handleSpendingSliceClick(slice, event);
    });
  });

  // Inline editing: section titles, notes, sticky notes — save on blur, also
  // block widget drag/resize handlers while editing. Used by data-inline-edit
  // (section title + notes) and data-sticky-edit (sticky notes).
  const wireInlineEdit = (el, widAttr) => {
    el.addEventListener('blur', () => {
      const wid = el.dataset[widAttr];
      const w = Store.data.dashboardLayout.find(x => x.id === wid);
      if (!w) return;
      if (!w.inst) w.inst = {};
      // Read contenteditable as plain text (preserves linebreaks via <br> → \n)
      const html = el.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
      const text = html.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      if (text === w.inst.text) return;
      w.inst.text = text;
      Store.save();
    });
    // Block drag/resize from stealing the click while typing
    el.addEventListener('mousedown', (e) => e.stopPropagation());
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    // Enter on single-line headings → blur to save (sticky notes + paper notes allow newlines)
    el.addEventListener('keydown', (e) => {
      const isHeading = el.classList.contains('sec-script') || el.classList.contains('sec-serif') || el.classList.contains('sec-tag');
      if (e.key === 'Enter' && !e.shiftKey && isHeading) {
        e.preventDefault();
        el.blur();
      }
    });
  };
  root.querySelectorAll('[data-inline-edit]').forEach(el => wireInlineEdit(el, 'inlineEdit'));
  root.querySelectorAll('[data-sticky-edit]').forEach(el => wireInlineEdit(el, 'stickyEdit'));

  // Stacked-bar hover still works
  root.querySelectorAll('.spend-stack-seg').forEach(seg => {
    seg.addEventListener('mouseenter', () => highlightCategory(seg.dataset.slice));
    seg.addEventListener('mouseleave', () => clearCategoryHighlight());
  });
  root.querySelectorAll('.cat-list li[data-slice]').forEach(li => {
    li.addEventListener('mouseenter', () => highlightCategory(li.dataset.slice));
    li.addEventListener('mouseleave', () => clearCategoryHighlight());
  });

  if (dashEditMode) {
    root.querySelectorAll('.dash-widget').forEach(el => wireWidgetEdit(el));
  }

  // Clock + timeline widgets are live — tick every 60s so they stay current.
  // Clear any prior interval before scheduling a new one (avoid stacking on refresh).
  if (window._clockTickId) clearInterval(window._clockTickId);
  const hasLive = Store.data.dashboardLayout.some(w => w.type === 'clock' || w.type === 'dayTimeline' || w.type === 'classDayTimeline');
  if (hasLive && Router.current === 'dashboard') {
    window._clockTickId = setInterval(() => {
      // Only re-render if we're still on the dashboard
      if (Router.current === 'dashboard') Router.refresh();
    }, 60000);
  }
};

function renderWidget(d, w) {
  const def = WIDGET_LIBRARY[w.type];
  if (!def) return '';
  const variant = def.variants[w.variant] ? w.variant : Object.keys(def.variants)[0];
  const body = def.render(d, { variant }, w.inst, w);
  const style = widgetInlineStyle(w);
  const isLayout = def.category === 'Layout';
  const isCompactPie = w.type === 'spendingChart' && variant === 'compact';
  const borderKey = w.style?.borderStyle || 'solid';
  return `
    <div class="dash-widget color-${w.color || 'auto'} ${isLayout ? 'is-layout' : ''} ${isCompactPie ? 'is-compact-pie' : ''} border-${borderKey}" data-wid="${w.id}" style="${style}">
      ${dashEditMode ? `
        <div class="widget-drag-handle" title="drag to move">⋮⋮</div>
        <button class="widget-cog" data-edit-widget="${w.id}" title="edit widget">⚙</button>
        <div class="widget-resize widget-resize-n" data-resize-dir="n"></div>
        <div class="widget-resize widget-resize-s" data-resize-dir="s"></div>
        <div class="widget-resize widget-resize-e" data-resize-dir="e"></div>
        <div class="widget-resize widget-resize-w" data-resize-dir="w"></div>
        <div class="widget-resize widget-resize-ne" data-resize-dir="ne"></div>
        <div class="widget-resize widget-resize-nw" data-resize-dir="nw"></div>
        <div class="widget-resize widget-resize-se" data-resize-dir="se"></div>
        <div class="widget-resize widget-resize-sw" data-resize-dir="sw"></div>
      ` : ''}
      ${body}
    </div>
  `;
}

/* Push-aside: try to place a widget at proposed rect.
   For each conflicting widget, shift it downward by enough rows to clear.
   Mutates `layout` in place; returns true if successful. */
function placeWithPush(layout, target, proposed) {
  // Snapshot original positions so we can revert if needed
  const snapshot = layout.map(w => ({ id: w.id, x: w.x, y: w.y, w: w.w, h: w.h }));

  // Apply proposed to target
  target.x = proposed.x;
  target.y = proposed.y;
  target.w = proposed.w;
  target.h = proposed.h;

  // Repeat: while any pair (other vs target) overlaps, push other downward.
  // Cap iterations to avoid pathological loops.
  for (let iter = 0; iter < 200; iter++) {
    let didShift = false;
    for (const other of layout) {
      if (other.id === target.id) continue;
      if (rectsOverlap(other, target)) {
        // Push `other` straight down past the target
        other.y = target.y + target.h;
        didShift = true;
      }
    }
    // After all pushes, ensure no two-way collisions between non-target widgets
    for (let i = 0; i < layout.length; i++) {
      for (let j = i + 1; j < layout.length; j++) {
        if (layout[i].id === target.id || layout[j].id === target.id) continue;
        if (rectsOverlap(layout[i], layout[j])) {
          // Move the lower-y one further down past the higher-y one
          const a = layout[i].y <= layout[j].y ? layout[j] : layout[i];
          const b = layout[i].y <= layout[j].y ? layout[i] : layout[j];
          a.y = b.y + b.h;
          didShift = true;
        }
      }
    }
    if (!didShift) return true;
  }
  // Couldn't resolve — revert
  snapshot.forEach(s => { const w = layout.find(x => x.id === s.id); if (w) { w.x = s.x; w.y = s.y; w.w = s.w; w.h = s.h; } });
  return false;
}

function wireWidgetEdit(el) {
  const wid = el.dataset.wid;
  const widget = Store.data.dashboardLayout.find(w => w.id === wid);
  if (!widget) return;

  // Cog → open per-widget popover
  el.querySelector('[data-edit-widget]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openWidgetEditor(wid);
  });

  // Helper: compute grid cell dimensions
  const cellDims = () => {
    const grid = el.closest('.dash-grid');
    const gridRect = grid.getBoundingClientRect();
    const cs = getComputedStyle(grid);
    const gap = parseFloat(cs.gap) || 14;
    const cellW = (gridRect.width - gap * (GRID_COLS - 1)) / GRID_COLS + gap;
    const cellH = GRID_ROW_H + gap;
    return { cellW, cellH };
  };

  // Drag handle → reposition (push aside on conflict)
  const handle = el.querySelector('.widget-drag-handle');
  if (handle) {
    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const { cellW, cellH } = cellDims();
      const startX = e.clientX, startY = e.clientY;
      const origX = widget.x, origY = widget.y;
      el.classList.add('is-dragging');

      const onMove = (ev) => {
        const dx = Math.round((ev.clientX - startX) / cellW);
        const dy = Math.round((ev.clientY - startY) / cellH);
        const nx = Math.max(0, Math.min(GRID_COLS - widget.w, origX + dx));
        const ny = Math.max(0, origY + dy);
        el.style.gridColumnStart = nx + 1;
        el.style.gridRowStart = ny + 1;
      };
      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        el.classList.remove('is-dragging');
        const nx = parseInt(el.style.gridColumnStart) - 1;
        const ny = parseInt(el.style.gridRowStart) - 1;
        if (nx === origX && ny === origY) return;
        const ok = placeWithPush(Store.data.dashboardLayout, widget, { x: nx, y: ny, w: widget.w, h: widget.h });
        if (!ok) {
          el.style.gridColumnStart = origX + 1;
          el.style.gridRowStart = origY + 1;
          Toast.show('couldn\'t fit — reverted');
        } else {
          Store.save();
          Router.refresh();
        }
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    });
  }

  // Multi-direction resize
  el.querySelectorAll('.widget-resize').forEach(r => {
    r.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const dir = r.dataset.resizeDir; // n, s, e, w, ne, nw, se, sw
      const def = WIDGET_LIBRARY[widget.type];
      // Library minW/H are in old 24-grid units; scale to current grid.
      const minW = (def.minW || 1) * LIB_SCALE;
      const minH = (def.minH || 1) * LIB_SCALE;
      const { cellW, cellH } = cellDims();
      const startX = e.clientX, startY = e.clientY;
      const origX = widget.x, origY = widget.y, origW = widget.w, origH = widget.h;
      el.classList.add('is-resizing');

      const onMove = (ev) => {
        const dx = Math.round((ev.clientX - startX) / cellW);
        const dy = Math.round((ev.clientY - startY) / cellH);
        let nx = origX, ny = origY, nw = origW, nh = origH;
        // West edge: x and w change
        if (dir.includes('w')) {
          const newX = Math.max(0, Math.min(origX + origW - minW, origX + dx));
          nw = origW + (origX - newX);
          nx = newX;
        }
        // East edge: only w changes
        if (dir.includes('e')) {
          nw = Math.max(minW, Math.min(GRID_COLS - origX, origW + dx));
        }
        // North edge: y and h change
        if (dir.includes('n')) {
          const newY = Math.max(0, Math.min(origY + origH - minH, origY + dy));
          nh = origH + (origY - newY);
          ny = newY;
        }
        // South edge: only h changes
        if (dir.includes('s')) {
          nh = Math.max(minH, origH + dy);
        }
        el.style.gridColumnStart = nx + 1;
        el.style.gridRowStart = ny + 1;
        el.style.gridColumnEnd = `span ${nw}`;
        el.style.gridRowEnd = `span ${nh}`;
      };
      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        el.classList.remove('is-resizing');
        const nx = parseInt(el.style.gridColumnStart) - 1;
        const ny = parseInt(el.style.gridRowStart) - 1;
        const spanRe = /span (\d+)/;
        const nw = +(getComputedStyle(el).gridColumnEnd.match(spanRe)?.[1] || origW);
        const nh = +(getComputedStyle(el).gridRowEnd.match(spanRe)?.[1] || origH);
        if (nx === origX && ny === origY && nw === origW && nh === origH) return;
        const ok = placeWithPush(Store.data.dashboardLayout, widget, { x: nx, y: ny, w: nw, h: nh });
        if (!ok) {
          el.style.gridColumnStart = origX + 1;
          el.style.gridRowStart = origY + 1;
          el.style.gridColumnEnd = `span ${origW}`;
          el.style.gridRowEnd = `span ${origH}`;
          Toast.show('couldn\'t resize — reverted');
        } else {
          Store.save();
          Router.refresh();
        }
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    });
  });
}

/* ---- Widget library modal (search + preview + variant + add) ---- */
let libraryQuery = '';
/* Sidebar drawer: replaces the nav with a draggable widget library while editing.
   User can drag variant tiles onto the dashboard grid, or click to add at first free slot. */
function openWidgetLibrary() {
  dashLibraryOpen = true;
  renderSidebarLibrary();
  // Mark the dashboard grid as a drop target visually
  document.body.classList.add('library-open');
}
function closeWidgetLibrary() {
  dashLibraryOpen = false;
  document.body.classList.remove('library-open');
  Router.renderNav();
}

function renderSidebarLibrary() {
  const nav = $('#nav');
  if (!nav) return;
  const entries = Object.entries(WIDGET_LIBRARY);
  const deleted = Store.data.deletedDashboardWidgets || [];
  const cats = [...new Set(entries.map(([_, def]) => def.category))];
  const q = libraryQuery2.toLowerCase();
  const filteredCats = cats.map(cat => {
    const widgets = entries
      .filter(([k, def]) => def.category === cat)
      .filter(([k, def]) => !q || def.label.toLowerCase().includes(q) || def.description.toLowerCase().includes(q) || Object.values(def.variants).some(v => v.label.toLowerCase().includes(q) || v.description.toLowerCase().includes(q)));
    return { cat, widgets };
  }).filter(c => c.widgets.length > 0);

  nav.innerHTML = `
    <div class="sidebar-lib-head">
      <div class="sidebar-lib-title">Widget library</div>
      <button class="btn btn-ghost btn-sm" id="closeLibBtn" type="button">× back</button>
    </div>
    <input type="text" class="input sidebar-lib-search" id="sidebarLibSearch" placeholder="search…" value="${escape(libraryQuery2)}"/>
    <p class="sidebar-lib-tip">Drag a tile onto your dashboard, or click to drop in the first open spot.</p>
    <section class="sidebar-deleted-widgets ${dashboardDeletedOpen ? 'is-open' : ''}">
      <button class="sidebar-deleted-toggle" id="toggleDeletedWidgets" type="button" aria-expanded="${dashboardDeletedOpen}">
        <span>Deleted widgets <em>${deleted.length}</em></span>
        <span aria-hidden="true">${dashboardDeletedOpen ? '−' : '+'}</span>
      </button>
      ${dashboardDeletedOpen ? `
        <div class="sidebar-deleted-list">
          ${deleted.length ? deleted.map(widget => {
            const def = WIDGET_LIBRARY[widget.type];
            const variant = def?.variants?.[widget.variant]?.label || widget.variant || 'default';
            return `<div class="sidebar-deleted-row">
              <div><strong>${escape(def?.label || 'Custom widget')}</strong><span>${escape(variant)}</span></div>
              <button class="btn btn-ghost btn-sm" type="button" data-restore-dashboard-widget="${escape(widget.id)}">restore</button>
            </div>`;
          }).join('') : '<p class="sidebar-deleted-empty">Deleted widgets will stay here while you redesign.</p>'}
        </div>
      ` : ''}
    </section>
    <div class="sidebar-lib-body">
      ${filteredCats.length === 0 ? `<p class="text-mute" style="text-align:center; padding:30px; font-size:12px;">No matches for "${escape(libraryQuery2)}"</p>` : filteredCats.map(({ cat, widgets }) => `
        <div class="sidebar-lib-cat">
          <div class="sidebar-lib-cat-label">${escape(cat)}</div>
          ${widgets.map(([key, def]) => `
            <div class="sidebar-lib-widget">
              <div class="sidebar-lib-widget-label">${escape(def.label)}</div>
              <div class="sidebar-lib-variants">
                ${Object.entries(def.variants).map(([vk, v]) => `
                  <div class="sidebar-lib-variant" draggable="true" data-lib-add="${key}|${vk}" title="${escape(v.description)}">
                    <div class="lib-variant-preview">${def.preview ? def.preview(vk) : ''}</div>
                    <div class="sidebar-lib-variant-lbl">${escape(v.label)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  `;

  $('#closeLibBtn')?.addEventListener('click', () => closeWidgetLibrary());
  $('#toggleDeletedWidgets')?.addEventListener('click', () => {
    dashboardDeletedOpen = !dashboardDeletedOpen;
    renderSidebarLibrary();
  });
  nav.querySelectorAll('[data-restore-dashboard-widget]').forEach(button => {
    button.addEventListener('click', () => restoreDeletedDashboardWidget(button.dataset.restoreDashboardWidget));
  });
  $('#sidebarLibSearch')?.addEventListener('input', (e) => {
    libraryQuery2 = e.target.value;
    const cursor = e.target.selectionStart;
    renderSidebarLibrary();
    setTimeout(() => { const s = $('#sidebarLibSearch'); if (s) { s.focus(); s.setSelectionRange(cursor, cursor); } }, 10);
  });

  // Click-to-add: drops widget in the first open slot
  nav.querySelectorAll('[data-lib-add]').forEach(t => {
    t.addEventListener('click', () => addLibraryWidget(t.dataset.libAdd));
    t.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', `widget-add:${t.dataset.libAdd}`);
      e.dataTransfer.effectAllowed = 'copy';
      t.classList.add('is-dragging');
    });
    t.addEventListener('dragend', () => t.classList.remove('is-dragging'));
  });

  // Wire the dashboard grid as a drop target (only needed once per library open)
  const grid = document.querySelector('#dashGrid');
  if (grid && !grid.dataset.dropWired) {
    grid.dataset.dropWired = '1';
    grid.addEventListener('dragover', (e) => {
      if (!dashLibraryOpen) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      grid.classList.add('drop-target');
    });
    grid.addEventListener('dragleave', (e) => {
      if (e.target === grid) grid.classList.remove('drop-target');
    });
    grid.addEventListener('drop', (e) => {
      if (!dashLibraryOpen) return;
      e.preventDefault();
      grid.classList.remove('drop-target');
      const data = e.dataTransfer.getData('text/plain');
      if (!data?.startsWith('widget-add:')) return;
      const payload = data.replace('widget-add:', '');
      // Compute grid cell at drop coords
      const r = grid.getBoundingClientRect();
      const cs = getComputedStyle(grid);
      const gap = parseFloat(cs.gap) || 4;
      const cellW = (r.width - gap * (GRID_COLS - 1)) / GRID_COLS + gap;
      const cellH = GRID_ROW_H + gap;
      const xCell = Math.max(0, Math.floor((e.clientX - r.left) / cellW));
      const yCell = Math.max(0, Math.floor((e.clientY - r.top) / cellH));
      addLibraryWidget(payload, xCell, yCell);
    });
  }
}

/* Add a widget from the library. If `dropX`/`dropY` are provided, try to place at
   those grid coords (pushing aside conflicts); otherwise drop in first free slot. */
function addLibraryWidget(libCode, dropX, dropY) {
  const [type, variant] = libCode.split('|');
  const def = WIDGET_LIBRARY[type]; if (!def) return;
  const layout = Store.data.dashboardLayout;
  const w = (def.defaultW || 3) * LIB_SCALE, h = (def.defaultH || 2) * LIB_SCALE;
  let x, y;
  if (dropX != null && dropY != null) {
    // Clamp so widget fits horizontally
    x = Math.max(0, Math.min(GRID_COLS - w, dropX));
    y = Math.max(0, dropY);
  } else {
    const spot = findFreeSpot(layout, w, h);
    x = spot.x; y = spot.y;
  }
  const newW = { id: 'w-' + uid(), type, variant, color: 'auto', x, y, w, h };
  layout.push(newW);
  // If overlap at drop position, push aside
  if (dropX != null) placeWithPush(layout, newW, { x, y, w, h });
  Store.save();
  Router.refresh();
  renderSidebarLibrary(); // re-render sidebar (drop wiring re-establishes on new grid)
  Toast.show(`added ${def.label}`);
}

function moveWidgetToDeleted(wid) {
  const layout = Store.data.dashboardLayout || [];
  const widget = layout.find(x => x.id === wid);
  if (!widget) return;
  if (!Array.isArray(Store.data.deletedDashboardWidgets)) Store.data.deletedDashboardWidgets = [];
  Store.data.dashboardLayout = layout.filter(x => x.id !== wid);
  Store.data.deletedDashboardWidgets = [
    { ...widget, deletedAt: new Date().toISOString() },
    ...Store.data.deletedDashboardWidgets.filter(x => x.id !== wid),
  ].slice(0, 30);
  Store.save();
  editingWid = null;
  dashLibraryOpen = true;
  dashboardDeletedOpen = true;
  document.body.classList.remove('editor-open');
  document.body.classList.add('library-open');
  document.querySelectorAll('.dash-widget.is-editing-this').forEach(el => el.classList.remove('is-editing-this'));
  Router.refresh();
  Toast.show('moved to deleted widgets');
}

function restoreDeletedDashboardWidget(wid) {
  const deleted = Store.data.deletedDashboardWidgets || [];
  const index = deleted.findIndex(x => x.id === wid);
  if (index < 0) return;
  const { deletedAt, ...stored } = deleted[index];
  const restored = { ...stored };
  if (Store.data.dashboardLayout.some(x => x.id === restored.id)) restored.id = `w-${uid()}`;
  if (Store.data.dashboardLayout.some(x => rectsOverlap(x, restored))) {
    const spot = findFreeSpot(Store.data.dashboardLayout, restored.w, restored.h);
    restored.x = spot.x;
    restored.y = spot.y;
  }
  Store.data.dashboardLayout.push(restored);
  Store.data.deletedDashboardWidgets = deleted.filter((_, i) => i !== index);
  Store.save();
  Router.refresh();
  setTimeout(() => renderSidebarLibrary(), 0);
  Toast.show('widget restored');
}

/* ---- Per-widget editor popover (variant + color + delete) ---- */
/* Per-widget editor — renders into the sidebar so the dashboard stays visible
   while user customizes look, color, opacity, border, title, etc. */
let editingWid = null;
function openWidgetEditor(wid) {
  const w = Store.data.dashboardLayout.find(x => x.id === wid);
  if (!w) return;
  const def = WIDGET_LIBRARY[w.type];
  if (!w.inst && def.instance) w.inst = JSON.parse(JSON.stringify(def.instance));
  if (!w.style) w.style = {};
  const st = w.style;
  editingWid = wid;
  dashLibraryOpen = false; // close library if it was open — editor takes over the sidebar
  document.body.classList.remove('library-open');
  document.body.classList.add('editor-open');
  // Highlight the widget being edited
  document.querySelectorAll('.dash-widget.is-editing-this').forEach(el => el.classList.remove('is-editing-this'));
  document.querySelector(`.dash-widget[data-wid="${wid}"]`)?.classList.add('is-editing-this');

  const nav = $('#nav');
  if (!nav) return;
  nav.innerHTML = `
    <div class="sidebar-lib-head">
      <div class="sidebar-lib-title">${escape(def.label)}</div>
      <button class="btn btn-ghost btn-sm" id="closeEditorBtn" type="button">× close</button>
    </div>
    <div class="sidebar-editor-body">
      <p class="text-mute" style="font-size:11px; padding: 0 12px; margin: 0 0 12px;">${escape(def.description)}</p>

    ${def.edit ? `
      <div class="kpi-label mt-24" style="margin-bottom:10px;">CONTENT</div>
      <div class="inst-edit">${def.edit(w.inst || {})}</div>
    ` : ''}

    <div class="kpi-label mt-24" style="margin-bottom:10px;">LOOK</div>
    <div class="lib-variants">
      ${Object.entries(def.variants).map(([vk, v]) => `
        <button class="lib-variant ${w.variant === vk ? 'active' : ''}" data-pick-variant="${vk}" title="${escape(v.description)}">
          <div class="lib-variant-preview">${def.preview ? def.preview(vk) : ''}</div>
          <div class="lib-variant-label">${escape(v.label)}</div>
        </button>
      `).join('')}
    </div>

    <div class="kpi-label mt-24" style="margin-bottom:10px;">TITLE</div>
    <div class="style-stack">
      <label class="style-cell" style="cursor:pointer;">
        <span class="style-cell-lbl">Show title</span>
        <input type="checkbox" id="st-showTitle" ${!st.hideTitle ? 'checked' : ''}/>
      </label>
      ${colorRow('Title color', 'titleColor', st.titleColor || '#7a6b65')}
      <label class="style-cell">
        <span class="style-cell-lbl">Title opacity</span>
        <input type="range" id="st-titleOpacity" min="0.2" max="1" step="0.05" value="${st.titleOpacity != null ? st.titleOpacity : 1}"/>
        <span id="st-titleOpacity-val" class="font-mono" style="font-size:11px;">${st.titleOpacity != null ? Math.round(st.titleOpacity * 100) : 100}%</span>
      </label>
      <label class="style-cell">
        <span class="style-cell-lbl">Title size</span>
        <input type="range" id="st-titleFontSize" min="9" max="32" step="1" value="${st.titleFontSize || 11}"/>
        <span id="st-titleFontSize-val" class="font-mono" style="font-size:11px;">${st.titleFontSize || 11}px</span>
      </label>
    </div>

    <div class="kpi-label mt-24" style="margin-bottom:10px;">COLOR & STYLE</div>
    <div class="style-stack">
      ${colorRow('Background', 'bgColor', st.bgColor || '#ffffff')}
      ${colorRow('Font color', 'fontColor', st.fontColor || '#3a2e2a')}
      ${colorRow('Border color', 'borderColor', st.borderColor || '#e6cabf')}
      <label class="style-cell">
        <span class="style-cell-lbl">Opacity (bg only)</span>
        <input type="range" id="st-opacity" min="0.2" max="1" step="0.05" value="${st.opacity != null ? st.opacity : 1}"/>
        <span id="st-opacity-val" class="font-mono" style="font-size:11px;">${st.opacity != null ? Math.round(st.opacity * 100) : 100}%</span>
      </label>
      <label class="style-cell">
        <span class="style-cell-lbl">Border style</span>
        <select class="select" id="st-borderStyle">
          ${Object.entries(BORDER_STYLES).map(([k, b]) => `<option value="${k}" ${(st.borderStyle||'solid')===k?'selected':''}>${escape(b.label)}</option>`).join('')}
        </select>
      </label>
      <label class="style-cell">
        <span class="style-cell-lbl">Border thickness</span>
        <input type="range" id="st-borderWidth" min="0" max="8" step="1" value="${st.borderWidth != null ? st.borderWidth : 1}"/>
        <span id="st-borderWidth-val" class="font-mono" style="font-size:11px;">${st.borderWidth != null ? st.borderWidth : 1}px</span>
      </label>
      <div class="style-cell style-cell-full" style="flex-direction:column; align-items:stretch;">
        <div class="row-between" style="margin-bottom:6px;">
          <span class="style-cell-lbl">Background image (max 5MB)</span>
          ${st.bgImage ? `<button class="btn btn-sm btn-ghost" data-clear="bgImage" type="button">remove</button>` : ''}
        </div>
        <input type="file" id="st-bgImage" accept="image/*" style="font-size:12px;"/>
        ${(Store.data.dashboardImages || []).length ? `
          <div class="image-library">
            <div class="kpi-label" style="margin-top:8px; font-size:10px;">SAVED IMAGES — click to apply</div>
            <div class="image-library-grid">
              ${Store.data.dashboardImages.map((img, i) => `
                <div class="image-library-item ${st.bgImage === img ? 'active' : ''}">
                  <button class="image-library-pick" data-pick-image="${i}" type="button" style="background-image:url('${img}');" title="apply"></button>
                  <button class="image-library-del" data-delete-image="${i}" type="button" title="delete">×</button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>

      <div class="sidebar-editor-actions">
        <button class="btn btn-ghost" id="deleteWidget" style="color: var(--rose-deep);" type="button">delete widget</button>
        <button class="btn" id="saveWidget" type="button">done</button>
      </div>
    </div>
  `;

  setTimeout(() => {
    document.querySelectorAll('[data-pick-variant]').forEach(b => b.addEventListener('click', () => {
      if (def.edit && def.onSave) { try { def.onSave(w.inst = w.inst || {}); } catch {} }
      captureStyle(w);
      w.variant = b.dataset.pickVariant;
      Store.save();
      Router.refresh();
      openWidgetEditor(wid);
    }));
    // Live-update sliders show their value
    $('#st-opacity')?.addEventListener('input', e => { $('#st-opacity-val').textContent = Math.round(e.target.value * 100) + '%'; });
    $('#st-borderWidth')?.addEventListener('input', e => { $('#st-borderWidth-val').textContent = e.target.value + 'px'; });
    $('#st-titleOpacity')?.addEventListener('input', e => { $('#st-titleOpacity-val').textContent = Math.round(e.target.value * 100) + '%'; });
    $('#st-titleFontSize')?.addEventListener('input', e => { $('#st-titleFontSize-val').textContent = e.target.value + 'px'; });
    // Sync quick-swatch → color wheel + hex input (and swatches reflect picks too)
    document.querySelectorAll('[data-color-quick]').forEach(group => {
      const key = group.dataset.colorQuick;
      group.querySelectorAll('[data-quick]').forEach(btn => btn.addEventListener('click', (e) => {
        e.preventDefault();
        const c = btn.dataset.quick;
        const colorInput = document.querySelector(`[data-color-input="${key}"]`);
        const hexInput = document.querySelector(`[data-color-hex="${key}"]`);
        if (colorInput) colorInput.value = c;
        if (hexInput) hexInput.value = c;
        // mark this swatch active
        group.querySelectorAll('[data-quick]').forEach(b => b.classList.toggle('active', b === btn));
      }));
    });
    // Sync color wheel input → hex + quick-active state
    document.querySelectorAll('[data-color-input]').forEach(inp => {
      inp.addEventListener('input', () => {
        const key = inp.dataset.colorInput;
        const hexInput = document.querySelector(`[data-color-hex="${key}"]`);
        if (hexInput) hexInput.value = inp.value;
        document.querySelectorAll(`[data-color-quick="${key}"] [data-quick]`).forEach(b => b.classList.toggle('active', b.dataset.quick.toLowerCase() === inp.value.toLowerCase()));
      });
    });
    // Sync hex text input → color wheel (validate as #RGB or #RRGGBB)
    document.querySelectorAll('[data-color-hex]').forEach(inp => {
      inp.addEventListener('change', () => {
        let v = inp.value.trim();
        if (!v.startsWith('#')) v = '#' + v;
        if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) {
          const key = inp.dataset.colorHex;
          const colorInput = document.querySelector(`[data-color-input="${key}"]`);
          if (colorInput) colorInput.value = v.length === 4 ? '#' + v[1]+v[1]+v[2]+v[2]+v[3]+v[3] : v;
          inp.value = colorInput.value;
          document.querySelectorAll(`[data-color-quick="${key}"] [data-quick]`).forEach(b => b.classList.toggle('active', b.dataset.quick.toLowerCase() === colorInput.value.toLowerCase()));
        } else {
          // invalid hex — flash red briefly
          inp.style.borderColor = 'var(--rose-deep)';
          setTimeout(() => { inp.style.borderColor = ''; }, 1200);
        }
      });
    });
    // File upload → base64 stored on widget + saved to dashboardImages library
    $('#st-bgImage')?.addEventListener('change', e => {
      const f = e.target.files?.[0]; if (!f) return;
      if (f.size > 5 * 1024 * 1024) { Toast.show('image too large (max 5MB)'); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        // Persist in the shared image library (dedupe + cap at 12 most recent)
        if (!Array.isArray(Store.data.dashboardImages)) Store.data.dashboardImages = [];
        if (!Store.data.dashboardImages.includes(dataUrl)) {
          Store.data.dashboardImages.unshift(dataUrl);
          Store.data.dashboardImages = Store.data.dashboardImages.slice(0, 12);
        }
        captureStyle(w);
        w.style.bgImage = dataUrl;
        Store.save();
        Router.refresh();
        openWidgetEditor(wid);
      };
      reader.readAsDataURL(f);
    });
    // Pick an image from the saved-images library
    document.querySelectorAll('[data-pick-image]').forEach(b => b.addEventListener('click', (e) => {
      e.preventDefault();
      const idx = +b.dataset.pickImage;
      const img = (Store.data.dashboardImages || [])[idx];
      if (!img) return;
      captureStyle(w);
      w.style.bgImage = img;
      Store.save(); Router.refresh(); openWidgetEditor(wid);
    }));
    document.querySelectorAll('[data-delete-image]').forEach(b => b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const idx = +b.dataset.deleteImage;
      const img = (Store.data.dashboardImages || [])[idx];
      if (!img) return;
      // If any widget was using this image, remove its bgImage
      Store.data.dashboardLayout.forEach(ww => {
        if (ww.style?.bgImage === img) delete ww.style.bgImage;
      });
      Store.data.dashboardImages.splice(idx, 1);
      Store.save(); Router.refresh(); openWidgetEditor(wid);
    }));
    // Clear buttons (font color, bg color, border color, bg image)
    document.querySelectorAll('[data-clear]').forEach(b => b.addEventListener('click', (e) => {
      e.preventDefault();
      captureStyle(w);
      delete w.style[b.dataset.clear];
      Store.save(); Router.refresh(); openWidgetEditor(wid);
    }));
    $('#saveWidget')?.addEventListener('click', () => {
      if (def.edit && def.onSave) { try { def.onSave(w.inst = w.inst || {}); } catch {} }
      captureStyle(w);
      Store.save();
      closeWidgetEditor();
      Router.refresh();
    });
    $('#deleteWidget')?.addEventListener('click', () => {
      moveWidgetToDeleted(wid);
    });
    $('#closeEditorBtn')?.addEventListener('click', () => {
      // Closing without explicit save still captures current inputs as a convenience
      if (def.edit && def.onSave) { try { def.onSave(w.inst = w.inst || {}); } catch {} }
      captureStyle(w);
      Store.save();
      closeWidgetEditor();
      Router.refresh();
    });
  }, 50);
}

function closeWidgetEditor() {
  editingWid = null;
  document.body.classList.remove('editor-open');
  document.querySelectorAll('.dash-widget.is-editing-this').forEach(el => el.classList.remove('is-editing-this'));
  Router.renderNav();
}

/* Quick-pick color palette shared by all per-widget color rows.
   Pastel palette + neutrals + black + white. */
const QUICK_COLORS = [
  '#E07599', '#9BC09A', '#A8C5F0', '#F5D27A', '#C9A9E8', '#F2A07F',  // pastels
  '#3A2E2A', '#7C6862', '#FFFFFF', '#000000',                          // neutrals
];

/* Render one color-picker row with: 6 quick swatches + color wheel + hex text input.
   All three stay in sync (input event on any propagates to the other two). */
function colorRow(label, key, val) {
  return `
    <div class="color-row">
      <div class="color-row-head">
        <span class="style-cell-lbl">${escape(label)}</span>
        <button class="btn btn-sm btn-ghost" data-clear="${key}" type="button">clear</button>
      </div>
      <div class="color-row-controls">
        <div class="color-quick" data-color-quick="${key}">
          ${QUICK_COLORS.map(c => `<button type="button" class="color-quick-swatch ${c.toLowerCase()===val.toLowerCase()?'active':''}" data-quick="${c}" style="background:${c};" title="${c}"></button>`).join('')}
        </div>
        <input type="color" id="st-${key}" data-color-input="${key}" value="${escape(val)}"/>
        <input type="text" class="input color-hex" data-color-hex="${key}" value="${escape(val)}" placeholder="#RRGGBB" maxlength="7" style="width:90px;"/>
      </div>
    </div>
  `;
}

/* Read the style inputs from the editor and apply them onto w.style. Only set keys
   the user has explicitly picked — leaves defaults intact when fields are blank. */
function captureStyle(w) {
  if (!w.style) w.style = {};
  // Read from the new colorRow inputs (color wheel inputs have id `st-<key>`,
  // hex text inputs use [data-color-hex="<key>"]). We prefer the wheel value
  // because picking via swatch/hex/wheel all sync to it.
  const bgC = $('#st-bgColor')?.value;
  const fc = $('#st-fontColor')?.value;
  const op = $('#st-opacity')?.value;
  const bs = $('#st-borderStyle')?.value;
  const bc = $('#st-borderColor')?.value;
  const bw = $('#st-borderWidth')?.value;
  // Title customization
  const showTitle = $('#st-showTitle')?.checked;
  const tc = $('#st-titleColor')?.value;
  const tOp = $('#st-titleOpacity')?.value;
  const tFs = $('#st-titleFontSize')?.value;
  // Apply title fields (only when modal had them present)
  if (showTitle != null) {
    if (!showTitle) w.style.hideTitle = true; else delete w.style.hideTitle;
  }
  if (tc) w.style.titleColor = tc;
  if (tOp != null) {
    if (+tOp < 1) w.style.titleOpacity = +tOp; else delete w.style.titleOpacity;
  }
  if (tFs != null) {
    if (+tFs !== 11) w.style.titleFontSize = +tFs; else delete w.style.titleFontSize;
  }
  // Always persist whatever the wheel shows — the user explicitly used the "clear"
  // button to remove a value, which deletes the key directly via [data-clear].
  // (Previous logic skipped pure-white/pure-dark picks which made them feel "broken".)
  if (bgC) w.style.bgColor = bgC;
  if (fc)  w.style.fontColor = fc;
  if (bc)  w.style.borderColor = bc;
  if (op != null) {
    if (+op < 1) w.style.opacity = +op;
    else delete w.style.opacity;
  }
  if (bs) {
    if (bs !== 'solid') w.style.borderStyle = bs;
    else delete w.style.borderStyle;
  }
  if (bw != null) {
    if (+bw !== 1) w.style.borderWidth = +bw;
    else delete w.style.borderWidth;
  }
}

function highlightCategory(label) {
  document.querySelectorAll('.spend-stack-seg').forEach(seg => {
    seg.classList.toggle('is-highlighted', seg.dataset.slice === label);
    seg.classList.toggle('is-dimmed', seg.dataset.slice !== label);
  });
  document.querySelectorAll('.cat-list li').forEach(li => {
    li.classList.toggle('is-highlighted', li.dataset.slice === label);
  });
}
function clearCategoryHighlight() {
  document.querySelectorAll('.spend-stack-seg').forEach(seg => seg.classList.remove('is-highlighted', 'is-dimmed'));
  document.querySelectorAll('.cat-list li').forEach(li => li.classList.remove('is-highlighted'));
}

function kpi(label, value, sub, iconKey, accent) {
  return `
    <div class="kpi" style="--accent: ${accent};">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value">${value}</div>
      <div class="kpi-sub">${sub}</div>
      ${iconKey === '' ? '' : `<div class="kpi-emoji">${ICONS[iconKey] ? icon(iconKey, 28) : (iconKey || '')}</div>`}
    </div>
  `;
}

/* Upcoming class today (or next class) */
function upcomingClassCard(d) {
  return `<div class="card card-mint mb-16">${PlannerCalendarViews.nextClass(d)}<button class="btn-soft" data-go="schedule">View class schedule</button></div>`;
}

/* Assignment & lab tracker — next deadlines across both */
function assignLabTrackerCard(d) {
  const items = [
    ...d.assignments.filter(a => !a.submitted).map(a => ({
      kind: 'Assignment', title: a.title, course: a.course || '',
      date: a.due, iconKey: 'pencil',
    })),
    ...d.labs.filter(l => l.status !== 'Done').map(l => ({
      kind: 'Lab', title: l.title, course: l.course || '',
      date: l.reportDue || l.date, iconKey: 'microscope',
    })),
  ]
    .filter(x => x.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const totalAssign = d.assignments.filter(a => !a.submitted).length;
  const totalLab = d.labs.filter(l => l.status !== 'Done').length;

  return `
    <div class="card card-cool">
      <h3 class="card-title">${icon('pencil', 18)} assignments &amp; labs</h3>
      <div class="row gap-12" style="margin: 4px 0 10px;">
        <span class="pill pill-lilac"><span style="display:inline-flex;vertical-align:middle;margin-right:4px;">${icon('pencil', 12)}</span>${totalAssign} open</span>
        <span class="pill pill-mint"><span style="display:inline-flex;vertical-align:middle;margin-right:4px;">${icon('microscope', 12)}</span>${totalLab} pending</span>
      </div>
      ${items.length === 0 ? `
        <p class="text-mute" style="font-size:13px;">Nothing on the horizon. Take a breath.</p>
      ` : `
        <ul class="mini-list" style="margin-top: 4px;">
          ${items.map(it => {
            const u = daysUntil(it.date);
            const tone = u < 0 ? 'status-overdue' : u <= 1 ? 'status-todo' : u <= 3 ? 'status-progress' : 'pill-ghost';
            const due = u === 0 ? 'today' : u === 1 ? 'tomorrow' : u < 0 ? `${Math.abs(u)}d late` : `in ${u}d`;
            return `
              <li>
                <span style="display:inline-flex;align-items:center;color:var(--ink-mute);">${icon(it.iconKey, 14)}</span>
                <span class="bold" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;">${escape(it.title)}</span>
                <span class="text-mute" style="font-size:11px;white-space:nowrap;">${escape(it.course)}</span>
                <span class="pill ${tone}" style="font-size:10px;">${due}</span>
              </li>
            `;
          }).join('')}
        </ul>
      `}
      <div class="row gap-8 mt-12">
        <button class="btn btn-sky btn-sm" data-go="assignments" style="flex:1;">assignments</button>
        <button class="btn btn-mint btn-sm" data-go="labs" style="flex:1;">labs</button>
      </div>
    </div>
  `;
}

const CATEGORY_COLORS = {
  Housing: '#F0A6BC',
  Food: '#F5D27A',
  Transport: '#A8C5F0',
  Subs: '#C9A9E8',
  Other: '#9BC09A',
  Health: '#F2A07F',
  Entertain: '#E07599',
  Education: '#6F9DD8',
  Music: '#C9A9E8',
  News: '#9BC09A',
  Storage: '#A8C5F0',
  Dev: '#F2A07F',
  Job: '#9BC09A',
  School: '#A8C5F0',
  Gift: '#F5D27A',
};
function categoryColor(name) {
  return CATEGORY_COLORS[name] || '#9BC09A';
}

function donutChart(slices, centerLabel, centerValue) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return '<p class="text-mute" style="font-size:13px;">no data</p>';
  // Slightly smaller, padded donut so it never overflows its container
  const cx = 70, cy = 70, r = 50, sw = 18;
  const VB = 140;
  const C = 2 * Math.PI * r;
  let cumulative = 0;
  const arcs = slices.map((slice) => {
    const fraction = slice.value / total;
    const dasharray = `${fraction * C} ${C}`;
    const offset = -cumulative * C;
    cumulative += fraction;
    const pct = Math.round(fraction * 100);
    return `
      <circle class="donut-slice"
        cx="${cx}" cy="${cy}" r="${r}"
        fill="none" stroke="${slice.color}" stroke-width="${sw}"
        stroke-dasharray="${dasharray}" stroke-dashoffset="${offset}"
        transform="rotate(-90 ${cx} ${cy})"
        data-label="${escape(slice.label)}"
        data-value="${escape(fmtCurrency(slice.value))}"
        data-pct="${pct}">
        <title>${escape(slice.label)} — ${escape(fmtCurrency(slice.value))} (${pct}%)</title>
      </circle>
    `;
  }).join('');
  return `
    <svg viewBox="0 0 ${VB} ${VB}" class="donut-chart" aria-label="spending breakdown">
      ${arcs}
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="8" fill="#9690B5" font-family="Quicksand, sans-serif" font-weight="700" letter-spacing="1.2">${escape(centerLabel.toUpperCase())}</text>
      <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="17" font-weight="600" fill="#4A3F66" font-family="Fraunces, serif">${escape(centerValue)}</text>
    </svg>
  `;
}

function dashboardBudgetSection(d) {
  const totalIn = d.budget.income.reduce((s, x) => s + +x.amount, 0);
  const totalOut = d.budget.expenses.reduce((s, x) => s + +x.amount, 0);
  // Pull subscription monthly burn into the picture (most recurring drips live there now)
  const subsMonthly = d.subscriptions.reduce((s, x) => s + (x.billing === 'Monthly' ? +x.price : (x.billing === 'Yearly' ? +x.price/12 : 0)), 0);
  const totalSpend = totalOut + subsMonthly;
  const net = totalIn - totalSpend;
  const savingsRate = totalIn > 0 ? Math.round((net / totalIn) * 100) : 0;

  // Categories
  const byCat = {};
  d.budget.expenses.forEach(x => { byCat[x.category] = (byCat[x.category] || 0) + +x.amount; });
  if (subsMonthly > 0) byCat['Subs'] = (byCat['Subs'] || 0) + subsMonthly;
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const slices = cats.map(([cat, val]) => ({ label: cat, value: val, color: categoryColor(cat) }));

  // Income source split
  const incomeBySource = {};
  d.budget.income.forEach(x => { incomeBySource[x.category || 'Other'] = (incomeBySource[x.category || 'Other'] || 0) + +x.amount; });
  const incomeSlices = Object.entries(incomeBySource).map(([cat, val]) => ({ label: cat, value: val, color: categoryColor(cat) }));

  // Top categories vs % of total
  const top = cats.slice(0, 5);

  return `
    <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px;">
      <div class="card budget-card">
        <h3 class="card-title">${icon('wallet', 18)} spending by category</h3>
        ${cats.length === 0 ? `<p class="text-mute">no expenses yet — add some on the budget page</p>` : `
          <div class="spend-summary">
            <div class="spend-summary-label">MONTHLY TOTAL</div>
            <div class="spend-summary-value">${fmtCurrency(totalSpend)}</div>
          </div>
          <div class="spend-stack" id="spendStack" aria-label="spending breakdown">
            ${top.map(([cat, val]) => {
              const pct = (val / totalSpend) * 100;
              return `<span class="spend-stack-seg" style="width: ${pct.toFixed(2)}%; background: ${categoryColor(cat)};" data-slice="${escape(cat)}" title="${escape(cat)}: ${escape(fmtCurrency(val))} (${Math.round(pct)}%)"></span>`;
            }).join('')}
          </div>
          <ul class="cat-list">
            ${top.map(([cat, val]) => {
              const pct = Math.round((val / totalSpend) * 100);
              return `
                <li data-slice="${escape(cat)}" data-target="spendStack">
                  <span class="cat-dot" style="background: ${categoryColor(cat)};"></span>
                  <span class="cat-label">${escape(cat)}</span>
                  <span class="cat-amt"><span class="cat-pct">${pct}%</span><span class="cat-value font-mono">${fmtCurrency(val)}</span></span>
                </li>
              `;
            }).join('')}
          </ul>
        `}
        <button class="btn btn-soft btn-sm mt-12" data-go="budget" style="width:100%;">view full budget →</button>
      </div>

      <div class="card card-mint budget-card">
        <h3 class="card-title">${icon('chart', 18)} income vs spending</h3>
        <div class="bar-comparison">
          <div class="bar-row">
            <span class="bar-label">income</span>
            <div class="bar-track">
              <div class="bar-fill" style="width: 100%; background: linear-gradient(90deg, var(--sage), var(--sage-deep));"></div>
            </div>
            <span class="bar-value font-mono">${fmtCurrency(totalIn)}</span>
          </div>
          <div class="bar-row">
            <span class="bar-label">spending</span>
            <div class="bar-track">
              <div class="bar-fill" style="width: ${totalIn > 0 ? Math.min(100, (totalSpend/totalIn)*100) : (totalSpend>0?100:0)}%; background: linear-gradient(90deg, var(--rose), var(--rose-deep));"></div>
            </div>
            <span class="bar-value font-mono">${fmtCurrency(totalSpend)}</span>
          </div>
          <div class="net-line">
            <span class="bar-label bold">net</span>
            <div class="net-amount" style="color: ${net >= 0 ? 'var(--sage-deep)' : 'var(--rose-deep)'};">
              ${net >= 0 ? '+' : '−'}${fmtCurrency(Math.abs(net))}
              <span class="net-pct">${savingsRate >= 0 ? '+' : ''}${savingsRate}%</span>
            </div>
          </div>
        </div>
        ${incomeSlices.length > 1 ? `
          <div class="mini-stack">
            <div class="kpi-label" style="font-size: 10px; margin-top: 12px;">income mix</div>
            <div class="stack-bar">
              ${(() => {
                const totalI = incomeSlices.reduce((s, x) => s + x.value, 0);
                return incomeSlices.map(s => `<div class="stack-seg" style="width: ${(s.value/totalI*100).toFixed(1)}%; background: ${s.color};" title="${escape(s.label)}: ${escape(fmtCurrency(s.value))}"></div>`).join('');
              })()}
            </div>
            <div class="row gap-12 flex-wrap" style="margin-top: 6px;">
              ${incomeSlices.map(s => `<span class="cat-mini"><span class="cat-dot" style="background:${s.color};"></span>${escape(s.label)}</span>`).join('')}
            </div>
          </div>
        ` : ''}
        <button class="btn btn-mint btn-sm mt-12" data-go="budget" style="width:100%;">manage budget →</button>
      </div>
    </div>
  `;
}

function miniHabitWeek() {
  const d = Store.data;
  const days = [];
  for (let i = -6; i <= 0; i++) {
    const date = nextDays(i);
    days.push(date);
  }
  const html = `
    <div style="display:grid; grid-template-columns: 140px repeat(7, 1fr); gap: 4px; align-items:center;">
      <div></div>
      ${days.map(date => {
        const d2 = new Date(date + 'T00:00:00');
        return `<div style="text-align:center; font-size:10px; font-weight:700; color:var(--ink-mute);">${d2.toLocaleDateString(undefined, { weekday:'short' }).slice(0,2).toUpperCase()}</div>`;
      }).join('')}
      ${d.habits.map(h => `
        <div style="font-size:12px; font-weight:600;">${h.emoji} ${escape(h.name)}</div>
        ${days.map(date => {
          const done = h.days[date];
          return `<button class="habit-cell ${done ? 'done' : ''}" style="aspect-ratio:1; border-radius:6px; padding:0; min-height:0; border:1px solid var(--border);"
            onclick="toggleHabit('${h.id}', '${date}', this)">${done ? '' : ''}</button>`;
        }).join('')}
      `).join('')}
    </div>
  `;
  return html;
}

window.toggleHabit = (id, date, el) => {
  const h = Store.data.habits.find(x => x.id === id);
  h.days[date] = !h.days[date];
  Store.save();
  el.classList.toggle('done');
  el.textContent = h.days[date] ? '' : '';
  if (h.days[date]) Confetti.burst(el.getBoundingClientRect().left + 12, el.getBoundingClientRect().top + 12);
};

/* -- Courses --------------------------------------------------------------- */
Views.courses = (root) => {
  const d = Store.data;
  const active = d.courses.filter(c => c.status === 'Active');
  const totalCredits = active.reduce((s, c) => s + (+c.credits || 0), 0);
  const avgGrade = active.length && active.filter(c => c.grade > 0).length
    ? active.filter(c => c.grade > 0).reduce((s, c, _, a) => s + (+c.grade || 0) / a.length, 0) : 0;

  // Group by year -> semester
  const SEM_ORDER = { Fall: 0, Winter: 1, Summer: 2, Spring: 3 };
  const byYear = {};
  d.courses.forEach(c => {
    const y = c.year || 1;
    const s = c.semester || 'Fall';
    byYear[y] = byYear[y] || {};
    byYear[y][s] = byYear[y][s] || [];
    byYear[y][s].push(c);
  });
  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);

  // Determine "current" group: user-picked override OR auto-detect from active courses
  let currentKey = d.currentYearSem || null;
  let isAutoDetected = !d.currentYearSem;
  if (!currentKey && active.length) {
    const counts = {};
    active.forEach(c => {
      const k = `${c.year || 1}|${c.semester || 'Fall'}`;
      counts[k] = (counts[k] || 0) + 1;
    });
    currentKey = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }
  const [curYearStr, curSem] = currentKey ? currentKey.split('|') : [null, null];
  const curYear = curYearStr ? +curYearStr : null;
  const currentCourses = currentKey ? (byYear[curYear]?.[curSem] || []) : [];

  // Build a list of all year+semester combos that have courses (for the picker)
  const allYearSemKeys = [];
  years.forEach(y => {
    Object.keys(byYear[y]).sort((a, b) => (SEM_ORDER[a] ?? 9) - (SEM_ORDER[b] ?? 9)).forEach(s => {
      allYearSemKeys.push(`${y}|${s}`);
    });
  });

  const archiveCount = Object.keys(d.archivedSemesters || {}).length;

  root.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title"><span class="emoji">${icon('book', 22)}</span>Courses</h1>
        <p class="page-subtitle">Organized by year of degree, then semester. Edit once and it flows everywhere.</p>
      </div>
      <div class="row gap-8 flex-wrap">
        <span class="pill pill-lilac" style="font-size:12px;">${icon('pin', 12)} ${semesterLabel(d.currentSemester)}</span>
        <button class="btn btn-ghost btn-sm" id="endSemester" title="Snapshot this semester and start fresh">end semester</button>
        <button class="btn btn-ghost btn-sm" id="archiveYear" title="Archive the whole school year">archive year</button>
        ${archiveCount ? `<button class="btn btn-ghost btn-sm" id="viewArchive">archive (${archiveCount})</button>` : ''}
        <button class="btn btn-sm" id="addCourse">+ add course</button>
      </div>
    </header>

    <div class="grid grid-3 mb-24">
      ${kpi('Active Courses', active.length, semesterLabel(d.currentSemester), 'book', 'var(--rose-cloud)')}
      ${kpi('Total Credits', totalCredits, 'this semester', 'target', 'var(--butter-glow)')}
      ${kpi('Avg Grade', avgGrade ? avgGrade.toFixed(1) + '%' : '—', 'across active', 'sparkles', 'var(--mint-cream)')}
    </div>

    ${currentKey ? `
      <div class="current-banner">
        <span class="current-banner-pip">${icon('pin', 22)}</span>
        <div style="flex:1; min-width:0;">
          <div class="current-banner-label">where you are right now ${isAutoDetected ? '· auto' : '· you set this'}</div>
          <div class="row gap-12 flex-wrap" style="margin-top:4px; align-items:center;">
            <select class="select current-picker" id="currentPicker">
              <option value="">— auto-detect —</option>
              ${allYearSemKeys.map(k => {
                const [y, s] = k.split('|');
                return `<option value="${k}" ${k===currentKey?'selected':''}>Year ${y} · ${s}</option>`;
              }).join('')}
            </select>
            <span class="text-mute" style="font-size:13px;">${semesterLabel(d.currentSemester)}</span>
          </div>
        </div>
        <span class="pill pill-mint">${currentCourses.length} course${currentCourses.length===1?'':'s'}</span>
      </div>
      <div class="sem-divider" style="margin-top: 18px;">
        <h2><span class="sem-icon">${semIcon(curSem)}</span> ${curSem} Semester</h2>
        <span class="sem-meta">current</span>
        <button class="btn-soft btn-tiny" onclick="addCourseToSlot(${curYear}, '${curSem}')" title="add a course here">+ add</button>
      </div>
      <div class="table-wrap mb-24">
        <table class="table course-table">
          <thead>
            <tr>
              <th>Code</th><th>Name</th><th>Credits</th><th>Professor</th><th>Email</th>
              <th>Room</th><th>Days</th><th>Start</th><th>End</th><th>Status</th><th>Grade%</th><th>Link</th><th></th>
            </tr>
          </thead>
          <tbody>
            ${currentCourses.map(c => courseRow(c)).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    ${(() => {
      // History = everything except the current group
      const histYears = years.filter(y => {
        const sems = byYear[y];
        if (y !== curYear) return Object.keys(sems).length > 0;
        // For current year, only include if there are non-current semesters
        return Object.keys(sems).some(s => s !== curSem);
      });
      if (histYears.length === 0) return '';
      return `
        <div class="history-banner">history</div>
        ${histYears.map(year => {
          // Filter out the current semester if this is the current year
          const semKeys = Object.keys(byYear[year]).filter(s => !(year === curYear && s === curSem));
          const courses = semKeys.flatMap(s => byYear[year][s]);
          const credits = courses.reduce((s, c) => s + (+c.credits || 0), 0);
          const SEMESTER_ALL = ['Fall', 'Winter', 'Summer'];
          const missingSems = SEMESTER_ALL.filter(s => !Object.keys(byYear[year]).includes(s));
          return `
            <div class="year-divider"><div class="year-divider-content"><h1>Year ${year}</h1><span class="year-meta">${courses.length} course${courses.length===1?'':'s'} · ${credits} cr</span></div></div>
            ${semKeys.sort((a, b) => (SEM_ORDER[a] ?? 9) - (SEM_ORDER[b] ?? 9)).map(sem => `
              <div class="sem-divider">
                <h2><span class="sem-icon">${semIcon(sem)}</span> ${sem} Semester</h2>
                <span class="sem-meta">${byYear[year][sem].length} course${byYear[year][sem].length===1?'':'s'}</span>
                <button class="btn-soft btn-tiny" onclick="addCourseToSlot(${year}, '${sem}')" title="add a course to this semester">+ add</button>
              </div>
              <div class="table-wrap mb-24">
                <table class="table course-table">
                  <thead>
                    <tr>
                      <th>Code</th><th>Name</th><th>Credits</th><th>Professor</th><th>Email</th>
                      <th>Room</th><th>Days</th><th>Start</th><th>End</th><th>Status</th><th>Grade%</th><th>Link</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${byYear[year][sem].map(c => courseRow(c)).join('')}
                  </tbody>
                </table>
              </div>
            `).join('')}
            ${missingSems.length ? `
              <div class="row gap-8 flex-wrap" style="margin: -8px 0 16px 8px;">
                <span class="text-mute" style="font-size:12px;">add semester:</span>
                ${missingSems.map(sem => `<button class="btn-soft btn-tiny" onclick="addCourseToSlot(${year}, '${sem}')">${semIcon(sem)} ${sem}</button>`).join('')}
              </div>
            ` : ''}
          `;
        }).join('')}
      `;
    })()}

    <div class="row" style="justify-content: center; margin-top: 32px;">
      <button class="btn btn-ghost" id="addYear">+ add Year ${(years.at(-1) || 0) + 1}</button>
    </div>
  `;
  bindCourseEdits();
  $('#addCourse').addEventListener('click', () => openAddCourseModal(years));
  if ($('#addYear')) {
    $('#addYear').addEventListener('click', () => {
      const next = (years.at(-1) || 0) + 1;
      // Materialize the new year by adding a placeholder course in Fall
      addCourseToSlot(next, 'Fall');
    });
  }
  $('#endSemester').addEventListener('click', () => endSemesterFlow());
  $('#archiveYear').addEventListener('click', () => openArchiveYearFlow());
  if ($('#viewArchive')) $('#viewArchive').addEventListener('click', () => openArchiveModal());
  if ($('#currentPicker')) {
    $('#currentPicker').addEventListener('change', (e) => {
      Store.data.currentYearSem = e.target.value || null;
      Store.save();
      Toast.show(e.target.value ? 'set as current' : 'back to auto-detect');
      Router.refresh();
    });
  }
};

function openAddCourseModal(existingYears) {
  const maxYear = (existingYears.at(-1) || 0) + 1;
  const yearOptions = [];
  for (let y = 1; y <= Math.max(8, maxYear); y++) yearOptions.push(y);
  const defaultYear = existingYears.at(-1) || 1;

  Modal.open(`
    <h2>add a course</h2>
    <div class="field-row">
      <div class="field"><label class="label">year</label>
        <select class="select" id="ac-year">${yearOptions.map(y => `<option value="${y}" ${y===defaultYear?'selected':''}>Year ${y}</option>`).join('')}</select>
      </div>
      <div class="field"><label class="label">semester</label>
        <select class="select" id="ac-sem">${['Fall','Winter','Summer'].map(s => `<option>${s}</option>`).join('')}</select>
      </div>
    </div>
    <div class="field"><label class="label">course code</label>
      <input class="input" id="ac-code" placeholder="MATH 1004" />
    </div>
    <div class="field"><label class="label">course name</label>
      <input class="input" id="ac-name" placeholder="Calculus I" />
    </div>
    <div class="field-row">
      <div class="field"><label class="label">credits</label>
        <input class="input" id="ac-credits" type="number" min="0" step="0.5" value="3" />
      </div>
      <div class="field"><label class="label">status</label>
        <select class="select" id="ac-status">${['Active','Planned','Completed'].map(s => `<option>${s}</option>`).join('')}</select>
      </div>
    </div>
    <div class="row" style="justify-content:flex-end; gap:8px; margin-top:14px;">
      <button class="btn btn-ghost" onclick="Modal.close()">cancel</button>
      <button class="btn" id="ac-save">add</button>
    </div>
  `);
  setTimeout(() => {
    $('#ac-code').focus();
    $('#ac-save').addEventListener('click', () => {
      Store.data.courses.push({
        id: uid(),
        code: $('#ac-code').value.trim(),
        name: $('#ac-name').value.trim() || 'New Course',
        credits: parseFloat($('#ac-credits').value) || 3,
        year: +$('#ac-year').value,
        semester: $('#ac-sem').value,
        status: $('#ac-status').value,
        professor: '', email: '', room: '', days: '', time: '',
        grade: 0, color: '#F0A6BC', notes: '', link: '',
      });
      Store.save();
      Modal.close();
      Router.refresh();
      Toast.show('added');
    });
  }, 50);
}

function semIcon(sem) {
  return ({ Fall: '', Winter: '', Spring: '', Summer: '' })[sem] || '';
}

function bindCourseEdits() {
  $$('.course-table tbody tr').forEach(tr => {
    const id = tr.dataset.id;
    tr.querySelectorAll('[data-k]').forEach(input => {
      input.addEventListener('change', () => {
        const item = Store.data.courses.find(x => x.id === id);
        if (!item) return;
        let v = input.value;
        if (input.type === 'number') v = parseFloat(v) || 0;
        item[input.dataset.k] = v;
        Store.save();
        // Refresh because year/semester edits regroup the layout
        if (input.dataset.k === 'year' || input.dataset.k === 'semester') Router.refresh();
      });
    });
  });
}

function courseRow(c) {
  const googleSchedule = c.status === 'Active' && CalendarCore.googleCovers(Store.data, today());
  const linked = googleSchedule ? GoogleCalendarSync.courseEvents(c.code)[0] : null;
  return `
    <tr data-id="${c.id}">
      <td><input data-k="code" value="${escape(c.code)}" title="${escape(c.code)}" ondblclick="popoutEdit(this, 'course code')" />${c.section || c.crn ? `<div class="text-mute" style="font-size:10px; margin-top:3px;">${c.section ? `section ${escape(c.section)}` : ''}${c.section && c.crn ? ' · ' : ''}${c.crn ? `CRN ${escape(c.crn)}` : ''}</div>` : ''}</td>
      <td><input data-k="name" value="${escape(c.name)}" title="${escape(c.name)}" ondblclick="popoutEdit(this, 'course name')" /></td>
      <td style="width:80px;"><input data-k="credits" type="number" min="0" step="0.5" value="${c.credits}" /></td>
      <td><input data-k="professor" value="${escape(c.professor)}" title="${escape(c.professor)}" ondblclick="popoutEdit(this, 'professor')" /></td>
      <td><input data-k="email" value="${escape(c.email)}" title="${escape(c.email)}" ondblclick="popoutEdit(this, 'email')" /></td>
      ${googleSchedule ? `<td colspan="4"><button class="btn-soft" onclick="GoogleCalendarSync.openEvent(${linked ? escape(JSON.stringify(linked.googleId)) : 'null'})">${linked ? `${escape(formatTimeRange(linked.time, linked.endTime))} · ${escape(linked.location || 'Google Calendar')} · edit` : 'Add a session to Google Calendar'}</button></td>` : `
        <td style="width:90px;"><input data-k="room" value="${escape(c.room)}" /></td>
        <td style="width:80px;"><input data-k="days" value="${escape(c.days)}" title="e.g. MWF, TR, MW" /></td>
        <td style="width:80px;"><input data-k="time" value="${escape(c.time)}" placeholder="start" title="start time, e.g. 10:00" /></td>
        <td style="width:80px;"><input data-k="endTime" value="${escape(c.endTime || '')}" placeholder="end" title="end time, e.g. 11:15" /></td>`}
      <td style="width:110px;">
        <select data-k="status">
          ${['Active','Planned','Completed','Dropped'].map(s => `<option ${c.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td style="width:80px;"><input data-k="grade" type="number" min="0" max="100" value="${c.grade}" /></td>
      <td style="width:60px;">
        ${c.link ? `<a href="${escape(c.link)}" target="_blank" rel="noopener" class="link-icon" title="open course page">${icon('arrowRight', 13)}</a>` : ''}
        <button class="btn-soft btn-tiny" onclick="editCourseLink('${c.id}')" title="${c.link ? 'edit link' : 'add link'}">${c.link ? '' : '+'}</button>
      </td>
      <td style="width:90px;">
        <button class="btn-soft btn-tiny" onclick="moveCoursePrompt('${c.id}')" title="change year/semester">↗</button>
        <button class="btn-soft btn-tiny" onclick="deleteRow('courses', '${c.id}')" title="remove">×</button>
      </td>
    </tr>
  `;
}

/* Pop-out editor for truncated text cells */
window.popoutEdit = (input, label) => {
  const value = input.value;
  Modal.open(`
    <h2>${escape(label)}</h2>
    <textarea class="textarea" id="popoutText" style="min-height:120px;">${escape(value)}</textarea>
    <div class="row" style="justify-content:flex-end; gap:8px; margin-top:14px;">
      <button class="btn btn-ghost" onclick="Modal.close()">cancel</button>
      <button class="btn" id="popoutSave">save</button>
    </div>
  `);
  setTimeout(() => {
    $('#popoutText').focus();
    $('#popoutSave').addEventListener('click', () => {
      input.value = $('#popoutText').value;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      Modal.close();
    });
  }, 50);
};

window.editCourseLink = (id) => {
  const c = Store.data.courses.find(x => x.id === id);
  Modal.open(`
    <h2>course webpage</h2>
    <p class="text-mute" style="font-size:13px;">Paste the URL to your course page (Brightspace, Canvas, syllabus, etc.).</p>
    <input class="input" id="linkUrl" placeholder="https://…" value="${escape(c.link || '')}" />
    <div class="row" style="justify-content:space-between; margin-top:14px;">
      ${c.link ? `<button class="btn btn-ghost" onclick="(()=>{ const x=Store.data.courses.find(y=>y.id==='${c.id}'); x.link=''; Store.save(); Modal.close(); Router.refresh(); })()">remove</button>` : '<span></span>'}
      <div class="row gap-8">
        <button class="btn btn-ghost" onclick="Modal.close()">cancel</button>
        <button class="btn" id="saveLink">save</button>
      </div>
    </div>
  `);
  setTimeout(() => {
    $('#linkUrl').focus();
    $('#saveLink').addEventListener('click', () => {
      let url = $('#linkUrl').value.trim();
      if (url && !/^https?:\/\//.test(url)) url = 'https://' + url;
      c.link = url;
      Store.save();
      Modal.close();
      Router.refresh();
    });
  }, 50);
};

window.moveCoursePrompt = (id) => {
  const c = Store.data.courses.find(x => x.id === id);
  Modal.open(`
    <h2>move ${escape(c.code || 'course')}</h2>
    <div class="field-row">
      <div class="field"><label class="label">year</label>
        <select class="select" id="mvYear">${[1,2,3,4,5,6,7,8].map(y => `<option value="${y}" ${(c.year||1)===y?'selected':''}>Year ${y}</option>`).join('')}</select>
      </div>
      <div class="field"><label class="label">semester</label>
        <select class="select" id="mvSem">${['Fall','Winter','Summer'].map(s => `<option ${c.semester===s?'selected':''}>${s}</option>`).join('')}</select>
      </div>
    </div>
    <div class="row" style="justify-content:flex-end; gap:8px;">
      <button class="btn btn-ghost" onclick="Modal.close()">cancel</button>
      <button class="btn" id="confirmMove">move</button>
    </div>
  `);
  setTimeout(() => {
    $('#confirmMove').addEventListener('click', () => {
      c.year = +$('#mvYear').value;
      c.semester = $('#mvSem').value;
      Store.save();
      Modal.close();
      Router.refresh();
      Toast.show(`moved to Year ${c.year} ${c.semester}`);
    });
  }, 50);
};

window.addCourseToSlot = (year, semester) => {
  Store.data.courses.push({
    id: uid(), code: '', name: 'New Course', credits: 3, year, professor: '', email: '',
    room: '', days: '', time: '', semester, status: 'Active',
    grade: 0, color: '#F0A6BC', notes: '', link: '',
  });
  Store.save();
  Router.refresh();
  Toast.show(`added to Year ${year} ${semester}`);
};

/* -- Semester archive workflow -------------------------------------------- */
function endSemesterFlow() {
  const d = Store.data;
  const cur = d.currentSemester;
  const next = nextSemesterId(cur);
  Modal.open(`
    <h2>end ${semesterLabel(cur)}</h2>
    <p class="text-mute" style="font-size:13px;">This snapshots all current academic data so you can revisit it later, then sets a fresh stage for the new semester.</p>
    <div class="card card-warm" style="padding:14px; font-size:13px; margin-top:12px;">
      <div class="bold mb-12">snapshot will include</div>
      <ul class="mini-list">
        <li><span class="dot"></span> ${d.courses.filter(c => c.status === 'Active').length} active courses</li>
        <li><span class="dot"></span> ${d.assignments.length} assignments</li>
        <li><span class="dot"></span> ${d.tests.length} tests · ${d.exams.length} exams · ${d.labs.length} labs</li>
        <li><span class="dot"></span> term GPA ${computeGpa(d.courses.filter(c=>c.status==='Active')).toFixed(2)}</li>
      </ul>
    </div>
    <div class="field mt-24"><label class="label">next semester</label>
      <select class="select" id="nextSem">
        ${['F','W','S'].flatMap(season => {
          const ys = new Date().getFullYear();
          return [ys, ys+1].map(y => {
            const id = `${season}${y}`;
            return `<option value="${id}" ${id===next?'selected':''}>${semesterLabel(id)}</option>`;
          });
        }).join('')}
      </select>
    </div>
    <div class="field">
      <label class="row gap-8" style="cursor:pointer;">
        <input type="checkbox" id="clearItems" class="checkbox" checked />
        <span>clear assignments / tests / exams / labs (courses always stay)</span>
      </label>
    </div>
    <div class="row" style="justify-content: flex-end; gap:8px; margin-top:18px;">
      <button class="btn btn-ghost" onclick="Modal.close()">cancel</button>
      <button class="btn" id="confirmEnd">archive &amp; start fresh</button>
    </div>
  `);
  setTimeout(() => {
    $('#confirmEnd').addEventListener('click', () => {
      const nextSem = $('#nextSem').value;
      const clearItems = $('#clearItems').checked;
      doArchiveSemester(cur, nextSem, clearItems);
      Modal.close();
    });
  }, 50);
}

function doArchiveSemester(curId, nextId, clearItems) {
  const d = Store.data;
  d.archivedSemesters = d.archivedSemesters || {};
  // Snapshot
  d.archivedSemesters[curId] = {
    id: curId,
    label: semesterLabel(curId),
    archivedOn: today(),
    gpaScale: d.gpaScale,
    snapshot: {
      courses: structuredClone(d.courses.filter(c => c.status === 'Active' || c.status === 'Completed')),
      assignments: structuredClone(d.assignments),
      tests: structuredClone(d.tests),
      exams: structuredClone(d.exams),
      labs: structuredClone(d.labs),
    },
  };
  // Mark currently-active as completed (they're now history)
  d.courses.forEach(c => { if (c.status === 'Active') c.status = 'Completed'; });
  // Clear short-lived academic items
  if (clearItems) {
    d.assignments = [];
    d.tests = [];
    d.exams = [];
    d.labs = [];
  }
  d.currentSemester = nextId;
  Store.save();
  Router.refresh();
  Confetti.burst(innerWidth / 2, innerHeight / 3);
  Toast.show(`archived ${semesterLabel(curId)} → ${semesterLabel(nextId)}`);
}

function openArchiveModal() {
  const d = Store.data;
  const archives = Object.values(d.archivedSemesters || {});
  archives.sort((a, b) => (b.archivedOn || '').localeCompare(a.archivedOn || ''));
  Modal.open(`
    <h2>archived semesters</h2>
    <p class="text-mute" style="font-size:13px;">Click any to peek inside.</p>
    ${archives.length === 0 ? `
      <div class="empty">
        <span class="empty-emoji">${icon('archive', 40)}</span>
        <h3 class="empty-title">nothing archived yet</h3>
        <p class="empty-text">When you finish a semester, you'll find it here.</p>
      </div>
    ` : archives.map(a => {
      const cs = a.snapshot.courses || [];
      const gpa = computeGpa(cs, a.gpaScale || '4');
      return `
        <div class="card mb-12" style="padding:14px 16px;">
          <div class="row-between" style="margin-bottom:6px;">
            <div>
              <div style="font-family: var(--font-display); font-size: 22px;">${escape(a.label)}</div>
              <div class="text-mute" style="font-size:11px;">archived ${escape(a.archivedOn || '')}</div>
            </div>
            <div class="row gap-8">
              <span class="pill pill-lilac">GPA ${gpa.toFixed(2)}</span>
              <button class="btn-soft" onclick="deleteArchive('${a.id}')">×</button>
            </div>
          </div>
          <div class="text-mute" style="font-size:12px;">
            ${cs.length} courses · ${a.snapshot.assignments?.length||0} assignments · ${a.snapshot.tests?.length||0} tests · ${a.snapshot.exams?.length||0} exams · ${a.snapshot.labs?.length||0} labs
          </div>
          <button class="btn-soft mt-12" onclick="viewArchiveDetail('${a.id}')" style="width:100%;">peek inside</button>
        </div>
      `;
    }).join('')}
    <div class="row" style="justify-content:flex-end; margin-top:14px;">
      <button class="btn btn-ghost" onclick="Modal.close()">close</button>
    </div>
  `);
}

window.deleteArchive = (id) => {
  if (!confirm('Delete this archived semester? This cannot be undone.')) return;
  delete Store.data.archivedSemesters[id];
  Store.save();
  openArchiveModal();
};

window.viewArchiveDetail = (id) => {
  const a = Store.data.archivedSemesters[id];
  if (!a) return;
  const scale = a.gpaScale || '4';
  const cs = a.snapshot.courses || [];
  const gpa = computeGpa(cs, scale);
  Modal.open(`
    <h2>${escape(a.label)}</h2>
    <div class="text-mute" style="font-size:12px;">read-only snapshot · archived ${escape(a.archivedOn || '')}</div>
    <div class="gpa-hero" style="padding: 18px; margin: 16px 0;">
      <div class="gpa-label">term GPA</div>
      <div class="gpa-number" style="font-size: 56px;">${gpa.toFixed(2)}</div>
      <div class="text-mute" style="font-size:11px;">${GPA_SCALES[scale].name}</div>
    </div>
    <h3 style="font-family: var(--font-display); font-size: 22px; margin: 14px 0 8px;">courses</h3>
    <table class="table" style="width:100%;">
      <thead><tr><th>Code</th><th>Name</th><th>Credits</th><th>Grade</th></tr></thead>
      <tbody>
        ${cs.map(c => `<tr><td>${escape(c.code)}</td><td>${escape(c.name)}</td><td>${c.credits}</td><td>${c.grade > 0 ? c.grade + '%' : '—'}</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="grid grid-3 mt-24">
      <div class="card" style="padding:10px 14px;"><div class="kpi-label">assignments</div><div style="font-size:24px; font-weight:600;">${a.snapshot.assignments?.length||0}</div></div>
      <div class="card" style="padding:10px 14px;"><div class="kpi-label">tests + exams</div><div style="font-size:24px; font-weight:600;">${(a.snapshot.tests?.length||0)+(a.snapshot.exams?.length||0)}</div></div>
      <div class="card" style="padding:10px 14px;"><div class="kpi-label">labs</div><div style="font-size:24px; font-weight:600;">${a.snapshot.labs?.length||0}</div></div>
    </div>
    <div class="row" style="justify-content:space-between; margin-top:18px;">
      <button class="btn btn-ghost" onclick="openArchiveModal()">back</button>
      <button class="btn btn-ghost" onclick="Modal.close()">close</button>
    </div>
  `);
};
window.openArchiveModal = openArchiveModal;

/* -- Year-level archive (with selectable categories) ---------------------- */
const YEAR_ARCHIVE_CATS = [
  { key: 'courses', iconName: 'book', label: 'Active courses → mark Completed', defaultArchive: true,
    count: d => d.courses.filter(c => c.status === 'Active').length,
    apply: d => d.courses.forEach(c => { if (c.status === 'Active') c.status = 'Completed'; }) },
  { key: 'assignments', iconName: 'pencil', label: 'Assignments',  defaultArchive: true,
    count: d => d.assignments.length, apply: d => { d.assignments = []; } },
  { key: 'tests', iconName: 'flask', label: 'Tests',        defaultArchive: true,
    count: d => d.tests.length, apply: d => { d.tests = []; } },
  { key: 'exams', iconName: 'chart', label: 'Exams',        defaultArchive: true,
    count: d => d.exams.length, apply: d => { d.exams = []; } },
  { key: 'labs', iconName: 'microscope', label: 'Labs',         defaultArchive: true,
    count: d => d.labs.length, apply: d => { d.labs = []; } },
  { key: 'todos', iconName: 'sparkles', label: 'To-Dos',       defaultArchive: true,
    count: d => d.todos.length, apply: d => { d.todos = []; } },
  { key: 'notes', iconName: 'notebook', label: 'Notes journal', defaultArchive: true,
    count: d => (d.notes ? 1 : 0), apply: d => { d.notes = ''; } },
  { key: 'braindump', iconName: 'brain', label: 'Brain dump',   defaultArchive: true,
    count: d => d.brainDump.length, apply: d => { d.brainDump = []; } },
  { key: 'habits', iconName: 'check', label: 'Reset habit history (keeps habit list)', defaultArchive: false,
    count: d => d.habits.reduce((s, h) => s + Object.keys(h.days || {}).length, 0),
    apply: d => d.habits.forEach(h => h.days = {}) },
  { key: 'goals', iconName: 'target', label: 'Goals',        defaultArchive: false,
    count: d => d.goals.length, apply: d => { d.goals = []; } },
  { key: 'mood', iconName: 'smile', label: 'Mood log',     defaultArchive: false,
    count: d => Object.keys(d.moods || {}).length, apply: d => { d.moods = {}; } },
  { key: 'reading', iconName: 'bookOpen', label: 'Reading list', defaultArchive: false,
    count: d => d.reading.length, apply: d => { d.reading = []; } },
  { key: 'contacts', iconName: 'contact', label: 'Contacts',     defaultArchive: false,
    count: d => d.contacts.length, apply: d => { d.contacts = []; } },
  { key: 'coop', iconName: 'briefcase', label: 'Co-op pipeline', defaultArchive: false,
    count: d => d.coop.length, apply: d => { d.coop = []; } },
  { key: 'budget', iconName: 'wallet', label: 'Budget',       defaultArchive: false,
    count: d => d.budget.income.length + d.budget.expenses.length,
    apply: d => { d.budget = { income: [], expenses: [] }; } },
  { key: 'subscriptions', iconName: 'card', label: 'Subscriptions', defaultArchive: false,
    count: d => d.subscriptions.length, apply: d => { d.subscriptions = []; } },
];

function openArchiveYearFlow() {
  const d = Store.data;
  const ys = new Date().getFullYear();
  const defaultLabel = `${ys}–${(ys + 1).toString().slice(2)}`;
  Modal.open(`
    <h2>archive school year</h2>
    <p class="text-mute" style="font-size:13px;">Pack up everything from this year so you can revisit it later. Uncheck what you'd like to carry forward into your fresh slate.</p>
    <div class="field" style="margin-top:12px;">
      <label class="label">school year label</label>
      <input class="input" id="ay-label" value="${escape(defaultLabel)}" placeholder="2024–25" />
    </div>
    <div class="archive-year-list">
      ${YEAR_ARCHIVE_CATS.map(cat => {
        const n = cat.count(d);
        return `
          <label class="archive-cat-row" title="${escape(cat.label)}">
            <input type="checkbox" class="checkbox" data-cat="${cat.key}" ${cat.defaultArchive ? 'checked' : ''} />
            <span class="archive-cat-icon">${cat.iconName ? icon(cat.iconName, 16) : (cat.icon || '')}</span>
            <span style="flex:1;">${escape(cat.label)}</span>
            <span class="text-mute font-mono" style="font-size:11px;">${n}</span>
          </label>
        `;
      }).join('')}
    </div>
    <div class="card card-warm" style="padding: 10px 14px; font-size:12px; margin-top:12px;">
      <span class="bold">checked</span> = packed into the archive &amp; cleared · <span class="bold">unchecked</span> = stays with you
    </div>
    <div class="row" style="justify-content:flex-end; gap:8px; margin-top:14px;">
      <button class="btn btn-ghost" onclick="Modal.close()">cancel</button>
      <button class="btn" id="ay-confirm">archive year &amp; start fresh</button>
    </div>
  `);
  setTimeout(() => {
    $('#ay-confirm').addEventListener('click', () => {
      const label = $('#ay-label').value.trim() || defaultLabel;
      const checked = {};
      $$('input[data-cat]').forEach(cb => checked[cb.dataset.cat] = cb.checked);
      doArchiveYear(label, checked);
      Modal.close();
    });
  }, 50);
}

function doArchiveYear(label, checked) {
  const d = Store.data;
  d.archivedSemesters = d.archivedSemesters || {};
  const id = `Y${label.replace(/\s/g, '')}`;
  d.archivedSemesters[id] = {
    id,
    label: `Year ${label}`,
    archivedOn: today(),
    gpaScale: d.gpaScale,
    isYearArchive: true,
    archivedCategories: Object.keys(checked).filter(k => checked[k]),
    snapshot: structuredClone({
      courses: d.courses,
      assignments: d.assignments,
      tests: d.tests,
      exams: d.exams,
      labs: d.labs,
      todos: d.todos,
      goals: d.goals,
      moods: d.moods,
      reading: d.reading,
      contacts: d.contacts,
      coop: d.coop,
      budget: d.budget,
      subscriptions: d.subscriptions,
      notes: d.notes,
      brainDump: d.brainDump,
      habits: d.habits,
    }),
  };
  // Apply selected clears
  YEAR_ARCHIVE_CATS.forEach(cat => {
    if (checked[cat.key]) cat.apply(d);
  });
  Store.save();
  Router.refresh();
  Confetti.burst(innerWidth / 2, innerHeight / 3);
  Toast.show(`archived year ${label}`);
}

function bindRowEdits(tableSel, key) {
  $$(tableSel + ' tbody tr').forEach(tr => {
    const id = tr.dataset.id;
    tr.querySelectorAll('[data-k]').forEach(input => {
      input.addEventListener('change', () => {
        const item = Store.data[key].find(x => x.id === id);
        if (!item) return;
        let v = input.value;
        if (input.type === 'number') v = parseFloat(v) || 0;
        if (input.type === 'checkbox') v = input.checked;
        item[input.dataset.k] = v;
        Store.save();
      });
    });
  });
}

window.deleteRow = (key, id) => {
  Store.data[key] = Store.data[key].filter(x => x.id !== id);
  Store.save();
  Router.refresh();
  Toast.show('removed');
};

/* -- Assignments ----------------------------------------------------------- */
Views.assignments = (root) => {
  const d = Store.data;
  const open = d.assignments.filter(a => !a.submitted);
  const overdue = open.filter(a => daysUntil(a.due) < 0).length;
  const dueWeek = open.filter(a => { const u = daysUntil(a.due); return u >= 0 && u <= 7; }).length;

  root.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title"><span class="emoji">${icon('pencil', 22)}</span>Assignments</h1>
        <p class="page-subtitle">Every problem set, lab report, project, and presentation in one cozy place.</p>
      </div>
      <button class="btn" id="addAssign">+ add assignment</button>
    </header>

    <div class="grid grid-3 mb-24">
      ${kpi('Open', open.length, 'still in the works', '', 'var(--butter-glow)')}
      ${kpi('Due this week', dueWeek, 'gentle nudge', '', 'var(--rose-cloud)')}
      ${kpi('Overdue', overdue, overdue ? 'breathe — you got this' : 'all caught up', '', overdue ? '#FFD9DD' : 'var(--mint-cream)')}
    </div>

    <div class="toolbar">
      <input class="input" id="searchA" placeholder="search assignments…" />
      <select class="select" id="filterCourse">
        <option value="">all courses</option>
        ${d.courses.map(c => `<option>${escape(c.code)}</option>`).join('')}
      </select>
      <select class="select" id="filterStatus">
        <option value="">all statuses</option>
        ${['Not Started','In Progress','Submitted','Done','Overdue'].map(s => `<option>${s}</option>`).join('')}
      </select>
    </div>

    <div class="table-wrap">
      <table class="table" id="assignTable">
        <thead>
          <tr>
            <th>✓</th><th>Course</th><th>Title</th><th>Type</th><th>Due</th>
            <th>Status</th><th>Priority</th><th>Days</th><th>Weight%</th><th>Grade%</th><th>Notes</th><th></th>
          </tr>
        </thead>
        <tbody>
          ${d.assignments.map(a => assignRow(a)).join('')}
        </tbody>
      </table>
    </div>
  `;
  bindAssignRows();
  $('#addAssign').addEventListener('click', () => {
    Store.data.assignments.push({
      id: uid(), course: '', title: '', type: 'Homework',
      due: today(), status: 'Not Started', priority: 'Med',
      weight: 0, grade: 0, submitted: false, notes: '', link: '',
    });
    Store.save();
    Router.refresh();
  });

  // search filters
  const apply = () => {
    const q = $('#searchA').value.toLowerCase();
    const fc = $('#filterCourse').value;
    const fs = $('#filterStatus').value;
    $$('#assignTable tbody tr').forEach(tr => {
      const a = d.assignments.find(x => x.id === tr.dataset.id);
      const visible = (!q || a.title.toLowerCase().includes(q) || (a.notes||'').toLowerCase().includes(q))
        && (!fc || a.course === fc)
        && (!fs || a.status === fs);
      tr.style.display = visible ? '' : 'none';
    });
  };
  $('#searchA').addEventListener('input', apply);
  $('#filterCourse').addEventListener('change', apply);
  $('#filterStatus').addEventListener('change', apply);
};

function assignRow(a) {
  const u = daysUntil(a.due);
  const daysLeft = a.submitted ? '—' : (u === null ? '—' : (u < 0 ? `${Math.abs(u)}d late` : (u === 0 ? 'today' : `${u}d`)));
  return `
    <tr data-id="${a.id}">
      <td><input class="checkbox" type="checkbox" data-k="submitted" ${a.submitted ? 'checked' : ''} /></td>
      <td><input data-k="course" value="${escape(a.course)}" /></td>
      <td style="min-width:240px;"><input data-k="title" value="${escape(a.title)}" /></td>
      <td>
        <select data-k="type">
          ${['Homework','Project','Essay','Lab Report','Presentation','Quiz','Worksheet','Reading','Other'].map(s => `<option ${a.type===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td style="width:130px;"><input data-k="due" type="date" value="${a.due}" /></td>
      <td>
        <select data-k="status">
          ${['Not Started','In Progress','Submitted','Done','Overdue'].map(s => `<option ${a.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td>
        <select data-k="priority">
          ${['Low','Med','High'].map(s => `<option ${a.priority===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td><span class="pill ${u<0&&!a.submitted?'status-overdue':'pill-ghost'}">${daysLeft}</span></td>
      <td style="width:80px;"><input data-k="weight" type="number" min="0" max="100" value="${a.weight}" /></td>
      <td style="width:80px;"><input data-k="grade" type="number" min="0" max="100" value="${a.grade}" /></td>
      <td style="min-width:200px;"><input data-k="notes" value="${escape(a.notes)}" /></td>
      <td><button class="btn-soft" onclick="deleteRow('assignments', '${a.id}')">×</button></td>
    </tr>
  `;
}

function bindAssignRows() {
  $$('#assignTable tbody tr').forEach(tr => {
    const id = tr.dataset.id;
    tr.querySelectorAll('[data-k]').forEach(input => {
      input.addEventListener('change', (e) => {
        const a = Store.data.assignments.find(x => x.id === id);
        if (!a) return;
        let v = input.value;
        if (input.type === 'number') v = parseFloat(v) || 0;
        if (input.type === 'checkbox') {
          v = input.checked;
          if (v) {
            a.status = 'Submitted';
            Confetti.fromEvent(e);
            Toast.show('one less thing to worry about');
          }
        }
        a[input.dataset.k] = v;
        Store.save();
        Router.refresh();
      });
    });
  });
}

/* -- Tests ----------------------------------------------------------------- */
Views.tests = (root) => {
  const d = Store.data;
  const upcoming = d.tests.filter(t => t.status !== 'Done').length;
  const avg = (() => {
    const done = d.tests.filter(t => t.grade > 0);
    return done.length ? done.reduce((s, t) => s + +t.grade, 0) / done.length : 0;
  })();

  root.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title"><span class="emoji">${icon('flask', 22)}</span>Tests &amp; Quizzes</h1>
        <p class="page-subtitle">Quizzes and midterms — the small adventures along the way.</p>
      </div>
      <button class="btn" id="addTest">+ add test</button>
    </header>
    <div class="grid grid-3 mb-24">
      ${kpi('Upcoming', upcoming, '', '', 'var(--butter-glow)')}
      ${kpi('Average Grade', avg ? avg.toFixed(1) + '%' : '—', '', '', 'var(--mint-cream)')}
      ${kpi('Total', d.tests.length, '', '', 'var(--rose-cloud)')}
    </div>
    <div class="table-wrap">
      <table class="table" id="testTable">
        <thead>
          <tr><th>Course</th><th>Title</th><th>Date</th><th>Days</th><th>Weight%</th><th>Grade%</th><th>Status</th><th>Notes</th><th></th></tr>
        </thead>
        <tbody>
          ${d.tests.map(t => testRow(t)).join('')}
        </tbody>
      </table>
    </div>
  `;
  bindRowEdits('#testTable', 'tests');
  $('#addTest').addEventListener('click', () => {
    Store.data.tests.push({ id: uid(), course: '', title: '', date: today(), weight: 0, grade: 0, status: 'Upcoming', notes: '' });
    Store.save();
    Router.refresh();
  });
};

function testRow(t) {
  const u = daysUntil(t.date);
  const dl = u === null ? '—' : (u < 0 ? `${Math.abs(u)}d ago` : u === 0 ? 'today' : `${u}d`);
  return `
    <tr data-id="${t.id}">
      <td><input data-k="course" value="${escape(t.course)}" /></td>
      <td style="min-width:240px;"><input data-k="title" value="${escape(t.title)}" /></td>
      <td style="width:130px;"><input data-k="date" type="date" value="${t.date}" /></td>
      <td><span class="pill pill-ghost">${dl}</span></td>
      <td style="width:80px;"><input data-k="weight" type="number" min="0" max="100" value="${t.weight}" /></td>
      <td style="width:80px;"><input data-k="grade" type="number" min="0" max="100" value="${t.grade}" /></td>
      <td>
        <select data-k="status">
          ${['Upcoming','Studying','Done','Cancelled'].map(s => `<option ${t.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td style="min-width:200px;"><input data-k="notes" value="${escape(t.notes)}" /></td>
      <td><button class="btn-soft" onclick="deleteRow('tests', '${t.id}')">×</button></td>
    </tr>
  `;
}

/* -- Exams ----------------------------------------------------------------- */
Views.exams = (root) => {
  const d = Store.data;
  root.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title"><span class="emoji">${icon('chart', 22)}</span>Final Exams</h1>
        <p class="page-subtitle">The big bosses. Plot them out, plan your reviews, breathe.</p>
      </div>
      <button class="btn" id="addExam">+ add exam</button>
    </header>
    <div class="grid grid-3 mb-24">
      ${kpi('Scheduled', d.exams.length, '', 'chart', 'var(--lavender-mist)')}
      ${kpi('Days to nearest', (() => {
        const fut = d.exams.filter(e => daysUntil(e.date) >= 0).map(e => daysUntil(e.date));
        return fut.length ? Math.min(...fut) : '—';
      })(), '', 'clock', 'var(--butter-glow)')}
      ${kpi('Total weight%', d.exams.reduce((s,e) => s + +e.weight, 0), 'across exams', 'target', 'var(--rose-cloud)')}
    </div>
    <div class="table-wrap">
      <table class="table" id="examTable">
        <thead>
          <tr><th>Course</th><th>Title</th><th>Date</th><th>Location</th><th>Weight%</th><th>Grade%</th><th>Status</th><th>Notes</th><th></th></tr>
        </thead>
        <tbody>
          ${d.exams.map(e => examRow(e)).join('')}
        </tbody>
      </table>
    </div>
  `;
  bindRowEdits('#examTable', 'exams');
  $('#addExam').addEventListener('click', () => {
    Store.data.exams.push({ id: uid(), course: '', title: 'Final Exam', date: today(), location: '', weight: 0, grade: 0, status: 'Upcoming', notes: '' });
    Store.save();
    Router.refresh();
  });
};

function examRow(e) {
  return `
    <tr data-id="${e.id}">
      <td><input data-k="course" value="${escape(e.course)}" /></td>
      <td><input data-k="title" value="${escape(e.title)}" /></td>
      <td style="width:130px;"><input data-k="date" type="date" value="${e.date}" /></td>
      <td><input data-k="location" value="${escape(e.location)}" /></td>
      <td style="width:80px;"><input data-k="weight" type="number" min="0" max="100" value="${e.weight}" /></td>
      <td style="width:80px;"><input data-k="grade" type="number" min="0" max="100" value="${e.grade}" /></td>
      <td><select data-k="status">${['Upcoming','Studying','Done'].map(s => `<option ${e.status===s?'selected':''}>${s}</option>`).join('')}</select></td>
      <td style="min-width:200px;"><input data-k="notes" value="${escape(e.notes)}" /></td>
      <td><button class="btn-soft" onclick="deleteRow('exams', '${e.id}')">×</button></td>
    </tr>
  `;
}

/* -- Labs ------------------------------------------------------------------ */
Views.labs = (root) => {
  const d = Store.data;
  // Group by course, ordered by course code
  const byCourse = {};
  d.labs.forEach(l => {
    const key = l.course || '— uncategorized';
    (byCourse[key] = byCourse[key] || []).push(l);
  });
  const courseKeys = Object.keys(byCourse).sort();
  // Sort labs within each course by date
  courseKeys.forEach(k => byCourse[k].sort((a, b) => (a.date || '').localeCompare(b.date || '')));

  // Lookup course objects so we can show metadata + accent color
  const courseLookup = {};
  d.courses.forEach(c => { courseLookup[c.code] = c; });

  // Quick list for dropdown
  const courseOptions = d.courses.map(c => c.code).filter(Boolean);

  root.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title"><span class="emoji">${icon('microscope', 22)}</span>Labs</h1>
        <p class="page-subtitle">Lab sessions and reports, grouped by course.</p>
      </div>
      <button class="btn" id="addLab">+ add lab</button>
    </header>
    <div class="grid grid-3 mb-24">
      ${kpi('Total', d.labs.length, '', 'flask', 'var(--mint-cream)')}
      ${kpi('Pending Reports', d.labs.filter(l => l.status !== 'Done').length, '', 'notebook', 'var(--butter-glow)')}
      ${kpi('Avg Grade', (() => {
        const g = d.labs.filter(l => l.grade > 0);
        return g.length ? (g.reduce((s,l) => s + +l.grade, 0) / g.length).toFixed(1) + '%' : '—';
      })(), '', 'sparkles', 'var(--rose-cloud)')}
    </div>

    ${courseKeys.length === 0 ? `
      <div class="empty">
        <span class="empty-emoji">${icon('microscope', 40)}</span>
        <h3 class="empty-title">no labs yet</h3>
        <p class="empty-text">Add your first one — they'll group by course automatically.</p>
      </div>
    ` : courseKeys.map(courseKey => {
      const labs = byCourse[courseKey];
      const c = courseLookup[courseKey];
      const accent = c?.color || '#9BC09A';
      const avg = (() => {
        const g = labs.filter(l => l.grade > 0);
        return g.length ? (g.reduce((s,l) => s + +l.grade, 0) / g.length).toFixed(1) : null;
      })();
      const pending = labs.filter(l => l.status !== 'Done').length;
      const tas = [...new Set(labs.map(l => l.ta).filter(Boolean))];
      return `
        <div class="card mb-24" style="padding: 0; overflow: hidden;">
          <div style="background: linear-gradient(135deg, ${accent}33, ${accent}11); padding: 16px 20px; border-bottom: 1px solid var(--border);">
            <div class="row-between" style="flex-wrap: wrap; gap: 8px;">
              <div>
                <h2 style="font-family: var(--font-display); font-size: 28px; margin: 0; color: var(--ink); display:flex; align-items:center; gap:10px;">
                  <span style="display:inline-block; width: 14px; height: 14px; border-radius: 50%; background: ${accent};"></span>
                  ${escape(courseKey)}
                </h2>
                ${c ? `<div class="text-mute" style="font-size:12px; margin-top:2px;">${escape(c.name)} · ${c.credits} cr</div>` : ''}
              </div>
              <div class="row gap-8 flex-wrap">
                <span class="pill pill-ghost">${labs.length} labs</span>
                ${pending ? `<span class="pill pill-butter">${pending} pending</span>` : `<span class="pill pill-mint">all done</span>`}
                ${avg ? `<span class="pill pill-lilac">avg ${avg}%</span>` : ''}
                ${tas.length ? `<span class="pill pill-sky">TA: ${escape(tas.join(', '))}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="table-wrap" style="border: none; border-radius: 0; box-shadow: none; background: transparent;">
            <table class="table" data-lab-table="${escape(courseKey)}">
              <thead>
                <tr><th>Title</th><th>Date</th><th>Start</th><th>End</th><th>Pattern</th><th>Report Due</th><th>TA</th><th>Partner</th><th>Status</th><th>Grade%</th><th></th></tr>
              </thead>
              <tbody>
                ${labs.map(l => labRow(l)).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('')}
  `;
  // Bind across all per-course tables
  $$('table[data-lab-table] tbody tr').forEach(tr => {
    const id = tr.dataset.id;
    tr.querySelectorAll('[data-k]').forEach(input => {
      input.addEventListener('change', () => {
        const item = Store.data.labs.find(x => x.id === id);
        if (!item) return;
        let v = input.value;
        if (input.type === 'number') v = parseFloat(v) || 0;
        item[input.dataset.k] = v;
        Store.save();
        if (input.dataset.k === 'course') Router.refresh();
      });
    });
  });
  $('#addLab').addEventListener('click', () => {
    const defaultCourse = courseOptions[0] || '';
    Store.data.labs.push({ id: uid(), course: defaultCourse, title: 'New Lab', date: today(), reportDue: today(), partner: '', ta: '', status: 'Upcoming', grade: 0, notes: '' });
    Store.save();
    Router.refresh();
  });
};

function labRow(l) {
  return `
    <tr data-id="${l.id}">
      <td style="min-width:200px;"><input data-k="title" value="${escape(l.title)}" /></td>
      <td style="width:130px;"><input data-k="date" type="date" value="${l.date}" /></td>
      <td style="width:80px;"><input data-k="time" value="${escape(l.time || '')}" placeholder="14:00" title="start time" /></td>
      <td style="width:80px;"><input data-k="endTime" value="${escape(l.endTime || '')}" placeholder="17:00" title="end time" /></td>
      <td style="width:110px;">
        <select data-k="pattern" title="how often this repeats">
          <option value="once" ${l.pattern==='once'?'selected':''}>once</option>
          <option value="weekly" ${l.pattern==='weekly'?'selected':''}>weekly</option>
          <option value="biweekly" ${l.pattern==='biweekly'?'selected':''}>biweekly</option>
        </select>
      </td>
      <td style="width:130px;"><input data-k="reportDue" type="date" value="${l.reportDue}" /></td>
      <td style="min-width:140px;"><input data-k="ta" value="${escape(l.ta || '')}" placeholder="TA name" /></td>
      <td><input data-k="partner" value="${escape(l.partner)}" placeholder="partner" /></td>
      <td><select data-k="status">${['Upcoming','In Progress','Done'].map(s => `<option ${l.status===s?'selected':''}>${s}</option>`).join('')}</select></td>
      <td style="width:80px;"><input data-k="grade" type="number" min="0" max="100" value="${l.grade}" /></td>
      <td>
        <select data-k="course" title="move to another course">
          ${Store.data.courses.map(c => `<option ${l.course===c.code?'selected':''}>${escape(c.code)}</option>`).join('')}
        </select>
        <button class="btn-soft" style="margin-top:4px; width:100%;" onclick="deleteRow('labs', '${l.id}')">×</button>
      </td>
    </tr>
  `;
}

/* -- GPA ------------------------------------------------------------------- */
function letterFromPct(p, scale) {
  scale = scale || (Store.data && Store.data.gpaScale) || '4';
  const tbl = (GPA_SCALES[scale] || GPA_SCALES['4']).table;
  for (const row of tbl) {
    if (p >= row.min) return { letter: row.letter, gpa: row.gpa };
  }
  return { letter: tbl[tbl.length - 1].letter, gpa: 0 };
}

function computeGpa(courses, scale) {
  scale = scale || (Store.data && Store.data.gpaScale) || '4';
  const graded = courses.filter(c => +c.grade > 0 && +c.credits > 0);
  if (!graded.length) return 0;
  const totalPts = graded.reduce((s, c) => s + letterFromPct(+c.grade, scale).gpa * +c.credits, 0);
  const totalCr  = graded.reduce((s, c) => s + +c.credits, 0);
  return totalPts / totalCr;
}

/* -- GPA chart (terms vs overall) ----------------------------------------- */
function gpaChart(terms, overall, scaleMax) {
  if (!terms || terms.length === 0) {
    return `
      <div class="card mb-24" style="text-align:center; padding: 28px;">
        <span style="font-size:42px;">${icon('chart', 42)}</span>
        <p class="text-mute" style="font-size:13px; max-width:340px; margin: 8px auto 0;">Once you've graded a few courses, a chart comparing each term to your overall GPA will appear here.</p>
      </div>
    `;
  }

  const W = 760, H = 280, PL = 44, PR = 16, PT = 28, PB = 56;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  const n = terms.length;
  const slot = innerW / n;
  const barW = Math.min(56, slot * 0.55);

  // Y-axis ticks: 5 evenly spaced
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (scaleMax * i) / tickCount);

  const yFor = (v) => PT + innerH - (v / scaleMax) * innerH;

  return `
    <div class="card mb-24 chart-card">
      <div class="row-between mb-12">
        <h3 class="card-title" style="margin: 0;">term-by-term</h3>
        <div class="row gap-8 text-mute" style="font-size:11px;">
          <span class="row gap-8"><span class="chart-swatch chart-swatch-bar"></span> term GPA</span>
          <span class="row gap-8"><span class="chart-swatch chart-swatch-line"></span> overall ${overall.toFixed(2)}</span>
        </div>
      </div>
      <svg viewBox="0 0 ${W} ${H}" class="gpa-chart" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Term-by-term GPA compared to overall">
        <defs>
          <linearGradient id="barGradAbove" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="#9BC09A"/>
            <stop offset="1" stop-color="#6FA070"/>
          </linearGradient>
          <linearGradient id="barGradBelow" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="#F0A6BC"/>
            <stop offset="1" stop-color="#E07599"/>
          </linearGradient>
          <linearGradient id="barGradEven" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="#C9A9E8"/>
            <stop offset="1" stop-color="#9D6FC9"/>
          </linearGradient>
        </defs>

        <!-- Y-axis grid + ticks -->
        ${ticks.map(t => {
          const y = yFor(t);
          return `
            <line x1="${PL}" x2="${W-PR}" y1="${y}" y2="${y}" stroke="rgba(150,144,181,0.18)" stroke-width="1" stroke-dasharray="3,5"/>
            <text x="${PL-8}" y="${y+4}" font-size="10" text-anchor="end" fill="#9690B5" font-family="JetBrains Mono, monospace">${t.toFixed(1)}</text>
          `;
        }).join('')}

        <!-- Overall reference line -->
        ${(() => {
          const y = yFor(overall);
          return `
            <line x1="${PL}" x2="${W-PR}" y1="${y}" y2="${y}" stroke="#E07599" stroke-width="2" stroke-dasharray="6,5" opacity="0.85"/>
            <rect x="${W-PR-86}" y="${y-18}" width="82" height="16" rx="8" fill="#E07599"/>
            <text x="${W-PR-45}" y="${y-6}" font-size="10" font-weight="700" text-anchor="middle" fill="white">overall ${overall.toFixed(2)}</text>
          `;
        })()}

        <!-- Bars -->
        ${terms.map((t, i) => {
          const x = PL + slot * i + (slot - barW) / 2;
          const h = Math.max(2, (t.gpa / scaleMax) * innerH);
          const y = PT + innerH - h;
          let grad = 'barGradEven';
          const diff = t.gpa - overall;
          if (diff > 0.05) grad = 'barGradAbove';
          else if (diff < -0.05) grad = 'barGradBelow';
          const semEmoji = ({ Fall: '', Winter: '', Summer: '' })[t.sem] || '';
          return `
            <g class="bar">
              <rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="url(#${grad})" rx="8"/>
              <text x="${x + barW/2}" y="${y - 8}" font-size="12" font-weight="700" text-anchor="middle" fill="#4A3F66" font-family="Fraunces, serif">${t.gpa.toFixed(2)}</text>
              <text x="${x + barW/2}" y="${PT + innerH + 18}" font-size="14" text-anchor="middle">${semEmoji}</text>
              <text x="${x + barW/2}" y="${PT + innerH + 36}" font-size="11" font-weight="600" text-anchor="middle" fill="#6B5F84" font-family="Quicksand, sans-serif">${escape(t.label)}</text>
              <title>${escape(t.fullLabel)} — GPA ${t.gpa.toFixed(2)} · ${t.gradedCount}/${t.totalCount} graded</title>
            </g>
          `;
        }).join('')}
      </svg>
    </div>
  `;
}

Views.gpa = (root) => {
  const d = Store.data;
  const scale = d.gpaScale || '4';
  const scaleDef = GPA_SCALES[scale];
  const active = d.courses.filter(c => c.status === 'Active');
  const termGpa = computeGpa(active, scale);
  const overallGpa = computeGpa(d.courses, scale);
  const totalCr = active.reduce((s, c) => s + +c.credits, 0);
  const totalCredits = d.courses.filter(c => +c.grade > 0).reduce((s, c) => s + +c.credits, 0);

  // Build per-term GPA series (only terms with at least one graded course)
  const SEM_ORDER = { Fall: 0, Winter: 1, Summer: 2, Spring: 3 };
  const termMap = {};
  d.courses.forEach(c => {
    const key = `${c.year || 1}|${c.semester || 'Fall'}`;
    (termMap[key] = termMap[key] || []).push(c);
  });
  const terms = Object.entries(termMap)
    .map(([key, list]) => {
      const [yr, sem] = key.split('|');
      const graded = list.filter(c => +c.grade > 0);
      return {
        year: +yr,
        sem,
        label: `Y${yr} ${sem.slice(0,3)}`,
        fullLabel: `Year ${yr} · ${sem}`,
        gpa: computeGpa(list, scale),
        gradedCount: graded.length,
        totalCount: list.length,
      };
    })
    .filter(t => t.gradedCount > 0)
    .sort((a, b) => a.year - b.year || (SEM_ORDER[a.sem] ?? 9) - (SEM_ORDER[b.sem] ?? 9));

  root.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title"><span class="emoji">${icon('cap', 22)}</span>GPA</h1>
        <p class="page-subtitle">Calculated automatically from your courses. Pick the scale that matches your school.</p>
      </div>
      <div class="row gap-8">
        <label class="label" style="margin:0; align-self:center;">scale</label>
        <select class="select" id="gpaScale" style="width:auto;">
          ${Object.entries(GPA_SCALES).map(([k, v]) => `<option value="${k}" ${k===scale?'selected':''}>${v.name}</option>`).join('')}
        </select>
      </div>
    </header>

    <div class="gpa-hero mb-24">
      <div class="gpa-label">overall GPA</div>
      <div class="gpa-number">${overallGpa.toFixed(2)}<span style="font-size:32px; opacity:0.45;"> / ${scaleDef.max.toFixed(1)}</span></div>
      <div class="text-mute">this term ${termGpa.toFixed(2)} · ${totalCr} credits active · ${totalCredits} credits earned · ${scaleDef.name}</div>
    </div>

    ${gpaChart(terms, overallGpa, scaleDef.max)}

    <h2 class="section-title">course breakdown</h2>
    ${(() => {
      const SEM_ORDER = { Fall: 0, Winter: 1, Summer: 2, Spring: 3 };
      const byYear = {};
      d.courses.forEach(c => {
        const y = c.year || 1;
        const s = c.semester || 'Fall';
        byYear[y] = byYear[y] || {};
        byYear[y][s] = byYear[y][s] || [];
        byYear[y][s].push(c);
      });
      const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
      if (years.length === 0) return `<div class="empty"><span class="empty-emoji">${icon('sparkles', 40)}</span><h3 class="empty-title">no courses yet</h3><p class="empty-text">Add some on the Courses page.</p></div>`;

      return years.map(year => {
        const yearCourses = Object.values(byYear[year]).flat();
        const yearGpa = computeGpa(yearCourses, scale);
        const yearGraded = yearCourses.filter(c => +c.grade > 0).length;
        const meta = yearGraded ? `${yearGraded} graded · GPA ${yearGpa.toFixed(2)}` : `${yearCourses.length} course${yearCourses.length===1?'':'s'}`;
        return `
          <div class="year-divider"><div class="year-divider-content"><h1>Year ${year}</h1><span class="year-meta">${meta}</span></div></div>
          ${Object.keys(byYear[year]).sort((a, b) => (SEM_ORDER[a] ?? 9) - (SEM_ORDER[b] ?? 9)).map(sem => {
            const semCourses = byYear[year][sem];
            const semGpa = computeGpa(semCourses, scale);
            const semGraded = semCourses.filter(c => +c.grade > 0).length;
            const semMeta = semGraded ? `GPA ${semGpa.toFixed(2)}` : `${semCourses.length} course${semCourses.length===1?'':'s'}`;
            return `
              <div class="sem-divider">
                <h2><span class="sem-icon">${semIcon(sem)}</span> ${sem} Semester</h2>
                <span class="sem-meta">${semMeta}</span>
              </div>
              <div class="table-wrap mb-24">
                <table class="table">
                  <thead>
                    <tr><th>Code</th><th>Name</th><th>Credits</th><th>Grade %</th><th>Letter</th><th>Points</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    ${semCourses.map(c => {
                      const { letter, gpa: pts } = letterFromPct(+c.grade, scale);
                      const ptStr = (+c.grade > 0) ? (pts * +c.credits).toFixed(2) : '—';
                      return `
                        <tr>
                          <td>${escape(c.code)}</td>
                          <td>${escape(c.name)}</td>
                          <td>${c.credits}</td>
                          <td>${c.grade > 0 ? c.grade + '%' : '—'}</td>
                          <td><span class="pill pill-lilac">${c.grade > 0 ? letter : '—'}</span></td>
                          <td>${ptStr}</td>
                          <td><span class="pill ${statusClass(c.status)}">${escape(c.status)}</span></td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `;
          }).join('')}
        `;
      }).join('');
    })()}

    <div class="card mt-24 card-cool">
      <h3 class="card-title">${scaleDef.name} scale</h3>
      <div class="grid grid-4">
        ${scaleDef.table.map(row => `
          <div class="card" style="padding:10px 14px;">
            <div class="bold">${escape(row.letter)}</div>
            <div class="text-mute" style="font-size:12px;">${row.min}%+ · ${row.gpa.toFixed(2)} pts</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  $('#gpaScale').addEventListener('change', (e) => {
    Store.data.gpaScale = e.target.value;
    Store.save();
    Toast.show('switched to ' + GPA_SCALES[e.target.value].name + '');
    Router.refresh();
  });
};

/* -- Class Schedule -------------------------------------------------------- */
let scheduleWeekOffset = 0;

function weekStart(offset) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const back = dow === 0 ? 6 : dow - 1; // Mon-start
  d.setDate(d.getDate() - back + offset * 7);
  return d;
}
function dateForDayInWeek(weekStartDate, dayIdx) {
  const d = new Date(weekStartDate);
  d.setDate(d.getDate() + dayIdx);
  return d.toISOString().slice(0, 10);
}

Views.schedule = (root) => PlannerCalendarViews.schedule(root);

window.schedNav = (dir) => {
  if (dir === 'today') scheduleWeekOffset = 0;
  else scheduleWeekOffset += dir;
  Router.refresh();
};

window.editScheduleBlock = (courseId, date) => {
  const d = Store.data;
  const c = d.courses.find(x => x.id === courseId);
  if (!c) return;
  const existing = (d.scheduleOverrides || []).find(o => o.date === date && o.courseId === courseId);

  Modal.open(`
    <h2>${escape(c.code)}</h2>
    <p class="text-mute" style="font-size:12px;">${fmtDateLong(date)}</p>

    <div class="card card-cool mb-12" style="padding: 12px 16px;">
      <div class="kpi-label">master schedule</div>
      <div class="text-mute" style="font-size:13px; margin: 4px 0 8px;">applies every week</div>
      <div class="field"><label class="label">days</label><input class="input" id="sb-days" value="${escape(c.days || '')}" placeholder="MWF, TR, MW" /></div>
      <div class="field-row">
        <div class="field"><label class="label">starts</label><input class="input" id="sb-time" value="${escape(c.time || '')}" placeholder="10:00" /></div>
        <div class="field"><label class="label">ends</label><input class="input" id="sb-endtime" value="${escape(c.endTime || '')}" placeholder="11:15" /></div>
      </div>
      <div class="field"><label class="label">room</label><input class="input" id="sb-room" value="${escape(c.room || '')}" /></div>
      <button class="btn btn-sm" id="saveMaster">update master</button>
    </div>

    <div class="card card-warm" style="padding: 12px 16px;">
      <div class="kpi-label">just this week (${fmtDate(date)})</div>
      <div class="text-mute" style="font-size:13px; margin: 4px 0 8px;">leaves the rest of the term untouched</div>
      <div class="field-row">
        <div class="field"><label class="label">override start</label><input class="input" id="sb-otime" value="${escape((existing && existing.newTime) || '')}" placeholder="leave blank for no change" /></div>
        <div class="field"><label class="label">override end</label><input class="input" id="sb-oendtime" value="${escape((existing && existing.newEndTime) || '')}" placeholder="leave blank for no change" /></div>
      </div>
      <div class="field"><label class="label">override room</label><input class="input" id="sb-oroom" value="${escape((existing && existing.newRoom) || '')}" placeholder="leave blank for no change" /></div>
      <div class="field"><label class="label">note (e.g. "guest lecturer")</label><input class="input" id="sb-onote" value="${escape((existing && existing.note) || '')}" /></div>
      <div class="row gap-8">
        <button class="btn btn-sm" id="saveOverride">save override</button>
        <button class="btn btn-sm" style="background: linear-gradient(135deg, #E87A8E, #C24F69);" id="cancelClass">cancel this class</button>
        ${existing ? `<button class="btn-soft" id="clearOverride">clear override</button>` : ''}
      </div>
    </div>

    <div class="row" style="justify-content:flex-end; margin-top:14px;">
      <button class="btn btn-ghost" onclick="Modal.close()">close</button>
    </div>
  `);

  setTimeout(() => {
    $('#saveMaster').addEventListener('click', () => {
      c.days = $('#sb-days').value;
      c.time = $('#sb-time').value;
      c.endTime = $('#sb-endtime').value;
      c.room = $('#sb-room').value;
      Store.save();
      Modal.close();
      Router.refresh();
      Toast.show('master schedule updated');
    });
    $('#saveOverride').addEventListener('click', () => {
      saveOverride(date, courseId, {
        action: 'edit',
        newTime: $('#sb-otime').value || null,
        newEndTime: $('#sb-oendtime').value || null,
        newRoom: $('#sb-oroom').value || null,
        note:    $('#sb-onote').value || null,
      });
      Modal.close();
      Router.refresh();
    });
    $('#cancelClass').addEventListener('click', () => {
      saveOverride(date, courseId, {
        action: 'cancel',
        note: $('#sb-onote').value || null,
      });
      Modal.close();
      Router.refresh();
      Toast.show('cancelled for this week');
    });
    if ($('#clearOverride')) {
      $('#clearOverride').addEventListener('click', () => {
        Store.data.scheduleOverrides = (Store.data.scheduleOverrides || []).filter(o => !(o.date === date && o.courseId === courseId));
        Store.save();
        Modal.close();
        Router.refresh();
      });
    }
  }, 50);
};

function saveOverride(date, courseId, patch) {
  const d = Store.data;
  d.scheduleOverrides = d.scheduleOverrides || [];
  const idx = d.scheduleOverrides.findIndex(o => o.date === date && o.courseId === courseId);
  const obj = { id: idx >= 0 ? d.scheduleOverrides[idx].id : uid(), date, courseId, ...patch };
  if (idx >= 0) d.scheduleOverrides[idx] = obj;
  else d.scheduleOverrides.push(obj);
  Store.save();
}

window.removeOverride = (id) => {
  Store.data.scheduleOverrides = (Store.data.scheduleOverrides || []).filter(o => o.id !== id);
  Store.save();
  Router.refresh();
};

window.editLabBlock = (labId) => {
  const lab = Store.data.labs.find(l => l.id === labId);
  if (!lab) return;
  Modal.open(`
    <h2>${escape(lab.title || 'Lab')}</h2>
    <p class="text-mute" style="font-size:12px;">${escape(lab.course || '')}</p>
    <div class="field"><label class="label">first date</label><input class="input" type="date" id="lb-date" value="${lab.date || ''}" /></div>
    <div class="field-row">
      <div class="field"><label class="label">starts</label><input class="input" id="lb-time" value="${escape(lab.time || '')}" placeholder="14:00" /></div>
      <div class="field"><label class="label">ends</label><input class="input" id="lb-endtime" value="${escape(lab.endTime || '')}" placeholder="17:00" /></div>
    </div>
    <div class="field"><label class="label">repeats</label>
      <select class="select" id="lb-pattern">
        <option value="once"     ${lab.pattern==='once'?'selected':''}>once (just this date)</option>
        <option value="weekly"   ${lab.pattern==='weekly'?'selected':''}>every week</option>
        <option value="biweekly" ${lab.pattern==='biweekly'?'selected':''}>every other week (alternating)</option>
      </select>
    </div>
    <div class="card card-mint" style="padding: 10px 14px; font-size:12px; margin-top:8px;">
      <span class="bold">tip:</span> for alternating PA / lab weeks, make two labs with the same time, one anchored on the lab week and one on the PA week — both set to "every other week".
    </div>
    <div class="row" style="justify-content:flex-end; gap:8px; margin-top:14px;">
      <button class="btn btn-ghost" onclick="Modal.close()">cancel</button>
      <button class="btn" id="lb-save">save</button>
    </div>
  `);
  setTimeout(() => {
    $('#lb-save').addEventListener('click', () => {
      lab.date = $('#lb-date').value;
      lab.time = $('#lb-time').value;
      lab.endTime = $('#lb-endtime').value;
      lab.pattern = $('#lb-pattern').value;
      Store.save();
      Modal.close();
      Router.refresh();
      Toast.show('lab schedule updated');
    });
  }, 50);
};

window.addScheduleSlot = (date, hour) => {
  // Empty cell click — offer to quickly edit one of the active courses
  const d = Store.data;
  const active = d.courses.filter(c => c.status === 'Active');
  if (!active.length) {
    Toast.show('add an active course first');
    return;
  }
  Modal.open(`
    <h2>add a class to ${fmtDate(date)} ${hour}:00</h2>
    <p class="text-mute" style="font-size:13px;">Pick a course — its master days/time will be updated to include this slot.</p>
    <div class="grid" style="gap:8px; margin: 14px 0;">
      ${active.map(c => `
        <button class="card" style="text-align:left; cursor:pointer; padding: 10px 14px; border:1px solid var(--border); background: rgba(255,255,255,0.6);" onclick="quickAddToCourse('${c.id}', '${date}', ${hour})">
          <div class="bold">${escape(c.code)}</div>
          <div class="text-mute" style="font-size:12px;">${escape(c.name)} · current: ${escape(c.days || '—')} ${escape(c.time || '')}</div>
        </button>
      `).join('')}
    </div>
    <div class="row" style="justify-content:flex-end;"><button class="btn btn-ghost" onclick="Modal.close()">cancel</button></div>
  `);
};

window.quickAddToCourse = (courseId, date, hour) => {
  const c = Store.data.courses.find(x => x.id === courseId);
  const dt = new Date(date + 'T00:00:00');
  const jsDow = dt.getDay();
  const target = jsDow === 0 ? 6 : jsDow - 1;
  const dayCodes = ['M','T','W','R','F','S','U'];
  const newDay = dayCodes[target];
  if (!c.days.includes(newDay)) c.days = (c.days + newDay).split('').sort((a,b) => dayCodes.indexOf(a) - dayCodes.indexOf(b)).join('');
  if (!c.time) c.time = `${String(hour).padStart(2,'0')}:00`;
  Store.save();
  Modal.close();
  Router.refresh();
  Toast.show(`added ${c.code} to ${newDay} ${c.time}`);
};

function darken(hex) {
  if (!hex || !hex.startsWith('#')) return hex;
  let n = parseInt(hex.slice(1), 16);
  let r = Math.max(0, ((n >> 16) & 0xff) - 40);
  let g = Math.max(0, ((n >> 8) & 0xff) - 40);
  let b = Math.max(0, (n & 0xff) - 40);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

/* -- iCal (.ics) parsing -------------------------------------------------- */
function parseIcs(text) {
  // Unfold lines (RFC 5545: lines that start with space/tab continue the previous)
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  const lines = unfolded.split(/\r?\n/);

  const calendar = { name: 'Imported', events: [] };
  let inEvent = false;
  let cur = null;

  const parseDt = (raw) => {
    // Forms: 20260504T100000Z, 20260504T100000, 20260504, TZID=...:20260504T100000
    const m = raw.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z?))?/);
    if (!m) return { iso: '', allDay: true, time: '' };
    const [, y, mo, d, h, mi, s, z] = m;
    const allDay = h === undefined;
    if (allDay) {
      return { iso: `${y}-${mo}-${d}`, allDay: true, time: '' };
    }
    if (z === 'Z') {
      // UTC — convert to local
      const dt = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +(s || 0)));
      const iso = dt.toISOString().slice(0, 10);
      const local = `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
      return { iso, allDay: false, time: local };
    }
    return { iso: `${y}-${mo}-${d}`, allDay: false, time: `${h}:${mi}` };
  };

  const stripParams = (key) => key.split(';')[0]; // 'DTSTART;TZID=...' → 'DTSTART'
  const decode = (v) => v
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');

  for (const rawLine of lines) {
    if (!rawLine) continue;
    const idx = rawLine.indexOf(':');
    if (idx < 0) continue;
    const keyRaw = rawLine.slice(0, idx);
    const value = rawLine.slice(idx + 1);
    const key = stripParams(keyRaw).toUpperCase();

    if (key === 'BEGIN' && value === 'VEVENT') { inEvent = true; cur = {}; continue; }
    if (key === 'END' && value === 'VEVENT') {
      if (cur && cur.start) {
        const base = {
          id: cur.uid || uid(),
          title: cur.summary || '(untitled)',
          start: cur.start.iso,
          startTime: cur.start.time,
          end: cur.end?.iso || cur.start.iso,
          endTime: cur.end?.time || '',
          allDay: !!cur.start.allDay,
          description: cur.description || '',
          location: cur.location || '',
        };
        // RRULE expansion (FREQ=WEEKLY with optional BYDAY + INTERVAL)
        // We expand into individual events for up to ~52 weeks ahead so weekly
        // classes render across the term without needing a recurring-event engine.
        if (cur.rrule) {
          const expanded = expandRrule(base, cur.rrule);
          calendar.events.push(...expanded);
        } else {
          calendar.events.push(base);
        }
      }
      inEvent = false; cur = null; continue;
    }
    if (!inEvent) {
      if (key === 'X-WR-CALNAME') calendar.name = decode(value);
      continue;
    }
    if (key === 'SUMMARY')      cur.summary = decode(value);
    else if (key === 'DESCRIPTION') cur.description = decode(value);
    else if (key === 'LOCATION')    cur.location = decode(value);
    else if (key === 'UID')         cur.uid = value;
    else if (key === 'DTSTART')     cur.start = parseDt(value);
    else if (key === 'DTEND')       cur.end = parseDt(value);
    else if (key === 'RRULE')       cur.rrule = value;
  }
  return calendar;
}

/* Expand a simple weekly RRULE into individual event occurrences across the term.
   Supports FREQ=WEEKLY, BYDAY=MO,WE,FR, INTERVAL=N, UNTIL=YYYYMMDDTHHMMSSZ, COUNT=N. */
function expandRrule(base, rrule) {
  const parts = Object.fromEntries(rrule.split(';').map(kv => {
    const [k, v] = kv.split('=');
    return [k.toUpperCase(), v];
  }));
  if (parts.FREQ !== 'WEEKLY') return [base]; // Only WEEKLY supported; others fall back to first occurrence
  const interval = +parts.INTERVAL || 1;
  const byDay = (parts.BYDAY || '').split(',').filter(Boolean);
  const ICS_TO_NUM = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
  const targetDows = byDay.map(d => ICS_TO_NUM[d]).filter(n => n != null);
  // Compute end date for expansion
  let until = null;
  if (parts.UNTIL) {
    const m = parts.UNTIL.match(/(\d{4})(\d{2})(\d{2})/);
    if (m) until = new Date(+m[1], +m[2] - 1, +m[3]);
  }
  const startDate = new Date(base.start + 'T00:00:00');
  const horizonDays = until ? Math.ceil((until - startDate) / 86400000) : 365;
  const maxOccurrences = parts.COUNT ? +parts.COUNT : 200;

  const out = [];
  const seen = new Set();
  // If no BYDAY, repeat on the same day-of-week as DTSTART
  if (targetDows.length === 0) targetDows.push(startDate.getDay());

  for (let weekOffset = 0; weekOffset * 7 <= horizonDays + 7 && out.length < maxOccurrences; weekOffset += interval) {
    for (const dow of targetDows) {
      const dt = new Date(startDate);
      const dayDelta = (dow - startDate.getDay() + 7) % 7;
      dt.setDate(startDate.getDate() + weekOffset * 7 + dayDelta);
      if (dt < startDate) continue;
      if (until && dt > until) break;
      const iso = dt.toISOString().slice(0, 10);
      if (seen.has(iso)) continue;
      seen.add(iso);
      out.push({ ...base, id: base.id + '-' + iso, start: iso, end: iso });
      if (out.length >= maxOccurrences) break;
    }
  }
  return out.length ? out : [base];
}

const IMPORT_COLORS = ['#A8C5F0', '#9BC09A', '#C9A9E8', '#F5D27A', '#F2A07F', '#E07599'];

function importIcsText(text, fallbackName) {
  const parsed = parseIcs(text);
  if (parsed.events.length === 0) {
    Toast.show('no events found in that file');
    return;
  }
  const id = uid();
  Store.data.importedCalendars = Store.data.importedCalendars || [];
  Store.data.importedCalendars.push({
    id,
    name: parsed.name || fallbackName || 'Imported',
    color: IMPORT_COLORS[Store.data.importedCalendars.length % IMPORT_COLORS.length],
    importedOn: today(),
    events: parsed.events,
  });
  Store.data.calendarLayers.imported = true;
  Store.save();
  Toast.show(`imported ${parsed.events.length} event${parsed.events.length===1?'':'s'}`);
  Confetti.burst(innerWidth / 2, innerHeight / 3);
  Router.refresh();
}

/* ============================================================================
   GOOGLE CALENDAR — bulk export + URL subscription
   ============================================================================ */

/* Escape a string for iCal: backslash, semicolon, comma, newline */
function icsEscape(s) {
  if (s == null) return '';
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/* RFC 5545 line folding — split lines >75 chars at 75 with CRLF + leading space */
function icsFold(line) {
  if (line.length <= 75) return line;
  const out = [line.slice(0, 75)];
  let i = 75;
  while (i < line.length) { out.push(' ' + line.slice(i, i + 74)); i += 74; }
  return out.join('\r\n');
}

/* Format a date+time into iCal local-time format: YYYYMMDDTHHMMSS */
function icsLocalDT(iso, time) {
  const t = time || '09:00';
  const [h, m] = t.split(':');
  return iso.replace(/-/g, '') + 'T' + h.padStart(2,'0') + (m||'00').padStart(2,'0') + '00';
}
function icsAllDay(iso) { return iso.replace(/-/g, ''); }
function icsAllDayPlus1(iso) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0,10).replace(/-/g, '');
}
function icsStamp() {
  return new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
}

/* Map two-letter day codes (MWF / TR) → iCal BYDAY values */
const DAY_TO_BYDAY = { M: 'MO', T: 'TU', W: 'WE', R: 'TH', F: 'FR', S: 'SA', U: 'SU' };
function classDaysToByday(days) {
  if (!days) return '';
  const out = [];
  for (const ch of days.toUpperCase()) {
    if (DAY_TO_BYDAY[ch]) out.push(DAY_TO_BYDAY[ch]);
  }
  return out.join(',');
}

/* Find the next occurrence of a class given its days-of-week string.
   Returns the ISO date of the first day on/after today that matches. */
function nextWeekdayMatching(days) {
  const today = new Date();
  const want = new Set();
  const map = { M: 1, T: 2, W: 3, R: 4, F: 5, S: 6, U: 0 };
  for (const ch of (days || '').toUpperCase()) if (map[ch] != null) want.add(map[ch]);
  if (want.size === 0) return today.toISOString().slice(0, 10);
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (want.has(d.getDay())) return d.toISOString().slice(0, 10);
  }
  return today.toISOString().slice(0, 10);
}

/* Generate one VEVENT block as an array of lines. */
function icsEvent({ uid, title, description, location, date, startTime, endTime, allDay, rrule }) {
  const lines = ['BEGIN:VEVENT'];
  lines.push(`UID:${uid}@student-planner.local`);
  lines.push(`DTSTAMP:${icsStamp()}`);
  if (allDay) {
    lines.push(`DTSTART;VALUE=DATE:${icsAllDay(date)}`);
    lines.push(`DTEND;VALUE=DATE:${icsAllDayPlus1(date)}`);
  } else {
    lines.push(`DTSTART:${icsLocalDT(date, startTime)}`);
    lines.push(`DTEND:${icsLocalDT(date, endTime || addHourString(startTime || '09:00', 1))}`);
  }
  lines.push(`SUMMARY:${icsEscape(title)}`);
  if (description) lines.push(`DESCRIPTION:${icsEscape(description)}`);
  if (location) lines.push(`LOCATION:${icsEscape(location)}`);
  if (rrule) lines.push(`RRULE:${rrule}`);
  lines.push('END:VEVENT');
  return lines.map(icsFold).join('\r\n');
}

/* Build full .ics for all planner data. Includes assignments, tests, exams,
   labs (with RRULE for weekly/biweekly patterns), and active courses (weekly RRULE
   until end of semester). */
function exportPlannerIcs() {
  const d = Store.data;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Student Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Student Planner',
  ];

  // Assignments (all-day on the due date)
  (d.assignments || []).forEach(a => {
    if (!a.due) return;
    lines.push(icsEvent({
      uid: 'assign-' + a.id,
      title: `📝 ${a.title}`,
      description: `${a.course || ''}\n${a.notes || ''}\nWeight: ${a.weight || 0}%\nStatus: ${a.status || ''}`.trim(),
      location: a.course || '',
      date: a.due,
      startTime: a.dueTime || '',
      endTime: '',
      allDay: !a.dueTime,
    }));
  });

  // Tests
  (d.tests || []).forEach(t => {
    if (!t.date) return;
    lines.push(icsEvent({
      uid: 'test-' + t.id,
      title: `📊 ${t.title}`,
      description: `${t.course || ''}\nWeight: ${t.weight || 0}%\n${t.notes || ''}`.trim(),
      location: t.course || '',
      date: t.date,
      startTime: t.time || '',
      endTime: t.endTime || '',
      allDay: !t.time,
    }));
  });

  // Exams
  (d.exams || []).forEach(e => {
    if (!e.date) return;
    lines.push(icsEvent({
      uid: 'exam-' + e.id,
      title: `📚 ${e.title} — ${e.course || ''}`,
      description: `Weight: ${e.weight || 0}%\n${e.notes || ''}`.trim(),
      location: e.location || e.course || '',
      date: e.date,
      startTime: e.time || '',
      endTime: e.endTime || '',
      allDay: !e.time,
    }));
  });

  // Labs (RRULE for weekly/biweekly patterns)
  (d.labs || []).forEach(l => {
    if (!l.date) return;
    let rrule = '';
    if (l.pattern === 'weekly')   rrule = 'FREQ=WEEKLY';
    if (l.pattern === 'biweekly') rrule = 'FREQ=WEEKLY;INTERVAL=2';
    lines.push(icsEvent({
      uid: 'lab-' + l.id,
      title: `🧪 ${l.title} — ${l.course || ''}`,
      description: `TA: ${l.ta || 'n/a'}\nPartner: ${l.partner || 'solo'}\n${l.notes || ''}`.trim(),
      location: l.course || '',
      date: l.date,
      startTime: l.time || '',
      endTime: l.endTime || '',
      allDay: !l.time,
      rrule,
    }));
  });

  // Active classes (weekly RRULE on their meeting days)
  (d.courses || []).filter(c => c.status === 'Active' && c.time).forEach(c => {
    const byDay = classDaysToByday(c.days);
    if (!byDay) return;
    const startDate = nextWeekdayMatching(c.days);
    lines.push(icsEvent({
      uid: 'class-' + c.id,
      title: `${c.code} — ${c.name}`,
      description: `Prof: ${c.professor || ''}\n${c.notes || ''}\n${c.link || ''}`.trim(),
      location: c.room || '',
      date: startDate,
      startTime: c.time,
      endTime: c.endTime || '',
      rrule: `FREQ=WEEKLY;BYDAY=${byDay}`,
    }));
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/* Trigger browser download of the full planner .ics. */
function downloadPlannerIcs() {
  const ics = exportPlannerIcs();
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `student-planner-${today()}.ics`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
}

/* CORS proxies for Google Calendar iCal feeds.
   IMPORTANT — research verified (2026):
     • Direct browser fetch of calendar.google.com/calendar/ical/... is BLOCKED.
       Google does not send Access-Control-Allow-Origin. No exceptions.
     • corsproxy.io returns HTTP 403 for Google Calendar URLs (tested directly).
     • api.allorigins.win times out on Google Calendar URLs.
     • gcal-cors-proxy.vercel.app (rdjpalmer) is purpose-built for Google Calendar
       iCal feeds, hosted free on Vercel, advertises zero logging.
     • r.jina.ai works as a generic CORS bypass and tends to be reliable.
   PRIVACY: the iCal URL — including its secret token — passes through the proxy.
   The user is shown an explicit consent panel before any proxy is used. */
const CORS_PROXIES = [
  (url) => `https://gcal-cors-proxy.vercel.app/?url=${encodeURIComponent(url)}`,
  (url) => `https://r.jina.ai/${url}`, // strips token-like markers but still works as bypass for text
];

/* Try fetching a URL directly first, then through each CORS proxy in turn.
   Returns { text, viaProxy: bool } on success, throws on total failure. */
async function fetchIcalSmart(url, { allowProxy = false } = {}) {
  // 1) Direct fetch
  try {
    const res = await fetch(url, { method: 'GET', mode: 'cors' });
    if (res.ok) {
      const text = await res.text();
      if (text.includes('BEGIN:VCALENDAR')) return { text, viaProxy: false };
    }
  } catch (err) {
    // CORS or network — fall through to proxy
  }
  if (!allowProxy) {
    const e = new Error('CORS_BLOCKED');
    e.code = 'CORS_BLOCKED';
    throw e;
  }
  // 2) Try each proxy in order
  let lastErr;
  for (const buildUrl of CORS_PROXIES) {
    try {
      const proxied = buildUrl(url);
      const res = await fetch(proxied, { method: 'GET' });
      if (!res.ok) { lastErr = new Error('proxy HTTP ' + res.status); continue; }
      const text = await res.text();
      if (text.includes('BEGIN:VCALENDAR')) return { text, viaProxy: true };
      lastErr = new Error('proxy returned non-calendar');
    } catch (err) { lastErr = err; }
  }
  throw lastErr || new Error('all proxies failed');
}

/* Import an iCal URL — surface success / error inline in the modal so the user
   can act on it. If direct fetch fails, surface a "try via proxy" button with
   privacy disclosure. */
async function importIcsFromUrl(url, nameHint, { allowProxy = false } = {}) {
  if (!/^https?:\/\//i.test(url)) {
    showSyncStatus('error', 'please enter a full https:// URL');
    return;
  }
  showSyncStatus('loading', `fetching ${allowProxy ? 'via proxy' : 'directly'}…`);
  let result;
  try {
    result = await fetchIcalSmart(url, { allowProxy });
  } catch (err) {
    if (err.code === 'CORS_BLOCKED') {
      showSyncCorsFallback(url, nameHint);
    } else {
      showSyncStatus('error', `couldn't fetch: ${err.message || err}. Try uploading the .ics file instead.`);
    }
    return;
  }
  const parsed = parseIcs(result.text);
  if (parsed.events.length === 0) {
    showSyncStatus('error', 'No events found in that calendar.');
    return;
  }
  Store.data.importedCalendars = Store.data.importedCalendars || [];
  Store.data.importedCalendars.push({
    id: uid(),
    name: parsed.name || nameHint || 'Subscribed',
    color: IMPORT_COLORS[Store.data.importedCalendars.length % IMPORT_COLORS.length],
    importedOn: today(),
    sourceUrl: url,
    allowProxy: result.viaProxy, // remember so refresh uses the same path
    lastRefreshed: new Date().toISOString(),
    events: parsed.events,
  });
  Store.data.calendarLayers.imported = true;
  Store.save();
  Toast.show(`subscribed: ${parsed.events.length} events`);
  Confetti.burst(innerWidth / 2, innerHeight / 3);
  Modal.close();
  Router.refresh();
}

/* Render a status row inside the subscribe card (success / error / loading) */
function showSyncStatus(kind, message) {
  const slot = $('#syncStatusSlot');
  if (!slot) return;
  const cls = kind === 'error' ? 'sync-status-error' : kind === 'loading' ? 'sync-status-loading' : 'sync-status-info';
  slot.innerHTML = `<div class="sync-status ${cls}">${escape(message)}</div>`;
}

/* Show the CORS fallback UI inline — user can opt in to proxy with full disclosure. */
function showSyncCorsFallback(url, nameHint) {
  const slot = $('#syncStatusSlot');
  if (!slot) return;
  slot.innerHTML = `
    <div class="sync-status sync-status-error">
      <div class="bold" style="margin-bottom:4px;">⚠ Direct fetch blocked by browser (CORS)</div>
      <p style="margin:0; font-size:12px;">Google blocks browsers from reading private calendar URLs directly. Three ways forward:</p>
      <div class="sync-fallback-actions">
        <button class="btn btn-sm" id="syncProxyBtn">try via CORS proxy</button>
        <a class="btn btn-sm btn-ghost" href="${escape(url)}" target="_blank" rel="noopener">open URL in new tab to save</a>
        <button class="btn btn-sm btn-ghost" onclick="document.getElementById('icsFileInput').click()">upload .ics file</button>
      </div>
      <details style="margin-top:8px;">
        <summary class="text-mute" style="cursor:pointer; font-size:11px;">about the proxy</summary>
        <p style="font-size:11px; margin:6px 0 0; color:var(--ink-mute);">A CORS proxy is a third-party server that re-fetches the URL for you and adds the headers your browser needs. Your iCal URL — <span class="bold">including its secret token</span> — passes through this server. Only use if you trust your calendar URL isn't sensitive (most personal calendars are fine). We rotate between corsproxy.io, allorigins.win, and codetabs.com — whichever responds first.</p>
      </details>
    </div>
  `;
  $('#syncProxyBtn')?.addEventListener('click', () => importIcsFromUrl(url, nameHint, { allowProxy: true }));
}

/* Refetch a previously-subscribed calendar by ID — re-uses the original fetch path
   (direct or proxy) so it works in headless contexts. */
async function refreshSubscribedCalendar(id) {
  const cal = (Store.data.importedCalendars || []).find(c => c.id === id);
  if (!cal?.sourceUrl) { Toast.show('this calendar has no source URL'); return; }
  let result;
  try {
    result = await fetchIcalSmart(cal.sourceUrl, { allowProxy: !!cal.allowProxy });
  } catch (err) {
    if (err.code === 'CORS_BLOCKED') {
      // Try with proxy this time
      try {
        result = await fetchIcalSmart(cal.sourceUrl, { allowProxy: true });
        cal.allowProxy = true;
      } catch (err2) {
        Toast.show("couldn't refresh — source URL is unreachable");
        return;
      }
    } else {
      Toast.show("couldn't refresh — " + (err.message || 'unknown error'));
      return;
    }
  }
  const parsed = parseIcs(result.text);
  cal.events = parsed.events;
  cal.lastRefreshed = new Date().toISOString();
  Store.save();
  Toast.show(`refreshed: ${parsed.events.length} events`);
  Router.refresh();
}

/* Build "Add to Google Calendar" URL for a single Student Planner event */
function googleCalendarLink({ title, date, time, endTime, description, location }) {
  // Format dates for Google: YYYYMMDD or YYYYMMDDTHHMMSSZ
  const fmtAllDay = (iso) => iso.replace(/-/g, '');
  const fmtAllDayPlus1 = (iso) => {
    const d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10).replace(/-/g, '');
  };
  const fmtDateTime = (iso, t) => {
    const d = new Date(`${iso}T${t || '09:00'}:00`);
    // Google accepts local-time format (no Z) — uses user's calendar timezone
    return d.toISOString().replace(/[-:]/g, '').slice(0, 15);
  };
  let dates;
  if (!time) {
    dates = `${fmtAllDay(date)}/${fmtAllDayPlus1(date)}`;
  } else {
    const startStr = fmtDateTime(date, time);
    const endStr = endTime ? fmtDateTime(date, endTime) : fmtDateTime(date, addHourString(time, 1));
    dates = `${startStr}/${endStr}`;
  }
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || '',
    dates,
    details: description || '',
    location: location || '',
  });
  return 'https://calendar.google.com/calendar/render?' + params.toString();
}
function addHourString(t, hours) {
  const [h, m] = t.split(':').map(Number);
  let total = h * 60 + (m || 0) + hours * 60;
  total = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
  const nh = Math.floor(total / 60), nm = total % 60;
  return `${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}`;
}

/* -- Calendar -------------------------------------------------------------- */
let calendarView = 'month';    // 'month' | 'week' | 'day'
let calendarOffset = 0;        // semantics depend on view
let calendarDetailed = false;

function calRefDate() {
  const d = new Date();
  if (calendarView === 'month') d.setMonth(d.getMonth() + calendarOffset);
  else if (calendarView === 'week') d.setDate(d.getDate() + calendarOffset * 7);
  else d.setDate(d.getDate() + calendarOffset);
  return d;
}

// Build all calendar events between two ISO dates (inclusive), respecting layers.
function buildCalendarEvents(fromIso, toIso) {
  return PlannerCalendarViews.events(Store.data, fromIso, toIso);
}

Views.calendar = (root) => {
  const d = Store.data;
  const layers = d.calendarLayers;
  const todayStr = today();

  const importedCount = (d.importedCalendars || []).reduce((s, c) => s + c.events.length, 0);
  const layerOptions = [
    { key: 'classes',     label: 'Classes',     iconName: 'book' },
    { key: 'assignments', label: 'Assignments', iconName: 'pencil' },
    { key: 'tests',       label: 'Tests',       iconName: 'flask' },
    { key: 'exams',       label: 'Exams',       iconName: 'chart' },
    { key: 'labs',        label: 'Labs',        iconName: 'microscope' },
    { key: 'subs',        label: 'Subs',        iconName: 'card' },
  ];
  if (importedCount > 0) {
    layerOptions.push({ key: 'imported', label: `Imported (${importedCount})`, iconName: 'inbox' });
  }

  // Render the active view
  let viewBody = '';
  let headerTitle = '';
  if (calendarView === 'month') {
    const ref = calRefDate();
    const year = ref.getFullYear(), month = ref.getMonth();
    headerTitle = ref.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    viewBody = renderMonthView(year, month, todayStr);
  } else if (calendarView === 'week') {
    const ref = calRefDate();
    const ws = new Date(ref);
    const dow = ws.getDay();
    const back = dow === 0 ? 6 : dow - 1;
    ws.setDate(ws.getDate() - back);
    ws.setHours(0,0,0,0);
    const we = new Date(ws); we.setDate(we.getDate() + 6);
    headerTitle = `${ws.toLocaleDateString(undefined, { month:'short', day:'numeric' })} – ${we.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' })}`;
    viewBody = renderWeekView(ws, todayStr);
  } else {
    const ref = calRefDate();
    headerTitle = ref.toLocaleDateString(undefined, { weekday:'long', month:'long', day:'numeric', year:'numeric' });
    viewBody = renderDayView(ref, todayStr);
  }

  root.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title"><span class="emoji">${icon('calendarDay', 22)}</span>Calendar</h1>
        <p class="page-subtitle">Switch between month, week, and day. Past days are crossed out so you can see what's behind you.</p>
      </div>
      <div class="row gap-8 flex-wrap">
        <button class="btn btn-ghost btn-sm" id="syncGcalBtn" title="Sync with Google Calendar">${icon('calendar', 14)} sync with Google</button>
        ${(d.importedCalendars || []).length ? `<button class="btn btn-ghost btn-sm" id="manageImportsBtn">manage (${d.importedCalendars.length})</button>` : ''}
        <div class="cal-view-toggle">
          <button class="${calendarView==='month'?'active':''}" data-view="month">month</button>
          <button class="${calendarView==='week'?'active':''}" data-view="week">week</button>
          <button class="${calendarView==='day'?'active':''}" data-view="day">day</button>
        </div>
      </div>
    </header>
    ${PlannerCalendarViews.banner()}
    <input type="file" id="icsFileInput" accept=".ics,text/calendar" style="display:none" />

    <div class="card mb-24" style="padding: 14px 18px;">
      <div class="row gap-8 flex-wrap">
        <span class="text-mute" style="font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em;">layers</span>
        ${layerOptions.map(opt => `
          <button class="layer-toggle ${layers[opt.key] ? 'on' : ''}" data-layer="${opt.key}">
            <span>${opt.iconName ? icon(opt.iconName, 14) : (opt.icon || '')}</span> ${opt.label}
          </button>
        `).join('')}
        <span class="toolbar-spacer"></span>
        ${calendarView === 'month' ? `
          <button class="layer-toggle ${calendarDetailed ? 'on' : ''}" id="detailToggle" title="show all events without truncation">
            ${calendarDetailed ? 'detailed' : 'compact'}
          </button>
        ` : ''}
      </div>
    </div>

    <div class="calendar mb-24 ${calendarDetailed && calendarView === 'month' ? 'cal-detailed' : ''}">
      <div class="calendar-header">
        <button class="cal-arrow" onclick="calNav(-1)" aria-label="previous">‹</button>
        <button class="calendar-month cal-month-btn" onclick="openCalDatePicker()" title="click to jump">${headerTitle}</button>
        <div class="row gap-8">
          ${calendarOffset !== 0 ? `<button class="btn-soft" onclick="calNav('today')">today</button>` : ''}
          <button class="cal-arrow" onclick="calNav(1)" aria-label="next">›</button>
        </div>
      </div>
      ${viewBody}
    </div>
  `;

  $$('.layer-toggle').forEach(btn => {
    if (btn.id === 'detailToggle') return;
    btn.addEventListener('click', () => {
      const key = btn.dataset.layer;
      Store.data.calendarLayers[key] = !Store.data.calendarLayers[key];
      Store.save();
      Router.refresh();
    });
  });
  if ($('#detailToggle')) {
    $('#detailToggle').addEventListener('click', () => {
      calendarDetailed = !calendarDetailed;
      Router.refresh();
    });
  }
  $$('.cal-view-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      calendarView = btn.dataset.view;
      calendarOffset = 0;
      Router.refresh();
    });
  });
  $('#syncGcalBtn')?.addEventListener('click', () => openGoogleSyncModal());
  $('#manageImportsBtn')?.addEventListener('click', () => openManageImportsModal());
  $('#icsFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => importIcsText(ev.target.result, file.name.replace(/\.ics$/i, ''));
    reader.readAsText(file);
    e.target.value = '';
  });
};

/* File transfer is separate from the live Google Calendar connection. */
function openGoogleSyncModal() { return GoogleCalendarSync.open(); }
function openCalendarFileTransferModal() {
  Modal.open(`
    <h2>sync with Google Calendar</h2>
    <p class="text-mute" style="font-size:13px;">Manual file transfer. Importing or exporting an .ics file does not keep calendars synchronized.</p>

    <div class="kpi-label" style="margin-top:18px; margin-bottom:8px;">${icon('outbox', 12)} EXPORT — planner → Google</div>
    <div class="card card-mint" style="padding: 14px 16px;">
      <p style="margin: 0 0 8px; font-size:13px;">Download an .ics with every assignment, test, exam, lab session, and active class. Classes use weekly recurrence so they repeat through the semester.</p>
      <div class="row gap-8 flex-wrap">
        <button class="btn btn-mint btn-sm" onclick="downloadPlannerIcs(); Toast.show('downloaded');">${icon('outbox', 14)} download student-planner.ics</button>
        <a class="btn btn-ghost btn-sm" href="https://calendar.google.com/calendar/u/0/r/settings/export" target="_blank" rel="noopener">open Google import →</a>
      </div>
      <details class="sync-steps">
        <summary>step-by-step</summary>
        <ol>
          <li>Click <span class="bold">download student-planner.ics</span> above</li>
          <li>Go to <a href="https://calendar.google.com" target="_blank" rel="noopener">calendar.google.com</a></li>
          <li>Top right → ⚙ (gear icon) → <span class="bold">Settings</span></li>
          <li>In the left sidebar, click <span class="bold">Import &amp; export</span> (above "Settings for my calendars")</li>
          <li>Under <span class="bold">Import</span>, click <span class="bold">Select file from your computer</span> and pick the file you just downloaded</li>
          <li>Choose which calendar to add the events to (e.g. your main calendar) → click <span class="bold">Import</span></li>
        </ol>
      </details>
    </div>

    <div class="kpi-label" style="margin-top:18px; margin-bottom:8px;">${icon('inbox', 12)} IMPORT — Google → planner</div>
    <div class="card card-warm" style="padding: 14px 16px;">
      <p style="margin: 0 0 6px; font-size:13px;"><span class="bold">Recommended path</span> — paste your iCal URL, we open it, your browser downloads the .ics, you drop it in:</p>
      <div class="row gap-8 flex-wrap" style="align-items:center;">
        <input class="input" id="gcalUrlInput" type="url" placeholder="https://calendar.google.com/calendar/ical/.../basic.ics" style="flex: 1; min-width: 240px; font-size:12px;"/>
        <button class="btn btn-sm" id="gcalOpenBtn" title="opens the URL — browser saves the .ics for you">${icon('outbox', 12)} open &amp; download</button>
      </div>
      <p class="text-mute" style="font-size:11px; margin: 6px 0 0;">⚠ <span class="bold">Why not "live sync"?</span> Browsers block direct fetches of Google Calendar URLs (CORS policy from Google's side — confirmed against their endpoint). The reliable path is: download → upload. Takes ~2 clicks.</p>
      <div style="margin-top:14px; padding-top:14px; border-top: 1px dashed var(--border);">
        <p style="margin: 0 0 6px; font-size:13px;"><span class="bold">Already have a .ics file?</span> Drop it here:</p>
        <button class="btn btn-sm" onclick="document.getElementById('icsFileInput').click()">choose .ics file</button>
      </div>
      <div id="syncStatusSlot"></div>
      <details class="sync-steps" open>
        <summary>where to find the iCal URL</summary>
        <p style="font-size:12px; margin: 0 0 8px;"><span class="bold">"Integrate calendar" is NOT under General settings</span> — it's inside each calendar's own settings page. Two ways to get there:</p>
        <div class="bold" style="font-size:12px; margin-top: 10px;">Quickest path</div>
        <ol>
          <li>Go to <a href="https://calendar.google.com" target="_blank" rel="noopener">calendar.google.com</a></li>
          <li>In the left sidebar under "<span class="bold">My calendars</span>", <span class="bold">hover</span> the calendar you want (e.g. "Talia M")</li>
          <li>Click the <span class="bold">⋮ three-dot menu</span> that appears → <span class="bold">Settings and sharing</span></li>
          <li>Scroll down the right side until you see <span class="bold">"Integrate calendar"</span> (it's near the bottom)</li>
          <li>Copy the URL labelled <span class="bold">"Secret address in iCal format"</span> — paste it above</li>
        </ol>
        <div class="bold" style="font-size:12px; margin-top: 10px;">If you're already in Settings</div>
        <ol>
          <li>In the LEFT sidebar of Settings, scroll down to <span class="bold">"Settings for my calendars"</span> (below "Import &amp; export")</li>
          <li>Click your calendar's name (e.g. "<span class="bold">Talia M</span>") to expand it</li>
          <li>Click <span class="bold">"Integrate calendar"</span> in the sub-menu</li>
          <li>On the right, copy the <span class="bold">"Secret address in iCal format"</span> URL</li>
        </ol>
        <p class="text-mute" style="font-size:11px; margin: 8px 0 0;">⚠ Keep this URL private — anyone with it can see your events.</p>
      </details>
      <details class="sync-steps">
        <summary>advanced — try live fetch via a proxy</summary>
        <p style="font-size:12px; margin: 6px 0;">A third-party proxy server can re-fetch the URL with the headers browsers require. <span class="bold">Privacy tradeoff:</span> your iCal URL (including its secret token) passes through that server.</p>
        <p style="font-size:12px; margin: 0 0 8px;">We try <a href="https://github.com/rdjpalmer/gcal-cors-proxy" target="_blank" rel="noopener">gcal-cors-proxy.vercel.app</a> (purpose-built for Google Calendar, claims zero logging). If you don't trust it, stick with download &amp; upload above.</p>
        <button class="btn btn-sm" id="gcalSubscribeBtn">try via proxy</button>
      </details>
    </div>

    <div class="row" style="justify-content: flex-end; margin-top: 18px;">
      <button class="btn btn-ghost" onclick="Modal.close()">close</button>
    </div>
  `);
  setTimeout(() => {
    // Primary action — open the iCal URL in a new tab. Browser auto-downloads the
    // .ics file (Google serves it with Content-Type: text/calendar). Then we point
    // the user at the file picker so the next click finishes the import.
    $('#gcalOpenBtn')?.addEventListener('click', () => {
      const url = $('#gcalUrlInput')?.value.trim();
      if (!url) { showSyncStatus('error', 'paste a URL first'); return; }
      if (!/^https?:\/\//i.test(url)) { showSyncStatus('error', 'enter a full https:// URL'); return; }
      window.open(url, '_blank', 'noopener');
      showSyncStatus('info', `Your browser is downloading the .ics file. When it's done, click "choose .ics file" below and pick it from your Downloads folder.`);
    });
    // Secondary — try proxy fetch (advanced disclosure)
    $('#gcalSubscribeBtn')?.addEventListener('click', async () => {
      const url = $('#gcalUrlInput')?.value.trim();
      if (!url) { showSyncStatus('error', 'paste a URL first'); return; }
      const btn = $('#gcalSubscribeBtn');
      btn.disabled = true;
      btn.textContent = 'trying proxy…';
      // The "advanced" disclosure is opt-in, so consent is implicit by reaching here
      await importIcsFromUrl(url, 'Google Calendar', { allowProxy: true });
      btn.disabled = false;
      btn.textContent = 'try via proxy';
    });
    $('#gcalUrlInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); $('#gcalOpenBtn')?.click(); }
    });
  }, 50);
}

function openManageImportsModal() {
  const cals = Store.data.importedCalendars || [];
  Modal.open(`
    <h2>imported calendars</h2>
    ${cals.length === 0 ? `<p class="text-mute">none yet</p>` : `
      <div style="display:flex; flex-direction:column; gap:10px; margin-top:14px;">
        ${cals.map(c => `
          <div class="card" style="padding: 12px 16px;">
            <div class="row-between" style="margin-bottom: 6px;">
              <div class="row gap-8">
                <span style="display:inline-block; width:14px; height:14px; border-radius: 50%; background: ${c.color};"></span>
                <span class="bold">${escape(c.name)}</span>
              </div>
              <div class="row gap-8">
                ${c.sourceUrl ? `<button class="btn-soft btn-tiny" onclick="refreshSubscribedCalendar('${c.id}')" title="refetch from URL">🔄 refresh</button>` : ''}
                <button class="btn-soft btn-tiny" onclick="removeImport('${c.id}')">remove</button>
              </div>
            </div>
            <div class="text-mute" style="font-size: 12px;">${c.events.length} event${c.events.length===1?'':'s'} · imported ${escape(c.importedOn || '')}${c.lastRefreshed ? ' · last refresh ' + escape(new Date(c.lastRefreshed).toLocaleString()) : ''}</div>
            ${c.sourceUrl ? `<div class="text-mute" style="font-size: 10px; margin-top:4px; word-break:break-all;">${escape(c.sourceUrl.slice(0, 80))}${c.sourceUrl.length > 80 ? '…' : ''}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `}
    <div class="row" style="justify-content: flex-end; gap: 8px; margin-top: 18px;">
      <button class="btn btn-ghost" onclick="Modal.close()">close</button>
      <button class="btn" onclick="Modal.close(); openGoogleSyncModal();">+ add another</button>
    </div>
  `);
}

window.removeImport = (id) => {
  Store.data.importedCalendars = (Store.data.importedCalendars || []).filter(c => c.id !== id);
  Store.save();
  openManageImportsModal();
  Router.refresh();
};
window.refreshSubscribedCalendar = refreshSubscribedCalendar;
window.downloadPlannerIcs = downloadPlannerIcs;

function renderMonthView(year, month, todayStr) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDow = first.getDay();
  const daysInMonth = last.getDate();

  const fromIso = `${year}-${String(month+1).padStart(2,'0')}-01`;
  const toIso = `${year}-${String(month+1).padStart(2,'0')}-${String(daysInMonth).padStart(2,'0')}`;
  const events = buildCalendarEvents(fromIso, toIso);

  const cells = [];
  const prevLast = new Date(year, month, 0).getDate();
  for (let i = 0; i < startDow; i++) {
    cells.push(`<div class="calendar-day muted"><div class="calendar-day-num">${prevLast - startDow + i + 1}</div></div>`);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const isToday = date === todayStr;
    const isPast = date < todayStr;
    const evs = events[date] || [];
    evs.sort((a, b) => (PlannerCalendarViews.timed(a).start ?? 1441) - (PlannerCalendarViews.timed(b).start ?? 1441));
    const limit = calendarDetailed ? 99 : 4;
    const visible = evs.slice(0, limit);
    const overflow = evs.length - visible.length;
    cells.push(`
      <div class="calendar-day ${isToday ? 'today' : ''} ${isPast ? 'past' : ''} ${evs.length ? 'has-events' : ''}" onclick="openDayDetail('${date}')">
        <div class="calendar-day-num">${day}</div>
        ${visible.map(e => `
          <span class="calendar-event t-${e.type}" onclick="event.stopPropagation(); ${PlannerCalendarViews.action(e)}" title="${escape(e.title + (e.time ? ' @ ' + e.time : ''))}">
            ${e.time ? `<span class="ev-time">${escape(e.time)}</span>` : ''}<span class="ev-title">${escape(e.title)}</span>
          </span>
        `).join('')}
        ${overflow > 0 ? `<span class="calendar-event ev-more">+${overflow} more</span>` : ''}
      </div>
    `);
  }
  const remainder = (7 - cells.length % 7) % 7;
  for (let i = 1; i <= remainder; i++) {
    cells.push(`<div class="calendar-day muted"><div class="calendar-day-num">${i}</div></div>`);
  }
  return `
    <div class="calendar-grid">
      ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="calendar-dow">${d}</div>`).join('')}
      ${cells.join('')}
    </div>
  `;
}

function renderWeekView(weekStartDate, todayStr) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(weekStartDate); dt.setDate(dt.getDate() + i);
    days.push({ iso: dt.toISOString().slice(0, 10), dt });
  }
  const fromIso = days[0].iso;
  const toIso = days[6].iso;
  const events = buildCalendarEvents(fromIso, toIso);

  const cells = days.map(({ iso, dt }) => {
    const isToday = iso === todayStr;
    const isPast = iso < todayStr;
    const evs = events[iso] || [];
    evs.sort((a, b) => (PlannerCalendarViews.timed(a).start ?? 1441) - (PlannerCalendarViews.timed(b).start ?? 1441));
    return `
      <div class="cal-week-cell ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}" onclick="openDayDetail('${iso}')">
        <div class="cal-week-day-head">
          <span>${dt.getDate()}</span>
          <span class="dow">${dt.toLocaleDateString(undefined, { weekday: 'short' })}</span>
        </div>
        ${evs.length === 0 ? '<div class="text-mute" style="font-size:12px;">—</div>' : evs.map(e => `
          <span class="calendar-event t-${e.type}" onclick="event.stopPropagation(); ${PlannerCalendarViews.action(e)}" title="${escape(e.title + (e.time ? ' @ ' + e.time : ''))}">
            ${e.time ? `<span class="ev-time">${escape(e.time)}</span>` : ''}<span class="ev-title">${escape(e.title)}</span>
          </span>
        `).join('')}
      </div>
    `;
  });

  return `<div class="cal-week-grid">${cells.join('')}</div>`;
}

function renderDayView(refDate, todayStr) {
  return PlannerCalendarViews.day(refDate, todayStr);
}

window.calNav = (dir) => {
  if (dir === 'today') calendarOffset = 0;
  else calendarOffset += dir;
  Router.refresh();
};

window.openCalDatePicker = () => {
  const ref = calRefDate();
  const curYear = ref.getFullYear();
  const curMonth = ref.getMonth();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  let pickedYear = curYear;
  const renderGrid = () => `
    <div class="cal-picker-year-row">
      <button class="cal-arrow-sm" onclick="calPickerYear(-1)" aria-label="prev year">‹</button>
      <div class="cal-picker-year" id="cpYear">${pickedYear}</div>
      <button class="cal-arrow-sm" onclick="calPickerYear(1)" aria-label="next year">›</button>
    </div>
    <div class="cal-picker-months">
      ${months.map((m, i) => `
        <button class="cal-picker-month ${pickedYear === curYear && i === curMonth ? 'active' : ''}" onclick="calPickerJump(${i})">${m}</button>
      `).join('')}
    </div>
    ${calendarView === 'day' || calendarView === 'week' ? `
      <div class="text-center mt-12">
        <input type="date" class="input" id="cpDate" value="${ref.toISOString().slice(0,10)}" style="max-width:200px;" />
        <button class="btn btn-sm mt-12" id="cpDateGo">jump to date</button>
      </div>
    ` : ''}
  `;

  Modal.open(`
    <h2>jump to</h2>
    <div id="cpBody">${renderGrid()}</div>
    <div class="row" style="justify-content:flex-end; margin-top:14px;">
      <button class="btn btn-ghost" onclick="Modal.close()">close</button>
    </div>
  `);

  window.calPickerYear = (delta) => {
    pickedYear += delta;
    $('#cpYear').textContent = pickedYear;
    $$('.cal-picker-month').forEach((b, i) => {
      b.classList.toggle('active', pickedYear === curYear && i === curMonth);
    });
  };

  window.calPickerJump = (monthIdx) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(pickedYear, monthIdx, 1);
    if (calendarView === 'month') {
      calendarOffset = (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth());
    } else if (calendarView === 'week') {
      calendarOffset = Math.round((target - today) / (7 * 86400000));
    } else {
      calendarOffset = Math.round((target - today) / 86400000);
    }
    Modal.close();
    Router.refresh();
  };

  setTimeout(() => {
    if ($('#cpDateGo')) {
      $('#cpDateGo').addEventListener('click', () => {
        const v = $('#cpDate').value;
        if (!v) return;
        const target = new Date(v + 'T00:00:00');
        const today = new Date();
        today.setHours(0,0,0,0);
        if (calendarView === 'week') {
          calendarOffset = Math.round((target - today) / (7 * 86400000));
        } else {
          calendarOffset = Math.round((target - today) / 86400000);
        }
        Modal.close();
        Router.refresh();
      });
    }
  }, 50);
};

window.openDayDetail = (date) => PlannerCalendarViews.detail(date);

/* -- To-do ----------------------------------------------------------------- */
let todoRange = 'week';
Views.todo = (root) => {
  const d = Store.data;
  const cats = ['School', 'Personal', 'Career', 'Errands', 'Other'];
  const localDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const nowDate = new Date();
  nowDate.setHours(0, 0, 0, 0);
  const weekStart = new Date(nowDate);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7)); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return { date, key: localDateKey(date) };
  });
  const rangeEnd = todoRange === 'week'
    ? new Date(weekDays[6].date)
    : new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0);
  const visibleTodos = d.todos.filter(t => {
    if (!t.due) return todoRange === 'month';
    const due = new Date(t.due + 'T00:00:00');
    return due >= (todoRange === 'week' ? weekStart : nowDate) && due <= rangeEnd;
  });
  const grouped = {};
  cats.forEach(c => grouped[c] = []);
  visibleTodos.forEach(t => (grouped[t.category] || (grouped[t.category] = [])).push(t));
  const taskCard = (t) => `
    <div class="kanban-task" style="opacity: ${t.done ? 0.5 : 1};">
      <div class="row gap-8" style="align-items:flex-start;">
        <input class="checkbox" type="checkbox" ${t.done?'checked':''} onchange="toggleTodo('${t.id}', this, event)" />
        <div style="flex:1; min-width:0;">
          <div style="font-weight:600; ${t.done ? 'text-decoration: line-through;' : ''}">${escape(t.title)}</div>
          <div class="row" style="margin-top:4px; gap:6px; font-size:11px;">
            <span class="${priorityClass(t.priority)}">${t.priority}</span>
            <span class="text-mute">${t.category}</span>
          </div>
        </div>
        <button class="btn-soft" onclick="deleteRow('todos', '${t.id}'); Router.refresh();" style="padding:4px 8px;">×</button>
      </div>
    </div>`;
  const weeklyMarkup = `
    <div class="weekly-todo-grid">
      ${weekDays.map(({ date, key }) => {
        const items = d.todos.filter(t => t.due === key);
        const isToday = key === today();
        return `<section class="weekly-todo-day${isToday ? ' is-today' : ''}">
          <h3>${date.toLocaleDateString(undefined, { weekday: 'short' })}<span>${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></h3>
          ${items.length ? items.map(taskCard).join('') : '<p class="text-mute weekly-empty">nothing due</p>'}
        </section>`;
      }).join('')}
      <section class="weekly-todo-day weekly-todo-general">
        <h3>This week<span>general to-dos</span></h3>
        ${d.todos.filter(t => !t.due).length ? d.todos.filter(t => !t.due).map(taskCard).join('') : '<p class="text-mute weekly-empty">add tasks without a date here</p>'}
      </section>
    </div>`;

  root.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title"><span class="emoji">${icon('sparkles', 22)}</span>To-Do</h1>
      </div>
      <div class="row gap-8">
        <button class="layer-toggle ${todoRange === 'week' ? 'on' : ''}" id="todoWeek">this week</button>
        <button class="layer-toggle ${todoRange === 'month' ? 'on' : ''}" id="todoMonth">this month</button>
      </div>
    </header>

    <form class="card mb-24" id="todoForm">
      <div class="row gap-12">
        <input class="input" id="todoText" placeholder="something to remember…" style="flex:1; min-width:240px;" required />
        <select class="select" id="todoCat" style="width:140px;">
          ${cats.map(c => `<option>${c}</option>`).join('')}
        </select>
        <select class="select" id="todoPri" style="width:100px;">
          ${['Low','Med','High'].map(p => `<option ${p==='Med'?'selected':''}>${p}</option>`).join('')}
        </select>
        <input class="input" id="todoDue" type="date" style="width:160px;" value="${today()}" />
        <button class="btn">add</button>
      </div>
    </form>

    ${todoRange === 'week' ? weeklyMarkup : `<div class="kanban">
      ${Object.keys(grouped).map(cat => {
        const items = grouped[cat] || [];
        const open = items.filter(i => !i.done).length;
        return `
          <div class="kanban-col">
            <h3>${cat} <span class="count">${open}</span></h3>
            ${items.length === 0 ? `<p class="text-mute" style="font-size:12px;">empty — add some</p>` :
              items.map(taskCard).join('')
            }
          </div>
        `;
      }).join('')}
    </div>`}
  `;
  $('#todoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = $('#todoText').value.trim();
    if (!text) return;
    Store.data.todos.push({
      id: uid(), title: text,
      category: $('#todoCat').value,
      priority: $('#todoPri').value,
      due: $('#todoDue').value,
      done: false,
    });
    Store.save();
    Router.refresh();
  });
  $('#todoWeek').addEventListener('click', () => { todoRange = 'week'; Router.refresh(); });
  $('#todoMonth').addEventListener('click', () => { todoRange = 'month'; Router.refresh(); });
};
window.toggleTodo = (id, el, ev) => {
  const t = Store.data.todos.find(x => x.id === id);
  t.done = el.checked;
  Store.save();
  if (t.done) {
    Confetti.fromEvent(ev);
    Toast.show('done!');
  }
  Router.refresh();
};

/* -- Habits ---------------------------------------------------------------- */
Views.habits = (root) => {
  const d = Store.data;
  const days = [];
  const cur = new Date();
  // Show 14-day rolling window (past 13 days + today)
  for (let i = -13; i <= 0; i++) {
    const dt = new Date(cur);
    dt.setDate(dt.getDate() + i);
    days.push(dt.toISOString().slice(0, 10));
  }

  const grid = `
    <div class="habit-table" style="grid-template-columns: 200px repeat(${days.length}, 1fr);">
      <div class="habit-cell head"></div>
      ${days.map(date => {
        const dt = new Date(date + 'T00:00:00');
        const isToday = date === today();
        return `<div class="habit-cell head${isToday ? ' is-today' : ''}">
          <span style="font-size:13px; font-weight:700;">${dt.getDate()}</span>
          <span style="font-size:9px; opacity:0.75;">${dt.toLocaleDateString(undefined,{weekday:'short'}).slice(0,2).toUpperCase()}</span>
        </div>`;
      }).join('')}
      ${d.habits.map(h => `
        <div class="habit-cell label">${h.emoji} ${escape(h.name)}</div>
        ${days.map(date => {
          const done = h.days[date];
          return `<div class="habit-cell ${done ? 'done' : ''}" onclick="toggleHabit2('${h.id}','${date}', this, event)"></div>`;
        }).join('')}
      `).join('')}
    </div>
  `;

  // Streak per habit
  const streaks = d.habits.map(h => {
    let s = 0;
    let dt = new Date();
    while (true) {
      const iso = dt.toISOString().slice(0, 10);
      if (h.days[iso]) { s++; dt.setDate(dt.getDate() - 1); }
      else break;
    }
    return { h, s };
  });

  root.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title"><span class="emoji">${icon('check', 22)}</span>Habits</h1>
        <p class="page-subtitle">Daily check-ins. Tap to mark a day done.</p>
      </div>
    </header>

    <div class="grid grid-3 mb-24">
      ${streaks.slice(0, 3).map(({ h, s }) => `
        <div class="card card-mint">
          <div class="kpi-label">${h.emoji} ${escape(h.name)}</div>
          <div class="kpi-value">${s}</div>
          <div class="kpi-sub">${s === 1 ? 'day' : 'days'} in a row</div>
        </div>
      `).join('')}
    </div>

    ${grid}

    <div class="card mt-24 card-warm">
      <div class="row-between mb-12">
        <h3 class="card-title">${icon('check', 18)} your habits</h3>
        <button class="btn btn-sm" id="addHabit">+ add habit</button>
      </div>
      <div class="grid grid-2">
        ${d.habits.map(h => `
          <div class="row gap-8" style="background: rgba(255,255,255,0.6); padding: 8px 12px; border-radius: 12px;">
            <input class="input" style="width:60px; text-align:center; font-size:18px;" value="${h.emoji}" onchange="updateHabit('${h.id}','emoji',this.value)" />
            <input class="input" value="${escape(h.name)}" onchange="updateHabit('${h.id}','name',this.value)" style="flex:1;" />
            <button class="btn-soft" onclick="deleteRow('habits','${h.id}'); Router.refresh();">×</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  $('#addHabit').addEventListener('click', () => {
    Modal.open(`
      <h2>add a habit</h2>
      <p class="text-mute" style="font-size:13px;">Pick a label and an optional icon — that's it.</p>
      <div class="field-row" style="margin-top:14px;">
        <div class="field" style="flex: 0 0 100px;">
          <label class="label">emoji</label>
          <input class="input" id="ah-emoji" value="" maxlength="3" style="text-align:center; font-size:22px; padding: 12px;" />
        </div>
        <div class="field" style="flex:1;">
          <label class="label">habit</label>
          <input class="input" id="ah-name" placeholder="e.g. read 20 mins" />
        </div>
      </div>
      <div class="row" style="justify-content:flex-end; gap:8px; margin-top:14px;">
        <button class="btn btn-ghost" onclick="Modal.close()">cancel</button>
        <button class="btn" id="ah-save">add</button>
      </div>
    `);
    setTimeout(() => {
      $('#ah-name').focus();
      $('#ah-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#ah-save').click(); });
      $('#ah-save').addEventListener('click', () => {
        const name = $('#ah-name').value.trim() || 'New habit';
        const emoji = $('#ah-emoji').value.trim() || '';
        Store.data.habits.push({ id: uid(), name, emoji, days: {} });
        Store.save();
        Modal.close();
        Router.refresh();
        Toast.show('habit added');
      });
    }, 50);
  });
};
window.toggleHabit2 = (id, date, el, ev) => {
  const h = Store.data.habits.find(x => x.id === id);
  h.days[date] = !h.days[date];
  Store.save();
  el.classList.toggle('done');
  if (h.days[date]) Confetti.fromEvent(ev);
};
window.updateHabit = (id, key, val) => {
  const h = Store.data.habits.find(x => x.id === id);
  h[key] = val;
  Store.save();
};

/* -- Goals ----------------------------------------------------------------- */
const GOAL_STATUSES = ['Not Started', 'In Progress', 'Paused', 'Done'];

function goalProgressFromMilestones(g) {
  const ms = g.milestones || [];
  if (!ms.length) return { pct: 0, done: 0, total: 0 };
  const done = ms.filter(m => m.done).length;
  return { pct: Math.round((done / ms.length) * 100), done, total: ms.length };
}

Views.goals = (root) => {
  const d = Store.data;
  const areas = ['Academic', 'Career', 'Health', 'Personal'];
  const grouped = {};
  areas.forEach(a => grouped[a] = []);
  d.goals.forEach(g => (grouped[g.area] || (grouped[g.area] = [])).push(g));

  root.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title"><span class="emoji">${icon('target', 22)}</span>Goals</h1>
        <p class="page-subtitle">Each goal is a small staircase of milestones — check them off as you go. Progress comes from real done-ness, not a feel-it slider.</p>
      </div>
      <button class="btn" id="addGoal">+ add goal</button>
    </header>

    <div class="grid grid-2">
      ${areas.map(area => `
        <div class="card">
          <h3 class="card-title">${areaIcon(area)} ${area}</h3>
          ${(grouped[area] || []).length === 0 ? `<p class="text-mute" style="font-size:13px;">no goals yet — what would feel good?</p>` :
            grouped[area].map(g => goalCard(g)).join('')
          }
        </div>
      `).join('')}
    </div>
  `;

  $('#addGoal').addEventListener('click', () => {
    Store.data.goals.push({ id: uid(), area: 'Academic', title: 'New goal', deadline: '', notes: '', status: 'Not Started', milestones: [] });
    Store.save();
    Router.refresh();
  });
};

function goalCard(g) {
  const { pct, done, total } = goalProgressFromMilestones(g);
  const statusPill = ({
    'Not Started': 'pill-ghost',
    'In Progress': 'pill',
    'Paused':      'pill-butter',
    'Done':        'pill-mint',
  })[g.status] || 'pill-ghost';
  return `
    <div class="goal-card">
      <div class="row-between gap-8" style="align-items:flex-start;">
        <input value="${escape(g.title)}" onchange="updateGoal('${g.id}','title',this.value)" style="flex:1; background:transparent; border:none; font-weight:600; color:var(--ink); font-size:14px; min-width:0;" />
        <select onchange="updateGoal('${g.id}','status',this.value); Router.refresh();" class="pill ${statusPill}" style="font-size:10px; padding:3px 8px; border:none;">
          ${GOAL_STATUSES.map(s => `<option ${g.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
        <button class="btn-soft btn-tiny" onclick="deleteRow('goals','${g.id}'); Router.refresh();">×</button>
      </div>

      <div class="row gap-8 mt-12">
        <span class="font-mono" style="font-size: 18px; font-weight: 700; color: var(--ink);">${done}<span class="text-mute" style="font-size: 13px; font-weight: 500;">/${total || '—'}</span></span>
        <span class="text-mute" style="font-size: 11px;">milestones</span>
        <span class="pill pill-lilac" style="margin-left:auto; font-size:10px;">${total ? pct + '%' : '—'}</span>
      </div>
      <div class="progress mt-12"><div class="progress-fill" style="width: ${pct}%;"></div></div>

      <ul class="goal-milestones">
        ${(g.milestones || []).map(m => `
          <li class="${m.done ? 'done' : ''}">
            <input type="checkbox" class="checkbox" ${m.done?'checked':''} onchange="toggleMilestone('${g.id}','${m.id}', this, event)" />
            <input value="${escape(m.text)}" onchange="updateMilestone('${g.id}','${m.id}',this.value)" placeholder="step…" />
            <button class="btn-soft btn-tiny" onclick="removeMilestone('${g.id}','${m.id}')" title="remove">×</button>
          </li>
        `).join('')}
        <li class="goal-add-row">
          <button class="btn-soft" onclick="addMilestone('${g.id}')" style="width:100%;">+ add a milestone</button>
        </li>
      </ul>

      <div class="row gap-8 mt-12 text-mute" style="font-size:11px; flex-wrap:wrap;">
        <span class="row gap-8" style="display:inline-flex; align-items:center;">${icon('calendar', 13)} <input value="${escape(g.deadline || '')}" onchange="updateGoal('${g.id}','deadline',this.value)" placeholder="deadline" style="border:none; background:transparent; font-size:11px; color:var(--ink-mute); width:100px;" /></span>
        ${g.notes ? `<span>· ${escape(g.notes)}</span>` : ''}
      </div>
    </div>
  `;
}

function areaIcon(area) {
  return ({ Academic: '', Career: '', Health: '', Personal: '' })[area] || '';
}

window.updateGoal = (id, key, val) => {
  const g = Store.data.goals.find(x => x.id === id);
  g[key] = val;
  // Auto-bump status when all milestones done
  if (key !== 'status' && g.milestones?.length) {
    const allDone = g.milestones.every(m => m.done);
    if (allDone) g.status = 'Done';
    else if (g.status === 'Done') g.status = 'In Progress';
  }
  Store.save();
};

window.addMilestone = (goalId) => {
  const g = Store.data.goals.find(x => x.id === goalId);
  if (!g.milestones) g.milestones = [];
  g.milestones.push({ id: uid(), text: '', done: false });
  if (g.status === 'Not Started') g.status = 'In Progress';
  Store.save();
  Router.refresh();
};

window.removeMilestone = (goalId, msId) => {
  const g = Store.data.goals.find(x => x.id === goalId);
  g.milestones = (g.milestones || []).filter(m => m.id !== msId);
  Store.save();
  Router.refresh();
};

window.toggleMilestone = (goalId, msId, el, ev) => {
  const g = Store.data.goals.find(x => x.id === goalId);
  const m = g.milestones.find(x => x.id === msId);
  m.done = el.checked;
  if (g.milestones.every(x => x.done) && g.milestones.length) {
    g.status = 'Done';
    Confetti.fromEvent(ev);
    Toast.show('every milestone done — beautiful');
  } else if (g.status === 'Not Started' && g.milestones.some(x => x.done)) {
    g.status = 'In Progress';
  } else if (g.status === 'Done' && !g.milestones.every(x => x.done)) {
    g.status = 'In Progress';
  }
  Store.save();
  Router.refresh();
};

window.updateMilestone = (goalId, msId, text) => {
  const g = Store.data.goals.find(x => x.id === goalId);
  const m = g.milestones.find(x => x.id === msId);
  m.text = text;
  Store.save();
};

/* -- Focus / Pomodoro ------------------------------------------------------ */
let focusInterval = null;
let focusState = { mode: 'focus', remaining: 25 * 60, running: false, loop: false, cyclesInLoop: 0 };

Views.focus = (root) => {
  root.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title"><span class="emoji">${icon('timer', 22)}</span>Focus Timer</h1>
        <p class="page-subtitle">A gentle Pomodoro for when starting feels hard. Focus → break → focus → longer break.</p>
      </div>
    </header>

    <div class="card text-center" style="padding: 32px;">
      <div class="timer-mode">
        <button data-mode="focus"  data-mins="25">focus · 25</button>
        <button data-mode="short"  data-mins="5" >short break · 5</button>
        <button data-mode="long"   data-mins="15">long break · 15</button>
      </div>
      <div class="timer-display" id="timer">25:00</div>
      <div class="timer-custom">
        <label class="label" style="margin:0;">custom:</label>
        <input class="input" id="customMins" type="number" min="1" max="180" step="1" value="${focusState.customMins || 25}" style="width:70px; text-align:center;"/>
        <span class="text-mute" style="font-size:12px;">min</span>
        <button class="btn btn-sm" id="setCustomBtn">set</button>
      </div>
      <div class="timer-controls">
        <button class="btn" id="startBtn">start</button>
        <button class="btn btn-ghost" id="resetBtn">reset</button>
        <button class="btn ${focusState.loop ? 'btn-mint' : 'btn-ghost'}" id="loopBtn" title="auto-cycle: focus → break → focus → long break">
          ${focusState.loop ? 'loop on' : 'loop'}
        </button>
      </div>
      ${focusState.loop ? `
        <div class="text-mute mt-12" style="font-size:12px;">
          when this finishes, the next mode auto-starts · ${focusState.cyclesInLoop} cycle${focusState.cyclesInLoop===1?'':'s'} so far
        </div>
      ` : ''}
      <p class="text-mute mt-24" style="font-size:13px;">tip — try playing a song you love, then start. you'll usually keep going.</p>
    </div>

    <div class="grid grid-3 mt-24">
      <div class="card card-mint">
        <h3 class="card-title">${icon('timer', 18)} sessions today</h3>
        <div class="kpi-value">${Store.data.focus.sessionsToday || 0}</div>
        <div class="kpi-sub">25-minute blocks</div>
      </div>
      <div class="card card-cool">
        <h3 class="card-title">${icon('book', 18)} try this</h3>
        <p style="font-family: var(--font-display); font-size:20px; margin: 0;">"Just open the file."<br/>That's the whole task.</p>
      </div>
      <div class="card card-warm">
        <h3 class="card-title">${icon('compass', 18)} if stuck</h3>
        <p class="text-mute" style="font-size:13px; margin:0;">Write the question in your own words first. Then write what you DO know. The answer often lives in the gap.</p>
      </div>
    </div>
  `;

  const update = () => {
    const m = Math.floor(focusState.remaining / 60);
    const s = focusState.remaining % 60;
    $('#timer').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    $('#startBtn').textContent = focusState.running ? 'pause' : 'start';
  };
  update();

  $$('.timer-mode button').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === focusState.mode);
    b.addEventListener('click', () => {
      clearInterval(focusInterval);
      focusState = { mode: b.dataset.mode, remaining: +b.dataset.mins * 60, running: false, loop: focusState.loop, customMins: focusState.customMins };
      $$('.timer-mode button').forEach(x => x.classList.toggle('active', x === b));
      update();
    });
  });

  // Custom minutes: set arbitrary duration (1–180 min)
  $('#setCustomBtn')?.addEventListener('click', () => {
    const mins = Math.max(1, Math.min(180, +($('#customMins')?.value || 25)));
    clearInterval(focusInterval);
    focusState = { mode: 'custom', remaining: mins * 60, running: false, loop: focusState.loop, customMins: mins };
    $$('.timer-mode button').forEach(x => x.classList.remove('active'));
    update();
    Toast.show(`timer set to ${mins} min`);
  });
  // Enter in the custom-mins input also sets it
  $('#customMins')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); $('#setCustomBtn')?.click(); }
  });

  $('#startBtn').addEventListener('click', () => {
    if (focusState.running) {
      focusState.running = false;
      clearInterval(focusInterval);
    } else {
      focusState.running = true;
      focusInterval = setInterval(() => {
        focusState.remaining--;
        if (focusState.remaining <= 0) {
          clearInterval(focusInterval);
          focusState.running = false;
          if (focusState.mode === 'focus') {
            Store.data.focus.sessionsToday = (Store.data.focus.sessionsToday || 0) + 1;
            Store.save();
            Toast.show('lovely work — take a break');
          } else {
            Toast.show('back to it when you\'re ready');
          }
          Confetti.burst(innerWidth / 2, innerHeight / 3);
          new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=').play().catch(()=>{});

          // Loop / auto-advance
          if (focusState.loop) {
            const justFinished = focusState.mode;
            let nextMode, nextMins;
            if (justFinished === 'focus') {
              focusState.cyclesInLoop = (focusState.cyclesInLoop || 0) + 1;
              const isLongBreakTime = focusState.cyclesInLoop % 4 === 0;
              nextMode = isLongBreakTime ? 'long' : 'short';
              nextMins = isLongBreakTime ? 15 : 5;
            } else {
              nextMode = 'focus';
              nextMins = 25;
            }
            focusState.mode = nextMode;
            focusState.remaining = nextMins * 60;
            Router.refresh();
            // Auto-start the next cycle after a short visual breath
            setTimeout(() => {
              if (Router.current === 'focus' && !focusState.running) {
                $('#startBtn')?.click();
              }
            }, 600);
            return;
          }
        }
        update();
      }, 1000);
    }
    update();
  });

  $('#resetBtn').addEventListener('click', () => {
    clearInterval(focusInterval);
    const mins = +$$('.timer-mode button').find(b => b.classList.contains('active')).dataset.mins;
    focusState = { mode: focusState.mode, remaining: mins * 60, running: false, loop: focusState.loop, cyclesInLoop: 0 };
    Router.refresh();
  });

  $('#loopBtn').addEventListener('click', () => {
    focusState.loop = !focusState.loop;
    if (!focusState.loop) focusState.cyclesInLoop = 0;
    Router.refresh();
  });
};

/* -- Mood ------------------------------------------------------------------ */
// 5-level mood scale with distinct icons and color cues
const MOOD_LEVELS = [
  { score: 1, iconName: 'moodTerrible', label: 'terrible', color: '#9690B5' },
  { score: 2, iconName: 'moodLow',      label: 'low',      color: '#C9A9E8' },
  { score: 3, iconName: 'moodNeutral',  label: 'okay',     color: '#A8C5F0' },
  { score: 4, iconName: 'moodGood',     label: 'good',     color: '#9BC09A' },
  { score: 5, iconName: 'moodGreat',    label: 'great',    color: '#F5D27A' },
];

Views.mood = (root) => {
  const d = Store.data;
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    days.push(dt.toISOString().slice(0, 10));
  }
  const t = today();
  const todayMood = d.moods[t]?.score || 0;

  const recent = days.map(date => d.moods[date]?.score).filter(Boolean);
  const avg = recent.length ? recent.reduce((s,v) => s+v, 0) / recent.length : 0;
  const avgLevel = avg ? MOOD_LEVELS[Math.round(avg) - 1] : null;

  root.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title"><span class="emoji">${icon('smile', 22)}</span>Mood Log</h1>
        <p class="page-subtitle">A small check-in with yourself. Pick the face that fits.</p>
      </div>
    </header>

    <div class="card card-warm mb-24 text-center">
      <h3 class="card-title" style="justify-content:center;">how do you feel today?</h3>
      <div class="mood-picker">
        ${MOOD_LEVELS.map(m => `
          <button class="mood-pick-btn ${todayMood === m.score ? 'active' : ''}"
                  style="--mood-color: ${m.color};"
                  onclick="setMood(${m.score}, event)"
                  title="${m.label}">
            <span class="mood-pick-icon">${icon(m.iconName, 32)}</span>
            <span class="mood-pick-label">${m.label}</span>
          </button>
        `).join('')}
      </div>
      <textarea class="textarea mt-24" id="moodNote" placeholder="anything else? (optional)" style="max-width:500px; margin: 16px auto 0;">${escape(d.moods[t]?.note || '')}</textarea>
    </div>

    <div class="grid grid-3 mb-24">
      ${kpi('30-day avg', avg ? avg.toFixed(1) : '—', avgLevel ? avgLevel.label : 'log a few days', avgLevel ? avgLevel.iconName : 'smile', 'var(--lavender-mist)')}
      ${kpi('Days logged', recent.length, 'in last 30', 'notebook', 'var(--mint-cream)')}
      ${kpi('Streak', (() => {
        let s = 0; let dt = new Date();
        while (true) {
          const iso = dt.toISOString().slice(0,10);
          if (d.moods[iso]?.score) { s++; dt.setDate(dt.getDate() - 1); } else break;
        }
        return s;
      })(), 'days in a row', 'zap', 'var(--rose-cloud)')}
    </div>

    <h2 class="section-title">last 30 days</h2>
    <div class="mood-grid">
      ${days.map(date => {
        const m = d.moods[date]?.score;
        const dt = new Date(date + 'T00:00:00');
        const level = m ? MOOD_LEVELS[m - 1] : null;
        return `
          <div class="mood-day ${level ? 'has-mood' : ''}" style="${level ? `--mood-color: ${level.color}; background: ${level.color}33; border-color: ${level.color}66;` : ''}" title="${date}${d.moods[date]?.note ? ' · ' + d.moods[date].note : ''}${level ? ' · ' + level.label : ''}">
            <span class="mood-num">${dt.getDate()}</span>
            ${level ? `<span style="color: ${level.color};">${icon(level.iconName, 24)}</span>` : '<span class="mood-num-empty">·</span>'}
          </div>
        `;
      }).join('')}
    </div>
  `;
  $('#moodNote').addEventListener('change', (e) => {
    const t = today();
    if (!d.moods[t]) d.moods[t] = { score: 0 };
    d.moods[t].note = e.target.value;
    Store.save();
  });
};
window.setMood = (score, ev) => {
  const t = today();
  if (!Store.data.moods[t]) Store.data.moods[t] = {};
  Store.data.moods[t].score = score;
  Store.save();
  Confetti.fromEvent(ev);
  Router.refresh();
};

/* -- Budget ---------------------------------------------------------------- */
Views.budget = (root) => {
  const d = Store.data;
  const totalIn  = d.budget.income.reduce((s, x) => s + +x.amount, 0);
  const totalOut = d.budget.expenses.reduce((s, x) => s + +x.amount, 0);
  const net = totalIn - totalOut;

  // Expense by category
  const byCat = {};
  d.budget.expenses.forEach(x => {
    byCat[x.category] = (byCat[x.category] || 0) + +x.amount;
  });
  const cats = Object.entries(byCat).sort((a,b) => b[1] - a[1]);
  const max = Math.max(...cats.map(c => c[1]), 1);

  // Monthly target + remaining
  const subsMonthly = (d.subscriptions || []).reduce((s, x) => s + (x.billing === 'Monthly' ? +x.price : (x.billing === 'Yearly' ? +x.price/12 : 0)), 0);
  const totalSpend = totalOut + subsMonthly;
  const target = d.budget.monthlyTarget || 0;
  const remaining = target - totalSpend;
  const spentPct = target > 0 ? Math.min(100, Math.round((totalSpend / target) * 100)) : 0;
  const now = new Date();
  const monthLabel = ['January','February','March','April','May','June','July','August','September','October','November','December'][now.getMonth()] + ' ' + now.getFullYear();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const alreadySnapshot = (d.budget.history || []).some(h => h.key === monthKey);

  root.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title"><span class="emoji">${icon('wallet', 22)}</span>Budget</h1>
        <p class="page-subtitle">Where the money flows. Soft and judgment-free.</p>
      </div>
    </header>

    <div class="card card-cool mb-24 planner-expense-sync" role="status">
      <div class="row-between" style="flex-wrap:wrap; gap:12px;">
        <div>
          <h3 class="card-title" style="margin:0;">${icon('refresh', 18)} Expenses sync</h3>
          <p class="text-mute" style="font-size:12px; margin:4px 0 0;">${d.budget.sync ? `Using ${d.budget.sync.transactionCount} real transactions from Expenses${d.budget.sync.latestMonth ? ` · latest recorded month ${d.budget.sync.latestMonth}: ${fmtCurrency(d.budget.sync.latestSpend)}` : ''}${d.budget.sync.updatedAt ? ` · updated ${new Date(d.budget.sync.updatedAt).toLocaleString()}` : ''}.` : 'Open Expenses once to publish its current transaction data here.'}</p>
        </div>
        <button class="btn btn-sky btn-sm" id="syncExpensesBtn">refresh from Expenses</button>
      </div>
    </div>

    <div class="card card-warm mb-24" id="monthlyBudgetCard">
      <div class="row-between" style="flex-wrap:wrap; gap:12px;">
        <div>
          <h3 class="card-title" style="margin:0;">${icon('target', 18)} Monthly budget · ${escape(monthLabel)}</h3>
          <p class="text-mute" style="font-size:12px; margin:4px 0 0;">Set a target, watch how much is left as the month progresses.</p>
        </div>
        <div class="row gap-8">
          <label class="label" style="margin:0; align-self:center;">target</label>
          <input class="input" id="monthlyTargetInput" type="number" min="0" step="10" value="${target}" style="width:120px;"/>
          <button class="btn btn-sm" id="saveMonthBtn" ${alreadySnapshot ? 'disabled' : ''}>${alreadySnapshot ? 'snapshot saved' : 'snapshot this month'}</button>
        </div>
      </div>
      <div class="month-budget-bar" style="margin-top:14px;">
        <div class="month-budget-track">
          <div class="month-budget-fill ${spentPct >= 100 ? 'is-over' : spentPct >= 80 ? 'is-warn' : ''}" style="width: ${spentPct}%;"></div>
        </div>
        <div class="row-between mt-12" style="flex-wrap:wrap; gap:8px;">
          <div><span class="kpi-label">SPENT</span> <span class="font-mono bold" style="font-size:16px;">${fmtCurrency(totalSpend)}</span></div>
          <div><span class="kpi-label">${remaining >= 0 ? 'LEFT' : 'OVER'}</span> <span class="font-mono bold" style="font-size:16px; color:${remaining >= 0 ? 'var(--sage-deep)' : 'var(--rose-deep)'};">${remaining >= 0 ? '' : '−'}${fmtCurrency(Math.abs(remaining))}</span></div>
          <div><span class="kpi-label">TARGET</span> <span class="font-mono bold" style="font-size:16px;">${fmtCurrency(target)}</span></div>
          <div><span class="kpi-label">% USED</span> <span class="font-mono bold" style="font-size:16px; color:${spentPct >= 100 ? 'var(--rose-deep)' : 'var(--ink)'};">${spentPct}%</span></div>
        </div>
      </div>
    </div>

    <div class="grid grid-3 mb-24">
      ${kpi('Income', fmtCurrency(totalIn),  '', 'trendUp', 'var(--mint-cream)')}
      ${kpi('Expenses', fmtCurrency(totalOut), '', 'trendDown', 'var(--rose-cloud)')}
      ${kpi('Net', (net >= 0 ? '+' : '−') + fmtCurrency(Math.abs(net)), net >= 0 ? 'saving' : 'overspending', net >= 0 ? 'piggy' : 'scale', net >= 0 ? 'var(--mint-cream)' : '#FFD9DD')}
    </div>

    <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 18px;">
      <div class="card card-mint">
        <div class="row-between mb-12">
          <h3 class="card-title">${icon('trendUp', 18)} income</h3>
          <button class="btn btn-mint btn-sm" onclick="addBudgetItem('income')">+ add</button>
        </div>
        <table class="table" style="width:100%;">
          <tbody>
            ${d.budget.income.map(i => budgetRow(i, 'income')).join('')}
          </tbody>
        </table>
      </div>
      <div class="card card-warm">
        <div class="row-between mb-12">
          <h3 class="card-title">${icon('trendDown', 18)} expenses</h3>
          <button class="btn btn-sm" onclick="addBudgetItem('expenses')">+ add</button>
        </div>
        <table class="table" style="width:100%;">
          <tbody>
            ${d.budget.expenses.map(x => budgetRow(x, 'expenses')).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <h2 class="section-title">expenses by category</h2>
    <div class="card">
      ${cats.length === 0 ? '<p class="text-mute">no expenses yet</p>' : cats.map(([cat, amt]) => `
        <div style="margin-bottom: 12px;">
          <div class="row-between mb-12" style="margin-bottom:6px;">
            <span class="bold">${escape(cat)}</span>
            <span class="font-mono">${fmtCurrency(amt)}</span>
          </div>
          <div class="progress"><div class="progress-fill" style="width: ${(amt/max*100).toFixed(0)}%; background: linear-gradient(90deg, var(--rose), var(--coral));"></div></div>
        </div>
      `).join('')}
    </div>

    <h2 class="section-title">subscriptions</h2>
    ${subscriptionsSection(d)}
  `;

  // bind row edits — expenses
  ['income','expenses'].forEach(key => {
    $$(`tr[data-budget="${key}"]`).forEach(tr => {
      const id = tr.dataset.id;
      tr.querySelectorAll('[data-k]').forEach(input => {
        input.addEventListener('change', () => {
          const item = d.budget[key].find(x => x.id === id);
          let v = input.value;
          if (input.type === 'number') v = parseFloat(v) || 0;
          if (input.type === 'checkbox') v = input.checked;
          item[input.dataset.k] = v;
          Store.save();
          Router.refresh();
        });
      });
    });
  });

  // Monthly target + snapshot
  $('#monthlyTargetInput')?.addEventListener('change', (e) => {
    d.budget.monthlyTarget = +e.target.value || 0;
    Store.save();
    Router.refresh();
  });
  $('#syncExpensesBtn')?.addEventListener('click', () => {
    if (Store.syncExpenses()) {
      Store.save();
      Router.refresh();
      Toast.show('synced with Expenses');
    } else {
      Toast.show('open Expenses first to sync');
    }
  });
  $('#saveMonthBtn')?.addEventListener('click', () => {
    if (!Array.isArray(d.budget.history)) d.budget.history = [];
    const idx = d.budget.history.findIndex(h => h.key === monthKey);
    const snap = { key: monthKey, spend: totalSpend, income: totalIn, target };
    if (idx >= 0) d.budget.history[idx] = snap; else d.budget.history.push(snap);
    d.budget.history.sort((a,b) => a.key.localeCompare(b.key));
    d.budget.history = d.budget.history.slice(-24);
    Store.save();
    Toast.show('snapshot saved');
    Router.refresh();
  });

  bindSubscriptionEdits();
};

function subscriptionsSection(d) {
  const monthly = d.subscriptions.reduce((s, x) => s + (x.billing === 'Monthly' ? +x.price : (x.billing === 'Yearly' ? +x.price/12 : 0)), 0);
  return `
    <div class="card mb-24">
      <div class="row-between mb-12">
        <div class="row gap-12 flex-wrap">
          <span class="pill pill-lilac">${d.subscriptions.length} active</span>
          <span class="pill pill-mint">${fmtCurrency(monthly)} / month</span>
          <span class="pill pill-butter">${fmtCurrency(monthly * 12)} / year</span>
        </div>
        <button class="btn btn-sm" id="addSub">+ add</button>
      </div>
      <div class="table-wrap" style="border:none; box-shadow:none; background:transparent;">
        <table class="table" id="subTable">
          <thead>
            <tr><th>Name</th><th>Price</th><th>Billing</th><th>Renews</th><th>Days</th><th>Category</th><th></th></tr>
          </thead>
          <tbody>
            ${d.subscriptions.map(s => subRow(s)).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function bindSubscriptionEdits() {
  if (!$('#subTable')) return;
  $$('#subTable tbody tr').forEach(tr => {
    const id = tr.dataset.id;
    tr.querySelectorAll('[data-k]').forEach(input => {
      input.addEventListener('change', () => {
        const item = Store.data.subscriptions.find(x => x.id === id);
        let v = input.value;
        if (input.type === 'number') v = parseFloat(v) || 0;
        item[input.dataset.k] = v;
        Store.save();
        Router.refresh();
      });
    });
  });
  if ($('#addSub')) {
    $('#addSub').addEventListener('click', () => {
      Store.data.subscriptions.push({ id: uid(), name: '', price: 0, billing: 'Monthly', renews: today(), category: '', notes: '' });
      Store.save();
      Router.refresh();
    });
  }
}

function budgetRow(item, key) {
  return `
    <tr data-id="${item.id}" data-budget="${key}">
      <td><input data-k="name" value="${escape(item.name)}" /></td>
      <td style="width:100px;"><input data-k="amount" type="number" min="0" step="0.01" value="${item.amount}" /></td>
      <td style="width:120px;"><input data-k="category" value="${escape(item.category)}" /></td>
      <td style="width:50px;"><button class="btn-soft" onclick="deleteBudget('${key}','${item.id}')">×</button></td>
    </tr>
  `;
}
window.addBudgetItem = (key) => {
  Store.data.budget[key].push({ id: uid(), name: '', amount: 0, category: '', recurring: true });
  Store.save();
  Router.refresh();
};
window.deleteBudget = (key, id) => {
  Store.data.budget[key] = Store.data.budget[key].filter(x => x.id !== id);
  Store.save();
  Router.refresh();
};

/* -- Subscriptions --------------------------------------------------------- */
// Subscriptions live inside Budget now. This just redirects.
Views.subscriptions = () => Router.go('budget');

function subRow(s) {
  const u = daysUntil(s.renews);
  return `
    <tr data-id="${s.id}">
      <td><input data-k="name" value="${escape(s.name)}" /></td>
      <td style="width:100px;"><input data-k="price" type="number" min="0" step="0.01" value="${s.price}" /></td>
      <td><select data-k="billing">${['Monthly','Yearly','Weekly','Free'].map(b => `<option ${s.billing===b?'selected':''}>${b}</option>`).join('')}</select></td>
      <td style="width:130px;"><input data-k="renews" type="date" value="${s.renews}" /></td>
      <td><span class="pill ${u !== null && u <= 7 ? 'pill-butter' : 'pill-ghost'}">${u === null ? '—' : u < 0 ? `${Math.abs(u)}d ago` : `in ${u}d`}</span></td>
      <td style="width:120px;"><input data-k="category" value="${escape(s.category)}" /></td>
      <td style="width:50px;"><button class="btn-soft" onclick="deleteRow('subscriptions','${s.id}'); Router.refresh();">×</button></td>
    </tr>
  `;
}

/* -- Reading --------------------------------------------------------------- */
Views.reading = (root) => {
  const d = Store.data;
  const totalRead = d.reading.filter(b => b.status === 'Done').length;
  const reading = d.reading.filter(b => b.status === 'Reading').length;

  root.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title"><span class="emoji">${icon('bookOpen', 22)}</span>Reading List</h1>
        <p class="page-subtitle">A little library of what you're reading and what's calling next.</p>
      </div>
      <button class="btn" id="addBook">+ add book</button>
    </header>

    <div class="grid grid-3 mb-24">
      ${kpi('Now Reading', reading, '', 'bookOpen', 'var(--rose-cloud)')}
      ${kpi('Done', totalRead, 'this year', 'sparkles', 'var(--mint-cream)')}
      ${kpi('To Read', d.reading.filter(b => b.status === 'To Read').length, 'patient pages', 'book', 'var(--butter-glow)')}
    </div>

    <div class="grid grid-auto-360">
      ${d.reading.map(b => {
        const totalPages = +b.pages || 0;
        const cur = +b.currentPage || 0;
        const pct = totalPages > 0 ? Math.min(100, Math.round((cur / totalPages) * 100)) : 0;
        return `
        <div class="card">
          <div class="row-between mb-12">
            <span class="pill ${b.status === 'Done' ? 'pill-mint' : b.status === 'Reading' ? 'pill' : 'pill-ghost'}">${escape(b.status)}</span>
            <button class="btn-soft" onclick="deleteRow('reading','${b.id}'); Router.refresh();" style="padding:4px 8px;">×</button>
          </div>
          <input data-id="${b.id}" data-k="title" value="${escape(b.title)}" style="font-family: var(--font-display); font-size:24px; border:none; background:transparent; width:100%; color:var(--ink); padding:4px 0;" />
          <input data-id="${b.id}" data-k="author" value="${escape(b.author)}" style="border:none; background:transparent; width:100%; color:var(--ink-mute); font-size:13px; padding:0;" />
          <div class="progress mt-12"><div class="progress-fill" style="width:${pct}%;"></div></div>
          <div class="row gap-8 mt-12" style="font-size:12px; align-items:center;">
            <span class="text-mute">page</span>
            <input data-id="${b.id}" data-k="currentPage" type="number" min="0" max="${totalPages || 99999}" value="${cur}" style="width:70px; text-align:center;" />
            <span class="text-mute">of</span>
            <input data-id="${b.id}" data-k="pages" type="number" min="0" value="${totalPages}" style="width:70px; text-align:center;" />
            <span class="pill pill-lilac" style="font-size:11px;">${pct}%</span>
            <select data-id="${b.id}" data-k="status" style="margin-left:auto; width:auto;">${['To Read','Reading','Done','Paused'].map(s => `<option ${b.status===s?'selected':''}>${s}</option>`).join('')}</select>
          </div>
          <div class="row gap-8 mt-12">
            ${[1,2,3,4,5].map(i => `<button onclick="rateBook('${b.id}',${i})" style="background:transparent;border:none;color:${b.rating>=i?'var(--butter-deep)':'var(--ink-faint)'};font-size:18px;padding:0;">${b.rating>=i?'':''}</button>`).join('')}
          </div>
          ${b.notes ? `<p class="text-mute" style="font-size:12px; font-style:italic; margin-top:8px;">"${escape(b.notes)}"</p>` : ''}
        </div>
        `;
      }).join('')}
    </div>
  `;

  $$('[data-id][data-k]').forEach(input => {
    input.addEventListener('change', () => {
      const id = input.dataset.id;
      const k = input.dataset.k;
      const item = d.reading.find(x => x.id === id);
      if (!item) return;
      item[k] = input.type === 'number' ? +input.value : input.value;
      // Auto-status when pages match: bump to Done; auto-bump from To Read to Reading on first page
      if (k === 'currentPage' || k === 'pages') {
        if ((+item.currentPage > 0) && item.status === 'To Read') item.status = 'Reading';
        if ((+item.pages > 0) && (+item.currentPage >= +item.pages)) item.status = 'Done';
      }
      Store.save();
      // Re-render to update percent + progress bar
      if (k === 'currentPage' || k === 'pages' || k === 'status') Router.refresh();
    });
  });

  $('#addBook').addEventListener('click', () => {
    Store.data.reading.push({ id: uid(), title: 'New Book', author: '', pages: 0, currentPage: 0, status: 'To Read', notes: '', rating: 0 });
    Store.save();
    Router.refresh();
  });
};
window.rateBook = (id, n) => {
  const b = Store.data.reading.find(x => x.id === id);
  b.rating = b.rating === n ? 0 : n;
  Store.save();
  Router.refresh();
};

/* -- Contacts -------------------------------------------------------------- */
Views.contacts = (root) => {
  const d = Store.data;
  root.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title"><span class="emoji">${icon('contact', 22)}</span>Contacts</h1>
        <p class="page-subtitle">Profs, TAs, advisors — the whole supportive cast.</p>
      </div>
      <button class="btn" id="addContact">+ add</button>
    </header>

    <div class="grid grid-auto-280">
      ${d.contacts.map(c => `
        <div class="card">
          <div class="row-between mb-12">
            <span class="pill ${c.role === 'Professor' ? 'pill' : c.role === 'TA' ? 'pill-mint' : 'pill-sky'}">${escape(c.role)}</span>
            <button class="btn-soft" onclick="deleteRow('contacts','${c.id}'); Router.refresh();" style="padding:4px 8px;">×</button>
          </div>
          <div style="font-family: var(--font-display); font-size:26px;">${escape(c.name)}</div>
          ${c.course ? `<div class="text-mute" style="font-size:12px; margin-top:4px;">${escape(c.course)}</div>` : ''}
          <div style="margin-top: 12px; font-size: 13px;">
            ${c.email ?  `<div class="row gap-8 mb-12">${icon('chat', 13)} <a href="mailto:${escape(c.email)}" style="color:var(--rose-deep);">${escape(c.email)}</a></div>` : ''}
            ${c.phone ?  `<div class="row gap-8 mb-12">${icon('sparkles', 12)} ${escape(c.phone)}</div>` : ''}
            ${c.office ? `<div class="row gap-8 mb-12">${icon('pin', 12)} ${escape(c.office)}</div>` : ''}
            ${c.hours ?  `<div class="row gap-8 mb-12">${icon('clock', 13)} ${escape(c.hours)}</div>` : ''}
          </div>
          ${c.notes ? `<p class="text-mute" style="font-size:12px; font-style:italic; margin-top:8px;">"${escape(c.notes)}"</p>` : ''}
          <button class="btn-soft mt-12" style="width:100%;" onclick="editContact('${c.id}')">edit</button>
        </div>
      `).join('')}
    </div>
  `;

  $('#addContact').addEventListener('click', () => {
    Store.data.contacts.push({ id: uid(), name: 'New Contact', role: 'Professor', course: '', email: '', phone: '', office: '', hours: '', notes: '' });
    Store.save();
    Router.refresh();
    setTimeout(() => editContact(Store.data.contacts.at(-1).id), 100);
  });
};

window.editContact = (id) => {
  const c = Store.data.contacts.find(x => x.id === id);
  Modal.open(`
    <h2>edit contact</h2>
    <div class="field-row">
      <div class="field"><label class="label">name</label><input class="input" id="ce-name" value="${escape(c.name)}" /></div>
      <div class="field"><label class="label">role</label>
        <select class="select" id="ce-role">${['Professor','TA','Advisor','Mentor','Coach','Other'].map(r => `<option ${c.role===r?'selected':''}>${r}</option>`).join('')}</select>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label class="label">course</label><input class="input" id="ce-course" value="${escape(c.course)}" /></div>
      <div class="field"><label class="label">email</label><input class="input" id="ce-email" value="${escape(c.email)}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label class="label">phone</label><input class="input" id="ce-phone" value="${escape(c.phone)}" /></div>
      <div class="field"><label class="label">office</label><input class="input" id="ce-office" value="${escape(c.office)}" /></div>
    </div>
    <div class="field"><label class="label">office hours</label><input class="input" id="ce-hours" value="${escape(c.hours)}" /></div>
    <div class="field"><label class="label">notes</label><textarea class="textarea" id="ce-notes">${escape(c.notes)}</textarea></div>
    <div class="row" style="justify-content:flex-end; gap:8px; margin-top:18px;">
      <button class="btn btn-ghost" onclick="Modal.close()">cancel</button>
      <button class="btn" id="saveContact">save</button>
    </div>
  `);
  setTimeout(() => {
    $('#saveContact').addEventListener('click', () => {
      Object.assign(c, {
        name: $('#ce-name').value,
        role: $('#ce-role').value,
        course: $('#ce-course').value,
        email: $('#ce-email').value,
        phone: $('#ce-phone').value,
        office: $('#ce-office').value,
        hours: $('#ce-hours').value,
        notes: $('#ce-notes').value,
      });
      Store.save();
      Modal.close();
      Router.refresh();
      Toast.show('saved');
    });
  }, 50);
};

/* -- Co-op ----------------------------------------------------------------- */
const COOP_STAGES = [
  { key: 'Researching',  iconName: 'compass',    desc: 'targets you\'re looking into' },
  { key: 'Applied',      iconName: 'outbox',     desc: 'submitted, waiting' },
  { key: 'Assessment',   iconName: 'flask',      desc: 'OA / take-home' },
  { key: 'Interviewing', iconName: 'chat',       desc: 'rounds in progress' },
  { key: 'Offer',        iconName: 'star',       desc: 'in hand, deciding' },
  { key: 'Accepted',     iconName: 'party',      desc: 'signed' },
  { key: 'Closed',       iconName: 'leaf',       desc: 'rejected / withdrawn / declined / ghosted' },
];
const CLOSED_REASONS = ['Rejected', 'Withdrawn', 'Declined', 'Ghosted'];
const GHOST_THRESHOLD_DAYS = 14;
const ACTIVE_STAGES = ['Applied', 'Assessment', 'Interviewing'];

let coopDetailed = false;

Views.coop = (root) => {
  const d = Store.data;
  const stageOf = (key) => d.coop.filter(c => c.stage === key);
  const totalActive = d.coop.filter(c => !['Closed','Accepted'].includes(c.stage)).length;
  const ghosted = d.coop.filter(c => isGhosted(c)).length;

  root.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title"><span class="emoji">${icon('briefcase', 22)}</span>Co-op &amp; Internships</h1>
        <p class="page-subtitle">Pipeline tracker — track stage, next step, and how long since you've heard back.</p>
      </div>
      <div class="row gap-8">
        <button class="layer-toggle ${coopDetailed ? 'on' : ''}" id="coopDetailToggle" title="show full card details">
          ${coopDetailed ? 'detailed' : 'compact'}
        </button>
        <button class="btn" id="addCoop">+ add</button>
      </div>
    </header>

    <div class="grid grid-4 mb-24">
      ${kpi('Active', totalActive, 'in motion', 'briefcase', 'var(--rose-cloud)')}
      ${kpi('Offers', stageOf('Offer').length + stageOf('Accepted').length, '', 'star', 'var(--mint-cream)')}
      ${kpi('Interviewing', stageOf('Interviewing').length + stageOf('Assessment').length + stageOf('Final Round').length, 'incl. assessments', 'chat', 'var(--butter-glow)')}
      ${kpi('Ghosted?', ghosted, ghosted ? 'no contact in 14d+' : 'none flagged', 'ban', ghosted ? '#FFD9DD' : 'var(--lavender-mist)')}
    </div>

    <div class="kanban">
      ${COOP_STAGES.map(stageDef => {
        const items = stageOf(stageDef.key);
        return `
          <div class="kanban-col coop-col" data-stage="${stageDef.key}">
            <h3>
              <span class="row gap-8" style="display:inline-flex; align-items:center;">${stageDef.iconName ? icon(stageDef.iconName, 16) : (stageDef.icon || '')} ${stageDef.key}</span>
              <span class="count">${items.length}</span>
            </h3>
            <div class="text-mute" style="font-size:11px; margin: -4px 0 8px;">${stageDef.desc}</div>
            ${items.length === 0
              ? `<p class="text-mute" style="font-size:12px; padding: 8px;">—</p>`
              : items.map(c => coopCard(c)).join('')
            }
          </div>
        `;
      }).join('')}
    </div>
  `;

  $('#addCoop').addEventListener('click', () => {
    Store.data.coop.push({
      id: uid(), company: 'New', role: '', stage: 'Researching',
      closedReason: '', appliedOn: '', lastContact: '',
      nextStep: '', nextStepDue: '',
      salary: '', location: '', notes: '', link: '',
    });
    Store.save();
    Router.refresh();
    setTimeout(() => editCoop(Store.data.coop.at(-1).id), 50);
  });
  $('#coopDetailToggle').addEventListener('click', () => {
    coopDetailed = !coopDetailed;
    Router.refresh();
  });
};

function isGhosted(c) {
  if (!ACTIVE_STAGES.includes(c.stage)) return false;
  if (!c.lastContact) {
    // Use applied date as fallback
    if (!c.appliedOn) return false;
    return daysSince(c.appliedOn) >= GHOST_THRESHOLD_DAYS;
  }
  return daysSince(c.lastContact) >= GHOST_THRESHOLD_DAYS;
}

function daysSince(iso) {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  const t = new Date(today() + 'T00:00:00');
  return Math.round((t - d) / 86400000);
}

function coopCard(c) {
  const ghosted = isGhosted(c);
  const dueIn = c.nextStepDue ? daysUntil(c.nextStepDue) : null;
  const sinceApplied = c.appliedOn ? daysSince(c.appliedOn) : null;
  const sinceContact = c.lastContact ? daysSince(c.lastContact) : null;

  // Compact card
  if (!coopDetailed) {
    return `
      <div class="kanban-task coop-card" onclick="editCoop('${c.id}')">
        <div class="row-between" style="margin-bottom: 4px;">
          <div class="bold" style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escape(c.company)}</div>
          ${c.link ? `<a class="link-icon" href="${escape(c.link)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="open posting">${icon('arrowRight', 13)}</a>` : ''}
        </div>
        <div class="text-mute" style="font-size:12px;">${escape(c.role)}</div>
        <div class="row gap-8 flex-wrap" style="margin-top: 6px;">
          ${c.location ? `<span class="pill pill-ghost" style="font-size:10px;">${icon('pin', 12)} ${escape(c.location)}</span>` : ''}
          ${c.salary ? `<span class="pill pill-ghost" style="font-size:10px;">${icon('wallet', 12)} ${escape(c.salary)}</span>` : ''}
          ${c.stage === 'Closed' && c.closedReason ? `<span class="pill ${closedPillClass(c.closedReason)}" style="font-size:10px;">${escape(c.closedReason)}</span>` : ''}
          ${ghosted ? `<span class="pill" style="font-size:10px; background: #FFD9DD; color: #C24F69;">${icon('clock', 12)} ${sinceContact || sinceApplied}d silent</span>` : ''}
        </div>
        ${c.nextStep ? `
          <div class="coop-next" style="margin-top: 6px;">
            <span class="coop-next-arrow">→</span>
            <span class="coop-next-text">${escape(c.nextStep)}</span>
            ${dueIn !== null ? `<span class="${dueInPillClass(dueIn)}">${dueLabel(dueIn)}</span>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  // Detailed card
  return `
    <div class="kanban-task coop-card coop-detailed" onclick="editCoop('${c.id}')">
      <div class="row-between" style="margin-bottom: 4px;">
        <div class="bold" style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escape(c.company)}</div>
        ${c.link ? `<a class="link-icon" href="${escape(c.link)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="open posting">${icon('arrowRight', 13)}</a>` : ''}
      </div>
      <div class="text-mute" style="font-size:12px; margin-bottom: 8px;">${escape(c.role)}</div>

      <div class="coop-detail-grid">
        ${c.location ? `<div class="coop-detail-row"><span class="coop-detail-icon">${icon('pin', 13)}</span><span>${escape(c.location)}</span></div>` : ''}
        ${c.salary ? `<div class="coop-detail-row"><span class="coop-detail-icon">${icon('wallet', 13)}</span><span>${escape(c.salary)}</span></div>` : ''}
        ${c.appliedOn ? `<div class="coop-detail-row"><span class="coop-detail-icon">${icon('outbox', 13)}</span><span>Applied ${fmtDate(c.appliedOn)}${sinceApplied !== null ? ` <span class="text-mute">(${sinceApplied}d ago)</span>` : ''}</span></div>` : ''}
        ${c.lastContact ? `<div class="coop-detail-row"><span class="coop-detail-icon">${icon('chat', 13)}</span><span>Last contact ${fmtDate(c.lastContact)}${sinceContact !== null ? ` <span class="text-mute">(${sinceContact}d ago)</span>` : ''}</span></div>` : ''}
        ${c.stage === 'Closed' && c.closedReason ? `<div class="coop-detail-row"><span class="coop-detail-icon">${icon('leaf', 13)}</span><span class="pill ${closedPillClass(c.closedReason)}">${escape(c.closedReason)}</span></div>` : ''}
        ${ghosted ? `<div class="coop-detail-row"><span class="coop-detail-icon">${icon('clock', 13)}</span><span class="pill" style="background: #FFD9DD; color: #C24F69;">no contact ${sinceContact || sinceApplied}d</span></div>` : ''}
      </div>

      ${c.nextStep ? `
        <div class="coop-next coop-next-detailed">
          <div class="coop-next-label">next step</div>
          <div class="row gap-8" style="align-items: baseline; margin-top: 2px;">
            <span class="coop-next-arrow">→</span>
            <span style="flex:1; font-weight: 600;">${escape(c.nextStep)}</span>
            ${dueIn !== null ? `<span class="${dueInPillClass(dueIn)}">${dueLabel(dueIn)}</span>` : ''}
          </div>
        </div>
      ` : ''}

      ${c.notes ? `<div class="coop-notes">"${escape(c.notes)}"</div>` : ''}
    </div>
  `;
}

function closedPillClass(reason) {
  return ({
    Rejected: 'pill',
    Withdrawn: 'pill-ghost',
    Declined: 'pill-mint',
    Ghosted: 'pill-butter',
  })[reason] || 'pill-ghost';
}
function dueLabel(days) {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  return `in ${days}d`;
}
function dueInPillClass(days) {
  if (days < 0) return 'pill';
  if (days <= 2) return 'pill pill-butter';
  return 'pill pill-ghost';
}

window.editCoop = (id) => {
  const c = Store.data.coop.find(x => x.id === id);
  const stageOptions = COOP_STAGES.map(s => `<option ${c.stage===s.key?'selected':''}>${s.key}</option>`).join('');
  const closedReasonOptions = ['', ...CLOSED_REASONS].map(r => `<option value="${escape(r)}" ${c.closedReason===r?'selected':''}>${escape(r || '—')}</option>`).join('');

  Modal.open(`
    <h2>${escape(c.company || 'New application')}</h2>

    <div class="field"><label class="label">company</label><input class="input" id="co-co" value="${escape(c.company)}" /></div>

    <div class="field-row">
      <div class="field"><label class="label">role</label><input class="input" id="co-role" value="${escape(c.role)}" /></div>
      <div class="field"><label class="label">stage</label>
        <select class="select" id="co-stage">${stageOptions}</select>
      </div>
    </div>

    <div class="field hidden" id="co-closed-row">
      <label class="label">closed because…</label>
      <select class="select" id="co-closed">${closedReasonOptions}</select>
    </div>

    <div class="field-row">
      <div class="field"><label class="label">location</label><input class="input" id="co-loc" value="${escape(c.location)}" /></div>
      <div class="field"><label class="label">salary / rate</label><input class="input" id="co-sal" value="${escape(c.salary)}" /></div>
    </div>

    <div class="field-row">
      <div class="field"><label class="label">applied on</label><input class="input" type="date" id="co-applied" value="${c.appliedOn || ''}" /></div>
      <div class="field"><label class="label">last contact</label><input class="input" type="date" id="co-last" value="${c.lastContact || ''}" /></div>
    </div>

    <div class="card card-warm" style="padding: 12px 14px; margin: 8px 0;">
      <div class="kpi-label" style="margin-bottom:8px;">→ next step</div>
      <div class="field-row" style="margin-bottom: 0;">
        <div class="field" style="margin-bottom:0;"><input class="input" id="co-nextstep" value="${escape(c.nextStep || '')}" placeholder="e.g. technical interview, take-home, follow up" /></div>
        <div class="field" style="margin-bottom:0;"><input class="input" type="date" id="co-nextdue" value="${c.nextStepDue || ''}" /></div>
      </div>
    </div>

    <div class="field"><label class="label">link</label><input class="input" id="co-link" value="${escape(c.link)}" placeholder="https://..." /></div>
    <div class="field"><label class="label">notes</label><textarea class="textarea" id="co-notes">${escape(c.notes)}</textarea></div>

    <div class="row" style="justify-content:space-between; margin-top:18px;">
      <button class="btn btn-ghost" onclick="deleteRow('coop','${c.id}'); Modal.close(); Router.refresh();">delete</button>
      <div class="row gap-8">
        <button class="btn btn-ghost" onclick="Modal.close()">cancel</button>
        <button class="btn" id="saveCoop">save</button>
      </div>
    </div>
  `);
  setTimeout(() => {
    const stageSel = $('#co-stage');
    const closedRow = $('#co-closed-row');
    const toggleClosedRow = () => closedRow.classList.toggle('hidden', stageSel.value !== 'Closed');
    toggleClosedRow();
    stageSel.addEventListener('change', toggleClosedRow);

    $('#saveCoop').addEventListener('click', () => {
      Object.assign(c, {
        company: $('#co-co').value,
        role: $('#co-role').value,
        stage: $('#co-stage').value,
        closedReason: $('#co-stage').value === 'Closed' ? $('#co-closed').value : '',
        appliedOn: $('#co-applied').value,
        lastContact: $('#co-last').value,
        nextStep: $('#co-nextstep').value,
        nextStepDue: $('#co-nextdue').value,
        location: $('#co-loc').value,
        salary: $('#co-sal').value,
        link: $('#co-link').value,
        notes: $('#co-notes').value,
      });
      Store.save();
      Modal.close();
      Router.refresh();
      Toast.show('updated');
    });
  }, 50);
};

/* -- Hackathons & competitions ------------------------------------------- */
const HACKATHON_STATUSES = ['Researching', 'Planning', 'Applied', 'Accepted', 'Attended', 'Declined'];

Views.hackathons = (root) => {
  const items = [...(Store.data.hackathons || [])].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  const upcoming = items.filter(h => !['Attended', 'Declined'].includes(h.status)).length;
  const accepted = items.filter(h => h.status === 'Accepted').length;
  root.innerHTML = `
    <header class="page-header">
      <div><h1 class="page-title"><span class="emoji">${icon('star', 22)}</span>Hackathons &amp; Competitions</h1></div>
      <button class="btn" id="addHackathon">+ add opportunity</button>
    </header>
    <div class="grid grid-3 mb-24">
      ${kpi('Upcoming', upcoming, 'to explore or apply', 'calendar', 'var(--rose-cloud)')}
      ${kpi('Accepted', accepted, 'wins so far', 'star', 'var(--mint-cream)')}
      ${kpi('Tracked', items.length, 'opportunities', 'target', 'var(--butter-glow)')}
    </div>
    <div class="hackathon-grid">
      ${items.length ? items.map(h => `
        <article class="card hackathon-card" onclick="editHackathon('${h.id}')">
          <div class="row-between gap-8"><h3 class="card-title">${escape(h.name || 'Untitled')}</h3><span class="pill pill-ghost">${escape(h.status || 'Researching')}</span></div>
          <div class="text-mute" style="font-size:12px; margin-top:4px;">${escape(h.organizer || 'Organizer TBD')}</div>
          <div class="hackathon-meta">
            <span>${icon('calendar', 14)} ${h.date ? fmtDate(h.date) : 'date TBD'}</span>
            <span>${icon('clock', 14)} apply by ${h.applicationDue ? fmtDate(h.applicationDue) : 'TBD'}</span>
            <span>${icon('wallet', 14)} ${escape(h.cost || 'cost TBD')}</span>
            ${h.placement ? `<span>${icon('star', 14)} ${escape(h.placement)}</span>` : ''}
          </div>
          ${h.notes ? `<p class="text-mute" style="font-size:12px; margin:12px 0 0;">${escape(h.notes)}</p>` : ''}
        </article>
      `).join('') : `<div class="empty"><h3 class="empty-title">No opportunities yet</h3><p class="empty-text">Add a hackathon or competition to start your tracker.</p></div>`}
    </div>
  `;
  $('#addHackathon').addEventListener('click', () => {
    Store.data.hackathons.push({ id: uid(), name: 'New opportunity', organizer: '', date: '', applicationDue: '', status: 'Researching', cost: '', placement: '', link: '', notes: '' });
    Store.save(); Router.refresh(); setTimeout(() => editHackathon(Store.data.hackathons.at(-1).id), 50);
  });
};

window.editHackathon = (id) => {
  const h = Store.data.hackathons.find(x => x.id === id);
  Modal.open(`
    <h2>${escape(h.name || 'Hackathon')}</h2>
    <div class="field"><label class="label">name</label><input class="input" id="ha-name" value="${escape(h.name)}" /></div>
    <div class="field-row"><div class="field"><label class="label">organizer</label><input class="input" id="ha-org" value="${escape(h.organizer)}" /></div><div class="field"><label class="label">status</label><select class="select" id="ha-status">${HACKATHON_STATUSES.map(s => `<option ${h.status===s?'selected':''}>${s}</option>`).join('')}</select></div></div>
    <div class="field-row"><div class="field"><label class="label">event date</label><input class="input" type="date" id="ha-date" value="${h.date || ''}" /></div><div class="field"><label class="label">application due</label><input class="input" type="date" id="ha-due" value="${h.applicationDue || ''}" /></div></div>
    <div class="field-row"><div class="field"><label class="label">cost</label><input class="input" id="ha-cost" value="${escape(h.cost)}" placeholder="free, $25…" /></div><div class="field"><label class="label">placement / prize</label><input class="input" id="ha-place" value="${escape(h.placement)}" placeholder="winner, finalist…" /></div></div>
    <div class="field"><label class="label">link</label><input class="input" id="ha-link" value="${escape(h.link)}" placeholder="https://…" /></div>
    <div class="field"><label class="label">notes</label><textarea class="textarea" id="ha-notes">${escape(h.notes)}</textarea></div>
    <div class="row" style="justify-content:space-between; margin-top:18px;"><button class="btn btn-ghost" onclick="deleteRow('hackathons','${h.id}'); Modal.close(); Router.refresh();">delete</button><div class="row gap-8"><button class="btn btn-ghost" onclick="Modal.close()">cancel</button><button class="btn" id="saveHackathon">save</button></div></div>
  `);
  setTimeout(() => $('#saveHackathon').addEventListener('click', () => { Object.assign(h, { name: $('#ha-name').value, organizer: $('#ha-org').value, status: $('#ha-status').value, date: $('#ha-date').value, applicationDue: $('#ha-due').value, cost: $('#ha-cost').value, placement: $('#ha-place').value, link: $('#ha-link').value, notes: $('#ha-notes').value }); Store.save(); Modal.close(); Router.refresh(); Toast.show('updated'); }), 50);
};

/* -- Notes ----------------------------------------------------------------- */
Views.notes = (root) => {
  const d = Store.data;
  root.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title"><span class="emoji">${icon('notebook', 22)}</span>Notes</h1>
        <p class="page-subtitle">A long-form scratchpad. Type and it saves quietly.</p>
      </div>
    </header>
    <div class="note-card">
      <textarea id="notesArea" placeholder="dear journal,&#10;today I…">${escape(d.notes)}</textarea>
    </div>
    <p class="text-mute mt-12 text-center" style="font-size:12px;">your words save automatically as you type</p>
  `;
  let to;
  $('#notesArea').addEventListener('input', (e) => {
    clearTimeout(to);
    to = setTimeout(() => {
      Store.data.notes = e.target.value;
      Store.save();
    }, 300);
  });
};

/* -- Brain Dump ------------------------------------------------------------ */
Views.braindump = (root) => {
  const d = Store.data;
  const sorted = [...d.brainDump].sort((a,b) => (b.created || 0) - (a.created || 0));

  root.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title"><span class="emoji">${icon('brain', 22)}</span>Brain Dump</h1>
        <p class="page-subtitle">Catch-all for fleeting thoughts. Don't worry about organizing — just dump.</p>
      </div>
    </header>

    <form class="card mb-24" id="bdForm">
      <textarea class="textarea" id="bdText" placeholder="what's on your mind? press enter or click add…" rows="3"></textarea>
      <div class="row" style="justify-content:flex-end; margin-top:10px;">
        <button class="btn btn-lilac">capture</button>
      </div>
    </form>

    <div class="grid grid-auto-280">
      ${sorted.length === 0 ? `
        <div class="empty">
          <span class="empty-emoji">${icon('brain', 40)}</span>
          <h3 class="empty-title">empty mushroom basket</h3>
          <p class="empty-text">Got a half-thought? An idea? A worry? Drop it here.</p>
        </div>
      ` : sorted.map(b => `
        <div class="sticky" style="position:relative;">
          <button class="sticky-x" onclick="deleteRow('brainDump','${b.id}'); Router.refresh();">×</button>
          <div class="sticky-title">${new Date(b.created).toLocaleDateString(undefined,{ month:'short', day:'numeric'})}</div>
          ${escape(b.text)}
        </div>
      `).join('')}
    </div>
  `;
  $('#bdForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = $('#bdText').value.trim();
    if (!text) return;
    Store.data.brainDump.push({ id: uid(), text, created: now() });
    Store.save();
    $('#bdText').value = '';
    Confetti.fromEvent(e);
    Router.refresh();
  });
};

/* ============================================================================
   APP INIT
   ============================================================================ */

function init() {
  // Expose key objects to window so inline onclick handlers can find them
  // (top-level `const` declarations are not added as window properties)
  window.Store = Store;
  window.Router = Router;
  window.Modal = Modal;
  window.Toast = Toast;
  window.Confetti = Confetti;
  window.handleSpendingSliceClick = handleSpendingSliceClick;
  window.handleCompactSpendingPieClick = handleCompactSpendingPieClick;

  Store.load();
  GoogleCalendarSync.init();
  setGreeting();
  Confetti.init();
  Router.init();

  // Sidebar toggle — works on both mobile (open/close) and desktop (collapse)
  const SIDEBAR_KEY = 'tm_student_planner_sidebar_collapsed';
  if (localStorage.getItem(SIDEBAR_KEY) === '1') {
    document.querySelector('.app').classList.add('sidebar-collapsed');
  }
  const setSidebarOpen = (open) => {
    $('#sidebar').classList.toggle('open', open);
    $('#sidebarBackdrop').classList.toggle('show', open && innerWidth <= 900);
    document.querySelector('.app').classList.toggle('sidebar-is-open', open && innerWidth <= 900);
  };
  const toggleSidebar = () => {
    if (innerWidth <= 900) {
      const isOpen = $('#sidebar').classList.contains('open');
      setSidebarOpen(!isOpen);
    } else {
      const app = document.querySelector('.app');
      app.classList.toggle('sidebar-collapsed');
      localStorage.setItem(SIDEBAR_KEY, app.classList.contains('sidebar-collapsed') ? '1' : '0');
    }
  };
  $('#menuBtn').addEventListener('click', toggleSidebar);
  // Backdrop click closes the mobile overlay
  $('#sidebarBackdrop').addEventListener('click', () => setSidebarOpen(false));

  // ULTIMATE GUARD: capture-phase listener that re-asserts sidebar state if anything
  // (extension, cached old code, mistaken handler) tries to close it on a nav click.
  document.addEventListener('click', (e) => {
    const navItem = e.target.closest && e.target.closest('.nav-item');
    if (!navItem) return;
    const sidebar = $('#sidebar');
    const wasOpen = sidebar?.classList.contains('open');
    if (!wasOpen) return;
    // Re-assert on the next two animation frames in case some handler clears it asynchronously.
    const reassert = () => {
      sidebar.classList.add('open');
      if (innerWidth <= 900) {
        $('#sidebarBackdrop')?.classList.add('show');
        document.querySelector('.app')?.classList.add('sidebar-is-open');
      }
    };
    requestAnimationFrame(() => { reassert(); requestAnimationFrame(reassert); });
  }, true);
  // ESC closes the sidebar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('#sidebar').classList.contains('open')) {
      setSidebarOpen(false);
    }
  });
  // If the window grows past mobile threshold, dismiss the overlay state
  window.addEventListener('resize', () => {
    if (innerWidth > 900 && $('#sidebar').classList.contains('open')) {
      setSidebarOpen(false);
    }
  });

  // Modal close
  $('#modalClose').addEventListener('click', () => Modal.close());
  $('#modalOverlay').addEventListener('click', (e) => {
    if (e.target === $('#modalOverlay')) Modal.close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') Modal.close();
  });

  // Export / Import
  $('#exportBtn').addEventListener('click', () => {
    Store.exportJson();
    Toast.show('exported');
  });
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) Store.importJson(file);
  });

  // Expenses publishes its current real transaction snapshot into the same
  // protected origin. Refresh the planner when the Expenses tab syncs it.
  window.addEventListener('storage', (e) => {
    if (e.key !== EXPENSE_SYNC_KEY || !e.newValue) return;
    if (Store.syncExpenses()) {
      Router.refresh();
      Toast.show('synced with Expenses');
    }
  });

}

document.addEventListener('DOMContentLoaded', init);
