# Farmer Authentication & History Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a farmer register, sign in, sign out, and sync prediction history to their account, with the History tab locked behind sign-in.

**Architecture:** Three new stdlib/FastAPI modules (`db.py`, `auth.py`, `history.py`) mount as routers onto the existing `app.py`, which keeps only ML endpoints. Sessions are opaque rows in SQLite, so sign-out genuinely revokes. On mobile, `useAuth` owns session state and `useHistorySync` unions device + server history by id, local-write-first.

**Tech Stack:** Python 3.11 / FastAPI / stdlib `sqlite3` + `hashlib.scrypt`; `unittest` + `starlette.testclient`. Expo SDK 57 / RN 0.86 / axios / AsyncStorage; `node --test` for pure functions.

## Global Constraints

- **No new pip dependencies.** Auth uses stdlib `sqlite3`, `hashlib`, `secrets` only.
- **No new npm dependencies.** Everything uses packages already in `mobile/package.json`.
- **Prediction stays open:** `/ping`, `/models`, `/predict`, `/gradcam` remain unauthenticated and unmodified.
- **All error `detail` values are plain strings** (mobile renders `e.response.data.detail` directly).
- **History capped at 50 items** (`MAX_ITEMS` in `mobile/src/hooks/useHistory.js`).
- **`imageUri` is never synced** — device-local `file://` paths are stripped on push and never read back.
- **Session TTL 30 days; login limit 10 failures per contact per 5 minutes.**
- **Auth colors, exact:** `authBg #E5F1DD`, `authBtn #023422`, `authPill #C0EEC9`, `authField #F6FAF4`.
- Backend workspace is a **clone of `RegShadbhav041/PotatoDoc-Backend`**, not the monorepo's older `backend/app.py`.
- Backend clone path: `backend-standalone/` (added to monorepo `.gitignore`).

---

### Task 1: Backend workspace

**Files:**
- Create: `backend-standalone/` (git clone)
- Modify: `.gitignore`

**Interfaces:**
- Produces: working directory `backend-standalone/` containing `app.py` (line 151 `app = FastAPI(...)`), `small_cnn.py`, `outputs_image/`, `calibration/`.

- [ ] **Step 1: Clone the backend repo into the workspace**

```bash
cd /Users/admin/Desktop/PotatoDoc
git clone https://github.com/RegShadbhav041/PotatoDoc-Backend.git backend-standalone
```

Expected: clone succeeds; `ls backend-standalone` shows `app.py small_cnn.py outputs_image calibration requirements.txt Dockerfile README.md start_backend.ps1`.

- [ ] **Step 2: Ignore it from the monorepo**

Append to `/Users/admin/Desktop/PotatoDoc/.gitignore`:

```
# Backend deployed separately (its own repo)
backend-standalone/
```

- [ ] **Step 3: Install the missing ML dependency**

`app.py:26` does `from torchvision import transforms, models` at module level, and torchvision is absent on this machine — nothing in the backend can import yet.

```bash
pip3 install torchvision==0.17.2
python3 -c "import torch, torchvision; print(torch.__version__, torchvision.__version__)"
```

Expected: `2.2.2 0.17.2`

- [ ] **Step 4: Confirm the untouched backend still boots**

```bash
cd backend-standalone && python3 -c "import app; print('app imports OK')"
```

Expected: `app imports OK` (it also creates `potatodoc.db`, which is expected).

- [ ] **Step 5: Commit**

```bash
cd /Users/admin/Desktop/PotatoDoc && git add .gitignore && git commit -m "Ignore the separately-deployed backend clone"
```

---

### Task 2: `db.py`

**Files:**
- Create: `backend-standalone/db.py`

**Interfaces:**
- Produces: `DB_PATH: Path`, `connect() -> sqlite3.Connection`, `init_db() -> None`.
- Consumed by: `auth.py`, `history.py`, tests.

- [ ] **Step 1: Write `db.py`**

```python
"""SQLite persistence for farmer accounts, sessions and synced history.

Stdlib only. auth.py and history.py import this and nothing torch-related,
so both routers stay testable without loading the ML weights.
"""
import os
import sqlite3
from pathlib import Path

DB_PATH = Path(
    os.environ.get("POTATO_DB")
    or str(Path(__file__).resolve().parent / "potatodoc.db")
)

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  contact       TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS history (
  id         TEXT NOT NULL,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payload    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id, updated_at DESC);
"""


def connect():
    """Fresh connection per call — FastAPI sync endpoints run on a threadpool."""
    conn = sqlite3.connect(DB_PATH, timeout=5)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    with connect() as conn:
        conn.executescript(SCHEMA)
```

- [ ] **Step 2: Verify it creates the schema**

```bash
cd backend-standalone && rm -f potatodoc.db* && python3 -c "
from db import connect, init_db
init_db()
with connect() as c:
    rows = c.execute(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\").fetchall()
print([r['name'] for r in rows])
"
```

Expected: `['history', 'sessions', 'users']`

- [ ] **Step 3: Commit**

```bash
cd /Users/admin/Desktop/PotatoDoc/backend-standalone && git add db.py && git commit -m "Add SQLite schema for farmers, sessions and history"
```

---

### Task 3: Password hashing + register/login

**Files:**
- Create: `backend-standalone/auth.py`
- Create: `backend-standalone/test_helpers.py`
- Create: `backend-standalone/test_auth.py`

**Interfaces:**
- Produces: `normalize_contact(str)->str`, `hash_password(str)->str`, `verify_password(str,str)->bool`, `router` with `POST /auth/register` (201 `{token, user}`) and `POST /auth/login` (200 `{token, user}`), `auth._attempt_log` (mutable dict used by tests).
- `user` shape everywhere: `{"id": int, "contact": str, "name": str}`.

- [ ] **Step 1: Write the shared test harness first**

`backend-standalone/test_helpers.py` — **must be imported before anything else** because `db.DB_PATH` is read at import time:

```python
"""Shared TestClient wired to a throwaway database.

This module MUST be imported first, before `auth` or `history`: db.DB_PATH is
captured when db is first imported, so the POTATO_DB override below only takes
effect if nothing has touched db yet. Importing it also creates the schema, so
tests never depend on the developer's real potatodoc.db.
"""
import os
import tempfile

os.environ["POTATO_DB"] = os.path.join(
    tempfile.mkdtemp(prefix="potatodoc-test-"), "test.db"
)

from db import init_db

init_db()

from fastapi import FastAPI
from starlette.testclient import TestClient

from auth import router as auth_router

app = FastAPI()
app.include_router(auth_router)

client = TestClient(app)
```

In every test module `from test_helpers import client` comes **before** `import
auth` — the reverse order silently tests against the real database.

- [ ] **Step 2: Write the failing tests**

`backend-standalone/test_auth.py`:

