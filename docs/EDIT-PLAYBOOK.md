# Edit Playbook — mekh.ca

> **Claude — read this file FIRST for any add / edit / fix / review / deploy task on this
> site, then grep the anchors below. Do NOT scan the whole codebase for a task that's
> mapped here.** Almost everything routes to specific files + search strings. If a task
> genuinely isn't covered, do it, then add a route so the next one is one-shot.

Per-task map so common edits are one-shot (no full-site scan). Pairs with `CLAUDE.md`
(conventions) and the memory notes. **Anchors are search strings** (grep them) — not line
numbers, which drift.

## Repo at a glance
- **Live pages (root):** `index.html` (home), `projects.html`, `contact.html`,
  `portal.html` (client portal gate), `workspace/` (private Workspace hub).
- **`school-notes/SpocketOnboarding.jsx`** — Spocket; loaded by the School Notes page via in-browser Babel.
- **`school-notes/workspace-iframe.js`** — notes toolbar + highlight engine (runs inside the notes iframe).
- **`api/`** — serverless: `gemini.js` (Spocket AI), `sift-parse.mjs` (Sift parser). Vercel-only.
- **`lib/sift-parser/`** — the recipe-parser library `api/sift-parse.mjs` calls (fetch + JSON-LD /
  microdata / heuristic extract). Server helper, not a function itself.
- **`portal/`** — `clients/<slug>.html` pages, `make-key.js` (dev helper), `index.html` (redirect stub).
- **`middleware.js`** — Vercel Edge; server-side `/expenses` password gate.
- **Subtrees:** `sift/`, `expenses/`, `fuel-economy/` — each has its own GitHub repo (see CLAUDE.md "Synced projects").
- **`sandbox/`** — dev tooling for the Fuel Economy tile car (git-only, **not deployed**).
- **`legacy/`** — pre-Aurora snapshot + exploration mockups. Read-only history, **not deployed**, never link to it.
- **Infra:** `vercel.json`, `.vercelignore`, `serve.json` (local preview only).

## Golden rules (don't break)
1. **Nav identical on the five main-site pages.** Any menu change → edit `<ul class="nav-links">` the SAME
   way in index / projects / contact / portal / workspace. School Notes is deliberately standalone and has no main-site nav. Keep: JetBrains Mono ·
   `display:inline` (no `block`) · no border · `scrollbar-gutter:stable`. (This caused the menu-jump bugs.)
2. **`spocket.svg` ⇄ `SPOCKET_SVG`** (in `projects.html`) — same Spocket render in two places; keep in sync.
3. **`school-notes/index.html` is ~274KB** — data-only additions; no load/highlight-pipeline edits without reason.
   Big notes → standalone `school-notes/<id>.html` + `localFile` (never `notesHtmlUrl`).
4. **Deploy only via branch → main.** Pushing `main` = live. Never push unreviewed work to `main`.
5. **Subtree projects:** edit + commit, then `git subtree push --prefix=<p> <p>-upstream main`. Don't fork.

## Verifying on this site
- Static preview: check `/`, `/projects.html`, `/portal.html`, `/workspace/`, and `/school-notes/`.
- **Screenshots can time out on School Notes** (625KB Babel + constant animations) → verify by measuring the
  DOM (`getBoundingClientRect`, `elementsFromPoint`), not images.
- API functions + middleware don't run on the static server → need `npx vercel dev` (requires `vercel login`).
  For pure logic (guards, parsers) `node --check` + a tiny node test is the fast local proxy.

---

## Routes

### 1 · Add a project (Projects page)
- **File:** `projects.html` → `window.PROJECTS = [` array. Add `{ id, num, title, summary, awards:[…], … }`
  (copy an existing entry). Tiles render into `<div class="bento" id="bento">` as `<article class="tile">`;
  click → `openModal(id)`. Cover image / size / `noImage` handling: mirror a similar entry.
- **Hosted project (like Sift):** (a) bring the repo in as a **subtree** — CLAUDE.md "Synced projects" +
  "Adding a new synced project" — so it serves at `/<project>/`; (b) wire build/serve in `vercel.json`,
  hide non-frontend paths in `.vercelignore`; (c) point the project's modal CTA at `/<project>/`.
- **Reflect the project's git automatically:** push to the standalone repo, then in the website
  `git subtree pull --prefix=<project> <project>-upstream main --squash`. (Re-add the `*-upstream` remote on a fresh clone.)
