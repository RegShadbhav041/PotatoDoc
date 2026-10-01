# Superadmin Portal Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire every existing superadmin backend endpoint into the static panel (overview dashboard, farmer drill-down, models tab), remove mockup seed data, and verify every flow live.

**Architecture:** Keep the zero-dependency plain-JS panel served by FastAPI at `/admin`. UI reads four existing endpoints (`/admin/overview`, `/admin/users`, `/admin/users/{id}` + `/{id}/history`, `/admin/models`); one backend line-fix for the weights-dir default. Views follow the existing `navigate()` + `renderX()` pattern with the shared `api()` fetch wrapper.

**Tech Stack:** Vanilla ES2019 (localStorage token, delegated events), FastAPI + sqlite3, unittest, node `--check` + `@babel/parser` for syntax gates.

## Global Constraints

- No new dependencies (no frameworks, no chart libs — bars are CSS).
- Frozen mobile API contract: `/ping`, `/models`, `/predict`, `/gradcam`, `/auth/*`, `/history` unchanged; admin routes only.
- Backend tests: `python3 -m unittest discover -p "test_*.py"` in `backend-standalone/` must stay green (60 → 61 after Task 1).
- Panel syntax gates: `node --check static/admin/app.js` and babel parse of all `mobile/` + panel files must pass.
- Server for manual verification runs at `http://127.0.0.1:8010` (superadmin `admin@potatodoc.app` / `SuperAdmin#2026`); restart after any backend change: `kill <pid>; POTATO_SUPERADMIN_CONTACT=admin@potatodoc.app POTATO_SUPERADMIN_PASSWORD='SuperAdmin#2026' nohup python3 -m uvicorn app:app --host 127.0.0.1 --port 8010 > /tmp/potatodoc-admin.log 2>&1 &`
- All work in `backend-standalone/` (nested git repo, branch `master`).

---

### Task 1: Backend weights-dir default fix

**Files:**
- Modify: `backend-standalone/admin.py:215-216` (`_weights_dir`)
- Test: `backend-standalone/test_admin.py` (append new class)

**Interfaces:**
- Consumes: `admin._weights_dir()` — no args, returns `pathlib.Path`.
- Produces: same function now defaults to `outputs_combined` when `POTATO_WEIGHTS_DIR` is unset; test class `WeightsDirDefaultTest` guards it. Later tasks unaffected (UI only reads the endpoint response).

- [ ] **Step 1: Write the failing test**

Append to `backend-standalone/test_admin.py`:

```python
class WeightsDirDefaultTest(unittest.TestCase):
    def test_default_weights_dir_is_outputs_combined(self):
        import os
        from admin import _weights_dir

        old = os.environ.pop("POTATO_WEIGHTS_DIR", None)
        try:
            self.assertEqual(_weights_dir().name, "outputs_combined")
        finally:
            if old is not None:
                os.environ["POTATO_WEIGHTS_DIR"] = old
```

- [ ] **Step 2: Run the test, expect failure**

Run: `cd /Users/admin/Desktop/PotatoDoc/backend-standalone && python3 -m unittest test_admin.WeightsDirDefaultTest -v`
Expected: FAIL — `AssertionError: 'outputs_image' != 'outputs_combined'`

- [ ] **Step 3: Fix the default**

In `admin.py`, change:

```python
def _weights_dir():
    return Path(os.environ.get("POTATO_WEIGHTS_DIR", str(_base_dir() / "outputs_image")))
```

to:

```python
def _weights_dir():
    return Path(os.environ.get("POTATO_WEIGHTS_DIR", str(_base_dir() / "outputs_combined")))
```

- [ ] **Step 4: Full suite green**

Run: `python3 -m unittest discover -p "test_*.py"`
Expected: `Ran 61 tests` / `OK`

- [ ] **Step 5: Commit**

```bash
git add admin.py test_admin.py
git commit -m "Default admin weights dir to outputs_combined"
```

---

### Task 2: Dashboard — overview endpoint wiring

**Files:**
- Modify: `backend-standalone/static/admin/index.html` (section `view-dashboard`)
- Modify: `backend-standalone/static/admin/app.js` (replace `renderStats`, add `renderBars`, trend labels)
- Modify: `backend-standalone/static/admin/style.css` (append bar/chip styles)