```python
import itertools
import time
import unittest

from test_helpers import client

import auth

_seq = itertools.count()


def register(contact=None, name="Ram", password="potato1234"):
    """Unique contact by default so tests never collide in the shared DB."""
    if contact is None:
        contact = f"farmer{next(_seq)}-{time.time_ns()}@example.com"
    return client.post(
        "/auth/register",
        json={"contact": contact, "name": name, "password": password},
    )


class RegisterLoginTest(unittest.TestCase):
    def setUp(self):
        auth._attempt_log.clear()

    def tearDown(self):
        auth._attempt_log.clear()

    def test_register_returns_token_and_user(self):
        res = register()
        self.assertEqual(res.status_code, 201)
        body = res.json()
        self.assertTrue(len(body["token"]) > 20)
        self.assertIn("@example.com", body["user"]["contact"])
        self.assertEqual(body["user"]["name"], "Ram")
        self.assertIn("id", body["user"])

    def test_register_normalizes_contact(self):
        register("  Farmer@Example.COM ")
        dup = register("farmer@example.com")
        self.assertEqual(dup.status_code, 409)
        self.assertEqual(dup.json()["detail"], "That contact is already registered.")

    def test_register_rejects_short_password(self):
        res = register(password="short")
        self.assertEqual(res.status_code, 422)
        self.assertEqual(res.json()["detail"], "Password must be at least 8 characters.")

    def test_register_rejects_blank_name(self):
        res = register(name="   ")
        self.assertEqual(res.status_code, 422)
        self.assertEqual(res.json()["detail"], "Name is required.")

    def test_register_rejects_blank_contact(self):
        res = register(contact="   ")
        self.assertEqual(res.status_code, 422)
        self.assertEqual(res.json()["detail"], "Email or phone is required.")

    def test_login_with_wrong_password_is_generic(self):
        register("a@example.com")
        res = client.post(
            "/auth/login", json={"contact": "a@example.com", "password": "wrong-pass"}
        )
        self.assertEqual(res.status_code, 401)
        self.assertEqual(res.json()["detail"], "Invalid credentials")

    def test_unknown_contact_matches_wrong_password_detail(self):
        register("b@example.com")
        wrong = client.post(
            "/auth/login", json={"contact": "b@example.com", "password": "wrong-pass"}
        )
        unknown = client.post(
            "/auth/login", json={"contact": "nobody@example.com", "password": "wrong-pass"}
        )
        self.assertEqual(wrong.json()["detail"], unknown.json()["detail"])

    def test_login_is_case_insensitive(self):
        register("Case@Test.com")
        res = client.post(
            "/auth/login", json={"contact": "  case@test.COM ", "password": "potato1234"}
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["user"]["contact"], "case@test.com")

    def test_login_rejects_blank_fields(self):
        res = client.post("/auth/login", json={"contact": "", "password": ""})
        self.assertEqual(res.status_code, 422)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 3: Run the tests to confirm they fail**

```bash
cd backend-standalone && python3 -m unittest test_auth -v
```

Expected: `ModuleNotFoundError: No module named 'auth'`

- [ ] **Step 4: Implement `auth.py` (register + login only for now)**

`backend-standalone/auth.py`:

```python
"""Farmer accounts: register, sign in, sign out, token validation.

No torch imports — deliberately separable from app.py's ML endpoints.
"""
import base64
import hashlib
import hmac
import os
import secrets
import sqlite3
import time
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Header, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from db import connect

router = APIRouter(prefix="/auth", tags=["auth"])

TOKEN_TTL_DAYS = int(os.environ.get("POTATO_TOKEN_TTL_DAYS", "30"))
LOGIN_WINDOW_S = 300
LOGIN_MAX_ATTEMPTS = 10
SCRYPT_N, SCRYPT_R, SCRYPT_P = 2 ** 14, 8, 1
SCRYPT_MAXMEM = 64 * 1024 * 1024

# contact -> [monotonic timestamps of recent failed logins]
_attempt_log = {}


def normalize_contact(raw):
    return (raw or "").strip().lower()


def hash_password(password):
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt, n=SCRYPT_N, r=SCRYPT_R, p=SCRYPT_P, maxmem=SCRYPT_MAXMEM,
    )
    return "$".join([
        "scrypt", str(SCRYPT_N), str(SCRYPT_R), str(SCRYPT_P),
        base64.b64encode(salt).decode(),
        base64.b64encode(digest).decode(),
    ])


def verify_password(password, stored):
    try:
        _tag, n, r, p, salt_b64, digest_b64 = stored.split("$")
        digest = hashlib.scrypt(
            password.encode("utf-8"),
            salt=base64.b64decode(salt_b64),
            n=int(n), r=int(r), p=int(p), maxmem=SCRYPT_MAXMEM,
        )
        return hmac.compare_digest(digest, base64.b64decode(digest_b64))
    except Exception:
        return False


class RegisterIn(BaseModel):
    contact: str = ""
    name: str = ""
    password: str = ""


class LoginIn(BaseModel):
    contact: str = ""
    password: str = ""


def _rate_limited(contact):
    now = time.monotonic()
    hits = [t for t in _attempt_log.get(contact, []) if now - t < LOGIN_WINDOW_S]
    _attempt_log[contact] = hits
    return len(hits) >= LOGIN_MAX_ATTEMPTS


def _record_failure(contact):
    if len(_attempt_log) > 10000:
        _attempt_log.clear()
    _attempt_log.setdefault(contact, []).append(time.monotonic())


def _clear_failures(contact):
    _attempt_log.pop(contact, None)


def _issue_session(user_id, contact, name):
    token = secrets.token_urlsafe(32)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=TOKEN_TTL_DAYS)).isoformat()
    with connect() as conn:
        conn.execute(
            "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
            (token, user_id, expires_at),
        )
    return token, {"id": user_id, "contact": contact, "name": name}


@router.post("/register", status_code=201)
def register(body: RegisterIn):
    contact = normalize_contact(body.contact)
    name = (body.name or "").strip()
    if not contact:
        raise HTTPException(422, "Email or phone is required.")
    if not name:
        raise HTTPException(422, "Name is required.")
    if len(body.password or "") < 8:
        raise HTTPException(422, "Password must be at least 8 characters.")

    with connect() as conn:
        try:
            cur = conn.execute(
                "INSERT INTO users (contact, display_name, password_hash) VALUES (?, ?, ?)",
                (contact, name, hash_password(body.password)),
            )
        except sqlite3.IntegrityError:
            raise HTTPException(409, "That contact is already registered.")
        user_id = cur.lastrowid

    token, user = _issue_session(user_id, contact, name)
    return JSONResponse({"token": token, "user": user}, status_code=201)


@router.post("/login")
def login(body: LoginIn):
    contact = normalize_contact(body.contact)
    if not contact or not body.password:
        raise HTTPException(422, "Email or phone and password are required.")
    if _rate_limited(contact):
        raise HTTPException(429, "Too many attempts. Try again shortly.")

    with connect() as conn:
        row = conn.execute(
            "SELECT id, contact, display_name, password_hash FROM users WHERE contact = ?",
            (contact,),
        ).fetchone()

    # Identical 401 for unknown contact and wrong password: no user enumeration.
    if row is None or not verify_password(body.password, row["password_hash"]):
        _record_failure(contact)
        raise HTTPException(401, "Invalid credentials")

    _clear_failures(contact)
    token, user = _issue_session(row["id"], row["contact"], row["display_name"])
    return {"token": token, "user": user}
