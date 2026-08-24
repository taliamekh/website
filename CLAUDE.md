# Claude working notes for this repo

This file holds conventions that should persist across Claude Code sessions.

**Per-task file map — read this FIRST, every time:** [`docs/EDIT-PLAYBOOK.md`](docs/EDIT-PLAYBOOK.md) maps every common task to exact files + grep anchors + gotchas: add a project/client/note, work on Spocket, the Fuel Economy GT3-RS car, the notes highlight/toolbar engine, menu/home/site style, password gates, serverless/API, security review & hardening, deploy, preview, subtree sync. For ANY add/edit/fix/review/deploy task on this site, open it and grep the anchors **before** searching the codebase — don't scan files for something already mapped there. If a task isn't covered, handle it, then add a route.

## Branch naming — verify before pushing

Before pushing a branch to remote (or merging it into `main`), audit the branch name and confirm it accurately describes the work that landed on it. The name should be a short slug capturing the topic — e.g. `portfolio-aurora-redesign`, `spocket-ai-integration`, `notes-light-theme`.

If the branch ended up doing something different (or substantially broader) than its name suggests, **rename it first**:

```sh
git branch -m old-slug new-slug
git push origin -u new-slug
git push origin --delete old-slug   # only if old-slug was already pushed
```

This keeps the remote, the eventual PR title, and `git log --oneline --all` self-documenting later — future-you reading `git branch -a` should be able to guess what each branch contains.

## Deployment

The live site at the project root (`index.html`, `projects.html`, `contact.html`, `workspace/`) is deployed to Vercel from `main`. Pushing to `origin/main` triggers a redeploy automatically — there's no separate "release" step.

Do not push directly to `main` for unreviewed work. Use a feature branch (named per the rule above), merge it into `main` once verified, then push `main`.

## What lives where

