#!/usr/bin/env node
// Daily refresh of prices.json. Run with: node scripts/update-prices.mjs
//
// Fetches public regional gas-price averages from government data sources and
// rewrites prices.json. Safe to run repeatedly: if a source is unreachable or its
// HTML changed, the script logs a warning and keeps the existing value for that
// region instead of clobbering it.
//
// Sources:
//   - US national + 5 PADD regions + 9 specific states:
//       https://www.eia.gov/petroleum/gasdiesel/  (no API key needed)
//   - Canada national + 11 cities aggregated by province:
//       https://www2.nrcan.gc.ca/eneene/sources/pripri/prices_bycity_e.cfm
//
// In addition to refreshing the headline regular/mid/premium/diesel numbers, this
// script appends a history point per region so the front-end can chart trends.
// History is capped at the most recent 26 entries per region (~6 months weekly).

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const PRICES_PATH = resolve(HERE, '..', 'data', 'prices.json');
// Cap of stored weekly data points per region. 104 ≈ 2 years of weekly data,
// enough to make 1M / 6M / 1Y / All chart ranges produce distinct views.
const HISTORY_CAP = 104;
// `--backfill` triggers a multi-year NRCan fetch (2-year window) to seed the
// chart with deep history on first run. Daily runs just append the latest week.
const BACKFILL_MODE = process.argv.includes('--backfill');

const UA = 'Mozilla/5.0 (compatible; trip-fuel-cost-bot/1.0)';

const EIA_URL = 'https://www.eia.gov/petroleum/gasdiesel/';

// EIA URL slug → our region key. Slugs are pulled from the gasdiesel HTML
// (e.g. .../pet_pri_gnd_dcus_<SLUG>_w.htm). State slugs follow s<XX> form.
const EIA_SLUG_TO_KEY = {
  'nus':   'US',
  'r10':   'US_PADD1',
  'r1x':   'US_PADD1A',
  'r1y':   'US_PADD1B',
  'r1z':   'US_PADD1C',
  'r20':   'US_PADD2',
  'r30':   'US_PADD3',
  'r40':   'US_PADD4',
  'r50':   'US_PADD5',
  'sca':   'US_CA',
  'sco':   'US_CO',
  'sfl':   'US_FL',
  'sma':   'US_MA',
  'smn':   'US_MN',
  'sny':   'US_NY',
  'soh':   'US_OH',
  'stx':   'US_TX',
  'swa':   'US_WA',
};

// Friendly labels used when seeding a brand-new region into prices.json.
const KEY_LABELS = {
  US_PADD1:  'US East Coast avg',
  US_PADD1A: 'US New England avg',
  US_PADD1B: 'US Central Atlantic avg',
  US_PADD1C: 'US Lower Atlantic avg',
  US_PADD2:  'US Midwest avg',
  US_PADD3:  'US Gulf Coast avg',
  US_PADD4:  'US Rockies avg',
  US_PADD5:  'US West Coast avg',
  US_CA:     'California avg',
  US_CO:     'Colorado avg',
  US_FL:     'Florida avg',
  US_MA:     'Massachusetts avg',
  US_MN:     'Minnesota avg',
  US_NY:     'New York avg',
  US_OH:     'Ohio avg',
  US_TX:     'Texas avg',
  US_WA:     'Washington avg',
};

// Per-state PADD region — used as the seed/ratio fallback when a state has no
// diesel data on the EIA page (only California is broken out for diesel).
const STATE_FALLBACK = {
  US_CA: 'US_PADD5',
  US_CO: 'US_PADD4',
  US_FL: 'US_PADD1C',
  US_MA: 'US_PADD1A',
  US_MN: 'US_PADD2',
  US_NY: 'US_PADD1B',
  US_OH: 'US_PADD2',
  US_TX: 'US_PADD3',
  US_WA: 'US_PADD5',
};

