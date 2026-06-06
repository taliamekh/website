/* ============================================================
 * Gas Trip Cost Calculator
 * Vanilla JS — no build, no deps. Drop in a browser, it works.
 * ============================================================ */

/* =========================
   CONVERSION CONSTANTS
   ========================= */
const KM_PER_MILE = 1.60934;
const MILE_PER_KM = 0.621371;
const L_PER_GAL_US = 3.78541;
const L_PER_GAL_UK = 4.54609;

/* =========================
   UNIT SYSTEMS
   ========================= */
const UNIT_SYSTEMS = {
  // UK sells fuel by the litre but rates cars in MPG (Imperial gallons), so volume = litre there.
  'metric-l100km': { distance: 'km',   efficiency: 'l100km', volume: 'litre',     effLabel: 'L/100km',  distLabel: 'km',    volLabel: 'L',   effInverse: false },
  'metric-kmpl':   { distance: 'km',   efficiency: 'kmpl',   volume: 'litre',     effLabel: 'km/L',     distLabel: 'km',    volLabel: 'L',   effInverse: true  },
  'imperial-us':   { distance: 'mile', efficiency: 'mpg-us', volume: 'gallon-us', effLabel: 'MPG',      distLabel: 'miles', volLabel: 'gal', effInverse: true  },
  'imperial-uk':   { distance: 'mile', efficiency: 'mpg-uk', volume: 'litre',     effLabel: 'MPG (UK)', distLabel: 'miles', volLabel: 'L',   effInverse: true  },
};

/* =========================
   COUNTRIES & DEFAULTS
   ========================= */
const COUNTRIES = [
  { code: 'US', name: 'United States',     currency: 'USD', symbol: '$',   unit: 'imperial-us',   priceUnit: 'gallon-us' },
  { code: 'CA', name: 'Canada',            currency: 'CAD', symbol: 'CA$', unit: 'metric-l100km', priceUnit: 'litre' },
  { code: 'GB', name: 'United Kingdom',    currency: 'GBP', symbol: '£',   unit: 'imperial-uk',   priceUnit: 'litre' },
  { code: 'AU', name: 'Australia',         currency: 'AUD', symbol: 'A$',  unit: 'metric-l100km', priceUnit: 'litre' },
  { code: 'NZ', name: 'New Zealand',       currency: 'NZD', symbol: 'NZ$', unit: 'metric-l100km', priceUnit: 'litre' },
  { code: 'IE', name: 'Ireland',           currency: 'EUR', symbol: '€',   unit: 'metric-l100km', priceUnit: 'litre' },
  { code: 'DE', name: 'Germany',           currency: 'EUR', symbol: '€',   unit: 'metric-l100km', priceUnit: 'litre' },
  { code: 'FR', name: 'France',            currency: 'EUR', symbol: '€',   unit: 'metric-l100km', priceUnit: 'litre' },
  { code: 'IT', name: 'Italy',             currency: 'EUR', symbol: '€',   unit: 'metric-l100km', priceUnit: 'litre' },
  { code: 'ES', name: 'Spain',             currency: 'EUR', symbol: '€',   unit: 'metric-l100km', priceUnit: 'litre' },
  { code: 'NL', name: 'Netherlands',       currency: 'EUR', symbol: '€',   unit: 'metric-l100km', priceUnit: 'litre' },
  { code: 'BE', name: 'Belgium',           currency: 'EUR', symbol: '€',   unit: 'metric-l100km', priceUnit: 'litre' },
  { code: 'PT', name: 'Portugal',          currency: 'EUR', symbol: '€',   unit: 'metric-l100km', priceUnit: 'litre' },
  { code: 'SE', name: 'Sweden',            currency: 'SEK', symbol: 'kr',  unit: 'metric-l100km', priceUnit: 'litre' },
  { code: 'NO', name: 'Norway',            currency: 'NOK', symbol: 'kr',  unit: 'metric-l100km', priceUnit: 'litre' },
  { code: 'DK', name: 'Denmark',           currency: 'DKK', symbol: 'kr',  unit: 'metric-l100km', priceUnit: 'litre' },
  { code: 'CH', name: 'Switzerland',       currency: 'CHF', symbol: 'Fr',  unit: 'metric-l100km', priceUnit: 'litre' },
  { code: 'AT', name: 'Austria',           currency: 'EUR', symbol: '€',   unit: 'metric-l100km', priceUnit: 'litre' },
  { code: 'PL', name: 'Poland',            currency: 'PLN', symbol: 'zł',  unit: 'metric-l100km', priceUnit: 'litre' },
  { code: 'JP', name: 'Japan',             currency: 'JPY', symbol: '¥',   unit: 'metric-kmpl',   priceUnit: 'litre' },
  { code: 'KR', name: 'South Korea',       currency: 'KRW', symbol: '₩',   unit: 'metric-kmpl',   priceUnit: 'litre' },
  { code: 'IN', name: 'India',             currency: 'INR', symbol: '₹',   unit: 'metric-kmpl',   priceUnit: 'litre' },
  { code: 'BR', name: 'Brazil',            currency: 'BRL', symbol: 'R$',  unit: 'metric-kmpl',   priceUnit: 'litre' },
  { code: 'MX', name: 'Mexico',            currency: 'MXN', symbol: '$',   unit: 'metric-l100km', priceUnit: 'litre' },
  { code: 'ZA', name: 'South Africa',      currency: 'ZAR', symbol: 'R',   unit: 'metric-l100km', priceUnit: 'litre' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', symbol: 'د.إ', unit: 'metric-l100km', priceUnit: 'litre' },
  { code: 'SG', name: 'Singapore',         currency: 'SGD', symbol: 'S$',  unit: 'metric-l100km', priceUnit: 'litre' },
  { code: 'OTHER', name: 'Other / not listed', currency: 'USD', symbol: '$', unit: 'metric-l100km', priceUnit: 'litre' },
];

const CA_PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland & Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' },
];

// Gas price defaults — fallback values, used until prices.json loads (and if it fails to load).
// Stored in their native unit (US: $/gal_US, others: $/L). Currency is local.
// prices.json (refreshed daily by scripts/update-prices.mjs) overwrites these on app start.
let GAS_DEFAULTS = {
  US:    { regular: 4.45, mid: 4.85, premium: 5.20, diesel: 4.55, label: 'US national avg' },
  CA:    { regular: 1.75, mid: 1.92, premium: 2.05, diesel: 1.85, label: 'Canada avg' },
  CA_AB: { regular: 1.55, mid: 1.72, premium: 1.85, diesel: 1.65, label: 'Alberta avg' },
  CA_BC: { regular: 2.05, mid: 2.22, premium: 2.35, diesel: 2.10, label: 'BC avg' },
  CA_MB: { regular: 1.65, mid: 1.82, premium: 1.95, diesel: 1.75, label: 'Manitoba avg' },
  CA_NB: { regular: 1.70, mid: 1.87, premium: 2.00, diesel: 1.80, label: 'New Brunswick avg' },
  CA_NL: { regular: 1.85, mid: 2.02, premium: 2.15, diesel: 1.95, label: 'Newfoundland avg' },
  CA_NS: { regular: 1.78, mid: 1.95, premium: 2.08, diesel: 1.88, label: 'Nova Scotia avg' },
  CA_NT: { regular: 1.95, mid: 2.12, premium: 2.25, diesel: 2.05, label: 'NWT avg' },
  CA_NU: { regular: 2.20, mid: 2.40, premium: 2.55, diesel: 2.30, label: 'Nunavut avg' },
  CA_ON: { regular: 1.75, mid: 1.92, premium: 2.05, diesel: 1.85, label: 'Ontario avg' },
  CA_PE: { regular: 1.80, mid: 1.97, premium: 2.10, diesel: 1.90, label: 'PEI avg' },
  CA_QC: { regular: 1.80, mid: 1.97, premium: 2.10, diesel: 1.90, label: 'Quebec avg' },
  CA_SK: { regular: 1.60, mid: 1.77, premium: 1.90, diesel: 1.70, label: 'Saskatchewan avg' },
  CA_YT: { regular: 1.95, mid: 2.12, premium: 2.25, diesel: 2.05, label: 'Yukon avg' },
  GB:    { regular: 1.45, mid: 1.55, premium: 1.65, diesel: 1.55, label: 'UK avg' },
  AU:    { regular: 1.95, mid: 2.05, premium: 2.20, diesel: 1.85, label: 'Australia avg' },
  NZ:    { regular: 2.85, mid: 2.95, premium: 3.10, diesel: 1.95, label: 'NZ avg' },
  IE:    { regular: 1.78, mid: 1.85, premium: 1.95, diesel: 1.75, label: 'Ireland avg' },
  DE:    { regular: 1.75, mid: 1.78, premium: 1.85, diesel: 1.65, label: 'Germany avg' },
  FR:    { regular: 1.85, mid: 1.88, premium: 1.95, diesel: 1.75, label: 'France avg' },
  IT:    { regular: 1.90, mid: 1.95, premium: 2.05, diesel: 1.80, label: 'Italy avg' },
  ES:    { regular: 1.65, mid: 1.70, premium: 1.78, diesel: 1.60, label: 'Spain avg' },
  NL:    { regular: 2.10, mid: 2.15, premium: 2.25, diesel: 1.85, label: 'Netherlands avg' },
  BE:    { regular: 1.85, mid: 1.90, premium: 2.00, diesel: 1.80, label: 'Belgium avg' },
  PT:    { regular: 1.80, mid: 1.85, premium: 1.95, diesel: 1.70, label: 'Portugal avg' },
  SE:    { regular: 19.50, mid: 20.50, premium: 21.50, diesel: 18.50, label: 'Sweden avg' },
  NO:    { regular: 22.00, mid: 23.00, premium: 24.00, diesel: 21.00, label: 'Norway avg' },
  DK:    { regular: 14.50, mid: 15.00, premium: 15.50, diesel: 13.50, label: 'Denmark avg' },
  CH:    { regular: 1.85, mid: 1.90, premium: 2.00, diesel: 1.95, label: 'Switzerland avg' },
  AT:    { regular: 1.55, mid: 1.62, premium: 1.70, diesel: 1.50, label: 'Austria avg' },
  PL:    { regular: 6.50, mid: 6.80, premium: 7.10, diesel: 6.40, label: 'Poland avg' },
  JP:    { regular: 175,  mid: 185,  premium: 195,  diesel: 155,  label: 'Japan avg' },
  KR:    { regular: 1700, mid: 1780, premium: 1850, diesel: 1550, label: 'Korea avg' },
  IN:    { regular: 105,  mid: 108,  premium: 115,  diesel: 95,   label: 'India avg' },
  BR:    { regular: 6.20, mid: 6.50, premium: 7.00, diesel: 6.50, label: 'Brazil avg' },
  MX:    { regular: 24.50, mid: 26.00, premium: 27.50, diesel: 25.80, label: 'Mexico avg' },
  ZA:    { regular: 24.00, mid: 24.50, premium: 25.00, diesel: 22.00, label: 'South Africa avg' },
  AE:    { regular: 3.20, mid: 3.30, premium: 3.40, diesel: 3.45, label: 'UAE avg' },
  SG:    { regular: 3.05, mid: 3.20, premium: 3.50, diesel: 2.85, label: 'Singapore avg' },
  OTHER: { regular: 1.50, mid: 1.60, premium: 1.70, diesel: 1.45, label: 'Generic estimate' },
};

/* =========================
   DRIVING ADJUSTMENTS
   ========================= */
// Multiplier on fuel CONSUMPTION (L/100km). >1 = uses more fuel.
const STYLE_FUEL_MULT = { eco: 0.90, normal: 1.0, aggressive: 1.20 };

// Fractional fuel-use INCREASE per condition (additive within group).
const CONDITION_PENALTY = {
  ac: 0.03, roofRack: 0.10, towing: 0.15,
  mountainous: 0.10, cold: 0.05, poorRoads: 0.08,
};

/* =========================
   VEHICLE PRESETS
   ========================= */
// Stored as MPG (US). Convert to other units on the fly.
// tankL = typical tank size in litres for that segment — used to auto-fill
// the Trip-extras tank field when the user picks a preset.
const VEHICLE_PRESETS = [
  { name: 'Compact',      mpg: 35, tankL: 50  },
  { name: 'Sedan',        mpg: 30, tankL: 60  },
  { name: 'Crossover',    mpg: 28, tankL: 60  },
  { name: 'SUV',          mpg: 22, tankL: 75  },
  { name: 'Pickup truck', mpg: 18, tankL: 95  },
  { name: 'Sports car',   mpg: 20, tankL: 60  },
  { name: 'Hybrid',       mpg: 48, tankL: 50  },
  { name: 'Minivan',      mpg: 24, tankL: 75  },
  { name: 'Cargo van',    mpg: 18, tankL: 95  },
  { name: 'Moving truck', mpg: 10, tankL: 150 },
  { name: 'RV',           mpg: 15, tankL: 200 },
  { name: 'Motorcycle',   mpg: 55, tankL: 18  },
];

// Map a FuelEconomy.gov VClass label to a typical tank size in litres.
// FuelEconomy.gov doesn't expose tank capacity, so we estimate by segment;
// users can override the value in the Trip-extras input.
function estimateTankLitres(vClass) {
  if (!vClass) return 0;
  const v = String(vClass).toLowerCase();
  if (v.includes('motorcycle'))                      return 18;
  if (v.includes('two seater'))                      return 55;
  if (v.includes('minicompact') || v.includes('subcompact')) return 45;
  if (v.includes('compact'))                         return 50;
  if (v.includes('midsize'))                         return 60;
  if (v.includes('large car'))                       return 70;
  if (v.includes('station wagon'))                   return v.includes('small') ? 50 : 60;
  if (v.includes('minivan'))                         return 75;
  if (v.includes('small pickup'))                    return 75;
  if (v.includes('pickup'))                          return 95;
  if (v.includes('standard') && v.includes('sport')) return 80;
  if (v.includes('small') && v.includes('sport'))    return 60;
  if (v.includes('sport utility'))                   return 70;
  if (v.includes('cargo') || v.includes(' van'))     return 95;
  if (v.includes('special'))                         return 85;
  return 60; // unknown segment — sensible default
}

/* =========================
   STATE
   ========================= */
const state = {
  detected: { country: null, region: null, city: null, source: null, status: 'detecting' },
  country: 'US',
  region: null,
  unitSystem: 'imperial-us',

  distance: 0,
  isRoundTrip: false,

  vehicleMode: 'pick',
  pickedVehicle: null,
  customEff: 0,
  // Saved vehicles for quick selection. Most-recently-loaded sits at index 0.
  savedVehicles: [],

  fuelType: 'regular',
  price: 0,
  priceTouched: false,
  chartRange: '6m',
  tollsTouched: false,
  // ISO local datetime string ("2026-05-04T17:00") for the planned departure.
  // Drives the traffic-time-of-day multiplier on displayed route durations.
  departAt: null,
  // When true, weather conditions don't affect the fuel calculation. The
  // weather card still displays them for reference.
  ignoreWeather: false,
  // User-saved routes for one-tap recall. Each entry: { id, name, origin, dest, stops, savedAt }
  savedRoutes: [],
  // Current Open-Meteo reading for the active route's midpoint. Doesn't persist —
  // re-fetched whenever a new route is computed.
  routeWeather: null,

  cityMixPct: 45,
  drivingStyle: 'normal',
  conditions: { ac: false, roofRack: false, towing: false, mountainous: false, cold: false, poorRoads: false },

  passengers: 1,
  tankSize: 0,
  tolls: 0,

  compareEnabled: false,
  cmpVehicleMode: 'pick',
  cmpPickedVehicle: null,
  cmpCustomEff: 0,

  theme: 'dark',
};

// In-memory cache of API responses.
const cache = { years: null, makes: {}, models: {}, options: {}, vehicles: {} };

// Holds combobox instances after they're created.
const combos = {
  country: null, province: null,
  year: null, make: null, model: null, trim: null,
  cmpYear: null, cmpMake: null, cmpModel: null, cmpTrim: null,
};

/* =========================
   BODY-CLASS ICON MAPPING
   ========================= */
function bodyClassIcon(vClassRaw) {
  if (!vClassRaw) return '🚗';
  const v = String(vClassRaw).toLowerCase();
  if (v.includes('two seater')) return '🏎️';
  if (v.includes('sport utility') || v.includes(' suv')) return '🚙';
  if (v.includes('pickup') || v.includes('truck')) return '🛻';
  if (v.includes('minivan') || v.includes('van')) return '🚐';
  if (v.includes('special')) return '🚐';
  if (v.includes('motorcycle')) return '🏍️';
  return '🚗'; // compact, midsize, large, etc.
}

/* =========================
   SEARCHABLE COMBOBOX
   ========================= */
