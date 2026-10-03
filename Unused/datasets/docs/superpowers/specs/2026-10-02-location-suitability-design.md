# Location Suitability — Design Spec

**Date:** 2026-10-02
**Status:** approved section-by-section in brainstorming (Sections 1–4), user: "hunxa lekhna sath implement ni gara"
**Reference:** designer screenshots (5) — the Location tab must match them exactly ("same as ss garni")

## Goal

Transform the Location tab from a GPS-tagger settings screen into the designer's
**"Location Suitability"** analysis screen: given the phone's GPS fix, show a
potato-growing suitability score, altitude/temperature/rainfall/soil/climate
factors, recommended varieties and growing tips — grounded in **Nepal's
geography and NARC agronomy** (user directive: "nepal ko geography anushar ko
nikalerw matra garni").

## Locked decisions

1. **Location tab = exact designer screenshot replica.** No tagger UI on it.
2. **Tagger controls move to Profile** ("Field & location settings" row →
   modal with the existing toggle + village-label panel). The `captureTag`
   background flow that stamps history entries is **unchanged**.
3. **Architecture A:** one backend endpoint computes everything; mobile only
   renders (Python rules are unit-testable).
4. **i18n: English + Nepali** for all new strings.
5. **Constraints:** zero new pip deps (stdlib `urllib`), additive-only API,
   plain-string `detail` errors.

## Architecture

```
Mobile Location tab                     Backend (new router location.py)
"Analyze My Location" ── GPS fix ──► GET /location/analyze?lat=&lon=
  (expo-location, existing      │
   permission)                  ├─ cache hit (0.01° cell, TTL 30d) → JSON
                                ├─ miss → fetch (urllib, 7s timeout each):
                                │    hard: Open-Meteo elevation,
                                │          Open-Meteo temperature
                                │    soft: Open-Meteo climate (rain),
                                │          SoilGrids sand/clay/silt/pH,
                                │          Nominatim reverse label
                                ├─ pure rules → score/bands/varieties/tips
                                └─ cache + respond
Mobile: AsyncStorage last analysis (offline → stale + Retry)
```

- **Endpoint:** `GET /location/analyze?lat=&lon=` — public (no auth; the
  Location tab is not auth-gated), read-only data.
- **Cache:** SQLite table `location_analysis(lat_key, lon_key, payload,
  created_at)`; key = coords rounded to 0.01° (~1 km); TTL 30 days (soil and
  climate barely change at that grain; Nominatim 1 req/s policy respected
  because it is only hit on cache miss).

## Data sources (live-verified 2026-10-02)

| Fact | Endpoint | Status |
|---|---|---|
| Altitude | `https://api.open-meteo.com/v1/elevation?latitude&longitude` (Copernicus DEM GLO-90) | ✅ 855 m Pokhara |
| Temperature | `https://api.open-meteo.com/v1/forecast?...&current=temperature_2m` + climate-normal (below) | ✅ |
| Rainfall | `https://climate-api.open-meteo.com/v1/climate?...&daily=precipitation_sum` (default model) | ✅ |
| Soil texture + pH | `https://rest.isric.org/soilgrids/v2.0/properties/query?lon&lat&property=clay|sand|silt|phh2o&depth=0-5cm&value=mean` | ✅ Terai pixels; **some pixels null** (e.g. lake) → heuristic fallback |
| Place label | `https://nominatim.openstreetmap.org/reverse?lat&lon&format=json&zoom=10` + custom UA | ✅ "पोखरा, कास्की, …" |
| Season / varieties / tips / scoring | static Nepal knowledge tables below | logic |

All non-commercial free usage, no API keys. SoilGrids values are g/kg
(`d_factor 10` → % = value/10).

## Response JSON schema

```json
{
  "score": 86, "band": "Excellent",
  "place": "पोखरा, कास्की, गण्डकी प्रदेश, नेपाल",
  "coords": {"lat": 28.2132, "lon": 83.9908},
  "altitude_m": 811,
  "recommendation": "…template by band × belt…",
  "summary": {"temp_c": 13, "season": "Winter (Oct–Feb) & Spring (Mar–May)", "soil": "Sandy Loam"},
  "factors": [
    {"key": "altitude", "label": "Altitude",         "value": "811m",       "score": 78, "why": "…"},
    {"key": "temp",     "label": "Est. Temperature", "value": "~13°C",      "score": 95, "why": "…"},
    {"key": "rainfall", "label": "Rainfall Zone",    "value": "Warm Temperate", "score": 85, "why": "…"},
    {"key": "soil",     "label": "Est. Soil Type",   "value": "Sandy Loam", "score": 90, "why": "…"},
    {"key": "climate",  "label": "Climate Zone",     "value": "Temperate",  "score": 85, "why": "…"}
  ],
  "challenges": ["Monsoon disease pressure (Jun–Sep)"],
  "rainfall_zone": "Warm Temperate",
  "region": "mid-hills",
  "varieties": ["Khumal Seto-1", "Desiree", "Janakdev", "Diamant"],
  "tips": ["Plant in well-prepared ridges…"]
}
```

Errors: `400 "Invalid coordinates"` (lat ∉ [-90,90] or lon ∉ [-180,180] or
missing); `502 "Location service unavailable"` (hard source failed);
`504 "Location service timeout"` (hard source timed out).

Hard vs soft, precisely: **elevation** is hard (nothing to derive without it).
**Temperature** is hard only if *both* its sources fail (climate-normal first,
7-day forecast mean as fallback). **Rainfall** is soft: if the climate API
fails, the rainfall factor gets a neutral 75, moisture-driven challenges are
skipped, and `rainfall_zone` still comes from the altitude belt. Soil and
label are soft as described below.

## Backend rules (Nepal-grounded)

### Agro-ecological altitude zones (Nepal DofA/DoF classification)

| Zone | Altitude (m) | Potato note |
|---|---|---|
| Tropical (Terai/Inner Terai) | < 300 | winter potato, irrigation-dependent |
| Sub-tropical (low hills) | 300–1000 | major belt |
| Warm temperate (mid-hills) | 1000–2000 | 41.5 % of national potato area is mid-hills |
| Cool temperate (high hills) | 2000–3000 | main high-hill belt |
| Sub-alpine | 3000–4000 | marginal (Jumla-type summer potato) |
| Alpine / nival | > 4000 | no potato (national max ≈ 4000 m) |

### Altitude score (piecewise; full marks inside the designer's stated optimum)

| alt (m) | <100 | 100–400 | 400–800 | **800–3000** | 3000–3500 | 3500–4000 | >4000 |
|---|---|---|---|---|---|---|---|
| score | 40 | 65 | 85 | **100** | 75 | 45 | 0 |

Linear interpolation between breakpoints. `factor.why` cites the band.

### Est. temperature

- Primary: **climate-normal for the current month** — Open-Meteo climate API
  `daily=temperature_2m_mean` over the last 3 years, filtered to the current
  NPT month, averaged (stable day/night → stable score).
- Fallback (climate API down): mean of forecast `temperature_2m` next 7 days.
- Score: **8–20 °C = 100** (tuber initiation needs cool); 5–8 / 20–23 → 80;
  0–5 / 23–26 → 60; <0 / >26 → 25.

### Rainfall (annual mm) & moisture knowledge

- 24 months of `precipitation_sum` → mean annual mm.
- Moisture class (drives challenges): `<500` Arid · `500–1000` Semi-arid ·
  `1000–1500` Sub-humid · `1500–2500` Humid · `>2500` Per-humid.
- **`rainfall_zone` factor value = agro-ecological belt name** (see zones
  table) — matches the screenshot's "Rainfall Zone: Warm Temperate" style.
  The payload carries the **short** name (`Warm Temperate`, not
  `Warm temperate (mid-hills)`). Additive `region` key
  (`Terai`/`low hills`/`mid-hills`/`high hills`/`Himalaya`, from altitude;
  811 m → `mid-hills`) feeds the recommendation `{zone}` placeholder — the
  screenshot's "…typical of Nepal's mid−hills".
- Rainfall score: **600–2000 mm = 100**; 400–600 / 2000–2800 → 80;
  200–400 / 2800–3500 → 60; else 30.

### Climate zone (temperature regime)

Coldest-month mean: `≥14.5 °C → Tropical` (modified-Köppen Terai boundary),
`8–14.5 → Subtropical`, `3–8 → Temperate`, `0–3 → Cold`, `<0 → Alpine`.

### Soil

- SoilGrids 0–5 cm mean: clay/sand/silt (g/kg → %) → **USDA texture
  classifier** (standard 12-class sand/silt/clay bounds).
- Texture score: loam / sandy loam / silt loam / clay loam = 95; sandy clay
  loam / loamy sand = 85; sandy / silty clay loam = 70; clay / heavy = 55.
- pH (phh2o/10): 5.5–6.5 = 100; 5.0–5.5 / 6.5–7.0 = 85; 4.5–5.0 / 7.0–7.5 = 65; else 40.
  (Nepal hills are naturally acidic — pH < 5.5 triggers the lime/sulfur tip.)
- Soil factor score = 0.6·texture + 0.4·pH.
- **Null pixels → zone heuristic**, value prefixed `Est.` (the screenshot
  itself says "Est. Soil Type"):
  `<300 m → Alluvial Sandy Loam` · `300–1500 → Loam` · `1500–2500 → Clay Loam` ·
  `>2500 → Sandy Loam`.

### Seasons (NPT months; Nepal cropping calendar: Winter Oct–Feb, Summer/Dry Mar–May, Monsoon Jun–Sep)

For each potato-feasible season window, feasibility = window mean temp
8–22 °C (or altitude < 1000 m where winter is the main potato season).
`summary.season` = feasible windows joined with `" & "`, e.g.
`"Winter (Oct–Feb) & Spring (Mar–May)"`.

### Overall score

`0.25·altitude + 0.25·temp + 0.25·soil + 0.15·rainfall + 0.10·climate`,
rounded. Bands: **≥80 Excellent · 65–79 Good · 50–64 Fair · <50 Poor**.

### Varieties (NARC/NPRP released + registered — researched table)

| Variety | Released | NARC recommended domain | Derived alt band (m) |
|---|---|---|---|
| Khumal Seto-1 | 1999 | Terai, Foot hills, Mid and High Hills | 100–3000 |
| Janakdev | 1999 | Terai, Foot hills, Mid and High Hills | 100–3000 |
| Khumal Rato-2 | 1999 | Terai and Inner Terai | 0–800 |
| Desiree | 1992 | High & Mid Hill, Terai | 200–3000 |
| Kufri Sindhuri | 1992 | Mid Hill and Terai | 200–2500 |
| Kufri Jyoti | 1992 | High and Mid Hill | 1000–3500 |
| Khumal Laxmi | 2008 | Terai, Hill | 0–2500 |
| IPY-8 | 2008 | Terai, Hill | 0–2500 |
| Khumal Ujjwal | 2014 | Mid to High hills | 1000–3500 |
| Khumal Upahar | 2014 | Terai and Mid hills | 0–2000 |
| Khumal Bikas | 2018 | Mid to High hills | 1000–3500 |
| Cardinal (reg.) | 2019 | Terai to Hills (100–4000 m) | 100–4000 |
| Rojita (reg.) | 2019 | E/C High Hills (1600–3500 m) | 1600–3500 |
| MS 42.3 (reg.) | 2019 | Terai to Hills (100–1600 m) | 100–1600 |
| TPS-1 / TPS-2 (reg.) | 2014 | Irrigated Terai and Mid Hill | 0–2000 |

Fit = contains(altitude) (+20 if mid-band, −40 if edge), top 4–6 returned.
("Diamant" appears in the screenshot's sample list; it is a popular **exotic**
variety in Nepal but **not NARC-released** — it is excluded from the knowledge
table per the Nepal-only directive. Sample values in screenshots are
illustrations, not fixtures.)

### Challenges (condition → text, i18n'd)

- annual rain > 1500 → `Monsoon disease pressure (Jun–Sep)`
- alt > 2000 or coldest month < 3 °C → `Frost risk at planting/harvest`
- clay > 30 % and rain > 2000 → `Waterlogging on heavy soils`
- annual rain < 800 → `Irrigation needed — low rainfall`
- coldest month ≥ 14.5 (Terai) → `Heat stress in late crop (Mar–May)`
- pH < 5.5 → `Acidic soil — lime before planting`

### Tips (condition-filtered + always-on, i18n'd)

Always: raised beds/ridges for drainage · hill up at 20–25 cm · 3-year
rotation · soil test pH 5.5–6.5 (lime/sulfur) · Nepal-specific: prefer Khumal
varieties for local adaptation. Conditional: drainage tip (heavy soil), mulch +
irrigation tip (arid), late-blight watch (humid hills), seed tuber treatment.

### Recommendation templates

Band × belt sentences, e.g. Excellent → `"Your location is excellent for
potato cultivation — typical of Nepal's <belt>. …"` (Nepali mirror).

## Mobile implementation

- **`src/screens/LocationScreen.js` — full rewrite** to the designer layout:
  header `Location Suitability` / `Potato Growing Analysis for Your Location`;
  green `📍 Analyze My Location` button; idle explainer + 6 feature rows
  (copy from screenshot); loading; result = score circle + place + altitude +
  coords, Recommendation card, Temp/Season/Soil chips, segmented tabs
  **Overview · Factors · Varieties · Tips** (Local Challenges + Rainfall Zone;
  factor rows with score badge + bar + expandable why; numbered varieties;
  checkmarked tips); error/offline → message + Retry (+ stale timestamp).
  Layout, copy and structure exact; colors from theme tokens (screenshot is
  the same green-on-cream family; light mode = screenshot look).
- **New hook `src/hooks/useLocationAnalysis.js`:** permission → GPS fix
  (`Location.getCurrentPositionAsync`, Balanced, 8 s race) → axios GET →
  state machine idle/loading/ready/error; last analysis persisted in
  AsyncStorage `potatoDocLocationAnalysis` (`{data, analyzedAt}`) for offline
  re-show with "Analyzed X ago".
- **New components `src/components/location/`:** `ScoreCard`, `FactorRow`,
  `SegTabs` (split only if LocationScreen grows past ~400 lines).
- **Profile:** new row `Field & location settings` → modal containing the
  **existing tagger panel** (extracted from today's LocationScreen into
  `src/components/LocationTaggerPanel.js`, behavior identical).
- **i18n:** every new string keyed in `i18n.js` with Nepali translations
  (en falls back to the key itself, per existing pattern).
- Unchanged: BottomNav tabs, `useLocationTag` capture flow, history/panel
  location display (still `lat/lon/label`), sync/push.

## Testing & verification

- **New `test_location.py`** (stdlib `unittest`, no live network — fetch
  helpers mocked): zone/belt classification, altitude score breakpoints, USDA
  texture classifier, temperature/rainfall scores, season windows, variety
  band filter + ranking, weighted score → band, challenge/tip filters,
  endpoint happy path (schema keys), cache hit, hard-fail → 502, soft-null →
  heuristic, invalid coords → 400.
- Gates: `python3 -m unittest discover -p "test_*.py"` (backend-standalone),
  `npm test` (mobile), `@babel/parser` jsx parse for every touched mobile
  file, `node --check` for touched panel JS (none expected).
- Manual smoke: analyze → 4 tabs; airplane mode → stale + Retry; Profile row
  → tagger still toggles; save a diagnosis → history still tags location.

## Out of scope

Admin panel changes, history/sync schema changes, nav changes, push
notifications, geocoding beyond the single reverse label, account/entitlement
systems.
