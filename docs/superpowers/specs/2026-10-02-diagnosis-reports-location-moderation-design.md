# Diagnosis Reports, Location Tagging & Admin Moderation — Design

**Date:** 2026-10-02
**Status:** Approved by user (section-by-section, this session)

## Goal

Three linked capabilities, all centered on diagnosis records:

1. **Location tagging** — every saved diagnosis is automatically tagged with the device's GPS coordinates, and the placeholder `LocationScreen` becomes a real "recent tags" view.
2. **History report modal** — tapping a history row opens a modal that mirrors the live diagnosis output (photo, verdict, confidence, top-3, advice — **no heatmap**), with a Share action that exports the report as an image.
3. **Admin moderation** — superadmins drill down farmer-by-farmer to see that farmer's diagnoses (photo + result + location) and can **ban** a farmer for inappropriate uploads (banned = cannot log in).

## Scope decisions (approved)

| Question | Decision |
|---|---|
| "Location folder" | The `mobile/src/screens/LocationScreen.js` "Coming soon" placeholder |
| Location meaning | Auto-GPS tag per saved diagnosis (device coordinates) |
| Report modal content | Full output **minus heatmap** (photo, class, confidence, top-3, model, date, advice) |
| "Show to others" | Share button exports the report **as an image** |
| Admin browsing | **Per-farmer drill-down** only (farmers list → farmer detail → their diagnoses) |
| Ban semantics | **Login-block**: `banned` flag; login and authenticated access rejected with a clear message; content stays visible to admin as evidence |
| Storage | **Approach A — server mirror**: local history untouched; new `diagnoses` table (SQLite BLOB) filled on save |
| New npm deps | `expo-location`, `react-native-view-shot`, `expo-sharing` (user-approved) |

## Data model (backend-standalone/db.py)

```sql
CREATE TABLE IF NOT EXISTS diagnoses (
  id TEXT NOT NULL,                  -- client history item id (string)
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class TEXT,
  confidence REAL,
  probabilities TEXT,                -- JSON: predict's {class: prob} map
  model TEXT,
  lat REAL,
  lng REAL,
  image BLOB NOT NULL,
  mime TEXT DEFAULT 'image/jpeg',
  created_at TEXT,
  PRIMARY KEY (id, user_id)          -- composite: client ids can collide across users
);
CREATE INDEX IF NOT EXISTS idx_diagnoses_user ON diagnoses(user_id, id);
```

- `users.banned INTEGER NOT NULL DEFAULT 0` via guarded `_migrate` ALTER (same idempotent pattern as `photo`).
- Image normalisation reuses `media.normalise(raw, content_type, max_edge=1280, quality=85)`; source cap `MAX_UPLOAD_BYTES` (5 MB). JPEG only.
- Upsert: `INSERT ... ON CONFLICT(id, user_id) DO UPDATE` so re-saving a history item replaces only *that user's* server copy (the composite PK prevents a colliding client id from ever overwriting another farmer's row).

## API contract (additive — nothing existing changes shape)

All error `detail` values are plain strings. No new pip dependencies.

| Method & path | Auth | Behavior |
|---|---|---|
| `POST /diagnoses` | user | multipart `file` + form fields `id, class, confidence, probabilities, model, lat, lng`. 201 `{id}`. 422 over 5 MB / not an image. Upsert on repeat. |
| `GET /diagnoses/{id}/image` | user, **owner only** | 200 image bytes; 404 (never 403) for other users' ids |
| `GET /admin/users` | superadmin | farmers list: `{items: [{id, name, contact, photo, banned, diagnosis_count}]}` — `photo` is the base64 data-URI (or null), same convention as the auth user dicts |
| `GET /admin/users/{id}` | superadmin | that farmer, same shape (404 unknown) |
| `GET /admin/users/{id}/diagnoses` | superadmin | `{items: [{id, class, confidence, probabilities, model, created_at, lat, lng, image_url}]}` — no blobs inline; `image_url` = image route below (0-based, same `ORDER BY id LIMIT 1 OFFSET` semantics as notices) |
| `GET /admin/users/{id}/diagnoses/{index}/image` | superadmin | full-size image bytes, any farmer, no status concept |
| `POST /admin/users/{id}/ban` | superadmin | 204. 404 unknown user; **400 if the target is a superadmin** |
| `DELETE /admin/users/{id}/ban` | superadmin | 204 (idempotent unban) |

**Endpoint coordination:** the in-flight *tickets* feature (uncommitted, concurrent session) adds `GET /admin/users[/{id}]` per its `app.py` docstring. Whichever lands first wins; the other extends additively (`banned`, `diagnosis_count` may be added as siblings). Ban and diagnoses sub-routes are ours exclusively.