```

- [ ] **Step 5: Run the tests to confirm they pass**

```bash
cd backend-standalone && python3 -m unittest test_auth -v
```

Expected: all `... ok`, `Ran 9 tests`, `OK`

- [ ] **Step 6: Commit**

```bash
cd /Users/admin/Desktop/PotatoDoc/backend-standalone && git add auth.py test_auth.py test_helpers.py && git commit -m "Add farmer register and login with scrypt passwords"
```

---

### Task 4: Token validation, `/auth/me`, `/auth/logout`

**Files:**
- Modify: `backend-standalone/auth.py` (append)
- Modify: `backend-standalone/test_auth.py` (append)

**Interfaces:**
- Produces: `require_user(authorization: str = Header(default="")) -> dict` usable as `Depends(require_user)`; `GET /auth/me` → `{id, contact, name}`; `POST /auth/logout` → 204 (idempotent).

- [ ] **Step 1: Append the failing tests to `test_auth.py` (before `if __name__`)**

```python
class SessionTest(unittest.TestCase):
    def setUp(self):
        auth._attempt_log.clear()

    def test_me_requires_a_bearer_token(self):
        self.assertEqual(client.get("/auth/me").status_code, 401)
        self.assertEqual(
            client.get("/auth/me", headers={"Authorization": "Basic abc"}).status_code, 401
        )
        self.assertEqual(
            client.get("/auth/me", headers={"Authorization": "Bearer made-up"}).status_code, 401
        )
        self.assertEqual(client.get("/auth/me").json()["detail"], "Not authenticated")

    def test_me_returns_the_signed_in_farmer(self):
        token = register("me@example.com").json()["token"]
        res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["contact"], "me@example.com")
        self.assertEqual(body["name"], "Ram")
        self.assertIn("id", body)

    def test_logout_revokes_the_token(self):
        token = register("out@example.com").json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        self.assertEqual(client.get("/auth/me", headers=headers).status_code, 200)
        self.assertEqual(client.post("/auth/logout", headers=headers).status_code, 204)
        self.assertEqual(client.get("/auth/me", headers=headers).status_code, 401)

    def test_logout_is_idempotent(self):
        self.assertEqual(client.post("/auth/logout").status_code, 204)
        self.assertEqual(
            client.post("/auth/logout", headers={"Authorization": "Bearer gone"}).status_code, 204
        )

    def test_login_rate_limit_trips_after_ten_failures(self):
        register("throttle@example.com")
        for _ in range(10):
            client.post(
                "/auth/login",
                json={"contact": "throttle@example.com", "password": "wrong-pass"},
            )
        res = client.post(
            "/auth/login",
            json={"contact": "throttle@example.com", "password": "wrong-pass"},
        )
        self.assertEqual(res.status_code, 429)
        self.assertEqual(res.json()["detail"], "Too many attempts. Try again shortly.")

    def test_rate_limit_is_per_contact(self):
        register("one@example.com")
        register("two@example.com")
        for _ in range(10):
            client.post("/auth/login", json={"contact": "one@example.com", "password": "x"})
        other = client.post("/auth/login", json={"contact": "two@example.com", "password": "x"})
        self.assertNotEqual(other.status_code, 429)
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd backend-standalone && python3 -m unittest test_auth.SessionTest -v
```

Expected: `AttributeError` / failures — `require_user` and `/auth/me` do not exist yet.

- [ ] **Step 3: Append to `auth.py`**

```python
def require_user(authorization: str = Header(default="")):
    """FastAPI dependency: resolves a valid bearer token to the farmer."""
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(401, "Not authenticated")
    token = token.strip()

    with connect() as conn:
        row = conn.execute(
            "SELECT u.id, u.contact, u.display_name, s.expires_at "
            "FROM sessions s JOIN users u ON u.id = s.user_id "
            "WHERE s.token = ?",
            (token,),
        ).fetchone()

    if row is None:
        raise HTTPException(401, "Not authenticated")
    if row["expires_at"] <= datetime.now(timezone.utc).isoformat():
        with connect() as conn:
            conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        raise HTTPException(401, "Not authenticated")

    return {"id": row["id"], "contact": row["contact"], "name": row["display_name"]}


@router.get("/me")
def me(user: dict = Depends(require_user)):
    return user


@router.post("/logout", status_code=204)
def logout(authorization: str = Header(default="")):
    """Idempotent by design: signing out must never fail on a dead token."""
    _, _, token = (authorization or "").partition(" ")
    token = token.strip()
    if token:
        with connect() as conn:
            conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
    return Response(status_code=204)
```

- [ ] **Step 4: Run to confirm pass**

```bash
cd backend-standalone && python3 -m unittest test_auth -v
```

Expected: `Ran 15 tests` / `OK`

- [ ] **Step 5: Commit**

```bash
cd /Users/admin/Desktop/PotatoDoc/backend-standalone && git add auth.py test_auth.py && git commit -m "Add token validation, /auth/me and revoking logout"
```

---

### Task 5: History endpoints

**Files:**
- Create: `backend-standalone/history.py`
- Create: `backend-standalone/test_history.py`

**Interfaces:**
- Consumes: `auth.require_user`, `db.connect`.
- Produces: `GET /history` → `{items:[...]}` newest-first; `PUT /history` `{items}` → `{upserted:int}`; `DELETE /history` → 204. `history.MAX_ITEMS = 50`.

- [ ] **Step 1: Write the failing tests, and mount the history router in the harness**

`backend-standalone/test_history.py`:

```python
import unittest

from test_helpers import client

import auth


def sign_up(contact):
    res = client.post(
        "/auth/register",
        json={"contact": contact, "name": "Farmer", "password": "potato1234"},
    )
    return {"Authorization": f"Bearer {res.json()['token']}"}


def entry(i, **extra):
    return {
        "id": str(1700000000000 + i),
        "class": "Healthy",
        "confidence": 0.9,
        "model": "Ensemble (All Models)",
        "timestamp": "10/1/2026, 3:00 PM",
        **extra,
    }


class HistoryTest(unittest.TestCase):
    def setUp(self):
        auth._attempt_log.clear()

    def test_history_requires_authentication(self):
        self.assertEqual(client.get("/history").status_code, 401)
        self.assertEqual(client.put("/history", json={"items": []}).status_code, 401)
        self.assertEqual(client.delete("/history").status_code, 401)

    def test_put_then_get_roundtrip(self):
        h = sign_up("h1@example.com")
        res = client.put("/history", json={"items": [entry(1), entry(2)]}, headers=h)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"upserted": 2})
        items = client.get("/history", headers=h).json()["items"]
        self.assertEqual(len(items), 2)
        self.assertEqual(items[0]["class"], "Healthy")

    def test_put_is_idempotent_for_the_same_id(self):
        h = sign_up("h2@example.com")
        client.put("/history", json={"items": [entry(1)]}, headers=h)
        client.put("/history", json={"items": [entry(1, confidence=0.5)]}, headers=h)
        items = client.get("/history", headers=h).json()["items"]
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["confidence"], 0.5)

    def test_put_strips_the_device_local_image_uri(self):
        h = sign_up("h3@example.com")
        client.put(
            "/history",
            json={"items": [entry(1, imageUri="file:///var/mobile/leaf.jpg")]},
            headers=h,
        )
        item = client.get("/history", headers=h).json()["items"][0]
        self.assertNotIn("imageUri", item)
        self.assertEqual(item["class"], "Healthy")

    def test_empty_push_never_deletes_existing_items(self):
        h = sign_up("h4@example.com")
        client.put("/history", json={"items": [entry(1), entry(2)]}, headers=h)
        res = client.put("/history", json={"items": []}, headers=h)
        self.assertEqual(res.json(), {"upserted": 0})
        self.assertEqual(len(client.get("/history", headers=h).json()["items"]), 2)

    def test_delete_clears_the_copy(self):
        h = sign_up("h5@example.com")
        client.put("/history", json={"items": [entry(1)]}, headers=h)
        self.assertEqual(client.delete("/history", headers=h).status_code, 204)
        self.assertEqual(client.get("/history", headers=h).json()["items"], [])

    def test_items_come_back_newest_first(self):
        h = sign_up("h6@example.com")
        client.put("/history", json={"items": [entry(1), entry(3), entry(2)]}, headers=h)
        ids = [i["id"] for i in client.get("/history", headers=h).json()["items"]]
        self.assertEqual(
            ids,
            [str(1700000000003), str(1700000000002), str(1700000000001)],
        )

    def test_put_is_capped_at_fifty_items(self):
        h = sign_up("h7@example.com")
        res = client.put("/history", json={"items": [entry(i) for i in range(60)]}, headers=h)
        self.assertEqual(res.json(), {"upserted": 50})
        self.assertEqual(len(client.get("/history", headers=h).json()["items"]), 50)

    def test_farmers_cannot_read_each_others_history(self):
        a = sign_up("a1@example.com")
        b = sign_up("b1@example.com")
        client.put("/history", json={"items": [entry(1)]}, headers=a)
        self.assertEqual(client.get("/history", headers=b).json()["items"], [])


