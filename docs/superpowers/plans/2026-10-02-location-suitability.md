# Location Suitability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Nepal-grounded "Location Suitability" analysis — backend `GET /location/analyze` plus the designer-screenshot Location tab — and move the diagnosis tagger controls to Profile.

**Architecture:** New backend router (`location.py`) fetches elevation/temperature/rainfall/soil/place via stdlib `urllib` from free no-key APIs, computes score/varieties/tips with pure functions in `location_rules.py`, and caches results in SQLite (0.01° cell, 30-day TTL). Mobile gets a `useLocationAnalysis` hook (GPS → one axios call → AsyncStorage cache) and a full Location-tab rewrite matching the designer's 5 screenshots; the existing tagger panel moves into a Profile row modal unchanged in behavior.

**Tech Stack:** FastAPI + SQLite (stdlib only, no new pip deps) · React Native / Expo (`expo-location`, axios) · `unittest` + `fastapi.testclient` · `node --test` for pure mobile helpers · `@babel/parser` jsx gates.

**Spec:** `docs/superpowers/specs/2026-10-02-location-suitability-design.md` (committed `c37c772`) — all tables/thresholds below are copied from it.

## Global Constraints

- **Zero new pip deps** — outbound HTTP via `urllib.request` only.
- **Additive-only API** — no existing route/schema/behavior changes; plain-string `detail` on errors.
- Location tab must match the designer screenshots exactly (copy, layout, tabs); colors come from theme tokens.
- All new mobile strings have Nepali entries in `i18n.js` (dictionary keyed by English source).
- API-generated dynamic strings (recommendation, factor why, challenges, tips, zone/season names) are **English templates**; mobile runs them through `t()` then substitutes `{placeholders}` (see Task 3 `fmt`).
- Tests never hit the live network (fetch functions patched).
- Commits: root repo `main` direct commits; backend standalone repo `master` direct commits; two separate git repos.
- Verification gates: `python3 -m unittest discover -p "test_*.py"` (in `backend-standalone/`), `npm test` (in `mobile/`), `@babel/parser` jsx parse for every touched mobile file.

## File Structure

| File | Responsibility |
|---|---|
| Create `backend-standalone/location_rules.py` | Pure Nepal rules: zones, scores, texture, seasons, varieties, challenges/tips, `build_analysis()` → response dict |
| Create `backend-standalone/location.py` | Router + urllib fetchers + SQLite cache + hard/soft error mapping |
| Create `backend-standalone/test_location_rules.py` | Unit tests for every pure rule |
| Create `backend-standalone/test_location.py` | Endpoint tests with patched fetchers |
| Modify `backend-standalone/db.py` | Add `location_analysis` cache table to `SCHEMA` |
| Modify `backend-standalone/app.py` | `include_router(location_router)` |
| Modify `backend-standalone/test_helpers.py` | Register the new router on the test app |
| Create `mobile/src/hooks/useLocationAnalysis.js` | GPS fix → GET → state machine → AsyncStorage cache |
| Create `mobile/src/utils/locationText.js` | `fmt(template, vars)` placeholder substitution (pure, node-testable) |
| Create `mobile/tests/locationText.test.js` | node --test for `fmt` |
| Create `mobile/src/components/location/ScoreCard.js` | Score circle + place/altitude/coords header card |
| Create `mobile/src/components/location/FactorRow.js` | Factor row: value, score badge, bar, expandable why |
| Create `mobile/src/components/location/SegTabs.js` | Overview · Factors · Varieties · Tips segmented control |
| Rewrite `mobile/src/screens/LocationScreen.js` | Designer-screenshot screen (idle/loading/result/error) |
| Create `mobile/src/components/LocationTaggerPanel.js` | Existing toggle + village-label cards moved verbatim |
| Modify `mobile/src/screens/ProfileScreen.js` | "Field & location settings" row + modal hosting the panel |
| Modify `mobile/App.js` | Pass `locationTag` to ProfileScreen instead of LocationScreen |
| Modify `mobile/src/i18n.js` | Nepali entries for all new strings (UI + API templates) |

---

### Task 1: Pure Nepal rules module + unit tests (TDD)

**Files:**
- Create: `backend-standalone/location_rules.py`
- Test: `backend-standalone/test_location_rules.py`