function createCombo(rootEl, config = {}) {
  if (!rootEl) return null;
  let placeholder = config.placeholder || '— select —';
  const searchPlaceholder = config.searchPlaceholder || 'Search…';

  rootEl.innerHTML = `
    <button class="combo-trigger" type="button" aria-haspopup="listbox" aria-expanded="false">
      <span class="combo-value empty"></span>
      <span class="combo-caret"></span>
    </button>
    <div class="combo-panel" hidden>
      <input class="combo-search" type="text" placeholder="${searchPlaceholder}" aria-label="Search">
      <ul class="combo-list" role="listbox"></ul>
      <div class="combo-empty" hidden>No matches</div>
    </div>
  `;
  const trigger = rootEl.querySelector('.combo-trigger');
  const valueEl = rootEl.querySelector('.combo-value');
  const panel = rootEl.querySelector('.combo-panel');
  const search = rootEl.querySelector('.combo-search');
  const listEl = rootEl.querySelector('.combo-list');
  const emptyEl = rootEl.querySelector('.combo-empty');

  let options = [];
  let value = null;
  let label = '';
  let icon = '';
  let activeIndex = -1;
  let isOpen = false;
  let suppressChange = false;

  function setEmpty() {
    valueEl.textContent = placeholder;
    valueEl.classList.add('empty');
  }
  setEmpty();

  function findOption(v) { return options.find(o => o.value === v); }
  function visibleItems() {
    const q = search.value.trim().toLowerCase();
    if (!q) return options.slice();
    return options.filter(o => (o.label + ' ' + (o.search || '')).toLowerCase().includes(q));
  }

  function renderList() {
    const items = visibleItems();
    listEl.innerHTML = '';
    if (items.length === 0) { emptyEl.hidden = false; return; }
    emptyEl.hidden = true;
    items.forEach((it, i) => {
      const li = document.createElement('li');
      li.className = 'combo-item';
      li.role = 'option';
      if (it.value === value) li.classList.add('selected');
      if (i === activeIndex) li.classList.add('active');
      if (it.icon) {
        const ic = document.createElement('span');
        ic.className = 'combo-item-icon'; ic.textContent = it.icon;
        li.appendChild(ic);
      }
      const text = document.createElement('span');
      text.textContent = it.label;
      li.appendChild(text);
      li.addEventListener('mousedown', (e) => { e.preventDefault(); pick(it.value); });
      li.addEventListener('mouseenter', () => {
        activeIndex = i;
        listEl.querySelectorAll('.combo-item.active').forEach(x => x.classList.remove('active'));
        li.classList.add('active');
      });
      listEl.appendChild(li);
    });
    // Scroll active into view
    const active = listEl.querySelector('.combo-item.active');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  function open() {
    if (isOpen || trigger.disabled) return;
    isOpen = true;
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    search.value = '';
    activeIndex = options.findIndex(o => o.value === value);
    if (activeIndex < 0) activeIndex = 0;
    renderList();
    setTimeout(() => search.focus(), 0);
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  }
  function pick(v) {
    setValue(v, false);
    close();
    if (!suppressChange) config.onChange?.(value, label);
  }
  function setValue(v, silent = true) {
    value = v;
    const opt = findOption(v);
    if (opt) {
      label = opt.label;
      icon = opt.icon || '';
      if (icon) {
        valueEl.innerHTML = `<span class="combo-value-icon">${icon}</span><span>${escapeHtml(label)}</span>`;
      } else {
        valueEl.textContent = label;
      }
      valueEl.classList.remove('empty');
    } else {
      label = '';
      icon = '';
      setEmpty();
    }
    if (!silent && !suppressChange) config.onChange?.(value, label);
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  trigger.addEventListener('click', () => isOpen ? close() : open());
  search.addEventListener('input', () => { activeIndex = 0; renderList(); });
  search.addEventListener('keydown', (e) => {
    const items = visibleItems();
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex = Math.min(items.length - 1, activeIndex + 1); renderList(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex = Math.max(0, activeIndex - 1); renderList(); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const it = items[activeIndex];
      if (it) pick(it.value);
    }
    else if (e.key === 'Escape') { e.preventDefault(); close(); trigger.focus(); }
  });
  document.addEventListener('mousedown', (e) => {
    if (!rootEl.contains(e.target) && isOpen) close();
  });

  return {
    el: rootEl,
    setOptions(items) {
      options = (items || []).map(it => typeof it === 'string'
        ? { value: it, label: it }
        : { value: String(it.value), label: String(it.label), icon: it.icon, search: it.search });
      // Refresh display in case current value's label changed
      if (value != null) {
        const opt = findOption(value);
        if (opt) setValue(value, true);
        else { value = null; setEmpty(); }
      }
      if (isOpen) renderList();
    },
    setValue(v, fire = false) {
      if (fire) {
        suppressChange = false;
        setValue(v, false);
      } else {
        suppressChange = true;
        setValue(v, true);
        suppressChange = false;
      }
    },
    getValue() { return value; },
    getLabel() { return label; },
    setDisabled(d) { trigger.disabled = !!d; },
    setLoading(loading, txt = 'Loading…') {
      if (loading) {
        valueEl.textContent = txt;
        valueEl.classList.add('empty');
        trigger.disabled = true;
      } else {
        if (value == null) setEmpty();
        trigger.disabled = false;
      }
    },
    clear() {
      options = []; value = null; label = ''; icon = '';
      setEmpty();
      if (isOpen) renderList();
    },
    // Update the trigger's empty-state text. Used by initPickers so the chained
    // dropdowns stop saying "Pick year first" once the user picks a year, etc.
    setPlaceholder(p) {
      placeholder = p || '— select —';
      if (value == null) setEmpty();
    },
    open, close,
  };
}

/* =========================
   UTILS
   ========================= */
const $ = (id) => document.getElementById(id);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function fmtNumber(n, digits = 2) {
  if (!isFinite(n)) return '—';
  return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function moneyDigits(currency) {
  if (currency === 'JPY' || currency === 'KRW') return 0;
  return 2;
}
function priceDigits(currency) {
  if (currency === 'JPY' || currency === 'KRW') return 0;
  if (currency === 'INR') return 2;
  if (currency === 'USD') return 2;
  return 3;
}
function fmtMoney(n, symbol, currency, digits) {
  if (!isFinite(n)) return '—';
  const d = digits != null ? digits : moneyDigits(currency);
  const v = n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  return `${symbol}${v} ${currency}`;
}

/* ----- conversions: distance ----- */
function toKm(value, fromUnit) {
  if (fromUnit === 'mile') return value * KM_PER_MILE;
  return value;
}
function fromKm(km, toUnit) {
  if (toUnit === 'mile') return km * MILE_PER_KM;
  return km;
}

/* ----- conversions: efficiency (canonical = L/100km) ----- */
function toL100km(value, fromUnit) {
  if (!value || value <= 0) return 0;
  if (fromUnit === 'mpg-us') return 235.215 / value;
  if (fromUnit === 'mpg-uk') return 282.481 / value;
  if (fromUnit === 'kmpl')   return 100 / value;
  return value; // l100km
}
function fromL100km(l100km, toUnit) {
  if (!l100km || l100km <= 0) return 0;
  if (toUnit === 'mpg-us') return 235.215 / l100km;
  if (toUnit === 'mpg-uk') return 282.481 / l100km;
  if (toUnit === 'kmpl')   return 100 / l100km;
  return l100km;
}

/* ----- conversions: volume (canonical = litre) ----- */
function toLitre(value, fromUnit) {
  if (fromUnit === 'gallon-us') return value * L_PER_GAL_US;
  if (fromUnit === 'gallon-uk') return value * L_PER_GAL_UK;
  return value;
}
function fromLitre(litres, toUnit) {
  if (toUnit === 'gallon-us') return litres / L_PER_GAL_US;
  if (toUnit === 'gallon-uk') return litres / L_PER_GAL_UK;
  return litres;
}

/* ----- conversions: price (canonical = $/litre) ----- */
function pricePerLToDisplay(perLitre, displayVolUnit) {
  if (displayVolUnit === 'gallon-us') return perLitre * L_PER_GAL_US;
  if (displayVolUnit === 'gallon-uk') return perLitre * L_PER_GAL_UK;
  return perLitre;
}
function priceDisplayToPerL(perDisplay, displayVolUnit) {
  if (displayVolUnit === 'gallon-us') return perDisplay / L_PER_GAL_US;
  if (displayVolUnit === 'gallon-uk') return perDisplay / L_PER_GAL_UK;
  return perDisplay;
}

/* =========================
   PERSISTENCE
   ========================= */
const LS_KEY = 'gtcc-state-v1';
const STATION_PRICES_KEY = 'gtcc-station-prices-v1';

/* Per-station price memory: when a user "Use this price" applies a price to the calculator
 * we also persist it locally indexed by OSM station ID, so the next time they open that
 * popup we can show "Last reported: $X.XX · 2h ago". Crowdsourced GasBuddy-style data
 * isn't available without a backend or paid partnership. */
function loadStationPrices() {
  try { return JSON.parse(localStorage.getItem(STATION_PRICES_KEY) || '{}'); }
  catch { return {}; }
}
function saveStationPriceReport(stationId, price, currency, volLabel, sym) {
  if (!stationId) return;
  const all = loadStationPrices();
  all[stationId] = { price, currency, volLabel, sym, timestamp: Date.now() };
  try { localStorage.setItem(STATION_PRICES_KEY, JSON.stringify(all)); } catch {}
}
function getStationPriceReport(stationId) {
  const all = loadStationPrices();
  return all[stationId] || null;
}
function relativeAge(ms) {
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return `${Math.floor(day / 30)}mo ago`;
}
function saveState() {
  try {
    const slim = {
      country: state.country, region: state.region, unitSystem: state.unitSystem,
      vehicleMode: state.vehicleMode, customEff: state.customEff,
      pickedVehicle: state.pickedVehicle,
      savedVehicles: state.savedVehicles,
      fuelType: state.fuelType, priceTouched: state.priceTouched, price: state.price,
      cityMixPct: state.cityMixPct, drivingStyle: state.drivingStyle,
      conditions: state.conditions,
      passengers: state.passengers, tankSize: state.tankSize,
      tolls: state.tolls, tollsTouched: state.tollsTouched,
      chartRange: state.chartRange,
      departAt: state.departAt,
      ignoreWeather: state.ignoreWeather,
      savedRoutes: state.savedRoutes,
      isRoundTrip: state.isRoundTrip, theme: state.theme,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(slim));
  } catch (e) { /* quota or private mode */ }
}
function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    Object.assign(state, JSON.parse(raw));
    // Defensive normalization — older saves may have null where we now expect
    // arrays, or partial objects that crash code paths added later.
    if (!Array.isArray(state.savedVehicles)) state.savedVehicles = [];
    if (!Array.isArray(state.savedRoutes))   state.savedRoutes   = [];
    if (state.conditions == null || typeof state.conditions !== 'object') {
      state.conditions = { ac: false, roofRack: false, towing: false, mountainous: false, cold: false, poorRoads: false };
    }
  } catch (e) { /* ignore */ }
}

/* =========================
   COUNTRY / REGION HELPERS
   ========================= */
function getCountry(code) {
  return COUNTRIES.find(c => c.code === code) || COUNTRIES.find(c => c.code === 'OTHER');
}
// Maps a US state postal code to whichever GAS_DEFAULTS key best represents it:
// either the state itself (when EIA publishes per-state data) or its PADD region.
const US_STATE_REGION_KEY = {
  // States with direct EIA data
  CA: 'US_CA', CO: 'US_CO', FL: 'US_FL', MA: 'US_MA', MN: 'US_MN',
  NY: 'US_NY', OH: 'US_OH', TX: 'US_TX', WA: 'US_WA',
  // PADD1A — New England
  ME: 'US_PADD1A', NH: 'US_PADD1A', VT: 'US_PADD1A', CT: 'US_PADD1A', RI: 'US_PADD1A',
  // PADD1B — Central Atlantic
  NJ: 'US_PADD1B', PA: 'US_PADD1B', DE: 'US_PADD1B', MD: 'US_PADD1B', DC: 'US_PADD1B',
  // PADD1C — Lower Atlantic
  VA: 'US_PADD1C', NC: 'US_PADD1C', SC: 'US_PADD1C', GA: 'US_PADD1C', WV: 'US_PADD1C',
  // PADD2 — Midwest
  MI: 'US_PADD2', IN: 'US_PADD2', IL: 'US_PADD2', WI: 'US_PADD2', IA: 'US_PADD2',
  MO: 'US_PADD2', ND: 'US_PADD2', SD: 'US_PADD2', NE: 'US_PADD2', KS: 'US_PADD2',
  KY: 'US_PADD2', TN: 'US_PADD2',
  // PADD3 — Gulf Coast
  LA: 'US_PADD3', AR: 'US_PADD3', MS: 'US_PADD3', AL: 'US_PADD3', OK: 'US_PADD3', NM: 'US_PADD3',
  // PADD4 — Rocky Mountain
  MT: 'US_PADD4', ID: 'US_PADD4', WY: 'US_PADD4', UT: 'US_PADD4',
  // PADD5 — West Coast
  OR: 'US_PADD5', NV: 'US_PADD5', AZ: 'US_PADD5', AK: 'US_PADD5', HI: 'US_PADD5',
};

function gasDefaultFor(country, region) {
  if (country === 'CA' && region) return GAS_DEFAULTS[`CA_${region}`] || GAS_DEFAULTS.CA;
  if (country === 'US' && region) {
    const key = US_STATE_REGION_KEY[region];
    if (key && GAS_DEFAULTS[key]) return GAS_DEFAULTS[key];
  }
  return GAS_DEFAULTS[country] || GAS_DEFAULTS.OTHER;
}

// Loads the daily-refreshed data/prices.json (when served over http/https) and
// overlays it on GAS_DEFAULTS. If the fetch fails (offline, file:// origin, 404)
// we silently keep the hardcoded fallback values — the app keeps working either way.
async function loadPrices() {
  try {
    const res = await fetch('data/prices.json', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const { _meta, ...prices } = data;
    Object.assign(GAS_DEFAULTS, prices);
    if (!state.priceTouched) renderGasPrice();
  } catch { /* keep fallback */ }
}
function priceUnitFor(country) { return getCountry(country).priceUnit; }

/* =========================
   GEOLOCATION
   ========================= */
async function detectByIp() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) throw new Error('ipapi failed');
    const data = await res.json();
    return {
      country: data.country_code || null,
      region: data.region_code || null,
      city: data.city || null,
      lat: typeof data.latitude === 'number' ? data.latitude : null,
      lng: typeof data.longitude === 'number' ? data.longitude : null,
      source: 'ip',
    };
  } catch (e) {
    return null;
  }
}

async function detectLocation() {
  state.detected.status = 'detecting';
  renderLocation();

  // Try IP first — faster, no permission prompt. Browser geolocation could be added later.
  const ipInfo = await detectByIp();
  if (ipInfo && ipInfo.country) {
    state.detected = { ...ipInfo, status: 'ok' };
    return ipInfo;
  }
  state.detected.status = 'failed';
  return null;
}

/* =========================
   FUELECONOMY.GOV API
   ========================= */
const FEG_BASE = 'https://www.fueleconomy.gov/ws/rest';

async function fegFetch(path) {
  const url = `${FEG_BASE}${path}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const text = await res.text();
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return JSON.parse(trimmed);
  }
  // XML fallback
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  return xmlToObject(doc.documentElement);
}

function xmlToObject(node) {
  const result = {};
  for (const child of Array.from(node.children)) {
    const name = child.tagName;
    const value = child.children.length > 0
      ? xmlToObject(child)
      : (child.textContent || '').trim();
    if (result[name] !== undefined) {
      if (!Array.isArray(result[name])) result[name] = [result[name]];
      result[name].push(value);
    } else {
      result[name] = value;
    }
  }
  return result;
}

function normalizeMenu(data) {
  let items = data?.menuItem ?? data?.menuItems?.menuItem ?? [];
  if (!Array.isArray(items)) items = items ? [items] : [];
  return items.map(it => ({ text: String(it.text ?? ''), value: String(it.value ?? '') }));
}

async function fegYears() {
  if (cache.years) return cache.years;
  const data = await fegFetch('/vehicle/menu/year');
  cache.years = normalizeMenu(data).map(i => i.value).filter(Boolean);
  return cache.years;
}
async function fegMakes(year) {
  if (cache.makes[year]) return cache.makes[year];
  const data = await fegFetch(`/vehicle/menu/make?year=${encodeURIComponent(year)}`);
  cache.makes[year] = normalizeMenu(data).map(i => i.value).filter(Boolean);
  return cache.makes[year];
}
async function fegModels(year, make) {
  const key = `${year}|${make}`;
  if (cache.models[key]) return cache.models[key];
  const data = await fegFetch(`/vehicle/menu/model?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}`);
  cache.models[key] = normalizeMenu(data).map(i => i.value).filter(Boolean);
  return cache.models[key];
}
async function fegOptions(year, make, model) {
  const key = `${year}|${make}|${model}`;
  if (cache.options[key]) return cache.options[key];
  const data = await fegFetch(`/vehicle/menu/options?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`);
  cache.options[key] = normalizeMenu(data);
  return cache.options[key];
}
async function fegVehicle(id) {
  if (cache.vehicles[id]) return cache.vehicles[id];
  const data = await fegFetch(`/vehicle/${encodeURIComponent(id)}`);
  cache.vehicles[id] = data;
  return data;
}

/* =========================
   CALCULATION
   ========================= */
function effectiveL100km(vehicle, customEffDisplay, vehicleMode, cityMixPct) {
  // Returns base L/100km BEFORE style/condition adjustments.
  if (vehicleMode === 'custom') {
    if (!customEffDisplay || customEffDisplay <= 0) return 0;
    const us = UNIT_SYSTEMS[state.unitSystem];
    return toL100km(customEffDisplay, us.efficiency);
  }
  if (!vehicle) return 0;
  const cityMpg = parseFloat(vehicle.city08) || 0;
  const hwyMpg = parseFloat(vehicle.highway08) || 0;
  const combMpg = parseFloat(vehicle.comb08) || 0;
  if (cityMpg > 0 && hwyMpg > 0) {
    const cityFrac = clamp(cityMixPct / 100, 0, 1);
    const hwyFrac = 1 - cityFrac;
    const cityL = 235.215 / cityMpg;
    const hwyL = 235.215 / hwyMpg;
    return cityL * cityFrac + hwyL * hwyFrac;
  }
  if (combMpg > 0) return 235.215 / combMpg;
  return 0;
}

function applyAdjustments(baseL100km, style, conditions, weatherMult) {
  if (!baseL100km) return 0;
  const styleMult = STYLE_FUEL_MULT[style] ?? 1.0;
  let extra = 0;
  for (const [k, on] of Object.entries(conditions)) {
    if (on) extra += CONDITION_PENALTY[k] || 0;
  }
  const wMult = isFinite(weatherMult) && weatherMult > 0 ? weatherMult : 1.0;
  return baseL100km * styleMult * (1 + extra) * wMult;
}

// Compute a fuel-consumption multiplier from current weather along the route.
// Calibrated to DOE/AAA published cold-weather and headwind ranges:
//   - 32°F (0°C): -10 to -15% economy → +12-18% consumption
//   - 0°F (-18°C): -22 to -33% economy → +28-50% consumption
//   - -40°F (-40°C): -40 to -50% economy → +66-100% consumption
//   - 25 mph (40 km/h) headwind: +10% consumption
//   - Light snow: +10-15%, heavy snow / blizzard: +20-30%
// Used multiplicatively on top of the user's manual condition checkboxes —
// expect some compounding; that's intentional.
function weatherFuelMultiplier(w) {
  if (!w) return 1.0;
  let m = 1.0;

  // Temperature: smooth ramp at extremes since cold-start losses compound.
  const t = w.tempC;
  if (isFinite(t)) {
    if      (t <= -35) m += 0.50; // arctic
    else if (t <= -25) m += 0.35;
    else if (t <= -15) m += 0.22;
    else if (t <=  -5) m += 0.14;
    else if (t <=   5) m += 0.07;
    else if (t <=  12) m += 0.03;
    // 12-28°C is the ideal band — no adjustment.
    else if (t >=  38) m += 0.08; // extreme heat: AC max + thermal stress
    else if (t >=  32) m += 0.04;
    else if (t >=  28) m += 0.02;
  }

  // Precipitation (WMO weather codes)
  const wc = w.weatherCode ?? 0;
  if      (wc >= 75 && wc <= 77) m += 0.22; // heavy snow / ice pellets
  else if (wc >= 71 && wc <= 74) m += 0.13; // moderate snow
  else if (wc >= 85 && wc <= 86) m += 0.11; // snow showers
  else if (wc >= 95 && wc <= 99) m += 0.08; // thunderstorm
  else if (wc >= 80 && wc <= 82) m += 0.06; // rain showers
  else if (wc >= 61 && wc <= 67) m += 0.04; // rain
  else if (wc >= 51 && wc <= 57) m += 0.02; // drizzle
  else if (wc >= 45 && wc <= 48) m += 0.02; // fog (slower speeds)

  // Wind: assumes the trip averages to roughly half-headwind exposure.
  const wk = w.windKmh;
  if (isFinite(wk)) {
    if      (wk >= 70) m += 0.15;
    else if (wk >= 50) m += 0.09;
    else if (wk >= 35) m += 0.05;
    else if (wk >= 25) m += 0.03;
  }

  return m;
}

// Friendly text for a WMO weather code + emoji.
function describeWeatherCode(wc) {
  if (wc === 0) return ['☀️', 'clear'];
  if (wc <= 3)                  return ['⛅', 'partly cloudy'];
  if (wc >= 45 && wc <= 48)     return ['🌫️', 'fog'];
  if (wc >= 51 && wc <= 57)     return ['🌦️', 'drizzle'];
  if (wc >= 61 && wc <= 67)     return ['🌧️', 'rain'];
  if (wc >= 71 && wc <= 77)     return ['❄️', 'snow'];
  if (wc >= 80 && wc <= 82)     return ['🌧️', 'rain showers'];
  if (wc >= 85 && wc <= 86)     return ['🌨️', 'snow showers'];
  if (wc >= 95)                 return ['⛈️', 'thunderstorm'];
  return ['🌥️', 'overcast'];
}

// Open-Meteo is free, key-less, and CORS-friendly. Samples weather at three
// points along the route (Start / Mid / End). If the user has set a departure
// more than an hour in the future, we pull the HOURLY FORECAST closest to
// the planned arrival time at each sample; otherwise we use current conditions.
//
// For the trip arrival time at each sample, we estimate by interpolating the
// route's free-flow duration: start = departAt, end = departAt + duration,
// mid = departAt + duration/2. Crude but better than using a single instant.
//
// Returns { samples: [{label, lat, lon, tempC, ..., forecast, forTime}], midpoint }.
async function fetchRouteWeather(route) {
  const coords = route?.coords;
  if (!coords || coords.length < 2) return null;

  const departTs = state.departAt ? new Date(state.departAt).getTime() : NaN;
  const useForecast = isFinite(departTs) && departTs > Date.now() + 60 * 60 * 1000;
  // Open-Meteo's free hourly forecast goes 16 days out — anything beyond that
  // falls back to current weather (still better than nothing).
  const horizonMs = 16 * 24 * 60 * 60 * 1000;
  const inHorizon = useForecast && (departTs - Date.now() < horizonMs);
  // Estimated free-flow duration (seconds). Mid sample lands at midpoint of trip.
  const tripDurMs = (route.duration ?? 0) * 1000;

  const sampleAt = [
    { label: 'Start', i: 0,                                  fracTime: 0 },
    { label: 'Mid',   i: Math.floor(coords.length / 2),      fracTime: 0.5 },
    { label: 'End',   i: coords.length - 1,                  fracTime: 1 },
  ];

  const fetchOne = async ({ label, i, fracTime }) => {
    const [lon, lat] = coords[i];
    if (inHorizon) {
      const targetMs = departTs + tripDurMs * fracTime;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&hourly=temperature_2m,precipitation,wind_speed_10m,weather_code&wind_speed_unit=kmh&forecast_days=16`;
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        const times = data.hourly?.time || [];
        if (times.length === 0) return null;
        let bestIdx = 0, bestDiff = Infinity;
        for (let k = 0; k < times.length; k++) {
          const tMs = new Date(times[k]).getTime();
          const diff = Math.abs(tMs - targetMs);
          if (diff < bestDiff) { bestDiff = diff; bestIdx = k; }
        }
        return {
          label, lat, lon,
          forecast: true,
          forTime: times[bestIdx],
          tempC: data.hourly.temperature_2m?.[bestIdx],
          precip: data.hourly.precipitation?.[bestIdx],
          windKmh: data.hourly.wind_speed_10m?.[bestIdx],
          weatherCode: data.hourly.weather_code?.[bestIdx],
        };
      } catch { return null; }
    }
    // Current weather path (default — no departure time, or it's now/past, or beyond 16d horizon).
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&current=temperature_2m,precipitation,wind_speed_10m,weather_code&wind_speed_unit=kmh`;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const c = data.current || {};
      return {
        label, lat, lon,
        forecast: false,
        forTime: null,
        tempC: c.temperature_2m,
        precip: c.precipitation,
        windKmh: c.wind_speed_10m,
        weatherCode: c.weather_code,
      };
    } catch { return null; }
  };

  const samples = (await Promise.all(sampleAt.map(fetchOne))).filter(Boolean);
  if (samples.length === 0) return null;
  const midpoint = samples.find(s => s.label === 'Mid') || samples[Math.floor(samples.length / 2)];
  return { samples, midpoint };
}

function totalDistanceKm() {
  const us = UNIT_SYSTEMS[state.unitSystem];
  let total = toKm(state.distance || 0, us.distance);
  if (state.isRoundTrip) total *= 2;
  return total;
}

function calculate() {
  const us = UNIT_SYSTEMS[state.unitSystem];
  const country = getCountry(state.country);
  const distanceKm = totalDistanceKm();

  // Primary vehicle
  const baseL = effectiveL100km(state.pickedVehicle, state.customEff, state.vehicleMode, state.cityMixPct);
  const wMult = state.ignoreWeather ? 1.0 : weatherFuelMultiplier(state.routeWeather);
  const adjL = applyAdjustments(baseL, state.drivingStyle, state.conditions, wMult);

  // Price (always normalized to $/L canonical)
  const priceCanonical = priceDisplayToPerL(state.price || 0, us.volume);

  const fuelLitres = adjL > 0 ? (adjL * distanceKm) / 100 : 0;
  const totalCost = fuelLitres * priceCanonical;
  const passengers = Math.max(1, state.passengers || 1);
  const perPerson = totalCost / passengers;
  // One-way cost — useful for round trips so users can see what each leg costs.
  const oneWayCost = state.isRoundTrip ? totalCost / 2 : totalCost;
  const tolls = state.tolls || 0;
  const grandTotal = totalCost + tolls;

  // Comparison vehicle
  let comparison = null;
  if (state.compareEnabled) {
    const cmpBaseL = effectiveL100km(state.cmpPickedVehicle, state.cmpCustomEff, state.cmpVehicleMode, state.cityMixPct);
    const cmpAdjL = applyAdjustments(cmpBaseL, state.drivingStyle, state.conditions);
    if (cmpAdjL > 0 && distanceKm > 0) {
      const cmpFuelL = (cmpAdjL * distanceKm) / 100;
      const cmpCost = cmpFuelL * priceCanonical;
      comparison = {
        baseL: cmpBaseL, adjL: cmpAdjL,
        fuelL: cmpFuelL, cost: cmpCost,
        savings: totalCost - cmpCost,
        label: cmpVehicleLabel(),
      };
    }
  }

  // Fill-ups
  let fillups = null;
  if (state.tankSize > 0 && fuelLitres > 0) {
    const tankLitres = toLitre(state.tankSize, us.volume);
    fillups = fuelLitres / tankLitres;
  }

  return {
    distanceKm, baseL, adjL, fuelLitres, totalCost, oneWayCost,
    perPerson, grandTotal, tolls,
    fillups, passengers, country, us, priceCanonical, comparison,
  };
}

/* =========================
   RENDER
   ========================= */
function render() {
  renderLocation();
  renderUnits();
  renderCountrySelect();
  renderProvinceSelect();
  renderDistance();
  renderVehicleMode();
  renderPresets();
  renderGasPrice();
  renderConditions();
  renderExtras();
  renderCompare();
  renderResults();
  saveState();
}

function renderLocation() {
  const el = $('locationText');
  const d = state.detected;
  if (d.status === 'detecting') el.textContent = 'Detecting…';
  else if (d.status === 'ok') {
    const country = getCountry(d.country);
    const bits = [];
    if (d.city) bits.push(d.city);
    if (d.region && d.country !== 'US') bits.push(d.region);
    bits.push(country.name);
    el.textContent = bits.join(', ');
  } else {
    el.textContent = 'Set manually';
  }
}

function renderCountrySelect() {
  if (combos.country) combos.country.setValue(state.country);
  $('provinceWrap').hidden = state.country !== 'CA';
}

function renderProvinceSelect() {
  if (combos.province) combos.province.setValue(state.region || '');
}

function renderUnits() {
  for (const btn of $$('.unit-card .seg-btn')) {
    btn.classList.toggle('active', btn.dataset.unit === state.unitSystem);
  }
  const us = UNIT_SYSTEMS[state.unitSystem];
  $('distanceLabel').textContent = `Distance (${us.distLabel})`;
  $('customEffLabel').textContent = `Fuel efficiency (${us.effLabel})`;
  $('cmpCustomEffLabel').textContent = `Fuel efficiency (${us.effLabel})`;
  $('priceLabel').textContent = `Price (${getCountry(state.country).symbol}/${us.volLabel})`;
  $('tankLabel').innerHTML = `Tank size (${us.volLabel}) <small>optional</small>`;
  $('perDistanceUnit').textContent = us.distLabel;

  const sym = getCountry(state.country).symbol;
  $('currencyPrefix').textContent = sym;
  $('tollPrefix').textContent = sym;
}

function renderDistance() {
  const inp = $('distanceInput');
  if (document.activeElement !== inp) {
    inp.value = state.distance ? String(state.distance) : '';
  }
  $('roundTripChk').checked = state.isRoundTrip;
  updateDistanceHint();
}

function updateDistanceHint() {
  const us = UNIT_SYSTEMS[state.unitSystem];
  const totalDisp = fromKm(totalDistanceKm(), us.distance);
  const oneWayKm = totalDistanceKm() / (state.isRoundTrip ? 2 : 1);
  const oneWayDisp = fromKm(oneWayKm, us.distance);
  const hint = $('distanceHint');
  if (!hint) return;
  if (state.distance > 0) {
    hint.textContent = state.isRoundTrip
      ? `Round trip: ${fmtNumber(totalDisp, 1)} ${us.distLabel} (one way ${fmtNumber(oneWayDisp, 1)} ${us.distLabel})`
      : `One way: ${fmtNumber(totalDisp, 1)} ${us.distLabel}`;
  } else {
    hint.textContent = 'Tip: use Google Maps for an exact distance.';
  }
}

// Interpolates a hex color between waypoint-start (A) and waypoint-end (B) at
// position `pos` out of `total` segments. pos=0 → A's color, pos=total → B's.
// Reads the actual CSS variables so it works in both dark and light themes.
function waypointGradientColor(pos, total) {
  const styles = getComputedStyle(document.documentElement);
  const a = hexToRgb(styles.getPropertyValue('--waypoint-start').trim() || '#34D399');
  const b = hexToRgb(styles.getPropertyValue('--waypoint-end').trim()   || '#A855F7');
  const t = total <= 0 ? 0 : Math.max(0, Math.min(1, pos / total));
  return rgbToHex(
    Math.round(a.r + (b.r - a.r) * t),
    Math.round(a.g + (b.g - a.g) * t),
    Math.round(a.b + (b.b - a.b) * t),
  );
}
function hexToRgb(hex) {
  const m = String(hex).trim().match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}
function rgbToHex(r, g, b) {
  const h = n => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

function renderStops() {
  const list = $('stopsList');
  if (!list) return;
  list.innerHTML = '';
  map.stops.forEach((stop, idx) => {
    const div = document.createElement('div');
    div.className = 'waypoint';
    // idx+1 within (stops.length+1) segments, where 0=A and stops.length+1=B
    const stopColor = waypointGradientColor(idx + 1, map.stops.length + 1);
    div.innerHTML = `
      <span class="wp-marker wp-marker-stop" title="Stop ${idx + 1}" style="border-color:${stopColor};color:${stopColor}">${idx + 1}</span>
      <div class="field autocomplete-wrap wp-input-wrap">
        <input type="text" class="input stop-input" placeholder="Stop ${idx + 1}" autocomplete="off" spellcheck="false">
        <div class="autocomplete-dropdown" hidden></div>
      </div>
      <button type="button" class="wp-remove" title="Remove stop">×</button>
    `;
    list.appendChild(div);

    const inp = div.querySelector('.stop-input');
    const dropdown = div.querySelector('.autocomplete-dropdown');
    const removeBtn = div.querySelector('.wp-remove');

    inp.value = stop.label || '';

    attachAddressAutocomplete(inp, dropdown, (coords) => {
      if (coords) {
        map.stops[idx] = coords;
      } else if (map.stops[idx]) {
        // User cleared — null out coords; re-geocode at calc time
        map.stops[idx] = { lat: null, lon: null, label: inp.value };
      }
    });

    removeBtn.addEventListener('click', () => {
      map.stops.splice(idx, 1);
      renderStops();
      if (map.routes.length > 0 && map.origin && map.dest) handleDistanceLookup();
    });
  });
}

function renderVehicleMode() {
  for (const btn of $$('.card .seg-btn[data-mode]')) {
    btn.classList.toggle('active', btn.dataset.mode === state.vehicleMode);
  }
  $('pickPanel').classList.toggle('hidden', state.vehicleMode !== 'pick');
  $('customPanel').classList.toggle('hidden', state.vehicleMode !== 'custom');
  // Custom efficiency input
  const inp = $('customEffInput');
  if (document.activeElement !== inp) {
    inp.value = state.customEff ? String(state.customEff) : '';
  }
  renderSavedVehicles();
}

/* =========================
   SAVED VEHICLES
   ========================= */
const SAVED_VEHICLES_CAP = 6;

// Re-render the Quick-select chip row from state.savedVehicles. Hides the
// whole row when the user has nothing saved yet, so the picker doesn't waste
// vertical space with an empty placeholder.
function renderSavedVehicles() {
  const row = $('savedCarsRow');
  const list = $('savedCarsList');
  const saveBtn = $('saveCarBtn');
  if (!row || !list) return;

  const vehicles = Array.isArray(state.savedVehicles) ? state.savedVehicles : [];
  if (vehicles.length === 0) {
    row.hidden = true;
    list.innerHTML = '';
  } else {
    row.hidden = false;
    list.innerHTML = vehicles.map(v => {
      const isActive = state.pickedVehicle?.id === v.id;
      return `
        <div class="saved-car-chip${isActive ? ' active' : ''}">
          <button type="button" class="saved-car-load" data-id="${escapeHtml(String(v.id))}" title="Load this car">
            <span class="saved-car-yr">${escapeHtml(String(v.year ?? ''))}</span>
            <span class="saved-car-name">${escapeHtml(String(v.make ?? ''))} ${escapeHtml(String(v.model ?? ''))}</span>
          </button>
          <button type="button" class="saved-car-remove" data-id="${escapeHtml(String(v.id))}" title="Remove from quick-select" aria-label="Remove">×</button>
        </div>
      `;
    }).join('');
    list.querySelectorAll('.saved-car-load').forEach(btn => {
      btn.addEventListener('click', () => loadSavedVehicle(btn.dataset.id));
    });
    list.querySelectorAll('.saved-car-remove').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        removeSavedVehicle(btn.dataset.id);
      });
    });
  }

  // Save button enabled only when a vehicle is loaded that isn't already saved.
  if (saveBtn) {
    const v = state.pickedVehicle;
    const alreadySaved = !!(v?.id && vehicles.some(s => String(s.id) === String(v.id)));
    saveBtn.disabled = !v?.id || alreadySaved;
    saveBtn.title = !v?.id
      ? 'Pick a complete car first (year + make + model + trim)'
      : alreadySaved
        ? 'Already in your quick-select list'
        : 'Save the currently selected car for one-tap selection later';
  }
}

function saveCurrentVehicle() {
  const v = state.pickedVehicle;
  if (!v?.id) { showToast('Pick a complete car first', 'error'); return; }
  const list = state.savedVehicles || [];
  if (list.some(s => String(s.id) === String(v.id))) {
    showToast('Already saved'); return;
  }
  // Newest first so users see their latest pick at the top of the row.
  state.savedVehicles = [{ ...v }, ...list].slice(0, SAVED_VEHICLES_CAP);
  saveState();
  renderSavedVehicles();
  showToast(`Saved ${v.year} ${v.make} ${v.model}`);
}

function removeSavedVehicle(id) {
  state.savedVehicles = (state.savedVehicles || []).filter(s => String(s.id) !== String(id));
  saveState();
  renderSavedVehicles();
}

// Load a saved vehicle as the active pick. Bumps it to the front of the list
// (LRU) so frequently-used cars stay visible in the quick-select row.
function loadSavedVehicle(id) {
  const v = (state.savedVehicles || []).find(s => String(s.id) === String(id));
  if (!v) return;
  state.pickedVehicle = { ...v };
  state.vehicleMode = 'pick';
  state.savedVehicles = [v, ...state.savedVehicles.filter(s => String(s.id) !== String(id))];
  // Auto-fill tank size from the loaded car's class.
  const litres = estimateTankLitres(v.vClass);
  if (litres > 0) {
    const us = UNIT_SYSTEMS[state.unitSystem];
    state.tankSize = parseFloat(fromLitre(litres, us.volume).toFixed(1));
  }
  saveState();
  render();
  update();
  showToast(`Loaded ${v.year} ${v.make} ${v.model}`);
}

function renderPresets() {
  const us = UNIT_SYSTEMS[state.unitSystem];
  const grid = $('presetsList');
  grid.innerHTML = '';
  for (const p of VEHICLE_PRESETS) {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'preset-btn';
    const baseL = 235.215 / p.mpg;
    const display = fromL100km(baseL, us.efficiency);
    btn.innerHTML = `${p.name}<span class="preset-val">${fmtNumber(display, 1)} ${us.effLabel}</span>`;
    btn.addEventListener('click', () => {
      state.vehicleMode = 'custom';
      state.customEff = parseFloat(fmtNumber(display, 1));
      // Auto-fill tank from preset's typical size.
      if (p.tankL) {
        state.tankSize = parseFloat(fromLitre(p.tankL, us.volume).toFixed(1));
      }
      render(); update();
    });
    grid.appendChild(btn);
  }
}

function renderGasPrice() {
  const inp = $('priceInput');
  if (!state.priceTouched) {
    // Pre-fill with default for current country/region
    const def = gasDefaultFor(state.country, state.region);
    const native = priceUnitFor(state.country); // 'gallon-us' or 'litre'
    const us = UNIT_SYSTEMS[state.unitSystem];
    // Default value is in country's native unit. Convert via canonical $/L if user is on a different unit system.
    const defaultRaw = def[state.fuelType] ?? def.regular ?? 0;
    const perL = priceDisplayToPerL(defaultRaw, native);
    state.price = pricePerLToDisplay(perL, us.volume);
  }
  if (document.activeElement !== inp) {
    inp.value = state.price ? state.price.toFixed(priceDigits(getCountry(state.country).currency)) : '';
  }
  // Fuel type buttons
  for (const btn of $$('.fuel-types .seg-btn')) {
    btn.classList.toggle('active', btn.dataset.fuel === state.fuelType);
  }
  // Hint
  const def = gasDefaultFor(state.country, state.region);
  const us = UNIT_SYSTEMS[state.unitSystem];
  $('priceHint').textContent = `${def.label} (${state.fuelType}, ${getCountry(state.country).symbol}/${us.volLabel})`;
  // Auto-fill notice: shown only when the price hasn't been manually edited.
  // Tells the user *where* the prefilled number came from and that they can override.
  const note = $('priceAutoNote');
  if (note) {
    note.hidden = !!state.priceTouched;
    const regionEl = $('priceAutoRegion');
    if (regionEl) regionEl.textContent = def.label;
  }
  // Smart "Find live prices nearby" link — uses detected city + region when available
  // so GasBuddy lands on a search relevant to the user instead of the generic home page.
  const finder = $('gasFinderBtn');
  if (finder) {
    const det = state.detected || {};
    const parts = [det.city, det.region, getCountry(state.country)?.name].filter(Boolean);
    finder.href = parts.length
      ? `https://www.gasbuddy.com/home?search=${encodeURIComponent(parts.join(', '))}`
      : 'https://www.gasbuddy.com/home';
  }
  renderPriceChart();
}

