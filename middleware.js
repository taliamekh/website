import { next } from '@vercel/edge';

export const config = {
  matcher: ['/expenses', '/expenses/(.*)'],
};

const COOKIE_NAME = 'expenses_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const encoder = new TextEncoder();

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
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot < 0) return false;
  const issued = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(issued)) return false;
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
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return null;
}

// The redirect target is reflected into HTML and into the Location header, so
// it must be constrained to an internal /expenses path built from a safe URL
// character set — no quotes, angle brackets, whitespace or CR/LF. This blocks
// reflected XSS (breaking out of the value="..." attribute) and header
// injection. Anything else falls back to the bare /expenses path.
function sanitizeRedirect(raw) {
  const s = String(raw == null ? '' : raw);
  return /^\/expenses(?:[/?#][\w\-./?=&%#]*)?$/.test(s) ? s : '/expenses';
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function loginPage({ error = '', redirectTo = '/expenses' } = {}) {
  const safeRedirect = sanitizeRedirect(redirectTo);
  return new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Expenses · Sign in</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif;
      background: radial-gradient(1200px 600px at 50% -10%, #1a2233 0%, #0b0d12 60%);
      color: #f3f4f6;
      display: grid;
      place-items: center;
      min-height: 100dvh;
      margin: 0;
      padding: 24px;
    }
    form {
      background: rgba(20, 24, 32, .85);
      backdrop-filter: blur(8px);
      padding: 32px 28px 24px;
      border-radius: 16px;
      width: 100%;
      max-width: 340px;
      border: 1px solid rgba(255,255,255,.08);
      box-shadow: 0 24px 60px rgba(0,0,0,.45);
    }
    h1 { margin: 0 0 4px; font-size: 22px; letter-spacing: -.01em; }
    p.sub { margin: 0 0 20px; color: #9aa3b2; font-size: 13px; }
    label { display: block; font-size: 12px; color: #9aa3b2; margin-bottom: 6px; }
    input[type=password] {
      width: 100%;
      padding: 11px 13px;
      background: #0f131b;
      border: 1px solid #2a3140;
      border-radius: 10px;
      color: #f3f4f6;
      font-size: 14px;
      outline: none;
      transition: border-color .15s;
    }
    input[type=password]:focus { border-color: #6b8cff; }
    button {
      margin-top: 16px;
      width: 100%;
      padding: 11px;
      background: linear-gradient(180deg, #5b7cff, #4a68e6);
      color: white;
      border: 0;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover { filter: brightness(1.08); }
    .error {
      color: #f87171;
      font-size: 13px;
      margin-top: 12px;
      min-height: 18px;
    }
    .hint { color: #6b7280; font-size: 11px; margin-top: 14px; text-align: center; }
  </style>
</head>
<body>
  <form method="post" action="/expenses">
    <h1>Expenses</h1>
    <p class="sub">Enter password to continue.</p>
    <label for="pw">Password</label>
    <input id="pw" type="password" name="password" autocomplete="current-password" autofocus required>
    <input type="hidden" name="redirect" value="${escapeHtml(safeRedirect)}">
    <button type="submit">Unlock</button>
    <div class="error">${escapeHtml(error)}</div>
    <div class="hint">You'll only have to do this once on this device.</div>
  </form>
</body>
</html>`, {
    status: error ? 401 : 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const password = process.env.EXPENSES_PASSWORD;
  const secret = process.env.EXPENSES_AUTH_SECRET;

  if (!password || !secret) {
    return new Response(
      'Expenses gate is not configured. Set EXPENSES_PASSWORD and EXPENSES_AUTH_SECRET in Vercel project env vars.',
      { status: 500, headers: { 'content-type': 'text/plain; charset=utf-8' } },
    );
  }

  if (request.method === 'POST') {
    const form = await request.formData();
    const submitted = form.get('password');
    const redirectTo = (form.get('redirect') || '/expenses').toString();
    if (typeof submitted === 'string' && timingSafeEqual(submitted, password)) {
      const token = await makeToken(secret);
      const safeRedirect = sanitizeRedirect(redirectTo);
      const headers = new Headers();
      headers.set('location', safeRedirect);
      headers.append(
        'set-cookie',
        `${COOKIE_NAME}=${token}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
      );
      return new Response(null, { status: 303, headers });
    }
    return loginPage({ error: 'Wrong password.', redirectTo });
  }

  const token = readCookie(request.headers.get('cookie'), COOKIE_NAME);
  if (await isValidToken(token, secret)) {
    return next();
  }

  return loginPage({ redirectTo: url.pathname + url.search });
}