if __name__ == "__main__":
    unittest.main()
```

Also update `backend-standalone/test_helpers.py` so the harness exposes `/history`:

```python
from auth import router as auth_router
from history import router as history_router

app = FastAPI()
app.include_router(auth_router)
app.include_router(history_router)
```

(Replace the auth-only `app = FastAPI()` / `include_router` block from Task 3.)

- [ ] **Step 2: Run to confirm failure**

```bash
cd backend-standalone && python3 -m unittest test_history -v
```

Expected: `ModuleNotFoundError: No module named 'history'`

- [ ] **Step 3: Implement `history.py`**

```python
"""Per-farmer prediction history, pushed up from the device."""
import json

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel

from auth import require_user
from db import connect

router = APIRouter(prefix="/history", tags=["history"])

MAX_ITEMS = 50
LOCAL_ONLY_KEYS = ("imageUri",)  # device file paths are meaningless elsewhere


class HistoryPut(BaseModel):
    items: list = []


@router.get("")
def get_history(user: dict = Depends(require_user)):
    with connect() as conn:
        rows = conn.execute(
            "SELECT payload FROM history WHERE user_id = ? "
            "ORDER BY CAST(id AS INTEGER) DESC",
            (user["id"],),
        ).fetchall()
    return {"items": [json.loads(r["payload"]) for r in rows]}


@router.put("")
def put_history(body: HistoryPut, user: dict = Depends(require_user)):
    items = [
        i for i in body.items
        if isinstance(i, dict) and i.get("id") not in (None, "")
    ][:MAX_ITEMS]
    # An empty push is never intentional (Clear uses DELETE). Refuse it so a
    # client bug can never wipe a farmer's account.
    if not items:
        return {"upserted": 0}

    with connect() as conn:
        for item in items:
            payload = {k: v for k, v in item.items() if k not in LOCAL_ONLY_KEYS}
            conn.execute(
                "INSERT INTO history (id, user_id, payload, updated_at) "
                "VALUES (?, ?, ?, datetime('now')) "
                "ON CONFLICT(user_id, id) DO UPDATE SET "
                "payload = excluded.payload, updated_at = datetime('now')",
                (str(item["id"]), user["id"], json.dumps(payload, ensure_ascii=False)),
            )
    return {"upserted": len(items)}


@router.delete("", status_code=204)
def clear_history(user: dict = Depends(require_user)):
    with connect() as conn:
        conn.execute("DELETE FROM history WHERE user_id = ?", (user["id"],))
    return Response(status_code=204)