/* =========================
   PRICE HISTORY CHART
   ========================= */
// Range filter buttons shown above the chart. Days = how far back to keep points;
// null means everything we have. titleLabel is shown on the chart header so it
// reflects the user's selection rather than just the count of points returned.
// HISTORY_CAP=26 means 6m, 1y, and All often surface the same window of data —
// the chart header says so explicitly when that happens.
const CHART_RANGES = {
  '1w':  { days: 7,    label: '1W',  titleLabel: 'past 1 week' },
  '1m':  { days: 31,   label: '1M',  titleLabel: 'past 1 month' },
  '6m':  { days: 186,  label: '6M',  titleLabel: 'past 6 months' },
  '1y':  { days: 365,  label: '1Y',  titleLabel: 'past 1 year' },
  'all': { days: null, label: 'All', titleLabel: 'full history' },
};
const MONTH_NAMES_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Renders an inline SVG line chart of regional gas-price history for the active
// region, plus a dashed linear-regression projection 4 weeks forward. Range tabs
// (1W / 1M / 6M / 1Y / All) filter how far back we plot. X-axis switches to month
// labels when the visible span covers 2+ months. Drawn from scratch (no chart lib).
function renderPriceChart() {
  const host = $('priceChart');
  if (!host) return;
  const def = gasDefaultFor(state.country, state.region);
  const history = (def && def.history) || [];
  const usSys = UNIT_SYSTEMS[state.unitSystem];
  const country = getCountry(state.country);
  const rangeKey = CHART_RANGES[state.chartRange] ? state.chartRange : '6m';
  const range = CHART_RANGES[rangeKey];

  if (history.length < 2) {
    host.hidden = true;
    return;
  }
  host.hidden = false;

  // Convert prices into the user's display unit so the chart axis matches the input box.
  // History rows store regular (always) and diesel (where available). Mid and
  // premium aren't tracked historically, so derive them from regular using the
  // CURRENT mid/regular and premium/regular ratios — best we can do without a
  // historical mid/premium feed.
  const native = priceUnitFor(state.country);
  const fuel = state.fuelType || 'regular';
  const ratio = (def.regular > 0)
    ? { mid: def.mid / def.regular, premium: def.premium / def.regular, diesel: def.diesel / def.regular }
    : { mid: 1, premium: 1, diesel: 1 };
  const histRawValue = h => {
    if (fuel === 'regular') return h.regular;
    if (fuel === 'diesel')  return isFinite(h.diesel) ? h.diesel : h.regular * ratio.diesel;
    if (fuel === 'mid')     return isFinite(h.mid)    ? h.mid    : h.regular * ratio.mid;
    if (fuel === 'premium') return isFinite(h.premium)? h.premium: h.regular * ratio.premium;
    return h.regular;
  };
  const allPoints = history
    .filter(h => isFinite(h.regular))
    .map(h => ({
      date: h.date,
      ts: new Date(h.date).getTime(),
      value: pricePerLToDisplay(priceDisplayToPerL(histRawValue(h), native), usSys.volume),
    }))
    .sort((a, b) => a.ts - b.ts);

  // Filter by selected range, anchored on the latest data point.
  const lastTs = allPoints[allPoints.length - 1].ts;
  const cutoff = range.days ? lastTs - range.days * 86400000 : 0;
  const points = allPoints.filter(p => p.ts >= cutoff);
  const n = points.length;

  const tabsHtml = renderChartRangeTabs(rangeKey);

  if (n < 3) {
    host.innerHTML = `
      <div class="chart-header">
        <span class="chart-title">${escapeHtml(def.label)} · ${escapeHtml(fuel)} · ${escapeHtml(range.titleLabel)}</span>
      </div>
      ${tabsHtml}
      <p class="chart-empty">Only ${n} data point${n === 1 ? '' : 's'} in this window — try a longer range.</p>
    `;
    bindChartRangeHandlers(host);
    return;
  }

  // ----- TREND: computed from the VISIBLE window -----
  // The trend label on the top-right reflects what the user is currently
  // looking at: 1W view → 1-week change, 1Y view → 1-year change. Slope
  // (per week) drives the dashed projection line.
  //
  // Real gas-price forecasting needs crude-oil futures and refinery data
  // (none in any free public feed), so the projection is explicitly a
  // dampened extrapolation, not a forecast. We:
  //   - dampen the slope (50%) since linear momentum overstates near-term moves
  //   - project only 2 weeks forward (was 4) so the line doesn't wander
  //   - cap projected change at ±10% from the latest actual value to avoid
  //     ridiculous extrapolations from short, volatile windows
  const xs = points.map((_, i) => i);
  const ys = points.map(p => p.value);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const rawSlope = den === 0 ? 0 : num / den; // value per chart-step
  const slope = rawSlope * 0.5; // dampen — linear momentum exaggerates likely moves
  const projSteps = 2;
  const lastActualValue = points[n - 1].value;
  const projected = [];
  for (let i = 1; i <= projSteps; i++) {
    let v = lastActualValue + slope * i;
    // Cap extrapolation ±10% from current to prevent wild lines on short ranges.
    const maxDelta = lastActualValue * 0.10;
    if (v - lastActualValue >  maxDelta) v = lastActualValue + maxDelta;
    if (v - lastActualValue < -maxDelta) v = lastActualValue - maxDelta;
    projected.push({ x: n - 1 + i, value: v });
  }

  // Plot bounds — share Y between actual and projection so they're on the same scale.
  const allY = [...points.map(p => p.value), ...projected.map(p => p.value)];
  const yMin = Math.min(...allY);
  const yMax = Math.max(...allY);
  const yPad = Math.max(0.05, (yMax - yMin) * 0.15);
  const yLo = yMin - yPad, yHi = yMax + yPad;
  const totalSteps = n - 1 + projSteps;

  const W = 360, H = 130, PADL = 38, PADR = 10, PADT = 10, PADB = 24;
  const innerW = W - PADL - PADR, innerH = H - PADT - PADB;
  const xToPx = i => PADL + (i / totalSteps) * innerW;
  const yToPx = v => PADT + (1 - (v - yLo) / (yHi - yLo)) * innerH;

  const linePath = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${xToPx(i).toFixed(1)},${yToPx(p.value).toFixed(1)}`
  ).join(' ');
  const lastActual = { x: xToPx(n - 1), y: yToPx(points[n - 1].value) };
  const projPath = `M${lastActual.x.toFixed(1)},${lastActual.y.toFixed(1)} ` +
    projected.map(p => `L${xToPx(p.x).toFixed(1)},${yToPx(p.value).toFixed(1)}`).join(' ');
  // Hide individual dots when the line is dense — they just become noise.
  const showDots = n <= 14;
  const dots = showDots
    ? points.map((p, i) =>
        `<circle cx="${xToPx(i).toFixed(1)}" cy="${yToPx(p.value).toFixed(1)}" r="2.5" class="chart-dot"/>`
      ).join('')
    : '';

  // Y-axis labels: top, mid, bottom.
  const yLabel = v => {
    const dp = priceDigits(country.currency);
    return `${country.symbol}${v.toFixed(dp + 1)}`;
  };
  const yTicks = [yHi, (yHi + yLo) / 2, yLo].map(v =>
    `<text x="${PADL - 4}" y="${yToPx(v) + 3}" class="chart-y-label">${yLabel(v)}</text>`
  ).join('');

  // X-axis labels: month names when the visible window spans 2+ months, otherwise dates.
  const firstD = new Date(points[0].date);
  const lastD = new Date(points[n - 1].date);
  const monthSpan = (lastD.getUTCFullYear() - firstD.getUTCFullYear()) * 12
    + (lastD.getUTCMonth() - firstD.getUTCMonth());
  let xLabels = '';
  if (monthSpan >= 2) {
    // Place a label at the first point of each month visible. For ranges
    // longer than ~12 months we'd overflow the axis, so thin out to every
    // 2nd / 3rd / 4th month and prefix the year on January labels for clarity.
    const seen = new Set();
    const labels = [];
    points.forEach((p, i) => {
      const d = new Date(p.date);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
      if (seen.has(key)) return;
      seen.add(key);
      const monthName = MONTH_NAMES_SHORT[d.getUTCMonth()];
      // Show year on January markers when the range crosses a year boundary,
      // so "Jan '25" / "Jan '26" disambiguate the two halves.
      const yr = String(d.getUTCFullYear()).slice(-2);
      const label = (d.getUTCMonth() === 0) ? `${monthName} '${yr}` : monthName;
      labels.push({ idx: i, label });
    });
    // Calculate how many labels we can fit: ~50px per label minimum for legibility.
    const maxLabels = Math.max(2, Math.floor(innerW / 50));
    const stride = Math.max(1, Math.ceil(labels.length / maxLabels));
    // One pass: keep stride-spaced labels and drop the idx=0 label so it
    // doesn't collide with the y-axis (unless it's the only label we have).
    const filtered = labels.filter((l, i) =>
      (i % stride === 0) && (l.idx > 0 || labels.length === 1)
    );
    xLabels = filtered.map(l =>
      `<text x="${xToPx(l.idx).toFixed(1)}" y="${H - 6}" class="chart-x-label" text-anchor="middle">${l.label}</text>`
    ).join('');
    // Always mark the projection endpoint.
    xLabels += `<text x="${xToPx(totalSteps).toFixed(1)}" y="${H - 6}" class="chart-x-label" text-anchor="end">+${projSteps}w</text>`;
  } else {
    const fmtDate = iso => { const [, m, d] = iso.split('-'); return `${m}/${d}`; };
    xLabels =
      `<text x="${xToPx(0).toFixed(1)}" y="${H - 6}" class="chart-x-label" text-anchor="start">${fmtDate(points[0].date)}</text>` +
      `<text x="${xToPx(n - 1).toFixed(1)}" y="${H - 6}" class="chart-x-label" text-anchor="middle">${fmtDate(points[n - 1].date)}</text>` +
      `<text x="${xToPx(totalSteps).toFixed(1)}" y="${H - 6}" class="chart-x-label" text-anchor="end">+${projSteps}w</text>`;
  }

  // Trend label — % change from the first to last visible point. Reflects
  // what the user is actually looking at: 1W view shows a 1-week trend, 1Y
  // view shows a 1-year trend. Different ranges intentionally display
  // different numbers — that's the whole point of the range filter.
  const firstValue = points[0].value;
  const deltaPct = firstValue > 0 ? ((lastActualValue - firstValue) / firstValue) * 100 : 0;
  const trendDir = Math.abs(deltaPct) < 0.5 ? 'flat' : (deltaPct > 0 ? 'up' : 'down');
  const trendArrow = trendDir === 'up' ? '↗' : trendDir === 'down' ? '↘' : '→';
  const trendText = trendDir === 'flat'
    ? 'Flat'
    : `${deltaPct > 0 ? '+' : ''}${deltaPct.toFixed(1)}% over ${range.titleLabel.replace('past ', '')}`;

  const truncatedNote = (range.days && allPoints.length > 0
    && allPoints[0].ts > lastTs - range.days * 86400000)
    ? ' · (less data available than the range)'
    : '';
  const fuelLabel = fuel === 'mid' ? 'mid-grade' : fuel;
  const titleSpan = `${fuelLabel} · ${range.titleLabel} · ${n} pts${truncatedNote}`;

  host.innerHTML = `
    <div class="chart-header">
      <span class="chart-title">${escapeHtml(def.label)} · ${escapeHtml(titleSpan)}</span>
      <span class="chart-trend chart-trend-${trendDir}">${trendArrow} ${escapeHtml(trendText)}</span>
    </div>
    ${tabsHtml}
    <div class="chart-svg-wrap">
      <svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img" aria-label="Recent gas prices" preserveAspectRatio="none">
        ${yTicks}
        <path d="${linePath}" class="chart-line"/>
        <path d="${projPath}" class="chart-projection"/>
        ${dots}
        <circle cx="${lastActual.x.toFixed(1)}" cy="${lastActual.y.toFixed(1)}" r="3.5" class="chart-dot-last"/>
        ${xLabels}
        <line class="chart-hover-line" x1="0" y1="${PADT}" x2="0" y2="${PADT + innerH}" hidden/>
        <circle class="chart-hover-dot" cx="0" cy="0" r="4" hidden/>
      </svg>
      <div class="chart-tooltip" hidden></div>
    </div>
    <p class="chart-note">Dashed line is a 2-week dampened extrapolation of the visible window — directional only. Real gas-price forecasts require crude-oil futures and refinery data, which aren't in any free public feed.</p>
  `;
  // Stash only what the hover handler actually reads. Stale fields confuse
  // future maintainers — and the dot/line coordinate transforms are recomputed
  // from the points themselves.
  const svg = host.querySelector('.chart-svg');
  if (svg) {
    svg._chartCtx = { points, xToPx, yToPx, W, H, country, fuelLabel };
  }
  bindChartRangeHandlers(host);
  bindChartHoverHandlers(host);
}

function renderChartRangeTabs(activeKey) {
  return `<div class="chart-range-tabs" role="tablist">
    ${Object.entries(CHART_RANGES).map(([key, r]) =>
      `<button type="button" class="chart-range-tab${key === activeKey ? ' active' : ''}" data-range="${key}">${r.label}</button>`
    ).join('')}
  </div>`;
}

