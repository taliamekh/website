# Fuel Economy Calculator

Plan the cost of any road trip in any country. Pick your car or enter custom efficiency, route the trip on a map, adjust for driving conditions, and see fuel cost (split by passenger if you want).

**Live site:** <https://taliamekh.github.io/Fuel-Economy-Calculator/>

## Features

- **Vehicle picker** — 1984–2026, 40k+ models, sourced from FuelEconomy.gov.
- **VIN decode** — pulls year/make/model from a 17-character VIN via NHTSA vPIC.
- **Route planner** — origin / destination / multiple stops, alternative routes, distance from OpenStreetMap.
- **Live regional gas prices** — daily-refreshed averages by US state / region and Canadian province (see *Daily price refresh* below).
- **Price history chart** — recent weekly history for the active region with a 4-week linear-regression projection. Trend line is directional, not a forecast.
- **Per-station prices** — click a green dot on the map → station popup with a one-tap link to the station's GasBuddy page, and a "saw a price" input that saves to local storage so the next visit shows your last reported price.
- **Driving adjustments** — eco / aggressive style, AC, towing, cold weather, mountainous terrain, etc.
- **Vehicle comparison** — compare two cars on the same trip.
- **Unit-system aware** — L/100km, km/L, MPG (US), MPG (UK).

## Project layout

```
Fuel-Economy-Calculator/
├── .github/workflows/      GitHub Actions
│   ├── pages.yml             Builds + deploys to Pages, injects ORS_API_KEY secret
│   └── update-prices.yml     Daily price refresh
├── data/
│   └── prices.json         Daily-refreshed regional averages + history
├── scripts/
│   └── update-prices.mjs   Fetches EIA + NRCan, rewrites data/prices.json
├── app.js                  Front-end logic (single file by design)
├── config.example.js       Local-dev placeholder for ORS_API_KEY
├── index.html              Page shell
├── styles.css              Styles (dark/light themes)
├── package.json            Project metadata + npm scripts
└── README.md               This file
```

The site is **fully static** — no build step, no backend. Open `index.html` directly or serve the folder with any static server.

## Running locally

```bash
# Copy the config placeholder; paste your own ORS key (optional — without one
# the avoid-features checkboxes go inert but everything else still works)
cp config.example.js config.js
# Then edit config.js and replace the empty string with your key.

# Serve the folder:
python -m http.server 5173
# or
npx serve .
```

Then open <http://localhost:5173>.

`data/prices.json` is loaded by the front end at startup. If the fetch fails
(offline, `file://`, missing file), the app falls back to in-code defaults and
keeps working. Same with `config.js` — if it's missing or the key is empty,
routing falls back from OpenRouteService to OSRM (which doesn't support
avoid-features, but the rest of the app is unaffected).

## Deploying

Two one-time setup steps for fresh-clone deployments:

1. **Add the ORS key as a secret.** GitHub repo → Settings → Secrets and
   variables → Actions → New repository secret. Name it `ORS_API_KEY`, paste
   your OpenRouteService key as the value.
2. **Switch Pages source to GitHub Actions.** GitHub repo → Settings → Pages
   → Build and deployment → Source: **GitHub Actions**.

After that, every push to `main` triggers `.github/workflows/pages.yml`, which
generates `config.js` from the secret at build time and uploads the site to
Pages. The real key never enters the repo.

## Daily price refresh

`scripts/update-prices.mjs` rewrites `data/prices.json` with fresh regional averages from:

- **United States:** [EIA Gasoline & Diesel Fuel Update](https://www.eia.gov/petroleum/gasdiesel/) — national, 5 PADD regions, 3 PADD subdivisions, 9 specific states (CA, CO, FL, MA, MN, NY, OH, TX, WA).
- **Canada:** [Natural Resources Canada — Fuel Prices in Selected Cities](https://www2.nrcan.gc.ca/eneene/sources/pripri/prices_bycity_e.cfm) — national + 11 provinces aggregated from 15 city feeds.

Other countries (UK, AU, EU, etc.) keep static defaults until additional scrapers are added.

The script is **defensive**: if a source is unreachable or its HTML changes, it logs a warning and keeps the existing values rather than clobbering them with bad data.

### Run manually

```bash
npm run update-prices
# or
node scripts/update-prices.mjs
```

### Automated (GitHub Actions)

`.github/workflows/update-prices.yml` runs daily at 11:00 UTC (~7am ET). If `data/prices.json` changes, the workflow commits and pushes to `main`, which triggers a Pages redeploy.

To trigger manually: GitHub repo → Actions → "Refresh gas prices" → "Run workflow".

## Custom prices and per-station reports

Three layers of price data, in priority order:

1. **Custom price** — type a number into the Gas Price input. Sticks until cleared.
2. **Per-station report** — on the map popup, type the price you saw and tap "Use this price". Saves to `localStorage` keyed by OSM station ID. Next visit pre-fills.
3. **Regional default** — daily-refreshed average for your detected country/region.

There is no GasBuddy-style live per-station feed. GasBuddy/OPIS render prices client-side via authenticated API calls, and they explicitly prohibit scraping. The "⛽ Check GasBuddy for live price" popup button opens GasBuddy in a new tab pre-filled with the station's name and address — you can copy the price back if you want.

## Contributing

This is a personal project. Issues and PRs welcome but not actively solicited.

## License

[MIT](./LICENSE).

## Data attribution

- Vehicle fuel-economy data: [FuelEconomy.gov](https://www.fueleconomy.gov/) (US Dept. of Energy, public domain).
- VIN decoding: [NHTSA vPIC](https://vpic.nhtsa.dot.gov/api/) (public domain).
- Geocoding & routing: [OpenStreetMap Nominatim](https://nominatim.org/) and [OSRM](http://project-osrm.org/) (ODbL).
- Fuel station locations: [Overpass API](https://overpass-api.de/) on OpenStreetMap data (ODbL).
- IP-based location: [ipapi.co](https://ipapi.co/).
- US gas-price averages: [EIA](https://www.eia.gov/petroleum/gasdiesel/) (public domain).
- Canadian gas-price averages: [Natural Resources Canada](https://www2.nrcan.gc.ca/eneene/sources/pripri/prices_bycity_e.cfm) (Open Government Licence — Canada).
