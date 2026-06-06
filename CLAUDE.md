# Claude working notes for this repo

This file holds conventions that should persist across Claude Code sessions.

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

The live site at the project root (`index.html`, `projects.html`, `contact.html`, `notes/`) is deployed to Vercel from `main`. Pushing to `origin/main` triggers a redeploy automatically — there's no separate "release" step.

Do not push directly to `main` for unreviewed work. Use a feature branch (named per the rule above), merge it into `main` once verified, then push `main`.

## What lives where

- **Production pages** at the project root: `index.html` (home), `projects.html`, `contact.html`, plus `notes/` (the Spocket-bearing Student Resources hub).
- **`legacy/`** — pre-Aurora site snapshot + the numbered exploration mockups (`legacy/mockups-exploration/01-…` through `19-…`). Read-only history; never link to from the live site.
- **`api/`** — Vercel serverless functions. `gemini.js` is the Spocket AI proxy; `sift-parse.mjs` is the recipe URL parser for Sift. Leave alone unless explicitly working on those integrations.
- **`lib/`** — server-side helpers for the Vercel functions (currently the cheerio-based sift parser modules). Not served as functions itself.
- **`sift/`** — git subtree of [`taliamekh/sift`](https://github.com/taliamekh/sift). See the **Synced projects** section below before editing files here.
- **`spocket.svg`** at the root and the matching `SPOCKET_SVG` constant inside `projects.html` need to stay in sync — they're two copies of the same Spocket character render (one standalone, one inlined so the bento tile can animate her wave on hover).

## Synced projects (git subtree pattern)

Projects that have a standalone GitHub repo are pulled into the website as a **git subtree**, with the GitHub repo as the single source of truth. Editing files inside the subtree path on either side and then `git subtree push`-ing keeps them in sync.

**Current subtrees:**

| Path | Remote | Repo | Branch |
|---|---|---|---|
| `sift/` | `sift-upstream` | [`taliamekh/sift`](https://github.com/taliamekh/sift) | `main` |

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
```

**Adding a new synced project from a GitHub repo:**

1. Restructure the standalone repo so its frontend lives at the repo root (Vercel needs to serve the SPA from `<project>/index.html`). For an Express-backed standalone, also update the static-root path in the server file.
2. Push the website-context version of the frontend (e.g. with auth, with the project's hosted backend wiring) into the standalone main branch.
3. In the website: `git remote add <project>-upstream <url>` then `git subtree add --prefix=<project> <project>-upstream main --squash`.
4. Add the path + remote to the **Current subtrees** table above so the convention stays discoverable.
5. If the standalone repo ships non-frontend code (Express server, browser extension, build scripts, its own `package.json`), add those paths to `.vercelignore` so Vercel doesn't expose them at `mekh.ca/<project>/server/...` etc.

**Hosted-only convention.** When we sync a project, the standalone repo is rewritten to be hosted-mode-first — i.e. cloning + `npm start` requires whatever backend the hosted site uses (Supabase project, env vars, etc.). The standalone repo isn't expected to remain trivially runnable as a local-only app after a sync. If you need a local-only mode, add it as an explicit fallback inside the project's own config layer — don't fork the standalone.