**Interfaces:**
- Consumes: `GET /admin/overview` → `{totals:{users,sessions,history_items,notices_published,notices_draft}, trends:{new_users_7d,new_diagnoses_7d,sessions_24h,diagnoses_24h}, class_distribution:{k:v}, model_usage:{k:v}, recent_users:[{id,name,contact,role,created_at}], recent_diagnoses:[{user,class,confidence,model,at}]}`; helpers `api()`, `esc()`, `fmtDate()`, `navigate()`.
- Produces: `renderOverview()` (replaces `renderStats` everywhere it is called), `renderBars(el, tally)` — reused by Task 3; `#stats` keeps id; new element ids `#trends`, `#class-bars`, `#model-bars`, `#recent-users`, `#recent-diagnoses`; row click emits `data-user="<id>"` handled in Task 3 (here: attach a temporary listener that calls `openUserDetail` — defined in Task 3; until then guard with `typeof openUserDetail === "function"`).

- [ ] **Step 1: Replace dashboard markup**

In `index.html`, replace the whole `<section id="view-dashboard" ...>...</section>` with:

```html
      <section id="view-dashboard" class="view">
        <div id="stats" class="stats"></div>
        <div id="trends" class="trend-chips"></div>
        <div class="grid-2">
          <div class="panel">
            <div class="panel-head"><h2>Disease class mix</h2></div>
            <div id="class-bars" class="bars"></div>
          </div>
          <div class="panel">
            <div class="panel-head"><h2>Model usage</h2></div>
            <div id="model-bars" class="bars"></div>
          </div>
        </div>
        <div class="grid-2">
          <div class="panel">
            <div class="panel-head"><h2>Newest farmers</h2></div>
            <div id="recent-users" class="list"></div>
          </div>
          <div class="panel">
            <div class="panel-head"><h2>Recent diagnoses</h2></div>
            <div id="recent-diagnoses" class="list"></div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <h2>Quick actions</h2>
          </div>
          <div class="quick">
            <button class="btn btn-primary" data-nav="notices">Write a notice</button>
            <button class="btn btn-outline" data-nav="users">Manage farmers</button>
            <button class="btn btn-outline" id="refresh-stats">Refresh dashboard</button>
          </div>
          <p class="muted" id="stats-updated"></p>
        </div>
      </section>
```

- [ ] **Step 2: Rewire app.js dashboard rendering**

In `app.js`, replace the whole `STAT_LABELS` + `renderStats` block with:

```js
  var STAT_LABELS = {
    users: "Farmer accounts",
    sessions: "Active sessions",
    history_items: "Diagnoses recorded",
    notices_published: "Published notices",
    notices_draft: "Draft notices",
  };

  var TREND_LABELS = {
    new_users_7d: "New farmers (7d)",
    new_diagnoses_7d: "Diagnoses (7d)",
    sessions_24h: "Sessions (24h)",
    diagnoses_24h: "Diagnoses (24h)",
  };

  /** Horizontal bars from a {label: count} tally; width proportional to max. */
  function renderBars(el, tally) {
    var keys = Object.keys(tally || {});
    if (!keys.length) {
      el.innerHTML = '<p class="muted">No data yet.</p>';
      return;
    }
    var max = Math.max.apply(null, keys.map(function (k) { return tally[k]; }));
    el.innerHTML = keys.map(function (k) {
      var pct = max > 0 ? Math.max(2, Math.round((tally[k] / max) * 100)) : 0;
      return '<div class="bar-row">' +
        '<span class="bar-label">' + esc(k) + "</span>" +
        '<span class="bar-track"><span class="bar-fill" style="width:' + pct + '%"></span></span>' +
        '<span class="bar-count">' + esc(tally[k]) + "</span></div>";
    }).join("");
  }

  function renderList(el, rows, emptyHtml) {
    if (!rows || !rows.length) { el.innerHTML = emptyHtml; return; }
    el.innerHTML = rows;
  }

  async function renderOverview() {
    var stats = $("#stats");
    try {
      var o = await api("/admin/overview");
      stats.innerHTML = Object.keys(STAT_LABELS).map(function (key) {
        return '<div class="stat"><div class="stat-value">' +
          esc(o.totals[key]) + '</div><div class="stat-label">' +
          esc(STAT_LABELS[key]) + "</div></div>";
      }).join("");
      $("#trends").innerHTML = Object.keys(TREND_LABELS).map(function (key) {
        return '<span class="trend"><b>' + esc(o.trends[key]) + "</b> " +
          esc(TREND_LABELS[key]) + "</span>";
      }).join("");
      renderBars($("#class-bars"), o.class_distribution);
      renderBars($("#model-bars"), o.model_usage);
      renderList($("#recent-users"),
        (o.recent_users || []).map(function (u) {
          return '<button class="list-row" data-user="' + u.id + '">' +
            "<span><b>" + esc(u.name || u.contact) + "</b>" +
            '<small class="muted">' + esc(u.contact) + "</small></span>" +
            '<span class="muted">' + esc(fmtDate(u.created_at)) + "</span></button>";
        }).join(""),
        '<p class="muted">No farmers yet.</p>');
      renderList($("#recent-diagnoses"),
        (o.recent_diagnoses || []).map(function (d) {
          var conf = d.confidence == null ? "" :
            " · " + (d.confidence <= 1 ? Math.round(d.confidence * 100) : Math.round(d.confidence)) + "%";
          return '<div class="list-row"><span><b>' + esc(d.class || "—") + "</b>" +
            '<small class="muted">' + esc(d.user || "—") + " · " + esc(d.model || "—") + esc(conf) + "</small></span>" +
            '<span class="muted">' + esc(fmtDate(d.at)) + "</span></div>";
        }).join(""),
        '<p class="muted">No diagnoses yet.</p>');
      $("#stats-updated").textContent = "Updated " + new Date().toLocaleTimeString();
    } catch (err) {
      stats.innerHTML = '<p class="muted">' + esc(err.message) + "</p>";
    }
  }
```

