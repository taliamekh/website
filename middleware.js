import { next } from '@vercel/edge';

export const config = {
  matcher: ['/expenses', '/expenses/(.*)', '/school-notes', '/school-notes/(.*)', '/workspace', '/workspace/(.*)'],
};

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const TOKEN_CLOCK_SKEW = 5 * 60 * 1000;

const EXPENSES_ROUTE = {
  prefix: '/expenses',
  title: 'Expenses',
  cookieName: 'expenses_auth',
  cookiePath: '/',
  passwordEnv: 'EXPENSES_PASSWORD',
  secretEnv: 'EXPENSES_AUTH_SECRET',
  missingConfig: 'Expenses gate is not configured. Set EXPENSES_PASSWORD and EXPENSES_AUTH_SECRET in Vercel project env vars.',
};

const WORKSPACE_ROUTE = {
  prefix: '/workspace',
  title: 'Workspace',
  cookieName: 'workspace_auth',
  cookiePath: '/',
  passwordEnv: 'WORKSPACE_PASSWORD',
  secretEnv: 'WORKSPACE_AUTH_SECRET',
  fallbackPasswordEnv: 'EXPENSES_PASSWORD',
  fallbackSecretEnv: 'EXPENSES_AUTH_SECRET',
  missingConfig: 'Workspace access is not configured. Set WORKSPACE_PASSWORD and WORKSPACE_AUTH_SECRET in Vercel project env vars.',
};

const encoder = new TextEncoder();

function routePassword(route) {
  return process.env[route.passwordEnv] || (route.fallbackPasswordEnv ? process.env[route.fallbackPasswordEnv] : '');
}

function routeSecret(route) {
  return process.env[route.secretEnv] || (route.fallbackSecretEnv ? process.env[route.fallbackSecretEnv] : '');
}

async function hmacSign(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function isValidToken(token, secret) {
  if (!token || !secret) return false;
  const dot = token.indexOf('.');
  if (dot < 0) return false;
  const issued = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(issued)) return false;
  const issuedAt = Number(issued);
  const now = Date.now();
  if (!Number.isSafeInteger(issuedAt)) return false;
  if (issuedAt > now + TOKEN_CLOCK_SKEW) return false;
  if (now - issuedAt > COOKIE_MAX_AGE * 1000) return false;
  const expected = await hmacSign(secret, issued);
  return timingSafeEqual(sig, expected);
}

async function makeToken(secret) {
  const issued = String(Date.now());
  const sig = await hmacSign(secret, issued);
  return `${issued}.${sig}`;
}

function readCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeRedirect(raw, prefix) {
  const value = String(raw == null ? '' : raw);
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^${escapedPrefix}(?:[/?#][\\w\\-./?=&%#]*)?$`);
  return pattern.test(value) ? value : prefix;
}

function sanitizeWorkspaceNext(raw) {
  const value = String(raw == null ? '' : raw);
  return /^(?:\/school-notes|\/workspace\/(?:expenses|project-in-progress|road-to-ca))(?:[/?#][\w\-./?=&%#]*)?$/.test(value)
    ? value
    : '/workspace/';
}

function isSameOriginRequest(request, url) {
  const origin = request.headers.get('origin');
  return !origin || origin === url.origin;
}

function authCookie(route, token, url, maxAge = COOKIE_MAX_AGE) {
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  return `${route.cookieName}=${token}; Path=${route.cookiePath}; Max-Age=${maxAge}; HttpOnly${secure}; SameSite=Lax`;
}

function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  });
}

function loginPage({ route, error = '', redirectTo = route.prefix, action = route.prefix } = {}) {
  const safeRedirect = sanitizeRedirect(redirectTo, route.prefix);
  const safeAction = sanitizeRedirect(action, route.prefix);
  return new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${escapeHtml(route.title)} - Sign in</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { min-height: 100dvh; margin: 0; padding: 24px; display: grid; place-items: center; color: #f3f4f6; font-family: system-ui, sans-serif; background: radial-gradient(1200px 600px at 50% -10%, #1a2233, #0b0d12 60%); }
    form { width: 100%; max-width: 340px; padding: 32px 28px 24px; border: 1px solid rgba(255,255,255,.08); border-radius: 16px; background: rgba(20,24,32,.88); box-shadow: 0 24px 60px rgba(0,0,0,.45); }
    h1 { margin: 0 0 4px; font-size: 22px; } p { margin: 0 0 20px; color: #9aa3b2; font-size: 13px; }
    label { display: block; margin-bottom: 6px; color: #9aa3b2; font-size: 12px; }
    input { width: 100%; padding: 11px 13px; color: #f3f4f6; background: #0f131b; border: 1px solid #2a3140; border-radius: 10px; }
    button { width: 100%; margin-top: 16px; padding: 11px; color: white; font-weight: 600; background: #526ff0; border: 0; border-radius: 10px; cursor: pointer; }
    .error { min-height: 18px; margin-top: 12px; color: #f87171; font-size: 13px; }
    .hint { margin-top: 14px; color: #6b7280; font-size: 11px; text-align: center; }
  </style>
</head>
<body>
  <form method="post" action="${escapeHtml(safeAction)}">
    <h1>${escapeHtml(route.title)}</h1>
    <p>Enter password to continue.</p>
    <label for="pw">Password</label>
    <input id="pw" type="password" name="password" autocomplete="current-password" autofocus required>
    <input type="hidden" name="redirect" value="${escapeHtml(safeRedirect)}">
    <button type="submit">Unlock</button>
    <div class="error">${escapeHtml(error)}</div>
    <div class="hint">This browser stays signed in for up to one year.</div>
  </form>
</body>
</html>`, {
    status: error ? 401 : 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

async function authenticatePost(request, url, route) {
  if (!isSameOriginRequest(request, url)) return jsonResponse({ ok: false, error: 'Forbidden.' }, 403);
  const password = routePassword(route);
  const secret = routeSecret(route);
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');

  if (!password || !secret) {
    return wantsJson
      ? jsonResponse({ ok: false, error: route.missingConfig }, 500)
      : new Response(route.missingConfig, { status: 500, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
  }

  const form = await request.formData();
  const submitted = form.get('password');
  const redirectTo = (form.get('redirect') || route.prefix).toString();
  if (typeof submitted === 'string' && timingSafeEqual(submitted, password)) {
    const token = await makeToken(secret);
    const cookie = authCookie(route, token, url);
    if (wantsJson) return jsonResponse({ ok: true }, 200, { 'set-cookie': cookie });
    return new Response(null, {
      status: 303,
      headers: {
        location: sanitizeRedirect(redirectTo, route.prefix),
        'set-cookie': cookie,
      },
    });
  }

  if (wantsJson) return jsonResponse({ ok: false, error: 'Wrong password.' }, 401);
  return loginPage({ route, error: 'Wrong password.', redirectTo, action: url.pathname });
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const workspaceSecret = routeSecret(WORKSPACE_ROUTE);
  const workspaceToken = readCookie(request.headers.get('cookie'), WORKSPACE_ROUTE.cookieName);
  const workspaceUnlocked = await isValidToken(workspaceToken, workspaceSecret);

  if (pathname === '/workspace/school-notes' || pathname.startsWith('/workspace/school-notes/')) {
    const suffix = pathname.slice('/workspace/school-notes'.length);
    return new Response(null, {
      status: 308,
      headers: { location: `/school-notes${suffix || '/'}${url.search}`, 'cache-control': 'no-store' },
    });
  }

  if (pathname === '/workspace' || pathname === '/workspace/') {
    return next();
  }

  if (pathname === '/workspace/session') {
    return jsonResponse({ ok: workspaceUnlocked, configured: !!(routePassword(WORKSPACE_ROUTE) && workspaceSecret) });
  }

  if (pathname === '/workspace/auth') {
    if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405);
    return authenticatePost(request, url, WORKSPACE_ROUTE);
  }

  if (pathname === '/workspace/logout') {
    const headers = new Headers({ location: '/workspace/' });
    headers.append('set-cookie', authCookie(WORKSPACE_ROUTE, '', url, 0));
    return new Response(null, { status: 303, headers });
  }

  if (pathname.startsWith('/workspace/')) {
    if (workspaceUnlocked) return next();
    const target = sanitizeWorkspaceNext(pathname + url.search);
    return new Response(null, {
      status: 303,
      headers: {
        location: `/workspace/?next=${encodeURIComponent(target)}`,
        'cache-control': 'no-store',
      },
    });
  }

  if (pathname === '/school-notes' || pathname.startsWith('/school-notes/')) {
    if (workspaceUnlocked) return next();
    const target = sanitizeWorkspaceNext(pathname + url.search);
    return new Response(null, {
      status: 303,
      headers: {
        location: `/workspace/?next=${encodeURIComponent(target)}`,
        'cache-control': 'no-store',
      },
    });
  }

  if (pathname === '/expenses' || pathname.startsWith('/expenses/')) {
    if (workspaceUnlocked) return next();

    const expenseSecret = process.env[EXPENSES_ROUTE.secretEnv];
    if (!process.env[EXPENSES_ROUTE.passwordEnv] || !expenseSecret) {
      return new Response(EXPENSES_ROUTE.missingConfig, {
        status: 500,
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
      });
    }

    if (request.method === 'POST') return authenticatePost(request, url, EXPENSES_ROUTE);

    const expenseToken = readCookie(request.headers.get('cookie'), EXPENSES_ROUTE.cookieName);
    if (await isValidToken(expenseToken, expenseSecret)) return next();
    return loginPage({ route: EXPENSES_ROUTE, redirectTo: pathname + url.search, action: pathname });
  }

  return next();
}