**Interfaces:**
- Produces (used by Task 2's `location.py`):
  - `build_analysis(*, lat, lon, alt, temp_c, coldest_c, annual_rain, soil, place) -> dict` — `soil` is `{"clay": %|None, "sand": %|None, "silt": %|None, "ph": None|float}` already converted from SoilGrids units by the fetch layer, or `None`; `place` is `str|None`; returns the full JSON response per spec schema.
  - Also exported for tests: `altitude_zone(alt)`, `region_of(alt)`, `altitude_score(alt)`, `temperature_score(t)`, `rainfall_score(mm)`, `moisture_class(mm)`, `climate_zone(coldest_c)`, `texture_class(clay, sand, silt)`, `soil_score(texture, ph)`, `ph_score(ph)`, `feasible_seasons(alt)`, `recommend_varieties(alt, limit=6)`, `challenges(...)`, `tips(...)`, `overall_score(factors)`, `band_of(score)`, `RECOMMENDATIONS`.

- [ ] **Step 1: Write the failing tests**

Create `backend-standalone/test_location_rules.py`:

```python
"""location_rules.py — Nepal-grounded pure suitability rules (no I/O)."""
import unittest

from location_rules import (
    altitude_zone,
    altitude_score,
    band_of,
    build_analysis,
    challenges,
    climate_zone,
    feasible_seasons,
    moisture_class,
    overall_score,
    ph_score,
    rainfall_score,
    recommend_varieties,
    region_of,
    soil_score,
    temperature_score,
    texture_class,
    tips,
)

OK_SOIL = {"clay": 15.0, "sand": 60.0, "silt": 25.0, "ph": 5.8}


class ZoneAndScoreTest(unittest.TestCase):
    def test_altitude_zones_follow_nepal_classification(self):
        self.assertEqual(altitude_zone(120), "Tropical")
        self.assertEqual(altitude_zone(855), "Sub-tropical")
        self.assertEqual(altitude_zone(1500), "Warm Temperate")
        self.assertEqual(altitude_zone(2400), "Cool Temperate")
        self.assertEqual(altitude_zone(3400), "Sub-alpine")
        self.assertEqual(altitude_zone(4300), "Alpine")
        self.assertEqual(region_of(150), "Terai")
        self.assertEqual(region_of(811), "mid-hills")
        self.assertEqual(region_of(1500), "mid-hills")
        self.assertEqual(region_of(2400), "high hills")

    def test_altitude_score_peaks_in_800_3000_and_falls_off(self):
        self.assertEqual(altitude_score(1500), 100)
        self.assertEqual(altitude_score(800), 100)
        self.assertEqual(altitude_score(3000), 100)
        self.assertLess(altitude_score(200), 70)
        self.assertLess(altitude_score(3800), 60)
        self.assertEqual(altitude_score(4600), 0)
        # linear ramp between breakpoints (round-half-to-even)
        self.assertEqual(altitude_score(600), 82)

    def test_temperature_score_ideal_8_20(self):
        self.assertEqual(temperature_score(13), 100)
        self.assertEqual(temperature_score(6), 80)
        self.assertEqual(temperature_score(22), 80)
        self.assertEqual(temperature_score(3), 60)
        self.assertEqual(temperature_score(24), 60)
        self.assertEqual(temperature_score(30), 25)
        self.assertEqual(temperature_score(-2), 25)

    def test_rainfall_score_and_moisture_classes(self):
        self.assertEqual(rainfall_score(1200), 100)
        self.assertEqual(rainfall_score(500), 80)
        self.assertEqual(rainfall_score(2500), 80)
        self.assertEqual(rainfall_score(3000), 60)
        self.assertEqual(rainfall_score(100), 30)
        self.assertEqual(rainfall_score(None), 75)
        self.assertEqual(moisture_class(300), "Arid")
        self.assertEqual(moisture_class(700), "Semi-arid")
        self.assertEqual(moisture_class(1200), "Sub-humid")
        self.assertEqual(moisture_class(1800), "Humid")
        self.assertEqual(moisture_class(2600), "Per-humid")
        self.assertIsNone(moisture_class(None))

    def test_climate_zone_from_coldest_month(self):
        self.assertEqual(climate_zone(16), "Tropical")
        self.assertEqual(climate_zone(10), "Subtropical")
        self.assertEqual(climate_zone(5), "Temperate")
        self.assertEqual(climate_zone(1), "Cold")
        self.assertEqual(climate_zone(-4), "Alpine")


class SoilTest(unittest.TestCase):
    def test_usda_texture_box_rules(self):
        self.assertEqual(texture_class(5, 92, 3), "Sand")
        self.assertEqual(texture_class(8, 65, 27), "Sandy Loam")
        self.assertEqual(texture_class(18, 38, 44), "Loam")
        self.assertEqual(texture_class(12, 20, 68), "Silt Loam")
        self.assertEqual(texture_class(30, 25, 45), "Clay Loam")
        self.assertEqual(texture_class(30, 55, 15), "Sandy Clay Loam")
        self.assertEqual(texture_class(45, 35, 20), "Clay")
        self.assertEqual(texture_class(45, 10, 45), "Silty Clay")
        self.assertEqual(texture_class(10, 80, 10), "Loamy Sand")

    def test_ph_score_and_combined_soil_score(self):
        self.assertEqual(ph_score(5.8), 100)
        self.assertEqual(ph_score(5.2), 85)
        self.assertEqual(ph_score(4.8), 65)
        self.assertEqual(ph_score(7.8), 40)
        self.assertEqual(ph_score(None), 75)
        self.assertEqual(soil_score("Loam", 5.8), 97)  # 0.6*95 + 0.4*100, uncapped per spec
        self.assertEqual(soil_score("Sand", 4.8), round(0.6 * 70 + 0.4 * 65))
        self.assertEqual(soil_score("Clay", None), round(0.6 * 55 + 0.4 * 75))


class SeasonVarietyTextTest(unittest.TestCase):
    def test_seasons_by_altitude(self):
        self.assertEqual(feasible_seasons(855), "Winter (Oct–Feb) & Spring (Mar–May)")
        self.assertEqual(feasible_seasons(120), "Winter (Oct–Feb)")
        self.assertEqual(feasible_seasons(3500), "Off-season")

    def test_varieties_filtered_and_ranked_by_altitude(self):
        terai = recommend_varieties(150)
        self.assertIn("Khumal Rato-2", terai)
        self.assertNotIn("Rojita", terai)  # band 1600–3500
        mid = recommend_varieties(1500)
        self.assertIn("Khumal Seto-1", mid)
        self.assertEqual(len(mid), 6)
        high = recommend_varieties(2400)
        self.assertIn("Rojita", high)
        self.assertNotIn("MS 42.3", high)  # band tops out at 1600

    def test_challenges_conditions(self):
        out = challenges(
            annual_rain=2600, alt=855, coldest_c=15.5,
            clay_pct=32, ph=4.9, climate_zone_name="Tropical",
        )
        self.assertIn("Monsoon disease pressure (Jun–Sep)", out)
        self.assertIn("Waterlogging on heavy soils", out)
        self.assertIn("Heat stress in late crop (Mar–May)", out)
        self.assertIn("Soil too acidic — apply lime before planting", out)
        self.assertNotIn("Frost risk at planting or harvest", out)
        cold = challenges(
            annual_rain=400, alt=3400, coldest_c=-6,
            clay_pct=None, ph=None, climate_zone_name="Alpine",
        )
        self.assertIn("Frost risk at planting or harvest", cold)
        self.assertIn("Low rainfall — irrigation needed", cold)

    def test_tips_static_plus_conditional(self):
        base = tips(annual_rain=1200, clay_pct=15, ph=5.8, alt=855)
        self.assertTrue(any("raised beds" in x for x in base))
        self.assertTrue(any("Khumal" in x for x in base))
        heavy = tips(annual_rain=2600, clay_pct=35, ph=4.9, alt=855)
        self.assertTrue(any("drainage channels" in x for x in heavy))
        self.assertTrue(any("late blight" in x for x in heavy))
        self.assertTrue(any("lime" in x for x in heavy))

    def test_overall_score_and_bands(self):
        factors = {
            "altitude": {"score": 100}, "temp": {"score": 100},
            "soil": {"score": 95}, "rainfall": {"score": 80},
            "climate": {"score": 85},
        }
        score = overall_score(factors)
        self.assertEqual(score, round(0.25*100 + 0.25*100 + 0.25*95 + 0.15*80 + 0.10*85))
        self.assertEqual(band_of(86), "Excellent")
        self.assertEqual(band_of(70), "Good")
        self.assertEqual(band_of(55), "Fair")
        self.assertEqual(band_of(40), "Poor")


class BuildAnalysisTest(unittest.TestCase):
    def test_full_payload_matches_spec_schema(self):
        out = build_analysis(
            lat=28.2132, lon=83.9908, alt=855, temp_c=19.0,
            coldest_c=11.5, annual_rain=2800, soil=OK_SOIL,
            place="पोखरा, कास्की, गण्डकी प्रदेश, नेपाल",
        )
        for key in (
            "score", "band", "place", "coords", "altitude_m", "recommendation",
            "summary", "factors", "challenges", "rainfall_zone", "region", "varieties", "tips",
        ):
            self.assertIn(key, out)
        self.assertEqual(out["coords"], {"lat": 28.2132, "lon": 83.9908})
        self.assertEqual(out["altitude_m"], 855)
        self.assertEqual(len(out["factors"]), 5)
        keys = [f["key"] for f in out["factors"]]
        self.assertEqual(keys, ["altitude", "temp", "rainfall", "soil", "climate"])
        for f in out["factors"]:
            self.assertIn("label", f)
            self.assertIn("value", f)
            self.assertIn("why", f)
            self.assertIn("vars", f)
            self.assertTrue(0 <= f["score"] <= 100)
        self.assertEqual(out["summary"]["soil"], "Sandy Loam")
        self.assertEqual(out["summary"]["season"], "Winter (Oct–Feb) & Spring (Mar–May)")
        self.assertEqual(out["rainfall_zone"], "Sub-tropical")
        self.assertEqual(out["region"], "mid-hills")
        self.assertIn("{zone}", out["recommendation"])  # template, substituted client-side
        self.assertIsInstance(out["challenges"], list)
        self.assertIsInstance(out["varieties"], list)
        self.assertIsInstance(out["tips"], list)
        self.assertIn(out["band"], ("Excellent", "Good", "Fair", "Poor"))

    def test_missing_soil_and_place_degrade_to_estimates(self):
        out = build_analysis(
            lat=20.0, lon=80.0, alt=150, temp_c=24.0,
            coldest_c=15.0, annual_rain=None, soil=None, place=None,
        )
        soil_f = next(f for f in out["factors"] if f["key"] == "soil")
        self.assertEqual(soil_f["value"], "Alluvial Sandy Loam")
        self.assertEqual(out["place"], "Your location")
        rain_f = next(f for f in out["factors"] if f["key"] == "rainfall")
        self.assertEqual(rain_f["score"], 75)  # neutral when climate data missing


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/admin/Desktop/PotatoDoc/backend-standalone && python3 -m unittest test_location_rules -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'location_rules'`

- [ ] **Step 3: Write `location_rules.py`**

Create `backend-standalone/location_rules.py`:

```python
"""Nepal-grounded potato suitability rules for GET /location/analyze.

Pure functions only — no I/O and no FastAPI (the router + fetch layer live in
location.py). Sources are fixed in the spec
(docs/superpowers/specs/2026-10-02-location-suitability-design.md):
Nepal DofA/DoF agro-ecological altitude zones, NARC/NPRP released-variety
domains, and the USDA texture-class box rules. All English strings returned
here are templates the app runs through its i18n `t()`; placeholders like
{zone} are substituted client-side (mobile/src/utils/locationText.js).
"""

# --- altitude zones (Nepal DofA/DoF classification) --------------------------

ZONES = (
    (300, "Tropical"),
    (1000, "Sub-tropical"),
    (2000, "Warm Temperate"),
    (3000, "Cool Temperate"),
    (4000, "Sub-alpine"),
    (10**9, "Alpine"),
)

# Region words for the recommendation {zone} placeholder — the screenshot's
# "typical of Nepal's mid-hills" is prose, not the belt name (811m → mid-hills).
REGIONS = (
    (300, "Terai"),
    (600, "low hills"),
    (2000, "mid-hills"),
    (3000, "high hills"),
    (10**9, "Himalaya"),
)


def altitude_zone(alt):
    for ceiling, name in ZONES:
        if alt < ceiling:
            return name
    return "Alpine"


def region_of(alt):
    for ceiling, name in REGIONS:
        if alt < ceiling:
            return name
    return "Himalaya"


# --- score helpers -----------------------------------------------------------

def _interp(x, pts):
    if x <= pts[0][0]:
        return float(pts[0][1])
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if x <= x1:
            if x1 == x0:
                return float(y1)
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    return 0.0


def altitude_score(alt):
    return round(_interp(alt, [
        (0, 40), (100, 40), (400, 65), (800, 100),
        (3000, 100), (3500, 75), (4000, 45), (4500, 0),
    ]))


def temperature_score(t):
    if 8 <= t <= 20:
        return 100
    if 5 <= t < 8 or 20 < t <= 23:
        return 80
    if 0 <= t < 5 or 23 < t <= 26:
        return 60
    return 25


def rainfall_score(mm):
    if mm is None:
        return 75
    if 600 <= mm <= 2000:
        return 100
    if 400 <= mm < 600 or 2000 < mm <= 2800:
        return 80
    if 200 <= mm < 400 or 2800 < mm <= 3500:
        return 60
    return 30


def moisture_class(mm):
    if mm is None:
        return None
    if mm < 500:
        return "Arid"
    if mm < 1000:
        return "Semi-arid"
    if mm < 1500:
        return "Sub-humid"
    if mm < 2500:
        return "Humid"
    return "Per-humid"


def climate_zone(coldest_c, alt=None):
    """Temperature-regime zone; altitude heuristic when coldest month unknown."""
    if coldest_c is None:
        if alt is None:
            return "Temperate"
        if alt < 300:
            return "Tropical"
        if alt < 1000:
            return "Subtropical"
        if alt < 2000:
            return "Temperate"
        if alt < 3500:
            return "Cold"
        return "Alpine"
    if coldest_c >= 14.5:
        return "Tropical"
    if coldest_c >= 8:
        return "Subtropical"
    if coldest_c >= 3:
        return "Temperate"
    if coldest_c >= 0:
        return "Cold"
    return "Alpine"


# --- soil --------------------------------------------------------------------

def texture_class(clay, sand, silt):
    """USDA texture class from % clay/sand/silt — display-grade box rules."""
    if clay >= 40 and silt >= 40:
        return "Silty Clay"
    if clay >= 40 and sand >= 45:
        return "Sandy Clay"
    if clay >= 40:
        return "Clay"
    if clay >= 20 and sand >= 45 and silt < 28:
        return "Sandy Clay Loam"
    if clay >= 27 and silt >= 53:
        return "Silty Clay Loam"
    if clay >= 27:
        return "Clay Loam"
    if silt >= 80 and sand <= 20:
        return "Silt"
    if silt >= 50:
        return "Silt Loam"
    if sand >= 85:
        return "Sand"
    if sand >= 70:
        return "Loamy Sand"
    if sand >= 43 and clay < 20:
        return "Sandy Loam"
    return "Loam"


TEXTURE_SCORES = {
    "Loam": 95, "Sandy Loam": 95, "Silt Loam": 95, "Clay Loam": 95,
    "Sandy Clay Loam": 85, "Loamy Sand": 85,
    "Sand": 70, "Silty Clay Loam": 70,
    "Clay": 55, "Silty Clay": 55, "Sandy Clay": 55, "Silt": 55,
}


def ph_score(ph):
    if ph is None:
        return 75
    if 5.5 <= ph <= 6.5:
        return 100
    if 5.0 <= ph < 5.5 or 6.5 < ph <= 7.0:
        return 85
    if 4.5 <= ph < 5.0 or 7.0 < ph <= 7.5:
        return 65
    return 40


def soil_score(texture, ph):
    return round(0.6 * TEXTURE_SCORES.get(texture, 75) + 0.4 * ph_score(ph))


def heuristic_texture(alt):
    if alt < 300:
        return "Alluvial Sandy Loam"
    if alt < 1500:
        return "Loam"
    if alt < 2500:
        return "Clay Loam"
    return "Sandy Loam"


# --- seasons / varieties -----------------------------------------------------

def feasible_seasons(alt):
    out = []
    if alt < 3000:
        out.append("Winter (Oct–Feb)")
    if 500 <= alt <= 3000:
        out.append("Spring (Mar–May)")
    return " & ".join(out) if out else "Off-season"


# NARC/NPRP released + registered varieties: (name, min_alt_m, max_alt_m).
# Bands derive from each variety's official recommended domain — see spec.
VARIETIES = [
    ("Khumal Seto-1", 100, 3000),
    ("Janakdev", 100, 3000),
    ("Khumal Rato-2", 0, 800),
    ("Desiree", 200, 3000),
    ("Kufri Sindhuri", 200, 2500),
    ("Kufri Jyoti", 1000, 3500),
    ("Khumal Laxmi", 0, 2500),
    ("IPY-8", 0, 2500),
    ("Khumal Ujjwal", 1000, 3500),
    ("Khumal Upahar", 0, 2000),
    ("Khumal Bikas", 1000, 3500),
    ("Cardinal", 100, 4000),
    ("Rojita", 1600, 3500),
    ("MS 42.3", 100, 1600),
    ("TPS-1", 0, 2000),
    ("TPS-2", 0, 2000),
]


def recommend_varieties(alt, limit=6):
    fits = []
    for name, lo, hi in VARIETIES:
        if not (lo <= alt <= hi):
            continue
        span = hi - lo
        rel = (alt - lo) / span if span else 0.5
        if 0.25 <= rel <= 0.75:
            fit = 20
        elif rel < 0.1 or rel > 0.9:
            fit = -40
        else:
            fit = 0
        fits.append((fit, name))
    fits.sort(key=lambda x: (-x[0], x[1]))
    return [name for _, name in fits[:limit]]


# --- condition-filtered text -------------------------------------------------

def challenges(annual_rain, alt, coldest_c, clay_pct, ph, climate_zone_name):
    out = []
    if annual_rain is not None and annual_rain > 1500:
        out.append("Monsoon disease pressure (Jun–Sep)")
    if alt > 2000 or (coldest_c is not None and coldest_c < 3):
        out.append("Frost risk at planting or harvest")
    if clay_pct is not None and clay_pct > 30 and annual_rain and annual_rain > 2000:
        out.append("Waterlogging on heavy soils")
    if annual_rain is not None and annual_rain < 800:
        out.append("Low rainfall — irrigation needed")
    if coldest_c is not None and coldest_c >= 14.5:
        out.append("Heat stress in late crop (Mar–May)")
    if ph is not None and ph < 5.5:
        out.append("Soil too acidic — apply lime before planting")
    return out


def tips(annual_rain, clay_pct, ph, alt):
    out = [
        "Plant in well-prepared ridges or raised beds for optimal drainage",
        "Hill up soil around plants when they reach 20–25cm to prevent greening",
        "Rotate crops — avoid planting potatoes in the same field for 3+ years",
        "Test soil pH (ideal: 5.5–6.5) and adjust with lime or sulfur as needed",
        "In Nepal: plant Khumal varieties for best local adaptation and yield",
    ]
    if clay_pct and clay_pct >= 30:
        out.append("Add compost and open drainage channels — heavy soil compacts easily")
    if annual_rain is not None and annual_rain < 800:
        out.append("Plan drip or furrow irrigation — rainfall alone will not carry the crop")
    if annual_rain is not None and annual_rain > 1500:
        out.append("Watch for late blight in the humid months — remove affected leaves early")
    if alt > 2500:
        out.append("Use well-sprouted seed tubers and mulch to protect against cold nights")
    if ph is not None and ph < 5.5:
        out.append("Apply agricultural lime 2–3 weeks before planting to lift pH")
    return out


# --- overall -----------------------------------------------------------------

WEIGHTS = {
    "altitude": 0.25, "temp": 0.25, "soil": 0.25,
    "rainfall": 0.15, "climate": 0.10,
}


def overall_score(factors):
    return round(sum(factors[k]["score"] * w for k, w in WEIGHTS.items()))


def band_of(score):
    if score >= 80:
        return "Excellent"
    if score >= 65:
        return "Good"
    if score >= 50:
        return "Fair"
    return "Poor"


RECOMMENDATIONS = {
    "Excellent": "Your location is excellent for potato cultivation — typical of Nepal's {zone}. "
                 "Conditions closely match the ideal agronomic requirements. Focus on disease "
                 "prevention and variety selection for maximum yield.",
    "Good": "Your location suits potato well — conditions are close to Nepal's ideal for {zone}. "
            "Manage soil fertility and watch the monsoon for disease pressure.",
    "Fair": "Potato can be grown here, but conditions are only moderately suitable in this "
            "{zone} zone. Choose tolerant varieties, improve drainage or irrigation, and "
            "expect lower yields.",
    "Poor": "This location is poorly suited to potato under natural conditions. Consider "
            "another crop, or invest in irrigation, soil amendment and microclimate "
            "protection before planting.",
}


def build_analysis(*, lat, lon, alt, temp_c, coldest_c, annual_rain, soil, place):
    """Assemble the full GET /location/analyze payload (spec schema)."""
    zone = altitude_zone(alt)
    moisture = moisture_class(annual_rain)
    cz = climate_zone(coldest_c, alt)

    if soil and soil.get("clay") is not None and soil.get("sand") is not None:
        texture = texture_class(soil["clay"], soil["sand"], soil.get("silt") or 0)
        soil_source = "SoilGrids"
    else:
        texture = heuristic_texture(alt)
        soil_source = "zonal estimate"
    ph = soil.get("ph") if soil else None

    factors = {
        "altitude": {
            "key": "altitude", "label": "Altitude", "value": "%dm" % round(alt),
            "score": altitude_score(alt),
            "why": "{alt} m — potato in Nepal spans 100–4000 m; optimum 800–3000 m",
            "vars": {"alt": str(round(alt))},
        },
        "temp": {
            "key": "temp", "label": "Est. Temperature", "value": "~%d°C" % round(temp_c),
            "score": temperature_score(temp_c),
            "why": "~{temp}°C — tuber initiation prefers a cool 8–20°C",
            "vars": {"temp": str(round(temp_c))},
        },
        "rainfall": {
            "key": "rainfall", "label": "Rainfall Zone", "value": zone,
            "score": rainfall_score(annual_rain),
            "why": "{rain} mm typical — Nepal's monsoon delivers most of it Jun–Sep",
            "vars": {"rain": str(round(annual_rain))} if annual_rain is not None else {},
        },
        "soil": {
            "key": "soil", "label": "Est. Soil Type", "value": texture,
            "score": soil_score(texture, ph),
            "why": "{texture}, pH {ph} — loam family drains best for tubers",
            "vars": {
                "texture": texture,
                "ph": ("%.1f" % ph) if ph is not None else "—",
            },
        },
        "climate": {
            "key": "climate", "label": "Climate Zone", "value": cz,
            "score": climate_score(cz),
            "why": "{zone} regime — coldest month near {coldest}°C",
            "vars": {
                "zone": cz,
                "coldest": ("%.1f" % coldest_c) if coldest_c is not None else "—",
            },
        },
    }
    # rainfall why needs the actual mm or a neutral phrasing
    if annual_rain is None:
        factors["rainfall"]["why"] = "Rainfall data unavailable — zone estimated from altitude"

    score = overall_score(factors)
    band = band_of(score)

    summary = {
        "temp_c": int(round(temp_c)),
        "season": feasible_seasons(alt),
        "soil": texture,
    }
    return {
        "score": score,
        "band": band,
        "place": place or "Your location",
        "coords": {"lat": round(lat, 6), "lon": round(lon, 6)},
        "altitude_m": int(round(alt)),
        "recommendation": RECOMMENDATIONS[band],
        "summary": summary,
        "factors": [factors[k] for k in ("altitude", "temp", "rainfall", "soil", "climate")],
        "challenges": challenges(
            annual_rain, alt, coldest_c,
            (soil or {}).get("clay"), ph, cz,
        ),
        "rainfall_zone": zone,
        "region": region_of(alt),
        "varieties": recommend_varieties(alt),
        "tips": tips(annual_rain, (soil or {}).get("clay"), ph, alt),
        # extra (non-schema) keys used by the why templates / debugging:
        "_meta": {"moisture": moisture, "soil_source": soil_source},
    }


def climate_score(zone_name):
    return {
        "Tropical": 90, "Subtropical": 95, "Temperate": 85,
        "Cold": 65, "Alpine": 35,
    }.get(zone_name, 75)
```

Note the `why` templates carry `{placeholders}` — they are **not** interpolated server-side; mobile's `fmt()` (Task 3) substitutes them so i18n can translate the template first. `_meta` is internal (not rendered).

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/admin/Desktop/PotatoDoc/backend-standalone && python3 -m unittest test_location_rules -v`
Expected: all tests PASS (if a box-rule edge differs, adjust `texture_class` branches — never the tests' intended class mapping)

- [ ] **Step 5: Commit (backend repo)**

```bash
cd /Users/admin/Desktop/PotatoDoc/backend-standalone
git add location_rules.py test_location_rules.py
git commit -m "Add Nepal-grounded location suitability rules with unit tests"
```

---

### Task 2: Backend `GET /location/analyze` + cache + endpoint tests (TDD)

**Files:**
- Create: `backend-standalone/location.py`
- Modify: `backend-standalone/db.py` (add `location_analysis` table to `SCHEMA`)
- Modify: `backend-standalone/app.py` (register router)
- Modify: `backend-standalone/test_helpers.py` (register router on the test app)
- Test: `backend-standalone/test_location.py`

**Interfaces:**
- `GET /location/analyze?lat=&lon=` — public, no auth. Success → full spec JSON from `build_analysis()`. Errors (plain-string detail): `400 "Invalid coordinates"` (missing, non-numeric, out of range), `502 "Location service unavailable"` (hard source failed), `504 "Location service timeout"` (hard source timed out).
- Fetchers exported for `patch.multiple("location", ...)` in tests: `fetch_elevation(lat, lon) -> float`, `fetch_climate(lat, lon, today=None) -> {"annual_rain", "coldest_c", "temp_c"}` (each `float|None`), `fetch_forecast_temp(lat, lon) -> float`, `fetch_soil(lat, lon) -> {"clay","sand","silt","ph"}|None` (already %/pH), `fetch_place(lat, lon) -> str|None`.
- Cache: `location_analysis(lat_key, lon_key, payload, created_at)` PK `(lat_key, lon_key)`; keys `round(coord, 2)` (0.01° ≈ 1 km); TTL 30 days; miss→fetch→store, hit→return stored JSON.

**Live-verified fetch details (2026-10-02 smoke, all 4 APIs re-checked this session):**
- Elevation: `api.open-meteo.com/v1/elevation?latitude&longitude` → `{"elevation":[855.0]}`.
- Forecast temp: `api.open-meteo.com/v1/forecast?latitude&longitude&daily=temperature_2m_mean&forecast_days=7` → mean of non-null daily values.
- Climate: `climate-api.open-meteo.com/v1/climate?latitude&longitude&start_date&end_date&daily=precipitation_sum,temperature_2m_mean` (730-day window) → annual rain = `sum(rain)*365/len(rain)`; coldest = min monthly mean of `temperature_2m_mean` grouped by month in `time`; current-month normal = mean for `today.month`.
- SoilGrids: **repeated `property` params** (`property=clay&property=sand&property=silt&property=phh2o`, `depth=0-5cm&value=mean`) — the `clay|sand` pipe form returned HTTP 500 in the re-check; response shape `properties.layers[].name` + `unit_measure.d_factor` (10) + `depths[label=="0-5cm"].values.mean`; `% = mean / d_factor`. Null pixel (Pokhara lake) → any of clay/sand/silt null → `soil=None` (zonal heuristic).
- Nominatim: `nominatim.openstreetmap.org/reverse?lat&lon&format=json&zoom=10` + `User-Agent` → use `display_name` (e.g. "Pokhara, कास्की, गण्डकी प्रदेश, नेपाल"); soft → `None`.

**Hard/soft mapping:** elevation hard. Temperature hard only if climate `temp_c` **and** forecast both fail (climate failure itself is soft — rain/coldest degrade). Soil + place soft → `None`. `TimeoutError`/`socket.timeout` (direct or as `URLError.reason`) → 504; anything else from a hard source → 502.

- [ ] **Step 1: Write the failing tests**

Create `backend-standalone/test_location.py`:

```python
"""GET /location/analyze — fetchers patched, no network, throwaway DB."""
import json
import unittest
from datetime import date, datetime, timedelta
from unittest.mock import patch

from test_helpers import client  # noqa: F401  (must import first: sets POTATO_DB)

import location
from db import connect

PLACE_OK = "पोखरा, कास्की, गण्डकी प्रदेश, नेपाल"


def _stubs(**overrides):
    """patch.multiple with a full stub fetch set — no test ever hits the network."""
    base = {
        "fetch_elevation": lambda lat, lon: 855.0,
        "fetch_climate": lambda lat, lon: {
            "annual_rain": 2800.0, "coldest_c": 11.5, "temp_c": 13.0,
        },
        "fetch_forecast_temp": lambda lat, lon: 21.2,
        "fetch_soil": lambda lat, lon: {"clay": 15.0, "sand": 60.0, "silt": 25.0, "ph": 5.8},
        "fetch_place": lambda lat, lon: PLACE_OK,
    }
    base.update(overrides)
    return patch.multiple("location", **base)


def _boom(*_args, **_kwargs):
    raise AssertionError("network fetch attempted")


class AnalyzeEndpoint(unittest.TestCase):
    def setUp(self):
        with connect() as conn:
            conn.execute("DELETE FROM location_analysis")

    def _analyze(self, **params):
        return client.get("/location/analyze", params={"lat": 28.21, "lon": 83.99, **params})

    def test_happy_path_schema(self):
        with _stubs():
            r = self._analyze()
        self.assertEqual(r.status_code, 200)
        data = r.json()
        for key in ("score", "band", "place", "coords", "altitude_m", "recommendation",
                    "summary", "factors", "challenges", "rainfall_zone", "region",
                    "varieties", "tips"):
            self.assertIn(key, data)
        self.assertEqual(data["region"], "mid-hills")
        self.assertEqual([f["key"] for f in data["factors"]],
                         ["altitude", "temp", "rainfall", "soil", "climate"])
        for f in data["factors"]:
            self.assertTrue(0 <= f["score"] <= 100)
            self.assertIn("vars", f)
        self.assertEqual(data["altitude_m"], 855)
        self.assertEqual(data["place"], PLACE_OK)
        self.assertIn(data["band"], ("Excellent", "Good", "Fair", "Poor"))

    def test_result_is_cached(self):
        with _stubs():
            self.assertEqual(self._analyze().status_code, 200)
        with connect() as conn:
            row = conn.execute("SELECT payload FROM location_analysis").fetchone()
        self.assertIsNotNone(row)
        self.assertIn("score", json.loads(row["payload"]))

    def test_cache_hit_skips_all_fetchers(self):
        with _stubs():
            self.assertEqual(self._analyze().status_code, 200)
        with _stubs(fetch_elevation=_boom, fetch_climate=_boom, fetch_forecast_temp=_boom,
                    fetch_soil=_boom, fetch_place=_boom):
            r = self._analyze()
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["altitude_m"], 855)

    def test_expired_cache_refetches(self):
        stale = (datetime.utcnow() - timedelta(days=31)).strftime("%Y-%m-%d %H:%M:%S")
        with connect() as conn:
            conn.execute(
                "INSERT INTO location_analysis (lat_key, lon_key, payload, created_at) "
                "VALUES (?, ?, ?, ?)",
                (28.21, 83.99, json.dumps({"stale": True}), stale),
            )
        with _stubs():
            r = self._analyze()
        self.assertEqual(r.status_code, 200)
        self.assertNotIn("stale", r.json())

    def test_missing_or_bad_coords_return_400(self):
        for params in ({}, {"lat": "999", "lon": "83.99"}, {"lat": "abc", "lon": "83.99"}):
            with _stubs():
                r = client.get("/location/analyze", params=params)
            self.assertEqual(r.status_code, 400, params)
            self.assertEqual(r.json()["detail"], "Invalid coordinates")

    def test_elevation_failure_returns_502(self):
        import urllib.error

        def fail(lat, lon):
            raise urllib.error.URLError("connection refused")

        with _stubs(fetch_elevation=fail):
            r = self._analyze()
        self.assertEqual(r.status_code, 502)
        self.assertEqual(r.json()["detail"], "Location service unavailable")

    def test_elevation_timeout_returns_504(self):
        def fail(lat, lon):
            raise TimeoutError("timed out")

        with _stubs(fetch_elevation=fail):
            r = self._analyze()
        self.assertEqual(r.status_code, 504)
        self.assertEqual(r.json()["detail"], "Location service timeout")

    def test_temp_fallback_to_forecast_when_climate_temp_missing(self):
        with _stubs(fetch_climate=lambda lat, lon: {
            "annual_rain": 2800.0, "coldest_c": 11.5, "temp_c": None,
        }):
            r = self._analyze()
        self.assertEqual(r.status_code, 200)
        temp_f = next(f for f in r.json()["factors"] if f["key"] == "temp")
        self.assertEqual(temp_f["value"], "~21°C")

    def test_both_temp_sources_fail_returns_502(self):
        def fail(lat, lon):
            raise ValueError("no temperature")

        with _stubs(
            fetch_climate=lambda lat, lon: {
                "annual_rain": 2800.0, "coldest_c": 11.5, "temp_c": None,
            },
            fetch_forecast_temp=fail,
        ):
            r = self._analyze()
        self.assertEqual(r.status_code, 502)

    def test_climate_failure_degrades_soft_sources(self):
        import urllib.error

        def fail(lat, lon):
            raise urllib.error.URLError("down")

        with _stubs(fetch_climate=fail, fetch_soil=lambda lat, lon: None,
                    fetch_place=lambda lat, lon: None):
            r = self._analyze()
        self.assertEqual(r.status_code, 200)
        data = r.json()
        rain_f = next(f for f in data["factors"] if f["key"] == "rainfall")
        self.assertEqual(rain_f["score"], 75)
        self.assertEqual(data["place"], "Your location")
        self.assertEqual(data["_meta"]["soil_source"], "zonal estimate")
        # temp must still come from the forecast fallback
        temp_f = next(f for f in data["factors"] if f["key"] == "temp")
        self.assertEqual(temp_f["value"], "~21°C")


