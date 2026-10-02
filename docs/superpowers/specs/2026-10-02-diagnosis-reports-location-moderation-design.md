# Diagnosis Reports, Location Tagging & Admin Moderation — Design

**Date:** 2026-10-02
**Status:** Approved by user (section-by-section, this session)

## Goal

Three linked capabilities, all centered on diagnosis records:

1. **Server mirror of diagnoses** — every saved diagnosis gets a server-side copy (image + metadata + whatever location fields the payload carries), enabling admin moderation and off-device report viewing.
2. **History report modal** — tapping a history row opens a modal that mirrors the live diagnosis output (photo, verdict, confidence, top-3, advice — **no heatmap**), with a Share action that exports the report as an image.
3. **Admin moderation** — superadmins drill down farmer-by-farmer to see that farmer's diagnoses (photo + result + location) and can **ban** a farmer for inappropriate uploads (banned = cannot log in).

*Location tagging itself (GPS/label capture, LocationScreen) is being built in parallel by a concurrent session — see the Coordination row below.*

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
| New npm deps | `react-native-view-shot` + `expo-sharing` (ours); `expo-location` (theirs, already installed) — user-approved |
| **Coordination** | **Split ownership with the concurrent session** (same working tree): *theirs* — `useLocationTag`, `LocationScreen`, GPS/label capture, stamping `lat`/`lng`/`label` into the save payload, and showing the tag in history rows; *ours* — server `diagnoses` table + mirror upload, report modal + share, admin drill-down + ban. We consume `lat`/`lng`/`label` opportunistically and never edit their files (`DiagnoseScreen`, `LocationScreen`, `useLocationTag`) |

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
  label TEXT,                        -- optional field/village name from the concurrent location feature
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
| `POST /diagnoses` | user | multipart `file` + form fields `id, class, confidence, probabilities, model, lat, lng, label` (location fields optional). 201 `{id}`. 422 over 5 MB / not an image. Upsert on repeat. |
| `GET /diagnoses/{id}/image` | user, **owner only** | 200 image bytes; 404 (never 403) for other users' ids |
| `GET /admin/users` | superadmin | farmers list: `{items: [{id, name, contact, photo, banned, diagnosis_count}]}` — `photo` is the base64 data-URI (or null), same convention as the auth user dicts |
| `GET /admin/users/{id}` | superadmin | that farmer, same shape (404 unknown) |
| `GET /admin/users/{id}/diagnoses` | superadmin | `{items: [{id, class, confidence, probabilities, model, created_at, lat, lng, label, image_url}]}` — no blobs inline; `image_url` = image route below (0-based, same `ORDER BY id LIMIT 1 OFFSET` semantics as notices) |
| `GET /admin/users/{id}/diagnoses/{index}/image` | superadmin | full-size image bytes, any farmer, no status concept |
| `POST /admin/users/{id}/ban` | superadmin | 204. 404 unknown user; **400 if the target is a superadmin** |
| `DELETE /admin/users/{id}/ban` | superadmin | 204 (idempotent unban) |

**Endpoint coordination:** the in-flight *tickets* feature (uncommitted, concurrent session) adds `GET /admin/users[/{id}]` per its `app.py` docstring. Whichever lands first wins; the other extends additively (`banned`, `diagnosis_count` may be added as siblings). Ban and diagnoses sub-routes are ours exclusively.

**Ban enforcement:**
- `POST /auth/login` rejects a banned user: `403 "Your account has been suspended. Contact support."`
- `require_user` rejects a banned user with the same message (valid token + ban → blocked), keeping its explicit column list (add `banned` — an int, never a blob).
- Superadmins cannot be banned (enforced at the endpoint, plus the flag is meaningless to them).

## Mobile plan

**Deps:** `react-native-view-shot` + `expo-sharing` are ours; `expo-location` belongs to the concurrent session (already added by them).

### Server mirror upload (history side — no `DiagnoseScreen` edits)

1. The concurrent session's `handleSave` stamps `lat`/`lng`/`label` into the item passed to `addEntry`. We make the **history-side `addEntry` flow** (the hook `App.js` already destructures `history`/`addEntry` from) also upload a server mirror: `POST /diagnoses` with the image + the item's fields, via a new authed-multipart helper (the `uploadAuthed` pattern; extra fields as form fields).
2. Upload is best-effort: on failure the local payload gains `syncPending: true` (additive to the opaque `/history` JSON contract) and the user sees no error.
3. On HistoryScreen mount, one bounded retry pass over pending entries (skips items with no local image). If the concurrent session hasn't wired location into the payload yet, the upload simply sends empty optional fields — everything degrades.
4. `handleSave` for Unknown results is unchanged (Unknown is never saved today), and we never edit `DiagnoseScreen`, `LocationScreen`, or `useLocationTag`.

