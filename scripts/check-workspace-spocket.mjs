import { readFile } from 'node:fs/promises';

const shell = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const siteApp = await readFile(new URL('../site/app.js', import.meta.url), 'utf8');
const schoolNotes = await readFile(new URL('../school-notes/index.html', import.meta.url), 'utf8');
const assistant = await readFile(new URL('../school-notes/SpocketOnboarding.jsx', import.meta.url), 'utf8');
const mount = await readFile(new URL('../workspace/spocket-mount.js', import.meta.url), 'utf8');

const checks = [
  ['Workspace has the real Spocket mount', siteApp.includes('id="spocket-root"')],
  ['Production shell loads the shared assistant', shell.includes('/school-notes/SpocketOnboarding.jsx')],
  ['School Notes is a top-level quick link', siteApp.includes("title: 'School Notes', href: '/school-notes/?redesign=1'")],
  ['Workspace has a Study with Spocket quick link', siteApp.includes("title: 'Study with Spocket', href: '/school-notes/?spocket=study&redesign=1'")],
  ['Workspace checks the server session before revealing private links', siteApp.includes("fetch('/workspace/session'") && siteApp.includes("fetch('/workspace/auth'")],
  ['School Notes loads the guarded shared mount', schoolNotes.includes('../workspace/spocket-mount.js')],
  ['School Notes is standalone without the public-site menu', !schoolNotes.includes('<nav>') && !schoolNotes.includes('class="nav-links"')],
  ['The assistant still has idle jokes', assistant.includes('const IDLE_JOKES = [')],
  ['The assistant still has the parked hover menu', assistant.includes('function ParkedRobot({')],
  ['The parked menu also opens by click or keyboard', assistant.includes('aria-label="Open Spocket menu"')],
  ['Study mode can open directly from a quick link', assistant.includes('spocket=study') && assistant.includes('startStudy();')],
  ['Mobile parked Spocket is static but tap-enabled', assistant.includes('h || isMobile ? "none"') && assistant.includes('if (!isMobile) { cancelClose(); setH(true); }')],
  ['The decorative Workspace fallback is gone', !siteApp.includes('class="workspace-spocket"')],
  ['My Desk is absent from the assistant', !/my desk/i.test(assistant)],
  ['The standalone mount exposes a ready status', mount.includes("spocketStatus = 'ready'")],
  ['The production shell exposes a ready status', siteApp.includes("mount.dataset.spocketStatus = 'ready'")],
];

const failed = checks.filter(([, ok]) => !ok);
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
if (failed.length) process.exitCode = 1;