class FetcherParsing(unittest.TestCase):
    """Unit tests for response parsing (single _get call per fetcher)."""

    def test_elevation_parse(self):
        with patch("location._get", return_value={"elevation": [855.0]}):
            self.assertEqual(location.fetch_elevation(28.2, 84.0), 855.0)

    def test_forecast_mean_skips_nulls(self):
        payload = {"daily": {"temperature_2m_mean": [21.0, 22.0, None]}}
        with patch("location._get", return_value=payload):
            self.assertEqual(location.fetch_forecast_temp(28.2, 84.0), 21.5)

    def test_forecast_all_null_raises(self):
        with patch("location._get", return_value={"daily": {"temperature_2m_mean": [None]}}):
            with self.assertRaises(ValueError):
                location.fetch_forecast_temp(28.2, 84.0)

    def test_climate_annual_rain_coldest_and_current_month(self):
        times, rains, temps = [], [], []
        for d in range(365):
            day = date(2025, 1, 1) + timedelta(days=d)
            times.append(day.isoformat())
            rains.append(2.0)
            temps.append(5.0 if day.month == 1 else 25.0)
        payload = {"daily": {"time": times, "precipitation_sum": rains,
                             "temperature_2m_mean": temps}}
        with patch("location._get", return_value=payload):
            out = location.fetch_climate(28.2, 84.0, today=date(2026, 1, 15))
        self.assertEqual(out["annual_rain"], 730.0)   # 2 mm/day × 365
        self.assertEqual(out["coldest_c"], 5.0)       # January mean
        self.assertEqual(out["temp_c"], 5.0)          # current-month normal

    def test_climate_empty_response_returns_nones(self):
        with patch("location._get", return_value={}):
            out = location.fetch_climate(28.2, 84.0)
        self.assertEqual(out, {"annual_rain": None, "coldest_c": None, "temp_c": None})

    def test_soilgrids_units_converted(self):
        def layer(name, mean):
            return {"name": name, "unit_measure": {"d_factor": 10},
                    "depths": [{"label": "0-5cm", "values": {"mean": mean}}]}
        payload = {"properties": {"layers": [
            layer("clay", 229), layer("sand", 426),
            layer("silt", 345), layer("phh2o", 62),
        ]}}
        with patch("location._get", return_value=payload):
            soil = location.fetch_soil(26.46, 87.27)
        self.assertEqual(soil, {"clay": 22.9, "sand": 42.6, "silt": 34.5, "ph": 6.2})

    def test_soilgrids_null_pixel_returns_none(self):
        def layer(name, mean):
            return {"name": name, "unit_measure": {"d_factor": 10},
                    "depths": [{"label": "0-5cm", "values": {"mean": mean}}]}
        payload = {"properties": {"layers": [
            layer("clay", None), layer("sand", None), layer("silt", None),
            layer("phh2o", None),
        ]}}
        with patch("location._get", return_value=payload):
            self.assertIsNone(location.fetch_soil(28.21, 83.99))

    def test_soilgrids_null_ph_keeps_texture(self):
        def layer(name, mean):
            return {"name": name, "unit_measure": {"d_factor": 10},
                    "depths": [{"label": "0-5cm", "values": {"mean": mean}}]}
        payload = {"properties": {"layers": [
            layer("clay", 150), layer("sand", 600), layer("silt", 250),
            layer("phh2o", None),
        ]}}
        with patch("location._get", return_value=payload):
            soil = location.fetch_soil(28.21, 83.99)
        self.assertEqual(soil, {"clay": 15.0, "sand": 60.0, "silt": 25.0, "ph": None})

    def test_place_uses_display_name(self):
        with patch("location._get", return_value={"display_name": PLACE_OK}):
            self.assertEqual(location.fetch_place(28.2, 84.0), PLACE_OK)

    def test_place_missing_returns_none(self):
        with patch("location._get", return_value={}):
            self.assertIsNone(location.fetch_place(28.2, 84.0))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/admin/Desktop/PotatoDoc/backend-standalone && python3 -m unittest test_location -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'location'` (and `db` has no `location_analysis` table yet).

- [ ] **Step 3: Implement**

**3a. `db.py` — add the cache table to `SCHEMA`** (after the `history_photos` table, before the `CREATE INDEX` block):

```sql
CREATE TABLE IF NOT EXISTS location_analysis (
  lat_key    REAL NOT NULL,
  lon_key    REAL NOT NULL,
  payload    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (lat_key, lon_key)
);
```

**3b. Create `backend-standalone/location.py`:**

```python
"""GET /location/analyze — location suitability: fetch + cache + pure rules.

Stdlib urllib only (no new deps). Hard sources (elevation, temperature) map
failures to 502/504; soft sources (rain, soil, place) degrade to None and
location_rules applies Nepal zonal heuristics. Results are cached in SQLite by
0.01° cell for 30 days. No torch imports (same rationale as auth/history).
"""
import json
import socket
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta

