# Farmer Authentication & History Sync — Design

Date: 2026-10-01
Status: approved by user (sections 1–5 reviewed individually)

## Goal

Let a farmer create an account, sign in, sign out, and have their prediction
history synced to the backend. Diagnosis itself stays usable signed-out.

## Scope decisions (approved)

| Question | Decision |
|---|---|
| Gating | **History only.** `/predict`, `/models`, `/ping`, `/gradcam` stay open. |
| History storage | **Local-first with sync** to the backend. |
| Backend storage | **SQLite file on the user's PC** (backend runs via `start_backend.ps1` + cloudflared). |
| Session model | **A. Server-side opaque token** in SQLite — sign-out genuinely revokes. |
| Mockup extras | **Skip all:** no Google sign-in, no "Forgot?" reset, no OTP. |
| Identifier | Field labeled **"Email or Phone"**; either is a plain unverified string. |

## Source of truth

- Backend: `github.com/RegShadbhav041/PotatoDoc-Backend` (standalone `app.py`,
  `small_cnn.py`, `outputs_image/`, `calibration/`). Auth is added to a clone of
  this repo, **not** the monorepo's older `backend/app.py`.
- Mobile: `mobile/` (Expo SDK 57, RN 0.86). No router library — `App.js` owns a
  `tab` state and will gain an `overlayScreen` state.

## Section 1 — Architecture & data model

```sql
users     (id PK, contact UNIQUE, display_name, password_hash, created_at)
sessions  (token PK, user_id FK CASCADE, created_at, expires_at)
history   (id PK, user_id FK CASCADE, payload JSON, created_at, updated_at)
```

- `contact` — normalized identifier (trimmed, lowercased).
- `password_hash` — `hashlib.scrypt` (stdlib, no new pip dependency), stored as
  `scrypt$n$r$p$salt$hash`.
- `history.id` — reuses the client-generated id that `useHistory.js` already
  creates (`${Date.now()}`), making uploads idempotent.
- `history.payload` — entry **without** `imageUri` (see Section 4). Storing
  base64 photos is what caused Android `CursorWindow` failures documented in
  `mobile/src/hooks/historyRepair.js`.
- `potatodoc.db` sits next to `app.py`.

### Code organization

```
db.py        sqlite connection + idempotent schema init   (stdlib only)
auth.py      register/login/logout/me + require_user      (fastapi + db)
history.py   GET/PUT/DELETE /history                      (fastapi + auth)
app.py       existing ML endpoints + 2 include_router() calls
```

Dependency direction is one-way (`db → auth → history`, mounted by `app.py`).
Neither new router imports torch, so both are testable without loading the
weights.

## Section 2 — Backend API contract

Additive only — no existing endpoint changes.

**Auth**

| Method | Path | Body → Response |
|---|---|---|
| POST | `/auth/register` | `{contact, name, password}` → **201** `{token, user:{id, contact, name}}` |
| POST | `/auth/login` | `{contact, password}` → **200** `{token, user}` |
| POST | `/auth/logout` | Bearer → **204** |
| GET | `/auth/me` | Bearer → **200** `{id, contact, name}` |

**History** (all require `Authorization: Bearer <token>`)

| Method | Path | Behavior |
|---|---|---|
| GET | `/history` | `{items:[...]}`, newest first |
| PUT | `/history` | `{items:[...]}` → **upsert-only** (idempotent) → `{upserted}`. The only deletion path is `DELETE /history`, so a client bug or an empty local list can never wipe the server copy. |
| DELETE | `/history` | clear the user's server copy → **204** |

**Errors** — FastAPI default `{detail}` shape (mobile reads
`e.response.data.detail`):

- **401** `"Not authenticated"` — missing, expired, or revoked token.
- **401** `"Invalid credentials"` — identical for unknown contact *and* wrong
  password, so the API cannot be used to enumerate farmers.
- **409** `"That contact is already registered"`
- **422** `"Password must be at least 8 characters"` / missing-field variants
- **429** `"Too many attempts. Try again shortly."` — in-memory, 10 failed
  logins per contact per 5 minutes. `mobile/src/hooks/useApi.js` already
  handles 429.

**Token** — 32 random bytes, opaque, 30-day expiry, validated by joining
`sessions` on every protected request. Revocation = row delete.

## Section 3 — Mobile screens & flows

**New files**

- `mobile/src/hooks/useAuth.js` — `{user, ready, signIn, signUp, signOut}`;
  restores the session on boot via `GET /auth/me` (401 → drop stale token).
- `mobile/src/components/AuthField.js` — shared field (icon + `TextInput` +
  optional eye toggle). The app currently has no `TextInput` anywhere.
- `mobile/src/screens/SignInScreen.js`
- `mobile/src/screens/SignUpScreen.js`