const NRCAN_CITY_TO_PROVINCE = {
  'Canada':        'CA',
  'Calgary':       'CA_AB',
  'Charlottetown': 'CA_PE',
  'Edmonton':      'CA_AB',
  'Halifax':       'CA_NS',
  'Montreal':      'CA_QC',
  'Ottawa':        'CA_ON',
  'Quebec':        'CA_QC',
  'Regina':        'CA_SK',
  'Saint John':    'CA_NB',
  "St. John's":    'CA_NL',
  'Toronto':       'CA_ON',
  'Vancouver':     'CA_BC',
  'Whitehorse':    'CA_YT',
  'Winnipeg':      'CA_MB',
  'Yellowknife':   'CA_NT',
};
const NRCAN_LOCATION_IDS = [66, 2, 10, 8, 12, 15, 17, 18, 28, 29, 33, 39, 43, 44, 1, 7];
function buildNRCanUrl(year) {
  return 'https://www2.nrcan.gc.ca/eneene/sources/pripri/prices_bycity_e.cfm?productID=1&priceYear='
    + year + '&frequency=W'
    + NRCAN_LOCATION_IDS.map(id => `&locationID=${id}`).join('');
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// ---------- EIA (US) ----------
// Each row in the regular & diesel tables links to the per-region detail page
// and lists THREE weekly prices (oldest → latest), with column-header dates.
// We grab all three so the chart has history right away.
//
// The "States" sub-table for regular-gas data sits between the main Regular
// table and the Diesel table, so the regular-gas block is "everything between
// the Regular caption and the Diesel caption" (covers PADDs + the states list).
function parseEIA(html) {
  const out = {}; // { key: { regular, diesel, history: [{date, regular?, diesel?}] } }

  const tables = {
    regular: html.match(
      /<caption>U\.S\. Regular Gasoline Prices[\s\S]*?<\/caption>([\s\S]*?)<caption>U\.S\. On-Highway Diesel Fuel Prices/i
    ),
    diesel: html.match(
      /<caption>U\.S\. On-Highway Diesel Fuel Prices[\s\S]*?<\/caption>([\s\S]*?)<\/table>/i
    ),
  };

  for (const [fuel, block] of Object.entries(tables)) {
    if (!block) continue;

    // Column headers like <th>04/13/26</th>. There are 3 data dates per table.
    const dateRe = /<th[^>]*>(\d{2})\/(\d{2})\/(\d{2})<\/th>/g;
    const dates = [];
    let dm;
    while ((dm = dateRe.exec(block[1])) && dates.length < 3) {
      dates.push(`20${dm[3]}-${dm[1]}-${dm[2]}`);
    }
    if (dates.length !== 3) continue;

    // For each region row, capture all three weekly prices.
    const rowRe = /pet_pri_gnd_dcus_([a-z0-9]+)_w\.htm[\s\S]*?<\/a>[\s\S]*?<td[^>]*>\s*([\d.]+)\s*<\/td>\s*<td[^>]*>\s*([\d.]+)\s*<\/td>\s*<td[^>]*>\s*([\d.]+)\s*<\/td>/g;
    let m;
    while ((m = rowRe.exec(block[1]))) {
      const key = EIA_SLUG_TO_KEY[m[1]];
      if (!key) continue;
      const vals = [parseFloat(m[2]), parseFloat(m[3]), parseFloat(m[4])];
      if (!vals.every(v => isFinite(v) && v > 0 && v < 20)) continue;

      out[key] = out[key] || { history: [] };
      out[key][fuel] = vals[2]; // latest
      for (let i = 0; i < 3; i++) {
        let existing = out[key].history.find(h => h.date === dates[i]);
        if (!existing) {
          existing = { date: dates[i] };
          out[key].history.push(existing);
        }
        existing[fuel] = vals[i];
      }
    }
  }
  return out;
}

// ---------- NRCan (Canada) ----------
// City order is set by the colspan="4">CityName</th> column headers. tbody has
// one row per week with date + N×4 price-related cells. Each city N's regular
// price is in <td headers="header4_N_1 ...">, in cents per litre (taxes incl).
// We pull the last HISTORY_CAP rows so the chart has weekly history out of the gate.
function parseNRCan(html) {
  const out = {}; // { cityName: { regular: $/L, history: [{date, regular}] } }

  const cities = [];
  const cityRe = /colspan="4">\s*([^<]+?)\s*<\/th>/g;
  let m;
  while ((m = cityRe.exec(html))) cities.push(m[1].trim());
  if (cities.length === 0) return out;

  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
  if (!tbodyMatch) return out;
  const trs = [...tbodyMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
  if (trs.length === 0) return out;

  const recent = trs.slice(-HISTORY_CAP);
  for (const trMatch of recent) {
    const tr = trMatch[1];
    const dateMatch = tr.match(/(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) continue;
    const date = dateMatch[1];

    for (let i = 0; i < cities.length; i++) {
      const N = i + 1;
      const priceRe = new RegExp(
        `<td headers="header4_${N}_1[^"]*">\\s*([0-9]+\\.?[0-9]*)\\s*</td>`
      );
      const pm = tr.match(priceRe);
      if (!pm) continue;
      const cents = parseFloat(pm[1]);
      if (!isFinite(cents) || cents < 50 || cents > 400) continue;

      const city = cities[i];
      out[city] = out[city] || { history: [] };
      out[city].history.push({ date, regular: cents / 100 });
    }
  }
  // Latest regular = last (most recent) row's value
  for (const city of Object.keys(out)) {
    const h = out[city].history;
    if (h.length) out[city].regular = h[h.length - 1].regular;
  }
  return out;
}

// ---------- Helpers ----------
function avg(nums) {
  const v = nums.filter(n => isFinite(n) && n > 0);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
function round(n, dp = 3) { return Math.round(n * 10 ** dp) / 10 ** dp; }
function todayISO() { return new Date().toISOString().slice(0, 10); }

// Append (or replace today's) history point. Keeps last HISTORY_CAP entries.
// Skips a no-op append if the values are essentially unchanged from the last
// stored point — avoids cluttering history with daily-rerun duplicates.
function upsertHistory(entry, regular, diesel) {
  const today = todayISO();
  const point = { date: today, regular: round(regular, 3), diesel: round(diesel, 3) };
  const history = entry.history || [];
  const last = history[history.length - 1];

  if (!last) {
    history.push(point);
  } else if (last.date === today) {
    history[history.length - 1] = point;
  } else {
    const regChanged = Math.abs((last.regular ?? 0) - point.regular) > 0.005;
    const dieselChanged = Math.abs((last.diesel ?? 0) - point.diesel) > 0.005;
    if (regChanged || dieselChanged) history.push(point);
  }

  while (history.length > HISTORY_CAP) history.shift();
  entry.history = history;
}

// Merge an array of {date, regular?, diesel?} points into entry.history,
// preferring the new value where present. Sorted asc; capped at HISTORY_CAP.
function mergeHistory(entry, points) {
  const byDate = new Map((entry.history || []).map(h => [h.date, { ...h }]));
  for (const p of points) {
    if (!p.date) continue;
    const e = byDate.get(p.date) || { date: p.date };
    if (isFinite(p.regular)) e.regular = round(p.regular, 3);
    if (isFinite(p.diesel))  e.diesel  = round(p.diesel, 3);
    byDate.set(p.date, e);
  }
  let merged = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  if (merged.length > HISTORY_CAP) merged = merged.slice(-HISTORY_CAP);
  entry.history = merged;
}

// For provinces with multiple feeder cities, average each date's prices across
// cities so the province history is a single coherent series.
function avgHistoriesByDate(arrayOfHistories) {
  const byDate = {};
  for (const hist of arrayOfHistories) {
    for (const p of hist) {
      if (!p.date || !isFinite(p.regular)) continue;
      (byDate[p.date] ||= []).push(p.regular);
    }
  }
  return Object.entries(byDate)
    .map(([date, vals]) => ({ date, regular: vals.reduce((a, b) => a + b, 0) / vals.length }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Refresh one region. fresh = { regular?, diesel? }.
// If the region is brand-new (e.g. US_TX added on first run), we seed it using
// fallback ratios from US national so mid/premium/diesel come out reasonable.
function applyRefresh(data, key, fresh, changes, fallbackKey = 'US') {
  const prev = data[key];
  const fb = data[fallbackKey];
  if (!fb) return;

  const ref = (prev && prev.regular > 0) ? prev : fb;
  const midRatio    = ref.mid / ref.regular;
  const premRatio   = ref.premium / ref.regular;
  const dieselRatio = ref.diesel / ref.regular;

  const baseRegular = isFinite(fresh.regular) ? fresh.regular : ref.regular;
  if (!isFinite(baseRegular) || baseRegular <= 0) return;

  data[key] = prev || {};
  if (!data[key].label) {
    data[key].label = KEY_LABELS[key] || key.replace(/^[A-Z]+_/, '') + ' avg';
  }

  const before = { regular: prev?.regular, diesel: prev?.diesel };
  data[key].regular = round(baseRegular, 3);
  data[key].mid     = round(baseRegular * midRatio, 3);
  data[key].premium = round(baseRegular * premRatio, 3);
  data[key].diesel  = round(
    isFinite(fresh.diesel) ? fresh.diesel : baseRegular * dieselRatio,
    3
  );

  if (Array.isArray(fresh.history) && fresh.history.length) {
    mergeHistory(data[key], fresh.history);
  } else {
    upsertHistory(data[key], data[key].regular, data[key].diesel);
  }

  if (data[key].regular !== before.regular || data[key].diesel !== before.diesel) {
    const r0 = before.regular ?? '—', d0 = before.diesel ?? '—';
    changes.push(`${key}: regular ${r0}→${data[key].regular}, diesel ${d0}→${data[key].diesel}`);
  }
}

// ---------- Main ----------
async function main() {
  const raw = await readFile(PRICES_PATH, 'utf8');
  const data = JSON.parse(raw);
  const changes = [];

  // --- US ---
  try {
    const html = await fetchText(EIA_URL);
    const parsed = parseEIA(html);
    const usFresh = parsed.US;
    if (usFresh && (usFresh.regular || usFresh.diesel)) {
      applyRefresh(data, 'US', usFresh, changes);
    } else {
      console.warn('[update-prices] EIA: US national row missing. Keeping existing US value.');
    }
    for (const [key, fresh] of Object.entries(parsed)) {
      if (key === 'US') continue;
      // For states, prefer their PADD region as the diesel-ratio fallback
      // (e.g. Texas falls back to Gulf Coast, not US national).
      const fb = STATE_FALLBACK[key] || 'US';
      applyRefresh(data, key, fresh, changes, fb);
    }
  } catch (err) {
    console.warn(`[update-prices] EIA fetch/parse failed: ${err.message}. Keeping US values.`);
  }

  // --- Canada ---
  // Default: this year's weekly fuel prices. Backfill mode: also pulls the
  // previous two years so the chart has 2y of weekly data on first run.
  const thisYear = new Date().getFullYear();
  const yearsToFetch = BACKFILL_MODE
    ? [thisYear - 2, thisYear - 1, thisYear]
    : [thisYear];

  // Aggregate per-city histories across all fetched years before the
  // province-averaging step.
  const aggregated = {}; // { city: { history: [...] } }
  for (const year of yearsToFetch) {
    try {
      const html = await fetchText(buildNRCanUrl(year));
      const cityData = parseNRCan(html);
      for (const [city, info] of Object.entries(cityData)) {
        if (!aggregated[city]) aggregated[city] = { history: [] };
        aggregated[city].history.push(...(info.history || []));
      }
      console.log(`[update-prices] NRCan ${year}: ${Object.keys(cityData).length} cities × ~${cityData[Object.keys(cityData)[0]]?.history?.length || 0} weeks`);
    } catch (err) {
      console.warn(`[update-prices] NRCan ${year} fetch/parse failed: ${err.message}.`);
    }
  }

  if (Object.keys(aggregated).length === 0) {
    console.warn('[update-prices] NRCan: no cities matched any year. Keeping CA values.');
  } else {
    // Group city histories by province, then average across cities per date.
    const histByKey = {};
    for (const [city, info] of Object.entries(aggregated)) {
      const key = NRCAN_CITY_TO_PROVINCE[city];
      if (!key) continue;
      (histByKey[key] ||= []).push(info.history || []);
    }
    for (const [key, cityHistories] of Object.entries(histByKey)) {
      const merged = avgHistoriesByDate(cityHistories);
      if (merged.length === 0) continue;
      const latest = merged[merged.length - 1];
      applyRefresh(data, key, { regular: latest.regular, history: merged }, changes, 'CA');
    }
  }

  // --- Stamp + write ---
  data._meta = data._meta || {};
  data._meta.lastUpdated = todayISO();
  await writeFile(PRICES_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');

  if (changes.length === 0) {
    console.log('[update-prices] No price changes (sources unreachable or values identical).');
  } else {
    console.log(`[update-prices] Updated ${changes.length} entries:`);
    for (const c of changes) console.log('  - ' + c);
  }
}

main().catch(err => {
  console.error('[update-prices] fatal:', err);
  process.exit(1);
});