from fastapi import HTTPException, APIRouter

from db import connect
from location_rules import build_analysis

router = APIRouter(prefix="/location", tags=["location"])

TIMEOUT = 7.0
USER_AGENT = "PotatoDoc/1.0 (https://potatodoc.app)"
CACHE_TTL_DAYS = 30


# --- fetchers (exported for tests to patch) ----------------------------------

def _get(url, timeout=TIMEOUT):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_elevation(lat, lon):
    data = _get("https://api.open-meteo.com/v1/elevation?" + urllib.parse.urlencode(
        {"latitude": lat, "longitude": lon}))
    return float(data["elevation"][0])


def fetch_forecast_temp(lat, lon):
    """Mean of the next 7 days' daily mean temperature (climate-API fallback)."""
    data = _get("https://api.open-meteo.com/v1/forecast?" + urllib.parse.urlencode(
        {"latitude": lat, "longitude": lon,
         "daily": "temperature_2m_mean", "forecast_days": 7}))
    vals = [v for v in (data.get("daily", {}).get("temperature_2m_mean") or [])
            if v is not None]
    if not vals:
        raise ValueError("no forecast temperature in response")
    return sum(vals) / len(vals)


def fetch_climate(lat, lon, today=None):
    """730-day climate normal → annual rain mm, coldest-month mean, current
    month normal. Missing data → None per field (soft)."""
    today = today or date.today()
    end = today - timedelta(days=1)
    start = end - timedelta(days=730)
    data = _get("https://climate-api.open-meteo.com/v1/climate?" + urllib.parse.urlencode({
        "latitude": lat, "longitude": lon,
        "start_date": start.isoformat(), "end_date": end.isoformat(),
        "daily": "precipitation_sum,temperature_2m_mean",
    }))
    daily = data.get("daily") or {}
    rain = [v for v in (daily.get("precipitation_sum") or []) if v is not None]
    annual = (sum(rain) * 365.0 / len(rain)) if rain else None

    by_month: dict[int, list] = {}
    for iso, t in zip(daily.get("time") or [], daily.get("temperature_2m_mean") or []):
        if t is not None and len(iso) >= 7:
            try:
                by_month.setdefault(int(iso[5:7]), []).append(float(t))
            except ValueError:
                continue
    coldest = min((sum(v) / len(v) for v in by_month.values()), default=None)
    now_vals = by_month.get(today.month)
    current = (sum(now_vals) / len(now_vals)) if now_vals else None
    return {"annual_rain": annual, "coldest_c": coldest, "temp_c": current}


def fetch_soil(lat, lon):
    """SoilGrids 0–5 cm means → % / pH; texture null pixel → None (heuristic)."""
    params = [
        ("lon", lon), ("lat", lat),
        ("property", "clay"), ("property", "sand"),
        ("property", "silt"), ("property", "phh2o"),
        ("depth", "0-5cm"), ("value", "mean"),
    ]
    data = _get("https://rest.isric.org/soilgrids/v2.0/properties/query?"
                + urllib.parse.urlencode(params))
    out: dict = {}
    for layer in (data.get("properties", {}).get("layers") or []):
        mean = None
        for depth in layer.get("depths") or []:
            if depth.get("label") == "0-5cm":
                mean = (depth.get("values") or {}).get("mean")
                break
        factor = (layer.get("unit_measure") or {}).get("d_factor") or 10
        out[layer.get("name")] = None if mean is None else round(mean / factor, 1)
    if any(out.get(k) is None for k in ("clay", "sand", "silt")):
        return None
    return {"clay": out["clay"], "sand": out["sand"],
            "silt": out["silt"], "ph": out.get("phh2o")}


def fetch_place(lat, lon):
    data = _get("https://nominatim.openstreetmap.org/reverse?" + urllib.parse.urlencode(
        {"lat": lat, "lon": lon, "format": "json", "zoom": 10}))
    return data.get("display_name") or None


# --- cache (0.01° cell, 30-day TTL) ------------------------------------------

