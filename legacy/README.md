# Legacy — Pre-Aurora Site Archive

Snapshot of the portfolio site taken right before the Aurora Royal redesign was promoted to production. Everything here is read-only history; the live site is the new Aurora design at the project root.

## What's here

- **`index.html`** — the old single-page portfolio (navy + cyan + Bebas Neue + JetBrains Mono). Home, Projects, Resume (accordion), and Contact were all on one page with anchor scrolling. Works standalone — open it in a browser to see how the site looked before May 2026.
- **`notes/`** — full copy of the Student Resources hub *before* the Aurora theme was applied. The live `notes/` still has all the same functionality (Spocket, light/dark, Roam/Study modes, sidebar); only the color tokens, nav font, and accent colors changed. Diff this against the live `/notes/` to see exactly what theming moved.
- **`mockups-exploration/`** — the 19 numbered design experiments (`01-showcase.html` through `19-project-pops.html`) plus the picker `index.html` that led to the final Aurora three-page split. Kept as a design-process record. None of these are linked from the live site.

## What's *not* here

- `api/` — the Gemini serverless function. Unchanged across the redesign and still in use; no need to archive.
- Project images (`deskclaw.jpeg`, `columnAB.jpeg`, etc.) — still live at the project root and shared by both the old and new designs.

## How to restore the old design

If you ever want to roll back to the pre-Aurora site:

```sh
# Restore the old single-page portfolio
cp legacy/index.html ./index.html

# Restore the old notes/ theme (overwrites the Aurora-themed notes hub)
cp -r legacy/notes/* ./notes/

# Remove the new Aurora-only pages
rm projects.html contact.html
```

Or just `git revert` the "Migrate Aurora redesign to production" commit.

## Why preserve all this

The old design was the live portfolio for the entirety of the redesign period. Keeping a self-contained, openable copy means future-you (or a recruiter who asks) can see exactly what the previous iteration looked like without dredging through git history.
