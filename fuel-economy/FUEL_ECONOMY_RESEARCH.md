# Fuel Economy Research — Handoff Document

A consolidated research digest for improving the accuracy of the fuel-economy calculator. Compiled from 10 parallel research passes covering climate, aerodynamics, vehicle classes, powertrains, fuel quality, regional variations, vehicle age, edge cases, electrification, and physics-based modeling.

All numbers are sourced from authoritative bodies (DOE/EERE, EPA, fueleconomy.gov, ORNL, NREL, Argonne, AAA, ICCT, IEA, NRCan, SAE peer-reviewed papers, Geotab/Recurrent fleet data) — citations are inline as markdown links.

---

## Table of Contents

1. [Executive Summary & Key Calibration Gaps](#1-executive-summary--key-calibration-gaps)
2. [Current Calculator Audit](#2-current-calculator-audit)
3. [Climate & Temperature](#3-climate--temperature)
4. [Speed, Aerodynamics, Traffic](#4-speed-aerodynamics-traffic)
5. [Driving Style & Accessory Loads](#5-driving-style--accessory-loads)
6. [Vehicle Classes & Powertrain Typical MPG](#6-vehicle-classes--powertrain-typical-mpg)
7. [EV / Hybrid / PHEV Specifics](#7-ev--hybrid--phev-specifics)
8. [Vehicle Age, Mileage, EPA Test History](#8-vehicle-age-mileage-epa-test-history)
9. [Fuel Quality, Octane, Blends](#9-fuel-quality-octane-blends)
10. [Global / Regional Variations](#10-global--regional-variations)
11. [Edge Cases (Heavy, RV, Motorcycle, Towing, Marine)](#11-edge-cases-heavy-rv-motorcycle-towing-marine)
12. [Physics-Based Modeling](#12-physics-based-modeling)
13. [Recommended Calibration Changes (Concrete)](#13-recommended-calibration-changes-concrete)
14. [Recommended New Features](#14-recommended-new-features)
15. [Consolidated Source List](#15-consolidated-source-list)

---

## 1. Executive Summary & Key Calibration Gaps

The current model is broadly defensible for **temperate, gasoline-ICE, highway-dominant** trips. It will systematically misstate fuel use for the cases listed below. Highest-leverage improvements are in **bold**.

| Gap | Severity | Current model | Reality |
|---|---|---|---|
| **Hybrid cold-weather penalty** | High | Same as ICE (+5–14%) | HEVs lose 30–34% city in cold; ~2× ICE |
| **EV (BEV) modeling missing entirely** | High | None — treats EVs like ICE | Highway 70 mph: −18 to −28%; cold +heat: −39 to −41% |
| **Towing penalty too low** | High | +15% | Real-world: +30 to +50% (highway, full-size trailer) |
| **Mountainous penalty too low** | High | +10% | Sustained 4% grade: +87 to +96%; rolling hills: +15 to +20% |
| **AC penalty too flat** | Medium | +3% (single value) | +5% highway / +15–25% city / 100°F+: up to +30% |
| **No trip-length / cold-start factor** | Medium | None | Short trips (<5 mi) in cold: ×1.5–2 the long-trip penalty |
| **No fuel-blend awareness** | Medium | Treats all gasoline as equal | E10 vs E0: −3.4%; E85: −15 to −27%; winter blend: −1.7% |
| **No altitude correction** | Low–Medium | None | Denver: −10 to −15%; >10k ft: −25%+ for N/A engines |
| **Roof rack penalty over-states SUVs** | Low | Flat +10% | SUV: ~+6%; sedan at highway speed: +20% |
| **PHEV needs charge-mode handling** | Medium | None | CD vs CS modes differ 2–3× |
| **No DC fast charging losses for EVs** | Low | N/A | Wall→wheel ~75–85% of metered kWh |

The calculator's **base model × multiplier** structure is the right shape — research backs it up to the ~10–15% accuracy band that matches user expectations. The improvements below stay within that structure.

---

## 2. Current Calculator Audit

Reference: `app.js` lines 122–132.

```js
const STYLE_FUEL_MULT = { eco: 0.90, normal: 1.0, aggressive: 1.20 };
const CONDITION_PENALTY = {
  ac: 0.03, roofRack: 0.10, towing: 0.15,
  mountainous: 0.10, cold: 0.05, poorRoads: 0.08,
};
```

And the weather multiplier at lines 818–858:

```
−5°C ≤ T ≤ 5°C   → +7%
−15°C ≤ T < −5   → +14%
−25°C ≤ T < −15  → +22%
−35°C ≤ T < −25  → +35%
T ≤ −35          → +50%
T ≥ 38           → +8%
```

| Parameter | Current | Research-supported | Verdict |
|---|---|---|---|
| Eco style | 0.90× | 0.85–0.92× | **OK** for a casual eco preset; trained eco-driving can hit 0.85 |
| Aggressive | 1.20× | 1.20–1.40× | **Acceptable for highway**; understates city stop-and-go |
| AC | +3% | +5% hwy / +15% city / +25% extreme heat | **Too flat** — needs temperature & trip-type sensitivity |
| Roof rack | +10% | Sedan: +11% bare/+20% box; SUV: +6% box | **OK as midpoint**, but vehicle-class-dependent |
| Towing | +15% | +30 to +50% real-world | **Significantly understated** |
| Mountainous | +10% | +15–20% rolling / +40–90% sustained grade | **Significantly understated** for true mountains |
| Cold (manual) | +5% | +5–8% hwy / +15–24% city ICE / +30–34% HEV | **Too flat** — hides hybrid penalty |
| Poor roads | +8% | +8–15% rough asphalt / +30–60% gravel | **OK for moderate roughness** |
| Weather temp curve | 0°C ≈ +7% | Real: −15% economy ≈ +18% consumption at 0°C | **Reasonable for ICE**; doesn't account for HEV/EV |
| Heat (>38°C) | +8% | +15–25% city ICE w/ AC | **Understated for city**; OK for highway |

---

## 3. Climate & Temperature

### 3.1 Cold-Weather Fuel Economy (Authoritative Anchors)

Source of truth: [fueleconomy.gov — Cold Weather](https://www.fueleconomy.gov/feg/coldweather.shtml), based on ORNL analysis of EPA test results, 59 gasoline + 32 hybrid vehicles, MY2019.

Reference baseline: **77°F (25°C)**.

#### Conventional gasoline ICE — 20°F (−7°C)

| Driving Condition | Fuel Economy Penalty |
|---|---|
| City driving | 10–20% worse (~15% midpoint) |
| Short trip 3–4 mi | 15–33% worse (up to 24% typical) |

#### Hybrid HEV — 20°F (−7°C)

| Driving Condition | Penalty |
|---|---|
| City driving | **20–40% worse** (~30–34% midpoint) |
| Short trips | 25–45% worse |

Hybrids are hit ~**2× harder** than ICE because: (1) cold battery rejects regen current, (2) ICE must run continuously to provide cabin heat, defeating idle-shutoff, (3) Atkinson cycle's part-load advantage assumes warm engine.

#### Battery EVs — multiple sources converge

| Source / Condition | Range Reduction |
|---|---|
| AAA 2019 lab — 20°F, no climate | 12% |
| AAA 2019 lab — 20°F, cabin heat ON | **41%** |
| Recurrent 2024–25 fleet (30k vehicles), 32°F | ~22% |
| Recurrent 2024–25, 20°F | ~30% |
| DOE VTO Sept 2024 — 0°F (−18°C) avg | ~50% (urban 59%, hwy 39%) |
| ORNL personal-use BEV winter avg | 64% of rated |

About **two-thirds of the BEV cold penalty is cabin heating**, ~one-third is battery chemistry/drivetrain.

#### Heat pump vs. resistive heater (BEV)

| Temperature | Resistive PTC range loss | Heat pump range loss |
|---|---|---|
| 32°F (0°C) | ~25% | ~17% (heat pump saves 10 pp) |
| 14°F (−10°C) | ~50% (Bolt, BMW i3) | ~30–40% |
| 0°F (−18°C) | ~50% | ~45% (heat pump margin shrinks) |

Heat pump COP > 1 only above ~14°F; below that, backup resistive does most of the work. Tesla Model 3 (resistive) shows 26% loss at 30°F vs Model Y (heat pump) at 8% — same platform.

Heat-pump-equipped: E-GMP (Ioniq 5/6, EV6/EV9), MEB (ID.4), Ultium (Equinox/Blazer EV, Lyriq), Mach-E, Model 3/Y from 2021. **No heat pump:** Ford F-150 Lightning, older Bolt, BMW i3.

### 3.2 Hot-Weather Fuel Economy

[fueleconomy.gov — Hot Weather](https://www.fueleconomy.gov/feg/hotweather.shtml):

> "Under very hot conditions, A/C use can reduce a conventional vehicle's fuel economy by more than 25%, particularly on short trips."

| Condition | ICE Penalty | BEV Range Loss |
|---|---|---|
| Mild heat ~85°F | 5–10% | 2–4% |
| Hot ~95°F + AC | 15–25% city / 5–10% hwy | ~17% (AAA, Recurrent) |
| Extreme 100°F+ city | up to 30% | 17–18% |

Pre-cooling (BEV plugged in): 3–5 kW initial pull → ~1 kW maintenance. On a short trip with heat-soaked cabin, AC alone can be 5–10% of trip energy.

### 3.3 Temperature Multiplier Calibration

Recommended replacement curve (consumption multiplier) for ICE:

| Temp (°C) | Long trip (>20 mi) | City / short trip (<5 mi) |
|---|---|---|
| ≥ 28 | 1.02 | 1.05 |
| 12–28 | 1.00 | 1.00 |
| 0–12 | 1.05 | 1.10 |
| −10 to 0 | 1.10 | 1.18 |
| −20 to −10 | 1.18 | 1.30 |
| −30 to −20 | 1.30 | 1.45 |
| ≤ −35 | 1.50 | 1.70 |
| ≥ 38 (hot+AC) | 1.08 | 1.20 |

For HEVs, multiply the **cold portion** by 1.8 (i.e., +18% becomes +32%). For BEVs, ditch the consumption multiplier and use a separate range-retention table (Section 7).

### 3.4 Tire Pressure × Temperature Compounding

- Tires lose **~1 PSI per 10°F drop** (NHTSA documented).
- Fuel economy: **−0.2% per PSI** under-inflation (DOE Fact #826).
- Cold snap from 60°F → 10°F → −5 PSI → +1.0% consumption from tires alone.

This effect is small but additive to the temperature curve above. Don't double-count if user already specifies "cold" condition.

### 3.5 Altitude

- Air density: **−3% per 1,000 ft (305 m)**.
- Naturally-aspirated engines: lose ~3–3.5% power per 1,000 ft.
- Modern fuel-injected: ECU compensates for stoichiometry; fuel economy on flat altitude terrain may even *improve* slightly (less aero drag).
- Mountain passes (continuous climbing): driver compensates for lost torque → +10–25% fuel.
- Turbocharged: largely compensate; diesels with turbos handle altitude well.

| Altitude | N/A power loss | FE on flat terrain | FE on mountain route |
|---|---|---|---|
| 5,000 ft (Denver) | ~15% | −2 to −5% | −10 to −15% |
| 10,000 ft (CO passes) | ~25–30% | −5 to −10% | −20 to −25% |
| 12,000 ft (La Paz) | ~33–38% | −10 to −15% | −25 to −35% |

### 3.6 Seasonal Fuel Blend (revisited in §9)

Winter gasoline = ~10% butane (vs. ~2% summer) → **1.7% lower energy content** per gallon. Real-world MPG hit: 1–3% from blend alone, on top of temperature effects.

---

## 4. Speed, Aerodynamics, Traffic

### 4.1 Speed vs. MPG (Authoritative Curves)

[ORNL Transportation Energy Data Book #39, AFDC table 4.33](https://afdc.energy.gov/data/10312):

| Powertrain | 45 mph | 55 mph | 65 mph | 75 mph | 55→75 loss |
|---|---|---|---|---|---|
| Gasoline ICE | 43 mpg | **45 (peak)** | 38 | 32 | **−28.9%** |
| Diesel | 57 | 55 | 45 | 37 | −32.7% |
| Hybrid HEV | **55 (peak ~45)** | 46 | 38 | 33 | −28.3% |

DOE rule of thumb: **every 5 mph over 50 = ~$0.25–$0.35/gal** at 2024 prices.

EVs follow a different curve (no transmission inefficiency, drag dominates):

| Speed | EV range vs. 55 mph baseline |
|---|---|
| 65 mph | −10 to −15% |
| 75 mph | −25 to −30% |
| 80+ mph | −35 to −40% |
| 85+ mph | **−50%+** |

### 4.2 Aerodynamic Drag Coefficients

| Class | Cd typical | Frontal area (m²) | CdA (m²) |
|---|---|---|---|
| Modern aerodynamic sedan | 0.25–0.30 | 2.1–2.3 | 0.55–0.69 |
| EV sedan (best) | 0.19–0.23 | 2.1–2.3 | 0.40–0.53 |
| Compact crossover | 0.32–0.38 | 2.4–2.7 | 0.77–1.03 |
| Full-size SUV | 0.35–0.45 | 2.8–3.3 | 0.98–1.49 |
| Pickup (closed bed) | 0.40–0.44 | 3.0–3.6 | 1.20–1.58 |
| Pickup (open bed) | 0.43–0.50 | 3.0–3.6 | 1.29–1.80 |
| Jeep Wrangler | 0.45–0.58 | 3.0–3.5 | 1.35–2.03 |
| Hummer H2 | 0.57+ | ~4.3 | ~2.46 |

Rule: every 0.01 reduction in Cd ≈ +0.1 mpg (truck) to +0.2 mpg (car). Above 45 mph, aerodynamic drag is **up to 60% of total energy use**.

### 4.3 Roof Racks / Cargo Boxes

Source: [Chen & Meier, LBNL, *Energy Policy* 2016](https://www.osti.gov/servlets/purl/1257753) and SAE 2014-01-1614.

| Configuration | City | Highway | 65–75 mph |
|---|---|---|---|
| Bare crossbars (sedan) | 2–4% | 6–11% | up to 12% |
| Cargo box (sedan) | 8.8% | 20.8% | 25–27% |
| Cargo box (SUV) | 2.5% | 6.2% | up to 10% |
| Cargo box on 2022 Carnival removed | — | — | **+12% MPG gain** |
| Hitch-mounted cargo tray | negligible | 1–5% | small |

SUV penalty smaller in % terms because baseline drag is already higher. **Empty rack still hurts** — Berkeley Lab found unloaded-rack miles are 4–8× loaded-rack miles in fleet aggregate.

### 4.4 Open Windows vs. AC

| Speed | Winner | Notes |
|---|---|---|
| < 40 mph | Windows down | Even on hot days |
| 40–55 mph | Vehicle-dependent | SUV: windows OK to 60; sedan: AC wins by 50 |
| > 55 mph (general) | AC wins | Open windows cost 15–20% drag |
| > 80 mph (sedan) | AC wins clearly | SAE Corolla test |

### 4.5 Traffic & Idling

[DOE Fact #861](https://www.energy.gov/cmei/vehicles/fact-861-february-23-2015-idle-fuel-consumption-selected-gasoline-and-diesel-vehicles):

| Engine | Idle gal/hr (no AC) |
|---|---|
| 4-cyl 1.5–2.0L | 0.10–0.20 |
| 2.0L compact | 0.16–0.17 |
| V6 mid-size | 0.20–0.40 |
| V8 sedan (4.6L) | 0.35–0.45 |
| V8 pickup | 0.50–0.65 |
| Class 8 diesel | ~0.80 |
| AC running | +50–100% |

Stop-start systems (OEM): saves 3–8% urban fuel (AAA, SAE 2023-01-0346). EPA discontinued CAFE credit for stop-start in latest rules.

### 4.6 Cruise Control

| Terrain | Effect |
|---|---|
| Flat highway | +7% to +14% (Edmunds, Volvo/NREL) |
| Hilly (3%+ grade) | −10 to −15% (cruise overcorrects) |
| Real-world fleet (Nature Comm 2024) | slight net **increase** in fuel use |

**Practical rule:** cruise on flat interstate, off in hills.

### 4.7 Headwinds / Tailwinds

- 10 mph headwind: **~−13% MPG**
- 20 mph headwind: −20 to −25%
- Headwinds hurt more than tailwinds help (drag scales as relative-velocity²; rolling resistance unchanged either way)
- 20 mph tailwind: +5 to +8% saving

The current `weatherFuelMultiplier` wind ramp (+3 at 25 km/h, +5 at 35, +9 at 50, +15 at 70) is in the right ballpark for combined exposure assumption.

### 4.8 Drafting

| Distance behind semi (55 mph) | MPG gain |
|---|---|
| 10 ft | ~39% (unsafe) |
| 20 ft | ~27% (unsafe) |
| 50 ft | ~20% |
| 100 ft | ~11% |
| 300+ ft (safe) | <2% |

**Don't model.** Safe distances yield negligible savings.

---

## 5. Driving Style & Accessory Loads

### 5.1 Driving Style

[DOE — Driving More Efficiently](https://www.energy.gov/energysaver/driving-more-efficiently), [fueleconomy.gov Drive Habits](https://www.fueleconomy.gov/feg/driveHabits.jsp):

| Behavior | Fuel impact |
|---|---|
| Aggressive — highway | −15 to −30% |
| Aggressive — city / stop-and-go | **−10 to −40%** |
| Speed reduction 5–10 mph | +7 to +14% |
| Driver feedback device | +3% (engaged users +10%) |
| Eco-driving training (EU programs) | +8 to +15% immediate, +20%+ trained |
| Hypermiling combined techniques | +35% (Edmunds LR3 test) |

DFCO (deceleration fuel cut-off): modern ICE uses **zero fuel** when engine-braking in gear. Engine at idle: 0.3–0.5 L/hr. Anticipating stops 3–5 sec earlier is real savings.

### 5.2 AC — Detailed

[NREL fy00osti/28960](https://docs.nrel.gov/docs/fy00osti/28960.pdf):

| Condition | Penalty vs. no AC |
|---|---|
| Mild (60–75°F) | 1–3% |
| Moderate (85°F city) | 10–15% |
| Hot (95–105°F city, max cooling) | 15–25% |
| Extreme + idle/stop-and-go | up to 50% of engine load momentarily |
| Hybrid (smaller ICE, larger ratio) | +30–40% city worst case |

AC compressor draws 2–7 kW depending on load:
- 72–80°F: 500–1,000 W
- 85–90°F: 1,000–1,800 W
- 95–105°F: 1,800–3,000 W

### 5.3 Towing

SAE 2014-01-1614 (ORNL) + real-world fleet:

| Trailer + tow | City | 70 mph | 80 mph |
|---|---|---|---|
| 1,500 lb light enclosed | −15 to −25% | −20 to −30% | — |
| 3,500 lb enclosed | −30% | — | **−50%** |
| 7,000 lb travel trailer | — | −35 to −50% | — |
| 10,000 lb 5th wheel | — | −45 to −60% | — |
| Boat (planing hull, exposed) | — | −25 to −40% | — |
| Tiny home / vertical wall | — | −40 to −60% | — |
| EV towing 6k lb | — | **−65%** | — |

**Aerodynamics dominate weight at >45 mph.** A 3,500 lb trailer at 80 mph costs the same in fuel as a similar trailer 3× heavier at 50 mph.

### 5.4 Mountainous

[MDPI Atmosphere 2025](https://www.mdpi.com/2073-4433/16/2/143), [AFDC grade table](https://afdc.energy.gov/data/10601):

| Sustained grade | Fuel consumption multiplier |
|---|---|
| +2% | 1.25–1.40× |
| +3% (60 km/h) | 1.50–1.70× |
| +4% (60 km/h) | **1.87×** |
| +4% (80 km/h) | **1.96×** |
| Rolling hills (mixed up/down) | 1.15–1.20× |

Regen recovery on descent: hybrid/EV recovers 15–70% of potential energy. ICE: minimal.

### 5.5 Poor Roads / Rolling Resistance

Crr (rolling resistance coefficient) by surface:

| Surface | Crr | vs. asphalt (0.010) |
|---|---|---|
| Good asphalt/concrete | 0.010–0.013 | baseline |
| Worn asphalt | 0.013–0.017 | +20–30% |
| Packed gravel | 0.020–0.030 | +50–100% |
| Dirt/unpaved | 0.025–0.037 | +80–150% |
| Deep sand/loose dirt | 0.040–0.070 | +200–400% |

Rule: 10% Crr reduction ≈ 1% MPG gain (rolling resistance is one of multiple loss components).

### 5.6 Tires

| Type | Crr | vs. LRR |
|---|---|---|
| LRR OEM | 0.006–0.008 | baseline |
| All-season touring | 0.008–0.010 | −1 to −3% |
| All-terrain (A/T) | 0.012–0.016 | −3 to −5% |
| Mud-terrain (M/T) | 0.015–0.020+ | −5 to −8% |
| Winter studded | tread + drag | −3 to −7% |

Tire pressure: −0.2% MPG per PSI under (DOE Fact #826). Maximum gain from proper inflation: ~3%.

### 5.7 Cargo / Passengers

DOE rule: **−1% MPG per 100 lb additional weight** (1–2% range, smaller cars at the high end).
- 5 adults (~850 lb extras) ≈ −8.5%
- Full trunk (~150 lb) ≈ −1.5%
- City trips affected more than highway (acceleration work).

---

## 6. Vehicle Classes & Powertrain Typical MPG

EPA combined real-world (apply ~15% haircut from EPA label for typical drivers).

### 6.1 Cars and SUVs (MY 2020–2026)

| Class | EPA combined | Real-world | Notes |
|---|---|---|---|
| Subcompact | 36–42 | 30–36 | Mirage, Venue |
| Compact | 30–38 | 26–32 | Civic, Corolla |
| Midsize sedan | 28–34 | 24–29 | Camry, Accord |
| Large sedan | 22–28 | 19–24 | 300, G90 |
| Compact SUV | 28–35 | 24–30 | C-HR, Seltos |
| Midsize SUV | 24–28 | 20–24 | RAV4, CR-V, Escape |
| Large SUV | 18–23 | 15–20 | Explorer, Highlander |
| Full-size body-on-frame SUV | 15–19 | 13–17 | Tahoe, Expedition |

### 6.2 Pickups

| Class | EPA | Real | Tank (gal) |
|---|---|---|---|
| Compact (Maverick gas) | 28–30 | 24–27 | 15–16 |
| Midsize (Tacoma, Colorado) | 20–24 | 17–21 | 18–21 |
| Full 1/2-ton gas (F-150, Silverado) | 18–22 | 15–19 | 24–36 |
| Full 1/2-ton diesel | 22–26 | 19–23 | 24–36 |
| HD 3/4-ton gas | 14–17 | 12–15 | 34–48 |
| HD 1-ton gas dually | 11–14 | 10–13 | 34–48 |
| HD 3/4–1-ton diesel (Duramax/Cummins/PSD) | 16–20 | 14–18 | 34–48 |

### 6.3 Vans, Moving Trucks, Commercial

| Class | Real MPG | Tank | Notes |
|---|---|---|---|
| Minivan (Sienna, Odyssey, Pacifica) | 22–26 | 17–20 | Sienna HEV pulls avg up |
| Cargo van gas (Transit, ProMaster) | 14–18 | 25–31 | |
| Cargo van diesel (Sprinter) | 18–23 | 25–31 | |
| U-Haul 10' / Penske 12' | ~12 | 31–33 | gas |
| U-Haul 15–20' | ~10 | 40 | gas |
| U-Haul 26' | ~8–10 | 60 | gas |
| Penske 22–26' diesel | 13–15 | 70 | |
| Class 5–6 box truck | 8–14 | 50–60 | diesel |
| Class 8 semi (long-haul, ATRI 2025) | **6.8–6.9 fleet avg** | 100–300 | range 4.5–9 by route/load |

### 6.4 RVs

| Class | MPG | Tank |
|---|---|---|
| Class A gas | 6–10 | 80–100 |
| Class A diesel pusher | 7–12 | 90–150 |
| Class B campervan | 18–25 | 24–25 |
| Class C | 10–14 | 40–80 |

### 6.5 Sports / Performance

| Class | MPG | Notes |
|---|---|---|
| Mustang GT, Camaro V8 | 16–20 | |
| Turbo-4 sports (Supra, GR86) | 22–28 | |
| Porsche 911, Corvette C8 | 16–22 | |
| Hypercar | 10–16 | |

### 6.6 Motorcycles

| Class | MPG | Tank (gal) |
|---|---|---|
| Moped 50cc | 100–150 | 1–1.5 |
| 125cc commuter | 90–130 | 2–3 |
| 250–300cc | 65–90 | 3–4 |
| 500–800cc cruiser | 50–70 | 3.5–5 |
| 600cc supersport | 35–50 | 4–5 |
| 1000cc supersport | 30–40 | 4–5 |
| Harley/Indian large cruiser | 35–55 | 5–6 |
| BMW GS, KTM 1290 ADV | 40–55 | 6–8+ |

### 6.7 Powertrain Behavior Quick-Reference

| Powertrain | Combined | City vs. Hwy | Mechanism |
|---|---|---|---|
| Port-injection gas | baseline | hwy > city ~25% | Standard Otto |
| Turbo-DI gas | 0–3 mpg better | hwy > city | Real-world often misses EPA more than NA |
| Diesel | +20–30% over gas | hwy > city wider | 14% more BTU/gal + higher CR |
| HEV (Atkinson + regen) | +25–50% over equiv ICE | **city ≥ hwy** | Regen + idle off + Atkinson |
| 48V mild hybrid | +8–15% over gas | hwy > city | Stop-start + small regen |
| PHEV CD mode | 50–100+ MPGe | per AER | EV-like |
| PHEV CS mode | 30–45 mpg | slight hwy > city | HEV-like, 200–400 lb heavier |
| BEV | 3.0–4.5 mi/kWh / 75–110 MPGe | **city > hwy** | No idle, regen strong, drag dominates speed |
| CNG | ~80% of gas (per GGE) | similar to gas | Lower per-gallon energy |
| LPG | ~75% of gas | similar | Lower energy density |
| E85 | −15 to −27% vs. gas | similar | Ethanol ~72% energy/gal |

### 6.8 Drivetrain & Transmission

**AWD penalty:** −2 to −3 mpg vs. FWD twin (e.g., Corolla Cross FWD 31/38 vs. AWD 29/35).

**Transmission gen:**

| Trans | vs. 8/9/10-speed auto |
|---|---|
| 4-speed (legacy, pre-2005) | −4 to −8% |
| 6-speed | −1 to −3% |
| 8/9/10-speed | baseline |
| CVT | equal or +1–3% (best for cruise) |
| DCT | ~equal |
| Manual (modern) | 0 to +2%, driver-dependent |

Modern 10-speed automatics often beat skilled manuals — Honda Civic CVT is 2.5 MPG better than its manual twin.

### 6.9 Recommended Preset Revisions

Current vs. recommended (real-world MPG):

| Current | Cur MPG | Recommended | Notes |
|---|---|---|---|
| Compact | 35 | **32** | E10 real-world haircut |
| Sedan | 30 | **28** | Midsize avg |
| Crossover | 28 | 26–28 | OK |
| SUV | 22 | **20** | Midsize; full-size BoF closer to 16–18 |
| Pickup | 18 | 18 | Full 1/2-ton avg, OK |
| Sports car | 20 | 22 | Turbo-4 pulls up |
| Hybrid | 48 | 48–50 | OK |
| Minivan | 24 | **26** | HEV Sienna boosts class |
| Cargo van | 18 | **16 (gas) / 20 (diesel)** | Split |
| Moving truck | 10 | 10 | OK for 26' |
| RV | 15 | **9** | Class A is 7–10; Class B is 18–25 |
| Motorcycle | 55 | 55 | Range is 30–80, midpoint OK |

**Recommended additions:**
- Compact pickup (Maverick): 28
- HD pickup: 13
- Camper van (Class B): 20
- PHEV: present dual values (105 MPGe / 30 MPG gas)
- BEV: present 100–130 MPGe + kWh/100mi

### 6.10 Tank Estimation Reality Check

The current `estimateTankLitres()` mapping (`app.js:158`) is reasonable but missing a few classes — add: Heavy-duty pickup (130 L / 34 gal), Class A RV (303–568 L / 80–150 gal), Class B campervan (90–95 L / 24–25 gal), moving truck >20 ft (227 L / 60 gal).

---

## 7. EV / Hybrid / PHEV Specifics

### 7.1 BEV Speed → Range Curve

Aerodynamic drag dominates because no transmission inefficiency. Edmunds 70 mph standardized range tests show most EVs deliver 18–28% **less** range than EPA combined.

| Speed | Range vs. 55 mph baseline |
|---|---|
| 35 mph (urban) | best — often **+10–30% over EPA highway** |
| 55 mph | baseline |
| 65 mph | −10 to −15% |
| 75 mph | −25 to −30% |
| 80+ mph | −35 to −42% |

### 7.2 BEV Cold Curves — Use Range Retention, not Consumption Multiplier

| Temp (°C) | Range retention (typical) | Range retention (heat pump) |
|---|---|---|
| 25 (ref) | 100% | 100% |
| 0 | 78% | 88% |
| −7 | 70% | 80% |
| −10 (no heat) | 88–92% | 88–92% |
| −10 (heat ON) | 60% | 70% |
| −18 | ~50% | ~55% |
| −29 | ~40% | ~45% |

**Calc rule:** for BEV, treat the energy budget as: `usable_kWh = battery_kWh × range_retention_factor(temp)`, then `range = usable_kWh / kWh_per_mi`.

### 7.3 BEV Hot Weather

| Temp | Range loss (AC ON) |
|---|---|
| 90°F (32°C) | ~5% |
| 95°F (35°C) | ~15% |
| 100°F (38°C) | 17–18% |

Pre-cooling while plugged in (3–5 kW initial) saves ~5–10% on short trips.

### 7.4 Hybrid Cold = ICE × ~2

DOE official numbers, 20°F city:
- ICE: ~15% worse
- HEV: **30–34% worse**

For your `cold` checkbox / weather multiplier when vehicle is HEV: multiply the ICE cold penalty by ~1.8–2.0.

Real-world example: Toyota Prius typical 50 MPG → 33 MPG sustained cold = 34% loss, matches DOE.

### 7.5 PHEV Behavior

Two regimes — handle separately:

**Charge-Depleting (CD) mode** (battery >threshold):
- ~BEV behavior
- Use MPGe rating × adjusted-for-conditions

**Charge-Sustaining (CS) mode** (battery depleted):
- ~HEV behavior (often worse, due to 200–400 lb extra battery weight)
- Use gasoline-only MPG, often 2–5 mpg below comparable HEV

Examples:
- Volt Gen 2: 53 mi EV / 42 mpg CS
- RAV4 Prime: 42 mi EV (real 49–52) / 38 mpg CS
- Escape PHEV: 37 mi EV / 41 mpg CS
- Pacifica Hybrid: 32 mi EV / 30 mpg CS

**SAE J2841 Utility Factor** (% miles driven electric, daily charging):
- 40 mi AER → UF ≈ 0.68
- 20 mi AER → UF ≈ 0.44

**Real-world deviation:** drivers who don't plug in regularly have UF as low as 0.10–0.20 → real fuel use can be 2× the EPA combined label. Make charging frequency a calculator input.

### 7.6 Regen Braking — Trip-Level

| Scenario | Energy recovered (% of trip) |
|---|---|
| Dense urban | up to 34% reduction in consumption |
| Suburban mixed | 10–25% |
| Steady highway 65+ | ~6% |
| Mountain descent | up to 85%+ of descent energy |

InsideEVs test: regen mode +0.4–0.6 mi/kWh over coasting in suburban driving (2.5 vs 2.1 mi/kWh).

### 7.7 BEV Charging Losses (Wall to Wheels)

| Charging type | Wall→battery efficiency |
|---|---|
| L1 (120V, 1.4 kW) | ~84% |
| L2 (240V, 6.9 kW) | ~93% |
| DCFC (50–150 kW) | 88–92% |
| DCFC at >150 kW into warm battery | variable; BMS may throttle |

Above 80% SOC, charging losses **roughly double** due to cell balancing.

Practical: MPGe ratings (battery→wheels) overstate effective wall-to-wheel by ~10–15%.

### 7.8 BEV Towing

Disproportionately hits EVs vs. ICE because aero drag is constant motor load:

| Vehicle | Solo EPA | Tow scenario | Range | Loss |
|---|---|---|---|---|
| F-150 Lightning | ~280 mi | enclosed near-max, hwy | ~90 | **~65%** |
| Rivian R1T | ~320 mi | 6,100 lb, 70 mph | ~110 | ~65% |
| BMW i4 eDrive40 | ~258 mi | caravan 85% kerb | ~113 | −56% |
| Tesla Model Y LR | ~260 mi | similar caravan | ~113 | −57% |

**Calculator rule:** EV towing — apply 50% range multiplier for heavy tow (>5k lb hwy), 35% for light (<2k lb mixed).

### 7.9 Battery Degradation (Geotab 22,700 EVs, 2024)

| Pattern | Annual loss | 8-yr SOH |
|---|---|---|
| Mostly L1/L2 (<12% DCFC) | 1.5%/yr | ~88% |
| Average mix | 2.3%/yr | ~81.6% |
| Heavy DCFC (>40% sessions, >100 kW) | **3.0%/yr** | ~76% |
| Hot climate adder | +0.4%/yr | — |

Chemistry: LFP tolerates 100% daily SOC; NMC/NCA prefer 80% daily limit.

### 7.10 Battery Preconditioning

Pre-warming (winter) before DCFC:
- 30°F: 33 min vs. 42 min from cold (peak 238 kW vs. 135 kW)
- −10°C: −28% charge time, +33% mean power
- Range gain from pre-warming before drive: 1–6%

---

## 8. Vehicle Age, Mileage, EPA Test History

### 8.1 EPA Test Methodology Eras

| Era | Mechanism | Real-world gap (typical) |
|---|---|---|
| Pre-1985 | 2-cycle, unadjusted | sticker overstates by 20–30% |
| 1985–2007 | 2-cycle, fixed factor (city ×0.90, hwy ×0.78) | overstates by 5–15% |
| 2008+ | 5-cycle (FTP-75, HWFET, US06, SC03, Cold FTP) | within ~10–15% real-world |

2008 adjustment effect: city ratings dropped avg 12% (up to 30% for hybrids), highway dropped avg 8%.

If calculator ingests pre-2008 ratings, **apply downward correction** (×0.88 for 1985–2007, ×0.78 for pre-1985) before using.

### 8.2 Fleet MPG History (US)

| MY | Combined avg | Notes |
|---|---|---|
| 1975 | 13.1 | CAFE baseline |
| 1982 | ~22 (cars only) | First CAFE peak |
| 2004 | 19.3 | SUV/truck mix at peak |
| 2018 | 25.1 | Record at the time |
| 2023 | 27.1 | |
| 2024 | **27.2** | All-time record; 50% trucks/SUVs |

Manufacturer 2024 fleet MPG: Tesla 117.1 MPGe, Honda 31.0, Hyundai 29.8, Kia 29.2, Toyota +3.3 mpg gain since 2019 (largest absolute), Ford 23.4, GM 22.9, Stellantis 22.8.

### 8.3 Individual ICE Degradation

| Mileage | Well-maintained loss | Neglected loss |
|---|---|---|
| 0–15k | 0 to −5% | similar |
| 15–60k | −5 to −12% | −10 to −18% |
| 60–100k | −12 to −18% | −18 to −30% |
| 100–150k | −15 to −25% | −25 to −40% |
| 150–200k | −18 to −30% | −30 to −45% |
| 200k+ | depends on care | −40 to −50% |

University of Michigan: vehicles >10 years old consume 33–35% more fuel/mile than newer equivalents (fleet average).

### 8.4 Component-Level MPG Impact

| Component | Failure mode | MPG impact |
|---|---|---|
| Upstream O2 sensor | rich fuel trim | **−10 to −40%** |
| Spark plugs | misfires | −2 to −4%; up to −30% severe |
| Air filter clogged | flow restriction | up to −10% (modern MAF less) |
| MAF sensor dirty | wrong air mass | −5 to −15% |
| Fuel injectors coked | poor atomization | −2 to −8% per injector |
| EGR clogged | NOx + ECU compensation | −3 to −8% |
| Brake drag | sticking caliper | −5 to −15% spot cases |
| Wheel alignment | dragging | −2 to −10% (DOE: +3% gain proper) |

Consumer Reports: 23% of MPG complaints resolved with spark plug service alone.

### 8.5 Year-Specific Quirks

- **Turbo-downsizing 2010–2018:** Real-world misses EPA more than NA equivalents. EcoBoost owners avg 72% of label. US06 cycle partially captures boost but underweight in composite.
- **Dieselgate 2015:** VW TDI (2009–15) software cheated NOx tests. Post-recall fixes traded efficiency for emissions. Use caution with pre-recall TDI ratings — real-world post-fix differs.
- **Stop-start (2012+):** +5–7% urban, AAA. EPA dropped CAFE credit, slowing deployment.
- **Multi-speed autos:** Each step up to 8-speed gives +2–4%. Beyond 8 → diminishing (Odyssey 6→10 = 0% city, +4% hwy).

---

## 9. Fuel Quality, Octane, Blends

### 9.1 Energy Content (LHV)

[AFDC Fuel Properties](https://afdc.energy.gov/fuels/properties), [EIA](https://www.eia.gov/tools/faqs/faq.php?id=27&t=10):

| Fuel | BTU/gal | MJ/L | vs. E0 |
|---|---|---|---|
| Gasoline (E0) | 116,090 | 32.4 | 100% |
| E10 (US standard) | 112,114–116,090 | 31.2–32.4 | ~96.6% |
| E15 | ~111,400 | 31.1 | ~96% |
| E85 (51–83% EtOH, seasonal) | 83,950–95,450 | 23.4–26.6 | 73–83% |
| Diesel #2 (ULSD) | 128,488 | 35.8 | 110.7% |
| B20 biodiesel | 126,700 | 35.3 | — |
| B100 | 119,550 | 33.3 | — |
| LPG / Propane | 84,250 | 23.5 | 72.6% |
| CNG (per GGE) | ~119,000 | — | 102% |
| Methanol | 57,250 | 16.0 | 49.3% |

### 9.2 Real-World MPG Multipliers

| Fuel substituted for E0 | Multiplier |
|---|---|
| E0 (ethanol-free) | 1.000 |
| E10 (US standard) | 0.962–0.967 |
| E15 | 0.950–0.960 |
| E85 (full ethanol) | 0.730–0.850 |
| E27 (Brazil mandatory) | ~0.920–0.930 |
| Winter blend vs. summer | 0.982–0.985 |
| 87 in premium-required car | 0.920–0.980 |
| 91 in regular-only car | 1.000 (no benefit) |
| Diesel #1 vs. #2 | 0.950–0.970 |
| B20 vs. ULSD | 0.980–0.990 |
| B100 vs. ULSD | 0.930 |

### 9.3 Octane Conversion

US uses AKI = (R+M)/2; rest of world uses RON. **AKI ≈ RON − 4–6 points**:

| US AKI | ≈ RON |
|---|---|
| 87 | 91–92 |
| 89 | 93–94 |
| 91 | 95–96 |
| 93 | 97–99 |

A US car requiring "87 AKI" runs fine on EU "95 RON". A car requiring "premium 91 AKI" needs EU "98 RON".

### 9.4 Premium Octane in Engines

- **87 in premium-required car:** Knock sensor retards timing; loses 2–8% MPG plus power; often a wash on fuel cost.
- **91 in regular-only car:** **No benefit.** Engine cannot use timing headroom. FTC/EPA confirmed.

### 9.5 Seasonal Blends — Detail

Winter US gasoline contains ~10% butane (vs. 2% summer); RVP 13.5–15 psi vs. 7–9 psi summer; **1.7% lower energy content**. Real-world MPG hit: 1–3% from blend alone.

California CARB gasoline has tighter sulfur and oxygenate rules; LHV not meaningfully different from federal E10.

### 9.6 Diesel Particulars

- Cetane: from 52 to 55 → **−0.5%** consumption (HD).
- ULSD mandated 2006; lubricity additives required.
- Cloud point #2: ~0°C; gels ~−12°C without additives.
- Winter blend (50:50 #1/#2): cloud point −15 to −20°C, **2.5–5% less energy**.
- DEF: **2–6% of diesel volume**; ~2.5% representative.
- DPF active regeneration: +13% fuel during regen event; events every ~130 km in passenger diesel; net trip overhead 1–2% urban, 0.5–1% highway.

### 9.7 Top Tier Detergents

AAA testing: non-Top Tier left **19× more carbon deposits** over 4,000 mi. Long-term non-Top Tier ≈ **−2 to −4% MPG** drift. Top Tier can recover up to 5% if vehicle was already deposited. Treat as long-term maintenance factor, not a per-fill effect.

### 9.8 Storage Stability

- E10: phase-separates in 30 days humid environment; AKI drops below 87 after separation; full degradation 3 months in vented tank.
- E0: 6–12 months sealed.
- Diesel ULSD: 6–12 months cool/dark; microbial growth at water interface in marine/stored equipment.
- B20: 3–6 months recommended.

---

## 10. Global / Regional Variations

### 10.1 Test Cycles and Conversion Factors

| Test cycle | Where | Avg speed | Real-world gap | vs. EPA |
|---|---|---|---|---|
| EPA 5-cycle | US | mixed | ~10% (lowest) | 1.00× |
| WLTP | EU/UK/AU/JP/CN ICE | 46.5 km/h | ~14% | × 0.88–0.91 (less MPG) |
| NEDC (deprecated) | EU pre-2017 | 34 km/h | 25–40% | × 0.82–0.90 |
| JC08 (legacy JP) | Japan | urban-heavy | similar to NEDC | ~× 0.90–0.95 from WLTC |
| CLTC | China | 29 km/h slowest | 15–25% optimistic vs WLTP | × 0.72–0.77 |
| MIDC | India (until 2027) | 19/59 km/h | ~20–30% optimistic | — |

**EPA is the most realistic of any major market label.** EU WLTP is closer than NEDC was but still ~14% optimistic vs. real-world (ICCT 2024).

### 10.2 Real-World Gap by Region

| Region | Lab→Road gap | Apply correction |
|---|---|---|
| US | ~0% (EPA already corrected) | × 1.00 |
| EU (WLTP) | ~14% | × 1.14 to consumption |
| Japan (WLTC) | ~10% | × 1.10 |
| China (CLTC ICE) | ~20–30% | × 1.20–1.30 |
| India (MIDC) | ~20–30% | × 1.25 |

### 10.3 Speed Limits & City Mix

| Country | Hwy limit | Typical city mix |
|---|---|---|
| US | 55–85 mph | ~55% city / 45% hwy (EPA combined) |
| EU avg | 130 km/h | mixed; northern dense |
| Germany | unrestricted (advisory 130) | many cruise 150–200 km/h — heavy aero penalty |
| UK | 70 mph | moderate |
| Japan | 100 km/h | very urban; WLTC excludes hi-speed phase |
| Australia | 100–110 km/h | mixed |

### 10.4 Powertrain Share by Country (2024–25)

| Market | Diesel | HEV | PHEV | BEV | Manual |
|---|---|---|---|---|---|
| Norway | low | low | low | **~88%** | low |
| China | low | low | medium | ~35–48% | medium |
| EU | 14% | 34.5% | medium | 17.4% | 32% |
| UK | low | medium | medium | 18–20% | medium |
| US | ~5% | 20% (HEV+EV+PHEV) | 1–2% | ~10.5% | <1% |
| Japan | low | very high | low | <5% | very low |
| India | medium | low | low | low | high |

### 10.5 Authoritative Data Sources

| Country | Source | API? |
|---|---|---|
| US | [fueleconomy.gov](https://fueleconomy.gov/ws/rest/) | yes, free, open |
| US (VIN decode) | [NHTSA vPIC](https://vpic.nhtsa.dot.gov/api/) | yes, free |
| Canada | NRCan Fuel Consumption Guide | CSV download |
| EU | EEA CO₂ database | bulk download |
| UK | VCA | download |
| Australia | [Green Vehicle Guide](https://www.greenvehicleguide.gov.au/) | web only |
| Japan | MLIT | web only |
| Crowd-sourced DE | [Spritmonitor](https://www.spritmonitor.de/en/) | unofficial |
| Crowd-sourced US | [Fuelly](https://www.fuelly.com/) | unofficial |
| Crowd-sourced UK | [Honest John Real MPG](https://www.honestjohn.co.uk/real-mpg/) | unofficial |

**No single global fuel-economy API exists.** For non-US markets, scrape national authority files + cross-reference Spritmonitor for real-world calibration.

---

## 11. Edge Cases (Heavy, RV, Motorcycle, Towing, Marine)

### 11.1 Heavy-Duty Trucks

EPA Phase 3 GHG (2027+) regulates Class 3–8 but doesn't produce consumer MPG labels.

[Geotab fleet study (31,170 trucks)](https://www.geotab.com/truck-mpg-benchmark/):
- Class 8 actual range: **4.51 (mountainous BC) – 6.47 MPG (flat NE/Midwest)**
- Best-practice trucks reach 9+ MPG
- ATRI 2025: industry avg 6.8–6.9 MPG
- Empty (bobtail): 7–9; loaded 80k lb: 4.5–6.5

### 11.2 Boats — Use GPH, Not MPG

| Engine | GPH at cruise (~75% WOT) |
|---|---|
| 25 HP outboard 4-stroke | 1.5–2.5 |
| 75 HP outboard | 5–7 |
| 200 HP outboard | 10–15 |
| Twin 300 HP | 35–45 |
| 300 HP gas inboard | ~24.5 (≈ 0.5 × HP / 6.1) |
| Diesel trawler 40' | 3–6 at 8 kt |

Planing hulls: inefficient until on-plane (~25 kt+); displacement hulls: best 6–8 kt. Counterintuitive: planing hull at half-throttle burns more per mile than full throttle.

### 11.3 Generators & Aviation

Generators: ~0.5–1.0 gal/hr per kW at 50% load. 5500W portable at half-load: ~0.6–0.7 gal/hr.

Aviation (out of scope): Cessna 172 at 75% power ~8.5 GPH avgas; jets use lb/hr or kg/hr.

### 11.4 Modified Vehicles

| Mod | MPG impact |
|---|---|
| 2" lift, stock tires | −2 to −5% |
| 4–6" lift + 35" tires | −10 to −20% |
| 6"+ lift + 37–40" mud tires | **−20 to −40%** |
| Wider/heavier wheels | −2 to −5% |
| Rooftop tent (open) | −12 to −18% hwy |
| Rooftop tent (folded hard-shell) | −6 to −10% hwy |
| Cold air intake alone | 0 to +2% (mostly placebo) |
| ECU tune | −5 to +8% (depends on target) |
| −100 lb weight | +1–2% |

### 11.5 Multi-Stop Delivery

For commercial use:
- HD diesel idle: ~0.8 gal/hr
- 2 hr/day idle = 1.6 gal before any miles
- 50+ stops/day cuts effective MPG by 40–60% vs. open hwy
- AI route optimization: 10–25% fleet-wide savings vs. baseline

---

## 12. Physics-Based Modeling

### 12.1 Road Load Equation (EPA / SAE J1263 / J2263)

```
F_roadload = A + B·v + C·v²      [v in mph, F in lbf]
```

Or SI:

```
F_roadload = F0 + F1·v + F2·v²   [v in m/s, F in N]
```

- **A (F0):** static rolling resistance + drivetrain drag
- **B (F1):** speed-dependent rolling resistance + viscous losses
- **C (F2):** aerodynamic = ½·Cd·ρ·Afront

For midsize sedan (Cd 0.30, A 2.3 m², ρ 1.225 kg/m³): **C ≈ 0.42 N·s²/m²**.

EPA publishes per-vehicle A, B, C at [fueleconomy.gov/feg/download.shtml](https://fueleconomy.gov/feg/download.shtml).

### 12.2 Total Tractive Force

```
F_total = A + B·v + C·v² + M·g·sin(θ) + (M + M_rot)·a
```

`M_rot` ≈ 3–5% of M for ICE rotational inertia.

### 12.3 Power Demand Breakdown (Midsize Sedan, 1,600 kg)

| Speed | P_aero | P_roll | P_access | P_total | Aero share |
|---|---|---|---|---|---|
| 25 mph | 0.9 kW | 2.1 kW | 0.7–1.5 | ~4.5 kW | ~20% |
| 55 mph | 10.5 | 4.6 | 0.7–1.5 | ~16.5 | ~64% |
| 75 mph | 26.5 | 6.3 | 0.7–1.5 | ~34.5 | **~77%** |

Aero/roll crossover for cars: ~40–45 mph.

### 12.4 Drivetrain Efficiency Chains

**ICE tank-to-wheel:**
```
η = η_engine × η_trans × η_diff × η_tires
  ≈ 0.28 × 0.95 × 0.98 × 0.99
  ≈ 0.258 (~26% overall)
```

**EV battery-to-wheel:**
```
η = η_battery × η_inverter × η_motor × η_gearbox
  ≈ 0.94 × 0.97 × 0.94 × 0.99
  ≈ 0.849 (~85%)
```

SiC inverters: 99% (vs. silicon 97–98%). Motor peak ~94–96% at optimal load, ~88–91% light load.

**Atkinson HEV (Toyota Camry 2.5L A25A-FKS):** Peak BTE **39.8%** at ~2,500 RPM / 7 bar BMEP — the highest publicly benchmarked NA gas production engine ([PMC/ORNL](https://pmc.ncbi.nlm.nih.gov/articles/PMC7425626/)).

### 12.5 BSFC Maps

Brake Specific Fuel Consumption = fuel mass flow / shaft power [g/kWh]:

| Operating point | Gasoline BSFC |
|---|---|
| Peak island (1,500–3,000 RPM, 8–15 bar BMEP) | 230–260 |
| City light load (~10–20%) | 380–600 |
| Idle | infinite (zero useful work) |
| Diesel minimum | 185–210 |

Why HEVs win city: they shut ICE off or load it to peak BMEP — avoiding the 50–100% BSFC penalty of running the engine at light load.

### 12.6 Validated Modeling Frameworks

| Framework | License | Validation accuracy |
|---|---|---|
| [NREL FASTSim](https://docs.nrel.gov/docs/fy15osti/63623.pdf) | open-source Python | ±5–10% vs. dyno |
| DOE Autonomie | proprietary (Argonne) | similar, more detailed transient |
| [Frontiers 2024 hybrid model](https://www.frontiersin.org/journals/future-transportation/articles/10.3389/ffutr.2024.1334651/full) | open methodology | petrol −1.1%, diesel +9.7%, HEV +10.6%, PHEV +8.7% |
| EPA MOVES | open methodology | fleet-level, not per-trip |
| GREET | open | well-to-wheel fuel cycle |

### 12.7 Trip-Level Calculator Accuracy Ladder

| Approach | Per-trip error |
|---|---|
| Avg speed × EPA rating | ±20–40% |
| Drive cycle matching | ±10–20% |
| Topology-aware (elevation) | ±8–15% |
| Traffic-aware | ±5–12% |
| Full physics + drive cycle | ±5–10% |
| Physics + ML hybrid | ±3–7% |

The current calculator is at the "drive cycle matching + multipliers" tier. Adding elevation moves it down a notch. Adding HVAC + cold-start awareness moves it down again.

### 12.8 Routing API Capabilities

| API | Exposes elevation? | Per-segment speed? | Fuel model? |
|---|---|---|---|
| OpenRouteService | yes (`elevation=true`) | yes | configurable consumption profile |
| OSRM | base no; extensions yes | yes | requires custom graph weights |
| Google Maps | scalar `fuelEfficiencyMultiplier` | yes | black box |

ORS is the best open option for grade-aware physics.

### 12.9 Error Source Ranking

[PMC 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC11729959/):
- Engine/vehicle parameters: ~74% of fleet variance
- Driver behavior: ~15–35% within-vehicle trip-to-trip
- HVAC: 10–30%
- Grade: ~+13.4% per uphill
- Cold start: 10–20% short urban
- Traffic: 5–20% urban

**Practical takeaway:** vehicle calibration matters most in baseline accuracy; driver/style matters most in per-trip variance. Calculator can't measure driver, so expose it as an explicit input.

---

## 13. Recommended Calibration Changes (Concrete)

The minimum-impact / maximum-return changes, in priority order. Each is a specific edit to `app.js`.

### 13.1 Adjust Existing Multipliers (low effort, high impact)

```js
// app.js:126
const STYLE_FUEL_MULT = { eco: 0.88, normal: 1.0, aggressive: 1.25 };  // was eco 0.90, agg 1.20

// app.js:129 — split into context-aware versions
const CONDITION_PENALTY = {
  ac: 0.05,            // was 0.03; this is "AC ON, mild summer day". Hot-day extreme handled separately.
  roofRack: 0.08,      // was 0.10; better midpoint that doesn't overstate SUV. Box on sedan ≈ 0.20.
  towing: 0.35,        // was 0.15; this is a typical highway camper/cargo trailer
  mountainous: 0.20,   // was 0.10; this is rolling/sustained mixed mountain
  cold: 0.15,          // was 0.05; ICE city cold; weather multiplier overlaps so use this only when user manually toggles
  poorRoads: 0.10,     // was 0.08
};
```

### 13.2 New: Trip-Length Cold-Start Modifier

Cold short trips suffer disproportionately. Modify `weatherFuelMultiplier()`:

```js
// Estimate trip length in km from state.distance (already in app)
function weatherFuelMultiplier(w, tripKm) {
  if (!w) return 1.0;
  let m = 1.0;
  const t = w.tempC;
  if (isFinite(t)) {
    // existing cold ramp
    let cold = 0;
    if      (t <= -35) cold = 0.50;
    else if (t <= -25) cold = 0.35;
    else if (t <= -15) cold = 0.22;
    else if (t <=  -5) cold = 0.14;
    else if (t <=   5) cold = 0.07;
    else if (t <=  12) cold = 0.03;
    // NEW: short-trip multiplier (cold-start losses don't amortize)
    if (tripKm && tripKm < 8) cold *= 1.6;        // <5 mi
    else if (tripKm && tripKm < 24) cold *= 1.25; // <15 mi
    else if (tripKm && tripKm > 80) cold *= 0.7;  // >50 mi (long highway, warm engine dominates)
    m += cold;
    // existing hot
    if (t >= 38) m += 0.08;
    else if (t >= 32) m += 0.04;
    else if (t >= 28) m += 0.02;
  }
  // ... rest unchanged
}
```

### 13.3 New: Powertrain-Aware Cold Penalty

If the picked vehicle's `fuelType` indicates hybrid/EV, multiply the cold portion:

```js
function powertrainColdMultiplier(vehicle) {
  if (!vehicle) return 1.0;
  const ft = String(vehicle.fuelType || '').toLowerCase();
  if (ft.includes('electric') && !ft.includes('gasoline')) return 1.4;   // BEV: 1.4× the ICE cold penalty
  if (ft.includes('hybrid') || ft.includes('phev')) return 1.8;          // HEV/PHEV ~2× ICE
  return 1.0;
}
```

Apply this to the `cold` portion of `weatherFuelMultiplier` (separate the cold delta from the hot/precip/wind so you can scale only it).

### 13.4 New: Altitude Awareness

If a route's elevation profile shows sustained altitude >1,500 m, add a penalty. Open-Meteo can return elevation; ORS already does via `elevation=true`.

```js
// crude band-based factor on max elevation:
function altitudeMultiplier(maxElevM, isTurbo /* boolean from vehicle metadata */) {
  if (!isFinite(maxElevM) || maxElevM < 1000) return 1.0;
  // Naturally aspirated curve
  let m = 1.0;
  if      (maxElevM > 3500) m = 1.30;
  else if (maxElevM > 2500) m = 1.20;
  else if (maxElevM > 1500) m = 1.10;
  // Turbo compensates ~50% of the loss
  if (isTurbo) m = 1 + (m - 1) * 0.5;
  return m;
}
```

Determining "turbo" from FuelEconomy.gov data: `cylinders` + `displ` (small displ + high power suggests turbo); or check `eng_dscr` field for "turbo".

### 13.5 New: Fuel-Blend Multiplier

Already partially handled via `fuelType` (regular/mid/premium/diesel). Add explicit ethanol-blend factor:

```js
const FUEL_BLEND_MULT = {
  e0: 1.000,       // ethanol-free (rare in US)
  e10: 1.000,      // baseline (assumption — most US gas)
  e15: 0.985,
  e85: 0.78,       // average year-round
  diesel: 1.000,   // diesel uses its own per-gallon energy already in pricing
  cng_gge: 1.000,  // priced per GGE
};

const SEASONAL_BLEND_MULT = {
  summer: 1.000,
  winter: 0.983,   // 1.7% energy hit
};
```

Detect winter blend from `state.routeWeather.tempC < 7` and a US/Canada region.

### 13.6 Speed-Aware MPG (Optional, Bigger Refactor)

Currently uses EPA city/highway split based on `cityMixPct`. Smarter: derive effective speed from route duration / distance, then map to a speed-vs-MPG curve.

```js
// Returns multiplier on combined MPG given average effective speed (mph)
function speedAdjustment(avgMph) {
  // Anchored to ORNL Table 4.33 for gasoline ICE. Peak ~50–55.
  if (avgMph < 25) return 0.92;       // urban stop-and-go
  if (avgMph < 35) return 0.97;
  if (avgMph < 45) return 1.00;
  if (avgMph < 55) return 1.02;       // sweet spot
  if (avgMph < 65) return 1.00;
  if (avgMph < 75) return 0.92;       // −8%
  if (avgMph < 85) return 0.83;       // −17%
  return 0.75;                          // 85+ mph: −25%
}
```

For EVs use a steeper curve.

### 13.7 Towing & Mountain Subdial

The current single checkbox `towing` is too coarse. Either:
- A. Add a sub-input: "trailer weight" (light/medium/heavy/HD) → look up multiplier 1.20 / 1.35 / 1.50 / 1.65.
- B. Add a sub-input: "average grade" (rolling/moderate/steep) → 1.15 / 1.30 / 1.50.

### 13.8 Don't Compound Weather + Manual `cold`

Currently `applyAdjustments()` multiplies by both `(1 + extra)` from manual conditions and `weatherMult`. If user toggles `cold` AND temp is also <0°C, the penalty double-counts. Fix: when weather is non-default, ignore the manual `cold` and `mountainous` checkboxes — or warn the user.

---

## 14. Recommended New Features

In rough priority order:

1. **Vehicle powertrain detection.** From `fuelType`, classify into ICE / Diesel / HEV / PHEV / BEV. Drive different multiplier sets per category.

2. **BEV-specific calculation path.** kWh/100mi as primary metric, range retention factor by temperature, charging losses, no AC at idle penalty.

3. **PHEV charge-mode input.** "How often do you charge?" → daily / sometimes / rarely → adjust between MPGe (CD) and MPG (CS).

4. **Heat-pump flag** for BEVs. Reduces cold range loss by ~10 percentage points in the 14–45°F band.

5. **Departure time + heat soak / cold soak.** If departure is morning after overnight cold, apply short-trip cold-start bonus penalty for first ~10 min.

6. **Real-world correction by region.** US: ×1.00 (EPA). EU/UK: ×1.14 (WLTP). China: ×1.25 (CLTC). When user picks a non-US country and a US-spec vehicle, warn that EPA is the most realistic baseline.

7. **Vehicle age / mileage degradation slider.** Default: 1.00 for <5 years. Slider to 0.85 for "neglected high-mileage."

8. **Winter blend auto-detect.** If country = US/CA and month = Oct–Apr, multiply by 0.983.

9. **Altitude profile from ORS.** Auto-extract max elevation from route, apply altitude multiplier, surface in UI.

10. **Trip-length awareness.** Already need it for cold-start; also useful for very-short-trip (<1 mi) heat-soak parking warnings.

11. **Per-station price reports + per-user accuracy correction.** When user reports actual fuel used after a trip, store the ratio actual/predicted as a personal correction factor. Converges in 3–5 trips.

12. **EV charging cost mode.** Ask charger type (L1 / L2 / DCFC) → apply 1.10× multiplier on metered kWh to reflect wall→battery losses; for DCFC, also ask "fast charge home rate or commercial rate" since pricing differs widely.

13. **Tank-by-tank logbook.** Optional opt-in. Lets users track real MPG over time, which is the most accurate possible signal.

14. **Heavy-duty / commercial mode.** Switch to gallons-per-hour or gallons-per-day with idle-time and stops/day inputs for delivery use cases.

15. **Boat mode.** GPH-based, planing vs. displacement hull dropdown.

---

## 15. Consolidated Source List

### Government / Authoritative

- [DOE — fueleconomy.gov, Cold Weather](https://www.fueleconomy.gov/feg/coldweather.shtml)
- [DOE — fueleconomy.gov, Hot Weather](https://www.fueleconomy.gov/feg/hotweather.shtml)
- [DOE — fueleconomy.gov, Drive Habits](https://www.fueleconomy.gov/feg/driveHabits.jsp)
- [DOE — fueleconomy.gov, Octane](https://www.fueleconomy.gov/feg/octane.shtml)
- [DOE — fueleconomy.gov, Ethanol/E85](https://www.fueleconomy.gov/feg/ethanol.shtml)
- [DOE — fueleconomy.gov, Maintenance](https://www.fueleconomy.gov/feg/maintain.jsp)
- [DOE — fueleconomy.gov, Test Schedules](https://www.fueleconomy.gov/feg/fe_test_schedules.shtml)
- [DOE — fueleconomy.gov, Transmissions](https://www.fueleconomy.gov/feg/tech_transmission.shtml)
- [DOE — fueleconomy.gov, Factors](https://www.fueleconomy.gov/feg/factors.shtml)
- [DOE — fueleconomy.gov, Data Download](https://fueleconomy.gov/feg/download.shtml)
- [DOE — Driving More Efficiently](https://www.energy.gov/energysaver/driving-more-efficiently)
- [DOE Fact #826 — Tire Pressure Effect](https://www.energy.gov/cmei/vehicles/fact-826-june-23-2014-effect-tire-pressure-fuel-economy)
- [DOE Fact #861 — Idle Fuel Consumption](https://www.energy.gov/cmei/vehicles/fact-861-february-23-2015-idle-fuel-consumption-selected-gasoline-and-diesel-vehicles)
- [DOE Fact #981 — Cargo Box Penalty](https://www.energy.gov/eere/vehicles/fact-981-june-12-2017-using-cargo-box-top-vehicle-can-reduce-fuel-economy-25)
- [DOE FOTW #1373 Dec 2024 — EV Efficiency MY24](https://www.energy.gov/cmei/vehicles/articles/fotw-1373-december-16-2024-efficiency-evs-model-year-2024-ranges-53-140-mpge)
- [DOE VTO Sept 2024 — Cold Ambient BEV Performance](https://www.energy.gov/sites/default/files/2024-10/Impact_of_Cold_Ambient_Temperature_on_BEV_Performance_v15_TechEditFinal_12Sep2024__0.pdf)
- [EPA Automotive Trends Report Highlights](https://www.epa.gov/automotive-trends/highlights-automotive-trends-report)
- [EPA Auto Trends 2025 PDF (MY24 data)](https://www.epa.gov/system/files/documents/2026-02/420r26001.pdf)
- [EPA 50 Years of Auto Trends](https://www.epa.gov/greenvehicles/50-years-epas-automotive-trends-report)
- [40 CFR Part 1066 Subpart D — Coastdown](https://www.ecfr.gov/current/title-40/chapter-I/subchapter-U/part-1066/subpart-D)
- [Federal Register 2006 — Fuel Economy Label Revision](https://www.federalregister.gov/documents/2006/02/01/06-451/fuel-economy-labeling-of-motor-vehicles-revisions-to-improve-calculation-of-fuel-economy-estimates)
- [EPA VW Dieselgate](https://www.epa.gov/vw/learn-about-volkswagen-violations)
- [EPA Phase 3 GHG Heavy-Duty](https://www.epa.gov/regulations-emissions-vehicles-and-engines/final-rule-greenhouse-gas-emissions-standards-heavy-duty)
- [EIA Fuel Heat Content FAQ](https://www.eia.gov/tools/faqs/faq.php?id=27&t=10)
- [EIA Monthly Energy Review 2026](https://www.eia.gov/totalenergy/data/monthly/pdf/mer_a_doc.pdf)
- [EIA Summer-Grade Switch](https://www.eia.gov/todayinenergy/detail.php?id=11031)
- [EIA Gasoline Formulations](https://www.eia.gov/todayinenergy/detail.php?id=67464)
- [EIA Energy Density: Gas vs. Diesel](https://www.eia.gov/todayinenergy/detail.php?id=14451)
- [AFDC Fuel Properties Comparison](https://afdc.energy.gov/fuels/properties)
- [AFDC Fuel Economy at Various Driving Speeds (ORNL TEDB)](https://afdc.energy.gov/data/10312)
- [AFDC Fuel Economy by Vehicle Category](https://afdc.energy.gov/data/10310)
- [AFDC Fuel Consumption at Road Grades](https://afdc.energy.gov/data/10601)
- [AFDC Vehicle Weight Classes](https://afdc.energy.gov/data/10380)
- [AFDC Biodiesel Blends](https://afdc.energy.gov/fuels/biodiesel-blends)
- [NHTSA vPIC API](https://vpic.nhtsa.dot.gov/api/)
- [NHTSA Tire Fuel Efficiency](https://downloads.regulations.gov/NHTSA-2025-0491-0088/attachment_36.pdf)

### National Labs / Research Centers

- [ORNL — Sensible Driving](https://www.ornl.gov/news/sensible-driving-saves-more-gas-drivers-think)
- [ORNL — Seasonal EV Energy Consumption](https://www.ornl.gov/publication/seasonal-effects-electric-vehicle-energy-consumption-and-driving-range-case-study)
- [ORNL TEDB Edition 40 (Stanford mirror)](http://large.stanford.edu/courses/2024/ph240/aleman1/docs/ornl-tm-2022-2376.pdf)
- [ORNL Roof Rack Fuel Consumption Paper](https://www.osti.gov/servlets/purl/1257753)
- [Berkeley Lab — Roof Rack Drag](https://newscenter.lbl.gov/2016/04/25/roof-racks-drag-fuel-economy/)
- [NREL FASTSim Tech Report](https://docs.nrel.gov/docs/fy15osti/63623.pdf)
- [NREL AC Impact Study](https://docs.nrel.gov/docs/fy00osti/28960.pdf)
- [NREL Fairbanks AK EV Weather](https://docs.nrel.gov/docs/fy25osti/92113.pdf)
- [NREL/Ethanol RFA Water Uptake E10](https://ethanolrfa.org/file/1793/Water-Update-Weathering-of-Ethanol-Gasoline-Blends-in-Humid-Environments_NREL_2016-09.pdf)
- [Argonne — Idling Worksheet](https://www.anl.gov/sites/www/files/2018-02/idling_worksheet.pdf)
- [Argonne — Autonomie 2021](https://publications.anl.gov/anlpubs/2021/10/171713.pdf)
- [PMC/ORNL — Camry Atkinson Engine BTE 39.8%](https://pmc.ncbi.nlm.nih.gov/articles/PMC7425626/)
- [PMC 2025 — Driving Characteristics & Fuel Consumption](https://pmc.ncbi.nlm.nih.gov/articles/PMC11729959/)
- [Western Transportation Institute — Alt Fuels at Altitude](https://westerntransportationinstitute.org/wp-content/uploads/2018/02/TRIPTAC-TA_Alternative_Fuesl_Altitude.pdf)

### International

- [IEA Global EV Outlook 2025](https://www.iea.org/reports/global-ev-outlook-2025/trends-in-electric-car-markets-2)
- [ICCT — Vehicle Emissions Test Cycles](https://theicct.org/which-vehicle-emissions-test-cycle-is-most-demanding/)
- [ICCT — From Lab to Road series](https://theicct.org/series/from-lab-to-road/)
- [ICCT — Real-world gap grows again 2024](https://theicct.org/pr-en-gap-between-real-world-and-official-values-for-co2-emissions-and-fuel-consumption-grows-again-despite-new-test-procedure-jan24/)
- [ICCT 2016 Coastdown White Paper](https://theicct.org/sites/default/files/publications/ICCT_Coastdowns-EU_201605.pdf)
- [ICCT India BS VI Fuel Specs](https://theicct.org/wp-content/uploads/2021/06/BS-VI-Fuel-Spec-Working-Paper-vF.pdf)
- [ACEA EU Registrations 2025 BEV 17.4%](https://www.acea.auto/pc-registrations/new-car-registrations-1-8-in-2025-battery-electric-17-4-market-share/)
- [Just Auto — EU 2024 Diesel 14%](https://www.just-auto.com/industry-data/europes-2024-new-car-diesel-share-below-2023-at-14-0-globaldata/)
- [Dieselnet — Japan FE Standards](https://dieselnet.com/standards/jp/fe.php)
- [Japan Inspection Org — WLTC](https://japaninspection.org/worldwide-harmonized-light-vehicles-test-cycle-wltc-in-japan/)
- [ArenaEV — NEDC vs EPA vs WLTP](https://www.arenaev.com/comparison_of_nedc_epa_and_wltp_cycles-news-419.php)
- [CarBuzz — EPA vs WLTP vs CLTC](https://carbuzz.com/features/epa-vs-wltp-vs-cltc-comparing-fuel-consumption-figures-from-around-the-world/)

### Industry / Independent

- [AAA — EV Range Extreme Temps](https://ev.aaa.com/articles/extreme-temperatures-affect-range-of-electric-vehicles/)
- [AAA — Stop-Start Real-World](https://newsroom.aaa.com/2014/07/aaas-tests-reveal-real-world-benefits-automatic-stop-start-technology/)
- [AAA — Top Tier via MFA Oil](https://www.mfaoil.com/aaa-study-shows-top-tier-gasoline-benefits-drivers/)
- [Recurrent — Winter EV Range Loss (30k vehicles)](https://www.recurrentauto.com/research/winter-ev-range-loss)
- [Recurrent — A/C and EV Range](https://www.recurrentauto.com/research/what-a-c-does-to-your-range)
- [Recurrent — Heat Pumps](https://www.recurrentauto.com/research/heat-pumps)
- [Recurrent — Charging Losses](https://www.recurrentauto.com/research/why-doesnt-your-battery-get-all-the-energy-you-pay-for)
- [Geotab — EV Battery Health 22,700 vehicles](https://www.geotab.com/blog/ev-battery-health/)
- [Geotab — Truck MPG Benchmark 31,170 trucks](https://www.geotab.com/truck-mpg-benchmark/)
- [ATRI 2025 Operational Costs (Fleet Maintenance)](https://www.fleetmaintenance.com/equipment/article/55301363/american-transportation-research-institute-atri-breakdown-of-atri-2025-operational-costs-report)
- [Spritmonitor (DE crowd data)](https://www.spritmonitor.de/en/)
- [Honest John Real MPG (UK)](https://www.honestjohn.co.uk/real-mpg/)
- [Fuelly (US)](https://www.fuelly.com/)

### Peer-Reviewed / Academic

- [SAE 2014-01-1614 Roof Box & Trailers via ScienceDaily](https://www.sciencedaily.com/releases/2014/04/140409103335.htm)
- [SAE Mobilus 2025-01-8605 Aggressive Driving](https://saemobilus.sae.org/papers/a-comparative-analysis-acceleration-deceleration-profiles-aggressive-driving-styles-fuel-economy-test-cycles-2025-01-8605)
- [SAE/OSTI 2023-01-0346 Stop-Start](https://www.osti.gov/servlets/purl/2205440)
- [SAE J2841 PHEV Utility Factor](https://www.sae.org/standards/content/j2841/)
- [Frontiers Future Transp 2024 — Real-World Sim](https://www.frontiersin.org/journals/future-transportation/articles/10.3389/ffutr.2024.1334651/full)
- [ScienceDirect — Roof Rack Energy Policy 2016](https://www.sciencedirect.com/science/article/abs/pii/S0301421516300714)
- [ScienceDirect — Octane/BSFC Turbo DI 2024](https://www.sciencedirect.com/science/article/pii/S0016236124014352)
- [ScienceDirect — DPF Regen Fuel Penalty](https://www.sciencedirect.com/science/article/abs/pii/S0045653522031228)
- [ScienceDirect — DCFC Degradation Cost 2025](https://www.sciencedirect.com/science/article/abs/pii/S0378775325013886)
- [ScienceDirect — HEV vs ICE Real-World](https://www.sciencedirect.com/science/article/abs/pii/S037877532401142X)
- [ScienceDirect — AutonomieAI 2025](https://www.sciencedirect.com/science/article/abs/pii/S1361920925000963)
- [Nature Communications 2024 — ACC Fuel Consumption](https://www.nature.com/articles/s41467-024-54066-8)
- [Springer 2024 — Driving Behavior in Fuel Prediction](https://link.springer.com/article/10.1007/s43621-024-00511-z)
- [Springer Nature 2025 — Temp/Humidity Modeling](https://link.springer.com/article/10.1007/s44274-025-00468-4)
- [MDPI Atmosphere — Road Gradient Light-Duty Diesel](https://www.mdpi.com/2073-4433/16/2/143)
- [MDPI Energies — PHEV J2841 Update](https://www.mdpi.com/2032-6653/17/5/242)
- [MDPI Energies — EV Braking Energy Recovery](https://www.mdpi.com/1996-1073/15/24/9369)
- [arXiv 2011.13556 — Eco-Routing OSM/OSRM](https://arxiv.org/abs/2011.13556)
- [EVS-38 — Heat Pump vs Resistive](https://evs38-program.org/images/Proceedings/H%20Electric%20Vehicle%20management/370_A%20Comparison%20of%20Heat%20Pump%20and%20Resistive%20Heating%20Impacts%20on%20Battery%20Electric%20Vehicle%20Energy_Consumption%20and%20Range%20in%20Cold%20Temperatures.pdf)
- [CMU/Yuksel & Michalek 2015 — Regional Temperature & EV](https://www.cmu.edu/me/ddl/publications/2015-EST-Yuksel-Michalek-EV-Weather.pdf)

### Trade / Consumer

- [Consumer Reports — Top Tier Worth It](https://www.consumerreports.org/cars/fuel-economy-efficiency/top-tier-gasoline-worth-the-extra-price-a7682471234/)
- [Consumer Reports — Rooftop Carriers](https://www.consumerreports.org/fuel-economy-efficiency/how-rooftop-carriers-affect-fuel-economy/)
- [Consumer Reports — LRR Tires](https://www.consumerreports.org/cars/tires/low-rolling-resistance-tires-can-save-you-money-at-pump-a1547901110/)
- [Edmunds — Premium Fuel Don't Bother](https://www.edmunds.com/fuel-economy/to-save-money-on-gas-stop-buying-premium.html)
- [Edmunds — 2008 EPA Method](https://www.edmunds.com/fuel-economy/explained-2008-epa-fuel-economy-ratings.html)
- [Edmunds — Real-World vs EPA](https://www.edmunds.com/fuel-economy/heres-why-real-world-mpg-doesnt-match-epa-ratings.html)
- [InsideEVs — Speed Kills EV Range](https://insideevs.com/features/775845/going-fast-shrinks-ev-range/)
- [InsideEVs — Coasting vs Regen](https://insideevs.com/features/754587/coasting-vs-regenerative-braking-efficiency-test/)
- [InsideEVs — F-150 Lightning Towing](https://insideevs.com/news/604213/ford-f150-lightning-towing-real-world-range-test/)
- [InsideEVs — Tesla Supercharging Preconditioning](https://insideevs.com/news/699912/supercharging-tesla-winter-preconditioned-vs-cold-battery-test/)
- [InsideEVs — EV Charger Efficiency](https://insideevs.com/features/711659/ev-charger-efficiency-losses/)
- [Green Car Reports — Turbo MPG](https://www.greencarreports.com/news/1109366_small-turbo-engines-get-good-mpg-ratings-real-world-use-may-be-a-different-story)
- [Green Car Reports — Multi-speed Gains Diminish](https://www.greencarreports.com/news/1118080_multi-speed-transmissions-and-turbochargers-dont-save-much-fueloh-really-analysis)
- [Green Car Reports — Roof Boxes](https://www.greencarreports.com/news/1097829_yes-roof-boxes-and-ski-racks-really-do-cut-mpgmore-than-you-might-think)
- [HowStuffWorks — Drafting Trucks](https://auto.howstuffworks.com/fuel-efficiency/fuel-economy/follow-that-truck.htm)
- [HowStuffWorks — Windows Down vs AC](https://auto.howstuffworks.com/fuel-efficiency/hybrid-technology/driving-with-windows-down.htm)
- [Wikipedia — Octane Rating](https://en.wikipedia.org/wiki/Octane_rating)
- [Wikipedia — Diesel Exhaust Fluid](https://en.wikipedia.org/wiki/Diesel_exhaust_fluid)
- [Wikipedia — Winter Diesel Fuel](https://en.wikipedia.org/wiki/Winter_diesel_fuel)
- [Wikipedia — WLTP](https://en.wikipedia.org/wiki/Worldwide_Harmonised_Light_Vehicles_Test_Procedure)
- [Wikipedia — CLTC](https://en.wikipedia.org/wiki/China_Light-Duty_Vehicle_Test_Cycle)
- [Wikipedia — VW Emissions Scandal](https://en.wikipedia.org/wiki/Volkswagen_emissions_scandal)
- [Wikipedia — Rolling Resistance](https://en.wikipedia.org/wiki/Rolling_resistance)
- [Wikipedia — LRR Tire](https://en.wikipedia.org/wiki/Low_rolling_resistance_tire)
- [Wikipedia — Energy-Efficient Driving](https://en.wikipedia.org/wiki/Energy-efficient_driving)
- [Wikipedia — Fuel Economy in Automobiles](https://en.wikipedia.org/wiki/Fuel_economy_in_automobiles)
- [Wikipedia — Auto Drag Coefficient](https://en.wikipedia.org/wiki/Automobile_drag_coefficient)
- [PowerSportsGuide Motorcycle MPG](https://powersportsguide.com/motorcycle-mpg/)
- [Lazy Days — RV MPG by Class](https://www.lazydays.com/rv-lifestyle/how-many-miles-per-gallon-can-you-expect-from-rv-guide-fuel-efficiency-class)
- [The RV Geeks — Class A MPG](https://www.thervgeeks.com/whats-the-typical-fuel-economy-of-a-class-a-motorhome/)
- [Crow Survival — RV Tank Size](https://crowsurvival.com/average-rv-gas-tank-size/)
- [U-Pack — U-Haul MPG](https://www.upack.com/articles/what-is-the-gas-mileage-of-a-u-haul-rental-truck)
- [HireAHelper — Rental Truck MPG](https://blog.hireahelper.com/how-to-save-money-on-your-rental-trucks-gas/)
- [American Trucks — Lifted Trucks MPG](https://www.americantrucks.com/do-lifted-trucks-consume-more-fuel.html)
- [Tuff Stuff Overland — Rooftop Tent MPG](https://tuffstuffoverland.com/blogs/blog/how-much-does-a-rooftop-tent-impact-gas-mileage)
- [DrivingLine — Anti-Aero Accessories](https://www.drivingline.com/articles/take-down-that-roof-top-tent-the-brutal-fuel-mileage-damage-done-to-your-wallet-by-anti-aero-accessories/)
- [Garrett Motion — Turbocharging at Elevation](https://www.garrettmotion.com/news/newsroom/article/how-to-turbocharge-at-elevation-counteracting-lower-air-density/)
- [Alberini — Boat Fuel Consumption](https://www.albernipowermarine.com/blog/a-comprehensive-guide-to-boat-fuel-consumption)
- [Weigh Safe — Tongue Weight Fuel](https://www.weigh-safe.com/towing-safety/how-tongue-weight-affects-fuel-efficiency/)
- [Black Series — Travel Trailer MPG](https://www.blackseries.net/blog/gas-mileage-towing-travel-trailer.html)
- [Cigo Tracker — Route Optimization Fuel](https://cigotracker.com/glossary/understanding-why-optimized-routes-reduce-fuel-consumption-a-comprehensive-guide/)
- [SD Truck Springs — Half-Ton Towing MPG](https://sdtrucksprings.com/best-mpg-while-towing-with-half-ton-pickup-f150-silverad-ram-1500)
- [SlashGear — Towing MPG/Range](https://www.slashgear.com/1827403/how-towing-affect-mpg-range/)
- [Recharged — EV Towing Range Loss](https://recharged.com/articles/ev-towing-range-loss-percentage)
- [Recharged — Regen Braking Energy](https://recharged.com/articles/regenerative-braking-energy-guide)
- [Recharged — EV Charging Efficiency](https://recharged.com/articles/electric-vehicle-efficiency-comparison)
- [TFLTruck — Weight vs Aero Towing](https://tfltruck.com/2025/08/weight-vs-aerodynamics-which-towing-scenario-burns-more-fuel-video/)
- [Autoblog — PHEV vs MPG Claims](https://www.autoblog.com/news/why-plug-in-hybrids-rarely-match-their-mpg-claims)
- [Tomorrow's Technician — O2 Sensors](https://www.tomorrowstechnician.com/oxygen-sensors/)
- [Tire Review — O2 Sensors Performance](https://www.tirereview.com/oxygen-sensors-are-key-to-performance-fuel-economy/)
- [TireBuyer — Rolling Resistance](https://www.tirebuyer.com/education/rolling-resistance-and-fuel-economy)
- [Continental — Rolling Resistance](https://www.continental-tires.com/about-us/sustainability/activities-and-initiatives/product-use/tire-related-use-phase-emissions/rolling-resistance/)
- [NAPA — Wheel Alignment & Fuel](https://knowhow.napaonline.com/how-your-vehicles-wheel-alignment-affects-fuel-economy/)
- [Schrader TPMS — Tire Pressure & Fuel](https://www.schradertpms.com/en/driver-education/tire-pressure-and-fuel-economy)
- [Hagerty — Fuel-Efficient Classics](https://www.hagerty.com/media/market-trends/fuel-efficient-american-classics/)
- [Garadesud — Fuel Economy by Mileage](https://garadesud.md/fuel-economy-by-mileage-a-data-driven-analysis-of-how-vehicle-mileage-impacts-fuel-consumption/)
- [Carwise LA — Toyota Reliability](https://www.carwisela.com/blogs/are-toyotas-truly-reliable-the-surprising-data-car-buyers-must-see)
- [Safford Brown — JD Power Toyota vs Honda](https://www.saffordbrowntoyotaglenburnie.com/is-toyota-more-reliable-than-honda/)
- [Gas Mileage Guide — Prius Owner Data](https://gasmileageguide.com/blog/us/toyota-prius-real-world-mpg-owner-data-50k-miles/)
- [TorqueNews — Prius 228k Battery](https://www.torquenews.com/1084/my-2017-toyota-prius-228k-miles-mileage-dropped-40-mpg-no-warning-lights-now-i-get-code)
- [TorqueNews — 2025 Prius Cold MPG](https://www.torquenews.com/1084/2025-toyota-prius-owner-reports-getting-only-349-mpg-why-awd-models-are-missing-49-mpg-epa-mark-in-cold-climates)
- [The Conversation — EV City > Highway](https://theconversation.com/batteries-in-electric-vehicles-have-more-mileage-in-city-driving-rather-than-highway-driving-206564)
- [CleanTechnica — Recurrent EV Cold 2025](https://cleantechnica.com/2025/02/10/recurrent-data-clarifies-ev-range-loss-in-cold-conditions/)
- [CNBC — US EV+Hybrid 20% 2024](https://www.cnbc.com/2025/01/16/electric-vehicle-ev-hybrid-sales-united-states-2024.html)
- [Motor1 — Manual Trans Decline](https://www.motor1.com/news/694709/manual-transmissions-rarity-industry-world/)
- [Cars Dekho — India WLTP 2027](https://www.cardekho.com/india-car-news/india-to-adopt-wltp-emission-testing-cycle-from-april-2027-what-it-means-for-you-35639.htm)
- [Bell Performance — E10 Phase Separation](https://www.bellperformance.com/blog/bid/114018/phase-separation-water-e10)
- [AMSOIL — Summer vs Winter Blend](https://blog.amsoil.com/the-difference-between-winter-and-summer-blend-gas/)
- [AAA Car Connect — Summer vs Winter Gas](https://www.acg.aaa.com/connect/blogs/4c/auto/what-to-know-about-gasoline-blends-summer-vs-winter)
- [Fuel Logic — Diesel Grades](https://www.fuellogic.net/different-diesel-fuel-grades/)
- [OTR Solutions — Winter Blend Diesel](https://otrsolutions.com/blog/winter-blend-diesel-fuel)
- [fuel-prices.eu — Global Grades](https://www.fuel-prices.eu/fuel-grades/)
- [Top Tier Gas — CR Touts](https://www.toptiergas.com/2026/04/29/consumer-reports-touts-top-tier/)
- [FleetRabbit — Altitude Fuel Mixture](https://fleetrabbit.com/blogs/post/how-altitude-impacts-fuel-mixture-and-engine-performance)
- [CarShield — Altitude Engine Performance](https://carshield.com/education-center/2023/06/does-high-altitude-travel-affect-vehicle-engine-performance-and-gas-mileage)
- [ARC Indy — Aerodynamic Drag Fuel](https://www.arcindy.com/effect-of-aerodynamic-drag-on-fuel-economy.html)
- [X-Engineer — BSFC](https://x-engineer.org/brake-specific-fuel-consumption-bsfc/)
- [Claytex — Atkinson Cycle](https://www.claytex.com/tech-blog/the-atkinson-cycle-and-improving-the-ices-efficiency/)
- [Power Electronics News — SiC Inverter](https://www.powerelectronicsnews.com/silicon-carbide-sic-inverter-extends-ev-range-by-over-7/)
- [EV Engineering Online — Well-to-Wheel](https://www.evengineeringonline.com/what-is-well-to-wheel-efficiency-in-an-ev/)
- [National Academies — 21st Century Truck](https://www.nationalacademies.org/read/13288/chapter/7)
- [Hypermiler.co.uk — Techniques](https://www.hypermiler.co.uk/hypermiling/hypermiling-techniques)
- [Nashville Performance — AC Impact](https://nashvilleperformance.com/impact-of-air-conditioning-on-fuel-efficiency/)
- [ResearchGate — DPF Regen Diagram](https://www.researchgate.net/figure/Effect-of-active-DPF-regeneration-event-on-fuel-consumption-for-the-International-engine_fig7_267576579)
- [Clean Fleet Report — Stop-Start](https://cleanfleetreport.com/stop-start-car/)
- [ScienceDaily — SAE 2014-01-1614](https://www.sciencedaily.com/releases/2014/04/140409103335.htm)
- [Geotab UK — 2024 Battery Degradation Press](https://www.geotab.com/uk/press-release/2024-battery-degradation/)
- [ORS Routing Options Docs](https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/routing-options)
- [rOpenGov mpg R package](https://github.com/rOpenGov/mpg)
- [AutoEvolution — WLTP/EPA/CLTC](https://www.autoevolution.com/news/wltp-vs-epa-vs-cltc-why-range-estimates-differ-and-which-is-the-most-realistic-261500.html)

---

*Document compiled from 10 parallel research passes. Last updated: 2026-05-04.*
