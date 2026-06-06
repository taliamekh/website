// Sign-in card + nav widget for sift's email-magic-link auth.
//
// Both the home view (when signed out) and the dedicated /signin route
// render the same `SignInCard` element so the visual + behaviour stays
// consistent. `mountNavAuth` keeps the topbar widget in sync via
// onAuthStateChange — it shows "Sign in" when signed out and the user's
// email + a sign-out button when signed in.

import { h } from './h.js';
import { icon } from './icons.js';
import { supabase, currentUser, onAuthChange } from './supabase.js';
import * as toast from './toast.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Render a self-contained sign-in card. Used in two places: the /signin
// route and the home view fallback when the visitor is signed out.
export function SignInCard({ onSignedIn } = {}) {
  const card = h('section.signin-card.stack-5');
  card.appendChild(h('h2', 'Save recipes to your cookbook'));
  card.appendChild(h('p.lead',
    'Sift keeps your cookbooks private to you. Drop your email and we send a one-tap magic link — no password to remember.'));

  const form = h('form.signin-form');
  const inputWrap = h('div.input-icon.flex-1');
  const glyph = h('span.input-icon-glyph', { 'aria-hidden': 'true' });
  glyph.innerHTML = icon('link');
  inputWrap.appendChild(glyph);
  const input = h('input.input', {
    type: 'email',
    name: 'email',
    placeholder: 'you@example.com',
    autocomplete: 'email',
    'aria-label': 'Your email address',
    required: '',
  });
  inputWrap.appendChild(input);
  form.appendChild(inputWrap);

  const btn = h('button.btn.btn-primary.btn-lg', { type: 'submit' });
  btn.innerHTML = `<span>Send magic link</span>${icon('arrowRight')}`;
  form.appendChild(btn);

  const status = h('p.signin-status', { 'aria-live': 'polite' });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = input.value.trim();
    if (!EMAIL_RE.test(email)) {
      status.textContent = 'Please enter a valid email address.';
      status.dataset.state = 'error';
      return;
    }
    btn.disabled = true;
    status.dataset.state = 'pending';
    status.textContent = 'Sending magic link…';
    // Redirect back to the current /sift/ URL (works in dev + prod).
    // detectSessionInUrl on the createClient picks up the auth hash.
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    btn.disabled = false;
    if (error) {
      status.dataset.state = 'error';
      status.textContent = error.message || 'Could not send the magic link.';
      return;
    }
    status.dataset.state = 'success';
    status.textContent = `Check ${email} for a sign-in link. The link signs you in and brings you back here.`;
    input.value = '';
    if (typeof onSignedIn === 'function') {
      // Caller may want to subscribe via onAuthChange itself — we keep the
      // callback for symmetry with components that fire it on completion.
      const stop = onAuthChange(user => { if (user) { stop(); onSignedIn(user); } });
    }
  });

  card.appendChild(form);
  card.appendChild(status);

  card.appendChild(h('p.signin-footnote',
    'Your data is partitioned per-account by Postgres row-level security. Other visitors never see your cookbook.'));

  return card;
}

// Topbar widget — shows "Sign in" when signed out, "{email} · Sign out"
// when signed in. Called once at app boot from app.js.
export function mountNavAuth(slot) {
  if (!slot) return;
  slot.hidden = false;

  function render(user) {
    slot.replaceChildren();
    if (!user) {
      const link = h('a.nav-link.nav-signin', { href: '#/signin' }, 'Sign in');
      slot.appendChild(link);
      return;
    }
    const label = h('span.nav-user', { title: user.email || 'Signed in' }, user.email || 'Signed in');
    const out = h('button.nav-link.nav-signout', { type: 'button' }, 'Sign out');
    out.addEventListener('click', async () => {
      const { error } = await supabase.auth.signOut();
      if (error) toast.error('Sign out failed: ' + error.message);
      else toast.success('Signed out.');
    });
    slot.appendChild(label);
    slot.appendChild(out);
  }

  currentUser().then(render);
  onAuthChange(render);
}