**New colors** in `mobile/src/constants/colors.js` (auth screens only; the rest
of the app keeps `#FAFAF7`):

| Token | Value | Use |
|---|---|---|
| `authBg` | `#E5F1DD` | screen background |
| `authBtn` | `#023422` | Sign In / Create account buttons |
| `authPill` | `#C0EEC9` | PotatoDoc title pill |
| `authField` | `#F6FAF4` | input fill |

**Navigation** — `App.js` gains `overlayScreen: null | "signIn" | "signUp"`.

**Flows**

1. **History gate** — `tab === "history"` && signed out → render
   `SignInScreen` with headline "Sign in to see your diagnosis history" and a
   back action returning to the `home` tab. Signed in → `HistoryScreen`.
2. **Home card** (`mobile/src/screens/HomeScreen.js:89`) — signed out: today's
   card with the currently-dead Sign In button wired to `overlayScreen =
   "signIn"`. Signed in: the same card becomes an account card (name, contact,
   Sign out button).
3. **Sign out** — drops the token from `AsyncStorage` and re-locks the history
   tab. **Local history is not cleared.**

**Mockup fidelity**

- Headings use `Platform.select({ ios: "Georgia", android: "serif" })`, falling
  back to bold weight.
- **"Forgot?" omitted**, **Google button and "or" divider omitted** — no dead
  controls.
- Terms & Privacy: consent **checkbox is required** to enable Create account;
  the words render as plain styled text, not underlined or tappable (no TOS
  page exists).
- Mascot avatar = `mobile/assets/icon.png` inside a ring.
- Remember me: checked → session persists across restarts; unchecked → session
  lives only for the current app run.

## Section 4 — Sync semantics

Entry shape today: `{...result, model, imageUri, id, timestamp}` where
`id = ${Date.now()}` and `timestamp` is `toLocaleString()` — a display string,
**not sortable**. Ordering therefore uses `Number(id)` (epoch ms), monotonic on
every device. Server: `ORDER BY CAST(id AS INTEGER) DESC`.

**What syncs:** everything except `imageUri`. A `file://` path is meaningless on
another device, and pushing it would force base64 back into rows — the failure
`historyRepair.js` exists to repair. `HistoryScreen.js:31` already guards
`item.imageUri ?`, so synced-in entries fall back to the leaf placeholder.

1. **Local save (always first, never blocked):** `addEntry` writes
   `AsyncStorage`, then schedules a debounced `PUT /history` (1.5 s). A failed
   push is logged and retried on the next change; it never rolls back or blocks
   the local write.
2. **On sign-in:** `GET /history` → merge → persist locally → `PUT` the merged
   list back.
3. **Merge:** union keyed by `id`. **On collision the device wins** (keeps its
   thumbnail). Sort `Number(id)` desc → cap 50 (matching `MAX_ITEMS` in
   `useHistory.js`).
4. **Sign out:** stops pushing, drops the token. Local history and the server
   copy both survive.
5. **Clear:** local clear, plus `DELETE /history` when signed in.
6. **Concurrency:** one in-flight push at a time (`syncing` flag).

**Stale session:** a 401 during any history call drops the token and re-locks
the tab behind sign-in. Local data is untouched; no retry loop.

## Section 5 — Error handling & testing

**Backend**

- `PRAGMA journal_mode=WAL`, `busy_timeout=5000`, connect-per-request (FastAPI
  sync endpoints run on a threadpool).
- Idempotent schema init at startup.
- Registration validation: `contact` trimmed + lowercased, `name` non-empty,
  `password ≥ 8` → otherwise **422**.
- Passwords and tokens are never logged.
- In-memory rate limiter resets on restart — accepted trade-off behind a tunnel.

**Mobile**

- Unreachable backend → `"Can't reach the server. Check your connection."`
- 401/409/422/429 → render the server's `detail` inline; button re-enables.
- **Sign-out always succeeds locally**, even offline: drop the token now,
  fire-and-forget the revoke. A failed revoke simply ages out at 30 days.
- Offline while signed in → history tab still works; pushes defer.

**Verification**

1. `pip install torchvision==0.17.2` — prerequisite: `app.py` imports
   torchvision at module level and it is currently missing on this machine.
2. `scripts/auth_smoke.sh` — curl-driven: register → login → push → GET →
   logout → assert 401. No new dependencies (the repo has no test framework).
3. Run the backend locally, then `npx expo start` and walk the mobile flow by
   hand (`package.json` has no lint/typecheck/test scripts).
4. Redeploy: push to `PotatoDoc-Backend` → `start_backend.ps1` → paste the new
   tunnel URL into `mobile/.env`.

## Out of scope

- Google sign-in, password reset, phone OTP/SMS verification.
- Gating `/predict` or `/models` behind auth.
- Multi-device conflict resolution beyond union-by-id.
- Any new navigation dependency.
