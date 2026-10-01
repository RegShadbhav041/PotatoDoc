# PotatoDoc Superadmin Portal — Completion Design

Date: 2026-10-01
Status: approved (Approach A — wire existing APIs, zero new deps)

## Goal

Make the superadmin portal at `/admin` fully functional against real data —
no mockup content, no dead UI. Every endpoint the backend exposes is consumed;
every UI action is exercised end-to-end.

## Current state

- Panel: `backend-standalone/static/admin/{index.html,style.css,app.js}` —
  plain ES2019, served by FastAPI at `/admin`, token in localStorage.
- Wired today: login (role-gated), `/admin/stats`, `/admin/users` list,
  role toggle, notice CRUD.
- Backend already implements but UI ignores:
  `/admin/overview`, `/admin/users/{id}`, `/admin/users/{id}/history`,
  `/admin/models`.
- DB contains 3 seeded mockup notices (sample content).

## Design

### 1. Dashboard (upgrade)

Consume `GET /admin/overview` instead of `/admin/stats`:

- **Totals row** — 5 cards: farmers, sessions, diagnoses, published notices,
  drafts (from `totals`).
- **Trend chips** — `new_users_7d`, `new_diagnoses_7d`, `sessions_24h`,
  `diagnoses_24h`.
- **Class distribution** — horizontal bars from `class_distribution`
  (label, count, width ∝ count/max). Same for `model_usage`.
- **Recent farmers** — `recent_users` (5), each row clickable → user
  drill-down.
- **Recent diagnoses** — `recent_diagnoses` (10): user, class, confidence %,
  model, time.
- Quick actions panel kept; "Refresh stats" refreshes the overview.

`/admin/stats` stays in the API (tested, harmless) but the UI no longer
calls it.

### 2. Users (upgrade + drill-down)

List view:

- `GET /admin/users` — add columns: Diagnoses (history_count),
  Last diagnosis (last_diagnosis_at).
- **Search box** — client-side `filter` on name + contact (case-insensitive),
  re-render on input; "No farmers match" empty state.
- Role toggle unchanged (`PUT /admin/users/{id}/role`).

Drill-down (`state.view = "user-detail"`):

- Entered by clicking a row (or a recent-farmer entry on the dashboard).
- Header: name, contact, role badge, joined.
- Aggregate cards: history_count, session_count, notices_read,
  last_session_at, last_diagnosis_at.
- Class distribution + model usage bars (`class_distribution`,
  `model_usage` from the detail payload).
- Diagnoses table from `GET /admin/users/{id}/history` — class, confidence,
  model, unknown flag, time.
- "Back to farmers" button restores the list (preserves search query).
- 404 → toast + back; other errors → toast, stay on view with retry button.

### 3. Models tab (new)

Nav gains a 4th item `Models` (`TITLES.models = "Models"`).

`GET /admin/models` renders:

- Callout: default model id, weights dir, class count.
- Per-model table (`items`): name, available (✓/✗), size MB, modified,
  accuracy, F1 — ensemble row shows member file aggregate.
- Training config line: epochs, batch, img size, seed, trained_at.
- Ensemble members + calibration thresholds as a definition list (JSON-safe
  rendering, truncated values).

### 4. Notices (cleanup only)

- Composer/list flow unchanged (already functional).
- Delete the 3 seeded mockup notices from the dev DB so portal + mobile
  News screen start from real content only.

### 5. Backend fix

`admin.py::_weights_dir()` default `outputs_image` → `outputs_combined`
(mirrors `app.py` post weights-fix; Docker sets the env var but local dev
does not).

No other backend changes — the four reporting endpoints already exist and
are covered by existing auth guards.

### 6. Verification

- `node --check static/admin/app.js`; parse check via `@babel/parser`.
- curl smoke (as superadmin): overview, users list, user detail, user
  history, models — assert 200 + expected keys.
- Chrome flow: login → dashboard totals/bars/recent → user drill-down →
  back → search → role toggle → Models tab → notice create/edit/delete.
- `python3 -m unittest discover -p "test_*.py"` stays 60/60.
- Notices table empty after mockup removal (verify via API).

## Error handling

Existing `api()` wrapper: 401 → logout to login screen; non-OK →
`detail` message surfaced via toast or inline form message. New views follow
the same pattern; drill-down failures offer Back.

## Out of scope

- No new backend endpoints, no auth/product changes, no framework rewrite,
  no notice scheduling/banning/audit log (Approach B features deferred).
- Mobile app untouched.

## Files touched

- `backend-standalone/static/admin/index.html` — nav item, overview markup,
  user-detail section, models section, search input.
- `backend-standalone/static/admin/app.js` — renderOverview, renderUserDetail,
  renderModels, search wiring, navigate() extension.
- `backend-standalone/static/admin/style.css` — bars, chips, detail layout,
  search input.
- `backend-standalone/admin.py` — one-line weights-dir default.
- Dev DB — delete 3 mockup notices.
