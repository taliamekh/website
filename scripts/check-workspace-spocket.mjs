import { readFile } from 'node:fs/promises';

const workspace = await readFile(new URL('../workspace/index.html', import.meta.url), 'utf8');
const schoolNotes = await readFile(new URL('../school-notes/index.html', import.meta.url), 'utf8');
const assistant = await readFile(new URL('../school-notes/SpocketOnboarding.jsx', import.meta.url), 'utf8');
const mount = await readFile(new URL('../workspace/spocket-mount.js', import.meta.url), 'utf8');

const checks = [
  ['Workspace has the real Spocket mount', workspace.includes('id="spocket-root"')],
  ['Workspace loads the shared assistant', workspace.includes('../school-notes/SpocketOnboarding.jsx')],
  ['School Notes is a top-level quick link', workspace.includes('href="/school-notes/"')],
  ['Workspace has a Study with Spocket quick link', workspace.includes('href="/school-notes/?spocket=study"')],
  ['Workspace loads the guarded shared mount', workspace.includes('spocket-mount.js')],
  ['School Notes loads the guarded shared mount', schoolNotes.includes('../workspace/spocket-mount.js')],
  ['School Notes is standalone without the public-site menu', !schoolNotes.includes('<nav>') && !schoolNotes.includes('class="nav-links"')],
  ['The assistant still has idle jokes', assistant.includes('const IDLE_JOKES = [')],
  ['The assistant still has the parked hover menu', assistant.includes('function ParkedRobot({')],
  ['The parked menu also opens by click or keyboard', assistant.includes('aria-label="Open Spocket menu"')],
  ['Study mode can open directly from a quick link', assistant.includes('spocket=study') && assistant.includes('startStudy();')],
  ['Mobile parked Spocket is static but tap-enabled', assistant.includes('h || isMobile ? "none"') && assistant.includes('if (!isMobile) { cancelClose(); setH(true); }')],
  ['The decorative Workspace fallback is gone', !workspace.includes('class="workspace-spocket"')],
  ['My Desk is absent from the assistant', !/my desk/i.test(assistant)],
  ['The mount exposes a ready status', mount.includes("spocketStatus = 'ready'")],
];

const failed = checks.filter(([, ok]) => !ok);
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
if (failed.length) process.exitCode = 1;