def _cache_get(lat, lon):
    with connect() as conn:
        row = conn.execute(
            "SELECT payload, created_at FROM location_analysis "
            "WHERE lat_key = ? AND lon_key = ?",
            (round(lat, 2), round(lon, 2)),
        ).fetchone()
    if row is None:
        return None
    try:
        created = datetime.strptime(row["created_at"], "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return None
    if datetime.utcnow() - created > timedelta(days=CACHE_TTL_DAYS):
        return None
    return json.loads(row["payload"])


def _cache_put(lat, lon, payload):
    with connect() as conn:
        conn.execute(
            "INSERT INTO location_analysis (lat_key, lon_key, payload) "
            "VALUES (?, ?, ?) "
            "ON CONFLICT(lat_key, lon_key) DO UPDATE SET "
            "payload = excluded.payload, created_at = datetime('now')",
            (round(lat, 2), round(lon, 2), json.dumps(payload)),
        )


# --- endpoint -----------------------------------------------------------------

def _is_timeout(exc):
    if isinstance(exc, (TimeoutError, socket.timeout)):
        return True
    return (isinstance(exc, urllib.error.URLError)
            and isinstance(exc.reason, (TimeoutError, socket.timeout)))


def _hard_failure(exc):
    if _is_timeout(exc):
        return HTTPException(504, "Location service timeout")
    return HTTPException(502, "Location service unavailable")


def _build(lat, lon):
    try:
        alt = fetch_elevation(lat, lon)
    except Exception as exc:
        raise _hard_failure(exc)

    climate = {"annual_rain": None, "coldest_c": None, "temp_c": None}
    try:
        got = fetch_climate(lat, lon)
        for key in climate:
            climate[key] = got.get(key)
    except Exception:
        pass  # soft: rain factor neutral, coldest via altitude heuristic

    temp_c = climate["temp_c"]
    if temp_c is None:
        try:
            temp_c = fetch_forecast_temp(lat, lon)
        except Exception as exc:
            raise _hard_failure(exc)

    try:
        soil = fetch_soil(lat, lon)
    except Exception:
        soil = None
    try:
        place = fetch_place(lat, lon)
    except Exception:
        place = None

    return build_analysis(
        lat=lat, lon=lon, alt=alt, temp_c=temp_c,
        coldest_c=climate["coldest_c"], annual_rain=climate["annual_rain"],
        soil=soil, place=place,
    )


@router.get("/analyze")
def analyze(lat: str | None = None, lon: str | None = None):
    """Public suitability analysis; 400 bad coords, 502/504 hard-source errors."""
    try:
        flat, flon = float(lat), float(lon)
    except (TypeError, ValueError):
        raise HTTPException(400, "Invalid coordinates")
    if not (-90 <= flat <= 90) or not (-180 <= flon <= 180):
        raise HTTPException(400, "Invalid coordinates")

    cached = _cache_get(flat, flon)
    if cached is not None:
        return cached
    payload = _build(flat, flon)
    _cache_put(flat, flon, payload)
    return payload
```

**3c. Register the router** — same import + `include_router` pair in both files:

- `app.py`: after `from admin import router as admin_router` add `from location import router as location_router`; after `app.include_router(admin_router)` add `app.include_router(location_router)`.
- `test_helpers.py`: after `from admin import router as admin_router` add `from location import router as location_router`; after `app.include_router(admin_router)` add `app.include_router(location_router)`.

- [ ] **Step 4: Run tests to verify they pass**

Run:
1. `cd /Users/admin/Desktop/PotatoDoc/backend-standalone && python3 -m unittest test_location -v` — all PASS.
2. `python3 -m unittest discover -p "test_*.py"` — full suite PASS (no regressions).

- [ ] **Step 5: Commit (backend repo)**

```bash
cd /Users/admin/Desktop/PotatoDoc/backend-standalone
git add location.py test_location.py db.py app.py test_helpers.py
git commit -m "Add GET /location/analyze with fetchers, SQLite cache and tests"
```

---

### Task 3: Mobile `fmt` helper + `useLocationAnalysis` hook (TDD for `fmt`)

**Files:**
- Create: `mobile/src/utils/locationText.js`
- Create: `mobile/tests/locationText.test.js`
- Create: `mobile/src/hooks/useLocationAnalysis.js`

**Interfaces:**
- `fmt(template: string, vars: object|null) -> string` — replaces `{key}` with `vars[key]`; unknown keys / null values left as the literal placeholder (a missing translation or partial payload never blanks text); non-string input → `""`. Pure — node-testable, no RN imports.
- `useLocationAnalysis() -> {status, data, analyzedAt, stale, error, analyze}`:
  - `status`: `"idle" | "loading" | "ready" | "error"`; `data`: full analysis payload or `null`; `analyzedAt`: ISO string; `stale`: `true` when `data` came from AsyncStorage (previous session) rather than a fresh analyze; `error`: English message (run through `t()` in the screen).
  - Mount: load AsyncStorage key `potatoDocLocationAnalysis` (`{data, analyzedAt}`) → if present, `status="ready"`, `stale=true` (offline re-show, "Analyzed X ago").
  - `analyze()`: permission (get → request) → GPS fix (`getCurrentPositionAsync` Balanced, 8 s race, mirrors `useLocationTag`) → `GET ${API_BASE}/location/analyze?lat&lon` (axios, 20 s timeout) → `status="ready"`, `stale=false`, persist `{data, analyzedAt}`. Permission denied → error message; GPS race fail → `"Couldn't get a GPS fix. Try again outside."`; axios errors → same `errorMessage()` mapping as `useNotices` (respects `detail` from 400/502/504). Prior `data` is kept on error so the screen can show stale results + Retry.
- English source strings from this hook (i18n keys added in Task 4): `"Location permission is needed to analyze your area."`, `"Couldn't get a GPS fix. Try again outside."`, `"Can't reach the server. Check your connection."`, `"Something went wrong. Please try again."`.

- [ ] **Step 1: Write the failing tests**

Create `mobile/tests/locationText.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { fmt } from "../src/utils/locationText.js";

test("substitutes simple placeholders", () => {
  assert.equal(fmt("{alt} m — optimum 800–3000 m", { alt: "855" }),
    "855 m — optimum 800–3000 m");
});

test("substitutes every placeholder in one pass", () => {
  assert.equal(
    fmt("{texture}, pH {ph} — loam drains best", { texture: "Loam", ph: "5.8" }),
    "Loam, pH 5.8 — loam drains best"
  );
});

test("unknown keys stay literal", () => {
  assert.equal(fmt("hello {name}", {}), "hello {name}");
});

test("null/undefined values stay literal", () => {
  assert.equal(fmt("{rain} mm", { rain: null }), "{rain} mm");
  assert.equal(fmt("{rain} mm", { rain: undefined }), "{rain} mm");
});

test("missing vars map returns the template unchanged", () => {
  assert.equal(fmt("{zone} regime", null), "{zone} regime");
});

test("non-string input renders empty", () => {
  assert.equal(fmt(null, {}), "");
  assert.equal(fmt(42, {}), "");
});

test("numbers and zero are stringified", () => {
  assert.equal(fmt("pH {ph}", { ph: 0 }), "pH 0");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/admin/Desktop/PotatoDoc/mobile && npm test`
Expected: FAIL — `Cannot find module '../src/utils/locationText.js'`.

- [ ] **Step 3: Implement**

**3a. Create `mobile/src/utils/locationText.js`:**

```js
// Template interpolation for backend-generated English strings.
// The API returns templates with {placeholders} (so i18n can translate the
// sentence first); the screen calls t(template) then fmt(result, vars).
export function fmt(template, vars) {
  if (typeof template !== "string") return "";
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) && vars[key] != null
      ? String(vars[key])
      : match
  );
}
```

**3b. Create `mobile/src/hooks/useLocationAnalysis.js`:**

```js
// Location Suitability state machine — powers the Location tab.
//
//   idle (no cache) ── analyze() ──► loading ──► ready
//   ready (cache)    on mount: stale=true, renders "Analyzed X ago"
//   error: message + Retry, previous data kept (stale banner)
//
// GPS + GET + AsyncStorage follow useLocationTag / useNotices patterns.
// Backend contract (backend-standalone/location.py):
//   GET /location/analyze?lat=&lon= -> full analysis payload
//   400 Invalid coordinates · 502 Location service unavailable ·
//   504 Location service timeout (plain-string detail, shown via t()).
import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import axios from "axios";
import { API_BASE } from "./useApi";

const STORAGE_KEY = "potatoDocLocationAnalysis";
const GPS_TIMEOUT_MS = 8000;
const ANALYZE_TIMEOUT_MS = 20000;

function errorMessage(e) {
  if (!e?.response) return "Can't reach the server. Check your connection.";
  const detail = e.response.data?.detail;
  if (typeof detail === "string" && detail) return detail;
  return "Something went wrong. Please try again.";
}

export function useLocationAnalysis() {
  const [status, setStatus] = useState("idle");
  const [data, setData] = useState(null);
  const [analyzedAt, setAnalyzedAt] = useState(null);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Re-show the last analysis (offline-friendly) before any GPS work.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && parsed.data && mounted.current) {
          setData(parsed.data);
          setAnalyzedAt(parsed.analyzedAt || null);
          setStale(true);
          setStatus("ready");
        }
      } catch (e) {
        console.warn("location analysis load failed", e?.message);
      }
    })();
  }, []);

  const analyze = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      let perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        perm = await Location.requestForegroundPermissionsAsync();
      }
      if (perm.status !== "granted") {
        throw new Error("Location permission is needed to analyze your area.");
      }
      const pos = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Couldn't get a GPS fix. Try again outside.")),
            GPS_TIMEOUT_MS
          )
        ),
      ]);
      const res = await axios.get(`${API_BASE}/location/analyze`, {
        params: { lat: pos.coords.latitude, lon: pos.coords.longitude },
        timeout: ANALYZE_TIMEOUT_MS,
      });
      const analyzedAt = new Date().toISOString();
      if (!mounted.current) return;
      setData(res.data);
      setAnalyzedAt(analyzedAt);
      setStale(false);
      setStatus("ready");
      setError(null);
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ data: res.data, analyzedAt })
        );
      } catch (e) {
        console.warn("location analysis save failed", e?.message);
      }
    } catch (e) {
      if (!mounted.current) return;
      setError(axios.isAxiosError(e) ? errorMessage(e) : (e?.message || errorMessage(e)));
      setStatus("error");
    }
  }, []);

  return { status, data, analyzedAt, stale, error, analyze };
}
```

- [ ] **Step 4: Run tests + parse gate**

Run:
1. `cd /Users/admin/Desktop/PotatoDoc/mobile && npm test` — all PASS.
2. Parse gates (both new files):
   `node -e "const p=require('@babel/parser'),f=require('fs');for(const x of ['src/utils/locationText.js','src/hooks/useLocationAnalysis.js'])p.parse(f.readFileSync(x,'utf8'),{sourceType:'module',plugins:['jsx']});console.log('parse ok')"`
   (run from `mobile/`) — prints `parse ok`.

- [ ] **Step 5: Commit (root repo)**

```bash
cd /Users/admin/Desktop/PotatoDoc
git add mobile/src/utils/locationText.js mobile/tests/locationText.test.js mobile/src/hooks/useLocationAnalysis.js
git commit -m "Add location analysis hook and template fmt helper"
```

---

### Task 4: Location tab rewrite (designer screenshots) + components + i18n

**Files:**
- Create: `mobile/src/components/location/ScoreCard.js`
- Create: `mobile/src/components/location/FactorRow.js`
- Create: `mobile/src/components/location/SegTabs.js`
- Rewrite: `mobile/src/screens/LocationScreen.js`
- Modify: `mobile/src/i18n.js` (Nepali entries for every string below)

**Interfaces:**
- `LocationScreen()` — no props (self-contained: `useLocationAnalysis()` inside). During this task `App.js` still passes `tag`; the new component simply ignores it (tagger UI vanishes from the Location tab — restored to Profile in Task 5).
- `SegTabs({ tabs, active, onChange })` — `tabs`: string[] (already translated); renders the pill segmented control (inactive: green text on `C.leafBg` track; active: `C.primary` pill, white text).
- `ScoreCard({ data, t })` — ring + band + place + altitude + coords.
- `FactorRow({ factor, icon, expanded, onToggle, t })` — emoji, label/value, score badge + caret, progress bar, expandable `why` (via `fmt(t(why), factor.vars)`).
- Screen state: `tab` (`"Overview"|"Factors"|"Varieties"|"Tips"`), `openFactor` (index|null).
- Rendering rules:
  - Always: header + subtitle + full-width `📍 Analyze My Location` button (shows spinner while `status==="loading"`).
  - `error` → banner card with `t(error)` + **Retry** button (`analyze()`); `stale && analyzedAt` → `t("Last analyzed")} {relativeTime(analyzedAt)}` line under the button.
  - `data` present → ScoreCard, Recommendation card, chips row, SegTabs, active tab body.
  - no data: `idle` → explainer block; `loading` → centered spinner + `t("Analyzing your location…")`; `error` → banner (above) + explainer block stays.
- Tab bodies (copy verbatim from the screenshots):
  - **Overview:** `⚠️ Local Challenges` heading; bullets (`challenges` — orange dot via `•` text in `C.unknownOrange`, dark text); `🌧️ Rainfall Zone` white card with `data.rainfall_zone` right-aligned green bold.
  - **Factors:** `📊 Suitability Factors` + `t("Tap each factor to expand")`; `FactorRow` per `data.factors` (icon map below).
  - **Varieties:** `🥔 Recommended Varieties` + `t("Varieties best adapted to your location")`; numbered white cards (circle `C.primary`, white number, name green bold) from `data.varieties`. Screenshot's sample list (incl. Diamant) is an illustration per spec — render the payload's 6 NARC names as-is, order is data-driven.
  - **Tips:** `💡 Growing Tips`; green ✓ list from `data.tips` (`t(item)`).
- Factor icon map (emoji, per `factor.key`): `altitude:"⛰️"`, `temp:"🌡️"`, `rainfall:"🌧️"`, `soil:"🪨"`, `climate:"🌍"`.
- Band emoji in ScoreCard ring: `Excellent:"🌞"`, `Good:"😊"`, `Fair:"😐"`, `Poor:"😟"` (screenshot shows 🌞 for Excellent; others are the plan's choice).
- Recommendation body: `fmt(t(data.recommendation), { zone: data.region || data.rainfall_zone })` — `{zone}` is the **region word** ("mid-hills", see `region_of`), not the belt name; screenshot copy: "…typical of Nepal's mid−hills." Summary chips: Temp=`summary.temp_c` (`~13°C`), Season=`summary.season` (2-line ellipsis), Soil=`summary.soil`.
- Styles: page = `C.pageGreen` (pale green like the screenshots), cards `C.card`, button `C.primary` white bold, feature rows `C.healthyBg` + `C.healthyText` bold, heading green `C.primaryDark`, muted `C.gray` — all through `useColors()`/`makeStyles` pattern; light mode = screenshot look, dark mode keeps tokens.
- Old tagger JSX (GPS card, label card, "How tagging works") is **deleted** here and re-created verbatim as `LocationTaggerPanel.js` in Task 5 (its source remains in git history at this commit).

**Exact strings from the screenshots (English source keys):**

- Header: `Location Suitability` / `Potato Growing Analysis for Your Location`
- Button: `📍 Analyze My Location`
- Idle block: `Location Analysis` · explainer: `Using your GPS location, our AI will analyze potato growing suitability based on altitude, temperature, soil type, rainfall, and other agronomic factors.`
- 6 feature rows (emoji + text): `⛰️ Altitude analysis (optimal: 800—3000m)` · `🌡️ Temperature estimation` · `🌧️ Rainfall zone classification` · `🪨 Soil type estimation` · `🥔 Variety recommendations` · `💡 Local growing tips`
  (emoji rendered as separate `Text` so the text part is the i18n key: key = `Altitude analysis (optimal: 800—3000m)` etc.)
- Recommendation card title: `Recommendation`
- Chips labels: `Temp` · `Season` · `Soil`
- Tabs: `Overview` · `Factors` · `Varieties` · `Tips`
- Overview: `Local Challenges`, `Rainfall Zone`
- Factors: `Suitability Factors`, `Tap each factor to expand`; factor labels come translated from backend keys: `Altitude`, `Est. Temperature`, `Rainfall Zone`, `Est. Soil Type`, `Climate Zone`
- Varieties: `Recommended Varieties`, `Varieties best adapted to your location`
- Tips: `Growing Tips`
- Bands: `Excellent` · `Good` · `Fair` · `Poor`
- State strings: `Last analyzed`, `Retry`, `Analyzing your location…`, plus the 4 hook messages from Task 3.

- [ ] **Step 1: Create the three components**

**`mobile/src/components/location/SegTabs.js`:**

```js
// Segmented control: Overview · Factors · Varieties · Tips (designer tabs).
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "../../theme";

