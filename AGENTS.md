# Codex instructions for this repo

Before any add, edit, fix, review, deploy, or preview task on this website, read:

- `docs/EDIT-PLAYBOOK.md` for the task route, exact files, grep anchors, gotchas, and verification steps.
- `CLAUDE.md` for repo conventions, deployment rules, branch naming, and synced project/subtree workflow.

Do not scan the whole codebase for a task that is already mapped in `docs/EDIT-PLAYBOOK.md`. Open the playbook first, follow the matching route, then inspect only the files and anchors it names.

For adding projects, use `docs/EDIT-PLAYBOOK.md` route `1 - Add a project (Projects page)` before editing. Normal project tiles live in `projects.html` inside `window.PROJECTS = [ ... ]`. Hosted projects need the subtree workflow from `CLAUDE.md`, plus any required `vercel.json` and `.vercelignore` updates.

If a requested website task is not covered by the playbook, complete the task, then add a concise route to `docs/EDIT-PLAYBOOK.md` so the next session can handle it directly.
