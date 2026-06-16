# Client Portal

A static, self-contained gate for client project plans. Lives at **`/portal.html`** (the
gate, with the rotating HD 189733 b planet + access-key box). Individual client plans live
under **`/portal/clients/`**.

## How it works

1. A client types their **access key** into the box on `/portal.html`.
2. The browser normalises it (`trim()` + `toLowerCase()`), hashes it with **SHA-256**, and
   looks the hash up in the `PORTALS` map inside `portal.html`.
3. A match navigates to that client's plan page. Anything else shows a friendly error.

The plaintext keys are **never** stored — only their SHA-256 hashes — so viewing the page
source reveals nothing usable. Security model ≈ a private share link: it's only as strong as
the keys are unguessable, so **use long, random keys** and share them privately. This is a
deterrent for casual access, not a vault — don't put anything here you'd be harmed by leaking.

> Want stronger protection (server-enforced, nothing about valid keys in the browser)?
> The repo already has a server-side pattern in `middleware.js` (the `/expenses` gate). Ask
> Claude to extend it to `/portal/*` and it'll wire passwords through Vercel env vars.

## Add a client

1. **Pick a long, unguessable key**, e.g. `acme-falcon-2026-7q3z`.
2. **Hash it:**
   ```sh
   node portal/make-key.js "acme-falcon-2026-7q3z"
   ```
3. **Create the page** — copy an existing file in `portal/clients/` to a new, unguessable
   slug (so the URL itself isn't easy to guess):
   ```sh
   cp portal/clients/meridian-robotics-7f3a9c.html portal/clients/acme-9f2c41.html
   ```
   Then edit its content (title, header, scope, milestones, deliverables, footer).
4. **Wire it up** — add one line to the `PORTALS` map in `portal.html`:
   ```js
   '<hash-from-step-2>': 'portal/clients/acme-9f2c41.html',
   ```

## Remove a client

Delete their line from `PORTALS` in `portal.html` (revokes access) and, optionally, delete
their file under `portal/clients/`.

## Demo keys (replace before going live)

| Key                     | Page                                         |
|-------------------------|----------------------------------------------|
| `demo-client-2026`      | `portal/clients/meridian-robotics-7f3a9c.html` |
| `northwind-aurora-2026` | `portal/clients/northwind-systems-9d2b41.html` |

`make-key.js` is a dev helper only — it never ships to the browser and isn't referenced by
any page.