```

- [ ] **Step 4: Run to confirm pass**

```bash
cd backend-standalone && python3 -m unittest test_history -v
```

Expected: `Ran 9 tests` / `OK`

- [ ] **Step 5: Run the whole suite together**

```bash
cd backend-standalone && python3 -m unittest discover -p "test_*.py" -v
```

Expected: `Ran 24 tests` / `OK`

- [ ] **Step 6: Commit**

```bash
cd /Users/admin/Desktop/PotatoDoc/backend-standalone && git add history.py test_history.py && git commit -m "Add per-farmer history endpoints with upsert-only writes"
```

---

### Task 6: Mount routers on `app.py` + smoke script

**Files:**
- Modify: `backend-standalone/app.py:29` (imports), `backend-standalone/app.py:150-152` (mount)
- Create: `backend-standalone/scripts/auth_smoke.sh`

**Interfaces:**
- Consumes: `auth.router`, `history.router`, `db.init_db`.
- Produces: a running server exposing `/auth/*` and `/history`.

- [ ] **Step 1: Add imports to `app.py` after line 29**

```python
from db import init_db
from auth import router as auth_router
from history import router as history_router
```

- [ ] **Step 2: Mount the routers at `app.py:150-152`**

Replace:

```python
# ---------- app ----------
app = FastAPI(title="PotatoDoc backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
```

With:

```python
# ---------- app ----------
app = FastAPI(title="PotatoDoc backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Farmer accounts + synced history (see auth.py / history.py). Idempotent, so
# safe at import time. ML endpoints above stay unauthenticated.
init_db()
app.include_router(auth_router)
app.include_router(history_router)
```

- [ ] **Step 3: Confirm `app.py` still imports**

```bash
cd backend-standalone && python3 -c "import app; print(len(app.app.routes), 'routes')"
```

Expected: `NN routes` (a larger number than before; no exception).

- [ ] **Step 4: Write the smoke script**

`backend-standalone/scripts/auth_smoke.sh`:

```bash
#!/usr/bin/env bash
# End-to-end smoke test for the farmer auth + history endpoints.
# Usage: scripts/auth_smoke.sh [base-url]   (default http://127.0.0.1:8000)
set -uo pipefail

BASE="${1:-http://127.0.0.1:8000}"
CONTACT="smoke-$(date +%s)-${RANDOM}@example.com"
PASS="potato1234"
FAILURES=0

pass()  { printf '  %-44s OK\n'   "$1"; }
fail()  { printf '  %-44s FAIL\n' "$1"; FAILURES=$((FAILURES + 1)); }
assert_eq() { if [ "$2" = "$3" ]; then pass "$1"; else fail "$1 (got: ${2:-<empty>})"; fi; }

# str_field '<json>' '["token"]'  -> extracted value, or empty on any error
str_field() { printf '%s' "$1" | python3 -c 'import sys,json;print(json.load(sys.stdin)'"$2"')' 2>/dev/null || true; }

echo "Smoke-testing $BASE"

# --- register ---------------------------------------------------------------
REG=$(curl -s -X POST "$BASE/auth/register" -H 'Content-Type: application/json' \
  -d "{\"contact\":\"$CONTACT\",\"name\":\"Smoke Tester\",\"password\":\"$PASS\"}")
TOKEN=$(str_field "$REG" '["token"]')

assert_eq "POST /auth/register returns a token" "$([ -n "$TOKEN" ] && echo yes)" "yes"
assert_eq "POST /auth/register returns display name" \
  "$(str_field "$REG" '["user"]["name"]')" "Smoke Tester"

# --- session ----------------------------------------------------------------
ME=$(curl -s "$BASE/auth/me" -H "Authorization: Bearer $TOKEN")
assert_eq "GET /auth/me sees the farmer" "$(str_field "$ME" '["name"]')" "Smoke Tester"

# --- history ----------------------------------------------------------------
ITEM_ID="$(date +%s)000"
PUT=$(curl -s -X PUT "$BASE/history" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"items\":[{\"id\":\"$ITEM_ID\",\"class\":\"Healthy\",\"confidence\":0.98,\"model\":\"Ensemble\",\"timestamp\":\"now\",\"imageUri\":\"file:///tmp/x.jpg\"}]}")
assert_eq "PUT /history upserts one item" "$(str_field "$PUT" '["upserted"]')" "1"

HIST=$(curl -s "$BASE/history" -H "Authorization: Bearer $TOKEN")
COUNT=$(printf '%s' "$HIST" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)["items"]))' 2>/dev/null || echo 0)
assert_eq "GET /history returns it" "$COUNT" "1"
if printf '%s' "$HIST" | grep -q imageUri; then
  fail "imageUri was stripped on upload"
else
  pass "imageUri was stripped on upload"
fi

# --- existing contract untouched -------------------------------------------
assert_eq "GET /ping unchanged" "$(curl -s "$BASE/ping")" "Hello, I am alive"
if curl -s "$BASE/models" | grep -q '"models"'; then pass "GET /models unchanged"; else fail "GET /models unchanged"; fi

# --- logout -----------------------------------------------------------------
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/auth/logout" -H "Authorization: Bearer $TOKEN")
assert_eq "POST /auth/logout returns 204" "$code" "204"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/auth/me" -H "Authorization: Bearer $TOKEN")
assert_eq "revoked token rejected with 401" "$code" "401"

echo
if [ "$FAILURES" -eq 0 ]; then
  echo "All smoke checks passed."
else
  echo "$FAILURES check(s) FAILED"
  exit 1
fi
```

Expected: every check prints `OK` and the script ends with `All smoke checks passed.`

- [ ] **Step 6: Commit**

```bash
cd /Users/admin/Desktop/PotatoDoc/backend-standalone && git add app.py scripts/auth_smoke.sh && git commit -m "Serve auth and history routers from app.py; add smoke script"
```

---

### Task 7: Mobile color tokens + shared field

**Files:**
- Modify: `mobile/src/constants/colors.js:34`
- Create: `mobile/src/components/AuthField.js`

**Interfaces:**
- Produces: `COLORS.authBg/authBtn/authPill/authField`; `<AuthField label icon value onChangeText placeholder secure autoCapitalize />`.

- [ ] **Step 1: Add the four tokens**

In `mobile/src/constants/colors.js`, before the closing `};` of `COLORS`:

```js
  // Auth screens only (the rest of the app keeps page: "#FAFAF7")
  authBg: "#E5F1DD",
  authBtn: "#023422",
  authPill: "#C0EEC9",
  authField: "#F6FAF4",
```

- [ ] **Step 2: Create the shared field**

`mobile/src/components/AuthField.js`:

```jsx
import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

export default function AuthField({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  secure = false,
  autoCapitalize = "none",
}) {
  const [hidden, setHidden] = useState(secure);

  return (
    <View style={s.wrap}>
      <Text style={s.label}>{label}</Text>
      <View style={s.row}>
        <MaterialIcons name={icon} size={18} color={COLORS.gray} />
        <TextInput
          style={s.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9AA79B"
          secureTextEntry={hidden}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
            <MaterialIcons
              name={hidden ? "visibility-off" : "visibility"}
              size={18}
              color={COLORS.gray}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: 14 },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: COLORS.ink,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.authField,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E3EDE0",
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, color: COLORS.ink, paddingVertical: 0 },
});
```

- [ ] **Step 3: Commit**

```bash
cd /Users/admin/Desktop/PotatoDoc && git add mobile/src/constants/colors.js mobile/src/components/AuthField.js && git commit -m "Add auth color tokens and shared form field"
```

---

### Task 8: History merge (pure, test-driven)

**Files:**
- Create: `mobile/src/hooks/historyMerge.js`
- Create: `mobile/tests/historyMerge.test.js`

**Interfaces:**
- Produces: `MAX_HISTORY_ITEMS = 50`, `stripLocalKeys(item) -> item`, `mergeHistory(local, server) -> item[]`, `historyEquals(a, b) -> bool`.
- Consumed by: `useHistorySync`.

- [ ] **Step 1: Write the failing tests**

`mobile/tests/historyMerge.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  mergeHistory,
  stripLocalKeys,
  historyEquals,
  MAX_HISTORY_ITEMS,
} from "../src/hooks/historyMerge.js";

const entry = (id, extra = {}) => ({
  id: String(id),
  class: "Healthy",
  timestamp: "10/1/2026, 3:00 PM",
  ...extra,
});

test("union keeps entries found on only one side", () => {
  const merged = mergeHistory([entry(2)], [entry(1), entry(3)]);
  assert.deepEqual(merged.map((x) => x.id), ["3", "2", "1"]);
});

test("on an id collision the device copy wins", () => {
  const merged = mergeHistory(
    [entry(2, { imageUri: "file://a.jpg" })],
    [entry(2, { class: "Late Blight" })]
  );
  assert.equal(merged.length, 1);
  assert.equal(merged[0].class, "Healthy");
  assert.equal(merged[0].imageUri, "file://a.jpg");
});

test("server-only entries never carry a device-local imageUri", () => {
  const merged = mergeHistory([], [entry(7, { imageUri: "file://elsewhere.jpg" })]);
  assert.equal("imageUri" in merged[0], false);
});

test("ordering is newest first by numeric id", () => {
  const merged = mergeHistory([entry(1000), entry(3000), entry(2000)], []);
  assert.deepEqual(merged.map((x) => x.id), ["3000", "2000", "1000"]);
});

test("the merge is capped at 50 entries", () => {
  const local = Array.from({ length: 40 }, (_, i) => entry(1000 + i));
  const server = Array.from({ length: 30 }, (_, i) => entry(5000 + i));
  assert.equal(mergeHistory(local, server).length, MAX_HISTORY_ITEMS);
});

test("junk entries without an id are dropped", () => {
  const merged = mergeHistory([null, {}, { id: "" }, entry(5)], []);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, "5");
});

test("stripLocalKeys removes only device-local paths", () => {
  const out = stripLocalKeys(entry(1, { imageUri: "file://x.jpg" }));
  assert.equal("imageUri" in out, false);
  assert.equal(out.class, "Healthy");
});

test("historyEquals compares by id only", () => {
  assert.equal(historyEquals([entry(1)], [entry(1, { imageUri: "x" })]), true);
  assert.equal(historyEquals([entry(1)], [entry(2)]), false);
  assert.equal(historyEquals([], []), true);
  assert.equal(historyEquals(undefined, []), true);
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd mobile && node --experimental-default-type=module --test tests/historyMerge.test.js
```

Expected: failure / `Cannot find module .../historyMerge.js`

- [ ] **Step 3: Implement the module**

`mobile/src/hooks/historyMerge.js`:

```js
// Pure history-merge helpers. No React / React Native imports, so Node's
// built-in test runner can exercise them directly.
export const MAX_HISTORY_ITEMS = 50;

const LOCAL_ONLY_KEYS = ["imageUri"];

export function stripLocalKeys(item) {
  const out = { ...item };
  for (const key of LOCAL_ONLY_KEYS) delete out[key];
  return out;
}

export function mergeHistory(local = [], server = []) {
  const byId = new Map();

  // Server side first, defensively stripped: a foreign file:// path would
  // render as a blank thumbnail on this device.
  for (const item of server) {
    if (item && item.id != null && String(item.id) !== "") {
      byId.set(String(item.id), stripLocalKeys(item));
    }
  }
  // Device side last — on collision the device copy wins and keeps its image.
  for (const item of local) {
    if (item && item.id != null && String(item.id) !== "") {
      byId.set(String(item.id), item);
    }
  }

  return [...byId.values()]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, MAX_HISTORY_ITEMS);
}

export function historyEquals(a, b) {
  const left = Array.isArray(a) ? a : [];
  const right = Array.isArray(b) ? b : [];
  if (left.length !== right.length) return false;
  return left.every((item, i) => item && right[i] && String(item.id) === String(right[i].id));
}
```

- [ ] **Step 4: Run to confirm pass**

```bash
cd mobile && node --experimental-default-type=module --test tests/historyMerge.test.js
```

Expected: `# pass 8`, `# fail 0`

- [ ] **Step 5: Commit**

```bash
cd /Users/admin/Desktop/PotatoDoc && git add mobile/src/hooks/historyMerge.js mobile/tests/historyMerge.test.js && git commit -m "Add tested history merge helper"
```

---

### Task 9: `useAuth`

**Files:**
- Create: `mobile/src/hooks/useAuth.js`

**Interfaces:**
- Produces: `useAuth() -> {user, token, ready, signIn, signUp, signOut}`, `authErrorMessage(error) -> string`.
  - `signIn(contact, password, {remember}) -> Promise<user>`
  - `signUp(contact, name, password, {remember}) -> Promise<user>`
  - `signOut() -> void`
- `user` shape: `{id, contact, name}`.
- Consumes: `API_BASE` from `src/hooks/useApi.js:21`.

- [ ] **Step 1: Implement `mobile/src/hooks/useAuth.js`**

```js
// The single owner of session state. Screens receive signIn/signUp/signOut as
// props from App.js — calling useAuth() in more than one place would give each
// caller an independent, unsynchronised copy of the session.
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE } from "./useApi";

const TOKEN_KEY = "potatoDocAuth";
const REMEMBER_KEY = "potatoDocAuthRemember";

export function authErrorMessage(error) {
  if (!error?.response) return "Can't reach the server. Check your connection.";
  const detail = error.response.data?.detail;
  if (typeof detail === "string" && detail) return detail;
  return "Something went wrong. Please try again.";
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        const remember = await AsyncStorage.getItem(REMEMBER_KEY);
        if (stored && remember === "1") {
          const res = await axios.get(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${stored}` },
            timeout: 15000,
          });
          if (!alive) return;
          setToken(stored);
          setUser(res.data);
        } else {
          await AsyncStorage.multiRemove([TOKEN_KEY, REMEMBER_KEY]);
        }
      } catch (e) {
        // Stale, expired or revoked token: start signed out, keep local history.
        await AsyncStorage.multiRemove([TOKEN_KEY, REMEMBER_KEY]).catch(() => {});
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback(async (value, remember) => {
    if (remember) {
      await AsyncStorage.multiSet([
        [TOKEN_KEY, value],
        [REMEMBER_KEY, "1"],
      ]).catch(() => {});
    } else {
      await AsyncStorage.multiRemove([TOKEN_KEY, REMEMBER_KEY]).catch(() => {});
    }
  }, []);

  const signIn = useCallback(
    async (contact, password, options = {}) => {
      const remember = options.remember !== false;
      const res = await axios.post(
        `${API_BASE}/auth/login`,
        { contact, password },
        { timeout: 20000 }
      );
      setToken(res.data.token);
      setUser(res.data.user);
      await persist(res.data.token, remember);
      return res.data.user;
    },
    [persist]
  );

  const signUp = useCallback(
    async (contact, name, password, options = {}) => {
      const remember = options.remember !== false;
      const res = await axios.post(
        `${API_BASE}/auth/register`,
        { contact, name, password },
        { timeout: 20000 }
      );
      setToken(res.data.token);
      setUser(res.data.user);
      await persist(res.data.token, remember);
      return res.data.user;
    },
    [persist]
  );

  /** Drop a dead session (401) without touching local history. */
  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    AsyncStorage.multiRemove([TOKEN_KEY, REMEMBER_KEY]).catch(() => {});
  }, []);

  const signOut = useCallback(() => {
    const dead = token;
    setToken(null);
    setUser(null);
    AsyncStorage.multiRemove([TOKEN_KEY, REMEMBER_KEY]).catch(() => {});
    // Fire-and-forget: local sign-out must never depend on the network.
    if (dead) {
      axios
        .post(`${API_BASE}/auth/logout`, null, {
          headers: { Authorization: `Bearer ${dead}` },
          timeout: 10000,
        })
        .catch(() => {});
    }
  }, [token]);

  return { user, token, ready, signIn, signUp, signOut, clearSession };
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/admin/Desktop/PotatoDoc && git add mobile/src/hooks/useAuth.js && git commit -m "Add useAuth session hook"
```

---

### Task 10: Sign In screen

**Files:**
- Create: `mobile/src/screens/SignInScreen.js`

**Interfaces:**
- Consumes: `signIn` from Task 9, `authErrorMessage`, `AuthField`.
- Produces: `<SignInScreen gate onBack onSuccess onGoToSignUp signIn />`.

- [ ] **Step 1: Implement the screen**

`mobile/src/screens/SignInScreen.js`:

```jsx
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import AuthField from "../components/AuthField";
import { authErrorMessage } from "../hooks/useAuth";

