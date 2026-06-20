# Fuel Economy Calculator — Improvement Plan

**Audit date:** 2026-05-04
**Scope:** `index.html` (534 LOC), `app.js` (4,399 LOC), `styles.css` (2,250 LOC), `data/prices.json`, `scripts/update-prices.mjs`, GitHub Actions workflows.
**Purpose:** Hand this file to a fresh coding agent with the prompt:
> "Open IMPROVEMENTS.md in this repo. Work top-down through the **Roadmap** section. After each item, verify in the browser preview, commit, and move on. Skip nothing. Ask before doing items marked [decision needed]."

All findings have been verified against the actual code. File and line citations are accurate as of the audit date.

---

## 1. Critical bugs (fix first — guaranteed crashes / wrong math)

### C1. `state.stops.map` crash on every unit-system change — `app.js:4370`
`state` has no `stops` property (initialized at `app.js:182-260`); only `map.stops` does. The line `state.stops = state.stops.map(s => { ... })` throws `TypeError: Cannot read properties of undefined (reading 'map')` the first time a user clicks a unit tab. The error fires *mid-conversion* — `distance` and `unitSystem` already updated, but `customEff`, `cmpCustomEff`, `tankSize`, and `price` are left in the old units. Result: nonsense numbers in the result panel and a console error.

**Fix:** delete lines `app.js:4370-4374` entirely. The original intent was likely per-stop distances, but stops are stored as `{lat, lon, label}` objects on `map.stops` and don't need unit conversion.

**Verify:** click each unit tab in sequence; numbers should re-display in the new unit; no console errors.

---

### C2. Comparison vehicle ignores weather multiplier — `app.js:989`
Primary vehicle calc passes `wMult` (weather penalty) at `app.js:971`:
```js
const adjL = applyAdjustments(baseL, state.drivingStyle, state.conditions, wMult);
```
But the comparison vehicle calc at `app.js:989` omits it:
```js
const cmpAdjL = applyAdjustments(cmpBaseL, state.drivingStyle, state.conditions);
```
Whenever weather is bad (cold + rain + headwind), the primary cost is inflated and the comparison cost isn't, so the savings line is biased toward whichever vehicle happens to be in slot B.

**Fix:** add `wMult` as 4th argument:
```js
const cmpAdjL = applyAdjustments(cmpBaseL, state.drivingStyle, state.conditions, wMult);
```

**Verify:** enable comparison, plot a route, toggle "Ignore live weather impact" — both numbers should change by the same ratio.

---

### C3. Departure-time forecast uses wrong timezone — `app.js:907`
The Open-Meteo URL omits `&timezone=auto`, so `hourly.time` returns in UTC. The user's `state.departAt` comes from `<input type="datetime-local">` and is parsed as **local time** at `app.js:888` via `new Date(state.departAt).getTime()`. The `bestIdx` matching loop (`app.js:914-919`) then picks an hour offset by the user's timezone — a 5pm PST departure forecast actually shows 9am UTC weather at the destination.

**Fix:** append `&timezone=auto` to the URL at `app.js:907`. Open-Meteo will return `hourly.time` strings in the route location's local time. Also append it to the current-weather URL at `app.js:932` for consistency.

**Verify:** plan a trip to a city in another timezone, set departure to 9pm local, confirm the displayed forecast hour matches.

---

## 2. High-impact UX & correctness

### H1. US users can't pick their state — `app.js:1053`
The line `$('provinceWrap').hidden = state.country !== 'CA'` means the region combo only appears for Canada. The `US_STATE_REGION_KEY` mapping at `app.js:617-637` and per-state EIA data in `prices.json` are wired up — but for US users, `state.region` only ever gets set by IP detection. A NY user driving to Texas can't switch to Texas pricing.

**Fix:**
1. In `index.html:48-52`, change the field label dynamically based on country.
2. In `app.js:2367-2376`, populate the combo with US states when `state.country === 'US'` (use the keys of `US_STATE_REGION_KEY`).
3. In `app.js:1053`, change to `$('provinceWrap').hidden = state.country !== 'CA' && state.country !== 'US';`.

**Verify:** select US, see a state dropdown; pick CA (California), price card shows California average.

---

### H2. Race conditions when toggling avoid-options or dragging markers — `app.js:1163, 2200, 2210, 2604, 2637, 2643, 2788, 3992, 4120`
`handleDistanceLookup` is invoked from 8+ call sites with no in-flight guard. There's a `stationGen` counter for the station load (`app.js:2564, 3615`) but nothing on the route fetch itself. Toggling "avoid highways" twice rapidly: response B comes back, then response A overwrites `map.routes`, leaving the user with the older route while the checkbox shows the new state.