function bindChartRangeHandlers(host) {
  for (const btn of host.querySelectorAll('.chart-range-tab')) {
    btn.addEventListener('click', () => {
      state.chartRange = btn.dataset.range;
      saveState();
      renderPriceChart();
    });
  }
}

// Mouse-over the chart SVG → translate the cursor's x position into the nearest
// data point and pop a tooltip showing exact date + price. Touch-friendly: also
// listens for touch events on mobile. Tooltip lives in HTML (not inside the SVG)
// so it can use normal CSS positioning and won't clip at the SVG's viewBox.
function bindChartHoverHandlers(host) {
  const svg = host.querySelector('.chart-svg');
  const wrap = host.querySelector('.chart-svg-wrap');
  const tooltip = host.querySelector('.chart-tooltip');
  const hoverLine = host.querySelector('.chart-hover-line');
  const hoverDot  = host.querySelector('.chart-hover-dot');
  if (!svg || !wrap || !tooltip || !hoverLine || !hoverDot) return;

  // Tracks the last touch interaction so the synthesized mouse events that
  // fire ~300ms after a tap don't re-show the tooltip we just hid.
  let lastTouchAt = 0;
  const onMove = clientX => {
    const ctx = svg._chartCtx;
    if (!ctx || !ctx.points.length) return;
    const rect = svg.getBoundingClientRect();
    // Convert the cursor's pixel x within the rendered SVG into the SVG's
    // viewBox x. The SVG uses preserveAspectRatio="none" + 100% width, so the
    // viewBox stretches/squashes to fit; we map ratio-by-ratio.
    const xRatio = (clientX - rect.left) / rect.width;
    const svgX = xRatio * ctx.W;

    // Find the data point whose plotted x is closest to the cursor.
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < ctx.points.length; i++) {
      const px = ctx.xToPx(i);
      const d = Math.abs(px - svgX);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    const p = ctx.points[bestIdx];
    const dotPxX = ctx.xToPx(bestIdx);
    const dotPxY = ctx.yToPx(p.value);

    // Move the indicator line + dot in the SVG.
    hoverLine.setAttribute('x1', dotPxX);
    hoverLine.setAttribute('x2', dotPxX);
    hoverLine.hidden = false;
    hoverDot.setAttribute('cx', dotPxX);
    hoverDot.setAttribute('cy', dotPxY);
    hoverDot.hidden = false;

    // Position the HTML tooltip relative to .chart-svg-wrap (which is positioned).
    const wrapRect = wrap.getBoundingClientRect();
    const cssX = (dotPxX / ctx.W) * wrapRect.width;
    const cssY = (dotPxY / ctx.H) * wrapRect.height;
    const dp = priceDigits(ctx.country.currency);
    const dateLabel = formatChartTooltipDate(p.date);
    tooltip.innerHTML = `<strong>${escapeHtml(dateLabel)}</strong><span>${ctx.country.symbol}${p.value.toFixed(dp + 1)}</span><small>${escapeHtml(ctx.fuelLabel)}</small>`;
    tooltip.hidden = false;
    // Place above the dot, centered. Clamp to wrap bounds.
    const ttWidth = tooltip.offsetWidth || 100;
    let leftPx = cssX - ttWidth / 2;
    leftPx = Math.max(4, Math.min(wrapRect.width - ttWidth - 4, leftPx));
    tooltip.style.left = `${leftPx}px`;
    tooltip.style.top  = `${Math.max(4, cssY - tooltip.offsetHeight - 12)}px`;
  };
  const hideHover = () => {
    hoverLine.hidden = true;
    hoverDot.hidden = true;
    tooltip.hidden = true;
  };

  svg.addEventListener('mousemove', e => {
    // Suppress mousemove events that the browser synthesizes after a tap —
    // they'd flicker the tooltip back into view right after touchend hid it.
    if (Date.now() - lastTouchAt < 500) return;
    onMove(e.clientX);
  });
  svg.addEventListener('mouseleave', hideHover);
  svg.addEventListener('touchstart', e => {
    lastTouchAt = Date.now();
    if (e.touches[0]) onMove(e.touches[0].clientX);
  }, { passive: true });
  svg.addEventListener('touchmove', e => {
    lastTouchAt = Date.now();
    if (e.touches[0]) onMove(e.touches[0].clientX);
  }, { passive: true });
  svg.addEventListener('touchend', () => {
    lastTouchAt = Date.now();
    hideHover();
  });
}

function formatChartTooltipDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${MONTH_NAMES_SHORT[d.getUTCMonth()]} ${day}, ${d.getUTCFullYear()}`;
}

function renderConditions() {
  const slider = $('cityMixSlider');
  slider.value = state.cityMixPct;
  slider.style.setProperty('--slider-val', String(state.cityMixPct));
  const cityPct = state.cityMixPct, hwyPct = 100 - cityPct;
  $('mixReadout').textContent = `${cityPct}% city · ${hwyPct}% hwy`;
  for (const btn of $$('.seg-btn[data-style]')) {
    btn.classList.toggle('active', btn.dataset.style === state.drivingStyle);
  }
  for (const cb of $$('input[type="checkbox"][data-cond]')) {
    cb.checked = !!state.conditions[cb.dataset.cond];
  }
}

function renderExtras() {
  if (document.activeElement !== $('passengersInput')) {
    $('passengersInput').value = state.passengers || 1;
  }
  if (document.activeElement !== $('tankInput')) {
    $('tankInput').value = state.tankSize ? String(state.tankSize) : '';
  }
  if (document.activeElement !== $('tollsInput')) {
    $('tollsInput').value = state.tolls ? String(state.tolls) : '';
  }
}

function renderCompare() {
  const body = $('compareBody');
  const toggleBtn = $('toggleCompareBtn');
  body.hidden = !state.compareEnabled;
  toggleBtn.textContent = state.compareEnabled ? 'Remove' : 'Add';
  if (!state.compareEnabled) return;

  for (const btn of $$('.seg-btn[data-cmp-mode]')) {
    btn.classList.toggle('active', btn.dataset.cmpMode === state.cmpVehicleMode);
  }
  $('cmpPickPanel').classList.toggle('hidden', state.cmpVehicleMode !== 'pick');
  $('cmpCustomPanel').classList.toggle('hidden', state.cmpVehicleMode !== 'custom');
  if (document.activeElement !== $('cmpCustomEffInput')) {
    $('cmpCustomEffInput').value = state.cmpCustomEff ? String(state.cmpCustomEff) : '';
  }
}

function vehicleLabel(vehicle, mode, customEff) {
  const us = UNIT_SYSTEMS[state.unitSystem];
  if (mode === 'custom') {
    if (!customEff) return 'Custom (not set)';
    return `Custom — ${fmtNumber(customEff, 1)} ${us.effLabel}`;
  }
  if (!vehicle) return 'Not selected';
  const v = vehicle;
  return `${v.year} ${v.make} ${v.model}${v.trimText ? ` · ${v.trimText.split(',')[0]}` : ''}`;
}
function cmpVehicleLabel() {
  return vehicleLabel(state.cmpPickedVehicle, state.cmpVehicleMode, state.cmpCustomEff);
}

function renderResults() {
  updateDistanceHint();
  const r = calculate();
  const us = r.us;
  const country = r.country;
  const sym = country.symbol;
  const flash = (id, val) => {
    const el = $(id);
    if (!el) return;
    if (el.textContent !== val) {
      el.textContent = val;
      el.classList.remove('flash');
      void el.offsetWidth;
      el.classList.add('flash');
    }
  };

  // ----- HERO TOTAL -----
  $('heroSymbol').textContent = sym;
  $('heroCurrency').textContent = country.currency;
  const heroNumEl = $('heroNum');
  const newHeroNum = fmtNumber(r.totalCost > 0 ? r.totalCost : 0, moneyDigits(country.currency));
  if (heroNumEl.textContent !== newHeroNum) {
    heroNumEl.textContent = newHeroNum;
    heroNumEl.classList.remove('flash');
    void heroNumEl.offsetWidth;
    heroNumEl.classList.add('flash');
  }
  // Hero sub text
  let heroSub;
  if (r.totalCost > 0) {
    const distDisp = fromKm(r.distanceKm, us.distance);
    heroSub = `${fmtNumber(distDisp, 0)} ${us.distLabel}${state.isRoundTrip ? ' round trip' : ''}`;
  } else if (r.distanceKm === 0 && r.baseL === 0) {
    heroSub = 'Add a distance and vehicle';
  } else if (r.distanceKm === 0) {
    heroSub = 'Enter your trip distance';
  } else if (r.baseL === 0) {
    heroSub = 'Pick a vehicle or enter custom efficiency';
  } else {
    heroSub = 'Enter a gas price';
  }
  $('heroSub').textContent = heroSub;

  // ----- PER-PERSON BAR -----
  if (r.totalCost > 0 && r.passengers > 1) {
    $('perPersonBar').hidden = false;
    $('ppCount').textContent = String(r.passengers);
    flash('ppValue', `${sym}${fmtNumber(r.perPerson, moneyDigits(country.currency))}`);
  } else {
    $('perPersonBar').hidden = true;
  }

  // ----- BREAKDOWN -----
  // Distance
  const distDisp = fromKm(r.distanceKm, us.distance);
  flash('resDistance',
    r.distanceKm > 0
      ? `${fmtNumber(distDisp, 1)} ${us.distLabel}${state.isRoundTrip ? ' (round trip)' : ''}`
      : '—'
  );

  // Vehicle line — only append efficiency when picking from DB (custom label already has it).
  const vLabel = vehicleLabel(state.pickedVehicle, state.vehicleMode, state.customEff);
  let vehicleLine = vLabel;
  const v = state.pickedVehicle;
  if (state.vehicleMode === 'pick' && r.baseL > 0) {
    // Show the mixed effective figure plus a parenthetical breakdown of city/hwy
    // (FuelEconomy.gov publishes them separately — surface so users see why the
    // mix slider matters).
    const mix = fmtNumber(fromL100km(r.baseL, us.efficiency), 1);
    let line = ` — ${mix} ${us.effLabel}`;
    if (v && isFinite(v.city08) && isFinite(v.highway08) && v.city08 > 0 && v.highway08 > 0) {
      const cityMpg = v.city08;
      const hwyMpg = v.highway08;
      const cityL = 235.215 / cityMpg;
      const hwyL  = 235.215 / hwyMpg;
      const cityDisp = fmtNumber(fromL100km(cityL, us.efficiency), 1);
      const hwyDisp  = fmtNumber(fromL100km(hwyL,  us.efficiency), 1);
      line += ` (city ${cityDisp} · hwy ${hwyDisp})`;
    }
    vehicleLine += line;
  }
  const vIcon = (state.vehicleMode === 'pick' && state.pickedVehicle?.vClass)
    ? bodyClassIcon(state.pickedVehicle.vClass) : '';
  flash('resVehicle', vIcon ? `${vIcon}  ${vehicleLine}` : vehicleLine);

  // Adjusted
  if (r.adjL > 0 && Math.abs(r.adjL - r.baseL) > 0.001) {
    $('resAdjustedRow').hidden = false;
    flash('resAdjusted', `${fmtNumber(fromL100km(r.adjL, us.efficiency), 1)} ${us.effLabel}`);
  } else {
    $('resAdjustedRow').hidden = true;
  }

  // Weather (from Open-Meteo at active route's midpoint)
  if (state.routeWeather && isFinite(state.routeWeather.tempC)) {
    const w = state.routeWeather;
    const [emoji, label] = describeWeatherCode(w.weatherCode);
    let pctText = '';
    if (state.ignoreWeather) {
      pctText = ' · impact ignored';
    } else {
      const wm = weatherFuelMultiplier(w);
      const pct = Math.round((wm - 1) * 100);
      if (pct > 0) pctText = ` · +${pct}% fuel`;
    }
    $('resWeatherRow').hidden = false;
    flash('resWeather',
      `${emoji} ${Math.round(w.tempC)}°C, ${label}${pctText}`
    );
  } else {
    $('resWeatherRow').hidden = true;
  }

  // Fuel needed
  if (r.fuelLitres > 0) {
    const volDisp = fromLitre(r.fuelLitres, us.volume);
    flash('resFuel', `${fmtNumber(volDisp, 2)} ${us.volLabel}`);
  } else {
    flash('resFuel', '—');
  }

  // Price
  flash('resPrice', state.price > 0 ? `${sym}${fmtNumber(state.price, priceDigits(country.currency))}/${us.volLabel}` : '—');

  // Per distance
  if (r.totalCost > 0 && r.distanceKm > 0) {
    const totalDistDisp = fromKm(r.distanceKm, us.distance);
    const perDist = r.totalCost / totalDistDisp;
    flash('resPerDist', `${sym}${fmtNumber(perDist, 3)} ${country.currency}`);
  } else {
    flash('resPerDist', '—');
  }

  // Fill-ups
  if (r.fillups != null) {
    $('resFillupsRow').hidden = false;
    flash('resFillups', `~${fmtNumber(r.fillups, 1)} on a ${fmtNumber(state.tankSize, 0)} ${us.volLabel} tank`);
  } else {
    $('resFillupsRow').hidden = true;
  }

  // One-way cost — only meaningful when the round-trip checkbox is on,
  // since one-way == total for a single-leg trip.
  if (state.isRoundTrip && r.totalCost > 0) {
    $('resOneWayRow').hidden = false;
    flash('resOneWay', fmtMoney(r.oneWayCost, sym, country.currency));
  } else {
    $('resOneWayRow').hidden = true;
  }

  // Tolls + grand total
  if (r.tolls > 0) {
    $('resTollsRow').hidden = false;
    $('resGrandTotalRow').hidden = false;
    flash('resTolls', fmtMoney(r.tolls, sym, country.currency));
    flash('resGrandTotal', fmtMoney(r.grandTotal, sym, country.currency));
  } else {
    $('resTollsRow').hidden = true;
    $('resGrandTotalRow').hidden = true;
  }

  // Comparison
  const cmpPanel = $('comparisonPanel');
  if (r.comparison) {
    cmpPanel.hidden = false;
    $('cmpVehLabel').textContent = r.comparison.label;
    flash('cmpFuel', `${fmtNumber(fromLitre(r.comparison.fuelL, us.volume), 2)} ${us.volLabel}`);
    flash('cmpTotal', fmtMoney(r.comparison.cost, sym, country.currency));
    const sav = r.comparison.savings;
    const savLine = $('savingsLine');
    if (Math.abs(sav) < 0.01) {
      savLine.textContent = 'About the same.';
      savLine.classList.remove('negative');
    } else if (sav > 0) {
      savLine.textContent = `Comparison vehicle saves ${fmtMoney(sav, sym, country.currency)}.`;
      savLine.classList.remove('negative');
    } else {
      savLine.textContent = `Primary vehicle saves ${fmtMoney(-sav, sym, country.currency)}.`;
      savLine.classList.add('negative');
    }
  } else {
    cmpPanel.hidden = true;
  }

  // Warning for EVs / missing fuel data
  const warn = $('resWarn');
  let warnText = '';
  if (state.vehicleMode === 'pick' && state.pickedVehicle) {
    const ft = (state.pickedVehicle.fuelType || '').toLowerCase();
    if (ft.includes('electricity') && !ft.includes('gasoline')) {
      warnText = 'This is an electric vehicle — gasoline cost does not apply.';
    } else if (ft.includes('premium')) {
      warnText = 'Manufacturer recommends Premium gasoline.';
    } else if (ft.includes('diesel') && state.fuelType !== 'diesel') {
      warnText = 'This is a diesel vehicle — switch fuel type to Diesel for accurate cost.';
    }
  }
  if (warnText) { warn.hidden = false; warn.textContent = warnText; }
  else { warn.hidden = true; }
}

/* =========================
   VEHICLE PICKER LOGIC (combo-based)
   ========================= */
function comboGroup(role) {
  return role === 'primary'
    ? { year: combos.year, make: combos.make, model: combos.model, trim: combos.trim }
    : { year: combos.cmpYear, make: combos.cmpMake, model: combos.cmpModel, trim: combos.cmpTrim };
}

async function initPickers(role = 'primary') {
  const c = comboGroup(role);
  if (!c.year) return;
  c.year.setLoading(true, 'Loading years…');
  try {
    const years = await fegYears();
    c.year.setLoading(false);
    const sorted = years.slice().sort((a, b) => Number(b) - Number(a));
    c.year.setOptions(sorted.map(y => ({ value: y, label: y })));
  } catch (e) {
    c.year.setLoading(false);
    showVehicleError(role, 'Vehicle database unavailable. Use custom efficiency mode.');
  }
}

function showVehicleError(role, msg) {
  if (role === 'primary') {
    const err = $('vehicleError');
    err.textContent = msg; err.hidden = false;
  } else {
    state.cmpVehicleMode = 'custom';
    renderCompare();
  }
}

async function onYearChange(role, year) {
  const c = comboGroup(role);
  c.make.clear(); c.model.clear(); c.trim.clear();
  c.make.setDisabled(true); c.model.setDisabled(true); c.trim.setDisabled(true);
  // Update placeholders so the user sees what's needed next, not stale "Pick X first"
  c.make.setPlaceholder(year ? 'Pick a make' : 'Pick year first');
  c.model.setPlaceholder('Make first');
  c.trim.setPlaceholder('Model first');
  if (role === 'primary') state.pickedVehicle = null;
  else state.cmpPickedVehicle = null;
  update();
  if (!year) return;
  c.make.setLoading(true, 'Loading makes…');
  try {
    const makes = await fegMakes(year);
    c.make.setLoading(false);
    c.make.setOptions(makes.map(m => ({ value: m, label: m })));
    c.make.setDisabled(false);
  } catch (e) { c.make.setLoading(false); showVehicleError(role, 'Could not load makes.'); }
}

async function onMakeChange(role, make) {
  const c = comboGroup(role);
  c.model.clear(); c.trim.clear();
  c.model.setDisabled(true); c.trim.setDisabled(true);
  c.model.setPlaceholder(make ? 'Pick a model' : 'Make first');
  c.trim.setPlaceholder('Model first');
  if (role === 'primary') state.pickedVehicle = null;
  else state.cmpPickedVehicle = null;
  update();
  const year = c.year.getValue();
  if (!year || !make) return;
  c.model.setLoading(true, 'Loading models…');
  try {
    const models = await fegModels(year, make);
    c.model.setLoading(false);
    c.model.setOptions(models.map(m => ({ value: m, label: m })));
    c.model.setDisabled(false);
  } catch (e) { c.model.setLoading(false); showVehicleError(role, 'Could not load models.'); }
}

async function onModelChange(role, model) {
  const c = comboGroup(role);
  c.trim.clear(); c.trim.setDisabled(true);
  c.trim.setPlaceholder(model ? 'Pick a trim' : 'Model first');
  if (role === 'primary') state.pickedVehicle = null;
  else state.cmpPickedVehicle = null;
  update();
  const year = c.year.getValue(), make = c.make.getValue();
  if (!year || !make || !model) return;
  c.trim.setLoading(true, 'Loading trims…');
  try {
    const opts = await fegOptions(year, make, model);
    c.trim.setLoading(false);
    c.trim.setOptions(opts.map(o => ({ value: o.value, label: o.text })));
    c.trim.setDisabled(false);
  } catch (e) { c.trim.setLoading(false); showVehicleError(role, 'Could not load trims.'); }
}

async function onTrimChange(role, vehicleId) {
  const c = comboGroup(role);
  if (!vehicleId) {
    if (role === 'primary') state.pickedVehicle = null;
    else state.cmpPickedVehicle = null;
    update(); return;
  }
  try {
    const veh = await fegVehicle(vehicleId);
    const trimText = c.trim.getLabel();
    const data = {
      id: vehicleId,
      year: c.year.getValue(),
      make: c.make.getValue(),
      model: c.model.getValue(),
      trimText,
      city08: veh.city08, highway08: veh.highway08, comb08: veh.comb08,
      fuelType: veh.fuelType || veh.fuelType1 || '',
      vClass: veh.VClass || veh.vClass || '',
    };
    if (role === 'primary') {
      state.pickedVehicle = data;
      // Auto-fill tank size from vehicle class so users don't have to look it up.
      const litres = estimateTankLitres(data.vClass);
      if (litres > 0) {
        const us = UNIT_SYSTEMS[state.unitSystem];
        state.tankSize = parseFloat(fromLitre(litres, us.volume).toFixed(1));
      }
      // Refresh the Save-this-car button state — without this, the user has
      // no way to know the freshly-picked car is now savable.
      renderSavedVehicles();
    } else {
      state.cmpPickedVehicle = data;
    }
    update();
  } catch (e) { showVehicleError(role, 'Could not load vehicle data.'); }
}

/* =========================
   THEME
   ========================= */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
  $('themeIcon').textContent = theme === 'light' ? '☀️' : '🌙';
  state.theme = theme;
  // Swap map tiles if a map is already on the page
  if (map && map.instance) applyMapTiles();
}

/* =========================
   EVENTS
   ========================= */
const update = debounce(() => {
  renderResults();
  // Keep per-route fuel estimates fresh if routes are visible
  if (map.routes && map.routes.length > 0) renderRouteAlts();
  // Save-this-car button state depends on pickedVehicle — keep it accurate
  // when the vehicle changes through any code path (combo pick, VIN decode,
  // saved-car load, etc.).
  renderSavedVehicles();
  saveState();
}, 80);

function attachListeners() {
  // Theme
  $('themeToggle').addEventListener('click', () => {
    applyTheme(state.theme === 'light' ? 'dark' : 'light');
    saveState();
  });

  // Refresh location
  $('refreshLocationBtn').addEventListener('click', async () => {
    const det = await detectLocation();
    if (det && det.country) {
      applyDetected(det);
    }
    render(); update();
  });

  // Unit system
  for (const btn of $$('.unit-card .seg-btn')) {
    btn.addEventListener('click', () => {
      changeUnitSystem(btn.dataset.unit);
    });
  }

  // Distance
  $('distanceInput').addEventListener('input', (e) => {
    state.distance = parseFloat(e.target.value) || 0;
    updateDistanceHint();
    update();
  });
  $('roundTripChk').addEventListener('change', (e) => {
    state.isRoundTrip = e.target.checked;
    renderDistance(); update();
  });

  // Stops (route waypoints)
  $('addStopBtn').addEventListener('click', () => {
    map.stops.push({ lat: null, lon: null, label: '' });
    renderStops();
    // Focus the new input
    const inputs = document.querySelectorAll('#stopsList .stop-input');
    inputs[inputs.length - 1]?.focus();
  });
  $('suggestStopsBtn').addEventListener('click', suggestFuelStops);
  $('mapClickModeBtn').addEventListener('click', toggleMapClickMode);
  $('clearRouteBtn').addEventListener('click', () => {
    clearRoutePoints();
    showToast('Route cleared. Pick A and B from the map or the address fields.');
  });

  // Vehicle mode
  for (const btn of $$('.card .seg-btn[data-mode]')) {
    btn.addEventListener('click', () => {
      state.vehicleMode = btn.dataset.mode;
      renderVehicleMode(); update();
    });
  }

  // (Pickers wired through combo onChange callbacks in initCombos)

  // VIN lookup
  $('vinLookupBtn').addEventListener('click', () => openModal('vinModal'));
  $('vinDecodeBtn').addEventListener('click', handleVinDecode);
  $('saveCarBtn').addEventListener('click', saveCurrentVehicle);
  $('vinInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleVinDecode(); }
  });

  // Route planner
  $('distLookupGo').addEventListener('click', handleDistanceLookup);
  $('distMapsBtn').addEventListener('click', (e) => {
    e.preventDefault();
    window.open(buildGoogleMapsUrl(), '_blank', 'noopener,noreferrer');
  });
  $('saveRouteBtn').addEventListener('click', saveCurrentRoute);

  // Address autocomplete
  attachAddressAutocomplete($('distOrigin'), $('distOriginDropdown'), (coords) => {
    map.origin = coords; // null clears cache
  });
  attachAddressAutocomplete($('distDest'), $('distDestDropdown'), (coords) => {
    map.dest = coords;
  });

  // Allow Enter in either address field to trigger Calculate
  ['distOrigin', 'distDest'].forEach(id => {
    $(id).addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && $('distOriginDropdown').hidden && $('distDestDropdown').hidden) {
        e.preventDefault();
        handleDistanceLookup();
      }
    });
  });

  // Avoid checkboxes — re-fetch routes so the new avoid_features actually take
  // effect via ORS. Old code only refreshed the hint text or re-picked between
  // already-loaded OSRM alternatives, which silently ignored the user.
  ['avoidHighways', 'avoidTolls', 'avoidFerries', 'stayInCountry'].forEach(id => {
    $(id).addEventListener('change', () => {
      if (map.origin && map.dest) handleDistanceLookup();
    });
  });

  // Departure time picker — drives the traffic-time-of-day multiplier on
  // displayed durations. Re-renders the alternatives panel without re-fetching
  // (the routes don't depend on time, only the displayed minutes do).
  $('departAt').addEventListener('change', e => {
    state.departAt = e.target.value || null;
    saveState();
    invalidateRouteWeatherCache();
    if (map.routes && map.routes.length > 0) {
      renderRouteAlts();
      applyRouteWeather(map.activeRoute);
    }
  });
  $('departNowBtn').addEventListener('click', () => {
    const d = new Date();
    d.setSeconds(0, 0);
    // Convert to local <input type="datetime-local"> format (no timezone suffix)
    const tzOff = d.getTimezoneOffset() * 60000;
    const localISO = new Date(d.getTime() - tzOff).toISOString().slice(0, 16);
    $('departAt').value = localISO;
    state.departAt = localISO;
    saveState();
    invalidateRouteWeatherCache();
    if (map.routes && map.routes.length > 0) {
      renderRouteAlts();
      applyRouteWeather(map.activeRoute);
    }
  });

  // Custom efficiency
  $('customEffInput').addEventListener('input', (e) => {
    state.customEff = parseFloat(e.target.value) || 0;
    update();
  });

  // Gas price
  $('priceInput').addEventListener('input', (e) => {
    state.price = parseFloat(e.target.value) || 0;
    state.priceTouched = true;
    $('priceHint').textContent = 'Custom price';
    update();
  });
  for (const btn of $$('.fuel-types .seg-btn')) {
    btn.addEventListener('click', () => {
      state.fuelType = btn.dataset.fuel;
      state.priceTouched = false;
      renderGasPrice(); update();
    });
  }

  // Conditions
  $('cityMixSlider').addEventListener('input', (e) => {
    state.cityMixPct = parseInt(e.target.value, 10);
    e.target.style.setProperty('--slider-val', String(state.cityMixPct));
    const cityPct = state.cityMixPct, hwyPct = 100 - cityPct;
    $('mixReadout').textContent = `${cityPct}% city · ${hwyPct}% hwy`;
    update();
  });
  for (const btn of $$('.seg-btn[data-style]')) {
    btn.addEventListener('click', () => {
      state.drivingStyle = btn.dataset.style;
      renderConditions(); update();
    });
  }
  for (const cb of $$('input[type="checkbox"][data-cond]')) {
    cb.addEventListener('change', () => {
      state.conditions[cb.dataset.cond] = cb.checked;
      update();
    });
  }
  // Ignore-weather toggle: lives in the same conditions block as the manual
  // checkboxes but flips the auto-fetched weather multiplier off entirely.
  const ignoreWeatherChk = $('ignoreWeatherChk');
  if (ignoreWeatherChk) {
    ignoreWeatherChk.checked = !!state.ignoreWeather;
    ignoreWeatherChk.addEventListener('change', () => {
      state.ignoreWeather = ignoreWeatherChk.checked;
      saveState();
      update();
    });
  }

  // Extras
  $('passengersInput').addEventListener('input', (e) => {
    state.passengers = Math.max(1, parseInt(e.target.value, 10) || 1);
    update();
  });
  $('tankInput').addEventListener('input', (e) => {
    state.tankSize = parseFloat(e.target.value) || 0;
    update();
  });
  $('tollsInput').addEventListener('input', (e) => {
    state.tolls = parseFloat(e.target.value) || 0;
    // Empty field re-enables auto-fill so the next route plot can populate it.
    state.tollsTouched = e.target.value !== '';
    update();
    // If the user just cleared the field and there's an active route with an
    // estimate cached, re-apply it immediately rather than waiting for the next plot.
    if (!state.tollsTouched && map.routes?.[map.activeRoute]) {
      applyTollFerryEstimate(map.activeRoute);
    }
  });

  // Compare
  $('toggleCompareBtn').addEventListener('click', () => {
    state.compareEnabled = !state.compareEnabled;
    renderCompare();
    if (state.compareEnabled) initPickers('compare');
    update();
  });
  for (const btn of $$('.seg-btn[data-cmp-mode]')) {
    btn.addEventListener('click', () => {
      state.cmpVehicleMode = btn.dataset.cmpMode;
      renderCompare(); update();
    });
  }
  // Comparison combos wired via initCombos onChange.
  $('cmpCustomEffInput').addEventListener('input', (e) => {
    state.cmpCustomEff = parseFloat(e.target.value) || 0;
    update();
  });

  // Modal close handlers (backdrop / × / Esc)
  document.querySelectorAll('[data-modal-close]').forEach(el => {
    el.addEventListener('click', (e) => {
      const modal = el.closest('.modal');
      if (modal) closeModal(modal.id);
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal:not([hidden])').forEach(m => closeModal(m.id));
    }
  });
}

/* =========================
   COMBOS / MODAL HELPERS
   ========================= */
function initCombos() {
  combos.country = createCombo($('countryCombo'), {
    placeholder: 'Select country',
    searchPlaceholder: 'Search countries…',
    onChange: (val) => {
      if (!val) return;
      state.country = val;
      state.region = null;
      state.priceTouched = false;
      state.unitSystem = getCountry(state.country).unit;
      render(); update();
    },
  });
  combos.country.setOptions(COUNTRIES.map(c => ({ value: c.code, label: c.name, search: c.code })));

  combos.province = createCombo($('provinceCombo'), {
    placeholder: 'Pick a province',
    searchPlaceholder: 'Search…',
    onChange: (val) => {
      state.region = val || null;
      state.priceTouched = false;
      render(); update();
    },
  });
  combos.province.setOptions(CA_PROVINCES.map(p => ({ value: p.code, label: p.name })));

  // Primary vehicle combos
  combos.year = createCombo($('yearCombo'), {
    placeholder: 'Year', searchPlaceholder: 'Type a year…',
    onChange: (val) => onYearChange('primary', val),
  });
  combos.make = createCombo($('makeCombo'), {
    placeholder: 'Pick year first', searchPlaceholder: 'Search makes…',
    onChange: (val) => onMakeChange('primary', val),
  });
  combos.make.setDisabled(true);
  combos.model = createCombo($('modelCombo'), {
    placeholder: 'Pick make first', searchPlaceholder: 'Search models…',
    onChange: (val) => onModelChange('primary', val),
  });
  combos.model.setDisabled(true);
  combos.trim = createCombo($('trimCombo'), {
    placeholder: 'Pick model first', searchPlaceholder: 'Search trims…',
    onChange: (val) => onTrimChange('primary', val),
  });
  combos.trim.setDisabled(true);

  // Comparison combos
  combos.cmpYear = createCombo($('cmpYearCombo'), {
    placeholder: 'Year', searchPlaceholder: 'Type a year…',
    onChange: (val) => onYearChange('compare', val),
  });
  combos.cmpMake = createCombo($('cmpMakeCombo'), {
    placeholder: 'Pick year first', searchPlaceholder: 'Search makes…',
    onChange: (val) => onMakeChange('compare', val),
  });
  combos.cmpMake.setDisabled(true);
  combos.cmpModel = createCombo($('cmpModelCombo'), {
    placeholder: 'Pick make first', searchPlaceholder: 'Search models…',
    onChange: (val) => onModelChange('compare', val),
  });
  combos.cmpModel.setDisabled(true);
  combos.cmpTrim = createCombo($('cmpTrimCombo'), {
    placeholder: 'Pick model first', searchPlaceholder: 'Search trims…',
    onChange: (val) => onTrimChange('compare', val),
  });
  combos.cmpTrim.setDisabled(true);
}

function openModal(id) {
  const m = $(id);
  if (!m) return;
  m.hidden = false;
  document.body.style.overflow = 'hidden';
  // Focus first input
  setTimeout(() => m.querySelector('input, button')?.focus(), 50);
}
function closeModal(id) {
  const m = $(id);
  if (!m) return;
  m.hidden = true;
  document.body.style.overflow = '';
}

/* =========================
   VIN DECODE (NHTSA vPIC)
   ========================= */
async function handleVinDecode() {
  const inp = $('vinInput');
  const result = $('vinResult');
  const btn = $('vinDecodeBtn');
  const vin = (inp.value || '').trim().toUpperCase();
  if (vin.length < 11) {
    result.hidden = false;
    result.className = 'modal-result error';
    result.textContent = 'VIN looks too short. Most modern VINs are 17 characters.';
    return;
  }
  result.hidden = false;
  result.className = 'modal-result';
  result.textContent = 'Decoding…';
  btn.disabled = true;
  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`NHTSA error ${res.status}`);
    const data = await res.json();
    const r = data?.Results?.[0];
    if (!r) throw new Error('No data returned');
    const year = r.ModelYear, make = r.Make, model = r.Model;
    if (!year || !make || !model) throw new Error('VIN incomplete — year, make or model missing.');
    result.className = 'modal-result success';
    result.textContent = `Found: ${year} ${make} ${model}. Loading trims…`;
    await applyVinToPickers({ year, make, model });
    result.textContent = `✓ ${year} ${make} ${model} — pick your trim from the dropdown.`;
    setTimeout(() => closeModal('vinModal'), 700);
  } catch (e) {
    result.className = 'modal-result error';
    result.textContent = `Failed: ${e.message}`;
  } finally {
    btn.disabled = false;
  }
}

async function applyVinToPickers({ year, make, model }) {
  // Switch to pick mode and run the picker chain.
  state.vehicleMode = 'pick';
  renderVehicleMode();

  combos.year.setValue(String(year));
  await onYearChange('primary', String(year));
  // Match make case-insensitively
  const makes = await fegMakes(String(year));
  const matchedMake = makes.find(m => m.toLowerCase() === make.toLowerCase())
    || makes.find(m => m.toLowerCase().startsWith(make.toLowerCase()));
  if (!matchedMake) throw new Error(`Make "${make}" not in database for ${year}`);
  combos.make.setValue(matchedMake);
  await onMakeChange('primary', matchedMake);
  // Match model
  const models = await fegModels(String(year), matchedMake);
  const target = model.toLowerCase();
  const matchedModel = models.find(m => m.toLowerCase() === target)
    || models.find(m => m.toLowerCase().startsWith(target))
    || models.find(m => m.toLowerCase().includes(target.split(' ')[0]));
  if (!matchedModel) throw new Error(`Model "${model}" not in database`);
  combos.model.setValue(matchedModel);
  await onModelChange('primary', matchedModel);
}

/* =========================
   DISTANCE LOOKUP + EMBEDDED MAP (OSM/Leaflet)
   ========================= */
const map = {
  instance: null,
  tileLayer: null,
  routeLayers: [],     // one Polyline per alternative route
  stationLayer: null,
  startMarker: null,
  endMarker: null,
  stopMarkers: [],     // markers for intermediate stops
  origin: null,        // { lon, lat, label }
  dest: null,          // { lon, lat, label }
  stops: [],           // [{ lon, lat, label }] — intermediate waypoints
  routes: [],          // [{ distance, duration, coords }]
  activeRoute: 0,
  clickMode: false,    // when true, clicking the map adds a stop
};

// Route polyline colors — the "active" highlight uses the accent (purple),
// alternates differentiate by hue without using orange.
const ROUTE_COLORS = ['#A855F7', '#22C55E', '#60A5FA'];
const ROUTE_NAMES = ['Fastest', 'Alternative', 'Scenic'];
// Multiplier applied to raw ORS/OSRM free-flow durations so the displayed
// drive time approximates real-world traffic conditions. When the user has
// picked a specific departAt, factors in time-of-day rush hours; otherwise
// uses a modest baseline so first-load times are closer to Google Maps's
// typical-traffic estimate.
//
// We don't have a live traffic feed (would need a paid service like HERE,
// TomTom, or Google), so these are static rules-of-thumb calibrated to
// reasonable peak/off-peak ratios — directional, not authoritative.
function trafficDurationMultiplier(departISO) {
  if (!departISO) return 1.10; // sane "typical" default when no time is set
  const d = new Date(departISO);
  if (isNaN(d.getTime())) return 1.10;
  const hour = d.getHours();
  const day = d.getDay();
  const isWeekend = day === 0 || day === 6;
  if (isWeekend) {
    if (hour >= 12 && hour <= 17) return 1.10; // weekend afternoon errands
    return 1.00;
  }
  if (hour >= 7  && hour <= 9)  return 1.35; // weekday morning rush
  if (hour >= 16 && hour <= 19) return 1.40; // weekday evening rush
  if (hour >= 10 && hour <= 15) return 1.10; // weekday midday
  if (hour >= 20 && hour <= 22) return 1.00; // weekday evening
  return 0.95;                                // late night / early morning
}

// Friendly description of the active traffic adjustment for the route-alts header.
function trafficLabel(departISO) {
  const m = trafficDurationMultiplier(departISO);
  const pct = Math.round((m - 1) * 100);
  if (!departISO) return `Estimated +${pct}% over free-flow (typical traffic)`;
  const d = new Date(departISO);
  if (isNaN(d.getTime())) return `Estimated +${pct}% over free-flow`;
  const dayLabel = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const sign = pct >= 0 ? '+' : '';
  return `Departing ${dayLabel} ${hh}:${mm} · ${sign}${pct}% vs free-flow`;
}
let stationGen = 0; // generation counter to discard stale station-load results

function ensureMap() {
  if (map.instance) return map.instance;
  if (typeof L === 'undefined') throw new Error('Leaflet failed to load');
  const el = document.getElementById('map');
  const defaultView = state.detected?.lat != null && state.detected?.lng != null
    ? { center: [state.detected.lat, state.detected.lng], zoom: 7 }
    : { center: [45, -75], zoom: 4 };
  map.instance = L.map(el, { zoomControl: true, attributionControl: true })
    .setView(defaultView.center, defaultView.zoom);
  applyMapTiles();
  bindStationPopupHandlers();
  // Listen for clicks to add waypoints when clickMode is active. The handler
  // figures out whether this click should be A, B, or a stop based on what's
  // already set, so the user can build a whole route from the map alone.
  map.instance.on('click', (e) => {
    if (!map.clickMode) return;
    addPointByClick(e.latlng.lat, e.latlng.lng);
  });
  return map.instance;
}

// Marker drag handler — fires when the user drops a draggable marker at a new
// location. Reverse-geocodes for a label, updates the right slot in state, then
// re-fetches the route. Falls back to bare lat,lon if Nominatim doesn't resolve.
async function handleMarkerDrag(kind, idx, latlng) {
  const lat = latlng.lat, lon = latlng.lng;
  const label = await reverseGeocodeLabel(lat, lon);
  if (kind === 'origin') {
    map.origin = { lat, lon, label };
    $('distOrigin').value = label;
  } else if (kind === 'dest') {
    map.dest = { lat, lon, label };
    $('distDest').value = label;
  } else if (kind === 'stop') {
    if (idx == null || !map.stops[idx]) return;
    map.stops[idx] = { lat, lon, label };
    renderStops();
  }
  if (map.origin && map.dest) handleDistanceLookup();
}

async function reverseGeocodeLabel(lat, lon) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`);
    if (res.ok) {
      const data = await res.json();
      const fmt = formatNominatimSuggestion(data);
      return fmt.value || data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  } catch { /* fall back */ }
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

