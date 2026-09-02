import { createServer } from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.WORKSPACE_PREVIEW_PORT || 8000);
const workspacePassword = process.env.WORKSPACE_PASSWORD || 'worklel';
const workspaceSecret = process.env.WORKSPACE_AUTH_SECRET || 'local-preview-secret-change-me';
const cookieName = 'workspace_auth';
const cookieMaxAge = 60 * 60 * 24 * 365;

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.jsx': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

function sign(message) {
  return createHmac('sha256', workspaceSecret).update(message).digest('hex');
}

function makeToken() {
  const issued = String(Date.now());
  return `${issued}.${sign(issued)}`;
}

function validToken(token) {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot < 0) return false;
  const issued = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!/^\d+$/.test(issued)) return false;
  const issuedAt = Number(issued);
  if (!Number.isSafeInteger(issuedAt)) return false;
  if (issuedAt > Date.now() + 5 * 60 * 1000) return false;
  if (Date.now() - issuedAt > cookieMaxAge * 1000) return false;
  const expected = Buffer.from(sign(issued));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function readCookie(header, name) {
  if (!header) return '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return '';
}

function send(response, status, body = '', headers = {}) {
  response.writeHead(status, { 'cache-control': 'no-store', ...headers });
  response.end(body);
}

function sendJson(response, status, payload, headers = {}) {
  send(response, status, JSON.stringify(payload), { 'content-type': 'application/json; charset=utf-8', ...headers });
}

function safeWorkspaceNext(value) {
  return /^(?:\/school-notes|\/workspace\/(?:expenses|project-in-progress|road-to-ca))(?:[/?#][\w\-./?=&%#]*)?$/.test(value)
    ? value
    : '/workspace/';
}

async function readRequestBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16 * 1024) throw new Error('Request too large.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function existingFile(pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return null; }
  const relative = decoded === '/portal' ? '/portal.html' : decoded;
  let candidate = resolve(siteRoot, `.${relative}`);
  if (candidate !== siteRoot && !candidate.startsWith(siteRoot + sep)) return null;
  try {
    const info = await stat(candidate);
    if (info.isDirectory()) candidate = resolve(candidate, 'index.html');
    const finalInfo = await stat(candidate);
    return finalInfo.isFile() ? candidate : null;
  } catch {
    return null;
  }
}

async function expenseFile(pathname) {
  const expenseRoot = resolve(siteRoot, 'expenses', 'spending-tracker', 'dist');
  const relative = pathname.replace(/^\/expenses\/?/, '');
  let candidate = relative ? resolve(expenseRoot, relative) : resolve(expenseRoot, 'index.html');
  if (candidate !== expenseRoot && !candidate.startsWith(expenseRoot + sep)) return null;
  try {
    const info = await stat(candidate);
    if (info.isDirectory()) candidate = resolve(candidate, 'index.html');
    return (await stat(candidate)).isFile() ? candidate : null;
  } catch {
    try {
      const fallback = resolve(expenseRoot, 'index.html');
      return (await stat(fallback)).isFile() ? fallback : null;
    } catch {
      return null;
    }
  }
}

async function sendFile(response, filePath, method) {
  if (!filePath) return send(response, 404, 'Not found', { 'content-type': 'text/plain; charset=utf-8' });
  const contentType = mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream';
  if (method === 'HEAD') return send(response, 200, '', { 'content-type': contentType });
  const body = await readFile(filePath);
  return send(response, 200, body, { 'content-type': contentType });
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || `localhost:${port}`}`);
    const pathname = url.pathname;
    const workspaceUnlocked = validToken(readCookie(request.headers.cookie, cookieName));

    if (pathname === '/notes' || pathname === '/notes/') {
      return send(response, 308, '', { location: '/school-notes/' });
    }

    if (pathname === '/workspace/school-notes' || pathname.startsWith('/workspace/school-notes/')) {
      const suffix = pathname.slice('/workspace/school-notes'.length);
      return send(response, 308, '', { location: `/school-notes${suffix || '/'}${url.search}` });
    }

    if (pathname === '/private' || pathname === '/private/') {
      return send(response, 308, '', { location: '/workspace/road-to-ca/' });
    }

    if (pathname === '/workspace/session') {
      return sendJson(response, 200, { ok: workspaceUnlocked, configured: true });
    }

    if (pathname === '/workspace/auth') {
      if (request.method !== 'POST') return sendJson(response, 405, { ok: false, error: 'Method not allowed.' });
      const form = new URLSearchParams(await readRequestBody(request));
      if (form.get('password') !== workspacePassword) return sendJson(response, 401, { ok: false, error: 'Wrong password.' });
      return sendJson(response, 200, { ok: true }, {
        'set-cookie': `${cookieName}=${makeToken()}; Path=/; Max-Age=${cookieMaxAge}; HttpOnly; SameSite=Lax`,
      });
    }

    if (pathname === '/workspace/logout') {
      return send(response, 303, '', {
        location: '/workspace/',
        'set-cookie': `${cookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
      });
    }

    if (pathname.startsWith('/workspace/') && pathname !== '/workspace/') {
      if (!workspaceUnlocked) {
        const target = safeWorkspaceNext(pathname + url.search);
        return send(response, 303, '', { location: `/workspace/?next=${encodeURIComponent(target)}` });
      }
    }

    if (pathname === '/school-notes' || pathname.startsWith('/school-notes/')) {
      if (!workspaceUnlocked) {
        const target = safeWorkspaceNext(pathname + url.search);
        return send(response, 303, '', { location: `/workspace/?next=${encodeURIComponent(target)}` });
      }
    }

    if (pathname === '/expenses' || pathname.startsWith('/expenses/')) {
      if (!workspaceUnlocked) return send(response, 303, '', { location: `/workspace/?next=${encodeURIComponent('/workspace/expenses/')}` });
      return sendFile(response, await expenseFile(pathname), request.method);
    }

    if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
      return send(response, 405, 'Method not allowed', { 'content-type': 'text/plain; charset=utf-8' });
    }

    return sendFile(response, await existingFile(pathname), request.method);
  } catch (error) {
    return send(response, 500, error && error.message ? error.message : 'Preview server error', { 'content-type': 'text/plain; charset=utf-8' });
  }
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Workspace preview ready at http://localhost:${port}/workspace/\n`);
});