- **Verify:** `/projects.html` shows the tile + modal; for hosted, `/<project>/` loads.

### 2 · Add a client (Portal)
- **Authoritative steps:** `portal/README.md` → "Add a client".
- **Short version:** `node portal/make-key.js "<long-random-key>"` → copy `portal/clients/<existing>.html`
  to a new unguessable slug → edit content → add `'<hash>': 'portal/clients/<slug>.html'` to the
  `PORTALS` map in `portal.html`.
- **Model:** keys are SHA-256 hashed client-side (≈ private share link, not a vault). Replace demo keys before relying on it.
- **Verify:** `/portal.html`, enter key → lands on the client page.

### 3 · Work on Spocket
- **Dialogue:** `school-notes/SpocketOnboarding.jsx` → `const TREE = {`. `start:` = first-visit menu,
  `returning:` = welcome-back, plus `WELCOME_BACKS` / `IDLE_JOKES` arrays. Node shape `{ msg, eyes, options:[{label,next}] }`.
- **Robot / bubble placement:** grep `data-tm-spocket-bubble` (bubble position logic — bottom-anchors
  ABOVE the antenna `data-tm-spocket-antenna` and the lock card), `mobileGate` (mobile = small corner,
  no bubble/options), `robotTopPos` (vertical position).
- **Two copies to sync:** `spocket.svg` ⇄ `SPOCKET_SVG` in `projects.html`.
- **AI mode:** `api/gemini.js` (needs `vercel dev` / live). See route 16 for its same-origin gate.
- **Where she appears:** the full assistant runs on both the Workspace landing and School Notes from the single shared
  `school-notes/SpocketOnboarding.jsx` source. Both pages mount it through `workspace/spocket-mount.js`;
  do not replace the Workspace mount with a decorative SVG fallback. First-visit vs returning is driven by
  `localStorage["spocket_visited"]`.
- **Gotchas:** 625KB, in-browser Babel (no build step), screenshots time out → measure DOM. No em dashes in her dialogue.
- **Verify:** run `node scripts/check-workspace-spocket.mjs`, then test `/workspace/`, `/school-notes/`, and `/school-notes/?spocket=study`. On mobile, parked Spocket stays visible and tap-enabled but does not idle-bob or open on hover.
  Confirm the corner robot idles, hover shows a random joke plus clickable options, a dialogue option opens the coded
  speech bubble, and no My Desk option exists. Toggle `localStorage.spocket_visited` to test first-visit vs returning.

### 4 · Add notes (School Notes)
- **File:** `school-notes/index.html` → `var COURSES = {` (add entry) + a matching course card. Full recipe: memory `notes_add_course_recipe`.
- **Content source:** `notesHtmlUrl` (raw GitHub HTML) for normal notes; **`localFile: '<id>.html'`**
  (a standalone file in `school-notes/`) for big / image-heavy notes.
- **Colors:** set `paperPalette` for the course.
- **Gotcha:** 274KB file — data-only; don't touch the load/highlight pipeline (that's route 15).
- **Verify:** unlock `/workspace/`, open `/school-notes/`, select a course, and confirm highlights work.

### 5 · Update the menu
- See **Golden rule #1** — edit the identical `<ul class="nav-links">` on the five main-site pages. Do not add that menu to
  `school-notes/index.html`; School Notes is a standalone app surface reached from Workspace.
- **After any change:** confirm all five main-site navs render identically (font + positions), and School Notes still has no site nav.

### 6 · Update the home page
- **File:** `index.html` → `#home` hero (tag, headline, bio, CTA pills). Theme tokens in its `:root`.

### 7 · Site-wide style
- **Theme tokens:** `:root { --bg, --deep, --panel, --accent, --accent-2, --pink, --text, --text-muted … }`
  (Aurora Royal). **Duplicated per page** — change in all 6, plus the notes light theme under `html.sr-light` in School Notes. No shared CSS file.
- **Fonts:** per-page Google Fonts `<link>` (Outfit, Sora, JetBrains Mono, Roboto Mono).

### 8 · Prevent nav drift (recurring-issue guard)
- Treat the nav as a must-match block. Pre-ship checklist: same items/order · JetBrains Mono ·
  `display:inline` · no border · `scrollbar-gutter:stable` · Contact = `.contact-cta`. Verify positions match across pages.