// Smart click-to-build-route:
//   1st click → origin (A)
//   2nd click → destination (B), route is plotted
//   3rd+ clicks → fuel stops along the way
async function addPointByClick(lat, lon) {
  const label = await reverseGeocodeLabel(lat, lon);
  const point = { lat, lon, label };

  if (!map.origin) {
    map.origin = point;
    $('distOrigin').value = label;
    showToast(`Start set: ${label}`, 'success');
    return;
  }
  if (!map.dest) {
    map.dest = point;
    $('distDest').value = label;
    showToast(`Destination set: ${label}`, 'success');
    handleDistanceLookup();
    return;
  }
  map.stops.push(point);
  renderStops();
  showToast(`Stop added: ${label}`, 'success');
  handleDistanceLookup();
}

// Wipe the route so the user can build a fresh one from map clicks.
function clearRoutePoints() {
  map.origin = null;
  map.dest = null;
  map.stops = [];
  $('distOrigin').value = '';
  $('distDest').value = '';
  renderStops();
  // Pull route polylines + start/end markers off the map.
  if (typeof clearRouteLayers === 'function') clearRouteLayers();
  if (map.startMarker) { map.instance.removeLayer(map.startMarker); map.startMarker = null; }
  if (map.endMarker) { map.instance.removeLayer(map.endMarker); map.endMarker = null; }
  for (const m of map.stopMarkers || []) map.instance.removeLayer(m);
  map.stopMarkers = [];
  map.routes = [];
  renderRouteAlts();
  $('mapInfo').textContent = 'Pan & zoom · enter addresses above to plot a route';
}

function applyMapTiles() {
  if (!map.instance) return;
  if (map.tileLayer) map.instance.removeLayer(map.tileLayer);
  const dark = state.theme !== 'light';
  // CartoDB serves dark_all at the root but voyager lives under rastertiles/voyager.
  // The old light URL silently 404'd, leaving the map blank in bright mode.
  const url = dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  map.tileLayer = L.tileLayer(url, {
    maxZoom: 19,
    attribution: '© OpenStreetMap, © CARTO',
    subdomains: 'abcd',
  }).addTo(map.instance);
}

function clearRouteLayers() {
  for (const layer of map.routeLayers) map.instance.removeLayer(layer);
  map.routeLayers = [];
  if (map.startMarker) { map.instance.removeLayer(map.startMarker); map.startMarker = null; }
  if (map.endMarker) { map.instance.removeLayer(map.endMarker); map.endMarker = null; }
  for (const m of map.stopMarkers) map.instance.removeLayer(m);
  map.stopMarkers = [];
}

function clearStationLayer() {
  if (map.stationLayer) { map.instance.removeLayer(map.stationLayer); map.stationLayer = null; }
  map.stationCount = 0;
}

function clearMapLayers() {
  clearRouteLayers();
  clearStationLayer();
}

/* =========================
   SAVED ROUTES
   ========================= */
const SAVED_ROUTES_CAP = 10;

function renderSavedRoutes() {
  const row = $('savedRoutesRow');
  const list = $('savedRoutesList');
  if (!row || !list) return;
  const routes = Array.isArray(state.savedRoutes) ? state.savedRoutes : [];
  if (routes.length === 0) {
    row.hidden = true;
    list.innerHTML = '';
    return;
  }
  row.hidden = false;
  list.innerHTML = routes.map(r => {
    const stopCount = (r.stops || []).length;
    const stopBadge = stopCount ? ` · ${stopCount} stop${stopCount === 1 ? '' : 's'}` : '';
    const labelText = `${shortenLabel(r.origin?.label)} → ${shortenLabel(r.dest?.label)}${stopBadge}`;
    return `
      <div class="saved-route-chip">
        <button type="button" class="saved-route-load" data-id="${escapeHtml(String(r.id))}" title="Load this route">
          ${escapeHtml(labelText)}
        </button>
        <button type="button" class="saved-route-remove" data-id="${escapeHtml(String(r.id))}" title="Remove" aria-label="Remove">×</button>
      </div>
    `;
  }).join('');
  list.querySelectorAll('.saved-route-load').forEach(btn => {
    btn.addEventListener('click', () => loadSavedRoute(btn.dataset.id));
  });
  list.querySelectorAll('.saved-route-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      removeSavedRoute(btn.dataset.id);
    });
  });
}

function shortenLabel(s) {
  if (!s) return '?';
  // Take the first comma-segment so "111 Albert Street, Ottawa, ON, Canada"
  // collapses to "111 Albert Street" — chips stay readable.
  return String(s).split(',')[0].trim().slice(0, 32);
}

function saveCurrentRoute() {
  if (!map.origin || !map.dest) {
    showToast('Set a start and a destination first', 'error');
    return;
  }
  const id = `r_${Date.now()}`;
  const route = {
    id,
    origin:  { lat: map.origin.lat, lon: map.origin.lon, label: map.origin.label },
    dest:    { lat: map.dest.lat,   lon: map.dest.lon,   label: map.dest.label },
    stops:   (map.stops || [])
      .filter(s => s && isFinite(s.lat) && isFinite(s.lon))
      .map(s => ({ lat: s.lat, lon: s.lon, label: s.label })),
    savedAt: Date.now(),
  };
  const list = state.savedRoutes || [];
  state.savedRoutes = [route, ...list].slice(0, SAVED_ROUTES_CAP);
  saveState();
  renderSavedRoutes();
  showToast(`Saved: ${shortenLabel(route.origin.label)} → ${shortenLabel(route.dest.label)}`);
}

function removeSavedRoute(id) {
  state.savedRoutes = (state.savedRoutes || []).filter(r => String(r.id) !== String(id));
  saveState();
  renderSavedRoutes();
}

function loadSavedRoute(id) {
  const r = (state.savedRoutes || []).find(s => String(s.id) === String(id));
  if (!r) return;
  map.origin = { ...r.origin };
  map.dest   = { ...r.dest };
  map.stops  = (r.stops || []).map(s => ({ ...s }));
  $('distOrigin').value = r.origin?.label || '';
  $('distDest').value   = r.dest?.label   || '';
  renderStops();
  // Move this route to the front (LRU).
  state.savedRoutes = [r, ...state.savedRoutes.filter(s => String(s.id) !== String(id))];
  saveState();
  showToast(`Loaded: ${shortenLabel(r.origin?.label)} → ${shortenLabel(r.dest?.label)}`);
  handleDistanceLookup();
}

// Build a Google Maps directions URL that respects every waypoint the user
// has set: origin → each stop in order → destination. Falls back to plain
// text inputs if coords haven't been resolved yet, so the link is always
// useful — even before "Calculate routes" is clicked.
function buildGoogleMapsUrl() {
  const parts = [];
  const segment = (point, fallbackText) => {
    if (point && isFinite(point.lat) && isFinite(point.lon)) {
      return `${point.lat},${point.lon}`;
    }
    return fallbackText ? encodeURIComponent(fallbackText) : '';
  };

  const origin = segment(map.origin, $('distOrigin').value.trim());
  if (origin) parts.push(origin);

  for (const stop of map.stops || []) {
    if (!stop) continue;
    const seg = segment(stop, stop.label);
    if (seg) parts.push(seg);
  }

  const dest = segment(map.dest, $('distDest').value.trim());
  if (dest) parts.push(dest);

  return parts.length
    ? `https://www.google.com/maps/dir/${parts.join('/')}`
    : 'https://www.google.com/maps/dir/';
}

