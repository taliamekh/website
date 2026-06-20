# Edit Playbook — mekh.ca

Per-task map so common edits are one-shot (no full-site scan). Pairs with `CLAUDE.md`
(conventions) and the memory notes. **Anchors are search strings** (grep them) — not line
numbers, which drift.

## Repo at a glance
- **Live pages (root):** `index.html` (home), `projects.html`, `contact.html`,
  `portal.html` (client portal gate), `notes/` (Student Resources).
- **`notes/SpocketOnboarding.jsx`** — Spocket; loaded by `notes/index.html` via in-browser Babel.
- **`api/`** — serverless: `gemini.js` (Spocket AI), `sift-parse.mjs` (Sift parser). Vercel-only.
- **`portal/`** — `clients/<slug>.html` pages, `make-key.js` (dev helper), `index.html` (redirect stub).
- **Subtrees:** `sift/`, `expenses/`, `fuel-economy/` — each has its own GitHub repo (see CLAUDE.md "Synced projects").
- **Infra:** `vercel.json`, `.vercelignore`, `middleware.js` (/expenses gate), `serve.json` (local preview only).

## Golden rules (don't break)
1. **Nav identical on all 5 pages.** Any menu change → edit `<ul class="nav-links">` the SAME
   way in index / projects / contact / portal / notes/index. Keep: JetBrains Mono ·
   `display:inline` (no `block`) · no border · `scrollbar-gutter:stable`. (This caused the menu-jump bugs.)
2. **`spocket.svg` ⇄ `SPOCKET_SVG`** (in `projects.html`) — same Spocket render in two places; keep in sync.
3. **`notes/index.html` is ~274KB** — data-only additions; no load/highlight-pipeline edits without reason.
   Big notes → standalone `notes/<id>.html` + `localFile` (never `notesHtmlUrl`).
4. **Deploy only via branch → main.** Pushing `main` = live. Never push unreviewed work to `main`.
5. **Subtree projects:** edit + commit, then `git subtree push --prefix=<p> <p>-upstream main`. Don't fork.

## Verifying on this site
- Static preview: `preview_start` → "Static — Node serve" (:8000). Check `/`, `/projects.html`, `/portal.html`, `/notes/`.
- **Screenshots time out on `/notes/`** (625KB Babel + constant animations) → verify by measuring the
  DOM (`getBoundingClientRect`, `elementsFromPoint`), not images.
- API functions don't run on the static server → need `npx vercel dev` (requires `vercel login`).

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
- **Dialogue:** `notes/SpocketOnboarding.jsx` → `const TREE = {`. `start:` = first-visit menu,
  `returning:` = welcome-back, plus `WELCOME_BACKS` / `IDLE_JOKES` arrays. Node shape `{ msg, eyes, options:[{label,next}] }`.
- **Robot / bubble placement:** grep `data-tm-spocket-bubble` (bubble position logic — bottom-anchors
  ABOVE the antenna `data-tm-spocket-antenna` and the lock card), `mobileGate` (mobile = small corner,
  no bubble/options), `robotTopPos` (vertical position).
- **Two copies to sync:** `spocket.svg` ⇄ `SPOCKET_SVG` in `projects.html`.
- **AI mode:** `api/gemini.js` (needs `vercel dev` / live).
- **Where she appears:** the gate in `notes/index.html` (`lock-overlay` / `lock-card`). First-visit vs
  returning is driven by `localStorage["spocket_visited"]`.
- **Gotchas:** 625KB, in-browser Babel (no build step), screenshots time out → measure DOM. No em dashes in her dialogue.
- **Verify:** `/notes/`; toggle `localStorage.spocket_visited` to test first-visit vs returning; measure bubble vs antenna/card gaps.

### 4 · Add notes (Student Resources)
- **File:** `notes/index.html` → `var COURSES = {` (add entry) + a matching course card. Full recipe: memory `notes_add_course_recipe`.
- **Content source:** `notesHtmlUrl` (raw GitHub HTML) for normal notes; **`localFile: '<id>.html'`**
  (a standalone file in `notes/`) for big / image-heavy notes.
- **Colors:** set `paperPalette` for the course.
- **Gotcha:** 274KB file — data-only; don't touch the load/highlight pipeline.
- **Verify:** `/notes/` (unlock), course card opens, highlights work.

### 5 · Update the menu
- See **Golden rule #1** — edit the identical `<ul class="nav-links">` in all 5 pages. Note: notes/index
  uses `../` paths, `aria-current="page"` for the active item, and `#sr-spocket-nav-toggle-host:empty{display:none}`.
- **After any change:** confirm all 5 navs render identically (font + positions).

### 6 · Update the home page
- **File:** `index.html` → `#home` hero (tag, headline, bio, CTA pills). Theme tokens in its `:root`.

### 7 · Site-wide style
- **Theme tokens:** `:root { --bg, --deep, --panel, --accent, --accent-2, --pink, --text, --text-muted … }`
  (Aurora Royal). **Duplicated per page** — change in all 5, plus the notes light theme under `html.sr-light` in `notes/index.html`. No shared CSS file.
- **Fonts:** per-page Google Fonts `<link>` (Outfit, Sora, JetBrains Mono, Roboto Mono).

### 8 · Prevent nav drift (recurring-issue guard)
- Treat the nav as a must-match block. Pre-ship checklist: same items/order · JetBrains Mono ·
  `display:inline` · no border · `scrollbar-gutter:stable` · Contact = `.contact-cta`. Verify positions match across pages.

### 9 · Deploy / go live
- Topic-named branch → verify in preview → `git checkout main && git merge --ff-only <branch> && git push origin main`.
  Vercel auto-deploys from `main`. Audit/rename the branch name first (CLAUDE.md).

### 10 · Run / preview locally
- `preview_start` → "Static — Node serve" (:8000). `serve.json` keeps `/portal.html` working locally
  (cleanUrls would otherwise loop it). Gemini/Sift functions need `npx vercel dev` (after `vercel login`).

### 11 · Sync a subtree project
- CLAUDE.md "Synced projects": `git subtree push/pull --prefix=<p> <p>-upstream main`.
  Remotes `sift-upstream`, `expenses-upstream`, `fuel-economy-upstream` (re-add on a fresh clone).

### 12 · Password gates
- `/expenses` — server-side `middleware.js` (Vercel env `EXPENSES_PASSWORD`, `EXPENSES_AUTH_SECRET`).
- `/notes` — client-side gate in `notes/index.html` (`lock-overlay`).
- `/portal` — client-side SHA-256 `PORTALS` map (see `portal/README.md`).

### 13 · Serverless / API
- `api/gemini.js` (Spocket AI), `api/sift-parse.mjs` (Sift). Run via `vercel dev` or on Vercel only; `maxDuration` in `vercel.json`.