- **Production portfolio shell:** `index.html` loads the doll-whimsy single-page portfolio from shared assets in `site/`. The old direct paths (`projects.html`, `contact.html`, `portal.html`, and `workspace/index.html`) are compatibility redirects into the matching hash route. `school-notes/` remains a standalone protected app.
- **Pre-doll-whimsy production archive:** immutable GitHub branch and tag `archive/pre-doll-whimsy-production-2026-08-24`, both pinned to `ffdcc288129b28b5f37007e7243948484d228231`. Never edit, force-push, or delete these references; restore from them into a new branch only.
- **`legacy/`** — pre-Aurora site snapshot + the numbered exploration mockups (`legacy/mockups-exploration/01-…` through `19-…`). Read-only history; never link to from the live site.
- **`api/`** — Vercel serverless functions. `gemini.js` is the Spocket AI proxy; `sift-parse.mjs` is the recipe URL parser for Sift. Leave alone unless explicitly working on those integrations.
- **`lib/`** — server-side helpers for the Vercel functions (currently the cheerio-based sift parser modules). Not served as functions itself.
- **`sift/`** — git subtree of [`taliamekh/sift`](https://github.com/taliamekh/sift). See the **Synced projects** section below before editing files here.
- **`expenses/`** — git subtree of [`taliamekh/expenses`](https://github.com/taliamekh/expenses) (PRIVATE). Contains `spending-tracker/` (Vite + React SPA that ships to `mekh.ca/expenses`) and `statements-backup/` (personal financial PDFs/PNGs, excluded from deploy via `.vercelignore`). Password-gated by `middleware.js`. See the **Synced projects** and **Expenses gate** sections below.
- **`fuel-economy/`** — git subtree of [`taliamekh/Fuel-Economy-Calculator`](https://github.com/taliamekh/Fuel-Economy-Calculator). Static front-end for the road-trip fuel cost planner. See the **Synced projects** section below before editing files here.
- **`middleware.js`** — Vercel Edge middleware. Password-gates `/workspace/*` and `/expenses/*`; a valid Workspace device cookie also authorizes Expenses. Dedicated Workspace env vars take priority, with the existing Expenses password/secret as a secure production fallback when they are absent.
- **`spocket.svg`** at the root and the matching `SPOCKET_SVG` constant inside `projects.html` need to stay in sync — they're two copies of the same Spocket character render (one standalone, one inlined so the bento tile can animate her wave on hover).

## Synced projects (git subtree pattern)

Projects that have a standalone GitHub repo are pulled into the website as a **git subtree**, with the GitHub repo as the single source of truth. Editing files inside the subtree path on either side and then `git subtree push`-ing keeps them in sync.

**Current subtrees:**

| Path | Remote | Repo | Branch |
|---|---|---|---|
| `sift/` | `sift-upstream` | [`taliamekh/sift`](https://github.com/taliamekh/sift) | `main` |
| `expenses/` | `expenses-upstream` | [`taliamekh/expenses`](https://github.com/taliamekh/expenses) (private) | `main` |
| `fuel-economy/` | `fuel-economy-upstream` | [`taliamekh/Fuel-Economy-Calculator`](https://github.com/taliamekh/Fuel-Economy-Calculator) | `main` |

**Workflow when editing files inside a synced project directory:**

1. Edit and commit in the website like normal (e.g. modify `sift/lib/api.js`, commit on the working branch).
2. Push the change upstream to the standalone repo:
   ```sh
   git subtree push --prefix=<project> <project>-upstream main
   ```
   For sift: `git subtree push --prefix=sift sift-upstream main`.
3. The next contributor (or you on a fresh clone) can pull upstream changes back into the website with:
   ```sh
   git subtree pull --prefix=<project> <project>-upstream main --squash
   ```

**Setup on a fresh website clone** — subtree remotes aren't stored in `.git/config` after a clone, so re-add them:

```sh
git remote add sift-upstream https://github.com/taliamekh/sift.git
git remote add expenses-upstream https://github.com/taliamekh/expenses.git
git remote add fuel-economy-upstream https://github.com/taliamekh/Fuel-Economy-Calculator.git
```

**Adding a new synced project from a GitHub repo:**

1. Restructure the standalone repo so its frontend lives at the repo root (Vercel needs to serve the SPA from `<project>/index.html`). For an Express-backed standalone, also update the static-root path in the server file.
2. Push the website-context version of the frontend (e.g. with auth, with the project's hosted backend wiring) into the standalone main branch.
3. In the website: `git remote add <project>-upstream <url>` then `git subtree add --prefix=<project> <project>-upstream main --squash`.
4. Add the path + remote to the **Current subtrees** table above so the convention stays discoverable.
5. If the standalone repo ships non-frontend code (Express server, browser extension, build scripts, its own `package.json`), add those paths to `.vercelignore` so Vercel doesn't expose them at `mekh.ca/<project>/server/...` etc.

**Hosted-only convention.** When we sync a project, the standalone repo is rewritten to be hosted-mode-first — i.e. cloning + `npm start` requires whatever backend the hosted site uses (Supabase project, env vars, etc.). The standalone repo isn't expected to remain trivially runnable as a local-only app after a sync. If you need a local-only mode, add it as an explicit fallback inside the project's own config layer — don't fork the standalone.

## Expenses gate

`mekh.ca/expenses` is the Vite + React `spending-tracker` SPA from `taliamekh/expenses` (private repo, pulled in as a subtree at `expenses/`). It is built by Vercel on every deploy via the `buildCommand` in `vercel.json`, which runs `npm install && VITE_BASE=/expenses/ npm run build` inside `expenses/spending-tracker`. URL rewrites in `vercel.json` then map `/expenses/*` to the built `dist/` output, so source files under `expenses/spending-tracker/src` aren't reachable by HTTP.

The route is gated by `middleware.js` at the repo root (Vercel Edge runtime). On first visit, the user gets a dark-mode login form; submitting the correct password sets an HMAC-signed `expenses_auth` cookie that's HttpOnly, Secure, SameSite=Lax, and `Max-Age` of 1 year — so subsequent visits on the same device skip the form.

**Required Vercel env vars** (set via the Vercel dashboard under Project → Settings → Environment Variables, or with `vercel env add`):

- `EXPENSES_PASSWORD` — the plaintext password users will enter.
- `EXPENSES_AUTH_SECRET` — a long random string (32+ chars) used to sign the auth cookie. Rotating this value forces every existing session to re-authenticate.

If either env var is missing at runtime, `/expenses` returns a 500 with a clear "not configured" message instead of crashing silently.

`expenses/statements-backup/` contains personal bank/credit card statements and is excluded from the Vercel upload entirely via `.vercelignore`. The standalone repo is private, so the files do still live in git history — keep the repo private.
