import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';

const expectedLinks = JSON.parse(await readFile(new URL('../workspace/links.json', import.meta.url), 'utf8'));

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const server = spawn(process.execPath, ['scripts/workspace-preview.mjs'], {
  env: { ...process.env, WORKSPACE_PREVIEW_PORT: '8124', WORKSPACE_PASSWORD: 'browser-test-only' }, stdio: ['ignore', 'pipe', 'inherit']
});
await once(server.stdout, 'data');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const origin = 'http://localhost:8124';
const waitForLock = () => page.locator('#workspace-password').waitFor({ state: 'visible' });
const navBoxes = () => page.locator('.site-nav').boundingBox();
try {
  // The first paint and every intermediate frame must contain no private links.
  let releaseSession;
  const sessionWait = new Promise(resolve => { releaseSession = resolve; });
  await page.route('**/workspace/session', async route => {
    await sessionWait;
    await route.continue().catch(() => {});
  });
  await page.goto(`${origin}/#option-1/workspace`);
  await waitForLock();
  assert.equal(await page.locator('.workspace-card').count(), 0);
  assert.equal(await page.locator('#workspace-password').isDisabled(), true);
  assert.equal(await page.locator('.workspace-page').isVisible(), false);
  const pendingBox = await page.locator('.modal-card').boundingBox();
  releaseSession();
  await page.waitForFunction(() => !document.querySelector('#workspace-password').disabled);
  const lockedBox = await page.locator('.modal-card').boundingBox();
  assert.deepEqual(lockedBox, pendingBox, 'Session completion must not move the lock card');
  await page.unroute('**/workspace/session');
  await page.locator('#workspace-password').fill('wrong');
  await page.locator('#workspace-auth-form button').click();
  await page.getByText('Wrong password.', { exact: true }).waitFor();
  assert.equal(await page.locator('.workspace-card').count(), 0);

  // Short/long/locked pages keep exactly the same nav position and width.
  const navReference = await navBoxes();
  for (const route of ['home', 'projects', 'workspace', 'portal', 'contact', 'workspace']) {
    await page.locator(`.nav-links [data-page-link="${route}"]`).click();
    await page.waitForFunction(route => document.body.dataset.page === route, route);
    assert.deepEqual(await navBoxes(), navReference, `Navigation geometry changed on ${route}`);
  }
  await page.waitForFunction(() => !document.querySelector('#workspace-password').disabled);
  await page.locator('#workspace-password').fill('browser-test-only');
  await page.locator('#workspace-auth-form button').click();
  await page.locator('.workspace-card').first().waitFor();
  assert.equal(await page.locator('.workspace-card').count(), expectedLinks.length);
  await page.waitForFunction(() => document.querySelector('#spocket-root').dataset.spocketStatus === 'ready');
  assert.equal((await context.request.get(`${origin}/workspace/links.json`)).status(), 200);
  await page.reload();
  await page.locator('.workspace-card').first().waitFor();
  assert.equal(await page.locator('.workspace-card').count(), expectedLinks.length, 'Remembered device should unlock after verification');

  // A delayed response from a previous Workspace visit cannot unlock a new visit.
  let releaseOld;
  const oldWait = new Promise(resolve => { releaseOld = resolve; });
  let requests = 0;
  await page.route('**/workspace/session', async route => {
    requests += 1;
    if (requests === 1) {
      await oldWait;
      await route.fulfill({ json: { ok: true, configured: true } }).catch(() => {});
    } else await route.fulfill({ json: { ok: false, configured: true } });
  });
  await page.locator('.nav-links [data-page-link="home"]').click();
  await page.locator('.nav-links [data-page-link="workspace"]').click();
  await page.waitForFunction(() => document.querySelector('#workspace-password')?.disabled);
  await page.locator('.nav-links [data-page-link="contact"]').click();
  await page.locator('.nav-links [data-page-link="workspace"]').click();
  await page.waitForFunction(() => !document.querySelector('#workspace-password')?.disabled);
  releaseOld();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await page.locator('.workspace-card').count(), 0);
  await page.unroute('**/workspace/session');

  // A restored page must not reuse private markup or a cookie removed elsewhere.
  await page.reload();
  await page.locator('.workspace-card').first().waitFor();
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  assert.equal(await page.locator('.workspace-card').count(), 0);
  await context.clearCookies();
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await page.waitForFunction(() => !document.querySelector('#workspace-password').disabled);
  assert.equal(await page.locator('.workspace-card').count(), 0);
  await page.locator('#workspace-password').fill('browser-test-only');
  await page.locator('#workspace-auth-form button').click();
  await page.locator('.workspace-card').first().waitFor();
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('sr-notes-lock-request')));
  await page.waitForURL('**/#option-1/workspace');
  await waitForLock();
  assert.equal((await (await context.request.get(`${origin}/workspace/session`)).json()).ok, false);

  await page.route('**/workspace/session', route => route.abort());
  await page.reload();
  await page.getByText('Workspace access could not be checked. Please try again.', { exact: true }).waitFor();
  assert.equal(await page.locator('.workspace-card').count(), 0, 'Network failure must fail closed');
  await page.unroute('**/workspace/session');
  await context.clearCookies();
  await page.reload();
  await waitForLock();
  if (process.env.WORKSPACE_SCREENSHOT) await page.screenshot({ path: process.env.WORKSPACE_SCREENSHOT });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.menu-toggle').click();
  await page.locator('.nav-links [data-page-link="projects"]').click();
  await page.waitForFunction(() => document.body.dataset.page === 'projects');
  await page.locator('.menu-toggle').click();
  await page.locator('.nav-links [data-page-link="workspace"]').click();
  await waitForLock();
  assert.equal(await page.locator('.workspace-card').count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  if (process.env.WORKSPACE_SCREENSHOT) await page.screenshot({ path: process.env.WORKSPACE_SCREENSHOT.replace('.png', '-mobile.png') });
  assert.deepEqual(errors, []);
  console.log('PASS delayed session, empty private DOM, stable lock/nav geometry, wrong/correct password, Spocket, reload, stale requests, restored pages, logout, offline denial, mobile navigation');
} finally {
  await browser.close();
  server.kill();
}