// Read the current state of the avoid checkboxes. Returns the ORS feature names
// for avoid_features plus a stayInCountry flag (mapped to ORS avoid_borders).
function collectAvoidFeatures() {
  const features = [];
  if ($('avoidHighways')?.checked) features.push('highways');
  if ($('avoidTolls')?.checked)    features.push('tollways');
  if ($('avoidFerries')?.checked)  features.push('ferries');
  return {
    features,
    stayInCountry: !!$('stayInCountry')?.checked,
  };
}

// OSRM: free, no auth, no avoid_features support. Used for "default" routing.
// Returns a normalized shape matching what map.routes expects.
async function routeViaOSRM(waypoints, stopCount) {
  const points = waypoints.map(p => `${p.lon},${p.lat}`).join(';');
  const altParam = stopCount === 0 ? '&alternatives=2' : '';
  const url = `https://router.project-osrm.org/route/v1/driving/${points}?overview=full&geometries=geojson&steps=true${altParam}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Route lookup failed (${r.status})`);
  const data = await r.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No drivable route found');
  return data;
}

// OpenRouteService: requires API key, supports avoid_features, avoid_borders
// (stay-in-country), and explicit `preference` (fastest vs shortest). Per-segment
// toll/ferry markers via the `extras` field are precomputed against the actual
// driven polyline.
//
// We make TWO parallel calls — preference="fastest" and preference="shortest" —
// so users always see distinct "Fastest" and "Most fuel efficient" options, even
// when the optimal route happens to win on both axes. If both calls return the
// same route (within tolerance), we dedupe and the labelling collapses to a
// combined "Fastest & most efficient" card. Doubles the daily quota use, still
// well inside the 2000/day free tier.
//
// ORS's deprecated api.heigit.org subdomain rejects browser CORS preflights as
// of 2026-05; we stick with api.openrouteservice.org until that's resolved.
// Pretty labels and colors for the additive avoid passes. Distinct from the
// gas-station yellow and the route purple/teal/blue palette so the extra cards
// don't blend with the baseline.
const AVOID_DISPLAY = {
  highways:      { label: 'No highways',         color: '#F472B6' },
  tollways:      { label: 'No tolls',            color: '#FB7185' },
  ferries:       { label: 'No ferries',          color: '#22D3EE' },
  stayInCountry: { label: 'No border crossings', color: '#E11D48' },
  eco:           { label: 'Eco (back roads)',    color: '#84CC16' },
  scenic:        { label: 'Scenic',              color: '#0EA5E9' },
};

async function routeViaORS(waypoints, avoidFeatures, opts = {}) {
  const url = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

  const makeBody = (avoid, stayCtl, pref) => {
    const orsOpts = {};
    if (avoid && avoid.length) orsOpts.avoid_features = avoid;
    if (stayCtl)               orsOpts.avoid_borders = 'controlled';
    return {
      coordinates: waypoints.map(p => [p.lon, p.lat]),
      instructions: true,
      extra_info: ['tollways', 'waytype'],
      options: orsOpts,
      preference: pref,
    };
  };

  // Three baseline preferences (Fastest / Most efficient / Balanced) +
  // two presets we always offer:
  //   - Eco: shortest distance, no highways → low-speed back roads, often
  //     better for fuel economy on most cars (engines hit peak efficiency
  //     in the 50-90 km/h sweet spot)
  //   - Scenic: balanced preference, no highways or tolls → relaxed pace
  //     without rushing or paying — good for road trips
  // Plus one extra call for each user-checked avoid (additive layer on top).
  const calls = [
    { tag: null,    body: makeBody([], false, 'fastest') },
    { tag: null,    body: makeBody([], false, 'shortest') },
    { tag: null,    body: makeBody([], false, 'recommended') },
    { tag: 'eco',    body: makeBody(['highways'], false, 'shortest') },
    { tag: 'scenic', body: makeBody(['highways', 'tollways'], false, 'recommended') },
  ];
  for (const f of avoidFeatures) {
    calls.push({ tag: f, body: makeBody([f], false, 'fastest') });
  }
  if (opts.stayInCountry) {
    calls.push({ tag: 'stayInCountry', body: makeBody([], true, 'fastest') });
  }

  const results = await Promise.allSettled(calls.map(c => orsRequest(url, c.body)));
  const annotated = results.map((res, i) => ({
    feat: res.status === 'fulfilled' ? res.value.features?.[0] : null,
    error: res.status === 'rejected' ? res.reason : null,
    tag: calls[i].tag,
  }));

  if (annotated.every(a => !a.feat)) {
    throw annotated.find(a => a.error)?.error || new Error('No drivable route found');
  }

  // Build the final list. Dedupe baseline-vs-baseline (so the same route
  // doesn't show three times if all preferences converge), but keep avoid
  // routes verbatim — even if their geometry is identical to a baseline,
  // they represent a different *intent* the user explicitly asked for.
  const baselineFeats = [];
  const finalFeats = [];
  for (const a of annotated) {
    if (!a.feat) continue;
    if (a.tag) {
      const display = AVOID_DISPLAY[a.tag];
      a.feat.__avoidLabel = display?.label || a.tag;
      a.feat.__avoidColor = display?.color;
      finalFeats.push(a.feat);
    } else {
      if (!baselineFeats.some(f => sameORSRoute(f, a.feat))) {
        baselineFeats.push(a.feat);
      }
    }
  }
  const ordered = [...baselineFeats, ...finalFeats];

  // Collect tags of preset/avoid passes that ORS rejected so the caller can
  // tell the user "Eco unavailable — too long for this routing service."
  // Without this, partial failures (some succeed, some hit the 6,000 km cap)
  // disappear silently and the user sees fewer cards with no explanation.
  const droppedPresets = annotated
    .filter(a => a.error && a.tag)
    .map(a => ({ tag: a.tag, label: AVOID_DISPLAY[a.tag]?.label || a.tag }));

  return {
    droppedPresets,
    routes: ordered.map(feat => {
      const parsed = parseORSFeature(feat);
      if (feat.__avoidLabel) parsed.avoidLabel = feat.__avoidLabel;
      if (feat.__avoidColor) parsed.avoidColor = feat.__avoidColor;
      return parsed;
    }),
  };
}

async function orsRequest(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': window.__ORS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    let detail = '';
    try {
      const j = JSON.parse(text);
      // ORS error shapes vary: sometimes {error: {code, message}}, sometimes
      // {error: 'string'}, occasionally {error: {code: N}} with no message.
      // Guard so we never end up stringifying an object to '[object Object]'
      // — that would break friendlyRouteError's substring matchers.
      if (typeof j?.error?.message === 'string') {
        detail = j.error.message;
      } else if (typeof j?.error === 'string') {
        detail = j.error;
      } else if (typeof j?.message === 'string') {
        detail = j.message;
      }
    } catch {}
    throw new Error(detail
      ? `ORS: ${detail}`
      : `ORS lookup failed (${r.status})${text ? `: ${text.slice(0, 160)}` : ''}`);
  }
  return r.json();
}

// Two ORS routes count as "the same" when they have effectively identical total
// distance (within 0.5%). Used to collapse fastest+shortest into one card when
// the optimal route wins on both axes.
function sameORSRoute(a, b) {
  const aDist = a.properties?.summary?.distance ?? 0;
  const bDist = b.properties?.summary?.distance ?? 0;
  if (aDist <= 0 || bDist <= 0) return false;
  return Math.abs(aDist - bDist) / aDist < 0.005;
}

function parseORSFeature(feat) {
  const segments = feat.properties?.segments || [];
  const legs = segments.map(seg => ({
    steps: (seg.steps || []).map(st => ({
      mode: 'driving',
      distance: st.distance,
      duration: st.duration,
    })),
  }));
  return {
    distance: feat.properties?.summary?.distance ?? 0,
    duration: feat.properties?.summary?.duration ?? 0,
    geometry: feat.geometry,
    legs,
    extras: feat.properties?.extras || null,
    orsExtraDistances: computeORSExtraDistances(feat),
    avoidLabel: feat.__avoidLabel || null,
    avoidColor: feat.__avoidColor || null,
  };
}

// ORS returns extras like:
//   extras.tollways.values = [[start_idx, end_idx, value], ...]
// where start_idx / end_idx are indices into the route's coordinate array, and
// `value` is 1 for tollway, 0 otherwise. waytype carries similar info, with
// value === 7 meaning "ferry". We sum each contiguous segment's geographic
// length to get exact toll-km and ferry-km for the route.
function computeORSExtraDistances(feature) {
  const out = { tollKm: 0, ferryKm: 0, ferryLegs: 0 };
  const coords = feature.geometry?.coordinates || [];
  if (coords.length < 2) return out;

  const segLen = (a, b) => haversineKm(a[1], a[0], b[1], b[0]);
  const sumRange = (start, end) => {
    let km = 0;
    for (let i = start; i < end && i + 1 < coords.length; i++) {
      km += segLen(coords[i], coords[i + 1]);
    }
    return km;
  };

  const tollVals = feature.properties?.extras?.tollways?.values || [];
  for (const [s, e, v] of tollVals) {
    if (v === 1) out.tollKm += sumRange(s, e);
  }
  const wayVals = feature.properties?.extras?.waytype?.values || [];
  for (const [s, e, v] of wayVals) {
    if (v === 7) {
      out.ferryKm += sumRange(s, e);
      out.ferryLegs += 1;
    }
  }
  return out;
}

async function handleDistanceLookup() {
  const originText = $('distOrigin').value.trim();
  const destText = $('distDest').value.trim();
  const hint = $('distLookupHint');
  const btn = $('distLookupGo');
  if (!originText || !destText) {
    hint.textContent = 'Enter both an origin and destination.';
    hint.style.color = 'var(--red)';
    return;
  }
  hint.style.color = '';
  hint.textContent = 'Resolving addresses…';
  btn.disabled = true;
  try {
    // Use cached coords if user picked from autocomplete; else geocode the text
    const origin = map.origin && map.origin.label === originText
      ? map.origin
      : await geocodeOne(originText);
    const dest = map.dest && map.dest.label === destText
      ? map.dest
      : await geocodeOne(destText);
    map.origin = origin; map.dest = dest;

    // Resolve any unresolved stops (typed but not picked from autocomplete)
    const stopsResolved = [];
    for (let i = 0; i < map.stops.length; i++) {
      const s = map.stops[i];
      if (s && s.lat != null && s.lon != null) {
        stopsResolved.push(s);
      } else if (s && s.label) {
        try {
          const g = await geocodeOne(s.label);
          map.stops[i] = g;
          stopsResolved.push(g);
        } catch (e) {
          // Skip unresolvable stops silently
        }
      }
    }

    hint.textContent = 'Computing routes…';
    const waypoints = [origin, ...stopsResolved, dest];
    // ORS supports avoid_features, avoid_borders ("stay in country"), and explicit
    // preference (fastest vs shortest). OSRM has none of those, but is free and
    // unauthenticated. We use ORS whenever a key is present so the user always
    // gets distinct fastest/most-efficient routes; falls back to OSRM otherwise.
    const avoid = collectAvoidFeatures();
    const useORS = !!window.__ORS_API_KEY;
    const data = useORS
      ? await routeViaORS(waypoints, avoid.features, { stayInCountry: avoid.stayInCountry })
      : await routeViaOSRM(waypoints, stopsResolved.length);
    if (!data.routes?.length) throw new Error('No drivable route found');

    map.routes = data.routes.map(rt => ({
      distance: rt.distance,
      duration: rt.duration,
      coords: rt.geometry.coordinates,
      legs: rt.legs || [],
      // ORS-only: per-segment toll/ferry markers used by estimateTollsAndFerries
      orsExtras: rt.extras || null,
      orsExtraDistances: rt.orsExtraDistances || null,
      avgSpeedKmh: (rt.distance / rt.duration) * 3.6,
      tollEstimate: null, // populated async after route is selected
      // Tagged when this route comes from an additive avoid pass — labelRoutes
      // uses these to render "No highways" / "No tolls" / etc. as their own cards.
      avoidLabel: rt.avoidLabel || null,
      avoidColor: rt.avoidColor || null,
    }));
    // Pick initial active route based on user preferences
    map.activeRoute = pickActiveRouteIdx();

    hint.style.color = 'var(--green)';
    const noteSuffix = avoidNoteSuffix();
    let droppedSuffix = '';
    if (Array.isArray(data.droppedPresets) && data.droppedPresets.length) {
      // Tell the user explicitly which preset(s) ORS couldn't return — most
      // common cause is the route exceeded ORS's 6,000 km distance cap when
      // combined with that preset's detour (e.g. "Eco" via back roads).
      const names = data.droppedPresets.map(p => p.label).join(', ');
      droppedSuffix = ` (${names} unavailable — likely too long for the routing service)`;
    }
    hint.textContent = `✓ ${map.routes.length} route${map.routes.length > 1 ? 's' : ''} found. Click a route to use it.${noteSuffix}${droppedSuffix}`;

    // selectRoute() drives station load, weather, toll-ferry, and auto-suggest.
    // It only fetches stations for the active route — no leftover stations from
    // alternates clutter the map.
    if (map.instance) clearStationLayer();
    selectRoute(map.activeRoute);
  } catch (e) {
    // Wipe any previous route state so the failure message isn't shown next to a
    // visibly successful old route — the most common confused-state bug when you
    // reroute, e.g. swapping the destination to a place across an ocean.
    if (map.instance) {
      clearRouteLayers();
      if (map.startMarker) { map.instance.removeLayer(map.startMarker); map.startMarker = null; }
      if (map.endMarker) { map.instance.removeLayer(map.endMarker); map.endMarker = null; }
      for (const m of map.stopMarkers || []) map.instance.removeLayer(m);
      map.stopMarkers = [];
    }
    map.routes = [];
    map.activeRoute = 0;
    renderRouteAlts();
    hint.style.color = 'var(--red)';
    hint.textContent = friendlyRouteError(e.message);
  } finally {
    btn.disabled = false;
  }
}

// Translate raw routing-engine errors into something a non-technical user
// can act on. The main hostile case is "no drivable route" between places that
// genuinely have no road link — typically separated by water.
function friendlyRouteError(msg) {
  const m = String(msg || '').toLowerCase();
  // ORS free tier caps total route distance at 6,000 km. Trigger when adding
  // many fuel stops to an already-long trip pushes total distance over that.
  if (m.includes('approximated route distance must not be greater')
      || m.includes('parameters exceed the server configuration limits')) {
    return "This route is too long for our free routing service (over ~6,000 km total). Try fewer fuel stops, or a shorter trip.";
  }
  // Match the major variants of "no route exists" across OSRM ("No drivable
  // route") and ORS ("Route could not be found", "Unable to find a route").
  if (m.includes('no drivable') || m.includes('no route') || m.includes('not found')
      || m.includes('could not be found') || m.includes('unable to find')) {
    return "No road connects these locations — they may be separated by water, or one of the addresses didn't resolve. Check each address, or remove an Avoid filter (especially Border crossings or Ferries).";
  }
  if (m.includes('couldn\'t locate') || m.includes('geocode')) {
    return `${msg}. Try a more specific address — include city and country.`;
  }
  if (m.includes('ors')) {
    return `Routing service: ${msg}`;
  }
  return `Couldn't compute: ${msg}`;
}

async function geocodeOne(q) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`Geocode failed (${res.status})`);
  const arr = await res.json();
  if (!arr || arr.length === 0) throw new Error(`Couldn't locate "${q}"`);
  return { lon: parseFloat(arr[0].lon), lat: parseFloat(arr[0].lat), label: arr[0].display_name };
}

function labelRoutes(routes) {
  if (routes.length === 0) return [];
  // For fastest / shortest, only consider untagged baseline routes — avoid-pass
  // routes already have explicit labels and shouldn't compete for "Fastest"
  // among the baseline trio.
  const baselineIdxs = routes
    .map((r, i) => (r.avoidLabel ? -1 : i))
    .filter(i => i >= 0);
  const minBy = (idxs, getter) =>
    idxs.length === 0 ? -1 : idxs.reduce((a, i) => getter(routes[i]) < getter(routes[a]) ? i : a, idxs[0]);
  const fastestIdx  = minBy(baselineIdxs, r => r.duration);
  const shortestIdx = minBy(baselineIdxs, r => r.distance);

  return routes.map((rt, i) => {
    // Tagged avoid passes always use their preset label/color.
    if (rt.avoidLabel) {
      return { label: rt.avoidLabel, color: rt.avoidColor || '#F472B6', key: 'avoid' };
    }
    const isFast  = i === fastestIdx;
    const isShort = i === shortestIdx;
    if (isFast && isShort && baselineIdxs.length > 1) {
      return { label: 'Fastest & most efficient', color: '#A855F7', key: 'both' };
    }
    if (isFast)  return { label: 'Fastest',             color: '#A855F7', key: 'fast' };
    if (isShort) return { label: 'Most fuel efficient', color: '#14B8A6', key: 'efficient' };
    // ORS's "recommended" preference call lands here — neither shortest nor
    // fastest, just a balanced default avoiding the most stressful roads.
    return { label: 'Balanced', color: '#60A5FA', key: 'balanced' };
  });
}

function pickActiveRouteIdx() {
  if (!map.routes.length) return 0;
  const avoidHwy = $('avoidHighways')?.checked;
  if (avoidHwy && map.routes.length > 1) {
    // Lowest avg speed = least highway-heavy
    return map.routes.reduce((a, rt, i) => rt.avgSpeedKmh < map.routes[a].avgSpeedKmh ? i : a, 0);
  }
  // Default: most fuel efficient (shortest distance)
  return map.routes.reduce((a, rt, i) => rt.distance < map.routes[a].distance ? i : a, 0);
}

function avoidNoteSuffix() {
  const highways      = $('avoidHighways')?.checked;
  const tolls         = $('avoidTolls')?.checked;
  const ferries       = $('avoidFerries')?.checked;
  const stayInCountry = $('stayInCountry')?.checked;
  if (!highways && !tolls && !ferries && !stayInCountry) return '';
  const parts = [
    highways && 'highways',
    tolls && 'tolls',
    ferries && 'ferries',
    stayInCountry && 'border crossings',
  ].filter(Boolean);
  const which = parts.join(' & ');
  if (!window.__ORS_API_KEY) {
    return ` Note: ${which} can't be filtered — ORS key not configured locally.`;
  }
  return ` Routed avoiding ${which}.`;
}

function routeFuelEstimate(routeKm) {
  const baseL = effectiveL100km(state.pickedVehicle, state.customEff, state.vehicleMode, state.cityMixPct);
  const adjL = applyAdjustments(baseL, state.drivingStyle, state.conditions);
  if (adjL <= 0) return null;
  const fuelL = (adjL * routeKm) / 100;
  const us = UNIT_SYSTEMS[state.unitSystem];
  const country = getCountry(state.country);
  const priceCanonical = priceDisplayToPerL(state.price || 0, us.volume);
  const cost = priceCanonical > 0 ? fuelL * priceCanonical : null;
  return {
    fuelL,
    volDisp: fromLitre(fuelL, us.volume),
    volLabel: us.volLabel,
    cost,
    sym: country.symbol,
    currency: country.currency,
  };
}

function plotRoutes() {
  const m = ensureMap();
  setTimeout(() => m.invalidateSize(), 30);
  clearRouteLayers(); // keep station layer intact — it doesn't depend on which route is active
  if (!map.origin || !map.dest) return;

  // Origin / destination markers — draggable so users can fine-tune the route
  // by dropping the marker at a new spot. On dragend we reverse-geocode the new
  // coords for a friendly label and re-fetch the route.
  const startIcon = L.divIcon({ className: 'map-pin map-pin-start', html: 'A', iconSize: [28, 28] });
  const endIcon = L.divIcon({ className: 'map-pin map-pin-end', html: 'B', iconSize: [28, 28] });
  map.startMarker = L.marker([map.origin.lat, map.origin.lon], { icon: startIcon, draggable: true })
    .bindPopup(`<strong>Start</strong><br>${escapeHtml(map.origin.label)} <em>(drag to move)</em>`).addTo(m);
  map.endMarker = L.marker([map.dest.lat, map.dest.lon], { icon: endIcon, draggable: true })
    .bindPopup(`<strong>End</strong><br>${escapeHtml(map.dest.label)} <em>(drag to move)</em>`).addTo(m);
  map.startMarker.on('dragend', e => handleMarkerDrag('origin', null, e.target.getLatLng()));
  map.endMarker.on('dragend',   e => handleMarkerDrag('dest', null, e.target.getLatLng()));

  // Stop waypoint markers — color interpolates between start (A) and end (B)
  // so a chain of stops reads as "ramp from A's color to B's color."
  map.stops.forEach((s, i) => {
    if (s.lat == null || s.lon == null) return;
    const color = waypointGradientColor(i + 1, map.stops.length + 1);
    // Inline color via a wrapper element so currentColor in the CSS picks it up
    const iconHtml = `<div style="color:${color};display:grid;place-items:center;width:100%;height:100%;font-weight:700;font-family:var(--font-mono);font-size:11px;box-shadow:0 2px 8px ${color}55;border-radius:50%;background:var(--bg-elev);border:2px solid ${color};">${i + 1}</div>`;
    const stopIcon = L.divIcon({ className: 'map-pin-stop-wrap', html: iconHtml, iconSize: [26, 26], iconAnchor: [13, 13] });
    const m2 = L.marker([s.lat, s.lon], { icon: stopIcon, draggable: true })
      .bindPopup(`<strong>Stop ${i + 1}</strong><br>${escapeHtml(s.label || '')} <em>(drag to move)</em>`).addTo(m);
    m2.on('dragend', e => handleMarkerDrag('stop', i, e.target.getLatLng()));
    map.stopMarkers.push(m2);
  });

  const labels = labelRoutes(map.routes);
  // Draw alternatives — inactive ones first (under), active last (on top)
  const ordered = map.routes.map((r, i) => ({ r, i }));
  ordered.sort((a, b) => (a.i === map.activeRoute ? 1 : 0) - (b.i === map.activeRoute ? 1 : 0));
  for (const { r, i } of ordered) {
    const isActive = i === map.activeRoute;
    const color = labels[i].color;
    const latlngs = r.coords.map(c => [c[1], c[0]]);
    const layer = L.polyline(latlngs, {
      color,
      weight: isActive ? 5 : 4,
      opacity: isActive ? 0.95 : 0.45,
    }).addTo(m);
    if (!isActive) {
      layer.on('click', () => selectRoute(i));
      layer.bindTooltip(`${labels[i].label}: ${fmtNumber(r.distance / 1000, 1)} km — click to use`);
    }
    map.routeLayers[i] = layer;
  }

  // Fit map to active route
  if (map.routeLayers[map.activeRoute]) {
    m.fitBounds(map.routeLayers[map.activeRoute].getBounds(), { padding: [40, 40] });
  }
}