### 9 · Deploy / go live
- Topic-named branch → verify in preview → `git checkout main && git merge --ff-only <branch> && git push origin main`.
  Vercel auto-deploys from `main`. Audit/rename the branch name first (CLAUDE.md). **Get explicit OK before pushing `main`.**

### 10 · Run / preview locally
- `preview_start` → "Static — Node serve" (:8000). `serve.json` keeps `/portal.html` working locally
  (cleanUrls would otherwise loop it). Gemini/Sift functions need `npx vercel dev` (after `vercel login`).

### 11 · Sync a subtree project
- CLAUDE.md "Synced projects": `git subtree push/pull --prefix=<p> <p>-upstream main`.
  Remotes `sift-upstream`, `expenses-upstream`, `fuel-economy-upstream` (re-add on a fresh clone).

### 12 · Password gates
- `/expenses` — server-side `middleware.js` (Vercel env `EXPENSES_PASSWORD`, `EXPENSES_AUTH_SECRET`). Hardening detail: route 16.
- `/workspace` — server-verified password with a one-year HMAC device cookie. The landing stays visible so Spocket can explain the Workspace; all quick-link subroutes require the cookie.
- `/portal` — client-side SHA-256 `PORTALS` map (see `portal/README.md`).

### 13 · Serverless / API
- `api/gemini.js` (Spocket AI — self-contained). `api/sift-parse.mjs` (Sift) wraps the `lib/sift-parser/` library.
  Run via `vercel dev` or on Vercel only; `maxDuration` in `vercel.json`. Security posture: route 16.

### 14 · Fuel Economy tile / the GT3 RS car
- **Tile + animation:** `projects.html` — grep `data-id="fuel-economy"`. The car is the user's own GT3 RS,
  region-colored 1:1 from her drawing (`sandbox/reference.png`). Anchors: `.fuel-tile-car` (wrapper),
  `.fuel-car .spin` (wheels — **must keep spinning on hover**), `.fuel-road` / `.streak` (road + speed
  streaks, hover-only), keyframes `fuel-bob` / `fuel-spin` / `fuel-road` / `fuel-zoom`.
  `transform-box: view-box` on `.spin` is load-bearing (don't remove — it's the wheel-spin anti-regression).
- **PROJECTS entry:** `{ id:'fuel-economy', num:'08', … }` in `window.PROJECTS`.
- **Rebuild / re-trace the car:** `sandbox/` editors — `porsche-tile.html` (tile preview),
  `porsche-wheel-edit.html` (wheel cut-outs), traced SVGs `sandbox/_approved_final2.svg` / `_final2.svg`.
  Full pipeline + hub/spin rules: memory `porsche-tile-car`.
- **Hosted calculator:** the app itself is the `fuel-economy/` subtree, served at `/fuel-economy/`.
- **Verify:** `/projects.html`, hover the tile → car bobs, wheels spin, road streaks appear.

### 15 · Notes highlight + toolbar engine
- **Files:** `school-notes/workspace-iframe.js` (toolbar + highlighter / eraser / undo-redo, runs inside the
  notes iframe) **and** `injectUnifiedHighlightCore` in `school-notes/index.html` (grep it; exposes `window.__TM_SR_HL`).
- **Model:** marks persist by absolute text offset + inline `--tm-hl` colour; custom colours + undo/redo
  live in BOTH files (keep them in sync). Full detail: memory `notes_highlight_engine`.