Then apply these renames/wiring:

- `showApp()`: change `renderStats();` → `renderOverview();`
- `navigate(view)`: change `if (view === "dashboard") renderStats();` → `if (view === "dashboard") renderOverview();`
- `saveNotice()` and `deleteNotice()`: change both `renderStats();` calls → `renderOverview();`
- `boot()`: change `$("#refresh-stats").addEventListener("click", renderStats);` → `renderOverview`

- [ ] **Step 3: Recent-farmer click → drill-down (guarded until Task 3)**

In `boot()`, add:

```js
    $("#recent-users").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-user]");
      if (btn && typeof openUserDetail === "function") openUserDetail(Number(btn.dataset.user));
    });
```

- [ ] **Step 4: Append CSS**

Append to `static/admin/style.css`:

```css
/* ---- overview: trends + bars + lists ---- */
.trend-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 16px; }
.trend {
  background: var(--card, #fff); border: 1px solid var(--line, #e5e7eb);
  border-radius: 10px; padding: 8px 12px; font-size: 13px; color: var(--muted, #6b7280);
}
.trend b { color: var(--text, #111827); font-size: 15px; margin-right: 4px; }

.bars { display: flex; flex-direction: column; gap: 8px; }
.bar-row { display: grid; grid-template-columns: 140px 1fr 44px; gap: 8px; align-items: center; font-size: 13px; }
.bar-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar-track { background: var(--line, #e5e7eb); border-radius: 6px; height: 10px; overflow: hidden; }
.bar-fill { display: block; height: 100%; background: var(--primary, #16a34a); border-radius: 6px; }
.bar-count { text-align: right; font-variant-numeric: tabular-nums; color: var(--muted, #6b7280); }

.list { display: flex; flex-direction: column; }
.list-row {
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
  padding: 10px 4px; border: 0; border-bottom: 1px solid var(--line, #e5e7eb);
  background: none; text-align: left; font: inherit; color: inherit; width: 100%;
}
.list-row:last-child { border-bottom: 0; }
button.list-row { cursor: pointer; }
button.list-row:hover { background: var(--hover, #f9fafb); }
.list-row small { display: block; }
```

(If `style.css` already defines `--primary`/`--line` custom properties, reuse them; otherwise the fallbacks apply.)

- [ ] **Step 5: Syntax gate + API smoke**

```bash
node --check static/admin/app.js && echo JS-OK
TOKEN=$(curl -s -X POST localhost:8010/auth/login -H 'Content-Type: application/json' \
  -d '{"contact":"admin@potatodoc.app","password":"SuperAdmin#2026"}' \
  | python3 -c "import json,sys;print(json.load(sys.stdin)['token'])")
curl -s localhost:8010/admin/overview -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import json,sys;d=json.load(sys.stdin);assert {'totals','trends','class_distribution','model_usage','recent_users','recent_diagnoses'}<=set(d);print('overview OK')"
```