const HEADING_FONT = Platform.select({ ios: "Georgia", android: "serif" });

export default function SignInScreen({ signIn, onBack, onSuccess, onGoToSignUp, gate = false }) {
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!contact.trim() || !password) {
      setError("Enter your email or phone and password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(contact.trim(), password, { remember });
      onSuccess();
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.topBar}>
            <Pressable style={s.backBtn} onPress={onBack} hitSlop={8}>
              <MaterialIcons name="arrow-back" size={20} color={COLORS.ink} />
            </Pressable>
            <View style={s.pill}>
              <Text style={s.pillText}>PotatoDoc</Text>
            </View>
            <View style={s.backBtn} />
          </View>

          <View style={s.avatarWrap}>
            <Image source={require("../../assets/icon.png")} style={s.avatar} />
          </View>

          <Text style={s.heading}>Welcome back!</Text>
          <Text style={s.sub}>
            {gate ? "Sign in to see your diagnosis history." : "Sign in to check on your plants."}
          </Text>

          <AuthField
            label="Email or Phone"
            icon="mail-outline"
            value={contact}
            onChangeText={setContact}
            placeholder="potato@gmail.com"
          />
          <AuthField
            label="Password"
            icon="lock-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secure
          />

          <Pressable style={s.rememberRow} onPress={() => setRemember((r) => !r)} hitSlop={8}>
            <MaterialIcons
              name={remember ? "check-circle" : "circle"}
              size={18}
              color={remember ? COLORS.authBtn : "#9AA79B"}
            />
            <Text style={s.rememberText}>Remember me</Text>
          </Pressable>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <Pressable style={[s.primaryBtn, busy && s.primaryBtnBusy]} onPress={submit} disabled={busy}>
            <Text style={s.primaryBtnText}>{busy ? "Please wait…" : "Sign In"}</Text>
          </Pressable>

          <Pressable onPress={onGoToSignUp} hitSlop={8}>
            <Text style={s.switchLine}>
              New here? <Text style={s.switchLink}>Create an account 👋</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.authBg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingBottom: 32 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    backgroundColor: COLORS.authPill,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  pillText: { fontSize: 16, fontWeight: "800", color: COLORS.authBtn },

  avatarWrap: { alignItems: "center", marginTop: 26 },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    borderColor: "#A8574A",
  },

  heading: {
    marginTop: 18,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "800",
    color: COLORS.authBtn,
    textAlign: "center",
    fontFamily: HEADING_FONT,
  },
  sub: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.gray,
    textAlign: "center",
  },

  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  rememberText: { fontSize: 14, fontWeight: "600", color: COLORS.ink },

  error: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: "#C62828",
  },

  primaryBtn: {
    marginTop: 18,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.authBtn,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnBusy: { opacity: 0.7 },
  primaryBtnText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },

  switchLine: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 14,
    color: COLORS.gray,
  },
  switchLink: { fontWeight: "700", color: COLORS.authBtn, textDecorationLine: "underline" },
});
```

- [ ] **Step 2: Commit**

```bash
cd /Users/admin/Desktop/PotatoDoc && git add mobile/src/screens/SignInScreen.js && git commit -m "Add sign in screen"
```

---

### Task 11: Create Account screen

**Files:**
- Create: `mobile/src/screens/SignUpScreen.js`

**Interfaces:**
- Consumes: `signUp` from Task 9, `authErrorMessage`, `AuthField`.
- Produces: `<SignUpScreen onBack onSuccess onGoToSignIn signUp />`.

- [ ] **Step 1: Implement the screen**

`mobile/src/screens/SignUpScreen.js`:

```jsx
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import AuthField from "../components/AuthField";
import { authErrorMessage } from "../hooks/useAuth";

const HEADING_FONT = Platform.select({ ios: "Georgia", android: "serif" });