- **Caution:** this IS the load/highlight pipeline Golden rule #3 protects — only edit here when the task
  is explicitly the highlighter/toolbar, not for adding note content (that's route 4).
- **Verify:** `/school-notes/` → highlight text, change colour, undo/redo, reload → marks persist.

### 16 · Security review / harden the site
- **Server-side attack surface (where the real risk is):**
  - `middleware.js` — `/expenses` gate. HMAC token (`hmacSign` / `makeToken` / `isValidToken`),
    constant-time compare (`timingSafeEqual`), redirect + XSS hardening (`sanitizeRedirect` + `escapeHtml`).
    Env: `EXPENSES_PASSWORD`, `EXPENSES_AUTH_SECRET`.
  - `api/gemini.js` — Spocket AI proxy. Same-origin gate (`isSameOriginRequest`) + request-size cap.
    Env: `GEMINI_API_KEY` (stays server-side, never sent to the client).
  - `lib/sift-parser/index.mjs` — recipe fetch. SSRF guard (`assertSafeFetchUrl`) rejects loopback /
    private / link-local / internal hosts before `fetch`; parser strategies in the sibling `.mjs` files.
  - `.vercelignore` — what must NEVER ship: `expenses/statements-backup` (financial PDFs), `legacy/`,
    internal docs (`CLAUDE.md`, `.env.example`, …).
- **Client-side gates are cosmetic** (the content ships inside the page): notes `lock-overlay`
  (`noteslol`), portal `PORTALS` SHA-256 map. Don't treat them as real trust boundaries.
- **Front-end XSS check:** rendering is escaped today — Spocket via React + `escapeHtml`, Sift via
  `createTextNode` / `escapeText`, `projects.html` `innerHTML` uses only static `PROJECTS` data.
  If you add a render path that injects remote/user text, escape it.
- **Can't runtime-test here:** middleware/functions need `vercel dev` or a live deploy; use `node --check`
  on changed files + a tiny node test that proves guards block attacks AND pass legit inputs.
- **Verify:** guards reject internal/hostile inputs and accept normal ones; no functionality regression.

### 17 · Edit the contact page
- **File:** `contact.html` — static content (links / handles), no form or backend. Nav per Golden rule #1;
  theme tokens duplicated per-page (route 7).

### 18 - Private Workspace hub
- **Files:** `workspace/index.html` (landing + quick links), `school-notes/`, `workspace/road-to-ca/`,
  `workspace/project-in-progress/`, `workspace/expenses/`, `middleware.js`, and `vercel.json`.
- **Access model:** `WORKSPACE_PASSWORD` and `WORKSPACE_AUTH_SECRET` create a one-year HttpOnly, SameSite=Lax device cookie.
  Every Workspace subroute verifies it; the same cookie can authorize `/expenses/*` to avoid a second prompt.
  If the dedicated Workspace variables are absent, production securely falls back to the existing `EXPENSES_PASSWORD` and
  `EXPENSES_AUTH_SECRET`; dedicated Workspace values always take priority when configured.
- **Verify:** test wrong/correct passwords, refresh persistence, each bubble in a new tab, direct unauthorized subroute redirects,
  standalone School Notes with no public-site menu, School Notes + Spocket functionality, and Expenses without a second login.
  Never store the Workspace password client-side.

### 19 - Build or review a redesign mockup
- **Files:** keep exploratory redesigns under `sandbox/<study-name>/`; do not edit the five production pages during mockup approval.
- **Menu scope:** Home, Projects, Workspace, Client Portal, Contact. Keep School Notes standalone unless the user explicitly expands scope.
- **Assets:** copy approved generated artwork into the sandbox `assets/` directory so localhost does not depend on Codex-generated-image paths.
- **Standalone mockup flow:** keep copied project detail data inside the sandbox; do not fetch `projects.html` at runtime. Open standalone tools
  directly in new tabs and do not add a redesign wrapper/header around them. Use query-scoped theme overrides or localhost-only build paths when
  a standalone page needs to match the mockup without changing its production default.
- **Verify:** run the static preview and test every design option across all five menu states, desktop and mobile navigation, image loading,
  project/Workspace interactions, Portal form controls, and Contact actions. Visually inspect screenshots for overlap before handoff.

### 20 - Edit the doll-whimsy production portfolio
- **Files:** `index.html` is the production shell; shared portfolio CSS/JS/art live in `site/`. Direct-page compatibility files
  (`projects.html`, `contact.html`, `portal.html`, `workspace/index.html`) only redirect into the SPA hash routes.
- **Workspace:** the public shell calls `/workspace/session` and `/workspace/auth`; never put the Workspace password in client code.
- **Client Portal:** the SHA-256 destination map is in `site/app.js`; plaintext client keys stay outside the repository.
- **Cache busting:** whenever `site/styles.css` or `site/app.js` changes, update its `?v=` value in `index.html`; otherwise an
  already-open browser can continue displaying the previous production CSS/JS after deployment.
- **Archive guard:** the immediately previous production site is the read-only GitHub branch and tag
  `archive/pre-doll-whimsy-production-2026-08-24` at commit `ffdcc288129b28b5f37007e7243948484d228231`.
  Never edit, force-push, or delete either reference.
- **Verify:** test all five hash routes, direct-page redirects, responsive nav, project modals/images/animation, Workspace lock and
  quick links, Client Portal key handling, Contact copy action, and the standalone Sift/Expenses/School Notes pages.