Expected: `JS-OK`, `overview OK`

- [ ] **Step 6: Commit**

```bash
git add static/admin/index.html static/admin/app.js static/admin/style.css
git commit -m "Dashboard: wire overview endpoint with trends, bars and recent lists"
```

---

### Task 3: Users — search, richer columns, drill-down view

**Files:**
- Modify: `backend-standalone/static/admin/index.html` (search input, users table header, new `view-user-detail` section)
- Modify: `backend-standalone/static/admin/app.js` (`renderUsers` filter+columns, `openUserDetail`, navigation wiring)

**Interfaces:**
- Consumes: `GET /admin/users` → items with `history_count`, `last_diagnosis_at`; `GET /admin/users/{id}` → `{id,contact,name,role,created_at,history_count,session_count,notices_read,last_session_at,last_diagnosis_at,class_distribution,model_usage}`; `GET /admin/users/{id}/history` → `{items:[{class,confidence,model,is_unknown,timestamp,created_at}],count}`; Task 2's `renderBars`, `esc`, `fmtDate`, `api`, `navigate`.
- Produces: `openUserDetail(userId: number): Promise<void>` (also referenced by Task 2's guarded listener); `state.search: string`; `TITLES["user-detail"] = "Farmer detail"`; element ids `#users-search`, `#ud-name`, `#ud-meta`, `#ud-cards`, `#ud-class-bars`, `#ud-model-bars`, `#ud-history-body`, `#ud-back`.

- [ ] **Step 1: Users header — search input**

In `index.html`, inside the Users panel head (`<h2>Farmer accounts</h2>` + refresh button), add between them:

```html
            <input id="users-search" class="search" type="search"
                   placeholder="Search name or contact…" autocomplete="off">
```

- [ ] **Step 2: Users table — new columns**

Replace the `<thead>` row of the users table with:

```html
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Diagnoses</th>
                  <th>Last diagnosis</th>
                  <th>Joined</th>
                  <th class="right">Actions</th>
                </tr>
```

Update every `colspan="5"` inside `#users-body` (initial HTML + JS empty/error rows) to `colspan="7"`.

- [ ] **Step 3: Add the drill-down section**

After the users `</section>` in `index.html`, insert:

```html
      <!-- ---- User detail ---- -->
      <section id="view-user-detail" class="view hidden">
        <div class="panel">
          <div class="panel-head">
            <h2 id="ud-name">Farmer</h2>
            <button class="btn btn-outline btn-sm" id="ud-back">← Back to farmers</button>
          </div>
          <p id="ud-meta" class="muted"></p>
          <div id="ud-cards" class="stats"></div>
        </div>
        <div class="grid-2">
          <div class="panel">
            <div class="panel-head"><h2>Class mix</h2></div>
            <div id="ud-class-bars" class="bars"></div>
          </div>
          <div class="panel">
            <div class="panel-head"><h2>Models used</h2></div>
            <div id="ud-model-bars" class="bars"></div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><h2>Diagnoses</h2></div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Class</th><th>Confidence</th><th>Model</th><th>Unknown</th><th>When</th></tr>
              </thead>
              <tbody id="ud-history-body">
                <tr><td colspan="5" class="muted">Loading…</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
```

- [ ] **Step 4: renderUsers — search filter + new columns**

Replace `renderUsers` in `app.js` with:

```js
  async function renderUsers() {
    var body = $("#users-body");
    try {
      var data = await api("/admin/users");
      var q = state.search.trim().toLowerCase();
      var items = data.items;
      if (q) {
        items = items.filter(function (u) {
          return String(u.name || "").toLowerCase().indexOf(q) !== -1 ||
            String(u.contact || "").toLowerCase().indexOf(q) !== -1;
        });
      }
      if (!items.length) {
        body.innerHTML = '<tr><td colspan="7" class="muted">' +
          (q ? "No farmers match “" + esc(state.search) + "”." : "No accounts yet.") + "</td></tr>";
        return;
      }
      body.innerHTML = items.map(function (u) {
        var isSelf = state.user && u.id === state.user.id;
        var next = u.role === "superadmin" ? "user" : "superadmin";
        var label = u.role === "superadmin" ? "Make farmer" : "Make superadmin";
        return "<tr>" +
          '<td><button class="linklike" data-user="' + u.id + '">' + esc(u.name) + "</button>" +
          (isSelf ? ' <span class="muted">(you)</span>' : "") + "</td>" +
          "<td>" + esc(u.contact) + "</td>" +
          '<td><span class="badge badge-' + esc(u.role) + '">' + esc(u.role) + "</span></td>" +
          "<td>" + esc(u.history_count) + "</td>" +
          "<td>" + esc(fmtDate(u.last_diagnosis_at) || "—") + "</td>" +
          "<td>" + esc(fmtDate(u.created_at)) + "</td>" +
          '<td class="right"><div class="row-actions">' +
          '<button class="btn btn-outline btn-sm" data-role-id="' + u.id +
          '" data-role="' + next + '">' + label + "</button>" +
          "</div></td></tr>";
      }).join("");
    } catch (err) {
      body.innerHTML = '<tr><td colspan="7" class="muted">' + esc(err.message) + "</td></tr>";
    }
  }
```

- [ ] **Step 5: openUserDetail + state + titles**

Add `search: ""` to `state`. Add to `TITLES`:

```js
  var TITLES = { dashboard: "Dashboard", users: "Users", notices: "Notices", models: "Models", "user-detail": "Farmer detail" };
```

Add after `changeRole`:

```js
  async function openUserDetail(userId) {
    state.userDetailId = userId;
    navigate("user-detail");
    $("#ud-history-body").innerHTML = '<tr><td colspan="5" class="muted">Loading…</td></tr>';
    try {
      var u = await api("/admin/users/" + userId);
      $("#ud-name").textContent = u.name || u.contact;
      $("#ud-meta").innerHTML = esc(u.contact) + " · " +
        '<span class="badge badge-' + esc(u.role) + '">' + esc(u.role) + "</span>" +
        " · joined " + esc(fmtDate(u.created_at));
      $("#ud-cards").innerHTML = [
        ["Diagnoses", u.history_count],
        ["Sessions", u.session_count],
        ["Notices read", u.notices_read],
        ["Last session", fmtDate(u.last_session_at) || "—"],
        ["Last diagnosis", fmtDate(u.last_diagnosis_at) || "—"],
      ].map(function (c) {
        return '<div class="stat"><div class="stat-value">' + esc(c[1]) +
          '</div><div class="stat-label">' + esc(c[0]) + "</div></div>";
      }).join("");
      renderBars($("#ud-class-bars"), u.class_distribution);
      renderBars($("#ud-model-bars"), u.model_usage);
    } catch (err) {
      toast(err.message, true);
      navigate("users");
      return;
    }
    try {
      var h = await api("/admin/users/" + userId + "/history");
      var body = $("#ud-history-body");
      if (!h.items.length) {
        body.innerHTML = '<tr><td colspan="5" class="muted">No diagnoses yet.</td></tr>';
        return;
      }
      body.innerHTML = h.items.map(function (it) {
        var conf = "—";
        if (it.confidence != null) {
          var pct = it.confidence <= 1 ? it.confidence * 100 : it.confidence;
          conf = Math.round(pct) + "%";
        }
        return "<tr><td>" + esc(it.class || "—") + "</td><td>" + esc(conf) +
          "</td><td>" + esc(it.model || "—") + "</td><td>" +
          (it.is_unknown ? "yes" : "no") + "</td><td>" +
          esc(fmtDate(it.timestamp || it.created_at)) + "</td></tr>";
      }).join("");
    } catch (err) {
      $("#ud-history-body").innerHTML =
        '<tr><td colspan="5" class="muted">' + esc(err.message) + "</td></tr>";
    }
  }
```

- [ ] **Step 6: Wiring**

In `boot()` add:

```js
    $("#users-search").addEventListener("input", function (e) {
      state.search = e.target.value;
      renderUsers();
    });
    $("#ud-back").addEventListener("click", function () { navigate("users"); });
```

Extend the existing `#users-body` click handler — insert **before** the `data-role-id` branch:

```js
      var farmer = e.target.closest("[data-user]");
      if (farmer) { openUserDetail(Number(farmer.dataset.user)); return; }
```

In `navigate()`, change the users line to also preserve search:

```js
    if (view === "users") renderUsers();
```

(no-op change — search input keeps its DOM value across hidden/shown views; `state.search` persists.)

- [ ] **Step 7: CSS for search + link-like buttons**

Append to `style.css`:

```css
.search {
  flex: 1; min-width: 180px; max-width: 280px; margin-left: auto;
  padding: 8px 12px; border: 1px solid var(--line, #e5e7eb); border-radius: 8px;
  background: var(--bg, #fff); color: inherit; font: inherit; font-size: 14px;
}
.panel-head { display: flex; align-items: center; gap: 12px; }
.linklike {
  border: 0; background: none; padding: 0; font: inherit; cursor: pointer;
  color: var(--primary, #16a34a); text-decoration: underline;
}
```

- [ ] **Step 8: Syntax gate + commit**

```bash
node --check static/admin/app.js && echo JS-OK
git add static/admin/index.html static/admin/app.js static/admin/style.css
git commit -m "Users: search, richer columns and farmer drill-down view"
```

Expected: `JS-OK`

---

### Task 4: Models tab

**Files:**
- Modify: `backend-standalone/static/admin/index.html` (nav item + `view-models` section)
- Modify: `backend-standalone/static/admin/app.js` (`renderModels`, navigate entry, boot wiring)
- Modify: `backend-standalone/static/admin/style.css` (callout + code block)

**Interfaces:**
- Consumes: `GET /admin/models` → `{default, weights_dir, classes:[], train_config:{epochs,batch,img,seed,trained_at}, ensemble:{}, thresholds:{}, items:[{id,name,available,size_mb,modified_at,accuracy,f1_macro}]}`; `api/esc/fmtDate/navigate`.
- Produces: nav item `data-nav="models"`; `renderModels()`; ids `#models-callout`, `#models-body`, `#models-train`, `#models-classes`, `#models-extra`, `#models-refresh`.

- [ ] **Step 1: Nav item**

After the Notices button in `.nav`:

```html
        <button class="nav-item" data-nav="models">Models</button>
```

- [ ] **Step 2: Models section**

After the notices `</section>` (before `</main>`):

```html
      <!-- ---- Models ---- -->
      <section id="view-models" class="view hidden">
        <div class="panel">
          <div class="panel-head">
            <h2>Model inventory</h2>
            <button class="btn btn-outline btn-sm" id="models-refresh">Refresh</button>
          </div>
          <div id="models-callout" class="callout"></div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Model</th><th>Weights</th><th>Size</th>
                  <th>Modified</th><th>Accuracy</th><th>F1</th>
                </tr>
              </thead>
              <tbody id="models-body">
                <tr><td colspan="6" class="muted">Loading…</td></tr>
              </tbody>
            </table>
          </div>
          <p class="muted" id="models-train"></p>
        </div>
        <div class="grid-2">
          <div class="panel">
            <div class="panel-head"><h2>Classes</h2></div>
            <div id="models-classes" class="cat-wrap"></div>
          </div>
          <div class="panel">
            <div class="panel-head"><h2>Ensemble + calibration</h2></div>
            <pre id="models-extra" class="code-block"></pre>
          </div>
        </div>
      </section>
```

- [ ] **Step 3: renderModels + navigate entry**

Add `renderModels` to app.js (after `deleteNotice`):

```js
  /* ---------------- models ---------------- */

  async function renderModels() {
    var body = $("#models-body");
    try {
      var m = await api("/admin/models");
      var ready = m.items.filter(function (i) { return i.available; }).length;
      $("#models-callout").innerHTML =
        "<b>Default:</b> " + esc(m.default) +
        ' <span class="muted">· ' + ready + "/" + m.items.length +
        " weight sets present · " + esc(m.weights_dir) + "</span>";
      if (!m.items.length) {
        body.innerHTML = '<tr><td colspan="6" class="muted">No models configured.</td></tr>';
      } else {
        body.innerHTML = m.items.map(function (it) {
          return "<tr><td>" + esc(it.name) + "</td>" +
            "<td>" + (it.available ? "✓ ready" : "✗ missing") + "</td>" +
            "<td>" + esc(it.size_mb) + " MB</td>" +
            "<td>" + esc(fmtDate(it.modified_at) || "—") + "</td>" +
            "<td>" + (it.accuracy == null ? "—" : esc(it.accuracy)) + "</td>" +
            "<td>" + (it.f1_macro == null ? "—" : esc(it.f1_macro)) + "</td></tr>";
        }).join("");
      }
      var t = m.train_config || {};
      $("#models-train").textContent =
        "Trained " + (fmtDate(t.trained_at) || "—") +
        " · epochs " + t.epochs + " · batch " + t.batch +
        " · img " + t.img + " · seed " + t.seed;
      $("#models-classes").innerHTML = (m.classes || []).length
        ? m.classes.map(function (c) { return '<span class="cat cat-update">' + esc(c) + "</span>"; }).join("")
        : '<p class="muted">No labels loaded.</p>';
      $("#models-extra").textContent = JSON.stringify(
        { ensemble: m.ensemble || {}, thresholds: m.thresholds || {} }, null, 2);
    } catch (err) {
      body.innerHTML = '<tr><td colspan="6" class="muted">' + esc(err.message) + "</td></tr>";
    }
  }
```

In `navigate()`, add: `if (view === "models") renderModels();`

In `boot()`, add:

```js
    $("#models-refresh").addEventListener("click", renderModels);
```

- [ ] **Step 4: CSS**

Append to `style.css`:

```css
.callout {
  background: var(--hover, #f9fafb); border: 1px solid var(--line, #e5e7eb);
  border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; font-size: 14px;
}
.code-block {
  background: var(--hover, #f9fafb); border: 1px solid var(--line, #e5e7eb);
  border-radius: 10px; padding: 12px; font-size: 12px; overflow: auto; max-height: 260px;
  white-space: pre-wrap; word-break: break-word; margin: 0;
}
.cat-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
```

- [ ] **Step 5: Syntax gate + API smoke + commit**

```bash
node --check static/admin/app.js && echo JS-OK
TOKEN=$(curl -s -X POST localhost:8010/auth/login -H 'Content-Type: application/json' \
  -d '{"contact":"admin@potatodoc.app","password":"SuperAdmin#2026"}' \
  | python3 -c "import json,sys;print(json.load(sys.stdin)['token'])")
curl -s localhost:8010/admin/models -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import json,sys;d=json.load(sys.stdin);assert d['default']=='ensemble' and d['items'] and d['classes'];print('models OK,',len(d['items']),'items,',len(d['classes']),'classes')"
git add static/admin/index.html static/admin/app.js static/admin/style.css
git commit -m "Add Models tab from /admin/models"
```

Expected: `JS-OK`, `models OK, 4 items, 38 classes` (class count per labels.json; assert only non-empty if it differs).

---

### Task 5: Remove mockup seed notices

**Files:**
- Modify: data only — `backend-standalone/potatodoc.db` (dev DB, gitignored)

**Interfaces:**
- Consumes: `notices`, `notice_reads` tables.
- Produces: empty notices list on portal + mobile News screen; portal "No notices yet" state.

- [ ] **Step 1: Delete seeded rows**

```bash
cd /Users/admin/Desktop/PotatoDoc/backend-standalone
sqlite3 potatodoc.db "DELETE FROM notice_reads; DELETE FROM notices; SELECT COUNT(*) FROM notices;"
```

Expected: `0`

- [ ] **Step 2: Verify via API**

```bash
TOKEN=$(curl -s -X POST localhost:8010/auth/login -H 'Content-Type: application/json' \
  -d '{"contact":"admin@potatodoc.app","password":"SuperAdmin#2026"}' \
  | python3 -c "import json,sys;print(json.load(sys.stdin)['token'])")
curl -s "localhost:8010/admin/notices" -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import json,sys;d=json.load(sys.stdin);assert d['items']==[],d;print('notices empty OK')"
curl -s "localhost:8010/notices" | python3 -c "import json,sys;d=json.load(sys.stdin);assert d['items']==[],d;print('public feed empty OK')"
```

Expected: `notices empty OK`, `public feed empty OK`

- [ ] **Step 3: No commit needed (DB is gitignored)** — note completion in Task 6 commit message.

---

### Task 6: Full verification + push

**Files:** none (verification only)

- [ ] **Step 1: Backend suite**

Run: `cd /Users/admin/Desktop/PotatoDoc/backend-standalone && python3 -m unittest discover -p "test_*.py"`
Expected: `Ran 61 tests` / `OK`

- [ ] **Step 2: Panel syntax**

```bash
cd /Users/admin/Desktop/PotatoDoc/backend-standalone
node --check static/admin/app.js && echo JS-OK
node -e "const b=require('/Users/admin/Desktop/PotatoDoc/mobile/node_modules/@babel/parser');const fs=require('fs');b.parse(fs.readFileSync('static/admin/app.js','utf8'),{sourceType:'module'});console.log('PARSE-OK')"
```

Expected: `JS-OK`, `PARSE-OK`

- [ ] **Step 3: Restart server with fresh code and run endpoint smoke**

```bash
kill $(lsof -t -i:8010) 2>/dev/null; sleep 1
cd /Users/admin/Desktop/PotatoDoc/backend-standalone
POTATO_SUPERADMIN_CONTACT=admin@potatodoc.app POTATO_SUPERADMIN_PASSWORD='SuperAdmin#2026' \
nohup python3 -m uvicorn app:app --host 127.0.0.1 --port 8010 > /tmp/potatodoc-admin.log 2>&1 &
sleep 8
TOKEN=$(curl -s -X POST localhost:8010/auth/login -H 'Content-Type: application/json' \
  -d '{"contact":"admin@potatodoc.app","password":"SuperAdmin#2026"}' \
  | python3 -c "import json,sys;print(json.load(sys.stdin)['token'])")
for ep in overview models users; do
  curl -s "localhost:8010/admin/$ep" -H "Authorization: Bearer $TOKEN" -o /dev/null -w "$ep %{http_code}\n"
done
curl -s "localhost:8010/admin/" -o /dev/null -w "panel %{http_code}\n"
UID1=$(curl -s "localhost:8010/admin/users" -H "Authorization: Bearer $TOKEN" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['items'][0]['id'] if d['items'] else '')")
if [ -n "$UID1" ]; then
  curl -s "localhost:8010/admin/users/$UID1" -H "Authorization: Bearer $TOKEN" -o /dev/null -w "user-detail %{http_code}\n"
  curl -s "localhost:8010/admin/users/$UID1/history" -H "Authorization: Bearer $TOKEN" -o /dev/null -w "user-history %{http_code}\n"
fi
```

Expected: `overview 200`, `models 200`, `users 200`, `panel 200`, and (if a user exists) `user-detail 200`, `user-history 200`.

- [ ] **Step 4: Browser flow (Chrome, http://localhost:8010/admin/)**

Manually verify and fix if broken:
1. Login with superadmin credentials → dashboard shows 5 totals, 4 trend chips, bars (empty-state message ok with no data), quick actions.
2. Users → type a partial name in search → list filters; clear → restores.
3. Click a farmer name → drill-down shows cards, bars, diagnoses table; "Back to farmers" returns with search preserved.
4. Role toggle → toast + badge flips (toggle back).
5. Notices → create published notice → appears; edit → saves; delete → gone; refresh after Task 5 → "No notices yet".
6. Models tab → callout, 4 model rows, classes chips, ensemble JSON block.
7. Sign out → login screen; 401 path works (expired token → login).

- [ ] **Step 5: Commit + push both repos**

```bash
cd /Users/admin/Desktop/PotatoDoc/backend-standalone
git add -A && git status --short   # expect clean or only this plan's files
git commit -m "Complete superadmin portal: overview, drill-down, models tab" --allow-empty
GIT_TERMINAL_PROMPT=0 git push origin master
cd /Users/admin/Desktop/PotatoDoc
git add docs/superpowers/plans/2026-10-01-superadmin-portal.md
git commit -m "Add superadmin portal implementation plan"
GIT_TERMINAL_PROMPT=0 git push origin main
```

Expected: both pushes fast-forward; remote tips updated.

---

## Self-Review

1. **Spec coverage:** Dashboard overview (Task 2) ✓, users search/columns/drill-down (Task 3) ✓, models tab (Task 4) ✓, notices cleanup (Task 5) ✓, weights-dir fix (Task 1) ✓, verification incl. 61 tests + Chrome flow (Task 6) ✓, error handling via existing `api()` + toasts (Tasks 2-4 code) ✓.
2. **Placeholders:** none — all steps carry concrete code/commands.
3. **Type consistency:** `openUserDetail(userId)` matches Task 2's guarded call ✓; `renderBars(el, tally)` defined Task 2, reused Task 3 ✓; ids `#stats/#trends/#class-bars/...` match markup ✓; `TITLES["user-detail"]` defined Task 3 before use in `navigate` ✓.