function renderRouteAlts() {
  const wrap = $('routeAlts');
  if (!map.routes.length) { wrap.hidden = true; return; }
  wrap.hidden = false;
  const trafLabel = trafficLabel(state.departAt);
  wrap.innerHTML = `<h3 class="route-alts-title">Pick a route <small style="font-weight:500;text-transform:none;letter-spacing:0;color:var(--text-fade)" title="Live traffic and real-time road-closure data require a paid routing service. Times below are free-flow durations adjusted by a static rush-hour heuristic based on your selected departure."> · ${escapeHtml(trafLabel)}</small></h3>`;
  const us = UNIT_SYSTEMS[state.unitSystem];
  const labels = labelRoutes(map.routes);
  const trafficMult = trafficDurationMultiplier(state.departAt);
  map.routes.forEach((r, i) => {
    const km = r.distance / 1000;
    // Adjust free-flow duration with a traffic-time-of-day multiplier so the
    // displayed minutes are closer to what Google Maps shows for typical traffic.
    const correctedSec = r.duration * trafficMult;
    const mins = Math.round(correctedSec / 60);
    const hrs = Math.floor(mins / 60);
    const remMin = mins % 60;
    const timeStr = hrs ? `${hrs}h ${remMin}min` : `${mins} min`;
    const distDisp = fromKm(km, us.distance);
    const isActive = i === map.activeRoute;
    const lbl = labels[i];

    const fuelEst = routeFuelEstimate(km);
    let fuelHtml = '';
    if (fuelEst) {
      const volStr = `${fmtNumber(fuelEst.volDisp, 1)} ${fuelEst.volLabel}`;
      if (fuelEst.cost != null) {
        fuelHtml = `<span class="route-alt-fuel">⛽ ${volStr} · <strong>${fuelEst.sym}${fmtNumber(fuelEst.cost, moneyDigits(fuelEst.currency))}</strong></span>`;
      } else {
        fuelHtml = `<span class="route-alt-fuel">⛽ ${volStr}</span>`;
      }
    }

    const div = document.createElement('div');
    div.className = 'route-alt' + (isActive ? ' active' : '');
    div.innerHTML = `
      <div class="route-alt-bar" style="background:${lbl.color}"></div>
      <div class="route-alt-info">
        <div class="route-alt-name">${escapeHtml(lbl.label)}</div>
        <div class="route-alt-stats">
          <span class="route-alt-dist">${fmtNumber(distDisp, 1)} ${us.distLabel}</span>
          <span class="route-alt-time">${timeStr}</span>
          ${fuelHtml}
        </div>
      </div>
      <button class="route-alt-pick" type="button">${isActive ? '✓ Selected' : 'Use this'}</button>
    `;
    div.addEventListener('click', (e) => {
      if (e.target.closest('.route-alt-pick') || !isActive) selectRoute(i);
    });
    wrap.appendChild(div);
  });
}

function selectRoute(idx) {
  if (idx < 0 || idx >= map.routes.length) return;
  map.activeRoute = idx;

  // Apply this route's distance to the calculator
  const km = map.routes[idx].distance / 1000;
  const us = UNIT_SYSTEMS[state.unitSystem];
  const display = parseFloat(fromKm(km, us.distance).toFixed(1));
  state.distance = display;
  $('distanceInput').value = String(display);
  update();

  if (map.instance) plotRoutes(); // redraws route polylines (active highlighted)
  renderRouteAlts();

  // Update info bar.
  $('mapInfo').textContent = `${fmtNumber(km, 1)} km active route`;

  // Stations are route-specific — reload them whenever the active route changes
  // so the user only sees stations along the path they're actually taking.
  // Caching the stations per route would also work, but a fresh fetch keeps
  // station data current without an explicit invalidation.
  loadStationsForActiveRoute();

  // Update active-route weather. Cached on the route the first time so route
  // switching is instant after that.
  applyRouteWeather(idx);

  // Kick off (or refresh from cache) the toll/ferry estimate for this route.
  applyTollFerryEstimate(idx);

  // If the route is long enough that the user's tank can't make it in one go,
  // auto-suggest fuel stops along the way. Only fires when no stops have been
  // set yet — once the user has added their own, we leave the route alone.
  maybeAutoSuggestFuelStops();
}

// Conservative trigger for "Suggest fuel stops": only when there's a route,
// the user has a tank size, no stops are already set, and the trip exceeds
// 70% of the tank range. The suggestFuelStops() call sets stops and
// re-fetches; the resulting selectRoute sees stops.length > 0 and skips.
function maybeAutoSuggestFuelStops() {
  if (!map.routes.length || !map.routes[map.activeRoute]) return;
  if ((map.stops || []).length > 0) return;
  if (!state.tankSize || state.tankSize <= 0) return;
  // Skip if we already tried suggesting stops for this exact route — even
  // if the attempt found nothing (e.g. Overpass rate-limited or no nearby
  // stations). Without this stamp, every selectRoute on the same route
  // re-arms the auto-suggest timer.
  if (map.routes[map.activeRoute].autoSuggestTried) return;
  if (suggestStopsInFlight) return;

  const baseL = effectiveL100km(state.pickedVehicle, state.customEff, state.vehicleMode, state.cityMixPct);
  const wMult = state.ignoreWeather ? 1.0 : weatherFuelMultiplier(state.routeWeather);
  const adjL = applyAdjustments(baseL, state.drivingStyle, state.conditions, wMult);
  if (!adjL) return;

  const us = UNIT_SYSTEMS[state.unitSystem];
  const tankL = toLitre(state.tankSize, us.volume);
  const tankRangeKm = (tankL / adjL) * 100;
  const totalKm = map.routes[map.activeRoute].distance / 1000;
  if (totalKm < tankRangeKm * 0.7) return;

  // Don't block the active call stack — suggestFuelStops runs Overpass queries
  // and re-fetches the route, which would interleave awkwardly with selectRoute's
  // downstream work.
  setTimeout(() => suggestFuelStops(), 60);
}

// Compute (or pull cached) weather at the route midpoint and apply it. Causes
// the cost calculation to refresh — fetch failures silently keep the existing
// reading, so a network blip doesn't blank the column.
async function applyRouteWeather(idx) {
  const route = map.routes[idx];
  if (!route) return;
  if (route.weather === undefined) {
    route.weather = null; // mark as "in flight" so we don't refetch
    const w = await fetchRouteWeather(route);
    route.weather = w; // { samples: [...], midpoint: {...} } | null
  }
  if (idx !== map.activeRoute) return;
  state.routeWeather = route.weather?.midpoint || null;
  state.routeWeatherSamples = route.weather?.samples || null;
  renderWeatherCard();
  update();
}

// Clears cached weather on every route so the next applyRouteWeather() call
// re-fetches with the new departAt setting. Cheap — weather is small JSON.
function invalidateRouteWeatherCache() {
  for (const r of map.routes || []) {
    delete r.weather;
  }
}

// Render the right-column "Weather along your route" card with multi-point
// samples. Hides the static Quick Tips card while a route is loaded so the
// space is used for actually-relevant info. Card title reflects whether we're
// showing the current snapshot or a forecast at the chosen departure time.
function renderWeatherCard() {
  const card  = $('weatherCard');
  const tips  = $('tipsCard');
  const title = card?.querySelector('.tips-title');
  const body  = $('weatherForecastBody');
  const samples = state.routeWeatherSamples || [];
  if (!card || !body) return;

  if (!samples.length) {
    card.hidden = true;
    if (tips) tips.hidden = false;
    return;
  }
  card.hidden = false;
  if (tips) tips.hidden = true;

  // Title: "Forecast for your departure" if forecast samples, else current snapshot.
  const isForecast = !!samples[0]?.forecast;
  if (title) {
    if (isForecast) {
      const t = samples[0].forTime ? new Date(samples[0].forTime) : null;
      const dayLabel = t ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][t.getDay()] : '';
      const dateLabel = t ? `${dayLabel} ${String(t.getMonth() + 1).padStart(2, '0')}/${String(t.getDate()).padStart(2, '0')} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}` : '';
      title.textContent = `Forecast for ${dateLabel}`;
    } else {
      title.textContent = 'Weather along your route';
    }
  }

  // Compute the worst-case multiplier across all samples — a single midpoint
  // reading underweights a snowstorm at the destination if the start was clear.
  const worstMult = samples.reduce((max, s) => Math.max(max, weatherFuelMultiplier(s)), 1.0);
  const worstPct = Math.round((worstMult - 1) * 100);

  // For forecast mode, each sample's forTime differs (start-of-trip vs end-of-trip)
  // so we surface the per-sample timestamp inline.
  const fmtTime = iso => {
    if (!iso) return '';
    const t = new Date(iso);
    return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  };

  const rowsHtml = samples.map(s => {
    const [emoji, label] = describeWeatherCode(s.weatherCode);
    const wind = isFinite(s.windKmh) && s.windKmh >= 15 ? ` · 💨 ${Math.round(s.windKmh)} km/h` : '';
    const timeBadge = (s.forecast && s.forTime) ? `<span class="weather-when">${fmtTime(s.forTime)}</span>` : '';
    return `
      <div class="weather-row">
        <span class="weather-where">${escapeHtml(s.label)}${timeBadge}</span>
        <span class="weather-emoji" aria-hidden="true">${emoji}</span>
        <span class="weather-temp">${Math.round(s.tempC)}°C</span>
        <span class="weather-cond">${escapeHtml(label)}${wind}</span>
      </div>
    `;
  }).join('');

  const summaryParts = [];
  if (worstPct > 0) {
    summaryParts.push(`Worst-case fuel impact along this route: <strong>+${worstPct}%</strong>.`);
  } else {
    summaryParts.push('No significant weather drag on fuel use.');
  }
  if (!isForecast && state.departAt) {
    summaryParts.push('<br><small>Showing current weather — your departure is too soon or too far out for an hourly forecast.</small>');
  } else if (!isForecast) {
    summaryParts.push('<br><small>Pick a departure time above to see a forecast for your trip.</small>');
  }

  body.innerHTML = rowsHtml + `<p class="weather-summary">${summaryParts.join(' ')}</p>`;
}

// Compute, cache, and apply a toll/ferry estimate for a route. If the user has
// not manually overridden the Tolls input, pre-fills it with the estimate and
// updates the small breakdown note.
async function applyTollFerryEstimate(idx) {
  const route = map.routes[idx];
  if (!route) return;
  // Show "estimating…" state while in flight
  if (route.tollEstimate == null) {
    route.tollEstimate = 'pending';
    renderTollFerryNote(null, 'pending');
    try {
      const country = getCountry(state.country);
      route.tollEstimate = await estimateTollsAndFerries(route, country);
    } catch {
      route.tollEstimate = { error: true, tollKm: 0, ferryKm: 0, tollCost: 0, ferryCost: 0 };
    }
  }
  // If the user has switched routes during the await, only apply if still active
  if (idx !== map.activeRoute) return;
  const est = route.tollEstimate;
  if (!est || est === 'pending') return;
  if (!state.tollsTouched) {
    const total = (est.tollCost || 0) + (est.ferryCost || 0);
    if (total > 0.01) {
      state.tolls = parseFloat(total.toFixed(2));
      $('tollsInput').value = state.tolls.toFixed(2);
      update();
    } else if (state.tolls > 0) {
      // Previous route had tolls/ferries, this one doesn't — clear the auto-fill
      state.tolls = 0;
      $('tollsInput').value = '';
      update();
    }
  }
  renderTollFerryNote(est, 'ready');
}

// Renders the small breakdown line under the Trip-extras row showing how the
// auto-filled Tolls value was derived. Hidden when the route has no tolls
// or ferries to report.
function renderTollFerryNote(est, status) {
  const note = $('tollsAutoNote');
  if (!note) return;
  if (status === 'pending') {
    note.hidden = false;
    note.innerHTML = `<span class="auto-note-icon">⏳</span><span>Estimating tolls and ferries on this route…</span>`;
    return;
  }
  if (!est || (est.tollKm < 0.1 && est.ferryKm < 0.1)) {
    note.hidden = true;
    note.innerHTML = '';
    return;
  }
  const country = getCountry(state.country);
  const us = UNIT_SYSTEMS[state.unitSystem];
  const sym = country.symbol;
  // Money is shown 2dp regardless of fuel-price precision (cents, not millicents).
  const moneyFmt = v => `${sym}${v.toFixed(2)}`;
  const parts = [];
  if (est.tollKm >= 0.1) {
    const distDisplay = fmtNumber(fromKm(est.tollKm, us.distance), 1);
    parts.push(`~${distDisplay} ${us.distLabel} tolls (≈${moneyFmt(est.tollCost)})`);
  }
  if (est.ferryKm >= 0.1) {
    const distDisplay = fmtNumber(fromKm(est.ferryKm, us.distance), 1);
    parts.push(`${est.ferryLegs} ferry crossing${est.ferryLegs === 1 ? '' : 's'} · ~${distDisplay} ${us.distLabel} (≈${moneyFmt(est.ferryCost)})`);
  }
  const editedHint = state.tollsTouched
    ? '. Auto-fill paused — clear the field to re-enable.'
    : '. Auto-filled the Tolls field above.';
  note.hidden = false;
  note.innerHTML = `<span class="auto-note-icon">🛣️</span><span><strong>Route includes:</strong> ${parts.join(' · ')}${editedHint}</span>`;
}

// Load gas stations only along the user's CURRENTLY-SELECTED route. Switching
// routes triggers a fresh load — old behavior was to load the union of all
// routes' bbox, which left irrelevant stations from rejected alternatives on
// the map. Shows a visible loading badge over the map while in flight.
async function loadStationsForActiveRoute() {
  if (!map.instance || !map.routes.length) return;
  const route = map.routes[map.activeRoute];
  if (!route) return;
  const myGen = ++stationGen;
  showStationsLoading(true);
  $('mapInfo').textContent = 'Searching gas stations…';
  // Convert ORS/OSRM [lon,lat] into [lat,lng] tuples for the rest of the pipeline.
  const routeLatLngs = route.coords.map(c => [c[1], c[0]]);
  try {
    const count = await loadGasStationsAlongRoute(routeLatLngs, myGen);
    if (myGen !== stationGen) return; // a newer load superseded this one
    map.stationCount = count;
    const km = route.distance / 1000;
    $('mapInfo').textContent = `${count} fuel stations · ${fmtNumber(km, 1)} km active route`;
  } catch (err) {
    if (myGen !== stationGen) return;
    map.stationCount = 0;
    const km = route.distance / 1000;
    $('mapInfo').textContent = `${fmtNumber(km, 1)} km route · stations unavailable`;
  } finally {
    if (myGen === stationGen) showStationsLoading(false);
  }
}

// Backward-compat alias — older call sites still use the previous name.
const loadStationsForAllRoutes = loadStationsForActiveRoute;

// Shows / hides a clearly-visible loading overlay on the map while station
// data fetches. Long routes can take 15-30s on Overpass under load — without
// this users assume the app is broken.
function showStationsLoading(active) {
  let overlay = document.getElementById('mapStationLoader');
  if (active) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'mapStationLoader';
      overlay.className = 'map-station-loader';
      overlay.innerHTML = '<span class="map-loader-spinner"></span><span>Searching fuel stations along your route…</span>';
      document.querySelector('.map-container')?.appendChild(overlay);
    }
    overlay.hidden = false;
  } else if (overlay) {
    overlay.hidden = true;
  }
}

/* =========================
   ADDRESS AUTOCOMPLETE (Nominatim)
   ========================= */
// Country-name overrides applied to every Nominatim/Overpass response before it
// reaches the UI. Currently maps "Israel" → "Palestine" per the project owner's
// labeling choice. NOTE: the underlying CartoDB map tiles still render "Israel"
// at the country/city level — those are server-rendered raster images we can't
// intercept. Only text the app generates flows through this function.
function rewriteCountry(name) {
  if (!name) return name;
  return String(name).replace(/\bIsrael\b/g, 'Palestine');
}
function applyCountryOverridesToAddress(a) {
  if (!a) return a;
  if (a.country) a.country = rewriteCountry(a.country);
  if (a.country_code === 'il') a.country_code = 'ps';
  return a;
}

function formatNominatimSuggestion(r) {
  if (r) {
    if (r.address) applyCountryOverridesToAddress(r.address);
    if (r.display_name) r.display_name = rewriteCountry(r.display_name);
  }
  const a = r.address || {};
  let main = '', sub = '';
  // Prefer structured fields when available
  if (a.house_number && a.road) {
    main = `${a.house_number} ${a.road}`;
    sub = [a.suburb || a.neighbourhood, a.city || a.town || a.village || a.hamlet, a.state, a.country].filter(Boolean).join(', ');
  } else if (a.road) {
    main = a.road;
    sub = [a.suburb || a.neighbourhood, a.city || a.town || a.village, a.state, a.country].filter(Boolean).join(', ');
  } else if (a.city || a.town || a.village || a.hamlet) {
    main = a.city || a.town || a.village || a.hamlet;
    sub = [a.state || a.county, a.country].filter(Boolean).join(', ');
  } else if (a.county) {
    main = a.county;
    sub = [a.state, a.country].filter(Boolean).join(', ');
  } else if (a.state) {
    main = a.state;
    sub = a.country || '';
  } else if (a.country) {
    main = a.country;
    sub = '';
  } else if (r.name) {
    main = r.name;
    sub = r.display_name || '';
  } else {
    // Fallback parsing — combine numeric first segment with second
    const parts = (r.display_name || '').split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2 && /^\d+[a-z]?$/i.test(parts[0])) {
      main = `${parts[0]} ${parts[1]}`;
      sub = parts.slice(2).join(', ');
    } else {
      main = parts[0] || '';
      sub = parts.slice(1).join(', ');
    }
  }
  // For the input value, use a friendlier "main, city, country" rather than the entire display_name.
  const value = sub ? `${main}, ${sub.split(',').slice(-2).join(',').trim()}` : main;
  return { main, sub, value };
}

function attachAddressAutocomplete(inputEl, dropdownEl, onSelect) {
  let timer = null;
  let activeIdx = -1;
  let suggestions = [];

  function render() {
    if (suggestions.length === 0) {
      dropdownEl.innerHTML = '<div class="autocomplete-empty">No matches</div>';
      return;
    }
    dropdownEl.innerHTML = '';
    suggestions.forEach((r, i) => {
      const { main, sub } = formatNominatimSuggestion(r);
      const div = document.createElement('div');
      div.className = 'autocomplete-item' + (i === activeIdx ? ' active' : '');
      div.innerHTML = `<span class="ac-main">${escapeHtml(main)}</span>${sub ? `<span class="ac-sub">${escapeHtml(sub)}</span>` : ''}`;
      div.addEventListener('mousedown', (e) => {
        e.preventDefault();
        pick(i);
      });
      div.addEventListener('mouseenter', () => {
        activeIdx = i;
        dropdownEl.querySelectorAll('.autocomplete-item.active').forEach(x => x.classList.remove('active'));
        div.classList.add('active');
      });
      dropdownEl.appendChild(div);
    });
  }

  function pick(i) {
    const r = suggestions[i];
    if (!r) return;
    const fmt = formatNominatimSuggestion(r);
    inputEl.value = fmt.value || r.display_name;
    dropdownEl.hidden = true;
    onSelect({ lon: parseFloat(r.lon), lat: parseFloat(r.lat), label: fmt.value || r.display_name });
  }

  inputEl.addEventListener('input', (e) => {
    clearTimeout(timer);
    onSelect(null); // clear cached coords
    const q = e.target.value.trim();
    if (q.length < 3) {
      dropdownEl.hidden = true;
      return;
    }
    dropdownEl.innerHTML = '<div class="autocomplete-loading">Searching…</div>';
    dropdownEl.hidden = false;
    timer = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) throw new Error('search failed');
        suggestions = await res.json();
        activeIdx = 0;
        render();
      } catch (err) {
        dropdownEl.innerHTML = '<div class="autocomplete-empty">Search failed</div>';
      }
    }, 350);
  });

  inputEl.addEventListener('keydown', (e) => {
    if (dropdownEl.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(suggestions.length - 1, activeIdx + 1); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(0, activeIdx - 1); render(); }
    else if (e.key === 'Enter') {
      if (suggestions.length > 0) { e.preventDefault(); pick(activeIdx); }
    }
    else if (e.key === 'Escape') { dropdownEl.hidden = true; }
  });

  inputEl.addEventListener('blur', () => setTimeout(() => { dropdownEl.hidden = true; }, 200));
  inputEl.addEventListener('focus', () => {
    if (dropdownEl.children.length > 0 && suggestions.length > 0) dropdownEl.hidden = false;
  });
}

async function loadGasStationsAlongRoute(routeLatLngs, expectedGen = stationGen) {
  // Old approach: one Overpass query against the route's full bbox, then
  // filter client-side to within 2.5km of the polyline. For a Toronto-Vancouver
  // route the bbox covers ~5 million km² — Overpass would return tens of
  // thousands of stations and frequently time out on the public instance.
  //
  // New approach: sample the polyline every ~8km and ask Overpass for fuel
  // amenities WITHIN 2500m of those sample points only. The "around" filter
  // does the spatial work server-side, the corridor stays narrow regardless
  // of route length, and queries finish in seconds even on cross-continent
  // trips.
  const SAMPLE_KM = 8;
  const RADIUS_M = 2500;

  // Walk the polyline accumulating distance; emit a sample every SAMPLE_KM.
  const samples = [];
  if (routeLatLngs.length) samples.push(routeLatLngs[0]);
  let walked = 0;
  for (let i = 1; i < routeLatLngs.length; i++) {
    const [lat0, lng0] = routeLatLngs[i - 1];
    const [lat1, lng1] = routeLatLngs[i];
    walked += haversineKm(lat0, lng0, lat1, lng1);
    if (walked >= SAMPLE_KM) {
      samples.push(routeLatLngs[i]);
      walked = 0;
    }
  }
  // Always include the destination so we don't miss the last 8km.
  if (routeLatLngs.length) samples.push(routeLatLngs[routeLatLngs.length - 1]);

  // Cap how many anchors we send — the Overpass URL has size limits, and
  // 250 anchors × 8km = 2,000km of corridor, which is plenty for any trip.
  const CAP = 250;
  const sampled = samples.length > CAP
    ? samples.filter((_, i) => i % Math.ceil(samples.length / CAP) === 0)
    : samples;

  const aroundClauses = sampled
    .map(([lat, lng]) => `node["amenity"="fuel"](around:${RADIUS_M},${lat.toFixed(4)},${lng.toFixed(4)});`)
    .join('');
  const query = `[out:json][timeout:30];(${aroundClauses});out body 250;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: 'data=' + encodeURIComponent(query),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!res.ok) throw new Error('Overpass error');
  const data = await res.json();
  // Stale-check BEFORE we touch map.stationLayer — a newer route may have
  // already painted its stations while we were awaiting the network. Without
  // this guard, our soon-to-be-stale removeLayer/addTo would clobber it.
  if (expectedGen !== stationGen) return 0;
  // Dedupe — overlapping `around:` buffers will return the same node multiple times.
  const seen = new Set();
  let stations = (data.elements || []).filter(s => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
  // Final 2.5km client-side filter against the actual polyline (narrows down
  // any anchor-corridor over-spill).
  stations = stations.filter(s => isNearRoute(s.lat, s.lon, routeLatLngs, 2.5));
  // Limit
  stations = stations.slice(0, 80);

  if (map.stationLayer) map.instance.removeLayer(map.stationLayer);
  map.stationLayer = L.layerGroup().addTo(map.instance);

  for (const s of stations) {
    // Gas-station fill is a punchy yellow against the dark map and pops against
    // both the green start marker and purple end marker. White outline gives
    // contrast on the lighter voyager basemap too.
    const marker = L.circleMarker([s.lat, s.lon], {
      radius: 7,
      color: '#FBBF24',
      fillColor: '#FBBF24',
      weight: 2.5,
      fillOpacity: 1,
    }).bindPopup(() => stationPopupHtml(s));
    marker.addTo(map.stationLayer);
  }
  return stations.length;
}

function stationPopupHtml(station) {
  const name = station.tags?.name || station.tags?.brand || 'Fuel station';
  const brand = station.tags?.brand || station.tags?.operator || '';
  const sym = getCountry(state.country).symbol;
  const us = UNIT_SYSTEMS[state.unitSystem];
  const street = station.tags?.['addr:street'] || '';
  const city = station.tags?.['addr:city'] || '';
  const houseNum = station.tags?.['addr:housenumber'] || '';
  const stateProv = station.tags?.['addr:state'] || station.tags?.['addr:province'] || '';
  const country = rewriteCountry(station.tags?.['addr:country'] || '');
  // Most-specific search string GasBuddy will accept. They don't expose deep links
  // to individual station pages, so this lands the user on a list with this station
  // typically in position 1.
  const addressParts = [houseNum, street, city, stateProv, country].filter(Boolean).join(' ').trim();
  const queryStr = addressParts ? `${name} ${addressParts}` : `${name} ${station.lat.toFixed(4)},${station.lon.toFixed(4)}`;
  const gbUrl = `https://www.gasbuddy.com/home?search=${encodeURIComponent(queryStr)}`;
  // Saved local report?
  const saved = getStationPriceReport(station.id);
  const savedHtml = saved
    ? `<div class="popup-saved" data-saved-price="${saved.price}">
         <div class="popup-saved-row">
           <span class="popup-saved-label">⛽ Last reported here</span>
           <span class="popup-saved-time">${escapeHtml(relativeAge(saved.timestamp))}</span>
         </div>
         <div class="popup-saved-row">
           <span class="popup-saved-value">${escapeHtml(saved.sym)}${saved.price.toFixed(3)}/${escapeHtml(saved.volLabel)}</span>
           <button class="popup-saved-use" type="button" data-use-saved>Use again</button>
         </div>
       </div>`
    : '';
  return `<div class="station-popup" data-station-id="${station.id}" data-station-lat="${station.lat}" data-station-lon="${station.lon}" data-station-name="${escapeHtml(name)}">
    <strong>${escapeHtml(name)}</strong>
    ${brand && brand.toLowerCase() !== name.toLowerCase() ? `<div class="popup-sub">${escapeHtml(brand)}</div>` : ''}
    ${savedHtml}
    <button class="popup-stop popup-stop-primary" type="button" data-add-stop>
      ➕ Add as fuel stop on this route
    </button>
    <a href="${gbUrl}" target="_blank" rel="noopener noreferrer" class="popup-gb-primary" title="Open this station on GasBuddy in a new tab">
      ⛽ Check GasBuddy for live price
    </a>
    <div class="popup-input">
      <label>${saved ? 'Update price' : 'Saw a price? Apply it'}</label>
      <div class="popup-price-row">
        <span>${escapeHtml(sym)}</span>
        <input type="number" step="0.001" min="0" placeholder="0.000" data-station-price>
        <span>/${escapeHtml(us.volLabel)}</span>
      </div>
      <button class="popup-apply" type="button" data-apply-price>Use this price</button>
    </div>
  </div>`;
}