**Fix:**
1. Add a module-scoped counter at the top of `app.js`: `let routeGen = 0;`
2. At the start of `handleDistanceLookup`, capture `const myGen = ++routeGen;`
3. Before any `await`-resume that mutates `map.*` or `state.routeWeather`, add `if (myGen !== routeGen) return;`
4. Debounce avoid-checkbox handler at `app.js:2208` by 200ms (`setTimeout` wrapper) so toggling 3 in a row makes 1 request.

**Verify:** rapidly toggle "avoid highways/tolls/ferries" 5 times — only one network request fires after settle; no flicker.

---

### H3. Marker drag re-fetches geocode + route on every dragend — `app.js:2590-2605`
`handleMarkerDrag` fires Nominatim reverse-geocode + full ORS reroute on every dragend with no debounce. Two consecutive drags = 2 Nominatim calls + 2 ORS multi-passes (ORS uses 5+ requests per call due to additive avoid). Easy to blow OSM Nominatim's 1-req/sec policy.

**Fix:** wrap the dragend handler in a 300ms debounce. Show a "Recomputing route…" toast on the second-to-last call.

**Verify:** drag a marker rapidly along a road — only the final position triggers the network request.

---

### H4. Auto-suggest fuel stops fires without user consent — `app.js:3403, 3410`
`maybeAutoSuggestFuelStops` calls `suggestFuelStops()` whenever distance > 70% of tank range. This silently makes 6 Overpass calls + 1 ORS reroute, clears the user's selected route alternative, and burns daily ORS quota. On slow networks the route flickers between "without stops" and "with auto-stops" while the user is still reading.

**Fix:** replace the auto-call with a banner in the result panel:
> "This trip exceeds your tank range. [Suggest 4 fuel stops]"

One click triggers `suggestFuelStops()`. The trigger logic stays in `app.js:3403`, but the action becomes user-initiated.

**Verify:** plot a trip 1000 km long with a 600 km tank — see banner, no automatic re-route.

---

### H5. US price-history chart range tabs are decorative — `scripts/update-prices.mjs:158`
The script only parses 3 weekly columns from the EIA HTML table. With `HISTORY_CAP = 104`, history grows by 1 point/week, so today the chart has ~4 points per US region. The "1W / 1M / 6M / 1Y / All" tabs all show the same 4-point line.

**Fix (one-time backfill):** EIA publishes per-region weekly history at `pet_pri_gnd_dcus_<key>_w.htm`. Add a `--backfill-us` flag to `update-prices.mjs` mirroring whatever exists for NRCan; on run, fetch each region's full history once and seed `data/prices.json`.

**Fix (defensive UI):** in `app.js:1556-1559` (chart range tabs), hide tab buttons whose required points aren't yet present in `series`.

**Verify:** after backfill, all range tabs show meaningfully different lines.

---

### H6. Empty stops silently dropped on Calculate — `app.js:2147-2153`, `app.js:3066-3079`
"Add stop" pushes `{ lat: null, lon: null, label: '' }`. If the user adds a stop and forgets to fill it before calculating, the geocode loop skips it (`else if (s && s.label)` is false for empty label). No toast, no warning — the stop visually disappears on next render.

**Fix:** in `handleDistanceLookup` (top), before the geocode loop:
```js
const emptyIdx = map.stops.findIndex(s => !s.lat && !s.label);
if (emptyIdx !== -1) {
  showToast(`Stop ${emptyIdx + 1} is empty — fill it or remove it.`, 'error');
  return;
}
```

**Verify:** add a stop, leave it empty, click Calculate — see error toast, no silent drop.

---