export default function SignUpScreen({ signUp, onBack, onSuccess, onGoToSignIn }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return setError("Enter your name.");
    if (!contact.trim()) return setError("Enter your email or phone.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (!agreed) return setError("Please agree to the Terms & Privacy.");

    setBusy(true);
    setError(null);
    try {
      await signUp(contact.trim(), name.trim(), password, { remember: true });
      onSuccess();
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.topBar}>
            <Pressable style={s.backBtn} onPress={onBack} hitSlop={8}>
              <MaterialIcons name="arrow-back" size={20} color={COLORS.ink} />
            </Pressable>
            <Text style={s.topTitle}>Create Account</Text>
            <View style={s.backBtn} />
          </View>

          <View style={s.avatarWrap}>
            <Image source={require("../../assets/icon.png")} style={s.avatar} />
          </View>

          <Text style={s.heading}>Join Us !</Text>
          <Text style={s.sub}>Create your account in just a tap.</Text>

          <AuthField
            label="Full Name"
            icon="person-outline"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoCapitalize="words"
          />
          <AuthField
            label="Phone or Email"
            icon="mail-outline"
            value={contact}
            onChangeText={setContact}
            placeholder="Phone or email"
          />
          <AuthField
            label="Password"
            icon="lock-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="Create password"
            secure
          />

          <Pressable style={s.agreeRow} onPress={() => setAgreed((a) => !a)} hitSlop={8}>
            <MaterialIcons
              name={agreed ? "check-circle" : "circle"}
              size={18}
              color={agreed ? COLORS.authBtn : "#9AA79B"}
            />
            {/* Not tappable: there is no Terms page to open yet. */}
            <Text style={s.agreeText}>
              I agree to the friendly <Text style={s.agreeStatic}>Terms & Privacy</Text>
            </Text>
          </Pressable>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <Pressable style={[s.primaryBtn, busy && s.primaryBtnBusy]} onPress={submit} disabled={busy}>
            <Text style={s.primaryBtnText}>{busy ? "Please wait…" : "Create account"}</Text>
          </Pressable>

          <Pressable onPress={onGoToSignIn} hitSlop={8}>
            <Text style={s.switchLine}>
              Already have an account? <Text style={s.switchLink}>Sign in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.authBg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingBottom: 32 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { fontSize: 20, fontWeight: "800", color: COLORS.ink },

  avatarWrap: { alignItems: "center", marginTop: 20 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#A8574A",
  },

  heading: {
    marginTop: 16,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "800",
    color: COLORS.authBtn,
    textAlign: "center",
    fontFamily: HEADING_FONT,
  },
  sub: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.gray,
    textAlign: "center",
  },

  agreeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
  },
  agreeText: { flex: 1, fontSize: 14, color: COLORS.ink },
  agreeStatic: { fontWeight: "700", textDecorationLine: "underline" },

  error: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: "#C62828",
  },

  primaryBtn: {
    marginTop: 18,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.authBtn,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnBusy: { opacity: 0.7 },
  primaryBtnText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },

  switchLine: { marginTop: 20, textAlign: "center", fontSize: 14, color: COLORS.gray },
  switchLink: { fontWeight: "700", color: COLORS.authBtn, textDecorationLine: "underline" },
});
```

- [ ] **Step 2: Commit**

```bash
cd /Users/admin/Desktop/PotatoDoc && git add mobile/src/screens/SignUpScreen.js && git commit -m "Add create account screen"
```

---

### Task 12: Sync hook + `useHistory` additions

**Files:**
- Create: `mobile/src/hooks/useHistorySync.js`
- Modify: `mobile/src/hooks/useHistory.js:66-71`

**Interfaces:**
- Consumes: `API_BASE`, `mergeHistory`/`stripLocalKeys`/`MAX_HISTORY_ITEMS`, `replaceHistory` (added in this task).
- Produces:
  - `useHistorySync({token, history, replaceHistory, storageBlocked}) -> void`
  - `deleteServerHistory(token) -> Promise<void>`
  - `useHistory()` now also returns `replaceHistory(items)` and `storageBlocked: bool`.

- [ ] **Step 1: Extend `useHistory`**

Replace the return of `mobile/src/hooks/useHistory.js` (lines 66-71):

```js
  const replaceHistory = useCallback(
    async (next) => {
      if (storageBlocked) return;
      await persist(Array.isArray(next) ? next.slice(0, MAX_ITEMS) : []);
    },
    [storageBlocked]
  );

  return { history, addEntry, clearHistory, replaceHistory, storageBlocked };
}
```

- [ ] **Step 2: Create the sync hook**

`mobile/src/hooks/useHistorySync.js`:

```js
// Local-first sync: the device is the source of truth for writes, the server
// copy is unioned in at sign-in and pushed back up afterwards.
import { useCallback, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE } from "./useApi";
import {
  mergeHistory,
  historyEquals,
  stripLocalKeys,
  MAX_HISTORY_ITEMS,
} from "./historyMerge";

const PUSH_DEBOUNCE_MS = 1500;

