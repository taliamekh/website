import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import middleware from '../middleware.js';

process.env.WORKSPACE_PASSWORD = 'test-password-only';
process.env.WORKSPACE_AUTH_SECRET = 'test-secret-only';
process.env.EXPENSES_PASSWORD = 'expense-test-password';
process.env.EXPENSES_AUTH_SECRET = 'expense-test-secret';

const request = (path, options) => new Request(`https://workspace.test${path}`, options);
const protectedPaths = ['/workspace/links.json', '/workspace/student-planner/',
  '/workspace/student-planner/app.js', '/workspace/road-to-ca/', '/workspace/project-in-progress/',
  '/school-notes/', '/school-notes/SpocketOnboarding.jsx', '/expenses/', '/expenses/assets/app.js'];

for (const path of protectedPaths) {
  const response = await middleware(request(path));
  assert.notEqual(response.headers.get('x-middleware-next'), '1', `Anonymous access: ${path}`);
}
assert.equal((await (await middleware(request('/workspace/session'))).json()).ok, false);

async function login(password, origin = 'https://workspace.test') {
  return middleware(request('/workspace/auth', { method: 'POST',
    headers: { Accept: 'application/json', Origin: origin }, body: new URLSearchParams({ password }) }));
}
assert.equal((await login('wrong')).status, 401);
assert.equal((await login('test-password-only', 'https://other.test')).status, 403);
const signedIn = await login('test-password-only');
assert.equal(signedIn.status, 200);
const setCookie = signedIn.headers.get('set-cookie');
assert.match(setCookie, /HttpOnly; Secure; SameSite=Lax/);
const cookie = setCookie.split(';')[0];
for (const path of protectedPaths) {
  const response = await middleware(request(path, { headers: { Cookie: cookie } }));
  assert.equal(response.headers.get('x-middleware-next'), '1', `Signed-in access: ${path}`);
  assert.match(response.headers.get('cache-control'), /private, no-store/);
}
const expired = String(Date.now() - 366 * 24 * 60 * 60 * 1000);
const expiredSignature = createHmac('sha256', process.env.WORKSPACE_AUTH_SECRET).update(expired).digest('hex');
for (const invalidCookie of [`${cookie}tampered`, `workspace_auth=${expired}.${expiredSignature}`]) {
  const response = await middleware(request('/workspace/links.json', { headers: { Cookie: invalidCookie } }));
  assert.notEqual(response.headers.get('x-middleware-next'), '1');
}
const logout = await middleware(request('/workspace/logout', { headers: { Cookie: cookie } }));
assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
delete process.env.WORKSPACE_PASSWORD;
delete process.env.WORKSPACE_AUTH_SECRET;
assert.equal((await login('expense-test-password')).status, 200, 'Configured Expenses fallback works');
delete process.env.EXPENSES_PASSWORD;
delete process.env.EXPENSES_AUTH_SECRET;
assert.equal((await login('anything')).status, 500, 'Missing configuration fails closed');
console.log('PASS private routes, asset protection, login, cookie flags, tampering, expiration, logout, fallback and missing configuration');