export default function SegTabs({ tabs, active, onChange }) {
  const C = useColors();
  const s = StyleSheet.create({
    track: {
      flexDirection: "row",
      backgroundColor: C.leafBg,
      borderRadius: 12,
      padding: 4,
      marginBottom: 14,
    },
    tab: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: 9,
    },
    tabActive: { backgroundColor: C.primary },
    label: { fontSize: 13.5, fontWeight: "800", color: C.primary },
    labelActive: { color: "#FFFFFF" },
  });
  return (
    <View style={s.track}>
      {tabs.map((label) => {
        const isActive = label === active;
        return (
          <Pressable
            key={label}
            style={[s.tab, isActive && s.tabActive]}
            onPress={() => onChange(label)}
          >
            <Text style={[s.label, isActive && s.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

**`mobile/src/components/location/ScoreCard.js`:**

```js
// Result header: score ring + band + place + altitude + coords (ss 5).
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "../../theme";

const BAND_EMOJI = { Excellent: "🌞", Good: "😊", Fair: "😐", Poor: "😟" };

export default function ScoreCard({ data, t }) {
  const C = useColors();
  const s = StyleSheet.create({
    card: {
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 16,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 18,
    },
    ring: {
      width: 104,
      height: 104,
      borderRadius: 52,
      borderWidth: 4,
      borderColor: C.primary,
      backgroundColor: C.card,
      alignItems: "center",
      justifyContent: "center",
    },
    emoji: { fontSize: 22 },
    score: { fontSize: 30, fontWeight: "900", color: C.primary, lineHeight: 34 },
    outOf: { fontSize: 12.5, fontWeight: "700", color: C.gray },
    info: { flex: 1 },
    band: { fontSize: 22, fontWeight: "900", color: C.primaryDark, marginBottom: 4 },
    place: { fontSize: 15, fontWeight: "700", color: C.ink },
    alt: { fontSize: 15, fontWeight: "700", color: C.healthyText, marginTop: 3 },
    coords: { fontSize: 13, fontWeight: "600", color: C.gray, marginTop: 2 },
  });
  return (
    <View style={s.card}>
      <View style={s.ring}>
        <Text style={s.emoji}>{BAND_EMOJI[data.band] || "🌞"}</Text>
        <Text style={s.score}>{data.score}</Text>
        <Text style={s.outOf}>/100</Text>
      </View>
      <View style={s.info}>
        <Text style={s.band}>{t(data.band)}</Text>
        <Text style={s.place}>📍 {data.place}</Text>
        <Text style={s.alt}>⛰️ {data.altitude_m}m altitude</Text>
        <Text style={s.coords}>
          {data.coords.lat.toFixed(4)}°, {data.coords.lon.toFixed(4)}°
        </Text>
      </View>
    </View>
  );
}
```

**`mobile/src/components/location/FactorRow.js`:**

```js
// One suitability factor: icon, label/value, score badge, bar, tap-to-expand why.
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "../../theme";
import { fmt } from "../../utils/locationText";

export default function FactorRow({ factor, icon, expanded, onToggle, t }) {
  const C = useColors();
  const s = StyleSheet.create({
    card: {
      backgroundColor: C.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 14,
      marginBottom: 10,
    },
    head: { flexDirection: "row", alignItems: "center", gap: 12 },
    icon: { fontSize: 26 },
    labels: { flex: 1 },
    label: { fontSize: 15, fontWeight: "800", color: C.ink },
    value: { fontSize: 14, fontWeight: "800", color: C.healthyText, marginTop: 2 },
    right: { alignItems: "center" },
    badge: {
      borderWidth: 1.5,
      borderColor: C.healthyBorder,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 3,
      backgroundColor: C.card,
    },
    badgeText: { fontSize: 15, fontWeight: "900", color: C.healthyText },
    caret: { fontSize: 11, color: C.gray, marginTop: 2 },
    track: {
      height: 8,
      borderRadius: 4,
      backgroundColor: C.leafBg,
      marginTop: 12,
      overflow: "hidden",
    },
    fill: { height: 8, borderRadius: 4, backgroundColor: C.primary },
    why: {
      fontSize: 12.5,
      lineHeight: 18,
      fontWeight: "500",
      color: C.gray,
      marginTop: 10,
    },
  });
  return (
    <Pressable style={s.card} onPress={onToggle}>
      <View style={s.head}>
        <Text style={s.icon}>{icon}</Text>
        <View style={s.labels}>
          <Text style={s.label}>{t(factor.label)}</Text>
          <Text style={s.value}>{t(factor.value)}</Text>
        </View>
        <View style={s.right}>
          <View style={s.badge}>
            <Text style={s.badgeText}>{factor.score}</Text>
          </View>
          <MaterialIcons
            name={expanded ? "expand-less" : "expand-more"}
            size={18}
            color={C.gray}
          />
        </View>
      </View>
      <View style={s.track}>
        <View style={[s.fill, { width: `${factor.score}%` }]} />
      </View>
      {expanded && <Text style={s.why}>{fmt(t(factor.why), factor.vars)}</Text>}
    </Pressable>
  );
}
```

- [ ] **Step 2: Rewrite `mobile/src/screens/LocationScreen.js`**

Full file — header/button/states + 4 tab bodies; copy strings exactly as listed above:

```js
// Location Suitability tab — exact replica of the designer screenshots.
// GPS + GET + cache live in useLocationAnalysis(); tagger UI moved to Profile.
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "../theme";
import { useT } from "../i18n";
import { relativeTime } from "../utils/relativeTime";
import { fmt } from "../utils/locationText";
import { useLocationAnalysis } from "../hooks/useLocationAnalysis";
import ScoreCard from "../components/location/ScoreCard";
import FactorRow from "../components/location/FactorRow";
import SegTabs from "../components/location/SegTabs";

const TABS = ["Overview", "Factors", "Varieties", "Tips"];

const FACTOR_ICONS = {
  altitude: "⛰️",
  temp: "🌡️",
  rainfall: "🌧️",
  soil: "🪨",
  climate: "🌍",
};

const FEATURES = [
  "⛰️",
  "🌡️",
  "🌧️",
  "🪨",
  "🥔",
  "💡",
];
const FEATURE_ROWS = [
  "Altitude analysis (optimal: 800—3000m)",
  "Temperature estimation",
  "Rainfall zone classification",
  "Soil type estimation",
  "Variety recommendations",
  "Local growing tips",
];

const makeStyles = (C) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.pageGreen },
    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
    title: {
      fontSize: 27,
      lineHeight: 33,
      fontWeight: "900",
      color: C.primaryDark,
      letterSpacing: -0.5,
    },
    sub: {
      fontSize: 15.5,
      fontWeight: "700",
      color: C.healthyText,
      marginTop: 4,
      marginBottom: 16,
    },
    analyzeBtn: {
      backgroundColor: C.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      marginBottom: 16,
    },
    analyzeText: { fontSize: 17, fontWeight: "900", color: "#FFFFFF" },
    banner: {
      backgroundColor: C.lateBg || C.card,
      borderWidth: 1,
      borderColor: C.lateBorder || C.cardBorder,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    bannerText: { fontSize: 13.5, fontWeight: "700", color: C.lateText || C.ink },
    retryBtn: {
      marginTop: 8,
      alignSelf: "flex-start",
      backgroundColor: C.primary,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    retryText: { fontSize: 13.5, fontWeight: "800", color: "#FFFFFF" },
    stale: {
      fontSize: 12.5,
      fontWeight: "700",
      color: C.gray,
      marginBottom: 12,
    },
    loadingBox: { alignItems: "center", paddingVertical: 40 },
    loadingText: { fontSize: 14, fontWeight: "700", color: C.gray, marginTop: 10 },
    idle: { alignItems: "center" },
    mapEmoji: { fontSize: 56, marginTop: 24 },
    idleTitle: {
      fontSize: 24,
      fontWeight: "900",
      color: C.primaryDark,
      marginTop: 14,
    },
    idleBody: {
      fontSize: 15.5,
      lineHeight: 24,
      fontWeight: "600",
      color: C.gray,
      textAlign: "center",
      marginTop: 12,
      marginBottom: 22,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: C.healthyBg,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 15,
      marginBottom: 10,
      width: "100%",
    },
    featureEmoji: { fontSize: 20 },
    featureText: { fontSize: 15, fontWeight: "800", color: C.healthyText, flex: 1 },
    recCard: {
      backgroundColor: C.healthyBg,
      borderLeftWidth: 4,
      borderLeftColor: C.primary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 14,
    },
    recTitle: { fontSize: 16, fontWeight: "900", color: C.ink, marginBottom: 8 },
    recBody: {
      fontSize: 15,
      lineHeight: 23,
      fontWeight: "600",
      color: C.text,
    },
    chips: { flexDirection: "row", gap: 10, marginBottom: 14 },
    chip: {
      flex: 1,
      backgroundColor: C.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingVertical: 14,
      alignItems: "center",
    },
    chipEmoji: { fontSize: 22 },
    chipLabel: { fontSize: 13.5, fontWeight: "700", color: C.gray, marginTop: 6 },
    chipValue: {
      fontSize: 15,
      fontWeight: "900",
      color: C.healthyText,
      marginTop: 4,
      textAlign: "center",
      paddingHorizontal: 4,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: C.primaryDark,
      marginBottom: 4,
    },
    sectionSub: {
      fontSize: 14,
      fontWeight: "600",
      color: C.gray,
      marginBottom: 14,
    },
    challenge: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 12,
      alignItems: "flex-start",
    },
    dot: { fontSize: 18, lineHeight: 22, color: C.unknownOrange },
    challengeText: { flex: 1, fontSize: 15, fontWeight: "600", color: C.ink, lineHeight: 22 },
    zoneCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 14,
      marginTop: 4,
    },
    zoneLabel: { flex: 1, fontSize: 15, fontWeight: "800", color: C.ink },
    zoneValue: { fontSize: 15, fontWeight: "900", color: C.healthyText },
    varietyCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: C.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 14,
      marginBottom: 10,
    },
    num: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: C.primary,
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "900",
      textAlign: "center",
      lineHeight: 34,
      overflow: "hidden",
    },
    varietyName: { fontSize: 16, fontWeight: "900", color: C.healthyText },
    tipRow: { flexDirection: "row", gap: 10, marginBottom: 16, alignItems: "flex-start" },
    check: { fontSize: 17, lineHeight: 23, color: C.healthyText, fontWeight: "900" },
    tipText: { flex: 1, fontSize: 15.5, lineHeight: 23, fontWeight: "600", color: C.ink },
  });

export default function LocationScreen() {
  const C = useColors();
  const t = useT();
  const s = useMemo(() => makeStyles(C), [C]);
  const { status, data, analyzedAt, stale, error, analyze } = useLocationAnalysis();
  const [tab, setTab] = useState("Overview");
  const [openFactor, setOpenFactor] = useState(null);

  const loading = status === "loading";

  const renderIdle = () => (
    <View style={s.idle}>
      <Text style={s.mapEmoji}>🗺️</Text>
      <Text style={s.idleTitle}>{t("Location Analysis")}</Text>
      <Text style={s.idleBody}>
        {t(
          "Using your GPS location, our AI will analyze potato growing suitability based on altitude, temperature, soil type, rainfall, and other agronomic factors."
        )}
      </Text>
      {FEATURE_ROWS.map((row, i) => (
        <View key={row} style={s.featureRow}>
          <Text style={s.featureEmoji}>{FEATURES[i]}</Text>
          <Text style={s.featureText}>{t(row)}</Text>
        </View>
      ))}
    </View>
  );

  const renderOverview = () => (
    <View>
      <Text style={s.sectionTitle}>⚠️ {t("Local Challenges")}</Text>
      {(data.challenges || []).map((item) => (
        <View key={item} style={s.challenge}>
          <Text style={s.dot}>•</Text>
          <Text style={s.challengeText}>{t(item)}</Text>
        </View>
      ))}
      <View style={s.zoneCard}>
        <Text style={s.zoneLabel}>🌧️ {t("Rainfall Zone")}</Text>
        <Text style={s.zoneValue}>{t(data.rainfall_zone)}</Text>
      </View>
    </View>
  );

  const renderFactors = () => (
    <View>
      <Text style={s.sectionTitle}>📊 {t("Suitability Factors")}</Text>
      <Text style={s.sectionSub}>{t("Tap each factor to expand")}</Text>
      {(data.factors || []).map((factor, i) => (
        <FactorRow
          key={factor.key}
          factor={factor}
          icon={FACTOR_ICONS[factor.key] || "❓"}
          expanded={openFactor === i}
          onToggle={() => setOpenFactor(openFactor === i ? null : i)}
          t={t}
        />
      ))}
    </View>
  );

  const renderVarieties = () => (
    <View>
      <Text style={s.sectionTitle}>🥔 {t("Recommended Varieties")}</Text>
      <Text style={s.sectionSub}>
        {t("Varieties best adapted to your location")}
      </Text>
      {(data.varieties || []).map((name, i) => (
        <View key={name} style={s.varietyCard}>
          <Text style={s.num}>{i + 1}</Text>
          <Text style={s.varietyName}>{t(name)}</Text>
        </View>
      ))}
    </View>
  );

  const renderTips = () => (
    <View>
      <Text style={s.sectionTitle}>💡 {t("Growing Tips")}</Text>
      <View style={{ height: 8 }} />
      {(data.tips || []).map((item) => (
        <View key={item} style={s.tipRow}>
          <Text style={s.check}>✓</Text>
          <Text style={s.tipText}>{t(item)}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>{t("Location Suitability")}</Text>
        <Text style={s.sub}>
          {t("Potato Growing Analysis for Your Location")}
        </Text>

        <Pressable style={s.analyzeBtn} onPress={analyze} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={s.analyzeText}>📍 {t("Analyze My Location")}</Text>
          )}
        </Pressable>

        {error && (
          <View style={s.banner}>
            <Text style={s.bannerText}>{t(error)}</Text>
            <Pressable style={s.retryBtn} onPress={analyze} disabled={loading}>
              <Text style={s.retryText}>{t("Retry")}</Text>
            </Pressable>
          </View>
        )}

        {stale && analyzedAt && (
          <Text style={s.stale}>
            {t("Last analyzed")} {relativeTime(analyzedAt)}
          </Text>
        )}

        {data ? (
          <>
            <ScoreCard data={data} t={t} />
            <View style={s.recCard}>
              <Text style={s.recTitle}>{t("Recommendation")}</Text>
              <Text style={s.recBody}>
                {fmt(t(data.recommendation), {
                  zone: data.region || data.rainfall_zone,
                })}
              </Text>
            </View>
            <View style={s.chips}>
              <View style={s.chip}>
                <Text style={s.chipEmoji}>🌡️</Text>
                <Text style={s.chipLabel}>{t("Temp")}</Text>
                <Text style={s.chipValue}>~{data.summary.temp_c}°C</Text>
              </View>
              <View style={s.chip}>
                <Text style={s.chipEmoji}>🌱</Text>
                <Text style={s.chipLabel}>{t("Season")}</Text>
                <Text style={s.chipValue} numberOfLines={2}>
                  {t(data.summary.season)}
                </Text>
              </View>
              <View style={s.chip}>
                <Text style={s.chipEmoji}>🪨</Text>
                <Text style={s.chipLabel}>{t("Soil")}</Text>
                <Text style={s.chipValue}>{t(data.summary.soil)}</Text>
              </View>
            </View>

            <SegTabs
              tabs={TABS.map((x) => t(x))}
              active={t(tab)}
              onChange={(label) =>
                setTab(TABS.find((x) => t(x) === label) || tab)
              }
            />
            {tab === "Overview" && renderOverview()}
            {tab === "Factors" && renderFactors()}
            {tab === "Varieties" && renderVarieties()}
            {tab === "Tips" && renderTips()}
          </>
        ) : loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={s.loadingText}>{t("Analyzing your location…")}</Text>
          </View>
        ) : (
          renderIdle()
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

> **Note:** `SegTabs` receives translated labels for display but the screen tracks the raw English key (`tab`), so `onChange` maps the clicked label back to its key. `fmt` is imported normally at the top.

- [ ] **Step 3: Add i18n keys**

Append to the `NE` dictionary in `mobile/src/i18n.js` (Nepali; English falls back to the key automatically):

```js
  // Location Suitability tab (designer screenshots, 2026-10-02)
  "Location Suitability": "स्थान उपयुक्तता",
  "Potato Growing Analysis for Your Location": "तपाईंको स्थानको आलो उत्पादन विश्लेषण",
  "Analyze My Location": "मेरो स्थान विश्लेषण गर्नुहोस्",
  "Location Analysis": "स्थान विश्लेषण",
  "Using your GPS location, our AI will analyze potato growing suitability based on altitude, temperature, soil type, rainfall, and other agronomic factors.":
    "तपाईंको GPS स्थान प्रयोग गरी हाम्रो AI ले अग्लाइ, तापक्रम, माटोको प्रकार, वर्षा र अन्य कृषि कारकहरूमा आधारित आलो उत्पादनको उपयुक्तता विश्लेषण गर्नेछ।",
  "Altitude analysis (optimal: 800—3000m)": "अग्लाइ विश्लेषण (उपयुक्त: ८००—३००० मिटर)",
  "Temperature estimation": "तापक्रम अनुमान",
  "Rainfall zone classification": "वर्षा क्षेत्र वर्गीकरण",
  "Soil type estimation": "माटोको प्रकार अनुमान",
  "Variety recommendations": "किस्म सिफारिसहरू",
  "Local growing tips": "स्थानीय खेती सुझावहरू",
  Recommendation: "सिफारिस",
  Overview: "अवलोकन",
  Factors: "कारकहरू",
  Varieties: "किस्महरू",
  Tips: "सुझावहरू",
  "Local Challenges": "स्थानीय चुनौतीहरू",
  "Rainfall Zone": "वर्षा क्षेत्र",
  "Suitability Factors": "उपयुक्तता कारकहरू",
  "Tap each factor to expand": "विस्तार गर्न प्रत्येक कारकमा थिच्नुहोस्",
  "Recommended Varieties": "सिफारिस गरिएका किस्महरू",
  "Varieties best adapted to your location": "तपाईंको स्थानका लागि उपयुक्त किस्महरू",
  "Growing Tips": "खेती सुझावहरू",
  Temp: "तापक्रम",
  Season: "मौसम",
  Soil: "माटो",
  Excellent: "उत्कृष्ट",
  Good: "राम्रो",
  Fair: "मध्यम",
  Poor: "कमजोर",
  "Last analyzed": "अन्तिम विश्लेषण:",
  "Analyzing your location…": "तपाईंको स्थान विश्लेषण गर्दै…",
  "Location permission is needed to analyze your area.":
    "क्षेत्र विश्लेषण गर्न स्थान अनुमति आवश्यक छ।",
  "Couldn't get a GPS fix. Try again outside.":
    "GPS फिक्स पाउन सकिएन। बाहिर पुनः प्रयास गर्नुहोस्।",
  "Can't reach the server. Check your connection.":
    "सर्भरसम्म पुग्न सकिएन। तपाईंको जडान जाँच गर्नुहोस्।",
  "Something went wrong. Please try again.":
    "केही गडबड भयो। कृपया पुनः प्रयास गर्नुहोस्।",
  // Backend analysis strings passed through t() then fmt() (translate once,
  // substitute {placeholders} after — see locationText.fmt).
  // Factor labels
  Altitude: "अग्लाइ",
  "Est. Temperature": "अनुमानित तापक्रम",
  "Est. Soil Type": "अनुमानित माटोको प्रकार",
  "Climate Zone": "जलवायु क्षेत्र",
  // Rainfall / altitude belt names (ZONES in location_rules.py)
  Tropical: "उष्ण",
  "Sub-tropical": "उप-उष्ण",
  "Warm Temperate": "न्यानो शीतोष्ण",
  "Cool Temperate": "चिसो शीतोष्ण",
  "Sub-alpine": "उप-अल्पाइन",
  Alpine: "अल्पाइन",
  // Temperature-regime names (climate_zone) — "Tropical"/"Alpine" share keys above
  Subtropical: "उप-उष्ण",
  Temperate: "शीतोष्ण",
  Cold: "चिसो",
  // Region words for the recommendation {zone} (REGIONS in location_rules.py)
  Terai: "तराई",
  "low hills": "निचला पहाड",
  "mid-hills": "मध्य पहाड",
  "high hills": "उच्च पहाड",
  Himalaya: "हिमाल",
  // USDA texture names + zonal heuristic
  Loam: "लोम माटो",
  "Sandy Loam": "बालुवा लोम माटो",
  "Silt Loam": "सिल्ट लोम माटो",
  "Clay Loam": "चिकनी लोम माटो",
  "Sandy Clay Loam": "बालुवा चिकनी लोम माटो",
  "Loamy Sand": "लोम बालुवा",
  Sand: "बालुवा",
  "Silty Clay Loam": "सिल्ट चिकनी लोम माटो",
  Clay: "चिकनी माटो",
  "Silty Clay": "सिल्ट चिकनी माटो",
  "Sandy Clay": "बालुवा चिकनी माटो",
  Silt: "सिल्ट",
  "Alluvial Sandy Loam": "जलोढ़ बालुवा लोम माटो",
  // Seasons (feasible_seasons)
  "Winter (Oct–Feb)": "जाडो (असोज–फागुन)",
  "Spring (Mar–May)": "वसन्त (चैत–जेठ)",
  "Winter (Oct–Feb) & Spring (Mar–May)":
    "जाडो (असोज–फागुन) र वसन्त (चैत–जेठ)",
  "Off-season": "बाहिरी मौसम",
  // Local challenges
  "Monsoon disease pressure (Jun–Sep)": "मनसुनको रोग दबाब (असार–असोज)",
  "Frost risk at planting or harvest": "रोपाइँ वा कटनीमा पालो जोखिम",
  "Waterlogging on heavy soils": "गाह्रो माटोमा पानी जम्ने",
  "Low rainfall — irrigation needed": "कम वर्षा — सिँचाइ आवश्यक",
  "Heat stress in late crop (Mar–May)": "चरीको ढिलोअवस्थामा तातो तनाव (चैत–जेठ)",
  "Soil too acidic — apply lime before planting":
    "माटो धेरै अम्लीय — रोपाइँअघि चुनो प्रयोग गर्नुहोस्",
  // Growing tips
  "Plant in well-prepared ridges or raised beds for optimal drainage":
    "जलनिकासका लागि राम्रोसँग तयार गरिएका गाँठो वा उचालितबेडमा रोप्नुहोस्",
  "Hill up soil around plants when they reach 20–25cm to prevent greening":
    "बिरुवा २०–२५ सेमी पुगेपछि वरिपरि माटो लगाउनुहोस् — हरियो पारिनबाट जोगाउन",
  "Rotate crops — avoid planting potatoes in the same field for 3+ years":
    "बाली फेर्नुहोस् — ३ वर्षभन्दा बढी एउटै खेतमा आलो नरोप्नुहोस्",
  "Test soil pH (ideal: 5.5–6.5) and adjust with lime or sulfur as needed":
    "माटोको pH परीक्षण गर्नुहोस् (उपयुक्त: ५.५–६.५) र आवश्यक अनुसार चुनो वा सल्फर प्रयोग गर्नुहोस्",
  "In Nepal: plant Khumal varieties for best local adaptation and yield":
    "नेपालमा: राम्रो स्थानीय अनुकूलन र उत्पादनका लागि खुमाल किस्महरू रोप्नुहोस्",
  "Add compost and open drainage channels — heavy soil compacts easily":
    "कम्पोस्ट थप्नुहोस् र जलनिकास खोल्नुहोस् — गाह्रो माटो सजिलै साँघुरिन्छ",
  "Plan drip or furrow irrigation — rainfall alone will not carry the crop":
    "ड्रिप वा फरोवाखालेको सिँचाइ योजना बनाउनुहोस् — वर्षामात्रै पर्याप्त हुँदैन",
  "Watch for late blight in the humid months — remove affected leaves early":
    "आर्द्र महिनाहरूमा ढिलो ब्लाइट हेर्नुहोस् — प्रभावित पातहरू छिटो हटाउनुहोस्",
  "Use well-sprouted seed tubers and mulch to protect against cold nights":
    "राम्रो अंकुरित बीउ कन्द प्रयोग गर्नुहोस् र चिसो रातबाट जोगाउन मल्च गर्नुहोस्",
  "Apply agricultural lime 2–3 weeks before planting to lift pH":
    "pH बढाउन रोपाइँभन्दा २–३ हप्ता अघि कृषि चुनो प्रयोग गर्नुहोस्",
  // Recommendation templates (keep {zone} literal — fmt substitutes it after t())
  "Your location is excellent for potato cultivation — typical of Nepal's {zone}. Conditions closely match the ideal agronomic requirements. Focus on disease prevention and variety selection for maximum yield.":
    "तपाईंको स्थान आलो खेतीका लागि उत्कृष्ट छ — नेपालको {zone} को परम्परागत। अवस्थाहरू आदर्श कृषि आवश्यकतासँग मिल्दोजुल्दो छन्। अधिकतम उत्पादनका लागि रोग नियन्त्रण र किस्म छनोटमा ध्यान दिनुहोस्।",
  "Your location suits potato well — conditions are close to Nepal's ideal for {zone}. Manage soil fertility and watch the monsoon for disease pressure.":
    "तपाईंको स्थान आलोका लागि उपयुक्त छ — अवस्थाहरू नेपालको {zone} का लागि आदर्श नजिक छन्। माटोको उर्वरता व्यवस्थापन गर्नुहोस् र रोग दबाबका लागि मनसुनमा ध्यान दिनुहोस्।",
  "Potato can be grown here, but conditions are only moderately suitable in this {zone} zone. Choose tolerant varieties, improve drainage or irrigation, and expect lower yields.":
    "यहाँ आलो उत्पादन गर्न सकिन्छ, तर यस {zone} क्षेत्रमा अवस्था केवल मध्यम उपयुक्त छ। सहनशील किस्महरू छान्नुहोस्, जलनिकास वा सिँचाइ सुधार गर्नुहोस्, र कम उत्पादन अपेक्षा गर्नुहोस्।",
  "This location is poorly suited to potato under natural conditions. Consider another crop, or invest in irrigation, soil amendment and microclimate protection before planting.":
    "यो स्थान प्राकृतिक अवस्थामा आलोका लागि कमजोर छ। अर्को बाली विचार गर्नुहोस्, वा रोपाइँअघि सिँचाइ, माटो सुधार र माइक्रोक्लाइमेट संरक्षणमा लगानी गर्नुहोस्।",
```

- [ ] **Step 4: Gates**

Run from `mobile/`:
1. `npm test` — PASS (fmt tests untouched by this task).
2. Parse gate for every touched file:
   `node -e "const p=require('@babel/parser'),f=require('fs');for(const x of ['src/screens/LocationScreen.js','src/components/location/ScoreCard.js','src/components/location/FactorRow.js','src/components/location/SegTabs.js','src/i18n.js'])p.parse(f.readFileSync(x,'utf8'),{sourceType:'module',plugins:['jsx']});console.log('parse ok')"`

- [ ] **Step 5: Commit (root repo)**

```bash
cd /Users/admin/Desktop/PotatoDoc
git add mobile/src/screens/LocationScreen.js mobile/src/components/location/ mobile/src/i18n.js
git commit -m "Rewrite Location tab as designer Location Suitability replica"
```

---

### Task 5: Tagger panel → Profile ("Field & location settings" row + modal)

**Files:**
- Create: `mobile/src/components/LocationTaggerPanel.js`
- Modify: `mobile/src/screens/ProfileScreen.js`
- Modify: `mobile/App.js`
- Modify: `mobile/src/i18n.js` (2 new keys)

**Interfaces:**
- `LocationTaggerPanel({ tag })` — the tagger content from the **old** LocationScreen (GPS card, field-label card, "How tagging works" card), behavior identical; no SafeAreaView/ScrollView wrapper (the modal provides it). `tag` = the `useLocationTag()` object. Missing `tag` → render `null`.
- `ProfileScreen` new prop `locationTag = null`; row rendered **outside** the signed-in gate (right after the header, always visible — `DiagnoseScreen.save` works signed-out, so gating it would drop existing functionality). Row opens a `Modal` reusing `s.modalBackdrop`/`s.modalCard`/`s.modalClose` (inline `maxHeight: "86%"` + inner `ScrollView`, same as DetailsModal's shell) titled `Field & location settings`.
- `App.js`: `locationTag` prop moves from `<LocationScreen tag={locationTag}/>` → `<LocationScreen/>` + `locationTag={locationTag}` on `<ProfileScreen>`; hook ownership comment at `const locationTag = useLocationTag();` updated to mention Profile.
- i18n keys: `Field & location settings`, `GPS auto-tagging and field label` (all other panel strings already exist in `i18n.js`).

- [ ] **Step 1: Create `mobile/src/components/LocationTaggerPanel.js`**

Exact content of the old LocationScreen's three cards (styles copied from that file's `makeStyles`), self-contained:

```js
// Field-location tagging controls — extracted verbatim from the pre-rewrite
// Location tab, now hosted in Profile's "Field & location settings" modal.
// Behavior identical to before (see useLocationTag for the state contract).
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "../theme";
import { useT } from "../i18n";
import { relativeTime } from "../utils/relativeTime";

const makeStyles = (C) =>
  StyleSheet.create({
    card: {
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 16,
      marginBottom: 12,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 12 },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: C.leafBg,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitle: { fontSize: 15, fontWeight: "800", color: C.ink },
    cardBody: {
      fontSize: 12.5,
      lineHeight: 17,
      fontWeight: "500",
      color: C.gray,
      marginTop: 2,
    },
    fixBox: {
      marginTop: 12,
      backgroundColor: C.page,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderRadius: 10,
      padding: 10,
    },
    fixText: {
      fontSize: 13,
      fontWeight: "700",
      color: C.ink,
      fontVariant: ["tabular-nums"],
    },
    fixMeta: { fontSize: 12, fontWeight: "500", color: C.gray, marginTop: 3 },
    hint: {
      fontSize: 12.5,
      lineHeight: 17,
      fontWeight: "600",
      color: C.earlyText || "#FFB74D",
      marginTop: 10,
    },
    smallBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginTop: 10,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.page,
      borderRadius: 10,
      paddingVertical: 9,
      paddingHorizontal: 12,
      alignSelf: "flex-start",
    },
    smallBtnText: { fontSize: 13, fontWeight: "800", color: C.ink },
    label: {
      fontSize: 13,
      fontWeight: "800",
      color: C.ink,
      marginBottom: 8,
    },
    input: {
      backgroundColor: C.page,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "ios" ? 12 : 9,
      fontSize: 14,
      fontWeight: "500",
      color: C.ink,
    },
    howTitle: { fontSize: 13.5, fontWeight: "800", color: C.ink, marginBottom: 6 },
    howBody: {
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "500",
      color: C.gray,
    },
    pill: {
      marginTop: 10,
      alignSelf: "flex-start",
      fontSize: 11.5,
      fontWeight: "800",
      color: C.primary,
      backgroundColor: C.healthyBg,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      overflow: "hidden",
    },
  });

export default function LocationTaggerPanel({ tag }) {
  const C = useColors();
  const t = useT();
  const s = useMemo(() => makeStyles(C), [C]);
  const [toggling, setToggling] = useState(false);

  if (!tag) return null;

  const { enabled, label, coords, updatedAt, permission, busy } = tag;

  const onToggle = async (value) => {
    setToggling(true);
    try {
      await tag.setEnabled(value);
    } finally {
      setToggling(false);
    }
  };

  const onRefresh = async () => {
    await tag.refresh();
  };

  const denied = permission === "denied" && !enabled;

  return (
    <View>
      {/* --- GPS --- */}
      <View style={s.card}>
        <View style={s.row}>
          <View style={s.iconWrap}>
            <MaterialIcons name="gps-fixed" size={20} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>{t("GPS auto-tagging")}</Text>
            <Text style={s.cardBody}>
              {t("Attach your coordinates to every saved diagnosis.")}
            </Text>
          </View>
          <Switch
            value={!!enabled}
            onValueChange={onToggle}
            disabled={toggling || busy}
            trackColor={{ false: C.cardBorder, true: C.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {enabled && coords && (
          <View style={s.fixBox}>
            <Text style={s.fixText}>
              {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
            </Text>
            <Text style={s.fixMeta}>
              {t("Accuracy")}: ±{Math.round(coords.accuracy || 0)} m
              {updatedAt ? ` · ${relativeTime(updatedAt)}` : ""}
            </Text>
          </View>
        )}

        {denied && (
          <>
            <Text style={s.hint}>
              {t("Location permission is off. Allow it in Settings to auto-tag scans.")}
            </Text>
            <Pressable style={s.smallBtn} onPress={() => Linking.openSettings()}>
              <MaterialIcons name="settings" size={15} color={C.ink} />
              <Text style={s.smallBtnText}>{t("Open Settings")}</Text>
            </Pressable>
          </>
        )}

        {enabled && (
          <Pressable style={s.smallBtn} onPress={onRefresh} disabled={busy}>
            {busy ? (
              <ActivityIndicator size="small" color={C.primary} />
            ) : (
              <MaterialIcons name="my-location" size={15} color={C.ink} />
            )}
            <Text style={s.smallBtnText}>{t("Refresh fix")}</Text>
          </Pressable>
        )}
      </View>

      {/* --- Manual label --- */}
      <View style={s.card}>
        <Text style={s.label}>{t("Field or village name")}</Text>
        <TextInput
          style={s.input}
          value={label || ""}
          onChangeText={tag.setLabel}
          placeholder={t("e.g. Field A, Pokhara")}
          placeholderTextColor={C.gray}
          maxLength={80}
        />
        <Text style={s.pill}>{t("Works without GPS")}</Text>
      </View>

      {/* --- How it works --- */}
      <View style={s.card}>
        <Text style={s.howTitle}>{t("How tagging works")}</Text>
        <Text style={s.howBody}>
          {t(
            "Every diagnosis you save stores this tag — coordinates and/or the name above. Open it in History to see where and when it was taken, and support staff see the same tag when helping you."
          )}
        </Text>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Modify `mobile/src/screens/ProfileScreen.js`**

**2a.** Import next to the other components:

```js
import LocationTaggerPanel from "../components/LocationTaggerPanel";
```

**2b.** Signature — add `locationTag = null` after `onRemovePhoto`:

```js
export default function ProfileScreen({
  user,
  unread = 0,
  onSignIn,
  onSignOut,
  onOpenNews,
  onOpenAbout,
  onOpenSupport,
  onSaveProfile,
  onUploadPhoto,
  onRemovePhoto,
  locationTag = null,
}) {
```

**2c.** State — add next to `const [editing, setEditing] = useState(false);`:

```js
  const [taggerOpen, setTaggerOpen] = useState(false);
```

**2d.** Row — immediately **after** the header's closing `</View>` (after the bell button block) and **before** `{user ? (`, so it shows for signed-in and signed-out farmers:

```jsx
        {/* Field tagging — works without an account, so it sits outside the gate. */}
        {locationTag && (
          <Pressable
            style={[s.row, { marginTop: 4 }]}
            onPress={() => setTaggerOpen(true)}
          >
            <IconTile s={s} C={C} name="gps-fixed" />
            <View style={s.flex}>
              <Text style={s.rowLabel}>{t("Field & location settings")}</Text>
              <Text style={s.rowSub}>{t("GPS auto-tagging and field label")}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={C.gray} />
          </Pressable>
        )}
```

**2e.** Modal — right before the closing `</SafeAreaView>` (after `<DetailsModal .../>`), reusing the details sheet shell:

```jsx
      <Modal
        visible={taggerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTaggerOpen(false)}
      >
        <View style={s.modalBackdrop}>
          <View style={[s.modalCard, { maxHeight: "86%" }]}>
            <Pressable
              style={s.modalClose}
              onPress={() => setTaggerOpen(false)}
              hitSlop={8}
            >
              <MaterialIcons name="close" size={18} color="#12301C" />
            </Pressable>
            <Text style={[s.modalTitle, { marginBottom: 14 }]}>
              {t("Field & location settings")}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <LocationTaggerPanel tag={locationTag} />
            </ScrollView>
          </View>
        </View>
      </Modal>
```

(`ScrollView` and `Modal` are already imported in ProfileScreen.)

- [ ] **Step 3: Modify `mobile/App.js`**

1. Line ~146 comment + hook (keep hook where it is — one owner):

```js
  // Field-location tag: Profile's settings modal edits it, Diagnose stamps it on save.
  const locationTag = useLocationTag();
```

2. Location tab (line ~275):

```jsx
                {tab === "location" && <LocationScreen />}
```

3. ProfileScreen call — add the prop:

```jsx
                  <ProfileScreen
                    user={user}
                    locationTag={locationTag}
                    historyCount={history.length}
```

(keep every other prop exactly as-is)

- [ ] **Step 4: Add 2 i18n keys**

Append to `NE` in `mobile/src/i18n.js`:

```js
  "Field & location settings": "खेत र स्थान सेटिङहरू",
  "GPS auto-tagging and field label": "GPS स्वचालित ट्याग र खेतको नाम",
```

- [ ] **Step 5: Gates**

Run from `mobile/`:
1. `npm test` — PASS.
2. Parse gate:
   `node -e "const p=require('@babel/parser'),f=require('fs');for(const x of ['src/components/LocationTaggerPanel.js','src/screens/ProfileScreen.js','App.js','src/i18n.js'])p.parse(f.readFileSync(x,'utf8'),{sourceType:'module',plugins:['jsx']});console.log('parse ok')"`

- [ ] **Step 6: Commit (root repo)**

```bash
cd /Users/admin/Desktop/PotatoDoc
git add mobile/src/components/LocationTaggerPanel.js mobile/src/screens/ProfileScreen.js mobile/App.js mobile/src/i18n.js
git commit -m "Move location tagger controls into Profile settings modal"
```

---

### Task 6: Full verification + smoke

**Files:** none (verification only).

- [ ] **Step 1: Backend gate**

```bash
cd /Users/admin/Desktop/PotatoDoc/backend-standalone
python3 -m unittest discover -p "test_*.py"
```
Expected: all PASS (Task 1 rules + Task 2 endpoint + full pre-existing suite; baseline was 102+ tests).

- [ ] **Step 2: Mobile gates**

```bash
cd /Users/admin/Desktop/PotatoDoc/mobile
npm test
node -e "const p=require('@babel/parser'),f=require('fs');for(const x of ['src/screens/LocationScreen.js','src/components/location/ScoreCard.js','src/components/location/FactorRow.js','src/components/location/SegTabs.js','src/components/LocationTaggerPanel.js','src/hooks/useLocationAnalysis.js','src/utils/locationText.js','src/screens/ProfileScreen.js','src/i18n.js','App.js'])p.parse(f.readFileSync(x,'utf8'),{sourceType:'module',plugins:['jsx']});console.log('parse ok')"
```
Expected: tests PASS (locationText included), `parse ok`.

- [ ] **Step 3: Live endpoint smoke (backend running)**

```bash
curl -s "http://localhost:8000/location/analyze?lat=28.2132&lon=83.9908" | head -c 400
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8000/location/analyze?lat=999&lon=10"
curl -s "http://localhost:8000/location/analyze?lat=28.2132&lon=83.9908" | head -c 120   # 2nd call: cache hit, instant
```
Expected: first → 200 full JSON (live sources); bad coords → `400`; repeat → same payload fast (SQLite cache).

- [ ] **Step 4: Manual mobile smoke (per spec)**

1. Location tab → screenshot-identical idle → `📍 Analyze My Location` → loading → result; all 4 tabs (Overview/Factors/Varieties/Tips) match the 5 screenshots (layout/copy; values data-driven).
2. Tap a factor → expands `why` with substituted values; tap again → collapses.
3. Airplane mode + `Analyze` → error banner + Retry; previously analyzed → stale "Last analyzed …" line; cached result still shown.
4. Profile → new row → modal → tagger toggle/label/refresh behave exactly as the old Location tab; signed-out Profile still shows the row.
5. Save a diagnosis → History entry still carries the location tag (lat/lon/label) — `useLocationTag` untouched.
6. Language नेपाली → new strings translate (EN fallback = key elsewhere); dark mode → screen stays legible (tokens only).

- [ ] **Step 5: Confirm commit sequence**

`git log --oneline` should show (root `main`): `location analysis hook and fmt helper` → `Location tab replica` → `tagger → Profile`; (backend-standalone `master`): `location suitability rules` → `GET /location/analyze`.