export function useHistorySync({ token, history, replaceHistory, storageBlocked, onUnauthorized }) {
  const historyRef = useRef(history);
  historyRef.current = history;
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const blockedRef = useRef(storageBlocked);
  blockedRef.current = storageBlocked;
  const onUnauthorizedRef = useRef(onUnauthorized);
  onUnauthorizedRef.current = onUnauthorized;

  const timerRef = useRef(null);
  const inFlightRef = useRef(false);
  const mergedTokenRef = useRef(null);

  const push = useCallback(async (items) => {
    const current = tokenRef.current;
    if (!current || inFlightRef.current) return;
    if (!Array.isArray(items) || items.length === 0) return;
    inFlightRef.current = true;
    try {
      await axios.put(
        `${API_BASE}/history`,
        { items: items.slice(0, MAX_HISTORY_ITEMS).map(stripLocalKeys) },
        { headers: { Authorization: `Bearer ${current}` }, timeout: 20000 }
      );
    } catch (e) {
      // Stale session: re-lock the history tab, keep every local row.
      if (e?.response?.status === 401) {
        onUnauthorizedRef.current?.();
        return;
      }
      // Local-first: a failed push never rolls back or blocks the local write.
      console.warn("history push failed", e?.message);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  // Debounced push whenever the local list changes while signed in.
  useEffect(() => {
    if (!token || storageBlocked) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => push(historyRef.current), PUSH_DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [history, token, storageBlocked, push]);

  // Once per sign-in: union the server copy into the device list, persist, push.
  useEffect(() => {
    if (!token) {
      mergedTokenRef.current = null;
      return;
    }
    if (mergedTokenRef.current === token) return;
    mergedTokenRef.current = token;

    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/history`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 20000,
        });
        const server = Array.isArray(res.data?.items) ? res.data.items : [];
        const merged = mergeHistory(historyRef.current, server);
        if (!blockedRef.current && !historyEquals(historyRef.current, merged)) {
          replaceHistory(merged);
        }
        await push(merged);
      } catch (e) {
        if (e?.response?.status === 401) {
          onUnauthorizedRef.current?.();
          return;
        }
        // Offline at sign-in: keep the local list, retry on the next change.
        console.warn("history merge failed", e?.message);
      }
    })();
  }, [token, replaceHistory, push]);
}

/** Explicit account wipe — the only path that deletes server rows. */
export async function deleteServerHistory(token) {
  if (!token) return;
  try {
    await axios.delete(`${API_BASE}/history`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 20000,
    });
  } catch (e) {
    console.warn("history delete failed", e?.message);
  }
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/admin/Desktop/PotatoDoc && git add mobile/src/hooks/useHistory.js mobile/src/hooks/useHistorySync.js && git commit -m "Sync local history with the signed-in account"
```

---

### Task 13: Wire `App.js` (gate + overlay)

**Files:**
- Modify: `mobile/App.js`

**Interfaces:**
- Consumes: `useAuth`, `useHistorySync`, `deleteServerHistory`, both auth screens.
- Produces: `App` renders the auth screens instead of the tab body whenever `overlay !== null || tab === "history" && !user`; hides `BottomNav` during auth.

- [ ] **Step 1: Replace `mobile/App.js` entirely**

```jsx
import React, { useState, useCallback } from "react";
import { View, StyleSheet, Text, TextInput, ActivityIndicator } from "react-native";

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider, DefaultTheme } from "react-native-paper";
import HomeScreen from "./src/screens/HomeScreen";
import DiagnoseScreen from "./src/screens/DiagnoseScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import LocationScreen from "./src/screens/LocationScreen";
import AboutScreen from "./src/screens/AboutScreen";
import SignInScreen from "./src/screens/SignInScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import BottomNav from "./src/components/BottomNav";
import { COLORS } from "./src/constants/colors";
import { useHistory } from "./src/hooks/useHistory";
import { useAuth } from "./src/hooks/useAuth";
import { useHistorySync, deleteServerHistory } from "./src/hooks/useHistorySync";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    accent: COLORS.accent,
  },
};

export default function App() {
  const [tab, setTab] = useState("home");
  // null | "signIn" | "signUp" — an explicit flow opened from the home card.
  const [overlay, setOverlay] = useState(null);

  const { history, addEntry, clearHistory, replaceHistory, storageBlocked } = useHistory();
  const { user, token, ready, signIn, signUp, signOut, clearSession } = useAuth();

  useHistorySync({ token, history, replaceHistory, storageBlocked, onUnauthorized: clearSession });

  const goSignIn = useCallback(() => setOverlay("signIn"), []);
  const goSignUp = useCallback(() => setOverlay("signUp"), []);

  const handleClear = useCallback(async () => {
    await clearHistory();
    await deleteServerHistory(token);
  }, [clearHistory, token]);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Explicit overlay wins; otherwise the history tab is gated behind sign-in.
  const showingAuth = overlay !== null || (tab === "history" && !user);
  const isGate = overlay === null && tab === "history" && !user;

  const authSuccess = useCallback(() => {
    setOverlay(null);
    if (isGate) setTab("history");
  }, [isGate]);

  const authBack = useCallback(() => {
    if (overlay !== null) setOverlay(null);
    else setTab("home");
  }, [overlay]);

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <View style={styles.root}>
          {showingAuth ? (
            overlay === "signUp" ? (
              <SignUpScreen
                signUp={signUp}
                onBack={authBack}
                onSuccess={authSuccess}
                onGoToSignIn={goSignIn}
              />
            ) : (
              <SignInScreen
                signIn={signIn}
                gate={isGate}
                onBack={authBack}
                onSuccess={authSuccess}
                onGoToSignUp={goSignUp}
              />
            )
          ) : (
            <View style={styles.screen}>
              {tab === "home" && (
                <HomeScreen
                  onScan={() => setTab("diagnose")}
                  user={user}
                  onSignIn={goSignIn}
                  onSignOut={signOut}
                />
              )}
              {tab === "diagnose" && <DiagnoseScreen addEntry={addEntry} />}
              {tab === "history" && (
                <HistoryScreen history={history} onClear={handleClear} />
              )}
              {tab === "location" && <LocationScreen />}
              {tab === "about" && <AboutScreen />}
            </View>
          )}
          {!showingAuth && <BottomNav active={tab} onChange={setTab} />}
        </View>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.page },
  screen: { flex: 1 },
  boot: {
    flex: 1,
    backgroundColor: COLORS.page,
    alignItems: "center",
    justifyContent: "center",
  },
});
```

- [ ] **Step 2: Commit**

```bash
cd /Users/admin/Desktop/PotatoDoc && git add mobile/App.js && git commit -m "Gate history behind sign-in and add auth overlay navigation"
```

---

### Task 14: Home card: sign-in + account/sign-out

**Files:**
- Modify: `mobile/src/screens/HomeScreen.js:32` (signature), `mobile/src/screens/HomeScreen.js:89-96` (card)

**Interfaces:**
- Consumes: `user`, `onSignIn`, `onSignOut` from `App.js`.

- [ ] **Step 1: Update the component signature at line 32**

Replace:

```jsx
export default function HomeScreen({ onScan }) {
```

With:

```jsx
export default function HomeScreen({ onScan, user, onSignIn, onSignOut }) {
```

- [ ] **Step 2: Replace the card block (lines 89-96)**

Replace:

```jsx
        <View style={s.signinCard}>
          <Text style={s.signinText}>
            Sign in to save your diagnosis history and track your crops over time.
          </Text>
          <Pressable style={s.signinBtn}>
            <Text style={s.signinBtnText}>Sign In</Text>
          </Pressable>
        </View>
```

With:

```jsx
        {user ? (
          <View style={s.signinCard}>
            <Text style={s.signinText}>
              Signed in as {user.name}. Your history syncs to this account.
            </Text>
            <Text style={s.signinMeta}>{user.contact}</Text>
            <Pressable style={s.signinBtn} onPress={onSignOut}>
              <Text style={s.signinBtnText}>Sign out</Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.signinCard}>
            <Text style={s.signinText}>
              Sign in to save your diagnosis history and track your crops over time.
            </Text>
            <Pressable style={s.signinBtn} onPress={onSignIn}>
              <Text style={s.signinBtnText}>Sign In</Text>
            </Pressable>
          </View>
        )}
```

- [ ] **Step 3: Add the `signinMeta` style**

In the `StyleSheet.create` for `HomeScreen`, next to `signinText`:

```js
  signinMeta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: COLORS.ink,
    marginTop: 4,
    textAlign: "center",
  },
```

- [ ] **Step 4: Commit**

```bash
cd /Users/admin/Desktop/PotatoDoc && git add mobile/src/screens/HomeScreen.js && git commit -m "Wire home sign-in card and signed-in sign-out state"
```

---

### Task 15: Verification

**Files:**
- Create: `backend-standalone/PotatoDoc-Backend-auth.patch` (handover artifact)

**Interfaces:**
- Consumes: every prior task.

- [ ] **Step 1: Backend unit suite**

```bash
cd /Users/admin/Desktop/PotatoDoc/backend-standalone && python3 -m unittest discover -p "test_*.py" -v
```

Expected: `Ran 24 tests` / `OK`

- [ ] **Step 2: Mobile pure-function suite**

```bash
cd /Users/admin/Desktop/PotatoDoc/mobile && node --experimental-default-type=module --test tests/historyMerge.test.js
```

Expected: `# pass 8`, `# fail 0`

- [ ] **Step 3: End-to-end smoke against a live server**

```bash
cd /Users/admin/Desktop/PotatoDoc/backend-standalone && chmod +x scripts/auth_smoke.sh
python3 -m uvicorn app:app --host 127.0.0.1 --port 8000 > /tmp/pd-uvicorn.log 2>&1 &
sleep 8
scripts/auth_smoke.sh
kill %1
```

Expected: `All smoke checks passed.`

- [ ] **Step 4: Bundle the mobile app to prove it compiles**

```bash
cd /Users/admin/Desktop/PotatoDoc/mobile && npx expo export --platform android --output-dir /tmp/pd-export
```

Expected: `Exported` with no `Unable to resolve` / syntax errors.

- [ ] **Step 5: Produce a patch for the backend repo**

```bash
cd /Users/admin/Desktop/PotatoDoc/backend-standalone && git add -A && git diff --cached HEAD > ../PotatoDoc-Backend-auth.patch && git reset
wc -l ../PotatoDoc-Backend-auth.patch
```

Expected: non-zero line count; the file lets the user apply the same changes on their PC with `git apply PotatoDoc-Backend-auth.patch`.

- [ ] **Step 6: Commit the patch into the monorepo**

```bash
cd /Users/admin/Desktop/PotatoDoc && git add PotatoDoc-Backend-auth.patch docs/superpowers/specs/2026-10-01-farmer-auth-design.md && git commit -m "Add farmer auth implementation and backend handover patch"
```