**Ban enforcement:**
- `POST /auth/login` rejects a banned user: `403 "Your account has been suspended. Contact support."`
- `require_user` rejects a banned user with the same message (valid token + ban → blocked), keeping its explicit column list (add `banned` — an int, never a blob).
- Superadmins cannot be banned (enforced at the endpoint, plus the flag is meaningless to them).

## Mobile plan

**Deps:** `expo-location`, `react-native-view-shot`, `expo-sharing` (the only dependency additions; nothing pip-side).

### GPS tag on save (DiagnoseScreen + useApi + history payload)

1. On first save requiring it, `Location.requestForegroundPermissionsAsync()`. Denied → proceed untagged, no error shown.
2. `handleSave`: after `addEntry` succeeds, best-effort `Location.getCurrentPositionAsync` with a short timeout. Failure/denial → entry saved without `lat`/`lng`. Location never blocks or fails a diagnosis.
3. History payload (local + `/history` sync) gains `lat`, `lng`, and `syncPending?: true` when the server upload fails — all additive to the opaque JSON payload contract.
4. Server mirror: `POST /diagnoses` with the image + metadata via a new authed-multipart helper (the `uploadAuthed` pattern; extra fields as form fields). Best-effort at save; on failure mark `syncPending`. On HistoryScreen mount, one bounded retry pass over pending entries (skips items with no local image).
5. `handleSave` for Unknown results is unchanged (Unknown is never saved today).

### Report modal (new `mobile/src/components/HistoryReportModal.js`)

- `HistoryScreen` rows become `Pressable` → open the modal for that entry.
- Contents: leaf image (`item.imageUri` → fallback `GET /diagnoses/{id}/image` when the entry has a server copy → else `eco` placeholder) + **the existing `PredictionResult` component with `heatmap`/`ensembleHeatmaps` undefined** (it already handles missing heatmaps — the modal literally reuses the live output component) + a location line (`📍 27.71, 85.32` or the "Not tagged" i18n string) + a **Share** button.
- Top-3 and advice need no new data: `probabilities` is already in the stored history item, and per-class advice comes from the existing `constants/diseaseInfo`.
- Share: `captureRef` on the modal card → PNG → `Share.share`/`expo-sharing` native sheet.
- Older entries: show whatever exists (local image only, or placeholder + full stats). Never an error state for pre-feature entries.

### LocationScreen (complete)

- Not-granted state: permission education card + "Enable location" button.
- Granted state: stat line "X of your last Y scans tagged" + list of recent tagged entries (verdict, `lat, lng` at 4 decimals, date), newest first, capped at ~20.
- No map view (no map dependency, by design).
- New i18n keys with Nepali translations.

## Superadmin panel plan (static/admin)

- New **Farmers** nav item and page: rows = profile photo (data-URI renders directly in `<img>`), name, contact, diagnosis count, `BANNED` badge.
- Click → farmer detail: larger profile photo, identity, **Ban / Unban** button (confirm dialog → `POST`/`DELETE .../ban`, then refresh), and a thumbnail grid of that farmer's diagnoses hydrated with the existing `imageUrl`/`hydrateThumbs` fetch-with-bearer → blob-URL helpers (`data-thumb` attributes, never bare `src`).
- Click a thumbnail → detail modal: full-size photo (admin image route), verdict, confidence, top-3 (from `probabilities`), model, date, location coords, and the farmer's name/contact.
- ES2019 only, no libraries; `node --check static/admin/app.js` gate.

## Error handling

- Every backend `detail` is a plain string (mobile renders `authErrorMessage`/`e.response.data.detail` directly).
- Mobile: location failure is silent-by-design; upload failure is silent-with-retry (no modal errors for background sync); share/view-shot failure shows the existing toast/inline pattern.
- Panel: 401 → `signOut(false)` (existing pattern); failed thumb hydration → `.thumb-missing` class (existing pattern).

## Testing

- **Backend:** +~10 unittest cases: post/upsert, owner-only image 404 (and 404 not 403 for strangers), validation 422s, admin users list/detail, admin diagnoses list + image bytes, ban blocks `login` **and** `require_user`, unban restores, ban-superadmin 400. Committed baseline 102 → ~112+ (a concurrent feature may add its own tests; gate is "suite green + our new tests present").
- **Mobile:** `npm test` green; `@babel/parser` `plugins:['jsx']` gate on every touched file.
- **Panel:** `node --check static/admin/app.js`.
- **Live smoke:** register farmer → diagnose + save with GPS → report modal opens with photo → share sheet appears → admin sees farmer + photo → ban → farmer login rejected with the suspended message → unban → login works.

## Out of scope

- Map view / field polygons / named fields
- Heatmaps in history reports (explicitly excluded by user)
- Text-only share fallback
- Hiding or deleting individual diagnoses (ban keeps content as evidence)
- Backfilling locations for pre-feature diagnoses
- Rate limiting the `POST /diagnoses` endpoint (matches existing `/predict` posture)
- Pushing bans to already-open sessions mid-request (next authenticated call is rejected — acceptable)
