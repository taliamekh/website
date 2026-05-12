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
- **`api/`** — Vercel serverless function for Gemini. Leave alone unless explicitly working on the AI integration.
- **`spocket.svg`** at the root and the matching `SPOCKET_SVG` constant inside `projects.html` need to stay in sync — they're two copies of the same Spocket character render (one standalone, one inlined so the bento tile can animate her wave on hover).