### Report modal (new `mobile/src/components/HistoryReportModal.js`)

- `HistoryScreen` rows become `Pressable` → open the modal for that entry.
- Contents: leaf image (`item.imageUri` → fallback `GET /diagnoses/{id}/image` when the entry has a server copy → else `eco` placeholder) + **the existing `PredictionResult` component with `heatmap`/`ensembleHeatmaps` undefined** (it already handles missing heatmaps — the modal literally reuses the live output component) + a location line (`label`, `📍 lat, lng`, or the "Not tagged" i18n string — whatever the payload carries) + a **Share** button.
- Top-3 and advice need no new data: `probabilities` is already in the stored history item, and per-class advice comes from the existing `constants/diseaseInfo`.
- Share: `captureRef` on the modal card → PNG → `Share.share`/`expo-sharing` native sheet.
- Older entries: show whatever exists (local image only, or placeholder + full stats). Never an error state for pre-feature entries.
- `HistoryScreen` row-press wiring and the modal are **ours**; any location text *inside the row itself* is the concurrent session's (split within the file: they edit row rendering, we add `Pressable` + modal import — re-read the file immediately before editing).

### LocationScreen — owned by the concurrent session

Out of our hands: permission flow, GPS/label capture, `LocationScreen` UI, history-row tag display, and the `expo-location` dependency are theirs (already in flight in the working tree). We only consume the resulting `lat`/`lng`/`label` fields.

## Superadmin panel plan (static/admin)

- New **Farmers** nav item and page: rows = profile photo (data-URI renders directly in `<img>`), name, contact, diagnosis count, `BANNED` badge.
- Click → farmer detail: larger profile photo, identity, **Ban / Unban** button (confirm dialog → `POST`/`DELETE .../ban`, then refresh), and a thumbnail grid of that farmer's diagnoses hydrated with the existing `imageUrl`/`hydrateThumbs` fetch-with-bearer → blob-URL helpers (`data-thumb` attributes, never bare `src`).
- Click a thumbnail → detail modal: full-size photo (admin image route), verdict, confidence, top-3 (from `probabilities`), model, date, location (label + coords when present), and the farmer's name/contact.
- ES2019 only, no libraries; `node --check static/admin/app.js` gate.

## Error handling

- Every backend `detail` is a plain string (mobile renders `authErrorMessage`/`e.response.data.detail` directly).
- Mobile: location failure is silent-by-design; upload failure is silent-with-retry (no modal errors for background sync); share/view-shot failure shows the existing toast/inline pattern.
- Panel: 401 → `signOut(false)` (existing pattern); failed thumb hydration → `.thumb-missing` class (existing pattern).

## Testing

- **Backend:** +~10 unittest cases: post/upsert, owner-only image 404 (and 404 not 403 for strangers), validation 422s, admin users list/detail, admin diagnoses list + image bytes, ban blocks `login` **and** `require_user`, unban restores, ban-superadmin 400. Committed baseline 102 → ~112+ (a concurrent feature may add its own tests; gate is "suite green + our new tests present").
- **Mobile:** `npm test` green; `@babel/parser` `plugins:['jsx']` gate on every touched file.
- **Panel:** `node --check static/admin/app.js`.
- **Live smoke:** register farmer → diagnose + save (location fields present or not) → server row appears → report modal opens with photo → share sheet appears → admin sees farmer + photo → ban → farmer login rejected with the suspended message → unban → login works.

## Out of scope

- **Everything location-side** — `useLocationTag`, `LocationScreen`, GPS/label capture, permission UI, location display in history rows, `expo-location`: owned by the concurrent session
- Map view / field polygons beyond the concurrent session's label fallback
- Heatmaps in history reports (explicitly excluded by user)
- Text-only share fallback
- Hiding or deleting individual diagnoses (ban keeps content as evidence)
- Backfilling locations for pre-feature diagnoses
- Rate limiting the `POST /diagnoses` endpoint (matches existing `/predict` posture)
- Pushing bans to already-open sessions mid-request (next authenticated call is rejected — acceptable)