function bindStationPopupHandlers() {
  if (!map.instance) return;
  map.instance.on('popupopen', (e) => {
    const node = e.popup._contentNode;
    if (!node) return;
    const popupRoot = node.querySelector('.station-popup');
    const inp = node.querySelector('[data-station-price]');
    const applyBtn = node.querySelector('[data-apply-price]');
    const stopBtn = node.querySelector('[data-add-stop]');
    if (inp) {
      setTimeout(() => inp.focus(), 50);
      inp.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' && applyBtn) { ev.preventDefault(); applyBtn.click(); }
      });
    }
    const applyPrice = (v, label) => {
      const country = getCountry(state.country);
      const us = UNIT_SYSTEMS[state.unitSystem];
      state.price = v;
      state.priceTouched = true;
      $('priceInput').value = v.toFixed(priceDigits(country.currency));
      $('priceHint').textContent = 'Custom price (from station)';
      update();
      // Persist to per-station memory
      const stationId = popupRoot?.dataset.stationId;
      if (stationId) saveStationPriceReport(stationId, v, country.currency, us.volLabel, country.symbol);
      const stationName = popupRoot?.dataset.stationName || 'station';
      showToast(`${label || 'Price'} ${country.symbol}${v} applied from ${stationName}`);
      map.instance.closePopup();
    };
    if (applyBtn && inp) {
      applyBtn.addEventListener('click', () => {
        const v = parseFloat(inp.value);
        if (!isFinite(v) || v <= 0) {
          inp.style.borderColor = 'var(--red)';
          return;
        }
        applyPrice(v, 'New price');
      });
    }
    // Re-use the saved price
    const useSavedBtn = node.querySelector('[data-use-saved]');
    if (useSavedBtn && popupRoot) {
      useSavedBtn.addEventListener('click', () => {
        const saved = popupRoot.querySelector('[data-saved-price]');
        const v = parseFloat(saved?.dataset.savedPrice);
        if (!isFinite(v) || v <= 0) return;
        applyPrice(v, 'Saved price');
      });
    }
    if (stopBtn && popupRoot) {
      stopBtn.addEventListener('click', () => {
        const lat = parseFloat(popupRoot.dataset.stationLat);
        const lon = parseFloat(popupRoot.dataset.stationLon);
        const label = popupRoot.dataset.stationName || 'Fuel station';
        if (!isFinite(lat) || !isFinite(lon)) return;
        map.stops.push({ lat, lon, label });
        renderStops();
        showToast(`Added ${label} as fuel stop`);
        map.instance.closePopup();
        if (map.origin && map.dest) handleDistanceLookup();
      });
    }
  });
}

function toggleMapClickMode() {
  map.clickMode = !map.clickMode;
  const btn = $('mapClickModeBtn');
  const lbl = $('mapClickModeLabel');
  btn.setAttribute('aria-pressed', map.clickMode ? 'true' : 'false');
  lbl.textContent = map.clickMode ? 'Click map…' : 'Map my own route';
  if (map.instance) {
    map.instance.getContainer().style.cursor = map.clickMode ? 'crosshair' : '';
  }
  if (map.clickMode) {
    const next = !map.origin ? 'start (A)' : !map.dest ? 'destination (B)' : 'a fuel stop';
    showToast(`Click the map to set ${next}. Click again to add the next point.`);
  }
}

// Cap the number of fuel-stop suggestions per click. ORS's free tier rejects
// total route distances over 6,000,000 meters, and each waypoint adds detour
// length on top of the base trip; capping at 6 keeps even cross-continent
// trips inside the limit, and 6 stops is plenty for any realistic refuel cadence.
const SUGGEST_STOPS_CAP = 6;
// In-flight guard: a rapid double-click would otherwise race two parallel
// Overpass batches and two re-route cascades. Tracked at module scope so the
// auto-suggest path (setTimeout-scheduled) and the manual button path share it.
let suggestStopsInFlight = false;

async function suggestFuelStops() {
  if (suggestStopsInFlight) return;
  if (!map.routes.length || !map.routes[map.activeRoute]) {
    showToast('Calculate a route first', 'error'); return;
  }
  if (!state.tankSize || state.tankSize <= 0) {
    showToast('Set your tank size in Trip extras first', 'error'); return;
  }
  // Snapshot origin for the post-await sort. If the user clicks Clear route
  // mid-Overpass, map.origin gets nulled and `map.origin.lat` would crash.
  const originSnap = map.origin && isFinite(map.origin.lat) ? { ...map.origin } : null;
  if (!originSnap) {
    showToast('Set a start and destination first', 'error'); return;
  }
  suggestStopsInFlight = true;
  const suggestBtn = $('suggestStopsBtn');
  if (suggestBtn) suggestBtn.disabled = true;
  // The early-return paths below need to release the in-flight guard.
  // Wrap everything in try/finally so the guard is always cleared, even on
  // throw, and the suggest button is re-enabled.
  const release = () => {
    suggestStopsInFlight = false;
    if (suggestBtn) suggestBtn.disabled = false;
  };
  try {
    const baseL = effectiveL100km(state.pickedVehicle, state.customEff, state.vehicleMode, state.cityMixPct);
    const wMult = state.ignoreWeather ? 1.0 : weatherFuelMultiplier(state.routeWeather);
    const adjL = applyAdjustments(baseL, state.drivingStyle, state.conditions, wMult);
    if (!adjL) { showToast('Pick a vehicle or enter custom efficiency first', 'error'); release(); return; }

    // Stamp the active route so the auto-suggest path doesn't re-arm itself
    // on every selectRoute when the user has already dismissed/processed stops
    // for this exact route. Cleared if the user manually clears the route.
    const activeRoute = map.routes[map.activeRoute];
    activeRoute.autoSuggestTried = true;

    // Convert tank size to litres for math
    const us = UNIT_SYSTEMS[state.unitSystem];
    const tankL = toLitre(state.tankSize, us.volume);
    const tankRangeKm = (tankL / adjL) * 100;
    const interval = tankRangeKm * 0.7; // 70% safety buffer
    const totalKm = activeRoute.distance / 1000;
    if (totalKm < interval) {
      showToast(`Route is shorter than ${Math.round(interval)} km — no fuel stops needed`);
      release(); return;
    }

    // Walk the route geometry, find target points where the tank would be at ~30%.
    const coords = activeRoute.coords; // [lon, lat][]
    const targets = [];
    let cumKm = 0;
    let nextTarget = interval;
    for (let i = 1; i < coords.length; i++) {
      const seg = haversineKm(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0]);
      cumKm += seg;
      while (cumKm >= nextTarget && nextTarget < totalKm - interval / 2) {
        targets.push({ lat: coords[i][1], lon: coords[i][0] });
        nextTarget += interval;
      }
    }
    if (targets.length === 0) { showToast('No fuel stops needed for this distance'); release(); return; }

    // Cap suggestions: keep the first SUGGEST_STOPS_CAP targets, evenly spaced.
    // For very long trips with many naturally-emitted targets, sample down to N.
    let sampledTargets = targets;
    if (targets.length > SUGGEST_STOPS_CAP) {
      const step = (targets.length - 1) / (SUGGEST_STOPS_CAP - 1);
      sampledTargets = [];
      for (let i = 0; i < SUGGEST_STOPS_CAP; i++) {
        sampledTargets.push(targets[Math.round(i * step)]);
      }
    }

    showToast(`Searching for ${sampledTargets.length} fuel stop${sampledTargets.length > 1 ? 's' : ''}…`);

    // PARALLEL Overpass calls — old code awaited each in sequence, so 6 stops took
    // 6 × Overpass-latency. Promise.all collapses that to a single round trip.
    // Failures are logged so devtools shows whether "no stops added" was network
    // failure (transient, retry-worthy) vs no-stations-near-target (terminal).
    const findOne = async t => {
      try {
        const query = `[out:json][timeout:25];node["amenity"="fuel"](around:6000,${t.lat.toFixed(4)},${t.lon.toFixed(4)});out body 5;`;
        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: 'data=' + encodeURIComponent(query),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        if (!res.ok) {
          console.warn('[suggest-fuel-stops] Overpass returned', res.status, 'for', t);
          return null;
        }
        const data = await res.json();
        const stations = data.elements || [];
        if (stations.length === 0) return null;
        // Pick closest to target.
        let nearest = stations[0];
        let nearestD = haversineKm(nearest.lat, nearest.lon, t.lat, t.lon);
        for (const s of stations) {
          const d = haversineKm(s.lat, s.lon, t.lat, t.lon);
          if (d < nearestD) { nearest = s; nearestD = d; }
        }
        return {
          lat: nearest.lat,
          lon: nearest.lon,
          label: nearest.tags?.name || nearest.tags?.brand || 'Fuel station',
        };
      } catch (e) {
        console.warn('[suggest-fuel-stops] Overpass failed for target', t, e);
        return null;
      }
    };
    const results = (await Promise.all(sampledTargets.map(findOne))).filter(Boolean);

    // De-duplicate against existing stops AND against each other (parallel results
    // can yield the same nearest station for two adjacent targets).
    const accepted = [];
    for (const r of results) {
      const dupExisting = map.stops.find(st => st.lat != null
        && haversineKm(st.lat, st.lon, r.lat, r.lon) < 1);
      const dupSelf = accepted.find(a => haversineKm(a.lat, a.lon, r.lat, r.lon) < 1);
      if (!dupExisting && !dupSelf) accepted.push(r);
    }
    if (accepted.length === 0) {
      showToast('No suitable gas stations found along route', 'error');
      release(); return;
    }

    // Sort by distance from the snapshotted origin so they appear in route
    // order. Using the snapshot avoids a crash if the user clicked Clear
    // route during the Overpass await window.
    accepted.sort((a, b) => {
      const dA = haversineKm(a.lat, a.lon, originSnap.lat, originSnap.lon);
      const dB = haversineKm(b.lat, b.lon, originSnap.lat, originSnap.lon);
      return dA - dB;
    });
    for (const s of accepted) map.stops.push(s);
    renderStops();
    showToast(`Added ${accepted.length} fuel stop${accepted.length > 1 ? 's' : ''}`);
    // Release BEFORE the recursive handleDistanceLookup so that selectRoute's
    // maybeAutoSuggestFuelStops sees stops>0 and skips, never touches the guard.
    release();
    await handleDistanceLookup();
  } catch (e) {
    console.warn('[suggest-fuel-stops] failed', e);
    release();
  }
}

// Rough per-km toll rates by country (in local currency). Best-effort heuristics —
// real toll prices depend on road, vehicle class, peak hour, etc. Users can override.
const TOLL_RATE_PER_KM = {
  CA: 0.12, US: 0.07, GB: 0.20, AU: 0.05, NZ: 0.10, IE: 0.10,
  FR: 0.10, IT: 0.08, ES: 0.10, NL: 0.10, BE: 0.10, PT: 0.10,
  AT: 0.10, DE: 0.00, CH: 0.00, // DE/CH use vignettes/no general car tolls
  PL: 0.05, JP: 0.07, KR: 0.04, IN: 0.04, BR: 0.05, MX: 0.07,
  ZA: 0.05, AE: 0.04, SG: 0.05,
  DEFAULT: 0.08,
};
// Approximate ferry pricing for a car + driver — varies wildly by route, but a
// per-km rate plus a boarding-fee floor lands close to typical short crossings.
const FERRY_RATE_PER_KM = {
  CA: 1.50, US: 1.50, GB: 1.80, AU: 2.00, NZ: 2.20,
  DEFAULT: 1.80,
};
const FERRY_BASE_COST = {
  CA: 18, US: 15, GB: 22, AU: 28, NZ: 30,
  DEFAULT: 18,
};

async function estimateTollsAndFerries(route, country) {
  const out = { tollKm: 0, ferryKm: 0, tollCost: 0, ferryCost: 0, ferryLegs: 0, source: 'overpass' };
  if (!route) return out;

  // Fast path: if ORS provided per-segment toll/ferry extras for this route,
  // use them directly — they're computed against the actual driven polyline,
  // not a heuristic "midpoint within 300m" check.
  if (route.orsExtraDistances) {
    const e = route.orsExtraDistances;
    out.source = 'ors';
    out.tollKm = e.tollKm;
    out.ferryKm = e.ferryKm;
    out.ferryLegs = e.ferryLegs;
    const cc = country?.code || 'DEFAULT';
    const tollRate = TOLL_RATE_PER_KM[cc] ?? TOLL_RATE_PER_KM.DEFAULT;
    const ferryRate = FERRY_RATE_PER_KM[cc] ?? FERRY_RATE_PER_KM.DEFAULT;
    const ferryBase = FERRY_BASE_COST[cc] ?? FERRY_BASE_COST.DEFAULT;
    out.tollCost = out.tollKm * tollRate;
    if (out.ferryKm > 0) {
      // ORS doesn't easily split ferry km per crossing; assume one boarding fee
      // per detected ferry segment, which is a small over-estimate at worst.
      out.ferryCost = (out.ferryLegs || 1) * Math.max(ferryBase, (out.ferryKm / Math.max(1, out.ferryLegs)) * ferryRate);
    }
    return out;
  }

  // 1. Ferry distance from OSRM step modes — precise. Track contiguous ferry runs
  //    as separate "legs" so we can apply the boarding fee per crossing.
  const ferryLegMeters = [];
  let curr = 0;
  for (const leg of route.legs || []) {
    for (const step of leg.steps || []) {
      const isFerry = step.mode === 'ferry' || step.driving_side === 'ferry';
      if (isFerry) {
        curr += step.distance || 0;
      } else if (curr > 0) {
        ferryLegMeters.push(curr);
        curr = 0;
      }
    }
  }
  if (curr > 0) ferryLegMeters.push(curr);
  out.ferryKm = ferryLegMeters.reduce((a, b) => a + b, 0) / 1000;
  out.ferryLegs = ferryLegMeters.length;

  // 2. Toll km via Overpass — pull every highway[toll=yes] way inside the route's
  //    bounding box, keep ones whose midpoint is within ~300m of the actual
  //    polyline, sum their lengths.
  try {
    const coords = route.coords || [];
    if (coords.length < 2) throw new Error('no coords');
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const [lng, lat] of coords) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }
    const padLat = Math.max(0.005, (maxLat - minLat) * 0.02);
    const padLng = Math.max(0.005, (maxLng - minLng) * 0.02);
    const bbox = `${minLat - padLat},${minLng - padLng},${maxLat + padLat},${maxLng + padLng}`;
    const query = `[out:json][timeout:20];way["highway"]["toll"="yes"](${bbox});out geom;`;
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: 'data=' + encodeURIComponent(query),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (res.ok) {
      const data = await res.json();
      const routeLatLngs = coords.map(([lng, lat]) => [lat, lng]);
      let tollKm = 0;
      for (const way of data.elements || []) {
        const geom = way.geometry || [];
        if (geom.length < 2) continue;
        const mid = geom[Math.floor(geom.length / 2)];
        if (!isNearRoute(mid.lat, mid.lon, routeLatLngs, 0.3)) continue;
        let len = 0;
        for (let i = 1; i < geom.length; i++) {
          len += haversineKm(geom[i-1].lat, geom[i-1].lon, geom[i].lat, geom[i].lon);
        }
        tollKm += len;
      }
      out.tollKm = tollKm;
    }
  } catch { /* leave tollKm at 0 if Overpass fails */ }

  // 3. Cost in local currency.
  const cc = country?.code || 'DEFAULT';
  const tollRate = TOLL_RATE_PER_KM[cc] ?? TOLL_RATE_PER_KM.DEFAULT;
  const ferryRate = FERRY_RATE_PER_KM[cc] ?? FERRY_RATE_PER_KM.DEFAULT;
  const ferryBase = FERRY_BASE_COST[cc] ?? FERRY_BASE_COST.DEFAULT;
  out.tollCost = out.tollKm * tollRate;
  out.ferryCost = ferryLegMeters.reduce(
    (sum, m) => sum + Math.max(ferryBase, (m / 1000) * ferryRate),
    0
  );
  return out;
}

function isNearRoute(lat, lng, routeLatLngs, maxKm) {
  // Sample points along the route — full check is overkill for ~thousands of points.
  const step = Math.max(1, Math.floor(routeLatLngs.length / 250));
  for (let i = 0; i < routeLatLngs.length; i += step) {
    const [rlat, rlng] = routeLatLngs[i];
    if (haversineKm(lat, lng, rlat, rlng) <= maxKm) return true;
  }
  return false;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = String(s ?? '');
  return div.innerHTML;
}

/* =========================
   TOAST
   ========================= */
function showToast(text, type = 'success') {
  const wrap = $('toastContainer');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'error' ? ' error' : '');
  el.textContent = text;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

/* When unit system changes, convert input display values so they keep their meaning. */
function changeUnitSystem(newSys) {
  const oldSys = state.unitSystem;
  if (oldSys === newSys) return;
  const oldU = UNIT_SYSTEMS[oldSys];
  const newU = UNIT_SYSTEMS[newSys];

  // Distance: convert via km
  if (state.distance > 0) {
    const km = toKm(state.distance, oldU.distance);
    state.distance = parseFloat(fromKm(km, newU.distance).toFixed(1));
  }
  state.stops = state.stops.map(s => {
    if (!s) return s;
    const km = toKm(s, oldU.distance);
    return parseFloat(fromKm(km, newU.distance).toFixed(1));
  });
  // Custom efficiency: convert via L/100km
  if (state.customEff > 0) {
    const l = toL100km(state.customEff, oldU.efficiency);
    state.customEff = parseFloat(fromL100km(l, newU.efficiency).toFixed(2));
  }
  if (state.cmpCustomEff > 0) {
    const l = toL100km(state.cmpCustomEff, oldU.efficiency);
    state.cmpCustomEff = parseFloat(fromL100km(l, newU.efficiency).toFixed(2));
  }
  // Tank: convert via litres
  if (state.tankSize > 0) {
    const litres = toLitre(state.tankSize, oldU.volume);
    state.tankSize = parseFloat(fromLitre(litres, newU.volume).toFixed(2));
  }
  // Price: convert via $/L canonical
  if (state.price > 0) {
    const perL = priceDisplayToPerL(state.price, oldU.volume);
    const digits = priceDigits(getCountry(state.country).currency);
    state.price = parseFloat(pricePerLToDisplay(perL, newU.volume).toFixed(digits));
  }

  state.unitSystem = newSys;
  render(); update();
}

function applyDetected(det) {
  if (!det || !det.country) return;
  const known = COUNTRIES.find(c => c.code === det.country);
  state.country = known ? det.country : 'OTHER';
  // Match province for Canada
  if (state.country === 'CA' && det.region) {
    const region = det.region.length === 2 ? det.region : null;
    if (region && CA_PROVINCES.find(p => p.code === region)) state.region = region;
  }
  // Default unit system for that country (only if user hasn't already explicitly set one)
  state.unitSystem = getCountry(state.country).unit;
  state.priceTouched = false;
}

/* =========================
   INIT
   ========================= */
async function init() {
  const isFirstRun = !localStorage.getItem(LS_KEY);
  loadState();
  applyTheme(state.theme || 'dark');

  // Fire-and-forget: fetch fresh prices in the background. If it lands before/after
  // first paint doesn't matter — renderGasPrice() is re-run when it arrives.
  loadPrices();

  initCombos();      // build searchable dropdown instances
  attachListeners(); // wire up everything
  // Restore saved departure time into the picker (state already loaded)
  if (state.departAt) $('departAt').value = state.departAt;
  renderSavedRoutes();
  render();          // first paint with combo refs available

  initPickers('primary').catch(() => {});

  // Initialize map immediately so it's visible from the start.
  // Wrapped in try/catch — if Leaflet hasn't loaded for some reason, the page still works.
  try {
    ensureMap();
    setTimeout(() => map.instance && map.instance.invalidateSize(), 100);
  } catch (e) { /* map unavailable */ }

  const det = await detectLocation();
  if (det && det.country && isFirstRun) applyDetected(det);

  // Re-center map if detection gave us coords and there are no routes yet.
  if (det?.lat != null && map.instance && map.routes.length === 0) {
    map.instance.setView([det.lat, det.lng], 7);
  }

  render(); update();
}

// Wrap init in a guard so a corrupt localStorage entry from an older build
// can't leave the user with an empty page and no recovery. If init throws,
// we wipe state and try once more — a clean fresh load is always preferable
// to a permanently broken site.
async function safeInit() {
  try {
    await init();
  } catch (err) {
    console.error('init failed, clearing state and retrying', err);
    try { localStorage.removeItem(LS_KEY); } catch {}
    // Surface the issue so silent failures don't leave the page mysteriously blank.
    try {
      const main = document.querySelector('main');
      if (main) {
        const banner = document.createElement('div');
        banner.style.cssText = 'background:#7f1d1d;color:#fff;padding:14px 18px;margin:14px;border-radius:10px;font:14px system-ui';
        banner.innerHTML = '<strong>Recovering from a saved-state issue.</strong> The page will reload automatically. If you keep seeing this, hard-refresh with <kbd>Ctrl+Shift+R</kbd>.';
        main.prepend(banner);
      }
    } catch {}
    setTimeout(() => location.reload(), 1500);
  }
}
document.addEventListener('DOMContentLoaded', safeInit);