### H7. Saved-state schema has no version migration — `app.js:598`
`Object.assign(state, JSON.parse(raw))` silently merges old saved data with current state shape. A future rename like `priceTouched` → `priceMode` will produce subtle calc bugs (no exception, just wrong numbers — `safeInit` won't catch it).

**Fix:** add `version: 2` to state init; in `loadState`, if `parsed.version !== state.version`, run `localStorage.removeItem(LS_KEY)` and skip the merge. (Optional: add a small migration map for non-breaking changes.)

**Verify:** open localStorage, set `version: 0` on the saved object, reload — app comes up with default state.

---

## 3. Medium — accessibility & polish

### M1. Light theme `--text-fade` fails AA contrast
`#8A8E97` on `#FFFFFF` ≈ 3.5:1; WCAG AA needs 4.5:1 for body text. Used by `.brand-tag`, `.field-label small`, `.combo-empty`, `.weather-summary`, etc.

**Fix:** in `styles.css` light theme block, change to `#6B7280` (~5.7:1).

---

### M2. Focus-visible rings are stripped — `styles.css`
Search for `outline: none` reveals 3 global suppressions with no `:focus-visible` replacements. Tabbing through the form is hard to track.

**Fix:** remove every `outline: none` (or qualify with `:focus:not(:focus-visible)`); add a global rule:
```css
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

---

### M3. No `prefers-reduced-motion` respect
Many transitions and the `body::before` blob animation. Users with reduced-motion preference get full motion.

**Fix:** add to `styles.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

### M4. Tablet breakpoint missing — `styles.css`
Only `@media (max-width: 600px)` and `(max-width: 420px)` rules exist. Between 600–920px (most tablets, narrow desktop windows) the desktop grid fights a fixed 400px right column, squeezing the inputs column to ~280px.

**Fix:** add `@media (max-width: 920px)` that stacks the two columns. Or change the grid template to `grid-template-columns: minmax(0, 1fr) minmax(320px, 400px)`.

---

### M5. EV detection shows wrong empty state — `app.js:1786-1794, 1944`
Picking an electric vehicle leaves the hero total at `$0.00` with subtitle "Enter a gas price." Wrong message — there's no gasoline cost.

**Fix:** in the hero render path, when `state.pickedVehicle?.fuelType?.includes('Electric')`, set heroSub to `"Electric vehicle — no gasoline cost."` and hide the price card. (Stretch: parse `cityE`/`highwayE` from FuelEconomy.gov and show kWh equivalent with a kWh-price input.)

---

### M6. Diesel/premium auto-pick UX — `app.js:1948-1949, 2059-2068`
Picking a diesel car shows a small warning to switch to Diesel, but the regular-fuel price keeps inflating the total until the user clicks. `priceTouched` isn't even cleared.

**Fix:** in `onTrimChange`, if `data.fuelType` includes "Diesel" and `state.fuelType !== 'diesel'`, set `state.fuelType = 'diesel'; state.priceTouched = false;` and call render. Same logic for Premium.

---

### M7. Departure-time picker accepts past dates — `index.html:136`
`<input type="datetime-local">` has no `min`. A past datetime makes `trafficDurationMultiplier` compute a meaningless past-rush-hour adjustment.

**Fix:** in init, set `$('departAt').min = new Date().toISOString().slice(0,16);`. Update on focus to keep it fresh.

---

### M8. Combobox panel z-index conflicts with Leaflet popup — `styles.css:999`
`.combo-panel { z-index: 100 }`; Leaflet popups use 700. With a station popup open, opening the country combo renders the panel behind the popup.

**Fix:** bump `.combo-panel` to `z-index: 800`.

---

### M9. Toll/ferry rates are static heuristics, not per-route — `app.js:4123-4142`
`TOLL_RATE_PER_KM` is a flat `{ CA: 0.12, US: 0.07, ... }`. ON-407 is ~$0.40/km, NJ Turnpike is ~$0.10/km. Off by 2-4× on toll-heavy routes.

**Fix (low effort):** improve the auto-fill note in `index.html:332` to read "Estimate based on country average — override if you know the actual toll." Document the heuristic.

**Fix (higher effort, [decision needed]):** integrate Tollguru API (free tier, accepts polylines) for accurate per-route toll cost. Adds an API key + a budget concern.

---

### M10. Nominatim usage policy violations — `app.js:2609, 3169, 3772`
Three Nominatim endpoints, no client-side rate limit, immediate fire on marker drag. OSM policy mandates 1 req/sec. Risk of IP block at NAT level.

**Fix:** add a 1-second client-side throttle around reverse-geocode (simplest: a `let lastReverseGeocodeAt = 0` guard). Address autocomplete already debounces 350ms, that's fine.

**Fix (longer term, [decision needed]):** migrate autocomplete to `photon.komoot.io` (no rate-limit policy) or self-host Nominatim.

---

### M11. `route.weather === null` race in `applyRouteWeather` — `app.js:3438-3441`
Marker `route.weather = null` to indicate "in flight", awaits, writes the result. Concurrent call sees `null`, skips the await, reads stale `null`. UI shows "no weather" momentarily.

**Fix:** store the in-flight Promise on `route.weather`:
```js
if (route.weather instanceof Promise) { await route.weather; return; }
if (route.weather !== undefined) return;
route.weather = (async () => { /* fetch */ })();
const result = await route.weather;
route.weather = result;
```

---

### M12. Saved-route load doesn't clear old route layers — `app.js:2775-2789`
`loadSavedRoute` calls `handleDistanceLookup()` but doesn't clear `map.routes` first. Old polylines stay on the map until the new fetch lands (1-2s of visual lag).

**Fix:** call `clearRouteLayers()` at the top of `loadSavedRoute` after setting origin/dest/stops.

---

### M13. `update-prices.mjs` rewrites mid/premium even on partial fetch — `scripts/update-prices.mjs:295-332`
README says "logs a warning and keeps the existing values." That's true for the *parser*, but `applyRefresh` recomputes mid/premium from current ratios on every run, even when only `regular` was scraped. A bad regular value → poisoned mid + premium.

**Fix:** in `applyRefresh`, only rewrite mid/premium when (a) the regular value is within 15% of the previous regular, or (b) the script also got fresh diesel data. Otherwise keep the existing mid/premium.

---

## 4. Low — minor cleanups

### L1. EIA `US_PADD1` parsed but never referenced
`update-prices.mjs:43` parses PADD1 (East Coast aggregate); `US_STATE_REGION_KEY` in `app.js:617-637` only maps to PADD1A/B/C. Dead data. Drop the slug or add a fallback chain.

### L2. OSRM fallback drops alternatives when stops are present — `app.js:2838`
`const altParam = stopCount === 0 ? '&alternatives=2' : ''`. With ORS users get full functionality; without ORS, OSRM-fallback users lose alternatives once they add a stop. Send `&alternatives=2` regardless — OSRM returns `[primary]` if it can't compute alts.

### L3. Toast container has no max — `app.js:4271-4279`
`showToast` adds + 3s timeout. On long sessions with auto-suggest firing while user is tabbed away, toasts can pile up. Cap container children at 5; remove oldest when adding 6th.

### L4. `safeInit` reload loop in private mode — `app.js:4380-4397`
If localStorage throws, recovery banner shows and reloads. On reload, init fails again → infinite loop.

**Fix:** before reload, set `sessionStorage.setItem('safeInitReloaded', '1')`. Skip the reload if that flag is already set.

### L5. ORS deprecation comment is stale — `app.js:2858-2860`
Says "as of 2026-05; we stick with api.openrouteservice.org until that's resolved." Today is 2026-05-04. Either confirm the migration is done and delete the note, or schedule the work.

### L6. Theme doesn't honor `prefers-color-scheme` on first paint — `app.js:4343`
First-run users always get dark mode. Read the system preference if no saved state exists.

### L7. CartoDB raster tiles still show "Israel" labels despite `app.js:3661-3675` rewrite
The rewrite handles labels in the app's own UI, not on the map tiles themselves. Either document the limitation in README, or migrate to a vector-tile provider (MapLibre + MapTiler free tier) where labels are client-rendered.

---

## 5. Notable feature gaps (natural extensions of existing scope)

### F1. Per-leg cost breakdown
Multi-stop is a headline feature but the result panel only shows total. `route.legs[]` already exists. Add a collapsible "Trip legs" section under the breakdown showing distance + fuel + cost per leg.

### F2. Shareable trip URL
The app has no query-string serialization. A URL like `?from=Toronto&to=Montreal&car=2024-honda-civic-1.5T&stops=...` would 10× the share-with-a-friend utility. Implementation: serialize a slim subset of `state` to base64, write to `?s=...` on `update()`, parse on init before `loadState`. Bookmark-restore comes free.

### F3. EV cost calculation
FuelEconomy.gov returns `cityE`, `highwayE`, `combE` (kWh/100mi). Currently unused. For `fuelType.includes('Electric')`, swap fuel-price for kWh-price (auto-fill from public-charging-rate averages by country), reuse all the rest of the calc.

### F4. Saved car / saved route discoverability
Both features are buried — saved cars only appear after first use of "Save this car." Add an empty-state hint or a "Try saved cars" sample on first launch.

### F5. Cache vehicle-API year list in localStorage
`fegFetch` is in-memory only. First load of any session waits for FuelEconomy.gov to return the year list. Cache it in localStorage with a 24-hour TTL — the list changes once a year.

### F6. Distance-driven gas-stop spacing in "Suggest fuel stops"
Currently picks Overpass-nearest stations. Add a "spacing" heuristic: target tank-range × 0.7 between stops, prefer stations on the route corridor over absolute-nearest.

### F7. Currency conversion display
Prices are in local currency but cross-border trips (US → CA) don't convert. A "show total in USD" toggle would help road-trippers.

### F8. Cold-start price card flash
On first load before `prices.json` resolves, the price input shows `0.00` for ~200ms. Show a subtle skeleton or hide the auto-note until the fetch lands.

---

## 6. Architecture (low priority — single-developer project)

`app.js` is 4,399 lines in one file. Practical pain today: deep nested calls, no unit-testability of pure math (`weatherFuelMultiplier`, `effectiveL100km`, `applyAdjustments`). Recommend incrementally extracting these without a build step:

1. Convert `app.js` to `<script type="module">` in `index.html:532`.
2. Extract first: `units.js` (toKm/fromKm/toL100km/etc — pure functions, easy tests).
3. Then: `calc.js` (effectiveL100km, applyAdjustments, weather fuel mult).
4. Then: `weather.js` (fetchRouteWeather, weatherFuelMultiplier).
5. Add a tiny test runner — Node + native `node --test` works fine.

This is N+1 effort but pays off when the file gets to ~6k lines.

---

## 7. Security / privacy notes

- **ORS API key** is gitignored and not in any commit history (verified: `git log --all -S 'eyJvcmciOi'` is empty). The `config.js` file lives in `OneDrive/`, which syncs to Microsoft. Low risk but real — consider moving the dev key to a `.env` file outside OneDrive and serving via a tiny dev script.
- **localStorage** stores: saved cars, saved routes, station prices, user preferences. No PII beyond what the user typed. `safeInit` clears on corruption — fine.
- **Third-party fetches:** ipapi.co (IP-based location), Nominatim (addresses), Open-Meteo (weather), Overpass (gas stations), FuelEconomy.gov (cars), NHTSA (VIN). All public, no auth required, all over HTTPS.

No security fixes pending.

---

## 8. Roadmap — prioritized by impact ÷ effort

Work this top-down. Items 1–4 are 30 minutes total and eliminate guaranteed bugs.

| # | Item | Where | Effort | Impact |
|---|------|-------|--------|--------|
| 1 | **C1** — delete `state.stops.map` | `app.js:4370` | 1 min | Stops the unit-tab crash |
| 2 | **C2** — add `wMult` to comparison | `app.js:989` | 2 min | Stops biased savings line |
| 3 | **C3** — `&timezone=auto` on Open-Meteo URLs | `app.js:907, 932` | 5 min | Forecast matches departure hour |
| 4 | **H6** — empty-stop guard | `app.js:3066` | 10 min | No more silently dropped stops |
| 5 | **H1** — US states combobox | `app.js:1053, 2367, index.html:48` | 45 min | Big region-pricing accuracy gain |
| 6 | **H2 + H3** — `routeGen` counter + drag debounce | `app.js:2208, 2590, top of handleDistanceLookup` | 1.5 hr | Eliminates whole class of "wrong route" bugs |
| 7 | **H4** — auto-suggest → manual banner | `app.js:3403, 3410` | 30 min | Halves ORS quota use, removes flicker |
| 8 | **M1, M2, M3, M4** — accessibility pass | `styles.css` | 1 hr | WCAG AA compliance for normal text + tablet support |
| 9 | **F2** — shareable trip URL | new file `share.js`, integrate in `init` | 2 hr | High user value, easy shipping |
| 10 | **H5** — EIA US history backfill | `scripts/update-prices.mjs` | 2-3 hr | Chart range tabs become useful |

Items 11+ (medium severity, M5–M13, L1–L7, F1, F3–F8, architecture) are nice-to-haves; tackle in order of personal interest.

---

## Notes for the implementing agent

- **Verify in browser before committing each item.** The user expects to see a working preview, not just a passing type-check. Use the preview tools after every change that affects the UI.
- **Don't bundle items into one mega-commit.** One commit per numbered roadmap item — easier to revert if any single one breaks.
- **If a fix changes `state` shape**, bump `version` per H7 to invalidate stale localStorage.
- **Items marked `[decision needed]` (M9 Tollguru, M10 Photon, F3 EV cost detail) should pause and ask the user**. Everything else is safe to ship.
- **The agent native parity rule still applies**: any user-visible feature you add (e.g., F2 shareable URL) should be inspectable / actionable from the browser's address bar without needing JS console magic.
